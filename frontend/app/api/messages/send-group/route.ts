/**
 * Group Messages API Endpoint
 * POST /api/messages/send-group - Send message to multiple recipients
 *
 * Purpose: Send group messages with support for:
 * - all_students: All students in teacher's classes
 * - all_parents: All parents of teacher's students
 * - specific_class: All students + parents in a specific class
 *
 * RLS: Enforces school-level isolation and teacher permissions
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClientWithAuth } from '@/lib/supabase-server';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

interface SendGroupMessageRequest {
  recipient_type: 'all_students' | 'all_parents' | 'specific_class';
  class_id?: string; // Required if recipient_type === 'specific_class'
  subject?: string;
  body: string;
  attachments?: Array<{
    url: string;
    mime_type: string;
    file_name: string;
    file_size: number;
  }>;
}

interface GroupMessageResponse {
  success: true;
  message: any;
  recipient_count: number;
}

interface ErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body: SendGroupMessageRequest = await request.json();
    const { recipient_type, class_id, subject, body: messageBody, attachments } = body;

    // Validate required fields
    if (!recipient_type || !messageBody) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Missing required fields: recipient_type and body are required',
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

    // Validate recipient_type
    if (!['all_students', 'all_parents', 'specific_class'].includes(recipient_type)) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Invalid recipient_type. Must be: all_students, all_parents, or specific_class',
          code: 'INVALID_RECIPIENT_TYPE',
        },
        { status: 400 }
      );
    }

    // If specific_class, class_id is required
    if (recipient_type === 'specific_class' && !class_id) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'class_id is required when recipient_type is specific_class',
          code: 'MISSING_CLASS_ID',
        },
        { status: 400 }
      );
    }

    // Initialize Supabase client with auth
    const supabase = createClientWithAuth();

    // Get authenticated user
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

    // Get sender profile
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

    // Only teachers can send group messages
    if (senderProfile.role !== 'teacher') {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Only teachers can send group messages',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // Get teacher record
    const { data: teacher, error: teacherError } = await supabase
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Teacher record not found',
          code: 'TEACHER_NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // Get teacher's classes
    const { data: classTeachers, error: classError } = await supabase
      .from('class_teachers')
      .select('class_id')
      .eq('teacher_id', teacher.id);

    if (classError) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Failed to fetch teacher classes',
          code: 'DATABASE_ERROR',
        },
        { status: 500 }
      );
    }

    const classIds = classTeachers?.map(ct => ct.class_id) || [];

    if (classIds.length === 0) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'You are not teaching any classes',
          code: 'NO_CLASSES',
        },
        { status: 403 }
      );
    }

    // If specific_class, verify teacher teaches this class
    if (recipient_type === 'specific_class' && class_id) {
      if (!classIds.includes(class_id)) {
        return NextResponse.json<ErrorResponse>(
          {
            success: false,
            error: 'You do not teach this class',
            code: 'CLASS_NOT_AUTHORIZED',
          },
          { status: 403 }
        );
      }
    }

    // Determine which classes to target
    let targetClassIds: string[] = [];
    if (recipient_type === 'specific_class' && class_id) {
      targetClassIds = [class_id];
    } else {
      targetClassIds = classIds;
    }

    // Get recipient user IDs based on recipient_type
    let recipientUserIds: string[] = [];

    if (recipient_type === 'all_students' || recipient_type === 'specific_class') {
      // Get students enrolled in target classes
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('class_enrollments')
        .select('student_id')
        .in('class_id', targetClassIds);

      if (enrollmentError) {
        return NextResponse.json<ErrorResponse>(
          {
            success: false,
            error: 'Failed to fetch students',
            code: 'DATABASE_ERROR',
          },
          { status: 500 }
        );
      }

      const studentIds = [...new Set(enrollments?.map(e => e.student_id) || [])];

      if (studentIds.length > 0) {
        // Get student user IDs
        const { data: students, error: studentsError } = await supabase
          .from('students')
          .select('user_id')
          .in('id', studentIds);

        if (!studentsError && students) {
          recipientUserIds.push(...students.map(s => s.user_id));
        }
      }
    }

    if (recipient_type === 'all_parents' || recipient_type === 'specific_class') {
      // Get students enrolled in target classes
      const { data: enrollments, error: enrollmentError } = await supabase
        .from('class_enrollments')
        .select('student_id')
        .in('class_id', targetClassIds);

      if (enrollmentError) {
        return NextResponse.json<ErrorResponse>(
          {
            success: false,
            error: 'Failed to fetch students for parent lookup',
            code: 'DATABASE_ERROR',
          },
          { status: 500 }
        );
      }

      const studentIds = [...new Set(enrollments?.map(e => e.student_id) || [])];

      if (studentIds.length > 0) {
        // Get parents of these students
        const { data: parentStudents, error: parentError } = await supabase
          .from('parent_students')
          .select('parent_id')
          .in('student_id', studentIds);

        if (!parentError && parentStudents) {
          const parentIds = [...new Set(parentStudents.map(ps => ps.parent_id))];

          if (parentIds.length > 0) {
            // Get parent user IDs
            const { data: parents, error: parentsError } = await supabase
              .from('parents')
              .select('user_id')
              .in('id', parentIds);

            if (!parentsError && parents) {
              recipientUserIds.push(...parents.map(p => p.user_id));
            }
          }
        }
      }
    }

    // Remove duplicates
    recipientUserIds = [...new Set(recipientUserIds)];

    if (recipientUserIds.length === 0) {
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'No recipients found for this group',
          code: 'NO_RECIPIENTS',
        },
        { status: 404 }
      );
    }

    // Create the message record (to_user_id = null for group messages)
    const messageData = {
      school_id: senderProfile.school_id,
      from_user_id: user.id,
      to_user_id: null, // Group messages have NULL to_user_id
      recipient_type: recipient_type,
      subject: subject || null,
      body: messageBody.trim(),
      read_at: null,
      topic: 'general',
      extension: 'standard',
      payload: null,
      event: null,
      private: false,
      ...(recipient_type === 'specific_class' && class_id ? { recipient_details: { class_id } } : {}),
    };

    const { data: newMessage, error: createError } = await supabase
      .from('messages')
      .insert([messageData])
      .select()
      .single();

    if (createError) {
      console.error('Error creating group message:', createError);
      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Failed to create message',
          code: 'CREATE_ERROR',
        },
        { status: 500 }
      );
    }

    // Create message_recipients records for all recipients
    const recipientRecords = recipientUserIds.map(recipientId => ({
      message_id: newMessage.id,
      recipient_id: recipientId,
      read_at: null,
    }));

    const { error: recipientsError } = await supabase
      .from('message_recipients')
      .insert(recipientRecords);

    if (recipientsError) {
      console.error('Error creating message recipients:', recipientsError);
      // Try to clean up the message
      await supabase.from('messages').delete().eq('id', newMessage.id);

      return NextResponse.json<ErrorResponse>(
        {
          success: false,
          error: 'Failed to add recipients',
          code: 'RECIPIENTS_ERROR',
        },
        { status: 500 }
      );
    }

    // Save attachments if provided
    if (attachments && Array.isArray(attachments) && attachments.length > 0) {
      const attachmentsData = attachments.map((att: any) => ({
        message_id: newMessage.id,
        url: att.url,
        mime_type: att.mime_type,
        file_name: att.file_name,
        file_size: att.file_size,
        uploaded_by: user.id,
      }));

      const { error: attachmentError } = await supabase
        .from('message_attachments')
        .insert(attachmentsData);

      if (attachmentError) {
        console.error('Error saving group message attachments:', attachmentError);
        // Don't fail the message send if attachments fail, just log it
      }
    }

    console.log(`✅ Group message sent to ${recipientUserIds.length} recipients`);

    return NextResponse.json<GroupMessageResponse>(
      {
        success: true,
        message: {
          ...newMessage,
          sender: {
            user_id: senderProfile.user_id,
            display_name: senderProfile.display_name,
            email: senderProfile.email,
            role: senderProfile.role,
          },
          attachments: attachments || [],
        },
        recipient_count: recipientUserIds.length,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Unexpected error in POST /api/messages/send-group:', error);
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
