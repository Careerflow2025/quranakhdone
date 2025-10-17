'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  ChevronLeft,
  ChevronRight,
  Bookmark,
  X,
  ZoomIn,
  ZoomOut,
  Palette,
  Eye,
  EyeOff,
  Languages,
  ChevronDown,
  MessageSquare,
  Send,
  Trash2,
  Edit2,
  Save,
  Volume2,
  VolumeX,
  Loader
} from 'lucide-react';
// Using existing Quran data files
import quranMetadata from '@/data/quran/simple.json';
import completeQuranData from '@/data/quran/uthmani-hafs-full.json';

interface WorkingQuranViewerProps {
  studentId: string;
  teacherMode?: boolean;
  onAnnotationSave?: (annotation: any) => void;
}

// Tajweed colors
const TAJWEED_COLORS = {
  ghunnah: '#FF6B00',
  idgham: '#00AA00',
  iqlab: '#26BFFD',
  ikhfa: '#9400D3',
  qalqalah: '#0099CC',
  madd: '#00AA00'
};

interface Note {
  id: string;
  text: string;
  timestamp: Date;
  page: number;
  surah: number;
  visibleToParents: boolean;
}

export default function WorkingQuranViewer({ 
  studentId, 
  teacherMode = false,
  onAnnotationSave 
}: WorkingQuranViewerProps) {
  const [currentSurah, setCurrentSurah] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSurahDropdown, setShowSurahDropdown] = useState(false);
  const [fontSize, setFontSize] = useState(28);
  const [showTajweed, setShowTajweed] = useState(true);
  const [showTranslationOnHover, setShowTranslationOnHover] = useState(true);
  const [showRecitationOnClick, setShowRecitationOnClick] = useState(false);
  const [followAlongMode, setFollowAlongMode] = useState(false);
  const [hoveredVerse, setHoveredVerse] = useState<number | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [playingVerse, setPlayingVerse] = useState<number | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const verseRefs = useRef<{ [key: number]: HTMLElement | null }>({});
  const [showNotesSidebar, setShowNotesSidebar] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [newNote, setNewNote] = useState('');
  const [newNoteVisibleToParents, setNewNoteVisibleToParents] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteText, setEditingNoteText] = useState('');
  const [editingNoteVisibility, setEditingNoteVisibility] = useState(false);
  const [sidebarTop, setSidebarTop] = useState(140);
  
  const dropdownRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tajweedRef = useRef<HTMLDivElement>(null);
  const currentSurahData = quranMetadata.data.surahs.find(s => s.number === currentSurah);
  const currentFullSurah = completeQuranData.data.surahs.find(s => s.number === currentSurah);
  const totalVerses = currentSurahData?.ayahs?.length || 7;

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSurahDropdown(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate pages for current Surah
  const getPagesForSurah = () => {
    if (!currentFullSurah || !currentFullSurah.ayahs) return [];
    
    const pages = [];
    let currentPageVerses = [];
    let currentPageText = '';
    
    // For short Surahs (less than 50 verses), show all on one page
    // For medium Surahs, use 800 character minimum
    // For long Surahs, use 600 character minimum
    const isShortSurah = currentFullSurah.ayahs.length <= 50;
    const isMediumSurah = currentFullSurah.ayahs.length <= 100;
    const minCharsPerPage = isShortSurah ? 99999 : isMediumSurah ? 800 : 600;
    
    for (let i = 0; i < currentFullSurah.ayahs.length; i++) {
      const verse = currentFullSurah.ayahs[i];
      const verseText = verse.text;
      
      // Add verse to current page
      currentPageVerses.push(verse);
      currentPageText += verseText + ' ';
      
      // Check if we should start a new page
      // Create new page if: text exceeds minimum OR last verse of Surah
      if (currentPageText.length >= minCharsPerPage || i === currentFullSurah.ayahs.length - 1) {
        pages.push([...currentPageVerses]);
        currentPageVerses = [];
        currentPageText = '';
      }
    }
    
    return pages;
  };
  
  const surahPages = getPagesForSurah();
  const totalPages = surahPages.length || 1;
  
  // Handle Surah selection
  const handleSurahSelect = (surahNumber: number) => {
    setCurrentSurah(surahNumber);
    setCurrentPage(1);
    setShowSurahDropdown(false);
  };

  // Navigate pages
  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    } else if (currentSurah > 1) {
      setCurrentSurah(currentSurah - 1);
      setCurrentPage(1); // Will be recalculated
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    } else if (currentSurah < 114) {
      setCurrentSurah(currentSurah + 1);
      setCurrentPage(1);
    }
  };

  // Get current page verses
  const getCurrentPageVerses = () => {
    if (!surahPages || surahPages.length === 0 || currentPage > surahPages.length) {
      return [];
    }
    return surahPages[currentPage - 1] || [];
  };

  const currentPageVerses = getCurrentPageVerses();

  // Toggle bookmark
  const toggleBookmark = () => {
    const key = `${currentSurah}:${currentPage}`;
    if (bookmarks.includes(key)) {
      setBookmarks(bookmarks.filter(b => b !== key));
    } else {
      setBookmarks([...bookmarks, key]);
    }
  };

  // Load notes from localStorage
  useEffect(() => {
    const savedNotes = localStorage.getItem(`notes_${studentId}`);
    if (savedNotes) {
      setNotes(JSON.parse(savedNotes));
    }
  }, [studentId]);

  // Calculate sidebar position
  useEffect(() => {
    const calculatePosition = () => {
      let top = 0;
      if (headerRef.current) {
        const headerRect = headerRef.current.getBoundingClientRect();
        top += headerRect.height;
      }
      if (showTajweed && tajweedRef.current) {
        const tajweedRect = tajweedRef.current.getBoundingClientRect();
        top += tajweedRect.height;
      }
      setSidebarTop(top || (showTajweed ? 140 : 95));
    };
    
    calculatePosition();
    window.addEventListener('resize', calculatePosition);
    return () => window.removeEventListener('resize', calculatePosition);
  }, [showTajweed]);

  // Save notes to localStorage
  const saveNotes = (updatedNotes: Note[]) => {
    setNotes(updatedNotes);
    localStorage.setItem(`notes_${studentId}`, JSON.stringify(updatedNotes));
  };

  // Add new note
  const addNote = () => {
    if (newNote.trim()) {
      const note: Note = {
        id: Date.now().toString(),
        text: newNote,
        timestamp: new Date(),
        page: currentPage,
        surah: currentSurah,
        visibleToParents: newNoteVisibleToParents
      };
      saveNotes([...notes, note]);
      setNewNote('');
      setNewNoteVisibleToParents(false);
    }
  };

  // Edit note
  const startEditingNote = (note: Note) => {
    setEditingNoteId(note.id);
    setEditingNoteText(note.text);
    setEditingNoteVisibility(note.visibleToParents);
  };

  // Save edited note
  const saveEditedNote = () => {
    if (editingNoteId && editingNoteText.trim()) {
      const updatedNotes = notes.map(note =>
        note.id === editingNoteId
          ? { ...note, text: editingNoteText, visibleToParents: editingNoteVisibility }
          : note
      );
      saveNotes(updatedNotes);
      setEditingNoteId(null);
      setEditingNoteText('');
      setEditingNoteVisibility(false);
    }
  };

  // Delete note
  const deleteNote = (noteId: string) => {
    saveNotes(notes.filter(note => note.id !== noteId));
  };

  // Play verse recitation
  const playVerseRecitation = (verse: any, autoPlay = false, versesForPlayback: any[] | null = null) => {
    if (!showRecitationOnClick && !autoPlay) return;
    
    // Determine if we should continue playing based on current state
    const shouldContinuePlaying = autoPlay && (versesForPlayback !== null || followAlongMode);
    const versesToUse = versesForPlayback || currentPageVerses;
    
    // Stop any currently playing audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    
    // Format verse number with leading zeros (001, 002, etc)
    const verseNumber = String(verse.numberInSurah).padStart(3, '0');
    const surahNumber = String(currentSurah).padStart(3, '0');
    
    // Using Mishary Rashid Alafasy's recitation from everyayah.com
    const audioUrl = `https://everyayah.com/data/Alafasy_128kbps/${surahNumber}${verseNumber}.mp3`;
    
    const audio = new Audio(audioUrl);
    audioRef.current = audio;
    setPlayingVerse(verse.numberInSurah);
    setIsPlaying(true);
    
    // Auto-scroll to verse if in follow along mode
    if (followAlongMode && verseRefs.current[verse.numberInSurah]) {
      verseRefs.current[verse.numberInSurah]?.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
    }
    
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
      setPlayingVerse(null);
      setIsPlaying(false);
    });
    
    audio.onended = () => {
      // Continue playing if this was an auto-play request
      if (shouldContinuePlaying) {
        const currentVerseIndex = versesToUse.findIndex(v => v.numberInSurah === verse.numberInSurah);
        
        if (currentVerseIndex !== -1 && currentVerseIndex < versesToUse.length - 1) {
          // Play next verse on same page
          setTimeout(() => {
            playVerseRecitation(versesToUse[currentVerseIndex + 1], true, versesToUse);
          }, 500);
        } else if (currentPage < totalPages) {
          // Move to next page
          setTimeout(() => {
            goToNextPage();
          }, 500);
        } else {
          setPlayingVerse(null);
          setIsPlaying(false);
          setFollowAlongMode(false);
          audioRef.current = null;
        }
      } else {
        setPlayingVerse(null);
        setIsPlaying(false);
        audioRef.current = null;
      }
    };
    
    audio.onerror = () => {
      // Try to continue with next verse on error if in continuous play mode
      if (shouldContinuePlaying) {
        const currentVerseIndex = versesToUse.findIndex(v => v.numberInSurah === verse.numberInSurah);
        
        if (currentVerseIndex !== -1 && currentVerseIndex < versesToUse.length - 1) {
          setTimeout(() => {
            playVerseRecitation(versesToUse[currentVerseIndex + 1], true, versesToUse);
          }, 500);
        }
      } else {
        setPlayingVerse(null);
        setIsPlaying(false);
        audioRef.current = null;
      }
    };
  };

  // Stop recitation
  const stopRecitation = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
      setPlayingVerse(null);
      setIsPlaying(false);
    }
  };

  // Start follow along from first verse of page
  const startFollowAlong = () => {
    if (currentPageVerses.length > 0) {
      playVerseRecitation(currentPageVerses[0], true, currentPageVerses);
    }
  };

  // Auto-play when page changes in follow along mode
  useEffect(() => {
    if (followAlongMode && isPlaying && currentPageVerses.length > 0) {
      playVerseRecitation(currentPageVerses[0], true, currentPageVerses);
    }
  }, [currentPage]);

  // Apply simple Tajweed coloring
  const renderWithTajweed = (text: string) => {
    if (!showTajweed) return text;
    
    // Simple Tajweed rules for demonstration
    let result = text;
    result = result.replace(/نْ/g, `<span style="color: ${TAJWEED_COLORS.ghunnah}">نْ</span>`);
    result = result.replace(/مْ/g, `<span style="color: ${TAJWEED_COLORS.ghunnah}">مْ</span>`);
    result = result.replace(/([ا-ي])ّ/g, `<span style="color: ${TAJWEED_COLORS.qalqalah}">$1ّ</span>`);
    
    return <span dangerouslySetInnerHTML={{ __html: result }} />;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 relative">
      {/* Islamic Pattern Background */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%233B82F6' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      />
      
      {/* Additional Decorative Pattern */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%2360A5FA' fill-opacity='0.8'%3E%3Cpath d='M40 40c0-11.046 8.954-20 20-20s20 8.954 20 20-8.954 20-20 20-20-8.954-20-20zm0 0c0 11.046-8.954 20-20 20S0 51.046 0 40s8.954-20 20-20 20 8.954 20 20zm0 0c11.046 0 20 8.954 20 20s-8.954 20-20 20-20-8.954-20-20 8.954-20 20-20zm0 0c-11.046 0-20-8.954-20-20S28.954 0 40 0s20 8.954 20 20-8.954 20-20 20z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '80px 80px'
        }}
      />
      
      <div className="relative z-10">
        {/* Header */}
        <div ref={headerRef} className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-xl sticky top-0 z-40">
          <div className="w-full px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Page Navigation */}
              <div className="flex items-center gap-3">
                <button
                  onClick={goToPreviousPage}
                  className="p-2 rounded-lg hover:bg-emerald-600 transition-colors"
                  disabled={currentSurah === 1 && currentPage === 1}
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                
                <div className="text-center">
                  <div className="text-xs opacity-80">Page</div>
                  <div className="font-bold text-lg">{currentPage} / {totalPages}</div>
                </div>
                
                <button
                  onClick={goToNextPage}
                  className="p-2 rounded-lg hover:bg-emerald-600 transition-colors"
                  disabled={currentSurah === 114 && currentPage === totalPages}
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
              
              {/* Surah Dropdown - ALL 114 SURAHS */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setShowSurahDropdown(!showSurahDropdown)}
                  className="px-4 py-2 bg-emerald-600 rounded-lg hover:bg-emerald-500 flex items-center gap-2"
                >
                  <span className="text-lg font-bold">{currentSurahData?.name}</span>
                  <span className="text-sm opacity-80">{currentSurahData?.englishName}</span>
                  <ChevronDown className={`w-4 h-4 transition-transform ${showSurahDropdown ? 'rotate-180' : ''}`} />
                </button>
                
                {showSurahDropdown && (
                  <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 w-[700px] max-h-[500px] overflow-y-auto bg-white rounded-lg shadow-2xl border border-emerald-200" 
                       style={{ zIndex: 9999 }}>
                    <div className="grid grid-cols-3 gap-0 p-2">
                      {quranMetadata.data.surahs.map((surah) => (
                        <button
                          key={surah.number}
                          onClick={() => handleSurahSelect(surah.number)}
                          className={`flex items-center justify-between px-3 py-2 hover:bg-emerald-50 rounded text-right transition-colors ${
                            currentSurah === surah.number ? 'bg-emerald-100 border-l-4 border-emerald-600' : ''
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-emerald-700">{surah.number}</span>
                            <div>
                              <div className="text-sm font-bold text-gray-900">{surah.name}</div>
                              <div className="text-xs text-gray-500">{surah.englishName}</div>
                            </div>
                          </div>
                          <div className="text-xs text-gray-400 text-right">
                            <div>{surah.ayahs?.length || 0} verses</div>
                            <div className="text-xs">{surah.revelationType}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Controls */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowTajweed(!showTajweed)}
                  className={`p-2 rounded-lg transition-colors ${
                    showTajweed ? 'bg-green-600' : 'bg-emerald-700 hover:bg-emerald-600'
                  }`}
                  title="Toggle Tajweed colors"
                >
                  {showTajweed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                
                <button
                  onClick={() => setShowTranslationOnHover(!showTranslationOnHover)}
                  className={`p-2 rounded-lg transition-colors ${
                    showTranslationOnHover ? 'bg-blue-600' : 'bg-emerald-700 hover:bg-emerald-600'
                  }`}
                  title="Toggle translation on hover"
                >
                  <Languages className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => {
                    setShowRecitationOnClick(!showRecitationOnClick);
                    if (!showRecitationOnClick) {
                      stopRecitation();
                      setFollowAlongMode(false);
                    }
                  }}
                  className={`p-2 rounded-lg transition-colors ${
                    showRecitationOnClick ? 'bg-amber-600' : 'bg-emerald-700 hover:bg-emerald-600'
                  }`}
                  title="Toggle recitation on click"
                >
                  {showRecitationOnClick ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                </button>
                
                {showRecitationOnClick && (
                  <button
                    onClick={() => {
                      if (followAlongMode) {
                        setFollowAlongMode(false);
                        stopRecitation();
                      } else {
                        setFollowAlongMode(true);
                        startFollowAlong();
                      }
                    }}
                    className={`px-3 py-1 rounded-lg transition-colors text-xs font-semibold ${
                      followAlongMode ? 'bg-green-600 text-white' : 'bg-emerald-700 hover:bg-emerald-600 text-white'
                    }`}
                    title={followAlongMode ? "Stop Follow Along" : "Start Follow Along"}
                  >
                    {followAlongMode ? (
                      isPlaying ? '⏸ Pause' : '▶ Resume'
                    ) : (
                      '▶ Follow Along'
                    )}
                  </button>
                )}
                
                <div className="w-px h-6 bg-emerald-600" />
                
                <button onClick={() => setFontSize(Math.max(16, fontSize - 2))} className="p-2 rounded-lg hover:bg-emerald-600">
                  <ZoomOut className="w-4 h-4" />
                </button>
                
                <span className="text-sm font-bold">{fontSize}</span>
                
                <button onClick={() => setFontSize(Math.min(48, fontSize + 2))} className="p-2 rounded-lg hover:bg-emerald-600">
                  <ZoomIn className="w-4 h-4" />
                </button>
                
                <button
                  onClick={toggleBookmark}
                  className={`p-2 rounded-lg transition-colors ${
                    bookmarks.includes(`${currentSurah}:${currentPage}`) ? 'bg-yellow-500' : 'hover:bg-emerald-600'
                  }`}
                >
                  <Bookmark className="w-4 h-4" />
                </button>
                
                <button
                  onClick={() => setShowNotesSidebar(!showNotesSidebar)}
                  className={`p-2 rounded-lg transition-colors ${
                    showNotesSidebar ? 'bg-blue-600' : 'hover:bg-emerald-600'
                  }`}
                  title="Teacher Notes"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Tajweed Legend */}
        {showTajweed && (
          <div ref={tajweedRef} className="bg-white border-b shadow-sm">
            <div className="w-full px-4 py-2">
              <div className="flex items-center gap-4 text-xs">
                <span className="font-semibold">Tajweed:</span>
                {Object.entries(TAJWEED_COLORS).map(([name, color]) => (
                  <span key={name} className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                    {name.charAt(0).toUpperCase() + name.slice(1)}
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}
        
        {/* Main Content */}
        <div className="w-full px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-lg shadow-2xl p-12">
              {/* Surah Header */}
              <div className="text-center mb-8">
                <h1 className="text-4xl font-bold text-emerald-800 mb-2">
                  سورة {currentSurahData?.name}
                </h1>
                <p className="text-lg text-gray-600">
                  {currentSurahData?.englishName} • {currentSurahData?.englishNameTranslation}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {currentSurahData?.ayahs?.length || 0} Verses • {currentSurahData?.revelationType}
                </p>
              </div>
              
              {/* Bismillah for new Surahs (except Surah 9) */}
              {currentPage === 1 && currentSurah !== 9 && currentSurah !== 1 && (
                <div className="text-center mb-6 text-2xl" style={{ fontSize: `${fontSize}px` }}>
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </div>
              )}
              
              {/* Page Verses */}
              <div 
                className="text-right leading-relaxed rounded-lg p-6 relative"
                style={{ 
                  fontSize: `${fontSize}px`,
                  direction: 'rtl',
                  fontFamily: 'Amiri Quran, serif',
                  lineHeight: '2.2'
                }}
              >
                {currentPageVerses.length > 0 ? (
                  <div className="text-justify" style={{ textAlignLast: 'center' }}>
                    {currentPageVerses.map((verse, index) => (
                      <span
                        key={verse.numberInSurah}
                        ref={el => { verseRefs.current[verse.numberInSurah] = el; }}
                        className="relative inline"
                        onMouseEnter={(e) => {
                          setHoveredVerse(verse.numberInSurah);
                          const rect = e.currentTarget.getBoundingClientRect();
                          setMousePosition({ x: rect.left + rect.width / 2, y: rect.bottom + 10 });
                        }}
                        onMouseLeave={() => setHoveredVerse(null)}
                        onClick={() => !followAlongMode && playVerseRecitation(verse)}
                      >
                        <span className={`hover:bg-blue-100 transition-colors rounded px-1 ${
                          !followAlongMode ? 'cursor-pointer' : ''
                        } ${
                          playingVerse === verse.numberInSurah ? 'bg-amber-200 animate-pulse border-2 border-amber-400' : ''
                        }`}>
                          {renderWithTajweed(verse.text)}
                        </span>
                        <span className="mx-2 text-emerald-600" style={{ fontSize: '0.7em' }}>
                          ﴿{verse.numberInSurah}﴾
                        </span>
                        {index < currentPageVerses.length - 1 && ' '}
                        
                        {/* Translation Tooltip */}
                        {showTranslationOnHover && hoveredVerse === verse.numberInSurah && (
                          <div 
                            className="fixed z-50 bg-gray-900 text-white p-3 rounded-lg shadow-2xl max-w-md"
                            style={{
                              left: `${mousePosition.x}px`,
                              top: `${mousePosition.y}px`,
                              transform: 'translateX(-50%)',
                              pointerEvents: 'none'
                            }}
                          >
                            <div className="text-sm font-semibold mb-1 text-blue-300">
                              Verse {verse.numberInSurah}
                            </div>
                            <div className="text-sm leading-relaxed">
                              Translation will be available soon
                            </div>
                            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
                              <div className="w-0 h-0 border-l-8 border-r-8 border-b-8 border-transparent border-b-gray-900"></div>
                            </div>
                          </div>
                        )}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500">Loading verses...</p>
                )}
              </div>
              
              {/* Feature Hints */}
              <div className="text-center mt-6 space-y-1">
                <p className="text-sm text-gray-500 italic">
                  {showTranslationOnHover 
                    ? '💡 Hover over any verse to see its translation' 
                    : '📖 Translation on hover is disabled'}
                </p>
                <p className="text-sm text-gray-500 italic">
                  {followAlongMode 
                    ? '🎧 Follow Along Mode Active - Auto-playing verses continuously' 
                    : showRecitationOnClick 
                      ? '🔊 Click on any verse to hear its recitation (Mishary Rashid Alafasy)' 
                      : '🔇 Recitation is disabled'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Teacher Notes Sidebar */}
      {showNotesSidebar && (
        <div className="fixed left-0 w-80 bg-white shadow-2xl z-30 flex flex-col" 
             style={{ 
               top: showTajweed ? '200px' : '120px',
               height: showTajweed ? 'calc(100vh - 200px)' : 'calc(100vh - 120px)'
             }}>
          <div className="bg-gradient-to-r from-blue-600 to-sky-600 text-white p-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Teacher Notes
              </h2>
              <button
                onClick={() => setShowNotesSidebar(false)}
                className="p-1 hover:bg-white/20 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <p className="text-sm opacity-90 mt-1">
              Student: {studentId} | Page {currentPage}
            </p>
          </div>
          
          {/* Add New Note */}
          <div className="p-4 border-b space-y-3">
            <div className="flex gap-2">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Add a note about this page..."
                className="flex-1 p-2 border rounded-lg resize-none text-sm"
                rows={3}
              />
              <button
                onClick={addNote}
                disabled={!newNote.trim()}
                className="px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={newNoteVisibleToParents}
                onChange={(e) => setNewNoteVisibleToParents(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <span className="text-gray-700">Visible to parents</span>
            </label>
          </div>
          
          {/* Notes List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {notes.length === 0 ? (
              <p className="text-gray-500 text-center text-sm">No notes yet. Add your first note above!</p>
            ) : (
              notes
                .filter(note => note.surah === currentSurah)
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .map((note) => (
                  <div key={note.id} className="bg-gray-50 rounded-lg p-3 space-y-2">
                    {editingNoteId === note.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editingNoteText}
                          onChange={(e) => setEditingNoteText(e.target.value)}
                          className="w-full p-2 border rounded text-sm resize-none"
                          rows={3}
                        />
                        <label className="flex items-center gap-2 text-xs">
                          <input
                            type="checkbox"
                            checked={editingNoteVisibility}
                            onChange={(e) => setEditingNoteVisibility(e.target.checked)}
                            className="w-3 h-3"
                          />
                          <span>Visible to parents</span>
                        </label>
                        <div className="flex gap-2">
                          <button
                            onClick={saveEditedNote}
                            className="px-2 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                          >
                            <Save className="w-3 h-3" />
                          </button>
                          <button
                            onClick={() => {
                              setEditingNoteId(null);
                              setEditingNoteText('');
                              setEditingNoteVisibility(false);
                            }}
                            className="px-2 py-1 bg-gray-600 text-white rounded text-sm hover:bg-gray-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="text-sm text-gray-800">{note.text}</p>
                        {note.visibleToParents && (
                          <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 rounded-full text-xs">
                            <Eye className="w-3 h-3" />
                            <span>Visible to parents</span>
                          </div>
                        )}
                        <div className="flex items-center justify-between text-xs text-gray-500">
                          <span>Page {note.page} • {new Date(note.timestamp).toLocaleDateString()}</span>
                          <div className="flex gap-1">
                            <button
                              onClick={() => startEditingNote(note)}
                              className="p-1 hover:bg-gray-200 rounded"
                            >
                              <Edit2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => deleteNote(note.id)}
                              className="p-1 hover:bg-red-100 rounded text-red-600"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))
            )}
          </div>
          
          {/* Notes Summary */}
          <div className="p-4 border-t bg-gray-50">
            <div className="text-xs text-gray-600">
              <p>Total Notes: {notes.length}</p>
              <p>This Surah: {notes.filter(n => n.surah === currentSurah).length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}