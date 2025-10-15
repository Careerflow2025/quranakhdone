// Clean Quran Loader with Proper Arabic Text and Different Fonts
import cleanQuranData from './quran-clean.json';

// Define the 6 different Quran scripts with VERY DIFFERENT visual styles
export const quranScripts = {
  'uthmani-hafs': {
    id: 'uthmani-hafs',
    name: 'Uthmani (Hafs)',
    nameArabic: 'العثماني - حفص',
    description: 'Traditional Saudi Mushaf style',
    fontFamily: "'KFGQPC Uthmanic Script HAFS', 'Amiri Quran', serif",
    fontSize: '27px',
    lineHeight: '2.5',
    letterSpacing: '0.02em',
    wordSpacing: '0.3em',
    direction: 'rtl',
    textColor: '#000000',
    fontWeight: 'normal'
  },
  'warsh': {
    id: 'warsh',
    name: 'Warsh',
    nameArabic: 'ورش عن نافع',
    description: 'North African Mushaf style',
    fontFamily: "'Scheherazade New', 'Traditional Arabic', serif",
    fontSize: '24px',
    lineHeight: '2.2',
    letterSpacing: '0.01em',
    wordSpacing: '0.25em',
    direction: 'rtl',
    textColor: '#1a1a1a',
    fontWeight: '500'
  },
  'qaloon': {
    id: 'qaloon',
    name: 'Qaloon',
    nameArabic: 'قالون',
    description: 'Libyan/Tunisian style',
    fontFamily: "'Noto Naskh Arabic', 'Arabic Typesetting', serif",
    fontSize: '25px',
    lineHeight: '2.3',
    letterSpacing: '0.015em',
    wordSpacing: '0.28em',
    direction: 'rtl',
    textColor: '#2c2c2c',
    fontWeight: '400'
  },
  'simple': {
    id: 'simple',
    name: 'Simple Modern',
    nameArabic: 'الحديث المبسط',
    description: 'Modern simplified text',
    fontFamily: "'Simplified Arabic', 'Arial', sans-serif",
    fontSize: '20px',
    lineHeight: '1.9',
    letterSpacing: 'normal',
    wordSpacing: 'normal',
    direction: 'rtl',
    textColor: '#333333',
    fontWeight: 'bold'
  },
  'tajweed': {
    id: 'tajweed',
    name: 'Indo-Pak',
    nameArabic: 'الخط الباكستاني',
    description: 'South Asian Nastaliq style',
    fontFamily: "'Me Quran', 'Jameel Noori Nastaleeq', serif",
    fontSize: '31px',
    lineHeight: '2.8',
    letterSpacing: '0.03em',
    wordSpacing: '0.4em',
    direction: 'rtl',
    textColor: '#000000',
    fontWeight: 'normal'
  },
  'maghrebi': {
    id: 'maghrebi',
    name: 'Maghrebi',
    nameArabic: 'المغربي',
    description: 'Traditional Moroccan style',
    fontFamily: "'Amiri', 'Lateef', serif",
    fontSize: '22px',
    lineHeight: '2.0',
    letterSpacing: '0.005em',
    wordSpacing: '0.2em',
    direction: 'rtl',
    textColor: '#4a4a4a',
    fontWeight: '600'
  }
};

// Parse the clean Quran data
const parsedQuran = cleanQuranData as any;

// Get Surah by number and script
export function getSurahByNumber(scriptId: string, surahNumber: number) {
  console.log('getSurahByNumber called with:', scriptId, surahNumber);
  console.log('parsedQuran length:', parsedQuran?.length);
  // Find the surah in clean data
  const surah = parsedQuran.find((s: any) => s.id === surahNumber);
  console.log('Found surah:', surah ? 'yes' : 'no');
  
  if (!surah) return null;
  
  return {
    number: surah.id,
    name: surah.name,
    transliteration: surah.transliteration || '',
    translation: surah.translation || '',
    type: surah.type,
    total_verses: surah.total_verses,
    ayahs: surah.verses.map((verse: any) => ({
      numberInSurah: verse.id,
      text: verse.text,
      translation: verse.translation || '',
      transliteration: verse.transliteration || ''
    }))
  };
}

// Get all script options
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

// Get script styling with complete CSS properties
export function getScriptStyling(scriptId: string) {
  const script = quranScripts[scriptId as keyof typeof quranScripts];
  
  if (!script) {
    // Default fallback
    return {
      fontFamily: "'Traditional Arabic', serif",
      fontSize: '28px',
      lineHeight: '2.2',
      letterSpacing: 'normal',
      wordSpacing: 'normal',
      direction: 'rtl' as const,
      textColor: '#000000',
      fontWeight: 'normal'
    };
  }
  
  return {
    fontFamily: script.fontFamily,
    fontSize: script.fontSize,
    lineHeight: script.lineHeight,
    letterSpacing: script.letterSpacing,
    wordSpacing: script.wordSpacing,
    direction: script.direction as 'rtl',
    color: script.textColor,
    fontWeight: script.fontWeight,
    textAlign: 'center' as const,
    padding: '2rem'
  };
}

// Get Quran by script ID (returns the full Quran with styling)
export function getQuranByScriptId(scriptId: string) {
  const script = quranScripts[scriptId as keyof typeof quranScripts];
  if (!script) return null;
  
  return {
    ...script,
    surahs: parsedQuran
  };
}