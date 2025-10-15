'use client';

import { useState, useEffect, useRef } from 'react';
import dynamic from 'next/dynamic';
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

export default function SchoolDashboard() {
  // Refs for dropdown click-outside detection
  const notificationRef = useRef(null);
  const settingsRef = useRef(null);
  
  // State Management
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState('list');
  const [showAddModal, setShowAddModal] = useState(false);
  const [addModalType, setAddModalType] = useState('student');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [showBulkUpload, setShowBulkUpload] = useState(false);
  const [bulkUploadType, setBulkUploadType] = useState('students');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [activeSettingsPanel, setActiveSettingsPanel] = useState(null);
  const [showProfile, setShowProfile] = useState(false);
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
    frequency: 'immediate' // immediate, daily, weekly
  });
  const [uploadedData, setUploadedData] = useState([]);
  const [duplicates, setDuplicates] = useState([]);
  const [showDuplicateReview, setShowDuplicateReview] = useState(false);
  const [showStudentDetails, setShowStudentDetails] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [showCreateClass, setShowCreateClass] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '',
    room: '',
    schedule: '',
    time: '',
    capacity: 25,
    subjects: []
  });
  const [showAddParent, setShowAddParent] = useState(false);
  const [parentViewMode, setParentViewMode] = useState('grid');
  const [parentSearchTerm, setParentSearchTerm] = useState('');
  const [childrenSearchTerm, setChildrenSearchTerm] = useState('');
  const [selectedChildren, setSelectedChildren] = useState([]);
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [teacherViewMode, setTeacherViewMode] = useState('grid');
  const [showAddTeacher, setShowAddTeacher] = useState(false);
  const [showViewTeacher, setShowViewTeacher] = useState(false);
  const [showEditTeacher, setShowEditTeacher] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [messageRecipientType, setMessageRecipientType] = useState('all');
  const [selectedRecipients, setSelectedRecipients] = useState([]);
  
  // Credentials Management State
  const [credentials, setCredentials] = useState([
    { id: 'CRED001', userId: 'STU001', userName: 'Aisha Ahmed', userType: 'student', email: 'aisha.ahmed@school.com', password: 'Pass123!', created: '2024-01-15', lastModified: '2024-01-15', status: 'active' },
    { id: 'CRED002', userId: 'TCH001', userName: 'Dr. Fatima Al-Rashid', userType: 'teacher', email: 'fatima.rashid@school.com', password: 'Teach456#', created: '2024-01-10', lastModified: '2024-01-10', status: 'active' },
    { id: 'CRED003', userId: 'PAR001', userName: 'Ahmed Hassan', userType: 'parent', email: 'ahmed.hassan@parent.com', password: 'Parent789$', created: '2024-01-20', lastModified: '2024-01-20', status: 'active' },
  ]);
  const [showAddCredential, setShowAddCredential] = useState(false);
  const [editingCredential, setEditingCredential] = useState(null);
  const [credentialSearch, setCredentialSearch] = useState('');
  const [credentialFilter, setCredentialFilter] = useState('all');
  const [showPassword, setShowPassword] = useState({});
  
  // Create Credential Form State
  const [credUserType, setCredUserType] = useState('');
  const [credUserSearch, setCredUserSearch] = useState('');
  const [credSelectedUser, setCredSelectedUser] = useState(null);
  const [showCredUserDropdown, setShowCredUserDropdown] = useState(false);
  const [recipientSearch, setRecipientSearch] = useState('');
  const [messageSubject, setMessageSubject] = useState('');
  const [messageContent, setMessageContent] = useState('');
  const [showComposeMessage, setShowComposeMessage] = useState(false);
  const [activeMessageTab, setActiveMessageTab] = useState('inbox');
  const [calendarView, setCalendarView] = useState('week');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddEvent, setShowAddEvent] = useState(false);
  
  // Assignment filters
  const [classFilter, setClassFilter] = useState('all');
  const [teacherFilter, setTeacherFilter] = useState('all');
  const [subjectFilter, setSubjectFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  
  // Reports filters
  const [reportDateRange, setReportDateRange] = useState('30days');
  const [performanceFilter, setPerformanceFilter] = useState('average');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  
  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Close notifications dropdown if clicking outside
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      // Close settings dropdown if clicking outside
      if (settingsRef.current && !settingsRef.current.contains(event.target)) {
        setShowSettings(false);
      }
    };

    // Add event listener when dropdowns are open
    if (showNotifications || showSettings) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    // Cleanup
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showNotifications, showSettings]);

  // Data
  const schoolInfo = {
    name: 'Al-Noor Academy',
    id: 'SCH-001',
    location: 'New York, USA',
    established: '2015',
    principal: 'Dr. Ahmad Hassan',
    subscription: 'Premium',
    validUntil: '2025-12-31'
  };

  const stats = {
    totalStudents: 245,
    totalTeachers: 18,
    totalParents: 198,
    totalClasses: 12,
    activeAssignments: 156,
    completionRate: 82.5,
    attendanceToday: 94.2,
    upcomingEvents: 8
  };

  const [students, setStudents] = useState([
    { id: 'STU001', name: 'Fatima Al-Zahra', age: 12, grade: '6th Grade', class: 'Class 6A', email: 'fatima@example.com', phone: '+1 234-567-8901', parent: 'Ahmed Al-Zahra', joinDate: '2023-01-15', progress: 85, attendance: 96, status: 'active', memorized: '15 Juz' },
    { id: 'STU002', name: 'Abdullah Khan', age: 11, grade: '5th Grade', class: 'Class 5B', email: 'abdullah@example.com', phone: '+1 234-567-8902', parent: 'Omar Khan', joinDate: '2023-02-20', progress: 78, attendance: 92, status: 'active', memorized: '12 Juz' },
    { id: 'STU003', name: 'Aisha Ibrahim', age: 13, grade: '7th Grade', class: 'Class 7A', email: 'aisha@example.com', phone: '+1 234-567-8903', parent: 'Ibrahim Hassan', joinDate: '2022-09-01', progress: 92, attendance: 98, status: 'active', memorized: '20 Juz' },
    { id: 'STU004', name: 'Omar Hassan', age: 10, grade: '4th Grade', class: 'Class 4A', email: 'omar@example.com', phone: '+1 234-567-8904', parent: 'Hassan Ali', joinDate: '2023-03-10', progress: 65, attendance: 88, status: 'active', memorized: '8 Juz' },
    { id: 'STU005', name: 'Maryam Ahmed', age: 14, grade: '8th Grade', class: 'Class 8B', email: 'maryam@example.com', phone: '+1 234-567-8905', parent: 'Ahmed Rashid', joinDate: '2022-01-05', progress: 88, attendance: 95, status: 'active', memorized: '18 Juz' },
  ]);

  const teachers = [
    { id: 'TCH001', name: 'Sheikh Muhammad Ali', subject: 'Quran Memorization', classes: ['6A', '7A', '8B'], email: 'mali@alnoor.edu', phone: '+1 234-567-9001', joinDate: '2020-08-15', students: 45, status: 'active', qualification: 'Ijazah in Quran', experience: '10 years' },
    { id: 'TCH002', name: 'Ustadha Sarah Ahmed', subject: 'Tajweed', classes: ['5B', '6A'], email: 'sarah@alnoor.edu', phone: '+1 234-567-9002', joinDate: '2021-01-10', students: 38, status: 'active', qualification: 'Masters in Islamic Studies', experience: '8 years' },
    { id: 'TCH003', name: 'Imam Abdul Rahman', subject: 'Islamic Studies', classes: ['4A', '5B', '6A'], email: 'rahman@alnoor.edu', phone: '+1 234-567-9003', joinDate: '2019-09-01', students: 52, status: 'active', qualification: 'PhD Islamic Theology', experience: '15 years' },
    { id: 'TCH004', name: 'Sister Khadija Noor', subject: 'Arabic Language', classes: ['7A', '8B'], email: 'khadija@alnoor.edu', phone: '+1 234-567-9004', joinDate: '2022-03-20', students: 40, status: 'active', qualification: 'BA Arabic Literature', experience: '6 years' },
  ];

  const parents = [
    { id: 'PAR001', name: 'Ahmed Al-Zahra', children: ['Fatima Al-Zahra', 'Hassan Al-Zahra'], email: 'ahmed.zahra@email.com', phone: '+1 234-567-8001', occupation: 'Engineer', address: '123 Main St, NY', status: 'active', joinDate: '2023-01-15' },
    { id: 'PAR002', name: 'Omar Khan', children: ['Abdullah Khan'], email: 'omar.khan@email.com', phone: '+1 234-567-8002', occupation: 'Doctor', address: '456 Oak Ave, NY', status: 'active', joinDate: '2023-02-20' },
    { id: 'PAR003', name: 'Ibrahim Hassan', children: ['Aisha Ibrahim'], email: 'ibrahim.h@email.com', phone: '+1 234-567-8003', occupation: 'Teacher', address: '789 Elm St, NY', status: 'active', joinDate: '2022-09-01' },
    { id: 'PAR004', name: 'Hassan Ali', children: ['Omar Hassan', 'Ali Hassan'], email: 'hassan.ali@email.com', phone: '+1 234-567-8004', occupation: 'Business Owner', address: '321 Pine Rd, NY', status: 'active', joinDate: '2023-03-10' },
  ];

  const classes = [
    { id: 'CLS001', name: 'Morning Quran Class', teacher: 'Imam Abdul Rahman', students: 20, schedule: 'Mon-Fri 8:00 AM', room: 'Room 101', subjects: ['Quran Memorization', 'Tajweed', 'Islamic Studies'], capacity: 25 },
    { id: 'CLS002', name: 'Beginner Tajweed', teacher: 'Ustadha Sarah Ahmed', students: 22, schedule: 'Mon-Fri 8:30 AM', room: 'Room 102', subjects: ['Tajweed', 'Arabic Language'], capacity: 30 },
    { id: 'CLS003', name: 'Advanced Memorization', teacher: 'Sheikh Muhammad Ali', students: 18, schedule: 'Mon-Fri 9:00 AM', room: 'Room 201', subjects: ['Quran Memorization', 'Advanced Tajweed'], capacity: 20 },
    { id: 'CLS004', name: 'Islamic Studies Intensive', teacher: 'Sister Khadija Noor', students: 24, schedule: 'Mon-Fri 9:30 AM', room: 'Room 202', subjects: ['Islamic Studies', 'Fiqh', 'Aqeedah'], capacity: 30 },
    { id: 'CLS005', name: 'Hadith & Seerah', teacher: 'Sheikh Muhammad Ali', students: 21, schedule: 'Mon-Fri 10:00 AM', room: 'Room 301', subjects: ['Hadith', 'Seerah'], capacity: 25 },
  ];

  const recentActivities = [
    { id: 1, type: 'student_added', description: 'New student Zainab Ali enrolled in Class 5B', time: '2 hours ago', icon: UserPlus, color: 'text-green-600 bg-green-100' },
    { id: 2, type: 'assignment', description: 'Surah Al-Mulk assignment created for Class 7A', time: '4 hours ago', icon: FileText, color: 'text-blue-600 bg-blue-100' },
    { id: 3, type: 'achievement', description: 'Fatima Al-Zahra completed Juz 15', time: '1 day ago', icon: Award, color: 'text-purple-600 bg-purple-100' },
    { id: 4, type: 'meeting', description: 'Parent-teacher meeting scheduled for next week', time: '2 days ago', icon: Calendar, color: 'text-orange-600 bg-orange-100' },
  ];

  const upcomingEvents = [
    { id: 1, title: 'Quran Competition', date: '2025-01-15', time: '10:00 AM', type: 'competition' },
    { id: 2, title: 'Parent-Teacher Meeting', date: '2025-01-20', time: '2:00 PM', type: 'meeting' },
    { id: 3, title: 'Ramadan Program Begins', date: '2025-03-01', time: 'All Day', type: 'program' },
    { id: 4, title: 'Annual Graduation', date: '2025-06-15', time: '5:00 PM', type: 'ceremony' },
  ];

  const tabs = ['overview', 'students', 'teachers', 'parents', 'classes', 'class-builder', 'assignments', 'calendar', 'messages', 'reports', 'credentials'];

  // Helper Functions
  const handleDeleteStudents = (studentIds) => {
    if (confirm(`Are you sure you want to delete ${studentIds.length} student(s)?`)) {
      setStudents(prev => prev.filter(s => !studentIds.includes(s.id)));
      setSelectedUsers([]);
      alert(`Successfully deleted ${studentIds.length} student(s)`);
    }
  };

  const handleExportStudents = () => {
    const csv = [
      'ID,Name,Age,Grade,Class,Email,Phone,Parent,Progress,Attendance,Memorized',
      ...students.map(s => 
        `${s.id},${s.name},${s.age},${s.grade},${s.class},${s.email},${s.phone},${s.parent},${s.progress},${s.attendance},${s.memorized}`
      )
    ].join('\n');
    
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `students_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleSendEmail = (studentIds) => {
    const selectedStudents = students.filter(s => studentIds.includes(s.id));
    const emails = selectedStudents.map(s => s.email).join(', ');
    window.location.href = `mailto:${emails}`;
  };

  const handleBulkUpload = (csvContent) => {
    const lines = csvContent.split('\n');
    const headers = lines[0].split(',').map(h => h.trim());
    const data = [];
    
    // Parse CSV data
    for (let i = 1; i < lines.length; i++) {
      if (lines[i].trim()) {
        const values = lines[i].split(',').map(v => v.trim());
        const row = {};
        headers.forEach((header, index) => {
          row[header] = values[index] || '';
        });
        data.push(row);
      }
    }
    
    // Validate required columns (Name, Email, Age, Gender)
    const requiredColumns = ['Name', 'Email', 'Age', 'Gender'];
    const hasRequiredColumns = requiredColumns.every(col => 
      headers.some(h => h.toLowerCase() === col.toLowerCase())
    );
    
    if (!hasRequiredColumns) {
      alert('Invalid file format. Please ensure your file has columns: Name, Email, Age, Gender');
      return;
    }
    
    // Check for duplicates within the CSV file
    const csvEmailMap = new Map();
    const csvInternalDuplicates = [];
    
    data.forEach((row, index) => {
      const email = row.Email || row.email || '';
      if (email && csvEmailMap.has(email.toLowerCase())) {
        csvInternalDuplicates.push({ 
          ...row, 
          rowIndex: index + 2, 
          duplicateOf: csvEmailMap.get(email.toLowerCase()) 
        });
      } else if (email) {
        csvEmailMap.set(email.toLowerCase(), index + 2);
      }
    });
    
    // Check for duplicates against existing students
    const existingEmails = new Set(students.map(s => s.email.toLowerCase()));
    const systemDuplicates = [];
    
    data.forEach((row, index) => {
      const email = row.Email || row.email || '';
      if (email && existingEmails.has(email.toLowerCase())) {
        systemDuplicates.push({ 
          ...row, 
          rowIndex: index + 2,
          existingStudent: students.find(s => s.email.toLowerCase() === email.toLowerCase())
        });
      }
    });
    
    // Combine all duplicates
    const allDuplicates = [...csvInternalDuplicates, ...systemDuplicates];
    
    if (allDuplicates.length > 0) {
      setDuplicates(allDuplicates);
      setUploadedData(data);
    } else {
      // No duplicates, show preview
      setUploadedData(data);
      setDuplicates([]);
    }
  };

  // Confirm Upload Function
  const confirmUpload = (newRows, duplicatesToAdd) => {
    const allRowsToAdd = [...newRows, ...duplicatesToAdd];
    
    const formattedStudents = allRowsToAdd.map((row, index) => ({
      id: `STU${String(students.length + index + 1).padStart(3, '0')}`,
      name: row.Name || row.name || '',
      email: row.Email || row.email || '',
      age: parseInt(row.Age || row.age) || 0,
      gender: row.Gender || row.gender || '',
      grade: '5th Grade', // Default grade
      class: 'Unassigned', // Will be assigned in Class Builder
      phone: '', // Not in the 4-column format
      parent: '', // Will be linked later in Parents section
      joinDate: new Date().toISOString().split('T')[0],
      progress: Math.floor(Math.random() * 30) + 60,
      attendance: Math.floor(Math.random() * 10) + 85,
      status: 'active',
      memorized: `${Math.floor(Math.random() * 10) + 1} Juz`
    }));
    
    setStudents(prev => [...prev, ...formattedStudents]);
    
    // Show success message
    alert(`Successfully uploaded ${allRowsToAdd.length} students!${duplicatesToAdd.length > 0 ? ` (Including ${duplicatesToAdd.length} updated duplicates)` : ''}`);
    
    // Reset states
    setShowBulkUpload(false);
    setShowDuplicateReview(false);
    setUploadedData([]);
    setDuplicates([]);
  };

  // Get assignments data for filters - Individual student assignments with mistake types
  const allAssignments = [
    { id: 1, studentName: 'Fatima Al-Zahra', studentId: 'STU001', title: 'Surah Al-Mulk - Verse 1-5', mistakeType: 'recap', teacher: 'Sheikh Muhammad Ali', subject: 'Quran', dueDate: '2025-01-20', status: 'in-progress', surah: 'Al-Mulk', ayahRange: '1-5' },
    { id: 2, studentName: 'Abdullah Khan', studentId: 'STU002', title: 'Tajweed Rules - Idgham', mistakeType: 'tajweed', teacher: 'Ustadha Sarah Ahmed', subject: 'Tajweed', dueDate: '2025-01-18', status: 'submitted', surah: 'Al-Baqarah', ayahRange: '25-30' },
    { id: 3, studentName: 'Aisha Ibrahim', studentId: 'STU003', title: 'Fix Harakat in Al-Fatihah', mistakeType: 'haraka', teacher: 'Sheikh Muhammad Ali', subject: 'Quran', dueDate: '2025-01-15', status: 'completed', surah: 'Al-Fatihah', ayahRange: '1-7' },
    { id: 4, studentName: 'Omar Hassan', studentId: 'STU004', title: 'Letter Pronunciation Practice', mistakeType: 'letter', teacher: 'Sister Khadija Noor', subject: 'Arabic', dueDate: '2025-01-22', status: 'not-started', surah: 'Al-Ikhlas', ayahRange: '1-4' },
    { id: 5, studentName: 'Maryam Ahmed', studentId: 'STU005', title: 'Recap Juz 30', mistakeType: 'recap', teacher: 'Sheikh Muhammad Ali', subject: 'Quran', dueDate: '2025-01-25', status: 'in-progress', surah: 'Multiple', ayahRange: 'Juz 30' },
    { id: 6, studentName: 'Fatima Al-Zahra', studentId: 'STU001', title: 'Tajweed - Qalqalah Rules', mistakeType: 'tajweed', teacher: 'Ustadha Sarah Ahmed', subject: 'Tajweed', dueDate: '2025-01-19', status: 'submitted', surah: 'Al-Falaq', ayahRange: '1-5' },
    { id: 7, studentName: 'Abdullah Khan', studentId: 'STU002', title: 'Review Al-Baqarah Verses', mistakeType: 'recap', teacher: 'Sheikh Muhammad Ali', subject: 'Quran', dueDate: '2025-01-21', status: 'not-started', surah: 'Al-Baqarah', ayahRange: '1-20' },
    { id: 8, studentName: 'Aisha Ibrahim', studentId: 'STU003', title: 'Fix Letter Mistakes', mistakeType: 'letter', teacher: 'Sister Khadija Noor', subject: 'Arabic', dueDate: '2025-01-23', status: 'in-progress', surah: 'Al-Kawthar', ayahRange: '1-3' },
    { id: 9, studentName: 'Omar Hassan', studentId: 'STU004', title: 'Harakat Correction Exercise', mistakeType: 'haraka', teacher: 'Sheikh Muhammad Ali', subject: 'Quran', dueDate: '2025-01-20', status: 'submitted', surah: 'An-Nas', ayahRange: '1-6' },
    { id: 10, studentName: 'Maryam Ahmed', studentId: 'STU005', title: 'Advanced Tajweed Rules', mistakeType: 'tajweed', teacher: 'Ustadha Sarah Ahmed', subject: 'Tajweed', dueDate: '2025-01-24', status: 'in-progress', surah: 'Ar-Rahman', ayahRange: '1-15' },
  ];

  const filteredAssignments = allAssignments.filter(assignment => {
    if (teacherFilter !== 'all' && assignment.teacher !== teacherFilter) return false;
    if (subjectFilter !== 'all' && assignment.subject !== subjectFilter) return false;
    if (statusFilter !== 'all' && assignment.status !== statusFilter) return false;
    return true;
  });

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Main Render
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                <School className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{schoolInfo.name}</h1>
                <p className="text-sm text-gray-500">School ID: {schoolInfo.id} • {schoolInfo.location}</p>
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
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50">
                    <div className="p-4 border-b">
                      <h3 className="font-semibold">Notifications</h3>
                    </div>
                    <div className="max-h-96 overflow-y-auto">
                      {recentActivities.map(activity => (
                        <div key={activity.id} className="p-4 hover:bg-gray-50 border-b">
                          <div className="flex items-start space-x-3">
                            <div className={`p-2 rounded-lg ${activity.color}`}>
                              <activity.icon className="w-4 h-4" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm text-gray-900">{activity.description}</p>
                              <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
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
                        <School className="w-4 h-4" />
                        <span>School Profile</span>
                      </button>
                      <button 
                        onClick={() => {
                          setShowNotificationPreferences(true);
                          setShowSettings(false);
                        }}
                        className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-3">
                        <Bell className="w-4 h-4" />
                        <span>Notification Preferences</span>
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
                      ? 'text-white bg-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
                  }
                  group
                `}
              >
                <span className="relative z-10">{tab.replace('-', ' ')}</span>
                {activeTab === tab && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-full"></div>
                )}
                <div className={`
                  absolute inset-0 rounded-lg transition-all duration-200
                  ${activeTab === tab 
                    ? 'bg-gradient-to-r from-blue-600 to-blue-700 opacity-50' 
                    : 'bg-gradient-to-r from-blue-50 to-blue-100 opacity-0 group-hover:opacity-100'
                  }
                `}></div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="p-6 bg-gray-50">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Welcome Header */}
            <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-black opacity-10"></div>
              <div className="relative z-10">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Welcome back to {schoolInfo.name}! 👋</h2>
                    <p className="text-blue-100 text-lg">Here's what's happening in your school today, {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                  </div>
                  <div className="hidden lg:block">
                    <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
                      <p className="text-white/90 text-sm">Current Term</p>
                      <p className="text-white font-bold text-xl">Fall 2024</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                      <Users className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      ↑ 12%
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Total Students</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalStudents}</p>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Active: {Math.round(stats.totalStudents * 0.92)}</span>
                        <span className="text-gray-500">Inactive: {Math.round(stats.totalStudents * 0.08)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-blue-400 to-blue-600"></div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                      <GraduationCap className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      Optimal
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Total Teachers</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.totalTeachers}</p>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Ratio: 1:{Math.round(stats.totalStudents/stats.totalTeachers)}</span>
                        <span className="text-green-600 font-medium">Fully Staffed</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-green-400 to-green-600"></div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                      <FileText className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-orange-600 bg-orange-100 px-2 py-1 rounded-full">
                      23 due
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Active Assignments</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.activeAssignments}</p>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Submitted: {Math.round(stats.activeAssignments * 0.65)}</span>
                        <span className="text-orange-500">Pending: {Math.round(stats.activeAssignments * 0.35)}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-purple-400 to-purple-600"></div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm hover:shadow-lg transition-shadow duration-300 overflow-hidden">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                      <CheckCircle className="w-7 h-7 text-white" />
                    </div>
                    <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-1 rounded-full">
                      High
                    </span>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500 font-medium">Attendance Today</p>
                    <p className="text-3xl font-bold text-gray-900 mt-1">{stats.attendanceToday}%</p>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-orange-400 to-orange-600 h-2 rounded-full transition-all duration-500"
                          style={{ width: `${stats.attendanceToday}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="h-1 bg-gradient-to-r from-orange-400 to-orange-600"></div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <button className="bg-white p-4 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-blue-200 transition">
                    <UserPlus className="w-6 h-6 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Add Student</span>
                </div>
              </button>
              
              <button className="bg-white p-4 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-green-200 transition">
                    <Calendar className="w-6 h-6 text-green-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Schedule Class</span>
                </div>
              </button>
              
              <button className="bg-white p-4 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-purple-200 transition">
                    <FileText className="w-6 h-6 text-purple-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">Create Assignment</span>
                </div>
              </button>
              
              <button className="bg-white p-4 rounded-xl shadow-sm hover:shadow-lg transition-all duration-300 border border-gray-100 group">
                <div className="flex flex-col items-center">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-3 group-hover:bg-orange-200 transition">
                    <BarChart3 className="w-6 h-6 text-orange-600" />
                  </div>
                  <span className="text-sm font-medium text-gray-700">View Reports</span>
                </div>
              </button>
            </div>

            {/* Recent Activities, Performance & Events */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Recent Activities */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-lg">Recent Activities</h3>
                  <Activity className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                  {recentActivities.map(activity => (
                    <div key={activity.id} className="flex items-start space-x-3 group cursor-pointer">
                      <div className={`p-2.5 rounded-xl ${activity.color} group-hover:scale-110 transition-transform`}>
                        <activity.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition">{activity.description}</p>
                        <p className="text-xs text-gray-500 mt-1">{activity.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View All Activities →
                </button>
              </div>

              {/* Performance Chart */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-lg">Performance Overview</h3>
                  <PieChart className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Quran Memorization</span>
                      <span className="text-sm font-semibold text-gray-900">78%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full" style={{ width: '78%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Tajweed Proficiency</span>
                      <span className="text-sm font-semibold text-gray-900">85%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full" style={{ width: '85%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Islamic Studies</span>
                      <span className="text-sm font-semibold text-gray-900">92%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-500 to-purple-600 h-2 rounded-full" style={{ width: '92%' }}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-gray-600">Arabic Language</span>
                      <span className="text-sm font-semibold text-gray-900">71%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full" style={{ width: '71%' }}></div>
                    </div>
                  </div>
                </div>
                <button className="w-full mt-4 text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View Detailed Reports →
                </button>
              </div>

              {/* Upcoming Events */}
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-gray-900 text-lg">Upcoming Events</h3>
                  <Calendar className="w-5 h-5 text-gray-400" />
                </div>
                <div className="space-y-3">
                  {upcomingEvents.map((event, index) => (
                    <div key={event.id} className="flex items-center justify-between p-3 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl hover:from-blue-50 hover:to-blue-100 transition-all cursor-pointer group">
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          index === 0 ? 'bg-red-500' : 
                          index === 1 ? 'bg-blue-500' : 
                          index === 2 ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 group-hover:text-blue-600 transition">{event.title}</p>
                          <p className="text-xs text-gray-500 mt-1">{event.date} • {event.time}</p>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition" />
                    </div>
                  ))}
                </div>
                <button className="w-full mt-4 text-center text-sm text-blue-600 hover:text-blue-700 font-medium">
                  View Full Calendar →
                </button>
              </div>
            </div>

            {/* Today's Schedule */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-gray-900 text-lg">Today's Class Schedule</h3>
                <Clock className="w-5 h-5 text-gray-400" />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {classes.slice(0, 3).map((cls, index) => (
                  <div key={cls.id} className="border border-gray-200 rounded-xl p-4 hover:border-blue-300 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                        index === 0 ? 'bg-blue-100 text-blue-700' :
                        index === 1 ? 'bg-green-100 text-green-700' :
                        'bg-purple-100 text-purple-700'
                      }`}>
                        {cls.schedule}
                      </span>
                      <span className="text-xs text-gray-500">{cls.room}</span>
                    </div>
                    <h4 className="font-medium text-gray-900">{cls.name}</h4>
                    <p className="text-sm text-gray-500 mt-1">{cls.grade}</p>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Students: {cls.students}</span>
                        <span className="text-gray-500">Teacher: {cls.teacher}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
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
                    <p className="text-blue-100 text-xs mt-2">+12% from last month</p>
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
                    <p className="text-3xl font-bold mt-1">{students.filter(s => s.status === 'active').length}</p>
                    <p className="text-green-100 text-xs mt-2">{Math.round((students.filter(s => s.status === 'active').length / students.length) * 100)}% active</p>
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
                    <p className="text-3xl font-bold mt-1">{Math.round(students.reduce((acc, s) => acc + s.progress, 0) / students.length)}%</p>
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
                    <p className="text-3xl font-bold mt-1">{Math.round(students.reduce((acc, s) => acc + s.attendance, 0) / students.length)}%</p>
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
                      onClick={() => setShowBulkUpload(true)}
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
                      <option value="">All Grades</option>
                      <option value="4">4th Grade</option>
                      <option value="5">5th Grade</option>
                      <option value="6">6th Grade</option>
                      <option value="7">7th Grade</option>
                      <option value="8">8th Grade</option>
                    </select>
                    
                    <select className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="">All Classes</option>
                      {classes.map(cls => (
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

                {viewMode === 'list' ? (
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
                                  setSelectedUsers(filteredStudents.map(s => s.id));
                                }
                              }}
                            />
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Student</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Age/Gender</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Grade/Class</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Progress</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Attendance</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Memorized</th>
                          <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200 bg-white">
                        {filteredStudents.map(student => (
                          <tr key={student.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              <input 
                                type="checkbox"
                                className="rounded"
                                checked={selectedUsers.includes(student.id)}
                                onChange={() => {
                                  if (selectedUsers.includes(student.id)) {
                                    setSelectedUsers(prev => prev.filter(id => id !== student.id));
                                  } else {
                                    setSelectedUsers(prev => [...prev, student.id]);
                                  }
                                }}
                              />
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-semibold">
                                  {student.name.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-semibold text-gray-900">{student.name}</p>
                                  <p className="text-xs text-gray-500">{student.email}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-gray-900">{student.age || 'N/A'} yrs</p>
                              <p className="text-xs text-gray-500">{student.gender || 'N/A'}</p>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm font-medium text-gray-900">{student.grade}</p>
                              <p className="text-xs text-gray-500">{student.class}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                                  <div 
                                    className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500" 
                                    style={{ width: `${student.progress}%` }}
                                  ></div>
                                </div>
                                <span className="text-sm font-medium text-gray-700">{student.progress}%</span>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                student.attendance >= 95 ? 'bg-green-100 text-green-800' :
                                student.attendance >= 80 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                  student.attendance >= 95 ? 'bg-green-600' :
                                  student.attendance >= 80 ? 'bg-yellow-600' :
                                  'bg-red-600'
                                }`}></span>
                                {student.attendance}%
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <span className="text-sm font-medium text-gray-900">{student.memorized}</span>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-1">
                                <button 
                                  onClick={() => setShowStudentDetails(student)}
                                  className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                                  title="View Details"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => setEditingStudent(student)}
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
                    
                    {filteredStudents.length === 0 && (
                      <div className="text-center py-12">
                        <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No students found</p>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredStudents.map(student => (
                      <div key={student.id} className="bg-white border border-gray-200 rounded-xl hover:shadow-xl transition-all duration-300 overflow-hidden group">
                        <div className="p-5">
                          <div className="flex items-start justify-between mb-4">
                            <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-lg">
                              {student.name.split(' ').map(n => n[0]).join('')}
                            </div>
                            <input 
                              type="checkbox"
                              className="rounded"
                              checked={selectedUsers.includes(student.id)}
                              onChange={() => {
                                if (selectedUsers.includes(student.id)) {
                                  setSelectedUsers(prev => prev.filter(id => id !== student.id));
                                } else {
                                  setSelectedUsers(prev => [...prev, student.id]);
                                }
                              }}
                            />
                          </div>
                          
                          <div className="mb-4">
                            <h3 className="font-semibold text-gray-900 text-lg">{student.name}</h3>
                            <p className="text-sm text-gray-500 mt-1">{student.email}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                {student.grade}
                              </span>
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                {student.class}
                              </span>
                            </div>
                          </div>
                          
                          <div className="space-y-3">
                            <div>
                              <div className="flex items-center justify-between text-sm mb-1">
                                <span className="text-gray-500">Progress</span>
                                <span className="font-semibold text-gray-700">{student.progress}%</span>
                              </div>
                              <div className="bg-gray-200 rounded-full h-2">
                                <div 
                                  className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500" 
                                  style={{ width: `${student.progress}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Attendance</span>
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                student.attendance >= 95 ? 'bg-green-100 text-green-800' :
                                student.attendance >= 80 ? 'bg-yellow-100 text-yellow-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                {student.attendance}%
                              </span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Memorized</span>
                              <span className="font-semibold text-gray-700">{student.memorized}</span>
                            </div>
                            
                            <div className="flex items-center justify-between text-sm">
                              <span className="text-gray-500">Age/Gender</span>
                              <span className="text-gray-700">{student.age || 'N/A'} / {student.gender || 'N/A'}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="px-5 py-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
                          <span className="text-xs text-gray-500">ID: {student.id}</span>
                          <div className="flex items-center space-x-1">
                            <button 
                              onClick={() => setShowStudentDetails(student)}
                              className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-100 rounded-lg transition"
                              title="View"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => setEditingStudent(student)}
                              className="p-1.5 text-gray-400 hover:text-green-600 hover:bg-green-100 rounded-lg transition"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => handleDeleteStudents([student.id])}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-100 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
                
                {filteredStudents.length === 0 && viewMode === 'grid' && (
                  <div className="text-center py-16">
                    <Users className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-1">No students found</h3>
                    <p className="text-gray-500">Try adjusting your search or filters</p>
                    <button 
                      onClick={() => { setAddModalType('student'); setShowAddModal(true); }}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition inline-flex items-center space-x-2"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Add Your First Student</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Other tabs with placeholder content */}
        {activeTab === 'teachers' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Teachers Management</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage your teaching staff and their assignments</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setShowAddTeacher(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Teacher</span>
                  </button>
                </div>
              </div>
              
              {/* Search and View Toggle */}
              <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search teachers by name, subject, or email..."
                    value={teacherSearchTerm}
                    onChange={(e) => setTeacherSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setTeacherViewMode('grid')}
                    className={`p-2 rounded-lg ${teacherViewMode === 'grid' ? 'bg-gray-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <Grid className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setTeacherViewMode('list')}
                    className={`p-2 rounded-lg ${teacherViewMode === 'list' ? 'bg-gray-100 text-blue-600' : 'text-gray-400 hover:text-gray-600'}`}
                  >
                    <List className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Teachers Grid View */}
            {teacherViewMode === 'grid' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teachers.filter(teacher => 
                  !teacherSearchTerm || 
                  teacher.name.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
                  teacher.subject.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
                  teacher.email.toLowerCase().includes(teacherSearchTerm.toLowerCase())
                ).map(teacher => (
                  <div key={teacher.id} className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-lg transition-shadow">
                    {/* Teacher Card Header */}
                    <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
                      <div className="flex items-center space-x-4">
                        <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                          <GraduationCap className="w-8 h-8 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{teacher.name}</h3>
                          <p className="text-purple-100 text-sm">{teacher.subject}</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Teacher Card Body */}
                    <div className="p-6">
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          {teacher.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          {teacher.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Award className="w-4 h-4 mr-2 text-gray-400" />
                          {teacher.experience} experience
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-2 text-gray-400" />
                          {teacher.students} students
                        </div>
                      </div>
                      
                      {/* Stats */}
                      <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t">
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{teacher.classes || 3}</p>
                          <p className="text-xs text-gray-500">Classes</p>
                        </div>
                        <div className="text-center">
                          <p className="text-2xl font-bold text-gray-900">{teacher.rating || '4.8'}</p>
                          <p className="text-xs text-gray-500">Rating</p>
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t">
                        <button 
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setShowViewTeacher(true);
                          }}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </button>
                        <button 
                          onClick={() => {
                            setSelectedTeacher(teacher);
                            setShowEditTeacher(true);
                          }}
                          className="text-gray-600 hover:text-gray-700 text-sm font-medium flex items-center"
                        >
                          <Edit className="w-4 h-4 mr-1" />
                          Edit
                        </button>
                        <button 
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove ${teacher.name}? This action cannot be undone.`)) {
                              // Remove teacher logic here
                              alert(`${teacher.name} has been removed successfully.`);
                            }
                          }}
                          className="text-red-600 hover:text-red-700 text-sm font-medium flex items-center"
                        >
                          <Trash2 className="w-4 h-4 mr-1" />
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {/* Teachers List View */}
            {teacherViewMode === 'list' && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Subject</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Experience</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Students</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classes</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {teachers.filter(teacher => 
                      !teacherSearchTerm || 
                      teacher.name.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
                      teacher.subject.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
                      teacher.email.toLowerCase().includes(teacherSearchTerm.toLowerCase())
                    ).map(teacher => (
                      <tr key={teacher.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                              <GraduationCap className="w-5 h-5 text-purple-600" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">{teacher.name}</p>
                              <p className="text-xs text-gray-500">ID: {teacher.id}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{teacher.subject}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{teacher.email}</p>
                          <p className="text-xs text-gray-500">{teacher.phone}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{teacher.experience}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{teacher.students}</p>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-900">{teacher.classes || 3}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                            Active
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              onClick={() => {
                                setSelectedTeacher(teacher);
                                setShowViewTeacher(true);
                              }}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                            <button 
                              onClick={() => {
                                setSelectedTeacher(teacher);
                                setShowEditTeacher(true);
                              }}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Edit className="w-4 h-4 text-gray-600" />
                            </button>
                            <button 
                              onClick={() => {
                                if (confirm(`Are you sure you want to remove ${teacher.name}? This action cannot be undone.`)) {
                                  alert(`${teacher.name} has been removed successfully.`);
                                }
                              }}
                              className="p-1 hover:bg-gray-100 rounded"
                            >
                              <Trash2 className="w-4 h-4 text-red-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* No Results */}
            {teachers.filter(teacher => 
              !teacherSearchTerm || 
              teacher.name.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
              teacher.subject.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
              teacher.email.toLowerCase().includes(teacherSearchTerm.toLowerCase())
            ).length === 0 && (
              <div className="bg-white rounded-xl shadow-sm p-12 text-center">
                <GraduationCap className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No teachers found matching your search</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'parents' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Parents Management</h2>
                  <p className="text-sm text-gray-500 mt-1">Manage parent accounts and their linked children</p>
                </div>
                <div className="flex items-center space-x-3">
                  <button 
                    onClick={() => setShowAddParent(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Add Parent</span>
                  </button>
                </div>
              </div>
              
              {/* Search and View Toggle */}
              <div className="flex items-center justify-between">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search parents by name or email..."
                    value={parentSearchTerm}
                    onChange={(e) => setParentSearchTerm(e.target.value)}
                    className="pl-10 pr-4 py-2 w-full border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={() => setParentViewMode('grid')}
                    className={`p-2 rounded ${parentViewMode === 'grid' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button 
                    onClick={() => setParentViewMode('list')}
                    className={`p-2 rounded ${parentViewMode === 'list' ? 'bg-gray-200' : 'hover:bg-gray-100'}`}
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Parents Display */}
            {parentViewMode === 'grid' ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {parents.filter(parent => 
                  parent.name.toLowerCase().includes(parentSearchTerm.toLowerCase()) ||
                  parent.email.toLowerCase().includes(parentSearchTerm.toLowerCase())
                ).map(parent => (
                  <div key={parent.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition">
                    <div className="bg-gradient-to-r from-green-500 to-teal-500 p-4">
                      <div className="flex items-center justify-between">
                        <div className="w-12 h-12 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                          <span className="text-xl font-bold text-white">
                            {parent.name.split(' ').map(n => n[0]).join('')}
                          </span>
                        </div>
                        <span className="px-2 py-1 bg-white bg-opacity-20 rounded text-xs text-white">
                          {parent.status === 'active' ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-lg text-gray-900">{parent.name}</h3>
                      <p className="text-sm text-gray-500">{parent.occupation}</p>
                      
                      <div className="mt-4 space-y-2">
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="truncate">{parent.email}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="w-4 h-4 mr-2 text-gray-400" />
                          <span>{parent.phone}</span>
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="w-4 h-4 mr-2 text-gray-400" />
                          <span className="truncate">{parent.address}</span>
                        </div>
                      </div>
                      
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-xs font-medium text-gray-500 mb-2">CHILDREN ({parent.children.length})</p>
                        <div className="flex flex-wrap gap-1">
                          {parent.children.map((child, index) => (
                            <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                              {child}
                            </span>
                          ))}
                        </div>
                      </div>
                      
                      <div className="mt-4 flex items-center justify-between">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          View Details
                        </button>
                        <div className="flex items-center space-x-2">
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Edit className="w-4 h-4 text-gray-600" />
                          </button>
                          <button className="p-1 hover:bg-gray-100 rounded">
                            <Mail className="w-4 h-4 text-gray-600" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Parent</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contact</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Children</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Join Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {parents.filter(parent => 
                      parent.name.toLowerCase().includes(parentSearchTerm.toLowerCase()) ||
                      parent.email.toLowerCase().includes(parentSearchTerm.toLowerCase())
                    ).map(parent => (
                      <tr key={parent.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{parent.name}</p>
                            <p className="text-xs text-gray-500">{parent.occupation}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="space-y-1">
                            <p className="text-sm text-gray-600">{parent.email}</p>
                            <p className="text-sm text-gray-600">{parent.phone}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex flex-wrap gap-1">
                            {parent.children.map((child, index) => (
                              <span key={index} className="px-2 py-1 bg-blue-100 text-blue-700 rounded text-xs">
                                {child}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <p className="text-sm text-gray-600">{parent.joinDate}</p>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2 py-1 text-xs rounded-full ${
                            parent.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {parent.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-2">
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Edit className="w-4 h-4 text-gray-600" />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Mail className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            
            {/* Summary Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{parents.length}</p>
                    <p className="text-sm text-gray-500">Total Parents</p>
                  </div>
                  <Users className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{parents.filter(p => p.status === 'active').length}</p>
                    <p className="text-sm text-gray-500">Active Accounts</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">{parents.reduce((sum, p) => sum + p.children.length, 0)}</p>
                    <p className="text-sm text-gray-500">Total Children</p>
                  </div>
                  <GraduationCap className="w-8 h-8 text-purple-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">1.5</p>
                    <p className="text-sm text-gray-500">Avg Children/Parent</p>
                  </div>
                  <Activity className="w-8 h-8 text-orange-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Classes Management</h2>
                  <p className="text-sm text-gray-500 mt-1">Create and manage school classes</p>
                </div>
                <button 
                  onClick={() => setShowCreateClass(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create New Class</span>
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.map(cls => (
                  <div key={cls.id} className="border rounded-lg overflow-hidden hover:shadow-lg transition">
                    <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
                      <h3 className="font-semibold text-lg">{cls.name}</h3>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {cls.subjects?.slice(0, 2).map(subject => (
                          <span key={subject} className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded">
                            {subject}
                          </span>
                        ))}
                        {cls.subjects?.length > 2 && (
                          <span className="text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded">
                            +{cls.subjects.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Room:</span>
                        <span className="font-medium">{cls.room}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Schedule:</span>
                        <span className="font-medium">{cls.schedule}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Teacher:</span>
                        <span className="font-medium">{cls.teacher || 'Not Assigned'}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Students:</span>
                        <span className="font-medium">{cls.students}/{cls.capacity || 25}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Subjects:</span>
                        <span className="font-medium">{cls.subjects?.length || 0} subjects</span>
                      </div>
                      
                      <div className="pt-3 border-t flex items-center justify-between">
                        <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                          Edit Class
                        </button>
                        <button 
                          onClick={() => {
                            setActiveTab('class-builder');
                          }}
                          className="text-green-600 hover:text-green-700 text-sm font-medium"
                        >
                          Assign Members →
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="bg-blue-50 rounded-xl p-4 border border-blue-200">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-blue-900">How to set up classes:</p>
                  <ol className="text-sm text-blue-700 mt-1 space-y-1">
                    <li>1. Create a new class with schedule and room details</li>
                    <li>2. Go to Class Builder to assign teachers and students</li>
                    <li>3. Teachers can then create assignments for their students</li>
                  </ol>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'class-builder' && (
          <ClassBuilder />
        )}

        {activeTab === 'assignments' && (
          <div className="space-y-6">
            {/* Header with Legend */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-semibold text-lg">Individual Student Assignments</p>
                  <p className="text-gray-500 text-sm">Assignments given to specific students based on their mistakes</p>
                </div>
                <Eye className="w-5 h-5 text-gray-400" />
              </div>
              
              {/* Color Legend */}
              <div className="flex items-center space-x-6 text-sm">
                <span className="text-gray-600 font-medium">Assignment Types:</span>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-purple-500 rounded"></div>
                  <span className="text-gray-600">Recap</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-orange-500 rounded"></div>
                  <span className="text-gray-600">Tajweed</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-gray-600">Haraka</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-amber-700 rounded"></div>
                  <span className="text-gray-600">Letter</span>
                </div>
              </div>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-3">
              <input 
                type="text"
                placeholder="Search student name..."
                className="px-4 py-2 border rounded-lg"
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <select 
                className="px-4 py-2 border rounded-lg"
                value={teacherFilter}
                onChange={(e) => setTeacherFilter(e.target.value)}
              >
                <option value="all">All Teachers</option>
                {Array.from(new Set(allAssignments.map(a => a.teacher))).map(teacher => (
                  <option key={teacher} value={teacher}>{teacher}</option>
                ))}
              </select>
              <select 
                className="px-4 py-2 border rounded-lg"
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
              >
                <option value="all">All Subjects</option>
                {Array.from(new Set(allAssignments.map(a => a.subject))).map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
              <select 
                className="px-4 py-2 border rounded-lg"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="not-started">Not Started</option>
                <option value="in-progress">In Progress</option>
                <option value="submitted">Submitted</option>
                <option value="completed">Completed</option>
              </select>
            </div>

            {/* Assignments Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAssignments
                .filter(a => searchTerm === '' || a.studentName.toLowerCase().includes(searchTerm.toLowerCase()))
                .map(assignment => (
                <div key={assignment.id} className="bg-white rounded-xl shadow-sm border overflow-hidden hover:shadow-lg transition">
                  {/* Color stripe based on mistake type */}
                  <div className={`h-2 ${
                    assignment.mistakeType === 'recap' ? 'bg-purple-500' :
                    assignment.mistakeType === 'tajweed' ? 'bg-orange-500' :
                    assignment.mistakeType === 'haraka' ? 'bg-red-500' :
                    'bg-amber-700'
                  }`}></div>
                  
                  <div className="p-5">
                    {/* Student Name and Assignment Title */}
                    <div className="mb-3">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-gray-900">{assignment.studentName}</p>
                        <span className={`px-2 py-0.5 text-xs rounded-full capitalize ${
                          assignment.mistakeType === 'recap' ? 'bg-purple-100 text-purple-700' :
                          assignment.mistakeType === 'tajweed' ? 'bg-orange-100 text-orange-700' :
                          assignment.mistakeType === 'haraka' ? 'bg-red-100 text-red-700' :
                          'bg-amber-100 text-amber-700'
                        }`}>
                          {assignment.mistakeType}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{assignment.title}</p>
                    </div>
                    
                    {/* Surah and Ayah Info */}
                    <div className="bg-gray-50 rounded-lg p-2 mb-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">📖 {assignment.surah}</span>
                        <span className="font-medium text-gray-700">Ayah: {assignment.ayahRange}</span>
                      </div>
                    </div>
                    
                    {/* Teacher and Due Date */}
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Teacher:</span>
                        <span className="text-gray-700">{assignment.teacher.split(' ').slice(0, 2).join(' ')}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Due Date:</span>
                        <span className="font-medium text-gray-700">{assignment.dueDate}</span>
                      </div>
                    </div>
                    
                    {/* Status */}
                    <div className="mt-3 pt-3 border-t flex items-center justify-between">
                      <span className={`px-3 py-1 text-xs rounded-full font-medium ${
                        assignment.status === 'completed' ? 'bg-green-100 text-green-700' :
                        assignment.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                        assignment.status === 'in-progress' ? 'bg-yellow-100 text-yellow-700' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {assignment.status.replace('-', ' ').replace('_', ' ')}
                      </span>
                      
                      <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                        View Details →
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredAssignments.filter(a => searchTerm === '' || a.studentName.toLowerCase().includes(searchTerm.toLowerCase())).length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-xl">
                <p className="text-gray-500">No assignments found matching your filters</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="space-y-6">
            {/* Calendar Header */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Events & Class Calendar</h2>
                  <p className="text-sm text-gray-500 mt-1">View all scheduled classes and school events</p>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center bg-gray-100 rounded-lg p-1">
                    <button
                      onClick={() => setCalendarView('week')}
                      className={`px-3 py-1 rounded ${calendarView === 'week' ? 'bg-white shadow' : ''}`}
                    >
                      Week
                    </button>
                    <button
                      onClick={() => setCalendarView('month')}
                      className={`px-3 py-1 rounded ${calendarView === 'month' ? 'bg-white shadow' : ''}`}
                    >
                      Month
                    </button>
                  </div>
                  <button 
                    onClick={() => setShowAddEvent(true)}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Event</span>
                  </button>
                </div>
              </div>
              
              {/* Week Navigation */}
              <div className="flex items-center justify-between mb-4">
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <h3 className="text-lg font-medium">
                  {calendarView === 'week' ? 'Week of January 15-21, 2025' : 'January 2025'}
                </h3>
                <button className="p-2 hover:bg-gray-100 rounded-lg">
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {/* Weekly Calendar View */}
            {calendarView === 'week' && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="grid grid-cols-8 border-b">
                  <div className="p-4 bg-gray-50 border-r">
                    <p className="text-xs font-medium text-gray-500">TIME</p>
                  </div>
                  {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => (
                    <div key={day} className="p-4 bg-gray-50 border-r last:border-r-0">
                      <p className="text-sm font-medium text-gray-700">{day}</p>
                      <p className="text-xs text-gray-500">Jan {15 + index}</p>
                    </div>
                  ))}
                </div>
                
                {/* Time Slots */}
                {['8:00 AM', '8:30 AM', '9:00 AM', '9:30 AM', '10:00 AM', '10:30 AM', '11:00 AM', '11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM', '2:00 PM', '2:30 PM', '3:00 PM', '3:30 PM'].map(time => {
                  // Get classes scheduled for this time
                  const getClassesForTimeAndDay = (timeSlot, dayIndex) => {
                    const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
                    return classes.filter(cls => {
                      const scheduleTime = cls.schedule.split(' ').slice(-2).join(' ');
                      const scheduleDays = cls.schedule.split(' ').slice(0, -2).join(' ');
                      
                      // Check if this class is scheduled for this time
                      if (scheduleTime !== timeSlot) return false;
                      
                      // Check if this class is scheduled for this day
                      if (scheduleDays === 'Mon-Fri' && dayIndex < 5) return true;
                      if (scheduleDays === 'Tue-Thu' && [1, 3].includes(dayIndex)) return true;
                      if (scheduleDays === 'Mon-Wed-Fri' && [0, 2, 4].includes(dayIndex)) return true;
                      if (scheduleDays.includes(dayNames[dayIndex])) return true;
                      
                      return false;
                    });
                  };
                  
                  const colors = ['blue', 'purple', 'green', 'orange', 'pink', 'teal', 'indigo', 'red'];
                  const getColorForClass = (classId) => {
                    const index = classes.findIndex(c => c.id === classId);
                    return colors[index % colors.length];
                  };
                  
                  return (
                    <div key={time} className="grid grid-cols-8 border-b last:border-b-0">
                      <div className="p-3 text-xs text-gray-500 border-r bg-gray-50">
                        {time}
                      </div>
                      
                      {/* Days of the week */}
                      {[0, 1, 2, 3, 4, 5, 6].map(dayIndex => {
                        const dayClasses = getClassesForTimeAndDay(time, dayIndex);
                        
                        return (
                          <div key={dayIndex} className="p-2 border-r last:border-r-0 min-h-[80px] relative">
                            {dayClasses.length === 1 && (
                              <div className={`absolute inset-x-1 top-1 bottom-1 bg-gradient-to-r from-${getColorForClass(dayClasses[0].id)}-500 to-${getColorForClass(dayClasses[0].id)}-600 rounded-lg p-2 text-white cursor-pointer hover:shadow-lg transition`}>
                                <p className="text-xs font-semibold truncate">{dayClasses[0].name}</p>
                                <p className="text-xs opacity-90">{dayClasses[0].room}</p>
                                <p className="text-xs opacity-90">{dayClasses[0].students} students</p>
                              </div>
                            )}
                            
                            {dayClasses.length === 2 && (
                              <div className="absolute inset-x-1 top-1 bottom-1 flex space-x-1">
                                {dayClasses.map((cls, idx) => (
                                  <div key={idx} className={`flex-1 bg-gradient-to-r from-${getColorForClass(cls.id)}-500 to-${getColorForClass(cls.id)}-600 rounded-lg p-1 text-white cursor-pointer hover:shadow-lg transition`}>
                                    <p className="text-[10px] font-semibold truncate">{cls.name}</p>
                                    <p className="text-[9px] opacity-90">{cls.room}</p>
                                    <p className="text-[9px] opacity-90">{cls.students} students</p>
                                  </div>
                                ))}
                              </div>
                            )}
                            
                            {dayClasses.length > 2 && (
                              <div className="absolute inset-x-1 top-1 bottom-1 flex space-x-1">
                                {dayClasses.slice(0, 2).map((cls, idx) => (
                                  <div key={idx} className={`flex-1 bg-gradient-to-r from-${getColorForClass(cls.id)}-500 to-${getColorForClass(cls.id)}-600 rounded-lg p-1 text-white cursor-pointer hover:shadow-lg transition`}>
                                    <p className="text-[10px] font-semibold truncate">{cls.name}</p>
                                    <p className="text-[9px] opacity-90">{cls.room}</p>
                                  </div>
                                ))}
                                <div className="px-2 bg-gray-600 rounded-lg flex items-center justify-center text-white cursor-pointer hover:bg-gray-700 transition group relative">
                                  <p className="text-[10px] font-semibold">+{dayClasses.length - 2}</p>
                                  <div className="absolute bottom-full left-0 mb-2 hidden group-hover:block z-20">
                                    <div className="bg-gray-900 text-white p-2 rounded-lg shadow-lg whitespace-nowrap">
                                      {dayClasses.slice(2).map((cls, idx) => (
                                        <div key={idx} className="mb-1">
                                          <p className="text-xs font-semibold">{cls.name}</p>
                                          <p className="text-xs opacity-90">{cls.room} • {cls.students} students</p>
                                        </div>
                                      ))}
                                    </div>
                                    <div className="absolute top-full left-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                                  </div>
                                </div>
                              </div>
                            )}
                            
                            {/* Special events (keep some hardcoded events for variety) */}
                            {dayIndex === 4 && time === '1:00 PM' && (
                              <div className="absolute inset-x-1 top-1 h-[120px] bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-lg p-2 text-white cursor-pointer hover:shadow-lg transition z-10">
                                <p className="text-xs font-semibold">Jummah Prayer</p>
                                <p className="text-xs opacity-90">Mosque</p>
                                <p className="text-xs opacity-90">All students & staff</p>
                              </div>
                            )}
                            
                            {dayIndex === 2 && time === '3:00 PM' && (
                              <div className="absolute inset-x-1 top-1 bottom-1 bg-gradient-to-r from-red-500 to-red-600 rounded-lg p-2 text-white cursor-pointer hover:shadow-lg transition">
                                <p className="text-xs font-semibold">Special Event</p>
                                <p className="text-xs opacity-90">Quran Competition</p>
                                <p className="text-xs opacity-90">Assembly Hall</p>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>
            )}
            
            {/* Monthly Calendar View (placeholder) */}
            {calendarView === 'month' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-center py-12 text-gray-500">
                  <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                  <p className="text-lg font-medium">Monthly View Coming Soon</p>
                  <p className="text-sm mt-1">Switch to week view to see the class schedule</p>
                </div>
              </div>
            )}
            
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-3">
                  <Calendar className="w-8 h-8 text-blue-500" />
                  <span className="text-2xl font-bold text-gray-900">32</span>
                </div>
                <p className="text-sm font-medium text-gray-700">Classes This Week</p>
                <p className="text-xs text-gray-500 mt-1">Across all programs</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-3">
                  <Clock className="w-8 h-8 text-green-500" />
                  <span className="text-2xl font-bold text-gray-900">128</span>
                </div>
                <p className="text-sm font-medium text-gray-700">Teaching Hours</p>
                <p className="text-xs text-gray-500 mt-1">Total weekly hours</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-3">
                  <Users className="w-8 h-8 text-purple-500" />
                  <span className="text-2xl font-bold text-gray-900">245</span>
                </div>
                <p className="text-sm font-medium text-gray-700">Students Enrolled</p>
                <p className="text-xs text-gray-500 mt-1">In scheduled classes</p>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-3">
                  <Award className="w-8 h-8 text-orange-500" />
                  <span className="text-2xl font-bold text-gray-900">3</span>
                </div>
                <p className="text-sm font-medium text-gray-700">Special Events</p>
                <p className="text-xs text-gray-500 mt-1">This week</p>
              </div>
            </div>
            
            {/* Upcoming Events List */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Upcoming Events</h3>
              <div className="space-y-3">
                {[
                  { date: 'Wed, Jan 17', time: '3:00 PM', title: 'Quran Competition', type: 'competition', location: 'Assembly Hall', color: 'red' },
                  { date: 'Fri, Jan 19', time: '1:00 PM', title: 'Jummah Prayer', type: 'prayer', location: 'Mosque', color: 'indigo' },
                  { date: 'Sun, Jan 21', time: '10:00 AM', title: 'Parent-Teacher Meeting', type: 'meeting', location: 'Conference Room', color: 'cyan' },
                  { date: 'Mon, Jan 22', time: '2:00 PM', title: 'Science Fair', type: 'event', location: 'Main Hall', color: 'purple' },
                  { date: 'Wed, Jan 24', time: '11:00 AM', title: 'Field Trip', type: 'trip', location: 'Islamic Museum', color: 'green' },
                ].map((event, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className={`w-2 h-12 bg-${event.color}-500 rounded-full`}></div>
                      <div>
                        <p className="font-medium text-gray-900">{event.title}</p>
                        <p className="text-sm text-gray-500">{event.date} • {event.time} • {event.location}</p>
                      </div>
                    </div>
                    <button className="text-blue-600 hover:text-blue-700 text-sm font-medium">
                      View Details
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'messages' && (
          <div className="space-y-6">
            {/* Messages Header */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold">Messages & Communications</h2>
                  <p className="text-sm text-gray-500 mt-1">Send messages to parents, students, and teachers</p>
                </div>
                <button 
                  onClick={() => setShowComposeMessage(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Compose Message</span>
                </button>
              </div>
              
              {/* Message Tabs */}
              <div className="flex space-x-6 border-b">
                {['inbox', 'sent', 'drafts', 'scheduled'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveMessageTab(tab)}
                    className={`pb-3 px-2 border-b-2 font-medium text-sm capitalize ${
                      activeMessageTab === tab
                        ? 'border-blue-600 text-blue-600'
                        : 'border-transparent text-gray-500 hover:text-gray-700'
                    }`}
                  >
                    {tab}
                    {tab === 'inbox' && (
                      <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">3</span>
                    )}
                  </button>
                ))}
              </div>
            </div>
            
            {/* Messages List */}
            {activeMessageTab === 'inbox' && (
              <div className="bg-white rounded-xl shadow-sm overflow-hidden">
                <div className="divide-y">
                  {[
                    { id: 1, from: 'Ahmed Al-Zahra (Parent)', subject: 'Question about homework', preview: 'Hello, I wanted to ask about the Quran memorization homework...', time: '10 minutes ago', unread: true, type: 'parent' },
                    { id: 2, from: 'Sheikh Muhammad Ali (Teacher)', subject: 'Class Schedule Update', preview: 'The Quran class will be rescheduled to 9:00 AM starting next week...', time: '2 hours ago', unread: true, type: 'teacher' },
                    { id: 3, from: 'System Notification', subject: 'Monthly Report Ready', preview: 'The monthly performance report for January is now available...', time: '5 hours ago', unread: true, type: 'system' },
                    { id: 4, from: 'Omar Khan (Parent)', subject: 'Re: Parent-Teacher Meeting', preview: 'Thank you for scheduling the meeting. I confirm my attendance...', time: 'Yesterday', unread: false, type: 'parent' },
                    { id: 5, from: 'Ustadha Sarah Ahmed (Teacher)', subject: 'Tajweed Test Results', preview: 'Please find attached the results of last week\'s Tajweed test...', time: '2 days ago', unread: false, type: 'teacher' },
                  ].map(message => (
                    <div key={message.id} className={`p-4 hover:bg-gray-50 cursor-pointer ${message.unread ? 'bg-blue-50' : ''}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-start space-x-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            message.type === 'parent' ? 'bg-green-100 text-green-600' :
                            message.type === 'teacher' ? 'bg-purple-100 text-purple-600' :
                            'bg-gray-100 text-gray-600'
                          }`}>
                            {message.type === 'parent' ? <Users className="w-5 h-5" /> :
                             message.type === 'teacher' ? <GraduationCap className="w-5 h-5" /> :
                             <Bell className="w-5 h-5" />}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <p className={`text-sm ${message.unread ? 'font-semibold' : 'font-medium'} text-gray-900`}>
                                {message.from}
                              </p>
                              {message.unread && (
                                <span className="w-2 h-2 bg-blue-600 rounded-full"></span>
                              )}
                            </div>
                            <p className={`text-sm ${message.unread ? 'font-medium' : ''} text-gray-900 mt-1`}>
                              {message.subject}
                            </p>
                            <p className="text-sm text-gray-500 mt-1 line-clamp-1">
                              {message.preview}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">{message.time}</p>
                          <div className="flex items-center space-x-1 mt-2">
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Eye className="w-4 h-4 text-gray-600" />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Mail className="w-4 h-4 text-gray-600" />
                            </button>
                            <button className="p-1 hover:bg-gray-100 rounded">
                              <Trash2 className="w-4 h-4 text-gray-600" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {activeMessageTab === 'sent' && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="text-center py-8">
                  <Mail className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-500">Your sent messages will appear here</p>
                </div>
              </div>
            )}
            
            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button 
                onClick={() => {
                  setMessageRecipientType('parents');
                  setShowComposeMessage(true);
                }}
                className="bg-white border rounded-xl p-4 hover:shadow-lg transition text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Message All Parents</p>
                    <p className="text-sm text-gray-500">Send announcement to all parents</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => {
                  setMessageRecipientType('teachers');
                  setShowComposeMessage(true);
                }}
                className="bg-white border rounded-xl p-4 hover:shadow-lg transition text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Message All Teachers</p>
                    <p className="text-sm text-gray-500">Send updates to teaching staff</p>
                  </div>
                </div>
              </button>
              
              <button 
                onClick={() => {
                  setMessageRecipientType('students');
                  setShowComposeMessage(true);
                }}
                className="bg-white border rounded-xl p-4 hover:shadow-lg transition text-left"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                    <GraduationCap className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">Message All Students</p>
                    <p className="text-sm text-gray-500">Send announcements to students</p>
                  </div>
                </div>
              </button>
            </div>
            
            {/* Communication Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">156</p>
                    <p className="text-sm text-gray-500">Messages Sent</p>
                  </div>
                  <Send className="w-8 h-8 text-blue-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">89%</p>
                    <p className="text-sm text-gray-500">Open Rate</p>
                  </div>
                  <Eye className="w-8 h-8 text-green-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">24</p>
                    <p className="text-sm text-gray-500">Pending Replies</p>
                  </div>
                  <Clock className="w-8 h-8 text-orange-500" />
                </div>
              </div>
              <div className="bg-white rounded-lg border p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-bold text-gray-900">3</p>
                    <p className="text-sm text-gray-500">Scheduled</p>
                  </div>
                  <Calendar className="w-8 h-8 text-purple-500" />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reports' && (
          <div className="space-y-6">
            {/* Reports Header */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold">Reports & Analytics</h2>
                <div className="flex items-center space-x-3">
                  <div className="relative">
                    <select 
                      className="px-4 py-2 border rounded-lg"
                      value={reportDateRange}
                      onChange={(e) => {
                        setReportDateRange(e.target.value);
                        if (e.target.value === 'custom') {
                          setShowCustomDatePicker(true);
                        }
                      }}
                    >
                      <option value="30days">Last 30 Days</option>
                      <option value="3months">Last 3 Months</option>
                      <option value="6months">Last 6 Months</option>
                      <option value="year">This Year</option>
                      <option value="custom">Custom Range</option>
                    </select>
                  </div>
                  
                  <button 
                    onClick={() => setShowCustomDatePicker(true)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <Calendar className="w-4 h-4" />
                    <span>Select Dates</span>
                  </button>
                  
                  <button 
                    onClick={() => {
                      const dateInfo = reportDateRange === 'custom' ? 
                        `${customStartDate || 'Start'} to ${customEndDate || 'End'}` : 
                        reportDateRange;
                      const content = `School Report - ${schoolInfo.name}\nDate Range: ${dateInfo}\nGenerated: ${new Date().toLocaleDateString()}\n\nMetrics:\nAvg Attendance: ${reportDateRange === '30days' ? '94.2%' : '92.8%'}\nCompletion Rate: ${reportDateRange === '30days' ? '82.5%' : '80.2%'}\nAvg Performance: ${reportDateRange === '30days' ? '3.8' : '3.7'}\nTotal Hours: ${reportDateRange === '30days' ? '156' : '468'}`;
                      const blob = new Blob([content], { type: 'text/plain' });
                      const url = window.URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `School_Report_${new Date().toISOString().split('T')[0]}.txt`;
                      a.click();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Export PDF</span>
                  </button>
                </div>
              </div>
              
              {/* Key Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <p className="text-2xl font-bold text-blue-600">
                    {reportDateRange === '30days' ? '94.2%' : 
                     reportDateRange === '3months' ? '92.8%' : 
                     reportDateRange === '6months' ? '91.5%' : 
                     reportDateRange === 'custom' ? '93.1%' : '90.3%'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Avg Attendance</p>
                  <p className="text-xs text-blue-500 mt-1">↑ 2.3% from last period</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <p className="text-2xl font-bold text-green-600">
                    {reportDateRange === '30days' ? '82.5%' : 
                     reportDateRange === '3months' ? '80.2%' : 
                     reportDateRange === '6months' ? '78.9%' : 
                     reportDateRange === 'custom' ? '81.0%' : '77.4%'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Completion Rate</p>
                  <p className="text-xs text-green-500 mt-1">↑ 5.1% from last period</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <p className="text-2xl font-bold text-purple-600">
                    {reportDateRange === '30days' ? '3.8' : 
                     reportDateRange === '3months' ? '3.7' : 
                     reportDateRange === '6months' ? '3.6' : 
                     reportDateRange === 'custom' ? '3.75' : '3.5'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Avg Performance</p>
                  <p className="text-xs text-purple-500 mt-1">↑ 0.2 from last period</p>
                </div>
                <div className="text-center p-4 bg-orange-50 rounded-lg">
                  <p className="text-2xl font-bold text-orange-600">
                    {reportDateRange === '30days' ? '156' : 
                     reportDateRange === '3months' ? '468' : 
                     reportDateRange === '6months' ? '936' : 
                     reportDateRange === 'custom' ? '312' : '1872'}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">Total Hours</p>
                  <p className="text-xs text-orange-500 mt-1">↑ 12% from last period</p>
                </div>
              </div>
            </div>

            {/* Student Performance Trends */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">Student Performance Overview</h3>
                  <p className="text-sm text-gray-500 mt-1">Average test scores by month for selected student group</p>
                </div>
                <select 
                  className="px-3 py-1 border rounded-lg text-sm"
                  value={performanceFilter}
                  onChange={(e) => setPerformanceFilter(e.target.value)}
                >
                  <option value="all">All Students</option>
                  <option value="top10">Top Performers (Top 10%)</option>
                  <option value="average">Average Performers</option>
                  <option value="needsHelp">Students Needing Help</option>
                </select>
              </div>
              
              {/* Simple Bar Chart */}
              <div className="space-y-4">
                {/* Chart Legend */}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-600">Monthly Average Scores</span>
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-green-500 rounded"></div>
                      <span className="text-xs text-gray-600">Excellent (90-100%)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-blue-500 rounded"></div>
                      <span className="text-xs text-gray-600">Good (70-89%)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                      <span className="text-xs text-gray-600">Average (50-69%)</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div className="w-3 h-3 bg-red-500 rounded"></div>
                      <span className="text-xs text-gray-600">Below (0-49%)</span>
                    </div>
                  </div>
                </div>

                {/* Monthly Performance Bars */}
                <div className="space-y-3">
                  {(() => {
                    const monthlyData = performanceFilter === 'top10' ? [
                      { month: 'September', score: 88, students: 25 },
                      { month: 'October', score: 90, students: 25 },
                      { month: 'November', score: 92, students: 24 },
                      { month: 'December', score: 94, students: 24 },
                      { month: 'January', score: 95, students: 25 }
                    ] : performanceFilter === 'average' ? [
                      { month: 'September', score: 70, students: 125 },
                      { month: 'October', score: 72, students: 128 },
                      { month: 'November', score: 75, students: 130 },
                      { month: 'December', score: 78, students: 132 },
                      { month: 'January', score: 80, students: 134 }
                    ] : performanceFilter === 'needsHelp' ? [
                      { month: 'September', score: 45, students: 35 },
                      { month: 'October', score: 48, students: 32 },
                      { month: 'November', score: 52, students: 30 },
                      { month: 'December', score: 58, students: 28 },
                      { month: 'January', score: 62, students: 25 }
                    ] : [
                      { month: 'September', score: 75, students: 245 },
                      { month: 'October', score: 78, students: 245 },
                      { month: 'November', score: 82, students: 245 },
                      { month: 'December', score: 85, students: 245 },
                      { month: 'January', score: 87, students: 245 }
                    ];

                    return monthlyData.map((data, index) => (
                      <div key={index} className="space-y-1">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium text-gray-700 w-24">{data.month}</span>
                          <div className="flex-1 mx-4">
                            <div className="w-full bg-gray-200 rounded-full h-8 relative overflow-hidden">
                              <div 
                                className={`h-full rounded-full transition-all duration-500 flex items-center justify-end pr-2 ${
                                  data.score >= 90 ? 'bg-green-500' :
                                  data.score >= 70 ? 'bg-blue-500' :
                                  data.score >= 50 ? 'bg-yellow-500' :
                                  'bg-red-500'
                                }`}
                                style={{ width: `${data.score}%` }}
                              >
                                <span className="text-white text-xs font-semibold">{data.score}%</span>
                              </div>
                            </div>
                          </div>
                          <span className="text-sm text-gray-600 w-20 text-right">{data.students} students</span>
                        </div>
                      </div>
                    ));
                  })()}
                </div>

                {/* Summary Stats */}
                <div className="grid grid-cols-4 gap-4 pt-4 border-t">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-gray-900">
                      {performanceFilter === 'top10' ? '92%' :
                       performanceFilter === 'average' ? '75%' :
                       performanceFilter === 'needsHelp' ? '52%' : '82%'}
                    </p>
                    <p className="text-xs text-gray-500">Current Average</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-600">
                      {performanceFilter === 'top10' ? '+7%' :
                       performanceFilter === 'average' ? '+10%' :
                       performanceFilter === 'needsHelp' ? '+17%' : '+12%'}
                    </p>
                    <p className="text-xs text-gray-500">Improvement</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-600">
                      {performanceFilter === 'top10' ? '25' :
                       performanceFilter === 'average' ? '134' :
                       performanceFilter === 'needsHelp' ? '25' : '245'}
                    </p>
                    <p className="text-xs text-gray-500">Total Students</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {performanceFilter === 'top10' ? '95%' :
                       performanceFilter === 'average' ? '80%' :
                       performanceFilter === 'needsHelp' ? '62%' : '87%'}
                    </p>
                    <p className="text-xs text-gray-500">Latest Score</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Class Performance Comparison */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Class Performance</h3>
                <div className="space-y-3">
                  {classes.slice(0, 5).map((cls, index) => (
                    <div key={cls.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white font-semibold ${
                          index === 0 ? 'bg-gold-500' : 
                          index === 1 ? 'bg-gray-400' : 
                          index === 2 ? 'bg-orange-600' : 'bg-blue-500'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <p className="font-medium">{cls.name}</p>
                          <p className="text-xs text-gray-500">{cls.teacher}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{95 - index * 3}%</p>
                        <p className="text-xs text-green-500">↑ {3 - index * 0.5}%</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Subject Performance</h3>
                <div className="space-y-3">
                  {[
                    { subject: 'Quran Memorization', score: 88, progress: 88 },
                    { subject: 'Tajweed', score: 85, progress: 85 },
                    { subject: 'Islamic Studies', score: 92, progress: 92 },
                    { subject: 'Arabic Language', score: 78, progress: 78 },
                    { subject: 'Hadith', score: 83, progress: 83 }
                  ].map((item) => (
                    <div key={item.subject}>
                      <div className="flex items-center justify-between mb-1">
                        <p className="text-sm font-medium">{item.subject}</p>
                        <p className="text-sm font-semibold">{item.score}%</p>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all"
                          style={{ width: `${item.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recent Assessment Results */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Recent Assessment Results</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Assessment</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Participants</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Avg Score</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    <tr>
                      <td className="px-4 py-3">Surah Al-Mulk Test</td>
                      <td className="px-4 py-3 text-sm text-gray-500">Jan 10, 2025</td>
                      <td className="px-4 py-3 text-sm">45/48</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-green-600">87%</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Completed</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Tajweed Practical</td>
                      <td className="px-4 py-3 text-sm text-gray-500">Jan 8, 2025</td>
                      <td className="px-4 py-3 text-sm">38/42</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-blue-600">82%</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Completed</span>
                      </td>
                    </tr>
                    <tr>
                      <td className="px-4 py-3">Islamic Studies Quiz</td>
                      <td className="px-4 py-3 text-sm text-gray-500">Jan 5, 2025</td>
                      <td className="px-4 py-3 text-sm">52/52</td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-purple-600">91%</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700">Completed</span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Credentials Tab */}
        {activeTab === 'credentials' && (
          <div className="space-y-6">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-indigo-100 text-sm">Total Credentials</p>
                    <p className="text-3xl font-bold mt-1">{credentials.length}</p>
                    <p className="text-indigo-100 text-xs mt-2">All user accounts</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <Key className="w-6 h-6" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">Active Accounts</p>
                    <p className="text-3xl font-bold mt-1">{credentials.filter(c => c.status === 'active').length}</p>
                    <p className="text-green-100 text-xs mt-2">{Math.round((credentials.filter(c => c.status === 'active').length / credentials.length) * 100)}% active</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <Shield className="w-6 h-6" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">Student Accounts</p>
                    <p className="text-3xl font-bold mt-1">{credentials.filter(c => c.userType === 'student').length}</p>
                    <p className="text-blue-100 text-xs mt-2">Student logins</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <Users className="w-6 h-6" />
                  </div>
                </div>
              </div>
              
              <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">Parent Accounts</p>
                    <p className="text-3xl font-bold mt-1">{credentials.filter(c => c.userType === 'parent').length}</p>
                    <p className="text-purple-100 text-xs mt-2">Parent logins</p>
                  </div>
                  <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                    <UserPlus className="w-6 h-6" />
                  </div>
                </div>
              </div>
            </div>

            {/* Main Content */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b bg-gradient-to-r from-gray-50 to-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Credentials Management</h2>
                    <p className="text-sm text-gray-500 mt-1">Create and manage login credentials for all users</p>
                  </div>
                  <div className="flex items-center space-x-3">
                    <button 
                      onClick={() => {
                        const csvContent = [
                          ['User ID', 'Name', 'Type', 'Email', 'Password', 'Status', 'Created', 'Last Modified'],
                          ...credentials.map(c => [
                            c.userId, c.userName, c.userType, c.email, c.password, c.status, c.created, c.lastModified
                          ])
                        ].map(row => row.join(',')).join('\n');
                        
                        const blob = new Blob([csvContent], { type: 'text/csv' });
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = 'credentials_export.csv';
                        a.click();
                      }}
                      className="px-4 py-2.5 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition flex items-center space-x-2 shadow-sm"
                    >
                      <Download className="w-4 h-4" />
                      <span>Export All</span>
                    </button>
                    <button 
                      onClick={() => setShowAddCredential(true)}
                      className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-indigo-700 text-white rounded-lg hover:from-indigo-700 hover:to-indigo-800 transition flex items-center space-x-2 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      <span>Create Credential</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="p-6">
                {/* Search and Filters */}
                <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0 mb-6">
                  <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 flex-1">
                    <div className="relative flex-1 max-w-md">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="text"
                        placeholder="Search by name, email, or user ID..."
                        value={credentialSearch}
                        onChange={(e) => setCredentialSearch(e.target.value)}
                        className="pl-10 pr-4 py-2.5 w-full border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition"
                      />
                    </div>
                    
                    <select 
                      value={credentialFilter}
                      onChange={(e) => setCredentialFilter(e.target.value)}
                      className="px-4 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">All Users</option>
                      <option value="student">Students Only</option>
                      <option value="teacher">Teachers Only</option>
                      <option value="parent">Parents Only</option>
                      <option value="active">Active Only</option>
                      <option value="inactive">Inactive Only</option>
                    </select>
                  </div>
                </div>

                {/* Credentials Table */}
                <div className="overflow-x-auto rounded-lg border border-gray-200">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">User</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Type</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Email</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Password</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Created</th>
                        <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 bg-white">
                      {credentials
                        .filter(cred => {
                          const matchesSearch = !credentialSearch || 
                            cred.userName.toLowerCase().includes(credentialSearch.toLowerCase()) ||
                            cred.email.toLowerCase().includes(credentialSearch.toLowerCase()) ||
                            cred.userId.toLowerCase().includes(credentialSearch.toLowerCase());
                          
                          const matchesFilter = credentialFilter === 'all' ||
                            (credentialFilter === 'active' && cred.status === 'active') ||
                            (credentialFilter === 'inactive' && cred.status !== 'active') ||
                            cred.userType === credentialFilter;
                          
                          return matchesSearch && matchesFilter;
                        })
                        .map(credential => (
                          <tr key={credential.id} className="hover:bg-gray-50 transition">
                            <td className="px-6 py-4">
                              <div className="flex items-center">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                                  credential.userType === 'student' ? 'bg-gradient-to-br from-blue-400 to-blue-600' :
                                  credential.userType === 'teacher' ? 'bg-gradient-to-br from-green-400 to-green-600' :
                                  'bg-gradient-to-br from-purple-400 to-purple-600'
                                }`}>
                                  {credential.userName.split(' ').map(n => n[0]).join('')}
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-semibold text-gray-900">{credential.userName}</p>
                                  <p className="text-xs text-gray-500">ID: {credential.userId}</p>
                                </div>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${
                                credential.userType === 'student' ? 'bg-blue-100 text-blue-800' :
                                credential.userType === 'teacher' ? 'bg-green-100 text-green-800' :
                                'bg-purple-100 text-purple-800'
                              }`}>
                                {credential.userType}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-gray-900">{credential.email}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-mono text-gray-600">
                                  {showPassword[credential.id] ? credential.password : '••••••••'}
                                </span>
                                <button
                                  onClick={() => setShowPassword(prev => ({ ...prev, [credential.id]: !prev[credential.id] }))}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                  title={showPassword[credential.id] ? 'Hide password' : 'Show password'}
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    navigator.clipboard.writeText(credential.password);
                                    alert('Password copied to clipboard!');
                                  }}
                                  className="p-1 text-gray-400 hover:text-gray-600"
                                  title="Copy password"
                                >
                                  <FileText className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                            <td className="px-6 py-4">
                              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                credential.status === 'active' ? 'bg-green-100 text-green-800' :
                                'bg-red-100 text-red-800'
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${
                                  credential.status === 'active' ? 'bg-green-600' : 'bg-red-600'
                                }`}></span>
                                {credential.status}
                              </span>
                            </td>
                            <td className="px-6 py-4">
                              <p className="text-sm text-gray-900">{credential.created}</p>
                              <p className="text-xs text-gray-500">Modified: {credential.lastModified}</p>
                            </td>
                            <td className="px-6 py-4">
                              <div className="flex items-center space-x-1">
                                <button 
                                  onClick={() => setEditingCredential(credential)}
                                  className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition"
                                  title="Edit Credential"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button 
                                  onClick={() => {
                                    const newStatus = credential.status === 'active' ? 'inactive' : 'active';
                                    setCredentials(prev => prev.map(c => 
                                      c.id === credential.id ? { ...c, status: newStatus, lastModified: new Date().toISOString().split('T')[0] } : c
                                    ));
                                  }}
                                  className={`p-1.5 ${
                                    credential.status === 'active' 
                                      ? 'text-gray-400 hover:text-red-600 hover:bg-red-50' 
                                      : 'text-gray-400 hover:text-green-600 hover:bg-green-50'
                                  } rounded-lg transition`}
                                  title={credential.status === 'active' ? 'Deactivate' : 'Activate'}
                                >
                                  {credential.status === 'active' ? <X className="w-4 h-4" /> : <Check className="w-4 h-4" />}
                                </button>
                                <button 
                                  onClick={() => {
                                    if (confirm(`Are you sure you want to delete credentials for ${credential.userName}?`)) {
                                      setCredentials(prev => prev.filter(c => c.id !== credential.id));
                                    }
                                  }}
                                  className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                                  title="Delete Credential"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                  
                  {credentials.filter(cred => {
                    const matchesSearch = !credentialSearch || 
                      cred.userName.toLowerCase().includes(credentialSearch.toLowerCase()) ||
                      cred.email.toLowerCase().includes(credentialSearch.toLowerCase()) ||
                      cred.userId.toLowerCase().includes(credentialSearch.toLowerCase());
                    
                    const matchesFilter = credentialFilter === 'all' ||
                      (credentialFilter === 'active' && cred.status === 'active') ||
                      (credentialFilter === 'inactive' && cred.status !== 'active') ||
                      cred.userType === credentialFilter;
                    
                    return matchesSearch && matchesFilter;
                  }).length === 0 && (
                    <tr>
                      <td colSpan={7} className="px-6 py-12 text-center">
                        <Key className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-500">No credentials found</p>
                        <p className="text-sm text-gray-400 mt-1">Try adjusting your search or filters</p>
                      </td>
                    </tr>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Notification Preferences Modal */}
      {showNotificationPreferences && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Bell className="w-6 h-6 text-blue-600" />
                  <h2 className="text-xl font-semibold">Notification Preferences</h2>
                </div>
                <button 
                  onClick={() => setShowNotificationPreferences(false)} 
                  className="p-2 hover:bg-gray-100 rounded-lg"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {/* Email Notifications */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Mail className="w-5 h-5 mr-2 text-gray-600" />
                  Email Notifications
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-medium">Assignments</p>
                        <p className="text-sm text-gray-500">New assignments and submission updates</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.email.assignments}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        email: {...notificationSettings.email, assignments: e.target.checked}
                      })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-medium">Attendance</p>
                        <p className="text-sm text-gray-500">Daily attendance reports and alerts</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.email.attendance}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        email: {...notificationSettings.email, attendance: e.target.checked}
                      })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <Award className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-medium">Grades</p>
                        <p className="text-sm text-gray-500">Grade updates and progress reports</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.email.grades}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        email: {...notificationSettings.email, grades: e.target.checked}
                      })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-medium">Announcements</p>
                        <p className="text-sm text-gray-500">Important school announcements</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.email.announcements}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        email: {...notificationSettings.email, announcements: e.target.checked}
                      })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <div>
                        <p className="font-medium">Reminders</p>
                        <p className="text-sm text-gray-500">Event reminders and deadlines</p>
                      </div>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.email.reminders}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        email: {...notificationSettings.email, reminders: e.target.checked}
                      })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
              
              {/* In-App Notifications */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Bell className="w-5 h-5 mr-2 text-gray-600" />
                  In-App Notifications
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <FileText className="w-4 h-4 text-gray-500" />
                      <span>Assignments</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.inApp.assignments}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        inApp: {...notificationSettings.inApp, assignments: e.target.checked}
                      })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <CheckCircle className="w-4 h-4 text-gray-500" />
                      <span>Attendance</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.inApp.attendance}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        inApp: {...notificationSettings.inApp, attendance: e.target.checked}
                      })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <Award className="w-4 h-4 text-gray-500" />
                      <span>Grades</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.inApp.grades}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        inApp: {...notificationSettings.inApp, grades: e.target.checked}
                      })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="w-4 h-4 text-gray-500" />
                      <span>Announcements</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.inApp.announcements}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        inApp: {...notificationSettings.inApp, announcements: e.target.checked}
                      })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                  
                  <label className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <div className="flex items-center space-x-3">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span>Reminders</span>
                    </div>
                    <input 
                      type="checkbox" 
                      checked={notificationSettings.inApp.reminders}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        inApp: {...notificationSettings.inApp, reminders: e.target.checked}
                      })}
                      className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                  </label>
                </div>
              </div>
              
              {/* Notification Frequency */}
              <div className="mb-8">
                <h3 className="text-lg font-semibold mb-4 flex items-center">
                  <Clock className="w-5 h-5 mr-2 text-gray-600" />
                  Notification Frequency
                </h3>
                <div className="space-y-2">
                  <label className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input 
                      type="radio" 
                      name="frequency"
                      value="immediate"
                      checked={notificationSettings.frequency === 'immediate'}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        frequency: e.target.value
                      })}
                      className="w-4 h-4 text-blue-600 mr-3"
                    />
                    <div>
                      <p className="font-medium">Immediate</p>
                      <p className="text-sm text-gray-500">Get notified as soon as something happens</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input 
                      type="radio" 
                      name="frequency"
                      value="daily"
                      checked={notificationSettings.frequency === 'daily'}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        frequency: e.target.value
                      })}
                      className="w-4 h-4 text-blue-600 mr-3"
                    />
                    <div>
                      <p className="font-medium">Daily Digest</p>
                      <p className="text-sm text-gray-500">Receive a summary once a day</p>
                    </div>
                  </label>
                  
                  <label className="flex items-center p-3 hover:bg-gray-50 rounded-lg cursor-pointer">
                    <input 
                      type="radio" 
                      name="frequency"
                      value="weekly"
                      checked={notificationSettings.frequency === 'weekly'}
                      onChange={(e) => setNotificationSettings({
                        ...notificationSettings,
                        frequency: e.target.value
                      })}
                      className="w-4 h-4 text-blue-600 mr-3"
                    />
                    <div>
                      <p className="font-medium">Weekly Summary</p>
                      <p className="text-sm text-gray-500">Receive a summary once a week</p>
                    </div>
                  </label>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button 
                onClick={() => setShowNotificationPreferences(false)} 
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  alert('Notification preferences saved successfully!');
                  setShowNotificationPreferences(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Preferences
              </button>
            </div>
          </div>
        </div>
      )}

      {/* School Profile View - Overlay */}
      {showProfile && (
        <div className="fixed inset-0 bg-white z-40 overflow-y-auto">
          <div className="min-h-screen">
            {/* Profile Header with Back Button */}
            <div className="bg-white shadow-sm border-b sticky top-0 z-50">
              <div className="px-6 py-4">
                <div className="flex items-center space-x-4">
                  <button
                    onClick={() => setShowProfile(false)}
                    className="p-2 hover:bg-gray-100 rounded-lg transition"
                  >
                    <ChevronLeft className="w-5 h-5 text-gray-600" />
                  </button>
                  <div className="flex items-center space-x-4">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                      <School className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">School Profile</h1>
                      <p className="text-sm text-gray-500">Manage your school's information and settings</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Profile Content */}
            <SchoolProfile />
          </div>
        </div>
      )}

      {/* Modals */}
      {showBulkUpload && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold">Bulk Upload Students</h2>
                  <p className="text-sm text-gray-500 mt-1">Upload Excel file with student information</p>
                </div>
                <button onClick={() => {
                  setShowBulkUpload(false);
                  setUploadedData([]);
                  setDuplicates([]);
                }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            {!uploadedData.length && !duplicates.length && (
              <div className="p-6">
                {/* Download Template Section */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start space-x-3">
                    <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-medium text-blue-900">Excel Template Format</p>
                      <p className="text-xs text-blue-700 mt-1">Your Excel file should have 4 columns: Name, Email, Age, Gender</p>
                      <button 
                        onClick={() => {
                          // Create and download template
                          const templateData = [
                            ['Name', 'Email', 'Age', 'Gender'],
                            ['Ahmad Hassan', 'ahmad@example.com', '12', 'Male'],
                            ['Fatima Ali', 'fatima@example.com', '11', 'Female'],
                            ['Example Student', 'student@example.com', '13', 'Male']
                          ];
                          
                          const csvContent = templateData.map(row => row.join(',')).join('\n');
                          const blob = new Blob([csvContent], { type: 'text/csv' });
                          const url = URL.createObjectURL(blob);
                          const a = document.createElement('a');
                          a.href = url;
                          a.download = 'student_upload_template.csv';
                          a.click();
                        }}
                        className="mt-2 text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center"
                      >
                        <Download className="w-4 h-4 mr-1" />
                        Download Template
                      </button>
                    </div>
                  </div>
                </div>
                
                {/* Upload Section */}
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-2">Drop your Excel file here or click to browse</p>
                  <p className="text-xs text-gray-500 mb-4">Supports .xlsx, .xls, and .csv files</p>
                  <input 
                    type="file" 
                    accept=".xlsx,.xls,.csv"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (e) => {
                          // Parse the file based on extension
                          const fileName = file.name.toLowerCase();
                          if (fileName.endsWith('.csv')) {
                            handleBulkUpload(e.target.result);
                          } else {
                            // For Excel files, we'll parse them as CSV for now
                            // In production, you'd use a library like xlsx
                            handleBulkUpload(e.target.result);
                          }
                        };
                        reader.readAsText(file);
                      }
                    }}
                    className="hidden"
                    id="excel-upload"
                  />
                  <label htmlFor="excel-upload" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 cursor-pointer inline-block">
                    Select Excel File
                  </label>
                </div>
              </div>
            )}
            
            {/* Preview Uploaded Data */}
            {uploadedData.length > 0 && duplicates.length === 0 && (
              <div className="p-6">
                <h3 className="font-semibold text-gray-900 mb-3">Preview Uploaded Data</h3>
                <div className="bg-gray-50 rounded-lg p-4 max-h-64 overflow-y-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-3 py-2 text-left">Name</th>
                        <th className="px-3 py-2 text-left">Email</th>
                        <th className="px-3 py-2 text-left">Age</th>
                        <th className="px-3 py-2 text-left">Gender</th>
                        <th className="px-3 py-2 text-left">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {uploadedData.map((row, index) => (
                        <tr key={index}>
                          <td className="px-3 py-2">{row.Name || row.name}</td>
                          <td className="px-3 py-2">{row.Email || row.email}</td>
                          <td className="px-3 py-2">{row.Age || row.age}</td>
                          <td className="px-3 py-2">{row.Gender || row.gender}</td>
                          <td className="px-3 py-2">
                            <span className="px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">New</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="flex justify-between items-center mt-4">
                  <p className="text-sm text-gray-600">
                    {uploadedData.length} students will be added
                  </p>
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => {
                        setUploadedData([]);
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={() => {
                        // Add students to the list
                        confirmUpload(uploadedData, []);
                      }}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Confirm Upload
                    </button>
                  </div>
                </div>
              </div>
            )}
            
            {/* Duplicate Handling */}
            {duplicates.length > 0 && (
              <div className="p-6">
                <div className="mb-4">
                  <h3 className="font-semibold text-gray-900 mb-2">Duplicates Detected</h3>
                  <p className="text-sm text-gray-600">We found {duplicates.length} duplicate entries. Choose how to handle them:</p>
                </div>
                
                {/* Duplicate Options */}
                <div className="space-y-3 mb-4">
                  <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="duplicate-action" value="override" className="mt-1 mr-3" />
                    <div>
                      <p className="font-medium text-sm">Override Existing</p>
                      <p className="text-xs text-gray-500">Replace existing student data with new data</p>
                    </div>
                  </label>
                  
                  <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="duplicate-action" value="skip" className="mt-1 mr-3" defaultChecked />
                    <div>
                      <p className="font-medium text-sm">Skip Duplicates</p>
                      <p className="text-xs text-gray-500">Only upload new students, ignore duplicates</p>
                    </div>
                  </label>
                  
                  <label className="flex items-start p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                    <input type="radio" name="duplicate-action" value="edit" className="mt-1 mr-3" />
                    <div>
                      <p className="font-medium text-sm">Review & Edit</p>
                      <p className="text-xs text-gray-500">Manually review and edit each duplicate</p>
                    </div>
                  </label>
                </div>
                
                {/* Duplicate List */}
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-h-48 overflow-y-auto mb-4">
                  <p className="text-sm font-medium text-yellow-900 mb-2">Duplicate Students:</p>
                  <div className="space-y-2">
                    {duplicates.map((dup, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div>
                          <span className="font-medium">{dup.Name || dup.name}</span>
                          <span className="text-gray-500 ml-2">({dup.Email || dup.email})</span>
                        </div>
                        <span className="text-xs text-yellow-700">Row {dup.rowIndex}</span>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3">
                  <button 
                    onClick={() => {
                      setDuplicates([]);
                      setUploadedData([]);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={() => {
                      const action = document.querySelector('input[name="duplicate-action"]:checked')?.value;
                      
                      if (action === 'skip') {
                        // Upload only non-duplicates
                        const nonDuplicates = uploadedData.filter(row => 
                          !duplicates.some(dup => (dup.Email || dup.email) === (row.Email || row.email))
                        );
                        confirmUpload(nonDuplicates, []);
                      } else if (action === 'override') {
                        // Upload all including duplicates
                        confirmUpload(uploadedData, duplicates);
                      } else if (action === 'edit') {
                        // Show edit interface
                        setShowDuplicateReview(true);
                      }
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Process Upload
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Student Modal */}
      {showAddModal && addModalType === 'student' && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Add New Student</h2>
                <button onClick={() => setShowAddModal(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const newStudent = {
                  id: `STU${String(students.length + 1).padStart(3, '0')}`,
                  name: formData.get('name'),
                  email: formData.get('email'),
                  age: parseInt(formData.get('age')),
                  gender: formData.get('gender'),
                  grade: '5th Grade', // Default grade
                  class: 'Unassigned', // Will be assigned in Class Builder
                  phone: '', // Can be added later
                  parent: '', // Will be linked in Parents section
                  joinDate: new Date().toISOString().split('T')[0],
                  progress: Math.floor(Math.random() * 30) + 60,
                  attendance: Math.floor(Math.random() * 10) + 85,
                  status: 'active',
                  memorized: '0 Juz'
                };
                
                // Check for duplicate email
                if (students.some(s => s.email.toLowerCase() === newStudent.email.toLowerCase())) {
                  alert('A student with this email already exists!');
                  return;
                }
                
                setStudents(prev => [...prev, newStudent]);
                alert(`Student ${newStudent.name} added successfully!`);
                setShowAddModal(false);
                e.target.reset();
              }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input 
                    type="text" 
                    name="name"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                    placeholder="Enter student's full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input 
                    type="email" 
                    name="email"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                    placeholder="student@example.com"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                    <input 
                      type="number" 
                      name="age"
                      required
                      min="4"
                      max="25"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                      placeholder="Student age"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                    <select 
                      name="gender"
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    <strong>Note:</strong> After adding the student, you can:
                  </p>
                  <ul className="text-xs text-blue-600 mt-1 ml-4 list-disc">
                    <li>Assign them to a class in Class Builder</li>
                    <li>Link them to a parent in Parents section</li>
                    <li>Update additional details later</li>
                  </ul>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddModal(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Add Student
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {showStudentDetails && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Student Details</h2>
                <button onClick={() => setShowStudentDetails(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-lg">{showStudentDetails.name}</h3>
                  <p className="text-gray-500">{showStudentDetails.id}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-500">Email</p>
                    <p className="font-medium">{showStudentDetails.email}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Phone</p>
                    <p className="font-medium">{showStudentDetails.phone}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Grade</p>
                    <p className="font-medium">{showStudentDetails.grade}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Class</p>
                    <p className="font-medium">{showStudentDetails.class}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Parent</p>
                    <p className="font-medium">{showStudentDetails.parent}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Join Date</p>
                    <p className="font-medium">{showStudentDetails.joinDate}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {editingStudent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Edit Student - {editingStudent.name}</h2>
                <button onClick={() => setEditingStudent(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault();
                
                // Check for duplicate email (excluding current student)
                const emailExists = students.some(s => 
                  s.id !== editingStudent.id && 
                  s.email.toLowerCase() === editingStudent.email.toLowerCase()
                );
                
                if (emailExists) {
                  alert('Another student with this email already exists!');
                  return;
                }
                
                // Update student
                setStudents(prev => prev.map(s => 
                  s.id === editingStudent.id ? editingStudent : s
                ));
                setEditingStudent(null);
                alert('Student updated successfully!');
              }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                  <input 
                    type="text" 
                    value={editingStudent.name}
                    onChange={(e) => setEditingStudent({...editingStudent, name: e.target.value})}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="Student's full name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input 
                    type="email" 
                    value={editingStudent.email}
                    onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder="student@example.com"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Age *</label>
                    <input 
                      type="number" 
                      value={editingStudent.age || ''}
                      onChange={(e) => setEditingStudent({...editingStudent, age: parseInt(e.target.value) || 0})}
                      required
                      min="4"
                      max="25"
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Age"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Gender *</label>
                    <select 
                      value={editingStudent.gender || ''}
                      onChange={(e) => setEditingStudent({...editingStudent, gender: e.target.value})}
                      required
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Gender</option>
                      <option value="Male">Male</option>
                      <option value="Female">Female</option>
                    </select>
                  </div>
                </div>
                
                {/* Student Info Display */}
                <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                  <h4 className="text-sm font-semibold text-gray-700">Additional Information</h4>
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <span className="text-gray-500">Student ID:</span>
                      <span className="ml-1 font-medium">{editingStudent.id}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Class:</span>
                      <span className="ml-1 font-medium">{editingStudent.class || 'Unassigned'}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Join Date:</span>
                      <span className="ml-1 font-medium">{editingStudent.joinDate}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Status:</span>
                      <span className="ml-1 font-medium capitalize">{editingStudent.status}</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                  <p className="text-xs text-blue-700">
                    <strong>Note:</strong> To update class assignment or link to a parent, use:
                  </p>
                  <ul className="text-xs text-blue-600 mt-1 ml-4 list-disc">
                    <li>Class Builder for class assignments</li>
                    <li>Parents section for parent linking</li>
                  </ul>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditingStudent(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Event Modal */}
      {showAddEvent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Add New Event</h2>
                <button onClick={() => setShowAddEvent(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Type *</label>
                  <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="class">Regular Class</option>
                    <option value="event">Special Event</option>
                    <option value="meeting">Meeting</option>
                    <option value="competition">Competition</option>
                    <option value="holiday">Holiday</option>
                    <option value="exam">Exam/Test</option>
                    <option value="trip">Field Trip</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Title *</label>
                  <input 
                    type="text" 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                    placeholder="e.g., Morning Quran Class, Parent Meeting"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Date *</label>
                    <input 
                      type="date" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Recurring</label>
                    <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option value="once">One Time</option>
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="custom">Custom Days</option>
                    </select>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                    <input 
                      type="time" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">End Time *</label>
                    <input 
                      type="time" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Location/Room *</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                      placeholder="e.g., Room 101, Assembly Hall"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity</label>
                    <input 
                      type="number" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                      placeholder="Maximum attendees"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Assign Teacher/Host</label>
                  <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option value="">Select Teacher/Host</option>
                    {teachers.map(teacher => (
                      <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Select Participants</label>
                  <div className="flex items-center space-x-4 mb-2">
                    <label className="flex items-center">
                      <input type="radio" name="participants" className="mr-2" defaultChecked />
                      <span className="text-sm">All Students</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="participants" className="mr-2" />
                      <span className="text-sm">Specific Class</span>
                    </label>
                    <label className="flex items-center">
                      <input type="radio" name="participants" className="mr-2" />
                      <span className="text-sm">Custom Selection</span>
                    </label>
                  </div>
                  <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>All Students</option>
                    {classes.map(cls => (
                      <option key={cls.id} value={cls.id}>{cls.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Event Color</label>
                  <div className="flex items-center space-x-2">
                    {[
                      { color: 'blue', bg: 'bg-blue-500' },
                      { color: 'purple', bg: 'bg-purple-500' },
                      { color: 'green', bg: 'bg-green-500' },
                      { color: 'orange', bg: 'bg-orange-500' },
                      { color: 'red', bg: 'bg-red-500' },
                      { color: 'pink', bg: 'bg-pink-500' },
                      { color: 'teal', bg: 'bg-teal-500' },
                      { color: 'indigo', bg: 'bg-indigo-500' }
                    ].map(({ color, bg }) => (
                      <button
                        key={color}
                        type="button"
                        className={`w-8 h-8 ${bg} rounded-lg hover:ring-2 hover:ring-offset-2 hover:ring-${color}-500`}
                      />
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                    rows={3} 
                    placeholder="Event details and instructions..."
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notifications</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span className="text-sm">Send notification to participants</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span className="text-sm">Send reminder 1 day before</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">Send reminder 1 hour before</span>
                    </label>
                  </div>
                </div>
                
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                  <div className="flex items-start space-x-2">
                    <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
                    <div className="text-sm">
                      <p className="font-medium text-yellow-800">Conflict Detection</p>
                      <p className="text-yellow-700 mt-1">
                        This time slot has 2 other events scheduled. The system will display them side by side on the calendar.
                      </p>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button 
                onClick={() => setShowAddEvent(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  alert('Event added successfully!');
                  setShowAddEvent(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Event
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Compose Message Modal */}
      {showComposeMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Compose Message</h2>
                <button onClick={() => setShowComposeMessage(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Recipient Type *</label>
                  <select 
                    value={messageRecipientType}
                    onChange={(e) => setMessageRecipientType(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">All Users</option>
                    <option value="parents">All Parents</option>
                    <option value="students">All Students</option>
                    <option value="teachers">All Teachers</option>
                    <option value="specific">Specific Recipients</option>
                  </select>
                </div>
                
                {messageRecipientType === 'specific' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Select Recipients</label>
                    
                    {/* Search Field */}
                    <div className="relative mb-3">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input 
                        type="text"
                        value={recipientSearch}
                        onChange={(e) => setRecipientSearch(e.target.value)}
                        className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Search by name or email..."
                      />
                    </div>
                    
                    {/* Selected Recipients Display */}
                    {selectedRecipients.length > 0 && (
                      <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                        <p className="text-xs text-blue-700 mb-2">Selected: {selectedRecipients.length} recipient(s)</p>
                        <div className="flex flex-wrap gap-1">
                          {selectedRecipients.map((email, index) => {
                            const allRecipients = [...parents, ...teachers, ...students];
                            const recipient = allRecipients.find(r => r.email === email);
                            return (
                              <span key={index} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                                {recipient?.name || email}
                                <button 
                                  onClick={() => setSelectedRecipients(selectedRecipients.filter(r => r !== email))}
                                  className="ml-1 hover:text-blue-900"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    
                    {/* Recipients List with Search */}
                    <div className="border rounded-lg p-3 max-h-64 overflow-y-auto">
                      <div className="space-y-2">
                        {/* Parents Section */}
                        {(() => {
                          const filteredParents = parents.filter(parent => 
                            !recipientSearch || 
                            parent.name.toLowerCase().includes(recipientSearch.toLowerCase()) ||
                            parent.email.toLowerCase().includes(recipientSearch.toLowerCase())
                          );
                          
                          if (filteredParents.length > 0) {
                            return (
                              <>
                                <p className="text-xs text-gray-500 mb-2 font-semibold">Parents ({filteredParents.length})</p>
                                {filteredParents.map(parent => (
                                  <label key={parent.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                                    <input 
                                      type="checkbox"
                                      checked={selectedRecipients.includes(parent.email)}
                                      className="mr-3"
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedRecipients([...selectedRecipients, parent.email]);
                                        } else {
                                          setSelectedRecipients(selectedRecipients.filter(r => r !== parent.email));
                                        }
                                      }}
                                    />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">{parent.name}</p>
                                      <p className="text-xs text-gray-500">{parent.email}</p>
                                    </div>
                                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded">Parent</span>
                                  </label>
                                ))}
                              </>
                            );
                          }
                          return null;
                        })()}
                        
                        {/* Teachers Section */}
                        {(() => {
                          const filteredTeachers = teachers.filter(teacher => 
                            !recipientSearch || 
                            teacher.name.toLowerCase().includes(recipientSearch.toLowerCase()) ||
                            teacher.email.toLowerCase().includes(recipientSearch.toLowerCase()) ||
                            teacher.subject.toLowerCase().includes(recipientSearch.toLowerCase())
                          );
                          
                          if (filteredTeachers.length > 0) {
                            return (
                              <>
                                <p className="text-xs text-gray-500 mb-2 mt-4 font-semibold">Teachers ({filteredTeachers.length})</p>
                                {filteredTeachers.map(teacher => (
                                  <label key={teacher.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                                    <input 
                                      type="checkbox"
                                      checked={selectedRecipients.includes(teacher.email)}
                                      className="mr-3"
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedRecipients([...selectedRecipients, teacher.email]);
                                        } else {
                                          setSelectedRecipients(selectedRecipients.filter(r => r !== teacher.email));
                                        }
                                      }}
                                    />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">{teacher.name}</p>
                                      <p className="text-xs text-gray-500">{teacher.email} • {teacher.subject}</p>
                                    </div>
                                    <span className="text-xs bg-green-100 text-green-600 px-2 py-1 rounded">Teacher</span>
                                  </label>
                                ))}
                              </>
                            );
                          }
                          return null;
                        })()}
                        
                        {/* Students Section */}
                        {(() => {
                          const filteredStudents = students.filter(student => 
                            !recipientSearch || 
                            student.name.toLowerCase().includes(recipientSearch.toLowerCase()) ||
                            student.email.toLowerCase().includes(recipientSearch.toLowerCase()) ||
                            student.class.toLowerCase().includes(recipientSearch.toLowerCase())
                          );
                          
                          if (filteredStudents.length > 0) {
                            return (
                              <>
                                <p className="text-xs text-gray-500 mb-2 mt-4 font-semibold">Students ({filteredStudents.length})</p>
                                {filteredStudents.map(student => (
                                  <label key={student.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                                    <input 
                                      type="checkbox"
                                      checked={selectedRecipients.includes(student.email)}
                                      className="mr-3"
                                      onChange={(e) => {
                                        if (e.target.checked) {
                                          setSelectedRecipients([...selectedRecipients, student.email]);
                                        } else {
                                          setSelectedRecipients(selectedRecipients.filter(r => r !== student.email));
                                        }
                                      }}
                                    />
                                    <div className="flex-1">
                                      <p className="text-sm font-medium">{student.name}</p>
                                      <p className="text-xs text-gray-500">{student.email} • {student.class}</p>
                                    </div>
                                    <span className="text-xs bg-purple-100 text-purple-600 px-2 py-1 rounded">Student</span>
                                  </label>
                                ))}
                              </>
                            );
                          }
                          return null;
                        })()}
                        
                        {/* No Results Message */}
                        {recipientSearch && 
                         parents.filter(p => p.name.toLowerCase().includes(recipientSearch.toLowerCase()) || p.email.toLowerCase().includes(recipientSearch.toLowerCase())).length === 0 &&
                         teachers.filter(t => t.name.toLowerCase().includes(recipientSearch.toLowerCase()) || t.email.toLowerCase().includes(recipientSearch.toLowerCase())).length === 0 &&
                         students.filter(s => s.name.toLowerCase().includes(recipientSearch.toLowerCase()) || s.email.toLowerCase().includes(recipientSearch.toLowerCase())).length === 0 && (
                          <div className="text-center py-8 text-gray-500">
                            <p className="text-sm">No recipients found matching "{recipientSearch}"</p>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Quick Select Options */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex space-x-2">
                        <button 
                          type="button"
                          onClick={() => {
                            const allEmails = [...parents, ...teachers, ...students].map(r => r.email);
                            setSelectedRecipients(allEmails);
                          }}
                          className="text-xs text-blue-600 hover:text-blue-700"
                        >
                          Select All
                        </button>
                        <span className="text-gray-300">|</span>
                        <button 
                          type="button"
                          onClick={() => setSelectedRecipients([])}
                          className="text-xs text-gray-600 hover:text-gray-700"
                        >
                          Clear All
                        </button>
                      </div>
                      <p className="text-xs text-gray-500">
                        {selectedRecipients.length} selected
                      </p>
                    </div>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject *</label>
                  <input 
                    type="text" 
                    value={messageSubject}
                    onChange={(e) => setMessageSubject(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                    placeholder="Enter message subject"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message *</label>
                  <textarea 
                    value={messageContent}
                    onChange={(e) => setMessageContent(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                    rows={8} 
                    placeholder="Type your message here..."
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message Templates</label>
                  <select 
                    onChange={(e) => {
                      if (e.target.value === 'meeting') {
                        setMessageSubject('Parent-Teacher Meeting Scheduled');
                        setMessageContent('Dear Parent,\n\nWe would like to inform you that a parent-teacher meeting has been scheduled for [DATE] at [TIME].\n\nPlease confirm your attendance by replying to this message.\n\nBest regards,\n[School Name]');
                      } else if (e.target.value === 'homework') {
                        setMessageSubject('Homework Assignment');
                        setMessageContent('Dear Student,\n\nPlease complete the following assignment:\n\n[Assignment details]\n\nDue date: [DATE]\n\nBest regards,\n[Teacher Name]');
                      } else if (e.target.value === 'announcement') {
                        setMessageSubject('Important Announcement');
                        setMessageContent('Dear Parents and Students,\n\n[Your announcement here]\n\nBest regards,\n[School Name]');
                      }
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a template (optional)</option>
                    <option value="meeting">Parent-Teacher Meeting</option>
                    <option value="homework">Homework Assignment</option>
                    <option value="announcement">General Announcement</option>
                    <option value="reminder">Event Reminder</option>
                    <option value="holiday">Holiday Notice</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Attachments</label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
                    <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">Click to upload or drag and drop</p>
                    <p className="text-xs text-gray-500">PDF, DOC, DOCX, JPG, PNG (max 10MB)</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Send Options</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span className="text-sm">Send email notification</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">Send SMS notification (if available)</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" />
                      <span className="text-sm">Request read receipt</span>
                    </label>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Send</label>
                    <input 
                      type="datetime-local" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                    <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option>Normal</option>
                      <option>High</option>
                      <option>Urgent</option>
                    </select>
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-between">
              <button className="px-4 py-2 text-gray-600 hover:text-gray-700">
                Save as Draft
              </button>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowComposeMessage(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    const recipientCount = messageRecipientType === 'all' ? 'all users' :
                                         messageRecipientType === 'parents' ? 'all parents' :
                                         messageRecipientType === 'teachers' ? 'all teachers' :
                                         messageRecipientType === 'students' ? 'all students' :
                                         `${selectedRecipients.length} recipients`;
                    alert(`Message sent to ${recipientCount}!`);
                    setShowComposeMessage(false);
                    setMessageSubject('');
                    setMessageContent('');
                    setSelectedRecipients([]);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {showAddTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Add New Teacher</h2>
                <button onClick={() => setShowAddTeacher(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                {/* Personal Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                        placeholder="Teacher's full name"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input 
                        type="date" 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                  </div>
                </div>
                
                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                      <input 
                        type="email" 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                        placeholder="teacher@email.com"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                      <input 
                        type="tel" 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                        placeholder="+1 234-567-8900"
                      />
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                    <textarea 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                      rows={2} 
                      placeholder="Street address, city, state, zip"
                    ></textarea>
                  </div>
                </div>
                
                {/* Professional Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Professional Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Primary Subject *</label>
                      <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                        <option>Select Subject</option>
                        <option>Quran Memorization</option>
                        <option>Tajweed</option>
                        <option>Islamic Studies</option>
                        <option>Arabic Language</option>
                        <option>Fiqh</option>
                        <option>Hadith</option>
                        <option>Aqeedah</option>
                        <option>Seerah</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience *</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                        placeholder="e.g., 5 years"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Qualification/Degree</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                        placeholder="e.g., Masters in Islamic Studies"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Certification</label>
                      <input 
                        type="text" 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                        placeholder="e.g., Ijazah in Quran"
                      />
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Additional Subjects (Optional)</label>
                    <p className="text-xs text-gray-500 mb-2">Select other subjects this teacher can teach</p>
                    <div className="grid grid-cols-2 gap-2">
                      {['Quran Memorization', 'Tajweed', 'Islamic Studies', 'Arabic Language', 'Fiqh', 'Hadith', 'Aqeedah', 'Seerah'].map(subject => (
                        <label key={subject} className="flex items-center p-2 border rounded hover:bg-gray-50">
                          <input type="checkbox" className="mr-2" />
                          <span className="text-sm">{subject}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Custom Skills/Specializations</label>
                    <p className="text-xs text-gray-500 mb-2">Add any special skills or subjects not listed above (comma-separated)</p>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                      placeholder="e.g., Quranic Tafseer, Islamic History, Dua Memorization, Child Psychology"
                    />
                  </div>
                </div>
                
                {/* Additional Information */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio/Notes</label>
                  <textarea 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                    rows={3} 
                    placeholder="Additional information about the teacher..."
                  ></textarea>
                </div>
              </form>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button 
                onClick={() => setShowAddTeacher(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  alert('Teacher added successfully!');
                  setShowAddTeacher(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Teacher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* View Teacher Modal */}
      {showViewTeacher && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center">
                    <GraduationCap className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-semibold">{selectedTeacher.name}</h2>
                    <p className="text-purple-100">{selectedTeacher.subject} Teacher</p>
                  </div>
                </div>
                <button onClick={() => setShowViewTeacher(false)} className="p-2 hover:bg-white/20 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Contact Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">Contact Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Mail className="w-4 h-4 mr-3 text-gray-400" />
                      <span className="text-gray-600">Email:</span>
                      <span className="ml-2 text-gray-900">{selectedTeacher.email}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Phone className="w-4 h-4 mr-3 text-gray-400" />
                      <span className="text-gray-600">Phone:</span>
                      <span className="ml-2 text-gray-900">{selectedTeacher.phone}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <MapPin className="w-4 h-4 mr-3 text-gray-400" />
                      <span className="text-gray-600">Address:</span>
                      <span className="ml-2 text-gray-900">123 Main St, New York, NY</span>
                    </div>
                  </div>
                </div>
                
                {/* Professional Information */}
                <div className="space-y-4">
                  <h3 className="font-semibold text-gray-900 border-b pb-2">Professional Information</h3>
                  <div className="space-y-3">
                    <div className="flex items-center text-sm">
                      <Award className="w-4 h-4 mr-3 text-gray-400" />
                      <span className="text-gray-600">Experience:</span>
                      <span className="ml-2 text-gray-900">{selectedTeacher.experience}</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <GraduationCap className="w-4 h-4 mr-3 text-gray-400" />
                      <span className="text-gray-600">Qualification:</span>
                      <span className="ml-2 text-gray-900">Masters in Islamic Studies</span>
                    </div>
                    <div className="flex items-center text-sm">
                      <Shield className="w-4 h-4 mr-3 text-gray-400" />
                      <span className="text-gray-600">Certification:</span>
                      <span className="ml-2 text-gray-900">Ijazah in Quran</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Statistics */}
              <div className="grid grid-cols-4 gap-4 mt-6">
                <div className="bg-blue-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-blue-600">{selectedTeacher.students}</p>
                  <p className="text-xs text-gray-600">Total Students</p>
                </div>
                <div className="bg-green-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-green-600">{selectedTeacher.classes || 3}</p>
                  <p className="text-xs text-gray-600">Classes</p>
                </div>
                <div className="bg-purple-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-purple-600">4.8</p>
                  <p className="text-xs text-gray-600">Rating</p>
                </div>
                <div className="bg-orange-50 rounded-lg p-4 text-center">
                  <p className="text-2xl font-bold text-orange-600">95%</p>
                  <p className="text-xs text-gray-600">Attendance</p>
                </div>
              </div>
              
              {/* Classes Teaching */}
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 border-b pb-2 mb-3">Classes Teaching</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {classes.filter(cls => cls.teacher === selectedTeacher.name).map(cls => (
                    <div key={cls.id} className="border rounded-lg p-3">
                      <p className="font-medium text-sm">{cls.name}</p>
                      <p className="text-xs text-gray-500">{cls.schedule} • {cls.room}</p>
                      <p className="text-xs text-gray-500 mt-1">{cls.students} students</p>
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Additional Skills */}
              <div className="mt-6">
                <h3 className="font-semibold text-gray-900 border-b pb-2 mb-3">Skills & Subjects</h3>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm">{selectedTeacher.subject}</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Tajweed</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Quran Memorization</span>
                  <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm">Islamic Studies</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button 
                onClick={() => setShowViewTeacher(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setShowViewTeacher(false);
                  setShowEditTeacher(true);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Edit Teacher
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Teacher Modal */}
      {showEditTeacher && selectedTeacher && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Edit Teacher - {selectedTeacher.name}</h2>
                <button onClick={() => setShowEditTeacher(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                {/* Personal Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Personal Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                      <input 
                        type="text" 
                        defaultValue={selectedTeacher.name}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Date of Birth</label>
                      <input 
                        type="date" 
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                  </div>
                </div>
                
                {/* Contact Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Contact Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                      <input 
                        type="email" 
                        defaultValue={selectedTeacher.email}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                      <input 
                        type="tel" 
                        defaultValue={selectedTeacher.phone}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                  </div>
                </div>
                
                {/* Professional Information */}
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Professional Information</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Primary Subject *</label>
                      <select 
                        defaultValue={selectedTeacher.subject}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      >
                        <option>Quran Memorization</option>
                        <option>Tajweed</option>
                        <option>Islamic Studies</option>
                        <option>Arabic Language</option>
                        <option>Fiqh</option>
                        <option>Hadith</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience *</label>
                      <input 
                        type="text" 
                        defaultValue={selectedTeacher.experience}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                      />
                    </div>
                  </div>
                </div>
                
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                    <option>Active</option>
                    <option>On Leave</option>
                    <option>Inactive</option>
                  </select>
                </div>
              </form>
            </div>
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button 
                onClick={() => setShowEditTeacher(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  alert('Teacher information updated successfully!');
                  setShowEditTeacher(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Parent Modal */}
      {showAddParent && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Add New Parent</h2>
                <button onClick={() => setShowAddParent(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                      placeholder="Parent's full name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Occupation</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                      placeholder="e.g., Engineer, Doctor, Teacher"
                    />
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                    <input 
                      type="email" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                      placeholder="parent@email.com"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                    <input 
                      type="tel" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                      placeholder="+1 234-567-8900"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Home Address</label>
                  <textarea 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                    rows={2} 
                    placeholder="Street address, city, state, zip"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Link Children *</label>
                  <p className="text-xs text-gray-500 mb-2">Search and select the children associated with this parent</p>
                  
                  {/* Search Field for Children */}
                  <div className="relative mb-3">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input 
                      type="text"
                      value={childrenSearchTerm}
                      onChange={(e) => setChildrenSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="Search student by name, ID, or class..."
                    />
                  </div>
                  
                  {/* Selected Children Display */}
                  {selectedChildren.length > 0 && (
                    <div className="mb-3 p-2 bg-blue-50 rounded-lg">
                      <p className="text-xs text-blue-700 mb-2">Selected: {selectedChildren.length} child(ren)</p>
                      <div className="flex flex-wrap gap-1">
                        {selectedChildren.map((childId) => {
                          const child = students.find(s => s.id === childId);
                          return child ? (
                            <span key={childId} className="inline-flex items-center px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs">
                              {child.name}
                              <button 
                                type="button"
                                onClick={() => setSelectedChildren(selectedChildren.filter(id => id !== childId))}
                                className="ml-1 hover:text-blue-900"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ) : null;
                        })}
                      </div>
                    </div>
                  )}
                  
                  {/* Searchable Children List */}
                  <div className="border rounded-lg p-3 max-h-48 overflow-y-auto">
                    <div className="space-y-2">
                      {(() => {
                        const filteredStudents = students.filter(student => 
                          !childrenSearchTerm || 
                          student.name.toLowerCase().includes(childrenSearchTerm.toLowerCase()) ||
                          student.id.toLowerCase().includes(childrenSearchTerm.toLowerCase()) ||
                          student.class.toLowerCase().includes(childrenSearchTerm.toLowerCase())
                        );
                        
                        if (filteredStudents.length === 0) {
                          return (
                            <div className="text-center py-4 text-gray-500">
                              <p className="text-sm">No students found matching "{childrenSearchTerm}"</p>
                            </div>
                          );
                        }
                        
                        return filteredStudents.map(student => (
                          <label key={student.id} className="flex items-center p-2 hover:bg-gray-50 rounded cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={selectedChildren.includes(student.id)}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedChildren([...selectedChildren, student.id]);
                                } else {
                                  setSelectedChildren(selectedChildren.filter(id => id !== student.id));
                                }
                              }}
                              className="mr-3" 
                            />
                            <div className="flex-1">
                              <p className="text-sm font-medium">{student.name}</p>
                              <p className="text-xs text-gray-500">{student.class} • ID: {student.id} • Grade: {student.grade}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-xs text-gray-500">Age: {student.age}</p>
                              <p className="text-xs text-gray-500">{student.memorized}</p>
                            </div>
                          </label>
                        ));
                      })()}
                    </div>
                  </div>
                  
                  {/* Quick Actions */}
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-xs text-gray-500">
                      Showing {students.filter(s => 
                        !childrenSearchTerm || 
                        s.name.toLowerCase().includes(childrenSearchTerm.toLowerCase()) ||
                        s.id.toLowerCase().includes(childrenSearchTerm.toLowerCase()) ||
                        s.class.toLowerCase().includes(childrenSearchTerm.toLowerCase())
                      ).length} of {students.length} students
                    </p>
                    {selectedChildren.length > 0 && (
                      <button 
                        type="button"
                        onClick={() => setSelectedChildren([])}
                        className="text-xs text-gray-600 hover:text-gray-700"
                      >
                        Clear Selection
                      </button>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Name</label>
                    <input 
                      type="text" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                      placeholder="Emergency contact name"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact Phone</label>
                    <input 
                      type="tel" 
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                      placeholder="+1 234-567-8900"
                    />
                  </div>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-end space-x-3">
              <button 
                onClick={() => setShowAddParent(false)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Cancel
              </button>
              <button 
                onClick={() => {
                  alert('Parent account created successfully!');
                  setShowAddParent(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Add Parent
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Class Modal */}
      {showCreateClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Create New Class</h2>
                <button onClick={() => setShowCreateClass(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
                  <input 
                    type="text" 
                    value={newClass.name}
                    onChange={(e) => setNewClass({...newClass, name: e.target.value})}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                    placeholder="e.g., Morning Quran Class, Advanced Tajweed, etc."
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Room Number *</label>
                    <input 
                      type="text" 
                      value={newClass.room}
                      onChange={(e) => setNewClass({...newClass, room: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                      placeholder="e.g., Room 201"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Capacity *</label>
                    <input 
                      type="number" 
                      value={newClass.capacity}
                      onChange={(e) => setNewClass({...newClass, capacity: parseInt(e.target.value)})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                      placeholder="Maximum students"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Schedule Days *</label>
                  <div className="flex items-center space-x-3">
                    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(day => (
                      <label key={day} className="flex items-center">
                        <input 
                          type="checkbox" 
                          className="mr-1"
                          onChange={(e) => {
                            const currentDays = newClass.schedule?.split('-') || [];
                            if (e.target.checked) {
                              setNewClass({...newClass, schedule: [...currentDays, day].join('-')});
                            } else {
                              setNewClass({...newClass, schedule: currentDays.filter(d => d !== day).join('-')});
                            }
                          }}
                        />
                        <span className="text-sm">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Start Time *</label>
                    <input 
                      type="time" 
                      value={newClass.time}
                      onChange={(e) => setNewClass({...newClass, time: e.target.value})}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Duration</label>
                    <select className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500">
                      <option>1 hour</option>
                      <option>1.5 hours</option>
                      <option>2 hours</option>
                      <option>2.5 hours</option>
                      <option>3 hours</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subjects to Teach *</label>
                  <p className="text-xs text-gray-500 mb-2">Select all subjects that will be taught in this class</p>
                  <div className="grid grid-cols-2 gap-2">
                    {['Quran Memorization', 'Tajweed', 'Islamic Studies', 'Arabic Language', 'Fiqh', 'Hadith', 'Aqeedah', 'Seerah'].map(subject => (
                      <label key={subject} className="flex items-center p-2 border rounded hover:bg-gray-50">
                        <input 
                          type="checkbox" 
                          className="mr-2"
                          onChange={(e) => {
                            if (e.target.checked) {
                              setNewClass({...newClass, subjects: [...(newClass.subjects || []), subject]});
                            } else {
                              setNewClass({...newClass, subjects: (newClass.subjects || []).filter(s => s !== subject)});
                            }
                          }}
                        />
                        <span className="text-sm">{subject}</span>
                      </label>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes</label>
                  <textarea 
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500" 
                    rows={3} 
                    placeholder="Any special instructions or notes about this class"
                  ></textarea>
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t bg-gray-50 flex justify-between">
              <p className="text-sm text-gray-500">
                After creating the class, go to Class Builder to assign teachers and students
              </p>
              <div className="flex space-x-3">
                <button 
                  onClick={() => setShowCreateClass(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    // Add the new class
                    const formattedSchedule = `${newClass.schedule || 'Mon-Fri'} ${newClass.time || '8:00 AM'}`;
                    const newClassData = {
                      id: `CLS${Date.now()}`,
                      name: newClass.name,
                      teacher: null,
                      students: 0,
                      schedule: formattedSchedule,
                      room: newClass.room,
                      subjects: newClass.subjects,
                      capacity: newClass.capacity
                    };
                    classes.push(newClassData);
                    alert(`Class "${newClass.name}" created successfully! Now go to Class Builder to assign teachers and students.`);
                    setShowCreateClass(false);
                    setNewClass({ name: '', room: '', schedule: '', time: '', capacity: 25, subjects: [] });
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Class
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Custom Date Picker Modal */}
      {showCustomDatePicker && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Select Date Range</h2>
                <button onClick={() => setShowCustomDatePicker(false)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                  <input 
                    type="date" 
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                  <input 
                    type="date" 
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="pt-2">
                  <p className="text-sm text-gray-500">Quick Ranges:</p>
                  <div className="grid grid-cols-2 gap-2 mt-2">
                    <button 
                      onClick={() => {
                        const end = new Date();
                        const start = new Date();
                        start.setDate(start.getDate() - 7);
                        setCustomStartDate(start.toISOString().split('T')[0]);
                        setCustomEndDate(end.toISOString().split('T')[0]);
                      }}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                      Last 7 Days
                    </button>
                    <button 
                      onClick={() => {
                        const end = new Date();
                        const start = new Date();
                        start.setDate(start.getDate() - 14);
                        setCustomStartDate(start.toISOString().split('T')[0]);
                        setCustomEndDate(end.toISOString().split('T')[0]);
                      }}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                      Last 14 Days
                    </button>
                    <button 
                      onClick={() => {
                        const end = new Date();
                        const start = new Date();
                        start.setMonth(start.getMonth() - 1);
                        setCustomStartDate(start.toISOString().split('T')[0]);
                        setCustomEndDate(end.toISOString().split('T')[0]);
                      }}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                      Last Month
                    </button>
                    <button 
                      onClick={() => {
                        const end = new Date();
                        const start = new Date();
                        start.setMonth(0);
                        start.setDate(1);
                        setCustomStartDate(start.toISOString().split('T')[0]);
                        setCustomEndDate(end.toISOString().split('T')[0]);
                      }}
                      className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
                    >
                      Year to Date
                    </button>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button 
                  onClick={() => setShowCustomDatePicker(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => {
                    setReportDateRange('custom');
                    setShowCustomDatePicker(false);
                    alert(`Date range selected: ${customStartDate || 'Start'} to ${customEndDate || 'End'}`);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Apply Range
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Credential Modal */}
      {showAddCredential && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Create New Credential</h2>
                <button onClick={() => {
                  setShowAddCredential(false);
                  // Reset form state
                  setCredUserType('');
                  setCredUserSearch('');
                  setCredSelectedUser(null);
                  setShowCredUserDropdown(false);
                }} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                const newCredential = {
                  id: `CRED${String(credentials.length + 1).padStart(3, '0')}`,
                  userId: credSelectedUser?.id,
                  userName: credSelectedUser?.name,
                  userType: credUserType,
                  email: formData.get('email'),
                  password: formData.get('password'),
                  created: new Date().toISOString().split('T')[0],
                  lastModified: new Date().toISOString().split('T')[0],
                  status: 'active'
                };
                setCredentials([...credentials, newCredential]);
                setShowAddCredential(false);
                // Reset form state
                setCredUserType('');
                setCredUserSearch('');
                setCredSelectedUser(null);
                setShowCredUserDropdown(false);
                alert('Credential created successfully!');
              }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User Type *</label>
                  <select 
                    name="userType"
                    required
                    value={credUserType}
                    onChange={(e) => {
                      setCredUserType(e.target.value);
                      setCredSelectedUser(null);
                      setCredUserSearch('');
                    }}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select User Type</option>
                    <option value="student">Student</option>
                    <option value="teacher">Teacher</option>
                    <option value="parent">Parent</option>
                  </select>
                </div>
                
                {credUserType && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Select {credUserType.charAt(0).toUpperCase() + credUserType.slice(1)} *
                    </label>
                    
                    {credSelectedUser ? (
                      <div className="flex items-center justify-between p-3 bg-indigo-50 border border-indigo-200 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{credSelectedUser.name}</p>
                          <p className="text-sm text-gray-500">
                            ID: {credSelectedUser.id} 
                            {credSelectedUser.class && ` • ${credSelectedUser.class}`}
                            {credSelectedUser.grade && ` • ${credSelectedUser.grade}`}
                            {credSelectedUser.subject && ` • ${credSelectedUser.subject}`}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setCredSelectedUser(null);
                            setCredUserSearch('');
                          }}
                          className="p-1 hover:bg-indigo-100 rounded"
                        >
                          <X className="w-4 h-4 text-indigo-600" />
                        </button>
                      </div>
                    ) : (
                      <div className="relative">
                        <div className="relative">
                          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                          <input
                            type="text"
                            value={credUserSearch}
                            onChange={(e) => setCredUserSearch(e.target.value)}
                            onFocus={() => setShowCredUserDropdown(true)}
                            placeholder={`Search ${credUserType} by name, ID, or email...`}
                            className="w-full pl-10 pr-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                            required={!credSelectedUser}
                          />
                        </div>
                        
                        {showCredUserDropdown && (() => {
                          let users = [];
                          if (credUserType === 'student') {
                            users = students;
                          } else if (credUserType === 'teacher') {
                            users = teachers;
                          } else if (credUserType === 'parent') {
                            users = parents;
                          }
                          
                          const filteredUsers = !credUserSearch 
                            ? users.slice(0, 10)
                            : users.filter(user =>
                                user.name.toLowerCase().includes(credUserSearch.toLowerCase()) ||
                                user.id.toLowerCase().includes(credUserSearch.toLowerCase()) ||
                                (user.email && user.email.toLowerCase().includes(credUserSearch.toLowerCase()))
                              ).slice(0, 20);
                          
                          return (
                            <div 
                              className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
                              onMouseLeave={() => setTimeout(() => setShowCredUserDropdown(false), 300)}
                            >
                              {filteredUsers.length > 0 ? (
                                <>
                                  <div className="sticky top-0 bg-gray-50 px-3 py-2 border-b">
                                    <p className="text-xs text-gray-500">
                                      {credUserSearch ? `Showing ${filteredUsers.length} results` : `Showing first 10 ${credUserType}s`}
                                    </p>
                                  </div>
                                  {filteredUsers.map(user => (
                                    <button
                                      key={user.id}
                                      type="button"
                                      onClick={() => {
                                        setCredSelectedUser(user);
                                        setShowCredUserDropdown(false);
                                        setCredUserSearch('');
                                      }}
                                      className="w-full px-3 py-2 text-left hover:bg-indigo-50 border-b last:border-b-0"
                                    >
                                      <p className="font-medium text-gray-900">{user.name}</p>
                                      <p className="text-sm text-gray-500">
                                        ID: {user.id}
                                        {user.email && ` • ${user.email}`}
                                        {user.class && ` • ${user.class}`}
                                        {user.grade && ` • ${user.grade}`}
                                        {user.subject && ` • ${user.subject}`}
                                      </p>
                                    </button>
                                  ))}
                                  {users.length > filteredUsers.length && (
                                    <div className="px-3 py-2 bg-gray-50 border-t">
                                      <p className="text-xs text-gray-500">
                                        Type to search more {credUserType}s...
                                      </p>
                                    </div>
                                  )}
                                </>
                              ) : (
                                <div className="px-3 py-4 text-center">
                                  <p className="text-sm text-gray-500">No {credUserType}s found</p>
                                  <p className="text-xs text-gray-400 mt-1">Try a different search term</p>
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </div>
                    )}
                  </div>
                )}
                
                {credSelectedUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                    <input 
                      type="text" 
                      value={credSelectedUser.id}
                      readOnly
                      className="w-full px-3 py-2 border rounded-lg bg-gray-50"
                    />
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input 
                    type="email" 
                    name="email"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    placeholder="user@school.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      name="password"
                      required
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                      placeholder="Enter password"
                    />
                    <button 
                      type="button"
                      onClick={(e) => {
                        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
                        let password = '';
                        for (let i = 0; i < 12; i++) {
                          password += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        e.target.parentElement.querySelector('input[name="password"]').value = password;
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Password should be at least 8 characters with mix of letters, numbers and symbols</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Send Credentials</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span className="text-sm">Email credentials to user</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowAddCredential(false)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Create Credential
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Edit Credential Modal */}
      {editingCredential && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold">Edit Credential</h2>
                <button onClick={() => setEditingCredential(null)} className="p-2 hover:bg-gray-100 rounded-lg">
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-6">
              <form className="space-y-4" onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                setCredentials(prev => prev.map(c => 
                  c.id === editingCredential.id 
                    ? { 
                        ...c, 
                        email: formData.get('email'),
                        password: formData.get('password'),
                        lastModified: new Date().toISOString().split('T')[0]
                      } 
                    : c
                ));
                setEditingCredential(null);
                alert('Credential updated successfully!');
              }}>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">User</label>
                  <div className="px-3 py-2 bg-gray-50 rounded-lg">
                    <p className="font-medium">{editingCredential.userName}</p>
                    <p className="text-sm text-gray-500">{editingCredential.userId} • {editingCredential.userType}</p>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email Address *</label>
                  <input 
                    type="email" 
                    name="email"
                    defaultValue={editingCredential.email}
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">New Password *</label>
                  <div className="flex space-x-2">
                    <input 
                      type="text" 
                      name="password"
                      defaultValue={editingCredential.password}
                      required
                      className="flex-1 px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                    />
                    <button 
                      type="button"
                      onClick={(e) => {
                        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
                        let password = '';
                        for (let i = 0; i < 12; i++) {
                          password += chars.charAt(Math.floor(Math.random() * chars.length));
                        }
                        e.target.parentElement.querySelector('input[name="password"]').value = password;
                      }}
                      className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                    >
                      Generate
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Options</label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span className="text-sm">Notify user of password change</span>
                    </label>
                    <label className="flex items-center">
                      <input type="checkbox" className="mr-2" defaultChecked />
                      <span className="text-sm">Require password change on next login</span>
                    </label>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-3 pt-4">
                  <button 
                    type="button"
                    onClick={() => setEditingCredential(null)}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                  >
                    Update Credential
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}