/**
 * School Store - Zustand store for school-level data
 * Manages classes, students, and teachers data
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from '@/lib/supabase';

interface Class {
  id: string;
  name: string;
  school_id: string;
  room?: string;
  schedule_json?: any;
  created_by?: string;
  created_at?: string;
}

interface Student {
  id: string;
  user_id: string;
  school_id: string;
  dob?: string;
  gender?: string;
  active: boolean;
  created_at?: string;
  profiles?: {
    display_name?: string;
    email?: string;
  };
}

interface Teacher {
  id: string;
  user_id: string;
  school_id: string;
  bio?: string;
  active: boolean;
  created_at?: string;
  profiles?: {
    display_name?: string;
    email?: string;
  };
}

interface SchoolState {
  classes: Class[];
  students: Student[];
  teachers: Teacher[];
  isLoading: boolean;
  error: string | null;

  // Actions
  setClasses: (classes: Class[]) => void;
  setStudents: (students: Student[]) => void;
  setTeachers: (teachers: Teacher[]) => void;
  fetchSchoolData: (schoolId: string) => Promise<void>;
  clearSchoolData: () => void;
}

export const useSchoolStore = create<SchoolState>()(
  persist(
    (set) => ({
      classes: [],
      students: [],
      teachers: [],
      isLoading: false,
      error: null,

      setClasses: (classes: Class[]) => {
        set({ classes });
      },

      setStudents: (students: Student[]) => {
        set({ students });
      },

      setTeachers: (teachers: Teacher[]) => {
        set({ teachers });
      },

      fetchSchoolData: async (schoolId: string) => {
        set({ isLoading: true, error: null });

        try {
          // Get session for authorization
          const { data: { session } } = await supabase.auth.getSession();
          if (!session) {
            throw new Error('Please login to access school data');
          }

          // Fetch classes
          const classesResponse = await fetch(`/api/classes?school_id=${schoolId}`, {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });

          if (classesResponse.ok) {
            const classesData = await classesResponse.json();
            set({ classes: classesData.classes || [] });
          }

          // Fetch students
          const studentsResponse = await fetch(`/api/school/students?school_id=${schoolId}`, {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });

          if (studentsResponse.ok) {
            const studentsData = await studentsResponse.json();
            set({ students: studentsData.students || [] });
          }

          // Fetch teachers
          const teachersResponse = await fetch(`/api/school/teachers?school_id=${schoolId}`, {
            credentials: 'include',
            headers: {
              'Authorization': `Bearer ${session.access_token}`,
            },
          });

          if (teachersResponse.ok) {
            const teachersData = await teachersResponse.json();
            set({ teachers: teachersData.teachers || [] });
          }

          set({ isLoading: false });
        } catch (error: any) {
          set({
            isLoading: false,
            error: error.message || 'Failed to fetch school data'
          });
        }
      },

      clearSchoolData: () => {
        set({
          classes: [],
          students: [],
          teachers: [],
          isLoading: false,
          error: null,
        });
      },
    }),
    {
      name: 'school-storage',
      partialize: (state) => ({
        classes: state.classes,
        students: state.students,
        teachers: state.teachers,
      }),
    }
  )
);
