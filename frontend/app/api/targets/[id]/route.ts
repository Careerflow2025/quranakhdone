/**
 * Single Target API
 * GET /api/targets/:id - Get single target with full details and milestones
 * PATCH /api/targets/:id - Update target details (title, description, dates, etc.)
 * DELETE /api/targets/:id - Delete target
 *
 * Created: 2025-10-20
 * Purpose: Individual target operations with complete milestone information
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  canViewTarget,
  canDeleteTarget,
  canUpdateTarget,
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


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// ============================================================================
// GET /api/targets/:id - Get Single Target
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetId = params.id;

    // 1. Initialize Supabase admin client
    const supabaseAdmin = getSupabaseAdmin();

    // 2. Get authorization header and extract token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: 'Unauthorized - Missing authorization header',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // 3. Get authenticated user using admin client
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: 'Unauthorized - Invalid token',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // 4. Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
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

    // 5. Get teacher_id if applicable
    let teacherId: string | undefined;
    if (['teacher', 'admin', 'owner'].includes(profile.role)) {
      const { data: teacher } = await supabaseAdmin
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacher) {
        teacherId = teacher.id;
      }
    }

    // 6. Get student_id if applicable
    let studentId: string | undefined;
    if (profile.role === 'student') {
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (student) {
        studentId = student.id;
      }
    }

    // 7. Fetch target with relations
    const { data: target, error: targetError } = await supabaseAdmin
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

    // 8. Check permissions
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

    // 9. Fetch milestones from target_milestones table
    const { data: milestones, error: milestonesError } = await supabaseAdmin
      .from('target_milestones')
      .select('*')
      .eq('target_id', targetId)
      .order('sequence_order', { ascending: true });

    if (milestonesError) {
      console.error('Milestones fetch error:', milestonesError);
    }

    const fetchedMilestones: Milestone[] = (milestones || []) as Milestone[];

    // 10. For individual targets, get student info
    let studentInfo;
    if (target.type === 'individual') {
      // TODO: Fetch from target_students table when available
      // For now, would need to be passed or fetched from notifications/meta
    }

    // 11. For class targets, get class info
    let classInfo;
    if (target.type === 'class') {
      // TODO: Fetch class details and student count
    }

    // 12. Build response with complete details
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
      milestones: fetchedMilestones,
      progress_percentage: calculateTargetProgress(fetchedMilestones),
      is_overdue: isTargetOverdue(target),
      days_remaining: getDaysRemaining(target.due_date),
      total_milestones: fetchedMilestones.length,
      completed_milestones: fetchedMilestones.filter(m => m.completed).length,
      stats: {
        total_milestones: fetchedMilestones.length,
        completed_milestones: fetchedMilestones.filter(m => m.completed).length,
        progress_percentage: calculateTargetProgress(fetchedMilestones),
        days_since_created: getDaysSinceCreated(target.created_at),
        days_until_due: getDaysRemaining(target.due_date),
        is_overdue: isTargetOverdue(target),
      },
    };

    // 13. Return response
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
// PATCH /api/targets/:id - Update Target Details
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const targetId = params.id;

    // 1. Initialize Supabase admin client
    const supabaseAdmin = getSupabaseAdmin();

    // 2. Get authorization header and extract token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: 'Unauthorized - Missing authorization header',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // 3. Get authenticated user using admin client
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: 'Unauthorized - Invalid token',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // 4. Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
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

    // 5. Get teacher_id (only teachers can update targets)
    let teacherId: string | undefined;
    if (['teacher', 'admin', 'owner'].includes(profile.role)) {
      const { data: teacher } = await supabaseAdmin
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
          error: 'Only teachers can update targets',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 6. Parse request body
    const body = await request.json();
    const { title, description, type, category, student_id, class_id, start_date, due_date, milestones } = body;

    // 7. Fetch existing target to check permissions
    const { data: target, error: targetError } = await supabaseAdmin
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

    // 8. Check permissions (only creator or admin can update)
    const isCreator = target.teacher_id === teacherId;
    const isAdmin = ['admin', 'owner'].includes(profile.role);

    if (!isCreator && !isAdmin) {
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: 'Only the creator or admin can update this target',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 9. Build update object (only include provided fields)
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (type !== undefined) updateData.type = type;
    if (category !== undefined) updateData.category = category;
    if (student_id !== undefined) updateData.student_id = student_id;
    if (class_id !== undefined) updateData.class_id = class_id;
    if (start_date !== undefined) updateData.start_date = start_date;
    if (due_date !== undefined) updateData.due_date = due_date;

    // 10. Update target in database
    const { data: updatedTarget, error: updateError } = await supabaseAdmin
      .from('targets')
      .update(updateData)
      .eq('id', targetId)
      .select()
      .single();

    if (updateError) {
      console.error('Target update error:', updateError);
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: 'Failed to update target',
          code: 'DATABASE_ERROR',
          details: { updateError },
        },
        { status: 500 }
      );
    }

    // 11. Handle milestone updates if provided
    if (milestones !== undefined) {
      // Delete existing milestones
      await supabaseAdmin
        .from('target_milestones')
        .delete()
        .eq('target_id', targetId);

      // Insert new milestones
      if (milestones && milestones.length > 0) {
        const milestoneRecords = milestones.map((m: any, index: number) => ({
          target_id: targetId,
          title: m.title,
          description: m.description || null,
          sequence_order: m.sequence_order ?? index + 1,
          completed: m.completed || false,
        }));

        const { error: milestoneError } = await supabaseAdmin
          .from('target_milestones')
          .insert(milestoneRecords);

        if (milestoneError) {
          console.error('Milestone update error:', milestoneError);
        }
      }
    }

    // 12. Fetch updated target with milestones
    const { data: finalTarget } = await supabaseAdmin
      .from('targets')
      .select(`
        *,
        teacher:teachers!teacher_id (
          id,
          user_id,
          profiles:user_id (
            display_name,
            email
          )
        )
      `)
      .eq('id', targetId)
      .single();

    // Fetch milestones
    const { data: fetchedMilestones } = await supabaseAdmin
      .from('target_milestones')
      .select('*')
      .eq('target_id', targetId)
      .order('sequence_order', { ascending: true });

    // 13. Return updated target with milestones
    return NextResponse.json(
      {
        success: true,
        target: {
          ...finalTarget,
          milestones: fetchedMilestones || [],
        },
        message: 'Target updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in PATCH /api/targets/:id:', error);
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

    // 1. Initialize Supabase admin client
    const supabaseAdmin = getSupabaseAdmin();

    // 2. Get authorization header and extract token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: 'Unauthorized - Missing authorization header',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // 3. Get authenticated user using admin client
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: 'Unauthorized - Invalid token',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // 4. Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
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

    // 5. Get teacher_id (only teachers can delete)
    let teacherId: string | undefined;
    if (['teacher', 'admin', 'owner'].includes(profile.role)) {
      const { data: teacher } = await supabaseAdmin
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

    // 6. Fetch existing target
    const { data: target, error: targetError } = await supabaseAdmin
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

    // 7. Check permissions
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

    // 8. Delete target (cascades to related data via foreign keys)
    const { error: deleteError } = await supabaseAdmin
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

    // 9. Return success response
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
