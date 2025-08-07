/**
 * Application Recovery Manager
 * Comprehensive error recovery and resilience system for the entire application
 * Prevents crashes and provides automatic recovery mechanisms
 */

import logger from './logger'
import { safeJSONParse, safeJSONStringify, safeGet } from './safeDataHandling'

// Recovery action types
export const RECOVERY_ACTIONS = {
  CLEAR_LOCAL_STORAGE: 'clear_local_storage',
  RESET_STATE: 'reset_state',
  RELOAD_PAGE: 'reload_page',
  REDIRECT_HOME: 'redirect_home',
  CLEAR_CACHE: 'clear_cache',
  RESTART_SERVICES: 'restart_services',
  ENABLE_SAFE_MODE: 'enable_safe_mode'
}

// Critical error patterns that require immediate recovery
const CRITICAL_ERROR_PATTERNS = [
  /chunk.*loading/i,
  /loading chunk \d+ failed/i,
  /cannot read propert.*of undefined/i,
  /cannot read propert.*of null/i,
  /typeerror.*undefined/i,
  /referenceerror/i,
  /maximum call stack/i,
  /out of memory/i,
  /quota.*exceeded/i
]

// Service health tracking
const SERVICE_HEALTH = new Map()

class AppRecoveryManager {
  constructor() {
    this.errorHistory = []
    this.recoveryAttempts = new Map()
    this.isRecovering = false
    this.safeMode = false
    this.criticalErrorThreshold = 3
    this.recoveryTimeout = 30000 // 30 seconds
    
    // Initialize global error handlers
    this.initializeGlobalErrorHandlers()
    
    // Start health monitoring
    this.startHealthMonitoring()
  }

  /**
   * Initialize global error handlers to catch all uncaught errors
   */
  initializeGlobalErrorHandlers() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      logger.error('AppRecoveryManager: Unhandled promise rejection:', {
        reason: event.reason,
        stack: event.reason?.stack,
        promise: event.promise
      })
      
      this.handleCriticalError(event.reason, 'unhandled_promise_rejection')
      
      // Prevent the browser from logging the error to console
      event.preventDefault()
    })

    // Handle global JavaScript errors
    window.addEventListener('error', (event) => {
      logger.error('AppRecoveryManager: Global JavaScript error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      })
      
      this.handleCriticalError(event.error, 'global_javascript_error')
    })

    // Handle resource loading errors
    window.addEventListener('error', (event) => {
      if (event.target !== window) {
        logger.error('AppRecoveryManager: Resource loading error:', {
          src: event.target.src || event.target.href,
          tagName: event.target.tagName,
          type: 'resource_error'
        })
        
        this.handleResourceError(event.target)
      }
    }, true)

    // Handle online/offline events
    window.addEventListener('online', () => {
      logger.info('AppRecoveryManager: Network restored')
      this.handleNetworkRestore()
    })

    window.addEventListener('offline', () => {
      logger.warn('AppRecoveryManager: Network lost')
      this.handleNetworkLoss()
    })

    // Handle low memory warnings (Chrome/Edge specific)
    if ('memory' in performance) {
      setInterval(() => {
        const memoryInfo = performance.memory
        const memoryUsagePercent = (memoryInfo.usedJSHeapSize / memoryInfo.jsHeapSizeLimit) * 100
        
        if (memoryUsagePercent > 90) {
          logger.warn('AppRecoveryManager: High memory usage detected:', {
            usedMemory: memoryInfo.usedJSHeapSize,
            totalMemory: memoryInfo.jsHeapSizeLimit,
            usagePercent: memoryUsagePercent
          })
          
          this.handleMemoryPressure()
        }
      }, 30000) // Check every 30 seconds
    }
  }

  /**
   * Handle critical errors that could crash the app
   */
  async handleCriticalError(error, context) {
    if (this.isRecovering) return

    const errorMessage = error?.message || String(error)
    const isCritical = CRITICAL_ERROR_PATTERNS.some(pattern => 
      pattern.test(errorMessage)
    )

    // Record error in history
    const errorRecord = {
      error,
      context,
      timestamp: Date.now(),
      isCritical,
      url: window.location.href,
      userAgent: navigator.userAgent
    }
    
    this.errorHistory.push(errorRecord)
    
    // Keep only last 50 errors
    if (this.errorHistory.length > 50) {
      this.errorHistory.shift()
    }

    // Check if we need immediate recovery
    if (isCritical || this.shouldTriggerRecovery()) {
      await this.executeRecovery(errorRecord)
    }
  }

  /**
   * Determine if recovery should be triggered based on error patterns
   */
  shouldTriggerRecovery() {
    const recentErrors = this.errorHistory.filter(
      error => Date.now() - error.timestamp < 60000 // Last minute
    )
    
    // Too many errors in short time
    if (recentErrors.length >= this.criticalErrorThreshold) {
      return true
    }
    
    // Same error repeating
    const lastError = this.errorHistory[this.errorHistory.length - 1]
    const sameErrorCount = recentErrors.filter(
      error => error.error?.message === lastError.error?.message
    ).length
    
    if (sameErrorCount >= 3) {
      return true
    }
    
    return false
  }

  /**
   * Execute comprehensive recovery sequence
   */
  async executeRecovery(errorRecord) {
    if (this.isRecovering) return

    this.isRecovering = true
    logger.warn('AppRecoveryManager: Starting recovery sequence:', errorRecord)

    try {
      // Determine recovery strategy
      const recoveryPlan = this.createRecoveryPlan(errorRecord)
      
      // Execute recovery actions in sequence
      for (const action of recoveryPlan) {
        try {
          await this.executeRecoveryAction(action, errorRecord)
          logger.info(`AppRecoveryManager: Recovery action completed: ${action.type}`)
        } catch (actionError) {
          logger.error(`AppRecoveryManager: Recovery action failed: ${action.type}`, actionError)
        }
      }
      
      // If we reach here, recovery was successful
      logger.info('AppRecoveryManager: Recovery sequence completed successfully')
      
    } catch (recoveryError) {
      logger.error('AppRecoveryManager: Recovery sequence failed:', recoveryError)
      
      // Last resort: reload page
      this.executeLastResortRecovery()
    } finally {
      // Reset recovery state after timeout
      setTimeout(() => {
        this.isRecovering = false
      }, this.recoveryTimeout)
    }
  }

  /**
   * Create recovery plan based on error analysis
   */
  createRecoveryPlan(errorRecord) {
    const plan = []
    const errorMessage = errorRecord.error?.message || ''

    // Chunk loading errors
    if (/chunk.*loading/i.test(errorMessage) || /loading chunk.*failed/i.test(errorMessage)) {
      plan.push(
        { type: RECOVERY_ACTIONS.CLEAR_CACHE },
        { type: RECOVERY_ACTIONS.RELOAD_PAGE }
      )
    }
    
    // Memory errors
    else if (/out of memory/i.test(errorMessage) || /quota.*exceeded/i.test(errorMessage)) {
      plan.push(
        { type: RECOVERY_ACTIONS.CLEAR_LOCAL_STORAGE },
        { type: RECOVERY_ACTIONS.CLEAR_CACHE },
        { type: RECOVERY_ACTIONS.ENABLE_SAFE_MODE },
        { type: RECOVERY_ACTIONS.RELOAD_PAGE }
      )
    }
    
    // Reference/Type errors (likely state corruption)
    else if (/cannot read propert|typeerror|referenceerror/i.test(errorMessage)) {
      plan.push(
        { type: RECOVERY_ACTIONS.RESET_STATE },
        { type: RECOVERY_ACTIONS.RESTART_SERVICES }
      )
    }
    
    // Network-related errors
    else if (/network|fetch|connection/i.test(errorMessage)) {
      plan.push(
        { type: RECOVERY_ACTIONS.RESTART_SERVICES },
        { type: RECOVERY_ACTIONS.CLEAR_CACHE }
      )
    }
    
    // Generic recovery for unknown errors
    else {
      plan.push(
        { type: RECOVERY_ACTIONS.RESET_STATE },
        { type: RECOVERY_ACTIONS.CLEAR_CACHE }
      )
    }

    return plan
  }

  /**
   * Execute individual recovery actions
   */
  async executeRecoveryAction(action, errorRecord) {
    switch (action.type) {
      case RECOVERY_ACTIONS.CLEAR_LOCAL_STORAGE:
        this.clearCorruptedLocalStorage()
        break
        
      case RECOVERY_ACTIONS.RESET_STATE:
        await this.resetApplicationState()
        break
        
      case RECOVERY_ACTIONS.CLEAR_CACHE:
        await this.clearApplicationCache()
        break
        
      case RECOVERY_ACTIONS.RESTART_SERVICES:
        await this.restartServices()
        break
        
      case RECOVERY_ACTIONS.ENABLE_SAFE_MODE:
        this.enableSafeMode()
        break
        
      case RECOVERY_ACTIONS.RELOAD_PAGE:
        this.reloadPage()
        break
        
      case RECOVERY_ACTIONS.REDIRECT_HOME:
        this.redirectToHome()
        break
        
      default:
        logger.warn(`AppRecoveryManager: Unknown recovery action: ${action.type}`)
    }
  }

  /**
   * Clear corrupted localStorage data
   */
  clearCorruptedLocalStorage() {
    try {
      const keysToPreserve = ['user_preferences', 'auth_token']
      const backup = {}
      
      // Backup important data
      keysToPreserve.forEach(key => {
        const value = localStorage.getItem(key)
        if (value) {
          backup[key] = value
        }
      })
      
      // Clear all localStorage
      localStorage.clear()
      
      // Restore important data
      Object.entries(backup).forEach(([key, value]) => {
        try {
          localStorage.setItem(key, value)
        } catch (error) {
          logger.warn(`Failed to restore localStorage key: ${key}`)
        }
      })
      
      logger.info('AppRecoveryManager: localStorage cleared and restored')
      
    } catch (error) {
      logger.error('AppRecoveryManager: Failed to clear localStorage:', error)
    }
  }

  /**
   * Reset application state
   */
  async resetApplicationState() {
    try {
      // Dispatch custom event for components to reset their state
      window.dispatchEvent(new CustomEvent('app:reset-state', {
        detail: { reason: 'error_recovery' }
      }))
      
      // Reset service health tracking
      SERVICE_HEALTH.clear()
      
      logger.info('AppRecoveryManager: Application state reset')
      
    } catch (error) {
      logger.error('AppRecoveryManager: Failed to reset state:', error)
    }
  }

  /**
   * Clear various application caches
   */
  async clearApplicationCache() {
    try {
      // Clear service worker caches
      if ('caches' in window) {
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map(cacheName => caches.delete(cacheName))
        )
      }
      
      // Clear sessionStorage
      sessionStorage.clear()
      
      // Dispatch event for custom cache clearing
      window.dispatchEvent(new CustomEvent('app:clear-cache'))
      
      logger.info('AppRecoveryManager: Caches cleared')
      
    } catch (error) {
      logger.error('AppRecoveryManager: Failed to clear cache:', error)
    }
  }

  /**
   * Restart application services
   */
  async restartServices() {
    try {
      // Dispatch event for services to restart
      window.dispatchEvent(new CustomEvent('app:restart-services'))
      
      logger.info('AppRecoveryManager: Services restarted')
      
    } catch (error) {
      logger.error('AppRecoveryManager: Failed to restart services:', error)
    }
  }

  /**
   * Enable safe mode (reduced functionality)
   */
  enableSafeMode() {
    this.safeMode = true
    document.body.classList.add('safe-mode')
    
    // Store safe mode in localStorage
    try {
      localStorage.setItem('app_safe_mode', 'true')
    } catch (error) {
      logger.warn('Failed to store safe mode state')
    }
    
    // Dispatch event
    window.dispatchEvent(new CustomEvent('app:safe-mode-enabled'))
    
    logger.warn('AppRecoveryManager: Safe mode enabled')
  }

  /**
   * Reload the page
   */
  reloadPage() {
    logger.info('AppRecoveryManager: Reloading page')
    window.location.reload()
  }

  /**
   * Redirect to home page
   */
  redirectToHome() {
    logger.info('AppRecoveryManager: Redirecting to home')
    window.location.href = '/'
  }

  /**
   * Last resort recovery when everything else fails
   */
  executeLastResortRecovery() {
    logger.error('AppRecoveryManager: Executing last resort recovery')
    
    try {
      // Clear everything possible
      localStorage.clear()
      sessionStorage.clear()
      
      if ('caches' in window) {
        caches.keys().then(names => {
          names.forEach(name => caches.delete(name))
        })
      }
      
      // Set recovery flag
      sessionStorage.setItem('recovery_mode', 'true')
      
      // Force reload
      window.location.reload(true)
      
    } catch (error) {
      // If even this fails, just reload
      window.location.reload()
    }
  }

  /**
   * Handle resource loading errors
   */
  handleResourceError(element) {
    const tagName = element.tagName.toLowerCase()
    const src = element.src || element.href
    
    // Retry loading critical resources
    if (tagName === 'script' || tagName === 'link') {
      setTimeout(() => {
        if (tagName === 'script') {
          const newScript = document.createElement('script')
          newScript.src = src + '?retry=' + Date.now()
          newScript.onerror = () => {
            logger.error('AppRecoveryManager: Failed to reload script:', src)
          }
          document.head.appendChild(newScript)
        }
      }, 1000)
    }
  }

  /**
   * Handle network restoration
   */
  handleNetworkRestore() {
    // Restart failed services
    this.restartServices()
    
    // Dispatch event for components to retry failed operations
    window.dispatchEvent(new CustomEvent('app:network-restored'))
  }

  /**
   * Handle network loss
   */
  handleNetworkLoss() {
    // Dispatch event for components to handle offline mode
    window.dispatchEvent(new CustomEvent('app:network-lost'))
  }

  /**
   * Handle memory pressure
   */
  handleMemoryPressure() {
    // Clear non-essential caches
    this.clearApplicationCache()
    
    // Dispatch event for components to free memory
    window.dispatchEvent(new CustomEvent('app:memory-pressure'))
    
    // Enable safe mode if memory usage is critical
    if (performance.memory) {
      const usage = (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
      if (usage > 95) {
        this.enableSafeMode()
      }
    }
  }

  /**
   * Start periodic health monitoring
   */
  startHealthMonitoring() {
    setInterval(() => {
      this.performHealthCheck()
    }, 60000) // Every minute
  }

  /**
   * Perform application health check
   */
  performHealthCheck() {
    const healthData = {
      timestamp: Date.now(),
      errorCount: this.errorHistory.length,
      recentErrors: this.errorHistory.filter(e => Date.now() - e.timestamp < 300000).length, // 5 minutes
      memoryUsage: performance.memory ? {
        used: performance.memory.usedJSHeapSize,
        total: performance.memory.totalJSHeapSize,
        limit: performance.memory.jsHeapSizeLimit
      } : null,
      online: navigator.onLine,
      safeMode: this.safeMode
    }

    // Log health status
    if (healthData.recentErrors > 5) {
      logger.warn('AppRecoveryManager: High error rate detected:', healthData)
    } else {
      logger.debug('AppRecoveryManager: Health check passed:', healthData)
    }

    return healthData
  }

  /**
   * Get recovery statistics
   */
  getRecoveryStats() {
    return {
      totalErrors: this.errorHistory.length,
      recentErrors: this.errorHistory.filter(e => Date.now() - e.timestamp < 3600000).length, // 1 hour
      isRecovering: this.isRecovering,
      safeMode: this.safeMode,
      recoveryAttempts: this.recoveryAttempts.size,
      criticalErrors: this.errorHistory.filter(e => e.isCritical).length
    }
  }
}

// Create and export singleton instance
export const appRecoveryManager = new AppRecoveryManager()

// Export recovery actions and utilities
export { RECOVERY_ACTIONS }

export default appRecoveryManager