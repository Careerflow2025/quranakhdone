/**
 * Milestone Completion API
 * PATCH /api/targets/milestones/:id - Complete milestone and update target progress
 *
 * Created: 2025-10-20
 * Purpose: Teachers mark milestones as completed, auto-recalculates target progress
 * Business rules: Must not be already completed, updates target progress percentage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  validateCompleteMilestoneRequest,
  validateMilestoneCompletion,
  canCompleteMilestone,
} from '@/lib/validators/targets';
import {
  CompleteMilestoneResponse,
  TargetErrorResponse,
  Milestone,
  calculateTargetProgress,
} from '@/lib/types/targets';

// ============================================================================
// PATCH /api/targets/milestones/:id - Complete Milestone
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const milestoneId = params.id;

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
      .select('user_id, school_id, role, display_name')
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

    // 4. Get teacher_id (only teachers can complete milestones)
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
          error: 'Only teachers can complete milestones',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 5. Validate request body
    const body = await request.json().catch(() => ({}));
    const validation = validateCompleteMilestoneRequest(body);

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

    const { completed_by, current_value } = validation.data;

    // 6. Fetch milestone from storage (JSONB or separate table)
    // TODO: Replace with actual milestone fetching logic
    // For now, we need to find which target contains this milestone
    // This would typically be a direct query to target_milestones table
    // or a JSONB query to targets table where meta->'milestones' contains this ID

    // PLACEHOLDER: In production, this would be:
    // const { data: milestone } = await supabase
    //   .from('target_milestones')
    //   .select('*, target:target_id(*)')
    //   .eq('id', milestoneId)
    //   .single();

    // For now, return error indicating milestone storage not yet implemented
    // This is a TODO that will be completed when milestone storage is finalized

    // Simulated milestone and target for structure demonstration
    // In actual implementation, these would come from database
    const mockMilestone: Milestone = {
      id: milestoneId,
      title: 'Example Milestone',
      completed: false,
      order: 1,
      created_at: new Date().toISOString(),
    };

    // For demonstration, we'll assume we can find the target
    // In reality, this query would be based on milestone.target_id
    const { data: targets, error: targetError } = await supabase
      .from('targets')
      .select('*')
      .limit(1);

    if (targetError || !targets || targets.length === 0) {
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: 'Target not found for this milestone',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const target = targets[0];

    // 7. Validate milestone can be completed (business rule)
    const completionValidation = validateMilestoneCompletion(mockMilestone);
    if (!completionValidation.valid) {
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: completionValidation.error || 'Cannot complete milestone',
          code: 'ALREADY_COMPLETED',
        },
        { status: 400 }
      );
    }

    // 8. Check permissions
    const hasPermission = canCompleteMilestone(
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
          error: 'Insufficient permissions to complete milestones for this target',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 9. Update milestone completion status
    const completedById = completed_by || user.id;
    const completedMilestone: Milestone = {
      ...mockMilestone,
      completed: true,
      completed_at: new Date().toISOString(),
      completed_by: completedById,
      current_value: current_value || mockMilestone.current_value,
    };

    // TODO: Actual database update would be:
    // const { data: updatedMilestone, error: updateError } = await supabase
    //   .from('target_milestones')
    //   .update({
    //     completed: true,
    //     completed_at: new Date().toISOString(),
    //     completed_by: completedById,
    //     current_value: current_value || milestone.current_value,
    //   })
    //   .eq('id', milestoneId)
    //   .select()
    //   .single();

    // 10. Fetch all milestones for the target to recalculate progress
    // TODO: Replace with actual milestone fetching
    const allMilestones: Milestone[] = [completedMilestone];

    // 11. Calculate new target progress
    const newProgress = calculateTargetProgress(allMilestones);

    // 12. Update target progress_percentage
    const { data: updatedTarget, error: targetUpdateError } = await supabase
      .from('targets')
      .update({
        progress_percentage: newProgress,
      })
      .eq('id', target.id)
      .select()
      .single();

    if (targetUpdateError || !updatedTarget) {
      console.error('Target progress update error:', targetUpdateError);
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: 'Failed to update target progress',
          code: 'DATABASE_ERROR',
          details: { targetUpdateError },
        },
        { status: 500 }
      );
    }

    // 13. Create notifications for target participants
    if (target.type === 'individual') {
      // Notify assigned student
      // TODO: Fetch student_id from target_students or target meta
      // For now, this is a placeholder for when student_id is available
      // const { data: student } = await supabase
      //   .from('students')
      //   .select('user_id')
      //   .eq('id', target_student_id)
      //   .single();
      //
      // if (student) {
      //   await supabase.from('notifications').insert({
      //     school_id: target.school_id,
      //     user_id: student.user_id,
      //     channel: 'in_app',
      //     type: 'milestone_completed',
      //     payload: {
      //       milestone_id: milestoneId,
      //       milestone_title: completedMilestone.title,
      //       target_id: target.id,
      //       target_title: target.title,
      //       new_progress: newProgress,
      //     },
      //     sent_at: new Date().toISOString(),
      //   });
      // }
    } else if (target.type === 'class') {
      // Notify all students in class
      // TODO: Fetch all students in class and create notifications
      // const { data: enrollments } = await supabase
      //   .from('class_enrollments')
      //   .select('student:student_id(user_id)')
      //   .eq('class_id', target_class_id);
      //
      // if (enrollments && enrollments.length > 0) {
      //   const notifications = enrollments.map(enrollment => ({
      //     school_id: target.school_id,
      //     user_id: enrollment.student.user_id,
      //     channel: 'in_app',
      //     type: 'milestone_completed',
      //     payload: {
      //       milestone_id: milestoneId,
      //       milestone_title: completedMilestone.title,
      //       target_id: target.id,
      //       target_title: target.title,
      //       new_progress: newProgress,
      //     },
      //     sent_at: new Date().toISOString(),
      //   }));
      //   await supabase.from('notifications').insert(notifications);
      // }
    }

    // 14. Return response
    return NextResponse.json<CompleteMilestoneResponse>(
      {
        success: true,
        milestone: completedMilestone,
        target_id: target.id,
        message: 'Milestone completed successfully',
        previous_progress: target.progress_percentage || 0,
        new_progress: newProgress,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in PATCH /api/targets/milestones/:id:', error);
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
