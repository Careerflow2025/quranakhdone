/**
 * Notification System Validators
 *
 * Created: 2025-10-20
 * Purpose: Zod schemas and business rule validation for notification system
 * Features: Request validation, permission checks, business rules
 */

import { z } from 'zod';
import {
  NotificationChannel,
  NotificationType,
  SendNotificationRequest,
  BulkSendNotificationRequest,
  ListNotificationsRequest,
  MarkReadRequest,
  MarkAllReadRequest,
  UpdatePreferencesRequest,
  RegisterDeviceRequest,
  NOTIFICATION_CONSTANTS,
} from '@/lib/types/notifications';

// ============================================================================
// Zod Schemas for Base Types
// ============================================================================

const notificationChannelSchema = z.enum(['in_app', 'email', 'push']);

const notificationTypeSchema = z.enum([
  'assignment_created',
  'assignment_submitted',
  'assignment_reviewed',
  'assignment_completed',
  'assignment_reopened',
  'assignment_due_soon',
  'assignment_overdue',
  'homework_assigned',
  'homework_completed',
  'target_created',
  'target_milestone_completed',
  'target_due_soon',
  'grade_submitted',
  'mastery_improved',
  'message_received',
  'system_announcement',
]);

const platformSchema = z.enum(['ios', 'android', 'web']);

// ============================================================================
// Zod Schemas for Requests
// ============================================================================

export const sendNotificationRequestSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format'),
  type: notificationTypeSchema,
  channels: z
    .array(notificationChannelSchema)
    .min(1, 'At least one channel is required')
    .max(3, 'Maximum 3 channels allowed'),
  payload: z
    .record(z.unknown())
    .refine(
      (payload) => JSON.stringify(payload).length <= NOTIFICATION_CONSTANTS.MAX_PAYLOAD_SIZE,
      `Payload size exceeds maximum of ${NOTIFICATION_CONSTANTS.MAX_PAYLOAD_SIZE} bytes`
    ),
  scheduled_for: z.string().datetime().optional(),
});

export const bulkSendNotificationRequestSchema = z.object({
  user_ids: z
    .array(z.string().uuid())
    .min(1, 'At least one user ID is required')
    .max(NOTIFICATION_CONSTANTS.BATCH_SEND_LIMIT, `Maximum ${NOTIFICATION_CONSTANTS.BATCH_SEND_LIMIT} users per batch`),
  type: notificationTypeSchema,
  channels: z
    .array(notificationChannelSchema)
    .min(1, 'At least one channel is required')
    .max(3, 'Maximum 3 channels allowed'),
  payload: z
    .record(z.unknown())
    .refine(
      (payload) => JSON.stringify(payload).length <= NOTIFICATION_CONSTANTS.MAX_PAYLOAD_SIZE,
      `Payload size exceeds maximum of ${NOTIFICATION_CONSTANTS.MAX_PAYLOAD_SIZE} bytes`
    ),
});

export const listNotificationsRequestSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format').optional(),
  channel: notificationChannelSchema.optional(),
  type: notificationTypeSchema.optional(),
  read: z.boolean().optional(),
  limit: z
    .number()
    .int()
    .min(1)
    .max(NOTIFICATION_CONSTANTS.MAX_PAGINATION_LIMIT)
    .default(NOTIFICATION_CONSTANTS.DEFAULT_PAGINATION_LIMIT)
    .optional(),
  offset: z.number().int().min(0).default(0).optional(),
  start_date: z.string().datetime().optional(),
  end_date: z.string().datetime().optional(),
});

export const markReadRequestSchema = z.object({
  notification_id: z.string().uuid('Invalid notification ID format'),
});

export const markAllReadRequestSchema = z.object({
  user_id: z.string().uuid('Invalid user ID format').optional(),
  type: notificationTypeSchema.optional(),
});

export const updatePreferencesRequestSchema = z.object({
  in_app_enabled: z.boolean().optional(),
  email_enabled: z.boolean().optional(),
  push_enabled: z.boolean().optional(),
  assignment_notifications: z.boolean().optional(),
  homework_notifications: z.boolean().optional(),
  target_notifications: z.boolean().optional(),
  grade_notifications: z.boolean().optional(),
  mastery_notifications: z.boolean().optional(),
  message_notifications: z.boolean().optional(),
  quiet_hours_start: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:MM (24-hour)')
    .nullable()
    .optional(),
  quiet_hours_end: z
    .string()
    .regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Invalid time format. Use HH:MM (24-hour)')
    .nullable()
    .optional(),
});

export const registerDeviceRequestSchema = z.object({
  push_token: z.string().min(1, 'Push token is required'),
  platform: platformSchema,
});

// ============================================================================
// Validation Result Types
// ============================================================================

export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: string[];
}

// ============================================================================
// Business Rule Validators
// ============================================================================

/**
 * Validate notification type is appropriate for payload
 */
export function validateNotificationTypePayload(
  type: NotificationType,
  payload: Record<string, unknown>
): ValidationResult {
  const errors: string[] = [];

  switch (type) {
    case 'assignment_created':
    case 'assignment_submitted':
    case 'assignment_reviewed':
    case 'assignment_completed':
    case 'assignment_reopened':
    case 'assignment_due_soon':
    case 'assignment_overdue':
      if (!payload.assignment_id) errors.push('assignment_id is required for assignment notifications');
      if (!payload.assignment_title) errors.push('assignment_title is required for assignment notifications');
      if (!payload.student_name) errors.push('student_name is required for assignment notifications');
      break;

    case 'homework_assigned':
    case 'homework_completed':
      if (!payload.homework_id && type === 'homework_assigned') errors.push('homework_id is required');
      if (!payload.student_name) errors.push('student_name is required for homework notifications');
      if (!payload.ayah_reference) errors.push('ayah_reference is required for homework notifications');
      break;

    case 'target_created':
    case 'target_milestone_completed':
    case 'target_due_soon':
      if (!payload.target_id) errors.push('target_id is required for target notifications');
      if (!payload.target_title) errors.push('target_title is required for target notifications');
      break;

    case 'grade_submitted':
      if (!payload.assignment_id) errors.push('assignment_id is required for grade notifications');
      if (!payload.assignment_title) errors.push('assignment_title is required for grade notifications');
      if (!payload.student_name) errors.push('student_name is required for grade notifications');
      if (typeof payload.overall_score !== 'number') errors.push('overall_score must be a number');
      if (!payload.letter_grade) errors.push('letter_grade is required for grade notifications');
      break;

    case 'mastery_improved':
      if (!payload.student_name) errors.push('student_name is required for mastery notifications');
      if (!payload.ayah_reference) errors.push('ayah_reference is required for mastery notifications');
      if (!payload.old_level) errors.push('old_level is required for mastery notifications');
      if (!payload.new_level) errors.push('new_level is required for mastery notifications');
      break;

    case 'message_received':
      if (!payload.message_id) errors.push('message_id is required for message notifications');
      if (!payload.sender_name) errors.push('sender_name is required for message notifications');
      if (!payload.message_preview) errors.push('message_preview is required for message notifications');
      break;

    case 'system_announcement':
      if (!payload.title) errors.push('title is required for system announcements');
      if (!payload.message) errors.push('message is required for system announcements');
      if (!payload.priority) errors.push('priority is required for system announcements');
      break;
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: 'Payload validation failed',
      errors,
    };
  }

  return { success: true };
}

/**
 * Validate scheduled notification time is in the future
 */
export function validateScheduledTime(scheduled_for?: string): ValidationResult {
  if (!scheduled_for) {
    return { success: true }; // Optional field, valid if not provided
  }

  const scheduledDate = new Date(scheduled_for);
  const now = new Date();

  if (scheduledDate <= now) {
    return {
      success: false,
      error: 'Scheduled time must be in the future',
    };
  }

  // Don't allow scheduling more than 30 days in advance
  const maxFutureDate = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
  if (scheduledDate > maxFutureDate) {
    return {
      success: false,
      error: 'Cannot schedule notifications more than 30 days in advance',
    };
  }

  return { success: true };
}

/**
 * Validate quiet hours configuration
 */
export function validateQuietHours(
  quiet_hours_start?: string | null,
  quiet_hours_end?: string | null
): ValidationResult {
  // Both must be provided or both must be null
  if ((quiet_hours_start && !quiet_hours_end) || (!quiet_hours_start && quiet_hours_end)) {
    return {
      success: false,
      error: 'Both quiet_hours_start and quiet_hours_end must be provided together',
    };
  }

  // If both are null or undefined, that's valid
  if (!quiet_hours_start && !quiet_hours_end) {
    return { success: true };
  }

  // Validate time format (already done by Zod, but double-check)
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(quiet_hours_start!) || !timeRegex.test(quiet_hours_end!)) {
    return {
      success: false,
      error: 'Invalid time format. Use HH:MM (24-hour format)',
    };
  }

  // Note: We allow start > end for overnight quiet hours (e.g., 22:00 - 08:00)
  // This is valid and handled in the isQuietHours() function

  return { success: true };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(limit?: number, offset?: number): ValidationResult {
  if (limit !== undefined) {
    if (limit < 1 || limit > NOTIFICATION_CONSTANTS.MAX_PAGINATION_LIMIT) {
      return {
        success: false,
        error: `Limit must be between 1 and ${NOTIFICATION_CONSTANTS.MAX_PAGINATION_LIMIT}`,
      };
    }
  }

  if (offset !== undefined && offset < 0) {
    return {
      success: false,
      error: 'Offset must be 0 or greater',
    };
  }

  return { success: true };
}

/**
 * Validate date range for filtering notifications
 */
export function validateDateRange(start_date?: string, end_date?: string): ValidationResult {
  if (!start_date && !end_date) {
    return { success: true }; // No date filter is valid
  }

  if (start_date && end_date) {
    const start = new Date(start_date);
    const end = new Date(end_date);

    if (start > end) {
      return {
        success: false,
        error: 'start_date must be before or equal to end_date',
      };
    }

    // Don't allow date ranges longer than 1 year
    const oneYearInMs = 365 * 24 * 60 * 60 * 1000;
    if (end.getTime() - start.getTime() > oneYearInMs) {
      return {
        success: false,
        error: 'Date range cannot exceed 1 year',
      };
    }
  }

  return { success: true };
}

// ============================================================================
// Permission Validators
// ============================================================================

export interface UserContext {
  userId: string;
  userRole: 'owner' | 'admin' | 'teacher' | 'student' | 'parent';
  schoolId: string;
}

/**
 * Check if user can send notifications
 * Only teachers, admins, and owners can send notifications
 */
export function canSendNotification(context: UserContext, targetSchoolId: string): boolean {
  // Must be same school
  if (context.schoolId !== targetSchoolId) {
    return false;
  }

  // Only teachers, admins, and owners can send notifications
  return ['owner', 'admin', 'teacher'].includes(context.userRole);
}

/**
 * Check if user can send bulk notifications
 * Only admins and owners can send bulk notifications
 */
export function canSendBulkNotification(context: UserContext, targetSchoolId: string): boolean {
  // Must be same school
  if (context.schoolId !== targetSchoolId) {
    return false;
  }

  // Only admins and owners can send bulk notifications
  return ['owner', 'admin'].includes(context.userRole);
}

/**
 * Check if user can view notifications for another user
 * Teachers can view their students' notifications
 * Admins/owners can view all notifications in their school
 */
export function canViewUserNotifications(
  context: UserContext,
  targetUserId?: string
): boolean {
  // Users can always view their own notifications
  if (!targetUserId || targetUserId === context.userId) {
    return true;
  }

  // Admins and owners can view all notifications in their school
  if (['owner', 'admin'].includes(context.userRole)) {
    return true;
  }

  // Teachers can view their students' notifications (would need to check student-teacher relationship in actual implementation)
  if (context.userRole === 'teacher') {
    return true; // Simplified - actual implementation would verify student-teacher relationship
  }

  // Parents can view their children's notifications (would need to check parent-child relationship)
  if (context.userRole === 'parent') {
    return true; // Simplified - actual implementation would verify parent-child relationship
  }

  return false;
}

/**
 * Check if user can mark notifications as read
 * Users can only mark their own notifications as read, unless admin/owner
 */
export function canMarkNotificationRead(
  context: UserContext,
  notificationUserId: string
): boolean {
  // Users can mark their own notifications as read
  if (context.userId === notificationUserId) {
    return true;
  }

  // Admins and owners can mark any notification in their school as read
  return ['owner', 'admin'].includes(context.userRole);
}

/**
 * Check if user can update notification preferences
 * Users can only update their own preferences, unless admin/owner
 */
export function canUpdatePreferences(context: UserContext, targetUserId: string): boolean {
  // Users can update their own preferences
  if (context.userId === targetUserId) {
    return true;
  }

  // Admins and owners can update preferences for any user in their school
  return ['owner', 'admin'].includes(context.userRole);
}

/**
 * Check if user can register push notification devices
 * Users can only register devices for themselves
 */
export function canRegisterDevice(context: UserContext, targetUserId: string): boolean {
  // Users can only register devices for themselves
  return context.userId === targetUserId;
}

// ============================================================================
// Combined Validation Functions
// ============================================================================

/**
 * Validate SendNotificationRequest
 */
export function validateSendNotificationRequest(
  data: unknown
): ValidationResult<SendNotificationRequest> {
  // 1. Schema validation
  const schemaResult = sendNotificationRequestSchema.safeParse(data);
  if (!schemaResult.success) {
    return {
      success: false,
      error: 'Request validation failed',
      errors: schemaResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  const validatedData = schemaResult.data as SendNotificationRequest;

  // 2. Payload validation for notification type
  const payloadValidation = validateNotificationTypePayload(
    validatedData.type,
    validatedData.payload
  );
  if (!payloadValidation.success) {
    return payloadValidation;
  }

  // 3. Scheduled time validation
  const scheduledValidation = validateScheduledTime(validatedData.scheduled_for);
  if (!scheduledValidation.success) {
    return scheduledValidation;
  }

  return {
    success: true,
    data: validatedData,
  };
}

/**
 * Validate BulkSendNotificationRequest
 */
export function validateBulkSendNotificationRequest(
  data: unknown
): ValidationResult<BulkSendNotificationRequest> {
  // 1. Schema validation
  const schemaResult = bulkSendNotificationRequestSchema.safeParse(data);
  if (!schemaResult.success) {
    return {
      success: false,
      error: 'Request validation failed',
      errors: schemaResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  const validatedData = schemaResult.data as BulkSendNotificationRequest;

  // 2. Payload validation for notification type
  const payloadValidation = validateNotificationTypePayload(
    validatedData.type,
    validatedData.payload
  );
  if (!payloadValidation.success) {
    return payloadValidation;
  }

  // 3. Check for duplicate user IDs
  const uniqueUserIds = new Set(validatedData.user_ids);
  if (uniqueUserIds.size !== validatedData.user_ids.length) {
    return {
      success: false,
      error: 'Duplicate user IDs detected in bulk send request',
    };
  }

  return {
    success: true,
    data: validatedData,
  };
}

/**
 * Validate ListNotificationsRequest
 */
export function validateListNotificationsRequest(
  data: unknown
): ValidationResult<ListNotificationsRequest> {
  // 1. Schema validation
  const schemaResult = listNotificationsRequestSchema.safeParse(data);
  if (!schemaResult.success) {
    return {
      success: false,
      error: 'Request validation failed',
      errors: schemaResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  const validatedData = schemaResult.data as ListNotificationsRequest;

  // 2. Pagination validation
  const paginationValidation = validatePagination(validatedData.limit, validatedData.offset);
  if (!paginationValidation.success) {
    return paginationValidation;
  }

  // 3. Date range validation
  const dateRangeValidation = validateDateRange(
    validatedData.start_date,
    validatedData.end_date
  );
  if (!dateRangeValidation.success) {
    return dateRangeValidation;
  }

  return {
    success: true,
    data: validatedData,
  };
}

/**
 * Validate MarkReadRequest
 */
export function validateMarkReadRequest(data: unknown): ValidationResult<MarkReadRequest> {
  const schemaResult = markReadRequestSchema.safeParse(data);
  if (!schemaResult.success) {
    return {
      success: false,
      error: 'Request validation failed',
      errors: schemaResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  return {
    success: true,
    data: schemaResult.data as MarkReadRequest,
  };
}

/**
 * Validate MarkAllReadRequest
 */
export function validateMarkAllReadRequest(
  data: unknown
): ValidationResult<MarkAllReadRequest> {
  const schemaResult = markAllReadRequestSchema.safeParse(data);
  if (!schemaResult.success) {
    return {
      success: false,
      error: 'Request validation failed',
      errors: schemaResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  return {
    success: true,
    data: schemaResult.data as MarkAllReadRequest,
  };
}

/**
 * Validate UpdatePreferencesRequest
 */
export function validateUpdatePreferencesRequest(
  data: unknown
): ValidationResult<UpdatePreferencesRequest> {
  // 1. Schema validation
  const schemaResult = updatePreferencesRequestSchema.safeParse(data);
  if (!schemaResult.success) {
    return {
      success: false,
      error: 'Request validation failed',
      errors: schemaResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  const validatedData = schemaResult.data as UpdatePreferencesRequest;

  // 2. Quiet hours validation
  const quietHoursValidation = validateQuietHours(
    validatedData.quiet_hours_start,
    validatedData.quiet_hours_end
  );
  if (!quietHoursValidation.success) {
    return quietHoursValidation;
  }

  // 3. Ensure at least one field is being updated
  const hasUpdate = Object.values(validatedData).some((value) => value !== undefined);
  if (!hasUpdate) {
    return {
      success: false,
      error: 'At least one preference field must be provided for update',
    };
  }

  return {
    success: true,
    data: validatedData,
  };
}

/**
 * Validate RegisterDeviceRequest
 */
export function validateRegisterDeviceRequest(
  data: unknown
): ValidationResult<RegisterDeviceRequest> {
  const schemaResult = registerDeviceRequestSchema.safeParse(data);
  if (!schemaResult.success) {
    return {
      success: false,
      error: 'Request validation failed',
      errors: schemaResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  return {
    success: true,
    data: schemaResult.data as RegisterDeviceRequest,
  };
}
