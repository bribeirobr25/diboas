/**
 * Wallet Balance Management Hook
 * Handles balance retrieval and sufficiency checks via centralized DataManager
 */

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../useIntegrations.jsx'
import { dataManager } from '../../services/DataManager.js'
import { mockupBalanceProviderService } from '../../services/balance/MockupBalanceProviderService.js'
import logger from '../../utils/logger'

export const useWalletBalance = () => {
  const { user } = useAuth()
  const [balance, setBalance] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [isTimeout, setIsTimeout] = useState(false)

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

  // Get unified balance with real-time data from DataManager
  const getBalance = useCallback(async (forceRefresh = false) => {
    setIsLoading(true)
    setError(null)
    setIsTimeout(false)

    try {
      // Get balance from DataManager (clean state) instead of mock service
      const balanceData = dataManager.getBalance()

      // Map to consistent interface for existing components
      const mappedBalance = {
        ...balanceData,
        available: balanceData.availableForSpending, // Map for wizard compatibility
        strategy: balanceData.strategyBalance || 0,
        totalBalance: balanceData.totalBalance || 0
      }
      
      setBalance(mappedBalance)
      logger.debug('useWalletBalance: Loaded real-time balance data:', mappedBalance)
      return mappedBalance
    } catch (err) {
      logger.error('useWalletBalance: Failed to load balance:', err)
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [])

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
    isTimeout,
    getBalance,
    checkSufficientBalance,
    isInitialized: true // Balance service is always initialized
  }
}