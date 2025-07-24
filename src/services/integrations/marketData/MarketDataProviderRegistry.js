/**
 * Market Data Provider Registry for diBoaS
 * Abstracts market data providers from core business logic
 * Ensures easy provider swapping without changing business rules
 */

import { BaseProviderRegistry, PROVIDER_STATUS } from '../BaseProviderRegistry.js'
import secureLogger from '../../../utils/secureLogger.js'

/**
 * Market Data Provider Registry Class
 * Manages all market data providers with failover and optimization
 */
export class MarketDataProviderRegistry extends BaseProviderRegistry {
  constructor() {
    super('market-data', {
      healthCheckInterval: 60000, // 1 minute
      maxRetries: 3,
      retryDelay: 2000,
      healthThreshold: 0.85
    })
    
    this.dataCache = new Map()
    this.cacheTimeout = 60000 // 1 minute cache
  }

  /**
   * Validate market data provider interface
   */
  validateProviderInterface(provider) {
    super.validateProviderInterface(provider)
    
    const requiredMethods = ['getCryptoData', 'getStockData', 'getCommoditiesData']
    const optionalMethods = ['getAllMarketData', 'getAssetPrice', 'healthCheck']
    
    requiredMethods.forEach(method => {
      if (typeof provider[method] !== 'function') {
        throw new Error(`Market data provider must implement ${method} method`)
      }
    })
    
    secureLogger.audit('MARKET_DATA_PROVIDER_VALIDATED', {
      requiredMethods: requiredMethods.length,
      optionalMethods: optionalMethods.filter(method => typeof provider[method] === 'function').length
    })
  }

  /**
   * Get cryptocurrency market data
   */
  async getCryptoData(assets = [], options = {}) {
    const { forceRefresh = false, maxAge = this.cacheTimeout } = options
    
    // Check cache first
    const cacheKey = `crypto:${assets.join(',')}`
    if (!forceRefresh && this.isCacheValid(cacheKey, maxAge)) {
      return this.dataCache.get(cacheKey).data
    }
    
    const operation = async (provider, providerId) => {
      secureLogger.audit('MARKET_DATA_CRYPTO_REQUEST', {
        providerId,
        assetsCount: assets.length,
        forceRefresh
      })
      
      const data = await provider.getCryptoData(assets, options)
      
      // Validate data structure
      this.validateCryptoData(data)
      
      // Cache the result
      this.dataCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        provider: providerId
      })
      
      return data
    }
    
    try {
      const result = await this.executeWithFailover(operation, {
        feature: 'crypto-data',
        maxAttempts: 3,
        ...options
      })
      
      return result.result
    } catch (error) {
      // Return cached data if available, even if expired
      const cached = this.dataCache.get(cacheKey)
      if (cached) {
        secureLogger.audit('MARKET_DATA_FALLBACK_TO_CACHE', {
          cacheAge: Date.now() - cached.timestamp,
          dataType: 'crypto'
        })
        return cached.data
      }
      
      // Final fallback to mock data
      return this.generateMockCryptoData(assets)
    }
  }

  /**
   * Get stock market data
   */
  async getStockData(symbols = [], options = {}) {
    const { forceRefresh = false, maxAge = this.cacheTimeout } = options
    
    // Check cache first
    const cacheKey = `stocks:${symbols.join(',')}`
    if (!forceRefresh && this.isCacheValid(cacheKey, maxAge)) {
      return this.dataCache.get(cacheKey).data
    }
    
    const operation = async (provider, providerId) => {
      secureLogger.audit('MARKET_DATA_STOCKS_REQUEST', {
        providerId,
        symbolsCount: symbols.length,
        forceRefresh
      })
      
      const data = await provider.getStockData(symbols, options)
      
      // Validate data structure
      this.validateStockData(data)
      
      // Cache the result
      this.dataCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        provider: providerId
      })
      
      return data
    }
    
    try {
      const result = await this.executeWithFailover(operation, {
        feature: 'stock-data',
        maxAttempts: 2,
        ...options
      })
      
      return result.result
    } catch (error) {
      // Return cached data if available
      const cached = this.dataCache.get(cacheKey)
      if (cached) {
        return cached.data
      }
      
      // Final fallback to mock data
      return this.generateMockStockData(symbols)
    }
  }

  /**
   * Get commodities market data
   */
  async getCommoditiesData(commodities = [], options = {}) {
    const { forceRefresh = false, maxAge = this.cacheTimeout } = options
    
    // Check cache first
    const cacheKey = `commodities:${commodities.join(',')}`
    if (!forceRefresh && this.isCacheValid(cacheKey, maxAge)) {
      return this.dataCache.get(cacheKey).data
    }
    
    const operation = async (provider, providerId) => {
      secureLogger.audit('MARKET_DATA_COMMODITIES_REQUEST', {
        providerId,
        commoditiesCount: commodities.length,
        forceRefresh
      })
      
      const data = await provider.getCommoditiesData(commodities, options)
      
      // Validate data structure
      this.validateCommoditiesData(data)
      
      // Cache the result
      this.dataCache.set(cacheKey, {
        data,
        timestamp: Date.now(),
        provider: providerId
      })
      
      return data
    }
    
    try {
      const result = await this.executeWithFailover(operation, {
        feature: 'commodities-data',
        maxAttempts: 2,
        ...options
      })
      
      return result.result
    } catch (error) {
      // Return cached data if available
      const cached = this.dataCache.get(cacheKey)
      if (cached) {
        return cached.data
      }
      
      // Final fallback to mock data
      return this.generateMockCommoditiesData(commodities)
    }
  }

  /**
   * Get all market data in one request
   */
  async getAllMarketData(config = {}) {
    const {
      crypto = ['bitcoin', 'ethereum', 'solana', 'sui', 'usd-coin'],
      stocks = ['SPY', 'QQQ', 'AAPL', 'GOOGL'],
      commodities = ['GOLD', 'SILVER'],
      ...options
    } = config
    
    try {
      // Try to get all data from a single provider if supported
      const operation = async (provider, providerId) => {
        if (typeof provider.getAllMarketData === 'function') {
          secureLogger.audit('MARKET_DATA_ALL_REQUEST_SINGLE', {
            providerId,
            crypto: crypto.length,
            stocks: stocks.length,
            commodities: commodities.length
          })
          
          return await provider.getAllMarketData(config)
        } else {
          // Fallback to multiple requests
          secureLogger.audit('MARKET_DATA_ALL_REQUEST_MULTIPLE', {
            providerId,
            requestsNeeded: 3
          })
          
          const [cryptoData, stockData, commoditiesData] = await Promise.allSettled([
            provider.getCryptoData(crypto, options),
            provider.getStockData(stocks, options),
            provider.getCommoditiesData(commodities, options)
          ])
          
          return {
            crypto: cryptoData.status === 'fulfilled' ? cryptoData.value : [],
            stocks: stockData.status === 'fulfilled' ? stockData.value : [],
            commodities: commoditiesData.status === 'fulfilled' ? commoditiesData.value : []
          }
        }
      }
      
      const result = await this.executeWithFailover(operation, options)
      return result.result
      
    } catch (error) {
      // Fallback to individual requests from different providers
      const [cryptoData, stockData, commoditiesData] = await Promise.allSettled([
        this.getCryptoData(crypto, options),
        this.getStockData(stocks, options),
        this.getCommoditiesData(commodities, options)
      ])
      
      return {
        crypto: cryptoData.status === 'fulfilled' ? cryptoData.value : [],
        stocks: stockData.status === 'fulfilled' ? stockData.value : [],
        commodities: commoditiesData.status === 'fulfilled' ? commoditiesData.value : []
      }
    }
  }

  /**
   * Get specific asset price
   */
  async getAssetPrice(asset, currency = 'USD', options = {}) {
    const operation = async (provider, providerId) => {
      if (typeof provider.getAssetPrice === 'function') {
        return await provider.getAssetPrice(asset, currency, options)
      } else {
        // Fallback to general data request
        const data = await provider.getCryptoData([asset], options)
        return data.find(item => item.symbol === asset)?.price || null
      }
    }
    
    try {
      const result = await this.executeWithFailover(operation, options)
      return result.result
    } catch (error) {
      return null
    }
  }

  /**
   * Check if cache is valid
   */
  isCacheValid(cacheKey, maxAge) {
    const cached = this.dataCache.get(cacheKey)
    return cached && (Date.now() - cached.timestamp) < maxAge
  }

  /**
   * Clear cache for specific data type
   */
  clearCache(dataType = null) {
    if (dataType) {
      for (const key of this.dataCache.keys()) {
        if (key.startsWith(dataType + ':')) {
          this.dataCache.delete(key)
        }
      }
    } else {
      this.dataCache.clear()
    }
    
    secureLogger.audit('MARKET_DATA_CACHE_CLEARED', {
      dataType: dataType || 'all'
    })
  }

  /**
   * Validate cryptocurrency data structure
   */
  validateCryptoData(data) {
    if (!Array.isArray(data)) {
      throw new Error('Crypto data must be an array')
    }
    
    data.forEach(item => {
      if (!item.symbol || typeof item.price !== 'number' || item.price < 0) {
        throw new Error('Invalid crypto data structure')
      }
      
      // Prevent price manipulation attacks
      if (item.price > 1000000) {
        secureLogger.audit('SUSPICIOUS_CRYPTO_PRICE', {
          symbol: item.symbol,
          price: item.price
        })
        throw new Error('Suspicious crypto price detected')
      }
    })
  }

  /**
   * Validate stock data structure
   */
  validateStockData(data) {
    if (!Array.isArray(data)) {
      throw new Error('Stock data must be an array')
    }
    
    data.forEach(item => {
      if (!item.symbol || typeof item.price !== 'number' || item.price < 0) {
        throw new Error('Invalid stock data structure')
      }
      
      // Reasonable stock price validation
      if (item.price > 100000) {
        secureLogger.audit('SUSPICIOUS_STOCK_PRICE', {
          symbol: item.symbol,
          price: item.price
        })
        throw new Error('Suspicious stock price detected')
      }
    })
  }

  /**
   * Validate commodities data structure
   */
  validateCommoditiesData(data) {
    if (!Array.isArray(data)) {
      throw new Error('Commodities data must be an array')
    }
    
    data.forEach(item => {
      if (!item.symbol || typeof item.price !== 'number' || item.price < 0) {
        throw new Error('Invalid commodities data structure')
      }
    })
  }

  /**
   * Generate mock cryptocurrency data for fallback
   */
  generateMockCryptoData(assets) {
    const mockPrices = {
      'bitcoin': { price: 43250, change: 2.4, marketCap: 845000000000 },
      'ethereum': { price: 2680, change: 1.8, marketCap: 322000000000 },
      'solana': { price: 105.30, change: 3.2, marketCap: 47000000000 },
      'sui': { price: 1.85, change: -0.5, marketCap: 5200000000 },
      'usd-coin': { price: 1.00, change: 0.0, marketCap: 24000000000 }
    }
    
    return assets.map(asset => {
      const mock = mockPrices[asset] || { price: 100, change: 0, marketCap: 1000000000 }
      return {
        symbol: asset.toUpperCase(),
        name: asset.charAt(0).toUpperCase() + asset.slice(1),
        price: this.addRandomVariation(mock.price, 0.02),
        change24h: this.addRandomVariation(mock.change, 0.5),
        marketCap: mock.marketCap,
        volume24h: mock.marketCap * 0.1,
        lastUpdate: new Date().toISOString(),
        source: 'mock'
      }
    })
  }

  /**
   * Generate mock stock data for fallback
   */
  generateMockStockData(symbols) {
    const mockPrices = {
      'SPY': { price: 478.52, change: -0.3 },
      'QQQ': { price: 412.80, change: 0.8 },
      'AAPL': { price: 185.92, change: 1.2 },
      'GOOGL': { price: 142.56, change: -0.1 }
    }
    
    return symbols.map(symbol => {
      const mock = mockPrices[symbol] || { price: 150, change: 0 }
      return {
        symbol,
        name: `${symbol} Stock`,
        price: this.addRandomVariation(mock.price, 0.01),
        change24h: this.addRandomVariation(mock.change, 0.3),
        lastUpdate: new Date().toISOString(),
        source: 'mock'
      }
    })
  }

  /**
   * Generate mock commodities data for fallback
   */
  generateMockCommoditiesData(commodities) {
    const mockPrices = {
      'GOLD': { price: 2045.30, change: 1.2 },
      'SILVER': { price: 24.85, change: 0.8 }
    }
    
    return commodities.map(commodity => {
      const mock = mockPrices[commodity] || { price: 50, change: 0 }
      return {
        symbol: commodity,
        name: commodity.charAt(0) + commodity.slice(1).toLowerCase(),
        price: this.addRandomVariation(mock.price, 0.005),
        change24h: this.addRandomVariation(mock.change, 0.2),
        lastUpdate: new Date().toISOString(),
        source: 'mock'
      }
    })
  }

  /**
   * Add random variation to base values for realistic mock data
   */
  addRandomVariation(baseValue, variationPercent) {
    const variation = (Math.random() - 0.5) * 2 * variationPercent
    return baseValue * (1 + variation)
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    const cacheEntries = Array.from(this.dataCache.entries())
    const now = Date.now()
    
    const stats = {
      totalEntries: cacheEntries.length,
      validEntries: 0,
      expiredEntries: 0,
      cacheTypes: {},
      oldestEntry: null,
      newestEntry: null
    }
    
    cacheEntries.forEach(([key, value]) => {
      const isValid = (now - value.timestamp) < this.cacheTimeout
      
      if (isValid) {
        stats.validEntries++
      } else {
        stats.expiredEntries++
      }
      
      const type = key.split(':')[0]
      stats.cacheTypes[type] = (stats.cacheTypes[type] || 0) + 1
      
      if (!stats.oldestEntry || value.timestamp < stats.oldestEntry) {
        stats.oldestEntry = value.timestamp
      }
      
      if (!stats.newestEntry || value.timestamp > stats.newestEntry) {
        stats.newestEntry = value.timestamp
      }
    })
    
    return stats
  }
}

// Create and export singleton instance
export const marketDataRegistry = new MarketDataProviderRegistry()

export default marketDataRegistry