/**
 * Money Value Object - Shared across all financial domains
 * Ensures consistent money handling across Traditional Finance, Crypto, and DeFi
 * Uses decimal.js for precise financial arithmetic - NO FLOATING POINT ERRORS
 */

import Decimal from 'decimal.js'

// Configure Decimal.js for financial precision
Decimal.set({
  precision: 28,          // 28 significant digits
  rounding: Decimal.ROUND_HALF_UP,  // Standard financial rounding
  toExpNeg: -18,         // Support for very small crypto amounts
  toExpPos: 18,          // Support for very large amounts
  maxE: 9e15,            // Maximum exponent
  minE: -9e15,           // Minimum exponent
  modulo: Decimal.ROUND_DOWN  // For division remainders
})

export class Money {
  constructor(amount, currency) {
    this.validateAmount(amount)
    this.validateCurrency(currency)
    
    // Store as Decimal for precise arithmetic
    this._amount = new Decimal(amount)
    this._currency = currency.toUpperCase()
    
    // Normalize to proper precision for the currency
    this._amount = this.normalizeToDecimalPlaces(this._amount)
    
    // Make immutable
    Object.freeze(this)
  }

  get amount() {
    return this._amount.toNumber() // Convert back to number for compatibility
  }

  get amountDecimal() {
    return this._amount // Direct access to Decimal for precise calculations
  }

  get currency() {
    return this._currency
  }

  /**
   * Add money of same currency - PRECISE arithmetic with decimal.js
   */
  add(other) {
    this.ensureSameCurrency(other)
    const result = this._amount.plus(other._amount)
    return new Money(result.toString(), this._currency)
  }

  /**
   * Subtract money of same currency - PRECISE arithmetic with decimal.js
   */
  subtract(other) {
    this.ensureSameCurrency(other)
    const result = this._amount.minus(other._amount)
    if (result.lessThan(0) && this.isTraditionalCurrency()) {
      throw new Error('Insufficient funds for traditional currency')
    }
    return new Money(result.toString(), this._currency)
  }

  /**
   * Multiply by a factor - PRECISE arithmetic with decimal.js
   */
  multiply(factor) {
    const decimalFactor = new Decimal(factor)
    if (decimalFactor.lessThan(0)) {
      throw new Error('Factor must be a non-negative number')
    }
    const result = this._amount.times(decimalFactor)
    return new Money(result.toString(), this._currency)
  }

  /**
   * Divide by a factor - PRECISE arithmetic with decimal.js
   */
  divide(factor) {
    const decimalFactor = new Decimal(factor)
    if (decimalFactor.lessThanOrEqualTo(0)) {
      throw new Error('Factor must be a positive number')
    }
    const result = this._amount.dividedBy(decimalFactor)
    return new Money(result.toString(), this._currency)
  }

  /**
   * Check if amount is positive - PRECISE comparison with decimal.js
   */
  isPositive() {
    return this._amount.greaterThan(0)
  }

  /**
   * Check if amount is zero - PRECISE comparison with decimal.js
   */
  isZero() {
    return this._amount.equals(0)
  }

  /**
   * Compare with another Money object - PRECISE comparison with decimal.js
   */
  equals(other) {
    return other instanceof Money && 
           this._amount.equals(other._amount) && 
           this._currency === other._currency
  }

  /**
   * Check if this amount is greater than another - PRECISE comparison with decimal.js
   */
  greaterThan(other) {
    this.ensureSameCurrency(other)
    return this._amount.greaterThan(other._amount)
  }

  /**
   * Check if this amount is less than another - PRECISE comparison with decimal.js
   */
  lessThan(other) {
    this.ensureSameCurrency(other)
    return this._amount.lessThan(other._amount)
  }

  /**
   * Check if this amount is greater than or equal to another
   */
  greaterThanOrEqualTo(other) {
    this.ensureSameCurrency(other)
    return this._amount.greaterThanOrEqualTo(other._amount)
  }

  /**
   * Check if this amount is less than or equal to another
   */
  lessThanOrEqualTo(other) {
    this.ensureSameCurrency(other)
    return this._amount.lessThanOrEqualTo(other._amount)
  }

  /**
   * Format for display
   */
  format() {
    if (this.isCryptoCurrency()) {
      return this.formatCrypto()
    }
    return this.formatFiat()
  }

  /**
   * Convert to different currency (would integrate with exchange rates) - PRECISE with decimal.js
   */
  async convertTo(targetCurrency, exchangeRateService) {
    if (this._currency === targetCurrency) {
      return this
    }
    
    const rate = await exchangeRateService.getRate(this._currency, targetCurrency)
    const rateDecimal = new Decimal(rate)
    const convertedAmount = this._amount.times(rateDecimal)
    return new Money(convertedAmount.toString(), targetCurrency)
  }

  /**
   * Domain-specific methods
   */
  
  isTraditionalCurrency() {
    return ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD'].includes(this._currency)
  }

  isCryptoCurrency() {
    return ['BTC', 'ETH', 'USDC', 'USDT', 'DAI', 'WETH', 'MATIC'].includes(this._currency)
  }

  isStableCoin() {
    return ['USDC', 'USDT', 'DAI', 'BUSD'].includes(this._currency)
  }

  /**
   * Get precision for different asset types
   */
  getPrecision() {
    if (this.isTraditionalCurrency()) {
      return 2 // 2 decimal places for fiat
    }
    if (this._currency === 'BTC') {
      return 8 // 8 decimal places for Bitcoin
    }
    if (this._currency === 'ETH') {
      return 18 // 18 decimal places for Ethereum
    }
    return 6 // Default for other crypto
  }

  /**
   * Private methods
   */
  
  validateAmount(amount) {
    // Accept number, string, or Decimal
    let decimalAmount
    try {
      decimalAmount = new Decimal(amount)
    } catch (_) {
      throw new Error('Amount must be a valid number, string, or Decimal')
    }
    
    if (!decimalAmount.isFinite()) {
      throw new Error('Amount must be finite')
    }
    
    // SECURITY: Prevent extremely large numbers that could cause overflow
    const MAX_SAFE_AMOUNT = new Decimal('1e15') // 1 quadrillion max
    if (decimalAmount.abs().greaterThan(MAX_SAFE_AMOUNT)) {
      throw new Error(`Amount exceeds maximum safe value: ${MAX_SAFE_AMOUNT.toString()}`)
    }
    
    // SECURITY: Prevent precision attacks with tiny amounts
    const MIN_AMOUNT = new Decimal('1e-18') // Smallest meaningful amount (18 decimals for ETH)
    if (!decimalAmount.equals(0) && decimalAmount.abs().lessThan(MIN_AMOUNT)) {
      throw new Error(`Amount too small: minimum ${MIN_AMOUNT.toString()}`)
    }
  }

  validateCurrency(currency) {
    if (typeof currency !== 'string' || currency.length === 0) {
      throw new Error('Currency must be a non-empty string')
    }
    
    // SECURITY: Validate currency format and prevent injection
    if (!/^[A-Z]{2,10}$/.test(currency.toUpperCase())) {
      throw new Error('Currency must be 2-10 uppercase letters')
    }
    
    // SECURITY: Whitelist of supported currencies to prevent unknown currency attacks
    const SUPPORTED_CURRENCIES = [
      'USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD', 'CNY',
      'BTC', 'ETH', 'USDC', 'USDT', 'DAI', 'WETH', 'MATIC', 'SOL',
      'BUSD', 'SHIB', 'DOGE', 'ADA', 'DOT', 'AVAX', 'UNI'
    ]
    
    if (!SUPPORTED_CURRENCIES.includes(currency.toUpperCase())) {
      throw new Error(`Unsupported currency: ${currency}. Supported: ${SUPPORTED_CURRENCIES.join(', ')}`)
    }
  }

  normalizeToDecimalPlaces(decimalAmount) {
    // Round to appropriate precision for the currency using decimal.js
    const precision = this.getPrecisionForCurrency(this._currency)
    
    // SPECIAL HANDLING FOR FEES: Don't round very small amounts to zero
    // This preserves precision for fee calculations while maintaining display formatting
    const normalized = decimalAmount.toDecimalPlaces(precision, Decimal.ROUND_HALF_UP)
    
    // If the normalized amount becomes zero but original was not zero,
    // preserve at least the minimum precision needed
    if (normalized.equals(0) && !decimalAmount.equals(0)) {
      // For traditional currencies, preserve up to 6 decimal places for fees
      const traditionalCurrencies = ['USD', 'EUR', 'GBP', 'JPY', 'CHF', 'CAD', 'AUD']
      if (traditionalCurrencies.includes(this._currency)) {
        return decimalAmount.toDecimalPlaces(6, Decimal.ROUND_HALF_UP)
      }
    }
    
    return normalized
  }

  getPrecisionForCurrency(currency) {
    const upperCurrency = currency.toUpperCase()
    if (['USD', 'EUR', 'GBP'].includes(upperCurrency)) return 2
    if (upperCurrency === 'BTC') return 8
    if (upperCurrency === 'ETH') return 18
    return 6
  }

  ensureSameCurrency(other) {
    if (!(other instanceof Money)) {
      throw new Error('Can only operate with other Money objects')
    }
    if (this._currency !== other._currency) {
      throw new Error(`Currency mismatch: ${this._currency} vs ${other._currency}`)
    }
  }

  formatFiat() {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: this._currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(this._amount)
  }

  formatCrypto() {
    const precision = this.getPrecision()
    return `${this._amount.toFixed(precision)} ${this._currency}`
  }

  /**
   * Serialization for persistence - Store as string to preserve precision
   */
  toJSON() {
    return {
      amount: this._amount.toString(), // Store as string to preserve full precision
      currency: this._currency
    }
  }

  static fromJSON(data) {
    return new Money(data.amount, data.currency)
  }

  /**
   * Factory methods for common scenarios
   */
  
  static zero(currency) {
    return new Money(0, currency)
  }

  static usd(amount) {
    return new Money(amount, 'USD')
  }

  static btc(amount) {
    return new Money(amount, 'BTC')
  }

  static eth(amount) {
    return new Money(amount, 'ETH')
  }

  /**
   * Domain-specific business rules
   */
  
  /**
   * Check if amount meets minimum transfer requirements - PRECISE with decimal.js
   */
  meetsMinimumTransfer() {
    if (this.isTraditionalCurrency()) {
      return this._amount.greaterThanOrEqualTo(new Decimal('1.00')) // $1 minimum for traditional transfers
    }
    if (this._currency === 'BTC') {
      return this._amount.greaterThanOrEqualTo(new Decimal('0.00001')) // 1,000 satoshis minimum
    }
    if (this._currency === 'ETH') {
      return this._amount.greaterThanOrEqualTo(new Decimal('0.001')) // 0.001 ETH minimum
    }
    return this._amount.greaterThan(0)
  }

  /**
   * Check if amount requires additional verification - PRECISE with decimal.js
   */
  requiresAdditionalVerification() {
    if (this.isTraditionalCurrency()) {
      return this._amount.greaterThanOrEqualTo(new Decimal('10000')) // $10k+ requires additional KYC
    }
    if (this.isCryptoCurrency()) {
      return this._amount.greaterThanOrEqualTo(new Decimal('50000')) // Crypto equivalent threshold
    }
    return false
  }

  /**
   * Calculate network fees for crypto transfers
   */
  estimateNetworkFee(network = 'ethereum', priority = 'standard') {
    if (!this.isCryptoCurrency()) {
      return Money.zero('USD') // No network fees for traditional transfers
    }

    // This would integrate with real fee estimation services
    const baseFees = {
      ethereum: { standard: 0.003, fast: 0.005, instant: 0.008 },
      polygon: { standard: 0.001, fast: 0.002, instant: 0.003 },
      bitcoin: { standard: 0.0001, fast: 0.0002, instant: 0.0003 }
    }

    const feeAmount = baseFees[network]?.[priority] || 0.001
    return new Money(feeAmount, this._currency)
  }
}

export default Money