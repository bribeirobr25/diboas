/**
 * Transaction History Component
 * Displays comprehensive transaction history with filtering and monitoring
 */

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { 
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  ArrowRightLeft,
  Plus,
  CreditCard,
  Search,
  Download,
  ExternalLink,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  Eye,
  RefreshCw
} from 'lucide-react'
import { useSafeDataManager, useDataManagerSubscription } from '../hooks/useDataManagerSubscription.js'
import { 
  calculateDisplayAmountWithSign, 
  generateHumanReadableTransactionDescription,
  shouldSplitTransactionInAdvancedMode,
  createSplitTransactionsForAdvancedMode,
  getEnhancedTransactionIcon
} from '../utils/transactionDisplayHelpers'
import { useUserSettings } from '../utils/userSettings.js'
import AdvancedModeToggle from './shared/AdvancedModeToggle.jsx'

const TransactionHistory = ({ limit = null, showHeader = true, className = '' }) => {
  const navigate = useNavigate()
  const { getTransactions } = useSafeDataManager()
  const { settings } = useUserSettings()
  const [transactions, setTransactions] = useState([])
  const [filteredTransactions, setFilteredTransactions] = useState([])
  const [searchTerm, setSearchTerm] = useState('')
  const [filterType, setFilterType] = useState('all')
  const [filterStatus, setFilterStatus] = useState('all')
  const [isLoading, setIsLoading] = useState(false)

  // Transaction type configurations
  const transactionTypes = {
    add: { 
      icon: <Plus className="w-4 h-4" />, 
      label: 'Add Money', 
      color: 'bg-green-100 text-green-800',
      direction: 'in'
    },
    withdraw: { 
      icon: <CreditCard className="w-4 h-4" />, 
      label: 'Withdraw', 
      color: 'bg-red-100 text-red-800',
      direction: 'out'
    },
    send: { 
      icon: <ArrowUpRight className="w-4 h-4" />, 
      label: 'Send', 
      color: 'bg-blue-100 text-blue-800',
      direction: 'out'
    },
    receive: { 
      icon: <ArrowDownLeft className="w-4 h-4" />, 
      label: 'Receive', 
      color: 'bg-green-100 text-green-800',
      direction: 'in'
    },
    transfer: { 
      icon: <ArrowRight className="w-4 h-4" />, 
      label: 'Transfer', 
      color: 'bg-purple-100 text-purple-800',
      direction: 'out'
    },
    buy: { 
      icon: <TrendingUp className="w-4 h-4" />, 
      label: 'Buy Asset', 
      color: 'bg-indigo-100 text-indigo-800',
      direction: 'neutral'
    },
    sell: { 
      icon: <TrendingDown className="w-4 h-4" />, 
      label: 'Sell Asset', 
      color: 'bg-orange-100 text-orange-800',
      direction: 'neutral'
    },
    invest: { 
      icon: <TrendingUp className="w-4 h-4" />, 
      label: 'Investment', 
      color: 'bg-yellow-100 text-yellow-800',
      direction: 'out'
    }
  }

  const statusConfig = {
    completed: { 
      icon: <CheckCircle className="w-4 h-4" />, 
      color: 'bg-green-100 text-green-800' 
    },
    confirmed: { 
      icon: <CheckCircle className="w-4 h-4" />, 
      color: 'bg-green-100 text-green-800' 
    },
    processing: { 
      icon: <Clock className="w-4 h-4" />, 
      color: 'bg-yellow-100 text-yellow-800' 
    },
    pending: { 
      icon: <Clock className="w-4 h-4" />, 
      color: 'bg-gray-100 text-gray-800' 
    },
    pending_confirmation: { 
      icon: <Clock className="w-4 h-4" />, 
      color: 'bg-blue-100 text-blue-800' 
    },
    failed: { 
      icon: <XCircle className="w-4 h-4" />, 
      color: 'bg-red-100 text-red-800' 
    }
  }

  // Navigation to transaction details
  const navigateToTransactionDetails = useCallback((transactionId) => {
    navigate(`/transaction?id=${transactionId}`)
  }, [navigate])

  // Load transaction history function
  const loadTransactions = useCallback(() => {
    setIsLoading(true)
    try {
      const allTransactions = getTransactions()
      const history = limit ? allTransactions.slice(0, limit) : allTransactions
      console.log('📋 Loaded transactions from DataManager:', history.length, 'transactions')
      console.log('📋 Transaction statuses:', history.map(tx => ({ id: tx.id.substring(0, 8), status: tx.status })))
      setTransactions(history)
    } catch (error) {
      console.error('Failed to load transaction history:', error)
    } finally {
      setIsLoading(false)
    }
  }, [getTransactions, limit])

  // Subscribe to transaction updates
  useDataManagerSubscription('transaction:added', () => {
    console.log('📋 Transaction added, reloading history')
    loadTransactions()
  }, [loadTransactions])
  
  useDataManagerSubscription('transaction:updated', (updatedTransaction) => {
    console.log('📋 Transaction updated:', updatedTransaction.id, 'status:', updatedTransaction.status)
    loadTransactions()
  }, [loadTransactions])

  // Load transaction history on mount
  useEffect(() => {
    loadTransactions()
  }, [loadTransactions])

  // Filter and search transactions
  useEffect(() => {
    let filtered = transactions
    
    // Apply advanced mode transformations first
    if (settings.showAdvancedTransactionDetails) {
      filtered = transactions.flatMap(transaction => {
        if (shouldSplitTransactionInAdvancedMode(transaction.type, transaction.paymentMethod)) {
          return createSplitTransactionsForAdvancedMode(transaction)
        }
        return transaction
      })
    }

    // Filter by type
    if (filterType !== 'all') {
      filtered = filtered.filter(tx => tx.type === filterType || tx.originalType === filterType)
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(tx => tx.status === filterStatus)
    }

    // Search filter
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(tx => 
        tx.id.toLowerCase().includes(term) ||
        (tx.metadata?.recipient && tx.metadata.recipient.toLowerCase().includes(term)) ||
        tx.amount.toString().includes(term) ||
        (tx.metadata?.asset && tx.metadata.asset.toLowerCase().includes(term))
      )
    }

    setFilteredTransactions(filtered)
  }, [transactions, filterType, filterStatus, searchTerm, settings.showAdvancedTransactionDetails])

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const stats = {
      total: transactions.length,
      completed: 0,
      pending: 0,
      failed: 0,
      totalVolume: 0,
      thisMonth: 0
    }

    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)

    transactions.forEach(tx => {
      stats[tx.status] = (stats[tx.status] || 0) + 1
      stats.totalVolume += parseFloat(tx.amount || 0)
      
      const txDate = new Date(tx.completedAt || tx.initiatedAt)
      if (txDate >= monthStart) {
        stats.thisMonth += 1
      }
    })

    return stats
  }, [transactions])


  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getTransactionDetails = (transaction) => {
    // Handle split transactions in advanced mode
    const actualType = transaction.originalType || transaction.type
    const typeConfig = transactionTypes[actualType] || transactionTypes[transaction.type]
    const statusConfig_ = statusConfig[transaction.status]
    
    // Get enhanced icon based on transaction type
    const enhancedIcon = getEnhancedTransactionIcon(actualType, transaction.paymentMethod)
    
    // Generate enhanced description
    const enhancedDescription = transaction.description || generateHumanReadableTransactionDescription(
      actualType,
      transaction.amount,
      transaction.asset,
      transaction.paymentMethod,
      transaction.fromAsset,
      transaction.fromAmount,
      transaction.toAsset,
      transaction.toAmount
    )
    
    // Calculate enhanced amount display
    const enhancedAmount = transaction.displayAmount || calculateDisplayAmountWithSign(
      actualType,
      transaction.amount,
      transaction.netAmount,
      transaction.paymentMethod,
      transaction.toAsset,
      transaction.toAmount
    )
    
    return {
      ...transaction,
      typeConfig,
      statusConfig: statusConfig_,
      formattedAmount: enhancedAmount,
      formattedDate: formatDate(transaction.completedAt || transaction.initiatedAt || transaction.timestamp),
      recipient: transaction.metadata?.recipient || transaction.recipient || 'N/A',
      asset: transaction.metadata?.asset || transaction.asset || 'USD',
      fees: transaction.fees?.total || 0,
      enhancedDescription,
      enhancedIcon
    }
  }

  return (
    <div className={className}>
      {showHeader && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold">Transaction History</h2>
              <p className="text-gray-600">Track all your diBoaS transactions</p>
              <AdvancedModeToggle className="mt-3" />
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={loadTransactions}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Export
              </Button>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{summaryStats.total}</p>
                  <p className="text-sm text-gray-500">Total Transactions</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{summaryStats.completed}</p>
                  <p className="text-sm text-gray-500">Completed</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">{summaryStats.pending + summaryStats.processing}</p>
                  <p className="text-sm text-gray-500">Pending</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">${summaryStats.totalVolume.toFixed(0)}</p>
                  <p className="text-sm text-gray-500">Total Volume</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <div className="flex-1 min-w-60">
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="Search transactions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Types</option>
              {Object.entries(transactionTypes).map(([key, config]) => (
                <option key={key} value={key}>{config.label}</option>
              ))}
            </select>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm"
            >
              <option value="all">All Status</option>
              <option value="completed">Completed</option>
              <option value="processing">Processing</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>
        </div>
      )}

      {/* Transaction List */}
      <div className="space-y-3">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <span className="ml-2 text-gray-600">Loading transactions...</span>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 mb-4">
                <Clock className="w-12 h-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {transactions.length === 0 ? 'No transactions yet' : 'No matching transactions'}
              </h3>
              <p className="text-gray-500">
                {transactions.length === 0 
                  ? 'Start by adding money to your diBoaS wallet'
                  : 'Try adjusting your search or filter criteria'
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          filteredTransactions.map((transaction) => {
            const details = getTransactionDetails(transaction)
            
            return (
              <Card 
                key={transaction.id} 
                className="interactive-card"
                onClick={() => navigateToTransactionDetails(transaction.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      {/* Transaction Type Icon */}
                      <div className={`p-2 rounded-full ${details.typeConfig?.color || 'bg-gray-100'}`}>
                        {details.enhancedIcon === 'exchange' ? (
                          <ArrowRightLeft className="w-4 h-4 text-blue-600" />
                        ) : (
                          details.typeConfig?.icon || <ArrowRight className="w-4 h-4" />
                        )}
                      </div>
                      
                      {/* Transaction Details */}
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium">{details.enhancedDescription}</h4>
                          <Badge className={details.statusConfig?.color || 'bg-gray-100'}>
                            <span className="flex items-center space-x-1">
                              {details.statusConfig?.icon}
                              <span className="capitalize">{transaction.status}</span>
                            </span>
                          </Badge>
                        </div>
                        
                        <div className="flex items-center space-x-2 mt-1">
                          <p className="text-sm text-gray-600">{details.formattedDate}</p>
                          {details.recipient !== 'N/A' && (
                            <>
                              <span className="text-gray-400">•</span>
                              <p className="text-sm text-gray-600">{details.recipient}</p>
                            </>
                          )}
                          {details.asset !== 'USD' && (
                            <>
                              <span className="text-gray-400">•</span>
                              <p className="text-sm text-gray-600">{details.asset}</p>
                            </>
                          )}
                        </div>
                        
                        {/* Transaction ID and Hash */}
                        <div className="space-y-1 mt-1">
                          <p className="text-xs text-gray-400 font-mono">
                            ID: {transaction.id.substring(0, 16)}...
                          </p>
                          {(transaction.txHash || transaction.transactionHash) && (
                            <p className="text-xs text-gray-400 font-mono">
                              Hash: {(transaction.txHash || transaction.transactionHash).substring(0, 16)}...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    {/* Amount and Actions */}
                    <div className="text-right">
                      <p className={`text-lg font-semibold ${
                        details.typeConfig?.direction === 'in' 
                          ? 'text-green-600' 
                          : details.typeConfig?.direction === 'out'
                          ? 'text-red-600'
                          : 'text-gray-900'
                      }`}>
                        {details.formattedAmount}
                      </p>
                      
                      {details.fees > 0 && (
                        <p className="text-xs text-gray-500">
                          Fee: ${details.fees.toFixed(2)}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-end space-x-2 mt-2">
                        {/* Explorer Link for On-Chain Transactions */}
                        {(transaction.explorerLink || transaction.transactionLink) && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="p-1 hover:bg-blue-50 hover:text-blue-600" 
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(transaction.explorerLink || transaction.transactionLink, '_blank', 'noopener,noreferrer')
                            }}
                            title="View on blockchain explorer"
                          >
                            <ExternalLink className="w-3 h-3" />
                          </Button>
                        )}
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="p-1 hover:bg-gray-100"
                          onClick={(e) => {
                            e.stopPropagation()
                            navigateToTransactionDetails(transaction.id)
                          }}
                          title="View transaction details"
                        >
                          <Eye className="w-3 h-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                  
                  {/* Expanded Details */}
                  {transaction.status === 'failed' && transaction.error && (
                    <div className="mt-3 p-3 bg-red-50 rounded-lg">
                      <div className="flex items-center space-x-2">
                        <AlertCircle className="w-4 h-4 text-red-600" />
                        <p className="text-sm text-red-700">
                          <strong>Error:</strong> {transaction.error}
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {/* On-Chain Transaction Details */}
                  {(transaction.txHash || transaction.transactionHash || transaction.chain) && (
                    <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Blockchain Transaction
                          </p>
                          <div className="space-y-1">
                            {transaction.chain && (
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">Network:</span> {transaction.chain}
                              </p>
                            )}
                            {(transaction.txHash || transaction.transactionHash) && (
                              <p className="text-xs text-gray-600 font-mono">
                                <span className="font-medium">Hash:</span> {(transaction.txHash || transaction.transactionHash)}
                              </p>
                            )}
                            {transaction.confirmedAt && (
                              <p className="text-xs text-gray-600">
                                <span className="font-medium">Confirmed:</span> {formatDate(transaction.confirmedAt)}
                              </p>
                            )}
                          </div>
                        </div>
                        {(transaction.explorerLink || transaction.transactionLink) && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => {
                              e.stopPropagation()
                              window.open(transaction.explorerLink || transaction.transactionLink, '_blank', 'noopener,noreferrer')
                            }}
                            className="ml-3 flex items-center gap-2 text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <ExternalLink className="w-4 h-4" />
                            View on Explorer
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {transaction.routing?.needsRouting && (
                    <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm text-blue-700">
                        <strong>Multi-chain routing:</strong> {transaction.routing.fromChain} → {transaction.routing.toChain}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            )
          })
        )}
      </div>
      
      {/* Load More */}
      {!limit && filteredTransactions.length > 0 && filteredTransactions.length >= 20 && (
        <div className="text-center mt-6">
          <Button variant="outline" onClick={loadTransactions}>
            Load More Transactions
          </Button>
        </div>
      )}
    </div>
  )
}

export default TransactionHistory