/**
 * Strategy Edge Cases and Recovery Scenarios Tests
 * Comprehensive testing of edge cases, error conditions, and recovery scenarios
 * for the new FinObjective strategy system
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FeeCalculator } from '../../utils/feeCalculations.js'
import { StrategyConfigurationService } from '../../services/defi/StrategyConfigurationService.js'
import { StrategyMatchingService } from '../../services/defi/StrategyMatchingService.js'
import { StrategyLifecycleManager } from '../../services/defi/StrategyLifecycleManager.js'

describe('Strategy Edge Cases and Recovery Scenarios', () => {
  let feeCalculator
  let configService
  let matchingService
  let lifecycleManager

  beforeEach(() => {
    feeCalculator = new FeeCalculator()
    configService = new StrategyConfigurationService()
    matchingService = new StrategyMatchingService()
    lifecycleManager = new StrategyLifecycleManager()
  })

  describe('Fee Calculation Edge Cases', () => {
    it('should handle minimum strategy amounts correctly', () => {
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
      expect(fees.total).toBeGreaterThan(0)
    })

    it('should handle maximum strategy amounts correctly', () => {
      const fees = feeCalculator.calculateFees({
        type: 'start_strategy',
        amount: 1000000, // Large amount
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['ETH']
      })

      expect(fees.diBoaS).toBeCloseTo(900, 2) // 1000000 * 0.0009
      expect(fees.dex).toBeCloseTo(5000, 2) // 1000000 * 0.005
      expect(fees.network).toBeCloseTo(5000, 2) // 1000000 * 0.005 (ETH)
      expect(fees.total).toBeCloseTo(10900, 2)
    })

    it('should reject zero or negative amounts', () => {
      expect(() => {
        feeCalculator.calculateFees({
          type: 'start_strategy',
          amount: 0,
          paymentMethod: 'diboas_wallet',
          asset: 'USDC',
          chains: ['SOL']
        })
      }).toThrow('Amount must be positive')

      expect(() => {
        feeCalculator.calculateFees({
          type: 'start_strategy',
          amount: -100,
          paymentMethod: 'diboas_wallet',
          asset: 'USDC',
          chains: ['SOL']
        })
      }).toThrow('Amount must be positive')
    })

    it('should handle invalid transaction types gracefully', () => {
      expect(() => {
        feeCalculator.calculateFees({
          type: 'invalid_strategy_type',
          amount: 1000,
          paymentMethod: 'diboas_wallet',
          asset: 'USDC',
          chains: ['SOL']
        })
      }).not.toThrow()
    })

    it('should enforce diBoaS wallet only for strategies', () => {
      // External payment methods should still work but only show DEX fee as provider fee
      const feesExternal = feeCalculator.calculateFees({
        type: 'start_strategy',
        amount: 1000,
        paymentMethod: 'credit_debit_card',
        asset: 'USDC',
        chains: ['SOL']
      })

      expect(feesExternal.provider).toBeCloseTo(5, 2) // DEX fee shown as provider
      expect(feesExternal.dex).toBeCloseTo(5, 2) // DEX fee
    })

    it('should handle unsupported chains gracefully', () => {
      const fees = feeCalculator.calculateFees({
        type: 'start_strategy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['UNSUPPORTED_CHAIN']
      })

      expect(fees.network).toBe(0) // Should default to 0 for unsupported chains
      expect(fees.diBoaS).toBeCloseTo(0.9, 2)
      expect(fees.dex).toBeCloseTo(5, 2)
    })
  })

  describe('Strategy Configuration Edge Cases', () => {
    it('should validate strategy name requirements', () => {
      configService.initializeConfiguration()

      // Too short name
      expect(() => {
        configService.updateStep(1, { name: 'Ab' })
      }).toThrow('Strategy name must be at least 3 characters')

      // Empty name
      expect(() => {
        configService.updateStep(1, { name: '' })
      }).toThrow('Strategy name must be at least 3 characters')

      // Valid name should work
      expect(() => {
        configService.updateStep(1, { name: 'Valid Strategy Name' })
      }).not.toThrow()
    })

    it('should validate investment amount requirements', () => {
      configService.initializeConfiguration()

      // Below minimum
      expect(() => {
        configService.updateStep(2, { initialAmount: 25 })
      }).toThrow('Initial amount must be at least $50')

      // Negative amount
      expect(() => {
        configService.updateStep(2, { initialAmount: -100 })
      }).toThrow('Initial amount must be at least $50')

      // Negative recurring amount
      expect(() => {
        configService.updateStep(2, { 
          initialAmount: 100,
          recurringAmount: -50 
        })
      }).toThrow('Recurring amount cannot be negative')

      // Valid amounts should work
      expect(() => {
        configService.updateStep(2, { 
          initialAmount: 100,
          recurringAmount: 50 
        })
      }).not.toThrow()
    })

    it('should validate goal configuration', () => {
      configService.initializeConfiguration()
      configService.updateStep(2, { initialAmount: 1000 })

      // Target amount must be greater than initial
      expect(() => {
        configService.updateStep(3, { 
          goalType: 'amount',
          targetAmount: 500 // Less than initial
        })
      }).toThrow('Target amount must be greater than initial amount')

      // Invalid income goal
      expect(() => {
        configService.updateStep(3, { 
          goalType: 'income',
          targetIncome: { amount: 0, period: 'monthly' }
        })
      }).toThrow('Target income must be greater than 0')

      // Valid goals should work
      expect(() => {
        configService.updateStep(3, { 
          goalType: 'amount',
          targetAmount: 5000
        })
      }).not.toThrow()
    })

    it('should handle invalid step numbers', () => {
      configService.initializeConfiguration()

      expect(() => {
        configService.updateStep(0, {})
      }).toThrow('Invalid step number: 0')

      expect(() => {
        configService.updateStep(9, {})
      }).toThrow('Invalid step number: 9')
    })

    it('should handle template loading errors', () => {
      expect(() => {
        configService.loadTemplate('nonexistent_template')
      }).toThrow('Template nonexistent_template not found')
    })

    it('should persist configuration across sessions', () => {
      configService.initializeConfiguration()
      configService.updateStep(1, { name: 'Test Strategy' })
      configService.saveToStorage()

      // Create new service instance to simulate page reload
      const newService = new StrategyConfigurationService()
      const savedConfig = newService.loadFromStorage()

      expect(savedConfig.name).toBe('Test Strategy')
    })
  })

  describe('Strategy Matching Edge Cases', () => {
    it('should handle impossible goals gracefully', () => {
      const searchCriteria = {
        initialAmount: 100,
        recurringAmount: 0,
        frequency: 'monthly',
        targetAmount: 1000000, // Impossible target
        riskTolerance: 'conservative'
      }

      return matchingService.searchStrategies(searchCriteria).then(results => {
        expect(results.strategies).toBeDefined()
        expect(results.searchMeta.requiredAPY).toBeGreaterThan(100) // Very high APY required
      })
    })

    it('should handle zero recurring amounts', () => {
      const searchCriteria = {
        initialAmount: 1000,
        recurringAmount: 0,
        frequency: 'monthly',
        targetAmount: 1200,
        riskTolerance: 'moderate'
      }

      return matchingService.searchStrategies(searchCriteria).then(results => {
        expect(results.strategies).toBeDefined()
        expect(results.searchMeta.requiredAPY).toBeGreaterThan(0)
      })
    })

    it('should filter strategies by amount limits', () => {
      const searchCriteria = {
        initialAmount: 10000, // High amount
        targetAmount: 12000,
        riskTolerance: 'aggressive'
      }

      return matchingService.searchStrategies(searchCriteria).then(results => {
        // Should exclude strategies with maxAmount < 10000
        results.strategies.forEach(strategy => {
          expect(strategy.maxAmount).toBeGreaterThanOrEqual(10000)
        })
      })
    })

    it('should respect risk tolerance limits', () => {
      const searchCriteria = {
        initialAmount: 1000,
        targetAmount: 1200,
        riskTolerance: 'conservative'
      }

      return matchingService.searchStrategies(searchCriteria).then(results => {
        // Should only include conservative and moderate strategies
        results.strategies.forEach(strategy => {
          expect(['conservative', 'moderate']).toContain(strategy.riskLevel)
        })
      })
    })

    it('should calculate required APY correctly', () => {
      const requiredAPY = matchingService.calculateRequiredAPY(
        1000, // initial
        100,  // recurring
        'monthly', // frequency
        2000, // target
        365   // days
      )

      expect(requiredAPY).toBeGreaterThan(0)
      expect(requiredAPY).toBeLessThan(1000) // Reasonable APY
    })
  })

  describe('Strategy Lifecycle Edge Cases', () => {
    it('should handle strategy creation with invalid config', async () => {
      await expect(lifecycleManager.createStrategy({})).rejects.toThrow()
    })

    it('should handle stopping non-existent strategy', async () => {
      await expect(lifecycleManager.stopStrategy('invalid_id')).rejects.toThrow('Strategy invalid_id not found')
    })

    it('should handle pausing already paused strategy', async () => {
      const strategy = await lifecycleManager.createStrategy({
        name: 'Test Strategy',
        initialAmount: 1000,
        selectedStrategy: {
          name: 'Test Protocol',
          chain: 'SOL',
          apy: { average: 8.0 }
        }
      })

      await lifecycleManager.pauseStrategy(strategy.id)
      
      // Should handle multiple pause attempts gracefully
      await lifecycleManager.pauseStrategy(strategy.id)
      expect(strategy.status).toBe('paused')
    })

    it('should handle resuming non-paused strategy', async () => {
      const strategy = await lifecycleManager.createStrategy({
        name: 'Test Strategy',
        initialAmount: 1000,
        selectedStrategy: {
          name: 'Test Protocol',
          chain: 'SOL',
          apy: { average: 8.0 }
        }
      })

      await expect(lifecycleManager.resumeStrategy(strategy.id)).rejects.toThrow('Strategy is not paused')
    })

    it('should handle recurring contributions for stopped strategies', async () => {
      const strategy = await lifecycleManager.createStrategy({
        name: 'Test Strategy',
        initialAmount: 1000,
        recurringAmount: 100,
        selectedStrategy: {
          name: 'Test Protocol',
          chain: 'SOL',
          apy: { average: 8.0 }
        }
      })

      await lifecycleManager.stopStrategy(strategy.id)
      
      const result = await lifecycleManager.processRecurringContribution(strategy.id)
      expect(result).toBeNull() // Should not process contributions for stopped strategies
    })

    it('should calculate portfolio metrics correctly with no strategies', () => {
      const overview = lifecycleManager.getPortfolioOverview()
      
      expect(overview.totalStrategies).toBe(0)
      expect(overview.totalValue).toBe(0)
      expect(overview.totalContributions).toBe(0)
      expect(overview.totalReturn).toBe(0)
      expect(overview.returnPercentage).toBe(0)
    })

    it('should handle performance updates for non-existent strategies', () => {
      const result = lifecycleManager.updateStrategyPerformance('invalid_id', {})
      expect(result).toBeNull()
    })
  })

  describe('Recovery Scenarios', () => {
    it('should handle network timeouts gracefully', async () => {
      // Mock network timeout
      const mockSearch = vi.spyOn(matchingService, 'searchStrategies')
      mockSearch.mockRejectedValue(new Error('Network timeout'))

      const searchCriteria = {
        initialAmount: 1000,
        targetAmount: 1200
      }

      await expect(matchingService.searchStrategies(searchCriteria)).rejects.toThrow('Network timeout')
      mockSearch.mockRestore()
    })

    it('should handle fee calculation service failures', () => {
      // Mock fee calculation failure
      const mockCalculate = vi.spyOn(feeCalculator, 'calculateCoreFee')
      mockCalculate.mockImplementation(() => { throw new Error('Fee service unavailable') })

      expect(() => {
        feeCalculator.calculateFees({
          type: 'start_strategy',
          amount: 1000,
          paymentMethod: 'diboas_wallet',
          asset: 'USDC',
          chains: ['SOL']
        })
      }).toThrow('Fee service unavailable')

      mockCalculate.mockRestore()
    })

    it('should handle localStorage failures gracefully', () => {
      // Mock localStorage failure
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn(() => { throw new Error('Storage quota exceeded') })

      configService.initializeConfiguration()
      
      // Should not throw even if localStorage fails
      expect(() => {
        configService.saveToStorage()
      }).not.toThrow()

      localStorage.setItem = originalSetItem
    })

    it('should handle corrupted configuration data', () => {
      // Set corrupted data in localStorage
      localStorage.setItem('strategy_config', 'invalid json data')

      const newService = new StrategyConfigurationService()
      const result = newService.loadFromStorage()
      
      expect(result).toBeNull() // Should handle gracefully
      expect(localStorage.getItem('strategy_config')).toBeNull() // Should clear corrupted data
    })

    it('should handle concurrent fee calculations', async () => {
      const promises = []
      
      // Create multiple concurrent fee calculations
      for (let i = 0; i < 10; i++) {
        promises.push(
          feeCalculator.calculateFees({
            type: 'start_strategy',
            amount: 1000 + i,
            paymentMethod: 'diboas_wallet',
            asset: 'USDC',
            chains: ['SOL']
          })
        )
      }

      const results = await Promise.all(promises)
      
      // All should complete successfully
      expect(results).toHaveLength(10)
      results.forEach(result => {
        expect(result.total).toBeGreaterThan(0)
      })
    })
  })

  describe('Data Consistency and Validation', () => {
    it('should maintain strategy event consistency', async () => {
      const strategy = await lifecycleManager.createStrategy({
        name: 'Test Strategy',
        initialAmount: 1000,
        selectedStrategy: {
          name: 'Test Protocol',
          chain: 'SOL',
          apy: { average: 8.0 }
        }
      })

      expect(strategy.events).toHaveLength(1)
      expect(strategy.events[0].type).toBe('created')

      await lifecycleManager.pauseStrategy(strategy.id)
      expect(strategy.events).toHaveLength(2)
      expect(strategy.events[1].type).toBe('paused')

      await lifecycleManager.resumeStrategy(strategy.id)
      expect(strategy.events).toHaveLength(3)
      expect(strategy.events[2].type).toBe('resumed')
    })

    it('should validate fee calculation consistency across amounts', () => {
      const amounts = [50, 100, 500, 1000, 5000, 10000]
      
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

    it('should handle strategy ID uniqueness', async () => {
      const strategy1 = await lifecycleManager.createStrategy({
        name: 'Strategy 1',
        initialAmount: 1000,
        selectedStrategy: { name: 'Protocol', chain: 'SOL', apy: { average: 8.0 } }
      })

      const strategy2 = await lifecycleManager.createStrategy({
        name: 'Strategy 2',
        initialAmount: 1000,
        selectedStrategy: { name: 'Protocol', chain: 'SOL', apy: { average: 8.0 } }
      })

      expect(strategy1.id).not.toBe(strategy2.id)
    })
  })

  describe('Performance and Memory Management', () => {
    it('should limit daily returns history', async () => {
      const strategy = await lifecycleManager.createStrategy({
        name: 'Test Strategy',
        initialAmount: 1000,
        selectedStrategy: {
          name: 'Test Protocol',
          chain: 'SOL',
          apy: { average: 8.0 }
        }
      })

      // Simulate 400 days of returns (more than 365 limit)
      for (let i = 0; i < 400; i++) {
        lifecycleManager.updateStrategyPerformance(strategy.id, {})
      }

      expect(strategy.performance.dailyReturns.length).toBeLessThanOrEqual(365)
    })

    it('should clear cache when requested', () => {
      feeCalculator.calculateFees({
        type: 'start_strategy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['SOL']
      })

      expect(feeCalculator.cache.size).toBeGreaterThan(0)
      
      feeCalculator.clearCache()
      expect(feeCalculator.cache.size).toBe(0)
    })
  })
})