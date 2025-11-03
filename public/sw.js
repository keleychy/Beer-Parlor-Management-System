// public/sw.js
const CACHE_NAME = "beer-parlor-static-v1";
const STATIC_ASSETS = ["/", "/favicon.ico", "/_next/static/"],

self.addEventListener("install", (ev) => {
  self.skipWaiting();
  ev.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      // cache a few essential files
      return cache.addAll(["/", "/favicon.ico"]);
    })
  );
});

self.addEventListener("activate", (ev) => {
  clients.claim();
});

self.addEventListener("fetch", (ev) => {
  // Try cache first for navigation/static assets
  const req = ev.request;
  if (req.method !== "GET") return;
  ev.respondWith(
    caches.match(req).then((cached) => {
      if (cached) return cached;
      return fetch(req)
        .then((res) => {
          // optionally put in cache for next time
          return res;
        })
        .catch(() => {
          // offline fallback could be returned here
        });
    })
  );
});
