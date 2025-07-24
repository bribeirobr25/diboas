/**
 * Transaction Hooks Index
 * Exports all transaction-related hooks with original interface
 */

export { useTransactions } from './useTransactions.js'
export { useWalletBalance } from './useWalletBalance.js'
export { useFeeCalculator } from './useFeeCalculator.js'
export { useTransactionValidation } from './useTransactionValidation.js'

// Re-export remaining hooks from original file until fully migrated
export { 
  useTransactionProcessor,
  useTransactionFlow,
  useTransactionTwoFA
} from '../useTransactions.jsx'

// Export singleton utilities
export { 
  getTransactionEngine, 
  getWalletManager, 
  resetSingletons 
} from './transactionSingletons.js'