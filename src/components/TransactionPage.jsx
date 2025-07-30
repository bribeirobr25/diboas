import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'

// Components
import PageHeader from './shared/PageHeader.jsx'
import TransactionProgressScreen from './shared/TransactionProgressScreen.jsx'
import EnhancedTransactionProgressScreen from './shared/EnhancedTransactionProgressScreen.jsx'
import TransactionTypeSelector from './transactions/TransactionTypeSelector.jsx'
import TransactionForm from './transactions/TransactionForm.jsx'
import TransactionSummary from './transactions/TransactionSummary.jsx'
import TransactionDetailsPage from './TransactionDetailsPage.jsx'

// Icons
import { 
  Plus, Send, TrendingUp, TrendingDown,
  CreditCard, Wallet
} from 'lucide-react'

// Hooks and utilities
import { useValueDebounce } from '../hooks/useValueDebounce.js'
import { 
  useWalletBalance, 
  useFeeCalculator, 
  useTransactionValidation, 
  useTransactionFlow
} from '../hooks/transactions/index.js'

export default function TransactionPage({ transactionType: propTransactionType, category }) {
  // const navigate = useNavigate() // Commented out as not used directly
  const [urlSearchParams] = useSearchParams()
  
  // Check if this is a transaction details view (id parameter) or transaction creation (type parameter)
  const transactionId = urlSearchParams.get('id')
  const isViewingTransaction = !!transactionId
  
  // Support both prop-based routing (new RESTful) and query parameter routing (legacy)
  const initialTransactionType = propTransactionType || urlSearchParams.get('type') || 'add'
  
  // Get asset from URL parameters (for buy/sell transactions from investment category)
  const assetFromUrl = urlSearchParams.get('asset')
  
  // Core transaction state with semantic naming
  const [currentTransactionType, setCurrentTransactionType] = useState(initialTransactionType)
  const [transactionAmountInput, setTransactionAmountInput] = useState('')
  const [recipientWalletAddress, setRecipientWalletAddress] = useState('')
  const [selectedCryptocurrencyAsset, setSelectedCryptocurrencyAsset] = useState(assetFromUrl || 'USD')
  const [chosenPaymentMethod, setChosenPaymentMethod] = useState('')
  const [isRecipientAddressFieldVisible, setIsRecipientAddressFieldVisible] = useState(false)
  
  // Sync transaction type with prop changes (for RESTful routing)
  useEffect(() => {
    if (propTransactionType && propTransactionType !== currentTransactionType) {
      setCurrentTransactionType(propTransactionType)
    }
  }, [propTransactionType, currentTransactionType])

  // Ensure fiat-only transactions always use USD
  useEffect(() => {
    if (['add', 'withdraw', 'send', 'transfer'].includes(currentTransactionType)) {
      setSelectedCryptocurrencyAsset('USD')
    }
    // For buy/sell transactions, set asset from URL if available
    else if (['buy', 'sell'].includes(currentTransactionType) && assetFromUrl) {
      setSelectedCryptocurrencyAsset(assetFromUrl)
    }
    // Prevent Buy USD - default to first crypto asset if USD is selected for buy
    else if (currentTransactionType === 'buy' && selectedCryptocurrencyAsset === 'USD' && !assetFromUrl) {
      // Default to BTC for buy transactions when no asset specified in URL
      setSelectedCryptocurrencyAsset('BTC')
    }
  }, [currentTransactionType, assetFromUrl])
  
  // Transaction system hooks with semantic destructuring
  const { balance: currentWalletBalance } = useWalletBalance()
  const { fees: calculatedTransactionFees, calculateFees: calculateTransactionFees } = useFeeCalculator()
  const { validationErrors: transactionValidationErrors, validateTransaction: validateTransactionInput } = useTransactionValidation()
  const { 
    flowState: transactionFlowState, 
    flowData: transactionFlowData, 
    flowError: transactionFlowError, 
    executeTransactionFlow: executeCompleteTransactionFlow, 
    confirmTransaction: confirmPendingTransaction, 
    resetFlow: resetTransactionFlow 
  } = useTransactionFlow()
  // const { verifyTwoFACode } = useTransactionTwoFA() // Commented out - implementation pending

  // Transaction type configuration with semantic naming
  const allTransactionTypeConfigs = [
    { 
      id: 'add', 
      label: 'Add', 
      icon: <Plus className="w-4 h-4" />, 
      description: 'Add money to your diBoaS wallet',
      bgColor: 'bg-green-50', 
      color: 'text-green-700', 
      borderColor: 'border-green-200',
      category: 'banking'
    },
    { 
      id: 'send', 
      label: 'Send', 
      icon: <Send className="w-4 h-4" />, 
      description: 'Send money to another diBoaS user',
      bgColor: 'bg-blue-50', 
      color: 'text-blue-700', 
      borderColor: 'border-blue-200',
      category: 'banking' 
    },
    { 
      id: 'buy', 
      label: 'Buy', 
      icon: <TrendingUp className="w-4 h-4" />, 
      description: 'Buy cryptocurrency assets',
      bgColor: 'bg-emerald-50', 
      color: 'text-emerald-700', 
      borderColor: 'border-emerald-200',
      category: 'investment' 
    },
    { 
      id: 'sell', 
      label: 'Sell', 
      icon: <TrendingDown className="w-4 h-4" />, 
      description: 'Sell your crypto assets back to USD',
      bgColor: 'bg-red-50', 
      color: 'text-red-700', 
      borderColor: 'border-red-200',
      category: 'investment' 
    },
    { 
      id: 'withdraw', 
      label: 'Withdraw', 
      icon: <CreditCard className="w-4 h-4" />, 
      description: 'Withdraw funds to bank or external wallet',
      bgColor: 'bg-indigo-50', 
      color: 'text-indigo-700', 
      borderColor: 'border-indigo-200',
      category: 'banking' 
    }
  ]

  // Filter transaction types by category if category is provided
  const availableTransactionTypeConfigs = category 
    ? allTransactionTypeConfigs.filter(config => config.category === category)
    : allTransactionTypeConfigs

  const supportedCryptocurrencyAssets = [
    // Cryptocurrencies
    { assetId: 'BTC', tickerSymbol: 'BTC', displayName: 'Bitcoin', currencyIcon: '₿', currentMarketPrice: '$94,523.45', themeClasses: { bgColor: 'bg-orange-50', textColor: 'text-orange-700', borderColor: 'border-orange-200' }, category: 'crypto' },
    { assetId: 'ETH', tickerSymbol: 'ETH', displayName: 'Ethereum', currencyIcon: 'Ξ', currentMarketPrice: '$3,245.67', themeClasses: { bgColor: 'bg-blue-50', textColor: 'text-blue-700', borderColor: 'border-blue-200' }, category: 'crypto' },
    { assetId: 'SOL', tickerSymbol: 'SOL', displayName: 'Solana', currencyIcon: '◎', currentMarketPrice: '$198.23', themeClasses: { bgColor: 'bg-purple-50', textColor: 'text-purple-700', borderColor: 'border-purple-200' }, category: 'crypto' },
    { assetId: 'SUI', tickerSymbol: 'SUI', displayName: 'Sui', currencyIcon: 'Ⓢ', currentMarketPrice: '$4.23', themeClasses: { bgColor: 'bg-cyan-50', textColor: 'text-cyan-700', borderColor: 'border-cyan-200' }, category: 'crypto' },
    
    // Tokenized Gold
    { assetId: 'PAXG', tickerSymbol: 'PAXG', displayName: 'PAX Gold', currencyIcon: '🪙', currentMarketPrice: '$2,687.34', themeClasses: { bgColor: 'bg-yellow-50', textColor: 'text-yellow-700', borderColor: 'border-yellow-200' }, category: 'tokenized' },
    { assetId: 'XAUT', tickerSymbol: 'XAUT', displayName: 'Tether Gold', currencyIcon: '🥇', currentMarketPrice: '$2,684.12', themeClasses: { bgColor: 'bg-amber-50', textColor: 'text-amber-700', borderColor: 'border-amber-200' }, category: 'tokenized' },
    
    // Stock Market Indices
    { assetId: 'MAG7', tickerSymbol: 'MAG7', displayName: 'Magnificent 7', currencyIcon: '📈', currentMarketPrice: '$512.45', themeClasses: { bgColor: 'bg-indigo-50', textColor: 'text-indigo-700', borderColor: 'border-indigo-200' }, category: 'stocks', description: 'Apple, Microsoft, Google, Amazon, Meta, Tesla, Nvidia' },
    { assetId: 'SPX', tickerSymbol: 'S&P500', displayName: 'S&P 500 Index', currencyIcon: '📊', currentMarketPrice: '$5,234.18', themeClasses: { bgColor: 'bg-emerald-50', textColor: 'text-emerald-700', borderColor: 'border-emerald-200' }, category: 'stocks' },
    
    // Real Estate
    { assetId: 'REIT', tickerSymbol: 'REIT', displayName: 'Real Estate Fund', currencyIcon: '🏢', currentMarketPrice: '$89.67', themeClasses: { bgColor: 'bg-stone-50', textColor: 'text-stone-700', borderColor: 'border-stone-200' }, category: 'realestate' }
  ]

  const availablePaymentMethodOptions = [
    { methodId: 'credit_debit_card', displayLabel: 'Credit/Debit Card', paymentIcon: <CreditCard className="w-4 h-4" /> },
    { methodId: 'bank_account', displayLabel: 'Bank Account', paymentIcon: '🏦' },
    { methodId: 'apple_pay', displayLabel: 'Apple Pay', paymentIcon: '🍎' },
    { methodId: 'google_pay', displayLabel: 'Google Pay', paymentIcon: '🅶' },
    { methodId: 'paypal', displayLabel: 'PayPal', paymentIcon: '💰' }
  ]

  const buyTransactionPaymentMethods = [
    { methodId: 'diboas_wallet', displayLabel: 'diBoaS Wallet', paymentIcon: <Wallet className="w-4 h-4" /> },
    { methodId: 'credit_debit_card', displayLabel: 'Credit/Debit Card', paymentIcon: <CreditCard className="w-4 h-4" /> },
    { methodId: 'bank_account', displayLabel: 'Bank Account', paymentIcon: '🏦' },
    { methodId: 'apple_pay', displayLabel: 'Apple Pay', paymentIcon: '🍎' },
    { methodId: 'google_pay', displayLabel: 'Google Pay', paymentIcon: '🅶' },
    { methodId: 'paypal', displayLabel: 'PayPal', paymentIcon: '💰' }
  ]

  // Debounced amount for fee calculation with semantic naming
  const debouncedTransactionAmount = useValueDebounce(transactionAmountInput, 500)

  // Computed transaction configuration values
  const selectedTransactionTypeConfig = availableTransactionTypeConfigs.find(typeConfig => typeConfig.id === currentTransactionType)
  const isOnRampTransaction = ['add'].includes(currentTransactionType)
  const isOffRampTransaction = ['withdraw'].includes(currentTransactionType)
  const userAvailableBalance = selectedCryptocurrencyAsset === 'USD' 
    ? currentWalletBalance?.availableForSpending || 0 
    : currentWalletBalance?.assets?.[selectedCryptocurrencyAsset]?.investedAmount || 0

  // Fee calculation helpers with dynamic updates and semantic naming
  const calculateNetworkFeePercentage = useCallback(() => {
    // Network fees based on asset/chain - from TRANSACTIONS.md
    if (['buy', 'sell'].includes(currentTransactionType) && selectedCryptocurrencyAsset) {
      const networkFeeRatesByAsset = { 
        'BTC': '9%', 
        'ETH': '0.5%', 
        'SOL': '0.001%', 
        'SUI': '0.003%',
        'PAXG': '0.5%', // PAX Gold uses Ethereum network fees
        'XAUT': '0.5%',  // Tether Gold uses Ethereum network fees
        'MAG7': '0.001%', // Tokenized stocks on Solana
        'SPX': '0.001%',  // Tokenized stocks on Solana
        'REIT': '0.001%'  // Tokenized real estate on Solana
      }
      return networkFeeRatesByAsset[selectedCryptocurrencyAsset] || '0.001%' // Default to Solana for USDC
    }
    // For transfer transactions and external wallet withdrawals, detect network from recipient address
    if ((currentTransactionType === 'transfer' || (currentTransactionType === 'withdraw' && chosenPaymentMethod === 'external_wallet')) && recipientWalletAddress) {
      const cleanRecipientAddress = recipientWalletAddress.trim()
      // BTC address detection
      if (cleanRecipientAddress.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/) || cleanRecipientAddress.match(/^bc1[a-z0-9]{39,59}$/)) {
        return '9%' // BTC
      }
      // ETH address detection
      if (cleanRecipientAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        return '0.5%' // ETH
      }
      // SUI address detection (0x followed by 64 hex chars)
      if (cleanRecipientAddress.match(/^0x[a-fA-F0-9]{64}$/)) {
        return '0.003%' // SUI
      }
      // SOL address detection (Base58, 32-44 chars)
      if (cleanRecipientAddress.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
        return '0.001%' // SOL
      }
    }
    // Default chain is Solana for most transactions
    return '0.001%'
  }, [currentTransactionType, selectedCryptocurrencyAsset, recipientWalletAddress, chosenPaymentMethod])

  const calculateProviderFeePercentage = useCallback(() => {
    // DEX fee for Buy/Sell transactions with diBoaS wallet - 0.2%
    if ((currentTransactionType === 'buy' || currentTransactionType === 'sell') && chosenPaymentMethod === 'diboas_wallet') {
      return '0.2%' // Fixed 0.2% DEX fee for Buy/Sell with diBoaS wallet
    }
    
    // DEX fees for transfer operations - only for cross-chain transfers
    if (currentTransactionType === 'transfer' || (currentTransactionType === 'withdraw' && chosenPaymentMethod === 'external_wallet')) {
      // Detect network from recipient address
      if (!recipientWalletAddress) return '0%'
      
      // Use the same detection logic as fee calculator
      const cleanAddress = recipientWalletAddress.trim()
      if (cleanAddress.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/) || cleanAddress.match(/^bc1[a-z0-9]{39,59}$/)) {
        return '0.8%' // BTC - cross-chain DEX fee
      }
      if (cleanAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        return '0.8%' // ETH - cross-chain DEX fee
      }
      if (cleanAddress.match(/^0x[a-fA-F0-9]{64}$/)) {
        return '0.8%' // SUI - cross-chain DEX fee
      }
      if (cleanAddress.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
        return '0%' // SOL - no DEX fee (same chain)
      }
      return '0%' // Invalid or empty address
    }
    
    // For other transactions, payment method is required
    if (!chosenPaymentMethod) return '0%'
    
    // Payment provider fees based on payment method and transaction type
    const isOnRampFee = isOnRampTransaction || (currentTransactionType === 'buy' && chosenPaymentMethod !== 'diboas_wallet')
    const feeType = isOnRampFee ? 'onramp' : 'offramp'
    
    const providerFeeRatesByMethod = {
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
    
    return providerFeeRatesByMethod[feeType]?.[chosenPaymentMethod] || '0%'
  }, [chosenPaymentMethod, currentTransactionType, isOnRampTransaction, recipientWalletAddress])

  const calculatePaymentMethodFeePercentage = useCallback(() => {
    // This is the same as provider fee for display purposes
    return calculateProviderFeePercentage()
  }, [calculateProviderFeePercentage])

  // Enhanced transaction validation with balance checking
  const isTransactionInputValid = useMemo(() => {
    if (!transactionAmountInput || parseFloat(transactionAmountInput) <= 0) return false
    if (['send', 'transfer'].includes(currentTransactionType) && !recipientWalletAddress) return false
    // For withdraw, only require address if external_wallet is selected
    if (currentTransactionType === 'withdraw' && chosenPaymentMethod === 'external_wallet' && !recipientWalletAddress) return false
    if (Object.keys(transactionValidationErrors).length > 0) return false
    
    // Balance validation for transactions that require sufficient funds
    const numericTransactionAmount = parseFloat(transactionAmountInput)
    if (['send', 'transfer', 'withdraw'].includes(currentTransactionType)) {
      const availableWalletBalance = currentWalletBalance?.availableForSpending || 0
      if (numericTransactionAmount > availableWalletBalance) return false
    } else if (currentTransactionType === 'buy' && chosenPaymentMethod === 'diboas_wallet') {
      const availableWalletBalance = currentWalletBalance?.availableForSpending || 0
      if (numericTransactionAmount > availableWalletBalance) return false
    }
    
    return true
  }, [transactionAmountInput, currentTransactionType, recipientWalletAddress, transactionValidationErrors, currentWalletBalance, chosenPaymentMethod])

  // Event handlers
  const handleTransactionStart = useCallback(async () => {
    try {
      const transactionRequestData = await executeCompleteTransactionFlow({
        type: currentTransactionType,
        amount: parseFloat(transactionAmountInput),
        recipient: recipientWalletAddress,
        asset: selectedCryptocurrencyAsset,
        paymentMethod: chosenPaymentMethod
      })
      
      if (transactionRequestData.requiresTwoFA) {
        // Handle 2FA requirement - implementation pending
      }
    } catch (error) {
      console.error('Transaction failed:', error)
      // Error will be handled by TransactionProgressScreen via flowError
    }
  }, [currentTransactionType, transactionAmountInput, recipientWalletAddress, selectedCryptocurrencyAsset, chosenPaymentMethod, executeCompleteTransactionFlow])

  const handleTransactionConfirm = useCallback(async () => {
    try {
      await confirmPendingTransaction()
      // Don't navigate immediately - let the flow state transition to 'completed' 
      // and show the success screen first
    } catch (error) {
      console.error('Transaction confirmation failed:', error)
      // Error will be handled by TransactionProgressScreen via flowError
    }
  }, [confirmPendingTransaction])

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
    if (debouncedTransactionAmount && parseFloat(debouncedTransactionAmount) > 0) {
      // Calculate fees with correct API parameters
      const feeParams = {
        type: currentTransactionType,
        amount: parseFloat(debouncedTransactionAmount),
        chains: ['SOL'], // Default to SOL, will be updated based on transaction type
        paymentMethod: chosenPaymentMethod,
        asset: selectedCryptocurrencyAsset || 'USDC'
      }
      
      // Add recipient for transfer and external wallet withdrawal transactions
      if ((currentTransactionType === 'transfer' || (currentTransactionType === 'withdraw' && chosenPaymentMethod === 'external_wallet')) && recipientWalletAddress) {
        feeParams.recipient = recipientWalletAddress
      }
      
      // Update chains based on transaction type
      if (currentTransactionType === 'buy' || currentTransactionType === 'sell') {
        // Map assets to their native chains
        const assetChainMap = {
          'BTC': ['SOL', 'BTC'], // From SOL to BTC
          'ETH': ['SOL', 'ETH'], // From SOL to ETH  
          'SUI': ['SOL', 'SUI'], // From SOL to SUI
          'SOL': ['SOL'], // SOL to SOL
          'USDC': ['SOL'], // USDC on SOL
          'PAXG': ['SOL', 'ETH'], // PAX Gold on Ethereum via bridge
          'XAUT': ['SOL', 'ETH'], // Tether Gold on Ethereum via bridge
          'MAG7': ['SOL'], // Tokenized on Solana
          'SPX': ['SOL'], // Tokenized on Solana
          'REIT': ['SOL'] // Tokenized on Solana
        }
        feeParams.chains = assetChainMap[selectedCryptocurrencyAsset] || ['SOL']
      } else if ((currentTransactionType === 'transfer' || (currentTransactionType === 'withdraw' && chosenPaymentMethod === 'external_wallet')) && recipientWalletAddress) {
        // For transfers and external wallet withdrawals, detect destination chain from address
        if (recipientWalletAddress.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/) || recipientWalletAddress.match(/^bc1[a-z0-9]{39,59}$/)) {
          feeParams.chains = ['SOL', 'BTC'] // SOL to BTC
        } else if (recipientWalletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
          feeParams.chains = ['SOL', 'ETH'] // SOL to ETH
        } else if (recipientWalletAddress.match(/^0x[a-fA-F0-9]{64}$/)) {
          feeParams.chains = ['SOL', 'SUI'] // SOL to SUI
        } else if (recipientWalletAddress.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
          feeParams.chains = ['SOL'] // SOL to SOL
        } else {
          feeParams.chains = ['SOL'] // Invalid address, default to SOL
        }
      }
      
      calculateTransactionFees(feeParams)
      
      // Validate transaction
      validateTransactionInput({
        type: currentTransactionType,
        amount: debouncedTransactionAmount,
        recipient: recipientWalletAddress,
        asset: selectedCryptocurrencyAsset,
        paymentMethod: chosenPaymentMethod
      })
    }
  }, [debouncedTransactionAmount, currentTransactionType, selectedCryptocurrencyAsset, chosenPaymentMethod, recipientWalletAddress, calculateTransactionFees, validateTransactionInput])
  
  // Additional validation when balance changes or form loads
  useEffect(() => {
    if (transactionAmountInput && parseFloat(transactionAmountInput) > 0) {
      validateTransactionInput({
        type: currentTransactionType,
        amount: transactionAmountInput,
        recipient: recipientWalletAddress,
        asset: selectedCryptocurrencyAsset,
        paymentMethod: chosenPaymentMethod
      })
    }
  }, [currentWalletBalance, validateTransactionInput, transactionAmountInput, currentTransactionType, recipientWalletAddress, selectedCryptocurrencyAsset, chosenPaymentMethod])
  
  // Initial validation on component mount and transaction type change
  useEffect(() => {
    if (transactionAmountInput) {
      validateTransactionInput({
        type: currentTransactionType,
        amount: transactionAmountInput,
        recipient: recipientWalletAddress,
        asset: selectedCryptocurrencyAsset,
        paymentMethod: chosenPaymentMethod
      })
    }
  }, [currentTransactionType, validateTransactionInput, transactionAmountInput, recipientWalletAddress, selectedCryptocurrencyAsset, chosenPaymentMethod])

  // Show transaction details page if viewing a specific transaction
  if (isViewingTransaction) {
    return <TransactionDetailsPage transactionId={transactionId} />
  }

  // Show transaction progress screen if in progress
  if (transactionFlowState === 'processing' || transactionFlowState === 'confirming' || transactionFlowState === 'completed' || transactionFlowState === 'pending' || transactionFlowState === 'pending_blockchain') {
    
    // Use enhanced progress screen when we have a transaction ID (indicates on-chain transaction)
    const hasOnChainTransaction = transactionFlowData?.transactionId
    
    if (hasOnChainTransaction) {
      return (
        <EnhancedTransactionProgressScreen
          transactionData={{
            type: currentTransactionType,
            amount: transactionAmountInput,
            recipient: recipientWalletAddress,
            asset: selectedCryptocurrencyAsset,
            paymentMethod: chosenPaymentMethod
          }}
          transactionId={transactionFlowData.transactionId}
          onConfirm={handleTransactionConfirm}
          onCancel={() => resetTransactionFlow()}
          flowState={transactionFlowState}
          flowData={transactionFlowData}
          flowError={transactionFlowError}
        />
      )
    }
    
    // Use legacy progress screen for non-on-chain transactions
    return (
      <TransactionProgressScreen
        transactionData={{
          type: currentTransactionType,
          amount: transactionAmountInput,
          recipient: recipientWalletAddress,
          asset: selectedCryptocurrencyAsset,
          paymentMethod: chosenPaymentMethod
        }}
        isCompleted={transactionFlowState === 'completed'}
        isError={transactionFlowState === 'error'}
        errorMessage={transactionFlowError?.message || ''}
        fees={transactionFlowData?.fees}
        result={transactionFlowData?.result}
        onConfirm={handleTransactionConfirm}
        onCancel={() => resetTransactionFlow()}
        flowState={transactionFlowState}
        flowData={transactionFlowData}
        flowError={transactionFlowError}
      />
    )
  }

  return (
    <>
      <PageHeader
        title="Transaction"
        description="Send, receive, and manage your finances"
        showBackButton={true}
        backTo={category === 'banking' ? '/category/banking' : 
               category === 'investment' ? '/category/investment' : 
               category === 'yield' ? '/category/yield' : '/app'}
      />

      <div className="page-container-wide">
        
        {/* Transaction Type Selection */}
        <TransactionTypeSelector
          transactionTypes={availableTransactionTypeConfigs}
          transactionType={currentTransactionType}
          setTransactionType={setCurrentTransactionType}
          propTransactionType={propTransactionType}
          currentType={selectedTransactionTypeConfig}
          category={category}
        />

        <div className="transaction-form-grid">
          
          {/* Transaction Form */}
          <TransactionForm
            transactionType={currentTransactionType}
            isOnRamp={isOnRampTransaction}
            isOffRamp={isOffRampTransaction}
            recipientAddress={recipientWalletAddress}
            setRecipientAddress={setRecipientWalletAddress}
            amount={transactionAmountInput}
            setAmount={setTransactionAmountInput}
            selectedAsset={selectedCryptocurrencyAsset}
            setSelectedAsset={setSelectedCryptocurrencyAsset}
            selectedPaymentMethod={chosenPaymentMethod}
            setSelectedPaymentMethod={setChosenPaymentMethod}
            assets={supportedCryptocurrencyAssets}
            buyPaymentMethods={buyTransactionPaymentMethods}
            paymentMethods={availablePaymentMethodOptions}
            balance={currentWalletBalance}
            availableBalance={userAvailableBalance}
            validationErrors={transactionValidationErrors}
            showRecipientAddress={isRecipientAddressFieldVisible}
            setShowRecipientAddress={setIsRecipientAddressFieldVisible}
            currentType={selectedTransactionTypeConfig}
          />

          {/* Transaction Summary */}
          <TransactionSummary
            amount={transactionAmountInput}
            transactionType={currentTransactionType}
            selectedAsset={selectedCryptocurrencyAsset}
            assets={supportedCryptocurrencyAssets}
            fees={calculatedTransactionFees}
            currentType={selectedTransactionTypeConfig}
            isOnRamp={isOnRampTransaction}
            isOffRamp={isOffRampTransaction}
            selectedPaymentMethod={chosenPaymentMethod}
            handleTransactionStart={handleTransactionStart}
            isTransactionValid={isTransactionInputValid}
            getNetworkFeeRate={calculateNetworkFeePercentage}
            getProviderFeeRate={calculateProviderFeePercentage}
            getPaymentMethodFeeRate={calculatePaymentMethodFeePercentage}
            recipientAddress={recipientWalletAddress}
          />
        </div>
      </div>
    </>
  )
}