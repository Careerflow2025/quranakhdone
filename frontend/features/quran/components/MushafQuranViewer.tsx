'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Volume2, 
  Languages, 
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Play,
  Pause,
  X,
  Loader2,
  ZoomIn,
  ZoomOut,
  BookOpen,
  Info
} from 'lucide-react';
import { quranAPI, Verse, Chapter } from '@/services/quranApi';
import { fabric } from 'fabric';
import { useAnnotationStore } from '@/features/annotations/state/useAnnotationStore';

interface SelectedText {
  text: string;
  verseKey: string;
  verse: Verse;
  position: { x: number; y: number };
}

interface MushafViewerProps {
  studentId: string;
  teacherMode?: boolean;
  onAnnotationSave?: (annotation: any) => void;
}

// Quran page mapping - which verses appear on which page (Madani Mushaf standard)
const PAGE_MAPPING: { [key: number]: { start: string; end: string } } = {
  1: { start: '1:1', end: '1:7' },
  2: { start: '2:1', end: '2:5' },
  3: { start: '2:6', end: '2:16' },
  // Add more page mappings as needed
  // This would normally be a complete 604-page mapping
};

export default function MushafQuranViewer({ 
  studentId, 
  teacherMode = false,
  onAnnotationSave 
}: MushafViewerProps) {
  // State Management
  const [currentPage, setCurrentPage] = useState(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedText, setSelectedText] = useState<SelectedText | null>(null);
  const [selectedReciter, setSelectedReciter] = useState(7); // Mishari Rashid
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingVerse, setCurrentPlayingVerse] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(32);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [showTranslationOverlay, setShowTranslationOverlay] = useState(false);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const pageRef = useRef<HTMLDivElement>(null);
  
  // Annotation state from store
  const { tool, strokeWidth } = useAnnotationStore();

  // Load verses for current page
  useEffect(() => {
    loadPage(currentPage);
  }, [currentPage]);

  const loadPage = async (pageNum: number) => {
    setLoading(true);
    try {
      // For demo, we'll load Surah Al-Fatiha and Al-Baqarah beginning
      // In production, you'd use the PAGE_MAPPING to get exact verses
      let versesToLoad: Verse[] = [];
      
      if (pageNum === 1) {
        // Page 1: Al-Fatiha
        versesToLoad = await quranAPI.getVersesByChapter(1, []);
      } else if (pageNum === 2) {
        // Page 2: Beginning of Al-Baqarah
        const allVerses = await quranAPI.getVersesByChapter(2, []);
        versesToLoad = allVerses.slice(0, 5);
      } else {
        // Other pages: Load portions of Al-Baqarah
        const allVerses = await quranAPI.getVersesByChapter(2, []);
        const startIdx = (pageNum - 2) * 5;
        versesToLoad = allVerses.slice(startIdx, startIdx + 5);
      }
      
      setVerses(versesToLoad);
      
      // Load bookmarks
      const savedBookmarks = localStorage.getItem(`bookmarks_${studentId}`);
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }
    } catch (error) {
      console.error('Error loading page:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Fabric.js canvas for annotations
  useEffect(() => {
    if (teacherMode && pageRef.current && !canvasRef.current) {
      const fabricCanvas = new fabric.Canvas('annotation-canvas', {
        isDrawingMode: true,
        selection: false,
        width: pageRef.current.offsetWidth,
        height: pageRef.current.offsetHeight,
        backgroundColor: 'transparent'
      });
      
      canvasRef.current = fabricCanvas;
      updateDrawingTool();
    }
    
    return () => {
      if (canvasRef.current) {
        canvasRef.current.dispose();
        canvasRef.current = null;
      }
    };
  }, [teacherMode, loading]);

  const updateDrawingTool = () => {
    if (!canvasRef.current) return;
    
    const canvas = canvasRef.current;
    canvas.isDrawingMode = tool !== 'eraser';
    
    if (canvas.freeDrawingBrush) {
      canvas.freeDrawingBrush.width = strokeWidth;
      canvas.freeDrawingBrush.color = 
        tool === 'green_pen' ? '#22c55e' :
        tool === 'red_pen' ? '#ef4444' :
        tool === 'yellow_highlight' ? 'rgba(234, 179, 8, 0.3)' :
        '#000000';
    }
  };

  useEffect(() => {
    updateDrawingTool();
  }, [tool, strokeWidth]);

  // Handle text selection
  const handleTextSelection = useCallback(async (e: React.MouseEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    if (!selection || selection.toString().trim() === '') return;
    
    const selectedString = selection.toString().trim();
    const verseElement = (e.target as HTMLElement).closest('[data-verse-key]');
    
    if (verseElement) {
      const verseKey = verseElement.getAttribute('data-verse-key');
      const verse = verses.find(v => v.verse_key === verseKey);
      
      if (verse && verseKey) {
        // Load translation only when selected
        const verseWithTranslation = await quranAPI.getVerseByKey(verseKey, ['131']);
        
        setSelectedText({
          text: selectedString,
          verseKey,
          verse: verseWithTranslation,
          position: { x: e.clientX, y: e.clientY }
        });
      }
    }
  }, [verses]);

  // Play audio for verse
  const playVerseAudio = async (verseKey: string) => {
    try {
      const audioUrl = await quranAPI.getAudioUrl(verseKey, selectedReciter);
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      audioRef.current = new Audio(audioUrl);
      audioRef.current.play();
      setIsPlaying(true);
      setCurrentPlayingVerse(verseKey);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentPlayingVerse(null);
      };
    } catch (error) {
      console.error('Error playing audio:', error);
    }
  };

  const stopAudio = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setIsPlaying(false);
    setCurrentPlayingVerse(null);
  };

  // Toggle bookmark
  const toggleBookmark = () => {
    const newBookmarks = bookmarks.includes(currentPage)
      ? bookmarks.filter(b => b !== currentPage)
      : [...bookmarks, currentPage];
    
    setBookmarks(newBookmarks);
    localStorage.setItem(`bookmarks_${studentId}`, JSON.stringify(newBookmarks));
  };

  // Save annotation
  const saveAnnotation = () => {
    if (!canvasRef.current || !onAnnotationSave) return;
    
    const annotationData = {
      studentId,
      page: currentPage,
      canvasData: canvasRef.current.toJSON(),
      timestamp: new Date().toISOString()
    };
    
    onAnnotationSave(annotationData);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-amber-100">
      {/* Minimal Header - Mushaf Style */}
      <div className="bg-gradient-to-b from-amber-900 to-amber-800 text-white shadow-xl">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Page Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="text-center">
                <div className="text-xs opacity-80">صفحة</div>
                <div className="text-xl font-bold">{currentPage}</div>
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(604, currentPage + 1))}
                disabled={currentPage === 604}
                className="p-2 rounded-lg hover:bg-amber-700 disabled:opacity-50 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            {/* Center - Surah Info */}
            <div className="text-center">
              <div className="text-lg font-arabic">
                {verses[0] && `سورة ${verses[0].verse_key.split(':')[0] === '1' ? 'الفاتحة' : 'البقرة'}`}
              </div>
            </div>
            
            {/* Right Controls */}
            <div className="flex items-center gap-2">
              {/* Font Size */}
              <button
                onClick={() => setFontSize(Math.max(20, fontSize - 2))}
                className="p-2 rounded-lg hover:bg-amber-700 transition-colors"
                title="Decrease text size"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <button
                onClick={() => setFontSize(Math.min(48, fontSize + 2))}
                className="p-2 rounded-lg hover:bg-amber-700 transition-colors"
                title="Increase text size"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              
              <div className="w-px h-6 bg-amber-600 mx-1" />
              
              {/* Bookmark */}
              <button
                onClick={toggleBookmark}
                className={`p-2 rounded-lg transition-colors ${
                  bookmarks.includes(currentPage)
                    ? 'bg-yellow-500 text-amber-900'
                    : 'hover:bg-amber-700'
                }`}
                title="Bookmark this page"
              >
                <Bookmark className="w-4 h-4" fill={bookmarks.includes(currentPage) ? 'currentColor' : 'none'} />
              </button>
              
              {/* Save Annotations */}
              {teacherMode && (
                <button
                  onClick={saveAnnotation}
                  className="px-3 py-1.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm"
                >
                  Save Notes
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Mushaf Page */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {loading ? (
            <div className="flex items-center justify-center min-h-[70vh]">
              <Loader2 className="w-12 h-12 animate-spin text-amber-600" />
            </div>
          ) : (
            <div 
              ref={pageRef}
              className="relative bg-white rounded-lg shadow-2xl mx-auto"
              style={{ 
                width: '100%',
                maxWidth: '800px',
                minHeight: '1000px',
                padding: '60px 50px',
                backgroundImage: 'linear-gradient(to right, #fdf6e3 0%, #fffef9 10%, #fffef9 90%, #fdf6e3 100%)',
                boxShadow: '0 20px 60px rgba(0,0,0,0.3), inset 0 0 60px rgba(252,211,77,0.1)'
              }}
            >
              {/* Page Border Decoration */}
              <div 
                className="absolute inset-4 border-2 border-amber-400 rounded pointer-events-none"
                style={{ 
                  borderImage: 'linear-gradient(45deg, #d97706, #fbbf24, #d97706) 1',
                  opacity: 0.3 
                }}
              />
              
              {/* Basmala for new Surahs */}
              {verses[0]?.verse_key === '1:1' && (
                <div className="text-center mb-8">
                  <div 
                    className="font-arabic text-amber-900"
                    style={{ fontSize: `${fontSize + 8}px` }}
                  >
                    ﷽
                  </div>
                </div>
              )}
              
              {/* Verses in Mushaf Style */}
              <div 
                className="font-arabic text-right leading-loose select-text"
                style={{ 
                  fontSize: `${fontSize}px`,
                  lineHeight: '2.5',
                  color: '#1a1a1a',
                  textAlign: 'justify',
                  direction: 'rtl',
                  fontFamily: "'Amiri Quran', 'Scheherazade', 'Traditional Arabic', serif"
                }}
                dir="rtl"
                onMouseUp={handleTextSelection}
              >
                {verses.map((verse, index) => (
                  <span
                    key={verse.verse_key}
                    data-verse-key={verse.verse_key}
                    className={`hover:bg-amber-50 transition-colors rounded px-1 ${
                      currentPlayingVerse === verse.verse_key ? 'bg-emerald-100' : ''
                    }`}
                    style={{ display: 'inline' }}
                  >
                    {/* Arabic text without spaces between verses */}
                    <span className="cursor-pointer">{verse.text_uthmani}</span>
                    
                    {/* Verse number in decorative circle */}
                    <span 
                      className="inline-block mx-1 text-center"
                      style={{
                        width: '35px',
                        height: '35px',
                        lineHeight: '35px',
                        fontSize: '14px',
                        backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 100 100\'%3E%3Ccircle cx=\'50\' cy=\'50\' r=\'45\' fill=\'none\' stroke=\'%23d97706\' stroke-width=\'2\'/%3E%3C/svg%3E")',
                        backgroundSize: 'contain',
                        backgroundRepeat: 'no-repeat',
                        backgroundPosition: 'center',
                        color: '#92400e',
                        fontWeight: 'bold',
                        verticalAlign: 'middle'
                      }}
                    >
                      {verse.verse_number}
                    </span>
                    {' '}
                  </span>
                ))}
              </div>
              
              {/* Annotation Canvas Overlay */}
              {teacherMode && (
                <canvas
                  id="annotation-canvas"
                  className="absolute inset-0 pointer-events-none"
                  style={{ 
                    pointerEvents: tool !== 'eraser' ? 'auto' : 'none',
                    zIndex: 10 
                  }}
                />
              )}
              
              {/* Page Footer Info */}
              <div className="absolute bottom-8 left-0 right-0 flex justify-between px-12 text-xs text-amber-700">
                <div>الجزء {Math.ceil(currentPage / 20)}</div>
                <div>الحزب {Math.ceil(currentPage / 10)}</div>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Selected Text Popup - Only shows when text is selected */}
      <AnimatePresence>
        {selectedText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 bg-white rounded-xl shadow-2xl p-5 max-w-md border border-amber-200"
            style={{
              left: `${Math.min(selectedText.position.x - 200, window.innerWidth - 450)}px`,
              top: `${Math.min(selectedText.position.y + 20, window.innerHeight - 300)}px`
            }}
          >
            <button
              onClick={() => setSelectedText(null)}
              className="absolute top-2 right-2 p-1 rounded-lg hover:bg-gray-100"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="space-y-4">
              {/* Selected Arabic Text */}
              <div className="text-right font-arabic text-2xl text-amber-900 pb-3 border-b" dir="rtl">
                {selectedText.text}
              </div>
              
              {/* Quick Actions */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => playVerseAudio(selectedText.verseKey)}
                  className="flex flex-col items-center gap-1 p-3 bg-emerald-50 rounded-lg hover:bg-emerald-100 transition-colors"
                >
                  <Volume2 className="w-5 h-5 text-emerald-600" />
                  <span className="text-xs">Listen</span>
                </button>
                
                <button
                  onClick={() => {
                    setShowTranslationOverlay(true);
                    // Translation is already loaded in selectedText.verse
                  }}
                  className="flex flex-col items-center gap-1 p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <Languages className="w-5 h-5 text-blue-600" />
                  <span className="text-xs">Translate</span>
                </button>
                
                <button
                  className="flex flex-col items-center gap-1 p-3 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors"
                >
                  <BookOpen className="w-5 h-5 text-purple-600" />
                  <span className="text-xs">Word by Word</span>
                </button>
              </div>
              
              {/* Translation (shown when requested) */}
              {showTranslationOverlay && selectedText.verse.translations && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm text-gray-700">
                    {selectedText.verse.translations[0]?.text}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    — Dr. Mustafa Khattab
                  </div>
                </div>
              )}
              
              {/* Verse Info */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-2 border-t">
                <span>Verse {selectedText.verseKey}</span>
                <button className="text-amber-600 hover:text-amber-700">
                  <Info className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}