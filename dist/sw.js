const CACHE_NAME = "clean30-app-shell-v2";
const BASE_PATH = "/clean30/";

const APP_SHELL = [
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

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((key) => key !== CACHE_NAME).map((key) => caches.delete(key)))
      )
  );
  self.clients.claim();
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
          const copy = response.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(`${BASE_PATH}index.html`, copy));
          return response;
        })
        .catch(() => caches.match(`${BASE_PATH}index.html`))
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
