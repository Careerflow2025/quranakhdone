'use client';

import { useState, useEffect, useRef } from 'react';
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

export default function TeacherDashboard() {
  // State Management
  const [activeTab, setActiveTab] = useState('overview');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  // Homework State
  const [homeworkList, setHomeworkList] = useState([]);
  const [homeworkFilter, setHomeworkFilter] = useState('all');
  const [showHomeworkDetail, setShowHomeworkDetail] = useState<any>(null);

  // Targets State
  const [targets, setTargets] = useState([]);
  const [showCreateTarget, setShowCreateTarget] = useState(false);
  const [targetForm, setTargetForm] = useState({
    title: '',
    description: '',
    type: 'individual', // 'individual', 'class', 'school'
    assignedTo: '',
    category: 'memorization',
    dueDate: '',
    milestones: []
  });

  // Sample Data for demonstration
  const myClasses = [
    { id: 1, name: 'Class 6A', room: '101', students: 22, schedule: 'Mon-Fri 8:00 AM' },
    { id: 2, name: 'Class 7B', room: '102', students: 18, schedule: 'Mon-Fri 10:00 AM' },
    { id: 3, name: 'Class 5A', room: '201', students: 20, schedule: 'Mon-Fri 2:00 PM' }
  ];

  const myStudents = [
    { id: 1, name: 'Ahmed Hassan', class: 'Class 6A', progress: 75, attendance: 95 },
    { id: 2, name: 'Fatima Al-Zahra', class: 'Class 6A', progress: 88, attendance: 100 },
    { id: 3, name: 'Abdullah Khan', class: 'Class 7B', progress: 65, attendance: 90 },
    { id: 4, name: 'Aisha Ibrahim', class: 'Class 5A', progress: 92, attendance: 98 }
  ];

  // Sample homework data (green highlights)
  const [homeworkData] = useState([
    {
      id: 'HW001',
      studentName: 'Ahmed Hassan',
      studentId: 'STU001',
      class: 'Class 6A',
      surah: 'Al-Mulk',
      ayahRange: '1-10',
      note: 'Memorize these verses by Thursday',
      assignedDate: '2025-01-18',
      dueDate: '2025-01-25',
      status: 'pending',
      replies: 2,
      color: 'green'
    },
    {
      id: 'HW002',
      studentName: 'Fatima Al-Zahra',
      studentId: 'STU002',
      class: 'Class 6A',
      surah: 'Al-Baqarah',
      ayahRange: '1-5',
      note: 'Practice recitation with proper tajweed',
      assignedDate: '2025-01-17',
      dueDate: '2025-01-24',
      status: 'in-progress',
      replies: 1,
      color: 'green'
    },
    {
      id: 'HW003',
      studentName: 'Abdullah Khan',
      studentId: 'STU003',
      class: 'Class 7B',
      surah: 'Yasin',
      ayahRange: '20-30',
      note: 'Review with focus on makharij',
      assignedDate: '2025-01-16',
      dueDate: '2025-01-23',
      status: 'completed',
      replies: 3,
      color: 'gold' // Changed to gold when completed
    }
  ]);

  // Sample targets data
  const [targetsData] = useState([
    {
      id: 'TGT001',
      title: 'Complete Juz 30 Memorization',
      description: 'All students in Class 6A to complete memorization of Juz 30',
      type: 'class',
      assignedTo: 'Class 6A',
      category: 'memorization',
      startDate: '2025-01-01',
      dueDate: '2025-03-30',
      status: 'active',
      progress: 48,
      milestones: [
        { name: 'First 5 Surahs', completed: true, date: '2025-01-30' },
        { name: 'Next 5 Surahs', completed: false, date: '2025-02-28' },
        { name: 'Final Surahs', completed: false, date: '2025-03-30' }
      ]
    },
    {
      id: 'TGT002',
      title: 'Master Noon Sakinah Rules',
      description: 'Individual target for Abdullah Khan to master tajweed rules',
      type: 'individual',
      assignedTo: 'Abdullah Khan',
      category: 'tajweed',
      startDate: '2025-01-15',
      dueDate: '2025-02-15',
      status: 'active',
      progress: 62,
      milestones: [
        { name: 'Izhar', completed: true, date: '2025-01-20' },
        { name: 'Idgham', completed: true, date: '2025-01-25' },
        { name: 'Iqlab', completed: false, date: '2025-02-05' },
        { name: 'Ikhfa', completed: false, date: '2025-02-15' }
      ]
    }
  ]);

  // Navigation tabs - INCLUDING HOMEWORK AND TARGETS
  const tabs = ['overview', 'my classes', 'students', 'assignments', 'homework', 'targets', 'attendance', 'messages', 'events'];

  // Function to mark homework as complete (turns green to gold)
  const markHomeworkComplete = (homeworkId) => {
    setHomeworkList((prev: any) => prev.map((hw: any) =>
      hw.id === homeworkId
        ? { ...hw, status: 'completed', color: 'gold' }
        : hw
    ));
  };

  // Function to create new target
  const handleCreateTarget = () => {
    const newTarget = {
      id: `TGT${Date.now()}`,
      ...targetForm,
      startDate: new Date().toISOString().split('T')[0],
      status: 'active',
      progress: 0,
      createdBy: 'Current Teacher'
    };
    setTargets((prev: any) => [...prev, newTarget]);
    setShowCreateTarget(false);
    setTargetForm({
      title: '',
      description: '',
      type: 'individual',
      assignedTo: '',
      category: 'memorization',
      dueDate: '',
      milestones: []
    });
  };

  // Add milestone to target
  const addMilestone = () => {
    setTargetForm((prev: any) => ({
      ...prev,
      milestones: [...prev.milestones, { name: '', date: '', completed: false }]
    }));
  };

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
              <button
                onClick={() => setShowNotifications(!showNotifications)}
                className="relative p-2 text-gray-600 hover:text-gray-900"
              >
                <Bell className="w-6 h-6" />
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
              </button>

              {/* Profile */}
              <button
                onClick={() => setShowProfile(!showProfile)}
                className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
              >
                <User className="w-6 h-6" />
                <span className="hidden md:inline">Dr. Fatima</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-8 overflow-x-auto">
            {tabs.map((tab) => (
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
                    <p className="text-2xl font-bold text-gray-900">60</p>
                  </div>
                  <Users className="w-12 h-12 text-blue-100" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Homework</p>
                    <p className="text-2xl font-bold text-green-600">12</p>
                  </div>
                  <BookOpen className="w-12 h-12 text-green-100" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Targets</p>
                    <p className="text-2xl font-bold text-purple-600">8</p>
                  </div>
                  <Target className="w-12 h-12 text-purple-100" />
                </div>
              </div>

              <div className="bg-white p-6 rounded-lg shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Avg Progress</p>
                    <p className="text-2xl font-bold text-gray-900">78%</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-gray-300" />
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
                  onClick={() => {
                    setActiveTab('targets');
                    setShowCreateTarget(true);
                  }}
                  className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-purple-700 font-medium"
                >
                  <Target className="w-6 h-6 mx-auto mb-2" />
                  Create Target
                </button>
                <button
                  onClick={() => setActiveTab('attendance')}
                  className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-blue-700 font-medium"
                >
                  <CheckCircle className="w-6 h-6 mx-auto mb-2" />
                  Take Attendance
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
                .map((homework) => (
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

        {/* TARGETS TAB - NEW! */}
        {activeTab === 'targets' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center">
                    <Target className="w-7 h-7 mr-3" />
                    Learning Targets
                  </h2>
                  <p className="text-purple-100 mt-1">Create and manage learning goals for students</p>
                </div>
                <button
                  onClick={() => setShowCreateTarget(true)}
                  className="bg-white text-purple-600 px-6 py-3 rounded-lg font-semibold hover:bg-purple-50 transition flex items-center"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Create Target
                </button>
              </div>
            </div>

            {/* Create Target Modal */}
            {showCreateTarget && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                  <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                      <h3 className="text-xl font-bold text-gray-900">Create Learning Target</h3>
                      <button
                        onClick={() => setShowCreateTarget(false)}
                        className="p-2 hover:bg-gray-100 rounded-lg"
                      >
                        <X className="w-5 h-5 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    {/* Target Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Type
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setTargetForm({...targetForm, type: 'individual'})}
                          className={`p-3 rounded-lg border-2 ${
                            targetForm.type === 'individual'
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <User className="w-6 h-6 mx-auto mb-1" />
                          <span className="text-sm font-medium">Individual</span>
                        </button>
                        <button
                          onClick={() => setTargetForm({...targetForm, type: 'class'})}
                          className={`p-3 rounded-lg border-2 ${
                            targetForm.type === 'class'
                              ? 'border-purple-600 bg-purple-50'
                              : 'border-gray-200'
                          }`}
                        >
                          <Users className="w-6 h-6 mx-auto mb-1" />
                          <span className="text-sm font-medium">Class</span>
                        </button>
                      </div>
                    </div>

                    {/* Assign To */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Assign To
                      </label>
                      <select
                        value={targetForm.assignedTo}
                        onChange={(e) => setTargetForm({...targetForm, assignedTo: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                      >
                        <option value="">Select...</option>
                        {targetForm.type === 'individual' ? (
                          myStudents.map((student: any) => (
                            <option key={student.id} value={student.name}>{student.name}</option>
                          ))
                        ) : (
                          myClasses.map((cls: any) => (
                            <option key={cls.id} value={cls.name}>{cls.name}</option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* Title */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Title
                      </label>
                      <input
                        type="text"
                        value={targetForm.title}
                        onChange={(e) => setTargetForm({...targetForm, title: e.target.value})}
                        placeholder="e.g., Complete Juz 30 Memorization"
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description
                      </label>
                      <textarea
                        value={targetForm.description}
                        onChange={(e) => setTargetForm({...targetForm, description: e.target.value})}
                        placeholder="Detailed description of the target..."
                        rows={3}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>

                    {/* Category */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Category
                      </label>
                      <select
                        value={targetForm.category}
                        onChange={(e) => setTargetForm({...targetForm, category: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                      >
                        <option value="memorization">Memorization</option>
                        <option value="tajweed">Tajweed</option>
                        <option value="recitation">Recitation</option>
                        <option value="understanding">Understanding</option>
                      </select>
                    </div>

                    {/* Due Date */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Due Date
                      </label>
                      <input
                        type="date"
                        value={targetForm.dueDate}
                        onChange={(e) => setTargetForm({...targetForm, dueDate: e.target.value})}
                        className="w-full px-4 py-2 border border-gray-200 rounded-lg"
                      />
                    </div>

                    {/* Milestones */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Milestones
                      </label>
                      {targetForm.milestones.map((milestone, index) => (
                        <div key={index} className="flex items-center space-x-2 mb-2">
                          <input
                            type="text"
                            value={milestone.name}
                            onChange={(e) => {
                              const newMilestones = [...targetForm.milestones];
                              newMilestones[index].name = e.target.value;
                              setTargetForm({...targetForm, milestones: newMilestones});
                            }}
                            placeholder="Milestone name"
                            className="flex-1 px-3 py-2 border border-gray-200 rounded-lg"
                          />
                          <input
                            type="date"
                            value={milestone.date}
                            onChange={(e) => {
                              const newMilestones = [...targetForm.milestones];
                              newMilestones[index].date = e.target.value;
                              setTargetForm({...targetForm, milestones: newMilestones});
                            }}
                            className="px-3 py-2 border border-gray-200 rounded-lg"
                          />
                          <button
                            onClick={() => {
                              const newMilestones = targetForm.milestones.filter((_, i) => i !== index);
                              setTargetForm({...targetForm, milestones: newMilestones});
                            }}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      <button
                        onClick={addMilestone}
                        className="text-purple-600 hover:text-purple-700 font-medium text-sm"
                      >
                        + Add Milestone
                      </button>
                    </div>
                  </div>

                  <div className="p-6 bg-gray-50 border-t flex items-center justify-end space-x-3">
                    <button
                      onClick={() => setShowCreateTarget(false)}
                      className="px-6 py-2 text-gray-600 hover:text-gray-800"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleCreateTarget}
                      className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                    >
                      Create Target
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Targets List */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {targetsData.map((target) => (
                <div key={target.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                  <div className={`h-2 ${
                    target.type === 'individual' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                    target.type === 'class' ? 'bg-gradient-to-r from-green-500 to-green-600' :
                    'bg-gradient-to-r from-purple-500 to-purple-600'
                  }`}></div>

                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-bold text-gray-900">{target.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">{target.description}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        target.type === 'individual' ? 'bg-blue-100 text-blue-700' :
                        'bg-green-100 text-green-700'
                      }`}>
                        {target.type}
                      </span>
                    </div>

                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium text-gray-900">{target.progress}%</span>
                      </div>
                      <div className="bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-600 h-2 rounded-full transition-all"
                          style={{ width: `${target.progress}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Assigned To:</span>
                        <span className="text-gray-700 font-medium">{target.assignedTo}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Due Date:</span>
                        <span className="text-gray-700">{target.dueDate}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-500">Category:</span>
                        <span className="text-gray-700 capitalize">{target.category}</span>
                      </div>
                    </div>

                    {/* Milestones */}
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm font-medium text-gray-700 mb-2">Milestones</p>
                      <div className="space-y-1">
                        {target.milestones.map((milestone, index) => (
                          <div key={index} className="flex items-center text-sm">
                            {milestone.completed ? (
                              <CheckCircle className="w-4 h-4 text-green-600 mr-2" />
                            ) : (
                              <div className="w-4 h-4 border-2 border-gray-300 rounded-full mr-2"></div>
                            )}
                            <span className={milestone.completed ? 'text-gray-500 line-through' : 'text-gray-700'}>
                              {milestone.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="mt-4 pt-4 border-t flex items-center justify-between">
                      <button className="text-purple-600 hover:text-purple-700 font-medium text-sm">
                        View Details
                      </button>
                      <button className="text-gray-600 hover:text-gray-700 font-medium text-sm">
                        Update Progress
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Empty State */}
            {targetsData.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl">
                <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500 text-lg">No targets created yet</p>
                <p className="text-gray-400 text-sm mt-1">Create your first learning target for students</p>
                <button
                  onClick={() => setShowCreateTarget(true)}
                  className="mt-4 px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Create First Target
                </button>
              </div>
            )}
          </div>
        )}

        {/* My Classes Tab */}
        {activeTab === 'my classes' && (
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-gray-900">My Classes</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {myClasses.map((cls) => (
                <div key={cls.id} className="bg-white rounded-lg shadow-sm p-6">
                  <h3 className="text-lg font-semibold text-gray-900">{cls.name}</h3>
                  <p className="text-gray-500 mt-1">Room {cls.room}</p>
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Students:</span>
                      <span className="font-medium">{cls.students}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">Schedule:</span>
                      <span className="font-medium">{cls.schedule}</span>
                    </div>
                  </div>
                  <button className="mt-4 w-full bg-blue-50 text-blue-600 py-2 rounded-lg hover:bg-blue-100">
                    View Details
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === 'students' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">My Students</h2>
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
                Open Student Management
              </button>
            </div>
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
                      Progress
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Attendance
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {myStudents.map((student) => (
                    <tr key={student.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">{student.name}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-500">{student.class}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 mr-2">
                            <div
                              className="bg-green-600 h-2 rounded-full"
                              style={{ width: `${student.progress}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-gray-600">{student.progress}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{student.attendance}%</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button className="text-blue-600 hover:text-blue-900">View</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Other tabs (assignments, attendance, messages, events) remain the same */}
        {activeTab === 'assignments' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Assignments</h2>
            <p className="text-gray-500">Assignment management coming soon...</p>
          </div>
        )}

        {activeTab === 'attendance' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Attendance</h2>
            <p className="text-gray-500">Take attendance for your classes...</p>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Messages</h2>
            <p className="text-gray-500">Communication center...</p>
          </div>
        )}

        {activeTab === 'events' && (
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Events</h2>
            <p className="text-gray-500">Calendar and events...</p>
          </div>
        )}
      </main>
    </div>
  );
}