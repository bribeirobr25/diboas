/**
 * Payment Error
 * Standardized error class for payment operations
 */

export class PaymentError extends Error {
  constructor(message, provider = null, paymentRequest = null, originalError = null) {
    super(message)
    this.name = 'PaymentError'
    this.provider = provider
    this.paymentRequest = paymentRequest
    this.originalError = originalError
    this.timestamp = new Date()
    this.errorCode = this._determineErrorCode(message)
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, PaymentError)
    }
  }

  /**
   * Determine error code from message
   */
  _determineErrorCode(message) {
    const errorCodes = {
      'insufficient_funds': /insufficient.*(funds|balance)/i,
      'card_declined': /card.*(declined|rejected)/i,
      'invalid_amount': /invalid.*amount/i,
      'currency_not_supported': /currency.*not.*support/i,
      'payment_method_not_supported': /payment.*method.*not.*support/i,
      'limit_exceeded': /limit.*exceed/i,
      'network_error': /network.*error/i,
      'provider_unavailable': /provider.*unavailable/i,
      'authentication_failed': /authentication.*fail/i,
      'fraud_detected': /fraud.*detect/i,
      'expired_card': /card.*expir/i,
      'invalid_card': /invalid.*card/i,
      'processing_error': /processing.*error/i,
      'timeout': /timeout/i,
      'rate_limit': /rate.*limit/i
    }

    for (const [code, pattern] of Object.entries(errorCodes)) {
      if (pattern.test(message)) {
        return code
      }
    }

    return 'unknown_error'
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage() {
    const userMessages = {
      insufficient_funds: 'Insufficient funds in your account. Please add money or try a different payment method.',
      card_declined: 'Your card was declined. Please check your card details or try a different card.',
      invalid_amount: 'Invalid payment amount. Please enter a valid amount.',
      currency_not_supported: 'This currency is not supported. Please try a different currency.',
      payment_method_not_supported: 'This payment method is not supported. Please try a different method.',
      limit_exceeded: 'Payment amount exceeds your limits. Please try a smaller amount or contact support.',
      network_error: 'Network error occurred. Please check your connection and try again.',
      provider_unavailable: 'Payment service is temporarily unavailable. Please try again later.',
      authentication_failed: 'Payment authentication failed. Please verify your payment details.',
      fraud_detected: 'Payment blocked for security reasons. Please contact support if you believe this is an error.',
      expired_card: 'Your card has expired. Please use a different card.',
      invalid_card: 'Invalid card details. Please check your card information.',
      processing_error: 'Payment processing error occurred. Please try again.',
      timeout: 'Payment request timed out. Please try again.',
      rate_limit: 'Too many payment attempts. Please wait before trying again.',
      unknown_error: 'Payment failed. Please try again or contact support.'
    }

    return userMessages[this.errorCode] || userMessages.unknown_error
  }

  /**
   * Get error details for logging
   */
  getDetails() {
    return {
      message: this.message,
      errorCode: this.errorCode,
      provider: this.provider,
      paymentRequest: this.paymentRequest ? {
        amount: this.paymentRequest.amount ? this.paymentRequest.amount.toString() : null,
        type: this.paymentRequest.type,
        paymentMethod: this.paymentRequest.paymentMethod
      } : null,
      timestamp: this.timestamp,
      originalError: this.originalError ? this.originalError.message : null,
      stack: this.stack
    }
  }

  /**
   * Check if error is retryable
   */
  isRetryable() {
    const retryableErrors = [
      'network_error',
      'provider_unavailable',
      'processing_error',
      'timeout',
      'rate_limit'
    ]

    return retryableErrors.includes(this.errorCode)
  }

  /**
   * Check if error requires user action
   */
  requiresUserAction() {
    const userActionErrors = [
      'insufficient_funds',
      'card_declined',
      'invalid_amount',
      'expired_card',
      'invalid_card',
      'authentication_failed'
    ]

    return userActionErrors.includes(this.errorCode)
  }

  /**
   * Get suggested actions for user
   */
  getSuggestedActions() {
    const actions = {
      insufficient_funds: [
        'Add money to your account',
        'Try a different payment method',
        'Use a smaller amount'
      ],
      card_declined: [
        'Check your card details',
        'Try a different card',
        'Contact your bank'
      ],
      invalid_amount: [
        'Enter a valid amount',
        'Check minimum/maximum limits'
      ],
      expired_card: [
        'Use a different card',
        'Update your card information'
      ],
      invalid_card: [
        'Check your card number',
        'Verify expiry date and CVV',
        'Try a different card'
      ],
      network_error: [
        'Check your internet connection',
        'Try again in a moment'
      ],
      provider_unavailable: [
        'Try again later',
        'Use a different payment method'
      ],
      rate_limit: [
        'Wait a few minutes before trying again',
        'Contact support if issue persists'
      ]
    }

    return actions[this.errorCode] || ['Try again', 'Contact support if issue persists']
  }

  /**
   * Convert to JSON for API responses
   */
  toJSON() {
    return {
      error: true,
      message: this.getUserMessage(),
      code: this.errorCode,
      provider: this.provider,
      retryable: this.isRetryable(),
      requiresUserAction: this.requiresUserAction(),
      suggestedActions: this.getSuggestedActions(),
      timestamp: this.timestamp
    }
  }

  /**
   * Create specific error types
   */
  static insufficientFunds(provider = null, paymentRequest = null) {
    return new PaymentError('Insufficient funds', provider, paymentRequest)
  }

  static cardDeclined(provider = null, paymentRequest = null) {
    return new PaymentError('Card declined', provider, paymentRequest)
  }

  static invalidAmount(provider = null, paymentRequest = null) {
    return new PaymentError('Invalid amount', provider, paymentRequest)
  }

  static limitExceeded(provider = null, paymentRequest = null) {
    return new PaymentError('Limit exceeded', provider, paymentRequest)
  }

  static networkError(provider = null, paymentRequest = null) {
    return new PaymentError('Network error', provider, paymentRequest)
  }

  static providerUnavailable(provider = null, paymentRequest = null) {
    return new PaymentError('Provider unavailable', provider, paymentRequest)
  }
}

export default PaymentError