// @ts-nocheck
/**
 * Assignment Status Transition API
 * POST /api/assignments/:id/transition - Change assignment status
 *
 * Created: 2025-10-20
 * Purpose: Handles status transitions with lifecycle validation
 * Valid transitions: assigned->viewed, viewed->submitted, submitted->reviewed,
 *                    reviewed->completed, completed->reopened
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  validateTransitionAssignmentRequest,
  validateStatusTransition,
  canTransitionAssignment,
} from '@/lib/validators/assignments';
import {
  TransitionAssignmentResponse,
  AssignmentErrorResponse,
  AssignmentStatus,
} from '@/lib/types/assignments';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// ============================================================================
// POST /api/assignments/:id/transition - Transition Assignment Status
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id;

    // 1. Initialize Supabase admin client
    const supabaseAdmin = getSupabaseAdmin();

    // 2. Get Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: 'Unauthorized - Missing authorization header',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: 'Unauthorized - Invalid token',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // 3. Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
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

    // 4. Get teacher_id and student_id if applicable
    let teacherId: string | undefined;
    let studentId: string | undefined;

    if (profile.role === 'teacher') {
      const { data: teacher } = await supabaseAdmin
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      teacherId = teacher?.id;
    }

    if (profile.role === 'student') {
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();
      studentId = student?.id;
    }

    // 5. Validate request body
    const body = await request.json();
    const validation = validateTransitionAssignmentRequest(body);

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

    const { to_status, reason } = validation.data;

    // 6. Fetch existing assignment
    const { data: assignment, error: assignmentError } = await supabaseAdmin
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

    // 7. Validate transition is allowed (lifecycle rules)
    const transitionValidation = validateStatusTransition(
      assignment.status as AssignmentStatus,
      to_status
    );

    if (!transitionValidation.valid) {
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: transitionValidation.error || 'Invalid status transition',
          code: 'INVALID_TRANSITION',
        },
        { status: 400 }
      );
    }

    // 8. Check permissions for this specific transition
    const hasPermission = canTransitionAssignment(
      {
        userId: user.id,
        userRole: profile.role,
        schoolId: profile.school_id,
        teacherId,
        studentId,
      },
      {
        assignmentSchoolId: assignment.school_id,
        assignmentTeacherId: assignment.created_by_teacher_id,
        assignmentStudentId: assignment.student_id,
      },
      to_status
    );

    if (!hasPermission) {
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: `Insufficient permissions to transition assignment to ${to_status}`,
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 9. Update assignment status
    const { data: updatedAssignment, error: updateError } = await supabaseAdmin
      .from('assignments')
      .update({
        status: to_status,
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

    // 10. Create assignment event for transition
    const { data: event, error: eventError } = await supabaseAdmin
      .from('assignment_events')
      .insert({
        assignment_id: assignmentId,
        event_type: `transition_${assignment.status}_to_${to_status}`,
        actor_user_id: user.id,
        from_status: assignment.status,
        to_status: to_status,
        meta: {
          reason: reason || null,
          actor_role: profile.role,
        },
      })
      .select('id')
      .single();

    if (eventError) {
      console.error('Assignment event creation error:', eventError);
      // Don't fail the request, but log the error
    }

    // 11. Create notification for status change
    // Determine who should be notified based on the transition
    let notifyUserId: string | undefined;
    let notificationType: string;

    if (to_status === 'viewed') {
      // Notify teacher when student views assignment
      const { data: teacher } = await supabaseAdmin
        .from('teachers')
        .select('user_id')
        .eq('id', assignment.created_by_teacher_id)
        .single();
      notifyUserId = teacher?.user_id;
      notificationType = 'assignment_viewed';
    } else if (to_status === 'submitted') {
      // Notify teacher when student submits
      const { data: teacher } = await supabaseAdmin
        .from('teachers')
        .select('user_id')
        .eq('id', assignment.created_by_teacher_id)
        .single();
      notifyUserId = teacher?.user_id;
      notificationType = 'assignment_submitted';
    } else if (to_status === 'reviewed' || to_status === 'completed') {
      // Notify student when teacher reviews/completes
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('user_id')
        .eq('id', assignment.student_id)
        .single();
      notifyUserId = student?.user_id;
      notificationType = to_status === 'reviewed' ? 'assignment_reviewed' : 'assignment_completed';
    } else if (to_status === 'reopened') {
      // Notify student when assignment is reopened
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('user_id')
        .eq('id', assignment.student_id)
        .single();
      notifyUserId = student?.user_id;
      notificationType = 'assignment_reopened';
    }

    if (notifyUserId) {
      await supabaseAdmin.from('notifications').insert({
        school_id: assignment.school_id,
        user_id: notifyUserId,
        channel: 'in_app',
        type: notificationType,
        payload: {
          assignment_id: assignmentId,
          assignment_title: assignment.title,
          status: to_status,
          actor_name: profile.display_name || 'Someone',
        },
        sent_at: new Date().toISOString(),
      });
    }

    // 12. Return response
    return NextResponse.json<TransitionAssignmentResponse>(
      {
        success: true,
        assignment: updatedAssignment,
        event_id: event?.id || '',
        message: `Assignment status changed from ${assignment.status} to ${to_status}`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/assignments/:id/transition:', error);
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
