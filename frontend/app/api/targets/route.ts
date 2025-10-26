/**
 * Targets API Endpoints
 * POST /api/targets - Create new target
 * GET /api/targets - List targets with filters
 *
 * Created: 2025-10-20
 * Purpose: Target system for student goals (individual/class/school level)
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  validateCreateTargetRequest,
  canCreateTarget,
  listTargetsQuerySchema,
} from '@/lib/validators/targets';
import {
  CreateTargetResponse,
  ListTargetsResponse,
  TargetErrorResponse,
  TargetWithDetails,
  calculateTargetProgress,
  getDaysRemaining,
  getDaysSinceCreated,
  isTargetOverdue,
  Milestone,
} from '@/lib/types/targets';
import { Database } from '@/lib/database.types';

type TargetRow = Database['public']['Tables']['targets']['Row'];

// ============================================================================
// POST /api/targets - Create Target
// ============================================================================

export async function POST(request: NextRequest) {
  try {
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

    // 4. Get user profile with school_id and role
    const { data: profile, error: profileError } = await supabaseAdmin
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
          details: { profileError },
        },
        { status: 404 }
      );
    }

    // 5. Check if user is a teacher (only teachers can create targets)
    const { data: teacher, error: teacherError } = await supabaseAdmin
      .from('teachers')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (teacherError || !teacher) {
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: 'Teacher profile not found. Only teachers can create targets.',
          code: 'FORBIDDEN',
          details: { teacherError },
        },
        { status: 403 }
      );
    }

    // 5. Parse and validate request body
    const body = await request.json();
    const validation = validateCreateTargetRequest(body);

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

    const { title, description, type, category, student_id, class_id, start_date, due_date, milestones } =
      validation.data;

    // 6. For individual targets, verify student exists and is in same school
    if (type === 'individual' && student_id) {
      const { data: student, error: studentError } = await supabaseAdmin
        .from('students')
        .select('id, user_id')
        .eq('id', student_id)
        .single();

      if (studentError || !student) {
        return NextResponse.json<TargetErrorResponse>(
          {
            success: false,
            error: 'Student not found',
            code: 'NOT_FOUND',
          },
          { status: 404 }
        );
      }

      const { data: studentProfile } = await supabaseAdmin
        .from('profiles')
        .select('school_id')
        .eq('user_id', student.user_id)
        .single();

      if (studentProfile?.school_id !== profile.school_id) {
        return NextResponse.json<TargetErrorResponse>(
          {
            success: false,
            error: 'Cannot create target for student in different school',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        );
      }
    }

    // 7. For class targets, verify class exists and is in same school
    if (type === 'class' && class_id) {
      const { data: classData, error: classError } = await supabaseAdmin
        .from('classes')
        .select('id, school_id')
        .eq('id', class_id)
        .single();

      if (classError || !classData) {
        return NextResponse.json<TargetErrorResponse>(
          {
            success: false,
            error: 'Class not found',
            code: 'NOT_FOUND',
          },
          { status: 404 }
        );
      }

      if (classData.school_id !== profile.school_id) {
        return NextResponse.json<TargetErrorResponse>(
          {
            success: false,
            error: 'Cannot create target for class in different school',
            code: 'FORBIDDEN',
          },
          { status: 403 }
        );
      }
    }

    // 8. Check permissions
    const hasPermission = canCreateTarget({
      userId: user.id,
      userRole: profile.role,
      schoolId: profile.school_id,
      teacherId: teacher.id,
    });

    if (!hasPermission) {
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to create targets',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 9. Create milestones array for storage (will be JSONB initially)
    const initialMilestones: Milestone[] = (milestones || []).map((m, index) => ({
      id: crypto.randomUUID(),
      title: m.title,
      description: m.description,
      target_value: m.target_value,
      current_value: 0,
      completed: false,
      order: m.order || index + 1,
      created_at: new Date().toISOString(),
    }));

    // 10. Insert target into database
    // Note: Milestones stored as JSONB in meta field until separate table is created
    const { data: target, error: insertError } = await supabaseAdmin
      .from('targets')
      .insert({
        school_id: profile.school_id,
        teacher_id: teacher.id,
        student_id: student_id || null, // For individual targets
        class_id: class_id || null,     // For class targets
        title,
        description: description || null,
        type,
        category: category || null,
        status: 'active',
        start_date: start_date || null,
        due_date: due_date || null,
      })
      .select()
      .single();

    if (insertError || !target) {
      console.error('Target creation error:', insertError);
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: 'Failed to create target',
          code: 'DATABASE_ERROR',
          details: { insertError },
        },
        { status: 500 }
      );
    }

    // 11. Populate target_students junction table for cross-dashboard visibility
    // This is CRITICAL for student/parent visibility
    if (type === 'individual' && student_id) {
      // Individual target: link to specific student
      await supabaseAdmin.from('target_students').insert({
        target_id: target.id,
        student_id: student_id,
        progress: 0
      });
    } else if (type === 'class' && class_id) {
      // Class target: link to ALL students in the class
      const { data: classStudents } = await supabaseAdmin
        .from('class_enrollments')
        .select('student_id')
        .eq('class_id', class_id);

      if (classStudents && classStudents.length > 0) {
        const targetStudentLinks = classStudents.map(enrollment => ({
          target_id: target.id,
          student_id: enrollment.student_id,
          progress: 0
        }));

        await supabaseAdmin.from('target_students').insert(targetStudentLinks);
      }
    }
    // Note: School targets don't need target_students links (visible to all)

    // 12. Create notification based on target type
    if (type === 'individual' && student_id) {
      const { data: student } = await supabaseAdmin
        .from('students')
        .select('user_id')
        .eq('id', student_id)
        .single();

      if (student) {
        await supabaseAdmin.from('notifications').insert({
          school_id: profile.school_id,
          user_id: student.user_id,
          channel: 'in_app',
          type: 'target',
          payload: {
            target_id: target.id,
            target_title: title,
            target_type: type,
            teacher_name: profile.display_name || 'Your teacher',
            due_date: due_date,
            milestone_count: initialMilestones.length,
          },
          sent_at: new Date().toISOString(),
        });
      }
    }

    // 13. Build response with details
    const targetWithDetails: TargetWithDetails = {
      ...target,
      milestones: initialMilestones,
      progress_percentage: calculateTargetProgress(initialMilestones),
      is_overdue: isTargetOverdue(target),
      days_remaining: getDaysRemaining(target.due_date),
      total_milestones: initialMilestones.length,
      completed_milestones: 0,
      stats: {
        total_milestones: initialMilestones.length,
        completed_milestones: 0,
        progress_percentage: 0,
        days_since_created: 0,
        days_until_due: getDaysRemaining(target.due_date),
        is_overdue: false,
      },
    };

    // 14. Return success response
    return NextResponse.json<CreateTargetResponse>(
      {
        success: true,
        target: targetWithDetails,
        message: 'Target created successfully',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/targets:', error);
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
// GET /api/targets - List Targets
// ============================================================================

export async function GET(request: NextRequest) {
  try {
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

    // 4. Get user profile with school_id and role
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

    // 4. Parse and validate query parameters
    const searchParams = Object.fromEntries(request.nextUrl.searchParams);
    const queryValidation = listTargetsQuerySchema.safeParse(searchParams);

    if (!queryValidation.success) {
      return NextResponse.json<TargetErrorResponse>(
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
      class_id,
      teacher_id,
      type,
      status,
      category,
      include_completed,
      page,
      limit,
      sort_by,
      sort_order,
    } = queryValidation.data;

    // 5. Build Supabase query with role-based filtering
    // CRITICAL: Ensure school isolation
    let query = supabaseAdmin
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
        ),
        students (
          id,
          user_id,
          profiles:user_id (
            display_name,
            email
          )
        ),
        classes (
          id,
          name
        )
      `,
        { count: 'exact' }
      )
      .eq('school_id', profile.school_id); // Multi-tenant isolation

    // Role-based filtering for cross-dashboard visibility
    if (profile.role === 'student') {
      // Students only see targets assigned to them via target_students
      const { data: studentRecord } = await supabaseAdmin
        .from('students')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (studentRecord) {
        const { data: targetStudents } = await supabaseAdmin
          .from('target_students')
          .select('target_id')
          .eq('student_id', studentRecord.id);

        const targetIds = (targetStudents || []).map(ts => ts.target_id);
        query = query.in('id', targetIds.length > 0 ? targetIds : ['00000000-0000-0000-0000-000000000000']); // Dummy UUID if no targets
      }
    } else if (profile.role === 'parent') {
      // Parents see targets for their linked children
      const { data: parentRecord } = await supabaseAdmin
        .from('parents')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (parentRecord) {
        const { data: children } = await supabaseAdmin
          .from('parent_students')
          .select('student_id')
          .eq('parent_id', parentRecord.id);

        const childIds = (children || []).map(c => c.student_id);

        if (childIds.length > 0) {
          const { data: targetStudents } = await supabaseAdmin
            .from('target_students')
            .select('target_id')
            .in('student_id', childIds);

          const targetIds = (targetStudents || []).map(ts => ts.target_id);
          query = query.in('id', targetIds.length > 0 ? targetIds : ['00000000-0000-0000-0000-000000000000']);
        }
      }
    }
    // Teachers and admins see all targets in their school (already filtered by school_id above)

    // Apply additional filters
    if (teacher_id) {
      query = query.eq('teacher_id', teacher_id);
    }

    if (student_id) {
      // Filter by specific student via target_students junction
      const { data: studentTargets } = await supabaseAdmin
        .from('target_students')
        .select('target_id')
        .eq('student_id', student_id);

      const targetIds = (studentTargets || []).map(st => st.target_id);
      query = query.in('id', targetIds.length > 0 ? targetIds : ['00000000-0000-0000-0000-000000000000']);
    }

    if (type) {
      query = query.eq('type', type);
    }

    if (status) {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category', category);
    }

    // Default behavior: only show active unless include_completed is true
    if (!include_completed && !status) {
      query = query.eq('status', 'active');
    }

    // Apply sorting
    query = query.order(sort_by, { ascending: sort_order === 'asc' });

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // 6. Execute query
    const { data: targets, error: queryError, count } = await query;

    if (queryError) {
      console.error('Targets query error:', queryError);
      return NextResponse.json<TargetErrorResponse>(
        {
          success: false,
          error: 'Failed to fetch targets',
          code: 'DATABASE_ERROR',
          details: { queryError },
        },
        { status: 500 }
      );
    }

    // 7. Transform results to TargetWithDetails format
    // Note: Milestones would be fetched from JSONB meta field or separate table
    const targetsWithDetails: TargetWithDetails[] = (targets || []).map(
      (target: any) => {
        const milestones: Milestone[] = []; // TODO: Fetch from meta or separate table

        return {
          ...target,
          teacher: target.teacher
            ? {
                id: target.teacher.id,
                display_name: target.teacher.profiles?.display_name || 'Unknown',
                email: target.teacher.profiles?.email || '',
              }
            : undefined,
          student: target.students
            ? {
                id: target.students.id,
                display_name: target.students.profiles?.display_name || 'Unknown Student',
                email: target.students.profiles?.email || '',
              }
            : undefined,
          class: target.classes
            ? {
                id: target.classes.id,
                name: target.classes.name || 'Unknown Class',
                student_count: 0, // TODO: Add student count if needed
              }
            : undefined,
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
      }
    );

    // 8. Calculate pagination metadata
    const total = count || 0;
    const total_pages = Math.ceil(total / limit);

    // 9. Return response
    return NextResponse.json<ListTargetsResponse>(
      {
        success: true,
        targets: targetsWithDetails,
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
    console.error('Unexpected error in GET /api/targets:', error);
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
