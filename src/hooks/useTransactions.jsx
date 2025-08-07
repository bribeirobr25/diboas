/**
 * Transaction Hook
 * React hook for accessing comprehensive transaction system
 * Uses centralized DataManager for single source of truth
 */

import { useState, useEffect, useCallback } from 'react'
import { defaultFeeCalculator } from '../utils/feeCalculations.js'
import { useAuth } from './useIntegrations.jsx'
import { dataManager } from '../services/DataManager.js'
import { onChainTransactionManager } from '../services/transactions/OnChainTransactionManager.js'
import logger from '../utils/logger'
// import { getWalletManager } from './transactions/transactionSingletons.js'

// Main transaction hook moved to ./transactions/useTransactions.js

/**
 * Wallet balance management hook - now uses centralized DataManager
 */
export const useWalletBalance = () => {
  const { user } = useAuth()
  const [balance, setBalance] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Subscribe to balance updates from DataManager
  useEffect(() => {
    // Set initial balance from DataManager state
    const currentBalance = dataManager.getBalance()
    if (currentBalance) {
      setBalance(currentBalance)
    }

    // Subscribe to balance updates
    const unsubscribeBalance = dataManager.subscribe('balance:updated', (newBalance) => {
      setBalance(newBalance)
    })

    const unsubscribeLoading = dataManager.subscribe('balance:loading', (loading) => {
      setIsLoading(loading)
    })

    const unsubscribeError = dataManager.subscribe('balance:error', (error) => {
      setError(error)
    })

    return () => {
      unsubscribeBalance()
      unsubscribeLoading()
      unsubscribeError()
    }
  }, [])

  // Get unified balance
  const getBalance = useCallback(async (forceRefresh = false) => {
    if (!user) {
      // Return current balance from DataManager for demo
      const currentBalance = dataManager.getBalance()
      setBalance(currentBalance)
      return currentBalance
    }

    try {
      // Force refresh from DataManager if needed
      if (forceRefresh) {
        // In a real implementation, this would trigger a blockchain refresh
        // For demo, we just return the current state
        const currentBalance = dataManager.getBalance()
        setBalance(currentBalance)
        return currentBalance
      }
      
      const currentBalance = dataManager.getBalance()
      setBalance(currentBalance)
      return currentBalance
    } catch (err) {
      setError(err)
      throw err
    }
  }, [user])

  // Check balance sufficiency - Updated to match proper financial flow
  const checkSufficientBalance = useCallback(async (amount, transactionType, targetChain, paymentMethod) => {
    try {
      const currentBalance = dataManager.getBalance()
      
      const checks = {
        sufficient: false,
        availableBalance: 0,
        requiredAmount: amount,
        deficit: 0
      }

      // For add transactions (on-ramp), no balance check needed - external payment
      if (transactionType === 'add') {
        checks.sufficient = true
        checks.availableBalance = 999999 // External fiat source
        return checks
      }

      // For transactions that use Available Balance only
      if (['send', 'withdraw'].includes(transactionType)) {
        const available = currentBalance?.availableForSpending || 0
        checks.sufficient = available >= amount
        checks.availableBalance = available
        
        if (!checks.sufficient) {
          checks.deficit = amount - available
        }
        return checks
      }

      // For buy transactions
      if (transactionType === 'buy') {
        if (paymentMethod === 'diboas_wallet') {
          // Buy On-Chain: Check Available Balance
          const available = currentBalance?.availableForSpending || 0
          checks.sufficient = available >= amount
          checks.availableBalance = available
          
          if (!checks.sufficient) {
            checks.deficit = amount - available
          }
        } else {
          // Buy On-Ramp: External payment, no balance check needed
          checks.sufficient = true
          checks.availableBalance = 999999 // External payment source
        }
        return checks
      }

      // For sell transactions: check invested amount
      if (transactionType === 'sell') {
        const invested = currentBalance?.investedAmount || 0
        checks.sufficient = invested >= amount
        checks.availableBalance = invested
        
        if (!checks.sufficient) {
          checks.deficit = amount - invested
        }
        return checks
      }

      // For strategy transactions: check available balance (similar to buy with diBoaS wallet)
      if (transactionType === 'start_strategy') {
        if (paymentMethod === 'diboas_wallet') {
          // Strategy funding: Check Available Balance
          const available = currentBalance?.availableForSpending || 0
          checks.sufficient = available >= amount
          checks.availableBalance = available
          
          if (!checks.sufficient) {
            checks.deficit = amount - available
          }
        } else {
          // Strategy with external payment: External payment, no balance check needed
          checks.sufficient = true
          checks.availableBalance = 999999 // External payment source
        }
        return checks
      }

      return checks
    } catch (err) {
      setError(err)
      throw err
    }
  }, [])

  // Initialize balance on mount
  useEffect(() => {
    getBalance()
  }, [])

  return {
    balance,
    isLoading,
    error,
    getBalance,
    checkSufficientBalance,
    isInitialized: true // DataManager is always initialized
  }
}

/**
 * Transaction processing hook - now uses centralized DataManager
 */
export const useTransactionProcessor = () => {
  const { user } = useAuth()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [currentTransaction, setCurrentTransaction] = useState(null)

  // Subscribe to transaction events from DataManager
  useEffect(() => {
    const unsubscribeError = dataManager.subscribe('transaction:error', (error) => {
      setError(error)
      setIsProcessing(false)
    })

    const unsubscribeCompleted = dataManager.subscribe('transaction:completed', ({ transaction }) => {
      setCurrentTransaction(transaction)
      setIsProcessing(false)
    })

    return () => {
      unsubscribeError()
      unsubscribeCompleted()
    }
  }, [])

  // Process transaction using DataManager
  const processTransaction = useCallback(async (transactionData, options = {}) => {
    setIsProcessing(true)
    setError(null)
    setCurrentTransaction(null)

    try {
      // Calculate net amount (amount - fees) for the transaction
      const fees = transactionData.fees || { total: 0 }
      const netAmount = parseFloat(transactionData.amount) - parseFloat(fees.total || 0)
      
      const enrichedTransactionData = {
        ...transactionData,
        netAmount: netAmount,
        userId: user?.id || 'demo_user_12345',
        timestamp: new Date().toISOString(),
        ...options
      }

      // Process through DataManager
      const result = await dataManager.processTransaction(enrichedTransactionData)
      setCurrentTransaction(result.transaction)
      return result
    } catch (err) {
      setError(err)
      setIsProcessing(false)
      throw err
    }
  }, [user])

  // Get transaction history from DataManager
  const getTransactionHistory = useCallback((options = {}) => {
    const transactions = dataManager.getTransactions()
    
    // Apply filtering if options provided
    if (options.limit) {
      return transactions.slice(0, options.limit)
    }
    
    return transactions
  }, [])

  // Get specific transaction
  const getTransaction = useCallback((transactionId) => {
    const transactions = dataManager.getTransactions()
    return transactions.find(tx => tx.id === transactionId) || null
  }, [])

  return {
    processTransaction,
    getTransactionHistory,
    getTransaction,
    isProcessing,
    error,
    currentTransaction,
    isInitialized: true
  }
}

/**
 * Fee calculation hook
 */
export const useFeeCalculator = () => {
  const [fees, setFees] = useState({
    diBoaSFee: '0.00',
    networkFee: '0.00',
    providerFee: '0.00',
    total: '0.00'
  })
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState(null)

  // Calculate fees for transaction
  const calculateFees = useCallback(async (transactionData, routingPlan = null) => {
    setIsCalculating(true)
    setError(null)

    try {
      const feeData = await defaultFeeCalculator.calculateTransactionFees(transactionData, routingPlan)
      setFees(feeData)
      return feeData
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsCalculating(false)
    }
  }, [])

  // Get real-time fees
  const getRealTimeFees = useCallback(async (transactionData) => {
    setIsCalculating(true)
    setError(null)

    try {
      const feeData = await defaultFeeCalculator.getRealTimeFees(transactionData)
      setFees(feeData)
      return feeData
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsCalculating(false)
    }
  }, [])

  // Get quick estimate
  const getQuickEstimate = useCallback(async (type, amount) => {
    setIsCalculating(true)
    setError(null)

    try {
      const estimate = await defaultFeeCalculator.getQuickEstimate(type, amount)
      return estimate
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsCalculating(false)
    }
  }, [])

  // Compare fee options
  const compareFeeOptions = useCallback(async (transactionData, routingOptions) => {
    setIsCalculating(true)
    setError(null)

    try {
      const comparison = await defaultFeeCalculator.compareFeeOptions(transactionData, routingOptions)
      return comparison
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsCalculating(false)
    }
  }, [])

  return {
    fees,
    isCalculating,
    error,
    calculateFees,
    getRealTimeFees,
    getQuickEstimate,
    compareFeeOptions
  }
}

/**
 * Transaction validation hook
 */
export const useTransactionValidation = () => {
  const [validationErrors, setValidationErrors] = useState({})
  const [isValidating, setIsValidating] = useState(false)

  // Validate transaction form
  const validateTransaction = useCallback(async (transactionData) => {
    setIsValidating(true)
    setValidationErrors({})

    try {
      const errors = {}
      const { type, amount, recipient, asset } = transactionData

      // Amount validation
      const numericAmount = parseFloat(amount)
      if (!amount || isNaN(numericAmount) || numericAmount <= 0) {
        errors.amount = { message: 'Valid amount is required', isValid: false }
      }

      // Minimum amount validation per TRANSACTIONS.md
      const minimumAmounts = {
        'add': 10,           // $10 per TRANSACTIONS.md section 3.1.1
        'withdraw': 5,       // $5 per TRANSACTIONS.md section 3.1.2
        'send': 5,           // $5 per TRANSACTIONS.md section 3.1.3
        'buy': 10,           // $10 per TRANSACTIONS.md section 3.2.1
        'sell': 5,           // $5 per TRANSACTIONS.md section 3.2.2
        'invest': 10,        // Legacy - same as buy
        'start_strategy': 10, // $10 per TRANSACTIONS.md section 3.3.2
        'stop_strategy': 0   // No minimum - must stop entire strategy
      }

      if (numericAmount < minimumAmounts[type]) {
        errors.amount = { 
          message: `Minimum amount for ${type} is $${minimumAmounts[type]}`, 
          isValid: false 
        }
      }

      // Balance validation based on transaction type and proper financial flow
      const currentBalance = dataManager.getBalance()
      
      if (['withdraw', 'send'].includes(type)) {
        // These transactions only use Available Balance (USDC)
        const availableBalance = currentBalance?.availableForSpending || 0
        
        if (numericAmount > availableBalance) {
          const actionName = type === 'withdraw' ? 'withdraw' : 'send'
          errors.amount = { 
            message: `Cannot ${actionName} more than available balance. Maximum: $${availableBalance.toFixed(2)}`, 
            isValid: false 
          }
        }
      } else if (type === 'buy' && transactionData.paymentMethod === 'diboas_wallet') {
        // Buy On-Chain: uses Available Balance
        const availableBalance = currentBalance?.availableForSpending || 0
        
        if (numericAmount > availableBalance) {
          errors.amount = { 
            message: `Cannot buy more than available balance. Maximum: $${availableBalance.toFixed(2)}`, 
            isValid: false 
          }
        }
      } else if (type === 'sell') {
        // Sell: uses Invested Balance
        const investedBalance = currentBalance?.investedAmount || 0
        
        if (numericAmount > investedBalance) {
          errors.amount = { 
            message: `Cannot sell more than invested balance. Maximum: $${investedBalance.toFixed(2)}`, 
            isValid: false 
          }
        }
      } else if (type === 'start_strategy') {
        // Start Strategy: uses Available Balance (only diBoaS wallet allowed per TRANSACTIONS.md)
        const availableBalance = currentBalance?.availableForSpending || 0
        
        if (numericAmount > availableBalance) {
          errors.amount = { 
            message: `Cannot start strategy with more than available balance. Maximum: $${availableBalance.toFixed(2)}`, 
            isValid: false 
          }
        }
      } else if (type === 'stop_strategy') {
        // Stop Strategy: uses Strategy Balance for specific strategy
        const strategyId = transactionData.strategyId
        if (strategyId) {
          const strategyBalance = currentBalance?.strategies?.[strategyId]?.currentAmount || 0
          
          if (numericAmount > strategyBalance) {
            errors.amount = { 
              message: `Cannot stop strategy with more than strategy balance. Maximum: $${strategyBalance.toFixed(2)}`, 
              isValid: false 
            }
          }
        } else {
          // Generic strategy balance check if no specific strategyId
          const totalStrategyBalance = currentBalance?.strategyBalance || 0
          if (numericAmount > totalStrategyBalance) {
            errors.amount = { 
              message: `Cannot stop strategy with more than total strategy balance. Maximum: $${totalStrategyBalance.toFixed(2)}`, 
              isValid: false 
            }
          }
        }
      }

      // Recipient validation
      if (type === 'send') {
        if (!recipient) {
          errors.recipient = { message: 'Recipient is required', isValid: false }
        } else {
          // diBoaS username validation
          if (!recipient.startsWith('@') || recipient.length < 4) {
            errors.recipient = { message: 'Invalid diBoaS username format', isValid: false }
          }
        }
      }

      // Asset validation
      if (['buy', 'sell', 'invest'].includes(type) && !asset) {
        errors.asset = { message: 'Asset selection is required', isValid: false }
      }

      setValidationErrors(errors)
      const result = { isValid: Object.keys(errors).length === 0, errors }
      return result
    } catch (err) {
      const error = { message: err.message, isValid: false }
      setValidationErrors({ general: error })
      return { isValid: false, errors: { general: error } }
    } finally {
      setIsValidating(false)
    }
  }, [])

  // Clear validation errors
  const clearValidationErrors = useCallback(() => {
    setValidationErrors({})
  }, [])

  return {
    validationErrors,
    isValidating,
    validateTransaction,
    clearValidationErrors
  }
}

/**
 * Transaction flow management hook
 */
export const useTransactionFlow = () => {
  const { processTransaction } = useTransactionProcessor()
  const { calculateFees } = useFeeCalculator()
  const { validateTransaction } = useTransactionValidation()
  const { checkSufficientBalance } = useWalletBalance()
  const [flowState, setFlowState] = useState('idle') // idle, validating, calculating, confirming, processing, pending, completed, error
  const [flowData, setFlowData] = useState(null)
  const [flowError, setFlowError] = useState(null)

  // Execute complete transaction flow
  const executeTransactionFlow = useCallback(async (transactionData) => {
    setFlowError(null)
    
    // Create a transaction record for logging even if it fails
    const transactionRecord = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type: transactionData.type,
      amount: transactionData.amount,
      currency: transactionData.currency || 'USD',
      asset: transactionData.asset,
      recipient: transactionData.recipient,
      paymentMethod: transactionData.paymentMethod,
      timestamp: new Date().toISOString(),
      status: 'pending'
    }
    
    try {
      // Step 1: Validation
      setFlowState('validating')
      const validation = await validateTransaction(transactionData)
      if (!validation.isValid) {
        const errorMessage = `Transaction validation failed: ${JSON.stringify(validation.errors)}`
        
        // Log failed transaction to DataManager
        dataManager.addTransaction({
          ...transactionRecord,
          status: 'failed',
          error: errorMessage,
          failedAtStep: 'validation',
          description: `Failed ${transactionData.type} transaction - Validation error`
        })
        
        throw new Error(errorMessage)
      }

      // Step 2: Balance check
      const balanceCheck = await checkSufficientBalance(
        parseFloat(transactionData.amount),
        transactionData.type,
        transactionData.targetChain,
        transactionData.paymentMethod
      )
      if (!balanceCheck?.sufficient) {
        const errorMessage = `Insufficient balance for transaction: required ${parseFloat(transactionData.amount)}, available ${balanceCheck?.availableBalance}`
        
        // Log failed transaction to DataManager
        dataManager.addTransaction({
          ...transactionRecord,
          status: 'failed',
          error: errorMessage,
          failedAtStep: 'balance_check',
          description: `Failed ${transactionData.type} transaction - Insufficient balance`
        })
        
        throw new Error(errorMessage)
      }

      // Step 3: Fee calculation
      setFlowState('calculating')
      const fees = await calculateFees(transactionData)

      // Calculate net amount once (single source of truth)
      let netAmount = parseFloat(transactionData.amount)
      if (transactionData.type === 'add' && fees?.total) {
        // For add transactions, user receives amount - fees
        netAmount = parseFloat(transactionData.amount) - parseFloat(fees.total)
      }
      // For withdraw/send: full amount deducted from balance
      // For buy/sell: handled separately with invested balance

      // Step 4: Update flow data for confirmation
      const confirmationData = {
        transaction: {
          ...transactionData,
          netAmount // Include pre-calculated net amount
        },
        fees,
        balanceCheck,
        validation,
        transactionId: transactionRecord.id // Include transaction ID for tracking
      }
      setFlowData(confirmationData)
      setFlowState('confirming')
      return { success: true, flowData: confirmationData }
    } catch (error) {
      setFlowError(error)
      setFlowState('error')
      
      // If error hasn't been logged yet (e.g., fee calculation error), log it now
      if (!error.message?.includes('validation failed') && !error.message?.includes('Insufficient balance')) {
        dataManager.addTransaction({
          ...transactionRecord,
          status: 'failed',
          error: error.message || 'Unknown error',
          failedAtStep: flowState === 'calculating' ? 'fee_calculation' : 'unknown',
          description: `Failed ${transactionData.type} transaction - ${error.message || 'Unknown error'}`
        })
      }
      
      throw error
    }
  }, [validateTransaction, checkSufficientBalance, calculateFees])

  // Confirm and process transaction with on-chain confirmation
  const confirmTransaction = useCallback(async () => {
    if (!flowData || flowState !== 'confirming') {
      throw new Error('No transaction to confirm')
    }

    logger.debug('🚀 Starting transaction confirmation:', {
      flowState,
      transactionType: flowData.transaction?.type,
      amount: flowData.transaction?.amount
    })

    try {
      setFlowState('processing')
      
      // Initialize on-chain transaction manager if needed
      await onChainTransactionManager.initialize()
      
      // Prepare transaction data with fees and user context
      const transactionWithFees = {
        ...flowData.transaction,
        fees: flowData.fees,
        userId: 'current_user' // TODO: Get actual user ID from auth context
      }
      
      logger.debug('📤 Executing transaction with on-chain manager:', {
        ...transactionWithFees,
        feesObject: flowData.fees,
        feesTotal: flowData.fees?.total
      })
      
      // Execute transaction with on-chain confirmation gating
      const result = await onChainTransactionManager.executeTransaction(transactionWithFees)
      
      logger.debug('📥 Transaction execution result:', result)
      
      if (result.success) {
        // Transaction successfully submitted to blockchain
        logger.debug('✅ Transaction submitted successfully, setting pending_blockchain state')
        setFlowData({ 
          ...flowData, 
          result: {
            ...result,
            onChainEnabled: true,
            message: 'Transaction submitted to blockchain. Waiting for confirmation...'
          },
          transactionId: result.transactionId
        })
        setFlowState('pending_blockchain')
        
        // Return result with transaction ID for on-chain monitoring
        return {
          ...result,
          transactionId: result.transactionId,
          onChainEnabled: true
        }
      } else {
        // Transaction submission failed
        logger.error('❌ Transaction submission failed:', result.error)
        
        // Log failed transaction to DataManager
        if (flowData?.transactionId) {
          dataManager.addTransaction({
            id: flowData.transactionId,
            type: flowData.transaction.type,
            amount: flowData.transaction.amount,
            currency: flowData.transaction.currency || 'USD',
            asset: flowData.transaction.asset,
            recipient: flowData.transaction.recipient,
            paymentMethod: flowData.transaction.paymentMethod,
            timestamp: new Date().toISOString(),
            status: 'failed',
            error: result.error || 'Transaction submission failed',
            failedAtStep: 'submission',
            description: `Failed ${flowData.transaction.type} transaction - Submission error`
          })
        }
        
        throw new Error(result.error || 'Transaction submission failed')
      }
      
    } catch (error) {
      logger.error('💥 Transaction confirmation error:', error)
      setFlowError(error)
      setFlowState('error')
      
      // Log failed transaction to DataManager if not already logged
      if (flowData?.transactionId && !error.message?.includes('submission failed')) {
        dataManager.addTransaction({
          id: flowData.transactionId,
          type: flowData.transaction.type,
          amount: flowData.transaction.amount,
          currency: flowData.transaction.currency || 'USD',
          asset: flowData.transaction.asset,
          recipient: flowData.transaction.recipient,
          paymentMethod: flowData.transaction.paymentMethod,
          timestamp: new Date().toISOString(),
          status: 'failed',
          error: error.message || 'Transaction processing error',
          failedAtStep: 'processing',
          description: `Failed ${flowData.transaction.type} transaction - ${error.message || 'Processing error'}`
        })
      }
      
      throw error
    }
  }, [flowData, flowState])

  // Reset flow
  const resetFlow = useCallback(() => {
    setFlowState('idle')
    setFlowData(null)
    setFlowError(null)
  }, [])

  return {
    flowState,
    flowData,
    flowError,
    executeTransactionFlow,
    confirmTransaction,
    resetFlow
  }
}

/**
 * 2FA integration for transactions
 */
export const useTransactionTwoFA = () => {
  const { user } = useAuth()
  const [twoFARequired, setTwoFARequired] = useState(false)
  const [twoFASession, setTwoFASession] = useState(null)
  const [isVerifying, setIsVerifying] = useState(false)

  // Check if 2FA is required for transaction
  const checkTwoFARequirement = useCallback(async (transactionData) => {
    // 2FA required for transactions after first deposit as per requirements
    const requires2FA = user?.settings?.twoFAEnabled && 
                       ['withdraw', 'send'].includes(transactionData.type) &&
                       parseFloat(transactionData.amount) > 100

    setTwoFARequired(requires2FA)
    return requires2FA
  }, [user])

  // Send 2FA code
  const sendTwoFACode = useCallback(async (method = 'sms') => {
    setIsVerifying(true)
    
    try {
      // Mock 2FA code sending
      const sessionId = `2fa_${Date.now()}`
      setTwoFASession({ sessionId, method, sentAt: new Date() })
      
      // In real implementation, integrate with 2FA provider
      return { success: true, sessionId }
    } finally {
      setIsVerifying(false)
    }
  }, [])

  // Verify 2FA code
  const verifyTwoFACode = useCallback(async (code) => {
    if (!twoFASession) throw new Error('No 2FA session active')

    setIsVerifying(true)

    try {
      // Mock verification - in real implementation, verify with provider
      const isValid = code === '123456' // Mock valid code
      
      if (isValid) {
        setTwoFARequired(false)
        return { success: true, verified: true }
      } else {
        throw new Error('Invalid 2FA code')
      }
    } finally {
      setIsVerifying(false)
    }
  }, [twoFASession])

  return {
    twoFARequired,
    twoFASession,
    isVerifying,
    checkTwoFARequirement,
    sendTwoFACode,
    verifyTwoFACode
  }
}

export default {
  useWalletBalance,
  useTransactionProcessor,
  useFeeCalculator,
  useTransactionValidation,
  useTransactionFlow,
  useTransactionTwoFA
}