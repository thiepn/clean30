const CACHE_PREFIX = "clean30-";
const CACHE_NAME = `${CACHE_PREFIX}app-shell-v17`;
const BASE_PATH = "/clean30/";
const OFFLINE_FALLBACK_HTML = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Clean30 offline</title>
  </head>
  <body>
    <main>
      <h1>Clean30 is unavailable offline</h1>
      <p>Open Clean30 once while connected so the app can finish caching its local files.</p>
    </main>
  </body>
</html>`;

const STATIC_SHELL = [
  BASE_PATH,
  `${BASE_PATH}index.html`,
  `${BASE_PATH}manifest.webmanifest`,
  `${BASE_PATH}favicon.svg`,
  `${BASE_PATH}icons/favicon-32-v2.png`,
  `${BASE_PATH}icons/apple-touch-icon-v2.png`,
  `${BASE_PATH}icons/icon-clean30-v2-192.png`,
  `${BASE_PATH}icons/icon-clean30-v2-512.png`,
  `${BASE_PATH}icons/maskable-clean30-v2-192.png`,
  `${BASE_PATH}icons/maskable-clean30-v2-512.png`
];

function findBuiltAssets(html) {
  const assets = new Set();
  const assetPattern = /["'](\/clean30\/assets\/[^"']+\.(?:css|js))["']/g;
  let match = assetPattern.exec(html);
  while (match) {
    assets.add(match[1]);
    match = assetPattern.exec(html);
  }
  return [...assets];
}

async function cacheUrl(cache, url) {
  try {
    await cache.add(url);
  } catch {
    // One missing optional asset should not prevent the service worker from installing.
  }
}

async function cacheAppShell() {
  const cache = await caches.open(CACHE_NAME);
  await Promise.all(STATIC_SHELL.map((url) => cacheUrl(cache, url)));

  try {
    const response = await fetch(`${BASE_PATH}index.html`, { cache: "no-cache" });
    if (!response.ok) return;
    const responseForCache = response.clone();
    const html = await response.text();
    await cache.put(`${BASE_PATH}index.html`, responseForCache);
    await Promise.all(findBuiltAssets(html).map((url) => cacheUrl(cache, url)));
  } catch {
    // Offline fallback remains whatever shell was already cached.
  }
}

async function getNavigationFallback() {
  const cached = await caches.match(`${BASE_PATH}index.html`);
  if (cached) return cached;
  return new Response(OFFLINE_FALLBACK_HTML, {
    status: 503,
    statusText: "Offline",
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheAppShell());
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
            .map((key) => caches.delete(key))
        )
      )
  );
  self.clients.claim();
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);

  if (request.method !== "GET" || url.origin !== self.location.origin) {
    return;
  }

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(`${BASE_PATH}index.html`, copy));
          }
          return response;
        })
        .catch(() => getNavigationFallback())
    );
    return;
  }

  if (url.pathname.startsWith(`${BASE_PATH}assets/`)) {
    event.respondWith(
      caches.match(request).then((cached) => {
        const networkFetch = fetch(request).then((response) => {
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
          }
          return response;
        });

        if (cached) {
          networkFetch.catch(() => undefined);
          return cached;
        }

        return networkFetch;
      })
    );
    return;
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached;
      return fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(request, copy));
        }
        return response;
      });
    })
  );
});
