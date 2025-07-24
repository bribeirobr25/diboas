/**
 * Hook for managing cleanup of services and preventing memory leaks
 * Ensures proper cleanup of intervals, timeouts, and event listeners
 */

import { useEffect, useRef } from 'react'

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
          console.warn('Error during cleanup:', error)
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
    const { dataManager } = require('../services/DataManager.js')
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
    const { rateLimiter } = require('../utils/advancedRateLimiter.js')
    
    // Register for cleanup on unmount
    addServiceCleanup(rateLimiter)
  }, [])

  // Return rate limiting functions
  return {
    checkAuthRateLimit: (...args) => {
      const { checkAuthRateLimit } = require('../utils/advancedRateLimiter.js')
      return checkAuthRateLimit(...args)
    },
    checkTransactionRateLimit: (...args) => {
      const { checkTransactionRateLimit } = require('../utils/advancedRateLimiter.js')
      return checkTransactionRateLimit(...args)
    },
    checkGeneralRateLimit: (...args) => {
      const { checkGeneralRateLimit } = require('../utils/advancedRateLimiter.js')
      return checkGeneralRateLimit(...args)
    }
  }
}

export default useCleanup