/**
 * Assignments API Endpoints
 * POST /api/assignments - Create new assignment
 * GET /api/assignments - List assignments with filters
 *
 * Created: 2025-10-20
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  validateCreateAssignmentRequest,
  canCreateAssignment,
  listAssignmentsQuerySchema,
} from '@/lib/validators/assignments';
import {
  CreateAssignmentResponse,
  ListAssignmentsResponse,
  AssignmentErrorResponse,
  AssignmentWithDetails,
} from '@/lib/types/assignments';
import { Database } from '@/lib/database.types';

type AssignmentRow = Database['public']['Tables']['assignments']['Row'];
type ProfileRow = Database['public']['Tables']['profiles']['Row'];
type TeacherRow = Database['public']['Tables']['teachers']['Row'];
type StudentRow = Database['public']['Tables']['students']['Row'];

// ============================================================================
// POST /api/assignments - Create Assignment
// ============================================================================

export async function POST(request: NextRequest) {
  try {
    // 1. Initialize Supabase admin client
    const supabaseAdmin = getSupabaseAdmin();

    // 2. Get Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json<AssignmentErrorResponse>(
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
      return NextResponse.json<AssignmentErrorResponse>(
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
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: 'User profile not found',
          code: 'NOT_FOUND',
          details: { profileError },
        },
        { status: 404 }
      );
    }

    // 4. Check if user is a teacher (need teacher_id for created_by_teacher_id)
    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: 'Teacher profile not found. Only teachers can create assignments.',
          code: 'FORBIDDEN',
          details: { teacherError },
        },
        { status: 403 }
      );
    }

    // 5. Parse and validate request body
    const body = await request.json();
    const validation = validateCreateAssignmentRequest(body);

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

    const { student_id, title, description, due_at, highlight_refs, attachments } =
      validation.data;

    // 6. Verify student belongs to same school
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select('id, user_id')
      .eq('id', student_id)
      .single();

    if (studentError || !student) {
      return NextResponse.json<AssignmentErrorResponse>(
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
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: 'Student profile not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    if (studentProfile.school_id !== profile.school_id) {
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: 'Cannot create assignment for student in different school',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 7. Check permissions
    const hasPermission = canCreateAssignment({
      userId: user.id,
      userRole: profile.role,
      schoolId: profile.school_id,
      teacherId: teacher.id,
    });

    if (!hasPermission) {
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to create assignments',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 8. Insert assignment into database
    const { data: assignment, error: insertError } = await supabaseAdmin
      .from('assignments')
      .insert({
        school_id: profile.school_id,
        created_by_teacher_id: teacher.id,
        student_id: student_id,
        title,
        description: description || null,
        status: 'assigned',
        due_at,
        reopen_count: 0,
      })
      .select()
      .single();

    if (insertError || !assignment) {
      console.error('Assignment creation error:', insertError);
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: 'Failed to create assignment',
          code: 'DATABASE_ERROR',
          details: { insertError },
        },
        { status: 500 }
      );
    }

    // 9. Create assignment event for "created" action
    const { error: eventError } = await supabaseAdmin
      .from('assignment_events')
      .insert({
        assignment_id: assignment.id,
        event_type: 'created',
        actor_user_id: user.id,
        from_status: null,
        to_status: 'assigned',
        meta: {
          highlight_refs: highlight_refs || [],
          initial_attachments: attachments || [],
        },
      });

    if (eventError) {
      console.error('Assignment event creation error:', eventError);
      // Don't fail the request, but log the error
    }

    // 10. If attachments provided, insert them
    if (attachments && attachments.length > 0) {
      const attachmentInserts = attachments.map((url) => ({
        assignment_id: assignment.id,
        uploader_user_id: user.id,
        url,
        mime_type: getMimeTypeFromUrl(url),
      }));

      const { error: attachmentError } = await supabaseAdmin
        .from('assignment_attachments')
        .insert(attachmentInserts);

      if (attachmentError) {
        console.error('Attachment creation error:', attachmentError);
        // Don't fail the request, but log the error
      }
    }

    // 11. Return success response
    return NextResponse.json<CreateAssignmentResponse>(
      {
        success: true,
        data: assignment,
        assignment,
        message: 'Assignment created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/assignments:', error);
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
// GET /api/assignments - List Assignments
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // 1. Initialize Supabase admin client
    const supabaseAdmin = getSupabaseAdmin();

    // 2. Get Bearer token from Authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json<AssignmentErrorResponse>(
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
      return NextResponse.json<AssignmentErrorResponse>(
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
      return NextResponse.json<AssignmentErrorResponse>(
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
    const queryValidation = listAssignmentsQuerySchema.safeParse(searchParams);

    if (!queryValidation.success) {
      return NextResponse.json<AssignmentErrorResponse>(
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
      late_only,
      due_before,
      due_after,
      page,
      limit,
      sort_by,
      sort_order,
    } = queryValidation.data;

    // 5. Build Supabase query with RLS enforcement (school_id automatically filtered)
    let query = supabaseAdmin
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
      `,
        { count: 'exact' }
      );

    // Apply filters
    if (student_id) {
      query = query.eq('student_id', student_id);
    }

    if (teacher_id) {
      query = query.eq('created_by_teacher_id', teacher_id);
    }

    if (status) {
      if (Array.isArray(status)) {
        query = query.in('status', status);
      } else {
        query = query.eq('status', status);
      }
    }

    if (late_only) {
      query = query.eq('late', true);
    }

    if (due_before) {
      query = query.lt('due_at', due_before);
    }

    if (due_after) {
      query = query.gt('due_at', due_after);
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // 6. Execute query
    const { data: assignments, error: queryError, count } = await query;

    if (queryError) {
      console.error('Assignment query error:', queryError);
      return NextResponse.json<AssignmentErrorResponse>(
        {
          success: false,
          error: 'Failed to fetch assignments',
          code: 'DATABASE_ERROR',
          details: { queryError },
        },
        { status: 500 }
      );
    }

    // 7. Transform results to AssignmentWithDetails format
    const assignmentsWithDetails: AssignmentWithDetails[] = (assignments || []).map(
      (assignment: any) => {
        const now = new Date();
        const dueDate = new Date(assignment.due_at);
        const isOverdue = dueDate < now && assignment.status !== 'completed';

        return {
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
          is_overdue: isOverdue,
        };
      }
    );

    // 8. Calculate pagination metadata
    const total = count || 0;
    const total_pages = Math.ceil(total / limit);

    // 9. Return response
    return NextResponse.json<ListAssignmentsResponse>(
      {
        success: true,
        data: assignmentsWithDetails,
        assignments: assignmentsWithDetails,
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
    console.error('Unexpected error in GET /api/assignments:', error);
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
// HELPER FUNCTIONS
// ============================================================================

/**
 * Extracts MIME type from file URL
 * Basic implementation - should be enhanced with proper file type detection
 */
function getMimeTypeFromUrl(url: string): string {
  const extension = url.split('.').pop()?.toLowerCase();

  const mimeTypes: Record<string, string> = {
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    png: 'image/png',
    gif: 'image/gif',
    webp: 'image/webp',
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    m4a: 'audio/mp4',
    mp3: 'audio/mpeg',
  };

  return mimeTypes[extension || ''] || 'application/octet-stream';
}
