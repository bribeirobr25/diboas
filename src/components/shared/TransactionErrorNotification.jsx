/**
 * Transaction Error Notification
 * Auto-dismissing notifications for transaction failures with specific error messaging and recovery actions
 */

import { useState, useEffect, useCallback } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { 
  AlertTriangle, 
  CreditCard, 
  Wifi, 
  Shield, 
  Clock, 
  DollarSign,
  X,
  RefreshCw,
  ArrowLeft,
  ExternalLink
} from 'lucide-react'
import { useErrorRecovery } from '../../hooks/useErrorRecovery.jsx'
import { PaymentError } from '../../services/integrations/payments/PaymentError.js'
import { ERROR_TYPES, ERROR_SEVERITY } from '../../services/errorHandling/ErrorRecoveryService.js'
import logger from '../../utils/logger.js'

/**
 * Get appropriate icon for error type
 */
const getErrorIcon = (errorCode) => {
  const iconMap = {
    insufficient_funds: DollarSign,
    card_declined: CreditCard,
    invalid_amount: DollarSign,
    currency_not_supported: DollarSign,
    payment_method_not_supported: CreditCard,
    limit_exceeded: Shield,
    network_error: Wifi,
    provider_unavailable: Clock,
    authentication_failed: Shield,
    fraud_detected: Shield,
    expired_card: CreditCard,
    invalid_card: CreditCard,
    processing_error: AlertTriangle,
    timeout: Clock,
    rate_limit: Clock,
    unknown_error: AlertTriangle
  }
  
  return iconMap[errorCode] || AlertTriangle
}

/**
 * Get error severity color scheme
 */
const getErrorColorScheme = (severity) => {
  const schemes = {
    critical: {
      alert: "border-red-200 bg-red-50",
      icon: "bg-red-100 text-red-600",
      title: "text-red-900",
      desc: "text-red-700",
      badge: "destructive"
    },
    high: {
      alert: "border-orange-200 bg-orange-50", 
      icon: "bg-orange-100 text-orange-600",
      title: "text-orange-900",
      desc: "text-orange-700",
      badge: "warning"
    },
    medium: {
      alert: "border-yellow-200 bg-yellow-50",
      icon: "bg-yellow-100 text-yellow-600", 
      title: "text-yellow-900",
      desc: "text-yellow-700",
      badge: "secondary"
    },
    low: {
      alert: "border-blue-200 bg-blue-50",
      icon: "bg-blue-100 text-blue-600",
      title: "text-blue-900", 
      desc: "text-blue-700",
      badge: "secondary"
    }
  }
  
  return schemes[severity] || schemes.medium
}

/**
 * Auto-dismissing transaction error notification
 */
export function TransactionErrorNotification({ 
  error, 
  onDismiss, 
  onRetry, 
  onGoBack,
  autoDismissDelay = 3000,
  showAutoDismiss = true,
  transactionData = null
}) {
  const [isVisible, setIsVisible] = useState(true)
  const [timeRemaining, setTimeRemaining] = useState(autoDismissDelay / 1000)
  const [isPaused, setIsPaused] = useState(false)
  const { handleError } = useErrorRecovery()

  // Handle null/undefined error
  if (!error) {
    return null
  }

  // Parse error information
  const isPaymentError = error instanceof PaymentError
  const errorCode = isPaymentError ? error.errorCode : 'unknown_error'
  const userMessage = isPaymentError ? error.getUserMessage() : (error?.message || 'An unknown error occurred')
  const suggestedActions = isPaymentError ? error.getSuggestedActions() : ['Try again', 'Contact support']
  const isRetryable = isPaymentError ? error.isRetryable() : true
  const requiresUserAction = isPaymentError ? error.requiresUserAction() : false

  // Determine severity based on error type
  const severity = (() => {
    if (errorCode === 'fraud_detected' || errorCode === 'authentication_failed') return 'critical'
    if (errorCode === 'card_declined' || errorCode === 'insufficient_funds') return 'high'
    if (errorCode === 'network_error' || errorCode === 'timeout') return 'medium'
    return 'medium'
  })()

  const colorScheme = getErrorColorScheme(severity)
  const IconComponent = getErrorIcon(errorCode)

  // Auto-dismiss timer
  useEffect(() => {
    if (!showAutoDismiss || isPaused || !isVisible) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          setIsVisible(false)
          if (onDismiss) onDismiss()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [showAutoDismiss, isPaused, isVisible, onDismiss])

  // Log error for analytics
  useEffect(() => {
    handleError({
      type: ERROR_TYPES.TRANSACTION_ERROR,
      severity: ERROR_SEVERITY[severity.toUpperCase()],
      message: `Transaction failed: ${userMessage}`,
      context: {
        errorCode,
        transactionData: transactionData ? {
          type: transactionData.type,
          amount: transactionData.amount?.toString(),
          asset: transactionData.asset
        } : null,
        paymentProvider: isPaymentError ? error.provider : null
      }
    })
  }, [error, errorCode, userMessage, transactionData, isPaymentError, handleError, severity])

  const handleManualDismiss = useCallback(() => {
    setIsVisible(false)
    if (onDismiss) onDismiss()
  }, [onDismiss])

  const handleRetryClick = useCallback(() => {
    if (onRetry) {
      onRetry()
    }
    handleManualDismiss()
  }, [onRetry, handleManualDismiss])

  const handleGoBackClick = useCallback(() => {
    if (onGoBack) {
      onGoBack()
    } else {
      window.history.back()
    }
    handleManualDismiss()
  }, [onGoBack, handleManualDismiss])

  if (!isVisible) return null

  return (
    <div 
      className="fixed top-4 right-4 z-50 max-w-md w-full mx-4 transition-all duration-300 ease-in-out"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Alert className={`${colorScheme.alert} border-2 shadow-lg`}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`p-2 rounded-lg ${colorScheme.icon} flex-shrink-0`}>
            <IconComponent className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <h4 className={`font-semibold text-sm ${colorScheme.title}`}>
                Transaction Failed
              </h4>
              <Badge variant={colorScheme.badge} className="text-xs">
                {errorCode.replace(/_/g, ' ').toUpperCase()}
              </Badge>
            </div>

            <AlertDescription className={`text-sm ${colorScheme.desc} mb-3`}>
              {userMessage}
            </AlertDescription>

            {/* Transaction Details */}
            {transactionData && (
              <div className="text-xs text-gray-600 mb-3 p-2 bg-white rounded border">
                <div><strong>Type:</strong> {transactionData.type}</div>
                {transactionData.amount && (
                  <div><strong>Amount:</strong> {transactionData.amount.toString()}</div>
                )}
                {transactionData.asset && (
                  <div><strong>Asset:</strong> {transactionData.asset}</div>
                )}
              </div>
            )}

            {/* Suggested Actions */}
            {suggestedActions.length > 0 && (
              <div className="text-xs text-gray-600 mb-3">
                <strong>What you can do:</strong>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  {suggestedActions.slice(0, 3).map((action, index) => (
                    <li key={index}>{action}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 mb-3">
              {isRetryable && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleRetryClick}
                  className="text-xs"
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  Retry
                </Button>
              )}

              <Button
                size="sm"
                variant="outline"
                onClick={handleGoBackClick}
                className="text-xs"
              >
                <ArrowLeft className="w-3 h-3 mr-1" />
                Go Back
              </Button>

              {requiresUserAction && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => window.open('/account', '_blank')}
                  className="text-xs"
                >
                  <ExternalLink className="w-3 h-3 mr-1" />
                  Account
                </Button>
              )}
            </div>

            {/* Auto-dismiss timer */}
            {showAutoDismiss && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>Auto-closing in {timeRemaining}s</span>
                  <span className="text-xs">
                    {isPaused ? 'Paused' : 'Hover to pause'}
                  </span>
                </div>
                <Progress 
                  value={(timeRemaining / (autoDismissDelay / 1000)) * 100} 
                  className="h-1"
                />
              </div>
            )}
          </div>

          {/* Dismiss Button */}
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualDismiss}
            className="p-1 h-auto flex-shrink-0"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </Alert>
    </div>
  )
}

/**
 * Hook for managing transaction error notifications
 */
export function useTransactionErrorNotification() {
  const [errorNotification, setErrorNotification] = useState(null)

  const showTransactionError = useCallback((error, transactionData = null, options = {}) => {
    setErrorNotification({
      error,
      transactionData,
      ...options,
      id: Date.now()
    })
  }, [])

  const hideTransactionError = useCallback(() => {
    setErrorNotification(null)
  }, [])

  const TransactionErrorComponent = errorNotification ? (
    <TransactionErrorNotification
      key={errorNotification.id}
      error={errorNotification.error}
      transactionData={errorNotification.transactionData}
      onDismiss={hideTransactionError}
      onRetry={errorNotification.onRetry}
      onGoBack={errorNotification.onGoBack}
      autoDismissDelay={errorNotification.autoDismissDelay}
      showAutoDismiss={errorNotification.showAutoDismiss}
    />
  ) : null

  return {
    showTransactionError,
    hideTransactionError,
    TransactionErrorComponent,
    hasError: !!errorNotification
  }
}

export default TransactionErrorNotification