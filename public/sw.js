const CACHE_NAME = 'orzen-flow-v1'

// Assets to cache immediately on install
const PRE_CACHE = [
  '/login',
  '/manifest.json',
  '/icons/icon-192x192.png',
  '/icons/icon-512x512.png',
]

// ── Install ──────────────────────────────────────────────────────────────────
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(PRE_CACHE))
  )
  self.skipWaiting()
})

// ── Activate ─────────────────────────────────────────────────────────────────
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((names) =>
      Promise.all(
        names.filter((n) => n !== CACHE_NAME).map((n) => caches.delete(n))
      )
    )
  )
  self.clients.claim()
})

// ── Fetch (Network-first, fallback to cache) ─────────────────────────────────
self.addEventListener('fetch', (event) => {
  // Skip non-GET and cross-origin
  if (event.request.method !== 'GET') return
  const url = new URL(event.request.url)
  if (url.origin !== self.location.origin) return
  // Skip Next.js internals
  if (url.pathname.startsWith('/_next/')) return
  if (url.pathname.startsWith('/api/')) return

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        if (response && response.status === 200) {
          const clone = response.clone()
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone))
        }
        return response
      })
      .catch(() =>
        caches.match(event.request).then(
          (cached) =>
            cached ||
            new Response(
              `<!DOCTYPE html><html><head><title>Offline</title>
              <meta name="viewport" content="width=device-width,initial-scale=1">
              <style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0;background:#1a1a1a;color:#fff}
              .box{text-align:center}.logo{color:#c9a84c;font-weight:bold;font-size:1.5rem;margin-bottom:.5rem}
              p{color:#aaa;font-size:.9rem}</style></head>
              <body><div class="box"><div class="logo">ORZEN FLOW</div>
              <p>You are offline. Please check your connection.</p></div></body></html>`,
              { headers: { 'Content-Type': 'text/html' } }
            )
        )
      )
  )
})
