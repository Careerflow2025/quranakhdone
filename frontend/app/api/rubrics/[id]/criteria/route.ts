/**
 * Rubric Criteria API Endpoints
 * POST /api/rubrics/:id/criteria - Add criterion to rubric
 *
 * Created: 2025-10-20
 * Purpose: Criterion management for rubrics
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  validateCreateCriterionRequest,
  canUpdateRubric,
  validateWeightsSum100,
} from '@/lib/validators/gradebook';
import {
  CreateCriterionResponse,
  GradebookErrorResponse,
  getNextCriterionOrder,
  GRADEBOOK_CONSTANTS,
} from '@/lib/types/gradebook';

// ============================================================================
// POST /api/rubrics/:id/criteria - Add Criterion
// ============================================================================

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rubricId = params.id;

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

    // 4. Fetch existing rubric with criteria
    const { data: rubric, error: rubricError } = await supabase
      .from('rubrics')
      .select('*, rubric_criteria(*)')
      .eq('id', rubricId)
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

    // 5. Check permissions
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
          error: 'Insufficient permissions to add criteria to this rubric',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 6. Check criteria count limit
    const existingCriteria = rubric.rubric_criteria || [];
    if (existingCriteria.length >= GRADEBOOK_CONSTANTS.MAX_CRITERIA_PER_RUBRIC) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: `Rubric already has maximum of ${GRADEBOOK_CONSTANTS.MAX_CRITERIA_PER_RUBRIC} criteria`,
          code: 'VALIDATION_ERROR',
        },
        { status: 400 }
      );
    }

    // 7. Parse and validate request body
    const body = await request.json();
    const validation = validateCreateCriterionRequest(body);

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

    // 8. Validate total weights (existing + new criterion)
    const newCriteria = [
      ...existingCriteria,
      { weight },
    ];

    const weightsValidation = validateWeightsSum100(newCriteria);
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

    // 9. Determine order
    const criterionOrder = order || getNextCriterionOrder(existingCriteria);

    // 10. Create criterion
    const { data: criterion, error: criterionError } = await supabase
      .from('rubric_criteria')
      .insert({
        rubric_id: rubricId,
        name,
        description: description || null,
        weight,
        max_score,
        order: criterionOrder,
      })
      .select()
      .single();

    if (criterionError || !criterion) {
      console.error('Criterion creation error:', criterionError);
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Failed to create criterion',
          code: 'DATABASE_ERROR',
          details: { criterionError },
        },
        { status: 500 }
      );
    }

    // 11. Return success response
    return NextResponse.json<CreateCriterionResponse>(
      {
        success: true,
        data: {
          criterion,
          rubric_id: rubricId,
        },
        message: `Criterion "${name}" added successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/rubrics/:id/criteria:', error);
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
