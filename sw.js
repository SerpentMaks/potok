/* Static, relative-path cache works at both / and /repository/ on GitHub Pages. */
const PREFIX = 'potok-static-';
const CACHE = PREFIX + 'v1.1.0';
const CORE = ['./','./index.html','./styles.css?v=1.1.0','./app.js?v=1.1.0','./finance.js?v=1.1.0','./pwa.js?v=1.1.0','./manifest.json','./icon.svg','./icons/icon-192.png','./icons/icon-512.png','./icons/maskable-512.png'];
const OPTIONAL = ['https://cdn.jsdelivr.net/npm/chart.js@4.4.8/dist/chart.umd.min.js','https://unpkg.com/lucide@0.468.0/dist/umd/lucide.min.js'];
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll(CORE);
    await Promise.allSettled(OPTIONAL.map(async url => {
      const response = await fetch(url, {mode:'cors', signal:AbortSignal.timeout(8000)});
      if (response.ok) await cache.put(url, response);
    }));
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(k => k.startsWith(PREFIX) && k !== CACHE).map(k => caches.delete(k)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  const local = url.origin === self.location.origin && url.pathname.startsWith(new URL(self.registration.scope).pathname);
  if (!local && !OPTIONAL.includes(url.href)) return;
  // Verification probes must reach the network and must never fall back to saved HTML.
  if (event.request.cache === 'no-store' || url.searchParams.has('_potok_check')) {
    event.respondWith(fetch(event.request));
    return;
  }
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    if (event.request.mode === 'navigate') {
      try {
        const response = await fetch(event.request);
        if (response.ok) await cache.put('./index.html', response.clone());
        return response;
      } catch {
        return await cache.match('./index.html') || Response.error();
      }
    }
    const saved = await cache.match(event.request);
    if (saved) return saved;
    try {
      const response = await fetch(event.request);
      if (response.ok) await cache.put(event.request, response.clone());
      return response;
    } catch {
      // Inline icons and chart fallbacks keep every screen usable without CDN.
      if (OPTIONAL.includes(url.href)) return new Response('', {headers:{'Content-Type':'application/javascript'}});
      return Response.error();
    }
  })());
});
