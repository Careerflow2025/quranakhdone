/**
 * School Gradebook API Endpoint
 * GET /api/gradebook/school - Get gradebook data for all students in school
 *
 * Created: 2025-10-28
 * Purpose: School admins/owners view all grades across the school
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import { GradebookErrorResponse } from '@/lib/types/gradebook';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// ============================================================================
// Type Definitions
// ============================================================================

interface StudentGradeSummary {
  student_id: string;
  student_name: string;
  student_email: string;
  total_assignments: number;
  graded_assignments: number;
  average_score: number;
  letter_grade: string;
  total_grades: number;
  last_graded: string;
}

interface SchoolGradebookData {
  total_students_with_grades: number;
  total_assignments: number;
  total_grades: number;
  school_wide_average: number;
  students: StudentGradeSummary[];
  recent_grades: Array<{
    student_name: string;
    assignment_title: string;
    criterion_name: string;
    score: number;
    max_score: number;
    percentage: number;
    graded_by: string;
    graded_at: string;
  }>;
}

interface SchoolGradebookResponse {
  success: boolean;
  data: SchoolGradebookData;
}

// Helper function to calculate letter grade
function getLetterGrade(percentage: number): string {
  if (percentage >= 90) return 'A';
  if (percentage >= 80) return 'B';
  if (percentage >= 70) return 'C';
  if (percentage >= 60) return 'D';
  return 'F';
}

// ============================================================================
// GET /api/gradebook/school - Get School-wide Gradebook Data
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    // 1. Initialize Supabase admin client
    const supabaseAdmin = getSupabaseAdmin();

    // 2. Get authorization header and extract token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Unauthorized - Missing authorization header',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // 3. Get authenticated user
    const {
      data: { user },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Unauthorized - Invalid token',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    // 4. Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
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

    // 5. Check permissions (only school admins/owners)
    if (!['owner', 'admin'].includes(profile.role)) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Only school admins/owners can access school-wide gradebook data',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 6. Get all students in the school
    const { data: allStudents, error: studentsError } = await supabaseAdmin
      .from('students')
      .select(`
        id,
        user_id,
        profiles:user_id (
          school_id,
          display_name,
          email
        )
      `);

    if (studentsError) {
      console.error('Error fetching students:', studentsError);
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Failed to fetch students',
          code: 'DATABASE_ERROR',
        },
        { status: 500 }
      );
    }

    // 7. Filter students by school
    const schoolStudents = (allStudents || []).filter(
      (s: any) => s.profiles?.school_id === profile.school_id
    );

    const studentIds = schoolStudents.map((s: any) => s.id);

    if (studentIds.length === 0) {
      // No students, return empty data
      return NextResponse.json<SchoolGradebookResponse>(
        {
          success: true,
          data: {
            total_students_with_grades: 0,
            total_assignments: 0,
            total_grades: 0,
            school_wide_average: 0,
            students: [],
            recent_grades: [],
          },
        },
        { status: 200 }
      );
    }

    // 8. Get all grades for school students
    const { data: allGrades, error: gradesError } = await supabaseAdmin
      .from('grades')
      .select(`
        id,
        student_id,
        assignment_id,
        criterion_id,
        score,
        max_score,
        created_at,
        rubric_criteria:criterion_id (
          id,
          name
        ),
        assignments:assignment_id (
          id,
          title,
          school_id
        ),
        graded_by_profile:graded_by (
          display_name
        )
      `)
      .in('student_id', studentIds)
      .order('created_at', { ascending: false });

    if (gradesError) {
      console.error('Error fetching grades:', gradesError);
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Failed to fetch grades',
          code: 'DATABASE_ERROR',
        },
        { status: 500 }
      );
    }

    // 9. Filter grades by school (ensure assignments belong to school)
    const schoolGrades = (allGrades || []).filter(
      (g: any) => g.assignments?.school_id === profile.school_id
    );

    // 10. Get unique assignments
    const uniqueAssignmentIds = new Set(
      schoolGrades.map((g: any) => g.assignment_id)
    );

    // 11. Group grades by student
    const studentGradesMap = new Map<string, any[]>();
    schoolGrades.forEach((grade: any) => {
      if (!studentGradesMap.has(grade.student_id)) {
        studentGradesMap.set(grade.student_id, []);
      }
      studentGradesMap.get(grade.student_id)!.push(grade);
    });

    // 12. Calculate student summaries
    const studentSummaries: StudentGradeSummary[] = schoolStudents
      .map((student: any) => {
        const studentGrades = studentGradesMap.get(student.id) || [];

        if (studentGrades.length === 0) {
          return null;
        }

        // Calculate average score
        const totalScore = studentGrades.reduce((sum: number, g: any) => {
          const percentage = (g.score / g.max_score) * 100;
          return sum + percentage;
        }, 0);

        const averageScore = studentGrades.length > 0
          ? totalScore / studentGrades.length
          : 0;

        // Get unique assignments for this student
        const studentAssignments = new Set(
          studentGrades.map((g: any) => g.assignment_id)
        );

        return {
          student_id: student.id,
          student_name: student.profiles?.display_name || 'Unknown',
          student_email: student.profiles?.email || '',
          total_assignments: studentAssignments.size,
          graded_assignments: studentAssignments.size,
          average_score: Math.round(averageScore),
          letter_grade: getLetterGrade(averageScore),
          total_grades: studentGrades.length,
          last_graded: studentGrades[0]?.created_at || new Date().toISOString(),
        };
      })
      .filter((s): s is StudentGradeSummary => s !== null)
      .sort((a: StudentGradeSummary, b: StudentGradeSummary) =>
        b.average_score - a.average_score
      );

    // 13. Calculate school-wide average
    const schoolWideAverage = studentSummaries.length > 0
      ? Math.round(
          studentSummaries.reduce((sum, s) => sum + s.average_score, 0) /
            studentSummaries.length
        )
      : 0;

    // 14. Get recent grades (last 20)
    const recentGrades = schoolGrades
      .slice(0, 20)
      .map((grade: any) => {
        const student = schoolStudents.find((s: any) => s.id === grade.student_id);
        const percentage = (grade.score / grade.max_score) * 100;

        return {
          student_name: student?.profiles?.display_name || 'Unknown',
          assignment_title: grade.assignments?.title || 'Unknown Assignment',
          criterion_name: grade.rubric_criteria?.name || 'Unknown Criterion',
          score: grade.score,
          max_score: grade.max_score,
          percentage: Math.round(percentage),
          graded_by: grade.graded_by_profile?.display_name || 'Unknown',
          graded_at: grade.created_at,
        };
      });

    // 15. Build response
    const responseData: SchoolGradebookData = {
      total_students_with_grades: studentSummaries.length,
      total_assignments: uniqueAssignmentIds.size,
      total_grades: schoolGrades.length,
      school_wide_average: schoolWideAverage,
      students: studentSummaries,
      recent_grades: recentGrades,
    };

    // 16. Return success response
    return NextResponse.json<SchoolGradebookResponse>(
      {
        success: true,
        data: responseData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/gradebook/school:', error);
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
