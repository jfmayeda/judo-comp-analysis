// Service Worker for Silicon Valley Judo PWA
// Implements offline-first caching strategy

const VERSION = 'v1';
const SHELL_CACHE = `shell-${VERSION}`;
const DATA_CACHE = `data-${VERSION}`;

// Assets to precache on install (only public static assets)
const SHELL_ASSETS = [
  '/favicon.ico',
  '/svj-logo-white.png',
  '/manifest.json',
];

// Supabase API base URL (will be set from env at runtime)
const SUPABASE_URL_PATTERN = /supabase\.co\/rest\/v1\/(athletes|opponent_notes|tournament_days|tournament_day_entries)/;
const AUTH_PATTERN = /supabase\.co\/auth/;

// Install: precache shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL_CACHE).then((cache) => {
      return cache.addAll(SHELL_ASSETS);
    }).then(() => {
      return self.skipWaiting();
    })
  );
});

// Activate: clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (cacheName !== SHELL_CACHE && cacheName !== DATA_CACHE) {
            return caches.delete(cacheName);
          }
        })
      );
    }).then(() => {
      return self.clients.claim();
    })
  );
});

// Fetch: intercept network requests
self.addEventListener('fetch', (event) => {
  const { request } = event;
  const url = new URL(request.url);

  // Skip non-GET requests (POST/PUT/DELETE must reach server)
  if (request.method !== 'GET') {
    return;
  }

  // Never cache auth endpoints (always need fresh session)
  if (AUTH_PATTERN.test(request.url)) {
    event.respondWith(fetch(request));
    return;
  }

  // Supabase data: network-first with cache fallback
  if (SUPABASE_URL_PATTERN.test(request.url)) {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // Clone response before caching
          const responseClone = response.clone();
          caches.open(DATA_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        })
        .catch(() => {
          // Network failed, try cache
          return caches.match(request).then((cachedResponse) => {
            if (cachedResponse) {
              return cachedResponse;
            }
            // No cache either, return offline response
            return new Response(
              JSON.stringify({ error: 'Offline', offline: true }),
              {
                status: 503,
                headers: { 'Content-Type': 'application/json' },
              }
            );
          });
        })
    );
    return;
  }

  // Shell assets and Next.js chunks: cache-first
  if (
    url.origin === self.location.origin &&
    (url.pathname.startsWith('/_next/') ||
      url.pathname.startsWith('/static/') ||
      SHELL_ASSETS.includes(url.pathname))
  ) {
    event.respondWith(
      caches.match(request).then((cachedResponse) => {
        if (cachedResponse) {
          return cachedResponse;
        }
        return fetch(request).then((response) => {
          const responseClone = response.clone();
          caches.open(SHELL_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
          return response;
        });
      })
    );
    return;
  }

  // Default: network-first with runtime caching for HTML documents
  event.respondWith(
    fetch(request)
      .then((response) => {
        // Cache successful HTML responses for offline access
        if (response.ok && request.headers.get('accept')?.includes('text/html')) {
          const responseClone = response.clone();
          caches.open(SHELL_CACHE).then((cache) => {
            cache.put(request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Try cache on network failure
        return caches.match(request);
      })
  );
});

// Message handler: clear cache on command
self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.delete(DATA_CACHE).then(() => {
        event.ports[0].postMessage({ success: true });
      })
    );
  }

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});
