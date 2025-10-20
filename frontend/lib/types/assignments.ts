/**
 * Assignment Type Definitions and Utilities
 * Created: 2025-10-20
 * Purpose: Comprehensive type system for assignment lifecycle management
 * Based on: database.types.ts assignments table schema
 */

import { Database } from '../database.types';

// ============================================================================
// BASE TYPES FROM DATABASE
// ============================================================================

export type AssignmentRow = Database['public']['Tables']['assignments']['Row'];
export type AssignmentInsert = Database['public']['Tables']['assignments']['Insert'];
export type AssignmentUpdate = Database['public']['Tables']['assignments']['Update'];

// Assignment status enum - matches database enum
export type AssignmentStatus =
  | 'assigned'
  | 'viewed'
  | 'submitted'
  | 'reviewed'
  | 'completed'
  | 'reopened';

// Valid status transitions - enforces lifecycle rules
export const VALID_TRANSITIONS: Record<AssignmentStatus, AssignmentStatus[]> = {
  assigned: ['viewed'],
  viewed: ['submitted'],
  submitted: ['reviewed'],
  reviewed: ['completed'],
  completed: ['reopened'],
  reopened: ['submitted'], // Can resubmit when reopened
};

// ============================================================================
// API REQUEST TYPES
// ============================================================================

/**
 * POST /api/assignments - Create new assignment
 */
export interface CreateAssignmentRequest {
  student_id: string;
  title: string;
  description?: string;
  due_at: string; // ISO 8601 timestamp
  highlight_refs?: string[]; // Optional Quran highlight references
  attachments?: string[]; // Optional attachment URLs
}

export interface CreateAssignmentResponse {
  success: true;
  assignment: AssignmentRow;
  message: string;
}

/**
 * GET /api/assignments - List assignments with filters
 */
export interface ListAssignmentsQuery {
  student_id?: string;
  teacher_id?: string;
  status?: AssignmentStatus | AssignmentStatus[];
  late_only?: boolean;
  due_before?: string; // ISO 8601 timestamp
  due_after?: string; // ISO 8601 timestamp
  page?: number;
  limit?: number;
  sort_by?: 'due_at' | 'created_at' | 'status';
  sort_order?: 'asc' | 'desc';
}

export interface ListAssignmentsResponse {
  success: true;
  assignments: AssignmentWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * GET /api/assignments/:id - Get single assignment
 */
export interface GetAssignmentResponse {
  success: true;
  assignment: AssignmentWithDetails;
}

/**
 * POST /api/assignments/:id/transition - Change assignment status
 */
export interface TransitionAssignmentRequest {
  to_status: AssignmentStatus;
  reason?: string; // Optional reason for transition (especially for reopening)
}

export interface TransitionAssignmentResponse {
  success: true;
  assignment: AssignmentRow;
  event_id: string; // ID of the assignment_events record created
  message: string;
}

/**
 * POST /api/assignments/:id/submit - Student submits assignment
 */
export interface SubmitAssignmentRequest {
  text?: string;
  attachments?: string[]; // Array of attachment URLs from storage
}

export interface SubmitAssignmentResponse {
  success: true;
  assignment: AssignmentRow;
  submission_id: string;
  message: string;
}

/**
 * POST /api/assignments/:id/reopen - Reopen completed assignment
 */
export interface ReopenAssignmentRequest {
  reason?: string;
}

export interface ReopenAssignmentResponse {
  success: true;
  assignment: AssignmentRow;
  message: string;
  reopen_count: number;
}

/**
 * PATCH /api/assignments/:id - Update assignment
 */
export interface UpdateAssignmentRequest {
  title?: string;
  description?: string;
  due_at?: string;
}

export interface UpdateAssignmentResponse {
  success: true;
  assignment: AssignmentRow;
  message: string;
}

/**
 * DELETE /api/assignments/:id - Delete assignment
 */
export interface DeleteAssignmentResponse {
  success: true;
  message: string;
  deleted_id: string;
}

// ============================================================================
// EXTENDED TYPES WITH RELATIONS
// ============================================================================

/**
 * Assignment with all related data for display
 */
export interface AssignmentWithDetails extends AssignmentRow {
  // Student info
  student: {
    id: string;
    display_name: string;
    email: string;
  };

  // Teacher info
  teacher: {
    id: string;
    display_name: string;
    email: string;
  };

  // Submission info (if exists)
  submission?: {
    id: string;
    text: string | null;
    created_at: string;
    attachments: Array<{
      id: string;
      url: string;
      mime_type: string;
    }>;
  };

  // Grades (if reviewed/completed)
  grades?: Array<{
    id: string;
    criterion_id: string;
    criterion_name: string;
    score: number;
    max_score: number;
  }>;

  // Event history
  events?: Array<{
    id: string;
    event_type: string;
    from_status: AssignmentStatus | null;
    to_status: AssignmentStatus | null;
    actor_name: string;
    created_at: string;
  }>;

  // Computed fields
  is_overdue: boolean;
  time_remaining?: string; // Human-readable time until due
  completion_percentage?: number;
}

// ============================================================================
// VALIDATION HELPERS
// ============================================================================

/**
 * Validates if a status transition is allowed
 */
export function isValidTransition(
  from: AssignmentStatus,
  to: AssignmentStatus
): boolean {
  return VALID_TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Gets all valid next statuses for current status
 */
export function getValidNextStatuses(
  current: AssignmentStatus
): AssignmentStatus[] {
  return VALID_TRANSITIONS[current] ?? [];
}

/**
 * Checks if assignment is late
 */
export function isAssignmentLate(
  due_at: string,
  status: AssignmentStatus
): boolean {
  if (status === 'completed') return false;
  return new Date(due_at) < new Date();
}

/**
 * Calculates time remaining until due date
 */
export function getTimeRemaining(due_at: string): {
  isPast: boolean;
  days: number;
  hours: number;
  minutes: number;
  formatted: string;
} {
  const now = new Date();
  const dueDate = new Date(due_at);
  const diffMs = dueDate.getTime() - now.getTime();
  const isPast = diffMs < 0;
  const absDiff = Math.abs(diffMs);

  const days = Math.floor(absDiff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));

  let formatted: string;
  if (days > 0) {
    formatted = `${days}d ${hours}h`;
  } else if (hours > 0) {
    formatted = `${hours}h ${minutes}m`;
  } else {
    formatted = `${minutes}m`;
  }

  if (isPast) {
    formatted = `${formatted} overdue`;
  }

  return { isPast, days, hours, minutes, formatted };
}

/**
 * Validates assignment creation request
 */
export function validateCreateAssignment(
  request: CreateAssignmentRequest
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!request.student_id || request.student_id.trim() === '') {
    errors.push('student_id is required');
  }

  if (!request.title || request.title.trim() === '') {
    errors.push('title is required');
  }

  if (request.title && request.title.length > 200) {
    errors.push('title must be 200 characters or less');
  }

  if (!request.due_at) {
    errors.push('due_at is required');
  } else {
    const dueDate = new Date(request.due_at);
    if (isNaN(dueDate.getTime())) {
      errors.push('due_at must be a valid ISO 8601 timestamp');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

/**
 * Validates assignment update request
 */
export function validateUpdateAssignment(
  request: UpdateAssignmentRequest
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (request.title !== undefined) {
    if (request.title.trim() === '') {
      errors.push('title cannot be empty');
    }
    if (request.title.length > 200) {
      errors.push('title must be 200 characters or less');
    }
  }

  if (request.due_at !== undefined) {
    const dueDate = new Date(request.due_at);
    if (isNaN(dueDate.getTime())) {
      errors.push('due_at must be a valid ISO 8601 timestamp');
    }
  }

  return {
    valid: errors.length === 0,
    errors
  };
}

// ============================================================================
// ERROR RESPONSE TYPES
// ============================================================================

export interface AssignmentErrorResponse {
  success: false;
  error: string;
  code: AssignmentErrorCode;
  details?: Record<string, unknown>;
}

export type AssignmentErrorCode =
  | 'INVALID_REQUEST'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'INVALID_TRANSITION'
  | 'ALREADY_SUBMITTED'
  | 'NOT_SUBMITTED'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'INTERNAL_ERROR';

// ============================================================================
// FILTER AND SORT UTILITIES
// ============================================================================

/**
 * Assignment filter builder for constructing Supabase queries
 */
export interface AssignmentFilters {
  student_ids?: string[];
  teacher_ids?: string[];
  statuses?: AssignmentStatus[];
  late_only?: boolean;
  due_before?: Date;
  due_after?: Date;
  school_id: string; // Always required for RLS
}

/**
 * Sort configuration
 */
export interface AssignmentSort {
  field: 'due_at' | 'created_at' | 'status' | 'title';
  order: 'asc' | 'desc';
}

// ============================================================================
// REMINDER CONFIGURATION
// ============================================================================

export interface AssignmentReminder {
  type: '24h_before' | 'on_due' | '24h_after';
  assignment_id: string;
  student_id: string;
  due_at: string;
  channels: Array<'in_app' | 'email' | 'push'>;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const ASSIGNMENT_CONSTANTS = {
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 5000,
  MAX_REOPEN_COUNT: 10, // Maximum times an assignment can be reopened
  PAGINATION_DEFAULT_LIMIT: 20,
  PAGINATION_MAX_LIMIT: 100,
} as const;

// Status display configurations
export const STATUS_CONFIG: Record<AssignmentStatus, {
  label: string;
  color: string;
  icon: string;
}> = {
  assigned: {
    label: 'Assigned',
    color: 'blue',
    icon: '📋'
  },
  viewed: {
    label: 'Viewed',
    color: 'purple',
    icon: '👁️'
  },
  submitted: {
    label: 'Submitted',
    color: 'yellow',
    icon: '📤'
  },
  reviewed: {
    label: 'Reviewed',
    color: 'orange',
    icon: '🔍'
  },
  completed: {
    label: 'Completed',
    color: 'green',
    icon: '✅'
  },
  reopened: {
    label: 'Reopened',
    color: 'red',
    icon: '🔄'
  }
};
