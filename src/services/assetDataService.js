/**
 * Asset Data Service with Caching Layer
 * Handles all asset-related data fetching with mockup service integration
 * Follows DDD principles and maintains proper abstraction
 */

// Cache configuration
const CACHE_CONFIG = {
  STATIC_DATA: 24 * 60 * 60 * 1000, // 24 hours for static data
  PRICE_DATA: 5 * 60 * 1000,       // 5 minutes for price data (development)
  MARKET_STATS: 5 * 60 * 1000      // 5 minutes for market stats (development)
}

// Mock data for all supported assets
const MOCK_ASSET_DATA = {
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: '₿',
    description: 'The world\'s first and largest cryptocurrency by market cap',
    website: 'https://bitcoin.org',
    whitepaper: 'https://bitcoin.org/bitcoin.pdf',
    chain: 'BTC',
    decimals: 8,
    contractAddress: null
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: 'Ξ',
    description: 'Decentralized platform for smart contracts and DApps',
    website: 'https://ethereum.org',
    whitepaper: 'https://ethereum.org/whitepaper/',
    chain: 'ETH',
    decimals: 18,
    contractAddress: null
  },
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    icon: '◎',
    description: 'High-performance blockchain supporting builders around the world',
    website: 'https://solana.com',
    whitepaper: 'https://solana.com/solana-whitepaper.pdf',
    chain: 'SOL',
    decimals: 9,
    contractAddress: null
  },
  SUI: {
    symbol: 'SUI',
    name: 'Sui',
    icon: '〽',
    description: 'Layer 1 blockchain designed from the ground up to enable creators and developers',
    website: 'https://sui.io',
    whitepaper: 'https://github.com/MystenLabs/sui/blob/main/doc/paper/sui.pdf',
    chain: 'SUI',
    decimals: 9,
    contractAddress: null
  },
  PAXG: {
    symbol: 'PAXG',
    name: 'PAX Gold',
    icon: '🥇',
    description: 'Gold-backed cryptocurrency. Each token represents 1 fine troy ounce of gold.',
    website: 'https://paxos.com/paxgold',
    whitepaper: 'https://paxos.com/paxgold/',
    chain: 'ETH',
    decimals: 18,
    contractAddress: '0x45804880De22913dAFE09f4980848ECE6EcbAf78'
  },
  XAUT: {
    symbol: 'XAUT',
    name: 'Tether Gold',
    icon: '🏆',
    description: 'Gold-backed stablecoin. Each token represents 1 troy ounce of physical gold.',
    website: 'https://gold.tether.to',
    whitepaper: 'https://tether.to/en/transparency/',
    chain: 'ETH',
    decimals: 6,
    contractAddress: '0x68749665FF8D2d112Fa859AA293F07A622782F38'
  },
  MAG7: {
    symbol: 'MAG7',
    name: 'Magnificent 7 Index',
    icon: '🚀',
    description: 'Tokenized index tracking the top 7 tech giants: Apple, Microsoft, Google, Amazon, Nvidia, Meta, Tesla',
    website: 'https://diboas.com/mag7',
    whitepaper: null,
    chain: 'SOL',
    decimals: 9,
    contractAddress: 'MAG7tokenAddressSolana'
  },
  SPX: {
    symbol: 'SPX',
    name: 'S&P 500 Token',
    icon: '📈',
    description: 'Tokenized S&P 500 index fund tracking the performance of 500 large US companies',
    website: 'https://diboas.com/spx',
    whitepaper: null,
    chain: 'SOL',
    decimals: 9,
    contractAddress: 'SPXtokenAddressSolana'
  },
  REIT: {
    symbol: 'REIT',
    name: 'Global REIT Fund',
    icon: '🏢',
    description: 'Tokenized real estate investment trust providing exposure to global commercial properties',
    website: 'https://diboas.com/reit',
    whitepaper: null,
    chain: 'SOL',
    decimals: 9,
    contractAddress: 'REITtokenAddressSolana'
  }
}

// Mock price generation with realistic variations
const generateMockPrice = (basePrice, volatility = 0.02) => {
  const change = (Math.random() - 0.5) * 2 * volatility
  return basePrice * (1 + change)
}

// Mock market data generator
const generateMarketData = (symbol) => {
  const basePrices = {
    BTC: 43250,
    ETH: 2680,
    SOL: 98.75,
    SUI: 1.85,
    PAXG: 2687.34,
    XAUT: 2689.45,
    MAG7: 485.23,
    SPX: 5125.45,
    REIT: 245.67
  }

  const marketCaps = {
    BTC: 850.2e9,
    ETH: 322.1e9,
    SOL: 43.8e9,
    SUI: 5.2e9,
    PAXG: 540.2e6,
    XAUT: 485.3e6,
    MAG7: 125e6,
    SPX: 98e6,
    REIT: 45e6
  }

  const volumes = {
    BTC: 28.4e9,
    ETH: 15.2e9,
    SOL: 2.1e9,
    SUI: 485e6,
    PAXG: 8.9e6,
    XAUT: 5.2e6,
    MAG7: 3.8e6,
    SPX: 2.1e6,
    REIT: 890e3
  }

  const supplies = {
    BTC: '19.8M BTC',
    ETH: '120.3M ETH',
    SOL: '443.2M SOL',
    SUI: '2.8B SUI',
    PAXG: '201,045 PAXG',
    XAUT: '180,472 XAUT',
    MAG7: '257,845 MAG7',
    SPX: '19,120 SPX',
    REIT: '183,245 REIT'
  }

  const ranks = {
    BTC: 1,
    ETH: 2,
    SOL: 5,
    SUI: 18,
    PAXG: 78,
    XAUT: 85,
    MAG7: 152,
    SPX: 178,
    REIT: 245
  }

  const basePrice = basePrices[symbol] || 100
  const currentPrice = generateMockPrice(basePrice)
  const previousPrice = generateMockPrice(basePrice, 0.01)
  const change24h = ((currentPrice - previousPrice) / previousPrice) * 100
  const changeAmount = currentPrice - previousPrice

  return {
    price: currentPrice,
    change24h: change24h,
    changeAmount: changeAmount,
    trend: change24h >= 0 ? 'up' : 'down',
    marketCap: marketCaps[symbol] || 1e9,
    volume24h: volumes[symbol] || 1e6,
    supply: supplies[symbol] || '1M',
    rank: ranks[symbol] || 100,
    high24h: currentPrice * 1.02,
    low24h: currentPrice * 0.98,
    priceHistory: generatePriceHistory(basePrice)
  }
}

// Generate price history for charts
const generatePriceHistory = (basePrice) => {
  const history = []
  const now = new Date()
  
  for (let i = 24; i >= 0; i--) {
    const time = new Date(now.getTime() - i * 60 * 60 * 1000)
    const price = generateMockPrice(basePrice, 0.01)
    history.push({
      time: time.toISOString(),
      price: price
    })
  }
  
  return history
}

class AssetDataService {
  constructor() {
    this.cache = new Map()
    this.subscriptions = new Map()
    this.updateIntervals = new Map()
  }

  /**
   * Get static asset information (cached for 24 hours)
   */
  async getAssetInfo(symbol) {
    const cacheKey = `asset_info_${symbol}`
    const cached = this.getFromCache(cacheKey, CACHE_CONFIG.STATIC_DATA)
    
    if (cached) {
      return cached
    }

    // Simulate API call delay
    await this.simulateApiDelay()

    const assetData = MOCK_ASSET_DATA[symbol]
    if (!assetData) {
      throw new Error(`Asset ${symbol} not found`)
    }

    const result = {
      ...assetData,
      lastUpdated: new Date().toISOString()
    }

    this.setCache(cacheKey, result)
    return result
  }

  /**
   * Get real-time price data (cached for 15 minutes)
   */
  async getAssetPrice(symbol) {
    const cacheKey = `asset_price_${symbol}`
    const cached = this.getFromCache(cacheKey, CACHE_CONFIG.PRICE_DATA)
    
    if (cached) {
      return cached
    }

    // Simulate API call delay
    await this.simulateApiDelay()

    const marketData = generateMarketData(symbol)
    const result = {
      symbol,
      price: marketData.price,
      change24h: marketData.change24h,
      changeAmount: marketData.changeAmount,
      trend: marketData.trend,
      high24h: marketData.high24h,
      low24h: marketData.low24h,
      lastUpdated: new Date().toISOString()
    }

    this.setCache(cacheKey, result)
    
    // Emit price update event
    this.emitPriceUpdate(symbol, result)
    
    return result
  }

  /**
   * Get market statistics (cached for 15 minutes)
   */
  async getMarketStats(symbol) {
    const cacheKey = `market_stats_${symbol}`
    const cached = this.getFromCache(cacheKey, CACHE_CONFIG.MARKET_STATS)
    
    if (cached) {
      return cached
    }

    // Simulate API call delay
    await this.simulateApiDelay()

    const marketData = generateMarketData(symbol)
    const result = {
      marketCap: marketData.marketCap,
      volume24h: marketData.volume24h,
      supply: marketData.supply,
      rank: marketData.rank,
      lastUpdated: new Date().toISOString()
    }

    this.setCache(cacheKey, result)
    return result
  }

  /**
   * Get complete asset data (combines all data sources)
   */
  async getCompleteAssetData(symbol) {
    const [info, price, stats] = await Promise.all([
      this.getAssetInfo(symbol),
      this.getAssetPrice(symbol),
      this.getMarketStats(symbol)
    ])

    return {
      ...info,
      ...price,
      ...stats,
      priceFormatted: this.formatPrice(price.price),
      change24hFormatted: this.formatPercentage(price.change24h),
      changeAmountFormatted: this.formatPrice(Math.abs(price.changeAmount)),
      marketCapFormatted: this.formatMarketCap(stats.marketCap),
      volume24hFormatted: this.formatVolume(stats.volume24h)
    }
  }

  /**
   * Subscribe to real-time price updates
   */
  subscribeToPriceUpdates(symbol, callback) {
    const subscriptionId = `${symbol}_${Date.now()}`
    
    if (!this.subscriptions.has(symbol)) {
      this.subscriptions.set(symbol, new Set())
      this.startPriceUpdates(symbol)
    }
    
    this.subscriptions.get(symbol).add({ id: subscriptionId, callback })
    
    // Return unsubscribe function
    return () => {
      this.unsubscribeFromPriceUpdates(symbol, subscriptionId)
    }
  }

  /**
   * Unsubscribe from price updates
   */
  unsubscribeFromPriceUpdates(symbol, subscriptionId) {
    const symbolSubs = this.subscriptions.get(symbol)
    if (!symbolSubs) return

    symbolSubs.forEach(sub => {
      if (sub.id === subscriptionId) {
        symbolSubs.delete(sub)
      }
    })

    if (symbolSubs.size === 0) {
      this.subscriptions.delete(symbol)
      this.stopPriceUpdates(symbol)
    }
  }

  /**
   * Start automatic price updates
   * Disabled in development to prevent server reload issues
   */
  startPriceUpdates(symbol) {
    if (this.updateIntervals.has(symbol)) return

    // DISABLED: Automatic updates cause development server instability
    // In production, this would be handled by WebSocket or SSE
    // 
    // const interval = setInterval(async () => {
    //   try {
    //     const price = await this.getAssetPrice(symbol)
    //     this.emitPriceUpdate(symbol, price)
    //   } catch (error) {
    //     console.error(`Error updating price for ${symbol}:`, error)
    //   }
    // }, CACHE_CONFIG.PRICE_DATA)
    // 
    // this.updateIntervals.set(symbol, interval)
    
    console.log(`Price updates subscription registered for ${symbol} (manual refresh mode)`)
  }

  /**
   * Stop automatic price updates
   */
  stopPriceUpdates(symbol) {
    const interval = this.updateIntervals.get(symbol)
    if (interval) {
      clearInterval(interval)
      this.updateIntervals.delete(symbol)
    }
  }

  /**
   * Emit price update to subscribers
   */
  emitPriceUpdate(symbol, priceData) {
    const symbolSubs = this.subscriptions.get(symbol)
    if (!symbolSubs) return

    symbolSubs.forEach(sub => {
      try {
        sub.callback(priceData)
      } catch (error) {
        console.error(`Error in price update callback:`, error)
      }
    })
  }

  /**
   * Clear all subscriptions and intervals
   */
  cleanup() {
    this.updateIntervals.forEach(interval => clearInterval(interval))
    this.updateIntervals.clear()
    this.subscriptions.clear()
    this.cache.clear()
  }

  /**
   * Cache management
   */
  getFromCache(key, maxAge) {
    const cached = this.cache.get(key)
    if (!cached) return null

    const age = Date.now() - cached.timestamp
    if (age > maxAge) {
      this.cache.delete(key)
      return null
    }

    return cached.data
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  clearCache() {
    this.cache.clear()
  }

  /**
   * Format helpers
   */
  formatPrice(price) {
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    } else if (price >= 1) {
      return `$${price.toFixed(2)}`
    } else {
      return `$${price.toFixed(4)}`
    }
  }

  formatPercentage(percentage) {
    const sign = percentage >= 0 ? '+' : ''
    return `${sign}${percentage.toFixed(2)}%`
  }

  formatMarketCap(marketCap) {
    if (marketCap >= 1e12) {
      return `$${(marketCap / 1e12).toFixed(1)}T`
    } else if (marketCap >= 1e9) {
      return `$${(marketCap / 1e9).toFixed(1)}B`
    } else if (marketCap >= 1e6) {
      return `$${(marketCap / 1e6).toFixed(1)}M`
    } else {
      return `$${(marketCap / 1e3).toFixed(1)}K`
    }
  }

  formatVolume(volume) {
    return this.formatMarketCap(volume)
  }

  /**
   * Simulate API delay for realistic behavior
   */
  async simulateApiDelay() {
    const delay = Math.random() * 200 + 100 // 100-300ms
    await new Promise(resolve => setTimeout(resolve, delay))
  }
}

// Create singleton instance
export const assetDataService = new AssetDataService()

// Export for testing
export { AssetDataService, CACHE_CONFIG, MOCK_ASSET_DATA }