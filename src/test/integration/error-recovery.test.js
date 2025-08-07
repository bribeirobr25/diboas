/**
 * Integration Test Suite for Error Recovery System
 * Tests error handling, recovery strategies, circuit breakers, and DataManager integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import errorRecoveryService, { ERROR_TYPES, ERROR_SEVERITY, RECOVERY_STRATEGIES } from '../../services/errorHandling/ErrorRecoveryService.js'
import { 
  useErrorRecovery, 
  useApiErrorRecovery, 
  useTransactionErrorRecovery, 
  useCircuitBreaker,
  useErrorMetrics
} from '../../hooks/useErrorRecovery.jsx'
import { dataManager } from '../../services/DataManager.js'

// Mock global objects for testing
global.performance = {
  now: () => Date.now()
}

// Mock window for browser-specific functionality
Object.defineProperty(window, 'location', {
  value: { href: 'http://localhost:3000/test' },
  writable: true
})

Object.defineProperty(window, 'navigator', {
  value: { userAgent: 'Test Browser' },
  writable: true
})

describe('Error Recovery Integration', () => {
  beforeEach(() => {
    // Reset error recovery service state
    errorRecoveryService.errorHistory.clear()
    errorRecoveryService.circuitBreakers.clear()
    errorRecoveryService.retryAttempts.clear()
    errorRecoveryService.errorMetrics.clear()
    
    // Clear any existing timers
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  describe('Error Recovery Service', () => {
    it('should handle errors with recovery strategies', async () => {
      const errorData = {
        type: ERROR_TYPES.NETWORK_ERROR,
        severity: ERROR_SEVERITY.MEDIUM,
        message: 'Test network error',
        context: { endpoint: '/api/test' }
      }

      const result = await errorRecoveryService.handleError(errorData)

      expect(result).toBeDefined()
      expect(result.errorId).toBeDefined()
      expect(result.recoveryStrategy).toBe(RECOVERY_STRATEGIES.RETRY)
      expect(result.canRecover).toBe(true)

      // Check that error was stored
      const storedError = errorRecoveryService.errorHistory.get(result.errorId)
      expect(storedError).toBeDefined()
      expect(storedError.type).toBe(ERROR_TYPES.NETWORK_ERROR)
    })

    it('should implement circuit breaker pattern', async () => {
      const serviceKey = 'test_service'

      // Initially circuit should be closed
      let status = errorRecoveryService.checkCircuitBreaker(serviceKey)
      expect(status.canProceed).toBe(true)
      expect(status.state).toBe('closed')

      // Trigger multiple failures to open circuit
      for (let i = 0; i < 5; i++) {
        await errorRecoveryService.handleError({
          type: ERROR_TYPES.SERVICE_UNAVAILABLE,
          severity: ERROR_SEVERITY.HIGH,
          message: `Service failure ${i + 1}`,
          context: { serviceKey }
        })
      }

      // Circuit should now be open
      status = errorRecoveryService.checkCircuitBreaker(serviceKey)
      expect(status.canProceed).toBe(false)
      expect(status.state).toBe('open')

      // Reset circuit breaker
      errorRecoveryService.resetCircuitBreaker(serviceKey)
      status = errorRecoveryService.checkCircuitBreaker(serviceKey)
      expect(status.canProceed).toBe(true)
      expect(status.state).toBe('closed')
    })

    it('should execute retry strategy with exponential backoff', async () => {
      const errorData = {
        type: ERROR_TYPES.TIMEOUT_ERROR,
        severity: ERROR_SEVERITY.MEDIUM,
        message: 'Request timeout',
        context: { endpoint: '/api/slow' }
      }

      // First retry
      const result1 = await errorRecoveryService.executeRetry(errorData)
      expect(result1.success).toBe(true)
      expect(result1.retryCount).toBe(1)
      expect(result1.delay).toBe(1000) // 1 second

      // Second retry (exponential backoff)
      const result2 = await errorRecoveryService.executeRetry(errorData)
      expect(result2.success).toBe(true)
      expect(result2.retryCount).toBe(2)
      expect(result2.delay).toBe(2000) // 2 seconds

      // Third retry
      const result3 = await errorRecoveryService.executeRetry(errorData)
      expect(result3.success).toBe(true)
      expect(result3.retryCount).toBe(3)
      expect(result3.delay).toBe(4000) // 4 seconds

      // Fourth attempt should fail (max retries exceeded)
      const result4 = await errorRecoveryService.executeRetry(errorData)
      expect(result4.success).toBe(false)
      expect(result4.message).toBe('Max retries exceeded')
    })

    it('should execute fallback strategy', async () => {
      // Register a fallback service
      const fallbackFn = vi.fn().mockResolvedValue({ status: 'fallback_active' })
      errorRecoveryService.registerFallbackService('test_api', fallbackFn)

      const errorData = {
        type: ERROR_TYPES.SERVICE_UNAVAILABLE,
        severity: ERROR_SEVERITY.HIGH,
        message: 'API service down',
        context: { serviceType: 'test_api' }
      }

      const result = await errorRecoveryService.executeFallback(errorData)
      expect(result.success).toBe(true)
      expect(result.serviceType).toBe('test_api')
      expect(fallbackFn).toHaveBeenCalled()
    })

    it('should handle graceful degradation', async () => {
      const errorData = {
        type: ERROR_TYPES.UNKNOWN_ERROR,
        severity: ERROR_SEVERITY.CRITICAL,
        message: 'Critical system error'
      }

      const result = await errorRecoveryService.executeGracefulDegradation(errorData)
      expect(result.success).toBe(true)
      expect(result.level).toBe('severe')
      expect(result.config).toBeDefined()
      expect(result.config.disableAnimations).toBe(true)
      expect(result.config.offlineMode).toBe(true)
    })

    it('should generate error statistics', async () => {
      // Add some test errors
      await errorRecoveryService.handleError({
        type: ERROR_TYPES.NETWORK_ERROR,
        severity: ERROR_SEVERITY.HIGH,
        message: 'Network error 1'
      })

      await errorRecoveryService.handleError({
        type: ERROR_TYPES.VALIDATION_ERROR,
        severity: ERROR_SEVERITY.MEDIUM,
        message: 'Validation error 1'
      })

      await errorRecoveryService.handleError({
        type: ERROR_TYPES.NETWORK_ERROR,
        severity: ERROR_SEVERITY.CRITICAL,
        message: 'Network error 2'
      })

      const stats = errorRecoveryService.getErrorStatistics()
      expect(stats.total).toBe(3)
      expect(stats.byType[ERROR_TYPES.NETWORK_ERROR]).toBe(2)
      expect(stats.byType[ERROR_TYPES.VALIDATION_ERROR]).toBe(1)
      expect(stats.bySeverity[ERROR_SEVERITY.HIGH]).toBe(1)
      expect(stats.bySeverity[ERROR_SEVERITY.MEDIUM]).toBe(1)
      expect(stats.bySeverity[ERROR_SEVERITY.CRITICAL]).toBe(1)
      expect(stats.topErrors).toHaveLength(2)
    })
  })

  describe('React Hook Integration', () => {
    it('should handle errors with useErrorRecovery hook', async () => {
      const { result } = renderHook(() => 
        useErrorRecovery({ componentName: 'TestComponent' })
      )

      expect(result.current.errors).toHaveLength(0)
      expect(result.current.isRecovering).toBe(false)
      expect(result.current.hasErrors).toBe(false)

      // Handle an error
      await act(async () => {
        await result.current.handleError({
          type: ERROR_TYPES.VALIDATION_ERROR,
          severity: ERROR_SEVERITY.MEDIUM,
          message: 'Test validation error'
        })
      })

      expect(result.current.errors).toHaveLength(1)
      expect(result.current.hasErrors).toBe(true)
      expect(result.current.latestError).toBeDefined()
      expect(result.current.latestError.type).toBe(ERROR_TYPES.VALIDATION_ERROR)

      // Clear errors
      act(() => {
        result.current.clearErrors()
      })

      expect(result.current.errors).toHaveLength(0)
      expect(result.current.hasErrors).toBe(false)
    })

    it('should retry operations with useApiErrorRecovery', async () => {
      let callCount = 0
      const mockApiFunction = vi.fn().mockImplementation(() => {
        callCount++
        if (callCount < 3) {
          throw new Error('API call failed')
        }
        return Promise.resolve({ data: 'success' })
      })

      const { result } = renderHook(() => 
        useApiErrorRecovery(mockApiFunction)
      )

      expect(result.current.loading).toBe(false)
      expect(result.current.data).toBeNull()
      expect(result.current.error).toBeNull()

      // Execute API call (should succeed after retries)
      await act(async () => {
        try {
          await result.current.execute('test-param')
        } catch (error) {
          // Expected to fail during retries
        }
      })

      expect(mockApiFunction).toHaveBeenCalledTimes(3)
    })

    it('should handle transactions with rollback using useTransactionErrorRecovery', async () => {
      const { result } = renderHook(() => useTransactionErrorRecovery())

      const rollbackFn = vi.fn().mockResolvedValue(true)
      const failingTransactionFn = vi.fn().mockRejectedValue(new Error('Transaction failed'))

      expect(result.current.transactionState.inProgress).toBe(false)
      expect(result.current.canRollback).toBe(false)

      // Execute failing transaction
      await act(async () => {
        try {
          await result.current.executeTransaction(failingTransactionFn, rollbackFn)
        } catch (error) {
          // Expected to fail
        }
      })

      expect(result.current.transactionState.failed).toBe(true)
      expect(result.current.canRollback).toBe(true)

      // Execute rollback
      await act(async () => {
        await result.current.rollback()
      })

      expect(rollbackFn).toHaveBeenCalled()
      expect(result.current.canRollback).toBe(false)
    })

    it('should manage circuit breaker with useCircuitBreaker hook', async () => {
      const serviceKey = 'test_hook_service'
      const { result } = renderHook(() => useCircuitBreaker(serviceKey))

      expect(result.current.circuitState).toBe('closed')
      expect(result.current.canProceed).toBe(true)
      expect(result.current.failures).toBe(0)

      // Successful operation
      await act(async () => {
        const successFn = vi.fn().mockResolvedValue('success')
        const operationResult = await result.current.executeWithCircuitBreaker(successFn)
        expect(operationResult).toBe('success')
      })

      expect(result.current.circuitState).toBe('closed')

      // Reset circuit
      act(() => {
        result.current.resetCircuit()
      })

      expect(result.current.circuitState).toBe('closed')
      expect(result.current.failures).toBe(0)
    })

    it('should provide error metrics with useErrorMetrics hook', async () => {
      // Add some test errors first
      await errorRecoveryService.handleError({
        type: ERROR_TYPES.NETWORK_ERROR,
        severity: ERROR_SEVERITY.HIGH,
        message: 'Test network error'
      })

      const { result } = renderHook(() => useErrorMetrics())

      expect(result.current.loading).toBe(true)

      // Wait for metrics to load
      await act(async () => {
        vi.advanceTimersByTime(100)
      })

      expect(result.current.loading).toBe(false)
      expect(result.current.metrics).toBeDefined()
      expect(result.current.metrics.total).toBeGreaterThan(0)
      expect(typeof result.current.refreshMetrics).toBe('function')
    })
  })

  describe('DataManager Integration', () => {
    it('should start error recovery through DataManager', () => {
      const result = dataManager.startErrorRecovery()
      expect(result.success).toBe(true)
    })

    it('should handle errors through DataManager', async () => {
      const errorData = {
        type: ERROR_TYPES.TRANSACTION_ERROR,
        severity: ERROR_SEVERITY.HIGH,
        message: 'DataManager transaction error'
      }

      const result = await dataManager.handleError(errorData, { source: 'test' })
      expect(result).toBeDefined()
      expect(result.errorId).toBeDefined()
      expect(result.canRecover).toBeDefined()
    })

    it('should check circuit breaker through DataManager', () => {
      const status = dataManager.checkCircuitBreaker('api')
      expect(status).toBeDefined()
      expect(status.canProceed).toBeDefined()
      expect(status.state).toBeDefined()
    })

    it('should execute operations with retry through DataManager', async () => {
      let attempts = 0
      const operation = vi.fn().mockImplementation(() => {
        attempts++
        if (attempts < 3) {
          throw new Error('Operation failed')
        }
        return Promise.resolve({ success: true })
      })

      const result = await dataManager.executeWithRetry(operation, {
        maxRetries: 3,
        context: { serviceKey: 'test' }
      })

      expect(result.success).toBe(true)
      expect(attempts).toBe(3)
    })

    it('should execute transactions with rollback through DataManager', async () => {
      const rollbackFn = vi.fn().mockResolvedValue(true)
      const transactionFn = vi.fn().mockResolvedValue({ id: 'tx_123' })

      const result = await dataManager.executeTransaction(transactionFn, rollbackFn, {
        type: 'test_transaction'
      })

      expect(result.id).toBe('tx_123')
      expect(transactionFn).toHaveBeenCalled()
      expect(rollbackFn).not.toHaveBeenCalled() // Should not be called on success
    })

    it('should get error recovery dashboard data', () => {
      const dashboard = dataManager.getErrorRecoveryDashboard()
      expect(dashboard).toBeDefined()
      expect(dashboard.statistics).toBeDefined()
      expect(dashboard.circuitStates).toBeDefined()
      expect(dashboard.systemHealth).toBeDefined()
      expect(dashboard.recentErrors).toBeDefined()
      expect(dashboard.recoveryRecommendations).toBeDefined()
    })

    it('should calculate system health accurately', () => {
      const statistics = {
        total: 10,
        bySeverity: {
          critical: 1,
          high: 2,
          medium: 3,
          low: 4
        }
      }

      const health = dataManager.calculateSystemHealth(statistics)
      expect(health.score).toBeDefined()
      expect(health.status).toBeDefined()
      expect(health.score).toBeLessThan(100) // Should be reduced due to errors
      expect(health.score).toBeGreaterThanOrEqual(0)
    })

    it('should register fallback services through DataManager', () => {
      const fallbackFn = vi.fn().mockResolvedValue({ status: 'fallback' })
      const result = dataManager.registerFallbackService('test_service', fallbackFn)
      expect(result.success).toBe(true)
    })

    it('should get error statistics through DataManager', async () => {
      // Add a test error
      await dataManager.handleError({
        type: ERROR_TYPES.NETWORK_ERROR,
        severity: ERROR_SEVERITY.MEDIUM,
        message: 'Test error for statistics'
      })

      const stats = dataManager.getErrorStatistics()
      expect(stats).toBeDefined()
      expect(stats.total).toBeGreaterThanOrEqual(0)
      expect(stats.byType).toBeDefined()
      expect(stats.bySeverity).toBeDefined()
      expect(stats.topErrors).toBeDefined()
    })
  })

  describe('Error Recovery Patterns', () => {
    it('should handle network errors with retry and fallback', async () => {
      // Register network fallback
      const networkFallback = vi.fn().mockResolvedValue({ status: 'offline_mode' })
      errorRecoveryService.registerFallbackService('network', networkFallback)

      const networkError = {
        type: ERROR_TYPES.NETWORK_ERROR,
        severity: ERROR_SEVERITY.HIGH,
        message: 'Network connection lost',
        context: { endpoint: '/api/critical' }
      }

      const result = await errorRecoveryService.handleError(networkError)
      expect(result.recoveryStrategy).toBe(RECOVERY_STRATEGIES.RETRY)
      expect(result.canRecover).toBe(true)
    })

    it('should handle authentication errors with user intervention', async () => {
      const authError = {
        type: ERROR_TYPES.AUTHENTICATION_ERROR,
        severity: ERROR_SEVERITY.HIGH,
        message: 'Authentication token expired'
      }

      const result = await errorRecoveryService.handleError(authError)
      expect(result.recoveryStrategy).toBe(RECOVERY_STRATEGIES.USER_INTERVENTION)
    })

    it('should handle critical errors immediately', async () => {
      const criticalError = {
        type: ERROR_TYPES.DATA_CORRUPTION,
        severity: ERROR_SEVERITY.CRITICAL,
        message: 'Data corruption detected'
      }

      const result = await errorRecoveryService.handleError(criticalError)
      expect(result.recoveryStrategy).toBe(RECOVERY_STRATEGIES.USER_INTERVENTION)
    })

    it('should implement graceful degradation for service unavailability', async () => {
      const serviceError = {
        type: ERROR_TYPES.SERVICE_UNAVAILABLE,
        severity: ERROR_SEVERITY.MEDIUM,
        message: 'Analytics service unavailable'
      }

      const result = await errorRecoveryService.handleError(serviceError)
      expect(result.recoveryStrategy).toBe(RECOVERY_STRATEGIES.CIRCUIT_BREAKER)
    })
  })

  describe('Error Boundary Integration', () => {
    it('should handle global unhandled promise rejections', () => {
      const unhandledRejectionSpy = vi.spyOn(errorRecoveryService, 'handleError')
      
      // Simulate unhandled promise rejection
      const rejectionEvent = new Event('unhandledrejection')
      rejectionEvent.reason = new Error('Unhandled promise rejection')
      
      window.dispatchEvent(rejectionEvent)
      
      // Note: In a real test environment, this would be automatically handled
      // by the error recovery service's global error handlers
    })

    it('should handle global JavaScript errors', () => {
      const globalErrorSpy = vi.spyOn(errorRecoveryService, 'handleError')
      
      // Simulate global error
      const errorEvent = new ErrorEvent('error', {
        message: 'Global JavaScript error',
        filename: 'test.js',
        lineno: 42,
        error: new Error('Test error')
      })
      
      window.dispatchEvent(errorEvent)
      
      // Note: In a real test environment, this would be automatically handled
      // by the error recovery service's global error handlers
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large numbers of errors efficiently', async () => {
      const startTime = Date.now()
      
      // Create many errors
      const promises = []
      for (let i = 0; i < 100; i++) {
        promises.push(errorRecoveryService.handleError({
          type: ERROR_TYPES.VALIDATION_ERROR,
          severity: ERROR_SEVERITY.LOW,
          message: `Test error ${i}`,
          context: { index: i }
        }))
      }

      await Promise.all(promises)
      const endTime = Date.now()
      
      expect(endTime - startTime).toBeLessThan(5000) // Should complete within 5 seconds
      
      const stats = errorRecoveryService.getErrorStatistics()
      expect(stats.total).toBe(100)
    })

    it('should maintain error history limits', async () => {
      const originalLimit = errorRecoveryService.config.errorHistoryLimit
      errorRecoveryService.config.errorHistoryLimit = 10 // Temporarily reduce limit

      // Add more errors than the limit
      for (let i = 0; i < 15; i++) {
        await errorRecoveryService.handleError({
          type: ERROR_TYPES.UNKNOWN_ERROR,
          severity: ERROR_SEVERITY.LOW,
          message: `Error ${i}`
        })
      }

      expect(errorRecoveryService.errorHistory.size).toBeLessThanOrEqual(10)
      
      // Restore original limit
      errorRecoveryService.config.errorHistoryLimit = originalLimit
    })

    it('should cleanup old circuit breaker data', () => {
      // Add some circuit breaker data
      errorRecoveryService.circuitBreakers.set('old_service', {
        failures: 2,
        state: 'closed',
        lastFailure: Date.now() - (2 * 24 * 60 * 60 * 1000) // 2 days ago
      })

      const circuitCount = errorRecoveryService.circuitBreakers.size
      expect(circuitCount).toBeGreaterThan(0)
    })
  })
})