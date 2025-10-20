/**
 * Homework Validation Utilities
 * Created: 2025-10-20
 * Purpose: Server-side validation for homework system (highlights with green/gold colors)
 * Dependencies: Zod for schema validation
 */

import { z } from 'zod';
import {
  HOMEWORK_CONSTANTS,
  CreateHomeworkRequest,
  CompleteHomeworkRequest,
  AddHomeworkReplyRequest,
  HomeworkStatus,
  Homework,
  isValidSurah,
  isValidAyahRange,
} from '../types/homework';

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * UUID validation schema
 */
const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Surah number validation (1-114)
 */
const surahSchema = z
  .number()
  .int('Surah must be an integer')
  .min(1, 'Surah must be between 1 and 114')
  .max(114, 'Surah must be between 1 and 114');

/**
 * Ayah number validation (positive integer)
 */
const ayahSchema = z
  .number()
  .int('Ayah must be an integer')
  .positive('Ayah must be a positive number');

/**
 * Homework type validation
 */
const homeworkTypeSchema = z.enum([
  'memorization',
  'revision',
  'tajweed',
  'recitation',
  'fluency',
]);

/**
 * Create Homework Request Schema
 */
export const createHomeworkSchema = z.object({
  student_id: uuidSchema,
  surah: surahSchema,
  ayah_start: ayahSchema,
  ayah_end: ayahSchema,
  page_number: z.number().int().positive().optional(),
  note: z
    .string()
    .max(
      HOMEWORK_CONSTANTS.MAX_NOTE_LENGTH,
      `Note must be ${HOMEWORK_CONSTANTS.MAX_NOTE_LENGTH} characters or less`
    )
    .optional(),
  type: homeworkTypeSchema.optional(),
}).refine(
  (data) => data.ayah_end >= data.ayah_start,
  {
    message: 'ayah_end must be greater than or equal to ayah_start',
    path: ['ayah_end'],
  }
).refine(
  (data) => {
    const range = data.ayah_end - data.ayah_start + 1;
    return range <= HOMEWORK_CONSTANTS.MAX_AYAH_RANGE;
  },
  {
    message: `Homework can cover maximum ${HOMEWORK_CONSTANTS.MAX_AYAH_RANGE} ayahs at once`,
    path: ['ayah_end'],
  }
);

/**
 * Complete Homework Request Schema
 */
export const completeHomeworkSchema = z.object({
  completed_by: uuidSchema.optional(),
  completion_note: z
    .string()
    .max(1000, 'Completion note must be 1000 characters or less')
    .optional(),
});

/**
 * Add Homework Reply Schema
 */
export const addHomeworkReplySchema = z.object({
  type: z.enum(['text', 'audio']),
  text: z
    .string()
    .max(2000, 'Text note must be 2000 characters or less')
    .optional(),
  audio_url: z.string().url('Invalid audio URL').optional(),
}).refine(
  (data) => {
    if (data.type === 'text') return !!data.text;
    if (data.type === 'audio') return !!data.audio_url;
    return false;
  },
  {
    message: 'text is required for text type, audio_url is required for audio type',
  }
);

/**
 * List Homework Query Schema
 */
export const listHomeworkQuerySchema = z.object({
  student_id: uuidSchema.optional(),
  teacher_id: uuidSchema.optional(),
  status: z.enum(['pending', 'completed']).optional(),
  surah: surahSchema.optional(),
  page_number: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive())
    .optional(),
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
      z.number().int().min(1).max(HOMEWORK_CONSTANTS.MAX_PAGINATION_LIMIT)
    )
    .optional()
    .default(String(HOMEWORK_CONSTANTS.DEFAULT_PAGINATION_LIMIT)),
  sort_by: z.enum(['created_at', 'surah', 'ayah_start']).optional().default('created_at'),
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
 * Validates homework can be completed
 */
export function validateCompletion(homework: Homework): ValidationResult {
  if (homework.color === 'gold') {
    return {
      valid: false,
      error: 'Homework is already completed',
    };
  }

  if (homework.color !== 'green') {
    return {
      valid: false,
      error: 'Only green highlights (homework) can be completed',
    };
  }

  if (homework.completed_at) {
    return {
      valid: false,
      error: 'Homework has already been marked as completed',
    };
  }

  return { valid: true };
}

/**
 * Validates surah and ayah range
 */
export function validateAyahRange(
  surah: number,
  ayah_start: number,
  ayah_end: number
): ValidationResult {
  if (!isValidSurah(surah)) {
    return {
      valid: false,
      error: `Invalid surah number: ${surah}. Must be between 1 and 114`,
    };
  }

  if (!isValidAyahRange(surah, ayah_start, ayah_end)) {
    return {
      valid: false,
      error: `Invalid ayah range: ${ayah_start}-${ayah_end} for surah ${surah}`,
    };
  }

  const range = ayah_end - ayah_start + 1;
  if (range > HOMEWORK_CONSTANTS.MAX_AYAH_RANGE) {
    return {
      valid: false,
      error: `Homework range too large: ${range} ayahs. Maximum is ${HOMEWORK_CONSTANTS.MAX_AYAH_RANGE}`,
    };
  }

  return { valid: true };
}

/**
 * Validates homework note content
 */
export function validateNote(note: string): ValidationResult {
  if (note.length > HOMEWORK_CONSTANTS.MAX_NOTE_LENGTH) {
    return {
      valid: false,
      error: `Note too long: ${note.length} characters. Maximum is ${HOMEWORK_CONSTANTS.MAX_NOTE_LENGTH}`,
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

export interface HomeworkPermissionContext {
  homeworkSchoolId: string;
  homeworkTeacherId: string | null;
  homeworkStudentId: string;
}

/**
 * Checks if user can create homework
 */
export function canCreateHomework(ctx: PermissionContext): boolean {
  // Only teachers, admins, and owners can create homework
  return ['teacher', 'admin', 'owner'].includes(ctx.userRole);
}

/**
 * Checks if user can view homework
 */
export function canViewHomework(
  ctx: PermissionContext,
  homework: HomeworkPermissionContext
): boolean {
  // Must be same school
  if (ctx.schoolId !== homework.homeworkSchoolId) {
    return false;
  }

  // Owner/Admin can view all
  if (['owner', 'admin'].includes(ctx.userRole)) {
    return true;
  }

  // Teacher can view their own created homework
  if (
    ctx.userRole === 'teacher' &&
    ctx.teacherId &&
    homework.homeworkTeacherId === ctx.teacherId
  ) {
    return true;
  }

  // Student can view their own homework
  if (
    ctx.userRole === 'student' &&
    ctx.studentId === homework.homeworkStudentId
  ) {
    return true;
  }

  // Parent can view children's homework (would need parent_students check)
  if (ctx.userRole === 'parent') {
    // TODO: Check parent_students relationship in actual endpoint
    return true;
  }

  return false;
}

/**
 * Checks if user can complete homework
 */
export function canCompleteHomework(
  ctx: PermissionContext,
  homework: HomeworkPermissionContext
): boolean {
  // Must be same school
  if (ctx.schoolId !== homework.homeworkSchoolId) {
    return false;
  }

  // Owner/Admin can complete any homework
  if (['owner', 'admin'].includes(ctx.userRole)) {
    return true;
  }

  // Teacher who created it can mark it complete
  if (
    ctx.userRole === 'teacher' &&
    ctx.teacherId &&
    homework.homeworkTeacherId === ctx.teacherId
  ) {
    return true;
  }

  // Any teacher in the same school can mark homework complete
  if (ctx.userRole === 'teacher') {
    return true;
  }

  return false;
}

/**
 * Checks if user can add reply/note to homework
 */
export function canReplyToHomework(
  ctx: PermissionContext,
  homework: HomeworkPermissionContext
): boolean {
  // Must be same school
  if (ctx.schoolId !== homework.homeworkSchoolId) {
    return false;
  }

  // Owner/Admin can reply to any homework
  if (['owner', 'admin'].includes(ctx.userRole)) {
    return true;
  }

  // Teacher who created it can reply
  if (
    ctx.userRole === 'teacher' &&
    ctx.teacherId &&
    homework.homeworkTeacherId === ctx.teacherId
  ) {
    return true;
  }

  // Any teacher can add replies/notes
  if (ctx.userRole === 'teacher') {
    return true;
  }

  return false;
}

/**
 * Checks if user can delete homework
 */
export function canDeleteHomework(
  ctx: PermissionContext,
  homework: HomeworkPermissionContext
): boolean {
  // Must be same school
  if (ctx.schoolId !== homework.homeworkSchoolId) {
    return false;
  }

  // Owner/Admin can delete any homework
  if (['owner', 'admin'].includes(ctx.userRole)) {
    return true;
  }

  // Teacher who created it can delete
  if (
    ctx.userRole === 'teacher' &&
    ctx.teacherId &&
    homework.homeworkTeacherId === ctx.teacherId
  ) {
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
 * Validates and parses create homework request
 */
export function validateCreateHomeworkRequest(
  body: unknown
): ValidationResult<CreateHomeworkRequest> {
  const result = createHomeworkSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  // Additional ayah range validation
  const rangeValidation = validateAyahRange(
    result.data.surah,
    result.data.ayah_start,
    result.data.ayah_end
  );

  if (!rangeValidation.valid) {
    return {
      success: false,
      error: rangeValidation.error,
    };
  }

  return {
    success: true,
    data: result.data as CreateHomeworkRequest,
  };
}

/**
 * Validates and parses complete homework request
 */
export function validateCompleteHomeworkRequest(
  body: unknown
): ValidationResult<CompleteHomeworkRequest> {
  const result = completeHomeworkSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  return {
    success: true,
    data: result.data as CompleteHomeworkRequest,
  };
}

/**
 * Validates and parses add homework reply request
 */
export function validateAddHomeworkReplyRequest(
  body: unknown
): ValidationResult<AddHomeworkReplyRequest> {
  const result = addHomeworkReplySchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  return {
    success: true,
    data: result.data as AddHomeworkReplyRequest,
  };
}
