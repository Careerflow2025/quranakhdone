/**
 * useHomework Hook - Homework Management with API Integration
 * Created: 2025-10-22
 * Purpose: Custom hook for managing homework (green/gold highlights system)
 *
 * Homework System Overview:
 * - Homework uses the highlights table with color='green' (pending) or 'gold' (completed)
 * - Teachers create homework assignments (green highlights)
 * - Students complete homework which transitions green → gold
 * - API endpoints: POST /api/homework, GET /api/homework, PATCH /api/homework/:id/complete
 */

import { useState, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import {
  HomeworkWithDetails,
  CreateHomeworkRequest,
  CompleteHomeworkRequest,
  AddHomeworkReplyRequest,
  ListHomeworkQuery,
  HomeworkStatus,
} from '@/lib/types/homework';

// ============================================================================
// INTERFACES
// ============================================================================

export interface HomeworkFilters extends Partial<ListHomeworkQuery> {
  student_id?: string;
  teacher_id?: string;
  status?: HomeworkStatus;
  surah?: number;
  include_completed?: boolean;
}

export interface HomeworkStats {
  total_pending: number;
  total_completed: number;
  completion_rate: number;
  total_ayahs_assigned: number;
  total_ayahs_completed: number;
}

export interface StudentHomeworkData {
  pending_homework: HomeworkWithDetails[];
  completed_homework: HomeworkWithDetails[];
  stats: HomeworkStats;
}

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export function useHomework() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State
  const [homeworkList, setHomeworkList] = useState<HomeworkWithDetails[]>([]);
  const [selectedHomework, setSelectedHomework] = useState<HomeworkWithDetails | null>(null);
  const [homeworkStats, setHomeworkStats] = useState<HomeworkStats | null>(null);

  /**
   * Fetch homework list with optional filters
   */
  const fetchHomework = useCallback(async (filters?: HomeworkFilters) => {
    try {
      setIsLoading(true);
      setError(null);

      // Build query parameters
      const params = new URLSearchParams();

      if (filters?.student_id) params.append('student_id', filters.student_id);
      if (filters?.teacher_id) params.append('teacher_id', filters.teacher_id);
      if (filters?.status) params.append('status', filters.status);
      if (filters?.surah) params.append('surah', filters.surah.toString());
      if (filters?.page_number) params.append('page_number', filters.page_number.toString());
      if (filters?.include_completed !== undefined) {
        params.append('include_completed', filters.include_completed.toString());
      }
      if (filters?.page) params.append('page', filters.page.toString());
      if (filters?.limit) params.append('limit', filters.limit.toString());
      if (filters?.sort_by) params.append('sort_by', filters.sort_by);
      if (filters?.sort_order) params.append('sort_order', filters.sort_order);

      const response = await fetch(`/api/homework?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch homework: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.homework) {
        setHomeworkList(data.homework);
        return { success: true, data: data.homework, pagination: data.pagination };
      }

      return { success: false, error: 'Invalid response format' };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch homework';
      setError(errorMessage);
      console.error('Fetch homework error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Fetch homework for a specific student (with stats)
   */
  const fetchStudentHomework = useCallback(async (studentId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/homework/student/${studentId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch student homework: ${response.status}`);
      }

      const data = await response.json();

      if (data.success) {
        const allHomework = [
          ...(data.pending_homework || []),
          ...(data.completed_homework || []),
        ];
        setHomeworkList(allHomework);
        setHomeworkStats(data.stats);

        return {
          success: true,
          data: {
            pending_homework: data.pending_homework || [],
            completed_homework: data.completed_homework || [],
            stats: data.stats,
          } as StudentHomeworkData,
        };
      }

      return { success: false, error: 'Invalid response format' };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch student homework';
      setError(errorMessage);
      console.error('Fetch student homework error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Get a single homework by ID
   */
  const fetchHomeworkById = useCallback(async (homeworkId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await fetch(`/api/homework/${homeworkId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch homework: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.homework) {
        setSelectedHomework(data.homework);
        return { success: true, data: data.homework };
      }

      return { success: false, error: 'Invalid response format' };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch homework details';
      setError(errorMessage);
      console.error('Fetch homework by ID error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Create new homework (green highlight)
   */
  const createHomework = useCallback(async (homeworkData: CreateHomeworkRequest) => {
    try {
      setError(null);

      const response = await fetch('/api/homework', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(homeworkData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create homework: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.homework) {
        // Add to local state
        setHomeworkList(prev => [data.homework, ...prev]);

        return { success: true, data: data.homework };
      }

      return { success: false, error: 'Invalid response format' };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create homework';
      setError(errorMessage);
      console.error('Create homework error:', err);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Complete homework (green → gold transition)
   */
  const completeHomework = useCallback(async (
    homeworkId: string,
    completionData?: CompleteHomeworkRequest
  ) => {
    try {
      setError(null);

      const response = await fetch(`/api/homework/${homeworkId}/complete`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(completionData || {}),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to complete homework: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.homework) {
        // Update local state
        setHomeworkList(prev =>
          prev.map(hw => hw.id === homeworkId ? data.homework : hw)
        );

        // Update selected homework if it's the one being completed
        if (selectedHomework?.id === homeworkId) {
          setSelectedHomework(data.homework);
        }

        return { success: true, data: data.homework };
      }

      return { success: false, error: 'Invalid response format' };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to complete homework';
      setError(errorMessage);
      console.error('Complete homework error:', err);
      return { success: false, error: errorMessage };
    }
  }, [selectedHomework]);

  /**
   * Add reply/note to homework
   */
  const addHomeworkReply = useCallback(async (
    homeworkId: string,
    replyData: AddHomeworkReplyRequest
  ) => {
    try {
      setError(null);

      const response = await fetch(`/api/homework/${homeworkId}/reply`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(replyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to add reply: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.note) {
        // Refresh the homework to get updated notes
        await fetchHomeworkById(homeworkId);

        return { success: true, data: data.note };
      }

      return { success: false, error: 'Invalid response format' };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to add reply';
      setError(errorMessage);
      console.error('Add homework reply error:', err);
      return { success: false, error: errorMessage };
    }
  }, [fetchHomeworkById]);

  /**
   * Filter homework locally by status
   */
  const filterHomeworkByStatus = useCallback((status: HomeworkStatus | 'all') => {
    if (status === 'all') {
      return homeworkList;
    }
    return homeworkList.filter(hw => {
      if (status === 'pending') return hw.color === 'green';
      if (status === 'completed') return hw.color === 'gold';
      return false;
    });
  }, [homeworkList]);

  /**
   * Get pending homework count
   */
  const getPendingCount = useCallback(() => {
    return homeworkList.filter(hw => hw.color === 'green').length;
  }, [homeworkList]);

  /**
   * Get completed homework count
   */
  const getCompletedCount = useCallback(() => {
    return homeworkList.filter(hw => hw.color === 'gold').length;
  }, [homeworkList]);

  /**
   * Group homework by surah
   */
  const groupBySurah = useCallback(() => {
    return homeworkList.reduce((groups, hw) => {
      const surah = hw.surah;
      if (!groups[surah]) {
        groups[surah] = [];
      }
      groups[surah].push(hw);
      return groups;
    }, {} as Record<number, HomeworkWithDetails[]>);
  }, [homeworkList]);

  /**
   * Search homework by term (surah, teacher name, note)
   */
  const searchHomework = useCallback((searchTerm: string): HomeworkWithDetails[] => {
    const lowerTerm = searchTerm.toLowerCase();
    return homeworkList.filter(hw => {
      const teacherName = hw.teacher?.display_name || '';
      const studentName = hw.student?.display_name || '';
      const ayahText = hw.ayah_text || '';

      return (
        `surah ${hw.surah}`.includes(lowerTerm) ||
        teacherName.toLowerCase().includes(lowerTerm) ||
        studentName.toLowerCase().includes(lowerTerm) ||
        ayahText.toLowerCase().includes(lowerTerm) ||
        (hw.notes && hw.notes.some(note =>
          note.text?.toLowerCase().includes(lowerTerm)
        ))
      );
    });
  }, [homeworkList]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh homework list
   */
  const refreshHomework = useCallback(async (filters?: HomeworkFilters) => {
    return await fetchHomework(filters);
  }, [fetchHomework]);

  return {
    // State
    homeworkList,
    selectedHomework,
    homeworkStats,
    isLoading,
    error,

    // Actions
    fetchHomework,
    fetchStudentHomework,
    fetchHomeworkById,
    createHomework,
    completeHomework,
    addHomeworkReply,
    refreshHomework,

    // Utilities
    filterHomeworkByStatus,
    getPendingCount,
    getCompletedCount,
    groupBySurah,
    searchHomework,
    setSelectedHomework,
    clearError,
  };
}
