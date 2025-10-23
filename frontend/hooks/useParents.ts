/**
 * useParents Hook - Parent Management Data Fetching
 * Created: 2025-10-22
 * Purpose: Custom hook for Parent Management system following established patterns
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

// Types matching our Parents API
export interface ParentData {
  id: string;
  user_id: string;
  school_id: string;
  name?: string;
  email?: string;
  phone?: string;
  address?: string;
  created_at?: string;
}

export interface CreateParentData {
  name: string;
  email: string;
  password?: string;
  phone?: string;
  address?: string;
  studentIds?: string[];
}

export interface UpdateParentData {
  parentId: string;
  userId: string;
  name?: string;
  studentIds?: string[];
}

export function useParents() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Parents state
  const [parents, setParents] = useState<ParentData[]>([]);
  const [selectedParent, setSelectedParent] = useState<ParentData | null>(null);

  /**
   * Fetch all parents for the user's school
   */
  const fetchParents = useCallback(async (schoolId?: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Use provided schoolId or get from user
      const targetSchoolId = schoolId || user?.schoolId;

      if (!targetSchoolId) {
        throw new Error('School ID not available');
      }

      const params = new URLSearchParams({
        school_id: targetSchoolId,
      });

      const response = await fetch(`/api/parents?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch parents: ${response.status}`);
      }

      const data = await response.json();

      setParents(data.data || []);
      return { success: true, data: data.data || [] };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch parents';
      setError(errorMessage);
      console.error('Fetch parents error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user?.schoolId]);

  /**
   * Create a new parent
   */
  const createParent = useCallback(async (parentData: CreateParentData) => {
    try {
      setError(null);

      // Get Bearer token from current session
      const authHeader = await fetch('/api/auth/session', {
        credentials: 'include',
      }).then(res => res.json()).then(data => data.token);

      const response = await fetch('/api/school/create-parent', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader ? `Bearer ${authHeader}` : '',
        },
        body: JSON.stringify(parentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create parent: ${response.status}`);
      }

      const data = await response.json();
      const newParent = data.parent;

      // Add to local state if we have parent data
      if (newParent) {
        setParents(prev => [...prev, newParent]);
      }

      return { success: true, data: newParent, credentials: data.credentials };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create parent';
      setError(errorMessage);
      console.error('Create parent error:', err);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Update an existing parent
   */
  const updateParent = useCallback(async (updateData: UpdateParentData) => {
    try {
      setError(null);

      const response = await fetch(`/api/school/update-parent`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update parent: ${response.status}`);
      }

      const data = await response.json();
      const updatedParent = data.data || data.parent;

      // Update local state
      if (updatedParent) {
        setParents(prev =>
          prev.map(parent => parent.id === updateData.parentId ? updatedParent : parent)
        );

        // Update selected parent if it's the one being edited
        if (selectedParent?.id === updateData.parentId) {
          setSelectedParent(updatedParent);
        }
      }

      return { success: true, data: updatedParent };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update parent';
      setError(errorMessage);
      console.error('Update parent error:', err);
      return { success: false, error: errorMessage };
    }
  }, [selectedParent]);

  /**
   * Delete one or more parents (bulk operation)
   */
  const deleteParents = useCallback(async (parentIds: string[]) => {
    try {
      setError(null);

      const response = await fetch(`/api/school/delete-parents`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ parentIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete parents: ${response.status}`);
      }

      // Remove from local state
      setParents(prev => prev.filter(parent => !parentIds.includes(parent.id)));

      // Clear selected parent if it was deleted
      if (selectedParent && parentIds.includes(selectedParent.id)) {
        setSelectedParent(null);
      }

      return { success: true };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete parents';
      setError(errorMessage);
      console.error('Delete parents error:', err);
      return { success: false, error: errorMessage };
    }
  }, [selectedParent]);

  /**
   * Delete a single parent (convenience method)
   */
  const deleteParent = useCallback(async (parentId: string) => {
    return await deleteParents([parentId]);
  }, [deleteParents]);

  /**
   * Get a single parent by ID
   */
  const getParentById = useCallback((parentId: string): ParentData | undefined => {
    return parents.find(parent => parent.id === parentId);
  }, [parents]);

  /**
   * Search parents by name or email
   */
  const searchParents = useCallback((query: string): ParentData[] => {
    const lowerQuery = query.toLowerCase();
    return parents.filter(parent => {
      const name = (parent.name || '').toLowerCase();
      const email = (parent.email || '').toLowerCase();

      return name.includes(lowerQuery) || email.includes(lowerQuery);
    });
  }, [parents]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh parents list
   */
  const refreshParents = useCallback(async () => {
    return await fetchParents();
  }, [fetchParents]);

  // Auto-fetch parents on mount if user has schoolId
  useEffect(() => {
    if (user?.schoolId) {
      fetchParents(user.schoolId);
    }
  }, [user?.schoolId, fetchParents]);

  return {
    // State
    parents,
    selectedParent,
    isLoading,
    error,

    // Actions
    fetchParents,
    createParent,
    updateParent,
    deleteParent,
    deleteParents,
    refreshParents,

    // Utilities
    getParentById,
    searchParents,
    setSelectedParent,
    clearError,
  };
}
