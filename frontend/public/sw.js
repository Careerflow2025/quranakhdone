// QuranAkh Service Worker - Professional Offline Support
// Caches Quran data from fawazahmed0 API for offline reading

const CACHE_VERSION = 'quranakh-v2-api';
const QURAN_CACHE = 'quran-api-v2';
const APP_CACHE = 'app-shell-v2';

// Files to cache on install
const APP_SHELL = [
  '/',
  '/manifest.json'
];

// Quran API endpoints to cache (fawazahmed0/quran-api via CDN)
const API_BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions/';
const QURAN_API_URLS = [
  `${API_BASE}ara-quranuthmanihaf.min.json`,  // Hafs
  `${API_BASE}ara-quranwarsh.min.json`,       // Warsh
  `${API_BASE}ara-quranqaloon.min.json`,      // Qaloon
  `${API_BASE}ara-qurandoori.min.json`,       // Al-Duri
  `${API_BASE}ara-quranbazzi.min.json`,       // Al-Bazzi
  `${API_BASE}ara-quranqumbul.min.json`       // Qunbul
];

// Install event - cache app shell
self.addEventListener('install', (event) => {
  console.log('[SW] Installing service worker...');
  event.waitUntil(
    caches.open(APP_CACHE).then((cache) => {
      console.log('[SW] Caching app shell');
      return cache.addAll(APP_SHELL);
    })
  );
  self.skipWaiting();
});

// Activate event - clean old caches
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating service worker...');
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames
          .filter((name) => name !== APP_CACHE && name !== QURAN_CACHE)
          .map((name) => {
            console.log('[SW] Deleting old cache:', name);
            return caches.delete(name);
          })
      );
    })
  );
  self.clients.claim();
});

// Fetch event - serve from cache, fallback to network
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Handle fawazahmed0 Quran API - Stale-While-Revalidate strategy
  if (url.hostname === 'cdn.jsdelivr.net' && url.pathname.includes('/quran-api@1/editions/')) {
    event.respondWith(
      caches.open(QURAN_CACHE).then((cache) => {
        return cache.match(request).then((cached) => {
          // Fetch fresh version in background
          const fetchPromise = fetch(request).then((response) => {
            // Update cache with fresh version
            if (response && response.status === 200) {
              const responseToCache = response.clone();
              cache.put(request, responseToCache);
              console.log('[SW] Updated cache:', url.pathname.split('/').pop());
            }
            return response;
          }).catch((error) => {
            console.log('[SW] Fetch failed (offline?):', error.message);
            return cached; // Return cached version if fetch fails
          });

          // Return cached version immediately (if available), or wait for network
          if (cached) {
            console.log('[SW] Serving from cache (stale-while-revalidate):', url.pathname.split('/').pop());
            return cached;
          }

          console.log('[SW] No cache, waiting for network:', url.pathname.split('/').pop());
          return fetchPromise;
        });
      })
    );
    return;
  }

  // Handle internal API requests - Network Only (always fresh data)
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(fetch(request));
    return;
  }

  // Handle app shell - Network First, fallback to cache
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Update cache with fresh version
        if (response.status === 200) {
          const responseToCache = response.clone();
          caches.open(APP_CACHE).then((cache) => {
            cache.put(request, responseToCache);
          });
        }
        return response;
      })
      .catch(() => {
        // Network failed, try cache
        return caches.match(request).then((cached) => {
          if (cached) {
            console.log('[SW] Offline - serving from cache:', url.pathname);
            return cached;
          }
          // No cache available
          return new Response('Offline and no cache available', {
            status: 503,
            statusText: 'Service Unavailable'
          });
        });
      })
  );
});

// Message event - allow manual cache control
self.addEventListener('message', (event) => {
  if (event.data.action === 'skipWaiting') {
    self.skipWaiting();
  }

  if (event.data.action === 'cacheQuran') {
    // Preload all Quran API versions for offline use
    event.waitUntil(
      caches.open(QURAN_CACHE).then(async (cache) => {
        console.log('[SW] Preloading all Quran versions from API...');
        const cachePromises = QURAN_API_URLS.map(async (url) => {
          try {
            const response = await fetch(url);
            if (response.status === 200) {
              await cache.put(url, response);
              console.log('[SW] Cached:', url.split('/').pop());
            }
          } catch (error) {
            console.error('[SW] Failed to cache:', url, error);
          }
        });
        return Promise.all(cachePromises);
      })
    );
  }

  if (event.data.action === 'clearCache') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        console.log('[SW] Clearing all caches...');
        return Promise.all(
          cacheNames.map((name) => {
            console.log('[SW] Deleting cache:', name);
            return caches.delete(name);
          })
        );
      })
    );
  }
});
