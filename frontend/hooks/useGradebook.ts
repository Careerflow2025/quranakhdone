/**
 * useGradebook Hook - Gradebook Data Fetching and Management
 * Created: 2025-10-20
 * Purpose: Custom hook for Gradebook system following established patterns
 * Pattern: Matches useMessages.ts - useAuthStore, callbacks, error handling, pagination
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import {
  RubricWithDetails,
  GradeWithDetails,
  StudentGradebookEntry,
  GradebookStats,
  CreateRubricRequest,
  SubmitGradeRequest,
  AttachRubricRequest,
} from '@/lib/types/gradebook';

// User type for display
export interface GradebookUser {
  id: string;
  display_name: string;
  email: string;
  role: 'owner' | 'admin' | 'teacher' | 'student' | 'parent';
}

export interface CreateRubricData {
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

export interface SubmitGradeData {
  assignment_id: string;
  student_id: string;
  criterion_id: string;
  score: number;
  max_score: number;
  comments?: string;
}

export interface GradeProgress {
  graded_criteria: number;
  total_criteria: number;
  percentage: number;
}

export type GradebookView = 'rubrics' | 'grades' | 'student-view' | 'parent-view';

export function useGradebook(initialView: GradebookView = 'rubrics') {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Rubrics state
  const [rubrics, setRubrics] = useState<RubricWithDetails[]>([]);
  const [currentRubric, setCurrentRubric] = useState<RubricWithDetails | null>(null);
  const [isLoadingRubric, setIsLoadingRubric] = useState(false);

  // Grades state
  const [grades, setGrades] = useState<GradeWithDetails[]>([]);
  const [gradeProgress, setGradeProgress] = useState<GradeProgress | null>(null);

  // Gradebook entries state (student/parent views)
  const [gradebookEntries, setGradebookEntries] = useState<StudentGradebookEntry[]>([]);
  const [gradebookStats, setGradebookStats] = useState<GradebookStats | null>(null);

  // View state
  const [currentView, setCurrentView] = useState<GradebookView>(initialView);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================================================================
  // RUBRIC OPERATIONS
  // ============================================================================

  /**
   * Fetch rubrics with pagination and search
   */
  const fetchRubrics = useCallback(async (page: number = 1, search: string = '') => {
    if (!user) {
      setError('User not authenticated');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        sort_by: 'created_at',
        sort_order: 'desc',
      });

      if (search) {
        params.append('search', search);
      }

      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please login to access rubrics');
      }

      const response = await fetch(`/api/rubrics?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch rubrics');
      }

      const data = await response.json();

      if (data.success) {
        setRubrics(data.data.rubrics || []);
        setCurrentPage(data.data.pagination?.page || 1);
        setTotalPages(data.data.pagination?.total_pages || 1);
        setTotalItems(data.data.pagination?.total || 0);
      } else {
        throw new Error(data.error || 'Failed to fetch rubrics');
      }
    } catch (err: any) {
      console.error('Error fetching rubrics:', err);
      setError(err.message || 'Failed to load rubrics');
      setRubrics([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Fetch single rubric with full details
   */
  const fetchRubric = useCallback(async (rubricId: string) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setIsLoadingRubric(true);
      setError(null);

      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please login to access rubric details');
      }

      const response = await fetch(`/api/rubrics/${rubricId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch rubric');
      }

      const data = await response.json();

      if (data.success) {
        setCurrentRubric(data.data.rubric);
      } else {
        throw new Error(data.error || 'Failed to fetch rubric');
      }
    } catch (err: any) {
      console.error('Error fetching rubric:', err);
      setError(err.message || 'Failed to load rubric');
      setCurrentRubric(null);
    } finally {
      setIsLoadingRubric(false);
    }
  }, [user]);

  /**
   * Create new rubric with criteria
   */
  const createRubric = useCallback(async (rubricData: CreateRubricData): Promise<boolean> => {
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
        throw new Error('Please login to create rubrics');
      }

      const response = await fetch('/api/rubrics', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(rubricData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create rubric');
      }

      const data = await response.json();

      if (data.success) {
        // Refresh rubrics list
        await fetchRubrics(currentPage);
        return true;
      } else {
        throw new Error(data.error || 'Failed to create rubric');
      }
    } catch (err: any) {
      console.error('Error creating rubric:', err);
      setError(err.message || 'Failed to create rubric');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, currentPage, fetchRubrics]);

  /**
   * Update existing rubric
   */
  const updateRubric = useCallback(async (rubricId: string, updates: { name?: string; description?: string }): Promise<boolean> => {
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
        throw new Error('Please login to update rubrics');
      }

      const response = await fetch(`/api/rubrics/${rubricId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update rubric');
      }

      const data = await response.json();

      if (data.success) {
        // Update current rubric if viewing
        if (currentRubric && currentRubric.id === rubricId) {
          setCurrentRubric(data.data.rubric);
        }
        // Refresh rubrics list
        await fetchRubrics(currentPage);
        return true;
      } else {
        throw new Error(data.error || 'Failed to update rubric');
      }
    } catch (err: any) {
      console.error('Error updating rubric:', err);
      setError(err.message || 'Failed to update rubric');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, currentRubric, currentPage, fetchRubrics]);

  /**
   * Delete rubric
   */
  const deleteRubric = useCallback(async (rubricId: string): Promise<boolean> => {
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
        throw new Error('Please login to delete rubrics');
      }

      const response = await fetch(`/api/rubrics/${rubricId}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to delete rubric');
      }

      const data = await response.json();

      if (data.success) {
        // Clear current rubric if deleted
        if (currentRubric && currentRubric.id === rubricId) {
          setCurrentRubric(null);
        }
        // Refresh rubrics list
        await fetchRubrics(currentPage);
        return true;
      } else {
        throw new Error(data.error || 'Failed to delete rubric');
      }
    } catch (err: any) {
      console.error('Error deleting rubric:', err);
      setError(err.message || 'Failed to delete rubric');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [user, currentRubric, currentPage, fetchRubrics]);

  // ============================================================================
  // GRADE OPERATIONS
  // ============================================================================

  /**
   * Submit grade for student on assignment criterion
   */
  const submitGrade = useCallback(async (gradeData: SubmitGradeData): Promise<boolean> => {
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
        throw new Error('Please login to submit grades');
      }

      const response = await fetch('/api/grades', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(gradeData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit grade');
      }

      const data = await response.json();

      if (data.success) {
        // Update grade progress
        if (data.data.overall_progress) {
          setGradeProgress(data.data.overall_progress);
        }
        return true;
      } else {
        throw new Error(data.error || 'Failed to submit grade');
      }
    } catch (err: any) {
      console.error('Error submitting grade:', err);
      setError(err.message || 'Failed to submit grade');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [user]);

  /**
   * Fetch grades for assignment
   */
  const fetchAssignmentGrades = useCallback(async (assignmentId: string) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try{
      setIsLoading(true);
      setError(null);

      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please login to access assignment grades');
      }

      const response = await fetch(`/api/grades/assignment/${assignmentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch grades');
      }

      const data = await response.json();

      if (data.success) {
        setGrades(data.data.grades || []);
        if (data.data.progress) {
          setGradeProgress(data.data.progress);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch grades');
      }
    } catch (err: any) {
      console.error('Error fetching assignment grades:', err);
      setError(err.message || 'Failed to load grades');
      setGrades([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Fetch grades for student
   */
  const fetchStudentGrades = useCallback(async (studentId: string) => {
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
        throw new Error('Please login to access student grades');
      }

      const response = await fetch(`/api/grades/student/${studentId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch student grades');
      }

      const data = await response.json();

      if (data.success) {
        setGrades(data.data.grades || []);
      } else {
        throw new Error(data.error || 'Failed to fetch student grades');
      }
    } catch (err: any) {
      console.error('Error fetching student grades:', err);
      setError(err.message || 'Failed to load student grades');
      setGrades([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // ============================================================================
  // ASSIGNMENT RUBRIC OPERATIONS
  // ============================================================================

  /**
   * Attach rubric to assignment
   */
  const attachRubric = useCallback(async (assignmentId: string, rubricId: string): Promise<boolean> => {
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
        throw new Error('Please login to attach rubrics');
      }

      const response = await fetch(`/api/assignments/${assignmentId}/rubric`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ rubric_id: rubricId }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to attach rubric');
      }

      const data = await response.json();

      if (data.success) {
        return true;
      } else {
        throw new Error(data.error || 'Failed to attach rubric');
      }
    } catch (err: any) {
      console.error('Error attaching rubric:', err);
      setError(err.message || 'Failed to attach rubric');
      return false;
    } finally {
      setIsSubmitting(false);
    }
  }, [user]);

  // ============================================================================
  // GRADEBOOK VIEW OPERATIONS (Student/Parent)
  // ============================================================================

  /**
   * Fetch student gradebook (all grades for a student)
   */
  const fetchStudentGradebook = useCallback(async (studentId?: string) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (studentId) {
        params.append('student_id', studentId);
      }

      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please login to access gradebook');
      }

      const response = await fetch(`/api/gradebook/student?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch student gradebook');
      }

      const data = await response.json();

      console.log('✅ Student gradebook API response:', data);

      if (data.success) {
        console.log('📝 Setting gradebook entries:', data.data.entries?.length || 0);
        console.log('📊 Setting gradebook stats:', data.data.stats);

        setGradebookEntries(data.data.entries || []);
        if (data.data.stats) {
          setGradebookStats(data.data.stats);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch student gradebook');
      }
    } catch (err: any) {
      console.error('Error fetching student gradebook:', err);
      setError(err.message || 'Failed to load student gradebook');
      setGradebookEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Fetch parent gradebook (grades for linked children)
   */
  const fetchParentGradebook = useCallback(async (childId?: string) => {
    if (!user) {
      setError('User not authenticated');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (childId) {
        params.append('child_id', childId);
      }

      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please login to access parent gradebook');
      }

      const response = await fetch(`/api/gradebook/parent?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch parent gradebook');
      }

      const data = await response.json();

      if (data.success) {
        setGradebookEntries(data.data.entries || []);
        if (data.data.stats) {
          setGradebookStats(data.data.stats);
        }
      } else {
        throw new Error(data.error || 'Failed to fetch parent gradebook');
      }
    } catch (err: any) {
      console.error('Error fetching parent gradebook:', err);
      setError(err.message || 'Failed to load parent gradebook');
      setGradebookEntries([]);
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  /**
   * Export gradebook to CSV
   */
  const exportGradebook = useCallback(async (options: {
    student_id?: string;
    start_date?: string;
    end_date?: string;
    format?: 'csv' | 'pdf';
    include_comments?: boolean;
  } = {}): Promise<boolean> => {
    if (!user) {
      setError('User not authenticated');
      return false;
    }

    try {
      setIsLoading(true);
      setError(null);

      const params = new URLSearchParams();
      if (options.student_id) params.append('student_id', options.student_id);
      if (options.start_date) params.append('start_date', options.start_date);
      if (options.end_date) params.append('end_date', options.end_date);
      if (options.format) params.append('format', options.format);
      if (options.include_comments !== undefined) {
        params.append('include_comments', options.include_comments.toString());
      }

      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please login to export gradebook');
      }

      const response = await fetch(`/api/gradebook/export?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to export gradebook');
      }

      // Download file
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `gradebook_export_${new Date().toISOString().split('T')[0]}.${options.format || 'csv'}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      return true;
    } catch (err: any) {
      console.error('Error exporting gradebook:', err);
      setError(err.message || 'Failed to export gradebook');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  // ============================================================================
  // VIEW MANAGEMENT
  // ============================================================================

  /**
   * Change current view
   */
  const changeView = useCallback(async (view: GradebookView) => {
    setCurrentView(view);
    setCurrentPage(1);
    setError(null);

    // Load appropriate data for view
    if (view === 'rubrics') {
      await fetchRubrics(1);
    }
    // Other views loaded on-demand
  }, [fetchRubrics]);

  /**
   * Change page (for pagination)
   */
  const changePage = useCallback(async (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);

    if (currentView === 'rubrics') {
      await fetchRubrics(page);
    }
  }, [currentView, totalPages, fetchRubrics]);

  // ============================================================================
  // INITIALIZATION
  // ============================================================================

  /**
   * Initial data fetch on mount
   */
  useEffect(() => {
    if (user && currentView === 'rubrics') {
      fetchRubrics();
    }
  }, [user]); // Only depend on user, not fetchRubrics to avoid infinite loop

  /**
   * Refresh current view data
   */
  const refreshData = useCallback(async () => {
    if (currentView === 'rubrics') {
      await fetchRubrics(currentPage);
    }
  }, [currentView, currentPage, fetchRubrics]);

  // ============================================================================
  // RETURN INTERFACE
  // ============================================================================

  return {
    // State
    isLoading,
    error,
    rubrics,
    currentRubric,
    isLoadingRubric,
    grades,
    gradeProgress,
    gradebookEntries,
    gradebookStats,
    currentView,
    currentPage,
    totalPages,
    totalItems,
    isSubmitting,

    // Rubric actions
    fetchRubrics,
    fetchRubric,
    createRubric,
    updateRubric,
    deleteRubric,
    clearCurrentRubric: () => setCurrentRubric(null),

    // Grade actions
    submitGrade,
    fetchAssignmentGrades,
    fetchStudentGrades,

    // Assignment rubric actions
    attachRubric,

    // Gradebook view actions
    fetchStudentGradebook,
    fetchParentGradebook,
    exportGradebook,

    // View management
    changeView,
    changePage,
    refreshData,
  };
}
