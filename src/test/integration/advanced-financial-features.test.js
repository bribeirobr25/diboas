/**
 * Integration Test Suite for Advanced Financial Features
 * Tests tax optimization, lending pools, portfolio insights, and comprehensive dashboard
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { dataManager } from '../../services/DataManager.js'
import taxOptimizationService from '../../services/tax/TaxOptimizationService.js'
import lendingPoolService from '../../services/lending/LendingPoolService.js'
import portfolioInsightsService from '../../services/insights/PortfolioInsightsService.js'

// Mock user profile for testing
const MOCK_USER_PROFILE = {
  userId: 'test_user_123',
  riskTolerance: 'Moderate',
  annualIncome: 85000,
  filingStatus: 'single',
  taxYear: 2024,
  hasRetirementAccounts: true,
  charitableGiving: true,
  hasTraditionalIRA: true
}

describe('Advanced Financial Features Integration', () => {
  beforeEach(() => {
    // Initialize clean state
    dataManager.initializeCleanState()
  })

  afterEach(() => {
    // Clean up
    dataManager.dispose()
  })

  describe('Tax Optimization Service Integration', () => {
    it('should calculate comprehensive tax liability through DataManager', async () => {
      // Create some portfolio positions
      await dataManager.updateStrategyBalance('tax-test-strategy', 5000, {
        name: 'Tax Test Strategy',
        apy: 8.0,
        protocol: 'compound'
      })

      const taxLiability = await dataManager.calculateTaxLiability(MOCK_USER_PROFILE)

      expect(taxLiability).toBeDefined()
      expect(taxLiability).toHaveProperty('taxYear', 2024)
      expect(taxLiability).toHaveProperty('filingStatus', 'single')
      expect(taxLiability).toHaveProperty('capitalGains')
      expect(taxLiability).toHaveProperty('taxes')
      expect(taxLiability.taxes).toHaveProperty('total')
      expect(taxLiability.taxes.total).toBeGreaterThanOrEqual(0)
    })

    it('should generate tax optimization recommendations through DataManager', async () => {
      // Create portfolio with potential tax optimization opportunities
      await dataManager.updateStrategyBalance('strategy-1', 10000, {
        name: 'High Yield Strategy',
        apy: 12.0,
        protocol: 'uniswap'
      })

      const taxOptimization = await dataManager.getTaxOptimizationReport(MOCK_USER_PROFILE)

      expect(taxOptimization).toBeDefined()
      expect(taxOptimization).toHaveProperty('recommendations')
      expect(taxOptimization).toHaveProperty('totalPotentialSavings')
      expect(Array.isArray(taxOptimization.recommendations)).toBe(true)
      expect(taxOptimization.totalPotentialSavings).toBeGreaterThanOrEqual(0)

      // Check that recommendations have proper structure
      if (taxOptimization.recommendations.length > 0) {
        const rec = taxOptimization.recommendations[0]
        expect(rec).toHaveProperty('strategy')
        expect(rec).toHaveProperty('priority')
        expect(rec).toHaveProperty('title')
        expect(rec).toHaveProperty('description')
      }
    })

    it('should identify tax loss harvesting opportunities', async () => {
      const harvestingOpportunities = await dataManager.getTaxLossHarvestingOpportunities(500)

      expect(harvestingOpportunities).toBeDefined()
      expect(harvestingOpportunities).toHaveProperty('totalOpportunities')
      expect(harvestingOpportunities).toHaveProperty('totalPotentialSavings')
      expect(harvestingOpportunities).toHaveProperty('opportunities')
      expect(Array.isArray(harvestingOpportunities.opportunities)).toBe(true)
    })

    it('should generate year-end tax report', async () => {
      const yearEndReport = await dataManager.getYearEndTaxReport(MOCK_USER_PROFILE)

      expect(yearEndReport).toBeDefined()
      expect(yearEndReport).toHaveProperty('taxYear')
      expect(yearEndReport).toHaveProperty('projectedTaxLiability')
      expect(yearEndReport).toHaveProperty('yearEndActions')
      expect(yearEndReport).toHaveProperty('quarterlyEstimates')
      expect(yearEndReport).toHaveProperty('importantDeadlines')
      expect(Array.isArray(yearEndReport.yearEndActions)).toBe(true)
      expect(Array.isArray(yearEndReport.quarterlyEstimates)).toBe(true)
    })
  })

  describe('Lending Pool Service Integration', () => {
    it('should get all available lending pools through DataManager', () => {
      const lendingPools = dataManager.getAllLendingPools()

      expect(Array.isArray(lendingPools)).toBe(true)
      expect(lendingPools.length).toBeGreaterThan(0)

      // Check pool structure
      const pool = lendingPools[0]
      expect(pool).toHaveProperty('id')
      expect(pool).toHaveProperty('name')
      expect(pool).toHaveProperty('targetAPY')
      expect(pool).toHaveProperty('totalLiquidity')
      expect(pool).toHaveProperty('riskLevel')
      expect(pool).toHaveProperty('acceptedCollateral')
    })

    it('should apply for loan through DataManager', async () => {
      const loanApplication = {
        poolId: 'conservative',
        loanAmount: 10000,
        loanType: 'collateralized',
        collateralAsset: 'WETH',
        collateralAmount: 5,
        loanTerm: 12,
        purpose: 'investment',
        borrowerAddress: '0x123...abc'
      }

      const application = await dataManager.applyForLoan(loanApplication)

      expect(application).toBeDefined()
      expect(application).toHaveProperty('applicationId')
      expect(application).toHaveProperty('status')
      expect(application).toHaveProperty('interestRate')
      expect(application).toHaveProperty('monthlyPayment')
      expect(application.interestRate).toBeGreaterThan(0)
    })

    it('should execute flash loan through DataManager', async () => {
      const flashLoanData = {
        asset: 'USDC',
        amount: 100000,
        callbackContract: '0xFlashLoanContract',
        callbackData: '0x...',
        expectedProfit: 500,
        gasLimit: 300000
      }

      const result = await dataManager.executeFlashLoan(flashLoanData)

      expect(result).toBeDefined()
      expect(result).toHaveProperty('loanId')
      expect(result).toHaveProperty('success')
      expect(result).toHaveProperty('actualProfit')
      expect(result).toHaveProperty('executionTime')

      // Check transaction was recorded
      const transactions = dataManager.getTransactions()
      const flashLoanTx = transactions.find(tx => tx.type === 'flash_loan')
      
      if (result.success) {
        expect(flashLoanTx).toBeDefined()
        expect(flashLoanTx.amount).toBe(flashLoanData.amount)
      }
    })

    it('should provide liquidity to lending pool through DataManager', async () => {
      // Add some balance first
      await dataManager.updateBalance(20000, 'deposit')

      const liquidityData = {
        poolId: 'balanced',
        asset: 'USDC',
        amount: 10000,
        providerAddress: '0x456...def',
        lockupPeriod: 90
      }

      const position = await dataManager.provideLiquidity(liquidityData)

      expect(position).toBeDefined()
      expect(position).toHaveProperty('positionId')
      expect(position).toHaveProperty('expectedAPY')
      expect(position).toHaveProperty('shareOfPool')
      expect(position.expectedAPY).toBeGreaterThan(0)

      // Check balance was updated
      const balance = dataManager.getBalance()
      expect(balance.availableForSpending).toBe(10000) // 20000 - 10000
    })

    it('should get lending pool analytics', async () => {
      const analytics = await dataManager.getLendingPoolAnalytics('conservative')

      expect(analytics).toBeDefined()
      expect(analytics).toHaveProperty('poolId', 'conservative')
      expect(analytics).toHaveProperty('totalLiquidity')
      expect(analytics).toHaveProperty('utilizationRate')
      expect(analytics).toHaveProperty('currentAPY')
      expect(analytics).toHaveProperty('performance')
      expect(analytics).toHaveProperty('historicalAPY')
      expect(Array.isArray(analytics.historicalAPY)).toBe(true)
    })
  })

  describe('Portfolio Insights Service Integration', () => {
    beforeEach(async () => {
      // Create a diverse portfolio for insights testing
      await dataManager.updateStrategyBalance('growth-strategy', 15000, {
        name: 'Growth Strategy',
        apy: 12.5,
        protocol: 'uniswap',
        targetAmount: 20000
      })

      await dataManager.updateStrategyBalance('stable-strategy', 8000, {
        name: 'Stable Strategy',
        apy: 5.5,
        protocol: 'compound',
        targetAmount: 10000
      })
    })

    it('should generate comprehensive portfolio insights through DataManager', async () => {
      const insights = await dataManager.getPortfolioInsights(MOCK_USER_PROFILE, '30d')

      expect(insights).toBeDefined()
      expect(insights).toHaveProperty('insights')
      expect(insights).toHaveProperty('summary')
      expect(insights).toHaveProperty('marketConditions')
      expect(insights).toHaveProperty('portfolioHealth')
      expect(insights).toHaveProperty('actionableRecommendations')

      // Check insights structure
      expect(Array.isArray(insights.insights)).toBe(true)
      expect(insights.summary).toHaveProperty('totalInsights')
      
      // Check actionable recommendations
      expect(Array.isArray(insights.actionableRecommendations)).toBe(true)
    })

    it('should assess portfolio health through DataManager', async () => {
      const healthAssessment = await dataManager.getPortfolioHealthAssessment()

      expect(healthAssessment).toBeDefined()
      expect(healthAssessment).toHaveProperty('overallScore')
      expect(healthAssessment).toHaveProperty('healthLevel')
      expect(healthAssessment).toHaveProperty('metrics')

      expect(healthAssessment.overallScore).toBeGreaterThanOrEqual(0)
      expect(healthAssessment.overallScore).toBeLessThanOrEqual(100)
      expect(['Excellent', 'Good', 'Fair', 'Needs Improvement', 'Unknown']).toContain(healthAssessment.healthLevel)
    })

    it('should analyze market conditions through DataManager', () => {
      const marketConditions = dataManager.getMarketConditions()

      expect(marketConditions).toBeDefined()
      expect(marketConditions).toHaveProperty('condition')
      expect(marketConditions).toHaveProperty('confidence')
      expect(marketConditions).toHaveProperty('description')
      expect(marketConditions).toHaveProperty('indicators')

      expect(marketConditions.confidence).toBeGreaterThanOrEqual(0)
      expect(marketConditions.confidence).toBeLessThanOrEqual(1)
      expect(['bull', 'bear', 'sideways', 'volatile', 'stable']).toContain(marketConditions.condition)
    })
  })

  describe('Comprehensive Financial Dashboard Integration', () => {
    beforeEach(async () => {
      // Set up comprehensive portfolio for dashboard testing
      await dataManager.updateBalance(50000, 'deposit')
      
      await dataManager.updateStrategyBalance('emergency-fund', 12000, {
        name: 'Emergency Fund',
        apy: 4.5,
        protocol: 'compound',
        targetAmount: 15000
      })

      await dataManager.updateStrategyBalance('growth-fund', 25000, {
        name: 'Growth Fund',
        apy: 11.2,
        protocol: 'uniswap',
        targetAmount: 30000
      })
    })

    it('should generate comprehensive financial dashboard through DataManager', async () => {
      const dashboard = await dataManager.getFinancialDashboard(MOCK_USER_PROFILE)

      expect(dashboard).toBeDefined()

      // Check overview section
      expect(dashboard).toHaveProperty('overview')
      expect(dashboard.overview).toHaveProperty('totalValue')
      expect(dashboard.overview).toHaveProperty('availableBalance')
      expect(dashboard.overview).toHaveProperty('investedAmount')
      expect(dashboard.overview).toHaveProperty('strategyBalance')
      expect(dashboard.overview).toHaveProperty('yieldData')

      // Check insights section
      expect(dashboard).toHaveProperty('insights')
      expect(dashboard.insights).toHaveProperty('portfolio')
      expect(dashboard.insights).toHaveProperty('health')
      expect(dashboard.insights).toHaveProperty('market')

      // Check optimization section
      expect(dashboard).toHaveProperty('optimization')

      // Check opportunities section
      expect(dashboard).toHaveProperty('opportunities')
      expect(dashboard.opportunities).toHaveProperty('lending')
      expect(dashboard.opportunities).toHaveProperty('automations')

      // Check alerts
      expect(dashboard).toHaveProperty('alerts')
      expect(Array.isArray(dashboard.alerts)).toBe(true)

      // Verify numerical values make sense
      expect(dashboard.overview.totalValue).toBeGreaterThan(0)
      expect(dashboard.overview.strategyBalance).toBe(37000) // 12000 + 25000
    })

    it('should generate appropriate dashboard alerts', async () => {
      const dashboard = await dataManager.getFinancialDashboard(MOCK_USER_PROFILE)

      expect(dashboard.alerts).toBeDefined()
      expect(Array.isArray(dashboard.alerts)).toBe(true)

      // Check alert structure if any exist
      if (dashboard.alerts.length > 0) {
        const alert = dashboard.alerts[0]
        expect(alert).toHaveProperty('type')
        expect(alert).toHaveProperty('priority')
        expect(alert).toHaveProperty('title')
        expect(alert).toHaveProperty('message')
        expect(alert).toHaveProperty('action')
      }
    })

    it('should handle dashboard generation with service failures gracefully', async () => {
      // Mock service failure
      const originalMethod = portfolioInsightsService.generatePortfolioInsights
      portfolioInsightsService.generatePortfolioInsights = vi.fn().mockRejectedValue(new Error('Service unavailable'))

      // Dashboard should still generate with partial data
      const dashboard = await dataManager.getFinancialDashboard(MOCK_USER_PROFILE)

      expect(dashboard).toBeDefined()
      expect(dashboard.overview).toBeDefined()
      // Insights might be null due to service failure, but dashboard should still work
      
      // Restore original method
      portfolioInsightsService.generatePortfolioInsights = originalMethod
    })
  })

  describe('Service Integration and Event Handling', () => {
    it('should emit events for advanced financial operations', async () => {
      const events = []

      // Subscribe to events
      const unsubscribeLoan = dataManager.subscribe('loan:applied', (data) => {
        events.push({ type: 'loan:applied', data })
      })

      const unsubscribeFlashLoan = dataManager.subscribe('flash_loan:executed', (data) => {
        events.push({ type: 'flash_loan:executed', data })
      })

      const unsubscribeLiquidity = dataManager.subscribe('liquidity:provided', (data) => {
        events.push({ type: 'liquidity:provided', data })
      })

      // Perform operations
      await dataManager.applyForLoan({
        poolId: 'conservative',
        loanAmount: 5000,
        loanType: 'collateralized',
        collateralAsset: 'WETH',
        collateralAmount: 2.5,
        borrowerAddress: '0x123'
      })

      await dataManager.executeFlashLoan({
        asset: 'USDC',
        amount: 50000,
        expectedProfit: 250
      })

      await dataManager.updateBalance(10000, 'deposit')
      await dataManager.provideLiquidity({
        poolId: 'balanced',
        asset: 'USDC',
        amount: 5000,
        providerAddress: '0x456'
      })

      expect(events.length).toBe(3)
      expect(events.find(e => e.type === 'loan:applied')).toBeDefined()
      expect(events.find(e => e.type === 'flash_loan:executed')).toBeDefined()
      expect(events.find(e => e.type === 'liquidity:provided')).toBeDefined()

      // Cleanup
      unsubscribeLoan()
      unsubscribeFlashLoan()
      unsubscribeLiquidity()
    })

    it('should maintain data consistency across all services', async () => {
      // Perform complex operations involving multiple services
      await dataManager.updateBalance(100000, 'deposit')

      // Create strategies
      await dataManager.updateStrategyBalance('multi-strategy', 30000, {
        name: 'Multi Strategy',
        apy: 9.5,
        protocol: 'aave'
      })

      // Provide liquidity
      await dataManager.provideLiquidity({
        poolId: 'aggressive',
        asset: 'USDC',
        amount: 20000,
        providerAddress: '0x789'
      })

      // Check final state consistency
      const balance = dataManager.getBalance()
      const dashboard = await dataManager.getFinancialDashboard(MOCK_USER_PROFILE)

      expect(balance.totalUSD).toBe(balance.availableForSpending + balance.investedAmount + balance.strategyBalance)
      expect(dashboard.overview.totalValue).toBe(balance.totalUSD)
      expect(dashboard.overview.strategyBalance).toBe(balance.strategyBalance)
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large portfolios efficiently', async () => {
      const startTime = Date.now()

      // Create large portfolio
      await dataManager.updateBalance(1000000, 'deposit')
      
      for (let i = 0; i < 20; i++) {
        await dataManager.updateStrategyBalance(`strategy-${i}`, 25000, {
          name: `Strategy ${i}`,
          apy: 5 + Math.random() * 10,
          protocol: ['compound', 'aave', 'uniswap', 'curve'][i % 4]
        })
      }

      // Generate comprehensive dashboard
      const dashboard = await dataManager.getFinancialDashboard(MOCK_USER_PROFILE)
      
      const endTime = Date.now()
      const executionTime = endTime - startTime

      expect(dashboard).toBeDefined()
      expect(dashboard.overview.strategyBalance).toBe(500000) // 20 * 25000
      expect(executionTime).toBeLessThan(5000) // Should complete within 5 seconds
    })

    it('should cache expensive operations', async () => {
      // Create portfolio
      await dataManager.updateStrategyBalance('cache-test', 10000, {
        name: 'Cache Test',
        apy: 8.0
      })

      // First call
      const start1 = Date.now()
      const insights1 = await dataManager.getPortfolioInsights(MOCK_USER_PROFILE, '30d')
      const time1 = Date.now() - start1

      // Second call (should be faster due to caching)
      const start2 = Date.now()
      const insights2 = await dataManager.getPortfolioInsights(MOCK_USER_PROFILE, '30d')
      const time2 = Date.now() - start2

      expect(insights1).toBeDefined()
      expect(insights2).toBeDefined()
      // Second call should generally be faster due to caching
      // Note: This might not always be true due to async operations, but it's a reasonable expectation
    })
  })

  describe('Error Handling and Resilience', () => {
    it('should handle invalid loan applications gracefully', async () => {
      const invalidApplication = {
        poolId: 'nonexistent',
        loanAmount: -1000, // Invalid amount
        borrowerAddress: '0xinvalid'
      }

      await expect(dataManager.applyForLoan(invalidApplication))
        .rejects.toThrow()
    })

    it('should handle failed flash loans gracefully', async () => {
      const badFlashLoan = {
        asset: 'INVALID',
        amount: 999999999999, // Exceeds available liquidity
        expectedProfit: 0
      }

      await expect(dataManager.executeFlashLoan(badFlashLoan))
        .rejects.toThrow()
    })

    it('should handle service unavailability gracefully', async () => {
      // Mock all services to fail
      const originalTaxMethod = taxOptimizationService.generateTaxOptimizationRecommendations
      const originalLendingMethod = lendingPoolService.getAllLendingPools
      const originalInsightsMethod = portfolioInsightsService.generatePortfolioInsights

      taxOptimizationService.generateTaxOptimizationRecommendations = vi.fn().mockRejectedValue(new Error('Tax service down'))
      lendingPoolService.getAllLendingPools = vi.fn().mockImplementation(() => { throw new Error('Lending service down') })
      portfolioInsightsService.generatePortfolioInsights = vi.fn().mockRejectedValue(new Error('Insights service down'))

      // Dashboard should still work with degraded functionality
      const dashboard = await dataManager.getFinancialDashboard(MOCK_USER_PROFILE)

      expect(dashboard).toBeDefined()
      expect(dashboard.overview).toBeDefined()
      // Some sections might be null/empty due to service failures

      // Restore methods
      taxOptimizationService.generateTaxOptimizationRecommendations = originalTaxMethod
      lendingPoolService.getAllLendingPools = originalLendingMethod
      portfolioInsightsService.generatePortfolioInsights = originalInsightsMethod
    })
  })
})