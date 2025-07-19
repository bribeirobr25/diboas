/**
 * Navigation utility functions
 * Eliminates navigation logic duplication across components
 */

/**
 * Common navigation paths used throughout the app
 */
export const NAVIGATION_PATHS = {
  HOME: '/',
  AUTH: '/auth',
  APP: '/app',
  ACCOUNT: '/account',
  TRANSACTION: '/transaction',
  TRANSACTION_WITH_TYPE: (type) => `/transaction?type=${type}`
}

/**
 * Transaction types for consistent routing
 */
export const TRANSACTION_TYPES = {
  ADD: 'add',
  SEND: 'send',
  RECEIVE: 'receive',
  BUY: 'buy',
  SELL: 'sell',
  TRANSFER: 'transfer',
  WITHDRAW: 'withdraw',
  INVEST: 'invest'
}

/**
 * Quick action configurations for dashboard
 */
export const QUICK_ACTIONS = [
  { 
    icon: 'Plus', 
    label: 'Add', 
    type: TRANSACTION_TYPES.ADD,
    colorClass: 'add-funds'
  },
  { 
    icon: 'Send', 
    label: 'Send', 
    type: TRANSACTION_TYPES.SEND,
    colorClass: 'send-money'
  },
  { 
    icon: 'TrendingUp', 
    label: 'Invest', 
    type: TRANSACTION_TYPES.INVEST,
    colorClass: 'invest'
  }
]

/**
 * Creates a navigation handler for transaction types
 */
export function createTransactionNavigator(navigate) {
  return (transactionType) => {
    navigate(NAVIGATION_PATHS.TRANSACTION_WITH_TYPE(transactionType))
  }
}

/**
 * Creates a back navigation handler
 */
export function createBackNavigator(navigate) {
  return (defaultPath = NAVIGATION_PATHS.HOME) => {
    navigate(defaultPath)
  }
}