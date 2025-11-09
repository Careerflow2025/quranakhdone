/**
 * Parent Gradebook API Endpoint
 * GET /api/gradebook/parent?child_id=... - Get gradebook data for parent's child
 *
 * Created: 2025-11-09
 * Purpose: Parents view grades for their linked children
 * RLS: All operations enforce school-level isolation + parent-child relationship verification
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

interface ParentGradebookData {
  child_id: string;
  child_name: string;
  child_email: string;
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

interface ParentGradebookResponse {
  success: boolean;
  data: ParentGradebookData;
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
// GET /api/gradebook/parent - Get Parent's Child Gradebook Data
// ============================================================================

export async function GET(request: NextRequest) {
  try {
    console.log('📊 GET /api/gradebook/parent - Request received');

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

    // 5. Verify user is a parent
    if (profile.role !== 'parent') {
      console.error('❌ User is not a parent:', profile.role);
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Access denied - Only parents can access this endpoint',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 6. Get child_id from query params
    const { searchParams } = new URL(request.url);
    const childId = searchParams.get('child_id');

    if (!childId) {
      console.error('❌ No child_id provided');
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Missing required parameter: child_id',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    console.log('🔍 Fetching gradebook for child:', childId);

    // 7. Get parent record
    const { data: parent, error: parentError } = await supabaseAdmin
      .from('parents')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (parentError || !parent) {
      console.error('❌ Parent record not found:', parentError);
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Parent record not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    console.log('✅ Parent record found:', parent.id);

    // 8. Verify parent-child relationship
    const { data: parentChildLink, error: linkError } = await supabaseAdmin
      .from('parent_students')
      .select('parent_id, student_id')
      .eq('parent_id', parent.id)
      .eq('student_id', childId)
      .single();

    if (linkError || !parentChildLink) {
      console.error('❌ Parent-child relationship not found:', linkError);
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'You do not have access to this child\'s gradebook',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    console.log('✅ Parent-child relationship verified');

    // 9. Get student info
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
      .eq('id', childId)
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

    // 10. Check school isolation
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

    // 11. Get all grades for this student
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
      .eq('student_id', childId)
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

    // 12. Filter grades by school (ensure assignments belong to school)
    const schoolGrades = (grades || []).filter(
      (g: any) => g.assignments?.school_id === profile.school_id
    );

    console.log('✅ School grades filtered:', schoolGrades.length, 'grades');

    // 13. Get unique assignment IDs to fetch rubrics
    const uniqueAssignmentIds = [...new Set(schoolGrades.map((g: any) => g.assignment_id))];
    console.log('🔍 Fetching rubrics for', uniqueAssignmentIds.length, 'assignments');

    // 14. Fetch rubrics for these assignments
    const { data: assignmentRubrics, error: rubricsError } = await supabaseAdmin
      .from('assignment_rubrics')
      .select(`
        assignment_id,
        rubric_id,
        rubrics:rubric_id (
          id,
          name,
          description
        )
      `)
      .in('assignment_id', uniqueAssignmentIds);

    if (rubricsError) {
      console.error('⚠️ Error fetching rubrics:', rubricsError);
      // Don't fail the request, just log the error
    }

    console.log('✅ Rubrics fetched:', assignmentRubrics?.length || 0, 'rubric links');

    // Get unique rubric IDs to fetch criteria
    const uniqueRubricIds = [...new Set(
      (assignmentRubrics || [])
        .map((ar: any) => ar.rubric_id)
        .filter(Boolean)
    )];

    console.log('🔍 Fetching criteria for', uniqueRubricIds.length, 'rubrics');

    // Fetch rubric criteria
    const { data: rubricCriteria, error: criteriaError } = await supabaseAdmin
      .from('rubric_criteria')
      .select('*')
      .in('rubric_id', uniqueRubricIds)
      .order('order', { ascending: true });

    if (criteriaError) {
      console.error('⚠️ Error fetching rubric criteria:', criteriaError);
    }

    console.log('✅ Rubric criteria fetched:', rubricCriteria?.length || 0, 'criteria');

    // Create maps for rubric data
    const assignmentRubricMap = new Map<string, any>();
    const rubricCriteriaMap = new Map<string, any[]>();

    // Group criteria by rubric_id
    (rubricCriteria || []).forEach((criterion: any) => {
      if (!rubricCriteriaMap.has(criterion.rubric_id)) {
        rubricCriteriaMap.set(criterion.rubric_id, []);
      }
      rubricCriteriaMap.get(criterion.rubric_id)!.push(criterion);
    });

    // Build complete rubric objects for each assignment
    (assignmentRubrics || []).forEach((ar: any) => {
      if (ar.rubrics?.name) {
        const criteria = rubricCriteriaMap.get(ar.rubric_id) || [];
        const total_weight = criteria.reduce((sum: number, c: any) => sum + (c.weight || 0), 0);

        assignmentRubricMap.set(ar.assignment_id, {
          id: ar.rubrics.id,
          name: ar.rubrics.name,
          description: ar.rubrics.description || null,
          total_criteria: criteria.length,
          total_weight: Math.round(total_weight * 10) / 10, // Round to 1 decimal
          criteria: criteria,
        });
      }
    });

    // 15. Group grades by assignment
    const assignmentGradesMap = new Map<string, any[]>();
    schoolGrades.forEach((grade: any) => {
      if (!assignmentGradesMap.has(grade.assignment_id)) {
        assignmentGradesMap.set(grade.assignment_id, []);
      }
      assignmentGradesMap.get(grade.assignment_id)!.push(grade);
    });

    // 16. Transform to gradebook entries with assignment-level grouping
    const entries = Array.from(assignmentGradesMap.entries()).map(([assignmentId, grades]) => {
      const firstGrade = grades[0];
      const rubricData = assignmentRubricMap.get(assignmentId);

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
        rubric_name: rubricData?.name || null, // Just the name for display
        rubric: rubricData || null, // Complete rubric object with criteria
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

    // 17. Calculate statistics
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

    // 18. Build response
    const responseData = {
      child_id: childId,
      child_name: (student as any).profiles?.display_name || 'Unknown',
      child_email: (student as any).profiles?.email || '',
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
      child: responseData.child_name,
      total_assignments: responseData.stats.total_assignments,
      average: responseData.stats.average_score,
    });

    // 19. Return success response
    return NextResponse.json<ParentGradebookResponse>(
      {
        success: true,
        data: responseData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('💥 Unexpected error in GET /api/gradebook/parent:', error);
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
