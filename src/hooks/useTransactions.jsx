/**
 * Transaction Hook
 * React hook for accessing comprehensive transaction system
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import TransactionEngine from '../services/transactions/TransactionEngine.js'
import MultiWalletManager from '../services/transactions/MultiWalletManager.js'
import { defaultFeeCalculator } from '../utils/feeCalculations.js'
import { useAuth } from './useIntegrations.jsx'

let transactionEngineInstance = null
let walletManagerInstance = null

/**
 * Get singleton instances
 */
async function getTransactionEngine() {
  if (!transactionEngineInstance) {
    transactionEngineInstance = new TransactionEngine()
    await transactionEngineInstance.initialize()
  }
  return transactionEngineInstance
}

function getWalletManager() {
  if (!walletManagerInstance) {
    walletManagerInstance = new MultiWalletManager()
  }
  return walletManagerInstance
}

/**
 * Main transaction hook
 */
export const useTransactions = () => {
  const { user } = useAuth()
  const [transactionEngine, setTransactionEngine] = useState(null)
  const [walletManager, setWalletManager] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState(null)
  const initializationRef = useRef(null)

  // Initialize transaction system
  useEffect(() => {
    if (initializationRef.current) return

    initializationRef.current = Promise.all([
      getTransactionEngine(),
      Promise.resolve(getWalletManager())
    ])
      .then(([engine, wallet]) => {
        setTransactionEngine(engine)
        setWalletManager(wallet)
        setIsInitialized(true)
        setError(null)
      })
      .catch(err => {
        setError(err)
        setIsInitialized(false)
      })

    return () => {
      if (initializationRef.current) {
        initializationRef.current = null
      }
    }
  }, [])

  return {
    transactionEngine,
    walletManager,
    isInitialized,
    error,
    user
  }
}

/**
 * Wallet management hook
 */
export const useWallet = () => {
  const { walletManager, user, isInitialized } = useTransactions()
  const [balance, setBalance] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Initialize user wallets
  const initializeWallets = useCallback(async () => {
    if (!walletManager || !user) return null

    setIsLoading(true)
    setError(null)

    try {
      const result = await walletManager.initializeWallets(user.id)
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [walletManager, user])

  // Get unified balance
  const getBalance = useCallback(async (forceRefresh = false) => {
    if (!walletManager || !user) return null

    setIsLoading(true)
    setError(null)

    try {
      const balanceData = await walletManager.getUnifiedBalance(user.id, forceRefresh)
      setBalance(balanceData)
      return balanceData
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [walletManager, user])

  // Check balance sufficiency
  const checkSufficientBalance = useCallback(async (amount, transactionType, targetChain) => {
    console.log('🔍 Balance check called with:', { amount, transactionType, targetChain })
    console.log('🔍 Available dependencies:', { 
      walletManager: !!walletManager, 
      user: !!user,
      userId: user?.id 
    })
    
    if (!walletManager || !user) {
      console.log('🟡 Balance check skipped - missing walletManager or user, returning demo values')
      return { sufficient: true, availableBalance: 999999, requiredAmount: amount } // Allow transactions for demo
    }

    try {
      console.log('🔍 Checking balance for:', { userId: user.id, amount, transactionType, targetChain })
      const result = await walletManager.checkSufficientBalance(user.id, amount, transactionType, targetChain)
      console.log('💰 Balance check result:', result)
      return result
    } catch (err) {
      console.error('❌ Balance check failed:', err)
      console.error('❌ Balance check error details:', {
        message: err.message,
        stack: err.stack,
        walletManagerState: walletManager ? 'initialized' : 'null',
        userState: user ? 'exists' : 'null'
      })
      setError(err)
      throw err
    }
  }, [walletManager, user])

  // Auto-refresh balance on component mount
  useEffect(() => {
    if (isInitialized && user) {
      getBalance()
    }
  }, [isInitialized, user, getBalance])

  return {
    balance,
    isLoading,
    error,
    initializeWallets,
    getBalance,
    checkSufficientBalance,
    isInitialized
  }
}

/**
 * Transaction processing hook
 */
export const useTransactionProcessor = () => {
  const { transactionEngine, user, isInitialized } = useTransactions()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)
  const [currentTransaction, setCurrentTransaction] = useState(null)

  // Process transaction
  const processTransaction = useCallback(async (transactionData, options = {}) => {
    if (!transactionEngine || !user) throw new Error('Transaction system not ready')

    setIsProcessing(true)
    setError(null)
    setCurrentTransaction(null)

    try {
      const result = await transactionEngine.processTransaction(user.id, transactionData, {
        userAgent: navigator.userAgent,
        ...options
      })

      setCurrentTransaction(result.transaction)
      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [transactionEngine, user])

  // Get transaction history
  const getTransactionHistory = useCallback((options = {}) => {
    if (!transactionEngine || !user) return []

    return transactionEngine.getTransactionHistory(user.id, options)
  }, [transactionEngine, user])

  // Get specific transaction
  const getTransaction = useCallback((transactionId) => {
    if (!transactionEngine) return null

    return transactionEngine.getTransaction(transactionId)
  }, [transactionEngine])

  return {
    processTransaction,
    getTransactionHistory,
    getTransaction,
    isProcessing,
    error,
    currentTransaction,
    isInitialized
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

      // Minimum amount validation
      const minimumAmounts = {
        'add': 10, 'withdraw': 1, 'send': 0.01, 'receive': 0.01,
        'transfer': 1, 'buy': 1, 'sell': 0.01, 'invest': 10
      }

      if (numericAmount < minimumAmounts[type]) {
        errors.amount = { 
          message: `Minimum amount for ${type} is $${minimumAmounts[type]}`, 
          isValid: false 
        }
      }

      // Recipient validation
      if (['send', 'receive', 'transfer'].includes(type)) {
        if (!recipient) {
          errors.recipient = { message: 'Recipient is required', isValid: false }
        } else if (type === 'transfer') {
          // External wallet address validation
          const addressPatterns = {
            bitcoin: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$|^bc1[a-z0-9]{39,59}$/,
            ethereum: /^0x[a-fA-F0-9]{40}$/,
            solana: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
          }

          const isValidAddress = Object.values(addressPatterns).some(pattern => pattern.test(recipient))
          if (!isValidAddress) {
            errors.recipient = { message: 'Invalid wallet address format', isValid: false }
          }
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
      console.log('🔍 Transaction validation result:', result)
      return result
    } catch (err) {
      console.error('❌ Transaction validation error:', err)
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
  const { checkSufficientBalance } = useWallet()
  const [flowState, setFlowState] = useState('idle') // idle, validating, calculating, confirming, processing, completed, error
  const [flowData, setFlowData] = useState(null)
  const [flowError, setFlowError] = useState(null)

  // Execute complete transaction flow
  const executeTransactionFlow = useCallback(async (transactionData) => {
    setFlowError(null)
    
    try {
      console.log('🔄 Starting transaction flow for:', transactionData)
      
      // Step 1: Validation
      console.log('🔍 Step 1: Validating transaction...')
      setFlowState('validating')
      const validation = await validateTransaction(transactionData)
      console.log('✅ Validation result:', validation)
      if (!validation.isValid) {
        console.log('❌ Validation failed with errors:', validation.errors)
        throw new Error(`Transaction validation failed: ${JSON.stringify(validation.errors)}`)
      }

      // Step 2: Balance check
      console.log('💰 Step 2: Checking balance...')
      const balanceCheck = await checkSufficientBalance(
        parseFloat(transactionData.amount),
        transactionData.type,
        transactionData.targetChain
      )
      console.log('💰 Balance check result:', balanceCheck)
      if (!balanceCheck?.sufficient) {
        console.log('❌ Insufficient balance:', {
          required: parseFloat(transactionData.amount),
          available: balanceCheck?.availableBalance,
          type: transactionData.type
        })
        throw new Error(`Insufficient balance for transaction: required ${parseFloat(transactionData.amount)}, available ${balanceCheck?.availableBalance}`)
      }

      // Step 3: Fee calculation
      console.log('🧮 Step 3: Calculating fees...')
      setFlowState('calculating')
      const fees = await calculateFees(transactionData)
      console.log('🧮 Fee calculation result:', fees)

      // Step 4: Update flow data for confirmation
      console.log('📋 Step 4: Setting up confirmation data...')
      const confirmationData = {
        transaction: transactionData,
        fees,
        balanceCheck,
        validation
      }
      setFlowData(confirmationData)
      setFlowState('confirming')

      console.log('✅ Transaction flow completed successfully')
      return { success: true, flowData: confirmationData }
    } catch (error) {
      console.error('❌ Transaction flow failed at step:', error.message)
      setFlowError(error)
      setFlowState('error')
      throw error
    }
  }, [validateTransaction, checkSufficientBalance, calculateFees])

  // Confirm and process transaction
  const confirmTransaction = useCallback(async () => {
    if (!flowData || flowState !== 'confirming') {
      throw new Error('No transaction to confirm')
    }

    try {
      setFlowState('processing')
      const result = await processTransaction(flowData.transaction)
      
      setFlowData({ ...flowData, result })
      setFlowState('completed')
      
      return result
    } catch (error) {
      setFlowError(error)
      setFlowState('error')
      throw error
    }
  }, [flowData, flowState, processTransaction])

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
                       ['withdraw', 'transfer', 'send'].includes(transactionData.type) &&
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
    } catch (error) {
      throw error
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
    } catch (error) {
      throw error
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
  useTransactions,
  useWallet,
  useTransactionProcessor,
  useFeeCalculator,
  useTransactionValidation,
  useTransactionFlow,
  useTransactionTwoFA
}