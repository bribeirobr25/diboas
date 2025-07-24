import { useState, useEffect, useMemo, memo } from 'react'
import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react'
import useMarketData from '../hooks/useMarketData.js'

const MarketIndicators = () => {
  const [currentDisplayIndex, setCurrentDisplayIndex] = useState(0)
  const { getMarketSummary, isLoading, error, lastUpdate, refresh } = useMarketData()
  
  // Memoize market data to prevent unnecessary re-computations
  const globalMarketData = useMemo(() => {
    return getMarketSummary()
  }, [getMarketSummary])

  // Auto-rotate market indicators on mobile devices
  useEffect(() => {
    const rotationInterval = setInterval(() => {
      setCurrentDisplayIndex((previousIndex) => (previousIndex + 2) % globalMarketData.length)
    }, 3000)

    return () => clearInterval(rotationInterval)
  }, [globalMarketData.length])

  const MarketDataItem = memo(({ marketItem, showLoading }) => {
    if (!marketItem) return null
    
    return (
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
        {showLoading && (
          <RefreshCw className="w-3 h-3 text-blue-500 animate-spin ml-2" />
        )}
      </div>
    )
  })

  return (
    <div className="mb-6">
      {/* Market Data Status */}
      {error && (
        <div className="mb-3 text-xs text-orange-600 flex items-center">
          <span>📡 Using demo market data</span>
          <button 
            onClick={refresh}
            className="ml-2 text-blue-600 hover:text-blue-800"
          >
            Retry
          </button>
        </div>
      )}
      
      {lastUpdate && !error && (
        <div className="mb-3 text-xs text-gray-500 flex items-center justify-between">
          <span>📊 Live: {new Date(lastUpdate).toLocaleTimeString()}</span>
          <button 
            onClick={refresh}
            disabled={isLoading}
            className="text-blue-600 hover:text-blue-800 disabled:opacity-50"
          >
            {isLoading ? 'Updating...' : 'Refresh'}
          </button>
        </div>
      )}

      {/* Desktop View - All indicators visible */}
      <div className="hidden md:grid md:grid-cols-6 gap-3">
        {globalMarketData.length > 0 ? globalMarketData.map((item) => (
          <MarketDataItem key={item.symbol || item.name} marketItem={item} showLoading={isLoading} />
        )) : (
          // Loading skeleton
          Array.from({ length: 6 }).map((_, index) => (
            <div key={`skeleton-${index}`} className="feature-card animate-pulse" style={{background: 'rgba(255, 255, 255, 0.5)', padding: '0.75rem'}}>
              <div className="w-6 h-6 bg-gray-300 rounded mb-2"></div>
              <div className="h-3 bg-gray-300 rounded mb-1"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
          ))
        )}
      </div>

      {/* Mobile View - Animated carousel showing 2 at a time */}
      <div className="md:hidden">
        {globalMarketData.length > 0 ? (
          <>
            <div className="grid-2-cols">
              <MarketDataItem 
                marketItem={globalMarketData[currentDisplayIndex]} 
                showLoading={isLoading}
              />
              <MarketDataItem 
                marketItem={globalMarketData[(currentDisplayIndex + 1) % globalMarketData.length]} 
                showLoading={isLoading}
              />
            </div>
            
            {/* Dots indicator */}
            <div className="flex justify-center mt-3 space-x-1">
              {Array.from({ length: Math.ceil(globalMarketData.length / 2) }).map((_, index) => (
                <button
                  key={`dot-${index}`}
                  onClick={() => setCurrentDisplayIndex(index * 2)}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    Math.floor(currentDisplayIndex / 2) === index ? 'bg-blue-600' : 'bg-gray-300'
                  }`}
                  aria-label={`View market data ${index + 1}`}
                />
              ))}
            </div>
          </>
        ) : (
          // Mobile loading skeleton
          <div className="grid-2-cols">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={`mobile-skeleton-${index}`} className="feature-card animate-pulse" style={{background: 'rgba(255, 255, 255, 0.5)', padding: '0.75rem'}}>
                <div className="w-6 h-6 bg-gray-300 rounded mb-2"></div>
                <div className="h-3 bg-gray-300 rounded mb-1"></div>
                <div className="h-4 bg-gray-300 rounded w-2/3"></div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MarketIndicators

