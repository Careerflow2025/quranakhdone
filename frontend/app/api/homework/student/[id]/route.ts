/**
 * Student Homework Summary API
 * GET /api/homework/student/:id - Get all homework for a specific student
 *
 * Created: 2025-10-20
 * Purpose: Comprehensive student homework view with statistics
 * Returns: Pending homework, completed homework, and detailed statistics
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createBrowserClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase-server';
import {
  GetStudentHomeworkResponse,
  HomeworkErrorResponse,
  HomeworkWithDetails,
  getHomeworkStatus,
  countTotalAyahs,
  calculateCompletionRate,
} from '@/lib/types/homework';

// ============================================================================
// GET /api/homework/student/:id - Get Student Homework
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;

    // 1. Check for Bearer token authentication (for API tests)
    const authHeader = request.headers.get('authorization');
    let supabase;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      // Use direct Supabase client with Bearer token (for API tests)
      const token = authHeader.replace('Bearer ', '');
      supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          global: {
            headers: {
              Authorization: `Bearer ${token}`
            }
          }
        }
      );
    } else {
      // Use cookie-based auth (for browser sessions)
      supabase = createClient();
    }

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
      .select('user_id, school_id, role')
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

    // 4. Verify student exists and get their user_id
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('id, user_id')
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      return NextResponse.json<HomeworkErrorResponse>(
        {
          success: false,
          error: 'Student not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 5. Verify student is in same school
    const { data: studentProfile, error: studentProfileError } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('user_id', student.user_id)
      .single();

    if (studentProfileError || !studentProfile) {
      return NextResponse.json<HomeworkErrorResponse>(
        {
          success: false,
          error: 'Student profile not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    if (studentProfile.school_id !== profile.school_id) {
      return NextResponse.json<HomeworkErrorResponse>(
        {
          success: false,
          error: 'Cannot access homework for student in different school',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 6. Check permissions - teachers, admins, owners, the student themselves, or parents
    const isStudent = profile.user_id === student.user_id;
    const isTeacherOrAdmin = ['teacher', 'admin', 'owner'].includes(profile.role);

    // Check if user is a parent of this student
    let isParent = false;
    if (profile.role === 'parent') {
      const { data: parentRecord } = await supabase
        .from('parents')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (parentRecord) {
        const { data: parentStudent } = await supabase
          .from('parent_students')
          .select('student_id')
          .eq('parent_id', parentRecord.id)
          .eq('student_id', studentId)
          .single();

        isParent = !!parentStudent;
      }
    }

    if (!isStudent && !isTeacherOrAdmin && !isParent) {
      return NextResponse.json<HomeworkErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to view this student\'s homework',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 7. Fetch all homework for student (both pending and completed)
    const { data: allHomework, error: homeworkError } = await supabase
      .from('highlights')
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
        ),
        notes (
          id,
          author_user_id,
          type,
          text,
          audio_url,
          created_at,
          author:profiles!author_user_id (
            display_name
          )
        )
      `
      )
      .eq('student_id', studentId)
      .in('color', ['green', 'gold'])
      .order('created_at', { ascending: false });

    if (homeworkError) {
      console.error('Homework query error:', homeworkError);
      return NextResponse.json<HomeworkErrorResponse>(
        {
          success: false,
          error: 'Failed to fetch homework',
          code: 'DATABASE_ERROR',
          details: { homeworkError },
        },
        { status: 500 }
      );
    }

    // 8. Separate pending and completed homework
    const pending: HomeworkWithDetails[] = [];
    const completed: HomeworkWithDetails[] = [];

    (allHomework || []).forEach((hw: any) => {
      const color = hw.color as 'green' | 'gold';
      const status = getHomeworkStatus(color);

      const homeworkWithDetails: HomeworkWithDetails = {
        ...hw,
        color,
        status,
        student: {
          id: studentId,
          display_name: studentProfile.display_name || 'Student',
          email: studentProfile.email || '',
        },
        teacher: hw.teacher
          ? {
              id: hw.teacher.id,
              display_name: hw.teacher.profiles?.display_name || 'Unknown',
              email: hw.teacher.profiles?.email || '',
            }
          : undefined,
        notes: (hw.notes || []).map((note: any) => ({
          id: note.id,
          teacher_id: note.author_user_id,
          teacher_name: note.author?.display_name || 'Unknown',
          text: note.text,
          audio_url: note.audio_url,
          type: note.type as 'text' | 'audio',
          created_at: note.created_at,
        })),
        is_overdue: false, // TODO: Implement if due_date added
      };

      if (color === 'green') {
        pending.push(homeworkWithDetails);
      } else {
        completed.push(homeworkWithDetails);
      }
    });

    // 9. Calculate statistics
    const total_pending = pending.length;
    const total_completed = completed.length;
    const total_homework = total_pending + total_completed;
    const completion_rate = calculateCompletionRate(total_homework, total_completed);
    const total_ayahs_assigned = countTotalAyahs([...pending, ...completed]);
    const total_ayahs_completed = countTotalAyahs(completed);

    // 10. Return response
    return NextResponse.json<GetStudentHomeworkResponse>(
      {
        success: true,
        pending_homework: pending,
        completed_homework: completed,
        stats: {
          total_pending,
          total_completed,
          completion_rate,
          total_ayahs_assigned,
          total_ayahs_completed,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/homework/student/:id:', error);
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
