/**
 * Gradebook TypeScript Types
 * Created: 2025-10-20
 * Purpose: Complete type system for rubrics, criteria, grades, and gradebook export
 * Dependencies: database.types.ts for base table types
 */

import { Database } from '../database.types';

// ============================================================================
// DATABASE ROW TYPES (will be auto-generated when schema is synced)
// ============================================================================

/**
 * Rubric table row type
 * A rubric is a grading framework with multiple weighted criteria
 */
export interface RubricRow {
  id: string;
  school_id: string;
  name: string;
  description: string | null;
  created_by: string; // teacher user_id
  created_at: string;
  updated_at: string;
}

/**
 * Rubric criterion table row type
 * A criterion is a single grading dimension within a rubric
 */
export interface RubricCriterionRow {
  id: string;
  rubric_id: string;
  name: string;
  description: string | null;
  weight: number; // 0-100, used for weighted average
  max_score: number; // maximum points for this criterion
  order: number; // display order
  created_at: string;
}

/**
 * Assignment rubric junction table row type
 * Links rubrics to assignments
 */
export interface AssignmentRubricRow {
  assignment_id: string;
  rubric_id: string;
  created_at: string;
}

/**
 * Grade table row type
 * Stores individual criterion scores for student assignments
 */
export interface GradeRow {
  id: string;
  assignment_id: string;
  student_id: string;
  criterion_id: string;
  score: number; // actual points earned
  max_score: number; // maximum possible points
  comments: string | null;
  graded_by: string; // teacher user_id
  created_at: string;
  updated_at: string;
}

// ============================================================================
// ENHANCED TYPES WITH RELATIONS
// ============================================================================

/**
 * Rubric with related data
 */
export interface RubricWithDetails extends RubricRow {
  criteria?: RubricCriterionRow[];
  created_by_teacher?: {
    id: string;
    display_name: string;
    email: string;
  };
  total_criteria?: number;
  total_weight?: number;
  assignment_count?: number; // how many assignments use this rubric
}

/**
 * Grade with student and criterion context
 */
export interface GradeWithDetails extends GradeRow {
  student?: {
    id: string;
    display_name: string;
    email: string;
  };
  criterion?: {
    id: string;
    name: string;
    weight: number;
    max_score: number;
  };
  graded_by_teacher?: {
    id: string;
    display_name: string;
    email: string;
  };
  percentage?: number; // (score / max_score) * 100
}

/**
 * Assignment with rubric and grades
 */
export interface AssignmentWithGrades {
  id: string;
  title: string;
  description: string | null;
  student_id: string;
  rubric?: RubricWithDetails;
  grades?: GradeWithDetails[];
  overall_score?: number; // calculated weighted average
  overall_percentage?: number; // (overall_score / total_possible) * 100
  graded?: boolean; // whether all criteria have been graded
}

/**
 * Student gradebook entry
 */
export interface StudentGradebookEntry {
  assignment_id: string;
  assignment_title: string;
  assignment_due_at: string;
  assignment_status: string;
  rubric_name: string | null;
  grades: GradeWithDetails[];
  overall_score: number;
  overall_percentage: number;
  graded_at: string | null;
}

/**
 * Gradebook summary statistics
 */
export interface GradebookStats {
  total_assignments: number;
  graded_assignments: number;
  pending_assignments: number;
  average_score: number; // overall average percentage
  highest_score: number;
  lowest_score: number;
  total_criteria_graded: number;
}

// ============================================================================
// API REQUEST/RESPONSE TYPES
// ============================================================================

/**
 * Create Rubric Request
 */
export interface CreateRubricRequest {
  name: string;
  description?: string;
  criteria?: Array<{
    name: string;
    description?: string;
    weight: number;
    max_score: number;
    order?: number;
  }>;
}

/**
 * Update Rubric Request
 */
export interface UpdateRubricRequest {
  name?: string;
  description?: string;
}

/**
 * Create Criterion Request
 */
export interface CreateCriterionRequest {
  name: string;
  description?: string;
  weight: number;
  max_score: number;
  order?: number;
}

/**
 * Update Criterion Request
 */
export interface UpdateCriterionRequest {
  name?: string;
  description?: string;
  weight?: number;
  max_score?: number;
  order?: number;
}

/**
 * Attach Rubric to Assignment Request
 */
export interface AttachRubricRequest {
  rubric_id: string;
}

/**
 * Submit Grade Request
 */
export interface SubmitGradeRequest {
  assignment_id: string;
  student_id: string;
  criterion_id: string;
  score: number;
  max_score: number;
  comments?: string;
}

/**
 * Bulk Grade Submission Request
 * For grading multiple criteria at once
 */
export interface BulkSubmitGradesRequest {
  assignment_id: string;
  student_id: string;
  grades: Array<{
    criterion_id: string;
    score: number;
    comments?: string;
  }>;
}

/**
 * Export Gradebook Request
 */
export interface ExportGradebookRequest {
  student_id?: string; // specific student or all students
  start_date?: string; // filter by date range
  end_date?: string;
  format?: 'csv' | 'pdf'; // export format
  include_comments?: boolean;
}

// ============================================================================
// API RESPONSE TYPES
// ============================================================================

/**
 * Generic success response
 */
export interface GradebookSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/**
 * Generic error response
 */
export interface GradebookErrorResponse {
  success: false;
  error: string;
  code: string;
  details?: unknown;
}

/**
 * Create Rubric Response
 */
export interface CreateRubricResponse extends GradebookSuccessResponse<{
  rubric: RubricWithDetails;
}> {}

/**
 * List Rubrics Response
 */
export interface ListRubricsResponse extends GradebookSuccessResponse<{
  rubrics: RubricWithDetails[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    total_pages: number;
  };
}> {}

/**
 * Get Single Rubric Response
 */
export interface GetRubricResponse extends GradebookSuccessResponse<{
  rubric: RubricWithDetails;
}> {}

/**
 * Update Rubric Response
 */
export interface UpdateRubricResponse extends GradebookSuccessResponse<{
  rubric: RubricWithDetails;
}> {}

/**
 * Delete Rubric Response
 */
export interface DeleteRubricResponse extends GradebookSuccessResponse<{
  deleted_rubric_id: string;
}> {}

/**
 * Create Criterion Response
 */
export interface CreateCriterionResponse extends GradebookSuccessResponse<{
  criterion: RubricCriterionRow;
  rubric_id: string;
}> {}

/**
 * Update Criterion Response
 */
export interface UpdateCriterionResponse extends GradebookSuccessResponse<{
  criterion: RubricCriterionRow;
}> {}

/**
 * Delete Criterion Response
 */
export interface DeleteCriterionResponse extends GradebookSuccessResponse<{
  deleted_criterion_id: string;
  rubric_id: string;
}> {}

/**
 * Attach Rubric Response
 */
export interface AttachRubricResponse extends GradebookSuccessResponse<{
  assignment_id: string;
  rubric_id: string;
  rubric: RubricWithDetails;
}> {}

/**
 * Submit Grade Response
 */
export interface SubmitGradeResponse extends GradebookSuccessResponse<{
  grade: GradeWithDetails;
  overall_progress: {
    graded_criteria: number;
    total_criteria: number;
    percentage: number;
  };
}> {}

/**
 * Bulk Submit Grades Response
 */
export interface BulkSubmitGradesResponse extends GradebookSuccessResponse<{
  grades: GradeWithDetails[];
  overall_score: number;
  overall_percentage: number;
}> {}

/**
 * Get Assignment Grades Response
 */
export interface GetAssignmentGradesResponse extends GradebookSuccessResponse<{
  assignment: AssignmentWithGrades;
}> {}

/**
 * Get Student Grades Response
 */
export interface GetStudentGradesResponse extends GradebookSuccessResponse<{
  student_id: string;
  entries: StudentGradebookEntry[];
  stats: GradebookStats;
}> {}

/**
 * Export Gradebook Response
 */
export interface ExportGradebookResponse extends GradebookSuccessResponse<{
  export_url: string; // signed URL to download CSV/PDF
  export_format: 'csv' | 'pdf';
  expires_at: string;
}> {}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Calculate weighted average score from grades
 * @param grades - Array of grades with criterion weights
 * @returns Weighted average score (0-100)
 */
export function calculateWeightedAverage(grades: GradeWithDetails[]): number {
  if (grades.length === 0) return 0;

  let totalWeightedScore = 0;
  let totalWeight = 0;

  for (const grade of grades) {
    if (!grade.criterion) continue;

    const percentage = (grade.score / grade.max_score) * 100;
    const weightedScore = percentage * grade.criterion.weight;

    totalWeightedScore += weightedScore;
    totalWeight += grade.criterion.weight;
  }

  if (totalWeight === 0) return 0;

  return Math.round((totalWeightedScore / totalWeight) * 100) / 100;
}

/**
 * Calculate overall score from criteria weights
 * @param grades - Array of grades
 * @returns Object with score and max score
 */
export function calculateOverallScore(grades: GradeWithDetails[]): {
  score: number;
  max_score: number;
  percentage: number;
} {
  if (grades.length === 0) {
    return { score: 0, max_score: 0, percentage: 0 };
  }

  let totalScore = 0;
  let totalMaxScore = 0;

  for (const grade of grades) {
    totalScore += grade.score;
    totalMaxScore += grade.max_score;
  }

  const percentage = totalMaxScore > 0 ? (totalScore / totalMaxScore) * 100 : 0;

  return {
    score: totalScore,
    max_score: totalMaxScore,
    percentage: Math.round(percentage * 100) / 100,
  };
}

/**
 * Check if all criteria in rubric have been graded
 * @param rubric - Rubric with criteria
 * @param grades - Array of submitted grades
 * @returns True if all criteria graded
 */
export function isFullyGraded(
  rubric: RubricWithDetails,
  grades: GradeWithDetails[]
): boolean {
  if (!rubric.criteria || rubric.criteria.length === 0) return false;

  const gradedCriterionIds = new Set(grades.map(g => g.criterion_id));

  return rubric.criteria.every(criterion =>
    gradedCriterionIds.has(criterion.id)
  );
}

/**
 * Get next criterion order number
 * @param existingCriteria - Array of existing criteria
 * @returns Next order number
 */
export function getNextCriterionOrder(existingCriteria: RubricCriterionRow[]): number {
  if (existingCriteria.length === 0) return 1;

  const maxOrder = Math.max(...existingCriteria.map(c => c.order));
  return maxOrder + 1;
}

/**
 * Validate criterion weights sum to 100
 * @param criteria - Array of criteria with weights
 * @returns Validation result with error message if invalid
 */
export function validateCriteriaWeights(
  criteria: Array<{ weight: number }>
): { valid: boolean; error?: string; total?: number } {
  const total = criteria.reduce((sum, c) => sum + c.weight, 0);

  if (Math.abs(total - 100) > 0.01) {
    // Allow small floating point errors
    return {
      valid: false,
      error: `Criterion weights must sum to 100. Current total: ${total}`,
      total,
    };
  }

  return { valid: true, total };
}

/**
 * Calculate grade letter from percentage
 * @param percentage - Grade percentage (0-100)
 * @returns Letter grade (A+, A, B+, etc.)
 */
export function getLetterGrade(percentage: number): string {
  if (percentage >= 97) return 'A+';
  if (percentage >= 93) return 'A';
  if (percentage >= 90) return 'A-';
  if (percentage >= 87) return 'B+';
  if (percentage >= 83) return 'B';
  if (percentage >= 80) return 'B-';
  if (percentage >= 77) return 'C+';
  if (percentage >= 73) return 'C';
  if (percentage >= 70) return 'C-';
  if (percentage >= 67) return 'D+';
  if (percentage >= 63) return 'D';
  if (percentage >= 60) return 'D-';
  return 'F';
}

/**
 * Format gradebook data for CSV export
 * @param entries - Student gradebook entries
 * @returns CSV string
 */
export function formatGradebookCSV(entries: StudentGradebookEntry[]): string {
  // CSV Header
  const headers = [
    'Assignment',
    'Due Date',
    'Status',
    'Rubric',
    'Overall Score',
    'Percentage',
    'Letter Grade',
    'Graded At',
  ];

  const rows = entries.map(entry => [
    entry.assignment_title,
    entry.assignment_due_at,
    entry.assignment_status,
    entry.rubric_name || 'N/A',
    entry.overall_score.toFixed(2),
    entry.overall_percentage.toFixed(2) + '%',
    getLetterGrade(entry.overall_percentage),
    entry.graded_at || 'Not graded',
  ]);

  // Combine headers and rows
  const csvContent = [headers, ...rows]
    .map(row => row.map(cell => `"${cell}"`).join(','))
    .join('\n');

  return csvContent;
}

// ============================================================================
// CONSTANTS
// ============================================================================

export const GRADEBOOK_CONSTANTS = {
  MAX_RUBRIC_NAME_LENGTH: 200,
  MAX_RUBRIC_DESCRIPTION_LENGTH: 1000,
  MAX_CRITERION_NAME_LENGTH: 200,
  MAX_CRITERION_DESCRIPTION_LENGTH: 500,
  MAX_CRITERIA_PER_RUBRIC: 20,
  MAX_COMMENT_LENGTH: 2000,
  DEFAULT_PAGINATION_LIMIT: 20,
  MAX_PAGINATION_LIMIT: 100,
  REQUIRED_WEIGHT_TOTAL: 100, // criterion weights must sum to 100
  MIN_WEIGHT: 0,
  MAX_WEIGHT: 100,
  MIN_SCORE: 0,
} as const;

/**
 * Error codes for gradebook operations
 */
export const GRADEBOOK_ERROR_CODES = {
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_WEIGHT: 'INVALID_WEIGHT',
  INVALID_SCORE: 'INVALID_SCORE',
  RUBRIC_IN_USE: 'RUBRIC_IN_USE',
  ALREADY_GRADED: 'ALREADY_GRADED',
  RUBRIC_NOT_ATTACHED: 'RUBRIC_NOT_ATTACHED',
  DATABASE_ERROR: 'DATABASE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;
