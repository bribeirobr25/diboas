/**
 * CoinGecko Market Data Provider for diBoaS
 * Implements the standardized market data provider interface
 * Handles CoinGecko-specific API integration details
 */

import { credentialManager, CREDENTIAL_TYPES } from '../../../../utils/secureCredentialManager.js'
import secureLogger from '../../../../utils/secureLogger.js'

/**
 * CoinGecko Provider Configuration
 */
const COINGECKO_CONFIG = {
  baseUrl: 'https://api.coingecko.com/api/v3',
  timeout: 5000,
  retries: 2,
  rateLimit: 100, // requests per minute for free tier
  endpoints: {
    simplePrices: '/simple/price',
    coins: '/coins',
    global: '/global',
    ping: '/ping'
  }
}

/**
 * Asset ID mapping for CoinGecko
 */
const ASSET_ID_MAP = {
  'BTC': 'bitcoin',
  'ETH': 'ethereum', 
  'SOL': 'solana',
  'SUI': 'sui',
  'USDC': 'usd-coin'
}

/**
 * CoinGecko Market Data Provider
 * Implements the standard market data provider interface
 */
export class CoinGeckoProvider {
  constructor(config = {}) {
    this.config = {
      ...COINGECKO_CONFIG,
      ...config
    }
    this.requestCount = 0
    this.lastRequest = 0
  }

  /**
   * Health check for the provider
   */
  async healthCheck() {
    try {
      const response = await this.makeRequest('/ping')
      return {
        healthy: response.gecko_says === '(V3) To the Moon!',
        timestamp: new Date().toISOString(),
        latency: response._latency || 0
      }
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Get cryptocurrency market data
   */
  async getCryptoData(assets = [], options = {}) {
    try {
      // Map asset symbols to CoinGecko IDs
      const coinIds = assets.map(asset => {
        // Handle both symbol format (BTC) and ID format (bitcoin)
        return ASSET_ID_MAP[asset.toUpperCase()] || asset.toLowerCase()
      })
      
      if (coinIds.length === 0) {
        return []
      }
      
      const params = new URLSearchParams({
        ids: coinIds.join(','),
        vs_currencies: 'usd',
        include_24hr_change: 'true',
        include_market_cap: 'true',
        include_24hr_vol: 'true'
      })
      
      const response = await this.makeRequest(`/simple/price?${params.toString()}`)
      
      // Transform CoinGecko response to standard format
      return this.transformCryptoData(response, assets)
      
    } catch (error) {
      secureLogger.audit('COINGECKO_CRYPTO_DATA_ERROR', {
        assetsRequested: assets.length,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Get stock market data (CoinGecko doesn't provide stocks)
   */
  async getStockData(symbols = [], options = {}) {
    // CoinGecko doesn't provide stock data
    // Return empty array to indicate this provider doesn't support stocks
    secureLogger.audit('COINGECKO_STOCK_DATA_NOT_SUPPORTED', {
      symbolsRequested: symbols.length
    })
    
    return []
  }

  /**
   * Get commodities data (CoinGecko doesn't provide traditional commodities)
   */
  async getCommoditiesData(commodities = [], options = {}) {
    // CoinGecko doesn't provide traditional commodities
    // Could potentially support gold/silver tokens, but for now return empty
    secureLogger.audit('COINGECKO_COMMODITIES_DATA_NOT_SUPPORTED', {
      commoditiesRequested: commodities.length
    })
    
    return []
  }

  /**
   * Get specific asset price
   */
  async getAssetPrice(asset, currency = 'USD', options = {}) {
    try {
      const coinId = ASSET_ID_MAP[asset.toUpperCase()] || asset.toLowerCase()
      
      const params = new URLSearchParams({
        ids: coinId,
        vs_currencies: currency.toLowerCase()
      })
      
      const response = await this.makeRequest(`/simple/price?${params.toString()}`)
      
      const price = response[coinId]?.[currency.toLowerCase()]
      return price || null
      
    } catch (error) {
      secureLogger.audit('COINGECKO_ASSET_PRICE_ERROR', {
        asset,
        currency,
        error: error.message
      })
      return null
    }
  }

  /**
   * Make secure HTTP request to CoinGecko API
   */
  async makeRequest(endpoint, options = {}) {
    // Rate limiting check
    this.enforceRateLimit()
    
    const url = `${this.config.baseUrl}${endpoint}`
    const startTime = Date.now()
    
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), this.config.timeout)
    
    try {
      const headers = {
        'User-Agent': 'diBoaS/1.0.0',
        'Accept': 'application/json',
        ...options.headers
      }
      
      // Add API key if available (for pro accounts)
      const apiKey = await this.getApiKey()
      if (apiKey) {
        headers['X-CG-Pro-API-Key'] = apiKey
      }
      
      const response = await fetch(url, {
        method: options.method || 'GET',
        headers,
        signal: controller.signal,
        body: options.body
      })
      
      clearTimeout(timeoutId)
      
      if (!response.ok) {
        throw new Error(`CoinGecko API error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      const latency = Date.now() - startTime
      
      // Add latency info for monitoring
      data._latency = latency
      
      secureLogger.audit('COINGECKO_REQUEST_SUCCESS', {
        endpoint: this.sanitizeEndpoint(endpoint),
        latency,
        status: response.status
      })
      
      return data
      
    } catch (error) {
      clearTimeout(timeoutId)
      
      secureLogger.audit('COINGECKO_REQUEST_FAILED', {
        endpoint: this.sanitizeEndpoint(endpoint),
        error: error.message,
        latency: Date.now() - startTime
      })
      
      throw error
    }
  }

  /**
   * Transform CoinGecko crypto data to standard format
   */
  transformCryptoData(response, requestedAssets) {
    return requestedAssets.map(asset => {
      const coinId = ASSET_ID_MAP[asset.toUpperCase()] || asset.toLowerCase()
      const data = response[coinId]
      
      if (!data) {
        return null // Asset not found
      }
      
      return {
        symbol: asset.toUpperCase(),
        name: this.getAssetName(asset),
        price: data.usd || 0,
        change24h: data.usd_24h_change || 0,
        marketCap: data.usd_market_cap || 0,
        volume24h: data.usd_24h_vol || 0,
        lastUpdate: new Date().toISOString(),
        source: 'coingecko',
        provider: 'CoinGecko'
      }
    }).filter(Boolean) // Remove null entries
  }

  /**
   * Get asset display name
   */
  getAssetName(asset) {
    const nameMap = {
      'BTC': 'Bitcoin',
      'ETH': 'Ethereum',
      'SOL': 'Solana',
      'SUI': 'Sui',
      'USDC': 'USD Coin'
    }
    
    return nameMap[asset.toUpperCase()] || asset.charAt(0).toUpperCase() + asset.slice(1)
  }

  /**
   * Enforce rate limiting
   */
  enforceRateLimit() {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequest
    const minInterval = 60000 / this.config.rateLimit // Convert rate to interval
    
    if (timeSinceLastRequest < minInterval) {
      const waitTime = minInterval - timeSinceLastRequest
      throw new Error(`Rate limit: must wait ${waitTime}ms before next request`)
    }
    
    this.lastRequest = now
    this.requestCount++
  }

  /**
   * Get API key from secure credential manager
   */
  async getApiKey() {
    try {
      const apiKey = await credentialManager.getCredential(
        CREDENTIAL_TYPES.API_KEY,
        process.env.NODE_ENV || 'development'
      )
      
      // Only return if it looks like a CoinGecko key
      if (apiKey && (apiKey.startsWith('CG-') || apiKey.length === 64)) {
        return apiKey
      }
      
      return null
    } catch (error) {
      // API key is optional for CoinGecko free tier
      return null
    }
  }

  /**
   * Sanitize endpoint for logging (remove sensitive params)
   */
  sanitizeEndpoint(endpoint) {
    return endpoint.replace(/[?&]key=[^&]+/g, '?key=***')
  }

  /**
   * Get provider configuration and stats
   */
  getProviderInfo() {
    return {
      name: 'CoinGecko',
      type: 'cryptocurrency',
      supportedFeatures: ['crypto-data', 'asset-prices'],
      baseUrl: this.config.baseUrl,
      rateLimit: this.config.rateLimit,
      requestCount: this.requestCount,
      lastRequest: this.lastRequest,
      supportsStocks: false,
      supportsCommodities: false
    }
  }

  /**
   * Test connection to CoinGecko API
   */
  async testConnection() {
    try {
      const result = await this.healthCheck()
      return {
        success: result.healthy,
        latency: result.latency,
        timestamp: result.timestamp,
        error: result.error || null
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }
}

export default CoinGeckoProvider