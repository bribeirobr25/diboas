/**
 * Money Value Object Tests - Updated for decimal.js precision
 * Testing decimal.js integration for precise financial arithmetic
 */

import { describe, it, expect } from 'vitest'
import { Money } from '../Money.js'

describe('Money Value Object - Decimal.js Integration', () => {
  describe('Precise Financial Arithmetic', () => {
    it('should handle precise decimal addition without floating point errors', () => {
      const money1 = Money.usd(0.1)
      const money2 = Money.usd(0.2)
      const result = money1.add(money2)
      
      // This would fail with floating point: 0.1 + 0.2 = 0.30000000000000004
      expect(result.amount).toBe(0.3)
      expect(result.currency).toBe('USD')
    })
    
    it('should handle precise decimal multiplication', () => {
      const money = Money.usd(0.1)
      const result = money.multiply(3)
      
      // This would fail with floating point: 0.1 * 3 = 0.30000000000000004
      expect(result.amount).toBe(0.3)
    })
    
    it('should handle precise decimal division', () => {
      const money = Money.usd(1)
      const result = money.divide(3)
      
      // Should be precise to 2 decimal places for USD
      expect(result.amount).toBe(0.33) // Rounded to USD precision
    })
    
    it('should handle crypto precision correctly', () => {
      const btc = Money.btc(0.12345678)
      expect(btc.amount).toBe(0.12345678) // 8 decimal places preserved
      
      const eth = Money.eth('1.123456789012345678')
      expect(eth.amount).toBe(1.1234567890123457) // Precision adjusted for JS limits
    })
  })
  
  describe('Security Validations', () => {
    it('should prevent extremely large amounts', () => {
      expect(() => {
        new Money('1e16', 'USD') // 10 quadrillion - too large
      }).toThrow('Amount exceeds maximum safe value')
    })
    
    it('should prevent extremely small amounts', () => {
      expect(() => {
        new Money('1e-19', 'USD') // Too small
      }).toThrow('Amount too small')
    })
    
    it('should validate currency format', () => {
      expect(() => {
        new Money(100, 'INVALID_CURRENCY_NAME')
      }).toThrow('Currency must be 2-10 uppercase letters')
    })
    
    it('should only allow supported currencies', () => {
      expect(() => {
        new Money(100, 'SCAM')
      }).toThrow('Unsupported currency')
    })
  })
  
  describe('Business Logic', () => {
    it('should correctly identify minimum transfer requirements', () => {
      const smallUSD = Money.usd(0.5)
      const largeUSD = Money.usd(5)
      
      expect(smallUSD.meetsMinimumTransfer()).toBe(false)
      expect(largeUSD.meetsMinimumTransfer()).toBe(true)
    })
    
    it('should identify high-value transactions needing verification', () => {
      const smallAmount = Money.usd(5000)
      const largeAmount = Money.usd(15000)
      
      expect(smallAmount.requiresAdditionalVerification()).toBe(false)
      expect(largeAmount.requiresAdditionalVerification()).toBe(true)
    })
  })
  
  describe('Comparison Operations', () => {
    it('should perform precise comparisons', () => {
      const money1 = Money.usd(0.1).add(Money.usd(0.2))
      const money2 = Money.usd(0.3)
      
      // This would fail with floating point precision errors
      expect(money1.equals(money2)).toBe(true)
    })
  })
  
  describe('Serialization', () => {
    it('should serialize and deserialize without precision loss', () => {
      const original = Money.btc('0.12345678')
      const json = original.toJSON()
      const restored = Money.fromJSON(json)
      
      expect(restored.equals(original)).toBe(true)
      expect(restored.amount).toBe(original.amount)
    })
  })
})