/**
 * Line-Based Quran Loader
 * Loads Quran data with exact mushaf line information from Quran.com API
 * This eliminates spacing gaps by using pre-defined line breaks from printed mushaf
 */

import quranWithLines from './quran-with-lines.json';

export interface QuranWord {
  text: string;
  verseKey: string;
  position: number;
  isEnd: boolean;
}

export interface QuranLine {
  lineNumber: number;
  words: QuranWord[];
}

export interface QuranPage {
  page: number;
  lines: QuranLine[];
  totalLines: number;
}

/**
 * Get mushaf page data with line-level information
 * @param pageNumber - The mushaf page number (1-604)
 * @returns Page data with lines and words
 */
export function getPageWithLines(pageNumber: number): QuranPage | null {
  if (pageNumber < 1 || pageNumber > 604) {
    console.error(`Invalid page number: ${pageNumber}. Must be between 1 and 604.`);
    return null;
  }

  const pageData = (quranWithLines as any)[pageNumber.toString()];

  if (!pageData) {
    console.error(`No data found for page ${pageNumber}`);
    return null;
  }

  return pageData as QuranPage;
}

/**
 * Get all pages (for testing/debugging)
 */
export function getAllPages(): Record<string, QuranPage> {
  return quranWithLines as any;
}

/**
 * Get total number of lines on a page
 */
export function getTotalLinesOnPage(pageNumber: number): number {
  const pageData = getPageWithLines(pageNumber);
  return pageData?.totalLines || 0;
}

/**
 * Check if a word is a verse-ending marker (e.g., ١, ٢, ٣...)
 */
export function isVerseEndMarker(word: QuranWord): boolean {
  return word.isEnd;
}

/**
 * Get verse key from a word
 */
export function getVerseKey(word: QuranWord): string {
  return word.verseKey;
}

/**
 * Parse verse key into surah and ayah numbers
 * Example: "1:1" -> { surah: 1, ayah: 1 }
 */
export function parseVerseKey(verseKey: string): { surah: number; ayah: number } {
  const [surah, ayah] = verseKey.split(':').map(Number);
  return { surah, ayah };
}
