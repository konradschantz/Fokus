const CACHE_VERSION = 'v2'
const CACHE_NAME = `fokus-static-${CACHE_VERSION}`
const CORE_ASSETS = [
  '/',
  '/index.html',
  '/manifest.webmanifest',
  '/brand-logo.png',
  '/brand-logo.svg',
  '/vite.svg',
]
const NAVIGATION_FALLBACK = '/index.html'

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(CORE_ASSETS))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(
          keys
            .filter((key) => key.startsWith('fokus-static-') && key !== CACHE_NAME)
            .map((key) => caches.delete(key)),
        ),
      )
      .then(() => self.clients.claim()),
  )
})

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') {
    return
  }

  const { request } = event

  if (request.mode === 'navigate') {
    event.respondWith(staleWhileRevalidate(request, NAVIGATION_FALLBACK))
    return
  }

  if (CORE_ASSETS.includes(new URL(request.url).pathname)) {
    event.respondWith(cacheFirst(request))
    return
  }

  event.respondWith(staleWhileRevalidate(request))
})

async function cacheFirst(request) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)
  if (cachedResponse) {
    return cachedResponse
  }

  const networkResponse = await fetch(request)
  if (networkResponse && networkResponse.ok) {
    cache.put(request, networkResponse.clone())
  }
  return networkResponse
}

async function staleWhileRevalidate(request, fallbackPath) {
  const cache = await caches.open(CACHE_NAME)
  const cachedResponse = await cache.match(request)

  const networkFetch = fetch(request)
    .then((response) => {
      if (response && response.ok) {
        cache.put(request, response.clone())
      }
      return response
    })
    .catch(async (error) => {
      if (cachedResponse) {
        return cachedResponse
      }

      if (fallbackPath) {
        const fallbackResponse = await cache.match(fallbackPath)
        if (fallbackResponse) {
          return fallbackResponse
        }
      }

      throw error
    })

  return cachedResponse || networkFetch
}
