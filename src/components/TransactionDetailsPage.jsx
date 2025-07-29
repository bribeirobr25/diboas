/**
 * Transaction Details Page
 * Shows detailed information about a specific transaction
 */

import { useState, useEffect } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  ArrowLeft,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Copy,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Plus,
  CreditCard,
  Send
} from 'lucide-react'
import { useSafeDataManager } from '../hooks/useDataManagerSubscription.js'

// Transaction type configurations
const TRANSACTION_CONFIGS = {
  add: {
    icon: <Plus className="w-6 h-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    name: 'Deposit',
    description: 'Money added to your diBoaS wallet'
  },
  withdraw: {
    icon: <CreditCard className="w-6 h-6" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    name: 'Withdrawal',
    description: 'Money withdrawn from your diBoaS wallet'
  },
  send: {
    icon: <Send className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    name: 'Send Money',
    description: 'Money sent to another diBoaS user'
  },
  transfer: {
    icon: <ArrowRight className="w-6 h-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    name: 'Transfer',
    description: 'Money transferred to external wallet'
  },
  buy: {
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    name: 'Buy Assets',
    description: 'Cryptocurrency assets purchased'
  },
  sell: {
    icon: <TrendingDown className="w-6 h-6" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    name: 'Sell Assets',
    description: 'Cryptocurrency assets sold'
  },
  receive: {
    icon: <ArrowDownLeft className="w-6 h-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    name: 'Receive',
    description: 'Money received from another user'
  }
}

const STATUS_CONFIGS = {
  completed: {
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'bg-green-100 text-green-800',
    label: 'Completed'
  },
  confirmed: {
    icon: <CheckCircle className="w-5 h-5" />,
    color: 'bg-green-100 text-green-800',
    label: 'Confirmed'
  },
  processing: {
    icon: <Clock className="w-5 h-5" />,
    color: 'bg-yellow-100 text-yellow-800',
    label: 'Processing'
  },
  pending: {
    icon: <Clock className="w-5 h-5" />,
    color: 'bg-gray-100 text-gray-800',
    label: 'Pending'
  },
  failed: {
    icon: <XCircle className="w-5 h-5" />,
    color: 'bg-red-100 text-red-800',
    label: 'Failed'
  }
}

export default function TransactionDetailsPage({ transactionId: propTransactionId }) {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { getTransactions } = useSafeDataManager()
  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Support both prop-based and URL parameter-based transaction ID
  const transactionId = propTransactionId || searchParams.get('id')

  useEffect(() => {
    if (!transactionId) {
      setError('No transaction ID provided')
      setLoading(false)
      return
    }

    try {
      const allTransactions = getTransactions()
      const foundTransaction = allTransactions.find(tx => tx.id === transactionId)
      
      if (foundTransaction) {
        setTransaction(foundTransaction)
      } else {
        setError('Transaction not found')
      }
    } catch (err) {
      setError('Failed to load transaction details')
      console.error('Error loading transaction:', err)
    } finally {
      setLoading(false)
    }
  }, [transactionId, getTransactions])

  const copyToClipboard = async (text, type) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    })
  }

  const formatAmount = (amount, type) => {
    const numAmount = parseFloat(amount || 0)
    const isIncoming = ['add', 'receive'].includes(type)
    const sign = isIncoming ? '+' : ''
    return `${sign}$${numAmount.toFixed(2)}`
  }

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-64">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-gray-600">Loading transaction details...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => navigate('/app')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Button>
        </div>
        <Card>
          <CardContent className="p-8 text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {error || 'Transaction Not Found'}
            </h2>
            <p className="text-gray-600 mb-4">
              The transaction you're looking for could not be found or loaded.
            </p>
            <Button onClick={() => navigate('/app')}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  const config = TRANSACTION_CONFIGS[transaction.type] || TRANSACTION_CONFIGS.add
  const statusConfig = STATUS_CONFIGS[transaction.status] || STATUS_CONFIGS.completed

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      {/* Header */}
      <div className="mb-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/app')}
          className="flex items-center gap-2 mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Button>
        
        <div className="flex items-center gap-4">
          <div className={`p-3 rounded-full ${config.bgColor}`}>
            <div className={config.color}>
              {config.icon}
            </div>
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{config.name}</h1>
            <p className="text-gray-600">{config.description}</p>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Transaction Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Overview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Status</span>
              <Badge className={statusConfig.color}>
                <span className="flex items-center gap-1">
                  {statusConfig.icon}
                  {statusConfig.label}
                </span>
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Amount</span>
              <span className={`text-lg font-semibold ${
                ['add', 'receive'].includes(transaction.type) ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatAmount(transaction.amount, transaction.type)}
              </span>
            </div>

            {transaction.fees && transaction.fees.total > 0 && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Fees</span>
                <span className="text-gray-900">
                  ${parseFloat(transaction.fees.total || 0).toFixed(2)}
                </span>
              </div>
            )}

            {transaction.asset && transaction.asset !== 'USD' && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Asset</span>
                <span className="text-gray-900">{transaction.asset}</span>
              </div>
            )}

            {transaction.paymentMethod && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Payment Method</span>
                <span className="text-gray-900 capitalize">
                  {transaction.paymentMethod.replace(/_/g, ' ')}
                </span>
              </div>
            )}

            {transaction.recipient && (
              <div className="flex justify-between items-center">
                <span className="text-gray-600">Recipient</span>
                <span className="text-gray-900 font-mono text-sm">
                  {transaction.recipient}
                </span>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Transaction Details */}
        <Card>
          <CardHeader>
            <CardTitle>Transaction Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Transaction ID</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => copyToClipboard(transaction.id, 'Transaction ID')}
                  className="p-1"
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm font-mono bg-gray-50 p-2 rounded break-all">
                {transaction.id}
              </p>
            </div>

            {(transaction.createdAt || transaction.timestamp) && (
              <div>
                <span className="text-gray-600">Created</span>
                <p className="text-sm">{formatDate(transaction.createdAt || transaction.timestamp)}</p>
              </div>
            )}

            {transaction.confirmedAt && (
              <div>
                <span className="text-gray-600">Confirmed</span>
                <p className="text-sm">{formatDate(transaction.confirmedAt)}</p>
              </div>
            )}

            {transaction.submittedAt && (
              <div>
                <span className="text-gray-600">Submitted</span>
                <p className="text-sm">{formatDate(transaction.submittedAt)}</p>
              </div>
            )}

            {transaction.failedAt && (
              <div>
                <span className="text-gray-600">Failed</span>
                <p className="text-sm">{formatDate(transaction.failedAt)}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Blockchain Information */}
        {(transaction.txHash || transaction.transactionHash || transaction.chain) && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Blockchain Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {transaction.chain && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Network</span>
                  <span className="text-gray-900 font-semibold">{transaction.chain}</span>
                </div>
              )}

              {(transaction.txHash || transaction.transactionHash) && (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-gray-600">Transaction Hash</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => copyToClipboard(transaction.txHash || transaction.transactionHash, 'Transaction Hash')}
                      className="p-1"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>
                  <p className="text-sm font-mono bg-gray-50 p-2 rounded break-all">
                    {transaction.txHash || transaction.transactionHash}
                  </p>
                </div>
              )}

              {transaction.onChainStatus && (
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">On-Chain Status</span>
                  <span className="text-gray-900 capitalize">{transaction.onChainStatus}</span>
                </div>
              )}

              {(transaction.explorerLink || transaction.transactionLink) && (
                <div className="pt-4">
                  <Button
                    variant="outline"
                    onClick={() => window.open(transaction.explorerLink || transaction.transactionLink, '_blank', 'noopener,noreferrer')}
                    className="w-full flex items-center gap-2"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View on Blockchain Explorer
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Error Information */}
        {transaction.status === 'failed' && transaction.error && (
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle className="text-red-600">Error Information</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-sm font-medium text-red-800 mb-1">
                      Transaction Failed
                    </p>
                    <p className="text-sm text-red-700">
                      {transaction.error}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}