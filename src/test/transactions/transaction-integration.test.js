/**
 * Transaction Integration Tests
 * Tests all transaction types across all categories to ensure they work correctly
 * with the updated fee calculation system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FeeCalculator, centralizedFeeCalculator } from '../../utils/feeCalculations.js'

describe('Transaction Integration Tests - All Categories', () => {
  let feeCalculator

  beforeEach(() => {
    feeCalculator = new FeeCalculator()
  })

  describe('Banking Category Transactions', () => {
    describe('Add Transaction (On-Ramp)', () => {
      it('should calculate fees correctly for credit card add', async () => {
        const transactionData = {
          type: 'add',
          amount: 100,
          paymentMethod: 'credit_debit_card',
          asset: 'USDC',
          chains: ['SOL']
        }

        const fees = await feeCalculator.calculateTransactionFees(transactionData)
        
        expect(fees.diboas).toBeCloseTo(0.09, 2) // 0.09% diBoaS fee
        expect(fees.networkFee).toBeCloseTo(0.001, 3) // SOL network fee
        expect(fees.providerFee).toBeCloseTo(1, 2) // 1% credit card fee
        expect(fees.totalFees).toBeGreaterThan(0)
      })

      it('should calculate fees correctly for Apple Pay add', async () => {
        const transactionData = {
          type: 'add',
          amount: 500,
          paymentMethod: 'apple_pay',
          asset: 'USDC',
          chains: ['SOL']
        }

        const fees = await feeCalculator.calculateTransactionFees(transactionData)
        
        expect(fees.diboas).toBeCloseTo(0.45, 2) // 0.09% diBoaS fee
        expect(fees.providerFee).toBeCloseTo(2.5, 2) // 0.5% Apple Pay fee
        expect(fees.totalFees).toBeGreaterThan(0)
      })

      it('should calculate fees correctly for bank account add', async () => {
        const transactionData = {
          type: 'add',
          amount: 1000,
          paymentMethod: 'bank_account',
          asset: 'USDC',
          chains: ['SOL']
        }

        const fees = await feeCalculator.calculateTransactionFees(transactionData)
        
        expect(fees.diboas).toBeCloseTo(0.9, 2) // 0.09% diBoaS fee
        expect(fees.providerFee).toBeCloseTo(10, 2) // 1% bank account fee
        expect(fees.totalFees).toBeGreaterThan(0)
      })
    })

    describe('Send Transaction (P2P)', () => {
      it('should calculate fees correctly for send transaction', async () => {
        const transactionData = {
          type: 'send',
          amount: 200,
          paymentMethod: 'diboas_wallet',
          asset: 'USDC',
          chains: ['SOL']
        }

        const fees = await feeCalculator.calculateTransactionFees(transactionData)
        
        expect(fees.diboas).toBeCloseTo(0.18, 2) // 0.09% diBoaS fee
        expect(fees.networkFee).toBeCloseTo(0.002, 3) // SOL network fee
        expect(fees.providerFee).toBe(0) // No provider fee for diBoaS wallet
        expect(fees.totalFees).toBeGreaterThan(0)
      })
    })

    describe('Withdraw Transaction (Off-Ramp)', () => {
      it('should calculate fees correctly for bank account withdrawal', async () => {
        const transactionData = {
          type: 'withdraw',
          amount: 300,
          paymentMethod: 'bank_account',
          asset: 'USDC',
          chains: ['SOL']
        }

        const fees = await feeCalculator.calculateTransactionFees(transactionData)
        
        expect(fees.diboas).toBeCloseTo(2.7, 2) // 0.9% diBoaS fee for withdraw
        expect(fees.providerFee).toBeCloseTo(6, 2) // 2% bank account withdrawal fee
        expect(fees.totalFees).toBeGreaterThan(0)
      })
    })
  })

  describe('Investment Category Transactions', () => {
    describe('Buy Transaction', () => {
      it('should calculate fees correctly for buy with diBoaS wallet', async () => {
        const transactionData = {
          type: 'buy',
          amount: 1000,
          paymentMethod: 'diboas_wallet',
          asset: 'BTC',
          chains: ['BTC']
        }

        const fees = await feeCalculator.calculateTransactionFees(transactionData)
        
        expect(fees.diboas).toBeCloseTo(0.9, 2) // 0.09% diBoaS fee
        expect(fees.networkFee).toBeCloseTo(90, 2) // 9% BTC network fee
        expect(fees.dexFee).toBeCloseTo(10, 2) // 1% DEX fee for buy
        expect(fees.totalFees).toBeGreaterThan(0)
      })

      it('should calculate fees correctly for buy with credit card', async () => {
        const transactionData = {
          type: 'buy',
          amount: 500,
          paymentMethod: 'credit_debit_card',
          asset: 'ETH',
          chains: ['ETH']
        }

        const fees = await feeCalculator.calculateTransactionFees(transactionData)
        
        expect(fees.diboas).toBeCloseTo(0.45, 2) // 0.09% diBoaS fee
        expect(fees.networkFee).toBeCloseTo(2.5, 2) // 0.5% ETH network fee
        expect(fees.providerFee).toBeCloseTo(5, 2) // 1% credit card fee
        expect(fees.totalFees).toBeGreaterThan(0)
      })
    })

    describe('Sell Transaction', () => {
      it('should calculate fees correctly for sell transaction', async () => {
        const transactionData = {
          type: 'sell',
          amount: 800,
          paymentMethod: 'diboas_wallet',
          asset: 'ETH',
          chains: ['ETH']
        }

        const fees = await feeCalculator.calculateTransactionFees(transactionData)
        
        expect(fees.diboas).toBeCloseTo(0.72, 2) // 0.09% diBoaS fee
        expect(fees.networkFee).toBeCloseTo(4, 2) // 0.5% ETH network fee
        expect(fees.dexFee).toBeCloseTo(8, 2) // 1% DEX fee for sell
        expect(fees.totalFees).toBeGreaterThan(0)
      })
    })

    describe('Transfer Transaction', () => {
      it('should calculate fees correctly for transfer to external wallet', async () => {
        const transactionData = {
          type: 'transfer',
          amount: 600,
          paymentMethod: 'diboas_wallet',
          asset: 'SOL',
          chains: ['SOL']
        }

        const fees = await feeCalculator.calculateTransactionFees(transactionData)
        
        expect(fees.diboas).toBeCloseTo(5.4, 2) // 0.9% diBoaS fee for transfer
        expect(fees.networkFee).toBeCloseTo(0.006, 3) // SOL network fee
        expect(fees.dexFee).toBeCloseTo(4.8, 2) // 0.8% DEX fee for transfer
        expect(fees.totalFees).toBeGreaterThan(0)
      })
    })
  })

  describe('Yield Strategy Transactions', () => {
    describe('Start Strategy Transaction', () => {
      it('should calculate fees correctly for SOL strategy start', async () => {
        const transactionData = {
          type: 'start_strategy',
          amount: 1000,
          paymentMethod: 'diboas_wallet',
          asset: 'USDC',
          chains: ['SOL']
        }

        const fees = await feeCalculator.calculateTransactionFees(transactionData)
        
        expect(fees.diboas).toBeCloseTo(0.9, 2) // 0.09% diBoaS fee
        expect(fees.networkFee).toBeCloseTo(0.01, 3) // SOL network fee
        expect(fees.dexFee).toBeCloseTo(5, 2) // 0.5% DEX fee for strategies
        expect(fees.providerFee).toBeCloseTo(5, 2) // DEX fee shown as provider fee
        expect(fees.defiFee).toBe(0) // No DeFi fee for strategies
        expect(fees.totalFees).toBeCloseTo(5.91, 2)
      })

      it('should calculate fees correctly for ETH strategy start', async () => {
        const transactionData = {
          type: 'start_strategy',
          amount: 2000,
          paymentMethod: 'diboas_wallet',
          asset: 'USDC',
          chains: ['ETH']
        }

        const fees = await feeCalculator.calculateTransactionFees(transactionData)
        
        expect(fees.diboas).toBeCloseTo(1.8, 2) // 0.09% diBoaS fee
        expect(fees.networkFee).toBeCloseTo(10, 2) // ETH network fee
        expect(fees.dexFee).toBeCloseTo(10, 2) // 0.5% DEX fee for strategies
        expect(fees.totalFees).toBeCloseTo(21.8, 2)
      })

      it('should handle external payment methods for strategies (fallback)', async () => {
        const transactionData = {
          type: 'start_strategy',
          amount: 1000,
          paymentMethod: 'credit_debit_card', // Should be ignored
          asset: 'USDC',
          chains: ['SOL']
        }

        const fees = await feeCalculator.calculateTransactionFees(transactionData)
        
        // Should still only show DEX fees, no external payment provider fees
        expect(fees.diboas).toBeCloseTo(0.9, 2)
        expect(fees.providerFee).toBeCloseTo(5, 2) // DEX fee shown as provider fee
        expect(fees.dexFee).toBeCloseTo(5, 2)
      })
    })

    describe('Stop Strategy Transaction', () => {
      it('should calculate fees correctly for strategy stop', async () => {
        const transactionData = {
          type: 'stop_strategy',
          amount: 1500,
          paymentMethod: 'diboas_wallet',
          asset: 'USDC',
          chains: ['SOL']
        }

        const fees = await feeCalculator.calculateTransactionFees(transactionData)
        
        expect(fees.diboas).toBeCloseTo(1.35, 2) // 0.09% diBoaS fee
        expect(fees.networkFee).toBeCloseTo(0.015, 3) // SOL network fee
        expect(fees.dexFee).toBeCloseTo(7.5, 2) // 0.5% DEX fee
        expect(fees.totalFees).toBeCloseTo(8.865, 3)
      })
    })
  })

  describe('Cross-Chain Transactions', () => {
    it('should handle routing plans for cross-chain transactions', async () => {
      const transactionData = {
        type: 'buy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'BTC',
        chains: ['SOL'] // Start chain
      }

      const routingPlan = {
        targetChains: ['BTC'] // Target chain
      }

      const fees = await feeCalculator.calculateTransactionFees(transactionData, routingPlan)
      
      expect(fees.networkFee).toBeCloseTo(90, 2) // Should use BTC network fee
      expect(fees.totalFees).toBeGreaterThan(0)
    })

    it('should default to transaction chains when no routing plan', async () => {
      const transactionData = {
        type: 'send',
        amount: 500,
        paymentMethod: 'diboas_wallet',
        asset: 'ETH',
        chains: ['ETH']
      }

      const fees = await feeCalculator.calculateTransactionFees(transactionData)
      
      expect(fees.networkFee).toBeCloseTo(2.5, 2) // ETH network fee
      expect(fees.totalFees).toBeGreaterThan(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid transaction data gracefully', async () => {
      const invalidData = {
        type: null,
        amount: 0
      }

      await expect(feeCalculator.calculateTransactionFees(invalidData))
        .rejects.toThrow('Fee calculation failed')
    })

    it('should handle missing fields with defaults', async () => {
      const incompleteData = {
        type: 'add',
        amount: 100
        // Missing paymentMethod, asset, chains
      }

      const fees = await feeCalculator.calculateTransactionFees(incompleteData)
      
      // Should use defaults: diboas_wallet, SOL, ['SOL']
      expect(fees.totalFees).toBeGreaterThan(0)
    })
  })

  describe('Legacy Format Compatibility', () => {
    it('should return fees in both new and legacy formats', async () => {
      const transactionData = {
        type: 'add',
        amount: 100,
        paymentMethod: 'credit_debit_card',
        asset: 'USDC',
        chains: ['SOL']
      }

      const fees = await feeCalculator.calculateTransactionFees(transactionData)
      
      // New format
      expect(fees.diBoaS).toBeDefined()
      expect(fees.network).toBeDefined()
      expect(fees.provider).toBeDefined()
      expect(fees.total).toBeDefined()
      
      // Legacy format
      expect(fees.diboas).toBeDefined()
      expect(fees.platformFee).toBeDefined()
      expect(fees.networkFee).toBeDefined()
      expect(fees.providerFee).toBeDefined()
      expect(fees.totalFee).toBeDefined()
      expect(fees.totalFees).toBeDefined()
      
      // Values should match
      expect(fees.diBoaS).toBe(fees.diboas)
      expect(fees.diBoaS).toBe(fees.platformFee)
      expect(fees.network).toBe(fees.networkFee)
      expect(fees.provider).toBe(fees.providerFee)
      expect(fees.total).toBe(fees.totalFee)
      expect(fees.total).toBe(fees.totalFees)
    })
  })

  describe('Performance and Concurrency', () => {
    it('should handle multiple concurrent fee calculations', async () => {
      const promises = []
      
      for (let i = 0; i < 10; i++) {
        promises.push(
          feeCalculator.calculateTransactionFees({
            type: 'add',
            amount: 100 + i,
            paymentMethod: 'diboas_wallet',
            asset: 'USDC',
            chains: ['SOL']
          })
        )
      }

      const results = await Promise.all(promises)
      
      expect(results).toHaveLength(10)
      results.forEach(result => {
        expect(result.totalFees).toBeGreaterThan(0)
      })
    })

    it('should use caching for identical requests', async () => {
      const transactionData = {
        type: 'buy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'ETH',
        chains: ['ETH']
      }

      // Clear cache first
      feeCalculator.clearCache()
      expect(feeCalculator.cache.size).toBe(0)

      // First call should populate cache
      const fees1 = await feeCalculator.calculateTransactionFees(transactionData)
      expect(feeCalculator.cache.size).toBeGreaterThan(0)

      // Second call should use cache
      const fees2 = await feeCalculator.calculateTransactionFees(transactionData)
      
      expect(fees1.totalFees).toBe(fees2.totalFees)
    })
  })

  describe('Real-world Transaction Scenarios', () => {
    it('should handle typical user add funds workflow', async () => {
      // User adds funds with credit card
      const addTransaction = {
        type: 'add',
        amount: 1000,
        paymentMethod: 'credit_debit_card',
        asset: 'USDC',
        chains: ['SOL']
      }

      const addFees = await feeCalculator.calculateTransactionFees(addTransaction)
      expect(addFees.totalFees).toBeGreaterThan(0)
      
      // User buys crypto with diBoaS balance
      const buyTransaction = {
        type: 'buy',
        amount: 500,
        paymentMethod: 'diboas_wallet',
        asset: 'BTC',
        chains: ['BTC']
      }

      const buyFees = await feeCalculator.calculateTransactionFees(buyTransaction)
      expect(buyFees.totalFees).toBeGreaterThan(0)
    })

    it('should handle strategy investment workflow', async () => {
      // User starts a DeFi strategy
      const startStrategy = {
        type: 'start_strategy',
        amount: 2000,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['ETH']
      }

      const startFees = await feeCalculator.calculateTransactionFees(startStrategy)
      expect(startFees.totalFees).toBeGreaterThan(0)
      
      // Later, user stops the strategy
      const stopStrategy = {
        type: 'stop_strategy',
        amount: 2500, // Gained value
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['ETH']
      }

      const stopFees = await feeCalculator.calculateTransactionFees(stopStrategy)
      expect(stopFees.totalFees).toBeGreaterThan(0)
    })

    it('should handle complete investment to withdrawal workflow', async () => {
      // 1. Add funds
      const addFees = await feeCalculator.calculateTransactionFees({
        type: 'add',
        amount: 1000,
        paymentMethod: 'apple_pay',
        asset: 'USDC',
        chains: ['SOL']
      })

      // 2. Buy crypto
      const buyFees = await feeCalculator.calculateTransactionFees({
        type: 'buy',
        amount: 500,
        paymentMethod: 'diboas_wallet',
        asset: 'ETH',
        chains: ['ETH']
      })

      // 3. Sell crypto
      const sellFees = await feeCalculator.calculateTransactionFees({
        type: 'sell',
        amount: 600, // Gained value
        paymentMethod: 'diboas_wallet',
        asset: 'ETH',
        chains: ['ETH']
      })

      // 4. Withdraw funds
      const withdrawFees = await feeCalculator.calculateTransactionFees({
        type: 'withdraw',
        amount: 500,
        paymentMethod: 'bank_account',
        asset: 'USDC',
        chains: ['SOL']
      })

      expect(addFees.totalFees).toBeGreaterThan(0)
      expect(buyFees.totalFees).toBeGreaterThan(0)
      expect(sellFees.totalFees).toBeGreaterThan(0)
      expect(withdrawFees.totalFees).toBeGreaterThan(0)
    })
  })
})