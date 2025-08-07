/**
 * Storage Initializer
 * Handles migration from legacy localStorage patterns to modernized storage
 */

import logger from './logger'
import { initializeModernStorage, storageMigrations } from './modernStorage.js'

/**
 * Initialize storage system with comprehensive migration and cleanup
 */
export const initializeStorage = async () => {
  try {
    logger.info('🗄️ Initializing modern storage system...')
    
    // Run built-in migrations
    const stats = await initializeModernStorage()
    
    // Run additional custom migrations
    await runCustomMigrations()
    
    // Clean up expired cache items
    await cleanupExpiredCache()
    
    // Log storage statistics
    logger.info('✅ Storage initialization complete:', {
      totalSize: `${(stats.totalSize / 1024).toFixed(2)}KB`,
      itemCount: stats.itemCount,
      diboasItems: stats.diboasItems,
      usage: `${(stats.usage * 100).toFixed(1)}%`
    })
    
    return stats
  } catch (error) {
    logger.error('❌ Storage initialization failed:', error)
    return null
  }
}

/**
 * Custom migrations for specific localStorage patterns
 */
const runCustomMigrations = async () => {
  const migrations = [
    // Migration: SEO metrics to cache
    () => {
      const oldKey = 'seo_metrics'
      const oldData = localStorage.getItem(oldKey)
      if (oldData) {
        try {
          const metrics = JSON.parse(oldData)
          if (Array.isArray(metrics) && metrics.length > 0) {
            // This will be handled by the storage module
            logger.debug('SEO metrics migration: found data to migrate')
          }
          // Remove old format after successful migration
          localStorage.removeItem(oldKey)
        } catch (error) {
          logger.warn('Failed to migrate SEO metrics:', error)
        }
      }
    },
    
    // Migration: Performance cache to modern storage
    () => {
      const performanceKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('perf_') || key.startsWith('cache_')
      )
      
      performanceKeys.forEach(key => {
        try {
          const data = localStorage.getItem(key)
          if (data) {
            // Data will be handled by modern storage system
            localStorage.removeItem(key)
          }
        } catch (error) {
          logger.warn(`Failed to migrate performance cache ${key}:`, error)
        }
      })
    },
    
    // Migration: Clean up old diBoaS keys without version
    () => {
      const oldKeys = Object.keys(localStorage).filter(key => 
        key.startsWith('diboas_') && !key.includes('_v1.0')
      )
      
      oldKeys.forEach(key => {
        // Keep essential keys during transition period
        if (key === 'diboas_user_settings' || key === 'diboas_recent_wallet_addresses') {
          return // Skip these, they have their own migration
        }
        
        try {
          localStorage.removeItem(key)
          logger.debug(`Cleaned up old storage key: ${key}`)
        } catch (error) {
          logger.warn(`Failed to clean up key ${key}:`, error)
        }
      })
    }
  ]
  
  migrations.forEach((migration, index) => {
    try {
      migration()
    } catch (error) {
      logger.error(`Custom migration ${index} failed:`, error)
    }
  })
}

/**
 * Clean up expired cache items and orphaned data
 */
const cleanupExpiredCache = async () => {
  try {
    let cleanedItems = 0
    const now = Date.now()
    
    // Check all localStorage keys for expired items
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('diboas_cache_') || key.startsWith('diboas_session_')) {
        try {
          const stored = localStorage.getItem(key)
          if (stored) {
            const parsed = JSON.parse(stored)
            
            // Check if item has expiry and is expired
            if (parsed.expiry && now > parsed.expiry) {
              localStorage.removeItem(key)
              cleanedItems++
            }
          }
        } catch (error) {
          // Invalid JSON, remove the corrupted item
          localStorage.removeItem(key)
          cleanedItems++
        }
      }
    })
    
    if (cleanedItems > 0) {
      logger.info(`🧹 Cleaned up ${cleanedItems} expired cache items`)
    }
  } catch (error) {
    logger.error('Cache cleanup failed:', error)
  }
}

/**
 * Get comprehensive storage diagnostics
 */
export const getStorageDiagnostics = () => {
  try {
    const localStorage_keys = Object.keys(localStorage)
    const sessionStorage_keys = Object.keys(sessionStorage)
    
    // Categorize localStorage keys
    const categories = {
      diboas_modern: [],
      diboas_legacy: [],
      third_party: [],
      unknown: []
    }
    
    localStorage_keys.forEach(key => {
      if (key.startsWith('diboas_') && key.includes('_v1.0')) {
        categories.diboas_modern.push(key)
      } else if (key.startsWith('diboas_')) {
        categories.diboas_legacy.push(key)
      } else if (key.startsWith('_') || key.includes('google') || key.includes('facebook')) {
        categories.third_party.push(key)
      } else {
        categories.unknown.push(key)
      }
    })
    
    // Calculate sizes
    const calculateSize = (keys) => {
      return keys.reduce((total, key) => {
        const value = localStorage.getItem(key) || ''
        return total + new Blob([value]).size
      }, 0)
    }
    
    return {
      localStorage: {
        totalItems: localStorage_keys.length,
        totalSize: calculateSize(localStorage_keys),
        categories: {
          diboas_modern: {
            count: categories.diboas_modern.length,
            size: calculateSize(categories.diboas_modern),
            keys: categories.diboas_modern
          },
          diboas_legacy: {
            count: categories.diboas_legacy.length,
            size: calculateSize(categories.diboas_legacy),
            keys: categories.diboas_legacy
          },
          third_party: {
            count: categories.third_party.length,
            size: calculateSize(categories.third_party)
          },
          unknown: {
            count: categories.unknown.length,
            size: calculateSize(categories.unknown)
          }
        }
      },
      sessionStorage: {
        totalItems: sessionStorage_keys.length,
        keys: sessionStorage_keys.slice(0, 10) // Sample of keys
      },
      recommendations: generateStorageRecommendations(categories)
    }
  } catch (error) {
    logger.error('Storage diagnostics failed:', error)
    return null
  }
}

/**
 * Generate storage optimization recommendations
 */
const generateStorageRecommendations = (categories) => {
  const recommendations = []
  
  if (categories.diboas_legacy.length > 0) {
    recommendations.push({
      type: 'migration',
      priority: 'medium',
      message: `${categories.diboas_legacy.length} legacy storage items should be migrated`,
      action: 'Run storage migration'
    })
  }
  
  if (categories.unknown.length > 5) {
    recommendations.push({
      type: 'cleanup',
      priority: 'low',
      message: `${categories.unknown.length} unknown storage items found`,
      action: 'Review and clean up unused items'
    })
  }
  
  const totalSize = Object.values(categories).flat().reduce((total, key) => {
    return total + new Blob([localStorage.getItem(key) || '']).size
  }, 0)
  
  if (totalSize > 2 * 1024 * 1024) { // 2MB
    recommendations.push({
      type: 'performance',
      priority: 'high',
      message: 'Storage size exceeds 2MB, may impact performance',
      action: 'Enable compression or implement data archiving'
    })
  }
  
  return recommendations
}

/**
 * Development-only storage debugging utilities
 */
export const storageDebug = {
  // List all storage keys by category
  listKeys: () => {
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'development') {
      return 'Debug tools only available in development'
    }
    
    return getStorageDiagnostics()
  },
  
  // Clear all diBoaS storage (development only)
  clearAll: () => {
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'development') {
      return 'Clear operation only available in development'
    }
    
    const keys = Object.keys(localStorage).filter(key => key.startsWith('diboas_'))
    keys.forEach(key => localStorage.removeItem(key))
    
    return `Cleared ${keys.length} diBoaS storage items`
  },
  
  // Export storage data for debugging
  export: () => {
    if (typeof process !== 'undefined' && process.env.NODE_ENV !== 'development') {
      return 'Export only available in development'
    }
    
    const data = {}
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('diboas_')) {
        try {
          data[key] = JSON.parse(localStorage.getItem(key))
        } catch (error) {
          data[key] = localStorage.getItem(key)
        }
      }
    })
    
    return data
  }
}

// Auto-initialize storage when module loads
if (typeof window !== 'undefined') {
  // Initialize with a small delay to avoid blocking initial render
  setTimeout(() => {
    initializeStorage().catch(error => {
      logger.error('Auto-initialization failed:', error)
    })
  }, 1000)
}

export default { initializeStorage, getStorageDiagnostics, storageDebug }