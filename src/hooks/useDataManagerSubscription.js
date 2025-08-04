/**
 * Enhanced DataManager React Hook with Automatic Memory Management
 * Provides safe subscription management with automatic cleanup
 */

import { useEffect, useRef, useCallback } from 'react'
import { dataManager } from '../services/DataManager.js'
import logger from '../utils/logger'

/**
 * Hook for managing DataManager subscriptions with automatic cleanup
 * @param {string} eventType - The event type to subscribe to
 * @param {function} callback - The callback function
 * @param {array} dependencies - Dependencies for the callback (like useCallback deps)
 */
export const useDataManagerSubscription = (eventType, callback, dependencies = []) => {
  const unsubscribeRef = useRef(null)
  const callbackRef = useRef(callback)
  
  // Update callback ref when dependencies change
  useEffect(() => {
    callbackRef.current = callback
  }, dependencies)
  
  // Stable callback that doesn't change on re-renders
  const stableCallback = useCallback((data) => {
    callbackRef.current(data)
  }, [])
  
  useEffect(() => {
    // Subscribe to the event
    unsubscribeRef.current = dataManager.subscribe(eventType, stableCallback)
    
    // Cleanup function
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
        unsubscribeRef.current = null
      }
    }
  }, [eventType, stableCallback])
  
  // Also cleanup on component unmount (double safety)
  useEffect(() => {
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current()
      }
    }
  }, [])
}

/**
 * Hook for safe DataManager access with disposal checking
 */
export const useSafeDataManager = () => {
  const checkDisposed = useCallback(() => {
    if (dataManager.disposed) {
      logger.warn('Attempting to use disposed DataManager')
      return true
    }
    return false
  }, [])
  
  const safeEmit = useCallback((eventType, data) => {
    if (!checkDisposed()) {
      dataManager.emit(eventType, data)
    }
  }, [checkDisposed])
  
  const safeSubscribe = useCallback((eventType, callback) => {
    if (!checkDisposed()) {
      return dataManager.subscribe(eventType, callback)
    }
    return () => {}
  }, [checkDisposed])
  
  const safeGetState = useCallback(() => {
    if (!checkDisposed()) {
      return dataManager.getState()
    }
    return null
  }, [checkDisposed])
  
  const safeGetBalance = useCallback(() => {
    if (!checkDisposed()) {
      return dataManager.getBalance()
    }
    return null
  }, [checkDisposed])
  
  const safeGetTransactions = useCallback(() => {
    if (!checkDisposed()) {
      return dataManager.getTransactions()
    }
    return []
  }, [checkDisposed])
  
  return {
    dataManager,
    emit: safeEmit,
    subscribe: safeSubscribe,
    getState: safeGetState,
    getBalance: safeGetBalance,
    getTransactions: safeGetTransactions,
    isDisposed: dataManager.disposed
  }
}