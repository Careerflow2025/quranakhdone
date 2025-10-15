import { create } from 'zustand';

export interface Student {
  id: string;
  name: string;
  email: string;
  classId: string;
  className: string;
  progress: {
    pagesCompleted: number;
    totalPages: number;
    lastAccessed: string;
  };
  parentName: string;
  parentEmail: string;
  enrolledDate: string;
  status: 'active' | 'inactive';
}

export interface Class {
  id: string;
  name: string;
  schedule: string;
  room: string;
  level: string;
  studentCount: number;
  students: string[];
  createdAt: string;
  nextClass: string;
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  classId: string;
  className: string;
  dueDate: string;
  createdAt: string;
  type: 'memorization' | 'recitation' | 'writing' | 'reading';
  status: 'active' | 'completed' | 'draft';
  submissions: number;
  totalStudents: number;
}

export interface Message {
  id: string;
  from: string;
  fromEmail: string;
  subject: string;
  content: string;
  timestamp: string;
  read: boolean;
  type: 'parent' | 'admin' | 'system';
  attachments?: string[];
}

export interface Schedule {
  id: string;
  classId: string;
  className: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  recurring: boolean;
}

interface TeacherState {
  // Data
  students: Student[];
  classes: Class[];
  assignments: Assignment[];
  messages: Message[];
  schedule: Schedule[];
  
  // UI State
  activeView: string;
  selectedClass: string | null;
  selectedStudent: string | null;
  
  // Actions
  setActiveView: (view: string) => void;
  
  // Students
  addStudent: (student: Student) => void;
  updateStudent: (id: string, updates: Partial<Student>) => void;
  removeStudent: (id: string) => void;
  importStudents: (students: Student[]) => void;
  
  // Classes
  addClass: (classData: Class) => void;
  updateClass: (id: string, updates: Partial<Class>) => void;
  removeClass: (id: string) => void;
  assignStudentToClass: (studentId: string, classId: string) => void;
  
  // Assignments
  addAssignment: (assignment: Assignment) => void;
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;
  removeAssignment: (id: string) => void;
  
  // Messages
  addMessage: (message: Message) => void;
  markMessageAsRead: (id: string) => void;
  deleteMessage: (id: string) => void;
  
  // Schedule
  addSchedule: (schedule: Schedule) => void;
  updateSchedule: (id: string, updates: Partial<Schedule>) => void;
  removeSchedule: (id: string) => void;
}

export const useTeacherStore = create<TeacherState>((set) => ({
  // Initial data
  students: [
    {
      id: '1',
      name: 'Ahmed Ali',
      email: 'ahmed@example.com',
      classId: '1',
      className: 'Quran Memorization - Level 1',
      progress: {
        pagesCompleted: 45,
        totalPages: 604,
        lastAccessed: '2024-01-15'
      },
      parentName: 'Ali Mohammed',
      parentEmail: 'ali@example.com',
      enrolledDate: '2024-01-01',
      status: 'active'
    },
    {
      id: '2',
      name: 'Fatima Hassan',
      email: 'fatima@example.com',
      classId: '1',
      className: 'Quran Memorization - Level 1',
      progress: {
        pagesCompleted: 78,
        totalPages: 604,
        lastAccessed: '2024-01-16'
      },
      parentName: 'Hassan Ahmed',
      parentEmail: 'hassan@example.com',
      enrolledDate: '2024-01-01',
      status: 'active'
    }
  ],
  
  classes: [
    {
      id: '1',
      name: 'Quran Memorization - Level 1',
      schedule: 'Mon, Wed, Fri - 4:00 PM',
      room: 'Room 101',
      level: 'Beginner',
      studentCount: 12,
      students: ['1', '2'],
      createdAt: '2024-01-01',
      nextClass: 'Today at 4:00 PM'
    },
    {
      id: '2',
      name: 'Tajweed Advanced',
      schedule: 'Tue, Thu - 5:00 PM',
      room: 'Room 203',
      level: 'Advanced',
      studentCount: 8,
      students: [],
      createdAt: '2024-01-01',
      nextClass: 'Tomorrow at 5:00 PM'
    }
  ],
  
  assignments: [
    {
      id: '1',
      title: 'Memorize Surah Al-Mulk (Verses 1-10)',
      description: 'Complete memorization of the first 10 verses with proper Tajweed',
      classId: '1',
      className: 'Quran Memorization - Level 1',
      dueDate: '2024-01-20',
      createdAt: '2024-01-10',
      type: 'memorization',
      status: 'active',
      submissions: 5,
      totalStudents: 12
    }
  ],
  
  messages: [
    {
      id: '1',
      from: 'Ali Mohammed',
      fromEmail: 'ali@example.com',
      subject: 'Ahmed\'s Progress',
      content: 'I wanted to discuss Ahmed\'s progress in class...',
      timestamp: '2024-01-15 10:30 AM',
      read: false,
      type: 'parent'
    }
  ],
  
  schedule: [
    {
      id: '1',
      classId: '1',
      className: 'Quran Memorization - Level 1',
      dayOfWeek: 'Monday',
      startTime: '16:00',
      endTime: '17:30',
      room: 'Room 101',
      recurring: true
    }
  ],
  
  activeView: 'dashboard',
  selectedClass: null,
  selectedStudent: null,
  
  // Actions
  setActiveView: (view) => set({ activeView: view }),
  
  // Student actions
  addStudent: (student) => set((state) => ({
    students: [...state.students, student]
  })),
  
  updateStudent: (id, updates) => set((state) => ({
    students: state.students.map(s => s.id === id ? { ...s, ...updates } : s)
  })),
  
  removeStudent: (id) => set((state) => ({
    students: state.students.filter(s => s.id !== id)
  })),
  
  importStudents: (students) => set((state) => ({
    students: [...state.students, ...students]
  })),
  
  // Class actions
  addClass: (classData) => set((state) => ({
    classes: [...state.classes, classData]
  })),
  
  updateClass: (id, updates) => set((state) => ({
    classes: state.classes.map(c => c.id === id ? { ...c, ...updates } : c)
  })),
  
  removeClass: (id) => set((state) => ({
    classes: state.classes.filter(c => c.id !== id)
  })),
  
  assignStudentToClass: (studentId, classId) => set((state) => {
    const student = state.students.find(s => s.id === studentId);
    const targetClass = state.classes.find(c => c.id === classId);
    
    if (!student || !targetClass) return state;
    
    return {
      students: state.students.map(s => 
        s.id === studentId 
          ? { ...s, classId, className: targetClass.name }
          : s
      ),
      classes: state.classes.map(c => 
        c.id === classId 
          ? { ...c, students: [...c.students, studentId], studentCount: c.studentCount + 1 }
          : c
      )
    };
  }),
  
  // Assignment actions
  addAssignment: (assignment) => set((state) => ({
    assignments: [...state.assignments, assignment]
  })),
  
  updateAssignment: (id, updates) => set((state) => ({
    assignments: state.assignments.map(a => a.id === id ? { ...a, ...updates } : a)
  })),
  
  removeAssignment: (id) => set((state) => ({
    assignments: state.assignments.filter(a => a.id !== id)
  })),
  
  // Message actions
  addMessage: (message) => set((state) => ({
    messages: [message, ...state.messages]
  })),
  
  markMessageAsRead: (id) => set((state) => ({
    messages: state.messages.map(m => m.id === id ? { ...m, read: true } : m)
  })),
  
  deleteMessage: (id) => set((state) => ({
    messages: state.messages.filter(m => m.id !== id)
  })),
  
  // Schedule actions
  addSchedule: (schedule) => set((state) => ({
    schedule: [...state.schedule, schedule]
  })),
  
  updateSchedule: (id, updates) => set((state) => ({
    schedule: state.schedule.map(s => s.id === id ? { ...s, ...updates } : s)
  })),
  
  removeSchedule: (id) => set((state) => ({
    schedule: state.schedule.filter(s => s.id !== id)
  }))
}));