// QuranAkh Service Worker - Professional Offline Support
// Caches Quran JSON files for offline reading

const CACHE_VERSION = 'quranakh-v1';
const QURAN_CACHE = 'quran-data-v1';
const APP_CACHE = 'app-shell-v1';

// Files to cache on install
const APP_SHELL = [
  '/',
  '/manifest.json'
];

// Quran JSON files to cache
const QURAN_FILES = [
  '/quran/uthmani-hafs-full.json',
  '/quran/warsh.json',
  '/quran/qaloon.json',
  '/quran/uthmani.json',
  '/quran/tajweed.json',
  '/quran/simple.json'
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

  // Handle Quran JSON files - Cache First strategy
  if (url.pathname.startsWith('/quran/') && url.pathname.endsWith('.json')) {
    event.respondWith(
      caches.open(QURAN_CACHE).then((cache) => {
        return cache.match(request).then((cached) => {
          if (cached) {
            console.log('[SW] Serving from cache:', url.pathname);
            return cached;
          }

          // Not in cache, fetch and cache
          console.log('[SW] Fetching and caching:', url.pathname);
          return fetch(request).then((response) => {
            // Clone response before caching
            const responseToCache = response.clone();
            cache.put(request, responseToCache);
            return response;
          });
        });
      })
    );
    return;
  }

  // Handle API requests - Network Only (always fresh data)
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
    // Preload all Quran files
    event.waitUntil(
      caches.open(QURAN_CACHE).then((cache) => {
        console.log('[SW] Preloading all Quran versions...');
        return cache.addAll(QURAN_FILES);
      })
    );
  }

  if (event.data.action === 'clearCache') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(
          cacheNames.map((name) => caches.delete(name))
        );
      })
    );
  }
});
