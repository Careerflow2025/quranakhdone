/**
 * Rubrics API Endpoints
 * POST /api/rubrics - Create new rubric with optional criteria
 * GET /api/rubrics - List rubrics with filters
 *
 * Created: 2025-10-20
 * Purpose: Rubric management for gradebook system
 * RLS: All operations enforce school-level isolation via Supabase RLS policies
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import {
  validateCreateRubricRequest,
  canCreateRubric,
  listRubricsQuerySchema,
} from '@/lib/validators/gradebook';
import {
  CreateRubricResponse,
  ListRubricsResponse,
  GradebookErrorResponse,
  RubricWithDetails,
  getNextCriterionOrder,
} from '@/lib/types/gradebook';

// ============================================================================
// POST /api/rubrics - Create Rubric
// ============================================================================

export async function POST(request: NextRequest) {
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

    // 3. Get user profile with school_id and role
    const { data: profile, error: profileError } = await supabase
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
          details: { profileError },
        },
        { status: 404 }
      );
    }

    // 4. Check permissions (only teachers, admins, owners can create rubrics)
    if (!canCreateRubric({
      userId: user.id,
      userRole: profile.role,
      schoolId: profile.school_id,
    })) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Only teachers can create rubrics',
          code: 'FORBIDDEN',
        },
        { status: 403 }
      );
    }

    // 5. Parse and validate request body
    const body = await request.json();
    const validation = validateCreateRubricRequest(body);

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

    const { name, description, criteria } = validation.data;

    // 6. Create rubric
    const { data: rubric, error: rubricError } = await supabase
      .from('rubrics')
      .insert({
        school_id: profile.school_id,
        name,
        description: description || null,
        created_by: user.id,
      })
      .select()
      .single();

    if (rubricError || !rubric) {
      console.error('Rubric creation error:', rubricError);
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Failed to create rubric',
          code: 'DATABASE_ERROR',
          details: { rubricError },
        },
        { status: 500 }
      );
    }

    // 7. Create criteria if provided
    let createdCriteria: any[] = [];
    if (criteria && criteria.length > 0) {
      const criteriaToInsert = criteria.map((c, index) => ({
        rubric_id: rubric.id,
        name: c.name,
        description: c.description || null,
        weight: c.weight,
        max_score: c.max_score,
        order: c.order || index + 1,
      }));

      const { data: insertedCriteria, error: criteriaError } = await supabase
        .from('rubric_criteria')
        .insert(criteriaToInsert)
        .select();

      if (criteriaError) {
        // Rollback: Delete rubric if criteria creation fails
        await supabase.from('rubrics').delete().eq('id', rubric.id);

        console.error('Criteria creation error:', criteriaError);
        return NextResponse.json<GradebookErrorResponse>(
          {
            success: false,
            error: 'Failed to create rubric criteria',
            code: 'DATABASE_ERROR',
            details: { criteriaError },
          },
          { status: 500 }
        );
      }

      createdCriteria = insertedCriteria || [];
    }

    // 8. Build response with detailed rubric information
    const rubricWithDetails: RubricWithDetails = {
      ...rubric,
      criteria: createdCriteria,
      created_by_teacher: {
        id: user.id,
        display_name: profile.display_name || 'Unknown',
        email: profile.email,
      },
      total_criteria: createdCriteria.length,
      total_weight: createdCriteria.reduce((sum, c) => sum + (c.weight || 0), 0),
      assignment_count: 0, // New rubric, not used yet
    };

    // 9. Return success response
    return NextResponse.json<CreateRubricResponse>(
      {
        success: true,
        data: {
          rubric: rubricWithDetails,
        },
        message: `Rubric "${name}" created successfully`,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/rubrics:', error);
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
// GET /api/rubrics - List Rubrics
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

    // 3. Get user profile with school_id
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('school_id, role')
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

    // 4. Parse query parameters
    const { searchParams } = new URL(request.url);
    const queryValidation = listRubricsQuerySchema.safeParse(
      Object.fromEntries(searchParams.entries())
    );

    if (!queryValidation.success) {
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Invalid query parameters',
          code: 'VALIDATION_ERROR',
          details: { errors: queryValidation.error.errors },
        },
        { status: 400 }
      );
    }

    const { page, limit, sort_by, sort_order, search } = queryValidation.data;

    // 5. Build query
    let query = supabase
      .from('rubrics')
      .select('*, rubric_criteria(id, name, weight, max_score)', { count: 'exact' })
      .eq('school_id', profile.school_id);

    // Apply search filter
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    // Apply sorting
    if (sort_by === 'name') {
      query = query.order('name', { ascending: sort_order === 'asc' });
    } else if (sort_by === 'created_at') {
      query = query.order('created_at', { ascending: sort_order === 'asc' });
    }

    // Apply pagination
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    // 6. Execute query
    const { data: rubrics, error: rubricsError, count } = await query;

    if (rubricsError) {
      console.error('Rubrics query error:', rubricsError);
      return NextResponse.json<GradebookErrorResponse>(
        {
          success: false,
          error: 'Failed to fetch rubrics',
          code: 'DATABASE_ERROR',
          details: { rubricsError },
        },
        { status: 500 }
      );
    }

    // 7. Format response with detailed rubric information
    const rubricsWithDetails: RubricWithDetails[] = (rubrics || []).map((rubric: any) => ({
      id: rubric.id,
      school_id: rubric.school_id,
      name: rubric.name,
      description: rubric.description,
      created_by: rubric.created_by,
      created_at: rubric.created_at,
      updated_at: rubric.updated_at,
      criteria: rubric.rubric_criteria || [],
      total_criteria: rubric.rubric_criteria?.length || 0,
      total_weight: rubric.rubric_criteria?.reduce((sum: number, c: any) => sum + (c.weight || 0), 0) || 0,
    }));

    // 8. Calculate pagination
    const totalPages = Math.ceil((count || 0) / limit);

    // 9. Return success response
    return NextResponse.json<ListRubricsResponse>(
      {
        success: true,
        data: {
          rubrics: rubricsWithDetails,
          pagination: {
            page,
            limit,
            total: count || 0,
            total_pages: totalPages,
          },
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/rubrics:', error);
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
