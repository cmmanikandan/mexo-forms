const CACHE_NAME = 'mexo-forms-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/logo.png',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(STATIC_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // NEVER intercept/cache Supabase, auth, token, API, or non-GET requests
  if (
    request.method !== 'GET' ||
    request.url.includes('supabase.co') ||
    request.url.includes('/auth/') ||
    request.url.includes('/rest/') ||
    request.url.includes('/token')
  ) {
    return; // Pass through directly to browser network
  }

  // Navigation requests for SPA routes: try network first, fallback to cached /index.html
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request).catch(() => caches.match('/index.html'))
    );
    return;
  }

  // Cache-first for static local assets
  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
