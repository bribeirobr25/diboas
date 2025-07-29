import { useState, useMemo, useCallback, memo, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { LoadingSpinner } from '@/components/ui/loading-spinner.jsx'
import { SkeletonBalance, SkeletonTransaction } from '@/components/ui/skeleton.jsx'
import { 
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  DollarSign,
  PieChart,
  Send,
  Wallet,
  Eye,
  EyeOff,
  Plus,
  ArrowRight,
  Zap,
  Shield,
  Globe,
  ArrowRightLeft
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SimpleMarketIndicators from './SimpleMarketIndicators.jsx'
import PageHeader from './shared/PageHeader.jsx'
import CategoryDashboard from './categories/CategoryDashboard.jsx'
import { QUICK_ACTIONS, createTransactionNavigator } from '../utils/navigationHelpers.js'
import { useWalletBalance } from '../hooks/useTransactions.jsx'
import { useDataManagerSubscription, useSafeDataManager } from '../hooks/useDataManagerSubscription.js'
import { useDashboardTransactionDisplay } from '../hooks/useTransactionDisplay.js'
import { useUserSettings } from '../utils/userSettings.js'
import { useFeatureFlag } from '../config/featureFlags.js'

// PERFORMANCE: Memoized transaction item component with semantic naming
const DashboardTransactionItem = memo(({ transactionDisplayData, onTransactionClick }) => (
  <div 
    key={transactionDisplayData.id}
    className="transaction-item interactive-card"
    onClick={() => onTransactionClick(transactionDisplayData.id)}
  >
    <div className="transaction-item__content">
      <div className="transaction-item__icon-container">
        {transactionDisplayData.icon}
      </div>
      <div className="transaction-item__details">
        <p className="transaction-item__description">{transactionDisplayData.description || transactionDisplayData.humanReadableDescription}</p>
        <p className="transaction-item__meta">{transactionDisplayData.time || transactionDisplayData.relativeTimeDisplay}</p>
      </div>
    </div>
    <span className={`transaction-item__amount ${
      transactionDisplayData.type === 'received' ? 'transaction-item__amount--positive' : 'transaction-item__amount--negative'
    }`}>
      {transactionDisplayData.amount || transactionDisplayData.formattedAmount}
    </span>
  </div>
))

// PERFORMANCE: Memoized portfolio asset component with semantic naming
const DashboardPortfolioAssetItem = memo(({ portfolioAssetData }) => (
  <div className="portfolio-asset-card">
    <div className="portfolio-asset__header">
      <div className="flex-start gap-sm">
        <div className={`w-3 h-3 rounded-full ${portfolioAssetData.colorClass}`}></div>
        <span className="portfolio-asset__name">{portfolioAssetData.assetName}</span>
      </div>
      <div className="text-right">
        <div className="portfolio-asset__value">{portfolioAssetData.formattedAmount}</div>
        <div className="portfolio-asset__change">{portfolioAssetData.percentageValue}%</div>
      </div>
    </div>
  </div>
))

export default function AppDashboard() {
  const navigate = useNavigate()
  const [isBalanceVisible, setIsBalanceVisible] = useState(true)
  const { settings } = useUserSettings()
  const isCategoriesEnabled = useFeatureFlag('CATEGORIES_NAVIGATION')
  
  // Get real wallet balance with semantic destructuring
  const { balance: currentWalletBalance, getBalance: refreshWalletBalance, isLoading: isWalletBalanceLoading } = useWalletBalance()
  
  // Refresh balance when component mounts and periodically
  useEffect(() => {
    refreshWalletBalance(true) // Force refresh on dashboard mount
  }, [refreshWalletBalance])
  
  // MEMORY SAFE: Use safe DataManager access with semantic naming
  const { getTransactions: retrieveAllTransactionsFromDataManager } = useSafeDataManager()
  
  // PERFORMANCE: Memoized recent transaction history getter
  const loadRecentTransactionHistory = useCallback(() => {
    const allUserTransactions = retrieveAllTransactionsFromDataManager()
    console.log('📖 Getting recent transaction history from DataManager:', allUserTransactions.length, 'total transactions')
    return allUserTransactions.slice(0, 5) // Get last 5 transactions for dashboard
  }, [retrieveAllTransactionsFromDataManager])
  
  const [dashboardTransactionHistory, setDashboardTransactionHistory] = useState([])
  const [isTransactionHistoryLoading, setIsTransactionHistoryLoading] = useState(true)
  
  // Use shared transaction display logic
  const dashboardTransactionDisplayList = useDashboardTransactionDisplay(dashboardTransactionHistory)
  
  // PERFORMANCE: Debounced transaction update to prevent rapid re-renders
  const updateDashboardTransactionsDebounced = useCallback(() => {
    const timeoutId = setTimeout(() => {
      const updatedTransactionHistory = loadRecentTransactionHistory()
      console.log('📚 Updated dashboard transaction history (debounced):', updatedTransactionHistory)
      setDashboardTransactionHistory(updatedTransactionHistory)
      refreshWalletBalance(true)
    }, 100) // 100ms debounce
    
    return () => clearTimeout(timeoutId)
  }, [loadRecentTransactionHistory, refreshWalletBalance])
  
  // MEMORY SAFE: Use safe DataManager subscriptions with semantic event handling
  useDataManagerSubscription('transaction:added', (newTransactionData) => {
    console.log('🔔 DataManager transaction added event received:', newTransactionData)
    updateDashboardTransactionsDebounced()
  }, [updateDashboardTransactionsDebounced])
  
  useDataManagerSubscription('transaction:completed', ({ transaction: completedTransactionData }) => {
    console.log('🔔 DataManager transaction completed event received:', completedTransactionData)
    updateDashboardTransactionsDebounced()
  }, [updateDashboardTransactionsDebounced])
  
  useEffect(() => {
    // Set initial dashboard transaction history with loading state
    setIsTransactionHistoryLoading(true)
    const initialTransactionHistory = loadRecentTransactionHistory()
    setDashboardTransactionHistory(initialTransactionHistory)
    setIsTransactionHistoryLoading(false)
    
    // Also listen for custom events (for backward compatibility)
    const handleCustomTransactionCompletedEvent = (customEvent) => {
      console.log('🔔 Custom transaction completed event received:', customEvent.detail)
      updateDashboardTransactionsDebounced()
    }
    
    window.addEventListener('diboas-transaction-completed', handleCustomTransactionCompletedEvent)
    
    return () => {
      window.removeEventListener('diboas-transaction-completed', handleCustomTransactionCompletedEvent)
    }
  }, [loadRecentTransactionHistory, updateDashboardTransactionsDebounced])
  
  // PERFORMANCE: Memoized transaction type navigation function
  const navigateToTransactionType = useMemo(() => createTransactionNavigator(navigate), [navigate])
  const navigateToTransactionDetails = useCallback((transactionId) => {
    navigate(`/transaction?id=${transactionId}`)
  }, [navigate])
  
  // Balance visibility toggle - using inline handler for better performance

  // PERFORMANCE: Memoized transaction display helper functions
  const generateTransactionIconElement = useCallback((transactionType, paymentMethod) => {
    // Check if it's an exchange transaction (buy on-chain or sell)
    if (transactionType === 'buy' && paymentMethod === 'diboas_wallet') {
      return <ArrowRightLeft className="w-4 h-4 text-blue-600" />
    }
    
    if (transactionType === 'sell') {
      return <ArrowRightLeft className="w-4 h-4 text-blue-600" /> // Exchange icon for sell
    }
    
    switch (transactionType) {
      case 'add':
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />
      case 'send':
        return <Send className="w-4 h-4 text-blue-600" />
      case 'withdraw':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />
      case 'buy':
        return <TrendingUp className="w-4 h-4 text-green-600" /> // Green for on-ramp buy
      case 'exchange_send':
        return <Send className="w-4 h-4 text-orange-600" />
      case 'exchange_receive':
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />
    }
  }, [])
  
  

  // Enhanced transaction display list with icon support and empty state handling
  const enhancedTransactionDisplayList = useMemo(() => {
    if (!dashboardTransactionHistory.length) {
      return [{
        id: 'empty-state',
        type: 'sent',
        description: 'No recent transactions',
        formattedAmount: '$0.00',
        relativeTimeDisplay: '',
        icon: <DollarSign className="w-4 h-4 text-gray-400" />
      }]
    }
    
    return dashboardTransactionDisplayList.map(transactionData => ({
      ...transactionData,
      icon: generateTransactionIconElement(
        transactionData.transactionCategory || transactionData.type, 
        transactionData.paymentMethod
      )
    }))
  }, [dashboardTransactionDisplayList, generateTransactionIconElement])

  // PERFORMANCE: Memoize portfolio assets data based on real wallet balance
  const dashboardPortfolioAssetsData = useMemo(() => {
    const availableBalance = currentWalletBalance?.availableForSpending || 0
    const investedBalance = currentWalletBalance?.investedAmount || 0
    const totalBalance = availableBalance + investedBalance
    
    if (totalBalance === 0) {
      return [
        { assetName: 'Traditional', percentageValue: 0, formattedAmount: '$0.00', colorClass: 'bg-blue-500' },
        { assetName: 'Crypto', percentageValue: 0, formattedAmount: '$0.00', colorClass: 'bg-purple-500' },
        { assetName: 'DeFi', percentageValue: 0, formattedAmount: '$0.00', colorClass: 'bg-green-500' }
      ]
    }
    
    const availablePercentage = Math.round((availableBalance / totalBalance) * 100)
    const investedPercentage = Math.round((investedBalance / totalBalance) * 100)
    
    return [
      { 
        assetName: 'Available', 
        percentageValue: availablePercentage, 
        formattedAmount: `$${availableBalance.toFixed(2)}`, 
        colorClass: 'bg-green-500' 
      },
      { 
        assetName: 'Invested', 
        percentageValue: investedPercentage, 
        formattedAmount: `$${investedBalance.toFixed(2)}`, 
        colorClass: 'bg-blue-500' 
      },
      { 
        assetName: 'Reserved', 
        percentageValue: 100 - availablePercentage - investedPercentage, 
        formattedAmount: '$0.00', 
        colorClass: 'bg-gray-500' 
      }
    ]
  }, [currentWalletBalance])

  // PERFORMANCE: Memoize total balance calculation (unused but kept for future use)
  // eslint-disable-next-line no-unused-vars
  const calculatedTotalBalance = useMemo(() => {
    if (!currentWalletBalance) return 0
    return (currentWalletBalance.availableForSpending || 0) + (currentWalletBalance.investedAmount || 0)
  }, [currentWalletBalance])

  return (
    <div className="main-layout">
      <PageHeader showUserActions={true} />

      <div className="page-container">
        {/* Welcome Section with Market Indicators */}
        <div className="content-section">
          <h1 className="page-title">
            Good morning, John! 👋
          </h1>
          <SimpleMarketIndicators />
        </div>

        {/* Minimalist Balance Card */}
        <Card className="compact-balance-card interactive-card" onClick={() => navigate('/account')}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="balance-label">Total Balance</p>
                <div className="balance-display-compact">
                  {isWalletBalanceLoading ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" variant="white" />
                      <SkeletonBalance className="bg-white/20" />
                    </div>
                  ) : (
                    <h2 className="balance-amount-compact">
                      {isBalanceVisible ? 
                        `$${currentWalletBalance?.totalUSD?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}` : 
                        '••••••••'
                      }
                    </h2>
                  )}
                </div>
              </div>
              
              <div className="balance-breakdown">
                <div className="balance-item">
                  <span className="balance-item-label">Available</span>
                  <span className="balance-item-value">
                    {isWalletBalanceLoading ? '...' : (isBalanceVisible ? 
                      `$${currentWalletBalance?.availableForSpending?.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 }) || '0'}` : 
                      '••••'
                    )}
                  </span>
                </div>
                <div className="balance-item">
                  <span className="balance-item-label">Invested</span>
                  <span className="balance-item-value">
                    {isWalletBalanceLoading ? '...' : (isBalanceVisible ? 
                      `$${(currentWalletBalance?.investedAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}` : 
                      '••••'
                    )}
                  </span>
                </div>
              </div>

              <div className="balance-actions">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation()
                    setIsBalanceVisible(!isBalanceVisible)
                  }}
                  className="balance-visibility-toggle"
                >
                  {isBalanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
                <Badge className="balance-change-badge">
                  +2.4%
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Category Dashboard or Quick Actions */}
        {isCategoriesEnabled ? (
          <CategoryDashboard className="mb-8 desktop-categories-layout" />
        ) : (
          <Card className="base-card">
            <CardHeader>
              <CardTitle className="card-title">Quick Actions</CardTitle>
              <CardDescription>
                Manage your finances with just one click
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid-3-cols">
                {QUICK_ACTIONS.map((quickActionConfig) => {
                  const IconComponent = quickActionConfig.icon === 'Plus' ? Plus : quickActionConfig.icon === 'Send' ? Send : TrendingUp
                  return (
                    <Button
                      key={quickActionConfig.type}
                      variant="outline"
                      className={`button-base button-secondary ${quickActionConfig.colorClass}`}
                      onClick={() => navigateToTransactionType(quickActionConfig.type)}
                    >
                      <div>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <span className="font-medium">{quickActionConfig.label}</span>
                    </Button>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Portfolio Overview */}
          <div className="lg:col-span-2">
            <Card className="base-card">
              <CardHeader>
                <CardTitle className="section-title">Portfolio Overview</CardTitle>
                <CardDescription>
                  Your OneFi asset allocation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {dashboardPortfolioAssetsData.map((portfolioAssetDisplayData) => (
                    <DashboardPortfolioAssetItem 
                      key={portfolioAssetDisplayData.assetName} 
                      portfolioAssetData={portfolioAssetDisplayData}
                    />
                  ))}
                </div>
                
                <div className="mt-lg flex gap-sm">
                  <Button variant="default" className="button-primary button--full-width">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Funds
                  </Button>
                  <Button variant="secondary" className="flex-1">
                    <PieChart className="w-4 h-4 mr-2" />
                    Rebalance
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="base-card" style={{marginTop: '1.5rem'}}>
              <CardHeader>
                <div className="flex-between">
                  <div>
                    <CardTitle className="section-title">Recent Activity</CardTitle>
                    <CardDescription>
                      Your latest transactions
                    </CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="button-ghost"
                    onClick={() => navigate('/account')}
                  >
                    View All
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isTransactionHistoryLoading ? (
                    // Loading skeletons for transactions
                    <>
                      <SkeletonTransaction />
                      <SkeletonTransaction />
                      <SkeletonTransaction />
                    </>
                  ) : (
                    enhancedTransactionDisplayList.map((transactionDisplayData) => (
                      <DashboardTransactionItem 
                        key={transactionDisplayData.id}
                        transactionDisplayData={transactionDisplayData}
                        onTransactionClick={navigateToTransactionDetails}
                      />
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* OneFi Features */}
            <Card className="base-card">
              <CardHeader>
                <CardTitle className="section-title">OneFi Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">1-Click Trading</p>
                    <p className="text-xs text-gray-600">Active</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Auto-Rebalancing</p>
                    <p className="text-xs text-gray-600">Enabled</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <Globe className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-sm">DeFi Integration</p>
                    <p className="text-xs text-gray-600">Connected</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Insights */}
            <Card className="base-card">
              <CardHeader>
                <CardTitle className="section-title">Market Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">BTC/USD</span>
                  <div className="text-right">
                    <p className="font-semibold text-sm">$43,250</p>
                    <p className="text-xs text-green-600">+2.4%</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">ETH/USD</span>
                  <div className="text-right">
                    <p className="font-semibold text-sm">$2,680</p>
                    <p className="text-xs text-green-600">+1.8%</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">S&P 500</span>
                  <div className="text-right">
                    <p className="font-semibold text-sm">4,785</p>
                    <p className="text-xs text-red-600">-0.3%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Educational Tip */}
            <Card className="feature-card" style={{background: 'linear-gradient(to right, #f0f9ff, #e0f2fe)', borderColor: '#bfdbfe'}}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Wallet className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-blue-900 mb-1">
                      Tip of the Day
                    </h4>
                    <p className="text-xs text-blue-700 mb-3">
                      Diversifying across traditional and DeFi assets can help reduce portfolio risk.
                    </p>
                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-100">
                      Learn More
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

