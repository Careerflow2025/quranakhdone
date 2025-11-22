'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useStudentManagement } from '@/hooks/useStudentManagement';
import { useHighlights } from '@/hooks/useHighlights';
import { BISMILLAH_BASE64 } from '@/lib/bismillahImage';
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
import NotesPanel from '@/features/annotations/components/NotesPanel';
import {
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
  ZoomIn,
  ZoomOut
} from 'lucide-react';

export default function StudentManagementDashboard() {
  // Get studentId from URL query params
  const searchParams = useSearchParams();
  const router = useRouter();
  const studentId = searchParams.get('studentId');

  // Fetch real student data from database
  const {
    isLoading: studentDataLoading,
    error: studentDataError,
    hasAccess,
    studentInfo,
    classInfo,
    teacherInfo,
    userRole,
    refreshData
  } = useStudentManagement(studentId);

  // Core States
  const [selectedScript, setSelectedScript] = useState('uthmani-hafs'); // Default to Uthmani script
  const [scriptLocked, setScriptLocked] = useState(false);
  const [currentSurah, setCurrentSurah] = useState(1);
  const [currentAyah, setCurrentAyah] = useState(1);
  const [selectedText, setSelectedText] = useState<any>(null);
  const [highlightMode, setHighlightMode] = useState(false);
  const [selectedMistakeType, setSelectedMistakeType] = useState('');

  // Connect highlights to database (student-specific)
  const {
    highlights: dbHighlights,
    isLoading: highlightsLoading,
    error: highlightsError,
    createHighlight: createHighlightDB,
    completeHighlight,
    deleteHighlight,
    refreshHighlights
  } = useHighlights(studentInfo?.id || null);

  // Transform database highlights to UI format
  const [highlights, setHighlights] = useState<any[]>([]);

  const [notes, setNotes] = useState<any[]>([]);
  const [noteText, setNoteText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<any>(null);
  const [audioBlob, setAudioBlob] = useState<any>(null);
  const [playingAudioId, setPlayingAudioId] = useState<any>(null);
  const [currentAudio, setCurrentAudio] = useState<any>(null);
  const [selectedHighlightsForNote, setSelectedHighlightsForNote] = useState<any[]>([]);
  const [showNotePopup, setShowNotePopup] = useState<any>(null);
  const [noteMode, setNoteMode] = useState(false);

  // NotesPanel modal state
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedHighlightForNotes, setSelectedHighlightForNotes] = useState<string | null>(null);
  const [showSurahDropdown, setShowSurahDropdown] = useState(false);
  const [currentMushafPage, setCurrentMushafPage] = useState(1);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<any>(null);
  const [selectionEnd, setSelectionEnd] = useState<any>(null);
  
  // Pen Annotation States
  const [penMode, setPenMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100);

  // Pen annotation controls state
  const [penColor, setPenColor] = useState('#FF0000');
  const [penWidth, setPenWidth] = useState(2);
  const [eraserMode, setEraserMode] = useState(false); // Zoom percentage, default 100%

  // New: Quran container ref and teacher data for professional pen annotations
  const quranContainerRef = useRef<HTMLDivElement>(null);
  const mushafScrollContainerRef = useRef<HTMLDivElement>(null); // For IntersectionObserver
  const [teacherData, setTeacherData] = useState<{ id: string; school_id: string } | null>(null);

  // Fetch teacher data when teacherInfo is available
  useEffect(() => {
    if (teacherInfo?.id && studentInfo?.schoolId) {
      setTeacherData({
        id: teacherInfo.id,
        school_id: studentInfo.schoolId
      });
    }
  }, [teacherInfo, studentInfo]);

  // Real mushaf has 604 pages with specific ayah layouts

  // Practice Session Tracking States
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [lastActivityTime, setLastActivityTime] = useState<Date>(new Date());
  const [currentPageViewStart, setCurrentPageViewStart] = useState<Date | null>(null);
  const [pageViews, setPageViews] = useState<Array<{
    page: number;
    surah: number;
    startTime: Date;
    endTime?: Date;
    duration?: number;
  }>>([]);
  const [isIdle, setIsIdle] = useState(false);
  const IDLE_TIMEOUT = 120000; // 2 minutes

  // Utility: Convert numbers to Farsi/Eastern Arabic numerals
  const toFarsiNumber = (num: number): string => {
    const farsiDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
    return String(num).split('').map(d => farsiDigits[parseInt(d)]).join('');
  };

  // Progress Calculation - Page-based
  const calculatePageBasedProgress = (studentId: string, targetPages: number) => {
    let completedPages = 0;

    for (let page = 1; page <= targetPages; page++) {
      const highlightsOnPage = highlights.filter((h: any) => {
        // In real app, check if highlight is on this page
        // For now, mock calculation
        return h.page === page;
      });

      // Page is complete only if ALL highlights are gold
      const allGold = highlightsOnPage.length > 0 &&
                      highlightsOnPage.every((h: any) => h.color === 'gold');

      if (allGold) {
        completedPages++;
      }
    }

    return {
      completedPages,
      totalPages: targetPages,
      percentage: (completedPages / targetPages) * 100
    };
  };

  // Activity Tracking
  const trackActivity = () => {
    setLastActivityTime(new Date());
    setIsIdle(false);
  };

  // Add activity listeners
  useEffect(() => {
    const handleActivity = () => trackActivity();

    document.addEventListener('mousemove', handleActivity);
    document.addEventListener('click', handleActivity);
    document.addEventListener('scroll', handleActivity);
    document.addEventListener('keypress', handleActivity);

    // Start session when component mounts
    setSessionStartTime(new Date());
    setCurrentPageViewStart(new Date());

    // Check for idle timeout
    const idleInterval = setInterval(() => {
      const now = new Date();
      const timeSinceLastActivity = now.getTime() - lastActivityTime.getTime();

      if (timeSinceLastActivity > IDLE_TIMEOUT && !isIdle) {
        setIsIdle(true);
        console.log('User is idle');
      }
    }, 10000); // Check every 10 seconds

    return () => {
      document.removeEventListener('mousemove', handleActivity);
      document.removeEventListener('click', handleActivity);
      document.removeEventListener('scroll', handleActivity);
      document.removeEventListener('keypress', handleActivity);
      clearInterval(idleInterval);

      // End session when component unmounts (not on re-render)
      // Note: sessionStartTime and pageViews are captured in closure
      if (sessionStartTime) {
        const sessionEnd = new Date();
        const totalDuration = (sessionEnd.getTime() - sessionStartTime.getTime()) / 1000 / 60; // minutes
        console.log('Session ended. Total duration:', totalDuration, 'minutes');
        console.log('Pages viewed:', pageViews);
      }
    };
  }, []); // Empty array = run once on mount, cleanup on unmount only

  // Track page changes
  useEffect(() => {
    if (currentPageViewStart && currentMushafPage) {
      // End previous page view
      const now = new Date();
      const duration = (now.getTime() - currentPageViewStart.getTime()) / 1000; // seconds

      setPageViews((prev: any) => {
        const lastView = prev[prev.length - 1];
        if (lastView && !lastView.endTime) {
          return [...prev.slice(0, -1), {
            ...lastView,
            endTime: now,
            duration
          }];
        }
        return prev;
      });

      // Start new page view
      setCurrentPageViewStart(now);
      setPageViews((prev: any) => [...prev, {
        page: currentMushafPage,
        surah: currentSurah,
        startTime: now
      }]);
    }
  }, [currentMushafPage]);

  // Update Mushaf page when Surah changes (not when script changes)
  useEffect(() => {
    const mushafPage = getPageBySurahAyah(currentSurah, 1);
    setCurrentMushafPage(mushafPage);
  }, [currentSurah]);

  // Scroll current page into view when currentMushafPage changes
  useEffect(() => {
    const pageElement = document.getElementById(`mushaf-page-${currentMushafPage}`);
    if (pageElement) {
      pageElement.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
        inline: 'center'
      });
    }
  }, [currentMushafPage]);

  // Track which page is currently visible (for dynamic page number in header)
  useEffect(() => {
    // Wait for scroll container to be ready
    if (!mushafScrollContainerRef.current) {
      return;
    }

    const observerOptions = {
      root: mushafScrollContainerRef.current, // Use scroll container as root, not viewport
      threshold: 0.5, // 50% of page must be visible
      rootMargin: '0px'
    };

    const observerCallback = (entries: IntersectionObserverEntry[]) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting && entry.intersectionRatio >= 0.5) {
          // Extract page number from element ID (mushaf-page-123 -> 123)
          const pageId = entry.target.id;
          const pageNum = parseInt(pageId.replace('mushaf-page-', ''));
          if (!isNaN(pageNum)) {
            setCurrentMushafPage(pageNum);
          }
        }
      });
    };

    const observer = new IntersectionObserver(observerCallback, observerOptions);

    // Observe all page elements (they're rendered dynamically, so wait a bit)
    const observePages = () => {
      for (let i = 1; i <= 604; i++) {
        const pageElement = document.getElementById(`mushaf-page-${i}`);
        if (pageElement) {
          observer.observe(pageElement);
        }
      }
    };

    // Delay observation to ensure pages are rendered
    const timeoutId = setTimeout(observePages, 1000);

    return () => {
      clearTimeout(timeoutId);
      observer.disconnect();
    };
  }, [mushafScrollContainerRef.current]); // Re-run when ref is set

  // Update Quran text when Surah or Script changes
  // Also populate cache and preload adjacent Surahs for smooth scrolling
  useEffect(() => {
    const loadQuranText = async () => {
      const scriptId = selectedScript || 'uthmani-hafs';
      const surahInfo = allSurahs.find((s: any) => s.number === currentSurah);

      try {
        const surahData = await getSurahByNumber(scriptId, currentSurah);

        if (surahData && surahData.ayahs && surahData.ayahs.length > 0) {
          // Transform to component format
          const transformedData = {
            number: currentSurah,
            surah: surahData.name || surahInfo?.nameArabic || 'الفاتحة',
            ayahs: surahData.ayahs.map((ayah: any) => ({
              number: ayah.numberInSurah,
              text: ayah.text,
              words: ayah.text.split(' ')
            }))
          };

          // Set current Quran text
          setQuranText(transformedData);

          // Cache this Surah
          const cacheKey = `${scriptId}-${currentSurah}`;
          setSurahCache(prev => ({
            ...prev,
            [cacheKey]: transformedData
          }));

          // Preload adjacent Surahs (previous and next) for smooth scrolling
          const adjacentSurahs = [
            currentSurah - 1,
            currentSurah + 1
          ].filter(num => num >= 1 && num <= 114);

          adjacentSurahs.forEach(async (surahNum) => {
            const adjCacheKey = `${scriptId}-${surahNum}`;
            // Only load if not already cached
            if (!surahCache[adjCacheKey]) {
              try {
                const adjSurahData = await getSurahByNumber(scriptId, surahNum);
                if (adjSurahData && adjSurahData.ayahs) {
                  setSurahCache(prev => ({
                    ...prev,
                    [adjCacheKey]: {
                      number: surahNum,
                      surah: adjSurahData.name,
                      ayahs: adjSurahData.ayahs.map((ayah: any) => ({
                        number: ayah.numberInSurah,
                        text: ayah.text,
                        words: ayah.text.split(' ')
                      }))
                    }
                  }));
                }
              } catch (error) {
                console.warn(`Failed to preload Surah ${surahNum}:`, error);
              }
            }
          });
        }
      } catch (error) {
        console.error('Error loading Quran text:', error);
        // Fallback for any loading issues
        setQuranText({
          number: currentSurah,
          surah: surahInfo?.nameArabic || 'سورة',
          ayahs: [
            {
              number: 1,
              text: 'جاري تحميل النص...',
              words: ['جاري', 'تحميل', 'النص...']
            }
          ]
        });
      }
    };

    loadQuranText();
  }, [currentSurah, selectedScript]);
  
  // Get all 114 Surahs from data file
  const allSurahs = surahList.map((s: any) => ({
    number: s.number,
    nameArabic: s.nameArabic,
    nameEnglish: s.nameEnglish,
    meaning: s.meaning,
    verses: s.verses,
    type: s.type
  }));

  // Original list for reference
  const allSurahsOriginal = [
    { number: 1, nameArabic: 'الفاتحة', nameEnglish: 'Al-Fatihah', meaning: 'The Opening', verses: 7, type: 'Meccan' },
    { number: 2, nameArabic: 'البقرة', nameEnglish: 'Al-Baqarah', meaning: 'The Cow', verses: 286, type: 'Medinan' },
    { number: 3, nameArabic: 'آل عمران', nameEnglish: 'Ali \'Imran', meaning: 'Family of Imran', verses: 200, type: 'Medinan' },
    { number: 4, nameArabic: 'النساء', nameEnglish: 'An-Nisa', meaning: 'The Women', verses: 176, type: 'Medinan' },
    { number: 5, nameArabic: 'المائدة', nameEnglish: 'Al-Ma\'idah', meaning: 'The Table', verses: 120, type: 'Medinan' },
    { number: 6, nameArabic: 'الأنعام', nameEnglish: 'Al-An\'am', meaning: 'The Cattle', verses: 165, type: 'Meccan' },
    { number: 7, nameArabic: 'الأعراف', nameEnglish: 'Al-A\'raf', meaning: 'The Heights', verses: 206, type: 'Meccan' },
    { number: 8, nameArabic: 'الأنفال', nameEnglish: 'Al-Anfal', meaning: 'The Spoils of War', verses: 75, type: 'Medinan' },
    { number: 9, nameArabic: 'التوبة', nameEnglish: 'At-Tawbah', meaning: 'The Repentance', verses: 129, type: 'Medinan' },
    { number: 10, nameArabic: 'يونس', nameEnglish: 'Yunus', meaning: 'Jonah', verses: 109, type: 'Meccan' },
    { number: 11, nameArabic: 'هود', nameEnglish: 'Hud', meaning: 'Hud', verses: 123, type: 'Meccan' },
    { number: 12, nameArabic: 'يوسف', nameEnglish: 'Yusuf', meaning: 'Joseph', verses: 111, type: 'Meccan' },
    { number: 13, nameArabic: 'الرعد', nameEnglish: 'Ar-Ra\'d', meaning: 'The Thunder', verses: 43, type: 'Medinan' },
    { number: 14, nameArabic: 'إبراهيم', nameEnglish: 'Ibrahim', meaning: 'Abraham', verses: 52, type: 'Meccan' },
    { number: 15, nameArabic: 'الحجر', nameEnglish: 'Al-Hijr', meaning: 'The Rock', verses: 99, type: 'Meccan' },
    { number: 16, nameArabic: 'النحل', nameEnglish: 'An-Nahl', meaning: 'The Bee', verses: 128, type: 'Meccan' },
    { number: 17, nameArabic: 'الإسراء', nameEnglish: 'Al-Isra', meaning: 'The Night Journey', verses: 111, type: 'Meccan' },
    { number: 18, nameArabic: 'الكهف', nameEnglish: 'Al-Kahf', meaning: 'The Cave', verses: 110, type: 'Meccan' },
    { number: 19, nameArabic: 'مريم', nameEnglish: 'Maryam', meaning: 'Mary', verses: 98, type: 'Meccan' },
    { number: 20, nameArabic: 'طه', nameEnglish: 'Ta-Ha', meaning: 'Ta-Ha', verses: 135, type: 'Meccan' },
    { number: 21, nameArabic: 'الأنبياء', nameEnglish: 'Al-Anbiya', meaning: 'The Prophets', verses: 112, type: 'Meccan' },
    { number: 22, nameArabic: 'الحج', nameEnglish: 'Al-Hajj', meaning: 'The Pilgrimage', verses: 78, type: 'Medinan' },
    { number: 23, nameArabic: 'المؤمنون', nameEnglish: 'Al-Mu\'minun', meaning: 'The Believers', verses: 118, type: 'Meccan' },
    { number: 24, nameArabic: 'النور', nameEnglish: 'An-Nur', meaning: 'The Light', verses: 64, type: 'Medinan' },
    { number: 25, nameArabic: 'الفرقان', nameEnglish: 'Al-Furqan', meaning: 'The Criterion', verses: 77, type: 'Meccan' },
    { number: 26, nameArabic: 'الشعراء', nameEnglish: 'Ash-Shu\'ara', meaning: 'The Poets', verses: 227, type: 'Meccan' },
    { number: 27, nameArabic: 'النمل', nameEnglish: 'An-Naml', meaning: 'The Ant', verses: 93, type: 'Meccan' },
    { number: 28, nameArabic: 'القصص', nameEnglish: 'Al-Qasas', meaning: 'The Stories', verses: 88, type: 'Meccan' },
    { number: 29, nameArabic: 'العنكبوت', nameEnglish: 'Al-\'Ankabut', meaning: 'The Spider', verses: 69, type: 'Meccan' },
    { number: 30, nameArabic: 'الروم', nameEnglish: 'Ar-Rum', meaning: 'The Romans', verses: 60, type: 'Meccan' },
    { number: 31, nameArabic: 'لقمان', nameEnglish: 'Luqman', meaning: 'Luqman', verses: 34, type: 'Meccan' },
    { number: 32, nameArabic: 'السجدة', nameEnglish: 'As-Sajdah', meaning: 'The Prostration', verses: 30, type: 'Meccan' },
    { number: 33, nameArabic: 'الأحزاب', nameEnglish: 'Al-Ahzab', meaning: 'The Confederates', verses: 73, type: 'Medinan' },
    { number: 34, nameArabic: 'سبأ', nameEnglish: 'Saba', meaning: 'Sheba', verses: 54, type: 'Meccan' },
    { number: 35, nameArabic: 'فاطر', nameEnglish: 'Fatir', meaning: 'The Originator', verses: 45, type: 'Meccan' },
    { number: 36, nameArabic: 'يس', nameEnglish: 'Ya-Sin', meaning: 'Ya-Sin', verses: 83, type: 'Meccan' },
    { number: 37, nameArabic: 'الصافات', nameEnglish: 'As-Saffat', meaning: 'The Ranks', verses: 182, type: 'Meccan' },
    { number: 38, nameArabic: 'ص', nameEnglish: 'Sad', meaning: 'Sad', verses: 88, type: 'Meccan' },
    { number: 39, nameArabic: 'الزمر', nameEnglish: 'Az-Zumar', meaning: 'The Groups', verses: 75, type: 'Meccan' },
    { number: 40, nameArabic: 'غافر', nameEnglish: 'Ghafir', meaning: 'The Forgiver', verses: 85, type: 'Meccan' },
    { number: 41, nameArabic: 'فصلت', nameEnglish: 'Fussilat', meaning: 'Explained in Detail', verses: 54, type: 'Meccan' },
    { number: 42, nameArabic: 'الشورى', nameEnglish: 'Ash-Shura', meaning: 'The Consultation', verses: 53, type: 'Meccan' },
    { number: 43, nameArabic: 'الزخرف', nameEnglish: 'Az-Zukhruf', meaning: 'The Ornaments', verses: 89, type: 'Meccan' },
    { number: 44, nameArabic: 'الدخان', nameEnglish: 'Ad-Dukhan', meaning: 'The Smoke', verses: 59, type: 'Meccan' },
    { number: 45, nameArabic: 'الجاثية', nameEnglish: 'Al-Jathiyah', meaning: 'The Kneeling', verses: 37, type: 'Meccan' },
    { number: 46, nameArabic: 'الأحقاف', nameEnglish: 'Al-Ahqaf', meaning: 'The Dunes', verses: 35, type: 'Meccan' },
    { number: 47, nameArabic: 'محمد', nameEnglish: 'Muhammad', meaning: 'Muhammad', verses: 38, type: 'Medinan' },
    { number: 48, nameArabic: 'الفتح', nameEnglish: 'Al-Fath', meaning: 'The Victory', verses: 29, type: 'Medinan' },
    { number: 49, nameArabic: 'الحجرات', nameEnglish: 'Al-Hujurat', meaning: 'The Rooms', verses: 18, type: 'Medinan' },
    { number: 50, nameArabic: 'ق', nameEnglish: 'Qaf', meaning: 'Qaf', verses: 45, type: 'Meccan' },
    { number: 51, nameArabic: 'الذاريات', nameEnglish: 'Adh-Dhariyat', meaning: 'The Winnowing Winds', verses: 60, type: 'Meccan' },
    { number: 52, nameArabic: 'الطور', nameEnglish: 'At-Tur', meaning: 'The Mount', verses: 49, type: 'Meccan' },
    { number: 53, nameArabic: 'النجم', nameEnglish: 'An-Najm', meaning: 'The Star', verses: 62, type: 'Meccan' },
    { number: 54, nameArabic: 'القمر', nameEnglish: 'Al-Qamar', meaning: 'The Moon', verses: 55, type: 'Meccan' },
    { number: 55, nameArabic: 'الرحمن', nameEnglish: 'Ar-Rahman', meaning: 'The Beneficent', verses: 78, type: 'Medinan' },
    { number: 56, nameArabic: 'الواقعة', nameEnglish: 'Al-Waqi\'ah', meaning: 'The Event', verses: 96, type: 'Meccan' },
    { number: 57, nameArabic: 'الحديد', nameEnglish: 'Al-Hadid', meaning: 'The Iron', verses: 29, type: 'Medinan' },
    { number: 58, nameArabic: 'المجادلة', nameEnglish: 'Al-Mujadilah', meaning: 'The Disputation', verses: 22, type: 'Medinan' },
    { number: 59, nameArabic: 'الحشر', nameEnglish: 'Al-Hashr', meaning: 'The Exile', verses: 24, type: 'Medinan' },
    { number: 60, nameArabic: 'الممتحنة', nameEnglish: 'Al-Mumtahanah', meaning: 'The Examined One', verses: 13, type: 'Medinan' },
    { number: 61, nameArabic: 'الصف', nameEnglish: 'As-Saff', meaning: 'The Ranks', verses: 14, type: 'Medinan' },
    { number: 62, nameArabic: 'الجمعة', nameEnglish: 'Al-Jumu\'ah', meaning: 'Friday', verses: 11, type: 'Medinan' },
    { number: 63, nameArabic: 'المنافقون', nameEnglish: 'Al-Munafiqun', meaning: 'The Hypocrites', verses: 11, type: 'Medinan' },
    { number: 64, nameArabic: 'التغابن', nameEnglish: 'At-Taghabun', meaning: 'The Mutual Loss', verses: 18, type: 'Medinan' },
    { number: 65, nameArabic: 'الطلاق', nameEnglish: 'At-Talaq', meaning: 'The Divorce', verses: 12, type: 'Medinan' },
    { number: 66, nameArabic: 'التحريم', nameEnglish: 'At-Tahrim', meaning: 'The Prohibition', verses: 12, type: 'Medinan' },
    { number: 67, nameArabic: 'الملك', nameEnglish: 'Al-Mulk', meaning: 'The Sovereignty', verses: 30, type: 'Meccan' },
    { number: 68, nameArabic: 'القلم', nameEnglish: 'Al-Qalam', meaning: 'The Pen', verses: 52, type: 'Meccan' },
    { number: 69, nameArabic: 'الحاقة', nameEnglish: 'Al-Haqqah', meaning: 'The Reality', verses: 52, type: 'Meccan' },
    { number: 70, nameArabic: 'المعارج', nameEnglish: 'Al-Ma\'arij', meaning: 'The Ascending Ways', verses: 44, type: 'Meccan' },
    { number: 71, nameArabic: 'نوح', nameEnglish: 'Nuh', meaning: 'Noah', verses: 28, type: 'Meccan' },
    { number: 72, nameArabic: 'الجن', nameEnglish: 'Al-Jinn', meaning: 'The Jinn', verses: 28, type: 'Meccan' },
    { number: 73, nameArabic: 'المزمل', nameEnglish: 'Al-Muzzammil', meaning: 'The Enshrouded', verses: 20, type: 'Meccan' },
    { number: 74, nameArabic: 'المدثر', nameEnglish: 'Al-Muddaththir', meaning: 'The Cloaked', verses: 56, type: 'Meccan' },
    { number: 75, nameArabic: 'القيامة', nameEnglish: 'Al-Qiyamah', meaning: 'The Resurrection', verses: 40, type: 'Meccan' },
    { number: 76, nameArabic: 'الإنسان', nameEnglish: 'Al-Insan', meaning: 'The Human', verses: 31, type: 'Medinan' },
    { number: 77, nameArabic: 'المرسلات', nameEnglish: 'Al-Mursalat', meaning: 'The Emissaries', verses: 50, type: 'Meccan' },
    { number: 78, nameArabic: 'النبأ', nameEnglish: 'An-Naba', meaning: 'The Tidings', verses: 40, type: 'Meccan' },
    { number: 79, nameArabic: 'النازعات', nameEnglish: 'An-Nazi\'at', meaning: 'The Pullers', verses: 46, type: 'Meccan' },
    { number: 80, nameArabic: 'عبس', nameEnglish: '\'Abasa', meaning: 'He Frowned', verses: 42, type: 'Meccan' },
    { number: 81, nameArabic: 'التكوير', nameEnglish: 'At-Takwir', meaning: 'The Overthrowing', verses: 29, type: 'Meccan' },
    { number: 82, nameArabic: 'الانفطار', nameEnglish: 'Al-Infitar', meaning: 'The Cleaving', verses: 19, type: 'Meccan' },
    { number: 83, nameArabic: 'المطففين', nameEnglish: 'Al-Mutaffifin', meaning: 'The Defrauders', verses: 36, type: 'Meccan' },
    { number: 84, nameArabic: 'الانشقاق', nameEnglish: 'Al-Inshiqaq', meaning: 'The Splitting', verses: 25, type: 'Meccan' },
    { number: 85, nameArabic: 'البروج', nameEnglish: 'Al-Buruj', meaning: 'The Constellations', verses: 22, type: 'Meccan' },
    { number: 86, nameArabic: 'الطارق', nameEnglish: 'At-Tariq', meaning: 'The Night Star', verses: 17, type: 'Meccan' },
    { number: 87, nameArabic: 'الأعلى', nameEnglish: 'Al-A\'la', meaning: 'The Most High', verses: 19, type: 'Meccan' },
    { number: 88, nameArabic: 'الغاشية', nameEnglish: 'Al-Ghashiyah', meaning: 'The Overwhelming', verses: 26, type: 'Meccan' },
    { number: 89, nameArabic: 'الفجر', nameEnglish: 'Al-Fajr', meaning: 'The Dawn', verses: 30, type: 'Meccan' },
    { number: 90, nameArabic: 'البلد', nameEnglish: 'Al-Balad', meaning: 'The City', verses: 20, type: 'Meccan' },
    { number: 91, nameArabic: 'الشمس', nameEnglish: 'Ash-Shams', meaning: 'The Sun', verses: 15, type: 'Meccan' },
    { number: 92, nameArabic: 'الليل', nameEnglish: 'Al-Layl', meaning: 'The Night', verses: 21, type: 'Meccan' },
    { number: 93, nameArabic: 'الضحى', nameEnglish: 'Ad-Duha', meaning: 'The Morning Hours', verses: 11, type: 'Meccan' },
    { number: 94, nameArabic: 'الشرح', nameEnglish: 'Ash-Sharh', meaning: 'The Expansion', verses: 8, type: 'Meccan' },
    { number: 95, nameArabic: 'التين', nameEnglish: 'At-Tin', meaning: 'The Fig', verses: 8, type: 'Meccan' },
    { number: 96, nameArabic: 'العلق', nameEnglish: 'Al-\'Alaq', meaning: 'The Clot', verses: 19, type: 'Meccan' },
    { number: 97, nameArabic: 'القدر', nameEnglish: 'Al-Qadr', meaning: 'The Power', verses: 5, type: 'Meccan' },
    { number: 98, nameArabic: 'البينة', nameEnglish: 'Al-Bayyinah', meaning: 'The Clear Evidence', verses: 8, type: 'Medinan' },
    { number: 99, nameArabic: 'الزلزلة', nameEnglish: 'Az-Zalzalah', meaning: 'The Earthquake', verses: 8, type: 'Medinan' },
    { number: 100, nameArabic: 'العاديات', nameEnglish: 'Al-\'Adiyat', meaning: 'The Runners', verses: 11, type: 'Meccan' },
    { number: 101, nameArabic: 'القارعة', nameEnglish: 'Al-Qari\'ah', meaning: 'The Calamity', verses: 11, type: 'Meccan' },
    { number: 102, nameArabic: 'التكاثر', nameEnglish: 'At-Takathur', meaning: 'The Rivalry', verses: 8, type: 'Meccan' },
    { number: 103, nameArabic: 'العصر', nameEnglish: 'Al-\'Asr', meaning: 'The Time', verses: 3, type: 'Meccan' },
    { number: 104, nameArabic: 'الهمزة', nameEnglish: 'Al-Humazah', meaning: 'The Slanderer', verses: 9, type: 'Meccan' },
    { number: 105, nameArabic: 'الفيل', nameEnglish: 'Al-Fil', meaning: 'The Elephant', verses: 5, type: 'Meccan' },
    { number: 106, nameArabic: 'قريش', nameEnglish: 'Quraysh', meaning: 'Quraysh', verses: 4, type: 'Meccan' },
    { number: 107, nameArabic: 'الماعون', nameEnglish: 'Al-Ma\'un', meaning: 'The Small Kindness', verses: 7, type: 'Meccan' },
    { number: 108, nameArabic: 'الكوثر', nameEnglish: 'Al-Kawthar', meaning: 'The Abundance', verses: 3, type: 'Meccan' },
    { number: 109, nameArabic: 'الكافرون', nameEnglish: 'Al-Kafirun', meaning: 'The Disbelievers', verses: 6, type: 'Meccan' },
    { number: 110, nameArabic: 'النصر', nameEnglish: 'An-Nasr', meaning: 'The Help', verses: 3, type: 'Medinan' },
    { number: 111, nameArabic: 'المسد', nameEnglish: 'Al-Masad', meaning: 'The Palm Fiber', verses: 5, type: 'Meccan' },
    { number: 112, nameArabic: 'الإخلاص', nameEnglish: 'Al-Ikhlas', meaning: 'The Sincerity', verses: 4, type: 'Meccan' },
    { number: 113, nameArabic: 'الفلق', nameEnglish: 'Al-Falaq', meaning: 'The Daybreak', verses: 5, type: 'Meccan' },
    { number: 114, nameArabic: 'الناس', nameEnglish: 'An-Nas', meaning: 'Mankind', verses: 6, type: 'Meccan' }
  ];

  // Get Quran Scripts from data file
  const quranScripts = getAllQuranScripts();

  // Mistake Types with Colors
  const mistakeTypes = [
    { id: 'recap', name: 'Recap/Review', color: 'purple', bgColor: 'bg-purple-100', textColor: 'text-purple-700' },
    { id: 'homework', name: 'Homework', color: 'green', bgColor: 'bg-green-100', textColor: 'text-green-700' },
    { id: 'tajweed', name: 'Tajweed', color: 'orange', bgColor: 'bg-orange-100', textColor: 'text-orange-700' },
    { id: 'haraka', name: 'Haraka', color: 'red', bgColor: 'bg-red-100', textColor: 'text-red-700' },
    { id: 'letter', name: 'Letter', color: 'brown', bgColor: 'bg-amber-100', textColor: 'text-amber-900' }
  ];

  // Completed highlights shown separately with gold color
  const completedType = { id: 'completed', name: 'Completed', color: 'gold', bgColor: 'bg-yellow-400', textColor: 'text-yellow-900' };

  // Sample Quran Text Data for Multiple Surahs
  const quranTexts: { [key: number]: any } = {
    1: { // Al-Fatihah
      surah: 'الفاتحة',
      ayahs: [
        { number: 1, text: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', words: ['بِسْمِ', 'اللَّهِ', 'الرَّحْمَٰنِ', 'الرَّحِيمِ'] },
        { number: 2, text: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', words: ['الْحَمْدُ', 'لِلَّهِ', 'رَبِّ', 'الْعَالَمِينَ'] },
        { number: 3, text: 'الرَّحْمَٰنِ الرَّحِيمِ', words: ['الرَّحْمَٰنِ', 'الرَّحِيمِ'] },
        { number: 4, text: 'مَالِكِ يَوْمِ الدِّينِ', words: ['مَالِكِ', 'يَوْمِ', 'الدِّينِ'] },
        { number: 5, text: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', words: ['إِيَّاكَ', 'نَعْبُدُ', 'وَإِيَّاكَ', 'نَسْتَعِينُ'] },
        { number: 6, text: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', words: ['اهْدِنَا', 'الصِّرَاطَ', 'الْمُسْتَقِيمَ'] },
        { number: 7, text: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', words: ['صِرَاطَ', 'الَّذِينَ', 'أَنْعَمْتَ', 'عَلَيْهِمْ', 'غَيْرِ', 'الْمَغْضُوبِ', 'عَلَيْهِمْ', 'وَلَا', 'الضَّالِّينَ'] }
      ]
    },
    112: { // Al-Ikhlas
      surah: 'الإخلاص',
      ayahs: [
        { number: 1, text: 'قُلْ هُوَ اللَّهُ أَحَدٌ', words: ['قُلْ', 'هُوَ', 'اللَّهُ', 'أَحَدٌ'] },
        { number: 2, text: 'اللَّهُ الصَّمَدُ', words: ['اللَّهُ', 'الصَّمَدُ'] },
        { number: 3, text: 'لَمْ يَلِدْ وَلَمْ يُولَدْ', words: ['لَمْ', 'يَلِدْ', 'وَلَمْ', 'يُولَدْ'] },
        { number: 4, text: 'وَلَمْ يَكُن لَّهُ كُفُوًا أَحَدٌ', words: ['وَلَمْ', 'يَكُن', 'لَّهُ', 'كُفُوًا', 'أَحَدٌ'] }
      ]
    },
    113: { // Al-Falaq
      surah: 'الفلق',
      ayahs: [
        { number: 1, text: 'قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ', words: ['قُلْ', 'أَعُوذُ', 'بِرَبِّ', 'الْفَلَقِ'] },
        { number: 2, text: 'مِن شَرِّ مَا خَلَقَ', words: ['مِن', 'شَرِّ', 'مَا', 'خَلَقَ'] },
        { number: 3, text: 'وَمِن شَرِّ غَاسِقٍ إِذَا وَقَبَ', words: ['وَمِن', 'شَرِّ', 'غَاسِقٍ', 'إِذَا', 'وَقَبَ'] },
        { number: 4, text: 'وَمِن شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ', words: ['وَمِن', 'شَرِّ', 'النَّفَّاثَاتِ', 'فِي', 'الْعُقَدِ'] },
        { number: 5, text: 'وَمِن شَرِّ حَاسِدٍ إِذَا حَسَدَ', words: ['وَمِن', 'شَرِّ', 'حَاسِدٍ', 'إِذَا', 'حَسَدَ'] }
      ]
    },
    114: { // An-Nas
      surah: 'الناس',
      ayahs: [
        { number: 1, text: 'قُلْ أَعُوذُ بِرَبِّ النَّاسِ', words: ['قُلْ', 'أَعُوذُ', 'بِرَبِّ', 'النَّاسِ'] },
        { number: 2, text: 'مَلِكِ النَّاسِ', words: ['مَلِكِ', 'النَّاسِ'] },
        { number: 3, text: 'إِلَٰهِ النَّاسِ', words: ['إِلَٰهِ', 'النَّاسِ'] },
        { number: 4, text: 'مِن شَرِّ الْوَسْوَاسِ الْخَنَّاسِ', words: ['مِن', 'شَرِّ', 'الْوَسْوَاسِ', 'الْخَنَّاسِ'] },
        { number: 5, text: 'الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ', words: ['الَّذِي', 'يُوَسْوِسُ', 'فِي', 'صُدُورِ', 'النَّاسِ'] },
        { number: 6, text: 'مِنَ الْجِنَّةِ وَالنَّاسِ', words: ['مِنَ', 'الْجِنَّةِ', 'وَالنَّاسِ'] }
      ]
    },
    2: { // Beginning of Al-Baqarah (sample)
      surah: 'البقرة',
      ayahs: [
        { number: 1, text: 'الم', words: ['الم'] },
        { number: 2, text: 'ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ', words: ['ذَٰلِكَ', 'الْكِتَابُ', 'لَا', 'رَيْبَ', 'فِيهِ', 'هُدًى', 'لِّلْمُتَّقِينَ'] },
        { number: 3, text: 'الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ', words: ['الَّذِينَ', 'يُؤْمِنُونَ', 'بِالْغَيْبِ', 'وَيُقِيمُونَ', 'الصَّلَاةَ', 'وَمِمَّا', 'رَزَقْنَاهُمْ', 'يُنفِقُونَ'] },
        { number: 4, text: 'وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنزِلَ إِلَيْكَ وَمَا أُنزِلَ مِن قَبْلِكَ وَبِالْآخِرَةِ هُمْ يُوقِنُونَ', words: ['وَالَّذِينَ', 'يُؤْمِنُونَ', 'بِمَا', 'أُنزِلَ', 'إِلَيْكَ', 'وَمَا', 'أُنزِلَ', 'مِن', 'قَبْلِكَ', 'وَبِالْآخِرَةِ', 'هُمْ', 'يُوقِنُونَ'] },
        { number: 5, text: 'أُولَٰئِكَ عَلَىٰ هُدًى مِّن رَّبِّهِمْ ۖ وَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ', words: ['أُولَٰئِكَ', 'عَلَىٰ', 'هُدًى', 'مِّن', 'رَّبِّهِمْ', 'وَأُولَٰئِكَ', 'هُمُ', 'الْمُفْلِحُونَ'] }
      ]
    },
    36: { // Ya-Sin (sample beginning)
      surah: 'يس',
      ayahs: [
        { number: 1, text: 'يس', words: ['يس'] },
        { number: 2, text: 'وَالْقُرْآنِ الْحَكِيمِ', words: ['وَالْقُرْآنِ', 'الْحَكِيمِ'] },
        { number: 3, text: 'إِنَّكَ لَمِنَ الْمُرْسَلِينَ', words: ['إِنَّكَ', 'لَمِنَ', 'الْمُرْسَلِينَ'] },
        { number: 4, text: 'عَلَىٰ صِرَاطٍ مُّسْتَقِيمٍ', words: ['عَلَىٰ', 'صِرَاطٍ', 'مُّسْتَقِيمٍ'] },
        { number: 5, text: 'تَنزِيلَ الْعَزِيزِ الرَّحِيمِ', words: ['تَنزِيلَ', 'الْعَزِيزِ', 'الرَّحِيمِ'] }
      ]
    },
    67: { // Al-Mulk (sample beginning)
      surah: 'الملك',
      ayahs: [
        { number: 1, text: 'تَبَارَكَ الَّذِي بِيَدِهِ الْمُلْكُ وَهُوَ عَلَىٰ كُلِّ شَيْءٍ قَدِيرٌ', words: ['تَبَارَكَ', 'الَّذِي', 'بِيَدِهِ', 'الْمُلْكُ', 'وَهُوَ', 'عَلَىٰ', 'كُلِّ', 'شَيْءٍ', 'قَدِيرٌ'] },
        { number: 2, text: 'الَّذِي خَلَقَ الْمَوْتَ وَالْحَيَاةَ لِيَبْلُوَكُمْ أَيُّكُمْ أَحْسَنُ عَمَلًا ۚ وَهُوَ الْعَزِيزُ الْغَفُورُ', words: ['الَّذِي', 'خَلَقَ', 'الْمَوْتَ', 'وَالْحَيَاةَ', 'لِيَبْلُوَكُمْ', 'أَيُّكُمْ', 'أَحْسَنُ', 'عَمَلًا', 'وَهُوَ', 'الْعَزِيزُ', 'الْغَفُورُ'] },
        { number: 3, text: 'الَّذِي خَلَقَ سَبْعَ سَمَاوَاتٍ طِبَاقًا ۖ مَّا تَرَىٰ فِي خَلْقِ الرَّحْمَٰنِ مِن تَفَاوُتٍ ۖ فَارْجِعِ الْبَصَرَ هَلْ تَرَىٰ مِن فُطُورٍ', words: ['الَّذِي', 'خَلَقَ', 'سَبْعَ', 'سَمَاوَاتٍ', 'طِبَاقًا', 'مَّا', 'تَرَىٰ', 'فِي', 'خَلْقِ', 'الرَّحْمَٰنِ', 'مِن', 'تَفَاوُتٍ', 'فَارْجِعِ', 'الْبَصَرَ', 'هَلْ', 'تَرَىٰ', 'مِن', 'فُطُورٍ'] }
      ]
    }
  };

  const [quranText, setQuranText] = useState(quranTexts[1]);

  // Surah Cache: Store loaded Surahs to avoid re-fetching
  // Key: `${scriptId}-${surahNumber}`, Value: Surah data
  const [surahCache, setSurahCache] = useState<Record<string, any>>({});

  // Progress Stats
  const [progressStats] = useState({
    memorization: { current: 67, target: 78, percentage: 85 },
    revision: { current: 45, target: 67, percentage: 67 },
    tajweed: { score: 92, improvements: 3 },
    consistency: { streak: 12, missed: 2 },
    mistakes: {
      recap: 5,
      tajweed: 12,
      haraka: 8,
      letter: 3
    }
  });

  // Check if student already has a locked Quran version on load
  useEffect(() => {
    if (studentInfo?.preferredScriptId) {
      console.log('✅ Student has locked Quran version:', studentInfo.preferredScriptId);
      setSelectedScript(studentInfo.preferredScriptId);
      setScriptLocked(true);
    } else {
      console.log('ℹ️ No locked Quran version for student - showing selector');
    }
  }, [studentInfo?.preferredScriptId]);

  // Handle Script Selection
  const handleScriptSelect = (scriptId: any) => {
    if (!scriptLocked) {
      setSelectedScript(scriptId);
    }
  };

  const lockScriptSelection = async () => {
    if (!selectedScript || !studentInfo?.id) {
      alert('Please select a script first');
      return;
    }

    try {
      console.log('🔒 Locking Quran version:', selectedScript, 'for student:', studentInfo.id);

      // Save to database
      const { data, error } = await fetch('/api/students/lock-script', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          studentId: studentInfo.id,
          scriptId: selectedScript
        })
      }).then(res => res.json());

      if (error) {
        throw new Error(error);
      }

      setScriptLocked(true);

      const scriptName = quranScripts.find((s: any) => s.id === selectedScript)?.name;
      alert(`✅ Script permanently locked to: ${scriptName}\n\nThis cannot be changed.`);

      // Refresh student data to update preferredScriptId
      await refreshData();

      console.log('✅ Quran version locked successfully');
    } catch (err: any) {
      console.error('❌ Error locking script:', err);
      alert(`Failed to lock script: ${err.message}`);
    }
  };

  // Transform database highlights to UI format for current page
  useEffect(() => {
    if (!dbHighlights || dbHighlights.length === 0) {
      setHighlights([]);
      return;
    }

    // Get current page data
    const pageData = getPageContent(currentMushafPage);
    if (!pageData) return;

    // Filter highlights for current page and transform to UI format
    const pageHighlights: any[] = [];

    dbHighlights.forEach((dbH: any) => {
      // Check if highlight is on current page
      if (dbH.page_number !== currentMushafPage) return;

      // Find the ayah in quranText array
      const ayahIndex = quranText.ayahs.findIndex((ayah: any) => ayah.number === dbH.ayah_start);
      if (ayahIndex === -1) return;

      // Check if word indices are specified (word-level highlight)
      if (dbH.word_start !== null && dbH.word_start !== undefined &&
          dbH.word_end !== null && dbH.word_end !== undefined) {
        // Word-level highlight: only highlight specific words
        for (let wordIdx = dbH.word_start; wordIdx <= dbH.word_end; wordIdx++) {
          pageHighlights.push({
            id: `${dbH.id}-${wordIdx}`,
            dbId: dbH.id,
            ayahIndex,
            wordIndex: wordIdx,
            mistakeType: dbH.type || dbH.color,
            color: dbH.color,
            timestamp: dbH.created_at,
            isCompleted: dbH.completed_at !== null
          });
        }
      } else {
        // Full ayah highlight (word_start and word_end are NULL)
        // Create highlight for each word in the ayah so they all show color
        const ayah = quranText.ayahs[ayahIndex];
        if (ayah && ayah.words) {
          const ayahWords = ayah.words.length;
          for (let wordIdx = 0; wordIdx < ayahWords; wordIdx++) {
            pageHighlights.push({
              id: `${dbH.id}-${wordIdx}`,
              dbId: dbH.id,
              ayahIndex,
              wordIndex: wordIdx,
              mistakeType: dbH.type || dbH.color,
              color: dbH.color,
              timestamp: dbH.created_at,
              isCompleted: dbH.completed_at !== null,
              isFullAyah: true  // Flag to indicate this is part of full ayah highlight
            });
          }
        }
      }
    });

    setHighlights(pageHighlights);
  }, [dbHighlights, currentMushafPage, quranText]);

  // Handle Text Selection for Highlighting
  const handleTextSelection = (ayahIndex: number, wordIndex: number, isMouseDown: boolean = false, isMouseUp: boolean = false) => {
    if (highlightMode && selectedMistakeType) {
      // For all types - simple click to toggle single word
      if (!isMouseDown && !isMouseUp) {
        toggleSingleWord(ayahIndex, wordIndex);
      }
    }
  };

  // DEBUG: Log modal state changes
  useEffect(() => {
    console.log('🔄 Modal State Changed:', {
      showNotesModal,
      selectedHighlightForNotes,
      modalShouldRender: showNotesModal && selectedHighlightForNotes
    });
  }, [showNotesModal, selectedHighlightForNotes]);

  // Toggle single word highlight - allows multiple colors on same word
  const toggleSingleWord = async (ayahIndex: number, wordIndex: number) => {
    const existingHighlight = highlights.find(
      h => h.ayahIndex === ayahIndex && h.wordIndex === wordIndex && h.mistakeType === selectedMistakeType
    );

    if (existingHighlight && existingHighlight.dbId) {
      // Remove highlight from database
      try {
        await deleteHighlight(existingHighlight.dbId);
        console.log('✅ Highlight deleted from database');
      } catch (error) {
        console.error('❌ Failed to delete highlight:', error);
        alert('Failed to delete highlight. Please try again.');
      }
    } else {
      // Add new highlight to database
      try {
        // Get page data to determine surah/ayah numbers
        const pageData = getPageContent(currentMushafPage);
        if (!pageData) {
          console.error('❌ No page data available');
          return;
        }

        // Get the ayah object
        const ayah = quranText.ayahs[ayahIndex];
        if (!ayah) {
          console.error('❌ Ayah not found:', ayahIndex);
          return;
        }

        // Create highlight in database
        await createHighlightDB({
          surah: pageData.surahStart,  // Current surah
          ayah_start: ayah.number,     // Actual ayah number
          ayah_end: ayah.number,       // Same ayah for single word
          word_start: wordIndex,       // Specific word index
          word_end: wordIndex,         // Same word for single word highlight
          color: mistakeTypes.find((m: any) => m.id === selectedMistakeType)?.color || selectedMistakeType,
          type: selectedMistakeType,
          page_number: currentMushafPage
        });

        console.log('✅ Highlight saved to database');

        // Refresh highlights to show new data immediately
        await refreshHighlights();
        console.log('✅ Highlights refreshed');
      } catch (error) {
        console.error('❌ Failed to create highlight:', error);
        alert('Failed to save highlight. Please try again.');
      }
    }
  };

  // Highlight range of words
  const highlightRange = (start: { ayahIndex: number; wordIndex: number }, end: { ayahIndex: number; wordIndex: number }) => {
    const newHighlights = [];
    const startAyah = Math.min(start.ayahIndex, end.ayahIndex);
    const endAyah = Math.max(start.ayahIndex, end.ayahIndex);

    for (let ayahIdx = startAyah; ayahIdx <= endAyah; ayahIdx++) {
      const ayahWords = quranText.ayahs[ayahIdx]?.words?.length || 0;
      const startWord = ayahIdx === start.ayahIndex ? Math.min(start.wordIndex, end.wordIndex) : 0;
      const endWord = ayahIdx === end.ayahIndex ? Math.max(start.wordIndex, end.wordIndex) : ayahWords - 1;
      
      for (let wordIdx = startWord; wordIdx <= endWord; wordIdx++) {
        // Check if already highlighted
        const exists = highlights.some(
          h => h.ayahIndex === ayahIdx && h.wordIndex === wordIdx && h.mistakeType === selectedMistakeType
        );
        
        if (!exists) {
          newHighlights.push({
            id: Date.now() + Math.random(),
            ayahIndex: ayahIdx,
            wordIndex: wordIdx,
            mistakeType: selectedMistakeType,
            color: mistakeTypes.find((m: any) => m.id === selectedMistakeType)?.color,
            timestamp: new Date().toISOString(),
            isCompleted: false
          });
        }
      }
    }
    
    setHighlights([...highlights, ...newHighlights]);
  };

  // Highlight entire ayah (for recap and tajweed)
  const highlightEntireAyah = async (ayahIndex: number) => {
    if (highlightMode && (selectedMistakeType === 'recap' || selectedMistakeType === 'homework' || selectedMistakeType === 'tajweed')) {
      // Check if full ayah highlight already exists
      const existingFullAyahHighlight = highlights.find(
        h => h.ayahIndex === ayahIndex && h.isFullAyah && h.mistakeType === selectedMistakeType
      );

      if (existingFullAyahHighlight && existingFullAyahHighlight.dbId) {
        // Remove full ayah highlight from database
        try {
          await deleteHighlight(existingFullAyahHighlight.dbId);
          console.log('✅ Full ayah highlight deleted from database');
        } catch (error) {
          console.error('❌ Failed to delete full ayah highlight:', error);
          alert('Failed to delete highlight. Please try again.');
        }
      } else {
        // Add new full ayah highlight to database (word indices = null)
        try {
          const pageData = getPageContent(currentMushafPage);
          if (!pageData) {
            console.error('❌ No page data available');
            return;
          }

          const ayah = quranText.ayahs[ayahIndex];
          if (!ayah) {
            console.error('❌ Ayah not found:', ayahIndex);
            return;
          }

          // Create full ayah highlight (word_start and word_end are null)
          await createHighlightDB({
            surah: pageData.surahStart,
            ayah_start: ayah.number,
            ayah_end: ayah.number,
            word_start: undefined, // null in database = full ayah
            word_end: undefined,   // null in database = full ayah
            color: mistakeTypes.find((m: any) => m.id === selectedMistakeType)?.color || selectedMistakeType,
            type: selectedMistakeType,
            page_number: currentMushafPage
          });

          console.log('✅ Full ayah highlight saved to database');

          // Refresh highlights to show new data immediately
          await refreshHighlights();
          console.log('✅ Highlights refreshed');
        } catch (error) {
          console.error('❌ Failed to create full ayah highlight:', error);
          alert('Failed to save highlight. Please try again.');
        }
      }
    }
  };

  // Handle Note Creation
  const handleAddNote = () => {
    if (highlights.length === 0) {
      alert('Please add some highlights first before adding notes');
      return;
    }
    setNoteMode(true);
    setSelectedHighlightsForNote([]);
    setHighlightMode(false);
    setSelectedMistakeType('');
  };

  // saveNote function removed - using NotesPanel modal instead

  // Start/Stop Recording
  const toggleRecording = async () => {
    if (!isRecording) {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const recorder = new MediaRecorder(stream);
        const chunks: Blob[] = [];

        recorder.ondataavailable = (e: BlobEvent) => chunks.push(e.data);
        recorder.onstop = () => {
          const blob = new Blob(chunks, { type: 'audio/webm' });
          setAudioBlob(blob);
        };
        
        recorder.start();
        setMediaRecorder(recorder);
        setIsRecording(true);
      } catch (err) {
        console.error('Error accessing microphone:', err);
        alert('Please allow microphone access to record voice notes');
      }
    } else {
      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
        mediaRecorder.stop();
        mediaRecorder.stream.getTracks().forEach((track: any) => track.stop());
        setIsRecording(false);
      }
    }
  };

  // Handle clicking on highlighted text - now handles multiple highlights per word
  const handleHighlightClick = (highlightId: number, wordHighlights: any = null) => {
    if (noteMode) {
      // In note mode, select/deselect highlights for note
      // If wordHighlights provided (multiple colors on same word), handle all of them
      const highlightsToProcess = wordHighlights || [highlights.find((h: any) => h.id === highlightId)].filter(Boolean);
      
      if (highlightsToProcess.length === 0) return;
      
      // Process each color separately
      const allGroupIds: number[] = [];

      highlightsToProcess.forEach((clickedHighlight: any) => {
        if (!clickedHighlight) return;
        
        // Find all consecutive highlights of the same color
        const sameColorHighlights = highlights.filter((h: any) => 
          h.mistakeType === clickedHighlight.mistakeType && 
          h.ayahIndex === clickedHighlight.ayahIndex
        ).sort((a, b) => a.wordIndex - b.wordIndex);
        
        // Find the group that contains the clicked highlight
        let groupStart = clickedHighlight.wordIndex;
        let groupEnd = clickedHighlight.wordIndex;
        
        // Expand backwards
        for (let i = clickedHighlight.wordIndex - 1; i >= 0; i--) {
          if (sameColorHighlights.some((h: any) => h.wordIndex === i)) {
            groupStart = i;
          } else {
            break;
          }
        }
        
        // Expand forwards
        for (let i = clickedHighlight.wordIndex + 1; i < 100; i++) {
          if (sameColorHighlights.some((h: any) => h.wordIndex === i)) {
            groupEnd = i;
          } else {
            break;
          }
        }
        
        // Get all highlights in this consecutive group
        const groupHighlightIds = highlights.filter((h: any) => 
          h.mistakeType === clickedHighlight.mistakeType &&
          h.ayahIndex === clickedHighlight.ayahIndex &&
          h.wordIndex >= groupStart &&
          h.wordIndex <= groupEnd
        ).map((h: any) => h.id);
        
        allGroupIds.push(...groupHighlightIds);
      });
      
      // Toggle the entire group
      const allSelected = allGroupIds.every((id: any) => selectedHighlightsForNote.includes(id));
      if (allSelected) {
        // Deselect all in group
        setSelectedHighlightsForNote(selectedHighlightsForNote.filter((id: any) => !allGroupIds.includes(id)));
      } else {
        // Select all in group
        const newSelection = [...selectedHighlightsForNote];
        allGroupIds.forEach((id: any) => {
          if (!newSelection.includes(id)) {
            newSelection.push(id);
          }
        });
        setSelectedHighlightsForNote(newSelection);
      }
    } else {
      // Normal mode - open notes conversation modal
      // Find the highlight to get its database ID
      const clickedHighlight = highlights.find((h: any) => h.id === highlightId);
      if (clickedHighlight && clickedHighlight.dbId) {
        setSelectedHighlightForNotes(clickedHighlight.dbId);
        setShowNotesModal(true);
      }

      // Legacy note popup (kept for backwards compatibility)
      const relatedNotes = notes.filter((note: any) => note.highlightIds.includes(highlightId));
      if (relatedNotes.length > 0) {
        setShowNotePopup({ highlightId, notes: relatedNotes });
      }
    }
  };

  // Remove Highlight
  const removeHighlight = (highlightId: number) => {
    setHighlights(highlights.filter((h: any) => h.id !== highlightId));
  };

  // Mark Highlight as Completed (called when teacher marks homework/assignment as complete)
  const markHighlightAsCompleted = (highlightId: number) => {
    setHighlights(highlights.map((h: any) =>
      h.id === highlightId ? { ...h, isCompleted: true } : h
    ));
  };

  // Mark all highlights of a type as completed
  const markTypeAsCompleted = (mistakeType: string) => {
    setHighlights(highlights.map((h: any) =>
      h.mistakeType === mistakeType ? { ...h, isCompleted: true } : h
    ));
  };

  // REMOVED: Mock completed homework simulation - using only real database data
  // REMOVED: Old canvas drawing functions - now using professional PenAnnotationCanvas component

  // Loading state
  if (studentDataLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading student data...</p>
        </div>
      </div>
    );
  }

  // Error state
  if (studentDataError || !studentInfo) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Student</h2>
          <p className="text-gray-600 mb-4">{studentDataError || 'Student not found'}</p>
          <button
            onClick={() => window.location.href = '/teacher-dashboard'}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // Access denied state
  if (!hasAccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center bg-white p-8 rounded-lg shadow-lg max-w-md">
          <AlertCircle className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600 mb-4">You do not have permission to view this student's dashboard.</p>
          <button
            onClick={() => window.location.href = '/teacher-dashboard'}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Back to Dashboard
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
          <div className="flex items-center justify-between">
            {/* Left Side - Surah Name */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => router.push('/teacher-dashboard')}
                className="p-2 hover:bg-gray-100 rounded-lg"
                title="Back to Teacher Dashboard"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="text-center">
                <h1 className="text-3xl font-arabic text-green-800">سُورَةُ {quranText.surah}</h1>
                <p className="text-sm text-gray-600">
                  {allSurahs.find((s: any) => s.number === currentSurah)?.nameEnglish || ''} •
                  {allSurahs.find((s: any) => s.number === currentSurah)?.type || 'Meccan'} •
                  {allSurahs.find((s: any) => s.number === currentSurah)?.verses || '7'} Verses
                </p>
              </div>
            </div>

            {/* Right Side - Controls with Compact Student Info */}
            <div className="flex items-center space-x-3">
              {/* Compact Student Info Badge */}
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-gray-100 rounded-full border border-gray-200">
                <User className="w-4 h-4 text-gray-600" />
                <span className="text-sm font-medium text-gray-700">{studentInfo.name}</span>
              </div>

              {/* Page Number Badge */}
              <div className="flex items-center space-x-2 px-3 py-1.5 bg-green-50 rounded-full border border-green-200">
                <BookOpen className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium text-green-700">
                  Page {currentMushafPage}
                </span>
              </div>

              {/* Surah Selector Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setShowSurahDropdown(!showSurahDropdown)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition"
                >
                  <BookOpen className="w-4 h-4 text-green-600" />
                  <span className="font-medium text-green-700">
                    Change Surah
                  </span>
                  <ChevronDown className={`w-4 h-4 text-green-600 transition-transform ${showSurahDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {/* Dropdown Menu - 4 Columns */}
                {showSurahDropdown && (
                  <div className="absolute right-0 top-full mt-2 w-[900px] bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[600px] overflow-y-auto">
                    <div className="sticky top-0 bg-gradient-to-r from-green-600 to-emerald-600 text-white p-4 rounded-t-xl">
                      <h3 className="text-lg font-semibold">Select Surah - اختر السورة</h3>
                    </div>
                    <div className="grid grid-cols-4 gap-1 p-2">
                      {allSurahs.map((surah: any) => (
                        <button
                          key={surah.number}
                          onClick={() => {
                            setCurrentSurah(surah.number);
                            // Navigate to the page where this Surah starts
                            const pageNumber = getPageBySurahAyah(surah.number, 1);
                            if (pageNumber) {
                              setCurrentMushafPage(pageNumber);
                            }
                            setShowSurahDropdown(false);
                          }}
                          className={`p-3 text-left hover:bg-green-50 rounded-lg transition ${
                            currentSurah === surah.number ? 'bg-green-100 border-2 border-green-500' : ''
                          }`}
                        >
                          <div className="flex items-start space-x-2">
                            <span className="inline-flex items-center justify-center w-8 h-8 bg-green-600 text-white rounded-full text-xs font-bold flex-shrink-0">
                              {surah.number}
                            </span>
                            <div className="flex-1">
                              <div className="font-arabic text-lg text-right text-gray-900">
                                {surah.nameArabic}
                              </div>
                              <div className="text-sm text-gray-600">
                                {surah.nameEnglish}
                              </div>
                              <div className="text-xs text-gray-500">
                                {surah.verses} verses • {surah.type}
                              </div>
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* REMOVED: Non-functional Save button - highlights auto-save when created */}
            </div>
          </div>
        </div>
      </div>

      <div className="px-12 py-6">
        {/* Script Selection (Only shown if not locked) */}
        {!scriptLocked && (
          <div className="mb-6 bg-yellow-50 border-2 border-yellow-300 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2 text-yellow-600" />
                  Select Quran Script (One-time Selection)
                </h2>
                <p className="text-sm text-gray-600 mt-1">Choose the script carefully. Once locked, it cannot be changed for this student.</p>
              </div>
              {selectedScript && (
                <button
                  onClick={lockScriptSelection}
                  className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center space-x-2"
                >
                  <Settings className="w-4 h-4" />
                  <span>Lock Selection</span>
                </button>
              )}
            </div>
            
            <div className="grid grid-cols-3 gap-4">
              {quranScripts.map((script: any) => (
                <button
                  key={script.id}
                  onClick={() => handleScriptSelect(script.id)}
                  className={`p-4 rounded-lg border-2 text-left transition ${
                    selectedScript === script.id
                      ? 'border-green-500 bg-green-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <h3 className="font-semibold">{script.name}</h3>
                  <p className="text-sm font-arabic text-gray-700">{script.nameArabic}</p>
                  <p className="text-xs text-gray-500 mt-1">{script.description}</p>
                  {selectedScript === script.id && (
                    <Check className="w-5 h-5 text-green-600 mt-2" />
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Quran Viewer */}
        {(scriptLocked || selectedScript) && (
          <div className="grid grid-cols-12 gap-4">
            {/* Left Panel - Mistake Types & Tools (Reduced) */}
            <div className="col-span-1 space-y-3 max-h-screen overflow-hidden">
              {/* Highlighting Tools */}
              <div className="bg-white rounded-lg shadow-sm p-3">
                <h3 className="font-semibold mb-2 text-sm flex items-center">
                  <Highlighter className="w-3 h-3 mr-1" />
                  Highlight
                </h3>
                <div className="space-y-1">
                  {mistakeTypes.map((type: any) => (
                    <button
                      key={type.id}
                      onClick={() => {
                        // Don't clear highlights - allow all colors to coexist
                        setSelectedMistakeType(type.id);
                        setHighlightMode(true);
                      }}
                      className={`w-full p-2 rounded-md border text-left transition text-xs ${
                        selectedMistakeType === type.id
                          ? `border-${type.color}-500 ${type.bgColor}`
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`font-medium ${type.textColor}`}>{type.name}</span>
                        <div className={`w-3 h-3 rounded ${type.bgColor}`}></div>
                      </div>
                    </button>
                  ))}
                </div>
                {highlightMode && (
                  <>
                    <div className="mt-2 p-2 bg-blue-50 rounded-md text-xs">
                      {selectedMistakeType === 'recap' ? (
                        <div className="text-purple-700">
                          <p>✓ Drag to select</p>
                          <p>✓ All Ayah button</p>
                        </div>
                      ) : selectedMistakeType === 'tajweed' ? (
                        <div className="text-orange-700">
                          <p>✓ Click words</p>
                          <p>✓ All Ayah button</p>
                        </div>
                      ) : (
                        <div className="text-red-700">
                          <p>✓ Click words</p>
                          <p>✓ Multiple allowed</p>
                        </div>
                      )}
                    </div>
                    <button
                      onClick={() => {
                        setHighlightMode(false);
                        setSelectedMistakeType('');
                        setIsSelecting(false);
                        setSelectionStart(null);
                        setSelectionEnd(null);
                      }}
                      className="w-full mt-2 p-1.5 rounded-md text-white bg-green-600 hover:bg-green-700 text-xs"
                    >
                      Done
                    </button>
                  </>
                )}
              </div>

              {/* Highlights Summary */}
              <div className="bg-white rounded-lg shadow-sm p-3">
                <h3 className="font-semibold mb-2 text-sm flex items-center">
                  <Clock className="w-3 h-3 mr-1" />
                  Highlights
                </h3>
                <div className="space-y-1 max-h-48 overflow-y-auto">
                  {/* Show completed highlights first with gold color */}
                  {(() => {
                    const completedHighlights = highlights.filter((h: any) => h.isCompleted);
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
                  {mistakeTypes.filter((type: any) => type.id !== 'completed').map((type: any) => {
                    const typeHighlights = highlights.filter((h: any) => h.mistakeType === type.id && !h.isCompleted);
                    if (typeHighlights.length === 0) return null;
                    return (
                      <div key={type.id} className={`p-1.5 rounded-md ${type.bgColor} text-xs`}>
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${type.textColor}`}>
                            {type.name} ({typeHighlights.length})
                          </span>
                          <button
                            onClick={() => setHighlights(highlights.filter((h: any) => h.mistakeType !== type.id))}
                            className="text-gray-500 hover:text-red-600"
                            title="Clear all"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  {highlights.length === 0 && (
                    <p className="text-xs text-gray-400 text-center py-2">No highlights</p>
                  )}
                </div>
              </div>

            </div>

            {/* Main Quran Viewer */}
            <div className="col-span-10">
              <div ref={quranContainerRef} className="bg-white rounded-xl shadow-lg relative" style={{
                background: 'linear-gradient(to bottom, #ffffff, #fafafa)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                maxHeight: '95vh',
                overflow: 'hidden',
                position: 'relative' // CRITICAL: Enable absolute positioning for canvas child
              }}>
                {/* Professional Pen Annotations - ALWAYS visible, covers ENTIRE white viewer area */}
                {studentInfo && teacherData && selectedScript && (
                  <PenAnnotationCanvas
                    studentId={studentInfo.id}
                    teacherId={teacherData.id}
                    pageNumber={currentMushafPage}
                    scriptId={selectedScript}
                    enabled={penMode}
                    containerRef={quranContainerRef}
                    penColor={penColor}
                    setPenColor={setPenColor}
                    penWidth={penWidth}
                    setPenWidth={setPenWidth}
                    eraserMode={eraserMode}
                    setEraserMode={setEraserMode}
                    onSave={() => {
                      console.log('✅ Pen annotations saved successfully');
                    }}
                    onLoad={() => {
                      console.log('✅ Pen annotations loaded successfully');
                    }}
                    onClear={() => {
                      console.log('🗑️ Pen annotations cleared');
                    }}
                  />
                )}

                {/* Page-like container for Quran text */}
                <div className="p-1" style={{
                  backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0,0,0,.02) 25%, rgba(0,0,0,.02) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.02) 75%, rgba(0,0,0,.02) 76%, transparent 77%, transparent)',
                  backgroundSize: '50px 50px',
                  pointerEvents: penMode ? 'none' : 'auto'
                }}>

                {/* Basmala removed - now using PNG image in page rendering below */}

                {/* Quran Text Display - Mushaf Style with Dynamic Script Styling */}
<div className="relative">

                  {/* Vertical Scroll Container */}
                  <div ref={mushafScrollContainerRef} className="mushaf-scroll-container" style={{
                    display: 'flex',
                    flexDirection: 'column',
                    overflowX: 'hidden',
                    overflowY: 'auto',
                    gap: '3rem',
                    scrollBehavior: 'smooth',
                    scrollSnapType: 'y mandatory',
                    padding: '2rem',
                    pointerEvents: penMode ? 'none' : 'auto'
                  }}>
                  <style jsx>{`
                    @import url('https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap');

                    .mushaf-page-text {
                      text-align-last: start;
                    }

                    .mushaf-page-content {
                      text-align: justify;
                      text-justify: kashida;
                    }

                    .mushaf-scroll-container::-webkit-scrollbar {
                      width: 10px;
                    }

                    .mushaf-scroll-container::-webkit-scrollbar-track {
                      background: #f1f1f1;
                      border-radius: 4px;
                    }

                    .mushaf-scroll-container::-webkit-scrollbar-thumb {
                      background: #40826D;
                      border-radius: 4px;
                    }

                    .mushaf-scroll-container::-webkit-scrollbar-thumb:hover {
                      background: #2d5f4e;
                    }
                  `}</style>

                  {(() => {
                    // Render ALL 604 pages for continuous scrolling
                    const totalPages = 604; // Total Quran pages
                    const pagesToRender = Array.from({length: totalPages}, (_, i) => i + 1);

                    return pagesToRender.map((pageNum) => {
                      // Get the page data for this specific page
                      const pageData = getPageContent(pageNum);
                      if (!pageData) return <div key={pageNum}>Loading page...</div>;

                      // Load ayahs for THIS specific page regardless of currentSurah
                      // This ensures ALL pages show content, not just the selected Surah
                      let pageAyahs: any[] = [];

                      // CRITICAL FIX: Load Surah data based on the PAGE, not currentSurah
                      // This makes all 604 pages display content when scrolling
                      if (pageData.surahStart === pageData.surahEnd) {
                        // Single Surah on this page
                        const surahNumber = pageData.surahStart;
                        const scriptId = selectedScript || 'uthmani-hafs';
                        const cacheKey = `${scriptId}-${surahNumber}`;

                        // Check cache first - VALIDATE that cached ayahs have surah property
                        const cachedSurah = surahCache[cacheKey];
                        const isCacheValid = cachedSurah && cachedSurah.ayahs && cachedSurah.ayahs.length > 0 && cachedSurah.ayahs[0].surah !== undefined;

                        if (isCacheValid) {
                          // Use cached Surah data
                          pageAyahs = cachedSurah.ayahs.filter((ayah: any, idx: number) => {
                            const ayahNumber = idx + 1;
                            return ayahNumber >= pageData.ayahStart && ayahNumber <= pageData.ayahEnd;
                          });
                        } else if (surahNumber === currentSurah && quranText && quranText.number === currentSurah) {
                          // Fallback to current loaded Surah if not in cache yet
                          pageAyahs = quranText.ayahs.filter((ayah: any, idx: number) => {
                            const ayahNumber = idx + 1;
                            return ayahNumber >= pageData.ayahStart && ayahNumber <= pageData.ayahEnd;
                          });
                        } else {
                          // Surah not loaded yet - trigger async load
                          // Display placeholder while loading
                          pageAyahs = [];

                          // Asynchronously load and cache this Surah (fire and forget)
                          if (!surahCache[cacheKey]) {
                            getSurahByNumber(scriptId, surahNumber).then((surahData) => {
                              if (surahData && surahData.ayahs) {
                                setSurahCache(prev => ({
                                  ...prev,
                                  [cacheKey]: {
                                    number: surahNumber,
                                    surah: surahData.name,
                                    ayahs: surahData.ayahs.map((ayah: any) => ({
                                      number: ayah.numberInSurah,
                                      surah: surahNumber,  // CRITICAL: Track which Surah this ayah belongs to
                                      text: ayah.text,
                                      words: ayah.text.split(' ')
                                    }))
                                  }
                                }));
                              }
                            }).catch((error) => {
                              console.warn(`Failed to load Surah ${surahNumber}:`, error);
                            });
                          }
                        }
                      } else {
                        // Multi-Surah page - CRITICAL FIX: Load ALL Surahs, not just start/end
                        // Pages like 604 have 3 Surahs [112, 113, 114], old code only loaded 112 and 114!
                        const scriptId = selectedScript || 'uthmani-hafs';

                        // Use surahsOnPage array to get ALL Surahs on this page
                        const surahsOnThisPage = pageData.surahsOnPage || [];

                        // Check if ALL Surahs are cached AND VALID (have surah property)
                        const allSurahsCached = surahsOnThisPage.every(surahNum => {
                          const cached = surahCache[`${scriptId}-${surahNum}`];
                          return cached && cached.ayahs && cached.ayahs.length > 0 && cached.ayahs[0].surah !== undefined;
                        });

                        if (allSurahsCached && surahsOnThisPage.length > 0) {
                          // All Surahs cached - build pageAyahs from ALL Surahs
                          const allAyahsOnPage: any[] = [];

                          surahsOnThisPage.forEach((surahNum, index) => {
                            const cacheKey = `${scriptId}-${surahNum}`;
                            const surah = surahCache[cacheKey];

                            if (surah) {
                              if (index === 0) {
                                // FIRST Surah: include ayahs from ayahStart onwards
                                const ayahs = surah.ayahs.filter((ayah: any) =>
                                  ayah.number >= pageData.ayahStart
                                );
                                allAyahsOnPage.push(...ayahs);
                              } else if (index === surahsOnThisPage.length - 1) {
                                // LAST Surah: include ayahs up to ayahEnd
                                const ayahs = surah.ayahs.filter((ayah: any) =>
                                  ayah.number <= pageData.ayahEnd
                                );
                                allAyahsOnPage.push(...ayahs);
                              } else {
                                // MIDDLE Surahs: include ALL ayahs (complete Surah)
                                allAyahsOnPage.push(...surah.ayahs);
                              }
                            }
                          });

                          pageAyahs = allAyahsOnPage;
                        } else {
                          // Not all Surahs cached - show placeholder
                          pageAyahs = [];

                          // Trigger async loads for ALL missing Surahs
                          surahsOnThisPage.forEach(surahNum => {
                            const cacheKey = `${scriptId}-${surahNum}`;

                            if (!surahCache[cacheKey]) {
                              getSurahByNumber(scriptId, surahNum).then((surahData) => {
                                if (surahData && surahData.ayahs) {
                                  setSurahCache(prev => ({
                                    ...prev,
                                    [cacheKey]: {
                                      number: surahNum,
                                      surah: surahData.name,
                                      ayahs: surahData.ayahs.map((ayah: any) => ({
                                        number: ayah.numberInSurah,
                                        surah: surahNum,  // CRITICAL: Track which Surah this ayah belongs to
                                        text: ayah.text,
                                        words: ayah.text.split(' ')
                                      }))
                                    }
                                  }));
                                }
                              }).catch((error) => {
                                console.warn(`Failed to load Surah ${surahNum}:`, error);
                              });
                            }
                          });
                        }
                      }

                      // Calculate total page content length for DYNAMIC FONT SIZING
                      // CRITICAL UX RULE: Everything must fit on screen WITHOUT SCROLLING
                      const pageContent = pageAyahs.map((ayah: any) =>
                        ayah.words.map((word: any) => word.text).join(' ')
                      ).join(' ');

                      // Render the page with traditional Mushaf formatting
                      const scriptClass = `script-${selectedScript || 'uthmani-hafs'}`;
                      const isCurrentPage = pageNum === currentMushafPage;

                      return (
                        <div
                          key={pageNum}
                          id={`mushaf-page-${pageNum}`}
                          className={`mushaf-page-content mushaf-text ${scriptClass}`}
                          style={{
                            position: 'relative',  // Enable absolute positioning for page number
                            scrollSnapAlign: 'center',
                            flexShrink: 0,
                            width: '38vw',  // NARROWER: More vertical/portrait-like proportions
                            maxWidth: '480px',  // REDUCED: Traditional book page width
                            minHeight: '65vh',  // INCREASED: Use available bottom space
                            maxHeight: '72vh',  // INCREASED: Taller to look like a real page
                            overflow: 'hidden',  // NO scrolling inside container
                            margin: '0',
                            padding: '0.8rem 1rem',
                            backgroundColor: '#FFFFFF',
                            borderRadius: '8px',
                            boxShadow: isCurrentPage
                              ? '0 12px 32px rgba(0,0,0,0.6), inset 0 0 0 2px rgba(64, 130, 109, 0.5), 0 4px 15px rgba(0, 0, 0, 0.3)'
                              : '0 8px 24px rgba(0,0,0,0.4), inset 0 0 0 1px rgba(64, 130, 109, 0.3), 0 2px 10px rgba(0, 0, 0, 0.2)',
                            border: '15px solid #40826D',  // 15px thick border on all sides (mushaf-style frame matching reference)
                            opacity: isCurrentPage ? 1 : 0.7,
                            transition: 'opacity 0.3s, box-shadow 0.3s, border 0.3s',
                            ...getDynamicScriptStyling(pageContent, selectedScript || 'uthmani-hafs'),  // DYNAMIC sizing - scales font based on page length
                            transform: `scale(${zoomLevel / 100})`,
                            transformOrigin: 'top center',
                            textAlign: 'right',
                            lineHeight: '1.5'  // Slightly more breathing room with vertical space
                          }}>

                          {pageAyahs.map((ayah: any, ayahIdx: any) => {
                            // CRITICAL FIX: Detect if this is the first ayah of a NEW Surah
                            // This handles pages with multiple Surahs (e.g., page 604 has Surahs 112, 113, 114)
                            const isFirstAyahOfSurah = ayah.number === 1;
                            const isNewSurah = ayahIdx === 0 || pageAyahs[ayahIdx - 1].surah !== ayah.surah;
                            const shouldShowBismillah = isFirstAyahOfSurah && isNewSurah && ayah.surah !== 9;
                            const ayahIndex = quranText.ayahs.indexOf(ayah);
                            return (
                              <React.Fragment key={`ayah-${ayah.surah}-${ayah.number}-${ayahIdx}`}>
                                {/* Display Bismillah before each NEW Surah (except Surah 9) */}
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
                          // Get ALL highlights for this word (multiple colors allowed)
                          const wordHighlights = highlights.filter(
                            h => h.ayahIndex === ayahIndex && h.wordIndex === wordIndex
                          );
                          // Check if any highlight is completed and get appropriate colors
                          const mistakes = wordHighlights.map((h: any) => {
                            // If highlight is marked as completed, show gold color
                            if (h.isCompleted) {
                              return completedType;
                            }
                            // Otherwise show the original mistake color
                            return mistakeTypes.find((m: any) => m.id === h.mistakeType);
                          }).filter(Boolean);

                          // Check if word is in selection range
                          let isInSelection = false;
                          if (isSelecting && selectionStart && selectionEnd) {
                            const minAyah = Math.min(selectionStart.ayahIndex, selectionEnd.ayahIndex);
                            const maxAyah = Math.max(selectionStart.ayahIndex, selectionEnd.ayahIndex);
                            if (ayahIndex >= minAyah && ayahIndex <= maxAyah) {
                              if (ayahIndex === minAyah && ayahIndex === maxAyah) {
                                const minWord = Math.min(selectionStart.wordIndex, selectionEnd.wordIndex);
                                const maxWord = Math.max(selectionStart.wordIndex, selectionEnd.wordIndex);
                                isInSelection = wordIndex >= minWord && wordIndex <= maxWord;
                              } else if (ayahIndex === minAyah) {
                                isInSelection = wordIndex >= Math.min(selectionStart.wordIndex, selectionEnd.wordIndex);
                              } else if (ayahIndex === maxAyah) {
                                isInSelection = wordIndex <= Math.max(selectionStart.wordIndex, selectionEnd.wordIndex);
                              } else {
                                isInSelection = true;
                              }
                            }
                          }

                          return (
                            <span
                              key={`${ayahIndex}-${wordIndex}`}
                              onClick={() => {
                                if (highlightMode) {
                                  // In highlight mode - add/remove highlight
                                  handleTextSelection(ayahIndex, wordIndex);
                                } else if (wordHighlights.length > 0) {
                                  // Click on highlighted text - show notes or handle click
                                  if (noteMode) {
                                    handleHighlightClick(wordHighlights[0].id, wordHighlights);
                                  } else {
                                    handleHighlightClick(wordHighlights[0].id);
                                  }
                                }
                              }}
                              className={`inline cursor-pointer rounded transition-colors select-none ${
                                isInSelection ? 'bg-yellow-600 bg-opacity-40' : ''
                              } ${
                                highlightMode && mistakes.length === 0 && !isInSelection ? 'hover:bg-gray-700 hover:bg-opacity-30' : ''
                              } ${
                                wordHighlights.some((h: any) => notes.some((n: any) => n.highlightIds.includes(h.id))) ? 'ring-2 ring-blue-300 ring-opacity-60' : ''
                              } ${
                                noteMode && wordHighlights.some((h: any) => selectedHighlightsForNote.includes(h.id)) ? 'ring-4 ring-green-400 shadow-lg' : ''
                              } ${
                                noteMode && wordHighlights.length > 0 && !wordHighlights.some((h: any) => selectedHighlightsForNote.includes(h.id)) ? 'opacity-70 hover:opacity-100' : ''
                              }`}
                              style={{
                                position: 'relative',
                                color: '#000000',  // ALWAYS black text, never change
                                paddingLeft: '2px',    // Horizontal padding
                                paddingRight: '2px',   // Horizontal padding
                                lineHeight: '1.3',     // Line height
                                display: 'inline',     // Inline display
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
                              {word}{' '}
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
                                    <sup className="text-blue-500 ml-0.5" style={{ fontSize: '0.5em' }}>
                                      <MessageSquare className="w-2.5 h-2.5 inline" />
                                    </sup>
                                  );
                                }
                                return null;
                              })()}
                            </span>
                          );
                        })}
                        {/* Ayah Number - Traditional Mushaf Style with Islamic Octagonal Frame */}
                        <span
                          className="ayah-number inline-flex items-center justify-center mx-2"
                        >
                          {toFarsiNumber(ayah.number)}
                        </span>
                        {/* Colored Boxes beside ayah number - one for each mistake type */}
                        {highlightMode && (() => {
                          // Get all mistake types available
                          const availableTypes = mistakeTypes.filter((m: any) =>
                            m.id === 'recap' || m.id === 'homework' || m.id === 'tajweed'
                          );

                          return availableTypes.map((mistakeType: any) => {
                            // Check if this ayah has this color applied
                            const hasThisColor = highlights.some(
                              h => h.ayahIndex === ayahIndex && h.mistakeType === mistakeType.id && h.isFullAyah
                            );

                            // Only show box if currently selecting this type
                            if (selectedMistakeType !== mistakeType.id) return null;

                            return (
                              <button
                                key={mistakeType.id}
                                onClick={() => highlightEntireAyah(ayahIndex)}
                                className={`inline-flex mx-0.5 transition-all ${hasThisColor ? 'opacity-80 hover:opacity-100' : 'opacity-40 hover:opacity-70'}`}
                                style={{
                                  width: hasThisColor ? '10px' : '8px',
                                  height: hasThisColor ? '16px' : '14px',
                                  borderRadius: '2px',
                                  backgroundColor: mistakeType.color === 'bg-purple-500' ? 'rgb(168, 85, 247)' :
                                    mistakeType.color === 'bg-green-500' ? 'rgb(34, 197, 94)' :
                                    'rgb(249, 115, 22)',
                                  border: hasThisColor ? '1.5px solid rgba(255,255,255,0.6)' : '1px solid rgba(0,0,0,0.2)',
                                  boxShadow: hasThisColor ? '0 1px 3px rgba(0,0,0,0.3)' : '0 1px 2px rgba(0,0,0,0.2)',
                                  verticalAlign: 'middle'
                                }}
                                title={hasThisColor ? `Remove ${mistakeType.id} highlight` : `Highlight entire ayah as ${mistakeType.id}`}
                              />
                            );
                          });
                        })()}{' '}
                              </span>
                              </React.Fragment>
                            );
                          })}

                          {/* Farsi Page Number at Bottom - Simple clean number */}
                          <div
                            style={{
                              position: 'absolute',
                              bottom: '8px',  // 8px accounts for container padding to get 3-5px from canvas edge
                              left: '50%',
                              transform: 'translateX(-50%)',
                              textAlign: 'center'
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "'Scheherazade New', 'Tahoma', serif",
                                fontSize: '22px',
                                fontWeight: '600',
                                color: '#1a5632',
                                direction: 'rtl'
                              }}
                            >
                              {toFarsiNumber(pageNum)}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                  </div>
                  {/* End Horizontal Scroll Container */}
                </div>

                </div>
              </div>
            </div>

            {/* Right Panel - Notes */}
            <div className="col-span-1 space-y-3">
              {/* Notes Section */}
              <div className="bg-white rounded-lg shadow-sm p-3">
                <h3 className="font-semibold mb-2 text-sm flex items-center">
                  <StickyNote className="w-3 h-3 mr-1" />
                  Notes
                </h3>
                <div className="space-y-2">
                  {!noteMode ? (
                    <button 
                      onClick={handleAddNote}
                      className="w-full p-2 border-2 border-dashed border-gray-300 rounded-md hover:border-gray-400 transition text-xs text-gray-600"
                    >
                      <Plus className="w-3 h-3 inline mr-1" />
                      Add Note
                    </button>
                  ) : (
                    <div className="p-2 bg-green-50 border-2 border-green-500 rounded-md text-xs">
                      <p className="text-green-700 font-medium mb-1">
                        Note Mode Active
                      </p>
                      <p className="text-green-600">
                        Click highlights to select
                      </p>
                      {selectedHighlightsForNote.length > 0 && (
                        <p className="text-green-700 font-bold mt-1">
                          {selectedHighlightsForNote.length} selected
                        </p>
                      )}
                      <button
                        onClick={() => {
                          setNoteMode(false);
                          setSelectedHighlightsForNote([]);
                        }}
                        className="w-full mt-2 p-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                  <div className="max-h-96 overflow-y-auto space-y-2">
                    {notes.map((note: any) => (
                      <div key={note.id} className="p-2 bg-gray-50 rounded-md">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            {note.type === 'text' ? (
                              <p className="text-xs text-gray-700">{note.content}</p>
                            ) : (
                              <div className="flex items-center text-xs text-blue-600">
                                <Mic className="w-3 h-3 mr-1" />
                                Voice Note
                              </div>
                            )}
                            <p className="text-xs text-gray-500 mt-1">
                              {note.highlightIds.length} highlight{note.highlightIds.length > 1 ? 's' : ''}
                            </p>
                          </div>
                          <button
                            onClick={() => setNotes(notes.filter((n: any) => n.id !== note.id))}
                            className="text-gray-400 hover:text-red-600"
                          >
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Pen Annotation Controls */}
              <div className="mb-4">
                <h3 className="font-semibold mb-2 text-sm flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                  </svg>
                  Pen Tool
                </h3>
                <div className="space-y-2">
                  <button
                    onClick={() => {
                      setPenMode(!penMode);
                      if (!penMode) {
                        setHighlightMode(false);
                      }
                    }}
                    className={`w-full p-2 rounded-md border text-left transition text-xs ${
                      penMode
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{penMode ? 'Pen Active' : 'Enable Pen'}</span>
                      <div className={`w-3 h-3 rounded-full ${penMode ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                    </div>
                  </button>

                  {/* Pen Controls - Only show when pen mode is active */}
                  {penMode && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-3">
                      <div className="text-xs font-semibold text-gray-700 mb-2">Pen Controls</div>

                      {/* Color Picker */}
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Color</div>
                        <div className="flex gap-1 flex-wrap">
                          {['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FF00FF', '#000000'].map(color => (
                            <button
                              key={color}
                              className={`w-6 h-6 rounded border-2 transition ${
                                penColor === color ? 'border-gray-400 scale-110' : 'border-transparent'
                              }`}
                              style={{ backgroundColor: color }}
                              onClick={() => {
                                setPenColor(color);
                                setEraserMode(false);
                              }}
                              title={color}
                            />
                          ))}
                        </div>
                      </div>

                      {/* Width Selector */}
                      <div>
                        <div className="text-xs text-gray-600 mb-1">Width: {penWidth}px</div>
                        <input
                          type="range"
                          min="1"
                          max="10"
                          value={penWidth}
                          onChange={(e) => setPenWidth(parseInt(e.target.value))}
                          className="w-full"
                        />
                      </div>

                      {/* Tool Buttons */}
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEraserMode(!eraserMode)}
                          className={`flex-1 px-2 py-1.5 rounded text-xs font-medium transition ${
                            eraserMode
                              ? 'bg-orange-500 text-white'
                              : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                          }`}
                          title="Eraser"
                        >
                          {eraserMode ? '✓ Eraser' : 'Eraser'}
                        </button>
                        <button
                          onClick={() => {
                            if ((window as any).__clearPenAnnotations) {
                              (window as any).__clearPenAnnotations();
                            }
                          }}
                          className="flex-1 px-2 py-1.5 rounded text-xs font-medium bg-white border border-gray-300 text-gray-700 hover:bg-red-50 hover:border-red-300 transition"
                          title="Clear all"
                        >
                          Clear
                        </button>
                      </div>

                      {/* Save Button */}
                      <button
                        onClick={() => {
                          if ((window as any).__savePenAnnotations) {
                            (window as any).__savePenAnnotations();
                          }
                        }}
                        disabled={(window as any).__penAnnotationsSaving || !(window as any).__penAnnotationsHaveChanges}
                        className="w-full px-3 py-2 rounded text-xs font-medium bg-blue-500 text-white hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
                        title="Save annotations"
                      >
                        {(window as any).__penAnnotationsSaving ? 'Saving...' : 'Save Annotations'}
                      </button>

                      {(window as any).__penAnnotationsHaveChanges && !(window as any).__penAnnotationsSaving && (
                        <div className="text-xs text-orange-600 flex items-center gap-1">
                          <span>●</span>
                          <span>Unsaved changes</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Floating Note Creation Button - Shows in note mode when highlights are selected */}
      {noteMode && selectedHighlightsForNote.length > 0 && (
        <div className="fixed bottom-8 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-white rounded-full shadow-2xl p-4 flex items-center space-x-4">
            <div className="text-sm font-medium text-gray-700">
              {selectedHighlightsForNote.length} highlight{selectedHighlightsForNote.length > 1 ? 's' : ''} selected
            </div>
            <button
              onClick={(e) => {
                console.log('🎯 CREATE NOTE BUTTON CLICKED');
                console.log('📝 selectedHighlightsForNote (UI IDs):', selectedHighlightsForNote);
                console.log('🔍 noteMode:', noteMode);
                console.log('🔍 showNotesModal BEFORE:', showNotesModal);
                console.log('🔍 selectedHighlightForNotes BEFORE:', selectedHighlightForNotes);

                // Prevent any event propagation
                e.stopPropagation();
                e.preventDefault();

                // Open NotesPanel modal for the first selected highlight
                if (selectedHighlightsForNote.length > 0) {
                  // selectedHighlightsForNote contains UI IDs, we need to find the actual highlight object
                  const firstHighlightUIId = selectedHighlightsForNote[0];
                  console.log('🔍 First UI ID:', firstHighlightUIId);

                  // Find the highlight object from the highlights array
                  const highlightObject = highlights.find((h: any) => h.id === firstHighlightUIId);
                  console.log('🔍 Found highlight object:', highlightObject);

                  if (highlightObject && highlightObject.dbId) {
                    console.log('✅ Database ID (dbId):', highlightObject.dbId);

                    setSelectedHighlightForNotes(highlightObject.dbId);
                    setShowNotesModal(true);

                    console.log('✅ State setters called with dbId');

                    // Check state after a brief delay
                    setTimeout(() => {
                      console.log('🔍 showNotesModal AFTER (delayed):', showNotesModal);
                      console.log('🔍 selectedHighlightForNotes AFTER (delayed):', selectedHighlightForNotes);
                    }, 100);
                  } else {
                    console.error('❌ Highlight object not found or missing dbId!', {
                      firstHighlightUIId,
                      highlightObject,
                      allHighlights: highlights
                    });
                    alert('Error: Selected highlight does not have a database ID. Please try refreshing the page.');
                  }
                } else {
                  console.error('❌ No highlights selected!');
                }
              }}
              className="px-6 py-2 bg-green-600 text-white rounded-full hover:bg-green-700 flex items-center space-x-2 font-medium"
            >
              <StickyNote className="w-4 h-4" />
              <span>Create Note</span>
            </button>
            <button
              onClick={() => {
                setNoteMode(false);
                setSelectedHighlightsForNote([]);
              }}
              className="p-2 bg-gray-200 rounded-full hover:bg-gray-300"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Notes Popup - WhatsApp Style Conversation */}
      {showNotePopup && (
        <div 
          className="fixed inset-0 z-40" 
          onClick={() => setShowNotePopup(null)}
        >
          <div 
            className="absolute bg-white rounded-xl shadow-2xl max-w-md w-full"
            style={{
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              maxHeight: '80vh'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-green-600 text-white px-4 py-3 rounded-t-xl flex items-center justify-between">
              <div className="flex items-center">
                <StickyNote className="w-5 h-5 mr-2" />
                <div>
                  <h4 className="font-semibold">Highlight Notes</h4>
                  <p className="text-xs text-green-100">{showNotePopup.notes.length} message{showNotePopup.notes.length > 1 ? 's' : ''}</p>
                </div>
              </div>
              <button 
                onClick={() => setShowNotePopup(null)}
                className="p-1.5 hover:bg-green-700 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Messages */}
            <div className="p-4 space-y-3 max-h-96 overflow-y-auto bg-gray-50" 
                 style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" xmlns="http://www.w3.org/2000/svg"%3E%3Cdefs%3E%3Cpattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse"%3E%3Cpath d="M 60 0 L 0 0 0 60" fill="none" stroke="%23f0f0f0" stroke-width="1"/%3E%3C/pattern%3E%3C/defs%3E%3Crect width="100%25" height="100%25" fill="url(%23grid)"/%3E%3C/svg%3E")' }}>
              {showNotePopup.notes.map((note: any) => {
                const isTeacher = note.author === 'Teacher';
                return (
                  <div key={note.id} className={`flex ${isTeacher ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-xs ${isTeacher ? 'order-2' : ''}`}>
                      <div className={`rounded-lg px-4 py-2 shadow-sm ${
                        isTeacher ? 'bg-green-100 rounded-br-none' : 'bg-white rounded-bl-none'
                      }`}>
                        {/* Author */}
                        <p className={`text-xs font-semibold mb-1 ${
                          isTeacher ? 'text-green-700' : 'text-blue-700'
                        }`}>
                          {note.author || 'Student'}
                        </p>
                        
                        {/* Content */}
                        {note.type === 'text' ? (
                          <p className="text-sm text-gray-800">{note.content}</p>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <button 
                              onClick={() => {
                                if (playingAudioId === note.id) {
                                  // Stop playing
                                  if (currentAudio) {
                                    currentAudio.pause();
                                    currentAudio.currentTime = 0;
                                  }
                                  setPlayingAudioId(null);
                                  setCurrentAudio(null);
                                } else {
                                  // Stop any other playing audio
                                  if (currentAudio) {
                                    currentAudio.pause();
                                    currentAudio.currentTime = 0;
                                  }
                                  // Start playing this audio
                                  if (note.audioUrl) {
                                    const audio = new Audio(note.audioUrl);
                                    audio.play();
                                    audio.onended = () => {
                                      setPlayingAudioId(null);
                                      setCurrentAudio(null);
                                    };
                                    setCurrentAudio(audio);
                                    setPlayingAudioId(note.id);
                                  }
                                }
                              }}
                              className={`p-2 rounded-full transition ${
                                playingAudioId === note.id 
                                  ? 'bg-green-500 hover:bg-green-600 animate-pulse' 
                                  : 'bg-white hover:bg-gray-100'
                              }`}
                            >
                              {playingAudioId === note.id ? (
                                <Pause className="w-4 h-4 text-white" />
                              ) : (
                                <Play className="w-4 h-4 text-green-600" />
                              )}
                            </button>
                            <div className="flex-1">
                              <div className={`h-8 rounded-full flex items-center px-3 relative overflow-hidden ${
                                playingAudioId === note.id
                                  ? 'bg-gradient-to-r from-green-400 to-green-600'
                                  : 'bg-gradient-to-r from-green-300 to-green-500'
                              }`}>
                                {/* Animated wave effect when playing */}
                                {playingAudioId === note.id && (
                                  <div className="absolute inset-0 flex items-center justify-center">
                                    <div className="flex items-center space-x-1">
                                      <Volume2 className="w-4 h-4 text-white animate-pulse mr-2" />
                                      {[1, 2, 3, 4, 5].map((i: any) => (
                                        <div
                                          key={i}
                                          className="bg-white/90 rounded-full animate-bounce"
                                          style={{
                                            width: '2px',
                                            height: `${12 + (i % 2 === 0 ? 8 : 4)}px`,
                                            animationDelay: `${i * 0.1}s`,
                                            animationDuration: '1s'
                                          }}
                                        />
                                      ))}
                                    </div>
                                  </div>
                                )}
                                <Mic className="w-3 h-3 text-white mr-2 relative z-10" />
                                <span className="text-xs text-white relative z-10">
                                  {playingAudioId === note.id ? 'Playing...' : 'Voice Note'}
                                </span>
                              </div>
                            </div>
                          </div>
                        )}
                        
                        {/* Timestamp */}
                        <p className={`text-xs mt-1 ${
                          isTeacher ? 'text-green-600' : 'text-gray-500'
                        }`}>
                          {new Date(note.timestamp).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit',
                            hour12: true 
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Add Reply - Text and Voice */}
            <div className="border-t p-3 bg-white rounded-b-xl">
              <div className="flex items-center space-x-2">
                {/* Voice Recording Button */}
                <button
                  onClick={async () => {
                    if (!isRecording) {
                      try {
                        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
                        const recorder = new MediaRecorder(stream);
                        const chunks: Blob[] = [];
                        
                        recorder.ondataavailable = (e: BlobEvent) => chunks.push(e.data);
                        recorder.onstop = () => {
                          const blob = new Blob(chunks, { type: 'audio/webm' });
                          const audioUrl = URL.createObjectURL(blob);
                          
                          const newNote = {
                            id: Date.now(),
                            highlightIds: [showNotePopup.highlightId],
                            type: 'voice',
                            content: 'Voice Note',
                            audioUrl: audioUrl,
                            timestamp: new Date().toISOString(),
                            author: 'Teacher'
                          };
                          setNotes([...notes, newNote]);
                          setShowNotePopup({
                            ...showNotePopup,
                            notes: [...showNotePopup.notes, newNote]
                          });
                        };
                        
                        recorder.start();
                        setMediaRecorder(recorder);
                        setIsRecording(true);
                        
                        // Auto-stop after 60 seconds
                        setTimeout(() => {
                          if (recorder.state !== 'inactive') {
                            recorder.stop();
                            recorder.stream.getTracks().forEach((track: any) => track.stop());
                            setIsRecording(false);
                          }
                        }, 60000);
                      } catch (err) {
                        console.error('Error accessing microphone:', err);
                        alert('Please allow microphone access to record voice notes');
                      }
                    } else {
                      if (mediaRecorder && mediaRecorder.state !== 'inactive') {
                        mediaRecorder.stop();
                        mediaRecorder.stream.getTracks().forEach((track: any) => track.stop());
                        setIsRecording(false);
                      }
                    }
                  }}
                  className={`p-2 rounded-full transition ${
                    isRecording 
                      ? 'bg-red-500 hover:bg-red-600 animate-pulse' 
                      : 'bg-gray-200 hover:bg-gray-300'
                  }`}
                  title={isRecording ? "Stop recording" : "Record voice note"}
                >
                  {isRecording ? (
                    <MicOff className="w-4 h-4 text-white" />
                  ) : (
                    <Mic className="w-4 h-4 text-gray-600" />
                  )}
                </button>
                
                {/* Text Input */}
                <input 
                  type="text" 
                  placeholder={isRecording ? "Recording..." : "Type a message..."}
                  disabled={isRecording}
                  className={`flex-1 px-3 py-2 border rounded-full text-sm ${
                    isRecording ? 'bg-gray-100 text-gray-400' : ''
                  }`}
                  onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
                    const target = e.target as HTMLInputElement;
                    if (e.key === 'Enter' && target.value.trim() && !isRecording) {
                      const newNote = {
                        id: Date.now(),
                        highlightIds: [showNotePopup.highlightId],
                        type: 'text',
                        content: target.value,
                        timestamp: new Date().toISOString(),
                        author: 'Teacher'
                      };
                      setNotes([...notes, newNote]);
                      setShowNotePopup({
                        ...showNotePopup,
                        notes: [...showNotePopup.notes, newNote]
                      });
                      target.value = '';
                    }
                  }}
                />
                
                {/* Send Button */}
                <button 
                  className="p-2 bg-green-600 text-white rounded-full hover:bg-green-700"
                  onClick={(e) => {
                    const input = e.currentTarget.previousElementSibling as HTMLInputElement | null;
                    if (input && input.value && input.value.trim() && !isRecording) {
                      const newNote = {
                        id: Date.now(),
                        highlightIds: [showNotePopup.highlightId],
                        type: 'text',
                        content: input.value,
                        timestamp: new Date().toISOString(),
                        author: 'Teacher'
                      };
                      setNotes([...notes, newNote]);
                      setShowNotePopup({
                        ...showNotePopup,
                        notes: [...showNotePopup.notes, newNote]
                      });
                      input.value = '';
                    }
                  }}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              {isRecording && (
                <p className="text-xs text-red-500 mt-2 text-center animate-pulse">
                  Recording... Click microphone to stop
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* NotesPanel Modal - WhatsApp-style conversation */}
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