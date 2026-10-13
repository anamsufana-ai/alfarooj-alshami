// Makes the site installable as a phone app and keeps working on a weak connection.
// Network first: customers always get the latest menu and prices when online;
// the saved copy is only used when the network fails. API calls are never cached.
const CACHE = "site-v1";

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(["/"])).catch(() => {}));
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key)))),
  );
  self.clients.claim();
});

const STATIC = /\.(?:js|css|png|jpe?g|webp|svg|ico|woff2?|webmanifest)$/;

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin) return;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/.netlify/")) return;
  const isPage = request.mode === "navigate";
  if (!isPage && !STATIC.test(url.pathname)) return;
  event.respondWith(
    fetch(request)
      .then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      })
      .catch(() => caches.match(request).then((saved) => saved || (isPage ? caches.match("/") : undefined))),
  );
});
