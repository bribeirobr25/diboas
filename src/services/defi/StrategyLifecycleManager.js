/**
 * Strategy Lifecycle Manager
 * Manages the complete lifecycle of DeFi strategies from creation to termination
 * Handles state transitions, monitoring, and reporting
 */

import logger from '../../utils/logger'
import { centralizedFeeCalculator } from '../../utils/feeCalculations.js'

export class StrategyLifecycleManager {
  constructor() {
    this.activeStrategies = new Map()
    this.strategyHistory = new Map()
    this.performanceMetrics = new Map()
    this.eventHandlers = new Map()
  }

  /**
   * Create and activate a new strategy
   */
  async createStrategy(config) {
    try {
      const strategy = {
        id: this.generateStrategyId(),
        ...config,
        status: 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        performance: {
          currentValue: config.initialAmount,
          totalContributions: config.initialAmount,
          totalReturn: 0,
          returnPercentage: 0,
          dailyReturns: [],
          lastUpdate: new Date().toISOString()
        },
        events: [],
        nextContribution: config.recurringAmount > 0 ? this.calculateNextContribution(config) : null
      }

      // Add creation event
      this.addStrategyEvent(strategy, 'created', {
        initialAmount: config.initialAmount,
        selectedStrategy: config.selectedStrategy.name,
        chain: config.selectedStrategy.chain
      })

      // Store in active strategies
      this.activeStrategies.set(strategy.id, strategy)

      // Initialize performance tracking
      this.initializePerformanceTracking(strategy)

      logger.info('Strategy created successfully:', { strategyId: strategy.id, name: strategy.name })
      
      return strategy
    } catch (error) {
      logger.error('Error creating strategy:', error)
      throw new Error('Failed to create strategy')
    }
  }

  /**
   * Stop/terminate a strategy
   */
  async stopStrategy(strategyId, reason = 'user_requested') {
    try {
      const strategy = this.activeStrategies.get(strategyId)
      if (!strategy) {
        throw new Error(`Strategy ${strategyId} not found`)
      }

      // Calculate final performance
      const finalPerformance = this.calculateFinalPerformance(strategy)
      
      // Calculate stop fees
      const stopFees = centralizedFeeCalculator.calculateFees({
        type: 'stop_strategy',
        amount: finalPerformance.currentValue,
        chains: [strategy.selectedStrategy.chain]
      })

      // Update strategy status
      strategy.status = 'stopped'
      strategy.stoppedAt = new Date().toISOString()
      strategy.updatedAt = new Date().toISOString()
      strategy.stopReason = reason
      strategy.finalPerformance = finalPerformance
      strategy.stopFees = stopFees

      // Add stop event
      this.addStrategyEvent(strategy, 'stopped', {
        reason,
        finalValue: finalPerformance.currentValue,
        totalReturn: finalPerformance.totalReturn,
        stopFees: stopFees.total
      })

      // Move to history
      this.strategyHistory.set(strategyId, strategy)
      this.activeStrategies.delete(strategyId)

      logger.info('Strategy stopped successfully:', { 
        strategyId, 
        reason, 
        finalValue: finalPerformance.currentValue 
      })

      return {
        strategy,
        finalPerformance,
        stopFees
      }
    } catch (error) {
      logger.error('Error stopping strategy:', error)
      throw new Error('Failed to stop strategy')
    }
  }

  /**
   * Pause a strategy temporarily
   */
  async pauseStrategy(strategyId, reason = 'user_requested') {
    try {
      const strategy = this.activeStrategies.get(strategyId)
      if (!strategy) {
        throw new Error(`Strategy ${strategyId} not found`)
      }

      strategy.status = 'paused'
      strategy.pausedAt = new Date().toISOString()
      strategy.updatedAt = new Date().toISOString()
      strategy.pauseReason = reason

      this.addStrategyEvent(strategy, 'paused', { reason })

      logger.info('Strategy paused:', { strategyId, reason })
      return strategy
    } catch (error) {
      logger.error('Error pausing strategy:', error)
      throw new Error('Failed to pause strategy')
    }
  }

  /**
   * Resume a paused strategy
   */
  async resumeStrategy(strategyId) {
    try {
      const strategy = this.activeStrategies.get(strategyId)
      if (!strategy) {
        throw new Error(`Strategy ${strategyId} not found`)
      }

      if (strategy.status !== 'paused') {
        throw new Error('Strategy is not paused')
      }

      strategy.status = 'active'
      strategy.resumedAt = new Date().toISOString()
      strategy.updatedAt = new Date().toISOString()
      delete strategy.pausedAt
      delete strategy.pauseReason

      this.addStrategyEvent(strategy, 'resumed', {})

      logger.info('Strategy resumed:', { strategyId })
      return strategy
    } catch (error) {
      logger.error('Error resuming strategy:', error)
      throw new Error('Failed to resume strategy')
    }
  }

  /**
   * Process recurring contribution
   */
  async processRecurringContribution(strategyId) {
    try {
      const strategy = this.activeStrategies.get(strategyId)
      if (!strategy) {
        throw new Error(`Strategy ${strategyId} not found`)
      }

      if (strategy.status !== 'active' || !strategy.recurringAmount) {
        return null
      }

      // Calculate contribution fees
      const contributionFees = centralizedFeeCalculator.calculateFees({
        type: 'start_strategy',
        amount: strategy.recurringAmount,
        chains: [strategy.selectedStrategy.chain]
      })

      // Update strategy
      strategy.performance.totalContributions += strategy.recurringAmount
      strategy.performance.currentValue += strategy.recurringAmount
      strategy.nextContribution = this.calculateNextContribution(strategy)
      strategy.updatedAt = new Date().toISOString()

      // Add contribution event
      this.addStrategyEvent(strategy, 'contribution_processed', {
        amount: strategy.recurringAmount,
        fees: contributionFees.total,
        newTotalContributions: strategy.performance.totalContributions
      })

      logger.info('Recurring contribution processed:', { 
        strategyId, 
        amount: strategy.recurringAmount 
      })

      return {
        strategy,
        contributionAmount: strategy.recurringAmount,
        fees: contributionFees
      }
    } catch (error) {
      logger.error('Error processing recurring contribution:', error)
      throw new Error('Failed to process recurring contribution')
    }
  }

  /**
   * Update strategy performance
   */
  updateStrategyPerformance(strategyId, marketData) {
    try {
      const strategy = this.activeStrategies.get(strategyId)
      if (!strategy || strategy.status !== 'active') {
        return null
      }

      const previousValue = strategy.performance.currentValue
      const apy = strategy.selectedStrategy.apy.average / 100
      const dailyRate = apy / 365

      // Calculate new value based on daily compounding
      const newValue = previousValue * (1 + dailyRate)
      const dailyReturn = newValue - previousValue
      const totalReturn = newValue - strategy.performance.totalContributions
      const returnPercentage = (totalReturn / strategy.performance.totalContributions) * 100

      // Update performance
      strategy.performance = {
        ...strategy.performance,
        currentValue: newValue,
        totalReturn,
        returnPercentage,
        lastUpdate: new Date().toISOString()
      }

      // Add daily return to history
      strategy.performance.dailyReturns.push({
        date: new Date().toISOString().split('T')[0],
        value: newValue,
        return: dailyReturn,
        apy: strategy.selectedStrategy.apy.average
      })

      // Keep only last 365 days
      if (strategy.performance.dailyReturns.length > 365) {
        strategy.performance.dailyReturns = strategy.performance.dailyReturns.slice(-365)
      }

      strategy.updatedAt = new Date().toISOString()

      return strategy.performance
    } catch (error) {
      logger.error('Error updating strategy performance:', error)
      return null
    }
  }

  /**
   * Get strategy by ID
   */
  getStrategy(strategyId) {
    return this.activeStrategies.get(strategyId) || this.strategyHistory.get(strategyId)
  }

  /**
   * Get all active strategies
   */
  getActiveStrategies() {
    return Array.from(this.activeStrategies.values())
  }

  /**
   * Get strategy history
   */
  getStrategyHistory(limit = 50) {
    const history = Array.from(this.strategyHistory.values())
    return history
      .sort((a, b) => new Date(b.stoppedAt) - new Date(a.stoppedAt))
      .slice(0, limit)
  }

  /**
   * Get strategy performance metrics
   */
  getStrategyMetrics(strategyId) {
    const strategy = this.getStrategy(strategyId)
    if (!strategy) {
      return null
    }

    const performance = strategy.performance
    const daysActive = Math.floor(
      (new Date() - new Date(strategy.createdAt)) / (1000 * 60 * 60 * 24)
    )

    return {
      strategyId,
      daysActive,
      currentValue: performance.currentValue,
      totalContributions: performance.totalContributions,
      totalReturn: performance.totalReturn,
      returnPercentage: performance.returnPercentage,
      averageDailyReturn: performance.dailyReturns.length > 0 
        ? performance.dailyReturns.reduce((sum, day) => sum + day.return, 0) / performance.dailyReturns.length
        : 0,
      volatility: this.calculateVolatility(performance.dailyReturns),
      sharpeRatio: this.calculateSharpeRatio(performance.dailyReturns),
      maxDrawdown: this.calculateMaxDrawdown(performance.dailyReturns)
    }
  }

  /**
   * Get portfolio overview
   */
  getPortfolioOverview() {
    const activeStrategies = this.getActiveStrategies()
    
    const totalValue = activeStrategies.reduce((sum, strategy) => 
      sum + strategy.performance.currentValue, 0)
    
    const totalContributions = activeStrategies.reduce((sum, strategy) => 
      sum + strategy.performance.totalContributions, 0)
    
    const totalReturn = totalValue - totalContributions
    const returnPercentage = totalContributions > 0 ? (totalReturn / totalContributions) * 100 : 0

    return {
      totalStrategies: activeStrategies.length,
      totalValue,
      totalContributions,
      totalReturn,
      returnPercentage,
      strategies: activeStrategies.map(strategy => ({
        id: strategy.id,
        name: strategy.name,
        currentValue: strategy.performance.currentValue,
        returnPercentage: strategy.performance.returnPercentage,
        status: strategy.status
      }))
    }
  }

  /**
   * Register event handler
   */
  onEvent(eventType, handler) {
    if (!this.eventHandlers.has(eventType)) {
      this.eventHandlers.set(eventType, [])
    }
    this.eventHandlers.get(eventType).push(handler)
  }

  /**
   * Add strategy event
   */
  addStrategyEvent(strategy, eventType, data = {}) {
    const event = {
      id: this.generateEventId(),
      type: eventType,
      timestamp: new Date().toISOString(),
      data
    }

    strategy.events.push(event)
    strategy.updatedAt = new Date().toISOString()

    // Trigger event handlers
    const handlers = this.eventHandlers.get(eventType) || []
    handlers.forEach(handler => {
      try {
        handler(strategy.id, event)
      } catch (error) {
        logger.error('Error in event handler:', error)
      }
    })

    return event
  }

  /**
   * Helper methods
   */
  generateStrategyId() {
    return `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  generateEventId() {
    return `event_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  calculateNextContribution(strategy) {
    if (!strategy.recurringAmount || strategy.recurringAmount <= 0) {
      return null
    }

    const now = new Date()
    const frequency = strategy.recurringFrequency

    const nextDate = new Date(now)
    
    switch (frequency) {
      case 'weekly':
        nextDate.setDate(now.getDate() + 7)
        break
      case 'bi-weekly':
        nextDate.setDate(now.getDate() + 14)
        break
      case 'monthly':
        nextDate.setMonth(now.getMonth() + 1)
        break
      case 'quarterly':
        nextDate.setMonth(now.getMonth() + 3)
        break
      case 'semi-annually':
        nextDate.setMonth(now.getMonth() + 6)
        break
      case 'annually':
        nextDate.setFullYear(now.getFullYear() + 1)
        break
      default:
        nextDate.setMonth(now.getMonth() + 1)
    }

    return nextDate.toISOString()
  }

  calculateFinalPerformance(strategy) {
    return {
      currentValue: strategy.performance.currentValue,
      totalContributions: strategy.performance.totalContributions,
      totalReturn: strategy.performance.totalReturn,
      returnPercentage: strategy.performance.returnPercentage,
      duration: Math.floor(
        (new Date() - new Date(strategy.createdAt)) / (1000 * 60 * 60 * 24)
      ),
      annualizedReturn: this.calculateAnnualizedReturn(strategy)
    }
  }

  calculateAnnualizedReturn(strategy) {
    const daysActive = (new Date() - new Date(strategy.createdAt)) / (1000 * 60 * 60 * 24)
    if (daysActive < 1) return 0
    
    const totalReturn = strategy.performance.returnPercentage / 100
    return (Math.pow(1 + totalReturn, 365 / daysActive) - 1) * 100
  }

  initializePerformanceTracking(strategy) {
    // Add initial performance entry
    strategy.performance.dailyReturns.push({
      date: new Date().toISOString().split('T')[0],
      value: strategy.initialAmount,
      return: 0,
      apy: strategy.selectedStrategy.apy.average
    })
  }

  calculateVolatility(dailyReturns) {
    if (dailyReturns.length < 2) return 0
    
    const returns = dailyReturns.map(day => day.return)
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
    const variance = returns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / returns.length
    
    return Math.sqrt(variance) * Math.sqrt(365) // Annualized volatility
  }

  calculateSharpeRatio(dailyReturns) {
    if (dailyReturns.length < 2) return 0
    
    const returns = dailyReturns.map(day => day.return)
    const mean = returns.reduce((sum, ret) => sum + ret, 0) / returns.length
    const volatility = this.calculateVolatility(dailyReturns)
    
    const riskFreeRate = 0.02 / 365 // 2% annual risk-free rate
    return volatility > 0 ? (mean - riskFreeRate) / volatility : 0
  }

  calculateMaxDrawdown(dailyReturns) {
    if (dailyReturns.length < 2) return 0
    
    let maxDrawdown = 0
    let peak = dailyReturns[0].value
    
    for (const day of dailyReturns) {
      if (day.value > peak) {
        peak = day.value
      }
      const drawdown = (peak - day.value) / peak
      maxDrawdown = Math.max(maxDrawdown, drawdown)
    }
    
    return maxDrawdown * 100 // Return as percentage
  }
}

export const strategyLifecycleManager = new StrategyLifecycleManager()