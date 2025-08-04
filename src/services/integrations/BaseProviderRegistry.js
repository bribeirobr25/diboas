/**
 * Base Provider Registry for diBoaS Integration System
 * Provides common functionality for all provider registries
 * Ensures consistent abstraction layer across all integrations
 */

import secureLogger from '../../utils/secureLogger.js'
import { checkGeneralRateLimit } from '../../utils/advancedRateLimiter.js'

/**
 * Provider Health Status
 */
export const PROVIDER_STATUS = {
  HEALTHY: 'healthy',
  DEGRADED: 'degraded',
  UNHEALTHY: 'unhealthy',
  OFFLINE: 'offline'
}

/**
 * Base Provider Registry Class
 * All integration registries should extend this class
 */
export class BaseProviderRegistry {
  constructor(registryType, options = {}) {
    this.registryType = registryType
    this.providers = new Map()
    this.providerConfigs = new Map()
    this.providerStats = new Map()
    this.fallbackChain = []
    
    // Configuration options - optimized for better performance
    this.options = {
      healthCheckInterval: options.healthCheckInterval || 300000, // 5 minutes - reduced frequency
      maxRetries: options.maxRetries || 1, // Reduced retries to minimize API calls
      retryDelay: options.retryDelay || 2000, // Increased delay between retries
      healthThreshold: options.healthThreshold || 0.8,
      ...options
    }
    
    // Start health monitoring
    this.startHealthMonitoring()
    
    secureLogger.audit('PROVIDER_REGISTRY_INITIALIZED', {
      registryType: this.registryType,
      timestamp: new Date().toISOString()
    })
  }

  /**
   * Register a provider with the registry
   */
  async registerProvider(providerId, provider, config = {}) {
    // Validate provider interface
    this.validateProviderInterface(provider)
    
    // Store provider and config
    this.providers.set(providerId, provider)
    this.providerConfigs.set(providerId, {
      priority: config.priority || 1,
      weight: config.weight || 1,
      enabled: config.enabled !== false,
      environments: config.environments || ['development', 'staging', 'production'],
      features: config.features || [],
      rateLimit: config.rateLimit || 100,
      timeout: config.timeout || 5000,
      retries: config.retries || 2,
      healthCheck: config.healthCheck || true,
      ...config
    })
    
    // Initialize stats
    this.providerStats.set(providerId, {
      successCount: 0,
      failureCount: 0,
      totalRequests: 0,
      averageLatency: 0,
      lastSuccess: null,
      lastFailure: null,
      status: PROVIDER_STATUS.HEALTHY,
      uptime: 100
    })
    
    // Add to fallback chain based on priority
    this.updateFallbackChain()
    
    secureLogger.audit('PROVIDER_REGISTERED', {
      registryType: this.registryType,
      providerId,
      priority: this.providerConfigs.get(providerId).priority,
      features: this.providerConfigs.get(providerId).features
    })
    
    // Run initial health check
    if (config.healthCheck !== false) {
      await this.checkProviderHealth(providerId)
    }
    
    return true
  }

  /**
   * Get the best available provider for a request
   */
  getBestProvider(requirements = {}) {
    const {
      feature = null,
      environment = typeof process !== 'undefined' ? process?.env?.NODE_ENV : 'development',
      excludeProviders = [],
      forceProvider = null
    } = requirements
    
    // Force specific provider if requested
    if (forceProvider && this.providers.has(forceProvider)) {
      const config = this.providerConfigs.get(forceProvider)
      if (config.enabled && this.isProviderHealthy(forceProvider)) {
        return forceProvider
      }
    }
    
    // Filter providers based on requirements
    const availableProviders = this.fallbackChain.filter(providerId => {
      const config = this.providerConfigs.get(providerId)
      const stats = this.providerStats.get(providerId)
      
      return (
        !excludeProviders.includes(providerId) &&
        config.enabled &&
        config.environments.includes(environment) &&
        (feature === null || config.features.includes(feature)) &&
        stats.status !== PROVIDER_STATUS.OFFLINE &&
        this.isProviderHealthy(providerId)
      )
    })
    
    if (availableProviders.length === 0) {
      throw new Error(`No available providers for ${this.registryType} integration`)
    }
    
    // Return best available provider (highest priority, best health)
    return availableProviders[0]
  }

  /**
   * Execute request with automatic failover
   */
  async executeWithFailover(operation, requirements = {}) {
    const maxAttempts = requirements.maxAttempts || this.options.maxRetries
    let lastError = null
    const attemptedProviders = new Set()
    
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        // Get best available provider
        const providerId = this.getBestProvider({
          ...requirements,
          excludeProviders: Array.from(attemptedProviders)
        })
        
        attemptedProviders.add(providerId)
        
        const startTime = Date.now()
        
        // Check rate limiting
        const rateLimitResult = checkGeneralRateLimit(`${this.registryType}-${providerId}`, {
          operation: operation.name || 'generic',
          providerId
        })
        
        if (!rateLimitResult.allowed) {
          throw new Error(`Rate limit exceeded for provider ${providerId}`)
        }
        
        // Execute operation with provider
        const provider = this.providers.get(providerId)
        const result = await operation(provider, providerId)
        
        // Record success
        const latency = Date.now() - startTime
        await this.recordExecution(providerId, operation.name || 'generic', { latency, success: true })
        
        return {
          success: true,
          providerId,
          result,
          latency,
          attempts: attempt + 1
        }
        
      } catch (error) {
        lastError = error
        
        // Record failure if we have a provider
        const providerId = Array.from(attemptedProviders).slice(-1)[0]
        if (providerId) {
          await this.recordFailure(providerId, operation.name || 'generic', error)
        }
        
        // Wait before retry
        if (attempt < maxAttempts - 1) {
          await new Promise(resolve => setTimeout(resolve, this.options.retryDelay * (attempt + 1)))
        }
      }
    }
    
    // All providers failed
    secureLogger.audit('ALL_PROVIDERS_FAILED', {
      registryType: this.registryType,
      operation: operation.name || 'generic',
      attempts: maxAttempts,
      error: lastError?.message
    })
    
    throw new Error(`All providers failed for ${this.registryType} integration: ${lastError?.message}`)
  }

  /**
   * Record successful execution
   */
  async recordExecution(providerId, operation, metadata = {}) {
    const stats = this.providerStats.get(providerId)
    if (!stats) return
    
    stats.successCount++
    stats.totalRequests++
    stats.lastSuccess = new Date().toISOString()
    
    // Update average latency
    if (metadata.latency) {
      stats.averageLatency = (stats.averageLatency + metadata.latency) / 2
    }
    
    // Update provider health
    this.updateProviderHealth(providerId)
    
    secureLogger.audit('PROVIDER_EXECUTION_SUCCESS', {
      registryType: this.registryType,
      providerId,
      operation,
      latency: metadata.latency
    })
  }

  /**
   * Record failed execution
   */
  async recordFailure(providerId, operation, error) {
    const stats = this.providerStats.get(providerId)
    if (!stats) return
    
    stats.failureCount++
    stats.totalRequests++
    stats.lastFailure = new Date().toISOString()
    
    // Update provider health
    this.updateProviderHealth(providerId)
    
    secureLogger.audit('PROVIDER_EXECUTION_FAILURE', {
      registryType: this.registryType,
      providerId,
      operation,
      error: error.message
    })
  }

  /**
   * Check if provider is healthy
   */
  isProviderHealthy(providerId) {
    const stats = this.providerStats.get(providerId)
    if (!stats) return false
    
    const successRate = stats.totalRequests > 0 
      ? stats.successCount / stats.totalRequests 
      : 1
      
    return stats.status !== PROVIDER_STATUS.OFFLINE && 
           successRate >= this.options.healthThreshold
  }

  /**
   * Update provider health status
   */
  updateProviderHealth(providerId) {
    const stats = this.providerStats.get(providerId)
    if (!stats) return
    
    const successRate = stats.totalRequests > 0 
      ? stats.successCount / stats.totalRequests 
      : 1
      
    stats.uptime = successRate * 100
    
    if (successRate >= 0.95) {
      stats.status = PROVIDER_STATUS.HEALTHY
    } else if (successRate >= 0.8) {
      stats.status = PROVIDER_STATUS.DEGRADED
    } else if (successRate >= 0.5) {
      stats.status = PROVIDER_STATUS.UNHEALTHY
    } else {
      stats.status = PROVIDER_STATUS.OFFLINE
    }
  }

  /**
   * Run health check on specific provider
   */
  async checkProviderHealth(providerId) {
    const provider = this.providers.get(providerId)
    const config = this.providerConfigs.get(providerId)
    
    if (!provider || !config.healthCheck) return
    
    try {
      // Use provider's health check method if available
      if (typeof provider.healthCheck === 'function') {
        const result = await Promise.race([
          provider.healthCheck(),
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Health check timeout')), config.timeout)
          )
        ])
        
        if (result.healthy !== false) {
          await this.recordExecution(providerId, 'healthCheck', {})
        } else {
          await this.recordFailure(providerId, 'healthCheck', new Error('Health check failed'))
        }
      }
    } catch (error) {
      await this.recordFailure(providerId, 'healthCheck', error)
    }
  }

  /**
   * Start health monitoring for all providers
   */
  startHealthMonitoring() {
    // Clear existing interval if any to prevent duplicates
    this.stopHealthMonitoring()
    
    this.healthMonitoringInterval = setInterval(async () => {
      for (const providerId of this.providers.keys()) {
        await this.checkProviderHealth(providerId)
      }
    }, this.options.healthCheckInterval)
  }

  /**
   * Stop health monitoring and clean up interval
   */
  stopHealthMonitoring() {
    if (this.healthMonitoringInterval) {
      clearInterval(this.healthMonitoringInterval)
      this.healthMonitoringInterval = null
    }
  }

  /**
   * Destroy the registry and clean up all resources
   */
  destroy() {
    this.stopHealthMonitoring()
    this.providers.clear()
    this.providerConfigs.clear()
    this.providerStats.clear()
    this.fallbackChain = []
  }

  /**
   * Update fallback chain based on provider priorities
   */
  updateFallbackChain() {
    const providers = Array.from(this.providerConfigs.entries())
      .filter(([_, config]) => config.enabled)
      .sort(([aId, aConfig], [bId, bConfig]) => {
        // Sort by priority (higher first), then by weight (higher first)
        if (aConfig.priority !== bConfig.priority) {
          return bConfig.priority - aConfig.priority
        }
        return bConfig.weight - aConfig.weight
      })
      .map(([providerId, _]) => providerId)
    
    this.fallbackChain = providers
  }

  /**
   * Validate provider interface (to be overridden by subclasses)
   */
  validateProviderInterface(provider) {
    // Base validation - subclasses should override for specific requirements
    if (!provider || typeof provider !== 'object') {
      throw new Error('Provider must be an object')
    }
  }

  /**
   * Get registry health status
   */
  getHealthStatus() {
    const providerStatuses = Array.from(this.providerStats.entries()).map(([providerId, stats]) => ({
      providerId,
      status: stats.status,
      successRate: stats.totalRequests > 0 ? (stats.successCount / stats.totalRequests) : 1,
      averageLatency: stats.averageLatency,
      uptime: stats.uptime,
      lastSuccess: stats.lastSuccess,
      lastFailure: stats.lastFailure
    }))
    
    const healthyProviders = providerStatuses.filter(p => p.status === PROVIDER_STATUS.HEALTHY).length
    const totalProviders = providerStatuses.length
    
    return {
      registryType: this.registryType,
      overallHealth: totalProviders > 0 ? (healthyProviders / totalProviders) * 100 : 0,
      totalProviders,
      healthyProviders,
      providers: providerStatuses,
      fallbackChain: this.fallbackChain
    }
  }

  /**
   * Get provider statistics
   */
  getProviderStats(providerId) {
    if (providerId) {
      return this.providerStats.get(providerId)
    }
    
    return Array.from(this.providerStats.entries()).reduce((stats, [id, providerStats]) => {
      stats[id] = providerStats
      return stats
    }, {})
  }

  /**
   * Enable/disable provider
   */
  setProviderEnabled(providerId, enabled) {
    const config = this.providerConfigs.get(providerId)
    if (config) {
      config.enabled = enabled
      this.updateFallbackChain()
      
      secureLogger.audit('PROVIDER_ENABLED_CHANGED', {
        registryType: this.registryType,
        providerId,
        enabled
      })
    }
  }

  /**
   * Update provider configuration
   */
  updateProviderConfig(providerId, newConfig) {
    const currentConfig = this.providerConfigs.get(providerId)
    if (currentConfig) {
      this.providerConfigs.set(providerId, { ...currentConfig, ...newConfig })
      this.updateFallbackChain()
      
      secureLogger.audit('PROVIDER_CONFIG_UPDATED', {
        registryType: this.registryType,
        providerId,
        changes: Object.keys(newConfig)
      })
    }
  }
}

export default BaseProviderRegistry