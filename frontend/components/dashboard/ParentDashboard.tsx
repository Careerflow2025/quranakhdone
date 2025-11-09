'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { useHighlights } from '@/hooks/useHighlights';
import { useHomework } from '@/hooks/useHomework';
import { useAssignments } from '@/hooks/useAssignments';
import { useProgress } from '@/hooks/useProgress';
import { useMastery } from '@/hooks/useMastery';
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
import PenAnnotationCanvas from '@/components/dashboard/PenAnnotationCanvas';
import MessagesPanel from '@/components/messages/MessagesPanel';
import GradebookPanel from '@/components/gradebook/GradebookPanel';
import CalendarPanel from '@/components/calendar/CalendarPanel';
import MasteryPanel from '@/components/mastery/MasteryPanel';
import AssignmentsPanel from '@/components/assignments/AssignmentsPanel';
import AttendancePanel from '@/components/attendance/AttendancePanel';
import ProgressSection from '@/components/dashboard/ProgressSection';
import { useAuthStore } from '@/store/authStore';
import { useParentStudentLinks } from '@/hooks/useParentStudentLinks';
import { supabase } from '@/lib/supabase';
import {
  Star,
  Users,
  Book,
  Mic,
  MicOff,
  Play,
  Pause,
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
  MessageCircle,
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
  BarChart3,
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
  Paperclip,
  Bookmark,
  RefreshCw
} from 'lucide-react';

export default function ParentDashboard() {
  // Auth and API hooks
  const { user } = useAuthStore();
  const { getChildren, isLoading: childrenLoading, error: childrenError } = useParentStudentLinks();

  // Children Info
  const [selectedChild, setSelectedChild] = useState(0);
  const [children, setChildren] = useState<any[]>([]);
  const [parentId, setParentId] = useState<string | null>(null);
  const [isLoadingParent, setIsLoadingParent] = useState(true);

  // Fetch parent_id from user_id
  useEffect(() => {
    async function fetchParentId() {
      if (!user?.id) return;

      try {
        setIsLoadingParent(true);

        // Get current session for authorization
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          console.error('No session found for parent dashboard');
          setIsLoadingParent(false);
          return;
        }

        const response = await fetch(`/api/parents?school_id=${user.schoolId}`, {
          credentials: 'include',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error('Failed to fetch parent data');
        }

        const data = await response.json();

        // Find the parent record that matches the current user
        const parentRecord = data.data?.find((parent: any) => parent.user_id === user.id);

        if (parentRecord) {
          setParentId(parentRecord.id);
        } else {
          console.error('Parent record not found for user:', user.id);
        }
      } catch (error) {
        console.error('Error fetching parent ID:', error);
      } finally {
        setIsLoadingParent(false);
      }
    }

    fetchParentId();
  }, [user?.id, user?.schoolId]);

  // Fetch children when we have parent_id
  useEffect(() => {
    async function fetchChildren() {
      if (!parentId) return;

      const result = await getChildren(parentId);

      if (result.success && result.data) {
        // Transform API data to match the UI expectations
        const transformedChildren = result.data.map((child: any) => ({
          id: child.id,
          user_id: child.user_id || '',
          name: child.name || '',
          gender: child.gender || 'unknown',
          age: child.dob ? calculateAge(child.dob) : 0,
          class: 'Class TBD', // TODO: Fetch from enrollments
          teacherId: 'TCH001', // TODO: Fetch from enrollments
          memorized: '0 Juz', // TODO: Fetch from progress
          revision: '0 Juz', // TODO: Fetch from progress
          lastSession: 'N/A', // TODO: Fetch from activity
          progress: 0, // TODO: Fetch from progress
          memorizedSurahs: 0, // TODO: Fetch from progress
          tajweedScore: 0, // TODO: Fetch from progress
          attendance: 0, // TODO: Fetch from attendance
          currentSurah: 1,
          currentAyah: 1,
          lastPageVisited: 1,
          lastSurahVisited: 1,
          classSchedule: [], // TODO: Fetch from enrollments
          physicalAttendance: 0, // TODO: Fetch from attendance
          platformActivity: 0, // TODO: Fetch from activity
          email: child.email || '',
          active: child.active !== false,
        }));

        console.log('📊 Parent Dashboard - Children loaded:', transformedChildren.length, transformedChildren);
        setChildren(transformedChildren);
      }
    }

    fetchChildren();
  }, [parentId, getChildren]);

  // Helper function to calculate age from date of birth
  function calculateAge(dob: string): number {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }

    return age;
  }

  const currentChild = children[selectedChild] || {
    id: '',
    name: 'No children found',
    gender: 'unknown',
    age: 0,
    class: '',
    teacherId: '',
    memorized: '0 Juz',
    revision: '0 Juz',
    lastSession: 'N/A',
    progress: 0,
    memorizedSurahs: 0,
    tajweedScore: 0,
    attendance: 0,
    currentSurah: 1,
    currentAyah: 1,
    lastPageVisited: 1,
    lastSurahVisited: 1,
    classSchedule: [],
    physicalAttendance: 0,
    platformActivity: 0,
  };

  // Core States
  const [activeTab, setActiveTab] = useState('overview'); // 'overview', 'quran', 'homework', 'assignments', 'progress', 'targets', 'messages'
  const [selectedScript] = useState('uthmani-hafs');
  const [currentSurah, setCurrentSurah] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [quranText, setQuranText] = useState({ surah: '', ayahs: [] });
  const [showChildSelector, setShowChildSelector] = useState(false);

  // Mushaf-specific states (for Student Dashboard Quran View)
  const [currentMushafPage, setCurrentMushafPage] = useState(1);
  const [zoomLevel, setZoomLevel] = useState(100);
  const [showSurahDropdown, setShowSurahDropdown] = useState(false);
  const [surahSearch, setSurahSearch] = useState('');
  const quranContainerRef = useRef<HTMLDivElement>(null);

  // Pen annotation states (read-only for parents)
  const [penMode, setPenMode] = useState(false);
  const [penColor, setPenColor] = useState('#FF0000');
  const [penWidth, setPenWidth] = useState(2);
  const [eraserMode, setEraserMode] = useState(false);

  // Mistake Types for Highlights (Read-only display for parents)
  const mistakeTypes = [
    { id: 'recap', name: 'Recap/Review', color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
    { id: 'homework', name: 'Homework', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700' },
    { id: 'tajweed', name: 'Tajweed', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
    { id: 'haraka', name: 'Haraka', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700' },
    { id: 'letter', name: 'Letter', color: 'brown', bgColor: 'bg-amber-100', textColor: 'text-amber-900' }
  ];

  // Filter States
  const [homeworkSearchTerm, setHomeworkSearchTerm] = useState('');
  const [homeworkStatusFilter, setHomeworkStatusFilter] = useState('all');
  const [assignmentSearchTerm, setAssignmentSearchTerm] = useState('');
  const [assignmentTypeFilter, setAssignmentTypeFilter] = useState('all');

  // Dropdown States
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Get notifications from API
  const {
    notifications: dbNotifications,
    unreadCount,
    isLoading: notificationsLoading,
    markAsRead,
    markAllAsRead,
    refresh: refreshNotifications
  } = useNotifications();

  // Get highlights from database for the selected child
  const {
    highlights: dbHighlights,
    isLoading: highlightsLoading,
    error: highlightsError,
    refreshHighlights
  } = useHighlights(currentChild?.id || null);

  // Highlights filter state (like TeacherDashboard)
  const [highlightsFilter, setHighlightsFilter] = useState('all');

  // Get homework from database for the selected child
  const {
    homeworkList: homeworkData,
    isLoading: homeworkLoading,
    error: homeworkError,
    fetchHomework
  } = useHomework();

  // Get assignments from database for the selected child
  // CRITICAL: Pass currentChild?.id directly (undefined when no child selected)
  // The hook's sync useEffect will update filters when child is selected
  // Don't pass empty string fallback - let hook handle undefined properly
  const {
    assignments,
    isLoading: assignmentsLoading,
    error: assignmentsError
  } = useAssignments(currentChild?.id);

  // Progress Hook - for targets, attendance, study time
  const { progressData, isLoading: isLoadingProgress, fetchProgress } = useProgress();

  // Mastery Hook - for Quran mastery tracking
  const { studentOverview: masteryData, isLoading: isMasteryLoading, fetchStudentMastery } = useMastery(currentChild?.id);

  // Notifications now fetched from API via useNotifications hook (removed mock data)

  // Transform database highlights to UI format
  const [highlights, setHighlights] = useState<any[]>([]);

  // Transform database highlights to UI format for current page (same as Student Dashboard)
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
                  isCompleted: dbHighlight.status === 'gold',
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
                isCompleted: dbHighlight.status === 'gold',
                status: dbHighlight.status,
                isFullAyah: false
              });
            }
          }
        }
      }
    });

    setHighlights(pageHighlights);
  }, [dbHighlights, currentMushafPage, quranText, currentSurah]);

  // Fetch homework when selected child changes
  useEffect(() => {
    if (currentChild?.id) {
      console.log('📚 Fetching homework for child:', currentChild.id);
      fetchHomework({
        student_id: currentChild.id,
        include_completed: true
      });
    }
  }, [currentChild?.id, fetchHomework]);

  // Fetch progress data when selected child changes
  useEffect(() => {
    if (currentChild?.id) {
      console.log('📊 Fetching progress data for child:', currentChild.id);
      fetchProgress(currentChild.id);
    }
  }, [currentChild?.id, fetchProgress]);

  // Fetch mastery data when selected child changes
  useEffect(() => {
    if (currentChild?.id) {
      console.log('📖 Fetching mastery data for child:', currentChild.id);
      fetchStudentMastery(currentChild.id);
    }
  }, [currentChild?.id, fetchStudentMastery]);

  // Load Quran text based on current mushaf page (ADDED from Student Dashboard)
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

      console.log('📖 Loading Quran text (Parent Dashboard):', {
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

          console.log('✅ Quran text loaded successfully (Parent Dashboard):', {
            surah: surahData.name,
            ayahCount: surahData.ayahs.length
          });
        }
      } catch (error) {
        console.error('❌ Error loading Quran text (Parent Dashboard):', error);
      }
    };

    loadQuranText();
  }, [currentMushafPage, selectedScript]);

  // Transform homework data for UI display (same as Student Dashboard)
  const transformedHomework = useMemo(() => {
    console.log('📝 Transforming homework data:', homeworkData?.length || 0, 'items');
    const transformed = (homeworkData || []).map((hw: any) => ({
      id: hw.id,
      studentId: hw.student_id,
      studentName: currentChild?.name || 'Unknown',
      class: currentChild?.class || 'N/A',
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
  }, [homeworkData, currentChild?.name, currentChild?.class]);

  // Safety check for backward compatibility: use highlights if available, otherwise dbHighlights
  const safeHighlights = highlights.length > 0 ? highlights : (dbHighlights || []);

  // OLD Child's Highlights Data (read-only for parent) - REMOVED, using database
  const [oldHighlights] = useState([
    {
      id: 'hl1',
      type: 'homework',
      surah: 1,
      ayahIndex: 2,
      wordIndices: [0, 1],
      color: 'bg-green-200',
      teacherName: 'Ustadh Ahmed',
      teacherNote: 'Practice reciting this verse 5 times daily',
      timestamp: '2 hours ago',
      dueDate: '2024-01-25',
      status: 'pending',
      replies: []
    },
    {
      id: 'hl2',
      type: 'assignment',
      surah: 1,
      ayahIndex: 3,
      wordIndices: [2, 3],
      color: 'bg-orange-200',
      mistakeType: 'tajweed',
      teacherName: 'Ustadh Ahmed',
      teacherNote: 'Pay attention to the madd rule here',
      timestamp: '1 day ago',
      status: 'pending',
      replies: []
    },
    {
      id: 'hl3',
      type: 'homework',
      surah: 2,
      ayahIndex: 1,
      wordIndices: [0, 1, 2],
      color: 'bg-green-200',
      teacherName: 'Ustadh Ahmed',
      teacherNote: 'Memorize these verses by next week',
      timestamp: '3 days ago',
      dueDate: '2024-01-28',
      status: 'in-progress',
      replies: []
    }
  ]);

  // Child's Targets (read-only for parent)
  const [childTargets] = useState([
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
      testsCompleted: 3,
      averageScore: 88
    }
  ]);

  // Messages State
  const [messageTab, setMessageTab] = useState('inbox');
  const [showComposeModal, setShowComposeModal] = useState(false);
  const [composeSubject, setComposeSubject] = useState('');
  const [composeMessage, setComposeMessage] = useState('');
  const [messages, setMessages] = useState({
    inbox: [
      {
        id: 1,
        from: 'Ustadh Ahmed',
        subject: 'Ahmed\'s Progress Update',
        preview: 'Your son has made excellent progress in memorizing Surah Al-Mulk...',
        time: '2 hours ago',
        unread: true
      },
      {
        id: 2,
        from: 'School Admin',
        subject: 'Parent-Teacher Meeting Next Week',
        preview: 'We would like to invite you to discuss your children\'s progress...',
        time: '1 day ago',
        unread: false
      }
    ],
    sent: [
      {
        id: 3,
        to: 'Ustadh Ahmed',
        subject: 'Question about homework',
        preview: 'I wanted to ask about the homework assigned to Ahmed...',
        time: '3 days ago'
      }
    ],
    archive: []
  });

  // UI States
  const [showNoteDetail, setShowNoteDetail] = useState<any>(null);

  // Conversation Modal States
  const [selectedHighlightForNotes, setSelectedHighlightForNotes] = useState<string | null>(null);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [conversationData, setConversationData] = useState<any>(null);

  const AYAHS_PER_PAGE = 10;
  const allSurahs = surahList;

  // Handle click outside to close dropdowns
  useEffect(() => {
    const handleClickOutside = (event: any) => {
      if (showSurahDropdown && !event.target.closest('.surah-dropdown-container')) {
        setShowSurahDropdown(false);
      }
      if (showChildSelector && !event.target.closest('.child-selector-container')) {
        setShowChildSelector(false);
      }
      if (showNotifications && !event.target.closest('.notifications-container')) {
        setShowNotifications(false);
      }
      if (showProfileDropdown && !event.target.closest('.profile-dropdown-container')) {
        setShowProfileDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showSurahDropdown, showChildSelector, showNotifications, showProfileDropdown]);

  // Load Quran text based on current mushaf page - EXACT COPY FROM STUDENT DASHBOARD
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

  // Load conversation data when highlight is selected
  useEffect(() => {
    if (selectedHighlightForNotes && dbHighlights) {
      console.log('💬 Loading conversation for highlight:', selectedHighlightForNotes);

      // Find the highlight in dbHighlights by ID
      const highlightWithNotes = dbHighlights.find((h: any) => h.id === selectedHighlightForNotes);

      if (highlightWithNotes) {
        console.log('📝 Found highlight with notes:', highlightWithNotes);

        // Get the highlighted text from quranText
        let highlightedText = '';
        if (quranText && quranText.ayahs && quranText.ayahs.length > 0) {
          const ayahIndex = highlightWithNotes.ayah_start - 1;
          const ayah = quranText.ayahs[ayahIndex];

          if (ayah) {
            if (highlightWithNotes.word_start !== null && highlightWithNotes.word_end !== null) {
              // Word-level highlight - extract specific words
              const words = ayah.words || ayah.text.split(' ');
              const selectedWords = words.slice(
                highlightWithNotes.word_start,
                highlightWithNotes.word_end + 1
              );

              // If words are objects with text property, extract text; otherwise join strings
              if (Array.isArray(selectedWords) && selectedWords.length > 0) {
                if (typeof selectedWords[0] === 'object' && selectedWords[0] !== null) {
                  // Words are objects - extract text property from each
                  highlightedText = selectedWords.map((w: any) => w.text || w).join(' ');
                } else {
                  // Words are strings
                  highlightedText = selectedWords.join(' ');
                }
              } else {
                highlightedText = String(selectedWords);
              }
            } else {
              // Full ayah highlight
              highlightedText = ayah.text;
            }
          }
        }

        // Structure the conversation data
        const conversation = {
          id: highlightWithNotes.id,
          surah: highlightWithNotes.surah,
          ayah: highlightWithNotes.ayah_start,
          wordRange: highlightWithNotes.word_start !== null && highlightWithNotes.word_end !== null
            ? `Words ${highlightWithNotes.word_start}-${highlightWithNotes.word_end}`
            : 'Full Ayah',
          mistakeType: highlightWithNotes.type || 'Note',
          color: highlightWithNotes.color,
          createdAt: highlightWithNotes.created_at,
          highlightedText: highlightedText,
          notes: highlightWithNotes.notes || []
        };

        setConversationData(conversation);
        console.log('✅ Conversation data loaded:', conversation);
      } else {
        console.error('❌ Highlight not found in dbHighlights');
      }
    }
  }, [selectedHighlightForNotes, dbHighlights, quranText]);

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

  const handleSendMessage = () => {
    if (composeSubject.trim() && composeMessage.trim()) {
      const newMessage = {
        id: Date.now(),
        to: 'Ustadh Ahmed',
        subject: composeSubject,
        message: composeMessage,
        time: 'Just now'
      };

      setMessages((prev: any) => ({
        ...prev,
        sent: [newMessage, ...prev.sent]
      }));

      setComposeSubject('');
      setComposeMessage('');
      setShowComposeModal(false);
      setMessageTab('sent');
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
      {/* Professional Header */}
      <div className="bg-white shadow-sm border-b sticky top-0 z-40">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between relative">
            {/* Left Side - Logo, Title & Child Selector */}
            <div className="flex items-center space-x-6">
              <div className="flex items-center space-x-4">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <BookOpen className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-gray-900">
                    Parent Dashboard
                  </h1>
                  <p className="text-xs text-gray-500 mt-0.5">QuranLearning Academy</p>
                </div>
              </div>

              {/* Child Selector - Simplified */}
              <div className="relative child-selector-container">
                <button
                  onClick={() => {
                    console.log('🔘 Child selector clicked. Current state:', showChildSelector, 'Children:', children.length);
                    setShowChildSelector(!showChildSelector);
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 rounded-xl transition-all duration-200 border border-blue-200 shadow-sm hover:shadow-md"
                >
                  <span className="font-semibold text-gray-900">{currentChild.name}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-600 transition-transform ${showChildSelector ? 'rotate-180' : ''}`} />
                </button>

                {showChildSelector && (
                  <div className="absolute top-full mt-2 w-full bg-white rounded-xl shadow-2xl border border-gray-200 z-50 overflow-hidden">
                    <div className="bg-gradient-to-r from-blue-500 to-indigo-500 px-4 py-3">
                      <h3 className="text-white font-semibold">Select Child to Monitor</h3>
                      <p className="text-blue-100 text-xs mt-0.5">Click to switch between your children</p>
                    </div>
                    <div className="p-2 max-h-80 overflow-y-auto">
                      {children.map((child: any, index: any) => (
                        <button
                          key={child.id}
                          onClick={() => {
                            console.log('👶 Selecting child:', index, child.name);
                            setSelectedChild(index);
                            setShowChildSelector(false);
                          }}
                          className={`w-full text-left p-3 rounded-lg mb-1 transition-all duration-200 ${
                            selectedChild === index
                              ? 'bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 shadow-sm'
                              : 'hover:bg-gray-50 border-2 border-transparent'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <p className="font-semibold text-gray-900">{child.name}</p>
                              {selectedChild === index && (
                                <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs rounded-full font-medium">
                                  Active
                                </span>
                              )}
                            </div>
                            {selectedChild === index && (
                              <Check className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Center - QuranAkh Logo */}
            <div className="absolute left-1/2 transform -translate-x-1/2 flex items-center justify-center pointer-events-none">
              <img
                src="/quranakh-logo.png"
                alt="QuranAkh Logo"
                className="w-12 h-12 object-contain"
              />
            </div>

            {/* Right Side - Notifications & Profile */}
            <div className="flex items-center space-x-3">
              {/* Notifications */}
              <div className="relative notifications-container">
                <button
                  onClick={() => setShowNotifications(!showNotifications)}
                  className="p-2.5 hover:bg-gray-100 rounded-xl relative transition-colors"
                >
                  <Bell className="w-5 h-5 text-gray-700" />
                  {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 transform translate-x-1/2 -translate-y-1/2 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
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
                                  {notifType.includes('message') && <MessageSquare className="w-4 h-4 text-pink-600" />}
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

              {/* Profile */}
              <div className="relative profile-dropdown-container">
                <button
                  onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                  className="flex items-center space-x-2 px-3 py-2 hover:bg-gray-100 rounded-xl transition-colors"
                >
                  <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-indigo-600 rounded-full flex items-center justify-center">
                    <User className="w-4 h-4 text-white" />
                  </div>
                  <div className="hidden md:block text-left">
                    <p className="text-sm font-medium text-gray-900">Parent Account</p>
                    <p className="text-xs text-gray-500">{user?.fullName || user?.email || 'Parent'}</p>
                  </div>
                  <ChevronDown className="w-4 h-4 text-gray-600" />
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
                      <span>Parent Profile</span>
                    </button>
                    <hr className="my-1" />
                    <button
                      onClick={async () => {
                        await supabase.auth.signOut();
                        window.location.href = '/login';
                      }}
                      className="w-full px-4 py-2 text-left hover:bg-gray-50 flex items-center space-x-2 text-red-600"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Logout</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b shadow-sm">
        <div className="flex justify-center overflow-x-auto">
          <nav className="flex space-x-2 py-1 px-4">
            <button
              onClick={() => setActiveTab('overview')}
              className={`relative py-3 px-4 font-medium text-sm rounded-lg transition-all duration-200 whitespace-nowrap ${
                activeTab === 'overview'
                  ? 'text-white bg-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>Overview</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('quran')}
              className={`relative py-3 px-4 font-medium text-sm rounded-lg transition-all duration-200 whitespace-nowrap ${
                activeTab === 'quran'
                  ? 'text-white bg-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>Quran View</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('homework')}
              className={`relative py-3 px-4 font-medium text-sm rounded-lg transition-all duration-200 whitespace-nowrap ${
                activeTab === 'homework'
                  ? 'text-white bg-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <BookOpen className="w-4 h-4" />
                <span>Homework</span>
                {highlights.filter((h: any) => h.type === 'homework').length > 0 && (
                  <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {highlights.filter((h: any) => h.type === 'homework').length}
                  </span>
                )}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('highlights')}
              className={`relative py-3 px-4 font-medium text-sm rounded-lg transition-all duration-200 whitespace-nowrap ${
                activeTab === 'highlights'
                  ? 'text-white bg-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <Bookmark className="w-4 h-4" />
                <span>Highlights</span>
                {highlights.length > 0 && (
                  <span className="bg-purple-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {highlights.length}
                  </span>
                )}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('assignments')}
              className={`relative py-3 px-4 font-medium text-sm rounded-lg transition-all duration-200 whitespace-nowrap ${
                activeTab === 'assignments'
                  ? 'text-white bg-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>Assignments</span>
                {highlights.filter((h: any) => h.type === 'assignment').length > 0 && (
                  <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {highlights.filter((h: any) => h.type === 'assignment').length}
                  </span>
                )}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('progress')}
              className={`relative py-3 px-4 font-medium text-sm rounded-lg transition-all duration-200 whitespace-nowrap ${
                activeTab === 'progress'
                  ? 'text-white bg-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4" />
                <span>Progress</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('gradebook')}
              className={`relative py-3 px-4 font-medium text-sm rounded-lg transition-all duration-200 whitespace-nowrap ${
                activeTab === 'gradebook'
                  ? 'text-white bg-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <Award className="w-4 h-4" />
                <span>Gradebook</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('mastery')}
              className={`relative py-3 px-4 font-medium text-sm rounded-lg transition-all duration-200 whitespace-nowrap ${
                activeTab === 'mastery'
                  ? 'text-white bg-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Mastery</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('calendar')}
              className={`relative py-3 px-4 font-medium text-sm rounded-lg transition-all duration-200 whitespace-nowrap ${
                activeTab === 'calendar'
                  ? 'text-white bg-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <CalendarIcon className="w-4 h-4" />
                <span>Calendar</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`relative py-3 px-4 font-medium text-sm rounded-lg transition-all duration-200 whitespace-nowrap ${
                activeTab === 'attendance'
                  ? 'text-white bg-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <Clock className="w-4 h-4" />
                <span>Attendance</span>
              </span>
            </button>

            <button
              onClick={() => setActiveTab('targets')}
              className={`relative py-3 px-4 font-medium text-sm rounded-lg transition-all duration-200 whitespace-nowrap ${
                activeTab === 'targets'
                  ? 'text-white bg-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <Target className="w-4 h-4" />
                <span>Targets</span>
                {childTargets.filter((t: any) => t.status === 'active').length > 0 && (
                  <span className="bg-yellow-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {childTargets.filter((t: any) => t.status === 'active').length}
                  </span>
                )}
              </span>
            </button>

            <button
              onClick={() => setActiveTab('messages')}
              className={`relative py-3 px-4 font-medium text-sm rounded-lg transition-all duration-200 whitespace-nowrap ${
                activeTab === 'messages'
                  ? 'text-white bg-blue-600 shadow-sm'
                  : 'text-gray-600 hover:text-blue-600 hover:bg-blue-50'
              }`}
            >
              <span className="flex items-center space-x-2">
                <Mail className="w-4 h-4" />
                <span>Messages</span>
                {messages.inbox.filter((m: any) => m.unread).length > 0 && (
                  <span className="bg-red-500 text-white text-xs px-1.5 py-0.5 rounded-full">
                    {messages.inbox.filter((m: any) => m.unread).length}
                  </span>
                )}
              </span>
            </button>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 sm:px-6 lg:px-12 py-6">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Child Overview Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold mb-1">{currentChild.name}'s Learning Journey</h2>
                  <p className="text-blue-100">Performance Overview • {currentChild.class}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-blue-100">Last Active</p>
                  <p className="text-lg font-semibold">{currentChild.lastSession}</p>
                </div>
              </div>
            </div>

            {/* Enhanced Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-green-600 rounded-xl flex items-center justify-center shadow-lg">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full font-medium">+5% this week</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Overall Progress</p>
                  <p className="text-3xl font-bold text-gray-900">{currentChild.progress}%</p>
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-green-400 to-green-600 h-2 rounded-full" style={{width: `${currentChild.progress}%`}}></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-blue-600 bg-blue-100 px-2 py-1 rounded-full font-medium">Active</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Memorization</p>
                  <p className="text-3xl font-bold text-gray-900">{currentChild.memorizedSurahs}</p>
                  <p className="text-xs text-gray-500 mt-1">Surahs Completed</p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-purple-400 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Award className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full font-medium">Excellent</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tajweed Score</p>
                  <p className="text-3xl font-bold text-gray-900">{currentChild.tajweedScore}%</p>
                  <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full" style={{width: `${currentChild.tajweedScore}%`}}></div>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-orange-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Calendar className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xs text-orange-600 bg-orange-100 px-2 py-1 rounded-full font-medium">This Month</span>
                </div>
                <div>
                  <p className="text-sm text-gray-600 mb-1">Attendance Rate</p>
                  <p className="text-3xl font-bold text-gray-900">{currentChild.attendance}%</p>
                  <p className="text-xs text-gray-500 mt-1">Physical: {currentChild.physicalAttendance}%</p>
                </div>
              </div>
            </div>

            {/* Two Column Layout for Activity and Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Recent Activity */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                  <button className="text-sm text-blue-600 hover:text-blue-700 font-medium">View All</button>
                </div>
                <div className="space-y-3">
                  <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-200">
                    <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <Check className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Completed Surah Al-Mulk</p>
                      <p className="text-sm text-gray-600 mt-0.5">Memorization milestone achieved</p>
                      <p className="text-xs text-gray-500 mt-2">2 hours ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200">
                    <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <BookOpen className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Revision Session</p>
                      <p className="text-sm text-gray-600 mt-0.5">Juz 29 - 45 minutes practice</p>
                      <p className="text-xs text-gray-500 mt-2">1 day ago</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3 p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-xl border border-orange-200">
                    <div className="w-10 h-10 bg-orange-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold text-gray-900">Homework Assigned</p>
                      <p className="text-sm text-gray-600 mt-0.5">Practice Surah Al-Qalam with tajweed</p>
                      <p className="text-xs text-gray-500 mt-2">2 days ago</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Weekly Performance */}
              <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-bold text-gray-900">Weekly Performance</h2>
                  <select className="text-sm border border-gray-200 rounded-lg px-3 py-1">
                    <option>This Week</option>
                    <option>Last Week</option>
                    <option>Last Month</option>
                  </select>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Practice Time</span>
                      <span className="text-sm font-bold text-gray-900">5h 30m</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-blue-500 to-indigo-500 h-2 rounded-full" style={{width: '75%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Homework Completion</span>
                      <span className="text-sm font-bold text-gray-900">4/5 Tasks</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full" style={{width: '80%'}}></div>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">Class Participation</span>
                      <span className="text-sm font-bold text-gray-900">Excellent</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full" style={{width: '90%'}}></div>
                    </div>
                  </div>
                  <div className="pt-4 border-t">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Teacher's Note</span>
                      <span className="text-xs text-gray-500">Yesterday</span>
                    </div>
                    <p className="text-sm text-gray-700 mt-2 italic">"Excellent progress this week! Keep up the good work with daily practice."</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Quran View Tab (Read-only) - Full Mushaf Implementation */}
        {activeTab === 'quran' && (
          <>
            {/* Context Banner - Show which child's Quran is being viewed */}
            {currentChild && (
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg p-4 mb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <UserCircle className="w-8 h-8" />
                    <div>
                      <h3 className="font-semibold">{currentChild.name}'s Quran Progress</h3>
                      <p className="text-sm text-blue-100">
                        Viewing Quran highlights and teacher annotations (Read-only)
                      </p>
                    </div>
                  </div>
                  <Eye className="w-6 h-6" />
                </div>
              </div>
            )}

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
                    const typeHighlights = safeHighlights.filter((h: any) => h.mistakeType === type.id && !h.isCompleted);
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
                {currentChild && currentChild.teacherId && selectedScript && (
                  <PenAnnotationCanvas
                    studentId={currentChild.id}
                    teacherId={currentChild.teacherId}
                    pageNumber={currentMushafPage}
                    scriptId={selectedScript}
                    enabled={false}
                    containerRef={quranContainerRef}
                    penColor={penColor}
                    setPenColor={setPenColor}
                    penWidth={penWidth}
                    setPenWidth={setPenWidth}
                    eraserMode={eraserMode}
                    setEraserMode={setEraserMode}
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

                    // Determine which ayahs to show based on real mushaf page - EXACT COPY FROM STUDENT DASHBOARD
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
                          const ayahIndex = quranText.ayahs.indexOf(ayah);
                          return (
                            <span key={ayah.number} className="inline relative group">
                      {ayah.words.map((word: any, wordIndex: any) => {
                        // Extract word text - handle both string and object formats
                        const wordText = typeof word === 'string' ? word : (word.text || word);

                        // Get ALL highlights for this word (multiple colors allowed)
                        const wordHighlights = safeHighlights.filter(
                          (h: any) => h.ayahIndex === ayahIndex && h.wordIndex === wordIndex
                        );

                        // Check if any highlight is completed and get appropriate colors
                        const mistakes = wordHighlights.map((h: any) => {
                          // If highlight is marked as completed, show gold color
                          if (h.isCompleted) {
                            return { id: 'completed', name: 'Completed', color: 'gold', bgColor: 'bg-yellow-400', textColor: 'text-yellow-900' };
                          }
                          // Otherwise show the original mistake color
                          return mistakeTypes.find((m: any) => m.id === h.mistakeType);
                        }).filter(Boolean);

                        return (
                          <span
                            key={`${ayahIndex}-${wordIndex}`}
                            onClick={() => {
                              // READ-ONLY: Only allow viewing notes, no highlighting
                              if (wordHighlights.length > 0) {
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
                              ...(mistakes.length === 1 ? {
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
                              } : {})
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
                          );
                        })}
                      </div>
                    );
                  })()}
                  </div>
                </div>
                </div>

                {/* Page Navigation - OUTSIDE pointerEvents:none container */}
                <div className="mt-2 border-t pt-2">
                  <div className="flex items-center justify-center gap-4">
                    {(() => {
                      // Get current page content to determine Surah
                      const currentPageContent = getPageContent(currentMushafPage);
                      const currentSurahNumber = currentPageContent?.surahStart || 1;

                      // For parent dashboard: allow navigation through ALL 604 pages
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
                          <div className="text-center">
                            <span className="text-sm font-semibold text-gray-700">
                              Page {currentMushafPage} of {lastPage} (Surah {currentSurahNumber})
                            </span>
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

            {/* Right Panel - Controls */}
            <div className="col-span-2 space-y-3">
              {/* Surah Selector - EXACT COPY FROM STUDENT DASHBOARD */}
              <div className="relative surah-dropdown-container">
                <button
                  onClick={() => setShowSurahDropdown(!showSurahDropdown)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition w-full justify-center"
                >
                  <BookOpen className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-700">Change Surah</span>
                  <ChevronDown className={`w-4 h-4 text-green-600 transition-transform ${showSurahDropdown ? 'rotate-180' : ''}`} />
                </button>

                {showSurahDropdown && (
                  <div className="absolute right-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white rounded-lg shadow-xl border z-50">
                    <div className="p-2">
                      {surahList.map((surah: any) => (
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
            </div>
          </div>
          </>
        )}

        {/* Homework Tab (Database-linked, Read-only for Parent) */}
        {activeTab === 'homework' && (
          <div className="space-y-6">
            {/* Header */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold flex items-center">
                  <BookOpen className="w-6 h-6 mr-2 text-green-600" />
                  {currentChild.name}'s Homework
                  <span className="ml-3 bg-green-100 text-green-700 text-sm px-2 py-1 rounded-full">
                    {transformedHomework.length} Total
                  </span>
                </h2>
                <div className="bg-yellow-50 px-4 py-2 rounded-lg">
                  <Eye className="w-4 h-4 inline mr-2 text-yellow-600" />
                  <span className="text-sm text-yellow-700">View Only Mode</span>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center space-x-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search homework..."
                    value={homeworkSearchTerm}
                    onChange={(e) => setHomeworkSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg"
                  />
                </div>
                <select
                  value={homeworkStatusFilter}
                  onChange={(e) => setHomeworkStatusFilter(e.target.value)}
                  className="px-4 py-2 border border-gray-200 rounded-lg"
                >
                  <option value="all">All</option>
                  <option value="pending">Pending</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
            </div>

            {/* Loading State */}
            {homeworkLoading && (
              <div className="text-center py-12">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
                <p className="mt-2 text-gray-500">Loading homework...</p>
              </div>
            )}

            {/* Error State */}
            {homeworkError && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <p className="text-red-700">Error loading homework: {homeworkError}</p>
              </div>
            )}

            {/* Empty State */}
            {!homeworkLoading && !homeworkError && transformedHomework.length === 0 && (
              <div className="text-center py-12">
                <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 text-lg">No homework assigned yet</p>
              </div>
            )}

            {/* Homework Cards */}
            {!homeworkLoading && !homeworkError && transformedHomework.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
                {transformedHomework
                  .filter((homework: any) => {
                    // Status filter
                    if (homeworkStatusFilter !== 'all' && homework.status !== homeworkStatusFilter) return false;

                    // Search filter
                    if (homeworkSearchTerm) {
                      const searchLower = homeworkSearchTerm.toLowerCase();
                      return homework.surah.toLowerCase().includes(searchLower) ||
                             homework.ayahRange.toLowerCase().includes(searchLower) ||
                             homework.note.toLowerCase().includes(searchLower);
                    }

                    return true;
                  })
                  .map((homework: any) => (
                    <div key={homework.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                      {/* Color-coded header - Yellow for completed, Green for pending */}
                      <div className={`h-2 ${
                        homework.color === 'gold' ? 'bg-gradient-to-r from-yellow-400 to-yellow-500' :
                        'bg-gradient-to-r from-green-500 to-emerald-500'
                      }`}></div>

                      <div className="p-5">
                        {/* Surah and Ayah */}
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {homework.surah}
                            </h3>
                            <p className="text-sm text-gray-500">Ayah {homework.ayahRange}</p>
                          </div>
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            homework.color === 'gold'
                              ? 'bg-yellow-100 text-yellow-700 border border-yellow-200'
                              : 'bg-green-100 text-green-700 border border-green-200'
                          }`}>
                            {homework.status === 'completed' ? '✓ Completed' : 'Pending'}
                          </span>
                        </div>

                        {/* Note */}
                        {homework.note && (
                          <p className="text-gray-700 text-sm mb-4 line-clamp-2">{homework.note}</p>
                        )}

                        {/* Metadata */}
                        <div className="space-y-2 text-xs text-gray-500 mb-4">
                          <div className="flex justify-between items-center">
                            <span className="flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              Assigned
                            </span>
                            <span className="font-medium text-gray-700">{homework.assignedDate}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              Due
                            </span>
                            <span className="font-medium text-gray-700">{homework.dueDate}</span>
                          </div>
                          {homework.replies > 0 && (
                            <div className="flex justify-between items-center">
                              <span className="flex items-center">
                                <MessageCircle className="w-3 h-3 mr-1" />
                                Replies
                              </span>
                              <span className="font-medium text-gray-700">{homework.replies}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Assignments Tab - Database-linked (EXACT Student Dashboard implementation) */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            {/* DEBUG LOGGING */}
            {console.log('🔍 PARENT DASHBOARD ASSIGNMENTS DEBUG:', {
              currentChildId: currentChild?.id,
              currentChildName: currentChild?.name,
              totalAssignments: assignments?.length || 0,
              assignmentsLoading,
              assignmentsError,
              firstThreeAssignments: assignments?.slice(0, 3).map(a => ({
                id: a.id,
                title: a.title,
                status: a.status,
                hasHighlight: !!a.highlight,
                highlightColor: a.highlight?.color,
                isGold: a.highlight?.color === 'gold'
              }))
            })}

            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
              <div>
                <h2 className="text-2xl font-bold flex items-center">
                  <FileText className="w-7 h-7 mr-3" />
                  {currentChild.name}'s Assignments
                </h2>
                <p className="text-blue-100 mt-1">View your child's assignments from teachers (Read-only)</p>
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
                  {assignmentSearchTerm ? 'Try a different search term' : 'Your child will have assignments assigned by teachers'}
                </p>
              </div>
            )}
          </div>
        )}


        {/* Progress Tab - Using ProgressSection Component (SAME AS STUDENT DASHBOARD) */}
        {activeTab === 'progress' && (
          !currentChild?.id ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <TrendingUp className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No child selected</p>
              <p className="text-gray-400 text-sm mt-1">Please select a child to view their progress</p>
            </div>
          ) : (
            <ProgressSection
              progressData={progressData}
              isLoading={isLoadingProgress}
              assignments={assignments}
              homeworkData={transformedHomework}
              studentId={currentChild.id}
              masteryData={masteryData}
              masteryLoading={isMasteryLoading}
            />
          )
        )}

        {/* Gradebook Tab - Using GradebookPanel Component (SAME AS STUDENT DASHBOARD) */}
        {activeTab === 'gradebook' && (
          !currentChild?.id ? (
            <div className="text-center py-12 bg-white rounded-xl">
              <Award className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 text-lg">No child selected</p>
              <p className="text-gray-400 text-sm mt-1">Please select a child to view their gradebook</p>
            </div>
          ) : (
            <GradebookPanel
              userRole="parent"
              studentId={currentChild.id}
            />
          )
        )}

        {/* Mastery Tab */}
        {activeTab === 'mastery' && (
          <MasteryPanel userRole="parent" studentId={children[selectedChild].id} />
        )}

        {/* Calendar Tab */}
        {activeTab === 'calendar' && (
          <CalendarPanel userRole="parent" />
        )}

        {/* Attendance Tab */}
        {activeTab === 'attendance' && (
          <AttendancePanel userRole="parent" studentId={children[selectedChild].id} />
        )}

        {/* Targets Tab (Read-only) */}
        {activeTab === 'targets' && (
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold flex items-center">
                  <Target className="w-7 h-7 mr-3 text-yellow-600" />
                  {currentChild.name}'s Learning Targets
                </h2>
                <div className="bg-yellow-50 px-4 py-2 rounded-lg">
                  <Eye className="w-4 h-4 inline mr-2 text-yellow-600" />
                  <span className="text-sm text-yellow-700">Parent View</span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Average Progress</p>
                      <p className="text-2xl font-bold text-green-700">
                        {Math.round(childTargets.reduce((acc: any, t: any) => acc + t.progress, 0) / childTargets.length)}%
                      </p>
                    </div>
                    <TrendingUp className="w-8 h-8 text-green-600" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">Active Targets</p>
                      <p className="text-2xl font-bold text-blue-700">
                        {childTargets.filter((t: any) => t.status === 'active').length}
                      </p>
                    </div>
                    <Target className="w-8 h-8 text-blue-600" />
                  </div>
                </div>
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">This Week</p>
                      <p className="text-2xl font-bold text-purple-700">2</p>
                    </div>
                    <Award className="w-8 h-8 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Targets List */}
            <div className="space-y-4">
              {childTargets.map((target: any) => (
                <div key={target.id} className="bg-white rounded-xl shadow-sm overflow-hidden">
                  <div className={`h-2 ${
                    target.type === 'individual' ? 'bg-gradient-to-r from-yellow-400 to-orange-400' :
                    'bg-gradient-to-r from-blue-400 to-indigo-400'
                  }`} />
                  <div className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-lg font-semibold">{target.title}</h3>
                        <p className="text-gray-600 text-sm mt-1">{target.description}</p>
                        <div className="flex items-center space-x-4 mt-3 text-sm text-gray-500">
                          <span>Assigned by {target.assignedBy}</span>
                          <span>Due: {target.dueDate}</span>
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="relative w-20 h-20">
                          <svg width="80" height="80" className="transform -rotate-90">
                            <circle cx="40" cy="40" r="36" stroke="#e5e7eb" strokeWidth="8" fill="none" />
                            <circle
                              cx="40" cy="40" r="36"
                              stroke={target.progress >= 75 ? '#10b981' : target.progress >= 50 ? '#f59e0b' : '#ef4444'}
                              strokeWidth="8"
                              fill="none"
                              strokeDasharray={`${target.progress * 2.26} 226`}
                              strokeLinecap="round"
                            />
                          </svg>
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-xl font-bold">{target.progress}%</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {target.milestones && (
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium text-gray-700 mb-2">Milestones</p>
                        <div className="space-y-2">
                          {target.milestones.map((milestone: any) => (
                            <div key={milestone.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                              <div className="flex items-center space-x-2">
                                {milestone.completed ? (
                                  <Check className="w-4 h-4 text-green-600" />
                                ) : (
                                  <Clock className="w-4 h-4 text-gray-400" />
                                )}
                                <span className={`text-sm ${milestone.completed ? 'line-through text-gray-500' : ''}`}>
                                  {milestone.name}
                                </span>
                              </div>
                              <span className="text-xs text-gray-500">{milestone.date}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Highlights Tab (Read-only) - EXACT Teacher Dashboard implementation */}
        {activeTab === 'highlights' && (
          <div className="space-y-6">
            {/* Header with Stats */}
            <div className="bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl shadow-lg p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center">
                    <Bookmark className="w-7 h-7 mr-3" />
                    {currentChild.name}'s Highlights
                  </h2>
                  <p className="text-purple-100 mt-1">View Quran highlights created by teachers for your child (Read-only)</p>
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
                  <p className="text-2xl font-bold">{(dbHighlights || []).length}</p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <p className="text-purple-100 text-sm">Homework (Green)</p>
                  <p className="text-2xl font-bold text-green-200">
                    {(dbHighlights || []).filter((h: any) => h.type === 'homework' && !h.completed_at).length}
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <p className="text-purple-100 text-sm">Recap (Purple)</p>
                  <p className="text-2xl font-bold text-purple-200">
                    {(dbHighlights || []).filter((h: any) => h.type === 'recap' && !h.completed_at).length}
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <p className="text-purple-100 text-sm">Tajweed (Orange)</p>
                  <p className="text-2xl font-bold text-orange-200">
                    {(dbHighlights || []).filter((h: any) => h.type === 'tajweed' && !h.completed_at).length}
                  </p>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4">
                  <p className="text-purple-100 text-sm">Completed (Gold)</p>
                  <p className="text-2xl font-bold text-yellow-200">
                    {(dbHighlights || []).filter((h: any) => h.completed_at !== null).length}
                  </p>
                </div>
              </div>
            </div>

            {/* Filter Bar (Type Filter Only - no student filter needed for parent view) */}
            <div className="bg-white rounded-lg shadow-sm p-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

            {/* Highlights Display - Direct Grid (no student grouping for parent view) */}
            {!highlightsLoading && !highlightsError && (() => {
              // Filter highlights
              const filteredHighlights = (dbHighlights || []).filter((h: any) => {
                // Type filter
                if (highlightsFilter === 'completed') {
                  return h.completed_at !== null;
                } else if (highlightsFilter !== 'all') {
                  return h.type === highlightsFilter && h.completed_at === null;
                }

                return true;
              });

              if (filteredHighlights.length === 0) {
                return (
                  <div className="text-center py-12 bg-white rounded-xl">
                    <Bookmark className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500 text-lg">No highlights found</p>
                    <p className="text-gray-400 text-sm mt-1">
                      Teachers create highlights to help your child learn and memorize
                    </p>
                  </div>
                );
              }

              return (
                <div className="bg-white rounded-xl shadow-md overflow-hidden">
                  {/* Child Header */}
                  <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4 text-white">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="bg-white bg-opacity-20 p-2 rounded-lg">
                          <User className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold">{currentChild.name}</h3>
                          <p className="text-sm text-blue-100">{currentChild.email || 'Student'}</p>
                        </div>
                      </div>
                      <span className="bg-white bg-opacity-20 px-4 py-2 rounded-lg font-semibold">
                        {filteredHighlights.length} highlights
                      </span>
                    </div>
                  </div>

                  {/* Highlights Grid */}
                  <div className="p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredHighlights.map((highlight: any) => {
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
              );
            })()}
          </div>
        )}

        {/* Messages Tab */}
        {activeTab === 'messages' && (
          <MessagesPanel userRole="parent" />
        )}
      </div>

      {/* Enhanced Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-black bg-opacity-60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden animate-fadeIn">
            {/* Modal Header with Gradient */}
            <div className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-white">Parent Account Settings</h3>
                  <p className="text-purple-100 text-sm mt-1">Manage your profile and monitor your children's progress</p>
                </div>
                <button
                  onClick={() => setShowProfileModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-xl p-2.5 transition-all duration-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Content with Scroll */}
            <div className="overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="p-6 lg:p-8 space-y-8">
                {/* Profile Header Section - Simplified */}
                <div className="pb-6 border-b">
                  <h2 className="text-2xl font-bold text-gray-900">{user?.fullName || 'Parent'}</h2>
                  <p className="text-gray-600 mt-1">Parent Account • {user?.email}</p>
                  <div className="flex flex-wrap gap-3 mt-3">
                    <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                      {children.length} {children.length === 1 ? 'Child' : 'Children'} Enrolled
                    </span>
                  </div>
                </div>

                {/* Personal Information Section */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <User className="w-5 h-5 mr-2 text-indigo-600" />
                    Personal Information
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input
                        type="text"
                        value={user?.fullName || ''}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                        placeholder="Not set"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                      <input
                        type="email"
                        value={user?.email || ''}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                        placeholder="Not set"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">User ID</label>
                      <input
                        type="text"
                        value={user?.id || ''}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600 font-mono text-xs"
                        placeholder="Not available"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Role</label>
                      <input
                        type="text"
                        value={user?.role || 'Parent'}
                        readOnly
                        className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-600"
                      />
                    </div>
                  </div>
                </div>

                {/* Linked Children Section */}
                <div>
                  <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-indigo-600" />
                    Linked Children
                  </h3>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {children.map((child: any) => (
                      <div key={child.id} className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <p className="font-bold text-gray-900">{child.name}</p>
                            <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                              Active
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Notes Conversation Modal - Read-Only for Parents */}
      {showNotesModal && conversationData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center">
                  <MessageCircle className="w-6 h-6 mr-2" />
                  Conversation Thread
                </h3>
                <p className="text-indigo-100 text-sm mt-1">
                  Surah {conversationData.surah}, Ayah {conversationData.ayah} • {conversationData.wordRange}
                </p>
              </div>
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setSelectedHighlightForNotes(null);
                  setConversationData(null);
                }}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-lg p-2 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* View Only Badge */}
            <div className="bg-yellow-50 px-6 py-3 border-b border-yellow-100">
              <div className="flex items-center text-yellow-700">
                <Eye className="w-4 h-4 mr-2" />
                <span className="text-sm font-medium">View Only Mode - You cannot reply to this conversation</span>
              </div>
            </div>

            {/* Modal Body - Conversation Thread */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {/* Original Highlighted Text */}
              {conversationData.highlightedText && (
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-5 mb-6 border border-gray-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <Highlighter className="w-4 h-4 text-gray-600" />
                      <span className="text-xs font-semibold text-gray-600 uppercase tracking-wide">
                        Original Highlight
                      </span>
                    </div>
                    <span className="px-3 py-1 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: conversationData.color === 'purple' ? 'rgba(147,51,234,0.2)' :
                          conversationData.color === 'orange' ? 'rgba(249,115,22,0.2)' :
                          conversationData.color === 'red' ? 'rgba(239,68,68,0.2)' :
                          conversationData.color === 'brown' ? 'rgba(113,63,18,0.2)' :
                          'rgba(107,114,128,0.2)',
                        color: conversationData.color === 'purple' ? '#7c3aed' :
                          conversationData.color === 'orange' ? '#f97316' :
                          conversationData.color === 'red' ? '#ef4444' :
                          conversationData.color === 'brown' ? '#713f12' :
                          '#374151'
                      }}
                    >
                      {conversationData.mistakeType}
                    </span>
                  </div>
                  <div className="bg-white rounded-lg p-4 border border-gray-200">
                    <p className="text-right font-arabic text-2xl leading-loose"
                      style={{
                        backgroundColor: conversationData.color === 'purple' ? 'rgba(147,51,234,0.15)' :
                          conversationData.color === 'orange' ? 'rgba(249,115,22,0.15)' :
                          conversationData.color === 'red' ? 'rgba(239,68,68,0.15)' :
                          conversationData.color === 'brown' ? 'rgba(113,63,18,0.15)' :
                          'rgba(107,114,128,0.15)',
                        borderRadius: '0.5rem',
                        padding: '0.75rem'
                      }}
                    >
                      {conversationData.highlightedText}
                    </p>
                  </div>
                  <div className="mt-2 text-xs text-gray-500">
                    Created {new Date(conversationData.createdAt).toLocaleDateString()}
                  </div>
                </div>
              )}

              {/* Notes/Messages Thread */}
              <div className="space-y-4">
                {conversationData.notes.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No messages in this conversation yet</p>
                  </div>
                ) : (
                  conversationData.notes.map((note: any, index: number) => {
                    // Check if this note is from the student
                    const isStudentMessage = note.author_user_id === children[selectedChild]?.user_id;

                    return (
                      <div key={note.id || index} className="flex items-start space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shadow-md ${
                          isStudentMessage
                            ? 'bg-gradient-to-br from-blue-400 to-blue-600'
                            : 'bg-gradient-to-br from-purple-400 to-purple-600'
                        }`}>
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className={`rounded-xl p-4 ${
                            isStudentMessage
                              ? 'bg-blue-50 border border-blue-100'
                              : 'bg-purple-50 border border-purple-100'
                          }`}>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-semibold text-sm text-gray-900">
                                {isStudentMessage ? children[selectedChild]?.name : (note.author_name || 'Teacher')}
                              </span>
                              <span className="text-xs text-gray-500">
                                {new Date(note.created_at).toLocaleString()}
                              </span>
                            </div>

                            {note.type === 'text' && note.text && (
                              <p className="text-gray-700">{note.text}</p>
                            )}

                            {note.type === 'audio' && note.audio_url && (
                              <div className="flex items-center space-x-3 bg-white rounded-lg p-3">
                                <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                                  <Mic className="w-4 h-4 text-purple-600" />
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-medium text-gray-700">Voice Note</p>
                                  <audio controls className="w-full mt-1" style={{ height: '32px' }}>
                                    <source src={note.audio_url} type="audio/mpeg" />
                                    Your browser does not support audio playback.
                                  </audio>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Modal Footer - Read-Only Notice */}
            <div className="bg-gray-50 px-6 py-4 border-t flex items-center justify-between">
              <div className="flex items-center text-gray-600">
                <Eye className="w-4 h-4 mr-2" />
                <span className="text-sm">Parents can view but not reply to conversations</span>
              </div>
              <button
                onClick={() => {
                  setShowNotesModal(false);
                  setSelectedHighlightForNotes(null);
                  setConversationData(null);
                }}
                className="px-6 py-2.5 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-100 transition font-medium"
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