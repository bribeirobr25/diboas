/**
 * Security Utilities
 * Provides secure ID generation and other security-related functions
 */

/**
 * Generate a cryptographically secure random ID
 */
export function generateSecureId(prefix = '', length = 16) {
  const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
  const array = new Uint8Array(length)
  
  if (typeof window !== 'undefined' && window.crypto) {
    // Browser environment
    window.crypto.getRandomValues(array)
  } else {
    // Fallback for non-crypto environments
    for (let i = 0; i < length; i++) {
      array[i] = Math.floor(Math.random() * 256)
    }
  }
  
  let result = ''
  for (let i = 0; i < length; i++) {
    result += characters[array[i] % characters.length]
  }
  
  return prefix ? `${prefix}_${result}` : result
}

/**
 * Generate a secure transaction ID
 */
export function generateTransactionId() {
  const timestamp = Date.now().toString(36)
  const random = generateSecureId('', 8)
  return `tx_${timestamp}_${random}`
}

/**
 * Generate a secure session ID
 */
export function generateSessionId() {
  return generateSecureId('sess', 24)
}

/**
 * Hash a string using a simple hash function (for non-cryptographic purposes)
 */
export function simpleHash(str) {
  let hash = 0
  if (str.length === 0) return hash
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString(36)
}

/**
 * Sanitize user input to prevent XSS
 */
export function sanitizeInput(input) {
  if (typeof input !== 'string') return input
  
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;')
}

/**
 * Validate and sanitize wallet address
 */
export function sanitizeWalletAddress(address) {
  if (typeof address !== 'string') return ''
  
  // Remove any non-alphanumeric characters except for common wallet address characters
  return address.replace(/[^a-zA-Z0-9]/g, '').substring(0, 100)
}

/**
 * Rate limiting utility
 */
export class RateLimiter {
  constructor(maxRequests = 10, windowMs = 60000) {
    this.maxRequests = maxRequests
    this.windowMs = windowMs
    this.requests = new Map()
  }
  
  isAllowed(identifier) {
    const now = Date.now()
    const userRequests = this.requests.get(identifier) || []
    
    // Remove expired requests
    const validRequests = userRequests.filter(timestamp => now - timestamp < this.windowMs)
    
    if (validRequests.length >= this.maxRequests) {
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
 * Secure storage utility for sensitive data
 */
export class SecureStorage {
  constructor(prefix = 'diboas_secure_') {
    this.prefix = prefix
  }
  
  set(key, value, expirationMs = null) {
    const data = {
      value,
      timestamp: Date.now(),
      expiration: expirationMs ? Date.now() + expirationMs : null
    }
    
    try {
      localStorage.setItem(this.prefix + key, JSON.stringify(data))
      return true
    } catch (error) {
      console.warn('Failed to store secure data:', error)
      return false
    }
  }
  
  get(key) {
    try {
      const item = localStorage.getItem(this.prefix + key)
      if (!item) return null
      
      const data = JSON.parse(item)
      
      // Check expiration
      if (data.expiration && Date.now() > data.expiration) {
        this.remove(key)
        return null
      }
      
      return data.value
    } catch (error) {
      console.warn('Failed to retrieve secure data:', error)
      return null
    }
  }
  
  remove(key) {
    try {
      localStorage.removeItem(this.prefix + key)
      return true
    } catch (error) {
      console.warn('Failed to remove secure data:', error)
      return false
    }
  }
  
  clear() {
    try {
      const keys = Object.keys(localStorage).filter(key => key.startsWith(this.prefix))
      keys.forEach(key => localStorage.removeItem(key))
      return true
    } catch (error) {
      console.warn('Failed to clear secure data:', error)
      return false
    }
  }
}

export default {
  generateSecureId,
  generateTransactionId,
  generateSessionId,
  simpleHash,
  sanitizeInput,
  sanitizeWalletAddress,
  RateLimiter,
  SecureStorage
}