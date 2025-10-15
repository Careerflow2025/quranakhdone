'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Book, 
  Volume2, 
  Languages, 
  Palette, 
  Search,
  ChevronLeft,
  ChevronRight,
  Bookmark,
  Settings,
  Play,
  Pause,
  RotateCcw,
  Download,
  Share2,
  Info,
  X,
  Loader2,
  ZoomIn,
  ZoomOut,
  Maximize2
} from 'lucide-react';
import { quranAPI, Verse, Chapter, TajweedRule, ReciterInfo } from '@/services/quranApi';
import { fabric } from 'fabric';
import { useAnnotationStore } from '@/features/annotations/state/useAnnotationStore';

interface SelectedText {
  text: string;
  verse: Verse;
  position: { x: number; y: number };
}

interface QuranViewerProps {
  studentId: string;
  teacherMode?: boolean;
  onAnnotationSave?: (annotation: any) => void;
}

export default function EnterpriseQuranViewer({ 
  studentId, 
  teacherMode = false,
  onAnnotationSave 
}: QuranViewerProps) {
  // State Management
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [currentChapter, setCurrentChapter] = useState<number>(1);
  const [verses, setVerses] = useState<Verse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedText, setSelectedText] = useState<SelectedText | null>(null);
  const [showTajweed, setShowTajweed] = useState(true);
  const [selectedTranslation, setSelectedTranslation] = useState('131'); // Dr. Mustafa Khattab
  const [selectedReciter, setSelectedReciter] = useState(7); // Mishari Rashid
  const [reciters, setReciters] = useState<ReciterInfo[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingVerse, setCurrentPlayingVerse] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(28);
  const [showTranslation, setShowTranslation] = useState(true);
  const [showWordMeaning, setShowWordMeaning] = useState(false);
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Verse[]>([]);
  const [showSettings, setShowSettings] = useState(false);
  
  // Refs
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const canvasRef = useRef<fabric.Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  
  // Annotation state from store
  const { tool, strokeWidth, setTool } = useAnnotationStore();

  // Load initial data
  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [chaptersData, recitersData] = await Promise.all([
        quranAPI.getChapters(),
        quranAPI.getReciters()
      ]);
      setChapters(chaptersData);
      setReciters(recitersData);
      
      // Load saved bookmarks
      const savedBookmarks = localStorage.getItem(`bookmarks_${studentId}`);
      if (savedBookmarks) {
        setBookmarks(JSON.parse(savedBookmarks));
      }
      
      // Load first chapter
      await loadChapter(1);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadChapter = async (chapterId: number) => {
    setLoading(true);
    try {
      const versesData = await quranAPI.getVersesByChapter(
        chapterId,
        [selectedTranslation]
      );
      setVerses(versesData);
      setCurrentChapter(chapterId);
    } catch (error) {
      console.error('Error loading chapter:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initialize Fabric.js canvas for annotations
  useEffect(() => {
    if (teacherMode && containerRef.current && !canvasRef.current) {
      const fabricCanvas = new fabric.Canvas('annotation-canvas', {
        isDrawingMode: true,
        selection: false,
        width: containerRef.current.offsetWidth,
        height: containerRef.current.offsetHeight
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
  }, [teacherMode]);

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
      
      if (verse) {
        // Get Tajweed rules for selected text
        const tajweedRules = await quranAPI.getTajweedRules(verseKey!);
        
        setSelectedText({
          text: selectedString,
          verse: { ...verse, tajweed: tajweedRules },
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
        
        // Auto-play next verse if enabled
        const currentIndex = verses.findIndex(v => v.verse_key === verseKey);
        if (currentIndex < verses.length - 1) {
          // playVerseAudio(verses[currentIndex + 1].verse_key);
        }
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
  const toggleBookmark = (verseKey: string) => {
    const newBookmarks = bookmarks.includes(verseKey)
      ? bookmarks.filter(b => b !== verseKey)
      : [...bookmarks, verseKey];
    
    setBookmarks(newBookmarks);
    localStorage.setItem(`bookmarks_${studentId}`, JSON.stringify(newBookmarks));
  };

  // Save annotation
  const saveAnnotation = () => {
    if (!canvasRef.current || !onAnnotationSave) return;
    
    const annotationData = {
      studentId,
      chapter: currentChapter,
      canvasData: canvasRef.current.toJSON(),
      timestamp: new Date().toISOString()
    };
    
    onAnnotationSave(annotationData);
  };

  // Search verses
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    const results = await quranAPI.searchVerses(searchQuery);
    setSearchResults(results);
  };

  // Apply Tajweed coloring
  const applyTajweedColors = (text: string, rules: TajweedRule[]) => {
    if (!rules || rules.length === 0) return text;
    
    let coloredText = text;
    rules.forEach(rule => {
      const style = `<span style="color: ${rule.color}" title="${rule.description}">`;
      coloredText = coloredText.substring(0, rule.start) + 
                   style + 
                   coloredText.substring(rule.start, rule.end) + 
                   '</span>' + 
                   coloredText.substring(rule.end);
    });
    
    return coloredText;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      {/* Header Toolbar */}
      <div className="sticky top-0 z-40 bg-white/95 backdrop-blur-lg shadow-lg border-b">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Chapter Navigation */}
            <div className="flex items-center gap-4">
              <button
                onClick={() => currentChapter > 1 && loadChapter(currentChapter - 1)}
                disabled={currentChapter === 1}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <select
                value={currentChapter}
                onChange={(e) => loadChapter(Number(e.target.value))}
                className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
              >
                {chapters.map(chapter => (
                  <option key={chapter.id} value={chapter.id}>
                    {chapter.id}. {chapter.name_simple} ({chapter.name_arabic})
                  </option>
                ))}
              </select>
              
              <button
                onClick={() => currentChapter < 114 && loadChapter(currentChapter + 1)}
                disabled={currentChapter === 114}
                className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-50"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            {/* Center Controls */}
            <div className="flex items-center gap-2">
              {/* Font Size */}
              <button
                onClick={() => setFontSize(Math.max(16, fontSize - 2))}
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Decrease font size"
              >
                <ZoomOut className="w-5 h-5" />
              </button>
              <span className="text-sm px-2">{fontSize}px</span>
              <button
                onClick={() => setFontSize(Math.min(48, fontSize + 2))}
                className="p-2 rounded-lg hover:bg-gray-100"
                title="Increase font size"
              >
                <ZoomIn className="w-5 h-5" />
              </button>
              
              <div className="w-px h-6 bg-gray-300 mx-2" />
              
              {/* Toggle Features */}
              <button
                onClick={() => setShowTajweed(!showTajweed)}
                className={`p-2 rounded-lg transition-colors ${
                  showTajweed ? 'bg-emerald-100 text-emerald-700' : 'hover:bg-gray-100'
                }`}
                title="Toggle Tajweed colors"
              >
                <Palette className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowTranslation(!showTranslation)}
                className={`p-2 rounded-lg transition-colors ${
                  showTranslation ? 'bg-blue-100 text-blue-700' : 'hover:bg-gray-100'
                }`}
                title="Toggle translation"
              >
                <Languages className="w-5 h-5" />
              </button>
              
              <button
                onClick={() => setShowWordMeaning(!showWordMeaning)}
                className={`p-2 rounded-lg transition-colors ${
                  showWordMeaning ? 'bg-purple-100 text-purple-700' : 'hover:bg-gray-100'
                }`}
                title="Toggle word meanings"
              >
                <Book className="w-5 h-5" />
              </button>
              
              {teacherMode && (
                <>
                  <div className="w-px h-6 bg-gray-300 mx-2" />
                  
                  {/* Annotation Tools */}
                  <button
                    onClick={() => setTool('green_pen')}
                    className={`p-2 rounded-lg transition-colors ${
                      tool === 'green_pen' ? 'bg-green-100 text-green-700' : 'hover:bg-gray-100'
                    }`}
                    title="Green pen"
                  >
                    ✅
                  </button>
                  
                  <button
                    onClick={() => setTool('red_pen')}
                    className={`p-2 rounded-lg transition-colors ${
                      tool === 'red_pen' ? 'bg-red-100 text-red-700' : 'hover:bg-gray-100'
                    }`}
                    title="Red pen"
                  >
                    ❌
                  </button>
                  
                  <button
                    onClick={() => setTool('yellow_highlight')}
                    className={`p-2 rounded-lg transition-colors ${
                      tool === 'yellow_highlight' ? 'bg-yellow-100 text-yellow-700' : 'hover:bg-gray-100'
                    }`}
                    title="Highlighter"
                  >
                    🟨
                  </button>
                  
                  <button
                    onClick={saveAnnotation}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
                  >
                    Save Notes
                  </button>
                </>
              )}
            </div>
            
            {/* Right Controls */}
            <div className="flex items-center gap-2">
              {/* Search */}
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  placeholder="Search..."
                  className="pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-emerald-500"
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              </div>
              
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-lg hover:bg-gray-100"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8 relative" ref={containerRef}>
        {loading ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Loader2 className="w-12 h-12 animate-spin text-emerald-600" />
          </div>
        ) : (
          <div className="max-w-5xl mx-auto">
            {/* Chapter Header */}
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                {chapters[currentChapter - 1]?.name_arabic}
              </h1>
              <h2 className="text-2xl text-gray-600">
                {chapters[currentChapter - 1]?.name_simple}
              </h2>
              <p className="text-sm text-gray-500 mt-2">
                {chapters[currentChapter - 1]?.verses_count} verses • 
                {chapters[currentChapter - 1]?.revelation_place === 'makkah' ? ' Meccan' : ' Medinan'}
              </p>
            </div>
            
            {/* Bismillah */}
            {chapters[currentChapter - 1]?.bismillah_pre && (
              <div className="text-center mb-8">
                <p className="text-3xl font-arabic" style={{ fontSize: `${fontSize + 4}px` }}>
                  بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                </p>
                {showTranslation && (
                  <p className="text-gray-600 mt-2">
                    In the name of Allah, the Most Gracious, the Most Merciful
                  </p>
                )}
              </div>
            )}
            
            {/* Verses */}
            <div className="space-y-8">
              {verses.map((verse) => (
                <motion.div
                  key={verse.verse_key}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`group relative ${
                    currentPlayingVerse === verse.verse_key ? 'bg-emerald-50 -mx-4 px-4 py-4 rounded-xl' : ''
                  }`}
                  data-verse-key={verse.verse_key}
                  onMouseUp={handleTextSelection}
                >
                  {/* Verse Number & Controls */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center justify-center w-10 h-10 bg-emerald-100 text-emerald-700 rounded-full font-semibold">
                        {verse.verse_number}
                      </span>
                      
                      <button
                        onClick={() => toggleBookmark(verse.verse_key)}
                        className={`p-2 rounded-lg transition-colors ${
                          bookmarks.includes(verse.verse_key)
                            ? 'text-yellow-500'
                            : 'text-gray-400 hover:text-gray-600'
                        }`}
                      >
                        <Bookmark className="w-4 h-4" fill={bookmarks.includes(verse.verse_key) ? 'currentColor' : 'none'} />
                      </button>
                    </div>
                    
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => {
                          if (currentPlayingVerse === verse.verse_key) {
                            stopAudio();
                          } else {
                            playVerseAudio(verse.verse_key);
                          }
                        }}
                        className="p-2 rounded-lg hover:bg-gray-100"
                      >
                        {currentPlayingVerse === verse.verse_key ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      
                      <button className="p-2 rounded-lg hover:bg-gray-100">
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Arabic Text */}
                  <div 
                    className="text-right font-arabic leading-loose select-text"
                    style={{ fontSize: `${fontSize}px` }}
                    dir="rtl"
                  >
                    {showTajweed && verse.tajweed ? (
                      <span dangerouslySetInnerHTML={{ 
                        __html: applyTajweedColors(verse.text_uthmani, verse.tajweed) 
                      }} />
                    ) : (
                      verse.text_uthmani
                    )}
                  </div>
                  
                  {/* Word-by-word translation */}
                  {showWordMeaning && verse.words && (
                    <div className="flex flex-wrap gap-4 mt-4 justify-end" dir="rtl">
                      {verse.words.map((word, idx) => (
                        <div key={idx} className="text-center">
                          <div className="text-xl font-arabic">{word.text_uthmani}</div>
                          <div className="text-xs text-gray-500">{word.translation?.text}</div>
                          <div className="text-xs text-gray-400">{word.transliteration?.text}</div>
                        </div>
                      ))}
                    </div>
                  )}
                  
                  {/* Translation */}
                  {showTranslation && verse.translations && verse.translations[0] && (
                    <div className="mt-4 text-gray-700 leading-relaxed">
                      {verse.translations[0].text}
                      <span className="text-xs text-gray-500 ml-2">
                        — {verse.translations[0].resource_name}
                      </span>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>
        )}
        
        {/* Annotation Canvas Overlay */}
        {teacherMode && (
          <canvas
            id="annotation-canvas"
            className="absolute inset-0 pointer-events-none"
            style={{ pointerEvents: tool !== 'eraser' ? 'auto' : 'none' }}
          />
        )}
      </div>
      
      {/* Selected Text Popup */}
      <AnimatePresence>
        {selectedText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 bg-white rounded-xl shadow-2xl p-6 max-w-md"
            style={{
              left: `${Math.min(selectedText.position.x, window.innerWidth - 400)}px`,
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
              <div className="text-right font-arabic text-2xl" dir="rtl">
                {selectedText.text}
              </div>
              
              {/* Translation */}
              {selectedText.verse.translations && (
                <div className="text-sm text-gray-700">
                  {selectedText.verse.translations[0]?.text}
                </div>
              )}
              
              {/* Tajweed Rules */}
              {selectedText.verse.tajweed && selectedText.verse.tajweed.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold text-sm">Tajweed Rules:</h4>
                  {selectedText.verse.tajweed.map((rule, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm">
                      <span 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: rule.color }}
                      />
                      <span>{rule.description}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {/* Actions */}
              <div className="flex gap-2 pt-2">
                <button
                  onClick={() => playVerseAudio(selectedText.verse.verse_key)}
                  className="flex-1 px-3 py-2 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 flex items-center justify-center gap-2"
                >
                  <Volume2 className="w-4 h-4" />
                  Play Audio
                </button>
                
                <button
                  onClick={() => toggleBookmark(selectedText.verse.verse_key)}
                  className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                >
                  <Bookmark className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            className="fixed right-0 top-0 h-full w-80 bg-white shadow-2xl z-50 overflow-y-auto"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Settings</h3>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="space-y-6">
                {/* Translation Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Translation</label>
                  <select
                    value={selectedTranslation}
                    onChange={(e) => {
                      setSelectedTranslation(e.target.value);
                      loadChapter(currentChapter);
                    }}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    <option value="131">Dr. Mustafa Khattab</option>
                    <option value="203">Sahih International</option>
                    <option value="19">Pickthall</option>
                    <option value="22">Yusuf Ali</option>
                    <option value="85">Abdul Haleem</option>
                  </select>
                </div>
                
                {/* Reciter Selection */}
                <div>
                  <label className="block text-sm font-medium mb-2">Reciter</label>
                  <select
                    value={selectedReciter}
                    onChange={(e) => setSelectedReciter(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg"
                  >
                    {reciters.map(reciter => (
                      <option key={reciter.id} value={reciter.id}>
                        {reciter.name}
                      </option>
                    ))}
                  </select>
                </div>
                
                {/* Display Options */}
                <div>
                  <label className="block text-sm font-medium mb-2">Display Options</label>
                  <div className="space-y-2">
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={showTajweed}
                        onChange={(e) => setShowTajweed(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Show Tajweed Colors</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={showTranslation}
                        onChange={(e) => setShowTranslation(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Show Translation</span>
                    </label>
                    
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={showWordMeaning}
                        onChange={(e) => setShowWordMeaning(e.target.checked)}
                        className="rounded"
                      />
                      <span className="text-sm">Show Word Meanings</span>
                    </label>
                  </div>
                </div>
                
                {/* Bookmarks */}
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Bookmarks ({bookmarks.length})
                  </label>
                  <div className="space-y-1 max-h-40 overflow-y-auto">
                    {bookmarks.map(bookmark => (
                      <button
                        key={bookmark}
                        onClick={() => {
                          const [chapter] = bookmark.split(':');
                          loadChapter(Number(chapter));
                          setShowSettings(false);
                        }}
                        className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100 rounded-lg"
                      >
                        Verse {bookmark}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}