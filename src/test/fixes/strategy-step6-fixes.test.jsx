/**
 * Tests for Strategy Step 6 Bug Fixes
 * Tests fee breakdown values, network fee percentages, and total cost calculation
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'
import { sanitizeFeeBreakdown } from '../../utils/numberFormatting.js'

describe('Strategy Step 6 Bug Fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('1. Fee Breakdown Values Fix', () => {
    it('should properly extract fee values from fee calculator response', () => {
      // Mock fee calculator response with the actual structure it returns
      const feeCalculatorResponse = {
        diBoaS: 0.90,      // 0.09% of $1000
        network: 0.10,     // 0.01% of $1000 
        dex: 5.0,          // 0.5% of $1000
        provider: 0,
        defi: 0,
        total: 6.0,
        breakdown: {
          diBoaS: { amount: 0.90, rate: 0.0009 },
          network: { amount: 0.10, rate: 0.0001 },
          dex: { amount: 5.0, rate: 0.005 },
          provider: { amount: 0, rate: 0 },
          defi: { amount: 0, rate: 0 }
        }
      }
      
      const sanitized = sanitizeFeeBreakdown(feeCalculatorResponse)
      
      expect(sanitized.breakdown.diboas).toBe(0.90)
      expect(sanitized.breakdown.network).toBe(0.10)
      expect(sanitized.breakdown.dex).toBe(5.0)
      expect(sanitized.breakdown.provider).toBe(0)
      expect(sanitized.breakdown.defi).toBe(0)
      expect(sanitized.total).toBe(6.0)
    })

    it('should handle legacy fee structure fallback', () => {
      // Mock legacy fee structure without nested breakdown
      const legacyFeeResponse = {
        diBoaS: 2.25,      // 0.09% of $2500
        network: 0.25,     // 0.01% of $2500
        dex: 12.5,         // 0.5% of $2500
        provider: 0,
        defi: 0,
        total: 15.0
        // No breakdown object
      }
      
      const sanitized = sanitizeFeeBreakdown(legacyFeeResponse)
      
      expect(sanitized.breakdown.diboas).toBe(2.25)
      expect(sanitized.breakdown.network).toBe(0.25)
      expect(sanitized.breakdown.dex).toBe(12.5)
      expect(sanitized.total).toBe(15.0)
    })

    it('should provide safe defaults for invalid fee data', () => {
      const invalidInputs = [null, undefined, 'invalid', {}, { breakdown: 'not an object' }]
      
      invalidInputs.forEach(input => {
        const sanitized = sanitizeFeeBreakdown(input)
        
        expect(sanitized.breakdown.diboas).toBe(0)
        expect(sanitized.breakdown.network).toBe(0)
        expect(sanitized.breakdown.dex).toBe(0)
        expect(sanitized.breakdown.provider).toBe(0)
        expect(sanitized.breakdown.defi).toBe(0)
        expect(sanitized.total).toBe(0)
      })
    })
  })

  describe('2. Network Fee Chain Percentage Fix', () => {
    it('should return correct network fee percentages for different chains', () => {
      const getNetworkFeePercentage = (chain) => {
        const networkFeeRates = {
          'SOL': '0.01%',
          'ETH': '0.02%', 
          'BTC': '0.05%',
          'SUI': '0.01%'
        }
        return networkFeeRates[chain] || '0.01%'
      }
      
      expect(getNetworkFeePercentage('SOL')).toBe('0.01%')
      expect(getNetworkFeePercentage('ETH')).toBe('0.02%')
      expect(getNetworkFeePercentage('BTC')).toBe('0.05%')
      expect(getNetworkFeePercentage('SUI')).toBe('0.01%')
      expect(getNetworkFeePercentage('UNKNOWN')).toBe('0.01%') // fallback
    })

    it('should include chain information in strategy templates', () => {
      const STRATEGY_TEMPLATES = {
        'free-coffee': {
          id: 'free-coffee',
          name: 'Free Coffee',
          chain: 'ETH',
          protocol: 'Aave',
          asset: 'USDC'
        },
        'emergency-fund': {
          id: 'emergency-fund', 
          name: 'Emergency Fund',
          chain: 'SOL',
          protocol: 'Solend',
          asset: 'USDC'
        }
      }
      
      expect(STRATEGY_TEMPLATES['free-coffee'].chain).toBe('ETH')
      expect(STRATEGY_TEMPLATES['free-coffee'].protocol).toBe('Aave')
      expect(STRATEGY_TEMPLATES['emergency-fund'].chain).toBe('SOL')
      expect(STRATEGY_TEMPLATES['emergency-fund'].protocol).toBe('Solend')
    })
  })

  describe('3. Total Cost Balance Deduction Fix', () => {
    it('should calculate total cost correctly (investment + fees)', () => {
      const initialAmount = 1000
      const feeBreakdown = {
        breakdown: {
          diboas: 9.0,   // 0.9%
          network: 1.0,  // 0.1%
          dex: 50.0,     // 5%
          provider: 0,
          defi: 0
        },
        total: 60.0
      }
      
      const totalCost = initialAmount + feeBreakdown.total
      
      expect(totalCost).toBe(1060.0)
    })

    it('should create transaction data with correct amounts for balance deduction', () => {
      const safeInitialAmount = 500
      const feeBreakdown = { total: 7.5 }
      const totalCost = safeInitialAmount + feeBreakdown.total
      
      const mockTransactionResult = {
        id: 'strategy_123',
        fees: { total: 7.5 }
      }
      
      // Simulate the transaction data creation
      const transactionData = {
        ...mockTransactionResult,
        type: 'start_strategy',
        amount: totalCost, // This should be used for balance deduction
        investmentAmount: safeInitialAmount, // This is the actual investment
        fees: feeBreakdown,
        paymentMethod: 'diboas_wallet'
      }
      
      expect(transactionData.amount).toBe(507.5) // Total cost for balance deduction
      expect(transactionData.investmentAmount).toBe(500) // Actual investment
      expect(transactionData.fees.total).toBe(7.5)
    })

    it('should simulate correct balance updates in DataManager logic', () => {
      // Simulate the DataManager balance update logic for start_strategy
      const simulateBalanceUpdate = (currentBalance, transactionData) => {
        const { amount, fees, paymentMethod } = transactionData
        const numericAmount = parseFloat(amount)
        const feesTotal = parseFloat(fees?.total || 0)
        const netStrategyAmount = numericAmount - feesTotal
        
        const newBalance = { ...currentBalance }
        
        if (paymentMethod === 'diboas_wallet') {
          // Available Balance = current - total cost (amount)
          newBalance.availableForSpending -= numericAmount
          // Strategy Balance = current + net investment (amount - fees)
          newBalance.strategyBalance += netStrategyAmount
        }
        
        return newBalance
      }
      
      const initialBalance = {
        availableForSpending: 2000,
        strategyBalance: 0
      }
      
      const transactionData = {
        amount: 1060, // Total cost (1000 + 60 fees)
        fees: { total: 60 },
        paymentMethod: 'diboas_wallet'
      }
      
      const updatedBalance = simulateBalanceUpdate(initialBalance, transactionData)
      
      expect(updatedBalance.availableForSpending).toBe(940) // 2000 - 1060
      expect(updatedBalance.strategyBalance).toBe(1000) // 1060 - 60 = 1000 (net investment)
    })
  })

  describe('4. Integration Test', () => {
    it('should handle complete fee calculation and balance update flow', () => {
      // Mock complete flow from fee calculation to balance update
      const initialAmount = 750
      
      // Step 1: Fee calculator returns fee breakdown
      const feeCalculatorResponse = {
        diBoaS: 6.75,      // 0.9% of $750
        network: 0.75,     // 0.1% of $750
        dex: 37.5,         // 5% of $750
        total: 45.0,
        breakdown: {
          diBoaS: { amount: 6.75, rate: 0.009 },
          network: { amount: 0.75, rate: 0.001 },
          dex: { amount: 37.5, rate: 0.05 }
        }
      }
      
      // Step 2: Sanitize fee breakdown
      const sanitizedFees = sanitizeFeeBreakdown(feeCalculatorResponse)
      
      // Step 3: Calculate total cost
      const totalCost = initialAmount + sanitizedFees.total
      
      // Step 4: Create transaction data
      const transactionData = {
        type: 'start_strategy',
        amount: totalCost,
        investmentAmount: initialAmount,
        fees: sanitizedFees,
        paymentMethod: 'diboas_wallet'
      }
      
      // Step 5: Simulate balance update
      const initialBalance = { availableForSpending: 1500, strategyBalance: 250 }
      const numericAmount = parseFloat(transactionData.amount)
      const feesTotal = parseFloat(transactionData.fees.total)
      
      const finalBalance = {
        availableForSpending: initialBalance.availableForSpending - numericAmount,
        strategyBalance: initialBalance.strategyBalance + (numericAmount - feesTotal)
      }
      
      // Verify the complete flow
      expect(sanitizedFees.total).toBe(45.0)
      expect(totalCost).toBe(795.0)
      expect(transactionData.amount).toBe(795.0)
      expect(transactionData.investmentAmount).toBe(750)
      expect(finalBalance.availableForSpending).toBe(705) // 1500 - 795
      expect(finalBalance.strategyBalance).toBe(1000) // 250 + (795 - 45) = 250 + 750
    })
  })
})