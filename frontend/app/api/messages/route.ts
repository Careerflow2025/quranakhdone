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
import { createClient } from '@/lib/supabase-server';


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

    // 1. Initialize Supabase client with auth
    const supabase = createClient();

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
    let query = supabase
      .from('messages')
      .select('*', { count: 'exact' })
      .eq('school_id', profile.school_id);

    // Apply folder filtering
    switch (folder) {
      case 'inbox':
        query = query.eq('to_user_id', user.id);
        break;
      case 'sent':
        query = query.eq('from_user_id', user.id);
        break;
      case 'unread':
        query = query.eq('to_user_id', user.id).is('read_at', null);
        break;
      case 'all':
        query = query.or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`);
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

    // Apply pagination and ordering
    const offset = (page - 1) * limit;
    query = query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Execute query
    const { data: messages, error: messagesError, count } = await query;

    if (messagesError) {
      console.error('Error fetching messages:', messagesError);
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Failed to fetch messages',
          code: 'DATABASE_ERROR',
        },
        { status: 500 }
      );
    }

    // 5. Populate sender and recipient data
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
        };
      })
    );

    // 6. Calculate stats
    const { count: unreadCount } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', profile.school_id)
      .eq('to_user_id', user.id)
      .is('read_at', null);

    const { count: threadCount } = await supabase
      .from('messages')
      .select('id', { count: 'exact', head: true })
      .eq('school_id', profile.school_id)
      .or(`from_user_id.eq.${user.id},to_user_id.eq.${user.id}`)
      .is('thread_id', null);

    // 7. Return response
    const totalPages = Math.ceil((count || 0) / limit);

    return NextResponse.json<ListMessagesResponse>(
      {
        success: true,
        messages: populatedMessages,
        stats: {
          total_unread: unreadCount || 0,
          total_threads: threadCount || 0,
        },
        pagination: {
          page,
          total_pages: totalPages,
          total: count || 0,
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

    // 1. Initialize Supabase client with auth
    const supabase = createClient();

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
