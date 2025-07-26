import { useState, useCallback } from 'react'
import { validateAmount, validateWalletAddress, validateUsername, VALIDATION_ERRORS } from '../utils/validation.js'

/**
 * Transaction error types
 */
const TRANSACTION_ERRORS = {
  INSUFFICIENT_FUNDS: 'insufficient_funds',
  INVALID_RECIPIENT: 'invalid_recipient',
  NETWORK_ERROR: 'network_error',
  RATE_LIMIT: 'rate_limit',
  TRANSACTION_FAILED: 'transaction_failed',
  TIMEOUT: 'timeout',
  UNKNOWN: 'unknown'
}

/**
 * Transaction error messages
 */
const TRANSACTION_ERROR_MESSAGES = {
  [TRANSACTION_ERRORS.INSUFFICIENT_FUNDS]: {
    title: 'Insufficient Funds',
    message: 'You don\'t have enough balance to complete this transaction.',
    action: 'Add Funds'
  },
  [TRANSACTION_ERRORS.INVALID_RECIPIENT]: {
    title: 'Invalid Recipient',
    message: 'The recipient address or username is invalid.',
    action: 'Check Address'
  },
  [TRANSACTION_ERRORS.NETWORK_ERROR]: {
    title: 'Network Error',
    message: 'Unable to process transaction due to network issues.',
    action: 'Retry'
  },
  [TRANSACTION_ERRORS.RATE_LIMIT]: {
    title: 'Too Many Requests',
    message: 'You\'re sending transactions too quickly. Please wait a moment.',
    action: 'Wait and Retry'
  },
  [TRANSACTION_ERRORS.TRANSACTION_FAILED]: {
    title: 'Transaction Failed',
    message: 'The transaction was rejected. Please check your details and try again.',
    action: 'Try Again'
  },
  [TRANSACTION_ERRORS.TIMEOUT]: {
    title: 'Transaction Timeout',
    message: 'The transaction is taking too long. It may still be processing.',
    action: 'Check Status'
  },
  [TRANSACTION_ERRORS.UNKNOWN]: {
    title: 'Unexpected Error',
    message: 'An unexpected error occurred. Please try again.',
    action: 'Retry'
  }
}

/**
 * Hook for comprehensive transaction validation and error handling
 */
export function useTransactionValidation() {
  const [validationErrors, setValidationErrors] = useState({})
  const [transactionError, setTransactionError] = useState(null)
  const [isValidating, setIsValidating] = useState(false)

  /**
   * Validates transaction amount with balance checking
   */
  const validateTransactionAmount = useCallback((amount, availableBalance, transactionType) => {
    const validation = validateAmount(amount, {
      min: transactionType === 'add' ? 1 : 0.01,
      max: transactionType === 'add' ? 50000 : availableBalance
    })

    if (!validation.isValid) {
      return validation
    }

    // Additional balance checking for spending transactions
    if (['send', 'withdraw', 'buy', 'invest'].includes(transactionType)) {
      if (validation.numeric > availableBalance) {
        return {
          isValid: false,
          error: TRANSACTION_ERRORS.INSUFFICIENT_FUNDS,
          message: `Insufficient funds. Available: $${availableBalance.toFixed(2)}`
        }
      }

      // Warn about spending most of balance
      if (validation.numeric > availableBalance * 0.95) {
        return {
          isValid: true,
          warning: true,
          message: 'This will use most of your available balance.',
          sanitized: validation.sanitized,
          numeric: validation.numeric
        }
      }
    }

    return validation
  }, [])

  /**
   * Validates recipient based on transaction type
   */
  const validateRecipient = useCallback((recipient, transactionType) => {
    if (!recipient || !recipient.trim()) {
      return {
        isValid: false,
        error: VALIDATION_ERRORS.REQUIRED,
        message: 'Recipient is required'
      }
    }

    // Username validation for internal transfers
    if (recipient.startsWith('@') || transactionType === 'send') {
      return validateUsername(recipient)
    }

    // Wallet address validation for external transfers
    if (transactionType === 'transfer' || transactionType === 'withdraw') {
      // Detect address type based on format
      let addressType = 'ethereum'
      if (recipient.startsWith('1') || recipient.startsWith('3') || recipient.startsWith('bc1')) {
        addressType = 'bitcoin'
      }
      
      return validateWalletAddress(recipient, addressType)
    }

    return { isValid: true, sanitized: recipient.trim() }
  }, [])

  /**
   * Comprehensive transaction form validation
   */
  const validateTransactionForm = useCallback((formData) => {
    setIsValidating(true)
    const errors = {}
    let isValid = true

    const { amount, recipient, transactionType, availableBalance = 0 } = formData

    // Validate amount
    const amountValidation = validateTransactionAmount(amount, availableBalance, transactionType)
    if (!amountValidation.isValid) {
      errors.amount = amountValidation
      isValid = false
    }

    // Validate recipient for transactions that require it
    if (['send', 'receive', 'transfer', 'withdraw'].includes(transactionType)) {
      const recipientValidation = validateRecipient(recipient, transactionType)
      if (!recipientValidation.isValid) {
        errors.recipient = recipientValidation
        isValid = false
      }
    }

    // Additional business logic validations
    if (transactionType === 'send' && amount && recipient) {
      const numericAmount = parseFloat(amount)
      
      // Prevent self-transactions
      if (recipient === '@currentuser') { // This would be the actual current user
        errors.recipient = {
          isValid: false,
          error: VALIDATION_ERRORS.INVALID_FORMAT,
          message: 'You cannot send money to yourself'
        }
        isValid = false
      }

      // Warn about large transactions
      if (numericAmount > 1000) {
        errors.amount = {
          ...amountValidation,
          warning: true,
          message: 'Large transaction amount. Please confirm this is correct.'
        }
      }
    }

    setValidationErrors(errors)
    setIsValidating(false)

    return {
      isValid,
      errors,
      hasWarnings: Object.values(errors).some(error => error.warning)
    }
  }, [validateTransactionAmount, validateRecipient])

  /**
   * Simulates transaction processing with comprehensive error handling
   */
  const processTransaction = useCallback(async (transactionData) => {
    setTransactionError(null)
    
    try {
      // Validate form before processing
      const validation = validateTransactionForm(transactionData)
      if (!validation.isValid) {
        throw new Error('Validation failed')
      }

      // Simulate API call with potential failures
      await simulateTransactionAPI(transactionData)
      
      return { success: true }
      
    } catch (error) {
      const transactionError = handleTransactionError(error)
      setTransactionError(transactionError)
      throw transactionError
    }
  }, [validateTransactionForm])

  /**
   * Clears validation errors
   */
  const clearValidationErrors = useCallback(() => {
    setValidationErrors({})
  }, [])

  /**
   * Clears transaction errors
   */
  const clearTransactionError = useCallback(() => {
    setTransactionError(null)
  }, [])

  return {
    validationErrors,
    transactionError,
    isValidating,
    validateTransactionForm,
    validateTransactionAmount,
    validateRecipient,
    processTransaction,
    clearValidationErrors,
    clearTransactionError
  }
}

/**
 * Simulates transaction API with various failure scenarios
 */
async function simulateTransactionAPI(transactionData) {
  const { amount, transactionType: _TRANSACTION_TYPE } = transactionData
  const delay = Math.random() * 2000 + 1000 // 1-3 seconds

  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate various failure scenarios
      const random = Math.random()
      
      if (random < 0.05) { // 5% network failure
        reject(new Error('NETWORK_ERROR'))
      } else if (random < 0.08) { // 3% rate limit
        reject(new Error('RATE_LIMIT'))
      } else if (random < 0.10) { // 2% transaction failure
        reject(new Error('TRANSACTION_FAILED'))
      } else if (amount > 10000) { // Large amounts fail more often
        if (random < 0.20) {
          reject(new Error('TRANSACTION_FAILED'))
        }
      }
      
      resolve({ transactionId: `tx_${Date.now()}` })
    }, delay)
  })
}

/**
 * Handles transaction errors and returns user-friendly error objects
 */
function handleTransactionError(error) {
  let errorType = TRANSACTION_ERRORS.UNKNOWN
  
  if (error.message.includes('NETWORK_ERROR')) {
    errorType = TRANSACTION_ERRORS.NETWORK_ERROR
  } else if (error.message.includes('RATE_LIMIT')) {
    errorType = TRANSACTION_ERRORS.RATE_LIMIT
  } else if (error.message.includes('TRANSACTION_FAILED')) {
    errorType = TRANSACTION_ERRORS.TRANSACTION_FAILED
  } else if (error.message.includes('INSUFFICIENT_FUNDS')) {
    errorType = TRANSACTION_ERRORS.INSUFFICIENT_FUNDS
  } else if (error.message.includes('INVALID_RECIPIENT')) {
    errorType = TRANSACTION_ERRORS.INVALID_RECIPIENT
  }

  const errorInfo = TRANSACTION_ERROR_MESSAGES[errorType]
  
  return {
    type: errorType,
    title: errorInfo.title,
    message: errorInfo.message,
    action: errorInfo.action,
    canRetry: ![TRANSACTION_ERRORS.INSUFFICIENT_FUNDS, TRANSACTION_ERRORS.INVALID_RECIPIENT].includes(errorType)
  }
}

export { TRANSACTION_ERRORS, TRANSACTION_ERROR_MESSAGES }