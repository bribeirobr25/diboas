/**
 * Market Data Hook for React Components
 * Provides real-time market data with proper state management and cleanup
 */

import { useState, useEffect, useCallback } from 'react'
import { marketDataService } from '../services/marketData/MarketDataService.js'
import { dataManager } from '../services/DataManager.js'
import secureLogger from '../utils/secureLogger.js'

/**
 * Market data types
 */
export const MARKET_DATA_TYPES = {
  CRYPTO: 'crypto',
  STOCKS: 'stocks',
  COMMODITIES: 'commodities',
  ALL: 'all'
}

/**
 * Hook for accessing real-time market data
 */
export function useMarketData(dataType = MARKET_DATA_TYPES.ALL) {
  const [marketData, setMarketData] = useState({
    crypto: [],
    stocks: [],
    commodities: [],
    isLoading: true,
    error: null,
    lastUpdate: null
  })

  const [serviceStatus, setServiceStatus] = useState({
    isActive: false,
    healthy: true
  })

  /**
   * Update market data state
   */
  const updateMarketData = useCallback((type, data) => {
    setMarketData(prev => ({
      ...prev,
      [type]: data,
      lastUpdate: new Date().toISOString(),
      isLoading: false,
      error: null
    }))
  }, [])

  /**
   * Handle market data errors
   */
  const handleError = useCallback((error) => {
    setMarketData(prev => ({
      ...prev,
      error: error.message,
      isLoading: false
    }))

    secureLogger.audit('MARKET_DATA_HOOK_ERROR', {
      error: error.message,
      dataType
    })
  }, [dataType])

  /**
   * Start market data service and subscribe to updates
   */
  useEffect(() => {
    let mounted = true

    const startService = async () => {
      try {
        // Start the market data service
        if (!marketDataService.isActive) {
          await marketDataService.start()
        }

        // Update service status
        if (mounted) {
          setServiceStatus({
            isActive: true,
            healthy: true
          })
        }

      } catch (error) {
        if (mounted) {
          setServiceStatus({
            isActive: false,
            healthy: false
          })
          handleError(error)
        }
      }
    }

    startService()

    return () => {
      mounted = false
    }
  }, [handleError])

  /**
   * Subscribe to market data updates
   */
  useEffect(() => {
    const subscriptions = []

    // Subscribe to crypto updates
    if (dataType === MARKET_DATA_TYPES.CRYPTO || dataType === MARKET_DATA_TYPES.ALL) {
      const unsubscribeCrypto = dataManager.subscribe('market:crypto:updated', (data) => {
        updateMarketData('crypto', data)
      })
      subscriptions.push(unsubscribeCrypto)
    }

    // Subscribe to stock updates
    if (dataType === MARKET_DATA_TYPES.STOCKS || dataType === MARKET_DATA_TYPES.ALL) {
      const unsubscribeStocks = dataManager.subscribe('market:stocks:updated', (data) => {
        updateMarketData('stocks', data)
      })
      subscriptions.push(unsubscribeStocks)
    }

    // Subscribe to commodities updates
    if (dataType === MARKET_DATA_TYPES.COMMODITIES || dataType === MARKET_DATA_TYPES.ALL) {
      const unsubscribeCommodities = dataManager.subscribe('market:commodities:updated', (data) => {
        updateMarketData('commodities', data)
      })
      subscriptions.push(unsubscribeCommodities)
    }

    // Cleanup subscriptions
    return () => {
      subscriptions.forEach(unsubscribe => unsubscribe())
    }
  }, [dataType, updateMarketData])

  /**
   * Get specific asset data
   */
  const getAssetData = useCallback((symbol, type = 'crypto') => {
    const data = marketData[type]
    if (!Array.isArray(data)) return null
    
    return data.find(asset => asset.symbol.toLowerCase() === symbol.toLowerCase())
  }, [marketData])

  /**
   * Get formatted price
   */
  const getFormattedPrice = useCallback((symbol, type = 'crypto') => {
    const asset = getAssetData(symbol, type)
    if (!asset || typeof asset.price !== 'number') return 'N/A'
    
    // Determine appropriate decimal places based on asset value
    let maximumFractionDigits = 2
    if (symbol === 'BTC' && asset.price > 1000) {
      maximumFractionDigits = 0
    } else if (asset.price < 0.01) {
      maximumFractionDigits = 6
    } else if (asset.price < 1) {
      maximumFractionDigits = 4
    }
    
    // Ensure valid range for maximumFractionDigits (0-20)
    maximumFractionDigits = Math.max(0, Math.min(20, maximumFractionDigits))
    
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: Math.min(2, maximumFractionDigits),
      maximumFractionDigits
    }).format(asset.price)
  }, [getAssetData])

  /**
   * Get formatted change percentage
   */
  const getFormattedChange = useCallback((symbol, type = 'crypto') => {
    const asset = getAssetData(symbol, type)
    if (!asset || typeof asset.change24h !== 'number') return 'N/A'
    
    const sign = asset.change24h >= 0 ? '+' : ''
    return `${sign}${asset.change24h.toFixed(2)}%`
  }, [getAssetData])

  /**
   * Check if asset price is positive
   */
  const isPricePositive = useCallback((symbol, type = 'crypto') => {
    const asset = getAssetData(symbol, type)
    return asset ? asset.change24h >= 0 : false
  }, [getAssetData])

  /**
   * Refresh market data manually
   */
  const refresh = useCallback(async () => {
    try {
      setMarketData(prev => ({ ...prev, isLoading: true, error: null }))
      
      if (!marketDataService.isActive) {
        await marketDataService.start()
      } else {
        await marketDataService.updateAllMarketData()
      }
      
    } catch (error) {
      handleError(error)
    }
  }, [handleError])

  /**
   * Get market summary for dashboard
   */
  const getMarketSummary = useCallback(() => {
    const summary = []

    // Add crypto summary
    if (marketData.crypto.length > 0) {
      const btc = marketData.crypto.find(asset => asset.symbol === 'BTC')
      if (btc) {
        summary.push({
          name: 'BTC',
          value: getFormattedPrice('BTC', 'crypto'),
          change: getFormattedChange('BTC', 'crypto'),
          isPositive: isPricePositive('BTC', 'crypto'),
          icon: '₿'
        })
      }
    }

    // Add stock summary
    if (marketData.stocks.length > 0) {
      const spy = marketData.stocks.find(asset => asset.symbol === 'SPY')
      if (spy) {
        summary.push({
          name: 'Stock Market',
          value: spy.price.toFixed(2),
          change: getFormattedChange('SPY', 'stocks'),
          isPositive: isPricePositive('SPY', 'stocks'),
          icon: '📈'
        })
      }
    }

    // Add commodities summary
    if (marketData.commodities.length > 0) {
      const gold = marketData.commodities.find(asset => asset.symbol === 'GOLD')
      if (gold) {
        summary.push({
          name: 'Gold',
          value: getFormattedPrice('GOLD', 'commodities'),
          change: getFormattedChange('GOLD', 'commodities'),
          isPositive: isPricePositive('GOLD', 'commodities'),
          icon: '🥇'
        })
      }
    }

    // Add total market cap if crypto data available
    if (marketData.crypto.length > 0) {
      const totalMarketCap = marketData.crypto
        .filter(asset => asset.marketCap)
        .reduce((sum, asset) => sum + asset.marketCap, 0)

      if (totalMarketCap > 0) {
        summary.push({
          name: 'Crypto Market Cap',
          value: `$${(totalMarketCap / 1e12).toFixed(2)}T`,
          change: '+2.8%', // Mock overall change
          isPositive: true,
          icon: '💎'
        })
      }
    }

    // Add DeFi TVL (mock data)
    summary.push({
      name: 'DeFi TVL',
      value: '$45.8B',
      change: '+1.7%',
      isPositive: true,
      icon: '🏦'
    })

    return summary
  }, [marketData, getFormattedPrice, getFormattedChange, isPricePositive])

  return {
    // Market data
    marketData: {
      crypto: marketData.crypto,
      stocks: marketData.stocks,
      commodities: marketData.commodities
    },
    
    // State
    isLoading: marketData.isLoading,
    error: marketData.error,
    lastUpdate: marketData.lastUpdate,
    serviceStatus,
    
    // Helper functions
    getAssetData,
    getFormattedPrice,
    getFormattedChange,
    isPricePositive,
    getMarketSummary,
    refresh
  }
}

/**
 * Hook for specific asset data
 */
export function useAssetPrice(symbol, type = 'crypto') {
  const { getAssetData, getFormattedPrice, getFormattedChange, isPricePositive } = useMarketData(type)
  
  return {
    data: getAssetData(symbol, type),
    formattedPrice: getFormattedPrice(symbol, type),
    formattedChange: getFormattedChange(symbol, type),
    isPositive: isPricePositive(symbol, type)
  }
}

export default useMarketData