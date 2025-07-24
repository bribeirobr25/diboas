/**
 * Transaction Singleton Management
 * Shared singleton instances for the transaction system
 */

import TransactionEngine from '../../services/transactions/TransactionEngine.js'
import MultiWalletManager from '../../services/transactions/MultiWalletManager.js'

export let transactionEngineInstance = null
export let walletManagerInstance = null

/**
 * Get singleton instances
 */
export async function getTransactionEngine() {
  if (!transactionEngineInstance) {
    transactionEngineInstance = new TransactionEngine()
    await transactionEngineInstance.initialize()
  }
  return transactionEngineInstance
}

export function getWalletManager() {
  if (!walletManagerInstance) {
    walletManagerInstance = new MultiWalletManager()
  }
  return walletManagerInstance
}

/**
 * Cleanup function for testing and development
 */
export function resetSingletons() {
  transactionEngineInstance = null
  walletManagerInstance = null
}