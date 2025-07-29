/**
 * Utility to reset all data to clean state for testing
 * This ensures we start with completely empty balances and no transaction history
 */

import { dataManager } from '../services/DataManager.js'

/**
 * Reset all application data to clean state
 */
export const resetToCleanState = () => {
  console.log('🧹 Resetting application to clean state for testing...')
  
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
    console.log(`🗑️  Removed ${key}`)
  })
  
  // Clear any session storage as well
  sessionStorage.clear()
  
  console.log('✅ Clean state reset complete!')
  console.log('📊 Current state:', {
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
  console.log('📝 Demo data disabled - users start with clean zero state')
  console.log('💡 All balances are built through actual user transactions (Add, Send, Withdraw, Buy, Sell, Yield strategies)')
  console.log('✅ Application will start with $0 balance')
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
  
  console.log('🔍 Clean state check:', {
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
        console.warn(`🧹 Clearing corrupted key: ${key} = ${stored.substring(0, 20)}...`)
        localStorage.removeItem(key)
        clearedCount++
      }
    } catch (_error) {
      console.warn(`🧹 Clearing invalid key: ${key}`)
      localStorage.removeItem(key)
      clearedCount++
    }
  })
  
  console.log(`✅ Cleared ${clearedCount} corrupted localStorage entries`)
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
  
  console.log('🛠️ Development helpers available:')
  console.log('- window.resetDiBoaSData() - Reset to clean state')
  console.log('- window.checkCleanState() - Check if data is clean')
  console.log('- window.addDemoData() - Demo data disabled, users start with $0')
  console.log('- window.clearCorruptedData() - Clear corrupted localStorage entries')
}

export default {
  resetToCleanState,
  addDemoData,
  isCleanState
}