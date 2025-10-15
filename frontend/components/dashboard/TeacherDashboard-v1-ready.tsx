'use client';

import { useState, useEffect, useRef } from 'react';
import {
  Users,
  BookOpen,
  Calendar,
  Bell,
  Settings,
  FileText,
  Clock,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Mail,
  GraduationCap,
  Search,
  Filter,
  User,
  LogOut,
  Key,
  X,
  Eye,
  Download,
  MessageSquare,
  Send,
  ChevronRight,
  Book,
  Target,
  Award,
  Brain,
  RefreshCw,
  BarChart3,
  Activity,
  Plus,
  Edit,
  Trash2,
  MoreVertical,
  Phone,
  Video,
  Paperclip,
  EyeOff,
  CalendarDays,
  School,
  Home,
  Info,
  Mic,
  MicOff,
  Play,
  Pause,
  StopCircle,
  Grid3x3,
  List,
  Archive,
  MapPin,
  ChevronLeft
} from 'lucide-react';

export default function TeacherDashboard() {
  // Refs for dropdown click-outside detection
  const notificationRef = useRef(null);
  const settingsRef = useRef(null);
  
  // State Management
  const [activeTab, setActiveTab] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('all');
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState(null);
  const [assignmentStatusFilter, setAssignmentStatusFilter] = useState('all');
  const [assignmentClassFilter, setAssignmentClassFilter] = useState('all');
  const [assignmentSearchTerm, setAssignmentSearchTerm] = useState('');
  const [selectedAssignment, setSelectedAssignment] = useState(null);
  const [showAssignmentConversation, setShowAssignmentConversation] = useState(false);
  const [conversationMessage, setConversationMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [selectedClassDetails, setSelectedClassDetails] = useState(null);
  const [showClassDetails, setShowClassDetails] = useState(false);
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedAttendanceClass, setSelectedAttendanceClass] = useState('CLS001');
  const [attendanceData, setAttendanceData] = useState({});
  const [attendanceNotes, setAttendanceNotes] = useState({});
  const [showAttendanceHistory, setShowAttendanceHistory] = useState(false);
  const [selectedStudentHistory, setSelectedStudentHistory] = useState(null);
  const [attendanceSaveMessage, setAttendanceSaveMessage] = useState('');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [showStudentDetails, setShowStudentDetails] = useState(false);
  const [studentsViewMode, setStudentsViewMode] = useState('grid'); // 'grid' or 'list'
  const [messageRecipientType, setMessageRecipientType] = useState('students'); // 'students' or 'parents'
  const [messageRecipientSearch, setMessageRecipientSearch] = useState('');
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [messageTab, setMessageTab] = useState('inbox'); // 'inbox', 'sent', 'archived'
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [calendarView, setCalendarView] = useState('month'); // 'month', 'week', 'day'
  const [calendarType, setCalendarType] = useState('school'); // 'school' or 'personal'
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showEventDetails, setShowEventDetails] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  
  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };

    if (showNotifications || showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showSettings]);

  // Teacher Info (from school assignment)
  const teacherInfo = {
    name: 'Dr. Fatima Al-Rashid',
    id: 'TCH-001',
    email: 'fatima.rashid@alnoor.edu',
    phone: '+1 234-567-9001',
    school: 'Al-Noor Academy',
    subjects: ['Quran Memorization', 'Tajweed'],
    joinDate: '2021-01-10'
  };

  // Stats Data
  const stats = {
    totalStudents: 45,
    totalClasses: 3,
    activeAssignments: 8,
    pendingSubmissions: 12,
    averageAttendance: 92.5,
    averageGrade: 85.3,
    todayClasses: 3,
    upcomingEvents: 4
  };

  // Classes assigned by school
  const myClasses = [
    { 
      id: 'CLS001', 
      name: 'Class 6A', 
      subject: 'Quran Memorization',
      students: 22, 
      schedule: 'Mon-Fri 8:00 AM', 
      room: 'Room 101',
      nextClass: 'Today 8:00 AM',
      progress: 75
    },
    { 
      id: 'CLS002', 
      name: 'Class 7A', 
      subject: 'Tajweed',
      students: 18, 
      schedule: 'Mon-Fri 9:30 AM', 
      room: 'Room 102',
      nextClass: 'Today 9:30 AM',
      progress: 82
    },
    { 
      id: 'CLS003', 
      name: 'Class 5B', 
      subject: 'Quran Memorization',
      students: 20, 
      schedule: 'Mon-Fri 11:00 AM', 
      room: 'Room 201',
      nextClass: 'Today 11:00 AM',
      progress: 68
    }
  ];

  // Detailed class information with student lists
  const classDetails = {
    'CLS001': {
      studentList: [
        { id: 'STU001', name: 'Ahmed Al-Hassan', attendance: 95, progress: 78, lastAssignment: 'Surah Al-Mulk', grade: 'A' },
        { id: 'STU004', name: 'Ali Ibrahim', attendance: 88, progress: 70, lastAssignment: 'Surah Al-Kahf', grade: 'B' },
        { id: 'STU007', name: 'Yusuf Ahmad', attendance: 92, progress: 85, lastAssignment: 'Surah Yasin', grade: 'A-' },
        { id: 'STU008', name: 'Ibrahim Khan', attendance: 98, progress: 90, lastAssignment: 'Surah Al-Mulk', grade: 'A+' },
        { id: 'STU009', name: 'Omar Hassan', attendance: 87, progress: 65, lastAssignment: 'Surah Al-Kahf', grade: 'B-' },
        { id: 'STU010', name: 'Bilal Said', attendance: 94, progress: 88, lastAssignment: 'Surah Yasin', grade: 'A' },
        { id: 'STU018', name: 'Hamza Ali', attendance: 91, progress: 75, lastAssignment: 'Surah Al-Mulk', grade: 'B+' },
        { id: 'STU019', name: 'Mustafa Omar', attendance: 96, progress: 82, lastAssignment: 'Surah Al-Kahf', grade: 'A-' },
      ],
      description: 'Advanced Quran memorization focusing on Juz 28-30. Students are expected to memorize and recite with proper tajweed.',
      averageAttendance: 92,
      averageProgress: 79,
      activeAssignments: 12,
      completedAssignments: 45
    },
    'CLS002': {
      studentList: [
        { id: 'STU011', name: 'Zaynab Ahmed', attendance: 96, progress: 92, lastAssignment: 'Tajweed Rules', grade: 'A+' },
        { id: 'STU012', name: 'Aisha Hassan', attendance: 98, progress: 95, lastAssignment: 'Ghunnah Practice', grade: 'A+' },
        { id: 'STU013', name: 'Safiya Omar', attendance: 91, progress: 83, lastAssignment: 'Ikhfa Rules', grade: 'B+' },
        { id: 'STU014', name: 'Khadija Ali', attendance: 89, progress: 78, lastAssignment: 'Idgham Practice', grade: 'B' },
        { id: 'STU020', name: 'Maryam Yusuf', attendance: 93, progress: 85, lastAssignment: 'Qalqalah Rules', grade: 'A-' },
        { id: 'STU021', name: 'Hafsa Ibrahim', attendance: 95, progress: 88, lastAssignment: 'Mad Rules', grade: 'A' },
      ],
      description: 'Advanced Tajweed rules and practical application. Focus on mastering all tajweed rules with practical recitation.',
      averageAttendance: 94,
      averageProgress: 87,
      activeAssignments: 8,
      completedAssignments: 52
    },
    'CLS003': {
      studentList: [
        { id: 'STU002', name: 'Mariam Said', attendance: 94, progress: 88, lastAssignment: 'Tajweed Practice', grade: 'A' },
        { id: 'STU003', name: 'Fatima Khan', attendance: 98, progress: 92, lastAssignment: 'Surah Yasin', grade: 'A+' },
        { id: 'STU015', name: 'Ruqayyah Ibrahim', attendance: 90, progress: 80, lastAssignment: 'Surah Al-Rahman', grade: 'B+' },
        { id: 'STU016', name: 'Sumayya Yusuf', attendance: 93, progress: 86, lastAssignment: 'Surah Al-Waqiah', grade: 'A-' },
        { id: 'STU017', name: 'Hafsa Ahmad', attendance: 97, progress: 94, lastAssignment: 'Surah Al-Mulk', grade: 'A+' },
        { id: 'STU022', name: 'Asma Hassan', attendance: 92, progress: 82, lastAssignment: 'Surah Al-Mulk', grade: 'B+' },
        { id: 'STU023', name: 'Layla Omar', attendance: 95, progress: 89, lastAssignment: 'Surah Yasin', grade: 'A' },
      ],
      description: 'Basic Quran recitation with focus on proper pronunciation and basic tajweed rules.',
      averageAttendance: 94,
      averageProgress: 88,
      activeAssignments: 10,
      completedAssignments: 38
    }
  };

  // Initialize attendance data with history
  const [attendanceHistory, setAttendanceHistory] = useState({
    '2025-01-10': {
      'CLS001': {
        'STU001': { status: 'present', note: '' },
        'STU004': { status: 'present', note: '' },
        'STU007': { status: 'late', note: 'Arrived 15 minutes late' },
        'STU008': { status: 'present', note: '' },
        'STU009': { status: 'absent', note: 'Family emergency' },
        'STU010': { status: 'present', note: '' },
        'STU018': { status: 'present', note: '' },
        'STU019': { status: 'excused', note: 'Doctor appointment' },
      }
    },
    '2025-01-09': {
      'CLS001': {
        'STU001': { status: 'present', note: '' },
        'STU004': { status: 'late', note: 'Traffic delay' },
        'STU007': { status: 'present', note: '' },
        'STU008': { status: 'present', note: '' },
        'STU009': { status: 'present', note: '' },
        'STU010': { status: 'present', note: '' },
        'STU018': { status: 'absent', note: 'Sick' },
        'STU019': { status: 'present', note: '' },
      }
    },
    '2025-01-08': {
      'CLS001': {
        'STU001': { status: 'present', note: '' },
        'STU004': { status: 'present', note: '' },
        'STU007': { status: 'present', note: '' },
        'STU008': { status: 'late', note: '' },
        'STU009': { status: 'present', note: '' },
        'STU010': { status: 'excused', note: 'Family event' },
        'STU018': { status: 'present', note: '' },
        'STU019': { status: 'present', note: '' },
      }
    }
  });

  // Students assigned by school with detailed Quran progress
  const myStudents = [
    { 
      id: 'STU001', 
      name: 'Aisha Ahmed', 
      class: 'Class 6A',
      classId: 'CLS001', 
      age: 12,
      progress: 85, 
      attendance: 96, 
      grade: 'A',
      memorized: '15 Juz',
      currentSurah: 'Al-Mulk',
      currentAyah: 15,
      totalAyahs: 30,
      currentJuz: 29,
      lastActive: '2 hours ago',
      parentName: 'Ahmed Hassan',
      parentPhone: '+1 234-567-8001',
      parentEmail: 'ahmed.hassan@email.com',
      recentAssignment: 'Surah Al-Mulk',
      assignmentStatus: 'submitted',
      strengths: ['Tajweed', 'Memorization'],
      needsImprovement: ['Makharij'],
      quranProgress: {
        memorization: { juz: 15, surah: 67, ayah: 15 },
        revision: { juz: 12, surah: 36, ayah: 45 },
        tilawah: { juz: 30, surah: 114, ayah: 6 }
      }
    },
    { 
      id: 'STU002', 
      name: 'Omar Hassan', 
      class: 'Class 7A',
      classId: 'CLS002', 
      age: 13,
      progress: 78, 
      attendance: 92, 
      grade: 'B+',
      memorized: '12 Juz',
      currentSurah: 'Yasin',
      currentAyah: 45,
      totalAyahs: 83,
      currentJuz: 23,
      lastActive: '1 day ago',
      parentName: 'Hassan Ali',
      parentPhone: '+1 234-567-8002',
      parentEmail: 'hassan.ali@email.com',
      recentAssignment: 'Tajweed Rules',
      assignmentStatus: 'pending',
      strengths: ['Fluency'],
      needsImprovement: ['Tajweed', 'Consistency'],
      quranProgress: {
        memorization: { juz: 12, surah: 36, ayah: 45 },
        revision: { juz: 10, surah: 9, ayah: 100 },
        tilawah: { juz: 28, surah: 58, ayah: 22 }
      }
    },
    { 
      id: 'STU003', 
      name: 'Fatima Khan', 
      class: 'Class 5B',
      classId: 'CLS003',
      age: 11, 
      progress: 92, 
      attendance: 98, 
      grade: 'A+',
      currentSurah: 'Al-Rahman',
      currentAyah: 30,
      totalAyahs: 78,
      currentJuz: 27,
      lastActive: '30 mins ago',
      memorized: '18 Juz',
      parentName: 'Ibrahim Khan',
      parentPhone: '+1 234-567-8003',
      parentEmail: 'ibrahim.khan@email.com',
      recentAssignment: 'Surah Yasin',
      assignmentStatus: 'reviewed'
    },
    { 
      id: 'STU004', 
      name: 'Ali Ibrahim', 
      class: 'Class 6A',
      classId: 'CLS001',
      age: 12, 
      progress: 70, 
      attendance: 88, 
      grade: 'B',
      memorized: '10 Juz',
      parentName: 'Ibrahim Hassan',
      parentPhone: '+1 234-567-8004',
      parentEmail: 'ibrahim.hassan@email.com',
      recentAssignment: 'Surah Al-Kahf',
      assignmentStatus: 'late',
      currentSurah: 'Al-Kahf',
      currentAyah: 50,
      totalAyahs: 110,
      currentJuz: 15,
      lastActive: '3 hours ago',
      strengths: ['Recitation'],
      needsImprovement: ['Memorization', 'Consistency'],
      quranProgress: {
        memorization: { juz: 10, surah: 18, ayah: 50 },
        revision: { juz: 8, surah: 7, ayah: 100 },
        tilawah: { juz: 20, surah: 28, ayah: 88 }
      }
    },
    // More students for Class 6A (CLS001)
    { 
      id: 'STU007', 
      name: 'Yusuf Ahmad', 
      class: 'Class 6A',
      classId: 'CLS001',
      age: 12,
      progress: 85, 
      attendance: 92, 
      grade: 'A-',
      memorized: '14 Juz',
      currentSurah: 'Yasin',
      currentAyah: 60,
      totalAyahs: 83,
      currentJuz: 23,
      lastActive: '1 hour ago',
      parentName: 'Ahmad Ali',
      parentPhone: '+1 234-567-8007',
      parentEmail: 'ahmad.ali@email.com',
      recentAssignment: 'Surah Yasin',
      assignmentStatus: 'submitted',
      strengths: ['Memorization', 'Dedication'],
      needsImprovement: ['Pronunciation'],
      quranProgress: {
        memorization: { juz: 14, surah: 36, ayah: 60 },
        revision: { juz: 11, surah: 11, ayah: 123 },
        tilawah: { juz: 25, surah: 41, ayah: 54 }
      }
    },
    { 
      id: 'STU008', 
      name: 'Abdullah Mahmoud', 
      class: 'Class 6A',
      classId: 'CLS001',
      age: 13,
      progress: 80, 
      attendance: 93, 
      grade: 'B+',
      memorized: '11 Juz',
      currentSurah: 'Al-Ankabut',
      currentAyah: 45,
      totalAyahs: 69,
      currentJuz: 21,
      lastActive: '5 hours ago',
      parentName: 'Mahmoud Said',
      parentPhone: '+1 234-567-8008',
      parentEmail: 'mahmoud.said@email.com',
      recentAssignment: 'Surah Al-Ankabut',
      assignmentStatus: 'reviewed',
      strengths: ['Understanding', 'Tajweed'],
      needsImprovement: ['Speed'],
      quranProgress: {
        memorization: { juz: 11, surah: 29, ayah: 45 },
        revision: { juz: 9, surah: 8, ayah: 75 },
        tilawah: { juz: 22, surah: 33, ayah: 73 }
      }
    },
    // Students for Class 7A (CLS002)
    { 
      id: 'STU011', 
      name: 'Zahra Mustafa', 
      class: 'Class 7A',
      classId: 'CLS002',
      age: 13,
      progress: 88, 
      attendance: 95, 
      grade: 'A',
      memorized: '16 Juz',
      currentSurah: 'Al-Furqan',
      currentAyah: 30,
      totalAyahs: 77,
      currentJuz: 19,
      lastActive: '2 hours ago',
      parentName: 'Mustafa Ahmed',
      parentPhone: '+1 234-567-8011',
      parentEmail: 'mustafa.ahmed@email.com',
      recentAssignment: 'Surah Al-Furqan',
      assignmentStatus: 'submitted',
      strengths: ['Consistency', 'Memorization'],
      needsImprovement: ['Makharij'],
      quranProgress: {
        memorization: { juz: 16, surah: 25, ayah: 30 },
        revision: { juz: 13, surah: 13, ayah: 43 },
        tilawah: { juz: 24, surah: 39, ayah: 75 }
      }
    },
    { 
      id: 'STU012', 
      name: 'Bilal Omar', 
      class: 'Class 7A',
      classId: 'CLS002',
      age: 14,
      progress: 75, 
      attendance: 90, 
      grade: 'B',
      memorized: '9 Juz',
      currentSurah: 'Al-Isra',
      currentAyah: 70,
      totalAyahs: 111,
      currentJuz: 15,
      lastActive: '1 day ago',
      parentName: 'Omar Hassan',
      parentPhone: '+1 234-567-8012',
      parentEmail: 'omar.hassan2@email.com',
      recentAssignment: 'Surah Al-Isra',
      assignmentStatus: 'pending',
      strengths: ['Voice', 'Rhythm'],
      needsImprovement: ['Focus', 'Revision'],
      quranProgress: {
        memorization: { juz: 9, surah: 17, ayah: 70 },
        revision: { juz: 7, surah: 6, ayah: 165 },
        tilawah: { juz: 18, surah: 23, ayah: 118 }
      }
    },
    // Students for Class 5B (CLS003)
    { 
      id: 'STU015', 
      name: 'Ruqayyah Ibrahim', 
      class: 'Class 5B',
      classId: 'CLS003',
      age: 11,
      progress: 80, 
      attendance: 90, 
      grade: 'B+',
      memorized: '8 Juz',
      currentSurah: 'Al-Rahman',
      currentAyah: 40,
      totalAyahs: 78,
      currentJuz: 27,
      lastActive: '4 hours ago',
      parentName: 'Ibrahim Ali',
      parentPhone: '+1 234-567-8015',
      parentEmail: 'ibrahim.ali@email.com',
      recentAssignment: 'Surah Al-Rahman',
      assignmentStatus: 'reviewed',
      strengths: ['Enthusiasm', 'Pronunciation'],
      needsImprovement: ['Pace'],
      quranProgress: {
        memorization: { juz: 8, surah: 55, ayah: 40 },
        revision: { juz: 6, surah: 5, ayah: 120 },
        tilawah: { juz: 29, surah: 67, ayah: 30 }
      }
    },
    { 
      id: 'STU016', 
      name: 'Sumayya Yusuf', 
      class: 'Class 5B',
      classId: 'CLS003',
      age: 10,
      progress: 86, 
      attendance: 93, 
      grade: 'A-',
      memorized: '10 Juz',
      currentSurah: 'Al-Waqiah',
      currentAyah: 50,
      totalAyahs: 96,
      currentJuz: 27,
      lastActive: '6 hours ago',
      parentName: 'Yusuf Mohammed',
      parentPhone: '+1 234-567-8016',
      parentEmail: 'yusuf.mohammed@email.com',
      recentAssignment: 'Surah Al-Waqiah',
      assignmentStatus: 'submitted',
      strengths: ['Memory', 'Dedication'],
      needsImprovement: ['Confidence'],
      quranProgress: {
        memorization: { juz: 10, surah: 56, ayah: 50 },
        revision: { juz: 8, surah: 8, ayah: 75 },
        tilawah: { juz: 30, surah: 78, ayah: 40 }
      }
    }
  ];

  // Mistake types with colors (as per CLAUDE.md)
  const mistakeTypeColors = {
    recap: { color: 'purple', bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
    tajweed: { color: 'orange', bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
    haraka: { color: 'red', bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
    letter: { color: 'brown', bg: 'bg-amber-100', text: 'text-amber-700', border: 'border-amber-300' }
  };

  // Assignments (auto-generated from student management dashboard)
  const assignments = [
    { 
      id: 'ASG001',
      studentName: 'Ahmed Al-Hassan',
      studentId: 'STU001',
      title: 'Surah Al-Mulk - Verses 1-15', 
      type: 'Memorization',
      class: 'Class 6A', 
      assignedDate: '2025-01-10',
      dueDate: '2025-01-20',
      submittedDate: '2025-01-19',
      status: 'submitted',
      feedbackGiven: false,
      mistakeCount: 3,
      mistakes: { recap: 1, tajweed: 2, haraka: 0, letter: 0 },
      primaryMistakeType: 'tajweed',
      notes: 'Good progress, needs work on tajweed'
    },
    { 
      id: 'ASG002',
      studentName: 'Mariam Said',
      studentId: 'STU002',
      title: 'Tajweed Rules - Ghunnah Practice', 
      type: 'Practice',
      class: 'Class 5B', 
      assignedDate: '2025-01-08',
      dueDate: '2025-01-18',
      submittedDate: '2025-01-17',
      status: 'completed',
      feedbackGiven: true,
      mistakeCount: 1,
      mistakes: { recap: 0, tajweed: 1, haraka: 0, letter: 0 },
      primaryMistakeType: null,
      notes: 'Excellent work! Assignment completed successfully!'
    },
    { 
      id: 'ASG003',
      studentName: 'Fatima Khan',
      studentId: 'STU003',
      title: 'Surah Yasin - Full Recitation', 
      type: 'Recitation',
      class: 'Class 5B', 
      assignedDate: '2025-01-12',
      dueDate: '2025-01-22',
      submittedDate: null,
      status: 'pending',
      feedbackGiven: false,
      mistakeCount: 0,
      mistakes: { recap: 0, tajweed: 0, haraka: 0, letter: 0 },
      primaryMistakeType: null,
      notes: ''
    },
    { 
      id: 'ASG004',
      studentName: 'Ali Ibrahim',
      studentId: 'STU004',
      title: 'Surah Al-Kahf - Verses 1-10', 
      type: 'Memorization',
      class: 'Class 6A', 
      assignedDate: '2025-01-05',
      dueDate: '2025-01-15',
      submittedDate: '2025-01-16',
      status: 'late',
      feedbackGiven: false,
      mistakeCount: 5,
      mistakes: { recap: 2, tajweed: 1, haraka: 1, letter: 1 },
      primaryMistakeType: 'recap',
      notes: 'Submitted late, needs review'
    },
    { 
      id: 'ASG005',
      studentName: 'Ahmed Al-Hassan',
      studentId: 'STU001',
      title: 'Surah Al-Mulk - Verses 16-30', 
      type: 'Memorization',
      class: 'Class 6A', 
      assignedDate: '2025-01-20',
      dueDate: '2025-01-30',
      submittedDate: null,
      status: 'assigned',
      feedbackGiven: false,
      mistakeCount: 0,
      mistakes: { recap: 0, tajweed: 0, haraka: 0, letter: 0 },
      primaryMistakeType: null,
      notes: ''
    },
    { 
      id: 'ASG006',
      studentName: 'Mariam Said',
      studentId: 'STU002',
      title: 'Surah Al-Baqarah - Verses 255-257', 
      type: 'Memorization',
      class: 'Class 5B', 
      assignedDate: '2025-01-15',
      dueDate: '2025-01-25',
      submittedDate: '2025-01-24',
      status: 'reviewed',
      feedbackGiven: true,
      mistakeCount: 4,
      mistakes: { recap: 0, tajweed: 0, haraka: 3, letter: 1 },
      primaryMistakeType: 'haraka',
      notes: 'Focus on harakat placement'
    }
  ];

  // Sample conversations for assignments
  const assignmentConversations = {
    'ASG001': [
      { id: 1, type: 'text', sender: 'teacher', content: 'Please focus on the tajweed rules, especially the ghunnah', timestamp: '2025-01-19 09:00' },
      { id: 2, type: 'voice', sender: 'teacher', content: 'voice_note_1.m4a', duration: '0:45', timestamp: '2025-01-19 09:05' },
      { id: 3, type: 'text', sender: 'student', content: 'I practiced the verses. Here is my recitation', timestamp: '2025-01-19 14:30' },
      { id: 4, type: 'voice', sender: 'student', content: 'student_recitation_1.m4a', duration: '2:15', timestamp: '2025-01-19 14:31' },
      { id: 5, type: 'text', sender: 'teacher', content: 'Good progress! But you still need to work on verses 12-13', timestamp: '2025-01-19 16:00' },
    ],
    'ASG002': [
      { id: 1, type: 'text', sender: 'teacher', content: 'Focus on proper pronunciation of غ and خ', timestamp: '2025-01-17 10:00' },
      { id: 2, type: 'voice', sender: 'student', content: 'student_practice_2.m4a', duration: '1:30', timestamp: '2025-01-17 15:00' },
      { id: 3, type: 'voice', sender: 'teacher', content: 'teacher_feedback_2.m4a', duration: '1:00', timestamp: '2025-01-17 16:30' },
      { id: 4, type: 'text', sender: 'teacher', content: 'Excellent work! Assignment completed successfully!', timestamp: '2025-01-17 16:31' },
    ],
    'ASG004': [
      { id: 1, type: 'text', sender: 'teacher', content: 'You submitted late. Please explain and complete the recitation', timestamp: '2025-01-16 09:00' },
      { id: 2, type: 'text', sender: 'student', content: 'Sorry teacher, I was sick. Here is my recitation', timestamp: '2025-01-16 10:30' },
      { id: 3, type: 'voice', sender: 'student', content: 'late_submission.m4a', duration: '3:00', timestamp: '2025-01-16 10:31' },
    ]
  };

  // Get unique classes from assignments
  const uniqueClasses = [...new Set(assignments.map(a => a.class))].sort();

  // Messages data
  const inboxMessages = [
    {
      id: 'MSG001',
      from: 'Al-Noor Academy Admin',
      fromEmail: 'admin@alnoor.edu',
      subject: 'Staff Meeting Tomorrow',
      content: 'Please attend the staff meeting tomorrow at 3 PM in the conference room. We will discuss the upcoming parent-teacher conferences and curriculum updates.',
      date: '2 hours ago',
      read: false,
      type: 'important',
      hasAttachment: false
    },
    {
      id: 'MSG002',
      from: 'Ahmed Hassan (Parent)',
      fromEmail: 'ahmed.hassan@email.com',
      subject: 'Question about Aisha\'s progress',
      content: 'I wanted to check on Aisha\'s progress in Quran memorization. She mentioned she is working on Surah Al-Mulk. Could we schedule a meeting?',
      date: '5 hours ago',
      read: false,
      type: 'normal',
      hasAttachment: false
    },
    {
      id: 'MSG003',
      from: 'Principal Dr. Ahmad Hassan',
      fromEmail: 'principal@alnoor.edu',
      subject: 'Quran Competition Planning',
      content: 'We need to discuss the upcoming Quran competition. Please prepare your students and submit the list of participants by Friday.',
      date: 'Yesterday',
      read: true,
      type: 'important',
      hasAttachment: true
    },
    {
      id: 'MSG004',
      from: 'Omar Hassan (Student)',
      fromEmail: 'STU002@school.com',
      subject: 'Assignment submission delay',
      content: 'Assalamu alaikum Teacher, I will be late submitting my Tajweed assignment due to illness. Can I submit it tomorrow?',
      date: '2 days ago',
      read: true,
      type: 'normal',
      hasAttachment: false
    },
    {
      id: 'MSG005',
      from: 'IT Support',
      fromEmail: 'it@alnoor.edu',
      subject: 'System Maintenance Notice',
      content: 'The school portal will be under maintenance this Saturday from 2 AM to 6 AM. Please save your work.',
      date: '3 days ago',
      read: true,
      type: 'normal',
      hasAttachment: false
    }
  ];

  const sentMessages = [
    {
      id: 'SENT001',
      to: 'All Parents - Class 6A',
      toEmail: 'parents-6a@alnoor.edu',
      subject: 'Weekly Progress Update',
      content: 'Dear Parents, This week we completed Surah Al-Mulk and started with Surah Al-Qalam. Students are making excellent progress. Please encourage them to practice at home.',
      date: '1 hour ago',
      type: 'normal',
      hasAttachment: false
    },
    {
      id: 'SENT002',
      to: 'Aisha Ahmed',
      toEmail: 'STU001@school.com',
      subject: 'Great work on your recitation!',
      content: 'MashaAllah Aisha! Your recitation of Surah Al-Mulk was excellent. Keep up the good work!',
      date: 'Yesterday',
      type: 'normal',
      hasAttachment: false
    },
    {
      id: 'SENT003',
      to: 'Ahmed Hassan (Parent)',
      toEmail: 'ahmed.hassan@email.com',
      subject: 'Re: Question about Aisha\'s progress',
      content: 'Wa alaikum assalam, Thank you for your message. Aisha is doing excellent in her memorization. I am available for a meeting on Thursday at 4 PM or Friday at 3 PM.',
      date: '2 days ago',
      type: 'normal',
      hasAttachment: false
    },
    {
      id: 'SENT004',
      to: 'School Admin',
      toEmail: 'admin@alnoor.edu',
      subject: 'Class 6A Attendance Report',
      content: 'Please find attached the attendance report for Class 6A for this month. Overall attendance is 94%.',
      date: '1 week ago',
      type: 'normal',
      hasAttachment: true
    }
  ];

  const archivedMessages = [
    {
      id: 'ARCH001',
      from: 'Previous Principal',
      fromEmail: 'old.principal@alnoor.edu',
      subject: 'Welcome to Al-Noor Academy',
      content: 'Welcome to our school. We are excited to have you join our teaching team.',
      date: '2 months ago',
      read: true,
      type: 'normal',
      hasAttachment: true
    },
    {
      id: 'ARCH002',
      from: 'School Admin',
      fromEmail: 'admin@alnoor.edu',
      subject: 'Teaching Schedule - Fall 2024',
      content: 'Your teaching schedule for Fall 2024 has been finalized. You will be teaching Classes 6A, 7A, and 5B.',
      date: '3 months ago',
      read: true,
      type: 'important',
      hasAttachment: true
    },
    {
      id: 'ARCH003',
      to: 'All Students - Class 6A',
      toEmail: 'students-6a@alnoor.edu',
      subject: 'Eid Mubarak!',
      content: 'Eid Mubarak to all students and families! May Allah accept your fasting and prayers.',
      date: '6 months ago',
      type: 'normal',
      hasAttachment: false
    }
  ];

  // For backwards compatibility with notifications
  const schoolMessages = inboxMessages;

  // School Events (all school-wide events)
  const schoolEvents = [
    { 
      id: 'EVT001',
      title: 'Quran Competition Finals', 
      date: '2025-01-25', 
      time: '10:00 AM - 2:00 PM',
      type: 'competition',
      location: 'Main Hall',
      description: 'Annual Quran recitation and memorization competition finals',
      participants: 'All Classes',
      color: 'purple'
    },
    { 
      id: 'EVT002',
      title: 'Parent-Teacher Meeting', 
      date: '2025-01-20', 
      time: '2:00 PM - 5:00 PM',
      type: 'meeting',
      location: 'Individual Classrooms',
      description: 'Discuss student progress with parents',
      participants: 'All Teachers & Parents',
      color: 'blue'
    },
    { 
      id: 'EVT003',
      title: 'Islamic Studies Workshop', 
      date: '2025-01-18', 
      time: '9:00 AM - 12:00 PM',
      type: 'workshop',
      location: 'Lecture Hall',
      description: 'Professional development workshop on new teaching methods',
      participants: 'All Teachers',
      color: 'green'
    },
    { 
      id: 'EVT004',
      title: 'School Assembly', 
      date: '2025-01-15', 
      time: '8:00 AM - 9:00 AM',
      type: 'assembly',
      location: 'Main Hall',
      description: 'Weekly school assembly and announcements',
      participants: 'All Students & Teachers',
      color: 'orange'
    },
    { 
      id: 'EVT005',
      title: 'Eid Celebration', 
      date: '2025-01-28', 
      time: '10:00 AM - 1:00 PM',
      type: 'celebration',
      location: 'School Grounds',
      description: 'School-wide Eid celebration with activities',
      participants: 'Everyone',
      color: 'yellow'
    },
    { 
      id: 'EVT006',
      title: 'Staff Meeting', 
      date: '2025-01-22', 
      time: '3:30 PM - 5:00 PM',
      type: 'meeting',
      location: 'Conference Room',
      description: 'Monthly staff meeting to discuss curriculum',
      participants: 'All Teachers',
      color: 'gray'
    },
    // Events for week view (Jan 7-13)
    {
      id: 'EVT007',
      title: 'Morning Assembly',
      date: '2025-01-07',
      time: '8:00 AM - 8:30 AM',
      type: 'assembly',
      location: 'Main Hall',
      description: 'Weekly morning assembly',
      participants: 'All Students',
      color: 'blue'
    },
    {
      id: 'EVT008',
      title: 'Quran Club Meeting',
      date: '2025-01-08',
      time: '2:00 PM - 3:30 PM',
      type: 'club',
      location: 'Room 105',
      description: 'Weekly Quran memorization club',
      participants: 'Club Members',
      color: 'green'
    },
    {
      id: 'EVT009',
      title: 'Parent Workshop',
      date: '2025-01-09',
      time: '10:00 AM - 12:00 PM',
      type: 'workshop',
      location: 'Lecture Hall',
      description: 'Supporting Quran learning at home',
      participants: 'Parents',
      color: 'purple'
    },
    {
      id: 'EVT010',
      title: 'Competition Practice',
      date: '2025-01-10',
      time: '3:00 PM - 5:00 PM',
      type: 'practice',
      location: 'Room 201',
      description: 'Practice for upcoming competition',
      participants: 'Selected Students',
      color: 'orange'
    },
    {
      id: 'EVT011',
      title: 'Friday Prayer',
      date: '2025-01-10',
      time: '12:30 PM - 1:30 PM',
      type: 'prayer',
      location: 'School Mosque',
      description: 'Jummah prayer',
      participants: 'All',
      color: 'green'
    },
    {
      id: 'EVT012',
      title: 'Tajweed Workshop',
      date: '2025-01-11',
      time: '9:00 AM - 11:00 AM',
      type: 'workshop',
      location: 'Room 203',
      description: 'Advanced tajweed training',
      participants: 'Senior Students',
      color: 'blue'
    },
    {
      id: 'EVT013',
      title: 'Teacher Planning',
      date: '2025-01-13',
      time: '2:00 PM - 4:00 PM',
      type: 'meeting',
      location: 'Conference Room',
      description: 'Weekly planning session',
      participants: 'All Teachers',
      color: 'gray'
    }
  ];

  // Teacher's Personal Calendar (only their classes and events)
  const teacherCalendar = [
    {
      id: 'TCH001',
      title: 'Class 6A - Quran Memorization',
      date: '2025-01-11',
      time: '8:00 AM - 9:30 AM',
      type: 'class',
      location: 'Room 101',
      recurring: 'daily',
      students: 22,
      color: 'green'
    },
    {
      id: 'TCH002',
      title: 'Class 7A - Tajweed',
      date: '2025-01-11',
      time: '9:30 AM - 11:00 AM',
      type: 'class',
      location: 'Room 102',
      recurring: 'daily',
      students: 18,
      color: 'blue'
    },
    {
      id: 'TCH003',
      title: 'Class 5B - Memorization Review',
      date: '2025-01-11',
      time: '11:00 AM - 12:30 PM',
      type: 'class',
      location: 'Room 201',
      recurring: 'daily',
      students: 20,
      color: 'purple'
    },
    {
      id: 'TCH004',
      title: 'Office Hours',
      date: '2025-01-11',
      time: '2:00 PM - 3:00 PM',
      type: 'office',
      location: 'Teacher\'s Room',
      recurring: 'daily',
      color: 'orange'
    },
    {
      id: 'TCH005',
      title: 'Grade Submissions Due',
      date: '2025-01-15',
      time: '5:00 PM',
      type: 'deadline',
      description: 'Submit grades for mid-term assessments',
      color: 'red'
    },
    {
      id: 'TCH006',
      title: 'Parent Meeting - Aisha Ahmed',
      date: '2025-01-16',
      time: '3:00 PM - 3:30 PM',
      type: 'meeting',
      location: 'Room 101',
      description: 'Discuss Aisha\'s progress with parents',
      color: 'blue'
    }
  ];

  // Today's Schedule
  const todaySchedule = [
    { time: '8:00 AM', class: 'Class 6A', subject: 'Quran Memorization', room: 'Room 101', students: 22 },
    { time: '9:30 AM', class: 'Class 7A', subject: 'Tajweed', room: 'Room 102', students: 18 },
    { time: '11:00 AM', class: 'Class 5B', subject: 'Memorization Review', room: 'Room 201', students: 20 },
    { time: '2:00 PM', activity: 'Office Hours', location: 'Teacher\'s Room' }
  ];

  const tabs = ['overview', 'my classes', 'students', 'assignments', 'attendance', 'messages', 'events'];


  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Teacher Dashboard</h1>
                <p className="text-sm text-gray-500">{teacherInfo.name} • {teacherInfo.school}</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative" ref={notificationRef}>
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 hover:bg-gray-100 rounded-lg relative"
                >
                  <Bell className="w-5 h-5 text-gray-600" />
                  {schoolMessages.filter(m => !m.read).length > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      <div className="p-4 hover:bg-gray-50 border-b">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm font-medium">New submission from Aisha Ahmed</p>
                            <p className="text-xs text-gray-500">Surah Al-Mulk - 5 minutes ago</p>
                          </div>
                        </div>
                      </div>
                      <div className="p-4 hover:bg-gray-50 border-b">
                        <div className="flex items-start space-x-3">
                          <div className="w-2 h-2 bg-green-600 rounded-full mt-2"></div>
                          <div>
                            <p className="text-sm font-medium">Message from school admin</p>
                            <p className="text-xs text-gray-500">Staff meeting reminder - 1 hour ago</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Settings */}
              <div className="relative" ref={settingsRef}>
                <button 
                  onClick={() => setShowSettings(!showSettings)}
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Settings className="w-5 h-5 text-gray-600" />
                </button>
                
                {showSettings && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-lg border z-50">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">Settings</h3>
                    </div>
                    <div className="py-2">
                      <button 
                        onClick={() => {
                          setShowProfile(true);
                          setShowSettings(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3"
                      >
                        <User className="w-4 h-4" />
                        <span>My Profile</span>
                      </button>
                      <div className="border-t mt-2 pt-2">
                        <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3 text-red-600">
                          <LogOut className="w-4 h-4" />
                          <span>Logout</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b shadow-sm">
        <div className="flex justify-center">
          <nav className="flex space-x-2 py-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`
                  relative py-3 px-4 font-medium text-sm capitalize whitespace-nowrap rounded-lg
                  transition-all duration-200 ease-in-out
                  ${
                    activeTab === tab
                      ? 'text-white bg-green-600 shadow-sm'
                      : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                  }
                  group
                `}
              >
                <span className="relative z-10">{tab}</span>
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>
                )}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6">
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Welcome Section with Live Time */}
            <div className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white bg-opacity-10 rounded-full blur-3xl"></div>
              <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 bg-white bg-opacity-10 rounded-full blur-3xl"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Assalamu Alaikum, {teacherInfo.name}! 🌟</h2>
                    <p className="text-green-100 text-lg">May Allah bless your teaching today</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                    <p className="text-green-100">{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Students Card */}
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Users className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">{stats.totalStudents}</p>
                    <p className="text-sm text-gray-600">Total Students</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600 font-medium">↑ 3 new this month</span>
                  <button onClick={() => setActiveTab('students')} className="text-blue-600 hover:text-blue-800 font-medium">View All →</button>
                </div>
              </div>

              {/* Assignments Card */}
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center shadow-lg">
                    <FileText className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">{stats.pendingSubmissions}</p>
                    <p className="text-sm text-gray-600">Pending Review</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-orange-600 font-medium">⏰ 3 due today</span>
                  <button onClick={() => setActiveTab('assignments')} className="text-purple-600 hover:text-purple-800 font-medium">Review Now →</button>
                </div>
              </div>

              {/* Attendance Card */}
              <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                    <CheckCircle className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">92%</p>
                    <p className="text-sm text-gray-600">Today's Attendance</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600 font-medium">✓ 2 classes done</span>
                  <button onClick={() => setActiveTab('attendance')} className="text-green-600 hover:text-green-800 font-medium">Take Attendance →</button>
                </div>
              </div>

              {/* Messages Card */}
              <div className="bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-14 h-14 bg-gradient-to-br from-orange-500 to-red-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Mail className="w-7 h-7 text-white" />
                  </div>
                  <div className="text-right">
                    <p className="text-3xl font-bold text-gray-900">5</p>
                    <p className="text-sm text-gray-600">New Messages</p>
                  </div>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-red-600 font-medium">• 2 from parents</span>
                  <button onClick={() => setActiveTab('messages')} className="text-orange-600 hover:text-orange-800 font-medium">Read Messages →</button>
                </div>
              </div>
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Left Column - Schedule & Classes */}
              <div className="lg:col-span-2 space-y-6">
                {/* Today's Classes */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4">
                    <h3 className="text-lg font-semibold text-white flex items-center">
                      <Calendar className="w-5 h-5 mr-2" />
                      Today's Schedule
                    </h3>
                  </div>
                  <div className="p-6 space-y-3">
                    {todaySchedule.map((item, index) => (
                      <div key={index} className={`flex items-center justify-between p-4 rounded-xl transition-all ${
                        index === 0 ? 'bg-green-50 border-2 border-green-300' : 'bg-gray-50 hover:bg-gray-100'
                      }`}>
                        <div className="flex items-center space-x-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                            index === 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
                          }`}>
                            <Clock className="w-6 h-6" />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900">{item.class || item.activity}</p>
                            <p className="text-sm text-gray-600">
                              {item.subject && `${item.subject} • `}
                              {item.room || item.location}
                              {item.students && ` • ${item.students} students`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-bold text-gray-700">{item.time}</span>
                          {index === 0 && <p className="text-xs text-green-600 font-medium mt-1">Now</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Recent Assignments Activity */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="border-b border-gray-200 px-6 py-4 flex items-center justify-between">
                    <h3 className="text-lg font-semibold flex items-center">
                      <FileText className="w-5 h-5 mr-2 text-purple-600" />
                      Recent Assignment Activity
                    </h3>
                    <button onClick={() => setActiveTab('assignments')} className="text-sm text-purple-600 hover:text-purple-800 font-medium">
                      View All →
                    </button>
                  </div>
                  <div className="p-6 space-y-4">
                    {assignments.slice(0, 4).map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-4 bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl">
                        <div className="flex items-center space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            assignment.status === 'submitted' ? 'bg-blue-500' :
                            assignment.status === 'reviewed' ? 'bg-green-500' :
                            assignment.status === 'late' ? 'bg-red-500' :
                            'bg-yellow-500'
                          }`}>
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{assignment.studentName}</p>
                            <p className="text-sm text-gray-600">{assignment.title} • {assignment.class}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            assignment.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                            assignment.status === 'reviewed' ? 'bg-green-100 text-green-700' :
                            assignment.status === 'late' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {assignment.status}
                          </span>
                          <p className="text-xs text-gray-500 mt-1">{assignment.dueDate}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Right Column - Quick Actions & Insights */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-green-600" />
                    Quick Actions
                  </h3>
                  <div className="space-y-3">
                    <button 
                      onClick={() => setActiveTab('assignments')}
                      className="w-full p-3 bg-white hover:bg-green-100 border border-green-300 rounded-xl transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3">
                        <Plus className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Create Assignment</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                    </button>
                    <button 
                      onClick={() => setActiveTab('messages')}
                      className="w-full p-3 bg-white hover:bg-green-100 border border-green-300 rounded-xl transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3">
                        <MessageSquare className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Send Announcement</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                    </button>
                    <button 
                      onClick={() => setActiveTab('events')}
                      className="w-full p-3 bg-white hover:bg-green-100 border border-green-300 rounded-xl transition-all flex items-center justify-between group"
                    >
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-green-600" />
                        <span className="font-medium">Schedule Event</span>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-green-600" />
                    </button>
                  </div>
                </div>

                {/* Performance Insights */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-indigo-600" />
                    Performance Insights
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Class Average</span>
                        <span className="text-sm font-bold text-gray-900">{stats.averageGrade}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-500 h-2 rounded-full" style={{width: `${stats.averageGrade}%`}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Completion Rate</span>
                        <span className="text-sm font-bold text-gray-900">78%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{width: '78%'}}></div>
                      </div>
                    </div>
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm text-gray-600">Attendance Rate</span>
                        <span className="text-sm font-bold text-gray-900">92%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full" style={{width: '92%'}}></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Upcoming Events */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                  <h3 className="text-lg font-semibold mb-4 flex items-center">
                    <CalendarDays className="w-5 h-5 mr-2 text-orange-600" />
                    Upcoming Events
                  </h3>
                  <div className="space-y-3">
                    {schoolEvents.slice(0, 3).map((event) => (
                      <div key={event.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          event.color === 'purple' ? 'bg-purple-500' :
                          event.color === 'blue' ? 'bg-blue-500' :
                          event.color === 'green' ? 'bg-green-500' :
                          'bg-orange-500'
                        }`}></div>
                        <div className="flex-1">
                          <p className="font-medium text-sm text-gray-900">{event.title}</p>
                          <p className="text-xs text-gray-600">{event.date} • {event.time}</p>
                        </div>
                      </div>
                    ))}
                    <button onClick={() => setActiveTab('events')} className="text-sm text-orange-600 hover:text-orange-800 font-medium">
                      View Calendar →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'my classes' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h2 className="text-xl font-semibold mb-6">My Classes</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {myClasses.map((cls) => (
                  <div key={cls.id} className="bg-white border-2 border-gray-200 rounded-xl hover:shadow-xl transition-all duration-300 overflow-hidden group">
                    <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4">
                      <div className="flex items-center justify-between">
                        <h3 className="font-bold text-xl text-white">{cls.name}</h3>
                        <span className="px-3 py-1 bg-white bg-opacity-20 backdrop-blur text-white rounded-full text-xs font-semibold">
                          Active
                        </span>
                      </div>
                      <p className="text-green-50 text-sm mt-1">{cls.subject}</p>
                    </div>
                    
                    <div className="p-5">
                      <div className="grid grid-cols-2 gap-3 mb-4">
                        <div className="flex items-center text-sm">
                          <Users className="w-4 h-4 mr-2 text-green-600" />
                          <span className="text-gray-700 font-medium">{cls.students}</span>
                          <span className="text-gray-500 ml-1">students</span>
                        </div>
                        <div className="flex items-center text-sm">
                          <Home className="w-4 h-4 mr-2 text-green-600" />
                          <span className="text-gray-700">{cls.room}</span>
                        </div>
                        <div className="flex items-center text-sm col-span-2">
                          <Clock className="w-4 h-4 mr-2 text-green-600" />
                          <span className="text-gray-700">{cls.schedule}</span>
                        </div>
                      </div>

                      <div className="border-t pt-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm text-gray-600">Class Progress</span>
                          <span className="text-sm font-bold text-gray-800">{cls.progress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                          <div 
                            className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500" 
                            style={{width: `${cls.progress}%`}}
                          />
                        </div>
                      </div>

                      <div className="mt-4 pt-4 border-t">
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
                          <span className="flex items-center">
                            <CalendarDays className="w-3 h-3 mr-1" />
                            Next: {cls.nextClass}
                          </span>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => {
                              setSelectedClassDetails({...cls, ...classDetails[cls.id]});
                              setShowClassDetails(true);
                            }}
                            className="flex-1 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition text-sm font-medium flex items-center justify-center"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View Details
                          </button>
                          <button 
                            onClick={() => setActiveTab('attendance')}
                            className="px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'students' && (
          <div className="space-y-6">
            {/* Students Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">My Students</h2>
                  <p className="text-green-100 mt-1">
                    {(() => {
                      const filteredCount = myStudents
                        .filter(s => selectedClass === 'all' || s.classId === selectedClass)
                        .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase())).length;
                      const totalCount = myStudents.length;
                      return filteredCount === totalCount 
                        ? `Showing all ${totalCount} students` 
                        : `Showing ${filteredCount} of ${totalCount} students`;
                    })()}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {/* View Mode Toggle */}
                  <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-1 flex">
                    <button
                      onClick={() => setStudentsViewMode('grid')}
                      className={`p-2 rounded transition ${
                        studentsViewMode === 'grid' 
                          ? 'bg-white text-green-600' 
                          : 'text-white hover:bg-white hover:bg-opacity-10'
                      }`}
                      title="Grid View"
                    >
                      <Grid3x3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setStudentsViewMode('list')}
                      className={`p-2 rounded transition ${
                        studentsViewMode === 'list' 
                          ? 'bg-white text-green-600' 
                          : 'text-white hover:bg-white hover:bg-opacity-10'
                      }`}
                      title="List View"
                    >
                      <List className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <select 
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="px-4 py-2 bg-white bg-opacity-20 backdrop-blur text-white rounded-lg border border-green-400 focus:ring-2 focus:ring-white"
                  >
                    <option value="all" className="text-gray-800">All Classes</option>
                    {myClasses.map(cls => (
                      <option key={cls.id} value={cls.id} className="text-gray-800">{cls.name} ({myStudents.filter(s => s.classId === cls.id).length} students)</option>
                    ))}
                  </select>
                  <div className="relative">
                    <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-green-200" />
                    <input
                      type="text"
                      placeholder="Search by name..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 pr-10 py-2 bg-white bg-opacity-20 backdrop-blur text-white placeholder-green-200 rounded-lg border border-green-400 focus:ring-2 focus:ring-white w-64"
                    />
                    {searchTerm && (
                      <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-green-200 hover:text-white"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  {(selectedClass !== 'all' || searchTerm) && (
                    <button
                      onClick={() => {
                        setSelectedClass('all');
                        setSearchTerm('');
                      }}
                      className="px-3 py-2 bg-white bg-opacity-10 hover:bg-opacity-20 backdrop-blur text-white rounded-lg border border-green-400 text-sm font-medium transition"
                    >
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Students View */}
            {(() => {
              const filteredStudents = myStudents
                .filter(s => selectedClass === 'all' || s.classId === selectedClass)
                .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()));
              
              if (filteredStudents.length === 0) {
                return (
                  <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-700 mb-2">No students found</h3>
                    <p className="text-gray-500 mb-6">
                      {selectedClass !== 'all' && searchTerm 
                        ? `No students matching "${searchTerm}" in ${myClasses.find(c => c.id === selectedClass)?.name}`
                        : selectedClass !== 'all' 
                        ? `No students in ${myClasses.find(c => c.id === selectedClass)?.name}`
                        : searchTerm 
                        ? `No students matching "${searchTerm}"`
                        : 'No students available'}
                    </p>
                    {(selectedClass !== 'all' || searchTerm) && (
                      <button
                        onClick={() => {
                          setSelectedClass('all');
                          setSearchTerm('');
                        }}
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                      >
                        Clear Filters
                      </button>
                    )}
                  </div>
                );
              }
              
              // List View
              if (studentsViewMode === 'list') {
                return (
                  <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200">
                            <th className="text-left py-4 px-6 font-semibold text-gray-700">Student</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700">Class</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700">Quran Progress</th>
                            <th className="text-center py-4 px-6 font-semibold text-gray-700">Attendance</th>
                            <th className="text-center py-4 px-6 font-semibold text-gray-700">Grade</th>
                            <th className="text-left py-4 px-6 font-semibold text-gray-700">Status</th>
                            <th className="text-center py-4 px-6 font-semibold text-gray-700">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                          {filteredStudents.map((student) => (
                            <tr key={student.id} className="hover:bg-gray-50 transition">
                              <td className="py-4 px-6">
                                <div className="flex items-center space-x-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center">
                                    <span className="text-white font-bold text-sm">
                                      {student.name.split(' ').map(n => n[0]).join('')}
                                    </span>
                                  </div>
                                  <div>
                                    <p className="font-semibold text-gray-900">{student.name}</p>
                                    <p className="text-xs text-gray-500">ID: {student.id} • Age: {student.age}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <span className="text-sm text-gray-700">{student.class}</span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="space-y-1">
                                  <div className="flex items-center space-x-2">
                                    <BookOpen className="w-4 h-4 text-purple-500" />
                                    <span className="text-sm text-gray-700">
                                      Surah {student.currentSurah} - Ayah {student.currentAyah}/{student.totalAyahs}
                                    </span>
                                  </div>
                                  <div className="flex items-center space-x-2">
                                    <div className="w-24 bg-gray-200 rounded-full h-1.5">
                                      <div 
                                        className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full" 
                                        style={{width: `${student.progress}%`}}
                                      />
                                    </div>
                                    <span className="text-xs font-medium text-gray-600">{student.progress}%</span>
                                  </div>
                                  <p className="text-xs text-gray-500">Juz {student.currentJuz}/30 • Memorized: {student.memorized}</p>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                                  student.attendance >= 95 ? 'bg-green-100 text-green-800' : 
                                  student.attendance >= 80 ? 'bg-yellow-100 text-yellow-800' : 
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {student.attendance}%
                                </span>
                              </td>
                              <td className="py-4 px-6 text-center">
                                <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                                  student.grade === 'A+' || student.grade === 'A' ? 'bg-green-100 text-green-800' :
                                  student.grade.startsWith('B') ? 'bg-blue-100 text-blue-800' :
                                  'bg-yellow-100 text-yellow-800'
                                }`}>
                                  {student.grade}
                                </span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center space-x-2">
                                  <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                    student.assignmentStatus === 'submitted' ? 'bg-blue-100 text-blue-700' :
                                    student.assignmentStatus === 'reviewed' ? 'bg-purple-100 text-purple-700' :
                                    student.assignmentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                    student.assignmentStatus === 'late' ? 'bg-red-100 text-red-700' :
                                    'bg-gray-100 text-gray-700'
                                  }`}>
                                    {student.assignmentStatus}
                                  </span>
                                  <span className="text-xs text-gray-500">{student.lastActive}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center justify-center space-x-2">
                                  <button 
                                    onClick={() => {
                                      setSelectedStudent(student);
                                      setShowStudentDetails(true);
                                    }}
                                    className="p-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                                    title="View Details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      // Navigate to Quran viewer for this student
                                      console.log('Opening Quran viewer for student:', student.id);
                                      // TODO: Implement Quran viewer navigation
                                    }}
                                    className="p-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition"
                                    title="View Quran Progress"
                                  >
                                    <Book className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setActiveTab('messages');
                                      setMessageRecipient({type: 'student', name: student.name, email: `${student.id}@school.com`});
                                      setShowMessageModal(true);
                                    }}
                                    className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                                    title="Message Student"
                                  >
                                    <MessageSquare className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => {
                                      setActiveTab('messages');
                                      setMessageRecipient({type: 'parent', name: student.parentName, email: student.parentEmail});
                                      setShowMessageModal(true);
                                    }}
                                    className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                                    title="Message Parent"
                                  >
                                    <Mail className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              }
              
              // Grid View
              return (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredStudents.map((student) => (
                <div key={student.id} className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
                  {/* Student Card Header */}
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-white bg-opacity-30 backdrop-blur rounded-full flex items-center justify-center">
                          <span className="text-xl font-bold text-white">
                            {student.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-bold text-white">{student.name}</h3>
                          <p className="text-green-100 text-sm">{student.class} • Age {student.age}</p>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                        student.grade === 'A+' || student.grade === 'A' ? 'bg-green-200 text-green-800' :
                        student.grade.startsWith('B') ? 'bg-blue-200 text-blue-800' :
                        'bg-yellow-200 text-yellow-800'
                      }`}>
                        {student.grade}
                      </span>
                    </div>
                  </div>

                  {/* Quran Progress Section */}
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-700 flex items-center">
                        <BookOpen className="w-4 h-4 mr-2 text-green-600" />
                        Quran Progress
                      </h4>
                      <span className="text-xs text-gray-500">{student.lastActive}</span>
                    </div>
                    
                    {/* Current Progress Cards */}
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <div className="bg-purple-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-purple-600 font-medium">Surah</p>
                        <p className="text-sm font-bold text-purple-800">{student.currentSurah}</p>
                        <p className="text-xs text-purple-500">Ayah {student.currentAyah}/{student.totalAyahs}</p>
                      </div>
                      <div className="bg-blue-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-blue-600 font-medium">Juz</p>
                        <p className="text-lg font-bold text-blue-800">{student.currentJuz}/30</p>
                      </div>
                      <div className="bg-green-50 rounded-lg p-2 text-center">
                        <p className="text-xs text-green-600 font-medium">Memorized</p>
                        <p className="text-sm font-bold text-green-800">{student.memorized}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-xs text-gray-600">
                        <span>Overall Progress</span>
                        <span className="font-bold">{student.progress}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-green-400 to-emerald-500 rounded-full transition-all duration-500" 
                          style={{width: `${student.progress}%`}}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Stats Section */}
                  <div className="p-4 bg-gray-50">
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Attendance:</span>
                        <span className={`font-bold ${
                          student.attendance >= 95 ? 'text-green-600' : 
                          student.attendance >= 80 ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {student.attendance}%
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Status:</span>
                        <span className={`px-2 py-0.5 rounded text-xs font-medium ${
                          student.assignmentStatus === 'submitted' ? 'bg-blue-100 text-blue-700' :
                          student.assignmentStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {student.assignmentStatus}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="p-4 bg-white border-t">
                    <div className="flex items-center justify-between">
                      <button 
                        onClick={() => {
                          setSelectedStudent(student);
                          setShowStudentDetails(true);
                        }}
                        className="flex items-center space-x-2 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm font-medium"
                      >
                        <Eye className="w-4 h-4" />
                        <span>View Progress</span>
                      </button>
                      <div className="flex items-center space-x-2">
                        <button 
                          onClick={() => {
                            // Navigate to Quran viewer for this student
                            console.log('Opening Quran viewer for student:', student.id);
                            // TODO: Implement Quran viewer navigation
                          }}
                          className="p-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 transition"
                          title="View Quran Progress"
                        >
                          <Book className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setActiveTab('messages');
                            setMessageRecipient({type: 'student', name: student.name, email: `${student.id}@school.com`});
                            setShowMessageModal(true);
                          }}
                          className="p-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                          title="Message Student"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => {
                            setActiveTab('messages');
                            setMessageRecipient({type: 'parent', name: student.parentName, email: student.parentEmail});
                            setShowMessageModal(true);
                          }}
                          className="p-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                          title="Message Parent"
                        >
                          <Mail className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {activeTab === 'assignments' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Assignments</h2>
                  <p className="text-sm text-gray-500 mt-1">
                    {assignments.filter(assignment => 
                      (assignmentStatusFilter === 'all' || assignment.status === assignmentStatusFilter) &&
                      (assignmentClassFilter === 'all' || assignment.class === assignmentClassFilter) &&
                      (assignmentSearchTerm === '' || assignment.studentName.toLowerCase().includes(assignmentSearchTerm.toLowerCase()))
                    ).length} of {assignments.length} assignments
                  </p>
                </div>
<div className="flex flex-wrap items-center gap-3">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search by student name..."
                      value={assignmentSearchTerm}
                      onChange={(e) => setAssignmentSearchTerm(e.target.value)}
                      className="pl-9 pr-3 py-2 border rounded-lg text-sm w-64"
                    />
                    <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                    {assignmentSearchTerm && (
                      <button
                        onClick={() => setAssignmentSearchTerm('')}
                        className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                  <select 
                    value={assignmentClassFilter}
                    onChange={(e) => setAssignmentClassFilter(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="all">All Classes</option>
                    {uniqueClasses.map(cls => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                  <select 
                    value={assignmentStatusFilter}
                    onChange={(e) => setAssignmentStatusFilter(e.target.value)}
                    className="px-3 py-2 border rounded-lg text-sm"
                  >
                    <option value="all">All Status</option>
                    <option value="pending">Pending</option>
                    <option value="assigned">Assigned</option>
                    <option value="submitted">Submitted</option>
                    <option value="reviewed">Reviewed</option>
                    <option value="completed">Completed</option>
                    <option value="late">Late</option>
                  </select>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs text-gray-500">Mistake Types:</span>
                    <div className="flex items-center space-x-1">
                      <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded">Recap</span>
                      <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">Tajweed</span>
                      <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded">Haraka</span>
                      <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded">Letter</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                {(() => {
                  const filteredAssignments = assignments.filter(assignment => 
                    (assignmentStatusFilter === 'all' || assignment.status === assignmentStatusFilter) &&
                    (assignmentClassFilter === 'all' || assignment.class === assignmentClassFilter) &&
                    (assignmentSearchTerm === '' || assignment.studentName.toLowerCase().includes(assignmentSearchTerm.toLowerCase()))
                  );
                  
                  if (filteredAssignments.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <p className="text-gray-500">No assignments found matching the selected filters.</p>
                        <button 
                          onClick={() => {
                            setAssignmentStatusFilter('all');
                            setAssignmentClassFilter('all');
                            setAssignmentSearchTerm('');
                          }}
                          className="mt-4 text-green-600 hover:text-green-700 text-sm underline"
                        >
                          Clear filters
                        </button>
                      </div>
                    );
                  }
                  
                  return filteredAssignments.map((assignment) => (
                  <div 
                    key={assignment.id} 
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setShowAssignmentConversation(true);
                    }}
                    className={`border-2 rounded-lg hover:shadow-lg transition overflow-hidden cursor-pointer ${
                      assignment.status === 'completed' ? 'border-yellow-500 bg-gradient-to-r from-yellow-50 to-amber-50' :
                      assignment.primaryMistakeType ? mistakeTypeColors[assignment.primaryMistakeType].border : 'border-gray-200'
                    }`}>
                    {assignment.primaryMistakeType && (
                      <div className={`h-2 ${
                        assignment.primaryMistakeType === 'recap' ? 'bg-purple-500' :
                        assignment.primaryMistakeType === 'tajweed' ? 'bg-orange-500' :
                        assignment.primaryMistakeType === 'haraka' ? 'bg-red-500' :
                        'bg-amber-500'
                      }`} />
                    )}
                    <div className="p-5">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-lg">{assignment.title}</h3>
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            assignment.status === 'completed' ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-white' :
                            assignment.status === 'reviewed' ? 'bg-green-100 text-green-700' :
                            assignment.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                            assignment.status === 'late' ? 'bg-red-100 text-red-700' :
                            assignment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            assignment.status === 'assigned' ? 'bg-gray-100 text-gray-700' :
                            'bg-purple-100 text-purple-700'
                          }`}>
                            {assignment.status}
                          </span>
                          {assignment.feedbackGiven && (
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                              Feedback Given
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                          <span className="flex items-center">
                            <User className="w-4 h-4 mr-1" />
                            {assignment.studentName}
                          </span>
                          <span className="flex items-center">
                            <Users className="w-4 h-4 mr-1" />
                            {assignment.class}
                          </span>
                          <span className="flex items-center">
                            <Calendar className="w-4 h-4 mr-1" />
                            Due: {assignment.dueDate}
                          </span>
                          <span className="flex items-center">
                            <BookOpen className="w-4 h-4 mr-1" />
                            {assignment.type}
                          </span>
                        </div>
                        {assignment.notes && (
                          <p className="mt-2 text-sm text-gray-600 italic">Note: {assignment.notes}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-600 mb-2">Mistake Breakdown</p>
                        <div className="space-y-1">
                          {assignment.mistakes.recap > 0 && (
                            <div className="flex items-center justify-end space-x-2">
                              <span className="text-xs text-gray-600">Recap:</span>
                              <span className="px-2 py-1 bg-purple-100 text-purple-700 text-xs rounded font-semibold min-w-[24px] text-center">
                                {assignment.mistakes.recap}
                              </span>
                            </div>
                          )}
                          {assignment.mistakes.tajweed > 0 && (
                            <div className="flex items-center justify-end space-x-2">
                              <span className="text-xs text-gray-600">Tajweed:</span>
                              <span className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded font-semibold min-w-[24px] text-center">
                                {assignment.mistakes.tajweed}
                              </span>
                            </div>
                          )}
                          {assignment.mistakes.haraka > 0 && (
                            <div className="flex items-center justify-end space-x-2">
                              <span className="text-xs text-gray-600">Haraka:</span>
                              <span className="px-2 py-1 bg-red-100 text-red-700 text-xs rounded font-semibold min-w-[24px] text-center">
                                {assignment.mistakes.haraka}
                              </span>
                            </div>
                          )}
                          {assignment.mistakes.letter > 0 && (
                            <div className="flex items-center justify-end space-x-2">
                              <span className="text-xs text-gray-600">Letter:</span>
                              <span className="px-2 py-1 bg-amber-100 text-amber-700 text-xs rounded font-semibold min-w-[24px] text-center">
                                {assignment.mistakes.letter}
                              </span>
                            </div>
                          )}
                          {assignment.mistakeCount === 0 && (
                            <span className="text-xs text-green-600 font-semibold">No mistakes</span>
                          )}
                        </div>
                        {assignment.submittedDate && (
                          <p className="text-xs text-gray-500 mt-2">
                            Submitted: {assignment.submittedDate}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center space-x-2 mt-4">
                      <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm">
                        Open Student View
                      </button>
                      {assignment.status === 'submitted' && (
                        <button className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm">
                          Review & Feedback
                        </button>
                      )}
                      {assignment.status === 'pending' && (
                        <button className="px-3 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-sm">
                          Send Reminder
                        </button>
                      )}
                      {assignment.status === 'reviewed' && !assignment.feedbackGiven && (
                        <button className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 text-sm">
                          Add Feedback
                        </button>
                      )}
                    </div>
                    </div>
                  </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {/* Attendance Header with Controls */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">Attendance Management</h2>
                  <p className="text-sm text-gray-500 mt-1">Mark and track student attendance by class</p>
                </div>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2">
                  <Download className="w-4 h-4" />
                  <span>Export Report</span>
                </button>
              </div>

              {/* Class and Date Selection */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200 mb-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Users className="w-4 h-4 inline mr-1" />
                      Select Class
                    </label>
                    <select
                      value={selectedAttendanceClass}
                      onChange={(e) => {
                        setSelectedAttendanceClass(e.target.value);
                        setAttendanceSaveMessage('');
                      }}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-lg text-sm font-medium bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200"
                    >
                      {myClasses.map(cls => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} - {cls.subject} ({cls.students} students)
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <CalendarDays className="w-4 h-4 inline mr-1" />
                      Select Date
                    </label>
                    <input
                      type="date"
                      value={attendanceDate}
                      onChange={(e) => {
                        setAttendanceDate(e.target.value);
                        setAttendanceSaveMessage('');
                      }}
                      className="w-full px-4 py-3 border-2 border-green-300 rounded-lg text-sm font-medium bg-white focus:border-green-500 focus:ring-2 focus:ring-green-200"
                    />
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-4 gap-4 mb-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-green-600 font-medium">Present Today</p>
                      <p className="text-2xl font-bold text-green-700">
                        {(() => {
                          const todayData = attendanceHistory[attendanceDate]?.[selectedAttendanceClass] || {};
                          return Object.values(todayData).filter(record => record.status === 'present').length;
                        })()}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-red-50 to-pink-50 p-4 rounded-lg border border-red-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-red-600 font-medium">Absent</p>
                      <p className="text-2xl font-bold text-red-700">
                        {(() => {
                          const todayData = attendanceHistory[attendanceDate]?.[selectedAttendanceClass] || {};
                          return Object.values(todayData).filter(record => record.status === 'absent').length;
                        })()}
                      </p>
                    </div>
                    <X className="w-8 h-8 text-red-500" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-yellow-50 to-amber-50 p-4 rounded-lg border border-yellow-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-yellow-600 font-medium">Late</p>
                      <p className="text-2xl font-bold text-yellow-700">
                        {(() => {
                          const todayData = attendanceHistory[attendanceDate]?.[selectedAttendanceClass] || {};
                          return Object.values(todayData).filter(record => record.status === 'late').length;
                        })()}
                      </p>
                    </div>
                    <Clock className="w-8 h-8 text-yellow-500" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-blue-600 font-medium">Excused</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {(() => {
                          const todayData = attendanceHistory[attendanceDate]?.[selectedAttendanceClass] || {};
                          return Object.values(todayData).filter(record => record.status === 'excused').length;
                        })()}
                      </p>
                    </div>
                    <Info className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
              </div>

              {/* Attendance Marking Table */}
              <div className="bg-white rounded-lg border overflow-hidden">
                <div className="bg-gray-50 px-6 py-3 border-b">
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-gray-700">
                      {myClasses.find(c => c.id === selectedAttendanceClass)?.name} - {attendanceDate}
                    </h3>
                    <div className="flex items-center space-x-2">
                      <button className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 text-sm">
                        Mark All Present
                      </button>
                      <button className="px-3 py-1 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm">
                        Clear All
                      </button>
                    </div>
                  </div>
                </div>
                
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-3 px-6 text-sm font-medium text-gray-700">Student</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Present</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Absent</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Late</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Excused</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Notes</th>
                      <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">History</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {classDetails[selectedAttendanceClass]?.studentList?.map((student) => {
                      const currentRecord = attendanceHistory[attendanceDate]?.[selectedAttendanceClass]?.[student.id] || { status: '', note: '' };
                      const currentStatus = currentRecord.status;
                      const currentNote = currentRecord.note;
                      return (
                        <tr key={student.id} className="hover:bg-gray-50">
                          <td className="py-3 px-6">
                            <div className="flex items-center">
                              <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
                                currentStatus === 'present' ? 'bg-green-100' :
                                currentStatus === 'absent' ? 'bg-red-100' :
                                currentStatus === 'late' ? 'bg-yellow-100' :
                                currentStatus === 'excused' ? 'bg-blue-100' :
                                'bg-gray-100'
                              }`}>
                                <span className={`font-semibold text-sm ${
                                  currentStatus === 'present' ? 'text-green-700' :
                                  currentStatus === 'absent' ? 'text-red-700' :
                                  currentStatus === 'late' ? 'text-yellow-700' :
                                  currentStatus === 'excused' ? 'text-blue-700' :
                                  'text-gray-700'
                                }`}>
                                  {student.name.split(' ').map(n => n[0]).join('')}
                                </span>
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{student.name}</p>
                                <p className="text-xs text-gray-500">ID: {student.id}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                const newHistory = { ...attendanceHistory };
                                if (!newHistory[attendanceDate]) {
                                  newHistory[attendanceDate] = {};
                                }
                                if (!newHistory[attendanceDate][selectedAttendanceClass]) {
                                  newHistory[attendanceDate][selectedAttendanceClass] = {};
                                }
                                newHistory[attendanceDate][selectedAttendanceClass][student.id] = {
                                  status: 'present',
                                  note: currentNote
                                };
                                setAttendanceHistory(newHistory);
                              }}
                              className={`w-10 h-10 rounded-full border-2 transition-all ${
                                currentStatus === 'present'
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-gray-300 hover:border-green-400'
                              }`}
                            >
                              {currentStatus === 'present' && (
                                <CheckCircle className="w-6 h-6 text-white mx-auto" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                const newHistory = { ...attendanceHistory };
                                if (!newHistory[attendanceDate]) {
                                  newHistory[attendanceDate] = {};
                                }
                                if (!newHistory[attendanceDate][selectedAttendanceClass]) {
                                  newHistory[attendanceDate][selectedAttendanceClass] = {};
                                }
                                newHistory[attendanceDate][selectedAttendanceClass][student.id] = {
                                  status: 'absent',
                                  note: currentNote
                                };
                                setAttendanceHistory(newHistory);
                              }}
                              className={`w-10 h-10 rounded-full border-2 transition-all ${
                                currentStatus === 'absent'
                                  ? 'bg-red-500 border-red-500'
                                  : 'border-gray-300 hover:border-red-400'
                              }`}
                            >
                              {currentStatus === 'absent' && (
                                <X className="w-6 h-6 text-white mx-auto" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                const newHistory = { ...attendanceHistory };
                                if (!newHistory[attendanceDate]) {
                                  newHistory[attendanceDate] = {};
                                }
                                if (!newHistory[attendanceDate][selectedAttendanceClass]) {
                                  newHistory[attendanceDate][selectedAttendanceClass] = {};
                                }
                                newHistory[attendanceDate][selectedAttendanceClass][student.id] = {
                                  status: 'late',
                                  note: currentNote
                                };
                                setAttendanceHistory(newHistory);
                              }}
                              className={`w-10 h-10 rounded-full border-2 transition-all ${
                                currentStatus === 'late'
                                  ? 'bg-yellow-500 border-yellow-500'
                                  : 'border-gray-300 hover:border-yellow-400'
                              }`}
                            >
                              {currentStatus === 'late' && (
                                <Clock className="w-6 h-6 text-white mx-auto" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button
                              onClick={() => {
                                const newHistory = { ...attendanceHistory };
                                if (!newHistory[attendanceDate]) {
                                  newHistory[attendanceDate] = {};
                                }
                                if (!newHistory[attendanceDate][selectedAttendanceClass]) {
                                  newHistory[attendanceDate][selectedAttendanceClass] = {};
                                }
                                newHistory[attendanceDate][selectedAttendanceClass][student.id] = {
                                  status: 'excused',
                                  note: currentNote
                                };
                                setAttendanceHistory(newHistory);
                              }}
                              className={`w-10 h-10 rounded-full border-2 transition-all ${
                                currentStatus === 'excused'
                                  ? 'bg-blue-500 border-blue-500'
                                  : 'border-gray-300 hover:border-blue-400'
                              }`}
                            >
                              {currentStatus === 'excused' && (
                                <Info className="w-6 h-6 text-white mx-auto" />
                              )}
                            </button>
                          </td>
                          <td className="py-3 px-4">
                            <input
                              type="text"
                              value={currentNote}
                              onChange={(e) => {
                                const newHistory = { ...attendanceHistory };
                                if (!newHistory[attendanceDate]) {
                                  newHistory[attendanceDate] = {};
                                }
                                if (!newHistory[attendanceDate][selectedAttendanceClass]) {
                                  newHistory[attendanceDate][selectedAttendanceClass] = {};
                                }
                                if (!newHistory[attendanceDate][selectedAttendanceClass][student.id]) {
                                  newHistory[attendanceDate][selectedAttendanceClass][student.id] = { status: '', note: '' };
                                }
                                newHistory[attendanceDate][selectedAttendanceClass][student.id].note = e.target.value;
                                setAttendanceHistory(newHistory);
                              }}
                              placeholder="Add note..."
                              className="w-full px-2 py-1 border rounded text-sm focus:ring-1 focus:ring-green-500"
                            />
                          </td>
                          <td className="py-3 px-4 text-center">
                            <button 
                              onClick={() => {
                                setSelectedStudentHistory(student);
                                setShowAttendanceHistory(true);
                              }}
                              className="text-blue-600 hover:text-blue-800"
                            >
                              <BarChart3 className="w-5 h-5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Save Button and Message */}
              <div className="mt-6 flex items-center justify-between">
                <div>
                  {attendanceSaveMessage && (
                    <div className="flex items-center space-x-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg">
                      <CheckCircle className="w-5 h-5" />
                      <span className="font-medium">{attendanceSaveMessage}</span>
                    </div>
                  )}
                </div>
                <button 
                  onClick={() => {
                    const className = myClasses.find(c => c.id === selectedAttendanceClass)?.name || 'Class';
                    setAttendanceSaveMessage(`Attendance saved for ${className} on ${attendanceDate}`);
                    setTimeout(() => setAttendanceSaveMessage(''), 3000);
                  }}
                  className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2 font-medium shadow-md hover:shadow-lg transition-all"
                >
                  <CheckCircle className="w-5 h-5" />
                  <span>Save Attendance for {myClasses.find(c => c.id === selectedAttendanceClass)?.name}</span>
                </button>
              </div>
            </div>

          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-6">
            {/* Messages Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Messages</h2>
                  <p className="text-green-100 mt-1">
                    {messageTab === 'inbox' && `${inboxMessages.filter(m => !m.read).length} unread messages`}
                    {messageTab === 'sent' && `${sentMessages.length} sent messages`}
                    {messageTab === 'archived' && `${archivedMessages.length} archived messages`}
                  </p>
                </div>
                <button 
                  onClick={() => setShowMessageModal(true)}
                  className="px-4 py-3 bg-white bg-opacity-20 backdrop-blur text-white rounded-lg hover:bg-opacity-30 flex items-center space-x-2 border border-green-400 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Compose</span>
                </button>
              </div>
            </div>

            {/* Message Tabs and Content */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Tabs */}
              <div className="border-b bg-gray-50">
                <div className="flex">
                  <button
                    onClick={() => setMessageTab('inbox')}
                    className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${
                      messageTab === 'inbox'
                        ? 'bg-white text-green-600 border-b-2 border-green-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Mail className="w-4 h-4 inline mr-2" />
                    Inbox
                    {inboxMessages.filter(m => !m.read).length > 0 && (
                      <span className="ml-2 px-2 py-0.5 bg-red-500 text-white rounded-full text-xs">
                        {inboxMessages.filter(m => !m.read).length}
                      </span>
                    )}
                  </button>
                  <button
                    onClick={() => setMessageTab('sent')}
                    className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${
                      messageTab === 'sent'
                        ? 'bg-white text-green-600 border-b-2 border-green-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Send className="w-4 h-4 inline mr-2" />
                    Sent
                  </button>
                  <button
                    onClick={() => setMessageTab('archived')}
                    className={`flex-1 px-6 py-3 text-sm font-medium transition-all ${
                      messageTab === 'archived'
                        ? 'bg-white text-green-600 border-b-2 border-green-600'
                        : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }`}
                  >
                    <Archive className="w-4 h-4 inline mr-2" />
                    Archived
                  </button>
                </div>
              </div>

              {/* Messages List */}
              <div className="p-6">
                {messageTab === 'inbox' && (
                  <div className="space-y-3">
                    {inboxMessages.map((message) => (
                      <div 
                        key={message.id} 
                        className={`border rounded-lg p-4 hover:shadow-md transition cursor-pointer ${
                          !message.read ? 'bg-blue-50 border-blue-200' : 'hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedMessage(message)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold">{message.from}</p>
                              {message.type === 'important' && (
                                <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs">Important</span>
                              )}
                              {!message.read && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">New</span>
                              )}
                              {message.hasAttachment && (
                                <Paperclip className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                            <p className="font-medium mt-1">{message.subject}</p>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{message.content}</p>
                          </div>
                          <div className="text-right ml-4">
                            <span className="text-xs text-gray-500">{message.date}</span>
                            <div className="flex items-center space-x-1 mt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Archive message
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition"
                                title="Archive"
                              >
                                <Archive className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Delete message
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {messageTab === 'sent' && (
                  <div className="space-y-3">
                    {sentMessages.map((message) => (
                      <div 
                        key={message.id} 
                        className="border rounded-lg p-4 hover:shadow-md hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => setSelectedMessage(message)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">To:</span>
                              <p className="font-semibold">{message.to}</p>
                              {message.hasAttachment && (
                                <Paperclip className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                            <p className="font-medium mt-1">{message.subject}</p>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{message.content}</p>
                          </div>
                          <div className="text-right ml-4">
                            <span className="text-xs text-gray-500">{message.date}</span>
                            <div className="flex items-center space-x-1 mt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Forward message
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition"
                                title="Forward"
                              >
                                <Send className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Delete message
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {messageTab === 'archived' && (
                  <div className="space-y-3">
                    {archivedMessages.map((message) => (
                      <div 
                        key={message.id} 
                        className="border rounded-lg p-4 hover:shadow-md hover:bg-gray-50 transition cursor-pointer"
                        onClick={() => setSelectedMessage(message)}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-500">
                                {message.from ? 'From:' : 'To:'}
                              </span>
                              <p className="font-semibold">{message.from || message.to}</p>
                              {message.type === 'important' && (
                                <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">Important</span>
                              )}
                              {message.hasAttachment && (
                                <Paperclip className="w-4 h-4 text-gray-500" />
                              )}
                            </div>
                            <p className="font-medium mt-1">{message.subject}</p>
                            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{message.content}</p>
                          </div>
                          <div className="text-right ml-4">
                            <span className="text-xs text-gray-500">{message.date}</span>
                            <div className="flex items-center space-x-1 mt-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Unarchive message
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition"
                                title="Unarchive"
                              >
                                <RefreshCw className="w-4 h-4 text-gray-600" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  // Delete message
                                }}
                                className="p-1 hover:bg-gray-200 rounded transition"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4 text-gray-600" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Empty State */}
                {((messageTab === 'inbox' && inboxMessages.length === 0) ||
                  (messageTab === 'sent' && sentMessages.length === 0) ||
                  (messageTab === 'archived' && archivedMessages.length === 0)) && (
                  <div className="text-center py-12">
                    <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {messageTab === 'inbox' && 'No messages in your inbox'}
                      {messageTab === 'sent' && 'No sent messages'}
                      {messageTab === 'archived' && 'No archived messages'}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="space-y-6">
            {/* Calendar Header */}
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 rounded-xl p-6 text-white shadow-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Calendar & Events</h2>
                  <p className="text-green-100 mt-1">
                    {calendarType === 'school' ? 'School-wide events and activities' : 'Your personal teaching schedule'}
                  </p>
                </div>
                <div className="flex items-center space-x-3">
                  {/* Calendar Type Toggle */}
                  <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-1 flex">
                    <button
                      onClick={() => setCalendarType('school')}
                      className={`px-4 py-2 rounded transition ${
                        calendarType === 'school' 
                          ? 'bg-white text-green-600' 
                          : 'text-white hover:bg-white hover:bg-opacity-10'
                      }`}
                    >
                      School Calendar
                    </button>
                    <button
                      onClick={() => setCalendarType('personal')}
                      className={`px-4 py-2 rounded transition ${
                        calendarType === 'personal' 
                          ? 'bg-white text-green-600' 
                          : 'text-white hover:bg-white hover:bg-opacity-10'
                      }`}
                    >
                      My Calendar
                    </button>
                  </div>
                  
                  {/* View Mode Toggle */}
                  <div className="bg-white bg-opacity-10 backdrop-blur rounded-lg p-1 flex">
                    <button
                      onClick={() => setCalendarView('month')}
                      className={`px-3 py-2 rounded transition ${
                        calendarView === 'month' 
                          ? 'bg-white text-green-600' 
                          : 'text-white hover:bg-white hover:bg-opacity-10'
                      }`}
                    >
                      Month
                    </button>
                    <button
                      onClick={() => setCalendarView('week')}
                      className={`px-3 py-2 rounded transition ${
                        calendarView === 'week' 
                          ? 'bg-white text-green-600' 
                          : 'text-white hover:bg-white hover:bg-opacity-10'
                      }`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setCalendarView('list')}
                      className={`px-3 py-2 rounded transition ${
                        calendarView === 'list' 
                          ? 'bg-white text-green-600' 
                          : 'text-white hover:bg-white hover:bg-opacity-10'
                      }`}
                    >
                      List
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Calendar Content */}
            <div className="bg-white rounded-xl shadow-sm overflow-hidden">
              {/* Calendar Navigation */}
              <div className="bg-gray-50 border-b px-6 py-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <button 
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() - 1);
                      setSelectedDate(newDate);
                    }}
                    className="p-2 hover:bg-gray-200 rounded-lg transition"
                    title="Previous Month"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => {
                      const newDate = new Date(selectedDate);
                      newDate.setMonth(newDate.getMonth() + 1);
                      setSelectedDate(newDate);
                    }}
                    className="p-2 hover:bg-gray-200 rounded-lg transition"
                    title="Next Month"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                  <h3 className="text-lg font-semibold">
                    {selectedDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                  </h3>
                  <button 
                    onClick={() => setSelectedDate(new Date())}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    Today
                  </button>
                </div>
                <div className="flex items-center space-x-2 text-sm">
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
                    <span>Competition</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-blue-500 rounded-full mr-2"></div>
                    <span>Meeting</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
                    <span>Class</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-3 h-3 bg-orange-500 rounded-full mr-2"></div>
                    <span>Other</span>
                  </div>
                </div>
              </div>

              {/* Calendar Views */}
              {calendarView === 'month' && (
                <div className="p-6">
                  {/* Month View Grid */}
                  <div className="grid grid-cols-7 gap-px bg-gray-200">
                    {/* Days of Week Headers */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="bg-gray-50 p-3 text-center text-sm font-semibold text-gray-700">
                        {day}
                      </div>
                    ))}
                    
                    {/* Calendar Days */}
                    {(() => {
                      // Calculate the first day of the month and how many days in the month
                      const firstDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
                      const lastDay = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0);
                      const daysInMonth = lastDay.getDate();
                      const startingDayOfWeek = firstDay.getDay(); // 0 = Sunday, 6 = Saturday
                      const today = new Date();
                      const isCurrentMonth = today.getMonth() === selectedDate.getMonth() && 
                                           today.getFullYear() === selectedDate.getFullYear();
                      const todayDate = today.getDate();
                      
                      // Calculate total cells needed (for a complete grid)
                      const totalCells = Math.ceil((daysInMonth + startingDayOfWeek) / 7) * 7;
                      
                      return Array.from({ length: totalCells }, (_, i) => {
                        const dayNum = i - startingDayOfWeek + 1;
                        const isValidDay = dayNum >= 1 && dayNum <= daysInMonth;
                        const isToday = isCurrentMonth && dayNum === todayDate;
                        
                        // Filter events for this day
                        const currentDateStr = `${selectedDate.getFullYear()}-${String(selectedDate.getMonth() + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
                        const events = calendarType === 'school' 
                          ? schoolEvents.filter(e => {
                              const eventDate = new Date(e.date);
                              return eventDate.getDate() === dayNum && 
                                     eventDate.getMonth() === selectedDate.getMonth() &&
                                     eventDate.getFullYear() === selectedDate.getFullYear();
                            })
                          : teacherCalendar.filter(e => {
                              const eventDate = new Date(e.date);
                              return eventDate.getDate() === dayNum && 
                                     eventDate.getMonth() === selectedDate.getMonth() &&
                                     eventDate.getFullYear() === selectedDate.getFullYear();
                            });
                        
                        return (
                          <div 
                            key={i} 
                            className={`bg-white p-2 min-h-[100px] ${
                              !isValidDay ? 'bg-gray-50 text-gray-400' : ''
                            } ${isToday ? 'bg-green-50 border-2 border-green-500' : ''}`}
                          >
                          {isValidDay && (
                            <>
                              <div className="font-medium text-sm mb-1">{dayNum}</div>
                              <div className="space-y-1">
                                {events.slice(0, 2).map((event, idx) => (
                                  <div 
                                    key={idx}
                                    onClick={() => {
                                      setSelectedEvent(event);
                                      setShowEventDetails(true);
                                    }}
                                    className={`text-xs p-1 rounded cursor-pointer hover:opacity-80 ${
                                      event.color === 'purple' ? 'bg-purple-100 text-purple-700' :
                                      event.color === 'blue' ? 'bg-blue-100 text-blue-700' :
                                      event.color === 'green' ? 'bg-green-100 text-green-700' :
                                      event.color === 'orange' ? 'bg-orange-100 text-orange-700' :
                                      event.color === 'red' ? 'bg-red-100 text-red-700' :
                                      event.color === 'yellow' ? 'bg-yellow-100 text-yellow-700' :
                                      'bg-gray-100 text-gray-700'
                                    }`}
                                  >
                                    <p className="truncate">{event.title}</p>
                                  </div>
                                ))}
                                {events.length > 2 && (
                                  <p className="text-xs text-gray-500">+{events.length - 2} more</p>
                                )}
                              </div>
                            </>
                          )}
                        </div>
                      );
                    });
                    })()}
                  </div>
                </div>
              )}

              {calendarView === 'week' && (
                <div className="p-6">
                  {/* Week View */}
                  <div className="grid grid-cols-8 gap-2">
                    {/* Time Column */}
                    <div className="text-right pr-4">
                      <div className="h-12 border-b"></div>
                      {['8:00 AM', '9:00 AM', '10:00 AM', '11:00 AM', '12:00 PM', '1:00 PM', '2:00 PM', '3:00 PM', '4:00 PM', '5:00 PM'].map(time => (
                        <div key={time} className="h-20 text-sm text-gray-500 pt-2">
                          {time}
                        </div>
                      ))}
                    </div>
                    
                    {/* Days Columns */}
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, dayIndex) => {
                      const currentDate = 7 + dayIndex; // January 7-13, 2025
                      const dayEvents = calendarType === 'school' 
                        ? schoolEvents.filter(e => {
                            const eventDay = parseInt(e.date.split('-')[2]);
                            return eventDay >= 7 && eventDay <= 13 && eventDay === currentDate;
                          })
                        : teacherCalendar.filter(e => {
                            const eventDay = parseInt(e.date.split('-')[2]);
                            return eventDay === 11 || e.recurring === 'daily'; // Show daily classes
                          });
                      
                      return (
                        <div key={day} className="border-l">
                          <div className="h-12 border-b text-center">
                            <p className="font-semibold text-sm">{day}</p>
                            <p className="text-xs text-gray-500">Jan {currentDate}</p>
                          </div>
                          <div className="relative h-[800px]">
                            {calendarType === 'personal' && dayIndex >= 1 && dayIndex <= 5 ? (
                              <>
                                {/* Teacher's Classes */}
                                <div className="absolute top-0 left-0 right-0 bg-green-100 border border-green-300 rounded p-1 text-xs">
                                  <p className="font-medium">Class 6A</p>
                                  <p className="text-gray-600">8:00-9:30</p>
                                </div>
                                <div className="absolute top-20 left-0 right-0 bg-blue-100 border border-blue-300 rounded p-1 text-xs">
                                  <p className="font-medium">Class 7A</p>
                                  <p className="text-gray-600">9:30-11:00</p>
                                </div>
                                <div className="absolute top-40 left-0 right-0 bg-purple-100 border border-purple-300 rounded p-1 text-xs">
                                  <p className="font-medium">Class 5B</p>
                                  <p className="text-gray-600">11:00-12:30</p>
                                </div>
                                {dayIndex === 3 && ( // Wednesday office hours
                                  <div className="absolute top-[240px] left-0 right-0 bg-orange-100 border border-orange-300 rounded p-1 text-xs">
                                    <p className="font-medium">Office Hours</p>
                                    <p className="text-gray-600">2:00-3:00</p>
                                  </div>
                                )}
                              </>
                            ) : calendarType === 'school' && dayEvents.length > 0 ? (
                              <>
                                {/* School Events */}
                                {dayEvents.map((event, idx) => {
                                  // Parse event time to calculate position
                                  const startTime = event.time.split(' - ')[0];
                                  let topPosition = 0;
                                  
                                  // More comprehensive time parsing
                                  if (startTime.includes('8:00 AM') || startTime.includes('8:30 AM')) topPosition = 0;
                                  else if (startTime.includes('9:00 AM')) topPosition = 80;
                                  else if (startTime.includes('10:00 AM')) topPosition = 160;
                                  else if (startTime.includes('11:00 AM')) topPosition = 240;
                                  else if (startTime.includes('12:00 PM') || startTime.includes('12:30 PM')) topPosition = 320;
                                  else if (startTime.includes('1:00 PM') || startTime.includes('1:30 PM')) topPosition = 400;
                                  else if (startTime.includes('2:00 PM')) topPosition = 480;
                                  else if (startTime.includes('3:00 PM') || startTime.includes('3:30 PM')) topPosition = 560;
                                  else if (startTime.includes('4:00 PM')) topPosition = 640;
                                  else if (startTime.includes('5:00 PM')) topPosition = 720;
                                  
                                  // Calculate height based on duration
                                  let eventHeight = 60; // Default height
                                  const timeRange = event.time;
                                  
                                  if (timeRange.includes('8:00 AM - 8:30 AM')) eventHeight = 40;
                                  else if (timeRange.includes('8:00 AM - 9:00 AM')) eventHeight = 80;
                                  else if (timeRange.includes('9:00 AM - 11:00 AM')) eventHeight = 160;
                                  else if (timeRange.includes('9:00 AM - 12:00 PM')) eventHeight = 240;
                                  else if (timeRange.includes('10:00 AM - 12:00 PM')) eventHeight = 160;
                                  else if (timeRange.includes('10:00 AM - 1:00 PM')) eventHeight = 240;
                                  else if (timeRange.includes('10:00 AM - 2:00 PM')) eventHeight = 320;
                                  else if (timeRange.includes('12:30 PM - 1:30 PM')) eventHeight = 80;
                                  else if (timeRange.includes('2:00 PM - 3:30 PM')) eventHeight = 120;
                                  else if (timeRange.includes('2:00 PM - 4:00 PM')) eventHeight = 160;
                                  else if (timeRange.includes('2:00 PM - 5:00 PM')) eventHeight = 240;
                                  else if (timeRange.includes('3:00 PM - 5:00 PM')) eventHeight = 160;
                                  else if (timeRange.includes('3:30 PM - 5:00 PM')) eventHeight = 120;
                                  else if (timeRange.includes('4:00 PM - 6:00 PM')) eventHeight = 160;
                                  
                                  return (
                                    <div 
                                      key={event.id}
                                      className={`absolute left-0 right-0 border rounded p-1 text-xs cursor-pointer hover:opacity-90 transition-opacity ${
                                        event.color === 'purple' ? 'bg-purple-100 border-purple-300 text-purple-800' :
                                        event.color === 'blue' ? 'bg-blue-100 border-blue-300 text-blue-800' :
                                        event.color === 'green' ? 'bg-green-100 border-green-300 text-green-800' :
                                        event.color === 'orange' ? 'bg-orange-100 border-orange-300 text-orange-800' :
                                        event.color === 'yellow' ? 'bg-yellow-100 border-yellow-300 text-yellow-800' :
                                        event.color === 'red' ? 'bg-red-100 border-red-300 text-red-800' :
                                        'bg-gray-100 border-gray-300 text-gray-800'
                                      }`}
                                      style={{
                                        top: `${topPosition}px`,
                                        height: `${eventHeight}px`,
                                        minHeight: '40px',
                                        zIndex: 10 + idx
                                      }}
                                      onClick={() => {
                                        setSelectedEvent(event);
                                        setShowEventDetails(true);
                                      }}
                                    >
                                      <p className="font-semibold truncate">{event.title}</p>
                                      <p className="text-xs opacity-75">{event.time}</p>
                                      {eventHeight > 60 && event.location && (
                                        <p className="text-xs opacity-75 truncate">{event.location}</p>
                                      )}
                                    </div>
                                  );
                                })}
                              </>
                            ) : calendarType === 'school' ? (
                              <div className="flex items-center justify-center h-full text-gray-400 text-sm">
                                <p>No events</p>
                              </div>
                            ) : null}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {calendarView === 'list' && (
                <div className="p-6">
                  {/* List View */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg mb-4">
                      {calendarType === 'school' ? 'Upcoming School Events' : 'Your Schedule'}
                    </h3>
                    
                    {(calendarType === 'school' ? schoolEvents : teacherCalendar)
                      .sort((a, b) => new Date(a.date) - new Date(b.date))
                      .map(event => (
                      <div 
                        key={event.id} 
                        className="flex items-center space-x-4 p-4 border rounded-lg hover:shadow-md transition cursor-pointer"
                        onClick={() => {
                          setSelectedEvent(event);
                          setShowEventDetails(true);
                        }}
                      >
                        <div className={`w-1 h-16 rounded-full ${
                          event.color === 'purple' ? 'bg-purple-500' :
                          event.color === 'blue' ? 'bg-blue-500' :
                          event.color === 'green' ? 'bg-green-500' :
                          event.color === 'orange' ? 'bg-orange-500' :
                          event.color === 'red' ? 'bg-red-500' :
                          event.color === 'yellow' ? 'bg-yellow-500' :
                          'bg-gray-500'
                        }`}></div>
                        
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="font-semibold">{event.title}</h4>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${
                              event.type === 'competition' ? 'bg-purple-100 text-purple-700' :
                              event.type === 'meeting' ? 'bg-blue-100 text-blue-700' :
                              event.type === 'class' ? 'bg-green-100 text-green-700' :
                              event.type === 'workshop' ? 'bg-indigo-100 text-indigo-700' :
                              event.type === 'deadline' ? 'bg-red-100 text-red-700' :
                              event.type === 'celebration' ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {event.type}
                            </span>
                          </div>
                          
                          <div className="flex items-center space-x-4 text-sm text-gray-600">
                            <span className="flex items-center">
                              <Calendar className="w-4 h-4 mr-1" />
                              {new Date(event.date).toLocaleDateString('en-US', { 
                                weekday: 'short', 
                                month: 'short', 
                                day: 'numeric' 
                              })}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-4 h-4 mr-1" />
                              {event.time}
                            </span>
                            <span className="flex items-center">
                              <MapPin className="w-4 h-4 mr-1" />
                              {event.location}
                            </span>
                            {event.students && (
                              <span className="flex items-center">
                                <Users className="w-4 h-4 mr-1" />
                                {event.students} students
                              </span>
                            )}
                          </div>
                          
                          {event.description && (
                            <p className="text-sm text-gray-500 mt-2">{event.description}</p>
                          )}
                        </div>
                        
                        <ChevronRight className="w-5 h-5 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h4 className="font-semibold text-gray-700 mb-2">Today's Schedule</h4>
                <div className="space-y-2">
                  {todaySchedule.slice(0, 3).map((item, idx) => (
                    <div key={idx} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{item.time}</span>
                      <span className="font-medium">{item.class || item.activity}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h4 className="font-semibold text-gray-700 mb-2">Upcoming Events</h4>
                <div className="space-y-2">
                  {schoolEvents.slice(0, 3).map(event => (
                    <div key={event.id} className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">{event.date.split('-')[2]} Jan</span>
                      <span className="font-medium truncate ml-2">{event.title}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm p-4">
                <h4 className="font-semibold text-gray-700 mb-2">Important Deadlines</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Jan 15</span>
                    <span className="font-medium text-red-600">Grade Submissions</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Jan 20</span>
                    <span className="font-medium">Parent Meetings</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Jan 25</span>
                    <span className="font-medium">Competition Finals</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Attendance placeholder */}
        {activeTab === 'attendance' && (
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4 capitalize">Attendance</h2>
            <p className="text-gray-600">Attendance features coming soon...</p>
          </div>
        )}
      </div>


      {/* Message Modal */}
      {showMessageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">
                  {messageRecipient ? `Message to ${messageRecipient.name}` : 'New Message'}
                </h2>
                <button 
                  onClick={() => {
                    setShowMessageModal(false); 
                    setMessageRecipient(null);
                    setSelectedRecipient(null);
                    setMessageRecipientSearch('');
                  }} 
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                {!messageRecipient && (
                  <div className="space-y-4">
                    {/* Recipient Type Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Recipient Type</label>
                      <div className="flex space-x-3">
                        <button
                          type="button"
                          onClick={() => {
                            setMessageRecipientType('students');
                            setSelectedRecipient(null);
                            setMessageRecipientSearch('');
                          }}
                          className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                            messageRecipientType === 'students'
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <Users className="w-4 h-4 inline mr-2" />
                          Students
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMessageRecipientType('parents');
                            setSelectedRecipient(null);
                            setMessageRecipientSearch('');
                          }}
                          className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                            messageRecipientType === 'parents'
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <Users className="w-4 h-4 inline mr-2" />
                          Parents
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setMessageRecipientType('groups');
                            setSelectedRecipient(null);
                            setMessageRecipientSearch('');
                          }}
                          className={`flex-1 px-4 py-2 rounded-lg border-2 transition-all ${
                            messageRecipientType === 'groups'
                              ? 'border-green-500 bg-green-50 text-green-700'
                              : 'border-gray-300 hover:border-gray-400'
                          }`}
                        >
                          <Users className="w-4 h-4 inline mr-2" />
                          Groups
                        </button>
                      </div>
                    </div>

                    {/* Recipient Selection */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {messageRecipientType === 'groups' ? 'Select Group' : `Select ${messageRecipientType === 'students' ? 'Student' : 'Parent'} *`}
                      </label>
                      
                      {messageRecipientType === 'groups' ? (
                        <select 
                          value={selectedRecipient?.id || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            if (value === 'all-students') {
                              setSelectedRecipient({ id: 'all-students', name: 'All Students' });
                            } else if (value === 'all-parents') {
                              setSelectedRecipient({ id: 'all-parents', name: 'All Parents' });
                            } else if (value.startsWith('class-')) {
                              const classId = value.replace('class-', '');
                              const className = myClasses.find(c => c.id === classId)?.name;
                              setSelectedRecipient({ id: value, name: `${className} Students` });
                            } else if (value === 'school-admin') {
                              setSelectedRecipient({ id: 'school-admin', name: 'School Administration' });
                            }
                          }}
                          className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                        >
                          <option value="">Select a group</option>
                          <option value="all-students">All Students</option>
                          <option value="all-parents">All Parents</option>
                          {myClasses.map(cls => (
                            <option key={cls.id} value={`class-${cls.id}`}>
                              {cls.name} Students ({myStudents.filter(s => s.classId === cls.id).length})
                            </option>
                          ))}
                          <option value="school-admin">School Administration</option>
                        </select>
                      ) : (
                        <div className="space-y-2">
                          {/* Search Input */}
                          <div className="relative">
                            <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                            <input
                              type="text"
                              value={messageRecipientSearch}
                              onChange={(e) => setMessageRecipientSearch(e.target.value)}
                              placeholder={`Search ${messageRecipientType === 'students' ? 'student' : 'parent'} by name...`}
                              className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                            />
                          </div>
                          
                          {/* Recipients List */}
                          <div className="border rounded-lg max-h-48 overflow-y-auto">
                            {messageRecipientType === 'students' ? (
                              myStudents
                                .filter(s => s.name.toLowerCase().includes(messageRecipientSearch.toLowerCase()))
                                .map(student => (
                                  <button
                                    key={student.id}
                                    type="button"
                                    onClick={() => setSelectedRecipient({
                                      id: student.id,
                                      name: student.name,
                                      email: `${student.id}@school.com`,
                                      class: student.class
                                    })}
                                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between ${
                                      selectedRecipient?.id === student.id ? 'bg-green-50 border-l-4 border-green-500' : ''
                                    }`}
                                  >
                                    <div>
                                      <p className="font-medium">{student.name}</p>
                                      <p className="text-xs text-gray-500">{student.class} • Age {student.age}</p>
                                    </div>
                                    {selectedRecipient?.id === student.id && (
                                      <CheckCircle className="w-5 h-5 text-green-600" />
                                    )}
                                  </button>
                                ))
                            ) : (
                              // Parents List
                              myStudents
                                .filter(s => s.parentName.toLowerCase().includes(messageRecipientSearch.toLowerCase()))
                                .map(student => (
                                  <button
                                    key={`parent-${student.id}`}
                                    type="button"
                                    onClick={() => setSelectedRecipient({
                                      id: `parent-${student.id}`,
                                      name: student.parentName,
                                      email: student.parentEmail,
                                      childName: student.name,
                                      childClass: student.class
                                    })}
                                    className={`w-full text-left px-3 py-2 hover:bg-gray-50 flex items-center justify-between ${
                                      selectedRecipient?.id === `parent-${student.id}` ? 'bg-green-50 border-l-4 border-green-500' : ''
                                    }`}
                                  >
                                    <div>
                                      <p className="font-medium">{student.parentName}</p>
                                      <p className="text-xs text-gray-500">Parent of {student.name} • {student.class}</p>
                                    </div>
                                    {selectedRecipient?.id === `parent-${student.id}` && (
                                      <CheckCircle className="w-5 h-5 text-green-600" />
                                    )}
                                  </button>
                                ))
                            )}
                          </div>
                          
                          {/* Selected Recipient Display */}
                          {selectedRecipient && (
                            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                              <p className="text-sm text-green-800">
                                <strong>Selected:</strong> {selectedRecipient.name}
                                {selectedRecipient.class && ` (${selectedRecipient.class})`}
                                {selectedRecipient.childName && ` - Parent of ${selectedRecipient.childName}`}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}
                
                {/* Show selected recipient if pre-selected */}
                {messageRecipient && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <p className="text-sm text-green-800">
                      <strong>To:</strong> {messageRecipient.name}
                      {messageRecipient.email && ` (${messageRecipient.email})`}
                    </p>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" 
                    placeholder="Message subject" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                  <textarea 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500" 
                    rows={6} 
                    placeholder="Type your message here..."
                  ></textarea>
                </div>
                <div className="flex items-center justify-between">
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded text-green-600" />
                    <span className="text-sm text-gray-700">Send email notification</span>
                  </label>
                  <label className="flex items-center space-x-2">
                    <input type="checkbox" className="rounded text-green-600" />
                    <span className="text-sm text-gray-700">Mark as important</span>
                  </label>
                </div>
              </form>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-between">
              <button 
                onClick={() => {
                  setShowMessageModal(false); 
                  setMessageRecipient(null);
                  setSelectedRecipient(null);
                  setMessageRecipientSearch('');
                }} 
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                disabled={!messageRecipient && !selectedRecipient}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Send className="w-4 h-4" />
                <span>Send Message</span>
              </button>
            </div>
          </div>
        </div>
      )}


      {/* Profile View - Read Only */}
      {showProfile && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">My Profile</h2>
                <button onClick={() => setShowProfile(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-green-600">FA</span>
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{teacherInfo.name}</h3>
                    <p className="text-gray-500">Teacher ID: {teacherInfo.id}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
                    <p className="text-gray-900">{teacherInfo.email}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Phone</label>
                    <p className="text-gray-900">{teacherInfo.phone}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">School</label>
                    <p className="text-gray-900">{teacherInfo.school}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Join Date</label>
                    <p className="text-gray-900">{teacherInfo.joinDate}</p>
                  </div>
                  <div className="col-span-2">
                    <label className="block text-sm font-medium text-gray-500 mb-1">Subjects</label>
                    <div className="flex flex-wrap gap-2">
                      {teacherInfo.subjects.map((subject, index) => (
                        <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                          {subject}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    <Info className="w-4 h-4 inline mr-1" />
                    Profile information is managed by your school administrator. Contact them for any changes.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Class Details Modal */}
      {showClassDetails && selectedClassDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b bg-gradient-to-r from-green-500 to-emerald-500">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold text-white">{selectedClassDetails.name} - {selectedClassDetails.subject}</h2>
                  <div className="flex items-center space-x-4 mt-2 text-green-50">
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {selectedClassDetails.studentList?.length || selectedClassDetails.students} Students
                    </span>
                    <span className="flex items-center">
                      <Home className="w-4 h-4 mr-1" />
                      {selectedClassDetails.room}
                    </span>
                    <span className="flex items-center">
                      <Clock className="w-4 h-4 mr-1" />
                      {selectedClassDetails.schedule}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowClassDetails(false);
                    setSelectedClassDetails(null);
                  }} 
                  className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Class Info and Stats */}
            <div className="p-6 bg-gray-50">
              <p className="text-gray-700 mb-4">{selectedClassDetails.description}</p>
              
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Avg Attendance</p>
                      <p className="text-2xl font-bold text-gray-800">{selectedClassDetails.averageAttendance}%</p>
                    </div>
                    <Users className="w-8 h-8 text-blue-500" />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Avg Progress</p>
                      <p className="text-2xl font-bold text-gray-800">{selectedClassDetails.averageProgress}%</p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-500" />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Active Tasks</p>
                      <p className="text-2xl font-bold text-gray-800">{selectedClassDetails.activeAssignments}</p>
                    </div>
                    <FileText className="w-8 h-8 text-orange-500" />
                  </div>
                </div>
                <div className="bg-white p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-gray-500">Completed</p>
                      <p className="text-2xl font-bold text-gray-800">{selectedClassDetails.completedAssignments}</p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-purple-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Students List */}
            <div className="flex-1 overflow-y-auto p-6">
              <h3 className="text-lg font-semibold mb-4">Students in This Class</h3>
              <div className="bg-white rounded-lg border overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Student Name</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Attendance</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Progress</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Grade</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Last Assignment</th>
                      <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedClassDetails.studentList?.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                              <span className="text-green-700 font-semibold text-sm">
                                {student.name.split(' ').map(n => n[0]).join('')}
                              </span>
                            </div>
                            <span className="font-medium text-gray-900">{student.name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <span className={`font-medium ${
                              student.attendance >= 95 ? 'text-green-600' :
                              student.attendance >= 85 ? 'text-yellow-600' :
                              'text-red-600'
                            }`}>
                              {student.attendance}%
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <div className="flex-1 max-w-[100px]">
                              <div className="w-full bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-green-500 h-2 rounded-full" 
                                  style={{width: `${student.progress}%`}}
                                />
                              </div>
                            </div>
                            <span className="text-sm font-medium">{student.progress}%</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded text-xs font-semibold ${
                            student.grade.includes('A') ? 'bg-green-100 text-green-700' :
                            student.grade.includes('B') ? 'bg-yellow-100 text-yellow-700' :
                            'bg-red-100 text-red-700'
                          }`}>
                            {student.grade}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {student.lastAssignment}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-800 text-sm">View</button>
                            <span className="text-gray-400">|</span>
                            <button className="text-green-600 hover:text-green-800 text-sm">Message</button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t bg-gray-50 flex justify-between">
              <button
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export Class Data</span>
              </button>
              <div className="flex space-x-3">
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 flex items-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Take Attendance</span>
                </button>
                <button
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Message All Students</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Attendance History Modal */}
      {showAttendanceHistory && selectedStudentHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-indigo-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Attendance History - {selectedStudentHistory.name}</h2>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span>ID: {selectedStudentHistory.id}</span>
                    <span>Current Attendance: {selectedStudentHistory.attendance}%</span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowAttendanceHistory(false);
                    setSelectedStudentHistory(null);
                  }} 
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Statistics */}
            <div className="p-6 bg-gray-50 border-b">
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Total Present</p>
                  <p className="text-xl font-bold text-green-600">
                    {Object.entries(attendanceHistory).reduce((total, [date, classes]) => {
                      const studentRecord = classes[selectedAttendanceClass]?.[selectedStudentHistory.id];
                      return total + (studentRecord?.status === 'present' ? 1 : 0);
                    }, 0)}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Total Absent</p>
                  <p className="text-xl font-bold text-red-600">
                    {Object.entries(attendanceHistory).reduce((total, [date, classes]) => {
                      const studentRecord = classes[selectedAttendanceClass]?.[selectedStudentHistory.id];
                      return total + (studentRecord?.status === 'absent' ? 1 : 0);
                    }, 0)}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Total Late</p>
                  <p className="text-xl font-bold text-yellow-600">
                    {Object.entries(attendanceHistory).reduce((total, [date, classes]) => {
                      const studentRecord = classes[selectedAttendanceClass]?.[selectedStudentHistory.id];
                      return total + (studentRecord?.status === 'late' ? 1 : 0);
                    }, 0)}
                  </p>
                </div>
                <div className="bg-white p-3 rounded-lg">
                  <p className="text-xs text-gray-500">Total Excused</p>
                  <p className="text-xl font-bold text-blue-600">
                    {Object.entries(attendanceHistory).reduce((total, [date, classes]) => {
                      const studentRecord = classes[selectedAttendanceClass]?.[selectedStudentHistory.id];
                      return total + (studentRecord?.status === 'excused' ? 1 : 0);
                    }, 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* History Table */}
            <div className="flex-1 overflow-y-auto p-6">
              <table className="w-full">
                <thead className="bg-gray-50 sticky top-0">
                  <tr>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Date</th>
                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {Object.entries(attendanceHistory)
                    .sort((a, b) => new Date(b[0]) - new Date(a[0]))
                    .map(([date, classes]) => {
                      const record = classes[selectedAttendanceClass]?.[selectedStudentHistory.id];
                      if (!record) return null;
                      
                      return (
                        <tr key={date} className="hover:bg-gray-50">
                          <td className="py-3 px-4">
                            <div>
                              <p className="font-medium">{new Date(date).toLocaleDateString('en-US', { 
                                weekday: 'long',
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}</p>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              record.status === 'present' ? 'bg-green-100 text-green-700' :
                              record.status === 'absent' ? 'bg-red-100 text-red-700' :
                              record.status === 'late' ? 'bg-yellow-100 text-yellow-700' :
                              record.status === 'excused' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {record.status || 'Not Marked'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-gray-600">
                            {record.note || '-'}
                          </td>
                        </tr>
                      );
                    }).filter(Boolean)}
                </tbody>
              </table>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-between">
              <button
                className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Export History</span>
              </button>
              <button
                onClick={() => {
                  setShowAttendanceHistory(false);
                  setSelectedStudentHistory(null);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {showStudentDetails && selectedStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b bg-gradient-to-r from-green-600 to-emerald-600">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white bg-opacity-30 backdrop-blur rounded-full flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {selectedStudent.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-white">{selectedStudent.name}</h2>
                    <div className="flex items-center space-x-4 mt-1 text-green-100">
                      <span>{selectedStudent.class}</span>
                      <span>•</span>
                      <span>Age {selectedStudent.age}</span>
                      <span>•</span>
                      <span>ID: {selectedStudent.id}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowStudentDetails(false);
                    setSelectedStudent(null);
                  }} 
                  className="p-2 bg-white bg-opacity-20 hover:bg-opacity-30 rounded-lg transition"
                >
                  <X className="w-5 h-5 text-white" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* Quran Progress Overview */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <BookOpen className="w-5 h-5 mr-2 text-green-600" />
                  Quran Progress Overview
                </h3>
                
                {/* Progress Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                  {/* Memorization Progress */}
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-4 border border-purple-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-purple-800">Memorization</h4>
                      <Brain className="w-5 h-5 text-purple-600" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-purple-600">Current Juz</span>
                        <span className="font-bold text-purple-800">{selectedStudent.quranProgress?.memorization?.juz || 15}/30</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-purple-600">Current Surah</span>
                        <span className="font-bold text-purple-800">Surah {selectedStudent.quranProgress?.memorization?.surah || 67}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-purple-600">Current Ayah</span>
                        <span className="font-bold text-purple-800">{selectedStudent.quranProgress?.memorization?.ayah || 15}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-purple-200">
                        <div className="w-full bg-purple-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full" 
                            style={{width: `${(selectedStudent.quranProgress?.memorization?.juz || 15) / 30 * 100}%`}}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Revision Progress */}
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 border border-blue-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-blue-800">Revision</h4>
                      <RefreshCw className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-600">Current Juz</span>
                        <span className="font-bold text-blue-800">{selectedStudent.quranProgress?.revision?.juz || 12}/30</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-600">Current Surah</span>
                        <span className="font-bold text-blue-800">Surah {selectedStudent.quranProgress?.revision?.surah || 36}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-blue-600">Current Ayah</span>
                        <span className="font-bold text-blue-800">{selectedStudent.quranProgress?.revision?.ayah || 45}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <div className="w-full bg-blue-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" 
                            style={{width: `${(selectedStudent.quranProgress?.revision?.juz || 12) / 30 * 100}%`}}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Tilawah Progress */}
                  <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 border border-green-200">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-green-800">Tilawah</h4>
                      <BookOpen className="w-5 h-5 text-green-600" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-600">Current Juz</span>
                        <span className="font-bold text-green-800">{selectedStudent.quranProgress?.tilawah?.juz || 30}/30</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-600">Current Surah</span>
                        <span className="font-bold text-green-800">Surah {selectedStudent.quranProgress?.tilawah?.surah || 114}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-green-600">Current Ayah</span>
                        <span className="font-bold text-green-800">{selectedStudent.quranProgress?.tilawah?.ayah || 6}</span>
                      </div>
                      <div className="mt-3 pt-3 border-t border-green-200">
                        <div className="w-full bg-green-200 rounded-full h-2">
                          <div 
                            className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" 
                            style={{width: `${(selectedStudent.quranProgress?.tilawah?.juz || 30) / 30 * 100}%`}}
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Performance Overview */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Strengths & Areas for Improvement */}
                  <div className="bg-white rounded-xl border p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Performance Analysis</h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Strengths</p>
                        <div className="flex flex-wrap gap-2">
                          {(selectedStudent.strengths || ['Tajweed', 'Memorization']).map((strength, index) => (
                            <span key={index} className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm">
                              {strength}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-2">Needs Improvement</p>
                        <div className="flex flex-wrap gap-2">
                          {(selectedStudent.needsImprovement || ['Makharij']).map((area, index) => (
                            <span key={index} className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm">
                              {area}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="bg-white rounded-xl border p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">Statistics</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-800">{selectedStudent.attendance}%</p>
                        <p className="text-xs text-gray-600">Attendance</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-800">{selectedStudent.grade}</p>
                        <p className="text-xs text-gray-600">Grade</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-800">{selectedStudent.progress}%</p>
                        <p className="text-xs text-gray-600">Progress</p>
                      </div>
                      <div className="text-center p-3 bg-gray-50 rounded-lg">
                        <p className="text-2xl font-bold text-gray-800">{selectedStudent.memorized}</p>
                        <p className="text-xs text-gray-600">Memorized</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Parent Information */}
              <div className="bg-gray-50 rounded-xl p-4">
                <h4 className="font-semibold text-gray-800 mb-3">Parent Contact Information</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Parent Name</p>
                      <p className="font-medium">{selectedStudent.parentName}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Mail className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium text-blue-600">{selectedStudent.parentEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Phone className="w-5 h-5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{selectedStudent.parentPhone}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="p-4 border-t bg-gray-50 flex justify-between">
              <div className="flex space-x-3">
                <button 
                  onClick={() => {
                    setShowStudentDetails(false);
                    setActiveTab('messages');
                    setMessageRecipient({type: 'student', name: selectedStudent.name, email: `${selectedStudent.id}@school.com`});
                    setShowMessageModal(true);
                  }}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Message Student</span>
                </button>
                <button 
                  onClick={() => {
                    setShowStudentDetails(false);
                    setActiveTab('messages');
                    setMessageRecipient({type: 'parent', name: selectedStudent.parentName, email: selectedStudent.parentEmail});
                    setShowMessageModal(true);
                  }}
                  className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center space-x-2"
                >
                  <Mail className="w-4 h-4" />
                  <span>Message Parent</span>
                </button>
              </div>
              <button
                onClick={() => {
                  setShowStudentDetails(false);
                  setSelectedStudent(null);
                }}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Assignment Conversation Modal */}
      {showAssignmentConversation && selectedAssignment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-6 border-b bg-gradient-to-r from-green-50 to-emerald-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">{selectedAssignment.title}</h2>
                  <div className="flex items-center space-x-4 mt-2 text-sm text-gray-600">
                    <span className="flex items-center">
                      <User className="w-4 h-4 mr-1" />
                      {selectedAssignment.studentName}
                    </span>
                    <span className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      {selectedAssignment.class}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-semibold ${
                      selectedAssignment.status === 'completed' ? 'bg-gradient-to-r from-yellow-400 to-amber-400 text-white' :
                      selectedAssignment.status === 'reviewed' ? 'bg-green-100 text-green-700' :
                      selectedAssignment.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                      selectedAssignment.status === 'late' ? 'bg-red-100 text-red-700' :
                      selectedAssignment.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {selectedAssignment.status}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowAssignmentConversation(false);
                    setSelectedAssignment(null);
                    setConversationMessage('');
                  }} 
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Conversation Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
              {assignmentConversations[selectedAssignment.id] ? (
                assignmentConversations[selectedAssignment.id].map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === 'teacher' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-2xl ${message.sender === 'teacher' ? 'order-2' : ''}`}>
                      <div className={`rounded-lg p-4 ${
                        message.sender === 'teacher' 
                          ? 'bg-green-100 text-green-900' 
                          : 'bg-white border border-gray-200'
                      }`}>
                        {message.type === 'text' ? (
                          <p className="text-sm">{message.content}</p>
                        ) : (
                          <div className="flex items-center space-x-3">
                            <button className="p-2 bg-white rounded-full shadow hover:shadow-md transition">
                              <Play className="w-4 h-4 text-green-600" />
                            </button>
                            <div className="flex-1">
                              <div className="flex items-center space-x-2">
                                <Mic className="w-4 h-4 text-gray-500" />
                                <span className="text-sm font-medium">Voice Note</span>
                                <span className="text-xs text-gray-500">{message.duration}</span>
                              </div>
                              <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                                <div className="bg-green-600 h-1 rounded-full" style={{width: '0%'}}></div>
                              </div>
                            </div>
                          </div>
                        )}
                        <p className="text-xs text-gray-500 mt-2">{message.timestamp}</p>
                      </div>
                      <p className={`text-xs text-gray-500 mt-1 ${
                        message.sender === 'teacher' ? 'text-right' : 'text-left'
                      }`}>
                        {message.sender === 'teacher' ? 'You' : selectedAssignment.studentName}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500">
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                  <p>No conversation yet. Send a message to start.</p>
                </div>
              )}
            </div>

            {/* Message Input Area */}
            <div className="p-4 border-t bg-white">
              <div className="flex items-end space-x-3">
                <div className="flex-1">
                  <textarea
                    value={conversationMessage}
                    onChange={(e) => setConversationMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-green-500 resize-none"
                    rows={2}
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setIsRecording(!isRecording)}
                    className={`p-3 rounded-lg transition ${
                      isRecording 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                    }`}
                  >
                    {isRecording ? <StopCircle className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                  <button
                    onClick={() => {
                      // Handle sending message
                      setConversationMessage('');
                    }}
                    disabled={!conversationMessage.trim() && !isRecording}
                    className="p-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {isRecording && (
                <div className="mt-3 flex items-center space-x-2 text-red-600">
                  <div className="w-2 h-2 bg-red-600 rounded-full animate-pulse"></div>
                  <span className="text-sm">Recording... Click stop to finish</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="p-4 border-t bg-gray-50 flex justify-between">
              <button
                onClick={() => {
                  // Open student Quran viewer
                }}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 flex items-center space-x-2"
              >
                <BookOpen className="w-4 h-4" />
                <span>Open Student Viewer</span>
              </button>
              <div className="flex space-x-3">
                {selectedAssignment.status === 'submitted' && (
                  <>
                    <button
                      onClick={() => {
                        // Mark as needs revision
                      }}
                      className="px-4 py-2 bg-yellow-100 text-yellow-700 rounded-lg hover:bg-yellow-200"
                    >
                      Request Revision
                    </button>
                    <button
                      onClick={() => {
                        // Mark as completed
                      }}
                      className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-400 text-white rounded-lg hover:from-yellow-500 hover:to-amber-500"
                    >
                      Mark as Completed
                    </button>
                  </>
                )}
                {selectedAssignment.status === 'reviewed' && !selectedAssignment.feedbackGiven && (
                  <button
                    onClick={() => {
                      // Mark as completed
                    }}
                    className="px-4 py-2 bg-gradient-to-r from-yellow-400 to-amber-400 text-white rounded-lg hover:from-yellow-500 hover:to-amber-500"
                  >
                    Mark as Completed
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}