import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Loader2, CheckCircle, DollarSign, ArrowRight, CreditCard, Wallet, Send, TrendingUp, TrendingDown, ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
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
  result = null
}) {
  const navigate = useNavigate()
  const [completedSteps, setCompletedSteps] = useState([])
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  // Get transaction configuration with dynamic 'from' and 'to' fields
  const getTransactionConfig = (type) => {
    const baseConfig = TRANSACTION_CONFIGS[type] || TRANSACTION_CONFIGS.add
    
    // Add dynamic from/to fields based on transaction type and data
    const fromToMap = {
      add: {
        from: transactionData?.paymentMethod || 'Payment Method',
        to: 'diBoaS Wallet'
      },
      withdraw: {
        from: 'diBoaS Wallet',
        to: transactionData?.paymentMethod || 'Payment Method'
      },
      send: {
        from: 'Your Wallet',
        to: transactionData?.recipient || 'Recipient'
      },
      receive: {
        from: 'Sender',
        to: 'Your Wallet'
      },
      transfer: {
        from: 'diBoaS Wallet',
        to: 'External Wallet'
      },
      buy: {
        from: 'USD Balance',
        to: transactionData?.asset || 'Crypto/Assets'
      },
      sell: {
        from: transactionData?.asset || 'Crypto/Assets',
        to: 'USD Balance'
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

  // Simulate step progression
  useEffect(() => {
    if (isCompleted || isError) return

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
  }, [isCompleted, isError, stepsLength, steps])

  // Handle completion
  useEffect(() => {
    if (isCompleted) {
      setCompletedSteps(steps)
      setCurrentStepIndex(stepsLength - 1)
    }
  }, [isCompleted, steps, stepsLength])

  if (isCompleted) {
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
                
                {fees && (
                  <>
                    <div className="border-t pt-2">
                      <div className="flex justify-between text-sm text-gray-600">
                        <span>Total Fees:</span>
                        <span>${fees.total?.toFixed(2) || '0.00'}</span>
                      </div>
                    </div>
                    
                    <div className="border-t pt-2">
                      <div className="flex justify-between font-semibold">
                        <span>Net Amount:</span>
                        <span className={config.color}>
                          ${(parseFloat(transactionData.amount) - parseFloat(fees.total || 0)).toFixed(2)}
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

  if (isError) {
    return (
      <div className="main-layout center-content" style={{padding: '1rem'}}>
        <Card className="main-card" style={{width: '100%', maxWidth: '32rem'}}>
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <img src={diBoaSLogo} alt="diBoaS Logo" className="h-12 w-auto mx-auto mb-4" />
            </div>
            
            {/* Error Icon */}
            <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-6">
              <DollarSign className="w-8 h-8 text-red-600" />
            </div>
            
            {/* Error Message */}
            <h2 className="text-2xl font-bold text-gray-900 mb-2">
              Transaction Failed
            </h2>
            <p className="text-gray-600 mb-6">
              {errorMessage || 'Something went wrong. Please try again.'}
            </p>
            
            {/* Action Buttons */}
            <div className="space-y-3">
              <Button 
                className="w-full diboas-button"
                onClick={() => navigate(-1)} // Go back to transaction form
              >
                Try Again
              </Button>
              <Button 
                variant="outline"
                className="w-full"
                onClick={() => navigate('/app')}
              >
                Back to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
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
                {steps[currentStepIndex] || currentStep}
              </span>
            </div>
            <p className="text-sm text-gray-600">
              Please wait while we process your {config.name.toLowerCase()}...
            </p>
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