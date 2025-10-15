import { create } from 'zustand';

export interface Student {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  parentName?: string;
  parentEmail?: string;
  parentPhone?: string;
  assignedClasses: string[]; // Array of class IDs this student is assigned to
}

export interface Class {
  id: string;
  name: string;
  code?: string;
  schedule?: {
    days: string[];
    start: string;
    end: string;
  };
  color: string;
  icon: string;
  capacity: number;
  active: boolean;
  semester?: string;
  room?: string;
  studentCount: number;
  students: Student[];
  displayOrder: number;
  teacherId?: string;
}

interface DashboardState {
  // Classes
  classes: Class[];
  selectedClass: Class | null;
  isAddClassModalOpen: boolean;
  isClassDetailModalOpen: boolean;
  
  // Students
  importedStudents: Student[];
  searchQuery: string;
  isStudentSidebarOpen: boolean;
  draggedStudent: Student | null;
  
  // UI Settings
  cardsPerRow: number;
  viewMode: 'cards' | 'list' | 'calendar';
  isLoading: boolean;
  error: string | null;
  
  // Actions - Classes
  setClasses: (classes: Class[]) => void;
  addClass: (classData: Partial<Class>) => void;
  updateClass: (id: string, updates: Partial<Class>) => void;
  deleteClass: (id: string) => void;
  selectClass: (classData: Class | null) => void;
  setAddClassModalOpen: (open: boolean) => void;
  setClassDetailModalOpen: (open: boolean) => void;
  
  // Actions - Students
  setImportedStudents: (students: Student[]) => void;
  addStudentToClass: (studentId: string, classId: string) => void;
  removeStudentFromClass: (studentId: string, classId: string) => void;
  setSearchQuery: (query: string) => void;
  setStudentSidebarOpen: (open: boolean) => void;
  setDraggedStudent: (student: Student | null) => void;
  
  // Actions - UI
  setCardsPerRow: (num: number) => void;
  setViewMode: (mode: 'cards' | 'list' | 'calendar') => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  
  // Utility
  getClassById: (id: string) => Class | undefined;
  getUnassignedStudents: () => Student[];
  getClassStudents: (classId: string) => Student[];
}

export const useDashboardStore = create<DashboardState>((set, get) => ({
  // Initial state
  classes: [],
  selectedClass: null,
  isAddClassModalOpen: false,
  isClassDetailModalOpen: false,
  
  importedStudents: [],
  searchQuery: '',
  isStudentSidebarOpen: true,
  draggedStudent: null,
  
  cardsPerRow: 3,
  viewMode: 'cards',
  isLoading: false,
  error: null,
  
  // Class actions
  setClasses: (classes) => set({ classes }),
  
  addClass: (classData) => {
    const newClass: Class = {
      id: crypto.randomUUID(),
      name: classData.name || 'New Class',
      color: classData.color || '#10b981',
      icon: classData.icon || 'book-open',
      capacity: classData.capacity || 30,
      active: true,
      studentCount: 0,
      students: [],
      displayOrder: get().classes.length,
      ...classData
    };
    set((state) => ({ classes: [...state.classes, newClass] }));
  },
  
  updateClass: (id, updates) => {
    set((state) => ({
      classes: state.classes.map((c) =>
        c.id === id ? { ...c, ...updates } : c
      )
    }));
  },
  
  deleteClass: (id) => {
    set((state) => ({
      classes: state.classes.filter((c) => c.id !== id)
    }));
  },
  
  selectClass: (classData) => set({ selectedClass: classData }),
  setAddClassModalOpen: (open) => set({ isAddClassModalOpen: open }),
  setClassDetailModalOpen: (open) => set({ isClassDetailModalOpen: open }),
  
  // Student actions
  setImportedStudents: (students) => set({ importedStudents: students }),
  
  addStudentToClass: (studentId, classId) => {
    set((state) => {
      const student = state.importedStudents.find((s) => s.id === studentId);
      if (!student) return state;
      
      // Check if student is already in this class
      if (student.assignedClasses.includes(classId)) return state;
      
      const updatedStudents = state.importedStudents.map((s) =>
        s.id === studentId 
          ? { ...s, assignedClasses: [...s.assignedClasses, classId] }
          : s
      );
      
      const updatedClasses = state.classes.map((c) => {
        if (c.id === classId) {
          // Check if student is already in class
          const studentExists = c.students.some(s => s.id === studentId);
          if (studentExists) return c;
          
          return {
            ...c,
            students: [...c.students, { ...student, assignedClasses: [...student.assignedClasses, classId] }],
            studentCount: c.studentCount + 1
          };
        }
        return c;
      });
      
      return {
        importedStudents: updatedStudents,
        classes: updatedClasses
      };
    });
  },
  
  removeStudentFromClass: (studentId, classId) => {
    set((state) => {
      const updatedStudents = state.importedStudents.map((s) =>
        s.id === studentId 
          ? { ...s, assignedClasses: s.assignedClasses.filter(id => id !== classId) }
          : s
      );
      
      const updatedClasses = state.classes.map((c) => {
        if (c.id === classId) {
          return {
            ...c,
            students: c.students.filter((s) => s.id !== studentId),
            studentCount: Math.max(0, c.studentCount - 1)
          };
        }
        return c;
      });
      
      return {
        importedStudents: updatedStudents,
        classes: updatedClasses
      };
    });
  },
  
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStudentSidebarOpen: (open) => set({ isStudentSidebarOpen: open }),
  setDraggedStudent: (student) => set({ draggedStudent: student }),
  
  // UI actions
  setCardsPerRow: (num) => set({ cardsPerRow: num }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  
  // Utility functions
  getClassById: (id) => get().classes.find((c) => c.id === id),
  getUnassignedStudents: () => get().importedStudents.filter((s) => s.assignedClasses.length === 0),
  getClassStudents: (classId) => {
    const classData = get().classes.find(c => c.id === classId);
    return classData?.students || [];
  }
}));