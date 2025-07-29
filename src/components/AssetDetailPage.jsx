import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  Activity,
  Info,
  Globe,
  FileText,
  ExternalLink,
  RefreshCw
} from 'lucide-react'
import PageHeader from './shared/PageHeader.jsx'
import { assetDataService } from '../services/assetDataService.js'
import { dataManager } from '../services/DataManager.js'

export default function AssetDetailPage() {
  const { symbol } = useParams()
  const navigate = useNavigate()
  const [activeTab, setActiveTab] = useState('overview')
  const [assetData, setAssetData] = useState(null)
  const [userHoldings, setUserHoldings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdate, setLastUpdate] = useState(null)
  const [refreshing, setRefreshing] = useState(false)
  
  // Fetch asset data and subscribe to updates
  useEffect(() => {
    if (!symbol) {
      navigate('/category/investment')
      return
    }

    let unsubscribePriceUpdates = null
    let unsubscribeBalanceUpdates = null

    const loadAssetData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch complete asset data
        const data = await assetDataService.getCompleteAssetData(symbol.toUpperCase())
        setAssetData(data)
        setLastUpdate(new Date())

        // Subscribe to price updates
        unsubscribePriceUpdates = assetDataService.subscribeToPriceUpdates(
          symbol.toUpperCase(),
          (priceUpdate) => {
            setAssetData(prev => ({
              ...prev,
              ...priceUpdate,
              priceFormatted: assetDataService.formatPrice(priceUpdate.price),
              change24hFormatted: assetDataService.formatPercentage(priceUpdate.change24h),
              changeAmountFormatted: assetDataService.formatPrice(Math.abs(priceUpdate.changeAmount))
            }))
            setLastUpdate(new Date())
          }
        )

        setLoading(false)
      } catch (err) {
        console.error('Error loading asset data:', err)
        setError(err.message || 'Failed to load asset data')
        setLoading(false)
        
        // Navigate back if asset not found
        if (err.message?.includes('not found')) {
          setTimeout(() => navigate('/category/investment'), 2000)
        }
      }
    }

    const loadUserHoldings = () => {
      // Get balance data from DataManager
      const balance = dataManager.getBalance()
      const assetSymbol = symbol.toUpperCase()
      
      if (balance.assets && balance.assets[assetSymbol]) {
        const assetBalance = balance.assets[assetSymbol]
        const quantity = assetBalance.quantity || 0
        const investedAmount = assetBalance.investedAmount || 0
        
        // Calculate average buy price and current value
        const avgBuyPrice = quantity > 0 ? investedAmount / quantity : 0
        const currentValue = assetData ? quantity * assetData.price : investedAmount
        
        setUserHoldings({
          quantity,
          currentValue,
          avgBuyPrice,
          investedAmount,
          hasHoldings: quantity > 0
        })
      } else {
        setUserHoldings({
          quantity: 0,
          currentValue: 0,
          avgBuyPrice: 0,
          investedAmount: 0,
          hasHoldings: false
        })
      }
    }

    // Subscribe to balance updates
    const handleBalanceUpdate = () => {
      loadUserHoldings()
    }

    const unsubscribeBalance = dataManager.subscribe('balance:updated', handleBalanceUpdate)
    const unsubscribeAssets = dataManager.subscribe('assets:updated', handleBalanceUpdate)
    
    unsubscribeBalanceUpdates = () => {
      unsubscribeBalance()
      unsubscribeAssets()
    }

    // Load initial data
    loadAssetData().then(() => {
      loadUserHoldings()
    })

    // Cleanup subscriptions
    return () => {
      if (unsubscribePriceUpdates) {
        unsubscribePriceUpdates()
      }
      if (unsubscribeBalanceUpdates) {
        unsubscribeBalanceUpdates()
      }
    }
  }, [symbol, navigate])

  // Update user holdings when asset data changes
  useEffect(() => {
    if (assetData && userHoldings) {
      const currentValue = userHoldings.quantity * assetData.price
      setUserHoldings(prev => ({
        ...prev,
        currentValue
      }))
    }
  }, [assetData?.price])

  const handleBuyClick = () => {
    navigate(`/category/investment/buy?asset=${symbol}`)
  }

  const handleSellClick = () => {
    navigate(`/category/investment/sell?asset=${symbol}`)
  }

  const handleBackClick = () => {
    navigate('/category/investment')
  }

  const handleRefreshPrice = async () => {
    if (!symbol || refreshing) return
    
    setRefreshing(true)
    try {
      // Clear cache to force fresh data
      assetDataService.clearCache()
      
      // Get fresh price data
      const freshPrice = await assetDataService.getAssetPrice(symbol.toUpperCase())
      
      setAssetData(prev => ({
        ...prev,
        ...freshPrice,
        priceFormatted: assetDataService.formatPrice(freshPrice.price),
        change24hFormatted: assetDataService.formatPercentage(freshPrice.change24h),
        changeAmountFormatted: assetDataService.formatPrice(Math.abs(freshPrice.changeAmount))
      }))
      setLastUpdate(new Date())
    } catch (error) {
      console.error('Error refreshing price:', error)
    } finally {
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="page-container">
        <PageHeader />
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <p className="mt-2 text-gray-600">Loading asset data...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="page-container">
        <PageHeader />
        <Card className="mt-8">
          <CardContent className="pt-6">
            <div className="text-center">
              <p className="text-red-600 mb-4">{error}</p>
              <Button onClick={handleBackClick}>Back to Investments</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!assetData) {
    return null
  }

  return (
    <div className="page-container">
      <PageHeader />
      
      {/* Breadcrumb Navigation */}
      <div className="mb-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={handleBackClick}
          className="p-2 hover:bg-gray-100"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Investments
        </Button>
      </div>

      {/* Asset Header */}
      <div className="asset-header mb-8">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-4">
            <div className="asset-icon-large">
              <span className="text-4xl">{assetData.icon}</span>
            </div>
            <div>
              <h1 className="text-3xl font-bold">{assetData.name}</h1>
              <p className="text-gray-600 text-lg">{assetData.symbol}</p>
            </div>
          </div>
          
          <div className="text-right">
            <div className="text-3xl font-bold mb-1">
              {assetData.priceFormatted}
            </div>
            <div className={`flex items-center justify-end gap-2 ${
              assetData.trend === 'up' ? 'text-green-600' : 'text-red-600'
            }`}>
              {assetData.trend === 'up' ? (
                <TrendingUp className="w-5 h-5" />
              ) : (
                <TrendingDown className="w-5 h-5" />
              )}
              <span className="font-medium">
                {assetData.change24hFormatted} ({assetData.changeAmountFormatted})
              </span>
            </div>
            {lastUpdate && (
              <div className="text-xs text-gray-500 mt-1 flex items-center gap-2">
                <span>Updated: {lastUpdate.toLocaleTimeString()}</span>
                <button
                  onClick={handleRefreshPrice}
                  disabled={refreshing}
                  className="text-blue-600 hover:text-blue-800 disabled:opacity-50 transition-colors"
                  title="Refresh price data"
                >
                  <RefreshCw className={`w-3 h-3 ${refreshing ? 'animate-spin' : ''}`} />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* User Holdings Card */}
      {userHoldings && userHoldings.hasHoldings && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Your Holdings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-gray-600">Quantity</p>
                <p className="font-semibold">{userHoldings.quantity.toFixed(6)} {assetData.symbol}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Value</p>
                <p className="font-semibold">${userHoldings.currentValue.toFixed(2)}</p>
              </div>
              {userHoldings.avgBuyPrice > 0 && (
                <div>
                  <p className="text-sm text-gray-600">Avg Buy Price</p>
                  <p className="font-semibold">${userHoldings.avgBuyPrice.toFixed(2)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="chart">Chart</TabsTrigger>
          <TabsTrigger value="info">Info</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-6">
          <div className="space-y-6">
            {/* Description */}
            <Card>
              <CardHeader>
                <CardTitle>About {assetData.name}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-700">{assetData.description}</p>
              </CardContent>
            </Card>

            {/* Market Statistics - Single Card */}
            <Card>
              <CardHeader>
                <CardTitle>Market Statistics</CardTitle>
                <CardDescription>Key metrics and market data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Market Cap</p>
                    <p className="font-semibold text-lg">{assetData.marketCapFormatted}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">24h Volume</p>
                    <p className="font-semibold text-lg">{assetData.volume24hFormatted}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Rank</p>
                    <p className="font-semibold text-lg">#{assetData.rank}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Supply</p>
                    <p className="font-semibold text-lg">{assetData.supply}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="chart" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Price Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center bg-gray-50 rounded-lg">
                <div className="text-center">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                  <p className="text-gray-600 font-medium">Chart Coming Soon</p>
                  <p className="text-sm text-gray-500 mt-1">
                    Price charts will be available in the next update
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="info" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Asset Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {assetData.website && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-700">
                    <Globe className="w-4 h-4" />
                    Website
                  </span>
                  <a 
                    href={assetData.website} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    Visit <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
              
              {assetData.whitepaper && (
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-gray-700">
                    <FileText className="w-4 h-4" />
                    Whitepaper
                  </span>
                  <a 
                    href={assetData.whitepaper} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-blue-600 hover:text-blue-800"
                  >
                    View <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}

              <div className="flex items-center justify-between">
                <span className="flex items-center gap-2 text-gray-700">
                  <Info className="w-4 h-4" />
                  Blockchain
                </span>
                <Badge variant="secondary">{assetData.chain}</Badge>
              </div>

              {assetData.contractAddress && (
                <div>
                  <span className="flex items-center gap-2 text-gray-700 mb-2">
                    <FileText className="w-4 h-4" />
                    Contract Address
                  </span>
                  <code className="text-xs bg-gray-100 p-2 rounded block break-all">
                    {assetData.contractAddress}
                  </code>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Action Buttons */}
      <div className="flex gap-4">
        <Button 
          variant="cta" 
          size="lg" 
          className="flex-1"
          onClick={handleBuyClick}
        >
          Buy {assetData.symbol}
        </Button>
        {userHoldings?.hasHoldings && (
          <Button 
            variant="outline" 
            size="lg" 
            className="flex-1"
            onClick={handleSellClick}
          >
            Sell {assetData.symbol}
          </Button>
        )}
      </div>
    </div>
  )
}