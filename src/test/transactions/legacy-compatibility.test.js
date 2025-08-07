/**
 * Legacy Compatibility Tests
 * Tests backward compatibility for the calculateTransactionFees method
 * to ensure existing transaction flows continue to work
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FeeCalculator, centralizedFeeCalculator } from '../../utils/feeCalculations.js'

describe('Legacy Compatibility Tests', () => {
  let feeCalculator

  beforeEach(() => {
    feeCalculator = new FeeCalculator()
  })

  describe('calculateTransactionFees Method', () => {
    it('should be available as a method', () => {
      expect(typeof feeCalculator.calculateTransactionFees).toBe('function')
    })

    it('should be async and return a Promise', async () => {
      const result = feeCalculator.calculateTransactionFees({
        type: 'add',
        amount: 100,
        paymentMethod: 'diboas_wallet'
      })

      expect(result).toBeInstanceOf(Promise)
      await expect(result).resolves.toBeDefined()
    })

    it('should return fees in legacy format for Banking Add transaction', async () => {
      const transactionData = {
        type: 'add',
        amount: 100,
        paymentMethod: 'credit_debit_card',
        asset: 'USDC',
        chains: ['SOL']
      }

      const fees = await feeCalculator.calculateTransactionFees(transactionData)

      // Check legacy field names are present
      expect(fees.diboas).toBeDefined()
      expect(fees.platformFee).toBeDefined()
      expect(fees.networkFee).toBeDefined()
      expect(fees.providerFee).toBeDefined()
      expect(fees.dexFee).toBeDefined()
      expect(fees.defiFee).toBeDefined()
      expect(fees.total).toBeDefined()
      expect(fees.total).toBeDefined()

      // Check new field names are also present
      expect(fees.diBoaS).toBeDefined()
      expect(fees.network).toBeDefined()
      expect(fees.provider).toBeDefined()
      expect(fees.dex).toBeDefined()
      expect(fees.defi).toBeDefined()
      expect(fees.total).toBeDefined()

      // Check values match between old and new formats
      expect(fees.diboas).toBe(fees.diBoaS)
      expect(fees.platformFee).toBe(fees.diBoaS)
      expect(fees.networkFee).toBe(fees.network)
      expect(fees.providerFee).toBe(fees.provider)
      expect(fees.dexFee).toBe(fees.dex)
      expect(fees.defiFee).toBe(fees.defi)
      expect(fees.total).toBe(fees.total)
      expect(fees.total).toBe(fees.total)
    })

    it('should handle Banking category transactions correctly', async () => {
      // Add transaction
      const addFees = await feeCalculator.calculateTransactionFees({
        type: 'add',
        amount: 100,
        paymentMethod: 'apple_pay'
      })
      expect(addFees.total).toBeGreaterThan(0)

      // Send transaction  
      const sendFees = await feeCalculator.calculateTransactionFees({
        type: 'send',
        amount: 50,
        paymentMethod: 'diboas_wallet'
      })
      expect(sendFees.total).toBeGreaterThan(0)

      // Withdraw transaction
      const withdrawFees = await feeCalculator.calculateTransactionFees({
        type: 'withdraw',
        amount: 75,
        paymentMethod: 'bank_account'
      })
      expect(withdrawFees.total).toBeGreaterThan(0)
    })

    it('should handle Investment category transactions correctly', async () => {
      // Buy transaction
      const buyFees = await feeCalculator.calculateTransactionFees({
        type: 'buy',
        amount: 500,
        paymentMethod: 'diboas_wallet',
        asset: 'BTC',
        chains: ['BTC']
      })
      expect(buyFees.total).toBeGreaterThan(0)
      expect(buyFees.dexFee).toBeGreaterThan(0) // Should have DEX fee

      // Sell transaction
      const sellFees = await feeCalculator.calculateTransactionFees({
        type: 'sell',
        amount: 300,
        paymentMethod: 'diboas_wallet',
        asset: 'ETH',
        chains: ['ETH']
      })
      expect(sellFees.total).toBeGreaterThan(0)
      expect(sellFees.dexFee).toBeGreaterThan(0) // Should have DEX fee

      // Transfer transaction
      const transferFees = await feeCalculator.calculateTransactionFees({
        type: 'transfer',
        amount: 200,
        paymentMethod: 'diboas_wallet',
        asset: 'SOL',
        chains: ['SOL']
      })
      expect(transferFees.total).toBeGreaterThan(0)
      expect(transferFees.dexFee).toBeGreaterThan(0) // Should have DEX fee
    })

    it('should handle Yield Strategy transactions correctly', async () => {
      // Start strategy transaction
      const startFees = await feeCalculator.calculateTransactionFees({
        type: 'start_strategy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['SOL']
      })
      
      expect(startFees.total).toBeGreaterThan(0)
      expect(startFees.diboas).toBeCloseTo(0.9, 2) // 0.09% diBoaS fee
      expect(startFees.dexFee).toBeCloseTo(5, 2) // 0.5% DEX fee for strategies
      expect(startFees.providerFee).toBeCloseTo(5, 2) // DEX fee shown as provider fee
      expect(startFees.defiFee).toBe(0) // No DeFi fee for strategies

      // Stop strategy transaction
      const stopFees = await feeCalculator.calculateTransactionFees({
        type: 'stop_strategy',
        amount: 1200,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['SOL']
      })
      
      expect(stopFees.total).toBeGreaterThan(0)
      expect(stopFees.diboas).toBeCloseTo(1.08, 2) // 0.09% diBoaS fee
      expect(stopFees.dexFee).toBeCloseTo(6, 2) // 0.5% DEX fee for strategies
      expect(stopFees.defiFee).toBe(0) // No DeFi fee for strategies
    })

    it('should handle routing plans for cross-chain transactions', async () => {
      const transactionData = {
        type: 'buy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'BTC',
        chains: ['SOL'] // Start on SOL
      }

      const routingPlan = {
        targetChains: ['BTC'] // Route to BTC network
      }

      const fees = await feeCalculator.calculateTransactionFees(transactionData, routingPlan)
      
      expect(fees.total).toBeGreaterThan(0)
      expect(fees.networkFee).toBeCloseTo(90, 2) // Should use BTC network fee (9%)
    })

    it('should use default values for missing fields', async () => {
      const minimalData = {
        type: 'add',
        amount: 100
      }

      const fees = await feeCalculator.calculateTransactionFees(minimalData)
      
      expect(fees.total).toBeGreaterThan(0)
      // Should default to diboas_wallet payment method, SOL asset, SOL chain
    })

    it('should handle concurrent legacy method calls', async () => {
      const promises = []
      
      for (let i = 0; i < 5; i++) {
        promises.push(
          feeCalculator.calculateTransactionFees({
            type: 'add',
            amount: 100 + i * 10,
            paymentMethod: 'diboas_wallet'
          })
        )
      }

      const results = await Promise.all(promises)
      
      expect(results).toHaveLength(5)
      results.forEach((result, index) => {
        expect(result.total).toBeGreaterThan(0)
        expect(result.diboas).toBeDefined()
        expect(result.total).toBeDefined()
      })
    })

    it('should maintain calculation accuracy across formats', async () => {
      const transactionData = {
        type: 'buy',
        amount: 1234.56,
        paymentMethod: 'credit_debit_card',
        asset: 'ETH',
        chains: ['ETH']
      }

      const legacyFees = await feeCalculator.calculateTransactionFees(transactionData)
      const newFees = feeCalculator.calculateFees(transactionData)

      // Legacy format should match new format exactly
      expect(legacyFees.diBoaS).toBeCloseTo(newFees.diBoaS, 6)
      expect(legacyFees.network).toBeCloseTo(newFees.network, 6)
      expect(legacyFees.provider).toBeCloseTo(newFees.provider, 6)
      expect(legacyFees.dex).toBeCloseTo(newFees.dex, 6)
      expect(legacyFees.total).toBeCloseTo(newFees.total, 6)
    })

    it('should handle error conditions appropriately', async () => {
      // Test invalid transaction type
      await expect(feeCalculator.calculateTransactionFees({
        type: null,
        amount: 100
      })).rejects.toThrow('Fee calculation failed')

      // Test invalid amount
      await expect(feeCalculator.calculateTransactionFees({
        type: 'add',
        amount: 0
      })).rejects.toThrow('Fee calculation failed')

      // Test negative amount
      await expect(feeCalculator.calculateTransactionFees({
        type: 'add',
        amount: -100
      })).rejects.toThrow('Fee calculation failed')
    })
  })

  describe('Integration with Real Transaction Flow', () => {
    it('should work with the exact data format from useTransactions hook', async () => {
      // This mimics the exact data structure from the actual transaction hook
      const hookTransactionData = {
        type: 'add',
        amount: 100,
        paymentMethod: 'credit_debit_card',
        asset: 'USDC',
        chains: ['SOL'],
        recipient: null,
        description: 'Add funds to wallet'
      }

      const fees = await feeCalculator.calculateTransactionFees(hookTransactionData)
      
      expect(fees).toBeDefined()
      expect(fees.total).toBeGreaterThan(0)
      expect(fees.diboas).toBeCloseTo(0.09, 2)
      expect(fees.providerFee).toBeCloseTo(1, 2) // 1% credit card fee
    })

    it('should handle real Banking Add transaction as used in the app', async () => {
      const realTransactionData = {
        type: 'add',
        amount: 100,
        paymentMethod: 'apple_pay',
        asset: 'USDC',
        chains: ['SOL'],
        recipient: null,
        description: 'Add funds via Apple Pay',
        metadata: {
          category: 'banking',
          subcategory: 'add'
        }
      }

      const fees = await feeCalculator.calculateTransactionFees(realTransactionData)
      
      expect(fees.total).toBeGreaterThan(0)
      expect(fees.diboas).toBeCloseTo(0.09, 2) // 0.09% diBoaS fee
      expect(fees.providerFee).toBeCloseTo(0.5, 2) // 0.5% Apple Pay fee
      expect(fees.networkFee).toBeCloseTo(0.001, 3) // SOL network fee
    })

    it('should handle Investment Buy transaction correctly', async () => {
      const buyTransactionData = {
        type: 'buy',
        amount: 500,
        paymentMethod: 'diboas_wallet',
        asset: 'BTC',
        chains: ['BTC'],
        recipient: null,
        description: 'Buy Bitcoin'
      }

      const fees = await feeCalculator.calculateTransactionFees(buyTransactionData)
      
      expect(fees.total).toBeGreaterThan(0)
      expect(fees.diboas).toBeCloseTo(0.45, 2) // 0.09% diBoaS fee
      expect(fees.networkFee).toBeCloseTo(45, 2) // 9% BTC network fee
      expect(fees.dexFee).toBeCloseTo(5, 2) // 1% DEX fee for buy
    })

    it('should handle Strategy Start transaction correctly', async () => {
      const strategyTransactionData = {
        type: 'start_strategy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['ETH'],
        recipient: null,
        description: 'Start DeFi strategy on Ethereum'
      }

      const fees = await feeCalculator.calculateTransactionFees(strategyTransactionData)
      
      expect(fees.total).toBeGreaterThan(0)
      expect(fees.diboas).toBeCloseTo(0.9, 2) // 0.09% diBoaS fee
      expect(fees.networkFee).toBeCloseTo(5, 2) // 0.5% ETH network fee
      expect(fees.dexFee).toBeCloseTo(5, 2) // 0.5% DEX fee for strategies
      expect(fees.providerFee).toBeCloseTo(5, 2) // DEX fee shown as provider fee
      expect(fees.defiFee).toBe(0) // No DeFi fee for strategies
    })
  })

  describe('Default Fee Calculator Instance', () => {
    it('should work with the centralized fee calculator instance', async () => {
      const fees = await centralizedFeeCalculator.calculateTransactionFees({
        type: 'send',
        amount: 50,
        paymentMethod: 'diboas_wallet'
      })
      
      expect(fees.total).toBeGreaterThan(0)
      expect(fees.diboas).toBeDefined()
      expect(fees.total).toBeDefined()
    })
  })
})