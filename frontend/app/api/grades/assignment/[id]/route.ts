/**
 * Assignment Grades API Endpoint
 * GET /api/grades/assignment/:id - Get all grades for an assignment
 *
 * Created: 2025-10-20
 * Purpose: View grades for a specific assignment (all students)
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { canViewGrades } from '@/lib/validators/gradebook';
import {
  GetAssignmentGradesResponse,
  GradebookErrorResponse,
  AssignmentWithGrades,
  GradeWithDetails,
  RubricWithDetails,
  calculateWeightedAverage,
  calculateOverallScore,
  isFullyGraded,
} from '@/lib/types/gradebook';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// ============================================================================
// GET /api/grades/assignment/:id - Get Assignment Grades
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id;

    // 1. Initialize Supabase client with auth
    const supabaseAdmin = getSupabaseAdmin();

    // 2. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser();

    if (authError || !user) {
      return NextResponse.json<GradebookErrorResponse>(
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
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'User profile not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 4. Fetch assignment
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('id, title, description, student_id, school_id')
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Assignment not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 5. Check permissions
    const hasPermission = canViewGrades(
      {
        userId: user.id,
        userRole: profile.role,
        schoolId: profile.school_id,
      },
      {
        assignmentSchoolId: assignment.school_id,
        studentId: assignment.student_id,
      }
    );

    if (!hasPermission) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to view grades for this assignment',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 6. Fetch assignment's rubric with criteria
    const { data: assignmentRubric } = await supabase
      .from('assignment_rubrics')
      .select('rubric:rubric_id(*)')
      .eq('assignment_id', assignmentId)
      .single();

    if (!assignmentRubric || !assignmentRubric.rubric) {
      // Assignment has no rubric attached
      const assignmentWithNoGrades: AssignmentWithGrades = {
        id: assignment.id,
        title: assignment.title,
        description: assignment.description,
        student_id: assignment.student_id,
        rubric: undefined,
        grades: [],
        overall_score: 0,
        overall_percentage: 0,
        graded: false,
      };

      return NextResponse.json<GetAssignmentGradesResponse>(
        {
          success: true,
          data: {
            assignment: assignmentWithNoGrades,
          },
        },
        { status: 200 }
      );
    }

    // 7. Fetch rubric criteria
    const { data: criteria } = await supabase
      .from('rubric_criteria')
      .select('*')
      .eq('rubric_id', (assignmentRubric.rubric as any).id)
      .order('order', { ascending: true });

    const rubricWithDetails: RubricWithDetails = {
      ...(assignmentRubric.rubric as any),
      criteria: criteria || [],
    };

    // 8. Fetch all grades for this assignment
    const { data: grades, error: gradesError } = await supabase
      .from('grades')
      .select(`
        *,
        student:student_id(user_id),
        criterion:criterion_id(*),
        graded_by_teacher:graded_by(*)
      `)
      .eq('assignment_id', assignmentId);

    if (gradesError) {
      console.error('Grades fetch error:', gradesError);
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Failed to fetch grades',
          code: 'DATABASE_ERROR',
          details: { gradesError },
        },
        { status: 500 }
      );
    }

    // 9. Enhance grades with student details
    const gradesWithDetails: GradeWithDetails[] = await Promise.all(
      (grades || []).map(async (grade: any) => {
        const { data: studentProfile } = await supabase
          .from('profiles')
          .select('display_name, email')
          .eq('user_id', grade.student.user_id)
          .single();

        const { data: teacherProfile } = await supabase
          .from('profiles')
          .select('display_name, email')
          .eq('user_id', grade.graded_by)
          .single();

        return {
          id: grade.id,
          assignment_id: grade.assignment_id,
          student_id: grade.student_id,
          criterion_id: grade.criterion_id,
          score: grade.score,
          max_score: grade.max_score,
          comments: grade.comments,
          graded_by: grade.graded_by,
          created_at: grade.created_at,
          updated_at: grade.updated_at,
          student: {
            id: grade.student_id,
            display_name: studentProfile?.display_name || 'Unknown',
            email: studentProfile?.email || '',
          },
          criterion: {
            id: grade.criterion.id,
            name: grade.criterion.name,
            weight: grade.criterion.weight,
            max_score: grade.criterion.max_score,
          },
          graded_by_teacher: teacherProfile
            ? {
                id: grade.graded_by,
                display_name: teacherProfile.display_name || 'Unknown',
                email: teacherProfile.email,
              }
            : undefined,
          percentage: (grade.score / grade.max_score) * 100,
        };
      })
    );

    // 10. Calculate overall scores
    const overallScoreCalc = calculateOverallScore(gradesWithDetails);
    const weightedAverage = calculateWeightedAverage(gradesWithDetails);

    // 11. Check if fully graded
    const fullyGraded = isFullyGraded(rubricWithDetails, gradesWithDetails);

    // 12. Build response
    const assignmentWithGrades: AssignmentWithGrades = {
      id: assignment.id,
      title: assignment.title,
      description: assignment.description,
      student_id: assignment.student_id,
      rubric: rubricWithDetails,
      grades: gradesWithDetails,
      overall_score: weightedAverage,
      overall_percentage: overallScoreCalc.percentage,
      graded: fullyGraded,
    };

    // 13. Return success response
    return NextResponse.json<GetAssignmentGradesResponse>(
      {
        success: true,
        data: {
          assignment: assignmentWithGrades,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/grades/assignment/:id:', error);
    return NextResponse.json<GradebookErrorResponse>(
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
