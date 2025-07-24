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
  TrendingDown,
  DollarSign,
  PieChart,
  Send,
  CreditCard,
  Wallet,
  Eye,
  EyeOff,
  Plus,
  ArrowRight,
  Zap,
  Shield,
  Globe,
  Star
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import SimpleMarketIndicators from './SimpleMarketIndicators.jsx'
import PageHeader from './shared/PageHeader.jsx'
import { QUICK_ACTIONS, createTransactionNavigator } from '../utils/navigationHelpers.js'
import { useWalletBalance } from '../hooks/useTransactions.jsx'
import { useDataManagerSubscription, useSafeDataManager } from '../hooks/useDataManagerSubscription.js'

// PERFORMANCE: Memoized transaction item component
const TransactionItem = memo(({ transaction, onNavigate }) => (
  <div 
    key={transaction.id}
    className="transaction-card"
    onClick={() => onNavigate(transaction.type)}
  >
    <div className="flex items-center space-x-3">
      {transaction.icon}
      <div>
        <p className="font-medium text-sm">{transaction.description}</p>
        <p className="text-xs text-gray-500">{transaction.time}</p>
      </div>
    </div>
    <span className={`font-semibold text-sm ${
      transaction.type === 'received' ? 'text-green-600' : 'text-red-600'
    }`}>
      {transaction.amount}
    </span>
  </div>
))

// PERFORMANCE: Memoized portfolio item component  
const PortfolioItem = memo(({ item }) => (
  <div className="flex items-center justify-between">
    <div className="flex items-center space-x-3">
      <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
      <span className="font-medium">{item.name}</span>
    </div>
    <div className="text-right">
      <div className="font-semibold">{item.amount}</div>
      <div className="text-sm text-gray-500">{item.value}%</div>
    </div>
  </div>
))

export default function AppDashboard() {
  const navigate = useNavigate()
  const [isBalanceVisible, setIsBalanceVisible] = useState(true)
  
  // Get real wallet balance
  const { balance, getBalance, isLoading: balanceLoading } = useWalletBalance()
  
  // Refresh balance when component mounts and periodically
  useEffect(() => {
    getBalance(true) // Force refresh
  }, [getBalance])
  
  // MEMORY SAFE: Use safe DataManager access
  const { getTransactions: safeGetTransactions } = useSafeDataManager()
  
  // PERFORMANCE: Memoized transaction history getter
  const getTransactionHistory = useCallback(() => {
    const allTransactions = safeGetTransactions()
    console.log('📖 Getting transaction history from DataManager:', allTransactions.length, 'transactions')
    return allTransactions.slice(0, 5) // Get last 5 transactions
  }, [safeGetTransactions])
  
  const [transactionHistory, setTransactionHistory] = useState([])
  const [transactionsLoading, setTransactionsLoading] = useState(true)
  
  // PERFORMANCE: Debounced transaction update to prevent rapid re-renders
  const debouncedTransactionUpdate = useCallback(() => {
    const timeoutId = setTimeout(() => {
      const newHistory = getTransactionHistory()
      console.log('📚 Updated transaction history (debounced):', newHistory)
      setTransactionHistory(newHistory)
      getBalance(true)
    }, 100) // 100ms debounce
    
    return () => clearTimeout(timeoutId)
  }, [getTransactionHistory, getBalance])
  
  // MEMORY SAFE: Use safe DataManager subscriptions
  useDataManagerSubscription('transaction:added', (transaction) => {
    console.log('🔔 DataManager transaction added event received:', transaction)
    debouncedTransactionUpdate()
  }, [debouncedTransactionUpdate])
  
  useDataManagerSubscription('transaction:completed', ({ transaction }) => {
    console.log('🔔 DataManager transaction completed event received:', transaction)
    debouncedTransactionUpdate()
  }, [debouncedTransactionUpdate])
  
  useEffect(() => {
    // Set initial transaction history with loading state
    setTransactionsLoading(true)
    const history = getTransactionHistory()
    setTransactionHistory(history)
    setTransactionsLoading(false)
    
    // Also listen for custom events (for backward compatibility)
    const handleTransactionUpdate = (event) => {
      console.log('🔔 Custom transaction completed event received:', event.detail)
      debouncedTransactionUpdate()
    }
    
    window.addEventListener('diboas-transaction-completed', handleTransactionUpdate)
    
    return () => {
      window.removeEventListener('diboas-transaction-completed', handleTransactionUpdate)
    }
  }, [getTransactionHistory, debouncedTransactionUpdate])
  
  // PERFORMANCE: Memoized navigation function
  const navigateToTransaction = useMemo(() => createTransactionNavigator(navigate), [navigate])
  
  // Balance visibility toggle - using inline handler for better performance

  // PERFORMANCE: Memoized transaction helper functions
  const getTransactionIcon = useCallback((type) => {
    switch (type) {
      case 'add':
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />
      case 'send':
        return <Send className="w-4 h-4 text-blue-600" />
      case 'withdraw':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />
      case 'buy':
        return <TrendingUp className="w-4 h-4 text-purple-600" />
      case 'sell':
        return <TrendingDown className="w-4 h-4 text-orange-600" />
      default:
        return <DollarSign className="w-4 h-4 text-gray-600" />
    }
  }, [])
  
  const getAmountDisplay = useCallback((type, amount, netAmount) => {
    const sign = ['add', 'receive'].includes(type) ? '+' : '-'
    const displayAmount = ['add', 'receive'].includes(type) ? (netAmount || amount) : amount
    return `${sign}$${parseFloat(displayAmount).toFixed(2)}`
  }, [])
  
  const getTimeAgo = useCallback((timestamp) => {
    const now = new Date()
    const txTime = new Date(timestamp)
    const diffMinutes = Math.floor((now - txTime) / (1000 * 60))
    
    if (diffMinutes < 1) return 'Just now'
    if (diffMinutes < 60) return `${diffMinutes}m ago`
    if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`
    return `${Math.floor(diffMinutes / 1440)}d ago`
  }, [])

  // PERFORMANCE: Convert transaction history to display format
  const userRecentTransactions = useMemo(() => {
    if (!transactionHistory.length) {
      return [{
        id: 'empty',
        type: 'sent',
        description: 'No recent transactions',
        amount: '$0.00',
        time: '',
        icon: <DollarSign className="w-4 h-4 text-gray-400" />
      }]
    }
    
    return transactionHistory.map(tx => ({
      id: tx.id,
      type: ['add', 'receive'].includes(tx.type) ? 'received' : 'sent',
      description: tx.description,
      amount: getAmountDisplay(tx.type, tx.amount, tx.netAmount),
      time: getTimeAgo(tx.timestamp),
      icon: getTransactionIcon(tx.type)
    }))
  }, [transactionHistory, getTransactionIcon, getAmountDisplay, getTimeAgo])

  // PERFORMANCE: Memoize portfolio data based on real balance
  const userPortfolioData = useMemo(() => {
    const available = balance?.availableForSpending || 0
    const invested = balance?.investedAmount || 0
    const total = available + invested
    
    if (total === 0) {
      return [
        { name: 'Traditional', value: 0, amount: '$0.00', color: 'bg-blue-500' },
        { name: 'Crypto', value: 0, amount: '$0.00', color: 'bg-purple-500' },
        { name: 'DeFi', value: 0, amount: '$0.00', color: 'bg-green-500' }
      ]
    }
    
    const availablePercent = Math.round((available / total) * 100)
    const investedPercent = Math.round((invested / total) * 100)
    
    return [
      { 
        name: 'Available', 
        value: availablePercent, 
        amount: `$${available.toFixed(2)}`, 
        color: 'bg-green-500' 
      },
      { 
        name: 'Invested', 
        value: investedPercent, 
        amount: `$${invested.toFixed(2)}`, 
        color: 'bg-blue-500' 
      },
      { 
        name: 'Reserved', 
        value: 100 - availablePercent - investedPercent, 
        amount: '$0.00', 
        color: 'bg-gray-500' 
      }
    ]
  }, [balance])

  // PERFORMANCE: Memoize total balance calculation (unused but kept for future use)
  // eslint-disable-next-line no-unused-vars
  const totalBalance = useMemo(() => {
    if (!balance) return 0
    return (balance.availableForSpending || 0) + (balance.investedAmount || 0)
  }, [balance])

  return (
    <div className="main-layout">
      <PageHeader showUserActions={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section with Market Indicators */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Good morning, John! 👋
          </h1>
          <SimpleMarketIndicators />
        </div>

        {/* Balance Card */}
        <Card className="balance-card" onClick={() => navigate('/account')}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-blue-100 text-sm mb-1">Total Balance</p>
                <div className="flex items-center">
                  {balanceLoading ? (
                    <div className="flex items-center space-x-2">
                      <LoadingSpinner size="sm" variant="white" />
                      <SkeletonBalance className="bg-white/20" />
                    </div>
                  ) : (
                    <>
                      <h2 className="text-3xl font-bold mr-3">
                        {isBalanceVisible ? 
                          `$${balance?.totalUSD?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}` : 
                          '••••••••'
                        }
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setIsBalanceVisible(!isBalanceVisible)
                        }}
                        className="text-white hover:bg-white/20"
                      >
                        {isBalanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </>
                  )}
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-green-500 text-white mb-2">
                  +2.4% today
                </Badge>
                <p className="text-blue-100 text-xs">Click for details</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-blue-100 text-sm">Available</p>
                {balanceLoading ? (
                  <SkeletonBalance className="bg-white/20" />
                ) : (
                  <p className="text-xl font-semibold">
                    {isBalanceVisible ? 
                      `$${balance?.availableForSpending?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}` : 
                      '••••••••'
                    }
                  </p>
                )}
              </div>
              <div>
                <p className="text-blue-100 text-sm">Invested</p>
                {balanceLoading ? (
                  <SkeletonBalance className="bg-white/20" />
                ) : (
                  <p className="text-xl font-semibold">
                    {isBalanceVisible ? 
                      `$${(balance?.investedAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
                      '••••••••'
                    }
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="main-card">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>
              Manage your finances with just one click
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid-3-cols">
              {QUICK_ACTIONS.map((action) => {
                const IconComponent = action.icon === 'Plus' ? Plus : action.icon === 'Send' ? Send : TrendingUp
                return (
                  <Button
                    key={action.type}
                    variant="outline"
                    className={`quick-action-button ${action.colorClass}`}
                    onClick={() => navigateToTransaction(action.type)}
                  >
                    <div>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="font-medium">{action.label}</span>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Portfolio Overview */}
          <div className="lg:col-span-2">
            <Card className="main-card">
              <CardHeader>
                <CardTitle className="section-title">Portfolio Overview</CardTitle>
                <CardDescription>
                  Your OneFi asset allocation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userPortfolioData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{item.amount}</p>
                        <p className="text-sm text-gray-500">{item.value}%</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex space-x-2">
                  <Button variant="default" className="flex-1">
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
            <Card className="main-card" style={{marginTop: '1.5rem'}}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="section-title">Recent Activity</CardTitle>
                    <CardDescription>
                      Your latest transactions
                    </CardDescription>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => navigate('/account')}
                  >
                    View All
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {transactionsLoading ? (
                    // Loading skeletons for transactions
                    <>
                      <SkeletonTransaction />
                      <SkeletonTransaction />
                      <SkeletonTransaction />
                    </>
                  ) : (
                    userRecentTransactions.map((transaction) => (
                      <div key={transaction.id} className="transaction-card">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-gray-100 rounded-full">
                            {transaction.icon}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{transaction.description}</p>
                            <p className="text-xs text-gray-500">{transaction.time}</p>
                          </div>
                        </div>
                        <p className={`font-semibold ${
                          transaction.amount.startsWith('+') ? 'text-green-600' : 'text-gray-900'
                        }`}>
                          {transaction.amount}
                        </p>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* OneFi Features */}
            <Card className="main-card">
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
            <Card className="main-card">
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

