/**
 * FinTech-Specific Security Utilities
 * Implements security best practices for financial applications
 */

import logger, { AUDIT_EVENTS } from './secureLogger.js'

/**
 * Content Security Policy configuration
 */
export const CSP_CONFIG = {
  development: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-eval'", "'unsafe-inline'"], // Relaxed for dev
    'style-src': ["'self'", "'unsafe-inline'"],
    'img-src': ["'self'", "data:", "https:"],
    'connect-src': ["'self'", "ws:", "wss:"],
    'font-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"]
  },
  production: {
    'default-src': ["'self'"],
    'script-src': ["'self'"],
    'style-src': ["'self'"],
    'img-src': ["'self'", "data:", "https://cdn.diboas.com"],
    'connect-src': ["'self'", "https://api.diboas.com", "wss://ws.diboas.com"],
    'font-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': true
  }
}

/**
 * Generate CSP header string
 */
export const generateCSPHeader = (environment = 'production') => {
  const config = CSP_CONFIG[environment] || CSP_CONFIG.production
  
  return Object.entries(config)
    .map(([directive, values]) => {
      if (typeof values === 'boolean') {
        return values ? directive : ''
      }
      return `${directive} ${values.join(' ')}`
    })
    .filter(Boolean)
    .join('; ')
}

/**
 * Secure random ID generation for financial transactions
 */
export const generateSecureTransactionId = () => {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
    // Browser environment with Web Crypto API
    const array = new Uint8Array(32)
    window.crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }
  
  // Fallback for Node.js or older browsers
  const crypto = require('crypto')
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Generate secure session tokens
 */
export const generateSessionToken = () => {
  const timestamp = Date.now().toString(36)
  const randomPart = generateSecureTransactionId().slice(0, 24)
  return `${timestamp}.${randomPart}`
}

/**
 * Validate and sanitize financial amounts
 */
export const validateFinancialAmount = (amount, currency = 'USD', options = {}) => {
  const {
    minAmount = 0.01,
    maxAmount = 1000000,
    allowNegative = false,
    strictValidation = true
  } = options

  // Type validation
  if (typeof amount !== 'number' && typeof amount !== 'string') {
    throw new Error('Amount must be a number or string')
  }

  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount

  // Basic validation
  if (isNaN(numericAmount) || !isFinite(numericAmount)) {
    throw new Error('Invalid amount: not a valid number')
  }

  if (!allowNegative && numericAmount < 0) {
    throw new Error('Negative amounts not allowed')
  }

  if (numericAmount < minAmount) {
    throw new Error(`Amount below minimum: ${minAmount}`)
  }

  if (numericAmount > maxAmount) {
    throw new Error(`Amount exceeds maximum: ${maxAmount}`)
  }

  // Currency-specific validation
  const currencyRules = {
    USD: { decimals: 2, symbol: '$' },
    EUR: { decimals: 2, symbol: '€' },
    GBP: { decimals: 2, symbol: '£' },
    BTC: { decimals: 8, symbol: '₿' },
    ETH: { decimals: 18, symbol: 'Ξ' }
  }

  const rule = currencyRules[currency.toUpperCase()]
  if (!rule && strictValidation) {
    throw new Error(`Unsupported currency: ${currency}`)
  }

  // Decimal precision validation
  if (rule) {
    const decimals = (numericAmount.toString().split('.')[1] || '').length
    if (decimals > rule.decimals) {
      throw new Error(`Too many decimal places for ${currency}. Max: ${rule.decimals}`)
    }
  }

  return {
    isValid: true,
    amount: numericAmount,
    currency: currency.toUpperCase(),
    formatted: rule ? `${rule.symbol}${numericAmount.toFixed(rule.decimals)}` : `${numericAmount} ${currency}`
  }
}

/**
 * Validate account numbers with check digits
 */
export const validateAccountNumber = (accountNumber, type = 'bank') => {
  if (!accountNumber || typeof accountNumber !== 'string') {
    return { isValid: false, error: 'Account number required' }
  }

  // Remove spaces and special characters
  const clean = accountNumber.replace(/[\s-]/g, '')

  // Basic format validation
  if (!/^\d+$/.test(clean)) {
    return { isValid: false, error: 'Account number must contain only digits' }
  }

  // Length validation based on type
  const lengthRules = {
    bank: { min: 8, max: 17 },
    credit: { min: 13, max: 19 },
    routing: { exact: 9 },
    iban: { min: 15, max: 34 }
  }

  const rule = lengthRules[type]
  if (rule) {
    if (rule.exact && clean.length !== rule.exact) {
      return { isValid: false, error: `${type} number must be exactly ${rule.exact} digits` }
    }
    if (rule.min && rule.max && (clean.length < rule.min || clean.length > rule.max)) {
      return { isValid: false, error: `${type} number must be between ${rule.min} and ${rule.max} digits` }
    }
  }

  // Routing number validation (ABA routing number check)
  if (type === 'routing') {
    const digits = clean.split('').map(Number)
    const checksum = (
      3 * (digits[0] + digits[3] + digits[6]) +
      7 * (digits[1] + digits[4] + digits[7]) +
      1 * (digits[2] + digits[5] + digits[8])
    ) % 10

    if (checksum !== 0) {
      return { isValid: false, error: 'Invalid routing number checksum' }
    }
  }

  return { isValid: true, accountNumber: clean }
}

/**
 * Secure cookie management
 */
export class SecureCookieManager {
  static set(name, value, options = {}) {
    if (typeof document === 'undefined') return

    const defaults = {
      secure: true,
      httpOnly: false, // Can't be set from client-side
      sameSite: 'Strict',
      path: '/',
      maxAge: 86400 // 24 hours
    }

    const config = { ...defaults, ...options }
    
    let cookieString = `${name}=${encodeURIComponent(value)}`
    
    if (config.maxAge) {
      cookieString += `; Max-Age=${config.maxAge}`
    }
    
    if (config.path) {
      cookieString += `; Path=${config.path}`
    }
    
    if (config.secure && window.location.protocol === 'https:') {
      cookieString += '; Secure'
    }
    
    if (config.sameSite) {
      cookieString += `; SameSite=${config.sameSite}`
    }

    document.cookie = cookieString
    
    logger.debug('Secure cookie set', { name, options: config })
  }

  static get(name) {
    if (typeof document === 'undefined') return null

    const value = document.cookie
      .split('; ')
      .find(row => row.startsWith(`${name}=`))
      ?.split('=')[1]

    return value ? decodeURIComponent(value) : null
  }

  static delete(name, path = '/') {
    if (typeof document === 'undefined') return

    document.cookie = `${name}=; Path=${path}; Expires=Thu, 01 Jan 1970 00:00:01 GMT; Secure; SameSite=Strict`
    logger.debug('Secure cookie deleted', { name })
  }
}

/**
 * Rate limiting for API calls
 */
export class RateLimiter {
  constructor(maxRequests = 100, windowMs = 60000) { // 100 requests per minute
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    this.requests = new Map()
  }

  isAllowed(identifier) {
    const now = Date.now()
    const userRequests = this.requests.get(identifier) || []
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(timestamp => now - timestamp < this.windowMs)
    
    if (validRequests.length >= this.maxRequests) {
      logger.warn('Rate limit exceeded', { identifier, requests: validRequests.length })
      return false
    }

    // Add current request
    validRequests.push(now)
    this.requests.set(identifier, validRequests)
    
    return true
  }

  reset(identifier) {
    this.requests.delete(identifier)
  }
}

/**
 * Input sanitization for financial forms
 */
export const sanitizeFinancialInput = {
  // Bank account number
  accountNumber: (input) => {
    return input.replace(/[^\d\s-]/g, '').trim()
  },

  // Routing number
  routingNumber: (input) => {
    return input.replace(/[^\d]/g, '').slice(0, 9)
  },

  // Credit card number
  creditCard: (input) => {
    return input.replace(/[^\d\s]/g, '').replace(/\s+/g, ' ').trim()
  },

  // CVV
  cvv: (input) => {
    return input.replace(/[^\d]/g, '').slice(0, 4)
  },

  // Money amount with currency symbol
  moneyAmount: (input, currency = 'USD') => {
    // Remove currency symbols and validate
    const cleaned = input.replace(/[$€£¥₿Ξ,\s]/g, '')
    const result = validateFinancialAmount(cleaned, currency)
    return result.isValid ? result.amount.toString() : ''
  },

  // Address (for compliance and shipping)
  address: (input) => {
    return input
      .replace(/[<>"'&]/g, '') // Remove XSS characters
      .replace(/[^\w\s.,#-]/g, '') // Allow normal address characters
      .trim()
      .slice(0, 255) // Limit length
  }
}

/**
 * Transaction security checks
 */
export const transactionSecurityChecks = {
  // Check for suspicious patterns
  detectSuspiciousActivity: (amount, userHistory = [], options = {}) => {
    const {
      maxVelocity = 5, // Max transactions per hour
      maxAmountIncrease = 10, // Max 10x increase from average
      timeWindowMs = 3600000 // 1 hour
    } = options

    const now = Date.now()
    const recentTransactions = userHistory.filter(
      tx => now - new Date(tx.timestamp).getTime() < timeWindowMs
    )

    // Velocity check
    if (recentTransactions.length >= maxVelocity) {
      return {
        suspicious: true,
        reason: 'High transaction velocity',
        details: `${recentTransactions.length} transactions in the last hour`
      }
    }

    // Amount anomaly check
    if (recentTransactions.length > 0) {
      const avgAmount = recentTransactions.reduce((sum, tx) => sum + tx.amount, 0) / recentTransactions.length
      if (amount > avgAmount * maxAmountIncrease) {
        return {
          suspicious: true,
          reason: 'Unusual transaction amount',
          details: `Amount ${amount} is ${(amount / avgAmount).toFixed(2)}x higher than recent average`
        }
      }
    }

    return { suspicious: false }
  },

  // AML/CTR compliance checks
  checkComplianceThresholds: (amount, currency = 'USD') => {
    const thresholds = {
      USD: { ctr: 10000, sar: 5000 }, // Currency Transaction Report, Suspicious Activity Report
      EUR: { ctr: 8500, sar: 4250 },
      GBP: { ctr: 7500, sar: 3750 }
    }

    const threshold = thresholds[currency] || thresholds.USD
    const flags = []

    if (amount >= threshold.ctr) {
      flags.push({
        type: 'CTR',
        description: 'Currency Transaction Report required',
        threshold: threshold.ctr
      })
    }

    if (amount >= threshold.sar) {
      flags.push({
        type: 'SAR_REVIEW',
        description: 'Manual review required for suspicious activity',
        threshold: threshold.sar
      })
    }

    return flags
  }
}

/**
 * Audit logging helpers
 */
export const auditLog = {
  userAction: (action, userId, details = {}) => {
    logger.audit(AUDIT_EVENTS.USER_ACTION || action, details, userId)
  },

  transactionEvent: (eventType, transactionId, userId, amount, details = {}) => {
    logger.audit(eventType, {
      transactionId,
      amount,
      ...details
    }, userId)
  },

  securityEvent: (eventType, details = {}, userId = null) => {
    logger.audit(AUDIT_EVENTS.SECURITY_VIOLATION, {
      securityEventType: eventType,
      ...details
    }, userId)
  },

  dataAccess: (resourceType, resourceId, userId, action = 'READ') => {
    logger.audit(AUDIT_EVENTS.SENSITIVE_DATA_ACCESS, {
      resourceType,
      resourceId,
      action
    }, userId)
  }
}

export default {
  generateSecureTransactionId,
  generateSessionToken,
  validateFinancialAmount,
  validateAccountNumber,
  SecureCookieManager,
  RateLimiter,
  sanitizeFinancialInput,
  transactionSecurityChecks,
  auditLog,
  generateCSPHeader,
  CSP_CONFIG
}