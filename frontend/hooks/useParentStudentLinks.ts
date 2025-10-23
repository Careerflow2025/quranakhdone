/**
 * useParentStudentLinks Hook - Parent-Student Linking Management
 * Created: 2025-10-22
 * Purpose: Custom hook for managing parent-student relationships
 */

import { useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

// Types for linking operations
export interface ChildData {
  student_id: string;
  students: {
    id: string;
    user_id: string;
    school_id: string;
    dob?: string;
    gender?: string;
    active?: boolean;
    profiles: {
      display_name: string;
      email: string;
    } | null;
  } | null;
}

export interface LinkStudentData {
  parent_id: string;
  student_id: string;
}

export interface UnlinkStudentData {
  parent_id: string;
  student_id: string;
}

export function useParentStudentLinks() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Get all children for a parent
   */
  const getChildren = useCallback(async (parentId: string) => {
    try {
      setIsLoading(true);
      setError(null);

      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please login to access children');
      }

      const params = new URLSearchParams({
        parent_id: parentId,
      });

      const response = await fetch(`/api/school/link-parent-student?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch children: ${response.status}`);
      }

      const data = await response.json();

      // Transform the nested data structure to a flat array
      const children = (data.children || []).map((link: ChildData) => ({
        id: link.students?.id || '',
        user_id: link.students?.user_id || '',
        school_id: link.students?.school_id || '',
        name: link.students?.profiles?.display_name || '',
        email: link.students?.profiles?.email || '',
        dob: link.students?.dob,
        gender: link.students?.gender,
        active: link.students?.active,
      }));

      return { success: true, data: children };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch children';
      setError(errorMessage);
      console.error('Get children error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Link a parent to a student
   */
  const linkStudent = useCallback(async (linkData: LinkStudentData) => {
    try {
      setError(null);

      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please login to link students');
      }

      const response = await fetch('/api/school/link-parent-student', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify(linkData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to link student: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        link: data.link,
        total_children: data.total_children
      };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to link student';
      setError(errorMessage);
      console.error('Link student error:', err);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Unlink a parent from a student
   */
  const unlinkStudent = useCallback(async (unlinkData: UnlinkStudentData) => {
    try {
      setError(null);

      // Get session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Please login to unlink students');
      }

      const params = new URLSearchParams({
        parent_id: unlinkData.parent_id,
        student_id: unlinkData.student_id,
      });

      const response = await fetch(`/api/school/link-parent-student?${params.toString()}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to unlink student: ${response.status}`);
      }

      const data = await response.json();

      return { success: true };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to unlink student';
      setError(errorMessage);
      console.error('Unlink student error:', err);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Refresh children list for a parent
   */
  const refreshChildren = useCallback(async (parentId: string) => {
    return await getChildren(parentId);
  }, [getChildren]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    // State
    isLoading,
    error,

    // Actions
    getChildren,
    linkStudent,
    unlinkStudent,
    refreshChildren,

    // Utilities
    clearError,
  };
}
