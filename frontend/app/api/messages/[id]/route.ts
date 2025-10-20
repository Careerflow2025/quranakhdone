/**
 * Individual Message API Endpoints
 * POST /api/messages/:id/reply - Reply to message (creates new message in thread)
 * PATCH /api/messages/:id - Mark message as read
 *
 * Created: 2025-10-20
 * Purpose: Individual message operations for threading and read status
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  validateReplyToMessageRequest,
  canReplyToMessage,
  canMarkAsRead,
} from '@/lib/validators/messages';
import {
  ReplyToMessageResponse,
  MarkReadResponse,
  MessageErrorResponse,
  MessageWithDetails,
  getThreadId,
} from '@/lib/types/messages';

// ============================================================================
// POST /api/messages/:id - Reply To Message (Deprecated - use POST /api/messages with thread_id)
// Note: This endpoint exists for convenience but recommending using main POST endpoint
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Initialize Supabase client with auth
    const supabase = createClient();

    // 2. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<MessageErrorResponse>(
        {
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // 3. Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, school_id, role, display_name, email')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json<MessageErrorResponse>(
        {
          success: false,
          error: 'User profile not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 4. Get original message
    const { data: originalMessage, error: messageError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', params.id)
      .eq('school_id', profile.school_id)
      .single();

    if (messageError || !originalMessage) {
      return NextResponse.json<MessageErrorResponse>(
        {
          success: false,
          error: 'Message not found',
          code: 'MESSAGE_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 5. Check permissions
    if (
      !canReplyToMessage(
        { userId: user.id, userRole: profile.role, schoolId: profile.school_id },
        {
          messageSchoolId: originalMessage.school_id,
          messageSenderId: originalMessage.sender_user_id,
          messageRecipientId: originalMessage.recipient_user_id,
        }
      )
    ) {
      return NextResponse.json<MessageErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to reply to this message',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 6. Parse and validate request body
    const body = await request.json();
    const validation = validateReplyToMessageRequest(body);

    if (!validation.success) {
      return NextResponse.json<MessageErrorResponse>(
        {
          success: false,
          error: validation.error || 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { errors: validation.errors },
        },
        { status: 400 }
      );
    }

    const { body: replyBody, attachments } = validation.data;

    // 7. Determine recipient (reply to sender of original message)
    const recipientId =
      originalMessage.sender_user_id === user.id
        ? originalMessage.recipient_user_id
        : originalMessage.sender_user_id;

    // 8. Get thread ID (root message ID)
    const threadId = getThreadId(originalMessage);

    // 9. Create reply message
    const replyData = {
      school_id: profile.school_id,
      thread_id: threadId,
      sender_user_id: user.id,
      recipient_user_id: recipientId,
      subject: null, // Replies don't have subjects
      body: replyBody,
      read_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdReply, error: createError } = await supabase
      .from('messages')
      .insert(replyData)
      .select('*')
      .single();

    if (createError || !createdReply) {
      console.error('Failed to create reply:', createError);
      return NextResponse.json<MessageErrorResponse>(
        {
          success: false,
          error: 'Failed to send reply',
          code: 'DATABASE_ERROR',
          details: { createError },
        },
        { status: 500 }
      );
    }

    // 10. Create attachments if provided
    if (attachments && attachments.length > 0) {
      const attachmentsData = attachments.map((att) => ({
        message_id: createdReply.id,
        url: att.url,
        mime_type: att.mime_type,
        file_name: att.file_name,
        file_size: att.file_size,
        created_at: new Date().toISOString(),
      }));

      await supabase.from('message_attachments').insert(attachmentsData);
    }

    // 11. Send notification to recipient
    try {
      await supabase.from('notifications').insert({
        school_id: profile.school_id,
        user_id: recipientId,
        channel: 'in_app',
        type: 'message_reply',
        payload: {
          message_id: createdReply.id,
          thread_id: threadId,
          sender_name: profile.display_name || profile.email,
          preview: replyBody.substring(0, 100),
        },
        sent_at: new Date().toISOString(),
      });
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
    }

    // 12. Get recipient details
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('user_id, display_name, email, role')
      .eq('user_id', recipientId)
      .single();

    // 13. Get attachments for response
    const { data: replyAttachments } = await supabase
      .from('message_attachments')
      .select('*')
      .eq('message_id', createdReply.id);

    // 14. Build response
    const replyWithDetails: MessageWithDetails = {
      ...createdReply,
      sender: {
        id: profile.user_id,
        display_name: profile.display_name || profile.email || 'Unknown',
        email: profile.email,
        role: profile.role,
      },
      recipient: recipientProfile
        ? {
            id: recipientProfile.user_id,
            display_name: recipientProfile.display_name || recipientProfile.email,
            email: recipientProfile.email,
            role: recipientProfile.role,
          }
        : ({} as any),
      attachments: replyAttachments || [],
      is_read: false,
    };

    // 15. Return success response
    return NextResponse.json<ReplyToMessageResponse>(
      {
        success: true,
        message: replyWithDetails,
        thread_id: threadId,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/messages/:id:', error);
    return NextResponse.json<MessageErrorResponse>(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: { error: String(error) },
      },
      { status: 500 }
    );
  }
}

// ============================================================================
// PATCH /api/messages/:id - Mark Message as Read
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 1. Initialize Supabase client with auth
    const supabase = createClient();

    // 2. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<MessageErrorResponse>(
        {
          success: false,
          error: 'Unauthorized',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // 3. Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, school_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json<MessageErrorResponse>(
        {
          success: false,
          error: 'User profile not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 4. Get message
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', params.id)
      .eq('school_id', profile.school_id)
      .single();

    if (messageError || !message) {
      return NextResponse.json<MessageErrorResponse>(
        {
          success: false,
          error: 'Message not found',
          code: 'MESSAGE_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 5. Check if already read
    if (message.read_at) {
      return NextResponse.json<MarkReadResponse>(
        {
          success: true,
          message_id: message.id,
          read_at: message.read_at,
          message: 'Message was already marked as read',
        },
        { status: 200 }
      );
    }

    // 6. Check permissions
    if (
      !canMarkAsRead(
        { userId: user.id, userRole: profile.role, schoolId: profile.school_id },
        {
          messageSchoolId: message.school_id,
          messageSenderId: message.sender_user_id,
          messageRecipientId: message.recipient_user_id,
        }
      )
    ) {
      return NextResponse.json<MessageErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to mark this message as read',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 7. Mark as read
    const readAt = new Date().toISOString();
    const { error: updateError } = await supabase
      .from('messages')
      .update({
        read_at: readAt,
        updated_at: readAt,
      })
      .eq('id', params.id);

    if (updateError) {
      console.error('Failed to mark message as read:', updateError);
      return NextResponse.json<MessageErrorResponse>(
        {
          success: false,
          error: 'Failed to mark message as read',
          code: 'DATABASE_ERROR',
          details: { updateError },
        },
        { status: 500 }
      );
    }

    // 8. Return success response
    return NextResponse.json<MarkReadResponse>(
      {
        success: true,
        message_id: params.id,
        read_at: readAt,
        message: 'Message marked as read',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in PATCH /api/messages/:id:', error);
    return NextResponse.json<MessageErrorResponse>(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
        details: { error: String(error) },
      },
      { status: 500 }
    );
  }
}
