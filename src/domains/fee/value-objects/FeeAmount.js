/**
 * Fee Amount Value Object
 * Represents a specific fee amount with proper precision and validation
 * Part of the Fee domain in DDD architecture
 */

import { Money } from '../../shared/value-objects/Money.js'
import { ValueObject } from '../../shared/ValueObject.js'

export class FeeAmount extends ValueObject {
  constructor(amount, currency, feeType, description = '') {
    super()
    
    this.validateFeeType(feeType)
    this.validateAmount(amount)
    
    this._amount = amount instanceof Money ? amount : new Money(amount, currency)
    this._feeType = feeType
    this._description = description
    this._calculatedAt = new Date().toISOString()
    
    // Make immutable
    Object.freeze(this)
  }

  get amount() {
    return this._amount
  }

  get feeType() {
    return this._feeType
  }

  get description() {
    return this._description
  }

  get calculatedAt() {
    return this._calculatedAt
  }

  /**
   * Check if this is a network fee
   */
  isNetworkFee() {
    return this._feeType === FeeType.NETWORK
  }

  /**
   * Check if this is a platform fee
   */
  isPlatformFee() {
    return this._feeType === FeeType.PLATFORM
  }

  /**
   * Check if this is a provider fee
   */
  isProviderFee() {
    return this._feeType === FeeType.PROVIDER
  }

  /**
   * Check if this is a DEX fee
   */
  isDexFee() {
    return this._feeType === FeeType.DEX
  }

  /**
   * Check if this is a DeFi fee
   */
  isDefiFee() {
    return this._feeType === FeeType.DEFI
  }

  /**
   * Apply percentage-based calculation
   */
  applyPercentage(rate) {
    if (typeof rate !== 'number' || rate < 0) {
      throw new Error('Fee rate must be a non-negative number')
    }
    
    const calculatedAmount = this._amount.multiply(rate)
    return new FeeAmount(calculatedAmount, calculatedAmount.currency, this._feeType, this._description)
  }

  /**
   * Add minimum fee constraint
   */
  applyMinimum(minimumAmount) {
    const minimum = minimumAmount instanceof Money ? minimumAmount : new Money(minimumAmount, this._amount.currency)
    
    if (this._amount.lessThan(minimum)) {
      return new FeeAmount(minimum, minimum.currency, this._feeType, `${this._description} (minimum applied)`)
    }
    
    return this
  }

  /**
   * Add maximum fee constraint
   */
  applyMaximum(maximumAmount) {
    const maximum = maximumAmount instanceof Money ? maximumAmount : new Money(maximumAmount, this._amount.currency)
    
    if (this._amount.greaterThan(maximum)) {
      return new FeeAmount(maximum, maximum.currency, this._feeType, `${this._description} (maximum applied)`)
    }
    
    return this
  }

  /**
   * Combine with another fee amount (same type only)
   */
  add(other) {
    if (!(other instanceof FeeAmount)) {
      throw new Error('Can only add other FeeAmount objects')
    }
    
    if (this._feeType !== other._feeType) {
      throw new Error(`Cannot combine different fee types: ${this._feeType} vs ${other._feeType}`)
    }
    
    const combinedAmount = this._amount.add(other._amount)
    return new FeeAmount(
      combinedAmount, 
      combinedAmount.currency, 
      this._feeType, 
      `${this._description} + ${other._description}`
    )
  }

  /**
   * Check if this fee is zero
   */
  isZero() {
    return this._amount.isZero()
  }

  /**
   * Check if this fee is positive
   */
  isPositive() {
    return this._amount.isPositive()
  }

  /**
   * Format for display
   */
  format() {
    return `${this._amount.format()} (${this._feeType})`
  }

  /**
   * Validation methods
   */
  validateFeeType(feeType) {
    if (!Object.values(FeeType).includes(feeType)) {
      throw new Error(`Invalid fee type: ${feeType}. Must be one of: ${Object.values(FeeType).join(', ')}`)
    }
  }

  validateAmount(amount) {
    // Allow zero fees but not negative fees
    const money = amount instanceof Money ? amount : new Money(amount, 'USD')
    if (money.amount < 0) {
      throw new Error('Fee amount cannot be negative')
    }
  }

  /**
   * Value object equality
   */
  equals(other) {
    return other instanceof FeeAmount &&
           this._amount.equals(other._amount) &&
           this._feeType === other._feeType
  }

  /**
   * Serialization
   */
  toJSON() {
    return {
      amount: this._amount.toJSON(),
      feeType: this._feeType,
      description: this._description,
      calculatedAt: this._calculatedAt
    }
  }

  static fromJSON(data) {
    const amount = Money.fromJSON(data.amount)
    return new FeeAmount(amount, amount.currency, data.feeType, data.description)
  }

  /**
   * Factory methods
   */
  static zero(currency, feeType) {
    return new FeeAmount(Money.zero(currency), currency, feeType, 'Zero fee')
  }

  static networkFee(amount, currency, description = 'Network fee') {
    return new FeeAmount(amount, currency, FeeType.NETWORK, description)
  }

  static platformFee(amount, currency, description = 'Platform fee') {
    return new FeeAmount(amount, currency, FeeType.PLATFORM, description)
  }

  static providerFee(amount, currency, description = 'Provider fee') {
    return new FeeAmount(amount, currency, FeeType.PROVIDER, description)
  }

  static dexFee(amount, currency, description = 'DEX fee') {
    return new FeeAmount(amount, currency, FeeType.DEX, description)
  }

  static defiFee(amount, currency, description = 'DeFi fee') {
    return new FeeAmount(amount, currency, FeeType.DEFI, description)
  }
}

/**
 * Fee Type Enumeration
 */
export const FeeType = {
  NETWORK: 'network',
  PLATFORM: 'platform', // diBoaS fees
  PROVIDER: 'provider',  // Payment provider fees
  DEX: 'dex',           // Decentralized exchange fees
  DEFI: 'defi',         // DeFi protocol fees
  ROUTING: 'routing'    // Cross-chain routing fees
}

export default FeeAmount