/**
 * Target Progress Update API
 * PATCH /api/targets/:id/progress - Update target progress and status
 *
 * Created: 2025-10-20
 * Purpose: Teachers update target progress manually or change status (complete/cancel)
 * Business rules: Can update progress percentage, change to completed/cancelled status
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  validateUpdateTargetProgressRequest,
  validateCompletion,
  validateCancellation,
  canUpdateTarget,
} from '@/lib/validators/targets';
import {
  UpdateTargetProgressResponse,
  TargetErrorResponse,
  Target,
} from '@/lib/types/targets';

// ============================================================================
// PATCH /api/targets/:id/progress - Update Progress
// ============================================================================

export async function PATCH(
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

    // 4. Get teacher_id (only teachers can update progress)
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
          error: 'Only teachers can update target progress',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 5. Validate request body
    const body = await request.json();
    const validation = validateUpdateTargetProgressRequest(body);

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

    const { progress_percentage, status, completed_by } = validation.data;

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
    const hasPermission = canUpdateTarget(
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
          error: 'Insufficient permissions to update this target',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 8. Validate status transitions
    if (status === 'completed') {
      const completionValidation = validateCompletion(target);
      if (!completionValidation.valid) {
        return NextResponse.json<TargetErrorResponse>(
          {
            success: false,
            error: completionValidation.error || 'Cannot complete target',
            code: 'INVALID_STATUS',
          },
          { status: 400 }
        );
      }
    }

    if (status === 'cancelled') {
      const cancellationValidation = validateCancellation(target);
      if (!cancellationValidation.valid) {
        return NextResponse.json<TargetErrorResponse>(
          {
            success: false,
            error: cancellationValidation.error || 'Cannot cancel target',
            code: 'INVALID_STATUS',
          },
          { status: 400 }
        );
      }
    }

    // 9. Build update object
    const updateData: any = {};

    if (progress_percentage !== undefined) {
      updateData.progress_percentage = progress_percentage;
    }

    if (status) {
      updateData.status = status;

      if (status === 'completed') {
        updateData.completed_at = new Date().toISOString();
        // Set progress to 100% when completing
        if (progress_percentage === undefined) {
          updateData.progress_percentage = 100;
        }
      }
    }

    // 10. Update target
    const { data: updatedTarget, error: updateError } = await supabase
      .from('targets')
      .update(updateData)
      .eq('id', targetId)
      .select()
      .single();

    if (updateError || !updatedTarget) {
      console.error('Target progress update error:', updateError);
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: 'Failed to update target progress',
          code: 'DATABASE_ERROR',
          details: { updateError },
        },
        { status: 500 }
      );
    }

    // 11. Create notification if status changed
    if (status) {
      // For individual targets, notify student
      if (target.type === 'individual') {
        // TODO: Fetch student_id from target_students table
        // For now, would need to be passed or fetched from meta
      }

      // For class targets, notify all students in class
      if (target.type === 'class') {
        // TODO: Fetch all students in class and create notifications
      }

      // For school targets, could notify via dashboard/announcements
    }

    // 12. Return response
    const message = status
      ? `Target ${status} successfully`
      : 'Target progress updated successfully';

    return NextResponse.json<UpdateTargetProgressResponse>(
      {
        success: true,
        target: updatedTarget,
        message,
        previous_progress: target.progress_percentage,
        new_progress: updatedTarget.progress_percentage,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in PATCH /api/targets/:id/progress:', error);
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
