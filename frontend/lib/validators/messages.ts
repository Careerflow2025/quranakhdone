/**
 * Enhanced Messages Validation Utilities
 * Created: 2025-10-20
 * Purpose: Server-side validation for messaging system
 * Dependencies: Zod for schema validation
 */

import { z } from 'zod';
import {
  MESSAGE_CONSTANTS,
  ALLOWED_ATTACHMENT_TYPES,
  COMMUNICATION_MATRIX,
  SendMessageRequest,
  ReplyToMessageRequest,
  AddAttachmentsRequest,
  ListMessagesQuery,
  isValidAttachmentType,
  isValidAttachmentSize,
} from '../types/messages';

// ============================================================================
// ZOD VALIDATION SCHEMAS
// ============================================================================

/**
 * UUID validation schema
 */
const uuidSchema = z.string().uuid('Invalid UUID format');

/**
 * Attachment schema
 */
const attachmentSchema = z.object({
  url: z.string().url('Invalid attachment URL'),
  mime_type: z
    .string()
    .refine(
      (type) => ALLOWED_ATTACHMENT_TYPES.includes(type as any),
      'Invalid attachment type. Allowed: images, PDFs, DOCX, text, audio'
    ),
  file_name: z.string().min(1, 'File name required').max(255, 'File name too long'),
  file_size: z
    .number()
    .int()
    .positive('File size must be positive')
    .max(
      MESSAGE_CONSTANTS.MAX_ATTACHMENT_SIZE,
      `File too large. Maximum size: ${MESSAGE_CONSTANTS.MAX_ATTACHMENT_SIZE / (1024 * 1024)}MB`
    ),
});

/**
 * Send Message Request Schema
 */
export const sendMessageSchema = z.object({
  recipient_user_id: uuidSchema,
  subject: z
    .string()
    .max(
      MESSAGE_CONSTANTS.MAX_SUBJECT_LENGTH,
      `Subject must be ${MESSAGE_CONSTANTS.MAX_SUBJECT_LENGTH} characters or less`
    )
    .optional(),
  body: z
    .string()
    .min(1, 'Message body is required')
    .max(
      MESSAGE_CONSTANTS.MAX_BODY_LENGTH,
      `Message must be ${MESSAGE_CONSTANTS.MAX_BODY_LENGTH} characters or less`
    ),
  thread_id: uuidSchema.optional(),
  attachments: z
    .array(attachmentSchema)
    .max(
      MESSAGE_CONSTANTS.MAX_ATTACHMENTS,
      `Maximum ${MESSAGE_CONSTANTS.MAX_ATTACHMENTS} attachments allowed`
    )
    .optional(),
}).refine(
  (data) => {
    // If thread_id is not provided (new thread), subject is required
    if (!data.thread_id && !data.subject) {
      return false;
    }
    return true;
  },
  {
    message: 'Subject is required for new message threads',
    path: ['subject'],
  }
);

/**
 * Reply To Message Request Schema
 */
export const replyToMessageSchema = z.object({
  body: z
    .string()
    .min(1, 'Reply body is required')
    .max(
      MESSAGE_CONSTANTS.MAX_BODY_LENGTH,
      `Reply must be ${MESSAGE_CONSTANTS.MAX_BODY_LENGTH} characters or less`
    ),
  attachments: z
    .array(attachmentSchema)
    .max(
      MESSAGE_CONSTANTS.MAX_ATTACHMENTS,
      `Maximum ${MESSAGE_CONSTANTS.MAX_ATTACHMENTS} attachments allowed`
    )
    .optional(),
});

/**
 * Add Attachments Request Schema
 */
export const addAttachmentsSchema = z.object({
  attachments: z
    .array(attachmentSchema)
    .min(1, 'At least one attachment required')
    .max(
      MESSAGE_CONSTANTS.MAX_ATTACHMENTS,
      `Maximum ${MESSAGE_CONSTANTS.MAX_ATTACHMENTS} attachments allowed`
    ),
});

/**
 * List Messages Query Schema
 */
export const listMessagesQuerySchema = z.object({
  folder: z.enum(['inbox', 'sent', 'unread', 'all']).optional(),
  thread_id: uuidSchema.optional(),
  sender_user_id: uuidSchema.optional(),
  recipient_user_id: uuidSchema.optional(),
  read_status: z.enum(['read', 'unread', 'all']).optional(),
  page: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().positive())
    .optional()
    .default('1'),
  limit: z
    .string()
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().int().min(1).max(MESSAGE_CONSTANTS.MAX_PAGINATION_LIMIT))
    .optional()
    .default(String(MESSAGE_CONSTANTS.DEFAULT_PAGINATION_LIMIT)),
  sort_by: z.enum(['created_at', 'updated_at']).optional().default('created_at'),
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
 * Validates message body content
 */
export function validateMessageBody(body: string): ValidationResult {
  if (!body || body.trim().length === 0) {
    return {
      valid: false,
      error: 'Message body cannot be empty',
    };
  }

  if (body.length > MESSAGE_CONSTANTS.MAX_BODY_LENGTH) {
    return {
      valid: false,
      error: `Message too long: ${body.length} characters. Maximum is ${MESSAGE_CONSTANTS.MAX_BODY_LENGTH}`,
    };
  }

  return { valid: true };
}

/**
 * Validates message subject
 */
export function validateSubject(subject: string): ValidationResult {
  if (subject.length > MESSAGE_CONSTANTS.MAX_SUBJECT_LENGTH) {
    return {
      valid: false,
      error: `Subject too long: ${subject.length} characters. Maximum is ${MESSAGE_CONSTANTS.MAX_SUBJECT_LENGTH}`,
    };
  }

  return { valid: true };
}

/**
 * Validates attachments array
 */
export function validateAttachments(
  attachments: Array<{ mime_type: string; file_size: number }>
): ValidationResult {
  if (attachments.length > MESSAGE_CONSTANTS.MAX_ATTACHMENTS) {
    return {
      valid: false,
      error: `Too many attachments: ${attachments.length}. Maximum is ${MESSAGE_CONSTANTS.MAX_ATTACHMENTS}`,
    };
  }

  for (let i = 0; i < attachments.length; i++) {
    const attachment = attachments[i];

    if (!isValidAttachmentType(attachment.mime_type)) {
      return {
        valid: false,
        error: `Invalid attachment type: ${attachment.mime_type}. Allowed types: images, PDFs, DOCX, text, audio`,
      };
    }

    if (!isValidAttachmentSize(attachment.file_size)) {
      return {
        valid: false,
        error: `Attachment too large: ${attachment.file_size} bytes. Maximum is ${MESSAGE_CONSTANTS.MAX_ATTACHMENT_SIZE} bytes (${MESSAGE_CONSTANTS.MAX_ATTACHMENT_SIZE / (1024 * 1024)}MB)`,
      };
    }
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
  parentId?: string;
}

export interface MessagePermissionContext {
  messageSchoolId: string;
  messageSenderId: string;
  messageRecipientId: string;
}

/**
 * Checks if user can send messages
 */
export function canSendMessage(ctx: PermissionContext): boolean {
  // All authenticated users can send messages
  return true;
}

/**
 * Checks if user can message specific recipient
 */
export function canMessageRecipient(
  ctx: PermissionContext,
  recipientRole: UserRole,
  recipientSchoolId: string
): boolean {
  // Must be same school
  if (ctx.schoolId !== recipientSchoolId) {
    return false;
  }

  // Check communication matrix
  const allowedRoles = COMMUNICATION_MATRIX[ctx.userRole];
  if (!allowedRoles) {
    return false;
  }

  return allowedRoles.includes(recipientRole);
}

/**
 * Checks if user can view message
 */
export function canViewMessage(
  ctx: PermissionContext,
  message: MessagePermissionContext
): boolean {
  // Must be same school
  if (ctx.schoolId !== message.messageSchoolId) {
    return false;
  }

  // Owner/Admin can view all messages in their school
  if (['owner', 'admin'].includes(ctx.userRole)) {
    return true;
  }

  // Sender or recipient can view
  if (
    ctx.userId === message.messageSenderId ||
    ctx.userId === message.messageRecipientId
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if user can reply to message
 */
export function canReplyToMessage(
  ctx: PermissionContext,
  message: MessagePermissionContext
): boolean {
  // Must be same school
  if (ctx.schoolId !== message.messageSchoolId) {
    return false;
  }

  // Must be sender or recipient to reply
  if (
    ctx.userId === message.messageSenderId ||
    ctx.userId === message.messageRecipientId
  ) {
    return true;
  }

  // Owner/Admin can reply to any message in their school
  if (['owner', 'admin'].includes(ctx.userRole)) {
    return true;
  }

  return false;
}

/**
 * Checks if user can delete message
 */
export function canDeleteMessage(
  ctx: PermissionContext,
  message: MessagePermissionContext
): boolean {
  // Must be same school
  if (ctx.schoolId !== message.messageSchoolId) {
    return false;
  }

  // Owner/Admin can delete any message
  if (['owner', 'admin'].includes(ctx.userRole)) {
    return true;
  }

  // Sender can delete their own message
  if (ctx.userId === message.messageSenderId) {
    return true;
  }

  return false;
}

/**
 * Checks if user can mark message as read
 */
export function canMarkAsRead(
  ctx: PermissionContext,
  message: MessagePermissionContext
): boolean {
  // Must be same school
  if (ctx.schoolId !== message.messageSchoolId) {
    return false;
  }

  // Only recipient can mark as read
  if (ctx.userId === message.messageRecipientId) {
    return true;
  }

  // Owner/Admin can mark any message as read
  if (['owner', 'admin'].includes(ctx.userRole)) {
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
 * Validates and parses send message request
 */
export function validateSendMessageRequest(
  body: unknown
): ValidationResult<SendMessageRequest> {
  const result = sendMessageSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  // Additional body validation
  const bodyValidation = validateMessageBody(result.data.body);
  if (!bodyValidation.valid) {
    return {
      success: false,
      error: bodyValidation.error,
    };
  }

  // Additional subject validation if provided
  if (result.data.subject) {
    const subjectValidation = validateSubject(result.data.subject);
    if (!subjectValidation.valid) {
      return {
        success: false,
        error: subjectValidation.error,
      };
    }
  }

  // Additional attachments validation if provided
  if (result.data.attachments && result.data.attachments.length > 0) {
    const attachmentsValidation = validateAttachments(result.data.attachments);
    if (!attachmentsValidation.valid) {
      return {
        success: false,
        error: attachmentsValidation.error,
      };
    }
  }

  return {
    success: true,
    data: result.data as SendMessageRequest,
  };
}

/**
 * Validates and parses reply to message request
 */
export function validateReplyToMessageRequest(
  body: unknown
): ValidationResult<ReplyToMessageRequest> {
  const result = replyToMessageSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  // Additional body validation
  const bodyValidation = validateMessageBody(result.data.body);
  if (!bodyValidation.valid) {
    return {
      success: false,
      error: bodyValidation.error,
    };
  }

  // Additional attachments validation if provided
  if (result.data.attachments && result.data.attachments.length > 0) {
    const attachmentsValidation = validateAttachments(result.data.attachments);
    if (!attachmentsValidation.valid) {
      return {
        success: false,
        error: attachmentsValidation.error,
      };
    }
  }

  return {
    success: true,
    data: result.data as ReplyToMessageRequest,
  };
}

/**
 * Validates and parses add attachments request
 */
export function validateAddAttachmentsRequest(
  body: unknown
): ValidationResult<AddAttachmentsRequest> {
  const result = addAttachmentsSchema.safeParse(body);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  // Additional attachments validation
  const attachmentsValidation = validateAttachments(result.data.attachments);
  if (!attachmentsValidation.valid) {
    return {
      success: false,
      error: attachmentsValidation.error,
    };
  }

  return {
    success: true,
    data: result.data as AddAttachmentsRequest,
  };
}

/**
 * Validates and parses list messages query
 */
export function validateListMessagesQuery(
  query: unknown
): ValidationResult<ListMessagesQuery> {
  const result = listMessagesQuerySchema.safeParse(query);

  if (!result.success) {
    return {
      success: false,
      error: 'Validation failed',
      errors: result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  return {
    success: true,
    data: result.data as any as ListMessagesQuery,
  };
}
