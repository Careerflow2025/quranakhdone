/**
 * useStudents Hook - Student Management Data Fetching
 * Created: 2025-10-22
 * Purpose: Custom hook for Student Management system following established patterns
 */

import { useState, useEffect, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';

// Types matching our Students API
export interface StudentData {
  id: string;
  user_id: string;
  school_id: string;
  first_name?: string;
  last_name?: string;
  name?: string; // Some endpoints use 'name' field
  email?: string;
  age?: number;
  gender?: string;
  grade?: string;
  address?: string;
  phone?: string;
  dob?: string;
  active?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface CreateStudentData {
  name: string;
  email: string;
  age?: number;
  gender?: string;
  grade?: string;
  address?: string;
  phone?: string;
  parent?: {
    name?: string;
    email?: string;
    phone?: string;
  };
}

export interface UpdateStudentData {
  id: string;
  name?: string;
  email?: string;
  age?: number;
  gender?: string;
  grade?: string;
  address?: string;
  phone?: string;
  active?: boolean;
}

export interface BulkCreateStudentData {
  students: CreateStudentData[];
}

export function useStudents() {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Students state
  const [students, setStudents] = useState<StudentData[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<StudentData | null>(null);

  /**
   * Fetch all students for the user's school
   */
  const fetchStudents = useCallback(async (schoolId?: string) => {
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

      const response = await fetch(`/api/students?${params.toString()}`, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to fetch students: ${response.status}`);
      }

      const data = await response.json();

      setStudents(data.data || []);
      return { success: true, data: data.data || [] };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to fetch students';
      setError(errorMessage);
      console.error('Fetch students error:', err);
      return { success: false, error: errorMessage };
    } finally {
      setIsLoading(false);
    }
  }, [user?.schoolId]);

  /**
   * Create a new student
   */
  const createStudent = useCallback(async (studentData: CreateStudentData) => {
    try {
      setError(null);

      // Get Bearer token from current session
      const authHeader = await fetch('/api/auth/session', {
        credentials: 'include',
      }).then(res => res.json()).then(data => data.token);

      const response = await fetch('/api/school/create-student', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader ? `Bearer ${authHeader}` : '',
        },
        body: JSON.stringify(studentData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to create student: ${response.status}`);
      }

      const data = await response.json();
      const newStudent = data.student;

      // Add to local state if we have student data
      if (newStudent) {
        setStudents(prev => [...prev, newStudent]);
      }

      return { success: true, data: newStudent, credentials: data.credentials };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to create student';
      setError(errorMessage);
      console.error('Create student error:', err);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Update an existing student
   */
  const updateStudent = useCallback(async (studentId: string, updates: UpdateStudentData) => {
    try {
      setError(null);

      const response = await fetch(`/api/school/update-student`, {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: studentId,
          ...updates,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to update student: ${response.status}`);
      }

      const data = await response.json();
      const updatedStudent = data.data || data.student;

      // Update local state
      if (updatedStudent) {
        setStudents(prev =>
          prev.map(student => student.id === studentId ? updatedStudent : student)
        );

        // Update selected student if it's the one being edited
        if (selectedStudent?.id === studentId) {
          setSelectedStudent(updatedStudent);
        }
      }

      return { success: true, data: updatedStudent };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to update student';
      setError(errorMessage);
      console.error('Update student error:', err);
      return { success: false, error: errorMessage };
    }
  }, [selectedStudent]);

  /**
   * Delete one or more students (bulk operation)
   */
  const deleteStudents = useCallback(async (studentIds: string[]) => {
    try {
      setError(null);

      const response = await fetch(`/api/school/delete-students`, {
        method: 'DELETE',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ studentIds }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to delete students: ${response.status}`);
      }

      // Remove from local state
      setStudents(prev => prev.filter(student => !studentIds.includes(student.id)));

      // Clear selected student if it was deleted
      if (selectedStudent && studentIds.includes(selectedStudent.id)) {
        setSelectedStudent(null);
      }

      return { success: true };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to delete students';
      setError(errorMessage);
      console.error('Delete students error:', err);
      return { success: false, error: errorMessage };
    }
  }, [selectedStudent]);

  /**
   * Delete a single student (convenience method)
   */
  const deleteStudent = useCallback(async (studentId: string) => {
    return await deleteStudents([studentId]);
  }, [deleteStudents]);

  /**
   * Bulk create students from import
   */
  const bulkCreateStudents = useCallback(async (bulkData: BulkCreateStudentData) => {
    try {
      setError(null);

      // Get Bearer token from current session
      const authHeader = await fetch('/api/auth/session', {
        credentials: 'include',
      }).then(res => res.json()).then(data => data.token);

      const response = await fetch('/api/school/bulk-create-students', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader ? `Bearer ${authHeader}` : '',
        },
        body: JSON.stringify(bulkData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Failed to bulk create students: ${response.status}`);
      }

      const data = await response.json();
      const newStudents = data.students || [];

      // Add to local state
      if (newStudents.length > 0) {
        setStudents(prev => [...prev, ...newStudents]);
      }

      return { success: true, data: newStudents, count: newStudents.length };

    } catch (err: any) {
      const errorMessage = err.message || 'Failed to bulk create students';
      setError(errorMessage);
      console.error('Bulk create students error:', err);
      return { success: false, error: errorMessage };
    }
  }, []);

  /**
   * Get a single student by ID
   */
  const getStudentById = useCallback((studentId: string): StudentData | undefined => {
    return students.find(student => student.id === studentId);
  }, [students]);

  /**
   * Filter students by grade
   */
  const getStudentsByGrade = useCallback((grade: string): StudentData[] => {
    return students.filter(student => student.grade === grade);
  }, [students]);

  /**
   * Filter students by gender
   */
  const getStudentsByGender = useCallback((gender: string): StudentData[] => {
    return students.filter(student => student.gender === gender);
  }, [students]);

  /**
   * Search students by name or email
   */
  const searchStudents = useCallback((query: string): StudentData[] => {
    const lowerQuery = query.toLowerCase();
    return students.filter(student => {
      const fullName = `${student.first_name || ''} ${student.last_name || ''}`.toLowerCase();
      const name = (student.name || '').toLowerCase();
      const email = (student.email || '').toLowerCase();

      return fullName.includes(lowerQuery) ||
             name.includes(lowerQuery) ||
             email.includes(lowerQuery);
    });
  }, [students]);

  /**
   * Clear error state
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Refresh students list
   */
  const refreshStudents = useCallback(async () => {
    return await fetchStudents();
  }, [fetchStudents]);

  // Auto-fetch students on mount if user has schoolId
  useEffect(() => {
    if (user?.schoolId) {
      fetchStudents(user.schoolId);
    }
  }, [user?.schoolId, fetchStudents]);

  return {
    // State
    students,
    selectedStudent,
    isLoading,
    error,

    // Actions
    fetchStudents,
    createStudent,
    updateStudent,
    deleteStudent,
    deleteStudents,
    bulkCreateStudents,
    refreshStudents,

    // Utilities
    getStudentById,
    getStudentsByGrade,
    getStudentsByGender,
    searchStudents,
    setSelectedStudent,
    clearError,
  };
}
