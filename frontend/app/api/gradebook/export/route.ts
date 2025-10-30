/**
 * Gradebook Export API Endpoint
 * GET /api/gradebook/export - Export gradebook data to CSV
 *
 * Created: 2025-10-20
 * Purpose: Export student grades to CSV format for teachers
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  canExportGradebook,
  validateExportDateRange,
} from '@/lib/validators/gradebook';
import {
  ExportGradebookResponse,
  GradebookErrorResponse,
  StudentGradebookEntry,
  formatGradebookCSV,
  getLetterGrade,
  calculateWeightedAverage,
  calculateOverallScore,
} from '@/lib/types/gradebook';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// ============================================================================
// GET /api/gradebook/export - Export Gradebook
// ============================================================================

export async function GET(request: NextRequest) {
  try {
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

    // 4. Check permissions (only teachers can export gradebook)
    if (!canExportGradebook({
      userId: user.id,
      userRole: profile.role,
      schoolId: profile.school_id,
    })) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Only teachers can export gradebook',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 5. Parse query parameters
    const { searchParams } = new URL(request.url);
    const student_id = searchParams.get('student_id') || undefined;
    const start_date = searchParams.get('start_date') || undefined;
    const end_date = searchParams.get('end_date') || undefined;
    const format = (searchParams.get('format') || 'csv') as 'csv' | 'pdf';
    const include_comments = searchParams.get('include_comments') === 'true';

    // 6. Validate date range
    if (start_date && end_date) {
      const dateValidation = validateExportDateRange(start_date, end_date);
      if (!dateValidation.valid) {
        return NextResponse.json<GradebookErrorResponse>(
          {
            success: false,
            error: dateValidation.error || 'Invalid date range',
            code: 'VALIDATION_ERROR',
          },
          { status: 400 }
        );
      }
    }

    // 7. Build assignment query
    let assignmentQuery = supabase
      .from('assignments')
      .select('id, title, due_at, status, student_id')
      .eq('school_id', profile.school_id);

    // Filter by student if specified
    if (student_id) {
      assignmentQuery = assignmentQuery.eq('student_id', student_id);
    }

    // Filter by date range
    if (start_date) {
      assignmentQuery = assignmentQuery.gte('created_at', start_date);
    }
    if (end_date) {
      assignmentQuery = assignmentQuery.lte('created_at', end_date);
    }

    assignmentQuery = assignmentQuery.order('created_at', { ascending: false });

    // 8. Execute query
    const { data: assignments, error: assignmentsError } = await assignmentQuery;

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

    // 9. Build gradebook entries
    const entries: StudentGradebookEntry[] = [];

    for (const assignment of assignments || []) {
      // Fetch assignment's rubric
      const { data: assignmentRubric } = await supabase
        .from('assignment_rubrics')
        .select('rubric:rubric_id(*)')
        .eq('assignment_id', assignment.id)
        .single();

      if (!assignmentRubric || !assignmentRubric.rubric) {
        continue; // Skip assignments without rubrics
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
        .eq('student_id', assignment.student_id);

      // Build grades with details
      const gradesWithDetails = (assignmentGrades || []).map((grade: any) => ({
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
      }));

      if (gradesWithDetails.length === 0) {
        continue; // Skip ungraded assignments
      }

      // Calculate overall scores
      const overallScoreCalc = calculateOverallScore(gradesWithDetails);
      const weightedAverage = calculateWeightedAverage(gradesWithDetails);

      // Find most recent grade timestamp
      const gradedAt = gradesWithDetails.reduce((latest, g) =>
        g.updated_at > latest ? g.updated_at : latest
      , gradesWithDetails[0].updated_at);

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

    // 10. Generate CSV
    if (format === 'csv') {
      const csvData = formatGradebookCSV(entries);

      // Return CSV as downloadable file
      return new NextResponse(csvData, {
        status: 200,
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="gradebook_export_${new Date().toISOString().split('T')[0]}.csv"`,
        },
      });
    }

    // 11. PDF export (placeholder)
    if (format === 'pdf') {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'PDF export not yet implemented',
          code: 'NOT_IMPLEMENTED',
        },
        { status: 501 }
      );
    }

    return NextResponse.json<GradebookErrorResponse>(
      {
        success: false,
        error: 'Invalid export format',
        code: 'VALIDATION_ERROR',
      },
      { status: 400 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/gradebook/export:', error);
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
