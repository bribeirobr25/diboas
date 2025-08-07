import { memo } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'
import { useMarketIndicators } from '../hooks/useMarketIndicators.jsx'

/**
 * Simplified Market Indicators - Now with Real-time Data
 * Uses MockupMarketIndicatorProviderService for dynamic market data
 * Maintains high performance with intelligent caching and memoization
 */

// Minimalist market data item
const MarketDataItem = memo(({ marketItem }) => {
  if (!marketItem) return null
  
  return (
    <div className="market-indicator-compact">
      <div className="market-indicator-icon">{marketItem.icon}</div>
      <div className="market-indicator-content">
        <p className="market-indicator-name">{marketItem.name}</p>
        <div className="market-indicator-values">
          <span className="market-indicator-price">{marketItem.value}</span>
          <div className={`market-indicator-change ${
            marketItem.isPositive ? 'market-indicator-change--positive' : 'market-indicator-change--negative'
          }`}>
            {marketItem.isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span className="market-indicator-change-text">{marketItem.change}</span>
          </div>
        </div>
      </div>
    </div>
  )
})

MarketDataItem.displayName = 'MarketDataItem'

// Main component - now with real-time data
const SimpleMarketIndicators = memo(() => {
  const { 
    marketData, 
    isLoading, 
    error, 
    lastUpdated 
  } = useMarketIndicators(true, 30000) // Auto-refresh every 30 seconds

  // Show loading state
  if (isLoading && marketData.length === 0) {
    return (
      <div className="market-indicators-container">
        <div className="market-indicators-status">
          <span>📊 Loading Market Data...</span>
        </div>
      </div>
    )
  }

  // Show error state with fallback
  const displayData = error && marketData.length === 0 ? 
    [{ name: 'Market Data', value: 'Unavailable', change: '--', isPositive: true, icon: '📊' }] : 
    marketData

  return (
    <div className="market-indicators-container">
      {/* Status indicator - dynamic */}
      <div className="market-indicators-status">
        <span>📊 {error ? 'Demo' : 'Live'} Market Data</span>
        <span className={`market-indicators-status-live ${error ? 'market-indicators-status-error' : ''}`}>
          {isLoading ? 'Updating...' : error ? 'Fallback' : 'Live'}
        </span>
      </div>

      {/* Mobile View - Show all items in horizontal scroll */}
      <div className="market-indicators-mobile">
        <div className="market-indicators-scroll">
          {displayData.map((item, index) => (
            <MarketDataItem 
              key={`${item.name}-${item.symbol || index}`} 
              marketItem={item} 
            />
          ))}
        </div>
      </div>

      {/* Desktop View - Grid layout with fewer columns */}
      <div className="market-indicators-desktop">
        {displayData.map((item, index) => (
          <MarketDataItem 
            key={`${item.name}-${item.symbol || index}`} 
            marketItem={item} 
          />
        ))}
      </div>
    </div>
  )
})

SimpleMarketIndicators.displayName = 'SimpleMarketIndicators'

export default SimpleMarketIndicators