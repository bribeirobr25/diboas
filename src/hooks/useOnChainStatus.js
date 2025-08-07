/**
 * On-Chain Transaction Status Hook
 * Manages blockchain transaction confirmation and status updates
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { mockOnChainStatusProvider, TRANSACTION_STATUS } from '../services/onchain/OnChainStatusProvider.js'
import logger from '../utils/logger'

/**
 * Hook for managing on-chain transaction status
 * @param {string} transactionId - Transaction ID to track
 * @param {Object} options - Configuration options
 * @returns {Object} Status data and control functions
 */
export const useOnChainStatus = (transactionId, options = {}) => {
  const {
    pollInterval = 2000, // Poll every 2 seconds
    timeout = 30000, // 30 second timeout
    onConfirmed = null,
    onFailed = null,
    onTimeout = null
  } = options

  const [status, setStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  
  const pollIntervalRef = useRef(null)
  const timeoutRef = useRef(null)
  const mountedRef = useRef(true)

  /**
   * Start polling for transaction status
   */
  const startPolling = useCallback(() => {
    if (!transactionId || pollIntervalRef.current) return

    setIsLoading(true)
    setError(null)

    pollIntervalRef.current = setInterval(() => {
      if (!mountedRef.current) return

      try {
        const currentStatus = mockOnChainStatusProvider.getTransactionStatus(transactionId)
        
        if (currentStatus) {
          setStatus(currentStatus)
          
          // Handle status changes
          if (currentStatus.status === TRANSACTION_STATUS.CONFIRMED) {
            stopPolling()
            setIsLoading(false)
            onConfirmed?.(currentStatus)
          } else if (currentStatus.status === TRANSACTION_STATUS.FAILED) {
            stopPolling()
            setIsLoading(false)
            setError(currentStatus.error || 'Transaction failed')
            onFailed?.(currentStatus)
          }
        }
      } catch (err) {
        logger.error('Error polling transaction status:', err)
        setError(err.message)
      }
    }, pollInterval)

    // Set timeout
    timeoutRef.current = setTimeout(() => {
      if (!mountedRef.current) return
      
      stopPolling()
      setIsLoading(false)
      setError('Transaction confirmation timeout')
      onTimeout?.()
    }, timeout)
  }, [transactionId, pollInterval, timeout, onConfirmed, onFailed, onTimeout])

  /**
   * Stop polling for transaction status
   */
  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
      timeoutRef.current = null
    }
  }, [])

  /**
   * Manually refresh transaction status
   */
  const refreshStatus = useCallback(async () => {
    if (!transactionId) return

    try {
      setError(null)
      const currentStatus = mockOnChainStatusProvider.getTransactionStatus(transactionId)
      setStatus(currentStatus)
      return currentStatus
    } catch (err) {
      setError(err.message)
      return null
    }
  }, [transactionId])

  /**
   * Cancel transaction if possible
   */
  const cancelTransaction = useCallback(async () => {
    if (!transactionId) return

    try {
      setError(null)
      const result = await mockOnChainStatusProvider.cancelTransaction(transactionId)
      
      if (result.success) {
        // Refresh status after cancellation
        await refreshStatus()
      } else {
        setError(result.error)
      }
      
      return result
    } catch (err) {
      setError(err.message)
      return { success: false, error: err.message }
    }
  }, [transactionId, refreshStatus])

  // Start polling when transaction ID is provided
  useEffect(() => {
    if (transactionId) {
      startPolling()
    }

    return () => {
      stopPolling()
    }
  }, [transactionId, startPolling, stopPolling])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      mountedRef.current = false
      stopPolling()
    }
  }, [stopPolling])

  // Derived state
  const isPending = status?.status === TRANSACTION_STATUS.PENDING
  const isConfirming = status?.status === TRANSACTION_STATUS.CONFIRMING
  const isConfirmed = status?.status === TRANSACTION_STATUS.CONFIRMED
  const isFailed = status?.status === TRANSACTION_STATUS.FAILED
  const isTimeout = status?.status === TRANSACTION_STATUS.TIMEOUT

  const progress = status ? {
    current: status.confirmations || 0,
    required: status.requiredConfirmations || 1,
    percentage: Math.min(100, ((status.confirmations || 0) / (status.requiredConfirmations || 1)) * 100)
  } : null

  return {
    // Status data
    status,
    isLoading,
    error,
    
    // Status flags
    isPending,
    isConfirming,
    isConfirmed,
    isFailed,
    isTimeout,
    
    // Progress information
    progress,
    
    // Explorer link
    explorerLink: status?.explorerLink,
    
    // Transaction details
    txHash: status?.txHash,
    chain: status?.chain,
    
    // Control functions
    startPolling,
    stopPolling,
    refreshStatus,
    cancelTransaction
  }
}

/**
 * Hook for monitoring multiple transactions
 * @param {string[]} transactionIds - Array of transaction IDs to track
 * @returns {Object} Status data for all transactions
 */
export const useMultipleOnChainStatus = (transactionIds = []) => {
  const [statuses, setStatuses] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  
  const pollIntervalRef = useRef(null)
  const mountedRef = useRef(true)

  const startPolling = useCallback(() => {
    if (transactionIds.length === 0 || pollIntervalRef.current) return

    setIsLoading(true)

    pollIntervalRef.current = setInterval(() => {
      if (!mountedRef.current) return

      const newStatuses = {}
      const newErrors = {}

      transactionIds.forEach(txId => {
        try {
          const status = mockOnChainStatusProvider.getTransactionStatus(txId)
          if (status) {
            newStatuses[txId] = status
          }
        } catch (err) {
          newErrors[txId] = err.message
        }
      })

      setStatuses(newStatuses)
      setErrors(newErrors)
      
      // Stop polling if all transactions are complete
      const allComplete = Object.values(newStatuses).every(status => 
        status.status === TRANSACTION_STATUS.CONFIRMED || 
        status.status === TRANSACTION_STATUS.FAILED
      )
      
      if (allComplete && Object.keys(newStatuses).length === transactionIds.length) {
        stopPolling()
        setIsLoading(false)
      }
    }, 2000)
  }, [transactionIds])

  const stopPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current)
      pollIntervalRef.current = null
    }
    setIsLoading(false)
  }, [])

  useEffect(() => {
    if (transactionIds.length > 0) {
      startPolling()
    }

    return () => {
      stopPolling()
    }
  }, [transactionIds, startPolling, stopPolling])

  useEffect(() => {
    return () => {
      mountedRef.current = false
      stopPolling()
    }
  }, [stopPolling])

  return {
    statuses,
    errors,
    isLoading,
    startPolling,
    stopPolling
  }
}

export default useOnChainStatus