// Production-Ready Quran Loader with Fetch-Based Dynamic Loading
// Loads 6 unique Qira'at versions from public folder for reliable production deployment

// Define the 6 different Quran scripts (metadata only)
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
    jsonFile: 'uthmani-hafs-full.json'
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
    jsonFile: 'warsh.json'
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
    jsonFile: 'qaloon.json'
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
    jsonFile: 'uthmani.json'
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
    jsonFile: 'tajweed.json'
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
    jsonFile: 'simple.json'
  }
};

// In-memory cache to avoid repeated fetches
const scriptDataCache: Record<string, any> = {};
const loadingPromises: Record<string, Promise<any>> = {};

/**
 * Load Quran data for a specific script from public folder
 * Uses caching to avoid repeated network requests
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

  // Get the JSON filename for this script
  const script = quranScripts[scriptId as keyof typeof quranScripts];
  if (!script) {
    console.error('❌ Invalid script ID:', scriptId);
    throw new Error(`Invalid script ID: ${scriptId}`);
  }

  const jsonFile = script.jsonFile;
  const url = `/quran/${jsonFile}`;

  console.log('🔄 Loading Quran data from:', url);

  // Create loading promise
  const loadPromise = fetch(url)
    .then(response => {
      if (!response.ok) {
        throw new Error(`Failed to load ${jsonFile}: ${response.status} ${response.statusText}`);
      }
      return response.json();
    })
    .then(data => {
      // Validate data structure
      if (!Array.isArray(data)) {
        throw new Error(`Invalid data format for ${scriptId}: expected array, got ${typeof data}`);
      }

      if (data.length === 0) {
        throw new Error(`Empty data for ${scriptId}`);
      }

      console.log('✅ Successfully loaded', data.length, 'surahs for', scriptId);

      // Cache the data
      scriptDataCache[scriptId] = data;

      // Clean up loading promise
      delete loadingPromises[scriptId];

      return data;
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
    const surah = scriptData.find((s: any) => s.id === surahNumber);

    if (!surah) {
      console.warn(`⚠️ Surah ${surahNumber} not found in ${scriptId}`);
      return null;
    }

    console.log('✅ Found surah:', surah.name);

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
