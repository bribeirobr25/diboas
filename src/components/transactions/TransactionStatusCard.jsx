/**
 * Transaction Status Card Component
 * Displays real-time transaction status updates in a compact card format
 */

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Loader2, 
  ExternalLink,
  Copy,
  X
} from 'lucide-react'
import { useTransactionStatus, TRANSACTION_STATUS } from '../../hooks/useTransactionStatus.js'

/**
 * Transaction Status Card Component
 */
export default function TransactionStatusCard({ 
  transactionId, 
  transactionData = {},
  onClose = () => {},
  compact = false,
  showHash = true 
}) {
  const [_showDetails, _setShowDetails] = useState(!compact)
  const [copied, setCopied] = useState(false)

  const {
    status,
    isLoading,
    error,
    connectionStatus,
    retry,
    isCompleted,
    isFailed,
    isTimeout
  } = useTransactionStatus(transactionId)

  // Auto-close after completion (optional)
  useEffect(() => {
    if (isCompleted && compact) {
      const timer = setTimeout(() => {
        onClose()
      }, 5000) // Auto-close after 5 seconds
      
      return () => clearTimeout(timer)
    }
  }, [isCompleted, compact, onClose])

  // Copy transaction hash to clipboard
  const copyHash = async (hash) => {
    try {
      await navigator.clipboard.writeText(hash)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy hash:', err)
    }
  }

  // Get status icon and color
  const getStatusDisplay = () => {
    if (isLoading && !status) {
      return {
        icon: <Loader2 className="w-5 h-5 animate-spin" />,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        text: 'Loading...'
      }
    }

    if (error || !connectionStatus.connected) {
      return {
        icon: <AlertCircle className="w-5 h-5" />,
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        text: 'Connection Error'
      }
    }

    if (!status) {
      return {
        icon: <Clock className="w-5 h-5" />,
        color: 'text-gray-600',
        bgColor: 'bg-gray-50',
        text: 'Waiting...'
      }
    }

    switch (status.status) {
      case TRANSACTION_STATUS.PENDING:
        return {
          icon: <Clock className="w-5 h-5" />,
          color: 'text-yellow-600',
          bgColor: 'bg-yellow-50',
          text: 'Pending'
        }
      
      case TRANSACTION_STATUS.PROCESSING:
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin" />,
          color: 'text-blue-600',
          bgColor: 'bg-blue-50',
          text: 'Processing'
        }
      
      case TRANSACTION_STATUS.CONFIRMING:
        return {
          icon: <Loader2 className="w-5 h-5 animate-spin" />,
          color: 'text-indigo-600',
          bgColor: 'bg-indigo-50',
          text: 'Confirming'
        }
      
      case TRANSACTION_STATUS.COMPLETED:
        return {
          icon: <CheckCircle className="w-5 h-5" />,
          color: 'text-green-600',
          bgColor: 'bg-green-50',
          text: 'Completed'
        }
      
      case TRANSACTION_STATUS.FAILED:
        return {
          icon: <AlertCircle className="w-5 h-5" />,
          color: 'text-red-600',
          bgColor: 'bg-red-50',
          text: 'Failed'
        }
      
      case TRANSACTION_STATUS.TIMEOUT:
        return {
          icon: <Clock className="w-5 h-5" />,
          color: 'text-orange-600',
          bgColor: 'bg-orange-50',
          text: 'Timeout'
        }
      
      default:
        return {
          icon: <Clock className="w-5 h-5" />,
          color: 'text-gray-600',
          bgColor: 'bg-gray-50',
          text: 'Unknown'
        }
    }
  }

  const statusDisplay = getStatusDisplay()

  if (compact) {
    return (
      <div className={`flex items-center space-x-3 p-3 rounded-lg ${statusDisplay.bgColor} transition-all duration-200`}>
        <div className={`flex items-center justify-center w-8 h-8 rounded-full bg-white ${statusDisplay.color}`}>
          {statusDisplay.icon}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between">
            <p className="font-medium text-gray-900 truncate">
              {transactionData.type || 'Transaction'} • ${transactionData.amount || '0.00'}
            </p>
            <button
              onClick={onClose}
              className="ml-2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="flex items-center space-x-2">
            <span className={`text-sm font-medium ${statusDisplay.color}`}>
              {statusDisplay.text}
            </span>
            
            {status?.progress !== undefined && (
              <div className="flex-1 bg-white rounded-full h-1 max-w-16">
                <div
                  className={`h-1 rounded-full transition-all duration-300 ${
                    statusDisplay.color.includes('green') ? 'bg-green-500' :
                    statusDisplay.color.includes('red') ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${status.progress}%` }}
                />
              </div>
            )}
            
            {status?.estimatedTimeRemaining && status.estimatedTimeRemaining > 0 && (
              <span className="text-xs text-gray-500">
                ~{Math.ceil(status.estimatedTimeRemaining)}s
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="w-full max-w-md">
      <CardContent className="p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className={`w-10 h-10 rounded-full ${statusDisplay.bgColor} flex items-center justify-center`}>
              {statusDisplay.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">
                {transactionData.type || 'Transaction'} Status
              </h3>
              <p className={`text-sm font-medium ${statusDisplay.color}`}>
                {statusDisplay.text}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Details */}
        <div className="space-y-3 mb-4">
          <div className="flex justify-between">
            <span className="text-gray-600">Amount:</span>
            <span className="font-medium">${transactionData.amount || '0.00'}</span>
          </div>
          
          {transactionData.asset && (
            <div className="flex justify-between">
              <span className="text-gray-600">Asset:</span>
              <span className="font-medium">{transactionData.asset}</span>
            </div>
          )}

          {status && (
            <>
              {/* Progress Bar */}
              {status.progress !== undefined && (
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-gray-600">Progress:</span>
                    <span className="font-medium">{status.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all duration-300 ${
                        statusDisplay.color.includes('green') ? 'bg-green-500' :
                        statusDisplay.color.includes('red') ? 'bg-red-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${status.progress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Confirmations */}
              {status.confirmations !== undefined && status.requiredConfirmations > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Confirmations:</span>
                  <span className="font-medium">
                    {status.confirmations}/{status.requiredConfirmations}
                  </span>
                </div>
              )}

              {/* Time Remaining */}
              {status.estimatedTimeRemaining && status.estimatedTimeRemaining > 0 && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Time Remaining:</span>
                  <span className="font-medium">
                    ~{Math.ceil(status.estimatedTimeRemaining)}s
                  </span>
                </div>
              )}

              {/* Last Update */}
              {status.lastUpdate && (
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Update:</span>
                  <span className="font-medium text-xs">
                    {new Date(status.lastUpdate).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Transaction Hash */}
        {showHash && status?.onChainHash && (
          <div className="mb-4 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">Transaction Hash:</span>
              <div className="flex space-x-1">
                <button
                  onClick={() => copyHash(status.onChainHash)}
                  className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Copy hash"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    // Open block explorer (would need chain-specific URLs in real implementation)
                    window.open(`#/transaction/${status.onChainHash}`, '_blank')
                  }}
                  className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                  title="View on explorer"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="text-xs font-mono break-all text-gray-800">
              {status.onChainHash}
            </p>
            {copied && (
              <p className="text-xs text-green-600 mt-1">Hash copied to clipboard!</p>
            )}
          </div>
        )}

        {/* Error State */}
        {(error || !connectionStatus.connected) && (
          <div className="mb-4 p-3 bg-red-50 rounded-lg">
            <p className="text-sm text-red-700 mb-2">
              {error || 'Connection lost'}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={retry}
              className="w-full"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        {(isCompleted || isFailed || isTimeout) && (
          <div className="flex space-x-2">
            <Button
              variant="outline"
              onClick={onClose}
              className="flex-1"
            >
              Close
            </Button>
            
            {(isFailed || isTimeout) && (
              <Button
                onClick={retry}
                className="flex-1"
              >
                Retry
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  )
}