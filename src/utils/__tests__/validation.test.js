/**
 * Unit Tests for Validation Utilities
 * Tests the core validation logic used throughout the application
 */

import { describe, it, expect } from 'vitest'
import { 
  validateEmail, 
  validateFinancialAmount, 
  validateCryptoAddress,
  sanitizeInput,
  validateTransactionData
} from '../validation.js'

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      const validEmails = [
        'user@example.com',
        'test.user@diboas.com',
        'user+tag@domain.co.uk'
      ]
      
      validEmails.forEach(email => {
        expect(validateEmail(email)).toBe(true)
      })
    })
    
    it('should reject invalid email addresses', () => {
      const invalidEmails = [
        'invalid-email',
        '@domain.com',
        'user@',
        'user@domain',
        'user..double@domain.com'
      ]
      
      invalidEmails.forEach(email => {
        expect(validateEmail(email)).toBe(false)
      })
    })
  })
  
  describe('validateFinancialAmount', () => {
    it('should validate positive financial amounts', () => {
      const validAmounts = [0.01, 1.00, 100.50, 1000000.99]
      
      validAmounts.forEach(amount => {
        expect(() => validateFinancialAmount(amount)).not.toThrow()
      })
    })
    
    it('should reject negative amounts', () => {
      expect(() => validateFinancialAmount(-1.00)).toThrow('Amount must be positive')
    })
    
    it('should reject zero amounts', () => {
      expect(() => validateFinancialAmount(0)).toThrow('Amount must be greater than zero')
    })
    
    it('should reject amounts with too many decimal places', () => {
      expect(() => validateFinancialAmount(1.001)).toThrow('Amount has too many decimal places')
    })
    
    it('should handle string inputs', () => {
      expect(() => validateFinancialAmount('100.50')).not.toThrow()
      expect(() => validateFinancialAmount('invalid')).toThrow()
    })
  })
  
  describe('validateCryptoAddress', () => {
    it('should validate Bitcoin addresses', () => {
      const btcAddresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Genesis block
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy'  // P2SH
      ]
      
      btcAddresses.forEach(address => {
        expect(validateCryptoAddress(address, 'BTC')).toBe(true)
      })
    })
    
    it('should validate Ethereum addresses', () => {
      const ethAddresses = [
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
      ]
      
      ethAddresses.forEach(address => {
        expect(validateCryptoAddress(address, 'ETH')).toBe(true)
      })
    })
    
    it('should reject invalid addresses', () => {
      const invalidAddresses = [
        'invalid-address',
        '0xinvalid',
        '1InvalidBitcoinAddress'
      ]
      
      invalidAddresses.forEach(address => {
        expect(validateCryptoAddress(address, 'BTC')).toBe(false)
        expect(validateCryptoAddress(address, 'ETH')).toBe(false)
      })
    })
  })
  
  describe('sanitizeInput', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello World'
      const sanitized = sanitizeInput(input)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).toContain('Hello World')
    })
    
    it('should trim whitespace', () => {
      const input = '  Hello World  '
      const sanitized = sanitizeInput(input)
      
      expect(sanitized).toBe('Hello World')
    })
    
    it('should handle empty inputs', () => {
      expect(sanitizeInput('')).toBe('')
      expect(sanitizeInput(null)).toBe('')
      expect(sanitizeInput(undefined)).toBe('')
    })
  })
  
  describe('validateTransactionData', () => {
    const validTransaction = {
      type: 'BUY',
      asset: 'BTC',
      amount: 0.001,
      value: 43.25
    }
    
    it('should validate correct transaction data', () => {
      expect(() => validateTransactionData(validTransaction)).not.toThrow()
    })
    
    it('should require transaction type', () => {
      const { type, ...invalidTransaction } = validTransaction
      expect(() => validateTransactionData(invalidTransaction))
        .toThrow('Transaction type is required')
    })
    
    it('should validate transaction type values', () => {
      const invalidTransaction = { ...validTransaction, type: 'INVALID' }
      expect(() => validateTransactionData(invalidTransaction))
        .toThrow('Invalid transaction type')
    })
    
    it('should require asset', () => {
      const { asset, ...invalidTransaction } = validTransaction
      expect(() => validateTransactionData(invalidTransaction))
        .toThrow('Asset is required')
    })
    
    it('should validate asset values', () => {
      const invalidTransaction = { ...validTransaction, asset: 'INVALID' }
      expect(() => validateTransactionData(invalidTransaction))
        .toThrow('Unsupported asset')
    })
    
    it('should validate amount', () => {
      const invalidTransaction = { ...validTransaction, amount: -1 }
      expect(() => validateTransactionData(invalidTransaction))
        .toThrow('Invalid transaction amount')
    })
  })
})