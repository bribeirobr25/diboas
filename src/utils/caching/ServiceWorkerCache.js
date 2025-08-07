import logger from '../logger'

/**
 * Service Worker Cache (L5)
 * Network-level caching for offline capabilities and CDN-like behavior
 */

export class ServiceWorkerCache {
  constructor(cacheName = 'diboas-cache-v1') {
    this.cacheName = cacheName
    this.isSupported = 'serviceWorker' in navigator && 'caches' in window
  }

  /**
   * Get value from service worker cache
   */
  async get(key) {
    if (!this.isSupported) return null

    try {
      const cache = await caches.open(this.cacheName)
      const response = await cache.match(this.keyToUrl(key))
      
      if (response) {
        const data = await response.json()
        return data
      }
      
      return null
    } catch (error) {
      logger.warn(`Failed to get ${key} from service worker cache:`, error)
      return null
    }
  }

  /**
   * Set value in service worker cache
   */
  async set(key, value, policy) {
    if (!this.isSupported) return false

    try {
      const cache = await caches.open(this.cacheName)
      const url = this.keyToUrl(key)
      
      // Create a response object
      const headers = new Headers({
        'Content-Type': 'application/json',
        'Cache-Control': `max-age=${Math.floor(policy.ttl / 1000)}`,
        'X-Cache-Timestamp': Date.now().toString(),
        'X-Cache-Policy': JSON.stringify(policy)
      })

      const response = new Response(JSON.stringify(value), {
        status: 200,
        statusText: 'OK',
        headers
      })

      await cache.put(url, response)
      return true

    } catch (error) {
      logger.warn(`Failed to set ${key} in service worker cache:`, error)
      return false
    }
  }

  /**
   * Delete value from service worker cache
   */
  async delete(key) {
    if (!this.isSupported) return false

    try {
      const cache = await caches.open(this.cacheName)
      const deleted = await cache.delete(this.keyToUrl(key))
      return deleted
    } catch (error) {
      logger.warn(`Failed to delete ${key} from service worker cache:`, error)
      return false
    }
  }

  /**
   * Clear all cached values
   */
  async clear() {
    if (!this.isSupported) return false

    try {
      const deleted = await caches.delete(this.cacheName)
      if (deleted) {
        logger.debug('Service worker cache cleared')
      }
      return deleted
    } catch (error) {
      logger.warn('Failed to clear service worker cache:', error)
      return false
    }
  }

  /**
   * Cache network request
   */
  async cacheRequest(request, response, policy) {
    if (!this.isSupported) return false

    try {
      const cache = await caches.open(this.cacheName)
      
      // Clone response since it can only be consumed once
      const responseClone = response.clone()
      
      // Add cache headers
      const headers = new Headers(responseClone.headers)
      headers.set('X-Cache-Timestamp', Date.now().toString())
      headers.set('X-Cache-Policy', JSON.stringify(policy))
      headers.set('Cache-Control', `max-age=${Math.floor(policy.ttl / 1000)}`)

      const cachedResponse = new Response(await responseClone.blob(), {
        status: responseClone.status,
        statusText: responseClone.statusText,
        headers
      })

      await cache.put(request, cachedResponse)
      return true

    } catch (error) {
      logger.warn('Failed to cache network request:', error)
      return false
    }
  }

  /**
   * Get cached network response
   */
  async getCachedResponse(request) {
    if (!this.isSupported) return null

    try {
      const cache = await caches.open(this.cacheName)
      const response = await cache.match(request)
      
      if (response) {
        // Check if cached response is still valid
        const cacheTimestamp = response.headers.get('X-Cache-Timestamp')
        const cachePolicy = response.headers.get('X-Cache-Policy')
        
        if (cacheTimestamp && cachePolicy) {
          const policy = JSON.parse(cachePolicy)
          const age = Date.now() - parseInt(cacheTimestamp)
          
          if (age > policy.ttl) {
            // Expired, remove from cache
            await cache.delete(request)
            return null
          }
        }
        
        return response
      }
      
      return null
    } catch (error) {
      logger.warn('Failed to get cached response:', error)
      return null
    }
  }

  /**
   * Prefetch and cache resources
   */
  async prefetchResources(urls, policy) {
    if (!this.isSupported) return false

    const results = await Promise.allSettled(
      urls.map(async (url) => {
        try {
          const response = await fetch(url)
          if (response.ok) {
            await this.cacheRequest(url, response, policy)
            return { url, success: true }
          }
          return { url, success: false, error: 'Request failed' }
        } catch (error) {
          return { url, success: false, error: error.message }
        }
      })
    )

    const successful = results.filter(r => r.value?.success).length
    logger.debug(`Prefetched ${successful}/${urls.length} resources`)
    
    return successful > 0
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!this.isSupported) {
      return { error: 'Service Worker not supported' }
    }

    try {
      const cache = await caches.open(this.cacheName)
      const requests = await cache.keys()
      
      let totalSize = 0
      const policyDistribution = {}
      let oldestTimestamp = Date.now()
      let newestTimestamp = 0

      for (const request of requests) {
        try {
          const response = await cache.match(request)
          if (response) {
            // Estimate size
            const blob = await response.clone().blob()
            totalSize += blob.size

            // Parse policy and timestamp
            const cacheTimestamp = response.headers.get('X-Cache-Timestamp')
            const cachePolicy = response.headers.get('X-Cache-Policy')
            
            if (cacheTimestamp) {
              const timestamp = parseInt(cacheTimestamp)
              oldestTimestamp = Math.min(oldestTimestamp, timestamp)
              newestTimestamp = Math.max(newestTimestamp, timestamp)
            }

            if (cachePolicy) {
              try {
                const policy = JSON.parse(cachePolicy)
                const policyType = policy.constructor?.name || 'unknown'
                policyDistribution[policyType] = (policyDistribution[policyType] || 0) + 1
              } catch (e) {
                policyDistribution['unknown'] = (policyDistribution['unknown'] || 0) + 1
              }
            }
          }
        } catch (error) {
          logger.warn('Error processing cache entry:', error)
        }
      }

      return {
        entryCount: requests.length,
        totalSize,
        averageSize: requests.length > 0 ? Math.round(totalSize / requests.length) : 0,
        policyDistribution,
        oldestEntry: oldestTimestamp < Date.now() ? oldestTimestamp : null,
        newestEntry: newestTimestamp > 0 ? newestTimestamp : null,
        cacheName: this.cacheName
      }

    } catch (error) {
      return { error: 'Failed to get cache stats: ' + error.message }
    }
  }

  /**
   * Cleanup expired entries
   */
  async cleanup() {
    if (!this.isSupported) return 0

    try {
      const cache = await caches.open(this.cacheName)
      const requests = await cache.keys()
      const now = Date.now()
      let removedCount = 0

      for (const request of requests) {
        try {
          const response = await cache.match(request)
          if (response) {
            const cacheTimestamp = response.headers.get('X-Cache-Timestamp')
            const cachePolicy = response.headers.get('X-Cache-Policy')
            
            if (cacheTimestamp && cachePolicy) {
              const timestamp = parseInt(cacheTimestamp)
              const policy = JSON.parse(cachePolicy)
              
              if (policy.ttl && (now - timestamp) > policy.ttl) {
                await cache.delete(request)
                removedCount++
              }
            }
          }
        } catch (error) {
          // If we can't process the entry, remove it
          await cache.delete(request)
          removedCount++
        }
      }

      if (removedCount > 0) {
        logger.debug(`Cleaned up ${removedCount} expired service worker cache entries`)
      }

      return removedCount

    } catch (error) {
      logger.warn('Failed to cleanup service worker cache:', error)
      return 0
    }
  }

  /**
   * Convert cache key to URL for service worker cache
   */
  keyToUrl(key) {
    // Create a pseudo-URL for the cache key
    return `https://cache.diboas.internal/${encodeURIComponent(key)}`
  }

  /**
   * Install service worker for advanced caching
   */
  async installServiceWorker(swPath = '/sw.js') {
    if (!this.isSupported) return false

    try {
      const registration = await navigator.serviceWorker.register(swPath)
      logger.debug('Service worker registered:', registration)
      return true
    } catch (error) {
      logger.warn('Failed to register service worker:', error)
      return false
    }
  }
}