// NODO service worker: keeps the app usable on slow or dropped connections.
// - Build assets and brand files: cache first (they are immutable).
// - Product photos: cache first too (each path is written once), capped.
// - Pages: network first, falling back to the last copy seen, then /offline.
const VERSION = "nodo-v1";
const STATIC_CACHE = `${VERSION}-static`;
const PAGES_CACHE = `${VERSION}-pages`;
const PHOTOS_CACHE = `${VERSION}-photos`;
const OFFLINE_URL = "/offline";
const MAX_PAGES = 40;
const MAX_PHOTOS = 150;
const PRECACHE = [OFFLINE_URL, "/icons/icon-192.png", "/brand/nodo-simbolo.svg"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(STATIC_CACHE)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

async function trim(cacheName, max) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  await Promise.all(keys.slice(0, Math.max(0, keys.length - max)).map((k) => cache.delete(k)));
}

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const immutable =
    url.pathname.startsWith("/_next/static/") ||
    url.pathname.startsWith("/icons/") ||
    url.pathname.startsWith("/brand/");

  const photo = url.pathname.startsWith("/fotos/");

  if (immutable || photo) {
    const cacheName = photo ? PHOTOS_CACHE : STATIC_CACHE;
    event.respondWith(
      caches.open(cacheName).then(async (cache) => {
        const hit = await cache.match(request);
        if (hit) return hit;
        const response = await fetch(request);
        if (response.ok) {
          await cache.put(request, response.clone());
          if (photo) event.waitUntil(trim(PHOTOS_CACHE, MAX_PHOTOS));
        }
        return response;
      }),
    );
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      (async () => {
        try {
          const response = await fetch(request);
          if (response.ok) {
            const cache = await caches.open(PAGES_CACHE);
            await cache.put(request, response.clone());
            event.waitUntil(trim(PAGES_CACHE, MAX_PAGES));
          }
          return response;
        } catch {
          return (await caches.match(request)) || (await caches.match(OFFLINE_URL));
        }
      })(),
    );
  }
});
