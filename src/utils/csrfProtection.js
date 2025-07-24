/**
 * CSRF Protection for diBoaS FinTech Platform
 * Implements Double Submit Cookie pattern for CSRF protection
 */

/**
 * Generate cryptographically secure CSRF token
 */
export function generateCSRFToken() {
  try {
    // Use Web Crypto API for secure random generation
    if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
      const randomBytes = new Uint8Array(32)
      crypto.getRandomValues(randomBytes)
      return btoa(String.fromCharCode(...randomBytes)).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)
    }
    
    // Fallback for older browsers
    const timestamp = Date.now().toString()
    const random = Math.random().toString(36).substring(2)
    return btoa(timestamp + random).replace(/[^a-zA-Z0-9]/g, '').slice(0, 32)
    
  } catch (error) {
    throw new Error('Failed to generate CSRF token: ' + error.message)
  }
}

/**
 * Set CSRF token in cookie and return token
 */
export function setCSRFToken() {
  const token = generateCSRFToken()
  
  // Set secure cookie
  document.cookie = `diboas-csrf-token=${token}; Path=/; SameSite=Strict; Secure=${location.protocol === 'https:'}`
  
  return token
}

/**
 * Get CSRF token from cookie
 */
export function getCSRFToken() {
  const cookies = document.cookie.split(';')
  
  for (let cookie of cookies) {
    const [name, value] = cookie.trim().split('=')
    if (name === 'diboas-csrf-token') {
      return value
    }
  }
  
  return null
}

/**
 * Validate CSRF token
 */
export function validateCSRFToken(headerToken) {
  const cookieToken = getCSRFToken()
  
  if (!cookieToken || !headerToken) {
    return false
  }
  
  // Constant time comparison to prevent timing attacks
  if (cookieToken.length !== headerToken.length) {
    return false
  }
  
  let result = 0
  for (let i = 0; i < cookieToken.length; i++) {
    result |= cookieToken.charCodeAt(i) ^ headerToken.charCodeAt(i)
  }
  
  return result === 0
}

/**
 * Add CSRF protection to fetch requests
 */
export function addCSRFHeaders(headers = {}) {
  let csrfToken = getCSRFToken()
  
  // Generate new token if none exists
  if (!csrfToken) {
    csrfToken = setCSRFToken()
  }
  
  return {
    ...headers,
    'X-CSRF-Token': csrfToken,
    'X-Requested-With': 'XMLHttpRequest' // Additional CSRF protection
  }
}

/**
 * Initialize CSRF protection on app start
 */
export function initializeCSRFProtection() {
  // Generate initial CSRF token
  setCSRFToken()
  
  // Refresh token periodically (every 30 minutes)
  setInterval(() => {
    setCSRFToken()
  }, 30 * 60 * 1000)
}

export default {
  generateCSRFToken,
  setCSRFToken,
  getCSRFToken,
  validateCSRFToken,
  addCSRFHeaders,
  initializeCSRFProtection
}