/**
 * Message Attachments API Endpoint
 * POST /api/messages/:id/attachments - Add attachments to existing message
 *
 * Created: 2025-10-20
 * Purpose: Allow users to add files to existing messages (images, PDFs, audio)
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { validateAddAttachmentsRequest } from '@/lib/validators/messages';
import {
  AddAttachmentsResponse,
  MessageErrorResponse,
  MessageAttachmentRow,
  MESSAGE_CONSTANTS,
} from '@/lib/types/messages';

// ============================================================================
// POST /api/messages/:id/attachments - Add Attachments
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

    // 4. Get the message to verify it exists and check permissions
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('id, school_id, sender_user_id, recipient_user_id, created_at')
      .eq('id', params.id)
      .eq('school_id', profile.school_id)
      .single();

    if (messageError || !message) {
      return NextResponse.json<MessageErrorResponse>(
        {
          success: false,
          error: 'Message not found',
          code: 'MESSAGE_NOT_FOUND',
          details: { messageError },
        },
        { status: 404 }
      );
    }

    // 5. Check permissions - only sender or admin/owner can add attachments
    const canAddAttachments =
      message.sender_user_id === user.id || ['admin', 'owner'].includes(profile.role);

    if (!canAddAttachments) {
      return NextResponse.json<MessageErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to add attachments to this message',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 6. Parse and validate request body
    const body = await request.json();
    const validation = validateAddAttachmentsRequest(body);

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

    const { attachments } = validation.data;

    // 7. Check current attachment count for this message
    const { data: existingAttachments, error: existingError } = await supabase
      .from('message_attachments')
      .select('id')
      .eq('message_id', params.id);

    if (existingError) {
      console.error('Failed to fetch existing attachments:', existingError);
      return NextResponse.json<MessageErrorResponse>(
        {
          success: false,
          error: 'Failed to check existing attachments',
          code: 'DATABASE_ERROR',
          details: { existingError },
        },
        { status: 500 }
      );
    }

    const currentCount = existingAttachments?.length || 0;
    const newCount = currentCount + attachments.length;

    // 8. Validate total attachment count doesn't exceed limit
    if (newCount > MESSAGE_CONSTANTS.MAX_ATTACHMENTS) {
      return NextResponse.json<MessageErrorResponse>(
        {
          success: false,
          error: `Cannot exceed ${MESSAGE_CONSTANTS.MAX_ATTACHMENTS} attachments per message. Current: ${currentCount}, Attempting to add: ${attachments.length}`,
          code: 'TOO_MANY_ATTACHMENTS',
          details: {
            current_count: currentCount,
            attempting_to_add: attachments.length,
            max_allowed: MESSAGE_CONSTANTS.MAX_ATTACHMENTS,
          },
        },
        { status: 400 }
      );
    }

    // 9. Create attachment records
    const attachmentsData = attachments.map((att) => ({
      message_id: params.id,
      url: att.url,
      mime_type: att.mime_type,
      file_name: att.file_name,
      file_size: att.file_size,
      created_at: new Date().toISOString(),
    }));

    const { data: createdAttachments, error: createError } = await supabase
      .from('message_attachments')
      .insert(attachmentsData)
      .select('*');

    if (createError || !createdAttachments) {
      console.error('Failed to create attachments:', createError);
      return NextResponse.json<MessageErrorResponse>(
        {
          success: false,
          error: 'Failed to add attachments',
          code: 'DATABASE_ERROR',
          details: { createError },
        },
        { status: 500 }
      );
    }

    // 10. Update message updated_at timestamp
    await supabase
      .from('messages')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', params.id);

    // 11. Send notification to recipient about attachment addition
    // (Only if sender is adding attachments after initial send)
    if (message.sender_user_id === user.id) {
      try {
        // Get sender details for notification
        const { data: senderProfile } = await supabase
          .from('profiles')
          .select('display_name, email')
          .eq('user_id', user.id)
          .single();

        await supabase.from('notifications').insert({
          school_id: profile.school_id,
          user_id: message.recipient_user_id,
          channel: 'in_app',
          type: 'message_attachment_added',
          payload: {
            message_id: params.id,
            sender_name: senderProfile?.display_name || senderProfile?.email || 'User',
            attachment_count: createdAttachments.length,
            file_names: attachments.map((a) => a.file_name),
          },
          sent_at: new Date().toISOString(),
        });
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
        // Don't fail the request if notification fails
      }
    }

    // 12. Return success response
    return NextResponse.json<AddAttachmentsResponse>(
      {
        success: true,
        message_id: params.id,
        attachments: createdAttachments as MessageAttachmentRow[],
        message: 'Attachments added successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/messages/:id/attachments:', error);
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
