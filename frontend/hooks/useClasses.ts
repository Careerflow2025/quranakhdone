/**
 * useClasses Hook - Class Management Data Fetching
 * Created: 2025-10-22
 * Purpose: Custom hook for Classes system following established patterns
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

// Types matching our Classes API
export interface ClassData {
  id: string;
  school_id: string;
  name: string;
  code: string;
  level: string;
  schedule: ScheduleData | null;
  created_at?: string;
  updated_at?: string;
}

export interface ScheduleData {
  days?: string[]; // ['monday', 'wednesday', 'friday']
  time?: string; // '10:00 AM'
  duration?: number; // minutes
  room?: string;
  [key: string]: any; // Allow additional schedule fields
}

export interface CreateClassData {
  school_id: string;
  name: string;
  code: string;
  level: string;
  schedule?: ScheduleData;
}

export interface UpdateClassData {
  name?: string;
  code?: string;
  level?: string;
  schedule?: ScheduleData;
}

export interface ClassWithStats extends ClassData {
  student_count?: number;
  teacher_count?: number;
}

export function useClasses() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Classes state
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);

  /**
   * Fetch all classes for the user's school
   */
  const fetchClasses = useCallback(async (schoolId?: string) => {
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

      const response = await fetch(`/api/classes?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch classes: ${response.status}`);
      }

      const data = await response.json();

      setClasses(data.data || []);
      return { success: true, data: data.data || [] };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch classes';
      setError(errorMessage);
      console.error('Fetch classes error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user?.schoolId]);

  /**
   * Create a new class
   */
  const createClass = useCallback(async (classData: CreateClassData) => {
    try {
      setError(null);

      const response = await fetch('/api/classes', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(classData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create class: ${response.status}`);
      }

      const data = await response.json();
      const newClass = data.data;

      // Add to local state
      setClasses(prev => [...prev, newClass]);

      return { success: true, data: newClass };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create class';
      setError(errorMessage);
      console.error('Create class error:', err);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Update an existing class
   */
  const updateClass = useCallback(async (classId: string, updates: UpdateClassData) => {
    try {
      setError(null);

      const response = await fetch(`/api/classes/${classId}`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update class: ${response.status}`);
      }

      const data = await response.json();
      const updatedClass = data.data;

      // Update local state
      setClasses(prev =>
        prev.map(cls => cls.id === classId ? updatedClass : cls)
      );

      // Update selected class if it's the one being edited
      if (selectedClass?.id === classId) {
        setSelectedClass(updatedClass);
      }

      return { success: true, data: updatedClass };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update class';
      setError(errorMessage);
      console.error('Update class error:', err);
      return { success: false, error: errorMessage };
    }
  }, [selectedClass]);

  /**
   * Delete a class
   */
  const deleteClass = useCallback(async (classId: string) => {
    try {
      setError(null);

      const response = await fetch(`/api/classes/${classId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete class: ${response.status}`);
      }

      // Remove from local state
      setClasses(prev => prev.filter(cls => cls.id !== classId));

      // Clear selected class if it was deleted
      if (selectedClass?.id === classId) {
        setSelectedClass(null);
      }

      return { success: true };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete class';
      setError(errorMessage);
      console.error('Delete class error:', err);
      return { success: false, error: errorMessage };
    }
  }, [selectedClass]);

  /**
   * Get a single class by ID
   */
  const getClassById = useCallback((classId: string): ClassData | undefined => {
    return classes.find(cls => cls.id === classId);
  }, [classes]);

  /**
   * Filter classes by level
   */
  const getClassesByLevel = useCallback((level: string): ClassData[] => {
    return classes.filter(cls => cls.level === level);
  }, [classes]);

  /**
   * Search classes by name or code
   */
  const searchClasses = useCallback((query: string): ClassData[] => {
    const lowerQuery = query.toLowerCase();
    return classes.filter(cls =>
      cls.name.toLowerCase().includes(lowerQuery) ||
      cls.code.toLowerCase().includes(lowerQuery)
    );
  }, [classes]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh classes list
   */
  const refreshClasses = useCallback(async () => {
    return await fetchClasses();
  }, [fetchClasses]);

  // Auto-fetch classes on mount if user has schoolId
  useEffect(() => {
    if (user?.schoolId) {
      fetchClasses(user.schoolId);
    }
  }, [user?.schoolId, fetchClasses]);

  return {
    // State
    classes,
    selectedClass,
    isLoading,
    error,

    // Actions
    fetchClasses,
    createClass,
    updateClass,
    deleteClass,
    refreshClasses,

    // Utilities
    getClassById,
    getClassesByLevel,
    searchClasses,
    setSelectedClass,
    clearError,
  };
}
