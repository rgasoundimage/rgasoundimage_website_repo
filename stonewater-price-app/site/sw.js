/* RGA Price Catalogue — PWA service worker
   v2 — network-first so redeploys show up on reload, cache fallback for offline */
const CACHE = "stonewater-dev";
const ASSETS = [
  "./", "index.html", "styles.css", "app.js", "expr.js", "prices.json",
  "manifest.webmanifest",
  "icons/rga-logo.png",
  // ?v= is deliberate. netlify.toml serves /icons/* with `immutable`, so a client
  // that fetched the old amber icons holds them for a year and will never
  // revalidate. Only a changed URL escapes that cache. Bump on any icon change.
  "icons/icon-192.png?v=2.3.0", "icons/icon-512.png?v=2.3.0", "icons/icon-maskable-512.png?v=2.3.0",
  "icons/apple-touch-icon.png?v=2.3.0", "icons/favicon-32.png?v=2.3.0"
];

self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// Network-first: try the live file, fall back to cache when offline.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() =>
        caches.match(e.request, { ignoreSearch: true })
          .then((hit) => hit || caches.match("index.html"))
      )
  );
});
