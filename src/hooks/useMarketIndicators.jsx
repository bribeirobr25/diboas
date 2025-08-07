/**
 * Market Indicators Hook
 * Provides real-time market data with dynamic price movements
 */

import { useState, useEffect, useCallback } from 'react'
import { mockupMarketIndicatorProviderService } from '../services/marketData/MockupMarketIndicatorProviderService'
import logger from '../utils/logger'

export const useMarketIndicators = (autoRefresh = true, refreshInterval = 30000) => {
  const [marketData, setMarketData] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Load market indicators
  const loadMarketIndicators = useCallback(async (forceRefresh = false) => {
    // Skip if we have recent data and not forcing refresh
    if (!forceRefresh && marketData.length > 0 && 
        Date.now() - lastUpdated < 15000) { // 15 second cache
      return marketData
    }

    setIsLoading(true)
    setError(null)

    try {
      const indicators = await mockupMarketIndicatorProviderService.getMarketIndicators()
      
      setMarketData(indicators)
      setLastUpdated(Date.now())
      
      logger.debug('useMarketIndicators: Loaded market indicators:', {
        count: indicators.length,
        timestamp: Date.now()
      })

      return indicators
    } catch (err) {
      logger.error('useMarketIndicators: Failed to load market indicators:', err)
      setError(err)
      
      // Try to use fallback data
      try {
        const fallbackData = await mockupMarketIndicatorProviderService._getFallbackMarketData()
        setMarketData(fallbackData)
        return fallbackData
      } catch (fallbackError) {
        logger.error('useMarketIndicators: Fallback also failed:', fallbackError)
        throw err
      }
    } finally {
      setIsLoading(false)
    }
  }, [marketData, lastUpdated])

  // Get specific market indicator by symbol
  const getIndicatorBySymbol = useCallback((symbol) => {
    return marketData.find(item => item.symbol === symbol) || null
  }, [marketData])

  // Get indicators by category
  const getIndicatorsByCategory = useCallback((category) => {
    return marketData.filter(item => item.category === category)
  }, [marketData])

  // Get trending indicators (highest absolute change)
  const getTrendingIndicators = useCallback((limit = 3) => {
    return [...marketData]
      .sort((a, b) => Math.abs(b.changePercent || 0) - Math.abs(a.changePercent || 0))
      .slice(0, limit)
  }, [marketData])

  // Get performance summary
  const getPerformanceSummary = useCallback(() => {
    if (marketData.length === 0) return null

    const cryptoIndicators = marketData.filter(item => item.category === 'cryptocurrency')
    const positiveCount = marketData.filter(item => item.isPositive).length
    const negativeCount = marketData.length - positiveCount
    
    const avgChange = marketData.reduce((sum, item) => sum + (item.changePercent || 0), 0) / marketData.length

    return {
      totalIndicators: marketData.length,
      positiveCount,
      negativeCount,
      averageChange: avgChange,
      isMarketPositive: avgChange > 0,
      cryptoCount: cryptoIndicators.length,
      lastUpdated
    }
  }, [marketData, lastUpdated])

  // Force refresh
  const refreshIndicators = useCallback(() => {
    return loadMarketIndicators(true)
  }, [loadMarketIndicators])

  // Load on mount
  useEffect(() => {
    loadMarketIndicators()
  }, [])

  // Set up auto-refresh if enabled
  useEffect(() => {
    if (!autoRefresh || refreshInterval <= 0) return

    const interval = setInterval(() => {
      loadMarketIndicators(true)
    }, refreshInterval)

    return () => clearInterval(interval)
  }, [autoRefresh, refreshInterval, loadMarketIndicators])

  return {
    marketData,
    isLoading,
    error,
    lastUpdated,
    loadMarketIndicators,
    getIndicatorBySymbol,
    getIndicatorsByCategory,
    getTrendingIndicators,
    getPerformanceSummary,
    refreshIndicators
  }
}

export default useMarketIndicators