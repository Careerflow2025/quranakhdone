'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Languages
} from 'lucide-react';
import {
  SURAH_INFO,
  getSurahForPage,
  getPageWithTajweed,
  applyTajweedRules,
  QURAN_PAGES
} from '@/data/quran/completeQuranData';

interface TajweedViewerProps {
  studentId: string;
  teacherMode?: boolean;
  onAnnotationSave?: (annotation: any) => void;
}

// Tajweed colors
const TAJWEED_COLORS = {
  ghunnah: '#FF6B00',      // Orange
  idgham: '#00AA00',       // Green
  iqlab: '#26BFFD',        // Light Blue
  ikhfa: '#9400D3',        // Purple
  qalqalah: '#0099CC',     // Blue
  madd: '#00AA00',         // Green
  hamza_wasl: '#AAAAAA',   // Gray
  laam_shamsiyah: '#FF7E1E', // Orange
  silent: '#CCCCCC',       // Light Gray
  normal: '#000000'        // Black
};

export default function FixedTajweedViewer({ 
  studentId, 
  teacherMode = false,
  onAnnotationSave 
}: TajweedViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [currentSurah, setCurrentSurah] = useState(SURAH_INFO[0]);
  const [showSurahDropdown, setShowSurahDropdown] = useState(false);
  const [fontSize, setFontSize] = useState(26);
  const [showTajweed, setShowTajweed] = useState(true);
  const [selectedText, setSelectedText] = useState<any>(null);
  const [showTranslation, setShowTranslation] = useState(false);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Update current Surah when page changes
  useEffect(() => {
    const surah = getSurahForPage(currentPage);
    setCurrentSurah(surah);
  }, [currentPage]);

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

  // Load saved preferences
  useEffect(() => {
    const savedBookmarks = localStorage.getItem(`bookmarks_${studentId}`);
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }
    
    const savedTajweed = localStorage.getItem(`showTajweed_${studentId}`);
    if (savedTajweed !== null) {
      setShowTajweed(JSON.parse(savedTajweed));
    }
  }, [studentId]);

  // Save Tajweed preference
  useEffect(() => {
    localStorage.setItem(`showTajweed_${studentId}`, JSON.stringify(showTajweed));
  }, [showTajweed, studentId]);

  // Handle Surah selection
  const handleSurahSelect = (surah: typeof SURAH_INFO[0]) => {
    setCurrentPage(surah.startPage);
    setCurrentSurah(surah);
    setShowSurahDropdown(false);
  };

  // Toggle bookmark
  const toggleBookmark = () => {
    const newBookmarks = bookmarks.includes(currentPage)
      ? bookmarks.filter(b => b !== currentPage)
      : [...bookmarks, currentPage];
    
    setBookmarks(newBookmarks);
    localStorage.setItem(`bookmarks_${studentId}`, JSON.stringify(newBookmarks));
  };

  // Handle text selection for translation
  const handleTextClick = (verse: any, event: React.MouseEvent) => {
    setSelectedText({
      ...verse,
      position: { x: event.clientX, y: event.clientY }
    });
  };

  // Render text with Tajweed colors
  const renderTajweedText = (text: string): JSX.Element[] => {
    if (!showTajweed) {
      return [<span key="0">{text}</span>];
    }

    const parts: JSX.Element[] = [];
    let currentIndex = 0;
    let key = 0;
    
    const regex = /\{t:(\w+)\}(.*?)\{\/t\}/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      if (match.index > currentIndex) {
        const beforeText = text.substring(currentIndex, match.index);
        parts.push(<span key={key++}>{beforeText}</span>);
      }
      
      const tajweedType = match[1];
      const tajweedText = match[2];
      const color = TAJWEED_COLORS[tajweedType as keyof typeof TAJWEED_COLORS] || TAJWEED_COLORS.normal;
      
      parts.push(
        <span key={key++} style={{ color }} title={getTajweedDescription(tajweedType)}>
          {tajweedText}
        </span>
      );
      
      currentIndex = match.index + match[0].length;
    }
    
    if (currentIndex < text.length) {
      parts.push(<span key={key++}>{text.substring(currentIndex)}</span>);
    }
    
    return parts;
  };

  // Get Tajweed description
  const getTajweedDescription = (rule: string): string => {
    const descriptions: { [key: string]: string } = {
      ghunnah: 'Ghunnah - Nasal sound',
      idgham: 'Idgham - Merging',
      iqlab: 'Iqlab - Conversion',
      ikhfa: 'Ikhfa - Concealment',
      qalqalah: 'Qalqalah - Echoing',
      madd: 'Madd - Elongation',
      hamza_wasl: 'Hamza Wasl',
      laam_shamsiyah: 'Laam Shamsiyah',
      silent: 'Silent letter'
    };
    return descriptions[rule] || 'Tajweed rule';
  };

  // Get current page data
  const pageData = getPageWithTajweed(currentPage);

  return (
    <div className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(135deg, #f0fdf4 0%, #e6fffa 25%, #d1fae5 50%, #e6fffa 75%, #f0fdf4 100%)'
    }}>
      {/* Islamic Pattern Background */}
      <div className="absolute inset-0 pointer-events-none" style={{
        opacity: 0.1,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' stroke='%2310b981' stroke-width='0.5'%3E%3Cpolygon points='30,5 35,15 45,15 37,22 40,32 30,25 20,32 23,22 15,15 25,15' fill='%2310b981' fill-opacity='0.05'/%3E%3C/g%3E%3C/svg%3E")`,
        backgroundSize: '60px 60px'
      }} />

      {/* Header */}
      <div className="bg-gradient-to-r from-emerald-700 to-teal-700 text-white shadow-xl sticky top-0" style={{ zIndex: 40 }}>
        <div className="w-full px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Page Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className="p-2 rounded-lg hover:bg-emerald-600 transition-colors"
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="text-center">
                <div className="text-xs opacity-80">Page</div>
                <input
                  type="number"
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value) || 1;
                    setCurrentPage(Math.min(604, Math.max(1, page)));
                  }}
                  className="w-16 text-center bg-emerald-700 rounded px-2 py-1 text-white font-bold"
                  min="1"
                  max="604"
                />
                <div className="text-xs opacity-80">of 604</div>
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(604, currentPage + 1))}
                className="p-2 rounded-lg hover:bg-emerald-600 transition-colors"
                disabled={currentPage === 604}
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            {/* Surah Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowSurahDropdown(!showSurahDropdown)}
                className="px-4 py-2 bg-emerald-700 rounded-lg hover:bg-emerald-600 flex items-center gap-2 text-sm font-semibold"
              >
                <span className="text-lg">{currentSurah.name}</span>
                <span className="text-xs opacity-80">{currentSurah.englishName}</span>
                <svg className={`w-4 h-4 transition-transform ${showSurahDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              {/* Dropdown Menu */}
              {showSurahDropdown && (
                <div className="absolute top-full mt-2 left-1/2 transform -translate-x-1/2 w-[600px] max-h-[500px] overflow-y-auto bg-white rounded-lg shadow-2xl border border-emerald-200" 
                     style={{ zIndex: 9999 }}>
                  <div className="grid grid-cols-3 gap-0 p-2">
                    {SURAH_INFO.map((surah) => (
                      <button
                        key={surah.number}
                        onClick={() => handleSurahSelect(surah)}
                        className={`flex items-center justify-between px-3 py-2 hover:bg-emerald-50 rounded text-right transition-colors group ${
                          currentSurah.number === surah.number ? 'bg-emerald-100' : ''
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-emerald-600 font-bold">{surah.number}</span>
                          <div className="text-right">
                            <div className="text-sm font-semibold text-gray-900 group-hover:text-emerald-700">
                              {surah.name}
                            </div>
                            <div className="text-xs text-gray-500">{surah.englishName}</div>
                          </div>
                        </div>
                        <div className="text-xs text-gray-400">
                          <div>Page {surah.startPage}</div>
                          <div>{surah.verses} verses</div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Tajweed Toggle */}
              <button
                onClick={() => setShowTajweed(!showTajweed)}
                className={`p-2 rounded-lg transition-colors flex items-center gap-1 ${
                  showTajweed ? 'bg-green-600' : 'bg-emerald-700 hover:bg-emerald-600'
                }`}
                title={showTajweed ? 'Hide Tajweed colors' : 'Show Tajweed colors'}
              >
                {showTajweed ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                <Palette className="w-4 h-4" />
              </button>
              
              <div className="w-px h-6 bg-emerald-600" />
              
              {/* Font Size */}
              <button
                onClick={() => setFontSize(Math.max(16, fontSize - 2))}
                className="p-2 rounded-lg hover:bg-emerald-700"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold">{fontSize}</span>
              <button
                onClick={() => setFontSize(Math.min(40, fontSize + 2))}
                className="p-2 rounded-lg hover:bg-emerald-700"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              
              <div className="w-px h-6 bg-emerald-600" />
              
              {/* Bookmark */}
              <button
                onClick={toggleBookmark}
                className={`p-2 rounded-lg transition-colors ${
                  bookmarks.includes(currentPage) ? 'bg-yellow-500' : 'hover:bg-emerald-700'
                }`}
              >
                <Bookmark className="w-4 h-4" fill={bookmarks.includes(currentPage) ? 'white' : 'none'} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Tajweed Legend */}
      {showTajweed && (
        <div className="bg-white border-b shadow-sm relative" style={{ zIndex: 30 }}>
          <div className="w-full px-4 py-2 bg-white">
            <div className="flex items-center gap-4 overflow-x-auto text-xs">
              <span className="font-semibold">Tajweed Rules:</span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: TAJWEED_COLORS.ghunnah }} />
                Ghunnah
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: TAJWEED_COLORS.idgham }} />
                Idgham
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: TAJWEED_COLORS.ikhfa }} />
                Ikhfa
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: TAJWEED_COLORS.qalqalah }} />
                Qalqalah
              </span>
              <span className="flex items-center gap-1">
                <span className="w-3 h-3 rounded-full" style={{ backgroundColor: TAJWEED_COLORS.madd }} />
                Madd
              </span>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Quran Page */}
      <div className="w-full px-4 md:px-8 lg:px-12 py-8">
        <div className="w-full max-w-7xl mx-auto">
          <div className="bg-white rounded-lg shadow-2xl relative" style={{
            minHeight: '900px',
            padding: '80px 60px',
            backgroundColor: '#ffffff'
          }}>
            {/* Page Number */}
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
              <div className="text-emerald-700 text-lg font-arabic opacity-60">
                ﴿ {currentPage} ﴾
              </div>
            </div>
            
            {/* Surah Header if new Surah starts on this page */}
            {pageData.verses.length > 0 && pageData.verses[0].verse === 1 && (
              <div className="text-center mb-8">
                <div className="text-3xl font-bold text-emerald-800 font-arabic">
                  سورة {currentSurah.name}
                </div>
                <div className="text-sm text-gray-500 mt-2">
                  {currentSurah.englishName} • {currentSurah.verses} Verses
                </div>
              </div>
            )}
            
            {/* Quran Verses */}
            <div className="font-arabic text-black leading-loose" style={{ 
              fontSize: `${fontSize}px`,
              textAlign: 'justify',
              direction: 'rtl',
              lineHeight: '2.4',
              wordSpacing: '0.4em'
            }} dir="rtl">
              {pageData.verses.map((verse, index) => (
                <span key={verse.key} className="cursor-pointer hover:bg-emerald-50 transition-colors rounded px-1"
                      onClick={(e) => handleTextClick(verse, e)}>
                  {renderTajweedText(applyTajweedRules(verse.arabic))}
                  <span className="mx-2 text-emerald-700">﴿{verse.verse}﴾</span>
                </span>
              ))}
            </div>
            
            {/* Page Footer */}
            <div className="absolute bottom-10 left-12 right-12 flex justify-between text-xs text-emerald-700 font-arabic">
              <span>الجزء {Math.ceil(currentPage / 20)}</span>
              <span>{currentSurah.name}</span>
              <span>الحزب {Math.ceil(currentPage / 10)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Translation Popup */}
      <AnimatePresence>
        {selectedText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 bg-white rounded-xl shadow-2xl p-5 max-w-md border-2 border-emerald-200"
            style={{
              left: Math.min(selectedText.position.x - 200, window.innerWidth - 450),
              top: Math.min(selectedText.position.y + 20, window.innerHeight - 300)
            }}
          >
            <button
              onClick={() => {
                setSelectedText(null);
                setShowTranslation(false);
              }}
              className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="space-y-4">
              <div className="text-center text-sm text-emerald-700 font-semibold">
                Verse {selectedText.key}
              </div>
              
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className="w-full py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
              >
                <Languages className="w-4 h-4" />
                <span>{showTranslation ? 'Hide' : 'Show'} Translation</span>
              </button>
              
              {showTranslation && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">{selectedText.translation}</p>
                  <p className="text-xs text-gray-500 mt-2">— Dr. Mustafa Khattab</p>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}