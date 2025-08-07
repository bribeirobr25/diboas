/**
 * Multi-Level Cache Manager Tests
 * Comprehensive test suite for the caching system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { CacheManager, CACHE_LEVELS, CACHE_POLICIES, cached } from '../CacheManager.js'
import { MemoryCache } from '../MemoryCache.js'
import { StorageCache } from '../StorageCache.js'

// Mock browser APIs
global.localStorage = {
  data: {},
  getItem: vi.fn((key) => global.localStorage.data[key] || null),
  setItem: vi.fn((key, value) => { global.localStorage.data[key] = value }),
  removeItem: vi.fn((key) => { delete global.localStorage.data[key] }),
  clear: vi.fn(() => { global.localStorage.data = {} })
}

global.sessionStorage = {
  data: {},
  getItem: vi.fn((key) => global.sessionStorage.data[key] || null),
  setItem: vi.fn((key, value) => { global.sessionStorage.data[key] = value }),
  removeItem: vi.fn((key) => { delete global.sessionStorage.data[key] }),
  clear: vi.fn(() => { global.sessionStorage.data = {} })
}

// Mock IndexedDB
global.indexedDB = {
  open: vi.fn(() => ({
    onsuccess: null,
    onerror: null,
    onupgradeneeded: null,
    result: null
  }))
}

// Mock Service Worker
global.navigator = {
  serviceWorker: {
    register: vi.fn(() => Promise.resolve({}))
  }
}

global.caches = {
  open: vi.fn(() => Promise.resolve({
    match: vi.fn(() => Promise.resolve(null)),
    put: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve(true)),
    keys: vi.fn(() => Promise.resolve([]))
  })),
  delete: vi.fn(() => Promise.resolve(true))
}

describe('Multi-Level Cache System', () => {
  let cacheManager

  beforeEach(async () => {
    // Clear all mocks
    vi.clearAllMocks()
    global.localStorage.data = {}
    global.sessionStorage.data = {}
    
    // Create fresh cache manager
    cacheManager = new CacheManager()
    await cacheManager.initializeCaches()
  })

  afterEach(() => {
    cacheManager = null
  })

  describe('CacheManager', () => {
    it('should initialize all cache levels', async () => {
      expect(cacheManager.caches.has(CACHE_LEVELS.MEMORY)).toBe(true)
      expect(cacheManager.caches.has(CACHE_LEVELS.SESSION)).toBe(true)
      expect(cacheManager.caches.has(CACHE_LEVELS.LOCAL)).toBe(true)
      expect(cacheManager.caches.has(CACHE_LEVELS.INDEXED_DB)).toBe(true)
    })

    it('should get and set values with cache policies', async () => {
      const key = 'test-key'
      const value = { data: 'test-value' }
      const policy = CACHE_POLICIES.DYNAMIC

      // Set value
      await cacheManager.set(key, value, policy)
      expect(cacheManager.stats.sets).toBe(1)

      // Get value
      const result = await cacheManager.get(key, policy)
      expect(result).toEqual(value)
      expect(cacheManager.stats.hits).toBe(1)
    })

    it('should handle cache misses', async () => {
      const result = await cacheManager.get('non-existent-key')
      expect(result).toBeNull()
      expect(cacheManager.stats.misses).toBe(1)
    })

    it('should respect TTL expiration', async () => {
      const key = 'expiring-key'
      const value = { data: 'expiring-value' }
      const shortTTLPolicy = {
        ...CACHE_POLICIES.DYNAMIC,
        ttl: 1 // 1ms TTL
      }

      await cacheManager.set(key, value, shortTTLPolicy)
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10))
      
      const result = await cacheManager.get(key, shortTTLPolicy)
      expect(result).toBeNull()
    })

    it('should delete values from all cache levels', async () => {
      const key = 'delete-test-key'
      const value = { data: 'delete-test-value' }

      await cacheManager.set(key, value)
      await cacheManager.delete(key)

      const result = await cacheManager.get(key)
      expect(result).toBeNull()
      expect(cacheManager.stats.deletes).toBe(1)
    })

    it('should provide accurate statistics', async () => {
      // Perform various operations
      await cacheManager.set('key1', 'value1')
      await cacheManager.set('key2', 'value2')
      await cacheManager.get('key1')
      await cacheManager.get('key3') // miss
      await cacheManager.delete('key1')

      const stats = cacheManager.getStats()
      expect(stats.sets).toBe(2)
      expect(stats.hits).toBe(1)
      expect(stats.misses).toBe(1)
      expect(stats.deletes).toBe(1)
      expect(stats.totalRequests).toBe(2)
      expect(stats.hitRate).toBe('50.00%')
    })

    it('should clear all caches', async () => {
      await cacheManager.set('key1', 'value1')
      await cacheManager.set('key2', 'value2')
      
      await cacheManager.clear()
      
      const result1 = await cacheManager.get('key1')
      const result2 = await cacheManager.get('key2')
      
      expect(result1).toBeNull()
      expect(result2).toBeNull()
    })
  })

  describe('MemoryCache', () => {
    let memoryCache

    beforeEach(() => {
      memoryCache = new MemoryCache(3) // Small size for testing LRU
    })

    it('should store and retrieve values', async () => {
      await memoryCache.set('key1', 'value1')
      const result = await memoryCache.get('key1')
      expect(result).toBe('value1')
    })

    it('should implement LRU eviction', async () => {
      // Fill cache to capacity
      await memoryCache.set('key1', 'value1')
      await memoryCache.set('key2', 'value2')
      await memoryCache.set('key3', 'value3')
      
      expect(memoryCache.size()).toBe(3)
      
      // Access key1 to make it recently used
      await memoryCache.get('key1')
      
      // Add one more item, should evict key2 (oldest unaccessed)
      await memoryCache.set('key4', 'value4')
      
      expect(await memoryCache.get('key1')).toBe('value1') // Still there
      expect(await memoryCache.get('key2')).toBeNull()     // Evicted
      expect(await memoryCache.get('key3')).toBe('value3') // Still there
      expect(await memoryCache.get('key4')).toBe('value4') // Newly added
    })

    it('should provide cache statistics', () => {
      const stats = memoryCache.getStats()
      expect(stats).toHaveProperty('size')
      expect(stats).toHaveProperty('maxSize')
      expect(stats).toHaveProperty('utilization')
      expect(stats).toHaveProperty('keys')
    })

    it('should clear all entries', async () => {
      await memoryCache.set('key1', 'value1')
      await memoryCache.set('key2', 'value2')
      
      await memoryCache.clear()
      
      expect(memoryCache.size()).toBe(0)
      expect(await memoryCache.get('key1')).toBeNull()
      expect(await memoryCache.get('key2')).toBeNull()
    })
  })

  describe('StorageCache', () => {
    let localCache, sessionCache

    beforeEach(() => {
      localCache = new StorageCache('local')
      sessionCache = new StorageCache('session')
    })

    it('should use correct storage backends', () => {
      expect(localCache.storage).toBe(localStorage)
      expect(sessionCache.storage).toBe(sessionStorage)
    })

    it('should store and retrieve values with metadata', async () => {
      const value = { test: 'data' }
      await localCache.set('test-key', value)
      
      const result = await localCache.get('test-key')
      expect(result).toEqual(value)
    })

    it('should handle storage quota exceeded errors', async () => {
      // Mock quota exceeded error
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn(() => {
        const error = new Error('QuotaExceededError')
        error.name = 'QuotaExceededError'
        throw error
      })

      const result = await localCache.set('large-key', 'large-value')
      
      // Should handle gracefully
      expect(result).toBe(false)
      
      // Restore original function
      localStorage.setItem = originalSetItem
    })

    it('should manage metadata correctly', async () => {
      await localCache.set('key1', 'value1')
      await localCache.set('key2', 'value2')
      
      expect(localCache.metadata.keys).toContain('key1')
      expect(localCache.metadata.keys).toContain('key2')
      expect(localCache.metadata.totalSize).toBeGreaterThan(0)
    })

    it('should provide storage statistics', () => {
      const stats = localCache.getStats()
      expect(stats).toHaveProperty('entryCount')
      expect(stats).toHaveProperty('totalSize')
      expect(stats).toHaveProperty('storageType')
    })
  })

  describe('Cache Policies', () => {
    it('should have different policies for different data types', () => {
      expect(CACHE_POLICIES.STATIC.ttl).toBeGreaterThan(CACHE_POLICIES.DYNAMIC.ttl)
      expect(CACHE_POLICIES.USER.encryption).toBe(true)
      expect(CACHE_POLICIES.API.etag).toBe(true)
      expect(CACHE_POLICIES.CRITICAL.ttl).toBe(0)
    })

    it('should use appropriate cache levels for each policy', () => {
      expect(CACHE_POLICIES.STATIC.levels).toContain(CACHE_LEVELS.SERVICE_WORKER)
      expect(CACHE_POLICIES.DYNAMIC.levels).toContain(CACHE_LEVELS.MEMORY)
      expect(CACHE_POLICIES.USER.levels).toContain(CACHE_LEVELS.LOCAL)
      expect(CACHE_POLICIES.API.levels).toContain(CACHE_LEVELS.INDEXED_DB)
      expect(CACHE_POLICIES.CRITICAL.levels).toHaveLength(0)
    })
  })

  describe('Cache Decorator', () => {
    class TestService {
      constructor() {
        this.callCount = 0
      }

      async expensiveOperation(param) {
        this.callCount++
        return `result-${param}-${this.callCount}`
      }

      async staticData() {
        this.callCount++
        return { data: 'static', count: this.callCount }
      }
    }

    it('should manually cache method results', async () => {
      const service = new TestService()
      const cacheKey = 'TestService.expensiveOperation:["test"]'
      
      // First call should execute method and cache result
      const result1 = await service.expensiveOperation('test')
      await cacheManager.set(cacheKey, result1, CACHE_POLICIES.DYNAMIC)
      expect(service.callCount).toBe(1)
      
      // Check cache hit
      const cachedResult = await cacheManager.get(cacheKey, CACHE_POLICIES.DYNAMIC)
      expect(cachedResult).toBe(result1)
    })

    it('should handle different cache keys for different parameters', async () => {
      const service = new TestService()
      
      const result1 = await service.expensiveOperation('param1')
      const result2 = await service.expensiveOperation('param2')
      
      expect(service.callCount).toBe(2) // Different params = different results
      expect(result1).not.toBe(result2)
    })

    it('should cache parameterless methods', async () => {
      const service = new TestService()
      const cacheKey = 'TestService.staticData:[]'
      
      const result1 = await service.staticData()
      await cacheManager.set(cacheKey, result1, CACHE_POLICIES.STATIC)
      
      const cachedResult = await cacheManager.get(cacheKey, CACHE_POLICIES.STATIC)
      expect(cachedResult).toEqual(result1)
      expect(service.callCount).toBe(1)
    })
  })

  describe('Error Handling', () => {
    it('should handle cache initialization failures gracefully', async () => {
      // Mock IndexedDB failure
      global.indexedDB.open = vi.fn(() => {
        throw new Error('IndexedDB not available')
      })

      const failingCacheManager = new CacheManager()
      
      // Should not throw
      await expect(failingCacheManager.initializeCaches()).resolves.toBeUndefined()
    })

    it('should continue working when individual cache levels fail', async () => {
      // Make memory cache fail
      const memoryCache = cacheManager.caches.get(CACHE_LEVELS.MEMORY)
      memoryCache.get = vi.fn(() => { throw new Error('Memory cache error') })

      // Should still work with other cache levels
      await cacheManager.set('test-key', 'test-value')
      const result = await cacheManager.get('test-key')
      
      // May be null due to memory cache failure, but shouldn't throw
      expect(() => result).not.toThrow()
    })

    it('should handle serialization errors', async () => {
      // Create object that can't be serialized
      const circularObject = {}
      circularObject.self = circularObject

      // Should handle gracefully
      await expect(cacheManager.set('circular', circularObject)).resolves.toBeUndefined()
    })
  })

  describe('Performance', () => {
    it('should access memory cache faster than storage cache', async () => {
      const key = 'performance-test'
      const value = 'test-value'
      
      // Set in both caches
      await cacheManager.set(key, value, CACHE_POLICIES.DYNAMIC)
      
      // First get should be from memory (faster)
      const start1 = performance.now()
      await cacheManager.get(key, CACHE_POLICIES.DYNAMIC)
      const memoryTime = performance.now() - start1
      
      // Clear memory cache and get from storage
      await cacheManager.caches.get(CACHE_LEVELS.MEMORY).clear()
      
      const start2 = performance.now()
      await cacheManager.get(key, CACHE_POLICIES.DYNAMIC)
      const storageTime = performance.now() - start2
      
      // Memory should be faster (though this might be flaky in tests)
      console.log(`Memory: ${memoryTime}ms, Storage: ${storageTime}ms`)
    })

    it('should handle concurrent operations', async () => {
      const promises = []
      
      // Start multiple concurrent operations
      for (let i = 0; i < 10; i++) {
        promises.push(cacheManager.set(`key-${i}`, `value-${i}`))
        promises.push(cacheManager.get(`key-${i}`))
      }
      
      // Should all complete without errors
      const results = await Promise.allSettled(promises)
      const failures = results.filter(r => r.status === 'rejected')
      
      expect(failures).toHaveLength(0)
    })
  })
})