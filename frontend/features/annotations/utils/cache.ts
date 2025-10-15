import { telemetry } from '../../telemetry/client';

const CACHE_PREFIX = 'quranmate_annotation_';
const CACHE_EXPIRY_HOURS = 24;

interface CacheEntry {
  data: any;
  timestamp: number;
  studentId: string;
  page: number;
}

function getCacheKey(studentId: string, page: number): string {
  return `${CACHE_PREFIX}${studentId}_${page}`;
}

function isExpired(timestamp: number): boolean {
  const now = Date.now();
  const expiry = CACHE_EXPIRY_HOURS * 60 * 60 * 1000; // 24 hours in ms
  return (now - timestamp) > expiry;
}

export function cacheAnnotation(studentId: string, page: number, annotationData: any): void {
  try {
    const cacheEntry: CacheEntry = {
      data: annotationData,
      timestamp: Date.now(),
      studentId,
      page
    };
    
    const key = getCacheKey(studentId, page);
    localStorage.setItem(key, JSON.stringify(cacheEntry));
    
    telemetry.logEvent('annotation.cached', {
      student_id: studentId,
      page,
      data_size_bytes: JSON.stringify(cacheEntry).length
    });
  } catch (error) {
    console.warn('[cache] Failed to cache annotation:', error);
    telemetry.logEvent('annotation.cache_failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

export function getCachedAnnotation(studentId: string, page: number): any | null {
  try {
    const key = getCacheKey(studentId, page);
    const cachedStr = localStorage.getItem(key);
    
    if (!cachedStr) {
      telemetry.logEvent('annotation.cache_miss', { student_id: studentId, page });
      return null;
    }
    
    const cached: CacheEntry = JSON.parse(cachedStr);
    
    // Check expiry
    if (isExpired(cached.timestamp)) {
      localStorage.removeItem(key);
      telemetry.logEvent('annotation.cache_expired', { student_id: studentId, page });
      return null;
    }
    
    // Validate cache entry
    if (cached.studentId !== studentId || cached.page !== page) {
      localStorage.removeItem(key);
      telemetry.logEvent('annotation.cache_invalid', { student_id: studentId, page });
      return null;
    }
    
    telemetry.logEvent('annotation.cache_hit', { 
      student_id: studentId, 
      page,
      age_hours: Math.round((Date.now() - cached.timestamp) / (1000 * 60 * 60))
    });
    
    return cached.data;
  } catch (error) {
    console.warn('[cache] Failed to read cache:', error);
    telemetry.logEvent('annotation.cache_read_failed', {
      error: error instanceof Error ? error.message : 'Unknown error'
    });
    return null;
  }
}

export function clearAnnotationCache(studentId?: string, page?: number): void {
  try {
    if (studentId && page !== undefined) {
      // Clear specific entry
      const key = getCacheKey(studentId, page);
      localStorage.removeItem(key);
      telemetry.logEvent('annotation.cache_cleared', { student_id: studentId, page });
    } else {
      // Clear all annotation cache entries
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith(CACHE_PREFIX)) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => localStorage.removeItem(key));
      telemetry.logEvent('annotation.cache_cleared_all', { entries_removed: keysToRemove.length });
    }
  } catch (error) {
    console.warn('[cache] Failed to clear cache:', error);
  }
}

export function getCacheStats(): { totalEntries: number; totalSizeKB: number; oldestAge: number } {
  let totalEntries = 0;
  let totalSizeBytes = 0;
  let oldestTimestamp = Date.now();
  
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith(CACHE_PREFIX)) {
      totalEntries++;
      const value = localStorage.getItem(key);
      if (value) {
        totalSizeBytes += value.length;
        try {
          const cached: CacheEntry = JSON.parse(value);
          if (cached.timestamp < oldestTimestamp) {
            oldestTimestamp = cached.timestamp;
          }
        } catch (e) {
          // Invalid cache entry, ignore
        }
      }
    }
  }
  
  const oldestAge = totalEntries > 0 ? Math.round((Date.now() - oldestTimestamp) / (1000 * 60 * 60)) : 0;
  
  return {
    totalEntries,
    totalSizeKB: Math.round(totalSizeBytes / 1024),
    oldestAge
  };
}