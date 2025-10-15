import { create } from 'zustand';

export interface Child {
  id: string;
  name: string;
  grade: string;
  class: string;
  teacher: string;
  teacherId: string;
  profilePicture?: string;
  dateOfBirth: string;
  enrollmentDate: string;
  progress: ChildProgress;
  attendance: AttendanceRecord[];
  assignments: Assignment[];
  achievements: Achievement[];
  schedule: ScheduleItem[];
  reports: Report[];
}

export interface ChildProgress {
  overallProgress: number;
  currentSurah: string;
  currentPage: number;
  totalPages: number;
  pagesMemorized: number;
  dailyTarget: number;
  weeklyProgress: number[];
  monthlyProgress: number[];
  lastReviewDate: string;
  nextReviewDate: string;
  strengths: string[];
  areasToImprove: string[];
}

export interface AttendanceRecord {
  date: string;
  status: 'present' | 'absent' | 'late' | 'excused';
  notes?: string;
}

export interface Assignment {
  id: string;
  title: string;
  type: 'memorization' | 'revision' | 'tajweed' | 'written';
  surah?: string;
  verses?: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  grade?: number;
  teacherFeedback?: string;
  submittedDate?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  date: string;
  type: 'memorization' | 'attendance' | 'performance' | 'behavior';
  icon: string;
}

export interface ScheduleItem {
  id: string;
  day: string;
  time: string;
  subject: string;
  teacher: string;
  room?: string;
}

export interface Report {
  id: string;
  title: string;
  date: string;
  type: 'monthly' | 'quarterly' | 'annual';
  fileUrl?: string;
  summary: string;
}

export interface Message {
  id: string;
  from: string;
  fromId: string;
  to: string;
  subject: string;
  content: string;
  date: string;
  read: boolean;
  type: 'teacher' | 'school' | 'system';
  attachments?: string[];
}

export interface ParentProfile {
  id: string;
  name: string;
  email: string;
  phone: string;
  address: string;
  emergencyContact: string;
  preferredLanguage: string;
  notificationPreferences: {
    email: boolean;
    sms: boolean;
    app: boolean;
    weeklyReport: boolean;
    instantAlerts: boolean;
  };
}

interface ParentState {
  // Children data
  children: Child[];
  currentChild: Child | null;
  
  // Messages
  messages: Message[];
  unreadCount: number;
  
  // Parent profile
  profile: ParentProfile | null;
  
  // UI state
  isLoading: boolean;
  notifications: any[];
  
  // Actions
  setChildren: (children: Child[]) => void;
  setCurrentChild: (child: Child) => void;
  addChild: (child: Child) => void;
  updateChildProgress: (childId: string, progress: Partial<ChildProgress>) => void;
  
  // Messages
  setMessages: (messages: Message[]) => void;
  markMessageAsRead: (messageId: string) => void;
  sendMessage: (message: Omit<Message, 'id' | 'date' | 'read'>) => void;
  
  // Profile
  setProfile: (profile: ParentProfile) => void;
  updateProfile: (updates: Partial<ParentProfile>) => void;
  
  // Assignments
  updateAssignmentStatus: (childId: string, assignmentId: string, status: Assignment['status']) => void;
  
  // Initialize
  initializeParentData: () => void;
}

export const useParentStore = create<ParentState>((set, get) => ({
  // Initial state
  children: [],
  currentChild: null,
  messages: [],
  unreadCount: 0,
  profile: null,
  isLoading: false,
  notifications: [],
  
  // Children actions
  setChildren: (children) => set({ children, currentChild: children[0] || null }),
  
  setCurrentChild: (currentChild) => set({ currentChild }),
  
  addChild: (child) => set((state) => ({ 
    children: [...state.children, child] 
  })),
  
  updateChildProgress: (childId, progress) => set((state) => ({
    children: state.children.map(child => 
      child.id === childId 
        ? { ...child, progress: { ...child.progress, ...progress } }
        : child
    ),
    currentChild: state.currentChild?.id === childId
      ? { ...state.currentChild, progress: { ...state.currentChild.progress, ...progress } }
      : state.currentChild
  })),
  
  // Messages actions
  setMessages: (messages) => set({ 
    messages,
    unreadCount: messages.filter(m => !m.read).length 
  }),
  
  markMessageAsRead: (messageId) => set((state) => {
    const messages = state.messages.map(m => 
      m.id === messageId ? { ...m, read: true } : m
    );
    return {
      messages,
      unreadCount: messages.filter(m => !m.read).length
    };
  }),
  
  sendMessage: (message) => set((state) => ({
    messages: [...state.messages, {
      ...message,
      id: Date.now().toString(),
      date: new Date().toISOString(),
      read: false
    }]
  })),
  
  // Profile actions
  setProfile: (profile) => set({ profile }),
  
  updateProfile: (updates) => set((state) => ({
    profile: state.profile ? { ...state.profile, ...updates } : null
  })),
  
  // Assignment actions
  updateAssignmentStatus: (childId, assignmentId, status) => set((state) => ({
    children: state.children.map(child => 
      child.id === childId
        ? {
            ...child,
            assignments: child.assignments.map(a => 
              a.id === assignmentId ? { ...a, status } : a
            )
          }
        : child
    )
  })),
  
  // Initialize with empty data for production
  initializeParentData: () => {
    // In production, data will be fetched from Supabase
    // For now, set empty state for a clean production build
    set({
      children: [],
      currentChild: null,
      messages: [],
      unreadCount: 0,
      profile: null,
      isLoading: false
    });
  }
}));