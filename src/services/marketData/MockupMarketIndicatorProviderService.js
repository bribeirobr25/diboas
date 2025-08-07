/**
 * Mockup Market Indicator Provider Service
 * Simulates real-time market data with dynamic price movements and indicators
 * NO CACHING - Always real-time data as per pattern requirements
 */

import logger from '../../utils/logger.js'
import { safeAsyncExecute } from '../../utils/safeDataHandling'

export class MockupMarketIndicatorProviderService {
  constructor() {
    this.serviceName = 'MockupMarketIndicatorProviderService'
    this.version = '1.0.0'
    
    // Health tracking
    this.healthStatus = {
      isHealthy: true,
      lastCheck: Date.now(),
      consecutiveFailures: 0,
      uptime: Date.now()
    }
    
    // Market data state for realistic price movements
    this.lastPrices = new Map()
    this.priceHistory = new Map()
    this.errorRate = 0.015 // 1.5% error rate
    
    // Initialize base prices
    this.initializeBasePrices()
  }

  /**
   * Initialize base prices for realistic market simulation
   */
  initializeBasePrices() {
    const basePrices = {
      'BTC': 43250,
      'ETH': 2680,
      'SOL': 98.5,
      'SUI': 1.85,
      'STOCK_MARKET': 4785,
      'GOLD': 2045,
      'DEFI_TVL': 45.8, // Billion
      'CRYPTO_MARKET_CAP': 1.68 // Trillion
    }

    Object.entries(basePrices).forEach(([symbol, price]) => {
      this.lastPrices.set(symbol, price)
      this.priceHistory.set(symbol, [price])
    })
  }

  /**
   * Get all market indicators with real-time data
   */
  async getMarketIndicators() {
    return await safeAsyncExecute(
      async () => this._fetchMarketIndicatorsInternal(),
      {
        timeout: 8000,
        retries: 3,
        retryDelay: 1000,
        exponentialBackoff: true,
        fallback: this._getFallbackMarketData(),
        throwOnFailure: false
      }
    )
  }

  /**
   * Internal method to fetch market indicators with realistic price simulation
   */
  async _fetchMarketIndicatorsInternal() {
    await this.simulateNetworkDelay(250, 600)
    
    // Simulate random failures
    if (Math.random() < this.errorRate) {
      this._recordFailure()
      throw new Error('Market indicator service temporarily unavailable')
    }

    const marketData = [
      {
        name: 'BTC',
        symbol: 'BTC',
        category: 'cryptocurrency',
        icon: '₿',
        priority: 1
      },
      {
        name: 'ETH',
        symbol: 'ETH',
        category: 'cryptocurrency',
        icon: '💎',
        priority: 2
      },
      {
        name: 'Stock Market',
        symbol: 'STOCK_MARKET',
        category: 'traditional',
        icon: '📈',
        priority: 3
      },
      {
        name: 'Gold',
        symbol: 'GOLD',
        category: 'commodity',
        icon: '🥇',
        priority: 4
      },
      {
        name: 'DeFi TVL',
        symbol: 'DEFI_TVL',
        category: 'defi',
        icon: '🏦',
        priority: 5
      },
      {
        name: 'Crypto Market',
        symbol: 'CRYPTO_MARKET_CAP',
        category: 'cryptocurrency',
        icon: '💎',
        priority: 6
      }
    ]

    // Generate realistic price data for each asset
    const enrichedData = marketData.map(asset => {
      const priceData = this._generateRealisticPriceData(asset.symbol)
      
      return {
        ...asset,
        value: priceData.formattedPrice,
        change: priceData.formattedChange,
        isPositive: priceData.isPositive,
        changePercent: priceData.changePercent,
        price: priceData.price,
        lastUpdated: Date.now(),
        source: this.serviceName
      }
    })

    this._recordSuccess()
    return enrichedData
  }

  /**
   * Generate realistic price data with proper movements
   */
  _generateRealisticPriceData(symbol) {
    const lastPrice = this.lastPrices.get(symbol)
    
    // Generate realistic price movement (smaller for stable assets)
    const volatility = this._getVolatilityForSymbol(symbol)
    const changePercent = (Math.random() - 0.5) * 2 * volatility
    const newPrice = lastPrice * (1 + changePercent / 100)
    
    // Update price history
    const history = this.priceHistory.get(symbol) || []
    history.push(newPrice)
    if (history.length > 100) history.shift() // Keep last 100 prices
    this.priceHistory.set(symbol, history)
    this.lastPrices.set(symbol, newPrice)
    
    // Calculate 24h change (simulate)
    const dayChangePercent = this._calculate24hChange(symbol, history)
    
    return {
      price: newPrice,
      formattedPrice: this._formatPrice(newPrice, symbol),
      changePercent: dayChangePercent,
      formattedChange: this._formatChange(dayChangePercent),
      isPositive: dayChangePercent >= 0
    }
  }

  /**
   * Get volatility percentage for different asset types
   */
  _getVolatilityForSymbol(symbol) {
    const volatilities = {
      'BTC': 4.0,
      'ETH': 5.0,
      'SOL': 6.0,
      'SUI': 8.0,
      'STOCK_MARKET': 1.2,
      'GOLD': 1.5,
      'DEFI_TVL': 3.0,
      'CRYPTO_MARKET_CAP': 3.5
    }
    
    return volatilities[symbol] || 2.0
  }

  /**
   * Calculate 24h change percentage
   */
  _calculate24hChange(symbol, priceHistory) {
    if (priceHistory.length < 2) return 0
    
    const currentPrice = priceHistory[priceHistory.length - 1]
    const previousPrice = priceHistory[Math.max(0, priceHistory.length - 24)] // Simulate 24 data points
    
    return ((currentPrice - previousPrice) / previousPrice) * 100
  }

  /**
   * Format price based on asset type
   */
  _formatPrice(price, symbol) {
    if (symbol === 'DEFI_TVL') {
      return `$${price.toFixed(1)}B`
    }
    if (symbol === 'CRYPTO_MARKET_CAP') {
      return `$${price.toFixed(2)}T`
    }
    if (symbol === 'STOCK_MARKET') {
      return price.toFixed(0)
    }
    if (price < 10) {
      return `$${price.toFixed(3)}`
    }
    if (price < 100) {
      return `$${price.toFixed(2)}`
    }
    if (price < 10000) {
      return `$${price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
    }
    
    return `$${price.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
  }

  /**
   * Format change percentage with appropriate styling
   */
  _formatChange(changePercent) {
    const sign = changePercent >= 0 ? '+' : ''
    return `${sign}${changePercent.toFixed(1)}%`
  }

  /**
   * Simulate network delay
   */
  async simulateNetworkDelay(minMs = 150, maxMs = 600) {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(50, 200)
      
      if (Math.random() < 0.005) {
        throw new Error('Market indicator service health check failed')
      }
      
      this._recordSuccess()
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        latency: Math.random() * 200 + 50,
        version: this.version,
        supportedIndicators: 6,
        categories: ['cryptocurrency', 'traditional', 'commodity', 'defi'],
        dataFreshness: 'real-time'
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
   * Fallback market data when service is unavailable
   */
  _getFallbackMarketData() {
    return [
      {
        name: 'BTC',
        value: '$43,250',
        change: '+2.4%',
        isPositive: true,
        icon: '₿',
        fallback: true
      },
      {
        name: 'ETH',
        value: '$2,680',
        change: '+1.8%',
        isPositive: true,
        icon: '💎',
        fallback: true
      },
      {
        name: 'Stock Market',
        value: '4,785',
        change: '-0.3%',
        isPositive: false,
        icon: '📈',
        fallback: true
      },
      {
        name: 'Gold',
        value: '$2,045',
        change: '+0.8%',
        isPositive: true,
        icon: '🥇',
        fallback: true
      },
      {
        name: 'DeFi TVL',
        value: '$45.8B',
        change: '+1.7%',
        isPositive: true,
        icon: '🏦',
        fallback: true
      },
      {
        name: 'Crypto Market',
        value: '$1.68T',
        change: '+2.8%',
        isPositive: true,
        icon: '💎',
        fallback: true
      }
    ]
  }

  /**
   * Record success for health monitoring
   */
  _recordSuccess() {
    this.healthStatus.consecutiveFailures = 0
    this.healthStatus.isHealthy = true
    this.healthStatus.lastCheck = Date.now()
  }

  /**
   * Record failure for health monitoring
   */
  _recordFailure() {
    this.healthStatus.consecutiveFailures++
    this.healthStatus.lastCheck = Date.now()
    
    if (this.healthStatus.consecutiveFailures >= 5) {
      this.healthStatus.isHealthy = false
      logger.warn(`${this.serviceName}: Service marked unhealthy after ${this.healthStatus.consecutiveFailures} failures`)
    }
  }
}

// Export singleton instance
export const mockupMarketIndicatorProviderService = new MockupMarketIndicatorProviderService()

// Export class for testing
export default MockupMarketIndicatorProviderService