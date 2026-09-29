const CACHE = "lwart-frota-v1";
const APP_SHELL = ["/", "/favicon.svg", "/manifest.webmanifest"];
self.addEventListener("install", (event) => event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(APP_SHELL))));
self.addEventListener("activate", (event) => event.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))));
self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET" || new URL(request.url).pathname.startsWith("/api/")) return;
  event.respondWith(fetch(request).then((response) => { const copy = response.clone(); void caches.open(CACHE).then((cache) => cache.put(request, copy)); return response; }).catch(() => caches.match(request).then((cached) => cached || caches.match("/"))));
});
