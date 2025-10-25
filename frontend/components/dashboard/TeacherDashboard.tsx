'use client';

import { useState, useEffect, useRef } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useTeacherData } from '@/hooks/useTeacherData';
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
  // Get real teacher data from database
  const {
    isLoading: teacherDataLoading,
    error: teacherDataError,
    teacherInfo,
    stats,
    students,
    classes: myClasses,
    assignments,
    homework: homeworkData,
    targets,
    messages: teacherMessages,
    refreshData
  } = useTeacherData();

  // State Management
  const [activeTab, setActiveTab] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Get notifications from API
  const {
    notifications: dbNotifications,
    unreadCount,
    isLoading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    refresh: refreshNotifications
  } = useNotifications();

  // Homework State
  const [homeworkFilter, setHomeworkFilter] = useState('all');
  const [showHomeworkDetail, setShowHomeworkDetail] = useState<any>(null);

  // Class Details State
  const [selectedClassDetails, setSelectedClassDetails] = useState<any>(null);

  // Navigation tabs
  const tabs = ['overview', 'my classes', 'students', 'assignments', 'gradebook', 'mastery', 'homework', 'targets', 'attendance', 'messages', 'events'];

  // Function to mark homework as complete (turns green to gold)
  const markHomeworkComplete = async (homeworkId: string) => {
    try {
      // Update homework/assignment status in database
      await refreshData();
    } catch (error) {
      console.error('Error marking homework complete:', error);
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <School className="w-8 h-8 text-blue-600 mr-3" />
              <h1 className="text-xl font-bold text-gray-900">Teacher Dashboard</h1>
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

              {/* Profile */}
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <User className="w-6 h-6" />
                <span className="hidden md:inline">{teacherInfo?.name || 'Teacher'}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab: any) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeTab === tab
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1).replace(' ', ' ')}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Students</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalStudents}</p>
                  </div>
                  <Users className="w-12 h-12 text-blue-100" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Homework</p>
                    <p className="text-2xl font-bold text-green-600">{stats.activeHomework}</p>
                  </div>
                  <BookOpen className="w-12 h-12 text-green-100" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Targets</p>
                    <p className="text-2xl font-bold text-purple-600">{stats.activeTargets}</p>
                  </div>
                  <Target className="w-12 h-12 text-purple-100" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">My Classes</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.totalClasses}</p>
                  </div>
                  <BookOpen className="w-12 h-12 text-gray-300" />
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <button
                  onClick={() => setActiveTab('homework')}
                  className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-green-700 font-medium"
                >
                  <BookOpen className="w-6 h-6 mx-auto mb-2" />
                  Create Homework
                </button>
                <button
                  onClick={() => setActiveTab('targets')}
                  className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 font-medium"
                >
                  <Target className="w-6 h-6 mx-auto mb-2" />
                  Manage Targets
                </button>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-medium"
                >
                  <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                  Take Attendance
                </button>
                <button
                  onClick={() => setActiveTab('classes')}
                  className="p-4 bg-indigo-50 hover:bg-indigo-100 rounded-lg text-indigo-700 font-medium"
                >
                  <BookOpen className="w-6 h-6 mx-auto mb-2" />
                  Manage Classes
                </button>
                <button
                  onClick={() => setActiveTab('messages')}
                  className="p-4 bg-orange-50 hover:bg-orange-100 rounded-lg text-orange-700 font-medium"
                >
                  <Mail className="w-6 h-6 mx-auto mb-2" />
                  Send Message
                </button>
              </div>
            </div>
          </div>
        )}

        {/* HOMEWORK TAB - NEW! */}
        {activeTab === 'homework' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center">
                    <BookOpen className="w-7 h-7 mr-3" />
                    Homework Management
                  </h2>
                  <p className="text-green-100 mt-1">Manage all green highlights (homework) you've assigned</p>
                </div>
                <button
                  className="bg-white text-green-600 px-6 py-3 rounded-lg font-semibold hover:bg-green-50 transition flex items-center"
                  onClick={() => alert('Open Student Management Dashboard to create homework')}
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Homework
                </button>
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
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                  <option value="overdue">Overdue</option>
                </select>

                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search by student, surah, or note..."
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
              </div>
            </div>

            {/* Homework Cards */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {homeworkData
                .filter((hw: any) => homeworkFilter === 'all' || hw.status === homeworkFilter)
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
                      <div className="flex justify-between">
                        <span className="text-gray-500">Replies:</span>
                        <span className="text-blue-600">{homework.replies} messages</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <button
                        onClick={() => setShowHomeworkDetail(homework)}
                        className="text-blue-600 hover:text-blue-700 font-medium text-sm"
                      >
                        View Details
                      </button>
                      {homework.status !== 'completed' && (
                        <button
                          onClick={() => markHomeworkComplete(homework.id)}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 text-sm font-medium"
                        >
                          Mark Complete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {homeworkData.filter((hw: any) => homeworkFilter === 'all' || hw.status === homeworkFilter).length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No homework found</p>
                <p className="text-gray-400 text-sm mt-1">Create homework by highlighting text in Student Management Dashboard</p>
              </div>
            )}
          </div>
        )}

        {/* Targets Tab */}
        {activeTab === 'targets' && (
          <TargetsPanel />
        )}

        {/* My Classes Tab */}
        {activeTab === 'my classes' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">My Classes ({myClasses.length})</h2>
              <button
                onClick={refreshData}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>

            {myClasses.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No classes assigned yet</p>
                <p className="text-gray-400 mt-2">
                  Your classes will appear here once assigned by the school administrator
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {myClasses.map((cls: any) => (
                  <div key={cls.id} className="bg-white rounded-lg shadow-sm p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex-shrink-0 h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                        <BookOpen className="w-6 h-6 text-purple-600" />
                      </div>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900">{cls.name}</h3>
                    {cls.room && (
                      <p className="text-gray-500 mt-1">Room {cls.room}</p>
                    )}
                    <div className="mt-4 space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Class ID:</span>
                        <span className="font-medium text-xs text-gray-600">{cls.id.slice(0, 8)}...</span>
                      </div>
                      {cls.schedule_json && (
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-500">Schedule:</span>
                          <span className="font-medium">Available</span>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => setSelectedClassDetails(cls)}
                      className="mt-4 w-full bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100 transition-colors"
                    >
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">My Students ({students.length})</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh
              </button>
            </div>

            {students.length === 0 ? (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg font-medium">No students assigned yet</p>
                <p className="text-gray-400 mt-2">
                  Students will appear here once they are enrolled in your classes
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-lg shadow-sm overflow-hidden">
                <table className="min-w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Student
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Class
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Email
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {students.map((student: any) => (
                      <tr key={student.id}>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <div className="flex-shrink-0 h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="w-5 h-5 text-blue-600" />
                            </div>
                            <div className="ml-4">
                              <div className="text-sm font-medium text-gray-900">{student.name}</div>
                              {student.age && (
                                <div className="text-sm text-gray-500">{student.age} years old</div>
                              )}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{student.class || 'Not assigned'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">{student.email || 'N/A'}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            student.status === 'active'
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {student.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button className="text-blue-600 hover:text-blue-900">View Details</button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Other tabs (assignments, gradebook, attendance, messages, events) remain the same */}
        {activeTab === 'assignments' && (
          <AssignmentsPanel userRole="teacher" />
        )}

        {activeTab === 'gradebook' && (
          <GradebookPanel userRole="teacher" />
        )}

        {activeTab === 'attendance' && (
          <AttendancePanel userRole="teacher" />
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

      {/* Class Details Modal */}
      {selectedClassDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-6 text-white">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-2xl font-bold mb-2">{selectedClassDetails.name}</h2>
                  {selectedClassDetails.room && (
                    <p className="text-blue-100">Room: {selectedClassDetails.room}</p>
                  )}
                  {selectedClassDetails.grade_level && (
                    <p className="text-blue-100">Grade Level: {selectedClassDetails.grade_level}</p>
                  )}
                </div>
                <button
                  onClick={() => setSelectedClassDetails(null)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Class Information */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Class ID</p>
                  <p className="font-mono text-xs text-gray-900">{selectedClassDetails.id}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">School ID</p>
                  <p className="font-mono text-xs text-gray-900">{selectedClassDetails.school_id}</p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Capacity</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {selectedClassDetails.studentCount || 0} / {selectedClassDetails.capacity || 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Created</p>
                  <p className="text-sm text-gray-900">
                    {selectedClassDetails.created_at ? new Date(selectedClassDetails.created_at).toLocaleDateString() : 'N/A'}
                  </p>
                </div>
              </div>

              {/* Teachers Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <GraduationCap className="w-5 h-5 mr-2 text-blue-600" />
                  Assigned Teachers ({selectedClassDetails.teachers?.length || 0})
                </h3>
                {selectedClassDetails.teachers && selectedClassDetails.teachers.length > 0 ? (
                  <div className="space-y-3">
                    {selectedClassDetails.teachers.map((teacher: any) => (
                      <div key={teacher.id} className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="font-semibold text-gray-900">{teacher.name}</p>
                            <p className="text-sm text-gray-600">{teacher.email}</p>
                            {teacher.subject && (
                              <p className="text-sm text-gray-600 mt-1">Subject: {teacher.subject}</p>
                            )}
                            {teacher.qualification && (
                              <p className="text-sm text-gray-600">Qualification: {teacher.qualification}</p>
                            )}
                          </div>
                          {teacher.phone && (
                            <div className="flex items-center text-sm text-gray-600">
                              <Phone className="w-4 h-4 mr-1" />
                              {teacher.phone}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">No teachers assigned</p>
                )}
              </div>

              {/* Students Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                  <Users className="w-5 h-5 mr-2 text-purple-600" />
                  Enrolled Students ({selectedClassDetails.students?.length || 0})
                </h3>
                {selectedClassDetails.students && selectedClassDetails.students.length > 0 ? (
                  <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Age</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Gender</th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {selectedClassDetails.students.map((student: any) => (
                          <tr key={student.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{student.name}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{student.email}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{student.age || 'N/A'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{student.gender || 'N/A'}</td>
                            <td className="px-4 py-3">
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                student.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                              }`}>
                                {student.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-4 bg-gray-50 rounded-lg">No students enrolled</p>
                )}
              </div>

              {/* Schedule Section */}
              {selectedClassDetails.schedule_json && (
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3 flex items-center">
                    <Calendar className="w-5 h-5 mr-2 text-green-600" />
                    Class Schedule
                  </h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <pre className="text-sm text-gray-700 whitespace-pre-wrap">
                      {JSON.stringify(selectedClassDetails.schedule_json, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-6 py-4 flex justify-end">
              <button
                onClick={() => setSelectedClassDetails(null)}
                className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}