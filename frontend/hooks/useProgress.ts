/**
 * useProgress Hook - Student Progress Data Management
 * Created: 2025-11-08
 * Purpose: Custom hook for fetching and managing student progress data
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// ============================================================================
// INTERFACES
// ============================================================================

export interface TargetMilestone {
  id: string;
  title: string;
  description: string;
  sequence_order: number;
  completed: boolean;
}

export interface TargetWithProgress {
  id: string;
  title: string;
  description: string;
  category: string;
  status: string;
  progress: number;
  due_date: string;
  start_date: string;
  milestones: TargetMilestone[];
}

export interface AttendanceStats {
  total_sessions: number;
  present: number;
  absent: number;
  late: number;
  excused: number;
  attendance_percentage: number;
}

export interface StudyTimeData {
  date: string;
  duration_minutes: number;
}

export interface WeeklyStudyTime {
  week_start: string;
  total_minutes: number;
  daily_breakdown: StudyTimeData[];
}

export interface ProgressStats {
  active_targets: number;
  completed_milestones: number;
  total_milestones: number;
  current_streak: number;
  total_study_hours: number;
}

export interface StudentProgressData {
  student_id: string;
  student_name: string;
  targets: TargetWithProgress[];
  attendance: AttendanceStats;
  study_time: {
    weekly: WeeklyStudyTime[];
    total_minutes_this_month: number;
    average_daily_minutes: number;
  };
  stats: ProgressStats;
}

// ============================================================================
// CUSTOM HOOK
// ============================================================================

export function useProgress() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progressData, setProgressData] = useState<StudentProgressData | null>(null);

  /**
   * Fetch progress data for a specific student
   */
  const fetchProgress = useCallback(async (studentId: string) => {
    try {
      console.log('📊 useProgress: fetchProgress called for student:', studentId);
      setIsLoading(true);
      setError(null);

      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const errorMessage = 'Please login to view progress';
        console.error('❌ No session found');
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      const response = await fetch(`/api/progress/student?student_id=${studentId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      console.log('📡 API Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ API Error:', errorData);
        throw new Error(errorData.error || `Failed to fetch progress: ${response.status}`);
      }

      const data = await response.json();
      console.log('✅ Progress data received:', data);

      if (data.success && data.data) {
        console.log('📝 Setting progress data');
        setProgressData(data.data);
        return { success: true, data: data.data };
      }

      console.warn('⚠️ Invalid response format:', data);
      return { success: false, error: 'Invalid response format' };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch progress';
      setError(errorMessage);
      console.error('❌ Fetch progress error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh progress data
   */
  const refreshProgress = useCallback(async (studentId: string) => {
    return await fetchProgress(studentId);
  }, [fetchProgress]);

  return {
    // State
    progressData,
    isLoading,
    error,

    // Actions
    fetchProgress,
    refreshProgress,
    clearError,
  };
}
