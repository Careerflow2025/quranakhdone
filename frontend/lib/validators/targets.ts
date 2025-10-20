/**
 * Targets Validation Utilities
 * Created: 2025-10-20
 * Purpose: Server-side validation for targets system
 * Dependencies: Zod for schema validation
 */

import { z } from 'zod';
import {
  TARGET_CONSTANTS,
  CreateTargetRequest,
  UpdateTargetProgressRequest,
  AddMilestoneRequest,
  CompleteMilestoneRequest,
  TargetType,
  TargetStatus,
  Target,
} from '../types/targets';

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * UUID validation schema
 */
const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Target type validation
 */
const targetTypeSchema = z.enum(['individual', 'class', 'school']);

/**
 * Target status validation
 */
const targetStatusSchema = z.enum(['active', 'completed', 'cancelled']);

/**
 * Target category validation
 */
const targetCategorySchema = z.enum([
  'memorization',
  'revision',
  'tajweed',
  'recitation',
  'fluency',
  'quran_completion',
  'surah_mastery',
  'page_count',
  'attendance',
  'behavior',
  'other',
]);

/**
 * Create Milestone Request Schema
 */
export const createMilestoneSchema = z.object({
  title: z
    .string()
    .min(1, 'Milestone title is required')
    .max(TARGET_CONSTANTS.MAX_TITLE_LENGTH, `Title must be ${TARGET_CONSTANTS.MAX_TITLE_LENGTH} characters or less`),
  description: z
    .string()
    .max(TARGET_CONSTANTS.MAX_DESCRIPTION_LENGTH, `Description must be ${TARGET_CONSTANTS.MAX_DESCRIPTION_LENGTH} characters or less`)
    .optional(),
  target_value: z.number().int().positive().optional(),
  order: z.number().int().positive().optional(),
});

/**
 * Create Target Request Schema
 */
export const createTargetSchema = z
  .object({
    title: z
      .string()
      .min(1, 'Title is required')
      .max(TARGET_CONSTANTS.MAX_TITLE_LENGTH, `Title must be ${TARGET_CONSTANTS.MAX_TITLE_LENGTH} characters or less`),
    description: z
      .string()
      .max(
        TARGET_CONSTANTS.MAX_DESCRIPTION_LENGTH,
        `Description must be ${TARGET_CONSTANTS.MAX_DESCRIPTION_LENGTH} characters or less`
      )
      .optional(),
    type: targetTypeSchema,
    category: targetCategorySchema.optional(),
    student_id: uuidSchema.optional(),
    class_id: uuidSchema.optional(),
    start_date: z.string().datetime().optional(),
    due_date: z.string().datetime().optional(),
    milestones: z.array(createMilestoneSchema).max(TARGET_CONSTANTS.MAX_MILESTONES).optional(),
  })
  .refine(
    (data) => {
      // Individual targets require student_id
      if (data.type === 'individual') {
        return !!data.student_id;
      }
      return true;
    },
    {
      message: 'student_id is required for individual targets',
      path: ['student_id'],
    }
  )
  .refine(
    (data) => {
      // Class targets require class_id
      if (data.type === 'class') {
        return !!data.class_id;
      }
      return true;
    },
    {
      message: 'class_id is required for class targets',
      path: ['class_id'],
    }
  )
  .refine(
    (data) => {
      // School targets should not have student_id or class_id
      if (data.type === 'school') {
        return !data.student_id && !data.class_id;
      }
      return true;
    },
    {
      message: 'School targets should not have student_id or class_id',
      path: ['type'],
    }
  )
  .refine(
    (data) => {
      // If both dates provided, start_date should be before due_date
      if (data.start_date && data.due_date) {
        return new Date(data.start_date) < new Date(data.due_date);
      }
      return true;
    },
    {
      message: 'start_date must be before due_date',
      path: ['due_date'],
    }
  );

/**
 * Update Target Progress Request Schema
 */
export const updateTargetProgressSchema = z.object({
  progress_percentage: z.number().int().min(0).max(100).optional(),
  status: targetStatusSchema.optional(),
  completed_by: uuidSchema.optional(),
});

/**
 * Add Milestone Request Schema
 */
export const addMilestoneSchema = createMilestoneSchema;

/**
 * Complete Milestone Request Schema
 */
export const completeMilestoneSchema = z.object({
  completed_by: uuidSchema.optional(),
  current_value: z.number().int().positive().optional(),
});

/**
 * List Targets Query Schema
 */
export const listTargetsQuerySchema = z.object({
  student_id: uuidSchema.optional(),
  class_id: uuidSchema.optional(),
  teacher_id: uuidSchema.optional(),
  type: targetTypeSchema.optional(),
  status: targetStatusSchema.optional(),
  category: targetCategorySchema.optional(),
  include_completed: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
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
      z.number().int().min(1).max(TARGET_CONSTANTS.MAX_PAGINATION_LIMIT)
    )
    .optional()
    .default(String(TARGET_CONSTANTS.DEFAULT_PAGINATION_LIMIT)),
  sort_by: z
    .enum(['created_at', 'due_date', 'title', 'progress'])
    .optional()
    .default('created_at'),
  sort_order: z.enum(['asc', 'desc']).optional().default('desc'),
});

// ============================================================================
// BUSINESS RULE VALIDATORS
// ============================================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates target can be completed
 */
export function validateCompletion(target: Target): ValidationResult {
  if (target.status === 'completed') {
    return {
      valid: false,
      error: 'Target is already completed',
    };
  }

  if (target.status === 'cancelled') {
    return {
      valid: false,
      error: 'Cannot complete a cancelled target',
    };
  }

  if (target.status !== 'active') {
    return {
      valid: false,
      error: 'Only active targets can be completed',
    };
  }

  return { valid: true };
}

/**
 * Validates target can be cancelled
 */
export function validateCancellation(target: Target): ValidationResult {
  if (target.status === 'completed') {
    return {
      valid: false,
      error: 'Cannot cancel a completed target',
    };
  }

  if (target.status === 'cancelled') {
    return {
      valid: false,
      error: 'Target is already cancelled',
    };
  }

  if (target.status !== 'active') {
    return {
      valid: false,
      error: 'Only active targets can be cancelled',
    };
  }

  return { valid: true };
}

/**
 * Validates target dates
 */
export function validateTargetDates(
  start_date?: string,
  due_date?: string
): ValidationResult {
  if (!start_date && !due_date) {
    return { valid: true };
  }

  if (start_date && due_date) {
    const start = new Date(start_date);
    const due = new Date(due_date);

    if (start >= due) {
      return {
        valid: false,
        error: 'Start date must be before due date',
      };
    }
  }

  return { valid: true };
}

/**
 * Validates milestone can be completed
 */
export function validateMilestoneCompletion(
  milestone: { completed: boolean; id: string; title: string }
): ValidationResult {
  if (milestone.completed) {
    return {
      valid: false,
      error: 'Milestone is already completed',
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

export interface TargetPermissionContext {
  targetSchoolId: string;
  targetTeacherId: string | null;
  targetStudentId?: string;
  targetClassId?: string;
  targetType: TargetType;
}

/**
 * Checks if user can create targets
 */
export function canCreateTarget(ctx: PermissionContext): boolean {
  // Only teachers, admins, and owners can create targets
  return ['teacher', 'admin', 'owner'].includes(ctx.userRole);
}

/**
 * Checks if user can view target
 */
export function canViewTarget(
  ctx: PermissionContext,
  target: TargetPermissionContext
): boolean {
  // Must be same school
  if (ctx.schoolId !== target.targetSchoolId) {
    return false;
  }

  // Owner/Admin can view all
  if (['owner', 'admin'].includes(ctx.userRole)) {
    return true;
  }

  // Teacher can view their own created targets
  if (
    ctx.userRole === 'teacher' &&
    ctx.teacherId &&
    target.targetTeacherId === ctx.teacherId
  ) {
    return true;
  }

  // For individual targets, student can view their own
  if (
    ctx.userRole === 'student' &&
    ctx.studentId &&
    target.targetType === 'individual' &&
    target.targetStudentId === ctx.studentId
  ) {
    return true;
  }

  // For class/school targets, any teacher or student can view
  if (['class', 'school'].includes(target.targetType)) {
    return ['teacher', 'student'].includes(ctx.userRole);
  }

  // Parents can view their children's targets (would need parent_students check)
  if (ctx.userRole === 'parent') {
    // TODO: Check parent_students relationship in actual endpoint
    return true;
  }

  return false;
}

/**
 * Checks if user can update target
 */
export function canUpdateTarget(
  ctx: PermissionContext,
  target: TargetPermissionContext
): boolean {
  // Must be same school
  if (ctx.schoolId !== target.targetSchoolId) {
    return false;
  }

  // Owner/Admin can update any target
  if (['owner', 'admin'].includes(ctx.userRole)) {
    return true;
  }

  // Teacher who created it can update
  if (
    ctx.userRole === 'teacher' &&
    ctx.teacherId &&
    target.targetTeacherId === ctx.teacherId
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if user can delete target
 */
export function canDeleteTarget(
  ctx: PermissionContext,
  target: TargetPermissionContext
): boolean {
  // Must be same school
  if (ctx.schoolId !== target.targetSchoolId) {
    return false;
  }

  // Owner/Admin can delete any target
  if (['owner', 'admin'].includes(ctx.userRole)) {
    return true;
  }

  // Teacher who created it can delete
  if (
    ctx.userRole === 'teacher' &&
    ctx.teacherId &&
    target.targetTeacherId === ctx.teacherId
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if user can add milestones to target
 */
export function canAddMilestone(
  ctx: PermissionContext,
  target: TargetPermissionContext
): boolean {
  // Same permissions as updating target
  return canUpdateTarget(ctx, target);
}

/**
 * Checks if user can complete milestones
 */
export function canCompleteMilestone(
  ctx: PermissionContext,
  target: TargetPermissionContext
): boolean {
  // Must be same school
  if (ctx.schoolId !== target.targetSchoolId) {
    return false;
  }

  // Owner/Admin can complete any milestone
  if (['owner', 'admin'].includes(ctx.userRole)) {
    return true;
  }

  // Any teacher can complete milestones
  if (ctx.userRole === 'teacher') {
    return true;
  }

  return false;
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
 * Validates and parses create target request
 */
export function validateCreateTargetRequest(
  body: unknown
): ValidationResult<CreateTargetRequest> {
  const result = createTargetSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  // Additional date validation
  const dateValidation = validateTargetDates(
    result.data.start_date,
    result.data.due_date
  );

  if (!dateValidation.valid) {
    return {
      success: false,
      error: dateValidation.error,
    };
  }

  return {
    success: true,
    data: result.data as CreateTargetRequest,
  };
}

/**
 * Validates and parses update target progress request
 */
export function validateUpdateTargetProgressRequest(
  body: unknown
): ValidationResult<UpdateTargetProgressRequest> {
  const result = updateTargetProgressSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  return {
    success: true,
    data: result.data as UpdateTargetProgressRequest,
  };
}

/**
 * Validates and parses add milestone request
 */
export function validateAddMilestoneRequest(
  body: unknown
): ValidationResult<AddMilestoneRequest> {
  const result = addMilestoneSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  return {
    success: true,
    data: result.data as AddMilestoneRequest,
  };
}

/**
 * Validates and parses complete milestone request
 */
export function validateCompleteMilestoneRequest(
  body: unknown
): ValidationResult<CompleteMilestoneRequest> {
  const result = completeMilestoneSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  return {
    success: true,
    data: result.data as CompleteMilestoneRequest,
  };
}
