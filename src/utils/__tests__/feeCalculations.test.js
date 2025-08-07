/**
 * Comprehensive Unit Tests for Centralized Fee Calculator
 * Tests all fee calculation scenarios, edge cases, and network-specific logic
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { CentralizedFeeCalculator, FEE_RATES, centralizedFeeCalculator } from '../feeCalculations.js'

describe('Centralized Fee Calculator', () => {
  let feeCalculator

  beforeEach(() => {
    feeCalculator = new CentralizedFeeCalculator()
  })

  describe('FEE_RATES Configuration', () => {
    it('should have correct diBoaS fee rates as per TRANSACTIONS.md', () => {
      expect(FEE_RATES.DIBOAS).toEqual({
        add: 0.0009,           // 0.09%
        withdraw: 0.009,       // 0.9%
        send: 0.0009,          // 0.09%
        transfer: 0.009,       // 0.9%
        buy: 0.0009,           // 0.09%
        sell: 0.0009,          // 0.09%
        invest: 0.0009,        // 0.09%
        start_strategy: 0.0009, // 0.09%
        stop_strategy: 0.0009   // 0.09%
      })
    })

    it('should have correct network fee rates as per TRANSACTIONS.md', () => {
      expect(FEE_RATES.NETWORK).toEqual({
        BTC: 0.01,     // 1%
        ETH: 0.005,    // 0.5%
        SOL: 0.000001, // 0.0001%
        SUI: 0.000005  // 0.0005%
      })
    })

    it('should have correct payment provider fees as per TRANSACTIONS.md', () => {
      expect(FEE_RATES.PAYMENT_PROVIDER).toEqual({
        onramp: {
          apple_pay: 0.005,        // 0.5%
          google_pay: 0.005,       // 0.5%
          credit_debit_card: 0.01, // 1%
          bank_account: 0.01,      // 1%
          paypal: 0.03             // 3%
        },
        offramp: {
          apple_pay: 0.01,         // 1%
          google_pay: 0.01,        // 1%
          credit_debit_card: 0.02, // 2%
          bank_account: 0.02,      // 2%
          paypal: 0.04             // 4%
        }
      })
    })

    it('should have correct DEX and DeFi fees', () => {
      expect(FEE_RATES.DEX).toEqual({
        standard: 0.008,     // 0.8% for all chains except Solana
        solana: 0            // 0% for Solana chain transactions
      })

      expect(FEE_RATES.DEFI).toEqual({
        SOL: 0.007,     // 0.7% - For Solana providers
        SUI: 0.009,     // 0.9% - For Sui providers  
        ETH: 0.012,     // 1.2% - For Ethereum Layer 1 providers
        BTC: 0.015      // 1.5% - For Bitcoin providers
      })
    })
  })

  describe('Core Fee Calculation Algorithm', () => {
    it('should calculate basic fee correctly', () => {
      const result = feeCalculator.calculateCoreFee(1000, 0.01)
      expect(result).toBe(10) // 1000 * 0.01 = 10
    })

    it('should handle zero amount', () => {
      const result = feeCalculator.calculateCoreFee(0, 0.01)
      expect(result).toBe(0)
    })

    it('should handle zero rate', () => {
      const result = feeCalculator.calculateCoreFee(1000, 0)
      expect(result).toBe(0)
    })

    it('should handle negative amounts gracefully', () => {
      const result = feeCalculator.calculateCoreFee(-100, 0.01)
      expect(result).toBe(0)
    })
  })

  describe('Main calculateFees Method', () => {
    it('should calculate comprehensive fees for add transaction', () => {
      const result = feeCalculator.calculateFees({
        type: 'add',
        amount: 1000,
        asset: 'SOL',
        paymentMethod: 'credit_debit_card',
        chains: ['SOL']
      })

      expect(result).toEqual({
        diBoaSFee: 0.9, // 1000 * 0.0009
        networkFee: 0.001, // 1000 * 0.000001
        providerFee: 10, // 1000 * 0.01 (onramp credit_debit_card)
        dexFee: 0, // No DEX fee for add
        defiFee: 0, // No DeFi fee for add
        total: 10.901,
        // Legacy format
        diBoaS: 0.9,
        network: 0.001,
        provider: 10,
        dex: 0,
        defi: 0,
        total: 10.901,
        breakdown: {
          diBoaS: { amount: 0.9, rate: 0.0009 },
          network: { amount: 0.001, rate: 0.000001 },
          provider: { amount: 10, rate: 0.01 },
          dex: { amount: 0, rate: 0 },
          defi: { amount: 0, rate: 0.007 }
        }
      })
    })

    it('should calculate fees for diBoaS wallet payments (no provider fees)', () => {
      const result = feeCalculator.calculateFees({
        type: 'buy',
        amount: 1000,
        asset: 'SOL',
        paymentMethod: 'diboas_wallet',
        chains: ['SOL']
      })

      expect(result.providerFee).toBe(0)
      expect(result.dexFee).toBe(0) // SOL chain = 0% DEX fee
      expect(result.total).toBe(0.901) // 0.9 + 0.001 + 0 + 0 + 0 = 0.901
    })

    it('should calculate fees for strategy transactions', () => {
      const result = feeCalculator.calculateFees({
        type: 'start_strategy',
        amount: 1000,
        asset: 'SOL',
        paymentMethod: 'diboas_wallet',
        chains: ['SOL']
      })

      expect(result.diBoaSFee).toBe(0.9) // 1000 * 0.0009
      expect(result.defiFee).toBe(7) // 1000 * 0.007 for SOL DeFi
      expect(result.providerFee).toBe(0) // No provider fee for diBoaS wallet
      expect(result.dexFee).toBe(0) // No DEX fee for strategy
      expect(result.total).toBe(7.901) // 0.9 + 0.001 + 0 + 0 + 7 = 7.901
    })
  })

  describe('Individual Fee Component Methods', () => {
    it('should calculate diBoaS fees correctly', () => {
      expect(feeCalculator.calculateDiBoaSFee('add', 1000)).toBe(0.9)
      expect(feeCalculator.calculateDiBoaSFee('withdraw', 1000)).toBe(9)
      expect(feeCalculator.calculateDiBoaSFee('start_strategy', 1000)).toBe(0.9)
    })

    it('should calculate network fees correctly', () => {
      expect(feeCalculator._calculateNetworkFee(1000, 'SOL', ['SOL'])).toBe(0.001)
      expect(feeCalculator._calculateNetworkFee(1000, 'BTC', ['BTC'])).toBe(10)
      expect(feeCalculator._calculateNetworkFee(1000, 'ETH', ['ETH'])).toBe(5)
    })

    it('should calculate provider fees correctly', () => {
      expect(feeCalculator._calculateProviderFee(1000, 'add', 'credit_debit_card')).toBe(10)
      expect(feeCalculator._calculateProviderFee(1000, 'withdraw', 'paypal')).toBe(40)
      expect(feeCalculator._calculateProviderFee(1000, 'add', 'diboas_wallet')).toBe(0)
    })

    it('should calculate DEX fees correctly', () => {
      expect(feeCalculator._calculateDexFee(1000, 'buy', 'diboas_wallet', ['SOL'], 'SOL')).toBe(0) // SOL = 0%
      expect(feeCalculator._calculateDexFee(1000, 'sell', 'diboas_wallet', ['ETH'], 'ETH')).toBe(8) // ETH = 0.8%
      expect(feeCalculator._calculateDexFee(1000, 'transfer', 'external', ['ETH'])).toBe(8)
      expect(feeCalculator._calculateDexFee(1000, 'add', 'diboas_wallet')).toBe(0)
    })

    it('should calculate DeFi fees correctly', () => {
      expect(feeCalculator._calculateDefiFee(1000, 'start_strategy', 'SOL')).toBe(7) // SOL = 0.7%
      expect(feeCalculator._calculateDefiFee(1000, 'stop_strategy', 'ETH')).toBe(12) // ETH = 1.2%
      expect(feeCalculator._calculateDefiFee(1000, 'add')).toBe(0)
    })
  })

  describe('Provider Rate Logic', () => {
    it('should determine correct provider rates for onramp transactions', () => {
      expect(feeCalculator.getProviderRate('add', 'apple_pay')).toBe(0.005)
      expect(feeCalculator.getProviderRate('buy', 'paypal')).toBe(0.03)
      expect(feeCalculator.getProviderRate('add', 'diboas_wallet')).toBe(0)
    })

    it('should determine correct provider rates for offramp transactions', () => {
      expect(feeCalculator.getProviderRate('withdraw', 'apple_pay')).toBe(0.01)
      expect(feeCalculator.getProviderRate('sell', 'paypal')).toBe(0.04)
      expect(feeCalculator.getProviderRate('withdraw', 'diboas_wallet')).toBe(0)
    })
  })

  describe('Input Validation', () => {
    it('should throw error for missing transaction type', () => {
      expect(() => {
        feeCalculator.calculateFees({
          amount: 1000,
          asset: 'SOL',
          paymentMethod: 'diboas_wallet',
          chains: ['SOL']
        })
      }).toThrow('Transaction type is required')
    })

    it('should throw error for missing or invalid amount', () => {
      expect(() => {
        feeCalculator.calculateFees({
          type: 'add',
          amount: 0,
          asset: 'SOL',
          paymentMethod: 'diboas_wallet',
          chains: ['SOL']
        })
      }).toThrow('Amount must be positive')
    })

    it('should throw error for missing chains', () => {
      expect(() => {
        feeCalculator.calculateFees({
          type: 'add',
          amount: 1000,
          asset: 'SOL',
          paymentMethod: 'diboas_wallet',
          chains: []
        })
      }).toThrow('Chains array is required')
    })
  })

  describe('Legacy Method Compatibility', () => {
    it('should maintain compatibility with calculateComprehensiveFees', () => {
      const result = feeCalculator.calculateComprehensiveFees({
        type: 'add',
        amount: 1000,
        asset: 'SOL',
        paymentMethod: 'diboas_wallet',
        chains: ['SOL']
      })

      expect(result.diBoaSFee).toBe(0.9)
      expect(result.networkFee).toBe(0.001)
      expect(result.total).toBe(0.901)
    })

    it('should maintain compatibility with legacy calculateDiBoaSFee', () => {
      expect(feeCalculator.calculateDiBoaSFee('add', 1000)).toBe(0.9)
      expect(feeCalculator.calculateDiBoaSFee('withdraw', 1000)).toBe(9)
    })

    it('should maintain compatibility with legacy calculateNetworkFee', () => {
      expect(feeCalculator.calculateNetworkFee('SOL', 1000)).toBe(0.001)
      expect(feeCalculator.calculateNetworkFee('BTC', 1000)).toBe(10)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle unknown transaction types gracefully', () => {
      const result = feeCalculator.calculateFees({
        type: 'unknown_type',
        amount: 1000,
        asset: 'SOL',
        paymentMethod: 'diboas_wallet',
        chains: ['SOL']
      })

      expect(result.diBoaSFee).toBe(0.01) // Unknown type returns 0, but minimum fee of 0.01 is applied
      expect(result.defiFee).toBe(0)
    })

    it('should handle unknown payment methods gracefully', () => {
      const result = feeCalculator.calculateFees({
        type: 'add',
        amount: 1000,
        asset: 'SOL',
        paymentMethod: 'unknown_method',
        chains: ['SOL']
      })

      expect(result.providerFee).toBe(0) // Unknown payment method returns 0
    })

    it('should handle unknown assets gracefully', () => {
      const result = feeCalculator.calculateFees({
        type: 'add',
        amount: 1000,
        asset: 'UNKNOWN',
        paymentMethod: 'diboas_wallet',
        chains: ['UNKNOWN']
      })

      expect(result.networkFee).toBe(0) // Unknown asset returns 0
    })
  })

  describe('Minimum Fee Application', () => {
    it('should apply minimum diBoaS fee', () => {
      const result = feeCalculator.calculateFees({
        type: 'add',
        amount: 1, // Very small amount
        asset: 'SOL',
        paymentMethod: 'diboas_wallet',
        chains: ['SOL']
      })

      expect(result.diBoaSFee).toBe(0.01) // Should be minimum of 0.01
    })

    it('should not apply minimum to other fee types', () => {
      const result = feeCalculator.calculateFees({
        type: 'add',
        amount: 1,
        asset: 'SOL',
        paymentMethod: 'diboas_wallet',
        chains: ['SOL']
      })

      expect(result.networkFee).toBe(0.000001) // Should be exact calculation, no minimum
    })
  })

  describe('Caching', () => {
    it('should cache fee calculations', () => {
      const config = {
        type: 'add',
        amount: 1000,
        asset: 'SOL',
        paymentMethod: 'diboas_wallet',
        chains: ['SOL']
      }

      const result1 = feeCalculator.calculateFees(config)
      const result2 = feeCalculator.calculateFees(config)

      expect(result1).toEqual(result2)
    })
  })

  describe('Utility Methods', () => {
    it('should get fee rates for transaction type', () => {
      const rates = feeCalculator.getFeeRatesForTransaction('add')
      
      expect(rates.diboas).toBe(0.0009)
      expect(rates.network).toEqual(FEE_RATES.NETWORK)
      expect(rates.dex).toBe(0)
      expect(rates.defi).toBe(0)
    })

    it('should provide quick estimates', () => {
      const estimate = feeCalculator.getQuickEstimate('add', 1000)
      
      expect(estimate.estimatedDiBoaSFee).toBe(0.9)
      expect(estimate.message).toContain('Additional network and provider fees may apply')
    })

    it('should compare fee options across payment methods', () => {
      const comparison = feeCalculator.compareFeeOptions(
        { type: 'add', amount: 1000, asset: 'SOL', chains: ['SOL'] },
        ['diboas_wallet', 'credit_debit_card', 'paypal']
      )

      expect(comparison).toHaveLength(3)
      expect(comparison[0].total).toBeLessThan(comparison[1].total)
      expect(comparison[1].total).toBeLessThan(comparison[2].total)
    })
  })

  describe('Singleton Instance', () => {
    it('should export singleton instance', () => {
      expect(centralizedFeeCalculator).toBeInstanceOf(CentralizedFeeCalculator)
    })

    it('should maintain state across calls', () => {
      const result1 = centralizedFeeCalculator.calculateFees({
        type: 'add',
        amount: 1000,
        asset: 'SOL',
        paymentMethod: 'diboas_wallet',
        chains: ['SOL']
      })

      const result2 = centralizedFeeCalculator.calculateFees({
        type: 'add',
        amount: 1000,
        asset: 'SOL',
        paymentMethod: 'diboas_wallet',
        chains: ['SOL']
      })

      expect(result1).toEqual(result2)
    })
  })
})