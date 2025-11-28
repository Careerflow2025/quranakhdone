'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/lib/supabase';
import { useNotifications } from '@/hooks/useNotifications';
import { useSectionNotifications } from '@/hooks/useSectionNotifications';
import { NotificationBadge } from '@/components/notifications/NotificationBadge';
import { useTeacherData } from '@/hooks/useTeacherData';
import { useHomework } from '@/hooks/useHomework';
import { useHighlights } from '@/hooks/useHighlights';
import {
  Users, BookOpen, Calendar, Bell, Settings, FileText, Clock, TrendingUp,
  CheckCircle, AlertCircle, Mail, GraduationCap, Search, Filter, User, LogOut,
  Key, X, Eye, Download, MessageSquare, Send, ChevronRight, Book, Target,
  Award, Brain, RefreshCw, BarChart3, Activity, Plus, Edit, Trash2,
  MoreVertical, Phone, Video, Paperclip, EyeOff, CalendarDays, School,
  Home, Info, Mic, MicOff, Play, Pause, StopCircle, Grid3x3, List,
  Archive, MapPin, ChevronLeft, Check, ChevronDown, Star, Zap,
  ArrowUp, ArrowDown, Bookmark, Copy, Hash, Layers, Layout, Package
} from 'lucide-react';
import MessagesPanel from '@/components/messages/MessagesPanel';
import GradebookPanel from '@/components/gradebook/GradebookPanel';
import CalendarPanel from '@/components/calendar/CalendarPanel';
import MasteryPanel from '@/components/mastery/MasteryPanel';
import AssignmentsPanel from '@/components/assignments/AssignmentsPanel';
import AttendancePanel from '@/components/attendance/AttendancePanel';
import ClassesPanel from '@/components/classes/ClassesPanel';
import TargetsPanel from '@/components/targets/TargetsPanel';

export default function TeacherDashboard() {
  const router = useRouter();
  const { user, logout } = useAuthStore();

  // Logout function
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      logout();
      window.location.href = '/login';
    } catch (error: any) {
      console.error('Error logging out:', error);
    }
  };

  // Get real teacher data from database
  const {
    isLoading: teacherDataLoading,
    error: teacherDataError,
    teacherInfo,
    stats,
    students,
    classes: myClasses,
    assignments,
    targets,
    messages: teacherMessages,
    refreshData
  } = useTeacherData();

  // Get homework data using proper API hook (bypasses RLS)
  const {
    homeworkList: homeworkData,
    isLoading: homeworkLoading,
    error: homeworkError,
    fetchHomework
  } = useHomework();

  // Fetch homework when teacher info is available
  useEffect(() => {
    if (teacherInfo?.id) {
      fetchHomework({ teacher_id: teacherInfo.id, include_completed: true });
    }
  }, [teacherInfo?.id, fetchHomework]);

  // Transform homework data to match UI expectations
  const transformedHomework = useMemo(() => {
    return (homeworkData || []).map((hw: any) => ({
      id: hw.id,
      studentId: hw.student_id,
      studentName: hw.student?.display_name || 'Unknown Student',
      class: 'N/A', // Class info not available in highlights table
      surah: hw.surah ? `Surah ${hw.surah}` : 'Unknown Surah',
      ayahRange: hw.ayah_start && hw.ayah_end ? `${hw.ayah_start}-${hw.ayah_end}` : 'N/A',
      note: hw.note || '',
      assignedDate: hw.created_at ? new Date(hw.created_at).toLocaleDateString() : '',
      dueDate: hw.created_at ? new Date(hw.created_at).toLocaleDateString() : '',
      replies: hw.notes?.length || 0,
      status: hw.status || 'pending',
      color: hw.color,
    }));
  }, [homeworkData]);

  // State Management
  const [activeTab, setActiveTab] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [selectedStudentDetails, setSelectedStudentDetails] = useState<any>(null);

  // Get notifications from API
  const {
    notifications: dbNotifications,
    unreadCount,
    isLoading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    refresh: refreshNotifications
  } = useNotifications();

  // Section notifications hook for badge system
  const { markSectionRead, getSectionCount } = useSectionNotifications();

  // Homework State
  const [homeworkFilter, setHomeworkFilter] = useState('all');
  const [homeworkSearchQuery, setHomeworkSearchQuery] = useState('');
  const [showHomeworkDetail, setShowHomeworkDetail] = useState<any>(null);

  // Class Details State
  const [selectedClassDetails, setSelectedClassDetails] = useState<any>(null);

  // Highlights State - fetch all highlights for this teacher
  const [highlightsFilter, setHighlightsFilter] = useState('all');
  const [selectedStudentFilter, setSelectedStudentFilter] = useState('all');
  const {
    highlights: allHighlights,
    isLoading: highlightsLoading,
    error: highlightsError,
    refreshHighlights
  } = useHighlights({ teacherId: teacherInfo?.id || null }); // Fetch all highlights created by this teacher

  // Safety check: ensure allHighlights is always an array
  const safeHighlights = allHighlights || [];

  // Navigation tabs
  const tabs = ['overview', 'my classes', 'students', 'assignments', 'gradebook', 'mastery', 'homework', 'highlights', 'targets', 'attendance', 'messages', 'events'];

  // Map tab names to notification sections
  const tabToSection: Record<string, string> = {
    'overview': 'overview',
    'my classes': 'classes',
    'students': 'students',
    'assignments': 'assignments',
    'gradebook': 'gradebook',
    'mastery': 'mastery',
    'homework': 'homework',
    'highlights': 'highlights',
    'targets': 'targets',
    'attendance': 'attendance',
    'messages': 'messages',
    'events': 'calendar'
  };

  // Function to mark homework as complete (turns green to gold)
  const markHomeworkComplete = async (homeworkId: string) => {
    try {
      // Update homework/assignment status in database
      await refreshData();
    } catch (error) {
      console.error('Error marking homework complete:', error);
    }
  };

  // Students State
  const [studentClassFilter, setStudentClassFilter] = useState('all');

  // Assignments State
  const [assignmentsFilter, setAssignmentsFilter] = useState('all');
  const [assignmentsSearchQuery, setAssignmentsSearchQuery] = useState('');
  const [showAssignmentDetail, setShowAssignmentDetail] = useState<any>(null);

  // Transform assignments from all highlights (excluding homework green/gold)
  // Assignments = All highlights that are NOT green (homework)
  const transformedAssignments = useMemo(() => {
    // Filter allHighlights to exclude green homework highlights
    const nonHomeworkHighlights = safeHighlights.filter((h: any) =>
      h.color !== 'green' // Exclude green homework, include everything else including gold
    );

    return nonHomeworkHighlights.map((highlight: any) => {
      // Determine status based on color
      let status = 'assigned';
      if (highlight.color === 'gold') {
        status = 'completed';
      }

      return {
        id: highlight.id,
        studentId: highlight.student_id,
        studentName: highlight.student?.profiles?.display_name || highlight.student?.display_name || 'Unknown Student',
        class: 'N/A',
        title: highlight.surah ? `Surah ${highlight.surah}, Ayah ${highlight.ayah_start}-${highlight.ayah_end}` : 'Untitled Assignment',
        description: highlight.note || highlight.type || 'No description',
        assignedDate: highlight.created_at ? new Date(highlight.created_at).toLocaleDateString() : '',
        dueDate: highlight.created_at ? new Date(highlight.created_at).toLocaleDateString() : '',
        status: status,
        late: false,
        color: highlight.color,
        surah: highlight.surah,
        ayahRange: `${highlight.ayah_start}-${highlight.ayah_end}`,
      };
    });
  }, [safeHighlights]);

  // Function to mark assignment (highlight) as complete - same logic as homework
  const markAssignmentComplete = async (highlightId: string) => {
    try {
      console.log('📝 Marking assignment as completed:', highlightId);

      // Get auth session
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        console.error('No active session');
        return;
      }

      // Call highlight completion API (same as homework)
      const response = await fetch(`/api/highlights/${highlightId}/complete`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Failed to complete assignment:', errorData.error);
        return;
      }

      const data = await response.json();
      console.log('✅ Assignment (highlight) completed:', data.highlight?.id);

      // Refresh highlights to show gold color
      await refreshHighlights();
    } catch (error) {
      console.error('Error marking assignment complete:', error);
    }
  };

  // Show loading state
  if (teacherDataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-blue-600 mx-auto mb-4 animate-spin" />
          <p className="text-gray-600">Loading teacher dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (teacherDataError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 font-semibold mb-2">Error loading dashboard</p>
          <p className="text-gray-600 mb-4">{teacherDataError}</p>
          <button
            onClick={refreshData}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16 relative">
            <div className="flex items-center">
              {teacherInfo?.school?.logo_url ? (
                <img
                  src={teacherInfo.school.logo_url}
                  alt="School Logo"
                  className="w-8 h-8 rounded-lg object-cover mr-3"
                />
              ) : (
                <School className="w-8 h-8 text-blue-600 mr-3" />
              )}
              <h1 className="text-xl font-bold text-gray-900">Teacher Dashboard</h1>
            </div>

            {/* Center - QuranAkh Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center">
              <img
                src="/quranakh-logo.png"
                alt="QuranAkh Logo"
                className="w-12 h-12 object-contain"
              />
            </div>

            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                >
                  <Bell className="w-6 h-6" />
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
                              onClick={markAllAsRead}
                              className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                            >
                              Mark all read
                            </button>
                          )}
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
                          onClick={() => setShowNotifications(false)}
                          className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                        >
                          Close
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowProfile(!showProfile)}
                  className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
                >
                  <User className="w-6 h-6" />
                  <span className="hidden md:inline">{teacherInfo?.name || 'Teacher'}</span>
                  <ChevronDown className="w-4 h-4" />
                </button>

                {/* Profile Dropdown Menu */}
                {showProfile && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                    <div className="py-1">
                      <button
                        onClick={handleLogout}
                        className="w-full flex items-center space-x-3 px-4 py-2 text-red-600 hover:bg-red-50"
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
        </div>

        {/* Tab Navigation */}
        <div className="px-4 sm:px-6 lg:px-8">
          <nav className="flex justify-center space-x-8 overflow-x-auto">
            {tabs.map((tab: any) => {
              const sectionId = tabToSection[tab];
              const hasNotifications = getSectionCount(sectionId) > 0;
              return (
                <button
                  key={tab}
                  onClick={() => {
                    // Mark section as read when clicked
                    if (hasNotifications) {
                      markSectionRead(sectionId);
                    }
                    setActiveTab(tab);
                  }}
                  className={`relative py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                    activeTab === tab
                      ? 'border-blue-600 text-blue-600'
                      : hasNotifications
                      ? 'border-blue-300 text-blue-500 hover:text-blue-700 hover:border-blue-400'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <span className="relative inline-block">
                    {tab.charAt(0).toUpperCase() + tab.slice(1).replace(' ', ' ')}
                    <NotificationBadge section={sectionId} className="absolute -top-2 -right-6" />
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="py-8">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <>
            {/* Welcome Header - Full Width */}
            <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 shadow-xl mb-8">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                  <div>
                    <h1 className="text-4xl md:text-5xl font-bold text-white mb-3">
                      Welcome back, {teacherInfo?.name || 'Teacher'}
                    </h1>
                    <p className="text-blue-50 text-xl">
                      Ready to inspire and guide your students today
                    </p>
                  </div>
                  <div className="flex items-center gap-3 bg-white/20 backdrop-blur-md rounded-2xl px-8 py-5 border border-white/30 shadow-lg">
                    <div className="text-right">
                      <p className="text-blue-100 text-sm uppercase tracking-wide font-medium">Today</p>
                      <p className="text-white text-2xl font-bold">
                        {new Date().toLocaleDateString('en-US', {
                          weekday: 'short',
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Premium Stats Cards */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6 lg:gap-8">

              {/* Total Students Card */}
              <div
                onClick={() => setActiveTab('students')}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-l-4 border-blue-500 overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-blue-50 rounded-xl shadow-sm group-hover:bg-blue-100 transition-colors duration-300">
                      <Users className="w-8 h-8 text-blue-600" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Total Students</p>
                      <p className="text-5xl font-bold text-slate-900 mt-2 group-hover:text-blue-600 transition-colors duration-300">{stats.totalStudents}</p>
                    </div>
                  </div>
                  <div className="h-1 bg-gradient-to-r from-blue-200 to-blue-400 rounded-full"></div>
                </div>
              </div>

              {/* Total Assignments Card */}
              <div
                onClick={() => setActiveTab('assignments')}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-l-4 border-amber-500 overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-amber-50 rounded-xl shadow-sm group-hover:bg-amber-100 transition-colors duration-300">
                      <BookOpen className="w-8 h-8 text-amber-600" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Total Assignments</p>
                      <p className="text-5xl font-bold text-slate-900 mt-2 group-hover:text-amber-600 transition-colors duration-300">{stats.totalAssignments}</p>
                    </div>
                  </div>
                  <div className="h-1 bg-gradient-to-r from-amber-200 to-amber-400 rounded-full"></div>
                </div>
              </div>

              {/* My Classes Card */}
              <div
                onClick={() => setActiveTab('classes')}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-l-4 border-indigo-500 overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-indigo-50 rounded-xl shadow-sm group-hover:bg-indigo-100 transition-colors duration-300">
                      <BookOpen className="w-8 h-8 text-indigo-600" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">My Classes</p>
                      <p className="text-5xl font-bold text-slate-900 mt-2 group-hover:text-indigo-600 transition-colors duration-300">{stats.totalClasses}</p>
                    </div>
                  </div>
                  <div className="h-1 bg-gradient-to-r from-indigo-200 to-indigo-400 rounded-full"></div>
                </div>
              </div>

              {/* Total Homework Card */}
              <div
                onClick={() => setActiveTab('homework')}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-l-4 border-emerald-500 overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-emerald-50 rounded-xl shadow-sm group-hover:bg-emerald-100 transition-colors duration-300">
                      <BookOpen className="w-8 h-8 text-emerald-600" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Total Homework</p>
                      <p className="text-5xl font-bold text-slate-900 mt-2 group-hover:text-emerald-600 transition-colors duration-300">{stats.totalHomework}</p>
                    </div>
                  </div>
                  <div className="h-1 bg-gradient-to-r from-emerald-200 to-emerald-400 rounded-full"></div>
                </div>
              </div>

              {/* Total Targets Card */}
              <div
                onClick={() => setActiveTab('targets')}
                className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-l-4 border-purple-500 overflow-hidden cursor-pointer">
                <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="relative flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="p-3 bg-purple-50 rounded-xl shadow-sm group-hover:bg-purple-100 transition-colors duration-300">
                      <Target className="w-8 h-8 text-purple-600" />
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-slate-600 uppercase tracking-wide">Total Targets</p>
                      <p className="text-5xl font-bold text-slate-900 mt-2 group-hover:text-purple-600 transition-colors duration-300">{stats.totalTargets}</p>
                    </div>
                  </div>
                  <div className="h-1 bg-gradient-to-r from-purple-200 to-purple-400 rounded-full"></div>
                </div>
              </div>

            </div>
            </div>
          </>
        )}

        {/* HOMEWORK TAB - NEW! */}
        {activeTab === 'homework' && (
          <div className="space-y-6 px-4 sm:px-6 lg:px-8">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
              <div>
                <h2 className="text-2xl font-bold flex items-center">
                  <BookOpen className="w-7 h-7 mr-3" />
                  Homework Management
                </h2>
                <p className="text-green-100 mt-1">Manage all green highlights (homework) you've assigned</p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center space-x-4">
                <select
                  value={homeworkFilter}
                  onChange={(e) => setHomeworkFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-500"
                >
                  <option value="all">All Homework</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>

                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by student, surah, or note..."
                    value={homeworkSearchQuery}
                    onChange={(e) => setHomeworkSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Homework Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
              {transformedHomework
                .filter((hw: any) => {
                  // Status filter
                  const matchesStatus = homeworkFilter === 'all' || hw.status === homeworkFilter;

                  // Search filter
                  const searchLower = homeworkSearchQuery.toLowerCase();
                  const matchesSearch = !homeworkSearchQuery ||
                    hw.studentName?.toLowerCase().includes(searchLower) ||
                    hw.surah?.toLowerCase().includes(searchLower) ||
                    hw.note?.toLowerCase().includes(searchLower);

                  return matchesStatus && matchesSearch;
                })
                .map((homework: any) => (
                <div key={homework.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className={`h-2 ${
                    homework.color === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                    'bg-gradient-to-r from-green-500 to-emerald-500'
                  }`}></div>

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {homework.studentName}
                        </h3>
                        <p className="text-sm text-gray-500">{homework.class} • {homework.studentId}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        homework.status === 'completed' ? 'bg-green-100 text-green-700' :
                        homework.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                        homework.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {homework.status}
                      </span>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-sm font-medium text-gray-700">
                        📖 {homework.surah}, Ayah {homework.ayahRange}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{homework.note}</p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Assigned:</span>
                        <span className="text-gray-700">{homework.assignedDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Due Date:</span>
                        <span className={homework.status === 'overdue' ? 'text-red-600 font-medium' : 'text-gray-700'}>
                          {homework.dueDate}
                        </span>
                      </div>
                    </div>

                    {homework.status !== 'completed' && (
                      <div className="mt-4 pt-4 border-t flex justify-end">
                        <button
                          onClick={() => markHomeworkComplete(homework.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
                        >
                          Mark Complete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {transformedHomework.filter((hw: any) => {
              const matchesStatus = homeworkFilter === 'all' || hw.status === homeworkFilter;
              const searchLower = homeworkSearchQuery.toLowerCase();
              const matchesSearch = !homeworkSearchQuery ||
                hw.studentName?.toLowerCase().includes(searchLower) ||
                hw.surah?.toLowerCase().includes(searchLower) ||
                hw.note?.toLowerCase().includes(searchLower);
              return matchesStatus && matchesSearch;
            }).length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No homework found</p>
                <p className="text-gray-400 text-sm mt-1">
                  {homeworkSearchQuery ? 'Try a different search term' : 'Create homework by highlighting text in Student Management Dashboard'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* HIGHLIGHTS TAB - NEW! */}
        {activeTab === 'highlights' && (
          <div className="space-y-6">
            {/* Header with Stats */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center">
                    <Bookmark className="w-7 h-7 mr-3" />
                    Highlights Management
                  </h2>
                  <p className="text-purple-100 mt-1">View all Quran highlights you've created for your students</p>
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
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 xl:grid-cols-5 gap-4 mt-6">
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <p className="text-purple-100 text-sm">Total</p>
                  <p className="text-2xl font-bold">{safeHighlights.length}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <p className="text-purple-100 text-sm">Homework (Green)</p>
                  <p className="text-2xl font-bold text-green-200">
                    {safeHighlights.filter((h: any) => h.type === 'homework' && !h.completed_at).length}
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <p className="text-purple-100 text-sm">Recap (Purple)</p>
                  <p className="text-2xl font-bold text-purple-200">
                    {safeHighlights.filter((h: any) => h.type === 'recap' && !h.completed_at).length}
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <p className="text-purple-100 text-sm">Tajweed (Orange)</p>
                  <p className="text-2xl font-bold text-orange-200">
                    {safeHighlights.filter((h: any) => h.type === 'tajweed' && !h.completed_at).length}
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <p className="text-purple-100 text-sm">Completed (Gold)</p>
                  <p className="text-2xl font-bold text-yellow-200">
                    {safeHighlights.filter((h: any) => h.completed_at !== null).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Student Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Student</label>
                  <select
                    value={selectedStudentFilter}
                    onChange={(e) => setSelectedStudentFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Students</option>
                    {students.map((student: any) => (
                      <option key={student.id} value={student.id}>{student.name}</option>
                    ))}
                  </select>
                </div>

                {/* Type Filter */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Filter by Type</label>
                  <select
                    value={highlightsFilter}
                    onChange={(e) => setHighlightsFilter(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">All Types</option>
                    <option value="homework">Homework (Green)</option>
                    <option value="recap">Recap (Purple)</option>
                    <option value="tajweed">Tajweed (Orange)</option>
                    <option value="haraka">Haraka (Red)</option>
                    <option value="letter">Letter (Brown)</option>
                    <option value="completed">Completed (Gold)</option>
                  </select>
                </div>

                {/* Search */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                      type="text"
                      placeholder="Search by surah, ayah, note..."
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Loading State */}
            {highlightsLoading && (
              <div className="text-center py-12 bg-white rounded-xl">
                <RefreshCw className="w-12 h-12 text-purple-600 mx-auto mb-4 animate-spin" />
                <p className="text-gray-600">Loading highlights...</p>
              </div>
            )}

            {/* Error State */}
            {highlightsError && (
              <div className="text-center py-12 bg-white rounded-xl">
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
            )}

            {/* Highlights Display - Grouped by Student */}
            {!highlightsLoading && !highlightsError && (() => {
              // Filter highlights
              const filteredHighlights = safeHighlights.filter((h: any) => {
                // Student filter
                if (selectedStudentFilter !== 'all' && h.student_id !== selectedStudentFilter) return false;

                // Type filter
                if (highlightsFilter === 'completed') {
                  return h.completed_at !== null;
                } else if (highlightsFilter !== 'all') {
                  return h.type === highlightsFilter && h.completed_at === null;
                }

                return true;
              });

              // Group by student
              const highlightsByStudent = filteredHighlights.reduce((acc: any, h: any) => {
                if (!acc[h.student_id]) {
                  const student = students.find((s: any) => s.id === h.student_id);
                  acc[h.student_id] = {
                    studentName: student?.name || 'Unknown Student',
                    studentEmail: student?.email || '',
                    highlights: []
                  };
                }
                acc[h.student_id].highlights.push(h);
                return acc;
              }, {});

              const studentGroups = Object.values(highlightsByStudent);

              if (studentGroups.length === 0) {
                return (
                  <div className="text-center py-12 bg-white rounded-xl">
                    <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No highlights found</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Create highlights by selecting text in the Student Management Dashboard
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {studentGroups.map((group: any, idx: number) => (
                    <div key={idx} className="bg-white rounded-xl shadow-md overflow-hidden">
                      {/* Student Header */}
                      <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                              <User className="w-6 h-6" />
                            </div>
                            <div>
                              <h3 className="text-lg font-bold">{group.studentName}</h3>
                              <p className="text-sm text-blue-100">{group.studentEmail}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="bg-white bg-opacity-20 px-4 py-2 rounded-lg font-semibold">
                              {group.highlights.length} highlights
                            </span>
                            <button
                              onClick={() => {
                                const student = students.find((s: any) => s.id === group.highlights[0].student_id);
                                if (student) {
                                  router.push(`/student-management?studentId=${student.id}`);
                                }
                              }}
                              className="bg-white text-blue-600 px-4 py-2 rounded-lg font-medium hover:bg-blue-50 transition flex items-center gap-2"
                            >
                              <BookOpen className="w-4 h-4" />
                              Open Quran
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Highlights Grid */}
                      <div className="p-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {group.highlights.map((highlight: any) => {
                            const isCompleted = highlight.completed_at !== null;
                            const colorMap: any = {
                              homework: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300', color: 'rgb(34, 197, 94)' },
                              recap: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300', color: 'rgb(168, 85, 247)' },
                              tajweed: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300', color: 'rgb(249, 115, 22)' },
                              haraka: { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300', color: 'rgb(239, 68, 68)' },
                              letter: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', color: 'rgb(234, 179, 8)' },
                              completed: { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300', color: 'rgb(234, 179, 8)' }
                            };

                            const typeStyle = isCompleted
                              ? colorMap.completed
                              : (colorMap[highlight.type] || colorMap.homework);

                            // Determine if word-level or full ayah
                            const isWordLevel = highlight.word_start !== null && highlight.word_start !== undefined;
                            const rangeText = isWordLevel
                              ? `Word ${highlight.word_start} - ${highlight.word_end}`
                              : 'Full Ayah';

                            return (
                              <div
                                key={highlight.id}
                                className={`border-2 ${typeStyle.border} ${typeStyle.bg} rounded-lg p-4 hover:shadow-md transition-shadow`}
                              >
                                {/* Type Badge */}
                                <div className="flex items-center justify-between mb-3">
                                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${typeStyle.text}`}>
                                    {isCompleted ? '✓ Completed' : highlight.type?.toUpperCase()}
                                  </span>
                                  {isCompleted && (
                                    <Star className="w-5 h-5 text-yellow-600" fill="currentColor" />
                                  )}
                                </div>

                                {/* Highlight Details */}
                                <div className="space-y-2">
                                  <div className="flex items-center justify-between">
                                    <p className="text-sm font-semibold text-gray-900">
                                      📖 Surah {highlight.surah}
                                    </p>
                                    <div
                                      className="w-6 h-6 rounded"
                                      style={{ backgroundColor: typeStyle.color }}
                                    ></div>
                                  </div>

                                  <p className="text-sm text-gray-700">
                                    <span className="font-medium">Ayah:</span> {highlight.ayah_start}
                                    {highlight.ayah_end !== highlight.ayah_start && ` - ${highlight.ayah_end}`}
                                  </p>

                                  <p className="text-xs text-gray-600">
                                    <span className="font-medium">Range:</span> {rangeText}
                                  </p>

                                  {highlight.page_number && (
                                    <p className="text-xs text-gray-600">
                                      <span className="font-medium">Page:</span> {highlight.page_number}
                                    </p>
                                  )}

                                  {highlight.note && (
                                    <p className="text-xs text-gray-600 mt-2 italic">
                                      "{highlight.note}"
                                    </p>
                                  )}

                                  <p className="text-xs text-gray-400 pt-2 border-t">
                                    {new Date(highlight.created_at).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              );
            })()}
          </div>
        )}

        {/* Targets Tab */}
        {activeTab === 'targets' && (
          <TargetsPanel />
        )}

        {/* My Classes Tab */}
        {activeTab === 'my classes' && (
          <div className="space-y-6">
            {/* Premium Header */}
            <div className="bg-gradient-to-r from-indigo-600 via-blue-600 to-cyan-500 rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white flex items-center">
                    <BookOpen className="w-8 h-8 mr-3" />
                    My Classes
                  </h2>
                  <p className="text-blue-100 mt-2 text-lg">
                    {myClasses.length} {myClasses.length === 1 ? 'class' : 'classes'} in your teaching portfolio
                  </p>
                </div>
                <button
                  onClick={refreshData}
                  className="bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-xl hover:bg-white/30 flex items-center gap-2 border border-white/30 shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <RefreshCw className="w-5 h-5" />
                  Refresh
                </button>
              </div>
            </div>

            {myClasses.length === 0 ? (
              <div className="bg-gradient-to-br from-indigo-50 to-cyan-50 rounded-2xl shadow-lg p-16 text-center border border-indigo-100">
                <div className="bg-indigo-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-12 h-12 text-indigo-600" />
                </div>
                <p className="text-gray-700 text-xl font-semibold">No classes assigned yet</p>
                <p className="text-gray-500 mt-3 text-lg">
                  Your classes will appear here once assigned by the school administrator
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                {myClasses.map((cls: any) => (
                  <div
                    key={cls.id}
                    className="group relative bg-white rounded-2xl p-6 shadow-lg hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 border-l-4 border-indigo-500 overflow-hidden"
                  >
                    {/* Gradient Overlay */}
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                    {/* Content */}
                    <div className="relative space-y-4">
                      {/* Class Icon and Header */}
                      <div className="flex items-center gap-4">
                        <div className="flex-shrink-0 w-16 h-16 bg-gradient-to-br from-indigo-100 to-cyan-100 rounded-2xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                          <BookOpen className="w-8 h-8 text-indigo-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-bold text-gray-900 truncate group-hover:text-indigo-600 transition-colors duration-300">
                            {cls.name}
                          </h3>
                          {cls.room && (
                            <p className="text-sm text-gray-500 flex items-center mt-1">
                              <MapPin className="w-4 h-4 mr-1" />
                              Room {cls.room}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Class Info */}
                      <div className="space-y-3">
                        {/* Students Capacity */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-indigo-400 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                              <Users className="w-4 h-4" />
                              Students:
                            </span>
                          </div>
                          <span className="text-sm font-bold text-indigo-600">
                            {cls.studentCount || 0} / {cls.capacity || 30}
                          </span>
                        </div>

                        {/* Teachers */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-cyan-400 rounded-full"></div>
                            <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                              <GraduationCap className="w-4 h-4" />
                              Teachers:
                            </span>
                          </div>
                          <span className="text-sm font-bold text-gray-900">{cls.teacherCount || 0}</span>
                        </div>

                        {/* Schedule */}
                        {cls.schedule_json && cls.schedule_json.schedules && cls.schedule_json.schedules.length > 0 && (
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="w-2 h-2 bg-emerald-400 rounded-full"></div>
                              <span className="text-sm font-medium text-gray-600 flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                Schedule:
                              </span>
                            </div>
                            <span className="text-sm font-bold text-emerald-600">{cls.schedule_json.schedules[0].day}</span>
                          </div>
                        )}
                      </div>

                      {/* Divider */}
                      <div className="h-px bg-gradient-to-r from-indigo-200 via-cyan-200 to-transparent"></div>

                      {/* View Details Button */}
                      <button
                        onClick={() => setSelectedClassDetails(cls)}
                        className="w-full bg-gradient-to-r from-indigo-500 to-cyan-500 text-white px-4 py-3 rounded-xl hover:from-indigo-600 hover:to-cyan-600 flex items-center justify-center gap-2 font-semibold shadow-md hover:shadow-lg transition-all duration-300 hover:scale-105"
                      >
                        <Eye className="w-5 h-5" />
                        <span>View Details</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            {/* Premium Header */}
            <div className="bg-gradient-to-r from-purple-600 via-purple-500 to-pink-500 rounded-2xl shadow-xl p-8">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-3xl font-bold text-white flex items-center">
                    <Users className="w-8 h-8 mr-3" />
                    My Students
                  </h2>
                  <p className="text-purple-100 mt-2 text-lg">
                    {students.filter((s: any) => studentClassFilter === 'all' || s.class === studentClassFilter).length} {students.filter((s: any) => studentClassFilter === 'all' || s.class === studentClassFilter).length === 1 ? 'student' : 'students'} under your guidance
                  </p>
                </div>
                <button
                  onClick={() => window.location.reload()}
                  className="bg-white/20 backdrop-blur-md text-white px-6 py-3 rounded-xl hover:bg-white/30 flex items-center gap-2 border border-white/30 shadow-lg transition-all duration-300 hover:scale-105"
                >
                  <RefreshCw className="w-5 h-5" />
                  Refresh
                </button>
              </div>
            </div>

            {/* Class Filter */}
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center gap-4">
                <label className="text-gray-700 font-semibold flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  Filter by Class:
                </label>
                <select
                  value={studentClassFilter}
                  onChange={(e) => setStudentClassFilter(e.target.value)}
                  className="flex-1 max-w-md px-4 py-3 border-2 border-purple-200 rounded-xl focus:ring-4 focus:ring-purple-100 focus:border-purple-500 bg-gradient-to-r from-purple-50 to-pink-50 font-medium text-gray-700 hover:border-purple-300 transition-all duration-300"
                >
                  <option value="all">All Classes ({students.length} students)</option>
                  {myClasses.map((cls: any) => (
                    <option key={cls.id} value={cls.name}>
                      {cls.name} ({students.filter((s: any) => s.class === cls.name).length} students)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {students.length === 0 ? (
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl shadow-lg p-16 text-center border border-purple-100">
                <div className="bg-purple-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Users className="w-12 h-12 text-purple-600" />
                </div>
                <p className="text-gray-700 text-xl font-semibold">No students assigned yet</p>
                <p className="text-gray-500 mt-3 text-lg">
                  Students will appear here once they are enrolled in your classes
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden border-l-4 border-purple-500">
                {/* Table Header */}
                <div className="bg-gradient-to-r from-purple-100 to-pink-100 px-6 py-4">
                  <div className="grid grid-cols-12 gap-4 font-semibold text-purple-900 text-sm uppercase tracking-wide">
                    <div className="col-span-3">Student</div>
                    <div className="col-span-2">Class</div>
                    <div className="col-span-3">Email</div>
                    <div className="col-span-2">Status</div>
                    <div className="col-span-2 text-center">Actions</div>
                  </div>
                </div>

                {/* Table Body */}
                <div className="divide-y divide-gray-100">
                  {students
                    .filter((student: any) => studentClassFilter === 'all' || student.class === studentClassFilter)
                    .map((student: any, index: number) => (
                      <div
                        key={student.id}
                        className="group px-6 py-5 hover:bg-gradient-to-r hover:from-purple-50 hover:to-pink-50 transition-all duration-300"
                      >
                        <div className="grid grid-cols-12 gap-4 items-center">
                          {/* Student Info */}
                          <div className="col-span-3 flex items-center gap-3">
                            <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-100 to-pink-100 rounded-xl flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300">
                              <User className="w-6 h-6 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-gray-900 truncate group-hover:text-purple-600 transition-colors duration-300">
                                {student.name}
                              </p>
                              {student.age && (
                                <p className="text-sm text-gray-500">{student.age} years</p>
                              )}
                            </div>
                          </div>

                          {/* Class */}
                          <div className="col-span-2">
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-semibold bg-purple-100 text-purple-700 border border-purple-200">
                              {student.class || 'Not assigned'}
                            </span>
                          </div>

                          {/* Email */}
                          <div className="col-span-3">
                            <p className="text-sm text-gray-600 truncate">{student.email || 'N/A'}</p>
                          </div>

                          {/* Status */}
                          <div className="col-span-2">
                            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                              student.status === 'active'
                                ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                                : 'bg-gray-100 text-gray-700 border border-gray-200'
                            }`}>
                              {student.status}
                            </span>
                          </div>

                          {/* Actions */}
                          <div className="col-span-2 flex items-center justify-center gap-2">
                            <button
                              onClick={() => router.push(`/student-management?studentId=${student.id}`)}
                              className="p-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg hover:from-emerald-600 hover:to-teal-600 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
                              title="Open Student Quran Management"
                            >
                              <BookOpen className="w-5 h-5" />
                            </button>

                            <button
                              onClick={() => setSelectedStudentDetails(student)}
                              className="p-2.5 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-110"
                              title="View Student Details"
                            >
                              <Eye className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab - Matching Homework Layout */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
              <div>
                <h2 className="text-2xl font-bold flex items-center">
                  <FileText className="w-7 h-7 mr-3" />
                  Assignment Management
                </h2>
                <p className="text-blue-100 mt-1">Manage all assignments you've created for your students</p>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="flex items-center space-x-4">
                <select
                  value={assignmentsFilter}
                  onChange={(e) => setAssignmentsFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Assignments</option>
                  <option value="assigned">Pending</option>
                  <option value="completed">Completed</option>
                </select>

                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by student, title, or description..."
                    value={assignmentsSearchQuery}
                    onChange={(e) => setAssignmentsSearchQuery(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Assignment Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-2 gap-6">
              {transformedAssignments
                .filter((assignment: any) => {
                  // Status filter
                  let matchesStatus = false;
                  if (assignmentsFilter === 'all') matchesStatus = true;
                  else if (assignmentsFilter === 'late') matchesStatus = assignment.late;
                  else matchesStatus = assignment.status === assignmentsFilter;

                  // Search filter
                  const searchLower = assignmentsSearchQuery.toLowerCase();
                  const matchesSearch = !assignmentsSearchQuery ||
                    assignment.studentName?.toLowerCase().includes(searchLower) ||
                    assignment.title?.toLowerCase().includes(searchLower) ||
                    assignment.description?.toLowerCase().includes(searchLower);

                  return matchesStatus && matchesSearch;
                })
                .map((assignment: any) => (
                <div key={assignment.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                  <div className={`h-2 ${
                    assignment.color === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                    'bg-gradient-to-r from-blue-500 to-indigo-500'
                  }`}></div>

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">
                          {assignment.studentName}
                        </h3>
                        <p className="text-sm text-gray-500">{assignment.class} • {assignment.studentId}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        assignment.status === 'completed' ? 'bg-green-100 text-green-700' :
                        assignment.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                        assignment.status === 'reviewed' ? 'bg-purple-100 text-purple-700' :
                        assignment.late ? 'bg-red-100 text-red-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {assignment.late && assignment.status !== 'completed' ? 'LATE' : assignment.status}
                      </span>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-sm font-medium text-gray-700">
                        📝 {assignment.title}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Assigned:</span>
                        <span className="text-gray-700">{assignment.assignedDate}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Due Date:</span>
                        <span className={assignment.late ? 'text-red-600 font-medium' : 'text-gray-700'}>
                          {assignment.dueDate}
                        </span>
                      </div>
                    </div>

                    {assignment.status !== 'completed' && (
                      <div className="mt-4 pt-4 border-t flex justify-end">
                        <button
                          onClick={() => markAssignmentComplete(assignment.id)}
                          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
                        >
                          Mark Complete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {transformedAssignments.filter((assignment: any) => {
              let matchesStatus = false;
              if (assignmentsFilter === 'all') matchesStatus = true;
              else if (assignmentsFilter === 'late') matchesStatus = assignment.late;
              else matchesStatus = assignment.status === assignmentsFilter;

              const searchLower = assignmentsSearchQuery.toLowerCase();
              const matchesSearch = !assignmentsSearchQuery ||
                assignment.studentName?.toLowerCase().includes(searchLower) ||
                assignment.title?.toLowerCase().includes(searchLower) ||
                assignment.description?.toLowerCase().includes(searchLower);

              return matchesStatus && matchesSearch;
            }).length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No assignments found</p>
                <p className="text-gray-400 text-sm mt-1">
                  {assignmentsSearchQuery ? 'Try a different search term' : 'Create assignments in Student Management Dashboard'}
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'gradebook' && (
          <GradebookPanel userRole="teacher" />
        )}

        {activeTab === 'attendance' && (
          <AttendancePanel userRole="teacher" teacherClasses={myClasses} teacherStudents={students} />
        )}

        {activeTab === 'classes' && (
          <ClassesPanel userRole="teacher" />
        )}

        {activeTab === 'messages' && (
          <MessagesPanel userRole="teacher" />
        )}

        {activeTab === 'events' && (
          <CalendarPanel userRole="teacher" />
        )}

        {activeTab === 'mastery' && (
          <MasteryPanel userRole="teacher" />
        )}
      </main>

      {/* Class Details Modal - Compact Design */}
      {selectedClassDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-6xl w-full h-[85vh] flex flex-col">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-5 text-white rounded-t-xl flex-shrink-0">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                    <BookOpen className="w-8 h-8" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold">{selectedClassDetails.name}</h2>
                    <div className="flex gap-4 mt-1 text-sm text-blue-100">
                      {selectedClassDetails.room && (
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" /> Room {selectedClassDetails.room}
                        </span>
                      )}
                      {selectedClassDetails.grade_level && (
                        <span>Grade: {selectedClassDetails.grade_level}</span>
                      )}
                      <span className="flex items-center gap-1">
                        <Users className="w-4 h-4" /> {selectedClassDetails.studentCount || 0}/{selectedClassDetails.capacity || 30}
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedClassDetails(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content - 2 Column Layout */}
            <div className="flex-1 overflow-hidden p-6">
              <div className="grid grid-cols-2 gap-6 h-full">
                {/* Left Column */}
                <div className="space-y-4 overflow-y-auto pr-2">
                  {/* Teachers Section */}
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 flex items-center text-sm">
                      <GraduationCap className="w-4 h-4 mr-2 text-blue-600" />
                      Teachers ({selectedClassDetails.teachers?.length || 0})
                    </h3>
                    <div className="space-y-2">
                      {selectedClassDetails.teachers && selectedClassDetails.teachers.length > 0 ? (
                        selectedClassDetails.teachers.map((teacher: any) => (
                          <div key={teacher.id} className="bg-white p-3 rounded-lg shadow-sm">
                            <p className="font-medium text-gray-900 text-sm">{teacher.name}</p>
                            <p className="text-xs text-gray-600">{teacher.email}</p>
                            {teacher.subject && (
                              <p className="text-xs text-blue-600 mt-1">{teacher.subject}</p>
                            )}
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-gray-500">No teachers assigned</p>
                      )}
                    </div>
                  </div>

                  {/* Schedule Section */}
                  {selectedClassDetails.schedule_json && selectedClassDetails.schedule_json.schedules && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <h3 className="font-semibold text-gray-900 mb-3 flex items-center text-sm">
                        <Clock className="w-4 h-4 mr-2 text-green-600" />
                        Class Schedule
                      </h3>
                      <div className="space-y-2">
                        {selectedClassDetails.schedule_json.schedules.map((schedule: any, idx: number) => (
                          <div key={idx} className="bg-white p-3 rounded-lg shadow-sm">
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-green-600" />
                                <span className="font-medium text-sm text-gray-900">{schedule.day}</span>
                              </div>
                              <div className="flex items-center gap-2 text-xs text-gray-600">
                                <Clock className="w-3 h-3" />
                                {schedule.startTime} - {schedule.endTime}
                              </div>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">Duration: {schedule.duration} minutes</p>
                          </div>
                        ))}
                        {selectedClassDetails.schedule_json.timezone && (
                          <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                            <MapPin className="w-3 h-3" />
                            Timezone: {selectedClassDetails.schedule_json.timezone}
                          </p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Class Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h3 className="font-semibold text-gray-900 mb-3 text-sm">Class Information</h3>
                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div>
                        <p className="text-gray-500">Capacity</p>
                        <p className="font-semibold text-gray-900">
                          {selectedClassDetails.studentCount || 0} / {selectedClassDetails.capacity || 30}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">Created</p>
                        <p className="font-semibold text-gray-900">
                          {selectedClassDetails.created_at ? new Date(selectedClassDetails.created_at).toLocaleDateString() : 'N/A'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Column - Students */}
                <div className="bg-purple-50 rounded-lg p-4 overflow-y-auto">
                  <h3 className="font-semibold text-gray-900 mb-3 flex items-center text-sm sticky top-0 bg-purple-50 pb-2">
                    <Users className="w-4 h-4 mr-2 text-purple-600" />
                    Students ({selectedClassDetails.students?.length || 0})
                  </h3>
                  {selectedClassDetails.students && selectedClassDetails.students.length > 0 ? (
                    <div className="space-y-2">
                      {selectedClassDetails.students.map((student: any) => (
                        <div key={student.id} className="bg-white p-3 rounded-lg shadow-sm hover:shadow-md transition-shadow">
                          <div className="flex justify-between items-start">
                            <div className="flex-1">
                              <p className="font-medium text-gray-900 text-sm">{student.name}</p>
                              <p className="text-xs text-gray-600">{student.email}</p>
                              <div className="flex gap-3 mt-2 text-xs text-gray-500">
                                {student.age && <span>Age: {student.age}</span>}
                                {student.gender && <span>Gender: {student.gender}</span>}
                              </div>
                            </div>
                            <span className={`px-2 py-1 text-xs font-semibold rounded-full flex-shrink-0 ${
                              student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                            }`}>
                              {student.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500">
                      <Users className="w-12 h-12 mb-2 opacity-50" />
                      <p className="text-sm">No students enrolled</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-3 rounded-b-xl flex justify-end flex-shrink-0">
              <button
                onClick={() => setSelectedClassDetails(null)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-2 rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all shadow-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Student Details Modal */}
      {selectedStudentDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-4 text-white rounded-t-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                    <User className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedStudentDetails.name}</h2>
                    <p className="text-xs text-blue-100">{selectedStudentDetails.email}</p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedStudentDetails(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 p-2 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Content - Compact 3-column layout */}
            <div className="p-5">
              <div className="grid grid-cols-3 gap-4 mb-4">
                {/* Column 1: Basic Info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 border-b pb-1">
                    <Info className="w-4 h-4 text-blue-600" />
                    Basic Info
                  </h3>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Age</p>
                    <p className="text-base font-semibold text-gray-900">{selectedStudentDetails.age || 'N/A'} years</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Gender</p>
                    <p className="text-base font-semibold text-gray-900">{selectedStudentDetails.gender || 'N/A'}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Grade</p>
                    <p className="text-base font-semibold text-gray-900">{selectedStudentDetails.grade || 'N/A'}</p>
                  </div>
                  <div className="bg-blue-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Status</p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${
                      selectedStudentDetails.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedStudentDetails.status}
                    </span>
                  </div>
                </div>

                {/* Column 2: Contact Info */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 border-b pb-1">
                    <Phone className="w-4 h-4 text-green-600" />
                    Contact
                  </h3>
                  <div className="bg-green-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-gray-900 break-all">{selectedStudentDetails.email}</p>
                  </div>
                  {selectedStudentDetails.phone && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Phone</p>
                      <p className="text-sm font-medium text-gray-900">{selectedStudentDetails.phone}</p>
                    </div>
                  )}
                  {selectedStudentDetails.address && (
                    <div className="bg-green-50 p-3 rounded-lg">
                      <p className="text-xs text-gray-500">Address</p>
                      <p className="text-sm font-medium text-gray-900">{selectedStudentDetails.address}</p>
                    </div>
                  )}
                </div>

                {/* Column 3: Class & Actions */}
                <div className="space-y-3">
                  <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 border-b pb-1">
                    <GraduationCap className="w-4 h-4 text-purple-600" />
                    Class
                  </h3>
                  <div className="bg-purple-50 p-3 rounded-lg">
                    <p className="text-xs text-gray-500">Assigned Class</p>
                    <p className="text-base font-semibold text-gray-900">{selectedStudentDetails.class || 'Not assigned'}</p>
                  </div>

                  {/* Quick Action Button */}
                  <div className="pt-2">
                    <h3 className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 mb-2">
                      <Zap className="w-4 h-4 text-yellow-600" />
                      Quick Action
                    </h3>
                    <button
                      onClick={() => {
                        setSelectedStudentDetails(null);
                        router.push(`/student-management?studentId=${selectedStudentDetails.id}`);
                      }}
                      className="w-full bg-gradient-to-r from-green-600 to-blue-600 text-white px-3 py-2.5 rounded-lg hover:from-green-700 hover:to-blue-700 transition-all shadow-md flex items-center justify-center gap-2 text-sm"
                    >
                      <BookOpen className="w-4 h-4" />
                      Open Quran Management
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}