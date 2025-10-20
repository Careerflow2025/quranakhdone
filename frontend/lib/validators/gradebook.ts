/**
 * Gradebook Validation Utilities
 * Created: 2025-10-20
 * Purpose: Server-side validation for gradebook system (rubrics, criteria, grades)
 * Dependencies: Zod for schema validation
 */

import { z } from 'zod';
import {
  GRADEBOOK_CONSTANTS,
  CreateRubricRequest,
  UpdateRubricRequest,
  CreateCriterionRequest,
  UpdateCriterionRequest,
  AttachRubricRequest,
  SubmitGradeRequest,
  BulkSubmitGradesRequest,
  ExportGradebookRequest,
  RubricWithDetails,
  RubricCriterionRow,
} from '../types/gradebook';

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * UUID validation schema
 */
const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Rubric name validation
 */
const rubricNameSchema = z
  .string()
  .min(1, 'Rubric name is required')
  .max(
    GRADEBOOK_CONSTANTS.MAX_RUBRIC_NAME_LENGTH,
    `Rubric name must be ${GRADEBOOK_CONSTANTS.MAX_RUBRIC_NAME_LENGTH} characters or less`
  );

/**
 * Rubric description validation
 */
const rubricDescriptionSchema = z
  .string()
  .max(
    GRADEBOOK_CONSTANTS.MAX_RUBRIC_DESCRIPTION_LENGTH,
    `Description must be ${GRADEBOOK_CONSTANTS.MAX_RUBRIC_DESCRIPTION_LENGTH} characters or less`
  )
  .optional();

/**
 * Criterion name validation
 */
const criterionNameSchema = z
  .string()
  .min(1, 'Criterion name is required')
  .max(
    GRADEBOOK_CONSTANTS.MAX_CRITERION_NAME_LENGTH,
    `Criterion name must be ${GRADEBOOK_CONSTANTS.MAX_CRITERION_NAME_LENGTH} characters or less`
  );

/**
 * Criterion description validation
 */
const criterionDescriptionSchema = z
  .string()
  .max(
    GRADEBOOK_CONSTANTS.MAX_CRITERION_DESCRIPTION_LENGTH,
    `Description must be ${GRADEBOOK_CONSTANTS.MAX_CRITERION_DESCRIPTION_LENGTH} characters or less`
  )
  .optional();

/**
 * Weight validation (0-100)
 */
const weightSchema = z
  .number()
  .min(GRADEBOOK_CONSTANTS.MIN_WEIGHT, `Weight must be at least ${GRADEBOOK_CONSTANTS.MIN_WEIGHT}`)
  .max(GRADEBOOK_CONSTANTS.MAX_WEIGHT, `Weight must be at most ${GRADEBOOK_CONSTANTS.MAX_WEIGHT}`);

/**
 * Score validation (non-negative)
 */
const scoreSchema = z
  .number()
  .min(GRADEBOOK_CONSTANTS.MIN_SCORE, 'Score cannot be negative');

/**
 * Max score validation (positive)
 */
const maxScoreSchema = z
  .number()
  .positive('Max score must be positive');

/**
 * Comment validation
 */
const commentSchema = z
  .string()
  .max(
    GRADEBOOK_CONSTANTS.MAX_COMMENT_LENGTH,
    `Comment must be ${GRADEBOOK_CONSTANTS.MAX_COMMENT_LENGTH} characters or less`
  )
  .optional();

/**
 * Criterion schema for nested creation
 */
const nestedCriterionSchema = z.object({
  name: criterionNameSchema,
  description: criterionDescriptionSchema,
  weight: weightSchema,
  max_score: maxScoreSchema,
  order: z.number().int().positive().optional(),
});

/**
 * Create Rubric Request Schema
 */
export const createRubricSchema = z
  .object({
    name: rubricNameSchema,
    description: rubricDescriptionSchema,
    criteria: z
      .array(nestedCriterionSchema)
      .max(
        GRADEBOOK_CONSTANTS.MAX_CRITERIA_PER_RUBRIC,
        `Rubric can have at most ${GRADEBOOK_CONSTANTS.MAX_CRITERIA_PER_RUBRIC} criteria`
      )
      .optional(),
  })
  .refine(
    (data) => {
      // If criteria provided, weights must sum to 100
      if (data.criteria && data.criteria.length > 0) {
        const totalWeight = data.criteria.reduce((sum, c) => sum + c.weight, 0);
        return Math.abs(totalWeight - GRADEBOOK_CONSTANTS.REQUIRED_WEIGHT_TOTAL) < 0.01;
      }
      return true;
    },
    {
      message: `Criterion weights must sum to ${GRADEBOOK_CONSTANTS.REQUIRED_WEIGHT_TOTAL}`,
      path: ['criteria'],
    }
  );

/**
 * Update Rubric Request Schema
 */
export const updateRubricSchema = z.object({
  name: rubricNameSchema.optional(),
  description: rubricDescriptionSchema,
});

/**
 * Create Criterion Request Schema
 */
export const createCriterionSchema = z.object({
  name: criterionNameSchema,
  description: criterionDescriptionSchema,
  weight: weightSchema,
  max_score: maxScoreSchema,
  order: z.number().int().positive().optional(),
});

/**
 * Update Criterion Request Schema
 */
export const updateCriterionSchema = z.object({
  name: criterionNameSchema.optional(),
  description: criterionDescriptionSchema,
  weight: weightSchema.optional(),
  max_score: maxScoreSchema.optional(),
  order: z.number().int().positive().optional(),
});

/**
 * Attach Rubric Request Schema
 */
export const attachRubricSchema = z.object({
  rubric_id: uuidSchema,
});

/**
 * Submit Grade Request Schema
 */
export const submitGradeSchema = z
  .object({
    assignment_id: uuidSchema,
    student_id: uuidSchema,
    criterion_id: uuidSchema,
    score: scoreSchema,
    max_score: maxScoreSchema,
    comments: commentSchema,
  })
  .refine(
    (data) => data.score <= data.max_score,
    {
      message: 'Score cannot exceed max_score',
      path: ['score'],
    }
  );

/**
 * Bulk Submit Grades Request Schema
 */
export const bulkSubmitGradesSchema = z.object({
  assignment_id: uuidSchema,
  student_id: uuidSchema,
  grades: z.array(
    z.object({
      criterion_id: uuidSchema,
      score: scoreSchema,
      comments: commentSchema,
    })
  ).min(1, 'At least one grade is required'),
});

/**
 * Export Gradebook Request Schema
 */
export const exportGradebookSchema = z.object({
  student_id: uuidSchema.optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
  format: z.enum(['csv', 'pdf']).optional().default('csv'),
  include_comments: z.boolean().optional().default(false),
});

/**
 * List Rubrics Query Schema
 */
export const listRubricsQuerySchema = z.object({
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive())
    .optional()
    .default('1'),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(
      z.number().int().min(1).max(GRADEBOOK_CONSTANTS.MAX_PAGINATION_LIMIT)
    )
    .optional()
    .default(String(GRADEBOOK_CONSTANTS.DEFAULT_PAGINATION_LIMIT)),
  sort_by: z
    .enum(['created_at', 'name', 'criteria_count'])
    .optional()
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
  search: z.string().optional(),
});

// ============================================================================
// BUSINESS RULE VALIDATORS
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates criterion weights sum to 100
 */
export function validateWeightsSum100(
  criteria: Array<{ weight: number }>
): ValidationResult {
  const totalWeight = criteria.reduce((sum, c) => sum + c.weight, 0);

  if (Math.abs(totalWeight - GRADEBOOK_CONSTANTS.REQUIRED_WEIGHT_TOTAL) > 0.01) {
    return {
      valid: false,
      error: `Criterion weights must sum to ${GRADEBOOK_CONSTANTS.REQUIRED_WEIGHT_TOTAL}. Current total: ${totalWeight}`,
    };
  }

  return { valid: true };
}

/**
 * Validates score is within valid range
 */
export function validateScoreInRange(
  score: number,
  max_score: number
): ValidationResult {
  if (score < GRADEBOOK_CONSTANTS.MIN_SCORE) {
    return {
      valid: false,
      error: `Score cannot be negative. Got: ${score}`,
    };
  }

  if (score > max_score) {
    return {
      valid: false,
      error: `Score (${score}) cannot exceed max_score (${max_score})`,
    };
  }

  return { valid: true };
}

/**
 * Validates rubric is not in use before deletion
 */
export function validateRubricNotInUse(
  rubric: RubricWithDetails
): ValidationResult {
  if (rubric.assignment_count && rubric.assignment_count > 0) {
    return {
      valid: false,
      error: `Cannot delete rubric "${rubric.name}". It is currently used by ${rubric.assignment_count} assignment(s)`,
    };
  }

  return { valid: true };
}

/**
 * Validates rubric has criteria before use
 */
export function validateRubricHasCriteria(
  rubric: RubricWithDetails
): ValidationResult {
  if (!rubric.criteria || rubric.criteria.length === 0) {
    return {
      valid: false,
      error: `Rubric "${rubric.name}" has no criteria. Add at least one criterion before using`,
    };
  }

  return { valid: true };
}

/**
 * Validates rubric criteria weights are complete
 */
export function validateRubricComplete(
  rubric: RubricWithDetails
): ValidationResult {
  if (!rubric.criteria || rubric.criteria.length === 0) {
    return {
      valid: false,
      error: 'Rubric has no criteria',
    };
  }

  const weightsValidation = validateWeightsSum100(rubric.criteria);
  if (!weightsValidation.valid) {
    return weightsValidation;
  }

  return { valid: true };
}

/**
 * Validates grade does not already exist for criterion
 */
export function validateGradeNotExists(
  existingGrades: Array<{ criterion_id: string }>,
  criterion_id: string
): ValidationResult {
  const exists = existingGrades.some((g) => g.criterion_id === criterion_id);

  if (exists) {
    return {
      valid: false,
      error: 'Grade already exists for this criterion. Use update endpoint to modify',
    };
  }

  return { valid: true };
}

/**
 * Validates bulk grades match rubric criteria
 */
export function validateBulkGradesMatchRubric(
  rubric: RubricWithDetails,
  grades: Array<{ criterion_id: string; score: number }>,
  criterionMaxScores: Map<string, number>
): ValidationResult {
  if (!rubric.criteria) {
    return {
      valid: false,
      error: 'Rubric has no criteria',
    };
  }

  // Check all grade criterion_ids exist in rubric
  const rubricCriterionIds = new Set(rubric.criteria.map((c) => c.id));

  for (const grade of grades) {
    if (!rubricCriterionIds.has(grade.criterion_id)) {
      return {
        valid: false,
        error: `Criterion ${grade.criterion_id} does not exist in this rubric`,
      };
    }

    // Validate score against max_score
    const max_score = criterionMaxScores.get(grade.criterion_id);
    if (max_score !== undefined) {
      const scoreValidation = validateScoreInRange(grade.score, max_score);
      if (!scoreValidation.valid) {
        return scoreValidation;
      }
    }
  }

  return { valid: true };
}

/**
 * Validates export date range
 */
export function validateExportDateRange(
  start_date?: string,
  end_date?: string
): ValidationResult {
  if (!start_date || !end_date) {
    return { valid: true };
  }

  const start = new Date(start_date);
  const end = new Date(end_date);

  if (start >= end) {
    return {
      valid: false,
      error: 'start_date must be before end_date',
    };
  }

  return { valid: true };
}

// ============================================================================
// PERMISSION VALIDATORS
// ============================================================================

export type UserRole = 'owner' | 'admin' | 'teacher' | 'student' | 'parent';

export interface PermissionContext {
  userId: string;
  userRole: UserRole;
  schoolId: string;
  teacherId?: string;
  studentId?: string;
}

export interface RubricPermissionContext {
  rubricSchoolId: string;
  rubricCreatedBy: string; // teacher user_id
}

export interface GradePermissionContext {
  assignmentSchoolId: string;
  studentId: string;
  teacherId?: string;
}

/**
 * Checks if user can create rubrics
 */
export function canCreateRubric(ctx: PermissionContext): boolean {
  // Only teachers, admins, and owners can create rubrics
  return ['teacher', 'admin', 'owner'].includes(ctx.userRole);
}

/**
 * Checks if user can view rubric
 */
export function canViewRubric(
  ctx: PermissionContext,
  rubric: RubricPermissionContext
): boolean {
  // Must be same school
  if (ctx.schoolId !== rubric.rubricSchoolId) {
    return false;
  }

  // Owner/Admin can view all rubrics
  if (['owner', 'admin'].includes(ctx.userRole)) {
    return true;
  }

  // Any teacher in same school can view rubrics
  if (ctx.userRole === 'teacher') {
    return true;
  }

  return false;
}

/**
 * Checks if user can update rubric
 */
export function canUpdateRubric(
  ctx: PermissionContext,
  rubric: RubricPermissionContext
): boolean {
  // Must be same school
  if (ctx.schoolId !== rubric.rubricSchoolId) {
    return false;
  }

  // Owner/Admin can update any rubric
  if (['owner', 'admin'].includes(ctx.userRole)) {
    return true;
  }

  // Creator can update their own rubric
  if (ctx.userRole === 'teacher' && ctx.userId === rubric.rubricCreatedBy) {
    return true;
  }

  return false;
}

/**
 * Checks if user can delete rubric
 */
export function canDeleteRubric(
  ctx: PermissionContext,
  rubric: RubricPermissionContext
): boolean {
  // Same permissions as update
  return canUpdateRubric(ctx, rubric);
}

/**
 * Checks if user can attach rubric to assignment
 */
export function canAttachRubric(ctx: PermissionContext): boolean {
  // Only teachers, admins, and owners can attach rubrics
  return ['teacher', 'admin', 'owner'].includes(ctx.userRole);
}

/**
 * Checks if user can submit grades
 */
export function canSubmitGrade(ctx: PermissionContext): boolean {
  // Only teachers, admins, and owners can submit grades
  return ['teacher', 'admin', 'owner'].includes(ctx.userRole);
}

/**
 * Checks if user can view grades for an assignment/student
 */
export function canViewGrades(
  ctx: PermissionContext,
  gradeContext: GradePermissionContext
): boolean {
  // Must be same school
  if (ctx.schoolId !== gradeContext.assignmentSchoolId) {
    return false;
  }

  // Owner/Admin can view all grades
  if (['owner', 'admin'].includes(ctx.userRole)) {
    return true;
  }

  // Any teacher can view grades
  if (ctx.userRole === 'teacher') {
    return true;
  }

  // Student can view their own grades
  if (ctx.userRole === 'student' && ctx.studentId === gradeContext.studentId) {
    return true;
  }

  // Parent can view children's grades (would need parent_students check)
  if (ctx.userRole === 'parent') {
    // TODO: Check parent_students relationship in actual endpoint
    return true;
  }

  return false;
}

/**
 * Checks if user can export gradebook
 */
export function canExportGradebook(ctx: PermissionContext): boolean {
  // Only teachers, admins, and owners can export gradebook
  return ['teacher', 'admin', 'owner'].includes(ctx.userRole);
}

// ============================================================================
// COMPREHENSIVE VALIDATION FUNCTIONS
// ============================================================================

export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
}

/**
 * Validates and parses create rubric request
 */
export function validateCreateRubricRequest(
  body: unknown
): ValidationResult<CreateRubricRequest> {
  const result = createRubricSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  // Additional weight validation if criteria provided
  if (result.data.criteria && result.data.criteria.length > 0) {
    const weightsValidation = validateWeightsSum100(result.data.criteria);
    if (!weightsValidation.valid) {
      return {
        success: false,
        error: weightsValidation.error,
      };
    }
  }

  return {
    success: true,
    data: result.data as CreateRubricRequest,
  };
}

/**
 * Validates and parses update rubric request
 */
export function validateUpdateRubricRequest(
  body: unknown
): ValidationResult<UpdateRubricRequest> {
  const result = updateRubricSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  return {
    success: true,
    data: result.data as UpdateRubricRequest,
  };
}

/**
 * Validates and parses create criterion request
 */
export function validateCreateCriterionRequest(
  body: unknown
): ValidationResult<CreateCriterionRequest> {
  const result = createCriterionSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  return {
    success: true,
    data: result.data as CreateCriterionRequest,
  };
}

/**
 * Validates and parses update criterion request
 */
export function validateUpdateCriterionRequest(
  body: unknown
): ValidationResult<UpdateCriterionRequest> {
  const result = updateCriterionSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  return {
    success: true,
    data: result.data as UpdateCriterionRequest,
  };
}

/**
 * Validates and parses attach rubric request
 */
export function validateAttachRubricRequest(
  body: unknown
): ValidationResult<AttachRubricRequest> {
  const result = attachRubricSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  return {
    success: true,
    data: result.data as AttachRubricRequest,
  };
}

/**
 * Validates and parses submit grade request
 */
export function validateSubmitGradeRequest(
  body: unknown
): ValidationResult<SubmitGradeRequest> {
  const result = submitGradeSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  // Additional score range validation
  const scoreValidation = validateScoreInRange(
    result.data.score,
    result.data.max_score
  );

  if (!scoreValidation.valid) {
    return {
      success: false,
      error: scoreValidation.error,
    };
  }

  return {
    success: true,
    data: result.data as SubmitGradeRequest,
  };
}

/**
 * Validates and parses bulk submit grades request
 */
export function validateBulkSubmitGradesRequest(
  body: unknown
): ValidationResult<BulkSubmitGradesRequest> {
  const result = bulkSubmitGradesSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  return {
    success: true,
    data: result.data as BulkSubmitGradesRequest,
  };
}

/**
 * Validates and parses export gradebook request
 */
export function validateExportGradebookRequest(
  body: unknown
): ValidationResult<ExportGradebookRequest> {
  const result = exportGradebookSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  // Additional date range validation
  const dateValidation = validateExportDateRange(
    result.data.start_date,
    result.data.end_date
  );

  if (!dateValidation.valid) {
    return {
      success: false,
      error: dateValidation.error,
    };
  }

  return {
    success: true,
    data: result.data as ExportGradebookRequest,
  };
}
