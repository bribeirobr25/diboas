/**
 * Error Recovery Hooks
 * React hooks for error handling, recovery, and resilience patterns
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import errorRecoveryService, { ERROR_TYPES, ERROR_SEVERITY, RECOVERY_STRATEGIES } from '../services/errorHandling/ErrorRecoveryService.js'
import logger from '../utils/logger.js'

/**
 * Main error recovery hook
 */
export function useErrorRecovery(options = {}) {
  const [errors, setErrors] = useState([])
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoveryStatus, setRecoveryStatus] = useState(null)
  const interventionListenerRef = useRef(null)

  const {
    autoRetry = true,
    maxRetries = 3,
    showNotifications = true,
    onError = null,
    onRecovery = null
  } = options

  // Handle error and attempt recovery
  const handleError = useCallback(async (error, context = {}) => {
    try {
      setIsRecovering(true)
      
      const errorData = {
        type: error.type || ERROR_TYPES.UNKNOWN_ERROR,
        severity: error.severity || ERROR_SEVERITY.MEDIUM,
        message: error.message || 'An error occurred',
        error: error.originalError || error,
        context: { ...context, component: options.componentName }
      }

      // Call recovery service
      const recoveryResult = await errorRecoveryService.handleError(errorData)
      
      // Update local state
      setErrors(prev => [{ ...errorData, id: recoveryResult.errorId, recoveryResult }, ...prev.slice(0, 9)])
      setRecoveryStatus(recoveryResult)

      // Call custom error handler
      if (onError) {
        onError(errorData, recoveryResult)
      }

      // Call custom recovery handler
      if (onRecovery && recoveryResult.canRecover) {
        onRecovery(recoveryResult)
      }

      return recoveryResult
    } catch (recoveryError) {
      logger.error('Error recovery failed:', recoveryError)
      return { success: false, error: recoveryError }
    } finally {
      setIsRecovering(false)
    }
  }, [onError, onRecovery, options.componentName])

  // Clear errors
  const clearErrors = useCallback(() => {
    setErrors([])
    setRecoveryStatus(null)
  }, [])

  // Retry specific operation
  const retryOperation = useCallback(async (operation, maxAttempts = maxRetries) => {
    let attempts = 0
    let lastError = null

    while (attempts < maxAttempts) {
      try {
        const result = await operation()
        
        // Reset retry count on success
        if (attempts > 0) {
          logger.info(`Operation succeeded after ${attempts + 1} attempts`)
        }
        
        return result
      } catch (error) {
        attempts++
        lastError = error
        
        if (attempts < maxAttempts) {
          const delay = Math.pow(2, attempts - 1) * 1000 // Exponential backoff
          logger.warn(`Operation failed (attempt ${attempts}/${maxAttempts}), retrying in ${delay}ms`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // All attempts failed
    await handleError({
      type: ERROR_TYPES.UNKNOWN_ERROR,
      severity: ERROR_SEVERITY.HIGH,
      message: `Operation failed after ${maxAttempts} attempts`,
      originalError: lastError
    })

    throw lastError
  }, [handleError, maxRetries])

  // Listen for user intervention events
  useEffect(() => {
    if (typeof window === 'undefined') return

    const handleIntervention = (event) => {
      const { errorId, type, message, severity } = event.detail
      
      setErrors(prev => prev.map(error => 
        error.id === errorId 
          ? { ...error, requiresIntervention: true, interventionType: type }
          : error
      ))
    }

    window.addEventListener('error-intervention-required', handleIntervention)
    interventionListenerRef.current = handleIntervention

    return () => {
      window.removeEventListener('error-intervention-required', handleIntervention)
    }
  }, [])

  return {
    errors,
    isRecovering,
    recoveryStatus,
    handleError,
    clearErrors,
    retryOperation,
    hasErrors: errors.length > 0,
    latestError: errors[0] || null
  }
}

/**
 * Hook for API call error handling with retry logic
 */
export function useApiErrorRecovery(apiFunction, dependencies = []) {
  const [data, setData] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)
  const { handleError, retryOperation } = useErrorRecovery()

  const execute = useCallback(async (...args) => {
    setLoading(true)
    setError(null)

    try {
      const result = await retryOperation(async () => {
        // Check circuit breaker
        const circuitCheck = errorRecoveryService.checkCircuitBreaker('api')
        if (!circuitCheck.canProceed) {
          throw new Error('Service temporarily unavailable due to circuit breaker')
        }

        return await apiFunction(...args)
      })

      setData(result)
      
      // Reset circuit breaker on success
      errorRecoveryService.resetCircuitBreaker('api')
      
      return result
    } catch (err) {
      const recoveryResult = await handleError({
        type: ERROR_TYPES.NETWORK_ERROR,
        severity: ERROR_SEVERITY.MEDIUM,
        message: 'API call failed',
        originalError: err
      }, { 
        endpoint: apiFunction.name,
        args: args.map(arg => typeof arg === 'object' ? '[Object]' : String(arg))
      })

      setError(err)
      throw err
    } finally {
      setLoading(false)
    }
  }, [apiFunction, handleError, retryOperation, ...dependencies])

  return { data, error, loading, execute, retry: execute }
}

/**
 * Hook for transaction error handling with rollback support
 */
export function useTransactionErrorRecovery() {
  const [transactionState, setTransactionState] = useState({
    inProgress: false,
    completed: false,
    failed: false,
    rollbackAvailable: false
  })
  const { handleError } = useErrorRecovery()
  const rollbackDataRef = useRef(null)

  const executeTransaction = useCallback(async (transactionFn, rollbackFn = null) => {
    setTransactionState({
      inProgress: true,
      completed: false,
      failed: false,
      rollbackAvailable: !!rollbackFn
    })

    // Store rollback function
    rollbackDataRef.current = rollbackFn

    try {
      const result = await transactionFn()
      
      setTransactionState({
        inProgress: false,
        completed: true,
        failed: false,
        rollbackAvailable: false
      })

      return result
    } catch (error) {
      setTransactionState({
        inProgress: false,
        completed: false,
        failed: true,
        rollbackAvailable: !!rollbackFn
      })

      await handleError({
        type: ERROR_TYPES.TRANSACTION_ERROR,
        severity: ERROR_SEVERITY.HIGH,
        message: 'Transaction failed',
        originalError: error
      }, { transactionType: transactionFn.name })

      throw error
    }
  }, [handleError])

  const rollback = useCallback(async () => {
    if (!rollbackDataRef.current) {
      throw new Error('No rollback function available')
    }

    try {
      await rollbackDataRef.current()
      
      setTransactionState({
        inProgress: false,
        completed: false,
        failed: false,
        rollbackAvailable: false
      })

      logger.info('Transaction rolled back successfully')
    } catch (rollbackError) {
      await handleError({
        type: ERROR_TYPES.TRANSACTION_ERROR,
        severity: ERROR_SEVERITY.CRITICAL,
        message: 'Rollback failed',
        originalError: rollbackError
      })

      throw rollbackError
    }
  }, [handleError])

  return {
    transactionState,
    executeTransaction,
    rollback,
    canRollback: transactionState.rollbackAvailable
  }
}

/**
 * Hook for component-level error boundaries
 */
export function useErrorBoundary() {
  const [hasError, setHasError] = useState(false)
  const [error, setError] = useState(null)
  const { handleError } = useErrorRecovery()

  const resetError = useCallback(() => {
    setHasError(false)
    setError(null)
  }, [])

  const captureError = useCallback(async (error, errorInfo = {}) => {
    setHasError(true)
    setError(error)

    await handleError({
      type: ERROR_TYPES.UNKNOWN_ERROR,
      severity: ERROR_SEVERITY.HIGH,
      message: error.message || 'Component error',
      originalError: error
    }, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    })
  }, [handleError])

  return {
    hasError,
    error,
    resetError,
    captureError
  }
}

/**
 * Hook for graceful degradation management
 */
export function useGracefulDegradation() {
  const [degradationLevel, setDegradationLevel] = useState('none')
  const [degradationConfig, setDegradationConfig] = useState({})
  const { handleError } = useErrorRecovery()

  const degradeService = useCallback(async (serviceType, reason) => {
    const result = await handleError({
      type: ERROR_TYPES.SERVICE_UNAVAILABLE,
      severity: ERROR_SEVERITY.MEDIUM,
      message: `Service degradation: ${serviceType}`,
      context: { serviceType, reason }
    })

    if (result.recoveryResult?.level) {
      setDegradationLevel(result.recoveryResult.level)
      setDegradationConfig(result.recoveryResult.config || {})
    }

    return result
  }, [handleError])

  const restoreService = useCallback(() => {
    setDegradationLevel('none')
    setDegradationConfig({})
    logger.info('Service restored from degraded state')
  }, [])

  return {
    degradationLevel,
    degradationConfig,
    degradeService,
    restoreService,
    isDegraded: degradationLevel !== 'none'
  }
}

/**
 * Hook for circuit breaker pattern
 */
export function useCircuitBreaker(serviceKey) {
  const [circuitState, setCircuitState] = useState('closed')
  const [failures, setFailures] = useState(0)
  const [nextAttempt, setNextAttempt] = useState(null)

  const checkCircuit = useCallback(() => {
    const status = errorRecoveryService.checkCircuitBreaker(serviceKey)
    setCircuitState(status.state)
    setNextAttempt(status.nextAttempt || null)
    return status
  }, [serviceKey])

  const resetCircuit = useCallback(() => {
    errorRecoveryService.resetCircuitBreaker(serviceKey)
    setCircuitState('closed')
    setFailures(0)
    setNextAttempt(null)
  }, [serviceKey])

  const executeWithCircuitBreaker = useCallback(async (operation) => {
    const status = checkCircuit()
    
    if (!status.canProceed) {
      throw new Error(`Circuit breaker is ${status.state}. Next attempt available at ${new Date(status.nextAttempt).toLocaleTimeString()}`)
    }

    try {
      const result = await operation()
      resetCircuit() // Reset on success
      return result
    } catch (error) {
      setFailures(prev => prev + 1)
      throw error
    }
  }, [checkCircuit, resetCircuit])

  return {
    circuitState,
    failures,
    nextAttempt,
    canProceed: circuitState !== 'open',
    executeWithCircuitBreaker,
    resetCircuit
  }
}

/**
 * Hook for error metrics and monitoring
 */
export function useErrorMetrics(timeWindow = 24 * 60 * 60 * 1000) {
  const [metrics, setMetrics] = useState(null)
  const [loading, setLoading] = useState(false)

  const refreshMetrics = useCallback(async () => {
    setLoading(true)
    try {
      const stats = errorRecoveryService.getErrorStatistics(timeWindow)
      setMetrics(stats)
    } catch (error) {
      logger.warn('Failed to fetch error metrics:', error)
    } finally {
      setLoading(false)
    }
  }, [timeWindow])

  useEffect(() => {
    refreshMetrics()
    
    // Refresh metrics every 5 minutes
    const interval = setInterval(refreshMetrics, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [refreshMetrics])

  return {
    metrics,
    loading,
    refreshMetrics
  }
}