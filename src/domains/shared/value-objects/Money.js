/**
 * Money Value Object - Shared across all financial domains
 * Ensures consistent money handling across Traditional Finance, Crypto, and DeFi
 */

export class Money {
  constructor(amount, currency) {
    this.validateAmount(amount)
    this.validateCurrency(currency)
    
    this._amount = this.normalizeAmount(amount)
    this._currency = currency.toUpperCase()
    
    // Make immutable
    Object.freeze(this)
  }

  get amount() {
    return this._amount
  }

  get currency() {
    return this._currency
  }

  /**
   * Add money of same currency
   */
  add(other) {
    this.ensureSameCurrency(other)
    return new Money(this._amount + other._amount, this._currency)
  }

  /**
   * Subtract money of same currency
   */
  subtract(other) {
    this.ensureSameCurrency(other)
    const result = this._amount - other._amount
    if (result < 0 && this.isTraditionalCurrency()) {
      throw new Error('Insufficient funds for traditional currency')
    }
    return new Money(result, this._currency)
  }

  /**
   * Multiply by a factor
   */
  multiply(factor) {
    if (typeof factor !== 'number' || factor < 0) {
      throw new Error('Factor must be a non-negative number')
    }
    return new Money(this._amount * factor, this._currency)
  }

  /**
   * Divide by a factor
   */
  divide(factor) {
    if (typeof factor !== 'number' || factor <= 0) {
      throw new Error('Factor must be a positive number')
    }
    return new Money(this._amount / factor, this._currency)
  }

  /**
   * Check if amount is positive
   */
  isPositive() {
    return this._amount > 0
  }

  /**
   * Check if amount is zero
   */
  isZero() {
    return this._amount === 0
  }

  /**
   * Compare with another Money object
   */
  equals(other) {
    return other instanceof Money && 
           this._amount === other._amount && 
           this._currency === other._currency
  }

  /**
   * Check if this amount is greater than another
   */
  greaterThan(other) {
    this.ensureSameCurrency(other)
    return this._amount > other._amount
  }

  /**
   * Check if this amount is less than another
   */
  lessThan(other) {
    this.ensureSameCurrency(other)
    return this._amount < other._amount
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
   * Convert to different currency (would integrate with exchange rates)
   */
  async convertTo(targetCurrency, exchangeRateService) {
    if (this._currency === targetCurrency) {
      return this
    }
    
    const rate = await exchangeRateService.getRate(this._currency, targetCurrency)
    return new Money(this._amount * rate, targetCurrency)
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
    if (typeof amount !== 'number' || isNaN(amount)) {
      throw new Error('Amount must be a valid number')
    }
    if (!isFinite(amount)) {
      throw new Error('Amount must be finite')
    }
  }

  validateCurrency(currency) {
    if (typeof currency !== 'string' || currency.length === 0) {
      throw new Error('Currency must be a non-empty string')
    }
  }

  normalizeAmount(amount) {
    // Round to appropriate precision to avoid floating point issues
    const precision = this.getPrecisionForCurrency(this._currency)
    return Math.round(amount * Math.pow(10, precision)) / Math.pow(10, precision)
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
   * Serialization for persistence
   */
  toJSON() {
    return {
      amount: this._amount,
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
   * Check if amount meets minimum transfer requirements
   */
  meetsMinimumTransfer() {
    if (this.isTraditionalCurrency()) {
      return this._amount >= 1.00 // $1 minimum for traditional transfers
    }
    if (this._currency === 'BTC') {
      return this._amount >= 0.00001 // 1,000 satoshis minimum
    }
    if (this._currency === 'ETH') {
      return this._amount >= 0.001 // 0.001 ETH minimum
    }
    return this._amount > 0
  }

  /**
   * Check if amount requires additional verification
   */
  requiresAdditionalVerification() {
    if (this.isTraditionalCurrency()) {
      return this._amount >= 10000 // $10k+ requires additional KYC
    }
    if (this.isCryptoCurrency()) {
      return this._amount >= 50000 // Crypto equivalent threshold
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