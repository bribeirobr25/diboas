/**
 * Base Provider Registry
 * Common functionality for all provider registries
 */

export class BaseProviderRegistry {
  constructor(registryType) {
    this.registryType = registryType
    this.providers = new Map()
    this.healthStatus = new Map()
    this.providerStats = new Map()
    this.fallbackOrder = []
    this.logger = {
      info: (msg, data) => console.log(`[${this.registryType.toUpperCase()}]`, msg, data || ''),
      warn: (msg, data) => console.warn(`[${this.registryType.toUpperCase()}]`, msg, data || ''),
      error: (msg, error) => console.error(`[${this.registryType.toUpperCase()}]`, msg, error)
    }
  }

  /**
   * Register a provider
   */
  register(providerId, provider, options = {}) {
    if (this.providers.has(providerId)) {
      throw new Error(`Provider ${providerId} is already registered`)
    }

    this.providers.set(providerId, provider)
    this.healthStatus.set(providerId, { healthy: true, lastCheck: new Date() })
    this.providerStats.set(providerId, {
      totalRequests: 0,
      successfulRequests: 0,
      failedRequests: 0,
      averageResponseTime: 0,
      lastUsed: null
    })

    // Add to fallback order if specified
    if (options.fallbackPriority !== undefined) {
      this.setFallbackPriority(providerId, options.fallbackPriority)
    } else {
      this.fallbackOrder.push(providerId)
    }

    this.logger.info(`Provider registered: ${providerId}`)
  }

  /**
   * Unregister a provider
   */
  unregister(providerId) {
    if (!this.providers.has(providerId)) {
      throw new Error(`Provider ${providerId} is not registered`)
    }

    this.providers.delete(providerId)
    this.healthStatus.delete(providerId)
    this.providerStats.delete(providerId)
    
    // Remove from fallback order
    this.fallbackOrder = this.fallbackOrder.filter(id => id !== providerId)

    this.logger.info(`Provider unregistered: ${providerId}`)
  }

  /**
   * Get a specific provider
   */
  getProvider(providerId) {
    const provider = this.providers.get(providerId)
    if (!provider) {
      throw new Error(`Provider ${providerId} not found`)
    }
    return provider
  }

  /**
   * Get all registered providers
   */
  getAllProviders() {
    return Array.from(this.providers.entries())
  }

  /**
   * Get healthy providers in fallback order
   */
  getHealthyProviders() {
    return this.fallbackOrder
      .filter(providerId => this.isProviderHealthy(providerId))
      .map(providerId => ({
        id: providerId,
        provider: this.providers.get(providerId)
      }))
  }

  /**
   * Set fallback priority for a provider
   */
  setFallbackPriority(providerId, priority) {
    if (!this.providers.has(providerId)) {
      throw new Error(`Provider ${providerId} not found`)
    }

    // Remove from current position
    this.fallbackOrder = this.fallbackOrder.filter(id => id !== providerId)
    
    // Insert at new position
    this.fallbackOrder.splice(priority, 0, providerId)
  }

  /**
   * Execute operation with automatic fallback
   */
  async executeWithFallback(operation, operationData, options = {}) {
    const healthyProviders = this.getHealthyProviders()
    
    if (healthyProviders.length === 0) {
      throw new Error(`No healthy providers available for ${this.registryType}`)
    }

    const maxRetries = options.maxRetries || healthyProviders.length
    const errors = []

    for (let i = 0; i < Math.min(maxRetries, healthyProviders.length); i++) {
      const { id: providerId, provider } = healthyProviders[i]
      const startTime = Date.now()

      try {
        this.logger.info(`Attempting ${operation} with provider: ${providerId}`)
        
        // Update stats
        this.incrementProviderStat(providerId, 'totalRequests')
        
        // Execute the operation
        let result
        if (typeof provider[operation] === 'function') {
          result = await provider[operation](operationData, options)
        } else {
          throw new Error(`Operation ${operation} not supported by provider ${providerId}`)
        }

        // Track success
        const duration = Date.now() - startTime
        this.updateProviderStats(providerId, true, duration)
        
        return {
          success: true,
          result,
          provider: providerId,
          duration,
          attempt: i + 1
        }

      } catch (error) {
        const duration = Date.now() - startTime
        this.updateProviderStats(providerId, false, duration)
        
        errors.push({
          providerId,
          error: error.message,
          duration,
          attempt: i + 1
        })

        this.logger.warn(`Provider ${providerId} failed for ${operation}`, error.message)

        // Mark provider as potentially unhealthy if it fails
        this.checkProviderHealth(providerId, false)

        // Continue to next provider
        continue
      }
    }

    // All providers failed
    const error = new Error(`All ${this.registryType} providers failed`)
    error.attempts = errors
    throw error
  }

  /**
   * Check if provider is healthy
   */
  isProviderHealthy(providerId) {
    const status = this.healthStatus.get(providerId)
    return status ? status.healthy : false
  }

  /**
   * Update provider health status
   */
  checkProviderHealth(providerId, isHealthy) {
    const currentStatus = this.healthStatus.get(providerId)
    if (currentStatus) {
      currentStatus.healthy = isHealthy
      currentStatus.lastCheck = new Date()
      
      if (!isHealthy) {
        this.logger.warn(`Provider ${providerId} marked as unhealthy`)
      }
    }
  }

  /**
   * Update provider statistics
   */
  updateProviderStats(providerId, success, duration) {
    const stats = this.providerStats.get(providerId)
    if (!stats) return

    if (success) {
      stats.successfulRequests++
    } else {
      stats.failedRequests++
    }

    // Update average response time
    const totalRequests = stats.successfulRequests + stats.failedRequests
    stats.averageResponseTime = ((stats.averageResponseTime * (totalRequests - 1)) + duration) / totalRequests
    stats.lastUsed = new Date()
  }

  /**
   * Increment a provider statistic
   */
  incrementProviderStat(providerId, statName) {
    const stats = this.providerStats.get(providerId)
    if (stats && stats.hasOwnProperty(statName)) {
      stats[statName]++
    }
  }

  /**
   * Get provider statistics
   */
  getProviderStats(providerId) {
    return this.providerStats.get(providerId) || null
  }

  /**
   * Get all provider statistics
   */
  getAllStats() {
    const stats = {
      registryType: this.registryType,
      totalProviders: this.providers.size,
      healthyProviders: this.getHealthyProviders().length,
      fallbackOrder: [...this.fallbackOrder],
      providers: {}
    }

    for (const [providerId, providerStats] of this.providerStats) {
      stats.providers[providerId] = {
        ...providerStats,
        healthy: this.isProviderHealthy(providerId),
        successRate: providerStats.totalRequests > 0 
          ? (providerStats.successfulRequests / providerStats.totalRequests * 100).toFixed(2)
          : '0.00'
      }
    }

    return stats
  }

  /**
   * Get provider last used timestamp
   */
  getProviderLastUsed(providerId) {
    const stats = this.providerStats.get(providerId)
    return stats ? stats.lastUsed : null
  }

  /**
   * Perform health check on all providers
   */
  async performHealthCheck() {
    const healthPromises = Array.from(this.providers.entries()).map(async ([providerId, provider]) => {
      try {
        // Call provider's health check method if available
        if (typeof provider.healthCheck === 'function') {
          const isHealthy = await provider.healthCheck()
          this.checkProviderHealth(providerId, isHealthy)
        } else {
          // If no health check method, assume healthy
          this.checkProviderHealth(providerId, true)
        }
      } catch (error) {
        this.logger.error(`Health check failed for provider ${providerId}`, error)
        this.checkProviderHealth(providerId, false)
      }
    })

    await Promise.allSettled(healthPromises)
    
    const healthyCount = this.getHealthyProviders().length
    this.logger.info(`Health check completed: ${healthyCount}/${this.providers.size} providers healthy`)
  }

  /**
   * Reset provider statistics
   */
  resetProviderStats(providerId) {
    if (this.providerStats.has(providerId)) {
      this.providerStats.set(providerId, {
        totalRequests: 0,
        successfulRequests: 0,
        failedRequests: 0,
        averageResponseTime: 0,
        lastUsed: null
      })
      this.logger.info(`Reset statistics for provider: ${providerId}`)
    }
  }

  /**
   * Reset all statistics
   */
  resetAllStats() {
    for (const providerId of this.providers.keys()) {
      this.resetProviderStats(providerId)
    }
    this.logger.info('Reset all provider statistics')
  }

  /**
   * Shutdown the registry
   */
  async shutdown() {
    // Shutdown all providers if they support it
    const shutdownPromises = Array.from(this.providers.entries()).map(async ([providerId, provider]) => {
      try {
        if (typeof provider.shutdown === 'function') {
          await provider.shutdown()
        }
      } catch (error) {
        this.logger.error(`Shutdown failed for provider ${providerId}`, error)
      }
    })

    await Promise.allSettled(shutdownPromises)
    
    this.providers.clear()
    this.healthStatus.clear()
    this.providerStats.clear()
    this.fallbackOrder = []
    
    this.logger.info(`${this.registryType} registry shutdown completed`)
  }
}

export default BaseProviderRegistry