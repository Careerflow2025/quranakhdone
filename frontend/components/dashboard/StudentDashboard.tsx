'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  getQuranByScriptId, 
  getSurahByNumber, 
  getAllQuranScripts, 
  getScriptStyling
} from '@/data/quran/cleanQuranLoader';
import { surahList } from '@/data/quran/surahData';
import {
  Book,
  Mic,
  MicOff,
  Play,
  Pause,
  Star,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
  Save,
  X,
  Plus,
  Edit2,
  Trash2,
  MessageSquare,
  AlertCircle,
  Check,
  Clock,
  Calendar,
  FileText,
  Upload,
  Eye,
  EyeOff,
  Highlighter,
  StickyNote,
  User,
  Award,
  TrendingUp,
  BarChart,
  Target,
  BookOpen,
  PenTool,
  Type,
  Palette,
  Brain,
  Volume2,
  Mail,
  Send,
  Archive,
  Bell,
  LogOut,
  UserCircle,
  Inbox,
  Reply,
  Search,
  Paperclip
} from 'lucide-react';

export default function StudentDashboard() {
  // Student Info
  const [studentInfo] = useState({
    id: 'STU001',
    name: 'Ahmed Hassan',
    age: 12,
    class: 'Class 6A',
    teacherId: 'TCH001',
    currentSurah: 1,
    currentAyah: 1,
    memorized: '5 Juz',
    revision: '3 Juz',
    lastSession: '2 hours ago',
    lastPageVisited: 15, // Track last page for auto-navigation
    lastSurahVisited: 2, // Track last surah for auto-navigation
    // Class schedule - student only has classes on specific days
    classSchedule: ['Monday', 'Thursday', 'Saturday'],
    physicalAttendance: 92, // Physical class attendance percentage
    platformActivity: 85 // Platform usage percentage
  });

  // Core States
  const [activeTab, setActiveTab] = useState('quran'); // 'quran', 'homework', 'assignments', 'progress', 'targets', 'messages'
  const [selectedScript] = useState('uthmani-hafs'); // Teacher-controlled
  const [currentSurah, setCurrentSurah] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [quranText, setQuranText] = useState({ surah: '', ayahs: [] });
  const [showSurahDropdown, setShowSurahDropdown] = useState(false);

  // Homework & Assignment Filters
  const [homeworkSearchTerm, setHomeworkSearchTerm] = useState('');
  const [homeworkStatusFilter, setHomeworkStatusFilter] = useState('all');
  const [assignmentSearchTerm, setAssignmentSearchTerm] = useState('');
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState('all');

  // Student's Targets (assigned by teacher)
  const [myTargets] = useState([
    {
      id: 'tgt1',
      title: 'Complete Juz 30 Memorization',
      description: 'Memorize all surahs in Juz 30 with proper tajweed',
      type: 'individual',
      assignedBy: 'Ustadh Ahmed',
      startDate: '2024-01-01',
      dueDate: '2024-03-30',
      status: 'active',
      category: 'memorization',
      totalPages: 23,
      completedPages: 15,
      progress: 65,
      milestones: [
        { id: 'm1', name: 'Complete An-Naba', date: '2024-01-15', completed: true },
        { id: 'm2', name: 'Complete An-Naziat', date: '2024-01-30', completed: true },
        { id: 'm3', name: 'Complete Abasa', date: '2024-02-15', completed: false },
        { id: 'm4', name: 'Complete At-Takwir', date: '2024-02-28', completed: false }
      ],
      lastActivity: '2 hours ago',
      todaysPractice: '45 minutes',
      weeklyAverage: '35 minutes/day'
    },
    {
      id: 'tgt2',
      title: 'Master Tajweed Rules - Noon Sakinah',
      description: 'Learn and apply all rules of Noon Sakinah and Tanween',
      type: 'class',
      assignedBy: 'Ustadh Ahmed',
      startDate: '2024-01-15',
      dueDate: '2024-02-15',
      status: 'active',
      category: 'tajweed',
      totalLessons: 8,
      completedLessons: 6,
      progress: 75,
      milestones: [
        { id: 'm5', name: 'Izhar rule', date: '2024-01-20', completed: true },
        { id: 'm6', name: 'Idgham rule', date: '2024-01-25', completed: true },
        { id: 'm7', name: 'Iqlab rule', date: '2024-02-01', completed: false },
        { id: 'm8', name: 'Ikhfa rule', date: '2024-02-10', completed: false }
      ],
      lastActivity: '1 day ago',
      testsCompleted: 3,
      averageScore: 88
    },
    {
      id: 'tgt3',
      title: 'Daily Quran Recitation',
      description: 'Recite at least 2 pages daily with proper pronunciation',
      type: 'individual',
      assignedBy: 'Ustadh Ahmed',
      startDate: '2024-01-01',
      dueDate: '2024-12-31',
      status: 'active',
      category: 'recitation',
      totalDays: 365,
      completedDays: 28,
      progress: 8,
      currentStreak: 12,
      longestStreak: 15,
      lastActivity: 'Today',
      todaysPages: 3,
      totalPagesRead: 84
    }
  ]);
  
  // Message & UI States
  const [messageTab, setMessageTab] = useState('inbox');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [showNoteReply, setShowNoteReply] = useState<any>(null);
  const [replyText, setReplyText] = useState('');
  const [isRecordingReply, setIsRecordingReply] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<any>(null);
  const [audioProgress, setAudioProgress] = useState({});
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [studentProfile] = useState({
    name: 'Ahmed Hassan',
    email: 'ahmed.hassan@school.edu',
    phone: '+212 6XX-XXX-XXX',
    studentId: 'STU001',
    class: 'Class 6A',
    section: 'Section B',
    enrollmentDate: '15 Sept 2023',
    dateOfBirth: '12 March 2012',
    gender: 'Male',
    guardian: 'Mr. Hassan Ahmed',
    guardianPhone: '+212 6XX-XXX-XXX',
    address: '123 Main Street, Casablanca',
    bloodGroup: 'O+',
    emergencyContact: '+212 6XX-XXX-XXX'
  });
  const [notifications, setNotifications] = useState([
    { id: 1, type: 'message', title: 'New message from teacher', text: 'Please review your homework', time: '5 minutes ago', unread: true },
    { id: 2, type: 'assignment', title: 'New assignment', text: 'Memorize Surah Al-Mulk verses 1-5', time: '2 hours ago', unread: true },
    { id: 3, type: 'achievement', title: 'Achievement unlocked!', text: 'Completed 5 Juz memorization', time: '1 day ago', unread: true },
    { id: 4, type: 'reminder', title: 'Class tomorrow', text: 'Quran class at 9:00 AM', time: '2 days ago', unread: false },
    { id: 5, type: 'feedback', title: 'Teacher feedback', text: 'Excellent recitation today!', time: '3 days ago', unread: false }
  ]);
  
  // Teacher Highlights (Read-only for students)
  const [highlights, setHighlights] = useState([
    // Homework (Green highlights)
    {
      id: 'hw1',
      type: 'homework',
      surah: 1,
      ayahIndex: 0,
      wordIndices: [0, 1, 2],
      mistakeType: 'homework',
      color: 'bg-green-200',
      teacherNote: 'Practice this verse for tomorrow\'s class',
      timestamp: '2 hours ago',
      teacherName: 'Ustadh Ahmed',
      dueDate: 'Tomorrow',
      status: 'pending',
      replies: []
    },
    {
      id: 'hw2',
      type: 'homework',
      surah: 2,
      ayahIndex: 5,
      wordIndices: [1, 2, 3, 4],
      mistakeType: 'homework',
      color: 'bg-green-200',
      teacherNote: 'Memorize these words with proper tajweed',
      timestamp: '1 day ago',
      teacherName: 'Ustadh Ahmed',
      dueDate: 'In 3 days',
      status: 'in-progress',
      replies: [
        { id: 'r1', text: 'I\'ve memorized half of it', timestamp: '12 hours ago', type: 'text', isStudent: true },
        { id: 'r2', text: 'Great progress! Keep going', timestamp: '10 hours ago', type: 'text', isStudent: false }
      ]
    },
    {
      id: 'hw3',
      type: 'homework',
      surah: 1,
      ayahIndex: 3,
      wordIndices: [0, 1],
      mistakeType: 'homework',
      color: 'bg-green-200',
      teacherNote: 'Review this section',
      timestamp: '3 days ago',
      teacherName: 'Ustadh Ahmed',
      dueDate: 'Yesterday',
      status: 'overdue',
      replies: []
    },
    // Assignments (Other color highlights for mistakes)
    {
      id: 'a1',
      type: 'assignment',
      surah: 1,
      ayahIndex: 0,
      wordIndices: [0, 1],
      mistakeType: 'tajweed',
      color: 'bg-orange-200',
      teacherNote: 'Remember to apply Idghaam rule here',
      timestamp: '2 days ago',
      teacherName: 'Ustadh Ahmed',
      status: 'pending',
      replies: []
    },
    {
      id: 'a2',
      type: 'assignment',
      surah: 1,
      ayahIndex: 1,
      wordIndices: [2, 3],
      mistakeType: 'recap',
      color: 'bg-purple-200',
      teacherNote: 'Focus on proper pronunciation of these words',
      timestamp: '1 week ago',
      teacherName: 'Ustadh Ahmed',
      status: 'reviewed',
      replies: [
        { id: 'r3', text: 'I practiced this 5 times', timestamp: '6 days ago', type: 'text', isStudent: true },
        { id: 'r4', text: 'Good job! Keep practicing', timestamp: '5 days ago', type: 'text', isStudent: false }
      ]
    },
    {
      id: 'a3',
      type: 'assignment',
      surah: 1,
      ayahIndex: 2,
      wordIndices: [1],
      mistakeType: 'haraka',
      color: 'bg-red-200',
      teacherNote: 'This letter requires emphasis (tafkheem)',
      timestamp: '3 days ago',
      teacherName: 'Ustadh Ahmed',
      status: 'pending',
      replies: []
    }
  ]);

  // Mock messages
  const [messages, setMessages] = useState({
    inbox: [
      { id: 1, from: 'Ustadh Ahmed', subject: 'Great progress today!', time: '2 hours ago', unread: true },
      { id: 2, from: 'School Admin', subject: 'Quran Competition Next Week', time: '1 day ago', unread: true },
      { id: 3, from: 'Ustadh Ahmed', subject: 'Homework for tomorrow', time: '2 days ago', unread: false }
    ],
    sent: [
      { id: 4, to: 'Ustadh Ahmed', subject: 'Question about Surah Mulk', time: '3 days ago' },
      { id: 5, to: 'Ustadh Ahmed', subject: 'Completed my revision', time: '1 week ago' }
    ],
    archive: [
      { id: 6, from: 'Ustadh Ahmed', subject: 'Previous assignment feedback', time: '2 weeks ago' }
    ]
  });

  const AYAHS_PER_PAGE = 7;

  // Auto-navigate to last visited page on mount
  useEffect(() => {
    // On component mount, navigate to last visited surah and page
    if (studentInfo.lastSurahVisited && studentInfo.lastPageVisited) {
      setCurrentSurah(studentInfo.lastSurahVisited);
      setCurrentPage(studentInfo.lastPageVisited);
    }
  }, []); // Run only on mount

  // Load Quran text
  useEffect(() => {
    const scriptId = selectedScript || 'uthmani-hafs';
    const surahData = getSurahByNumber(scriptId, currentSurah);
    const surahInfo = surahList.find((s: any) => s.number === currentSurah);

    if (surahData && surahData.ayahs && surahData.ayahs.length > 0) {
      setQuranText({
        surah: surahData.name || surahInfo?.nameArabic || 'الفاتحة',
        ayahs: surahData.ayahs.map((ayah: any) => ({
          number: ayah.numberInSurah,
          text: ayah.text,
          words: ayah.text.split(' ')
        }))
      });
      // Only reset page if not navigating from stored state
      if (!studentInfo.lastPageVisited || currentSurah !== studentInfo.lastSurahVisited) {
        setCurrentPage(1);
      }
    }
  }, [currentSurah, selectedScript]);

  const allSurahs = surahList.map((s: any) => ({
    number: s.number,
    nameArabic: s.nameArabic,
    nameEnglish: s.nameEnglish,
    meaning: s.meaning,
    verses: s.verses,
    type: s.type
  }));

  const handleHighlightClick = (highlightId: any) => {
    const highlight = highlights.find((h: any) => h.id === highlightId);
    if (highlight) {
      setShowNoteReply(highlight);
    }
  };

  const handleSendReply = (type: any = 'text') => {
    if ((type === 'text' && replyText.trim()) || (type === 'voice')) {
      const newReply = {
        id: `r${Date.now()}`,
        text: type === 'text' ? replyText : 'Voice message',
        timestamp: 'Just now',
        type: type,
        isStudent: true
      };
      
      // Update the highlights with the new reply
      setHighlights((prevHighlights: any) => 
        prevHighlights.map((h: any) => 
          h.id === showNoteReply.id 
            ? { ...h, replies: [...h.replies, newReply] }
            : h
        )
      );
      
      // Update the current modal state
      setShowNoteReply((prev: any) => ({
        ...prev,
        replies: [...prev.replies, newReply]
      }));
      
      setReplyText('');
      setIsRecordingReply(false);
    }
  };
  
  const handleVoiceRecording = () => {
    if (!isRecordingReply) {
      // Start recording
      setIsRecordingReply(true);
      // In real app, start MediaRecorder here
    } else {
      // Stop recording and save
      handleSendReply('voice');
    }
  };
  
  const handleSendMessage = () => {
    if (composeSubject.trim() && composeMessage.trim()) {
      const newMessage = {
        id: Date.now(),
        to: 'Ustadh Ahmed',
        subject: composeSubject,
        message: composeMessage,
        time: 'Just now'
      };
      
      // Add to sent messages
      setMessages((prev: any) => ({
        ...prev,
        sent: [newMessage, ...prev.sent]
      }));
      
      // Reset and close modal
      setComposeSubject('');
      setComposeMessage('');
      setShowComposeModal(false);
      setMessageTab('sent'); // Switch to sent tab to show the new message
    }
  };
  
  const handlePlayAudio = (replyId: any) => {
    if (playingAudioId === replyId) {
      // Stop playing
      setPlayingAudioId(null);
      setAudioProgress((prev: any) => ({ ...prev, [replyId]: 0 }));
    } else {
      // Start playing
      setPlayingAudioId(replyId);
      
      // Simulate audio playback progress
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        if (progress >= 100) {
          clearInterval(interval);
          setPlayingAudioId(null);
          setAudioProgress((prev: any) => ({ ...prev, [replyId]: 0 }));
        } else {
          setAudioProgress((prev: any) => ({ ...prev, [replyId]: progress }));
        }
      }, 150); // 15 seconds total (150ms * 100 = 15s)
    }
  };

  const totalPages = Math.ceil((quranText.ayahs?.length || 0) / AYAHS_PER_PAGE);
  const startIdx = (currentPage - 1) * AYAHS_PER_PAGE;
  const endIdx = startIdx + AYAHS_PER_PAGE;
  const currentAyahs = quranText.ayahs?.slice(startIdx, endIdx) || [];

  const currentSurahInfo = allSurahs.find((s: any) => s.number === currentSurah) || allSurahs[0];
  const scriptStyling = getScriptStyling(selectedScript);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            {/* Left Side - Title */}
            <div className="flex items-center space-x-4">
              {activeTab === 'quran' ? (
                <>
                  <button className="p-2 hover:bg-gray-100 rounded-lg">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <div className="text-center">
                    <h1 className="text-3xl font-arabic text-green-800">
                      سُورَةُ {currentSurahInfo.nameArabic}
                    </h1>
                    <p className="text-sm text-gray-600">
                      {currentSurahInfo.nameEnglish} • {currentSurahInfo.type} • {currentSurahInfo.verses} Verses
                    </p>
                  </div>
                </>
              ) : (
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">
                    {activeTab === 'homework' ? 'My Homework' :
                     activeTab === 'assignments' ? 'My Assignments' :
                     activeTab === 'targets' ? 'My Targets' :
                     activeTab === 'messages' ? 'Messages' : 'Student Dashboard'}
                  </h1>
                  <p className="text-sm text-gray-500">{studentInfo.name} • {studentInfo.class}</p>
                </div>
              )}
            </div>

            {/* Center - Student Info (only show in Quran tab) */}
            {activeTab === 'quran' && (
              <div className="text-center">
                <p className="text-sm text-gray-500">{studentInfo.name} • {studentInfo.class}</p>
                <p className="text-xs text-gray-400">Student Dashboard</p>
              </div>
            )}

            {/* Right Side - Actions */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <div className="relative">
                <button 
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Bell className="w-5 h-5" />
                  {notifications.filter((n: any) => n.unread).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.filter((n: any) => n.unread).length}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border z-50 max-h-96 overflow-hidden">
                    <div className="p-3 border-b bg-gray-50 flex items-center justify-between">
                      <h3 className="font-semibold text-sm">Notifications</h3>
                      <button 
                        onClick={() => {
                          setNotifications((prev: any) => prev.map((n: any) => ({ ...n, unread: false })));
                        }}
                        className="text-xs text-blue-600 hover:text-blue-700"
                      >
                        Mark all as read
                      </button>
                    </div>
                    
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((notif) => (
                          <div 
                            key={notif.id}
                            onClick={() => {
                              setNotifications((prev: any) => 
                                prev.map((n: any) => n.id === notif.id ? { ...n, unread: false } : n)
                              );
                            }}
                            className={`p-3 border-b hover:bg-gray-50 cursor-pointer transition ${
                              notif.unread ? 'bg-blue-50' : ''
                            }`}
                          >
                            <div className="flex items-start space-x-3">
                              <div className={`p-2 rounded-full ${
                                notif.type === 'message' ? 'bg-blue-100' :
                                notif.type === 'assignment' ? 'bg-green-100' :
                                notif.type === 'achievement' ? 'bg-yellow-100' :
                                notif.type === 'reminder' ? 'bg-purple-100' :
                                'bg-gray-100'
                              }`}>
                                {notif.type === 'message' && <Mail className="w-4 h-4 text-blue-600" />}
                                {notif.type === 'assignment' && <FileText className="w-4 h-4 text-green-600" />}
                                {notif.type === 'achievement' && <Award className="w-4 h-4 text-yellow-600" />}
                                {notif.type === 'reminder' && <Clock className="w-4 h-4 text-purple-600" />}
                                {notif.type === 'feedback' && <MessageSquare className="w-4 h-4 text-gray-600" />}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-start justify-between">
                                  <p className="text-sm font-medium text-gray-900">{notif.title}</p>
                                  {notif.unread && (
                                    <span className="w-2 h-2 bg-blue-500 rounded-full mt-1"></span>
                                  )}
                                </div>
                                <p className="text-xs text-gray-600 mt-0.5">{notif.text}</p>
                                <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <Bell className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                          <p className="text-sm">No notifications</p>
                        </div>
                      )}
                    </div>
                    
                    <div className="p-2 border-t bg-gray-50">
                      <button className="w-full text-center text-xs text-blue-600 hover:text-blue-700 py-1">
                        View all notifications
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* Profile Dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 p-2 hover:bg-gray-100 rounded-lg"
                >
                  <UserCircle className="w-5 h-5" />
                  <ChevronDown className="w-4 h-4" />
                </button>
                
                {showProfileDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border z-50">
                    <button 
                      onClick={() => {
                        setShowProfileModal(true);
                        setShowProfileDropdown(false);
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2"
                    >
                      <User className="w-4 h-4" />
                      <span>Profile</span>
                    </button>
                    <button className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-red-600">
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Surah Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowSurahDropdown(!showSurahDropdown)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition"
                >
                  <BookOpen className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-700">Change Surah</span>
                  <ChevronDown className={`w-4 h-4 text-green-600 transition-transform ${showSurahDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showSurahDropdown && (
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-xl border z-50">
                    <div className="p-2">
                      {allSurahs.map((surah) => (
                        <button
                          key={surah.number}
                          onClick={() => {
                            setCurrentSurah(surah.number);
                            setShowSurahDropdown(false);
                          }}
                          className={`w-full text-left p-2 rounded-lg hover:bg-gray-50 ${
                            currentSurah === surah.number ? 'bg-green-50 border-green-200 border' : ''
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">{surah.number}. </span>
                              <span className="font-arabic text-lg">{surah.nameArabic}</span>
                              <p className="text-xs text-gray-500">{surah.nameEnglish} • {surah.verses} verses</p>
                            </div>
                            {currentSurah === surah.number && <Check className="w-4 h-4 text-green-600" />}
                          </div>
                        </button>
                      ))}
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
            <button
              onClick={() => setActiveTab('quran')}
              className={`relative py-3 px-4 font-medium text-sm rounded-lg transition-all duration-200 ${
                activeTab === 'quran'
                  ? 'text-white bg-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>Quran</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('homework')}
              className={`relative py-3 px-4 font-medium text-sm rounded-lg transition-all duration-200 ${
                activeTab === 'homework'
                  ? 'text-white bg-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>Homework</span>
                {highlights.filter((h: any) => h.type === 'homework' && h.status === 'pending').length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {highlights.filter((h: any) => h.type === 'homework' && h.status === 'pending').length}
                  </span>
                )}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('assignments')}
              className={`relative py-3 px-4 font-medium text-sm rounded-lg transition-all duration-200 ${
                activeTab === 'assignments'
                  ? 'text-white bg-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Assignments</span>
                {highlights.filter((h: any) => h.type === 'assignment' && h.status === 'pending').length > 0 && (
                  <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {highlights.filter((h: any) => h.type === 'assignment' && h.status === 'pending').length}
                  </span>
                )}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('progress')}
              className={`relative py-3 px-4 font-medium text-sm rounded-lg transition-all duration-200 ${
                activeTab === 'progress'
                  ? 'text-white bg-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Progress</span>
                <span className="bg-indigo-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                  {myTargets.filter((t: any) => t.status === 'active').length}
                </span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('targets')}
              className={`relative py-3 px-4 font-medium text-sm rounded-lg transition-all duration-200 ${
                activeTab === 'targets'
                  ? 'text-white bg-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Targets</span>
                {myTargets.filter((t: any) => t.status === 'active').length > 0 && (
                  <span className="bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {myTargets.filter((t: any) => t.status === 'active').length}
                  </span>
                )}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              className={`relative py-3 px-4 font-medium text-sm rounded-lg transition-all duration-200 ${
                activeTab === 'messages'
                  ? 'text-white bg-green-600 shadow-sm'
                  : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Messages</span>
                {messages.inbox.filter((m: any) => m.unread).length > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {messages.inbox.filter((m: any) => m.unread).length}
                  </span>
                )}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-12 py-6">
        {/* Quran Tab */}
        {activeTab === 'quran' && (
          <div>
          {/* Full Width Quran Viewer (Mushaf Style) */}
          <div>
            <div className="bg-white rounded-xl shadow-lg relative" style={{
              background: 'linear-gradient(to bottom, #ffffff, #fafafa)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
            }}>
              {/* Page-like container with subtle lines */}
              <div className="p-8" style={{
                minHeight: '800px',
                backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0,0,0,.02) 25%, rgba(0,0,0,.02) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.02) 75%, rgba(0,0,0,.02) 76%, transparent 77%, transparent)',
                backgroundSize: '50px 50px'
              }}>
                {/* Basmala for new Surahs */}
                {currentSurah !== 1 && currentSurah !== 9 && currentPage === 1 && (
                  <div className="text-center text-3xl font-arabic text-gray-700 py-6 border-b mb-6">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </div>
                )}

                {/* Mushaf-style Quran text */}
                <div className="mushaf-page-content text-center leading-loose px-12 py-6" style={{
                  ...scriptStyling,
                  minHeight: '650px',
                  padding: '30px 40px',
                  backgroundColor: '#FFFEF8',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  border: '1px solid #e5d4b1',
                  textAlign: 'justify',
                  textAlignLast: 'justify',
                  fontSize: '31px'
                }}>
                  <style jsx>{`
                    .mushaf-page-content {
                      text-align: justify;
                      text-justify: inter-word;
                    }
                    .mushaf-page-content::after {
                      content: "";
                      display: inline-block;
                      width: 100%;
                    }
                  `}</style>
                  <div className="text-gray-900">
                    {currentAyahs.map((ayah, displayIndex) => {
                      const ayahIndex = (currentPage - 1) * AYAHS_PER_PAGE + displayIndex;
                      // Filter highlights for current surah and ayah
                      const ayahHighlights = highlights.filter((h: any) =>
                        h.surah === currentSurah && h.ayahIndex === ayahIndex
                      );

                      return (
                        <div key={ayah.number} className="inline-block relative group">
                          {ayah.words.map((word, wordIndex) => {
                            const wordHighlights = ayahHighlights.filter((h: any) =>
                              h.wordIndices.includes(wordIndex)
                            );

                            return (
                              <span
                                key={`${ayahIndex}-${wordIndex}`}
                                onClick={() => {
                                  if (wordHighlights.length > 0) {
                                    handleHighlightClick(wordHighlights[0].id);
                                  }
                                }}
                                className={`inline-block mx-1 px-1 cursor-pointer rounded transition-colors select-none
                                  ${wordHighlights.length > 0
                                    ? `${wordHighlights[0].color} ${
                                        wordHighlights[0].type === 'homework'
                                          ? 'border-2 border-green-400 shadow-sm'
                                          : 'border-2 border-blue-400 shadow-sm'
                                      }`
                                    : ''
                                  }`}
                                style={{ position: 'relative' }}
                              >
                                {word}
                                {wordHighlights.length > 0 && wordHighlights[0].replies?.length > 0 && (
                                  <sup className="text-blue-500 ml-1" style={{ fontSize: '0.6em' }}>
                                    <MessageSquare className="w-3 h-3 inline" />
                                  </sup>
                                )}
                              </span>
                            );
                          })}
                          {/* Ornamental Ayah Number */}
                          <span className="inline-flex items-center justify-center mx-2 align-middle"
                            style={{
                              width: '35px',
                              height: '35px',
                              borderRadius: '50%',
                              background: 'linear-gradient(135deg, #d4a574 0%, #8b6914 50%, #d4a574 100%)',
                              color: 'white',
                              fontSize: '14px',
                              fontWeight: 'bold',
                              boxShadow: '0 2px 4px rgba(0,0,0,0.2), inset 0 1px 2px rgba(255,255,255,0.3)',
                              border: '2px solid #8b6914',
                              verticalAlign: 'middle',
                              display: 'inline-flex'
                            }}
                          >
                            {ayah.number}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Mushaf-style Pagination */}
                <div className="mt-8 flex items-center justify-between border-t pt-6">
                  <button
                    onClick={() => setCurrentPage((p: any) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className={`px-6 py-3 ${
                      currentPage === 1
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                    } text-white rounded-lg flex items-center space-x-2 shadow-lg transition-all transform hover:scale-105`}
                  >
                    <ChevronRight className="w-5 h-5" />
                    <span>الصفحة السابقة</span>
                  </button>

                  <div className="text-center">
                    <div className="text-lg font-semibold text-gray-700">
                      صفحة {currentPage} من {totalPages}
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      {currentSurahInfo.nameArabic} • الآيات {startIdx + 1} - {Math.min(endIdx, quranText.ayahs?.length || 0)}
                    </div>
                  </div>

                  <button
                    onClick={() => setCurrentPage((p: any) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className={`px-6 py-3 ${
                      currentPage === totalPages
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'
                    } text-white rounded-lg flex items-center space-x-2 shadow-lg transition-all transform hover:scale-105`}
                  >
                    <span>الصفحة التالية</span>
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Homework Tab */}
      {activeTab === 'homework' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center">
                <BookOpen className="w-6 h-6 mr-2 text-green-600" />
                My Homework
                <span className="ml-3 bg-green-100 text-green-700 text-sm px-2 py-1 rounded-full">
                  {highlights.filter((h: any) => h.type === 'homework').length} Total
                </span>
              </h2>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search homework by surah, note, or teacher..."
                  value={homeworkSearchTerm}
                  onChange={(e) => setHomeworkSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-400"
                />
              </div>

              <select
                value={homeworkStatusFilter}
                onChange={(e) => setHomeworkStatusFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-green-100 focus:border-green-400"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="in-progress">In Progress</option>
                <option value="overdue">Overdue</option>
              </select>

              <button
                onClick={() => {
                  setHomeworkSearchTerm('');
                  setHomeworkStatusFilter('all');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Homework Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {highlights
              .filter((h: any) => h.type === 'homework')
              .filter((h: any) => {
                if (homeworkStatusFilter !== 'all' && h.status !== homeworkStatusFilter) return false;
                if (homeworkSearchTerm) {
                  const searchLower = homeworkSearchTerm.toLowerCase();
                  return h.teacherNote.toLowerCase().includes(searchLower) ||
                         h.teacherName.toLowerCase().includes(searchLower) ||
                         `surah ${h.surah}`.toLowerCase().includes(searchLower);
                }
                return true;
              })
              .map((homework) => (
                <div
                  key={homework.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden"
                >
                  <div className="bg-gradient-to-r from-green-500 to-emerald-500 p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          Surah {homework.surah}, Ayah {homework.ayahIndex + 1}
                        </h3>
                        <p className="text-green-100 text-sm mt-1">
                          Assigned by {homework.teacherName}
                        </p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        homework.status === 'overdue' ? 'bg-red-100 text-red-700' :
                        homework.status === 'in-progress' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>
                        {homework.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="text-gray-700 mb-4">
                      {homework.teacherNote}
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Due Date:</span>
                        <span className={`font-medium ${
                          homework.status === 'overdue' ? 'text-red-600' : 'text-gray-700'
                        }`}>
                          {homework.dueDate}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Assigned:</span>
                        <span className="text-gray-700">{homework.timestamp}</span>
                      </div>

                      {homework.replies.length > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Conversation:</span>
                          <span className="text-blue-600 font-medium">
                            {homework.replies.length} messages
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t flex items-center justify-between">
                      <button
                        onClick={() => {
                          setActiveTab('quran');
                          setCurrentSurah(homework.surah);
                          const page = Math.floor(homework.ayahIndex / AYAHS_PER_PAGE) + 1;
                          setCurrentPage(page);
                        }}
                        className="flex items-center space-x-2 text-green-600 hover:text-green-700 font-medium"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Go to Quran</span>
                      </button>

                      <button
                        onClick={() => handleHighlightClick(homework.id)}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center">
                <FileText className="w-6 h-6 mr-2 text-purple-600" />
                My Assignments (Mistakes)
                <span className="ml-3 bg-purple-100 text-purple-700 text-sm px-2 py-1 rounded-full">
                  {highlights.filter((h: any) => h.type === 'assignment').length} Total
                </span>
              </h2>
            </div>

            {/* Filters */}
            <div className="flex items-center space-x-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search assignments by surah, note, or type..."
                  value={assignmentSearchTerm}
                  onChange={(e) => setAssignmentSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-400"
                />
              </div>

              <select
                value={assignmentTypeFilter}
                onChange={(e) => setAssignmentTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-100 focus:border-purple-400"
              >
                <option value="all">All Types</option>
                <option value="tajweed">Tajweed</option>
                <option value="haraka">Haraka</option>
                <option value="recap">Recap</option>
              </select>

              <button
                onClick={() => {
                  setAssignmentSearchTerm('');
                  setAssignmentTypeFilter('all');
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition"
              >
                Clear Filters
              </button>
            </div>
          </div>

          {/* Assignments Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            {highlights
              .filter((h: any) => h.type === 'assignment')
              .filter((h: any) => {
                if (assignmentTypeFilter !== 'all' && h.mistakeType !== assignmentTypeFilter) return false;
                if (assignmentSearchTerm) {
                  const searchLower = assignmentSearchTerm.toLowerCase();
                  return h.teacherNote.toLowerCase().includes(searchLower) ||
                         h.teacherName.toLowerCase().includes(searchLower) ||
                         h.mistakeType.toLowerCase().includes(searchLower) ||
                         `surah ${h.surah}`.toLowerCase().includes(searchLower);
                }
                return true;
              })
              .map((assignment) => (
                <div
                  key={assignment.id}
                  className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100 overflow-hidden"
                >
                  <div className={`p-4 ${
                    assignment.mistakeType === 'tajweed' ? 'bg-gradient-to-r from-orange-500 to-amber-500' :
                    assignment.mistakeType === 'recap' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                    assignment.mistakeType === 'haraka' ? 'bg-gradient-to-r from-red-500 to-rose-500' :
                    'bg-gradient-to-r from-gray-500 to-gray-600'
                  }`}>
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-semibold text-white text-lg">
                          Surah {assignment.surah}, Ayah {assignment.ayahIndex + 1}
                        </h3>
                        <p className="text-white text-opacity-90 text-sm mt-1">
                          {assignment.teacherName}
                        </p>
                      </div>
                      <span className="bg-white bg-opacity-20 backdrop-blur px-3 py-1 rounded-full text-xs font-semibold text-white">
                        {assignment.mistakeType}
                      </span>
                    </div>
                  </div>

                  <div className="p-5">
                    <p className="text-gray-700 mb-4">
                      {assignment.teacherNote}
                    </p>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Status:</span>
                        <span className={`font-medium ${
                          assignment.status === 'reviewed' ? 'text-green-600' :
                          assignment.status === 'pending' ? 'text-yellow-600' :
                          'text-gray-600'
                        }`}>
                          {assignment.status}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-500">Assigned:</span>
                        <span className="text-gray-700">{assignment.timestamp}</span>
                      </div>

                      {assignment.replies.length > 0 && (
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500">Conversation:</span>
                          <span className="text-blue-600 font-medium">
                            {assignment.replies.length} messages
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t flex items-center justify-between">
                      <button
                        onClick={() => {
                          setActiveTab('quran');
                          setCurrentSurah(assignment.surah);
                          const page = Math.floor(assignment.ayahIndex / AYAHS_PER_PAGE) + 1;
                          setCurrentPage(page);
                        }}
                        className="flex items-center space-x-2 text-purple-600 hover:text-purple-700 font-medium"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Go to Quran</span>
                      </button>

                      <button
                        onClick={() => handleHighlightClick(assignment.id)}
                        className="flex items-center space-x-2 text-blue-600 hover:text-blue-700 font-medium"
                      >
                        <MessageSquare className="w-4 h-4" />
                        <span>Reply</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <div className="space-y-6">
          {/* Progress Overview Header */}
          <div className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-3xl font-bold mb-2">My Learning Progress</h2>
                <p className="text-indigo-100">Track your Quran learning journey and achievements</p>
              </div>
              <div className="text-right">
                <div className="text-4xl font-bold">
                  {Math.round(myTargets.reduce((acc: any, t: any) => acc + t.progress, 0) / myTargets.length)}%
                </div>
                <p className="text-indigo-100 text-sm">Overall Progress</p>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-white bg-opacity-20 backdrop-blur rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Target className="w-5 h-5" />
                  <span className="text-sm">Active Targets</span>
                </div>
                <p className="text-2xl font-bold">{myTargets.filter((t: any) => t.status === 'active').length}</p>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Award className="w-5 h-5" />
                  <span className="text-sm">Completed</span>
                </div>
                <p className="text-2xl font-bold">
                  {myTargets.reduce((acc: any, t: any) => acc + (t.milestones?.filter((m: any) => m.completed).length || 0), 0)}
                </p>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Clock className="w-5 h-5" />
                  <span className="text-sm">Today's Study</span>
                </div>
                <p className="text-2xl font-bold">1h 25m</p>
              </div>
              <div className="bg-white bg-opacity-20 backdrop-blur rounded-xl p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <TrendingUp className="w-5 h-5" />
                  <span className="text-sm">Streak</span>
                </div>
                <p className="text-2xl font-bold">12 days</p>
              </div>
            </div>
          </div>

          {/* Attendance Statistics Section */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-xl font-bold mb-6 flex items-center">
              <Calendar className="w-6 h-6 mr-2 text-blue-600" />
              Class Attendance & Platform Activity
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Physical Class Attendance */}
              <div className="text-center">
                <div className="relative w-28 h-28 mx-auto">
                  <svg width="112" height="112" className="transform -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="#e5e7eb" strokeWidth="10" fill="none" />
                    <circle
                      cx="56" cy="56" r="48"
                      stroke="#10b981"
                      strokeWidth="10"
                      fill="none"
                      strokeDasharray={`${studentInfo.physicalAttendance * 3.01} 301`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div>
                      <span className="text-2xl font-bold">{studentInfo.physicalAttendance}%</span>
                      <p className="text-xs text-gray-600">Physical</p>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-600 font-medium">Class Attendance</p>
                <p className="text-xs text-gray-500 mt-1">({studentInfo.classSchedule.length} days/week)</p>
              </div>

              {/* Platform Activity */}
              <div className="text-center">
                <div className="relative w-28 h-28 mx-auto">
                  <svg width="112" height="112" className="transform -rotate-90">
                    <circle cx="56" cy="56" r="48" stroke="#e5e7eb" strokeWidth="10" fill="none" />
                    <circle
                      cx="56" cy="56" r="48"
                      stroke="#3b82f6"
                      strokeWidth="10"
                      fill="none"
                      strokeDasharray={`${studentInfo.platformActivity * 3.01} 301`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div>
                      <span className="text-2xl font-bold">{studentInfo.platformActivity}%</span>
                      <p className="text-xs text-gray-600">Platform</p>
                    </div>
                  </div>
                </div>
                <p className="mt-3 text-sm text-gray-600 font-medium">Digital Activity</p>
                <p className="text-xs text-gray-500 mt-1">(Daily average)</p>
              </div>

              {/* Monthly Breakdown */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">This Month</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between p-2 bg-green-50 rounded-lg">
                    <span className="text-sm text-gray-600">Present</span>
                    <span className="font-semibold text-green-600">18 days</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-yellow-50 rounded-lg">
                    <span className="text-sm text-gray-600">Late</span>
                    <span className="font-semibold text-yellow-600">2 days</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-red-50 rounded-lg">
                    <span className="text-sm text-gray-600">Absent</span>
                    <span className="font-semibold text-red-600">1 day</span>
                  </div>
                  <div className="flex items-center justify-between p-2 bg-blue-50 rounded-lg">
                    <span className="text-sm text-gray-600">Excused</span>
                    <span className="font-semibold text-blue-600">1 day</span>
                  </div>
                </div>
              </div>

              {/* Weekly Stats */}
              <div className="space-y-3">
                <h4 className="font-semibold text-gray-700">This Week</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Classes Attended</span>
                    <span className="font-semibold">5/5</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Perfect Days</span>
                    <span className="font-semibold">4</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Punctuality</span>
                    <span className="font-semibold text-green-600">Excellent</span>
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-700">Week Score</span>
                    <div className="flex items-center">
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Class Schedule & Attendance */}
            <div className="mt-6 pt-6 border-t">
              <div className="mb-4">
                <h4 className="font-semibold text-gray-700 mb-2">Weekly Class Schedule & Attendance</h4>
                <p className="text-sm text-gray-500">
                  Your classes: <span className="font-medium text-blue-600">{studentInfo.classSchedule.join(', ')}</span>
                </p>
              </div>

              <div className="grid grid-cols-7 gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                  const fullDay = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][index];
                  const hasClass = studentInfo.classSchedule.includes(fullDay);

                  // Show attendance only for scheduled class days
                  let attendance = 'no-class';
                  if (hasClass) {
                    // Example attendance for this week
                    if (fullDay === 'Monday') attendance = 'present';
                    else if (fullDay === 'Thursday') attendance = 'late';
                    else if (fullDay === 'Saturday') attendance = 'present';
                  }

                  const bgColor = !hasClass ? 'bg-gray-50 border-gray-200' :
                                 attendance === 'present' ? 'bg-green-100 border-green-500' :
                                 attendance === 'late' ? 'bg-yellow-100 border-yellow-500' :
                                 attendance === 'absent' ? 'bg-red-100 border-red-500' :
                                 'bg-blue-50 border-blue-300';

                  const icon = !hasClass ? '' :
                              attendance === 'present' ? '✓' :
                              attendance === 'late' ? '⏰' :
                              attendance === 'absent' ? '✗' : '•';

                  const textColor = !hasClass ? 'text-gray-400' :
                                   attendance === 'present' ? 'text-green-700' :
                                   attendance === 'late' ? 'text-yellow-700' :
                                   attendance === 'absent' ? 'text-red-700' :
                                   'text-blue-600';

                  return (
                    <div key={day} className="text-center">
                      <div className={`aspect-square ${bgColor} border-2 rounded-lg flex flex-col items-center justify-center relative transition-all ${
                        hasClass ? 'shadow-sm' : 'opacity-60'
                      }`}>
                        {hasClass && (
                          <div className="absolute -top-1 -right-1">
                            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                          </div>
                        )}
                        <span className={`text-lg font-bold ${textColor}`}>{icon}</span>
                        {hasClass && attendance !== 'no-class' && (
                          <span className="text-[10px] text-gray-500 mt-0.5">
                            {attendance === 'present' ? '9:00am' :
                             attendance === 'late' ? '9:15am' : ''}
                          </span>
                        )}
                      </div>
                      <span className={`text-xs mt-1 block ${hasClass ? 'font-semibold text-blue-600' : 'text-gray-400'}`}>
                        {day}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Legend */}
              <div className="flex flex-wrap items-center justify-center gap-3 mt-4 text-xs">
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                  <span className="text-gray-600">Scheduled Class</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-green-500 rounded"></div>
                  <span className="text-gray-600">Present</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-yellow-500 rounded"></div>
                  <span className="text-gray-600">Late</span>
                </div>
                <div className="flex items-center space-x-1">
                  <div className="w-3 h-3 bg-red-500 rounded"></div>
                  <span className="text-gray-600">Absent</span>
                </div>
              </div>

              {/* Platform Activity by Day */}
              <div className="mt-6 pt-6 border-t">
                <h4 className="font-semibold text-gray-700 mb-3">Daily Platform Activity</h4>
                <div className="space-y-2">
                  {studentInfo.classSchedule.map((day: any) => {
                    // Sample activity data for class days
                    const activityData = {
                      'Monday': { minutes: 45, assignments: 2, quranPages: 3 },
                      'Thursday': { minutes: 60, assignments: 3, quranPages: 5 },
                      'Saturday': { minutes: 30, assignments: 1, quranPages: 2 }
                    };
                    const activity = activityData[day] || { minutes: 0, assignments: 0, quranPages: 0 };
                    const activityPercent = (activity.minutes / 60) * 100;

                    return (
                      <div key={day} className="bg-blue-50 rounded-lg p-3">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-sm">{day}</span>
                          <span className="text-xs text-blue-600">{activity.minutes} min</span>
                        </div>
                        <div className="bg-gray-200 rounded-full h-2 mb-2">
                          <div
                            className="bg-blue-500 h-2 rounded-full transition-all"
                            style={{ width: `${Math.min(activityPercent, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-600">
                          <span>{activity.assignments} assignments</span>
                          <span>{activity.quranPages} pages read</span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Non-class days activity summary */}
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs font-medium text-gray-700 mb-1">Self-Study Days (Tue, Wed, Fri, Sun)</p>
                    <div className="flex justify-between text-xs text-gray-600">
                      <span>Average: 25 min/day</span>
                      <span>Total: 1.5 hours</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Targets Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {myTargets.map((target) => (
              <div key={target.id} className="bg-white rounded-xl shadow-lg overflow-hidden">
                {/* Target Header */}
                <div className={`p-6 ${
                  target.category === 'memorization' ? 'bg-gradient-to-r from-blue-500 to-indigo-500' :
                  target.category === 'tajweed' ? 'bg-gradient-to-r from-purple-500 to-pink-500' :
                  'bg-gradient-to-r from-green-500 to-emerald-500'
                }`}>
                  <div className="flex items-start justify-between text-white">
                    <div>
                      <h3 className="text-xl font-bold mb-2">{target.title}</h3>
                      <p className="text-white text-opacity-90 text-sm mb-3">{target.description}</p>
                      <div className="flex items-center space-x-4 text-xs">
                        <span className="bg-white bg-opacity-20 px-2 py-1 rounded">
                          {target.type === 'individual' ? 'Personal' : 'Class'} Target
                        </span>
                        <span>Assigned by {target.assignedBy}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-3xl font-bold">{target.progress}%</div>
                      <p className="text-xs text-white text-opacity-80">Complete</p>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="mt-4">
                    <div className="w-full bg-white bg-opacity-30 rounded-full h-3">
                      <div
                        className="bg-white h-3 rounded-full transition-all duration-500"
                        style={{ width: `${target.progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Target Details */}
                <div className="p-6">
                  {/* Metrics */}
                  <div className="grid grid-cols-2 gap-4 mb-5">
                    {target.category === 'memorization' && (
                      <>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Pages Progress</p>
                          <p className="text-lg font-semibold">{target.completedPages}/{target.totalPages}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Today's Practice</p>
                          <p className="text-lg font-semibold">{target.todaysPractice}</p>
                        </div>
                      </>
                    )}
                    {target.category === 'tajweed' && (
                      <>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Lessons</p>
                          <p className="text-lg font-semibold">{target.completedLessons}/{target.totalLessons}</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Avg Score</p>
                          <p className="text-lg font-semibold">{target.averageScore}%</p>
                        </div>
                      </>
                    )}
                    {target.category === 'recitation' && (
                      <>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Current Streak</p>
                          <p className="text-lg font-semibold">{target.currentStreak} days</p>
                        </div>
                        <div className="bg-gray-50 rounded-lg p-3">
                          <p className="text-xs text-gray-500">Today's Pages</p>
                          <p className="text-lg font-semibold">{target.todaysPages} pages</p>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Milestones */}
                  {target.milestones && (
                    <div className="mb-5">
                      <h4 className="font-semibold text-sm mb-3 flex items-center">
                        <Award className="w-4 h-4 mr-2 text-indigo-600" />
                        Milestones
                      </h4>
                      <div className="space-y-2">
                        {target.milestones.map((milestone) => (
                          <div
                            key={milestone.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              milestone.completed
                                ? 'bg-green-50 border-green-200'
                                : 'bg-gray-50 border-gray-200'
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              {milestone.completed ? (
                                <Check className="w-5 h-5 text-green-600" />
                              ) : (
                                <div className="w-5 h-5 border-2 border-gray-400 rounded-full" />
                              )}
                              <span className={`text-sm ${
                                milestone.completed ? 'text-green-700 font-medium' : 'text-gray-600'
                              }`}>
                                {milestone.name}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">{milestone.date}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Footer Info */}
                  <div className="flex items-center justify-between pt-4 border-t">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Due: {target.dueDate}</span>
                      <span>•</span>
                      <span>Last activity: {target.lastActivity}</span>
                    </div>
                    <button className="text-sm text-indigo-600 hover:text-indigo-700 font-medium">
                      View Details →
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Weekly Progress Chart */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <BarChart className="w-5 h-5 mr-2 text-indigo-600" />
              Weekly Study Time
            </h3>
            <div className="flex items-end space-x-2 h-40">
              {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => {
                const height = Math.random() * 100;
                const isToday = index === 3;
                return (
                  <div key={day} className="flex-1 flex flex-col items-center">
                    <div className="w-full flex flex-col items-center">
                      <span className="text-xs text-gray-600 mb-2">
                        {Math.round(height / 2)}m
                      </span>
                      <div
                        className={`w-full rounded-t-lg transition-all duration-500 ${
                          isToday
                            ? 'bg-gradient-to-t from-indigo-500 to-purple-500'
                            : 'bg-gradient-to-t from-gray-300 to-gray-400'
                        }`}
                        style={{ height: `${height}px` }}
                      />
                    </div>
                    <span className={`text-xs mt-2 ${isToday ? 'font-bold' : ''}`}>{day}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Achievement Badges */}
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Award className="w-5 h-5 mr-2 text-yellow-600" />
              Recent Achievements
            </h3>
            <div className="grid grid-cols-6 gap-4">
              {[
                { name: 'First Surah', icon: '📖', earned: true },
                { name: '7 Day Streak', icon: '🔥', earned: true },
                { name: 'Tajweed Master', icon: '🌟', earned: true },
                { name: 'Early Bird', icon: '🌅', earned: false },
                { name: 'Perfect Week', icon: '💯', earned: false },
                { name: 'Speed Reader', icon: '⚡', earned: false }
              ].map((badge, index) => (
                <div
                  key={index}
                  className={`flex flex-col items-center p-4 rounded-xl border-2 ${
                    badge.earned
                      ? 'bg-yellow-50 border-yellow-300'
                      : 'bg-gray-50 border-gray-200 opacity-50'
                  }`}
                >
                  <span className="text-3xl mb-2">{badge.icon}</span>
                  <span className="text-xs text-center font-medium">
                    {badge.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <div className="space-y-6">
          {/* Messages Header */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold flex items-center">
                <Mail className="w-7 h-7 mr-3 text-blue-600" />
                Messages
              </h2>
              <button
                onClick={() => setShowComposeModal(true)}
                className="px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-xl hover:from-blue-600 hover:to-indigo-600 font-medium shadow-lg transition-all duration-200 flex items-center space-x-2"
              >
                <Plus className="w-5 h-5" />
                <span>Compose New Message</span>
              </button>
            </div>

            {/* Message Tabs */}
            <div className="flex space-x-2 border-b">
              {['inbox', 'sent', 'archive'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setMessageTab(tab)}
                  className={`px-6 py-3 font-medium capitalize transition-all duration-200 border-b-2 ${
                    messageTab === tab
                      ? 'text-blue-600 border-blue-600 bg-blue-50'
                      : 'text-gray-600 border-transparent hover:text-gray-800 hover:bg-gray-50'
                  }`}
                >
                  <span className="flex items-center space-x-2">
                    {tab === 'inbox' && <Inbox className="w-4 h-4" />}
                    {tab === 'sent' && <Send className="w-4 h-4" />}
                    {tab === 'archive' && <Archive className="w-4 h-4" />}
                    <span>{tab}</span>
                    {tab === 'inbox' && messages.inbox.filter((m: any) => m.unread).length > 0 && (
                      <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full ml-2">
                        {messages.inbox.filter((m: any) => m.unread).length}
                      </span>
                    )}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* Messages List */}
          <div className="bg-white rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-gray-200">
              {messages[messageTab].length > 0 ? (
                messages[messageTab].map((message) => (
                  <div
                    key={message.id}
                    className={`p-6 hover:bg-gray-50 transition cursor-pointer ${
                      message.unread ? 'bg-blue-50 border-l-4 border-blue-500' : ''
                    }`}
                    onClick={() => {
                      // Mark as read if unread
                      if (message.unread && messageTab === 'inbox') {
                        setMessages((prev: any) => ({
                          ...prev,
                          inbox: prev.inbox.map((m: any) =>
                            m.id === message.id ? { ...m, unread: false } : m
                          )
                        }));
                      }
                    }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                          messageTab === 'sent' ? 'bg-green-100' : 'bg-blue-100'
                        }`}>
                          <User className={`w-6 h-6 ${
                            messageTab === 'sent' ? 'text-green-600' : 'text-blue-600'
                          }`} />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-1">
                            <h4 className="font-semibold text-gray-900">
                              {message.from || message.to}
                            </h4>
                            {message.unread && (
                              <span className="bg-blue-100 text-blue-700 text-xs px-2 py-0.5 rounded-full">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-gray-900 font-medium mb-2">{message.subject}</p>
                          <p className="text-gray-600 text-sm line-clamp-2">
                            {message.preview || 'Click to read full message...'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-500">{message.time}</p>
                        <div className="flex items-center space-x-2 mt-3">
                          {messageTab === 'inbox' && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                // Reply functionality
                                setComposeSubject(`Re: ${message.subject}`);
                                setShowComposeModal(true);
                              }}
                              className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                              title="Reply"
                            >
                              <Reply className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Archive functionality
                              if (messageTab !== 'archive') {
                                const messageToArchive = { ...message, unread: false };
                                setMessages((prev: any) => ({
                                  ...prev,
                                  [messageTab]: prev[messageTab].filter((m: any) => m.id !== message.id),
                                  archive: [...prev.archive, messageToArchive]
                                }));
                              }
                            }}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition"
                            title={messageTab === 'archive' ? 'Archived' : 'Archive'}
                          >
                            <Archive className="w-4 h-4" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              // Delete functionality
                              setMessages((prev: any) => ({
                                ...prev,
                                [messageTab]: prev[messageTab].filter((m: any) => m.id !== message.id)
                              }));
                            }}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="p-12 text-center">
                  <Mail className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                    No messages in {messageTab}
                  </h3>
                  <p className="text-gray-500">
                    {messageTab === 'inbox'
                      ? 'Your inbox is empty. New messages from your teacher will appear here.'
                      : messageTab === 'sent'
                      ? 'You haven\'t sent any messages yet.'
                      : 'No archived messages.'}
                  </p>
                  {messageTab === 'inbox' && (
                    <button
                      onClick={() => setShowComposeModal(true)}
                      className="mt-4 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                    >
                      Send Your First Message
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Targets Tab */}
      {activeTab === 'targets' && (
        <div className="space-y-6">
          {/* Targets Header with Filters */}
          <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
              <h2 className="text-xl sm:text-2xl font-bold flex flex-wrap items-center gap-2">
                <Target className="w-6 h-6 sm:w-7 sm:h-7 text-yellow-600" />
                <span>My Learning Targets</span>
                <span className="text-sm font-normal bg-yellow-100 text-yellow-700 px-2 sm:px-3 py-1 rounded-full">
                  {myTargets.filter((t: any) => t.status === 'active').length} Active
                </span>
              </h2>
              <div className="flex flex-wrap items-center gap-2">
                <button className="px-3 sm:px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition text-sm">
                  Individual ({myTargets.filter((t: any) => t.type === 'individual').length})
                </button>
                <button className="px-3 sm:px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition text-sm">
                  Class ({myTargets.filter((t: any) => t.type === 'class').length})
                </button>
              </div>
            </div>

            {/* Overall Progress Summary */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Average Progress</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-700">
                      {Math.round(myTargets.reduce((acc: any, t: any) => acc + t.progress, 0) / myTargets.length)}%
                    </p>
                  </div>
                  <TrendingUp className="w-6 h-6 sm:w-8 sm:h-8 text-green-600" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Active Targets</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-700">
                      {myTargets.filter((t: any) => t.status === 'active').length}
                    </p>
                  </div>
                  <Target className="w-6 h-6 sm:w-8 sm:h-8 text-blue-600" />
                </div>
              </div>
              <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-600">Completed This Week</p>
                    <p className="text-xl sm:text-2xl font-bold text-purple-700">3</p>
                  </div>
                  <Award className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Targets List */}
          <div className="space-y-4">
            {myTargets.map((target) => (
              <div
                key={target.id}
                className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow overflow-hidden"
              >
                <div className={`h-2 ${
                  target.type === 'individual' ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                  'bg-gradient-to-r from-blue-400 to-indigo-400'
                }`} />

                <div className="p-4 sm:p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4 mb-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">{target.title}</h3>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          target.type === 'individual'
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {target.type === 'individual' ? 'Individual' : 'Class'}
                        </span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          target.category === 'memorization' ? 'bg-green-100 text-green-700' :
                          target.category === 'tajweed' ? 'bg-orange-100 text-orange-700' :
                          'bg-purple-100 text-purple-700'
                        }`}>
                          {target.category}
                        </span>
                      </div>
                      <p className="text-gray-600 text-sm mb-3">{target.description}</p>
                      <div className="flex flex-wrap items-center gap-3 text-xs sm:text-sm text-gray-500">
                        <span className="flex items-center">
                          <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="truncate">{target.assignedBy}</span>
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span className="truncate">{target.dueDate}</span>
                        </span>
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                          <span>{target.lastActivity}</span>
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-center lg:justify-end">
                      <div className="relative w-20 h-20 sm:w-24 sm:h-24">
                        <svg width="96" height="96" className="w-full h-full transform -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke="#e5e7eb"
                            strokeWidth="8"
                            fill="none"
                          />
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            stroke={target.progress >= 75 ? '#10b981' : target.progress >= 50 ? '#f59e0b' : '#ef4444'}
                            strokeWidth="8"
                            fill="none"
                            strokeDasharray={`${target.progress * 2.51} 251`}
                            strokeLinecap="round"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg sm:text-xl font-bold">{target.progress}%</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Progress Details */}
                  <div className="border-t pt-4 mt-4">
                    {target.category === 'memorization' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-4">
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs sm:text-sm text-gray-500">Pages</p>
                          <p className="text-sm sm:text-base font-semibold">{target.completedPages}/{target.totalPages}</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs sm:text-sm text-gray-500">Today</p>
                          <p className="text-sm sm:text-base font-semibold">{target.todaysPractice}</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg col-span-2 sm:col-span-1">
                          <p className="text-xs sm:text-sm text-gray-500">Weekly Avg</p>
                          <p className="text-sm sm:text-base font-semibold">{target.weeklyAverage}</p>
                        </div>
                      </div>
                    )}

                    {target.category === 'tajweed' && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 sm:gap-4 mb-4">
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs sm:text-sm text-gray-500">Lessons</p>
                          <p className="text-sm sm:text-base font-semibold">{target.completedLessons}/{target.totalLessons}</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs sm:text-sm text-gray-500">Tests</p>
                          <p className="text-sm sm:text-base font-semibold">{target.testsCompleted}</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg col-span-2 sm:col-span-1">
                          <p className="text-xs sm:text-sm text-gray-500">Avg Score</p>
                          <p className="text-sm sm:text-base font-semibold">{target.averageScore}%</p>
                        </div>
                      </div>
                    )}

                    {target.category === 'recitation' && (
                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4 mb-4">
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs sm:text-sm text-gray-500">Streak</p>
                          <p className="text-sm sm:text-base font-semibold text-green-600">🔥 {target.currentStreak}d</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs sm:text-sm text-gray-500">Longest</p>
                          <p className="text-sm sm:text-base font-semibold">{target.longestStreak}d</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs sm:text-sm text-gray-500">Today</p>
                          <p className="text-sm sm:text-base font-semibold">{target.todaysPages}p</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 rounded-lg">
                          <p className="text-xs sm:text-sm text-gray-500">Total</p>
                          <p className="text-sm sm:text-base font-semibold">{target.totalPagesRead}p</p>
                        </div>
                      </div>
                    )}

                    {/* Milestones */}
                    {target.milestones && (
                      <div className="mt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Milestones</p>
                        <div className="space-y-2">
                          {target.milestones.map((milestone) => (
                            <div key={milestone.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                              <div className="flex items-center space-x-2">
                                {milestone.completed ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Clock className="w-4 h-4 text-gray-400" />
                                )}
                                <span className={`text-sm ${milestone.completed ? 'text-gray-700 line-through' : 'text-gray-600'}`}>
                                  {milestone.name}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">{milestone.date}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Button */}
                    <div className="flex justify-center sm:justify-end mt-4">
                      <button
                        onClick={() => {
                          // Navigate to related content based on target
                          if (target.category === 'memorization') {
                            setActiveTab('quran');
                            // Navigate to the specific surah/page for memorization
                          }
                        }}
                        className="px-3 sm:px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:from-green-600 hover:to-emerald-600 transition flex items-center space-x-2 text-sm sm:text-base"
                      >
                        <BookOpen className="w-4 h-4" />
                        <span>Continue Practice</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {myTargets.length === 0 && (
            <div className="bg-white rounded-xl shadow-sm p-12 text-center">
              <Target className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-700 mb-2">No Active Targets</h3>
              <p className="text-gray-500">Your teacher hasn't assigned any targets yet.</p>
            </div>
          )}
        </div>
      )}
    </div>

      {/* Compose Message Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500 to-indigo-500 p-6 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">New Message</h3>
                <button
                  onClick={() => {
                    setShowComposeModal(false);
                    setComposeSubject('');
                    setComposeMessage('');
                  }}
                  className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">To</label>
                <select className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400">
                  <option>Ustadh Ahmed (Teacher)</option>
                  <option>School Admin</option>
                  <option>Parent</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Enter message subject..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Message</label>
                <textarea
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  placeholder="Type your message here..."
                  rows={8}
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-400 resize-none"
                />
              </div>

              <div className="flex items-center space-x-4">
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Attach file">
                  <Paperclip className="w-5 h-5" />
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition" title="Add emoji">
                  😊
                </button>
              </div>

              <div className="flex items-center justify-between pt-4 border-t">
                <button
                  onClick={() => {
                    setShowComposeModal(false);
                    setComposeSubject('');
                    setComposeMessage('');
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  className="px-6 py-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg hover:from-blue-600 hover:to-indigo-600 transition flex items-center space-x-2"
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WhatsApp-style Note Reply Modal */}
      {showNoteReply && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full h-[600px] flex flex-col overflow-hidden">
            {/* WhatsApp Header */}
            <div className="bg-gradient-to-r from-green-600 to-green-500 text-white p-4 flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center">
                  <User className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <p className="font-semibold">{showNoteReply.teacherName}</p>
                  <p className="text-xs text-green-100">Online</p>
                </div>
              </div>
              <button
                onClick={() => setShowNoteReply(null)}
                className="p-2 hover:bg-green-700 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDAiIGhlaWdodD0iNDAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzlIj48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSIxIiBmaWxsPSIjZTVlN2ViIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')]">
              <div className="space-y-3">
                {/* Teacher's Initial Note */}
                <div className="flex justify-start">
                  <div className="max-w-[70%]">
                    <div className="bg-white rounded-lg rounded-tl-none p-3 shadow">
                      <p className="text-sm text-gray-800">{showNoteReply.teacherNote}</p>
                      <p className="text-xs text-gray-400 mt-1 text-right">{showNoteReply.timestamp}</p>
                    </div>
                  </div>
                </div>

                {/* Conversation Messages */}
                {showNoteReply.replies.map((reply) => (
                  <div 
                    key={reply.id} 
                    className={`flex ${reply.isStudent ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-[70%]">
                      <div className={`rounded-lg p-3 shadow ${
                        reply.isStudent 
                          ? 'bg-green-100 rounded-tr-none' 
                          : 'bg-white rounded-tl-none'
                      }`}>
                        {reply.type === 'voice' ? (
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => handlePlayAudio(reply.id)}
                              className={`p-2 rounded-full transition ${
                                playingAudioId === reply.id
                                  ? 'bg-red-500 hover:bg-red-600 animate-pulse'
                                  : 'bg-green-500 hover:bg-green-600'
                              } text-white`}
                            >
                              {playingAudioId === reply.id ? (
                                <Pause className="w-3 h-3" />
                              ) : (
                                <Play className="w-3 h-3" />
                              )}
                            </button>
                            <div className="flex-1">
                              <div className="h-6 bg-gray-200 rounded-full relative overflow-hidden">
                                {/* Progress bar */}
                                {playingAudioId === reply.id && (
                                  <div 
                                    className="absolute left-0 top-0 h-full bg-green-400 transition-all duration-150"
                                    style={{ width: `${audioProgress[reply.id] || 0}%` }}
                                  />
                                )}
                                {/* Waveform */}
                                <div className="absolute inset-0 flex items-center px-1">
                                  {[...Array(20)].map((_, i) => {
                                    const isPlaying = playingAudioId === reply.id;
                                    const isPassed = isPlaying && i < (20 * (audioProgress[reply.id] || 0) / 100);
                                    return (
                                      <div 
                                        key={i} 
                                        className={`w-0.5 mx-px transition-all ${
                                          isPassed 
                                            ? 'bg-white' 
                                            : isPlaying 
                                              ? 'bg-gray-500 animate-pulse' 
                                              : 'bg-gray-400'
                                        }`}
                                        style={{ 
                                          height: `${Math.sin(i * 0.5) * 50 + 50}%`,
                                          animationDelay: `${i * 50}ms`
                                        }}
                                      />
                                    );
                                  })}
                                </div>
                              </div>
                            </div>
                            <span className={`text-xs ${
                              playingAudioId === reply.id ? 'text-green-600 font-medium' : 'text-gray-500'
                            }`}>
                              {playingAudioId === reply.id 
                                ? `0:${Math.floor((100 - (audioProgress[reply.id] || 0)) * 0.15).toString().padStart(2, '0')}`
                                : '0:15'
                              }
                            </span>
                          </div>
                        ) : (
                          <p className="text-sm text-gray-800">{reply.text}</p>
                        )}
                        <div className="flex items-center justify-end space-x-1 mt-1">
                          <p className="text-xs text-gray-400">{reply.timestamp}</p>
                          {reply.isStudent && (
                            <div className="flex">
                              <Check className="w-3 h-3 text-blue-500" />
                              <Check className="w-3 h-3 text-blue-500 -ml-1" />
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* WhatsApp-style Input Bar */}
            <div className="bg-gray-100 p-3 border-t">
              <div className="flex items-end space-x-2">
                {/* Voice/Text Toggle */}
                {!replyText.trim() ? (
                  <button
                    onClick={handleVoiceRecording}
                    className={`p-3 rounded-full transition ${
                      isRecordingReply 
                        ? 'bg-red-500 text-white animate-pulse' 
                        : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    {isRecordingReply ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                  </button>
                ) : (
                  <button
                    onClick={() => handleSendReply('text')}
                    className="p-3 bg-green-500 text-white rounded-full hover:bg-green-600 transition"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                )}
                
                {/* Message Input */}
                <div className="flex-1">
                  <input
                    type="text"
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && replyText.trim() && handleSendReply('text')}
                    placeholder="Type a message"
                    className="w-full px-4 py-3 bg-white rounded-full border focus:outline-none focus:border-green-500"
                  />
                </div>
              </div>
              
              {/* Recording Indicator */}
              {isRecordingReply && (
                <div className="mt-2 flex items-center justify-center space-x-2 text-red-500">
                  <div className="animate-pulse">●</div>
                  <span className="text-sm">Recording...</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Compose Message Modal */}
      {showComposeModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">New Message to Teacher</h3>
              <button
                onClick={() => setShowComposeModal(false)}
                className="p-1 hover:bg-gray-100 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4">
              {/* To Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To:
                </label>
                <div className="px-3 py-2 bg-gray-100 rounded border text-sm">
                  Ustadh Ahmed (Your Teacher)
                </div>
              </div>

              {/* Subject Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject:
                </label>
                <input
                  type="text"
                  value={composeSubject}
                  onChange={(e) => setComposeSubject(e.target.value)}
                  placeholder="Enter subject..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
                />
              </div>

              {/* Message Field */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message:
                </label>
                <textarea
                  value={composeMessage}
                  onChange={(e) => setComposeMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:border-blue-500 resize-none"
                  rows="6"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowComposeModal(false)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSendMessage}
                  disabled={!composeSubject.trim() || !composeMessage.trim()}
                  className={`flex-1 px-4 py-2 rounded-lg flex items-center justify-center space-x-2 ${
                    composeSubject.trim() && composeMessage.trim()
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                  <span>Send Message</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Profile View Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div className="flex items-center space-x-4">
                <div className="w-20 h-20 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {studentProfile.name.split(' ').map((n: any) => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{studentProfile.name}</h2>
                  <p className="text-gray-500">{studentProfile.studentId} • {studentProfile.class}</p>
                </div>
              </div>
              <button
                onClick={() => setShowProfileModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  This profile is managed by your school. Contact the administration for any changes.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              {/* Personal Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 border-b pb-2">Personal Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Full Name</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.name}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Student ID</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.studentId}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Date of Birth</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.dateOfBirth}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Gender</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.gender}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Blood Group</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.bloodGroup}</p>
                  </div>
                </div>
              </div>

              {/* Academic Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 border-b pb-2">Academic Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Class</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.class}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Section</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.section}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Enrollment Date</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.enrollmentDate}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Memorization Progress</label>
                    <p className="text-sm font-medium text-gray-800">{studentInfo.memorized}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Revision Progress</label>
                    <p className="text-sm font-medium text-gray-800">{studentInfo.revision}</p>
                  </div>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 border-b pb-2">Contact Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Email</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.email}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Phone Number</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.phone}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Address</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.address}</p>
                  </div>
                </div>
              </div>

              {/* Guardian Information */}
              <div className="space-y-4">
                <h3 className="font-semibold text-gray-700 border-b pb-2">Guardian Information</h3>
                
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Guardian Name</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.guardian}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Guardian Phone</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.guardianPhone}</p>
                  </div>
                  
                  <div>
                    <label className="text-xs text-gray-500">Emergency Contact</label>
                    <p className="text-sm font-medium text-gray-800">{studentProfile.emergencyContact}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t flex justify-end">
              <button
                onClick={() => setShowProfileModal(false)}
                className="px-6 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
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