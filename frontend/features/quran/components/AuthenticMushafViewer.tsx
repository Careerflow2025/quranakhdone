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
  ZoomOut
} from 'lucide-react';

interface SelectedText {
  text: string;
  verseKey: string;
  translation: string;
  position: { x: number; y: number };
}

interface AuthenticMushafViewerProps {
  studentId: string;
  teacherMode?: boolean;
  onAnnotationSave?: (annotation: any) => void;
}

// Translations database
const TRANSLATIONS: { [key: string]: string } = {
  '1:1': 'In the name of Allah, the Most Gracious, the Most Merciful',
  '1:2': 'All praise is for Allah—Lord of all worlds',
  '1:3': 'The Most Compassionate, Most Merciful',
  '1:4': 'Master of the Day of Judgment',
  '1:5': 'You alone we worship and You alone we ask for help',
  '1:6': 'Guide us along the Straight Path',
  '1:7': 'The Path of those You have blessed—not those You are displeased with, or those who are astray',
  '2:1': 'Alif-Lam-Mim',
  '2:2': 'This is the Book! There is no doubt about it—a guide for those mindful of Allah',
  '2:3': 'Who believe in the unseen, establish prayer, and donate from what We have provided for them',
  '2:4': 'And who believe in what has been revealed to you and what was revealed before you, and have sure faith in the Hereafter',
  '2:5': 'It is they who are truly guided by their Lord, and it is they who will be successful',
  '2:6': 'As for those who persist in disbelief, it is the same whether you warn them or not—they will not believe',
  '2:7': 'Allah has sealed their hearts and their hearing, and their sight is covered. They will suffer a tremendous punishment',
  // Add more translations as needed
};

// Authentic Quran pages with continuous text flow (Madani Mushaf style)
// Each page contains the exact text as it appears in the printed Mushaf
const QURAN_PAGES: { [key: number]: { pageText: string; verseMapping: { start: number; end: number; key: string }[] } } = {
  1: {
    pageText: `بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ ﴿١﴾ الْحَمْدُ لِلَّهِ رَبِّ الْعَالَمِينَ ﴿٢﴾ الرَّحْمَٰنِ الرَّحِيمِ ﴿٣﴾ مَالِكِ يَوْمِ الدِّينِ ﴿٤﴾ إِيَّاكَ نَعْبُدُ وَإِيَّاكَ نَسْتَعِينُ ﴿٥﴾ اهْدِنَا الصِّرَاطَ الْمُسْتَقِيمَ ﴿٦﴾ صِرَاطَ الَّذِينَ أَنْعَمْتَ عَلَيْهِمْ غَيْرِ الْمَغْضُوبِ عَلَيْهِمْ وَلَا الضَّالِّينَ ﴿٧﴾`,
    verseMapping: [
      { start: 0, end: 39, key: '1:1' },
      { start: 40, end: 82, key: '1:2' },
      { start: 83, end: 108, key: '1:3' },
      { start: 109, end: 137, key: '1:4' },
      { start: 138, end: 188, key: '1:5' },
      { start: 189, end: 228, key: '1:6' },
      { start: 229, end: 336, key: '1:7' }
    ]
  },
  2: {
    pageText: `بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ

الم ﴿١﴾ ذَٰلِكَ الْكِتَابُ لَا رَيْبَ ۛ فِيهِ ۛ هُدًى لِّلْمُتَّقِينَ ﴿٢﴾ الَّذِينَ يُؤْمِنُونَ بِالْغَيْبِ وَيُقِيمُونَ الصَّلَاةَ وَمِمَّا رَزَقْنَاهُمْ يُنفِقُونَ ﴿٣﴾ وَالَّذِينَ يُؤْمِنُونَ بِمَا أُنزِلَ إِلَيْكَ وَمَا أُنزِلَ مِن قَبْلِكَ وَبِالْآخِرَةِ هُمْ يُوقِنُونَ ﴿٤﴾ أُولَٰئِكَ عَلَىٰ هُدًى مِّن رَّبِّهِمْ ۖ وَأُولَٰئِكَ هُمُ الْمُفْلِحُونَ ﴿٥﴾`,
    verseMapping: [
      { start: 42, end: 49, key: '2:1' },
      { start: 50, end: 117, key: '2:2' },
      { start: 118, end: 234, key: '2:3' },
      { start: 235, end: 365, key: '2:4' },
      { start: 366, end: 460, key: '2:5' }
    ]
  },
  3: {
    pageText: `إِنَّ الَّذِينَ كَفَرُوا سَوَاءٌ عَلَيْهِمْ أَأَنذَرْتَهُمْ أَمْ لَمْ تُنذِرْهُمْ لَا يُؤْمِنُونَ ﴿٦﴾ خَتَمَ اللَّهُ عَلَىٰ قُلُوبِهِمْ وَعَلَىٰ سَمْعِهِمْ ۖ وَعَلَىٰ أَبْصَارِهِمْ غِشَاوَةٌ ۖ وَلَهُمْ عَذَابٌ عَظِيمٌ ﴿٧﴾ وَمِنَ النَّاسِ مَن يَقُولُ آمَنَّا بِاللَّهِ وَبِالْيَوْمِ الْآخِرِ وَمَا هُم بِمُؤْمِنِينَ ﴿٨﴾ يُخَادِعُونَ اللَّهَ وَالَّذِينَ آمَنُوا وَمَا يَخْدَعُونَ إِلَّا أَنفُسَهُمْ وَمَا يَشْعُرُونَ ﴿٩﴾ فِي قُلُوبِهِم مَّرَضٌ فَزَادَهُمُ اللَّهُ مَرَضًا ۖ وَلَهُمْ عَذَابٌ أَلِيمٌ بِمَا كَانُوا يَكْذِبُونَ ﴿١٠﴾`,
    verseMapping: [
      { start: 0, end: 91, key: '2:6' },
      { start: 92, end: 218, key: '2:7' },
      { start: 219, end: 316, key: '2:8' },
      { start: 317, end: 425, key: '2:9' },
      { start: 426, end: 540, key: '2:10' }
    ]
  }
  // In a real implementation, you would have all 604 pages
  // For demo, we'll cycle through these pages
};

// Function to get page data (cycles through available pages for demo)
const getPageData = (pageNum: number) => {
  const availablePages = Object.keys(QURAN_PAGES).length;
  const cyclePage = ((pageNum - 1) % availablePages) + 1;
  return QURAN_PAGES[cyclePage] || QURAN_PAGES[1];
};

export default function AuthenticMushafViewer({ 
  studentId, 
  teacherMode = false,
  onAnnotationSave 
}: AuthenticMushafViewerProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedText, setSelectedText] = useState<SelectedText | null>(null);
  const [fontSize, setFontSize] = useState(24);
  const [bookmarks, setBookmarks] = useState<number[]>([]);
  const [showTranslation, setShowTranslation] = useState(false);
  const [annotations, setAnnotations] = useState<{ [key: string]: any }>({});
  const [highlightedVerse, setHighlightedVerse] = useState<string | null>(null);
  
  const pageRef = useRef<HTMLDivElement>(null);

  // Load saved data
  useEffect(() => {
    const savedBookmarks = localStorage.getItem(`bookmarks_${studentId}`);
    if (savedBookmarks) {
      setBookmarks(JSON.parse(savedBookmarks));
    }
    
    const savedAnnotations = localStorage.getItem(`annotations_${studentId}`);
    if (savedAnnotations) {
      setAnnotations(JSON.parse(savedAnnotations));
    }
  }, [studentId]);

  // Handle text click to detect which verse was clicked
  const handleTextClick = (event: React.MouseEvent<HTMLDivElement>) => {
    const selection = window.getSelection();
    const selectedString = selection?.toString().trim();
    
    if (!selectedString || selectedString.length < 3) return;
    
    // Get click position relative to the text
    const range = selection?.getRangeAt(0);
    if (!range) return;
    
    // Find which verse was clicked based on position
    const pageData = getPageData(currentPage);
    const clickOffset = range.startOffset;
    
    let clickedVerse = null;
    for (const mapping of pageData.verseMapping) {
      if (clickOffset >= mapping.start && clickOffset <= mapping.end) {
        clickedVerse = mapping.key;
        break;
      }
    }
    
    if (clickedVerse) {
      const translation = TRANSLATIONS[clickedVerse] || 'Translation coming soon...';
      setSelectedText({
        text: selectedString || 'Selected verse',
        verseKey: clickedVerse,
        translation,
        position: { x: event.clientX, y: event.clientY }
      });
      setHighlightedVerse(clickedVerse);
    }
  };

  // Toggle bookmark
  const toggleBookmark = () => {
    const newBookmarks = bookmarks.includes(currentPage)
      ? bookmarks.filter(b => b !== currentPage)
      : [...bookmarks, currentPage];
    
    setBookmarks(newBookmarks);
    localStorage.setItem(`bookmarks_${studentId}`, JSON.stringify(newBookmarks));
  };

  // Add annotation
  const addAnnotation = (verseKey: string, type: 'correct' | 'incorrect' | 'highlight') => {
    const newAnnotations = {
      ...annotations,
      [verseKey]: { type, timestamp: new Date().toISOString() }
    };
    setAnnotations(newAnnotations);
    localStorage.setItem(`annotations_${studentId}`, JSON.stringify(newAnnotations));
    
    if (onAnnotationSave) {
      onAnnotationSave({ studentId, page: currentPage, annotations: newAnnotations });
    }
  };

  const pageData = getPageData(currentPage);

  // Apply verse highlighting and annotations to the text
  const renderPageText = () => {
    let formattedText = pageData.pageText;
    
    // Add highlighting for selected verse
    if (highlightedVerse) {
      const mapping = pageData.verseMapping.find(m => m.key === highlightedVerse);
      if (mapping) {
        const beforeText = formattedText.substring(0, mapping.start);
        const verseText = formattedText.substring(mapping.start, mapping.end + 1);
        const afterText = formattedText.substring(mapping.end + 1);
        
        let highlightClass = 'bg-blue-100';
        if (annotations[highlightedVerse]) {
          if (annotations[highlightedVerse].type === 'correct') highlightClass = 'bg-green-100';
          else if (annotations[highlightedVerse].type === 'incorrect') highlightClass = 'bg-red-100';
          else if (annotations[highlightedVerse].type === 'highlight') highlightClass = 'bg-yellow-100';
        }
        
        return (
          <>
            {beforeText}
            <span className={`${highlightClass} rounded px-1`}>{verseText}</span>
            {afterText}
          </>
        );
      }
    }
    
    return formattedText;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 via-orange-50 to-amber-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-amber-800 to-amber-900 text-white shadow-xl sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            {/* Page Navigation */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                className="p-2 rounded-lg hover:bg-amber-700 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              
              <div className="text-center">
                <div className="text-xs opacity-80 font-arabic">صفحة</div>
                <input
                  type="number"
                  value={currentPage}
                  onChange={(e) => {
                    const page = parseInt(e.target.value) || 1;
                    setCurrentPage(Math.min(604, Math.max(1, page)));
                  }}
                  className="w-16 text-center bg-amber-700 rounded px-2 py-1 text-white font-bold"
                  min="1"
                  max="604"
                />
                <div className="text-xs opacity-80">من ٦٠٤</div>
              </div>
              
              <button
                onClick={() => setCurrentPage(Math.min(604, currentPage + 1))}
                className="p-2 rounded-lg hover:bg-amber-700 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            
            {/* Center - Jump to specific pages */}
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(1)}
                className="px-3 py-1 text-xs bg-amber-700 rounded hover:bg-amber-600"
              >
                الفاتحة
              </button>
              <button
                onClick={() => setCurrentPage(2)}
                className="px-3 py-1 text-xs bg-amber-700 rounded hover:bg-amber-600"
              >
                البقرة
              </button>
              <button
                onClick={() => setCurrentPage(49)}
                className="px-3 py-1 text-xs bg-amber-700 rounded hover:bg-amber-600"
              >
                آل عمران
              </button>
              <button
                onClick={() => setCurrentPage(76)}
                className="px-3 py-1 text-xs bg-amber-700 rounded hover:bg-amber-600"
              >
                النساء
              </button>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setFontSize(Math.max(16, fontSize - 2))}
                className="p-2 rounded-lg hover:bg-amber-700"
                title="Smaller text"
              >
                <ZoomOut className="w-4 h-4" />
              </button>
              <span className="text-sm font-bold">{fontSize}</span>
              <button
                onClick={() => setFontSize(Math.min(40, fontSize + 2))}
                className="p-2 rounded-lg hover:bg-amber-700"
                title="Larger text"
              >
                <ZoomIn className="w-4 h-4" />
              </button>
              
              <div className="w-px h-6 bg-amber-600 mx-1" />
              
              <button
                onClick={toggleBookmark}
                className={`p-2 rounded-lg transition-colors ${
                  bookmarks.includes(currentPage) ? 'bg-yellow-500' : 'hover:bg-amber-700'
                }`}
                title="Bookmark"
              >
                <Bookmark className="w-4 h-4" fill={bookmarks.includes(currentPage) ? 'white' : 'none'} />
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Main Mushaf Page */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div 
            ref={pageRef}
            className="bg-white rounded-lg shadow-2xl relative"
            style={{
              minHeight: '900px',
              padding: '80px 60px',
              backgroundImage: `
                linear-gradient(to right, #fef3c7 0%, #fffbeb 8%, #fffbeb 92%, #fef3c7 100%),
                repeating-linear-gradient(
                  0deg,
                  transparent,
                  transparent 35px,
                  rgba(217, 119, 6, 0.05) 35px,
                  rgba(217, 119, 6, 0.05) 36px
                )
              `,
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), inset 0 0 100px rgba(217, 119, 6, 0.1)'
            }}
          >
            {/* Decorative Islamic Border */}
            <div 
              className="absolute inset-6 pointer-events-none"
              style={{
                border: '2px solid transparent',
                borderImage: `linear-gradient(
                  45deg,
                  #d97706 0%,
                  #f59e0b 25%,
                  #d97706 50%,
                  #f59e0b 75%,
                  #d97706 100%
                ) 1`,
                opacity: 0.3
              }}
            />
            
            {/* Page Number Decoration */}
            <div className="absolute top-10 left-1/2 transform -translate-x-1/2">
              <div className="text-amber-700 text-sm font-arabic opacity-60">
                ﴿ {currentPage} ﴾
              </div>
            </div>
            
            {/* Main Quran Text - Continuous Flow */}
            <div 
              className="font-arabic text-black leading-loose select-text cursor-pointer"
              style={{ 
                fontSize: `${fontSize}px`,
                textAlign: 'justify',
                direction: 'rtl',
                lineHeight: '2.2',
                wordSpacing: '0.3em',
                fontFamily: "'Amiri Quran', 'Scheherazade', 'Traditional Arabic', 'Noto Naskh Arabic', serif"
              }}
              dir="rtl"
              onClick={handleTextClick}
            >
              {renderPageText()}
            </div>
            
            {/* Teacher Annotation Buttons */}
            {teacherMode && selectedText && (
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                <button
                  onClick={() => addAnnotation(selectedText.verseKey, 'correct')}
                  className="p-2 bg-green-100 rounded-lg hover:bg-green-200 shadow"
                  title="Mark as correct"
                >
                  ✅
                </button>
                <button
                  onClick={() => addAnnotation(selectedText.verseKey, 'incorrect')}
                  className="p-2 bg-red-100 rounded-lg hover:bg-red-200 shadow"
                  title="Mark as incorrect"
                >
                  ❌
                </button>
                <button
                  onClick={() => addAnnotation(selectedText.verseKey, 'highlight')}
                  className="p-2 bg-yellow-100 rounded-lg hover:bg-yellow-200 shadow"
                  title="Highlight"
                >
                  🟨
                </button>
              </div>
            )}
            
            {/* Page Footer Info */}
            <div className="absolute bottom-10 left-12 right-12 flex justify-between text-xs text-amber-700 font-arabic">
              <span>الجزء {Math.ceil(currentPage / 20)}</span>
              <span>الربع {Math.ceil(currentPage / 5)}</span>
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
                setHighlightedVerse(null);
              }}
              className="absolute top-2 right-2 p-1 hover:bg-gray-100 rounded"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="space-y-4">
              {/* Verse Reference */}
              <div className="text-center text-sm text-amber-700 font-semibold">
                Verse {selectedText.verseKey}
              </div>
              
              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowTranslation(!showTranslation)}
                  className={`flex-1 py-2 ${showTranslation ? 'bg-blue-700' : 'bg-blue-600'} text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2`}
                >
                  <Languages className="w-4 h-4" />
                  <span>{showTranslation ? 'Hide' : 'Show'} Translation</span>
                </button>
              </div>
              
              {/* Translation */}
              {showTranslation && (
                <div className="p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-gray-700">{selectedText.translation}</p>
                  <p className="text-xs text-gray-500 mt-2">— Dr. Mustafa Khattab</p>
                </div>
              )}
              
              {/* Teacher Actions */}
              {teacherMode && (
                <div className="flex gap-2 pt-2 border-t">
                  <button
                    onClick={() => {
                      addAnnotation(selectedText.verseKey, 'correct');
                      setSelectedText(null);
                      setHighlightedVerse(null);
                    }}
                    className="flex-1 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 text-sm"
                  >
                    ✅ Correct
                  </button>
                  <button
                    onClick={() => {
                      addAnnotation(selectedText.verseKey, 'incorrect');
                      setSelectedText(null);
                      setHighlightedVerse(null);
                    }}
                    className="flex-1 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 text-sm"
                  >
                    ❌ Wrong
                  </button>
                  <button
                    onClick={() => {
                      addAnnotation(selectedText.verseKey, 'highlight');
                      setSelectedText(null);
                      setHighlightedVerse(null);
                    }}
                    className="flex-1 py-1 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-sm"
                  >
                    🟨 Note
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}