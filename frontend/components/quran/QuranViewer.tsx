'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QuranAyah, Highlight, MistakeType, MISTAKE_COLORS } from '@/types';
import { useQuran } from '@/hooks/useQuran';
import { useHighlightStore } from '@/store/highlightStore';
import { useAuthStore } from '@/store/authStore';
import HighlightPopover from './HighlightPopover';
import NotesPanel from '@/features/annotations/components/NotesPanel';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Settings, MessageSquare } from 'lucide-react';

interface QuranViewerProps {
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

const QuranViewer: React.FC<QuranViewerProps> = ({
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
  const containerRef = useRef<HTMLDivElement>(null);

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
    // Only open notes if highlight has notes
    if (highlight.notes && highlight.notes.length > 0) {
      setSelectedHighlightForNotes(highlight.id);
      setShowNotesModal(true);
    }
  };

  const hasNotes = (highlight: Highlight): boolean => {
    return !!(highlight.notes && highlight.notes.length > 0);
  };

  const renderAyahText = (ayahData: QuranAyah) => {
    const ayahHighlights = getAyahHighlights(ayahData.id);

    if (ayahHighlights.length === 0) {
      return (
        <span
          data-ayah-id={ayahData.id}
          className="quran-text"
          style={{ direction: 'rtl', textAlign: 'right' }}
        >
          {ayahData.text}
        </span>
      );
    }

    // Build text segments with highlights
    const sortedHighlights = [...ayahHighlights].sort((a, b) => a.token_start - b.token_start);
    const segments: JSX.Element[] = [];
    let lastPos = 0;

    sortedHighlights.forEach((highlight, idx) => {
      const color = MISTAKE_COLORS[highlight.mistake];
      const start = highlight.token_start;
      const end = highlight.token_end;

      // Add text before highlight
      if (start > lastPos) {
        segments.push(
          <span key={`text-${idx}`}>
            {ayahData.text.slice(lastPos, start)}
          </span>
        );
      }

      // Add highlighted text with click handler if it has notes
      const highlightText = ayahData.text.slice(start, end);
      const highlightHasNotes = hasNotes(highlight);

      segments.push(
        <mark
          key={`highlight-${idx}`}
          className={`highlight-${highlight.mistake} ${highlightHasNotes ? 'cursor-pointer hover:opacity-80 relative' : ''}`}
          style={{
            backgroundColor: `${color}33`,
            borderLeft: `3px solid ${color}`,
            position: 'relative',
            paddingRight: highlightHasNotes ? '20px' : '0'
          }}
          title={highlight.mistake}
          onClick={() => highlightHasNotes && handleHighlightClick(highlight)}
        >
          {highlightText}
          {highlightHasNotes && (
            <MessageSquare
              className="inline-block ml-1"
              style={{
                width: '14px',
                height: '14px',
                color: color,
                verticalAlign: 'middle'
              }}
            />
          )}
        </mark>
      );

      lastPos = end;
    });

    // Add remaining text
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
        className="quran-text"
        style={{ direction: 'rtl', textAlign: 'right' }}
      >
        {segments}
      </span>
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="loading-spinner" />
        <span className="ml-2">Loading Quran text...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-600 p-8">
        <p>Error loading Quran text: {error}</p>
        <Button onClick={() => window.location.reload()} className="mt-4">
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className={`quran-viewer ${className}`} ref={containerRef}>
      <div className="flex items-center justify-between mb-6 p-4 bg-card rounded-lg border">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              if (surah > 1) {
                window.location.href = `?surah=${surah - 1}`;
              }
            }}
            disabled={surah <= 1}
          >
            <ChevronRight className="w-4 h-4 mr-1" />
            Previous Surah
          </Button>

          <div className="text-center">
            <h2 className="text-xl font-semibold">Surah {surah}</h2>
            <p className="text-sm text-muted-foreground">{ayahs.length} verses</p>
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
          >
            Next Surah
            <ChevronLeft className="w-4 h-4 ml-1" />
          </Button>
        </div>

        <Button variant="ghost" size="sm">
          <Settings className="w-4 h-4" />
        </Button>
      </div>

      <div className="space-y-6">
        {ayahs.map((ayahItem, index) => (
          <div
            key={ayahItem.id}
            className={`ayah-container p-4 rounded-lg border transition-colors ${
              ayahItem.ayah === ayah ? 'bg-blue-50 border-blue-200' : 'bg-card'
            }`}
          >
            <div className="flex items-start space-x-4 rtl:space-x-reverse">
              <div className="ayah-number flex-shrink-0">{ayahItem.ayah}</div>

              <div className="flex-1">
                <div className="text-right" dir="rtl">
                  {renderAyahText(ayahItem)}
                </div>

                {getAyahHighlights(ayahItem.id).length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Highlights ({getAyahHighlights(ayahItem.id).length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {getAyahHighlights(ayahItem.id).map(highlight => {
                        const highlightHasNotes = hasNotes(highlight);
                        return (
                          <span
                            key={highlight.id}
                            className={`px-2 py-1 rounded text-xs highlight-${highlight.mistake} ${
                              highlightHasNotes && !isTeacher ? 'cursor-pointer hover:opacity-80' : ''
                            }`}
                            style={{ backgroundColor: `${MISTAKE_COLORS[highlight.mistake]}33` }}
                            onClick={() => !isTeacher && highlightHasNotes && handleHighlightClick(highlight)}
                          >
                            {highlight.mistake}
                            {highlightHasNotes && (
                              <MessageSquare className="inline-block ml-1 w-3 h-3" />
                            )}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showPopover && selection && isTeacher && (
        <HighlightPopover
          isOpen={showPopover}
          onClose={() => {
            setShowPopover(false);
            setSelection(null);
            window.getSelection()?.removeAllRanges();
          }}
          position={popoverPosition}
          selectedText={selection.selectedText}
          selection={selection}
          onSave={handleCreateHighlight}
        />
      )}

      {isTeacher && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Teacher Instructions</h3>
          <p className="text-sm text-blue-700">
            Select any text in the Quran to create a highlight. Choose the mistake type and optionally add a note.
          </p>
        </div>
      )}

      {!isTeacher && (
        <div className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
          <h3 className="font-medium text-emerald-900 mb-2 flex items-center">
            <MessageSquare className="w-4 h-4 mr-2" />
            Viewing Teacher Notes
          </h3>
          <p className="text-sm text-emerald-700">
            Click on highlighted text with the <MessageSquare className="inline w-3 h-3 mx-1" /> icon to view your teacher's notes and guidance.
            You can also reply to notes to ask questions or confirm understanding.
          </p>
        </div>
      )}

      {/* Notes Modal */}
      {showNotesModal && selectedHighlightForNotes && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg w-full max-w-2xl h-[80vh] flex flex-col shadow-2xl">
            <NotesPanel
              highlightId={selectedHighlightForNotes}
              mode="modal"
              onClose={() => {
                setShowNotesModal(false);
                setSelectedHighlightForNotes(null);
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default QuranViewer;
