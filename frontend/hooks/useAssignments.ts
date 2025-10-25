/**
 * useAssignments Hook - Assignment Lifecycle Data Fetching and Management
 * Created: 2025-10-20
 * Purpose: Custom hook for Assignments system following established patterns
 * Pattern: Matches useCalendar.ts and useMastery.ts - useAuthStore, callbacks, error handling, pagination
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import {
  AssignmentWithDetails,
  AssignmentStatus,
  CreateAssignmentRequest,
  UpdateAssignmentRequest,
  SubmitAssignmentRequest,
  TransitionAssignmentRequest,
  ReopenAssignmentRequest,
  ListAssignmentsResponse,
  CreateAssignmentResponse,
  UpdateAssignmentResponse,
  GetAssignmentResponse,
  DeleteAssignmentResponse,
  SubmitAssignmentResponse,
  TransitionAssignmentResponse,
  ReopenAssignmentResponse,
  AttachRubricResponse,
  AssignmentErrorResponse,
} from '@/lib/types/assignments';

// ============================================================================
// Type Definitions
// ============================================================================

export interface CreateAssignmentData {
  student_id: string;
  title: string;
  description?: string;
  due_at: string; // ISO 8601 timestamp
  highlight_refs?: string[];
  attachments?: string[];
}

export interface UpdateAssignmentData {
  title?: string;
  description?: string;
  due_at?: string;
}

export interface SubmitAssignmentData {
  text?: string;
  attachments?: string[];
}

export interface TransitionAssignmentData {
  to_status: AssignmentStatus;
  reason?: string;
}

export interface ReopenAssignmentData {
  reason?: string;
}

export interface AttachRubricData {
  rubric_id: string;
}

export interface AssignmentFilters {
  student_id?: string;
  teacher_id?: string;
  status?: AssignmentStatus | AssignmentStatus[];
  late_only?: boolean;
  due_before?: string;
  due_after?: string;
  sort_by?: 'due_at' | 'created_at' | 'status';
  sort_order?: 'asc' | 'desc';
}

export interface AssignmentSummary {
  total_assignments: number;
  by_status: Record<string, number>;
  late_count: number;
}

// ============================================================================
// Custom Hook
// ============================================================================

export function useAssignments(initialStudentId?: string) {
  const { user } = useAuthStore();

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<AssignmentWithDetails[]>([]);
  const [currentAssignment, setCurrentAssignment] = useState<AssignmentWithDetails | null>(null);
  const [filters, setFilters] = useState<AssignmentFilters>({});
  const [summary, setSummary] = useState<AssignmentSummary | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string | null>(initialStudentId || null);

  // Pagination (for list view)
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const ITEMS_PER_PAGE = 20;

  // ============================================================================
  // Assignment Operations
  // ============================================================================

  /**
   * Fetch assignments with filters and pagination
   */
  const fetchAssignments = useCallback(
    async (customFilters?: AssignmentFilters) => {
      if (!user) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const activeFilters = customFilters || filters;

        // Build query parameters
        const params = new URLSearchParams();
        if (activeFilters.student_id) params.append('student_id', activeFilters.student_id);
        if (activeFilters.teacher_id) params.append('teacher_id', activeFilters.teacher_id);

        // Handle status as single value or array
        if (activeFilters.status) {
          if (Array.isArray(activeFilters.status)) {
            activeFilters.status.forEach(s => params.append('status', s));
          } else {
            params.append('status', activeFilters.status);
          }
        }

        if (activeFilters.late_only !== undefined) params.append('late_only', String(activeFilters.late_only));
        if (activeFilters.due_before) params.append('due_before', activeFilters.due_before);
        if (activeFilters.due_after) params.append('due_after', activeFilters.due_after);
        if (activeFilters.sort_by) params.append('sort_by', activeFilters.sort_by);
        if (activeFilters.sort_order) params.append('sort_order', activeFilters.sort_order);

        params.append('page', String(currentPage));
        params.append('limit', String(ITEMS_PER_PAGE));

        // Get session for authorization
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Please login to view assignments');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`/api/assignments?${params.toString()}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData: AssignmentErrorResponse = await response.json();
          throw new Error(errorData.error || 'Failed to fetch assignments');
        }

        const data: ListAssignmentsResponse = await response.json();

        // API returns: { success, data: [...], assignments: [...], pagination: {...} }
        setAssignments(data.assignments || data.data || []);

        // Calculate summary from assignments since API doesn't return it
        const assignmentsList = data.assignments || data.data || [];
        const calculatedSummary: AssignmentSummary = {
          total_assignments: assignmentsList.length,
          by_status: assignmentsList.reduce((acc: Record<string, number>, a: any) => {
            acc[a.status] = (acc[a.status] || 0) + 1;
            return acc;
          }, {}),
          late_count: assignmentsList.filter((a: any) => a.is_overdue).length,
        };
        setSummary(calculatedSummary);

        setTotalItems(data.pagination?.total || 0);
        setTotalPages(Math.ceil((data.pagination?.total || 0) / ITEMS_PER_PAGE));
      } catch (err) {
        console.error('Error fetching assignments:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch assignments');
      } finally {
        setIsLoading(false);
      }
    },
    [user, filters, currentPage]
  );

  /**
   * Fetch single assignment by ID with full details
   */
  const fetchAssignment = useCallback(
    async (assignmentId: string) => {
      if (!user) {
        setError('User not authenticated');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Get session for authorization
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Please login to view assignment details');
          setIsLoading(false);
          return;
        }

        const response = await fetch(`/api/assignments/${assignmentId}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData: AssignmentErrorResponse = await response.json();
          throw new Error(errorData.error || 'Failed to fetch assignment');
        }

        const data: GetAssignmentResponse = await response.json();

        setCurrentAssignment(data.data.assignment);
      } catch (err) {
        console.error('Error fetching assignment:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch assignment');
      } finally {
        setIsLoading(false);
      }
    },
    [user]
  );

  /**
   * Create new assignment (teachers only)
   */
  const createAssignment = useCallback(
    async (assignmentData: CreateAssignmentData): Promise<boolean> => {
      if (!user) {
        setError('User not authenticated');
        return false;
      }

      try {
        setIsSubmitting(true);
        setError(null);

        const requestData: CreateAssignmentRequest = {
          student_id: assignmentData.student_id,
          title: assignmentData.title,
          description: assignmentData.description,
          due_at: assignmentData.due_at,
          highlight_refs: assignmentData.highlight_refs,
          attachments: assignmentData.attachments,
        };

        // Get session for authorization
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Please login to create assignment');
          setIsSubmitting(false);
          return false;
        }

        const response = await fetch('/api/assignments', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const errorData: AssignmentErrorResponse = await response.json();
          throw new Error(errorData.error || 'Failed to create assignment');
        }

        const data: CreateAssignmentResponse = await response.json();

        // Refresh assignments list
        await fetchAssignments();

        return true;
      } catch (err) {
        console.error('Error creating assignment:', err);
        setError(err instanceof Error ? err.message : 'Failed to create assignment');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, fetchAssignments]
  );

  /**
   * Update existing assignment (teachers only, before submission)
   */
  const updateAssignment = useCallback(
    async (assignmentId: string, updates: UpdateAssignmentData): Promise<boolean> => {
      if (!user) {
        setError('User not authenticated');
        return false;
      }

      try {
        setIsSubmitting(true);
        setError(null);

        const requestData: UpdateAssignmentRequest = {
          title: updates.title,
          description: updates.description,
          due_at: updates.due_at,
        };

        // Get session for authorization
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Please login to update assignment');
          setIsSubmitting(false);
          return false;
        }

        const response = await fetch(`/api/assignments/${assignmentId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const errorData: AssignmentErrorResponse = await response.json();
          throw new Error(errorData.error || 'Failed to update assignment');
        }

        const data: UpdateAssignmentResponse = await response.json();

        // Update current assignment if viewing
        if (currentAssignment && currentAssignment.id === assignmentId) {
          setCurrentAssignment(data.data.assignment);
        }

        // Refresh assignments list
        await fetchAssignments();

        return true;
      } catch (err) {
        console.error('Error updating assignment:', err);
        setError(err instanceof Error ? err.message : 'Failed to update assignment');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, currentAssignment, fetchAssignments]
  );

  /**
   * Delete assignment (teachers only, before submission)
   */
  const deleteAssignment = useCallback(
    async (assignmentId: string): Promise<boolean> => {
      if (!user) {
        setError('User not authenticated');
        return false;
      }

      try {
        setIsSubmitting(true);
        setError(null);

        // Get session for authorization
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Please login to delete assignment');
          setIsSubmitting(false);
          return false;
        }

        const response = await fetch(`/api/assignments/${assignmentId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        if (!response.ok) {
          const errorData: AssignmentErrorResponse = await response.json();
          throw new Error(errorData.error || 'Failed to delete assignment');
        }

        // Clear current assignment if deleted
        if (currentAssignment && currentAssignment.id === assignmentId) {
          setCurrentAssignment(null);
        }

        // Refresh assignments list
        await fetchAssignments();

        return true;
      } catch (err) {
        console.error('Error deleting assignment:', err);
        setError(err instanceof Error ? err.message : 'Failed to delete assignment');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, currentAssignment, fetchAssignments]
  );

  /**
   * Submit assignment (students only)
   */
  const submitAssignment = useCallback(
    async (assignmentId: string, submissionData: SubmitAssignmentData): Promise<boolean> => {
      if (!user) {
        setError('User not authenticated');
        return false;
      }

      try {
        setIsSubmitting(true);
        setError(null);

        const requestData: SubmitAssignmentRequest = {
          text: submissionData.text,
          attachments: submissionData.attachments,
        };

        // Get session for authorization
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Please login to submit assignment');
          setIsSubmitting(false);
          return false;
        }

        const response = await fetch(`/api/assignments/${assignmentId}/submit`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const errorData: AssignmentErrorResponse = await response.json();
          throw new Error(errorData.error || 'Failed to submit assignment');
        }

        const data: SubmitAssignmentResponse = await response.json();

        // Update current assignment if viewing
        if (currentAssignment && currentAssignment.id === assignmentId) {
          await fetchAssignment(assignmentId);
        }

        // Refresh assignments list
        await fetchAssignments();

        return true;
      } catch (err) {
        console.error('Error submitting assignment:', err);
        setError(err instanceof Error ? err.message : 'Failed to submit assignment');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, currentAssignment, fetchAssignment, fetchAssignments]
  );

  /**
   * Transition assignment status (role-based permissions)
   */
  const transitionStatus = useCallback(
    async (assignmentId: string, transitionData: TransitionAssignmentData): Promise<boolean> => {
      if (!user) {
        setError('User not authenticated');
        return false;
      }

      try {
        setIsSubmitting(true);
        setError(null);

        const requestData: TransitionAssignmentRequest = {
          to_status: transitionData.to_status,
          reason: transitionData.reason,
        };

        // Get session for authorization
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Please login to transition assignment status');
          setIsSubmitting(false);
          return false;
        }

        const response = await fetch(`/api/assignments/${assignmentId}/transition`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const errorData: AssignmentErrorResponse = await response.json();
          throw new Error(errorData.error || 'Failed to transition assignment status');
        }

        const data: TransitionAssignmentResponse = await response.json();

        // Update current assignment if viewing
        if (currentAssignment && currentAssignment.id === assignmentId) {
          await fetchAssignment(assignmentId);
        }

        // Refresh assignments list
        await fetchAssignments();

        return true;
      } catch (err) {
        console.error('Error transitioning assignment status:', err);
        setError(err instanceof Error ? err.message : 'Failed to transition assignment status');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, currentAssignment, fetchAssignment, fetchAssignments]
  );

  /**
   * Reopen completed assignment (teachers only)
   */
  const reopenAssignment = useCallback(
    async (assignmentId: string, reopenData: ReopenAssignmentData): Promise<boolean> => {
      if (!user) {
        setError('User not authenticated');
        return false;
      }

      try {
        setIsSubmitting(true);
        setError(null);

        const requestData: ReopenAssignmentRequest = {
          reason: reopenData.reason,
        };

        // Get session for authorization
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Please login to reopen assignment');
          setIsSubmitting(false);
          return false;
        }

        const response = await fetch(`/api/assignments/${assignmentId}/reopen`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const errorData: AssignmentErrorResponse = await response.json();
          throw new Error(errorData.error || 'Failed to reopen assignment');
        }

        const data: ReopenAssignmentResponse = await response.json();

        // Update current assignment if viewing
        if (currentAssignment && currentAssignment.id === assignmentId) {
          await fetchAssignment(assignmentId);
        }

        // Refresh assignments list
        await fetchAssignments();

        return true;
      } catch (err) {
        console.error('Error reopening assignment:', err);
        setError(err instanceof Error ? err.message : 'Failed to reopen assignment');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, currentAssignment, fetchAssignment, fetchAssignments]
  );

  /**
   * Attach rubric to assignment for grading (teachers only)
   */
  const attachRubric = useCallback(
    async (assignmentId: string, rubricData: AttachRubricData): Promise<boolean> => {
      if (!user) {
        setError('User not authenticated');
        return false;
      }

      try {
        setIsSubmitting(true);
        setError(null);

        // Get session for authorization
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          setError('Please login to attach rubric');
          setIsSubmitting(false);
          return false;
        }

        const response = await fetch(`/api/assignments/${assignmentId}/rubric`, {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(rubricData),
        });

        if (!response.ok) {
          const errorData: AssignmentErrorResponse = await response.json();
          throw new Error(errorData.error || 'Failed to attach rubric');
        }

        const data: AttachRubricResponse = await response.json();

        // Update current assignment if viewing
        if (currentAssignment && currentAssignment.id === assignmentId) {
          await fetchAssignment(assignmentId);
        }

        return true;
      } catch (err) {
        console.error('Error attaching rubric:', err);
        setError(err instanceof Error ? err.message : 'Failed to attach rubric');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, currentAssignment, fetchAssignment]
  );

  // ============================================================================
  // Filter Management
  // ============================================================================

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters: AssignmentFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filters change
  }, []);

  /**
   * Clear filters
   */
  const clearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  // ============================================================================
  // Pagination Management
  // ============================================================================

  /**
   * Change page
   */
  const changePage = useCallback((page: number) => {
    setCurrentPage(page);
  }, []);

  /**
   * Navigate to next page
   */
  const navigateNext = useCallback(() => {
    setCurrentPage((prev) => Math.min(totalPages, prev + 1));
  }, [totalPages]);

  /**
   * Navigate to previous page
   */
  const navigatePrevious = useCallback(() => {
    setCurrentPage((prev) => Math.max(1, prev - 1));
  }, []);

  // ============================================================================
  // Selection Management
  // ============================================================================

  /**
   * Change selected student (for teacher/parent view)
   */
  const changeStudent = useCallback((studentId: string) => {
    setSelectedStudent(studentId);
  }, []);

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Clear current assignment
   */
  const clearCurrentAssignment = useCallback(() => {
    setCurrentAssignment(null);
  }, []);

  /**
   * Refresh all data
   */
  const refreshData = useCallback(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Initial data fetch - fetch assignments when filters or pagination changes
   */
  useEffect(() => {
    if (user) {
      fetchAssignments();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, filters, currentPage]);

  // ============================================================================
  // Return Interface
  // ============================================================================

  return {
    // State
    isLoading,
    error,
    assignments,
    currentAssignment,
    filters,
    summary,
    isSubmitting,
    selectedStudent,

    // Pagination
    currentPage,
    totalPages,
    totalItems,

    // Assignment operations
    fetchAssignments,
    fetchAssignment,
    createAssignment,
    updateAssignment,
    deleteAssignment,
    submitAssignment,
    transitionStatus,
    reopenAssignment,
    attachRubric,

    // Filter management
    updateFilters,
    clearFilters,

    // Pagination management
    changePage,
    navigateNext,
    navigatePrevious,

    // Selection management
    changeStudent,

    // Utility
    clearCurrentAssignment,
    refreshData,
  };
}
