'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QuranAyah, Highlight, MistakeType, MISTAKE_COLORS } from '@/types';
import { useHighlightStore } from '@/store/highlightStore';
import { useAuthStore } from '@/store/authStore';
import HighlightPopover from './HighlightPopover';
import NotesPanel from '@/features/annotations/components/NotesPanel';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, MessageSquare } from 'lucide-react';
import { useMushafPage, MushafAyah } from '@/hooks/useMushafPage';
import { getSurahStartPage } from '@/lib/mushafUtils';

interface MushafPageViewerProps {
  surah: number;
  ayah?: number;
  studentId?: string;
  isTeacher?: boolean;
  className?: string;
}

interface TextSelection {
  ayahId: string;
  tokenStart: number;
  tokenEnd: number;
  selectedText: string;
}

const MushafPageViewer: React.FC<MushafPageViewerProps> = ({
  surah,
  ayah,
  studentId,
  isTeacher = false,
  className = '',
}) => {
  console.log('🚀 MushafPageViewer LOADED - Page-based navigation active');
  console.log('📥 MushafPageViewer props:', { surah, ayah, studentId, isTeacher, className });
  const { user } = useAuthStore();
  console.log('👤 MushafPageViewer user:', user);
  const { highlights, fetchHighlights, createHighlight } = useHighlightStore();

  // Get starting page for the surah
  const startPage = getSurahStartPage(surah);
  const { pageData, currentPage, isLoading, error, goToPage, nextPage, previousPage } = useMushafPage(startPage);

  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [showPopover, setShowPopover] = useState(false);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedHighlightForNotes, setSelectedHighlightForNotes] = useState<string | null>(null);
  const [zoomLevel, setZoomLevel] = useState(1);
  const containerRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (studentId) {
      fetchHighlights({ student_id: studentId });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId]); // fetchHighlights is stable from Zustand store

  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isTeacher) return;

    const windowSelection = window.getSelection();
    if (!windowSelection || windowSelection.rangeCount === 0) return;

    const range = windowSelection.getRangeAt(0);
    const selectedText = range.toString().trim();

    if (!selectedText) {
      setShowPopover(false);
      return;
    }

    const ayahElement = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentElement?.closest('[data-ayah-id]')
      : (range.commonAncestorContainer as Element).closest('[data-ayah-id]');

    if (!ayahElement) return;

    const ayahId = ayahElement.getAttribute('data-ayah-id');
    if (!ayahId) return;

    const tokenStart = range.startOffset;
    const tokenEnd = range.endOffset;

    setSelection({
      ayahId,
      tokenStart,
      tokenEnd,
      selectedText,
    });

    const rect = range.getBoundingClientRect();
    setPopoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10,
    });

    setShowPopover(true);
  }, [isTeacher]);

  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  const handleCreateHighlight = async (mistakeType: MistakeType, note?: string) => {
    if (!selection || !studentId || !user) return;

    const result = await createHighlight({
      student_id: studentId,
      ayah_id: selection.ayahId,
      token_start: selection.tokenStart,
      token_end: selection.tokenEnd,
      mistake: mistakeType,
      note,
    });

    if (result.success) {
      setShowPopover(false);
      setSelection(null);
      window.getSelection()?.removeAllRanges();
    }
  };

  const getAyahHighlights = (ayahNumber: number): Highlight[] => {
    return highlights.filter(h => {
      // Match by ayah number and surah
      const ayahData = pageData?.ayahs.find(a => a.number === ayahNumber);
      if (!ayahData) return false;

      // h.ayah_id format is typically "surah:ayah" or similar
      // We need to match based on the actual ayah
      return h.ayah_id.includes(`${ayahData.surah.number}:${ayahData.numberInSurah}`);
    });
  };

  const handleHighlightClick = (highlight: Highlight) => {
    if (highlight.notes && highlight.notes.length > 0) {
      setSelectedHighlightForNotes(highlight.id);
      setShowNotesModal(true);
    }
  };

  const hasNotes = (highlight: Highlight): boolean => {
    return !!(highlight.notes && highlight.notes.length > 0);
  };

  const handleZoomIn = () => {
    setZoomLevel(prev => Math.min(prev + 0.1, 2));
  };

  const handleZoomOut = () => {
    setZoomLevel(prev => Math.max(prev - 0.1, 0.5));
  };

  const renderAyahText = (ayahData: MushafAyah) => {
    const ayahHighlights = getAyahHighlights(ayahData.number);
    const ayahId = `${ayahData.surah.number}:${ayahData.numberInSurah}`;

    if (ayahHighlights.length === 0) {
      return (
        <span
          data-ayah-id={ayahId}
          className="mushaf-ayah-text"
        >
          {ayahData.text}
        </span>
      );
    }

    const sortedHighlights = [...ayahHighlights].sort((a, b) => a.token_start - b.token_start);
    const segments: JSX.Element[] = [];
    let lastPos = 0;

    sortedHighlights.forEach((highlight, idx) => {
      const color = MISTAKE_COLORS[highlight.mistake];
      const start = highlight.token_start;
      const end = highlight.token_end;

      if (start > lastPos) {
        segments.push(
          <span key={`text-${idx}`}>
            {ayahData.text.slice(lastPos, start)}
          </span>
        );
      }

      const highlightText = ayahData.text.slice(start, end);
      const highlightHasNotes = hasNotes(highlight);

      segments.push(
        <mark
          key={`highlight-${idx}`}
          className={`mushaf-highlight ${highlightHasNotes ? 'cursor-pointer hover:opacity-80' : ''}`}
          style={{
            backgroundColor: `${color}20`,
            borderBottom: `2px solid ${color}`,
            paddingRight: highlightHasNotes ? '18px' : '0',
            position: 'relative',
          }}
          title={highlight.mistake}
          onClick={() => highlightHasNotes && handleHighlightClick(highlight)}
        >
          {highlightText}
          {highlightHasNotes && (
            <MessageSquare
              className="inline-block"
              style={{
                width: '12px',
                height: '12px',
                color: color,
                position: 'absolute',
                top: '-2px',
                marginLeft: '2px',
              }}
            />
          )}
        </mark>
      );

      lastPos = end;
    });

    if (lastPos < ayahData.text.length) {
      segments.push(
        <span key="text-end">
          {ayahData.text.slice(lastPos)}
        </span>
      );
    }

    return (
      <span
        data-ayah-id={ayahId}
        className="mushaf-ayah-text"
      >
        {segments}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FAF8F3]">
        <div className="text-center">
          <div className="loading-spinner mb-4" />
          <span className="text-[#8B7355] text-lg">Loading Mushaf Page...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FAF8F3]">
        <div className="text-center text-red-600 p-8">
          <p className="mb-4">Error loading Mushaf page: {error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!pageData) return null;

  return (
    <div className={`mushaf-viewer-container ${className}`} ref={containerRef}>
      {/* Navigation and Zoom Controls */}
      <div className="mushaf-controls">
        <div className="flex items-center justify-between mb-4 px-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={previousPage}
              disabled={currentPage <= 1}
              className="bg-white/80"
            >
              <ChevronRight className="w-4 h-4 mr-1" />
              Previous
            </Button>

            <div className="text-center px-4">
              <h2 className="text-lg font-semibold text-[#8B7355]">Page {currentPage}</h2>
              <p className="text-xs text-[#A0826D]">of 604</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={nextPage}
              disabled={currentPage >= 604}
              className="bg-white/80"
            >
              Next
              <ChevronLeft className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomOut}
              disabled={zoomLevel <= 0.5}
              className="bg-white/80"
            >
              <ZoomOut className="w-4 h-4" />
            </Button>
            <span className="text-sm text-[#8B7355] font-medium">{Math.round(zoomLevel * 100)}%</span>
            <Button
              variant="outline"
              size="sm"
              onClick={handleZoomIn}
              disabled={zoomLevel >= 2}
              className="bg-white/80"
            >
              <ZoomIn className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mushaf Page */}
      <div className="mushaf-page-wrapper">
        <div className="mushaf-page">
          {/* Elaborate Ornamental Border - Will load as background image */}
          <div className="mushaf-border-overlay" />

          {/* Page Content with Zoom Transform */}
          <div
            ref={contentRef}
            className="mushaf-page-content"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Page Header - Surah name if page starts with new surah */}
            {pageData.ayahs[0]?.numberInSurah === 1 && (
              <div className="mushaf-surah-header">
                <div className="mushaf-surah-name">{pageData.ayahs[0].surah.name}</div>
              </div>
            )}

            {/* Continuous Ayah Text */}
            <div className="mushaf-text" dir="rtl">
              {pageData.ayahs.map((ayahItem, index) => (
                <React.Fragment key={`${ayahItem.surah.number}-${ayahItem.numberInSurah}`}>
                  {renderAyahText(ayahItem)}
                  {/* Ayah number marker */}
                  <span className="mushaf-ayah-number">
                    &#x06DD;{ayahItem.numberInSurah}&#x06DE;
                  </span>
                  {/* Space between ayahs */}
                  {index < pageData.ayahs.length - 1 && ' '}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Highlight Popover */}
      {showPopover && selection && isTeacher && (
        <HighlightPopover
          isOpen={showPopover}
          onClose={() => {
            setShowPopover(false);
            setSelection(null);
          }}
          onSelect={handleCreateHighlight}
          position={popoverPosition}
        />
      )}

      {/* Notes Panel */}
      {showNotesModal && selectedHighlightForNotes && (
        <NotesPanel
          highlightId={selectedHighlightForNotes}
          isOpen={showNotesModal}
          onClose={() => {
            setShowNotesModal(false);
            setSelectedHighlightForNotes(null);
          }}
          isTeacher={isTeacher}
        />
      )}

      <style jsx>{`
        .mushaf-viewer-container {
          min-height: 100vh;
          background: linear-gradient(135deg, #FAF8F3 0%, #F5F1E8 100%);
          padding: 2rem;
        }

        .mushaf-controls {
          max-width: 900px;
          margin: 0 auto;
        }

        .mushaf-page-wrapper {
          display: flex;
          justify-content: center;
          align-items: flex-start;
          overflow: auto;
          padding: 2rem 0;
        }

        .mushaf-page {
          position: relative;
          width: 800px;
          min-height: 1100px;
          background: linear-gradient(to bottom, #FFFEF9 0%, #FAF8F3 100%);
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
          border-radius: 8px;
          margin: 0 auto;
        }

        .mushaf-border-overlay {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          pointer-events: none;
          z-index: 1;
        }

        .mushaf-border-overlay::before {
          content: '';
          position: absolute;
          top: 10px;
          left: 10px;
          right: 10px;
          bottom: 10px;
          border: 8px solid #8B7355;
          border-radius: 4px;
          box-shadow:
            0 0 0 2px #D4AF37,
            0 0 0 4px #8B7355,
            inset 0 0 0 2px #D4AF37,
            inset 0 0 0 4px #8B7355;
        }

        .mushaf-border-overlay::after {
          content: '';
          position: absolute;
          top: 30px;
          left: 30px;
          right: 30px;
          bottom: 30px;
          border: 3px solid #D4AF37;
          border-radius: 4px;
          background-image:
            repeating-linear-gradient(0deg, transparent, transparent 20px, rgba(212, 175, 55, 0.2) 20px, rgba(212, 175, 55, 0.2) 22px),
            repeating-linear-gradient(90deg, transparent, transparent 20px, rgba(212, 175, 55, 0.2) 20px, rgba(212, 175, 55, 0.2) 22px);
          background-size: 22px 22px;
        }

        .mushaf-page-content {
          padding: 80px 80px;
          transition: transform 0.2s ease;
          position: relative;
          z-index: 2;
        }

        .mushaf-surah-header {
          text-align: center;
          margin-bottom: 40px;
          padding-bottom: 20px;
          border-bottom: 2px solid #D4AF37;
        }

        .mushaf-surah-name {
          font-family: 'Amiri Quran', 'Traditional Arabic', 'Scheherazade New', serif;
          font-size: 32px;
          font-weight: 700;
          color: #8B4513;
          letter-spacing: 2px;
        }

        .mushaf-text {
          font-family: 'Amiri Quran', 'Scheherazade New', 'Traditional Arabic', 'Arial Unicode MS', serif;
          font-size: 32px;
          line-height: 80px;
          text-align: justify;
          color: #000000;
          letter-spacing: 0.5px;
          word-spacing: 2px;
          direction: rtl;
          font-weight: 700;
        }

        .mushaf-ayah-text {
          display: inline;
        }

        .mushaf-ayah-number {
          display: inline-block;
          font-size: 24px;
          color: #8B7355;
          margin: 0 6px;
          font-weight: normal;
          vertical-align: middle;
        }

        .mushaf-highlight {
          display: inline;
          padding: 2px 0;
          border-radius: 2px;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 4px solid #E5DCC5;
          border-top-color: #8B7355;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media print {
          .mushaf-controls {
            display: none;
          }

          .mushaf-page {
            box-shadow: none;
          }
        }
      `}</style>
    </div>
  );
};

export default MushafPageViewer;
