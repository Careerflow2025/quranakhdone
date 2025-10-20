/**
 * Message Thread API Endpoint
 * GET /api/messages/thread/:id - Get full message thread with all replies
 *
 * Created: 2025-10-20
 * Purpose: Retrieve complete conversation thread for teacher-student-parent messaging
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { canViewMessage } from '@/lib/validators/messages';
import {
  GetThreadResponse,
  MessageErrorResponse,
  MessageWithDetails,
  MessageThread,
  getThreadId,
} from '@/lib/types/messages';

// ============================================================================
// GET /api/messages/thread/:id - Get Full Thread
// ============================================================================

export async function GET(
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

    // 4. Get root message (the message that started the thread)
    // Root message either has: id = params.id AND thread_id IS NULL
    // OR any message where id = params.id (in case thread_id was provided)
    const { data: potentialRootMessage, error: rootError } = await supabase
      .from('messages')
      .select(
        `
        *,
        sender:sender_user_id(user_id, display_name, email, role),
        recipient:recipient_user_id(user_id, display_name, email, role),
        attachments:message_attachments(*)
      `
      )
      .eq('id', params.id)
      .eq('school_id', profile.school_id)
      .single();

    if (rootError || !potentialRootMessage) {
      return NextResponse.json<MessageErrorResponse>(
        {
          success: false,
          error: 'Thread not found',
          code: 'THREAD_NOT_FOUND',
          details: { rootError },
        },
        { status: 404 }
      );
    }

    // Determine the actual thread ID
    const actualThreadId = getThreadId(potentialRootMessage);

    // 5. Check if user has access to this thread
    // User must be sender or recipient of any message in the thread
    if (
      !canViewMessage(
        { userId: user.id, userRole: profile.role, schoolId: profile.school_id },
        {
          messageSchoolId: potentialRootMessage.school_id,
          messageSenderId: potentialRootMessage.sender_user_id,
          messageRecipientId: potentialRootMessage.recipient_user_id,
        }
      )
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

    // 6. Get the actual root message if potentialRootMessage is a reply
    let rootMessage: any;
    if (potentialRootMessage.thread_id === null) {
      // This is the root message
      rootMessage = potentialRootMessage;
    } else {
      // This is a reply, need to fetch the actual root
      const { data: actualRoot, error: actualRootError } = await supabase
        .from('messages')
        .select(
          `
          *,
          sender:sender_user_id(user_id, display_name, email, role),
          recipient:recipient_user_id(user_id, display_name, email, role),
          attachments:message_attachments(*)
        `
        )
        .eq('id', actualThreadId)
        .eq('school_id', profile.school_id)
        .single();

      if (actualRootError || !actualRoot) {
        return NextResponse.json<MessageErrorResponse>(
          {
            success: false,
            error: 'Root message not found',
            code: 'THREAD_NOT_FOUND',
            details: { actualRootError },
          },
          { status: 404 }
        );
      }

      rootMessage = actualRoot;
    }

    // 7. Get all replies in the thread
    const { data: repliesData, error: repliesError } = await supabase
      .from('messages')
      .select(
        `
        *,
        sender:sender_user_id(user_id, display_name, email, role),
        recipient:recipient_user_id(user_id, display_name, email, role),
        attachments:message_attachments(*)
      `
      )
      .eq('thread_id', actualThreadId)
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: true });

    if (repliesError) {
      console.error('Failed to fetch thread replies:', repliesError);
      return NextResponse.json<MessageErrorResponse>(
        {
          success: false,
          error: 'Failed to fetch thread replies',
          code: 'DATABASE_ERROR',
          details: { repliesError },
        },
        { status: 500 }
      );
    }

    // 8. Process root message into MessageWithDetails format
    const rootMessageWithDetails: MessageWithDetails = {
      ...rootMessage,
      sender: rootMessage.sender
        ? {
            id: rootMessage.sender.user_id,
            display_name: rootMessage.sender.display_name || rootMessage.sender.email,
            email: rootMessage.sender.email,
            role: rootMessage.sender.role,
          }
        : ({} as any),
      recipient: rootMessage.recipient
        ? {
            id: rootMessage.recipient.user_id,
            display_name: rootMessage.recipient.display_name || rootMessage.recipient.email,
            email: rootMessage.recipient.email,
            role: rootMessage.recipient.role,
          }
        : ({} as any),
      attachments: rootMessage.attachments || [],
      is_read: rootMessage.read_at !== null,
      reply_count: repliesData?.length || 0,
    };

    // 9. Process replies into MessageWithDetails format
    const repliesWithDetails: MessageWithDetails[] = (repliesData || []).map((reply: any) => ({
      ...reply,
      sender: reply.sender
        ? {
            id: reply.sender.user_id,
            display_name: reply.sender.display_name || reply.sender.email,
            email: reply.sender.email,
            role: reply.sender.role,
          }
        : ({} as any),
      recipient: reply.recipient
        ? {
            id: reply.recipient.user_id,
            display_name: reply.recipient.display_name || reply.recipient.email,
            email: reply.recipient.email,
            role: reply.recipient.role,
          }
        : ({} as any),
      attachments: reply.attachments || [],
      is_read: reply.read_at !== null,
    }));

    // 10. Calculate thread statistics
    // Get unique participants (sender and recipient from all messages)
    const allMessages = [rootMessage, ...(repliesData || [])];
    const participantIds = new Set<string>();
    allMessages.forEach((msg) => {
      participantIds.add(msg.sender_user_id);
      participantIds.add(msg.recipient_user_id);
    });
    const participantCount = participantIds.size;

    // Calculate last message timestamp
    const lastMessage =
      repliesData && repliesData.length > 0
        ? repliesData[repliesData.length - 1]
        : rootMessage;
    const lastMessageAt = lastMessage.created_at;

    // Calculate unread count for current user (messages where user is recipient and not read)
    const unreadCount = allMessages.filter(
      (msg) => msg.recipient_user_id === user.id && msg.read_at === null
    ).length;

    // 11. Build thread response
    const thread: MessageThread = {
      root_message: rootMessageWithDetails,
      replies: repliesWithDetails,
      participant_count: participantCount,
      last_message_at: lastMessageAt,
      unread_count: unreadCount,
    };

    // 12. Return success response
    return NextResponse.json<GetThreadResponse>(
      {
        success: true,
        thread,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/messages/thread/:id:', error);
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
