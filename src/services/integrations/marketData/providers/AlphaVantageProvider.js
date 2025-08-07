/**
 * Alpha Vantage Market Data Provider
 * Provides stock market data, forex, and cryptocurrency data from Alpha Vantage API
 */

import secureLogger from '../../../../utils/secureLogger.js'

export class AlphaVantageProvider {
  constructor(config = {}) {
    this.apiKey = config.apiKey
    this.baseUrl = config.baseUrl || 'https://www.alphavantage.co/query'
    this.timeout = config.timeout || 10000
    this.rateLimitDelay = config.rateLimitDelay || 12000 // Alpha Vantage has 5 calls/minute limit
    this.lastRequestTime = 0
    
    if (!this.apiKey) {
      throw new Error('Alpha Vantage API key is required')
    }
  }

  /**
   * Health check for Alpha Vantage API
   */
  async healthCheck() {
    try {
      // Simple test query to check API availability
      const response = await this.makeRequest({
        function: 'GLOBAL_QUOTE',
        symbol: 'AAPL'
      })
      
      return {
        healthy: !response['Error Message'] && !response['Information'],
        responseTime: Date.now() - this.lastRequestTime,
        provider: 'alphavantage'
      }
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        provider: 'alphavantage'
      }
    }
  }

  /**
   * Get cryptocurrency market data
   */
  async getCryptoData(assets = [], options = {}) {
    const results = []
    
    for (const asset of assets) {
      try {
        await this.enforceRateLimit()
        
        const data = await this.makeRequest({
          function: 'CURRENCY_EXCHANGE_RATE',
          from_currency: asset.toUpperCase(),
          to_currency: options.currency || 'USD'
        })
        
        if (data['Realtime Currency Exchange Rate']) {
          const rate = data['Realtime Currency Exchange Rate']
          results.push({
            symbol: asset.toUpperCase(),
            name: asset,
            price: parseFloat(rate['5. Exchange Rate']),
            change24h: 0, // Alpha Vantage doesn't provide 24h change in this endpoint
            changeAmount: 0,
            trend: 'neutral',
            lastUpdate: rate['6. Last Refreshed'],
            source: 'alphavantage'
          })
        }
      } catch (error) {
        secureLogger.audit('ALPHAVANTAGE_CRYPTO_ERROR', {
          asset,
          error: error.message
        })
        
        // Continue with other assets even if one fails
        results.push({
          symbol: asset.toUpperCase(),
          name: asset,
          price: null,
          error: error.message,
          source: 'alphavantage'
        })
      }
    }
    
    return results
  }

  /**
   * Get stock market data
   */
  async getStockData(symbols = [], options = {}) {
    const results = []
    
    for (const symbol of symbols) {
      try {
        await this.enforceRateLimit()
        
        const data = await this.makeRequest({
          function: 'GLOBAL_QUOTE',
          symbol: symbol.toUpperCase()
        })
        
        if (data['Global Quote']) {
          const quote = data['Global Quote']
          const price = parseFloat(quote['05. price'])
          const change = parseFloat(quote['09. change'])
          const changePercent = parseFloat(quote['10. change percent'].replace('%', ''))
          
          results.push({
            symbol: symbol.toUpperCase(),
            name: quote['01. symbol'],
            price: price,
            change24h: changePercent,
            changeAmount: change,
            trend: change >= 0 ? 'up' : 'down',
            high: parseFloat(quote['03. high']),
            low: parseFloat(quote['04. low']),
            volume: parseInt(quote['06. volume']),
            previousClose: parseFloat(quote['08. previous close']),
            lastUpdate: quote['07. latest trading day'],
            source: 'alphavantage'
          })
        }
      } catch (error) {
        secureLogger.audit('ALPHAVANTAGE_STOCK_ERROR', {
          symbol,
          error: error.message
        })
        
        results.push({
          symbol: symbol.toUpperCase(),
          name: symbol,
          price: null,
          error: error.message,
          source: 'alphavantage'
        })
      }
    }
    
    return results
  }

  /**
   * Get commodities data (using forex rates for gold, silver, etc.)
   */
  async getCommoditiesData(commodities = [], options = {}) {
    const results = []
    
    // Map commodity symbols to currency pairs
    const commodityMap = {
      'GOLD': 'XAU',
      'SILVER': 'XAG',
      'OIL': 'WTI', // Note: Alpha Vantage has limited commodity support
      'COPPER': 'HG'
    }
    
    for (const commodity of commodities) {
      try {
        await this.enforceRateLimit()
        
        const fromCurrency = commodityMap[commodity.toUpperCase()] || commodity.toUpperCase()
        const data = await this.makeRequest({
          function: 'CURRENCY_EXCHANGE_RATE',
          from_currency: fromCurrency,
          to_currency: options.currency || 'USD'
        })
        
        if (data['Realtime Currency Exchange Rate']) {
          const rate = data['Realtime Currency Exchange Rate']
          results.push({
            symbol: commodity.toUpperCase(),
            name: commodity,
            price: parseFloat(rate['5. Exchange Rate']),
            change24h: 0, // Not available in this endpoint
            changeAmount: 0,
            trend: 'neutral',
            lastUpdate: rate['6. Last Refreshed'],
            source: 'alphavantage'
          })
        }
      } catch (error) {
        secureLogger.audit('ALPHAVANTAGE_COMMODITY_ERROR', {
          commodity,
          error: error.message
        })
        
        results.push({
          symbol: commodity.toUpperCase(),
          name: commodity,
          price: null,
          error: error.message,
          source: 'alphavantage'
        })
      }
    }
    
    return results
  }

  /**
   * Get specific asset price
   */
  async getAssetPrice(asset, currency = 'USD', options = {}) {
    try {
      await this.enforceRateLimit()
      
      // Try as stock first
      let data = await this.makeRequest({
        function: 'GLOBAL_QUOTE',
        symbol: asset.toUpperCase()
      })
      
      if (data['Global Quote']) {
        return {
          symbol: asset.toUpperCase(),
          price: parseFloat(data['Global Quote']['05. price']),
          currency: 'USD',
          source: 'alphavantage',
          type: 'stock'
        }
      }
      
      // Try as currency/crypto
      data = await this.makeRequest({
        function: 'CURRENCY_EXCHANGE_RATE',
        from_currency: asset.toUpperCase(),
        to_currency: currency
      })
      
      if (data['Realtime Currency Exchange Rate']) {
        return {
          symbol: asset.toUpperCase(),
          price: parseFloat(data['Realtime Currency Exchange Rate']['5. Exchange Rate']),
          currency: currency,
          source: 'alphavantage',
          type: 'currency'
        }
      }
      
      return null
      
    } catch (error) {
      secureLogger.audit('ALPHAVANTAGE_ASSET_PRICE_ERROR', {
        asset,
        currency,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Get intraday data for charting
   */
  async getIntradayData(symbol, interval = '5min', options = {}) {
    try {
      await this.enforceRateLimit()
      
      const data = await this.makeRequest({
        function: 'TIME_SERIES_INTRADAY',
        symbol: symbol.toUpperCase(),
        interval: interval,
        outputsize: options.outputsize || 'compact'
      })
      
      const timeSeriesKey = `Time Series (${interval})`
      if (data[timeSeriesKey]) {
        const timeSeries = data[timeSeriesKey]
        const chartData = []
        
        for (const [timestamp, values] of Object.entries(timeSeries)) {
          chartData.push({
            time: timestamp,
            open: parseFloat(values['1. open']),
            high: parseFloat(values['2. high']),
            low: parseFloat(values['3. low']),
            close: parseFloat(values['4. close']),
            volume: parseInt(values['5. volume'])
          })
        }
        
        return {
          symbol: symbol.toUpperCase(),
          interval: interval,
          data: chartData.reverse(), // Most recent first
          source: 'alphavantage'
        }
      }
      
      return null
      
    } catch (error) {
      secureLogger.audit('ALPHAVANTAGE_INTRADAY_ERROR', {
        symbol,
        interval,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Make API request with proper error handling
   */
  async makeRequest(params) {
    try {
      const url = new URL(this.baseUrl)
      url.searchParams.append('apikey', this.apiKey)
      
      for (const [key, value] of Object.entries(params)) {
        url.searchParams.append(key, value)
      }
      
      this.lastRequestTime = Date.now()
      
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: {
          'User-Agent': 'diBoaS/1.0'
        },
        signal: AbortSignal.timeout(this.timeout)
      })
      
      if (!response.ok) {
        throw new Error(`Alpha Vantage API error: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      
      // Check for API-specific errors
      if (data['Error Message']) {
        throw new Error(`Alpha Vantage API error: ${data['Error Message']}`)
      }
      
      if (data['Information']) {
        throw new Error(`Alpha Vantage rate limit: ${data['Information']}`)
      }
      
      return data
      
    } catch (error) {
      secureLogger.audit('ALPHAVANTAGE_REQUEST_ERROR', {
        params,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Enforce rate limiting (5 calls per minute)
   */
  async enforceRateLimit() {
    const now = Date.now()
    const timeSinceLastRequest = now - this.lastRequestTime
    
    if (timeSinceLastRequest < this.rateLimitDelay) {
      const waitTime = this.rateLimitDelay - timeSinceLastRequest
      await new Promise(resolve => setTimeout(resolve, waitTime))
    }
  }

  /**
   * Get provider capabilities
   */
  getCapabilities() {
    return {
      stocks: true,
      crypto: true,
      forex: true,
      commodities: true,
      intraday: true,
      realtime: true,
      historical: true,
      rateLimit: '5 calls/minute',
      regions: ['US', 'Global'],
      provider: 'alphavantage'
    }
  }
}

export default AlphaVantageProvider