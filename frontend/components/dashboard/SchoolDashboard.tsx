'use client';

import { useState, useEffect, useRef, Suspense, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useSchoolData } from '@/hooks/useSchoolData';
import { useReportsData } from '@/hooks/useReportsData';
import { useNotifications } from '@/hooks/useNotifications';
import { useHighlights } from '@/hooks/useHighlights';
import { useTargets } from '@/hooks/useTargets';
import { useAttendance } from '@/hooks/useAttendance';
import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';
import { useAuthStore } from '@/store/authStore';
import SchoolProfile from './SchoolProfile';
import CalendarSection from '@/components/calendar/CalendarSection';
import SettingsSection from './SettingsSection';
import {
  Users, UserPlus, GraduationCap, BookOpen, Calendar, Bell, Settings, Home, Search, Filter,
  Download, Upload, Edit, Trash2, MoreVertical, Check, AlertCircle, Clock, FileText, Award,
  TrendingUp, Eye, Mail, Phone, MapPin, BarChart3, ChevronRight, ChevronLeft, Folder, FolderOpen, LogOut,
  Menu, Shield, Key, CreditCard, DollarSign, Target, Activity, Zap, Package, Grid, List,
  ChevronDown, School, PieChart, Move, ArrowRight, X, XCircle, CheckCircle, RefreshCw, Send, Plus, Info,
  User, Star, CornerUpLeft, Paperclip, MessageSquare, Bookmark, CheckSquare, Brain, ClipboardCheck
} from 'lucide-react';

const ClassBuilder = dynamic(() => import('./ClassBuilder'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><div className="text-gray-500">Loading Class Builder...</div></div>
});

const ClassBuilderPro = dynamic(() => import('./ClassBuilderPro'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><div className="text-gray-500">Loading Class Builder Pro...</div></div>
});

const ClassBuilderUltra = dynamic(() => import('./ClassBuilderUltra'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><div className="text-gray-500">Loading Class Builder Ultra...</div></div>
});

// Type definitions for Supabase operations
type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update'];
type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert'];

export default function SchoolDashboard() {
  // Reports filters (declare early for useReportsData)
  const [reportPeriod, setReportPeriod] = useState('week');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // PRODUCTION: Get real data from Supabase
  const {
    isLoading: dataLoading,
    error: dataError,
    schoolInfo,
    stats,
    students,
    teachers,
    parents,
    classes,
    recentActivities,
    upcomingEvents,
    allCalendarEvents,
    credentials,
    refreshData,
    setStudents,
    setTeachers,
    setParents,
    setClasses,
    setCredentials
  } = useSchoolData();

  // Memoize report dates to prevent re-renders
  const reportStartDate = useMemo(() => {
    if (reportPeriod === 'custom' && customStartDate && customEndDate) {
      return new Date(customStartDate);
    }
    if (reportPeriod === 'today') {
      return new Date();
    }
    if (reportPeriod === 'week') {
      return new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    }
    if (reportPeriod === 'month') {
      return new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    }
    if (reportPeriod === 'year') {
      return new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
    }
    return undefined;
  }, [reportPeriod, customStartDate, customEndDate]);

  const reportEndDate = useMemo(() => {
    if (reportPeriod === 'custom' && customStartDate && customEndDate) {
      return new Date(customEndDate);
    }
    return new Date();
  }, [reportPeriod, customStartDate, customEndDate]);

  // Get highlights data for all school students
  const {
    highlights: allHighlights,
    isLoading: highlightsLoading,
    error: highlightsError,
    refreshHighlights
  } = useHighlights(null); // null = all school highlights

  // Safety check: ensure allHighlights is always an array
  const safeHighlights = allHighlights || [];

  // Get attendance data for all school (no filters for admin/owner)
  const {
    records: attendanceRecords,
    stats: attendanceStats,
    isLoading: attendanceLoading,
    error: attendanceError,
    fetchAttendance: refreshAttendance
  } = useAttendance();

  // Safety check: ensure attendanceRecords is always an array
  const safeAttendanceRecords = attendanceRecords || [];

  // Get current user from auth store (needed before useReportsData)
  const { user, logout } = useAuthStore();

  // Active tab state (needed before useEffect that checks it)
  const [activeTab, setActiveTab] = useState('overview');

  // Get reports data with date filtering
  const {
    isLoading: reportsLoading,
    error: reportsError,
    reportData,
    refreshData: refreshReports
  } = useReportsData(reportStartDate, reportEndDate);

  // Refresh reports data when Reports tab is opened
  useEffect(() => {
    if (activeTab === 'reports' && user?.schoolId) {
      console.log('🔄 Reports tab opened - refreshing data...');
      refreshReports();
    }
  }, [activeTab, refreshReports, user?.schoolId]);

  // Refresh mastery data when Mastery tab is opened
  useEffect(() => {
    if (activeTab === 'mastery' && user?.schoolId) {
      console.log('🔄 Mastery tab opened - refreshing data...');
      fetchMasteryData();
    }
  }, [activeTab, user?.schoolId]);

  // Refresh gradebook data when Gradebook tab is opened
  useEffect(() => {
    if (activeTab === 'gradebook' && user?.schoolId) {
      console.log('🔄 Gradebook tab opened - refreshing data...');
      fetchGradebookData();
    }
  }, [activeTab, user?.schoolId]);

  // DEBUG: Log reportData changes
  useEffect(() => {
    if (activeTab === 'reports' && reportData) {
      console.log('📊 reportData updated:', {
        assignmentsTrend: reportData.assignmentsTrend?.length,
        attendanceTrend: reportData.attendanceTrend?.length,
        assignmentsTotal: reportData.assignmentsTrend?.reduce((sum: number, d: any) => sum + (d.count || 0), 0),
        attendanceAvg: reportData.attendanceTrend?.length ? Math.round(reportData.attendanceTrend.reduce((sum: number, d: any) => sum + (d.rate || 0), 0) / reportData.attendanceTrend.length) : 0
      });
    }
  }, [activeTab, reportData]);

  // Get notifications from API
  const {
    notifications: dbNotifications,
    unreadCount,
    isLoading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    refresh: refreshNotifications
  } = useNotifications();

  // Refs for dropdown click-outside detection
  const notificationRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);

  // State Management (keeping ALL the beautiful UI states)
  const [searchTerm, setSearchTerm] = useState('');

  // Attendance filter states
  const [attendanceSearchTerm, setAttendanceSearchTerm] = useState('');
  const [attendanceClassFilter, setAttendanceClassFilter] = useState('');
  const [attendanceStudentFilter, setAttendanceStudentFilter] = useState('');
  const [attendanceTeacherFilter, setAttendanceTeacherFilter] = useState('');

  // DEBUG: Log activeTab changes
  useEffect(() => {
    console.log('📑 activeTab changed to:', activeTab);
  }, [activeTab]);
  const [viewMode, setViewMode] = useState('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState('student');
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkUploadType, setBulkUploadType] = useState('students');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsPanel, setActiveSettingsPanel] = useState<any>(null);
  const [showProfile, setShowProfile] = useState(false);

  // Bulk upload states
  const [showDuplicateReview, setShowDuplicateReview] = useState(false);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const [uploadedData, setUploadedData] = useState<any[]>([]);
  const [showBulkProgress, setShowBulkProgress] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({
    total: 0,
    processed: 0,
    success: 0,
    failed: 0,
    skipped: 0,
    current: '',
    credentials: [],
    isComplete: false
  });
  const [showNotificationPreferences, setShowNotificationPreferences] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    email: {
      assignments: true,
      attendance: true,
      grades: true,
      announcements: true,
      reminders: true
    },
    inApp: {
      assignments: true,
      attendance: true,
      grades: true,
      announcements: true,
      reminders: true
    },
    frequency: 'immediate'
  });
  const [showStudentDetails, setShowStudentDetails] = useState<any>(null);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const [showTeacherDetails, setShowTeacherDetails] = useState<any>(null);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [selectedTeachersForClass, setSelectedTeachersForClass] = useState<any[]>([]);
  const [selectedStudentsForClass, setSelectedStudentsForClass] = useState<any[]>([]);
  const [classTeacherSearch, setClassTeacherSearch] = useState('');
  const [classSchedules, setClassSchedules] = useState<any[]>([]);
  const [showClassBuilder, setShowClassBuilder] = useState(false);
  const [classStudentSearch, setClassStudentSearch] = useState('');
  const [viewingClass, setViewingClass] = useState<any>(null);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [editClassSchedules, setEditClassSchedules] = useState<any[]>([]);

  // Homework, Assignments & Targets State
  const [homeworkList, setHomeworkList] = useState<any[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [assignmentFilter, setAssignmentFilter] = useState('all');

  // Use targets hook to fetch ALL targets for the school
  const { targets, isLoading: targetsLoading, fetchTargets } = useTargets();
  const [editingAssignment, setEditingAssignment] = useState<any>(null);
  const [viewingAssignment, setViewingAssignment] = useState<any>(null);
  const [viewingHomework, setViewingHomework] = useState<any>(null);

  // Messaging System State
  const [messages, setMessages] = useState<any[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<any>(null);
  const [messageFilter, setMessageFilter] = useState('all');
  const [messageSearchTerm, setMessageSearchTerm] = useState('');
  const [showComposeMessage, setShowComposeMessage] = useState(false);
  const [messageRecipientType, setMessageRecipientType] = useState('all');
  const [selectedRecipients, setSelectedRecipients] = useState<any[]>([]);
  const [showReplyBox, setShowReplyBox] = useState(false);
  const [replyMessage, setReplyMessage] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [messagePriority, setMessagePriority] = useState('normal');
  const [sendViaEmail, setSendViaEmail] = useState(true);

  // Professional Notification System
  const [notifications, setNotifications] = useState<any[]>([]);
  const [notificationIdCounter, setNotificationIdCounter] = useState(0);

  // Credentials Management State (using credentials from useSchoolData)
  const [showPasswords, setShowPasswords] = useState(false);
  const [credentialFilter, setCredentialFilter] = useState('all');
  const [sendingEmail, setSendingEmail] = useState<Record<string, any>>({});
  const [loadingCredentials, setLoadingCredentials] = useState(true);

  // Professional Notification Function
  const showNotification = (message: string, type: string = 'success', duration: number = 5000, details: any = null) => {
    const id = notificationIdCounter;
    setNotificationIdCounter((prev: any) => prev + 1);

    const notification = {
      id,
      message,
      type, // success, error, warning, info
      details,
      timestamp: new Date(),
    };

    setNotifications((prev: any) => [...prev, notification]);

    // Auto-remove after duration
    setTimeout(() => {
      setNotifications((prev: any) => prev.filter((n: any) => n.id !== id));
    }, duration);
  };

  // Remove notification manually
  const removeNotification = (id: number) => {
    setNotifications((prev: any) => prev.filter((n: any) => n.id !== id));
  };

  const [newClass, setNewClass] = useState({
    name: '',
    room: '',
    schedule: '',
    time: '',
    capacity: 25,
    subjects: []
  });
  const [showAddParent, setShowAddParent] = useState(false);
  const [showViewParent, setShowViewParent] = useState<any>(null);
  const [showEditParent, setShowEditParent] = useState<any>(null);
  const [parentViewMode, setParentViewMode] = useState('grid');
  const [parentSearchTerm, setParentSearchTerm] = useState('');
  const [childrenSearchTerm, setChildrenSearchTerm] = useState('');
  const [selectedChildren, setSelectedChildren] = useState<any[]>([]);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [parentModalStudentSearch, setParentModalStudentSearch] = useState('');
  const [selectedStudentsForParent, setSelectedStudentsForParent] = useState<any[]>([]);
  const [parentLinkedStudents, setParentLinkedStudents] = useState<any[]>([]);
  const [teacherViewMode, setTeacherViewMode] = useState('grid');
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showViewTeacher, setShowViewTeacher] = useState(false);
  const [showEditTeacher, setShowEditTeacher] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);

  // Homework State (view-only for school)
  const [homeworkFilter, setHomeworkFilter] = useState({
    class: 'all',
    student: 'all',
    teacher: 'all',
    status: 'all'
  });
  const [homeworkSearchTerm, setHomeworkSearchTerm] = useState('');

  // Targets State (view-only for school)
  const [targetsFilter, setTargetsFilter] = useState({
    type: 'all',
    status: 'all',
    teacher: 'all'
  });
  const [targetsSearchTerm, setTargetsSearchTerm] = useState('');

  // Mastery State (view-only for school)
  const [masteryData, setMasteryData] = useState<any>(null);
  const [masteryLoading, setMasteryLoading] = useState(false);
  const [masteryError, setMasteryError] = useState<string | null>(null);
  const [masterySearchTerm, setMasterySearchTerm] = useState('');
  const [masteryStudentFilter, setMasteryStudentFilter] = useState('all');

  // Gradebook State (view-only for school)
  const [gradebookData, setGradebookData] = useState<any>(null);
  const [gradebookLoading, setGradebookLoading] = useState(false);
  const [gradebookError, setGradebookError] = useState<string | null>(null);
  const [gradebookSearchTerm, setGradebookSearchTerm] = useState('');

  // Additional Credential State
  const [showAddCredential, setShowAddCredential] = useState(false);
  const [editingCredential, setEditingCredential] = useState<any>(null);
  const [credentialSearch, setCredentialSearch] = useState('');
  const [showPassword, setShowPassword] = useState<Record<string, any>>({});

  // Create Credential Form State
  const [credUserType, setCredUserType] = useState('');
  const [credUserSearch, setCredUserSearch] = useState('');
  const [credSelectedUser, setCredSelectedUser] = useState<any>(null);
  const [showCredUserDropdown, setShowCredUserDropdown] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [activeMessageTab, setActiveMessageTab] = useState('inbox');
  const [calendarView, setCalendarView] = useState('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddEvent, setShowAddEvent] = useState(false);

  // Assignment filters
  const [classFilter, setClassFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  // Additional Reports filters
  const [reportDateRange, setReportDateRange] = useState('30days');
  const [performanceFilter, setPerformanceFilter] = useState('average');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false);
      }
      if (settingsRef.current && !settingsRef.current.contains(event.target as Node)) {
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

  // PRODUCTION: Real-time subscriptions for live updates
  useEffect(() => {
    if (!user?.schoolId) return;

    // Subscribe to students changes
    const studentsSubscription = supabase
      .channel(`students:${user.schoolId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'students',
        filter: `school_id=eq.${user.schoolId}`
      }, () => {
        refreshData();
      })
      .subscribe();

    // Subscribe to teachers changes
    const teachersSubscription = supabase
      .channel(`teachers:${user.schoolId}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'teachers',
        filter: `school_id=eq.${user.schoolId}`
      }, () => {
        refreshData();
      })
      .subscribe();

    return () => {
      studentsSubscription.unsubscribe();
      teachersSubscription.unsubscribe();
    };
  }, [user?.schoolId, refreshData]);

  // PRODUCTION: Add Student Function (with skipAlert flag for bulk operations)
  const handleAddStudent = async (studentData: any, skipAlert: boolean = false) => {
    try {
      // Get current user session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showNotification('Please login as school administrator', 'error');
        return;
      }

      // Call API endpoint (uses admin client - no rate limiting)
      const response = await fetch('/api/school/create-student', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: studentData.name,
          email: studentData.email,
          age: studentData.age,
          grade: studentData.grade,
          dob: studentData.dob,
          gender: studentData.gender,
          phone: studentData.phone,
          schoolId: user?.schoolId
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create student');
      }

      refreshData();

      // Only show notification and close modal for individual adds
      if (!skipAlert) {
        setShowAddModal(false);
        showNotification(
          `Student "${studentData.name}" added successfully!`,
          'success',
          8000,
          `Login: ${result.data.email} | Password: ${result.data.password}`
        );
      }

      // Return success data for bulk operations
      return { success: true, tempPassword: result.data.password, email: result.data.email };
    } catch (error: any) {
      console.error('Error adding student:', error);
      if (!skipAlert) {
        showNotification(
          'Failed to add student',
          'error',
          5000,
          error?.message || 'An error occurred'
        );
      }
      throw error;
    }
  };

  // PRODUCTION: Add Teacher Function (FIXED - Uses Service Role Key endpoint)
  const handleAddTeacher = async (teacherData: any) => {
    try {
      // Get current user session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showNotification('Please login as school administrator', 'error');
        return;
      }

      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';

      // Call server-side API endpoint that BYPASSES RLS using Service Role Key
      const response = await fetch('/api/school/create-teacher', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: teacherData.name,
          email: teacherData.email,
          password: tempPassword,
          schoolId: user?.schoolId || schoolInfo?.id,
          bio: teacherData.bio || '',  // Only optional teacher field in database
          classIds: teacherData.assignedClasses || []  // For class_teachers linking
          // FIX #4: Removed phone, subject, qualification, experience, address (not in database)
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create teacher');
      }

      // Close modal first to prevent UI race conditions
      setShowAddModal(false);

      // Show success notification with credentials
      showNotification(
        `Teacher "${teacherData.name}" added successfully!`,
        'success',
        10000,
        `Login: ${teacherData.email} | Password: ${result.data?.password || tempPassword}`
      );

      // Then refresh data after a small delay to ensure everything is settled
      setTimeout(() => {
        refreshData();
      }, 100);
    } catch (error: any) {
      console.error('Error adding teacher:', error);
      showNotification(
        'Failed to add teacher',
        'error',
        5000,
        error.message
      );
    }
  };

  // PRODUCTION: Add Parent Function
  // PRODUCTION: Add Parent Function (FIXED - Uses Service Role Key endpoint)
  const handleAddParent = async (parentData: any) => {
    try {
      // Get current user session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showNotification('Please login as school administrator', 'error');
        return;
      }

      // Generate temporary password
      const tempPassword = Math.random().toString(36).slice(-12) + 'A1!';

      console.log('🚀 Calling server-side parent creation API...');

      // Call the server-side API endpoint with Service Role Key (BYPASSES RLS!)
      const response = await fetch('/api/school/create-parent', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          name: parentData.name,
          email: parentData.email,
          password: tempPassword,
          phone: parentData.phone,
          address: parentData.address,
          schoolId: user?.schoolId || schoolInfo?.id,
          studentIds: parentData.studentIds || []  // Array of student IDs to link
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create parent');
      }

      console.log('✅ Parent creation successful!', result);

      setShowAddParent(false);

      showNotification(
        `Parent "${parentData.name}" added successfully!`,
        'success',
        10000,
        `Login: ${parentData.email} | Password: ${result.data?.password || tempPassword}${
          result.data?.linkedStudents > 0 ? ` | Linked to ${result.data.linkedStudents} student(s)` : ''
        }`
      );

      // Refresh data after short delay
      setTimeout(() => refreshData(), 100);

    } catch (error: any) {
      console.error('💥 Error adding parent:', error);
      showNotification(
        'Failed to add parent',
        'error',
        5000,
        error.message
      );
    }
  };

  // PRODUCTION: Create Class Function - Basic info only (teachers/students assigned in Class Builder)
  const handleCreateClass = async (classData: any) => {
    try {
      // Format schedules for storage
      const formattedSchedules = classData.schedules.map((schedule: any) => ({
        day: schedule.day,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        duration: calculateDuration(schedule.startTime, schedule.endTime)
      }));

      // Create class record
      const classInsertData: TablesInsert<'classes'> = {
        school_id: user?.schoolId || '',
        name: classData.name,
        room: classData.room || null,
        grade_level: classData.grade || null,
        capacity: classData.capacity || 30,
        schedule_json: {  // FIXED: Field name is schedule_json in database, not schedule
          schedules: formattedSchedules,
          timezone: 'Africa/Casablanca' // Default timezone
        },
        created_by: null, // Will be set when teacher is assigned in Class Builder
        created_at: new Date().toISOString()
      };

      const { data, error } = await (supabase as any)
        .from('classes')
        .insert(classInsertData)
        .select()
        .single();

      if (error) throw error;

      // Update local state immediately
      setClasses((prev: any) => [...prev, data]);
      refreshData();
      setShowCreateClass(false);
      setClassSchedules([]);

      showNotification(
        `Class "${classData.name} created successfully!`,
        'success',
        5000,
        `${formattedSchedules.length} schedule${formattedSchedules.length > 1 ? 's' : ''} added. Use Class Builder to assign teachers and students.`
      );

      // Optionally open Class Builder after creation
      setTimeout(() => {
        setShowClassBuilder(true);
      }, 1000);
    } catch (error: any) {
      console.error('Error creating class:', error);
      showNotification(
        'Failed to create class',
        'error',
        5000,
        error.message
      );
    }
  };

  // Helper function to calculate duration between two times
  const calculateDuration = (startTime: any, endTime: any) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    const diffMs = end.getTime() - start.getTime();
    return Math.round(diffMs / (1000 * 60)); // Convert to minutes
  };

  // PRODUCTION: View Class Function
  // Homework Handlers (Quran Memorization)
  const handleCreateHomework = async (homeworkData: any) => {
    try {
      const { data: userData } = await (supabase as any).auth.getUser();
      if (!userData?.user) return;

      // Get teacher ID
      const { data: teacherData } = await (supabase as any)
        .from('teachers')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

      if (!teacherData) {
        showNotification('You must be a teacher to create homework', 'error');
        return;
      }

      // Create homework with Quran-specific data
      const newHomework = {
        id: Date.now().toString(),
        teacherId: (teacherData as any).id,
        studentId: homeworkData.student_id,
        studentName: students.find((s: any) => s.id === homeworkData.student_id)?.name || 'Unknown',
        surah: homeworkData.surah,
        startVerse: homeworkData.startVerse,
        endVerse: homeworkData.endVerse,
        type: homeworkData.type, // memorization or revision
        dueDate: homeworkData.dueDate,
        highlights: 0,
        completed: false,
        late: new Date(homeworkData.dueDate) < new Date()
      };

      setHomeworkList((prev: any) => [...prev, newHomework]);
      showNotification('Quran homework created successfully', 'success');
      setShowAddModal(false);

      // Save to database (you can create a separate table for Quran homework)
      // const { data, error } = await (supabase as any).from('quran_homework').insert(...)
    } catch (error: any) {
      console.error('Error creating homework:', error);
      showNotification('Failed to create homework', 'error');
    }
  };

  const handleViewHomework = (homeworkId: any) => {
    const homework = homeworkList.find((h: any) => h.id === homeworkId);
    setViewingHomework(homework);
    // Open Quran viewer with highlighting enabled
  };

  const handleGradeHomework = (homeworkId: any) => {
    const homework = homeworkList.find((h: any) => h.id === homeworkId);
    // Open grading interface for Quran homework
    showNotification('Opening grading interface...', 'info');
  };

  // Assignment Handlers (General Tasks)
  const handleCreateAssignment = async (assignmentData: any) => {
    try {
      const { data: userData } = await (supabase as any).auth.getUser();
      if (!userData?.user) return;

      // Get teacher ID
      const { data: teacherData } = await (supabase as any)
        .from('teachers')
        .select('id')
        .eq('user_id', userData.user.id)
        .single();

      if (!teacherData) {
        showNotification('You must be a teacher to create assignments', 'error');
        return;
      }

      const insertData: TablesInsert<'assignments'> = {
        school_id: user?.schoolId || '',
        created_by_teacher_id: (teacherData as any).id,
        student_id: assignmentData.student_id,
        title: assignmentData.title,
        description: assignmentData.description || null,
        due_at: assignmentData.due_at,
        status: 'assigned'
      };

      const { data, error } = await (supabase as any)
        .from('assignments')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      setAssignments((prev: any) => [...prev, data]);
      showNotification('Assignment created successfully', 'success');
      setShowAddModal(false);

      // Refresh data
      loadAssignments();
    } catch (error: any) {
      console.error('Error creating assignment:', error);
      showNotification('Failed to create assignment', 'error');
    }
  };

  const handleViewAssignment = async (assignmentId: any) => {
    const assignment = assignments.find((a: any) => a.id === assignmentId);
    setViewingAssignment(assignment);
  };

  const handleEditAssignment = (assignment: any) => {
    setEditingAssignment(assignment);
    setAddModalType('assignment');
    setShowAddModal(true);
  };

  const handleUpdateAssignment = async (assignmentId: string, assignmentData: any) => {
    try {
      const updateData: TablesUpdate<'assignments'> = {
        title: assignmentData.title,
        description: assignmentData.description || null,
        student_id: assignmentData.student_id,
        due_at: assignmentData.due_at
      };

      const { error } = await (supabase as any)
        .from('assignments')
        .update(updateData)
        .eq('id', assignmentId);

      if (error) throw error;

      showNotification('Assignment updated successfully', 'success');
      setShowAddModal(false);
      setEditingAssignment(null);

      // Refresh data
      loadAssignments();
    } catch (error: any) {
      console.error('Error updating assignment:', error);
      showNotification('Failed to update assignment', 'error');
    }
  };

  const handleDeleteAssignment = async (assignmentId: any, title: any) => {
    if (!confirm(`Are you sure you want to delete "${title}?`)) return;

    try {
      const { error } = await (supabase as any)
        .from('assignments')
        .delete()
        .eq('id', assignmentId);

      if (error) throw error;

      setAssignments((prev: any) => prev.filter((a: any) => a.id !== assignmentId));
      showNotification('Assignment deleted successfully', 'success');
    } catch (error: any) {
      console.error('Error deleting assignment:', error);
      showNotification('Failed to delete assignment', 'error');
    }
  };

  const handleDeleteTarget = async (targetId: any, title: any) => {
    if (!confirm(`Are you sure you want to delete "${title}?`)) return;

    try {
      // For now, targets will be stored locally or in a different table
      setTargets((prev: any) => prev.filter((t: any) => t.id !== targetId));
      showNotification('Target deleted successfully', 'success');
    } catch (error: any) {
      console.error('Error deleting target:', error);
      showNotification('Failed to delete target', 'error');
    }
  };

  const handleUpdateTargetProgress = (targetId: any) => {
    // Open a modal to update progress
    const target = targets.find((t: any) => t.id === targetId);
    if (target) {
      const newProgress = prompt(`Update progress for "${target.title} (0-100):`, target.progress);
      if (newProgress !== null) {
        const progress = Math.max(0, Math.min(100, parseInt(newProgress) || 0));
        setTargets((prev: any) => prev.map((t: any) =>
          t.id === targetId ? { ...t, progress } : t
        ));
        showNotification('Target progress updated', 'success');
      }
    }
  };

  // Load homework from highlights (green highlighting for memorization)
  const loadHomework = async () => {
    try {
      // Homework comes from highlights table (green = pending, gold = completed)
      const { data, error} = await (supabase as any)
        .from('highlights')
        .select(`
          *,
          student:students!student_id (
            id,
            user_id,
            profiles:user_id (
              display_name,
              email
            )
          ),
          teacher:teachers!teacher_id (
            id,
            user_id,
            profiles:user_id (
              display_name,
              email
            )
          ),
          quran_ayahs(surah, ayah),
          notes(text, audio_url)
        `)
        .eq('school_id', user?.schoolId || '')
        .in('color', ['green', 'gold']) // Green = pending homework, Gold = completed homework
        .order('created_at', { ascending: false }) as any;

      if (error) throw error;

      // Transform highlights into homework format
      const transformedHomework = (data || []).map((highlight: any) => ({
        id: highlight.id,
        studentId: highlight.student_id,
        studentName: highlight.student?.profiles?.display_name ||
                     highlight.student?.profiles?.email?.split('@')[0] ||
                     'Unknown Student',
        teacherId: highlight.teacher_id,
        teacherName: highlight.teacher?.profiles?.display_name ||
                     highlight.teacher?.profiles?.email?.split('@')[0] ||
                     'Unknown Teacher',
        surah: highlight.quran_ayahs?.surah || 'Unknown Surah',
        ayah: highlight.quran_ayahs?.ayah || 0,
        startVerse: highlight.token_start,
        endVerse: highlight.token_end,
        type: 'memorization',
        dueDate: highlight.created_at,
        color: highlight.color,
        completed: highlight.color === 'gold',
        late: false
      }));

      setHomeworkList(transformedHomework);
    } catch (error: any) {
      console.error('Error loading homework:', error);
    }
  };

  // Load assignments from database
  const loadAssignments = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('assignments')
        .select(`
          *,
          student:students!student_id (
            id,
            user_id,
            profiles:user_id (
              display_name,
              email
            )
          ),
          teacher:teachers!created_by_teacher_id (
            id,
            user_id,
            profiles:user_id (
              display_name,
              email
            )
          ),
          assignment_submissions(count)
        `)
        .eq('school_id', user?.schoolId || '')
        .order('created_at', { ascending: false }) as any;

      if (error) throw error;

      // Transform data to include student and teacher names from profiles
      const transformedAssignments = (data || []).map((assignment: any) => ({
        ...assignment,
        studentName: assignment.student?.profiles?.display_name ||
                     assignment.student?.profiles?.email?.split('@')[0] ||
                     'Unknown Student',
        teacherName: assignment.teacher?.profiles?.display_name ||
                     assignment.teacher?.profiles?.email?.split('@')[0] ||
                     'Unknown Teacher',
        submissions_count: assignment.assignment_submissions?.[0]?.count || 0
      }));

      setAssignments(transformedAssignments);
    } catch (error: any) {
      console.error('Error loading assignments:', error);
    }
  };

  // Targets are now loaded via useTargets hook (removed incorrect loadTargets function)

  // Load credentials data
  const loadCredentials = async () => {
    if (!user?.schoolId) return;

    setLoadingCredentials(true);
    try {
      const { data, error } = await (supabase as any)
        .from('user_credentials')
        .select(`
          *,
          profiles!user_credentials_user_id_fkey (
            display_name,
            email,
            role
          )
        `)
        .eq('school_id', user.schoolId)
        .order('created_at', { ascending: false }) as any;

      if (error) throw error;

      setCredentials(data || []);
    } catch (error: any) {
      console.error('Error loading credentials:', error);
      showNotification('Failed to load credentials', 'error');
    } finally {
      setLoadingCredentials(false);
    }
  };

  // Fetch mastery data for school
  const fetchMasteryData = async () => {
    if (!user?.schoolId) return;

    setMasteryLoading(true);
    setMasteryError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setMasteryError('Please login to view mastery data');
        return;
      }

      const response = await fetch('/api/mastery/school', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch mastery data');
      }

      const result = await response.json();
      setMasteryData(result.data);
    } catch (error: any) {
      console.error('Error fetching mastery data:', error);
      setMasteryError(error.message || 'Failed to load mastery data');
      showNotification('Failed to load mastery data', 'error');
    } finally {
      setMasteryLoading(false);
    }
  };

  // Fetch gradebook data for school
  const fetchGradebookData = async () => {
    if (!user?.schoolId) return;

    setGradebookLoading(true);
    setGradebookError(null);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setGradebookError('Please login to view gradebook data');
        return;
      }

      const response = await fetch('/api/gradebook/school', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch gradebook data');
      }

      const result = await response.json();
      setGradebookData(result.data);
    } catch (error: any) {
      console.error('Error fetching gradebook data:', error);
      setGradebookError(error.message || 'Failed to load gradebook data');
      showNotification('Failed to load gradebook data', 'error');
    } finally {
      setGradebookLoading(false);
    }
  };

  // Send credential email
  const sendCredentialEmail = async (credentialId: any) => {
    setSendingEmail((prev: any) => ({ ...prev, [credentialId]: true }));

    try {
      const credential = credentials.find((c: any) => c.id === credentialId);
      if (!credential) throw new Error('Credential not found');

      // Get school name
      const { data: schoolData } = await (supabase as any)
        .from('schools')
        .select('name')
        .eq('id', user?.schoolId || '')
        .single();

      // Call the edge function to send email
      const emailHtml = `
        <h2>Welcome to ${(schoolData as any)?.name || 'QuranAkh School'}</h2>
        <p>Hello ${credential.profiles?.display_name || 'User'},</p>
        <p>Your ${credential.role} account has been created.</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Your Login Credentials:</h3>
          <p><strong>Email:</strong> ${credential.email}</p>
          <p><strong>Password:</strong> ${credential.password}</p>
          <p><strong>Role:</strong> ${credential.role}</p>
        </div>
        <p><strong>Important:</strong> Only the school administration can change passwords.</p>
        <p>Login at: https://quranakh.com</p>
      `;

      const { error } = await supabase.functions.invoke('send-email', {
        body: {
          to: credential.email,
          subject: `Your ${(schoolData as any)?.name || 'QuranAkh School'} Login Credentials`,
          html: emailHtml
        }
      });

      if (error) throw error;

      // Update sent_at timestamp
      const updateData: TablesUpdate<'user_credentials'> = {
        sent_at: new Date().toISOString()
      };

      await (supabase as any)
        .from('user_credentials')
        .update(updateData)
        .eq('id', credentialId);

      showNotification('Credential email sent successfully', 'success');
      loadCredentials(); // Reload to show updated status
    } catch (error: any) {
      console.error('Error sending credential email:', error);
      showNotification('Failed to send credential email', 'error');
    } finally {
      setSendingEmail((prev: any) => ({ ...prev, [credentialId]: false }));
    }
  };

  // Send bulk credential emails
  const sendBulkCredentialEmails = async () => {
    const pendingCredentials = credentials.filter((c: any) => !c.sent_at);

    if (pendingCredentials.length === 0) {
      showNotification('No pending credentials to send', 'warning');
      return;
    }

    showNotification(`Sending ${pendingCredentials.length} credential emails...`, 'info');

    for (const credential of pendingCredentials) {
      await sendCredentialEmail(credential.id);
      // Add small delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    showNotification('Bulk email sending completed', 'success');
  };

  // Reset password
  const resetCredentialPassword = async (credentialId: any) => {
    try {
      // Get the credential to extract user_id
      const credential = credentials.find((c: any) => c.id === credentialId);
      if (!credential) {
        throw new Error('Credential not found');
      }

      // Generate new password
      const newPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-5);

      // Call API to update BOTH Supabase Auth AND user_credentials table
      const response = await fetch('/api/school/reset-password', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: credential.user_id,
          newPassword: newPassword,
          credentialId: credentialId
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to reset password');
      }

      showNotification('Password reset successfully. Both Auth and credentials updated. Send email to share new password.', 'success');
      loadCredentials();
    } catch (error: any) {
      console.error('Error resetting password:', error);
      showNotification('Failed to reset password: ' + error.message, 'error');
    }
  };

  // Load Messages from database
  const loadMessages = async () => {
    try {
      // Get messages where the current user is either sender or recipient
      const { data: sentMessages, error: sentError } = await (supabase as any)
        .from('messages')
        .select('*')
        .eq('school_id', user?.schoolId || '')
        .eq('sender_id', user?.id || '')
        .order('created_at', { ascending: false });

      // Get sender profiles separately
      let sentWithProfiles = [];
      if (sentMessages && !sentError) {
        const senderIds = [...new Set(sentMessages.map((m: any) => m.sender_id))];
        const { data: senderProfiles } = await (supabase as any)
          .from('profiles')
          .select('user_id, display_name, email, role')
          .in('user_id', senderIds);

        sentWithProfiles = sentMessages.map((msg: any) => ({
          ...msg,
          sender: senderProfiles?.find((p: any) => p.user_id === msg.sender_id) || null
        }));
      }

      // Get received messages
      const { data: receivedRecords, error: receivedError } = await (supabase as any)
        .from('message_recipients')
        .select('*')
        .eq('recipient_id', user?.id || '')
        .order('created_at', { ascending: false });

      let receivedMessages = [];
      if (receivedRecords && !receivedError) {
        const messageIds = receivedRecords.map((r: any) => r.message_id);
        const { data: messages } = await (supabase as any)
          .from('messages')
          .select('*')
          .in('user_id', messageIds);

        if (messages) {
          const senderIds = [...new Set(messages.map((m: any) => m.sender_id))];
          const { data: senderProfiles } = await (supabase as any)
            .from('profiles')
            .select('user_id, display_name, email, role')
            .in('user_id', senderIds);

          receivedMessages = receivedRecords.map((rec: any) => {
            const message = messages.find((m: any) => m.id === rec.message_id);
            const sender = senderProfiles?.find((p: any) => p.user_id === (message as any)?.sender_id);
            return {
              ...rec,
              messages: {
                ...(message || {}),
                sender
              }
            };
          });
        }
      }

      if (sentError) console.error('Error loading sent messages:', sentError);
      if (receivedError) console.error('Error loading received messages:', receivedError);

      // Combine and format messages
      const allMessages = [
        ...(sentWithProfiles || []).map((msg: any) => ({
          ...msg,
          type: 'sent',
          unread: false
        })),
        ...(receivedMessages || []).map((rec: any) => ({
          ...rec.messages,
          type: 'received',
          unread: !rec.is_read,
          read_at: rec.read_at
        }))
      ];

      // Sort by date
      allMessages.sort((a, b) => new Date(b.created_at || b.messages?.created_at).getTime() - new Date(a.created_at || a.messages?.created_at).getTime());

      setMessages(allMessages);

      // Get unread count
      const unreadCount = allMessages.filter((m: any) => m.type === 'received' && m.unread).length;
      if (unreadCount > 0) {
        showNotification(`You have ${unreadCount} unread message${unreadCount > 1 ? 's' : ''}`, 'info');
      }
    } catch (error: any) {
      console.error('Error loading messages:', error);
      showNotification('Failed to load messages', 'error');
    }
  };

  // Send Message function
  const handleSendMessage = async (recipient: any, subject: any, body: any, recipientType: any, priority = 'normal', sendViaEmail = false) => {
    try {
      // Make sure we have required values
      if (!user?.id || !user?.schoolId) {
        console.error('Missing user data:', { userId: user?.id, schoolId: user?.schoolId });
        showNotification('User session error. Please refresh the page.', 'error');
        return;
      }

      // Prepare recipient details based on type
      let recipientDetails = null;
      if (recipientType === 'specific_class' && selectedClass) {
        recipientDetails = { class_id: selectedClass };
      } else if (recipientType === 'individual' && selectedRecipients.length > 0) {
        recipientDetails = { user_ids: selectedRecipients.map((r: any) => r.user_id || r.id) };
      }

      console.log('Sending message with:', {
        school_id: user.schoolId,
        sender_id: user.id,
        subject: subject || 'No Subject',
        body: body,
        recipient_type: recipientType
      });

      const { data, error } = await (supabase as any)
        .from('messages')
        .insert({
          school_id: user.schoolId,
          sender_id: user.id,
          subject: subject || 'No Subject',
          body: body,
          priority: priority,
          recipient_type: recipientType,
          recipient_details: recipientDetails,
          sent_via_email: sendViaEmail
        })
        .select();

      if (error) {
        console.error('Send message error details:', error);
        // Try without select() if that's causing issues
        if (error.message?.includes('select')) {
          const { data: retryData, error: retryError } = await (supabase as any)
            .from('messages')
            .insert({
              school_id: user.schoolId,
              sender_id: user.id,
              subject: subject || 'No Subject',
              body: body,
              priority: priority,
              recipient_type: recipientType,
              recipient_details: recipientDetails,
              sent_via_email: sendViaEmail
            });

          if (!retryError) {
            showNotification('Message sent successfully!', 'success');
            setShowComposeMessage(false);
            setMessageSubject('');
            setMessageContent('');
            setMessageRecipientType('all');
            setSelectedRecipients([]);
            setTimeout(() => loadMessages(), 1000);
            return;
          }
        }
        throw error;
      }

      showNotification('Message sent successfully!', 'success');
      setShowComposeMessage(false);

      // Reset form
      setMessageSubject('');
      setMessageContent('');
      setMessageRecipientType('all');
      setSelectedRecipients([]);

      // Reload messages after a short delay to allow trigger to complete
      setTimeout(() => {
        loadMessages();
      }, 1000);
    } catch (error: any) {
      console.error('Error sending message:', error);
      showNotification('Failed to send message: ' + (error.message || 'Unknown error'), 'error');
    }
  };

  // Handle reply to message - TODO: Implement full functionality
  const handleReplyMessage = (message: any) => {
    console.log('Reply to message:', message);
    // TODO: Implement reply functionality
    // This should:
    // 1. Open compose modal with recipient pre-filled
    // 2. Add "Re: " to subject
    // 3. Include original message in body
    showNotification('Reply functionality coming soon', 'info');
  };

  // Handle delete message - TODO: Implement full functionality
  const handleDeleteMessage = async (messageId: any) => {
    console.log('Delete message:', messageId);
    // TODO: Implement delete functionality
    // This should:
    // 1. Show confirmation dialog
    // 2. Delete from database
    // 3. Update UI
    showNotification('Delete functionality coming soon', 'info');
  };

  // Handle star/unstar message - TODO: Implement full functionality
  const handleStarMessage = async (messageId: any) => {
    console.log('Star/unstar message:', messageId);
    // TODO: Implement star functionality
    // This should:
    // 1. Toggle star status in database
    // 2. Update UI immediately
    showNotification('Star functionality coming soon', 'info');
  };
  // Handle send reply - TODO: Implement full functionality
  const handleSendReply = async () => {
    console.log('Send reply');
    // TODO: Implement send reply functionality
    // This should:
    // 1. Get reply content from state
    // 2. Send as new message with reference to original
    // 3. Update UI and close reply modal
    showNotification('Send reply functionality coming soon', 'info');
  };

  // Mark message as read
  const markMessageAsRead = async (messageId: any) => {
    try {
      await (supabase as any).rpc('mark_message_read', {
        p_message_id: messageId,
        p_user_id: user?.id || ''
      });

      // Update local state
      setMessages((prev: any) => prev.map((msg: any) =>
        msg.id === messageId ? { ...msg, unread: false } : msg
      ));
    } catch (error: any) {
      console.error('Error marking message as read:', error);
    }
  };

  // Attendance filter handlers
  const handleApplyAttendanceFilters = async () => {
    const filters: any = {};

    // Apply class filter
    if (attendanceClassFilter) {
      filters.class_id = attendanceClassFilter;
    }

    // Apply student filter
    if (attendanceStudentFilter) {
      filters.student_id = attendanceStudentFilter;
    }

    // For teacher filter, we need to find classes taught by that teacher
    if (attendanceTeacherFilter) {
      // Find classes where this teacher teaches
      const teacherClasses = classes.filter((cls: any) =>
        cls.teachers?.some((t: any) => t.id === attendanceTeacherFilter)
      );

      if (teacherClasses.length > 0) {
        // If no class filter is set, filter by teacher's classes
        if (!filters.class_id) {
          // For now, we'll fetch all and filter client-side since API doesn't support multiple class_ids
          filters.class_id = teacherClasses[0].id; // Use first class for API call
        }
      }
    }

    // Fetch attendance with filters
    await refreshAttendance(filters);
  };

  const handleClearAttendanceFilters = async () => {
    setAttendanceSearchTerm('');
    setAttendanceClassFilter('');
    setAttendanceStudentFilter('');
    setAttendanceTeacherFilter('');

    // Fetch all attendance (no filters)
    await refreshAttendance({});
  };

  // Load all data on component mount
  useEffect(() => {
    if (user?.schoolId) {
      loadHomework();
      loadAssignments();
      fetchTargets(); // Use hook's fetchTargets instead of loadTargets
      loadMessages();
      refreshAttendance({}); // Fetch all school attendance (no filters for admin/owner)
    }
  }, [user?.schoolId, fetchTargets, refreshAttendance]);

  // Load credentials when tab changes to credentials
  useEffect(() => {
    if (user?.schoolId && activeTab === 'credentials') {
      loadCredentials();
    }
  }, [user?.schoolId, activeTab]);

  // Real-time message subscription
  useEffect(() => {
    if (!user?.schoolId) return;

    const messageChannel = supabase
      .channel(`messages:${user.schoolId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'messages',
        filter: `school_id=eq.${user.schoolId}`
      }, (payload) => {
        // Reload messages when new message is received
        loadMessages();
        showNotification('New message received!', 'info');
      })
      .subscribe();

    return () => {
      supabase.removeChannel(messageChannel);
    };
  }, [user?.schoolId]);

  // Filter assignments based on status
  const filteredAssignments = assignments.filter((assignment: any) => {
    if (assignmentFilter === 'all') return true;
    if (assignmentFilter === 'pending') return assignment.status === 'assigned' && !assignment.late;
    return assignment.status === assignmentFilter;
  });

  const pendingAssignments = assignments.filter((a: any) => a.status === 'assigned' && !a.late).length;

  const handleViewClass = async (classId: any) => {
    const cls = classes.find((c: any) => c.id === classId);
    if (cls) {
      // Fetch teacher IDs assigned to this class
      const { data: classTeachers } = await (supabase as any)
        .from('class_teachers')
        .select('teacher_id')
        .eq('class_id', classId);

      // Fetch full teacher details with profiles
      let teachersWithDetails = [];
      if (classTeachers && classTeachers.length > 0) {
        const teacherIds = classTeachers.map((ct: any) => ct.teacher_id);

        // Get teacher records
        const { data: teacherRecords } = await (supabase as any)
          .from('teachers')
          .select('id, user_id, subject')
          .in('id', teacherIds);

        if (teacherRecords && teacherRecords.length > 0) {
          const userIds = teacherRecords.map((t: any) => t.user_id);

          // Get profile names
          const { data: profiles } = await (supabase as any)
            .from('profiles')
            .select('user_id, display_name')
            .in('user_id', userIds);

          // Combine teacher data with profile names
          teachersWithDetails = teacherRecords.map((teacher: any) => {
            const profile = profiles?.find((p: any) => p.user_id === teacher.user_id);
            return {
              teacher_id: teacher.id,
              teachers: {
                name: profile?.display_name || 'Unknown',
                subject: teacher.subject || 'No subject'
              }
            };
          });
        }
      }

      // Fetch student IDs enrolled in this class
      const { data: classEnrollments } = await (supabase as any)
        .from('class_enrollments')
        .select('student_id')
        .eq('class_id', classId);

      // Fetch full student details with profiles
      let studentsWithDetails = [];
      if (classEnrollments && classEnrollments.length > 0) {
        const studentIds = classEnrollments.map((ce: any) => ce.student_id);

        // Get student records
        const { data: studentRecords } = await (supabase as any)
          .from('students')
          .select('id, user_id, grade')
          .in('id', studentIds);

        if (studentRecords && studentRecords.length > 0) {
          const userIds = studentRecords.map((s: any) => s.user_id);

          // Get profile names and emails
          const { data: profiles } = await (supabase as any)
            .from('profiles')
            .select('user_id, display_name, email')
            .in('user_id', userIds);

          // Combine student data with profile info
          studentsWithDetails = studentRecords.map((student: any) => {
            const profile = profiles?.find((p: any) => p.user_id === student.user_id);
            return {
              student_id: student.id,
              students: {
                name: profile?.display_name || 'Unknown',
                email: profile?.email || '',
                grade: student.grade || 'N/A'
              }
            };
          });
        }
      }

      setViewingClass({
        ...cls,
        assigned_teachers: teachersWithDetails,
        enrolled_students: studentsWithDetails
      });
    }
  };

  // PRODUCTION: Edit Class Function
  const handleEditClass = async (classData: any) => {
    try {
      // Format schedules for storage
      const formattedSchedules = classData.schedules.map((schedule: any) => ({
        day: schedule.day,
        startTime: schedule.startTime,
        endTime: schedule.endTime,
        duration: calculateDuration(schedule.startTime, schedule.endTime)
      }));

      const classUpdateData: TablesUpdate<'classes'> = {
        name: classData.name,
        room: classData.room || null,
        grade_level: classData.grade || null,
        capacity: classData.capacity || 30,
        schedule_json: {
          schedules: formattedSchedules,
          timezone: 'Africa/Casablanca'
        }
      };

      const { error } = await (supabase as any)
        .from('classes')
        .update(classUpdateData)
        .eq('id', classData.id);

      if (error) throw error;

      refreshData();
      setEditingClass(null);
      setEditClassSchedules([]);

      showNotification(
        `Class "${classData.name} updated successfully!`,
        'success',
        5000
      );
    } catch (error: any) {
      console.error('Error updating class:', error);
      showNotification(
        'Failed to update class',
        'error',
        5000,
        error.message
      );
    }
  };

  // PRODUCTION: Delete Class Function
  const handleDeleteClass = async (classId: any, className: any) => {
    if (!confirm(`Are you sure you want to delete "${className}? This will remove all enrollments and teacher assignments.`)) {
      return;
    }

    try {
      // Delete will cascade to class_teachers and class_enrollments
      const { error } = await (supabase as any)
        .from('classes')
        .delete()
        .eq('id', classId);

      if (error) throw error;

      setClasses((prev: any) => prev.filter((c: any) => c.id !== classId));
      refreshData();

      showNotification(
        `Class "${className} deleted successfully!`,
        'success',
        5000
      );
    } catch (error: any) {
      console.error('Error deleting class:', error);
      showNotification(
        'Failed to delete class',
        'error',
        5000,
        error.message
      );
    }
  };

  // PRODUCTION: Bulk Upload Function with Duplicate Detection
  const handleBulkUpload = async (file: any, type: any) => {
    try {
      // Parse CSV file
      const text = await file.text();
      const rows = text.split('\n').filter((row: any) => row.trim());
      const headers = rows[0];
      const data = rows.slice(1);

      if (type === 'students') {
        // Extract all emails from CSV with better parsing
        const csvEmails = [];
        const allStudentData = [];

        for (const row of data) {
          // Better CSV parsing - handle commas within quotes
          const cols = row.split(',').map((col: any) => col.trim());

          if (cols[0] && cols[0].trim()) {
            // Clean email field - remove any quotes, spaces, and special characters
            let email = cols[1] ? cols[1].trim() : '';
            email = email.replace(/^["']|["']$/g, ''); // Remove leading/trailing quotes
            email = email.replace(/\s+/g, ''); // Remove all spaces
            email = email.toLowerCase();

            // Validate email format
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(email)) {
              console.error('Invalid email format:', email, 'Original:', cols[1]);
              showNotification(
                'Invalid email format in CSV',
                'error',
                5000,
                `Check email: "${cols[1]}`
              );
              return;
            }

            csvEmails.push(email);

            const studentData = {
              name: cols[0].trim().replace(/^["']|["']$/g, ''),
              email: email, // Use the cleaned email
              age: parseInt(cols[2]) || null,
              grade: cols[3]?.trim().replace(/^["']|["']$/g, ''),
              gender: cols[4]?.trim().replace(/^["']|["']$/g, ''),
              address: cols[5]?.trim().replace(/^["']|["']$/g, '') || '',
              phone: cols[6]?.trim().replace(/^["']|["']$/g, '') || '',
              parent: cols[7]?.trim().replace(/^["']|["']$/g, '') || ''
            };

            allStudentData.push(studentData);
          }
        }

        // Check for duplicates in database
        const { data: existingProfiles, error: checkError } = await (supabase as any)
          .from('profiles')
          .select('email')
          .in('email', csvEmails);

        if (checkError) {
          console.error('Error checking duplicates:', checkError);
        }

        const existingEmails = (existingProfiles || []).map((p: any) => p.email.toLowerCase());

        // Separate duplicates and new records
        const duplicateRows = [];
        const newRows = [];

        for (const studentData of allStudentData) {
          if (existingEmails.includes(studentData.email)) {
            duplicateRows.push(studentData);
          } else {
            newRows.push(studentData);
          }
        }

        // Show duplicate review if found, otherwise proceed
        if (duplicateRows.length > 0) {
          setDuplicates(duplicateRows);
          setUploadedData(newRows);
          setShowDuplicateReview(true);
          setShowBulkUpload(false);
        } else {
          // No duplicates, proceed with upload
          setShowBulkUpload(false);
          await processBulkStudents(newRows, 'skip');
        }
      } else if (type === 'teachers') {
        // Similar logic for teachers
        for (const row of data) {
          const cols = row.split(',');
          if (cols[0] && cols[0].trim()) {
            await handleAddTeacher({
              name: cols[0].trim(),
              email: cols[1].trim(),
              subject: cols[2]?.trim(),
              phone: cols[3]?.trim() || '',
              qualification: cols[4]?.trim() || '',
              experience: cols[5]?.trim() || ''
            });
          }
        }
        setShowBulkUpload(false);
        refreshData();
        showNotification(
          'Bulk upload completed',
          'success',
          4000,
          'All teachers uploaded successfully'
        );
      }
    } catch (error: any) {
      console.error('Error in bulk upload:', error);
      showNotification(
        'Bulk upload failed',
        'error',
        5000,
        error.message
      );
    }
  };

  // Process bulk students - Professional version
  const processBulkStudents = async (students: any, duplicateAction = 'skip') => {
    setShowBulkProgress(true);
    setBulkProgress({
      total: students.length,
      processed: 0,
      success: 0,
      failed: 0,
      skipped: 0,
      current: 'Initializing...',
      credentials: [],
      isComplete: false
    });

    let successCount = 0;
    let failedStudents = [];
    let skippedStudents = [];
    let credentials = [];

    for (let i = 0; i < students.length; i++) {
      const student = students[i];

      // Update progress
      setBulkProgress((prev: any) => ({
        ...prev,
        processed: i + 1,
        current: `Processing ${student.name} (${i + 1}/${students.length})...`
      }));

      try {
        const result = await handleAddStudent(student, true); // Skip individual alerts
        successCount++;
        credentials.push({
          name: student.name,
          email: result.email,
          password: result.tempPassword
        });

        setBulkProgress((prev: any) => ({
          ...prev,
          success: successCount,
          credentials: [...prev.credentials, {
            name: student.name,
            email: result.email,
            password: result.tempPassword
          }]
        }));
      } catch (error: any) {
        if (error.message === 'DUPLICATE_EMAIL') {
          if (duplicateAction === 'skip') {
            skippedStudents.push({
              name: student.name,
              email: student.email,
              reason: 'Duplicate email'
            });
            setBulkProgress((prev: any) => ({ ...prev, skipped: prev.skipped + 1 }));
          } else if (duplicateAction === 'update') {
            // Update existing student data
            try {
              // Find existing user
              const { data: existingProfile } = await (supabase as any)
                .from('profiles')
                .select('user_id')
                .eq('email', student.email.toLowerCase())
                .single();

              if (existingProfile) {
                // Update student data
                await (supabase as any)
                  .from('students')
                  .update({
                    age: student.age,
                    grade: student.grade,
                    gender: student.gender,
                    address: student.address
                  })
                  .eq('user_id', (existingProfile as any).user_id);

                successCount++;
                setBulkProgress((prev: any) => ({ ...prev, success: successCount }));
              }
            } catch (updateError) {
              failedStudents.push({
                name: student.name,
                email: student.email,
                error: 'Failed to update existing student'
              });
              setBulkProgress((prev: any) => ({ ...prev, failed: prev.failed + 1 }));
            }
          }
        } else {
          failedStudents.push({
            name: student.name,
            email: student.email,
            error: error.message
          });
          setBulkProgress((prev: any) => ({ ...prev, failed: prev.failed + 1 }));
        }
      }

      // Add small delay to avoid rate limiting
      if (i < students.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }

    // Final update
    setBulkProgress((prev: any) => ({
      ...prev,
      current: 'Upload complete!',
      isComplete: true
    }));

    refreshData();

    // Return results
    return {
      success: successCount,
      failed: failedStudents,
      skipped: skippedStudents,
      credentials
    };
  };

  // PRODUCTION: Delete Student Function - Complete removal
  // PRODUCTION: Delete Student Function (FIXED - Uses Service Role Key endpoint)
  const handleDeleteStudent = async (studentId: any) => {
    if (!confirm('Are you sure you want to delete this student? This will completely remove them from the system.')) return;

    try {
      // Get current user session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showNotification('Please login as school administrator', 'error');
        return;
      }

      // Call server-side API endpoint that BYPASSES RLS using Service Role Key
      const response = await fetch('/api/school/delete-students', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          studentIds: [studentId]
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete student');
      }

      if (data.success) {
        refreshData();
        showNotification(
          'Student deleted successfully',
          'success',
          3000,
          'Completely removed from all systems including authentication'
        );
      } else if (data.errors && data.errors.length > 0) {
        throw new Error(data.errors[0].error);
      }
    } catch (error: any) {
      console.error('Error deleting student:', error);
      showNotification(
        'Failed to delete student',
        'error',
        5000,
        error.message
      );
    }
  };

  // PRODUCTION: Logout Function
  const handleLogout = async () => {
    try {
      await (supabase as any).auth.signOut();
      logout();
      window.location.href = '/login';
    } catch (error: any) {
      console.error('Error logging out:', error);
    }
  };

  // Loading state
  if (dataLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading your school data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (dataError) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{dataError}</p>
          <button
            onClick={refreshData}
            className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  // Filter functions
  const filteredStudents = students.filter((student: any) => {
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return student.name?.toLowerCase().includes(search) ||
             student.email?.toLowerCase().includes(search) ||
             student.grade?.toLowerCase().includes(search);
    }
    return true;
  });

  const filteredTeachers = teachers.filter((teacher: any) => {
    if (teacherSearchTerm) {
      const search = teacherSearchTerm.toLowerCase();
      return teacher.name?.toLowerCase().includes(search) ||
             teacher.email?.toLowerCase().includes(search) ||
             teacher.subject?.toLowerCase().includes(search);
    }
    return true;
  });

  const filteredParents = parents.filter((parent: any) => {
    if (parentSearchTerm) {
      const search = parentSearchTerm.toLowerCase();
      return parent.name?.toLowerCase().includes(search) ||
             parent.email?.toLowerCase().includes(search);
    }
    return true;
  });

  // Helper functions for UI interactions
  const handleSendEmail = (userIds: string[]) => {
    console.log('Sending email to:', userIds);
    showNotification(
      'Coming Soon',
      'info',
      3000,
      'Email functionality will be available soon'
    );
  };

  const handleExportStudents = () => {
    const csv = students.map((s: any) => `${s.name},${s.email},${s.grade},${s.status}`).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'students.csv';
    a.click();
  };

  const handleDeleteStudents = async (studentIds: any) => {
    if (!confirm(`Are you sure you want to delete ${studentIds.length} student(s)? This will completely remove them from the system.`)) return;

    try {
      // Get current user session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showNotification('Please login as school administrator', 'error');
        return;
      }

      const response = await fetch('/api/school/delete-students', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ studentIds })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete students');
      }

      if (data.success) {
        refreshData();
        setSelectedUsers([]);

        const errorMessage = data.errors && data.errors.length > 0
          ? `${data.errors.length} failed to delete`
          : undefined;

        showNotification(
          `Successfully deleted ${data.deletedCount} student(s)`,
          'success',
          3000,
          errorMessage || 'Completely removed from all systems including authentication'
        );

        if (data.errors && data.errors.length > 0) {
          console.error('Deletion errors:', data.errors);
        }
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error: any) {
      console.error('Error deleting students:', error);
      showNotification(
        'Error deleting students',
        'error',
        5000,
        error.message
      );
    }
  };

  // View Student Details
  const handleViewStudent = (student: any) => {
    setShowStudentDetails(student);
  };

  // Edit Student
  const handleEditStudent = (student: any) => {
    setEditingStudent(student);
  };

  // Delete Teacher Function
  const handleDeleteTeacher = async (teacherId: any) => {
    if (!confirm('Are you sure you want to delete this teacher? This will completely remove them from the system.')) return;

    try {
      // Get current user session for authorization
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        showNotification('Please login as school administrator', 'error');
        return;
      }

      const response = await fetch('/api/school/delete-teachers', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ teacherIds: [teacherId] })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete teacher');
      }

      if (data.success) {
        refreshData();
        showNotification(
          'Teacher deleted successfully',
          'success',
          3000,
          'Completely removed from all systems including authentication'
        );

        if (data.errors && data.errors.length > 0) {
          console.error('Deletion errors:', data.errors);
        }
      } else {
        throw new Error(data.error || 'Unknown error occurred');
      }
    } catch (error: any) {
      console.error('Error deleting teacher:', error);
      showNotification(
        'Failed to delete teacher',
        'error',
        5000,
        error.message
      );
    }
  };

  // Keep ALL the original UI rendering code from here...
  // [The rest of the component remains exactly the same with all the beautiful UI]

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Professional Notification System */}
      <div className="fixed top-4 right-4 z-[9999] space-y-2 pointer-events-none">
        {notifications.map((notification: any) => (
          <div
            key={notification.id}
            className={`
              pointer-events-auto transform transition-all duration-300 ease-in-out
              min-w-[350px] max-w-[500px] p-4 rounded-lg shadow-lg
              ${notification.type === 'success' ? 'bg-gradient-to-r from-green-500 to-green-600 text-white' : ''}
              ${notification.type === 'error' ? 'bg-gradient-to-r from-red-500 to-red-600 text-white' : ''}
              ${notification.type === 'warning' ? 'bg-gradient-to-r from-yellow-500 to-yellow-600 text-white' : ''}
              ${notification.type === 'info' ? 'bg-gradient-to-r from-blue-500 to-blue-600 text-white' : ''}
              animate-slideIn
            `}
            style={{
              animation: 'slideIn 0.3s ease-out'
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0">
                  {notification.type === 'success' && (
                    <CheckCircle className="w-6 h-6 text-white" />
                  )}
                  {notification.type === 'error' && (
                    <XCircle className="w-6 h-6 text-white" />
                  )}
                  {notification.type === 'warning' && (
                    <AlertCircle className="w-6 h-6 text-white" />
                  )}
                  {notification.type === 'info' && (
                    <Info className="w-6 h-6 text-white" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-semibold">{notification.message}</p>
                  {notification.details && (
                    <p className="text-sm mt-1 opacity-90">{notification.details}</p>
                  )}
                </div>
              </div>
              <button
                onClick={() => removeNotification(notification.id)}
                className="flex-shrink-0 ml-4 text-white hover:text-gray-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            {schoolInfo?.logo_url ? (
              <img
                src={schoolInfo.logo_url}
                alt="School Logo"
                className="w-10 h-10 rounded-lg object-cover"
              />
            ) : (
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
                <School className="w-6 h-6 text-white" />
              </div>
            )}
            <div>
              <h2 className="font-semibold text-gray-900">{schoolInfo?.name || 'My School'}</h2>
              <p className="text-xs text-gray-500">School Dashboard</p>
            </div>
          </div>
        </div>

        <nav className="p-4 space-y-1">
          {[
            { id: 'overview', label: 'Overview', icon: Home },
            { id: 'students', label: 'Students', icon: GraduationCap },
            { id: 'teachers', label: 'Teachers', icon: Users },
            { id: 'parents', label: 'Parents', icon: Users },
            { id: 'classes', label: 'Classes', icon: School },
            { id: 'homework', label: 'Homework', icon: BookOpen },
            { id: 'highlights', label: 'Highlights', icon: Bookmark },
            { id: 'assignments', label: 'Assignments', icon: FileText },
            { id: 'targets', label: 'Targets', icon: Target },
            { id: 'attendance', label: 'Attendance', icon: CheckSquare },
            { id: 'mastery', label: 'Mastery', icon: Brain },
            { id: 'gradebook', label: 'Gradebook', icon: ClipboardCheck },
            { id: 'messages', label: 'Messages', icon: Mail },
            { id: 'calendar', label: 'Calendar', icon: Calendar },
            { id: 'reports', label: 'Reports', icon: BarChart3 },
            { id: 'credentials', label: 'Credentials', icon: Key },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((item: any) => (
            <button
              key={item.id}
              onClick={() => {
                console.log('🔘 Menu clicked:', item.id);
                setActiveTab(item.id);
              }}
              className={`w-full flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors ${
                activeTab === item.id
                  ? 'bg-emerald-50 text-emerald-600'
                  : 'text-gray-600 hover:bg-gray-50'
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="absolute bottom-0 left-0 right-0 p-4 border-t">
          <button
            onClick={handleLogout}
            className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4">
          <div className="flex items-center justify-between relative">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>

            {/* Center - QuranAkh Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center">
              <img
                src="/quranakh-logo.png"
                alt="QuranAkh Logo"
                className="w-12 h-12 object-contain"
              />
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={refreshData}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                title="Refresh Data"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 relative"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>

                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">
                          Notifications {unreadCount > 0 && <span className="ml-2 text-sm text-red-500">({unreadCount} unread)</span>}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {unreadCount > 0 && (
                            <button
                              onClick={() => {
                                markAllAsRead();
                                showNotification('All notifications marked as read', 'success');
                              }}
                              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                              Mark all read
                            </button>
                          )}
                          <button
                            onClick={() => setShowNotificationPreferences(true)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <Settings className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {notificationsLoading && dbNotifications.length === 0 ? (
                        <div className="p-4 text-center text-gray-500">
                          <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin" />
                          Loading notifications...
                        </div>
                      ) : dbNotifications.length > 0 ? (
                        dbNotifications.map((notification: any) => (
                          <div
                            key={notification.id}
                            onClick={() => {
                              if (!notification.is_read) {
                                markAsRead(notification.id);
                              }
                            }}
                            className={`p-4 border-b hover:bg-gray-50 cursor-pointer transition-colors ${
                              !notification.is_read ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-lg ${
                                notification.type === 'assignment' ? 'bg-blue-100 text-blue-600' :
                                notification.type === 'homework' ? 'bg-green-100 text-green-600' :
                                notification.type === 'grade' ? 'bg-purple-100 text-purple-600' :
                                notification.type === 'attendance' ? 'bg-yellow-100 text-yellow-600' :
                                notification.type === 'message' ? 'bg-pink-100 text-pink-600' :
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {notification.type === 'assignment' && <FileText className="w-4 h-4" />}
                                {notification.type === 'homework' && <BookOpen className="w-4 h-4" />}
                                {notification.type === 'grade' && <Award className="w-4 h-4" />}
                                {notification.type === 'attendance' && <Users className="w-4 h-4" />}
                                {notification.type === 'message' && <MessageSquare className="w-4 h-4" />}
                                {!['assignment', 'homework', 'grade', 'attendance', 'message'].includes(notification.type) && <Bell className="w-4 h-4" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between">
                                  <p className={`text-sm ${!notification.is_read ? 'font-semibold text-gray-900' : 'text-gray-700'}`}>
                                    {notification.payload?.title || notification.payload?.message || 'New notification'}
                                  </p>
                                  {!notification.is_read && (
                                    <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full ml-2 mt-1"></span>
                                  )}
                                </div>
                                {notification.payload?.body && (
                                  <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                                    {notification.payload.body}
                                  </p>
                                )}
                                <p className="text-xs text-gray-400 mt-1">{notification.time_ago}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">No notifications yet</p>
                          <p className="text-xs mt-1">You'll be notified about important updates</p>
                        </div>
                      )}
                    </div>
                    {dbNotifications.length > 0 && (
                      <div className="p-3 border-t bg-gray-50 text-center">
                        <button
                          onClick={() => {
                            // TODO: Navigate to full notifications page
                            showNotification('Full notifications page coming soon', 'info');
                          }}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          View all notifications
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="relative" ref={settingsRef}>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                >
                  {schoolInfo?.logo_url ? (
                    <img
                      src={schoolInfo.logo_url}
                      alt="School Logo"
                      className="w-8 h-8 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                      {user?.fullName?.charAt(0) || schoolInfo?.name?.charAt(0) || 'S'}
                    </div>
                  )}
                </button>

                {showSettings && (
                  <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b">
                      <div className="flex items-center space-x-3 mb-2">
                        {schoolInfo?.logo_url ? (
                          <img
                            src={schoolInfo.logo_url}
                            alt="School Logo"
                            className="w-12 h-12 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                            {schoolInfo?.name?.charAt(0) || 'S'}
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-gray-900">{schoolInfo?.name || 'My School'}</p>
                          <p className="text-xs text-gray-500">{user?.fullName || 'School Admin'}</p>
                        </div>
                      </div>
                      <p className="text-sm text-gray-500">{user?.email}</p>
                    </div>
                    <div className="p-2">
                      <button
                        onClick={() => {
                          setActiveTab('settings');
                          setShowSettings(false);
                        }}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
                      >
                        <Settings className="w-4 h-4" />
                        <span>School Settings</span>
                      </button>
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Content Area - ALL THE BEAUTIFUL UI CONTINUES FROM HERE */}
        {/* [I'm including just the overview section as an example, but ALL sections should be included] */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <GraduationCap className="w-8 h-8 text-emerald-600" />
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      {stats.totalStudents > 0 ? 'Active' : 'Empty'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalStudents}</h3>
                  <p className="text-gray-600 text-sm">Total Students</p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-8 h-8 text-blue-600" />
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      {stats.totalTeachers > 0 ? 'Active' : 'Empty'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalTeachers}</h3>
                  <p className="text-gray-600 text-sm">Total Teachers</p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-8 h-8 text-purple-600" />
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      {stats.totalParents > 0 ? 'Active' : 'Empty'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalParents}</h3>
                  <p className="text-gray-600 text-sm">Total Parents</p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <School className="w-8 h-8 text-orange-600" />
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">
                      {stats.totalClasses > 0 ? 'Active' : 'Empty'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalClasses}</h3>
                  <p className="text-gray-600 text-sm">Total Classes</p>
                </div>
              </div>

              {/* Welcome Message for Empty School */}
              {stats.totalStudents === 0 && stats.totalTeachers === 0 && (
                <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-xl p-8 text-white">
                  <h2 className="text-2xl font-bold mb-4">Welcome to QuranAkh!</h2>
                  <p className="mb-6 text-emerald-100">
                    Your school is set up successfully. Start by adding your teachers and students to get started.
                  </p>
                  <div className="flex space-x-4">
                    <button
                      onClick={() => {
                        setAddModalType('teacher');
                        setShowAddModal(true);
                      }}
                      className="px-6 py-2 bg-white text-emerald-600 rounded-lg hover:bg-emerald-50 font-medium"
                    >
                      Add First Teacher
                    </button>
                    <button
                      onClick={() => {
                        setAddModalType('student');
                        setShowAddModal(true);
                      }}
                      className="px-6 py-2 bg-emerald-700 text-white rounded-lg hover:bg-emerald-800 font-medium"
                    >
                      Add First Student
                    </button>
                  </div>
                </div>
              )}

              {/* Quick Actions */}
              <div className="bg-white rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
                <div className="grid grid-cols-4 gap-4">
                  <button
                    onClick={() => {
                      setAddModalType('student');
                      setShowAddModal(true);
                    }}
                    className="p-4 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                  >
                    <UserPlus className="w-6 h-6 text-emerald-600 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Add Student</p>
                  </button>
                  <button
                    onClick={() => {
                      setAddModalType('teacher');
                      setShowAddModal(true);
                    }}
                    className="p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <Users className="w-6 h-6 text-blue-600 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Add Teacher</p>
                  </button>
                  <button
                    onClick={() => setShowCreateClass(true)}
                    className="p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                  >
                    <School className="w-6 h-6 text-purple-600 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Create Class</p>
                  </button>
                  <button
                    onClick={() => {
                      setBulkUploadType('students');
                      setShowBulkUpload(true);
                    }}
                    className="p-4 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors"
                  >
                    <Upload className="w-6 h-6 text-orange-600 mb-2" />
                    <p className="text-sm font-medium text-gray-900">Bulk Upload</p>
                  </button>
                </div>
              </div>

              {/* Recent Activities */}
              {recentActivities.length > 0 && (
                <div className="bg-white rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activities</h3>
                  <div className="space-y-3">
                    {recentActivities.map((activity: any) => (
                      <div key={activity.id} className="flex items-start space-x-3">
                        <div className={`p-2 rounded-lg ${activity.color}`}>
                          <activity.icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <p className="text-gray-900">{activity.description}</p>
                          <p className="text-sm text-gray-500">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Students Tab */}
          {activeTab === 'students' && (
            <div className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Students</p>
                      <p className="text-3xl font-bold mt-1">{students.length}</p>
                      <p className="text-blue-100 text-xs mt-2">{students.length === 0 ? 'No students yet' : 'Active enrollment'}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Active Students</p>
                      <p className="text-3xl font-bold mt-1">{students.filter((s: any) => s.status === 'active').length}</p>
                      <p className="text-green-100 text-xs mt-2">{students.length > 0 ? `${Math.round((students.filter((s: any) => s.status === 'active').length / students.length) * 100)}% active` : 'N/A'}</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <Activity className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Avg. Progress</p>
                      <p className="text-3xl font-bold mt-1">{students.length > 0 ? Math.round(students.reduce((acc: any, s: any) => acc + (s.progress || 0), 0) / students.length) : 0}%</p>
                      <p className="text-purple-100 text-xs mt-2">Across all students</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <TrendingUp className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Avg. Attendance</p>
                      <p className="text-3xl font-bold mt-1">{students.length > 0 ? Math.round(students.reduce((acc: any, s: any) => acc + (s.attendance || 0), 0) / students.length) : 0}%</p>
                      <p className="text-orange-100 text-xs mt-2">This month</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Main Content */}
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-white">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Students Management</h2>
                      <p className="text-sm text-gray-500 mt-1">Manage and track your students' progress</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={() => {
                          setBulkUploadType('students');
                          setShowBulkUpload(true);
                        }}
                        className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2 shadow-sm"
                      >
                        <Upload className="w-4 h-4" />
                        <span>Bulk Upload</span>
                      </button>
                      <button
                        onClick={() => { setAddModalType('student'); setShowAddModal(true); }}
                        className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition flex items-center space-x-2 shadow-sm"
                      >
                        <Plus className="w-4 h-4" />
                        <span>Add Student</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Search and Filters Bar */}
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by name, email, or class..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                        />
                      </div>

                      {/* Filter Dropdowns */}
                      <select className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">All Genders</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                      </select>

                      <select className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option value="">All Classes</option>
                        {classes.map((cls: any) => (
                          <option key={cls.id} value={cls.id}>{cls.name}</option>
                        ))}
                      </select>
                    </div>

                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setViewMode('grid')}
                        className={`p-2.5 rounded-lg transition ${
                          viewMode === 'grid'
                            ? 'bg-blue-100 text-blue-600'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <Grid className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => setViewMode('list')}
                        className={`p-2.5 rounded-lg transition ${
                          viewMode === 'list'
                            ? 'bg-blue-100 text-blue-600'
                            : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100'
                        }`}
                      >
                        <List className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Bulk Actions Bar */}
                  {selectedUsers.length > 0 && (
                    <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <span className="text-sm font-medium text-blue-900">
                          {selectedUsers.length} student{selectedUsers.length > 1 ? 's' : ''} selected
                        </span>
                        <button
                          onClick={() => setSelectedUsers([])}
                          className="text-sm text-blue-600 hover:text-blue-700"
                        >
                          Clear selection
                        </button>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleSendEmail(selectedUsers)}
                          className="px-3 py-1.5 bg-white text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50 transition flex items-center space-x-1"
                        >
                          <Mail className="w-4 h-4" />
                          <span>Email</span>
                        </button>
                        <button
                          onClick={handleExportStudents}
                          className="px-3 py-1.5 bg-white text-green-600 border border-green-300 rounded-lg hover:bg-green-50 transition flex items-center space-x-1"
                        >
                          <Download className="w-4 h-4" />
                          <span>Export</span>
                        </button>
                        <button
                          onClick={() => handleDeleteStudents(selectedUsers)}
                          className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition flex items-center space-x-1"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete</span>
                        </button>
                      </div>
                    </div>
                  )}

                  {students.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <GraduationCap className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-lg font-medium">No students yet</p>
                      <p className="text-sm text-gray-400 mt-1">Add your first student to get started</p>
                      <button
                        onClick={() => { setAddModalType('student'); setShowAddModal(true); }}
                        className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        <Plus className="w-4 h-4 inline mr-2" />
                        Add First Student
                      </button>
                    </div>
                  ) : viewMode === 'list' ? (
                    <div className="overflow-x-auto rounded-lg border border-gray-200">
                      <table className="w-full">
                        <thead className="bg-gray-50 border-b border-gray-200">
                          <tr>
                            <th className="px-6 py-3 text-left">
                              <input
                                type="checkbox"
                                className="rounded"
                                checked={selectedUsers.length === filteredStudents.length && filteredStudents.length > 0}
                                onChange={() => {
                                  if (selectedUsers.length === filteredStudents.length) {
                                    setSelectedUsers([]);
                                  } else {
                                    setSelectedUsers(filteredStudents.map((s: any) => s.id));
                                  }
                                }}
                              />
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Age/Gender</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Grade/Class</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Progress</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Attendance</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200 bg-white">
                          {filteredStudents.map((student: any) => (
                            <tr key={student.id} className="hover:bg-gray-50 transition">
                              <td className="px-6 py-4">
                                <input
                                  type="checkbox"
                                  className="rounded"
                                  checked={selectedUsers.includes(student.id)}
                                  onChange={() => {
                                    if (selectedUsers.includes(student.id)) {
                                      setSelectedUsers((prev: any) => prev.filter((id: any) => id !== student.id));
                                    } else {
                                      setSelectedUsers((prev: any) => [...prev, student.id]);
                                    }
                                  }}
                                />
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                    {student.name ? student.name.split(' ').map((n: any) => n[0]).join('').toUpperCase() : 'ST'}
                                  </div>
                                  <div className="ml-3">
                                    <p className="text-sm font-semibold text-gray-900">{student.name || 'Unknown'}</p>
                                    <p className="text-xs text-gray-500">{student.email}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm text-gray-900">
                                  {student.age ? `${student.age} yrs` : <span className="text-orange-600 text-xs">Age not set</span>}
                                </p>
                                <p className="text-xs text-gray-500">{student.gender || 'Not specified'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <p className="text-sm font-medium text-gray-900">{student.grade || 'N/A'}</p>
                                <p className="text-xs text-gray-500">{student.class || 'Unassigned'}</p>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-2">
                                  <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                                    <div
                                      className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                                      style={{ width: `${student.progress || 0}%` }}
                                    ></div>
                                  </div>
                                  <span className="text-sm font-medium text-gray-700">{student.progress || 0}%</span>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                  (student.attendance || 0) >= 95 ? 'bg-green-100 text-green-800' :
                                  (student.attendance || 0) >= 80 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                    (student.attendance || 0) >= 95 ? 'bg-green-600' :
                                    (student.attendance || 0) >= 80 ? 'bg-yellow-600' :
                                    'bg-red-600'
                                  }`}></span>
                                  {student.attendance || 0}%
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                  student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                                }`}>
                                  {student.status || 'active'}
                                </span>
                              </td>
                              <td className="px-6 py-4">
                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => handleViewStudent(student)}
                                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                    title="View Details"
                                  >
                                    <Eye className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleEditStudent(student)}
                                    className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition"
                                    title="Edit Student"
                                  >
                                    <Edit className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleDeleteStudents([student.id])}
                                    className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                    title="Delete Student"
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                      {filteredStudents.map((student: any) => (
                        <div key={student.id} className="bg-white border border-gray-200 rounded-xl hover:shadow-xl transition-all duration-300 overflow-hidden group">
                          <div className="p-5">
                            <div className="flex items-start justify-between mb-4">
                              <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                                {student.name ? student.name.split(' ').map((n: any) => n[0]).join('').toUpperCase() : 'ST'}
                              </div>
                              <input
                                type="checkbox"
                                className="rounded"
                                checked={selectedUsers.includes(student.id)}
                                onChange={() => {
                                  if (selectedUsers.includes(student.id)) {
                                    setSelectedUsers((prev: any) => prev.filter((id: any) => id !== student.id));
                                  } else {
                                    setSelectedUsers((prev: any) => [...prev, student.id]);
                                  }
                                }}
                              />
                            </div>

                            <div className="mb-4">
                              <h3 className="font-semibold text-gray-900 text-lg">{student.name || 'Unknown'}</h3>
                              <p className="text-sm text-gray-500 mt-1">{student.email}</p>
                              <div className="flex items-center space-x-2 mt-2">
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                  {student.grade || 'N/A'}
                                </span>
                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                  {student.class || 'Unassigned'}
                                </span>
                              </div>
                            </div>

                            <div className="space-y-3">
                              <div>
                                <div className="flex items-center justify-between text-sm mb-1">
                                  <span className="text-gray-500">Progress</span>
                                  <span className="font-semibold text-gray-700">{student.progress || 0}%</span>
                                </div>
                                <div className="bg-gray-200 rounded-full h-2">
                                  <div
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                                    style={{ width: `${student.progress || 0}%` }}
                                  ></div>
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Attendance</span>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                  (student.attendance || 0) >= 95 ? 'bg-green-100 text-green-800' :
                                  (student.attendance || 0) >= 80 ? 'bg-yellow-100 text-yellow-800' :
                                  'bg-red-100 text-red-800'
                                }`}>
                                  {student.attendance || 0}%
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-sm">
                                <span className="text-gray-500">Status</span>
                                <span className={`font-semibold ${student.status === 'active' ? 'text-green-600' : 'text-gray-600'}`}>
                                  {student.status || 'active'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                            <span className="text-xs text-gray-500">ID: {student.id.substring(0, 8)}</span>
                            <div className="flex items-center space-x-1">
                              <button
                                onClick={() => handleViewStudent(student)}
                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition"
                                title="View"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditStudent(student)}
                                className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-100 rounded-lg transition"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Teachers Tab */}
          {activeTab === 'teachers' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Teachers Management</h2>
                      <p className="text-sm text-gray-500 mt-1">Manage your teaching staff</p>
                    </div>
                    <div className="flex space-x-2">
                      <button
                        onClick={refreshData}
                        className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                        title="Refresh data"
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => { setAddModalType('teacher'); setShowAddModal(true); }}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        <Plus className="w-5 h-5 inline mr-2" />
                        Add Teacher
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {teachers.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-lg font-medium">No teachers yet</p>
                      <p className="text-sm text-gray-400 mt-1">Add your first teacher to get started</p>
                      <button
                        onClick={() => { setAddModalType('teacher'); setShowAddModal(true); }}
                        className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        <Plus className="w-4 h-4 inline mr-2" />
                        Add First Teacher
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {teachers.map((teacher: any) => (
                        <div key={teacher.id} className="bg-white border rounded-lg p-4 hover:shadow-lg transition-shadow">
                          <div className="flex items-center mb-3">
                            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                              <Users className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="ml-3">
                              <h3 className="font-semibold text-gray-900">{teacher.name}</h3>
                              <p className="text-sm text-gray-500">{teacher.subject}</p>
                            </div>
                          </div>
                          <div className="space-y-1 text-sm">
                            <p className="text-gray-600">📧 {teacher.email}</p>
                            <p className="text-gray-600">📱 {teacher.phone || 'Not provided'}</p>
                            <p className="text-gray-600">🎓 {teacher.qualification}</p>
                          </div>
                          <div className="flex justify-end space-x-2 mt-4">
                            <button
                              onClick={() => setShowTeacherDetails(teacher)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                              title="View Teacher"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => setEditingTeacher(teacher)}
                              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                              title="Edit Teacher"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteTeacher(teacher.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                              title="Delete Teacher"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Parents Tab */}
          {activeTab === 'parents' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Parents Management</h2>
                      <p className="text-sm text-gray-500 mt-1">Manage parent accounts and connections</p>
                    </div>
                    <button
                      onClick={() => setShowAddParent(true)}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                    >
                      <Plus className="w-5 h-5 inline mr-2" />
                      Add Parent
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  {parents.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-lg font-medium">No parents registered yet</p>
                      <p className="text-sm text-gray-400 mt-1">Parents will appear here when they register</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {parents.map((parent: any) => (
                        <div key={parent.id} className="bg-white border rounded-lg p-4 hover:shadow-lg transition-shadow">
                          <div className="flex items-center mb-3">
                            <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                              <Users className="w-6 h-6 text-orange-600" />
                            </div>
                            <div className="ml-3 flex-1">
                              <h3 className="font-semibold text-gray-900">{parent.name}</h3>
                              <p className="text-sm text-gray-500">{parent.email}</p>
                            </div>
                          </div>

                          {/* Parent Information */}
                          <div className="space-y-1 text-sm mb-3">
                            <p className="text-gray-600">
                              <Phone className="w-4 h-4 inline mr-1" />
                              {parent.phone || 'No phone'}
                            </p>
                            <p className="text-gray-600">
                              <MapPin className="w-4 h-4 inline mr-1" />
                              {parent.address || 'No address'}
                            </p>
                            <p className="text-gray-600">
                              <Users className="w-4 h-4 inline mr-1" />
                              {parent.children_count || 0} Children
                            </p>
                          </div>

                          {/* Action Buttons */}
                          <div className="flex justify-between items-center pt-3 border-t">
                            <button
                              onClick={async () => {
                                // Fetch linked students
                                const { data: linkedStudents } = await (supabase as any)
                                  .from('parent_students')
                                  .select(`
                                    student_id,
                                    students!inner (
                                      id,
                                      user_id,
                                      profiles!inner (
                                        display_name,
                                        email
                                      )
                                    )
                                  `)
                                  .eq('parent_id', parent.id) as any;

                                const formattedStudents = linkedStudents?.map((link: any) => ({
                                  id: link.students.id,
                                  name: link.students.profiles.display_name,
                                  email: link.students.profiles.email
                                })) || [];

                                setParentLinkedStudents(formattedStudents);
                                setShowViewParent(parent);
                              }}
                              className="text-blue-600 hover:text-blue-700 font-medium text-sm flex items-center"
                            >
                              <Eye className="w-4 h-4 mr-1" />
                              View
                            </button>
                            <button
                              onClick={() => {
                                setShowEditParent(parent);
                                // Pre-populate selected students for edit
                                (supabase
                                  .from('parent_students')
                                  .select(`
                                    students!inner (
                                      id,
                                      profiles!inner (
                                        display_name,
                                        email
                                      )
                                    )
                                  `)
                                  .eq('parent_id', parent.id) as any)
                                  .then(({ data }: any) => {
                                    const linkedStudents = data?.map((link: any) => ({
                                      id: link.students.id,
                                      name: link.students.profiles.display_name,
                                      email: link.students.profiles.email
                                    })) || [];
                                    setSelectedStudentsForParent(linkedStudents);
                                  });
                              }}
                              className="text-emerald-600 hover:text-emerald-700 font-medium text-sm flex items-center"
                            >
                              <Edit className="w-4 h-4 mr-1" />
                              Edit
                            </button>
                            <button
                              onClick={async () => {
                                if (confirm(`Are you sure you want to delete parent "${parent.name}"? This will completely remove them from the system.`)) {
                                  try {
                                    // FIXED: Use API endpoint with Bearer token instead of direct Supabase query
                                    const { data: { session } } = await supabase.auth.getSession();
                                    if (!session) {
                                      showNotification('Please login as school administrator', 'error');
                                      return;
                                    }

                                    const response = await fetch('/api/school/delete-parents', {
                                      method: 'DELETE',
                                      headers: {
                                        'Content-Type': 'application/json',
                                        'Authorization': `Bearer ${session.access_token}`
                                      },
                                      body: JSON.stringify({ parentIds: [parent.id] })
                                    });

                                    const data = await response.json();

                                    if (!response.ok) {
                                      throw new Error(data.error || 'Failed to delete parent');
                                    }

                                    if (data.success) {
                                      showNotification(
                                        `Parent "${parent.name}" deleted successfully`,
                                        'success',
                                        3000,
                                        'Completely removed from all systems including authentication'
                                      );
                                      refreshData();
                                    } else {
                                      throw new Error(data.error || 'Unknown error occurred');
                                    }
                                  } catch (error: any) {
                                    console.error('Error deleting parent:', error);
                                    showNotification(
                                      'Failed to delete parent',
                                      'error',
                                      5000,
                                      error.message
                                    );
                                  }
                                }
                              }}
                              className="text-red-600 hover:text-red-700 font-medium text-sm flex items-center"
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Classes Tab */}
          {activeTab === 'classes' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Classes Management</h2>
                      <p className="text-sm text-gray-500 mt-1">Organize your classes and schedules</p>
                    </div>
                    <div className="flex space-x-3">
                      <button
                        onClick={() => setShowClassBuilder(true)}
                        className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center"
                      >
                        <Move className="w-5 h-5 mr-2" />
                        Class Builder
                      </button>
                      <button
                        onClick={() => setShowCreateClass(true)}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center"
                      >
                        <Plus className="w-5 h-5 mr-2" />
                        Create Class
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {classes.length === 0 ? (
                    <div className="text-center py-12 bg-gray-50 rounded-lg">
                      <School className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                      <p className="text-gray-500 text-lg font-medium">No classes created yet</p>
                      <p className="text-sm text-gray-400 mt-1">Create your first class to organize students</p>
                      <button
                        onClick={() => setShowCreateClass(true)}
                        className="mt-4 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        <Plus className="w-4 h-4 inline mr-2" />
                        Create First Class
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      {classes.map((cls: any) => {
                        // Parse schedule_json to display properly
                        const schedule = cls.schedule_json || {};
                        const schedules = schedule.schedules || [];

                        // Format schedule display
                        const scheduleDisplay = schedules.length > 0
                          ? schedules.map((s: any) => `${s.day.slice(0, 3)} ${s.startTime}`).join(' • ')
                          : 'Not scheduled';

                        // Calculate utilization percentage
                        const utilization = cls.capacity ? (cls.student_count / cls.capacity) * 100 : 0;

                        return (
                          <div key={cls.id} className="bg-white rounded-xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full">
                            {/* Card Header with Gradient */}
                            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b">
                              <div className="flex items-start justify-between mb-2">
                                <h3 className="font-bold text-lg text-gray-900 line-clamp-2">{cls.name}</h3>
                                <div className="flex flex-col items-end gap-1">
                                  {cls.grade && (
                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                                      {cls.grade}
                                    </span>
                                  )}
                                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                                    utilization > 90 ? 'bg-red-100 text-red-700' :
                                    utilization > 70 ? 'bg-yellow-100 text-yellow-700' :
                                    'bg-green-100 text-green-700'
                                  }`}>
                                    {cls.student_count || 0}/{cls.capacity || 30}
                                  </span>
                                </div>
                              </div>

                              {/* Room Badge */}
                              <div className="flex items-center text-sm text-gray-600">
                                <MapPin className="w-3 h-3 mr-1" />
                                <span className="font-medium">{cls.room || 'No Room Assigned'}</span>
                              </div>
                            </div>

                            {/* Card Body - Fixed Height */}
                            <div className="flex-1 p-4 flex flex-col">
                              {/* Schedule Section */}
                              <div className="mb-3">
                                <div className="flex items-center text-xs font-semibold text-gray-700 mb-1">
                                  <Calendar className="w-3 h-3 mr-1" />
                                  SCHEDULE
                                </div>
                                <div className="bg-gray-50 rounded-lg px-3 py-2">
                                  <p className="text-sm text-gray-600 font-medium">
                                    {scheduleDisplay}
                                  </p>
                                  {schedules.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-0.5">
                                      {schedules.length} session{schedules.length !== 1 ? 's' : ''} per week
                                    </p>
                                  )}
                                </div>
                              </div>

                              {/* Teacher & Students Section */}
                              <div className="flex-1 space-y-3">
                                {/* Teacher Info */}
                                <div>
                                  <div className="flex items-center text-xs font-semibold text-gray-700 mb-1">
                                    <GraduationCap className="w-3 h-3 mr-1" />
                                    TEACHER{cls.teachers?.length > 1 ? 'S' : ''}
                                  </div>
                                  <div className="flex items-center">
                                    {cls.teachers && cls.teachers.length > 0 ? (
                                      <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                          <GraduationCap className="w-4 h-4 text-purple-600" />
                                        </div>
                                        <div className="flex-1">
                                          <p className="text-sm text-gray-700 font-medium truncate">
                                            {cls.teachers[0]?.name || 'Unknown Teacher'}
                                          </p>
                                          {cls.teachers[0]?.subject && (
                                            <p className="text-xs text-gray-500">{cls.teachers[0].subject}</p>
                                          )}
                                          {cls.teachers.length > 1 && (
                                            <p className="text-xs text-blue-600 mt-0.5">
                                              +{cls.teachers.length - 1} more
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-sm text-gray-400 italic">No teacher assigned</span>
                                    )}
                                  </div>
                                </div>

                                {/* Students Info with Avatars */}
                                <div>
                                  <div className="flex items-center justify-between text-xs font-semibold text-gray-700 mb-1">
                                    <div className="flex items-center">
                                      <Users className="w-3 h-3 mr-1" />
                                      STUDENTS
                                    </div>
                                    <span className="text-xs font-normal text-gray-500">
                                      {cls.student_count || 0} enrolled
                                    </span>
                                  </div>
                                  {cls.student_count > 0 ? (
                                    <div className="flex items-center space-x-1">
                                      {/* Student Avatar Circles */}
                                      <div className="flex -space-x-2">
                                        {[...Array(Math.min(cls.student_count, 5))].map((_: any, i: any) => (
                                          <div
                                            key={i}
                                            className="w-8 h-8 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full border-2 border-white flex items-center justify-center"
                                          >
                                            <span className="text-white text-xs font-bold">
                                              {String.fromCharCode(65 + i)}
                                            </span>
                                          </div>
                                        ))}
                                        {cls.student_count > 5 && (
                                          <div className="w-8 h-8 bg-gray-200 rounded-full border-2 border-white flex items-center justify-center">
                                            <span className="text-gray-600 text-xs font-bold">
                                              +{cls.student_count - 5}
                                            </span>
                                          </div>
                                        )}
                                      </div>

                                      {/* Capacity Bar */}
                                      <div className="flex-1">
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                          <div
                                            className={`h-full rounded-full transition-all ${
                                              utilization > 90 ? 'bg-red-500' :
                                              utilization > 70 ? 'bg-yellow-500' :
                                              'bg-green-500'
                                            }`}
                                            style={{ width: `${Math.min(utilization, 100)}%` }}
                                          />
                                        </div>
                                        <p className="text-xs text-gray-500 mt-0.5">{utilization.toFixed(0)}% Full</p>
                                      </div>
                                    </div>
                                  ) : (
                                    <span className="text-sm text-gray-400 italic">No students enrolled</span>
                                  )}
                                </div>
                              </div>

                              {/* Spacer to push buttons to bottom */}
                              <div className="flex-1"></div>

                              {/* Action Buttons - Always at Bottom */}
                              <div className="flex space-x-2 mt-4 pt-4 border-t">
                                <button
                                  onClick={() => handleViewClass(cls.id)}
                                  className="flex-1 px-3 py-2 text-sm font-medium bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors flex items-center justify-center"
                                >
                                  <Eye className="w-4 h-4 mr-1" />
                                  View
                                </button>
                                <button
                                  onClick={() => {
                                    setEditingClass(cls);
                                    setEditClassSchedules(cls.schedule_json?.schedules || []);
                                  }}
                                  className="flex-1 px-3 py-2 text-sm font-medium bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors flex items-center justify-center"
                                >
                                  <Edit className="w-4 h-4 mr-1" />
                                  Edit
                                </button>
                                <button
                                  onClick={() => handleDeleteClass(cls.id, cls.name)}
                                  className="flex-1 px-3 py-2 text-sm font-medium bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors flex items-center justify-center"
                                >
                                  <Trash2 className="w-4 h-4 mr-1" />
                                  Delete
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Homework Tab - Shows homework created from student highlighting */}
          {activeTab === 'homework' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Quran Homework (School Overview)</h2>
                      <p className="text-sm text-gray-500 mt-1">View all homework created by teachers across the school</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="px-3 py-1 bg-green-50 text-green-700 rounded-lg text-sm font-medium">
                        <Eye className="w-4 h-4 inline mr-1" />
                        School-wide View
                      </div>
                      <button
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={() => refreshData()}
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {/* Quran Homework List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {homeworkList.length === 0 ? (
                      <div className="col-span-full text-center py-12">
                        <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No Quran homework yet</h3>
                        <p className="text-gray-500 mb-4">
                          Homework will appear here when teachers create highlighting assignments for students
                        </p>
                        <p className="text-sm text-gray-400">
                          Teachers create homework by highlighting Quran verses in their Student Management dashboard
                        </p>
                      </div>
                    ) : (
                      homeworkList.map((homework: any) => (
                        <div
                          key={homework.id}
                          className="border border-green-200 rounded-lg p-4 bg-gradient-to-br from-green-50 to-emerald-50 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <BookOpen className="w-5 h-5 text-green-600" />
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              homework.completed ? 'bg-green-100 text-green-700' :
                              homework.late ? 'bg-red-100 text-red-700' :
                              'bg-yellow-100 text-yellow-700'
                            }`}>
                              {homework.completed ? 'Completed' : homework.late ? 'Late' : 'Pending'}
                            </span>
                          </div>

                          <h4 className="font-semibold text-gray-900 mb-1">{homework.surah}</h4>
                          <p className="text-sm text-gray-600 mb-2">
                            Verses: {homework.startVerse} - {homework.endVerse}
                          </p>

                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {homework.studentName}
                            </span>
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {new Date(homework.dueDate).toLocaleDateString()}
                            </span>
                          </div>

                          <div className="mt-3 pt-3 border-t border-green-200">
                            <div className="flex items-center justify-between text-xs">
                              <span className="text-green-700 font-medium">
                                {homework.type === 'memorization' ? '📖 Memorization' : '🔄 Revision'}
                              </span>
                              {homework.highlights && (
                                <span className="text-green-600">
                                  {homework.highlights} highlights
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex space-x-2 mt-3">
                            <button
                              onClick={() => handleViewHomework(homework.id)}
                              className="flex-1 px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-xs font-medium"
                            >
                              View
                            </button>
                            <button
                              onClick={() => handleGradeHomework(homework.id)}
                              className="flex-1 px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-xs font-medium"
                            >
                              Grade
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Highlights Tab - Shows all Quran highlights across school */}
          {activeTab === 'highlights' && (
            <div className="space-y-6">
              {/* Header with Stats */}
              <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center">
                      <Bookmark className="w-7 h-7 mr-3" />
                      School-wide Highlights
                    </h2>
                    <p className="text-purple-100 mt-1">All Quran highlights created by teachers across the school</p>
                  </div>
                  <button
                    onClick={refreshHighlights}
                    className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition flex items-center"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Refresh
                  </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <p className="text-purple-100 text-sm">Total</p>
                    <p className="text-2xl font-bold">{safeHighlights.length}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <p className="text-purple-100 text-sm">Homework</p>
                    <p className="text-2xl font-bold text-green-200">
                      {safeHighlights.filter((h: any) => h.type === 'homework' && !h.completed_at).length}
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <p className="text-purple-100 text-sm">Recap</p>
                    <p className="text-2xl font-bold text-purple-200">
                      {safeHighlights.filter((h: any) => h.type === 'recap' && !h.completed_at).length}
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <p className="text-purple-100 text-sm">Tajweed</p>
                    <p className="text-2xl font-bold text-orange-200">
                      {safeHighlights.filter((h: any) => h.type === 'tajweed' && !h.completed_at).length}
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <p className="text-purple-100 text-sm">Completed</p>
                    <p className="text-2xl font-bold text-yellow-200">
                      {safeHighlights.filter((h: any) => h.completed_at !== null).length}
                    </p>
                  </div>
                </div>
              </div>

              {/* Highlights Summary */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Highlights</h3>

                {highlightsLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">Loading highlights...</p>
                  </div>
                ) : highlightsError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <p className="text-red-600 font-semibold mb-2">Error loading highlights</p>
                    <p className="text-gray-600 mb-4">{highlightsError}</p>
                    <button
                      onClick={refreshHighlights}
                      className="bg-purple-600 text-white px-6 py-2 rounded-lg hover:bg-purple-700"
                    >
                      Try Again
                    </button>
                  </div>
                ) : safeHighlights.length === 0 ? (
                  <div className="text-center py-12">
                    <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No highlights yet</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Teachers can create highlights in the Student Management Dashboard
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {safeHighlights.slice(0, 20).map((highlight: any) => {
                      const student = students.find((s: any) => s.id === highlight.student_id);
                      const teacher = teachers.find((t: any) => t.id === highlight.teacher_id);

                      const isCompleted = highlight.completed_at !== null;
                      const colorMap: any = {
                        homework: { bg: 'bg-green-100', text: 'text-green-700', label: 'Homework' },
                        recap: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Recap' },
                        tajweed: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Tajweed' },
                        haraka: { bg: 'bg-red-100', text: 'text-red-700', label: 'Haraka' },
                        letter: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Letter' },
                      };

                      const typeStyle = isCompleted
                        ? { bg: 'bg-yellow-100', text: 'text-yellow-700', label: 'Completed' }
                        : (colorMap[highlight.type] || colorMap.homework);

                      return (
                        <div key={highlight.id} className={`${typeStyle.bg} border-l-4 border-${typeStyle.text.replace('text-', '')} p-4 rounded-r-lg`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${typeStyle.text}`}>
                                  {isCompleted ? '✓ Completed' : typeStyle.label}
                                </span>
                                <span className="text-sm text-gray-600">
                                  📖 Surah {highlight.surah}, Ayah {highlight.ayah_start}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span><User className="w-4 h-4 inline mr-1" />{student?.name || 'Unknown Student'}</span>
                                <span><GraduationCap className="w-4 h-4 inline mr-1" />{teacher?.name || 'Unknown Teacher'}</span>
                                <span className="text-xs text-gray-400">{new Date(highlight.created_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {safeHighlights.length > 20 && (
                      <div className="text-center text-gray-500 text-sm pt-4">
                        Showing 20 of {safeHighlights.length} highlights
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Assignments Tab - Shows assignments from highlighting */}
          {activeTab === 'assignments' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Assignments (School Overview)</h2>
                      <p className="text-sm text-gray-500 mt-1">Monitor all assignments created by teachers across the school</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">
                        <Eye className="w-4 h-4 inline mr-1" />
                        All Teachers' Assignments
                      </div>
                      <button
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={() => refreshData()}
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  {/* Filter Tabs */}
                  <div className="flex items-center space-x-4 mt-6">
                    {['all', 'pending', 'submitted', 'reviewed', 'completed'].map((status: any) => (
                      <button
                        key={status}
                        className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                          assignmentFilter === status
                            ? 'bg-blue-100 text-blue-700'
                            : 'text-gray-600 hover:bg-gray-100'
                        }`}
                        onClick={() => setAssignmentFilter(status)}
                      >
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                        {status === 'pending' && pendingAssignments > 0 && (
                          <span className="ml-2 px-2 py-0.5 bg-red-100 text-red-600 rounded-full text-xs">
                            {pendingAssignments}
                          </span>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="p-6">
                  {/* Assignments List */}
                  {assignments.length === 0 ? (
                    <div className="text-center py-12">
                      <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
                      <p className="text-gray-500 mb-4">
                        Assignments will appear here when teachers create them through student highlighting
                      </p>
                      <p className="text-sm text-gray-400">
                        This is a school-wide view of all teacher-created assignments
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {filteredAssignments.map((assignment: any) => (
                        <div
                          key={assignment.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center space-x-3">
                                <h3 className="font-semibold text-gray-900">{assignment.title}</h3>
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                  assignment.status === 'completed' ? 'bg-green-100 text-green-700' :
                                  assignment.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                                  assignment.status === 'reviewed' ? 'bg-purple-100 text-purple-700' :
                                  assignment.late ? 'bg-red-100 text-red-700' :
                                  'bg-yellow-100 text-yellow-700'
                                }`}>
                                  {assignment.status === 'assigned' && assignment.late ? 'Late' : assignment.status}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                              <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                                <span className="flex items-center">
                                  <User className="w-3 h-3 mr-1" />
                                  {assignment.studentName}
                                </span>
                                <span className="flex items-center">
                                  <School className="w-3 h-3 mr-1" />
                                  {assignment.className}
                                </span>
                                <span className="flex items-center">
                                  <Clock className="w-3 h-3 mr-1" />
                                  Due: {new Date(assignment.due_at).toLocaleDateString()}
                                </span>
                                {assignment.submissions_count > 0 && (
                                  <span className="flex items-center text-green-600">
                                    <CheckCircle className="w-3 h-3 mr-1" />
                                    {assignment.submissions_count} submission{assignment.submissions_count !== 1 ? 's' : ''}
                                  </span>
                                )}
                              </div>
                            </div>
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleViewAssignment(assignment.id)}
                                className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleEditAssignment(assignment)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDeleteAssignment(assignment.id, assignment.title)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Targets Tab - Shows learning progress */}
          {activeTab === 'targets' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm">
                <div className="p-6 border-b">
                  <div className="flex items-center justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">Learning Progress & Targets</h2>
                      <p className="text-sm text-gray-500 mt-1">Track student progress based on their highlighting and submissions</p>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="px-3 py-1 bg-purple-50 text-purple-700 rounded-lg text-sm font-medium">
                        <TrendingUp className="w-4 h-4 inline mr-1" />
                        Auto-tracked Progress
                      </div>
                      <button
                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                        onClick={() => refreshData()}
                      >
                        <RefreshCw className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {targets.length === 0 ? (
                    <div className="text-center py-12">
                      <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                      <h3 className="text-lg font-medium text-gray-900 mb-2">No learning progress data yet</h3>
                      <p className="text-gray-500 mb-4">
                        Student progress will be tracked automatically based on their highlighting work
                      </p>
                      <p className="text-sm text-gray-400">
                        Each completed highlighting session updates the student's mastery level
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {targets.map((target: any) => (
                        <div
                          key={target.id}
                          className="border rounded-lg p-4 hover:shadow-md transition-all"
                        >
                          <div className="flex items-start justify-between mb-3">
                            <Target className="w-5 h-5 text-green-600" />
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              target.progress >= 100 ? 'bg-green-100 text-green-700' :
                              target.progress >= 75 ? 'bg-blue-100 text-blue-700' :
                              target.progress >= 50 ? 'bg-yellow-100 text-yellow-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {target.progress}% Complete
                            </span>
                          </div>
                          <h4 className="font-semibold text-gray-900 mb-2">{target.title}</h4>
                          <p className="text-sm text-gray-600 mb-3">{target.description}</p>

                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2 mb-3">
                            <div
                              className={`h-full rounded-full transition-all ${
                                target.progress >= 100 ? 'bg-green-500' :
                                target.progress >= 75 ? 'bg-blue-500' :
                                target.progress >= 50 ? 'bg-yellow-500' :
                                'bg-gray-400'
                              }`}
                              style={{ width: `${Math.min(target.progress, 100)}%` }}
                            />
                          </div>

                          <div className="flex items-center justify-between text-sm text-gray-500">
                            <span className="flex items-center">
                              <User className="w-3 h-3 mr-1" />
                              {target.type === 'individual' ? (
                                <span>
                                  {target.student?.display_name || 'Unknown Student'}
                                  {target.students?.class_enrollments && target.students.class_enrollments.length > 0 && (
                                    <span className="text-gray-400 ml-1">
                                      ({target.students.class_enrollments.map((enrollment: any) => enrollment.classes?.name).filter(Boolean).join(', ')})
                                    </span>
                                  )}
                                </span>
                              ) : target.type === 'class'
                                ? (target.class?.name || 'Class Target')
                                : 'School Target'
                              }
                            </span>
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              {target.due_date ? new Date(target.due_date).toLocaleDateString() : 'No deadline'}
                            </span>
                          </div>

                          {/* Show teacher info for school admin (read-only view) */}
                          <div className="flex items-center justify-between text-xs text-gray-400 mt-2 pt-2 border-t">
                            <span className="flex items-center">
                              <GraduationCap className="w-3 h-3 mr-1" />
                              Created by: {target.teacher?.display_name || 'Unknown Teacher'}
                            </span>
                            <span className={`px-2 py-1 rounded-full ${
                              target.status === 'active' ? 'bg-green-50 text-green-700' :
                              target.status === 'completed' ? 'bg-blue-50 text-blue-700' :
                              'bg-gray-50 text-gray-700'
                            }`}>
                              {target.status}
                            </span>
                          </div>

                          {/* Note: School admin has READ-ONLY access to targets
                              Only teachers can update/delete their own targets */}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Attendance Tab - Shows all attendance marked across school */}
          {activeTab === 'attendance' && (
            <div className="space-y-6">
              {/* Header with Stats */}
              <div className="bg-gradient-to-r from-emerald-500 to-teal-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center">
                      <CheckSquare className="w-7 h-7 mr-3" />
                      School-wide Attendance
                    </h2>
                    <p className="text-emerald-100 mt-1">All attendance records marked by teachers across the school</p>
                  </div>
                  <button
                    onClick={() => refreshAttendance({})}
                    className="bg-white text-emerald-600 px-6 py-3 rounded-lg font-semibold hover:bg-emerald-50 transition flex items-center"
                  >
                    <RefreshCw className="w-5 h-5 mr-2" />
                    Refresh
                  </button>
                </div>

                {/* Stats Row */}
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <p className="text-emerald-100 text-sm">Total Records</p>
                    <p className="text-2xl font-bold">{attendanceStats?.total_records || 0}</p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <p className="text-emerald-100 text-sm">Present</p>
                    <p className="text-2xl font-bold text-green-200">
                      {attendanceStats?.present_count || 0}
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <p className="text-emerald-100 text-sm">Absent</p>
                    <p className="text-2xl font-bold text-red-200">
                      {attendanceStats?.absent_count || 0}
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <p className="text-emerald-100 text-sm">Late</p>
                    <p className="text-2xl font-bold text-yellow-200">
                      {attendanceStats?.late_count || 0}
                    </p>
                  </div>
                  <div className="bg-white bg-opacity-20 rounded-lg p-4">
                    <p className="text-emerald-100 text-sm">Excused</p>
                    <p className="text-2xl font-bold text-blue-200">
                      {attendanceStats?.excused_count || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* Attendance Records */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Attendance Records</h3>

                {/* Filters */}
                <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    {/* Text Search */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Search
                      </label>
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                          type="text"
                          placeholder="Search by student, class..."
                          value={attendanceSearchTerm}
                          onChange={(e) => setAttendanceSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Class Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Class
                      </label>
                      <select
                        value={attendanceClassFilter}
                        onChange={(e) => setAttendanceClassFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">All Classes</option>
                        {classes.map((cls: any) => (
                          <option key={cls.id} value={cls.id}>
                            {cls.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Student Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Student
                      </label>
                      <select
                        value={attendanceStudentFilter}
                        onChange={(e) => setAttendanceStudentFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">All Students</option>
                        {students.map((student: any) => (
                          <option key={student.id} value={student.id}>
                            {student.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Teacher Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teacher
                      </label>
                      <select
                        value={attendanceTeacherFilter}
                        onChange={(e) => setAttendanceTeacherFilter(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      >
                        <option value="">All Teachers</option>
                        {teachers.map((teacher: any) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Filter Actions */}
                  <div className="flex items-center gap-2 mt-4">
                    <button
                      onClick={handleApplyAttendanceFilters}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition flex items-center gap-2"
                    >
                      <Filter className="w-4 h-4" />
                      Apply Filters
                    </button>
                    <button
                      onClick={handleClearAttendanceFilters}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition flex items-center gap-2"
                    >
                      <X className="w-4 h-4" />
                      Clear Filters
                    </button>
                  </div>
                </div>

                {attendanceLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-12 h-12 text-emerald-600 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">Loading attendance records...</p>
                  </div>
                ) : attendanceError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <p className="text-red-600 font-semibold mb-2">Error loading attendance</p>
                    <p className="text-gray-600 mb-4">{attendanceError}</p>
                    <button
                      onClick={() => refreshAttendance({})}
                      className="bg-emerald-600 text-white px-6 py-2 rounded-lg hover:bg-emerald-700"
                    >
                      Try Again
                    </button>
                  </div>
                ) : safeAttendanceRecords.length === 0 ? (
                  <div className="text-center py-12">
                    <CheckSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No attendance records yet</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Teachers can mark attendance in their Teacher Dashboard
                    </p>
                  </div>
                ) : (
                  (() => {
                    // Apply client-side text search filter
                    const filteredRecords = safeAttendanceRecords.filter((record: any) => {
                      if (!attendanceSearchTerm) return true;
                      const searchLower = attendanceSearchTerm.toLowerCase();
                      return (
                        record.student_name?.toLowerCase().includes(searchLower) ||
                        record.class_name?.toLowerCase().includes(searchLower) ||
                        record.status?.toLowerCase().includes(searchLower)
                      );
                    });

                    if (filteredRecords.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 text-lg">No matching records found</p>
                          <p className="text-gray-400 text-sm mt-1">
                            Try adjusting your search or filters
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {filteredRecords.slice(0, 20).map((record: any) => {
                      const statusMap: any = {
                        present: { bg: 'bg-green-100', text: 'text-green-700', label: '✓ Present', icon: CheckCircle },
                        absent: { bg: 'bg-red-100', text: 'text-red-700', label: '✗ Absent', icon: XCircle },
                        late: { bg: 'bg-yellow-100', text: 'text-yellow-700', label: '⏰ Late', icon: Clock },
                        excused: { bg: 'bg-blue-100', text: 'text-blue-700', label: '✓ Excused', icon: CheckCircle },
                      };

                      const statusStyle = statusMap[record.status] || statusMap.present;
                      const StatusIcon = statusStyle.icon;

                      return (
                        <div key={record.id} className={`${statusStyle.bg} border-l-4 border-${statusStyle.text.replace('text-', '')} p-4 rounded-r-lg`}>
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-3 mb-2">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ${statusStyle.text} flex items-center gap-1`}>
                                  <StatusIcon className="w-3 h-3" />
                                  {statusStyle.label}
                                </span>
                                <span className="text-sm text-gray-600">
                                  📅 {new Date(record.session_date).toLocaleDateString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <span>
                                  <User className="w-4 h-4 inline mr-1" />
                                  {record.student_name || 'Unknown Student'}
                                </span>
                                <span>
                                  <School className="w-4 h-4 inline mr-1" />
                                  {record.class_name || 'Unknown Class'}
                                </span>
                                <span className="text-xs text-gray-400">
                                  Marked: {new Date(record.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              {record.notes && (
                                <div className="mt-2 text-sm text-gray-600 italic">
                                  Note: {record.notes}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}

                    {safeAttendanceRecords.length > 20 && (
                      <div className="text-center text-gray-500 text-sm pt-4">
                        Showing 20 of {safeAttendanceRecords.length} attendance records
                      </div>
                    )}
                  </div>
                );
              })()
                )}
              </div>
            </div>
          )}

          {/* Mastery Tab - Shows all mastery tracking across school */}
          {activeTab === 'mastery' && (
            <div className="space-y-6">
              {/* Header with Stats */}
              <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center">
                      <Brain className="w-7 h-7 mr-3" />
                      School-wide Mastery Tracking
                    </h2>
                    <p className="text-blue-100 mt-1">All mastery data tracked by teachers across the school</p>
                  </div>
                  <button
                    onClick={fetchMasteryData}
                    disabled={masteryLoading}
                    className="bg-white text-blue-600 px-6 py-3 rounded-lg font-semibold hover:bg-blue-50 transition flex items-center disabled:opacity-50"
                  >
                    <RefreshCw className={`w-5 h-5 mr-2 ${masteryLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {/* Stats Row */}
                {masteryData && (
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mt-6">
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <p className="text-blue-100 text-sm">Students Tracked</p>
                      <p className="text-2xl font-bold">{masteryData.total_students_with_mastery || 0}</p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <p className="text-blue-100 text-sm">Total Ayahs</p>
                      <p className="text-2xl font-bold">
                        {masteryData.total_ayahs_tracked || 0}
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <p className="text-blue-100 text-sm">Mastered</p>
                      <p className="text-2xl font-bold text-green-200">
                        {masteryData.school_wide_summary?.mastered_count || 0}
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <p className="text-blue-100 text-sm">Proficient</p>
                      <p className="text-2xl font-bold text-yellow-200">
                        {masteryData.school_wide_summary?.proficient_count || 0}
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <p className="text-blue-100 text-sm">Overall Progress</p>
                      <p className="text-2xl font-bold text-blue-100">
                        {Math.round(masteryData.school_wide_summary?.overall_progress_percentage || 0)}%
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Mastery Data Display */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                {/* Search and Filters */}
                <div className="mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={masterySearchTerm}
                        onChange={(e) => setMasterySearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {masteryLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">Loading mastery data...</p>
                  </div>
                ) : masteryError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <p className="text-red-600 font-semibold mb-2">Error loading mastery data</p>
                    <p className="text-gray-600 mb-4">{masteryError}</p>
                    <button
                      onClick={fetchMasteryData}
                      className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
                    >
                      Try Again
                    </button>
                  </div>
                ) : !masteryData || masteryData.students?.length === 0 ? (
                  <div className="text-center py-12">
                    <Brain className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No mastery data yet</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Teachers can track mastery in their Teacher Dashboard
                    </p>
                  </div>
                ) : (
                  (() => {
                    // Apply client-side search filter
                    const filteredStudents = masteryData.students.filter((student: any) => {
                      if (!masterySearchTerm) return true;
                      const searchLower = masterySearchTerm.toLowerCase();
                      return (
                        student.student_name?.toLowerCase().includes(searchLower) ||
                        student.student_email?.toLowerCase().includes(searchLower)
                      );
                    });

                    if (filteredStudents.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 text-lg">No matching students found</p>
                          <p className="text-gray-400 text-sm mt-1">
                            Try adjusting your search term
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {/* Student Mastery Cards */}
                        {filteredStudents.map((student: any) => (
                          <div
                            key={student.student_id}
                            className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                                    {student.student_name?.charAt(0) || 'S'}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{student.student_name}</h4>
                                    <p className="text-sm text-gray-500">{student.student_email}</p>
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-3">
                                  <div className="flex items-center justify-between text-sm mb-1">
                                    <span className="text-gray-600">Overall Progress</span>
                                    <span className="font-semibold text-blue-600">
                                      {Math.round(student.overall_progress_percentage || 0)}%
                                    </span>
                                  </div>
                                  <div className="w-full bg-gray-200 rounded-full h-2">
                                    <div
                                      className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all"
                                      style={{ width: `${student.overall_progress_percentage || 0}%` }}
                                    />
                                  </div>
                                </div>

                                {/* Mastery Stats */}
                                <div className="grid grid-cols-4 gap-3">
                                  <div className="bg-green-50 rounded-lg p-3 text-center">
                                    <p className="text-xs text-green-700 font-medium mb-1">Mastered</p>
                                    <p className="text-lg font-bold text-green-600">{student.mastered_count || 0}</p>
                                  </div>
                                  <div className="bg-yellow-50 rounded-lg p-3 text-center">
                                    <p className="text-xs text-yellow-700 font-medium mb-1">Proficient</p>
                                    <p className="text-lg font-bold text-yellow-600">{student.proficient_count || 0}</p>
                                  </div>
                                  <div className="bg-blue-50 rounded-lg p-3 text-center">
                                    <p className="text-xs text-blue-700 font-medium mb-1">Learning</p>
                                    <p className="text-lg font-bold text-blue-600">{student.learning_count || 0}</p>
                                  </div>
                                  <div className="bg-gray-50 rounded-lg p-3 text-center">
                                    <p className="text-xs text-gray-700 font-medium mb-1">Total Ayahs</p>
                                    <p className="text-lg font-bold text-gray-600">{student.total_ayahs_tracked || 0}</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Last Updated */}
                            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                Last updated: {new Date(student.last_updated).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}

                        {masteryData.students.length > 20 && (
                          <div className="text-center text-gray-500 text-sm pt-4">
                            Showing {Math.min(20, filteredStudents.length)} of {masteryData.students.length} students
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Recent Updates Section */}
              {masteryData && masteryData.recent_updates && masteryData.recent_updates.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-blue-600" />
                    Recent Mastery Updates
                  </h3>
                  <div className="space-y-3">
                    {masteryData.recent_updates.slice(0, 10).map((update: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {update.student_name?.charAt(0) || 'S'}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-gray-900">{update.student_name}</p>
                            <p className="text-xs text-gray-500">
                              Ayah {update.ayah_reference} → <span className={`font-semibold ${
                                update.level === 'mastered' ? 'text-green-600' :
                                update.level === 'proficient' ? 'text-yellow-600' :
                                update.level === 'learning' ? 'text-blue-600' :
                                'text-gray-600'
                              }`}>{update.level}</span>
                            </p>
                          </div>
                        </div>
                        <span className="text-xs text-gray-400">
                          {new Date(update.updated_at).toLocaleDateString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Gradebook Tab - Shows all grades across school */}
          {activeTab === 'gradebook' && (
            <div className="space-y-6">
              {/* Header with Stats */}
              <div className="bg-gradient-to-r from-orange-500 to-red-600 rounded-xl shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold flex items-center">
                      <ClipboardCheck className="w-7 h-7 mr-3" />
                      School-wide Gradebook
                    </h2>
                    <p className="text-orange-100 mt-1">All grades assigned by teachers across the school</p>
                  </div>
                  <button
                    onClick={fetchGradebookData}
                    disabled={gradebookLoading}
                    className="bg-white text-orange-600 px-6 py-3 rounded-lg font-semibold hover:bg-orange-50 transition flex items-center disabled:opacity-50"
                  >
                    <RefreshCw className={`w-5 h-5 mr-2 ${gradebookLoading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>

                {/* Stats Row */}
                {gradebookData && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <p className="text-orange-100 text-sm">Students Graded</p>
                      <p className="text-2xl font-bold">{gradebookData.total_students_with_grades || 0}</p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <p className="text-orange-100 text-sm">Graded Assignments</p>
                      <p className="text-2xl font-bold">
                        {gradebookData.total_assignments || 0}
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <p className="text-orange-100 text-sm">School Average</p>
                      <p className="text-2xl font-bold text-yellow-200">
                        {gradebookData.school_wide_average || 0}%
                      </p>
                    </div>
                    <div className="bg-white bg-opacity-20 rounded-lg p-4">
                      <p className="text-orange-100 text-sm">Overall Performance</p>
                      <p className="text-lg font-bold text-green-200">
                        {gradebookData.school_wide_average >= 90 ? 'Excellent' :
                         gradebookData.school_wide_average >= 80 ? 'Very Good' :
                         gradebookData.school_wide_average >= 70 ? 'Good' :
                         gradebookData.school_wide_average >= 60 ? 'Fair' : 'Needs Improvement'}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Info Banner - How Grading Works */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <h4 className="font-semibold text-blue-900 mb-1">How Grading Works</h4>
                    <p className="text-sm text-blue-700 leading-relaxed">
                      Each assignment is graded using a <span className="font-semibold">rubric with multiple criteria</span>.
                      For example, a Tajweed assignment might have 3 criteria: pronunciation, rules, and fluency.
                      The student's <span className="font-semibold">average score</span> is calculated across all criteria
                      from all their graded assignments to give their overall performance.
                    </p>
                  </div>
                </div>
              </div>

              {/* Gradebook Data Display */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                {/* Search and Filters */}
                <div className="mb-6">
                  <div className="flex items-center gap-4">
                    <div className="flex-1 relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                      <input
                        type="text"
                        placeholder="Search students..."
                        value={gradebookSearchTerm}
                        onChange={(e) => setGradebookSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>

                {gradebookLoading ? (
                  <div className="text-center py-12">
                    <RefreshCw className="w-12 h-12 text-orange-600 mx-auto mb-4 animate-spin" />
                    <p className="text-gray-600">Loading gradebook data...</p>
                  </div>
                ) : gradebookError ? (
                  <div className="text-center py-12">
                    <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
                    <p className="text-red-600 font-semibold mb-2">Error loading gradebook data</p>
                    <p className="text-gray-600 mb-4">{gradebookError}</p>
                    <button
                      onClick={fetchGradebookData}
                      className="bg-orange-600 text-white px-6 py-2 rounded-lg hover:bg-orange-700"
                    >
                      Try Again
                    </button>
                  </div>
                ) : !gradebookData || gradebookData.students?.length === 0 ? (
                  <div className="text-center py-12">
                    <ClipboardCheck className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No gradebook data yet</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Teachers can grade assignments in their Teacher Dashboard
                    </p>
                  </div>
                ) : (
                  (() => {
                    // Apply client-side search filter
                    const filteredStudents = gradebookData.students.filter((student: any) => {
                      if (!gradebookSearchTerm) return true;
                      const searchLower = gradebookSearchTerm.toLowerCase();
                      return (
                        student.student_name?.toLowerCase().includes(searchLower) ||
                        student.student_email?.toLowerCase().includes(searchLower)
                      );
                    });

                    if (filteredStudents.length === 0) {
                      return (
                        <div className="text-center py-12">
                          <Search className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                          <p className="text-gray-500 text-lg">No matching students found</p>
                          <p className="text-gray-400 text-sm mt-1">
                            Try adjusting your search term
                          </p>
                        </div>
                      );
                    }

                    return (
                      <div className="space-y-4">
                        {/* Student Grade Cards */}
                        {filteredStudents.map((student: any) => (
                          <div
                            key={student.student_id}
                            className="border border-gray-200 rounded-lg p-5 hover:shadow-md transition"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-3">
                                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white font-semibold">
                                    {student.student_name?.charAt(0) || 'S'}
                                  </div>
                                  <div>
                                    <h4 className="font-semibold text-gray-900">{student.student_name}</h4>
                                    <p className="text-sm text-gray-500">{student.student_email}</p>
                                  </div>
                                </div>

                                {/* Grade Summary */}
                                <div className="mb-3 flex items-center gap-4">
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Average Score:</span>
                                    <span className="text-2xl font-bold text-orange-600">
                                      {student.average_score || 0}%
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                    <span className="text-sm text-gray-600">Letter Grade:</span>
                                    <span className={`text-2xl font-bold ${
                                      student.letter_grade === 'A' ? 'text-green-600' :
                                      student.letter_grade === 'B' ? 'text-blue-600' :
                                      student.letter_grade === 'C' ? 'text-yellow-600' :
                                      student.letter_grade === 'D' ? 'text-orange-600' :
                                      'text-red-600'
                                    }`}>
                                      {student.letter_grade}
                                    </span>
                                  </div>
                                </div>

                                {/* Grade Stats */}
                                <div className="grid grid-cols-2 gap-3">
                                  <div className="bg-orange-50 rounded-lg p-3 text-center">
                                    <p className="text-xs text-orange-700 font-medium mb-1">Assignments Graded</p>
                                    <p className="text-lg font-bold text-orange-600">{student.total_assignments || 0}</p>
                                  </div>
                                  <div className="bg-green-50 rounded-lg p-3 text-center">
                                    <p className="text-xs text-green-700 font-medium mb-1">Performance</p>
                                    <p className="text-lg font-bold text-green-600">
                                      {student.average_score >= 90 ? 'Excellent' :
                                       student.average_score >= 80 ? 'Very Good' :
                                       student.average_score >= 70 ? 'Good' :
                                       student.average_score >= 60 ? 'Fair' : 'Needs Work'}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Last Graded */}
                            <div className="mt-3 pt-3 border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
                              <span className="flex items-center">
                                <Clock className="w-3 h-3 mr-1" />
                                Last graded: {new Date(student.last_graded).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}

                        {gradebookData.students.length > 20 && (
                          <div className="text-center text-gray-500 text-sm pt-4">
                            Showing {Math.min(20, filteredStudents.length)} of {gradebookData.students.length} students
                          </div>
                        )}
                      </div>
                    );
                  })()
                )}
              </div>

              {/* Recent Grades Section */}
              {gradebookData && gradebookData.recent_grades && gradebookData.recent_grades.length > 0 && (
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <Activity className="w-5 h-5 mr-2 text-orange-600" />
                    Recent Grades
                  </h3>
                  <div className="space-y-3">
                    {gradebookData.recent_grades.slice(0, 10).map((grade: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3 flex-1">
                          <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-red-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {grade.student_name?.charAt(0) || 'S'}
                          </div>
                          <div className="flex-1">
                            <p className="text-sm font-medium text-gray-900">{grade.student_name}</p>
                            <p className="text-xs text-gray-500">
                              {grade.assignment_title} - {grade.criterion_name}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-orange-600">
                              {grade.percentage}%
                            </p>
                            <p className="text-xs text-gray-500">
                              {grade.score}/{grade.max_score}
                            </p>
                          </div>
                        </div>
                        <div className="ml-4 text-right">
                          <p className="text-xs text-gray-500">
                            by {grade.graded_by}
                          </p>
                          <span className="text-xs text-gray-400">
                            {new Date(grade.graded_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Messages Tab - Complete Messaging System */}
          {activeTab === 'messages' && (
            <div className="space-y-6">
              <div className="flex gap-6">
                {/* Left Sidebar - Conversations List */}
                <div className="w-1/3 bg-white rounded-xl shadow-sm">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-semibold text-gray-900">Messages</h3>
                      <button
                        onClick={() => setShowComposeMessage(true)}
                        className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        title="Compose New Message"
                      >
                        <Send className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-2 gap-2 mb-4">
                      <button
                        onClick={() => {
                          setMessageRecipientType('all');
                          setShowComposeMessage(true);
                        }}
                        className="px-3 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 text-xs font-medium"
                      >
                        Message All
                      </button>
                      <button
                        onClick={() => {
                          setMessageRecipientType('teachers');
                          setShowComposeMessage(true);
                        }}
                        className="px-3 py-2 bg-green-50 text-green-700 rounded-lg hover:bg-green-100 text-xs font-medium"
                      >
                        All Teachers
                      </button>
                      <button
                        onClick={() => {
                          setMessageRecipientType('parents');
                          setShowComposeMessage(true);
                        }}
                        className="px-3 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 text-xs font-medium"
                      >
                        All Parents
                      </button>
                      <button
                        onClick={() => {
                          setMessageRecipientType('students');
                          setShowComposeMessage(true);
                        }}
                        className="px-3 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 text-xs font-medium"
                      >
                        All Students
                      </button>
                    </div>

                    {/* Search Messages */}
                    <div className="relative mb-3">
                      <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search messages..."
                        value={messageSearchTerm}
                        onChange={(e) => setMessageSearchTerm(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg"
                      />
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex space-x-1 mb-3">
                      {['all', 'unread', 'sent', 'starred'].map((filter: any) => {
                        const unreadCount = messages.filter((m: any) => m.unread && m.type === 'received').length;
                        return (
                          <button
                            key={filter}
                            onClick={() => setMessageFilter(filter)}
                            className={`flex-1 px-2 py-1 text-xs font-medium rounded-lg transition-colors ${
                              messageFilter === filter
                                ? 'bg-blue-100 text-blue-700'
                                : 'text-gray-600 hover:bg-gray-100'
                            }`}
                          >
                            {filter.charAt(0).toUpperCase() + filter.slice(1)}
                            {filter === 'unread' && unreadCount > 0 && (
                              <span className="ml-1 px-1.5 py-0.5 bg-red-500 text-white rounded-full text-xs">
                                {unreadCount}
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Conversations List */}
                  <div className="overflow-y-auto max-h-[600px]">
                    {(() => {
                      // Filter messages based on the filter and search
                      const filteredMessages = messages.filter((msg: any) => {
                        // Apply filter
                        if (messageFilter === 'unread' && !msg.unread) return false;
                        if (messageFilter === 'sent' && msg.type !== 'sent') return false;
                        if (messageFilter === 'starred' && !msg.is_starred) return false;

                        // Apply search
                        if (messageSearchTerm) {
                          const searchLower = messageSearchTerm.toLowerCase();
                          return (
                            msg.subject?.toLowerCase().includes(searchLower) ||
                            msg.body?.toLowerCase().includes(searchLower) ||
                            msg.sender?.display_name?.toLowerCase().includes(searchLower) ||
                            msg.sender?.email?.toLowerCase().includes(searchLower)
                          );
                        }
                        return true;
                      });

                      return filteredMessages.length === 0 ? (
                      <div className="p-8 text-center">
                        <Mail className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500 text-sm">No messages yet</p>
                        <button
                          onClick={() => setShowComposeMessage(true)}
                          className="mt-3 text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          Send your first message
                        </button>
                      </div>
                    ) : (
                      filteredMessages.map((message: any) => (
                        <div
                          key={message.id}
                          onClick={() => {
                            setSelectedMessage(message);
                            if (message.unread && message.type === 'received') {
                              markMessageAsRead(message.id);
                            }
                          }}
                          className={`p-4 border-b cursor-pointer hover:bg-gray-50 transition-colors ${
                            selectedMessage?.id === message.id ? 'bg-blue-50' : ''
                          } ${message.unread ? 'bg-blue-50/50' : ''}`}
                        >
                          <div className="flex items-start justify-between mb-1">
                            <div className="flex items-center">
                              <div className={`w-2 h-2 rounded-full mr-2 ${
                                message.unread ? 'bg-blue-500' : 'bg-transparent'
                              }`} />
                              <h4 className="font-semibold text-sm text-gray-900">
                                {message.sender?.display_name || 'Unknown Sender'}
                              </h4>
                              {message.type === 'sent' && (
                                <span className="ml-2 text-xs text-gray-500">(Sent)</span>
                              )}
                            </div>
                            <span className="text-xs text-gray-500">
                              {new Date(message.created_at || message.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                          <p className="text-sm text-gray-700 font-medium mb-1">
                            {message.subject || 'No Subject'}
                          </p>
                          <p className="text-xs text-gray-500 line-clamp-2">
                            {message.body}
                          </p>
                          <div className="flex items-center mt-2 space-x-2">
                            {message.recipient_type === 'all' && (
                              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded text-xs">
                                All Users
                              </span>
                            )}
                            {message.recipientType === 'teachers' && (
                              <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded text-xs">
                                Teachers
                              </span>
                            )}
                            {message.recipientType === 'parents' && (
                              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded text-xs">
                                Parents
                              </span>
                            )}
                            {message.recipientType === 'students' && (
                              <span className="px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded text-xs">
                                Students
                              </span>
                            )}
                            {message.priority === 'high' && (
                              <span className="px-2 py-0.5 bg-red-100 text-red-700 rounded text-xs">
                                High Priority
                              </span>
                            )}
                          </div>
                        </div>
                      ))
                    );
                    })()}
                  </div>
                </div>

                {/* Right Side - Message Detail */}
                <div className="flex-1 bg-white rounded-xl shadow-sm">
                  {selectedMessage ? (
                    <div className="h-full flex flex-col">
                      {/* Message Header */}
                      <div className="p-4 border-b">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {selectedMessage.subject || 'No Subject'}
                            </h3>
                            <div className="flex items-center space-x-3 mt-1">
                              <span className="text-sm text-gray-600">
                                From: <span className="font-medium">{selectedMessage.sender?.display_name || 'Unknown'}</span>
                              </span>
                              <span className="text-sm text-gray-600">
                                To: <span className="font-medium">
                                  {selectedMessage.recipient_type === 'all' ? 'All Users' :
                                   selectedMessage.recipient_type === 'all_teachers' ? 'All Teachers' :
                                   selectedMessage.recipient_type === 'all_students' ? 'All Students' :
                                   selectedMessage.recipient_type === 'all_parents' ? 'All Parents' :
                                   selectedMessage.recipient_type === 'specific_class' ? 'Class Members' :
                                   'Individual'}
                                </span>
                              </span>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {/* TODO: Implement handleStarMessage(selectedMessage.id) */}}
                              className={`p-2 rounded-lg hover:bg-gray-100 ${
                                selectedMessage.starred ? 'text-yellow-500' : 'text-gray-400'
                              }`}
                            >
                              <Star className="w-4 h-4" fill={selectedMessage.starred ? 'currentColor' : 'none'} />
                            </button>
                            <button
                              onClick={() => handleReplyMessage(selectedMessage)}
                              className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                            >
                              <CornerUpLeft className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteMessage(selectedMessage.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        <div className="mt-2 text-xs text-gray-500">
                          {new Date(selectedMessage.created_at || selectedMessage.createdAt).toLocaleString()}
                        </div>
                      </div>

                      {/* Message Body */}
                      <div className="flex-1 p-6 overflow-y-auto">
                        <div className="prose max-w-none">
                          {selectedMessage.body.split('\n').map((paragraph: any, i: any) => (
                            <p key={i} className="mb-4 text-gray-700">
                              {paragraph}
                            </p>
                          ))}
                        </div>

                        {/* Attachments if any */}
                        {selectedMessage.attachments && selectedMessage.attachments.length > 0 && (
                          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2">
                              Attachments ({selectedMessage.attachments.length})
                            </h4>
                            <div className="space-y-2">
                              {selectedMessage.attachments.map((attachment: any, i: any) => (
                                <div key={i} className="flex items-center space-x-2">
                                  <Paperclip className="w-4 h-4 text-gray-500" />
                                  <a
                                    href={attachment.url}
                                    className="text-sm text-blue-600 hover:underline"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    {attachment.name}
                                  </a>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Reply Box */}
                      {showReplyBox && (
                        <div className="p-4 border-t bg-gray-50">
                          <div className="flex space-x-3">
                            <textarea
                              value={replyMessage}
                              onChange={(e) => setReplyMessage(e.target.value)}
                              placeholder="Type your reply..."
                              className="flex-1 px-3 py-2 border rounded-lg text-sm resize-none"
                              rows={3}
                            />
                            <div className="flex flex-col space-y-2">
                              <button
                                onClick={() => handleSendReply()}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                              >
                                Send Reply
                              </button>
                              <button
                                onClick={() => setShowReplyBox(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="h-full flex items-center justify-center">
                      <div className="text-center">
                        <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <p className="text-gray-500">Select a message to read</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Calendar Tab - Complete Calendar System */}
          {activeTab === 'calendar' && (
            <CalendarSection />
          )}

          {/* Credentials Tab - User Login Management */}
          {activeTab === 'credentials' && (
            <div className="space-y-6">
              {/* Credentials Header */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <Key className="w-7 h-7 text-blue-600" />
                      User Credentials Management
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Automatically generated login credentials for all users
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={sendBulkCredentialEmails}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send Pending Credentials
                    </button>

                    <button
                      onClick={() => loadCredentials()}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-blue-600 font-medium">Total Users</p>
                        <p className="text-2xl font-bold text-blue-900">{credentials.length || 0}</p>
                      </div>
                      <Users className="w-8 h-8 text-blue-500" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-green-600 font-medium">Emails Sent</p>
                        <p className="text-2xl font-bold text-green-900">
                          {credentials.filter((c: any) => c.sent_at).length || 0}
                        </p>
                      </div>
                      <CheckCircle className="w-8 h-8 text-green-500" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-yellow-600 font-medium">Pending</p>
                        <p className="text-2xl font-bold text-yellow-900">
                          {credentials.filter((c: any) => !c.sent_at).length || 0}
                        </p>
                      </div>
                      <Clock className="w-8 h-8 text-yellow-500" />
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Active Users</p>
                        <p className="text-2xl font-bold text-purple-900">
                          {credentials.filter((c: any) => c.last_login).length || 0}
                        </p>
                      </div>
                      <Shield className="w-8 h-8 text-purple-500" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Credentials Table */}
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="p-6 border-b border-gray-200">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-gray-900">User Credentials List</h3>

                    {/* Filter Tabs */}
                    <div className="flex gap-2">
                      {['all', 'student', 'teacher', 'parent'].map((filter: any) => (
                        <button
                          key={filter}
                          onClick={() => setCredentialFilter(filter)}
                          className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                            credentialFilter === filter
                              ? 'bg-blue-100 text-blue-700'
                              : 'text-gray-600 hover:bg-gray-100'
                          }`}
                        >
                          {filter.charAt(0).toUpperCase() + filter.slice(1)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          User
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Password
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Role
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Email Status
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {(credentialFilter === 'all'
                        ? credentials
                        : credentials.filter((c: any) => c.profiles?.role === credentialFilter)
                      ).map((credential: any) => (
                        <tr key={credential.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                credential.profiles?.role === 'student' ? 'bg-blue-100' :
                                credential.profiles?.role === 'teacher' ? 'bg-purple-100' :
                                credential.profiles?.role === 'parent' ? 'bg-green-100' :
                                'bg-gray-100'
                              }`}>
                                <User className={`w-4 h-4 ${
                                  credential.profiles?.role === 'student' ? 'text-blue-600' :
                                  credential.profiles?.role === 'teacher' ? 'text-purple-600' :
                                  credential.profiles?.role === 'parent' ? 'text-green-600' :
                                  'text-gray-600'
                                }`} />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-900">
                                  {credential.profiles?.display_name || 'Unknown User'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  ID: {credential.user_id?.slice(0, 8)}...
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{credential.email}</div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <code className="px-2 py-1 bg-gray-100 rounded text-xs font-mono">
                                {showPasswords ? credential.password : '••••••••••'}
                              </code>
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(credential.password);
                                  showNotification('Password copied to clipboard', 'success');
                                }}
                                className="text-gray-400 hover:text-gray-600"
                              >
                                <Paperclip className="w-4 h-4" />
                              </button>
                            </div>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                              credential.profiles?.role === 'student' ? 'bg-blue-100 text-blue-700' :
                              credential.profiles?.role === 'teacher' ? 'bg-purple-100 text-purple-700' :
                              credential.profiles?.role === 'parent' ? 'bg-green-100 text-green-700' :
                              credential.profiles?.role === 'school' ? 'bg-red-100 text-red-700' :
                              'bg-gray-100 text-gray-700'
                            }`}>
                              {credential.profiles?.role || 'Unknown'}
                            </span>
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            {credential.sent_at ? (
                              <span className="flex items-center text-green-600 text-sm">
                                <CheckCircle className="w-4 h-4 mr-1" />
                                Sent
                              </span>
                            ) : (
                              <span className="flex items-center text-orange-600 text-sm">
                                <Clock className="w-4 h-4 mr-1" />
                                Pending
                              </span>
                            )}
                          </td>

                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => sendCredentialEmail(credential.id)}
                                disabled={sendingEmail[credential.id]}
                                className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                title="Send Email"
                              >
                                {sendingEmail[credential.id] ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <Mail className="w-4 h-4" />
                                )}
                              </button>

                              <button
                                onClick={() => resetCredentialPassword(credential.id)}
                                className="text-orange-600 hover:text-orange-800"
                                title="Reset Password"
                              >
                                <Key className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  {credentials.length === 0 && (
                    <div className="text-center py-12">
                      <Key className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                      <p className="text-gray-500">No credentials generated yet</p>
                      <p className="text-sm text-gray-400 mt-2">
                        Credentials are automatically generated when you add users
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Show/Hide Passwords Toggle */}
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Show passwords in plain text</span>
                  <button
                    onClick={() => setShowPasswords(!showPasswords)}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                      showPasswords ? 'bg-blue-600' : 'bg-gray-200'
                    }`}
                  >
                    <span
                      className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        showPasswords ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Reports Tab - Comprehensive Analytics & Reports */}
          {activeTab === 'reports' && (
            <div className="space-y-6">
              {/* Reports Header with Date Filters */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                      <BarChart3 className="w-7 h-7 text-emerald-600" />
                      Analytics & Reports
                    </h2>
                    <p className="text-sm text-gray-500 mt-1">
                      Comprehensive insights and performance metrics for your school
                    </p>
                  </div>

                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        // Import and use the beautiful HTML report
                        import('@/utils/htmlToPDF').then(({ downloadHTMLReport }) => {
                          const reportDataForExport = {
                            schoolName: schoolInfo?.name,
                            period: reportPeriod === 'today' ? 'Today' : reportPeriod === 'week' ? 'Last 7 Days' : reportPeriod === 'month' ? 'Last 30 Days' : reportPeriod === 'year' ? 'Last Year' : 'Custom Period',
                            students: reportData?.totalStudents || stats.totalStudents || 0,
                            teachers: reportData?.totalTeachers || stats.totalTeachers || 0,
                            classes: reportData?.totalClasses || stats.totalClasses || 0,
                            parents: reportData?.totalParents || stats.totalParents || 0,
                            totalAssignments: reportData?.totalAssignments || 0,
                            completedAssignments: reportData?.completedAssignments || 0,
                            pendingAssignments: reportData?.pendingAssignments || 0,
                            overdueAssignments: reportData?.overdueAssignments || 0,
                            completionRate: reportData?.averageCompletionRate || 0,
                            attendanceRate: reportData?.attendanceRate || 0,
                            attendanceRecords: reportData?.totalAttendanceRecords || 0,
                            teacherData: reportData?.teacherPerformance || [],
                            classData: reportData?.classwiseData || classes || []
                          };
                          downloadHTMLReport(reportDataForExport);
                          showNotification('Opening beautiful report in new window. Use Ctrl+P to save as PDF!', 'success');
                        }).catch(() => {
                          showNotification('Error loading report generator', 'error');
                        });
                      }}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Export PDF
                    </button>
                    <button
                      onClick={refreshData}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      Refresh Data
                    </button>
                  </div>
                </div>

                {/* Date Filter Tabs */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {['today', 'week', 'month', 'year', 'custom'].map((period: any) => (
                    <button
                      key={period}
                      onClick={() => setReportPeriod(period)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        reportPeriod === period
                          ? 'bg-emerald-100 text-emerald-700 border-2 border-emerald-300'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      {period.charAt(0).toUpperCase() + period.slice(1)}
                    </button>
                  ))}
                </div>

                {/* Custom Date Range Picker */}
                {reportPeriod === 'custom' && (
                  <div className="flex gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                      <input
                        type="date"
                        value={customStartDate}
                        onChange={(e) => setCustomStartDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="block text-sm font-medium text-gray-700 mb-1">End Date</label>
                      <input
                        type="date"
                        value={customEndDate}
                        onChange={(e) => setCustomEndDate(e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div className="flex items-end">
                      <button
                        onClick={() => {
                          // Apply custom date filter
                          refreshData();
                        }}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                      >
                        Apply
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Key Metrics Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Total Students */}
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-blue-100 text-sm font-medium">Total Students</p>
                      <p className="text-3xl font-bold mt-2">{reportData?.totalStudents || stats.totalStudents || 0}</p>
                      <p className="text-blue-100 text-xs mt-2">
                        Active students in system
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* Total Teachers */}
                <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-purple-100 text-sm font-medium">Total Teachers</p>
                      <p className="text-3xl font-bold mt-2">{reportData?.totalTeachers || stats.totalTeachers || 0}</p>
                      <p className="text-purple-100 text-xs mt-2">
                        Active teachers in system
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg">
                      <Users className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* Active Assignments */}
                <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-orange-100 text-sm font-medium">Total Assignments</p>
                      <p className="text-3xl font-bold mt-2">{reportData?.totalAssignments || 0}</p>
                      <p className="text-orange-100 text-xs mt-2">
                        <span className="text-yellow-300">{reportData?.averageCompletionRate || 0}%</span> completion rate
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg">
                      <FileText className="w-6 h-6" />
                    </div>
                  </div>
                </div>

                {/* Attendance Rate */}
                <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-green-100 text-sm font-medium">Attendance Rate</p>
                      <p className="text-3xl font-bold mt-2">{reportData?.attendanceRate || 0}%</p>
                      <p className="text-green-100 text-xs mt-2">
                        <span className="text-yellow-300">{reportData?.totalAttendanceRecords || 0}</span> records tracked
                      </p>
                    </div>
                    <div className="bg-white/20 p-3 rounded-lg">
                      <CheckCircle className="w-6 h-6" />
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Metrics */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assignment Analytics */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Analytics</h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Total Assignments</p>
                          <p className="text-sm text-gray-500">All time</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-gray-900">{reportData?.totalAssignments || 0}</p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Completed</p>
                          <p className="text-sm text-gray-500">Successfully finished</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-green-600">{reportData?.completedAssignments || 0}</p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <Clock className="w-5 h-5 text-yellow-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Pending</p>
                          <p className="text-sm text-gray-500">In progress</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-yellow-600">{reportData?.pendingAssignments || 0}</p>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">Overdue</p>
                          <p className="text-sm text-gray-500">Past deadline</p>
                        </div>
                      </div>
                      <p className="text-2xl font-bold text-red-600">{reportData?.overdueAssignments || 0}</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-6">
                    <div className="flex justify-between text-sm text-gray-600 mb-2">
                      <span>Completion Rate</span>
                      <span className="font-medium">{reportData?.averageCompletionRate || 0}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-3 rounded-full transition-all duration-500"
                        style={{ width: `${reportData?.averageCompletionRate || 0}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Class Performance */}
                <div className="bg-white rounded-xl shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Class Performance</h3>

                  <div className="space-y-3">
                    {reportData?.classwiseData && reportData.classwiseData.length > 0 ? (
                      reportData.classwiseData.slice(0, 5).map((cls: any, index: any) => (
                        <div key={index} className="p-3 bg-gray-50 rounded-lg">
                          <div className="flex justify-between items-center mb-2">
                            <p className="font-medium text-gray-900">{cls.className}</p>
                            <span className="text-sm text-gray-500">{cls.students || 0} students</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <div className="flex gap-4 text-sm">
                              <span className="text-gray-600">Assignments: {cls.assignments || 0}</span>
                            </div>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${Math.min((cls.assignments / Math.max(...(reportData.classwiseData.map((c: any) => c.assignments) || [1]))) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-8 text-gray-500">
                        <School className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>No classes data available</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ENHANCED Charts Section - Rebuilt from scratch */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Assignment Trend Chart - ENHANCED */}
                <div className="bg-gradient-to-br from-blue-50 to-white rounded-xl shadow-sm border border-blue-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">📚 Assignment Activity</h3>
                    <span className="text-sm text-blue-600 font-medium">Last 7 Days</span>
                  </div>

                  {/* Total Count Badge */}
                  <div className="mb-4 inline-block">
                    <div className="bg-blue-100 text-blue-700 px-3 py-1 rounded-full text-sm font-semibold">
                      Total: {reportData?.assignmentsTrend?.reduce((sum: number, d: any) => sum + (d.count || 0), 0) || 0} Assignments
                    </div>
                  </div>

                  {/* Enhanced Bar Chart */}
                  <div className="h-64 flex items-end justify-between gap-3 bg-white rounded-lg p-4 border border-gray-100">
                    {(reportData?.assignmentsTrend && reportData.assignmentsTrend.length > 0
                      ? reportData.assignmentsTrend
                      : Array(7).fill({ count: 0, date: '' })
                    ).map((item: any, index: number) => {
                      const maxCount = Math.max(...(reportData?.assignmentsTrend?.map((t: any) => t.count || 0) || [1]), 1);
                      // Ensure minimum visible height for non-zero values
                      const percentage = item.count > 0 ? Math.max((item.count / maxCount) * 100, 10) : 0;
                      const dateLabel = item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `Day ${index + 1}`;

                      return (
                        <div key={index} className="flex-1 flex flex-col items-center group">
                          {/* Count Label Above Bar */}
                          <div className="text-xs font-semibold text-blue-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {item.count > 0 ? item.count : ''}
                          </div>

                          {/* Bar */}
                          <div className="w-full relative">
                            <div
                              className="w-full bg-gradient-to-t from-blue-600 via-blue-500 to-blue-400 rounded-lg transition-all duration-300 group-hover:from-blue-700 group-hover:via-blue-600 group-hover:to-blue-500 shadow-sm hover:shadow-md"
                              style={{
                                height: `${percentage}%`,
                                minHeight: percentage > 0 ? '20px' : '0px'
                              }}
                            />
                          </div>

                          {/* Date Label */}
                          <span className="text-xs text-gray-600 mt-2 font-medium">{dateLabel}</span>

                          {/* Count Below */}
                          <span className="text-xs text-gray-500 mt-1">{item.count || 0}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Attendance Trend Chart - ENHANCED */}
                <div className="bg-gradient-to-br from-green-50 to-white rounded-xl shadow-sm border border-green-100 p-6 hover:shadow-md transition-shadow">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">👥 Attendance Trend</h3>
                    <span className="text-sm text-green-600 font-medium">Last 7 Days</span>
                  </div>

                  {/* Average Rate Badge */}
                  <div className="mb-4 inline-block">
                    <div className="bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-semibold">
                      Average: {reportData?.attendanceTrend && reportData.attendanceTrend.length > 0
                        ? Math.round(reportData.attendanceTrend.reduce((sum: number, d: any) => sum + (d.rate || 0), 0) / reportData.attendanceTrend.length)
                        : 0}% Attendance
                    </div>
                  </div>

                  {/* Enhanced Bar Chart */}
                  <div className="h-64 flex items-end justify-between gap-3 bg-white rounded-lg p-4 border border-gray-100">
                    {(reportData?.attendanceTrend && reportData.attendanceTrend.length > 0
                      ? reportData.attendanceTrend
                      : Array(7).fill({ rate: 0, date: '' })
                    ).map((item: any, index: number) => {
                      // Rate is already a percentage (0-100)
                      const rate = item.rate || 0;
                      // Ensure minimum visible height for non-zero values
                      const percentage = rate > 0 ? Math.max(rate, 10) : 0;
                      const dateLabel = item.date ? new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : `Day ${index + 1}`;

                      return (
                        <div key={index} className="flex-1 flex flex-col items-center group">
                          {/* Rate Label Above Bar */}
                          <div className="text-xs font-semibold text-green-600 mb-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {rate > 0 ? `${rate}%` : ''}
                          </div>

                          {/* Bar */}
                          <div className="w-full relative">
                            <div
                              className="w-full bg-gradient-to-t from-green-600 via-green-500 to-green-400 rounded-lg transition-all duration-300 group-hover:from-green-700 group-hover:via-green-600 group-hover:to-green-500 shadow-sm hover:shadow-md"
                              style={{
                                height: `${percentage}%`,
                                minHeight: percentage > 0 ? '20px' : '0px'
                              }}
                            />
                          </div>

                          {/* Date Label */}
                          <span className="text-xs text-gray-600 mt-2 font-medium">{dateLabel}</span>

                          {/* Rate Below */}
                          <span className="text-xs text-gray-500 mt-1">{rate}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Teacher Performance Table */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Teacher Performance</h3>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-3 px-4 font-medium text-gray-700">Teacher Name</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Classes</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Assignments Created</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Completion Rate</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Avg Response Time</th>
                        <th className="text-center py-3 px-4 font-medium text-gray-700">Performance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData?.teacherPerformance && reportData.teacherPerformance.length > 0 ? (
                        reportData.teacherPerformance.slice(0, 5).map((teacher: any) => (
                          <tr key={teacher.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div className="flex items-center gap-3">
                                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                  <User className="w-4 h-4 text-purple-600" />
                                </div>
                                <span className="font-medium text-gray-900">{teacher.name}</span>
                              </div>
                            </td>
                            <td className="text-center py-3 px-4 text-gray-600">
                              {teacher.class_count || 0}
                            </td>
                            <td className="text-center py-3 px-4 text-gray-600">
                              {teacher.assignmentsCreated || 0}
                            </td>
                            <td className="text-center py-3 px-4">
                              <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                                {teacher.completionRate || 0}%
                              </span>
                            </td>
                            <td className="text-center py-3 px-4 text-gray-600">
                              {teacher.response_time || 'N/A'}
                            </td>
                            <td className="text-center py-3 px-4">
                              <span className="text-gray-500 text-sm">
                                {teacher.rating ? `${teacher.rating}/5` : 'No ratings yet'}
                              </span>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={6} className="text-center py-8 text-gray-500">
                            No teacher data available
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Export Options */}
              <div className="bg-gradient-to-r from-emerald-50 to-blue-50 rounded-xl p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">Export Report</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      Download comprehensive report for the selected period
                    </p>
                  </div>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        // Export as CSV
                        const csvContent = [
                          ['School Report'],
                          ['School:', schoolInfo?.name || 'N/A'],
                          ['Period:', reportPeriod === 'today' ? 'Today' : reportPeriod === 'week' ? 'Last 7 Days' : reportPeriod === 'month' ? 'Last 30 Days' : reportPeriod === 'year' ? 'Last Year' : 'Custom Period'],
                          ['Generated:', new Date().toLocaleString()],
                          [],
                          ['Overview Metrics'],
                          ['Total Students', reportData?.totalStudents || 0],
                          ['Total Teachers', reportData?.totalTeachers || 0],
                          ['Total Classes', reportData?.totalClasses || 0],
                          ['Total Parents', reportData?.totalParents || 0],
                          [],
                          ['Assignment Metrics'],
                          ['Total Assignments', reportData?.totalAssignments || 0],
                          ['Completed Assignments', reportData?.completedAssignments || 0],
                          ['Pending Assignments', reportData?.pendingAssignments || 0],
                          ['Overdue Assignments', reportData?.overdueAssignments || 0],
                          ['Average Completion Rate', `${reportData?.averageCompletionRate || 0}%`],
                          [],
                          ['Attendance Metrics'],
                          ['Total Attendance Records', reportData?.totalAttendanceRecords || 0],
                          ['Present Count', reportData?.presentCount || 0],
                          ['Absent Count', reportData?.absentCount || 0],
                          ['Attendance Rate', `${reportData?.attendanceRate || 0}%`],
                          [],
                          ['Class Performance'],
                          ['Class Name', 'Students', 'Assignments'],
                          ...(reportData?.classwiseData || []).map((cls: any) => [
                            cls.className,
                            cls.students || 0,
                            cls.assignments || 0
                          ]),
                          [],
                          ['Teacher Performance'],
                          ['Teacher Name', 'Classes', 'Assignments Created', 'Completion Rate'],
                          ...(reportData?.teacherPerformance || []).map((teacher: any) => [
                            teacher.name,
                            teacher.class_count || 0,
                            teacher.assignmentsCreated || 0,
                            `${teacher.completionRate || 0}%`
                          ])
                        ].map(row => row.join(',')).join('\n');

                        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
                        const link = document.createElement('a');
                        const url = URL.createObjectURL(blob);
                        link.setAttribute('href', url);
                        link.setAttribute('download', `school_report_${new Date().toISOString().split('T')[0]}.csv`);
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        showNotification('CSV report downloaded successfully!', 'success');
                      }}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Export CSV
                    </button>
                    <button
                      onClick={() => {
                        // Export as Excel (simple HTML table-based approach)
                        const excelContent = `
                          <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
                          <head><meta charset="utf-8"><title>School Report</title></head>
                          <body>
                            <table>
                              <tr><td colspan="4"><b>School Report</b></td></tr>
                              <tr><td>School:</td><td>${schoolInfo?.name || 'N/A'}</td></tr>
                              <tr><td>Period:</td><td>${reportPeriod === 'today' ? 'Today' : reportPeriod === 'week' ? 'Last 7 Days' : reportPeriod === 'month' ? 'Last 30 Days' : reportPeriod === 'year' ? 'Last Year' : 'Custom Period'}</td></tr>
                              <tr><td>Generated:</td><td>${new Date().toLocaleString()}</td></tr>
                              <tr><td colspan="4"></td></tr>
                              <tr><td colspan="4"><b>Overview Metrics</b></td></tr>
                              <tr><td>Total Students</td><td>${reportData?.totalStudents || 0}</td></tr>
                              <tr><td>Total Teachers</td><td>${reportData?.totalTeachers || 0}</td></tr>
                              <tr><td>Total Classes</td><td>${reportData?.totalClasses || 0}</td></tr>
                              <tr><td>Total Parents</td><td>${reportData?.totalParents || 0}</td></tr>
                              <tr><td colspan="4"></td></tr>
                              <tr><td colspan="4"><b>Assignment Metrics</b></td></tr>
                              <tr><td>Total Assignments</td><td>${reportData?.totalAssignments || 0}</td></tr>
                              <tr><td>Completed Assignments</td><td>${reportData?.completedAssignments || 0}</td></tr>
                              <tr><td>Pending Assignments</td><td>${reportData?.pendingAssignments || 0}</td></tr>
                              <tr><td>Overdue Assignments</td><td>${reportData?.overdueAssignments || 0}</td></tr>
                              <tr><td>Average Completion Rate</td><td>${reportData?.averageCompletionRate || 0}%</td></tr>
                              <tr><td colspan="4"></td></tr>
                              <tr><td colspan="4"><b>Attendance Metrics</b></td></tr>
                              <tr><td>Total Attendance Records</td><td>${reportData?.totalAttendanceRecords || 0}</td></tr>
                              <tr><td>Present Count</td><td>${reportData?.presentCount || 0}</td></tr>
                              <tr><td>Absent Count</td><td>${reportData?.absentCount || 0}</td></tr>
                              <tr><td>Attendance Rate</td><td>${reportData?.attendanceRate || 0}%</td></tr>
                              <tr><td colspan="4"></td></tr>
                              <tr><td colspan="4"><b>Class Performance</b></td></tr>
                              <tr><th>Class Name</th><th>Students</th><th>Assignments</th></tr>
                              ${(reportData?.classwiseData || []).map((cls: any) =>
                                `<tr><td>${cls.className}</td><td>${cls.students || 0}</td><td>${cls.assignments || 0}</td></tr>`
                              ).join('')}
                              <tr><td colspan="4"></td></tr>
                              <tr><td colspan="4"><b>Teacher Performance</b></td></tr>
                              <tr><th>Teacher Name</th><th>Classes</th><th>Assignments Created</th><th>Completion Rate</th></tr>
                              ${(reportData?.teacherPerformance || []).map((teacher: any) =>
                                `<tr><td>${teacher.name}</td><td>${teacher.class_count || 0}</td><td>${teacher.assignmentsCreated || 0}</td><td>${teacher.completionRate || 0}%</td></tr>`
                              ).join('')}
                            </table>
                          </body>
                          </html>
                        `;

                        const blob = new Blob([excelContent], { type: 'application/vnd.ms-excel' });
                        const link = document.createElement('a');
                        const url = URL.createObjectURL(blob);
                        link.setAttribute('href', url);
                        link.setAttribute('download', `school_report_${new Date().toISOString().split('T')[0]}.xls`);
                        link.style.visibility = 'hidden';
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                        showNotification('Excel report downloaded successfully!', 'success');
                      }}
                      className="px-4 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                    >
                      <FileText className="w-4 h-4" />
                      Export Excel
                    </button>
                    <button
                      onClick={() => {
                        // Generate Beautiful HTML Report
                        import('@/utils/htmlToPDF').then(({ downloadHTMLReport }) => {
                          const reportDataForPDF = {
                            schoolName: schoolInfo?.name,
                            period: reportPeriod === 'today' ? 'Today' : reportPeriod === 'week' ? 'Last 7 Days' : reportPeriod === 'month' ? 'Last 30 Days' : reportPeriod === 'year' ? 'Last Year' : 'Custom Period',
                            students: reportData?.totalStudents || stats.totalStudents || 0,
                            teachers: reportData?.totalTeachers || stats.totalTeachers || 0,
                            classes: reportData?.totalClasses || stats.totalClasses || 0,
                            parents: reportData?.totalParents || stats.totalParents || 0,
                            totalAssignments: reportData?.totalAssignments || 0,
                            completedAssignments: reportData?.completedAssignments || 0,
                            pendingAssignments: reportData?.pendingAssignments || 0,
                            overdueAssignments: reportData?.overdueAssignments || 0,
                            completionRate: reportData?.averageCompletionRate || 0,
                            attendanceRate: reportData?.attendanceRate || 0,
                            attendanceRecords: reportData?.totalAttendanceRecords || 0,
                            teacherData: reportData?.teacherPerformance || [],
                            classData: reportData?.classwiseData || classes || []
                          };
                          downloadHTMLReport(reportDataForPDF);
                          showNotification('✅ Beautiful colored report opened! Press Ctrl+P to save as PDF', 'success');
                        }).catch(() => {
                          showNotification('Error generating report', 'error');
                        });
                      }}
                      className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors flex items-center gap-2"
                    >
                      <Download className="w-4 h-4" />
                      Generate PDF Report
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Settings Tab - School Configuration & Settings */}
          {activeTab === 'settings' && (
            <div className="p-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Settings Section Test</h2>
              <p className="text-gray-600 mb-4">If you see this, the tab is working!</p>
              <SettingsSection />
            </div>
          )}
        </div>
      </div>

      {/* ALL MODALS CONTINUE HERE */}
      {/* Add Student Modal */}
      {showAddModal && addModalType === 'student' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Student</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleAddStudent({
                name: formData.get('name'),
                email: formData.get('email'),
                age: parseInt(formData.get('age') as string),
                grade: formData.get('grade'),
                dob: formData.get('dob'),
                gender: formData.get('gender'),
                phone: formData.get('phone')
              });
            }}>
              <div className="grid grid-cols-2 gap-4">
                <input
                  name="name"
                  type="text"
                  placeholder="Student Name *"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email *"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <input
                  name="age"
                  type="number"
                  placeholder="Age *"
                  className="w-full px-3 py-2 border rounded-lg"
                  min="5"
                  max="25"
                  required
                />
                <input
                  name="grade"
                  type="text"
                  placeholder="Grade (e.g., 6th Grade) *"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <select
                  name="gender"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                >
                  <option value="">Select Gender *</option>
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                </select>
                <input
                  name="phone"
                  type="tel"
                  placeholder="Phone"
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  name="dob"
                  type="date"
                  placeholder="Date of Birth"
                  className="w-full px-3 py-2 border rounded-lg"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Add Student
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {showAddModal && addModalType === 'teacher' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Teacher</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);
              handleAddTeacher({
                name: formData.get('name'),
                email: formData.get('email'),
                password: formData.get('password'),
                subject: formData.get('subject'),
                qualification: formData.get('qualification'),
                experience: formData.get('experience') ? parseInt(formData.get('experience') as string) : null,
                phone: formData.get('phone'),
                address: formData.get('address'),
                bio: formData.get('bio'),
                classIds: Array.from(formData.getAll('assignedClasses'))
              });
            }}>
              <div className="space-y-4">
                <input
                  name="name"
                  type="text"
                  placeholder="Teacher Name"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <input
                  name="email"
                  type="email"
                  placeholder="Email *"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <input
                  name="password"
                  type="password"
                  placeholder="Password *"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                  minLength={8}
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    name="subject"
                    type="text"
                    placeholder="Subject (e.g., Quran, Tajweed)"
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    name="qualification"
                    type="text"
                    placeholder="Qualification"
                    className="px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    name="experience"
                    type="number"
                    placeholder="Years of Experience"
                    className="px-3 py-2 border rounded-lg"
                    min="0"
                    max="50"
                  />
                  <input
                    name="phone"
                    type="tel"
                    placeholder="Phone Number"
                    className="px-3 py-2 border rounded-lg"
                  />
                </div>
                <input
                  name="address"
                  type="text"
                  placeholder="Address"
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <textarea
                  name="bio"
                  placeholder="Bio (Optional)"
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Classes (Optional)
                  </label>
                  <select
                    name="assignedClasses"
                    multiple
                    className="w-full px-3 py-2 border rounded-lg"
                    size={Math.min(classes.length, 5)}
                  >
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>
                        {cls.name} {cls.room ? `(${cls.room})` : ''}
                      </option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Hold Ctrl/Cmd to select multiple classes
                  </p>
                </div>
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Add Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Parent Modal */}
      {showAddParent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Add New Parent</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);

              // Send all fields including phone and address (now in database)
              handleAddParent({
                name: formData.get('name'),
                email: formData.get('email'),
                phone: formData.get('phone'),
                address: formData.get('address'),
                studentIds: selectedStudentsForParent.map((s: any) => s.id)
              });

              // Reset selections after submit
              setSelectedStudentsForParent([]);
              setParentModalStudentSearch('');
            }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input
                    name="name"
                    type="text"
                    placeholder="Parent Name *"
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                  <input
                    name="email"
                    type="email"
                    placeholder="Email *"
                    className="w-full px-3 py-2 border rounded-lg"
                    required
                  />
                  <input
                    name="phone"
                    type="tel"
                    placeholder="Phone Number"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    name="address"
                    type="text"
                    placeholder="Home Address"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                {/* Enhanced Student Selection with Search */}
                {students.length > 0 && (
                  <div className="border rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Link to Students:</p>

                    {/* Search Input */}
                    <div className="relative mb-3">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search students by name..."
                        value={parentModalStudentSearch}
                        onChange={(e) => setParentModalStudentSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                      />
                    </div>

                    {/* Selected Students Display */}
                    {selectedStudentsForParent.length > 0 && (
                      <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                        <p className="text-xs font-medium text-blue-900 mb-1">Selected Students ({selectedStudentsForParent.length}):</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedStudentsForParent.map((student: any) => (
                            <span
                              key={student.id}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                            >
                              {student.name}
                              <button
                                type="button"
                                onClick={() => setSelectedStudentsForParent((prev: any) =>
                                  prev.filter((s: any) => s.id !== student.id)
                                )}
                                className="hover:text-blue-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Filtered Student List */}
                    <div className="space-y-1 max-h-40 overflow-y-auto border rounded p-2">
                      {students
                        .filter((student: any) =>
                          student.name.toLowerCase().includes(parentModalStudentSearch.toLowerCase()) ||
                          student.email.toLowerCase().includes(parentModalStudentSearch.toLowerCase())
                        )
                        .slice(0, 50) // Limit display to 50 students at a time
                        .map((student: any) => {
                          const isSelected = selectedStudentsForParent.some((s: any) => s.id === student.id);
                          return (
                            <label
                              key={student.id}
                              className={`flex items-center space-x-2 cursor-pointer p-2 rounded transition-colors ${
                                isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStudentsForParent((prev: any) => [...prev, student]);
                                  } else {
                                    setSelectedStudentsForParent((prev: any) =>
                                      prev.filter((s: any) => s.id !== student.id)
                                    );
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                                <p className="text-xs text-gray-500 truncate">{student.email}</p>
                              </div>
                              {student.grade && (
                                <span className="text-xs bg-gray-100 px-2 py-1 rounded">{student.grade}</span>
                              )}
                            </label>
                          );
                        })}

                      {students.filter((student: any) =>
                        student.name.toLowerCase().includes(parentModalStudentSearch.toLowerCase()) ||
                        student.email.toLowerCase().includes(parentModalStudentSearch.toLowerCase())
                      ).length === 0 && (
                        <p className="text-sm text-gray-500 text-center py-2">No students found</p>
                      )}

                      {students.filter((student: any) =>
                        student.name.toLowerCase().includes(parentModalStudentSearch.toLowerCase()) ||
                        student.email.toLowerCase().includes(parentModalStudentSearch.toLowerCase())
                      ).length > 50 && (
                        <p className="text-xs text-gray-500 text-center py-1">
                          Showing first 50 results. Type more to narrow search.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddParent(false);
                    setSelectedStudentsForParent([]);
                    setParentModalStudentSearch('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Add Parent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quran Homework Creation Modal */}
      {showAddModal && addModalType === 'quran-homework' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-1">Create Quran Homework</h2>
            <p className="text-sm text-gray-500 mb-4">Assign Quran memorization or revision with highlighting support</p>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);

              const homeworkData = {
                student_id: formData.get('student_id'),
                surah: formData.get('surah'),
                startVerse: formData.get('startVerse'),
                endVerse: formData.get('endVerse'),
                type: formData.get('type'),
                dueDate: formData.get('dueDate')
              };

              handleCreateHomework(homeworkData);
            }}>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Class
                    </label>
                    <select
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      onChange={(e) => {
                        // Load students for this class
                      }}
                    >
                      <option value="">Select a class...</option>
                      {classes.map((cls: any) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} - {cls.grade}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Student
                    </label>
                    <select
                      name="student_id"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    >
                      <option value="">Select a student...</option>
                      {students.map((student: any) => (
                        <option key={student.id} value={student.id}>
                          {student.name} - {student.grade}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Surah
                  </label>
                  <select
                    name="surah"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select Surah...</option>
                    <option value="Al-Fatiha">1. Al-Fatiha</option>
                    <option value="Al-Baqarah">2. Al-Baqarah</option>
                    <option value="Al-Imran">3. Al-Imran</option>
                    <option value="An-Nisa">4. An-Nisa</option>
                    <option value="Al-Maidah">5. Al-Maidah</option>
                    {/* Add more Surahs as needed */}
                    <option value="An-Nas">114. An-Nas</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Verse
                    </label>
                    <input
                      name="startVerse"
                      type="number"
                      min="1"
                      placeholder="e.g., 1"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Verse
                    </label>
                    <input
                      name="endVerse"
                      type="number"
                      min="1"
                      placeholder="e.g., 7"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Homework Type
                  </label>
                  <div className="flex space-x-4">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="memorization"
                        className="mr-2"
                        defaultChecked
                      />
                      <span className="text-sm">📖 New Memorization</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="revision"
                        className="mr-2"
                      />
                      <span className="text-sm">🔄 Revision</span>
                    </label>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date
                  </label>
                  <input
                    name="dueDate"
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div className="bg-green-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-green-900 mb-2">Highlighting Guidelines</h4>
                  <div className="space-y-1 text-xs text-green-700">
                    <p>• Green highlights will be used for correct memorization</p>
                    <p>• Yellow highlights for minor mistakes (harakat)</p>
                    <p>• Red highlights for major mistakes</p>
                    <p>• Students can practice and teachers can review with highlights</p>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Create Homework
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assignment Creation Modal */}
      {showAddModal && addModalType === 'assignment' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              {editingAssignment ? 'Edit Assignment' : 'Create New Assignment'}
            </h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);

              const assignmentData = {
                title: formData.get('title'),
                description: formData.get('description'),
                student_id: formData.get('student_id'),
                due_at: formData.get('due_at'),
                class_id: formData.get('class_id')
              };

              if (editingAssignment) {
                // Handle update
                handleUpdateAssignment(editingAssignment.id, assignmentData);
              } else {
                handleCreateAssignment(assignmentData);
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Assignment Title
                  </label>
                  <input
                    name="title"
                    type="text"
                    placeholder="e.g., Surah Al-Fatiha Memorization"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingAssignment?.title}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    placeholder="Describe the assignment requirements..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    defaultValue={editingAssignment?.description}
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Class
                    </label>
                    <select
                      name="class_id"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      defaultValue={editingAssignment?.class_id}
                      onChange={(e) => {
                        // When class changes, update student dropdown
                        const selectedClassId = e.target.value;
                        // You can load students for this class here
                      }}
                      required
                    >
                      <option value="">Select a class...</option>
                      {classes.map((cls: any) => (
                        <option key={cls.id} value={cls.id}>
                          {cls.name} - {cls.grade}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select Student
                    </label>
                    <select
                      name="student_id"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      defaultValue={editingAssignment?.student_id}
                      required
                    >
                      <option value="">Select a student...</option>
                      {students.map((student: any) => (
                        <option key={student.id} value={student.id}>
                          {student.name} - {student.grade}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Due Date & Time
                  </label>
                  <input
                    name="due_at"
                    type="datetime-local"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    defaultValue={editingAssignment?.due_at?.slice(0, 16)}
                    required
                  />
                </div>

                <div className="bg-blue-50 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-900 mb-2">Assignment Type</h4>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="memorization"
                        className="mr-2"
                        defaultChecked
                      />
                      <span className="text-sm">Memorization</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="revision"
                        className="mr-2"
                      />
                      <span className="text-sm">Revision</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="tajweed"
                        className="mr-2"
                      />
                      <span className="text-sm">Tajweed Practice</span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="radio"
                        name="type"
                        value="written"
                        className="mr-2"
                      />
                      <span className="text-sm">Written Test</span>
                    </label>
                  </div>
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingAssignment(null);
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  {editingAssignment ? 'Update Assignment' : 'Create Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Target Creation Modal */}
      {showAddModal && addModalType === 'target' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Set Learning Target</h2>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);

              const targetData = {
                id: Date.now().toString(),
                title: formData.get('title'),
                description: formData.get('description'),
                studentName: students.find((s: any) => s.id === formData.get('student_id'))?.name || 'Unknown',
                student_id: formData.get('student_id'),
                deadline: formData.get('deadline'),
                progress: 0
              };

              setTargets((prev: any) => [...prev, targetData]);
              showNotification('Learning target created successfully', 'success');
              setShowAddModal(false);
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Title
                  </label>
                  <input
                    name="title"
                    type="text"
                    placeholder="e.g., Complete Juz 30 Memorization"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    placeholder="Describe the learning goal..."
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    rows={3}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Select Student
                  </label>
                  <select
                    name="student_id"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  >
                    <option value="">Select a student...</option>
                    {students.map((student: any) => (
                      <option key={student.id} value={student.id}>
                        {student.name} - {student.grade}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Target Deadline
                  </label>
                  <input
                    name="deadline"
                    type="date"
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500"
                    required
                  />
                </div>
              </div>

              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                >
                  Set Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Parent Modal */}
      {showViewParent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-semibold text-gray-900">Parent Details</h2>
                <p className="text-sm text-gray-500 mt-1">Complete information about the parent</p>
              </div>
              <button
                onClick={() => {
                  setShowViewParent(null);
                  setParentLinkedStudents([]);
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Parent Information Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Full Name</label>
                  <p className="text-lg font-medium text-gray-900 mt-1">{showViewParent.name}</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Email Address</label>
                  <p className="text-gray-700 mt-1 flex items-center">
                    <Mail className="w-4 h-4 mr-2 text-gray-400" />
                    {showViewParent.email}
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Phone Number</label>
                  <p className="text-gray-700 mt-1 flex items-center">
                    <Phone className="w-4 h-4 mr-2 text-gray-400" />
                    {showViewParent.phone || 'Not provided'}
                  </p>
                </div>
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase tracking-wider">Address</label>
                  <p className="text-gray-700 mt-1 flex items-center">
                    <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                    {showViewParent.address || 'Not provided'}
                  </p>
                </div>
              </div>
            </div>

            {/* Linked Children Section */}
            <div className="border-t pt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                <Users className="w-5 h-5 mr-2 text-gray-400" />
                Linked Children ({parentLinkedStudents.length})
              </h3>
              {parentLinkedStudents.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {parentLinkedStudents.map((student: any) => (
                    <div key={student.id} className="bg-gray-50 rounded-lg p-3 flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                        <User className="w-5 h-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900">{student.name}</p>
                        <p className="text-sm text-gray-500">{student.email}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 bg-gray-50 rounded-lg">
                  <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No children linked to this parent</p>
                  <p className="text-sm text-gray-400 mt-1">You can link children by editing the parent</p>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 mt-6 pt-6 border-t">
              <button
                onClick={() => {
                  setShowViewParent(null);
                  setParentLinkedStudents([]);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => {
                  setShowEditParent(showViewParent);
                  setShowViewParent(null);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                <Edit className="w-4 h-4 inline mr-2" />
                Edit Parent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Parent Modal */}
      {showEditParent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Parent</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);

              try {
                // FIXED: Use API endpoint with Bearer token instead of direct Supabase queries
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                  showNotification('Please login as school administrator', 'error');
                  return;
                }

                const response = await fetch('/api/school/update-parent', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                  },
                  body: JSON.stringify({
                    parentId: showEditParent.id,
                    userId: showEditParent.user_id,
                    name: formData.get('name'),
                    phone: formData.get('phone') || null,
                    address: formData.get('address') || null,
                    studentIds: selectedStudentsForParent.map((s: any) => s.id)
                  })
                });

                const data = await response.json();

                if (!response.ok) {
                  throw new Error(data.error || 'Failed to update parent');
                }

                if (data.success) {
                  showNotification(
                    `Parent "${formData.get('name')}" updated successfully!`,
                    'success',
                    3000,
                    'All changes have been saved'
                  );

                  setShowEditParent(null);
                  setSelectedStudentsForParent([]);
                  setParentModalStudentSearch('');
                  refreshData();
                } else {
                  throw new Error(data.error || 'Unknown error occurred');
                }
              } catch (error: any) {
                console.error('Error updating parent:', error);
                showNotification(
                  'Failed to update parent',
                  'error',
                  5000,
                  error.message
                );
              }
            }}>
              <div className="space-y-4">
                <input
                  name="name"
                  type="text"
                  defaultValue={showEditParent.name}
                  placeholder="Parent Name"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <input
                  name="email"
                  type="email"
                  defaultValue={showEditParent.email}
                  placeholder="Email"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <input
                  name="phone"
                  type="tel"
                  defaultValue={showEditParent.phone || ''}
                  placeholder="Phone Number"
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <input
                  name="address"
                  type="text"
                  defaultValue={showEditParent.address || ''}
                  placeholder="Home Address"
                  className="w-full px-3 py-2 border rounded-lg"
                />

                {/* Student Selection with Search */}
                {students.length > 0 && (
                  <div className="border rounded-lg p-3">
                    <p className="text-sm font-medium text-gray-700 mb-2">Link to Students:</p>

                    {/* Search Input */}
                    <div className="relative mb-3">
                      <Search className="w-4 h-4 absolute left-3 top-3 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search students by name..."
                        value={parentModalStudentSearch}
                        onChange={(e) => setParentModalStudentSearch(e.target.value)}
                        className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm"
                      />
                    </div>

                    {/* Selected Students Display */}
                    {selectedStudentsForParent.length > 0 && (
                      <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                        <p className="text-xs font-medium text-blue-900 mb-1">Selected Students ({selectedStudentsForParent.length}):</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedStudentsForParent.map((student: any) => (
                            <span
                              key={student.id}
                              className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs"
                            >
                              {student.name}
                              <button
                                type="button"
                                onClick={() => setSelectedStudentsForParent((prev: any) =>
                                  prev.filter((s: any) => s.id !== student.id)
                                )}
                                className="hover:text-blue-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Filtered Student List */}
                    <div className="space-y-1 max-h-40 overflow-y-auto border rounded p-2">
                      {students
                        .filter((student: any) =>
                          student.name.toLowerCase().includes(parentModalStudentSearch.toLowerCase()) ||
                          student.email.toLowerCase().includes(parentModalStudentSearch.toLowerCase())
                        )
                        .slice(0, 50)
                        .map((student: any) => {
                          const isSelected = selectedStudentsForParent.some((s: any) => s.id === student.id);
                          return (
                            <label
                              key={student.id}
                              className={`flex items-center space-x-2 cursor-pointer p-2 rounded transition-colors ${
                                isSelected ? 'bg-blue-50 hover:bg-blue-100' : 'hover:bg-gray-50'
                              }`}
                            >
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedStudentsForParent((prev: any) => [...prev, student]);
                                  } else {
                                    setSelectedStudentsForParent((prev: any) =>
                                      prev.filter((s: any) => s.id !== student.id)
                                    );
                                  }
                                }}
                                className="rounded border-gray-300"
                              />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-900 truncate">{student.name}</p>
                                <p className="text-xs text-gray-500 truncate">{student.email}</p>
                              </div>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditParent(null);
                    setSelectedStudentsForParent([]);
                    setParentModalStudentSearch('');
                  }}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Update Parent
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Upload Modal */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Bulk Upload {bulkUploadType === 'students' ? 'Students' : 'Teachers'}
            </h2>

            {/* Download Template Section */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-blue-900 mb-1">Need a template?</h3>
                  <p className="text-sm text-blue-700">
                    Download our CSV template with the correct format
                  </p>
                </div>
                <button
                  onClick={() => {
                    // Create and download CSV template
                    const template = bulkUploadType === 'students'
                      ? 'Name,Email,Age,Grade,Gender,Phone,Parent Name\n' +
                        'John Doe,john@example.com,12,6th Grade,Male,123-456-7890,Jane Doe\n' +
                        'Mary Smith,mary@example.com,13,7th Grade,Female,098-765-4321,Bob Smith'
                      : 'Name,Email,Age,Gender,Subject,Phone,Qualification,Experience\n' +
                        'Ahmed Ali,ahmed@example.com,35,Male,Quran Memorization,123-456-7890,Ijazah in Quran,5 years\n' +
                        'Fatima Khan,fatima@example.com,28,Female,Tajweed,098-765-4321,Masters in Islamic Studies,3 years';

                    const blob = new Blob([template], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `${bulkUploadType}_template.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Template</span>
                </button>
              </div>
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600 mb-4">
                Drop your CSV file here or click to browse
              </p>
              <input
                type="file"
                accept=".csv"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handleBulkUpload(file, bulkUploadType);
                  }
                }}
                className="hidden"
                id="bulk-upload-input"
              />
              <label
                htmlFor="bulk-upload-input"
                className="inline-block px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 cursor-pointer"
              >
                Choose File
              </label>
            </div>

            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold text-gray-700">CSV Format Required:</p>
              <div className="bg-gray-50 rounded p-3">
                <p className="text-xs font-mono text-gray-600">
                  {bulkUploadType === 'students'
                    ? 'Name, Email, Age, Grade, Gender, Address, Phone, Parent Name'
                    : 'Name, Email, Age, Gender, Subject, Phone, Qualification, Experience'}
                </p>
              </div>
              <p className="text-xs text-gray-500 mt-2">
                ⚠️ Make sure to include column headers in the first row
              </p>
              <p className="text-xs text-gray-500 mt-1">
                💡 Tip: Do not include spaces in email addresses. Use format: john@example.com
              </p>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={() => setShowBulkUpload(false)}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Upload Progress Modal */}
      {showBulkProgress && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {bulkProgress.isComplete ? 'Upload Complete!' : 'Uploading Students...'}
            </h2>

            {/* Progress Bar */}
            {!bulkProgress.isComplete && (
              <div className="mb-6">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Progress: {bulkProgress.processed} / {bulkProgress.total}</span>
                  <span>{Math.round((bulkProgress.processed / bulkProgress.total) * 100)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-3">
                  <div
                    className="bg-emerald-600 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${(bulkProgress.processed / bulkProgress.total) * 100}%` }}
                  />
                </div>
                <p className="mt-2 text-sm text-gray-600">{bulkProgress.current}</p>
              </div>
            )}

            {/* Statistics */}
            <div className="grid grid-cols-4 gap-4 mb-6">
              <div className="bg-green-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-green-600">{bulkProgress.success}</p>
                <p className="text-xs text-green-700">Success</p>
              </div>
              <div className="bg-red-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-red-600">{bulkProgress.failed}</p>
                <p className="text-xs text-red-700">Failed</p>
              </div>
              <div className="bg-yellow-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-yellow-600">{bulkProgress.skipped}</p>
                <p className="text-xs text-yellow-700">Skipped</p>
              </div>
              <div className="bg-blue-50 rounded-lg p-3 text-center">
                <p className="text-2xl font-bold text-blue-600">{bulkProgress.total}</p>
                <p className="text-xs text-blue-700">Total</p>
              </div>
            </div>

            {/* Download Credentials Button - Only show when complete */}
            {bulkProgress.isComplete && bulkProgress.credentials.length > 0 && (
              <div className="mb-4">
                <button
                  onClick={() => {
                    // Generate CSV of credentials
                    const csvContent = 'Name,Email,Password\n' +
                      bulkProgress.credentials.map((c: any) => `${c.name},${c.email},${c.password}`).join('\n');
                    const blob = new Blob([csvContent], { type: 'text/csv' });
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `student_credentials_${new Date().toISOString().split('T')[0]}.csv`;
                    a.click();
                  }}
                  className="w-full px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  <Download className="w-4 h-4 inline mr-2" />
                  Download Credentials CSV
                </button>
              </div>
            )}

            {/* Close Button - Only enabled when complete */}
            <div className="flex justify-end">
              <button
                onClick={() => {
                  if (bulkProgress.isComplete) {
                    setShowBulkProgress(false);
                    setBulkProgress({
                      total: 0,
                      processed: 0,
                      success: 0,
                      failed: 0,
                      skipped: 0,
                      current: '',
                      credentials: [],
                      isComplete: false
                    });
                  }
                }}
                disabled={!bulkProgress.isComplete}
                className={`px-4 py-2 rounded-lg ${
                  bulkProgress.isComplete
                    ? 'bg-gray-600 text-white hover:bg-gray-700'
                    : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                }`}
              >
                {bulkProgress.isComplete ? 'Close' : 'Processing...'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Duplicate Review Modal - Improved Version */}
      {showDuplicateReview && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Review Duplicate Students</h2>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
              <div className="flex">
                <AlertCircle className="w-5 h-5 text-yellow-600 mr-2 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="font-medium text-yellow-900">
                    {duplicates.length} duplicate{duplicates.length > 1 ? 's' : ''} found, {uploadedData.length} new student{uploadedData.length !== 1 ? 's' : ''} to add
                  </h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Choose how to proceed with the upload:
                  </p>
                </div>
              </div>
            </div>

            {/* Duplicate Students List */}
            <div className="mb-6">
              <h3 className="font-medium text-gray-900 mb-3">Duplicate Students:</h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-60 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="text-xs text-gray-600 uppercase">
                    <tr>
                      <th className="text-left pb-2">Name</th>
                      <th className="text-left pb-2">Email</th>
                      <th className="text-left pb-2">Grade</th>
                      <th className="text-left pb-2">Gender</th>
                    </tr>
                  </thead>
                  <tbody className="text-gray-700">
                    {duplicates.map((student: any, index: any) => (
                      <tr key={index} className="border-t border-gray-200">
                        <td className="py-2">{student.name}</td>
                        <td className="py-2">{student.email}</td>
                        <td className="py-2">{student.grade}</td>
                        <td className="py-2">{student.gender}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* New Students to be Added */}
            {uploadedData.length > 0 && (
              <div className="mb-6">
                <h3 className="font-medium text-gray-900 mb-3">
                  New Students to be Added: ({uploadedData.length})
                </h3>
                <p className="text-sm text-gray-600">
                  These students will be added to your database.
                </p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowDuplicateReview(false);
                  setDuplicates([]);
                  setUploadedData([]);
                }}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
              >
                Cancel Upload
              </button>

              <button
                onClick={async () => {
                  // Skip duplicates, only add new students
                  setShowDuplicateReview(false);
                  await processBulkStudents(uploadedData, 'skip');
                  setDuplicates([]);
                  setUploadedData([]);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Skip Duplicates & Add {uploadedData.length} New Students
              </button>

              <button
                onClick={async () => {
                  // Process all students - update existing and add new
                  setShowDuplicateReview(false);

                  // Combine all students for processing
                  const allStudents = [...uploadedData, ...duplicates];
                  await processBulkStudents(allStudents, 'update');

                  setDuplicates([]);
                  setUploadedData([]);
                }}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
              >
                Update Existing & Add New (Process All)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Student Details Modal */}
      {showStudentDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Student Details</h2>
              <button
                onClick={() => setShowStudentDetails(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Name</label>
                  <p className="font-medium text-gray-900">{showStudentDetails.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium text-gray-900">{showStudentDetails.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Age</label>
                  <p className="font-medium text-gray-900">
                    {showStudentDetails.age ? `${showStudentDetails.age} years` : <span className="text-orange-600">Not set</span>}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Grade</label>
                  <p className="font-medium text-gray-900">{showStudentDetails.grade || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Gender</label>
                  <p className="font-medium text-gray-900">{showStudentDetails.gender || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    showStudentDetails.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {showStudentDetails.status}
                  </span>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Enrollment Date</label>
                  <p className="font-medium text-gray-900">
                    {showStudentDetails.enrollment_date
                      ? new Date(showStudentDetails.enrollment_date).toLocaleDateString()
                      : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <p className="font-medium text-gray-900">{showStudentDetails.phone || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Student ID</label>
                  <p className="font-medium text-gray-900 text-xs">{showStudentDetails.id}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold text-gray-900 mb-2">Quran Progress</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm text-gray-500">Memorized Juz</label>
                    <p className="font-medium text-gray-900">{showStudentDetails.memorized_juz || 0} / 30</p>
                  </div>
                  <div>
                    <label className="text-sm text-gray-500">Revision Juz</label>
                    <p className="font-medium text-gray-900">{showStudentDetails.revision_juz || 0} / 30</p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  onClick={() => setShowStudentDetails(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setEditingStudent(showStudentDetails);
                    setShowStudentDetails(null);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Edit Student
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Student Modal */}
      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Student</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);

              try {
                // Get current user session for authorization
                const { data: { session } } = await supabase.auth.getSession();
                if (!session) {
                  showNotification('Please login as school administrator', 'error');
                  return;
                }

                // Call API route to update student (uses service role key to bypass RLS)
                const response = await fetch('/api/school/update-student', {
                  method: 'PUT',
                  headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${session.access_token}`
                  },
                  body: JSON.stringify({
                    studentId: editingStudent.id,
                    userId: editingStudent.user_id,
                    name: formData.get('name'),
                    dob: formData.get('dob'),
                    gender: formData.get('gender'),
                    grade: formData.get('grade'),
                    phone: formData.get('phone'),
                    address: formData.get('address')
                  }),
                });

                if (!response.ok) {
                  const errorData = await response.json();
                  throw new Error(errorData.error || 'Failed to update student');
                }

                // Refresh data to get the latest from database
                await refreshData();

                // Close edit modal
                setEditingStudent(null);

                // If viewing this student's details, re-fetch and update the modal
                if (showStudentDetails && showStudentDetails.id === editingStudent.id) {
                  // Re-fetch this specific student's data to ensure we have the freshest data
                  const { data: updatedStudentData } = await (supabase as any)
                    .from('students')
                    .select('*')
                    .eq('id', editingStudent.id)
                    .single();

                  if (updatedStudentData) {
                    // Get the profile data
                    const { data: profileData } = await (supabase as any)
                      .from('profiles')
                      .select('user_id, display_name, email, phone')
                      .eq('user_id', updatedStudentData.user_id)
                      .single();

                    // Calculate age from DOB
                    let age = null;
                    if (updatedStudentData.dob) {
                      const today = new Date();
                      const birthDate = new Date(updatedStudentData.dob);
                      age = today.getFullYear() - birthDate.getFullYear();
                      const monthDiff = today.getMonth() - birthDate.getMonth();
                      if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
                        age--;
                      }
                    }

                    // Update the modal with fresh data
                    setShowStudentDetails({
                      ...updatedStudentData,
                      name: profileData?.display_name || 'Unknown',
                      email: profileData?.email || '',
                      phone: profileData?.phone || '',
                      age: age,
                      enrollment_date: updatedStudentData.created_at,
                      status: updatedStudentData.active ? 'active' : 'inactive'
                    });
                  }
                }

                showNotification(
                  'Student updated successfully',
                  'success',
                  3000
                );
              } catch (error: any) {
                console.error('Error updating student:', error);
                showNotification(
                  'Failed to update student',
                  'error',
                  5000,
                  error.message
                );
              }
            }}>
              <div className="space-y-4">
                <input
                  name="name"
                  type="text"
                  defaultValue={editingStudent.name}
                  placeholder="Student Name *"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />

                <div className="grid grid-cols-2 gap-4">
                  <input
                    name="dob"
                    type="date"
                    defaultValue={editingStudent.dob}
                    placeholder="Date of Birth"
                    max={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <select
                    name="gender"
                    defaultValue={editingStudent.gender || ''}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="">Select Gender</option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <input
                    name="grade"
                    type="text"
                    defaultValue={editingStudent.grade || ''}
                    placeholder="Grade/Level"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={editingStudent.phone || ''}
                    placeholder="Phone Number"
                    className="w-full px-3 py-2 border rounded-lg"
                  />
                </div>

                <input
                  name="address"
                  type="text"
                  defaultValue={editingStudent.address || ''}
                  placeholder="Home Address"
                  className="w-full px-3 py-2 border rounded-lg"
                />
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingStudent(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Teacher Details Modal */}
      {showTeacherDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Teacher Details</h2>
              <button
                onClick={() => setShowTeacherDetails(null)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Name</label>
                  <p className="font-medium text-gray-900">{showTeacherDetails.name}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium text-gray-900">{showTeacherDetails.email}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Subject</label>
                  <p className="font-medium text-gray-900">{showTeacherDetails.subject || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Phone</label>
                  <p className="font-medium text-gray-900">{showTeacherDetails.phone || 'Not provided'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Qualification</label>
                  <p className="font-medium text-gray-900">{showTeacherDetails.qualification || 'N/A'}</p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Experience</label>
                  <p className="font-medium text-gray-900">
                    {showTeacherDetails.experience ? `${showTeacherDetails.experience} years` : 'N/A'}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Status</label>
                  <span className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    showTeacherDetails.active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                  }`}>
                    {showTeacherDetails.active ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Teacher ID</label>
                  <p className="font-medium text-gray-900 text-xs">{showTeacherDetails.id}</p>
                </div>
              </div>

              {/* Address field - full width */}
              <div>
                <label className="text-sm text-gray-500">Address</label>
                <p className="font-medium text-gray-900 mt-1">
                  {showTeacherDetails.address || 'No address provided'}
                </p>
              </div>

              <div className="flex justify-end mt-6">
                <button
                  onClick={() => {
                    setShowTeacherDetails(null);
                    setEditingTeacher(showTeacherDetails);
                  }}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Edit Teacher
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {editingTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Edit Teacher</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);

              try {
                // Update teacher data with all fields
                const { error: teacherError } = await (supabase as any)
                  .from('teachers')
                  .update({
                    subject: formData.get('subject') || null,
                    qualification: formData.get('qualification') || null,
                    experience: formData.get('experience') ? parseInt(formData.get('experience') as string) : null,
                    phone: formData.get('phone') || null,
                    address: formData.get('address') || null,
                    bio: formData.get('bio') || null
                  })
                  .eq('id', editingTeacher.id);

                if (teacherError) throw teacherError;

                // Update profile data
                const { error: profileError } = await (supabase as any)
                  .from('profiles')
                  .update({
                    display_name: formData.get('name')
                  })
                  .eq('user_id', editingTeacher.user_id);

                if (profileError) throw profileError;

                refreshData();
                setEditingTeacher(null);
                showNotification(
                  'Teacher updated successfully',
                  'success',
                  3000
                );
              } catch (error: any) {
                console.error('Error updating teacher:', error);
                showNotification(
                  'Failed to update teacher',
                  'error',
                  5000,
                  error.message
                );
              }
            }}>
              <div className="space-y-4">
                <input
                  name="name"
                  type="text"
                  defaultValue={editingTeacher.name}
                  placeholder="Teacher Name *"
                  className="w-full px-3 py-2 border rounded-lg"
                  required
                />
                <div className="grid grid-cols-2 gap-4">
                  <input
                    name="subject"
                    type="text"
                    defaultValue={editingTeacher.subject || ''}
                    placeholder="Subject (e.g., Quran, Tajweed)"
                    className="px-3 py-2 border rounded-lg"
                  />
                  <input
                    name="qualification"
                    type="text"
                    defaultValue={editingTeacher.qualification || ''}
                    placeholder="Qualification"
                    className="px-3 py-2 border rounded-lg"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input
                    name="experience"
                    type="number"
                    defaultValue={editingTeacher.experience || ''}
                    placeholder="Years of Experience"
                    className="px-3 py-2 border rounded-lg"
                    min="0"
                    max="50"
                  />
                  <input
                    name="phone"
                    type="tel"
                    defaultValue={editingTeacher.phone || ''}
                    placeholder="Phone Number"
                    className="px-3 py-2 border rounded-lg"
                  />
                </div>
                <input
                  name="address"
                  type="text"
                  defaultValue={editingTeacher.address || ''}
                  placeholder="Address"
                  className="w-full px-3 py-2 border rounded-lg"
                />
                <textarea
                  name="bio"
                  defaultValue={editingTeacher.bio || ''}
                  placeholder="Bio (Optional)"
                  className="w-full px-3 py-2 border rounded-lg"
                  rows={3}
                />
              </div>
              <div className="flex space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setEditingTeacher(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                >
                  Update Teacher
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Class Modal - Basic Info Only (Teachers/Students assigned in Class Builder) */}
      {showCreateClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Create New Class</h2>
              <button
                type="button"
                onClick={() => {
                  setShowCreateClass(false);
                  setClassSchedules([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);

              handleCreateClass({
                name: formData.get('name'),
                room: formData.get('room'),
                grade: formData.get('grade'),
                capacity: parseInt(formData.get('capacity') as string) || 30,
                schedules: classSchedules
              });

              // Reset
              setClassSchedules([]);
            }}>
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center">
                    <School className="w-4 h-4 mr-2" />
                    Basic Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Class Name *
                      </label>
                      <input
                        name="name"
                        type="text"
                        placeholder="e.g., Quran Memorization - Level 1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Room Number
                      </label>
                      <input
                        name="room"
                        type="text"
                        placeholder="e.g., Room 101"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grade Level
                      </label>
                      <select
                        name="grade"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">Select Grade</option>
                        <option value="KG">KG</option>
                        <option value="1">Grade 1</option>
                        <option value="2">Grade 2</option>
                        <option value="3">Grade 3</option>
                        <option value="4">Grade 4</option>
                        <option value="5">Grade 5</option>
                        <option value="6">Grade 6</option>
                        <option value="7">Grade 7</option>
                        <option value="8">Grade 8</option>
                        <option value="9">Grade 9</option>
                        <option value="10">Grade 10</option>
                        <option value="11">Grade 11</option>
                        <option value="12">Grade 12</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Class Capacity
                      </label>
                      <input
                        name="capacity"
                        type="number"
                        placeholder="30"
                        defaultValue="30"
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Schedule Sessions - Multiple Times */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      Class Schedule
                    </h3>
                    <button
                      type="button"
                      onClick={() => {
                        const newSchedule = {
                          id: Date.now().toString(),
                          day: 'Monday',
                          startTime: '09:00',
                          endTime: '10:00',
                          duration: 60
                        };
                        setClassSchedules([...classSchedules, newSchedule]);
                      }}
                      className="text-sm px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 flex items-center"
                    >
                      <Plus className="w-3 h-3 mr-1" />
                      Add Schedule
                    </button>
                  </div>

                  {classSchedules.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                      <Calendar className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                      <p className="text-sm text-gray-600">No schedules added yet</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Click "Add Schedule" to add class times
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {classSchedules.map((schedule: any, index: any) => (
                        <div key={schedule.id} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 grid grid-cols-3 gap-2">
                              <select
                                value={schedule.day}
                                onChange={(e) => {
                                  const updated = [...classSchedules];
                                  updated[index].day = e.target.value;
                                  setClassSchedules(updated);
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="Monday">Monday</option>
                                <option value="Tuesday">Tuesday</option>
                                <option value="Wednesday">Wednesday</option>
                                <option value="Thursday">Thursday</option>
                                <option value="Friday">Friday</option>
                                <option value="Saturday">Saturday</option>
                                <option value="Sunday">Sunday</option>
                              </select>
                              <input
                                type="time"
                                value={schedule.startTime}
                                onChange={(e) => {
                                  const updated = [...classSchedules];
                                  updated[index].startTime = e.target.value;
                                  setClassSchedules(updated);
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <input
                                type="time"
                                value={schedule.endTime}
                                onChange={(e) => {
                                  const updated = [...classSchedules];
                                  updated[index].endTime = e.target.value;
                                  setClassSchedules(updated);
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setClassSchedules(classSchedules.filter((_, i) => i !== index));
                              }}
                              className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <p className="text-xs text-blue-700">
                      <Info className="w-3 h-3 inline mr-1" />
                      You can add multiple schedules for the same class (e.g., Monday 9AM, Wednesday 2PM, Friday 11AM).
                      Students and teachers will be assigned later in the Class Builder.
                    </p>
                  </div>
                </div>


              </div>

              {/* Actions */}
              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-sm text-gray-500">
                  After creating the class, use Class Builder to assign teachers and students
                </p>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateClass(false);
                      setClassSchedules([]);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={classSchedules.length === 0}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Create Class
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Class Modal */}
      {viewingClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Class Details</h2>
              <button
                onClick={() => setViewingClass(null)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-6">
              {/* Basic Information */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Class Name</p>
                    <p className="font-medium">{viewingClass.name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Room</p>
                    <p className="font-medium">{viewingClass.room || 'Not assigned'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Grade</p>
                    <p className="font-medium">{viewingClass.grade_level || 'Not specified'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Capacity</p>
                    <p className="font-medium">{viewingClass.capacity || 30} students</p>
                  </div>
                </div>
              </div>

              {/* Schedule */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Schedule</h3>
                {viewingClass.schedule_json?.schedules?.length > 0 ? (
                  <div className="space-y-2">
                    {viewingClass.schedule_json.schedules.map((schedule: any, idx: any) => (
                      <div key={idx} className="flex items-center space-x-4 text-sm">
                        <span className="font-medium w-24">{schedule.day}</span>
                        <span>{schedule.startTime} - {schedule.endTime}</span>
                        <span className="text-gray-500">({schedule.duration} mins)</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No schedule set</p>
                )}
              </div>

              {/* Assigned Teachers */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Assigned Teachers ({viewingClass.assigned_teachers?.length || 0})
                </h3>
                {viewingClass.assigned_teachers?.length > 0 ? (
                  <div className="space-y-2">
                    {viewingClass.assigned_teachers.map((t: any, idx: any) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span>{t.teachers?.name}</span>
                        <span className="text-gray-500">{t.teachers?.subject}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No teachers assigned</p>
                )}
              </div>

              {/* Enrolled Students */}
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Enrolled Students ({viewingClass.enrolled_students?.length || 0})
                </h3>
                {viewingClass.enrolled_students?.length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                    {viewingClass.enrolled_students.map((s: any, idx: any) => (
                      <div key={idx} className="text-sm">
                        <span>{s.students?.name}</span>
                        <span className="text-gray-500 ml-2">({s.students?.grade || 'N/A'})</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-gray-500">No students enrolled</p>
                )}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingClass(null)}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Class Modal */}
      {editingClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Edit Class</h2>
              <button
                onClick={() => {
                  setEditingClass(null);
                  setEditClassSchedules([]);
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);

              handleEditClass({
                id: editingClass.id,
                name: formData.get('name'),
                room: formData.get('room'),
                grade: formData.get('grade'),
                capacity: parseInt(formData.get('capacity') as string) || 30,
                schedules: editClassSchedules
              });
            }}>
              <div className="space-y-6">
                {/* Basic Information */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Basic Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Class Name *
                      </label>
                      <input
                        name="name"
                        type="text"
                        defaultValue={editingClass.name}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Room Number
                      </label>
                      <input
                        name="room"
                        type="text"
                        defaultValue={editingClass.room}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Grade Level
                      </label>
                      <select
                        name="grade"
                        defaultValue={editingClass.grade}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="">Select Grade</option>
                        <option value="KG">KG</option>
                        <option value="1">Grade 1</option>
                        <option value="2">Grade 2</option>
                        <option value="3">Grade 3</option>
                        <option value="4">Grade 4</option>
                        <option value="5">Grade 5</option>
                        <option value="6">Grade 6</option>
                        <option value="7">Grade 7</option>
                        <option value="8">Grade 8</option>
                        <option value="9">Grade 9</option>
                        <option value="10">Grade 10</option>
                        <option value="11">Grade 11</option>
                        <option value="12">Grade 12</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Class Capacity
                      </label>
                      <input
                        name="capacity"
                        type="number"
                        defaultValue={editingClass.capacity || 30}
                        min="1"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>
                </div>

                {/* Schedule Sessions */}
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-sm font-semibold text-gray-700">Class Schedule</h3>
                    <button
                      type="button"
                      onClick={() => {
                        const newSchedule = {
                          id: Date.now().toString(),
                          day: 'Monday',
                          startTime: '09:00',
                          endTime: '10:00',
                          duration: 60
                        };
                        setEditClassSchedules([...editClassSchedules, newSchedule]);
                      }}
                      className="text-sm px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200"
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      Add Schedule
                    </button>
                  </div>

                  {editClassSchedules.length === 0 ? (
                    <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-sm text-gray-600">No schedules added yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {editClassSchedules.map((schedule: any, index: any) => (
                        <div key={schedule.id || index} className="bg-white rounded-lg p-3 border border-gray-200">
                          <div className="flex items-center justify-between">
                            <div className="flex-1 grid grid-cols-3 gap-2">
                              <select
                                value={schedule.day}
                                onChange={(e) => {
                                  const updated = [...editClassSchedules];
                                  updated[index].day = e.target.value;
                                  setEditClassSchedules(updated);
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              >
                                <option value="Monday">Monday</option>
                                <option value="Tuesday">Tuesday</option>
                                <option value="Wednesday">Wednesday</option>
                                <option value="Thursday">Thursday</option>
                                <option value="Friday">Friday</option>
                                <option value="Saturday">Saturday</option>
                                <option value="Sunday">Sunday</option>
                              </select>
                              <input
                                type="time"
                                value={schedule.startTime}
                                onChange={(e) => {
                                  const updated = [...editClassSchedules];
                                  updated[index].startTime = e.target.value;
                                  setEditClassSchedules(updated);
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                              <input
                                type="time"
                                value={schedule.endTime}
                                onChange={(e) => {
                                  const updated = [...editClassSchedules];
                                  updated[index].endTime = e.target.value;
                                  setEditClassSchedules(updated);
                                }}
                                className="px-2 py-1 border border-gray-300 rounded text-sm"
                              />
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setEditClassSchedules(editClassSchedules.filter((_, i) => i !== index));
                              }}
                              className="ml-2 p-1 text-red-500 hover:bg-red-50 rounded"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between mt-6 pt-6 border-t">
                <p className="text-sm text-gray-500">
                  Use Class Builder to manage teacher and student assignments
                </p>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingClass(null);
                      setEditClassSchedules([]);
                    }}
                    className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={editClassSchedules.length === 0}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Update Class
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Class Builder Modal - Drag and Drop Interface */}
      {showClassBuilder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full h-full max-w-full max-h-full overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b">
              <button
                onClick={() => {
                  setShowClassBuilder(false);
                  // Refresh data when closing Class Builder
                  refreshData();
                }}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="h-[calc(100vh-80px)]">
              <Suspense fallback={
                <div className="flex items-center justify-center h-full">
                  <div className="text-lg">Loading Class Builder Ultra...</div>
                </div>
              }>
                <ClassBuilderUltra
                  schoolId={user?.schoolId || ''}
                  onClose={() => {
                    setShowClassBuilder(false);
                    // Refresh data when closing Class Builder
                    refreshData();
                  }}
                  onSave={() => {
                    // Refresh data immediately after saving
                    console.log('Class Builder saved - refreshing data...');
                    refreshData();
                  }}
                />
              </Suspense>
            </div>
          </div>
        </div>
      )}

      {/* Compose Message Modal */}
      {showComposeMessage && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Compose New Message</h2>

            <div className="space-y-4">
              {/* Recipient Type */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Send To
                </label>
                <select
                  value={messageRecipientType}
                  onChange={(e) => setMessageRecipientType(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Users</option>
                  <option value="all_teachers">All Teachers</option>
                  <option value="all_students">All Students</option>
                  <option value="all_parents">All Parents</option>
                  <option value="specific_class">Specific Class</option>
                  <option value="individual">Individual User</option>
                </select>
              </div>

              {/* Class Selection (if specific class) */}
              {messageRecipientType === 'specific_class' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Select Class
                  </label>
                  <select
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a class...</option>
                    {classes.map((cls: any) => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {/* Individual Selection (if individual) */}
              {messageRecipientType === 'individual' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search User
                  </label>
                  <input
                    type="text"
                    placeholder="Search by name or email..."
                    value={recipientSearch}
                    onChange={(e) => setRecipientSearch(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                  <div className="mt-2 max-h-40 overflow-y-auto border rounded-lg p-2">
                    {recipientSearch && (
                      <div className="space-y-1">
                        {[...students, ...teachers, ...parents]
                          .filter((person: any) =>
                            person.name?.toLowerCase().includes(recipientSearch.toLowerCase()) ||
                            person.email?.toLowerCase().includes(recipientSearch.toLowerCase())
                          )
                          .slice(0, 10)
                          .map((person: any) => (
                            <div
                              key={person.id}
                              onClick={() => {
                                setSelectedRecipients((prev: any) => {
                                  const exists = prev.find((r: any) => r.id === person.id);
                                  if (exists) return prev.filter((r: any) => r.id !== person.id);
                                  return [...prev, person];
                                });
                              }}
                              className={`p-2 rounded cursor-pointer hover:bg-gray-100 ${
                                selectedRecipients.find((r: any) => r.id === person.id) ? 'bg-blue-50' : ''
                              }`}
                            >
                              <div className="font-medium">{person.name}</div>
                              <div className="text-xs text-gray-500">{person.email}</div>
                            </div>
                          ))}
                      </div>
                    )}
                    {selectedRecipients.length > 0 && (
                      <div className="mt-2 pt-2 border-t">
                        <div className="text-sm font-medium text-gray-700 mb-1">Selected:</div>
                        <div className="flex flex-wrap gap-1">
                          {selectedRecipients.map((person: any) => (
                            <span key={person.id} className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                              {person.name}
                              <button
                                onClick={() => setSelectedRecipients((prev: any) => prev.filter((r: any) => r.id !== person.id))}
                                className="ml-1 text-blue-500 hover:text-blue-700"
                              >
                                ×
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Subject */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  placeholder="Enter message subject..."
                  value={messageSubject}
                  onChange={(e) => setMessageSubject(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Message Body */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  rows={6}
                  placeholder="Type your message here..."
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Priority */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Priority
                </label>
                <select
                  onChange={(e) => setMessagePriority(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="normal">Normal</option>
                  <option value="high">High</option>
                  <option value="urgent">Urgent</option>
                </select>
              </div>

              {/* Send via Email option */}
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="sendEmail"
                  className="mr-2"
                  onChange={(e) => setSendViaEmail(e.target.checked)}
                  defaultChecked
                />
                <label htmlFor="sendEmail" className="text-sm text-gray-700">
                  Also send via email
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  setShowComposeMessage(false);
                  setMessageSubject('');
                  setMessageContent('');
                  setSelectedRecipients([]);
                  setRecipientSearch('');
                }}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleSendMessage(
                    null,
                    messageSubject,
                    messageContent,
                    messageRecipientType,
                    messagePriority || 'normal',
                    sendViaEmail || false
                  );
                }}
                disabled={!messageSubject || !messageContent}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
                Send Message
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-semibold text-gray-900">Add Calendar Event</h2>
              <button
                onClick={() => setShowAddEvent(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={async (e) => {
              e.preventDefault();
              const formData = new FormData(e.target as HTMLFormElement);

              try {
                const date = formData.get('date') as string;
                const startTime = formData.get('start_time') as string;
                const endTime = formData.get('end_time') as string;
                const allDay = formData.get('all_day') === 'true';

                // Combine date + time into TIMESTAMPTZ format
                const startTimestamp = allDay
                  ? `${date}T00:00:00Z`
                  : `${date}T${startTime || '00:00'}:00Z`;
                const endTimestamp = allDay
                  ? `${date}T23:59:59Z`
                  : `${date}T${endTime || '23:59'}:00Z`;

                const { error } = await (supabase as any)
                  .from('events')
                  .insert({
                    school_id: user?.schoolId,
                    title: formData.get('title'),
                    description: formData.get('description'),
                    event_type: formData.get('event_type'),
                    start_date: startTimestamp,  // FIXED: start_date is TIMESTAMPTZ, not just date
                    end_date: endTimestamp,      // FIXED: end_date is TIMESTAMPTZ, not just date
                    all_day: allDay,
                    class_id: formData.get('class_id') || null,
                    created_by_user_id: user?.id
                  });

                if (error) {
                  console.error('Supabase error details:', JSON.stringify(error, null, 2));
                  throw error;
                }

                showNotification('Event added successfully!', 'success');
                setShowAddEvent(false);
                refreshData(); // Refresh the calendar data
              } catch (error: any) {
                console.error('Error adding event:', error);
                showNotification(`Failed to add event: ${error.message || 'Unknown error'}`, 'error');
              }
            }}>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Title *
                  </label>
                  <input
                    name="title"
                    type="text"
                    placeholder="Enter event title"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    placeholder="Enter event description"
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Type *
                  </label>
                  <select
                    name="event_type"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="general">General</option>
                    <option value="meeting">Meeting</option>
                    <option value="exam">Exam</option>
                    <option value="holiday">Holiday</option>
                    <option value="assignment">Assignment</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date *
                  </label>
                  <input
                    name="date"
                    type="date"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                    min={new Date().toISOString().split('T')[0]}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </label>
                    <input
                      name="start_time"
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </label>
                    <input
                      name="end_time"
                      type="time"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Location
                  </label>
                  <input
                    name="location"
                    type="text"
                    placeholder="Enter location"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Event Color
                  </label>
                  <select
                    name="color"
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    defaultValue="#3B82F6"
                  >
                    <option value="#3B82F6">Blue (Default)</option>
                    <option value="#10B981">Green</option>
                    <option value="#EF4444">Red</option>
                    <option value="#F59E0B">Orange</option>
                    <option value="#8B5CF6">Purple</option>
                    <option value="#EC4899">Pink</option>
                    <option value="#14B8A6">Teal</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowAddEvent(false)}
                  className="flex-1 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add Event
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* [Include ALL other modals from the original code] */}
    </div>
  );
}