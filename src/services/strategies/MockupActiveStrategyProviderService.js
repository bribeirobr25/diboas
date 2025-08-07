/**
 * Mockup Active Strategy Provider Service
 * Simulates 3rd party active strategy management APIs with realistic response times
 * This will be replaced with real DeFi protocol integrations
 */

import logger from '../../utils/logger.js'

export class MockupActiveStrategyProviderService {
  constructor() {
    // NO caching per requirements - always real-time data
  }

  /**
   * Get user's active strategies with real-time performance data
   * In production, this would come from DeFi protocol integrations
   */
  async getActiveStrategies(userId = 'demo-user') {
    await this.simulateNetworkDelay(400, 1000)
    
    // Simulate performance variations
    const performanceVariation = () => 0.95 + (Math.random() * 0.1) // 95%-105%
    const timeVariation = () => Math.floor(Math.random() * 90) + 30 // 30-120 days ago

    return [
      {
        id: 'strategy_001',
        templateId: 'emergency_fund',
        name: 'Emergency Fund Strategy',
        description: 'Conservative emergency fund with stable returns',
        status: 'active',
        riskLevel: 'conservative',
        targetAmount: 5000,
        currentAmount: Math.round(3247.89 * performanceVariation()),
        depositedAmount: 3000,
        totalEarnings: Math.round(247.89 * performanceVariation()),
        currentAPY: Math.round(4.2 * performanceVariation() * 10) / 10,
        duration: {
          startDate: Date.now() - (timeVariation() * 24 * 60 * 60 * 1000),
          targetDate: Date.now() + (180 * 24 * 60 * 60 * 1000), // 6 months from now
          daysActive: timeVariation()
        },
        performance: {
          totalReturn: Math.round(8.27 * performanceVariation() * 100) / 100,
          annualizedReturn: Math.round(4.2 * performanceVariation() * 100) / 100,
          volatility: 1.8,
          sharpeRatio: 2.1
        },
        allocation: {
          stableCoins: 70,
          bonds: 25,
          moneyMarket: 5
        },
        recentActivity: [
          {
            type: 'deposit',
            amount: 500,
            date: Date.now() - (7 * 24 * 60 * 60 * 1000),
            description: 'Monthly contribution'
          },
          {
            type: 'yield',
            amount: 12.45,
            date: Date.now() - (3 * 24 * 60 * 60 * 1000),
            description: 'Weekly yield distribution'
          }
        ]
      },
      {
        id: 'strategy_002',
        templateId: 'vacation_fund',
        name: 'Dream Vacation Fund',
        description: 'Moderate growth strategy for vacation savings',
        status: 'active',
        riskLevel: 'moderate',
        targetAmount: 8000,
        currentAmount: Math.round(1876.34 * performanceVariation()),
        depositedAmount: 1650,
        totalEarnings: Math.round(226.34 * performanceVariation()),
        currentAPY: Math.round(6.8 * performanceVariation() * 10) / 10,
        duration: {
          startDate: Date.now() - (timeVariation() * 24 * 60 * 60 * 1000),
          targetDate: Date.now() + (365 * 24 * 60 * 60 * 1000), // 1 year from now
          daysActive: timeVariation()
        },
        performance: {
          totalReturn: Math.round(13.72 * performanceVariation() * 100) / 100,
          annualizedReturn: Math.round(6.8 * performanceVariation() * 100) / 100,
          volatility: 8.5,
          sharpeRatio: 0.8
        },
        allocation: {
          equities: 40,
          bonds: 35,
          alternatives: 15,
          stableCoins: 10
        },
        recentActivity: [
          {
            type: 'deposit',
            amount: 300,
            date: Date.now() - (14 * 24 * 60 * 60 * 1000),
            description: 'Bi-weekly contribution'
          },
          {
            type: 'rebalance',
            amount: 0,
            date: Date.now() - (5 * 24 * 60 * 60 * 1000),
            description: 'Portfolio rebalancing'
          }
        ]
      },
      {
        id: 'strategy_003',
        templateId: 'retirement_boost',
        name: 'Retirement Acceleration',
        description: 'Aggressive growth strategy for long-term wealth building',
        status: 'active',
        riskLevel: 'aggressive',
        targetAmount: 50000,
        currentAmount: Math.round(12456.78 * performanceVariation()),
        depositedAmount: 10000,
        totalEarnings: Math.round(2456.78 * performanceVariation()),
        currentAPY: Math.round(18.3 * performanceVariation() * 10) / 10,
        duration: {
          startDate: Date.now() - (timeVariation() * 24 * 60 * 60 * 1000),
          targetDate: Date.now() + (1825 * 24 * 60 * 60 * 1000), // 5 years from now
          daysActive: timeVariation()
        },
        performance: {
          totalReturn: Math.round(24.57 * performanceVariation() * 100) / 100,
          annualizedReturn: Math.round(18.3 * performanceVariation() * 100) / 100,
          volatility: 22.1,
          sharpeRatio: 0.95
        },
        allocation: {
          crypto: 40,
          equities: 35,
          alternatives: 20,
          bonds: 5
        },
        recentActivity: [
          {
            type: 'deposit',
            amount: 1000,
            date: Date.now() - (28 * 24 * 60 * 60 * 1000),
            description: 'Monthly contribution'
          },
          {
            type: 'yield',
            amount: 156.78,
            date: Date.now() - (1 * 24 * 60 * 60 * 1000),
            description: 'Monthly yield distribution'
          }
        ]
      },
      {
        id: 'strategy_004',
        templateId: 'car_upgrade',
        name: 'Car Fund',
        description: 'Balanced strategy for vehicle purchase',
        status: 'paused',
        riskLevel: 'balanced',
        targetAmount: 25000,
        currentAmount: Math.round(4567.23 * performanceVariation()),
        depositedAmount: 4200,
        totalEarnings: Math.round(367.23 * performanceVariation()),
        currentAPY: Math.round(11.2 * performanceVariation() * 10) / 10,
        duration: {
          startDate: Date.now() - (timeVariation() * 24 * 60 * 60 * 1000),
          targetDate: Date.now() + (730 * 24 * 60 * 60 * 1000), // 2 years from now
          daysActive: timeVariation(),
          pausedSince: Date.now() - (14 * 24 * 60 * 60 * 1000)
        },
        performance: {
          totalReturn: Math.round(8.74 * performanceVariation() * 100) / 100,
          annualizedReturn: Math.round(11.2 * performanceVariation() * 100) / 100,
          volatility: 12.8,
          sharpeRatio: 0.92
        },
        allocation: {
          equities: 50,
          bonds: 30,
          alternatives: 15,
          stableCoins: 5
        },
        recentActivity: [
          {
            type: 'pause',
            amount: 0,
            date: Date.now() - (14 * 24 * 60 * 60 * 1000),
            description: 'Strategy paused by user'
          },
          {
            type: 'yield',
            amount: 23.45,
            date: Date.now() - (21 * 24 * 60 * 60 * 1000),
            description: 'Last yield before pause'
          }
        ]
      }
    ]
  }

  /**
   * Get strategy performance analytics
   */
  async getStrategyPerformance(strategyId) {
    await this.simulateNetworkDelay(300, 700)
    
    // Generate realistic performance history
    const generatePerformanceHistory = (days, baseAPY) => {
      const history = []
      let currentValue = 1000 // Starting value
      
      for (let i = days; i >= 0; i--) {
        const dailyReturn = (baseAPY / 365 / 100) + (Math.random() - 0.5) * 0.002 // ±0.1% daily variation
        currentValue *= (1 + dailyReturn)
        
        history.push({
          date: Date.now() - (i * 24 * 60 * 60 * 1000),
          value: Math.round(currentValue * 100) / 100,
          apy: Math.round(baseAPY * (0.9 + Math.random() * 0.2) * 100) / 100,
          volatility: Math.round((Math.random() * 20 + 5) * 100) / 100
        })
      }
      
      return history
    }

    return {
      strategyId,
      performanceHistory: generatePerformanceHistory(90, 12.5), // 90 days of data
      benchmarkComparison: {
        strategy: 12.5,
        sp500: 10.2,
        bonds: 4.8,
        crypto: 45.2
      },
      riskMetrics: {
        maxDrawdown: -8.5,
        volatility: 15.2,
        sharpeRatio: 0.95,
        sortinoRatio: 1.12,
        beta: 0.85
      },
      attribution: {
        assetAllocation: 60, // % of returns from asset allocation
        marketTiming: 15,    // % from timing
        securitySelection: 20, // % from security selection
        fees: -5            // % lost to fees
      }
    }
  }

  /**
   * Get strategy by ID
   */
  async getStrategyById(strategyId) {
    await this.simulateNetworkDelay(200, 500)
    
    const strategies = await this.getActiveStrategies()
    return strategies.find(strategy => strategy.id === strategyId)
  }

  /**
   * Get strategies by status
   */
  async getStrategiesByStatus(status) {
    await this.simulateNetworkDelay(250, 600)
    
    const strategies = await this.getActiveStrategies()
    return strategies.filter(strategy => strategy.status === status)
  }

  /**
   * Get portfolio overview
   */
  async getPortfolioOverview(userId = 'demo-user') {
    await this.simulateNetworkDelay(400, 900)
    
    const strategies = await this.getActiveStrategies(userId)
    const activeStrategies = strategies.filter(s => s.status === 'active')
    
    const totalDeposited = activeStrategies.reduce((sum, s) => sum + s.depositedAmount, 0)
    const totalCurrent = activeStrategies.reduce((sum, s) => sum + s.currentAmount, 0)
    const totalEarnings = activeStrategies.reduce((sum, s) => sum + s.totalEarnings, 0)
    
    // Calculate weighted average APY
    const weightedAPY = activeStrategies.reduce((sum, s) => 
      sum + (s.currentAPY * (s.currentAmount / totalCurrent)), 0)
    
    return {
      summary: {
        totalStrategies: strategies.length,
        activeStrategies: activeStrategies.length,
        totalDeposited,
        totalCurrentValue: totalCurrent,
        totalEarnings,
        totalReturn: ((totalCurrent - totalDeposited) / totalDeposited) * 100,
        averageAPY: weightedAPY
      },
      allocation: {
        byRisk: this.calculateRiskAllocation(activeStrategies),
        byAsset: this.calculateAssetAllocation(activeStrategies),
        byStrategy: activeStrategies.map(s => ({
          name: s.name,
          allocation: (s.currentAmount / totalCurrent) * 100,
          performance: s.performance.totalReturn
        }))
      },
      recentActivity: this.aggregateRecentActivity(strategies),
      projections: {
        oneMonth: totalCurrent * 1.01,
        threeMonths: totalCurrent * 1.035,
        sixMonths: totalCurrent * 1.075,
        oneYear: totalCurrent * 1.15
      }
    }
  }

  /**
   * Calculate risk allocation across strategies
   */
  calculateRiskAllocation(strategies) {
    const totalValue = strategies.reduce((sum, s) => sum + s.currentAmount, 0)
    const riskGroups = {}
    
    strategies.forEach(strategy => {
      const risk = strategy.riskLevel
      if (!riskGroups[risk]) riskGroups[risk] = 0
      riskGroups[risk] += strategy.currentAmount
    })
    
    const allocation = {}
    Object.entries(riskGroups).forEach(([risk, value]) => {
      allocation[risk] = (value / totalValue) * 100
    })
    
    return allocation
  }

  /**
   * Calculate asset allocation across strategies
   */
  calculateAssetAllocation(strategies) {
    const totalValue = strategies.reduce((sum, s) => sum + s.currentAmount, 0)
    const assetTotals = {}
    
    strategies.forEach(strategy => {
      Object.entries(strategy.allocation).forEach(([asset, percentage]) => {
        if (!assetTotals[asset]) assetTotals[asset] = 0
        assetTotals[asset] += (strategy.currentAmount * percentage / 100)
      })
    })
    
    const allocation = {}
    Object.entries(assetTotals).forEach(([asset, value]) => {
      allocation[asset] = (value / totalValue) * 100
    })
    
    return allocation
  }

  /**
   * Aggregate recent activity from all strategies
   */
  aggregateRecentActivity(strategies) {
    const allActivity = []
    
    strategies.forEach(strategy => {
      strategy.recentActivity.forEach(activity => {
        allActivity.push({
          ...activity,
          strategyName: strategy.name,
          strategyId: strategy.id
        })
      })
    })
    
    return allActivity
      .sort((a, b) => b.date - a.date)
      .slice(0, 10) // Last 10 activities
  }

  /**
   * Get strategy recommendations based on portfolio
   */
  async getStrategyRecommendations(userId = 'demo-user') {
    await this.simulateNetworkDelay(500, 1200)
    
    const portfolio = await this.getPortfolioOverview(userId)
    const recommendations = []
    
    // Analyze portfolio gaps and suggest improvements
    if (portfolio.allocation.byRisk.conservative < 20) {
      recommendations.push({
        type: 'diversification',
        priority: 'high',
        suggestion: 'Consider adding conservative strategies for better risk management',
        templateIds: ['emergency_fund'],
        reasoning: 'Your portfolio lacks conservative allocation for stability'
      })
    }
    
    if (portfolio.allocation.byRisk.aggressive > 60) {
      recommendations.push({
        type: 'risk_management',
        priority: 'medium',
        suggestion: 'Consider rebalancing to reduce overall portfolio risk',
        templateIds: ['moderate', 'conservative'],
        reasoning: 'High concentration in aggressive strategies increases volatility'
      })
    }
    
    if (portfolio.summary.totalStrategies < 3) {
      recommendations.push({
        type: 'diversification',
        priority: 'medium',
        suggestion: 'Diversify with additional strategy types',
        templateIds: ['vacation_fund', 'education_fund'],
        reasoning: 'More strategies can improve risk-adjusted returns'
      })
    }
    
    return recommendations
  }

  /**
   * Get all active strategy data in one call - REAL TIME ONLY
   * In production, this could be a single API call or aggregated endpoint
   * NO CACHING - always fresh data
   */
  async getAllActiveStrategyData(userId = 'demo-user') {
    // In production, this would be a single API call or parallel calls
    const [strategies, portfolio, recommendations] = await Promise.all([
      this.getActiveStrategies(userId),
      this.getPortfolioOverview(userId),
      this.getStrategyRecommendations(userId)
    ])

    const allStrategyData = {
      strategies,
      portfolio,
      recommendations,
      timestamp: Date.now()
    }

    return allStrategyData
  }

  /**
   * Simulate realistic network delay for API calls
   */
  async simulateNetworkDelay(minMs = 300, maxMs = 1000) {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check method - simulates active strategy provider availability
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(100, 300)
      
      // Simulate occasional provider outages (2% chance)
      if (Math.random() < 0.02) {
        throw new Error('Mockup active strategy provider temporarily unavailable')
      }
      
      const strategies = await this.getActiveStrategies()
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        latency: Math.random() * 400 + 300, // 300-700ms
        activeStrategies: strategies.length,
        protocolConnections: {
          defi: 'connected',
          yield_farming: 'connected',
          liquidity_pools: 'connected'
        }
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: Date.now()
      }
    }
  }
}

// Export singleton instance
export const mockupActiveStrategyProviderService = new MockupActiveStrategyProviderService()

// Export class for testing
export default MockupActiveStrategyProviderService