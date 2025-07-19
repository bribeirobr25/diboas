/**
 * Provider Health Monitor
 * Monitors the health and performance of all integration providers
 */

export class ProviderHealthMonitor {
  constructor() {
    this.healthChecks = new Map()
    this.healthHistory = new Map()
    this.isRunning = false
    this.checkInterval = null
    this.config = {
      checkInterval: 30000, // 30 seconds
      historyRetention: 100, // Keep last 100 health checks
      alertThreshold: 3, // Alert after 3 consecutive failures
      timeoutMs: 5000 // 5 second timeout for health checks
    }
    this.listeners = new Set()
  }

  /**
   * Start health monitoring
   */
  async start() {
    if (this.isRunning) {
      return
    }

    this.isRunning = true
    
    // Run initial health check
    await this.runHealthChecks()
    
    // Start periodic health checks
    this.checkInterval = setInterval(async () => {
      try {
        await this.runHealthChecks()
      } catch (error) {
        console.error('Health check failed:', error)
      }
    }, this.config.checkInterval)

    console.log('Provider health monitoring started')
  }

  /**
   * Stop health monitoring
   */
  async stop() {
    this.isRunning = false
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval)
      this.checkInterval = null
    }

    console.log('Provider health monitoring stopped')
  }

  /**
   * Register a provider for health monitoring
   */
  registerProvider(registryType, providerId, healthCheckFn) {
    const key = `${registryType}:${providerId}`
    
    this.healthChecks.set(key, {
      registryType,
      providerId,
      healthCheck: healthCheckFn,
      lastCheck: null,
      consecutiveFailures: 0,
      isHealthy: true
    })

    // Initialize health history
    this.healthHistory.set(key, [])
  }

  /**
   * Unregister a provider
   */
  unregisterProvider(registryType, providerId) {
    const key = `${registryType}:${providerId}`
    this.healthChecks.delete(key)
    this.healthHistory.delete(key)
  }

  /**
   * Run health checks for all providers
   */
  async runHealthChecks() {
    const checkPromises = Array.from(this.healthChecks.entries()).map(
      async ([key, checkData]) => {
        try {
          const startTime = Date.now()
          
          // Run health check with timeout
          const isHealthy = await this._runWithTimeout(
            checkData.healthCheck,
            this.config.timeoutMs
          )
          
          const duration = Date.now() - startTime
          
          // Update health status
          this._updateHealthStatus(key, isHealthy, duration)
          
        } catch (error) {
          // Health check failed
          this._updateHealthStatus(key, false, null, error)
        }
      }
    )

    await Promise.allSettled(checkPromises)
  }

  /**
   * Update health status for a provider
   */
  _updateHealthStatus(key, isHealthy, duration, error = null) {
    const checkData = this.healthChecks.get(key)
    if (!checkData) return

    const now = new Date()
    const wasHealthy = checkData.isHealthy

    // Update consecutive failures
    if (isHealthy) {
      checkData.consecutiveFailures = 0
    } else {
      checkData.consecutiveFailures++
    }

    // Update health status
    checkData.isHealthy = isHealthy
    checkData.lastCheck = now

    // Record in history
    const history = this.healthHistory.get(key) || []
    history.push({
      timestamp: now,
      isHealthy,
      duration,
      error: error ? error.message : null
    })

    // Trim history
    if (history.length > this.config.historyRetention) {
      history.splice(0, history.length - this.config.historyRetention)
    }
    this.healthHistory.set(key, history)

    // Check for alerts
    if (checkData.consecutiveFailures >= this.config.alertThreshold) {
      this._triggerAlert(key, checkData)
    }

    // Notify listeners of health change
    if (wasHealthy !== isHealthy) {
      this._notifyHealthChange(key, checkData)
    }
  }

  /**
   * Run function with timeout
   */
  async _runWithTimeout(fn, timeoutMs) {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error('Health check timeout'))
      }, timeoutMs)

      Promise.resolve(fn())
        .then(result => {
          clearTimeout(timeout)
          resolve(result)
        })
        .catch(error => {
          clearTimeout(timeout)
          reject(error)
        })
    })
  }

  /**
   * Trigger alert for unhealthy provider
   */
  _triggerAlert(key, checkData) {
    const alert = {
      type: 'provider_unhealthy',
      key,
      registryType: checkData.registryType,
      providerId: checkData.providerId,
      consecutiveFailures: checkData.consecutiveFailures,
      timestamp: new Date()
    }

    console.warn('Provider health alert:', alert)
    
    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(alert)
      } catch (error) {
        console.error('Health monitor listener error:', error)
      }
    })
  }

  /**
   * Notify listeners of health changes
   */
  _notifyHealthChange(key, checkData) {
    const event = {
      type: 'health_change',
      key,
      registryType: checkData.registryType,
      providerId: checkData.providerId,
      isHealthy: checkData.isHealthy,
      timestamp: new Date()
    }

    this.listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        console.error('Health monitor listener error:', error)
      }
    })
  }

  /**
   * Add event listener
   */
  addListener(listener) {
    this.listeners.add(listener)
  }

  /**
   * Remove event listener
   */
  removeListener(listener) {
    this.listeners.delete(listener)
  }

  /**
   * Get health status for a specific provider
   */
  getProviderHealth(registryType, providerId) {
    const key = `${registryType}:${providerId}`
    const checkData = this.healthChecks.get(key)
    const history = this.healthHistory.get(key) || []

    if (!checkData) {
      return null
    }

    // Calculate uptime percentage
    const recentHistory = history.slice(-20) // Last 20 checks
    const uptime = recentHistory.length > 0 
      ? (recentHistory.filter(h => h.isHealthy).length / recentHistory.length) * 100
      : 100

    // Calculate average response time
    const healthyChecks = recentHistory.filter(h => h.isHealthy && h.duration)
    const avgResponseTime = healthyChecks.length > 0
      ? healthyChecks.reduce((sum, h) => sum + h.duration, 0) / healthyChecks.length
      : 0

    return {
      registryType: checkData.registryType,
      providerId: checkData.providerId,
      isHealthy: checkData.isHealthy,
      lastCheck: checkData.lastCheck,
      consecutiveFailures: checkData.consecutiveFailures,
      uptime: Math.round(uptime * 100) / 100,
      avgResponseTime: Math.round(avgResponseTime),
      historyCount: history.length
    }
  }

  /**
   * Get overall health summary
   */
  async getOverallHealth() {
    const providerHealths = []
    let totalProviders = 0
    let healthyProviders = 0

    for (const [key, checkData] of this.healthChecks) {
      const health = this.getProviderHealth(checkData.registryType, checkData.providerId)
      if (health) {
        providerHealths.push(health)
        totalProviders++
        if (health.isHealthy) {
          healthyProviders++
        }
      }
    }

    const overallHealthPercentage = totalProviders > 0 
      ? (healthyProviders / totalProviders) * 100 
      : 100

    // Calculate system status
    let systemStatus = 'healthy'
    if (overallHealthPercentage < 50) {
      systemStatus = 'critical'
    } else if (overallHealthPercentage < 80) {
      systemStatus = 'degraded'
    } else if (overallHealthPercentage < 100) {
      systemStatus = 'warning'
    }

    return {
      systemStatus,
      overallHealthPercentage: Math.round(overallHealthPercentage * 100) / 100,
      totalProviders,
      healthyProviders,
      unhealthyProviders: totalProviders - healthyProviders,
      lastUpdate: new Date(),
      providers: providerHealths.reduce((acc, health) => {
        const registryKey = health.registryType
        if (!acc[registryKey]) {
          acc[registryKey] = []
        }
        acc[registryKey].push(health)
        return acc
      }, {})
    }
  }

  /**
   * Get health history for a provider
   */
  getProviderHistory(registryType, providerId, limit = 50) {
    const key = `${registryType}:${providerId}`
    const history = this.healthHistory.get(key) || []
    
    return history.slice(-limit).map(entry => ({
      timestamp: entry.timestamp,
      isHealthy: entry.isHealthy,
      duration: entry.duration,
      error: entry.error
    }))
  }

  /**
   * Force health check for specific provider
   */
  async forceHealthCheck(registryType, providerId) {
    const key = `${registryType}:${providerId}`
    const checkData = this.healthChecks.get(key)
    
    if (!checkData) {
      throw new Error(`Provider ${key} not found`)
    }

    try {
      const startTime = Date.now()
      const isHealthy = await this._runWithTimeout(
        checkData.healthCheck,
        this.config.timeoutMs
      )
      const duration = Date.now() - startTime
      
      this._updateHealthStatus(key, isHealthy, duration)
      
      return this.getProviderHealth(registryType, providerId)
    } catch (error) {
      this._updateHealthStatus(key, false, null, error)
      throw error
    }
  }

  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig }
    
    // Restart with new interval if needed
    if (this.isRunning && newConfig.checkInterval) {
      this.stop()
      this.start()
    }
  }

  /**
   * Get monitoring statistics
   */
  getStats() {
    const stats = {
      isRunning: this.isRunning,
      totalProviders: this.healthChecks.size,
      config: this.config,
      listeners: this.listeners.size
    }

    return stats
  }
}

export default ProviderHealthMonitor