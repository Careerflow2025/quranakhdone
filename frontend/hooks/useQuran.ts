import { useState, useEffect, useCallback } from 'react';
import { QuranAyah, QuranScript } from '@/types';
import { quranApi } from '@/lib/api';

export function useQuran(surah?: number, script?: string) {
  const [ayahs, setAyahs] = useState<QuranAyah[]>([]);
  const [scripts, setScripts] = useState<QuranScript[]>([]);
  const [selectedScript, setSelectedScript] = useState<string>(script || 'uthmani-hafs');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch available scripts
  const fetchScripts = useCallback(async () => {
    try {
      const response = await quranApi.getScripts();
      if (response.success && response.data) {
        setScripts(response.data as QuranScript[]);
      }
    } catch (err) {
      console.error('Failed to fetch scripts:', err);
    }
  }, []);

  // Fetch ayahs for a specific surah
  const fetchAyahs = useCallback(async (surahNumber: number, scriptId?: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await quranApi.getAyahs({
        surah: surahNumber,
        script: scriptId || selectedScript,
      });
      
      if (response.success && response.data) {
        setAyahs(response.data as QuranAyah[]);
      } else {
        setError(response.error || 'Failed to fetch ayahs');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch ayahs');
    } finally {
      setIsLoading(false);
    }
  }, [selectedScript]);

  // Initialize scripts on mount
  useEffect(() => {
    fetchScripts();
  }, [fetchScripts]);

  // Fetch ayahs when surah or script changes
  useEffect(() => {
    if (surah) {
      fetchAyahs(surah, selectedScript);
    }
  }, [surah, selectedScript, fetchAyahs]);

  const changeScript = useCallback((scriptId: string) => {
    setSelectedScript(scriptId);
  }, []);

  return {
    ayahs,
    scripts,
    selectedScript,
    isLoading,
    error,
    fetchAyahs,
    changeScript,
  };
}

export function useAyahNavigation() {
  const [currentSurah, setCurrentSurah] = useState(1);
  const [currentAyah, setCurrentAyah] = useState(1);

  const goToAyah = useCallback((surah: number, ayah: number) => {
    setCurrentSurah(surah);
    setCurrentAyah(ayah);
  }, []);

  const nextAyah = useCallback(() => {
    // This would need proper logic based on surah lengths
    setCurrentAyah(prev => prev + 1);
  }, []);

  const previousAyah = useCallback(() => {
    if (currentAyah > 1) {
      setCurrentAyah(prev => prev - 1);
    } else if (currentSurah > 1) {
      setCurrentSurah(prev => prev - 1);
      // Would need to set to last ayah of previous surah
    }
  }, [currentAyah, currentSurah]);

  const nextSurah = useCallback(() => {
    if (currentSurah < 114) {
      setCurrentSurah(prev => prev + 1);
      setCurrentAyah(1);
    }
  }, [currentSurah]);

  const previousSurah = useCallback(() => {
    if (currentSurah > 1) {
      setCurrentSurah(prev => prev - 1);
      setCurrentAyah(1);
    }
  }, [currentSurah]);

  return {
    currentSurah,
    currentAyah,
    goToAyah,
    nextAyah,
    previousAyah,
    nextSurah,
    previousSurah,
  };
}