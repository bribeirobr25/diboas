/**
 * Transaction Validation Hook
 * Handles form validation for transaction data
 */

import { useState, useCallback } from 'react'
import { dataManager } from '../../services/DataManager.js'
import { defaultFeeCalculator } from '../../utils/feeCalculations.js'
import { checkUserExists } from '../../utils/userDatabase.js'

/**
 * Validates diBoaS username format and existence
 * @param {string} username - The username to validate
 * @returns {Object} - { isValid: boolean, message: string }
 */
const validateDiBoaSUsername = async (username) => {
  // Format validation
  if (!username) {
    return {
      isValid: false,
      message: 'Username is required'
    }
  }

  // Must start with @
  if (!username.startsWith('@')) {
    return {
      isValid: false,
      message: 'Username must start with @ (e.g., @john123)'
    }
  }

  // Remove @ for further validation
  const usernameWithoutAt = username.slice(1)

  // Length validation (3-20 characters after @)
  if (usernameWithoutAt.length < 3) {
    return {
      isValid: false,
      message: 'Username must be at least 3 characters after @ (e.g., @abc)'
    }
  }

  if (usernameWithoutAt.length > 20) {
    return {
      isValid: false,
      message: 'Username must be 20 characters or less after @'
    }
  }

  // Character validation - only alphanumeric and underscores
  const validUsernamePattern = /^[a-zA-Z0-9_]+$/
  if (!validUsernamePattern.test(usernameWithoutAt)) {
    return {
      isValid: false,
      message: 'Username can only contain letters, numbers, and underscores (e.g., @john_123)'
    }
  }

  // Must start with a letter
  if (!/^[a-zA-Z]/.test(usernameWithoutAt)) {
    return {
      isValid: false,
      message: 'Username must start with a letter after @ (e.g., @john123)'
    }
  }

  // Check if user exists in the system
  const userExists = await checkUserExists(usernameWithoutAt)
  if (!userExists) {
    return {
      isValid: false,
      message: `User ${username} does not exist. Format: @username (letters, numbers, underscores only)`
    }
  }

  return {
    isValid: true,
    message: 'Valid username'
  }
}

// checkUserExists is now imported from userDatabase.js

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

      // Minimum amount validation - Updated per TRANSACTIONS.md
      const minimumAmounts = {
        'add': 10, 'withdraw': 5, 'send': 5,
        'buy': 10, 'sell': 5, 'invest': 10
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
      }

      // Recipient validation
      if (type === 'send') {
        if (!recipient) {
          errors.recipient = { message: 'Recipient is required', isValid: false }
        } else {
          // diBoaS username validation for send transactions
          const usernameValidation = await validateDiBoaSUsername(recipient)
          if (!usernameValidation.isValid) {
            errors.recipient = { 
              message: usernameValidation.message, 
              isValid: false 
            }
          }
        }
      }

      // Asset validation
      if (['buy', 'sell', 'invest'].includes(type) && !asset) {
        errors.asset = { message: 'Asset selection is required', isValid: false }
      }
      
      // Prevent Buy USD transactions
      if (type === 'buy' && asset === 'USD') {
        errors.asset = { 
          message: 'Cannot buy USD. Please select a cryptocurrency or tokenized asset', 
          isValid: false 
        }
      }
      
      // Payment method validation for Add, Buy, and Withdraw transactions
      if (type === 'add' && !transactionData.paymentMethod) {
        errors.paymentMethod = { 
          message: 'Please select a payment method to add funds', 
          isValid: false 
        }
      }
      
      // Payment method validation for Buy transactions
      if (type === 'buy' && !transactionData.paymentMethod) {
        errors.paymentMethod = { 
          message: 'Please select a payment method to buy assets', 
          isValid: false 
        }
      }
      
      // Payment method validation for Withdraw transactions
      if (type === 'withdraw' && !transactionData.paymentMethod) {
        errors.paymentMethod = { 
          message: 'Please select where to withdraw funds', 
          isValid: false 
        }
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