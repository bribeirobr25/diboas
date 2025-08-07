/**
 * Strategy Lifecycle Manager
 * Manages the complete lifecycle of DeFi strategies: Launch, Running, Stop
 * Integrates with transaction system and balance management
 */

import logger from '../../utils/logger'
import { CentralizedFeeCalculator } from '../../utils/feeCalculations.js'

export class StrategyLifecycleManager {
  constructor() {
    this.activeStrategies = new Map()
    this.feeCalculator = new CentralizedFeeCalculator()
    this.strategyCounter = 0
  }

  /**
   * Launch a new strategy
   * @param {Object} strategyConfig - Complete strategy configuration
   * @param {Object} userBalance - Current user balance state
   * @returns {Promise<Object>} Launch result with transaction details
   */
  async launchStrategy(strategyConfig, userBalance) {
    const {
      strategyId,
      strategyData,
      goalConfig,
      initialAmount,
      recurringConfig = null,
      selectedChain = 'SOL'
    } = strategyConfig

    try {
      logger.info('Launching strategy:', { strategyId, initialAmount, chain: selectedChain })

      // Validate user has sufficient balance
      if (userBalance.available < initialAmount) {
        throw new Error(`Insufficient balance. Available: $${userBalance.available.toFixed(2)}, Required: $${initialAmount.toFixed(2)}`)
      }

      // Calculate launch fees
      const feeBreakdown = this.feeCalculator.calculateFees({
        type: 'start_strategy',
        amount: initialAmount,
        asset: 'USDC', // Always start with USDC on SOL
        paymentMethod: 'diboas_wallet',
        chains: [selectedChain]
      })

      const totalCost = initialAmount + feeBreakdown.total
      
      if (userBalance.available < totalCost) {
        throw new Error(`Insufficient balance including fees. Available: $${userBalance.available.toFixed(2)}, Required: $${totalCost.toFixed(2)}`)
      }

      // Generate unique strategy instance ID
      const strategyInstanceId = this.generateStrategyInstanceId()

      // Create strategy instance
      const strategyInstance = {
        id: strategyInstanceId,
        strategyId,
        strategyData,
        goalConfig,
        status: 'launching',
        initialAmount,
        currentValue: initialAmount,
        totalDeposited: initialAmount,
        totalWithdrawn: 0,
        earnings: 0,
        performance: {
          currentAPY: strategyData.apy.current,
          totalReturn: 0,
          totalReturnPercentage: 0,
          daysRunning: 0
        },
        chain: selectedChain,
        targetAsset: this.getTargetAsset(strategyData, selectedChain),
        recurringConfig,
        feeBreakdown,
        launchedAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        transactions: []
      }

      // Simulate DeFi platform interaction
      const deploymentResult = await this.deployToDefiPlatform(strategyInstance)
      
      if (!deploymentResult.success) {
        throw new Error(`Strategy deployment failed: ${deploymentResult.error}`)
      }

      // Update strategy status
      strategyInstance.status = 'running'
      strategyInstance.defiTransactionHash = deploymentResult.transactionHash
      strategyInstance.defiProtocolAddress = deploymentResult.protocolAddress

      // Store active strategy
      this.activeStrategies.set(strategyInstanceId, strategyInstance)

      // Create transaction record
      const transactionRecord = {
        id: `strategy_launch_${strategyInstanceId}_${Date.now()}`,
        type: 'start_strategy',
        status: 'completed',
        amount: initialAmount,
        fees: feeBreakdown,
        totalAmount: totalCost,
        asset: 'USDC',
        chain: selectedChain,
        timestamp: new Date().toISOString(),
        strategyInstanceId,
        strategyName: strategyData.name,
        metadata: {
          strategyId,
          protocolName: strategyData.protocol,
          targetAPY: strategyData.apy.current,
          defiTransactionHash: deploymentResult.transactionHash
        }
      }

      logger.info('Strategy launched successfully:', { 
        strategyInstanceId, 
        transactionId: transactionRecord.id 
      })

      return {
        success: true,
        strategyInstance,
        transaction: transactionRecord,
        balanceChanges: {
          availableChange: -totalCost,
          strategyChange: +initialAmount
        }
      }

    } catch (error) {
      logger.error('Strategy launch failed:', error)
      return {
        success: false,
        error: error.message,
        balanceChanges: { availableChange: 0, strategyChange: 0 }
      }
    }
  }

  /**
   * Stop an active strategy
   * @param {string} strategyInstanceId - Strategy instance to stop
   * @param {Object} userBalance - Current user balance state  
   * @returns {Promise<Object>} Stop result with transaction details
   */
  async stopStrategy(strategyInstanceId, userBalance) {
    try {
      const strategyInstance = this.activeStrategies.get(strategyInstanceId)
      
      if (!strategyInstance) {
        throw new Error('Strategy not found')
      }

      if (strategyInstance.status !== 'running') {
        throw new Error(`Cannot stop strategy in ${strategyInstance.status} status`)
      }

      logger.info('Stopping strategy:', { strategyInstanceId })

      // Update status to stopping
      strategyInstance.status = 'stopping'
      strategyInstance.lastUpdated = new Date().toISOString()

      // Get current strategy value from DeFi platform
      const currentValue = await this.getCurrentStrategyValue(strategyInstance)
      strategyInstance.currentValue = currentValue

      // Calculate stop fees based on current value
      const feeBreakdown = this.feeCalculator.calculateFees({
        type: 'stop_strategy',
        amount: currentValue,
        asset: strategyInstance.targetAsset,
        paymentMethod: 'diboas_wallet',
        chains: [strategyInstance.chain]
      })

      const netAmount = currentValue - feeBreakdown.total
      
      if (netAmount <= 0) {
        throw new Error('Strategy value too low to cover withdrawal fees')
      }

      // Simulate DeFi platform withdrawal
      const withdrawalResult = await this.withdrawFromDefiPlatform(strategyInstance)
      
      if (!withdrawalResult.success) {
        throw new Error(`Strategy withdrawal failed: ${withdrawalResult.error}`)
      }

      // Calculate final performance metrics
      const totalEarnings = currentValue - strategyInstance.totalDeposited
      const daysRunning = Math.floor(
        (new Date() - new Date(strategyInstance.launchedAt)) / (1000 * 60 * 60 * 24)
      )
      const annualizedReturn = daysRunning > 0 
        ? (totalEarnings / strategyInstance.totalDeposited) * (365 / daysRunning) * 100 
        : 0

      // Update strategy final state
      strategyInstance.status = 'stopped'
      strategyInstance.stoppedAt = new Date().toISOString()
      strategyInstance.earnings = totalEarnings
      strategyInstance.performance.totalReturn = totalEarnings
      strategyInstance.performance.totalReturnPercentage = (totalEarnings / strategyInstance.totalDeposited) * 100
      strategyInstance.performance.daysRunning = daysRunning
      strategyInstance.performance.finalizedAPY = annualizedReturn
      strategyInstance.finalValue = currentValue
      strategyInstance.netWithdrawal = netAmount

      // Create transaction record
      const transactionRecord = {
        id: `strategy_stop_${strategyInstanceId}_${Date.now()}`,
        type: 'stop_strategy',
        status: 'completed',
        amount: currentValue,
        fees: feeBreakdown,
        netAmount,
        asset: strategyInstance.targetAsset,
        chain: strategyInstance.chain,
        timestamp: new Date().toISOString(),
        strategyInstanceId,
        strategyName: strategyInstance.strategyData.name,
        metadata: {
          strategyId: strategyInstance.strategyId,
          protocolName: strategyInstance.strategyData.protocol,
          daysRunning,
          totalEarnings,
          finalAPY: annualizedReturn,
          defiTransactionHash: withdrawalResult.transactionHash
        }
      }

      // Remove from active strategies (move to historical)
      this.activeStrategies.delete(strategyInstanceId)

      logger.info('Strategy stopped successfully:', { 
        strategyInstanceId, 
        transactionId: transactionRecord.id,
        totalEarnings,
        finalAPY: annualizedReturn
      })

      return {
        success: true,
        strategyInstance,
        transaction: transactionRecord,
        balanceChanges: {
          availableChange: +netAmount, // Add withdrawn amount to available balance
          strategyChange: -strategyInstance.totalDeposited // Remove from strategy balance
        },
        performance: {
          totalEarnings,
          returnPercentage: strategyInstance.performance.totalReturnPercentage,
          daysRunning,
          finalizedAPY: annualizedReturn
        }
      }

    } catch (error) {
      logger.error('Strategy stop failed:', { strategyInstanceId, error })
      
      // Revert status if we can
      const strategyInstance = this.activeStrategies.get(strategyInstanceId)
      if (strategyInstance && strategyInstance.status === 'stopping') {
        strategyInstance.status = 'running'
      }

      return {
        success: false,
        error: error.message,
        balanceChanges: { availableChange: 0, strategyChange: 0 }
      }
    }
  }

  /**
   * Get all active strategies for user
   * @returns {Array} List of active strategy instances
   */
  getActiveStrategies() {
    return Array.from(this.activeStrategies.values())
  }

  /**
   * Get strategy instance by ID
   * @param {string} strategyInstanceId - Strategy instance ID
   * @returns {Object|null} Strategy instance or null
   */
  getStrategyInstance(strategyInstanceId) {
    return this.activeStrategies.get(strategyInstanceId) || null
  }

  /**
   * Update strategy performance (called periodically)
   * @param {string} strategyInstanceId - Strategy to update
   * @returns {Promise<Object>} Updated strategy data
   */
  async updateStrategyPerformance(strategyInstanceId) {
    try {
      const strategyInstance = this.activeStrategies.get(strategyInstanceId)
      
      if (!strategyInstance || strategyInstance.status !== 'running') {
        return { success: false, error: 'Strategy not active' }
      }

      // Get current value from DeFi platform
      const currentValue = await this.getCurrentStrategyValue(strategyInstance)
      const totalEarnings = currentValue - strategyInstance.totalDeposited
      const daysRunning = Math.floor(
        (new Date() - new Date(strategyInstance.launchedAt)) / (1000 * 60 * 60 * 24)
      )

      // Update instance
      strategyInstance.currentValue = currentValue
      strategyInstance.earnings = totalEarnings
      strategyInstance.performance.totalReturn = totalEarnings
      strategyInstance.performance.totalReturnPercentage = (totalEarnings / strategyInstance.totalDeposited) * 100
      strategyInstance.performance.daysRunning = daysRunning
      strategyInstance.lastUpdated = new Date().toISOString()

      // Calculate current APY if enough time has passed
      if (daysRunning > 0) {
        const annualizedReturn = (totalEarnings / strategyInstance.totalDeposited) * (365 / daysRunning) * 100
        strategyInstance.performance.currentAPY = annualizedReturn
      }

      return {
        success: true,
        strategyInstance,
        performanceUpdate: {
          currentValue,
          totalEarnings,
          returnPercentage: strategyInstance.performance.totalReturnPercentage,
          currentAPY: strategyInstance.performance.currentAPY
        }
      }

    } catch (error) {
      logger.error('Strategy performance update failed:', { strategyInstanceId, error })
      return { success: false, error: error.message }
    }
  }

  /**
   * Generate unique strategy instance ID
   */
  generateStrategyInstanceId() {
    this.strategyCounter++
    return `strategy_${Date.now()}_${this.strategyCounter.toString().padStart(4, '0')}`
  }

  /**
   * Determine target asset for strategy based on chain and strategy type
   */
  getTargetAsset(strategyData, chain) {
    // Map chain to native asset for most strategies
    const chainAssetMap = {
      'SOL': 'SOL',
      'ETH': 'ETH', 
      'SUI': 'SUI'
    }

    // Some strategies keep USDC
    if (strategyData.type === 'lending' || strategyData.type === 'stable-earn') {
      return 'USDC'
    }

    return chainAssetMap[chain] || 'USDC'
  }

  /**
   * Mock DeFi platform deployment
   */
  async deployToDefiPlatform(strategyInstance) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))

    // Simulate occasional failures
    if (Math.random() < 0.05) { // 5% failure rate
      return {
        success: false,
        error: 'DeFi platform temporarily unavailable'
      }
    }

    return {
      success: true,
      transactionHash: `0x${Math.random().toString(16).substr(2, 8).padEnd(64, '0')}`,
      protocolAddress: `${strategyInstance.chain}:${Math.random().toString(16).substr(2, 40)}`
    }
  }

  /**
   * Mock DeFi platform withdrawal
   */
  async withdrawFromDefiPlatform(strategyInstance) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))

    // Simulate occasional failures
    if (Math.random() < 0.03) { // 3% failure rate
      return {
        success: false,
        error: 'DeFi platform withdrawal temporarily unavailable'
      }
    }

    return {
      success: true,
      transactionHash: `0x${Math.random().toString(16).substr(2, 8).padEnd(64, '0')}`
    }
  }

  /**
   * Mock current strategy value from DeFi platform
   */
  async getCurrentStrategyValue(strategyInstance) {
    // Simulate some earnings based on APY and time elapsed
    const daysRunning = Math.floor(
      (new Date() - new Date(strategyInstance.launchedAt)) / (1000 * 60 * 60 * 24)
    )

    if (daysRunning <= 0) {
      return strategyInstance.totalDeposited
    }

    // Calculate expected value with some randomness
    const dailyRate = strategyInstance.performance.currentAPY / 100 / 365
    const expectedGrowth = Math.pow(1 + dailyRate, daysRunning)
    
    // Add some volatility (±10%)
    const volatility = 0.9 + Math.random() * 0.2
    const currentValue = strategyInstance.totalDeposited * expectedGrowth * volatility

    return Math.max(strategyInstance.totalDeposited * 0.8, currentValue) // Minimum 80% of original
  }

  /**
   * Get strategy statistics for dashboard
   */
  getStrategyStatistics() {
    const strategies = this.getActiveStrategies()
    
    if (strategies.length === 0) {
      return {
        totalStrategies: 0,
        totalInvested: 0,
        totalCurrentValue: 0,
        totalEarnings: 0,
        averageReturn: 0,
        bestPerformer: null,
        totalAPY: 0
      }
    }

    const totalInvested = strategies.reduce((sum, s) => sum + s.totalDeposited, 0)
    const totalCurrentValue = strategies.reduce((sum, s) => sum + s.currentValue, 0)
    const totalEarnings = totalCurrentValue - totalInvested
    const averageReturn = totalInvested > 0 ? (totalEarnings / totalInvested) * 100 : 0

    const bestPerformer = strategies.reduce((best, current) => 
      current.performance.totalReturnPercentage > (best?.performance?.totalReturnPercentage || -Infinity) 
        ? current : best
    , null)

    return {
      totalStrategies: strategies.length,
      totalInvested,
      totalCurrentValue,
      totalEarnings,
      averageReturn,
      bestPerformer,
      totalAPY: averageReturn // Simplified - in real app would be time-weighted
    }
  }
}

export default new StrategyLifecycleManager()