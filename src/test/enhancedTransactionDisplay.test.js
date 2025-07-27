/**
 * Enhanced Transaction Display Tests
 * Tests the improved buy/sell transaction transparency features
 */

import { describe, it, expect } from 'vitest'
import {
  calculateDisplayAmountWithSign,
  generateHumanReadableTransactionDescription,
  shouldSplitTransactionInAdvancedMode,
  createSplitTransactionsForAdvancedMode,
  getEnhancedTransactionIcon
} from '../utils/transactionDisplayHelpers'
import { TransactionType } from '../types/transactionTypes'

describe('Enhanced Transaction Display', () => {
  describe('calculateDisplayAmountWithSign', () => {
    it('should display buy on-ramp transactions as positive', () => {
      const result = calculateDisplayAmountWithSign(
        TransactionType.BUY,
        100,
        undefined,
        'credit_card'
      )
      expect(result).toBe('+$100.00')
    })

    it('should display buy on-chain exchanges with asset gained', () => {
      const result = calculateDisplayAmountWithSign(
        TransactionType.BUY,
        100,
        undefined,
        'diboas_wallet',
        'BTC',
        0.0025
      )
      expect(result).toBe('+0.0025 BTC')
    })

    it('should display sell proceeds as positive', () => {
      const result = calculateDisplayAmountWithSign(
        TransactionType.SELL,
        100,
        95 // After fees
      )
      expect(result).toBe('+$95.00')
    })

    it('should display sell with exchange format correctly', () => {
      const result = calculateDisplayAmountWithSign(
        TransactionType.SELL,
        100,
        95,
        undefined,
        'USDC',
        95
      )
      expect(result).toBe('+$95.00')
    })

    it('should display traditional transactions correctly', () => {
      // Add should be positive
      expect(calculateDisplayAmountWithSign(TransactionType.ADD, 100)).toBe('+$100.00')
      
      // Send should be negative
      expect(calculateDisplayAmountWithSign(TransactionType.SEND, 50)).toBe('-$50.00')
      
      // Withdraw should be negative
      expect(calculateDisplayAmountWithSign(TransactionType.WITHDRAW, 75)).toBe('-$75.00')
    })
  })

  describe('generateHumanReadableTransactionDescription', () => {
    it('should generate exchange description for on-chain buy', () => {
      const result = generateHumanReadableTransactionDescription(
        TransactionType.BUY,
        100,
        'BTC',
        'diboas_wallet',
        'USDC',
        100,
        'BTC',
        0.0025
      )
      expect(result).toBe('Exchanged 100 USDC → 0.0025 BTC')
    })

    it('should generate on-ramp buy description', () => {
      const result = generateHumanReadableTransactionDescription(
        TransactionType.BUY,
        100,
        'BTC',
        'credit_card'
      )
      expect(result).toBe('Bought BTC via credit_card')
    })

    it('should generate sell description with asset details', () => {
      const result = generateHumanReadableTransactionDescription(
        TransactionType.SELL,
        100,
        'BTC',
        undefined,
        'BTC',
        0.0025
      )
      expect(result).toBe('Exchanged 0.0025 BTC → $100')
    })

    it('should generate enhanced sell description with exchange format', () => {
      const result = generateHumanReadableTransactionDescription(
        TransactionType.SELL,
        100,
        'BTC',
        undefined,
        'BTC',
        0.0025,
        'USDC',
        95
      )
      expect(result).toBe('Exchanged 0.0025 BTC → $95')
    })

    it('should generate fallback sell description', () => {
      const result = generateHumanReadableTransactionDescription(
        TransactionType.SELL,
        100,
        'BTC'
      )
      expect(result).toBe('Sold BTC for $100')
    })
  })

  describe('shouldSplitTransactionInAdvancedMode', () => {
    it('should split on-chain buy transactions', () => {
      expect(shouldSplitTransactionInAdvancedMode(TransactionType.BUY, 'diboas_wallet')).toBe(true)
    })

    it('should split sell transactions', () => {
      expect(shouldSplitTransactionInAdvancedMode(TransactionType.SELL)).toBe(true)
    })

    it('should not split on-ramp buy transactions', () => {
      expect(shouldSplitTransactionInAdvancedMode(TransactionType.BUY, 'credit_card')).toBe(false)
    })

    it('should not split other transaction types', () => {
      expect(shouldSplitTransactionInAdvancedMode(TransactionType.ADD)).toBe(false)
      expect(shouldSplitTransactionInAdvancedMode(TransactionType.SEND)).toBe(false)
      expect(shouldSplitTransactionInAdvancedMode(TransactionType.TRANSFER)).toBe(false)
    })
  })

  describe('createSplitTransactionsForAdvancedMode', () => {
    it('should split on-chain buy into send and receive', () => {
      const transaction = {
        id: 'tx123',
        type: TransactionType.BUY,
        amount: 100,
        paymentMethod: 'diboas_wallet',
        fromAsset: 'USDC',
        fromAmount: 100,
        toAsset: 'BTC',
        toAmount: 0.0025,
        timestamp: '2024-01-01T00:00:00Z'
      }

      const result = createSplitTransactionsForAdvancedMode(transaction)
      
      expect(result).toHaveLength(2)
      
      // First part: Send to DEX
      expect(result[0].id).toBe('tx123_send')
      expect(result[0].type).toBe('exchange_send')
      expect(result[0].description).toBe('Sent 100 USDC to DEX')
      expect(result[0].displayAmount).toBe('-100 USDC')
      
      // Second part: Receive from DEX
      expect(result[1].id).toBe('tx123_receive')
      expect(result[1].type).toBe('exchange_receive')
      expect(result[1].description).toBe('Received 0.0025 BTC from DEX')
      expect(result[1].displayAmount).toBe('+0.0025 BTC')
    })

    it('should split sell into send and receive', () => {
      const transaction = {
        id: 'tx456',
        type: TransactionType.SELL,
        amount: 100,
        asset: 'BTC',
        fromAsset: 'BTC',
        fromAmount: 0.0025,
        netAmount: 95,
        timestamp: '2024-01-01T00:00:00Z'
      }

      const result = createSplitTransactionsForAdvancedMode(transaction)
      
      expect(result).toHaveLength(2)
      
      // First part: Send asset to DEX
      expect(result[0].id).toBe('tx456_send')
      expect(result[0].description).toBe('Sent 0.0025 BTC to DEX')
      expect(result[0].displayAmount).toBe('-0.0025 BTC')
      
      // Second part: Receive USDC from DEX
      expect(result[1].id).toBe('tx456_receive')
      expect(result[1].description).toBe('Received $95 USDC from DEX')
      expect(result[1].displayAmount).toBe('+$95')
    })

    it('should split sell with default fee calculation', () => {
      const transaction = {
        id: 'tx789',
        type: TransactionType.SELL,
        amount: 100,
        asset: 'ETH',
        fromAsset: 'ETH',
        fromAmount: 0.05,
        fees: { total: 5 },
        timestamp: '2024-01-01T00:00:00Z'
      }

      const result = createSplitTransactionsForAdvancedMode(transaction)
      
      expect(result).toHaveLength(2)
      
      // First part: Send asset to DEX
      expect(result[0].description).toBe('Sent 0.05 ETH to DEX')
      expect(result[0].displayAmount).toBe('-0.05 ETH')
      
      // Second part: Receive USDC from DEX (amount - fees)
      expect(result[1].description).toBe('Received $95 USDC from DEX')
      expect(result[1].displayAmount).toBe('+$95')
    })

    it('should not split non-qualifying transactions', () => {
      const transaction = {
        id: 'tx789',
        type: TransactionType.ADD,
        amount: 100,
        timestamp: '2024-01-01T00:00:00Z'
      }

      const result = createSplitTransactionsForAdvancedMode(transaction)
      
      expect(result).toHaveLength(1)
      expect(result[0]).toEqual(transaction)
    })
  })

  describe('getEnhancedTransactionIcon', () => {
    it('should return exchange icon for on-chain buy', () => {
      expect(getEnhancedTransactionIcon(TransactionType.BUY, 'diboas_wallet')).toBe('exchange')
    })

    it('should return trending-up icon for on-ramp buy', () => {
      expect(getEnhancedTransactionIcon(TransactionType.BUY, 'credit_card')).toBe('trending-up')
    })

    it('should return exchange icon for sell transactions', () => {
      expect(getEnhancedTransactionIcon(TransactionType.SELL)).toBe('exchange')
    })

    it('should return appropriate icons for other types', () => {
      expect(getEnhancedTransactionIcon(TransactionType.ADD)).toBe('download')
      expect(getEnhancedTransactionIcon(TransactionType.SEND)).toBe('send')
      expect(getEnhancedTransactionIcon(TransactionType.TRANSFER)).toBe('send')
    })
  })
})