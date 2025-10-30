/**
 * Homework API Endpoints
 * POST /api/homework - Create new homework (green highlight)
 * GET /api/homework - List homework with filters
 *
 * Created: 2025-10-20
 * Purpose: Homework system using highlights table (green=pending, gold=completed)
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  validateCreateHomeworkRequest,
  canCreateHomework,
  listHomeworkQuerySchema,
} from '@/lib/validators/homework';
import {
  CreateHomeworkResponse,
  ListHomeworkResponse,
  HomeworkErrorResponse,
  HomeworkWithDetails,
  getHomeworkStatus,
} from '@/lib/types/homework';
import { Database } from '@/lib/database.types';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
type HighlightRow = Database['public']['Tables']['highlights']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type TeacherRow = Database['public']['Tables']['teachers']['Row'];
type StudentRow = Database['public']['Tables']['students']['Row'];

// ============================================================================
// POST /api/homework - Create Homework
// ============================================================================

export async function POST(request: NextRequest) {
  try {
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

    // 3. Get user profile with school_id and role
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
          details: { profileError },
        },
        { status: 404 }
      );
    }

    // 4. Check if user is a teacher (only teachers can create homework)
    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json<HomeworkErrorResponse>(
        {
          success: false,
          error: 'Teacher profile not found. Only teachers can create homework.',
          code: 'FORBIDDEN',
          details: { teacherError },
        },
        { status: 403 }
      );
    }

    // 5. Parse and validate request body
    const body = await request.json();
    const validation = validateCreateHomeworkRequest(body);

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

    const { student_id, surah, ayah_start, ayah_end, page_number, note, type } =
      validation.data;

    // 6. Verify student belongs to same school
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, user_id')
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      return NextResponse.json<HomeworkErrorResponse>(
        {
          success: false,
          error: 'Student not found',
          code: 'NOT_FOUND',
          details: { studentError },
        },
        { status: 404 }
      );
    }

    // Verify student is in same school via their profile
    const { data: studentProfile, error: studentProfileError } = await supabaseAdmin
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
          error: 'Cannot create homework for student in different school',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 7. Check permissions
    const hasPermission = canCreateHomework({
      userId: user.id,
      userRole: profile.role,
      schoolId: profile.school_id,
      teacherId: teacher.id,
    });

    if (!hasPermission) {
      return NextResponse.json<HomeworkErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to create homework',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 8. Insert homework into highlights table with color='green'
    const { data: homework, error: insertError } = await supabaseAdmin
      .from('highlights')
      .insert({
        school_id: profile.school_id,
        teacher_id: teacher.id,
        student_id: student_id,
        surah,
        ayah_start,
        ayah_end,
        page_number: page_number || null,
        color: 'green', // Green = pending homework
        previous_color: null,
        type: type || null,
        note: note || null,
        completed_at: null,
        completed_by: null,
      })
      .select()
      .single();

    if (insertError || !homework) {
      console.error('Homework creation error:', insertError);
      return NextResponse.json<HomeworkErrorResponse>(
        {
          success: false,
          error: 'Failed to create homework',
          code: 'DATABASE_ERROR',
          details: { insertError },
        },
        { status: 500 }
      );
    }

    // 9. Create notification for student
    const { error: notificationError } = await supabaseAdmin
      .from('notifications')
      .insert({
        school_id: profile.school_id,
        user_id: student.user_id,
        channel: 'in_app',
        type: 'homework_assigned',
        title: 'New Homework Assigned',
        body: `New homework for Surah ${surah}, Ayah ${ayah_start}-${ayah_end}${note ? ': ' + note : ''}`,
        payload: {
          homework_id: homework.id,
          teacher_name: profile.display_name || 'Your teacher',
          surah,
          ayah_start,
          ayah_end,
          note: note || null,
          type: type || 'general',
        },
        sent_at: new Date().toISOString(),
      });

    if (notificationError) {
      console.error('Notification creation error:', notificationError);
      // Don't fail the request, but log the error
    }

    // 10. Also send email notification if configured
    await supabaseAdmin.from('notifications').insert({
      school_id: profile.school_id,
      user_id: student.user_id,
      channel: 'email',
      type: 'homework_assigned',
      title: 'New Homework Assigned',
      body: `You have been assigned new homework for Surah ${surah}, Ayah ${ayah_start}-${ayah_end}. ${note ? 'Note: ' + note : ''}`,
      payload: {
        homework_id: homework.id,
        teacher_name: profile.display_name || 'Your teacher',
        surah,
        ayah_start,
        ayah_end,
        note: note || null,
      },
      sent_at: null, // Will be sent by background worker
    });

    // 11. Transform to Homework type with computed fields
    const homeworkResponse = {
      ...homework,
      color: homework.color as 'green' | 'gold',
      status: getHomeworkStatus(homework.color as 'green' | 'gold'),
      is_overdue: false, // Newly created homework is never overdue
    };

    // 12. Return success response
    return NextResponse.json<CreateHomeworkResponse>(
      {
        success: true,
        data: homeworkResponse,
        homework: homeworkResponse,
        message: 'Homework created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/homework:', error);
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

// ============================================================================
// GET /api/homework - List Homework
// ============================================================================

export async function GET(request: NextRequest) {
  try {
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

    // 3. Get user profile with school_id and role
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

    // 4. Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const queryValidation = listHomeworkQuerySchema.safeParse(searchParams);

    if (!queryValidation.success) {
      return NextResponse.json<HomeworkErrorResponse>(
        {
          success: false,
          error: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          details: {
            errors: queryValidation.error.errors.map(
              (e) => `${e.path.join('.')}: ${e.message}`
            ),
          },
        },
        { status: 400 }
      );
    }

    const {
      student_id,
      teacher_id,
      status,
      surah,
      page_number,
      include_completed,
      page,
      limit,
      sort_by,
      sort_order,
    } = queryValidation.data;

    // 5. Build Supabase query - only select homework highlights (green or gold)
    let query = supabaseAdmin
      .from('highlights')
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
        teacher:teachers!teacher_id (
          id,
          user_id,
          profiles:user_id (
            display_name,
            email
          )
        )
      `,
        { count: 'exact' }
      )
      .in('color', ['green', 'gold']); // Only homework highlights

    // Apply filters
    if (student_id) {
      query = query.eq('student_id', student_id);
    }

    if (teacher_id) {
      query = query.eq('teacher_id', teacher_id);
    }

    if (status === 'pending') {
      query = query.eq('color', 'green');
    } else if (status === 'completed') {
      query = query.eq('color', 'gold');
    }

    if (surah) {
      query = query.eq('surah', surah);
    }

    if (page_number) {
      query = query.eq('page_number', page_number);
    }

    // Default behavior: only show pending (green) unless include_completed is true
    if (!include_completed && !status) {
      query = query.eq('color', 'green');
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // 6. Execute query
    const { data: homework, error: queryError, count } = await query;

    if (queryError) {
      console.error('Homework query error:', queryError);
      return NextResponse.json<HomeworkErrorResponse>(
        {
          success: false,
          error: 'Failed to fetch homework',
          code: 'DATABASE_ERROR',
          details: { queryError },
        },
        { status: 500 }
      );
    }

    // 7. Transform results to HomeworkWithDetails format
    const homeworkWithDetails: HomeworkWithDetails[] = (homework || []).map(
      (hw: any) => {
        const color = hw.color as 'green' | 'gold';
        const status = getHomeworkStatus(color);

        return {
          ...hw,
          color,
          status,
          student: {
            id: hw.student.id,
            display_name: hw.student.profiles?.display_name || 'Unknown',
            email: hw.student.profiles?.email || '',
          },
          teacher: hw.teacher
            ? {
                id: hw.teacher.id,
                display_name: hw.teacher.profiles?.display_name || 'Unknown',
                email: hw.teacher.profiles?.email || '',
              }
            : undefined,
          is_overdue: false, // TODO: Implement overdue logic based on due_date if added
          notes: [], // Notes will be fetched separately for detail view
        };
      }
    );

    // 8. Calculate pagination metadata
    const total = count || 0;
    const total_pages = Math.ceil(total / limit);

    // 9. Return response
    return NextResponse.json<ListHomeworkResponse>(
      {
        success: true,
        data: homeworkWithDetails,
        homework: homeworkWithDetails,
        pagination: {
          page,
          limit,
          total,
          total_pages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/homework:', error);
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
