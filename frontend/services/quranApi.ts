/**
 * Enterprise-grade Quran API Service
 * Integrates multiple APIs for comprehensive Quran learning features
 */

interface Verse {
  id: number;
  verse_number: number;
  verse_key: string;
  text_uthmani: string;
  text_simple: string;
  page_number: number;
  juz_number: number;
  hizb_number: number;
  rub_number: number;
  sajdah_type: string | null;
  sajdah_number: number | null;
  translations?: Translation[];
  words?: Word[];
  audio?: AudioFile;
  tajweed?: TajweedRule[];
}

interface Translation {
  id: number;
  language_name: string;
  text: string;
  resource_name: string;
}

interface Word {
  id: number;
  position: number;
  text_uthmani: string;
  text_simple: string;
  translation: WordTranslation;
  transliteration: Transliteration;
  char_type_name: string;
}

interface WordTranslation {
  text: string;
  language_name: string;
}

interface Transliteration {
  text: string;
  language_name: string;
}

interface AudioFile {
  url: string;
  duration: number;
  format: string;
  reciter: ReciterInfo;
}

interface ReciterInfo {
  id: number;
  name: string;
  style: string;
  language: string;
}

interface TajweedRule {
  rule: string;
  start: number;
  end: number;
  color: string;
  description: string;
}

interface Chapter {
  id: number;
  revelation_place: string;
  revelation_order: number;
  bismillah_pre: boolean;
  name_simple: string;
  name_complex: string;
  name_arabic: string;
  verses_count: number;
  pages: number[];
  translated_name: {
    language_name: string;
    name: string;
  };
}

class QuranAPIService {
  private readonly QURAN_API_BASE = 'https://api.quran.com/api/v4';
  private readonly ALQURAN_API_BASE = 'https://api.alquran.cloud/v1';
  private cache: Map<string, any> = new Map();
  private readonly CACHE_DURATION = 1000 * 60 * 60 * 24; // 24 hours

  /**
   * Get chapter list with metadata
   */
  async getChapters(language: string = 'en'): Promise<Chapter[]> {
    const cacheKey = `chapters_${language}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(`${this.QURAN_API_BASE}/chapters?language=${language}`);
      const data = await response.json();
      this.cache.set(cacheKey, data.chapters);
      return data.chapters;
    } catch (error) {
      console.error('Error fetching chapters:', error);
      throw error;
    }
  }

  /**
   * Get verses by chapter with translations
   */
  async getVersesByChapter(
    chapterId: number, 
    translations: string[] = ['131'], // Default: Dr. Mustafa Khattab
    wordFields: string = 'text_uthmani,translation,transliteration'
  ): Promise<Verse[]> {
    const cacheKey = `verses_${chapterId}_${translations.join('_')}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const params = new URLSearchParams({
        language: 'en',
        words: 'true',
        translations: translations.join(','),
        word_fields: wordFields,
        per_page: '286' // Max verses per page
      });

      const response = await fetch(
        `${this.QURAN_API_BASE}/verses/by_chapter/${chapterId}?${params}`
      );
      const data = await response.json();
      this.cache.set(cacheKey, data.verses);
      return data.verses;
    } catch (error) {
      console.error('Error fetching verses:', error);
      throw error;
    }
  }

  /**
   * Get verse by specific key (e.g., "2:255" for Ayatul Kursi)
   */
  async getVerseByKey(
    verseKey: string,
    translations: string[] = ['131']
  ): Promise<Verse> {
    const cacheKey = `verse_${verseKey}_${translations.join('_')}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const params = new URLSearchParams({
        translations: translations.join(','),
        words: 'true',
        word_fields: 'text_uthmani,translation,transliteration'
      });

      const response = await fetch(
        `${this.QURAN_API_BASE}/verses/by_key/${verseKey}?${params}`
      );
      const data = await response.json();
      this.cache.set(cacheKey, data.verse);
      return data.verse;
    } catch (error) {
      console.error('Error fetching verse:', error);
      throw error;
    }
  }

  /**
   * Get Tajweed rules for a verse from Al-Quran Cloud
   */
  async getTajweedRules(verseKey: string): Promise<TajweedRule[]> {
    const cacheKey = `tajweed_${verseKey}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const [chapter, verse] = verseKey.split(':');
      const response = await fetch(
        `${this.ALQURAN_API_BASE}/ayah/${chapter}:${verse}/tajweed`
      );
      const data = await response.json();
      
      // Parse tajweed data and convert to our format
      const rules = this.parseTajweedData(data.data);
      this.cache.set(cacheKey, rules);
      return rules;
    } catch (error) {
      console.error('Error fetching tajweed:', error);
      return [];
    }
  }

  /**
   * Get audio URL for a verse with specific reciter
   */
  async getAudioUrl(
    verseKey: string,
    reciterId: number = 7 // Default: Mishari Rashid al-`Afasy
  ): Promise<string> {
    const cacheKey = `audio_${verseKey}_${reciterId}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(
        `${this.QURAN_API_BASE}/recitations/${reciterId}/by_ayah/${verseKey}`
      );
      const data = await response.json();
      const audioUrl = data.audio_files[0]?.url || '';
      this.cache.set(cacheKey, audioUrl);
      return audioUrl;
    } catch (error) {
      console.error('Error fetching audio:', error);
      return '';
    }
  }

  /**
   * Get available reciters
   */
  async getReciters(language: string = 'en'): Promise<ReciterInfo[]> {
    const cacheKey = `reciters_${language}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(
        `${this.QURAN_API_BASE}/resources/recitations?language=${language}`
      );
      const data = await response.json();
      const reciters = data.recitations.map((r: any) => ({
        id: r.id,
        name: r.reciter_name,
        style: r.style,
        language: r.language_name
      }));
      this.cache.set(cacheKey, reciters);
      return reciters;
    } catch (error) {
      console.error('Error fetching reciters:', error);
      return [];
    }
  }

  /**
   * Get available translations
   */
  async getAvailableTranslations(): Promise<any[]> {
    const cacheKey = 'translations';
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const response = await fetch(
        `${this.QURAN_API_BASE}/resources/translations`
      );
      const data = await response.json();
      this.cache.set(cacheKey, data.translations);
      return data.translations;
    } catch (error) {
      console.error('Error fetching translations:', error);
      return [];
    }
  }

  /**
   * Search verses
   */
  async searchVerses(query: string, language: string = 'en'): Promise<Verse[]> {
    try {
      const params = new URLSearchParams({
        q: query,
        language: language,
        size: '20',
        page: '1'
      });

      const response = await fetch(
        `${this.QURAN_API_BASE}/search?${params}`
      );
      const data = await response.json();
      return data.search.results;
    } catch (error) {
      console.error('Error searching verses:', error);
      return [];
    }
  }

  /**
   * Parse Tajweed data from Al-Quran Cloud format
   */
  private parseTajweedData(data: any): TajweedRule[] {
    const rules: TajweedRule[] = [];
    const tajweedText = data.text;
    
    // Tajweed markers in the text
    const tajweedMarkers = {
      '[h': { rule: 'hamza-wasl', color: '#AAAAAA', description: 'Hamza Wasl' },
      '[s': { rule: 'silent', color: '#AAAAAA', description: 'Silent Letter' },
      '[l': { rule: 'laam-shamsiyah', color: '#FF7E1E', description: 'Laam Shamsiyah' },
      '[n': { rule: 'ghunnah', color: '#FF6600', description: 'Ghunnah (nasalization)' },
      '[p': { rule: 'ikhfaa', color: '#9400D3', description: 'Ikhfaa (concealment)' },
      '[m': { rule: 'meem-ikhfaa', color: '#DB7093', description: 'Meem Ikhfaa' },
      '[q': { rule: 'qalqalah', color: '#0099CC', description: 'Qalqalah (echoing)' },
      '[o': { rule: 'madd-6', color: '#00AA00', description: 'Madd 6 harakat' },
      '[c': { rule: 'madd-4-5', color: '#00AA00', description: 'Madd 4-5 harakat' },
      '[a': { rule: 'madd-2-4-6', color: '#00AA00', description: 'Madd 2-4-6 harakat' },
      '[i': { rule: 'idghaam-noon', color: '#00AA00', description: 'Idghaam with Ghunnah' },
      '[w': { rule: 'idghaam-no-ghunnah', color: '#00AA00', description: 'Idghaam without Ghunnah' },
      '[d': { rule: 'iqlaab', color: '#26BFFD', description: 'Iqlaab' },
    };

    // Parse the tajweed text to extract rules
    let position = 0;
    for (let i = 0; i < tajweedText.length; i++) {
      if (tajweedText[i] === '[' && i + 1 < tajweedText.length) {
        const marker = tajweedText.substring(i, i + 2);
        if (tajweedMarkers[marker]) {
          const rule = tajweedMarkers[marker];
          // Find the end of this rule
          let end = tajweedText.indexOf(']', i);
          if (end === -1) end = i + 2;
          
          rules.push({
            rule: rule.rule,
            start: position,
            end: position + (end - i - 2),
            color: rule.color,
            description: rule.description
          });
        }
      } else if (tajweedText[i] !== '[' && tajweedText[i] !== ']') {
        position++;
      }
    }

    return rules;
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export singleton instance
export const quranAPI = new QuranAPIService();

// Export types
export type { 
  Verse, 
  Translation, 
  Word, 
  AudioFile, 
  ReciterInfo, 
  TajweedRule, 
  Chapter 
};