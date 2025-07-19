/**
 * Payment Result
 * Standardized result object for payment operations
 */

export class PaymentResult {
  constructor(data = {}) {
    this.success = data.success || false
    this.transactionId = data.transactionId || null
    this.amount = data.amount || null
    this.fees = data.fees || null
    this.status = data.status || 'pending'
    this.provider = data.provider || null
    this.paymentMethod = data.paymentMethod || null
    this.processingTime = data.processingTime || null
    this.confirmations = data.confirmations || 0
    this.receipt = data.receipt || null
    this.metadata = data.metadata || {}
    this.error = data.error || null
    this.timestamp = data.timestamp || new Date()
  }

  /**
   * Create a successful payment result
   */
  static success(transactionId, amount, options = {}) {
    return new PaymentResult({
      success: true,
      transactionId,
      amount,
      status: options.status || 'completed',
      fees: options.fees,
      provider: options.provider,
      paymentMethod: options.paymentMethod,
      processingTime: options.processingTime,
      confirmations: options.confirmations || 1,
      receipt: options.receipt,
      metadata: options.metadata
    })
  }

  /**
   * Create a pending payment result
   */
  static pending(transactionId, amount, options = {}) {
    return new PaymentResult({
      success: true,
      transactionId,
      amount,
      status: 'pending',
      fees: options.fees,
      provider: options.provider,
      paymentMethod: options.paymentMethod,
      metadata: options.metadata
    })
  }

  /**
   * Create a failed payment result
   */
  static failure(error, options = {}) {
    return new PaymentResult({
      success: false,
      error,
      status: 'failed',
      provider: options.provider,
      paymentMethod: options.paymentMethod,
      metadata: options.metadata
    })
  }

  /**
   * Check if payment is completed
   */
  isCompleted() {
    return this.success && this.status === 'completed'
  }

  /**
   * Check if payment is pending
   */
  isPending() {
    return this.success && this.status === 'pending'
  }

  /**
   * Check if payment failed
   */
  isFailed() {
    return !this.success || this.status === 'failed'
  }

  /**
   * Get total cost including fees
   */
  getTotalCost() {
    if (!this.amount || !this.fees) {
      return this.amount
    }

    return this.amount.add(this.fees.total)
  }

  /**
   * Get payment summary for display
   */
  getSummary() {
    return {
      transactionId: this.transactionId,
      amount: this.amount ? this.amount.toString() : null,
      totalCost: this.getTotalCost() ? this.getTotalCost().toString() : null,
      fees: this.fees ? this.fees.total.toString() : null,
      status: this.status,
      provider: this.provider,
      timestamp: this.timestamp
    }
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      success: this.success,
      transactionId: this.transactionId,
      amount: this.amount ? this.amount.toJSON() : null,
      fees: this.fees ? {
        processing: this.fees.processing ? this.fees.processing.toJSON() : null,
        network: this.fees.network ? this.fees.network.toJSON() : null,
        total: this.fees.total ? this.fees.total.toJSON() : null
      } : null,
      status: this.status,
      provider: this.provider,
      paymentMethod: this.paymentMethod,
      processingTime: this.processingTime,
      confirmations: this.confirmations,
      receipt: this.receipt,
      metadata: this.metadata,
      error: this.error,
      timestamp: this.timestamp
    }
  }
}

export default PaymentResult