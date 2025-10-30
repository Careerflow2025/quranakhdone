/**
 * Homework Reply/Note API
 * POST /api/homework/:id/reply - Add text or audio note to homework
 *
 * Created: 2025-10-20
 * Purpose: Teachers add feedback notes (text or audio) to homework
 * Business rules: Only teachers can add replies, notes stored in notes table
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  validateAddHomeworkReplyRequest,
  canReplyToHomework,
} from '@/lib/validators/homework';
import {
  AddHomeworkReplyResponse,
  HomeworkErrorResponse,
} from '@/lib/types/homework';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// ============================================================================
// POST /api/homework/:id/reply - Add Note/Reply
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const homeworkId = params.id;

    // 1. Initialize Supabase admin client
    const supabaseAdmin = getSupabaseAdmin();

    // 2. Get Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json<HomeworkErrorResponse>(
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
      return NextResponse.json<HomeworkErrorResponse>(
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
      return NextResponse.json<HomeworkErrorResponse>(
        {
          success: false,
          error: 'User profile not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 4. Get teacher_id (only teachers can add replies)
    let teacherId: string | undefined;
    if (['teacher', 'admin', 'owner'].includes(profile.role)) {
      const { data: teacher, error: teacherError } = await supabaseAdmin
        .from('teachers')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (teacher) {
        teacherId = teacher.id;
      }
    }

    if (!teacherId) {
      return NextResponse.json<HomeworkErrorResponse>(
        {
          success: false,
          error: 'Only teachers can add notes to homework',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 5. Validate request body
    const body = await request.json();
    const validation = validateAddHomeworkReplyRequest(body);

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

    const { type, text, audio_url } = validation.data;

    // 6. Fetch existing homework
    const { data: homework, error: homeworkError } = await supabaseAdmin
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
    const hasPermission = canReplyToHomework(
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
          error: 'Insufficient permissions to add notes to this homework',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 9. Insert note into notes table
    const { data: note, error: insertError } = await supabaseAdmin
      .from('notes')
      .insert({
        highlight_id: homeworkId,
        author_user_id: user.id,
        type: type,
        text: type === 'text' ? text : null,
        audio_url: type === 'audio' ? audio_url : null,
      })
      .select()
      .single();

    if (insertError || !note) {
      console.error('Note creation error:', insertError);
      return NextResponse.json<HomeworkErrorResponse>(
        {
          success: false,
          error: 'Failed to create note',
          code: 'DATABASE_ERROR',
          details: { insertError },
        },
        { status: 500 }
      );
    }

    // 10. Get student info for notification
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('user_id')
      .eq('id', homework.student_id)
      .single();

    // 11. Create notification for student
    if (student) {
      await supabaseAdmin.from('notifications').insert({
        school_id: homework.school_id,
        user_id: student.user_id,
        channel: 'in_app',
        type: 'homework_note_added',
        payload: {
          homework_id: homeworkId,
          note_id: note.id,
          teacher_name: profile.display_name || 'Your teacher',
          note_type: type,
          surah: homework.surah,
          ayah_start: homework.ayah_start,
          ayah_end: homework.ayah_end,
        },
        sent_at: new Date().toISOString(),
      });

      // Also send email notification for text notes
      if (type === 'text') {
        await supabaseAdmin.from('notifications').insert({
          school_id: homework.school_id,
          user_id: student.user_id,
          channel: 'email',
          type: 'homework_note_added',
          payload: {
            homework_id: homeworkId,
            note_id: note.id,
            teacher_name: profile.display_name || 'Your teacher',
            note_text: text,
            surah: homework.surah,
            ayah_start: homework.ayah_start,
            ayah_end: homework.ayah_end,
          },
          sent_at: null, // Will be sent by background worker
        });
      }
    }

    // 12. Return response
    return NextResponse.json<AddHomeworkReplyResponse>(
      {
        success: true,
        note: {
          id: note.id,
          text: note.text,
          audio_url: note.audio_url,
          type: note.type as 'text' | 'audio',
          created_at: note.created_at,
        },
        message: `${type === 'text' ? 'Text' : 'Audio'} note added successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/homework/:id/reply:', error);
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
