/**
 * Grades API Endpoints
 * POST /api/grades - Submit grade for student on assignment criterion
 *
 * Created: 2025-10-20
 * Purpose: Grade submission for rubric-based assessment
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  validateSubmitGradeRequest,
  canSubmitGrade,
  validateScoreInRange,
} from '@/lib/validators/gradebook';
import {
  SubmitGradeResponse,
  GradebookErrorResponse,
  GradeWithDetails,
} from '@/lib/types/gradebook';

// ============================================================================
// POST /api/grades - Submit Grade
// ============================================================================

export async function POST(request: NextRequest) {
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

    // 3. Get authenticated user using admin client
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
      .select('user_id, school_id, role, display_name, email')
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

    // 5. Check permissions (only teachers can submit grades)
    if (!canSubmitGrade({
      userId: user.id,
      userRole: profile.role,
      schoolId: profile.school_id,
    })) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Only teachers can submit grades',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 6. Parse and validate request body
    const body = await request.json();
    const validation = validateSubmitGradeRequest(body);

    if (!validation.success) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: validation.error || 'Validation failed',
          code: 'VALIDATION_ERROR',
          details: { errors: validation.errors },
        },
        { status: 400 }
      );
    }

    const { assignment_id, student_id, criterion_id, score, max_score, comments } =
      validation.data;

    // 7. Verify assignment exists and belongs to same school
    const { data: assignment, error: assignmentError } = await supabaseAdmin
      .from('assignments')
      .select('id, school_id')
      .eq('id', assignment_id)
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

    if (assignment.school_id !== profile.school_id) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Assignment not found in your school',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 8. Verify student exists and belongs to same school
    const { data: student } = await supabaseAdmin
      .from('students')
      .select('id, user_id')
      .eq('id', student_id)
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

    const { data: studentProfile } = await supabaseAdmin
      .from('profiles')
      .select('school_id, display_name, email')
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

    // 9. Verify criterion exists and get its details
    const { data: criterion, error: criterionError } = await supabaseAdmin
      .from('rubric_criteria')
      .select('id, name, weight, max_score, rubric_id')
      .eq('id', criterion_id)
      .single();

    if (criterionError || !criterion) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Criterion not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 10. Verify criterion belongs to assignment's rubric
    const { data: assignmentRubric } = await supabaseAdmin
      .from('assignment_rubrics')
      .select('rubric_id')
      .eq('assignment_id', assignment_id)
      .single();

    if (!assignmentRubric || assignmentRubric.rubric_id !== criterion.rubric_id) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Criterion does not belong to this assignment\'s rubric',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // 11. Validate score is in range
    const scoreValidation = validateScoreInRange(score, max_score);
    if (!scoreValidation.valid) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: scoreValidation.error || 'Invalid score',
          code: 'INVALID_SCORE',
        },
        { status: 400 }
      );
    }

    // 12. Check if grade already exists for this criterion
    const { data: existingGrade } = await supabaseAdmin
      .from('grades')
      .select('id')
      .eq('assignment_id', assignment_id)
      .eq('student_id', student_id)
      .eq('criterion_id', criterion_id)
      .single();

    if (existingGrade) {
      // Update existing grade
      const { data: updatedGrade, error: updateError } = await supabaseAdmin
        .from('grades')
        .update({
          score,
          max_score,
          comments: comments || null,
          graded_by: user.id,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingGrade.id)
        .select()
        .single();

      if (updateError || !updatedGrade) {
        console.error('Grade update error:', updateError);
        return NextResponse.json<GradebookErrorResponse>(
          {
            success: false,
            error: 'Failed to update grade',
            code: 'DATABASE_ERROR',
            details: { updateError },
          },
          { status: 500 }
        );
      }

      // Build detailed response
      const gradeWithDetails: GradeWithDetails = {
        ...updatedGrade,
        student: {
          id: student_id,
          display_name: studentProfile.display_name || 'Unknown',
          email: studentProfile.email,
        },
        criterion: {
          id: criterion.id,
          name: criterion.name,
          weight: criterion.weight,
          max_score: criterion.max_score,
        },
        graded_by_teacher: {
          id: user.id,
          display_name: profile.display_name || 'Unknown',
          email: profile.email,
        },
        percentage: (score / max_score) * 100,
      };

      // Calculate progress
      const { count: totalCriteria } = await supabaseAdmin
        .from('rubric_criteria')
        .select('id', { count: 'exact', head: true })
        .eq('rubric_id', criterion.rubric_id);

      const { count: gradedCriteria } = await supabaseAdmin
        .from('grades')
        .select('id', { count: 'exact', head: true })
        .eq('assignment_id', assignment_id)
        .eq('student_id', student_id);

      return NextResponse.json<SubmitGradeResponse>(
        {
          success: true,
          data: {
            grade: gradeWithDetails,
            overall_progress: {
              graded_criteria: gradedCriteria || 0,
              total_criteria: totalCriteria || 0,
              percentage: totalCriteria ? ((gradedCriteria || 0) / totalCriteria) * 100 : 0,
            },
          },
          message: 'Grade updated successfully',
        },
        { status: 200 }
      );
    } else {
      // Create new grade
      const { data: newGrade, error: insertError } = await supabaseAdmin
        .from('grades')
        .insert({
          assignment_id,
          student_id,
          criterion_id,
          score,
          max_score,
          comments: comments || null,
          graded_by: user.id,
        })
        .select()
        .single();

      if (insertError || !newGrade) {
        console.error('Grade creation error:', insertError);
        return NextResponse.json<GradebookErrorResponse>(
          {
            success: false,
            error: 'Failed to create grade',
            code: 'DATABASE_ERROR',
            details: { insertError },
          },
          { status: 500 }
        );
      }

      // Build detailed response
      const gradeWithDetails: GradeWithDetails = {
        ...newGrade,
        student: {
          id: student_id,
          display_name: studentProfile.display_name || 'Unknown',
          email: studentProfile.email,
        },
        criterion: {
          id: criterion.id,
          name: criterion.name,
          weight: criterion.weight,
          max_score: criterion.max_score,
        },
        graded_by_teacher: {
          id: user.id,
          display_name: profile.display_name || 'Unknown',
          email: profile.email,
        },
        percentage: (score / max_score) * 100,
      };

      // Calculate progress
      const { count: totalCriteria } = await supabaseAdmin
        .from('rubric_criteria')
        .select('id', { count: 'exact', head: true })
        .eq('rubric_id', criterion.rubric_id);

      const { count: gradedCriteria } = await supabaseAdmin
        .from('grades')
        .select('id', { count: 'exact', head: true })
        .eq('assignment_id', assignment_id)
        .eq('student_id', student_id);

      return NextResponse.json<SubmitGradeResponse>(
        {
          success: true,
          data: {
            grade: gradeWithDetails,
            overall_progress: {
              graded_criteria: gradedCriteria || 0,
              total_criteria: totalCriteria || 0,
              percentage: totalCriteria ? ((gradedCriteria || 0) / totalCriteria) * 100 : 0,
            },
          },
          message: 'Grade submitted successfully',
        },
        { status: 201 }
      );
    }
  } catch (error) {
    console.error('Unexpected error in POST /api/grades:', error);
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
