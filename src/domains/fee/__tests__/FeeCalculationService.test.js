/**
 * Fee Calculation Service Tests
 * Comprehensive tests for the fee calculation domain service
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FeeCalculationService, FeeCalculationError } from '../services/FeeCalculationService.js'
import { FeeAmount, FeeType } from '../value-objects/FeeAmount.js'
import { FeeStructure } from '../value-objects/FeeStructure.js'
import { Money } from '../../shared/value-objects/Money.js'

// Mock dependencies
const mockFeeProviderService = {
  getAllFeeData: vi.fn()
}

const mockEventBus = {
  emit: vi.fn()
}

describe('FeeCalculationService', () => {
  let feeCalculationService
  let mockFeeRates

  beforeEach(() => {
    vi.clearAllMocks()
    
    feeCalculationService = new FeeCalculationService(mockFeeProviderService, mockEventBus)
    
    mockFeeRates = {
      diboas: {
        add: 0.005,      // 0.5%
        withdraw: 0.005,
        send: 0.002,     // 0.2%
        buy: 0.005,
        sell: 0.005,
        start_strategy: 0.001,
        stop_strategy: 0.001
      },
      network: {
        SOL: 0.000025,
        ETH: 0.003,
        BTC: 0.0005
      },
      provider: {
        onramp: {
          credit_debit_card: 0.029,
          bank_account: 0.01,
          apple_pay: 0.025
        },
        offramp: {
          bank_account: 0.01,
          paypal: 0.025
        }
      },
      dex: {
        solana: 0.002,
        standard: 0.003
      },
      defi: {
        SOL: 0.001,
        ETH: 0.002
      },
      minimums: {
        diboas: 0.01,
        network: 0.001,
        provider: 0.05
      }
    }

    mockFeeProviderService.getAllFeeData.mockResolvedValue(mockFeeRates)
  })

  describe('Basic Fee Calculation', () => {
    it('should calculate fees for add transaction with credit card', async () => {
      const request = {
        type: 'add',
        amount: 100,
        asset: 'USD',
        paymentMethod: 'credit_debit_card',
        chains: ['SOL']
      }

      const feeStructure = await feeCalculationService.calculateTransactionFees(request)

      expect(feeStructure).toBeInstanceOf(FeeStructure)
      expect(feeStructure.hasFees()).toBe(true)
      
      // Should have platform, network, and provider fees
      expect(feeStructure.getPlatformFee().isPositive()).toBe(true)
      expect(feeStructure.getNetworkFee().isPositive()).toBe(true)
      expect(feeStructure.getProviderFee().isPositive()).toBe(true)
      
      // Platform fee: 100 * 0.005 = 0.5, but minimum is 0.01
      expect(feeStructure.getPlatformFee().amount.amount).toBe(0.50)
      
      // Provider fee: 100 * 0.029 = 2.9
      expect(feeStructure.getProviderFee().amount.amount).toBe(2.9)
      
      // Network fee: 100 * 0.000025 = 0.0025, but minimum is 0.001
      expect(feeStructure.getNetworkFee().amount.amount).toBe(0.0025)
    })

    it('should calculate fees for buy transaction with diBoaS wallet', async () => {
      const request = {
        type: 'buy',
        amount: 1000,
        asset: 'BTC',
        paymentMethod: 'diboas_wallet',
        chains: ['BTC']
      }

      const feeStructure = await feeCalculationService.calculateTransactionFees(request)

      // Should have platform, network, and DEX fees (no provider fee for diBoaS wallet)
      expect(feeStructure.getPlatformFee().isPositive()).toBe(true)
      expect(feeStructure.getNetworkFee().isPositive()).toBe(true)
      expect(feeStructure.getDexFee().isPositive()).toBe(true)
      expect(feeStructure.getProviderFee().isZero()).toBe(true)
      
      // Platform fee: 1000 * 0.005 = 5
      expect(feeStructure.getPlatformFee().amount.amount).toBe(5)
      
      // Network fee: 1000 * 0.0005 = 0.5
      expect(feeStructure.getNetworkFee().amount.amount).toBe(0.5)
      
      // DEX fee: 1000 * 0.003 = 3 (standard rate for BTC)
      expect(feeStructure.getDexFee().amount.amount).toBe(3)
    })

    it('should calculate fees for send transaction', async () => {
      const request = {
        type: 'send',
        amount: 50,
        asset: 'USD',
        paymentMethod: 'diboas_wallet',
        chains: ['SOL']
      }

      const feeStructure = await feeCalculationService.calculateTransactionFees(request)

      // Send transactions should have no DEX fees
      expect(feeStructure.getPlatformFee().isPositive()).toBe(true)
      expect(feeStructure.getNetworkFee().isPositive()).toBe(true)
      expect(feeStructure.getDexFee().isZero()).toBe(true)
      expect(feeStructure.getProviderFee().isZero()).toBe(true)
    })

    it('should calculate fees for strategy transactions', async () => {
      const request = {
        type: 'start_strategy',
        amount: 2000,
        asset: 'USD',
        paymentMethod: 'diboas_wallet',
        chains: ['SOL']
      }

      const feeStructure = await feeCalculationService.calculateTransactionFees(request)

      // Strategy transactions should have platform, network, and DeFi fees (no DEX fees)
      expect(feeStructure.getPlatformFee().isPositive()).toBe(true)
      expect(feeStructure.getNetworkFee().isPositive()).toBe(true)
      expect(feeStructure.getDefiFee().isPositive()).toBe(true)
      expect(feeStructure.getDexFee().isZero()).toBe(true)
      expect(feeStructure.getProviderFee().isZero()).toBe(true)
    })
  })

  describe('Business Rules', () => {
    it('should apply minimum fees correctly', async () => {
      const request = {
        type: 'add',
        amount: 1, // Very small amount
        asset: 'USD',
        paymentMethod: 'credit_debit_card',
        chains: ['SOL']
      }

      const feeStructure = await feeCalculationService.calculateTransactionFees(request)

      // Platform fee should be minimum (0.01) rather than calculated (1 * 0.005 = 0.005)
      expect(feeStructure.getPlatformFee().amount.amount).toBeGreaterThanOrEqual(0.01)
    })

    it('should not charge provider fees for diBoaS wallet', async () => {
      const request = {
        type: 'add',
        amount: 100,
        asset: 'USD',
        paymentMethod: 'diboas_wallet',
        chains: ['SOL']
      }

      const feeStructure = await feeCalculationService.calculateTransactionFees(request)

      expect(feeStructure.getProviderFee().isZero()).toBe(true)
    })

    it('should not charge DEX fees for off-ramp withdrawals', async () => {
      const request = {
        type: 'withdraw',
        amount: 100,
        asset: 'USD',
        paymentMethod: 'bank_account',
        chains: ['SOL']
      }

      const feeStructure = await feeCalculationService.calculateTransactionFees(request)

      expect(feeStructure.getDexFee().isZero()).toBe(true)
    })

    it('should charge DEX fees for external wallet withdrawals', async () => {
      const request = {
        type: 'withdraw',
        amount: 100,
        asset: 'USD',
        paymentMethod: 'external_wallet',
        chains: ['SOL']
      }

      const feeStructure = await feeCalculationService.calculateTransactionFees(request)

      expect(feeStructure.getDexFee().isPositive()).toBe(true)
    })
  })

  describe('Event Emission', () => {
    it('should emit FeeCalculated event', async () => {
      const request = {
        type: 'add',
        amount: 100,
        asset: 'USD',
        paymentMethod: 'credit_debit_card',
        chains: ['SOL']
      }

      await feeCalculationService.calculateTransactionFees(request)

      expect(mockEventBus.emit).toHaveBeenCalledTimes(1)
      const emittedEvent = mockEventBus.emit.mock.calls[0][0]
      expect(emittedEvent.eventType).toBe('FeeCalculated')
      expect(emittedEvent.data.transactionType).toBe('add')
      expect(emittedEvent.data.paymentMethod).toBe('credit_debit_card')
    })
  })

  describe('Error Handling', () => {
    it('should throw error for missing transaction type', async () => {
      const request = {
        amount: 100,
        asset: 'USD',
        paymentMethod: 'credit_debit_card'
      }

      await expect(
        feeCalculationService.calculateTransactionFees(request)
      ).rejects.toThrow(FeeCalculationError)
    })

    it('should throw error for invalid amount', async () => {
      const request = {
        type: 'add',
        amount: -100,
        asset: 'USD',
        paymentMethod: 'credit_debit_card'
      }

      await expect(
        feeCalculationService.calculateTransactionFees(request)
      ).rejects.toThrow(FeeCalculationError)
    })

    it('should throw error for unsupported transaction type', async () => {
      const request = {
        type: 'invalid_type',
        amount: 100,
        asset: 'USD',
        paymentMethod: 'credit_debit_card'
      }

      await expect(
        feeCalculationService.calculateTransactionFees(request)
      ).rejects.toThrow(FeeCalculationError)
    })

    it('should handle fee provider service failures', async () => {
      mockFeeProviderService.getAllFeeData.mockRejectedValue(new Error('Service unavailable'))

      const request = {
        type: 'add',
        amount: 100,
        asset: 'USD',
        paymentMethod: 'credit_debit_card'
      }

      await expect(
        feeCalculationService.calculateTransactionFees(request)
      ).rejects.toThrow(FeeCalculationError)
    })
  })

  describe('Fee Comparison', () => {
    it('should calculate fee comparison across payment methods', async () => {
      const request = {
        type: 'add',
        amount: 100,
        asset: 'USD',
        chains: ['SOL']
      }

      const paymentMethods = ['credit_debit_card', 'bank_account', 'apple_pay']
      const comparisons = await feeCalculationService.calculateFeeComparison(request, paymentMethods)

      expect(comparisons).toHaveLength(3)
      expect(comparisons[0].recommended).toBe(true) // Cheapest should be recommended
      
      // Should be sorted by total fees (ascending)
      for (let i = 1; i < comparisons.length; i++) {
        expect(comparisons[i].totalFees.amount).toBeGreaterThanOrEqual(
          comparisons[i-1].totalFees.amount
        )
      }
    })

    it('should handle failures in fee comparison gracefully', async () => {
      const request = {
        type: 'add',
        amount: 100,
        asset: 'USD',
        chains: ['SOL']
      }

      // Mock one method to fail
      mockFeeProviderService.getAllFeeData
        .mockResolvedValueOnce(mockFeeRates)
        .mockRejectedValueOnce(new Error('Failed'))
        .mockResolvedValueOnce(mockFeeRates)

      const paymentMethods = ['credit_debit_card', 'invalid_method', 'bank_account']
      const comparisons = await feeCalculationService.calculateFeeComparison(request, paymentMethods)

      // Should return results for successful calculations only
      expect(comparisons.length).toBeLessThan(3)
    })
  })

  describe('Fee Impact Analysis', () => {
    it('should calculate fee impact on transaction', async () => {
      const request = {
        type: 'add',
        amount: 100,
        asset: 'USD',
        paymentMethod: 'credit_debit_card',
        chains: ['SOL']
      }

      const impact = await feeCalculationService.calculateFeeImpact(request)

      expect(impact.originalAmount.amount).toBe(100)
      expect(impact.totalFees.isPositive()).toBe(true)
      expect(impact.netAmount.lessThan(impact.originalAmount)).toBe(true)
      expect(impact.impactPercentage).toBeGreaterThan(0)
    })
  })

  describe('Currency Support', () => {
    it('should handle different currencies correctly', async () => {
      const request = {
        type: 'buy',
        amount: 0.1,
        asset: 'BTC',
        paymentMethod: 'credit_debit_card',
        chains: ['BTC']
      }

      const feeStructure = await feeCalculationService.calculateTransactionFees(request)

      expect(feeStructure.getPlatformFee().amount.currency).toBe('BTC')
      expect(feeStructure.getNetworkFee().amount.currency).toBe('BTC')
      expect(feeStructure.getProviderFee().amount.currency).toBe('BTC')
    })
  })

  describe('Chain-Specific Logic', () => {
    it('should use correct DEX rates for different chains', async () => {
      const solRequest = {
        type: 'buy',
        amount: 1000,
        asset: 'USD',
        paymentMethod: 'diboas_wallet',
        chains: ['SOL']
      }

      const ethRequest = {
        type: 'buy',
        amount: 1000,
        asset: 'USD', 
        paymentMethod: 'diboas_wallet',
        chains: ['ETH']
      }

      const solFees = await feeCalculationService.calculateTransactionFees(solRequest)
      const ethFees = await feeCalculationService.calculateTransactionFees(ethRequest)

      // SOL should use solana rate (0.002), ETH should use standard rate (0.003)
      expect(solFees.getDexFee().amount.amount).toBe(2) // 1000 * 0.002
      expect(ethFees.getDexFee().amount.amount).toBe(3) // 1000 * 0.003
    })
  })
})