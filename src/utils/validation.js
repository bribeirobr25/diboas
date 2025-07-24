/**
 * Comprehensive validation utilities for diBoaS application
 * Prevents edge cases and provides user-friendly error messages
 */

/**
 * Validation error types
 */
export const VALIDATION_ERRORS = {
  REQUIRED: 'required',
  INVALID_FORMAT: 'invalid_format',
  TOO_SHORT: 'too_short',
  TOO_LONG: 'too_long',
  INVALID_RANGE: 'invalid_range',
  INVALID_ADDRESS: 'invalid_address',
  SECURITY_RISK: 'security_risk'
}

/**
 * Input sanitization helpers
 */
export const sanitize = {
  /**
   * Removes potentially dangerous characters from text input
   */
  text: (input) => {
    if (typeof input !== 'string') return ''
    return input
      .replace(/[<>"'&]/g, '') // Remove HTML/XML characters
      .replace(/javascript:/gi, '') // Remove javascript protocols
      .replace(/on\w+=/gi, '') // Remove event handlers
      .trim()
  },

  /**
   * Sanitizes email input
   */
  email: (input) => {
    if (typeof input !== 'string') return ''
    return input
      .toLowerCase()
      .replace(/[^\w@.-]/g, '') // Only allow word chars, @, ., -
      .trim()
  },

  /**
   * Sanitizes numeric input for financial amounts
   * SECURITY: Prevents decimal point manipulation and ensures valid financial format
   */
  amount: (input) => {
    if (typeof input !== 'string' && typeof input !== 'number') return ''
    
    const stringInput = String(input)
    
    // Remove all non-numeric and non-decimal characters except minus sign
    let sanitized = stringInput.replace(/[^0-9.-]/g, '')
    
    // Handle multiple decimal points - keep only the first one
    const parts = sanitized.split('.')
    if (parts.length > 2) {
      sanitized = parts[0] + '.' + parts.slice(1).join('')
    }
    
    // Handle negative numbers
    const isNegative = sanitized.startsWith('-')
    if (isNegative) {
      sanitized = sanitized.substring(1)
    }
    
    // Remove leading zeros but preserve single zero before decimal
    sanitized = sanitized.replace(/^0+(?=\d)/, '')
    if (sanitized.startsWith('.')) {
      sanitized = '0' + sanitized
    }
    
    if (sanitized === '') {
      sanitized = '0'
    }
    
    // Limit to 2 decimal places for fiat, more for crypto (handle in Money class)
    if (sanitized.includes('.')) {
      const [whole, decimal] = sanitized.split('.')
      sanitized = whole + '.' + decimal.slice(0, 8) // Max 8 decimals (Bitcoin precision)
    }
    
    // Validate final format
    if (!/^\d*\.?\d*$/.test(sanitized)) {
      return ''
    }
    
    // Add negative sign back if needed
    return isNegative ? '-' + sanitized : sanitized
  },

  /**
   * Sanitizes wallet address input
   */
  walletAddress: (input) => {
    if (typeof input !== 'string') return ''
    return input
      .replace(/[^a-zA-Z0-9]/g, '') // Only alphanumeric
      .trim()
  }
}

/**
 * Email validation with comprehensive checks
 */
export function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: VALIDATION_ERRORS.REQUIRED, message: 'Email is required' }
  }

  const sanitizedEmail = sanitize.email(email)
  
  if (sanitizedEmail.length < 5) {
    return { isValid: false, error: VALIDATION_ERRORS.TOO_SHORT, message: 'Email is too short' }
  }

  if (sanitizedEmail.length > 320) { // RFC 5321 limit
    return { isValid: false, error: VALIDATION_ERRORS.TOO_LONG, message: 'Email is too long' }
  }

  // Enhanced email regex with more strict validation - must have TLD, no consecutive dots
  const emailRegex = /^[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_`{|}~-]+)*@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z]{2,})+$/
  
  if (!emailRegex.test(sanitizedEmail)) {
    return { isValid: false, error: VALIDATION_ERRORS.INVALID_FORMAT, message: 'Please enter a valid email address' }
  }

  // Check for suspicious patterns
  const suspiciousPatterns = [
    /test@test\.com/i,
    /admin@/i,
    /root@/i,
    /noreply@/i
  ]

  if (suspiciousPatterns.some(pattern => pattern.test(sanitizedEmail))) {
    return { isValid: false, error: VALIDATION_ERRORS.SECURITY_RISK, message: 'Please use a personal email address' }
  }

  return { isValid: true, sanitized: sanitizedEmail }
}

/**
 * Password validation with strength requirements
 */
export function validatePassword(password, isRegistering = false) {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: VALIDATION_ERRORS.REQUIRED, message: 'Password is required' }
  }

  if (password.length < 3 && !isRegistering) {
    return { isValid: false, error: VALIDATION_ERRORS.TOO_SHORT, message: 'Password is required' }
  }

  if (isRegistering) {
    if (password.length < 8) {
      return { isValid: false, error: VALIDATION_ERRORS.TOO_SHORT, message: 'Password must be at least 8 characters' }
    }

    if (password.length > 128) {
      return { isValid: false, error: VALIDATION_ERRORS.TOO_LONG, message: 'Password is too long' }
    }

    const requirements = {
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password),
      hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }

    const missingRequirements = []
    if (!requirements.hasUppercase) missingRequirements.push('uppercase letter')
    if (!requirements.hasLowercase) missingRequirements.push('lowercase letter')
    if (!requirements.hasNumber) missingRequirements.push('number')
    if (!requirements.hasSpecial) missingRequirements.push('special character')

    if (missingRequirements.length > 0) {
      return {
        isValid: false,
        error: VALIDATION_ERRORS.INVALID_FORMAT,
        message: `Password must include: ${missingRequirements.join(', ')}`
      }
    }

    // Check for common weak passwords
    const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123']
    if (commonPasswords.includes(password.toLowerCase())) {
      return {
        isValid: false,
        error: VALIDATION_ERRORS.SECURITY_RISK,
        message: 'This password is too common. Please choose a stronger password.'
      }
    }
  }

  return { isValid: true }
}

/**
 * Amount validation for financial transactions
 */
export function validateAmount(amount, options = {}) {
  const { min = 0.01, max = 1000000, currency = 'USD' } = options

  if (amount === null || amount === undefined || amount === '') {
    return { isValid: false, error: VALIDATION_ERRORS.REQUIRED, message: 'Amount is required' }
  }

  const sanitizedAmount = sanitize.amount(amount.toString())
  const numericAmount = parseFloat(sanitizedAmount)

  if (isNaN(numericAmount)) {
    return { isValid: false, error: VALIDATION_ERRORS.INVALID_FORMAT, message: 'Please enter a valid amount' }
  }

  if (numericAmount <= 0) {
    return { isValid: false, error: VALIDATION_ERRORS.INVALID_RANGE, message: 'Amount must be greater than zero' }
  }

  if (numericAmount < min) {
    return {
      isValid: false,
      error: VALIDATION_ERRORS.INVALID_RANGE,
      message: `Minimum amount is ${formatCurrency(min, currency)}`
    }
  }

  if (numericAmount > max) {
    return {
      isValid: false,
      error: VALIDATION_ERRORS.INVALID_RANGE,
      message: `Maximum amount is ${formatCurrency(max, currency)}`
    }
  }

  // Check for suspicious amounts (very precise amounts that might indicate testing)
  if (sanitizedAmount.includes('.') && sanitizedAmount.split('.')[1].length > 2) {
    const decimalPlaces = sanitizedAmount.split('.')[1].length
    if (decimalPlaces > 6) {
      return {
        isValid: false,
        error: VALIDATION_ERRORS.INVALID_FORMAT,
        message: 'Amount cannot have more than 6 decimal places'
      }
    }
  }

  return { isValid: true, sanitized: sanitizedAmount, numeric: numericAmount }
}

/**
 * Wallet address validation for different cryptocurrencies
 */
export function validateWalletAddress(address, type = 'ethereum') {
  if (!address || typeof address !== 'string') {
    return { isValid: false, error: VALIDATION_ERRORS.REQUIRED, message: 'Wallet address is required' }
  }

  const sanitizedAddress = sanitize.walletAddress(address)

  if (sanitizedAddress.length === 0) {
    return { isValid: false, error: VALIDATION_ERRORS.INVALID_FORMAT, message: 'Invalid wallet address format' }
  }

  switch (type.toLowerCase()) {
    case 'ethereum':
    case 'eth':
      return validateEthereumAddress(sanitizedAddress)
    case 'bitcoin':
    case 'btc':
      return validateBitcoinAddress(sanitizedAddress)
    default:
      return validateGenericAddress(sanitizedAddress)
  }
}

/**
 * Username validation for @username format
 */
export function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: VALIDATION_ERRORS.REQUIRED, message: 'Username is required' }
  }

  let sanitizedUsername = sanitize.text(username)
  
  // Handle @username format
  if (sanitizedUsername.startsWith('@')) {
    sanitizedUsername = sanitizedUsername.slice(1)
  }

  if (sanitizedUsername.length < 3) {
    return { isValid: false, error: VALIDATION_ERRORS.TOO_SHORT, message: 'Username must be at least 3 characters' }
  }

  if (sanitizedUsername.length > 30) {
    return { isValid: false, error: VALIDATION_ERRORS.TOO_LONG, message: 'Username cannot exceed 30 characters' }
  }

  const usernameRegex = /^[a-zA-Z0-9_]+$/
  if (!usernameRegex.test(sanitizedUsername)) {
    return {
      isValid: false,
      error: VALIDATION_ERRORS.INVALID_FORMAT,
      message: 'Username can only contain letters, numbers, and underscores'
    }
  }

  return { isValid: true, sanitized: `@${sanitizedUsername}` }
}

/**
 * Helper functions for specific validation types
 */
function validateEthereumAddress(address) {
  // Ethereum addresses are 40 hex characters (42 with 0x prefix)
  const ethRegex = /^0x[a-fA-F0-9]{40}$/
  
  if (address.length !== 42 || !ethRegex.test(address)) {
    return {
      isValid: false,
      error: VALIDATION_ERRORS.INVALID_ADDRESS,
      message: 'Invalid Ethereum address format'
    }
  }

  return { isValid: true, sanitized: address.toLowerCase() }
}

function validateBitcoinAddress(address) {
  // Basic Bitcoin address validation (simplified)
  const btcRegex = /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/
  
  if (!btcRegex.test(address)) {
    return {
      isValid: false,
      error: VALIDATION_ERRORS.INVALID_ADDRESS,
      message: 'Invalid Bitcoin address format'
    }
  }

  return { isValid: true, sanitized: address }
}

function validateGenericAddress(address) {
  if (address.length < 10 || address.length > 100) {
    return {
      isValid: false,
      error: VALIDATION_ERRORS.INVALID_ADDRESS,
      message: 'Wallet address length is invalid'
    }
  }

  return { isValid: true, sanitized: address }
}

/**
 * Utility function to format currency
 */
function formatCurrency(amount, currency = 'USD') {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency
  }).format(amount)
}

/**
 * Real-time validation function for forms
 */
export function createValidator(validationRules) {
  return (formData) => {
    const errors = {}
    let isValid = true

    for (const [field, rules] of Object.entries(validationRules)) {
      const value = formData[field]
      
      for (const rule of rules) {
        const result = rule(value)
        if (!result.isValid) {
          errors[field] = result
          isValid = false
          break // Stop at first error for this field
        }
      }
    }

    return { isValid, errors }
  }
}