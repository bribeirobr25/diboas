/**
 * Resilient Data Hook
 * Provides bulletproof data fetching with comprehensive error handling
 * Ensures hooks never crash components and always provide usable data
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { safeAsyncExecute, safeGet } from '../utils/safeDataHandling'
import logger from '../utils/logger'

// Hook states for better state management
export const HOOK_STATES = {
  IDLE: 'idle',
  LOADING: 'loading',
  SUCCESS: 'success',
  ERROR: 'error',
  RETRYING: 'retrying',
  FALLBACK: 'fallback'
}

// Error recovery strategies
export const RECOVERY_STRATEGIES = {
  RETRY: 'retry',
  FALLBACK: 'fallback',
  IGNORE: 'ignore',
  CACHE: 'cache'
}

/**
 * Universal resilient data fetching hook
 * @param {Function} dataFetcher - Async function to fetch data
 * @param {object} options - Configuration options
 * @returns {object} Hook state and utilities
 */
export const useResilientData = (dataFetcher, options = {}) => {
  const {
    // Data options
    fallbackData = null,
    initialData = null,
    deps = [],
    
    // Error handling options
    maxRetries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    timeout = 30000,
    
    // Recovery options
    enableAutoRetry = true,
    enableFallback = true,
    enableCache = false,
    cacheKey = null,
    cacheTTL = 300000, // 5 minutes
    
    // Behavior options
    refetchOnWindowFocus = false,
    refetchOnReconnect = true,
    staleWhileRevalidate = false,
    
    // Callbacks
    onSuccess = null,
    onError = null,
    onRetry = null,
    onFallback = null
  } = options

  // State management
  const [state, setState] = useState(HOOK_STATES.IDLE)
  const [data, setData] = useState(initialData)
  const [error, setError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)
  const [lastFetch, setLastFetch] = useState(null)
  const [isStale, setIsStale] = useState(false)

  // Refs for cleanup and stability
  const mountedRef = useRef(true)
  const abortControllerRef = useRef(null)
  const retryTimeoutRef = useRef(null)
  const cacheRef = useRef(new Map())

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current)
      }
    }
  }, [])

  /**
   * Safe state update that checks if component is mounted
   */
  const safeSetState = useCallback((newState) => {
    if (mountedRef.current) {
      setState(newState)
    }
  }, [])

  const safeSetData = useCallback((newData) => {
    if (mountedRef.current) {
      setData(newData)
    }
  }, [])

  const safeSetError = useCallback((newError) => {
    if (mountedRef.current) {
      setError(newError)
    }
  }, [])

  /**
   * Get cached data if available and fresh
   */
  const getCachedData = useCallback(() => {
    if (!enableCache || !cacheKey) return null
    
    const cached = cacheRef.current.get(cacheKey)
    if (!cached) return null
    
    const isExpired = Date.now() - cached.timestamp > cacheTTL
    if (isExpired) {
      cacheRef.current.delete(cacheKey)
      return null
    }
    
    return cached.data
  }, [enableCache, cacheKey, cacheTTL])

  /**
   * Cache data with timestamp
   */
  const setCachedData = useCallback((newData) => {
    if (!enableCache || !cacheKey) return
    
    cacheRef.current.set(cacheKey, {
      data: newData,
      timestamp: Date.now()
    })
    
    // Cleanup old cache entries (keep last 50)
    if (cacheRef.current.size > 50) {
      const entries = Array.from(cacheRef.current.entries())
      const sorted = entries.sort((a, b) => b[1].timestamp - a[1].timestamp)
      cacheRef.current.clear()
      sorted.slice(0, 50).forEach(([key, value]) => {
        cacheRef.current.set(key, value)
      })
    }
  }, [enableCache, cacheKey])

  /**
   * Execute data fetching with comprehensive error handling
   */
  const fetchData = useCallback(async (isRetry = false) => {
    if (!dataFetcher || typeof dataFetcher !== 'function') {
      logger.warn('useResilientData: Invalid dataFetcher provided')
      return
    }

    // Check for cached data first
    if (!isRetry && enableCache) {
      const cachedData = getCachedData()
      if (cachedData) {
        safeSetData(cachedData)
        safeSetState(HOOK_STATES.SUCCESS)
        setIsStale(false)
        return cachedData
      }
    }

    const currentRetryCount = isRetry ? retryCount : 0
    
    if (!isRetry) {
      setRetryCount(0)
      safeSetState(HOOK_STATES.LOADING)
      safeSetError(null)
    } else {
      safeSetState(HOOK_STATES.RETRYING)
      if (onRetry) {
        try {
          onRetry(currentRetryCount)
        } catch (callbackError) {
          logger.warn('useResilientData: onRetry callback failed:', callbackError.message)
        }
      }
    }

    // Create abort controller for this request
    abortControllerRef.current = new AbortController()

    try {
      const result = await safeAsyncExecute(
        () => dataFetcher(abortControllerRef.current.signal),
        {
          timeout,
          retries: 1, // Handle retries manually for better control
          throwOnFailure: true
        }
      )

      // Process successful result
      if (mountedRef.current) {
        // Validate result data
        let processedData = result
        if (typeof result === 'string') {
          try {
            processedData = JSON.parse(result)
          } catch (parseError) {
            // Keep as string if not valid JSON
          }
        }

        safeSetData(processedData)
        safeSetState(HOOK_STATES.SUCCESS)
        safeSetError(null)
        setRetryCount(0)
        setLastFetch(Date.now())
        setIsStale(false)

        // Cache successful result
        setCachedData(processedData)

        // Success callback
        if (onSuccess) {
          try {
            onSuccess(processedData)
          } catch (callbackError) {
            logger.warn('useResilientData: onSuccess callback failed:', callbackError.message)
          }
        }

        return processedData
      }
    } catch (fetchError) {
      if (!mountedRef.current) return

      // Handle abort (not an error)
      if (fetchError.name === 'AbortError') {
        return
      }

      logger.warn('useResilientData: Fetch failed:', {
        error: fetchError.message,
        retryCount: currentRetryCount,
        maxRetries,
        dataFetcher: dataFetcher.name || 'anonymous'
      })

      // Determine if we should retry
      const shouldRetry = enableAutoRetry && 
                         currentRetryCount < maxRetries && 
                         !fetchError.nonRetryable

      if (shouldRetry) {
        setRetryCount(currentRetryCount + 1)
        
        // Calculate retry delay
        let delay = retryDelay
        if (exponentialBackoff) {
          delay = retryDelay * Math.pow(2, currentRetryCount)
        }
        
        // Schedule retry
        retryTimeoutRef.current = setTimeout(() => {
          fetchData(true)
        }, delay)
        
        return
      }

      // All retries exhausted or retry disabled
      safeSetError(fetchError)
      
      // Try fallback strategies
      const fallbackResult = await tryFallbackStrategies(fetchError)
      if (fallbackResult !== null) {
        return fallbackResult
      }

      // Final error state
      safeSetState(HOOK_STATES.ERROR)
      
      // Error callback
      if (onError) {
        try {
          onError(fetchError, currentRetryCount)
        } catch (callbackError) {
          logger.warn('useResilientData: onError callback failed:', callbackError.message)
        }
      }
    }
  }, [
    dataFetcher, 
    retryCount, 
    maxRetries, 
    retryDelay, 
    exponentialBackoff, 
    timeout,
    enableAutoRetry,
    enableCache,
    getCachedData,
    setCachedData,
    onSuccess,
    onError,
    onRetry
  ])

  /**
   * Try various fallback strategies when primary fetch fails
   */
  const tryFallbackStrategies = useCallback(async (fetchError) => {
    // Strategy 1: Use stale cached data
    if (enableCache) {
      const staleData = getCachedData()
      if (staleData && staleWhileRevalidate) {
        logger.info('useResilientData: Using stale cached data as fallback')
        safeSetData(staleData)
        safeSetState(HOOK_STATES.SUCCESS)
        setIsStale(true)
        return staleData
      }
    }

    // Strategy 2: Use provided fallback data
    if (enableFallback && fallbackData !== null) {
      logger.info('useResilientData: Using provided fallback data')
      safeSetData(fallbackData)
      safeSetState(HOOK_STATES.FALLBACK)
      
      if (onFallback) {
        try {
          onFallback(fallbackData, fetchError)
        } catch (callbackError) {
          logger.warn('useResilientData: onFallback callback failed:', callbackError.message)
        }
      }
      
      return fallbackData
    }

    // Strategy 3: Keep existing data if available
    if (data !== null && data !== initialData) {
      logger.info('useResilientData: Keeping existing data after fetch failure')
      safeSetState(HOOK_STATES.ERROR) // Show error state but keep data
      return data
    }

    return null
  }, [
    enableCache,
    getCachedData,
    staleWhileRevalidate,
    enableFallback,
    fallbackData,
    data,
    initialData,
    onFallback
  ])

  /**
   * Manual refresh function
   */
  const refresh = useCallback(() => {
    setRetryCount(0)
    return fetchData(false)
  }, [fetchData])

  /**
   * Clear all data and reset to initial state
   */
  const reset = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    if (retryTimeoutRef.current) {
      clearTimeout(retryTimeoutRef.current)
    }
    
    safeSetData(initialData)
    safeSetState(HOOK_STATES.IDLE)
    safeSetError(null)
    setRetryCount(0)
    setLastFetch(null)
    setIsStale(false)
  }, [initialData])

  /**
   * Clear cache for this data
   */
  const clearCache = useCallback(() => {
    if (cacheKey) {
      cacheRef.current.delete(cacheKey)
    }
  }, [cacheKey])

  // Auto-fetch on mount and dependency changes
  useEffect(() => {
    fetchData()
  }, deps)

  // Handle window focus refetch
  useEffect(() => {
    if (!refetchOnWindowFocus) return

    const handleFocus = () => {
      if (state === HOOK_STATES.SUCCESS && lastFetch) {
        const timeSinceLastFetch = Date.now() - lastFetch
        if (timeSinceLastFetch > 60000) { // Refetch if data is older than 1 minute
          fetchData()
        }
      }
    }

    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [refetchOnWindowFocus, state, lastFetch, fetchData])

  // Handle reconnect refetch
  useEffect(() => {
    if (!refetchOnReconnect) return

    const handleOnline = () => {
      if (state === HOOK_STATES.ERROR || state === HOOK_STATES.FALLBACK) {
        fetchData()
      }
    }

    window.addEventListener('online', handleOnline)
    return () => window.removeEventListener('online', handleOnline)
  }, [refetchOnReconnect, state, fetchData])

  // Computed states
  const isLoading = state === HOOK_STATES.LOADING
  const isRetrying = state === HOOK_STATES.RETRYING
  const isSuccess = state === HOOK_STATES.SUCCESS
  const isError = state === HOOK_STATES.ERROR
  const isFallback = state === HOOK_STATES.FALLBACK
  const hasData = data !== null && data !== initialData
  const canRetry = error && retryCount < maxRetries

  return {
    // Data
    data,
    error,
    
    // States
    state,
    isLoading,
    isRetrying,
    isSuccess,
    isError,
    isFallback,
    hasData,
    isStale,
    
    // Metadata
    retryCount,
    maxRetries,
    lastFetch,
    canRetry,
    
    // Actions
    refresh,
    reset,
    clearCache
  }
}

export default useResilientData