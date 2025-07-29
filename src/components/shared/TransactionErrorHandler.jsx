/**
 * Enhanced Transaction Error Handler
 * Provides detailed user-friendly error messages with fund safety assurance
 */

import { Card, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  XCircle, 
  Clock, 
  AlertTriangle, 
  Shield, 
  RefreshCw, 
  ArrowLeft,
  Wifi,
  CreditCard,
  Server,
  Lock,
  AlertCircle
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import diBoaSLogo from '../../assets/diboas-logo.png'

// Error type mapping with detailed information
const ERROR_TYPES = {
  NETWORK_ERROR: {
    icon: <Wifi className="w-8 h-8 text-red-600" />,
    title: 'Network Connection Error',
    shortDescription: 'Unable to connect to our secure servers',
    detailedDescription: 'We couldn\'t establish a connection to process your transaction. This is usually a temporary connectivity issue.',
    fundsImpact: 'Your funds are completely safe and no charges were made.',
    suggestedActions: [
      'Check your internet connection',
      'Try again in a few moments',
      'Contact support if the issue persists'
    ],
    retryable: true,
    severity: 'medium'
  },
  PAYMENT_DECLINED: {
    icon: <CreditCard className="w-8 h-8 text-red-600" />,
    title: 'Payment Method Declined',
    shortDescription: 'Your payment method was declined by your bank',
    detailedDescription: 'Your bank or payment provider declined the transaction for security reasons. This is common with new merchants or large amounts.',
    fundsImpact: 'No charges were made to your account.',
    suggestedActions: [
      'Contact your bank to authorize diBoaS transactions',
      'Try a different payment method',
      'Ensure your card has sufficient funds and is not expired'
    ],
    retryable: true,
    severity: 'medium'
  },
  INSUFFICIENT_FUNDS: {
    icon: <AlertTriangle className="w-8 h-8 text-orange-600" />,
    title: 'Insufficient Funds',
    shortDescription: 'Not enough balance to complete this transaction',
    detailedDescription: 'The transaction amount exceeds your available balance after accounting for fees.',
    fundsImpact: 'Your existing funds remain secure and untouched.',
    suggestedActions: [
      'Add more funds to your diBoaS wallet',
      'Reduce the transaction amount',
      'Check the total fees in the transaction summary'
    ],
    retryable: true,
    severity: 'low'
  },
  TIMEOUT_ERROR: {
    icon: <Clock className="w-8 h-8 text-orange-600" />,
    title: 'Transaction Timeout',
    shortDescription: 'The transaction took too long to process',
    detailedDescription: 'The transaction exceeded our safety timeout limits. This prevents duplicate charges and protects your funds.',
    fundsImpact: 'No charges were processed and your funds are safe.',
    suggestedActions: [
      'Wait a few minutes before trying again',
      'Check your transaction history to confirm no duplicate charges',
      'Contact support if you see any unexpected transactions'
    ],
    retryable: true,
    severity: 'medium'
  },
  SERVER_ERROR: {
    icon: <Server className="w-8 h-8 text-red-600" />,
    title: 'Server Error',
    shortDescription: 'A technical error occurred on our end',
    detailedDescription: 'Our servers encountered an unexpected error while processing your transaction. Our team has been automatically notified.',
    fundsImpact: 'No charges were made and your funds remain secure.',
    suggestedActions: [
      'Wait a few minutes and try again',
      'Check our status page for any ongoing issues',
      'Contact support with the error details below'
    ],
    retryable: true,
    severity: 'high'
  },
  VALIDATION_ERROR: {
    icon: <AlertCircle className="w-8 h-8 text-orange-600" />,
    title: 'Transaction Validation Failed',
    shortDescription: 'The transaction details couldn\'t be validated',
    detailedDescription: 'One or more transaction details failed our security validation checks. This protects against fraudulent transactions.',
    fundsImpact: 'No funds were transferred and your account is secure.',
    suggestedActions: [
      'Double-check all transaction details',
      'Ensure recipient information is correct',
      'Try reducing the transaction amount'
    ],
    retryable: true,
    severity: 'medium'
  },
  BLOCKCHAIN_ERROR: {
    icon: <Lock className="w-8 h-8 text-red-600" />,
    title: 'Blockchain Network Error',
    shortDescription: 'Unable to broadcast transaction to the blockchain',
    detailedDescription: 'The blockchain network is experiencing high congestion or technical difficulties. Your transaction couldn\'t be submitted.',
    fundsImpact: 'No blockchain transaction was created and your funds are safe.',
    suggestedActions: [
      'Wait for network congestion to clear',
      'Try again in 10-15 minutes',
      'Consider using a different payment method'
    ],
    retryable: true,
    severity: 'high'
  },
  UNKNOWN_ERROR: {
    icon: <XCircle className="w-8 h-8 text-red-600" />,
    title: 'Unexpected Error',
    shortDescription: 'An unexpected error occurred',
    detailedDescription: 'We encountered an error we haven\'t seen before. Our team has been notified and is investigating.',
    fundsImpact: 'Your funds are protected and no charges were made.',
    suggestedActions: [
      'Try the transaction again',
      'Contact support with the error details',
      'Check back later if the issue persists'
    ],
    retryable: true,
    severity: 'high'
  }
}

// Transaction step mapping for specific error context
const TRANSACTION_STEPS = {
  'add': {
    'Validating payment method': 'PAYMENT_DECLINED',
    'Processing payment': 'PAYMENT_DECLINED',
    'Updating your balance': 'SERVER_ERROR',
    'Transaction completed': 'SERVER_ERROR'
  },
  'withdraw': {
    'Verifying available balance': 'INSUFFICIENT_FUNDS',
    'Processing withdrawal': 'SERVER_ERROR',
    'Transferring to your account': 'BLOCKCHAIN_ERROR',
    'Transaction completed': 'SERVER_ERROR'
  },
  'send': {
    'Verifying recipient': 'VALIDATION_ERROR',
    'Processing transfer': 'INSUFFICIENT_FUNDS',
    'Updating balances': 'SERVER_ERROR',
    'Transaction completed': 'SERVER_ERROR'
  },
  'buy': {
    'Validating payment method': 'PAYMENT_DECLINED',
    'Executing trade': 'SERVER_ERROR',
    'Updating portfolio': 'SERVER_ERROR',
    'Transaction completed': 'SERVER_ERROR'
  },
  'sell': {
    'Verifying holdings': 'INSUFFICIENT_FUNDS',
    'Executing trade': 'SERVER_ERROR',
    'Updating portfolio': 'SERVER_ERROR',
    'Transaction completed': 'SERVER_ERROR'
  }
}

/**
 * Analyzes error message and context to determine error type
 */
function determineErrorType(error, transactionType, currentStep) {
  if (!error) return 'UNKNOWN_ERROR'
  
  const errorMessage = error.message || error.toString().toLowerCase()
  
  // Network-related errors
  if (errorMessage.includes('network') || errorMessage.includes('connection') || 
      errorMessage.includes('fetch') || errorMessage.includes('timeout')) {
    return errorMessage.includes('timeout') ? 'TIMEOUT_ERROR' : 'NETWORK_ERROR'
  }
  
  // Payment-related errors
  if (errorMessage.includes('declined') || errorMessage.includes('card') || 
      errorMessage.includes('payment') || errorMessage.includes('insufficient')) {
    return errorMessage.includes('insufficient') ? 'INSUFFICIENT_FUNDS' : 'PAYMENT_DECLINED'
  }
  
  // Blockchain-related errors
  if (errorMessage.includes('blockchain') || errorMessage.includes('broadcast') ||
      errorMessage.includes('mining') || errorMessage.includes('gas')) {
    return 'BLOCKCHAIN_ERROR'
  }
  
  // Server errors
  if (errorMessage.includes('server') || errorMessage.includes('500') || 
      errorMessage.includes('internal')) {
    return 'SERVER_ERROR'
  }
  
  // Validation errors
  if (errorMessage.includes('validation') || errorMessage.includes('invalid') ||
      errorMessage.includes('format')) {
    return 'VALIDATION_ERROR'
  }
  
  // Use transaction step context if available
  if (transactionType && currentStep && TRANSACTION_STEPS[transactionType]) {
    const stepErrorType = TRANSACTION_STEPS[transactionType][currentStep]
    if (stepErrorType) return stepErrorType
  }
  
  return 'UNKNOWN_ERROR'
}

/**
 * Enhanced Transaction Error Handler Component
 */
export default function TransactionErrorHandler({
  error,
  transactionData,
  currentStep,
  onRetry,
  onCancel,
  onBackToDashboard,
  showTechnicalDetails = false
}) {
  const navigate = useNavigate()
  
  // Determine error type and get configuration
  const errorType = determineErrorType(error, transactionData?.type, currentStep)
  const errorConfig = ERROR_TYPES[errorType]
  
  // Generate error ID for support reference
  const errorId = `ERR-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`
  
  // Get severity styling
  const severityStyles = {
    low: 'bg-orange-50 border-orange-200',
    medium: 'bg-red-50 border-red-200', 
    high: 'bg-red-100 border-red-300'
  }
  
  const severityTextStyles = {
    low: 'text-orange-800',
    medium: 'text-red-800',
    high: 'text-red-900'
  }

  return (
    <div className="main-layout center-content" style={{padding: '1rem'}}>
      <Card className={`main-card border-2 ${severityStyles[errorConfig.severity]}`} style={{width: '100%', maxWidth: '36rem'}}>
        <CardContent className="p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <img src={diBoaSLogo} alt="diBoaS Logo" className="h-12 w-auto mx-auto mb-4" />
            
            {/* Error Icon */}
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center mx-auto mb-4 shadow-sm">
              {errorConfig.icon}
            </div>
            
            {/* Error Title */}
            <h2 className={`text-2xl font-bold mb-2 ${severityTextStyles[errorConfig.severity]}`}>
              {errorConfig.title}
            </h2>
            
            {/* Error ID */}
            <div className="flex justify-center mb-4">
              <Badge variant="secondary" className="text-xs font-mono">
                Error ID: {errorId}
              </Badge>
            </div>
          </div>

          {/* Fund Safety Assurance - Most Important */}
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-green-800 mb-1">Your Funds Are Safe</h3>
                <p className="text-green-700 text-sm">{errorConfig.fundsImpact}</p>
              </div>
            </div>
          </div>

          {/* Error Description */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">What Happened?</h3>
            <p className="text-gray-700 mb-2">{errorConfig.shortDescription}</p>
            <p className="text-gray-600 text-sm">{errorConfig.detailedDescription}</p>
          </div>

          {/* Transaction Context */}
          {transactionData && (
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <h3 className="font-semibold text-gray-900 mb-3">Transaction Details</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium capitalize">{transactionData.type}</span>
                </div>
                {transactionData.amount && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">${transactionData.amount}</span>
                  </div>
                )}
                {currentStep && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Failed at step:</span>
                    <span className="font-medium">{currentStep}</span>
                  </div>
                )}
                {transactionData.paymentMethod && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment Method:</span>
                    <span className="font-medium capitalize">{transactionData.paymentMethod.replace('_', ' ')}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Suggested Actions */}
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-3">What You Can Do</h3>
            <ul className="space-y-2">
              {errorConfig.suggestedActions.map((action, index) => (
                <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="w-1.5 h-1.5 bg-gray-400 rounded-full mt-2 flex-shrink-0"></span>
                  <span>{action}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Technical Details (Collapsible) */}
          {showTechnicalDetails && error && (
            <div className="mb-6">
              <details className="bg-gray-50 rounded-lg p-4">
                <summary className="font-semibold text-gray-900 cursor-pointer hover:text-gray-700">
                  Technical Details (for support)
                </summary>
                <div className="mt-3 pt-3 border-t border-gray-200">
                  <div className="space-y-2 text-xs font-mono text-gray-600">
                    <div>
                      <strong>Error:</strong> {error.message || error.toString()}
                    </div>
                    <div>
                      <strong>Type:</strong> {error.name || 'Unknown'}
                    </div>
                    <div>
                      <strong>Timestamp:</strong> {new Date().toISOString()}
                    </div>
                    {error.stack && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                          {error.stack}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              </details>
            </div>
          )}

          {/* Action Buttons */}
          <div className="space-y-3">
            {errorConfig.retryable && onRetry && (
              <Button 
                className="w-full diboas-button"
                onClick={onRetry}
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            )}
            
            <div className="grid grid-cols-2 gap-3">
              <Button 
                variant="outline"
                className="w-full"
                onClick={onCancel || (() => navigate(-1))}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Go Back
              </Button>
              
              <Button 
                variant="outline"
                className="w-full"
                onClick={onBackToDashboard || (() => navigate('/app'))}
              >
                Dashboard
              </Button>
            </div>
            
            {/* Support Contact */}
            <div className="text-center pt-4 border-t border-gray-200">
              <p className="text-sm text-gray-600 mb-2">
                Still having trouble? Our support team is here to help.
              </p>
              <Button 
                variant="link" 
                className="text-blue-600 hover:text-blue-800 p-0 h-auto"
                onClick={() => {
                  // In a real app, this would open support chat or email
                  window.open(`mailto:support@diboas.com?subject=Transaction Error ${errorId}&body=Error Details: ${error?.message || 'Unknown error'}`, '_blank')
                }}
              >
                Contact Support (Reference: {errorId})
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Export error type determination for use in other components
export { determineErrorType, ERROR_TYPES }