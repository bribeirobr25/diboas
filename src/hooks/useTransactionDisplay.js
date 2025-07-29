/**
 * Shared hook for processing and displaying transaction data
 * Eliminates code duplication between AppDashboard and AccountView
 */

import { useMemo } from 'react'
import { TransactionType } from '../types/transactionTypes'
import {
  calculateDisplayAmountWithSign,
  formatRelativeTimeFromTimestamp,
  formatHumanReadableDate,
  determineTransactionDisplayType,
  generateHumanReadableTransactionDescription,
  shouldSplitTransactionInAdvancedMode,
  createSplitTransactionsForAdvancedMode
} from '../utils/transactionDisplayHelpers'
import { useUserSettings } from '../utils/userSettings.js'

/**
 * Hook to convert raw transaction data into display-ready format
 * @param {Array} transactions - Raw transaction data from DataManager
 * @param {Object} options - Display options
 * @returns {Array} Processed transaction display data
 */
export function useTransactionDisplay(transactions, options = {}) {
  const { settings } = useUserSettings()
  const {
    includeIcon = false,
    maxTransactions = null,
    forDashboard = false
  } = options

  return useMemo(() => {
    if (!transactions || transactions.length === 0) {
      return []
    }

    let processedTransactions = transactions

    // Limit transactions if specified
    if (maxTransactions && maxTransactions > 0) {
      processedTransactions = transactions.slice(0, maxTransactions)
    }

    // Apply advanced mode transformations if enabled
    if (settings.showAdvancedTransactionDetails) {
      processedTransactions = processedTransactions.flatMap(transaction => {
        if (shouldSplitTransactionInAdvancedMode(transaction.type, transaction.paymentMethod)) {
          return createSplitTransactionsForAdvancedMode(transaction)
        }
        return transaction
      })
    }

    return processedTransactions.map(rawTransaction => {
      // Use string type directly to avoid enum constant issues
      const transactionType = rawTransaction.originalType || rawTransaction.type || 'add'

      const baseDisplayData = {
        id: rawTransaction.id,
        transactionId: rawTransaction.id,
        type: ['add', 'receive', 'buy', 'sell'].includes(transactionType) ? 'received' : 'sent',
        displayType: determineTransactionDisplayType(transactionType),
        description: rawTransaction.description || generateHumanReadableTransactionDescription(
          transactionType,
          Number(rawTransaction.amount) || 0,
          rawTransaction.asset,
          rawTransaction.paymentMethod,
          rawTransaction.fromAsset,
          rawTransaction.fromAmount,
          rawTransaction.toAsset,
          rawTransaction.toAmount
        ),
        amount: calculateDisplayAmountWithSign(
          transactionType,
          Number(rawTransaction.amount) || 0,
          rawTransaction.netAmount,
          rawTransaction.paymentMethod,
          rawTransaction.toAsset,
          rawTransaction.toAmount
        ),
        time: formatRelativeTimeFromTimestamp(rawTransaction.timestamp || rawTransaction.createdAt || new Date().toISOString()),
        status: rawTransaction.status || 'completed',
        transactionCategory: transactionType
      }

      // Add dashboard-specific fields
      if (forDashboard) {
        return {
          ...baseDisplayData,
          // Dashboard uses different property names for legacy compatibility
          humanReadableDescription: baseDisplayData.description,
          formattedAmount: baseDisplayData.amount,
          relativeTimeDisplay: baseDisplayData.time,
          formattedDateDisplay: formatHumanReadableDate(rawTransaction.timestamp || rawTransaction.createdAt || new Date().toISOString()),
          currentStatus: baseDisplayData.status
        }
      }

      return baseDisplayData
    })
  }, [transactions, settings.showAdvancedTransactionDetails, maxTransactions, includeIcon, forDashboard])
}

/**
 * Hook specifically for dashboard recent activities (legacy compatibility)
 * @param {Array} transactions - Raw transaction data
 * @returns {Array} Dashboard-formatted transaction display data
 */
export function useDashboardTransactionDisplay(transactions, maxTransactions = 5) {
  return useTransactionDisplay(transactions, {
    maxTransactions,
    forDashboard: true
  })
}

/**
 * Hook specifically for account view transaction history
 * @param {Array} transactions - Raw transaction data
 * @returns {Array} Account view formatted transaction display data
 */
export function useAccountTransactionDisplay(transactions) {
  return useTransactionDisplay(transactions, {
    forDashboard: true // Account view uses same format as dashboard
  })
}