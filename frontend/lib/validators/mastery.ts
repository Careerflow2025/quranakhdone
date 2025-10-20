/**
 * Mastery Tracking Validation Utilities
 *
 * Created: 2025-10-20
 * Purpose: Validation schemas and business rules for mastery tracking
 * Features: Zod schemas, permission validators, business rule validators
 */

import { z } from 'zod';
import {
  MasteryLevel,
  UpsertMasteryRequest,
  BulkUpsertMasteryRequest,
  AutoUpdateMasteryRequest,
  GetStudentMasteryRequest,
  GetHeatmapRequest,
  GetClassMasteryRequest,
  MASTERY_CONSTANTS,
  isValidMasteryLevel,
} from '@/lib/types/mastery';

// ============================================================================
// Zod Schemas
// ============================================================================

// Mastery level schema
export const masteryLevelSchema = z.enum([
  'unknown',
  'learning',
  'proficient',
  'mastered',
]);

// Upsert mastery request schema
export const upsertMasteryRequestSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  script_id: z.string().uuid('Invalid script ID'),
  ayah_id: z.string().uuid('Invalid ayah ID'),
  level: masteryLevelSchema,
});

// Bulk upsert mastery request schema
export const bulkUpsertMasteryRequestSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  script_id: z.string().uuid('Invalid script ID'),
  updates: z
    .array(
      z.object({
        ayah_id: z.string().uuid('Invalid ayah ID'),
        level: masteryLevelSchema,
      })
    )
    .min(1, 'At least one update is required')
    .max(50, 'Maximum 50 updates per request'),
});

// Auto-update mastery request schema
export const autoUpdateMasteryRequestSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  assignment_id: z.string().uuid('Invalid assignment ID'),
  new_level: masteryLevelSchema.optional(),
});

// Get student mastery request schema
export const getStudentMasteryRequestSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  script_id: z.string().uuid('Invalid script ID').optional(),
  surah: z
    .number()
    .int()
    .min(1, 'Surah must be between 1 and 114')
    .max(114, 'Surah must be between 1 and 114')
    .optional(),
});

// Get heatmap request schema
export const getHeatmapRequestSchema = z.object({
  student_id: z.string().uuid('Invalid student ID'),
  surah: z
    .number()
    .int()
    .min(1, 'Surah must be between 1 and 114')
    .max(114, 'Surah must be between 1 and 114'),
  script_id: z.string().uuid('Invalid script ID').optional(),
});

// Get class mastery request schema
export const getClassMasteryRequestSchema = z.object({
  class_id: z.string().uuid('Invalid class ID'),
  script_id: z.string().uuid('Invalid script ID').optional(),
  surah: z
    .number()
    .int()
    .min(1, 'Surah must be between 1 and 114')
    .max(114, 'Surah must be between 1 and 114')
    .optional(),
});

// ============================================================================
// Validation Result Types
// ============================================================================

export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: Array<{ field: string; message: string }>;
}

// ============================================================================
// Request Validators
// ============================================================================

export function validateUpsertMasteryRequest(
  data: unknown
): ValidationResult<UpsertMasteryRequest> {
  try {
    const validated = upsertMasteryRequestSchema.parse(data);
    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }
    return {
      success: false,
      error: 'Validation failed',
    };
  }
}

export function validateBulkUpsertMasteryRequest(
  data: unknown
): ValidationResult<BulkUpsertMasteryRequest> {
  try {
    const validated = bulkUpsertMasteryRequestSchema.parse(data);
    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }
    return {
      success: false,
      error: 'Validation failed',
    };
  }
}

export function validateAutoUpdateMasteryRequest(
  data: unknown
): ValidationResult<AutoUpdateMasteryRequest> {
  try {
    const validated = autoUpdateMasteryRequestSchema.parse(data);
    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }
    return {
      success: false,
      error: 'Validation failed',
    };
  }
}

export function validateGetStudentMasteryRequest(
  data: unknown
): ValidationResult<GetStudentMasteryRequest> {
  try {
    const validated = getStudentMasteryRequestSchema.parse(data);
    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }
    return {
      success: false,
      error: 'Validation failed',
    };
  }
}

export function validateGetHeatmapRequest(
  data: unknown
): ValidationResult<GetHeatmapRequest> {
  try {
    const validated = getHeatmapRequestSchema.parse(data);
    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }
    return {
      success: false,
      error: 'Validation failed',
    };
  }
}

export function validateGetClassMasteryRequest(
  data: unknown
): ValidationResult<GetClassMasteryRequest> {
  try {
    const validated = getClassMasteryRequestSchema.parse(data);
    return {
      success: true,
      data: validated,
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        error: error.errors[0].message,
        errors: error.errors.map((e) => ({
          field: e.path.join('.'),
          message: e.message,
        })),
      };
    }
    return {
      success: false,
      error: 'Validation failed',
    };
  }
}

// ============================================================================
// Business Rule Validators
// ============================================================================

export interface BusinessValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate mastery level is valid enum value
 */
export function validateMasteryLevel(level: string): BusinessValidationResult {
  if (!isValidMasteryLevel(level)) {
    return {
      valid: false,
      error: `Invalid mastery level: "${level}". Must be one of: unknown, learning, proficient, mastered`,
    };
  }
  return { valid: true };
}

/**
 * Validate surah number is in valid range
 */
export function validateSurahNumber(surah: number): BusinessValidationResult {
  if (!Number.isInteger(surah) || surah < 1 || surah > 114) {
    return {
      valid: false,
      error: `Invalid surah number: ${surah}. Must be between 1 and 114`,
    };
  }
  return { valid: true };
}

/**
 * Validate ayah number is in valid range for surah
 */
export function validateAyahNumber(
  surah: number,
  ayah: number,
  maxAyahs: number
): BusinessValidationResult {
  if (!Number.isInteger(ayah) || ayah < 1 || ayah > maxAyahs) {
    return {
      valid: false,
      error: `Invalid ayah number: ${ayah}. Surah ${surah} has ${maxAyahs} ayahs`,
    };
  }
  return { valid: true };
}

/**
 * Validate score is in valid range for mastery level calculation
 */
export function validateScoreForMastery(score: number): BusinessValidationResult {
  if (typeof score !== 'number' || score < 0 || score > 100) {
    return {
      valid: false,
      error: `Invalid score: ${score}. Must be between 0 and 100`,
    };
  }
  return { valid: true };
}

/**
 * Validate bulk update count is within limits
 */
export function validateBulkUpdateCount(
  count: number
): BusinessValidationResult {
  if (count < 1) {
    return {
      valid: false,
      error: 'At least one update is required',
    };
  }
  if (count > 50) {
    return {
      valid: false,
      error: 'Maximum 50 updates per request. Please split into multiple requests',
    };
  }
  return { valid: true };
}

// ============================================================================
// Permission Validators
// ============================================================================

export interface PermissionContext {
  userId: string;
  userRole: 'school' | 'teacher' | 'student' | 'parent';
  schoolId: string;
  studentId?: string; // For students, this is their own ID
  teacherClassIds?: string[]; // For teachers, their class IDs
}

export interface MasteryPermissionContext {
  targetStudentId: string;
  targetStudentSchoolId: string;
  targetClassId?: string;
}

/**
 * Check if user can update mastery (teachers only)
 */
export function canUpdateMastery(ctx: PermissionContext): boolean {
  return ['teacher', 'school'].includes(ctx.userRole);
}

/**
 * Check if user can view student mastery data
 */
export function canViewStudentMastery(
  ctx: PermissionContext,
  masteryCtx: MasteryPermissionContext
): boolean {
  // Must be same school
  if (ctx.schoolId !== masteryCtx.targetStudentSchoolId) {
    return false;
  }

  // School/admin can view all students
  if (ctx.userRole === 'school') {
    return true;
  }

  // Teachers can view students in their classes
  if (ctx.userRole === 'teacher' && masteryCtx.targetClassId) {
    return ctx.teacherClassIds?.includes(masteryCtx.targetClassId) || false;
  }

  // Students can view their own mastery
  if (ctx.userRole === 'student' && ctx.studentId === masteryCtx.targetStudentId) {
    return true;
  }

  // Parents can view their children's mastery
  // TODO: Check parent_students relationship
  if (ctx.userRole === 'parent') {
    return true; // Simplified for now
  }

  return false;
}

/**
 * Check if user can view class mastery overview
 */
export function canViewClassMastery(
  ctx: PermissionContext,
  classId: string
): boolean {
  // School/admin can view all classes
  if (ctx.userRole === 'school') {
    return true;
  }

  // Teachers can view their own classes
  if (ctx.userRole === 'teacher') {
    return ctx.teacherClassIds?.includes(classId) || false;
  }

  return false;
}

/**
 * Check if user can trigger auto-update mastery
 */
export function canAutoUpdateMastery(
  ctx: PermissionContext,
  targetStudentSchoolId: string
): boolean {
  // Must be same school
  if (ctx.schoolId !== targetStudentSchoolId) {
    return false;
  }

  // Only teachers and school can auto-update
  return ['teacher', 'school'].includes(ctx.userRole);
}

// ============================================================================
// Comprehensive Validators
// ============================================================================

/**
 * Validate complete upsert mastery operation
 */
export function validateUpsertMasteryOperation(
  data: unknown,
  ctx: PermissionContext,
  masteryCtx: MasteryPermissionContext
): ValidationResult<UpsertMasteryRequest> {
  // Check permissions
  if (!canUpdateMastery(ctx)) {
    return {
      success: false,
      error: 'Only teachers can update mastery levels',
    };
  }

  if (ctx.schoolId !== masteryCtx.targetStudentSchoolId) {
    return {
      success: false,
      error: 'Cannot update mastery for students in other schools',
    };
  }

  // Validate request data
  const validation = validateUpsertMasteryRequest(data);
  if (!validation.success) {
    return validation;
  }

  // Additional business rule validation
  const levelValidation = validateMasteryLevel(validation.data!.level);
  if (!levelValidation.valid) {
    return {
      success: false,
      error: levelValidation.error,
    };
  }

  return validation;
}

/**
 * Validate complete get student mastery operation
 */
export function validateGetStudentMasteryOperation(
  data: unknown,
  ctx: PermissionContext,
  masteryCtx: MasteryPermissionContext
): ValidationResult<GetStudentMasteryRequest> {
  // Check permissions
  if (!canViewStudentMastery(ctx, masteryCtx)) {
    return {
      success: false,
      error: 'Insufficient permissions to view this student\'s mastery data',
    };
  }

  // Validate request data
  const validation = validateGetStudentMasteryRequest(data);
  if (!validation.success) {
    return validation;
  }

  // Validate surah if provided
  if (validation.data!.surah) {
    const surahValidation = validateSurahNumber(validation.data!.surah);
    if (!surahValidation.valid) {
      return {
        success: false,
        error: surahValidation.error,
      };
    }
  }

  return validation;
}

/**
 * Validate complete get heatmap operation
 */
export function validateGetHeatmapOperation(
  data: unknown,
  ctx: PermissionContext,
  masteryCtx: MasteryPermissionContext
): ValidationResult<GetHeatmapRequest> {
  // Check permissions
  if (!canViewStudentMastery(ctx, masteryCtx)) {
    return {
      success: false,
      error: 'Insufficient permissions to view this student\'s mastery heatmap',
    };
  }

  // Validate request data
  const validation = validateGetHeatmapRequest(data);
  if (!validation.success) {
    return validation;
  }

  // Validate surah number
  const surahValidation = validateSurahNumber(validation.data!.surah);
  if (!surahValidation.valid) {
    return {
      success: false,
      error: surahValidation.error,
    };
  }

  return validation;
}

/**
 * Validate complete get class mastery operation
 */
export function validateGetClassMasteryOperation(
  data: unknown,
  ctx: PermissionContext,
  classId: string
): ValidationResult<GetClassMasteryRequest> {
  // Check permissions
  if (!canViewClassMastery(ctx, classId)) {
    return {
      success: false,
      error: 'Insufficient permissions to view this class\'s mastery data',
    };
  }

  // Validate request data
  const validation = validateGetClassMasteryRequest(data);
  if (!validation.success) {
    return validation;
  }

  // Validate surah if provided
  if (validation.data!.surah) {
    const surahValidation = validateSurahNumber(validation.data!.surah);
    if (!surahValidation.valid) {
      return {
        success: false,
        error: surahValidation.error,
      };
    }
  }

  return validation;
}
