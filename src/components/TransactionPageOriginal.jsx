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
import TransactionProgressScreen from './shared/TransactionProgressScreen.jsx'
import { NAVIGATION_PATHS } from '../utils/navigationHelpers.js'
import { defaultFeeCalculator } from '../utils/feeCalculations.js'
import { 
  useWalletBalance, 
  useFeeCalculator, 
  useTransactionValidation, 
  useTransactionFlow,
  useTransactionTwoFA 
} from '../hooks/useTransactions.jsx'

export default function TransactionPage({ transactionType: propTransactionType }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  
  // Support both prop-based routing (new RESTful) and query parameter routing (legacy)
  const initialType = propTransactionType || searchParams.get('type') || 'add'
  
  // Enhanced state management
  const [transactionType, setTransactionType] = useState(initialType)
  
  // Sync transaction type with prop changes (for RESTful routing)
  useEffect(() => {
    if (propTransactionType && propTransactionType !== transactionType) {
      setTransactionType(propTransactionType)
    }
  }, [propTransactionType, transactionType])

  // Ensure fiat-only transactions always use USD
  useEffect(() => {
    if (['add', 'withdraw', 'send', 'transfer', 'receive'].includes(transactionType)) {
      setSelectedAsset('USD')
    }
  }, [transactionType])
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [selectedAsset, setSelectedAsset] = useState('USD')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [showFeeDetails, setShowFeeDetails] = useState(false)
  const [show2FAModal, setShow2FAModal] = useState(false)
  const [twoFACode, setTwoFACode] = useState('')
  
  // Transaction system hooks
  const { balance, getBalance, checkSufficientBalance, isLoading: walletLoading } = useWalletBalance()
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

  // Payment methods for Buy/Sell transactions (diBoaS Wallet first)
  const buyPaymentMethods = [
    { id: 'diboas_wallet', label: 'diBoaS Wallet', icon: '🔷' },
    ...paymentMethods
  ]

  const assets = [
    { id: 'USD', label: 'USD', name: 'US Dollar', symbol: 'USD', icon: '💵', price: '$1.00', available: balance?.availableForSpending || 0 },
    { id: 'BTC', label: 'Bitcoin', name: 'Bitcoin', symbol: 'BTC', icon: '₿', price: '$43,250.00', available: balance?.assets?.BTC?.amount || 0 },
    { id: 'ETH', label: 'Ethereum', name: 'Ethereum', symbol: 'ETH', icon: '⟠', price: '$2,680.00', available: balance?.assets?.ETH?.amount || 0 },
    { id: 'SOL', label: 'Solana', name: 'Solana', symbol: 'SOL', icon: '◎', price: '$98.50', available: balance?.assets?.SOL?.amount || 0 },
    { id: 'SUI', label: 'Sui', name: 'Sui Network', symbol: 'SUI', icon: '🌊', price: '$3.45', available: balance?.assets?.SUI?.amount || 0 },
    { id: 'USDC', label: 'USDC', name: 'USD Coin', symbol: 'USDC', icon: '🔵', price: '$1.00', available: balance?.breakdown?.SOL?.usdc || 0 },
    { id: 'GOLD', label: 'Tokenized Gold', name: 'Tokenized Gold', symbol: 'GOLD', icon: '🥇', price: '$2,045.30', available: balance?.assets?.GOLD?.amount || 0 },
    { id: 'STOCKS', label: 'Tokenized Stocks', name: 'Tokenized Stocks', symbol: 'STOCKS', icon: '📈', price: 'Various', available: balance?.assets?.STOCKS?.amount || 0 }
  ]

  // Assets available for Buy/Sell (only supported chains)
  const tradableAssets = assets.filter(asset => ['BTC', 'ETH', 'SOL', 'SUI'].includes(asset.id))

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
        return balance?.assets?.[selectedAsset]?.investedAmount || 0
      case 'transfer':
        return balance.availableForSpending || 0
      default:
        return balance.totalUSD || 0
    }
  }, [balance, transactionType, selectedAsset, assets])

  // Real-time fee calculation with debounced amount but immediate payment method updates
  const debouncedAmount = useValueDebounce(amount, 500)
  const debouncedRecipient = useValueDebounce(recipient, 500) // Debounce recipient for transfer fee calculations
  
  // Auto-select payment method for Sell transactions
  useEffect(() => {
    if (transactionType === 'sell') {
      setSelectedPaymentMethod('diboas_wallet')
    }
  }, [transactionType])

  useEffect(() => {
    
    // Calculate fees when amount > 0 AND either payment method is selected (for add/withdraw) OR for send/transfer/buy/sell
    const shouldCalculateFees = debouncedAmount && parseFloat(debouncedAmount) > 0 && (
      selectedPaymentMethod || // For add/withdraw transactions
      ['send', 'transfer', 'buy', 'sell'].includes(transactionType) // These don't need payment method
    )
    
    if (shouldCalculateFees) {
      const transactionData = {
        type: transactionType,
        amount: debouncedAmount,
        asset: selectedAsset,
        paymentMethod: selectedPaymentMethod,
        category: selectedCategory,
        recipient: debouncedRecipient // Use debounced recipient for transfer fee calculations
      }
      
      getRealTimeFees(transactionData).catch(console.error)
    }
  }, [debouncedAmount, transactionType, selectedAsset, selectedPaymentMethod, selectedCategory, debouncedRecipient, getRealTimeFees])
  
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

      // Check if 2FA is required
      const needs2FA = await checkTwoFARequirement(transactionData)
      if (needs2FA) {
        setShow2FAModal(true)
        await sendTwoFACode()
        return
      }

      // Execute transaction flow with direct confirmation
      const flowResult = await executeTransactionFlow(transactionData)
      
      // If flow is successful, immediately confirm transaction
      if (flowResult.success) {
        const result = await confirmTransaction()
        await getBalance(true) // Refresh balance
      }
    } catch (error) {
      // Error handling managed by transaction flow
    }
  }

  const handleTransactionConfirm = async () => {
    try {
      // Execute the actual transaction
      const result = await confirmTransaction()
      
      // Refresh balance to show updated amount
      await getBalance(true)
    } catch (error) {
      // Error handling managed by transaction flow
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
      // Error handling for 2FA verification
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
      // For transfers, detect network from recipient address using fee calculator
      if (recipient) {
        try {
          const addressInfo = defaultFeeCalculator.detectNetworkFromAddress(recipient)
          
          if (addressInfo.isValid && addressInfo.isSupported) {
            return rates[addressInfo.network] || rates.SOL
          } else {
            return 'Invalid Chain' // Invalid or unsupported network
          }
        } catch (error) {
          console.error('Error detecting network:', error)
        }
      }
      return rates.SOL // Default to Solana if no valid address
    } else if (['buy', 'sell'].includes(transactionType)) {
      // Use the selected asset's network for buy/sell transactions
      return rates[selectedAsset] || rates.SOL
    }
    return rates.SOL
  }

  const getPaymentMethodFeeRate = () => {
    if (!selectedPaymentMethod || selectedPaymentMethod === 'diboas_wallet') return '0%'
    
    const rates = {
      'apple_pay': '0.5%',
      'credit_card': '1%',
      'bank': '1%',
      'paypal': '3%',
      'google_pay': '0.5%'
    }
    
    return rates[selectedPaymentMethod] || '0%'
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
    } else if (['buy', 'sell'].includes(transactionType)) {
      if (selectedPaymentMethod === 'diboas_wallet') {
        return '1%' // DEX fee only
      } else {
        // External payment method + DEX fee
        const baseRate = transactionType === 'buy' 
          ? rates.onramp[selectedPaymentMethod] 
          : rates.offramp[selectedPaymentMethod]
        return baseRate ? `${baseRate} + 1%` : '1%'
      }
    }
    return '0%'
  }

  // Reset flow when transaction type changes
  useEffect(() => {
    resetFlow()
    clearValidationErrors()
  }, [transactionType, resetFlow, clearValidationErrors])

  // Transaction validation function
  const isTransactionValid = useMemo(() => {
    // Check if amount is valid
    if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
      return false
    }

    // Check validation errors
    if (Object.keys(validationErrors).length > 0) {
      return false
    }

    // Transaction-specific validations
    switch (transactionType) {
      case 'add':
        // Add/Deposit requires payment method
        return selectedPaymentMethod && selectedPaymentMethod.length > 0
      
      case 'withdraw':
        // Withdraw requires payment method and sufficient balance
        return selectedPaymentMethod && 
               selectedPaymentMethod.length > 0 &&
               parseFloat(amount) <= (balance?.availableForSpending || 0)
      
      case 'send':
        // Send requires recipient and sufficient balance
        return recipient && 
               recipient.length > 0 && 
               parseFloat(amount) <= (balance?.availableForSpending || 0)
      
      
      case 'transfer':
        // Transfer requires recipient address and sufficient balance
        return recipient && 
               recipient.length > 0 && 
               parseFloat(amount) <= (balance?.availableForSpending || 0)
      
      case 'buy':
        // Buy requires asset selection and payment method
        // If paying with diBoaS wallet, check balance; if paying with external methods, no balance check needed
        const hasValidAsset = selectedAsset && ['BTC', 'ETH', 'SOL', 'SUI'].includes(selectedAsset)
        const hasPaymentMethod = selectedPaymentMethod && selectedPaymentMethod.length > 0
        const hasEnoughBalance = selectedPaymentMethod === 'diboas_wallet' 
          ? parseFloat(amount) <= (balance?.availableForSpending || 0)
          : true // External payment methods don't need balance check
        
        return hasValidAsset && hasPaymentMethod && hasEnoughBalance
      
      case 'sell':
        // Sell requires asset selection and sufficient invested balance (USD value)
        const hasValidSellAsset = selectedAsset && ['BTC', 'ETH', 'SOL', 'SUI'].includes(selectedAsset)
        const hasAssetBalance = hasValidSellAsset && (balance?.assets?.[selectedAsset]?.investedAmount || 0) >= parseFloat(amount)
        return hasValidSellAsset && hasAssetBalance && selectedPaymentMethod === 'diboas_wallet'
      
      default:
        return false
    }
  }, [transactionType, amount, selectedPaymentMethod, recipient, selectedAsset, balance, validationErrors])
  
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

  // Show progress screen during processing, completion, or error
  if (['processing', 'completed', 'error'].includes(flowState)) {
    return (
      <TransactionProgressScreen
        transactionData={{
          type: transactionType,
          amount: amount,
          recipient: recipient,
          asset: selectedAsset,
          paymentMethod: selectedPaymentMethod
        }}
        currentStep={flowState === 'processing' ? 'Processing transaction...' : undefined}
        isCompleted={flowState === 'completed'}
        isError={flowState === 'error'}
        errorMessage={flowError?.message}
        fees={fees}
        result={flowData?.result}
      />
    )
  }

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
            <div className="transaction-type-grid">
              {transactionTypes.map((type) => (
                <Button
                  key={type.id}
                  variant={transactionType === type.id ? "default" : "outline"}
                  className={`h-16 flex-col space-y-1 ${
                    transactionType !== type.id 
                      ? `${type.bgColor} ${type.color} ${type.borderColor} hover:scale-105`
                      : ''
                  } transition-transform`}
                  onClick={() => {
                    // For RESTful routing, navigate to the specific route
                    if (!propTransactionType) {
                      setTransactionType(type.id)
                    } else {
                      // Navigate to the specific transaction route
                      const routeMap = {
                        'add': '/add',
                        'send': '/send',
                        'receive': '/receive',
                        'buy': '/buy',
                        'sell': '/sell',
                        'transfer': '/transfer',
                        'withdraw': '/withdraw',
                        'invest': '/invest'
                      }
                      navigate(routeMap[type.id] || `/transaction?type=${type.id}`)
                    }
                  }}
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
                {/* Asset Selection for Buy - shown first for Buy */}
                {transactionType === 'buy' && (
                  <div>
                    <Label>Buy Asset</Label>
                    <div className="asset-selection-grid">
                      {tradableAssets.map((asset) => (
                        <Button
                          key={asset.id}
                          variant={selectedAsset === asset.id ? "default" : "outline"}
                          className="h-20 flex-col p-3"
                          onClick={() => setSelectedAsset(asset.id)}
                        >
                          <span className="text-2xl mb-1">{asset.icon}</span>
                          <div className="text-center">
                            <span className="text-xs font-semibold block">{asset.name}</span>
                            <span className="text-xs text-gray-500 block">{asset.symbol}</span>
                          </div>
                          <span className="text-xs text-gray-600 mt-1">{asset.price}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recipient Selection for Send - shown first */}
                {transactionType === 'send' && (
                  <div>
                    <Label htmlFor="recipient">Send to</Label>
                    <div className="search-input-container">
                      <Input
                        id="recipient"
                        placeholder="@username or search..."
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="pl-10"
                      />
                      <Search className="search-icon" />
                    </div>
                    {validationErrors.recipient && (
                      <p className="text-sm text-red-600 mt-1">
                        {validationErrors.recipient.message}
                      </p>
                    )}
                    
                    {/* Irreversible Transaction Warning for Send */}
                    <div className="warning-box">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="warning-icon" />
                        <div className="warning-content">
                          <p className="font-medium">⚠️ Transaction cannot be reverted</p>
                          <p>Please verify the recipient details. You are responsible for the accuracy of the recipient information. This transaction cannot be undone once confirmed.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Wallet Address for Transfer - shown first */}
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
                    
                    {/* Irreversible Transaction Warning for Transfer */}
                    <div className="warning-box">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="warning-icon" />
                        <div className="warning-content">
                          <p className="font-medium">⚠️ Transaction cannot be reverted</p>
                          <p>Please verify the wallet address carefully. You are responsible for the accuracy of the address. This external transfer cannot be undone once confirmed.</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Asset Selection for Sell - shown first */}
                {transactionType === 'sell' && (
                  <div>
                    <Label>Sell Asset</Label>
                    {(() => {
                      // Show assets from invested balance, not available balance
                      const availableAssets = tradableAssets.filter(asset => (balance?.assets?.[asset.id]?.investedAmount || 0) > 0)
                      
                      if (availableAssets.length === 0) {
                        return (
                          <div className="empty-state-container">
                            <TrendingUp className="empty-state-icon" />
                            <p className="empty-state-text">No assets available to sell</p>
                            <Button
                              variant="outline"
                              onClick={() => {
                                const routeMap = {
                                  'buy': '/buy'
                                }
                                navigate(routeMap['buy'])
                              }}
                              className="text-blue-600 border-blue-200 hover:bg-blue-50"
                            >
                              Buy Assets First
                            </Button>
                          </div>
                        )
                      }
                      
                      return (
                        <div className="asset-selection-grid">
                          {availableAssets.map((asset) => (
                            <Button
                              key={asset.id}
                              variant={selectedAsset === asset.id ? "default" : "outline"}
                              className="h-20 flex-col p-3"
                              onClick={() => setSelectedAsset(asset.id)}
                            >
                              <span className="text-2xl mb-1">{asset.icon}</span>
                              <div className="text-center">
                                <span className="text-xs font-semibold block">{asset.name}</span>
                                <span className="text-xs text-gray-500 block">{asset.symbol}</span>
                              </div>
                              <span className="text-xs text-blue-600 mt-1">
                                {(balance?.assets?.[asset.id]?.investedAmount || 0).toFixed(4)} {asset.symbol}
                              </span>
                            </Button>
                          ))}
                        </div>
                      )
                    })()}
                  </div>
                )}

                {/* Amount Input */}
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <div className="amount-input-container">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      style={{ 
                        MozAppearance: 'textfield',
                        WebkitAppearance: 'none',
                        appearance: 'none'
                      }}
                      className={`text-2xl h-14 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
                        transactionType === 'sell'
                          ? 'pr-20'  // Space for asset dropdown (Sell only)
                          : 'pr-16'  // Space for USD label only
                      } ${validationErrors.amount ? 'border-red-500 focus:border-red-500' : ''}`}
                    />
                    {/* Show USD for most transactions, asset dropdown only for Sell */}
                    {transactionType === 'sell' ? (
                      <select
                        value={selectedAsset}
                        onChange={(e) => setSelectedAsset(e.target.value)}
                        className="asset-selector"
                        >
                          {assets.map((asset) => (
                            <option key={asset.id} value={asset.id}>
                              {asset.label}
                            </option>
                          ))}
                        </select>
                    ) : (
                        <span className="currency-label">USD</span>
                    )}
                  </div>

                  {/* Amount Quick Options */}
                  <div className="amount-quick-options">
                    {(() => {
                      const getAmountOptions = () => {
                        switch(transactionType) {
                          case 'add':
                          case 'buy':
                            return [
                              { label: '$25', value: '25' },
                              { label: '$50', value: '50' },
                              { label: '$100', value: '100' }
                            ]
                          case 'send':
                            return [
                              { label: '5%', value: Math.round((balance?.availableForSpending || 0) * 0.05 * 100) / 100 },
                              { label: '10%', value: Math.round((balance?.availableForSpending || 0) * 0.10 * 100) / 100 },
                              { label: '25%', value: Math.round((balance?.availableForSpending || 0) * 0.25 * 100) / 100 }
                            ]
                          case 'transfer':
                            return [
                              { label: '25%', value: Math.round((balance?.availableForSpending || 0) * 0.25 * 100) / 100 },
                              { label: '50%', value: Math.round((balance?.availableForSpending || 0) * 0.50 * 100) / 100 },
                              { label: 'Max', value: balance?.availableForSpending || 0 }
                            ]
                          case 'sell':
                            const assetBalance = balance?.assets?.[selectedAsset]?.investedAmount || 0
                            return [
                              { label: '25%', value: Math.round(assetBalance * 0.25 * 100) / 100 },
                              { label: '50%', value: Math.round(assetBalance * 0.50 * 100) / 100 },
                              { label: 'Max', value: assetBalance }
                            ]
                          case 'withdraw':
                            return [
                              { label: '25%', value: Math.round((balance?.availableForSpending || 0) * 0.25 * 100) / 100 },
                              { label: '50%', value: Math.round((balance?.availableForSpending || 0) * 0.50 * 100) / 100 },
                              { label: 'Max', value: balance?.availableForSpending || 0 }
                            ]
                          default:
                            return []
                        }
                      }

                      return getAmountOptions().map((option, index) => (
                        <button
                          key={index}
                          type="button"
                          className="amount-option-button"
                          onClick={() => setAmount(option.value.toString())}
                        >
                          {option.label}
                        </button>
                      ))
                    })()}
                  </div>

                  <p className="text-sm text-gray-500 mt-1">
                    {['withdraw', 'send', 'transfer'].includes(transactionType)
                      ? `Maximum ${transactionType === 'withdraw' ? 'withdrawable' : transactionType === 'send' ? 'sendable' : 'transferable'}: $${balance?.availableForSpending?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}` 
                      : transactionType === 'sell'
                      ? `Invested in ${selectedAsset}: $${typeof availableBalance === 'number' ? availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}`
                      : `Available: $${typeof availableBalance === 'number' ? availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}`
                    }
                  </p>
                  {validationErrors.amount && (
                    <p className="text-sm text-red-600 mt-1">
                      {validationErrors.amount.message}
                    </p>
                  )}
                  {['withdraw', 'send', 'transfer'].includes(transactionType) && balance?.investedAmount > 0 && (
                    <div className="info-box">
                      <div className="flex items-start space-x-2">
                        <Info className="info-icon" />
                        <div className="info-content">
                          <p className="font-medium">Invested funds cannot be {transactionType === 'withdraw' ? 'withdrawn' : transactionType === 'send' ? 'sent' : 'transferred'} directly</p>
                          <p>You have ${balance.investedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} in investments. To {transactionType === 'withdraw' ? 'withdraw' : transactionType === 'send' ? 'send' : 'transfer'} invested funds, first sell your assets.</p>
                        </div>
                      </div>
                    </div>
                  )}
                  {transactionType === 'buy' && selectedPaymentMethod === 'diboas_wallet' && amount && parseFloat(amount) > (balance?.availableForSpending || 0) && (
                    <div className="error-box">
                      <div className="flex items-start space-x-2">
                        <AlertCircle className="error-icon" />
                        <div className="error-content">
                          <p className="font-medium">Insufficient diBoaS wallet balance</p>
                          <p>You need ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} but only have ${(balance?.availableForSpending || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} available. Choose an external payment method or add funds first.</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>


                {/* Payment Method Selection - Hidden for Sell transactions */}
                {(isOnRamp || isOffRamp || transactionType === 'buy') && (
                  <div>
                    <Label>Payment Method</Label>
                    <div className="payment-method-grid">
                      {(transactionType === 'buy' ? buyPaymentMethods : paymentMethods).map((method) => (
                        <Button
                          key={method.id}
                          variant={selectedPaymentMethod === method.id ? "default" : "outline"}
                          className="h-12 justify-start"
                          onClick={() => setSelectedPaymentMethod(method.id)}
                        >
                          <span className="mr-2">{method.icon}</span>
                          {method.label}
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
                  <div className="text-right">
                    <span className="font-medium">${amount || '0.00'}</span>
                    {/* Show estimated asset quantity for Buy/Sell transactions */}
                    {(['buy', 'sell'].includes(transactionType) && amount && selectedAsset && selectedAsset !== 'USD') && (
                      <div className="text-xs text-gray-500 mt-1">
                        {(() => {
                          const assetData = assets.find(a => a.id === selectedAsset)
                          if (!assetData || !assetData.price) return ''
                          
                          const priceValue = parseFloat(assetData.price.replace(/[$,]/g, ''))
                          const amountValue = parseFloat(amount)
                          
                          if (transactionType === 'buy' && priceValue > 0) {
                            const estimatedQuantity = amountValue / priceValue
                            return `≈ ${estimatedQuantity.toFixed(6)} ${assetData.symbol}`
                          } else if (transactionType === 'sell' && amountValue > 0) {
                            const estimatedFiat = amountValue * priceValue
                            return `≈ $${estimatedFiat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                          }
                          return ''
                        })()}
                      </div>
                    )}
                  </div>
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
                      {['buy', 'sell'].includes(transactionType) && (
                        <>
                          {/* Payment Method Fee - only for external payment methods */}
                          {transactionType === 'buy' && selectedPaymentMethod !== 'diboas_wallet' && (
                            <div className="flex justify-between text-gray-600">
                              <span>Payment Fee ({getPaymentMethodFeeRate()})</span>
                              <span>${fees?.payment?.toFixed(2) || '0.00'}</span>
                            </div>
                          )}
                          {/* DEX Fee - always shown for buy/sell */}
                          <div className="flex justify-between text-gray-600">
                            <span>DEX Fee (1%)</span>
                            <span>${fees?.dex?.toFixed(2) || '0.00'}</span>
                          </div>
                        </>
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
                  <Button
                    variant="cta"
                    className="w-full"
                    onClick={handleTransactionStart}
                    disabled={!isTransactionValid}
                  >
                    {`${currentType?.label} ${amount ? `$${amount}` : ''}`}
                  </Button>
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

