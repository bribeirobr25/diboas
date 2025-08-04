/**
 * Transaction Status Card Component
 * Displays real-time transaction status updates in a compact card format
 */

import { useState, useEffect } from 'react'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import logger from '../../utils/logger'
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
      logger.error('Failed to copy hash:', err)
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
      <div className={`transaction-status-compact ${statusDisplay.bgColor}`}>
        <div className={`status-indicator-icon bg-white ${statusDisplay.color}`}>
          {statusDisplay.icon}
        </div>
        
        <div className="transaction-status-details">
          <div className="status-header-row">
            <p className="transaction-summary-text">
              {transactionData.type || 'Transaction'} • ${transactionData.amount || '0.00'}
            </p>
            <button
              onClick={onClose}
              className="close-button-small"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <div className="status-progress-row">
            <span className={`status-text ${statusDisplay.color}`}>
              {statusDisplay.text}
            </span>
            
            {status?.progress !== undefined && (
              <div className="compact-progress-track">
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
              <span className="time-remaining-text">
                ~{Math.ceil(status.estimatedTimeRemaining)}s
              </span>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <Card className="transaction-status-card">
      <CardContent className="transaction-status-content">
        {/* Header */}
        <div className="transaction-status-header">
          <div className="status-title-section">
            <div className={`status-icon-large ${statusDisplay.bgColor}`}>
              {statusDisplay.icon}
            </div>
            <div>
              <h3 className="transaction-status-title">
                {transactionData.type || 'Transaction'} Status
              </h3>
              <p className={`status-label ${statusDisplay.color}`}>
                {statusDisplay.text}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="close-button"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Transaction Details */}
        <div className="transaction-details-section">
          <div className="detail-row">
            <span className="detail-label">Amount:</span>
            <span className="detail-value">${transactionData.amount || '0.00'}</span>
          </div>
          
          {transactionData.asset && (
            <div className="detail-row">
              <span className="detail-label">Asset:</span>
              <span className="detail-value">{transactionData.asset}</span>
            </div>
          )}

          {status && (
            <>
              {/* Progress Bar */}
              {status.progress !== undefined && (
                <div>
                  <div className="progress-header">
                    <span className="progress-label">Progress:</span>
                    <span className="progress-value">{status.progress}%</span>
                  </div>
                  <div className="progress-track">
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
                <div className="detail-row">
                  <span className="detail-label">Confirmations:</span>
                  <span className="detail-value">
                    {status.confirmations}/{status.requiredConfirmations}
                  </span>
                </div>
              )}

              {/* Time Remaining */}
              {status.estimatedTimeRemaining && status.estimatedTimeRemaining > 0 && (
                <div className="detail-row">
                  <span className="detail-label">Time Remaining:</span>
                  <span className="detail-value">
                    ~{Math.ceil(status.estimatedTimeRemaining)}s
                  </span>
                </div>
              )}

              {/* Last Update */}
              {status.lastUpdate && (
                <div className="detail-row">
                  <span className="detail-label">Last Update:</span>
                  <span className="detail-value-small">
                    {new Date(status.lastUpdate).toLocaleTimeString()}
                  </span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Transaction Hash */}
        {showHash && status?.onChainHash && (
          <div className="transaction-hash-section">
            <div className="hash-header">
              <span className="hash-label">Transaction Hash:</span>
              <div className="hash-actions">
                <button
                  onClick={() => copyHash(status.onChainHash)}
                  className="hash-action-button"
                  title="Copy hash"
                >
                  <Copy className="w-4 h-4" />
                </button>
                <button
                  onClick={() => {
                    // Open block explorer (would need chain-specific URLs in real implementation)
                    window.open(`#/transaction/${status.onChainHash}`, '_blank')
                  }}
                  className="hash-action-button"
                  title="View on explorer"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
            <p className="hash-display">
              {status.onChainHash}
            </p>
            {copied && (
              <p className="hash-success-message">Hash copied to clipboard!</p>
            )}
          </div>
        )}

        {/* Error State */}
        {(error || !connectionStatus.connected) && (
          <div className="error-section">
            <p className="error-message">
              {error || 'Connection lost'}
            </p>
            <Button
              size="sm"
              variant="outline"
              onClick={retry}
              className="action-button-full"
            >
              Retry
            </Button>
          </div>
        )}

        {/* Action Buttons */}
        {(isCompleted || isFailed || isTimeout) && (
          <div className="action-buttons-row">
            <Button
              variant="outline"
              onClick={onClose}
              className="action-button-flex"
            >
              Close
            </Button>
            
            {(isFailed || isTimeout) && (
              <Button
                onClick={retry}
                className="action-button-flex"
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