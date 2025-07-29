import { memo } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

/**
 * Simplified Market Indicators - High Performance Version
 * Uses static demo data to prevent performance issues
 * Real market data integration removed to improve page performance
 */

// Static market data that doesn't change - prevents re-renders
const STATIC_MARKET_DATA = [
  {
    name: 'BTC',
    value: '$43,250',
    change: '+2.4%',
    isPositive: true,
    icon: '₿'
  },
  {
    name: 'ETH',
    value: '$2,680',
    change: '+1.8%',
    isPositive: true,
    icon: '💎'
  },
  {
    name: 'Stock Market',
    value: '4,785',
    change: '-0.3%',
    isPositive: false,
    icon: '📈'
  },
  {
    name: 'Gold',
    value: '$2,045',
    change: '+0.8%',
    isPositive: true,
    icon: '🥇'
  },
  {
    name: 'DeFi TVL',
    value: '$45.8B',
    change: '+1.7%',
    isPositive: true,
    icon: '🏦'
  },
  {
    name: 'Crypto Market',
    value: '$1.68T',
    change: '+2.8%',
    isPositive: true,
    icon: '💎'
  }
]

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

// Main component - minimalist and smaller design
const SimpleMarketIndicators = memo(() => {
  return (
    <div className="market-indicators-container">
      {/* Status indicator - smaller */}
      <div className="market-indicators-status">
        <span>📊 Demo Market Data</span>
        <span className="market-indicators-status-live">Live</span>
      </div>

      {/* Mobile View - Show all items in horizontal scroll */}
      <div className="market-indicators-mobile">
        <div className="market-indicators-scroll">
          {STATIC_MARKET_DATA.map((item, index) => (
            <MarketDataItem 
              key={`${item.name}-${index}`} 
              marketItem={item} 
            />
          ))}
        </div>
      </div>

      {/* Desktop View - Grid layout with fewer columns */}
      <div className="market-indicators-desktop">
        {STATIC_MARKET_DATA.map((item, index) => (
          <MarketDataItem 
            key={`${item.name}-${index}`} 
            marketItem={item} 
          />
        ))}
      </div>
    </div>
  )
})

SimpleMarketIndicators.displayName = 'SimpleMarketIndicators'

export default SimpleMarketIndicators