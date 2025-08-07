import logger from '../logger'

/**
 * Storage Cache (L2/L3)
 * Uses localStorage or sessionStorage for persistent caching
 */

export class StorageCache {
  constructor(storageType = 'local') {
    this.storage = storageType === 'session' ? sessionStorage : localStorage
    this.prefix = `diboas_cache_${storageType}_`
    this.metadataKey = `${this.prefix}metadata`
    this.maxSize = storageType === 'session' ? 500 : 1000
    
    this.loadMetadata()
  }

  /**
   * Load cache metadata
   */
  loadMetadata() {
    try {
      const metadataStr = this.storage.getItem(this.metadataKey)
      this.metadata = metadataStr ? JSON.parse(metadataStr) : {
        keys: [],
        sizes: {},
        totalSize: 0
      }
    } catch (error) {
      logger.warn('Failed to load cache metadata:', error)
      this.metadata = { keys: [], sizes: {}, totalSize: 0 }
    }
  }

  /**
   * Save cache metadata
   */
  saveMetadata() {
    try {
      this.storage.setItem(this.metadataKey, JSON.stringify(this.metadata))
    } catch (error) {
      logger.warn('Failed to save cache metadata:', error)
    }
  }

  /**
   * Get value from storage cache
   */
  async get(key) {
    try {
      const fullKey = this.prefix + key
      const valueStr = this.storage.getItem(fullKey)
      
      if (valueStr === null) {
        return null
      }

      return JSON.parse(valueStr)
    } catch (error) {
      logger.warn(`Failed to get ${key} from storage cache:`, error)
      return null
    }
  }

  /**
   * Set value in storage cache
   */
  async set(key, value, policy) {
    try {
      const fullKey = this.prefix + key
      const valueStr = JSON.stringify(value)
      const size = valueStr.length

      // Check storage quota
      if (!this.hasSpace(size, key)) {
        await this.evictOldestEntries(size)
      }

      // Store the value
      this.storage.setItem(fullKey, valueStr)
      
      // Update metadata
      if (!this.metadata.keys.includes(key)) {
        this.metadata.keys.push(key)
      }
      
      const oldSize = this.metadata.sizes[key] || 0
      this.metadata.sizes[key] = size
      this.metadata.totalSize = this.metadata.totalSize - oldSize + size
      
      this.saveMetadata()
      return true

    } catch (error) {
      if (error.name === 'QuotaExceededError') {
        logger.warn('Storage quota exceeded, attempting cleanup')
        await this.emergencyCleanup()
        // Try once more after cleanup
        try {
          this.storage.setItem(this.prefix + key, JSON.stringify(value))
          return true
        } catch (retryError) {
          logger.error('Failed to store even after cleanup:', retryError)
          return false
        }
      }
      logger.warn(`Failed to set ${key} in storage cache:`, error)
      return false
    }
  }

  /**
   * Delete value from storage cache
   */
  async delete(key) {
    try {
      const fullKey = this.prefix + key
      this.storage.removeItem(fullKey)
      
      // Update metadata
      const keyIndex = this.metadata.keys.indexOf(key)
      if (keyIndex > -1) {
        this.metadata.keys.splice(keyIndex, 1)
        const size = this.metadata.sizes[key] || 0
        this.metadata.totalSize -= size
        delete this.metadata.sizes[key]
        this.saveMetadata()
      }
      
      return true
    } catch (error) {
      logger.warn(`Failed to delete ${key} from storage cache:`, error)
      return false
    }
  }

  /**
   * Clear all cached values
   */
  async clear() {
    try {
      // Remove all cache entries
      for (const key of this.metadata.keys) {
        this.storage.removeItem(this.prefix + key)
      }
      
      // Clear metadata
      this.storage.removeItem(this.metadataKey)
      this.metadata = { keys: [], sizes: {}, totalSize: 0 }
      
      return true
    } catch (error) {
      logger.warn('Failed to clear storage cache:', error)
      return false
    }
  }

  /**
   * Check if there's enough space for new entry
   */
  hasSpace(size, existingKey = null) {
    const existingSize = existingKey ? (this.metadata.sizes[existingKey] || 0) : 0
    const netSize = size - existingSize
    const projectedSize = this.metadata.totalSize + netSize
    
    // Rough estimate: assume 5MB total storage limit per origin
    const maxStorageSize = 5 * 1024 * 1024 // 5MB
    
    return projectedSize < maxStorageSize * 0.8 // Use 80% of estimated limit
  }

  /**
   * Evict oldest entries to make space
   */
  async evictOldestEntries(neededSize) {
    let freedSpace = 0
    const keysToRemove = []
    
    // Simple FIFO eviction - remove oldest entries first
    for (let i = 0; i < this.metadata.keys.length && freedSpace < neededSize; i++) {
      const key = this.metadata.keys[i]
      const size = this.metadata.sizes[key] || 0
      keysToRemove.push(key)
      freedSpace += size
    }
    
    // Remove the selected keys
    for (const key of keysToRemove) {
      await this.delete(key)
    }
    
    logger.debug(`Evicted ${keysToRemove.length} entries, freed ${freedSpace} bytes`)
  }

  /**
   * Emergency cleanup when quota is exceeded
   */
  async emergencyCleanup() {
    // Remove half of all entries
    const keysToRemove = this.metadata.keys.slice(0, Math.ceil(this.metadata.keys.length / 2))
    
    for (const key of keysToRemove) {
      await this.delete(key)
    }
    
    logger.debug(`Emergency cleanup: removed ${keysToRemove.length} entries`)
  }

  /**
   * Get storage statistics
   */
  getStats() {
    return {
      entryCount: this.metadata.keys.length,
      totalSize: this.metadata.totalSize,
      averageSize: this.metadata.keys.length > 0 
        ? Math.round(this.metadata.totalSize / this.metadata.keys.length)
        : 0,
      storageType: this.storage === sessionStorage ? 'session' : 'local',
      keys: this.metadata.keys.slice(0, 10) // Show first 10 keys
    }
  }

  /**
   * Cleanup expired entries (called periodically)
   */
  cleanup() {
    // Check each entry for expiration
    const now = Date.now()
    const keysToRemove = []
    
    for (const key of this.metadata.keys) {
      try {
        const value = this.storage.getItem(this.prefix + key)
        if (value) {
          const parsed = JSON.parse(value)
          if (parsed.timestamp && parsed.policy && parsed.policy.ttl) {
            if (now - parsed.timestamp > parsed.policy.ttl) {
              keysToRemove.push(key)
            }
          }
        }
      } catch (error) {
        // If we can't parse the entry, remove it
        keysToRemove.push(key)
      }
    }
    
    // Remove expired entries
    keysToRemove.forEach(key => this.delete(key))
    
    if (keysToRemove.length > 0) {
      logger.debug(`Cleaned up ${keysToRemove.length} expired storage cache entries`)
    }
  }
}