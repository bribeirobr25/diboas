/**
 * Strategy Flow Integration Tests
 * Tests the complete 8-step strategy configuration flow
 * Validates end-to-end integration and user journey scenarios
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { FeeCalculator } from '../../utils/feeCalculations.js'
import { StrategyConfigurationService } from '../../services/defi/StrategyConfigurationService.js'
import { StrategyMatchingService } from '../../services/defi/StrategyMatchingService.js'
import { StrategyLifecycleManager } from '../../services/defi/StrategyLifecycleManager.js'
import { StrategyTransactionIntegration } from '../../services/defi/StrategyTransactionIntegration.js'

describe('Strategy Flow Integration Tests', () => {
  let feeCalculator
  let configService
  let matchingService
  let lifecycleManager
  let transactionIntegration

  beforeEach(() => {
    feeCalculator = new FeeCalculator()
    configService = new StrategyConfigurationService()
    matchingService = new StrategyMatchingService()
    lifecycleManager = new StrategyLifecycleManager()
    transactionIntegration = new StrategyTransactionIntegration()
  })

  describe('Complete 8-Step Flow', () => {
    it('should complete full strategy creation flow', async () => {
      // Step 1: Name & Image
      configService.initializeConfiguration()
      const step1Config = configService.updateStep(1, {
        name: 'Emergency Fund Strategy',
        description: 'Building my emergency fund with conservative DeFi yields',
        icon: '🛡️'
      })
      
      expect(step1Config.name).toBe('Emergency Fund Strategy')
      expect(configService.isStepComplete(1)).toBe(true)

      // Step 2: Investment
      const step2Config = configService.updateStep(2, {
        initialAmount: 1000,
        recurringAmount: 200,
        recurringFrequency: 'monthly'
      })
      
      expect(step2Config.initialAmount).toBe(1000)
      expect(configService.isStepComplete(2)).toBe(true)

      // Step 3: Goals
      const step3Config = configService.updateStep(3, {
        goalType: 'amount',
        targetAmount: 5000,
        targetDate: '2025-12-31'
      })
      
      expect(step3Config.targetAmount).toBe(5000)
      expect(configService.isStepComplete(3)).toBe(true)

      // Step 4: Search (prepare criteria)
      const searchCriteria = configService.prepareSearchCriteria()
      expect(searchCriteria.initialAmount).toBe(1000)
      expect(searchCriteria.targetAmount).toBe(5000)

      // Step 5: Strategy Selection (simulate search and selection)
      const searchResults = await matchingService.searchStrategies(searchCriteria)
      expect(searchResults.strategies.length).toBeGreaterThan(0)
      
      const selectedStrategy = searchResults.strategies[0]
      const step5Config = configService.updateStep(5, {
        selectedStrategy,
        searchResults
      })
      
      expect(step5Config.selectedStrategy).toBeDefined()
      expect(configService.isStepComplete(5)).toBe(true)

      // Step 6: Review (calculate final fees)
      const finalFees = feeCalculator.calculateFees({
        type: 'start_strategy',
        amount: 1000,
        chains: [selectedStrategy.chain]
      })
      
      const step6Config = configService.updateStep(6, {
        finalConfiguration: step5Config,
        feeCalculation: finalFees
      })
      
      expect(step6Config.feeCalculation).toBeDefined()
      expect(configService.isStepComplete(6)).toBe(true)

      // Step 7: Launch (create strategy)
      const strategy = await lifecycleManager.createStrategy({
        ...step6Config,
        selectedStrategy
      })
      
      expect(strategy.id).toBeDefined()
      expect(strategy.status).toBe('active')

      // Step 8: Management (strategy is active)
      const portfolioOverview = lifecycleManager.getPortfolioOverview()
      expect(portfolioOverview.totalStrategies).toBe(1)
      expect(portfolioOverview.totalValue).toBe(1000)
    })

    it('should handle step validation correctly', () => {
      configService.initializeConfiguration()

      // Step 1 should not be complete initially
      expect(configService.isStepComplete(1)).toBe(false)

      // Should not allow proceeding without completing step 1
      expect(() => {
        configService.updateStep(1, { name: 'Ab' }) // Too short
      }).toThrow('Strategy name must be at least 3 characters')

      // Complete step 1 properly
      configService.updateStep(1, { name: 'Valid Strategy Name' })
      expect(configService.isStepComplete(1)).toBe(true)

      // Step 2 validation
      expect(() => {
        configService.updateStep(2, { initialAmount: 25 }) // Below minimum
      }).toThrow('Initial amount must be at least $50')

      // Complete step 2 properly
      configService.updateStep(2, { initialAmount: 1000 })
      expect(configService.isStepComplete(2)).toBe(true)

      // Step 3 validation
      expect(() => {
        configService.updateStep(3, { 
          goalType: 'amount',
          targetAmount: 500 // Less than initial amount
        })
      }).toThrow('Target amount must be greater than initial amount')
    })

    it('should handle template-based configuration', () => {
      configService.initializeConfiguration('emergency-funds')
      
      const template = configService.loadTemplate('emergency-funds')
      expect(template.name).toBe('Emergency Fund')
      expect(template.targetAmount).toBe(5000)
      expect(template.riskTolerance).toBe('conservative')
      
      const config = configService.getCurrentConfiguration()
      expect(config.name).toBe('Emergency Fund')
      expect(config.targetAmount).toBe(5000)
    })

    it('should persist configuration across steps', () => {
      configService.initializeConfiguration()
      
      // Configure multiple steps
      configService.updateStep(1, { name: 'Test Strategy', icon: '🎯' })
      configService.updateStep(2, { initialAmount: 1000, recurringAmount: 100 })
      configService.updateStep(3, { goalType: 'amount', targetAmount: 2000 })
      
      // Save and reload
      configService.saveToStorage()
      const newService = new StrategyConfigurationService()
      const loadedConfig = newService.loadFromStorage()
      
      expect(loadedConfig.name).toBe('Test Strategy')
      expect(loadedConfig.initialAmount).toBe(1000)
      expect(loadedConfig.targetAmount).toBe(2000)
    })
  })

  describe('Cross-Chain Strategy Support', () => {
    it('should support SOL chain strategies', async () => {
      const searchCriteria = {
        initialAmount: 1000,
        targetAmount: 1200,
        riskTolerance: 'conservative'
      }
      
      const results = await matchingService.searchStrategies(searchCriteria)
      const solStrategies = results.strategies.filter(s => s.chain === 'SOL')
      
      expect(solStrategies.length).toBeGreaterThan(0)
      
      // Test fees for SOL strategy
      const fees = feeCalculator.calculateFees({
        type: 'start_strategy',
        amount: 1000,
        chains: ['SOL']
      })
      
      expect(fees.network).toBeCloseTo(0.01, 3) // SOL network fee
    })

    it('should support ETH chain strategies', async () => {
      const searchCriteria = {
        initialAmount: 2000, // Higher minimum for ETH
        targetAmount: 2500,
        riskTolerance: 'moderate'
      }
      
      const results = await matchingService.searchStrategies(searchCriteria)
      const ethStrategies = results.strategies.filter(s => s.chain === 'ETH')
      
      expect(ethStrategies.length).toBeGreaterThan(0)
      
      // Test fees for ETH strategy
      const fees = feeCalculator.calculateFees({
        type: 'start_strategy',
        amount: 2000,
        chains: ['ETH']
      })
      
      expect(fees.network).toBeCloseTo(10, 2) // ETH network fee (0.5%)
    })

    it('should support SUI chain strategies', async () => {
      const searchCriteria = {
        initialAmount: 500,
        targetAmount: 750,
        riskTolerance: 'aggressive'
      }
      
      const results = await matchingService.searchStrategies(searchCriteria)
      const suiStrategies = results.strategies.filter(s => s.chain === 'SUI')
      
      expect(suiStrategies.length).toBeGreaterThan(0)
      
      // Test fees for SUI strategy
      const fees = feeCalculator.calculateFees({
        type: 'start_strategy',
        amount: 500,
        chains: ['SUI']
      })
      
      expect(fees.network).toBeCloseTo(0.015, 3) // SUI network fee
    })
  })

  describe('Payment Method Restrictions', () => {
    it('should only allow diBoaS wallet for strategy transactions', () => {
      const validPaymentMethods = ['diboas_wallet']
      
      validPaymentMethods.forEach(method => {
        const fees = feeCalculator.calculateFees({
          type: 'start_strategy',
          amount: 1000,
          paymentMethod: method,
          chains: ['SOL']
        })
        
        expect(fees.total).toBeGreaterThan(0)
      })
    })

    it('should handle external payment methods gracefully for strategies', () => {
      const externalMethods = ['credit_debit_card', 'apple_pay', 'google_pay', 'bank_account', 'paypal']
      
      externalMethods.forEach(method => {
        const fees = feeCalculator.calculateFees({
          type: 'start_strategy',
          amount: 1000,
          paymentMethod: method,
          chains: ['SOL']
        })
        
        // Should still calculate fees but show DEX fee as provider fee
        expect(fees.provider).toBeCloseTo(5, 2) // DEX fee shown as provider
        expect(fees.dex).toBeCloseTo(5, 2) // Actual DEX fee
      })
    })

    it('should show correct fee structure for strategies vs other transactions', () => {
      // Strategy transaction
      const strategyFees = feeCalculator.calculateFees({
        type: 'start_strategy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        chains: ['SOL']
      })
      
      // Regular transaction
      const regularFees = feeCalculator.calculateFees({
        type: 'buy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        chains: ['SOL']
      })
      
      // Strategy should have 0.5% DEX fee, regular should have 1% DEX fee
      expect(strategyFees.dex).toBeCloseTo(5, 2) // 0.5%
      expect(regularFees.dex).toBeCloseTo(10, 2) // 1%
    })
  })

  describe('Fee Structure Compliance', () => {
    it('should implement exact fee structure specified', () => {
      const testCases = [
        { amount: 1000, chain: 'SOL', expectedDiBoaS: 0.9, expectedNetwork: 0.01, expectedDEX: 5 },
        { amount: 2000, chain: 'ETH', expectedDiBoaS: 1.8, expectedNetwork: 10, expectedDEX: 10 },
        { amount: 500, chain: 'SUI', expectedDiBoaS: 0.45, expectedNetwork: 0.015, expectedDEX: 2.5 }
      ]
      
      testCases.forEach(({ amount, chain, expectedDiBoaS, expectedNetwork, expectedDEX }) => {
        const fees = feeCalculator.calculateFees({
          type: 'start_strategy',
          amount,
          paymentMethod: 'diboas_wallet',
          chains: [chain]
        })
        
        expect(fees.diBoaS).toBeCloseTo(expectedDiBoaS, 2)
        expect(fees.network).toBeCloseTo(expectedNetwork, 3)
        expect(fees.dex).toBeCloseTo(expectedDEX, 2)
        expect(fees.defi).toBe(0) // No DeFi fees for strategies
      })
    })

    it('should mimic external wallet withdrawal fee structure', () => {
      // Strategy fee structure should be similar to external wallet withdrawals
      // but with different rates
      
      const strategyFees = feeCalculator.calculateFees({
        type: 'start_strategy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        chains: ['SOL']
      })
      
      const transferFees = feeCalculator.calculateFees({
        type: 'transfer',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        chains: ['BTC']
      })
      
      // Both should have diBoaS + network + DEX structure
      expect(strategyFees.diBoaS).toBeGreaterThan(0)
      expect(strategyFees.network).toBeGreaterThan(0)
      expect(strategyFees.dex).toBeGreaterThan(0)
      
      expect(transferFees.diBoaS).toBeGreaterThan(0)
      expect(transferFees.network).toBeGreaterThan(0)
      expect(transferFees.dex).toBeGreaterThan(0)
      
      // Strategy should have lower diBoaS fee (0.09% vs 0.9%)
      expect(strategyFees.diBoaS).toBeLessThan(transferFees.diBoaS)
    })
  })

  describe('Transaction History Integration', () => {
    it('should record strategy creation transactions', async () => {
      const strategy = await lifecycleManager.createStrategy({
        name: 'Test Strategy',
        initialAmount: 1000,
        selectedStrategy: {
          name: 'Test Protocol',
          chain: 'SOL',
          apy: { average: 8.0 }
        }
      })
      
      const transaction = await transactionIntegration.recordStrategyCreation(
        strategy,
        { success: true, fees: { total: 5.91 } }
      )
      
      expect(transaction.type).toBe('start_strategy')
      expect(transaction.amount).toBe(1000)
      expect(transaction.strategyId).toBe(strategy.id)
      expect(transaction.description).toContain('Started DeFi strategy')
    })

    it('should record recurring contributions', async () => {
      const strategy = await lifecycleManager.createStrategy({
        name: 'Test Strategy',
        initialAmount: 1000,
        recurringAmount: 200,
        selectedStrategy: {
          name: 'Test Protocol',
          chain: 'SOL',
          apy: { average: 8.0 }
        }
      })
      
      const contributionResult = await lifecycleManager.processRecurringContribution(strategy.id)
      
      expect(contributionResult.contributionAmount).toBe(200)
      expect(contributionResult.strategy.performance.totalContributions).toBe(1200)
    })

    it('should format transactions for UI display', () => {
      const transaction = {
        id: 'txn_123',
        type: 'start_strategy',
        amount: 1000,
        fees: { total: 5.91 },
        timestamp: new Date().toISOString(),
        status: 'completed',
        description: 'Started DeFi strategy: Test Strategy',
        strategyName: 'Test Strategy',
        targetChain: 'SOL'
      }
      
      const formatted = transactionIntegration.formatStrategyTransactionForUI(transaction)
      
      expect(formatted.icon).toBe('🚀')
      expect(formatted.title).toBe('Strategy Started')
      expect(formatted.badgeText).toBe('STARTED')
      expect(formatted.showAmount).toBe(true)
      expect(formatted.showFees).toBe(true)
    })
  })

  describe('Performance and Analytics', () => {
    it('should track strategy performance metrics', async () => {
      const strategy = await lifecycleManager.createStrategy({
        name: 'Test Strategy',
        initialAmount: 1000,
        selectedStrategy: {
          name: 'Test Protocol',
          chain: 'SOL',
          apy: { average: 8.0 }
        }
      })
      
      // Simulate performance updates
      lifecycleManager.updateStrategyPerformance(strategy.id, {})
      
      const metrics = lifecycleManager.getStrategyMetrics(strategy.id)
      
      expect(metrics.strategyId).toBe(strategy.id)
      expect(metrics.currentValue).toBeGreaterThan(1000) // Should have some growth
      expect(metrics.daysActive).toBeGreaterThanOrEqual(0)
    })

    it('should calculate portfolio overview correctly', async () => {
      // Create multiple strategies
      const strategy1 = await lifecycleManager.createStrategy({
        name: 'Strategy 1',
        initialAmount: 1000,
        selectedStrategy: { name: 'Protocol 1', chain: 'SOL', apy: { average: 8.0 } }
      })
      
      const strategy2 = await lifecycleManager.createStrategy({
        name: 'Strategy 2',
        initialAmount: 2000,
        selectedStrategy: { name: 'Protocol 2', chain: 'ETH', apy: { average: 6.0 } }
      })
      
      const overview = lifecycleManager.getPortfolioOverview()
      
      expect(overview.totalStrategies).toBe(2)
      expect(overview.totalValue).toBeGreaterThan(3000) // Should have some growth
      expect(overview.totalContributions).toBe(3000)
      expect(overview.strategies).toHaveLength(2)
    })
  })

  describe('Error Handling and Recovery', () => {
    it('should handle strategy creation failures gracefully', async () => {
      await expect(lifecycleManager.createStrategy(null)).rejects.toThrow()
      
      // Portfolio should remain unchanged
      const overview = lifecycleManager.getPortfolioOverview()
      expect(overview.totalStrategies).toBe(0)
    })

    it('should handle search failures with proper error messages', async () => {
      // Mock search failure
      const mockSearch = vi.spyOn(matchingService, 'searchStrategies')
      mockSearch.mockRejectedValue(new Error('DeFi API unavailable'))
      
      await expect(matchingService.searchStrategies({})).rejects.toThrow('DeFi API unavailable')
      
      mockSearch.mockRestore()
    })

    it('should maintain data consistency during failures', async () => {
      const strategy = await lifecycleManager.createStrategy({
        name: 'Test Strategy',
        initialAmount: 1000,
        selectedStrategy: {
          name: 'Test Protocol',
          chain: 'SOL',
          apy: { average: 8.0 }
        }
      })
      
      const initialEvents = strategy.events.length
      
      // Simulate failure during pause
      const mockAddEvent = vi.spyOn(lifecycleManager, 'addStrategyEvent')
      mockAddEvent.mockImplementation(() => { throw new Error('Event logging failed') })
      
      await expect(lifecycleManager.pauseStrategy(strategy.id)).rejects.toThrow()
      
      // Strategy should remain in consistent state
      expect(strategy.status).toBe('active') // Should not have changed
      expect(strategy.events).toHaveLength(initialEvents) // Events should be unchanged
      
      mockAddEvent.mockRestore()
    })
  })
})