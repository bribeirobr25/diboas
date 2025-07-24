/**
 * Unit Tests for Validation Utilities
 * Tests the core validation logic used throughout the application
 */

import { describe, it, expect } from 'vitest'
import { 
  validateEmail, 
  validateAmount, 
  validateWalletAddress,
  sanitize,
  validateUsername
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
        const result = validateEmail(email)
        expect(result.isValid).toBe(true)
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
        const result = validateEmail(email)
        expect(result.isValid).toBe(false)
      })
    })
  })
  
  describe('validateAmount', () => {
    it('should validate positive financial amounts', () => {
      const validAmounts = [0.01, 1.00, 100.50, 999999.99]
      
      validAmounts.forEach(amount => {
        const result = validateAmount(amount)
        expect(result.isValid).toBe(true)
      })
    })
    
    it('should reject negative amounts', () => {
      const result = validateAmount(-1.00)
      expect(result.isValid).toBe(false)
      expect(result.message).toContain('greater than zero')
    })
    
    it('should reject zero amounts', () => {
      const result = validateAmount(0)
      expect(result.isValid).toBe(false)
      expect(result.message).toContain('greater than zero')
    })
    
    it('should reject amounts with too many decimal places', () => {
      const result = validateAmount('1.1234567')
      expect(result.isValid).toBe(false)
      expect(result.message).toContain('decimal places')
    })
    
    it('should handle string inputs', () => {
      const validResult = validateAmount('100.50')
      expect(validResult.isValid).toBe(true)
      
      const invalidResult = validateAmount('invalid')
      expect(invalidResult.isValid).toBe(false)
    })
  })
  
  describe('validateWalletAddress', () => {
    it('should validate Bitcoin addresses', () => {
      const btcAddresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Genesis block
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy'  // P2SH
      ]
      
      btcAddresses.forEach(address => {
        const result = validateWalletAddress(address, 'bitcoin')
        expect(result.isValid).toBe(true)
      })
    })
    
    it('should validate Ethereum addresses', () => {
      const ethAddresses = [
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
      ]
      
      ethAddresses.forEach(address => {
        const result = validateWalletAddress(address, 'ethereum')
        expect(result.isValid).toBe(true)
      })
    })
    
    it('should reject invalid addresses', () => {
      const invalidAddresses = [
        'invalid-address',
        '0xinvalid',
        '1InvalidBitcoinAddress'
      ]
      
      invalidAddresses.forEach(address => {
        const btcResult = validateWalletAddress(address, 'bitcoin')
        const ethResult = validateWalletAddress(address, 'ethereum')
        expect(btcResult.isValid).toBe(false)
        expect(ethResult.isValid).toBe(false)
      })
    })
  })
  
  describe('sanitize', () => {
    it('should remove HTML tags', () => {
      const input = '<script>alert("xss")</script>Hello World'
      const sanitized = sanitize.text(input)
      
      expect(sanitized).not.toContain('<script>')
      expect(sanitized).toContain('Hello World')
    })
    
    it('should trim whitespace', () => {
      const input = '  Hello World  '
      const sanitized = sanitize.text(input)
      
      expect(sanitized).toBe('Hello World')
    })
    
    it('should handle empty inputs', () => {
      expect(sanitize.text('')).toBe('')
      expect(sanitize.text(null)).toBe('')
      expect(sanitize.text(undefined)).toBe('')
    })
  })
  
  describe('validateUsername', () => {
    it('should validate correct usernames', () => {
      const validUsernames = ['@john_doe', '@user123', '@testuser']
      
      validUsernames.forEach(username => {
        const result = validateUsername(username)
        expect(result.isValid).toBe(true)
      })
    })
    
    it('should require minimum length', () => {
      const result = validateUsername('@ab')
      expect(result.isValid).toBe(false)
      expect(result.message).toContain('at least 3 characters')
    })
    
    it('should reject invalid characters', () => {
      const result = validateUsername('@user-name!')
      expect(result.isValid).toBe(false)
      expect(result.message).toContain('letters, numbers, and underscores')
    })
    
    it('should handle usernames without @ prefix', () => {
      const result = validateUsername('username')
      expect(result.isValid).toBe(true)
      expect(result.sanitized).toBe('@username')
    })
  })
})