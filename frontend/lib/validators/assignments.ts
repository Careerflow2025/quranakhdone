/**
 * Assignment Validation Utilities
 * Created: 2025-10-20
 * Purpose: Server-side runtime validation schemas and business rule enforcement
 * Dependencies: Zod for schema validation
 */

import { z } from 'zod';
import {
  AssignmentStatus,
  VALID_TRANSITIONS,
  ASSIGNMENT_CONSTANTS,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  TransitionAssignmentRequest,
  SubmitAssignmentRequest,
  ReopenAssignmentRequest,
} from '../types/assignments';

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * UUID validation schema
 */
const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * ISO 8601 timestamp validation
 */
const isoTimestampSchema = z.string().datetime('Invalid ISO 8601 timestamp');

/**
 * Assignment status enum schema
 */
const assignmentStatusSchema = z.enum([
  'assigned',
  'viewed',
  'submitted',
  'reviewed',
  'completed',
  'reopened',
]);

/**
 * Create Assignment Request Schema
 */
export const createAssignmentSchema = z.object({
  student_id: uuidSchema,
  title: z
    .string()
    .min(1, 'Title is required')
    .max(ASSIGNMENT_CONSTANTS.MAX_TITLE_LENGTH, `Title must be ${ASSIGNMENT_CONSTANTS.MAX_TITLE_LENGTH} characters or less`)
    .trim(),
  description: z
    .string()
    .max(ASSIGNMENT_CONSTANTS.MAX_DESCRIPTION_LENGTH, `Description must be ${ASSIGNMENT_CONSTANTS.MAX_DESCRIPTION_LENGTH} characters or less`)
    .trim()
    .optional()
    .nullable(),
  due_at: isoTimestampSchema.refine(
    (date) => new Date(date) > new Date(),
    'Due date must be in the future'
  ),
  highlight_refs: z.array(z.string()).optional(),
  attachments: z.array(z.string().url('Invalid attachment URL')).optional(),
});

/**
 * Update Assignment Request Schema
 */
export const updateAssignmentSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(ASSIGNMENT_CONSTANTS.MAX_TITLE_LENGTH, `Title must be ${ASSIGNMENT_CONSTANTS.MAX_TITLE_LENGTH} characters or less`)
    .trim()
    .optional(),
  description: z
    .string()
    .max(ASSIGNMENT_CONSTANTS.MAX_DESCRIPTION_LENGTH, `Description must be ${ASSIGNMENT_CONSTANTS.MAX_DESCRIPTION_LENGTH} characters or less`)
    .trim()
    .optional()
    .nullable(),
  due_at: isoTimestampSchema.optional(),
});

/**
 * Transition Assignment Request Schema
 */
export const transitionAssignmentSchema = z.object({
  to_status: assignmentStatusSchema,
  reason: z.string().max(500, 'Reason must be 500 characters or less').optional(),
});

/**
 * Submit Assignment Request Schema
 */
export const submitAssignmentSchema = z.object({
  text: z
    .string()
    .max(10000, 'Submission text must be 10000 characters or less')
    .optional()
    .nullable(),
  attachments: z
    .array(z.string().url('Invalid attachment URL'))
    .max(10, 'Maximum 10 attachments allowed')
    .optional(),
});

/**
 * Reopen Assignment Request Schema
 */
export const reopenAssignmentSchema = z.object({
  reason: z
    .string()
    .min(1, 'Reason is required when reopening')
    .max(500, 'Reason must be 500 characters or less'),
});

/**
 * List Assignments Query Schema
 */
export const listAssignmentsQuerySchema = z.object({
  student_id: uuidSchema.optional(),
  teacher_id: uuidSchema.optional(),
  status: z.union([
    assignmentStatusSchema,
    z.array(assignmentStatusSchema)
  ]).optional(),
  late_only: z
    .string()
    .transform((val) => val === 'true')
    .optional(),
  due_before: isoTimestampSchema.optional(),
  due_after: isoTimestampSchema.optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive())
    .optional()
    .default('1'),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(ASSIGNMENT_CONSTANTS.PAGINATION_MAX_LIMIT))
    .optional()
    .default(String(ASSIGNMENT_CONSTANTS.PAGINATION_DEFAULT_LIMIT)),
  sort_by: z.enum(['due_at', 'created_at', 'status']).optional().default('due_at'),
  sort_order: z.enum(['asc', 'desc']).optional().default('asc'),
});

// ============================================================================
// BUSINESS RULE VALIDATORS
// ============================================================================

/**
 * Validates status transition is allowed
 */
export interface TransitionValidationResult {
  valid: boolean;
  error?: string;
}

export function validateStatusTransition(
  currentStatus: AssignmentStatus,
  targetStatus: AssignmentStatus
): TransitionValidationResult {
  const validNextStatuses = VALID_TRANSITIONS[currentStatus];

  if (!validNextStatuses) {
    return {
      valid: false,
      error: `Invalid current status: ${currentStatus}`,
    };
  }

  if (!validNextStatuses.includes(targetStatus)) {
    return {
      valid: false,
      error: `Cannot transition from ${currentStatus} to ${targetStatus}. Valid transitions: ${validNextStatuses.join(', ')}`,
    };
  }

  return { valid: true };
}

/**
 * Validates assignment can be reopened
 */
export function validateReopen(
  currentStatus: AssignmentStatus,
  reopenCount: number
): TransitionValidationResult {
  if (currentStatus !== 'completed') {
    return {
      valid: false,
      error: 'Only completed assignments can be reopened',
    };
  }

  if (reopenCount >= ASSIGNMENT_CONSTANTS.MAX_REOPEN_COUNT) {
    return {
      valid: false,
      error: `Maximum reopen count (${ASSIGNMENT_CONSTANTS.MAX_REOPEN_COUNT}) exceeded`,
    };
  }

  return { valid: true };
}

/**
 * Validates assignment can be submitted
 */
export function validateSubmission(
  currentStatus: AssignmentStatus,
  hasContent: boolean
): TransitionValidationResult {
  if (currentStatus !== 'viewed' && currentStatus !== 'reopened') {
    return {
      valid: false,
      error: `Cannot submit assignment with status ${currentStatus}. Assignment must be viewed or reopened first.`,
    };
  }

  if (!hasContent) {
    return {
      valid: false,
      error: 'Submission must include text or attachments',
    };
  }

  return { valid: true };
}

/**
 * Validates assignment can be updated
 */
export function validateUpdate(
  currentStatus: AssignmentStatus
): TransitionValidationResult {
  // Only allow updates before submission
  if (['submitted', 'reviewed', 'completed'].includes(currentStatus)) {
    return {
      valid: false,
      error: `Cannot update assignment in ${currentStatus} status`,
    };
  }

  return { valid: true };
}

/**
 * Validates assignment can be deleted
 */
export function validateDeletion(
  currentStatus: AssignmentStatus
): TransitionValidationResult {
  // Only allow deletion if not yet submitted
  if (['submitted', 'reviewed', 'completed'].includes(currentStatus)) {
    return {
      valid: false,
      error: `Cannot delete assignment in ${currentStatus} status. Assignment has student work.`,
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

export interface AssignmentPermissionContext {
  assignmentSchoolId: string;
  assignmentTeacherId: string;
  assignmentStudentId: string;
}

/**
 * Checks if user can create assignment
 */
export function canCreateAssignment(ctx: PermissionContext): boolean {
  // Only teachers, admins, and owners can create assignments
  return ['teacher', 'admin', 'owner'].includes(ctx.userRole);
}

/**
 * Checks if user can view assignment
 */
export function canViewAssignment(
  ctx: PermissionContext,
  assignment: AssignmentPermissionContext
): boolean {
  // Must be same school
  if (ctx.schoolId !== assignment.assignmentSchoolId) {
    return false;
  }

  // Owner/Admin can view all
  if (['owner', 'admin'].includes(ctx.userRole)) {
    return true;
  }

  // Teacher can view their own assignments
  if (ctx.userRole === 'teacher' && ctx.teacherId === assignment.assignmentTeacherId) {
    return true;
  }

  // Student can view their own assignments
  if (ctx.userRole === 'student' && ctx.studentId === assignment.assignmentStudentId) {
    return true;
  }

  // Parent can view children's assignments (would need parent_students check in real implementation)
  if (ctx.userRole === 'parent') {
    // TODO: Check parent_students relationship
    return true;
  }

  return false;
}

/**
 * Checks if user can update assignment
 */
export function canUpdateAssignment(
  ctx: PermissionContext,
  assignment: AssignmentPermissionContext
): boolean {
  // Must be same school
  if (ctx.schoolId !== assignment.assignmentSchoolId) {
    return false;
  }

  // Owner/Admin can update all
  if (['owner', 'admin'].includes(ctx.userRole)) {
    return true;
  }

  // Teacher can update their own assignments
  if (ctx.userRole === 'teacher' && ctx.teacherId === assignment.assignmentTeacherId) {
    return true;
  }

  return false;
}

/**
 * Checks if user can delete assignment
 */
export function canDeleteAssignment(
  ctx: PermissionContext,
  assignment: AssignmentPermissionContext
): boolean {
  // Same rules as update
  return canUpdateAssignment(ctx, assignment);
}

/**
 * Checks if user can submit assignment
 */
export function canSubmitAssignment(
  ctx: PermissionContext,
  assignment: AssignmentPermissionContext
): boolean {
  // Must be same school
  if (ctx.schoolId !== assignment.assignmentSchoolId) {
    return false;
  }

  // Only the assigned student can submit
  if (ctx.userRole === 'student' && ctx.studentId === assignment.assignmentStudentId) {
    return true;
  }

  return false;
}

/**
 * Checks if user can transition assignment status
 */
export function canTransitionAssignment(
  ctx: PermissionContext,
  assignment: AssignmentPermissionContext,
  toStatus: AssignmentStatus
): boolean {
  // Must be same school
  if (ctx.schoolId !== assignment.assignmentSchoolId) {
    return false;
  }

  // Owner/Admin can transition to any valid status
  if (['owner', 'admin'].includes(ctx.userRole)) {
    return true;
  }

  // Teacher can mark as reviewed, completed, or reopened
  if (
    ctx.userRole === 'teacher' &&
    ctx.teacherId === assignment.assignmentTeacherId &&
    ['reviewed', 'completed', 'reopened'].includes(toStatus)
  ) {
    return true;
  }

  // Student can mark as viewed
  if (
    ctx.userRole === 'student' &&
    ctx.studentId === assignment.assignmentStudentId &&
    toStatus === 'viewed'
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if user can reopen assignment
 */
export function canReopenAssignment(
  ctx: PermissionContext,
  assignment: AssignmentPermissionContext
): boolean {
  // Must be same school
  if (ctx.schoolId !== assignment.assignmentSchoolId) {
    return false;
  }

  // Owner/Admin can reopen
  if (['owner', 'admin'].includes(ctx.userRole)) {
    return true;
  }

  // Teacher who created it can reopen
  if (ctx.userRole === 'teacher' && ctx.teacherId === assignment.assignmentTeacherId) {
    return true;
  }

  return false;
}

// ============================================================================
// DATE/TIME VALIDATORS
// ============================================================================

/**
 * Validates due date is reasonable (not too far in future)
 */
export function validateDueDate(dueAt: string): TransitionValidationResult {
  const dueDate = new Date(dueAt);
  const now = new Date();

  // Check if date is valid
  if (isNaN(dueDate.getTime())) {
    return {
      valid: false,
      error: 'Invalid date format',
    };
  }

  // Must be in future
  if (dueDate <= now) {
    return {
      valid: false,
      error: 'Due date must be in the future',
    };
  }

  // Check not more than 1 year in future (business rule)
  const oneYearFromNow = new Date();
  oneYearFromNow.setFullYear(oneYearFromNow.getFullYear() + 1);

  if (dueDate > oneYearFromNow) {
    return {
      valid: false,
      error: 'Due date cannot be more than 1 year in the future',
    };
  }

  return { valid: true };
}

// ============================================================================
// ATTACHMENT VALIDATORS
// ============================================================================

const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // .docx
  'audio/mp4', // .m4a
  'audio/mpeg', // .mp3
];

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface AttachmentValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Validates attachment MIME type
 */
export function validateAttachmentType(mimeType: string): boolean {
  return ALLOWED_MIME_TYPES.includes(mimeType);
}

/**
 * Validates attachment size
 */
export function validateAttachmentSize(sizeBytes: number): boolean {
  return sizeBytes <= MAX_FILE_SIZE;
}

/**
 * Validates all attachments
 */
export function validateAttachments(
  attachments: Array<{ mime_type: string; size: number }>
): AttachmentValidationResult {
  const errors: string[] = [];

  if (attachments.length > 10) {
    errors.push('Maximum 10 attachments allowed');
  }

  attachments.forEach((attachment, index) => {
    if (!validateAttachmentType(attachment.mime_type)) {
      errors.push(
        `Attachment ${index + 1}: Invalid file type ${attachment.mime_type}. Allowed: ${ALLOWED_MIME_TYPES.join(', ')}`
      );
    }

    if (!validateAttachmentSize(attachment.size)) {
      errors.push(
        `Attachment ${index + 1}: File size ${attachment.size} bytes exceeds maximum ${MAX_FILE_SIZE} bytes (10MB)`
      );
    }
  });

  return {
    valid: errors.length === 0,
    errors,
  };
}

// ============================================================================
// COMPREHENSIVE VALIDATION FUNCTION
// ============================================================================

export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
}

/**
 * Validates and parses create assignment request
 */
export function validateCreateAssignmentRequest(
  body: unknown
): ValidationResult<CreateAssignmentRequest> {
  const result = createAssignmentSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  // Additional due date validation
  const dueDateValidation = validateDueDate(result.data.due_at);
  if (!dueDateValidation.valid) {
    return {
      success: false,
      error: dueDateValidation.error,
    };
  }

  return {
    success: true,
    data: result.data as CreateAssignmentRequest,
  };
}

/**
 * Validates and parses update assignment request
 */
export function validateUpdateAssignmentRequest(
  body: unknown
): ValidationResult<UpdateAssignmentRequest> {
  const result = updateAssignmentSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  return {
    success: true,
    data: result.data as UpdateAssignmentRequest,
  };
}

/**
 * Validates and parses submit assignment request
 */
export function validateSubmitAssignmentRequest(
  body: unknown
): ValidationResult<SubmitAssignmentRequest> {
  const result = submitAssignmentSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  // Check has content (text or attachments)
  const hasContent = !!(result.data.text || (result.data.attachments && result.data.attachments.length > 0));

  if (!hasContent) {
    return {
      success: false,
      error: 'Submission must include text or attachments',
    };
  }

  return {
    success: true,
    data: result.data as SubmitAssignmentRequest,
  };
}

/**
 * Validates and parses transition assignment request
 */
export function validateTransitionAssignmentRequest(
  body: unknown
): ValidationResult<TransitionAssignmentRequest> {
  const result = transitionAssignmentSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  return {
    success: true,
    data: result.data as TransitionAssignmentRequest,
  };
}

/**
 * Validates and parses reopen assignment request
 */
export function validateReopenAssignmentRequest(
  body: unknown
): ValidationResult<ReopenAssignmentRequest> {
  const result = reopenAssignmentSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  return {
    success: true,
    data: result.data as ReopenAssignmentRequest,
  };
}
