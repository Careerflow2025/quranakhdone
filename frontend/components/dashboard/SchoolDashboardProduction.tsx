'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
import { useSchoolData } from '@/hooks/useSchoolData';
import SchoolProfile from './SchoolProfile';
import {
  Users, UserPlus, GraduationCap, BookOpen, Calendar, Bell, Settings, Home, Search, Filter,
  Download, Upload, Edit, Trash2, MoreVertical, Check, AlertCircle, Clock, FileText, Award,
  TrendingUp, Eye, Mail, Phone, MapPin, BarChart3, ChevronRight, ChevronLeft, Folder, FolderOpen, LogOut,
  Menu, Shield, Key, CreditCard, DollarSign, Target, Activity, Zap, Package, Grid, List,
  ChevronDown, School, PieChart, Move, ArrowRight, X, XCircle, CheckCircle, RefreshCw, Send, Plus, Info
} from 'lucide-react';

const ClassBuilder = dynamic(() => import('./ClassBuilder'), {
  ssr: false,
  loading: () => <div className="flex items-center justify-center p-8"><div className="text-gray-500">Loading Class Builder...</div></div>
});

export default function SchoolDashboardProduction() {
  // Get real data from Supabase
  const {
    isLoading,
    error,
    schoolInfo,
    stats,
    students,
    teachers,
    parents,
    classes,
    recentActivities,
    upcomingEvents,
    credentials,
    refreshData,
    setStudents,
    setTeachers,
    setParents,
    setClasses,
    setCredentials
  } = useSchoolData();

  // Refs for dropdown click-outside detection
  const notificationRef = useRef(null);
  const settingsRef = useRef(null);

  // State Management
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
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
  const [showNotificationPreferences, setShowNotificationPreferences] = useState(false);

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event: any) => {
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

  // Loading state
  if (isLoading) {
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
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Data</h2>
          <p className="text-gray-600 mb-4">{error}</p>
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

  // Empty state for new schools
  const EmptyState = ({ type }) => (
    <div className="bg-white rounded-xl p-12 text-center">
      <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
        {type === 'students' && <GraduationCap className="w-10 h-10 text-emerald-600" />}
        {type === 'teachers' && <Users className="w-10 h-10 text-emerald-600" />}
        {type === 'classes' && <School className="w-10 h-10 text-emerald-600" />}
        {type === 'parents' && <Users className="w-10 h-10 text-emerald-600" />}
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        No {type} yet
      </h3>
      <p className="text-gray-600 mb-6">
        Start by adding your first {type === 'classes' ? 'class' : type.slice(0, -1)}.
      </p>
      <button
        onClick={() => {
          setAddModalType(type === 'classes' ? 'class' : type.slice(0, -1));
          setShowAddModal(true);
        }}
        className="inline-flex items-center px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
      >
        <Plus className="w-5 h-5 mr-2" />
        Add {type === 'classes' ? 'Class' : type.slice(0, -1)}
      </button>
    </div>
  );

  // Render content
  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center">
              <School className="w-6 h-6 text-white" />
            </div>
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
            { id: 'messages', label: 'Messages', icon: Mail },
            { id: 'calendar', label: 'Calendar', icon: Calendar },
            { id: 'reports', label: 'Reports', icon: BarChart3 },
            { id: 'credentials', label: 'Credentials', icon: Key },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((item: any) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
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
          <button className="w-full flex items-center space-x-3 px-3 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors">
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-auto">
        {/* Header */}
        <header className="bg-white shadow-sm px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>

            <div className="flex items-center space-x-4">
              <button
                onClick={refreshData}
                className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
              >
                <RefreshCw className="w-5 h-5" />
              </button>

              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100 relative"
                >
                  <Bell className="w-5 h-5" />
                  <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
              </div>

              <div className="relative" ref={settingsRef}>
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className="flex items-center space-x-2 p-2 text-gray-600 hover:text-gray-900 rounded-lg hover:bg-gray-100"
                >
                  <div className="w-8 h-8 bg-emerald-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {schoolInfo?.name?.charAt(0) || 'S'}
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              {/* Stats Grid */}
              <div className="grid grid-cols-4 gap-4">
                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <GraduationCap className="w-8 h-8 text-emerald-600" />
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Active</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalStudents}</h3>
                  <p className="text-gray-600 text-sm">Total Students</p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-8 h-8 text-blue-600" />
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Active</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalTeachers}</h3>
                  <p className="text-gray-600 text-sm">Total Teachers</p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <Users className="w-8 h-8 text-purple-600" />
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Active</span>
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">{stats.totalParents}</h3>
                  <p className="text-gray-600 text-sm">Total Parents</p>
                </div>

                <div className="bg-white rounded-xl p-6 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <School className="w-8 h-8 text-orange-600" />
                    <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Active</span>
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

              {/* Upcoming Events */}
              {upcomingEvents.length > 0 && (
                <div className="bg-white rounded-xl p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Events</h3>
                  <div className="space-y-3">
                    {upcomingEvents.map((event: any) => (
                      <div key={event.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-5 h-5 text-emerald-600" />
                          <div>
                            <p className="font-medium text-gray-900">{event.title}</p>
                            <p className="text-sm text-gray-500">{event.date} at {event.time}</p>
                          </div>
                        </div>
                        <button className="text-emerald-600 hover:text-emerald-700">
                          <ChevronRight className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'students' && (
            <div>
              {students.length === 0 ? (
                <EmptyState type="students" />
              ) : (
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        Students ({students.length})
                      </h3>
                      <button
                        onClick={() => {
                          setAddModalType('student');
                          setShowAddModal(true);
                        }}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        <Plus className="w-5 h-5 inline mr-2" />
                        Add Student
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    {/* Student list would go here */}
                    <p className="text-gray-600">Student management interface</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'teachers' && (
            <div>
              {teachers.length === 0 ? (
                <EmptyState type="teachers" />
              ) : (
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        Teachers ({teachers.length})
                      </h3>
                      <button
                        onClick={() => {
                          setAddModalType('teacher');
                          setShowAddModal(true);
                        }}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        <Plus className="w-5 h-5 inline mr-2" />
                        Add Teacher
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    {/* Teacher list would go here */}
                    <p className="text-gray-600">Teacher management interface</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'classes' && (
            <div>
              {classes.length === 0 ? (
                <EmptyState type="classes" />
              ) : (
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        Classes ({classes.length})
                      </h3>
                      <button
                        onClick={() => {
                          setAddModalType('class');
                          setShowAddModal(true);
                        }}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        <Plus className="w-5 h-5 inline mr-2" />
                        Add Class
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    {/* Class list would go here */}
                    <p className="text-gray-600">Class management interface</p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'parents' && (
            <div>
              {parents.length === 0 ? (
                <EmptyState type="parents" />
              ) : (
                <div className="bg-white rounded-xl shadow-sm">
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-gray-900">
                        Parents ({parents.length})
                      </h3>
                      <button
                        onClick={() => {
                          setAddModalType('parent');
                          setShowAddModal(true);
                        }}
                        className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                      >
                        <Plus className="w-5 h-5 inline mr-2" />
                        Add Parent
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    {/* Parent list would go here */}
                    <p className="text-gray-600">Parent management interface</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}