import { useState, useMemo, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

// Components
import PageHeader from './shared/PageHeader.jsx'
import TransactionProgressScreen from './shared/TransactionProgressScreen.jsx'
import TransactionTypeSelector from './transactions/TransactionTypeSelector.jsx'
import TransactionForm from './transactions/TransactionForm.jsx'
import TransactionSummary from './transactions/TransactionSummary.jsx'

// Icons
import { 
  Plus, Send, ArrowDownLeft, TrendingUp, TrendingDown, ArrowRight,
  CreditCard, Wallet, Shield, Clock, DollarSign
} from 'lucide-react'

// Hooks and utilities
import { useValueDebounce } from '../hooks/useValueDebounce.js'
import { NAVIGATION_PATHS } from '../utils/navigationHelpers.js'
import { 
  useWalletBalance, 
  useFeeCalculator, 
  useTransactionValidation, 
  useTransactionFlow,
  useTransactionTwoFA 
} from '../hooks/transactions/index.js'

export default function TransactionPage({ transactionType: propTransactionType }) {
  // const navigate = useNavigate() // Commented out as not used directly
  const [searchParams] = useSearchParams()
  
  // Support both prop-based routing (new RESTful) and query parameter routing (legacy)
  const initialType = propTransactionType || searchParams.get('type') || 'add'
  
  // Core state
  const [transactionType, setTransactionType] = useState(initialType)
  const [amount, setAmount] = useState('')
  const [recipientAddress, setRecipientAddress] = useState('')
  const [selectedAsset, setSelectedAsset] = useState('USD')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('')
  const [showRecipientAddress, setShowRecipientAddress] = useState(false)
  
  // Sync transaction type with prop changes (for RESTful routing)
  useEffect(() => {
    if (propTransactionType && propTransactionType !== transactionType) {
      setTransactionType(propTransactionType)
    }
  }, [propTransactionType, transactionType])

  // Ensure fiat-only transactions always use USD
  useEffect(() => {
    if (['add', 'withdraw', 'send', 'transfer'].includes(transactionType)) {
      setSelectedAsset('USD')
    }
  }, [transactionType])
  
  // Transaction system hooks
  const { balance } = useWalletBalance()
  const { fees, calculateFees } = useFeeCalculator()
  const { validationErrors, validateTransaction } = useTransactionValidation()
  const { flowState, flowData, flowError, executeTransactionFlow, confirmTransaction, resetFlow } = useTransactionFlow()
  // const { verifyTwoFACode } = useTransactionTwoFA() // Commented out - implementation pending

  // Configuration arrays
  const transactionTypes = [
    { 
      id: 'add', 
      label: 'Add', 
      icon: <Plus className="w-4 h-4" />, 
      description: 'Add money to your diBoaS wallet',
      bgColor: 'bg-green-50', 
      color: 'text-green-700', 
      borderColor: 'border-green-200' 
    },
    { 
      id: 'send', 
      label: 'Send', 
      icon: <Send className="w-4 h-4" />, 
      description: 'Send money to another diBoaS user',
      bgColor: 'bg-blue-50', 
      color: 'text-blue-700', 
      borderColor: 'border-blue-200' 
    },
    { 
      id: 'buy', 
      label: 'Buy', 
      icon: <TrendingUp className="w-4 h-4" />, 
      description: 'Buy cryptocurrency assets',
      bgColor: 'bg-emerald-50', 
      color: 'text-emerald-700', 
      borderColor: 'border-emerald-200' 
    },
    { 
      id: 'sell', 
      label: 'Sell', 
      icon: <TrendingDown className="w-4 h-4" />, 
      description: 'Sell your crypto assets back to USD',
      bgColor: 'bg-red-50', 
      color: 'text-red-700', 
      borderColor: 'border-red-200' 
    },
    { 
      id: 'transfer', 
      label: 'Transfer', 
      icon: <ArrowRight className="w-4 h-4" />, 
      description: 'Transfer funds to external wallet',
      bgColor: 'bg-orange-50', 
      color: 'text-orange-700', 
      borderColor: 'border-orange-200' 
    },
    { 
      id: 'withdraw', 
      label: 'Withdraw', 
      icon: <CreditCard className="w-4 h-4" />, 
      description: 'Withdraw funds to your bank account',
      bgColor: 'bg-indigo-50', 
      color: 'text-indigo-700', 
      borderColor: 'border-indigo-200' 
    }
  ]

  const assets = [
    { id: 'BTC', symbol: 'BTC', label: 'Bitcoin', icon: '₿', price: '$94,523.45', bgColor: 'bg-orange-50', color: 'text-orange-700', borderColor: 'border-orange-200' },
    { id: 'ETH', symbol: 'ETH', label: 'Ethereum', icon: 'Ξ', price: '$3,245.67', bgColor: 'bg-blue-50', color: 'text-blue-700', borderColor: 'border-blue-200' },
    { id: 'SOL', symbol: 'SOL', label: 'Solana', icon: '◎', price: '$198.23', bgColor: 'bg-purple-50', color: 'text-purple-700', borderColor: 'border-purple-200' },
    { id: 'SUI', symbol: 'SUI', label: 'Sui', icon: 'Ⓢ', price: '$4.23', bgColor: 'bg-cyan-50', color: 'text-cyan-700', borderColor: 'border-cyan-200' }
  ]

  const paymentMethods = [
    { id: 'credit_debit_card', label: 'Credit/Debit Card', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'bank_account', label: 'Bank Account', icon: '🏦' },
    { id: 'apple_pay', label: 'Apple Pay', icon: '🍎' },
    { id: 'google_pay', label: 'Google Pay', icon: '🅶' },
    { id: 'paypal', label: 'PayPal', icon: '💰' }
  ]

  const buyPaymentMethods = [
    { id: 'diboas_wallet', label: 'diBoaS Wallet', icon: <Wallet className="w-4 h-4" /> },
    { id: 'credit_debit_card', label: 'Credit/Debit Card', icon: <CreditCard className="w-4 h-4" /> },
    { id: 'bank_account', label: 'Bank Account', icon: '🏦' },
    { id: 'apple_pay', label: 'Apple Pay', icon: '🍎' },
    { id: 'google_pay', label: 'Google Pay', icon: '🅶' },
    { id: 'paypal', label: 'PayPal', icon: '💰' }
  ]

  // Debounced amount for fee calculation
  const debouncedAmount = useValueDebounce(amount, 500)

  // Computed values
  const currentType = transactionTypes.find(type => type.id === transactionType)
  const isOnRamp = ['add'].includes(transactionType)
  const isOffRamp = ['withdraw'].includes(transactionType)
  const availableBalance = selectedAsset === 'USD' 
    ? balance?.availableForSpending || 0 
    : balance?.assets?.[selectedAsset]?.investedAmount || 0

  // Fee calculation helpers with dynamic updates
  const getNetworkFeeRate = useCallback(() => {
    // Network fees based on asset/chain - from TRANSACTIONS.md
    if (['buy', 'sell'].includes(transactionType) && selectedAsset) {
      const rates = { 'BTC': '9%', 'ETH': '0.5%', 'SOL': '0.001%', 'SUI': '0.003%' }
      return rates[selectedAsset] || '0.001%' // Default to Solana for USDC
    }
    // For transfer transactions, detect network from recipient address
    if (transactionType === 'transfer' && recipientAddress) {
      const address = recipientAddress.trim()
      // BTC address detection
      if (address.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/) || address.match(/^bc1[a-z0-9]{39,59}$/)) {
        return '9%' // BTC
      }
      // ETH address detection
      if (address.match(/^0x[a-fA-F0-9]{40}$/)) {
        return '0.5%' // ETH
      }
      // SUI address detection (0x followed by 64 hex chars)
      if (address.match(/^0x[a-fA-F0-9]{64}$/)) {
        return '0.003%' // SUI
      }
      // SOL address detection (Base58, 32-44 chars)
      if (address.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
        return '0.001%' // SOL
      }
    }
    // Default chain is Solana for most transactions
    return '0.001%'
  }, [transactionType, selectedAsset, recipientAddress])

  const getProviderFeeRate = useCallback(() => {
    // DEX fee for Sell transactions - always 1%
    if (transactionType === 'sell') {
      return '1%' // Fixed 1% DEX fee for all Sell transactions
    }
    
    // DEX fees for transfer operations - only for cross-chain transfers
    if (transactionType === 'transfer') {
      // Detect network from recipient address
      if (!recipientAddress) return '0%'
      
      // Use the same detection logic as fee calculator
      if (recipientAddress.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/) || recipientAddress.match(/^bc1[a-z0-9]{38,58}$/)) {
        return '0.8%' // BTC
      }
      if (recipientAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        return '0.8%' // ETH
      }
      if (recipientAddress.match(/^0x[a-fA-F0-9]{64}$/)) {
        return '0.8%' // SUI
      }
      if (recipientAddress.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
        return '0%' // SOL - no DEX fee
      }
      return '0%' // Invalid or empty address
    }
    
    // For other transactions, payment method is required
    if (!selectedPaymentMethod) return '0%'
    
    // Payment provider fees based on payment method and transaction type
    const isOnRampFee = isOnRamp || (transactionType === 'buy' && selectedPaymentMethod !== 'diboas_wallet')
    const feeType = isOnRampFee ? 'onramp' : 'offramp'
    
    const rates = {
      onramp: {
        'apple_pay': '0.5%',
        'credit_debit_card': '1%', 
        'bank_account': '1%',
        'google_pay': '0.5%',
        'paypal': '3%'
      },
      offramp: {
        'apple_pay': '1%',
        'credit_debit_card': '2%',
        'bank_account': '2%', 
        'google_pay': '1%',
        'paypal': '4%'
      }
    }
    
    return rates[feeType]?.[selectedPaymentMethod] || '0%'
  }, [selectedPaymentMethod, transactionType, isOnRamp, recipientAddress])

  const getPaymentMethodFeeRate = useCallback(() => {
    // This is the same as provider fee for display purposes
    return getProviderFeeRate()
  }, [getProviderFeeRate])

  // Enhanced transaction validation with balance checking
  const isTransactionValid = useMemo(() => {
    if (!amount || parseFloat(amount) <= 0) return false
    if (['send', 'transfer'].includes(transactionType) && !recipientAddress) return false
    if (Object.keys(validationErrors).length > 0) return false
    
    // Balance validation for transactions that require sufficient funds
    const numericAmount = parseFloat(amount)
    if (['send', 'transfer', 'withdraw'].includes(transactionType)) {
      const availableBalance = balance?.availableForSpending || 0
      if (numericAmount > availableBalance) return false
    } else if (transactionType === 'buy' && selectedPaymentMethod === 'diboas_wallet') {
      const availableBalance = balance?.availableForSpending || 0
      if (numericAmount > availableBalance) return false
    }
    
    return true
  }, [amount, transactionType, recipientAddress, validationErrors, balance, selectedPaymentMethod])

  // Event handlers
  const handleTransactionStart = useCallback(async () => {
    try {
      const result = await executeTransactionFlow({
        type: transactionType,
        amount: parseFloat(amount),
        recipient: recipientAddress,
        asset: selectedAsset,
        paymentMethod: selectedPaymentMethod
      })
      
      if (result.requiresTwoFA) {
        // Handle 2FA requirement - implementation pending
        console.log('2FA required for transaction')
      }
    } catch (error) {
      console.error('Transaction failed:', error)
    }
  }, [transactionType, amount, recipientAddress, selectedAsset, selectedPaymentMethod, executeTransactionFlow])

  const handleTransactionConfirm = useCallback(async () => {
    try {
      console.log('TransactionPage: Confirming transaction...')
      const result = await confirmTransaction()
      console.log('TransactionPage: Transaction confirmed with result:', result)
      // Don't navigate immediately - let the flow state transition to 'completed' 
      // and show the success screen first
    } catch (error) {
      console.error('Transaction confirmation failed:', error)
    }
  }, [confirmTransaction])

  // 2FA verification handler - implementation pending
  // const handle2FAVerification = useCallback(async (twoFACode) => {
  //   try {
  //     const result = await verifyTwoFACode(twoFACode)
  //     if (result.success) {
  //       await handleTransactionConfirm()
  //     }
  //   } catch (error) {
  //     console.error('2FA verification failed:', error)
  //   }
  // }, [verifyTwoFACode, handleTransactionConfirm])

  // Fee calculation and validation effect - recalculates when relevant fields change
  useEffect(() => {
    if (debouncedAmount && parseFloat(debouncedAmount) > 0) {
      // Calculate fees
      calculateFees({
        type: transactionType,
        amount: parseFloat(debouncedAmount),
        asset: selectedAsset,
        paymentMethod: selectedPaymentMethod,
        recipient: recipientAddress // Include for network detection in transfers
      })
      
      // Validate transaction
      validateTransaction({
        type: transactionType,
        amount: debouncedAmount,
        recipient: recipientAddress,
        asset: selectedAsset,
        paymentMethod: selectedPaymentMethod
      })
    }
  }, [debouncedAmount, transactionType, selectedAsset, selectedPaymentMethod, recipientAddress, calculateFees, validateTransaction])
  
  // Additional validation when balance changes or form loads
  useEffect(() => {
    if (amount && parseFloat(amount) > 0) {
      validateTransaction({
        type: transactionType,
        amount: amount,
        recipient: recipientAddress,
        asset: selectedAsset,
        paymentMethod: selectedPaymentMethod
      })
    }
  }, [balance, validateTransaction, amount, transactionType, recipientAddress, selectedAsset, selectedPaymentMethod])
  
  // Initial validation on component mount and transaction type change
  useEffect(() => {
    if (amount) {
      validateTransaction({
        type: transactionType,
        amount: amount,
        recipient: recipientAddress,
        asset: selectedAsset,
        paymentMethod: selectedPaymentMethod
      })
    }
  }, [transactionType, validateTransaction, amount, recipientAddress, selectedAsset, selectedPaymentMethod])

  // Show transaction progress screen if in progress
  if (flowState === 'processing' || flowState === 'confirming' || flowState === 'completed' || flowState === 'pending') {
    console.log('TransactionPage: Rendering progress screen with flowState:', flowState, 'isCompleted:', flowState === 'completed')
    
    return (
      <TransactionProgressScreen
        transactionData={{
          type: transactionType,
          amount: amount,
          recipient: recipientAddress,
          asset: selectedAsset,
          paymentMethod: selectedPaymentMethod
        }}
        isCompleted={flowState === 'completed'}
        isError={flowState === 'error'}
        errorMessage={flowError?.message || ''}
        fees={flowData?.fees}
        result={flowData?.result}
        onConfirm={handleTransactionConfirm}
        onCancel={() => resetFlow()}
        flowState={flowState}
        flowData={flowData}
        flowError={flowError}
      />
    )
  }

  return (
    <>
      <PageHeader
        title="Transaction"
        description="Send, receive, and manage your finances"
        showBackButton={true}
        backTo="/app"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        
        {/* Transaction Type Selection */}
        <TransactionTypeSelector
          transactionTypes={transactionTypes}
          transactionType={transactionType}
          setTransactionType={setTransactionType}
          propTransactionType={propTransactionType}
          currentType={currentType}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Transaction Form */}
          <TransactionForm
            transactionType={transactionType}
            isOnRamp={isOnRamp}
            isOffRamp={isOffRamp}
            recipientAddress={recipientAddress}
            setRecipientAddress={setRecipientAddress}
            amount={amount}
            setAmount={setAmount}
            selectedAsset={selectedAsset}
            setSelectedAsset={setSelectedAsset}
            selectedPaymentMethod={selectedPaymentMethod}
            setSelectedPaymentMethod={setSelectedPaymentMethod}
            assets={assets}
            buyPaymentMethods={buyPaymentMethods}
            paymentMethods={paymentMethods}
            balance={balance}
            availableBalance={availableBalance}
            validationErrors={validationErrors}
            showRecipientAddress={showRecipientAddress}
            setShowRecipientAddress={setShowRecipientAddress}
            currentType={currentType}
          />

          {/* Transaction Summary */}
          <TransactionSummary
            amount={amount}
            transactionType={transactionType}
            selectedAsset={selectedAsset}
            assets={assets}
            fees={fees}
            currentType={currentType}
            isOnRamp={isOnRamp}
            isOffRamp={isOffRamp}
            selectedPaymentMethod={selectedPaymentMethod}
            handleTransactionStart={handleTransactionStart}
            isTransactionValid={isTransactionValid}
            getNetworkFeeRate={getNetworkFeeRate}
            getProviderFeeRate={getProviderFeeRate}
            getPaymentMethodFeeRate={getPaymentMethodFeeRate}
            recipientAddress={recipientAddress}
          />
        </div>
      </div>
    </>
  )
}