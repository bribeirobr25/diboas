/**
 * All Categories Integration Tests
 * Comprehensive test suite ensuring all transaction categories work properly
 * Tests Banking, Investment, and Yield Strategy transactions end-to-end
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FeeCalculator } from '../../utils/feeCalculations.js'

describe('All Categories Integration Tests', () => {
  let feeCalculator

  beforeEach(() => {
    feeCalculator = new FeeCalculator()
  })

  describe('Banking Category - Complete Flow', () => {
    it('should handle Add → Send → Withdraw flow', async () => {
      // Step 1: User adds funds with Apple Pay
      const addResult = await feeCalculator.calculateTransactionFees({
        type: 'add',
        amount: 1000,
        paymentMethod: 'apple_pay',
        asset: 'USDC',
        chains: ['SOL']
      })

      expect(addResult.total).toBeGreaterThan(0)
      expect(addResult.diboas).toBeCloseTo(0.9, 2) // 0.09% diBoaS
      expect(addResult.providerFee).toBeCloseTo(5, 2) // 0.5% Apple Pay
      expect(addResult.networkFee).toBeCloseTo(0.01, 3) // SOL network

      // Step 2: User sends money to friend
      const sendResult = await feeCalculator.calculateTransactionFees({
        type: 'send',
        amount: 200,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['SOL']
      })

      expect(sendResult.total).toBeGreaterThan(0)
      expect(sendResult.diboas).toBeCloseTo(0.18, 2) // 0.09% diBoaS
      expect(sendResult.providerFee).toBe(0) // No provider fee for diBoaS wallet
      expect(sendResult.networkFee).toBeCloseTo(0.002, 3) // SOL network

      // Step 3: User withdraws remaining funds
      const withdrawResult = await feeCalculator.calculateTransactionFees({
        type: 'withdraw',
        amount: 700,
        paymentMethod: 'bank_account',
        asset: 'USDC',
        chains: ['SOL']
      })

      expect(withdrawResult.total).toBeGreaterThan(0)
      expect(withdrawResult.diboas).toBeCloseTo(6.3, 2) // 0.9% diBoaS for withdraw
      expect(withdrawResult.providerFee).toBeCloseTo(14, 2) // 2% bank account withdraw
      expect(withdrawResult.networkFee).toBeCloseTo(0.007, 3) // SOL network
    })

    it('should handle all payment methods for Add transactions', async () => {
      const paymentMethods = [
        { method: 'apple_pay', expectedRate: 0.005 },
        { method: 'google_pay', expectedRate: 0.005 },
        { method: 'credit_debit_card', expectedRate: 0.01 },
        { method: 'bank_account', expectedRate: 0.01 },
        { method: 'paypal', expectedRate: 0.03 }
      ]

      for (const { method, expectedRate } of paymentMethods) {
        const result = await feeCalculator.calculateTransactionFees({
          type: 'add',
          amount: 100,
          paymentMethod: method,
          asset: 'USDC',
          chains: ['SOL']
        })

        expect(result.total).toBeGreaterThan(0)
        expect(result.diboas).toBeCloseTo(0.09, 2) // 0.09% diBoaS
        expect(result.providerFee).toBeCloseTo(100 * expectedRate, 2)
      }
    })
  })

  describe('Investment Category - Complete Flow', () => {
    it('should handle Buy → Sell → Transfer flow', async () => {
      // Step 1: User buys Bitcoin with diBoaS wallet
      const buyResult = await feeCalculator.calculateTransactionFees({
        type: 'buy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'BTC',
        chains: ['BTC']
      })

      expect(buyResult.total).toBeGreaterThan(0)
      expect(buyResult.diboas).toBeCloseTo(0.9, 2) // 0.09% diBoaS
      expect(buyResult.networkFee).toBeCloseTo(90, 2) // 9% BTC network
      expect(buyResult.dexFee).toBeCloseTo(10, 2) // 1% DEX fee for buy
      expect(buyResult.providerFee).toBe(0) // No provider fee for diBoaS wallet

      // Step 2: User sells Bitcoin (gained value)
      const sellResult = await feeCalculator.calculateTransactionFees({
        type: 'sell',
        amount: 1200,
        paymentMethod: 'diboas_wallet',
        asset: 'BTC',
        chains: ['BTC']
      })

      expect(sellResult.total).toBeGreaterThan(0)
      expect(sellResult.diboas).toBeCloseTo(1.08, 2) // 0.09% diBoaS
      expect(sellResult.networkFee).toBeCloseTo(108, 2) // 9% BTC network
      expect(sellResult.dexFee).toBeCloseTo(12, 2) // 1% DEX fee for sell

      // Step 3: User transfers to external wallet
      const transferResult = await feeCalculator.calculateTransactionFees({
        type: 'transfer',
        amount: 500,
        paymentMethod: 'diboas_wallet',
        asset: 'BTC',
        chains: ['BTC']
      })

      expect(transferResult.total).toBeGreaterThan(0)
      expect(transferResult.diboas).toBeCloseTo(4.5, 2) // 0.9% diBoaS for transfer
      expect(transferResult.networkFee).toBeCloseTo(45, 2) // 9% BTC network
      expect(transferResult.dexFee).toBeCloseTo(4, 2) // 0.8% DEX fee for transfer
    })

    it('should handle different crypto assets correctly', async () => {
      const cryptoAssets = [
        { asset: 'BTC', chain: 'BTC', networkRate: 0.09 },
        { asset: 'ETH', chain: 'ETH', networkRate: 0.005 },
        { asset: 'SOL', chain: 'SOL', networkRate: 0.00001 },
        { asset: 'SUI', chain: 'SUI', networkRate: 0.00003 }
      ]

      for (const { asset, chain, networkRate } of cryptoAssets) {
        const result = await feeCalculator.calculateTransactionFees({
          type: 'buy',
          amount: 1000,
          paymentMethod: 'diboas_wallet',
          asset,
          chains: [chain]
        })

        expect(result.total).toBeGreaterThan(0)
        expect(result.diboas).toBeCloseTo(0.9, 2) // 0.09% diBoaS
        expect(result.networkFee).toBeCloseTo(1000 * networkRate, 4)
        expect(result.dexFee).toBeCloseTo(10, 2) // 1% DEX fee
      }
    })

    it('should handle buy with external payment methods', async () => {
      const result = await feeCalculator.calculateTransactionFees({
        type: 'buy',
        amount: 500,
        paymentMethod: 'credit_debit_card',
        asset: 'ETH',
        chains: ['ETH']
      })

      expect(result.total).toBeGreaterThan(0)
      expect(result.diboas).toBeCloseTo(0.45, 2) // 0.09% diBoaS
      expect(result.networkFee).toBeCloseTo(2.5, 2) // 0.5% ETH network
      expect(result.providerFee).toBeCloseTo(5, 2) // 1% credit card fee
      expect(result.dexFee).toBe(0) // No DEX fee when using external payment
    })
  })

  describe('Yield Strategy Category - Complete Flow', () => {
    it('should handle Start → Stop strategy flow', async () => {
      // Step 1: User starts DeFi strategy on Solana
      const startResult = await feeCalculator.calculateTransactionFees({
        type: 'start_strategy',
        amount: 2000,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['SOL']
      })

      expect(startResult.total).toBeGreaterThan(0)
      expect(startResult.diboas).toBeCloseTo(1.8, 2) // 0.09% diBoaS
      expect(startResult.networkFee).toBeCloseTo(0.02, 3) // SOL network
      expect(startResult.dexFee).toBeCloseTo(10, 2) // 0.5% DEX fee for strategies
      expect(startResult.providerFee).toBeCloseTo(10, 2) // DEX fee shown as provider
      expect(startResult.defiFee).toBe(0) // No DeFi fee for strategies

      // Step 2: User stops strategy later (with gains)
      const stopResult = await feeCalculator.calculateTransactionFees({
        type: 'stop_strategy',
        amount: 2500,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['SOL']
      })

      expect(stopResult.total).toBeGreaterThan(0)
      expect(stopResult.diboas).toBeCloseTo(2.25, 2) // 0.09% diBoaS
      expect(stopResult.networkFee).toBeCloseTo(0.025, 3) // SOL network
      expect(stopResult.dexFee).toBeCloseTo(12.5, 2) // 0.5% DEX fee for strategies
      expect(stopResult.defiFee).toBe(0) // No DeFi fee for strategies
    })

    it('should handle strategies on all supported chains', async () => {
      const chains = [
        { chain: 'SOL', networkRate: 0.00001 },
        { chain: 'ETH', networkRate: 0.005 },
        { chain: 'SUI', networkRate: 0.00003 }
      ]

      for (const { chain, networkRate } of chains) {
        const result = await feeCalculator.calculateTransactionFees({
          type: 'start_strategy',
          amount: 1000,
          paymentMethod: 'diboas_wallet',
          asset: 'USDC',
          chains: [chain]
        })

        expect(result.total).toBeGreaterThan(0)
        expect(result.diboas).toBeCloseTo(0.9, 2) // 0.09% diBoaS
        expect(result.networkFee).toBeCloseTo(1000 * networkRate, 4)
        expect(result.dexFee).toBeCloseTo(5, 2) // 0.5% DEX fee
        expect(result.providerFee).toBeCloseTo(5, 2) // DEX fee as provider
        expect(result.defiFee).toBe(0) // No DeFi fee
      }
    })

    it('should enforce diBoaS wallet only for strategies', async () => {
      const externalMethods = ['credit_debit_card', 'apple_pay', 'bank_account']

      for (const method of externalMethods) {
        const result = await feeCalculator.calculateTransactionFees({
          type: 'start_strategy',
          amount: 1000,
          paymentMethod: method, // Should be ignored
          asset: 'USDC',
          chains: ['SOL']
        })

        // Should still work but only show DEX fees, no external payment fees
        expect(result.total).toBeGreaterThan(0)
        expect(result.diboas).toBeCloseTo(0.9, 2)
        expect(result.dexFee).toBeCloseTo(5, 2)
        expect(result.providerFee).toBeCloseTo(5, 2) // DEX fee shown as provider
      }
    })
  })

  describe('Cross-Category Workflows', () => {
    it('should handle Add → Buy → Start Strategy workflow', async () => {
      // Step 1: Add funds
      const addResult = await feeCalculator.calculateTransactionFees({
        type: 'add',
        amount: 3000,
        paymentMethod: 'apple_pay',
        asset: 'USDC',
        chains: ['SOL']
      })
      expect(addResult.total).toBeGreaterThan(0)

      // Step 2: Buy crypto
      const buyResult = await feeCalculator.calculateTransactionFees({
        type: 'buy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'ETH',
        chains: ['ETH']
      })
      expect(buyResult.total).toBeGreaterThan(0)

      // Step 3: Start DeFi strategy
      const strategyResult = await feeCalculator.calculateTransactionFees({
        type: 'start_strategy',
        amount: 2000,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['ETH']
      })
      expect(strategyResult.total).toBeGreaterThan(0)
      expect(strategyResult.dexFee).toBeCloseTo(10, 2) // 0.5% strategy DEX fee
    })

    it('should handle complete investment exit workflow', async () => {
      // Step 1: Stop strategy
      const stopResult = await feeCalculator.calculateTransactionFees({
        type: 'stop_strategy',
        amount: 2200,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['ETH']
      })
      expect(stopResult.total).toBeGreaterThan(0)

      // Step 2: Sell crypto
      const sellResult = await feeCalculator.calculateTransactionFees({
        type: 'sell',
        amount: 1100,
        paymentMethod: 'diboas_wallet',
        asset: 'ETH',
        chains: ['ETH']
      })
      expect(sellResult.total).toBeGreaterThan(0)

      // Step 3: Withdraw to bank
      const withdrawResult = await feeCalculator.calculateTransactionFees({
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'bank_account',
        asset: 'USDC',
        chains: ['SOL']
      })
      expect(withdrawResult.total).toBeGreaterThan(0)
    })
  })

  describe('Fee Structure Consistency', () => {
    it('should maintain consistent diBoaS fees across categories', async () => {
      const amount = 1000

      // Banking transactions
      const addFees = await feeCalculator.calculateTransactionFees({
        type: 'add',
        amount,
        paymentMethod: 'diboas_wallet'
      })
      
      const sendFees = await feeCalculator.calculateTransactionFees({
        type: 'send',
        amount,
        paymentMethod: 'diboas_wallet'
      })

      // Investment transactions
      const buyFees = await feeCalculator.calculateTransactionFees({
        type: 'buy',
        amount,
        paymentMethod: 'diboas_wallet'
      })

      // Strategy transactions
      const strategyFees = await feeCalculator.calculateTransactionFees({
        type: 'start_strategy',
        amount,
        paymentMethod: 'diboas_wallet'
      })

      // All should have 0.09% diBoaS fee (except withdraw/transfer which is 0.9%)
      expect(addFees.diboas).toBeCloseTo(0.9, 2) // 0.09%
      expect(sendFees.diboas).toBeCloseTo(0.9, 2) // 0.09%
      expect(buyFees.diboas).toBeCloseTo(0.9, 2) // 0.09%
      expect(strategyFees.diboas).toBeCloseTo(0.9, 2) // 0.09%
    })

    it('should have correct DEX fees by transaction type', async () => {
      const amount = 1000

      const buyFees = await feeCalculator.calculateTransactionFees({
        type: 'buy',
        amount,
        paymentMethod: 'diboas_wallet'
      })

      const sellFees = await feeCalculator.calculateTransactionFees({
        type: 'sell',
        amount,
        paymentMethod: 'diboas_wallet'
      })

      const transferFees = await feeCalculator.calculateTransactionFees({
        type: 'transfer',
        amount,
        paymentMethod: 'diboas_wallet'
      })

      const strategyFees = await feeCalculator.calculateTransactionFees({
        type: 'start_strategy',
        amount,
        paymentMethod: 'diboas_wallet'
      })

      expect(buyFees.dexFee).toBeCloseTo(10, 2) // 1% for buy
      expect(sellFees.dexFee).toBeCloseTo(10, 2) // 1% for sell
      expect(transferFees.dexFee).toBeCloseTo(8, 2) // 0.8% for transfer
      expect(strategyFees.dexFee).toBeCloseTo(5, 2) // 0.5% for strategies
    })
  })

  describe('Error Recovery and Edge Cases', () => {
    it('should handle minimum amounts across all categories', async () => {
      const minAmount = 1 // Very small amount

      const categories = [
        { type: 'add', paymentMethod: 'diboas_wallet' },
        { type: 'send', paymentMethod: 'diboas_wallet' },
        { type: 'buy', paymentMethod: 'diboas_wallet' },
        { type: 'sell', paymentMethod: 'diboas_wallet' },
        { type: 'start_strategy', paymentMethod: 'diboas_wallet' }
      ]

      for (const { type, paymentMethod } of categories) {
        const result = await feeCalculator.calculateTransactionFees({
          type,
          amount: minAmount,
          paymentMethod
        })

        expect(result.total).toBeGreaterThan(0)
        expect(result.diboas).toBeGreaterThan(0)
      }
    })

    it('should handle large amounts across all categories', async () => {
      const largeAmount = 100000 // $100k

      const categories = [
        { type: 'add', paymentMethod: 'apple_pay' },
        { type: 'buy', paymentMethod: 'diboas_wallet' },
        { type: 'start_strategy', paymentMethod: 'diboas_wallet' }
      ]

      for (const { type, paymentMethod } of categories) {
        const result = await feeCalculator.calculateTransactionFees({
          type,
          amount: largeAmount,
          paymentMethod
        })

        expect(result.total).toBeGreaterThan(0)
        expect(result.total).toBeLessThan(largeAmount) // Sanity check
      }
    })
  })
})