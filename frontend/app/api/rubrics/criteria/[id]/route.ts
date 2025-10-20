/**
 * Single Criterion API Endpoints
 * PATCH /api/rubrics/criteria/:id - Update criterion
 * DELETE /api/rubrics/criteria/:id - Delete criterion
 *
 * Created: 2025-10-20
 * Purpose: Individual criterion management for rubrics
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  validateUpdateCriterionRequest,
  canUpdateRubric,
  validateWeightsSum100,
} from '@/lib/validators/gradebook';
import {
  UpdateCriterionResponse,
  DeleteCriterionResponse,
  GradebookErrorResponse,
} from '@/lib/types/gradebook';

// ============================================================================
// PATCH /api/rubrics/criteria/:id - Update Criterion
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const criterionId = params.id;

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

    // 4. Fetch existing criterion
    const { data: existingCriterion, error: criterionError } = await supabase
      .from('rubric_criteria')
      .select('*')
      .eq('id', criterionId)
      .single();

    if (criterionError || !existingCriterion) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Criterion not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 5. Fetch rubric to check permissions
    const { data: rubric, error: rubricError } = await supabase
      .from('rubrics')
      .select('*')
      .eq('id', existingCriterion.rubric_id)
      .single();

    if (rubricError || !rubric) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Rubric not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 6. Check permissions
    const hasPermission = canUpdateRubric(
      {
        userId: user.id,
        userRole: profile.role,
        schoolId: profile.school_id,
      },
      {
        rubricSchoolId: rubric.school_id,
        rubricCreatedBy: rubric.created_by,
      }
    );

    if (!hasPermission) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to update this criterion',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 7. Parse and validate request body
    const body = await request.json();
    const validation = validateUpdateCriterionRequest(body);

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

    const { name, description, weight, max_score, order } = validation.data;

    // 8. If weight is being updated, validate total weights
    if (weight !== undefined && weight !== existingCriterion.weight) {
      // Fetch all criteria for this rubric
      const { data: allCriteria } = await supabase
        .from('rubric_criteria')
        .select('id, weight')
        .eq('rubric_id', existingCriterion.rubric_id);

      if (allCriteria) {
        // Calculate new total weight
        const updatedCriteria = allCriteria.map((c) =>
          c.id === criterionId ? { ...c, weight } : c
        );

        const weightsValidation = validateWeightsSum100(updatedCriteria);
        if (!weightsValidation.valid) {
          return NextResponse.json<GradebookErrorResponse>(
            {
              success: false,
              error: weightsValidation.error || 'Invalid weight total',
              code: 'INVALID_WEIGHT',
            },
            { status: 400 }
          );
        }
      }
    }

    // 9. Build update object
    const updateData: any = {};

    if (name !== undefined) {
      updateData.name = name;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    if (weight !== undefined) {
      updateData.weight = weight;
    }

    if (max_score !== undefined) {
      updateData.max_score = max_score;
    }

    if (order !== undefined) {
      updateData.order = order;
    }

    // 10. Update criterion
    const { data: updatedCriterion, error: updateError } = await supabase
      .from('rubric_criteria')
      .update(updateData)
      .eq('id', criterionId)
      .select()
      .single();

    if (updateError || !updatedCriterion) {
      console.error('Criterion update error:', updateError);
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Failed to update criterion',
          code: 'DATABASE_ERROR',
          details: { updateError },
        },
        { status: 500 }
      );
    }

    // 11. Return success response
    return NextResponse.json<UpdateCriterionResponse>(
      {
        success: true,
        data: {
          criterion: updatedCriterion,
        },
        message: 'Criterion updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in PATCH /api/rubrics/criteria/:id:', error);
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

// ============================================================================
// DELETE /api/rubrics/criteria/:id - Delete Criterion
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const criterionId = params.id;

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

    // 4. Fetch existing criterion
    const { data: existingCriterion, error: criterionError } = await supabase
      .from('rubric_criteria')
      .select('*')
      .eq('id', criterionId)
      .single();

    if (criterionError || !existingCriterion) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Criterion not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 5. Fetch rubric to check permissions
    const { data: rubric, error: rubricError } = await supabase
      .from('rubrics')
      .select('*')
      .eq('id', existingCriterion.rubric_id)
      .single();

    if (rubricError || !rubric) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Rubric not found',
          code: 'NOT_FOUND',
        },
        { status: 404 }
      );
    }

    // 6. Check permissions
    const hasPermission = canUpdateRubric(
      {
        userId: user.id,
        userRole: profile.role,
        schoolId: profile.school_id,
      },
      {
        rubricSchoolId: rubric.school_id,
        rubricCreatedBy: rubric.created_by,
      }
    );

    if (!hasPermission) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to delete this criterion',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 7. Check if criterion has grades
    const { count: gradeCount } = await supabase
      .from('grades')
      .select('id', { count: 'exact', head: true })
      .eq('criterion_id', criterionId);

    if (gradeCount && gradeCount > 0) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: `Cannot delete criterion "${existingCriterion.name}". It has ${gradeCount} grade(s) associated with it`,
          code: 'CRITERION_IN_USE',
        },
        { status: 400 }
      );
    }

    // 8. Delete criterion
    const { error: deleteError } = await supabase
      .from('rubric_criteria')
      .delete()
      .eq('id', criterionId);

    if (deleteError) {
      console.error('Criterion deletion error:', deleteError);
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Failed to delete criterion',
          code: 'DATABASE_ERROR',
          details: { deleteError },
        },
        { status: 500 }
      );
    }

    // 9. Return success response
    return NextResponse.json<DeleteCriterionResponse>(
      {
        success: true,
        data: {
          deleted_criterion_id: criterionId,
          rubric_id: existingCriterion.rubric_id,
        },
        message: `Criterion "${existingCriterion.name}" deleted successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in DELETE /api/rubrics/criteria/:id:', error);
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
