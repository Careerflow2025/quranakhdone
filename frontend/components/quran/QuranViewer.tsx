'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { QuranAyah, Highlight, MistakeType, MISTAKE_COLORS } from '@/types';
import { useQuran } from '@/hooks/useQuran';
import { useHighlightStore } from '@/store/highlightStore';
import { useAuthStore } from '@/store/authStore';
import HighlightPopover from './HighlightPopover';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Settings } from 'lucide-react';

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

export default function QuranViewer({
  surah,
  ayah,
  studentId,
  isTeacher = false,
  className = '',
}: QuranViewerProps) {
  const { user } = useAuthStore();
  const { ayahs, selectedScript, isLoading, error, changeScript } = useQuran(surah);
  const { highlights, fetchHighlights, createHighlight } = useHighlightStore();
  
  const [selection, setSelection] = useState<TextSelection | null>(null);
  const [popoverPosition, setPopoverPosition] = useState({ x: 0, y: 0 });
  const [showPopover, setShowPopover] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fetch highlights for current context
  useEffect(() => {
    if (studentId) {
      fetchHighlights({ student_id: studentId });
    }
  }, [studentId, fetchHighlights]);

  // Handle text selection
  const handleMouseUp = useCallback((e: MouseEvent) => {
    if (!isTeacher) return;

    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) return;

    const range = selection.getRangeAt(0);
    const selectedText = range.toString().trim();
    
    if (!selectedText) {
      setShowPopover(false);
      return;
    }

    // Find the ayah element containing the selection
    const ayahElement = range.commonAncestorContainer.nodeType === Node.TEXT_NODE
      ? range.commonAncestorContainer.parentElement?.closest('[data-ayah-id]')
      : (range.commonAncestorContainer as Element).closest('[data-ayah-id]');

    if (!ayahElement) return;

    const ayahId = ayahElement.getAttribute('data-ayah-id');
    if (!ayahId) return;

    // Calculate token positions (simplified - in real implementation, you'd need more sophisticated logic)
    const tokenStart = range.startOffset;
    const tokenEnd = range.endOffset;

    setSelection({
      ayahId,
      tokenStart,
      tokenEnd,
      selectedText,
    });

    // Set popover position
    const rect = range.getBoundingClientRect();
    setPopoverPosition({
      x: rect.left + rect.width / 2,
      y: rect.bottom + 10,
    });

    setShowPopover(true);
  }, [isTeacher]);

  // Add event listener for text selection
  useEffect(() => {
    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, [handleMouseUp]);

  // Handle highlight creation
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

  // Get highlights for a specific ayah
  const getAyahHighlights = (ayahId: string): Highlight[] => {
    return highlights.filter(h => h.ayah_id === ayahId);
  };

  // Render ayah with highlights
  const renderAyahText = (ayah: QuranAyah) => {
    const ayahHighlights = getAyahHighlights(ayah.id);
    
    if (ayahHighlights.length === 0) {
      return (
        <span
          data-ayah-id={ayah.id}
          className="quran-text"
          style={{ direction: 'rtl', textAlign: 'right' }}
        >
          {ayah.text}
        </span>
      );
    }

    // Apply highlights to text (simplified implementation)
    // In a real implementation, you'd need to handle overlapping highlights
    let highlightedText = ayah.text;
    const sortedHighlights = [...ayahHighlights].sort((a, b) => a.token_start - b.token_start);

    let offset = 0;
    sortedHighlights.forEach(highlight => {
      const color = MISTAKE_COLORS[highlight.mistake];
      const start = highlight.token_start + offset;
      const end = highlight.token_end + offset;
      
      const beforeText = highlightedText.slice(0, start);
      const highlightText = highlightedText.slice(start, end);
      const afterText = highlightedText.slice(end);
      
      const highlightSpan = `<mark class="highlight-${highlight.mistake}" style="background-color: ${color}33; border-left: 3px solid ${color};" title="${highlight.mistake}">${highlightText}</mark>`;
      
      highlightedText = beforeText + highlightSpan + afterText;
      offset += highlightSpan.length - highlightText.length;
    });

    return (
      <span
        data-ayah-id={ayah.id}
        className="quran-text"
        style={{ direction: 'rtl', textAlign: 'right' }}
        dangerouslySetInnerHTML={{ __html: highlightedText }}
      />
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
      {/* Header with navigation and controls */}
      <div className="flex items-center justify-between mb-6 p-4 bg-card rounded-lg border">
        <div className="flex items-center space-x-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => surah > 1 && window.location.href = `?surah=${surah - 1}`}
            disabled={surah <= 1}
          >
            <ChevronRight className="w-4 h-4 mr-1" />
            Previous Surah
          </Button>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold">
              Surah {surah}
            </h2>
            <p className="text-sm text-muted-foreground">
              {ayahs.length} verses
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => surah < 114 && window.location.href = `?surah=${surah + 1}`}
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

      {/* Quran text */}
      <div className="space-y-6">
        {ayahs.map((ayah, index) => (
          <div
            key={ayah.id}
            className={`ayah-container p-4 rounded-lg border transition-colors ${
              ayah.ayah === ayah ? 'bg-blue-50 border-blue-200' : 'bg-card'
            }`}
          >
            <div className="flex items-start space-x-4 rtl:space-x-reverse">
              <div className="ayah-number flex-shrink-0">
                {ayah.ayah}
              </div>
              
              <div className="flex-1">
                <div className="text-right" dir="rtl">
                  {renderAyahText(ayah)}
                </div>
                
                {/* Show highlights for this ayah if teacher */}
                {isTeacher && getAyahHighlights(ayah.id).length > 0 && (
                  <div className="mt-3 space-y-2">
                    <p className="text-sm font-medium text-muted-foreground">
                      Highlights ({getAyahHighlights(ayah.id).length}):
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {getAyahHighlights(ayah.id).map(highlight => (
                        <span
                          key={highlight.id}
                          className={`px-2 py-1 rounded text-xs highlight-${highlight.mistake}`}
                          style={{ backgroundColor: `${MISTAKE_COLORS[highlight.mistake]}33` }}
                        >
                          {highlight.mistake}
                          {highlight.notes && highlight.notes.length > 0 && (
                            <span className="ml-1">📝</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Highlight creation popover */}
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

      {/* Instructions for teachers */}
      {isTeacher && (
        <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Teacher Instructions</h3>
          <p className="text-sm text-blue-700">
            Select any text in the Quran to create a highlight. Choose the mistake type and optionally add a note.
          </p>
        </div>
      )}
    </div>
  );
}