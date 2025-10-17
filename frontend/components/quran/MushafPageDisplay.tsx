'use client';

import React from 'react';
import { mushafPages, getPageContent, getAyahsForPage } from '@/data/mushafPages';

interface MushafPageDisplayProps {
  pageNumber: number;
  quranData: any; // Your existing Quran data structure
  highlights?: any[];
  selectedScript?: string;
  onWordClick?: (ayahIndex: number, wordIndex: number) => void;
  showPageBorder?: boolean;
}

export default function MushafPageDisplay({
  pageNumber,
  quranData,
  highlights = [],
  selectedScript = 'uthmani-hafs',
  onWordClick,
  showPageBorder = true
}: MushafPageDisplayProps) {

  const pageInfo = getPageContent(pageNumber);
  if (!pageInfo) return null;

  const pageAyahs = getAyahsForPage(pageNumber);

  // Mushaf page styling to match physical book
  const mushafPageStyle = {
    backgroundColor: '#FFFEF8', // Slight cream color like real mushaf paper
    minHeight: '800px',
    padding: '40px 50px',
    fontFamily: "'Amiri Quran', 'Traditional Arabic', serif",
    fontSize: '28px',
    lineHeight: '2.2',
    direction: 'rtl' as const,
    textAlign: 'right' as const,
    position: 'relative' as const,
  };

  // Page header with Surah name and Juz info
  const renderPageHeader = () => {
    const currentSurah = quranData.surahNumber;
    const surahName = quranData.surah;

    return (
      <div className="flex justify-between items-center mb-6 pb-3 border-b-2 border-golden">
        <div className="text-left" style={{ direction: 'ltr' }}>
          <span className="text-sm text-gray-600">الجزء {pageInfo.juz || ''}</span>
        </div>
        <div className="text-center flex-1">
          <span className="text-2xl font-bold text-green-800">سُورَة {surahName}</span>
        </div>
        <div className="text-right">
          <span className="text-sm text-gray-600">صفحة {pageNumber}</span>
        </div>
      </div>
    );
  };

  // Render Bismillah at the start of new Surahs (except Surah 1 & 9)
  const renderBismillah = () => {
    if (pageInfo.ayahStart === 1 && pageInfo.surahStart !== 1 && pageInfo.surahStart !== 9) {
      return (
        <div className="text-center text-3xl font-arabic text-gray-800 mb-6 py-3">
          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
        </div>
      );
    }
    return null;
  };

  // Render ayah with proper mushaf formatting
  const renderAyah = (ayah: any, ayahIndex: number) => {
    // Check for highlights
    const getWordHighlight = (wordIndex: number) => {
      const highlight = highlights.find(
        h => h.ayahIndex === ayahIndex && h.wordIndex === wordIndex
      );
      if (highlight) {
        const mistakeColors: Record<string, string> = {
          recap: 'bg-purple-200 border-purple-400',
          tajweed: 'bg-orange-200 border-orange-400',
          haraka: 'bg-red-200 border-red-400',
          letter: 'bg-yellow-200 border-yellow-400'
        };
        return mistakeColors[highlight.mistakeType as string] || '';
      }
      return '';
    };

    return (
      <span key={ayahIndex} className="inline">
        {ayah.words?.map((word: any, wordIndex: number) => (
          <span
            key={wordIndex}
            onClick={() => onWordClick?.(ayahIndex, wordIndex)}
            className={`inline-block mx-1 px-1 cursor-pointer hover:bg-green-50 rounded transition-colors ${getWordHighlight(wordIndex)}`}
            style={{
              fontFamily: "'Amiri Quran', serif",
              fontSize: '28px'
            }}
          >
            {word.text || word}
          </span>
        ))}
        {/* Ayah number in traditional circular style */}
        <span
          className="inline-block mx-2 text-center"
          style={{
            width: '35px',
            height: '35px',
            lineHeight: '35px',
            borderRadius: '50%',
            border: '2px solid #C4A962',
            backgroundColor: '#FFF',
            fontSize: '16px',
            fontWeight: 'bold',
            color: '#8B7355',
            verticalAlign: 'middle'
          }}
        >
          {ayah.numberInSurah || ayah.number}
        </span>
      </span>
    );
  };

  return (
    <div className="mushaf-page-container">
      {/* Outer page border to simulate book page */}
      {showPageBorder && (
        <div
          className="page-border"
          style={{
            border: '3px solid #C4A962',
            borderRadius: '8px',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
            background: 'linear-gradient(to right, #FFFEF8 0%, #FFFFFF 50%, #FFFEF8 100%)'
          }}
        >
          {/* Inner decorative border */}
          <div
            style={{
              border: '1px solid #E8D4A2',
              margin: '8px',
              borderRadius: '4px'
            }}
          >
            <div style={mushafPageStyle}>
              {/* Page Header */}
              {renderPageHeader()}

              {/* Bismillah if needed */}
              {renderBismillah()}

              {/* Main Quran Text */}
              <div className="quran-text-area" style={{ minHeight: '600px' }}>
                {pageAyahs.map((ayahRef, index) => {
                  // Find the actual ayah data from your quranData
                  const ayahData = quranData.ayahs?.find(
                    (a: any) => a.numberInSurah === ayahRef.ayah
                  );
                  if (ayahData) {
                    return renderAyah(ayahData, index);
                  }
                  return null;
                })}
              </div>

              {/* Page Footer - Hizb marks */}
              {pageInfo.hizb && (
                <div className="text-center mt-6 pt-3 border-t border-golden">
                  <span className="text-sm text-gray-600">
                    الحزب {pageInfo.hizb}
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Simple version without border */}
      {!showPageBorder && (
        <div style={mushafPageStyle}>
          {renderPageHeader()}
          {renderBismillah()}
          <div className="quran-text-area">
            {pageAyahs.map((ayahRef, index) => {
              const ayahData = quranData.ayahs?.find(
                (a: any) => a.numberInSurah === ayahRef.ayah
              );
              if (ayahData) {
                return renderAyah(ayahData, index);
              }
              return null;
            })}
          </div>
        </div>
      )}

      <style jsx>{`
        .mushaf-page-container {
          font-family: 'Amiri Quran', 'Traditional Arabic', serif;
        }

        /* Traditional Quran font import */
        @import url('https://fonts.googleapis.com/css2?family=Amiri+Quran&display=swap');

        /* Page turning effect */
        .page-border {
          transition: all 0.3s ease;
        }

        .page-border:hover {
          box-shadow: 0 6px 30px rgba(0, 0, 0, 0.15);
        }

        /* Ayah number styling */
        .ayah-number {
          display: inline-flex;
          align-items: center;
          justify-content: center;
        }

        /* Decorative elements */
        .border-golden {
          border-color: #C4A962;
        }
      `}</style>
    </div>
  );
}