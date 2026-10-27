// ============================================================================
// SERVICE WORKER: NETWORK-FIRST UPDATES & OFFLINE FALLBACK (sw.js)
// ============================================================================
const CACHE_NAME = 'subterranean-ascension-v1.25';
const PRECACHE_ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './assets/images/dyagonil-logo.png',
  './css/main.css',
  './css/animations.css',
  './css/overlays.css',
  './js/config/constants.js',
  './js/config/topologies.js',
  './js/config/catalogs.js',
  './js/config/difficulty.js',
  './js/state/settings.js',
  './js/state/gameState.js',
  './js/state/persistence.js',
  './js/audio/sfx.js',
  './js/audio/bgm.js',
  './js/engine/ai.js',
  './js/engine/boardLogic.js',
  './js/engine/rouletteSim.js',
  './js/graphics/scene3d.js',
  './js/graphics/vfx3d.js',
  './js/graphics/loop.js',
  './js/ui/notifications.js',
  './js/ui/hud.js',
  './js/ui/modals.js',
  './js/ui/input.js',
  './js/ui/introSequence.js',
  './js/ui/tutorial.js',
  './js/ui/debugMenu.js',
  './js/main.js'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRECACHE_ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((key) => key !== CACHE_NAME)
          .map((key) => caches.delete(key))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;

  let url;
  try {
    url = new URL(event.request.url);
  } catch (e) {
    return;
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') return;

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (
          networkResponse &&
          (networkResponse.status === 200 || networkResponse.type === 'opaque')
        ) {
          const responseClone = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseClone).catch(() => {});
          });
        }
        return networkResponse;
      })
      .catch(async () => {
        const cached = await caches.match(event.request);
        if (cached) return cached;
        if (event.request.mode === 'navigate') {
          const fallbackDoc = await caches.match('./index.html');
          if (fallbackDoc) return fallbackDoc;
        }
        return new Response('Offline', {
          status: 503,
          statusText: 'Service Unavailable (Offline)'
        });
      })
  );
});
