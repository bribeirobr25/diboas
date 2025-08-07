/**
 * Mockup Market Data Provider Service
 * Simulates 3rd party market data APIs with realistic response times
 * This will be replaced with real market data integrations (CoinGecko, CoinMarketCap, Alpha Vantage, etc.)
 */

import logger from '../../utils/logger.js'

export class MockupMarketDataProviderService {
  constructor() {
    // NO caching per requirements - always real-time data
    this.baselineData = this.initializeBaselines()
  }

  /**
   * Initialize baseline data for realistic price movements
   */
  initializeBaselines() {
    return {
      crypto: {
        BTC: { price: 43250, volatility: 0.04, trend: 0.02 },
        ETH: { price: 2680, volatility: 0.05, trend: 0.015 },
        SOL: { price: 98.75, volatility: 0.08, trend: 0.03 },
        SUI: { price: 1.85, volatility: 0.12, trend: 0.05 },
        AVAX: { price: 36.50, volatility: 0.07, trend: 0.02 },
        MATIC: { price: 0.85, volatility: 0.09, trend: 0.01 },
        ADA: { price: 0.52, volatility: 0.06, trend: -0.01 },
        DOT: { price: 7.25, volatility: 0.08, trend: 0.025 },
        LINK: { price: 14.80, volatility: 0.06, trend: 0.02 },
        UNI: { price: 6.90, volatility: 0.07, trend: 0.015 }
      },
      fiat: {
        EUR: { rate: 0.92, volatility: 0.008, trend: 0.001 },
        GBP: { rate: 0.79, volatility: 0.012, trend: -0.002 },
        JPY: { rate: 149.50, volatility: 0.015, trend: 0.003 },
        CHF: { rate: 0.88, volatility: 0.010, trend: 0.001 },
        CAD: { rate: 1.35, volatility: 0.012, trend: 0.002 },
        AUD: { rate: 1.52, volatility: 0.014, trend: 0.001 }
      },
      commodities: {
        GOLD: { price: 2045.50, volatility: 0.02, trend: 0.005 },
        SILVER: { price: 24.85, volatility: 0.03, trend: 0.008 },
        OIL: { price: 78.90, volatility: 0.04, trend: -0.01 },
        COPPER: { price: 4.12, volatility: 0.025, trend: 0.003 }
      },
      indices: {
        SPX: { price: 5125.45, volatility: 0.015, trend: 0.008 },
        NASDAQ: { price: 16180.30, volatility: 0.018, trend: 0.012 },
        DOW: { price: 38950.15, volatility: 0.012, trend: 0.006 },
        VIX: { price: 16.80, volatility: 0.25, trend: -0.05 }
      }
    }
  }

  /**
   * Get real-time price data for assets
   * In production, this would come from market data providers
   */
  async getRealTimePriceData(symbols = ['BTC', 'ETH', 'SOL'], baseCurrency = 'USD') {
    await this.simulateNetworkDelay(150, 400)
    
    const priceData = {}
    
    for (const symbol of symbols) {
      const baseline = this.findBaseline(symbol)
      if (!baseline) continue
      
      const currentPrice = this.generateRealisticPrice(baseline)
      const change24h = this.generatePriceChange(baseline)
      const volume24h = this.generateVolume(symbol, currentPrice)
      
      priceData[symbol] = {
        symbol,
        price: currentPrice,
        baseCurrency,
        change24h: change24h,
        changePercent24h: (change24h / (currentPrice - change24h)) * 100,
        volume24h,
        marketCap: this.calculateMarketCap(symbol, currentPrice),
        high24h: currentPrice * (1 + Math.random() * 0.05 + 0.01),
        low24h: currentPrice * (1 - Math.random() * 0.05 - 0.01),
        lastUpdated: Date.now(),
        source: 'market_data_provider',
        confidence: this.generateConfidence(),
        spread: this.generateSpread(baseline.volatility),
        priceHistory: this.generatePriceHistory(baseline, 24), // Last 24 hours
        technicalIndicators: this.generateTechnicalIndicators(baseline)
      }
    }
    
    return {
      data: priceData,
      timestamp: Date.now(),
      provider: 'mockup_market_data',
      rateLimit: {
        remaining: this.generateNumber(950, 1000),
        resetTime: Date.now() + 3600000 // 1 hour
      }
    }
  }

  /**
   * Get exchange rate data
   * In production, this would come from forex data providers
   */
  async getExchangeRateData(baseCurrency = 'USD', targetCurrencies = ['EUR', 'GBP', 'JPY']) {
    await this.simulateNetworkDelay(100, 300)
    
    const rates = {}
    
    for (const currency of targetCurrencies) {
      const baseline = this.baselineData.fiat[currency]
      if (!baseline) continue
      
      const currentRate = this.generateRealisticPrice(baseline)
      const change24h = this.generatePriceChange(baseline)
      
      rates[currency] = {
        currency,
        rate: currentRate,
        change24h,
        changePercent24h: (change24h / (currentRate - change24h)) * 100,
        high24h: currentRate * (1 + Math.random() * 0.02),
        low24h: currentRate * (1 - Math.random() * 0.02),
        lastUpdated: Date.now(),
        volatility: baseline.volatility,
        trend: baseline.trend
      }
    }
    
    return {
      baseCurrency,
      rates,
      timestamp: Date.now(),
      provider: 'forex_data_provider',
      nextUpdate: Date.now() + this.generateInterval(300000, 900000) // 5-15 minutes
    }
  }

  /**
   * Get market volatility data
   * In production, this would come from volatility index providers
   */
  async getMarketVolatilityData(timeframe = '24h') {
    await this.simulateNetworkDelay(200, 500)
    
    const volatilityData = {
      overall: {
        index: this.generateVolatilityIndex(),
        level: this.getVolatilityLevel(),
        change24h: this.generateChange(-5, 5),
        historical: this.generateHistoricalVolatility(30)
      },
      
      crypto: {
        average: this.generatePercentage(3, 8),
        median: this.generatePercentage(2.5, 6.5),
        highest: 'MEME_COIN',
        highestValue: this.generatePercentage(15, 50),
        lowest: 'BTC',
        lowestValue: this.generatePercentage(2, 4),
        distribution: this.generateVolatilityDistribution()
      },
      
      traditional: {
        stocks: {
          sp500: this.generatePercentage(1, 2.5),
          nasdaq: this.generatePercentage(1.2, 3),
          dow: this.generatePercentage(0.8, 2)
        },
        forex: {
          major: this.generatePercentage(0.5, 1.5),
          minor: this.generatePercentage(1, 3),
          exotic: this.generatePercentage(2, 6)
        },
        commodities: {
          precious_metals: this.generatePercentage(1, 2.5),
          energy: this.generatePercentage(2, 5),
          agricultural: this.generatePercentage(1.5, 4)
        }
      },
      
      correlations: {
        crypto_stocks: this.generateCorrelation(),
        crypto_bonds: this.generateCorrelation(),
        crypto_gold: this.generateCorrelation(),
        stocks_bonds: this.generateCorrelation()
      },
      
      riskMetrics: {
        valueAtRisk95: this.generatePercentage(2, 8),
        expectedShortfall: this.generatePercentage(3, 12),
        maxDrawdown: this.generatePercentage(5, 25),
        sharpeRatio: this.generateRatio(0.5, 2.5),
        sortinoRatio: this.generateRatio(0.7, 3.0)
      }
    }
    
    return {
      timeframe,
      data: volatilityData,
      timestamp: Date.now(),
      confidence: this.generatePercentage(85, 95),
      methodology: 'GARCH_MODEL',
      updateFrequency: 'real_time'
    }
  }

  /**
   * Get trading volume statistics
   * In production, this would aggregate from multiple exchanges
   */
  async getTradingVolumeData(period = '24h', exchanges = 'all') {
    await this.simulateNetworkDelay(250, 600)
    
    const generateExchangeVolume = (name, marketShare) => ({
      name,
      volume24h: this.generateVolume('BTC', 50000) * marketShare,
      marketShare: marketShare * 100,
      trades24h: this.generateNumber(100000, 2000000),
      uniqueUsers24h: this.generateNumber(10000, 500000),
      averageTradeSize: this.generateAmount(500, 50000),
      topPairs: this.generateTopTradingPairs(),
      fees: {
        maker: this.generatePercentage(0.05, 0.25),
        taker: this.generatePercentage(0.1, 0.35)
      }
    })
    
    return {
      period,
      global: {
        totalVolume24h: this.generateVolume('GLOBAL', 100000),
        totalTrades24h: this.generateNumber(5000000, 20000000),
        averageTradeSize: this.generateAmount(1000, 25000),
        change24h: this.generateChange(-15, 25),
        dominance: {
          BTC: this.generatePercentage(40, 55),
          ETH: this.generatePercentage(15, 25),
          stablecoins: this.generatePercentage(35, 45),
          altcoins: this.generatePercentage(15, 25)
        }
      },
      
      exchanges: {
        binance: generateExchangeVolume('Binance', 0.35),
        coinbase: generateExchangeVolume('Coinbase Pro', 0.15),
        kraken: generateExchangeVolume('Kraken', 0.08),
        bitfinex: generateExchangeVolume('Bitfinex', 0.05),
        huobi: generateExchangeVolume('Huobi', 0.07),
        okx: generateExchangeVolume('OKX', 0.10),
        others: generateExchangeVolume('Others', 0.20)
      },
      
      categories: {
        spot: {
          volume24h: this.generateVolume('SPOT', 50000),
          share: this.generatePercentage(60, 75),
          growth24h: this.generateChange(-10, 15)
        },
        derivatives: {
          volume24h: this.generateVolume('DERIVATIVES', 75000),
          share: this.generatePercentage(25, 40),
          growth24h: this.generateChange(-20, 35),
          openInterest: this.generateVolume('OI', 25000)
        }
      },
      
      geographic: {
        americas: this.generatePercentage(25, 35),
        europe: this.generatePercentage(20, 30),
        asia: this.generatePercentage(35, 50),
        other: this.generatePercentage(5, 15)
      },
      
      timestamp: Date.now(),
      nextUpdate: Date.now() + this.generateInterval(300000, 600000)
    }
  }

  /**
   * Get historical price data
   * In production, this would come from historical data providers
   */
  async getHistoricalPriceData(symbol, interval = '1h', limit = 100) {
    await this.simulateNetworkDelay(300, 800)
    
    const baseline = this.findBaseline(symbol)
    if (!baseline) {
      throw new Error(`Historical data for ${symbol} not available`)
    }
    
    const data = []
    const now = Date.now()
    const intervalMs = this.getIntervalMilliseconds(interval)
    
    let currentPrice = baseline.price
    
    for (let i = limit - 1; i >= 0; i--) {
      const timestamp = now - (i * intervalMs)
      const volatilityFactor = 1 + (Math.random() - 0.5) * baseline.volatility * 2
      const trendFactor = 1 + baseline.trend * (i / limit) * 0.1
      
      currentPrice = baseline.price * volatilityFactor * trendFactor
      
      const candle = {
        timestamp,
        open: currentPrice,
        high: currentPrice * (1 + Math.random() * baseline.volatility),
        low: currentPrice * (1 - Math.random() * baseline.volatility),
        close: currentPrice * (0.995 + Math.random() * 0.01),
        volume: this.generateVolume(symbol, currentPrice) / 24, // Hourly volume
        trades: this.generateNumber(100, 5000),
        buyVolume: this.generateVolume(symbol, currentPrice) * 0.6 / 24,
        sellVolume: this.generateVolume(symbol, currentPrice) * 0.4 / 24
      }
      
      data.push(candle)
    }
    
    return {
      symbol,
      interval,
      data,
      count: data.length,
      startTime: data[0]?.timestamp,
      endTime: data[data.length - 1]?.timestamp,
      provider: 'historical_data_provider',
      timestamp: Date.now()
    }
  }

  /**
   * Get market sentiment indicators
   * In production, this would aggregate from sentiment analysis providers
   */
  async getMarketSentimentData(assets = ['BTC', 'ETH', 'SOL']) {
    await this.simulateNetworkDelay(400, 900)
    
    const generateSentimentData = (symbol) => ({
      symbol,
      overall: {
        score: this.generateSentimentScore(),
        level: this.getSentimentLevel(),
        confidence: this.generatePercentage(70, 90),
        change24h: this.generateChange(-20, 20)
      },
      
      sources: {
        social: {
          twitter: {
            mentions: this.generateNumber(5000, 50000),
            sentiment: this.generateSentimentScore(),
            engagement: this.generateNumber(100000, 2000000)
          },
          reddit: {
            posts: this.generateNumber(100, 2000),
            sentiment: this.generateSentimentScore(),
            upvotes: this.generateNumber(5000, 100000)
          },
          telegram: {
            messages: this.generateNumber(1000, 20000),
            sentiment: this.generateSentimentScore(),
            activeUsers: this.generateNumber(10000, 500000)
          }
        },
        
        news: {
          articles: this.generateNumber(50, 500),
          sentiment: this.generateSentimentScore(),
          sources: this.generateNumber(20, 100),
          credibility: this.generatePercentage(70, 95)
        },
        
        onChain: {
          hodlerSentiment: this.generateSentimentScore(),
          whaleActivity: this.generateActivityLevel(),
          exchangeFlows: this.generateFlowSentiment(),
          stakingRatio: this.generatePercentage(60, 80)
        },
        
        trading: {
          fearGreedIndex: this.generateNumber(10, 90),
          optionsSkew: this.generateSkew(),
          fundingRates: this.generateFundingRates(),
          longShortRatio: this.generateRatio(0.3, 3.0)
        }
      },
      
      predictions: {
        next24h: this.generatePricePrediction(),
        next7d: this.generatePricePrediction(),
        next30d: this.generatePricePrediction(),
        confidence: this.generatePercentage(40, 75)
      }
    })
    
    const sentimentData = {}
    assets.forEach(symbol => {
      sentimentData[symbol] = generateSentimentData(symbol)
    })
    
    return {
      data: sentimentData,
      aggregated: {
        marketSentiment: this.generateSentimentScore(),
        volatilityExpectation: this.getVolatilityLevel(),
        riskAppetite: this.getRiskLevel(),
        consensusDirection: this.getMarketDirection()
      },
      timestamp: Date.now(),
      updateFrequency: '15 minutes',
      methodology: 'ML_SENTIMENT_ANALYSIS'
    }
  }

  /**
   * Helper methods for generating realistic market data
   */
  
  findBaseline(symbol) {
    for (const category of Object.values(this.baselineData)) {
      if (category[symbol]) {
        return category[symbol]
      }
    }
    return null
  }

  generateRealisticPrice(baseline) {
    const volatilityFactor = 1 + (Math.random() - 0.5) * baseline.volatility * 2
    const trendFactor = 1 + baseline.trend * Math.random() * 0.1
    return Math.round(baseline.price * volatilityFactor * trendFactor * 100) / 100
  }

  generatePriceChange(baseline) {
    const changePercent = (Math.random() - 0.5) * baseline.volatility * 4
    return baseline.price * changePercent
  }

  generateVolume(symbol, price) {
    const baseVolumes = {
      BTC: 25000000000, ETH: 15000000000, SOL: 2000000000,
      GLOBAL: 100000000000, SPOT: 60000000000, DERIVATIVES: 150000000000
    }
    
    const baseVolume = baseVolumes[symbol] || 1000000000
    const variation = 0.5 + Math.random()
    return Math.floor(baseVolume * variation)
  }

  calculateMarketCap(symbol, price) {
    const supplies = {
      BTC: 19800000, ETH: 120300000, SOL: 443200000,
      SUI: 2800000000, AVAX: 365000000, MATIC: 10000000000
    }
    
    const supply = supplies[symbol] || 1000000000
    return Math.floor(price * supply)
  }

  generateConfidence() {
    return this.generatePercentage(85, 98)
  }

  generateSpread(volatility) {
    return volatility * (0.001 + Math.random() * 0.002)
  }

  generatePriceHistory(baseline, hours) {
    const history = []
    const now = Date.now()
    
    for (let i = hours; i >= 0; i--) {
      history.push({
        timestamp: now - (i * 3600000),
        price: this.generateRealisticPrice(baseline)
      })
    }
    
    return history
  }

  generateTechnicalIndicators(baseline) {
    return {
      rsi: this.generateNumber(20, 80),
      macd: this.generateChange(-2, 2),
      bollingerBands: {
        upper: baseline.price * 1.02,
        middle: baseline.price,
        lower: baseline.price * 0.98
      },
      movingAverages: {
        sma20: baseline.price * (0.98 + Math.random() * 0.04),
        sma50: baseline.price * (0.96 + Math.random() * 0.08),
        ema12: baseline.price * (0.99 + Math.random() * 0.02)
      },
      support: baseline.price * (0.92 + Math.random() * 0.05),
      resistance: baseline.price * (1.03 + Math.random() * 0.05)
    }
  }

  generateVolatilityIndex() {
    return this.generateNumber(15, 85)
  }

  getVolatilityLevel() {
    const index = this.generateVolatilityIndex()
    if (index < 20) return 'very_low'
    if (index < 40) return 'low'
    if (index < 60) return 'moderate'
    if (index < 80) return 'high'
    return 'very_high'
  }

  generateHistoricalVolatility(days) {
    return Array.from({length: days}, () => this.generatePercentage(1, 10))
  }

  generateVolatilityDistribution() {
    return {
      'low (0-2%)': this.generatePercentage(10, 25),
      'moderate (2-5%)': this.generatePercentage(30, 50),
      'high (5-10%)': this.generatePercentage(25, 40),
      'very_high (>10%)': this.generatePercentage(5, 15)
    }
  }

  generateCorrelation() {
    return Math.round((Math.random() * 2 - 1) * 100) / 100
  }

  generateTopTradingPairs() {
    return [
      { pair: 'BTC/USDT', volume: this.generateVolume('BTC', 50000) },
      { pair: 'ETH/USDT', volume: this.generateVolume('ETH', 3000) },
      { pair: 'BTC/ETH', volume: this.generateVolume('BTC', 50000) * 0.3 },
      { pair: 'SOL/USDT', volume: this.generateVolume('SOL', 100) },
      { pair: 'ADA/USDT', volume: this.generateVolume('ADA', 0.5) }
    ]
  }

  generateSentimentScore() {
    return Math.round((Math.random() * 200 - 100) * 10) / 10 // -100 to +100
  }

  getSentimentLevel() {
    const score = this.generateSentimentScore()
    if (score < -60) return 'extremely_bearish'
    if (score < -30) return 'bearish'
    if (score < -10) return 'slightly_bearish'
    if (score < 10) return 'neutral'
    if (score < 30) return 'slightly_bullish'
    if (score < 60) return 'bullish'
    return 'extremely_bullish'
  }

  generateActivityLevel() {
    const levels = ['very_low', 'low', 'moderate', 'high', 'very_high']
    return levels[Math.floor(Math.random() * levels.length)]
  }

  generateFlowSentiment() {
    const flows = ['strong_inflow', 'inflow', 'balanced', 'outflow', 'strong_outflow']
    return flows[Math.floor(Math.random() * flows.length)]
  }

  generateSkew() {
    return Math.round((Math.random() * 20 - 10) * 100) / 100 // -10 to +10
  }

  generateFundingRates() {
    return {
      perpetual: this.generatePercentage(-0.5, 0.5),
      quarterly: this.generatePercentage(-1, 1),
      prediction: this.generateChange(-0.3, 0.3)
    }
  }

  generatePricePrediction() {
    return {
      direction: ['up', 'down', 'sideways'][Math.floor(Math.random() * 3)],
      magnitude: this.generatePercentage(1, 25),
      probability: this.generatePercentage(40, 80)
    }
  }

  getRiskLevel() {
    const levels = ['very_low', 'low', 'moderate', 'high', 'very_high']
    return levels[Math.floor(Math.random() * levels.length)]
  }

  getMarketDirection() {
    const directions = ['bullish', 'bearish', 'sideways', 'uncertain']
    return directions[Math.floor(Math.random() * directions.length)]
  }

  getIntervalMilliseconds(interval) {
    const intervals = {
      '1m': 60000,
      '5m': 300000,
      '15m': 900000,
      '30m': 1800000,
      '1h': 3600000,
      '4h': 14400000,
      '1d': 86400000,
      '1w': 604800000
    }
    return intervals[interval] || intervals['1h']
  }

  // Common helper methods
  generatePercentage(min, max) {
    return Math.round((min + Math.random() * (max - min)) * 100) / 100
  }

  generateNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  generateChange(min, max) {
    return Math.round((min + Math.random() * (max - min)) * 100) / 100
  }

  generateRatio(min, max) {
    return Math.round((min + Math.random() * (max - min)) * 100) / 100
  }

  generateAmount(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  generateInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  /**
   * Get all market data in one call - REAL TIME ONLY
   * NO CACHING - always fresh data
   */
  async getAllMarketData(symbols = ['BTC', 'ETH', 'SOL'], options = {}) {
    const {
      includePrices = true,
      includeRates = true,
      includeVolatility = true,
      includeVolume = true,
      includeSentiment = false
    } = options

    const requests = []
    
    if (includePrices) {
      requests.push(this.getRealTimePriceData(symbols))
    }
    if (includeRates) {
      requests.push(this.getExchangeRateData())
    }
    if (includeVolatility) {
      requests.push(this.getMarketVolatilityData())
    }
    if (includeVolume) {
      requests.push(this.getTradingVolumeData())
    }
    if (includeSentiment) {
      requests.push(this.getMarketSentimentData(symbols))
    }

    const results = await Promise.all(requests)
    
    return {
      prices: includePrices ? results[0] : null,
      rates: includeRates ? results[1] : null,
      volatility: includeVolatility ? results[2] : null,
      volume: includeVolume ? results[3] : null,
      sentiment: includeSentiment ? results[4] : null,
      timestamp: Date.now()
    }
  }

  /**
   * Simulate realistic network delay for API calls
   */
  async simulateNetworkDelay(minMs = 150, maxMs = 400) {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check method
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(50, 150)
      
      if (Math.random() < 0.005) {
        throw new Error('Market data provider temporarily unavailable')
      }
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        latency: Math.random() * 300 + 100,
        dataFeeds: ['prices', 'rates', 'volatility', 'volume', 'sentiment'],
        supportedAssets: Object.keys(this.baselineData.crypto).length + 
                        Object.keys(this.baselineData.fiat).length +
                        Object.keys(this.baselineData.commodities).length +
                        Object.keys(this.baselineData.indices).length,
        updateFrequency: 'real_time',
        dataQuality: this.generatePercentage(95, 99.5),
        apiLimits: {
          requestsPerMinute: this.generateNumber(1000, 5000),
          remaining: this.generateNumber(800, 4800)
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: Date.now()
      }
    }
  }
}

// Export singleton instance
export const mockupMarketDataProviderService = new MockupMarketDataProviderService()

// Export class for testing
export default MockupMarketDataProviderService