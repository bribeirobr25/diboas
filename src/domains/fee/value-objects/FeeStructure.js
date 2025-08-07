/**
 * Fee Structure Value Object
 * Represents a complete fee breakdown for a transaction
 * Part of the Fee domain in DDD architecture
 */

import { ValueObject } from '../../shared/ValueObject.js'
import { Money } from '../../shared/value-objects/Money.js'
import { FeeAmount, FeeType } from './FeeAmount.js'

export class FeeStructure extends ValueObject {
  constructor(fees = {}, currency = null) {
    super()
    
    this._fees = new Map()
    this._currency = currency
    this._calculatedAt = new Date().toISOString()
    
    // Initialize fees
    if (Array.isArray(fees) && fees.length > 0) {
      this.addFees(fees)
    } else if (fees && typeof fees === 'object' && Object.keys(fees).length > 0) {
      this.addFees(fees)
    }
    
    // Set default currency if none provided
    if (this._currency === null && this._fees.size === 0) {
      this._currency = 'USD'
    }
    
    // Make immutable
    Object.freeze(this)
  }

  /**
   * Add multiple fees
   */
  addFees(fees) {
    if (fees instanceof Array) {
      // Array of FeeAmount objects
      for (const fee of fees) {
        if (fee instanceof FeeAmount) {
          this.addFee(fee)
        }
      }
    } else if (fees instanceof Object) {
      // Object with fee types as keys
      for (const [type, amount] of Object.entries(fees)) {
        if (amount instanceof FeeAmount) {
          this.addFee(amount)
        } else if (typeof amount === 'number' && amount > 0) {
          const currency = this._currency || 'USD'
          this.addFee(new FeeAmount(amount, currency, type))
        }
      }
    }
  }

  /**
   * Add a single fee
   */
  addFee(fee) {
    if (!(fee instanceof FeeAmount)) {
      throw new Error('Fee must be a FeeAmount instance')
    }

    // Only add non-zero fees
    if (fee.isZero()) {
      return
    }

    // Ensure all fees use the same currency
    if (this._currency === null) {
      this._currency = fee.amount.currency
    } else if (this._currency !== fee.amount.currency) {
      throw new Error(`Currency mismatch: expected ${this._currency}, got ${fee.amount.currency}`)
    }

    // Combine fees of the same type
    const existingFee = this._fees.get(fee.feeType)
    if (existingFee) {
      this._fees.set(fee.feeType, existingFee.add(fee))
    } else {
      this._fees.set(fee.feeType, fee)
    }
  }

  /**
   * Get fee by type
   */
  getFee(feeType) {
    return this._fees.get(feeType) || FeeAmount.zero(this._currency || 'USD', feeType)
  }

  /**
   * Get all fees
   */
  getAllFees() {
    return Array.from(this._fees.values())
  }

  /**
   * Get network fee
   */
  getNetworkFee() {
    return this.getFee(FeeType.NETWORK)
  }

  /**
   * Get platform fee
   */
  getPlatformFee() {
    return this.getFee(FeeType.PLATFORM)
  }

  /**
   * Get provider fee
   */
  getProviderFee() {
    return this.getFee(FeeType.PROVIDER)
  }

  /**
   * Get DEX fee
   */
  getDexFee() {
    return this.getFee(FeeType.DEX)
  }

  /**
   * Get DeFi fee
   */
  getDefiFee() {
    return this.getFee(FeeType.DEFI)
  }

  /**
   * Calculate total fees
   */
  getTotal() {
    if (this._fees.size === 0) {
      return Money.zero(this._currency || 'USD')
    }

    let total = Money.zero(this._currency)
    for (const fee of this._fees.values()) {
      total = total.add(fee.amount)
    }
    
    return total
  }

  /**
   * Get fee breakdown as percentages of total
   */
  getBreakdownPercentages() {
    const total = this.getTotal()
    if (total.isZero()) {
      return {}
    }

    const breakdown = {}
    for (const [type, fee] of this._fees) {
      const percentage = fee.amount.divide(total.amount).multiply(100)
      breakdown[type] = {
        amount: fee.amount,
        percentage: Math.round(percentage.amount * 100) / 100 // 2 decimal places
      }
    }

    return breakdown
  }

  /**
   * Check if any fees exist
   */
  hasFees() {
    return this._fees.size > 0 && this.getTotal().isPositive()
  }

  /**
   * Check if specific fee type exists
   */
  hasFeeType(feeType) {
    const fee = this._fees.get(feeType)
    return fee && fee.isPositive()
  }

  /**
   * Get fees summary for display
   */
  getSummary() {
    return {
      total: this.getTotal(),
      breakdown: this.getBreakdownPercentages(),
      currency: this._currency,
      feeCount: this._fees.size,
      calculatedAt: this._calculatedAt
    }
  }

  /**
   * Apply transaction-specific business rules
   */
  applyBusinessRules(transactionType, paymentMethod, amount) {
    const rules = new FeeBusinessRules()
    return rules.apply(this, transactionType, paymentMethod, amount)
  }

  /**
   * Validate fee structure
   */
  validate() {
    // Check for negative fees
    for (const fee of this._fees.values()) {
      if (fee.amount.amount < 0) {
        throw new Error(`Negative fee detected: ${fee.feeType} = ${fee.amount.format()}`)
      }
    }

    // Check total doesn't exceed reasonable limits
    const total = this.getTotal()
    const maxReasonableFee = new Money(1000000, this._currency) // $1M max fee
    if (total.greaterThan(maxReasonableFee)) {
      throw new Error(`Fee total exceeds reasonable limit: ${total.format()}`)
    }

    return true
  }

  /**
   * Create a copy with modifications
   */
  withFee(feeType, amount, description) {
    const fees = Array.from(this._fees.values())
    fees.push(new FeeAmount(amount, this._currency, feeType, description))
    return new FeeStructure(fees)
  }

  /**
   * Create a copy without specific fee type
   */
  withoutFee(feeType) {
    const fees = Array.from(this._fees.values()).filter(fee => fee.feeType !== feeType)
    return new FeeStructure(fees)
  }

  /**
   * Value object equality
   */
  equals(other) {
    if (!(other instanceof FeeStructure)) {
      return false
    }

    if (this._fees.size !== other._fees.size) {
      return false
    }

    for (const [type, fee] of this._fees) {
      const otherFee = other._fees.get(type)
      if (!otherFee || !fee.equals(otherFee)) {
        return false
      }
    }

    return true
  }

  /**
   * Serialization
   */
  toJSON() {
    const fees = {}
    for (const [type, fee] of this._fees) {
      fees[type] = fee.toJSON()
    }

    return {
      fees,
      currency: this._currency,
      calculatedAt: this._calculatedAt,
      total: this.getTotal().toJSON()
    }
  }

  static fromJSON(data) {
    const fees = []
    for (const [type, feeData] of Object.entries(data.fees)) {
      fees.push(FeeAmount.fromJSON(feeData))
    }
    return new FeeStructure(fees)
  }

  /**
   * Factory methods
   */
  static empty(currency = 'USD') {
    return new FeeStructure([])
  }

  static simple(amount, currency, feeType = FeeType.PLATFORM) {
    return new FeeStructure([new FeeAmount(amount, currency, feeType)])
  }

  static standard(diboasAmount, networkAmount, currency) {
    return new FeeStructure([
      FeeAmount.platformFee(diboasAmount, currency),
      FeeAmount.networkFee(networkAmount, currency)
    ])
  }
}

/**
 * Fee Business Rules
 * Encapsulates business logic for fee calculations
 */
class FeeBusinessRules {
  /**
   * Apply business rules to fee structure
   */
  apply(feeStructure, transactionType, paymentMethod, amount) {
    // Rule: Strategy transactions only use DeFi fees
    if (['start_strategy', 'stop_strategy'].includes(transactionType)) {
      return feeStructure.withoutFee(FeeType.DEX)
    }

    // Rule: Send transactions have no DEX fees
    if (transactionType === 'send') {
      return feeStructure.withoutFee(FeeType.DEX)
    }

    // Rule: diBoaS wallet has no provider fees
    if (paymentMethod === 'diboas_wallet') {
      return feeStructure.withoutFee(FeeType.PROVIDER)
    }

    // Rule: Off-ramp withdrawals have no DEX fees
    if (transactionType === 'withdraw' && 
        !['external_wallet', 'diboas_wallet'].includes(paymentMethod)) {
      return feeStructure.withoutFee(FeeType.DEX)
    }

    return feeStructure
  }
}

export default FeeStructure