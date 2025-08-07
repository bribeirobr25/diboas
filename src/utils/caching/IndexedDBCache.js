import logger from '../logger'

/**
 * IndexedDB Cache (L4)
 * Large capacity structured storage for complex data
 */

export class IndexedDBCache {
  constructor(dbName = 'DiBoaSCache', version = 1) {
    this.dbName = dbName
    this.version = version
    this.db = null
    this.storeName = 'cache_store'
  }

  /**
   * Initialize IndexedDB connection
   */
  async initialize() {
    return new Promise((resolve, reject) => {
      // Check if IndexedDB is available
      if (!('indexedDB' in window)) {
        logger.warn('IndexedDB not supported')
        resolve(false)
        return
      }

      const request = indexedDB.open(this.dbName, this.version)

      request.onerror = () => {
        logger.error('Failed to open IndexedDB:', request.error)
        reject(request.error)
      }

      request.onsuccess = () => {
        this.db = request.result
        logger.debug('✅ IndexedDB cache initialized')
        resolve(true)
      }

      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        // Create object store if it doesn't exist
        if (!db.objectStoreNames.contains(this.storeName)) {
          const store = db.createObjectStore(this.storeName, { keyPath: 'key' })
          
          // Create indexes for efficient querying
          store.createIndex('timestamp', 'timestamp', { unique: false })
          store.createIndex('policy', 'policy.type', { unique: false })
          store.createIndex('size', 'size', { unique: false })
        }
      }
    })
  }

  /**
   * Get value from IndexedDB cache
   */
  async get(key) {
    if (!this.db) return null

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.get(key)

      request.onsuccess = () => {
        const result = request.result
        if (result) {
          resolve(result.data)
        } else {
          resolve(null)
        }
      }

      request.onerror = () => {
        logger.warn(`Failed to get ${key} from IndexedDB:`, request.error)
        resolve(null)
      }
    })
  }

  /**
   * Set value in IndexedDB cache
   */
  async set(key, value, policy) {
    if (!this.db) return false

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      
      const dataSize = this.estimateSize(value)
      const entry = {
        key,
        data: value,
        timestamp: Date.now(),
        policy: policy,
        size: dataSize
      }

      const request = store.put(entry)

      request.onsuccess = () => {
        resolve(true)
      }

      request.onerror = () => {
        logger.warn(`Failed to set ${key} in IndexedDB:`, request.error)
        resolve(false)
      }

      transaction.onerror = () => {
        logger.warn('IndexedDB transaction failed:', transaction.error)
        resolve(false)
      }
    })
  }

  /**
   * Delete value from IndexedDB cache
   */
  async delete(key) {
    if (!this.db) return false

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.delete(key)

      request.onsuccess = () => {
        resolve(true)
      }

      request.onerror = () => {
        logger.warn(`Failed to delete ${key} from IndexedDB:`, request.error)
        resolve(false)
      }
    })
  }

  /**
   * Clear all cached values
   */
  async clear() {
    if (!this.db) return false

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const request = store.clear()

      request.onsuccess = () => {
        logger.debug('IndexedDB cache cleared')
        resolve(true)
      }

      request.onerror = () => {
        logger.warn('Failed to clear IndexedDB cache:', request.error)
        resolve(false)
      }
    })
  }

  /**
   * Get all keys from cache
   */
  async getAllKeys() {
    if (!this.db) return []

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const request = store.getAllKeys()

      request.onsuccess = () => {
        resolve(request.result)
      }

      request.onerror = () => {
        logger.warn('Failed to get keys from IndexedDB:', request.error)
        resolve([])
      }
    })
  }

  /**
   * Get cache statistics
   */
  async getStats() {
    if (!this.db) return { error: 'Database not initialized' }

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readonly')
      const store = transaction.objectStore(this.storeName)
      const countRequest = store.count()

      countRequest.onsuccess = () => {
        const count = countRequest.result
        
        // Get all entries to calculate total size
        const getAllRequest = store.getAll()
        
        getAllRequest.onsuccess = () => {
          const entries = getAllRequest.result
          const totalSize = entries.reduce((sum, entry) => sum + (entry.size || 0), 0)
          const averageSize = count > 0 ? Math.round(totalSize / count) : 0
          
          // Group by policy type
          const policyGroups = {}
          entries.forEach(entry => {
            const policyType = entry.policy?.constructor?.name || 'unknown'
            policyGroups[policyType] = (policyGroups[policyType] || 0) + 1
          })

          resolve({
            entryCount: count,
            totalSize,
            averageSize,
            policyDistribution: policyGroups,
            oldestEntry: entries.length > 0 
              ? Math.min(...entries.map(e => e.timestamp))
              : null,
            newestEntry: entries.length > 0 
              ? Math.max(...entries.map(e => e.timestamp))
              : null
          })
        }

        getAllRequest.onerror = () => {
          resolve({
            entryCount: count,
            error: 'Failed to get detailed stats'
          })
        }
      }

      countRequest.onerror = () => {
        resolve({ error: 'Failed to get cache stats' })
      }
    })
  }

  /**
   * Cleanup expired entries
   */
  async cleanup() {
    if (!this.db) return

    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([this.storeName], 'readwrite')
      const store = transaction.objectStore(this.storeName)
      const getAllRequest = store.getAll()

      getAllRequest.onsuccess = () => {
        const entries = getAllRequest.result
        const now = Date.now()
        let removedCount = 0

        entries.forEach(entry => {
          const { key, timestamp, policy } = entry
          
          if (policy && policy.ttl && (now - timestamp) > policy.ttl) {
            store.delete(key)
            removedCount++
          }
        })

        transaction.oncomplete = () => {
          if (removedCount > 0) {
            logger.debug(`Cleaned up ${removedCount} expired IndexedDB cache entries`)
          }
          resolve(removedCount)
        }
      }

      getAllRequest.onerror = () => {
        logger.warn('Failed to cleanup IndexedDB cache:', getAllRequest.error)
        resolve(0)
      }
    })
  }

  /**
   * Estimate size of data in bytes
   */
  estimateSize(data) {
    try {
      return JSON.stringify(data).length * 2 // Rough estimate (UTF-16)
    } catch (error) {
      return 1000 // Fallback estimate
    }
  }

  /**
   * Close database connection
   */
  close() {
    if (this.db) {
      this.db.close()
      this.db = null
    }
  }
}