// Production-Ready Quran Loader with Real Qira'at from fawazahmed0 API
// Loads 6 UNIQUE Qira'at versions with authentically different Arabic text from fawazahmed0/quran-api
// Each version has different word variations (e.g., Warsh: مَلِكِ vs Hafs: مَٰلِكِ)

// Define the 6 different Quran scripts (metadata + API edition mapping)
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
    apiEdition: 'ara-quranuthmanihaf'
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
    apiEdition: 'ara-quranwarsh'
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
    apiEdition: 'ara-quranqaloon'
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
    apiEdition: 'ara-qurandoori'
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
    apiEdition: 'ara-quranbazzi'
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
    apiEdition: 'ara-quranqumbul'
  }
};

// Surah metadata (names and information) - Complete list of all 114 surahs
const surahMetadata = [
  { number: 1, name: 'Al-Fatihah', nameArabic: 'الفاتحة', type: 'Meccan', verses: 7 },
  { number: 2, name: 'Al-Baqarah', nameArabic: 'البقرة', type: 'Medinan', verses: 286 },
  { number: 3, name: 'Ali \'Imran', nameArabic: 'آل عمران', type: 'Medinan', verses: 200 },
  { number: 4, name: 'An-Nisa', nameArabic: 'النساء', type: 'Medinan', verses: 176 },
  { number: 5, name: 'Al-Ma\'idah', nameArabic: 'المائدة', type: 'Medinan', verses: 120 },
  { number: 6, name: 'Al-An\'am', nameArabic: 'الأنعام', type: 'Meccan', verses: 165 },
  { number: 7, name: 'Al-A\'raf', nameArabic: 'الأعراف', type: 'Meccan', verses: 206 },
  { number: 8, name: 'Al-Anfal', nameArabic: 'الأنفال', type: 'Medinan', verses: 75 },
  { number: 9, name: 'At-Tawbah', nameArabic: 'التوبة', type: 'Medinan', verses: 129 },
  { number: 10, name: 'Yunus', nameArabic: 'يونس', type: 'Meccan', verses: 109 },
  { number: 11, name: 'Hud', nameArabic: 'هود', type: 'Meccan', verses: 123 },
  { number: 12, name: 'Yusuf', nameArabic: 'يوسف', type: 'Meccan', verses: 111 },
  { number: 13, name: 'Ar-Ra\'d', nameArabic: 'الرعد', type: 'Medinan', verses: 43 },
  { number: 14, name: 'Ibrahim', nameArabic: 'إبراهيم', type: 'Meccan', verses: 52 },
  { number: 15, name: 'Al-Hijr', nameArabic: 'الحجر', type: 'Meccan', verses: 99 },
  { number: 16, name: 'An-Nahl', nameArabic: 'النحل', type: 'Meccan', verses: 128 },
  { number: 17, name: 'Al-Isra', nameArabic: 'الإسراء', type: 'Meccan', verses: 111 },
  { number: 18, name: 'Al-Kahf', nameArabic: 'الكهف', type: 'Meccan', verses: 110 },
  { number: 19, name: 'Maryam', nameArabic: 'مريم', type: 'Meccan', verses: 98 },
  { number: 20, name: 'Ta-Ha', nameArabic: 'طه', type: 'Meccan', verses: 135 },
  { number: 21, name: 'Al-Anbiya', nameArabic: 'الأنبياء', type: 'Meccan', verses: 112 },
  { number: 22, name: 'Al-Hajj', nameArabic: 'الحج', type: 'Medinan', verses: 78 },
  { number: 23, name: 'Al-Mu\'minun', nameArabic: 'المؤمنون', type: 'Meccan', verses: 118 },
  { number: 24, name: 'An-Nur', nameArabic: 'النور', type: 'Medinan', verses: 64 },
  { number: 25, name: 'Al-Furqan', nameArabic: 'الفرقان', type: 'Meccan', verses: 77 },
  { number: 26, name: 'Ash-Shu\'ara', nameArabic: 'الشعراء', type: 'Meccan', verses: 227 },
  { number: 27, name: 'An-Naml', nameArabic: 'النمل', type: 'Meccan', verses: 93 },
  { number: 28, name: 'Al-Qasas', nameArabic: 'القصص', type: 'Meccan', verses: 88 },
  { number: 29, name: 'Al-\'Ankabut', nameArabic: 'العنكبوت', type: 'Meccan', verses: 69 },
  { number: 30, name: 'Ar-Rum', nameArabic: 'الروم', type: 'Meccan', verses: 60 },
  { number: 31, name: 'Luqman', nameArabic: 'لقمان', type: 'Meccan', verses: 34 },
  { number: 32, name: 'As-Sajdah', nameArabic: 'السجدة', type: 'Meccan', verses: 30 },
  { number: 33, name: 'Al-Ahzab', nameArabic: 'الأحزاب', type: 'Medinan', verses: 73 },
  { number: 34, name: 'Saba', nameArabic: 'سبأ', type: 'Meccan', verses: 54 },
  { number: 35, name: 'Fatir', nameArabic: 'فاطر', type: 'Meccan', verses: 45 },
  { number: 36, name: 'Ya-Sin', nameArabic: 'يس', type: 'Meccan', verses: 83 },
  { number: 37, name: 'As-Saffat', nameArabic: 'الصافات', type: 'Meccan', verses: 182 },
  { number: 38, name: 'Sad', nameArabic: 'ص', type: 'Meccan', verses: 88 },
  { number: 39, name: 'Az-Zumar', nameArabic: 'الزمر', type: 'Meccan', verses: 75 },
  { number: 40, name: 'Ghafir', nameArabic: 'غافر', type: 'Meccan', verses: 85 },
  { number: 41, name: 'Fussilat', nameArabic: 'فصلت', type: 'Meccan', verses: 54 },
  { number: 42, name: 'Ash-Shura', nameArabic: 'الشورى', type: 'Meccan', verses: 53 },
  { number: 43, name: 'Az-Zukhruf', nameArabic: 'الزخرف', type: 'Meccan', verses: 89 },
  { number: 44, name: 'Ad-Dukhan', nameArabic: 'الدخان', type: 'Meccan', verses: 59 },
  { number: 45, name: 'Al-Jathiyah', nameArabic: 'الجاثية', type: 'Meccan', verses: 37 },
  { number: 46, name: 'Al-Ahqaf', nameArabic: 'الأحقاف', type: 'Meccan', verses: 35 },
  { number: 47, name: 'Muhammad', nameArabic: 'محمد', type: 'Medinan', verses: 38 },
  { number: 48, name: 'Al-Fath', nameArabic: 'الفتح', type: 'Medinan', verses: 29 },
  { number: 49, name: 'Al-Hujurat', nameArabic: 'الحجرات', type: 'Medinan', verses: 18 },
  { number: 50, name: 'Qaf', nameArabic: 'ق', type: 'Meccan', verses: 45 },
  { number: 51, name: 'Adh-Dhariyat', nameArabic: 'الذاريات', type: 'Meccan', verses: 60 },
  { number: 52, name: 'At-Tur', nameArabic: 'الطور', type: 'Meccan', verses: 49 },
  { number: 53, name: 'An-Najm', nameArabic: 'النجم', type: 'Meccan', verses: 62 },
  { number: 54, name: 'Al-Qamar', nameArabic: 'القمر', type: 'Meccan', verses: 55 },
  { number: 55, name: 'Ar-Rahman', nameArabic: 'الرحمن', type: 'Medinan', verses: 78 },
  { number: 56, name: 'Al-Waqi\'ah', nameArabic: 'الواقعة', type: 'Meccan', verses: 96 },
  { number: 57, name: 'Al-Hadid', nameArabic: 'الحديد', type: 'Medinan', verses: 29 },
  { number: 58, name: 'Al-Mujadilah', nameArabic: 'المجادلة', type: 'Medinan', verses: 22 },
  { number: 59, name: 'Al-Hashr', nameArabic: 'الحشر', type: 'Medinan', verses: 24 },
  { number: 60, name: 'Al-Mumtahanah', nameArabic: 'الممتحنة', type: 'Medinan', verses: 13 },
  { number: 61, name: 'As-Saff', nameArabic: 'الصف', type: 'Medinan', verses: 14 },
  { number: 62, name: 'Al-Jumu\'ah', nameArabic: 'الجمعة', type: 'Medinan', verses: 11 },
  { number: 63, name: 'Al-Munafiqun', nameArabic: 'المنافقون', type: 'Medinan', verses: 11 },
  { number: 64, name: 'At-Taghabun', nameArabic: 'التغابن', type: 'Medinan', verses: 18 },
  { number: 65, name: 'At-Talaq', nameArabic: 'الطلاق', type: 'Medinan', verses: 12 },
  { number: 66, name: 'At-Tahrim', nameArabic: 'التحريم', type: 'Medinan', verses: 12 },
  { number: 67, name: 'Al-Mulk', nameArabic: 'الملك', type: 'Meccan', verses: 30 },
  { number: 68, name: 'Al-Qalam', nameArabic: 'القلم', type: 'Meccan', verses: 52 },
  { number: 69, name: 'Al-Haqqah', nameArabic: 'الحاقة', type: 'Meccan', verses: 52 },
  { number: 70, name: 'Al-Ma\'arij', nameArabic: 'المعارج', type: 'Meccan', verses: 44 },
  { number: 71, name: 'Nuh', nameArabic: 'نوح', type: 'Meccan', verses: 28 },
  { number: 72, name: 'Al-Jinn', nameArabic: 'الجن', type: 'Meccan', verses: 28 },
  { number: 73, name: 'Al-Muzzammil', nameArabic: 'المزمل', type: 'Meccan', verses: 20 },
  { number: 74, name: 'Al-Muddaththir', nameArabic: 'المدثر', type: 'Meccan', verses: 56 },
  { number: 75, name: 'Al-Qiyamah', nameArabic: 'القيامة', type: 'Meccan', verses: 40 },
  { number: 76, name: 'Al-Insan', nameArabic: 'الإنسان', type: 'Medinan', verses: 31 },
  { number: 77, name: 'Al-Mursalat', nameArabic: 'المرسلات', type: 'Meccan', verses: 50 },
  { number: 78, name: 'An-Naba', nameArabic: 'النبأ', type: 'Meccan', verses: 40 },
  { number: 79, name: 'An-Nazi\'at', nameArabic: 'النازعات', type: 'Meccan', verses: 46 },
  { number: 80, name: '\'Abasa', nameArabic: 'عبس', type: 'Meccan', verses: 42 },
  { number: 81, name: 'At-Takwir', nameArabic: 'التكوير', type: 'Meccan', verses: 29 },
  { number: 82, name: 'Al-Infitar', nameArabic: 'الانفطار', type: 'Meccan', verses: 19 },
  { number: 83, name: 'Al-Mutaffifin', nameArabic: 'المطففين', type: 'Meccan', verses: 36 },
  { number: 84, name: 'Al-Inshiqaq', nameArabic: 'الانشقاق', type: 'Meccan', verses: 25 },
  { number: 85, name: 'Al-Buruj', nameArabic: 'البروج', type: 'Meccan', verses: 22 },
  { number: 86, name: 'At-Tariq', nameArabic: 'الطارق', type: 'Meccan', verses: 17 },
  { number: 87, name: 'Al-A\'la', nameArabic: 'الأعلى', type: 'Meccan', verses: 19 },
  { number: 88, name: 'Al-Ghashiyah', nameArabic: 'الغاشية', type: 'Meccan', verses: 26 },
  { number: 89, name: 'Al-Fajr', nameArabic: 'الفجر', type: 'Meccan', verses: 30 },
  { number: 90, name: 'Al-Balad', nameArabic: 'البلد', type: 'Meccan', verses: 20 },
  { number: 91, name: 'Ash-Shams', nameArabic: 'الشمس', type: 'Meccan', verses: 15 },
  { number: 92, name: 'Al-Layl', nameArabic: 'الليل', type: 'Meccan', verses: 21 },
  { number: 93, name: 'Ad-Duha', nameArabic: 'الضحى', type: 'Meccan', verses: 11 },
  { number: 94, name: 'Ash-Sharh', nameArabic: 'الشرح', type: 'Meccan', verses: 8 },
  { number: 95, name: 'At-Tin', nameArabic: 'التين', type: 'Meccan', verses: 8 },
  { number: 96, name: 'Al-\'Alaq', nameArabic: 'العلق', type: 'Meccan', verses: 19 },
  { number: 97, name: 'Al-Qadr', nameArabic: 'القدر', type: 'Meccan', verses: 5 },
  { number: 98, name: 'Al-Bayyinah', nameArabic: 'البينة', type: 'Medinan', verses: 8 },
  { number: 99, name: 'Az-Zalzalah', nameArabic: 'الزلزلة', type: 'Medinan', verses: 8 },
  { number: 100, name: 'Al-\'Adiyat', nameArabic: 'العاديات', type: 'Meccan', verses: 11 },
  { number: 101, name: 'Al-Qari\'ah', nameArabic: 'القارعة', type: 'Meccan', verses: 11 },
  { number: 102, name: 'At-Takathur', nameArabic: 'التكاثر', type: 'Meccan', verses: 8 },
  { number: 103, name: 'Al-\'Asr', nameArabic: 'العصر', type: 'Meccan', verses: 3 },
  { number: 104, name: 'Al-Humazah', nameArabic: 'الهمزة', type: 'Meccan', verses: 9 },
  { number: 105, name: 'Al-Fil', nameArabic: 'الفيل', type: 'Meccan', verses: 5 },
  { number: 106, name: 'Quraysh', nameArabic: 'قريش', type: 'Meccan', verses: 4 },
  { number: 107, name: 'Al-Ma\'un', nameArabic: 'الماعون', type: 'Meccan', verses: 7 },
  { number: 108, name: 'Al-Kawthar', nameArabic: 'الكوثر', type: 'Meccan', verses: 3 },
  { number: 109, name: 'Al-Kafirun', nameArabic: 'الكافرون', type: 'Meccan', verses: 6 },
  { number: 110, name: 'An-Nasr', nameArabic: 'النصر', type: 'Medinan', verses: 3 },
  { number: 111, name: 'Al-Masad', nameArabic: 'المسد', type: 'Meccan', verses: 5 },
  { number: 112, name: 'Al-Ikhlas', nameArabic: 'الإخلاص', type: 'Meccan', verses: 4 },
  { number: 113, name: 'Al-Falaq', nameArabic: 'الفلق', type: 'Meccan', verses: 5 },
  { number: 114, name: 'An-Nas', nameArabic: 'الناس', type: 'Meccan', verses: 6 }
];

// In-memory cache to avoid repeated fetches
const scriptDataCache: Record<string, any> = {};
const loadingPromises: Record<string, Promise<any>> = {};

/**
 * Load Quran data for a specific script from fawazahmed0 API
 * Uses caching to avoid repeated network requests
 * Fetches real Qira'at with different Arabic text variations
 */
async function loadScriptData(scriptId: string): Promise<any> {
  // Return cached data if available
  if (scriptDataCache[scriptId]) {
    console.log('📦 Using cached data for:', scriptId);
    return scriptDataCache[scriptId];
  }

  // If already loading, return the existing promise
  if (loadingPromises[scriptId]) {
    console.log('⏳ Waiting for existing load operation:', scriptId);
    return loadingPromises[scriptId];
  }

  // Get the API edition name for this script
  const script = quranScripts[scriptId as keyof typeof quranScripts];
  if (!script) {
    console.error('❌ Invalid script ID:', scriptId);
    throw new Error(`Invalid script ID: ${scriptId}`);
  }

  const apiEdition = script.apiEdition;
  const url = `https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/${apiEdition}.min.json`;

  console.log('🔄 Loading Quran data from fawazahmed0 API:', apiEdition);

  // Create loading promise
  const loadPromise = fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load ${apiEdition}: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(responseData => {
      // fawazahmed0 API format: { "quran": [ {chapter, verse, text}, ... ] }
      const verses = responseData?.quran;

      if (!Array.isArray(verses) || verses.length === 0) {
        throw new Error(`Invalid data format for ${scriptId}: could not find quran verses array`);
      }

      // Convert flat verse array to surah-based structure
      const surahsMap = new Map();

      verses.forEach((verse: any) => {
        const chapterNum = verse.chapter;

        if (!surahsMap.has(chapterNum)) {
          // Get metadata for this surah
          const metadata = surahMetadata.find(s => s.number === chapterNum);

          // Create new surah entry with metadata
          surahsMap.set(chapterNum, {
            number: chapterNum,
            name: metadata?.nameArabic || '',
            englishName: metadata?.name || '',
            type: metadata?.type || '',
            ayahs: []
          });
        }

        // Add verse to surah
        surahsMap.get(chapterNum).ayahs.push({
          numberInSurah: verse.verse,
          text: verse.text
        });
      });

      // Convert map to array and sort by surah number
      const surahs = Array.from(surahsMap.values()).sort((a, b) => a.number - b.number);

      console.log('✅ Successfully loaded', surahs.length, 'surahs for', scriptId);

      // Cache the surahs data
      scriptDataCache[scriptId] = surahs;

      // Clean up loading promise
      delete loadingPromises[scriptId];

      return surahs;
    })
    .catch(error => {
      console.error(`❌ Error loading ${scriptId}:`, error);

      // Clean up loading promise
      delete loadingPromises[scriptId];

      throw error;
    });

  // Store loading promise
  loadingPromises[scriptId] = loadPromise;

  return loadPromise;
}

/**
 * Get Surah by number and script (ASYNC)
 * @param scriptId The Qira'at version ID
 * @param surahNumber The surah number (1-114)
 * @returns Promise resolving to surah data or null
 */
export async function getSurahByNumber(scriptId: string, surahNumber: number) {
  console.log('📖 getSurahByNumber called with:', scriptId, surahNumber);

  try {
    // Load script data from public folder
    const scriptData = await loadScriptData(scriptId);

    // Find the surah in the script-specific data
    // API format uses "number" field instead of "id"
    const surah = scriptData.find((s: any) => (s.number || s.id) === surahNumber);

    if (!surah) {
      console.warn(`⚠️ Surah ${surahNumber} not found in ${scriptId}`);
      return null;
    }

    console.log('✅ Found surah:', surah.name || surah.englishName);

    // Handle both API format (ayahs) and legacy format (verses)
    const verses = surah.ayahs || surah.verses || [];

    return {
      number: surah.number || surah.id,
      name: surah.name || surah.englishName,
      transliteration: surah.englishNameTranslation || surah.transliteration || '',
      translation: surah.englishNameTranslation || surah.translation || '',
      type: surah.revelationType || surah.type,
      total_verses: verses.length,
      ayahs: verses.map((verse: any) => ({
        numberInSurah: verse.numberInSurah || verse.number || verse.id,
        text: verse.text,
        translation: verse.translation || '',
        transliteration: verse.transliteration || ''
      }))
    };
  } catch (error: any) {
    console.error('❌ Error in getSurahByNumber:', error);
    throw new Error(`Failed to get surah: ${error.message}`);
  }
}

/**
 * Get all script options (metadata only, no data loading)
 */
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

/**
 * Get script styling with complete CSS properties
 */
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

/**
 * Get Quran by script ID (ASYNC)
 * Returns the full Quran with styling and unique data
 */
export async function getQuranByScriptId(scriptId: string) {
  const script = quranScripts[scriptId as keyof typeof quranScripts];
  if (!script) {
    console.error('❌ Invalid script ID:', scriptId);
    return null;
  }

  try {
    // Load script data from public folder
    const scriptData = await loadScriptData(scriptId);

    return {
      ...script,
      surahs: scriptData
    };
  } catch (error: any) {
    console.error('❌ Error in getQuranByScriptId:', error);
    throw new Error(`Failed to get Quran data: ${error.message}`);
  }
}

/**
 * Preload script data for faster access
 * Call this early in the application lifecycle
 */
export async function preloadScriptData(scriptIds: string[]) {
  console.log('🚀 Preloading Quran data for scripts:', scriptIds);

  try {
    await Promise.all(scriptIds.map(id => loadScriptData(id)));
    console.log('✅ All scripts preloaded successfully');
  } catch (error) {
    console.error('❌ Error preloading scripts:', error);
    // Don't throw - preloading is optional optimization
  }
}

/**
 * Clear cache for a specific script or all scripts
 * Useful for development/testing
 */
export function clearCache(scriptId?: string) {
  if (scriptId) {
    delete scriptDataCache[scriptId];
    delete loadingPromises[scriptId];
    console.log('🗑️ Cleared cache for:', scriptId);
  } else {
    Object.keys(scriptDataCache).forEach(id => delete scriptDataCache[id]);
    Object.keys(loadingPromises).forEach(id => delete loadingPromises[id]);
    console.log('🗑️ Cleared all cache');
  }
}
