/**
 * useMastery Hook - Mastery Tracking Data Fetching and Management
 * Created: 2025-10-20
 * Purpose: Custom hook for Mastery Tracking system following established patterns
 * Pattern: Matches useCalendar.ts and useGradebook.ts - useAuthStore, callbacks, error handling
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import {
  StudentMasteryOverview,
  SurahMasteryData,
  MasteryLevel,
  UpsertMasteryRequest,
  UpsertMasteryResponse,
  GetStudentMasteryResponse,
  GetHeatmapResponse,
  MasteryErrorResponse,
  AyahMasteryWithDetails,
} from '@/lib/types/mastery';

// ============================================================================
// Type Definitions
// ============================================================================

export interface UpdateMasteryData {
  student_id: string;
  script_id: string;
  ayah_id: string;
  level: MasteryLevel;
}

export interface MasteryFilters {
  script_id?: string;
  surah?: number;
}

// ============================================================================
// Custom Hook
// ============================================================================

export function useMastery(initialStudentId?: string) {
  const { user } = useAuthStore();

  // State management
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [studentOverview, setStudentOverview] = useState<StudentMasteryOverview | null>(null);
  const [currentSurahHeatmap, setCurrentSurahHeatmap] = useState<SurahMasteryData | null>(null);
  const [selectedSurah, setSelectedSurah] = useState<number>(1); // Default to Surah 1 (Al-Fatiha)
  const [selectedStudent, setSelectedStudent] = useState<string | null>(initialStudentId || null);
  const [filters, setFilters] = useState<MasteryFilters>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ============================================================================
  // Mastery Operations
  // ============================================================================

  /**
   * Fetch student mastery overview
   */
  const fetchStudentMastery = useCallback(
    async (studentId?: string, customFilters?: MasteryFilters) => {
      const targetStudentId = studentId || selectedStudent;

      if (!user) {
        setError('User not authenticated');
        setIsLoading(false);
        return;
      }

      if (!targetStudentId) {
        setError('No student selected');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        const activeFilters = customFilters || filters;

        // Build query parameters
        const params = new URLSearchParams();
        if (activeFilters.script_id) params.append('script_id', activeFilters.script_id);
        if (activeFilters.surah) params.append('surah', String(activeFilters.surah));

        // Get session for authorization
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Please login to access mastery data');
        }

        const response = await fetch(
          `/api/mastery/student/${targetStudentId}?${params.toString()}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData: MasteryErrorResponse = await response.json();
          throw new Error(errorData.error || 'Failed to fetch student mastery');
        }

        const data: GetStudentMasteryResponse = await response.json();

        setStudentOverview(data.data);
      } catch (err) {
        console.error('Error fetching student mastery:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch student mastery');
      } finally {
        setIsLoading(false);
      }
    },
    [user, selectedStudent, filters]
  );

  /**
   * Fetch surah heatmap
   */
  const fetchSurahHeatmap = useCallback(
    async (studentId?: string, surah?: number) => {
      const targetStudentId = studentId || selectedStudent;
      const targetSurah = surah || selectedSurah;

      if (!user) {
        setError('User not authenticated');
        return;
      }

      if (!targetStudentId) {
        setError('No student selected');
        return;
      }

      if (!targetSurah || targetSurah < 1 || targetSurah > 114) {
        setError('Invalid surah number. Must be between 1 and 114');
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // Build query parameters
        const params = new URLSearchParams();
        params.append('student_id', targetStudentId);
        if (filters.script_id) params.append('script_id', filters.script_id);

        // Get session for authorization
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Please login to access mastery heatmap');
        }

        const response = await fetch(
          `/api/mastery/heatmap/${targetSurah}?${params.toString()}`,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${session.access_token}`,
            },
          }
        );

        if (!response.ok) {
          const errorData: MasteryErrorResponse = await response.json();
          throw new Error(errorData.error || 'Failed to fetch surah heatmap');
        }

        const data: GetHeatmapResponse = await response.json();

        setCurrentSurahHeatmap(data.data);
      } catch (err) {
        console.error('Error fetching surah heatmap:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch surah heatmap');
      } finally {
        setIsLoading(false);
      }
    },
    [user, selectedStudent, selectedSurah, filters.script_id]
  );

  /**
   * Update ayah mastery level (upsert)
   */
  const updateAyahMastery = useCallback(
    async (masteryData: UpdateMasteryData): Promise<boolean> => {
      if (!user) {
        setError('User not authenticated');
        return false;
      }

      try {
        setIsSubmitting(true);
        setError(null);

        const requestData: UpsertMasteryRequest = {
          student_id: masteryData.student_id,
          script_id: masteryData.script_id,
          ayah_id: masteryData.ayah_id,
          level: masteryData.level,
        };

        // Get session for authorization
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          throw new Error('Please login to update mastery');
        }

        const response = await fetch('/api/mastery/upsert', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(requestData),
        });

        if (!response.ok) {
          const errorData: MasteryErrorResponse = await response.json();
          throw new Error(errorData.error || 'Failed to update mastery level');
        }

        const data: UpsertMasteryResponse = await response.json();

        // Refresh data to show updates
        await Promise.all([
          fetchStudentMastery(masteryData.student_id),
          currentSurahHeatmap ? fetchSurahHeatmap(masteryData.student_id, currentSurahHeatmap.surah) : Promise.resolve(),
        ]);

        return true;
      } catch (err) {
        console.error('Error updating ayah mastery:', err);
        setError(err instanceof Error ? err.message : 'Failed to update mastery level');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    [user, currentSurahHeatmap, fetchStudentMastery, fetchSurahHeatmap]
  );

  // ============================================================================
  // Navigation and Selection
  // ============================================================================

  /**
   * Change selected surah
   */
  const changeSurah = useCallback((surah: number) => {
    if (surah < 1 || surah > 114) {
      console.error('Invalid surah number:', surah);
      return;
    }
    setSelectedSurah(surah);
  }, []);

  /**
   * Navigate to previous surah
   */
  const navigatePreviousSurah = useCallback(() => {
    setSelectedSurah((prev) => (prev > 1 ? prev - 1 : 114)); // Wrap to last surah
  }, []);

  /**
   * Navigate to next surah
   */
  const navigateNextSurah = useCallback(() => {
    setSelectedSurah((prev) => (prev < 114 ? prev + 1 : 1)); // Wrap to first surah
  }, []);

  /**
   * Change selected student (for teacher view)
   */
  const changeStudent = useCallback((studentId: string) => {
    setSelectedStudent(studentId);
  }, []);

  // ============================================================================
  // Filter Management
  // ============================================================================

  /**
   * Update filters
   */
  const updateFilters = useCallback((newFilters: MasteryFilters) => {
    setFilters(newFilters);
  }, []);

  /**
   * Clear filters
   */
  const clearFilters = useCallback(() => {
    setFilters({});
  }, []);

  // ============================================================================
  // Helper Functions
  // ============================================================================

  /**
   * Clear current heatmap
   */
  const clearHeatmap = useCallback(() => {
    setCurrentSurahHeatmap(null);
  }, []);

  /**
   * Refresh all data
   */
  const refreshData = useCallback(() => {
    if (selectedStudent) {
      fetchStudentMastery(selectedStudent);
      if (currentSurahHeatmap) {
        fetchSurahHeatmap(selectedStudent, currentSurahHeatmap.surah);
      }
    }
  }, [selectedStudent, currentSurahHeatmap, fetchStudentMastery, fetchSurahHeatmap]);

  // ============================================================================
  // Effects
  // ============================================================================

  /**
   * Initial data fetch - fetch overview when student is selected
   */
  useEffect(() => {
    if (user && selectedStudent) {
      fetchStudentMastery(selectedStudent);
    }
  }, [user, selectedStudent]);

  /**
   * Fetch heatmap when surah changes (if student is selected)
   */
  useEffect(() => {
    if (user && selectedStudent && selectedSurah) {
      fetchSurahHeatmap(selectedStudent, selectedSurah);
    }
  }, [user, selectedStudent, selectedSurah]);

  // ============================================================================
  // Return Interface
  // ============================================================================

  return {
    // State
    isLoading,
    error,
    studentOverview,
    currentSurahHeatmap,
    selectedSurah,
    selectedStudent,
    filters,
    isSubmitting,

    // Mastery operations
    fetchStudentMastery,
    fetchSurahHeatmap,
    updateAyahMastery,

    // Navigation and selection
    changeSurah,
    navigatePreviousSurah,
    navigateNextSurah,
    changeStudent,

    // Filter management
    updateFilters,
    clearFilters,

    // Utility
    clearHeatmap,
    refreshData,
  };
}
