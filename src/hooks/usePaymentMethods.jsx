/**
 * Payment Methods Hook
 * Handles real-time payment method retrieval via MockupPaymentMethodsProviderService
 */

import { useState, useEffect, useCallback } from 'react'
import { mockupPaymentMethodsProviderService } from '../services/payments/MockupPaymentMethodsProviderService'
import logger from '../utils/logger'
import { CreditCard, Wallet } from 'lucide-react'

export const usePaymentMethods = (transactionType = 'add') => {
  const [paymentMethods, setPaymentMethods] = useState([])
  const [configurations, setConfigurations] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isTimeout, setIsTimeout] = useState(false)

  // Load payment methods with 5-second timeout
  const loadPaymentMethods = useCallback(async (forceRefresh = false) => {
    setIsLoading(true)
    setError(null)
    setIsTimeout(false)

    // Set up 5-second timeout
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        setIsTimeout(true)
        reject(new Error('Payment methods loading timeout - please try again'))
      }, 5000)
    })

    try {
      // Race between payment methods loading and timeout
      const paymentData = await Promise.race([
        mockupPaymentMethodsProviderService.getAllPaymentData(transactionType),
        timeoutPromise
      ])

      // Format payment methods for UI components with icons
      const formattedMethods = paymentData.availableMethods.map(method => ({
        ...method,
        methodId: method.id,
        displayLabel: method.name,
        paymentIcon: getPaymentMethodIcon(method.id)
      }))

      setPaymentMethods(formattedMethods)
      setConfigurations(paymentData.configurations)
      
      logger.debug('usePaymentMethods: Loaded real-time payment methods:', formattedMethods)
      return formattedMethods
    } catch (err) {
      logger.error('usePaymentMethods: Failed to load payment methods:', err)
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [transactionType])

  // Get payment method icon based on method ID
  const getPaymentMethodIcon = (methodId) => {
    switch (methodId) {
      case 'credit_debit_card':
        return <CreditCard className="w-4 h-4" />
      case 'diboas_wallet':
        return <Wallet className="w-4 h-4" />
      case 'bank_account':
        return '🏦'
      case 'apple_pay':
        return '🍎'
      case 'google_pay':
        return '🅶'
      case 'paypal':
        return '💰'
      case 'external_wallet':
        return '👛'
      case 'crypto_wallet':
        return '💼'
      default:
        return '💳'
    }
  }

  // Get available payment methods for specific transaction type
  const getPaymentMethodsForTransaction = useCallback(async (txType) => {
    if (txType !== transactionType) {
      // Load methods for different transaction type
      const paymentData = await mockupPaymentMethodsProviderService.getAllPaymentData(txType)
      return paymentData.availableMethods.map(method => ({
        ...method,
        methodId: method.id,
        displayLabel: method.name,
        paymentIcon: getPaymentMethodIcon(method.id)
      }))
    }
    return paymentMethods
  }, [transactionType, paymentMethods])

  // Get formatted payment methods arrays for different transaction types
  const getFormattedPaymentMethods = useCallback(() => {
    return {
      // Standard payment methods (add, withdraw)
      availablePaymentMethodOptions: paymentMethods.map(method => ({
        methodId: method.id,
        displayLabel: method.name,
        paymentIcon: getPaymentMethodIcon(method.id)
      })),
      
      // Buy transaction payment methods (includes diBoaS wallet)
      buyTransactionPaymentMethods: [
        {
          methodId: 'diboas_wallet',
          displayLabel: 'diBoaS Wallet',
          paymentIcon: <Wallet className="w-4 h-4" />
        },
        ...paymentMethods.filter(method => method.id !== 'diboas_wallet').map(method => ({
          methodId: method.id,
          displayLabel: method.name,
          paymentIcon: getPaymentMethodIcon(method.id)
        }))
      ]
    }
  }, [paymentMethods])

  // Validate payment method for specific transaction
  const validatePaymentMethod = useCallback(async (paymentMethodId, amount) => {
    try {
      const validation = await mockupPaymentMethodsProviderService.validatePaymentMethod(
        paymentMethodId, 
        amount, 
        transactionType
      )
      return validation
    } catch (err) {
      logger.error('usePaymentMethods: Payment method validation failed:', err)
      return { valid: false, error: err.message }
    }
  }, [transactionType])

  // Initialize on mount and when transaction type changes
  useEffect(() => {
    loadPaymentMethods()
  }, [loadPaymentMethods])

  return {
    paymentMethods,
    configurations,
    isLoading,
    error,
    isTimeout,
    loadPaymentMethods,
    getPaymentMethodsForTransaction,
    getFormattedPaymentMethods,
    validatePaymentMethod
  }
}