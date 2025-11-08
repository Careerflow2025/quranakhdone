/**
 * Student Gradebook API Endpoint
 * GET /api/gradebook/student?student_id=... - Get gradebook data for a specific student
 *
 * Created: 2025-11-08
 * Purpose: Students and teachers view grades for a specific student
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

interface AssignmentGrade {
  assignment_id: string;
  assignment_title: string;
  assignment_description: string;
  assignment_due_at: string;
  assignment_status: string;
  criterion_id: string;
  criterion_name: string;
  criterion_description: string;
  score: number;
  max_score: number;
  percentage: number;
  letter_grade: string;
  graded_by: string;
  graded_at: string;
  comments?: string;
}

interface StudentGradebookData {
  student_id: string;
  student_name: string;
  student_email: string;
  total_assignments: number;
  graded_assignments: number;
  average_score: number;
  letter_grade: string;
  entries: AssignmentGrade[];
  stats: {
    total_grades: number;
    highest_grade: number;
    lowest_grade: number;
    recent_trend: 'improving' | 'declining' | 'stable';
  };
}

interface StudentGradebookResponse {
  success: boolean;
  data: StudentGradebookData;
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
// GET /api/gradebook/student - Get Student Gradebook Data
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    console.log('📊 GET /api/gradebook/student - Request received');

    // 1. Initialize Supabase admin client
    const supabaseAdmin = getSupabaseAdmin();

    // 2. Get authorization header and extract token
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      console.error('❌ No authorization header');
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
      console.error('❌ Auth error:', authError);
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Unauthorized - Invalid token',
          code: 'UNAUTHORIZED',
        },
        { status: 401 }
      );
    }

    console.log('✅ User authenticated:', user.id);

    // 4. Get user profile
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('profiles')
      .select('user_id, school_id, role')
      .eq('user_id', user.id)
      .single();

    if (profileError || !profile) {
      console.error('❌ Profile error:', profileError);
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'User profile not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    console.log('✅ Profile found - role:', profile.role, 'school_id:', profile.school_id);

    // 5. Get student_id from query params
    const { searchParams } = new URL(request.url);
    const studentId = searchParams.get('student_id');

    if (!studentId) {
      console.error('❌ No student_id provided');
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Missing required parameter: student_id',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching gradebook for student:', studentId);

    // 6. Get student info
    const { data: student, error: studentError } = await supabaseAdmin
      .from('students')
      .select(`
        id,
        user_id,
        profiles:user_id (
          school_id,
          display_name,
          email
        )
      `)
      .eq('id', studentId)
      .single();

    if (studentError || !student) {
      console.error('❌ Student not found:', studentError);
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Student not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 7. Check school isolation
    const studentSchoolId = (student as any).profiles?.school_id;
    if (studentSchoolId !== profile.school_id) {
      console.error('❌ School mismatch - student school:', studentSchoolId, 'user school:', profile.school_id);
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Cannot access student from different school',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    console.log('✅ Student found - name:', (student as any).profiles?.display_name);

    // 8. Get all grades for this student
    const { data: grades, error: gradesError } = await supabaseAdmin
      .from('grades')
      .select(`
        id,
        student_id,
        assignment_id,
        criterion_id,
        score,
        max_score,
        comments,
        created_at,
        graded_by,
        rubric_criteria:criterion_id (
          id,
          name,
          description
        ),
        assignments:assignment_id (
          id,
          title,
          description,
          due_at,
          status,
          school_id
        ),
        graded_by_profile:graded_by (
          display_name
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });

    if (gradesError) {
      console.error('❌ Error fetching grades:', gradesError);
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Failed to fetch grades',
          code: 'DATABASE_ERROR',
        },
        { status: 500 }
      );
    }

    console.log('✅ Grades fetched:', grades?.length || 0, 'grades');

    // 9. Filter grades by school (ensure assignments belong to school)
    const schoolGrades = (grades || []).filter(
      (g: any) => g.assignments?.school_id === profile.school_id
    );

    console.log('✅ School grades filtered:', schoolGrades.length, 'grades');

    // 10. Group grades by assignment
    const assignmentGradesMap = new Map<string, any[]>();
    schoolGrades.forEach((grade: any) => {
      if (!assignmentGradesMap.has(grade.assignment_id)) {
        assignmentGradesMap.set(grade.assignment_id, []);
      }
      assignmentGradesMap.get(grade.assignment_id)!.push(grade);
    });

    // 11. Transform to gradebook entries with assignment-level grouping
    const entries = Array.from(assignmentGradesMap.entries()).map(([assignmentId, grades]) => {
      const firstGrade = grades[0];

      // Calculate overall percentage for this assignment
      const totalScore = grades.reduce((sum, g) => sum + g.score, 0);
      const totalMaxScore = grades.reduce((sum, g) => sum + g.max_score, 0);
      const overallPercentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

      return {
        assignment_id: assignmentId,
        assignment_title: firstGrade.assignments?.title || 'Unknown Assignment',
        assignment_description: firstGrade.assignments?.description || '',
        assignment_due_at: firstGrade.assignments?.due_at || '',
        assignment_status: firstGrade.assignments?.status || 'unknown',
        rubric_name: null, // TODO: Get rubric name from assignment_rubrics table
        overall_percentage: Math.round(overallPercentage * 10) / 10, // Round to 1 decimal
        graded_at: firstGrade.created_at,
        grades: grades.map((g: any) => {
          const percentage = (g.score / g.max_score) * 100;
          return {
            id: g.id,
            criterion: {
              id: g.criterion_id,
              name: g.rubric_criteria?.name || 'Unknown Criterion',
              description: g.rubric_criteria?.description || '',
            },
            score: g.score,
            max_score: g.max_score,
            percentage: Math.round(percentage * 10) / 10, // Round to 1 decimal
            comments: g.comments || null,
          };
        }),
      };
    });

    // 12. Calculate statistics
    const totalAssignments = entries.length;
    const averageScore = totalAssignments > 0
      ? entries.reduce((sum, e) => sum + e.overall_percentage, 0) / totalAssignments
      : 0;

    const highestScore = totalAssignments > 0
      ? Math.max(...entries.map(e => e.overall_percentage))
      : 0;

    const lowestScore = totalAssignments > 0
      ? Math.min(...entries.map(e => e.overall_percentage))
      : 0;

    // Calculate trend (recent 5 assignments vs previous 5 assignments)
    let recentTrend: 'improving' | 'declining' | 'stable' = 'stable';
    if (entries.length >= 10) {
      const recent5 = entries.slice(0, 5);
      const previous5 = entries.slice(5, 10);
      const recentAvg = recent5.reduce((sum, e) => sum + e.overall_percentage, 0) / 5;
      const previousAvg = previous5.reduce((sum, e) => sum + e.overall_percentage, 0) / 5;

      if (recentAvg > previousAvg + 5) {
        recentTrend = 'improving';
      } else if (recentAvg < previousAvg - 5) {
        recentTrend = 'declining';
      }
    }

    // 13. Build response
    const responseData = {
      student_id: studentId,
      student_name: (student as any).profiles?.display_name || 'Unknown',
      student_email: (student as any).profiles?.email || '',
      entries, // Array of assignment entries with grades
      stats: {
        total_assignments: totalAssignments,
        graded_assignments: totalAssignments, // All assignments in this response are graded
        pending_assignments: 0, // TODO: Get from assignments table
        average_score: Math.round(averageScore * 10) / 10,
        highest_score: Math.round(highestScore * 10) / 10,
        lowest_score: Math.round(lowestScore * 10) / 10,
        recent_trend: recentTrend,
      },
    };

    console.log('✅ Response data prepared:', {
      student: responseData.student_name,
      total_assignments: responseData.stats.total_assignments,
      average: responseData.stats.average_score,
    });

    // 14. Return success response
    return NextResponse.json<StudentGradebookResponse>(
      {
        success: true,
        data: responseData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('💥 Unexpected error in GET /api/gradebook/student:', error);
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
