import { useState, useEffect, useCallback } from 'react';

export interface MushafAyah {
  number: number; // Global ayah number
  text: string;
  surah: {
    number: number;
    name: string;
    englishName: string;
    englishNameTranslation: string;
    numberOfAyahs: number;
  };
  numberInSurah: number;
  juz: number;
  page: number;
}

export interface MushafPageData {
  number: number; // Page number
  ayahs: MushafAyah[];
  surahs: { [key: number]: any };
}

/**
 * Hook for fetching Mushaf page data from AlQuran.cloud API
 */
export function useMushafPage(initialPage?: number) {
  const [pageData, setPageData] = useState<MushafPageData | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage || 1);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPage = useCallback(async (pageNumber: number) => {
    if (pageNumber < 1 || pageNumber > 604) {
      setError('Invalid page number');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `https://api.alquran.cloud/v1/page/${pageNumber}/quran-uthmani`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch page data');
      }

      const result = await response.json();

      if (result.code === 200 && result.data) {
        setPageData(result.data);
        setCurrentPage(pageNumber);
      } else {
        throw new Error('Invalid response from API');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load page');
      console.error('Error fetching Mushaf page:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch initial page
  useEffect(() => {
    if (initialPage) {
      fetchPage(initialPage);
    }
  }, [initialPage, fetchPage]);

  const goToPage = useCallback((pageNumber: number) => {
    fetchPage(pageNumber);
  }, [fetchPage]);

  const nextPage = useCallback(() => {
    if (currentPage < 604) {
      fetchPage(currentPage + 1);
    }
  }, [currentPage, fetchPage]);

  const previousPage = useCallback(() => {
    if (currentPage > 1) {
      fetchPage(currentPage - 1);
    }
  }, [currentPage, fetchPage]);

  return {
    pageData,
    currentPage,
    isLoading,
    error,
    goToPage,
    nextPage,
    previousPage,
    fetchPage,
  };
}
