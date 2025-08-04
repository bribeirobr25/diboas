/**
 * Memory Cache (L1)
 * Fastest cache level using JavaScript Map with LRU eviction
 */

export class MemoryCache {
  constructor(maxSize = 1000) {
    this.cache = new Map()
    this.maxSize = maxSize
    this.accessOrder = new Map() // Track access order for LRU
  }

  /**
   * Get value from memory cache
   */
  async get(key) {
    if (this.cache.has(key)) {
      // Update access order for LRU
      this.updateAccessOrder(key)
      return this.cache.get(key)
    }
    return null
  }

  /**
   * Set value in memory cache
   */
  async set(key, value, policy) {
    // Check size limits
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictLRU()
    }

    this.cache.set(key, value)
    this.updateAccessOrder(key)
    
    return true
  }

  /**
   * Delete value from memory cache
   */
  async delete(key) {
    this.accessOrder.delete(key)
    return this.cache.delete(key)
  }

  /**
   * Clear all cached values
   */
  async clear() {
    this.cache.clear()
    this.accessOrder.clear()
  }

  /**
   * Get cache size
   */
  size() {
    return this.cache.size
  }

  /**
   * Update access order for LRU tracking
   */
  updateAccessOrder(key) {
    // Remove and re-add to maintain order
    this.accessOrder.delete(key)
    this.accessOrder.set(key, Date.now())
  }

  /**
   * Evict least recently used item
   */
  evictLRU() {
    if (this.accessOrder.size === 0) return

    // Find the oldest accessed item
    let oldestKey = null
    let oldestTime = Infinity

    for (const [key, time] of this.accessOrder) {
      if (time < oldestTime) {
        oldestTime = time
        oldestKey = key
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey)
      this.accessOrder.delete(oldestKey)
    }
  }

  /**
   * Get memory usage statistics
   */
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilization: ((this.cache.size / this.maxSize) * 100).toFixed(2) + '%',
      keys: Array.from(this.cache.keys())
    }
  }

  /**
   * Cleanup expired entries
   */
  cleanup() {
    // Memory cache relies on TTL validation in CacheManager
    // This method can be used for additional cleanup logic
  }
}