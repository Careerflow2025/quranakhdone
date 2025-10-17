// Complete Quran Loader with All 114 Surahs
// This loads the actual downloaded Quran data

import uthmaniData from './uthmani.json';
import simpleData from './simple.json';
import simpleEnhancedData from './simple-enhanced.json';
import tajweedData from './tajweed.json';
import warshData from './warsh.json';
import qaloonData from './qaloon.json';

export interface QuranVerse {
  number: number;
  text: string;
  numberInSurah: number;
  juz: number;
  manzil: number;
  page: number;
  ruku: number;
  hizbQuarter: number;
  sajda: boolean;
}

export interface QuranSurah {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
  ayahs: QuranVerse[];
}

export interface QuranEdition {
  identifier: string;
  language: string;
  name: string;
  englishName: string;
  format: string;
  type: string;
  direction: string;
}

export interface QuranData {
  code: number;
  status: string;
  data: {
    surahs: QuranSurah[];
    edition: QuranEdition;
  };
}

// Define the 6 different Quran scripts with their unique characteristics
export const quranScripts = {
  'uthmani-hafs': {
    id: 'uthmani-hafs',
    name: 'Uthmani (Hafs)',
    nameArabic: 'العثماني - حفص عن عاصم',
    description: 'Most widely used worldwide - Saudi Arabian mushaf',
    data: uthmaniData as unknown as QuranData,
    fontFamily: 'Amiri Quran, Scheherazade, serif',
    fontSize: '28px',
    lineHeight: '2.2',
    direction: 'rtl',
    textColor: '#000000'
  },
  'warsh': {
    id: 'warsh',
    name: 'Warsh',
    nameArabic: 'ورش عن نافع',
    description: 'Popular in North Africa - Moroccan and Tunisian mushaf',
    data: warshData as unknown as QuranData,
    fontFamily: 'Noto Naskh Arabic, Traditional Arabic, serif',
    fontSize: '26px',
    lineHeight: '2.0',
    direction: 'rtl',
    textColor: '#1a1a1a'
  },
  'qaloon': {
    id: 'qaloon',
    name: 'Qaloon',
    nameArabic: 'قالون عن نافع',
    description: 'Used in Libya and Tunisia',
    data: qaloonData as unknown as QuranData,
    fontFamily: 'Sakkal Majalla, Simplified Arabic, serif',
    fontSize: '27px',
    lineHeight: '2.1',
    direction: 'rtl',
    textColor: '#0f0f0f'
  },
  'simple': {
    id: 'simple',
    name: 'Simple Arabic',
    nameArabic: 'النص البسيط',
    description: 'Simplified modern Arabic text',
    data: simpleData as unknown as QuranData,
    fontFamily: 'Arial, Tahoma, sans-serif',
    fontSize: '24px',
    lineHeight: '1.8',
    direction: 'rtl',
    textColor: '#333333'
  },
  'tajweed': {
    id: 'tajweed',
    name: 'Tajweed',
    nameArabic: 'التجويد الملون',
    description: 'Color-coded Tajweed rules',
    data: tajweedData as unknown as QuranData,
    fontFamily: 'KFGQPC Uthmanic Script HAFS, serif',
    fontSize: '30px',
    lineHeight: '2.3',
    direction: 'rtl',
    textColor: '#000000'
  },
  'indopak': {
    id: 'indopak',
    name: 'IndoPak Script',
    nameArabic: 'الخط الهندي الباكستاني',
    description: 'South Asian Nastaliq style',
    data: simpleEnhancedData as unknown as QuranData,
    fontFamily: 'Noto Nastaliq Urdu, Jameel Noori Nastaleeq, serif',
    fontSize: '25px',
    lineHeight: '2.4',
    direction: 'rtl',
    textColor: '#2c2c2c'
  }
};

// Function to get Quran data by script ID
export function getQuranByScriptId(scriptId: string) {
  const script = quranScripts[scriptId as keyof typeof quranScripts];
  if (!script || !script.data) {
    return null;
  }
  
  return {
    ...script,
    surahs: script.data.data?.surahs || []
  };
}

// Function to get a specific Surah from a script
export function getSurahByNumber(scriptId: string, surahNumber: number) {
  const quran = getQuranByScriptId(scriptId);
  if (!quran) return null;
  
  const surah = quran.surahs.find(s => s.number === surahNumber);
  return surah || null;
}

// Function to get all available script options
export function getAllQuranScripts() {
  return Object.values(quranScripts).map(script => ({
    id: script.id,
    name: script.name,
    nameArabic: script.nameArabic,
    description: script.description,
    fontFamily: script.fontFamily,
    fontSize: script.fontSize,
    lineHeight: script.lineHeight
  }));
}

// Function to get script styling
export function getScriptStyling(scriptId: string) {
  const script = quranScripts[scriptId as keyof typeof quranScripts];
  if (!script) {
    return {
      fontFamily: 'Traditional Arabic, serif',
      fontSize: '28px',
      lineHeight: '2.2',
      direction: 'rtl' as const,
      textColor: '#000000'
    };
  }
  
  return {
    fontFamily: script.fontFamily,
    fontSize: script.fontSize,
    lineHeight: script.lineHeight,
    direction: script.direction as 'rtl',
    textColor: script.textColor
  };
}

// Function to format verse for display
export function formatVerse(verse: QuranVerse, includeNumber: boolean = true) {
  if (includeNumber) {
    return `${verse.text} ﴿${convertToArabicNumber(verse.numberInSurah)}﴾`;
  }
  return verse.text;
}

// Convert number to Arabic-Indic numerals
function convertToArabicNumber(num: number): string {
  const arabicNumbers = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  return num.toString().split('').map(digit => arabicNumbers[parseInt(digit)]).join('');
}