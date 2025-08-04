/**
 * Strategy Analytics Service
 * Provides comprehensive analytics and performance tracking for investment strategies
 */

import logger from '../../utils/logger.js'
import secureLogger from '../../utils/secureLogger.js'

class StrategyAnalyticsService {
  constructor() {
    this.performanceCache = new Map()
    this.benchmarks = new Map()
    this.cacheTimeout = 15 * 60 * 1000 // 15 minutes
    
    this.initializeBenchmarks()
  }

  /**
   * Initialize market benchmarks for comparison
   */
  initializeBenchmarks() {
    this.benchmarks.set('sp500', {
      name: 'S&P 500',
      symbol: 'SPY',
      historicalAPY: 10.5,
      volatility: 15.8,
      type: 'equity'
    })

    this.benchmarks.set('bonds', {
      name: 'US Treasury Bonds',
      symbol: 'TLT',
      historicalAPY: 3.2,
      volatility: 8.1,
      type: 'fixed_income'
    })

    this.benchmarks.set('reits', {
      name: 'Real Estate Investment Trusts',
      symbol: 'VNQ',
      historicalAPY: 8.7,
      volatility: 19.2,
      type: 'real_estate'
    })

    this.benchmarks.set('savings', {
      name: 'High-Yield Savings Account',
      symbol: 'HYSA',
      historicalAPY: 1.5,
      volatility: 0.1,
      type: 'cash'
    })

    logger.info(`Initialized ${this.benchmarks.size} market benchmarks`)
  }

  /**
   * Calculate comprehensive strategy performance metrics
   */
  async calculatePerformanceMetrics(strategyId, transactions, currentValue, timeframe = '1year') {
    try {
      const cacheKey = `${strategyId}-${timeframe}-performance`
      
      // Check cache
      if (this.performanceCache.has(cacheKey)) {
        const cached = this.performanceCache.get(cacheKey)
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data
        }
      }

      // Calculate basic metrics
      const totalDeposited = this.calculateTotalDeposited(transactions)
      const totalWithdrawn = this.calculateTotalWithdrawn(transactions)
      const netDeposited = totalDeposited - totalWithdrawn
      const unrealizedGain = currentValue - netDeposited
      const totalReturn = unrealizedGain / netDeposited * 100

      // Calculate time-based metrics
      const timeMetrics = this.calculateTimeBasedMetrics(transactions, currentValue, timeframe)
      
      // Calculate risk metrics
      const riskMetrics = await this.calculateRiskMetrics(transactions, timeframe)
      
      // Calculate performance ratios
      const ratios = this.calculatePerformanceRatios(totalReturn, riskMetrics.volatility)
      
      // Benchmark comparison
      const benchmarkComparison = await this.compareToBenchmarks(totalReturn, riskMetrics.volatility)

      const metrics = {
        // Basic Metrics
        totalDeposited,
        totalWithdrawn,
        netDeposited,
        currentValue,
        unrealizedGain,
        totalReturn: parseFloat(totalReturn.toFixed(2)),
        
        // Time-based Metrics
        ...timeMetrics,
        
        // Risk Metrics
        ...riskMetrics,
        
        // Performance Ratios
        ...ratios,
        
        // Benchmark Comparison
        benchmarkComparison,
        
        // Metadata
        calculatedAt: new Date().toISOString(),
        timeframe,
        transactionCount: transactions.length
      }

      // Cache results
      this.performanceCache.set(cacheKey, {
        data: metrics,
        timestamp: Date.now()
      })

      secureLogger.audit('STRATEGY_PERFORMANCE_CALCULATED', {
        strategyId,
        totalReturn: metrics.totalReturn,
        timeframe
      })

      return metrics
    } catch (error) {
      logger.error(`Performance calculation failed for strategy ${strategyId}:`, error)
      throw error
    }
  }

  /**
   * Calculate total amount deposited
   */
  calculateTotalDeposited(transactions) {
    return transactions
      .filter(tx => tx.type === 'deposit' || tx.type === 'start_strategy')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0)
  }

  /**
   * Calculate total amount withdrawn
   */
  calculateTotalWithdrawn(transactions) {
    return transactions
      .filter(tx => tx.type === 'withdraw' || tx.type === 'stop_strategy')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0)
  }

  /**
   * Calculate time-based performance metrics
   */
  calculateTimeBasedMetrics(transactions, currentValue, timeframe) {
    const sortedTx = transactions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    
    if (sortedTx.length === 0) {
      return {
        annualizedReturn: 0,
        monthlyReturn: 0,
        dailyReturn: 0,
        timeWeightedReturn: 0
      }
    }

    const startDate = new Date(sortedTx[0].timestamp)
    const endDate = new Date()
    const daysDiff = (endDate - startDate) / (1000 * 60 * 60 * 24)
    const yearsDiff = daysDiff / 365.25

    // Calculate time-weighted return
    const timeWeightedReturn = this.calculateTimeWeightedReturn(sortedTx, currentValue)
    
    // Annualize returns
    const annualizedReturn = yearsDiff > 0 ? 
      Math.pow(1 + timeWeightedReturn / 100, 1 / yearsDiff) - 1 : 0

    return {
      annualizedReturn: parseFloat((annualizedReturn * 100).toFixed(2)),
      monthlyReturn: parseFloat((annualizedReturn / 12 * 100).toFixed(2)),
      dailyReturn: parseFloat((annualizedReturn / 365.25 * 100).toFixed(3)),
      timeWeightedReturn: parseFloat(timeWeightedReturn.toFixed(2)),
      totalDays: Math.round(daysDiff),
      startDate: startDate.toISOString().split('T')[0],
      endDate: endDate.toISOString().split('T')[0]
    }
  }

  /**
   * Calculate time-weighted return (TWR)
   */
  calculateTimeWeightedReturn(transactions, currentValue) {
    // Simplified TWR calculation
    // In production, would use more sophisticated calculation with daily/weekly periods
    
    let cumulativeReturn = 1
    let previousValue = 0
    
    for (const tx of transactions) {
      if (tx.type === 'deposit' || tx.type === 'start_strategy') {
        previousValue += tx.amount
      } else if (tx.type === 'withdraw') {
        if (previousValue > 0) {
          const periodReturn = (currentValue - previousValue) / previousValue
          cumulativeReturn *= (1 + periodReturn)
        }
        previousValue -= tx.amount
      }
    }
    
    if (previousValue > 0) {
      const finalReturn = (currentValue - previousValue) / previousValue
      cumulativeReturn *= (1 + finalReturn)
    }
    
    return (cumulativeReturn - 1) * 100
  }

  /**
   * Calculate risk metrics
   */
  async calculateRiskMetrics(transactions, timeframe) {
    // Mock volatility calculation - in production would use actual price history
    const mockVolatility = Math.random() * 20 + 5 // 5-25% volatility
    
    // Calculate maximum drawdown
    const maxDrawdown = this.calculateMaxDrawdown(transactions)
    
    // Estimate Value at Risk (VaR)
    const var95 = mockVolatility * 1.65 // 95% VaR approximation
    const var99 = mockVolatility * 2.33 // 99% VaR approximation
    
    return {
      volatility: parseFloat(mockVolatility.toFixed(2)),
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
      var95: parseFloat(var95.toFixed(2)),
      var99: parseFloat(var99.toFixed(2)),
      riskLevel: this.categorizeRisk(mockVolatility)
    }
  }

  /**
   * Calculate maximum drawdown
   */
  calculateMaxDrawdown(transactions) {
    // Simplified calculation - would use daily portfolio values in production
    let maxValue = 0
    let maxDrawdown = 0
    let currentValue = 0
    
    for (const tx of transactions) {
      if (tx.type === 'deposit' || tx.type === 'start_strategy') {
        currentValue += tx.amount
      } else if (tx.type === 'withdraw') {
        currentValue -= tx.amount
      }
      
      maxValue = Math.max(maxValue, currentValue)
      const drawdown = (maxValue - currentValue) / maxValue * 100
      maxDrawdown = Math.max(maxDrawdown, drawdown)
    }
    
    return maxDrawdown
  }

  /**
   * Categorize risk level based on volatility
   */
  categorizeRisk(volatility) {
    if (volatility < 5) return 'Very Low'
    if (volatility < 10) return 'Low'
    if (volatility < 15) return 'Moderate'
    if (volatility < 25) return 'High'
    return 'Very High'
  }

  /**
   * Calculate performance ratios
   */
  calculatePerformanceRatios(totalReturn, volatility) {
    const riskFreeRate = 2.5 // Assume 2.5% risk-free rate
    
    // Sharpe Ratio
    const sharpeRatio = volatility > 0 ? (totalReturn - riskFreeRate) / volatility : 0
    
    // Information Ratio (vs S&P 500)
    const sp500Return = this.benchmarks.get('sp500').historicalAPY
    const excessReturn = totalReturn - sp500Return
    const trackingError = Math.abs(volatility - this.benchmarks.get('sp500').volatility)
    const informationRatio = trackingError > 0 ? excessReturn / trackingError : 0
    
    // Sortino Ratio (simplified - using volatility as downside deviation proxy)
    const downsideDeviation = volatility * 0.7 // Approximation
    const sortinoRatio = downsideDeviation > 0 ? (totalReturn - riskFreeRate) / downsideDeviation : 0
    
    return {
      sharpeRatio: parseFloat(sharpeRatio.toFixed(3)),
      informationRatio: parseFloat(informationRatio.toFixed(3)),
      sortinoRatio: parseFloat(sortinoRatio.toFixed(3)),
      riskFreeRate,
      excessReturn: parseFloat(excessReturn.toFixed(2))
    }
  }

  /**
   * Compare strategy performance to benchmarks
   */
  async compareToBenchmarks(totalReturn, volatility) {
    const comparisons = []
    
    for (const [id, benchmark] of this.benchmarks.entries()) {
      const outperformance = totalReturn - benchmark.historicalAPY
      const riskAdjustedReturn = volatility > 0 ? totalReturn / volatility : totalReturn
      const benchmarkRiskAdjusted = benchmark.volatility > 0 ? 
        benchmark.historicalAPY / benchmark.volatility : benchmark.historicalAPY
      
      comparisons.push({
        benchmark: benchmark.name,
        symbol: benchmark.symbol,
        type: benchmark.type,
        benchmarkReturn: benchmark.historicalAPY,
        benchmarkVolatility: benchmark.volatility,
        outperformance: parseFloat(outperformance.toFixed(2)),
        riskAdjustedOutperformance: parseFloat((riskAdjustedReturn - benchmarkRiskAdjusted).toFixed(3)),
        isOutperforming: totalReturn > benchmark.historicalAPY,
        riskEfficiency: riskAdjustedReturn > benchmarkRiskAdjusted ? 'Better' : 'Worse'
      })
    }
    
    return comparisons.sort((a, b) => b.outperformance - a.outperformance)
  }

  /**
   * Generate strategy projections
   */
  async generateProjections(currentValue, monthlyContribution, timeHorizon, expectedAPY, riskLevel) {
    try {
      const projections = []
      const months = this.parseTimeHorizon(timeHorizon)
      const monthlyRate = expectedAPY / 100 / 12
      
      // Generate monthly projections
      let value = currentValue
      let totalContributions = 0
      
      for (let month = 1; month <= months; month++) {
        // Add monthly contribution
        value += monthlyContribution
        totalContributions += monthlyContribution
        
        // Apply growth
        value *= (1 + monthlyRate)
        
        // Add volatility simulation for more realistic projections
        const volatilityFactor = this.getVolatilityFactor(riskLevel)
        const randomReturn = (Math.random() - 0.5) * volatilityFactor * 2
        value *= (1 + randomReturn / 12)
        
        // Store projection data (quarterly intervals)
        if (month % 3 === 0 || month === months) {
          const totalInvested = currentValue + totalContributions
          const gains = value - totalInvested
          
          projections.push({
            month,
            value: parseFloat(value.toFixed(2)),
            totalInvested: parseFloat(totalInvested.toFixed(2)),
            gains: parseFloat(gains.toFixed(2)),
            returnPercentage: parseFloat((gains / totalInvested * 100).toFixed(2)),
            date: new Date(Date.now() + month * 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          })
        }
      }
      
      // Generate scenario analysis
      const scenarios = await this.generateScenarioAnalysis(currentValue, monthlyContribution, months, expectedAPY)
      
      return {
        projections,
        scenarios,
        assumptions: {
          expectedAPY,
          monthlyContribution,
          timeHorizon,
          riskLevel,
          totalMonths: months
        },
        summary: {
          finalValue: projections[projections.length - 1]?.value || currentValue,
          totalContributions: totalContributions + currentValue,
          totalGains: (projections[projections.length - 1]?.value || currentValue) - (totalContributions + currentValue),
          annualizedReturn: expectedAPY
        }
      }
    } catch (error) {
      logger.error('Projection generation failed:', error)
      throw error
    }
  }

  /**
   * Generate scenario analysis (best/worst/expected cases)
   */
  async generateScenarioAnalysis(currentValue, monthlyContribution, months, expectedAPY) {
    const scenarios = {}
    const scenarioTypes = [
      { name: 'pessimistic', multiplier: 0.5 },
      { name: 'expected', multiplier: 1.0 },
      { name: 'optimistic', multiplier: 1.5 }
    ]
    
    for (const scenario of scenarioTypes) {
      const adjustedAPY = expectedAPY * scenario.multiplier
      const monthlyRate = adjustedAPY / 100 / 12
      
      let value = currentValue
      for (let month = 1; month <= months; month++) {
        value = (value + monthlyContribution) * (1 + monthlyRate)
      }
      
      const totalInvested = currentValue + (monthlyContribution * months)
      const gains = value - totalInvested
      
      scenarios[scenario.name] = {
        finalValue: parseFloat(value.toFixed(2)),
        totalGains: parseFloat(gains.toFixed(2)),
        apy: parseFloat(adjustedAPY.toFixed(2)),
        returnPercentage: parseFloat((gains / totalInvested * 100).toFixed(2))
      }
    }
    
    return scenarios
  }

  /**
   * Parse time horizon string to months
   */
  parseTimeHorizon(timeHorizon) {
    const horizonMap = {
      '6months': 6,
      '1year': 12,
      '2years': 24,
      '3years': 36,
      '5years': 60,
      '10years': 120
    }
    
    return horizonMap[timeHorizon] || 12
  }

  /**
   * Get volatility factor for risk level
   */
  getVolatilityFactor(riskLevel) {
    const volatilityMap = {
      'Conservative': 0.05,
      'Moderate': 0.12,
      'Balanced': 0.18,
      'Aggressive': 0.25,
      'Very Aggressive': 0.35
    }
    
    return volatilityMap[riskLevel] || 0.15
  }

  /**
   * Generate performance attribution analysis
   */
  async generateAttributionAnalysis(strategyId, transactions, benchmarkId = 'sp500') {
    try {
      const benchmark = this.benchmarks.get(benchmarkId)
      if (!benchmark) {
        throw new Error(`Benchmark ${benchmarkId} not found`)
      }

      // Calculate strategy returns by time period
      const monthlyReturns = this.calculateMonthlyReturns(transactions)
      
      // Attribution components
      const attribution = {
        assetAllocation: this.calculateAssetAllocationEffect(monthlyReturns, benchmark),
        securitySelection: this.calculateSecuritySelectionEffect(monthlyReturns, benchmark),
        interaction: this.calculateInteractionEffect(monthlyReturns, benchmark),
        totalEffect: 0
      }
      
      attribution.totalEffect = attribution.assetAllocation + 
                               attribution.securitySelection + 
                               attribution.interaction
      
      return {
        attribution,
        benchmark: benchmark.name,
        analysisDate: new Date().toISOString(),
        timeframe: 'last_12_months'
      }
    } catch (error) {
      logger.error('Attribution analysis failed:', error)
      throw error
    }
  }

  /**
   * Calculate monthly returns from transactions
   */
  calculateMonthlyReturns(transactions) {
    // Simplified monthly return calculation
    // In production, would use actual portfolio values
    
    const monthlyReturns = []
    const sortedTx = transactions.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp))
    
    // Group transactions by month and calculate returns
    const monthlyGroups = this.groupTransactionsByMonth(sortedTx)
    
    for (const [month, txs] of monthlyGroups.entries()) {
      const netFlow = txs.reduce((sum, tx) => {
        return sum + (tx.type === 'deposit' ? tx.amount : -tx.amount)
      }, 0)
      
      // Mock return calculation
      const mockReturn = (Math.random() - 0.5) * 0.2 // ±10% monthly return
      
      monthlyReturns.push({
        month,
        netFlow,
        return: parseFloat(mockReturn.toFixed(4)),
        transactions: txs.length
      })
    }
    
    return monthlyReturns
  }

  /**
   * Group transactions by month
   */
  groupTransactionsByMonth(transactions) {
    const groups = new Map()
    
    for (const tx of transactions) {
      const date = new Date(tx.timestamp)
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      
      if (!groups.has(monthKey)) {
        groups.set(monthKey, [])
      }
      groups.get(monthKey).push(tx)
    }
    
    return groups
  }

  /**
   * Calculate asset allocation effect (simplified)
   */
  calculateAssetAllocationEffect(monthlyReturns, benchmark) {
    // Mock calculation - in production would compare actual asset weights
    return parseFloat((Math.random() * 2 - 1).toFixed(2)) // ±1% effect
  }

  /**
   * Calculate security selection effect (simplified)
   */
  calculateSecuritySelectionEffect(monthlyReturns, benchmark) {
    // Mock calculation - in production would compare security-level performance
    return parseFloat((Math.random() * 3 - 1.5).toFixed(2)) // ±1.5% effect
  }

  /**
   * Calculate interaction effect
   */
  calculateInteractionEffect(monthlyReturns, benchmark) {
    // Typically small interaction effect
    return parseFloat((Math.random() * 0.5 - 0.25).toFixed(2)) // ±0.25% effect
  }

  /**
   * Clear performance cache
   */
  clearCache() {
    this.performanceCache.clear()
    logger.info('Strategy analytics cache cleared')
  }

  /**
   * Get cache statistics
   */
  getCacheStats() {
    return {
      size: this.performanceCache.size,
      benchmarks: this.benchmarks.size,
      cacheTimeout: this.cacheTimeout
    }
  }
}

// Create singleton instance
export const strategyAnalyticsService = new StrategyAnalyticsService()
export default strategyAnalyticsService