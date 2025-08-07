/**
 * Modern Storage Utility
 * Standardized localStorage patterns with error handling, validation, and migration support
 */

import logger from './logger'
import { useErrorHandler } from '../hooks/useErrorHandler.jsx'

/**
 * Storage namespace for key prefixing
 */
const STORAGE_PREFIX = 'diboas_'
const STORAGE_VERSION = '1.0'

/**
 * Storage error types
 */
export const STORAGE_ERRORS = {
  QUOTA_EXCEEDED: 'QuotaExceededError',
  SECURITY_ERROR: 'SecurityError',
  INVALID_DATA: 'InvalidDataError',
  MIGRATION_ERROR: 'MigrationError'
}

/**
 * Storage configuration
 */
const DEFAULT_CONFIG = {
  compression: false,
  encryption: false,
  expiration: null,
  versioning: true,
  migration: true
}

/**
 * Modern Storage Manager with comprehensive error handling and features
 */
class ModernStorageManager {
  constructor(config = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config }
    this.errorHandler = null
    this.initializeErrorHandler()
  }

  /**
   * Initialize error handler for storage operations
   */
  initializeErrorHandler() {
    try {
      const { useErrorHandler } = require('../hooks/useErrorHandler.jsx')
      this.errorHandler = useErrorHandler({
        logErrors: true,
        autoRecovery: true,
        notifyUser: false // Storage errors should be silent to users
      })
    } catch (error) {
      logger.debug('Error handler not available, using fallback logging')
    }
  }

  /**
   * Generate versioned storage key
   * @param {string} key - Base key
   * @param {string} userId - Optional user ID for namespacing
   * @returns {string} Prefixed and versioned key
   */
  generateKey(key, userId = null) {
    const baseKey = `${STORAGE_PREFIX}${key}`
    const userKey = userId ? `${baseKey}_${userId}` : baseKey
    return this.config.versioning ? `${userKey}_v${STORAGE_VERSION}` : userKey
  }

  /**
   * Safely get item from localStorage with error handling
   * @param {string} key - Storage key
   * @param {*} defaultValue - Default value if key doesn't exist
   * @param {object} options - Storage options
   * @returns {*} Stored value or default value
   */
  async getItem(key, defaultValue = null, options = {}) {
    const storageKey = this.generateKey(key, options.userId)
    
    const safeGet = this.errorHandler?.createSafeWrapper || this.createFallbackWrapper()
    
    return await safeGet(
      () => {
        const stored = localStorage.getItem(storageKey)
        if (!stored) {
          return defaultValue
        }

        const parsed = this.parseStoredValue(stored)
        
        // Check expiration
        if (parsed.expiry && Date.now() > parsed.expiry) {
          this.removeItem(key, options)
          return defaultValue
        }

        return parsed.data
      },
      {
        context: { action: 'storage_get', key: storageKey },
        fallback: defaultValue
      }
    )
  }

  /**
   * Safely set item in localStorage with error handling
   * @param {string} key - Storage key
   * @param {*} value - Value to store
   * @param {object} options - Storage options
   * @returns {boolean} Success status
   */
  async setItem(key, value, options = {}) {
    const storageKey = this.generateKey(key, options.userId)
    const safeSet = this.errorHandler?.createSafeWrapper || this.createFallbackWrapper()
    
    return await safeSet(
      () => {
        const storageData = this.prepareStorageValue(value, options)
        const serialized = JSON.stringify(storageData)
        
        // Check storage size before setting
        if (this.wouldExceedQuota(serialized)) {
          this.handleQuotaExceeded()
          return false
        }

        localStorage.setItem(storageKey, serialized)
        
        logger.debug(`Storage: Set ${storageKey} (${serialized.length} bytes)`)
        return true
      },
      {
        context: { action: 'storage_set', key: storageKey, size: JSON.stringify(value).length },
        fallback: false
      }
    )
  }

  /**
   * Safely remove item from localStorage
   * @param {string} key - Storage key
   * @param {object} options - Storage options
   * @returns {boolean} Success status
   */
  async removeItem(key, options = {}) {
    const storageKey = this.generateKey(key, options.userId)
    const safeRemove = this.errorHandler?.createSafeWrapper || this.createFallbackWrapper()
    
    return await safeRemove(
      () => {
        localStorage.removeItem(storageKey)
        logger.debug(`Storage: Removed ${storageKey}`)
        return true
      },
      {
        context: { action: 'storage_remove', key: storageKey },
        fallback: false
      }
    )
  }

  /**
   * Clear all items with specific prefix
   * @param {string} prefix - Key prefix to clear
   * @param {string} userId - Optional user ID
   * @returns {number} Number of items cleared
   */
  async clearByPrefix(prefix, userId = null) {
    const searchPrefix = this.generateKey(prefix, userId).replace(`_v${STORAGE_VERSION}`, '')
    let cleared = 0

    const safeClear = this.errorHandler?.createSafeWrapper || this.createFallbackWrapper()
    
    return await safeClear(
      () => {
        const keys = Object.keys(localStorage).filter(key => key.startsWith(searchPrefix))
        keys.forEach(key => {
          localStorage.removeItem(key)
          cleared++
        })
        
        logger.debug(`Storage: Cleared ${cleared} items with prefix ${searchPrefix}`)
        return cleared
      },
      {
        context: { action: 'storage_clear_prefix', prefix: searchPrefix },
        fallback: 0
      }
    )
  }

  /**
   * Get storage usage statistics
   * @returns {object} Storage usage info
   */
  getStorageStats() {
    try {
      const totalSize = new Blob(Object.values(localStorage)).size
      const itemCount = Object.keys(localStorage).length
      const diboasItems = Object.keys(localStorage).filter(key => key.startsWith(STORAGE_PREFIX)).length
      
      return {
        totalSize,
        itemCount,
        diboasItems,
        quota: this.getStorageQuota(),
        usage: totalSize / this.getStorageQuota()
      }
    } catch (error) {
      logger.error('Failed to get storage stats:', error)
      return { totalSize: 0, itemCount: 0, diboasItems: 0, quota: 0, usage: 0 }
    }
  }

  /**
   * Migrate old storage format to new format
   * @param {Array} migrations - Array of migration functions
   * @returns {boolean} Migration success
   */
  async runMigrations(migrations = []) {
    const safeMigrate = this.errorHandler?.createSafeWrapper || this.createFallbackWrapper()
    
    return await safeMigrate(
      () => {
        const migrationKey = this.generateKey('migrations_completed')
        const completed = JSON.parse(localStorage.getItem(migrationKey) || '[]')
        
        let migrationCount = 0
        migrations.forEach((migration, index) => {
          if (!completed.includes(index)) {
            try {
              migration()
              completed.push(index)
              migrationCount++
            } catch (error) {
              logger.error(`Migration ${index} failed:`, error)
              throw error
            }
          }
        })
        
        localStorage.setItem(migrationKey, JSON.stringify(completed))
        
        if (migrationCount > 0) {
          logger.info(`Storage: Completed ${migrationCount} migrations`)
        }
        
        return true
      },
      {
        context: { action: 'storage_migration' },
        fallback: false
      }
    )
  }

  /**
   * Prepare value for storage with metadata
   * @param {*} value - Value to store
   * @param {object} options - Storage options
   * @returns {object} Prepared storage object
   */
  prepareStorageValue(value, options = {}) {
    const storageData = {
      data: value,
      timestamp: Date.now(),
      version: STORAGE_VERSION
    }

    // Add expiration if specified
    if (options.ttl) {
      storageData.expiry = Date.now() + options.ttl
    }

    // Add type information for validation
    storageData.type = typeof value
    
    return storageData
  }

  /**
   * Parse stored value and validate structure
   * @param {string} stored - Stored JSON string
   * @returns {object} Parsed storage object
   */
  parseStoredValue(stored) {
    try {
      const parsed = JSON.parse(stored)
      
      // Handle legacy format (direct values without metadata)
      if (typeof parsed !== 'object' || !parsed.hasOwnProperty('data')) {
        return { data: parsed, timestamp: null, version: null }
      }
      
      return parsed
    } catch (error) {
      logger.error('Failed to parse stored value:', error)
      throw new Error(STORAGE_ERRORS.INVALID_DATA)
    }
  }

  /**
   * Check if setting a value would exceed storage quota
   * @param {string} serialized - Serialized data
   * @returns {boolean} Would exceed quota
   */
  wouldExceedQuota(serialized) {
    try {
      const currentSize = new Blob(Object.values(localStorage)).size
      const newSize = new Blob([serialized]).size
      const quota = this.getStorageQuota()
      
      return (currentSize + newSize) > (quota * 0.9) // 90% threshold
    } catch (error) {
      return false // If we can't determine, allow the attempt
    }
  }

  /**
   * Handle storage quota exceeded by clearing old items
   */
  handleQuotaExceeded() {
    logger.warn('Storage quota nearly exceeded, attempting cleanup')
    
    try {
      // Get all diBoaS items with timestamps
      const diboasItems = Object.keys(localStorage)
        .filter(key => key.startsWith(STORAGE_PREFIX))
        .map(key => {
          try {
            const parsed = this.parseStoredValue(localStorage.getItem(key))
            return { key, timestamp: parsed.timestamp || 0 }
          } catch (error) {
            return { key, timestamp: 0 }
          }
        })
        .sort((a, b) => a.timestamp - b.timestamp)
      
      // Remove oldest 25% of items
      const toRemove = Math.ceil(diboasItems.length * 0.25)
      const removed = diboasItems.slice(0, toRemove)
      
      removed.forEach(item => {
        localStorage.removeItem(item.key)
      })
      
      logger.info(`Storage cleanup: Removed ${removed.length} oldest items`)
    } catch (error) {
      logger.error('Storage cleanup failed:', error)
    }
  }

  /**
   * Get estimated localStorage quota
   * @returns {number} Quota in bytes
   */
  getStorageQuota() {
    // Most browsers have 5-10MB limit, use conservative estimate
    return 5 * 1024 * 1024 // 5MB
  }

  /**
   * Create fallback wrapper when error handler is not available
   * @returns {Function} Fallback wrapper function
   */
  createFallbackWrapper() {
    return (fn, options = {}) => {
      try {
        return fn()
      } catch (error) {
        logger.error(`Storage operation failed: ${error.message}`, {
          context: options.context,
          error: error.name
        })
        return options.fallback
      }
    }
  }
}

// Create singleton instance
export const modernStorage = new ModernStorageManager()

/**
 * Convenience functions for common storage operations
 */
export const storage = {
  // User settings
  async getUserSettings(userId) {
    return await modernStorage.getItem('user_settings', {}, { userId })
  },

  async setUserSettings(userId, settings) {
    return await modernStorage.setItem('user_settings', settings, { userId })
  },

  // Recent addresses
  async getRecentAddresses(userId) {
    return await modernStorage.getItem('recent_addresses', [], { userId })
  },

  async setRecentAddresses(userId, addresses) {
    return await modernStorage.setItem('recent_addresses', addresses, { userId })
  },

  // Cache with TTL
  async getCacheItem(key, defaultValue = null, ttl = 3600000) { // 1 hour default
    return await modernStorage.getItem(`cache_${key}`, defaultValue, { ttl })
  },

  async setCacheItem(key, value, ttl = 3600000) {
    return await modernStorage.setItem(`cache_${key}`, value, { ttl })
  },

  // Session data (cleared on tab close)
  async getSessionItem(key, defaultValue = null) {
    return await modernStorage.getItem(`session_${key}`, defaultValue)
  },

  async setSessionItem(key, value) {
    return await modernStorage.setItem(`session_${key}`, value, { ttl: 86400000 }) // 24 hours
  },

  // Clear user data
  async clearUserData(userId) {
    await modernStorage.clearByPrefix('user_settings', userId)
    await modernStorage.clearByPrefix('recent_addresses', userId)
    return true
  }
}

/**
 * Migration utilities for updating storage format
 */
export const storageMigrations = [
  // Migration 0: Update user settings format
  () => {
    const oldKey = 'diboas_user_settings'
    const newKey = modernStorage.generateKey('user_settings')
    
    const oldData = localStorage.getItem(oldKey)
    if (oldData) {
      const parsed = JSON.parse(oldData)
      const prepared = modernStorage.prepareStorageValue(parsed)
      localStorage.setItem(newKey, JSON.stringify(prepared))
      localStorage.removeItem(oldKey)
    }
  },
  
  // Migration 1: Update recent addresses format
  () => {
    const oldKey = 'diboas_recent_wallet_addresses'
    const newKey = modernStorage.generateKey('recent_addresses')
    
    const oldData = localStorage.getItem(oldKey)
    if (oldData) {
      const parsed = JSON.parse(oldData)
      const prepared = modernStorage.prepareStorageValue(parsed)
      localStorage.setItem(newKey, JSON.stringify(prepared))
      localStorage.removeItem(oldKey)
    }
  }
]

/**
 * Initialize modern storage with migrations
 */
export const initializeModernStorage = async () => {
  await modernStorage.runMigrations(storageMigrations)
  logger.info('Modern storage initialized')
  return modernStorage.getStorageStats()
}

export default modernStorage