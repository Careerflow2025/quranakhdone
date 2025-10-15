'use client';

import { useState, useEffect, useRef } from 'react';
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
  BookOpen
} from 'lucide-react';
import { quranAPI, Verse } from '@/services/quranApi';

interface SelectedText {
  text: string;
  verseKey: string;
  translation?: string;
  position: { x: number; y: number };
}

interface SimpleMushafViewerProps {
  studentId: string;
  teacherMode?: boolean;
  onAnnotationSave?: (annotation: any) => void;
}

// Quran data with translations included
const QURAN_PAGES: { [key: number]: { surah: string; verses: { key: string; arabic: string; translation: string; number: number }[] } } = {
  1: {
    surah: 'الفاتحة',
    verses: [
      { 
        key: '1:1', 
        arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 
        translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
        number: 1 
      },
      { 
        key: '1:2', 
        arabic: 'الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ', 
        translation: 'All praise is for Allah—Lord of all worlds',
        number: 2 
      },
      { 
        key: '1:3', 
        arabic: 'الرَّحْمَٰنِ الرَّحِيمِ', 
        translation: 'The Most Compassionate, Most Merciful',
        number: 3 
      },
      { 
        key: '1:4', 
        arabic: 'مَالِكِ يَوْمِ الدِّينِ', 
        translation: 'Master of the Day of Judgment',
        number: 4 
      },
      { 
        key: '1:5', 
        arabic: 'إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ', 
        translation: 'You alone we worship and You alone we ask for help',
        number: 5 
      },
      { 
        key: '1:6', 
        arabic: 'اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ', 
        translation: 'Guide us along the Straight Path',
        number: 6 
      },
      { 
        key: '1:7', 
        arabic: 'صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ', 
        translation: 'The Path of those You have blessed—not those You are displeased with, or those who are astray',
        number: 7 
      }
    ]
  },
  2: {
    surah: 'البقرة',
    verses: [
      { 
        key: '2:0', 
        arabic: 'بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ', 
        translation: 'In the name of Allah, the Most Gracious, the Most Merciful',
        number: 0 
      },
      { 
        key: '2:1', 
        arabic: 'الم', 
        translation: 'Alif-Lam-Mim',
        number: 1 
      },
      { 
        key: '2:2', 
        arabic: 'ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ', 
        translation: 'This is the Book! There is no doubt about it—a guide for those mindful of Allah',
        number: 2 
      },
      { 
        key: '2:3', 
        arabic: 'الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ', 
        translation: 'Who believe in the unseen, establish prayer, and donate from what We have provided for them',
        number: 3 
      },
      { 
        key: '2:4', 
        arabic: 'وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنزِلَ إِلَيْكَ وَمَا أُنزِلَ مِن قَبْلِكَ وَبِالْآخِرَةِ هُمْ يُوقِنُونَ', 
        translation: 'And who believe in what has been revealed to you and what was revealed before you, and have sure faith in the Hereafter',
        number: 4 
      },
      { 
        key: '2:5', 
        arabic: 'أُولَٰئِكَ عَلَىٰ هُدًى مِّن رَّبِّهِمْ ۖ وَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ', 
        translation: 'It is they who are truly guided by their Lord, and it is they who will be successful',
        number: 5 
      }
    ]
  }
};

export default function SimpleMushafViewer({ 
  studentId, 
  teacherMode = false,
  onAnnotationSave 
}: SimpleMushafViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [selectedText, setSelectedText] = useState<SelectedText | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPlayingVerse, setCurrentPlayingVerse] = useState<string | null>(null);
  const [fontSize, setFontSize] = useState(28);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [annotations, setAnnotations] = useState<{ [key: string]: any }>({});
  const [showTranslation, setShowTranslation] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load bookmarks on mount
  useEffect(() => {
    const savedBookmarks = localStorage.getItem(`bookmarks_${studentId}`);
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }
    
    const savedAnnotations = localStorage.getItem(`annotations_simple_${studentId}`);
    if (savedAnnotations) {
      setAnnotations(JSON.parse(savedAnnotations));
    }
  }, [studentId]);

  // Handle text selection
  const handleTextSelection = (verseKey: string, arabicText: string, translation: string, event: React.MouseEvent) => {
    const selection = window.getSelection();
    const selectedString = selection?.toString().trim() || arabicText;
    
    setSelectedText({
      text: selectedString,
      verseKey,
      translation,
      position: { x: event.clientX, y: event.clientY }
    });
  };

  // Play audio for verse
  const playVerseAudio = async (verseKey: string) => {
    try {
      setLoading(true);
      const audioUrl = await quranAPI.getAudioUrl(verseKey, 7); // Mishari Rashid
      
      if (audioRef.current) {
        audioRef.current.pause();
      }
      
      audioRef.current = new Audio(audioUrl);
      await audioRef.current.play();
      setIsPlaying(true);
      setCurrentPlayingVerse(verseKey);
      
      audioRef.current.onended = () => {
        setIsPlaying(false);
        setCurrentPlayingVerse(null);
      };
    } catch (error) {
      console.error('Error playing audio:', error);
      alert('Unable to play audio. Please check your internet connection.');
    } finally {
      setLoading(false);
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

  // Simple annotation system
  const addAnnotation = (verseKey: string, type: 'correct' | 'incorrect' | 'highlight') => {
    const newAnnotations = {
      ...annotations,
      [verseKey]: {
        type,
        timestamp: new Date().toISOString()
      }
    };
    setAnnotations(newAnnotations);
    localStorage.setItem(`annotations_simple_${studentId}`, JSON.stringify(newAnnotations));
    
    if (onAnnotationSave) {
      onAnnotationSave({
        studentId,
        page: currentPage,
        annotations: newAnnotations
      });
    }
  };

  const currentPageData = QURAN_PAGES[currentPage] || QURAN_PAGES[1];

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-orange-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-800 to-amber-900 text-white shadow-xl sticky top-0 z-40">
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
                <div className="text-xs opacity-80">الصفحة</div>
                <div className="text-xl font-bold">{currentPage} / 604</div>
              </div>
              
              <button
                onClick={() => setCurrentPage(currentPage < 2 ? 2 : 1)}
                className="p-2 rounded-lg hover:bg-amber-700 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            {/* Surah Name */}
            <div className="text-xl font-arabic">
              سورة {currentPageData.surah}
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFontSize(Math.max(18, fontSize - 2))}
                className="p-2 rounded-lg hover:bg-amber-700"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm">{fontSize}px</span>
              <button
                onClick={() => setFontSize(Math.min(48, fontSize + 2))}
                className="p-2 rounded-lg hover:bg-amber-700"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              
              <button
                onClick={toggleBookmark}
                className={`p-2 rounded-lg ${
                  bookmarks.includes(currentPage) ? 'bg-yellow-500' : 'hover:bg-amber-700'
                }`}
              >
                <Bookmark className="w-4 h-4" fill={bookmarks.includes(currentPage) ? 'white' : 'none'} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Mushaf Page */}
          <div 
            className="bg-white rounded-lg shadow-2xl p-12 relative"
            style={{
              minHeight: '800px',
              backgroundImage: 'linear-gradient(to right, #fef3c7 0%, #fffbeb 10%, #fffbeb 90%, #fef3c7 100%)',
              border: '3px solid #d97706',
              borderImage: 'linear-gradient(45deg, #92400e, #d97706, #92400e) 1'
            }}
          >
            {/* Decorative Border */}
            <div className="absolute inset-4 border-2 border-amber-300 opacity-30 pointer-events-none rounded" />
            
            {/* Basmala for Surah start */}
            {currentPage === 1 && (
              <div className="text-center mb-8">
                <div 
                  className="font-arabic text-black"
                  style={{ fontSize: `${fontSize + 4}px` }}
                >
                  ﷽
                </div>
              </div>
            )}
            
            {/* Verses */}
            <div className="space-y-4" dir="rtl">
              {currentPageData.verses.map((verse) => (
                <div
                  key={verse.key}
                  className={`font-arabic text-black leading-loose cursor-pointer hover:bg-amber-50 rounded-lg p-2 transition-colors relative ${
                    currentPlayingVerse === verse.key ? 'bg-green-50' : ''
                  } ${
                    annotations[verse.key]?.type === 'correct' ? 'border-l-4 border-green-500' :
                    annotations[verse.key]?.type === 'incorrect' ? 'border-l-4 border-red-500' :
                    annotations[verse.key]?.type === 'highlight' ? 'bg-yellow-50' : ''
                  }`}
                  style={{ 
                    fontSize: `${fontSize}px`,
                    textAlign: 'right',
                    lineHeight: '2'
                  }}
                  onClick={(e) => handleTextSelection(verse.key, verse.arabic, verse.translation, e)}
                >
                  <span>{verse.arabic}</span>
                  {verse.number > 0 && (
                    <span 
                      className="inline-block mx-2 text-center align-middle"
                      style={{
                        width: '30px',
                        height: '30px',
                        lineHeight: '30px',
                        fontSize: '14px',
                        border: '2px solid #d97706',
                        borderRadius: '50%',
                        color: '#92400e',
                        fontWeight: 'bold'
                      }}
                    >
                      {verse.number}
                    </span>
                  )}
                </div>
              ))}
            </div>
            
            {/* Teacher Annotation Buttons */}
            {teacherMode && (
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <button
                  className="p-2 bg-green-100 rounded-lg hover:bg-green-200"
                  title="Mark as correct"
                  onClick={() => selectedText && addAnnotation(selectedText.verseKey, 'correct')}
                >
                  ✅
                </button>
                <button
                  className="p-2 bg-red-100 rounded-lg hover:bg-red-200"
                  title="Mark as incorrect"
                  onClick={() => selectedText && addAnnotation(selectedText.verseKey, 'incorrect')}
                >
                  ❌
                </button>
                <button
                  className="p-2 bg-yellow-100 rounded-lg hover:bg-yellow-200"
                  title="Highlight"
                  onClick={() => selectedText && addAnnotation(selectedText.verseKey, 'highlight')}
                >
                  🟨
                </button>
              </div>
            )}
            
            {/* Page Footer */}
            <div className="absolute bottom-4 left-8 right-8 flex justify-between text-xs text-amber-700">
              <span>الجزء {Math.ceil(currentPage / 20)}</span>
              <span>الحزب {Math.ceil(currentPage / 10)}</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Selection Popup */}
      <AnimatePresence>
        {selectedText && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed z-50 bg-white rounded-xl shadow-2xl p-5 max-w-md border-2 border-amber-200"
            style={{
              left: Math.min(selectedText.position.x - 200, window.innerWidth - 450),
              top: Math.min(selectedText.position.y + 20, window.innerHeight - 400)
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
              {/* Arabic Text */}
              <div className="text-right font-arabic text-2xl text-black pb-2 border-b" dir="rtl">
                {selectedText.text}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => playVerseAudio(selectedText.verseKey)}
                  disabled={loading || isPlaying}
                  className="flex-1 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isPlaying && currentPlayingVerse === selectedText.verseKey ? (
                    <>
                      <Pause className="w-4 h-4" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Listen</span>
                    </>
                  )}
                </button>
                
                <button
                  onClick={() => setShowTranslation(!showTranslation)}
                  className={`flex-1 py-2 ${showTranslation ? 'bg-blue-700' : 'bg-blue-600'} text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2`}
                >
                  <Languages className="w-4 h-4" />
                  <span>{showTranslation ? 'Hide' : 'Translate'}</span>
                </button>
              </div>
              
              {/* Translation */}
              {showTranslation && selectedText.translation && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">{selectedText.translation}</p>
                  <p className="text-xs text-gray-500 mt-1">— Translation by Dr. Mustafa Khattab</p>
                </div>
              )}
              
              {/* Teacher Actions */}
              {teacherMode && (
                <div className="flex gap-2 pt-2 border-t">
                  <button
                    onClick={() => {
                      addAnnotation(selectedText.verseKey, 'correct');
                      setSelectedText(null);
                    }}
                    className="flex-1 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200"
                  >
                    ✅ Correct
                  </button>
                  <button
                    onClick={() => {
                      addAnnotation(selectedText.verseKey, 'incorrect');
                      setSelectedText(null);
                    }}
                    className="flex-1 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                  >
                    ❌ Wrong
                  </button>
                  <button
                    onClick={() => {
                      addAnnotation(selectedText.verseKey, 'highlight');
                      setSelectedText(null);
                    }}
                    className="flex-1 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                  >
                    🟨 Note
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Loading Overlay */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Loader2 className="w-12 h-12 animate-spin text-white" />
        </div>
      )}
    </div>
  );
}