import { create } from 'zustand';

export interface Assignment {
  id: string;
  title: string;
  description: string;
  type: 'memorization' | 'recitation' | 'reading' | 'writing';
  dueDate: string;
  status: 'pending' | 'in_progress' | 'completed' | 'overdue';
  pagesAssigned: number[];
  progress: number;
  teacherName: string;
  createdAt: string;
  submittedAt?: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  progress: number;
  target: number;
  category: 'reading' | 'memorization' | 'attendance' | 'streak' | 'milestone';
  locked: boolean;
}

export interface Note {
  id: string;
  teacherName: string;
  content: string;
  createdAt: string;
  isRead: boolean;
  type: 'feedback' | 'encouragement' | 'instruction';
}

export interface Schedule {
  id: string;
  className: string;
  teacherName: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room: string;
  type: 'regular' | 'special' | 'exam';
}

export interface Progress {
  totalPages: number;
  pagesCompleted: number;
  currentPage: number;
  dailyGoal: number;
  weeklyGoal: number;
  monthlyProgress: number[];
  streakDays: number;
  lastReadDate: string;
  readingTime: number; // in minutes
  accuracy: number;
  mistakesCount: number;
  correctionsCount: number;
}

export interface StudentProfile {
  id: string;
  name: string;
  email: string;
  age: number;
  grade: string;
  className: string;
  teacherName: string;
  schoolName: string;
  parentName: string;
  parentEmail: string;
  joinedDate: string;
  avatarUrl?: string;
}

interface StudentState {
  // Profile
  profile: StudentProfile;
  
  // Progress
  progress: Progress;
  
  // Assignments
  assignments: Assignment[];
  
  // Achievements
  achievements: Achievement[];
  
  // Notes from teacher
  notes: Note[];
  
  // Schedule
  schedule: Schedule[];
  
  // UI State
  currentView: string;
  selectedSurah: number;
  selectedPage: number;
  bookmarks: number[];
  readingMode: 'normal' | 'practice' | 'test';
  
  // Actions
  setCurrentView: (view: string) => void;
  updateProgress: (progress: Partial<Progress>) => void;
  updateProfile: (profile: Partial<StudentProfile>) => void;
  
  // Assignments
  updateAssignment: (id: string, updates: Partial<Assignment>) => void;
  submitAssignment: (id: string) => void;
  
  // Achievements
  unlockAchievement: (id: string) => void;
  updateAchievementProgress: (id: string, progress: number) => void;
  
  // Notes
  markNoteAsRead: (id: string) => void;
  
  // Bookmarks
  addBookmark: (page: number) => void;
  removeBookmark: (page: number) => void;
  
  // Reading
  setCurrentPage: (page: number) => void;
  incrementReadingTime: (minutes: number) => void;
  recordMistake: () => void;
  recordCorrection: () => void;
}

export const useStudentStore = create<StudentState>((set) => ({
  // Initial profile
  profile: {
    id: '1',
    name: 'Student Name',
    email: 'student@school.com',
    age: 12,
    grade: 'Grade 6',
    className: 'Quran Memorization - Level 1',
    teacherName: 'Teacher Name',
    schoolName: 'Al-Noor Islamic School',
    parentName: 'Parent Name',
    parentEmail: 'parent@example.com',
    joinedDate: '2024-01-01',
  },
  
  // Initial progress
  progress: {
    totalPages: 604,
    pagesCompleted: 45,
    currentPage: 46,
    dailyGoal: 2,
    weeklyGoal: 10,
    monthlyProgress: [8, 12, 10, 15, 18, 22, 20, 25, 28, 30, 35, 45],
    streakDays: 7,
    lastReadDate: new Date().toISOString(),
    readingTime: 450, // 7.5 hours
    accuracy: 92,
    mistakesCount: 23,
    correctionsCount: 18,
  },
  
  // Initial assignments
  assignments: [
    {
      id: '1',
      title: 'Memorize Surah Al-Mulk (Verses 1-10)',
      description: 'Complete memorization with proper Tajweed rules',
      type: 'memorization',
      dueDate: '2024-01-25',
      status: 'in_progress',
      pagesAssigned: [523, 524],
      progress: 60,
      teacherName: 'Teacher Name',
      createdAt: '2024-01-15',
    },
    {
      id: '2',
      title: 'Practice Surah Al-Kahf Recitation',
      description: 'Record your recitation of the first 10 verses',
      type: 'recitation',
      dueDate: '2024-01-28',
      status: 'pending',
      pagesAssigned: [293, 294, 295],
      progress: 0,
      teacherName: 'Teacher Name',
      createdAt: '2024-01-16',
    },
  ],
  
  // Initial achievements
  achievements: [
    {
      id: '1',
      title: 'First Steps',
      description: 'Complete your first page',
      icon: '🎯',
      unlockedAt: '2024-01-02',
      progress: 1,
      target: 1,
      category: 'reading',
      locked: false,
    },
    {
      id: '2',
      title: 'Week Warrior',
      description: 'Read for 7 days in a row',
      icon: '🔥',
      unlockedAt: '2024-01-08',
      progress: 7,
      target: 7,
      category: 'streak',
      locked: false,
    },
    {
      id: '3',
      title: 'Juz Master',
      description: 'Complete an entire Juz',
      icon: '📚',
      progress: 15,
      target: 20,
      category: 'milestone',
      locked: true,
    },
    {
      id: '4',
      title: 'Perfect Recitation',
      description: 'Complete 10 pages without mistakes',
      icon: '⭐',
      progress: 3,
      target: 10,
      category: 'reading',
      locked: true,
    },
  ],
  
  // Initial notes
  notes: [
    {
      id: '1',
      teacherName: 'Teacher Name',
      content: 'Excellent progress this week! Keep up the great work on your Tajweed.',
      createdAt: '2024-01-15',
      isRead: false,
      type: 'encouragement',
    },
    {
      id: '2',
      teacherName: 'Teacher Name',
      content: 'Please focus on the pronunciation of the letter ع in tomorrow\'s class.',
      createdAt: '2024-01-14',
      isRead: true,
      type: 'instruction',
    },
  ],
  
  // Initial schedule
  schedule: [
    {
      id: '1',
      className: 'Quran Memorization',
      teacherName: 'Teacher Name',
      dayOfWeek: 'Monday',
      startTime: '16:00',
      endTime: '17:30',
      room: 'Room 101',
      type: 'regular',
    },
    {
      id: '2',
      className: 'Quran Memorization',
      teacherName: 'Teacher Name',
      dayOfWeek: 'Wednesday',
      startTime: '16:00',
      endTime: '17:30',
      room: 'Room 101',
      type: 'regular',
    },
    {
      id: '3',
      className: 'Quran Memorization',
      teacherName: 'Teacher Name',
      dayOfWeek: 'Friday',
      startTime: '16:00',
      endTime: '17:30',
      room: 'Room 101',
      type: 'regular',
    },
  ],
  
  // UI State
  currentView: 'dashboard',
  selectedSurah: 1,
  selectedPage: 1,
  bookmarks: [1, 45, 100, 293, 523],
  readingMode: 'normal',
  
  // Actions
  setCurrentView: (view) => set({ currentView: view }),
  
  updateProgress: (progress) => set((state) => ({
    progress: { ...state.progress, ...progress }
  })),
  
  updateProfile: (profile) => set((state) => ({
    profile: { ...state.profile, ...profile }
  })),
  
  updateAssignment: (id, updates) => set((state) => ({
    assignments: state.assignments.map(a => 
      a.id === id ? { ...a, ...updates } : a
    )
  })),
  
  submitAssignment: (id) => set((state) => ({
    assignments: state.assignments.map(a => 
      a.id === id 
        ? { ...a, status: 'completed', submittedAt: new Date().toISOString(), progress: 100 }
        : a
    )
  })),
  
  unlockAchievement: (id) => set((state) => ({
    achievements: state.achievements.map(a => 
      a.id === id 
        ? { ...a, locked: false, unlockedAt: new Date().toISOString() }
        : a
    )
  })),
  
  updateAchievementProgress: (id, progress) => set((state) => ({
    achievements: state.achievements.map(a => 
      a.id === id ? { ...a, progress } : a
    )
  })),
  
  markNoteAsRead: (id) => set((state) => ({
    notes: state.notes.map(n => 
      n.id === id ? { ...n, isRead: true } : n
    )
  })),
  
  addBookmark: (page) => set((state) => ({
    bookmarks: [...state.bookmarks, page].sort((a, b) => a - b)
  })),
  
  removeBookmark: (page) => set((state) => ({
    bookmarks: state.bookmarks.filter(p => p !== page)
  })),
  
  setCurrentPage: (page) => set((state) => ({
    progress: { ...state.progress, currentPage: page },
    selectedPage: page
  })),
  
  incrementReadingTime: (minutes) => set((state) => ({
    progress: { ...state.progress, readingTime: state.progress.readingTime + minutes }
  })),
  
  recordMistake: () => set((state) => ({
    progress: { 
      ...state.progress, 
      mistakesCount: state.progress.mistakesCount + 1,
      accuracy: Math.round(((state.progress.correctionsCount / (state.progress.mistakesCount + 1)) * 100))
    }
  })),
  
  recordCorrection: () => set((state) => ({
    progress: { 
      ...state.progress, 
      correctionsCount: state.progress.correctionsCount + 1,
      accuracy: Math.round(((state.progress.correctionsCount + 1) / state.progress.mistakesCount) * 100)
    }
  }))
}));