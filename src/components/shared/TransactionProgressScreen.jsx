import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Loader2, CheckCircle, DollarSign, ArrowRight, CreditCard, Wallet, Send, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight, XCircle, Clock, Shield } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTransactionProgress } from '../../hooks/useTransactionStatus.js'
import { TRANSACTION_STATUS } from '../../services/transactions/TransactionStatusService.js'
import TransactionErrorHandler from './TransactionErrorHandler.jsx'
import diBoaSLogo from '../../assets/diboas-logo.png'

// Transaction configurations - moved outside component to prevent re-creation
const TRANSACTION_CONFIGS = {
  add: {
    icon: <ArrowDownLeft className="w-6 h-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    name: 'Deposit',
    steps: [
      'Validating payment method',
      'Processing payment',
      'Updating your balance',
      'Transaction completed'
    ]
  },
  withdraw: {
    icon: <ArrowUpRight className="w-6 h-6" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    name: 'Withdrawal',
    steps: [
      'Verifying available balance',
      'Processing withdrawal',
      'Transferring to your account',
      'Transaction completed'
    ]
  },
  send: {
    icon: <Send className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    name: 'Send Money',
    steps: [
      'Verifying recipient',
      'Processing transfer',
      'Updating balances',
      'Transaction completed'
    ]
  },
  receive: {
    icon: <ArrowDownLeft className="w-6 h-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    name: 'Receive Money',
    steps: [
      'Verifying sender',
      'Processing transfer',
      'Updating your balance',
      'Transaction completed'
    ]
  },
  transfer: {
    icon: <ArrowRight className="w-6 h-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    name: 'Transfer',
    steps: [
      'Validating external address',
      'Processing blockchain transfer',
      'Confirming on network',
      'Transaction completed'
    ]
  },
  buy: {
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    name: 'Buy Assets',
    steps: [
      'Finding best price',
      'Executing trade',
      'Updating portfolio',
      'Transaction completed'
    ]
  },
  sell: {
    icon: <TrendingDown className="w-6 h-6" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    name: 'Sell Assets',
    steps: [
      'Finding best price',
      'Executing trade',
      'Updating portfolio',
      'Transaction completed'
    ]
  }
}

/**
 * Transaction Progress Screen Component
 * Shows step-by-step progress during transaction execution
 */
export default function TransactionProgressScreen({ 
  transactionData,
  currentStep = 'Processing...',
  isCompleted = false,
  isError = false,
  errorMessage = '',
  fees = null,
  _result = null,
  transactionId = null, // New prop for real-time status tracking
  onConfirm,
  onCancel,
  flowState,
  _flowData,
  flowError
}) {
  const navigate = useNavigate()
  const [completedSteps, setCompletedSteps] = useState([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // Use real-time transaction status if transactionId is provided
  const {
    status: realTimeStatus,
    isLoading: _statusLoading,
    error: statusError,
    progress: realTimeProgress,
    progressText,
    progressColor,
    timeRemaining,
    onChainHash,
    confirmations,
    requiredConfirmations
  } = useTransactionProgress(transactionId)

  // Determine if we should use real-time status
  const useRealTimeStatus = transactionId && realTimeStatus
  const finalIsCompleted = useRealTimeStatus ? realTimeStatus.status === TRANSACTION_STATUS.COMPLETED : isCompleted
  const finalIsError = useRealTimeStatus ? 
    (realTimeStatus.status === TRANSACTION_STATUS.FAILED || realTimeStatus.status === TRANSACTION_STATUS.TIMEOUT) : 
    isError
  const finalErrorMessage = useRealTimeStatus && statusError ? statusError : errorMessage
  const finalError = flowError || (finalErrorMessage ? new Error(finalErrorMessage) : null)

  // Debug logging removed for production

  // Additional debugging for completion detection
  useEffect(() => {
    // Completion status tracking removed for production
  }, [finalIsCompleted])

  // Get transaction configuration with dynamic 'from' and 'to' fields
  const getTransactionConfig = (type) => {
    const baseConfig = TRANSACTION_CONFIGS[type] || TRANSACTION_CONFIGS.add
    
    // Helper function to format payment method names
    const formatPaymentMethod = (method) => {
      const methodMap = {
        'credit_debit_card': 'Credit/Debit Card',
        'bank_account': 'Bank Account',
        'apple_pay': 'Apple Pay',
        'google_pay': 'Google Pay',
        'paypal': 'PayPal',
        'diboas_wallet': 'diBoaS Wallet'
      }
      return methodMap[method] || method || 'Payment Method'
    }
    
    // Add dynamic from/to fields based on transaction type and data
    const fromToMap = {
      add: {
        from: formatPaymentMethod(transactionData?.paymentMethod),
        to: 'diBoaS Wallet Available Balance'
      },
      withdraw: {
        from: 'diBoaS Wallet Available Balance',
        to: formatPaymentMethod(transactionData?.paymentMethod)
      },
      send: {
        from: 'diBoaS Wallet Available Balance',
        to: transactionData?.recipient || 'Another diBoaS User'
      },
      receive: {
        from: 'Another diBoaS User',
        to: 'diBoaS Wallet Available Balance'
      },
      transfer: {
        from: 'diBoaS Wallet Available Balance',
        to: 'External Wallet'
      },
      buy: {
        from: transactionData?.paymentMethod === 'diboas_wallet' ? 'diBoaS Wallet Available Balance' : formatPaymentMethod(transactionData?.paymentMethod),
        to: 'diBoaS Wallet Invested Balance'
      },
      sell: {
        from: 'diBoaS Wallet Invested Balance',
        to: 'diBoaS Wallet Available Balance'
      }
    }

    return {
      ...baseConfig,
      ...(fromToMap[type] || fromToMap.add)
    }
  }

  const config = useMemo(() => getTransactionConfig(transactionData?.type), [
    transactionData?.type, 
    transactionData?.paymentMethod, 
    transactionData?.recipient, 
    transactionData?.asset
  ])

  // Memoize steps array to prevent re-render loops
  const steps = useMemo(() => config.steps, [config.steps.length, transactionData?.type])
  const stepsLength = useMemo(() => steps.length, [steps.length])

  // Update steps based on real-time status
  useEffect(() => {
    if (useRealTimeStatus && realTimeStatus) {
      const progress = realTimeProgress / 100
      const newStepIndex = Math.floor(progress * (stepsLength - 1))
      const newCompletedSteps = steps.slice(0, Math.max(0, newStepIndex))
      
      setCurrentStepIndex(newStepIndex)
      setCompletedSteps(newCompletedSteps)
    }
  }, [useRealTimeStatus, realTimeStatus, realTimeProgress, steps, stepsLength])

  // Simulate step progression (only when not using real-time status)
  useEffect(() => {
    if (useRealTimeStatus || finalIsCompleted || finalIsError) return

    const interval = setInterval(() => {
      setCurrentStepIndex(prev => {
        if (prev < stepsLength - 1) {
          setCompletedSteps(current => [...current, steps[prev]])
          return prev + 1
        }
        return prev
      })
    }, 1500) // Progress every 1.5 seconds

    return () => clearInterval(interval)
  }, [useRealTimeStatus, finalIsCompleted, finalIsError, stepsLength, steps])

  // Handle completion
  useEffect(() => {
    if (finalIsCompleted) {
      setCompletedSteps(steps)
      setCurrentStepIndex(stepsLength - 1)
    }
  }, [finalIsCompleted, steps, stepsLength])

  // Handle confirming state
  if (flowState === 'confirming') {
    return (
      <div className="main-layout center-content" style={{padding: '1rem'}}>
        <Card className="main-card" style={{width: '100%', maxWidth: '32rem'}}>
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <img src={diBoaSLogo} alt="diBoaS Logo" className="h-12 w-auto mx-auto mb-4" />
            </div>
            
            {/* Confirmation Icon */}
            <div className={`w-16 h-16 rounded-full ${config.bgColor} flex items-center justify-center mx-auto mb-6`}>
              <Shield className={`w-8 h-8 ${config.color}`} />
            </div>
            
            {/* Confirmation Message */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Confirm {config.name}
            </h2>
            <p className="text-gray-600 mb-6">
              Please review and confirm your transaction details.
            </p>
            
            {/* Transaction Summary */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-gray-600">Amount:</span>
                <span className="font-medium">${transactionData?.amount}</span>
              </div>
              {fees && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-600">Total Fees:</span>
                  <span className="font-medium">${(() => {
                    // Handle different fee data structures
                    const totalFee = fees.totalFees || fees.total || fees.totalFee || 0
                    const feeNumber = parseFloat(totalFee) || 0
                    return feeNumber.toFixed(2)
                  })()}</span>
                </div>
              )}
              <div className="border-t pt-2 mt-2">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-gray-600">From:</span>
                  <span className="font-medium text-sm">{config.from}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">To:</span>
                  <span className="font-medium text-sm">{config.to}</span>
                </div>
              </div>
            </div>
            
            {/* Confirmation Buttons */}
            <div className="space-y-3">
              <Button 
                className="w-full diboas-button"
                onClick={onConfirm}
              >
                Confirm Transaction
              </Button>
              <Button 
                variant="outline"
                className="w-full"
                onClick={onCancel}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (finalIsCompleted) {
    return (
      <div className="main-layout center-content" style={{padding: '1rem'}}>
        <Card className="main-card" style={{width: '100%', maxWidth: '32rem'}}>
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <img src={diBoaSLogo} alt="diBoaS Logo" className="h-12 w-auto mx-auto mb-4" />
            </div>
            
            {/* Success Icon */}
            <div className={`w-16 h-16 rounded-full ${config.bgColor} flex items-center justify-center mx-auto mb-6`}>
              <CheckCircle className={`w-8 h-8 ${config.color}`} />
            </div>
            
            {/* Success Message */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              {config.name} Successful!
            </h2>
            <p className="text-gray-600 mb-6">
              Your {config.name.toLowerCase()} has been completed successfully.
            </p>
            
            {/* Transaction Summary */}
            <div className="bg-gray-50 rounded-lg p-6 mb-6 text-left">
              <h3 className="font-semibold text-gray-900 mb-4">Transaction Summary</h3>
              
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Type:</span>
                  <span className="font-medium">{config.name}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">Amount:</span>
                  <span className="font-medium">${transactionData?.amount}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">From:</span>
                  <span className="font-medium">{config.from}</span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-gray-600">To:</span>
                  <span className="font-medium">{config.to}</span>
                </div>
                
                {/* Transaction Hash */}
                {onChainHash && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Transaction Hash:</span>
                    <span className="font-mono text-xs truncate max-w-32">{onChainHash}</span>
                  </div>
                )}
                
                {fees && (
                  <>
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Total Fees:</span>
                        <span>${fees.totalFees?.toFixed(2) || fees.total?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Net Amount:</span>
                        <span className={config.color}>
                          ${(parseFloat(transactionData.amount) - parseFloat(fees.totalFees || fees.total || 0)).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
            
            {/* Action Button */}
            <Button 
              className="w-full diboas-button"
              onClick={() => navigate('/app')}
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (finalIsError) {
    // Get current step name for error context
    const currentStepName = steps[currentStepIndex] || currentStep || 'Processing transaction'
    
    return (
      <TransactionErrorHandler
        error={finalError}
        transactionData={transactionData}
        currentStep={currentStepName}
        onRetry={() => {
          // Reset error state and go back to transaction form
          if (onCancel) onCancel()
          navigate(-1)
        }}
        onCancel={onCancel}
        onBackToDashboard={() => navigate('/app')}
        showTechnicalDetails={true}
      />
    )
  }

  // Progress Screen
  return (
    <div className="main-layout center-content" style={{padding: '1rem'}}>
      <Card className="main-card" style={{width: '100%', maxWidth: '32rem'}}>
        <CardContent className="p-8 text-center">
          <div className="mb-6">
            <img src={diBoaSLogo} alt="diBoaS Logo" className="h-12 w-auto mx-auto mb-4" />
          </div>
          
          {/* Transaction Icon & Title */}
          <div className={`w-16 h-16 rounded-full ${config.bgColor} flex items-center justify-center mx-auto mb-6`}>
            {config.icon}
          </div>
          
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Processing {config.name}
          </h2>
          
          {/* Transaction Flow Visualization */}
          <div className="flex items-center justify-center space-x-4 mb-6 p-4 bg-gray-50 rounded-lg">
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-gray-200 mb-2">
                <Wallet className="w-5 h-5 text-gray-600" />
              </div>
              <p className="text-xs text-gray-600 max-w-16 truncate">{config.from}</p>
            </div>
            
            <div className="flex-1 flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-gray-400" />
              <div className="text-lg font-bold mx-2">${transactionData?.amount}</div>
              <ArrowRight className="w-5 h-5 text-gray-400" />
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center border-2 border-gray-200 mb-2">
                <CreditCard className="w-5 h-5 text-gray-600" />
              </div>
              <p className="text-xs text-gray-600 max-w-16 truncate">{config.to}</p>
            </div>
          </div>
          
          {/* Current Step */}
          <div className="mb-6">
            <div className="flex items-center justify-center mb-4">
              <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
              <span className="font-medium text-gray-900">
                {useRealTimeStatus ? progressText : (steps[currentStepIndex] || currentStep)}
              </span>
            </div>
            
            {/* Real-time progress info */}
            {useRealTimeStatus && (
              <div className="mb-2">
                {timeRemaining && (
                  <p className="text-sm text-gray-600">
                    Estimated time remaining: {timeRemaining}
                  </p>
                )}
                {confirmations > 0 && (
                  <p className="text-sm text-gray-600">
                    Confirmations: {confirmations}/{requiredConfirmations}
                  </p>
                )}
              </div>
            )}
            
            <p className="text-sm text-gray-600">
              Please wait while we process your {config.name.toLowerCase()}...
            </p>
            
            {/* Real-time progress bar */}
            {useRealTimeStatus && (
              <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    progressColor === 'green' ? 'bg-green-500' :
                    progressColor === 'red' ? 'bg-red-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${realTimeProgress}%` }}
                ></div>
              </div>
            )}
          </div>
          
          {/* Progress Steps */}
          <div className="space-y-2 text-left">
            {steps.map((step, index) => (
              <div key={index} className="flex items-center text-sm">
                {completedSteps.includes(step) ? (
                  <CheckCircle className="w-4 h-4 text-green-500 mr-3" />
                ) : index === currentStepIndex ? (
                  <Loader2 className="w-4 h-4 animate-spin text-blue-600 mr-3" />
                ) : (
                  <div className="w-4 h-4 border-2 border-gray-300 rounded-full mr-3"></div>
                )}
                <span className={completedSteps.includes(step) ? 'text-green-600' : 'text-gray-600'}>
                  {step}
                </span>
              </div>
            ))}
          </div>
          
          {/* Security Note */}
          <div className="mt-6 p-3 bg-blue-50 rounded-lg">
            <p className="text-xs text-blue-700">
              🔒 Your transaction is secured with bank-level encryption
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}