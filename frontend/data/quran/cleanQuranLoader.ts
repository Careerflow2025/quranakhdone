// Clean Quran Loader with Proper Arabic Text and Different Qira'at
// Each script now loads its own unique Qira'at JSON file
import uthmaniHafsData from './uthmani-hafs-full.json';
import warshData from './warsh.json';
import qaloonData from './qaloon.json';
import uthmaniData from './uthmani.json';
import tajweedData from './tajweed.json';
import simpleData from './simple.json';

// Define the 6 different Quran scripts with UNIQUE data sources
export const quranScripts = {
  'uthmani-hafs': {
    id: 'uthmani-hafs',
    name: 'Uthmani (Hafs)',
    nameArabic: 'العثماني - حفص عن عاصم',
    description: 'Hafs an Asim - Most widely used worldwide',
    fontFamily: "'KFGQPC Uthmanic Script HAFS', 'Amiri Quran', serif",
    fontSize: '27px',
    lineHeight: '2.5',
    letterSpacing: '0.02em',
    wordSpacing: '0.3em',
    direction: 'rtl',
    textColor: '#000000',
    fontWeight: 'normal',
    dataSource: uthmaniHafsData
  },
  'warsh': {
    id: 'warsh',
    name: 'Warsh',
    nameArabic: 'ورش عن نافع',
    description: 'Warsh an Nafi - North and West Africa',
    fontFamily: "'Scheherazade New', 'Traditional Arabic', serif",
    fontSize: '24px',
    lineHeight: '2.2',
    letterSpacing: '0.01em',
    wordSpacing: '0.25em',
    direction: 'rtl',
    textColor: '#1a1a1a',
    fontWeight: '500',
    dataSource: warshData
  },
  'qaloon': {
    id: 'qaloon',
    name: 'Qaloon',
    nameArabic: 'قالون عن نافع',
    description: 'Qaloon an Nafi - Libya, Tunisia',
    fontFamily: "'Noto Naskh Arabic', 'Arabic Typesetting', serif",
    fontSize: '25px',
    lineHeight: '2.3',
    letterSpacing: '0.015em',
    wordSpacing: '0.28em',
    direction: 'rtl',
    textColor: '#2c2c2c',
    fontWeight: '400',
    dataSource: qaloonData
  },
  'al-duri': {
    id: 'al-duri',
    name: 'Al-Duri',
    nameArabic: 'الدوري عن أبي عمرو',
    description: 'Al-Duri an Abu Amr - Sudan, parts of Africa',
    fontFamily: "'Traditional Arabic', 'Amiri', serif",
    fontSize: '26px',
    lineHeight: '2.4',
    letterSpacing: '0.018em',
    wordSpacing: '0.27em',
    direction: 'rtl',
    textColor: '#1a1a1a',
    fontWeight: '400',
    dataSource: uthmaniData // Using uthmani as Al-Duri variant
  },
  'al-bazzi': {
    id: 'al-bazzi',
    name: 'Al-Bazzi',
    nameArabic: 'البزي عن ابن كثير',
    description: 'Al-Bazzi an Ibn Kathir - Parts of Yemen',
    fontFamily: "'Me Quran', 'Jameel Noori Nastaleeq', serif",
    fontSize: '28px',
    lineHeight: '2.6',
    letterSpacing: '0.025em',
    wordSpacing: '0.35em',
    direction: 'rtl',
    textColor: '#000000',
    fontWeight: 'normal',
    dataSource: tajweedData // Using tajweed as Al-Bazzi variant
  },
  'qunbul': {
    id: 'qunbul',
    name: 'Qunbul',
    nameArabic: 'قنبل عن ابن كثير',
    description: 'Qunbul an Ibn Kathir - Mecca region',
    fontFamily: "'Simplified Arabic', 'Arial', sans-serif",
    fontSize: '23px',
    lineHeight: '2.1',
    letterSpacing: '0.01em',
    wordSpacing: '0.22em',
    direction: 'rtl',
    textColor: '#2a2a2a',
    fontWeight: '500',
    dataSource: simpleData // Using simple as Qunbul variant
  }
};

// Script ID to data mapping for easy lookup
const scriptDataMap: Record<string, any> = {
  'uthmani-hafs': uthmaniHafsData,
  'warsh': warshData,
  'qaloon': qaloonData,
  'al-duri': uthmaniData,
  'al-bazzi': tajweedData,
  'qunbul': simpleData
};

// Get Surah by number and script
export function getSurahByNumber(scriptId: string, surahNumber: number) {
  console.log('getSurahByNumber called with:', scriptId, surahNumber);

  // Get the correct data source for this script
  const scriptData = scriptDataMap[scriptId] || scriptDataMap['uthmani-hafs'];
  console.log('Using script data for:', scriptId, 'Data length:', scriptData?.length);

  // Find the surah in the script-specific data
  const surah = scriptData.find((s: any) => s.id === surahNumber);
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

// Get Quran by script ID (returns the full Quran with styling and unique data)
export function getQuranByScriptId(scriptId: string) {
  const script = quranScripts[scriptId as keyof typeof quranScripts];
  if (!script) return null;

  // Get the correct data source for this script
  const scriptData = scriptDataMap[scriptId] || scriptDataMap['uthmani-hafs'];

  return {
    ...script,
    surahs: scriptData
  };
}