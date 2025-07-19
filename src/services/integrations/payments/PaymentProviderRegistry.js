/**
 * Payment Provider Registry
 * Manages all payment providers for on/off-ramp operations
 */

import { BaseProviderRegistry } from '../BaseProviderRegistry.js'
import { PaymentResult } from './PaymentResult.js'
import { PaymentError } from './PaymentError.js'
import { Money } from '../../../domains/shared/value-objects/Money.js'

export class PaymentProviderRegistry extends BaseProviderRegistry {
  constructor() {
    super('payment')
    this.routingRules = []
    this.feeCalculators = new Map()
    this.limitCheckers = new Map()
  }

  /**
   * Register a payment provider
   */
  register(providerId, provider, options = {}) {
    // Validate required methods
    const requiredMethods = ['processPayment', 'getPaymentMethods', 'calculateFees']
    for (const method of requiredMethods) {
      if (!provider[method] || typeof provider[method] !== 'function') {
        throw new Error(`Payment provider ${providerId} must implement ${method} method`)
      }
    }

    super.register(providerId, provider, options)

    // Register fee calculator if provided
    if (provider.calculateFees) {
      this.feeCalculators.set(providerId, provider.calculateFees.bind(provider))
    }

    // Register limit checker if provided
    if (provider.checkLimits) {
      this.limitCheckers.set(providerId, provider.checkLimits.bind(provider))
    }

    this.logger.info(`Payment provider registered: ${providerId}`)
  }

  /**
   * Process payment with automatic provider selection
   */
  async processPayment(paymentRequest, options = {}) {
    try {
      // Validate payment request
      this._validatePaymentRequest(paymentRequest)

      // Select optimal provider
      const selectedProvider = options.providerId || 
        await this._selectOptimalProvider(paymentRequest)

      if (!selectedProvider) {
        throw new PaymentError('No suitable payment provider available', null, paymentRequest)
      }

      // Check limits
      await this._checkPaymentLimits(selectedProvider, paymentRequest)

      // Calculate fees
      const fees = await this._calculateFees(selectedProvider, paymentRequest)
      paymentRequest.estimatedFees = fees

      // Process payment
      const provider = this.getProvider(selectedProvider)
      const result = await provider.processPayment(paymentRequest, options)

      this.logger.info(`Payment processed successfully`, {
        provider: selectedProvider,
        amount: paymentRequest.amount.toString(),
        type: paymentRequest.type
      })

      return new PaymentResult({
        ...result,
        provider: selectedProvider,
        fees: fees
      })

    } catch (error) {
      this.logger.error('Payment processing failed', error)
      throw new PaymentError(error.message, options.providerId, paymentRequest, error)
    }
  }

  /**
   * Process payment with fallback to alternative providers
   */
  async processPaymentWithFallback(paymentRequest, options = {}) {
    const suitableProviders = await this._getSuitableProviders(paymentRequest)
    
    if (suitableProviders.length === 0) {
      throw new PaymentError('No suitable payment providers available', null, paymentRequest)
    }

    const errors = []

    for (const providerId of suitableProviders) {
      try {
        const result = await this.processPayment(paymentRequest, {
          ...options,
          providerId
        })
        
        return result
      } catch (error) {
        errors.push({ providerId, error })
        this.logger.warn(`Payment provider ${providerId} failed, trying next provider`)
        continue
      }
    }

    // All providers failed
    throw new PaymentError('All payment providers failed', null, paymentRequest, errors)
  }

  /**
   * Get payment methods from all providers
   */
  async getAvailablePaymentMethods(filters = {}) {
    const allMethods = []

    for (const [providerId, provider] of this.providers) {
      if (!this.isProviderHealthy(providerId)) {
        continue
      }

      try {
        const methods = await provider.getPaymentMethods(filters)
        
        // Add provider info to each method
        const methodsWithProvider = methods.map(method => ({
          ...method,
          providerId,
          providerName: provider.name || providerId
        }))
        
        allMethods.push(...methodsWithProvider)
      } catch (error) {
        this.logger.warn(`Failed to get payment methods from ${providerId}`, error)
      }
    }

    return allMethods
  }

  /**
   * Calculate fees across providers
   */
  async calculateFeesAcrossProviders(paymentRequest) {
    const feeComparisons = []

    for (const [providerId, calculator] of this.feeCalculators) {
      if (!this.isProviderHealthy(providerId)) {
        continue
      }

      try {
        const fees = await calculator(paymentRequest)
        feeComparisons.push({
          providerId,
          fees,
          totalCost: paymentRequest.amount.add(fees.total)
        })
      } catch (error) {
        this.logger.warn(`Failed to calculate fees for ${providerId}`, error)
      }
    }

    // Sort by total cost
    return feeComparisons.sort((a, b) => 
      a.totalCost.amount - b.totalCost.amount
    )
  }

  /**
   * Get supported currencies across all providers
   */
  getSupportedCurrencies() {
    const currencies = new Set()

    for (const [providerId, provider] of this.providers) {
      if (provider.supportedCurrencies) {
        provider.supportedCurrencies.forEach(currency => 
          currencies.add(currency)
        )
      }
    }

    return Array.from(currencies)
  }

  /**
   * Get supported regions
   */
  getSupportedRegions() {
    const regions = new Set()

    for (const [providerId, provider] of this.providers) {
      if (provider.supportedRegions) {
        provider.supportedRegions.forEach(region => 
          regions.add(region)
        )
      }
    }

    return Array.from(regions)
  }

  /**
   * Add routing rule for provider selection
   */
  addRoutingRule(rule) {
    this.routingRules.push({
      ...rule,
      priority: rule.priority || 100,
      enabled: rule.enabled !== false
    })

    // Sort by priority (lower number = higher priority)
    this.routingRules.sort((a, b) => a.priority - b.priority)
  }

  /**
   * Remove routing rule
   */
  removeRoutingRule(ruleId) {
    this.routingRules = this.routingRules.filter(rule => rule.id !== ruleId)
  }

  /**
   * Validate payment request
   */
  _validatePaymentRequest(paymentRequest) {
    if (!paymentRequest.amount || !(paymentRequest.amount instanceof Money)) {
      throw new PaymentError('Invalid amount', null, paymentRequest)
    }

    if (!paymentRequest.type) {
      throw new PaymentError('Payment type is required', null, paymentRequest)
    }

    if (!['deposit', 'withdrawal', 'purchase', 'sale'].includes(paymentRequest.type)) {
      throw new PaymentError('Invalid payment type', null, paymentRequest)
    }

    if (!paymentRequest.paymentMethod) {
      throw new PaymentError('Payment method is required', null, paymentRequest)
    }
  }

  /**
   * Select optimal payment provider
   */
  async _selectOptimalProvider(paymentRequest) {
    // Apply routing rules
    for (const rule of this.routingRules) {
      if (!rule.enabled) continue

      if (await this._evaluateRoutingRule(rule, paymentRequest)) {
        const providerId = rule.provider
        if (this.providers.has(providerId) && this.isProviderHealthy(providerId)) {
          this.logger.info(`Provider selected by routing rule: ${providerId}`, {
            rule: rule.name || rule.id
          })
          return providerId
        }
      }
    }

    // Fallback to cost optimization
    const feeComparisons = await this.calculateFeesAcrossProviders(paymentRequest)
    
    if (feeComparisons.length > 0) {
      const cheapestProvider = feeComparisons[0]
      this.logger.info(`Provider selected by cost optimization: ${cheapestProvider.providerId}`)
      return cheapestProvider.providerId
    }

    // Last resort: first healthy provider
    const healthyProviders = this.getHealthyProviders()
    return healthyProviders.length > 0 ? healthyProviders[0].id : null
  }

  /**
   * Get providers suitable for payment request
   */
  async _getSuitableProviders(paymentRequest) {
    const suitableProviders = []

    for (const [providerId, provider] of this.providers) {
      if (!this.isProviderHealthy(providerId)) {
        continue
      }

      // Check if provider supports the currency
      if (provider.supportedCurrencies && 
          !provider.supportedCurrencies.includes(paymentRequest.amount.currency)) {
        continue
      }

      // Check if provider supports the payment method
      if (provider.supportedPaymentMethods && 
          !provider.supportedPaymentMethods.includes(paymentRequest.paymentMethod)) {
        continue
      }

      // Check amount limits
      try {
        if (provider.checkLimits) {
          const limitsOk = await provider.checkLimits(paymentRequest)
          if (!limitsOk) continue
        }
      } catch (error) {
        continue // Skip provider if limit check fails
      }

      suitableProviders.push(providerId)
    }

    return suitableProviders
  }

  /**
   * Evaluate routing rule
   */
  async _evaluateRoutingRule(rule, paymentRequest) {
    try {
      if (rule.condition) {
        // Simple condition evaluation
        if (typeof rule.condition === 'string') {
          return this._evaluateStringCondition(rule.condition, paymentRequest)
        } else if (typeof rule.condition === 'function') {
          return await rule.condition(paymentRequest)
        }
      }
      return false
    } catch (error) {
      this.logger.warn(`Routing rule evaluation failed: ${rule.id}`, error)
      return false
    }
  }

  /**
   * Evaluate string condition (simple implementation)
   */
  _evaluateStringCondition(condition, paymentRequest) {
    // Replace variables in condition string
    const context = {
      amount: paymentRequest.amount.amount,
      currency: paymentRequest.amount.currency,
      type: paymentRequest.type,
      paymentMethod: paymentRequest.paymentMethod,
      region: paymentRequest.region || 'US'
    }

    let evaluableCondition = condition
    for (const [key, value] of Object.entries(context)) {
      const regex = new RegExp(`\\b${key}\\b`, 'g')
      evaluableCondition = evaluableCondition.replace(regex, JSON.stringify(value))
    }

    // Simple evaluation (in production, use a safer expression evaluator)
    try {
      return Function(`"use strict"; return (${evaluableCondition})`)()
    } catch {
      return false
    }
  }

  /**
   * Check payment limits
   */
  async _checkPaymentLimits(providerId, paymentRequest) {
    const limitChecker = this.limitCheckers.get(providerId)
    if (limitChecker) {
      const limitsOk = await limitChecker(paymentRequest)
      if (!limitsOk) {
        throw new PaymentError(`Payment amount exceeds limits for provider ${providerId}`, providerId, paymentRequest)
      }
    }
  }

  /**
   * Calculate fees for payment
   */
  async _calculateFees(providerId, paymentRequest) {
    const feeCalculator = this.feeCalculators.get(providerId)
    if (feeCalculator) {
      return await feeCalculator(paymentRequest)
    }
    
    // Default no fees
    return {
      processing: Money.zero(paymentRequest.amount.currency),
      network: Money.zero(paymentRequest.amount.currency),
      total: Money.zero(paymentRequest.amount.currency)
    }
  }

  /**
   * Get payment statistics
   */
  getPaymentStats() {
    return {
      ...this.getAllStats(),
      routingRules: this.routingRules.length,
      supportedCurrencies: this.getSupportedCurrencies(),
      supportedRegions: this.getSupportedRegions()
    }
  }
}

export default PaymentProviderRegistry