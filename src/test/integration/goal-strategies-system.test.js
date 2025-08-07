/**
 * Integration Test for Goal-Strategies System
 * Tests the complete integration of all new services with DataManager
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { dataManager } from '../../services/DataManager.js'
import strategyAnalyticsService from '../../services/analytics/StrategyAnalyticsService.js'
import protocolService from '../../services/defi/ProtocolService.js'
import riskEngine from '../../services/risk/RiskEngine.js'
import automationService from '../../services/automation/AutomationService.js'

describe('Goal-Strategies System Integration', () => {
  beforeEach(() => {
    // Initialize clean state
    dataManager.initializeCleanState()
    
    // Clear service caches
    strategyAnalyticsService.clearCache()
    protocolService.clearCache()
    riskEngine.clearCache()
  })

  afterEach(() => {
    // Clean up
    dataManager.dispose()
  })

  describe('DataManager Integration with New Services', () => {
    it('should get protocol recommendations through DataManager', async () => {
      const recommendations = await dataManager.getProtocolRecommendations(
        'USDC',
        2, // Balanced risk tolerance
        10000,
        'ethereum'
      )

      expect(recommendations).toBeDefined()
      expect(Array.isArray(recommendations)).toBe(true)
      
      if (recommendations.length > 0) {
        expect(recommendations[0]).toHaveProperty('id')
        expect(recommendations[0]).toHaveProperty('name')
        expect(recommendations[0]).toHaveProperty('apy')
        expect(recommendations[0]).toHaveProperty('score')
      }
    })

    it('should assess portfolio risk through DataManager', async () => {
      // Create a strategy first
      await dataManager.updateStrategyBalance('test-strategy', 5000, {
        name: 'Test Strategy',
        apy: 8.5,
        protocol: 'compound'
      })

      const riskAssessment = await dataManager.assessPortfolioRisk('Moderate')

      expect(riskAssessment).toBeDefined()
      expect(riskAssessment).toHaveProperty('overallRiskScore')
      expect(riskAssessment).toHaveProperty('riskLevel')
      expect(riskAssessment).toHaveProperty('isWithinTolerance')
      expect(riskAssessment).toHaveProperty('riskMetrics')
    })

    it('should generate strategy analytics through DataManager', async () => {
      // Create a strategy
      await dataManager.updateStrategyBalance('analytics-test', 3000, {
        name: 'Analytics Test Strategy',
        apy: 12.0,
        protocol: 'aave'
      })

      // Add some transactions
      await dataManager.addTransaction({
        type: 'start_strategy',
        amount: 1000,
        targetStrategy: 'analytics-test'
      })

      await dataManager.addTransaction({
        type: 'deposit',
        amount: 2000,
        targetStrategy: 'analytics-test'
      })

      const analytics = await dataManager.getStrategyAnalytics('analytics-test', '1year')

      expect(analytics).toBeDefined()
      expect(analytics).toHaveProperty('totalReturn')
      expect(analytics).toHaveProperty('annualizedReturn')
      expect(analytics).toHaveProperty('benchmarkComparison')
      expect(analytics).toHaveProperty('calculatedAt')
    })

    it('should generate strategy projections through DataManager', async () => {
      // Create a strategy
      await dataManager.updateStrategyBalance('projection-test', 2000, {
        name: 'Projection Test Strategy',
        apy: 10.0,
        protocol: 'compound'
      })

      const projections = await dataManager.getStrategyProjections(
        'projection-test',
        500, // $500 monthly contribution
        '2years'
      )

      expect(projections).toBeDefined()
      expect(projections).toHaveProperty('projections')
      expect(projections).toHaveProperty('scenarios')
      expect(projections).toHaveProperty('summary')
      expect(projections.scenarios).toHaveProperty('pessimistic')
      expect(projections.scenarios).toHaveProperty('expected')
      expect(projections.scenarios).toHaveProperty('optimistic')
    })

    it('should create automations through DataManager', async () => {
      const automationConfig = {
        type: 'scheduled_deposit',
        name: 'Test Monthly Deposit',
        frequency: 'monthly',
        parameters: {
          amount: 1000,
          targetStrategy: 'test-strategy',
          currency: 'USD'
        }
      }

      const automation = await dataManager.createAutomation(automationConfig)

      expect(automation).toBeDefined()
      expect(automation).toHaveProperty('id')
      expect(automation).toHaveProperty('type')
      expect(automation).toHaveProperty('status')
      expect(automation.status).toBe('active')
    })

    it('should get enhanced yield data with real analytics', async () => {
      // Create multiple strategies
      await dataManager.updateStrategyBalance('strategy-1', 5000, {
        name: 'Emergency Fund',
        targetAmount: 10000,
        apy: 5.0,
        protocol: 'compound'
      })

      await dataManager.updateStrategyBalance('strategy-2', 3000, {
        name: 'Coffee Fund',
        targetAmount: 2000, // Already exceeded target
        apy: 8.0,
        protocol: 'aave'
      })

      const enhancedYieldData = await dataManager.getEnhancedYieldData()

      expect(enhancedYieldData).toBeDefined()
      expect(enhancedYieldData).toHaveProperty('activeStrategies')
      expect(enhancedYieldData).toHaveProperty('totalEarning')
      expect(enhancedYieldData).toHaveProperty('avgAPY')
      expect(enhancedYieldData).toHaveProperty('goalsProgress')
      expect(enhancedYieldData).toHaveProperty('totalInvested')

      expect(enhancedYieldData.activeStrategies).toBe(2)
      expect(enhancedYieldData.totalInvested).toBe(8000)
      expect(enhancedYieldData.goalsProgress).toBeGreaterThan(0)
    })

    it('should run strategy stress tests through DataManager', async () => {
      // Create a strategy
      await dataManager.updateStrategyBalance('stress-test', 10000, {
        name: 'Stress Test Strategy',
        apy: 15.0,
        protocol: 'uniswap'
      })

      const stressTest = await dataManager.runStrategyStressTest(
        'stress-test',
        ['market_crash', 'high_volatility']
      )

      expect(stressTest).toBeDefined()
      expect(stressTest).toHaveProperty('scenarios')
      expect(stressTest).toHaveProperty('overallStressScore')
      expect(stressTest).toHaveProperty('recommendations')

      expect(stressTest.scenarios).toHaveProperty('market_crash')
      expect(stressTest.scenarios).toHaveProperty('high_volatility')
    })

    it('should get rebalancing recommendations through DataManager', async () => {
      // Create multiple strategies to have something to rebalance
      await dataManager.updateStrategyBalance('strategy-a', 8000, {
        name: 'Strategy A',
        apy: 6.0,
        protocol: 'compound'
      })

      await dataManager.updateStrategyBalance('strategy-b', 2000, {
        name: 'Strategy B',
        apy: 12.0,
        protocol: 'uniswap'
      })

      const rebalanceRecommendation = await dataManager.getRebalancingRecommendations('Moderate')

      expect(rebalanceRecommendation).toBeDefined()
      expect(rebalanceRecommendation).toHaveProperty('needsRebalancing')
      
      // If rebalancing is needed, check the structure
      if (rebalanceRecommendation.needsRebalancing) {
        expect(rebalanceRecommendation).toHaveProperty('actions')
        expect(rebalanceRecommendation).toHaveProperty('costBenefitAnalysis')
        expect(rebalanceRecommendation).toHaveProperty('optimalAllocations')
      }
    })
  })

  describe('Service Integration', () => {
    it('should work with ProtocolService for real APY data', async () => {
      const apy = await protocolService.getRealTimeAPY('compound', 'USDC', 'ethereum')
      
      expect(typeof apy).toBe('number')
      expect(apy).toBeGreaterThan(0)
      expect(apy).toBeLessThan(100) // Reasonable APY range
    })

    it('should work with RiskEngine for portfolio assessment', async () => {
      const mockPortfolio = {
        totalValue: 10000,
        positions: [
          { asset: 'USDC', protocol: 'compound', value: 6000 },
          { asset: 'USDC', protocol: 'aave', value: 4000 }
        ]
      }

      const riskAssessment = await riskEngine.assessPortfolioRisk(mockPortfolio, 'Moderate')

      expect(riskAssessment).toBeDefined()
      expect(riskAssessment.overallRiskScore).toBeGreaterThanOrEqual(0)
      expect(riskAssessment.overallRiskScore).toBeLessThanOrEqual(100)
    })

    it('should work with StrategyAnalyticsService for performance metrics', async () => {
      const mockTransactions = [
        { type: 'deposit', amount: 1000, timestamp: Date.now() - 365 * 24 * 60 * 60 * 1000 },
        { type: 'deposit', amount: 2000, timestamp: Date.now() - 180 * 24 * 60 * 60 * 1000 }
      ]

      const analytics = await strategyAnalyticsService.calculatePerformanceMetrics(
        'test-strategy',
        mockTransactions,
        3500, // Current value
        '1year'
      )

      expect(analytics).toBeDefined()
      expect(analytics).toHaveProperty('totalReturn')
      expect(analytics).toHaveProperty('annualizedReturn')
      expect(analytics).toHaveProperty('volatility')
    })

    it('should work with AutomationService for scheduled operations', async () => {
      const scheduledDeposit = await automationService.createScheduledDeposit({
        name: 'Test Deposit',
        frequency: 'monthly',
        amount: 500,
        targetStrategy: 'test-strategy'
      })

      expect(scheduledDeposit).toBeDefined()
      expect(scheduledDeposit.type).toBe('scheduled_deposit')
      expect(scheduledDeposit.status).toBe('active')
      expect(scheduledDeposit.parameters.amount).toBe(500)
    })
  })

  describe('Event-Driven Architecture', () => {
    it('should emit events when strategies are created with new services', async () => {
      const events = []
      
      // Subscribe to events
      const unsubscribe = dataManager.subscribe('strategy:updated', (strategy) => {
        events.push({ type: 'strategy:updated', data: strategy })
      })

      // Create a strategy
      await dataManager.updateStrategyBalance('event-test', 1000, {
        name: 'Event Test Strategy'
      })

      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('strategy:updated')
      expect(events[0].data.name).toBe('Event Test Strategy')

      unsubscribe()
    })

    it('should emit events when automations are created', async () => {
      const events = []
      
      const unsubscribe = dataManager.subscribe('automation:created', (automation) => {
        events.push({ type: 'automation:created', data: automation })
      })

      await dataManager.createAutomation({
        type: 'scheduled_deposit',
        name: 'Event Test Automation',
        frequency: 'weekly',
        parameters: { amount: 100 }
      })

      expect(events).toHaveLength(1)
      expect(events[0].type).toBe('automation:created')
      expect(events[0].data.name).toBe('Event Test Automation')

      unsubscribe()
    })
  })

  describe('Error Handling and Resilience', () => {
    it('should handle service failures gracefully', async () => {
      // Mock a service failure
      const originalMethod = protocolService.getRealTimeAPY
      protocolService.getRealTimeAPY = vi.fn().mockRejectedValue(new Error('Service unavailable'))

      // Should fall back to enhanced yield data without breaking
      const yieldData = await dataManager.getEnhancedYieldData()
      
      expect(yieldData).toBeDefined()
      expect(yieldData).toHaveProperty('activeStrategies')

      // Restore original method
      protocolService.getRealTimeAPY = originalMethod
    })

    it('should handle invalid strategy IDs gracefully', async () => {
      await expect(dataManager.getStrategyAnalytics('non-existent-strategy'))
        .rejects.toThrow('Strategy non-existent-strategy not found')
    })

    it('should handle empty portfolios in risk assessment', async () => {
      const riskAssessment = await dataManager.assessPortfolioRisk('Conservative')
      
      expect(riskAssessment).toBeDefined()
      // Should handle empty portfolio gracefully
    })
  })

  describe('Performance and Caching', () => {
    it('should cache protocol recommendations for better performance', async () => {
      const start1 = Date.now()
      const recommendations1 = await dataManager.getProtocolRecommendations('USDC', 2, 5000)
      const time1 = Date.now() - start1

      const start2 = Date.now()
      const recommendations2 = await dataManager.getProtocolRecommendations('USDC', 2, 5000)
      const time2 = Date.now() - start2

      // Second call should be faster due to caching
      expect(time2).toBeLessThan(time1)
      expect(recommendations1).toEqual(recommendations2)
    })

    it('should cache strategy analytics for better performance', async () => {
      // Create a strategy with transactions
      await dataManager.updateStrategyBalance('cache-test', 2000, {
        name: 'Cache Test Strategy'
      })

      const start1 = Date.now()
      const analytics1 = await dataManager.getStrategyAnalytics('cache-test')
      const time1 = Date.now() - start1

      const start2 = Date.now()
      const analytics2 = await dataManager.getStrategyAnalytics('cache-test')
      const time2 = Date.now() - start2

      // Second call should be faster
      expect(time2).toBeLessThan(time1)
      expect(analytics1.calculatedAt).toBe(analytics2.calculatedAt)
    })
  })
})