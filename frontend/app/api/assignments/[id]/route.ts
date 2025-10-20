/**
 * Single Assignment API Endpoints
 * GET /api/assignments/:id - Get single assignment with full details
 * PATCH /api/assignments/:id - Update assignment
 * DELETE /api/assignments/:id - Delete assignment
 *
 * Created: 2025-10-20
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  validateUpdateAssignmentRequest,
  canViewAssignment,
  canUpdateAssignment,
  canDeleteAssignment,
  validateUpdate,
  validateDeletion,
} from '@/lib/validators/assignments';
import {
  GetAssignmentResponse,
  UpdateAssignmentResponse,
  DeleteAssignmentResponse,
  AssignmentErrorResponse,
  AssignmentWithDetails,
} from '@/lib/types/assignments';
import { Database } from '@/lib/database.types';

type AssignmentRow = Database['public']['Tables']['assignments']['Row'];

// ============================================================================
// GET /api/assignments/:id - Get Single Assignment
// ============================================================================

export async function GET(
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

    // 3. Get user profile with school_id and role
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

    // 4. Get user's teacher_id and student_id if applicable
    let teacherId: string | undefined;
    let studentId: string | undefined;

    if (profile.role === 'teacher') {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      teacherId = teacher?.id;
    }

    if (profile.role === 'student') {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();
      studentId = student?.id;
    }

    // 5. Fetch assignment with all related data
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select(
        `
        *,
        student:students!student_id (
          id,
          user_id,
          profiles:user_id (
            display_name,
            email
          )
        ),
        teacher:teachers!created_by_teacher_id (
          id,
          user_id,
          profiles:user_id (
            display_name,
            email
          )
        )
      `
      )
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: 'Assignment not found',
          code: 'NOT_FOUND',
          details: { assignmentError },
        },
        { status: 404 }
      );
    }

    // 6. Check permissions to view assignment
    const hasPermission = canViewAssignment(
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
      }
    );

    if (!hasPermission) {
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to view this assignment',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 7. Fetch submission data if exists
    const { data: submissions } = await supabase
      .from('assignment_submissions')
      .select('id, text, created_at')
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: false })
      .limit(1);

    const latestSubmission = submissions?.[0];

    // 8. Fetch attachments for submission
    let submissionAttachments: any[] = [];
    if (latestSubmission) {
      const { data: attachments } = await supabase
        .from('assignment_attachments')
        .select('id, url, mime_type')
        .eq('assignment_id', assignmentId);

      submissionAttachments = attachments || [];
    }

    // 9. Fetch grades if assignment is reviewed or completed
    let grades: any[] = [];
    if (['reviewed', 'completed'].includes(assignment.status)) {
      const { data: gradesData } = await supabase
        .from('grades')
        .select(
          `
          id,
          score,
          max_score,
          criterion:rubric_criteria!criterion_id (
            id,
            name
          )
        `
        )
        .eq('assignment_id', assignmentId)
        .eq('student_id', assignment.student_id);

      grades =
        gradesData?.map((grade: any) => ({
          id: grade.id,
          criterion_id: grade.criterion.id,
          criterion_name: grade.criterion.name,
          score: grade.score,
          max_score: grade.max_score,
        })) || [];
    }

    // 10. Fetch event history
    const { data: events } = await supabase
      .from('assignment_events')
      .select(
        `
        id,
        event_type,
        from_status,
        to_status,
        created_at,
        actor:profiles!actor_user_id (
          display_name
        )
      `
      )
      .eq('assignment_id', assignmentId)
      .order('created_at', { ascending: false });

    const eventHistory =
      events?.map((event: any) => ({
        id: event.id,
        event_type: event.event_type,
        from_status: event.from_status,
        to_status: event.to_status,
        actor_name: event.actor?.display_name || 'Unknown',
        created_at: event.created_at,
      })) || [];

    // 11. Build AssignmentWithDetails response
    const now = new Date();
    const dueDate = new Date(assignment.due_at);
    const isOverdue = dueDate < now && assignment.status !== 'completed';

    const assignmentWithDetails: AssignmentWithDetails = {
      ...assignment,
      student: {
        id: assignment.student.id,
        display_name: assignment.student.profiles?.display_name || 'Unknown',
        email: assignment.student.profiles?.email || '',
      },
      teacher: {
        id: assignment.teacher.id,
        display_name: assignment.teacher.profiles?.display_name || 'Unknown',
        email: assignment.teacher.profiles?.email || '',
      },
      submission: latestSubmission
        ? {
            id: latestSubmission.id,
            text: latestSubmission.text,
            created_at: latestSubmission.created_at,
            attachments: submissionAttachments.map((att) => ({
              id: att.id,
              url: att.url,
              mime_type: att.mime_type,
            })),
          }
        : undefined,
      grades: grades.length > 0 ? grades : undefined,
      events: eventHistory,
      is_overdue: isOverdue,
    };

    // 12. Return response
    return NextResponse.json<GetAssignmentResponse>(
      {
        success: true,
        assignment: assignmentWithDetails,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/assignments/:id:', error);
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
// PATCH /api/assignments/:id - Update Assignment
// ============================================================================

export async function PATCH(
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

    // 4. Get teacher_id if user is teacher
    let teacherId: string | undefined;
    if (profile.role === 'teacher') {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      teacherId = teacher?.id;
    }

    // 5. Fetch existing assignment
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

    // 6. Check permissions
    const hasPermission = canUpdateAssignment(
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
          error: 'Insufficient permissions to update this assignment',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 7. Validate assignment can be updated (business rule)
    const canUpdate = validateUpdate(assignment.status);
    if (!canUpdate.valid) {
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: canUpdate.error || 'Cannot update assignment',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 8. Validate request body
    const body = await request.json();
    const validation = validateUpdateAssignmentRequest(body);

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

    // 9. Update assignment
    const { data: updatedAssignment, error: updateError } = await supabase
      .from('assignments')
      .update({
        ...validation.data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', assignmentId)
      .select()
      .single();

    if (updateError || !updatedAssignment) {
      console.error('Assignment update error:', updateError);
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: 'Failed to update assignment',
          code: 'DATABASE_ERROR',
          details: { updateError },
        },
        { status: 500 }
      );
    }

    // 10. Create event for update
    await supabase.from('assignment_events').insert({
      assignment_id: assignmentId,
      event_type: 'updated',
      actor_user_id: user.id,
      from_status: assignment.status,
      to_status: assignment.status,
      meta: {
        updated_fields: Object.keys(validation.data),
      },
    });

    // 11. Return response
    return NextResponse.json<UpdateAssignmentResponse>(
      {
        success: true,
        assignment: updatedAssignment,
        message: 'Assignment updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in PATCH /api/assignments/:id:', error);
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
// DELETE /api/assignments/:id - Delete Assignment
// ============================================================================

export async function DELETE(
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

    // 4. Get teacher_id if user is teacher
    let teacherId: string | undefined;
    if (profile.role === 'teacher') {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();
      teacherId = teacher?.id;
    }

    // 5. Fetch existing assignment
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

    // 6. Check permissions
    const hasPermission = canDeleteAssignment(
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
          error: 'Insufficient permissions to delete this assignment',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 7. Validate assignment can be deleted (business rule)
    const canDelete = validateDeletion(assignment.status);
    if (!canDelete.valid) {
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: canDelete.error || 'Cannot delete assignment',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 8. Delete assignment (cascades to events, submissions, attachments via FK constraints)
    const { error: deleteError } = await supabase
      .from('assignments')
      .delete()
      .eq('id', assignmentId);

    if (deleteError) {
      console.error('Assignment deletion error:', deleteError);
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: 'Failed to delete assignment',
          code: 'DATABASE_ERROR',
          details: { deleteError },
        },
        { status: 500 }
      );
    }

    // 9. Return response
    return NextResponse.json<DeleteAssignmentResponse>(
      {
        success: true,
        message: 'Assignment deleted successfully',
        deleted_id: assignmentId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in DELETE /api/assignments/:id:', error);
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
