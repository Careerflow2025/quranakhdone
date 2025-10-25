'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { useStudentManagement } from '@/hooks/useStudentManagement';
import { 
  getQuranByScriptId, 
  getSurahByNumber, 
  getAllQuranScripts, 
  getScriptStyling
} from '@/data/quran/cleanQuranLoader';
import { surahList } from '@/data/quran/surahData';
import { mushafPages, getPageContent, getPageBySurahAyah, TOTAL_MUSHAF_PAGES } from '@/data/completeMushafPages';
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
  const [highlights, setHighlights] = useState<any[]>([]);
  const [notes, setNotes] = useState<any[]>([]);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [noteText, setNoteText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<any>(null);
  const [audioBlob, setAudioBlob] = useState<any>(null);
  const [playingAudioId, setPlayingAudioId] = useState<any>(null);
  const [currentAudio, setCurrentAudio] = useState<any>(null);
  const [selectedHighlightsForNote, setSelectedHighlightsForNote] = useState<any[]>([]);
  const [showNotePopup, setShowNotePopup] = useState<any>(null);
  const [noteMode, setNoteMode] = useState(false);
  const [showSurahDropdown, setShowSurahDropdown] = useState(false);
  const [currentMushafPage, setCurrentMushafPage] = useState(1);
  const [isSelecting, setIsSelecting] = useState(false);
  const [selectionStart, setSelectionStart] = useState<any>(null);
  const [selectionEnd, setSelectionEnd] = useState<any>(null);
  
  // Pen Annotation States
  const [penMode, setPenMode] = useState(false);
  const [penColor, setPenColor] = useState('#10b981'); // Default green
  const [penThickness, setPenThickness] = useState(2);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawings, setDrawings] = useState<any[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [currentPath, setCurrentPath] = useState<any[]>([]);
  const [eraserMode, setEraserMode] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(100); // Zoom percentage, default 100%

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

      // End session when component unmounts
      if (sessionStartTime) {
        const sessionEnd = new Date();
        const totalDuration = (sessionEnd.getTime() - sessionStartTime.getTime()) / 1000 / 60; // minutes
        console.log('Session ended. Total duration:', totalDuration, 'minutes');
        console.log('Pages viewed:', pageViews);
      }
    };
  }, [lastActivityTime, isIdle, sessionStartTime, pageViews]);

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

  // Update Quran text when Surah or Script changes
  useEffect(() => {
    const scriptId = selectedScript || 'uthmani-hafs';
    const surahData = getSurahByNumber(scriptId, currentSurah);
    const surahInfo = allSurahs.find((s: any) => s.number === currentSurah);
    
    if (surahData && surahData.ayahs && surahData.ayahs.length > 0) {
      // Use the actual Quran data
      setQuranText({
        surah: surahData.name || surahInfo?.nameArabic || 'الفاتحة',
        ayahs: surahData.ayahs.map((ayah: any) => ({
          number: ayah.numberInSurah,
          text: ayah.text,
          words: ayah.text.split(' ')
        }))
      });
      // Reset to first page when Surah changes
      // Set to the correct mushaf page for this surah
      const mushafPage = getPageBySurahAyah(currentSurah, 1);
      setCurrentMushafPage(mushafPage);
    } else {
      // Fallback for any loading issues
      setQuranText({
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
    { id: 'letter', name: 'Letter', color: 'brown', bgColor: 'bg-yellow-900', textColor: 'text-yellow-100' },
    { id: 'completed', name: 'Completed', color: 'gold', bgColor: 'bg-yellow-400', textColor: 'text-yellow-900' }
  ];

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

  // Handle Script Selection
  const handleScriptSelect = (scriptId: any) => {
    if (!scriptLocked) {
      setSelectedScript(scriptId);
    }
  };

  const lockScriptSelection = () => {
    if (selectedScript) {
      setScriptLocked(true);
      alert(`Script locked to: ${quranScripts.find((s: any) => s.id === selectedScript)?.name}`);
    }
  };

  // Handle Text Selection for Highlighting
  const handleTextSelection = (ayahIndex: number, wordIndex: number, isMouseDown: boolean = false, isMouseUp: boolean = false) => {
    if (highlightMode && selectedMistakeType) {
      // For all types - simple click to toggle single word
      if (!isMouseDown && !isMouseUp) {
        toggleSingleWord(ayahIndex, wordIndex);
      }
    }
  };

  // Toggle single word highlight - allows multiple colors on same word
  const toggleSingleWord = (ayahIndex: number, wordIndex: number) => {
    const existingHighlight = highlights.find(
      h => h.ayahIndex === ayahIndex && h.wordIndex === wordIndex && h.mistakeType === selectedMistakeType
    );
    
    if (existingHighlight) {
      // Remove only this specific color highlight
      setHighlights(highlights.filter((h: any) => h.id !== existingHighlight.id));
    } else {
      // Add new highlight (allows multiple colors on same word)
      const newHighlight = {
        id: Date.now(),
        ayahIndex,
        wordIndex,
        mistakeType: selectedMistakeType,
        color: mistakeTypes.find((m: any) => m.id === selectedMistakeType)?.color,
        timestamp: new Date().toISOString(),
        isCompleted: false
      };
      setHighlights([...highlights, newHighlight]);
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
  const highlightEntireAyah = (ayahIndex: number) => {
    if (highlightMode && (selectedMistakeType === 'recap' || selectedMistakeType === 'homework' || selectedMistakeType === 'tajweed')) {
      const ayahWords = quranText.ayahs[ayahIndex]?.words?.length || 0;
      const newHighlights = [];
      
      for (let wordIdx = 0; wordIdx < ayahWords; wordIdx++) {
        const exists = highlights.some(
          h => h.ayahIndex === ayahIndex && h.wordIndex === wordIdx && h.mistakeType === selectedMistakeType
        );
        
        if (!exists) {
          newHighlights.push({
            id: Date.now() + Math.random(),
            ayahIndex,
            wordIndex: wordIdx,
            mistakeType: selectedMistakeType,
            color: mistakeTypes.find((m: any) => m.id === selectedMistakeType)?.color,
            timestamp: new Date().toISOString(),
            isCompleted: false
          });
        }
      }
      
      if (newHighlights.length > 0) {
        setHighlights([...highlights, ...newHighlights]);
      } else {
        // If all words are already highlighted, remove them all
        setHighlights(highlights.filter((h: any) => !(h.ayahIndex === ayahIndex && h.mistakeType === selectedMistakeType)));
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

  const saveNote = () => {
    if ((noteText.trim() || audioBlob) && selectedHighlightsForNote.length > 0) {
      const newNote = {
        id: Date.now(),
        highlightIds: selectedHighlightsForNote,
        type: audioBlob ? 'voice' : 'text',
        content: noteText || 'Voice Note',
        audioUrl: audioBlob ? URL.createObjectURL(audioBlob) : null,
        timestamp: new Date().toISOString(),
        author: 'Teacher' // You can change this based on actual user
      };
      setNotes([...notes, newNote]);
      setNoteText('');
      setShowNoteModal(false);
      setIsRecording(false);
      setAudioBlob(null);
      setSelectedHighlightsForNote([]);
      setNoteMode(false);
    }
  };

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
      // Normal mode, show notes popup if notes exist
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

  // Simulate some completed homework (green highlights marked as gold)
  useEffect(() => {
    // When component mounts, check if there are any homework highlights that should be completed
    // This would normally come from the database/API
    const completedHomeworkIds = ['HW001', 'HW002']; // Example IDs from teacher dashboard

    // Mark some homework highlights as completed for demonstration
    const homeworkHighlights = highlights.filter((h: any) => h.mistakeType === 'homework');
    if (homeworkHighlights.length > 0) {
      // Mark first few homework highlights as completed
      const updatedHighlights = highlights.map((h: any, index: any) => {
        if (h.mistakeType === 'homework' && index < 2) {
          return { ...h, isCompleted: true };
        }
        return h;
      });
      if (JSON.stringify(updatedHighlights) !== JSON.stringify(highlights)) {
        setHighlights(updatedHighlights);
      }
    }
  }, []);

  // Canvas Drawing Functions
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!penMode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const scale = zoomLevel / 100;

    // Set canvas actual size to match the scaled size
    canvas.width = rect.width / scale;
    canvas.height = rect.height / scale;

    // Redraw existing content after resize
    redrawCanvas();

    let x, y;
    if ('touches' in e) {
      x = (e.touches[0].clientX - rect.left) / scale;
      y = (e.touches[0].clientY - rect.top) / scale;
    } else {
      x = (e.clientX - rect.left) / scale;
      y = (e.clientY - rect.top) / scale;
    }
    
    setIsDrawing(true);
    setCurrentPath([{ x, y }]);
    
    const ctx = canvas.getContext('2d');
    if (ctx) {
      if (eraserMode) {
        ctx.globalCompositeOperation = 'destination-out';
        ctx.lineWidth = penThickness * 3; // Eraser is wider
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = penColor;
        ctx.lineWidth = penThickness;
      }
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      ctx.moveTo(x, y);
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !penMode || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext('2d');
    const scale = zoomLevel / 100;

    if (!ctx) return;

    let x, y;
    if ('touches' in e) {
      x = (e.touches[0].clientX - rect.left) / scale;
      y = (e.touches[0].clientY - rect.top) / scale;
    } else {
      x = (e.clientX - rect.left) / scale;
      y = (e.clientY - rect.top) / scale;
    }
    
    if (eraserMode) {
      ctx.globalCompositeOperation = 'destination-out';
      ctx.lineWidth = penThickness * 3;
    } else {
      ctx.globalCompositeOperation = 'source-over';
      ctx.strokeStyle = penColor;
      ctx.lineWidth = penThickness;
    }
    
    ctx.lineTo(x, y);
    ctx.stroke();
    
    setCurrentPath((prev: any) => [...prev, { x, y }]);
  };

  const stopDrawing = () => {
    if (isDrawing && currentPath.length > 0) {
      setDrawings((prev: any) => [...prev, {
        path: currentPath,
        color: eraserMode ? 'eraser' : penColor,
        thickness: eraserMode ? penThickness * 3 : penThickness,
        page: currentMushafPage,
        surah: currentSurah,
        isEraser: eraserMode
      }]);
    }
    setIsDrawing(false);
    setCurrentPath([]);
  };

  const clearDrawings = () => {
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
    setDrawings(drawings.filter((d: any) =>
      !(d.page === currentMushafPage && d.surah === currentSurah)
    ));
  };

  // Initialize canvas size on mount
  useEffect(() => {
    const initCanvas = () => {
      if (!canvasRef.current) return;
      
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width;
      canvas.height = rect.height;
    };
    
    // Small delay to ensure DOM is ready
    setTimeout(initCanvas, 100);
  }, []);

  // Redraw function
  const redrawCanvas = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Redraw all drawings for current page
    const pageDrawings = drawings.filter((d: any) => 
      d.page === currentMushafPage && d.surah === currentSurah
    );
    
    pageDrawings.forEach((drawing: any) => {
      // Set composite operation based on whether it's an eraser stroke
      if (drawing.isEraser) {
        ctx.globalCompositeOperation = 'destination-out';
      } else {
        ctx.globalCompositeOperation = 'source-over';
        ctx.strokeStyle = drawing.color;
      }
      
      ctx.lineWidth = drawing.thickness;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.beginPath();
      
      drawing.path.forEach((point: any, index: number) => {
        if (index === 0) {
          ctx.moveTo(point.x, point.y);
        } else {
          ctx.lineTo(point.x, point.y);
        }
      });
      
      ctx.stroke();
    });
    
    // Reset to normal drawing mode
    ctx.globalCompositeOperation = 'source-over';
  };

  // Redraw all drawings when page or drawings change
  useEffect(() => {
    // Ensure canvas is properly sized before redrawing
    if (canvasRef.current) {
      const canvas = canvasRef.current;
      const rect = canvas.getBoundingClientRect();
      if (canvas.width !== rect.width || canvas.height !== rect.height) {
        canvas.width = rect.width;
        canvas.height = rect.height;
      }
    }
    redrawCanvas();
  }, [currentMushafPage, currentSurah, drawings]);

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
              <button className="p-2 hover:bg-gray-100 rounded-lg">
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

            {/* Center - Student Info */}
            <div className="text-center">
              <p className="text-sm text-gray-500">{studentInfo.name} • {classInfo?.name || 'No Class'}</p>
              <p className="text-xs text-gray-400">Student Management Dashboard</p>
            </div>
            
            {/* Right Side - Controls */}
            <div className="flex items-center space-x-3">
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
              
              <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center space-x-2">
                <Save className="w-4 h-4" />
                <span>Save</span>
              </button>
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
            <div className="col-span-2 space-y-3">
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
                  
                  {penMode && (
                    <>
                      {/* Eraser Toggle */}
                      <button
                        onClick={() => setEraserMode(!eraserMode)}
                        className={`w-full p-2 rounded-md border text-xs mb-2 ${
                          eraserMode 
                            ? 'border-red-500 bg-red-50 text-red-700' 
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{eraserMode ? '✓ Eraser Active' : 'Eraser'}</span>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2M3 12l6.414 6.414a2 2 0 001.414.586H19a2 2 0 002-2V7a2 2 0 00-2-2h-8.172a2 2 0 00-1.414.586L3 12z" />
                          </svg>
                        </div>
                      </button>
                      
                      {/* Color Selection - 5 colors */}
                      <div className={`grid grid-cols-2 gap-1 ${eraserMode ? 'opacity-50 pointer-events-none' : ''}`}>
                        <button
                          onClick={() => { setPenColor('#10b981'); setEraserMode(false); }}
                          className={`p-1.5 rounded-md border text-xs ${
                            penColor === '#10b981' && !eraserMode ? 'border-green-500 bg-green-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-green-500"></div>
                            <span>Green</span>
                          </div>
                        </button>
                        <button
                          onClick={() => { setPenColor('#000000'); setEraserMode(false); }}
                          className={`p-1.5 rounded-md border text-xs ${
                            penColor === '#000000' && !eraserMode ? 'border-gray-800 bg-gray-100' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-black"></div>
                            <span>Black</span>
                          </div>
                        </button>
                        <button
                          onClick={() => { setPenColor('#3b82f6'); setEraserMode(false); }}
                          className={`p-1.5 rounded-md border text-xs ${
                            penColor === '#3b82f6' && !eraserMode ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                            <span>Blue</span>
                          </div>
                        </button>
                        <button
                          onClick={() => { setPenColor('#ec4899'); setEraserMode(false); }}
                          className={`p-1.5 rounded-md border text-xs ${
                            penColor === '#ec4899' && !eraserMode ? 'border-pink-500 bg-pink-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-pink-500"></div>
                            <span>Pink</span>
                          </div>
                        </button>
                        <button
                          onClick={() => { setPenColor('#14b8a6'); setEraserMode(false); }}
                          className={`col-span-2 p-1.5 rounded-md border text-xs ${
                            penColor === '#14b8a6' && !eraserMode ? 'border-teal-500 bg-teal-50' : 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-center gap-1">
                            <div className="w-3 h-3 rounded-full bg-teal-500"></div>
                            <span>Teal</span>
                          </div>
                        </button>
                      </div>
                      
                      {/* Thickness Control */}
                      <div className="space-y-1">
                        <label className="text-xs text-gray-600">Thickness: {penThickness}px</label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={penThickness}
                          onChange={(e) => setPenThickness(Number(e.target.value))}
                          className="w-full h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                      
                      {/* Clear Button */}
                      <button
                        onClick={clearDrawings}
                        className="w-full p-2 rounded-md border border-red-200 hover:bg-red-50 text-red-600 text-xs"
                      >
                        Clear Drawings
                      </button>
                    </>
                  )}
                </div>
              </div>

            </div>

            {/* Main Quran Viewer */}
            <div className="col-span-8">
              <div className="bg-white rounded-xl shadow-lg relative" style={{
                background: 'linear-gradient(to bottom, #ffffff, #fafafa)',
                boxShadow: '0 10px 40px rgba(0,0,0,0.1)'
              }}>
                {/* Canvas Overlay for Pen Annotations */}
                <canvas
                  ref={canvasRef}
                  className={`absolute inset-0 w-full h-full rounded-xl ${penMode ? 'pointer-events-auto' : 'pointer-events-none'}`}
                  style={{
                    zIndex: penMode ? 20 : 10,
                    transform: `scale(${zoomLevel / 100})`,
                    transformOrigin: 'top center'
                  }}
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />

                {/* Page-like container */}
                <div className="p-8" style={{
                  minHeight: 'auto',
                  backgroundImage: 'linear-gradient(0deg, transparent 24%, rgba(0,0,0,.02) 25%, rgba(0,0,0,.02) 26%, transparent 27%, transparent 74%, rgba(0,0,0,.02) 75%, rgba(0,0,0,.02) 76%, transparent 77%, transparent)',
                  backgroundSize: '50px 50px',
                  pointerEvents: penMode ? 'none' : 'auto'
                }}>

                {/* Basmala for new Surahs (except Surah 1 which has it in verse 1, and Surah 9 which doesn't have it) */}
                {currentSurah !== 1 && currentSurah !== 9 && currentMushafPage === 1 && (
                  <div className="text-center text-3xl font-arabic text-gray-700 py-6 border-b mb-6">
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </div>
                )}

                {/* Quran Text Display - Mushaf Style with Dynamic Script Styling */}
                <div className="relative">
                  
                  <div 
                    className="text-center leading-loose px-16 py-8 bg-gradient-to-b from-white to-gray-50 rounded-lg" 
                    style={{
                      ...getScriptStyling(selectedScript || 'uthmani-hafs'),
                      pointerEvents: penMode ? 'none' : 'auto'
                    }}
                    onMouseUp={() => {
                      if (isSelecting) {
                        setIsSelecting(false);
                        setSelectionStart(null);
                        setSelectionEnd(null);
                      }
                    }}
                  >
                  <style jsx>{`
                    @import url('https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap');

                    .mushaf-page-text {
                      text-align-last: justify;
                    }

                    .mushaf-page-content {
                      text-align: justify;
                      text-justify: kashida;
                    }

                    .mushaf-page-content::after {
                      content: "";
                      display: inline-block;
                      width: 100%;
                    }
                  `}</style>

                  <div className="mushaf-page-text" style={{
                    fontSize: '26px',
                    lineHeight: '2.8',
                    fontFamily: "'Amiri Quran', 'KFGQPC Uthman Taha Naskh', 'Traditional Arabic', serif",
                    textAlign: 'justify',
                    direction: 'rtl',
                    wordSpacing: '0.1em',
                    letterSpacing: 'normal'
                  }}>
                    {(() => {
                      // Get the current mushaf page data
                      const pageData = getPageContent(currentMushafPage);
                      if (!pageData) return <div>Loading page...</div>;

                      // Determine which ayahs to show based on real mushaf page
                      let pageAyahs = [];

                      // Check if current surah is on this page
                      if (pageData.surahStart === currentSurah && pageData.surahEnd === currentSurah) {
                        // Single surah on this page - show ayahs from start to end
                        pageAyahs = quranText.ayahs.filter((ayah: any, idx: number) => {
                          const ayahNumber = idx + 1;
                          return ayahNumber >= pageData.ayahStart && ayahNumber <= pageData.ayahEnd;
                        });
                      } else if (pageData.surahStart === currentSurah) {
                        // Current surah starts on this page
                        pageAyahs = quranText.ayahs.filter((ayah: any, idx: number) => {
                          const ayahNumber = idx + 1;
                          return ayahNumber >= pageData.ayahStart;
                        });
                      } else if (pageData.surahEnd === currentSurah) {
                        // Current surah ends on this page
                        pageAyahs = quranText.ayahs.filter((ayah: any, idx: number) => {
                          const ayahNumber = idx + 1;
                          return ayahNumber <= pageData.ayahEnd;
                        });
                      } else if (pageData.surahsOnPage && pageData.surahsOnPage.includes(currentSurah)) {
                        // Current surah is somewhere in the middle of this page
                        // Show all ayahs of this surah
                        pageAyahs = quranText.ayahs;
                      }

                      // Render the page with traditional Mushaf formatting
                      const scriptClass = `script-${selectedScript || 'uthmani-hafs'}`;
                      return (
                        <div className={`mushaf-page-content mushaf-text ${scriptClass}`} style={{
                          width: '55vw',
                          maxWidth: '700px',
                          minHeight: '75vh',
                          maxHeight: '85vh',
                          aspectRatio: '2/3',
                          overflow: 'visible',
                          margin: '1rem auto',  // Minimal margin
                          padding: '3rem 4rem',  // Generous side margins for annotations
                          backgroundColor: '#000000',  // Pure black background
                          borderRadius: '8px',
                          boxShadow: '0 8px 24px rgba(0,0,0,0.5), inset 0 1px 1px rgba(255,255,255,0.05)',  // Book depth shadow
                          border: '2px solid #1a1a1a',  // Darker border for book effect
                          fontSize: `${24 * (zoomLevel / 100)}px`,  // Adjusted for portrait layout
                          lineHeight: '2.3',  // Traditional Mushaf line spacing
                          textAlign: 'justify',  // Justified text like a book
                          color: '#FFFFFF',  // Pure white text color
                          transform: `scale(${zoomLevel / 100})`,
                          transformOrigin: 'top center',
                          direction: 'rtl',  // Right-to-left for Arabic
                          fontFamily: '"Amiri Quran", "Traditional Arabic", "Arial Unicode MS", sans-serif',  // Traditional Quran font
                          letterSpacing: '0.02em',  // Slight letter spacing for clarity
                          wordSpacing: '0.1em'  // Word spacing for justified text
                        }}>
                          {pageAyahs.map((ayah: any, ayahIdx: any) => {
                            const ayahIndex = quranText.ayahs.indexOf(ayah);
                            return (
                              <span key={ayah.number} className="inline relative group">
                        {/* Select All Ayah Button - Show for recap, homework and tajweed only if ayah not fully selected */}
                        {highlightMode && (selectedMistakeType === 'recap' || selectedMistakeType === 'homework' || selectedMistakeType === 'tajweed') && (() => {
                          const ayahWords = quranText.ayahs[ayahIndex]?.words?.length || 0;
                          const highlightedWordsCount = highlights.filter(
                            h => h.ayahIndex === ayahIndex && h.mistakeType === selectedMistakeType
                          ).length;
                          // Only show button if not all words are highlighted
                          return highlightedWordsCount < ayahWords;
                        })() && (
                          <button
                            onClick={() => highlightEntireAyah(ayahIndex)}
                            className={`absolute -left-24 top-1/2 -translate-y-1/2 opacity-50 group-hover:opacity-100 transition-all text-white px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap z-10 shadow-lg ${
                              selectedMistakeType === 'recap'
                                ? 'bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700'
                                : selectedMistakeType === 'homework'
                                ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                                : 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700'
                            }`}
                            title="Select entire ayah"
                          >
                            ✓ All Ayah
                          </button>
                        )}
                        {ayah.words.map((word: any, wordIndex: any) => {
                          // Get ALL highlights for this word (multiple colors allowed)
                          const wordHighlights = highlights.filter(
                            h => h.ayahIndex === ayahIndex && h.wordIndex === wordIndex
                          );
                          // Check if any highlight is completed and get appropriate colors
                          const mistakes = wordHighlights.map((h: any) => {
                            // If highlight is marked as completed, show gold color
                            if (h.isCompleted) {
                              return mistakeTypes.find((m: any) => m.id === 'completed');
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
                              className={`inline px-0.5 cursor-pointer rounded transition-colors select-none ${
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
                                ...(mistakes.length === 1 ? {
                                  backgroundColor: mistakes[0]?.bgColor === 'bg-yellow-900' ? 'rgba(113,63,18,0.6)' :
                                    mistakes[0]?.bgColor === 'bg-yellow-400' ? 'rgba(250,204,21,0.4)' :
                                    mistakes[0]?.bgColor?.includes('purple') ? 'rgba(147,51,234,0.3)' :
                                    mistakes[0]?.bgColor?.includes('green') ? 'rgba(34,197,94,0.3)' :
                                    mistakes[0]?.bgColor?.includes('orange') ? 'rgba(249,115,22,0.3)' :
                                    mistakes[0]?.bgColor?.includes('red') ? 'rgba(239,68,68,0.3)' : 'transparent',
                                  color: mistakes[0]?.textColor === 'text-yellow-100' ? '#FEF3C7' :
                                    mistakes[0]?.textColor === 'text-yellow-900' ? '#F59E0B' :
                                    '#F5E6D3'  // Keep cream color for dark background
                                } : mistakes.length > 1 ? {
                                  background: `linear-gradient(135deg, ${mistakes.map((m: any, i: any) => {
                                    const color = m.bgColor === 'bg-yellow-900' ? 'rgba(113,63,18,0.6)' :
                                      m.bgColor.includes('purple') ? 'rgba(147,51,234,0.4)' :
                                      m.bgColor.includes('green') ? 'rgba(34,197,94,0.4)' :
                                      m.bgColor.includes('orange') ? 'rgba(249,115,22,0.4)' :
                                      m.bgColor.includes('red') ? 'rgba(239,68,68,0.4)' : 'transparent';
                                    const percent = (i * 100) / mistakes.length;
                                    const nextPercent = ((i + 1) * 100) / mistakes.length;
                                    return `${color} ${percent}%, ${color} ${nextPercent}%`;
                                  }).join(', ')})`,
                                  color: '#F5E6D3',  // Cream color
                                  fontWeight: '600',
                                  border: '1px solid rgba(255,255,255,0.2)',
                                  textShadow: '1px 1px 3px rgba(0,0,0,0.5)'
                                } : {})
                              }}
                            >
                              {word}{' '}
                              {wordHighlights.some((h: any) => notes.some((n: any) => n.highlightIds.includes(h.id))) && (
                                <sup className="text-blue-300 ml-0.5" style={{ fontSize: '0.5em' }}>
                                  <MessageSquare className="w-2.5 h-2.5 inline" />
                                </sup>
                              )}
                            </span>
                          );
                        })}
                        {/* Ayah Number - Traditional Mushaf Style (Inline Small Circle) */}
                        <span
                          className="inline-flex items-center justify-center mx-1 align-middle"
                          style={{
                            width: '24px',  // Smaller inline circle
                            height: '24px',
                            borderRadius: '50%',
                            background: 'rgba(255,255,255,0.1)',  // Subtle white circle
                            border: '1.5px solid rgba(255,255,255,0.3)',  // White border
                            color: '#FFFFFF',  // White text
                            fontSize: '11px',  // Smaller text
                            fontWeight: '600',
                            boxShadow: '0 1px 2px rgba(0,0,0,0.3)',
                            verticalAlign: 'baseline',  // Align with text baseline
                            display: 'inline-flex',
                            fontFamily: 'sans-serif'  // Use regular font for numbers
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

                {/* Page Navigation */}
                <div className="mt-4 flex items-center justify-between border-t pt-4" style={{ pointerEvents: penMode ? 'none' : 'auto' }}>
                  <button 
                    onClick={() => setCurrentMushafPage((prev: any) => Math.max(1, prev - 1))}
                    disabled={currentMushafPage === 1}
                    className={`px-6 py-3 ${currentMushafPage === 1 ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'} text-white rounded-lg flex items-center space-x-2 shadow-md transition`}>
                    <ChevronLeft className="w-5 h-5" />
                    <span>Previous Page</span>
                  </button>
                  <div className="text-center">
                    <span className="text-lg font-semibold text-gray-700">
                      Page {currentMushafPage} of {TOTAL_MUSHAF_PAGES}
                    </span>
                    <p className="text-sm text-gray-500">
                      Authentic Madani Mushaf Layout
                    </p>
                  </div>
                  <button 
                    onClick={() => setCurrentMushafPage((prev: any) => Math.min(TOTAL_MUSHAF_PAGES, prev + 1))}
                    disabled={currentMushafPage >= TOTAL_MUSHAF_PAGES}
                    className={`px-6 py-3 ${currentMushafPage >= TOTAL_MUSHAF_PAGES ? 'bg-gray-400 cursor-not-allowed' : 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700'} text-white rounded-lg flex items-center space-x-2 shadow-md transition`}>
                    <span>Next Page</span>
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
                </div>
              </div>
            </div>

            {/* Right Panel - Notes */}
            <div className="col-span-2 space-y-3">
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
                    {notes.length === 0 && (
                      <p className="text-xs text-gray-400 text-center py-4">No notes yet</p>
                    )}
                  </div>
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
              onClick={() => setShowNoteModal(true)}
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

      {/* Enhanced Note Modal with Conversation Thread and Mark Complete */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b">
              <h3 className="text-lg font-semibold">Highlight Conversation</h3>
              <button onClick={() => { setShowNoteModal(false); setSelectedHighlightsForNote([]); }} className="p-2 hover:bg-gray-100 rounded-lg">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[calc(90vh-200px)] overflow-y-auto">
              {/* Selected Highlights Info */}
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-900">
                      {selectedHighlightsForNote.length} Highlight{selectedHighlightsForNote.length > 1 ? 's' : ''} Selected
                    </p>
                    <p className="text-xs text-blue-700 mt-1">
                      Type: {selectedHighlightsForNote[0]?.color === 'green' ? 'Homework' :
                             selectedHighlightsForNote[0]?.color === 'orange' ? 'Tajweed' :
                             selectedHighlightsForNote[0]?.color === 'red' ? 'Haraka' :
                             selectedHighlightsForNote[0]?.color === 'brown' ? 'Letter' :
                             selectedHighlightsForNote[0]?.color === 'purple' ? 'Review' :
                             selectedHighlightsForNote[0]?.color === 'gold' ? 'Completed' : 'Assignment'}
                    </p>
                  </div>
                  {selectedHighlightsForNote[0]?.color === 'gold' && (
                    <div className="text-xs text-gold-600 bg-yellow-100 px-2 py-1 rounded">
                      ✅ Completed
                    </div>
                  )}
                </div>
              </div>

              {/* Conversation Thread */}
              <div className="space-y-3 border rounded-lg p-4 bg-gray-50 max-h-60 overflow-y-auto">
                <div className="text-sm font-medium text-gray-700 mb-2">Conversation History</div>
                {/* Mock conversation - in real app, this would come from highlight.notes */}
                <div className="space-y-2">
                  <div className="flex flex-col space-y-1">
                    <div className="bg-blue-100 rounded-lg p-3 self-start max-w-[80%]">
                      <p className="text-sm">Please review verse 3-5 and focus on the tajweed rules</p>
                      <span className="text-xs text-gray-600 mt-1">Teacher Ahmed - 2 hours ago</span>
                    </div>
                    <div className="bg-green-100 rounded-lg p-3 self-end max-w-[80%] ml-auto">
                      <p className="text-sm">I practiced it teacher, is it better now?</p>
                      <span className="text-xs text-gray-600 mt-1">Student - 1 hour ago</span>
                    </div>
                    <div className="bg-blue-100 rounded-lg p-3 self-start max-w-[80%]">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm">🎤 Voice Note (1:23)</span>
                        <button className="text-xs text-blue-600 hover:underline">Play</button>
                      </div>
                      <span className="text-xs text-gray-600 mt-1">Teacher Ahmed - 30 min ago</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Add New Note Section */}
              <div className="border-t pt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add Reply:
                </label>
                <textarea
                  value={noteText}
                  onChange={(e) => setNoteText(e.target.value)}
                  placeholder={userRole === 'teacher' ? "Enter your feedback..." : "Reply to teacher..."}
                  className="w-full px-3 py-2 border rounded-lg resize-none"
                  rows={3}
                />
              </div>

              {/* Voice Recording */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={toggleRecording}
                  className={`p-3 rounded-lg flex items-center space-x-2 ${
                    isRecording ? 'bg-red-100 text-red-700 animate-pulse' :
                    audioBlob ? 'bg-green-100 text-green-700' :
                    'bg-gray-100 text-gray-700'
                  }`}
                >
                  {isRecording ? (
                    <>
                      <MicOff className="w-5 h-5" />
                      <span>Stop Recording</span>
                    </>
                  ) : audioBlob ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Voice Note Ready</span>
                    </>
                  ) : (
                    <>
                      <Mic className="w-5 h-5" />
                      <span>Record Voice Note (max 5 min)</span>
                    </>
                  )}
                </button>
                {audioBlob && (
                  <button
                    onClick={() => setAudioBlob(null)}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Delete recording
                  </button>
                )}
              </div>
            </div>

            {/* Footer with Actions */}
            <div className="p-6 border-t bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {/* Mark Complete Button - Only for teachers */}
                  {userRole === 'teacher' && selectedHighlightsForNote[0]?.color !== 'gold' && (
                    <button
                      onClick={() => {
                        // Mark highlight as complete (turn to gold)
                        const updatedHighlights = [...highlights];
                        selectedHighlightsForNote.forEach((selected: any) => {
                          const idx = updatedHighlights.findIndex((h: any) =>
                            h.start === selected.start && h.end === selected.end
                          );
                          if (idx !== -1) {
                            updatedHighlights[idx].color = 'gold';
                            updatedHighlights[idx].previousColor = updatedHighlights[idx].color;
                            updatedHighlights[idx].completedAt = new Date().toISOString();
                            updatedHighlights[idx].completedBy = 'Teacher Ahmed';
                          }
                        });
                        setHighlights(updatedHighlights);
                        setShowNoteModal(false);
                        setSelectedHighlightsForNote([]);
                      }}
                      className="px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 flex items-center space-x-2"
                    >
                      <Check className="w-4 h-4" />
                      <span>Mark as Complete</span>
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => { setShowNoteModal(false); setSelectedHighlightsForNote([]); }}
                    className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={saveNote}
                    disabled={!noteText.trim() && !audioBlob}
                    className={`px-4 py-2 rounded-lg ${
                      !noteText.trim() && !audioBlob
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    Send Reply
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}