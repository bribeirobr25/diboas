/**
 * Enhanced Transaction Progress Screen with On-Chain Status Integration
 * Shows step-by-step progress with real blockchain confirmation
 */

import { useState, useEffect, useMemo, useRef } from 'react'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import logger from '../../utils/logger'
import { 
  Loader2, CheckCircle, XCircle, Clock, ExternalLink, 
  ArrowDownLeft, ArrowUpRight, Send, ArrowRight, 
  TrendingUp, TrendingDown, Shield, AlertTriangle 
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useOnChainStatus } from '../../hooks/useOnChainStatus.js'
import { TRANSACTION_STATUS } from '../../services/onchain/OnChainStatusProvider.js'
import diBoaSLogo from '../../assets/diboas-logo.png'
import { dataManager } from '../../services/DataManager.js'

/**
 * Transaction Success Screen Component with Auto-Navigation
 */
function SuccessScreen({ 
  config, 
  transactionData, 
  onChainStatus, 
  renderExplorerLink, 
  navigate 
}) {
  const [countdown, setCountdown] = useState(3)
  const [isRedirecting, setIsRedirecting] = useState(false)

  // Auto-redirect countdown timer
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setIsRedirecting(true)
          setTimeout(() => {
            navigate('/app')
          }, 500)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [navigate])

  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50 pointer-events-none">
      <Card className="w-full max-w-md mx-4 bg-white shadow-2xl border border-gray-300 pointer-events-auto">
        <CardContent className="p-6 bg-white">
          <div className="text-center">
            <div className="mb-4">
              <CheckCircle className="w-16 h-16 text-green-500 mx-auto" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {config.name} Successful! 🎉
            </h2>
            
            <p className="text-gray-600 mb-4">
              Your {config.name.toLowerCase()} has been completed successfully.
            </p>

            {/* Transaction details */}
            <div className="bg-gray-50 rounded-lg p-4 mb-4 text-left">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">From:</span>
                  <span className="font-medium">{config.from}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">To:</span>
                  <span className="font-medium">{config.to}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Amount:</span>
                  <span className="font-medium">${transactionData?.amount || '0.00'}</span>
                </div>
                {onChainStatus?.confirmedAt && (
                  <div className="flex justify-between">
                    <span className="text-gray-500">Confirmed:</span>
                    <span className="font-medium text-xs">
                      {new Date(onChainStatus.confirmedAt).toLocaleTimeString()}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {renderExplorerLink()}

            {/* Auto-redirect countdown */}
            <div className="mb-4">
              <p className="text-xs text-gray-500">
                {isRedirecting ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Returning to dashboard...
                  </span>
                ) : (
                  `Returning to dashboard in ${countdown} seconds...`
                )}
              </p>
            </div>
            
            <Button
              onClick={() => navigate('/app')}
              className="w-full"
              disabled={isRedirecting}
            >
              Back to Dashboard Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

/**
 * Transaction Error Screen Component with Auto-Dismiss and Failed Transaction Storage
 */
function TransactionErrorScreen({ 
  errorMsg, 
  currentStepIndex, 
  config, 
  transactionData, 
  flowData, 
  flowError, 
  renderExplorerLink, 
  navigate 
}) {
  const [countdown, setCountdown] = useState(3)
  const [isRedirecting, setIsRedirecting] = useState(false)
  const hasStoredTransaction = useRef(false)

  // Get the specific step that failed
  const failedStep = config.steps[currentStepIndex] || config.steps[0]
  
  // Determine which step of the process failed based on error message
  const getFailedStepFromError = (error) => {
    const errorMessage = error?.toLowerCase() || ''
    
    if (errorMessage.includes('validation') || errorMessage.includes('invalid')) {
      return { stepIndex: 0, stepName: config.steps[0] }
    } else if (errorMessage.includes('broadcast') || errorMessage.includes('network') || errorMessage.includes('submit')) {
      return { stepIndex: 1, stepName: config.steps[1] }
    } else if (errorMessage.includes('confirmation') || errorMessage.includes('blockchain')) {
      return { stepIndex: 2, stepName: config.steps[2] }
    } else {
      return { stepIndex: 3, stepName: config.steps[3] }
    }
  }

  const failedStepInfo = getFailedStepFromError(errorMsg)

  // Store failed transaction in history once and start countdown
  useEffect(() => {
    // Only store the failed transaction once
    if (!hasStoredTransaction.current) {
      hasStoredTransaction.current = true
      
      // Capture values at the time of first render
      const capturedTransactionData = transactionData
      const capturedFlowData = flowData
      const capturedErrorMsg = errorMsg
      const capturedConfig = config
      const capturedFailedStepInfo = failedStepInfo
      
      const storeFailedTransaction = async () => {
        try {
          logger.debug('📝 Storing failed transaction in history:', {
            transactionData: capturedTransactionData,
            flowData: capturedFlowData,
            error: capturedErrorMsg
          })

          await dataManager.addTransaction({
            id: `failed_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
            type: capturedTransactionData?.type || 'unknown',
            amount: capturedTransactionData?.amount || 0,
            currency: capturedTransactionData?.currency || 'USD',
            status: 'failed',
            description: `Failed ${capturedConfig.name}: ${capturedFailedStepInfo.stepName}`,
            recipient: capturedTransactionData?.recipient,
            paymentMethod: capturedTransactionData?.paymentMethod,
            timestamp: Date.now(),
            error: capturedErrorMsg,
            failedStep: capturedFailedStepInfo.stepName,
            failedStepIndex: capturedFailedStepInfo.stepIndex
          })

          logger.debug('✅ Failed transaction stored successfully')
        } catch (error) {
          logger.error('❌ Failed to store failed transaction:', error)
        }
      }

      // Store the failed transaction
      storeFailedTransaction()
    }

    // Start countdown timer
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setIsRedirecting(true)
          setTimeout(() => {
            navigate('/app')
          }, 500)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [transactionData, flowData, errorMsg, config, failedStepInfo, navigate]) // Dependencies for capturing values

  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50 pointer-events-none">
      <Card className="w-full max-w-md mx-4 bg-white shadow-2xl border border-gray-300 pointer-events-auto">
        <CardContent className="p-6 bg-white">
          <div className="text-center">
            <div className="mb-4">
              <XCircle className="w-16 h-16 text-red-500 mx-auto" />
            </div>
            
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              Transaction Failed
            </h2>
            
            <div className="mb-4">
              <p className="text-gray-600 text-sm mb-2">
                {config.name} failed during:
              </p>
              <p className="text-red-600 font-medium text-sm">
                "{failedStepInfo.stepName}"
              </p>
            </div>

            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
              <div className="flex items-start">
                <Shield className="w-5 h-5 text-green-600 mt-0.5 mr-3 flex-shrink-0" />
                <div className="text-left">
                  <p className="text-sm font-medium text-green-800 mb-1">
                    Your funds are safe
                  </p>
                  <p className="text-xs text-green-700">
                    No changes were made to your balance. The transaction was stopped before any funds were moved.
                  </p>
                </div>
              </div>
            </div>

            {/* Error details */}
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-gray-600 text-left">
                <span className="font-medium">Error details:</span><br />
                {errorMsg}
              </p>
            </div>

            {renderExplorerLink()}

            {/* Auto-redirect countdown */}
            <div className="mb-4">
              <p className="text-xs text-gray-500">
                {isRedirecting ? (
                  <span className="flex items-center justify-center">
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Returning to dashboard...
                  </span>
                ) : (
                  `Returning to dashboard in ${countdown} seconds...`
                )}
              </p>
            </div>
            
            <Button
              onClick={() => navigate('/app')}
              className="w-full"
              disabled={isRedirecting}
            >
              Return to Dashboard Now
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Transaction configurations with on-chain aware steps
const TRANSACTION_CONFIGS = {
  add: {
    icon: <ArrowDownLeft className="w-6 h-6" />,
    color: 'text-green-600',
    bgColor: 'bg-green-50',
    name: 'Deposit',
    steps: [
      'Processing payment method',
      'Submitting to blockchain',
      'Confirming on Solana network',
      'Updating your balance'
    ]
  },
  withdraw: {
    icon: <ArrowUpRight className="w-6 h-6" />,
    color: 'text-red-600',
    bgColor: 'bg-red-50',
    name: 'Withdrawal',
    steps: [
      'Verifying available balance',
      'Submitting to blockchain',
      'Confirming transaction',
      'Processing withdrawal'
    ]
  },
  send: {
    icon: <Send className="w-6 h-6" />,
    color: 'text-blue-600',
    bgColor: 'bg-blue-50',
    name: 'Send Money',
    steps: [
      'Verifying recipient',
      'Submitting to Solana',
      'Confirming on blockchain',
      'Updating balances'
    ]
  },
  transfer: {
    icon: <ArrowRight className="w-6 h-6" />,
    color: 'text-purple-600',
    bgColor: 'bg-purple-50',
    name: 'Transfer',
    steps: [
      'Validating external address',
      'Submitting cross-chain transfer',
      'Waiting for blockchain confirmation',
      'Transfer completed'
    ]
  },
  buy: {
    icon: <TrendingUp className="w-6 h-6" />,
    color: 'text-indigo-600',
    bgColor: 'bg-indigo-50',
    name: 'Buy Assets',
    steps: [
      'Processing payment',
      'Executing blockchain trade',
      'Confirming on network',
      'Updating portfolio'
    ]
  },
  sell: {
    icon: <TrendingDown className="w-6 h-6" />,
    color: 'text-orange-600',
    bgColor: 'bg-orange-50',
    name: 'Sell Assets',
    steps: [
      'Preparing asset sale',
      'Executing blockchain trade',
      'Confirming transaction',
      'Updating balance'
    ]
  }
}

/**
 * Enhanced Transaction Progress Screen Component
 */
export default function EnhancedTransactionProgressScreen({ 
  transactionData,
  transactionId = null,
  onConfirm,
  onCancel,
  flowState,
  flowData,
  flowError
}) {
  const navigate = useNavigate()
  const [completedSteps, setCompletedSteps] = useState([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)
  const [showDetails, setShowDetails] = useState(false)
  const [autoProgressTimer, setAutoProgressTimer] = useState(null)
  const [forceCompleted, setForceCompleted] = useState(false)

  // Use on-chain status tracking
  const {
    status: onChainStatus,
    isLoading: isOnChainLoading,
    error: onChainError,
    isPending,
    isConfirming,
    isConfirmed,
    isFailed,
    progress,
    explorerLink,
    txHash,
    chain
  } = useOnChainStatus(transactionId, {
    onConfirmed: (status) => {
      // Transaction confirmed on blockchain
      logger.debug('🎉 Transaction confirmed on blockchain:', status)
    },
    onFailed: (status) => {
      // Transaction failed on blockchain
      logger.debug('❌ Transaction failed on blockchain:', status)
    }
  })

  // Debug logging
  useEffect(() => {
    console.log('🔍 Enhanced Progress Screen Debug:', {
      transactionId,
      onChainStatus: onChainStatus,
      flowState,
      isConfirmed,
      isFailed,
      autoProgressTimer
    })
    logger.debug('🔍 Progress Screen Debug:', {
      transactionId,
      onChainStatus: onChainStatus,
      flowState,
      isConfirmed,
      isFailed
    })
  }, [transactionId, onChainStatus, flowState, isConfirmed, isFailed, autoProgressTimer])

  // Debug logging for transaction simulation status
  useEffect(() => {
    logger.debug('🎯 Transaction Status Simulation Check:', {
      transactionId,
      flowState,
      onChainStatus: onChainStatus?.status,
      txHash: onChainStatus?.txHash,
      confirmations: onChainStatus?.confirmations,
      isOnChainLoading,
      onChainError
    })
  }, [transactionId, flowState, onChainStatus, isOnChainLoading, onChainError])

  // Auto-progress timer for when transaction is confirmed but on-chain status is delayed
  useEffect(() => {
    if (flowState === 'pending_blockchain' && !onChainStatus && !autoProgressTimer) {
      logger.debug('⏱️ Setting auto-progress timer for pending blockchain transaction')
      // After 5 seconds of being in pending_blockchain state without on-chain status,
      // auto-progress to completing steps
      const timer = setTimeout(() => {
        logger.debug('🔄 Auto-progressing transaction due to delayed on-chain status')
        // Force show success screen by updating current status
        setForceCompleted(true)
      }, 8000) // 8 seconds to allow for confirmation
      
      setAutoProgressTimer(timer)
    }
    
    // Clear timer if we get on-chain status or state changes
    if ((onChainStatus || flowState !== 'pending_blockchain') && autoProgressTimer) {
      logger.debug('⏹️ Clearing auto-progress timer - got on-chain status or state changed')
      clearTimeout(autoProgressTimer)
      setAutoProgressTimer(null)
    }
    
    return () => {
      if (autoProgressTimer) {
        clearTimeout(autoProgressTimer)
      }
    }
  }, [flowState, onChainStatus, autoProgressTimer, navigate])

  // Get transaction configuration
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
      ...fromToMap[type]
    }
  }

  // Determine current status based on on-chain status or flow state
  const currentStatus = useMemo(() => {
    console.log('🎯 Determining currentStatus:', {
      onChainStatus: onChainStatus?.status,
      flowState,
      hasOnChainStatus: !!onChainStatus,
      forceCompleted
    })
    
    // If forced completed (due to auto-progress), show completed
    if (forceCompleted) {
      console.log('✅ Force completed - returning completed')
      return 'completed'
    }
    
    // If we have on-chain status, use it
    if (onChainStatus) {
      const status = onChainStatus.status
      console.log('📡 Using on-chain status:', status)
      switch (status) {
        case TRANSACTION_STATUS.PENDING:
          return 'pending_blockchain'
        case TRANSACTION_STATUS.CONFIRMING:
          return 'confirming'
        case TRANSACTION_STATUS.CONFIRMED:
          console.log('✅ On-chain status is CONFIRMED - returning completed')
          return 'completed'
        case TRANSACTION_STATUS.FAILED:
          console.log('❌ On-chain status is FAILED - returning failed')
          return 'failed'
        default:
          return 'processing'
      }
    }
    
    // If no on-chain status but we have flowState, use appropriate mapping
    if (flowState) {
      console.log('🔄 Using flow state:', flowState)
      switch (flowState) {
        case 'pending_blockchain':
          return 'confirming' // Move to confirming if we're pending blockchain
        case 'completed':
          console.log('✅ Flow state is completed - returning completed')
          return 'completed'
        case 'failed':
        case 'error':
          console.log('❌ Flow state is failed/error - returning failed')
          return 'failed'
        default:
          return flowState
      }
    }
    
    console.log('⚠️ No status available - defaulting to processing') 
    return 'processing'
  }, [onChainStatus, flowState, forceCompleted])

  // Get transaction configuration
  const config = getTransactionConfig(transactionData?.type || 'add')

  // Update steps based on current status
  useEffect(() => {
    let stepIndex = 0
    let completed = []

    switch (currentStatus) {
      case 'processing':
        stepIndex = 0
        completed = []
        break
      case 'pending_blockchain':
        stepIndex = 1
        completed = [0]
        break
      case 'confirming':
        stepIndex = 2
        completed = [0, 1]
        break
      case 'completed':
        stepIndex = 3
        completed = [0, 1, 2, 3]
        break
      case 'failed':
      case 'error':
        completed = []
        break
    }

    setCurrentStepIndex(stepIndex)
    setCompletedSteps(completed)
  }, [currentStatus])

  // Render step status icon
  const renderStepIcon = (stepIndex) => {
    if (completedSteps.includes(stepIndex)) {
      return <CheckCircle className="w-5 h-5 text-green-600" />
    } else if (stepIndex === currentStepIndex) {
      return <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
    } else {
      return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  // Render confirmation progress for on-chain transactions
  const renderOnChainProgress = () => {
    if (!onChainStatus || !progress) return null

    return (
      <div className="mt-4 p-4 bg-blue-50 rounded-lg">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-blue-800">
            Blockchain Confirmation
          </span>
          <span className="text-xs text-blue-600">
            {progress.current}/{progress.required} confirmations
          </span>
        </div>
        <div className="w-full bg-blue-200 rounded-full h-2">
          <div 
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        {chain && (
          <div className="mt-2 text-xs text-blue-600">
            Network: {chain}
          </div>
        )}
      </div>
    )
  }

  // Render explorer link
  const renderExplorerLink = () => {
    if (!explorerLink || !txHash) return null

    return (
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-700">
              Transaction Hash
            </div>
            <div className="text-xs text-gray-500 font-mono mt-1">
              {txHash.substring(0, 20)}...{txHash.substring(txHash.length - 8)}
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.open(explorerLink, '_blank')}
            className="flex items-center gap-2"
          >
            <ExternalLink className="w-4 h-4" />
            View on Explorer
          </Button>
        </div>
      </div>
    )
  }

  // Handle different states
  console.log('🚦 Checking status conditions:', { currentStatus })
  
  if (currentStatus === 'failed') {
    console.log('🚨 Showing error screen')
    return <TransactionErrorScreen 
      errorMsg={onChainError || flowError?.message || 'Transaction failed'}
      currentStepIndex={currentStepIndex}
      config={config}
      transactionData={transactionData}
      flowData={flowData}
      flowError={flowError}
      renderExplorerLink={renderExplorerLink}
      navigate={navigate}
    />
  }

  if (currentStatus === 'completed') {
    console.log('🎉 Showing success screen')
    return (
      <SuccessScreen 
        config={config}
        transactionData={transactionData}
        onChainStatus={onChainStatus}
        renderExplorerLink={renderExplorerLink}
        navigate={navigate}
      />
    )
  }
  
  console.log('🔄 Showing progress screen for status:', currentStatus)

  // Processing/Confirming state
  return (
    <div className="fixed top-0 left-0 w-full h-full flex items-center justify-center z-50 pointer-events-none">
      <Card className="w-full max-w-md mx-4 bg-white shadow-2xl border border-gray-300 pointer-events-auto">
        <CardContent className="p-6 bg-white">
          <div className="text-center">
            <div className="mb-6">
              <div className={`w-16 h-16 ${config.bgColor} rounded-full flex items-center justify-center mx-auto mb-4`}>
                <div className={config.color}>
                  {config.icon}
                </div>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                {config.name} in Progress
              </h2>
              
              <p className="text-gray-600 text-sm">
                Please wait while we process your transaction
              </p>
            </div>

            {/* Progress steps */}
            <div className="space-y-3 mb-6">
              {config.steps.map((step, index) => (
                <div key={index} className="flex items-center text-left">
                  <div className="mr-3">
                    {renderStepIcon(index)}
                  </div>
                  <span className={`text-sm ${
                    completedSteps.includes(index) 
                      ? 'text-green-600 font-medium' 
                      : index === currentStepIndex 
                        ? 'text-blue-600 font-medium' 
                        : 'text-gray-500'
                  }`}>
                    {step}
                  </span>
                </div>
              ))}
            </div>

            {/* On-chain confirmation progress */}
            {renderOnChainProgress()}

            {/* Transaction details toggle */}
            <div className="mt-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowDetails(!showDetails)}
                className="text-xs text-gray-500"
              >
                {showDetails ? 'Hide Details' : 'Show Details'}
              </Button>
              
              {showDetails && (
                <div className="mt-3 p-3 bg-gray-50 rounded-lg text-left">
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gray-500">From:</span>
                      <span>{config.from}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">To:</span>
                      <span>{config.to}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Amount:</span>
                      <span>${transactionData?.amount || '0.00'}</span>
                    </div>
                    {chain && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Network:</span>
                        <span>{chain}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Explorer link while processing */}
            {renderExplorerLink()}
            
            {/* Security note */}
            <div className="mt-6 p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center justify-center">
                <Shield className="w-4 h-4 text-blue-600 mr-2" />
                <span className="text-xs text-blue-700">
                  Secured by blockchain technology
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}