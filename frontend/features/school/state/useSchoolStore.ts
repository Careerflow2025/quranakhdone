import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface Teacher {
  id: string;
  name: string;
  email: string;
  subjects: string[];
  classCount: number;
  studentCount: number;
  status: 'active' | 'inactive';
  joinDate: string;
  phone?: string;
  specialization?: string;
  certifications?: string[];
  experience?: string;
  profileImage?: string;
  performance?: {
    avgStudentProgress: number;
  };
}

export interface SchoolClass {
  id: string;
  name: string;
  teacherId: string;
  teacherName: string;
  studentCount: number;
  schedule: string;
  level: string;
  room?: string;
  startDate: string;
  endDate?: string;
  status: 'active' | 'upcoming' | 'completed';
  description?: string;
}

export interface Student {
  id: string;
  name: string;
  parentName: string;
  classId: string;
  className: string;
  progress: number;
  status: 'active' | 'inactive';
  enrollmentDate: string;
  email?: string;
  phoneNumber?: string;
  dateOfBirth?: string;
  address?: string;
  emergencyContact?: string;
  medicalNotes?: string;
  parentEmail?: string;
  parentPhone?: string;
}

export interface Activity {
  id: string;
  text: string;
  time: string;
  type: 'teacher' | 'student' | 'class' | 'system' | 'event' | 'achievement';
  timestamp: Date;
}

interface SchoolState {
  // Core data
  teachers: Teacher[];
  classes: SchoolClass[];
  students: Student[];
  activities: Activity[];
  
  // Stats
  stats: {
    totalStudents: number;
    totalTeachers: number;
    totalClasses: number;
    activeStudents: number;
    avgProgress: number;
  };
  
  // UI state
  activeView: string;
  selectedTeacher: Teacher | null;
  selectedClass: SchoolClass | null;
  selectedStudent: Student | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  initializeSchoolData: () => Promise<void>;
  
  // Teacher actions
  setTeachers: (teachers: Teacher[]) => void;
  addTeacher: (teacher: Teacher) => void;
  updateTeacher: (id: string, updates: Partial<Teacher>) => void;
  removeTeacher: (id: string) => void;
  
  // Class actions
  setClasses: (classes: SchoolClass[]) => void;
  addClass: (schoolClass: SchoolClass) => void;
  updateClass: (id: string, updates: Partial<SchoolClass>) => void;
  removeClass: (id: string) => void;
  reassignClass: (classId: string, newTeacherId: string) => void;
  
  // Student actions
  setStudents: (students: Student[]) => void;
  addStudent: (student: Student) => void;
  addBulkStudents: (students: Student[]) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  removeStudent: (id: string) => void;
  
  // UI actions
  setStats: (stats: any) => void;
  setActiveView: (view: string) => void;
  setSelectedTeacher: (teacher: Teacher | null) => void;
  setSelectedClass: (schoolClass: SchoolClass | null) => void;
  setSelectedStudent: (student: Student | null) => void;
  setError: (error: string | null) => void;
}

export const useSchoolStore = create<SchoolState>((set, get) => ({
  // Initial state - empty/clean state for production
  teachers: [],
  classes: [],
  students: [],
  activities: [],
  
  stats: {
    totalStudents: 0,
    totalTeachers: 0,
    totalClasses: 0,
    activeStudents: 0,
    avgProgress: 0
  },
  
  activeView: 'dashboard',
  selectedTeacher: null,
  selectedClass: null,
  selectedStudent: null,
  isLoading: false,
  error: null,
  
  // Initialize data from database
  initializeSchoolData: async () => {
    set({ isLoading: true, error: null });
    
    try {
      // Fetch school data from Supabase
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        // In production, fetch actual data from database
        // For now, just set empty arrays
        set({
          teachers: [],
          classes: [],
          students: [],
          activities: [],
          stats: {
            totalStudents: 0,
            totalTeachers: 0,
            totalClasses: 0,
            activeStudents: 0,
            avgProgress: 0
          },
          isLoading: false
        });
      }
    } catch (error) {
      set({ 
        error: 'Failed to load school data. Please try again.',
        isLoading: false 
      });
    }
  },
  
  // Teacher actions
  setTeachers: (teachers) => set({ 
    teachers,
    stats: { 
      ...get().stats, 
      totalTeachers: teachers.length 
    }
  }),
  
  addTeacher: (teacher) => set((state) => {
    const activity: Activity = {
      id: crypto.randomUUID(),
      text: `New teacher ${teacher.name} added`,
      time: 'Just now',
      type: 'teacher',
      timestamp: new Date()
    };
    return {
      teachers: [...state.teachers, teacher],
      activities: [activity, ...state.activities].slice(0, 10),
      stats: {
        ...state.stats,
        totalTeachers: state.teachers.length + 1
      }
    };
  }),
  
  updateTeacher: (id, updates) => set((state) => ({
    teachers: state.teachers.map(t => t.id === id ? { ...t, ...updates } : t)
  })),
  
  removeTeacher: (id) => set((state) => ({
    teachers: state.teachers.filter(t => t.id !== id),
    stats: {
      ...state.stats,
      totalTeachers: state.teachers.length - 1
    }
  })),
  
  // Class actions
  setClasses: (classes) => set({ 
    classes,
    stats: { 
      ...get().stats, 
      totalClasses: classes.length 
    }
  }),
  
  addClass: (schoolClass) => set((state) => {
    const activity: Activity = {
      id: crypto.randomUUID(),
      text: `New class "${schoolClass.name}" created`,
      time: 'Just now',
      type: 'class',
      timestamp: new Date()
    };
    return {
      classes: [...state.classes, schoolClass],
      activities: [activity, ...state.activities].slice(0, 10),
      stats: {
        ...state.stats,
        totalClasses: state.classes.length + 1
      }
    };
  }),
  
  updateClass: (id, updates) => set((state) => ({
    classes: state.classes.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  
  removeClass: (id) => set((state) => ({
    classes: state.classes.filter(c => c.id !== id),
    stats: {
      ...state.stats,
      totalClasses: state.classes.length - 1
    }
  })),
  
  reassignClass: (classId, newTeacherId) => {
    const teacher = get().teachers.find(t => t.id === newTeacherId);
    if (teacher) {
      set((state) => ({
        classes: state.classes.map(c => 
          c.id === classId 
            ? { ...c, teacherId: newTeacherId, teacherName: teacher.name }
            : c
        )
      }));
    }
  },
  
  // Student actions
  setStudents: (students) => set({ 
    students,
    stats: { 
      ...get().stats, 
      totalStudents: students.length,
      activeStudents: students.filter(s => s.status === 'active').length
    }
  }),
  
  addStudent: (student) => set((state) => {
    const activity: Activity = {
      id: crypto.randomUUID(),
      text: `New student ${student.name} enrolled`,
      time: 'Just now',
      type: 'student',
      timestamp: new Date()
    };
    return {
      students: [...state.students, student],
      activities: [activity, ...state.activities].slice(0, 10),
      stats: {
        ...state.stats,
        totalStudents: state.students.length + 1,
        activeStudents: student.status === 'active' 
          ? state.stats.activeStudents + 1 
          : state.stats.activeStudents
      }
    };
  }),
  
  addBulkStudents: (newStudents) => set((state) => ({
    students: [...state.students, ...newStudents],
    stats: {
      ...state.stats,
      totalStudents: state.students.length + newStudents.length,
      activeStudents: state.stats.activeStudents + newStudents.filter(s => s.status === 'active').length
    }
  })),
  
  updateStudent: (id, updates) => set((state) => ({
    students: state.students.map(s => s.id === id ? { ...s, ...updates } : s)
  })),
  
  removeStudent: (id) => set((state) => {
    const student = state.students.find(s => s.id === id);
    return {
      students: state.students.filter(s => s.id !== id),
      stats: {
        ...state.stats,
        totalStudents: state.students.length - 1,
        activeStudents: student?.status === 'active' 
          ? state.stats.activeStudents - 1 
          : state.stats.activeStudents
      }
    };
  }),
  
  // UI actions
  setStats: (stats) => set({ stats }),
  setActiveView: (activeView) => set({ activeView }),
  setSelectedTeacher: (selectedTeacher) => set({ selectedTeacher }),
  setSelectedClass: (selectedClass) => set({ selectedClass }),
  setSelectedStudent: (selectedStudent) => set({ selectedStudent }),
  setError: (error) => set({ error })
}));