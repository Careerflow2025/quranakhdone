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
  1: { name_arabic: 'الفاتحة', name_english: 'Al-Fatihah', ayah_count: 7 },
  2: { name_arabic: 'البقرة', name_english: 'Al-Baqarah', ayah_count: 286 },
  3: { name_arabic: 'آل عمران', name_english: 'Ali \'Imran', ayah_count: 200 },
  4: { name_arabic: 'النساء', name_english: 'An-Nisa', ayah_count: 176 },
  5: { name_arabic: 'المائدة', name_english: 'Al-Ma\'idah', ayah_count: 120 },
  6: { name_arabic: 'الأنعام', name_english: 'Al-An\'am', ayah_count: 165 },
  7: { name_arabic: 'الأعراف', name_english: 'Al-A\'raf', ayah_count: 206 },
  8: { name_arabic: 'الأنفال', name_english: 'Al-Anfal', ayah_count: 75 },
  9: { name_arabic: 'التوبة', name_english: 'At-Tawbah', ayah_count: 129 },
  10: { name_arabic: 'يونس', name_english: 'Yunus', ayah_count: 109 },
  11: { name_arabic: 'هود', name_english: 'Hud', ayah_count: 123 },
  12: { name_arabic: 'يوسف', name_english: 'Yusuf', ayah_count: 111 },
  13: { name_arabic: 'الرعد', name_english: 'Ar-Ra\'d', ayah_count: 43 },
  14: { name_arabic: 'إبراهيم', name_english: 'Ibrahim', ayah_count: 52 },
  15: { name_arabic: 'الحجر', name_english: 'Al-Hijr', ayah_count: 99 },
  16: { name_arabic: 'النحل', name_english: 'An-Nahl', ayah_count: 128 },
  17: { name_arabic: 'الإسراء', name_english: 'Al-Isra', ayah_count: 111 },
  18: { name_arabic: 'الكهف', name_english: 'Al-Kahf', ayah_count: 110 },
  19: { name_arabic: 'مريم', name_english: 'Maryam', ayah_count: 98 },
  20: { name_arabic: 'طه', name_english: 'Ta-Ha', ayah_count: 135 },
  21: { name_arabic: 'الأنبياء', name_english: 'Al-Anbya', ayah_count: 112 },
  22: { name_arabic: 'الحج', name_english: 'Al-Hajj', ayah_count: 78 },
  23: { name_arabic: 'المؤمنون', name_english: 'Al-Mu\'minun', ayah_count: 118 },
  24: { name_arabic: 'النور', name_english: 'An-Nur', ayah_count: 64 },
  25: { name_arabic: 'الفرقان', name_english: 'Al-Furqan', ayah_count: 77 },
  26: { name_arabic: 'الشعراء', name_english: 'Ash-Shu\'ara', ayah_count: 227 },
  27: { name_arabic: 'النمل', name_english: 'An-Naml', ayah_count: 93 },
  28: { name_arabic: 'القصص', name_english: 'Al-Qasas', ayah_count: 88 },
  29: { name_arabic: 'العنكبوت', name_english: 'Al-\'Ankabut', ayah_count: 69 },
  30: { name_arabic: 'الروم', name_english: 'Ar-Rum', ayah_count: 60 },
  31: { name_arabic: 'لقمان', name_english: 'Luqman', ayah_count: 34 },
  32: { name_arabic: 'السجدة', name_english: 'As-Sajdah', ayah_count: 30 },
  33: { name_arabic: 'الأحزاب', name_english: 'Al-Ahzab', ayah_count: 73 },
  34: { name_arabic: 'سبأ', name_english: 'Saba', ayah_count: 54 },
  35: { name_arabic: 'فاطر', name_english: 'Fatir', ayah_count: 45 },
  36: { name_arabic: 'يس', name_english: 'Ya-Sin', ayah_count: 83 },
  37: { name_arabic: 'الصافات', name_english: 'As-Saffat', ayah_count: 182 },
  38: { name_arabic: 'ص', name_english: 'Sad', ayah_count: 88 },
  39: { name_arabic: 'الزمر', name_english: 'Az-Zumar', ayah_count: 75 },
  40: { name_arabic: 'غافر', name_english: 'Ghafir', ayah_count: 85 },
  41: { name_arabic: 'فصلت', name_english: 'Fussilat', ayah_count: 54 },
  42: { name_arabic: 'الشورى', name_english: 'Ash-Shuraa', ayah_count: 53 },
  43: { name_arabic: 'الزخرف', name_english: 'Az-Zukhruf', ayah_count: 89 },
  44: { name_arabic: 'الدخان', name_english: 'Ad-Dukhan', ayah_count: 59 },
  45: { name_arabic: 'الجاثية', name_english: 'Al-Jathiyah', ayah_count: 37 },
  46: { name_arabic: 'الأحقاف', name_english: 'Al-Ahqaf', ayah_count: 35 },
  47: { name_arabic: 'محمد', name_english: 'Muhammad', ayah_count: 38 },
  48: { name_arabic: 'الفتح', name_english: 'Al-Fath', ayah_count: 29 },
  49: { name_arabic: 'الحجرات', name_english: 'Al-Hujurat', ayah_count: 18 },
  50: { name_arabic: 'ق', name_english: 'Qaf', ayah_count: 45 },
  51: { name_arabic: 'الذاريات', name_english: 'Adh-Dhariyat', ayah_count: 60 },
  52: { name_arabic: 'الطور', name_english: 'At-Tur', ayah_count: 49 },
  53: { name_arabic: 'النجم', name_english: 'An-Najm', ayah_count: 62 },
  54: { name_arabic: 'القمر', name_english: 'Al-Qamar', ayah_count: 55 },
  55: { name_arabic: 'الرحمن', name_english: 'Ar-Rahman', ayah_count: 78 },
  56: { name_arabic: 'الواقعة', name_english: 'Al-Waqi\'ah', ayah_count: 96 },
  57: { name_arabic: 'الحديد', name_english: 'Al-Hadid', ayah_count: 29 },
  58: { name_arabic: 'المجادلة', name_english: 'Al-Mujadila', ayah_count: 22 },
  59: { name_arabic: 'الحشر', name_english: 'Al-Hashr', ayah_count: 24 },
  60: { name_arabic: 'الممتحنة', name_english: 'Al-Mumtahanah', ayah_count: 13 },
  61: { name_arabic: 'الصف', name_english: 'As-Saff', ayah_count: 14 },
  62: { name_arabic: 'الجمعة', name_english: 'Al-Jumu\'ah', ayah_count: 11 },
  63: { name_arabic: 'المنافقون', name_english: 'Al-Munafiqun', ayah_count: 11 },
  64: { name_arabic: 'التغابن', name_english: 'At-Taghabun', ayah_count: 18 },
  65: { name_arabic: 'الطلاق', name_english: 'At-Talaq', ayah_count: 12 },
  66: { name_arabic: 'التحريم', name_english: 'At-Tahrim', ayah_count: 12 },
  67: { name_arabic: 'الملك', name_english: 'Al-Mulk', ayah_count: 30 },
  68: { name_arabic: 'القلم', name_english: 'Al-Qalam', ayah_count: 52 },
  69: { name_arabic: 'الحاقة', name_english: 'Al-Haqqah', ayah_count: 52 },
  70: { name_arabic: 'المعارج', name_english: 'Al-Ma\'arij', ayah_count: 44 },
  71: { name_arabic: 'نوح', name_english: 'Nuh', ayah_count: 28 },
  72: { name_arabic: 'الجن', name_english: 'Al-Jinn', ayah_count: 28 },
  73: { name_arabic: 'المزمل', name_english: 'Al-Muzzammil', ayah_count: 20 },
  74: { name_arabic: 'المدثر', name_english: 'Al-Muddaththir', ayah_count: 56 },
  75: { name_arabic: 'القيامة', name_english: 'Al-Qiyamah', ayah_count: 40 },
  76: { name_arabic: 'الإنسان', name_english: 'Al-Insan', ayah_count: 31 },
  77: { name_arabic: 'المرسلات', name_english: 'Al-Mursalat', ayah_count: 50 },
  78: { name_arabic: 'النبأ', name_english: 'An-Naba', ayah_count: 40 },
  79: { name_arabic: 'النازعات', name_english: 'An-Nazi\'at', ayah_count: 46 },
  80: { name_arabic: 'عبس', name_english: '\'Abasa', ayah_count: 42 },
  81: { name_arabic: 'التكوير', name_english: 'At-Takwir', ayah_count: 29 },
  82: { name_arabic: 'الإنفطار', name_english: 'Al-Infitar', ayah_count: 19 },
  83: { name_arabic: 'المطففين', name_english: 'Al-Mutaffifin', ayah_count: 36 },
  84: { name_arabic: 'الإنشقاق', name_english: 'Al-Inshiqaq', ayah_count: 25 },
  85: { name_arabic: 'البروج', name_english: 'Al-Buruj', ayah_count: 22 },
  86: { name_arabic: 'الطارق', name_english: 'At-Tariq', ayah_count: 17 },
  87: { name_arabic: 'الأعلى', name_english: 'Al-A\'la', ayah_count: 19 },
  88: { name_arabic: 'الغاشية', name_english: 'Al-Ghashiyah', ayah_count: 26 },
  89: { name_arabic: 'الفجر', name_english: 'Al-Fajr', ayah_count: 30 },
  90: { name_arabic: 'البلد', name_english: 'Al-Balad', ayah_count: 20 },
  91: { name_arabic: 'الشمس', name_english: 'Ash-Shams', ayah_count: 15 },
  92: { name_arabic: 'الليل', name_english: 'Al-Layl', ayah_count: 21 },
  93: { name_arabic: 'الضحى', name_english: 'Ad-Duhaa', ayah_count: 11 },
  94: { name_arabic: 'الشرح', name_english: 'Ash-Sharh', ayah_count: 8 },
  95: { name_arabic: 'التين', name_english: 'At-Tin', ayah_count: 8 },
  96: { name_arabic: 'العلق', name_english: 'Al-\'Alaq', ayah_count: 19 },
  97: { name_arabic: 'القدر', name_english: 'Al-Qadr', ayah_count: 5 },
  98: { name_arabic: 'البينة', name_english: 'Al-Bayyinah', ayah_count: 8 },
  99: { name_arabic: 'الزلزلة', name_english: 'Az-Zalzalah', ayah_count: 8 },
  100: { name_arabic: 'العاديات', name_english: 'Al-\'Adiyat', ayah_count: 11 },
  101: { name_arabic: 'القارعة', name_english: 'Al-Qari\'ah', ayah_count: 11 },
  102: { name_arabic: 'التكاثر', name_english: 'At-Takathur', ayah_count: 8 },
  103: { name_arabic: 'العصر', name_english: 'Al-\'Asr', ayah_count: 3 },
  104: { name_arabic: 'الهمزة', name_english: 'Al-Humazah', ayah_count: 9 },
  105: { name_arabic: 'الفيل', name_english: 'Al-Fil', ayah_count: 5 },
  106: { name_arabic: 'قريش', name_english: 'Quraysh', ayah_count: 4 },
  107: { name_arabic: 'الماعون', name_english: 'Al-Ma\'un', ayah_count: 7 },
  108: { name_arabic: 'الكوثر', name_english: 'Al-Kawthar', ayah_count: 3 },
  109: { name_arabic: 'الكافرون', name_english: 'Al-Kafirun', ayah_count: 6 },
  110: { name_arabic: 'النصر', name_english: 'An-Nasr', ayah_count: 3 },
  111: { name_arabic: 'المسد', name_english: 'Al-Masad', ayah_count: 5 },
  112: { name_arabic: 'الإخلاص', name_english: 'Al-Ikhlas', ayah_count: 4 },
  113: { name_arabic: 'الفلق', name_english: 'Al-Falaq', ayah_count: 5 },
  114: { name_arabic: 'الناس', name_english: 'An-Nas', ayah_count: 6 },
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
