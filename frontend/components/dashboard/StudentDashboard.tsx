'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useSectionNotifications } from '@/hooks/useSectionNotifications';
import { NotificationBadge } from '@/components/notifications/NotificationBadge';
import { useHighlights } from '@/hooks/useHighlights';
import { supabase } from '@/lib/supabase';
import {
  getQuranByScriptId,
  getSurahByNumber,
  getAllQuranScripts,
  getScriptStyling,
  getResponsiveScriptStyling,
  getDynamicScriptStyling
} from '@/data/quran/cleanQuranLoader';
import { surahList } from '@/data/quran/surahData';
import { mushafPages, getPageContent, getPageBySurahAyah, getSurahPageRange, TOTAL_MUSHAF_PAGES } from '@/data/completeMushafPages';
import SimpleAnnotationCanvas from '@/components/dashboard/SimpleAnnotationCanvas';
import { BISMILLAH_BASE64 } from '@/lib/bismillahImage';
import MessagesPanel from '@/components/messages/MessagesPanel';
import GradebookPanel from '@/components/gradebook/GradebookPanel';
import CalendarPanel from '@/components/calendar/CalendarPanel';
import MasteryPanel from '@/components/mastery/MasteryPanel';
import { useAssignments } from '@/hooks/useAssignments';
import { useHomework } from '@/hooks/useHomework';
import { useProgress } from '@/hooks/useProgress';
import { useMastery } from '@/hooks/useMastery';
import AttendancePanel from '@/components/attendance/AttendancePanel';
import TargetsPanel from '@/components/targets/TargetsPanel';
import NotesPanel from '@/features/annotations/components/NotesPanel';
import ProgressSection from '@/components/dashboard/ProgressSection';
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
  Calendar as CalendarIcon,
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
  // Student authentication and data
  const [studentId, setStudentId] = useState<string | null>(null);
  const [isLoadingStudent, setIsLoadingStudent] = useState(true);
  const [studentError, setStudentError] = useState<string | null>(null);

  // Student Info
  const [studentInfo, setStudentInfo] = useState({
    id: '',
    name: 'Student',
    email: '',
    dob: '',
    gender: '',
    age: 0,
    grade: '',
    phone: '',
    address: '',
    active: true,
    enrollmentDate: '',
    schoolId: '',
    class: '',
    teacherId: '',
    currentSurah: 1,
    currentAyah: 1,
    memorized: '0 Juz',
    revision: '0 Juz',
    lastSession: '',
    lastPageVisited: 1,
    lastSurahVisited: 1,
    classSchedule: [],
    physicalAttendance: 0,
    platformActivity: 0
  });

  // Fetch student data from authentication
  useEffect(() => {
    async function fetchStudentData() {
      try {
        setIsLoadingStudent(true);

        // Get current authenticated user
        const { data: { user }, error: userError } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error('Not authenticated');
        }

        // Get student record with full profile information
        const { data: studentData, error: studentErr } = await supabase
          .from('students')
          .select(`
            id,
            user_id,
            dob,
            gender,
            age,
            grade,
            phone,
            address,
            active,
            created_at,
            profiles:user_id (
              display_name,
              email,
              school_id,
              role
            )
          `)
          .eq('user_id', user.id)
          .single();

        if (studentErr || !studentData) {
          throw new Error('Student record not found');
        }

        console.log('📋 Student data fetched:', studentData);

        setStudentId(studentData.id);
        setStudentInfo(prev => ({
          ...prev,
          id: studentData.id,
          name: (studentData as any).profiles?.display_name || 'Student',
          email: (studentData as any).profiles?.email || '',
          dob: studentData.dob || '',
          gender: studentData.gender || '',
          age: studentData.age || 0,
          grade: studentData.grade || '',
          phone: studentData.phone || '',
          address: studentData.address || '',
          active: studentData.active !== undefined ? studentData.active : true,
          enrollmentDate: studentData.created_at || '',
          schoolId: (studentData as any).profiles?.school_id || ''
        }));

        // Get teacher ID from class enrollment
        console.log('🔍 Fetching teacher ID for student:', studentData.id);

        // Get class enrollment
        const { data: classEnrollment, error: classError } = await supabase
          .from('class_enrollments')
          .select('class_id')
          .eq('student_id', studentData.id)
          .maybeSingle();

        if (classError) {
          console.error('⚠️ Error fetching class enrollment:', classError);
        } else if (classEnrollment) {
          console.log('✅ Found class enrollment:', classEnrollment.class_id);

          // Get primary teacher for the class
          const { data: classTeacher, error: teacherError } = await supabase
            .from('class_teachers')
            .select('teacher_id')
            .eq('class_id', classEnrollment.class_id)
            .maybeSingle();

          if (teacherError) {
            console.error('⚠️ Error fetching class teacher:', teacherError);
          } else if (classTeacher) {
            console.log('✅ Teacher ID set:', classTeacher.teacher_id);
            setStudentInfo(prev => ({
              ...prev,
              teacherId: classTeacher.teacher_id,
              class: `Class ${classEnrollment.class_id.substring(0, 8)}`
            }));
          } else {
            console.log('ℹ️ No teacher assigned to class yet');
          }
        } else {
          console.log('ℹ️ Student not enrolled in any class yet');
        }

        // TODO: Get locked script from database when migration is applied
        // For now, use default script
        console.log('📖 Using default uthmani-hafs script');
        setSelectedScript('uthmani-hafs');
        setScriptLocked(true);

      } catch (err: any) {
        console.error('Error fetching student data:', err);
        setStudentError(err.message);
      } finally {
        setIsLoadingStudent(false);
      }
    }

    fetchStudentData();
  }, []);

  // Logout Handler
  const handleLogout = async () => {
    try {
      console.log('🚪 Logging out...');
      await supabase.auth.signOut();
      // Redirect to login page
      window.location.href = '/login';
    } catch (error) {
      console.error('❌ Logout error:', error);
      // Still redirect even if signout fails
      window.location.href = '/login';
    }
  };

  // Section notifications hook for badge system
  const { markSectionRead, getSectionCount } = useSectionNotifications();

  // Core States
  const [activeTab, setActiveTab] = useState('quran'); // 'quran', 'homework', 'assignments', 'progress', 'targets', 'messages'
  const [selectedScript, setSelectedScript] = useState('uthmani-hafs'); // Teacher-controlled, locked for students
  const [scriptLocked, setScriptLocked] = useState(true); // Always locked for students
  const [currentSurah, setCurrentSurah] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [quranText, setQuranText] = useState({ surah: '', ayahs: [] });
  const [showSurahDropdown, setShowSurahDropdown] = useState(false);
  const [currentMushafPage, setCurrentMushafPage] = useState(1);
  const [currentDisplaySurahs, setCurrentDisplaySurahs] = useState<string[]>([]);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [highlightStyle, setHighlightStyle] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedStyle = localStorage.getItem('student_highlightStyle');
      return savedStyle || 'full';
    }
    return 'full';
  });
  const [penMode, setPenMode] = useState(false);
  const [penColor, setPenColor] = useState('#FF0000');
  const [penWidth, setPenWidth] = useState(2);
  const [eraserMode, setEraserMode] = useState(false);
  const quranContainerRef = useRef<HTMLDivElement>(null);

  // Mistake Types for Highlights (Read-only display for students)
  const mistakeTypes = [
    { id: 'recap', name: 'Recap/Review', color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
    { id: 'homework', name: 'Homework', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700' },
    { id: 'tajweed', name: 'Tajweed', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
    { id: 'haraka', name: 'Haraka', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700' },
    { id: 'letter', name: 'Letter', color: 'brown', bgColor: 'bg-amber-100', textColor: 'text-amber-900' }
  ];

  // Homework & Assignment Filters
  const [homeworkSearchTerm, setHomeworkSearchTerm] = useState('');
  const [homeworkStatusFilter, setHomeworkStatusFilter] = useState('all');
  const [assignmentSearchTerm, setAssignmentSearchTerm] = useState('');
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState('all');

  // Message & UI States
  const [messageTab, setMessageTab] = useState('inbox');
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(3);
  const [replyText, setReplyText] = useState('');
  const [isRecordingReply, setIsRecordingReply] = useState(false);
  const [playingAudioId, setPlayingAudioId] = useState<any>(null);
  const [audioProgress, setAudioProgress] = useState<{ [key: string]: number }>({});
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedHighlightForNotes, setSelectedHighlightForNotes] = useState<string | null>(null);
  const [showNoteReply, setShowNoteReply] = useState<any>({}); // Legacy state for unused reply function

  // Get notifications from API
  const {
    notifications: dbNotifications,
    unreadCount,
    isLoading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    refresh: refreshNotifications
  } = useNotifications();

  // Assignments Hook
  const {
    assignments,
    isLoading: assignmentsLoading,
    error: assignmentsError
  } = useAssignments(studentInfo.id);

  // Homework Hook
  const {
    homeworkList: homeworkData,
    isLoading: homeworkLoading,
    error: homeworkError,
    fetchHomework
  } = useHomework();

  // Fetch homework when student info is available
  useEffect(() => {
    console.log('📚 Homework useEffect triggered - studentInfo.id:', studentInfo?.id);
    if (studentInfo?.id) {
      console.log('🔄 Fetching homework for student:', studentInfo.id);
      fetchHomework({ student_id: studentInfo.id, include_completed: true });
    } else {
      console.log('⚠️ No studentInfo.id - skipping homework fetch');
    }
  }, [studentInfo?.id, fetchHomework]);

  // Progress Hook
  const { progressData, isLoading: isLoadingProgress, fetchProgress } = useProgress();

  // Mastery Hook
  const { studentOverview: masteryData, isLoading: isMasteryLoading, fetchStudentMastery } = useMastery(studentInfo?.id);

  // Fetch progress when student info is available
  useEffect(() => {
    if (studentId) {
      console.log('📊 Fetching progress data for student:', studentId);
      fetchProgress(studentId);
    }
  }, [studentId, fetchProgress]);

  // Fetch mastery data when student info is available
  useEffect(() => {
    if (studentInfo?.id) {
      console.log('📖 Fetching mastery data for student:', studentInfo.id);
      fetchStudentMastery(studentInfo.id);
    }
  }, [studentInfo?.id, fetchStudentMastery]);

  // Persist highlight style to localStorage when it changes
  useEffect(() => {
    if (typeof window !== 'undefined' && highlightStyle) {
      localStorage.setItem('student_highlightStyle', highlightStyle);
      console.log('💾 [STUDENT HIGHLIGHT STYLE] Saved to localStorage:', highlightStyle);
    }
  }, [highlightStyle]);

  // Update current display Surahs based on page
  useEffect(() => {
    const pageInfo = getPageContent(currentMushafPage);
    if (pageInfo) {
      const surahsOnThisPage = pageInfo.surahsOnPage || [pageInfo.surahStart];
      const surahNames = surahsOnThisPage
        .map((surahNum: number) => {
          const surahInfo = allSurahs.find((s: any) => s.number === surahNum);
          return surahInfo?.nameArabic || '';
        })
        .filter((name: string) => name !== '');
      setCurrentDisplaySurahs(surahNames);
    }
  }, [currentMushafPage]);

  // Transform homework data to match UI expectations
  const transformedHomework = useMemo(() => {
    console.log('📝 Transforming homework data:', homeworkData?.length || 0, 'items');
    const transformed = (homeworkData || []).map((hw: any) => ({
      id: hw.id,
      studentId: hw.student_id,
      studentName: hw.student?.display_name || studentInfo.name,
      class: studentInfo.class || 'N/A',
      surah: hw.surah ? `Surah ${hw.surah}` : 'Unknown Surah',
      ayahRange: hw.ayah_start && hw.ayah_end ? `${hw.ayah_start}-${hw.ayah_end}` : 'N/A',
      note: hw.note || '',
      assignedDate: hw.created_at ? new Date(hw.created_at).toLocaleDateString() : '',
      dueDate: hw.created_at ? new Date(hw.created_at).toLocaleDateString() : '',
      replies: hw.notes?.length || 0,
      status: hw.color === 'gold' ? 'completed' : 'pending',
      color: hw.color,
    }));
    console.log('✅ Transformed homework:', transformed);
    return transformed;
  }, [homeworkData, studentInfo.name, studentInfo.class]);

  // Notifications now fetched from API via useNotifications hook (removed mock data)

  // Teacher Highlights - Fetch from database using useHighlights hook
  const {
    highlights: dbHighlights,
    isLoading: highlightsLoading,
    error: highlightsError,
    refreshHighlights
  } = useHighlights(studentId);

  // Transform database highlights to UI format
  const [highlights, setHighlights] = useState<any[]>([]);

  // Transform database highlights to UI format for current page (same as StudentManagementDashboard)
  useEffect(() => {
    if (!dbHighlights || dbHighlights.length === 0) {
      setHighlights([]);
      return;
    }

    // Get current page data
    const pageData = getPageContent(currentMushafPage);
    if (!pageData) return;

    // Transform highlights to UI format with ayahIndex and wordIndex
    const pageHighlights: any[] = [];

    dbHighlights.forEach((dbHighlight: any) => {
      // Only show highlights for current surah
      if (dbHighlight.surah === currentSurah) {
        // Full ayah highlight (word_start and word_end are null)
        if (dbHighlight.word_start === null || dbHighlight.word_start === undefined) {
          // Find all words in this ayah range
          for (let ayahNum = dbHighlight.ayah_start; ayahNum <= dbHighlight.ayah_end; ayahNum++) {
            const ayahIndex = quranText.ayahs.findIndex((a: any) => a.number === ayahNum);
            if (ayahIndex >= 0) {
              const ayah = quranText.ayahs[ayahIndex];
              const wordCount = ayah.words?.length || 0;

              // Highlight all words in this ayah
              for (let wordIndex = 0; wordIndex < wordCount; wordIndex++) {
                pageHighlights.push({
                  id: `${dbHighlight.id}-${ayahIndex}-${wordIndex}`,
                  dbId: dbHighlight.id,
                  ayahIndex,
                  wordIndex,
                  mistakeType: dbHighlight.type,
                  color: dbHighlight.color,
                  isCompleted: dbHighlight.status === 'gold',  // Check status field, not isCompleted
                  status: dbHighlight.status,
                  isFullAyah: true
                });
              }
            }
          }
        } else {
          // Single word or word range highlight
          const ayahIndex = quranText.ayahs.findIndex((a: any) => a.number === dbHighlight.ayah_start);
          if (ayahIndex >= 0) {
            for (let wordIndex = dbHighlight.word_start; wordIndex <= dbHighlight.word_end; wordIndex++) {
              pageHighlights.push({
                id: `${dbHighlight.id}-${ayahIndex}-${wordIndex}`,
                dbId: dbHighlight.id,
                ayahIndex,
                wordIndex,
                mistakeType: dbHighlight.type,
                color: dbHighlight.color,
                isCompleted: dbHighlight.status === 'gold',  // Check status field, not isCompleted
                status: dbHighlight.status,
                isFullAyah: false
              });
            }
          }
        }
      }
    });

    setHighlights(pageHighlights);
  }, [dbHighlights, currentMushafPage, quranText]);

  // Safety check for backward compatibility: use highlights if available, otherwise dbHighlights
  const safeHighlights = highlights.length > 0 ? highlights : (dbHighlights || []);

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

  // Load Quran text based on current mushaf page
  useEffect(() => {
    const loadQuranText = async () => {
      if (!selectedScript) {
        console.log('⏳ Waiting for script to be set...');
        return;
      }

      const scriptId = selectedScript;

      // Get the current page data to determine which surah to load
      const pageData = getPageContent(currentMushafPage);
      if (!pageData) {
        console.error('❌ Page data not found for page:', currentMushafPage);
        return;
      }

      // Load the surah that starts on this page (or contains it)
      const surahToLoad = pageData.surahStart;
      const surahInfo = surahList.find((s: any) => s.number === surahToLoad);

      console.log('📖 Loading Quran text:', {
        script: scriptId,
        page: currentMushafPage,
        surah: surahToLoad,
        pageData
      });

      try {
        const surahData = await getSurahByNumber(scriptId, surahToLoad);

        if (surahData && surahData.ayahs && surahData.ayahs.length > 0) {
          setQuranText({
            surah: surahData.name || surahInfo?.nameArabic || 'الفاتحة',
            ayahs: surahData.ayahs.map((ayah: any) => ({
              number: ayah.numberInSurah,
              text: ayah.text,
              words: Array.isArray(ayah.words)
                ? ayah.words
                : (ayah.text ? ayah.text.split(' ').map((w: string) => ({ text: w })) : [])
            }))
          });

          // Update current surah to match loaded surah
          if (currentSurah !== surahToLoad) {
            setCurrentSurah(surahToLoad);
          }

          console.log('✅ Quran text loaded successfully:', {
            surah: surahData.name,
            ayahCount: surahData.ayahs.length
          });
        }
      } catch (error) {
        console.error('❌ Error loading Quran text:', error);
      }
    };

    loadQuranText();
  }, [currentMushafPage, selectedScript]);

  const allSurahs = surahList.map((s: any) => ({
    number: s.number,
    nameArabic: s.nameArabic,
    nameEnglish: s.nameEnglish,
    meaning: s.meaning,
    verses: s.verses,
    type: s.type
  }));

  const handleHighlightClick = (highlightId: any) => {
    // Open notes conversation modal
    // Find the highlight to get its database ID
    console.log('🔍 handleHighlightClick called with ID:', highlightId);
    console.log('📊 Available highlights:', highlights.map((h: any) => ({ id: h.id, dbId: h.dbId })));
    const clickedHighlight = highlights.find((h: any) => h.id === highlightId);
    console.log('✅ Found highlight:', clickedHighlight);
    if (clickedHighlight && clickedHighlight.dbId) {
      console.log('📝 Opening modal with dbId:', clickedHighlight.dbId);
      setSelectedHighlightForNotes(clickedHighlight.dbId);
      setShowNotesModal(true);
    } else {
      console.error('❌ No highlight found or no dbId:', { clickedHighlight, highlightId });
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

      // Note: Replies are stored in database via notes table (future enhancement)
      // For now, just update the modal state
      setShowNoteReply((prev: any) => ({
        ...prev,
        replies: [...(prev.replies || []), newReply]
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

  // Show loading state while fetching student data
  if (isLoadingStudent || (studentId && highlightsLoading)) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  // Show error state if student data fetch failed
  if (studentError) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-600 mx-auto mb-4" />
          <p className="text-red-600 font-semibold mb-2">Error loading dashboard</p>
          <p className="text-gray-600 mb-4">{studentError}</p>
          <button
            onClick={() => window.location.reload()}
            className="bg-green-600 text-white px-6 py-2 rounded-lg hover:bg-green-700"
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
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between relative">
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

            {/* Center - QuranAkh Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center pointer-events-none">
              <img
                src="/quranakh-logo.png"
                alt="QuranAkh Logo"
                className="w-12 h-12 object-contain"
              />
            </div>

            {/* Right Side - Actions */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="relative p-2 hover:bg-gray-100 rounded-lg"
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                
                {showNotifications && (
                  <div className="absolute right-0 mt-2 w-96 bg-white rounded-lg shadow-xl border border-gray-200 z-50">
                    <div className="p-4 border-b">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-gray-900">
                          Notifications
                          {unreadCount > 0 && (
                            <span className="ml-2 text-sm text-red-500">
                              ({unreadCount} unread)
                            </span>
                          )}
                        </h3>
                        <div className="flex items-center space-x-2">
                          {unreadCount > 0 && (
                            <button
                              onClick={() => markAllAsRead()}
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
                          <div className="w-5 h-5 mx-auto mb-2 border-2 border-gray-300 border-t-emerald-600 rounded-full animate-spin"></div>
                          Loading notifications...
                        </div>
                      ) : dbNotifications.length > 0 ? (
                        dbNotifications.map((notification: any) => {
                          const notifType = notification.type || 'other';
                          const title = notification.payload?.title || 'Notification';
                          const body = notification.payload?.body || '';

                          return (
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
                                <div className={`p-2 rounded-full flex-shrink-0 ${
                                  notifType.includes('assignment') ? 'bg-blue-100' :
                                  notifType.includes('homework') ? 'bg-green-100' :
                                  notifType.includes('grade') ? 'bg-purple-100' :
                                  notifType.includes('attendance') ? 'bg-yellow-100' :
                                  notifType.includes('message') ? 'bg-pink-100' :
                                  'bg-gray-100'
                                }`}>
                                  {notifType.includes('assignment') && <FileText className="w-4 h-4 text-blue-600" />}
                                  {notifType.includes('homework') && <BookOpen className="w-4 h-4 text-green-600" />}
                                  {notifType.includes('grade') && <Award className="w-4 h-4 text-purple-600" />}
                                  {notifType.includes('attendance') && <Clock className="w-4 h-4 text-yellow-600" />}
                                  {notifType.includes('message') && <Mail className="w-4 h-4 text-pink-600" />}
                                  {!notifType.includes('assignment') && !notifType.includes('homework') && !notifType.includes('grade') && !notifType.includes('attendance') && !notifType.includes('message') && (
                                    <Bell className="w-4 h-4 text-gray-600" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <p className="text-sm font-medium text-gray-900 line-clamp-2">
                                      {title}
                                    </p>
                                    {!notification.is_read && (
                                      <span className="flex-shrink-0 w-2 h-2 bg-blue-500 rounded-full mt-1"></span>
                                    )}
                                  </div>
                                  {body && (
                                    <p className="text-xs text-gray-600 mt-1 line-clamp-2">
                                      {body}
                                    </p>
                                  )}
                                  <p className="text-xs text-gray-400 mt-1">
                                    {notification.time_ago || 'Just now'}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })
                      ) : (
                        <div className="p-8 text-center text-gray-500">
                          <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                          <p className="text-sm">No notifications yet</p>
                          <p className="text-xs mt-1">You'll be notified about important updates</p>
                        </div>
                      )}
                    </div>

                    <div className="p-3 border-t bg-gray-50">
                      <button className="w-full text-center text-xs text-emerald-600 hover:text-emerald-700 font-medium py-1">
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
                    <button
                      onClick={handleLogout}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-red-600"
                    >
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
                      {allSurahs.map((surah: any) => (
                        <button
                          key={surah.number}
                          onClick={() => {
                            // Navigate to first page of selected surah
                            const { firstPage } = getSurahPageRange(surah.number);
                            console.log('🔖 Navigating to surah:', surah.number, 'page:', firstPage);
                            setCurrentMushafPage(firstPage);
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
            {[
              { id: 'quran', label: 'Quran', icon: BookOpen, section: 'quran' },
              { id: 'homework', label: 'Homework', icon: BookOpen, section: 'homework' },
              { id: 'assignments', label: 'Assignments', icon: FileText, section: 'assignments' },
              { id: 'gradebook', label: 'Gradebook', icon: Award, section: 'gradebook' },
              { id: 'mastery', label: 'Mastery', icon: Target, section: 'mastery' },
              { id: 'calendar', label: 'Calendar', icon: CalendarIcon, section: 'calendar' },
              { id: 'attendance', label: 'Attendance', icon: Clock, section: 'attendance' },
              { id: 'progress', label: 'Progress', icon: TrendingUp, section: 'progress' },
              { id: 'targets', label: 'Targets', icon: Target, section: 'targets' },
              { id: 'messages', label: 'Messages', icon: Mail, section: 'messages' }
            ].map((tab) => {
              const hasNotifications = getSectionCount(tab.section) > 0;
              return (
                <button
                  key={tab.id}
                  onClick={() => {
                    // Mark section as read when clicked
                    if (hasNotifications) {
                      markSectionRead(tab.section);
                    }
                    setActiveTab(tab.id);
                  }}
                  className={`relative py-3 px-4 font-medium text-sm rounded-lg transition-all duration-200 ${
                    activeTab === tab.id
                      ? 'text-white bg-green-600 shadow-sm'
                      : hasNotifications
                      ? 'text-green-600 bg-green-50 hover:bg-green-100'
                      : 'text-gray-600 hover:text-green-600 hover:bg-green-50'
                  }`}
                >
                  <span className="flex items-center space-x-2 relative">
                    <div className="relative">
                      <tab.icon className="w-4 h-4" />
                      <NotificationBadge section={tab.section} />
                    </div>
                    <span>{tab.label}</span>
                  </span>
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-12 py-6">
        {/* Quran Tab - Read-Only Student View */}
        {activeTab === 'quran' && (
          <div className="grid grid-cols-12 gap-4">
            {/* Left Panel - Highlights Summary (Read-Only) */}
            <div className="col-span-2 space-y-3 max-h-screen overflow-hidden">
              {/* Highlights Summary */}
              <div className="bg-white rounded-lg shadow-sm p-3">
                <h3 className="font-semibold mb-2 text-sm flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Teacher Highlights
                </h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {/* Show completed highlights first with gold color */}
                  {(() => {
                    const completedHighlights = safeHighlights.filter((h: any) => h.isCompleted);
                    if (completedHighlights.length > 0) {
                      return (
                        <div className="p-1.5 rounded-md bg-yellow-400 text-xs">
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-yellow-900">
                              ✓ Completed ({completedHighlights.length})
                            </span>
                            <Award className="w-3 h-3 text-yellow-900" />
                          </div>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  {/* Show other highlights by type */}
                  {mistakeTypes.map((type: any) => {
                    const typeHighlights = safeHighlights.filter((h: any) => h.mistake_type === type.id && !h.isCompleted);
                    if (typeHighlights.length === 0) return null;
                    return (
                      <div key={type.id} className={`p-1.5 rounded-md ${type.bgColor} text-xs`}>
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${type.textColor}`}>
                            {type.name} ({typeHighlights.length})
                          </span>
                        </div>
                      </div>
                    );
                  })}
                  {safeHighlights.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">No highlights</p>
                  )}
                </div>
              </div>
            </div>

            {/* Main Quran Viewer */}
            <div className="col-span-8">
              <div ref={quranContainerRef} className="bg-white rounded-xl shadow-lg relative" style={{
                background: 'linear-gradient(to bottom, #ffffff, #fafafa)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                maxHeight: '95vh',
                overflow: 'hidden',
                position: 'relative'
              }}>
                {/* Read-Only Pen Annotations Display */}
                {studentInfo && studentInfo.teacherId && selectedScript && (
                  <SimpleAnnotationCanvas
                    studentId={studentInfo.id}
                    teacherId={studentInfo.teacherId}
                    pageNumber={currentMushafPage}
                    scriptId={selectedScript}
                    enabled={false}
                    containerRef={quranContainerRef}
                    penColor={penColor}
                    penWidth={penWidth}
                    eraserMode={eraserMode}
                    onSave={() => {}}
                    onLoad={() => {}}
                    onClear={() => {}}
                  />
                )}

                {/* Page-like container for Quran text */}
                <div className="p-1" style={{
                  backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0,0,0,.02) 25%, rgba(0,0,0,.02) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.02) 75%, rgba(0,0,0,.02) 76%, transparent 77%, transparent)',
                  backgroundSize: '50px 50px',
                  pointerEvents: 'none'
                }}>

                {/* Basmala for new Surahs */}
                {currentSurah !== 1 && currentSurah !== 9 && currentMushafPage === 1 && (
                  <div className="text-center text-3xl font-arabic text-gray-700 py-6 border-b mb-6">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </div>
                )}

                {/* Quran Text Display - Mushaf Style */}
                <div className="relative">
                  <div
                    className="text-center leading-loose px-4 bg-gradient-to-b from-white to-gray-50 rounded-lg"
                    style={{
                      ...getScriptStyling(selectedScript || 'uthmani-hafs'),
                      pointerEvents: 'none'
                    }}
                  >
                  <style jsx>{`
                    @import url('https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap');

                    .mushaf-page-text {
                      text-align-last: start;
                    }

                    .mushaf-page-content {
                      text-align: justify;
                      text-justify: kashida;
                    }
                  `}</style>

                  {(() => {
                    // Get the current mushaf page data
                    const pageData = getPageContent(currentMushafPage);
                    if (!pageData) return <div>Loading page...</div>;

                    // Determine which ayahs to show based on real mushaf page
                    let pageAyahs = [];

                    if (pageData.surahStart === currentSurah && pageData.surahEnd === currentSurah) {
                      // Current surah is entirely contained within this page
                      pageAyahs = quranText.ayahs.filter((ayah: any, idx: number) => {
                        const ayahNumber = idx + 1;
                        return ayahNumber >= pageData.ayahStart && ayahNumber <= pageData.ayahEnd;
                      });
                    } else if (pageData.surahStart === currentSurah) {
                      // Current surah starts on this page but continues on next page
                      pageAyahs = quranText.ayahs.filter((ayah: any, idx: number) => {
                        const ayahNumber = idx + 1;
                        return ayahNumber >= pageData.ayahStart;
                      });
                    } else if (pageData.surahEnd === currentSurah) {
                      // Current surah ends on this page but started on previous page
                      pageAyahs = quranText.ayahs.filter((ayah: any, idx: number) => {
                        const ayahNumber = idx + 1;
                        return ayahNumber <= pageData.ayahEnd;
                      });
                    } else if (pageData.surahsOnPage && pageData.surahsOnPage.includes(currentSurah)) {
                      // Current surah is somewhere in the middle of this page
                      // Show all ayahs of this surah
                      pageAyahs = quranText.ayahs;
                    }

                    // Calculate total page content length for DYNAMIC FONT SIZING
                    // CRITICAL UX RULE: Everything must fit on screen WITHOUT SCROLLING
                    const pageContent = pageAyahs.map((ayah: any) =>
                      ayah.words.map((word: any) => word.text).join(' ')
                    ).join(' ');

                    // Render the page with traditional Mushaf formatting
                    const scriptClass = `script-${selectedScript || 'uthmani-hafs'}`;
                    return (
                      <div className={`mushaf-page-content mushaf-text ${scriptClass}`} style={{
                        position: 'relative',  // Enable absolute positioning for canvas overlay (matches StudentManagementDashboard)
                        width: '38vw',  // NARROWER: More vertical/portrait-like proportions
                        maxWidth: '480px',  // REDUCED: Traditional book page width
                        minHeight: '65vh',  // INCREASED: Use available bottom space
                        maxHeight: '72vh',  // INCREASED: Taller to look like a real page
                        overflow: 'hidden',  // NO scrolling inside container
                        margin: '0 auto',
                        padding: '0.8rem 1rem',
                        backgroundColor: '#FFFFFF',
                        borderRadius: '8px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(64, 130, 109, 0.3), 0 2px 10px rgba(0, 0, 0, 0.2)',
                        border: '2px solid #40826D',
                        ...getDynamicScriptStyling(pageContent, selectedScript || 'uthmani-hafs'),  // DYNAMIC sizing - scales font based on page length
                        transform: `scale(${zoomLevel / 100})`,
                        transformOrigin: 'top center',
                        textAlign: 'right',
                        lineHeight: '1.5'  // Slightly more breathing room with vertical space
                      }}>
                        {pageAyahs.map((ayah: any, ayahIdx: any) => {
                          const isFirstAyahOfSurah = ayah.number === 1;
                          const isNewSurah = ayahIdx === 0 || pageAyahs[ayahIdx - 1].surah !== ayah.surah;
                          const shouldShowBismillah = isFirstAyahOfSurah && isNewSurah && ayah.surah !== 9;
                          const ayahIndex = quranText.ayahs.indexOf(ayah);
                          return (
                            <React.Fragment key={`ayah-${ayah.surah || currentSurah}-${ayah.number}-${ayahIdx}`}>
                              {shouldShowBismillah && (
                                <div className="text-center mb-6 py-4" style={{ display: 'block', width: '100%' }}>
                                  <img
                                    src={BISMILLAH_BASE64}
                                    alt="بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ"
                                    style={{
                                      display: 'block',
                                      margin: '0 auto',
                                      maxWidth: '90%',
                                      height: 'auto',
                                      maxHeight: '70px',
                                      objectFit: 'contain'
                                    }}
                                  />
                                </div>
                              )}
                            <span className="inline relative group">
                      {ayah.words.map((word: any, wordIndex: any) => {
                        // Extract word text - handle both string and object formats
                        const wordText = typeof word === 'string' ? word : (word.text || word);

                        // Get ALL highlights for this word (multiple colors allowed)
                        const wordHighlights = safeHighlights.filter(
                          (h: any) => h.ayahIndex === ayahIndex && h.wordIndex === wordIndex
                        );

                        // CRITICAL FIX: If ANY highlight is completed, show ONLY gold (not gold + other colors)
                        const hasCompletedHighlight = wordHighlights.some((h: any) => h.isCompleted);
                        const mistakes = hasCompletedHighlight
                          ? [{ id: 'completed', name: 'Completed', color: 'gold', bgColor: 'bg-yellow-400', textColor: 'text-yellow-900' }]
                          : wordHighlights.map((h: any) => mistakeTypes.find((m: any) => m.id === h.mistakeType)).filter(Boolean);

                        return (
                          <span
                            key={`${ayahIndex}-${wordIndex}`}
                            onClick={() => {
                              // READ-ONLY: Only allow viewing notes, no highlighting
                              console.log('🖱️ Word clicked, wordHighlights:', wordHighlights);
                              if (wordHighlights.length > 0) {
                                // Call handleHighlightClick to open notes conversation modal
                                console.log('📌 Calling handleHighlightClick with:', wordHighlights[0].id);
                                handleHighlightClick(wordHighlights[0].id);
                              }
                            }}
                            className="inline cursor-pointer rounded transition-colors select-none"
                            style={{
                              position: 'relative',
                              color: '#000000',  // ALWAYS black text, never change
                              paddingLeft: '2px',    // Horizontal padding
                              paddingRight: '2px',   // Horizontal padding
                              lineHeight: '1.3',     // Line height
                              display: 'inline',     // Inline display
                              pointerEvents: 'auto',  // CRITICAL: Override parent's pointer-events: none to enable clicks
                              ...(highlightStyle === 'full' ? (
                                // FULL BACKGROUND MODE (original)
                                mistakes.length === 1 ? {
                                  backgroundImage: `linear-gradient(${
                                    mistakes[0]?.bgColor === 'bg-yellow-900' ? 'rgba(113,63,18,0.6)' :
                                    mistakes[0]?.bgColor === 'bg-yellow-400' ? 'rgba(250,204,21,0.4)' :
                                    mistakes[0]?.bgColor?.includes('amber') ? 'rgba(180,83,9,0.3)' :
                                    mistakes[0]?.bgColor?.includes('purple') ? 'rgba(147,51,234,0.3)' :
                                    mistakes[0]?.bgColor?.includes('green') ? 'rgba(34,197,94,0.3)' :
                                    mistakes[0]?.bgColor?.includes('orange') ? 'rgba(249,115,22,0.3)' :
                                    mistakes[0]?.bgColor?.includes('red') ? 'rgba(239,68,68,0.3)' : 'transparent'
                                  }, ${
                                    mistakes[0]?.bgColor === 'bg-yellow-900' ? 'rgba(113,63,18,0.6)' :
                                    mistakes[0]?.bgColor === 'bg-yellow-400' ? 'rgba(250,204,21,0.4)' :
                                    mistakes[0]?.bgColor?.includes('amber') ? 'rgba(180,83,9,0.3)' :
                                    mistakes[0]?.bgColor?.includes('purple') ? 'rgba(147,51,234,0.3)' :
                                    mistakes[0]?.bgColor?.includes('green') ? 'rgba(34,197,94,0.3)' :
                                    mistakes[0]?.bgColor?.includes('orange') ? 'rgba(249,115,22,0.3)' :
                                    mistakes[0]?.bgColor?.includes('red') ? 'rgba(239,68,68,0.3)' : 'transparent'
                                  })`,
                                  backgroundSize: '100% 70%',  // 30% reduction in vertical height
                                  backgroundRepeat: 'no-repeat',
                                  backgroundPosition: 'center'
                                } : mistakes.length > 1 ? {
                                  backgroundImage: `linear-gradient(135deg, ${mistakes.map((m: any, i: any) => {
                                    const color = m.bgColor === 'bg-yellow-900' ? 'rgba(113,63,18,0.6)' :
                                      m.bgColor === 'bg-yellow-400' ? 'rgba(250,204,21,0.4)' :
                                      m.bgColor.includes('amber') ? 'rgba(180,83,9,0.4)' :
                                      m.bgColor.includes('purple') ? 'rgba(147,51,234,0.4)' :
                                      m.bgColor.includes('green') ? 'rgba(34,197,94,0.4)' :
                                      m.bgColor.includes('orange') ? 'rgba(249,115,22,0.4)' :
                                      m.bgColor.includes('red') ? 'rgba(239,68,68,0.4)' : 'transparent';
                                    const percent = (i * 100) / mistakes.length;
                                    const nextPercent = ((i + 1) * 100) / mistakes.length;
                                    return `${color} ${percent}%, ${color} ${nextPercent}%`;
                                  }).join(', ')})`,
                                  backgroundSize: '100% 70%',  // 30% reduction in vertical height
                                  backgroundRepeat: 'no-repeat',
                                  backgroundPosition: 'center',
                                  fontWeight: '600',
                                  border: '1px solid rgba(0,0,0,0.15)'
                                } : {}
                              ) : (
                                // UNDERLINE MODE (new)
                                mistakes.length === 1 ? {
                                  borderBottom: `3px solid ${
                                    mistakes[0]?.bgColor === 'bg-yellow-900' ? 'rgba(113,63,18,0.9)' :
                                    mistakes[0]?.bgColor === 'bg-yellow-400' ? 'rgba(250,204,21,0.9)' :
                                    mistakes[0]?.bgColor?.includes('amber') ? 'rgba(180,83,9,0.9)' :
                                    mistakes[0]?.bgColor?.includes('purple') ? 'rgba(147,51,234,0.9)' :
                                    mistakes[0]?.bgColor?.includes('green') ? 'rgba(34,197,94,0.9)' :
                                    mistakes[0]?.bgColor?.includes('orange') ? 'rgba(249,115,22,0.9)' :
                                    mistakes[0]?.bgColor?.includes('red') ? 'rgba(239,68,68,0.9)' : 'transparent'
                                  }`,
                                  paddingBottom: '2px'
                                } : mistakes.length > 1 ? {
                                  borderBottom: `3px solid`,
                                  borderImage: `linear-gradient(to right, ${mistakes.map((m: any, i: any) => {
                                    const color = m.bgColor === 'bg-yellow-900' ? 'rgba(113,63,18,0.9)' :
                                      m.bgColor === 'bg-yellow-400' ? 'rgba(250,204,21,0.9)' :
                                      m.bgColor.includes('amber') ? 'rgba(180,83,9,0.9)' :
                                      m.bgColor.includes('purple') ? 'rgba(147,51,234,0.9)' :
                                      m.bgColor.includes('green') ? 'rgba(34,197,94,0.9)' :
                                      m.bgColor.includes('orange') ? 'rgba(249,115,22,0.9)' :
                                      m.bgColor.includes('red') ? 'rgba(239,68,68,0.9)' : 'transparent';
                                    const percent = (i * 100) / mistakes.length;
                                    const nextPercent = ((i + 1) * 100) / mistakes.length;
                                    return `${color} ${percent}%, ${color} ${nextPercent}%`;
                                  }).join(', ')}) 1`,
                                  paddingBottom: '2px',
                                  fontWeight: '600'
                                } : {}
                              ))
                            }}
                          >
                            {wordText}{' '}
                            {(() => {
                              // Check if any highlight on this word has notes from database
                              const hasNotes = wordHighlights.some((h: any) => {
                                // Find database highlight by dbId
                                const dbHighlight = dbHighlights?.find((dbH: any) => dbH.id === h.dbId);
                                // Check if it has notes array with items
                                return dbHighlight && dbHighlight.notes && dbHighlight.notes.length > 0;
                              });

                              if (hasNotes) {
                                return (
                                  <span
                                    className="inline-flex items-center justify-center text-blue-500"
                                    style={{
                                      fontSize: '8px',
                                      width: '12px',
                                      height: '12px',
                                      marginLeft: '1px',
                                      verticalAlign: 'top',
                                      position: 'relative',
                                      top: '0px'
                                    }}
                                  >
                                    <MessageSquare className="w-2 h-2" strokeWidth={2.5} />
                                  </span>
                                );
                              }
                              return null;
                            })()}
                          </span>
                        );
                      })}
                      {/* Ayah Number - Traditional Mushaf Style (Inline) */}
                      <span
                        className="inline-flex items-center justify-center mx-0.5"
                        style={{
                          width: '18px',  // Tiny inline circle
                          height: '18px',
                          borderRadius: '50%',
                          background: 'rgba(64, 130, 109, 0.12)',  // Subtle teal background
                          border: '1px solid rgba(64, 130, 109, 0.4)',  // Teal border
                          color: '#000000',  // Black text
                          fontSize: '9px',  // Very small text
                          fontWeight: '500',
                          boxShadow: '0 0.5px 1px rgba(0,0,0,0.1)',
                          verticalAlign: 'middle',  // Middle alignment
                          display: 'inline-flex',
                          fontFamily: 'sans-serif',  // Use regular font for numbers
                          lineHeight: '1'  // Prevent line height issues
                        }}
                      >
                        {ayah.number}
                      </span>{' '}
                            </span>
                            </React.Fragment>
                          );
                        })}
                      </div>
                    );
                  })()}
                  </div>
                </div>

                {/* Page Navigation */}
                <div className="mt-2 border-t pt-2" style={{ pointerEvents: 'auto' }}>
                  <div className="flex items-center justify-center gap-4">
                    {(() => {
                      // Get current page content to determine Surah
                      const currentPageContent = getPageContent(currentMushafPage);
                      const currentSurahNumber = currentPageContent?.surahStart || 1;

                      // For student dashboard: allow navigation through ALL 604 pages
                      const firstPage = 1;
                      const lastPage = 604;

                      const isFirstPage = currentMushafPage <= firstPage;
                      const isLastPage = currentMushafPage >= lastPage;

                      return (
                        <>
                          {/* Previous Arrow - Just Icon */}
                          <button
                            onClick={() => setCurrentMushafPage((prev: any) => Math.max(firstPage, prev - 1))}
                            disabled={isFirstPage}
                            className={`p-2 ${isFirstPage ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'} text-white rounded-full shadow-sm transition`}
                            title="Previous Page">
                            <ChevronLeft className="w-5 h-5" />
                          </button>

                          {/* Page Info */}
                          <div className="flex items-center gap-2">
                            {/* Current Surah Badge */}
                            {currentDisplaySurahs.length > 0 && (
                              <div className="flex items-center space-x-2 px-3 py-1.5 bg-blue-50 rounded-full border border-blue-200">
                                <Book className="w-4 h-4 text-blue-600" />
                                <span className="text-sm font-medium text-blue-700 font-arabic">
                                  {currentDisplaySurahs.length === 1 ? (
                                    <>سُورَةُ {currentDisplaySurahs[0]}</>
                                  ) : (
                                    <>سُورَةُ {currentDisplaySurahs.join('، ')}</>
                                  )}
                                </span>
                              </div>
                            )}

                            {/* Page Number Badge */}
                            <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
                              <BookOpen className="w-4 h-4 text-green-600" />
                              <span className="text-sm font-medium text-green-700">
                                Page {currentMushafPage}
                              </span>
                            </div>
                          </div>

                          {/* Next Arrow - Just Icon */}
                          <button
                            onClick={() => setCurrentMushafPage((prev: any) => Math.min(lastPage, prev + 1))}
                            disabled={isLastPage}
                            className={`p-2 ${isLastPage ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'} text-white rounded-full shadow-sm transition`}
                            title="Next Page">
                            <ChevronRight className="w-5 h-5" />
                          </button>
                        </>
                      );
                    })()}
                  </div>
                </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Controls */}
            <div className="col-span-2 space-y-3">
              {/* Zoom Control */}
              <div className="bg-white rounded-lg shadow-sm p-3">
                <h3 className="font-semibold mb-2 text-sm">Zoom</h3>
                <div className="space-y-2">
                  <input
                    type="range"
                    min="50"
                    max="150"
                    value={zoomLevel}
                    onChange={(e) => setZoomLevel(parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="text-xs text-center text-gray-600">{zoomLevel}%</div>
                </div>
              </div>

              {/* Highlight Style Toggle */}
              <div className="bg-white rounded-lg shadow-sm p-3">
                <h3 className="font-semibold mb-2 text-sm">Highlight Style</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setHighlightStyle('full')}
                    className={`px-3 py-2 rounded-md border text-sm font-medium transition ${
                      highlightStyle === 'full'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Full
                  </button>
                  <button
                    onClick={() => setHighlightStyle('underline')}
                    className={`px-3 py-2 rounded-md border text-sm font-medium transition ${
                      highlightStyle === 'underline'
                        ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    Underline
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      {/* Homework Tab */}
      {activeTab === 'homework' && (
        <div className="space-y-6 px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl shadow-lg p-6 text-white">
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                <BookOpen className="w-7 h-7 mr-3" />
                My Homework
              </h2>
              <p className="text-green-100 mt-1">View and complete your homework assignments</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-4">
              <select
                value={homeworkStatusFilter}
                onChange={(e) => setHomeworkStatusFilter(e.target.value)}
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
                  placeholder="Search by surah or note..."
                  value={homeworkSearchTerm}
                  onChange={(e) => setHomeworkSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Homework Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {transformedHomework
              .filter((hw: any) => {
                // Status filter - check color field directly
                const matchesStatus = homeworkStatusFilter === 'all' || hw.status === homeworkStatusFilter;

                // Search filter
                const searchLower = homeworkSearchTerm.toLowerCase();
                const matchesSearch = !homeworkSearchTerm ||
                  hw.surah?.toLowerCase().includes(searchLower) ||
                  hw.note?.toLowerCase().includes(searchLower);

                return matchesStatus && matchesSearch;
              })
              .map((homework: any) => (
              <div key={homework.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                {/* Gold framing for completed, green for pending */}
                <div className={`h-2 ${
                  homework.color === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                  'bg-gradient-to-r from-green-500 to-emerald-500'
                }`}></div>

                <div className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-bold text-gray-900">
                        {homework.surah}
                      </h3>
                      <p className="text-sm text-gray-500">Ayah {homework.ayahRange}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                      homework.status === 'completed' ? 'bg-green-100 text-green-700' :
                      'bg-yellow-100 text-yellow-700'
                    }`}>
                      {homework.status}
                    </span>
                  </div>

                  {homework.note && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-600">{homework.note}</p>
                    </div>
                  )}

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Assigned:</span>
                      <span className="text-gray-700">{homework.assignedDate}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Due Date:</span>
                      <span className="text-gray-700">
                        {homework.dueDate}
                      </span>
                    </div>
                  </div>

                  {homework.status !== 'completed' && (
                    <div className="mt-4 pt-4 border-t flex justify-between">
                      <button
                        onClick={() => {
                          setActiveTab('quran');
                          const surahNum = parseInt(homework.surah.replace('Surah ', ''));
                          setCurrentSurah(surahNum);
                        }}
                        className="text-green-600 hover:text-green-700 text-sm font-medium flex items-center"
                      >
                        <BookOpen className="w-4 h-4 mr-1" />
                        Go to Quran
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Empty State */}
          {transformedHomework.filter((hw: any) => {
            const matchesStatus = homeworkStatusFilter === 'all' || hw.status === homeworkStatusFilter;
            const searchLower = homeworkSearchTerm.toLowerCase();
            const matchesSearch = !homeworkSearchTerm ||
              hw.surah?.toLowerCase().includes(searchLower) ||
              hw.note?.toLowerCase().includes(searchLower);
            return matchesStatus && matchesSearch;
          }).length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No homework found</p>
              <p className="text-gray-400 text-sm mt-1">
                {homeworkSearchTerm ? 'Try a different search term' : 'Your teacher will assign homework soon'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Assignments Tab */}
      {activeTab === 'assignments' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <div>
              <h2 className="text-2xl font-bold flex items-center">
                <FileText className="w-7 h-7 mr-3" />
                My Assignments
              </h2>
              <p className="text-blue-100 mt-1">View and complete your assignments from teachers</p>
            </div>
          </div>

          {/* Filter Bar */}
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="flex items-center space-x-4">
              <select
                value={assignmentTypeFilter}
                onChange={(e) => setAssignmentTypeFilter(e.target.value)}
                className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Assignments</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
              </select>

              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search by teacher, title, or description..."
                  value={assignmentSearchTerm}
                  onChange={(e) => setAssignmentSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                />
              </div>
            </div>
          </div>

          {/* Loading State */}
          {assignmentsLoading && (
            <div className="text-center py-12 bg-white rounded-xl">
              <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-gray-500">Loading assignments...</p>
            </div>
          )}

          {/* Error State */}
          {assignmentsError && !assignmentsLoading && (
            <div className="text-center py-12 bg-white rounded-xl">
              <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <p className="text-red-600 text-lg mb-2">Error loading assignments</p>
              <p className="text-gray-500 text-sm">{assignmentsError}</p>
            </div>
          )}

          {/* Assignment Cards */}
          {!assignmentsLoading && !assignmentsError && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {assignments
                .filter((assignment: any) => {
                  // CRITICAL: Use assignment.highlight.color from API response (TeacherDashboard pattern)
                  // API now includes linked highlight data via assignment_highlights junction table
                  const isCompletedByHighlight = assignment.highlight?.color === 'gold' || assignment.highlight?.status === 'gold';

                  // Status filter - check both assignment status AND linked highlight color
                  let matchesStatus = false;
                  if (assignmentTypeFilter === 'all') {
                    matchesStatus = true;
                  } else if (assignmentTypeFilter === 'pending') {
                    matchesStatus = !isCompletedByHighlight && assignment.status !== 'completed';
                  } else if (assignmentTypeFilter === 'completed') {
                    matchesStatus = isCompletedByHighlight || assignment.status === 'completed';
                  }

                  // Search filter
                  const searchLower = assignmentSearchTerm.toLowerCase();
                  const teacherName = assignment.teacher?.display_name || '';
                  const title = assignment.title || '';
                  const description = assignment.description || '';

                  const matchesSearch = !assignmentSearchTerm ||
                    teacherName.toLowerCase().includes(searchLower) ||
                    title.toLowerCase().includes(searchLower) ||
                    description.toLowerCase().includes(searchLower);

                  return matchesStatus && matchesSearch;
                })
                .map((assignment: any) => {
                  // CRITICAL: Use assignment.highlight directly from API response
                  const isCompleted = assignment.highlight?.color === 'gold' || assignment.highlight?.status === 'gold' || assignment.status === 'completed';

                  const dueDate = assignment.due_at ? new Date(assignment.due_at) : null;
                  const isLate = dueDate && new Date() > dueDate && !isCompleted;
                  const assignedDate = assignment.created_at ? new Date(assignment.created_at).toLocaleDateString() : '';
                  const dueDateStr = dueDate ? dueDate.toLocaleDateString() : '';

                  return (
                    <div key={assignment.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                      <div className={`h-2 ${
                        isCompleted ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                        'bg-gradient-to-r from-blue-500 to-indigo-500'
                      }`}></div>

                      <div className="p-6">
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h3 className="text-lg font-bold text-gray-900">
                              {assignment.teacher?.display_name || 'Teacher'}
                            </h3>
                            <p className="text-sm text-gray-500">Assignment #{assignment.id.substring(0, 8)}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                            isCompleted ? 'bg-green-100 text-green-700' :
                            assignment.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                            assignment.status === 'reviewed' ? 'bg-purple-100 text-purple-700' :
                            isLate ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {isLate && !isCompleted ? 'LATE' : assignment.status}
                          </span>
                        </div>

                        <div className="bg-gray-50 rounded-lg p-3 mb-4">
                          <p className="text-sm font-medium text-gray-700">
                            📝 {assignment.title}
                          </p>
                          {assignment.description && (
                            <p className="text-sm text-gray-600 mt-1">{assignment.description}</p>
                          )}
                        </div>

                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-500">Assigned:</span>
                            <span className="text-gray-700">{assignedDate}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-500">Due Date:</span>
                            <span className={isLate ? 'text-red-600 font-medium' : 'text-gray-700'}>
                              {dueDateStr}
                            </span>
                          </div>
                        </div>

                        {assignment.submission && (
                          <div className="mt-4 pt-4 border-t">
                            <div className="flex items-center text-green-600 text-sm">
                              <Check className="w-4 h-4 mr-2" />
                              <span>Submitted on {new Date(assignment.submission.created_at).toLocaleDateString()}</span>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          )}

          {/* Empty State */}
          {!assignmentsLoading && !assignmentsError && assignments.filter((assignment: any) => {
            // CRITICAL: Use assignment.highlight.color from API response (same as main filter)
            const isCompletedByHighlight = assignment.highlight?.color === 'gold' || assignment.highlight?.status === 'gold';

            // Status filter - check both assignment status AND linked highlight color
            let matchesStatus = false;
            if (assignmentTypeFilter === 'all') {
              matchesStatus = true;
            } else if (assignmentTypeFilter === 'pending') {
              matchesStatus = !isCompletedByHighlight && assignment.status !== 'completed';
            } else if (assignmentTypeFilter === 'completed') {
              matchesStatus = isCompletedByHighlight || assignment.status === 'completed';
            }

            // Search filter
            const searchLower = assignmentSearchTerm.toLowerCase();
            const teacherName = assignment.teacher?.display_name || '';
            const title = assignment.title || '';
            const description = assignment.description || '';

            const matchesSearch = !assignmentSearchTerm ||
              teacherName.toLowerCase().includes(searchLower) ||
              title.toLowerCase().includes(searchLower) ||
              description.toLowerCase().includes(searchLower);

            return matchesStatus && matchesSearch;
          }).length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl">
              <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No assignments found</p>
              <p className="text-gray-400 text-sm mt-1">
                {assignmentSearchTerm ? 'Try a different search term' : 'Your teachers will create assignments for you'}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Progress Tab */}
      {activeTab === 'progress' && (
        <ProgressSection
          progressData={progressData}
          isLoading={isLoadingProgress}
          assignments={assignments}
          homeworkData={transformedHomework}
          studentId={studentInfo.id}
          masteryData={masteryData}
          masteryLoading={isMasteryLoading}
        />
      )}


      {/* Messages Tab */}
      {activeTab === 'messages' && (
        <MessagesPanel userRole="student" />
      )}

      {/* Gradebook Tab */}
      {activeTab === 'gradebook' && (
        <GradebookPanel userRole="student" studentId={studentInfo.id} />
      )}

      {/* Mastery Tab */}
      {activeTab === 'mastery' && (
        <MasteryPanel userRole="student" studentId={studentInfo.id} />
      )}

      {/* Calendar Tab */}
      {activeTab === 'calendar' && (
        <CalendarPanel userRole="student" />
      )}

      {/* Attendance Tab */}
      {activeTab === 'attendance' && (
        <AttendancePanel userRole="student" studentId={studentInfo.id} />
      )}

      {/* Targets Tab */}
      {activeTab === 'targets' && (
        <TargetsPanel studentId={studentInfo.id} showCreateButton={false} />
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
                  rows={6}
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
                  {studentInfo.name.split(' ').map((n: string) => n[0]).join('')}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{studentInfo.name}</h2>
                  <p className="text-gray-500">Student Profile</p>
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

            {/* Student Information - Only Database Fields */}
            <div className="space-y-4">
              <h3 className="font-semibold text-gray-700 border-b pb-2 mb-4">Student Information</h3>

              <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                <div>
                  <label className="text-xs text-gray-500">Name</label>
                  <p className="text-sm font-medium text-gray-800">{studentInfo.name || 'Not available'}</p>
                </div>

                <div>
                  <label className="text-xs text-gray-500">Email</label>
                  <p className="text-sm font-medium text-gray-800">{studentInfo.email || 'Not available'}</p>
                </div>

                <div>
                  <label className="text-xs text-gray-500">Age</label>
                  <p className="text-sm font-medium text-gray-800">
                    {studentInfo.age ? `${studentInfo.age} years` : 'Not available'}
                  </p>
                </div>

                <div>
                  <label className="text-xs text-gray-500">Grade</label>
                  <p className="text-sm font-medium text-gray-800">{studentInfo.grade || 'Not available'}</p>
                </div>

                <div>
                  <label className="text-xs text-gray-500">Gender</label>
                  <p className="text-sm font-medium text-gray-800 capitalize">
                    {studentInfo.gender || 'Not available'}
                  </p>
                </div>

                <div>
                  <label className="text-xs text-gray-500">Status</label>
                  <p className="text-sm font-medium text-gray-800">
                    <span className={`px-2 py-1 rounded text-xs ${studentInfo.active ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {studentInfo.active ? 'active' : 'inactive'}
                    </span>
                  </p>
                </div>

                <div>
                  <label className="text-xs text-gray-500">Enrollment Date</label>
                  <p className="text-sm font-medium text-gray-800">
                    {studentInfo.enrollmentDate ? new Date(studentInfo.enrollmentDate).toLocaleDateString('en-US', {
                      month: 'numeric',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'Not available'}
                  </p>
                </div>

                <div>
                  <label className="text-xs text-gray-500">Date of Birth</label>
                  <p className="text-sm font-medium text-gray-800">
                    {studentInfo.dob ? new Date(studentInfo.dob).toLocaleDateString('en-US', {
                      month: 'numeric',
                      day: 'numeric',
                      year: 'numeric'
                    }) : 'Not available'}
                  </p>
                </div>

                <div>
                  <label className="text-xs text-gray-500">Phone</label>
                  <p className="text-sm font-medium text-gray-800">{studentInfo.phone || 'Not available'}</p>
                </div>

                <div>
                  <label className="text-xs text-gray-500">Address</label>
                  <p className="text-sm font-medium text-gray-800">{studentInfo.address || 'Not available'}</p>
                </div>

                <div className="col-span-2">
                  <label className="text-xs text-gray-500">Student ID</label>
                  <p className="text-sm font-medium text-gray-800 text-xs break-all">{studentInfo.id || 'Not available'}</p>
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

      {/* Notes Conversation Modal - Popup Overlay */}
      {showNotesModal && selectedHighlightForNotes && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl">
            <NotesPanel
              highlightId={selectedHighlightForNotes}
              mode="modal"
              onClose={() => {
                setShowNotesModal(false);
                setSelectedHighlightForNotes(null);
                // Refresh highlights to update note indicators
                refreshHighlights();
              }}
            />
          </div>
        </div>
      )}

    </div>
  );
}