/**
 * LocalStorage Helper Utilities
 * Provides robust localStorage operations with corruption detection and recovery
 */

/**
 * Safely get and parse JSON from localStorage with automatic corruption recovery
 */
export function safeGetJSON(key, defaultValue = null) {
  try {
    const stored = localStorage.getItem(key)
    if (!stored) return defaultValue
    
    // Check if data looks like valid JSON before parsing
    if (!stored.startsWith('{') && !stored.startsWith('[') && !stored.startsWith('"')) {
      console.warn(`localStorage key '${key}' contains corrupted data:`, stored.substring(0, 20) + '...')
      localStorage.removeItem(key)
      return defaultValue
    }
    
    const parsed = JSON.parse(stored)
    return parsed
  } catch (error) {
    console.warn(`Failed to parse localStorage key '${key}':`, error.message)
    // Clear corrupted data
    localStorage.removeItem(key)
    return defaultValue
  }
}

/**
 * Safely set JSON to localStorage with validation
 */
export function safeSetJSON(key, value) {
  try {
    const jsonString = JSON.stringify(value)
    localStorage.setItem(key, jsonString)
    return true
  } catch (error) {
    console.error(`Failed to store data in localStorage key '${key}':`, error.message)
    return false
  }
}

/**
 * Clear all diBoaS-related localStorage with corruption detection
 */
export function clearCorruptedDiBoaSData() {
  const keys = Object.keys(localStorage)
  const diboasKeys = keys.filter(key => key.startsWith('diboas_'))
  let clearedCount = 0
  
  diboasKeys.forEach(key => {
    try {
      const stored = localStorage.getItem(key)
      if (!stored) return
      
      // Try to parse the data to check if it's valid JSON
      try {
        JSON.parse(stored)
        // If JSON.parse succeeds, the data is valid
      } catch (parseError) {
        // If it's not valid JSON and not a simple string, consider it corrupted
        // Allow simple strings (like user settings) and boolean values
        if (stored !== 'true' && stored !== 'false' && 
            !stored.match(/^[a-zA-Z0-9_-]+$/) && 
            stored.length > 50) {
          console.warn(`Clearing corrupted localStorage key: ${key}`)
          localStorage.removeItem(key)
          clearedCount++
        }
      }
    } catch (error) {
      console.warn(`Error checking localStorage key ${key}, removing it:`, error.message)
      localStorage.removeItem(key)
      clearedCount++
    }
  })
  
  if (clearedCount > 0) {
    console.log(`🧹 Cleared ${clearedCount} corrupted localStorage entries`)
  }
  
  return clearedCount
}

/**
 * Validate and fix transaction history data specifically
 */
export function validateTransactionHistory(userId) {
  const historyKey = `diboas_transaction_history_${userId}`
  const history = safeGetJSON(historyKey, [])
  
  // Ensure it's an array
  if (!Array.isArray(history)) {
    console.warn('Transaction history is not an array, resetting to empty')
    safeSetJSON(historyKey, [])
    return []
  }
  
  // Validate each transaction object
  const validTransactions = history.filter(tx => {
    return tx && 
           typeof tx === 'object' && 
           tx.id && 
           tx.type && 
           tx.amount !== undefined &&
           tx.timestamp
  })
  
  if (validTransactions.length !== history.length) {
    console.warn(`Removed ${history.length - validTransactions.length} invalid transactions`)
    safeSetJSON(historyKey, validTransactions)
  }
  
  return validTransactions
}

/**
 * Initialize localStorage cleanup on app start
 */
export function initializeLocalStorageCleanup() {
  // Clear any corrupted data on startup
  clearCorruptedDiBoaSData()
  
  // Set up periodic cleanup (every 5 minutes)
  setInterval(() => {
    clearCorruptedDiBoaSData()
  }, 5 * 60 * 1000)
}