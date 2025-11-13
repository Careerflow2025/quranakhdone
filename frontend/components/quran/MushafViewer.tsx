'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QuranAyah, Highlight, MistakeType, MISTAKE_COLORS } from '@/types';
import { useQuran } from '@/hooks/useQuran';
import { useHighlightStore } from '@/store/highlightStore';
import { useAuthStore } from '@/store/authStore';
import HighlightPopover from './HighlightPopover';
import NotesPanel from '@/features/annotations/components/NotesPanel';
import MushafFrameElaborate from './MushafFrameElaborate';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, ZoomIn, ZoomOut, MessageSquare } from 'lucide-react';

interface MushafViewerProps {
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

const MushafViewer: React.FC<MushafViewerProps> = ({
  surah,
  ayah,
  studentId,
  isTeacher = false,
  className = '',
}) => {
  const { user } = useAuthStore();
  const { ayahs, selectedScript, isLoading, error, changeScript } = useQuran(surah);
  const { highlights, fetchHighlights, createHighlight } = useHighlightStore();

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
  }, [studentId, fetchHighlights]);

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

  const getAyahHighlights = (ayahId: string): Highlight[] => {
    return highlights.filter(h => h.ayah_id === ayahId);
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

  const renderAyahText = (ayahData: QuranAyah) => {
    const ayahHighlights = getAyahHighlights(ayahData.id);

    if (ayahHighlights.length === 0) {
      return (
        <span
          data-ayah-id={ayahData.id}
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
        data-ayah-id={ayahData.id}
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
          <span className="text-[#8B7355] text-lg">Loading Qur'an...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen bg-[#FAF8F3]">
        <div className="text-center text-red-600 p-8">
          <p className="mb-4">Error loading Qur'an text: {error}</p>
          <Button onClick={() => window.location.reload()}>
            Retry
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`mushaf-viewer-container ${className}`} ref={containerRef}>
      {/* Navigation and Zoom Controls */}
      <div className="mushaf-controls">
        <div className="flex items-center justify-between mb-4 px-4">
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (surah > 1) {
                  window.location.href = `?surah=${surah - 1}`;
                }
              }}
              disabled={surah <= 1}
              className="bg-white/80"
            >
              <ChevronRight className="w-4 h-4 mr-1" />
              Previous
            </Button>

            <div className="text-center px-4">
              <h2 className="text-lg font-semibold text-[#8B7355]">Surah {surah}</h2>
              <p className="text-xs text-[#A0826D]">{ayahs.length} verses</p>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                if (surah < 114) {
                  window.location.href = `?surah=${surah + 1}`;
                }
              }}
              disabled={surah >= 114}
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
          {/* Ornamental Frame */}
          <MushafFrameElaborate />

          {/* Page Content with Zoom Transform */}
          <div
            ref={contentRef}
            className="mushaf-page-content"
            style={{
              transform: `scale(${zoomLevel})`,
              transformOrigin: 'top center',
            }}
          >
            {/* Continuous Ayah Text */}
            <div className="mushaf-text" dir="rtl">
              {ayahs.map((ayahItem, index) => (
                <React.Fragment key={ayahItem.id}>
                  {renderAyahText(ayahItem)}
                  {/* Ayah number badge */}
                  <span className="mushaf-ayah-number">
                    &#x06DD;{ayahItem.ayah}&#x06DE;
                  </span>
                  {/* Space between ayahs */}
                  {index < ayahs.length - 1 && ' '}
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

        .mushaf-page-content {
          padding: 80px 80px;
          transition: transform 0.2s ease;
          position: relative;
          z-index: 2;
        }

        .mushaf-text {
          font-family: 'Amiri Quran', 'Traditional Arabic', 'Scheherazade New', 'Arial Unicode MS', serif;
          font-size: 24px;
          line-height: 50px;
          text-align: justify;
          color: #1a1a1a;
          letter-spacing: -0.8px;
          word-spacing: -2px;
          direction: rtl;
          font-weight: 400;
        }

        .mushaf-ayah-text {
          display: inline;
        }

        .mushaf-ayah-number {
          display: inline-block;
          font-size: 20px;
          color: #8B7355;
          margin: 0 4px;
          font-weight: normal;
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

export default MushafViewer;
