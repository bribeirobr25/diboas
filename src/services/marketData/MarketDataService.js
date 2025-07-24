/**
 * Real-Time Market Data Service for diBoaS
 * Business logic layer that coordinates market data operations
 * Abstracts integration complexity from business components
 */

import secureLogger from '../../utils/secureLogger.js'
import { dataManager } from '../DataManager.js'
import { marketDataRegistry } from '../integrations/marketData/MarketDataProviderRegistry.js'
import { CoinGeckoProvider } from '../integrations/marketData/providers/CoinGeckoProvider.js'

/**
 * Business Configuration for Market Data
 * Contains business-specific settings, not provider-specific details
 */
const MARKET_DATA_CONFIG = {
  // Assets we track for the diBoaS platform
  trackedAssets: {
    crypto: ['BTC', 'ETH', 'SOL', 'SUI', 'USDC'],
    stocks: ['SPY', 'QQQ', 'AAPL', 'GOOGL'], 
    commodities: ['GOLD', 'SILVER']
  },
  
  // Business timing requirements - optimized for better UX and fewer API failures
  refreshInterval: 120000, // 2 minutes - reduced frequency to prevent API rate limits
  maxStaleTime: 600000, // 10 minutes - maximum acceptable data age
  
  // Market hours (simplified for demo)
  marketHours: {
    crypto: { alwaysOpen: true },
    stocks: { open: 9, close: 16, timezone: 'America/New_York' },
    commodities: { open: 6, close: 17, timezone: 'America/New_York' }
  }
}

/**
 * Market Data Service Class
 * Handles business logic for market data operations
 * Coordinates with abstracted provider registry
 */
export class MarketDataService {
  constructor() {
    this.isActive = false
    this.updateInterval = null
    this.marketData = {
      crypto: [],
      stocks: [],
      commodities: []
    }
    this.lastSuccessfulUpdate = new Map()
    
    // Initialize provider registry
    this.initializeProviders()
  }

  /**
   * Initialize market data providers through abstraction layer
   */
  async initializeProviders() {
    try {
      // Register CoinGecko provider for crypto data
      const coinGeckoProvider = new CoinGeckoProvider()
      await marketDataRegistry.registerProvider('coingecko', coinGeckoProvider, {
        priority: 10,
        weight: 10,
        features: ['crypto-data', 'asset-prices'],
        environments: ['development', 'staging', 'production'],
        enabled: true
      })
      
      // Future providers can be registered here without changing business logic
      // await marketDataRegistry.registerProvider('coinmarketcap', coinMarketCapProvider, {...})
      // await marketDataRegistry.registerProvider('alphavantage', alphaVantageProvider, {...})
      
      secureLogger.audit('MARKET_DATA_PROVIDERS_INITIALIZED', {
        registeredProviders: marketDataRegistry.getHealthStatus().totalProviders,
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      secureLogger.audit('MARKET_DATA_PROVIDER_INIT_FAILED', {
        error: error.message
      })
    }
  }

  /**
   * Start real-time market data updates
   */
  async start() {
    if (this.isActive) return

    try {
      secureLogger.audit('MARKET_DATA_SERVICE_STARTED', {
        timestamp: new Date().toISOString()
      })

      // Ensure providers are initialized
      await this.initializeProviders()

      this.isActive = true
      
      // Initial data fetch
      await this.updateAllMarketData()
      
      // Set up periodic updates based on business requirements
      this.updateInterval = setInterval(async () => {
        try {
          await this.updateAllMarketData()
        } catch (error) {
          // Log but don't throw to prevent interval from stopping
          secureLogger.audit('MARKET_DATA_PERIODIC_UPDATE_FAILED', {
            error: error.message,
            timestamp: new Date().toISOString()
          })
        }
      }, MARKET_DATA_CONFIG.refreshInterval)

    } catch (error) {
      secureLogger.audit('MARKET_DATA_SERVICE_START_FAILED', {
        error: error.message
      })
      throw error
    }
  }

  /**
   * Stop market data updates
   */
  stop() {
    if (!this.isActive) return

    secureLogger.audit('MARKET_DATA_SERVICE_STOPPED', {
      timestamp: new Date().toISOString()
    })

    this.isActive = false
    
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }
  }

  /**
   * Update all market data through abstraction layer
   * Contains only business logic, no provider-specific code
   */
  async updateAllMarketData() {
    if (!this.isActive) return

    try {
      // Update crypto data using abstracted registry
      await this.updateCryptoData()
      
      // Update stock data based on market hours and business rules
      if (this.shouldUpdateStocks()) {
        await this.updateStockData()
      }
      
      // Update commodities data
      if (this.shouldUpdateCommodities()) {
        await this.updateCommoditiesData()
      }
      
      secureLogger.audit('MARKET_DATA_UPDATE_COMPLETED', {
        timestamp: new Date().toISOString(),
        cryptoAssets: this.marketData.crypto.length,
        stockSymbols: this.marketData.stocks.length,
        commodities: this.marketData.commodities.length
      })
      
    } catch (error) {
      secureLogger.audit('MARKET_DATA_UPDATE_FAILED', {
        error: error.message
      })
      // Don't throw - let individual update methods handle their own fallbacks
    }
  }

  /**
   * Update cryptocurrency market data
   * Uses abstracted provider registry - no direct API calls
   */
  async updateCryptoData() {
    try {
      // Get crypto data through abstracted registry
      const cryptoData = await marketDataRegistry.getCryptoData(
        MARKET_DATA_CONFIG.trackedAssets.crypto,
        {
          maxAge: MARKET_DATA_CONFIG.maxStaleTime,
          forceRefresh: false
        }
      )
      
      // Store in business layer
      this.marketData.crypto = cryptoData
      this.lastSuccessfulUpdate.set('crypto', new Date().toISOString())
      
      // Emit business event (components don't know about providers)
      dataManager.emit('market:crypto:updated', cryptoData)
      
      secureLogger.audit('MARKET_DATA_CRYPTO_UPDATED', {
        assetsCount: cryptoData.length,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      secureLogger.audit('MARKET_DATA_CRYPTO_UPDATE_FAILED', {
        error: error.message
      })
      
      // Business logic handles fallback - still emit event with existing data
      if (this.marketData.crypto.length > 0) {
        dataManager.emit('market:crypto:updated', this.marketData.crypto)
      }
    }
  }

  /**
   * Update stock market data through abstraction layer
   */
  async updateStockData() {
    try {
      // Get stock data through abstracted registry
      const stockData = await marketDataRegistry.getStockData(
        MARKET_DATA_CONFIG.trackedAssets.stocks,
        {
          maxAge: MARKET_DATA_CONFIG.maxStaleTime,
          forceRefresh: false
        }
      )
      
      // Store in business layer
      this.marketData.stocks = stockData
      this.lastSuccessfulUpdate.set('stocks', new Date().toISOString())
      
      // Emit business event
      dataManager.emit('market:stocks:updated', stockData)
      
      secureLogger.audit('MARKET_DATA_STOCKS_UPDATED', {
        assetsCount: stockData.length,
        timestamp: new Date().toISOString()
      })

    } catch (error) {
      secureLogger.audit('MARKET_DATA_STOCKS_UPDATE_FAILED', {
        error: error.message
      })
      
      // Fallback to existing data
      if (this.marketData.stocks.length > 0) {
        dataManager.emit('market:stocks:updated', this.marketData.stocks)
      }
    }
  }

  /**
   * Update commodities data through abstraction layer
   */
  async updateCommoditiesData() {
    try {
      // Get commodities data through abstracted registry
      const commoditiesData = await marketDataRegistry.getCommoditiesData(
        MARKET_DATA_CONFIG.trackedAssets.commodities,
        {
          maxAge: MARKET_DATA_CONFIG.maxStaleTime,
          forceRefresh: false
        }
      )
      
      // Store in business layer
      this.marketData.commodities = commoditiesData
      this.lastSuccessfulUpdate.set('commodities', new Date().toISOString())
      
      // Emit business event
      dataManager.emit('market:commodities:updated', commoditiesData)

    } catch (error) {
      secureLogger.audit('MARKET_DATA_COMMODITIES_UPDATE_FAILED', {
        error: error.message
      })
      
      // Fallback to existing data
      if (this.marketData.commodities.length > 0) {
        dataManager.emit('market:commodities:updated', this.marketData.commodities)
      }
    }
  }

  /**
   * Business logic: Check if stocks should be updated
   * Based on market hours and business requirements
   */
  shouldUpdateStocks() {
    const lastUpdate = this.lastSuccessfulUpdate.get('stocks')
    if (!lastUpdate) return true
    
    // Business rule: Update stocks every 5 minutes during market hours
    const timeSinceUpdate = Date.now() - new Date(lastUpdate).getTime()
    const updateInterval = 5 * 60 * 1000 // 5 minutes
    
    // For demo: always update
    return timeSinceUpdate > updateInterval
  }

  /**
   * Business logic: Check if commodities should be updated
   */
  shouldUpdateCommodities() {
    const lastUpdate = this.lastSuccessfulUpdate.get('commodities')
    if (!lastUpdate) return true
    
    // Business rule: Update commodities every 10 minutes
    const timeSinceUpdate = Date.now() - new Date(lastUpdate).getTime()
    const updateInterval = 10 * 60 * 1000 // 10 minutes
    
    return timeSinceUpdate > updateInterval
  }

  /**
   * Get current market data for business operations
   * Returns data in business-friendly format
   */
  getCurrentMarketData() {
    return {
      crypto: this.marketData.crypto,
      stocks: this.marketData.stocks,
      commodities: this.marketData.commodities,
      lastUpdate: {
        crypto: this.lastSuccessfulUpdate.get('crypto'),
        stocks: this.lastSuccessfulUpdate.get('stocks'),
        commodities: this.lastSuccessfulUpdate.get('commodities')
      }
    }
  }

  /**
   * Get specific asset price for business operations
   */
  async getAssetPrice(symbol, currency = 'USD') {
    try {
      return await marketDataRegistry.getAssetPrice(symbol, currency)
    } catch (error) {
      secureLogger.audit('ASSET_PRICE_REQUEST_FAILED', {
        symbol,
        currency,
        error: error.message
      })
      return null
    }
  }

  /**
   * Force refresh of specific market data type
   */
  async forceRefresh(dataType = 'all') {
    try {
      switch (dataType) {
        case 'crypto':
          await this.updateCryptoData()
          break
        case 'stocks':
          await this.updateStockData()
          break
        case 'commodities':
          await this.updateCommoditiesData()
          break
        case 'all':
          await this.updateAllMarketData()
          break
        default:
          throw new Error(`Unknown data type: ${dataType}`)
      }
    } catch (error) {
      secureLogger.audit('MARKET_DATA_FORCE_REFRESH_FAILED', {
        dataType,
        error: error.message
      })
    }
  }

  /**
   * Get business-focused service health status
   */
  getHealthStatus() {
    const registryHealth = marketDataRegistry.getHealthStatus()
    
    return {
      isActive: this.isActive,
      dataFreshness: {
        crypto: this.lastSuccessfulUpdate.get('crypto'),
        stocks: this.lastSuccessfulUpdate.get('stocks'),
        commodities: this.lastSuccessfulUpdate.get('commodities')
      },
      dataAvailability: {
        crypto: this.marketData.crypto.length > 0,
        stocks: this.marketData.stocks.length > 0,
        commodities: this.marketData.commodities.length > 0
      },
      integrationHealth: {
        overallHealth: registryHealth.overallHealth,
        healthyProviders: registryHealth.healthyProviders,
        totalProviders: registryHealth.totalProviders
      },
      businessMetrics: {
        trackedCryptoAssets: MARKET_DATA_CONFIG.trackedAssets.crypto.length,
        trackedStocks: MARKET_DATA_CONFIG.trackedAssets.stocks.length,
        trackedCommodities: MARKET_DATA_CONFIG.trackedAssets.commodities.length,
        updateInterval: MARKET_DATA_CONFIG.refreshInterval
      }
    }
  }

  /**
   * Get integration statistics (abstracted from specific providers)
   */
  getIntegrationStats() {
    return marketDataRegistry.getCacheStats()
  }

  /**
   * Clear all data caches (business operation)
   */
  clearAllCaches() {
    marketDataRegistry.clearCache()
    
    secureLogger.audit('MARKET_DATA_CACHES_CLEARED', {
      timestamp: new Date().toISOString()
    })
  }
}

// Create global market data service instance
export const marketDataService = new MarketDataService()

export default marketDataService