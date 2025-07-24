/**
 * Transaction Status Hook for React Components
 * Provides real-time transaction status updates with WebSocket simulation
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { transactionStatusService, TRANSACTION_STATUS } from '../services/transactions/TransactionStatusService.js'
import { dataManager } from '../services/DataManager.js'
import secureLogger from '../utils/secureLogger.js'

/**
 * Hook for tracking individual transaction status
 */
export function useTransactionStatus(transactionId) {
  const [status, setStatus] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [connectionStatus, setConnectionStatus] = useState({ connected: false })

  useEffect(() => {
    if (!transactionId) return

    // Get initial status
    const initialStatus = transactionStatusService.getTransactionStatus(transactionId)
    if (initialStatus) {
      setStatus(initialStatus)
      setIsLoading(false)
    } else {
      setIsLoading(true)
    }

    // Subscribe to status updates for this specific transaction
    const unsubscribe = dataManager.subscribe(`transaction:${transactionId}:status`, (statusData) => {
      setStatus(statusData)
      setIsLoading(false)
      setError(null)
    })

    // Subscribe to connection status
    const unsubscribeConnection = dataManager.subscribe('transaction-status:connection', (connectionData) => {
      setConnectionStatus(connectionData)
      if (!connectionData.connected) {
        setError('Connection lost')
      }
    })

    // Subscribe to errors
    const unsubscribeError = dataManager.subscribe('transaction-status:error', (errorData) => {
      setError(errorData.error)
    })

    return () => {
      unsubscribe()
      unsubscribeConnection()
      unsubscribeError()
    }
  }, [transactionId])

  const retry = useCallback(async () => {
    if (!transactionId) return

    setError(null)
    setIsLoading(true)
    
    try {
      // Reconnect service if needed
      if (!connectionStatus.connected) {
        await transactionStatusService.connect()
      }
      
      const currentStatus = transactionStatusService.getTransactionStatus(transactionId)
      setStatus(currentStatus)
    } catch (err) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }, [transactionId, connectionStatus.connected])

  return {
    status,
    isLoading,
    error,
    connectionStatus,
    retry,
    isCompleted: status?.status === TRANSACTION_STATUS.COMPLETED,
    isFailed: status?.status === TRANSACTION_STATUS.FAILED,
    isTimeout: status?.status === TRANSACTION_STATUS.TIMEOUT
  }
}

/**
 * Hook for managing multiple transaction statuses
 */
export function useTransactionStatusManager() {
  const [activeTransactions, setActiveTransactions] = useState([])
  const [connectionStatus, setConnectionStatus] = useState({ connected: false })
  const [isInitialized, setIsInitialized] = useState(false)
  const serviceRef = useRef(transactionStatusService)

  // Initialize service connection
  useEffect(() => {
    const initializeService = async () => {
      try {
        if (!serviceRef.current.isConnected) {
          await serviceRef.current.connect()
        }
        setIsInitialized(true)
      } catch (error) {
        secureLogger.audit('TRANSACTION_STATUS_HOOK_INIT_ERROR', {
          error: error.message
        })
      }
    }

    initializeService()

    // Subscribe to global status updates
    const unsubscribeStatus = dataManager.subscribe('transaction-status:update', (statusData) => {
      setActiveTransactions(prev => {
        const updated = [...prev]
        const index = updated.findIndex(tx => tx.id === statusData.id)
        
        if (index >= 0) {
          updated[index] = { ...updated[index], ...statusData }
        } else {
          updated.push(statusData)
        }
        
        // Remove completed transactions after delay
        return updated.filter(tx => 
          tx.status !== TRANSACTION_STATUS.COMPLETED || 
          Date.now() - new Date(tx.lastUpdate).getTime() < 30000
        )
      })
    })

    // Subscribe to connection status
    const unsubscribeConnection = dataManager.subscribe('transaction-status:connection', (connectionData) => {
      setConnectionStatus(connectionData)
    })

    // Subscribe to completed transactions
    const unsubscribeCompleted = dataManager.subscribe('transaction:completed', (completedData) => {
      // This can be used to trigger balance updates or other side effects
      secureLogger.audit('TRANSACTION_STATUS_HOOK_COMPLETED', {
        transactionId: completedData.id,
        type: completedData.type
      })
    })

    return () => {
      unsubscribeStatus()
      unsubscribeConnection()
      unsubscribeCompleted()
    }
  }, [])

  /**
   * Start tracking a new transaction
   */
  const startTracking = useCallback(async (transactionData) => {
    try {
      const transaction = await serviceRef.current.startTracking(transactionData)
      
      setActiveTransactions(prev => {
        const updated = prev.filter(tx => tx.id !== transaction.id)
        return [...updated, {
          id: transaction.id,
          type: transaction.type,
          asset: transaction.asset,
          amount: transaction.amount,
          status: transaction.status,
          progress: 0,
          lastUpdate: transaction.lastUpdate || new Date().toISOString()
        }]
      })
      
      return transaction
    } catch (error) {
      secureLogger.audit('TRANSACTION_STATUS_HOOK_START_ERROR', {
        error: error.message,
        transactionId: transactionData.id
      })
      throw error
    }
  }, [])

  /**
   * Get status for specific transaction
   */
  const getTransactionStatus = useCallback((transactionId) => {
    return serviceRef.current.getTransactionStatus(transactionId)
  }, [])

  /**
   * Get all active transactions
   */
  const getAllActiveTransactions = useCallback(() => {
    return serviceRef.current.getAllActiveTransactions()
  }, [])

  /**
   * Get service health
   */
  const getServiceHealth = useCallback(() => {
    return serviceRef.current.getHealthStatus()
  }, [])

  /**
   * Reconnect service
   */
  const reconnect = useCallback(async () => {
    try {
      await serviceRef.current.connect()
    } catch (error) {
      secureLogger.audit('TRANSACTION_STATUS_HOOK_RECONNECT_ERROR', {
        error: error.message
      })
      throw error
    }
  }, [])

  return {
    // State
    activeTransactions,
    connectionStatus,
    isInitialized,
    
    // Actions
    startTracking,
    getTransactionStatus,
    getAllActiveTransactions,
    getServiceHealth,
    reconnect,
    
    // Computed
    isConnected: connectionStatus.connected,
    hasActiveTransactions: activeTransactions.length > 0,
    completedCount: activeTransactions.filter(tx => tx.status === TRANSACTION_STATUS.COMPLETED).length,
    failedCount: activeTransactions.filter(tx => tx.status === TRANSACTION_STATUS.FAILED).length
  }
}

/**
 * Hook for transaction progress display
 */
export function useTransactionProgress(transactionId) {
  const { status, isLoading, error } = useTransactionStatus(transactionId)
  
  const getProgressText = useCallback(() => {
    if (!status) return 'Initializing...'
    
    switch (status.status) {
      case TRANSACTION_STATUS.PENDING:
        return 'Transaction pending...'
      case TRANSACTION_STATUS.PROCESSING:
        return 'Processing transaction...'
      case TRANSACTION_STATUS.CONFIRMING:
        return `Confirming... (${status.confirmations}/${status.requiredConfirmations})`
      case TRANSACTION_STATUS.COMPLETED:
        return 'Transaction completed!'
      case TRANSACTION_STATUS.FAILED:
        return 'Transaction failed'
      case TRANSACTION_STATUS.TIMEOUT:
        return 'Transaction timed out'
      default:
        return 'Unknown status'
    }
  }, [status])

  const getProgressColor = useCallback(() => {
    if (!status) return 'blue'
    
    switch (status.status) {
      case TRANSACTION_STATUS.PENDING:
      case TRANSACTION_STATUS.PROCESSING:
      case TRANSACTION_STATUS.CONFIRMING:
        return 'blue'
      case TRANSACTION_STATUS.COMPLETED:
        return 'green'
      case TRANSACTION_STATUS.FAILED:
      case TRANSACTION_STATUS.TIMEOUT:
        return 'red'
      default:
        return 'gray'
    }
  }, [status])

  const formatTimeRemaining = useCallback((seconds) => {
    if (seconds <= 0) return null
    
    if (seconds < 60) {
      return `~${seconds}s`
    } else if (seconds < 3600) {
      return `~${Math.ceil(seconds / 60)}m`
    } else {
      return `~${Math.ceil(seconds / 3600)}h`
    }
  }, [])

  return {
    status,
    isLoading,
    error,
    progress: status?.progress || 0,
    progressText: getProgressText(),
    progressColor: getProgressColor(),
    timeRemaining: status?.estimatedTimeRemaining ? formatTimeRemaining(status.estimatedTimeRemaining) : null,
    onChainHash: status?.onChainHash,
    confirmations: status?.confirmations || 0,
    requiredConfirmations: status?.requiredConfirmations || 1
  }
}

/**
 * Hook for balance updates from completed transactions
 */
export function useTransactionBalanceUpdates() {
  const [pendingUpdates, setPendingUpdates] = useState([])

  useEffect(() => {
    const unsubscribe = dataManager.subscribe('transaction:completed', (completedData) => {
      setPendingUpdates(prev => [...prev, {
        id: completedData.id,
        type: completedData.type,
        asset: completedData.asset,
        amount: completedData.amount,
        timestamp: completedData.timestamp,
        processed: false
      }])

      // Auto-remove after processing delay
      setTimeout(() => {
        setPendingUpdates(prev => prev.filter(update => update.id !== completedData.id))
      }, 5000)
    })

    return unsubscribe
  }, [])

  const markAsProcessed = useCallback((updateId) => {
    setPendingUpdates(prev => 
      prev.map(update => 
        update.id === updateId ? { ...update, processed: true } : update
      )
    )
  }, [])

  return {
    pendingUpdates: pendingUpdates.filter(update => !update.processed),
    allUpdates: pendingUpdates,
    markAsProcessed
  }
}

export {
  TRANSACTION_STATUS
}

export default {
  useTransactionStatus,
  useTransactionStatusManager,
  useTransactionProgress,
  useTransactionBalanceUpdates
}