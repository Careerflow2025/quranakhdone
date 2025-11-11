/**
 * Messages [id] API Endpoint
 * POST /api/messages/:id - Reply to a message
 * PATCH /api/messages/:id - Mark message as read
 *
 * Created: 2025-10-22
 * Purpose: Message reply and read status operations
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
  reply_count?: number;
}

interface ReplyMessageResponse {
  success: true;
  message: Message;
}

interface MarkAsReadResponse {
  success: true;
  message: Message;
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

// ============================================================================
// POST /api/messages/:id - Reply to Message
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messageId = params.id;
    const body = await request.json();
    const { body: replyBody } = body;

    // Validate required fields
    if (!replyBody || replyBody.trim().length === 0) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Reply body cannot be empty',
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

    // 4. Get original message
    const { data: originalMessage, error: messageError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .eq('school_id', profile.school_id)
      .single();

    if (messageError || !originalMessage) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Original message not found',
          code: 'MESSAGE_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 5. Determine thread_id (if original message is part of thread, use that thread_id; otherwise use original message id)
    const thread_id = originalMessage.thread_id || originalMessage.id;

    // 6. Determine recipient (sender of original message)
    const recipient_user_id = originalMessage.from_user_id;

    // Get recipient profile
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

    // 7. Create reply message
    const replyData = {
      school_id: profile.school_id,
      from_user_id: user.id,
      to_user_id: recipient_user_id,
      subject: originalMessage.subject,
      body: replyBody.trim(),
      thread_id: thread_id,
      read_at: null,
      topic: originalMessage.topic || 'general',
      extension: originalMessage.extension || 'standard',
      payload: null,
      event: null,
      private: originalMessage.private || false,
    };

    const { data: newReply, error: createError } = await supabase
      .from('messages')
      .insert([replyData])
      .select()
      .single();

    if (createError) {
      console.error('Error creating reply:', createError);
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Failed to create reply',
          code: 'CREATE_ERROR',
        },
        { status: 500 }
      );
    }

    // 8. Populate sender and recipient data
    const populatedReply = {
      ...newReply,
      sender: {
        user_id: profile.user_id,
        display_name: profile.display_name,
        email: profile.email,
        role: profile.role,
      },
      recipient: {
        user_id: recipientProfile.user_id,
        display_name: recipientProfile.display_name,
        email: recipientProfile.email,
        role: recipientProfile.role,
      },
      reply_count: 0,
    };

    // 9. Return response
    return NextResponse.json<ReplyMessageResponse>(
      {
        success: true,
        message: populatedReply,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/messages/:id:', error);
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
// PATCH /api/messages/:id - Mark Message as Read
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const messageId = params.id;

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

    // 4. Get message and verify user is recipient
    const { data: message, error: messageError } = await supabase
      .from('messages')
      .select('*')
      .eq('id', messageId)
      .eq('school_id', profile.school_id)
      .eq('to_user_id', user.id)
      .single();

    if (messageError || !message) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Message not found or you are not the recipient',
          code: 'MESSAGE_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 5. Update read_at timestamp
    const { data: updatedMessage, error: updateError } = await supabase
      .from('messages')
      .update({ read_at: new Date().toISOString() })
      .eq('id', messageId)
      .select()
      .single();

    if (updateError) {
      console.error('Error updating message:', updateError);
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Failed to mark message as read',
          code: 'UPDATE_ERROR',
        },
        { status: 500 }
      );
    }

    // 6. Populate sender and recipient data
    const { data: sender } = await supabase
      .from('profiles')
      .select('user_id, display_name, email, role')
      .eq('user_id', updatedMessage.from_user_id)
      .single();

    const populatedMessage = {
      ...updatedMessage,
      sender: sender || undefined,
      recipient: {
        user_id: profile.user_id,
        display_name: profile.display_name,
        email: profile.email,
        role: profile.role,
      },
    };

    // 7. Return response
    return NextResponse.json<MarkAsReadResponse>(
      {
        success: true,
        message: populatedMessage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in PATCH /api/messages/:id:', error);
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
