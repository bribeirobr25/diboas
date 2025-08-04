/**
 * Wallet Balance Management Hook
 * Handles balance retrieval and sufficiency checks via centralized DataManager
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../useIntegrations.jsx'
import { dataManager } from '../../services/DataManager.js'

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
      const mappedBalance = {
        ...currentBalance,
        available: currentBalance.availableForSpending,
        strategy: currentBalance.strategyBalance || 0
      }
      setBalance(mappedBalance)
    }

    // Subscribe to balance updates
    const unsubscribeBalance = dataManager.subscribe('balance:updated', (newBalance) => {
      const mappedBalance = {
        ...newBalance,
        available: newBalance.availableForSpending,
        strategy: newBalance.strategyBalance || 0
      }
      setBalance(mappedBalance)
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
      // Map to consistent interface for strategy wizard
      const mappedBalance = {
        ...currentBalance,
        available: currentBalance.availableForSpending, // Map for wizard compatibility
        strategy: currentBalance.strategyBalance || 0
      }
      setBalance(mappedBalance)
      return mappedBalance
    }

    try {
      // Force refresh from DataManager if needed
      if (forceRefresh) {
        // In a real implementation, this would trigger a blockchain refresh
        // For demo, we just return the current state
        const currentBalance = dataManager.getBalance()
        const mappedBalance = {
          ...currentBalance,
          available: currentBalance.availableForSpending,
          strategy: currentBalance.strategyBalance || 0
        }
        setBalance(mappedBalance)
        return mappedBalance
      }
      
      const currentBalance = dataManager.getBalance()
      const mappedBalance = {
        ...currentBalance,
        available: currentBalance.availableForSpending,
        strategy: currentBalance.strategyBalance || 0
      }
      setBalance(mappedBalance)
      return mappedBalance
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
      if (['send', 'withdraw', 'transfer'].includes(transactionType)) {
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

      return checks
    } catch (err) {
      setError(err)
      throw err
    }
  }, [])

  // Initialize balance on mount
  useEffect(() => {
    getBalance()
  }, [getBalance])

  return {
    balance,
    isLoading,
    error,
    getBalance,
    checkSufficientBalance,
    isInitialized: true // DataManager is always initialized
  }
}