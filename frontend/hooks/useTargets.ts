/**
 * useTargets Hook
 * Custom React hook for managing student targets (goals) system
 *
 * Created: 2025-10-22
 * Purpose: State management and API integration for targets workflow
 * Pattern: Follows useAttendance.ts and useHomework.ts patterns
 *
 * Features:
 * - Fetch targets with filtering and pagination
 * - Create individual/class/school targets
 * - Update target progress and status
 * - Delete targets
 * - Milestone management
 * - Role-based functionality
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import {
  TargetWithDetails,
  CreateTargetRequest,
  UpdateTargetProgressRequest,
  ListTargetsQuery,
  TargetType,
  TargetStatus,
  Milestone,
  CreateMilestoneRequest,
} from '@/lib/types/targets';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

interface TargetFilters {
  student_id?: string;
  class_id?: string;
  teacher_id?: string;
  type?: TargetType;
  status?: TargetStatus;
  category?: string;
  search?: string;
  include_completed?: boolean;
  sort_by?: 'created_at' | 'due_date' | 'title' | 'progress';
  sort_order?: 'asc' | 'desc';
}

interface TargetPagination {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
}

interface UpdateTargetRequest {
  title?: string;
  description?: string;
  type?: TargetType;
  category?: string;
  student_id?: string;
  class_id?: string;
  start_date?: string;
  due_date?: string;
}

interface UseTargetsReturn {
  // State
  targets: TargetWithDetails[];
  selectedTarget: TargetWithDetails | null;
  isLoading: boolean;
  isLoadingTarget: boolean;
  error: string | null;
  pagination: TargetPagination;
  filters: TargetFilters;

  // Target operations
  fetchTargets: (customFilters?: TargetFilters, page?: number) => Promise<{ success: boolean; data?: TargetWithDetails[]; error?: string }>;
  fetchTargetById: (targetId: string) => Promise<{ success: boolean; data?: TargetWithDetails; error?: string }>;
  createTarget: (data: CreateTargetRequest) => Promise<{ success: boolean; data?: TargetWithDetails; error?: string }>;
  updateTarget: (targetId: string, data: UpdateTargetRequest) => Promise<{ success: boolean; data?: TargetWithDetails; error?: string }>;
  updateTargetProgress: (targetId: string, data: UpdateTargetProgressRequest) => Promise<{ success: boolean; data?: TargetWithDetails; error?: string }>;
  deleteTarget: (targetId: string) => Promise<{ success: boolean; error?: string }>;

  // Filter & pagination management
  updateFilters: (newFilters: Partial<TargetFilters>) => void;
  clearFilters: () => void;
  changePage: (page: number) => void;

  // Utilities
  refreshTargets: () => Promise<void>;
  setSelectedTarget: (target: TargetWithDetails | null) => void;
  clearError: () => void;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export function useTargets(): UseTargetsReturn {
  const { user } = useAuthStore();

  // State management
  const [targets, setTargets] = useState<TargetWithDetails[]>([]);
  const [selectedTarget, setSelectedTarget] = useState<TargetWithDetails | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingTarget, setIsLoadingTarget] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<TargetPagination>({
    page: 1,
    limit: 20,
    total: 0,
    total_pages: 0,
  });
  const [filters, setFilters] = useState<TargetFilters>({
    include_completed: true,
    sort_by: 'created_at',
    sort_order: 'desc',
  });

  // ============================================================================
  // FETCH TARGETS
  // ============================================================================

  const fetchTargets = useCallback(
    async (customFilters?: TargetFilters, page = 1) => {
      try {
        setIsLoading(true);
        setError(null);

        const activeFilters = customFilters || filters;

        // Build query parameters
        const params = new URLSearchParams();
        if (activeFilters.student_id) params.append('student_id', activeFilters.student_id);
        if (activeFilters.class_id) params.append('class_id', activeFilters.class_id);
        if (activeFilters.teacher_id) params.append('teacher_id', activeFilters.teacher_id);
        if (activeFilters.type) params.append('type', activeFilters.type);
        if (activeFilters.status) params.append('status', activeFilters.status);
        if (activeFilters.category) params.append('category', activeFilters.category);
        if (activeFilters.search) params.append('search', activeFilters.search);
        if (activeFilters.include_completed !== undefined) {
          params.append('include_completed', String(activeFilters.include_completed));
        }
        if (activeFilters.sort_by) params.append('sort_by', activeFilters.sort_by);
        if (activeFilters.sort_order) params.append('sort_order', activeFilters.sort_order);
        params.append('page', String(page));
        params.append('limit', String(pagination.limit));

        // Get session for authorization
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const errorMessage = 'Please login to view targets';
          setError(errorMessage);
          setIsLoading(false);
          return { success: false, error: errorMessage };
        }

        const response = await fetch(`/api/targets?${params.toString()}`, {
          method: 'GET',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        const data = await response.json();

        if (!response.ok) {
          const errorMessage = data.error || 'Failed to fetch targets';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }

        setTargets(data.targets || []);
        setPagination(data.pagination || pagination);

        return { success: true, data: data.targets };
      } catch (err: any) {
        const errorMessage = err.message || 'An unexpected error occurred';
        setError(errorMessage);
        console.error('Error fetching targets:', err);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [filters, pagination.limit]
  );

  // ============================================================================
  // FETCH SINGLE TARGET
  // ============================================================================

  const fetchTargetById = useCallback(async (targetId: string) => {
    try {
      setIsLoadingTarget(true);
      setError(null);

      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        const errorMessage = 'Please login to view target details';
        setError(errorMessage);
        setIsLoadingTarget(false);
        return { success: false, error: errorMessage };
      }

      const response = await fetch(`/api/targets/${targetId}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        const errorMessage = data.error || 'Failed to fetch target';
        setError(errorMessage);
        return { success: false, error: errorMessage };
      }

      setSelectedTarget(data.target);
      return { success: true, data: data.target };
    } catch (err: any) {
      const errorMessage = err.message || 'An unexpected error occurred';
      setError(errorMessage);
      console.error('Error fetching target:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoadingTarget(false);
    }
  }, []);

  // ============================================================================
  // CREATE TARGET
  // ============================================================================

  const createTarget = useCallback(
    async (data: CreateTargetRequest) => {
      try {
        setIsLoading(true);
        setError(null);

        // Get session for authorization
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const errorMessage = 'Please login to create target';
          setError(errorMessage);
          setIsLoading(false);
          return { success: false, error: errorMessage };
        }

        const response = await fetch('/api/targets', {
          method: 'POST',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          const errorMessage = result.error || 'Failed to create target';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }

        // Refresh targets list after creation
        await fetchTargets(filters, pagination.page);

        return { success: true, data: result.target };
      } catch (err: any) {
        const errorMessage = err.message || 'An unexpected error occurred';
        setError(errorMessage);
        console.error('Error creating target:', err);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [fetchTargets, filters, pagination.page]
  );

  // ============================================================================
  // UPDATE TARGET
  // ============================================================================

  const updateTarget = useCallback(
    async (targetId: string, data: UpdateTargetRequest) => {
      try {
        setIsLoading(true);
        setError(null);

        // Get session for authorization
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const errorMessage = 'Please login to update target';
          setError(errorMessage);
          setIsLoading(false);
          return { success: false, error: errorMessage };
        }

        const response = await fetch(`/api/targets/${targetId}`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          const errorMessage = result.error || 'Failed to update target';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }

        // Update local state
        setTargets((prev) =>
          prev.map((target) =>
            target.id === targetId ? { ...target, ...result.target } : target
          )
        );

        if (selectedTarget?.id === targetId) {
          setSelectedTarget((prev) => (prev ? { ...prev, ...result.target } : null));
        }

        // Refresh targets list to get updated data
        await fetchTargets(filters, pagination.page);

        return { success: true, data: result.target };
      } catch (err: any) {
        const errorMessage = err.message || 'An unexpected error occurred';
        setError(errorMessage);
        console.error('Error updating target:', err);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [selectedTarget, fetchTargets, filters, pagination.page]
  );

  // ============================================================================
  // UPDATE TARGET PROGRESS
  // ============================================================================

  const updateTargetProgress = useCallback(
    async (targetId: string, data: UpdateTargetProgressRequest) => {
      try {
        setIsLoading(true);
        setError(null);

        // Get session for authorization
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const errorMessage = 'Please login to update target progress';
          setError(errorMessage);
          setIsLoading(false);
          return { success: false, error: errorMessage };
        }

        const response = await fetch(`/api/targets/${targetId}/progress`, {
          method: 'PATCH',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          const errorMessage = result.error || 'Failed to update target progress';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }

        // Update local state
        setTargets((prev) =>
          prev.map((target) =>
            target.id === targetId ? { ...target, ...result.target } : target
          )
        );

        if (selectedTarget?.id === targetId) {
          setSelectedTarget((prev) => (prev ? { ...prev, ...result.target } : null));
        }

        return { success: true, data: result.target };
      } catch (err: any) {
        const errorMessage = err.message || 'An unexpected error occurred';
        setError(errorMessage);
        console.error('Error updating target progress:', err);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [selectedTarget]
  );

  // ============================================================================
  // DELETE TARGET
  // ============================================================================

  const deleteTarget = useCallback(
    async (targetId: string) => {
      try {
        setIsLoading(true);
        setError(null);

        // Get session for authorization
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          const errorMessage = 'Please login to delete target';
          setError(errorMessage);
          setIsLoading(false);
          return { success: false, error: errorMessage };
        }

        const response = await fetch(`/api/targets/${targetId}`, {
          method: 'DELETE',
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
        });

        const result = await response.json();

        if (!response.ok) {
          const errorMessage = result.error || 'Failed to delete target';
          setError(errorMessage);
          return { success: false, error: errorMessage };
        }

        // Remove from local state
        setTargets((prev) => prev.filter((target) => target.id !== targetId));

        if (selectedTarget?.id === targetId) {
          setSelectedTarget(null);
        }

        return { success: true };
      } catch (err: any) {
        const errorMessage = err.message || 'An unexpected error occurred';
        setError(errorMessage);
        console.error('Error deleting target:', err);
        return { success: false, error: errorMessage };
      } finally {
        setIsLoading(false);
      }
    },
    [selectedTarget]
  );

  // ============================================================================
  // FILTER MANAGEMENT
  // ============================================================================

  const updateFilters = useCallback((newFilters: Partial<TargetFilters>) => {
    setFilters((prev) => ({ ...prev, ...newFilters }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      include_completed: true,
      sort_by: 'created_at',
      sort_order: 'desc',
    });
  }, []);

  // ============================================================================
  // PAGINATION MANAGEMENT
  // ============================================================================

  const changePage = useCallback(
    (page: number) => {
      if (page >= 1 && page <= pagination.total_pages) {
        fetchTargets(filters, page);
      }
    },
    [filters, pagination.total_pages, fetchTargets]
  );

  // ============================================================================
  // UTILITIES
  // ============================================================================

  const refreshTargets = useCallback(async () => {
    await fetchTargets(filters, pagination.page);
  }, [filters, pagination.page, fetchTargets]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // ============================================================================
  // INITIAL LOAD
  // ============================================================================

  useEffect(() => {
    if (user) {
      fetchTargets(filters, 1);
    }
  }, [user]); // Only run on mount and when user changes

  // Re-fetch when filters change
  useEffect(() => {
    if (user) {
      fetchTargets(filters, 1);
    }
  }, [filters.type, filters.status, filters.category, filters.search]); // Watch filter changes

  // ============================================================================
  // REAL-TIME SUBSCRIPTIONS
  // ============================================================================

  useEffect(() => {
    if (!user) return;

    // Subscribe to targets table changes
    const targetsChannel = supabase
      .channel('targets-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'targets',
        },
        (payload) => {
          console.log('Targets change received:', payload);
          // Refresh targets list when any change occurs
          refreshTargets();
        }
      )
      .subscribe();

    // Subscribe to target_milestones table changes
    const milestonesChannel = supabase
      .channel('milestones-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'target_milestones',
        },
        (payload) => {
          console.log('Milestones change received:', payload);
          // Refresh targets list when any change occurs
          refreshTargets();
          // Also refresh selected target if it's open
          if (selectedTarget) {
            fetchTargetById(selectedTarget.id);
          }
        }
      )
      .subscribe();

    // Cleanup subscriptions on unmount
    return () => {
      supabase.removeChannel(targetsChannel);
      supabase.removeChannel(milestonesChannel);
    };
  }, [user, selectedTarget]); // Re-subscribe when user or selectedTarget changes

  // ============================================================================
  // RETURN HOOK INTERFACE
  // ============================================================================

  return {
    // State
    targets,
    selectedTarget,
    isLoading,
    isLoadingTarget,
    error,
    pagination,
    filters,

    // Target operations
    fetchTargets,
    fetchTargetById,
    createTarget,
    updateTarget,
    updateTargetProgress,
    deleteTarget,

    // Filter & pagination management
    updateFilters,
    clearFilters,
    changePage,

    // Utilities
    refreshTargets,
    setSelectedTarget,
    clearError,
  };
}

export default useTargets;
