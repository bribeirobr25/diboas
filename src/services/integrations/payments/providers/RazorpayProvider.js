/**
 * Razorpay Payment Provider
 * Handles payments through Razorpay's payment gateway
 * Supports international payments, UPI, cards, and more
 */

import { PaymentResult } from '../PaymentResult.js'
import { PaymentError } from '../PaymentError.js'
import secureLogger from '../../../../utils/secureLogger.js'

export class RazorpayProvider {
  constructor(config = {}) {
    this.keyId = config.keyId
    this.keySecret = config.keySecret
    this.baseUrl = config.baseUrl || 'https://api.razorpay.com/v1'
    this.timeout = config.timeout || 30000
    this.currency = config.defaultCurrency || 'INR'
    this.webhookSecret = config.webhookSecret
    
    if (!this.keyId || !this.keySecret) {
      throw new Error('Razorpay key ID and secret are required')
    }
    
    // Create basic auth header
    this.authHeader = 'Basic ' + Buffer.from(`${this.keyId}:${this.keySecret}`).toString('base64')
  }

  /**
   * Health check for Razorpay API
   */
  async healthCheck() {
    try {
      // Test API connectivity by fetching account details
      const response = await this.makeRequest('GET', '/accounts')
      
      return {
        healthy: response.status === 200,
        responseTime: Date.now() - this.lastRequestTime,
        provider: 'razorpay'
      }
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        provider: 'razorpay'
      }
    }
  }

  /**
   * Create a payment order
   */
  async createPayment(paymentData) {
    try {
      const orderData = {
        amount: Math.round(paymentData.amount * 100), // Convert to paise
        currency: paymentData.currency || this.currency,
        receipt: paymentData.orderId || `order_${Date.now()}`,
        notes: {
          customer_id: paymentData.customerId,
          description: paymentData.description || 'diBoaS payment'
        }
      }

      const response = await this.makeRequest('POST', '/orders', orderData)
      
      if (response.data.id) {
        secureLogger.audit('RAZORPAY_ORDER_CREATED', {
          orderId: response.data.id,
          amount: paymentData.amount,
          currency: paymentData.currency
        })

        return new PaymentResult({
          success: true,
          transactionId: response.data.id,
          orderId: response.data.receipt,
          amount: paymentData.amount,
          currency: response.data.currency,
          status: 'created',
          provider: 'razorpay',
          metadata: {
            razorpayOrderId: response.data.id,
            createdAt: response.data.created_at,
            status: response.data.status
          }
        })
      }

      throw new Error('Failed to create Razorpay order')

    } catch (error) {
      secureLogger.audit('RAZORPAY_ORDER_ERROR', {
        error: error.message,
        paymentData: { ...paymentData, cardNumber: '[REDACTED]' }
      })

      return new PaymentResult({
        success: false,
        error: new PaymentError(
          'PAYMENT_CREATION_FAILED',
          `Razorpay order creation failed: ${error.message}`,
          'razorpay'
        )
      })
    }
  }

  /**
   * Process a payment (capture)
   */
  async processPayment(paymentData) {
    try {
      // First create an order
      const orderResult = await this.createPayment(paymentData)
      
      if (!orderResult.success) {
        return orderResult
      }

      // For direct capture (when payment is already authorized)
      if (paymentData.paymentId) {
        const captureData = {
          amount: Math.round(paymentData.amount * 100),
          currency: paymentData.currency || this.currency
        }

        const response = await this.makeRequest(
          'POST', 
          `/payments/${paymentData.paymentId}/capture`, 
          captureData
        )

        if (response.data.status === 'captured') {
          return new PaymentResult({
            success: true,
            transactionId: response.data.id,
            orderId: paymentData.orderId,
            amount: response.data.amount / 100,
            currency: response.data.currency,
            status: 'completed',
            provider: 'razorpay',
            metadata: {
              capturedAt: response.data.captured_at,
              method: response.data.method,
              bank: response.data.bank,
              wallet: response.data.wallet
            }
          })
        }
      }

      // Return the order for frontend processing
      return orderResult

    } catch (error) {
      secureLogger.audit('RAZORPAY_PROCESS_ERROR', {
        error: error.message,
        paymentId: paymentData.paymentId
      })

      return new PaymentResult({
        success: false,
        error: new PaymentError(
          'PAYMENT_PROCESSING_FAILED',
          `Razorpay payment processing failed: ${error.message}`,
          'razorpay'
        )
      })
    }
  }

  /**
   * Refund a payment
   */
  async refundPayment(refundData) {
    try {
      const refundPayload = {
        amount: Math.round(refundData.amount * 100), // Convert to paise
        speed: refundData.speed || 'normal', // normal or optimum
        notes: {
          reason: refundData.reason || 'Customer request',
          refund_id: refundData.refundId || `refund_${Date.now()}`
        }
      }

      const response = await this.makeRequest(
        'POST', 
        `/payments/${refundData.paymentId}/refund`, 
        refundPayload
      )

      if (response.data.id) {
        secureLogger.audit('RAZORPAY_REFUND_CREATED', {
          refundId: response.data.id,
          paymentId: refundData.paymentId,
          amount: refundData.amount
        })

        return new PaymentResult({
          success: true,
          transactionId: response.data.id,
          refundId: response.data.id,
          amount: response.data.amount / 100,
          currency: response.data.currency,
          status: response.data.status,
          provider: 'razorpay',
          metadata: {
            speed: response.data.speed,
            createdAt: response.data.created_at
          }
        })
      }

      throw new Error('Failed to create Razorpay refund')

    } catch (error) {
      secureLogger.audit('RAZORPAY_REFUND_ERROR', {
        error: error.message,
        paymentId: refundData.paymentId,
        amount: refundData.amount
      })

      return new PaymentResult({
        success: false,
        error: new PaymentError(
          'REFUND_FAILED',
          `Razorpay refund failed: ${error.message}`,
          'razorpay'
        )
      })
    }
  }

  /**
   * Get payment status
   */
  async getPaymentStatus(paymentId) {
    try {
      const response = await this.makeRequest('GET', `/payments/${paymentId}`)
      
      if (response.data) {
        const payment = response.data
        return new PaymentResult({
          success: true,
          transactionId: payment.id,
          amount: payment.amount / 100,
          currency: payment.currency,
          status: this.mapRazorpayStatus(payment.status),
          provider: 'razorpay',
          metadata: {
            method: payment.method,
            createdAt: payment.created_at,
            capturedAt: payment.captured_at,
            bank: payment.bank,
            wallet: payment.wallet,
            vpa: payment.vpa
          }
        })
      }

      throw new Error('Payment not found')

    } catch (error) {
      return new PaymentResult({
        success: false,
        error: new PaymentError(
          'PAYMENT_STATUS_ERROR',
          `Failed to get payment status: ${error.message}`,
          'razorpay'
        )
      })
    }
  }

  /**
   * Create a customer
   */
  async createCustomer(customerData) {
    try {
      const customerPayload = {
        name: customerData.name,
        email: customerData.email,
        contact: customerData.phone,
        notes: customerData.notes || {}
      }

      const response = await this.makeRequest('POST', '/customers', customerPayload)
      
      if (response.data.id) {
        return {
          success: true,
          customerId: response.data.id,
          provider: 'razorpay'
        }
      }

      throw new Error('Failed to create customer')

    } catch (error) {
      secureLogger.audit('RAZORPAY_CUSTOMER_ERROR', {
        error: error.message,
        email: customerData.email
      })

      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Create a subscription
   */
  async createSubscription(subscriptionData) {
    try {
      // First create a plan if it doesn't exist
      const planData = {
        period: subscriptionData.period || 'monthly',
        interval: subscriptionData.interval || 1,
        item: {
          name: subscriptionData.planName,
          amount: Math.round(subscriptionData.amount * 100),
          currency: subscriptionData.currency || this.currency,
          description: subscriptionData.description
        }
      }

      const planResponse = await this.makeRequest('POST', '/plans', planData)
      
      if (!planResponse.data.id) {
        throw new Error('Failed to create subscription plan')
      }

      // Create the subscription
      const subscriptionPayload = {
        plan_id: planResponse.data.id,
        customer_id: subscriptionData.customerId,
        total_count: subscriptionData.totalCount || 12,
        start_at: subscriptionData.startAt ? Math.floor(new Date(subscriptionData.startAt).getTime() / 1000) : undefined,
        notes: subscriptionData.notes || {}
      }

      const response = await this.makeRequest('POST', '/subscriptions', subscriptionPayload)
      
      if (response.data.id) {
        return {
          success: true,
          subscriptionId: response.data.id,
          planId: planResponse.data.id,
          status: response.data.status,
          provider: 'razorpay'
        }
      }

      throw new Error('Failed to create subscription')

    } catch (error) {
      secureLogger.audit('RAZORPAY_SUBSCRIPTION_ERROR', {
        error: error.message,
        customerId: subscriptionData.customerId
      })

      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Verify webhook signature
   */
  verifyWebhookSignature(payload, signature) {
    if (!this.webhookSecret) {
      throw new Error('Webhook secret not configured')
    }

    const crypto = require('crypto')
    const expectedSignature = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(payload)
      .digest('hex')

    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    )
  }

  /**
   * Handle webhook events
   */
  async handleWebhook(payload, signature) {
    try {
      if (!this.verifyWebhookSignature(payload, signature)) {
        throw new Error('Invalid webhook signature')
      }

      const event = JSON.parse(payload)
      
      secureLogger.audit('RAZORPAY_WEBHOOK_RECEIVED', {
        event: event.event,
        paymentId: event.payload?.payment?.entity?.id
      })

      switch (event.event) {
        case 'payment.captured':
          await this.handlePaymentCaptured(event.payload.payment.entity)
          break
        case 'payment.failed':
          await this.handlePaymentFailed(event.payload.payment.entity)
          break
        case 'refund.processed':
          await this.handleRefundProcessed(event.payload.refund.entity)
          break
        case 'subscription.charged':
          await this.handleSubscriptionCharged(event.payload.subscription.entity)
          break
        default:
          secureLogger.audit('RAZORPAY_WEBHOOK_UNHANDLED', {
            event: event.event
          })
      }

      return { success: true }

    } catch (error) {
      secureLogger.audit('RAZORPAY_WEBHOOK_ERROR', {
        error: error.message
      })
      return { success: false, error: error.message }
    }
  }

  /**
   * Make authenticated API request
   */
  async makeRequest(method, endpoint, data = null) {
    try {
      const url = `${this.baseUrl}${endpoint}`
      const options = {
        method: method,
        headers: {
          'Authorization': this.authHeader,
          'Content-Type': 'application/json',
          'User-Agent': 'diBoaS/1.0'
        },
        signal: AbortSignal.timeout(this.timeout)
      }

      if (data && (method === 'POST' || method === 'PUT' || method === 'PATCH')) {
        options.body = JSON.stringify(data)
      }

      this.lastRequestTime = Date.now()
      
      const response = await fetch(url, options)
      const responseData = await response.json()

      if (!response.ok) {
        const errorMessage = responseData.error?.description || responseData.message || 'Unknown error'
        throw new Error(`Razorpay API error: ${response.status} - ${errorMessage}`)
      }

      return {
        status: response.status,
        data: responseData
      }

    } catch (error) {
      secureLogger.audit('RAZORPAY_REQUEST_ERROR', {
        method,
        endpoint,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Map Razorpay status to standard status
   */
  mapRazorpayStatus(razorpayStatus) {
    const statusMap = {
      'created': 'pending',
      'authorized': 'authorized',
      'captured': 'completed',
      'refunded': 'refunded',
      'failed': 'failed'
    }
    
    return statusMap[razorpayStatus] || razorpayStatus
  }

  /**
   * Webhook event handlers
   */
  async handlePaymentCaptured(payment) {
    // Implementation for payment captured event
    secureLogger.audit('RAZORPAY_PAYMENT_CAPTURED', {
      paymentId: payment.id,
      amount: payment.amount / 100,
      currency: payment.currency
    })
  }

  async handlePaymentFailed(payment) {
    // Implementation for payment failed event
    secureLogger.audit('RAZORPAY_PAYMENT_FAILED', {
      paymentId: payment.id,
      errorCode: payment.error_code,
      errorDescription: payment.error_description
    })
  }

  async handleRefundProcessed(refund) {
    // Implementation for refund processed event
    secureLogger.audit('RAZORPAY_REFUND_PROCESSED', {
      refundId: refund.id,
      paymentId: refund.payment_id,
      amount: refund.amount / 100
    })
  }

  async handleSubscriptionCharged(subscription) {
    // Implementation for subscription charged event
    secureLogger.audit('RAZORPAY_SUBSCRIPTION_CHARGED', {
      subscriptionId: subscription.id,
      amount: subscription.current_end / 100
    })
  }

  /**
   * Get provider capabilities
   */
  getCapabilities() {
    return {
      payments: true,
      refunds: true,
      subscriptions: true,
      customers: true,
      webhooks: true,
      methods: ['card', 'upi', 'netbanking', 'wallet', 'emi'],
      currencies: ['INR', 'USD', 'EUR', 'GBP', 'AUD', 'CAD'],
      regions: ['IN', 'Global'],
      provider: 'razorpay'
    }
  }
}

export default RazorpayProvider