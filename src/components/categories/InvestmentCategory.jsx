/**
 * Investment Category Page - Buy/Sell Crypto & Tokenized Assets
 * Handles investment operations with enhanced crypto and tokenized assets
 * Now synchronized with AssetDetailPage data sources
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { dataManager } from '../../services/DataManager.js'
import { assetDataService } from '../../services/assetDataService.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import logger from '../../utils/logger'
import { 
  TrendingUp,
  TrendingDown,
  ArrowLeft,
  Bitcoin,
  DollarSign,
  Coins,
  BarChart3,
  Info,
  Star,
  Zap
} from 'lucide-react'
import PageHeader from '../shared/PageHeader.jsx'

// Investment categories with asset symbols only - data comes from assetDataService
const INVESTMENT_CATEGORIES = {
  crypto: {
    id: 'crypto',
    title: 'Crypto',
    description: 'Digital assets and cryptocurrencies',
    icon: Bitcoin,
    color: 'bg-orange-100 text-orange-800',
    assetSymbols: ['BTC', 'ETH', 'SOL', 'SUI'],
    popularAssets: ['BTC', 'ETH', 'SOL']
  },
  tokenized: {
    id: 'tokenized',
    title: 'Gold',
    description: 'Real-world assets on blockchain',
    icon: Coins,
    color: 'bg-yellow-100 text-yellow-800',
    assetSymbols: ['PAXG', 'XAUT'],
    popularAssets: ['PAXG', 'XAUT']
  },
  stocks: {
    id: 'stocks',
    title: 'Stocks',
    description: 'Tokenized stock market indices',
    icon: TrendingUp,
    color: 'bg-indigo-100 text-indigo-800',
    assetSymbols: ['MAG7', 'SPX'],
    popularAssets: ['MAG7', 'SPX']
  },
  realestate: {
    id: 'realestate',
    title: 'Real Estate',
    description: 'Tokenized real estate funds',
    icon: BarChart3,
    color: 'bg-stone-100 text-stone-800',
    assetSymbols: ['REIT'],
    popularAssets: ['REIT']
  },
  portfolio: {
    id: 'portfolio',
    title: 'Portfolio Management',
    description: 'Manage your investment portfolio',
    icon: BarChart3,
    color: 'bg-green-100 text-green-800'
  }
}

// Investment actions
const INVESTMENT_ACTIONS = {
  buy: {
    id: 'buy',
    title: 'Buy Assets',
    description: 'Purchase crypto and tokenized assets',
    icon: TrendingUp,
    color: 'bg-green-100 text-green-800',
    route: '/category/investment/buy',
    highlighted: true
  },
  sell: {
    id: 'sell',
    title: 'Sell Assets',
    description: 'Convert assets back to USDC',
    icon: TrendingDown,
    color: 'bg-red-100 text-red-800',
    route: '/category/investment/sell',
    highlighted: false
  }
}

export default function InvestmentCategory() {
  const navigate = useNavigate()
  const [selectedCategory, setSelectedCategory] = useState('crypto')
  const [balance, setBalance] = useState(null)
  const [portfolioData, setPortfolioData] = useState({
    totalGainLoss: 0,
    assetsOwned: 0
  })
  const [assetPriceData, setAssetPriceData] = useState({})
  const [loading, setLoading] = useState(true)

  // Get balance and portfolio data from DataManager
  useEffect(() => {
    const currentBalance = dataManager.getBalance()
    setBalance(currentBalance)

    // Calculate portfolio metrics from balance data
    const assetsOwned = currentBalance.assets ? Object.keys(currentBalance.assets).filter(
      asset => currentBalance.assets[asset].investedAmount > 0
    ).length : 0

    // Calculate total gain/loss (mock calculation for now)
    const totalGainLoss = currentBalance.investedAmount ? currentBalance.investedAmount * 0.08 : 0

    setPortfolioData({
      totalGainLoss,
      assetsOwned
    })

    // Subscribe to balance updates
    const unsubscribe = dataManager.subscribe('balance:updated', (updatedBalance) => {
      setBalance(updatedBalance)
      
      const newAssetsOwned = updatedBalance.assets ? Object.keys(updatedBalance.assets).filter(
        asset => updatedBalance.assets[asset].investedAmount > 0
      ).length : 0

      const newTotalGainLoss = updatedBalance.investedAmount ? updatedBalance.investedAmount * 0.08 : 0

      setPortfolioData({
        totalGainLoss: newTotalGainLoss,
        assetsOwned: newAssetsOwned
      })
    })

    return unsubscribe
  }, [])

  // Fetch asset data from assetDataService for current category
  useEffect(() => {
    const fetchAssetData = async () => {
      if (!currentCategory?.assetSymbols) return
      
      setLoading(true)
      try {
        const assetDataPromises = currentCategory.assetSymbols.map(symbol => 
          assetDataService.getCompleteAssetData(symbol)
        )
        const assetDataResults = await Promise.all(assetDataPromises)
        
        const assetDataMap = {}
        assetDataResults.forEach(data => {
          assetDataMap[data.symbol] = data
        })
        
        setAssetPriceData(assetDataMap)
      } catch (error) {
        logger.error('Error fetching asset data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchAssetData()
  }, [selectedCategory])

  // Subscribe to price updates for visible assets
  useEffect(() => {
    if (!currentCategory?.assetSymbols) return
    
    const unsubscribeFunctions = []
    
    currentCategory.assetSymbols.forEach(symbol => {
      const unsubscribe = assetDataService.subscribeToPriceUpdates(symbol, (priceData) => {
        setAssetPriceData(prev => ({
          ...prev,
          [symbol]: {
            ...prev[symbol],
            ...priceData,
            priceFormatted: assetDataService.formatPrice(priceData.price),
            change24hFormatted: assetDataService.formatPercentage(priceData.change24h)
          }
        }))
      })
      unsubscribeFunctions.push(unsubscribe)
    })
    
    return () => {
      unsubscribeFunctions.forEach(unsubscribe => unsubscribe())
    }
  }, [selectedCategory])

  // Get user holdings from balance data
  const userHoldings = balance?.assets || {}

  // Get current category - must be defined before buildAssetList uses it
  const currentCategory = INVESTMENT_CATEGORIES[selectedCategory]

  // Utility function to get holding info for an asset
  const getHoldingInfo = (symbol) => {
    const holding = userHoldings[symbol]
    return {
      quantity: holding?.quantity || 0,
      value: holding?.investedAmount || 0
    }
  }

  // Build asset list from category symbols with real-time data
  const buildAssetList = useCallback(() => {
    if (!currentCategory?.assetSymbols) return []
    
    return currentCategory.assetSymbols.map(symbol => {
      const assetData = assetPriceData[symbol]
      const userHolding = getHoldingInfo(symbol)
      
      return {
        symbol,
        name: assetData?.name || symbol,
        price: assetData?.priceFormatted || '$0.00',
        change: assetData?.change24hFormatted || '+0.00%',
        trend: assetData?.trend || 'up',
        popular: currentCategory.popularAssets?.includes(symbol) || false,
        description: assetData?.description || '',
        userQuantity: userHolding.quantity,
        userValue: userHolding.value
      }
    })
  }, [currentCategory, assetPriceData, userHoldings])

  const handleActionClick = (action) => {
    navigate(action.route)
  }

  const handleAssetClick = (asset) => {
    navigate(`/asset/${asset.symbol}`)
  }

  const handleBuyClick = (asset, e) => {
    e.stopPropagation()
    navigate(`/category/investment/buy?asset=${asset.symbol}`)
  }

  const handleSellClick = (asset, e) => {
    e.stopPropagation()
    navigate(`/category/investment/sell?asset=${asset.symbol}`)
  }

  const handleBackClick = () => {
    navigate('/app')
  }

  // Generate asset list with real-time data
  const assetList = buildAssetList()
  
  // Sort assets: user holdings first (by value desc), then non-holdings
  const sortedAssets = [...assetList].sort((a, b) => {
    const aHasHoldings = a.userQuantity > 0
    const bHasHoldings = b.userQuantity > 0
    
    if (aHasHoldings && !bHasHoldings) return -1
    if (!aHasHoldings && bHasHoldings) return 1
    if (aHasHoldings && bHasHoldings) return b.userValue - a.userValue
    return 0
  })

  return (
    <div className="main-layout">
      <PageHeader showUserActions={true} />
      
      <div className="page-container">
        {/* Breadcrumb Navigation */}
        <div className="investment-category__breadcrumb mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBackClick}
            className="investment-category__back-button p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Category Header with Background Image */}
        <div className="investment-category__header-with-bg">
          <div 
            className="investment-category__header-bg"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=300&fit=crop&crop=center)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '1rem',
              position: 'relative',
              padding: '2rem',
              marginBottom: '2rem',
              color: 'white'
            }}
          >
            <div 
              className="investment-category__header-overlay"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(34, 197, 94, 0.9), rgba(22, 163, 74, 0.8))',
                borderRadius: '1rem'
              }}
            ></div>
            
            <div className="investment-category__header-content" style={{ position: 'relative', zIndex: 1 }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="investment-category__icon p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <TrendingUp className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="investment-category__title text-3xl font-bold text-white">
                    Buy/Sell
                  </h1>
                  <p className="investment-category__subtitle text-lg text-white/90">
                    Investment & Trading
                  </p>
                </div>
              </div>
              
              <p className="investment-category__description text-white/80 max-w-2xl">
                Build your portfolio with cryptocurrencies and tokenized real-world assets. 
                Trade with confidence using our secure and low-fee platform.
              </p>
            </div>
          </div>
        </div>

        {/* Investment Overview Card - Minimalist Single Card */}
        <div className="investment-category__overview mb-8">
          <Card className="investment-overview-card">
            <CardHeader>
              <CardTitle className="investment-overview-title">Investment Overview</CardTitle>
              <CardDescription>Your current investment portfolio at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="investment-overview-grid">
                <div className="investment-overview-item">
                  <div className="investment-overview-icon">
                    <BarChart3 className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="investment-overview-content">
                    <p className="investment-overview-label">Invested Balance</p>
                    <p className="investment-overview-value text-green-600">
                      ${balance?.investedAmount?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
                
                <div className="investment-overview-divider"></div>
                
                <div className="investment-overview-item">
                  <div className="investment-overview-icon">
                    <TrendingUp className={`w-5 h-5 ${portfolioData.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="investment-overview-content">
                    <p className="investment-overview-label">Total Gain/Loss</p>
                    <p className={`investment-overview-value ${portfolioData.totalGainLoss >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {portfolioData.totalGainLoss >= 0 ? '+' : ''}${portfolioData.totalGainLoss.toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="investment-overview-divider"></div>
                
                <div className="investment-overview-item">
                  <div className="investment-overview-icon">
                    <Coins className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="investment-overview-content">
                    <p className="investment-overview-label">Assets Owned</p>
                    <p className="investment-overview-value text-gray-900">{portfolioData.assetsOwned}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Investment Actions - REMOVED as requested */}

        {/* Asset Categories */}
        <div className="investment-category__categories mb-8">
          <h2 className="investment-category__categories-title text-xl font-semibold text-gray-900 mb-4">
            Browse Assets
          </h2>
          
          {/* Category Tabs */}
          <div className="investment-category__tabs flex gap-2 mb-6">
            {Object.values(INVESTMENT_CATEGORIES).map((category) => {
              const IconComponent = category.icon
              return (
                <Button
                  key={category.id}
                  variant={selectedCategory === category.id ? "default" : "outline"}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`investment-category__tab flex items-center gap-2 ${
                    selectedCategory === category.id ? 'bg-blue-600 text-white' : ''
                  }`}
                >
                  <IconComponent className="w-4 h-4" />
                  {category.title}
                </Button>
              )
            })}
          </div>

          {/* Asset Grid */}
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading assets...</span>
            </div>
          ) : sortedAssets.length > 0 ? (
            <div className="asset-list-container">
              <div className="asset-grid">
                {sortedAssets.map((asset) => {
                  const hasHoldings = asset.userQuantity > 0
                  
                  return (
                    <Card 
                      key={asset.symbol}
                      className={`asset-card ${hasHoldings ? 'asset-card--owned bg-green-50 border-green-200' : 'hover:shadow-md transition-shadow'}`}
                      onClick={() => handleAssetClick(asset)}
                    >
                      <div className="asset-card-header">
                        <div className="asset-info">
                          <div className="asset-icon">
                            <span className={hasHoldings ? 'text-green-700 font-semibold' : ''}>{asset.symbol}</span>
                          </div>
                          <div className="asset-name-container">
                            <h3 className={`asset-name ${hasHoldings ? 'text-green-800' : ''}`}>
                              {asset.name}
                              {asset.popular && (
                                <Star className="w-4 h-4 text-yellow-500 inline ml-1" />
                              )}
                            </h3>
                            <p className="asset-symbol-quantity">
                              {asset.symbol} • {asset.userQuantity.toFixed(asset.userQuantity >= 1 ? 2 : 6)}
                            </p>
                          </div>
                        </div>
                        
                        <div className="asset-values">
                          <p className={`asset-price ${hasHoldings ? 'text-green-700 font-semibold' : ''}`}>{asset.price}</p>
                          <p className="asset-user-value text-sm text-gray-600">
                            ${asset.userValue.toFixed(2)}
                          </p>
                        </div>
                      </div>
                      
                      {asset.description && (
                        <p className="text-xs text-gray-500 mb-3">
                          {asset.description}
                        </p>
                      )}
                      
                      <div className="asset-card-footer">
                        <div className={`asset-change ${
                          asset.trend === 'up' ? 'asset-change--positive text-green-600' : 'asset-change--negative text-red-600'
                        } flex items-center gap-1`}>
                          {asset.trend === 'up' ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          <span className="text-sm">{asset.change}</span>
                        </div>
                        
                        <div className="flex gap-2">
                          {hasHoldings && (
                            <Button 
                              variant="outline"
                              size="sm"
                              className="asset-sell-button border-red-200 text-red-700 hover:bg-red-50"
                              onClick={(e) => handleSellClick(asset, e)}
                            >
                              Sell
                            </Button>
                          )}
                          <Button 
                            size="sm"
                            className={`asset-buy-button ${hasHoldings ? 'bg-green-600 hover:bg-green-700' : ''}`}
                            onClick={(e) => handleBuyClick(asset, e)}
                          >
                            Buy
                          </Button>
                        </div>
                      </div>
                    </Card>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No assets available in this category</p>
            </div>
          )}
        </div>

        {/* Educational Tips */}
        <div className="investment-category__tips">
          <Card className="investment-category__tips-card bg-green-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-green-600 mt-1" />
                <div>
                  <h3 className="investment-category__tips-title text-lg font-semibold text-green-900 mb-2">
                    Investment Tips
                  </h3>
                  <div className="investment-category__tips-content space-y-2">
                    <p className="text-green-800 text-sm">
                      • <strong>Start Small:</strong> Begin with small amounts to understand market dynamics
                    </p>
                    <p className="text-green-800 text-sm">
                      • <strong>Diversify:</strong> Spread your investments across different asset types
                    </p>
                    <p className="text-green-800 text-sm">
                      • <strong>Tokenized Assets:</strong> PAXG and XAUT offer exposure to gold without physical storage
                    </p>
                    <p className="text-green-800 text-sm">
                      • <strong>Dollar-Cost Averaging:</strong> Consider regular small purchases to reduce volatility impact
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Export configurations for use in other components
export { INVESTMENT_CATEGORIES, INVESTMENT_ACTIONS }