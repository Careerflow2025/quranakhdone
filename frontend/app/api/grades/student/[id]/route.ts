/**
 * Student Grades API Endpoint
 * GET /api/grades/student/:id - Get all grades for a student
 *
 * Created: 2025-10-20
 * Purpose: View all grades for a specific student (gradebook view)
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { canViewGrades } from '@/lib/validators/gradebook';
import {
  GetStudentGradesResponse,
  GradebookErrorResponse,
  StudentGradebookEntry,
  GradebookStats,
  GradeWithDetails,
  calculateWeightedAverage,
  calculateOverallScore,
} from '@/lib/types/gradebook';

// ============================================================================
// GET /api/grades/student/:id - Get Student Grades
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const studentId = params.id;

    // 1. Initialize Supabase client with auth
    const supabase = createClient();

    // 2. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

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

    // 4. Verify student exists and belongs to same school
    const { data: student } = await supabase
      .from('students')
      .select('id, user_id')
      .eq('id', studentId)
      .single();

    if (!student) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Student not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    const { data: studentProfile } = await supabase
      .from('profiles')
      .select('school_id')
      .eq('user_id', student.user_id)
      .single();

    if (!studentProfile || studentProfile.school_id !== profile.school_id) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Student not found in your school',
          code: 'FORBIDDEN',
        },
        { status: 403 }
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
        assignmentSchoolId: studentProfile.school_id,
        studentId: studentId,
      }
    );

    if (!hasPermission) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to view this student\'s grades',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 6. Fetch all assignments for this student
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select('id, title, due_at, status')
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (assignmentsError) {
      console.error('Assignments fetch error:', assignmentsError);
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Failed to fetch assignments',
          code: 'DATABASE_ERROR',
          details: { assignmentsError },
        },
        { status: 500 }
      );
    }

    // 7. Build gradebook entries for each assignment
    const entries: StudentGradebookEntry[] = [];
    const allGrades: GradeWithDetails[] = [];

    for (const assignment of assignments || []) {
      // Fetch assignment's rubric
      const { data: assignmentRubric } = await supabase
        .from('assignment_rubrics')
        .select('rubric:rubric_id(*)')
        .eq('assignment_id', assignment.id)
        .single();

      if (!assignmentRubric || !assignmentRubric.rubric) {
        // Assignment has no rubric, skip
        continue;
      }

      const rubric = assignmentRubric.rubric as any;

      // Fetch grades for this assignment
      const { data: assignmentGrades } = await supabase
        .from('grades')
        .select(`
          *,
          criterion:criterion_id(*)
        `)
        .eq('assignment_id', assignment.id)
        .eq('student_id', studentId);

      // Build grades with details
      const gradesWithDetails: GradeWithDetails[] = (assignmentGrades || []).map(
        (grade: any) => ({
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
          criterion: {
            id: grade.criterion.id,
            name: grade.criterion.name,
            weight: grade.criterion.weight,
            max_score: grade.criterion.max_score,
          },
          percentage: (grade.score / grade.max_score) * 100,
        })
      );

      allGrades.push(...gradesWithDetails);

      // Calculate overall scores
      const overallScoreCalc = calculateOverallScore(gradesWithDetails);
      const weightedAverage = calculateWeightedAverage(gradesWithDetails);

      // Find most recent grade timestamp
      const gradedAt =
        gradesWithDetails.length > 0
          ? gradesWithDetails.reduce((latest, g) =>
              g.updated_at > latest ? g.updated_at : latest
            , gradesWithDetails[0].updated_at)
          : null;

      // Add to entries
      entries.push({
        assignment_id: assignment.id,
        assignment_title: assignment.title,
        assignment_due_at: assignment.due_at,
        assignment_status: assignment.status,
        rubric_name: rubric.name,
        grades: gradesWithDetails,
        overall_score: weightedAverage,
        overall_percentage: overallScoreCalc.percentage,
        graded_at: gradedAt,
      });
    }

    // 8. Calculate gradebook statistics
    const totalAssignments = entries.length;
    const gradedAssignments = entries.filter((e) => e.grades.length > 0).length;
    const pendingAssignments = totalAssignments - gradedAssignments;

    const percentages = entries
      .filter((e) => e.grades.length > 0)
      .map((e) => e.overall_percentage);

    const stats: GradebookStats = {
      total_assignments: totalAssignments,
      graded_assignments: gradedAssignments,
      pending_assignments: pendingAssignments,
      average_score:
        percentages.length > 0
          ? percentages.reduce((sum, p) => sum + p, 0) / percentages.length
          : 0,
      highest_score: percentages.length > 0 ? Math.max(...percentages) : 0,
      lowest_score: percentages.length > 0 ? Math.min(...percentages) : 0,
      total_criteria_graded: allGrades.length,
    };

    // 9. Return success response
    return NextResponse.json<GetStudentGradesResponse>(
      {
        success: true,
        data: {
          student_id: studentId,
          entries,
          stats,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/grades/student/:id:', error);
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
