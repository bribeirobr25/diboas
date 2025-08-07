/**
 * Mockup Asset Price Provider Service
 * Simulates 3rd party asset price provider APIs with realistic response times
 * This will be replaced with real provider integrations (CoinGecko, CoinMarketCap, etc.)
 */

import logger from '../../utils/logger.js'

export class MockupAssetPriceProviderService {
  constructor() {
    // NO caching per requirements - always real-time data
  }

  /**
   * Get current market prices for all supported assets
   * In production, this would come from price aggregator APIs
   */
  async getAssetPrices() {
    await this.simulateNetworkDelay(200, 500)
    
    // Simulate realistic price variations (±2% from base price)
    const basePrice = (price) => {
      const variation = (Math.random() - 0.5) * 0.04 // ±2%
      return (price * (1 + variation)).toFixed(2)
    }

    return {
      BTC: basePrice(94523.45),
      ETH: basePrice(3245.67),
      SOL: basePrice(98.23),
      SUI: basePrice(4.12),
      USD: '1.00' // USD is always 1.00
    }
  }

  /**
   * Get historical price data for charts
   * In production, this would query historical data APIs
   */
  async getHistoricalPrices(asset, timeframe = '24h') {
    await this.simulateNetworkDelay(300, 700)
    
    const currentPrice = await this.getAssetPrice(asset)
    const basePrice = parseFloat(currentPrice)
    
    // Generate mock historical data
    const hours = timeframe === '24h' ? 24 : timeframe === '7d' ? 168 : 720
    const dataPoints = []
    
    for (let i = hours; i >= 0; i--) {
      const timestamp = Date.now() - (i * 60 * 60 * 1000)
      const variation = (Math.random() - 0.5) * 0.1 // ±5% variation
      const price = basePrice * (1 + variation)
      
      dataPoints.push({
        timestamp,
        price: parseFloat(price.toFixed(2))
      })
    }
    
    return dataPoints
  }

  /**
   * Get price for a specific asset
   * In production, this would query specific asset APIs
   */
  async getAssetPrice(asset) {
    const allPrices = await this.getAssetPrices()
    return allPrices[asset] || '0.00'
  }

  /**
   * Get price changes and trends
   * In production, this would calculate from historical data
   */
  async getPriceChanges() {
    await this.simulateNetworkDelay(150, 400)
    
    // Simulate realistic 24h changes
    const generateChange = () => {
      const change = (Math.random() - 0.5) * 0.2 // ±10% daily change
      return {
        percentage: (change * 100).toFixed(2),
        absolute: change > 0 ? 'up' : 'down'
      }
    }

    return {
      BTC: generateChange(),
      ETH: generateChange(),
      SOL: generateChange(),
      SUI: generateChange(),
      USD: { percentage: '0.00', absolute: 'neutral' }
    }
  }

  /**
   * Get market cap and volume data
   * In production, this would come from market data APIs
   */
  async getMarketData() {
    await this.simulateNetworkDelay(250, 600)
    
    const generateMarketData = (marketCap, volume) => {
      const mcVariation = (Math.random() - 0.5) * 0.05 // ±2.5%
      const volVariation = (Math.random() - 0.5) * 0.3 // ±15%
      
      return {
        marketCap: Math.round(marketCap * (1 + mcVariation)),
        volume24h: Math.round(volume * (1 + volVariation))
      }
    }

    return {
      BTC: generateMarketData(1850000000000, 32000000000), // $1.85T market cap, $32B volume
      ETH: generateMarketData(390000000000, 15000000000),  // $390B market cap, $15B volume
      SOL: generateMarketData(45000000000, 2500000000),    // $45B market cap, $2.5B volume
      SUI: generateMarketData(12000000000, 800000000),     // $12B market cap, $800M volume
      USD: { marketCap: 0, volume24h: 0 } // USD doesn't have market cap/volume
    }
  }

  /**
   * Get all asset data in one call - REAL TIME ONLY
   * In production, this could be a single API call or aggregated endpoint
   * NO CACHING - always fresh data
   */
  async getAllAssetData() {
    // In production, this would be a single API call or parallel calls
    const [prices, changes, marketData] = await Promise.all([
      this.getAssetPrices(),
      this.getPriceChanges(),
      this.getMarketData()
    ])

    const allAssetData = {
      prices,
      changes,
      marketData,
      timestamp: Date.now()
    }

    return allAssetData
  }

  /**
   * Get formatted asset data for UI components
   */
  async getFormattedAssetData() {
    const { prices, changes, marketData } = await this.getAllAssetData()
    
    const formatPrice = (price) => `$${parseFloat(price).toLocaleString()}`
    const formatMarketCap = (marketCap) => {
      if (marketCap >= 1e12) return `$${(marketCap / 1e12).toFixed(2)}T`
      if (marketCap >= 1e9) return `$${(marketCap / 1e9).toFixed(2)}B`
      if (marketCap >= 1e6) return `$${(marketCap / 1e6).toFixed(2)}M`
      return `$${marketCap.toLocaleString()}`
    }

    const assets = ['BTC', 'ETH', 'SOL', 'SUI']
    
    return assets.map(asset => ({
      assetId: asset,
      tickerSymbol: asset,
      currentMarketPrice: formatPrice(prices[asset]),
      priceChange24h: changes[asset]?.percentage + '%',
      priceDirection: changes[asset]?.absolute,
      marketCap: formatMarketCap(marketData[asset]?.marketCap || 0),
      volume24h: formatMarketCap(marketData[asset]?.volume24h || 0),
      rawPrice: parseFloat(prices[asset])
    }))
  }

  /**
   * Simulate realistic network delay for API calls
   */
  async simulateNetworkDelay(minMs = 100, maxMs = 500) {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check method - simulates provider availability
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(50, 200)
      
      // Simulate occasional provider outages (3% chance)
      if (Math.random() < 0.03) {
        throw new Error('Mockup asset price provider temporarily unavailable')
      }
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        latency: Math.random() * 300 + 100, // 100-400ms
        priceFeeds: {
          BTC: 'active',
          ETH: 'active', 
          SOL: 'active',
          SUI: 'active'
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
export const mockupAssetPriceProviderService = new MockupAssetPriceProviderService()

// Export class for testing
export default MockupAssetPriceProviderService