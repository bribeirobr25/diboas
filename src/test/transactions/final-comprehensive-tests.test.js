/**
 * Final Comprehensive Transaction Fee Tests
 * Tests all transaction types with proper integration and expected fee structures
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FeeCalculator } from '../../utils/feeCalculations.js'

describe('Final Comprehensive Transaction Fee Tests', () => {
  let feeCalculator

  beforeEach(() => {
    feeCalculator = new FeeCalculator()
    vi.clearAllMocks()
  })

  describe('BANKING TRANSACTIONS - Fee Validation', () => {
    describe('Add Transactions (On-Ramp)', () => {
      it('should calculate correct fees for credit card add', () => {
        const fees = feeCalculator.calculateTransactionFeesSync({
          type: 'add',
          amount: 1000,
          paymentMethod: 'credit_debit_card',
          asset: 'USDC'
        })

        expect(fees.diBoaS).toBeCloseTo(0.9, 2) // 1000 * 0.0009
        expect(fees.provider).toBeCloseTo(10, 2) // 1000 * 0.01 (credit card)
        expect(fees.network).toBeCloseTo(0.01, 3) // SOL network fee
        expect(fees.total).toBeCloseTo(10.91, 2)
      })

      it('should calculate correct fees for Apple Pay add', () => {
        const fees = feeCalculator.calculateTransactionFeesSync({
          type: 'add',
          amount: 500,
          paymentMethod: 'apple_pay',
          asset: 'USDC'
        })

        expect(fees.diBoaS).toBeCloseTo(0.45, 2) // 500 * 0.0009
        expect(fees.provider).toBeCloseTo(2.5, 2) // 500 * 0.005 (Apple Pay)
        expect(fees.network).toBeCloseTo(0.005, 3)
        expect(fees.total).toBeCloseTo(2.955, 3)
      })

      it('should calculate correct fees for bank account add', () => {
        const fees = feeCalculator.calculateTransactionFeesSync({
          type: 'add',
          amount: 2000,
          paymentMethod: 'bank_account',
          asset: 'USDC'
        })

        expect(fees.diBoaS).toBeCloseTo(1.8, 2) // 2000 * 0.0009
        expect(fees.provider).toBeCloseTo(10, 2) // 2000 * 0.005 (bank account)
        expect(fees.network).toBeCloseTo(0.02, 3)
        expect(fees.total).toBeCloseTo(11.82, 2)
      })
    })

    describe('Send Transactions (P2P)', () => {
      it('should calculate correct fees for send transaction', () => {
        const fees = feeCalculator.calculateTransactionFeesSync({
          type: 'send',
          amount: 500,
          paymentMethod: null,
          asset: 'USDC'
        })

        expect(fees.diBoaS).toBeCloseTo(0.45, 2) // 500 * 0.0009
        expect(fees.provider).toBe(0) // No provider fee for P2P
        expect(fees.network).toBeCloseTo(0.005, 3) // SOL network fee
        expect(fees.total).toBeCloseTo(0.455, 3)
      })

      it('should have minimal fees for small sends', () => {
        const fees = feeCalculator.calculateTransactionFeesSync({
          type: 'send',
          amount: 10,
          paymentMethod: null,
          asset: 'USDC'
        })

        expect(fees.diBoaS).toBeCloseTo(0.009, 3) // 10 * 0.0009
        expect(fees.provider).toBe(0)
        expect(fees.total).toBeLessThan(0.02) // Very low fees for small amounts
      })
    })

    describe('Withdraw Transactions (Off-Ramp)', () => {
      it('should calculate correct fees for bank account withdrawal', () => {
        const fees = feeCalculator.calculateTransactionFeesSync({
          type: 'withdraw',
          amount: 1000,
          paymentMethod: 'bank_account',
          asset: 'USDC'
        })

        expect(fees.diBoaS).toBeCloseTo(9, 2) // 1000 * 0.009 (withdraw rate)
        expect(fees.provider).toBeCloseTo(5, 2) // 1000 * 0.005 (bank account)
        expect(fees.network).toBeCloseTo(0.01, 3)
        expect(fees.total).toBeCloseTo(14.01, 2)
      })

      it('should calculate higher fees for external wallet withdrawal', () => {
        const fees = feeCalculator.calculateTransactionFeesSync({
          type: 'withdraw',
          amount: 1000,
          paymentMethod: 'external_wallet',
          asset: 'BTC',
          recipient: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' // Valid BTC address
        })

        expect(fees.diBoaS).toBeCloseTo(9, 2) // 1000 * 0.009
        expect(fees.provider).toBeCloseTo(8, 2) // 1000 * 0.008 (DEX fee for external wallet)
        expect(fees.network).toBeCloseTo(90, 2) // BTC 9% network fee
        expect(fees.total).toBeCloseTo(107, 1)
      })
    })
  })

  describe('INVESTING TRANSACTIONS - Fee Validation', () => {
    describe('Buy Transactions', () => {
      it('should calculate correct fees for buy with diBoaS wallet', () => {
        const fees = feeCalculator.calculateTransactionFeesSync({
          type: 'buy',
          amount: 1000,
          paymentMethod: 'diboas_wallet',
          asset: 'BTC'
        })

        expect(fees.diBoaS).toBeCloseTo(0.9, 2) // 1000 * 0.0009
        expect(fees.dex).toBeCloseTo(2, 2) // 1000 * 0.002 (DEX fee)
        expect(fees.provider).toBeCloseTo(2, 2) // DEX fee becomes provider fee
        expect(fees.network).toBeCloseTo(90, 2) // BTC 9% network fee
        expect(fees.total).toBeCloseTo(92.9, 1)
      })

      it('should NOT charge DEX fee for buy with external payment', () => {
        const fees = feeCalculator.calculateTransactionFeesSync({
          type: 'buy',
          amount: 1000,
          paymentMethod: 'credit_debit_card',
          asset: 'ETH'
        })

        expect(fees.diBoaS).toBeCloseTo(0.9, 2)
        expect(fees.dex).toBe(0) // No DEX fee for external payment
        expect(fees.provider).toBeCloseTo(10, 2) // Credit card 1% fee instead
        expect(fees.network).toBeCloseTo(5, 2) // ETH 0.5% network fee
        expect(fees.total).toBeCloseTo(15.9, 1)
      })

      it('should calculate fees for SOL purchases', () => {
        const fees = feeCalculator.calculateTransactionFeesSync({
          type: 'buy',
          amount: 500,
          paymentMethod: 'diboas_wallet',
          asset: 'SOL'
        })

        expect(fees.diBoaS).toBeCloseTo(0.45, 2)
        expect(fees.dex).toBeCloseTo(1, 2) // 500 * 0.002
        expect(fees.provider).toBeCloseTo(1, 2)
        expect(fees.network).toBeCloseTo(0.005, 3) // SOL 0.001% network fee
        expect(fees.total).toBeCloseTo(1.455, 3)
      })
    })

    describe('Sell Transactions', () => {
      it('should calculate correct fees for sell transaction', () => {
        const fees = feeCalculator.calculateTransactionFeesSync({
          type: 'sell',
          amount: 1500,
          paymentMethod: 'diboas_wallet',
          asset: 'ETH'
        })

        expect(fees.diBoaS).toBeCloseTo(1.35, 2) // 1500 * 0.0009
        expect(fees.dex).toBeCloseTo(3, 2) // 1500 * 0.002
        expect(fees.provider).toBeCloseTo(3, 2) // DEX fee
        expect(fees.network).toBeCloseTo(7.5, 2) // ETH 0.5% network fee
        expect(fees.total).toBeCloseTo(11.85, 2)
      })

      it('should handle different assets for sell', () => {
        const btcFees = feeCalculator.calculateTransactionFeesSync({
          type: 'sell',
          amount: 1000,
          paymentMethod: 'diboas_wallet',
          asset: 'BTC'
        })

        const solFees = feeCalculator.calculateTransactionFeesSync({
          type: 'sell',
          amount: 1000,
          paymentMethod: 'diboas_wallet',
          asset: 'SOL'
        })

        // BTC should have higher network fees than SOL
        expect(btcFees.network).toBeGreaterThan(solFees.network)
        expect(btcFees.total).toBeGreaterThan(solFees.total)
        
        // But diBoaS and DEX fees should be the same
        expect(btcFees.diBoaS).toEqual(solFees.diBoaS)
        expect(btcFees.dex).toEqual(solFees.dex)
      })
    })
  })

  describe('YIELD STRATEGY TRANSACTIONS - Fee Validation', () => {
    describe('Start Strategy Transactions', () => {
      it('should calculate correct fees for strategy start with diBoaS wallet', () => {
        const fees = feeCalculator.calculateTransactionFeesSync({
          type: 'start_strategy',
          amount: 5000,
          paymentMethod: 'diboas_wallet',
          asset: 'USDC'
        })

        expect(fees.diBoaS).toBeCloseTo(4.5, 2) // 5000 * 0.0009
        expect(fees.provider).toBeCloseTo(25, 2) // 5000 * 0.005 (DeFi fee)
        expect(fees.network).toBeCloseTo(0.05, 3) // SOL network fee
        expect(fees.total).toBeCloseTo(29.55, 2)
      })

      it('should calculate correct fees for strategy start with external payment', () => {
        const fees = feeCalculator.calculateTransactionFeesSync({
          type: 'start_strategy',
          amount: 3000,
          paymentMethod: 'credit_debit_card',
          asset: 'USDC'
        })

        expect(fees.diBoaS).toBeCloseTo(2.7, 2) // 3000 * 0.0009
        expect(fees.provider).toBeCloseTo(30, 2) // 3000 * 0.01 (credit card, not DeFi)
        expect(fees.network).toBeCloseTo(0.03, 3)
        expect(fees.total).toBeCloseTo(32.73, 2)
      })

      it('should handle large strategy amounts', () => {
        const fees = feeCalculator.calculateTransactionFeesSync({
          type: 'start_strategy',
          amount: 50000,
          paymentMethod: 'diboas_wallet',
          asset: 'USDC'
        })

        expect(fees.diBoaS).toBeCloseTo(45, 2) // 50000 * 0.0009
        expect(fees.provider).toBeCloseTo(250, 2) // 50000 * 0.005
        expect(fees.total).toBeCloseTo(295.5, 1)
      })
    })

    describe('Stop Strategy Transactions', () => {
      it('should calculate correct fees for strategy stop', () => {
        const fees = feeCalculator.calculateTransactionFeesSync({
          type: 'stop_strategy',
          amount: 2500,
          paymentMethod: 'diboas_wallet',
          asset: 'USDC'
        })

        expect(fees.diBoaS).toBeCloseTo(2.25, 2) // 2500 * 0.0009
        expect(fees.provider).toBeCloseTo(12.5, 2) // 2500 * 0.005 (DeFi fee)
        expect(fees.network).toBeCloseTo(0.025, 3)
        expect(fees.total).toBeCloseTo(14.775, 3)
      })

      it('should handle small strategy stop amounts', () => {
        const fees = feeCalculator.calculateTransactionFeesSync({
          type: 'stop_strategy',
          amount: 100,
          paymentMethod: 'diboas_wallet',
          asset: 'USDC'
        })

        expect(fees.diBoaS).toBeCloseTo(0.09, 3) // 100 * 0.0009
        expect(fees.provider).toBeCloseTo(0.5, 2) // 100 * 0.005
        expect(fees.total).toBeCloseTo(0.591, 3)
      })
    })
  })

  describe('EDGE CASES AND PRECISION TESTS', () => {
    describe('Micro Transactions', () => {
      it('should handle very small amounts with proper precision', () => {
        const fees = feeCalculator.calculateTransactionFeesSync({
          type: 'send',
          amount: 0.01,
          paymentMethod: null,
          asset: 'USDC'
        })

        expect(fees.diBoaS).toBeCloseTo(0.000009, 6) // 0.01 * 0.0009
        expect(fees.network).toBeCloseTo(0.0000001, 7) // 0.01 * 0.00001
        expect(fees.total).toBeGreaterThan(0)
        expect(fees.total).toBeLessThan(0.01) // Fees should be less than amount
      })

      it('should handle fractional cent amounts', () => {
        const fees = feeCalculator.calculateTransactionFeesSync({
          type: 'add',
          amount: 0.1,
          paymentMethod: 'credit_debit_card',
          asset: 'USDC'
        })

        expect(fees.diBoaS).toBeCloseTo(0.00009, 5)
        expect(fees.provider).toBeCloseTo(0.001, 3)
        expect(fees.total).toBeLessThan(0.01)
      })
    })

    describe('Large Transaction Tests', () => {
      it('should handle very large amounts correctly', () => {
        const fees = feeCalculator.calculateTransactionFeesSync({
          type: 'buy',
          amount: 1000000, // $1M
          paymentMethod: 'diboas_wallet',
          asset: 'BTC'
        })

        expect(fees.diBoaS).toBeCloseTo(900, 2) // 1M * 0.0009
        expect(fees.dex).toBeCloseTo(2000, 2) // 1M * 0.002
        expect(fees.provider).toBeCloseTo(2000, 2)
        expect(fees.network).toBeCloseTo(90000, 2) // 1M * 0.09 (BTC)
        expect(fees.total).toBeCloseTo(92900, 1)
      })
    })

    describe('Asset-Specific Network Fees', () => {
      it('should apply different network fees for different assets', () => {
        const amount = 1000
        
        const btcFees = feeCalculator.calculateTransactionFeesSync({
          type: 'transfer',
          amount,
          asset: 'BTC'
        })

        const ethFees = feeCalculator.calculateTransactionFeesSync({
          type: 'transfer',
          amount,
          asset: 'ETH'
        })

        const solFees = feeCalculator.calculateTransactionFeesSync({
          type: 'transfer',
          amount,
          asset: 'SOL'
        })

        // BTC should have highest network fees (9%)
        expect(btcFees.network).toBeCloseTo(90, 2)
        // ETH should have moderate network fees (0.5%)
        expect(ethFees.network).toBeCloseTo(5, 2)
        // SOL should have lowest network fees (0.001%)
        expect(solFees.network).toBeCloseTo(0.01, 3)

        // Verify fee hierarchy
        expect(btcFees.network).toBeGreaterThan(ethFees.network)
        expect(ethFees.network).toBeGreaterThan(solFees.network)
      })
    })
  })

  describe('PAYMENT METHOD VARIATIONS', () => {
    describe('Credit Card vs Apple Pay vs Bank Account', () => {
      it('should apply different provider fees for different payment methods', () => {
        const amount = 1000
        const transactionBase = { type: 'add', amount, asset: 'USDC' }

        const creditCardFees = feeCalculator.calculateTransactionFeesSync({
          ...transactionBase,
          paymentMethod: 'credit_debit_card'
        })

        const applePayFees = feeCalculator.calculateTransactionFeesSync({
          ...transactionBase,
          paymentMethod: 'apple_pay'
        })

        const bankAccountFees = feeCalculator.calculateTransactionFeesSync({
          ...transactionBase,
          paymentMethod: 'bank_account'
        })

        // Credit card: 1% = $10
        expect(creditCardFees.provider).toBeCloseTo(10, 2)
        // Apple Pay: 0.5% = $5
        expect(applePayFees.provider).toBeCloseTo(5, 2)
        // Bank account: 0.5% = $5
        expect(bankAccountFees.provider).toBeCloseTo(5, 2)

        // Verify fee hierarchy: Credit Card > Apple Pay = Bank Account
        expect(creditCardFees.provider).toBeGreaterThan(applePayFees.provider)
        expect(applePayFees.provider).toEqual(bankAccountFees.provider)
      })
    })

    describe('diBoaS Wallet vs External Payment Methods', () => {
      it('should apply DEX fees only for diBoaS wallet transactions', () => {
        const amount = 1000
        const buyBase = { type: 'buy', amount, asset: 'BTC' }

        const diBoaSWalletFees = feeCalculator.calculateTransactionFeesSync({
          ...buyBase,
          paymentMethod: 'diboas_wallet'
        })

        const externalPaymentFees = feeCalculator.calculateTransactionFeesSync({
          ...buyBase,
          paymentMethod: 'credit_debit_card'
        })

        // diBoaS wallet should have DEX fee
        expect(diBoaSWalletFees.dex).toBeCloseTo(2, 2) // 1000 * 0.002
        expect(diBoaSWalletFees.provider).toBeCloseTo(2, 2) // DEX fee

        // External payment should NOT have DEX fee
        expect(externalPaymentFees.dex).toBe(0)
        expect(externalPaymentFees.provider).toBeCloseTo(10, 2) // Payment provider fee
      })
    })
  })

  describe('TRANSACTION TYPE CONSISTENCY', () => {
    describe('Fee Rate Verification', () => {
      it('should apply consistent diBoaS fee rates across transaction types', () => {
        const amount = 1000

        // Send: 0.09%
        const sendFees = feeCalculator.calculateTransactionFeesSync({
          type: 'send',
          amount
        })

        // Buy: 0.09%
        const buyFees = feeCalculator.calculateTransactionFeesSync({
          type: 'buy',
          amount,
          paymentMethod: 'diboas_wallet',
          asset: 'SOL'
        })

        // Add: 0.09%
        const addFees = feeCalculator.calculateTransactionFeesSync({
          type: 'add',
          amount,
          paymentMethod: 'credit_debit_card'
        })

        // Withdraw: 0.9% (higher)
        const withdrawFees = feeCalculator.calculateTransactionFeesSync({
          type: 'withdraw',
          amount,
          paymentMethod: 'bank_account'
        })

        expect(sendFees.diBoaS).toBeCloseTo(0.9, 2) // 1000 * 0.0009
        expect(buyFees.diBoaS).toBeCloseTo(0.9, 2) // 1000 * 0.0009
        expect(addFees.diBoaS).toBeCloseTo(0.9, 2) // 1000 * 0.0009
        expect(withdrawFees.diBoaS).toBeCloseTo(9, 2) // 1000 * 0.009 (higher)
      })

      it('should apply correct DeFi fees for strategy transactions', () => {
        const amount = 10000

        const startStrategyFees = feeCalculator.calculateTransactionFeesSync({
          type: 'start_strategy',
          amount,
          paymentMethod: 'diboas_wallet'
        })

        const stopStrategyFees = feeCalculator.calculateTransactionFeesSync({
          type: 'stop_strategy',
          amount,
          paymentMethod: 'diboas_wallet'
        })

        // Both should have 0.5% DeFi fee
        expect(startStrategyFees.provider).toBeCloseTo(50, 2) // 10000 * 0.005
        expect(stopStrategyFees.provider).toBeCloseTo(50, 2) // 10000 * 0.005
      })
    })
  })

  describe('PERFORMANCE VALIDATION', () => {
    it('should calculate fees efficiently for multiple transactions', () => {
      const start = performance.now()

      // Calculate fees for 1000 transactions
      for (let i = 0; i < 1000; i++) {
        feeCalculator.calculateTransactionFeesSync({
          type: 'buy',
          amount: 100 + i,
          paymentMethod: 'diboas_wallet',
          asset: 'BTC'
        })
      }

      const duration = performance.now() - start
      expect(duration).toBeLessThan(100) // Should complete within 100ms
    })

    it('should produce consistent results across multiple calls', () => {
      const transactionData = {
        type: 'start_strategy',
        amount: 5000,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC'
      }

      const results = []
      for (let i = 0; i < 10; i++) {
        results.push(feeCalculator.calculateTransactionFeesSync(transactionData))
      }

      // All results should be identical
      const firstResult = results[0]
      results.forEach(result => {
        expect(result.diBoaS).toEqual(firstResult.diBoaS)
        expect(result.provider).toEqual(firstResult.provider)
        expect(result.total).toEqual(firstResult.total)
      })
    })
  })
})