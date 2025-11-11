/**
 * Messages API Endpoint
 * GET /api/messages - List messages with folder filtering and pagination
 * POST /api/messages - Send a new message
 *
 * Created: 2025-10-22
 * Purpose: Teacher-student-parent messaging system with threading support
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithAuth } from '@/lib/supabase-server';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// ============================================================================
// Types
// ============================================================================

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
  // Populated fields
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
  reply_count?: number;
}

interface ListMessagesResponse {
  success: true;
  messages: Message[];
  stats: {
    total_unread: number;
    total_threads: number;
  };
  pagination: {
    page: number;
    total_pages: number;
    total: number;
  };
}

interface SendMessageResponse {
  success: true;
  message: Message;
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

// ============================================================================
// GET /api/messages - List Messages with Folder Filtering
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // Parse query parameters
    const { searchParams } = new URL(request.url);
    const folder = searchParams.get('folder') || 'inbox';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');

    // Validate pagination
    if (page < 1 || limit < 1 || limit > 100) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Invalid pagination parameters',
          code: 'INVALID_PARAMS',
        },
        { status: 400 }
      );
    }

    // 1. Initialize Supabase client with auth (reads from Authorization header OR cookies)
    const supabase = createClientWithAuth();

    // DEBUG: Log auth headers and cookies
    const authHeader = request.headers.get('authorization');
    const cookies = request.headers.get('cookie');
    console.log('📋 GET /api/messages - Auth Debug:', {
      hasAuthHeader: !!authHeader,
      authHeaderPreview: authHeader?.substring(0, 20) + '...',
      hasCookies: !!cookies,
      cookieCount: cookies?.split(';').length || 0,
    });

    // 2. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    console.log('👤 User auth result:', {
      hasUser: !!user,
      userId: user?.id,
      authError: authError?.message,
    });

    if (authError || !user) {
      console.error('❌ Authentication failed:', authError);
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
      .select('user_id, school_id, role, display_name, email')
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

    // 4. Build query based on folder
    // Note: We need to handle both individual messages (to_user_id) and group messages (message_recipients)
    // For group messages, we'll fetch them separately and merge with individual messages

    let individualMessages: any[] = [];
    let groupMessages: any[] = [];
    let totalCount = 0;

    // Fetch individual messages
    let individualQuery = supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('school_id', profile.school_id);

    // Apply folder filtering for individual messages
    switch (folder) {
      case 'inbox':
        individualQuery = individualQuery.eq('to_user_id', user.id);
        break;
      case 'sent':
        individualQuery = individualQuery.eq('from_user_id', user.id);
        break;
      case 'unread':
        individualQuery = individualQuery.eq('to_user_id', user.id).is('read_at', null);
        break;
      case 'all':
        individualQuery = individualQuery.or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);
        break;
      default:
        return NextResponse.json<ErrorResponse>(
          {
            success: false,
            error: `Invalid folder: ${folder}`,
            code: 'INVALID_FOLDER',
          },
          { status: 400 }
        );
    }

    const { data: individualData, error: individualError, count: individualCount } = await individualQuery;

    if (individualError) {
      console.error('Error fetching individual messages:', individualError);
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Failed to fetch messages',
          code: 'DATABASE_ERROR',
        },
        { status: 500 }
      );
    }

    individualMessages = individualData || [];
    totalCount = individualCount || 0;

    // Fetch group messages (where user is in message_recipients)
    // Only for inbox, unread, and all folders
    if (folder === 'inbox' || folder === 'unread' || folder === 'all') {
      const { data: recipients, error: recipientsError } = await supabase
        .from('message_recipients')
        .select('message_id, read_at')
        .eq('recipient_id', user.id);

      if (!recipientsError && recipients && recipients.length > 0) {
        const messageIds = recipients.map(r => r.message_id);

        // Create a map of message_id -> read_at for quick lookup
        const recipientReadMap = new Map(
          recipients.map(r => [r.message_id, r.read_at])
        );

        let groupQuery = supabase
          .from('messages')
          .select('*')
          .eq('school_id', profile.school_id)
          .in('id', messageIds);

        // For unread folder, filter by unread group messages
        if (folder === 'unread') {
          const unreadMessageIds = recipients
            .filter(r => r.read_at === null)
            .map(r => r.message_id);

          if (unreadMessageIds.length > 0) {
            groupQuery = supabase
              .from('messages')
              .select('*')
              .eq('school_id', profile.school_id)
              .in('id', unreadMessageIds);
          } else {
            // No unread group messages
            groupQuery = supabase
              .from('messages')
              .select('*')
              .eq('school_id', profile.school_id)
              .in('id', []);
          }
        }

        const { data: groupData, error: groupError } = await groupQuery;

        if (!groupError && groupData) {
          // Merge read_at from message_recipients into group messages
          groupMessages = groupData.map(msg => ({
            ...msg,
            read_at: recipientReadMap.get(msg.id) || msg.read_at
          }));
          totalCount += groupMessages.length;
        }
      }
    }

    // Combine and sort messages
    const allMessages = [...individualMessages, ...groupMessages]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    // Apply pagination to combined results
    const offset = (page - 1) * limit;
    const messages = allMessages.slice(offset, offset + limit);

    // 5. Fetch attachments for all messages
    const messageIds = messages.map(m => m.id);
    let attachmentsByMessageId = new Map();

    if (messageIds.length > 0) {
      const { data: attachments } = await supabase
        .from('message_attachments')
        .select('*')
        .in('message_id', messageIds);

      if (attachments) {
        // Group attachments by message_id
        attachments.forEach((att: any) => {
          if (!attachmentsByMessageId.has(att.message_id)) {
            attachmentsByMessageId.set(att.message_id, []);
          }
          attachmentsByMessageId.get(att.message_id).push(att);
        });
      }
    }

    // 6. Populate sender and recipient data
    const populatedMessages = await Promise.all(
      (messages || []).map(async (msg) => {
        // Get sender profile
        const { data: sender } = await supabase
          .from('profiles')
          .select('user_id, display_name, email, role')
          .eq('user_id', msg.from_user_id)
          .single();

        // Get recipient profile
        const { data: recipient } = await supabase
          .from('profiles')
          .select('user_id, display_name, email, role')
          .eq('user_id', msg.to_user_id)
          .single();

        // Count replies if this is a root message
        let reply_count = 0;
        if (!msg.thread_id) {
          const { count: replyCount } = await supabase
            .from('messages')
            .select('id', { count: 'exact', head: true })
            .eq('thread_id', msg.id);
          reply_count = replyCount || 0;
        }

        return {
          ...msg,
          sender: sender || undefined,
          recipient: recipient || undefined,
          reply_count,
          attachments: attachmentsByMessageId.get(msg.id) || [],
        };
      })
    );

    // 7. Calculate stats (including both individual and group messages)
    // Individual unread messages
    const { count: individualUnreadCount } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', profile.school_id)
      .eq('to_user_id', user.id)
      .is('read_at', null);

    // Group unread messages
    const { data: unreadRecipients } = await supabase
      .from('message_recipients')
      .select('message_id')
      .eq('recipient_id', user.id)
      .is('read_at', null);

    const groupUnreadCount = unreadRecipients?.length || 0;
    const totalUnreadCount = (individualUnreadCount || 0) + groupUnreadCount;

    // Total thread count (both individual and group)
    const { count: threadCount } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', profile.school_id)
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .is('thread_id', null);

    // 8. Return response
    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json<ListMessagesResponse>(
      {
        success: true,
        messages: populatedMessages,
        stats: {
          total_unread: totalUnreadCount,
          total_threads: threadCount || 0,
        },
        pagination: {
          page,
          total_pages: totalPages,
          total: totalCount,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/messages:', error);
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

// ============================================================================
// POST /api/messages - Send New Message
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { recipient_user_id, subject, body: messageBody, thread_id } = body;

    // Validate required fields
    if (!recipient_user_id || !messageBody) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Missing required fields: recipient_user_id and body are required',
          code: 'MISSING_FIELDS',
        },
        { status: 400 }
      );
    }

    if (messageBody.trim().length === 0) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Message body cannot be empty',
          code: 'EMPTY_BODY',
        },
        { status: 400 }
      );
    }

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

    // 3. Get sender profile
    const { data: senderProfile, error: senderError } = await supabase
      .from('profiles')
      .select('user_id, school_id, role, display_name, email')
      .eq('user_id', user.id)
      .single();

    if (senderError || !senderProfile) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Sender profile not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 4. Get recipient profile and validate same school
    const { data: recipientProfile, error: recipientError } = await supabase
      .from('profiles')
      .select('user_id, school_id, role, display_name, email')
      .eq('user_id', recipient_user_id)
      .single();

    if (recipientError || !recipientProfile) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Recipient not found',
          code: 'RECIPIENT_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Validate same school
    if (recipientProfile.school_id !== senderProfile.school_id) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Cannot send messages to users in different schools',
          code: 'SCHOOL_MISMATCH',
        },
        { status: 403 }
      );
    }

    // 5. Create message record
    const messageData = {
      school_id: senderProfile.school_id,
      from_user_id: user.id,
      to_user_id: recipient_user_id,
      recipient_type: 'individual', // Required for check constraint
      subject: subject || null,
      body: messageBody.trim(),
      thread_id: thread_id || null,
      read_at: null,
      topic: 'general', // Default topic
      extension: 'standard', // Default extension
      payload: null,
      event: null,
      private: false,
    };

    const { data: newMessage, error: createError } = await supabase
      .from('messages')
      .insert([messageData])
      .select()
      .single();

    if (createError) {
      console.error('Error creating message:', createError);
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Failed to create message',
          code: 'CREATE_ERROR',
        },
        { status: 500 }
      );
    }

    // 6. Populate sender and recipient data
    const populatedMessage = {
      ...newMessage,
      sender: {
        user_id: senderProfile.user_id,
        display_name: senderProfile.display_name,
        email: senderProfile.email,
        role: senderProfile.role,
      },
      recipient: {
        user_id: recipientProfile.user_id,
        display_name: recipientProfile.display_name,
        email: recipientProfile.email,
        role: recipientProfile.role,
      },
      reply_count: 0,
    };

    // 7. Return response
    return NextResponse.json<SendMessageResponse>(
      {
        success: true,
        message: populatedMessage,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/messages:', error);
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
