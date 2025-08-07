/**
 * Consolidated Strategy Lifecycle Manager
 * Unified strategy management combining DeFi integration and performance tracking
 * Consolidates functionality from both /services/strategies/ and /services/defi/ managers
 */

import logger from '../../utils/logger'
import { centralizedFeeCalculator } from '../../utils/feeCalculations.js'

/**
 * Strategy execution strategies for different platforms
 */
export const EXECUTION_STRATEGIES = {
  DEFI_PLATFORM: 'defi_platform',     // Deploy to DeFi protocols
  CENTRALIZED: 'centralized',         // Execute via centralized service
  HYBRID: 'hybrid'                    // Combination approach
}

/**
 * Strategy status types
 */
export const STRATEGY_STATUS = {
  LAUNCHING: 'launching',
  RUNNING: 'running',
  PAUSED: 'paused',
  STOPPING: 'stopping',
  STOPPED: 'stopped',
  ERROR: 'error'
}

/**
 * Consolidated Strategy Lifecycle Manager
 * Manages complete strategy lifecycle with pluggable execution strategies
 */
export class ConsolidatedStrategyLifecycleManager {
  constructor(options = {}) {
    // Core strategy storage
    this.activeStrategies = new Map()
    this.strategyHistory = new Map()
    this.performanceMetrics = new Map()
    this.eventHandlers = new Map()
    
    // Configuration
    this.defaultExecutionStrategy = options.executionStrategy || EXECUTION_STRATEGIES.DEFI_PLATFORM
    this.enablePerformanceTracking = options.enablePerformanceTracking !== false
    this.enableRecurringContributions = options.enableRecurringContributions !== false
    
    // Services
    this.feeCalculator = centralizedFeeCalculator
    this.strategyCounter = 0
    
    // Performance tracking intervals
    this.performanceUpdateInterval = null
  }

  /**
   * Create and launch a new strategy
   * Unified method combining creation and launch functionality
   */
  async createStrategy(config) {
    try {
      const {
        strategyId,
        strategyData,
        goalConfig,
        initialAmount,
        recurringConfig = null,
        selectedChain = 'SOL',
        executionStrategy = this.defaultExecutionStrategy,
        userBalance
      } = config

      // Validate user balance
      if (userBalance && userBalance.available < initialAmount) {
        throw new Error(`Insufficient balance. Available: $${userBalance.available.toFixed(2)}, Required: $${initialAmount.toFixed(2)}`)
      }

      // Calculate launch fees
      const feeBreakdown = this.feeCalculator.calculateFees({
        type: 'start_strategy',
        amount: initialAmount,
        asset: 'USDC',
        paymentMethod: 'diboas_wallet',
        chains: [selectedChain]
      })

      const totalCost = initialAmount + feeBreakdown.total
      
      if (userBalance && userBalance.available < totalCost) {
        throw new Error(`Insufficient balance including fees. Available: $${userBalance.available.toFixed(2)}, Required: $${totalCost.toFixed(2)}`)
      }

      // Generate unique strategy ID
      const finalStrategyId = strategyId || this.generateStrategyId()

      // Create comprehensive strategy object
      const strategy = {
        // Basic info
        id: finalStrategyId,
        name: config.name || strategyData?.name || 'Unnamed Strategy',
        description: config.description || strategyData?.description,
        
        // Configuration
        strategyData,
        goalConfig,
        executionStrategy,
        selectedChain,
        
        // Financial data
        initialAmount,
        currentValue: initialAmount,
        totalDeposited: initialAmount,
        totalWithdrawn: 0,
        
        // Performance tracking
        performance: {
          currentAPY: strategyData?.apy?.current || 0,
          totalReturn: 0,
          totalReturnPercentage: 0,
          daysRunning: 0,
          dailyReturns: [],
          lastUpdate: new Date().toISOString()
        },
        
        // Status and lifecycle
        status: STRATEGY_STATUS.LAUNCHING,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        launchedAt: null,
        stoppedAt: null,
        
        // Advanced features
        recurringConfig,
        nextContribution: recurringConfig?.amount > 0 ? this.calculateNextContribution(recurringConfig) : null,
        
        // Fee and transaction data
        feeBreakdown,
        transactions: [],
        events: [],
        
        // DeFi specific (if applicable)
        targetAsset: this.getTargetAsset(strategyData, selectedChain),
        defiTransactionHash: null,
        defiProtocolAddress: null
      }

      // Add creation event
      this.addStrategyEvent(strategy, 'created', {
        initialAmount,
        selectedStrategy: strategyData?.name,
        chain: selectedChain,
        executionStrategy
      })

      // Execute strategy launch based on execution strategy
      await this.executeStrategyLaunch(strategy)

      // Store in active strategies
      this.activeStrategies.set(strategy.id, strategy)

      // Initialize performance tracking
      if (this.enablePerformanceTracking) {
        this.initializePerformanceTracking(strategy)
      }

      logger.info('Strategy created and launched successfully:', {
        strategyId: strategy.id,
        name: strategy.name,
        executionStrategy,
        initialAmount
      })
      
      return strategy
    } catch (error) {
      logger.error('Error creating strategy:', error)
      throw new Error(`Failed to create strategy: ${error.message}`)
    }
  }

  /**
   * Execute strategy launch based on execution strategy
   */
  async executeStrategyLaunch(strategy) {
    switch (strategy.executionStrategy) {
      case EXECUTION_STRATEGIES.DEFI_PLATFORM:
        await this.executeDefiPlatformLaunch(strategy)
        break
      case EXECUTION_STRATEGIES.CENTRALIZED:
        await this.executeCentralizedLaunch(strategy)
        break
      case EXECUTION_STRATEGIES.HYBRID:
        await this.executeHybridLaunch(strategy)
        break
      default:
        throw new Error(`Unknown execution strategy: ${strategy.executionStrategy}`)
    }
  }

  /**
   * DeFi platform execution strategy
   */
  async executeDefiPlatformLaunch(strategy) {
    // Simulate DeFi platform deployment
    const deploymentResult = await this.deployToDefiPlatform(strategy)
    
    if (!deploymentResult.success) {
      strategy.status = STRATEGY_STATUS.ERROR
      throw new Error(`DeFi deployment failed: ${deploymentResult.error}`)
    }

    // Update strategy with DeFi-specific data
    strategy.status = STRATEGY_STATUS.RUNNING
    strategy.launchedAt = new Date().toISOString()
    strategy.defiTransactionHash = deploymentResult.transactionHash
    strategy.defiProtocolAddress = deploymentResult.protocolAddress

    this.addStrategyEvent(strategy, 'defi_deployed', {
      transactionHash: deploymentResult.transactionHash,
      protocolAddress: deploymentResult.protocolAddress
    })
  }

  /**
   * Centralized execution strategy
   */
  async executeCentralizedLaunch(strategy) {
    // Centralized strategy execution
    strategy.status = STRATEGY_STATUS.RUNNING
    strategy.launchedAt = new Date().toISOString()

    this.addStrategyEvent(strategy, 'centralized_launch', {
      message: 'Strategy launched via centralized execution'
    })
  }

  /**
   * Hybrid execution strategy
   */
  async executeHybridLaunch(strategy) {
    // Combine both approaches
    await this.executeCentralizedLaunch(strategy)
    
    // Add DeFi component if applicable
    if (strategy.strategyData?.supportsDeFi) {
      try {
        await this.executeDefiPlatformLaunch(strategy)
      } catch (error) {
        logger.warn('DeFi component failed, continuing with centralized execution:', error)
      }
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

      // Update status to stopping
      strategy.status = STRATEGY_STATUS.STOPPING
      strategy.updatedAt = new Date().toISOString()

      // Calculate final performance
      const finalPerformance = this.calculateFinalPerformance(strategy)
      
      // Calculate stop fees
      const stopFees = this.feeCalculator.calculateFees({
        type: 'stop_strategy',
        amount: finalPerformance.currentValue,
        chains: [strategy.selectedChain]
      })

      // Execute stop based on execution strategy
      await this.executeStrategyStop(strategy)

      // Update final strategy state
      strategy.status = STRATEGY_STATUS.STOPPED
      strategy.stoppedAt = new Date().toISOString()
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

      // Move to history and remove from active
      this.strategyHistory.set(strategyId, strategy)
      this.activeStrategies.delete(strategyId)

      // Clean up performance tracking
      if (this.performanceMetrics.has(strategyId)) {
        this.performanceMetrics.delete(strategyId)
      }

      logger.info('Strategy stopped successfully:', {
        strategyId,
        reason,
        finalValue: finalPerformance.currentValue,
        totalReturn: finalPerformance.totalReturn
      })

      return {
        success: true,
        strategy,
        finalPerformance,
        stopFees
      }
    } catch (error) {
      logger.error('Error stopping strategy:', error)
      throw new Error(`Failed to stop strategy: ${error.message}`)
    }
  }

  /**
   * Execute strategy stop based on execution strategy
   */
  async executeStrategyStop(strategy) {
    switch (strategy.executionStrategy) {
      case EXECUTION_STRATEGIES.DEFI_PLATFORM:
        if (strategy.defiProtocolAddress) {
          await this.stopDefiStrategy(strategy)
        }
        break
      case EXECUTION_STRATEGIES.CENTRALIZED:
        await this.stopCentralizedStrategy(strategy)
        break
      case EXECUTION_STRATEGIES.HYBRID:
        await this.stopCentralizedStrategy(strategy)
        if (strategy.defiProtocolAddress) {
          await this.stopDefiStrategy(strategy)
        }
        break
    }
  }

  /**
   * Update strategy performance
   * Unified performance tracking for all execution strategies
   */
  async updateStrategyPerformance(strategyId, performanceData = null) {
    const strategy = this.activeStrategies.get(strategyId)
    if (!strategy) return

    try {
      let currentPerformance
      
      if (performanceData) {
        currentPerformance = performanceData
      } else {
        // Fetch performance based on execution strategy
        currentPerformance = await this.fetchStrategyPerformance(strategy)
      }

      // Update strategy performance
      strategy.currentValue = currentPerformance.currentValue
      strategy.performance = {
        ...strategy.performance,
        ...currentPerformance,
        lastUpdate: new Date().toISOString()
      }

      strategy.updatedAt = new Date().toISOString()

      // Store performance metrics
      if (!this.performanceMetrics.has(strategyId)) {
        this.performanceMetrics.set(strategyId, [])
      }
      
      this.performanceMetrics.get(strategyId).push({
        timestamp: new Date().toISOString(),
        ...currentPerformance
      })

      // Add performance event
      this.addStrategyEvent(strategy, 'performance_updated', {
        currentValue: currentPerformance.currentValue,
        totalReturn: currentPerformance.totalReturn,
        apy: currentPerformance.currentAPY
      })

      return currentPerformance
    } catch (error) {
      logger.error('Error updating strategy performance:', error)
      return null
    }
  }

  /**
   * Get all active strategies
   */
  getActiveStrategies() {
    return Array.from(this.activeStrategies.values())
  }

  /**
   * Get strategy by ID
   */
  getStrategy(strategyId) {
    return this.activeStrategies.get(strategyId) || this.strategyHistory.get(strategyId)
  }

  /**
   * Get strategy history
   */
  getStrategyHistory() {
    return Array.from(this.strategyHistory.values())
  }

  /**
   * Get portfolio overview
   */
  getPortfolioOverview() {
    const activeStrategies = this.getActiveStrategies()
    const historicalStrategies = this.getStrategyHistory()
    
    const totalInvested = activeStrategies.reduce((sum, s) => sum + s.totalDeposited, 0)
    const currentValue = activeStrategies.reduce((sum, s) => sum + s.currentValue, 0)
    const totalReturn = currentValue - totalInvested
    const totalReturnPercentage = totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0

    return {
      activeStrategiesCount: activeStrategies.length,
      totalInvested,
      currentValue,
      totalReturn,
      totalReturnPercentage,
      strategies: activeStrategies,
      historicalStrategiesCount: historicalStrategies.length
    }
  }

  // Helper methods
  generateStrategyId() {
    this.strategyCounter++
    return `strategy_${Date.now()}_${this.strategyCounter}`
  }

  addStrategyEvent(strategy, eventType, eventData = {}) {
    const event = {
      type: eventType,
      timestamp: new Date().toISOString(),
      data: eventData
    }
    strategy.events.push(event)
    strategy.updatedAt = new Date().toISOString()
  }

  calculateNextContribution(recurringConfig) {
    const now = new Date()
    const nextDate = new Date(now.getTime() + (recurringConfig.intervalDays * 24 * 60 * 60 * 1000))
    return nextDate.toISOString()
  }

  getTargetAsset(strategyData, selectedChain) {
    if (selectedChain === 'SOL') return 'USDC'
    if (selectedChain === 'ETH') return 'USDT'
    return 'USDC'
  }

  calculateFinalPerformance(strategy) {
    return {
      currentValue: strategy.currentValue,
      totalReturn: strategy.currentValue - strategy.totalDeposited,
      totalReturnPercentage: strategy.totalDeposited > 0 ? 
        ((strategy.currentValue - strategy.totalDeposited) / strategy.totalDeposited) * 100 : 0,
      daysRunning: strategy.launchedAt ? 
        Math.floor((Date.now() - new Date(strategy.launchedAt).getTime()) / (24 * 60 * 60 * 1000)) : 0
    }
  }

  // Platform-specific methods (to be implemented based on actual platform needs)
  async deployToDefiPlatform(strategy) {
    // Simulate DeFi deployment
    await new Promise(resolve => setTimeout(resolve, 1000))
    return {
      success: true,
      transactionHash: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      protocolAddress: `0x${Math.random().toString(36).substr(2, 40)}`
    }
  }

  async stopDefiStrategy(strategy) {
    // Simulate DeFi strategy termination
    await new Promise(resolve => setTimeout(resolve, 500))
  }

  async stopCentralizedStrategy(strategy) {
    // Centralized strategy termination
    await new Promise(resolve => setTimeout(resolve, 100))
  }

  async fetchStrategyPerformance(strategy) {
    // Simulate performance data fetching
    const baseReturn = 0.05 // 5% base return
    const randomVariation = (Math.random() - 0.5) * 0.02 // ±1% variation
    const currentAPY = baseReturn + randomVariation
    
    const daysRunning = strategy.launchedAt ? 
      Math.floor((Date.now() - new Date(strategy.launchedAt).getTime()) / (24 * 60 * 60 * 1000)) : 0
    
    const dailyReturn = currentAPY / 365
    const currentValue = strategy.totalDeposited * (1 + dailyReturn * daysRunning)
    const totalReturn = currentValue - strategy.totalDeposited
    
    return {
      currentValue,
      totalReturn,
      totalReturnPercentage: (totalReturn / strategy.totalDeposited) * 100,
      currentAPY: currentAPY * 100,
      daysRunning
    }
  }

  initializePerformanceTracking(strategy) {
    // Initialize performance tracking for the strategy
    this.performanceMetrics.set(strategy.id, [])
    
    // Initial performance entry
    this.performanceMetrics.get(strategy.id).push({
      timestamp: strategy.createdAt,
      currentValue: strategy.initialAmount,
      totalReturn: 0,
      totalReturnPercentage: 0
    })
  }

  // Cleanup method
  destroy() {
    if (this.performanceUpdateInterval) {
      clearInterval(this.performanceUpdateInterval)
    }
    this.activeStrategies.clear()
    this.strategyHistory.clear()
    this.performanceMetrics.clear()
    this.eventHandlers.clear()
  }
}

// Export singleton instance
export const strategyLifecycleManager = new ConsolidatedStrategyLifecycleManager()

export default ConsolidatedStrategyLifecycleManager