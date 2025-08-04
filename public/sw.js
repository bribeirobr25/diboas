/**
 * diBoaS Service Worker
 * Provides advanced caching strategies and offline capabilities
 */

const CACHE_NAME = 'diboas-cache-v1'
const STATIC_CACHE = 'diboas-static-v1'
const DYNAMIC_CACHE = 'diboas-dynamic-v1'
const API_CACHE = 'diboas-api-v1'

// Assets to cache on install
const STATIC_ASSETS = [
  '/',
  '/app',
  '/auth',
  '/manifest.json',
  // Add other critical assets here
]

// Cache strategies by URL pattern
const CACHE_STRATEGIES = {
  // Static assets - cache first
  static: {
    pattern: /\.(js|css|png|jpg|jpeg|gif|svg|ico|woff|woff2)$/,
    strategy: 'cache-first',
    cacheName: STATIC_CACHE,
    maxAge: 24 * 60 * 60 * 1000 // 24 hours
  },
  
  // API calls - network first with fallback
  api: {
    pattern: /\/api\//,
    strategy: 'network-first',
    cacheName: API_CACHE,
    maxAge: 5 * 60 * 1000 // 5 minutes
  },
  
  // App pages - stale while revalidate
  pages: {
    pattern: /\/(app|auth|dashboard|transactions|account)/,
    strategy: 'stale-while-revalidate',
    cacheName: DYNAMIC_CACHE,
    maxAge: 30 * 60 * 1000 // 30 minutes
  }
}

/**
 * Install event - cache static assets
 */
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Static assets cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets:', error)
      })
  )
})

/**
 * Activate event - clean up old caches
 */
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        const validCaches = [STATIC_CACHE, DYNAMIC_CACHE, API_CACHE, CACHE_NAME]
        
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (!validCaches.includes(cacheName)) {
              console.log('Service Worker: Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

/**
 * Fetch event - implement caching strategies
 */
self.addEventListener('fetch', (event) => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') return

  const url = new URL(event.request.url)
  
  // Skip chrome-extension and other non-http requests
  if (!url.protocol.startsWith('http')) return

  // Find matching cache strategy
  const strategy = findCacheStrategy(event.request.url)
  
  if (strategy) {
    event.respondWith(handleCacheStrategy(event.request, strategy))
  }
})

/**
 * Find appropriate cache strategy for URL
 */
function findCacheStrategy(url) {
  for (const [name, config] of Object.entries(CACHE_STRATEGIES)) {
    if (config.pattern.test(url)) {
      return config
    }
  }
  return null
}

/**
 * Handle different cache strategies
 */
async function handleCacheStrategy(request, strategy) {
  switch (strategy.strategy) {
    case 'cache-first':
      return handleCacheFirst(request, strategy)
    
    case 'network-first':
      return handleNetworkFirst(request, strategy)
    
    case 'stale-while-revalidate':
      return handleStaleWhileRevalidate(request, strategy)
    
    default:
      return fetch(request)
  }
}

/**
 * Cache First Strategy
 * Check cache first, fallback to network
 */
async function handleCacheFirst(request, strategy) {
  try {
    const cache = await caches.open(strategy.cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse && !isExpired(cachedResponse, strategy.maxAge)) {
      return cachedResponse
    }
    
    // Fetch from network and cache
    const networkResponse = await fetch(request)
    if (networkResponse.ok) {
      const responseClone = networkResponse.clone()
      await cache.put(request, addCacheHeaders(responseClone, strategy))
    }
    
    return networkResponse
    
  } catch (error) {
    console.error('Cache first strategy failed:', error)
    
    // Try to return stale cache as last resort
    const cache = await caches.open(strategy.cacheName)
    const staleResponse = await cache.match(request)
    
    if (staleResponse) {
      return staleResponse
    }
    
    throw error
  }
}

/**
 * Network First Strategy
 * Try network first, fallback to cache
 */
async function handleNetworkFirst(request, strategy) {
  try {
    const networkResponse = await fetch(request)
    
    if (networkResponse.ok) {
      const cache = await caches.open(strategy.cacheName)
      const responseClone = networkResponse.clone()
      await cache.put(request, addCacheHeaders(responseClone, strategy))
    }
    
    return networkResponse
    
  } catch (error) {
    console.warn('Network request failed, trying cache:', error)
    
    const cache = await caches.open(strategy.cacheName)
    const cachedResponse = await cache.match(request)
    
    if (cachedResponse) {
      return cachedResponse
    }
    
    throw error
  }
}

/**
 * Stale While Revalidate Strategy
 * Return cached version immediately, update cache in background
 */
async function handleStaleWhileRevalidate(request, strategy) {
  const cache = await caches.open(strategy.cacheName)
  const cachedResponse = await cache.match(request)
  
  // Start network request in parallel
  const networkPromise = fetch(request)
    .then((networkResponse) => {
      if (networkResponse.ok) {
        const responseClone = networkResponse.clone()
        cache.put(request, addCacheHeaders(responseClone, strategy))
      }
      return networkResponse
    })
    .catch((error) => {
      console.warn('Background revalidation failed:', error)
    })
  
  // Return cached response if available, otherwise wait for network
  if (cachedResponse && !isExpired(cachedResponse, strategy.maxAge)) {
    // Don't await the network promise - let it update cache in background
    networkPromise.catch(() => {}) // Prevent unhandled rejection
    return cachedResponse
  }
  
  return networkPromise
}

/**
 * Check if cached response is expired
 */
function isExpired(response, maxAge) {
  const cacheTimestamp = response.headers.get('sw-cache-timestamp')
  if (!cacheTimestamp) return false
  
  const age = Date.now() - parseInt(cacheTimestamp)
  return age > maxAge
}

/**
 * Add cache headers to response
 */
function addCacheHeaders(response, strategy) {
  const headers = new Headers(response.headers)
  headers.set('sw-cache-timestamp', Date.now().toString())
  headers.set('sw-cache-strategy', strategy.strategy)
  headers.set('sw-cache-max-age', strategy.maxAge.toString())
  
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  })
}

/**
 * Background sync for failed requests
 */
self.addEventListener('sync', (event) => {
  if (event.tag === 'background-sync') {
    event.waitUntil(handleBackgroundSync())
  }
})

/**
 * Handle background sync
 */
async function handleBackgroundSync() {
  // Implement background sync logic here
  console.log('Service Worker: Background sync triggered')
}

/**
 * Push notification handling
 */
self.addEventListener('push', (event) => {
  const options = {
    body: event.data ? event.data.text() : 'New notification from diBoaS',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/badge-72x72.png',
    tag: 'diboas-notification',
    requireInteraction: true,
    data: {
      url: '/app'
    }
  }
  
  event.waitUntil(
    self.registration.showNotification('diBoaS', options)
  )
})

/**
 * Notification click handling
 */
self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  
  const url = event.notification.data?.url || '/app'
  
  event.waitUntil(
    clients.matchAll({ type: 'window' })
      .then((clientList) => {
        // Check if app is already open
        for (const client of clientList) {
          if (client.url.includes(url) && 'focus' in client) {
            return client.focus()
          }
        }
        
        // Open new window if app isn't open
        if (clients.openWindow) {
          return clients.openWindow(url)
        }
      })
  )
})

/**
 * Message handling for communication with main thread
 */
self.addEventListener('message', (event) => {
  const { type, payload } = event.data
  
  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'CACHE_URLS':
      event.waitUntil(cacheUrls(payload.urls, payload.cacheName))
      break
      
    case 'CLEAR_CACHE':
      event.waitUntil(clearCache(payload.cacheName))
      break
      
    case 'GET_CACHE_STATS':
      event.waitUntil(getCacheStats().then(stats => {
        event.ports[0].postMessage({ type: 'CACHE_STATS', payload: stats })
      }))
      break
  }
})

/**
 * Cache specific URLs
 */
async function cacheUrls(urls, cacheName = CACHE_NAME) {
  const cache = await caches.open(cacheName)
  return cache.addAll(urls)
}

/**
 * Clear specific cache
 */
async function clearCache(cacheName) {
  return caches.delete(cacheName)
}

/**
 * Get cache statistics
 */
async function getCacheStats() {
  const cacheNames = await caches.keys()
  const stats = {}
  
  for (const cacheName of cacheNames) {
    const cache = await caches.open(cacheName)
    const keys = await cache.keys()
    
    let totalSize = 0
    for (const request of keys) {
      try {
        const response = await cache.match(request)
        if (response) {
          const blob = await response.clone().blob()
          totalSize += blob.size
        }
      } catch (error) {
        console.warn('Error calculating cache size:', error)
      }
    }
    
    stats[cacheName] = {
      entryCount: keys.length,
      totalSize,
      averageSize: keys.length > 0 ? Math.round(totalSize / keys.length) : 0
    }
  }
  
  return stats
}