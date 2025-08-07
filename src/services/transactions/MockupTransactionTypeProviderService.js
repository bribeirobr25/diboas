/**
 * Mockup Transaction Type Provider Service
 * Provides dynamic transaction type configurations with icons, styling, and metadata
 * NO CACHING - Always real-time data as per pattern requirements
 */

import logger from '../../utils/logger.js'
import { safeAsyncExecute } from '../../utils/safeDataHandling'

export class MockupTransactionTypeProviderService {
  constructor() {
    this.serviceName = 'MockupTransactionTypeProviderService'
    this.version = '1.0.0'
    
    // Health tracking for circuit breaker pattern
    this.healthStatus = {
      isHealthy: true,
      lastCheck: Date.now(),
      consecutiveFailures: 0,
      uptime: Date.now()
    }
    
    // Error simulation and resilience
    this.errorRate = 0.02 // 2% error rate for testing
    this.circuitBreakerThreshold = 5
    this.isCircuitOpen = false
    this.lastErrorTime = null
  }

  /**
   * Get all available transaction type configurations
   */
  async getAllTransactionTypes() {
    return await safeAsyncExecute(
      async () => this._fetchTransactionTypesInternal(),
      {
        timeout: 8000,
        retries: 3,
        retryDelay: 1000,
        exponentialBackoff: true,
        fallback: this._getFallbackTransactionTypes(),
        throwOnFailure: false
      }
    )
  }

  /**
   * Get transaction types filtered by category
   */
  async getTransactionTypesByCategory(category) {
    return await safeAsyncExecute(
      async () => this._fetchTransactionTypesByCategoryInternal(category),
      {
        timeout: 6000,
        retries: 3,
        fallback: this._getFallbackTransactionTypes().filter(t => t.category === category),
        throwOnFailure: false
      }
    )
  }

  /**
   * Get specific transaction type configuration
   */
  async getTransactionTypeById(typeId) {
    await this.simulateNetworkDelay(150, 400)
    
    const allTypes = await this._fetchTransactionTypesInternal()
    return allTypes.find(type => type.id === typeId) || null
  }

  /**
   * Internal method to fetch all transaction types
   */
  async _fetchTransactionTypesInternal() {
    await this.simulateNetworkDelay(200, 600)
    
    // Simulate random failures for testing resilience
    if (Math.random() < this.errorRate) {
      this._recordFailure()
      throw new Error('Transaction type service temporarily unavailable')
    }

    const baseTransactionTypes = [
      { 
        id: 'add', 
        label: 'Add', 
        iconType: 'plus',
        description: 'Add money to your diBoaS wallet',
        bgColor: 'bg-green-50', 
        color: 'text-green-700', 
        borderColor: 'border-green-200',
        category: 'banking',
        priority: 1,
        enabled: true,
        requiresAuth: false,
        supportedRegions: ['US', 'EU', 'UK', 'CA'],
        minimumAmount: 10,
        maximumAmount: 50000,
        supportedPaymentMethods: ['credit_card', 'bank_account', 'apple_pay', 'google_pay', 'paypal']
      },
      { 
        id: 'send', 
        label: 'Send', 
        iconType: 'send',
        description: 'Send money to another diBoaS user',
        bgColor: 'bg-blue-50', 
        color: 'text-blue-700', 
        borderColor: 'border-blue-200',
        category: 'banking',
        priority: 2,
        enabled: true,
        requiresAuth: true,
        supportedRegions: ['GLOBAL'],
        minimumAmount: 1,
        maximumAmount: 100000,
        supportedPaymentMethods: ['diboas_wallet']
      },
      { 
        id: 'buy', 
        label: 'Buy', 
        iconType: 'trending_up',
        description: 'Buy cryptocurrency assets',
        bgColor: 'bg-emerald-50', 
        color: 'text-emerald-700', 
        borderColor: 'border-emerald-200',
        category: 'investment',
        priority: 3,
        enabled: true,
        requiresAuth: true,
        supportedRegions: ['US', 'EU', 'UK', 'CA'],
        minimumAmount: 25,
        maximumAmount: 25000,
        supportedPaymentMethods: ['credit_card', 'bank_account', 'diboas_wallet', 'apple_pay', 'google_pay'],
        supportedAssets: ['BTC', 'ETH', 'SOL', 'SUI', 'USDC', 'PAXG', 'XAUT', 'MAG7', 'SPX', 'REIT']
      },
      { 
        id: 'sell', 
        label: 'Sell', 
        iconType: 'trending_down',
        description: 'Sell your crypto assets back to USD',
        bgColor: 'bg-red-50', 
        color: 'text-red-700', 
        borderColor: 'border-red-200',
        category: 'investment',
        priority: 4,
        enabled: true,
        requiresAuth: true,
        supportedRegions: ['US', 'EU', 'UK', 'CA'],
        minimumAmount: 1,
        maximumAmount: 100000,
        supportedPaymentMethods: ['diboas_wallet', 'bank_account', 'paypal'],
        supportedAssets: ['BTC', 'ETH', 'SOL', 'SUI', 'USDC', 'PAXG', 'XAUT', 'MAG7', 'SPX', 'REIT']
      },
      { 
        id: 'withdraw', 
        label: 'Withdraw', 
        iconType: 'credit_card',
        description: 'Withdraw funds to bank or external wallet',
        bgColor: 'bg-indigo-50', 
        color: 'text-indigo-700', 
        borderColor: 'border-indigo-200',
        category: 'banking',
        priority: 5,
        enabled: true,
        requiresAuth: true,
        supportedRegions: ['US', 'EU', 'UK', 'CA'],
        minimumAmount: 50,
        maximumAmount: 100000,
        supportedPaymentMethods: ['external_wallet', 'bank_account', 'paypal']
      },
      {
        id: 'stop_strategy',
        label: 'Stop Strategy',
        iconType: 'trending_down',
        description: 'Stop strategy and claim all funds',
        bgColor: 'bg-red-50',
        color: 'text-red-700',
        borderColor: 'border-red-200',
        category: 'yield',
        priority: 7,
        enabled: true,
        requiresAuth: true,
        supportedRegions: ['GLOBAL'],
        minimumAmount: 0,
        maximumAmount: 1000000,
        supportedPaymentMethods: ['diboas_wallet']
      },
      {
        id: 'start_strategy',
        label: 'Start Strategy',
        iconType: 'play',
        description: 'Launch a new yield strategy',
        bgColor: 'bg-green-50',
        color: 'text-green-700',
        borderColor: 'border-green-200',
        category: 'yield',
        priority: 8,
        enabled: true,
        requiresAuth: true,
        supportedRegions: ['GLOBAL'],
        minimumAmount: 100,
        maximumAmount: 1000000,
        supportedPaymentMethods: ['diboas_wallet']
      }
    ]

    // Add dynamic metadata
    return baseTransactionTypes.map(type => ({
      ...type,
      metadata: {
        lastUpdated: Date.now(),
        version: this.version,
        source: 'MockupTransactionTypeProviderService',
        environment: process.env.NODE_ENV || 'development'
      }
    }))
  }

  /**
   * Internal method to fetch transaction types by category
   */
  async _fetchTransactionTypesByCategoryInternal(category) {
    const allTypes = await this._fetchTransactionTypesInternal()
    
    if (!category) return allTypes
    
    return allTypes.filter(type => type.category === category)
  }

  /**
   * Get transaction type configurations with user permissions
   */
  async getTransactionTypesForUser(userId, userPermissions = {}) {
    await this.simulateNetworkDelay(250, 500)
    
    const allTypes = await this._fetchTransactionTypesInternal()
    
    // Filter based on user permissions and regional availability
    return allTypes.filter(type => {
      // Check if type is globally enabled
      if (!type.enabled) return false
      
      // Check regional availability
      const userRegion = userPermissions.region || 'US'
      if (!type.supportedRegions.includes('GLOBAL') && 
          !type.supportedRegions.includes(userRegion)) {
        return false
      }
      
      // Check auth requirements
      if (type.requiresAuth && !userPermissions.isAuthenticated) {
        return false
      }
      
      return true
    })
  }

  /**
   * Get transaction type recommendations based on user activity
   */
  async getRecommendedTransactionTypes(userId, userActivity = {}) {
    await this.simulateNetworkDelay(300, 700)
    
    const allTypes = await this._fetchTransactionTypesInternal()
    const userTypes = await this.getTransactionTypesForUser(userId, userActivity)
    
    // Simple recommendation logic (can be enhanced)
    const recommendations = userTypes
      .sort((a, b) => {
        // Prioritize by user activity and type priority
        const aScore = this._calculateRecommendationScore(a, userActivity)
        const bScore = this._calculateRecommendationScore(b, userActivity)
        return bScore - aScore
      })
      .slice(0, 4) // Top 4 recommendations
    
    return recommendations
  }

  /**
   * Calculate recommendation score for transaction type
   */
  _calculateRecommendationScore(transactionType, userActivity) {
    let score = 10 - transactionType.priority // Lower priority number = higher score
    
    // Boost score based on user activity
    const recentTransactions = userActivity.recentTransactions || []
    const typeCount = recentTransactions.filter(t => t.type === transactionType.id).length
    
    // Boost frequently used types
    score += typeCount * 2
    
    // Boost based on category preferences
    if (userActivity.preferredCategory === transactionType.category) {
      score += 5
    }
    
    return score
  }

  /**
   * Simulate realistic network delay
   */
  async simulateNetworkDelay(minMs = 150, maxMs = 600) {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check for service monitoring
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(50, 200)
      
      // Simulate occasional service issues (1% chance)
      if (Math.random() < 0.01) {
        throw new Error('Transaction type service health check failed')
      }
      
      this._recordSuccess()
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        latency: Math.random() * 200 + 50,
        version: this.version,
        transactionTypesCount: 8,
        categories: ['banking', 'investment', 'yield'],
        supportedRegions: ['US', 'EU', 'UK', 'CA', 'GLOBAL'],
        dataFreshness: 'real-time',
        circuitBreaker: {
          isOpen: this.isCircuitOpen,
          consecutiveFailures: this.healthStatus.consecutiveFailures
        }
      }
    } catch (error) {
      this._recordFailure()
      
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: Date.now(),
        fallbackAvailable: true
      }
    }
  }

  /**
   * Get fallback transaction types for when service is unavailable
   */
  _getFallbackTransactionTypes() {
    return [
      { 
        id: 'add', 
        label: 'Add', 
        iconType: 'plus',
        description: 'Add money to your diBoaS wallet',
        bgColor: 'bg-green-50', 
        color: 'text-green-700', 
        borderColor: 'border-green-200',
        category: 'banking',
        fallback: true
      },
      { 
        id: 'withdraw', 
        label: 'Withdraw', 
        iconType: 'credit_card',
        description: 'Withdraw funds to bank or external wallet',
        bgColor: 'bg-indigo-50', 
        color: 'text-indigo-700', 
        borderColor: 'border-indigo-200',
        category: 'banking',
        fallback: true
      }
    ]
  }

  /**
   * Record service success for health monitoring
   */
  _recordSuccess() {
    this.healthStatus.consecutiveFailures = 0
    this.healthStatus.isHealthy = true
    this.healthStatus.lastCheck = Date.now()
    this.isCircuitOpen = false
  }

  /**
   * Record service failure for health monitoring
   */
  _recordFailure() {
    this.healthStatus.consecutiveFailures++
    this.healthStatus.lastCheck = Date.now()
    
    if (this.healthStatus.consecutiveFailures >= this.circuitBreakerThreshold) {
      this.isCircuitOpen = true
      this.healthStatus.isHealthy = false
      this.lastErrorTime = Date.now()
      logger.warn(`${this.serviceName}: Circuit breaker opened after ${this.healthStatus.consecutiveFailures} failures`)
    }
  }
}

// Export singleton instance
export const mockupTransactionTypeProviderService = new MockupTransactionTypeProviderService()

// Export class for testing
export default MockupTransactionTypeProviderService