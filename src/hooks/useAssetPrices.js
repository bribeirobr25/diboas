/**
 * Asset Prices Hook
 * Handles real-time asset price retrieval via MockupAssetPriceProviderService
 */

import { useState, useEffect, useCallback } from 'react'
import { mockupAssetPriceProviderService } from '../services/assets/MockupAssetPriceProviderService'
import logger from '../utils/logger'

export const useAssetPrices = () => {
  const [assets, setAssets] = useState([])
  const [prices, setPrices] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isTimeout, setIsTimeout] = useState(false)

  // Load asset prices with 5-second timeout
  const loadAssetPrices = useCallback(async (forceRefresh = false) => {
    setIsLoading(true)
    setError(null)
    setIsTimeout(false)

    // Set up 5-second timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        setIsTimeout(true)
        reject(new Error('Asset price loading timeout - please try again'))
      }, 5000)
    })

    try {
      // Race between price loading and timeout
      const assetData = await Promise.race([
        mockupAssetPriceProviderService.getFormattedAssetData(),
        timeoutPromise
      ])

      // Create formatted assets array for UI components
      const formattedAssets = [
        // Cryptocurrencies
        { 
          assetId: 'BTC', 
          tickerSymbol: 'BTC', 
          displayName: 'Bitcoin', 
          currencyIcon: '₿', 
          currentMarketPrice: assetData.find(a => a.assetId === 'BTC')?.currentMarketPrice || '$0.00',
          themeClasses: { bgColor: 'bg-orange-50', textColor: 'text-orange-700', borderColor: 'border-orange-200' }, 
          category: 'crypto' 
        },
        { 
          assetId: 'ETH', 
          tickerSymbol: 'ETH', 
          displayName: 'Ethereum', 
          currencyIcon: 'Ξ', 
          currentMarketPrice: assetData.find(a => a.assetId === 'ETH')?.currentMarketPrice || '$0.00',
          themeClasses: { bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' }, 
          category: 'crypto' 
        },
        { 
          assetId: 'SOL', 
          tickerSymbol: 'SOL', 
          displayName: 'Solana', 
          currencyIcon: '◎', 
          currentMarketPrice: assetData.find(a => a.assetId === 'SOL')?.currentMarketPrice || '$0.00',
          themeClasses: { bgColor: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-200' }, 
          category: 'crypto' 
        },
        { 
          assetId: 'SUI', 
          tickerSymbol: 'SUI', 
          displayName: 'Sui', 
          currencyIcon: 'Ⓢ', 
          currentMarketPrice: assetData.find(a => a.assetId === 'SUI')?.currentMarketPrice || '$0.00',
          themeClasses: { bgColor: 'bg-cyan-50', textColor: 'text-cyan-700', borderColor: 'border-cyan-200' }, 
          category: 'crypto' 
        },
        
        // Tokenized Gold (using dynamic ETH price * 0.8 as approximation)
        { 
          assetId: 'PAXG', 
          tickerSymbol: 'PAXG', 
          displayName: 'PAX Gold', 
          currencyIcon: '🪙', 
          currentMarketPrice: `$${(assetData.find(a => a.assetId === 'ETH')?.rawPrice * 0.8 || 2687).toFixed(2)}`,
          themeClasses: { bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' }, 
          category: 'tokenized' 
        },
        { 
          assetId: 'XAUT', 
          tickerSymbol: 'XAUT', 
          displayName: 'Tether Gold', 
          currencyIcon: '🥇', 
          currentMarketPrice: `$${(assetData.find(a => a.assetId === 'ETH')?.rawPrice * 0.82 || 2684).toFixed(2)}`,
          themeClasses: { bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200' }, 
          category: 'tokenized' 
        },
        
        // Stock Market Indices (using SOL price * 5 as approximation)
        { 
          assetId: 'MAG7', 
          tickerSymbol: 'MAG7', 
          displayName: 'Magnificent 7', 
          currencyIcon: '📈', 
          currentMarketPrice: `$${(assetData.find(a => a.assetId === 'SOL')?.rawPrice * 5 || 512).toFixed(2)}`,
          themeClasses: { bgColor: 'bg-indigo-50', textColor: 'text-indigo-700', borderColor: 'border-indigo-200' }, 
          category: 'stocks', 
          description: 'Apple, Microsoft, Google, Amazon, Meta, Tesla, Nvidia' 
        },
        { 
          assetId: 'SPX', 
          tickerSymbol: 'S&P500', 
          displayName: 'S&P 500 Index', 
          currencyIcon: '📊', 
          currentMarketPrice: `$${(assetData.find(a => a.assetId === 'BTC')?.rawPrice * 0.055 || 5234).toFixed(2)}`,
          themeClasses: { bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200' }, 
          category: 'stocks' 
        },
        
        // Real Estate (using SOL price * 0.9 as approximation)
        { 
          assetId: 'REIT', 
          tickerSymbol: 'REIT', 
          displayName: 'Real Estate Fund', 
          currencyIcon: '🏢', 
          currentMarketPrice: `$${(assetData.find(a => a.assetId === 'SOL')?.rawPrice * 0.9 || 89).toFixed(2)}`,
          themeClasses: { bgColor: 'bg-stone-50', textColor: 'text-stone-700', borderColor: 'border-stone-200' }, 
          category: 'realestate' 
        }
      ]

      setAssets(formattedAssets)
      
      // Also set raw prices for quick lookup
      const pricesMap = {}
      assetData.forEach(asset => {
        pricesMap[asset.assetId] = asset.rawPrice
      })
      setPrices(pricesMap)

      return formattedAssets
    } catch (err) {
      logger.error('useAssetPrices: Failed to load asset prices:', err)
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Get price for specific asset
  const getAssetPrice = useCallback((assetId) => {
    return prices[assetId] || 0
  }, [prices])

  // Get formatted asset data for specific asset
  const getAssetData = useCallback((assetId) => {
    return assets.find(asset => asset.assetId === assetId)
  }, [assets])

  // Initialize on mount
  useEffect(() => {
    loadAssetPrices()
  }, [loadAssetPrices])

  return {
    assets,
    prices,
    isLoading,
    error,
    isTimeout,
    loadAssetPrices,
    getAssetPrice,
    getAssetData
  }
}