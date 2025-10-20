/**
 * Targets Type Definitions and Utilities
 * Created: 2025-10-20
 * Purpose: Target system for student goals and progress tracking
 * Note: Targets can be individual, class-level, or school-wide
 *   - Individual: Personal student goals
 *   - Class: Shared goals for entire class
 *   - School: School-wide objectives
 */

import { Database } from '../database.types';

// ============================================================================
// BASE TYPES FROM DATABASE
// ============================================================================

export type TargetRow = Database['public']['Tables']['targets']['Row'];
export type TargetInsert = Database['public']['Tables']['targets']['Insert'];
export type TargetUpdate = Database['public']['Tables']['targets']['Update'];

// Target-specific types
export type TargetType = 'individual' | 'class' | 'school';
export type TargetStatus = 'active' | 'completed' | 'cancelled';

// ============================================================================
// MILESTONE TYPES
// ============================================================================

/**
 * Milestone definition
 * Can be stored as JSONB in targets table or separate table when available
 */
export interface Milestone {
  id: string;
  title: string;
  description?: string;
  target_value?: number; // e.g., 10 surahs, 50 pages
  current_value?: number; // Current progress
  completed: boolean;
  completed_at?: string;
  completed_by?: string; // user_id
  order: number; // Display/completion order
  created_at: string;
}

export interface CreateMilestoneRequest {
  title: string;
  description?: string;
  target_value?: number;
  order?: number;
}

export interface UpdateMilestoneProgressRequest {
  current_value: number;
}

// ============================================================================
// TARGET TYPES (Extensions)
// ============================================================================

/**
 * Target with computed fields
 */
export interface Target extends TargetRow {
  // Computed fields
  is_overdue?: boolean;
  progress_percentage?: number;
  days_remaining?: number;
  total_milestones?: number;
  completed_milestones?: number;
}

/**
 * Target with related data for display
 */
export interface TargetWithDetails extends Target {
  // Teacher who created
  teacher?: {
    id: string;
    display_name: string;
    email: string;
  };

  // For individual targets
  student?: {
    id: string;
    display_name: string;
    email: string;
  };

  // For class targets
  class?: {
    id: string;
    name: string;
    student_count: number;
  };

  // Milestones
  milestones: Milestone[];

  // Statistics
  stats?: {
    total_milestones: number;
    completed_milestones: number;
    progress_percentage: number;
    days_since_created: number;
    days_until_due?: number;
    is_overdue: boolean;
  };
}

// ============================================================================
// API REQUEST TYPES
// ============================================================================

/**
 * POST /api/targets - Create new target
 */
export interface CreateTargetRequest {
  title: string;
  description?: string;
  type: TargetType;
  category?: string; // e.g., 'memorization', 'tajweed', 'revision'

  // For individual targets
  student_id?: string;

  // For class targets
  class_id?: string;

  // Dates
  start_date?: string; // ISO 8601
  due_date?: string; // ISO 8601

  // Initial milestones (optional)
  milestones?: CreateMilestoneRequest[];
}

export interface CreateTargetResponse {
  success: true;
  target: TargetWithDetails;
  message: string;
}

/**
 * GET /api/targets - List targets with filters
 */
export interface ListTargetsQuery {
  student_id?: string;
  class_id?: string;
  teacher_id?: string;
  type?: TargetType;
  status?: TargetStatus;
  category?: string;
  include_completed?: boolean; // Default false (only active)
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'due_date' | 'title' | 'progress';
  sort_order?: 'asc' | 'desc';
}

export interface ListTargetsResponse {
  success: true;
  targets: TargetWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * GET /api/targets/:id - Get single target
 */
export interface GetTargetResponse {
  success: true;
  target: TargetWithDetails;
}

/**
 * PATCH /api/targets/:id/progress - Update target progress
 */
export interface UpdateTargetProgressRequest {
  progress_percentage?: number; // Manual progress update
  status?: TargetStatus; // Change status (e.g., complete, cancel)
  completed_by?: string; // user_id of completer
}

export interface UpdateTargetProgressResponse {
  success: true;
  target: Target;
  message: string;
  previous_progress?: number;
  new_progress?: number;
}

/**
 * POST /api/targets/:id/milestones - Add milestone
 */
export interface AddMilestoneRequest {
  title: string;
  description?: string;
  target_value?: number;
  order?: number;
}

export interface AddMilestoneResponse {
  success: true;
  milestone: Milestone;
  target_id: string;
  message: string;
}

/**
 * PATCH /api/targets/milestones/:id/complete - Complete milestone
 */
export interface CompleteMilestoneRequest {
  completed_by?: string; // user_id
  current_value?: number; // Final value if tracking progress
}

export interface CompleteMilestoneResponse {
  success: true;
  milestone: Milestone;
  target_id: string;
  message: string;
  target_progress_updated: boolean;
}

/**
 * DELETE /api/targets/:id - Delete target
 */
export interface DeleteTargetResponse {
  success: true;
  message: string;
  deleted_target_id: string;
}

// ============================================================================
// ERROR RESPONSE TYPES
// ============================================================================

export interface TargetErrorResponse {
  success: false;
  error: string;
  code: TargetErrorCode;
  details?: Record<string, unknown>;
}

export type TargetErrorCode =
  | 'INVALID_REQUEST'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'ALREADY_COMPLETED'
  | 'ALREADY_CANCELLED'
  | 'INVALID_TYPE'
  | 'INVALID_STATUS'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'INTERNAL_ERROR';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculates target progress based on milestones
 */
export function calculateTargetProgress(milestones: Milestone[]): number {
  if (milestones.length === 0) return 0;

  const completedCount = milestones.filter(m => m.completed).length;
  return Math.round((completedCount / milestones.length) * 100);
}

/**
 * Checks if target is overdue
 */
export function isTargetOverdue(target: Target): boolean {
  if (!target.due_date) return false;
  if (target.status === 'completed' || target.status === 'cancelled') return false;

  const now = new Date();
  const dueDate = new Date(target.due_date);
  return dueDate < now;
}

/**
 * Calculates days remaining until due date
 */
export function getDaysRemaining(due_date?: string | null): number | undefined {
  if (!due_date) return undefined;

  const now = new Date();
  const dueDate = new Date(due_date);
  const diffTime = dueDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Calculates days since target created
 */
export function getDaysSinceCreated(created_at: string): number {
  const now = new Date();
  const createdDate = new Date(created_at);
  const diffTime = now.getTime() - createdDate.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Validates target can be completed
 */
export function canCompleteTarget(target: Target): boolean {
  return target.status === 'active';
}

/**
 * Validates target can be cancelled
 */
export function canCancelTarget(target: Target): boolean {
  return target.status === 'active';
}

/**
 * Gets next milestone order number
 */
export function getNextMilestoneOrder(milestones: Milestone[]): number {
  if (milestones.length === 0) return 1;
  return Math.max(...milestones.map(m => m.order)) + 1;
}

/**
 * Groups targets by type
 */
export function groupTargetsByType(
  targets: TargetWithDetails[]
): Record<TargetType, TargetWithDetails[]> {
  return targets.reduce((groups, target) => {
    if (!groups[target.type]) {
      groups[target.type] = [];
    }
    groups[target.type].push(target);
    return groups;
  }, {} as Record<TargetType, TargetWithDetails[]>);
}

/**
 * Groups targets by status
 */
export function groupTargetsByStatus(
  targets: TargetWithDetails[]
): Record<TargetStatus, TargetWithDetails[]> {
  return targets.reduce((groups, target) => {
    if (!groups[target.status]) {
      groups[target.status] = [];
    }
    groups[target.status].push(target);
    return groups;
  }, {} as Record<TargetStatus, TargetWithDetails[]>);
}

/**
 * Filters overdue targets
 */
export function getOverdueTargets(targets: TargetWithDetails[]): TargetWithDetails[] {
  return targets.filter(target => isTargetOverdue(target));
}

/**
 * Filters targets by completion status
 */
export function getCompletedTargets(targets: TargetWithDetails[]): TargetWithDetails[] {
  return targets.filter(target => target.status === 'completed');
}

export function getActiveTargets(targets: TargetWithDetails[]): TargetWithDetails[] {
  return targets.filter(target => target.status === 'active');
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const TARGET_CONSTANTS = {
  MAX_TITLE_LENGTH: 200,
  MAX_DESCRIPTION_LENGTH: 2000,
  MAX_CATEGORY_LENGTH: 50,
  MAX_MILESTONES: 20,
  DEFAULT_PAGINATION_LIMIT: 20,
  MAX_PAGINATION_LIMIT: 100,

  CATEGORIES: [
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
  ] as const,
} as const;

// Target type configuration
export const TARGET_TYPE_CONFIG: Record<
  TargetType,
  {
    label: string;
    icon: string;
    description: string;
  }
> = {
  individual: {
    label: 'Individual',
    icon: '👤',
    description: 'Personal student goal',
  },
  class: {
    label: 'Class',
    icon: '👥',
    description: 'Shared goal for entire class',
  },
  school: {
    label: 'School',
    icon: '🏫',
    description: 'School-wide objective',
  },
};

// Target status configuration
export const TARGET_STATUS_CONFIG: Record<
  TargetStatus,
  {
    label: string;
    color: string;
    icon: string;
    description: string;
  }
> = {
  active: {
    label: 'Active',
    color: 'blue',
    icon: '🎯',
    description: 'Target is currently in progress',
  },
  completed: {
    label: 'Completed',
    color: 'green',
    icon: '✅',
    description: 'Target successfully achieved',
  },
  cancelled: {
    label: 'Cancelled',
    color: 'gray',
    icon: '❌',
    description: 'Target was cancelled before completion',
  },
};

// Category configuration
export const CATEGORY_CONFIG: Record<
  string,
  {
    label: string;
    icon: string;
    description: string;
  }
> = {
  memorization: {
    label: 'Memorization',
    icon: '🧠',
    description: 'New Quran memorization goals',
  },
  revision: {
    label: 'Revision',
    icon: '🔄',
    description: 'Review previously memorized content',
  },
  tajweed: {
    label: 'Tajweed',
    icon: '📖',
    description: 'Tajweed rules mastery',
  },
  recitation: {
    label: 'Recitation',
    icon: '🎤',
    description: 'Recitation fluency and quality',
  },
  fluency: {
    label: 'Fluency',
    icon: '⚡',
    description: 'Reading speed and flow',
  },
  quran_completion: {
    label: 'Quran Completion',
    icon: '📚',
    description: 'Complete portions of Quran',
  },
  surah_mastery: {
    label: 'Surah Mastery',
    icon: '⭐',
    description: 'Master specific surahs',
  },
  page_count: {
    label: 'Page Count',
    icon: '📄',
    description: 'Complete number of pages',
  },
  attendance: {
    label: 'Attendance',
    icon: '📅',
    description: 'Attendance goals',
  },
  behavior: {
    label: 'Behavior',
    icon: '🌟',
    description: 'Behavioral objectives',
  },
  other: {
    label: 'Other',
    icon: '📌',
    description: 'Other types of goals',
  },
};
