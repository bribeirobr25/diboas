/**
 * Multi-Level Cache Manager
 * Implements a sophisticated caching strategy with multiple cache levels
 */

import { MemoryCache } from './MemoryCache.js'
import { StorageCache } from './StorageCache.js'
import { IndexedDBCache } from './IndexedDBCache.js'
import { ServiceWorkerCache } from './ServiceWorkerCache.js'
import logger from '../logger'

/**
 * Cache levels in order of access speed (fastest to slowest)
 */
export const CACHE_LEVELS = {
  MEMORY: 'memory',           // L1: In-memory cache (fastest)
  SESSION: 'session',         // L2: Session storage
  LOCAL: 'local',            // L3: Local storage
  INDEXED_DB: 'indexeddb',   // L4: IndexedDB (largest capacity)
  SERVICE_WORKER: 'sw'       // L5: Service Worker cache
}

/**
 * Cache policies for different data types
 */
export const CACHE_POLICIES = {
  // Static data - cache for long periods
  STATIC: {
    ttl: 24 * 60 * 60 * 1000, // 24 hours
    levels: [CACHE_LEVELS.MEMORY, CACHE_LEVELS.LOCAL, CACHE_LEVELS.SERVICE_WORKER],
    maxSize: 1000,
    compression: true
  },
  
  // Dynamic data - cache for short periods
  DYNAMIC: {
    ttl: 5 * 60 * 1000, // 5 minutes
    levels: [CACHE_LEVELS.MEMORY, CACHE_LEVELS.SESSION],
    maxSize: 500,
    compression: false
  },
  
  // User data - cache with encryption
  USER: {
    ttl: 30 * 60 * 1000, // 30 minutes
    levels: [CACHE_LEVELS.MEMORY, CACHE_LEVELS.LOCAL],
    maxSize: 200,
    encryption: true,
    compression: false
  },
  
  // API responses - cache with validation
  API: {
    ttl: 10 * 60 * 1000, // 10 minutes
    levels: [CACHE_LEVELS.MEMORY, CACHE_LEVELS.SESSION, CACHE_LEVELS.INDEXED_DB],
    maxSize: 1000,
    compression: true,
    etag: true
  },
  
  // Critical data - never cache
  CRITICAL: {
    ttl: 0,
    levels: [],
    maxSize: 0
  }
}

/**
 * Main Cache Manager class
 */
export class CacheManager {
  constructor() {
    this.caches = new Map()
    this.stats = {
      hits: 0,
      misses: 0,
      sets: 0,
      deletes: 0,
      evictions: 0
    }
    
    this.initializeCaches()
  }

  /**
   * Initialize all cache levels
   */
  async initializeCaches() {
    try {
      // L1: Memory Cache
      this.caches.set(CACHE_LEVELS.MEMORY, new MemoryCache())
      
      // L2: Session Storage Cache
      this.caches.set(CACHE_LEVELS.SESSION, new StorageCache('session'))
      
      // L3: Local Storage Cache
      this.caches.set(CACHE_LEVELS.LOCAL, new StorageCache('local'))
      
      // L4: IndexedDB Cache
      this.caches.set(CACHE_LEVELS.INDEXED_DB, new IndexedDBCache())
      await this.caches.get(CACHE_LEVELS.INDEXED_DB).initialize()
      
      // L5: Service Worker Cache
      if ('serviceWorker' in navigator) {
        this.caches.set(CACHE_LEVELS.SERVICE_WORKER, new ServiceWorkerCache())
      }
      
      logger.debug('✅ Multi-level cache system initialized')
    } catch (error) {
      logger.error('❌ Failed to initialize cache system:', error)
    }
  }

  /**
   * Get value from cache with automatic level selection
   */
  async get(key, policy = CACHE_POLICIES.DYNAMIC) {
    const startTime = performance.now()
    
    for (const level of policy.levels) {
      const cache = this.caches.get(level)
      if (!cache) continue
      
      try {
        const result = await cache.get(key)
        if (result !== null && result !== undefined) {
          // Validate TTL
          if (this.isExpired(result, policy.ttl)) {
            await cache.delete(key)
            continue
          }
          
          // Update stats and promote to faster caches
          this.stats.hits++
          await this.promoteToFasterCaches(key, result, level, policy)
          
          const endTime = performance.now()
          logger.debug(`📊 Cache HIT (${level}): ${key} in ${(endTime - startTime).toFixed(2)}ms`)
          
          return this.deserializeValue(result, policy)
        }
      } catch (error) {
        logger.warn(`⚠️ Cache level ${level} failed for key ${key}:`, error)
      }
    }
    
    this.stats.misses++
    const endTime = performance.now()
    logger.debug(`📊 Cache MISS: ${key} in ${(endTime - startTime).toFixed(2)}ms`)
    
    return null
  }

  /**
   * Set value in cache across appropriate levels
   */
  async set(key, value, policy = CACHE_POLICIES.DYNAMIC) {
    const serializedValue = await this.serializeValue(value, policy)
    const promises = []
    
    for (const level of policy.levels) {
      const cache = this.caches.get(level)
      if (!cache) continue
      
      promises.push(
        cache.set(key, serializedValue, policy).catch(error => {
          logger.warn(`⚠️ Failed to set in ${level} cache:`, error)
        })
      )
    }
    
    await Promise.allSettled(promises)
    this.stats.sets++
    
    logger.debug(`📝 Cache SET: ${key} across ${policy.levels.length} levels`)
  }

  /**
   * Delete value from all cache levels
   */
  async delete(key, policy = CACHE_POLICIES.DYNAMIC) {
    const promises = []
    
    for (const level of policy.levels) {
      const cache = this.caches.get(level)
      if (!cache) continue
      
      promises.push(
        cache.delete(key).catch(error => {
          logger.warn(`⚠️ Failed to delete from ${level} cache:`, error)
        })
      )
    }
    
    await Promise.allSettled(promises)
    this.stats.deletes++
    
    logger.debug(`🗑️ Cache DELETE: ${key}`)
  }

  /**
   * Clear all caches
   */
  async clear() {
    const promises = []
    
    for (const [level, cache] of this.caches) {
      promises.push(
        cache.clear().catch(error => {
          logger.warn(`⚠️ Failed to clear ${level} cache:`, error)
        })
      )
    }
    
    await Promise.allSettled(promises)
    logger.debug('🧹 All caches cleared')
  }

  /**
   * Get cache statistics
   */
  getStats() {
    const totalRequests = this.stats.hits + this.stats.misses
    const hitRate = totalRequests > 0 ? (this.stats.hits / totalRequests * 100).toFixed(2) : 0
    
    return {
      ...this.stats,
      hitRate: `${hitRate}%`,
      totalRequests
    }
  }

  /**
   * Promote value to faster cache levels
   */
  async promoteToFasterCaches(key, value, currentLevel, policy) {
    const currentIndex = policy.levels.indexOf(currentLevel)
    if (currentIndex <= 0) return // Already at fastest level
    
    const fasterLevels = policy.levels.slice(0, currentIndex)
    const promises = []
    
    for (const level of fasterLevels) {
      const cache = this.caches.get(level)
      if (!cache) continue
      
      promises.push(
        cache.set(key, value, policy).catch(error => {
          logger.debug(`Failed to promote to ${level}:`, error)
        })
      )
    }
    
    await Promise.allSettled(promises)
  }

  /**
   * Check if cached value is expired
   */
  isExpired(cachedData, ttl) {
    if (!ttl || ttl === 0) return false
    if (!cachedData.timestamp) return true
    
    return (Date.now() - cachedData.timestamp) > ttl
  }

  /**
   * Serialize value based on policy
   */
  async serializeValue(value, policy) {
    let data = {
      value,
      timestamp: Date.now(),
      policy: policy
    }
    
    // Apply compression
    if (policy.compression) {
      data = await this.compress(data)
    }
    
    // Apply encryption
    if (policy.encryption) {
      data = await this.encrypt(data)
    }
    
    return data
  }

  /**
   * Deserialize value based on policy
   */
  async deserializeValue(cachedData, policy) {
    let data = cachedData
    
    // Apply decryption
    if (policy.encryption && data.encrypted) {
      data = await this.decrypt(data)
    }
    
    // Apply decompression
    if (policy.compression && data.compressed) {
      data = await this.decompress(data)
    }
    
    return data.value
  }

  /**
   * Compress data (placeholder for compression algorithm)
   */
  async compress(data) {
    // In production, use actual compression library
    return {
      ...data,
      compressed: true,
      compressedSize: JSON.stringify(data).length
    }
  }

  /**
   * Decompress data
   */
  async decompress(data) {
    // In production, use actual decompression
    const { compressed, compressedSize, ...originalData } = data
    return originalData
  }

  /**
   * Encrypt data (placeholder for encryption)
   */
  async encrypt(data) {
    // In production, use actual encryption
    return {
      ...data,
      encrypted: true
    }
  }

  /**
   * Decrypt data
   */
  async decrypt(data) {
    // In production, use actual decryption
    const { encrypted, ...originalData } = data
    return originalData
  }
}

// Global cache manager instance
export const cacheManager = new CacheManager()

/**
 * Cache decorator for methods
 */
export function cached(policy = CACHE_POLICIES.DYNAMIC) {
  return function(target, propertyName, descriptor) {
    const originalMethod = descriptor.value
    
    descriptor.value = async function(...args) {
      const cacheKey = `${target.constructor.name}.${propertyName}:${JSON.stringify(args)}`
      
      // Try to get from cache first
      const cachedResult = await cacheManager.get(cacheKey, policy)
      if (cachedResult !== null) {
        return cachedResult
      }
      
      // Execute original method
      const result = await originalMethod.apply(this, args)
      
      // Cache the result
      await cacheManager.set(cacheKey, result, policy)
      
      return result
    }
    
    return descriptor
  }
}

/**
 * Initialize cache system
 */
export async function initializeCacheSystem() {
  await cacheManager.initializeCaches()
  
  // Set up periodic cleanup
  setInterval(() => {
    cacheManager.cleanup?.()
  }, 60000) // Every minute
  
  logger.debug('🚀 Multi-level caching system ready')
}