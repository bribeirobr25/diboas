import { useState, useMemo, useCallback, useEffect } from 'react'
// Custom value debounce hook
const useValueDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => {
      clearTimeout(handler)
    }
  }, [value, delay])

  return debouncedValue
}
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { 
  Plus,
  Send,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CreditCard,
  Wallet,
  Info,
  CheckCircle,
  AlertCircle,
  Search,
  QrCode,
  Copy,
  Eye,
  EyeOff,
  Shield,
  Clock,
  DollarSign
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from './shared/PageHeader.jsx'
import { NAVIGATION_PATHS } from '../utils/navigationHelpers.js'
import { 
  useWallet, 
  useFeeCalculator, 
  useTransactionValidation, 
  useTransactionFlow,
  useTransactionTwoFA 
} from '../hooks/useTransactions.jsx'

export default function TransactionPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialType = searchParams.get('type') || 'add'
  
  // Enhanced state management
  const [transactionType, setTransactionType] = useState(initialType)
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [selectedAsset, setSelectedAsset] = useState('USD')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showFeeDetails, setShowFeeDetails] = useState(false)
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [twoFACode, setTwoFACode] = useState('')
  
  // Transaction system hooks
  const { balance, getBalance, checkSufficientBalance, isLoading: walletLoading } = useWallet()
  const { fees, isCalculating, calculateFees, getRealTimeFees } = useFeeCalculator()
  const { validationErrors, validateTransaction, clearValidationErrors } = useTransactionValidation()
  const { flowState, flowData, flowError, executeTransactionFlow, confirmTransaction, resetFlow } = useTransactionFlow()
  const { twoFARequired, checkTwoFARequirement, sendTwoFACode, verifyTwoFACode, isVerifying } = useTransactionTwoFA()

  const transactionTypes = [
    { 
      id: 'add', 
      label: 'Add', 
      icon: <Plus className="w-4 h-4" />, 
      description: 'Add money to your diBoaS wallet',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    { 
      id: 'send', 
      label: 'Send', 
      icon: <Send className="w-4 h-4" />, 
      description: 'Send money to another diBoaS user',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    { 
      id: 'receive', 
      label: 'Receive', 
      icon: <ArrowDownLeft className="w-4 h-4" />, 
      description: 'Request money from another diBoaS user',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    { 
      id: 'buy', 
      label: 'Buy', 
      icon: <TrendingUp className="w-4 h-4" />, 
      description: 'Buy crypto or tokenized assets',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    { 
      id: 'sell', 
      label: 'Sell', 
      icon: <TrendingDown className="w-4 h-4" />, 
      description: 'Sell crypto or tokenized assets',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    { 
      id: 'transfer', 
      label: 'Transfer', 
      icon: <ArrowRight className="w-4 h-4" />, 
      description: 'Transfer to external wallet',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    { 
      id: 'withdraw', 
      label: 'Withdraw', 
      icon: <CreditCard className="w-4 h-4" />, 
      description: 'Withdraw to bank or card',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    }
  ]

  const paymentMethods = [
    { id: 'credit_card', label: 'Credit/Debit Card', icon: '💳' },
    { id: 'bank', label: 'Bank Account', icon: '🏦' },
    { id: 'apple_pay', label: 'Apple Pay', icon: '🍎' },
    { id: 'google_pay', label: 'Google Pay', icon: '🔵' },
    { id: 'paypal', label: 'PayPal', icon: '🅿️' }
  ]

  const assets = [
    { id: 'USD', label: 'USD', icon: '💵', price: '$1.00', available: balance?.availableForSpending || 0 },
    { id: 'BTC', label: 'Bitcoin', icon: '₿', price: '$43,250.00', available: balance?.assets?.BTC?.amount || 0 },
    { id: 'ETH', label: 'Ethereum', icon: '⟠', price: '$2,680.00', available: balance?.assets?.ETH?.amount || 0 },
    { id: 'SOL', label: 'Solana', icon: '◎', price: '$98.50', available: balance?.assets?.SOL?.amount || 0 },
    { id: 'SUI', label: 'Sui', icon: '🌊', price: '$3.45', available: balance?.assets?.SUI?.amount || 0 },
    { id: 'USDC', label: 'USDC', icon: '🔵', price: '$1.00', available: balance?.breakdown?.SOL?.usdc || 0 },
    { id: 'GOLD', label: 'Tokenized Gold', icon: '🥇', price: '$2,045.30', available: balance?.assets?.GOLD?.amount || 0 },
    { id: 'STOCKS', label: 'Tokenized Stocks', icon: '📈', price: 'Various', available: balance?.assets?.STOCKS?.amount || 0 }
  ]

  const investmentCategories = [
    { id: 'gold', label: 'Tokenized Gold', icon: '🥇', description: 'Physical gold backed tokens' },
    { id: 'stocks', label: 'Tokenized Stocks', icon: '📈', description: 'Fractional stock ownership' },
    { id: 'realestate', label: 'Real Estate', icon: '🏠', description: 'Property investment tokens' }
  ]

  const currentType = transactionTypes.find(t => t.id === transactionType)
  const isOnRamp = transactionType === 'add'
  const isOffRamp = transactionType === 'withdraw'
  const isOnChain = ['send', 'receive', 'buy', 'sell', 'transfer'].includes(transactionType)
  const isInvestment = transactionType === 'invest'
  
  // Real-time balance display
  const availableBalance = useMemo(() => {
    if (!balance) return 0
    
    switch (transactionType) {
      case 'add':
        return Infinity // No limit for adding money
      case 'withdraw':
      case 'send':
      case 'invest':
        return balance.availableForSpending || 0
      case 'buy':
        return balance.availableForSpending || 0
      case 'sell':
        const asset = assets.find(a => a.id === selectedAsset)
        return asset?.available || 0
      case 'transfer':
        return balance.availableForSpending || 0
      default:
        return balance.totalUSD || 0
    }
  }, [balance, transactionType, selectedAsset, assets])

  // Real-time fee calculation
  const debouncedAmount = useValueDebounce(amount, 500)
  
  useEffect(() => {
    console.log('🔢 Fee calculation check:', { 
      debouncedAmount, 
      amount: parseFloat(debouncedAmount), 
      selectedPaymentMethod,
      shouldCalculate: debouncedAmount && parseFloat(debouncedAmount) > 0 && selectedPaymentMethod
    })
    
    // Only calculate fees when amount > 0 AND payment method is selected (as per requirements)
    if (debouncedAmount && parseFloat(debouncedAmount) > 0 && selectedPaymentMethod) {
      const transactionData = {
        type: transactionType,
        amount: debouncedAmount,
        asset: selectedAsset,
        paymentMethod: selectedPaymentMethod,
        category: selectedCategory
      }
      
      console.log('💰 Triggering fee calculation with:', transactionData)
      getRealTimeFees(transactionData).catch(console.error)
    }
  }, [debouncedAmount, transactionType, selectedAsset, selectedPaymentMethod, selectedCategory, getRealTimeFees])
  
  // Validation on form changes
  useEffect(() => {
    if (amount || recipient) {
      const transactionData = {
        type: transactionType,
        amount,
        recipient,
        asset: selectedAsset,
        category: selectedCategory
      }
      
      validateTransaction(transactionData)
    }
  }, [amount, recipient, transactionType, selectedAsset, selectedCategory, validateTransaction])

  // Enhanced transaction handling
  const handleTransactionStart = async () => {
    try {
      const transactionData = {
        type: transactionType,
        amount,
        recipient,
        asset: selectedAsset,
        paymentMethod: selectedPaymentMethod,
        category: selectedCategory,
        destination: recipient // For withdrawals
      }
      
      console.log('🚀 Starting transaction with data:', transactionData)

      // Check if 2FA is required
      const needs2FA = await checkTwoFARequirement(transactionData)
      if (needs2FA) {
        setShow2FAModal(true)
        await sendTwoFACode()
        return
      }

      // Execute transaction flow with detailed debugging
      console.log('📋 About to execute transaction flow...')
      const result = await executeTransactionFlow(transactionData)
      console.log('✅ Transaction flow completed successfully:', result)
    } catch (error) {
      console.error('❌ Transaction failed with error:', error)
      console.error('📊 Error details:', {
        message: error.message,
        name: error.name,
        stack: error.stack
      })
    }
  }

  const handleTransactionConfirm = async () => {
    try {
      console.log('🔄 Starting transaction confirmation...')
      
      // Execute the actual transaction
      const result = await confirmTransaction()
      console.log('✅ Transaction executed successfully:', result)
      
      // Refresh balance to show updated amount
      console.log('💰 Refreshing wallet balance...')
      await getBalance(true)
      
      console.log('🎉 Transaction completed successfully!')
    } catch (error) {
      console.error('❌ Transaction confirmation failed:', error)
    }
  }

  const handle2FAVerification = async () => {
    try {
      const verification = await verifyTwoFACode(twoFACode)
      if (verification.success) {
        setShow2FAModal(false)
        setTwoFACode('')
        
        // Proceed with transaction
        const transactionData = {
          type: transactionType,
          amount,
          recipient,
          asset: selectedAsset,
          paymentMethod: selectedPaymentMethod,
          category: selectedCategory
        }
        
        await executeTransactionFlow(transactionData)
      }
    } catch (error) {
      console.error('2FA verification failed:', error)
    }
  }

  // Helper functions for fee rate display
  const getNetworkFeeRate = () => {
    const rates = {
      'BTC': '9%',
      'ETH': '0.5%', 
      'SOL': '0.001%',
      'SUI': '0.003%'
    }
    
    if (transactionType === 'add' || transactionType === 'withdraw' || ['send', 'receive'].includes(transactionType)) {
      return rates.SOL // Always Solana for these operations
    } else if (transactionType === 'transfer') {
      return rates.SOL // Default to Solana for external transfers
    } else if (['buy', 'sell'].includes(transactionType)) {
      return rates.SOL // Default to Solana for asset transactions
    }
    return rates.SOL
  }
  
  const getProviderFeeRate = () => {
    if (!selectedPaymentMethod) return '0%'
    
    const rates = {
      onramp: {
        'apple_pay': '0.5%',
        'credit_card': '1%',
        'bank': '1%',
        'paypal': '3%',
        'google_pay': '0.5%'
      },
      offramp: {
        'apple_pay': '1%',
        'credit_card': '2%',
        'bank': '2%',
        'paypal': '4%',
        'google_pay': '1%'
      }
    }
    
    if (isOnRamp) {
      return rates.onramp[selectedPaymentMethod] || '0%'
    } else if (isOffRamp) {
      return rates.offramp[selectedPaymentMethod] || '0%'
    }
    return '0%'
  }

  // Reset flow when transaction type changes
  useEffect(() => {
    resetFlow()
    clearValidationErrors()
  }, [transactionType, resetFlow, clearValidationErrors])
  
  // Listen for balance updates from other pages/transactions
  useEffect(() => {
    const handleTransactionUpdate = () => {
      getBalance(true) // Refresh balance when other transactions complete
    }
    
    window.addEventListener('diboas-transaction-completed', handleTransactionUpdate)
    
    return () => {
      window.removeEventListener('diboas-transaction-completed', handleTransactionUpdate)
    }
  }, [getBalance])

  return (
    <div className="main-layout">
      <PageHeader 
        showBackButton={true} 
        backTo={NAVIGATION_PATHS.APP}
        showUserActions={true}
        title="Transaction"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Transaction Type Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Transaction Type</CardTitle>
            <CardDescription>
              Choose the type of transaction you want to perform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {transactionTypes.map((type) => (
                <Button
                  key={type.id}
                  variant={transactionType === type.id ? "default" : "outline"}
                  className={`h-16 flex-col space-y-1 ${
                    transactionType === type.id 
                      ? 'diboas-button' 
                      : `${type.bgColor} ${type.color} ${type.borderColor} hover:scale-105`
                  } transition-transform`}
                  onClick={() => setTransactionType(type.id)}
                >
                  {type.icon}
                  <span className="text-xs font-medium">{type.label}</span>
                </Button>
              ))}
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <h4 className="font-medium text-blue-900">{currentType?.label}</h4>
                  <p className="text-sm text-blue-700">{currentType?.description}</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Transaction Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {currentType?.icon}
                  <span>{currentType?.label} Transaction</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Amount Input */}
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative mt-1">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-2xl h-14 pr-20"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <select
                        value={selectedAsset}
                        onChange={(e) => setSelectedAsset(e.target.value)}
                        className="bg-transparent border-none text-sm font-medium focus:outline-none"
                      >
                        {assets.map((asset) => (
                          <option key={asset.id} value={asset.id}>
                            {asset.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Available: ${typeof availableBalance === 'number' ? availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                  </p>
                  {validationErrors.amount && (
                    <p className="text-sm text-red-600 mt-1">
                      {validationErrors.amount.message}
                    </p>
                  )}
                </div>

                {/* Recipient/Asset Selection */}
                {(transactionType === 'send' || transactionType === 'receive') && (
                  <div>
                    <Label htmlFor="recipient">
                      {transactionType === 'send' ? 'Send to' : 'Request from'}
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="recipient"
                        placeholder="@username or search..."
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="pl-10"
                      />
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                    {validationErrors.recipient && (
                      <p className="text-sm text-red-600 mt-1">
                        {validationErrors.recipient.message}
                      </p>
                    )}
                  </div>
                )}

                {transactionType === 'transfer' && (
                  <div>
                    <Label htmlFor="wallet">Wallet Address</Label>
                    <div className="relative mt-1">
                      <Input
                        id="wallet"
                        placeholder="Enter wallet address..."
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2"
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                    </div>
                    {validationErrors.recipient && (
                      <p className="text-sm text-red-600 mt-1">
                        {validationErrors.recipient.message}
                      </p>
                    )}
                  </div>
                )}

                {/* Payment Method Selection */}
                {(isOnRamp || isOffRamp) && (
                  <div>
                    <Label>Payment Method</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {paymentMethods.map((method) => (
                        <Button
                          key={method.id}
                          variant={selectedPaymentMethod === method.id ? "default" : "outline"}
                          className={`h-12 justify-start ${
                            selectedPaymentMethod === method.id ? 'diboas-button' : ''
                          }`}
                          onClick={() => setSelectedPaymentMethod(method.id)}
                        >
                          <span className="mr-2">{method.icon}</span>
                          {method.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Asset Selection for Buy/Sell */}
                {(transactionType === 'buy' || transactionType === 'sell') && (
                  <div>
                    <Label>Select Asset</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {assets.filter(a => a.id !== 'USD').map((asset) => (
                        <Button
                          key={asset.id}
                          variant={selectedAsset === asset.id ? "default" : "outline"}
                          className={`h-16 flex-col ${
                            selectedAsset === asset.id ? 'diboas-button' : ''
                          }`}
                          onClick={() => setSelectedAsset(asset.id)}
                        >
                          <span className="text-lg mb-1">{asset.icon}</span>
                          <span className="text-xs">{asset.label}</span>
                          <span className="text-xs text-gray-500">{asset.price}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transaction Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Amount</span>
                  <span className="font-medium">${amount || '0.00'}</span>
                </div>
                
                <div className="border-t pt-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-0 h-auto"
                    onClick={() => setShowFeeDetails(!showFeeDetails)}
                  >
                    <span>Fee Details</span>
                    <span className="font-medium">${fees?.total || '0.00'}</span>
                  </Button>
                  
                  {showFeeDetails && (
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>diBoaS Fee ({isOffRamp || transactionType === 'transfer' ? '0.9%' : '0.09%'})</span>
                        <span>${fees?.diBoaS?.toFixed(2) || '0.00'}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Network Fee ({getNetworkFeeRate()})</span>
                        <span>${fees?.network?.toFixed(2) || '0.00'}</span>
                      </div>
                      {(isOnRamp || isOffRamp) && (
                        <div className="flex justify-between text-gray-600">
                          <span>Provider Fee ({getProviderFeeRate()})</span>
                          <span>${fees?.provider?.toFixed(2) || '0.00'}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${amount && fees ? (parseFloat(amount) - parseFloat(fees.total || 0)).toFixed(2) : amount || '0.00'}</span>
                  </div>
                </div>
                
                <div className="pt-4">
                  {flowState === 'confirming' ? (
                    <Button
                      className="w-full diboas-button"
                      onClick={handleTransactionConfirm}
                    >
                      Confirm Transaction
                    </Button>
                  ) : flowState === 'processing' ? (
                    <Button
                      className="w-full diboas-button"
                      disabled
                    >
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing Transaction...</span>
                      </div>
                    </Button>
                  ) : flowState === 'completed' ? (
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className="flex items-center justify-center space-x-2 text-green-600 mb-2">
                          <CheckCircle className="w-6 h-6" />
                          <span className="font-medium text-lg">Transaction Completed!</span>
                        </div>
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="space-y-2">
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Transaction Type:</span>
                              <span className="font-medium">{currentType?.label}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Amount Processed:</span>
                              <span className="font-medium">${amount}</span>
                            </div>
                            <div className="flex justify-between text-sm">
                              <span className="text-gray-600">Total Fees:</span>
                              <span className="font-medium">${fees?.total?.toFixed(2) || '0.00'}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between font-semibold">
                              <span>Net Amount:</span>
                              <span className="text-green-600">${amount && fees ? (parseFloat(amount) - parseFloat(fees.total || 0)).toFixed(2) : amount || '0.00'}</span>
                            </div>
                            <div className="border-t pt-2 flex justify-between text-sm">
                              <span className="text-gray-600">Available Balance:</span>
                              <span className="font-medium text-blue-600">${balance?.availableForSpending?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      <Button
                        className="w-full diboas-button"
                        onClick={() => navigate('/app')}
                      >
                        Back to Dashboard
                      </Button>
                    </div>
                  ) : flowState === 'error' ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-center space-x-2 text-red-600">
                        <AlertCircle className="w-5 h-5" />
                        <span className="font-medium">Transaction Failed</span>
                      </div>
                      <p className="text-sm text-red-600 text-center">
                        {flowError?.message || 'Please try again'}
                      </p>
                      <Button
                        className="w-full diboas-button"
                        onClick={() => resetFlow()}
                        variant="outline"
                      >
                        Try Again
                      </Button>
                    </div>
                  ) : (
                    <Button
                      className="w-full diboas-button"
                      onClick={handleTransactionStart}
                      disabled={!amount}
                    >
                      {`${currentType?.label} ${amount ? `$${amount}` : ''}`}
                    </Button>
                  )}
                </div>
                
                <div className="text-xs text-gray-500 text-center">
                  <p>All complexities handled in the background</p>
                  <p>No gas fees, swaps, or approvals needed</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

