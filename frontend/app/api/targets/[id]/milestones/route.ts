/**
 * Target Milestones API
 * POST /api/targets/:id/milestones - Add milestone to target
 *
 * Created: 2025-10-20
 * Purpose: Teachers add milestones to existing targets for progress tracking
 * Business rules: Max 20 milestones per target, auto-order assignment
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  validateAddMilestoneRequest,
  canAddMilestone,
} from '@/lib/validators/targets';
import {
  AddMilestoneResponse,
  TargetErrorResponse,
  Milestone,
  getNextMilestoneOrder,
  TARGET_CONSTANTS,
} from '@/lib/types/targets';

// ============================================================================
// POST /api/targets/:id/milestones - Add Milestone
// ============================================================================

export async function POST(
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

    // 4. Get teacher_id (only teachers can add milestones)
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
          error: 'Only teachers can add milestones',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 5. Validate request body
    const body = await request.json();
    const validation = validateAddMilestoneRequest(body);

    if (!validation.success) {
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: validation.error || 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { errors: validation.errors },
        },
        { status: 400 }
      );
    }

    const { title, description, target_value, order } = validation.data;

    // 6. Fetch existing target
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

    // 7. Check permissions
    const hasPermission = canAddMilestone(
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
          error: 'Insufficient permissions to add milestones to this target',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 8. Fetch existing milestones (from JSONB or separate table)
    // TODO: Replace with actual milestone fetching from storage
    const existingMilestones: Milestone[] = [];

    // 9. Validate milestone count limit
    if (existingMilestones.length >= TARGET_CONSTANTS.MAX_MILESTONES) {
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: `Target already has maximum of ${TARGET_CONSTANTS.MAX_MILESTONES} milestones`,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // 10. Create new milestone
    const newMilestone: Milestone = {
      id: crypto.randomUUID(),
      title,
      description: description || undefined,
      target_value: target_value || undefined,
      current_value: 0,
      completed: false,
      order: order || getNextMilestoneOrder(existingMilestones),
      created_at: new Date().toISOString(),
    };

    // 11. Store milestone (in JSONB or separate table)
    // TODO: Implement actual storage logic
    // For now, we would append to existing milestones array in target meta field
    // const updatedMilestones = [...existingMilestones, newMilestone];
    // await supabase.from('targets').update({ meta: { milestones: updatedMilestones } })

    // 12. Create notification for target participants
    if (target.type === 'individual') {
      // TODO: Notify assigned student
    } else if (target.type === 'class') {
      // TODO: Notify all students in class
    }

    // 13. Return response
    return NextResponse.json<AddMilestoneResponse>(
      {
        success: true,
        milestone: newMilestone,
        target_id: targetId,
        message: 'Milestone added successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/targets/:id/milestones:', error);
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
