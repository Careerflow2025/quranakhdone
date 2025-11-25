'use client';

import React from 'react';
import { getPageWithLines, QuranWord, QuranLine } from '@/data/quran/lineBasedQuranLoader';
import { getDynamicScriptStyling } from '@/data/quran/cleanQuranLoader';
import { MessageSquare } from 'lucide-react';

interface MushafLineRendererProps {
  currentMushafPage: number;
  selectedScript: string;
  zoomLevel: number;
  safeHighlights: any[];
  mistakeTypes: any[];
  dbHighlights: any[];
  quranText: any;
  handleHighlightClick: (highlightId: string) => void;
  highlightStyle?: string; // 'full' or 'underline'
}

export default function MushafLineRenderer({
  currentMushafPage,
  selectedScript,
  zoomLevel,
  safeHighlights,
  mistakeTypes,
  dbHighlights,
  quranText,
  handleHighlightClick,
  highlightStyle = 'full' // Default to 'full' for backward compatibility
}: MushafLineRendererProps) {
  // Get the mushaf page data with line information
  const linePageData = getPageWithLines(currentMushafPage);

  if (!linePageData) {
    return <div className="text-center py-8">Loading page...</div>;
  }

  // Calculate total page content length for DYNAMIC FONT SIZING
  const pageContent = linePageData.lines.map((line: QuranLine) =>
    line.words.map((w: QuranWord) => w.text).join(' ')
  ).join(' ');

  // Render the page with traditional Mushaf formatting using LINE-BASED layout
  const scriptClass = `script-${selectedScript || 'uthmani-hafs'}`;

  return (
    <div
      className={`mushaf-page-content mushaf-text ${scriptClass}`}
      style={{
        width: '45vw',
        maxWidth: '600px',
        minHeight: '65vh',
        maxHeight: '72vh',
        overflow: 'hidden',
        margin: '0 auto',
        paddingTop: '0.8rem',
        paddingBottom: '0.8rem',
        paddingLeft: '0.75rem',
        paddingRight: '0.75rem',
        backgroundColor: '#FFFFFF',
        borderRadius: '8px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.5), inset 0 0 0 1px rgba(64, 130, 109, 0.3), 0 2px 10px rgba(0, 0, 0, 0.2)',
        border: '2px solid #40826D',
        ...getDynamicScriptStyling(pageContent, selectedScript || 'uthmani-hafs'),
        transform: `scale(${zoomLevel / 100})`,
        transformOrigin: 'top center',
        direction: 'rtl',
        lineHeight: '1.8',
        textAlign: 'right'
      }}
    >
      {/* Render each mushaf line as a separate block */}
      {linePageData.lines.map((line: QuranLine, lineIdx: number) => (
        <div
          key={`line-${line.lineNumber}`}
          style={{
            display: 'block',
            width: '100%',
            marginBottom: lineIdx < linePageData.lines.length - 1 ? '0.3rem' : '0',
            textAlign: 'right',
            whiteSpace: 'normal'
          }}
        >
          {/* Each word in the line */}
          {line.words.map((word: QuranWord, wordIdx: number) => {
            // Try to find matching highlight by verse key
            // Format: "surah:ayah" -> get ayah index from quranText
            const [surahStr, ayahStr] = word.verseKey.split(':');
            const ayahNumber = parseInt(ayahStr);
            const ayahIndex = quranText.ayahs.findIndex((a: any) => a.number === ayahNumber);

            // Find word position within ayah for highlight matching
            let wordHighlights = ayahIndex >= 0 ? safeHighlights.filter(
              (h: any) => h.ayahIndex === ayahIndex && h.wordIndex === word.position - 1
            ) : [];

            // CRITICAL FIX: Sort highlights to prioritize ones with notes
            // This ensures clicking a word with multiple overlapping highlights
            // will click the one with conversation history first
            wordHighlights = wordHighlights.sort((a: any, b: any) => {
              const aDbHighlight = dbHighlights?.find((dbH: any) => dbH.id === a.dbId);
              const bDbHighlight = dbHighlights?.find((dbH: any) => dbH.id === b.dbId);
              const aHasNotes = aDbHighlight && aDbHighlight.notes && aDbHighlight.notes.length > 0;
              const bHasNotes = bDbHighlight && bDbHighlight.notes && bDbHighlight.notes.length > 0;

              // Highlights with notes come first
              if (aHasNotes && !bHasNotes) return -1;
              if (!aHasNotes && bHasNotes) return 1;

              // Then prioritize completed highlights
              if (a.isCompleted && !b.isCompleted) return -1;
              if (!a.isCompleted && b.isCompleted) return 1;

              // Then by creation time (older first, as they likely have more context)
              return (aDbHighlight?.created_at || '').localeCompare(bDbHighlight?.created_at || '');
            });

            const mistakes = wordHighlights.map((h: any) => {
              if (h.isCompleted) {
                return {
                  id: 'completed',
                  name: 'Completed',
                  color: 'gold',
                  bgColor: 'bg-yellow-400',
                  textColor: 'text-yellow-900'
                };
              }
              return mistakeTypes.find((m: any) => m.id === h.mistakeType);
            }).filter(Boolean);

            const hasNotes = wordHighlights.some((h: any) => {
              const dbHighlight = dbHighlights?.find((dbH: any) => dbH.id === h.dbId);
              return dbHighlight && dbHighlight.notes && dbHighlight.notes.length > 0;
            });

            return (
              <span
                key={`${line.lineNumber}-${wordIdx}`}
                onClick={() => {
                  if (wordHighlights.length > 0) {
                    const clickedHighlight = wordHighlights[0];
                    const dbHighlight = dbHighlights?.find((dbH: any) => dbH.id === clickedHighlight.dbId);
                    const noteCount = dbHighlight?.notes?.length || 0;

                    console.log('🖱️ MushafLineRenderer: Word clicked', {
                      wordText: word.text,
                      totalHighlights: wordHighlights.length,
                      clickedHighlightId: clickedHighlight.id,
                      clickedDbId: clickedHighlight.dbId,
                      hasNotes: noteCount > 0,
                      noteCount: noteCount,
                      allHighlightIds: wordHighlights.map((h: any) => ({
                        id: h.id,
                        dbId: h.dbId,
                        hasNotes: dbHighlights?.find((dbH: any) => dbH.id === h.dbId)?.notes?.length > 0
                      }))
                    });

                    handleHighlightClick(clickedHighlight.id);
                  }
                }}
                className="inline cursor-pointer rounded transition-colors select-none"
                style={{
                  position: 'relative',
                  color: '#000000',
                  padding: '0',
                  display: 'inline',
                  pointerEvents: 'auto',
                  ...(highlightStyle === 'full' ? (
                    // FULL BACKGROUND MODE (original)
                    mistakes.length === 1 ? {
                      backgroundImage: `linear-gradient(${
                        mistakes[0]?.bgColor === 'bg-yellow-900' ? 'rgba(113,63,18,0.6)' :
                        mistakes[0]?.bgColor === 'bg-yellow-400' ? 'rgba(250,204,21,0.4)' :
                        mistakes[0]?.bgColor?.includes('amber') ? 'rgba(180,83,9,0.3)' :
                        mistakes[0]?.bgColor?.includes('purple') ? 'rgba(147,51,234,0.3)' :
                        mistakes[0]?.bgColor?.includes('green') ? 'rgba(34,197,94,0.3)' :
                        mistakes[0]?.bgColor?.includes('orange') ? 'rgba(249,115,22,0.3)' :
                        mistakes[0]?.bgColor?.includes('red') ? 'rgba(239,68,68,0.3)' : 'transparent'
                      }, ${
                        mistakes[0]?.bgColor === 'bg-yellow-900' ? 'rgba(113,63,18,0.6)' :
                        mistakes[0]?.bgColor === 'bg-yellow-400' ? 'rgba(250,204,21,0.4)' :
                        mistakes[0]?.bgColor?.includes('amber') ? 'rgba(180,83,9,0.3)' :
                        mistakes[0]?.bgColor?.includes('purple') ? 'rgba(147,51,234,0.3)' :
                        mistakes[0]?.bgColor?.includes('green') ? 'rgba(34,197,94,0.3)' :
                        mistakes[0]?.bgColor?.includes('orange') ? 'rgba(249,115,22,0.3)' :
                        mistakes[0]?.bgColor?.includes('red') ? 'rgba(239,68,68,0.3)' : 'transparent'
                      })`,
                      backgroundSize: '100% 70%',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center'
                    } : mistakes.length > 1 ? {
                      backgroundImage: `linear-gradient(135deg, ${mistakes.map((m: any, i: any) => {
                        const color = m.bgColor === 'bg-yellow-900' ? 'rgba(113,63,18,0.6)' :
                          m.bgColor === 'bg-yellow-400' ? 'rgba(250,204,21,0.4)' :
                          m.bgColor.includes('amber') ? 'rgba(180,83,9,0.4)' :
                          m.bgColor.includes('purple') ? 'rgba(147,51,234,0.4)' :
                          m.bgColor.includes('green') ? 'rgba(34,197,94,0.4)' :
                          m.bgColor.includes('orange') ? 'rgba(249,115,22,0.4)' :
                          m.bgColor.includes('red') ? 'rgba(239,68,68,0.4)' : 'transparent';
                        const percent = (i * 100) / mistakes.length;
                        const nextPercent = ((i + 1) * 100) / mistakes.length;
                        return `${color} ${percent}%, ${color} ${nextPercent}%`;
                      }).join(', ')})`,
                      backgroundSize: '100% 70%',
                      backgroundRepeat: 'no-repeat',
                      backgroundPosition: 'center',
                      fontWeight: '600',
                      border: '1px solid rgba(0,0,0,0.15)'
                    } : {}
                  ) : (
                    // UNDERLINE MODE (new)
                    mistakes.length === 1 ? {
                      borderBottom: `3px solid ${
                        mistakes[0]?.bgColor === 'bg-yellow-900' ? 'rgba(113,63,18,0.9)' :
                        mistakes[0]?.bgColor === 'bg-yellow-400' ? 'rgba(250,204,21,0.9)' :
                        mistakes[0]?.bgColor?.includes('amber') ? 'rgba(180,83,9,0.9)' :
                        mistakes[0]?.bgColor?.includes('purple') ? 'rgba(147,51,234,0.9)' :
                        mistakes[0]?.bgColor?.includes('green') ? 'rgba(34,197,94,0.9)' :
                        mistakes[0]?.bgColor?.includes('orange') ? 'rgba(249,115,22,0.9)' :
                        mistakes[0]?.bgColor?.includes('red') ? 'rgba(239,68,68,0.9)' : 'transparent'
                      }`,
                      paddingBottom: '2px'
                    } : mistakes.length > 1 ? {
                      borderBottom: `3px solid`,
                      borderImage: `linear-gradient(to right, ${mistakes.map((m: any, i: any) => {
                        const color = m.bgColor === 'bg-yellow-900' ? 'rgba(113,63,18,0.9)' :
                          m.bgColor === 'bg-yellow-400' ? 'rgba(250,204,21,0.9)' :
                          m.bgColor.includes('amber') ? 'rgba(180,83,9,0.9)' :
                          m.bgColor.includes('purple') ? 'rgba(147,51,234,0.9)' :
                          m.bgColor.includes('green') ? 'rgba(34,197,94,0.9)' :
                          m.bgColor.includes('orange') ? 'rgba(249,115,22,0.9)' :
                          m.bgColor.includes('red') ? 'rgba(239,68,68,0.9)' : 'transparent';
                        const percent = (i * 100) / mistakes.length;
                        const nextPercent = ((i + 1) * 100) / mistakes.length;
                        return `${color} ${percent}%, ${color} ${nextPercent}%`;
                      }).join(', ')}) 1`,
                      paddingBottom: '2px',
                      fontWeight: '600'
                    } : {}
                  ))
                }}
              >
                {word.text}
                {hasNotes && (
                  <span
                    className="inline-flex items-center justify-center text-blue-500"
                    style={{
                      fontSize: '8px',
                      width: '12px',
                      height: '12px',
                      marginLeft: '1px',
                      verticalAlign: 'top',
                      position: 'relative',
                      top: '0px'
                    }}
                  >
                    <MessageSquare className="w-2 h-2" strokeWidth={2.5} />
                  </span>
                )}
                {' '}
              </span>
            );
          })}
        </div>
      ))}
    </div>
  );
}
