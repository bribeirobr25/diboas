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
  
  // Refresh the page to ensure all components reset
  if (typeof window !== 'undefined') {
    window.location.reload()
  }
}

/**
 * Add some initial demo data for testing (optional)
 */
export const addDemoData = () => {
  console.log('📝 Adding demo data for testing...')
  
  // Add some balance for testing other transaction types
  const demoBalance = {
    totalUSD: 1000,
    availableForSpending: 1000,
    investedAmount: 0,
    breakdown: {
      BTC: { native: 0, usdc: 0, usdValue: 0 },
      ETH: { native: 0, usdc: 0, usdValue: 0 },
      SOL: { native: 0, usdc: 1000, usdValue: 1000 },
      SUI: { native: 0, usdc: 0, usdValue: 0 }
    },
    assets: {},
    lastUpdated: Date.now()
  }
  
  // Update DataManager state
  dataManager.state.balance = demoBalance
  dataManager.persistBalance()
  dataManager.emit('balance:updated', demoBalance)
  
  console.log('✅ Demo balance added: $1000 available for testing other transactions')
}

/**
 * Check if data is in clean state
 */
export const isCleanState = () => {
  const balance = dataManager.getBalance()
  const transactions = dataManager.getTransactions()
  
  const isClean = (
    balance?.totalUSD === 0 &&
    balance?.availableForSpending === 0 &&
    balance?.investedAmount === 0 &&
    transactions.length === 0
  )
  
  console.log('🔍 Clean state check:', {
    isClean,
    balance,
    transactionCount: transactions.length
  })
  
  return isClean
}

/**
 * Development helper to reset data from browser console
 */
if (typeof window !== 'undefined') {
  window.resetDiBoaSData = resetToCleanState
  window.checkCleanState = isCleanState
  window.addDemoData = addDemoData
  
  console.log('🛠️ Development helpers available:')
  console.log('- window.resetDiBoaSData() - Reset to clean state')
  console.log('- window.checkCleanState() - Check if data is clean')
  console.log('- window.addDemoData() - Add demo data (currently empty)')
}

export default {
  resetToCleanState,
  addDemoData,
  isCleanState
}