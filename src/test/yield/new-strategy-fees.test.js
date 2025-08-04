/**
 * New Strategy Fee Structure Tests
 * Tests the redesigned FinObjective strategy fee structure:
 * - Only diBoaS wallet payments allowed
 * - Fee structure: 0.09% diBoaS + network fee + 0.5% DEX fee
 * - Mimics external wallet withdrawal fees
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FeeCalculator } from '../../utils/feeCalculations.js'

describe('New Strategy Fee Structure', () => {
  let feeCalculator

  beforeEach(() => {
    feeCalculator = new FeeCalculator()
  })

  describe('Start Strategy Fees', () => {
    it('should calculate correct fees for SOL chain strategy', () => {
      const fees = feeCalculator.calculateFees({
        type: 'start_strategy',
        amount: 1000,
        paymentMethod: 'diboas_wallet', // Only allowed method
        asset: 'USDC',
        chains: ['SOL']
      })

      expect(fees.diBoaS).toBeCloseTo(0.9, 2) // 1000 * 0.0009 = 0.9
      expect(fees.network).toBeCloseTo(0.01, 3) // 1000 * 0.00001 = 0.01 (SOL)
      expect(fees.dex).toBeCloseTo(5, 2) // 1000 * 0.005 = 5 (0.5% DEX fee)
      expect(fees.provider).toBeCloseTo(5, 2) // Should show DEX fee as provider fee
      expect(fees.defi).toBe(0) // No separate DeFi fee
      expect(fees.total).toBeCloseTo(5.91, 2) // 0.9 + 0.01 + 5 + 0 + 0
    })

    it('should calculate correct fees for ETH chain strategy', () => {
      const fees = feeCalculator.calculateFees({
        type: 'start_strategy',
        amount: 2000,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['ETH']
      })

      expect(fees.diBoaS).toBeCloseTo(1.8, 2) // 2000 * 0.0009 = 1.8
      expect(fees.network).toBeCloseTo(10, 2) // 2000 * 0.005 = 10 (ETH)
      expect(fees.dex).toBeCloseTo(10, 2) // 2000 * 0.005 = 10 (0.5% DEX fee)
      expect(fees.provider).toBeCloseTo(10, 2) // Should show DEX fee as provider fee
      expect(fees.defi).toBe(0) // No separate DeFi fee
      expect(fees.total).toBeCloseTo(21.8, 2) // 1.8 + 10 + 10 + 0 + 0
    })

    it('should calculate correct fees for SUI chain strategy', () => {
      const fees = feeCalculator.calculateFees({
        type: 'start_strategy',
        amount: 5000,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['SUI']
      })

      expect(fees.diBoaS).toBeCloseTo(4.5, 2) // 5000 * 0.0009 = 4.5
      expect(fees.network).toBeCloseTo(0.15, 3) // 5000 * 0.00003 = 0.15 (SUI)
      expect(fees.dex).toBeCloseTo(25, 2) // 5000 * 0.005 = 25 (0.5% DEX fee)
      expect(fees.provider).toBeCloseTo(25, 2) // Should show DEX fee as provider fee
      expect(fees.defi).toBe(0) // No separate DeFi fee
      expect(fees.total).toBeCloseTo(29.65, 2) // 4.5 + 0.15 + 25 + 0 + 0
    })
  })

  describe('Stop Strategy Fees', () => {
    it('should calculate correct fees for stop strategy', () => {
      const fees = feeCalculator.calculateFees({
        type: 'stop_strategy',
        amount: 1500,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['SOL']
      })

      expect(fees.diBoaS).toBeCloseTo(1.35, 2) // 1500 * 0.0009 = 1.35
      expect(fees.network).toBeCloseTo(0.015, 3) // 1500 * 0.00001 = 0.015 (SOL)
      expect(fees.dex).toBeCloseTo(7.5, 2) // 1500 * 0.005 = 7.5 (0.5% DEX fee)
      expect(fees.provider).toBeCloseTo(7.5, 2) // Should show DEX fee as provider fee
      expect(fees.defi).toBe(0) // No separate DeFi fee
      expect(fees.total).toBeCloseTo(8.865, 3) // 1.35 + 0.015 + 7.5 + 0 + 0
    })
  })

  describe('Payment Method Restrictions', () => {
    it('should not apply external payment fees for strategies (only diBoaS wallet)', () => {
      const fees = feeCalculator.calculateFees({
        type: 'start_strategy',
        amount: 1000,
        paymentMethod: 'diboas_wallet', // Only allowed
        asset: 'USDC',
        chains: ['SOL']
      })

      // No external payment provider fees should be applied
      expect(fees.provider).toBeCloseTo(5, 2) // Only DEX fee shown as provider fee
      expect(fees.dex).toBeCloseTo(5, 2) // 0.5% DEX fee
    })

    it('should handle external payment methods gracefully (fallback)', () => {
      // Even if external payment method is passed, strategies should only use diBoaS wallet
      const fees = feeCalculator.calculateFees({
        type: 'start_strategy',
        amount: 1000,
        paymentMethod: 'credit_debit_card', // Should be ignored
        asset: 'USDC',
        chains: ['SOL']
      })

      // For strategies, DEX fee is shown as provider fee but actual provider fee is 0
      expect(fees.provider).toBeCloseTo(5, 2) // DEX fee shown as provider fee
      expect(fees.dex).toBeCloseTo(5, 2) // 0.5% DEX fee
    })
  })

  describe('Fee Structure Comparison', () => {
    it('should mimic external wallet withdrawal fee structure', () => {
      // Compare strategy fees with external wallet withdrawal
      const strategyFees = feeCalculator.calculateFees({
        type: 'start_strategy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['SOL']
      })

      const withdrawalFees = feeCalculator.calculateFees({
        type: 'transfer',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'BTC',
        chains: ['BTC']
      })

      // Both should have:
      // - diBoaS fee (different rates: 0.09% vs 0.9%)
      // - Network fee (chain-dependent)
      // - DEX fee (0.5% vs 0.8%)

      expect(strategyFees.diBoaS).toBeCloseTo(0.9, 2) // 0.09%
      expect(withdrawalFees.diBoaS).toBeCloseTo(9, 2) // 0.9% for transfer

      expect(strategyFees.dex).toBeCloseTo(5, 2) // 0.5%
      expect(withdrawalFees.dex).toBeCloseTo(8, 2) // 0.8% for transfer

      // Both have network fees
      expect(strategyFees.network).toBeGreaterThan(0)
      expect(withdrawalFees.network).toBeGreaterThan(0)
    })

    it('should have consistent fee calculation across different amounts', () => {
      const amounts = [100, 500, 1000, 5000, 10000]
      
      amounts.forEach(amount => {
        const fees = feeCalculator.calculateFees({
          type: 'start_strategy',
          amount,
          paymentMethod: 'diboas_wallet',
          asset: 'USDC',
          chains: ['SOL']
        })

        // Verify percentage consistency
        expect(fees.diBoaS / amount).toBeCloseTo(0.0009, 6) // 0.09%
        expect(fees.dex / amount).toBeCloseTo(0.005, 6) // 0.5%
        expect(fees.network / amount).toBeCloseTo(0.00001, 8) // SOL network fee
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle minimum amounts correctly', () => {
      const fees = feeCalculator.calculateFees({
        type: 'start_strategy',
        amount: 50, // Minimum strategy amount
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['SOL']
      })

      expect(fees.diBoaS).toBeCloseTo(0.045, 3) // 50 * 0.0009
      expect(fees.dex).toBeCloseTo(0.25, 3) // 50 * 0.005
      expect(fees.network).toBeCloseTo(0.0005, 6) // 50 * 0.00001
      expect(fees.total).toBeCloseTo(0.2955, 4)
    })

    it('should handle large amounts correctly', () => {
      const fees = feeCalculator.calculateFees({
        type: 'start_strategy',
        amount: 100000, // Large amount
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['ETH']
      })

      expect(fees.diBoaS).toBeCloseTo(90, 2) // 100000 * 0.0009
      expect(fees.dex).toBeCloseTo(500, 2) // 100000 * 0.005
      expect(fees.network).toBeCloseTo(500, 2) // 100000 * 0.005 (ETH)
      expect(fees.total).toBeCloseTo(1090, 2)
    })

    it('should handle zero amounts gracefully', () => {
      // Zero amounts should throw validation error
      expect(() => {
        feeCalculator.calculateFees({
          type: 'start_strategy',
          amount: 0,
          paymentMethod: 'diboas_wallet',
          asset: 'USDC',
          chains: ['SOL']
        })
      }).toThrow('Amount must be positive')
    })
  })

  describe('UI Compatibility', () => {
    it('should provide proper breakdown for UI display', () => {
      const fees = feeCalculator.calculateFees({
        type: 'start_strategy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['SOL']
      })

      // Should have breakdown object
      expect(fees.breakdown).toBeDefined()
      expect(fees.breakdown.diBoaS).toEqual({
        amount: 0.9,
        rate: 0.0009
      })
      expect(fees.breakdown.provider).toEqual({
        amount: 5, // DEX fee shown as provider fee
        rate: 0.005
      })
      expect(fees.breakdown.dex).toEqual({
        amount: 5,
        rate: 0.005
      })

      // Legacy format compatibility
      expect(fees.diBoaS).toBe(0.9)
      expect(fees.provider).toBe(5) // DEX fee shown as provider
      expect(fees.dex).toBe(5)
      expect(fees.total).toBeCloseTo(5.91, 2)
    })

    it('should format fees consistently', () => {
      const fees = feeCalculator.calculateFees({
        type: 'start_strategy',
        amount: 1234.56,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['SOL']
      })

      // All fee amounts should be numbers
      expect(typeof fees.diBoaS).toBe('number')
      expect(typeof fees.network).toBe('number')
      expect(typeof fees.provider).toBe('number')
      expect(typeof fees.dex).toBe('number')
      expect(typeof fees.total).toBe('number')

      // Should be reasonable precision - Update expected value based on actual calculation
      expect(fees.total).toBeCloseTo(7.296, 3)
    })
  })

  describe('Cross-Chain Fee Differences', () => {
    it('should apply different network fees for different chains', () => {
      const amount = 1000
      const baseConfig = {
        type: 'start_strategy',
        amount,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC'
      }

      const solFees = feeCalculator.calculateFees({ ...baseConfig, chains: ['SOL'] })
      const ethFees = feeCalculator.calculateFees({ ...baseConfig, chains: ['ETH'] })
      const suiFees = feeCalculator.calculateFees({ ...baseConfig, chains: ['SUI'] })

      // diBoaS and DEX fees should be same across chains
      expect(solFees.diBoaS).toEqual(ethFees.diBoaS)
      expect(solFees.diBoaS).toEqual(suiFees.diBoaS)
      expect(solFees.dex).toEqual(ethFees.dex)
      expect(solFees.dex).toEqual(suiFees.dex)

      // Network fees should differ
      expect(solFees.network).toBeCloseTo(0.01, 3) // SOL: 0.001%
      expect(ethFees.network).toBeCloseTo(5, 2) // ETH: 0.5%
      expect(suiFees.network).toBeCloseTo(0.03, 3) // SUI: 0.003%

      // ETH should be most expensive overall
      expect(ethFees.total).toBeGreaterThan(solFees.total)
      expect(ethFees.total).toBeGreaterThan(suiFees.total)
    })
  })
})