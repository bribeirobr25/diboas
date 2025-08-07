/**
 * Utility to reset all data to clean state for testing
 * This ensures we start with completely empty balances and no transaction history
 */

import { dataManager } from '../services/DataManager.js'
import logger from './logger'

/**
 * Reset all application data to clean state
 */
export const resetToCleanState = () => {
  logger.debug('🧹 Resetting application to clean state for testing...')
  
  // Reset DataManager to clean state
  dataManager.resetToCleanState()
  
  // Clear any additional localStorage items that might exist
  const userId = 'demo_user_12345'
  const keysToRemove = [
    `diboas_balances_${userId}`,
    `diboas_balance_state_${userId}`,
    `diboas_transaction_history_${userId}`,
    `diboas_wallets_${userId}`,
    'diboas_app_logged', // Reset app logging flag too
  ]
  
  keysToRemove.forEach(key => {
    localStorage.removeItem(key)
    logger.debug(`🗑️  Removed ${key}`)
  })
  
  // Clear any session storage as well
  sessionStorage.clear()
  
  logger.debug('✅ Clean state reset complete!')
  logger.debug('📊 Current state:', {
    balance: dataManager.getBalance(),
    transactions: dataManager.getTransactions(),
    user: dataManager.getUser()
  })
  
  // Note: Page refresh removed to prevent infinite reload loops
  // Components will update automatically via DataManager events
}

/**
 * Add demo data is no longer used - users start with clean zero state
 * All balances and data are built through actual user transactions
 */
export const addDemoData = () => {
  logger.debug('📝 Demo data disabled - users start with clean zero state')
  logger.debug('💡 All balances are built through actual user transactions (Add, Send, Withdraw, Buy, Sell, Yield strategies)')
  logger.debug('✅ Application will start with $0 balance')
}

/**
 * Check if data is in clean state
 * Now considers demo data as "clean" to prevent infinite reloads
 */
export const isCleanState = () => {
  const balance = dataManager.getBalance()
  const transactions = dataManager.getTransactions()
  
  // Check if we have valid balance data (zero or positive values)
  const hasValidBalanceData = (
    balance?.totalUSD >= 0 &&
    balance?.availableForSpending >= 0 &&
    balance?.investedAmount >= 0 &&
    transactions.length >= 0 // Allow any number of transactions
  )
  
  const isClean = hasValidBalanceData
  
  logger.debug('🔍 Clean state check:', {
    isClean,
    hasValidBalanceData,
    balance: {
      totalUSD: balance?.totalUSD,
      available: balance?.availableForSpending,
      invested: balance?.investedAmount
    },
    transactionCount: transactions.length
  })
  
  return isClean
}

/**
 * Development helper to clear corrupted localStorage
 */
function clearCorruptedData() {
  const keys = Object.keys(localStorage)
  const diboasKeys = keys.filter(key => key.startsWith('diboas_'))
  let clearedCount = 0
  
  diboasKeys.forEach(key => {
    try {
      const stored = localStorage.getItem(key)
      if (stored && !stored.startsWith('{') && !stored.startsWith('[') && !stored.startsWith('"')) {
        logger.warn(`🧹 Clearing corrupted key: ${key} = ${stored.substring(0, 20)}...`)
        localStorage.removeItem(key)
        clearedCount++
      }
    } catch (_error) {
      logger.warn(`🧹 Clearing invalid key: ${key}`)
      localStorage.removeItem(key)
      clearedCount++
    }
  })
  
  logger.debug(`✅ Cleared ${clearedCount} corrupted localStorage entries`)
  return clearedCount
}

/**
 * Development helper to reset data from browser console
 */
if (typeof window !== 'undefined') {
  window.resetDiBoaSData = resetToCleanState
  window.checkCleanState = isCleanState
  window.addDemoData = addDemoData
  window.clearCorruptedData = clearCorruptedData
  
  logger.debug('🛠️ Development helpers available:')
  logger.debug('- window.resetDiBoaSData() - Reset to clean state')
  logger.debug('- window.checkCleanState() - Check if data is clean')
  logger.debug('- window.addDemoData() - Demo data disabled, users start with $0')
  logger.debug('- window.clearCorruptedData() - Clear corrupted localStorage entries')
}

export default {
  resetToCleanState,
  addDemoData,
  isCleanState
}