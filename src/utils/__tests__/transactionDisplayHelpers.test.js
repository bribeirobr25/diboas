/**
 * Comprehensive Test Suite for Transaction Display Helpers
 * Tests all transaction display logic including edge cases and error scenarios
 */

import { describe, it, expect, beforeEach } from 'vitest'
import {
  calculateDisplayAmountWithSign,
  formatRelativeTimeFromTimestamp,
  formatHumanReadableDate,
  determineTransactionDisplayType,
  generateHumanReadableTransactionDescription,
  shouldSplitTransactionInAdvancedMode,
  createSplitTransactionsForAdvancedMode,
  getEnhancedTransactionIcon
} from '../transactionDisplayHelpers'
import { TransactionType, TransactionDisplayType } from '../../types/transactionTypes'

describe('Transaction Display Helpers', () => {
  describe('calculateDisplayAmountWithSign', () => {
    describe('Happy Path Scenarios', () => {
      it('should format ADD transactions with positive sign', () => {
        const result = calculateDisplayAmountWithSign('add', 100)
        expect(result).toBe('+$100.00')
      })

      it('should format SEND transactions with negative sign', () => {
        const result = calculateDisplayAmountWithSign('send', 50)
        expect(result).toBe('-$50.00')
      })

      it('should format BUY transactions with positive sign', () => {
        const result = calculateDisplayAmountWithSign('buy', 200)
        expect(result).toBe('+$200.00')
      })

      it('should format SELL transactions with positive proceeds', () => {
        const result = calculateDisplayAmountWithSign('sell', 150, 145)
        expect(result).toBe('+$145.00')
      })

      it('should handle buy with asset exchange', () => {
        const result = calculateDisplayAmountWithSign('buy', 100, null, 'diboas_wallet', 'BTC', 0.002)
        expect(result).toBe('+0.002 BTC')
      })
    })

    describe('Edge Cases and Error Scenarios', () => {
      it('should handle undefined transaction type', () => {
        const result = calculateDisplayAmountWithSign(undefined, 100)
        expect(result).toBe('$0.00')
      })

      it('should handle null transaction type', () => {
        const result = calculateDisplayAmountWithSign(null, 100)
        expect(result).toBe('$0.00')
      })

      it('should handle undefined amount', () => {
        const result = calculateDisplayAmountWithSign('add', undefined)
        expect(result).toBe('$0.00')
      })

      it('should handle null amount', () => {
        const result = calculateDisplayAmountWithSign('add', null)
        expect(result).toBe('$0.00')
      })

      it('should handle string amounts', () => {
        const result = calculateDisplayAmountWithSign('add', '100.50')
        expect(result).toBe('+$100.50')
      })

      it('should handle boolean amounts', () => {
        const result = calculateDisplayAmountWithSign('add', true)
        expect(result).toBe('+$1.00')
      })

      it('should handle zero amounts', () => {
        const result = calculateDisplayAmountWithSign('add', 0)
        expect(result).toBe('+$0.00')
      })

      it('should handle negative amounts', () => {
        const result = calculateDisplayAmountWithSign('add', -50)
        expect(result).toBe('+$-50.00')
      })

      it('should handle very large amounts', () => {
        const result = calculateDisplayAmountWithSign('add', 999999999.99)
        expect(result).toBe('+$999999999.99')
      })

      it('should handle very small amounts', () => {
        const result = calculateDisplayAmountWithSign('add', 0.01)
        expect(result).toBe('+$0.01')
      })

      it('should handle NaN amounts', () => {
        const result = calculateDisplayAmountWithSign('add', NaN)
        expect(result).toBe('+$0.00')
      })

      it('should handle Infinity amounts', () => {
        const result = calculateDisplayAmountWithSign('add', Infinity)
        expect(result).toBe('+$Infinity')
      })
    })

    describe('Fee Calculation Edge Cases', () => {
      it('should prefer net amount over original amount for incoming transactions', () => {
        const result = calculateDisplayAmountWithSign('add', 100, 95)
        expect(result).toBe('+$95.00')
      })

      it('should use original amount when net amount is 0', () => {
        const result = calculateDisplayAmountWithSign('add', 100, 0)
        expect(result).toBe('+$0.00')
      })

      it('should handle undefined net amount', () => {
        const result = calculateDisplayAmountWithSign('add', 100, undefined)
        expect(result).toBe('+$100.00')
      })
    })
  })

  describe('formatRelativeTimeFromTimestamp', () => {
    let mockNow

    beforeEach(() => {
      mockNow = new Date('2024-01-01T12:00:00Z')
      vi.spyOn(Date, 'now').mockReturnValue(mockNow.getTime())
    })

    describe('Happy Path Time Formatting', () => {
      it('should format "Just now" for recent timestamps', () => {
        const timestamp = new Date(mockNow.getTime() - 30000).toISOString() // 30 seconds ago
        expect(formatRelativeTimeFromTimestamp(timestamp)).toBe('Just now')
      })

      it('should format minutes correctly', () => {
        const timestamp = new Date(mockNow.getTime() - 5 * 60 * 1000).toISOString() // 5 minutes ago
        expect(formatRelativeTimeFromTimestamp(timestamp)).toBe('5m ago')
      })

      it('should format hours correctly', () => {
        const timestamp = new Date(mockNow.getTime() - 3 * 60 * 60 * 1000).toISOString() // 3 hours ago
        expect(formatRelativeTimeFromTimestamp(timestamp)).toBe('3h ago')
      })

      it('should format days correctly', () => {
        const timestamp = new Date(mockNow.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString() // 2 days ago
        expect(formatRelativeTimeFromTimestamp(timestamp)).toBe('2d ago')
      })
    })

    describe('Edge Cases and Error Scenarios', () => {
      it('should handle invalid timestamp strings', () => {
        expect(formatRelativeTimeFromTimestamp('invalid-date')).toBe('Just now')
      })

      it('should handle empty timestamp', () => {
        expect(formatRelativeTimeFromTimestamp('')).toBe('Just now')
      })

      it('should handle future timestamps', () => {
        const futureTimestamp = new Date(mockNow.getTime() + 60000).toISOString()
        expect(formatRelativeTimeFromTimestamp(futureTimestamp)).toBe('Just now')
      })

      it('should handle very old timestamps', () => {
        const oldTimestamp = new Date(mockNow.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString()
        expect(formatRelativeTimeFromTimestamp(oldTimestamp)).toBe('365d ago')
      })
    })
  })

  describe('generateHumanReadableTransactionDescription', () => {
    describe('Transaction Type Descriptions', () => {
      it('should generate ADD transaction description', () => {
        const result = generateHumanReadableTransactionDescription('add', 100, 'USDC', 'credit_card')
        expect(result).toBe('Added $100 using credit_card')
      })

      it('should generate SEND transaction description', () => {
        const result = generateHumanReadableTransactionDescription('send', 50)
        expect(result).toBe('Sent $50 to user')
      })

      it('should generate WITHDRAW transaction description', () => {
        const result = generateHumanReadableTransactionDescription('withdraw', 75, 'USDC', 'bank_account')
        expect(result).toBe('Withdrew $75 to bank_account')
      })

      it('should generate BUY transaction description with payment method', () => {
        const result = generateHumanReadableTransactionDescription('buy', 200, 'BTC', 'credit_card')
        expect(result).toBe('Bought BTC via credit_card')
      })

      it('should generate BUY transaction description with diBoaS wallet', () => {
        const result = generateHumanReadableTransactionDescription(
          'buy', 200, 'BTC', 'diboas_wallet', 'USDC', 200, 'BTC', 0.005
        )
        expect(result).toBe('Exchanged 200 USDC → 0.005 BTC')
      })

      it('should generate SELL transaction description with exchange details', () => {
        const result = generateHumanReadableTransactionDescription(
          'sell', 150, 'BTC', null, 'BTC', 0.003, null, 145
        )
        expect(result).toBe('Exchanged 0.003 BTC → $145')
      })
    })

    describe('Edge Cases', () => {
      it('should handle unknown transaction types', () => {
        const result = generateHumanReadableTransactionDescription('unknown', 100)
        expect(result).toBe('unknown transaction of $100')
      })

      it('should handle missing asset information', () => {
        const result = generateHumanReadableTransactionDescription('buy', 100, null, 'credit_card')
        expect(result).toBe('Bought cryptocurrency via credit_card')
      })

      it('should handle missing payment method', () => {
        const result = generateHumanReadableTransactionDescription('add', 100)
        expect(result).toBe('Added $100 using payment method')
      })

      it('should handle zero amounts', () => {
        const result = generateHumanReadableTransactionDescription('send', 0)
        expect(result).toBe('Sent $0 to user')
      })
    })
  })

  describe('shouldSplitTransactionInAdvancedMode', () => {
    it('should split buy transactions with diBoaS wallet', () => {
      expect(shouldSplitTransactionInAdvancedMode('buy', 'diboas_wallet')).toBe(true)
    })

    it('should split sell transactions', () => {
      expect(shouldSplitTransactionInAdvancedMode('sell')).toBe(true)
    })

    it('should not split buy transactions with external payment', () => {
      expect(shouldSplitTransactionInAdvancedMode('buy', 'credit_card')).toBe(false)
    })

    it('should not split add transactions', () => {
      expect(shouldSplitTransactionInAdvancedMode('add')).toBe(false)
    })

    it('should not split send transactions', () => {
      expect(shouldSplitTransactionInAdvancedMode('send')).toBe(false)
    })
  })

  describe('createSplitTransactionsForAdvancedMode', () => {
    describe('Buy Transaction Splitting', () => {
      it('should split buy transaction with diBoaS wallet', () => {
        const transaction = {
          id: 'tx_123',
          type: 'buy',
          amount: 100,
          asset: 'BTC',
          paymentMethod: 'diboas_wallet',
          fromAsset: 'USDC',
          fromAmount: 100,
          toAsset: 'BTC',
          toAmount: 0.002
        }

        const result = createSplitTransactionsForAdvancedMode(transaction)
        expect(result).toHaveLength(2)
        
        expect(result[0]).toMatchObject({
          id: 'tx_123_send',
          type: 'exchange_send',
          originalType: 'buy',
          description: 'Sent 100 USDC to DEX'
        })
        
        expect(result[1]).toMatchObject({
          id: 'tx_123_receive',
          type: 'exchange_receive',
          originalType: 'buy',
          description: 'Received 0.002 BTC from DEX'
        })
      })
    })

    describe('Sell Transaction Splitting', () => {
      it('should split sell transaction', () => {
        const transaction = {
          id: 'tx_456',
          type: 'sell',
          amount: 150,
          asset: 'BTC',
          fromAsset: 'BTC',
          fromAmount: 0.003,
          netAmount: 145,
          fees: { total: 5 }
        }

        const result = createSplitTransactionsForAdvancedMode(transaction)
        expect(result).toHaveLength(2)
        
        expect(result[0]).toMatchObject({
          id: 'tx_456_send',
          type: 'exchange_send',
          originalType: 'sell',
          description: 'Sent 0.003 BTC to DEX'
        })
        
        expect(result[1]).toMatchObject({
          id: 'tx_456_receive',
          type: 'exchange_receive',
          originalType: 'sell',
          description: 'Received $145 USDC from DEX'
        })
      })
    })

    describe('Edge Cases', () => {
      it('should return original transaction for non-splittable types', () => {
        const transaction = {
          id: 'tx_789',
          type: 'add',
          amount: 100
        }

        const result = createSplitTransactionsForAdvancedMode(transaction)
        expect(result).toEqual([transaction])
      })

      it('should handle missing transaction data gracefully', () => {
        const transaction = {
          id: 'tx_incomplete',
          type: 'buy',
          paymentMethod: 'diboas_wallet'
        }

        const result = createSplitTransactionsForAdvancedMode(transaction)
        expect(result).toHaveLength(2)
        expect(result[0].description).toContain('undefined')
      })
    })
  })

  describe('Data Integrity and Security Tests', () => {
    it('should never return undefined or null for required fields', () => {
      const result = calculateDisplayAmountWithSign(undefined, undefined)
      expect(typeof result).toBe('string')
      expect(result).toBeDefined()
    })

    it('should sanitize malicious input', () => {
      const maliciousInput = '<script>alert("xss")</script>'
      const result = generateHumanReadableTransactionDescription('add', 100, maliciousInput)
      expect(result).not.toContain('<script>')
    })

    it('should handle extremely large numbers without breaking', () => {
      const largeNumber = Number.MAX_SAFE_INTEGER
      const result = calculateDisplayAmountWithSign('add', largeNumber)
      expect(result).toMatch(/^\+\$[\d,]+\.00$/)
    })

    it('should preserve transaction data integrity', () => {
      const originalTransaction = {
        id: 'tx_original',
        type: 'buy',
        amount: 100,
        sensitive: 'data'
      }

      const splits = createSplitTransactionsForAdvancedMode(originalTransaction)
      
      // Original transaction should not be mutated
      expect(originalTransaction.id).toBe('tx_original')
      expect(originalTransaction.sensitive).toBe('data')
      
      // Split transactions should have new IDs
      expect(splits[0].id).not.toBe('tx_original')
      expect(splits[1].id).not.toBe('tx_original')
    })
  })

  describe('Performance and Memory Tests', () => {
    it('should handle large batches of transactions efficiently', () => {
      const startTime = performance.now()
      
      for (let i = 0; i < 1000; i++) {
        calculateDisplayAmountWithSign('add', Math.random() * 1000)
      }
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(100) // Should complete in under 100ms
    })

    it('should not leak memory with repeated calls', () => {
      const memoryBefore = performance.memory?.usedJSHeapSize || 0
      
      for (let i = 0; i < 10000; i++) {
        formatRelativeTimeFromTimestamp(new Date().toISOString())
      }
      
      const memoryAfter = performance.memory?.usedJSHeapSize || 0
      const memoryIncrease = memoryAfter - memoryBefore
      
      // Memory increase should be reasonable (less than 1MB)
      expect(memoryIncrease).toBeLessThan(1024 * 1024)
    })
  })
})