/**
 * Auth Error
 * Standardized error class for authentication operations
 */

export class AuthError extends Error {
  constructor(message, provider = null, originalError = null) {
    super(message)
    this.name = 'AuthError'
    this.provider = provider
    this.originalError = originalError
    this.timestamp = new Date()
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AuthError)
    }
  }

  /**
   * Get error details for logging
   */
  getDetails() {
    return {
      message: this.message,
      provider: this.provider,
      timestamp: this.timestamp,
      originalError: this.originalError ? this.originalError.message : null,
      stack: this.stack
    }
  }

  /**
   * Create user-friendly error message
   */
  getUserMessage() {
    const userMessages = {
      'invalid_credentials': 'Invalid email or password. Please try again.',
      'account_not_found': 'Account not found. Please check your email or sign up.',
      'email_already_exists': 'An account with this email already exists.',
      'weak_password': 'Password must be at least 8 characters with mixed case, numbers, and symbols.',
      'invalid_email': 'Please enter a valid email address.',
      'network_error': 'Network error. Please check your connection and try again.',
      'rate_limit_exceeded': 'Too many attempts. Please wait before trying again.',
      'provider_unavailable': 'Authentication service is temporarily unavailable. Please try again later.',
      'token_expired': 'Your session has expired. Please sign in again.',
      'verification_required': 'Please verify your email before signing in.',
      'account_disabled': 'Your account has been disabled. Please contact support.',
      'mfa_required': 'Two-factor authentication is required.',
      'social_auth_cancelled': 'Social authentication was cancelled.',
      'wallet_not_connected': 'Please connect your wallet to continue.',
      'wallet_network_mismatch': 'Please switch to the correct network in your wallet.'
    }

    // Try to match common error patterns
    const errorKey = this.message.toLowerCase().replace(/\s+/g, '_')
    return userMessages[errorKey] || 'Authentication failed. Please try again.'
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON() {
    return {
      error: true,
      message: this.getUserMessage(),
      code: this.message.toLowerCase().replace(/\s+/g, '_'),
      provider: this.provider,
      timestamp: this.timestamp
    }
  }
}

export default AuthError