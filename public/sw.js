// Minimal service worker: caches the shell (root + offline page) on
// install, serves from cache when the network is down, does a straight
// fetch otherwise. No versioning — bump CACHE_NAME on new deploys if
// you need to invalidate.

const CACHE_NAME = "surguuli-shell-v1";
const OFFLINE_URL = "/offline.html";
const SHELL = ["/", OFFLINE_URL, "/logo.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(SHELL)).catch(() => {
      // Ignore — first offline load will still work via runtime cache.
    }),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)),
        ),
      ),
  );
  self.clients.claim();
});

self.addEventListener("fetch", (event) => {
  const req = event.request;
  // Only network-first for navigation. API calls, uploads, and static
  // assets pass through unchanged.
  if (req.mode !== "navigate") return;

  event.respondWith(
    fetch(req)
      .then((res) => {
        // Stash successful HTML responses so a repeat visit works offline.
        const copy = res.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(req, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches
          .match(req)
          .then((r) => r || caches.match(OFFLINE_URL))
          .then((r) => r || new Response("Offline", { status: 503 })),
      ),
  );
});
