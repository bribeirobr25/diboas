/**
 * Error Recovery Service
 * Comprehensive error handling, recovery mechanisms, and resilience patterns
 */

import logger from '../../utils/logger.js'
import secureLogger from '../../utils/secureLogger.js'

export const ERROR_TYPES = {
  NETWORK_ERROR: 'network_error',
  VALIDATION_ERROR: 'validation_error',
  AUTHENTICATION_ERROR: 'authentication_error',
  AUTHORIZATION_ERROR: 'authorization_error',
  TRANSACTION_ERROR: 'transaction_error',
  DATA_CORRUPTION: 'data_corruption',
  SERVICE_UNAVAILABLE: 'service_unavailable',
  TIMEOUT_ERROR: 'timeout_error',
  RATE_LIMIT_ERROR: 'rate_limit_error',
  UNKNOWN_ERROR: 'unknown_error'
}

export const ERROR_SEVERITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info'
}

export const RECOVERY_STRATEGIES = {
  RETRY: 'retry',
  FALLBACK: 'fallback',
  CIRCUIT_BREAKER: 'circuit_breaker',
  GRACEFUL_DEGRADATION: 'graceful_degradation',
  USER_INTERVENTION: 'user_intervention',
  SYSTEM_RESTART: 'system_restart'
}

class ErrorRecoveryService {
  constructor() {
    this.errorHistory = new Map()
    this.circuitBreakers = new Map()
    this.retryAttempts = new Map()
    this.fallbackServices = new Map()
    this.errorMetrics = new Map()
    
    // Configuration
    this.config = {
      maxRetries: 3,
      retryDelayMs: 1000,
      circuitBreakerThreshold: 5,
      circuitBreakerTimeout: 30000,
      errorHistoryLimit: 1000,
      criticalErrorNotificationDelay: 5000
    }
    
    // Global error handlers
    this.setupGlobalErrorHandlers()
    
    // Recovery strategies
    this.initializeRecoveryStrategies()
    
    logger.info('Error Recovery Service initialized')
  }

  /**
   * Setup global error handlers
   */
  setupGlobalErrorHandlers() {
    // Unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError({
          type: ERROR_TYPES.UNKNOWN_ERROR,
          severity: ERROR_SEVERITY.HIGH,
          message: 'Unhandled promise rejection',
          error: event.reason,
          context: { type: 'unhandledrejection' }
        })
      })

      // Global JavaScript errors
      window.addEventListener('error', (event) => {
        this.handleError({
          type: ERROR_TYPES.UNKNOWN_ERROR,
          severity: ERROR_SEVERITY.HIGH,
          message: event.message,
          error: event.error,
          context: {
            filename: event.filename,
            lineno: event.lineno,
            colno: event.colno
          }
        })
      })

      // Resource loading errors
      window.addEventListener('error', (event) => {
        if (event.target !== window) {
          this.handleError({
            type: ERROR_TYPES.NETWORK_ERROR,
            severity: ERROR_SEVERITY.MEDIUM,
            message: 'Resource loading failed',
            context: {
              tagName: event.target.tagName,
              src: event.target.src || event.target.href
            }
          })
        }
      }, true)
    }
  }

  /**
   * Initialize recovery strategies
   */
  initializeRecoveryStrategies() {
    // Register default fallback services
    this.registerFallbackService('api', () => ({
      status: 'degraded',
      message: 'Using cached data due to API unavailability'
    }))

    this.registerFallbackService('storage', () => ({
      status: 'memory_only',
      message: 'Using in-memory storage due to persistent storage issues'
    }))

    this.registerFallbackService('auth', () => ({
      status: 'guest_mode',
      message: 'Authentication service unavailable, using guest mode'
    }))
  }

  /**
   * Main error handling method
   */
  async handleError(errorData) {
    const errorId = this.generateErrorId()
    const timestamp = Date.now()
    
    const enrichedError = {
      id: errorId,
      timestamp,
      ...errorData,
      stackTrace: errorData.error?.stack,
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : null,
      url: typeof window !== 'undefined' ? window.location.href : null
    }

    // Store error in history
    this.errorHistory.set(errorId, enrichedError)
    this.maintainErrorHistoryLimit()

    // Update error metrics
    this.updateErrorMetrics(enrichedError)

    // Log error
    this.logError(enrichedError)

    // Determine recovery strategy
    const recoveryStrategy = this.determineRecoveryStrategy(enrichedError)
    
    // Execute recovery
    const recoveryResult = await this.executeRecovery(enrichedError, recoveryStrategy)

    // Notify if critical
    if (enrichedError.severity === ERROR_SEVERITY.CRITICAL) {
      this.notifyCriticalError(enrichedError, recoveryResult)
    }

    return {
      errorId,
      recoveryStrategy,
      recoveryResult,
      canRecover: recoveryResult.success
    }
  }

  /**
   * Determine appropriate recovery strategy
   */
  determineRecoveryStrategy(error) {
    const { type, severity, context } = error

    // Critical errors need immediate attention
    if (severity === ERROR_SEVERITY.CRITICAL) {
      return RECOVERY_STRATEGIES.USER_INTERVENTION
    }

    // Network errors can be retried
    if (type === ERROR_TYPES.NETWORK_ERROR) {
      const retryCount = this.getRetryCount(context?.endpoint || 'network')
      if (retryCount < this.config.maxRetries) {
        return RECOVERY_STRATEGIES.RETRY
      }
      return RECOVERY_STRATEGIES.FALLBACK
    }

    // Service unavailable errors use circuit breaker
    if (type === ERROR_TYPES.SERVICE_UNAVAILABLE) {
      return RECOVERY_STRATEGIES.CIRCUIT_BREAKER
    }

    // Authentication errors need user intervention
    if (type === ERROR_TYPES.AUTHENTICATION_ERROR) {
      return RECOVERY_STRATEGIES.USER_INTERVENTION
    }

    // Transaction errors need careful handling
    if (type === ERROR_TYPES.TRANSACTION_ERROR) {
      return RECOVERY_STRATEGIES.FALLBACK
    }

    // Default to graceful degradation
    return RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION
  }

  /**
   * Execute recovery strategy
   */
  async executeRecovery(error, strategy) {
    try {
      switch (strategy) {
        case RECOVERY_STRATEGIES.RETRY:
          return await this.executeRetry(error)
        
        case RECOVERY_STRATEGIES.FALLBACK:
          return await this.executeFallback(error)
        
        case RECOVERY_STRATEGIES.CIRCUIT_BREAKER:
          return await this.executeCircuitBreaker(error)
        
        case RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION:
          return await this.executeGracefulDegradation(error)
        
        case RECOVERY_STRATEGIES.USER_INTERVENTION:
          return await this.executeUserIntervention(error)
        
        default:
          return { success: false, message: 'No recovery strategy available' }
      }
    } catch (recoveryError) {
      logger.error('Recovery strategy failed:', recoveryError)
      return { success: false, message: 'Recovery failed', error: recoveryError }
    }
  }

  /**
   * Execute retry strategy
   */
  async executeRetry(error) {
    const endpoint = error.context?.endpoint || 'unknown'
    const retryCount = this.incrementRetryCount(endpoint)
    
    if (retryCount > this.config.maxRetries) {
      return { success: false, message: 'Max retries exceeded' }
    }

    // Exponential backoff
    const delay = this.config.retryDelayMs * Math.pow(2, retryCount - 1)
    
    logger.info(`Retrying operation (attempt ${retryCount}/${this.config.maxRetries}) after ${delay}ms`)
    
    await this.sleep(delay)
    
    return {
      success: true,
      message: `Retry scheduled (attempt ${retryCount})`,
      delay,
      retryCount
    }
  }

  /**
   * Execute fallback strategy
   */
  async executeFallback(error) {
    const serviceType = this.inferServiceType(error)
    const fallbackService = this.fallbackServices.get(serviceType)
    
    if (!fallbackService) {
      return { success: false, message: 'No fallback service available' }
    }

    try {
      const fallbackResult = await fallbackService()
      logger.info(`Fallback service activated for ${serviceType}`)
      
      return {
        success: true,
        message: `Fallback service activated`,
        serviceType,
        fallbackResult
      }
    } catch (fallbackError) {
      logger.error('Fallback service failed:', fallbackError)
      return { success: false, message: 'Fallback service failed' }
    }
  }

  /**
   * Execute circuit breaker strategy
   */
  async executeCircuitBreaker(error) {
    const serviceKey = this.inferServiceType(error)
    let circuitBreaker = this.circuitBreakers.get(serviceKey)
    
    if (!circuitBreaker) {
      circuitBreaker = {
        failures: 0,
        state: 'closed', // closed, open, half-open
        lastFailure: null,
        nextAttempt: null
      }
      this.circuitBreakers.set(serviceKey, circuitBreaker)
    }

    circuitBreaker.failures++
    circuitBreaker.lastFailure = Date.now()

    if (circuitBreaker.failures >= this.config.circuitBreakerThreshold) {
      circuitBreaker.state = 'open'
      circuitBreaker.nextAttempt = Date.now() + this.config.circuitBreakerTimeout
      
      logger.warn(`Circuit breaker opened for ${serviceKey}`)
      
      return {
        success: true,
        message: 'Circuit breaker opened',
        serviceKey,
        nextAttempt: circuitBreaker.nextAttempt
      }
    }

    return {
      success: true,
      message: 'Circuit breaker monitoring',
      failures: circuitBreaker.failures,
      threshold: this.config.circuitBreakerThreshold
    }
  }

  /**
   * Execute graceful degradation
   */
  async executeGracefulDegradation(error) {
    const degradationLevel = this.calculateDegradationLevel(error)
    
    const degradationActions = {
      minimal: () => ({ disableAnimations: true }),
      moderate: () => ({ disableAnimations: true, reducedFeatures: true }),
      severe: () => ({ 
        disableAnimations: true, 
        reducedFeatures: true, 
        offlineMode: true 
      })
    }

    const action = degradationActions[degradationLevel] || degradationActions.minimal
    const degradationConfig = action()
    
    logger.info(`Graceful degradation activated: ${degradationLevel}`)
    
    return {
      success: true,
      message: 'Graceful degradation activated',
      level: degradationLevel,
      config: degradationConfig
    }
  }

  /**
   * Execute user intervention strategy
   */
  async executeUserIntervention(error) {
    const interventionType = this.determineInterventionType(error)
    
    // Dispatch custom event for UI to handle
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('error-intervention-required', {
        detail: {
          errorId: error.id,
          type: interventionType,
          message: error.message,
          severity: error.severity
        }
      }))
    }

    return {
      success: true,
      message: 'User intervention requested',
      interventionType,
      errorId: error.id
    }
  }

  /**
   * Check circuit breaker status
   */
  checkCircuitBreaker(serviceKey) {
    const circuitBreaker = this.circuitBreakers.get(serviceKey)
    
    if (!circuitBreaker || circuitBreaker.state === 'closed') {
      return { canProceed: true, state: 'closed' }
    }

    if (circuitBreaker.state === 'open') {
      if (Date.now() >= circuitBreaker.nextAttempt) {
        circuitBreaker.state = 'half-open'
        return { canProceed: true, state: 'half-open' }
      }
      return { 
        canProceed: false, 
        state: 'open',
        nextAttempt: circuitBreaker.nextAttempt
      }
    }

    return { canProceed: true, state: circuitBreaker.state }
  }

  /**
   * Reset circuit breaker on successful operation
   */
  resetCircuitBreaker(serviceKey) {
    const circuitBreaker = this.circuitBreakers.get(serviceKey)
    if (circuitBreaker) {
      circuitBreaker.failures = 0
      circuitBreaker.state = 'closed'
      circuitBreaker.lastFailure = null
      circuitBreaker.nextAttempt = null
      
      logger.info(`Circuit breaker reset for ${serviceKey}`)
    }
  }

  /**
   * Register fallback service
   */
  registerFallbackService(serviceType, fallbackFunction) {
    this.fallbackServices.set(serviceType, fallbackFunction)
    logger.debug(`Fallback service registered for ${serviceType}`)
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(timeWindow = 24 * 60 * 60 * 1000) {
    const now = Date.now()
    const windowStart = now - timeWindow
    
    const recentErrors = Array.from(this.errorHistory.values())
      .filter(error => error.timestamp >= windowStart)

    const stats = {
      total: recentErrors.length,
      byType: {},
      bySeverity: {},
      recoverySuccess: 0,
      topErrors: []
    }

    recentErrors.forEach(error => {
      // Count by type
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1
      
      // Count by severity
      stats.bySeverity[error.severity] = (stats.bySeverity[error.severity] || 0) + 1
    })

    // Get top error types
    stats.topErrors = Object.entries(stats.byType)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 5)
      .map(([type, count]) => ({ type, count }))

    return stats
  }

  /**
   * Helper methods
   */
  generateErrorId() {
    return `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  getRetryCount(key) {
    return this.retryAttempts.get(key) || 0
  }

  incrementRetryCount(key) {
    const count = this.getRetryCount(key) + 1
    this.retryAttempts.set(key, count)
    return count
  }

  resetRetryCount(key) {
    this.retryAttempts.delete(key)
  }

  inferServiceType(error) {
    if (error.context?.endpoint) {
      if (error.context.endpoint.includes('/api/')) return 'api'
      if (error.context.endpoint.includes('/auth/')) return 'auth'
    }
    
    if (error.type === ERROR_TYPES.NETWORK_ERROR) return 'network'
    if (error.type === ERROR_TYPES.AUTHENTICATION_ERROR) return 'auth'
    if (error.type === ERROR_TYPES.TRANSACTION_ERROR) return 'transaction'
    
    return 'unknown'
  }

  calculateDegradationLevel(error) {
    if (error.severity === ERROR_SEVERITY.CRITICAL) return 'severe'
    if (error.severity === ERROR_SEVERITY.HIGH) return 'moderate'
    return 'minimal'
  }

  determineInterventionType(error) {
    if (error.type === ERROR_TYPES.AUTHENTICATION_ERROR) return 'login_required'
    if (error.type === ERROR_TYPES.AUTHORIZATION_ERROR) return 'permission_denied'
    if (error.type === ERROR_TYPES.VALIDATION_ERROR) return 'input_correction'
    return 'generic_error'
  }

  updateErrorMetrics(error) {
    const metricKey = `${error.type}_${error.severity}`
    const currentCount = this.errorMetrics.get(metricKey) || 0
    this.errorMetrics.set(metricKey, currentCount + 1)
  }

  maintainErrorHistoryLimit() {
    if (this.errorHistory.size > this.config.errorHistoryLimit) {
      const oldest = Array.from(this.errorHistory.entries())
        .sort(([,a], [,b]) => a.timestamp - b.timestamp)
        .slice(0, this.errorHistory.size - this.config.errorHistoryLimit)
      
      oldest.forEach(([id]) => this.errorHistory.delete(id))
    }
  }

  logError(error) {
    const logLevel = this.getLogLevel(error.severity)
    
    logger[logLevel](`Error ${error.id}: ${error.message}`, {
      type: error.type,
      severity: error.severity,
      context: error.context
    })

    // Secure audit log for critical errors
    if (error.severity === ERROR_SEVERITY.CRITICAL) {
      secureLogger.audit('CRITICAL_ERROR', {
        errorId: error.id,
        type: error.type,
        message: error.message,
        context: error.context
      })
    }
  }

  getLogLevel(severity) {
    const levelMap = {
      [ERROR_SEVERITY.CRITICAL]: 'error',
      [ERROR_SEVERITY.HIGH]: 'error',
      [ERROR_SEVERITY.MEDIUM]: 'warn',
      [ERROR_SEVERITY.LOW]: 'info',
      [ERROR_SEVERITY.INFO]: 'debug'
    }
    return levelMap[severity] || 'info'
  }

  notifyCriticalError(error, recoveryResult) {
    // Implement notification logic (email, Slack, etc.)
    logger.error('CRITICAL ERROR NOTIFICATION', {
      errorId: error.id,
      message: error.message,
      recoverySuccess: recoveryResult.success
    })
  }

  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Cleanup method
   */
  dispose() {
    this.errorHistory.clear()
    this.circuitBreakers.clear()
    this.retryAttempts.clear()
    this.fallbackServices.clear()
    this.errorMetrics.clear()
    
    logger.info('Error Recovery Service disposed')
  }
}

// Create singleton instance
export const errorRecoveryService = new ErrorRecoveryService()
export default errorRecoveryService