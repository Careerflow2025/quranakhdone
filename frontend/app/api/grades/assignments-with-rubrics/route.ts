/**
 * Assignments with Rubrics API
 * GET /api/grades/assignments-with-rubrics
 *
 * Purpose: Fetch all assignments that have rubrics attached for grading
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    // 1. Initialize Supabase admin client
    const supabaseAdmin = getSupabaseAdmin();

    // 2. Get authorization header and extract token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Missing authorization header' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // 3. Get authenticated user
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized - Invalid token' },
        { status: 401 }
      );
    }

    // 4. Get user profile with school_id
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, school_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      );
    }

    // 5. Check if user is a teacher
    if (profile.role !== 'teacher') {
      return NextResponse.json(
        { success: false, error: 'Only teachers can access grading interface' },
        { status: 403 }
      );
    }

    // 6. Fetch assignments with rubrics attached
    const { data: assignments, error: assignmentsError } = await supabaseAdmin
      .from('assignments')
      .select(`
        id,
        title,
        student_id,
        students (
          id,
          profiles:user_id (
            display_name
          )
        ),
        assignment_rubrics (
          rubric_id,
          rubrics (
            id,
            name,
            rubric_criteria (
              id,
              name,
              description,
              weight,
              max_score,
              order
            )
          )
        )
      `)
      .eq('school_id', profile.school_id)
      .not('assignment_rubrics', 'is', null)
      .order('created_at', { ascending: false });

    if (assignmentsError) {
      console.error('Assignments fetch error:', assignmentsError);
      return NextResponse.json(
        { success: false, error: 'Failed to fetch assignments' },
        { status: 500 }
      );
    }

    // 7. Transform data and fetch existing grades
    const transformedAssignments = await Promise.all(
      (assignments || [])
        .filter((a: any) => a.assignment_rubrics.length > 0) // Only assignments with rubrics
        .map(async (assignment: any) => {
          const rubricData = assignment.assignment_rubrics[0].rubrics;
          const criteria = rubricData.rubric_criteria || [];

          // Fetch existing grades for this assignment
          const { data: existingGrades } = await supabaseAdmin
            .from('grades')
            .select('criterion_id, score, comments')
            .eq('assignment_id', assignment.id)
            .eq('student_id', assignment.student_id);

          return {
            id: assignment.id,
            title: assignment.title,
            student_id: assignment.student_id,
            student_name: assignment.students?.profiles?.display_name || 'Unknown Student',
            rubric_id: rubricData.id,
            rubric_name: rubricData.name,
            criteria: criteria.sort((a: any, b: any) => (a.order || 0) - (b.order || 0)),
            existing_grades: existingGrades || [],
          };
        })
    );

    // 8. Return success response
    return NextResponse.json(
      {
        success: true,
        assignments: transformedAssignments,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/grades/assignments-with-rubrics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      },
      { status: 500 }
    );
  }
}
