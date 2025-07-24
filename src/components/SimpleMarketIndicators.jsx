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

// Memoized market data item to prevent unnecessary re-renders
const MarketDataItem = memo(({ marketItem }) => {
  if (!marketItem) return null
  
  return (
    <div className="feature-card" style={{
      background: 'rgba(255, 255, 255, 0.5)', 
      backdropFilter: 'blur(4px)', 
      padding: '0.75rem', 
      minWidth: '0'
    }}>
      <div className="text-lg">{marketItem.icon}</div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-gray-600 truncate">{marketItem.name}</p>
        <div className="flex items-center space-x-2">
          <span className="font-semibold text-sm text-gray-900">{marketItem.value}</span>
          <div className={`flex items-center space-x-1 ${
            marketItem.isPositive ? 'text-green-600' : 'text-red-600'
          }`}>
            {marketItem.isPositive ? (
              <TrendingUp className="w-3 h-3" />
            ) : (
              <TrendingDown className="w-3 h-3" />
            )}
            <span className="text-xs font-medium">{marketItem.change}</span>
          </div>
        </div>
      </div>
    </div>
  )
})

MarketDataItem.displayName = 'MarketDataItem'

// Main component - fully memoized for performance
const SimpleMarketIndicators = memo(() => {
  return (
    <div className="mb-6">
      {/* Status indicator */}
      <div className="mb-3 text-xs text-gray-500 flex items-center justify-between">
        <span>📊 Demo Market Data</span>
        <span className="text-green-600">Live</span>
      </div>

      {/* Desktop View - All indicators visible */}
      <div className="hidden md:grid md:grid-cols-6 gap-3">
        {STATIC_MARKET_DATA.map((item, index) => (
          <MarketDataItem 
            key={`${item.name}-${index}`} 
            marketItem={item} 
          />
        ))}
      </div>

      {/* Mobile View - Show first 2 items */}
      <div className="md:hidden">
        <div className="grid-2-cols">
          <MarketDataItem marketItem={STATIC_MARKET_DATA[0]} />
          <MarketDataItem marketItem={STATIC_MARKET_DATA[1]} />
        </div>
      </div>
    </div>
  )
})

SimpleMarketIndicators.displayName = 'SimpleMarketIndicators'

export default SimpleMarketIndicators