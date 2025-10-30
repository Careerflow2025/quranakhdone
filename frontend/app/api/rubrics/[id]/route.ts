/**
 * Single Rubric API Endpoints
 * GET /api/rubrics/:id - Get single rubric with criteria
 * PATCH /api/rubrics/:id - Update rubric
 * DELETE /api/rubrics/:id - Delete rubric
 *
 * Created: 2025-10-20
 * Purpose: Individual rubric management for gradebook system
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseAdmin } from '@/lib/supabase-admin';
import {
  validateUpdateRubricRequest,
  canViewRubric,
  canUpdateRubric,
  canDeleteRubric,
  validateRubricNotInUse,
} from '@/lib/validators/gradebook';
import {
  GetRubricResponse,
  UpdateRubricResponse,
  DeleteRubricResponse,
  GradebookErrorResponse,
  RubricWithDetails,
} from '@/lib/types/gradebook';


// Force dynamic rendering - prevent static generation at build time
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
// ============================================================================
// GET /api/rubrics/:id - Get Single Rubric
// ============================================================================

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rubricId = params.id;

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

    // 3. Get user profile
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

    // 4. Fetch rubric with criteria and creator info
    const { data: rubric, error: rubricError } = await supabaseAdmin
      .from('rubrics')
      .select(`
        *,
        rubric_criteria(
          id,
          name,
          description,
          weight,
          max_score,
          order,
          created_at
        )
      `)
      .eq('id', rubricId)
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

    // 5. Check permissions
    const hasPermission = canViewRubric(
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
          error: 'Insufficient permissions to view this rubric',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 6. Get creator details
    const { data: creator } = await supabaseAdmin
      .from('profiles')
      .select('user_id, display_name, email')
      .eq('user_id', rubric.created_by)
      .single();

    // 7. Get assignment count (how many assignments use this rubric)
    const { count: assignmentCount } = await supabaseAdmin
      .from('assignment_rubrics')
      .select('assignment_id', { count: 'exact', head: true })
      .eq('rubric_id', rubricId);

    // 8. Sort criteria by order
    const sortedCriteria = (rubric.rubric_criteria || []).sort(
      (a: any, b: any) => a.order - b.order
    );

    // 9. Build response with detailed rubric information
    const rubricWithDetails: RubricWithDetails = {
      id: rubric.id,
      school_id: rubric.school_id,
      name: rubric.name,
      description: rubric.description,
      created_by: rubric.created_by,
      created_at: rubric.created_at,
      updated_at: rubric.updated_at,
      criteria: sortedCriteria,
      created_by_teacher: creator
        ? {
            id: creator.user_id,
            display_name: creator.display_name || 'Unknown',
            email: creator.email,
          }
        : undefined,
      total_criteria: sortedCriteria.length,
      total_weight: sortedCriteria.reduce((sum: number, c: any) => sum + (c.weight || 0), 0),
      assignment_count: assignmentCount || 0,
    };

    // 10. Return success response
    return NextResponse.json<GetRubricResponse>(
      {
        success: true,
        data: {
          rubric: rubricWithDetails,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/rubrics/:id:', error);
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
// PATCH /api/rubrics/:id - Update Rubric
// ============================================================================

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rubricId = params.id;

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

    // 3. Get user profile
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

    // 4. Fetch existing rubric
    const { data: existingRubric, error: rubricError } = await supabaseAdmin
      .from('rubrics')
      .select('*')
      .eq('id', rubricId)
      .single();

    if (rubricError || !existingRubric) {
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
        rubricSchoolId: existingRubric.school_id,
        rubricCreatedBy: existingRubric.created_by,
      }
    );

    if (!hasPermission) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Insufficient permissions to update this rubric',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 6. Parse and validate request body
    const body = await request.json();
    const validation = validateUpdateRubricRequest(body);

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

    const { name, description } = validation.data;

    // 7. Build update object
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (name !== undefined) {
      updateData.name = name;
    }

    if (description !== undefined) {
      updateData.description = description;
    }

    // 8. Update rubric
    const { data: updatedRubric, error: updateError } = await supabaseAdmin
      .from('rubrics')
      .update(updateData)
      .eq('id', rubricId)
      .select()
      .single();

    if (updateError || !updatedRubric) {
      console.error('Rubric update error:', updateError);
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Failed to update rubric',
          code: 'DATABASE_ERROR',
          details: { updateError },
        },
        { status: 500 }
      );
    }

    // 9. Fetch updated rubric with criteria
    const { data: rubricWithCriteria } = await supabaseAdmin
      .from('rubrics')
      .select('*, rubric_criteria(*)')
      .eq('id', rubricId)
      .single();

    const sortedCriteria = (rubricWithCriteria?.rubric_criteria || []).sort(
      (a: any, b: any) => a.order - b.order
    );

    const rubricWithDetails: RubricWithDetails = {
      ...updatedRubric,
      criteria: sortedCriteria,
      total_criteria: sortedCriteria.length,
      total_weight: sortedCriteria.reduce((sum: number, c: any) => sum + (c.weight || 0), 0),
    };

    // 10. Return success response
    return NextResponse.json<UpdateRubricResponse>(
      {
        success: true,
        data: {
          rubric: rubricWithDetails,
        },
        message: 'Rubric updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in PATCH /api/rubrics/:id:', error);
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
// DELETE /api/rubrics/:id - Delete Rubric
// ============================================================================

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const rubricId = params.id;

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

    // 3. Get user profile
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

    // 4. Fetch rubric with assignment count
    const { data: rubric, error: rubricError } = await supabaseAdmin
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
    const hasPermission = canDeleteRubric(
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
          error: 'Insufficient permissions to delete this rubric',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 6. Check if rubric is in use
    const { count: assignmentCount } = await supabaseAdmin
      .from('assignment_rubrics')
      .select('assignment_id', { count: 'exact', head: true })
      .eq('rubric_id', rubricId);

    const rubricWithDetails: RubricWithDetails = {
      ...rubric,
      assignment_count: assignmentCount || 0,
    };

    const inUseValidation = validateRubricNotInUse(rubricWithDetails);
    if (!inUseValidation.valid) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: inUseValidation.error || 'Rubric is in use',
          code: 'RUBRIC_IN_USE',
        },
        { status: 400 }
      );
    }

    // 7. Delete rubric (criteria will be cascade deleted)
    const { error: deleteError } = await supabaseAdmin
      .from('rubrics')
      .delete()
      .eq('id', rubricId);

    if (deleteError) {
      console.error('Rubric deletion error:', deleteError);
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Failed to delete rubric',
          code: 'DATABASE_ERROR',
          details: { deleteError },
        },
        { status: 500 }
      );
    }

    // 8. Return success response
    return NextResponse.json<DeleteRubricResponse>(
      {
        success: true,
        data: {
          deleted_rubric_id: rubricId,
        },
        message: `Rubric "${rubric.name}" deleted successfully`,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in DELETE /api/rubrics/:id:', error);
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
