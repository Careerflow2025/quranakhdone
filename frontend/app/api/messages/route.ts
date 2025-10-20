/**
 * Enhanced Messages API Endpoints
 * POST /api/messages - Send new message or reply
 * GET /api/messages - List messages with filters
 *
 * Created: 2025-10-20
 * Purpose: Threaded messaging system for teacher-student-parent communication
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 * Features: Threading, attachments, read status, notifications
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  validateSendMessageRequest,
  validateListMessagesQuery,
  canSendMessage,
  canMessageRecipient,
} from '@/lib/validators/messages';
import {
  SendMessageResponse,
  ListMessagesResponse,
  MessageErrorResponse,
  MessageWithDetails,
  getThreadId,
} from '@/lib/types/messages';

// ============================================================================
// POST /api/messages - Send Message
// ============================================================================

export async function POST(request: NextRequest) {
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

    // 3. Get user profile with school_id and role
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
          details: { profileError },
        },
        { status: 404 }
      );
    }

    // 4. Check if user can send messages
    if (!canSendMessage({ userId: user.id, userRole: profile.role, schoolId: profile.school_id })) {
      return NextResponse.json<MessageErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to send messages',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 5. Parse and validate request body
    const body = await request.json();
    const validation = validateSendMessageRequest(body);

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

    const { recipient_user_id, subject, body: messageBody, thread_id, attachments } = validation.data;

    // 6. Get recipient profile to check school and role
    const { data: recipientProfile, error: recipientError } = await supabase
      .from('profiles')
      .select('user_id, school_id, role, display_name, email')
      .eq('user_id', recipient_user_id)
      .single();

    if (recipientError || !recipientProfile) {
      return NextResponse.json<MessageErrorResponse>(
        {
          success: false,
          error: 'Recipient not found',
          code: 'RECIPIENT_NOT_FOUND',
          details: { recipientError },
        },
        { status: 404 }
      );
    }

    // 7. Check if user can message this recipient
    if (
      !canMessageRecipient(
        { userId: user.id, userRole: profile.role, schoolId: profile.school_id },
        recipientProfile.role,
        recipientProfile.school_id
      )
    ) {
      return NextResponse.json<MessageErrorResponse>(
        {
          success: false,
          error: 'You cannot message this recipient',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 8. If thread_id provided, verify thread exists and user has access
    if (thread_id) {
      const { data: threadRootMessage, error: threadError } = await supabase
        .from('messages')
        .select('id, school_id, sender_user_id, recipient_user_id')
        .eq('id', thread_id)
        .eq('school_id', profile.school_id)
        .single();

      if (threadError || !threadRootMessage) {
        return NextResponse.json<MessageErrorResponse>(
          {
            success: false,
            error: 'Thread not found',
            code: 'THREAD_NOT_FOUND',
            details: { threadError },
          },
          { status: 404 }
        );
      }

      // Verify user is part of the thread (sender or recipient)
      if (
        threadRootMessage.sender_user_id !== user.id &&
        threadRootMessage.recipient_user_id !== user.id
      ) {
        return NextResponse.json<MessageErrorResponse>(
          {
            success: false,
            error: 'You do not have access to this thread',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        );
      }
    }

    // 9. Create message
    const messageData = {
      school_id: profile.school_id,
      thread_id: thread_id || null,
      sender_user_id: user.id,
      recipient_user_id,
      subject: thread_id ? null : subject, // Only root messages have subjects
      body: messageBody,
      read_at: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const { data: createdMessage, error: createError } = await supabase
      .from('messages')
      .insert(messageData)
      .select('*')
      .single();

    if (createError || !createdMessage) {
      console.error('Failed to create message:', createError);
      return NextResponse.json<MessageErrorResponse>(
        {
          success: false,
          error: 'Failed to send message',
          code: 'DATABASE_ERROR',
          details: { createError },
        },
        { status: 500 }
      );
    }

    // 10. Create attachments if provided
    if (attachments && attachments.length > 0) {
      const attachmentsData = attachments.map((att) => ({
        message_id: createdMessage.id,
        url: att.url,
        mime_type: att.mime_type,
        file_name: att.file_name,
        file_size: att.file_size,
        created_at: new Date().toISOString(),
      }));

      await supabase.from('message_attachments').insert(attachmentsData);
    }

    // 11. Send notification to recipient
    let notificationSent = false;
    try {
      await supabase.from('notifications').insert({
        school_id: profile.school_id,
        user_id: recipient_user_id,
        channel: 'in_app',
        type: 'new_message',
        payload: {
          message_id: createdMessage.id,
          sender_name: profile.display_name || user.email,
          subject: subject || 'Reply to your message',
          preview: messageBody.substring(0, 100),
        },
        sent_at: new Date().toISOString(),
      });
      notificationSent = true;
    } catch (notifError) {
      console.error('Failed to send notification:', notifError);
      // Don't fail the whole request if notification fails
    }

    // 12. Get sender details for response
    const { data: senderProfile } = await supabase
      .from('profiles')
      .select('user_id, display_name, email, role')
      .eq('user_id', user.id)
      .single();

    // 13. Get attachments for response
    const { data: messageAttachments } = await supabase
      .from('message_attachments')
      .select('*')
      .eq('message_id', createdMessage.id);

    // 14. Build response
    const messageWithDetails: MessageWithDetails = {
      ...createdMessage,
      sender: {
        id: senderProfile?.user_id || user.id,
        display_name: senderProfile?.display_name || user.email || 'Unknown',
        email: senderProfile?.email || user.email || '',
        role: senderProfile?.role || 'student',
      },
      recipient: {
        id: recipientProfile.user_id,
        display_name: recipientProfile.display_name || recipientProfile.email,
        email: recipientProfile.email,
        role: recipientProfile.role,
      },
      attachments: messageAttachments || [],
      is_read: false,
    };

    const threadIdForResponse = getThreadId(createdMessage);

    // 15. Return success response
    return NextResponse.json<SendMessageResponse>(
      {
        success: true,
        message: messageWithDetails,
        thread_id: threadIdForResponse,
        notification_sent: notificationSent,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/messages:', error);
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
// GET /api/messages - List Messages
// ============================================================================

export async function GET(request: NextRequest) {
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

    // 4. Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryData = Object.fromEntries(searchParams.entries());
    const validation = validateListMessagesQuery(queryData);

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

    const {
      folder,
      thread_id,
      sender_user_id,
      recipient_user_id,
      read_status,
      page = 1,
      limit = 20,
      sort_by = 'created_at',
      sort_order = 'desc',
    } = validation.data;

    // 5. Build query
    let query = supabase
      .from('messages')
      .select(
        `
        *,
        sender:sender_user_id(user_id, display_name, email, role),
        recipient:recipient_user_id(user_id, display_name, email, role),
        attachments:message_attachments(*)
      `,
        { count: 'exact' }
      )
      .eq('school_id', profile.school_id);

    // Apply folder filter
    if (folder === 'inbox') {
      query = query.eq('recipient_user_id', user.id);
    } else if (folder === 'sent') {
      query = query.eq('sender_user_id', user.id);
    } else if (folder === 'unread') {
      query = query.eq('recipient_user_id', user.id).is('read_at', null);
    } else {
      // 'all' - show messages where user is sender or recipient
      query = query.or(`sender_user_id.eq.${user.id},recipient_user_id.eq.${user.id}`);
    }

    // Apply additional filters
    if (thread_id) {
      query = query.or(`id.eq.${thread_id},thread_id.eq.${thread_id}`);
    }

    if (sender_user_id) {
      query = query.eq('sender_user_id', sender_user_id);
    }

    if (recipient_user_id) {
      query = query.eq('recipient_user_id', recipient_user_id);
    }

    if (read_status === 'read') {
      query = query.not('read_at', 'is', null);
    } else if (read_status === 'unread') {
      query = query.is('read_at', null);
    }

    // Apply sorting and pagination
    const offset = (page - 1) * limit;
    query = query
      .order(sort_by, { ascending: sort_order === 'asc' })
      .range(offset, offset + limit - 1);

    // 6. Execute query
    const { data: messages, error: messagesError, count } = await query;

    if (messagesError) {
      console.error('Messages fetch error:', messagesError);
      return NextResponse.json<MessageErrorResponse>(
        {
          success: false,
          error: 'Failed to fetch messages',
          code: 'DATABASE_ERROR',
          details: { messagesError },
        },
        { status: 500 }
      );
    }

    // 7. Process messages with details
    const messagesWithDetails: MessageWithDetails[] = (messages || []).map((msg: any) => ({
      ...msg,
      sender: msg.sender
        ? {
            id: msg.sender.user_id,
            display_name: msg.sender.display_name || msg.sender.email,
            email: msg.sender.email,
            role: msg.sender.role,
          }
        : undefined,
      recipient: msg.recipient
        ? {
            id: msg.recipient.user_id,
            display_name: msg.recipient.display_name || msg.recipient.email,
            email: msg.recipient.email,
            role: msg.recipient.role,
          }
        : undefined,
      attachments: msg.attachments || [],
      is_read: msg.read_at !== null,
    }));

    // 8. Calculate stats
    const totalUnread = messagesWithDetails.filter(
      (msg) => msg.recipient.id === user.id && !msg.is_read
    ).length;

    const uniqueThreads = new Set(
      messagesWithDetails.map((msg) => msg.thread_id || msg.id)
    );
    const totalThreads = uniqueThreads.size;

    // 9. Calculate pagination
    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / limit);

    // 10. Return success response
    return NextResponse.json<ListMessagesResponse>(
      {
        success: true,
        messages: messagesWithDetails,
        pagination: {
          page,
          limit,
          total: totalCount,
          total_pages: totalPages,
        },
        stats: {
          total_unread: totalUnread,
          total_threads: totalThreads,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/messages:', error);
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
