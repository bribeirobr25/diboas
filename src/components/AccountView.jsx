import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Send,
  CreditCard,
  Wallet,
  Eye,
  EyeOff,
  Filter,
  Download,
  Search,
  Calendar,
  Star,
  Zap,
  Globe
} from 'lucide-react'
import { Input } from '@/components/ui/input.jsx'
import PageHeader from './shared/PageHeader.jsx'
import { NAVIGATION_PATHS } from '../utils/navigationHelpers.js'
import { useWalletBalance } from '../hooks/useTransactions.jsx'
import { useSafeDataManager, useDataManagerSubscription } from '../hooks/useDataManagerSubscription.js'

export default function AccountView() {
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [filterType, setFilterType] = useState('all')
  
  // Get real wallet balance
  const { balance, getBalance } = useWalletBalance()
  
  // Refresh balance when component mounts
  useEffect(() => {
    getBalance(true) // Force refresh
  }, [])
  
  // Get transaction history from DataManager (same as AppDashboard)
  const { getTransactions: safeGetTransactions } = useSafeDataManager()
  
  const getTransactionHistory = useCallback(() => {
    const allTransactions = safeGetTransactions()
    console.log('📖 AccountView: Getting transaction history from DataManager:', allTransactions.length, 'transactions')
    return allTransactions // Get all transactions for account view
  }, [safeGetTransactions])
  
  const [transactionHistory, setTransactionHistory] = useState([])
  
  // Load initial transaction history
  useEffect(() => {
    try {
      setTransactionHistory(getTransactionHistory())
    } catch (error) {
      console.warn('Failed to load transaction history:', error)
      setTransactionHistory([])
    }
  }, [getTransactionHistory])
  
  // Use DataManager subscriptions (same as AppDashboard)
  useDataManagerSubscription('transaction:added', (transaction) => {
    console.log('🔔 AccountView: DataManager transaction added event received:', transaction)
    const newHistory = getTransactionHistory()
    setTransactionHistory(newHistory)
    getBalance(true)
  }, [getTransactionHistory, getBalance])
  
  useDataManagerSubscription('transaction:completed', ({ transaction }) => {
    console.log('🔔 AccountView: DataManager transaction completed event received:', transaction)
    const newHistory = getTransactionHistory()
    setTransactionHistory(newHistory)
    getBalance(true)
  }, [getTransactionHistory, getBalance])

  // Convert transaction history to display format
  const transactions = useMemo(() => {
    return transactionHistory.map(tx => {
      const getTransactionIcon = (type) => {
        switch (type) {
          case 'add':
            return <ArrowDownLeft className="w-4 h-4 text-green-600" />
          case 'send':
            return <Send className="w-4 h-4 text-blue-600" />
          case 'withdraw':
            return <CreditCard className="w-4 h-4 text-red-600" />
          case 'buy':
            return <TrendingUp className="w-4 h-4 text-purple-600" />
          case 'sell':
            return <TrendingDown className="w-4 h-4 text-orange-600" />
          case 'receive':
            return <ArrowDownLeft className="w-4 h-4 text-green-600" />
          case 'transfer':
            return <ArrowUpRight className="w-4 h-4 text-red-600" />
          default:
            return <DollarSign className="w-4 h-4 text-gray-600" />
        }
      }
      
      const getAmountDisplay = (type, amount, netAmount) => {
        const sign = ['add', 'receive'].includes(type) ? '+' : '-'
        // For incoming transactions, show net amount (after fees)
        // For outgoing transactions, show original amount (before fees)
        const displayAmount = ['add', 'receive'].includes(type) ? (netAmount || amount) : amount
        return `${sign}$${parseFloat(displayAmount).toFixed(2)}`
      }
      
      const getTimeAgo = (timestamp) => {
        const now = new Date()
        const txTime = new Date(timestamp)
        const diffMinutes = Math.floor((now - txTime) / (1000 * 60))
        
        if (diffMinutes < 1) return 'Just now'
        if (diffMinutes < 60) return `${diffMinutes}m ago`
        if (diffMinutes < 1440) return `${Math.floor(diffMinutes / 60)}h ago`
        return `${Math.floor(diffMinutes / 1440)}d ago`
      }
      
      const getDisplayDate = (timestamp) => {
        const txDate = new Date(timestamp)
        return txDate.toLocaleDateString('en-US', { 
          month: 'short', 
          day: 'numeric', 
          year: 'numeric' 
        })
      }
      
      return {
        id: tx.id,
        type: ['add', 'receive'].includes(tx.type) ? 'received' : 'sent',
        description: tx.description,
        amount: getAmountDisplay(tx.type, tx.amount, tx.netAmount),
        time: getTimeAgo(tx.timestamp),
        date: getDisplayDate(tx.timestamp),
        status: tx.status || 'completed',
        icon: getTransactionIcon(tx.type),
        category: tx.type // Use the transaction type as category
      }
    })
  }, [transactionHistory])

  const filteredTransactions = filterType === 'all' 
    ? transactions 
    : transactions.filter(t => t.category === filterType)

  const filterOptions = [
    { value: 'all', label: 'All Transactions' },
    { value: 'deposit', label: 'Deposits' },
    { value: 'send', label: 'Sent' },
    { value: 'received', label: 'Received' },
    { value: 'buy', label: 'Purchases' },
    { value: 'withdraw', label: 'Withdrawals' }
  ]

  return (
    <div className="main-layout">
      <PageHeader 
        showBackButton={true} 
        backTo={NAVIGATION_PATHS.APP}
        showUserActions={true}
        title="Account Overview"
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Account Overview */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Account Overview
          </h1>

          {/* Balance Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="diboas-gradient text-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Total Balance</p>
                    <div className="flex items-center">
                      <h2 className="text-2xl font-bold mr-3">
                        {balanceVisible ? 
                          `$${balance?.totalUSD?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}` : 
                          '••••••••'
                        }
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setBalanceVisible(!balanceVisible)}
                        className="text-white hover:bg-white/20"
                      >
                        {balanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Badge className="bg-green-500 text-white">
                    +2.4%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600 text-sm mb-1">Available</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {balanceVisible ? 
                    `$${balance?.availableForSpending?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}` : 
                    '••••••••'
                  }
                </h3>
                <p className="text-sm text-green-600 mt-2">Ready to use</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600 text-sm mb-1">Invested</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {balanceVisible ? 
                    `$${(balance?.investedAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 
                    '••••••••'
                  }
                </h3>
                <p className="text-sm text-blue-600 mt-2">In portfolio</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Transaction History</CardTitle>
                <CardDescription>
                  All your diBoaS account activity
                </CardDescription>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search transactions..."
                    className="pl-10 w-64"
                  />
                </div>
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {filterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-full">
                      {transaction.icon}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{transaction.date}</span>
                        <span>•</span>
                        <span>{transaction.time}</span>
                        <Badge variant="outline" className="ml-2">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.amount.startsWith('+') ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {transaction.amount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-600">Try adjusting your filter or search criteria.</p>
              </div>
            )}
            
            {filteredTransactions.length > 0 && (
              <div className="mt-6 text-center">
                <Button variant="outline">
                  Load More Transactions
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

