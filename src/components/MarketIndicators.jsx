import { useState, useEffect } from 'react'
import { TrendingUp, TrendingDown } from 'lucide-react'

const MarketIndicators = () => {
  const [currentDisplayIndex, setCurrentDisplayIndex] = useState(0)

  const globalMarketData = [
    {
      name: 'Gold',
      value: '$2,045.30',
      change: '+1.2%',
      isPositive: true,
      icon: '🥇'
    },
    {
      name: 'Stock Market',
      value: '4,785.20',
      change: '-0.3%',
      isPositive: false,
      icon: '📈'
    },
    {
      name: 'Crypto Market Cap',
      value: '$1.68T',
      change: '+2.8%',
      isPositive: true,
      icon: '💎'
    },
    {
      name: 'Crypto 24h Vol',
      value: '$89.2B',
      change: '+5.4%',
      isPositive: true,
      icon: '📊'
    },
    {
      name: 'BTC',
      value: '$43,250.00',
      change: '+2.4%',
      isPositive: true,
      icon: '₿'
    },
    {
      name: 'DeFi TVL',
      value: '$45.8B',
      change: '+1.7%',
      isPositive: true,
      icon: '🏦'
    }
  ]

  // Auto-rotate market indicators on mobile devices
  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setCurrentDisplayIndex((previousIndex) => (previousIndex + 2) % globalMarketData.length)
    }, 3000)

    return () => clearInterval(rotationInterval)
  }, [globalMarketData.length])

  const MarketDataItem = ({ marketItem }) => (
    <div className="feature-card" style={{background: 'rgba(255, 255, 255, 0.5)', backdropFilter: 'blur(4px)', padding: '0.75rem', minWidth: '0'}}>
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

  return (
    <div className="mb-6">
      {/* Desktop View - All indicators visible */}
      <div className="hidden md:grid md:grid-cols-6 gap-3">
        {globalMarketData.map((item, index) => (
          <MarketDataItem key={index} marketItem={item} />
        ))}
      </div>

      {/* Mobile View - Animated carousel showing 2 at a time */}
      <div className="md:hidden">
        <div className="grid-2-cols">
          <MarketDataItem marketItem={globalMarketData[currentDisplayIndex]} />
          <MarketDataItem marketItem={globalMarketData[(currentDisplayIndex + 1) % globalMarketData.length]} />
        </div>
        
        {/* Dots indicator */}
        <div className="flex justify-center mt-3 space-x-1">
          {Array.from({ length: Math.ceil(globalMarketData.length / 2) }).map((_, index) => (
            <div
              key={index}
              className={`w-2 h-2 rounded-full transition-colors ${
                Math.floor(currentDisplayIndex / 2) === index ? 'bg-blue-600' : 'bg-gray-300'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

export default MarketIndicators

