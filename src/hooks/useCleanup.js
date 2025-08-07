/**
 * Hook for managing cleanup of services and preventing memory leaks
 * Ensures proper cleanup of intervals, timeouts, and event listeners
 */

import { useEffect, useRef } from 'react'
import { dataManager } from '../services/DataManager.js'
import { rateLimiter, checkAuthRateLimit, checkTransactionRateLimit, checkGeneralRateLimit } from '../utils/advancedRateLimiter.js'
import logger from '../utils/logger'

export const useCleanup = () => {
  const cleanupFunctions = useRef([])

  const addCleanup = (cleanupFunction) => {
    cleanupFunctions.current.push(cleanupFunction)
  }

  const addTimer = (timer) => {
    addCleanup(() => clearTimeout(timer))
    return timer
  }

  const addInterval = (interval) => {
    addCleanup(() => clearInterval(interval))
    return interval
  }

  const addEventListener = (element, event, handler, options) => {
    element.addEventListener(event, handler, options)
    addCleanup(() => element.removeEventListener(event, handler, options))
  }

  const addServiceCleanup = (service) => {
    if (service && typeof service.destroy === 'function') {
      addCleanup(() => service.destroy())
    }
  }

  useEffect(() => {
    return () => {
      // Run all cleanup functions when component unmounts
      cleanupFunctions.current.forEach(cleanup => {
        try {
          cleanup()
        } catch (error) {
          logger.warn('Error during cleanup:', error)
        }
      })
      cleanupFunctions.current = []
    }
  }, [])

  return {
    addCleanup,
    addTimer,
    addInterval,
    addEventListener,
    addServiceCleanup
  }
}

/**
 * Hook for managing DataManager subscriptions with automatic cleanup
 */
export const useDataManagerSubscription = (eventName, handler, dependencies = []) => {
  const { addCleanup } = useCleanup()

  useEffect(() => {
    const unsubscribe = dataManager.subscribe(eventName, handler)
    
    addCleanup(unsubscribe)

    return unsubscribe
  }, dependencies)
}

/**
 * Hook for managing rate limiter with proper cleanup
 */
export const useRateLimiter = () => {
  const { addServiceCleanup } = useCleanup()

  useEffect(() => {
    // Register for cleanup on unmount
    addServiceCleanup(rateLimiter)
  }, [])

  // Return rate limiting functions
  return {
    checkAuthRateLimit: (...args) => {
      return checkAuthRateLimit(...args)
    },
    checkTransactionRateLimit: (...args) => {
      return checkTransactionRateLimit(...args)
    },
    checkGeneralRateLimit: (...args) => {
      return checkGeneralRateLimit(...args)
    }
  }
}

export default useCleanup