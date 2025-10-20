/**
 * Mastery Tracking Type Definitions
 *
 * Created: 2025-10-20
 * Purpose: Complete type system for per-ayah mastery tracking
 * Features: 4 mastery levels, heatmap generation, progress tracking, auto-update
 */

// ============================================================================
// Database Row Types
// ============================================================================

export type MasteryLevel = 'unknown' | 'learning' | 'proficient' | 'mastered';

export interface AyahMasteryRow {
  id: string;
  student_id: string;
  script_id: string;
  ayah_id: string;
  level: MasteryLevel;
  last_updated: string;
}

export interface QuranAyahRow {
  id: string;
  script_id: string;
  surah: number;
  ayah: number;
  text: string;
  token_positions: Record<string, unknown> | null;
}

export interface QuranScriptRow {
  id: string;
  code: string; // e.g., 'uthmani-hafs', 'warsh'
  display_name: string;
}

// ============================================================================
// Enhanced Types with Relations
// ============================================================================

export interface AyahMasteryWithDetails extends AyahMasteryRow {
  student?: {
    id: string;
    display_name: string;
    email: string;
  };
  script?: {
    id: string;
    code: string;
    display_name: string;
  };
  ayah?: {
    id: string;
    surah: number;
    ayah: number;
    text: string;
  };
}

export interface SurahMasteryData {
  surah: number;
  surah_name?: string;
  total_ayahs: number;
  mastery_by_ayah: AyahMasteryEntry[];
  summary: MasterySummary;
}

export interface AyahMasteryEntry {
  ayah_number: number;
  ayah_id: string;
  level: MasteryLevel;
  last_updated: string;
  ayah_text?: string;
}

export interface MasterySummary {
  unknown_count: number;
  learning_count: number;
  proficient_count: number;
  mastered_count: number;
  total_count: number;
  unknown_percentage: number;
  learning_percentage: number;
  proficient_percentage: number;
  mastered_percentage: number;
  overall_progress_percentage: number; // (proficient + mastered) / total * 100
}

export interface StudentMasteryOverview {
  student_id: string;
  student_name: string;
  script_id: string;
  script_code: string;
  total_ayahs_tracked: number;
  mastery_summary: MasterySummary;
  recent_updates: AyahMasteryWithDetails[];
  surahs_progress: SurahProgress[];
}

export interface SurahProgress {
  surah: number;
  surah_name?: string;
  total_ayahs: number;
  mastered_count: number;
  proficient_count: number;
  learning_count: number;
  unknown_count: number;
  completion_percentage: number; // (mastered + proficient) / total * 100
}

export interface ClassMasteryOverview {
  class_id: string;
  class_name: string;
  student_count: number;
  students: StudentMasterySummary[];
  class_average: MasterySummary;
}

export interface StudentMasterySummary {
  student_id: string;
  student_name: string;
  mastery_summary: MasterySummary;
  recent_progress: {
    last_week_updates: number;
    improvements: number; // count of level increases
  };
}

// ============================================================================
// API Request Types
// ============================================================================

export interface UpsertMasteryRequest {
  student_id: string;
  script_id: string;
  ayah_id: string;
  level: MasteryLevel;
}

export interface BulkUpsertMasteryRequest {
  student_id: string;
  script_id: string;
  updates: {
    ayah_id: string;
    level: MasteryLevel;
  }[];
}

export interface AutoUpdateMasteryRequest {
  student_id: string;
  assignment_id: string;
  new_level?: MasteryLevel; // If not provided, auto-calculate based on grade
}

export interface GetStudentMasteryRequest {
  student_id: string;
  script_id?: string; // Optional: filter by script
  surah?: number; // Optional: filter by surah
}

export interface GetHeatmapRequest {
  student_id: string;
  surah: number;
  script_id?: string; // Optional: default to school's default script
}

export interface GetClassMasteryRequest {
  class_id: string;
  script_id?: string;
  surah?: number; // Optional: filter by surah
}

// ============================================================================
// API Response Types
// ============================================================================

export interface UpsertMasteryResponse {
  success: true;
  data: {
    mastery: AyahMasteryWithDetails;
    previous_level?: MasteryLevel;
    improved: boolean;
  };
  message: string;
}

export interface BulkUpsertMasteryResponse {
  success: true;
  data: {
    updated_count: number;
    masteries: AyahMasteryWithDetails[];
    summary: MasterySummary;
  };
  message: string;
}

export interface GetStudentMasteryResponse {
  success: true;
  data: StudentMasteryOverview;
}

export interface GetHeatmapResponse {
  success: true;
  data: SurahMasteryData;
}

export interface GetClassMasteryResponse {
  success: true;
  data: ClassMasteryOverview;
}

export interface MasteryErrorResponse {
  success: false;
  error: string;
  code: MasteryErrorCode;
  details?: Record<string, unknown>;
}

export type MasteryErrorCode =
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'INVALID_LEVEL'
  | 'DATABASE_ERROR'
  | 'INTERNAL_ERROR'
  | 'STUDENT_NOT_FOUND'
  | 'AYAH_NOT_FOUND'
  | 'SCRIPT_NOT_FOUND';

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Calculate mastery summary from array of mastery entries
 */
export function calculateMasterySummary(
  entries: Array<{ level: MasteryLevel }>
): MasterySummary {
  const total = entries.length;
  if (total === 0) {
    return {
      unknown_count: 0,
      learning_count: 0,
      proficient_count: 0,
      mastered_count: 0,
      total_count: 0,
      unknown_percentage: 0,
      learning_percentage: 0,
      proficient_percentage: 0,
      mastered_percentage: 0,
      overall_progress_percentage: 0,
    };
  }

  const unknown = entries.filter((e) => e.level === 'unknown').length;
  const learning = entries.filter((e) => e.level === 'learning').length;
  const proficient = entries.filter((e) => e.level === 'proficient').length;
  const mastered = entries.filter((e) => e.level === 'mastered').length;

  return {
    unknown_count: unknown,
    learning_count: learning,
    proficient_count: proficient,
    mastered_count: mastered,
    total_count: total,
    unknown_percentage: Math.round((unknown / total) * 100 * 100) / 100,
    learning_percentage: Math.round((learning / total) * 100 * 100) / 100,
    proficient_percentage: Math.round((proficient / total) * 100 * 100) / 100,
    mastered_percentage: Math.round((mastered / total) * 100 * 100) / 100,
    overall_progress_percentage:
      Math.round(((proficient + mastered) / total) * 100 * 100) / 100,
  };
}

/**
 * Get mastery level color for UI
 */
export function getMasteryLevelColor(level: MasteryLevel): string {
  const colors: Record<MasteryLevel, string> = {
    unknown: '#9CA3AF', // gray-400
    learning: '#FCD34D', // yellow-300
    proficient: '#FB923C', // orange-400
    mastered: '#34D399', // green-400
  };
  return colors[level];
}

/**
 * Get mastery level label
 */
export function getMasteryLevelLabel(level: MasteryLevel): string {
  const labels: Record<MasteryLevel, string> = {
    unknown: 'Unknown',
    learning: 'Learning',
    proficient: 'Proficient',
    mastered: 'Mastered',
  };
  return labels[level];
}

/**
 * Get mastery level from numeric score (0-100)
 * Used for auto-update based on assignment grades
 */
export function getMasteryLevelFromScore(score: number): MasteryLevel {
  if (score >= 90) return 'mastered';
  if (score >= 75) return 'proficient';
  if (score >= 60) return 'learning';
  return 'unknown';
}

/**
 * Check if mastery level is an improvement
 */
export function isMasteryImprovement(
  oldLevel: MasteryLevel,
  newLevel: MasteryLevel
): boolean {
  const levelOrder: Record<MasteryLevel, number> = {
    unknown: 0,
    learning: 1,
    proficient: 2,
    mastered: 3,
  };
  return levelOrder[newLevel] > levelOrder[oldLevel];
}

/**
 * Validate mastery level is valid
 */
export function isValidMasteryLevel(level: string): level is MasteryLevel {
  return ['unknown', 'learning', 'proficient', 'mastered'].includes(level);
}

/**
 * Sort surah progress by completion percentage (descending)
 */
export function sortSurahsByProgress(
  surahs: SurahProgress[]
): SurahProgress[] {
  return [...surahs].sort(
    (a, b) => b.completion_percentage - a.completion_percentage
  );
}

/**
 * Get top performing students in class
 */
export function getTopStudents(
  students: StudentMasterySummary[],
  limit: number = 5
): StudentMasterySummary[] {
  return [...students]
    .sort(
      (a, b) =>
        b.mastery_summary.overall_progress_percentage -
        a.mastery_summary.overall_progress_percentage
    )
    .slice(0, limit);
}

/**
 * Calculate average mastery across multiple students
 */
export function calculateClassAverageMastery(
  students: Array<{ mastery_summary: MasterySummary }>
): MasterySummary {
  if (students.length === 0) {
    return {
      unknown_count: 0,
      learning_count: 0,
      proficient_count: 0,
      mastered_count: 0,
      total_count: 0,
      unknown_percentage: 0,
      learning_percentage: 0,
      proficient_percentage: 0,
      mastered_percentage: 0,
      overall_progress_percentage: 0,
    };
  }

  const totalUnknown = students.reduce(
    (sum, s) => sum + s.mastery_summary.unknown_count,
    0
  );
  const totalLearning = students.reduce(
    (sum, s) => sum + s.mastery_summary.learning_count,
    0
  );
  const totalProficient = students.reduce(
    (sum, s) => sum + s.mastery_summary.proficient_count,
    0
  );
  const totalMastered = students.reduce(
    (sum, s) => sum + s.mastery_summary.mastered_count,
    0
  );
  const totalCount =
    totalUnknown + totalLearning + totalProficient + totalMastered;

  if (totalCount === 0) {
    return {
      unknown_count: 0,
      learning_count: 0,
      proficient_count: 0,
      mastered_count: 0,
      total_count: 0,
      unknown_percentage: 0,
      learning_percentage: 0,
      proficient_percentage: 0,
      mastered_percentage: 0,
      overall_progress_percentage: 0,
    };
  }

  return {
    unknown_count: totalUnknown,
    learning_count: totalLearning,
    proficient_count: totalProficient,
    mastered_count: totalMastered,
    total_count: totalCount,
    unknown_percentage: Math.round((totalUnknown / totalCount) * 100 * 100) / 100,
    learning_percentage: Math.round((totalLearning / totalCount) * 100 * 100) / 100,
    proficient_percentage: Math.round((totalProficient / totalCount) * 100 * 100) / 100,
    mastered_percentage: Math.round((totalMastered / totalCount) * 100 * 100) / 100,
    overall_progress_percentage:
      Math.round(((totalProficient + totalMastered) / totalCount) * 100 * 100) / 100,
  };
}

// ============================================================================
// Constants
// ============================================================================

export const MASTERY_CONSTANTS = {
  MASTERY_LEVELS: ['unknown', 'learning', 'proficient', 'mastered'] as const,
  SCORE_THRESHOLDS: {
    MASTERED: 90,
    PROFICIENT: 75,
    LEARNING: 60,
  },
  LEVEL_ORDER: {
    unknown: 0,
    learning: 1,
    proficient: 2,
    mastered: 3,
  },
  COLORS: {
    unknown: '#9CA3AF',
    learning: '#FCD34D',
    proficient: '#FB923C',
    mastered: '#34D399',
  },
  TOTAL_QURAN_AYAHS: 6236,
  TOTAL_SURAHS: 114,
  DEFAULT_SCRIPT: 'uthmani-hafs',
} as const;

export const SURAH_INFO: Record<
  number,
  { name_arabic: string; name_english: string; ayah_count: number }
> = {
  1: { name_arabic: 'الفاتحة', name_english: 'Al-Fatiha', ayah_count: 7 },
  2: { name_arabic: 'البقرة', name_english: 'Al-Baqarah', ayah_count: 286 },
  3: { name_arabic: 'آل عمران', name_english: 'Ali \'Imran', ayah_count: 200 },
  4: { name_arabic: 'النساء', name_english: 'An-Nisa', ayah_count: 176 },
  5: { name_arabic: 'المائدة', name_english: 'Al-Ma\'idah', ayah_count: 120 },
  // Add remaining surahs as needed...
};

/**
 * Get ayah count for a surah
 */
export function getAyahCount(surah: number): number {
  return SURAH_INFO[surah]?.ayah_count || 0;
}

/**
 * Get surah name (Arabic)
 */
export function getSurahName(surah: number): string {
  return SURAH_INFO[surah]?.name_arabic || `Surah ${surah}`;
}
