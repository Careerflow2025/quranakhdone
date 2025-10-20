/**
 * Homework Completion API
 * PATCH /api/homework/:id/complete - Complete homework (green → gold transition)
 *
 * Created: 2025-10-20
 * Purpose: Teachers mark homework as completed, transitioning color from green to gold
 * Business rules: Must be green (pending), sets completed_at, completed_by, changes to gold
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  validateCompleteHomeworkRequest,
  validateCompletion,
  canCompleteHomework,
} from '@/lib/validators/homework';
import {
  CompleteHomeworkResponse,
  HomeworkErrorResponse,
  Homework,
  getHomeworkStatus,
} from '@/lib/types/homework';

// ============================================================================
// PATCH /api/homework/:id/complete - Complete Homework
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const homeworkId = params.id;

    // 1. Initialize Supabase client with auth
    const supabase = createClient();

    // 2. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<HomeworkErrorResponse>(
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
      return NextResponse.json<HomeworkErrorResponse>(
        {
          success: false,
          error: 'User profile not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 4. Get teacher_id (only teachers can complete homework)
    let teacherId: string | undefined;
    if (['teacher', 'admin', 'owner'].includes(profile.role)) {
      const { data: teacher, error: teacherError } = await supabase
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacher) {
        teacherId = teacher.id;
      }
    }

    // 5. Validate request body (optional completion_note)
    const body = await request.json().catch(() => ({}));
    const validation = validateCompleteHomeworkRequest(body);

    if (!validation.success) {
      return NextResponse.json<HomeworkErrorResponse>(
        {
          success: false,
          error: validation.error || 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { errors: validation.errors },
        },
        { status: 400 }
      );
    }

    const { completed_by, completion_note } = validation.data;

    // 6. Fetch existing homework
    const { data: homework, error: homeworkError } = await supabase
      .from('highlights')
      .select('*')
      .eq('id', homeworkId)
      .single();

    if (homeworkError || !homework) {
      return NextResponse.json<HomeworkErrorResponse>(
        {
          success: false,
          error: 'Homework not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 7. Verify this is actually homework (green or gold)
    if (!['green', 'gold'].includes(homework.color)) {
      return NextResponse.json<HomeworkErrorResponse>(
        {
          success: false,
          error: 'This highlight is not homework',
          code: 'NOT_HOMEWORK',
        },
        { status: 400 }
      );
    }

    // 8. Check permissions
    const hasPermission = canCompleteHomework(
      {
        userId: user.id,
        userRole: profile.role,
        schoolId: profile.school_id,
        teacherId,
      },
      {
        homeworkSchoolId: homework.school_id,
        homeworkTeacherId: homework.teacher_id,
        homeworkStudentId: homework.student_id,
      }
    );

    if (!hasPermission) {
      return NextResponse.json<HomeworkErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to complete this homework',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 9. Validate homework can be completed (business rule)
    const homeworkTyped: Homework = {
      ...homework,
      color: homework.color as 'green' | 'gold',
      status: getHomeworkStatus(homework.color as 'green' | 'gold'),
    };

    const completionValidation = validateCompletion(homeworkTyped);
    if (!completionValidation.valid) {
      return NextResponse.json<HomeworkErrorResponse>(
        {
          success: false,
          error: completionValidation.error || 'Cannot complete homework',
          code: 'ALREADY_COMPLETED',
        },
        { status: 400 }
      );
    }

    // 10. Update homework: green → gold transition
    const completedById = completed_by || user.id;
    const { data: updatedHomework, error: updateError } = await supabase
      .from('highlights')
      .update({
        color: 'gold', // Gold = completed homework
        previous_color: 'green', // Track the transition
        completed_at: new Date().toISOString(),
        completed_by: completedById,
        note: completion_note
          ? `${homework.note || ''}\n\nCompletion note: ${completion_note}`.trim()
          : homework.note,
        updated_at: new Date().toISOString(),
      })
      .eq('id', homeworkId)
      .select()
      .single();

    if (updateError || !updatedHomework) {
      console.error('Homework completion error:', updateError);
      return NextResponse.json<HomeworkErrorResponse>(
        {
          success: false,
          error: 'Failed to complete homework',
          code: 'DATABASE_ERROR',
          details: { updateError },
        },
        { status: 500 }
      );
    }

    // 11. Get student info for notification
    const { data: student } = await supabase
      .from('students')
      .select('user_id')
      .eq('id', homework.student_id)
      .single();

    // 12. Create notification for student
    if (student) {
      await supabase.from('notifications').insert({
        school_id: homework.school_id,
        user_id: student.user_id,
        channel: 'in_app',
        type: 'homework_completed',
        payload: {
          homework_id: homeworkId,
          teacher_name: profile.display_name || 'Your teacher',
          surah: homework.surah,
          ayah_start: homework.ayah_start,
          ayah_end: homework.ayah_end,
          completion_note: completion_note || null,
        },
        sent_at: new Date().toISOString(),
      });

      // Also send email notification
      await supabase.from('notifications').insert({
        school_id: homework.school_id,
        user_id: student.user_id,
        channel: 'email',
        type: 'homework_completed',
        payload: {
          homework_id: homeworkId,
          teacher_name: profile.display_name || 'Your teacher',
          surah: homework.surah,
          ayah_start: homework.ayah_start,
          ayah_end: homework.ayah_end,
        },
        sent_at: null, // Will be sent by background worker
      });
    }

    // 13. Transform to response format
    const homeworkResponse: Homework = {
      ...updatedHomework,
      color: updatedHomework.color as 'green' | 'gold',
      status: getHomeworkStatus(updatedHomework.color as 'green' | 'gold'),
    };

    // 14. Return response
    return NextResponse.json<CompleteHomeworkResponse>(
      {
        success: true,
        homework: homeworkResponse,
        message: 'Homework completed successfully',
        previous_color: 'green',
        new_color: 'gold',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in PATCH /api/homework/:id/complete:', error);
    return NextResponse.json<HomeworkErrorResponse>(
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
