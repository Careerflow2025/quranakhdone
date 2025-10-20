/**
 * Homework Type Definitions and Utilities
 * Created: 2025-10-20
 * Purpose: Homework system using highlights table with green→gold color transition
 * Note: Homework is a specialized use of the highlights table where:
 *   - color='green' represents active homework
 *   - color='gold' represents completed homework
 *   - Green highlights are created by teachers as homework assignments
 *   - Students complete homework by practicing, turning green→gold
 */

import { Database } from '../database.types';

// ============================================================================
// BASE TYPES FROM DATABASE
// ============================================================================

export type HighlightRow = Database['public']['Tables']['highlights']['Row'];
export type HighlightInsert = Database['public']['Tables']['highlights']['Insert'];
export type HighlightUpdate = Database['public']['Tables']['highlights']['Update'];

// Homework-specific color types (subset of highlight colors)
export type HomeworkColor = 'green' | 'gold';
export type HomeworkStatus = 'pending' | 'completed';

// ============================================================================
// HOMEWORK TYPES (Extensions of Highlights)
// ============================================================================

/**
 * Homework is a highlight with color='green' or 'gold'
 */
export interface Homework extends Omit<HighlightRow, 'color'> {
  color: HomeworkColor;
  // Computed fields
  status: HomeworkStatus; // derived from color
  is_overdue?: boolean;
  completion_percentage?: number;
}

/**
 * Homework with related data for display
 */
export interface HomeworkWithDetails extends Homework {
  // Student info
  student: {
    id: string;
    display_name: string;
    email: string;
  };

  // Teacher who assigned
  teacher?: {
    id: string;
    display_name: string;
    email: string;
  };

  // Teacher who completed (if different)
  completed_by_teacher?: {
    id: string;
    display_name: string;
  };

  // Notes/replies on this homework
  notes?: Array<{
    id: string;
    teacher_id: string | null;
    teacher_name?: string;
    text: string | null;
    audio_url: string | null;
    type: 'text' | 'audio';
    created_at: string;
  }>;

  // Ayah text for reference
  ayah_text?: string;
}

// ============================================================================
// API REQUEST TYPES
// ============================================================================

/**
 * POST /api/homework - Create new homework (green highlight)
 */
export interface CreateHomeworkRequest {
  student_id: string;
  surah: number; // 1-114
  ayah_start: number;
  ayah_end: number;
  page_number?: number;
  note?: string; // Teacher's initial note/instructions
  type?: string; // Type of practice required (e.g., 'memorization', 'revision', 'tajweed')
}

export interface CreateHomeworkResponse {
  success: true;
  homework: Homework;
  message: string;
}

/**
 * GET /api/homework - List homework with filters
 */
export interface ListHomeworkQuery {
  student_id?: string;
  teacher_id?: string;
  status?: HomeworkStatus;
  surah?: number;
  page_number?: number;
  include_completed?: boolean; // Default false (only pending)
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'surah' | 'ayah_start';
  sort_order?: 'asc' | 'desc';
}

export interface ListHomeworkResponse {
  success: true;
  homework: HomeworkWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}

/**
 * GET /api/homework/:id - Get single homework
 */
export interface GetHomeworkResponse {
  success: true;
  homework: HomeworkWithDetails;
}

/**
 * PATCH /api/homework/:id/complete - Complete homework (green → gold)
 */
export interface CompleteHomeworkRequest {
  completed_by?: string; // user_id of teacher completing (optional)
  completion_note?: string; // Teacher's feedback
}

export interface CompleteHomeworkResponse {
  success: true;
  homework: Homework;
  message: string;
  previous_color: 'green';
  new_color: 'gold';
}

/**
 * POST /api/homework/:id/reply - Add note/reply to homework
 */
export interface AddHomeworkReplyRequest {
  type: 'text' | 'audio';
  text?: string;
  audio_url?: string; // URL from Supabase storage
}

export interface AddHomeworkReplyResponse {
  success: true;
  note: {
    id: string;
    text: string | null;
    audio_url: string | null;
    type: 'text' | 'audio';
    created_at: string;
  };
  message: string;
}

/**
 * GET /api/homework/student/:id - Get student's homework
 */
export interface GetStudentHomeworkResponse {
  success: true;
  pending_homework: HomeworkWithDetails[];
  completed_homework: HomeworkWithDetails[];
  stats: {
    total_pending: number;
    total_completed: number;
    completion_rate: number; // percentage
    total_ayahs_assigned: number;
    total_ayahs_completed: number;
  };
}

// ============================================================================
// ERROR RESPONSE TYPES
// ============================================================================

export interface HomeworkErrorResponse {
  success: false;
  error: string;
  code: HomeworkErrorCode;
  details?: Record<string, unknown>;
}

export type HomeworkErrorCode =
  | 'INVALID_REQUEST'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'ALREADY_COMPLETED'
  | 'NOT_HOMEWORK'
  | 'INVALID_SURAH'
  | 'INVALID_AYAH'
  | 'VALIDATION_ERROR'
  | 'DATABASE_ERROR'
  | 'INTERNAL_ERROR';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Converts highlight color to homework status
 */
export function getHomeworkStatus(color: HomeworkColor): HomeworkStatus {
  return color === 'green' ? 'pending' : 'completed';
}

/**
 * Validates if highlight is homework (green or gold)
 */
export function isHomework(highlight: HighlightRow): highlight is Homework {
  return highlight.color === 'green' || highlight.color === 'gold';
}

/**
 * Checks if homework can be completed
 */
export function canCompleteHomework(homework: Homework): boolean {
  return homework.color === 'green' && !homework.completed_at;
}

/**
 * Validates surah number (1-114)
 */
export function isValidSurah(surah: number): boolean {
  return Number.isInteger(surah) && surah >= 1 && surah <= 114;
}

/**
 * Validates ayah range
 */
export function isValidAyahRange(surah: number, ayah_start: number, ayah_end: number): boolean {
  // Simplified validation - would need actual ayah count per surah
  return (
    ayah_start >= 1 &&
    ayah_end >= ayah_start &&
    ayah_end <= 286 // Maximum ayahs in any surah (Al-Baqarah)
  );
}

/**
 * Calculates homework completion rate for a student
 */
export function calculateCompletionRate(
  total_homework: number,
  completed_homework: number
): number {
  if (total_homework === 0) return 0;
  return Math.round((completed_homework / total_homework) * 100);
}

/**
 * Counts total ayahs in homework list
 */
export function countTotalAyahs(homeworkList: Homework[]): number {
  return homeworkList.reduce((total, hw) => {
    return total + (hw.ayah_end - hw.ayah_start + 1);
  }, 0);
}

/**
 * Groups homework by surah
 */
export function groupHomeworkBySurah(
  homeworkList: HomeworkWithDetails[]
): Record<number, HomeworkWithDetails[]> {
  return homeworkList.reduce((groups, hw) => {
    if (!groups[hw.surah]) {
      groups[hw.surah] = [];
    }
    groups[hw.surah].push(hw);
    return groups;
  }, {} as Record<number, HomeworkWithDetails[]>);
}

/**
 * Gets next ayah number for homework continuation
 */
export function getNextAyah(currentHomework: Homework): {
  surah: number;
  ayah: number;
} {
  return {
    surah: currentHomework.surah,
    ayah: currentHomework.ayah_end + 1,
  };
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const HOMEWORK_CONSTANTS = {
  MAX_NOTE_LENGTH: 2000,
  MAX_AYAH_RANGE: 10, // Maximum ayahs per homework assignment
  DEFAULT_PAGINATION_LIMIT: 20,
  MAX_PAGINATION_LIMIT: 100,
  HOMEWORK_TYPES: [
    'memorization',
    'revision',
    'tajweed',
    'recitation',
    'fluency',
  ] as const,
} as const;

// Surah names for display (simplified - can be expanded)
export const SURAH_NAMES: Record<number, { arabic: string; transliteration: string }> = {
  1: { arabic: 'الفاتحة', transliteration: 'Al-Fatihah' },
  2: { arabic: 'البقرة', transliteration: 'Al-Baqarah' },
  3: { arabic: 'آل عمران', transliteration: 'Ali \'Imran' },
  4: { arabic: 'النساء', transliteration: 'An-Nisa\'' },
  5: { arabic: 'المائدة', transliteration: 'Al-Ma\'idah' },
  // ... would include all 114 surahs in production
  114: { arabic: 'الناس', transliteration: 'An-Nas' },
};

// Homework status configuration
export const HOMEWORK_STATUS_CONFIG: Record<
  HomeworkStatus,
  {
    label: string;
    color: HomeworkColor;
    icon: string;
    description: string;
  }
> = {
  pending: {
    label: 'Pending',
    color: 'green',
    icon: '📗',
    description: 'Active homework - needs to be completed',
  },
  completed: {
    label: 'Completed',
    color: 'gold',
    icon: '✨',
    description: 'Homework completed successfully',
  },
};

// Homework type configuration
export const HOMEWORK_TYPE_CONFIG: Record<
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
    description: 'New ayahs to memorize',
  },
  revision: {
    label: 'Revision',
    icon: '🔄',
    description: 'Previously memorized ayahs to revise',
  },
  tajweed: {
    label: 'Tajweed',
    icon: '📖',
    description: 'Focus on proper tajweed rules',
  },
  recitation: {
    label: 'Recitation',
    icon: '🎤',
    description: 'Practice recitation fluency',
  },
  fluency: {
    label: 'Fluency',
    icon: '⚡',
    description: 'Improve reading speed and flow',
  },
};
