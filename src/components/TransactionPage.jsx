import { useState, useMemo, useCallback, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import logger from '../utils/logger'

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
import { useAssetPrices } from '../hooks/useAssetPrices.js'
import { usePaymentMethods } from '../hooks/usePaymentMethods.jsx'
import { useTransactionTypes } from '../hooks/useTransactionTypes.jsx'
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

  // Ensure fiat-only transactions always use USD and Send uses correct payment method
  useEffect(() => {
    if (['add', 'withdraw', 'send'].includes(currentTransactionType)) {
      setSelectedCryptocurrencyAsset('USD')
    }
    // Send transactions automatically use My Wallet (crypto_wallet) per specification
    if (currentTransactionType === 'send') {
      setChosenPaymentMethod('crypto_wallet')
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
  const { assets: supportedCryptocurrencyAssets, isLoading: isLoadingAssetPrices, error: assetPriceError } = useAssetPrices()
  const { getFormattedPaymentMethods, isLoading: isLoadingPaymentMethods } = usePaymentMethods(currentTransactionType)
  const { fees: calculatedTransactionFees, calculateFees: calculateTransactionFees, isCalculating: isCalculatingFees, error: feeError, isTimeout: isFeeTimeout } = useFeeCalculator()
  const { transactionTypes: allTransactionTypeConfigs, isLoading: isLoadingTransactionTypes } = useTransactionTypes(category)
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

  // Filter transaction types by category if category is provided
  const availableTransactionTypeConfigs = allTransactionTypeConfigs || []

  // supportedCryptocurrencyAssets now comes from useAssetPrices hook

  // Payment methods now come from usePaymentMethods hook
  const { availablePaymentMethodOptions, buyTransactionPaymentMethods } = getFormattedPaymentMethods()

  // Debounced amount for fee calculation with semantic naming
  const debouncedTransactionAmount = useValueDebounce(transactionAmountInput, 500)

  // Computed transaction configuration values
  const selectedTransactionTypeConfig = availableTransactionTypeConfigs.find(typeConfig => typeConfig.id === currentTransactionType)
  const isOnRampTransaction = ['add'].includes(currentTransactionType)
  const isOffRampTransaction = ['withdraw'].includes(currentTransactionType)
  // Calculate available balance based on transaction type and selected asset
  const userAvailableBalance = useMemo(() => {
    if (currentTransactionType === 'buy') {
      // For buy transactions, always show available spending balance (USD)
      return currentWalletBalance?.availableForSpending || 0
    } else if (currentTransactionType === 'sell') {
      // For sell transactions, show invested amount for the selected asset
      return currentWalletBalance?.assets?.[selectedCryptocurrencyAsset]?.investedAmount || 0
    } else if (currentTransactionType === 'stop_strategy') {
      // For stop strategy transactions, show strategy balance
      const strategyId = urlSearchParams.get('strategyId')
      return currentWalletBalance?.strategies?.[strategyId]?.currentAmount || 0
    } else {
      // For other transactions (send, transfer, withdraw), show available spending balance
      return currentWalletBalance?.availableForSpending || 0
    }
  }, [currentTransactionType, selectedCryptocurrencyAsset, currentWalletBalance, urlSearchParams])

  // Fee calculation helpers with dynamic updates and semantic naming
  const calculateNetworkFeePercentage = useCallback(() => {
    // Send transactions always use Solana chain per specification section 3.1.3
    if (currentTransactionType === 'send') {
      return '0.0001%' // Solana network fee for Send (P2P transfer)
    }
    
    // Network fees based on asset/chain - from TRANSACTIONS.md section 4.1
    if (['buy', 'sell'].includes(currentTransactionType) && selectedCryptocurrencyAsset) {
      const networkFeeRatesByAsset = { 
        'BTC': '1%',      // Fixed: was 9%, should be 1% per TRANSACTIONS.md
        'ETH': '0.5%',    // Correct
        'SOL': '0.0001%', // Fixed: was 0.001%, should be 0.0001% per TRANSACTIONS.md
        'SUI': '0.0005%', // Fixed: was 0.0003%, should match MockupFeeProviderService rate of 0.000005
        'PAXG': '0.5%',   // PAX Gold uses Ethereum network fees
        'XAUT': '0.5%',   // Tether Gold uses Ethereum network fees
        'MAG7': '0.0001%', // Tokenized stocks on Solana
        'SPX': '0.0001%',  // Tokenized stocks on Solana
        'REIT': '0.0001%'  // Tokenized real estate on Solana
      }
      return networkFeeRatesByAsset[selectedCryptocurrencyAsset] || '0.0001%' // Default to Solana for USDC
    }
    // For stop_strategy, use the strategy's chain
    if (currentTransactionType === 'stop_strategy') {
      const strategyId = urlSearchParams.get('strategyId')
      const strategy = currentWalletBalance?.strategies?.[strategyId]
      const chain = strategy?.chain || 'SOL'
      const networkFeeRatesByChain = {
        'BTC': '1%',
        'ETH': '0.5%',
        'SOL': '0.0001%',
        'SUI': '0.0005%' // Fixed: was 0.0003%, should match MockupFeeProviderService rate of 0.000005
      }
      return networkFeeRatesByChain[chain] || '0.0001%'
    }
    // For external wallet withdrawals, detect network from recipient address
    if ((currentTransactionType === 'withdraw' && chosenPaymentMethod === 'external_wallet') && recipientWalletAddress) {
      const cleanRecipientAddress = recipientWalletAddress.trim()
      // BTC address detection
      if (cleanRecipientAddress.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/) || cleanRecipientAddress.match(/^bc1[a-z0-9]{39,59}$/)) {
        return '1%' // Fixed: was 9%, should be 1% per TRANSACTIONS.md
      }
      // ETH address detection
      if (cleanRecipientAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        return '0.5%' // ETH
      }
      // SUI address detection (0x followed by 64 hex chars)
      if (cleanRecipientAddress.match(/^0x[a-fA-F0-9]{64}$/)) {
        return '0.0005%' // Fixed: was 0.0003%, should match MockupFeeProviderService rate of 0.000005
      }
      // SOL address detection (Base58, 32-44 chars)
      if (cleanRecipientAddress.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
        return '0.0001%' // Fixed: was 0.001%, should be 0.0001% per TRANSACTIONS.md
      }
    }
    // Default chain is Solana for most transactions
    return '0.0001%' // Fixed: was 0.001%, should be 0.0001% per TRANSACTIONS.md
  }, [currentTransactionType, selectedCryptocurrencyAsset, recipientWalletAddress, chosenPaymentMethod, urlSearchParams, currentWalletBalance])

  const calculateProviderFeePercentage = useCallback(() => {
    // DEX fee for Buy/Sell transactions with diBoaS wallet - per TRANSACTIONS.md section 4.3
    if ((currentTransactionType === 'buy' || currentTransactionType === 'sell') && chosenPaymentMethod === 'diboas_wallet') {
      // Check if using Solana chain (0% DEX fee) or non-Solana (0.8% DEX fee)
      const assetChainMap = {
        'BTC': '0.8%',   // Non-Solana chain
        'ETH': '0.8%',   // Non-Solana chain  
        'SUI': '0.8%',   // Non-Solana chain
        'SOL': '0%',     // Solana chain
        'USDC': '0%',    // On Solana
        'PAXG': '0.8%',  // Ethereum network 
        'XAUT': '0.8%',  // Ethereum network
        'MAG7': '0%',    // Solana network
        'SPX': '0%',     // Solana network
        'REIT': '0%'     // Solana network
      }
      return assetChainMap[selectedCryptocurrencyAsset] || '0%' // Default to Solana (0%)
    }
    
    // DeFi fee for stop_strategy transactions per TRANSACTIONS.md section 4.3
    if (currentTransactionType === 'stop_strategy') {
      const strategyId = urlSearchParams.get('strategyId')
      const strategy = currentWalletBalance?.strategies?.[strategyId]
      const chain = strategy?.chain || 'SOL'
      const defiFeeRatesByChain = {
        'SOL': '0.7%',   // Per TRANSACTIONS.md
        'SUI': '0.9%',   // Per TRANSACTIONS.md
        'ETH': '1.2%',   // Per TRANSACTIONS.md
        'BTC': '1.5%'    // Per TRANSACTIONS.md
      }
      return defiFeeRatesByChain[chain] || '0.7%'
    }
    
    // DEX fees for external wallet withdrawals - depends on destination chain per TRANSACTIONS.md
    if (currentTransactionType === 'withdraw' && chosenPaymentMethod === 'external_wallet') {
      // Detect network from recipient address
      if (!recipientWalletAddress) return '0%'
      
      const cleanAddress = recipientWalletAddress.trim()
      
      // Check BTC addresses first (to avoid confusion with SOL addresses starting with 1)
      if (cleanAddress.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/) || cleanAddress.match(/^bc1[a-z0-9]{39,59}$/)) {
        return '0.8%' // BTC - cross-chain DEX fee per TRANSACTIONS.md
      }
      // ETH address
      if (cleanAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
        return '0.8%' // ETH - cross-chain DEX fee per TRANSACTIONS.md
      }
      // SUI address
      if (cleanAddress.match(/^0x[a-fA-F0-9]{64}$/)) {
        return '0.8%' // SUI - cross-chain DEX fee per TRANSACTIONS.md
      }
      // SOL address - no DEX fee (same chain) per TRANSACTIONS.md
      if (cleanAddress.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
        return '0%' // SOL - no DEX fee per TRANSACTIONS.md
      }
      
      // Default to 0.8% for unknown addresses (assumed cross-chain)
      return '0.8%'
    }
    
    
    // For other transactions, payment method is required
    if (!chosenPaymentMethod) return '0%'
    
    // Payment provider fees based on payment method and transaction type per TRANSACTIONS.md
    const isOnRampFee = isOnRampTransaction || (currentTransactionType === 'buy' && chosenPaymentMethod !== 'diboas_wallet')
    const feeType = isOnRampFee ? 'onramp' : 'offramp'
    
    const providerFeeRatesByMethod = {
      onramp: {
        'apple_pay': '0.5%',      // Per TRANSACTIONS.md
        'credit_debit_card': '1%', 
        'bank_account': '1%',
        'google_pay': '0.5%',
        'paypal': '3%'
      },
      offramp: {
        'apple_pay': '3%',        // Fixed: was 1%, should be 3% per TRANSACTIONS.md
        'credit_debit_card': '2%',
        'bank_account': '2%', 
        'google_pay': '3%',       // Fixed: was 1%, should be 3% per TRANSACTIONS.md
        'paypal': '4%'
      }
    }
    
    return providerFeeRatesByMethod[feeType]?.[chosenPaymentMethod] || '0%'
  }, [chosenPaymentMethod, currentTransactionType, isOnRampTransaction, recipientWalletAddress, urlSearchParams, currentWalletBalance, selectedCryptocurrencyAsset])

  const calculatePaymentMethodFeePercentage = useCallback(() => {
    // This is the same as provider fee for display purposes
    return calculateProviderFeePercentage()
  }, [calculateProviderFeePercentage])

  // Enhanced transaction validation with balance checking
  const isTransactionInputValid = useMemo(() => {
    if (!transactionAmountInput || parseFloat(transactionAmountInput) <= 0) return false
    if (currentTransactionType === 'send' && !recipientWalletAddress) return false
    // For withdraw, only require address if external_wallet is selected
    if (currentTransactionType === 'withdraw' && chosenPaymentMethod === 'external_wallet' && !recipientWalletAddress) return false
    
    // Payment method validation for transactions that require it
    if (['add', 'buy', 'withdraw'].includes(currentTransactionType) && !chosenPaymentMethod) return false
    
    if (Object.keys(transactionValidationErrors).length > 0) return false
    
    // Balance validation for transactions that require sufficient funds
    const numericTransactionAmount = parseFloat(transactionAmountInput)
    if (['send', 'withdraw'].includes(currentTransactionType)) {
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
      // Calculate the correct chains parameter for the transaction flow
      let chains = ['SOL'] // Default to SOL
      
      // Update chains based on transaction type (same logic as fee calculation)
      if (currentTransactionType === 'buy' || currentTransactionType === 'sell') {
        // For buy/sell, network fee should be based on the target asset's native chain
        const assetChainMap = {
          'BTC': ['BTC'], 'ETH': ['ETH'], 'SUI': ['SUI'], 'SOL': ['SOL'],
          'USDC': ['SOL'], 'PAXG': ['ETH'], 'XAUT': ['ETH'], 
          'MAG7': ['SOL'], 'SPX': ['SOL'], 'REIT': ['SOL']
        }
        chains = assetChainMap[selectedCryptocurrencyAsset] || ['SOL']
      } else if (currentTransactionType === 'stop_strategy') {
        // For stop_strategy, use the strategy's chain
        const strategyId = urlSearchParams.get('strategyId')
        const strategy = currentWalletBalance?.strategies?.[strategyId]
        chains = [strategy?.chain || 'SOL']
      } else if ((currentTransactionType === 'withdraw' && chosenPaymentMethod === 'external_wallet') && recipientWalletAddress) {
        // For external wallet withdrawals, detect destination chain from address
        if (recipientWalletAddress.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/) || recipientWalletAddress.match(/^bc1[a-z0-9]{39,59}$/)) {
          chains = ['BTC']
        } else if (recipientWalletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
          chains = ['ETH']
        } else if (recipientWalletAddress.match(/^0x[a-fA-F0-9]{64}$/)) {
          chains = ['SUI']
        } else if (recipientWalletAddress.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
          chains = ['SOL']
        }
      }
      
      const transactionData = {
        type: currentTransactionType,
        amount: parseFloat(transactionAmountInput),
        recipient: recipientWalletAddress,
        asset: selectedCryptocurrencyAsset,
        paymentMethod: chosenPaymentMethod,
        chains: chains // Include the correct chains parameter
        // Don't pass fees here - let executeTransactionFlow calculate fresh numeric fees
      }
      
      // Add strategyId for stop_strategy transactions
      if (currentTransactionType === 'stop_strategy') {
        transactionData.strategyId = urlSearchParams.get('strategyId')
      }
      
      const transactionRequestData = await executeCompleteTransactionFlow(transactionData)
      
      if (transactionRequestData.requiresTwoFA) {
        // Handle 2FA requirement - implementation pending
      }
    } catch (error) {
      logger.error('Transaction failed:', error)
      // Error will be handled by TransactionProgressScreen via flowError
    }
  }, [currentTransactionType, transactionAmountInput, recipientWalletAddress, selectedCryptocurrencyAsset, chosenPaymentMethod, executeCompleteTransactionFlow, urlSearchParams, currentWalletBalance])

  const handleTransactionConfirm = useCallback(async () => {
    try {
      await confirmPendingTransaction()
      // Don't navigate immediately - let the flow state transition to 'completed' 
      // and show the success screen first
    } catch (error) {
      logger.error('Transaction confirmation failed:', error)
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
  //     logger.error('2FA verification failed:', error)
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
      if ((currentTransactionType === 'withdraw' && chosenPaymentMethod === 'external_wallet') && recipientWalletAddress) {
        feeParams.recipient = recipientWalletAddress
      }
      
      // Update chains based on transaction type
      if (currentTransactionType === 'send') {
        // Send transactions always use Solana chain per specification section 3.1.3
        feeParams.chains = ['SOL']
        feeParams.asset = 'USD' // Send transactions are in USD with USDC + SOL gas
      } else if (currentTransactionType === 'buy' || currentTransactionType === 'sell') {
        // For buy/sell, network fee should be based on the target asset's native chain
        // The fee calculator uses chains[0] for network fee calculation
        const assetChainMap = {
          'BTC': ['BTC'], // BTC network fees for BTC transactions
          'ETH': ['ETH'], // ETH network fees for ETH transactions
          'SUI': ['SUI'], // SUI network fees for SUI transactions
          'SOL': ['SOL'], // SOL network fees for SOL transactions
          'USDC': ['SOL'], // USDC uses SOL network
          'PAXG': ['ETH'], // PAX Gold uses Ethereum network
          'XAUT': ['ETH'], // Tether Gold uses Ethereum network
          'MAG7': ['SOL'], // Tokenized stocks use Solana
          'SPX': ['SOL'], // Tokenized stocks use Solana
          'REIT': ['SOL'] // Tokenized real estate uses Solana
        }
        feeParams.chains = assetChainMap[selectedCryptocurrencyAsset] || ['SOL']
      } else if (currentTransactionType === 'stop_strategy') {
        // For stop_strategy, use the strategy's chain
        const strategyId = urlSearchParams.get('strategyId')
        const strategy = currentWalletBalance?.strategies?.[strategyId]
        feeParams.chains = [strategy?.chain || 'SOL']
        feeParams.strategyId = strategyId
      } else if ((currentTransactionType === 'withdraw' && chosenPaymentMethod === 'external_wallet') && recipientWalletAddress) {
        // For external wallet withdrawals, detect destination chain from address
        // Use destination chain as primary for network fee calculation
        if (recipientWalletAddress.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/) || recipientWalletAddress.match(/^bc1[a-z0-9]{39,59}$/)) {
          feeParams.chains = ['BTC'] // BTC network fees
        } else if (recipientWalletAddress.match(/^0x[a-fA-F0-9]{40}$/)) {
          feeParams.chains = ['ETH'] // ETH network fees
        } else if (recipientWalletAddress.match(/^0x[a-fA-F0-9]{64}$/)) {
          feeParams.chains = ['SUI'] // SUI network fees
        } else if (recipientWalletAddress.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
          feeParams.chains = ['SOL'] // SOL network fees
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
  }, [debouncedTransactionAmount, currentTransactionType, selectedCryptocurrencyAsset, chosenPaymentMethod, recipientWalletAddress, urlSearchParams, currentWalletBalance])
  
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
  }, [currentWalletBalance, transactionAmountInput, currentTransactionType, recipientWalletAddress, selectedCryptocurrencyAsset, chosenPaymentMethod])
  
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
  }, [currentTransactionType, transactionAmountInput, recipientWalletAddress, selectedCryptocurrencyAsset, chosenPaymentMethod])

  // Show transaction details page if viewing a specific transaction
  if (isViewingTransaction) {
    return <TransactionDetailsPage transactionId={transactionId} />
  }

  // Show confirmation screen if transaction is ready to confirm
  if (transactionFlowState === 'confirming') {
    return (
      <TransactionProgressScreen
        transactionData={{
          type: currentTransactionType,
          amount: transactionAmountInput,
          recipient: recipientWalletAddress,
          asset: selectedCryptocurrencyAsset,
          paymentMethod: chosenPaymentMethod
        }}
        flowState={transactionFlowState}
        fees={calculatedTransactionFees}
        onConfirm={handleTransactionConfirm}
        onCancel={() => resetTransactionFlow()}
      />
    )
  }

  // Show transaction progress screen if in progress
  if (transactionFlowState === 'processing' || transactionFlowState === 'completed' || transactionFlowState === 'pending' || transactionFlowState === 'pending_blockchain' || transactionFlowState === 'error' || transactionFlowState === 'failed') {
    
    // Always use enhanced progress screen for all transactions
    // This eliminates the double progress page issue by skipping the basic TransactionProgressScreen
    return (
      <EnhancedTransactionProgressScreen
        transactionData={{
          type: currentTransactionType,
          amount: transactionAmountInput,
          recipient: recipientWalletAddress,
          asset: selectedCryptocurrencyAsset,
          paymentMethod: chosenPaymentMethod
        }}
        transactionId={transactionFlowData?.transactionId}
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
            isCalculatingFees={isCalculatingFees}
            feeError={feeError}
            isTimeout={isFeeTimeout}
          />
        </div>
      </div>
    </>
  )
}