/**
 * Calendar Events Validators
 *
 * Created: 2025-10-20
 * Purpose: Zod schemas and business rule validation for calendar events
 * Features: Request validation, permission checks, recurrence validation
 */

import { z } from 'zod';
import {
  EventType,
  RecurrenceFrequency,
  CreateEventRequest,
  UpdateEventRequest,
  ListEventsRequest,
  DeleteEventRequest,
  ICalExportRequest,
  EVENT_CONSTANTS,
  isValidDateRange,
  isValidRecurrenceRule,
} from '@/lib/types/events';

// ============================================================================
// Zod Schemas for Base Types
// ============================================================================

const eventTypeSchema = z.enum([
  'assignment_due',
  'homework_due',
  'target_due',
  'class_session',
  'school_event',
  'holiday',
  'exam',
  'meeting',
  'reminder',
  'other',
]);

const recurrenceFrequencySchema = z.enum(['daily', 'weekly', 'monthly', 'yearly']);

const recurrenceRuleSchema = z.object({
  frequency: recurrenceFrequencySchema,
  interval: z.number().int().min(1, 'Interval must be at least 1'),
  count: z.number().int().min(1, 'Count must be at least 1').optional(),
  until: z.string().datetime().optional(),
  by_weekday: z.array(z.number().int().min(0).max(6)).optional(),
  by_month_day: z.number().int().min(1).max(31).optional(),
  by_month: z.number().int().min(1).max(12).optional(),
});

// ============================================================================
// Zod Schemas for Requests
// ============================================================================

export const createEventRequestSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(EVENT_CONSTANTS.MAX_TITLE_LENGTH, `Title must be ${EVENT_CONSTANTS.MAX_TITLE_LENGTH} characters or less`),
  description: z
    .string()
    .max(EVENT_CONSTANTS.MAX_DESCRIPTION_LENGTH, `Description must be ${EVENT_CONSTANTS.MAX_DESCRIPTION_LENGTH} characters or less`)
    .optional(),
  event_type: eventTypeSchema,
  start_date: z.string().datetime('Invalid start date format'),
  end_date: z.string().datetime('Invalid end date format'),
  all_day: z.boolean().default(false).optional(),
  location: z
    .string()
    .max(EVENT_CONSTANTS.MAX_LOCATION_LENGTH, `Location must be ${EVENT_CONSTANTS.MAX_LOCATION_LENGTH} characters or less`)
    .optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').optional(),

  // Recurrence
  is_recurring: z.boolean().default(false).optional(),
  recurrence_rule: recurrenceRuleSchema.optional(),

  // Linked resources
  class_id: z.string().uuid('Invalid class ID format').optional(),
  assignment_id: z.string().uuid('Invalid assignment ID format').optional(),
  homework_id: z.string().uuid('Invalid homework ID format').optional(),
  target_id: z.string().uuid('Invalid target ID format').optional(),

  // Participants
  participant_user_ids: z.array(z.string().uuid()).optional(),
});

export const updateEventRequestSchema = z.object({
  title: z
    .string()
    .min(1, 'Title cannot be empty')
    .max(EVENT_CONSTANTS.MAX_TITLE_LENGTH, `Title must be ${EVENT_CONSTANTS.MAX_TITLE_LENGTH} characters or less`)
    .optional(),
  description: z
    .string()
    .max(EVENT_CONSTANTS.MAX_DESCRIPTION_LENGTH, `Description must be ${EVENT_CONSTANTS.MAX_DESCRIPTION_LENGTH} characters or less`)
    .optional(),
  event_type: eventTypeSchema.optional(),
  start_date: z.string().datetime('Invalid start date format').optional(),
  end_date: z.string().datetime('Invalid end date format').optional(),
  all_day: z.boolean().optional(),
  location: z
    .string()
    .max(EVENT_CONSTANTS.MAX_LOCATION_LENGTH, `Location must be ${EVENT_CONSTANTS.MAX_LOCATION_LENGTH} characters or less`)
    .optional(),
  color: z.string().regex(/^#[0-9A-F]{6}$/i, 'Color must be a valid hex color').optional(),

  // Update series flag for recurring events
  update_series: z.boolean().default(false).optional(),
});

export const listEventsRequestSchema = z.object({
  start_date: z.string().datetime('Invalid start date format').optional(),
  end_date: z.string().datetime('Invalid end date format').optional(),
  event_type: eventTypeSchema.optional(),
  class_id: z.string().uuid('Invalid class ID format').optional(),
  created_by_user_id: z.string().uuid('Invalid user ID format').optional(),
  include_recurring: z.boolean().default(true).optional(),
  limit: z
    .number()
    .int()
    .min(1)
    .max(EVENT_CONSTANTS.MAX_PAGINATION_LIMIT)
    .default(EVENT_CONSTANTS.DEFAULT_PAGINATION_LIMIT)
    .optional(),
  offset: z.number().int().min(0).default(0).optional(),
});

export const deleteEventRequestSchema = z.object({
  delete_series: z.boolean().default(false).optional(),
});

export const iCalExportRequestSchema = z.object({
  start_date: z.string().datetime('Invalid start date format').optional(),
  end_date: z.string().datetime('Invalid end date format').optional(),
  event_type: eventTypeSchema.optional(),
  class_id: z.string().uuid('Invalid class ID format').optional(),
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
 * Validate event date range
 */
export function validateEventDateRange(startDate: string, endDate: string): ValidationResult {
  if (!isValidDateRange(startDate, endDate)) {
    return {
      success: false,
      error: 'Start date must be before or equal to end date',
    };
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffMs = end.getTime() - start.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  // Don't allow events longer than 30 days
  if (diffDays > 30) {
    return {
      success: false,
      error: 'Event duration cannot exceed 30 days',
    };
  }

  return { success: true };
}

/**
 * Validate recurrence rule
 */
export function validateRecurrenceRuleComplete(
  isRecurring: boolean,
  rule?: RecurrenceRule
): ValidationResult {
  if (!isRecurring) {
    return { success: true }; // Not recurring, no rule needed
  }

  if (!rule) {
    return {
      success: false,
      error: 'Recurrence rule is required when is_recurring is true',
    };
  }

  if (!isValidRecurrenceRule(rule)) {
    return {
      success: false,
      error: 'Invalid recurrence rule',
    };
  }

  // Cannot have both count and until
  if (rule.count !== undefined && rule.until !== undefined) {
    return {
      success: false,
      error: 'Recurrence rule cannot have both count and until specified',
    };
  }

  // Validate count limit
  if (rule.count && rule.count > EVENT_CONSTANTS.MAX_RECURRENCE_COUNT) {
    return {
      success: false,
      error: `Recurrence count cannot exceed ${EVENT_CONSTANTS.MAX_RECURRENCE_COUNT}`,
    };
  }

  // Validate until date is in the future
  if (rule.until) {
    const untilDate = new Date(rule.until);
    if (untilDate <= new Date()) {
      return {
        success: false,
        error: 'Recurrence until date must be in the future',
      };
    }
  }

  return { success: true };
}

/**
 * Validate linked resources (only one can be set)
 */
export function validateLinkedResources(
  assignmentId?: string,
  homeworkId?: string,
  targetId?: string
): ValidationResult {
  const linkedCount = [assignmentId, homeworkId, targetId].filter(Boolean).length;

  if (linkedCount > 1) {
    return {
      success: false,
      error: 'Event can only be linked to one resource (assignment, homework, or target)',
    };
  }

  return { success: true };
}

/**
 * Validate date range for queries
 */
export function validateQueryDateRange(startDate?: string, endDate?: string): ValidationResult {
  if (!startDate && !endDate) {
    return { success: true }; // No date filter is valid
  }

  if (startDate && endDate) {
    if (!isValidDateRange(startDate, endDate)) {
      return {
        success: false,
        error: 'Start date must be before or equal to end date',
      };
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffMs = end.getTime() - start.getTime();
    const diffDays = diffMs / (1000 * 60 * 60 * 24);

    // Don't allow date ranges longer than 2 years
    if (diffDays > EVENT_CONSTANTS.MAX_DATE_RANGE_DAYS) {
      return {
        success: false,
        error: `Date range cannot exceed ${EVENT_CONSTANTS.MAX_DATE_RANGE_DAYS} days`,
      };
    }
  }

  return { success: true };
}

/**
 * Validate pagination parameters
 */
export function validatePagination(limit?: number, offset?: number): ValidationResult {
  if (limit !== undefined) {
    if (limit < 1 || limit > EVENT_CONSTANTS.MAX_PAGINATION_LIMIT) {
      return {
        success: false,
        error: `Limit must be between 1 and ${EVENT_CONSTANTS.MAX_PAGINATION_LIMIT}`,
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

// ============================================================================
// Permission Validators
// ============================================================================

export interface UserContext {
  userId: string;
  userRole: 'owner' | 'admin' | 'teacher' | 'student' | 'parent';
  schoolId: string;
}

/**
 * Check if user can create events
 * Teachers, admins, and owners can create events
 */
export function canCreateEvent(context: UserContext, targetSchoolId: string): boolean {
  // Must be same school
  if (context.schoolId !== targetSchoolId) {
    return false;
  }

  // Teachers, admins, and owners can create events
  return ['owner', 'admin', 'teacher'].includes(context.userRole);
}

/**
 * Check if user can view events
 * All users can view events in their school
 * Students can only view events for their classes
 */
export function canViewEvents(context: UserContext, targetSchoolId: string): boolean {
  // Must be same school
  return context.schoolId === targetSchoolId;
}

/**
 * Check if user can update event
 * Event creator, admins, and owners can update
 */
export function canUpdateEvent(
  context: UserContext,
  eventCreatorId: string,
  eventSchoolId: string
): boolean {
  // Must be same school
  if (context.schoolId !== eventSchoolId) {
    return false;
  }

  // Event creator can update
  if (context.userId === eventCreatorId) {
    return true;
  }

  // Admins and owners can update any event
  return ['owner', 'admin'].includes(context.userRole);
}

/**
 * Check if user can delete event
 * Event creator, admins, and owners can delete
 */
export function canDeleteEvent(
  context: UserContext,
  eventCreatorId: string,
  eventSchoolId: string
): boolean {
  // Same rules as update
  return canUpdateEvent(context, eventCreatorId, eventSchoolId);
}

/**
 * Check if user can export iCal
 * All users can export their school's calendar
 */
export function canExportIcal(context: UserContext, targetSchoolId: string): boolean {
  return context.schoolId === targetSchoolId;
}

// ============================================================================
// Combined Validation Functions
// ============================================================================

/**
 * Validate CreateEventRequest
 */
export function validateCreateEventRequest(
  data: unknown
): ValidationResult<CreateEventRequest> {
  // 1. Schema validation
  const schemaResult = createEventRequestSchema.safeParse(data);
  if (!schemaResult.success) {
    return {
      success: false,
      error: 'Request validation failed',
      errors: schemaResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  const validatedData = schemaResult.data as CreateEventRequest;

  // 2. Date range validation
  const dateRangeValidation = validateEventDateRange(
    validatedData.start_date,
    validatedData.end_date
  );
  if (!dateRangeValidation.success) {
    return dateRangeValidation;
  }

  // 3. Recurrence validation
  const recurrenceValidation = validateRecurrenceRuleComplete(
    validatedData.is_recurring || false,
    validatedData.recurrence_rule
  );
  if (!recurrenceValidation.success) {
    return recurrenceValidation;
  }

  // 4. Linked resources validation
  const linkedResourcesValidation = validateLinkedResources(
    validatedData.assignment_id,
    validatedData.homework_id,
    validatedData.target_id
  );
  if (!linkedResourcesValidation.success) {
    return linkedResourcesValidation;
  }

  return {
    success: true,
    data: validatedData,
  };
}

/**
 * Validate UpdateEventRequest
 */
export function validateUpdateEventRequest(
  data: unknown
): ValidationResult<UpdateEventRequest> {
  // 1. Schema validation
  const schemaResult = updateEventRequestSchema.safeParse(data);
  if (!schemaResult.success) {
    return {
      success: false,
      error: 'Request validation failed',
      errors: schemaResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  const validatedData = schemaResult.data as UpdateEventRequest;

  // 2. Date range validation (if both dates provided)
  if (validatedData.start_date && validatedData.end_date) {
    const dateRangeValidation = validateEventDateRange(
      validatedData.start_date,
      validatedData.end_date
    );
    if (!dateRangeValidation.success) {
      return dateRangeValidation;
    }
  }

  // 3. Ensure at least one field is being updated
  const hasUpdate = Object.values(validatedData).some((value) => value !== undefined);
  if (!hasUpdate) {
    return {
      success: false,
      error: 'At least one field must be provided for update',
    };
  }

  return {
    success: true,
    data: validatedData,
  };
}

/**
 * Validate ListEventsRequest
 */
export function validateListEventsRequest(data: unknown): ValidationResult<ListEventsRequest> {
  // 1. Schema validation
  const schemaResult = listEventsRequestSchema.safeParse(data);
  if (!schemaResult.success) {
    return {
      success: false,
      error: 'Request validation failed',
      errors: schemaResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  const validatedData = schemaResult.data as ListEventsRequest;

  // 2. Date range validation
  const dateRangeValidation = validateQueryDateRange(
    validatedData.start_date,
    validatedData.end_date
  );
  if (!dateRangeValidation.success) {
    return dateRangeValidation;
  }

  // 3. Pagination validation
  const paginationValidation = validatePagination(validatedData.limit, validatedData.offset);
  if (!paginationValidation.success) {
    return paginationValidation;
  }

  return {
    success: true,
    data: validatedData,
  };
}

/**
 * Validate DeleteEventRequest
 */
export function validateDeleteEventRequest(
  data: unknown
): ValidationResult<DeleteEventRequest> {
  const schemaResult = deleteEventRequestSchema.safeParse(data);
  if (!schemaResult.success) {
    return {
      success: false,
      error: 'Request validation failed',
      errors: schemaResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  return {
    success: true,
    data: schemaResult.data as DeleteEventRequest,
  };
}

/**
 * Validate ICalExportRequest
 */
export function validateICalExportRequest(data: unknown): ValidationResult<ICalExportRequest> {
  // 1. Schema validation
  const schemaResult = iCalExportRequestSchema.safeParse(data);
  if (!schemaResult.success) {
    return {
      success: false,
      error: 'Request validation failed',
      errors: schemaResult.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`),
    };
  }

  const validatedData = schemaResult.data as ICalExportRequest;

  // 2. Date range validation
  const dateRangeValidation = validateQueryDateRange(
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
