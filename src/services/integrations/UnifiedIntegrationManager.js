/**
 * Unified Integration Manager
 * Consolidates base and enhanced integration management into a single configurable class
 * Combines functionality from both IntegrationManager and EnhancedIntegrationManager
 */

import { AuthProviderRegistry } from './auth/AuthProviderRegistry.js'
import { PaymentProviderRegistry } from './payments/PaymentProviderRegistry.js'
import { WalletProviderRegistry } from './wallets/WalletProviderRegistry.js'
import { KYCProviderRegistry } from './kyc/KYCProviderRegistry.js'
import { TwoFAProviderRegistry } from './twofa/TwoFAProviderRegistry.js'
import { OnChainProviderRegistry } from './onchain/OnChainProviderRegistry.js'
import { ProviderHealthMonitor } from './ProviderHealthMonitor.js'
import { IntegrationLogger } from './IntegrationLogger.js'
import { INTEGRATION_CONFIG } from '../../config/integrations.js'
import logger from '../../utils/logger'

/**
 * Feature flags for enhanced functionality
 */
export const INTEGRATION_FEATURES = {
  BASIC: 'basic',                           // Core provider management
  PERFORMANCE_ANALYTICS: 'performance',     // Performance monitoring and analytics
  LOAD_BALANCING: 'load_balancing',         // Adaptive load balancing
  CIRCUIT_BREAKERS: 'circuit_breakers',     // Circuit breaker pattern
  AB_TESTING: 'ab_testing',                 // A/B testing for providers
  DYNAMIC_CONFIG: 'dynamic_config',         // Dynamic configuration updates
  PROVIDER_DISCOVERY: 'provider_discovery'  // Automatic provider discovery
}

/**
 * Provider discovery strategies
 */
export const DISCOVERY_STRATEGIES = {
  STATIC: 'static',           // Manually configured providers
  DYNAMIC: 'dynamic',         // Auto-discover from configuration service
  HYBRID: 'hybrid',           // Combination of static and dynamic
  SERVICE_MESH: 'service_mesh' // Discover via service mesh
}

/**
 * Load balancing strategies
 */
export const LOAD_BALANCING_STRATEGIES = {
  ROUND_ROBIN: 'round_robin',
  WEIGHTED: 'weighted',
  LEAST_CONNECTIONS: 'least_connections',
  ADAPTIVE: 'adaptive'
}

/**
 * Unified Integration Manager
 * Single class that can operate in basic or enhanced mode based on configuration
 */
export class UnifiedIntegrationManager {
  constructor(options = {}) {
    // Feature configuration
    this.enabledFeatures = new Set(options.enabledFeatures || [INTEGRATION_FEATURES.BASIC])
    this.mode = this.enabledFeatures.has(INTEGRATION_FEATURES.PERFORMANCE_ANALYTICS) ? 'enhanced' : 'basic'
    
    // Core provider registries
    this.authRegistry = new AuthProviderRegistry()
    this.paymentRegistry = new PaymentProviderRegistry()
    this.walletRegistry = new WalletProviderRegistry()
    this.kycRegistry = new KYCProviderRegistry()
    this.twoFARegistry = new TwoFAProviderRegistry()
    this.onChainRegistry = new OnChainProviderRegistry()
    
    // Transaction-specific registries
    this.registries = new Map()
    
    // Support services
    this.healthMonitor = new ProviderHealthMonitor()
    this.logger = new IntegrationLogger()
    
    // Basic state
    this.isInitialized = false
    this.initializationPromise = null
    
    // Enhanced features (only initialized if enabled)
    if (this.isFeatureEnabled(INTEGRATION_FEATURES.PERFORMANCE_ANALYTICS)) {
      this.initializePerformanceAnalytics()
    }
    
    if (this.isFeatureEnabled(INTEGRATION_FEATURES.AB_TESTING)) {
      this.initializeABTesting()
    }
    
    if (this.isFeatureEnabled(INTEGRATION_FEATURES.DYNAMIC_CONFIG)) {
      this.initializeDynamicConfiguration()
    }
    
    if (this.isFeatureEnabled(INTEGRATION_FEATURES.PROVIDER_DISCOVERY)) {
      this.initializeProviderDiscovery(options.discoveryStrategy || DISCOVERY_STRATEGIES.STATIC)
    }
    
    logger.info('UnifiedIntegrationManager initialized in mode:', this.mode, {
      enabledFeatures: Array.from(this.enabledFeatures)
    })
  }

  /**
   * Check if a feature is enabled
   */
  isFeatureEnabled(feature) {
    return this.enabledFeatures.has(feature)
  }

  /**
   * Initialize performance analytics (enhanced feature)
   */
  initializePerformanceAnalytics() {
    this.globalMetrics = {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      avgResponseTime: 0,
      p95ResponseTime: 0,
      p99ResponseTime: 0,
      responseTimes: []
    }
    
    this.realTimeMetrics = {
      requestsPerSecond: 0,
      errorRate: 0,
      activeConnections: 0,
      lastUpdate: Date.now()
    }
    
    // Start metrics collection
    this.metricsInterval = setInterval(() => {
      this.updateRealTimeMetrics()
    }, 1000)
  }

  /**
   * Initialize A/B testing (enhanced feature)
   */
  initializeABTesting() {
    this.globalABTests = new Map()
    this.experimentResults = new Map()
    this.userGroupings = new Map()
  }

  /**
   * Initialize dynamic configuration (enhanced feature)
   */
  initializeDynamicConfiguration() {
    this.configVersions = new Map()
    this.configHistory = []
    this.configUpdateInterval = null
  }

  /**
   * Initialize provider discovery (enhanced feature)
   */
  initializeProviderDiscovery(strategy) {
    this.discoveryStrategy = strategy
    this.providerTemplates = new Map()
    this.discoveryInterval = null
    
    if (strategy !== DISCOVERY_STRATEGIES.STATIC) {
      this.startProviderDiscovery()
    }
  }

  /**
   * Initialize all provider registries with configuration
   */
  async initialize() {
    if (this.isInitialized) {
      return this
    }

    if (this.initializationPromise) {
      return await this.initializationPromise
    }

    this.initializationPromise = this._performInitialization()
    return await this.initializationPromise
  }

  /**
   * Internal initialization logic
   */
  async _performInitialization() {
    try {
      logger.info('Initializing UnifiedIntegrationManager...')
      
      // Initialize core registries
      const registries = [
        { name: 'auth', registry: this.authRegistry },
        { name: 'payment', registry: this.paymentRegistry },
        { name: 'wallet', registry: this.walletRegistry },
        { name: 'kyc', registry: this.kycRegistry },
        { name: 'twofa', registry: this.twoFARegistry },
        { name: 'onchain', registry: this.onChainRegistry }
      ]

      for (const { name, registry } of registries) {
        if (registry && typeof registry.initialize === 'function') {
          await registry.initialize(INTEGRATION_CONFIG[name] || {})
          logger.debug(`Initialized ${name} registry`)
        }
      }

      // Initialize health monitoring
      await this.healthMonitor.initialize(registries.map(r => r.registry))
      
      // Initialize enhanced features if enabled
      if (this.isFeatureEnabled(INTEGRATION_FEATURES.CIRCUIT_BREAKERS)) {
        this.initializeCircuitBreakers()
      }
      
      if (this.isFeatureEnabled(INTEGRATION_FEATURES.LOAD_BALANCING)) {
        this.initializeLoadBalancing()
      }

      this.isInitialized = true
      logger.info('UnifiedIntegrationManager initialized successfully')
      
      return this
    } catch (error) {
      logger.error('Failed to initialize UnifiedIntegrationManager:', error)
      throw error
    }
  }

  /**
   * Register additional registry (for transaction providers)
   */
  registerRegistry(name, registry) {
    this.registries.set(name, registry)
    logger.debug(`Registered additional registry: ${name}`)
  }

  /**
   * Execute operation through appropriate registry
   */
  async execute(registryType, operation, operationData, options = {}) {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const startTime = Date.now()
    
    // Update metrics if performance analytics enabled
    if (this.isFeatureEnabled(INTEGRATION_FEATURES.PERFORMANCE_ANALYTICS)) {
      this.globalMetrics.totalRequests++
    }

    try {
      // Get appropriate registry
      const registry = this.getRegistry(registryType)
      if (!registry) {
        throw new Error(`Registry not found: ${registryType}`)
      }

      // Apply enhanced features if enabled
      const enhancedOptions = await this.applyEnhancedFeatures(registryType, operation, operationData, options)

      // Execute operation
      const result = await registry.execute(operation, operationData, enhancedOptions)
      
      // Record success metrics
      if (this.isFeatureEnabled(INTEGRATION_FEATURES.PERFORMANCE_ANALYTICS)) {
        this.recordSuccessMetrics(startTime, registryType, operation)
      }
      
      return result
    } catch (error) {
      // Record failure metrics
      if (this.isFeatureEnabled(INTEGRATION_FEATURES.PERFORMANCE_ANALYTICS)) {
        this.recordFailureMetrics(startTime, registryType, operation, error)
      }
      
      throw error
    }
  }

  /**
   * Apply enhanced features to operation options
   */
  async applyEnhancedFeatures(registryType, operation, operationData, options) {
    const enhancedOptions = { ...options }

    // A/B Testing
    if (this.isFeatureEnabled(INTEGRATION_FEATURES.AB_TESTING)) {
      enhancedOptions.abTestGroup = this.determineABTestGroup(registryType, operation, options)
    }

    // Load Balancing
    if (this.isFeatureEnabled(INTEGRATION_FEATURES.LOAD_BALANCING)) {
      enhancedOptions.loadBalancingHint = this.getLoadBalancingHint(registryType)
    }

    // Circuit Breaker
    if (this.isFeatureEnabled(INTEGRATION_FEATURES.CIRCUIT_BREAKERS)) {
      enhancedOptions.circuitBreakerState = this.getCircuitBreakerState(registryType)
    }

    return enhancedOptions
  }

  /**
   * Get appropriate registry by type
   */
  getRegistry(registryType) {
    switch (registryType) {
      case 'auth': return this.authRegistry
      case 'payment': return this.paymentRegistry
      case 'wallet': return this.walletRegistry
      case 'kyc': return this.kycRegistry
      case 'twofa': return this.twoFARegistry
      case 'onchain': return this.onChainRegistry
      default: return this.registries.get(registryType)
    }
  }

  /**
   * Get all available providers from a registry
   */
  async getAvailableProviders(registryType) {
    const registry = this.getRegistry(registryType)
    if (!registry) return []
    
    return await registry.getAvailableProviders()
  }

  /**
   * Get health status of all registries
   */
  async getHealthStatus() {
    if (!this.isInitialized) {
      return { status: 'not_initialized' }
    }

    const registryHealth = {}
    const registryTypes = ['auth', 'payment', 'wallet', 'kyc', 'twofa', 'onchain']
    
    for (const type of registryTypes) {
      const registry = this.getRegistry(type)
      if (registry && typeof registry.getHealthStatus === 'function') {
        registryHealth[type] = await registry.getHealthStatus()
      }
    }

    const overallHealth = {
      status: 'healthy',
      registries: registryHealth,
      initialized: this.isInitialized,
      enabledFeatures: Array.from(this.enabledFeatures)
    }

    // Add performance metrics if enabled
    if (this.isFeatureEnabled(INTEGRATION_FEATURES.PERFORMANCE_ANALYTICS)) {
      overallHealth.metrics = {
        global: this.globalMetrics,
        realTime: this.realTimeMetrics
      }
    }

    return overallHealth
  }

  /**
   * Performance analytics methods
   */
  recordSuccessMetrics(startTime, registryType, operation) {
    const responseTime = Date.now() - startTime
    
    this.globalMetrics.successfulRequests++
    this.globalMetrics.responseTimes.push(responseTime)
    
    // Keep only last 1000 response times for percentile calculation
    if (this.globalMetrics.responseTimes.length > 1000) {
      this.globalMetrics.responseTimes = this.globalMetrics.responseTimes.slice(-1000)
    }
    
    // Update averages
    this.updateResponseTimeMetrics()
  }

  recordFailureMetrics(startTime, registryType, operation, error) {
    this.globalMetrics.failedRequests++
    
    // Log error details
    this.logger.logError('Integration operation failed', {
      registryType,
      operation,
      error: error.message,
      responseTime: Date.now() - startTime
    })
  }

  updateResponseTimeMetrics() {
    const times = this.globalMetrics.responseTimes
    if (times.length === 0) return
    
    const sortedTimes = [...times].sort((a, b) => a - b)
    
    this.globalMetrics.avgResponseTime = times.reduce((a, b) => a + b, 0) / times.length
    this.globalMetrics.p95ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.95)]
    this.globalMetrics.p99ResponseTime = sortedTimes[Math.floor(sortedTimes.length * 0.99)]
  }

  updateRealTimeMetrics() {
    const now = Date.now()
    const timeSinceLastUpdate = now - this.realTimeMetrics.lastUpdate
    
    if (timeSinceLastUpdate > 0) {
      this.realTimeMetrics.requestsPerSecond = this.globalMetrics.totalRequests / (timeSinceLastUpdate / 1000)
      this.realTimeMetrics.errorRate = this.globalMetrics.totalRequests > 0 ? 
        (this.globalMetrics.failedRequests / this.globalMetrics.totalRequests) * 100 : 0
      this.realTimeMetrics.lastUpdate = now
    }
  }

  /**
   * Enhanced feature methods (placeholder implementations)
   */
  determineABTestGroup(registryType, operation, options) {
    // Simple hash-based assignment
    const hash = this.hashString(`${registryType}_${operation}_${options.userId || 'anonymous'}`)
    return hash % 2 === 0 ? 'A' : 'B'
  }

  getLoadBalancingHint(registryType) {
    return { strategy: LOAD_BALANCING_STRATEGIES.ROUND_ROBIN }
  }

  getCircuitBreakerState(registryType) {
    return { state: 'closed', failures: 0, lastFailure: null }
  }

  initializeCircuitBreakers() {
    this.circuitBreakers = new Map()
  }

  initializeLoadBalancing() {
    this.loadBalancers = new Map()
  }

  startProviderDiscovery() {
    // Placeholder for provider discovery logic
    this.discoveryInterval = setInterval(() => {
      this.discoverProviders()
    }, 600000) // 10 minutes
  }

  async discoverProviders() {
    // Placeholder for actual provider discovery
    logger.debug('Provider discovery cycle started')
  }

  hashString(str) {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Cleanup and shutdown
   */
  async shutdown() {
    if (this.metricsInterval) {
      clearInterval(this.metricsInterval)
    }
    
    if (this.discoveryInterval) {
      clearInterval(this.discoveryInterval)
    }
    
    if (this.configUpdateInterval) {
      clearInterval(this.configUpdateInterval)
    }
    
    await this.healthMonitor.shutdown()
    
    logger.info('UnifiedIntegrationManager shutdown completed')
  }
}

// Export singleton instance for basic usage
export const unifiedIntegrationManager = new UnifiedIntegrationManager({
  enabledFeatures: [INTEGRATION_FEATURES.BASIC]
})

// Export enhanced instance factory
export const createEnhancedIntegrationManager = (options = {}) => {
  return new UnifiedIntegrationManager({
    enabledFeatures: [
      INTEGRATION_FEATURES.BASIC,
      INTEGRATION_FEATURES.PERFORMANCE_ANALYTICS,
      INTEGRATION_FEATURES.LOAD_BALANCING,
      INTEGRATION_FEATURES.CIRCUIT_BREAKERS,
      ...( options.enabledFeatures || [] )
    ],
    ...options
  })
}

export default UnifiedIntegrationManager