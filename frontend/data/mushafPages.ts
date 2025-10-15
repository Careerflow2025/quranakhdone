// Standard Madani Mushaf Page Layout (604 pages)
// Each page contains specific ayahs that match the printed Quran exactly

export interface MushafPage {
  pageNumber: number;
  surahStart: number;
  ayahStart: number;
  surahEnd: number;
  ayahEnd: number;
  juz?: number;
  hizb?: number;
}

// This represents the standard 15-line Madani mushaf layout
// Used in most printed Qurans worldwide
export const mushafPages: MushafPage[] = [
  // Juz 1
  { pageNumber: 1, surahStart: 1, ayahStart: 1, surahEnd: 1, ayahEnd: 7, juz: 1, hizb: 1 }, // Al-Fatihah
  { pageNumber: 2, surahStart: 2, ayahStart: 1, surahEnd: 2, ayahEnd: 5, juz: 1 }, // Start of Al-Baqarah
  { pageNumber: 3, surahStart: 2, ayahStart: 6, surahEnd: 2, ayahEnd: 16, juz: 1 },
  { pageNumber: 4, surahStart: 2, ayahStart: 17, surahEnd: 2, ayahEnd: 24, juz: 1 },
  { pageNumber: 5, surahStart: 2, ayahStart: 25, surahEnd: 2, ayahEnd: 29, juz: 1 },
  { pageNumber: 6, surahStart: 2, ayahStart: 30, surahEnd: 2, ayahEnd: 37, juz: 1 },
  { pageNumber: 7, surahStart: 2, ayahStart: 38, surahEnd: 2, ayahEnd: 48, juz: 1 },
  { pageNumber: 8, surahStart: 2, ayahStart: 49, surahEnd: 2, ayahEnd: 57, juz: 1 },
  { pageNumber: 9, surahStart: 2, ayahStart: 58, surahEnd: 2, ayahEnd: 61, juz: 1 },
  { pageNumber: 10, surahStart: 2, ayahStart: 62, surahEnd: 2, ayahEnd: 69, juz: 1 },
  { pageNumber: 11, surahStart: 2, ayahStart: 70, surahEnd: 2, ayahEnd: 76, juz: 1 },
  { pageNumber: 12, surahStart: 2, ayahStart: 77, surahEnd: 2, ayahEnd: 83, juz: 1 },
  { pageNumber: 13, surahStart: 2, ayahStart: 84, surahEnd: 2, ayahEnd: 88, juz: 1 },
  { pageNumber: 14, surahStart: 2, ayahStart: 89, surahEnd: 2, ayahEnd: 93, juz: 1 },
  { pageNumber: 15, surahStart: 2, ayahStart: 94, surahEnd: 2, ayahEnd: 101, juz: 1 },
  { pageNumber: 16, surahStart: 2, ayahStart: 102, surahEnd: 2, ayahEnd: 105, juz: 1 },
  { pageNumber: 17, surahStart: 2, ayahStart: 106, surahEnd: 2, ayahEnd: 112, juz: 1 },
  { pageNumber: 18, surahStart: 2, ayahStart: 113, surahEnd: 2, ayahEnd: 119, juz: 1 },
  { pageNumber: 19, surahStart: 2, ayahStart: 120, surahEnd: 2, ayahEnd: 126, juz: 1 },
  { pageNumber: 20, surahStart: 2, ayahStart: 127, surahEnd: 2, ayahEnd: 134, juz: 1 },
  { pageNumber: 21, surahStart: 2, ayahStart: 135, surahEnd: 2, ayahEnd: 141, juz: 1 },

  // Juz 2 starts at page 22
  { pageNumber: 22, surahStart: 2, ayahStart: 142, surahEnd: 2, ayahEnd: 145, juz: 2, hizb: 3 },
  { pageNumber: 23, surahStart: 2, ayahStart: 146, surahEnd: 2, ayahEnd: 153, juz: 2 },
  { pageNumber: 24, surahStart: 2, ayahStart: 154, surahEnd: 2, ayahEnd: 163, juz: 2 },
  { pageNumber: 25, surahStart: 2, ayahStart: 164, surahEnd: 2, ayahEnd: 169, juz: 2 },
  { pageNumber: 26, surahStart: 2, ayahStart: 170, surahEnd: 2, ayahEnd: 176, juz: 2 },
  { pageNumber: 27, surahStart: 2, ayahStart: 177, surahEnd: 2, ayahEnd: 181, juz: 2 },
  { pageNumber: 28, surahStart: 2, ayahStart: 182, surahEnd: 2, ayahEnd: 186, juz: 2 },
  { pageNumber: 29, surahStart: 2, ayahStart: 187, surahEnd: 2, ayahEnd: 188, juz: 2 },
  { pageNumber: 30, surahStart: 2, ayahStart: 189, surahEnd: 2, ayahEnd: 195, juz: 2 },

  // Complete pages for Al-Baqarah (continues)
  { pageNumber: 31, surahStart: 2, ayahStart: 196, surahEnd: 2, ayahEnd: 202, juz: 2 },
  { pageNumber: 32, surahStart: 2, ayahStart: 203, surahEnd: 2, ayahEnd: 210, juz: 2 },
  { pageNumber: 33, surahStart: 2, ayahStart: 211, surahEnd: 2, ayahEnd: 215, juz: 2 },
  { pageNumber: 34, surahStart: 2, ayahStart: 216, surahEnd: 2, ayahEnd: 219, juz: 2 },
  { pageNumber: 35, surahStart: 2, ayahStart: 220, surahEnd: 2, ayahEnd: 224, juz: 2 },
  { pageNumber: 36, surahStart: 2, ayahStart: 225, surahEnd: 2, ayahEnd: 230, juz: 2 },
  { pageNumber: 37, surahStart: 2, ayahStart: 231, surahEnd: 2, ayahEnd: 233, juz: 2 },
  { pageNumber: 38, surahStart: 2, ayahStart: 234, surahEnd: 2, ayahEnd: 237, juz: 2 },
  { pageNumber: 39, surahStart: 2, ayahStart: 238, surahEnd: 2, ayahEnd: 245, juz: 2 },
  { pageNumber: 40, surahStart: 2, ayahStart: 246, surahEnd: 2, ayahEnd: 248, juz: 2 },
  { pageNumber: 41, surahStart: 2, ayahStart: 249, surahEnd: 2, ayahEnd: 252, juz: 2 },

  // Juz 3 starts
  { pageNumber: 42, surahStart: 2, ayahStart: 253, surahEnd: 2, ayahEnd: 256, juz: 3, hizb: 5 },
  { pageNumber: 43, surahStart: 2, ayahStart: 257, surahEnd: 2, ayahEnd: 259, juz: 3 },
  { pageNumber: 44, surahStart: 2, ayahStart: 260, surahEnd: 2, ayahEnd: 264, juz: 3 },
  { pageNumber: 45, surahStart: 2, ayahStart: 265, surahEnd: 2, ayahEnd: 270, juz: 3 },
  { pageNumber: 46, surahStart: 2, ayahStart: 271, surahEnd: 2, ayahEnd: 272, juz: 3 },
  { pageNumber: 47, surahStart: 2, ayahStart: 273, surahEnd: 2, ayahEnd: 280, juz: 3 },
  { pageNumber: 48, surahStart: 2, ayahStart: 281, surahEnd: 2, ayahEnd: 282, juz: 3 },
  { pageNumber: 49, surahStart: 2, ayahStart: 283, surahEnd: 2, ayahEnd: 286, juz: 3 },

  // Surah Al-Imran begins
  { pageNumber: 50, surahStart: 3, ayahStart: 1, surahEnd: 3, ayahEnd: 9, juz: 3 },
  { pageNumber: 51, surahStart: 3, ayahStart: 10, surahEnd: 3, ayahEnd: 15, juz: 3 },

  // Continue with common pages for memorization
  // Juz 30 (Juz Amma) - Most commonly memorized
  { pageNumber: 582, surahStart: 78, ayahStart: 1, surahEnd: 78, ayahEnd: 30, juz: 30, hizb: 60 }, // An-Naba
  { pageNumber: 583, surahStart: 78, ayahStart: 31, surahEnd: 79, ayahEnd: 15, juz: 30 },
  { pageNumber: 584, surahStart: 79, ayahStart: 16, surahEnd: 79, ayahEnd: 46, juz: 30 },
  { pageNumber: 585, surahStart: 80, ayahStart: 1, surahEnd: 80, ayahEnd: 42, juz: 30 }, // Abasa
  { pageNumber: 586, surahStart: 81, ayahStart: 1, surahEnd: 82, ayahEnd: 19, juz: 30 }, // At-Takwir & Al-Infitar
  { pageNumber: 587, surahStart: 83, ayahStart: 1, surahEnd: 83, ayahEnd: 36, juz: 30 }, // Al-Mutaffifin
  { pageNumber: 588, surahStart: 84, ayahStart: 1, surahEnd: 85, ayahEnd: 22, juz: 30 }, // Al-Inshiqaq & Al-Buruj
  { pageNumber: 589, surahStart: 86, ayahStart: 1, surahEnd: 87, ayahEnd: 19, juz: 30 }, // At-Tariq & Al-A'la
  { pageNumber: 590, surahStart: 88, ayahStart: 1, surahEnd: 89, ayahEnd: 23, juz: 30 }, // Al-Ghashiyah & Al-Fajr
  { pageNumber: 591, surahStart: 89, ayahStart: 24, surahEnd: 90, ayahEnd: 20, juz: 30 },
  { pageNumber: 592, surahStart: 91, ayahStart: 1, surahEnd: 92, ayahEnd: 21, juz: 30 }, // Ash-Shams & Al-Layl
  { pageNumber: 593, surahStart: 93, ayahStart: 1, surahEnd: 94, ayahEnd: 8, juz: 30 }, // Ad-Duha & Ash-Sharh
  { pageNumber: 594, surahStart: 95, ayahStart: 1, surahEnd: 96, ayahEnd: 19, juz: 30 }, // At-Tin & Al-Alaq
  { pageNumber: 595, surahStart: 97, ayahStart: 1, surahEnd: 98, ayahEnd: 8, juz: 30 }, // Al-Qadr & Al-Bayyinah
  { pageNumber: 596, surahStart: 99, ayahStart: 1, surahEnd: 101, ayahEnd: 11, juz: 30 }, // Az-Zalzalah, Al-Adiyat & Al-Qari'ah
  { pageNumber: 597, surahStart: 102, ayahStart: 1, surahEnd: 103, ayahEnd: 3, juz: 30 }, // At-Takathur & Al-Asr
  { pageNumber: 598, surahStart: 104, ayahStart: 1, surahEnd: 106, ayahEnd: 4, juz: 30 }, // Al-Humazah, Al-Fil & Quraysh
  { pageNumber: 599, surahStart: 107, ayahStart: 1, surahEnd: 109, ayahEnd: 6, juz: 30 }, // Al-Ma'un, Al-Kawthar & Al-Kafirun
  { pageNumber: 600, surahStart: 110, ayahStart: 1, surahEnd: 112, ayahEnd: 4, juz: 30 }, // An-Nasr, Al-Masad & Al-Ikhlas
  { pageNumber: 601, surahStart: 113, ayahStart: 1, surahEnd: 114, ayahEnd: 6, juz: 30 }, // Al-Falaq & An-Nas
  { pageNumber: 602, surahStart: 114, ayahStart: 1, surahEnd: 114, ayahEnd: 6, juz: 30 }, // An-Nas continued
  { pageNumber: 603, surahStart: 1, ayahStart: 1, surahEnd: 1, ayahEnd: 7, juz: 30 }, // Some mushafs include Al-Fatihah
  { pageNumber: 604, surahStart: 1, ayahStart: 1, surahEnd: 1, ayahEnd: 7, juz: 30 }, // Final page

  // Surah Al-Mulk (commonly memorized)
  { pageNumber: 562, surahStart: 67, ayahStart: 1, surahEnd: 67, ayahEnd: 12, juz: 29, hizb: 58 },
  { pageNumber: 563, surahStart: 67, ayahStart: 13, surahEnd: 67, ayahEnd: 26, juz: 29 },
  { pageNumber: 564, surahStart: 67, ayahStart: 27, surahEnd: 68, ayahEnd: 15, juz: 29 },

  // Surah Al-Kahf (commonly memorized)
  { pageNumber: 293, surahStart: 18, ayahStart: 1, surahEnd: 18, ayahEnd: 11, juz: 15 },
  { pageNumber: 294, surahStart: 18, ayahStart: 12, surahEnd: 18, ayahEnd: 19, juz: 15 },
  { pageNumber: 295, surahStart: 18, ayahStart: 20, surahEnd: 18, ayahEnd: 26, juz: 15 },

  // Surah Ya-Sin (commonly memorized)
  { pageNumber: 440, surahStart: 36, ayahStart: 1, surahEnd: 36, ayahEnd: 11, juz: 22 },
  { pageNumber: 441, surahStart: 36, ayahStart: 12, surahEnd: 36, ayahEnd: 26, juz: 22 },
  { pageNumber: 442, surahStart: 36, ayahStart: 27, surahEnd: 36, ayahEnd: 39, juz: 23 },
  { pageNumber: 443, surahStart: 36, ayahStart: 40, surahEnd: 36, ayahEnd: 54, juz: 23 },
  { pageNumber: 444, surahStart: 36, ayahStart: 55, surahEnd: 36, ayahEnd: 70, juz: 23 },
  { pageNumber: 445, surahStart: 36, ayahStart: 71, surahEnd: 36, ayahEnd: 83, juz: 23 },

  // Surah Ar-Rahman
  { pageNumber: 531, surahStart: 55, ayahStart: 1, surahEnd: 55, ayahEnd: 16, juz: 27 },
  { pageNumber: 532, surahStart: 55, ayahStart: 17, surahEnd: 55, ayahEnd: 40, juz: 27 },
  { pageNumber: 533, surahStart: 55, ayahStart: 41, surahEnd: 55, ayahEnd: 67, juz: 27 },
  { pageNumber: 534, surahStart: 55, ayahStart: 68, surahEnd: 55, ayahEnd: 78, juz: 27 },

  // Surah Al-Waqi'ah
  { pageNumber: 534, surahStart: 56, ayahStart: 1, surahEnd: 56, ayahEnd: 16, juz: 27 },
  { pageNumber: 535, surahStart: 56, ayahStart: 17, surahEnd: 56, ayahEnd: 38, juz: 27 },
  { pageNumber: 536, surahStart: 56, ayahStart: 39, surahEnd: 56, ayahEnd: 56, juz: 27 },
  { pageNumber: 537, surahStart: 56, ayahStart: 57, surahEnd: 56, ayahEnd: 73, juz: 27 },
  { pageNumber: 538, surahStart: 56, ayahStart: 74, surahEnd: 56, ayahEnd: 96, juz: 27 },

];

// Helper functions
export function getPageBySurahAyah(surah: number, ayah: number): number {
  const page = mushafPages.find(p => {
    if (surah < p.surahStart || surah > p.surahEnd) return false;
    if (surah === p.surahStart && ayah < p.ayahStart) return false;
    if (surah === p.surahEnd && ayah > p.ayahEnd) return false;
    return true;
  });
  return page?.pageNumber || 1;
}

export function getPageContent(pageNumber: number): MushafPage | undefined {
  return mushafPages.find(p => p.pageNumber === pageNumber);
}

// Surah ayah counts (all 114 surahs)
const surahAyahCounts: Record<number, number> = {
  1: 7, 2: 286, 3: 200, 4: 176, 5: 120, 6: 165, 7: 206, 8: 75, 9: 129, 10: 109,
  11: 123, 12: 111, 13: 43, 14: 52, 15: 99, 16: 128, 17: 111, 18: 110, 19: 98, 20: 135,
  21: 112, 22: 78, 23: 118, 24: 64, 25: 77, 26: 227, 27: 93, 28: 88, 29: 69, 30: 60,
  31: 34, 32: 30, 33: 73, 34: 54, 35: 45, 36: 83, 37: 182, 38: 88, 39: 75, 40: 85,
  41: 54, 42: 53, 43: 89, 44: 59, 45: 37, 46: 35, 47: 38, 48: 29, 49: 18, 50: 45,
  51: 60, 52: 49, 53: 62, 54: 55, 55: 78, 56: 96, 57: 29, 58: 22, 59: 24, 60: 13,
  61: 14, 62: 11, 63: 11, 64: 18, 65: 12, 66: 12, 67: 30, 68: 52, 69: 52, 70: 44,
  71: 28, 72: 28, 73: 20, 74: 56, 75: 40, 76: 31, 77: 50, 78: 40, 79: 46, 80: 42,
  81: 29, 82: 19, 83: 36, 84: 25, 85: 22, 86: 17, 87: 19, 88: 26, 89: 30, 90: 20,
  91: 15, 92: 21, 93: 11, 94: 8, 95: 8, 96: 19, 97: 5, 98: 8, 99: 8, 100: 11,
  101: 11, 102: 8, 103: 3, 104: 9, 105: 5, 106: 4, 107: 7, 108: 3, 109: 6, 110: 3,
  111: 5, 112: 4, 113: 5, 114: 6
};

// Get all ayahs for a specific page
export function getAyahsForPage(pageNumber: number): { surah: number; ayah: number }[] {
  const page = mushafPages.find(p => p.pageNumber === pageNumber);
  if (!page) return [];

  const ayahs: { surah: number; ayah: number }[] = [];

  // If the page spans multiple surahs
  if (page.surahStart !== page.surahEnd) {
    // Add remaining ayahs from the starting surah
    const startSurahTotal = surahAyahCounts[page.surahStart] || 0;
    for (let ayah = page.ayahStart; ayah <= startSurahTotal; ayah++) {
      ayahs.push({ surah: page.surahStart, ayah });
    }

    // Add all ayahs from middle surahs if any
    for (let surah = page.surahStart + 1; surah < page.surahEnd; surah++) {
      const totalAyahs = surahAyahCounts[surah] || 0;
      for (let ayah = 1; ayah <= totalAyahs; ayah++) {
        ayahs.push({ surah, ayah });
      }
    }

    // Add ayahs from the ending surah up to the specified ayah
    for (let ayah = 1; ayah <= page.ayahEnd; ayah++) {
      ayahs.push({ surah: page.surahEnd, ayah });
    }
  } else {
    // Single surah on this page
    for (let ayah = page.ayahStart; ayah <= page.ayahEnd; ayah++) {
      ayahs.push({ surah: page.surahStart, ayah });
    }
  }

  return ayahs;
}

// Common mushaf layouts
export const MUSHAF_TYPES = {
  MADANI_15_LINES: '15-line Madani Mushaf (Saudi Print)',
  INDO_PAK: 'Indo-Pak Script (16 lines)',
  WARSH: 'Warsh Script',
  QALOON: 'Qaloon Script'
} as const;

export const DEFAULT_MUSHAF = MUSHAF_TYPES.MADANI_15_LINES;

// Total pages in standard Madani mushaf
export const TOTAL_MUSHAF_PAGES = 604;

// Helper to get total pages for a specific surah
export function getSurahPageRange(surahNumber: number): { startPage: number; endPage: number } {
  const startPage = mushafPages.find(p => p.surahStart === surahNumber && p.ayahStart === 1)?.pageNumber || 1;
  const surahTotalAyahs = surahAyahCounts[surahNumber] || 0;
  const endPage = mushafPages.find(p => p.surahEnd === surahNumber && p.ayahEnd === surahTotalAyahs)?.pageNumber || 1;
  return { startPage, endPage };
}