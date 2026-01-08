const CACHE_NAME = "ug2-attendance-v1";

const FILES = [
  "/RK-UG2-S2026/",
  "/RK-UG2-S2026/index.html",
  "/RK-UG2-S2026/style.css",
  "/RK-UG2-S2026/script.js",
  "/RK-UG2-S2026/attendance.js",
  "/RK-UG2-S2026/manifest.json",
  "/RK-UG2-S2026/icon-192.png",
  "/RK-UG2-S2026/icon-512.png"
];

self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache => cache.addAll(FILES))
  );
});

self.addEventListener("fetch", e => {
  e.respondWith(
    caches.match(e.request).then(r => r || fetch(e.request))
  );
});
