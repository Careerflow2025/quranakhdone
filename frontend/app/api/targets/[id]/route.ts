/**
 * Single Target API
 * GET /api/targets/:id - Get single target with full details and milestones
 * DELETE /api/targets/:id - Delete target
 *
 * Created: 2025-10-20
 * Purpose: Individual target operations with complete milestone information
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  canViewTarget,
  canDeleteTarget,
} from '@/lib/validators/targets';
import {
  GetTargetResponse,
  DeleteTargetResponse,
  TargetErrorResponse,
  TargetWithDetails,
  calculateTargetProgress,
  getDaysRemaining,
  getDaysSinceCreated,
  isTargetOverdue,
  Milestone,
} from '@/lib/types/targets';

// ============================================================================
// GET /api/targets/:id - Get Single Target
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetId = params.id;

    // 1. Initialize Supabase client with auth
    const supabase = createClient();

    // 2. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<TargetErrorResponse>(
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
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: 'User profile not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 4. Get teacher_id if applicable
    let teacherId: string | undefined;
    if (['teacher', 'admin', 'owner'].includes(profile.role)) {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacher) {
        teacherId = teacher.id;
      }
    }

    // 5. Get student_id if applicable
    let studentId: string | undefined;
    if (profile.role === 'student') {
      const { data: student } = await supabase
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (student) {
        studentId = student.id;
      }
    }

    // 6. Fetch target with relations
    const { data: target, error: targetError } = await supabase
      .from('targets')
      .select(
        `
        *,
        teacher:teachers!teacher_id (
          id,
          user_id,
          profiles:user_id (
            display_name,
            email
          )
        )
      `
      )
      .eq('id', targetId)
      .single();

    if (targetError || !target) {
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: 'Target not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 7. Check permissions
    const hasPermission = canViewTarget(
      {
        userId: user.id,
        userRole: profile.role,
        schoolId: profile.school_id,
        teacherId,
        studentId,
      },
      {
        targetSchoolId: target.school_id,
        targetTeacherId: target.teacher_id,
        targetType: target.type,
        // For individual targets, we'd need to fetch student_id from target_students table
        // For now, class/school targets are viewable by all in school
      }
    );

    if (!hasPermission) {
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to view this target',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 8. Fetch milestones (from JSONB meta field or separate table when available)
    // TODO: Replace with actual milestone fetching logic
    const milestones: Milestone[] = [];

    // 9. For individual targets, get student info
    let studentInfo;
    if (target.type === 'individual') {
      // TODO: Fetch from target_students table when available
      // For now, would need to be passed or fetched from notifications/meta
    }

    // 10. For class targets, get class info
    let classInfo;
    if (target.type === 'class') {
      // TODO: Fetch class details and student count
    }

    // 11. Build response with complete details
    const targetWithDetails: TargetWithDetails = {
      ...target,
      teacher: target.teacher
        ? {
            id: target.teacher.id,
            display_name: target.teacher.profiles?.display_name || 'Unknown',
            email: target.teacher.profiles?.email || '',
          }
        : undefined,
      student: studentInfo,
      class: classInfo,
      milestones,
      progress_percentage: calculateTargetProgress(milestones),
      is_overdue: isTargetOverdue(target),
      days_remaining: getDaysRemaining(target.due_date),
      total_milestones: milestones.length,
      completed_milestones: milestones.filter(m => m.completed).length,
      stats: {
        total_milestones: milestones.length,
        completed_milestones: milestones.filter(m => m.completed).length,
        progress_percentage: calculateTargetProgress(milestones),
        days_since_created: getDaysSinceCreated(target.created_at),
        days_until_due: getDaysRemaining(target.due_date),
        is_overdue: isTargetOverdue(target),
      },
    };

    // 12. Return response
    return NextResponse.json<GetTargetResponse>(
      {
        success: true,
        target: targetWithDetails,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/targets/:id:', error);
    return NextResponse.json<TargetErrorResponse>(
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
// DELETE /api/targets/:id - Delete Target
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetId = params.id;

    // 1. Initialize Supabase client with auth
    const supabase = createClient();

    // 2. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<TargetErrorResponse>(
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
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: 'User profile not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 4. Get teacher_id (only teachers can delete)
    let teacherId: string | undefined;
    if (['teacher', 'admin', 'owner'].includes(profile.role)) {
      const { data: teacher } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacher) {
        teacherId = teacher.id;
      }
    }

    if (!teacherId) {
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: 'Only teachers can delete targets',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 5. Fetch existing target
    const { data: target, error: targetError } = await supabase
      .from('targets')
      .select('*')
      .eq('id', targetId)
      .single();

    if (targetError || !target) {
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: 'Target not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 6. Check permissions
    const hasPermission = canDeleteTarget(
      {
        userId: user.id,
        userRole: profile.role,
        schoolId: profile.school_id,
        teacherId,
      },
      {
        targetSchoolId: target.school_id,
        targetTeacherId: target.teacher_id,
        targetType: target.type,
      }
    );

    if (!hasPermission) {
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to delete this target',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 7. Delete target (cascades to related data via foreign keys)
    const { error: deleteError } = await supabase
      .from('targets')
      .delete()
      .eq('id', targetId);

    if (deleteError) {
      console.error('Target deletion error:', deleteError);
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: 'Failed to delete target',
          code: 'DATABASE_ERROR',
          details: { deleteError },
        },
        { status: 500 }
      );
    }

    // 8. Return success response
    return NextResponse.json<DeleteTargetResponse>(
      {
        success: true,
        message: 'Target deleted successfully',
        deleted_target_id: targetId,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in DELETE /api/targets/:id:', error);
    return NextResponse.json<TargetErrorResponse>(
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
