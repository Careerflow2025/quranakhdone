/**
 * Assignment Submission API
 * POST /api/assignments/:id/submit - Submit assignment with text and/or attachments
 *
 * Created: 2025-10-20
 * Purpose: Handles student submission workflow
 * Business rules: Must be in 'viewed' or 'reopened' status, requires text or attachments
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  validateSubmitAssignmentRequest,
  validateSubmission,
  canSubmitAssignment,
} from '@/lib/validators/assignments';
import {
  SubmitAssignmentResponse,
  AssignmentErrorResponse,
  AssignmentStatus,
} from '@/lib/types/assignments';

// ============================================================================
// POST /api/assignments/:id/submit - Submit Assignment
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id;

    // 1. Initialize Supabase client with auth
    const supabase = createClient();

    // 2. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<AssignmentErrorResponse>(
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
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: 'User profile not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 4. Get student_id (only students can submit)
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (studentError || !student) {
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: 'Only students can submit assignments',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 5. Validate request body
    const body = await request.json();
    const validation = validateSubmitAssignmentRequest(body);

    if (!validation.success) {
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: validation.error || 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { errors: validation.errors },
        },
        { status: 400 }
      );
    }

    const { text, attachments } = validation.data;

    // 6. Fetch existing assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('*')
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: 'Assignment not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 7. Check permissions (student must be the assigned student)
    const hasPermission = canSubmitAssignment(
      {
        userId: user.id,
        userRole: profile.role,
        schoolId: profile.school_id,
        studentId: student.id,
      },
      {
        assignmentSchoolId: assignment.school_id,
        assignmentTeacherId: assignment.created_by_teacher_id,
        assignmentStudentId: assignment.student_id,
      }
    );

    if (!hasPermission) {
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: 'You can only submit your own assignments',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 8. Validate submission is allowed (business rule)
    const hasContent = !!(text || (attachments && attachments.length > 0));
    const submissionValidation = validateSubmission(
      assignment.status as AssignmentStatus,
      hasContent
    );

    if (!submissionValidation.valid) {
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: submissionValidation.error || 'Cannot submit assignment',
          code: 'INVALID_TRANSITION',
        },
        { status: 400 }
      );
    }

    // 9. Check if already submitted (reopen_count logic)
    const { data: existingSubmissions } = await supabase
      .from('assignment_submissions')
      .select('id')
      .eq('assignment_id', assignmentId)
      .eq('student_id', student.id);

    const isResubmission = (existingSubmissions?.length || 0) > 0;

    // 10. Create submission record
    const { data: submission, error: submissionError } = await supabase
      .from('assignment_submissions')
      .insert({
        assignment_id: assignmentId,
        student_id: student.id,
        text: text || null,
      })
      .select('id')
      .single();

    if (submissionError || !submission) {
      console.error('Submission creation error:', submissionError);
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: 'Failed to create submission',
          code: 'DATABASE_ERROR',
          details: { submissionError },
        },
        { status: 500 }
      );
    }

    // 11. Insert attachments if provided
    if (attachments && attachments.length > 0) {
      const attachmentInserts = attachments.map((url) => ({
        assignment_id: assignmentId,
        uploader_user_id: user.id,
        url,
        mime_type: getMimeTypeFromUrl(url),
      }));

      const { error: attachmentError } = await supabase
        .from('assignment_attachments')
        .insert(attachmentInserts);

      if (attachmentError) {
        console.error('Attachment creation error:', attachmentError);
        // Don't fail the request, but log the error
      }
    }

    // 12. Update assignment status to 'submitted'
    const { data: updatedAssignment, error: updateError } = await supabase
      .from('assignments')
      .update({
        status: 'submitted',
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (updateError || !updatedAssignment) {
      console.error('Assignment status update error:', updateError);
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: 'Failed to update assignment status',
          code: 'DATABASE_ERROR',
          details: { updateError },
        },
        { status: 500 }
      );
    }

    // 13. Create assignment event for submission
    await supabase.from('assignment_events').insert({
      assignment_id: assignmentId,
      event_type: isResubmission ? 'resubmitted' : 'submitted',
      actor_user_id: user.id,
      from_status: assignment.status,
      to_status: 'submitted',
      meta: {
        submission_id: submission.id,
        has_text: !!text,
        attachment_count: attachments?.length || 0,
        is_resubmission: isResubmission,
      },
    });

    // 14. Create notification for teacher
    const { data: teacher } = await supabase
      .from('teachers')
      .select('user_id')
      .eq('id', assignment.created_by_teacher_id)
      .single();

    if (teacher) {
      await supabase.from('notifications').insert({
        school_id: assignment.school_id,
        user_id: teacher.user_id,
        channel: 'in_app',
        type: isResubmission ? 'assignment_resubmitted' : 'assignment_submitted',
        payload: {
          assignment_id: assignmentId,
          assignment_title: assignment.title,
          student_name: profile.display_name || 'A student',
          submission_id: submission.id,
        },
        sent_at: new Date().toISOString(),
      });

      // Also send email notification if configured
      await supabase.from('notifications').insert({
        school_id: assignment.school_id,
        user_id: teacher.user_id,
        channel: 'email',
        type: isResubmission ? 'assignment_resubmitted' : 'assignment_submitted',
        payload: {
          assignment_id: assignmentId,
          assignment_title: assignment.title,
          student_name: profile.display_name || 'A student',
          submission_id: submission.id,
          due_at: assignment.due_at,
        },
        sent_at: null, // Will be sent by background worker
      });
    }

    // 15. Return response
    return NextResponse.json<SubmitAssignmentResponse>(
      {
        success: true,
        assignment: updatedAssignment,
        submission_id: submission.id,
        message: isResubmission
          ? 'Assignment resubmitted successfully'
          : 'Assignment submitted successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/assignments/:id/submit:', error);
    return NextResponse.json<AssignmentErrorResponse>(
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
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extracts MIME type from file URL
 */
function getMimeTypeFromUrl(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    m4a: 'audio/mp4',
    mp3: 'audio/mpeg',
  };

  return mimeTypes[extension || ''] || 'application/octet-stream';
}
