/**
 * Messages Thread API Endpoint
 * GET /api/messages/thread/:id - Get complete message thread with all replies
 *
 * Created: 2025-10-22
 * Purpose: Retrieve threaded conversations with all messages and participants
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithAuth } from '@/lib/supabase-server';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
interface Message {
  id: string;
  school_id: string;
  from_user_id: string;
  to_user_id: string;
  subject: string | null;
  body: string;
  read_at: string | null;
  thread_id: string | null;
  created_at: string;
  updated_at: string;
  sender?: {
    user_id: string;
    display_name: string | null;
    email: string;
    role: string;
  };
  recipient?: {
    user_id: string;
    display_name: string | null;
    email: string;
    role: string;
  };
}

interface ThreadResponse {
  success: true;
  thread: {
    root_message: Message;
    replies: Message[];
    participant_count: number;
    last_message_at: string;
    unread_count: number;
  };
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

// ============================================================================
// GET /api/messages/thread/:id - Get Message Thread
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const threadId = params.id;

    // 1. Initialize Supabase client with auth (reads from Authorization header OR cookies)
    const supabase = createClientWithAuth();

    // 2. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<ErrorResponse>(
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
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'User profile not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 4. Get the message by ID (could be root or reply)
    const { data: requestedMessage, error: messageError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', threadId)
      .eq('school_id', profile.school_id)
      .single();

    if (messageError || !requestedMessage) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Message not found',
          code: 'MESSAGE_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 5. Determine the root message
    // If the requested message has thread_id, it's a reply - find the root
    // Otherwise, it is the root
    let rootMessage: any;
    if (requestedMessage.thread_id) {
      const { data: root, error: rootError } = await supabase
        .from('messages')
        .select('*')
        .eq('id', requestedMessage.thread_id)
        .eq('school_id', profile.school_id)
        .single();

      if (rootError || !root) {
        return NextResponse.json<ErrorResponse>(
          {
            success: false,
            error: 'Thread root message not found',
            code: 'ROOT_NOT_FOUND',
          },
          { status: 404 }
        );
      }
      rootMessage = root;
    } else {
      rootMessage = requestedMessage;
    }

    // 6. Verify user has access to this thread
    // For individual messages: check from_user_id or to_user_id
    // For group messages: check message_recipients table
    let hasAccess = false;

    if (rootMessage.to_user_id) {
      // Individual message
      hasAccess =
        rootMessage.from_user_id === user.id ||
        rootMessage.to_user_id === user.id;
    } else {
      // Group message - check message_recipients
      const { data: recipientRecord } = await supabase
        .from('message_recipients')
        .select('id')
        .eq('message_id', rootMessage.id)
        .eq('recipient_id', user.id)
        .single();

      hasAccess =
        rootMessage.from_user_id === user.id ||
        !!recipientRecord;
    }

    if (!hasAccess) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'You do not have access to this thread',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 7. Get all replies in the thread
    const { data: replies, error: repliesError } = await supabase
      .from('messages')
      .select('*')
      .eq('thread_id', rootMessage.id)
      .eq('school_id', profile.school_id)
      .order('created_at', { ascending: true });

    if (repliesError) {
      console.error('Error fetching replies:', repliesError);
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Failed to fetch thread replies',
          code: 'DATABASE_ERROR',
        },
        { status: 500 }
      );
    }

    // 8. Populate sender and recipient data for root message
    const { data: rootSender } = await supabase
      .from('profiles')
      .select('user_id, display_name, email, role')
      .eq('user_id', rootMessage.from_user_id)
      .single();

    const { data: rootRecipient } = await supabase
      .from('profiles')
      .select('user_id, display_name, email, role')
      .eq('user_id', rootMessage.to_user_id)
      .single();

    const populatedRoot: Message = {
      ...rootMessage,
      sender: rootSender || undefined,
      recipient: rootRecipient || undefined,
    };

    // 9. Populate sender and recipient data for all replies
    const populatedReplies = await Promise.all(
      (replies || []).map(async (reply) => {
        const { data: sender } = await supabase
          .from('profiles')
          .select('user_id, display_name, email, role')
          .eq('user_id', reply.from_user_id)
          .single();

        const { data: recipient } = await supabase
          .from('profiles')
          .select('user_id, display_name, email, role')
          .eq('user_id', reply.to_user_id)
          .single();

        return {
          ...reply,
          sender: sender || undefined,
          recipient: recipient || undefined,
        };
      })
    );

    // 10. Calculate thread statistics
    const allMessages = [rootMessage, ...(replies || [])];
    const participantIds = new Set<string>();
    allMessages.forEach((msg) => {
      participantIds.add(msg.from_user_id);
      participantIds.add(msg.to_user_id);
    });

    const lastMessageAt =
      allMessages.length > 0
        ? allMessages[allMessages.length - 1].created_at
        : rootMessage.created_at;

    const unreadMessages = allMessages.filter(
      (msg) => msg.to_user_id === user.id && !msg.read_at
    );

    // 11. Return thread response
    return NextResponse.json<ThreadResponse>(
      {
        success: true,
        thread: {
          root_message: populatedRoot,
          replies: populatedReplies,
          participant_count: participantIds.size,
          last_message_at: lastMessageAt,
          unread_count: unreadMessages.length,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/messages/thread/:id:', error);
    return NextResponse.json<ErrorResponse>(
      {
        success: false,
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      },
      { status: 500 }
    );
  }
}
