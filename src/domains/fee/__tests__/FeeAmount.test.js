/**
 * Fee Amount Value Object Tests
 * Comprehensive unit tests for FeeAmount
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FeeAmount, FeeType } from '../value-objects/FeeAmount.js'
import { Money } from '../../shared/value-objects/Money.js'

describe('FeeAmount Value Object', () => {
  describe('Construction', () => {
    it('should create fee amount with Money object', () => {
      const money = new Money(10, 'USD')
      const fee = new FeeAmount(money, 'USD', FeeType.PLATFORM)
      
      expect(fee.amount.equals(money)).toBe(true)
      expect(fee.feeType).toBe(FeeType.PLATFORM)
    })

    it('should create fee amount with numeric amount', () => {
      const fee = new FeeAmount(5.25, 'USD', FeeType.NETWORK, 'Network processing fee')
      
      expect(fee.amount.amount).toBe(5.25)
      expect(fee.amount.currency).toBe('USD')
      expect(fee.feeType).toBe(FeeType.NETWORK)
      expect(fee.description).toBe('Network processing fee')
    })

    it('should throw error for invalid fee type', () => {
      expect(() => {
        new FeeAmount(10, 'USD', 'invalid_type')
      }).toThrow('Invalid fee type')
    })

    it('should throw error for negative amount', () => {
      expect(() => {
        new FeeAmount(-5, 'USD', FeeType.PLATFORM)
      }).toThrow('Fee amount cannot be negative')
    })

    it('should allow zero amount', () => {
      const fee = new FeeAmount(0, 'USD', FeeType.PLATFORM)
      expect(fee.amount.amount).toBe(0)
      expect(fee.isZero()).toBe(true)
    })
  })

  describe('Type Checking', () => {
    let networkFee, platformFee, dexFee

    beforeEach(() => {
      networkFee = new FeeAmount(1, 'USD', FeeType.NETWORK)
      platformFee = new FeeAmount(2, 'USD', FeeType.PLATFORM)
      dexFee = new FeeAmount(3, 'USD', FeeType.DEX)
    })

    it('should correctly identify network fees', () => {
      expect(networkFee.isNetworkFee()).toBe(true)
      expect(platformFee.isNetworkFee()).toBe(false)
    })

    it('should correctly identify platform fees', () => {
      expect(platformFee.isPlatformFee()).toBe(true)
      expect(networkFee.isPlatformFee()).toBe(false)
    })

    it('should correctly identify DEX fees', () => {
      expect(dexFee.isDexFee()).toBe(true)
      expect(networkFee.isDexFee()).toBe(false)
    })
  })

  describe('Fee Calculations', () => {
    let baseFee

    beforeEach(() => {
      baseFee = new FeeAmount(100, 'USD', FeeType.PLATFORM)
    })

    it('should apply percentage correctly', () => {
      const adjustedFee = baseFee.applyPercentage(0.05) // 5%
      expect(adjustedFee.amount.amount).toBe(5)
      expect(adjustedFee.feeType).toBe(FeeType.PLATFORM)
    })

    it('should apply minimum fee', () => {
      const smallFee = new FeeAmount(0.50, 'USD', FeeType.PLATFORM)
      const adjustedFee = smallFee.applyMinimum(1.00)
      
      expect(adjustedFee.amount.amount).toBe(1.00)
      expect(adjustedFee.description).toContain('minimum applied')
    })

    it('should not apply minimum when fee is higher', () => {
      const largeFee = new FeeAmount(5.00, 'USD', FeeType.PLATFORM)
      const adjustedFee = largeFee.applyMinimum(1.00)
      
      expect(adjustedFee.amount.amount).toBe(5.00)
    })

    it('should apply maximum fee', () => {
      const largeFee = new FeeAmount(1000, 'USD', FeeType.PLATFORM)
      const adjustedFee = largeFee.applyMaximum(100)
      
      expect(adjustedFee.amount.amount).toBe(100)
      expect(adjustedFee.description).toContain('maximum applied')
    })
  })

  describe('Fee Combination', () => {
    it('should add fees of same type', () => {
      const fee1 = new FeeAmount(10, 'USD', FeeType.PLATFORM, 'Base fee')
      const fee2 = new FeeAmount(5, 'USD', FeeType.PLATFORM, 'Additional fee')
      
      const combined = fee1.add(fee2)
      
      expect(combined.amount.amount).toBe(15)
      expect(combined.feeType).toBe(FeeType.PLATFORM)
      expect(combined.description).toBe('Base fee + Additional fee')
    })

    it('should throw error when adding different fee types', () => {
      const platformFee = new FeeAmount(10, 'USD', FeeType.PLATFORM)
      const networkFee = new FeeAmount(5, 'USD', FeeType.NETWORK)
      
      expect(() => {
        platformFee.add(networkFee)
      }).toThrow('Cannot combine different fee types')
    })

    it('should throw error when adding non-FeeAmount object', () => {
      const fee = new FeeAmount(10, 'USD', FeeType.PLATFORM)
      
      expect(() => {
        fee.add(5)
      }).toThrow('Can only add other FeeAmount objects')
    })
  })

  describe('Validation', () => {
    it('should validate positive amounts', () => {
      const positiveFee = new FeeAmount(10, 'USD', FeeType.PLATFORM)
      expect(positiveFee.isPositive()).toBe(true)
      
      const zeroFee = new FeeAmount(0, 'USD', FeeType.PLATFORM)
      expect(zeroFee.isPositive()).toBe(false)
    })

    it('should validate zero amounts', () => {
      const zeroFee = new FeeAmount(0, 'USD', FeeType.PLATFORM)
      expect(zeroFee.isZero()).toBe(true)
      
      const positiveFee = new FeeAmount(10, 'USD', FeeType.PLATFORM)
      expect(positiveFee.isZero()).toBe(false)
    })
  })

  describe('Factory Methods', () => {
    it('should create zero fee', () => {
      const zeroFee = FeeAmount.zero('USD', FeeType.PLATFORM)
      
      expect(zeroFee.amount.amount).toBe(0)
      expect(zeroFee.amount.currency).toBe('USD')
      expect(zeroFee.feeType).toBe(FeeType.PLATFORM)
    })

    it('should create network fee', () => {
      const networkFee = FeeAmount.networkFee(2.5, 'USD')
      
      expect(networkFee.amount.amount).toBe(2.5)
      expect(networkFee.feeType).toBe(FeeType.NETWORK)
      expect(networkFee.description).toBe('Network fee')
    })

    it('should create platform fee', () => {
      const platformFee = FeeAmount.platformFee(5, 'USD')
      
      expect(platformFee.amount.amount).toBe(5)
      expect(platformFee.feeType).toBe(FeeType.PLATFORM)
      expect(platformFee.description).toBe('Platform fee')
    })

    it('should create DEX fee', () => {
      const dexFee = FeeAmount.dexFee(1.5, 'USD', 'Solana DEX fee')
      
      expect(dexFee.amount.amount).toBe(1.5)
      expect(dexFee.feeType).toBe(FeeType.DEX)
      expect(dexFee.description).toBe('Solana DEX fee')
    })
  })

  describe('Serialization', () => {
    it('should serialize to JSON', () => {
      const fee = new FeeAmount(10.50, 'USD', FeeType.PLATFORM, 'Test fee')
      const json = fee.toJSON()
      
      expect(json.amount.amount).toBe('10.5') // Stored as string for precision
      expect(json.amount.currency).toBe('USD')
      expect(json.feeType).toBe(FeeType.PLATFORM)
      expect(json.description).toBe('Test fee')
      expect(json.calculatedAt).toBeDefined()
    })

    it('should deserialize from JSON', () => {
      const originalFee = new FeeAmount(10.50, 'USD', FeeType.PLATFORM, 'Test fee')
      const json = originalFee.toJSON()
      const deserializedFee = FeeAmount.fromJSON(json)
      
      expect(deserializedFee.amount.amount).toBe(10.50)
      expect(deserializedFee.feeType).toBe(FeeType.PLATFORM)
      expect(deserializedFee.description).toBe('Test fee')
    })
  })

  describe('Value Object Equality', () => {
    it('should be equal for same amount and fee type', () => {
      const fee1 = new FeeAmount(10, 'USD', FeeType.PLATFORM)
      const fee2 = new FeeAmount(10, 'USD', FeeType.PLATFORM)
      
      expect(fee1.equals(fee2)).toBe(true)
    })

    it('should not be equal for different amounts', () => {
      const fee1 = new FeeAmount(10, 'USD', FeeType.PLATFORM)
      const fee2 = new FeeAmount(20, 'USD', FeeType.PLATFORM)
      
      expect(fee1.equals(fee2)).toBe(false)
    })

    it('should not be equal for different fee types', () => {
      const fee1 = new FeeAmount(10, 'USD', FeeType.PLATFORM)
      const fee2 = new FeeAmount(10, 'USD', FeeType.NETWORK)
      
      expect(fee1.equals(fee2)).toBe(false)
    })

    it('should not be equal for different currencies', () => {
      const fee1 = new FeeAmount(10, 'USD', FeeType.PLATFORM)
      const fee2 = new FeeAmount(10, 'EUR', FeeType.PLATFORM)
      
      expect(fee1.equals(fee2)).toBe(false)
    })
  })

  describe('Formatting', () => {
    it('should format fee for display', () => {
      const fee = new FeeAmount(10.25, 'USD', FeeType.PLATFORM)
      const formatted = fee.format()
      
      expect(formatted).toContain('$10.25')
      expect(formatted).toContain('platform')
    })
  })

  describe('Edge Cases', () => {
    it('should handle very small amounts', () => {
      const smallFee = new FeeAmount(0.001, 'BTC', FeeType.NETWORK)
      expect(smallFee.amount.amount).toBe(0.001)
      expect(smallFee.isPositive()).toBe(true)
    })

    it('should handle very large amounts', () => {
      const largeFee = new FeeAmount(999999, 'USD', FeeType.PLATFORM)
      expect(largeFee.amount.amount).toBe(999999)
      expect(largeFee.isPositive()).toBe(true)
    })

    it('should handle cryptocurrency fees', () => {
      const btcFee = new FeeAmount(0.00001, 'BTC', FeeType.NETWORK)
      expect(btcFee.amount.currency).toBe('BTC')
      expect(btcFee.amount.amount).toBe(0.00001)
    })
  })
})