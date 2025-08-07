/**
 * Navigation utility functions
 * Eliminates navigation logic duplication across components
 * Now with subdomain-aware routing support
 */

import { 
  buildSubdomainUrl, 
  navigateToSubdomain, 
  detectCurrentSubdomain,
  SUBDOMAINS 
} from '../config/subdomains.js'
import { getApiConfig } from '../config/environments.js'

/**
 * Common navigation paths used throughout the app
 * Using RESTful routing structure for better organization
 */
export const NAVIGATION_PATHS = {
  HOME: '/',
  AUTH: '/auth',
  APP: '/app',
  ACCOUNT: '/account',
  
  // Category routes
  CATEGORIES: {
    BANKING: '/category/banking',
    INVESTMENT: '/category/investment',
    YIELD: '/category/yield'
  },
  
  // Transaction routes - Category-based structure
  TRANSACTIONS: {
    // Banking transactions
    ADD: '/category/banking/add',
    SEND: '/category/banking/send', 
    RECEIVE: '/category/banking/receive',
    WITHDRAW: '/category/banking/withdraw',
    
    // Investment transactions
    BUY: '/category/investment/buy',
    SELL: '/category/investment/sell',
    
    // Legacy paths for backward compatibility
    LEGACY: {
      ADD: '/add',
      SEND: '/send', 
      RECEIVE: '/receive',
      BUY: '/buy',
      SELL: '/sell',
      WITHDRAW: '/withdraw',
      INVEST: '/invest'
    }
  },
  
  // Legacy support (will be removed)
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
  WITHDRAW: 'withdraw',
  INVEST: 'invest',
  START_STRATEGY: 'start_strategy',
  STOP_STRATEGY: 'stop_strategy'
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
 * Uses new RESTful route structure
 */
export function createTransactionNavigator(navigate) {
  return (transactionType) => {
    const routeMap = {
      [TRANSACTION_TYPES.ADD]: NAVIGATION_PATHS.TRANSACTIONS.ADD,
      [TRANSACTION_TYPES.SEND]: NAVIGATION_PATHS.TRANSACTIONS.SEND,
      [TRANSACTION_TYPES.RECEIVE]: NAVIGATION_PATHS.TRANSACTIONS.RECEIVE,
      [TRANSACTION_TYPES.BUY]: NAVIGATION_PATHS.TRANSACTIONS.BUY,
      [TRANSACTION_TYPES.SELL]: NAVIGATION_PATHS.TRANSACTIONS.SELL,
      [TRANSACTION_TYPES.WITHDRAW]: NAVIGATION_PATHS.TRANSACTIONS.WITHDRAW,
      [TRANSACTION_TYPES.INVEST]: NAVIGATION_PATHS.TRANSACTIONS.INVEST,
      [TRANSACTION_TYPES.START_STRATEGY]: '/category/yield',
      [TRANSACTION_TYPES.STOP_STRATEGY]: '/yield/manager'
    }
    
    const route = routeMap[transactionType] || NAVIGATION_PATHS.TRANSACTION_WITH_TYPE(transactionType)
    navigate(route)
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

/**
 * Get the base app URL for current environment with subdomain support
 */
export const getAppBaseUrl = () => {
  if (typeof window !== 'undefined') {
    const { protocol, host } = window.location
    return `${protocol}//${host}`
  }
  
  // Fallback for SSR or tests - use app subdomain
  const apiConfig = getApiConfig()
  return apiConfig.appUrl || apiConfig.baseUrl.replace('/api', '')
}

/**
 * Navigate to a different subdomain with optional path
 */
export const navigateToApp = (path = '/app') => {
  navigateToSubdomain(SUBDOMAINS.APP, path)
}

export const navigateToLanding = (path = '/') => {
  navigateToSubdomain(SUBDOMAINS.WWW, path)
}

export const navigateToAuth = (path = '/auth') => {
  navigateToSubdomain(SUBDOMAINS.WWW, path)
}

export const navigateToDocs = (path = '/') => {
  navigateToSubdomain(SUBDOMAINS.DOCS, path)
}

/**
 * Build URL for cross-subdomain navigation
 */
export const buildAppUrl = (path) => {
  return buildSubdomainUrl(SUBDOMAINS.APP, path)
}

export const buildLandingUrl = (path) => {
  return buildSubdomainUrl(SUBDOMAINS.WWW, path)
}

export const buildDocsUrl = (path) => {
  return buildSubdomainUrl(SUBDOMAINS.DOCS, path)
}

/**
 * Check current subdomain context
 */
export const isOnAppSubdomain = () => {
  return detectCurrentSubdomain() === SUBDOMAINS.APP
}

export const isOnLandingSubdomain = () => {
  return detectCurrentSubdomain() === SUBDOMAINS.WWW
}

/**
 * Enhanced transaction navigator with subdomain awareness
 */
export function createSubdomainAwareTransactionNavigator(navigate) {
  return (transactionType) => {
    const currentSubdomain = detectCurrentSubdomain()
    
    // All transaction routes should be on app subdomain
    if (currentSubdomain !== SUBDOMAINS.APP) {
      const routeMap = {
        [TRANSACTION_TYPES.ADD]: NAVIGATION_PATHS.TRANSACTIONS.ADD,
        [TRANSACTION_TYPES.SEND]: NAVIGATION_PATHS.TRANSACTIONS.SEND,
        [TRANSACTION_TYPES.RECEIVE]: NAVIGATION_PATHS.TRANSACTIONS.RECEIVE,
        [TRANSACTION_TYPES.BUY]: NAVIGATION_PATHS.TRANSACTIONS.BUY,
        [TRANSACTION_TYPES.SELL]: NAVIGATION_PATHS.TRANSACTIONS.SELL,
        [TRANSACTION_TYPES.WITHDRAW]: NAVIGATION_PATHS.TRANSACTIONS.WITHDRAW,
        [TRANSACTION_TYPES.INVEST]: NAVIGATION_PATHS.TRANSACTIONS.INVEST,
        [TRANSACTION_TYPES.START_STRATEGY]: '/category/yield',
        [TRANSACTION_TYPES.STOP_STRATEGY]: '/yield/manager'
      }
      
      const route = routeMap[transactionType] || NAVIGATION_PATHS.TRANSACTION_WITH_TYPE(transactionType)
      navigateToSubdomain(SUBDOMAINS.APP, route)
    } else {
      // Already on app subdomain, use regular navigation
      const transactionNavigator = createTransactionNavigator(navigate)
      transactionNavigator(transactionType)
    }
  }
}