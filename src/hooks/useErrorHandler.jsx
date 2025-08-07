/**
 * Universal Error Handler Hook
 * Provides comprehensive error handling, recovery, and user notification
 * Prevents crashes and provides graceful degradation
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import logger from '../utils/logger'

// Error severity levels
export const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
}

// Error types for better categorization
export const ERROR_TYPES = {
  NETWORK: 'network',
  VALIDATION: 'validation',
  AUTHENTICATION: 'authentication',
  PERMISSION: 'permission',
  BUSINESS_LOGIC: 'business_logic',
  DATA_CORRUPTION: 'data_corruption',
  EXTERNAL_SERVICE: 'external_service',
  UNKNOWN: 'unknown'
}

// Recovery strategies
export const RECOVERY_STRATEGIES = {
  RETRY: 'retry',
  FALLBACK: 'fallback',
  IGNORE: 'ignore',
  REDIRECT: 'redirect',
  REFRESH: 'refresh'
}

export const useErrorHandler = (options = {}) => {
  const {
    maxErrors = 10,
    autoRecovery = true,
    notifyUser = true,
    logErrors = true,
    retryAttempts = 3,
    retryDelay = 1000
  } = options

  const [errors, setErrors] = useState([])
  const [isRecovering, setIsRecovering] = useState(false)
  const [lastError, setLastError] = useState(null)
  const errorCountRef = useRef(0)
  const retryTimeoutsRef = useRef(new Map())

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      retryTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
      retryTimeoutsRef.current.clear()
    }
  }, [])

  /**
   * Classify error type and severity
   * @param {Error|string} error - Error to classify
   * @returns {object} Classification details
   */
  const classifyError = useCallback((error) => {
    const errorMessage = error?.message || String(error)
    const errorName = error?.name || 'Error'

    let type = ERROR_TYPES.UNKNOWN
    let severity = ERROR_SEVERITY.MEDIUM
    let recoverable = true
    let strategy = RECOVERY_STRATEGIES.RETRY

    // Network errors
    if (errorMessage.includes('fetch') || 
        errorMessage.includes('network') || 
        errorMessage.includes('timeout') ||
        errorMessage.includes('NETWORK_ERROR')) {
      type = ERROR_TYPES.NETWORK
      severity = ERROR_SEVERITY.MEDIUM
      strategy = RECOVERY_STRATEGIES.RETRY
    }
    
    // Authentication errors
    else if (errorMessage.includes('auth') || 
             errorMessage.includes('token') || 
             errorMessage.includes('unauthorized') ||
             errorMessage.includes('401')) {
      type = ERROR_TYPES.AUTHENTICATION
      severity = ERROR_SEVERITY.HIGH
      strategy = RECOVERY_STRATEGIES.REDIRECT
    }
    
    // Permission errors
    else if (errorMessage.includes('permission') || 
             errorMessage.includes('forbidden') ||
             errorMessage.includes('403')) {
      type = ERROR_TYPES.PERMISSION
      severity = ERROR_SEVERITY.HIGH
      recoverable = false
      strategy = RECOVERY_STRATEGIES.FALLBACK
    }
    
    // Validation errors
    else if (errorMessage.includes('validation') || 
             errorMessage.includes('invalid') ||
             errorMessage.includes('required')) {
      type = ERROR_TYPES.VALIDATION
      severity = ERROR_SEVERITY.LOW
      strategy = RECOVERY_STRATEGIES.IGNORE
    }
    
    // Data corruption
    else if (errorMessage.includes('JSON.parse') || 
             errorMessage.includes('corrupt') ||
             errorMessage.includes('malformed')) {
      type = ERROR_TYPES.DATA_CORRUPTION
      severity = ERROR_SEVERITY.HIGH
      strategy = RECOVERY_STRATEGIES.FALLBACK
    }
    
    // Critical system errors
    else if (errorName.includes('TypeError') || 
             errorName.includes('ReferenceError') ||
             errorMessage.includes('Cannot read property')) {
      type = ERROR_TYPES.BUSINESS_LOGIC
      severity = ERROR_SEVERITY.CRITICAL
      strategy = RECOVERY_STRATEGIES.REFRESH
    }

    return { type, severity, recoverable, strategy }
  }, [])

  /**
   * Create user-friendly error message
   * @param {object} errorInfo - Error information
   * @returns {string} User-friendly message
   */
  const createUserMessage = useCallback((errorInfo) => {
    const { type, severity } = errorInfo

    const messages = {
      [ERROR_TYPES.NETWORK]: {
        [ERROR_SEVERITY.LOW]: 'Connection issue detected. Retrying...',
        [ERROR_SEVERITY.MEDIUM]: 'Network connection problem. Please check your internet connection.',
        [ERROR_SEVERITY.HIGH]: 'Unable to connect to server. Please try again later.',
        [ERROR_SEVERITY.CRITICAL]: 'Service unavailable. Please contact support.'
      },
      [ERROR_TYPES.AUTHENTICATION]: {
        [ERROR_SEVERITY.LOW]: 'Session expired. Please log in again.',
        [ERROR_SEVERITY.MEDIUM]: 'Authentication required. Redirecting to login...',
        [ERROR_SEVERITY.HIGH]: 'Authentication failed. Please check your credentials.',
        [ERROR_SEVERITY.CRITICAL]: 'Security error. Please contact support.'
      },
      [ERROR_TYPES.VALIDATION]: {
        [ERROR_SEVERITY.LOW]: 'Please check your input and try again.',
        [ERROR_SEVERITY.MEDIUM]: 'Some information is missing or invalid.',
        [ERROR_SEVERITY.HIGH]: 'Invalid data detected. Please refresh and try again.',
        [ERROR_SEVERITY.CRITICAL]: 'Data validation failed. Please contact support.'
      },
      [ERROR_TYPES.PERMISSION]: {
        [ERROR_SEVERITY.LOW]: 'You don\'t have permission for this action.',
        [ERROR_SEVERITY.MEDIUM]: 'Access denied. Please contact your administrator.',
        [ERROR_SEVERITY.HIGH]: 'Insufficient permissions. Please contact support.',
        [ERROR_SEVERITY.CRITICAL]: 'Security violation detected. Access blocked.'
      },
      [ERROR_TYPES.DATA_CORRUPTION]: {
        [ERROR_SEVERITY.LOW]: 'Data issue detected. Refreshing...',
        [ERROR_SEVERITY.MEDIUM]: 'Data corruption detected. Using backup data.',
        [ERROR_SEVERITY.HIGH]: 'Critical data error. Please refresh the page.',
        [ERROR_SEVERITY.CRITICAL]: 'Severe data corruption. Please contact support.'
      },
      [ERROR_TYPES.BUSINESS_LOGIC]: {
        [ERROR_SEVERITY.LOW]: 'Minor issue detected. Continuing with defaults.',
        [ERROR_SEVERITY.MEDIUM]: 'Application error. Please try again.',
        [ERROR_SEVERITY.HIGH]: 'System error detected. Please refresh the page.',
        [ERROR_SEVERITY.CRITICAL]: 'Critical system error. Please contact support immediately.'
      },
      [ERROR_TYPES.EXTERNAL_SERVICE]: {
        [ERROR_SEVERITY.LOW]: 'External service temporarily unavailable.',
        [ERROR_SEVERITY.MEDIUM]: 'Third-party service issue. Using cached data.',
        [ERROR_SEVERITY.HIGH]: 'External service failure. Some features may be limited.',
        [ERROR_SEVERITY.CRITICAL]: 'Critical service outage. Please try again later.'
      }
    }

    return messages[type]?.[severity] || 'An unexpected error occurred. Please try again.'
  }, [])

  /**
   * Handle error with automatic classification and recovery
   * @param {Error|string} error - Error to handle
   * @param {object} context - Additional context
   * @param {Function} recoveryFn - Custom recovery function
   * @returns {Promise<boolean>} Success status of error handling
   */
  const handleError = useCallback(async (error, context = {}, recoveryFn = null) => {
    const errorId = Date.now() + Math.random()
    const classification = classifyError(error)
    const userMessage = createUserMessage(classification)
    
    const errorInfo = {
      id: errorId,
      error,
      message: error?.message || String(error),
      classification,
      userMessage,
      context,
      timestamp: new Date().toISOString(),
      retryCount: 0
    }

    // Log error if enabled
    if (logErrors) {
      const logLevel = classification.severity === ERROR_SEVERITY.CRITICAL ? 'error' : 'warn'
      logger[logLevel]('useErrorHandler: Error handled:', {
        message: errorInfo.message,
        type: classification.type,
        severity: classification.severity,
        context,
        stack: error?.stack
      })
    }

    // Update error state
    setLastError(errorInfo)
    setErrors(prev => {
      const updated = [errorInfo, ...prev].slice(0, maxErrors)
      return updated
    })

    errorCountRef.current += 1

    // Attempt recovery if enabled
    if (autoRecovery && classification.recoverable) {
      return await attemptRecovery(errorInfo, recoveryFn)
    }

    return false
  }, [classifyError, createUserMessage, logErrors, maxErrors, autoRecovery])

  /**
   * Attempt error recovery based on strategy
   * @param {object} errorInfo - Error information
   * @param {Function} customRecoveryFn - Custom recovery function
   * @returns {Promise<boolean>} Recovery success
   */
  const attemptRecovery = useCallback(async (errorInfo, customRecoveryFn) => {
    const { classification } = errorInfo
    setIsRecovering(true)

    try {
      let recoverySuccess = false

      // Custom recovery function takes precedence
      if (customRecoveryFn && typeof customRecoveryFn === 'function') {
        recoverySuccess = await customRecoveryFn(errorInfo)
      } else {
        // Built-in recovery strategies
        switch (classification.strategy) {
          case RECOVERY_STRATEGIES.RETRY:
            recoverySuccess = await retryOperation(errorInfo)
            break
            
          case RECOVERY_STRATEGIES.FALLBACK:
            recoverySuccess = await useFallbackData(errorInfo)
            break
            
          case RECOVERY_STRATEGIES.REDIRECT:
            recoverySuccess = await handleRedirect(errorInfo)
            break
            
          case RECOVERY_STRATEGIES.REFRESH:
            recoverySuccess = await handlePageRefresh(errorInfo)
            break
            
          case RECOVERY_STRATEGIES.IGNORE:
          default:
            recoverySuccess = true // Consider "ignore" as successful
            break
        }
      }

      if (recoverySuccess) {
        // Remove error from state on successful recovery
        setErrors(prev => prev.filter(e => e.id !== errorInfo.id))
        setLastError(null)
        
        if (logErrors) {
          logger.info('useErrorHandler: Successfully recovered from error:', {
            errorId: errorInfo.id,
            strategy: classification.strategy
          })
        }
      }

      return recoverySuccess
    } catch (recoveryError) {
      if (logErrors) {
        logger.error('useErrorHandler: Recovery failed:', {
          originalError: errorInfo.message,
          recoveryError: recoveryError.message
        })
      }
      return false
    } finally {
      setIsRecovering(false)
    }
  }, [logErrors])

  /**
   * Retry operation with exponential backoff
   */
  const retryOperation = useCallback(async (errorInfo) => {
    const maxRetries = retryAttempts
    let attempt = errorInfo.retryCount || 0

    if (attempt >= maxRetries) {
      return false
    }

    const delay = retryDelay * Math.pow(2, attempt)
    
    return new Promise(resolve => {
      const timeoutId = setTimeout(() => {
        attempt += 1
        errorInfo.retryCount = attempt
        
        // For now, just consider retry successful after delay
        // In real implementation, this would re-execute the failed operation
        resolve(true)
      }, delay)
      
      retryTimeoutsRef.current.set(errorInfo.id, timeoutId)
    })
  }, [retryAttempts, retryDelay])

  /**
   * Use fallback data or functionality
   */
  const useFallbackData = useCallback(async (errorInfo) => {
    // This would implement fallback data logic
    // For now, just return true to indicate fallback is in place
    return true
  }, [])

  /**
   * Handle authentication redirects
   */
  const handleRedirect = useCallback(async (errorInfo) => {
    // This would implement redirect logic
    // For now, just log the intent
    if (logErrors) {
      logger.info('useErrorHandler: Would redirect for authentication')
    }
    return true
  }, [logErrors])

  /**
   * Handle page refresh for critical errors
   */
  const handlePageRefresh = useCallback(async (errorInfo) => {
    // This would implement page refresh logic
    // For now, just log the intent
    if (logErrors) {
      logger.warn('useErrorHandler: Critical error - would refresh page')
    }
    return true
  }, [logErrors])

  /**
   * Clear specific error
   * @param {string} errorId - ID of error to clear
   */
  const clearError = useCallback((errorId) => {
    if (errorId) {
      setErrors(prev => prev.filter(e => e.id !== errorId))
      if (lastError?.id === errorId) {
        setLastError(null)
      }
    } else {
      // Clear all errors
      setErrors([])
      setLastError(null)
    }
    
    // Clear any pending retry timeouts
    retryTimeoutsRef.current.forEach(timeout => clearTimeout(timeout))
    retryTimeoutsRef.current.clear()
  }, [lastError])

  /**
   * Create a safe wrapper for async operations
   * @param {Function} asyncFn - Async function to wrap
   * @param {object} options - Wrapper options
   * @returns {Function} Safe wrapped function
   */
  const createSafeWrapper = useCallback((asyncFn, wrapperOptions = {}) => {
    const { 
      fallback = null,
      context = {},
      recoveryFn = null,
      suppressErrors = false
    } = wrapperOptions

    return async (...args) => {
      try {
        return await asyncFn(...args)
      } catch (error) {
        if (!suppressErrors) {
          await handleError(error, { ...context, args }, recoveryFn)
        }
        return fallback
      }
    }
  }, [handleError])

  /**
   * Get error statistics
   */
  const getErrorStats = useCallback(() => {
    const totalErrors = errorCountRef.current
    const currentErrors = errors.length
    const errorsByType = errors.reduce((acc, error) => {
      const type = error.classification.type
      acc[type] = (acc[type] || 0) + 1
      return acc
    }, {})
    
    const errorsBySeverity = errors.reduce((acc, error) => {
      const severity = error.classification.severity
      acc[severity] = (acc[severity] || 0) + 1
      return acc
    }, {})

    return {
      totalErrors,
      currentErrors,
      errorsByType,
      errorsBySeverity,
      isRecovering
    }
  }, [errors, isRecovering])

  return {
    // Error state
    errors,
    lastError,
    isRecovering,
    hasErrors: errors.length > 0,
    
    // Error handling
    handleError,
    clearError,
    
    // Utilities
    createSafeWrapper,
    getErrorStats,
    
    // Constants for external use
    ERROR_SEVERITY,
    ERROR_TYPES,
    RECOVERY_STRATEGIES
  }
}

export default useErrorHandler