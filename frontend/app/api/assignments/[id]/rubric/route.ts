/**
 * Assignment Rubric API Endpoints
 * POST /api/assignments/:id/rubric - Attach rubric to assignment
 *
 * Created: 2025-10-20
 * Purpose: Attach rubrics to assignments for grading
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  validateAttachRubricRequest,
  canAttachRubric,
  validateRubricHasCriteria,
  validateRubricComplete,
} from '@/lib/validators/gradebook';
import {
  AttachRubricResponse,
  GradebookErrorResponse,
  RubricWithDetails,
} from '@/lib/types/gradebook';

// ============================================================================
// POST /api/assignments/:id/rubric - Attach Rubric
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const assignmentId = params.id;

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

    // 4. Check permissions (only teachers can attach rubrics)
    if (!canAttachRubric({
      userId: user.id,
      userRole: profile.role,
      schoolId: profile.school_id,
    })) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Only teachers can attach rubrics to assignments',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 5. Parse and validate request body
    const body = await request.json();
    const validation = validateAttachRubricRequest(body);

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

    const { rubric_id } = validation.data;

    // 6. Verify assignment exists and belongs to same school
    const { data: assignment, error: assignmentError } = await supabase
      .from('assignments')
      .select('id, school_id, created_by_teacher_id')
      .eq('id', assignmentId)
      .single();

    if (assignmentError || !assignment) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Assignment not found',
          code: 'NOT_FOUND',
          details: { assignmentError },
        },
        { status: 404 }
      );
    }

    // Verify assignment is in same school
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

    // 7. Verify rubric exists and belongs to same school
    const { data: rubric, error: rubricError } = await supabase
      .from('rubrics')
      .select('*, rubric_criteria(*)')
      .eq('id', rubric_id)
      .single();

    if (rubricError || !rubric) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Rubric not found',
          code: 'NOT_FOUND',
          details: { rubricError },
        },
        { status: 404 }
      );
    }

    // Verify rubric is in same school
    if (rubric.school_id !== profile.school_id) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Rubric not found in your school',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 8. Validate rubric has criteria
    const rubricWithDetails: RubricWithDetails = {
      ...rubric,
      criteria: rubric.rubric_criteria || [],
    };

    const hasCriteriaValidation = validateRubricHasCriteria(rubricWithDetails);
    if (!hasCriteriaValidation.valid) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: hasCriteriaValidation.error || 'Rubric has no criteria',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // 9. Validate rubric is complete (weights sum to 100)
    const completeValidation = validateRubricComplete(rubricWithDetails);
    if (!completeValidation.valid) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: completeValidation.error || 'Rubric is incomplete',
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // 10. Check if assignment already has a rubric
    const { data: existingAttachment } = await supabase
      .from('assignment_rubrics')
      .select('rubric_id')
      .eq('assignment_id', assignmentId)
      .single();

    if (existingAttachment) {
      // Update existing attachment
      const { error: updateError } = await supabase
        .from('assignment_rubrics')
        .update({ rubric_id })
        .eq('assignment_id', assignmentId);

      if (updateError) {
        console.error('Rubric attachment update error:', updateError);
        return NextResponse.json<GradebookErrorResponse>(
          {
            success: false,
            error: 'Failed to update rubric attachment',
            code: 'DATABASE_ERROR',
            details: { updateError },
          },
          { status: 500 }
        );
      }
    } else {
      // Create new attachment
      const { error: insertError } = await supabase
        .from('assignment_rubrics')
        .insert({
          assignment_id: assignmentId,
          rubric_id,
        });

      if (insertError) {
        console.error('Rubric attachment error:', insertError);
        return NextResponse.json<GradebookErrorResponse>(
          {
            success: false,
            error: 'Failed to attach rubric',
            code: 'DATABASE_ERROR',
            details: { insertError },
          },
          { status: 500 }
        );
      }
    }

    // 11. Build response with detailed rubric information
    const sortedCriteria = (rubric.rubric_criteria || []).sort(
      (a: any, b: any) => a.order - b.order
    );

    const responseRubric: RubricWithDetails = {
      id: rubric.id,
      school_id: rubric.school_id,
      name: rubric.name,
      description: rubric.description,
      created_by: rubric.created_by,
      created_at: rubric.created_at,
      updated_at: rubric.updated_at,
      criteria: sortedCriteria,
      total_criteria: sortedCriteria.length,
      total_weight: sortedCriteria.reduce((sum: number, c: any) => sum + (c.weight || 0), 0),
    };

    // 12. Return success response
    return NextResponse.json<AttachRubricResponse>(
      {
        success: true,
        data: {
          assignment_id: assignmentId,
          rubric_id,
          rubric: responseRubric,
        },
        message: `Rubric "${rubric.name}" attached to assignment successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/assignments/:id/rubric:', error);
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
