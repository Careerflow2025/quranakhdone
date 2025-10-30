/**
 * Assignment Reopen API
 * POST /api/assignments/:id/reopen - Reopen completed assignment for resubmission
 *
 * Created: 2025-10-20
 * Purpose: Allows teachers to reopen completed assignments
 * Business rules: Must be 'completed', max reopen count enforced, reason required
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  validateReopenAssignmentRequest,
  validateReopen,
  canReopenAssignment,
} from '@/lib/validators/assignments';
import {
  ReopenAssignmentResponse,
  AssignmentErrorResponse,
  AssignmentStatus,
  ASSIGNMENT_CONSTANTS,
} from '@/lib/types/assignments';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// ============================================================================
// POST /api/assignments/:id/reopen - Reopen Assignment
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

    // 4. Get teacher_id (only teachers/admins/owners can reopen)
    let teacherId: string | undefined;
    if (profile.role === 'teacher') {
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacherError || !teacher) {
        return NextResponse.json<AssignmentErrorResponse>(
          {
            success: false,
            error: 'Teacher profile not found',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        );
      }

      teacherId = teacher.id;
    }

    // 5. Validate request body
    const body = await request.json();
    const validation = validateReopenAssignmentRequest(body);

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

    const { reason } = validation.data;

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

    // 7. Check permissions
    const hasPermission = canReopenAssignment(
      {
        userId: user.id,
        userRole: profile.role,
        schoolId: profile.school_id,
        teacherId,
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
          error: 'Insufficient permissions to reopen this assignment',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 8. Validate reopen is allowed (business rule)
    const reopenValidation = validateReopen(
      assignment.status as AssignmentStatus,
      assignment.reopen_count
    );

    if (!reopenValidation.valid) {
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: reopenValidation.error || 'Cannot reopen assignment',
          code: 'INVALID_TRANSITION',
        },
        { status: 400 }
      );
    }

    // 9. Increment reopen count and update status to 'reopened'
    const newReopenCount = assignment.reopen_count + 1;

    const { data: updatedAssignment, error: updateError } = await supabase
      .from('assignments')
      .update({
        status: 'reopened',
        reopen_count: newReopenCount,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (updateError || !updatedAssignment) {
      console.error('Assignment reopen error:', updateError);
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: 'Failed to reopen assignment',
          code: 'DATABASE_ERROR',
          details: { updateError },
        },
        { status: 500 }
      );
    }

    // 10. Create assignment event for reopen
    await supabase.from('assignment_events').insert({
      assignment_id: assignmentId,
      event_type: 'reopened',
      actor_user_id: user.id,
      from_status: 'completed',
      to_status: 'reopened',
      meta: {
        reason,
        reopen_count: newReopenCount,
        actor_role: profile.role,
        remaining_reopens: ASSIGNMENT_CONSTANTS.MAX_REOPEN_COUNT - newReopenCount,
      },
    });

    // 11. Create notification for student
    const { data: student } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', assignment.student_id)
      .single();

    if (student) {
      await supabase.from('notifications').insert({
        school_id: assignment.school_id,
        user_id: student.user_id,
        channel: 'in_app',
        type: 'assignment_reopened',
        payload: {
          assignment_id: assignmentId,
          assignment_title: assignment.title,
          teacher_name: profile.display_name || 'Your teacher',
          reason,
          reopen_count: newReopenCount,
          remaining_reopens: ASSIGNMENT_CONSTANTS.MAX_REOPEN_COUNT - newReopenCount,
        },
        sent_at: new Date().toISOString(),
      });

      // Also send email notification
      await supabase.from('notifications').insert({
        school_id: assignment.school_id,
        user_id: student.user_id,
        channel: 'email',
        type: 'assignment_reopened',
        payload: {
          assignment_id: assignmentId,
          assignment_title: assignment.title,
          teacher_name: profile.display_name || 'Your teacher',
          reason,
          reopen_count: newReopenCount,
          due_at: assignment.due_at,
        },
        sent_at: null, // Will be sent by background worker
      });
    }

    // 12. Return response
    return NextResponse.json<ReopenAssignmentResponse>(
      {
        success: true,
        assignment: updatedAssignment,
        message: `Assignment reopened successfully (reopen count: ${newReopenCount}/${ASSIGNMENT_CONSTANTS.MAX_REOPEN_COUNT})`,
        reopen_count: newReopenCount,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/assignments/:id/reopen:', error);
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
