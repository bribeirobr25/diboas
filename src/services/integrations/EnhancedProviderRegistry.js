/**
 * Enhanced Provider Registry for diBoaS
 * Advanced provider management with circuit breakers, adaptive load balancing, and performance analytics
 * Extends BaseProviderRegistry with sophisticated features for enterprise-grade reliability
 */

import { BaseProviderRegistry, PROVIDER_STATUS } from './BaseProviderRegistry.js'
import { cacheManager, CACHE_POLICIES } from '../../utils/caching/CacheManager.js'
import secureLogger from '../../utils/secureLogger.js'

/**
 * Circuit breaker states
 */
export const CIRCUIT_BREAKER_STATES = {
  CLOSED: 'closed',       // Normal operation
  OPEN: 'open',          // Circuit is open, requests are blocked
  HALF_OPEN: 'half_open' // Testing if service has recovered
}

/**
 * Load balancing strategies
 */
export const LOAD_BALANCING_STRATEGIES = {
  ROUND_ROBIN: 'round_robin',
  WEIGHTED_ROUND_ROBIN: 'weighted_round_robin',
  LEAST_CONNECTIONS: 'least_connections',
  LEAST_RESPONSE_TIME: 'least_response_time',
  HEALTH_BASED: 'health_based',
  ADAPTIVE: 'adaptive'
}

/**
 * Performance metrics tracking
 */
export class PerformanceMetrics {
  constructor() {
    this.metrics = new Map()
    this.aggregationWindow = 5 * 60 * 1000 // 5 minutes
  }

  record(providerId, operation, duration, success) {
    const key = `${providerId}:${operation}`
    if (!this.metrics.has(key)) {
      this.metrics.set(key, {
        count: 0,
        totalDuration: 0,
        successCount: 0,
        failureCount: 0,
        p95: 0,
        p99: 0,
        durations: [],
        windowStart: Date.now()
      })
    }

    const metric = this.metrics.get(key)
    metric.count++
    metric.totalDuration += duration
    
    if (success) {
      metric.successCount++
    } else {
      metric.failureCount++
    }

    // Keep recent durations for percentile calculation
    metric.durations.push(duration)
    if (metric.durations.length > 1000) {
      metric.durations = metric.durations.slice(-500) // Keep last 500
    }

    // Update percentiles
    this.updatePercentiles(metric)

    // Reset window if needed
    if (Date.now() - metric.windowStart > this.aggregationWindow) {
      this.resetWindow(key)
    }
  }

  updatePercentiles(metric) {
    if (metric.durations.length === 0) return

    const sorted = [...metric.durations].sort((a, b) => a - b)
    metric.p95 = sorted[Math.floor(sorted.length * 0.95)]
    metric.p99 = sorted[Math.floor(sorted.length * 0.99)]
  }

  resetWindow(key) {
    const metric = this.metrics.get(key)
    metric.windowStart = Date.now()
    // Keep some history but reset counters
    metric.count = Math.floor(metric.count * 0.1)
    metric.totalDuration = Math.floor(metric.totalDuration * 0.1)
    metric.successCount = Math.floor(metric.successCount * 0.1)
    metric.failureCount = Math.floor(metric.failureCount * 0.1)
  }

  getMetrics(providerId, operation = null) {
    if (operation) {
      return this.metrics.get(`${providerId}:${operation}`)
    }

    const providerMetrics = {}
    for (const [key, metric] of this.metrics.entries()) {
      if (key.startsWith(`${providerId}:`)) {
        const op = key.split(':')[1]
        providerMetrics[op] = metric
      }
    }
    return providerMetrics
  }

  getTopPerformers(operation, limit = 5) {
    const operationMetrics = []
    for (const [key, metric] of this.metrics.entries()) {
      if (key.endsWith(`:${operation}`) && metric.count > 0) {
        const providerId = key.split(':')[0]
        const avgDuration = metric.totalDuration / metric.count
        const successRate = metric.successCount / metric.count
        
        operationMetrics.push({
          providerId,
          avgDuration,
          successRate,
          score: successRate * 1000 - avgDuration // Higher score is better
        })
      }
    }

    return operationMetrics
      .sort((a, b) => b.score - a.score)
      .slice(0, limit)
  }
}

/**
 * Circuit breaker implementation
 */
export class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5
    this.recoveryTimeout = options.recoveryTimeout || 30000 // 30 seconds
    this.monitoringWindow = options.monitoringWindow || 60000 // 1 minute
    
    this.state = CIRCUIT_BREAKER_STATES.CLOSED
    this.failureCount = 0
    this.lastFailureTime = null
    this.nextAttempt = null
    
    this.requestCount = 0
    this.windowStart = Date.now()
  }

  async execute(operation, providerId) {
    // Reset window if needed
    if (Date.now() - this.windowStart > this.monitoringWindow) {
      this.resetWindow()
    }

    this.requestCount++

    if (this.state === CIRCUIT_BREAKER_STATES.OPEN) {
      if (Date.now() < this.nextAttempt) {
        throw new Error(`Circuit breaker OPEN for provider ${providerId}. Next attempt at ${new Date(this.nextAttempt).toISOString()}`)
      }
      
      // Transition to half-open
      this.state = CIRCUIT_BREAKER_STATES.HALF_OPEN
      secureLogger.audit('CIRCUIT_BREAKER_HALF_OPEN', { providerId })
    }

    try {
      const result = await operation()
      this.onSuccess()
      return result
    } catch (error) {
      this.onFailure()
      throw error
    }
  }

  onSuccess() {
    this.failureCount = 0
    if (this.state === CIRCUIT_BREAKER_STATES.HALF_OPEN) {
      this.state = CIRCUIT_BREAKER_STATES.CLOSED
      secureLogger.audit('CIRCUIT_BREAKER_CLOSED', {})
    }
  }

  onFailure() {
    this.failureCount++
    this.lastFailureTime = Date.now()

    const failureRate = this.failureCount / this.requestCount
    if (failureRate >= 0.5 && this.failureCount >= this.failureThreshold) {
      this.state = CIRCUIT_BREAKER_STATES.OPEN
      this.nextAttempt = Date.now() + this.recoveryTimeout
      secureLogger.audit('CIRCUIT_BREAKER_OPEN', { 
        failureCount: this.failureCount,
        failureRate: failureRate.toFixed(2)
      })
    }
  }

  resetWindow() {
    this.windowStart = Date.now()
    this.requestCount = Math.floor(this.requestCount * 0.1) // Keep 10% for trend analysis
    this.failureCount = Math.floor(this.failureCount * 0.1)
  }

  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      requestCount: this.requestCount,
      failureRate: this.requestCount > 0 ? this.failureCount / this.requestCount : 0,
      nextAttempt: this.nextAttempt,
      lastFailureTime: this.lastFailureTime
    }
  }
}

/**
 * Enhanced Provider Registry with advanced features
 */
export class EnhancedProviderRegistry extends BaseProviderRegistry {
  constructor(registryType, options = {}) {
    super(registryType, {
      ...options,
      healthCheckInterval: options.healthCheckInterval || 120000, // 2 minutes
      maxRetries: options.maxRetries || 2,
      retryDelay: options.retryDelay || 1500
    })

    // Enhanced features
    this.performanceMetrics = new PerformanceMetrics()
    this.circuitBreakers = new Map()
    this.loadBalancer = options.loadBalancingStrategy || LOAD_BALANCING_STRATEGIES.ADAPTIVE
    this.adaptiveThresholds = new Map()
    this.providerDiscovery = new Map()
    
    // Connection pooling and rate limiting
    this.connectionPools = new Map()
    this.rateLimiters = new Map()
    
    // A/B testing and feature flags
    this.abTests = new Map()
    this.featureFlags = new Map()
    
    // Analytics and monitoring
    this.analyticsBuffer = []
    this.maxAnalyticsBuffer = 10000
    
    // Dynamic configuration
    this.dynamicConfigs = new Map()
    this.configUpdateInterval = options.configUpdateInterval || 300000 // 5 minutes
    
    this.startAdvancedMonitoring()
  }

  /**
   * Register provider with enhanced features
   */
  async registerProvider(providerId, provider, config = {}) {
    // Call parent registration
    await super.registerProvider(providerId, provider, config)
    
    // Initialize circuit breaker
    this.circuitBreakers.set(providerId, new CircuitBreaker({
      failureThreshold: config.circuitBreakerThreshold || 5,
      recoveryTimeout: config.circuitBreakerTimeout || 30000,
      monitoringWindow: config.monitoringWindow || 60000
    }))
    
    // Initialize adaptive thresholds
    this.adaptiveThresholds.set(providerId, {
      responseTimeThreshold: config.responseTimeThreshold || 5000,
      successRateThreshold: config.successRateThreshold || 0.95,
      lastAdjustment: Date.now()
    })
    
    // Initialize A/B test configuration
    if (config.abTest) {
      this.abTests.set(providerId, {
        enabled: config.abTest.enabled || false,
        trafficPercentage: config.abTest.trafficPercentage || 0,
        startDate: config.abTest.startDate || new Date().toISOString(),
        endDate: config.abTest.endDate
      })
    }
    
    // Set up feature flags
    if (config.featureFlags) {
      this.featureFlags.set(providerId, config.featureFlags)
    }
    
    secureLogger.audit('ENHANCED_PROVIDER_REGISTERED', {
      registryType: this.registryType,
      providerId,
      features: Object.keys(config),
      circuitBreaker: true,
      adaptiveThresholds: true
    })
    
    return true
  }

  /**
   * Enhanced provider selection with multiple strategies
   */
  getBestProvider(requirements = {}) {
    const {
      strategy = this.loadBalancer,
      operation = 'default',
      excludeProviders = [],
      forceProvider = null,
      abTestGroup = null
    } = requirements

    // Force specific provider if requested
    if (forceProvider && this.providers.has(forceProvider)) {
      if (this.isProviderAvailable(forceProvider, operation)) {
        return forceProvider
      }
    }

    // Get available providers
    const availableProviders = this.getAvailableProviders(requirements)
    if (availableProviders.length === 0) {
      throw new Error(`No available providers for ${this.registryType} integration`)
    }

    // Apply A/B testing
    const abTestProviders = this.applyABTesting(availableProviders, abTestGroup)
    
    // Select provider based on strategy
    switch (strategy) {
      case LOAD_BALANCING_STRATEGIES.ROUND_ROBIN:
        return this.selectRoundRobin(abTestProviders)
      case LOAD_BALANCING_STRATEGIES.WEIGHTED_ROUND_ROBIN:
        return this.selectWeightedRoundRobin(abTestProviders)
      case LOAD_BALANCING_STRATEGIES.LEAST_CONNECTIONS:
        return this.selectLeastConnections(abTestProviders)
      case LOAD_BALANCING_STRATEGIES.LEAST_RESPONSE_TIME:
        return this.selectLeastResponseTime(abTestProviders, operation)
      case LOAD_BALANCING_STRATEGIES.HEALTH_BASED:
        return this.selectHealthBased(abTestProviders)
      case LOAD_BALANCING_STRATEGIES.ADAPTIVE:
        return this.selectAdaptive(abTestProviders, operation, requirements)
      default:
        return availableProviders[0]
    }
  }

  /**
   * Enhanced execution with circuit breaker and performance tracking
   */
  async executeWithFailover(operation, requirements = {}) {
    const maxAttempts = requirements.maxAttempts || this.options.maxRetries
    const operationName = operation.name || requirements.operationName || 'generic'
    let lastError = null
    const attemptedProviders = new Set()
    const startTime = Date.now()

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      let providerId = null
      
      try {
        // Get best available provider
        providerId = this.getBestProvider({
          ...requirements,
          excludeProviders: Array.from(attemptedProviders),
          operation: operationName
        })

        attemptedProviders.add(providerId)
        
        // Get circuit breaker
        const circuitBreaker = this.circuitBreakers.get(providerId)
        
        // Execute through circuit breaker
        const operationStartTime = Date.now()
        const result = await circuitBreaker.execute(
          () => operation(this.providers.get(providerId), providerId),
          providerId
        )
        
        const operationDuration = Date.now() - operationStartTime
        const totalDuration = Date.now() - startTime

        // Record performance metrics
        this.performanceMetrics.record(providerId, operationName, operationDuration, true)
        
        // Record success
        await this.recordExecution(providerId, operationName, { 
          latency: operationDuration,
          totalDuration,
          success: true,
          attempt: attempt + 1
        })

        // Update adaptive thresholds
        await this.updateAdaptiveThresholds(providerId, operationDuration, true)

        // Record analytics
        this.recordAnalytics({
          type: 'provider_execution',
          providerId,
          operation: operationName,
          duration: operationDuration,
          totalDuration,
          success: true,
          attempt: attempt + 1,
          timestamp: new Date().toISOString()
        })

        return {
          success: true,
          providerId,
          result,
          latency: operationDuration,
          totalDuration,
          attempts: attempt + 1,
          circuitBreakerState: circuitBreaker.getState().state
        }

      } catch (error) {
        lastError = error
        const operationDuration = Date.now() - startTime
        
        if (providerId) {
          // Record performance metrics
          this.performanceMetrics.record(providerId, operationName, operationDuration, false)
          
          // Record failure
          await this.recordFailure(providerId, operationName, error)
          
          // Update adaptive thresholds
          await this.updateAdaptiveThresholds(providerId, operationDuration, false)

          // Record analytics
          this.recordAnalytics({
            type: 'provider_failure',
            providerId,
            operation: operationName,
            duration: operationDuration,
            error: error.message,
            attempt: attempt + 1,
            timestamp: new Date().toISOString()
          })
        }

        // Wait before retry
        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => 
            setTimeout(resolve, this.options.retryDelay * Math.pow(2, attempt))
          )
        }
      }
    }

    // All providers failed
    secureLogger.audit('ALL_ENHANCED_PROVIDERS_FAILED', {
      registryType: this.registryType,
      operation: operationName,
      attempts: maxAttempts,
      attemptedProviders: Array.from(attemptedProviders),
      error: lastError?.message
    })

    throw new Error(`All providers failed for ${this.registryType} integration: ${lastError?.message}`)
  }

  /**
   * Check if provider is available (considering circuit breaker)
   */
  isProviderAvailable(providerId, operation = 'default') {
    // Basic health check
    if (!this.isProviderHealthy(providerId)) {
      return false
    }

    // Circuit breaker check
    const circuitBreaker = this.circuitBreakers.get(providerId)
    if (circuitBreaker && circuitBreaker.state === CIRCUIT_BREAKER_STATES.OPEN) {
      return false
    }

    // Feature flag check
    const flags = this.featureFlags.get(providerId)
    if (flags && flags[operation] === false) {
      return false
    }

    return true
  }

  /**
   * Get available providers with filtering
   */
  getAvailableProviders(requirements = {}) {
    const {
      feature = null,
      environment = typeof process !== 'undefined' ? process?.env?.NODE_ENV : 'development',
      excludeProviders = [],
      operation = 'default'
    } = requirements

    return this.fallbackChain.filter(providerId => {
      const config = this.providerConfigs.get(providerId)
      
      return (
        !excludeProviders.includes(providerId) &&
        config.enabled &&
        config.environments.includes(environment) &&
        (feature === null || config.features.includes(feature)) &&
        this.isProviderAvailable(providerId, operation)
      )
    })
  }

  /**
   * Apply A/B testing logic
   */
  applyABTesting(providers, abTestGroup) {
    if (!abTestGroup) return providers

    const testProviders = providers.filter(providerId => {
      const abTest = this.abTests.get(providerId)
      return abTest && abTest.enabled && Math.random() < abTest.trafficPercentage / 100
    })

    return testProviders.length > 0 ? testProviders : providers
  }

  /**
   * Round robin selection
   */
  selectRoundRobin(providers) {
    if (!this.roundRobinIndex) this.roundRobinIndex = 0
    const provider = providers[this.roundRobinIndex % providers.length]
    this.roundRobinIndex++
    return provider
  }

  /**
   * Weighted round robin selection
   */
  selectWeightedRoundRobin(providers) {
    const weights = providers.map(providerId => 
      this.providerConfigs.get(providerId).weight || 1
    )
    const totalWeight = weights.reduce((sum, weight) => sum + weight, 0)
    let random = Math.random() * totalWeight
    
    for (let i = 0; i < providers.length; i++) {
      random -= weights[i]
      if (random <= 0) {
        return providers[i]
      }
    }
    
    return providers[0]
  }

  /**
   * Least connections selection
   */
  selectLeastConnections(providers) {
    let minConnections = Infinity
    let selectedProvider = providers[0]
    
    for (const providerId of providers) {
      const pool = this.connectionPools.get(providerId) || { activeConnections: 0 }
      if (pool.activeConnections < minConnections) {
        minConnections = pool.activeConnections
        selectedProvider = providerId
      }
    }
    
    return selectedProvider
  }

  /**
   * Least response time selection
   */
  selectLeastResponseTime(providers, operation) {
    let minResponseTime = Infinity
    let selectedProvider = providers[0]
    
    for (const providerId of providers) {
      const metrics = this.performanceMetrics.getMetrics(providerId, operation)
      const avgResponseTime = metrics ? 
        (metrics.totalDuration / metrics.count) : 1000 // Default assumption
      
      if (avgResponseTime < minResponseTime) {
        minResponseTime = avgResponseTime
        selectedProvider = providerId
      }
    }
    
    return selectedProvider
  }

  /**
   * Health-based selection
   */
  selectHealthBased(providers) {
    const providerScores = providers.map(providerId => {
      const stats = this.providerStats.get(providerId)
      const circuitBreaker = this.circuitBreakers.get(providerId)
      
      let score = stats.uptime || 0
      
      // Penalize if circuit breaker is not closed
      if (circuitBreaker.state !== CIRCUIT_BREAKER_STATES.CLOSED) {
        score *= 0.5
      }
      
      return { providerId, score }
    })
    
    // Sort by score and return best
    providerScores.sort((a, b) => b.score - a.score)
    return providerScores[0].providerId
  }

  /**
   * Adaptive selection based on multiple factors
   */
  selectAdaptive(providers, operation, requirements) {
    const providerScores = providers.map(providerId => {
      const stats = this.providerStats.get(providerId)
      const metrics = this.performanceMetrics.getMetrics(providerId, operation)
      const circuitBreaker = this.circuitBreakers.get(providerId)
      const config = this.providerConfigs.get(providerId)
      
      let score = 0
      
      // Health score (40% weight)
      score += (stats.uptime || 0) * 0.4
      
      // Performance score (30% weight)
      if (metrics) {
        const avgResponseTime = metrics.totalDuration / metrics.count
        const performanceScore = Math.max(0, 100 - (avgResponseTime / 100))
        score += performanceScore * 0.3
      }
      
      // Reliability score (20% weight)
      const successRate = stats.totalRequests > 0 ? 
        (stats.successCount / stats.totalRequests) * 100 : 100
      score += successRate * 0.2
      
      // Configuration weight (10% weight)
      score += (config.weight || 1) * 0.1
      
      // Circuit breaker penalty
      if (circuitBreaker.state === CIRCUIT_BREAKER_STATES.HALF_OPEN) {
        score *= 0.8
      } else if (circuitBreaker.state === CIRCUIT_BREAKER_STATES.OPEN) {
        score = 0
      }
      
      return { providerId, score }
    })
    
    // Sort by score and add some randomness to prevent thundering herd
    providerScores.sort((a, b) => b.score - a.score)
    
    // Select from top 3 with weighted probability
    const topProviders = providerScores.slice(0, 3)
    const totalScore = topProviders.reduce((sum, p) => sum + p.score, 0)
    
    if (totalScore === 0) return providers[0]
    
    let random = Math.random() * totalScore
    for (const provider of topProviders) {
      random -= provider.score
      if (random <= 0) {
        return provider.providerId
      }
    }
    
    return topProviders[0].providerId
  }

  /**
   * Update adaptive thresholds based on performance
   */
  async updateAdaptiveThresholds(providerId, responseTime, success) {
    const thresholds = this.adaptiveThresholds.get(providerId)
    if (!thresholds) return
    
    const now = Date.now()
    const timeSinceLastAdjustment = now - thresholds.lastAdjustment
    
    // Only adjust every 5 minutes minimum
    if (timeSinceLastAdjustment < 300000) return
    
    const metrics = this.performanceMetrics.getMetrics(providerId)
    if (!metrics || !metrics.default) return
    
    const metric = metrics.default
    const avgResponseTime = metric.totalDuration / metric.count
    const successRate = metric.successCount / metric.count
    
    // Adjust response time threshold
    if (successRate > 0.98) {
      // Very good performance, can be more lenient
      thresholds.responseTimeThreshold = Math.min(
        thresholds.responseTimeThreshold * 1.1,
        10000
      )
    } else if (successRate < 0.9) {
      // Poor performance, be more strict
      thresholds.responseTimeThreshold = Math.max(
        thresholds.responseTimeThreshold * 0.9,
        1000
      )
    }
    
    thresholds.lastAdjustment = now
    
    secureLogger.audit('ADAPTIVE_THRESHOLDS_UPDATED', {
      providerId,
      responseTimeThreshold: thresholds.responseTimeThreshold,
      successRateThreshold: thresholds.successRateThreshold,
      avgResponseTime,
      successRate
    })
  }

  /**
   * Record analytics data
   */
  recordAnalytics(data) {
    this.analyticsBuffer.push(data)
    
    // Prevent buffer overflow
    if (this.analyticsBuffer.length > this.maxAnalyticsBuffer) {
      this.analyticsBuffer = this.analyticsBuffer.slice(-this.maxAnalyticsBuffer / 2)
    }
  }

  /**
   * Start advanced monitoring
   */
  startAdvancedMonitoring() {
    // Advanced health monitoring
    setInterval(() => {
      this.performAdvancedHealthCheck()
    }, this.options.healthCheckInterval)
    
    // Analytics processing
    setInterval(() => {
      this.processAnalytics()
    }, 60000) // Every minute
    
    // Dynamic configuration updates
    setInterval(() => {
      this.updateDynamicConfigurations()
    }, this.configUpdateInterval)
  }

  /**
   * Perform advanced health check
   */
  async performAdvancedHealthCheck() {
    for (const [providerId, provider] of this.providers.entries()) {
      try {
        // Standard health check
        await this.checkProviderHealth(providerId)
        
        // Circuit breaker health
        const circuitBreaker = this.circuitBreakers.get(providerId)
        if (circuitBreaker.state === CIRCUIT_BREAKER_STATES.OPEN) {
          // Try to transition to half-open if recovery timeout has passed
          if (Date.now() >= circuitBreaker.nextAttempt) {
            circuitBreaker.state = CIRCUIT_BREAKER_STATES.HALF_OPEN
          }
        }
        
        // Performance metrics cleanup
        const metrics = this.performanceMetrics.getMetrics(providerId)
        for (const [operation, metric] of Object.entries(metrics)) {
          if (metric.durations.length > 1000) {
            metric.durations = metric.durations.slice(-500)
          }
        }
        
      } catch (error) {
        secureLogger.audit('ADVANCED_HEALTH_CHECK_ERROR', {
          providerId,
          error: error.message
        })
      }
    }
  }

  /**
   * Process accumulated analytics
   */
  async processAnalytics() {
    if (this.analyticsBuffer.length === 0) return
    
    try {
      // Cache analytics data for reporting
      const analyticsData = {
        data: [...this.analyticsBuffer],
        timestamp: new Date().toISOString(),
        registryType: this.registryType
      }
      
      await cacheManager.set(
        `analytics_${this.registryType}_${Date.now()}`,
        analyticsData,
        CACHE_POLICIES.API
      )
      
      // Clear processed data
      this.analyticsBuffer = []
      
    } catch (error) {
      secureLogger.audit('ANALYTICS_PROCESSING_ERROR', {
        error: error.message,
        bufferSize: this.analyticsBuffer.length
      })
    }
  }

  /**
   * Update dynamic configurations
   */
  async updateDynamicConfigurations() {
    try {
      // Check for configuration updates in cache
      const configKey = `dynamic_config_${this.registryType}`
      const newConfig = await cacheManager.get(configKey, CACHE_POLICIES.DYNAMIC)
      
      if (newConfig) {
        for (const [providerId, config] of Object.entries(newConfig)) {
          if (this.providers.has(providerId)) {
            this.updateProviderConfig(providerId, config)
          }
        }
        
        secureLogger.audit('DYNAMIC_CONFIG_UPDATED', {
          registryType: this.registryType,
          providersUpdated: Object.keys(newConfig).length
        })
      }
      
    } catch (error) {
      secureLogger.audit('DYNAMIC_CONFIG_UPDATE_ERROR', {
        error: error.message
      })
    }
  }

  /**
   * Get comprehensive health status
   */
  getEnhancedHealthStatus() {
    const baseHealth = super.getHealthStatus()
    
    // Add circuit breaker states
    const circuitBreakerStates = {}
    for (const [providerId, circuitBreaker] of this.circuitBreakers.entries()) {
      circuitBreakerStates[providerId] = circuitBreaker.getState()
    }
    
    // Add performance metrics summary
    const performanceMetrics = {}
    for (const providerId of this.providers.keys()) {
      const metrics = this.performanceMetrics.getMetrics(providerId)
      performanceMetrics[providerId] = metrics
    }
    
    // Add adaptive thresholds
    const adaptiveThresholds = Object.fromEntries(this.adaptiveThresholds)
    
    return {
      ...baseHealth,
      circuitBreakers: circuitBreakerStates,
      performanceMetrics,
      adaptiveThresholds,
      loadBalancingStrategy: this.loadBalancer,
      analyticsBufferSize: this.analyticsBuffer.length,
      enhancedFeatures: {
        circuitBreakers: true,
        adaptiveThresholds: true,
        performanceAnalytics: true,
        dynamicConfiguration: true,
        abTesting: this.abTests.size > 0,
        featureFlags: this.featureFlags.size > 0
      }
    }
  }

  /**
   * Get performance analytics
   */
  getPerformanceAnalytics(timeRange = 3600000) { // 1 hour default
    const now = Date.now()
    const cutoff = now - timeRange
    
    const relevantAnalytics = this.analyticsBuffer.filter(
      item => new Date(item.timestamp).getTime() > cutoff
    )
    
    const summary = {
      totalRequests: relevantAnalytics.length,
      successfulRequests: relevantAnalytics.filter(item => item.success).length,
      failedRequests: relevantAnalytics.filter(item => !item.success).length,
      avgDuration: 0,
      providerBreakdown: {},
      operationBreakdown: {}
    }
    
    if (relevantAnalytics.length > 0) {
      summary.avgDuration = relevantAnalytics.reduce((sum, item) => 
        sum + (item.duration || 0), 0) / relevantAnalytics.length
      
      // Provider breakdown
      for (const item of relevantAnalytics) {
        if (!summary.providerBreakdown[item.providerId]) {
          summary.providerBreakdown[item.providerId] = { count: 0, successes: 0 }
        }
        summary.providerBreakdown[item.providerId].count++
        if (item.success) {
          summary.providerBreakdown[item.providerId].successes++
        }
      }
      
      // Operation breakdown
      for (const item of relevantAnalytics) {
        if (!summary.operationBreakdown[item.operation]) {
          summary.operationBreakdown[item.operation] = { count: 0, successes: 0 }
        }
        summary.operationBreakdown[item.operation].count++
        if (item.success) {
          summary.operationBreakdown[item.operation].successes++
        }
      }
    }
    
    return summary
  }

  /**
   * Enable/disable A/B test for provider
   */
  setABTest(providerId, config) {
    this.abTests.set(providerId, {
      enabled: config.enabled || false,
      trafficPercentage: config.trafficPercentage || 0,
      startDate: config.startDate || new Date().toISOString(),
      endDate: config.endDate
    })
    
    secureLogger.audit('AB_TEST_CONFIGURED', {
      providerId,
      enabled: config.enabled,
      trafficPercentage: config.trafficPercentage
    })
  }

  /**
   * Set feature flag for provider operation
   */
  setFeatureFlag(providerId, operation, enabled) {
    if (!this.featureFlags.has(providerId)) {
      this.featureFlags.set(providerId, {})
    }
    
    this.featureFlags.get(providerId)[operation] = enabled
    
    secureLogger.audit('FEATURE_FLAG_SET', {
      providerId,
      operation,
      enabled
    })
  }

  /**
   * Cleanup enhanced features
   */
  destroy() {
    super.destroy()
    
    // Clear enhanced features
    this.performanceMetrics = null
    this.circuitBreakers.clear()
    this.adaptiveThresholds.clear()
    this.analyticsBuffer = []
    this.abTests.clear()
    this.featureFlags.clear()
    this.connectionPools.clear()
    this.rateLimiters.clear()
  }
}

export default EnhancedProviderRegistry