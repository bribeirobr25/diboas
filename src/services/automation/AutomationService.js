/**
 * Automation Service
 * Handles scheduled deposits, strategy execution, and automated portfolio management
 */

import logger from '../../utils/logger.js'
import secureLogger from '../../utils/secureLogger.js'
import { dataManager } from '../DataManager.js'
import protocolService from '../defi/ProtocolService.js'
import riskEngine from '../risk/RiskEngine.js'

export const AUTOMATION_TYPES = {
  SCHEDULED_DEPOSIT: 'scheduled_deposit',
  STRATEGY_EXECUTION: 'strategy_execution',
  REBALANCING: 'rebalancing',
  TAKE_PROFIT: 'take_profit',
  STOP_LOSS: 'stop_loss',
  YIELD_HARVEST: 'yield_harvest'
}

export const AUTOMATION_STATUS = {
  ACTIVE: 'active',
  PAUSED: 'paused',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  FAILED: 'failed'
}

export const FREQUENCY_TYPES = {
  DAILY: 'daily',
  WEEKLY: 'weekly',
  BIWEEKLY: 'biweekly',
  MONTHLY: 'monthly',
  QUARTERLY: 'quarterly'
}

class AutomationService {
  constructor() {
    this.automations = new Map()
    this.executionQueue = []
    this.isProcessing = false
    this.processInterval = null
    this.retryAttempts = 3
    this.retryDelay = 5000 // 5 seconds

    this.initializeService()
  }

  /**
   * Initialize automation service
   */
  initializeService() {
    // Start the automation processor
    this.startProcessor()
    
    // Load existing automations from storage
    this.loadAutomations()

    logger.info('Automation service initialized')
  }

  /**
   * Create a new automation
   */
  async createAutomation(automation) {
    try {
      const automationId = this.generateAutomationId()
      const newAutomation = {
        id: automationId,
        ...automation,
        status: AUTOMATION_STATUS.ACTIVE,
        createdAt: Date.now(),
        lastExecuted: null,
        executionCount: 0,
        failureCount: 0,
        nextExecution: this.calculateNextExecution(automation.frequency, automation.startDate)
      }

      // Validate automation
      const validation = this.validateAutomation(newAutomation)
      if (!validation.valid) {
        throw new Error(`Invalid automation: ${validation.errors.join(', ')}`)
      }

      this.automations.set(automationId, newAutomation)
      this.persistAutomations()

      secureLogger.audit('AUTOMATION_CREATED', {
        automationId,
        type: automation.type,
        frequency: automation.frequency
      })

      logger.info(`Created automation ${automationId} of type ${automation.type}`)
      return newAutomation
    } catch (error) {
      logger.error('Failed to create automation:', error)
      throw error
    }
  }

  /**
   * Create scheduled deposit automation
   */
  async createScheduledDeposit(config) {
    const automation = {
      type: AUTOMATION_TYPES.SCHEDULED_DEPOSIT,
      name: config.name || 'Scheduled Deposit',
      frequency: config.frequency,
      startDate: config.startDate || Date.now(),
      endDate: config.endDate,
      parameters: {
        amount: config.amount,
        sourceAccount: config.sourceAccount,
        targetStrategy: config.targetStrategy,
        currency: config.currency || 'USD'
      }
    }

    return this.createAutomation(automation)
  }

  /**
   * Create strategy execution automation
   */
  async createStrategyExecution(config) {
    const automation = {
      type: AUTOMATION_TYPES.STRATEGY_EXECUTION,
      name: config.name || 'Strategy Execution',
      frequency: config.frequency,
      startDate: config.startDate || Date.now(),
      endDate: config.endDate,
      parameters: {
        strategyId: config.strategyId,
        amount: config.amount,
        conditions: config.conditions || {},
        riskParameters: config.riskParameters || {}
      }
    }

    return this.createAutomation(automation)
  }

  /**
   * Create rebalancing automation
   */
  async createRebalancing(config) {
    const automation = {
      type: AUTOMATION_TYPES.REBALANCING,
      name: config.name || 'Portfolio Rebalancing',
      frequency: config.frequency,
      startDate: config.startDate || Date.now(),
      parameters: {
        portfolioId: config.portfolioId,
        targetAllocations: config.targetAllocations,
        rebalanceThreshold: config.rebalanceThreshold || 0.05,
        riskTolerance: config.riskTolerance
      }
    }

    return this.createAutomation(automation)
  }

  /**
   * Create take profit automation
   */
  async createTakeProfit(config) {
    const automation = {
      type: AUTOMATION_TYPES.TAKE_PROFIT,
      name: config.name || 'Take Profit',
      frequency: FREQUENCY_TYPES.DAILY, // Check daily
      startDate: config.startDate || Date.now(),
      parameters: {
        strategyId: config.strategyId,
        targetReturn: config.targetReturn,
        sellPercentage: config.sellPercentage || 100,
        conditions: config.conditions || {}
      }
    }

    return this.createAutomation(automation)
  }

  /**
   * Execute pending automations
   */
  async processPendingAutomations() {
    if (this.isProcessing) {
      return
    }

    this.isProcessing = true
    const now = Date.now()

    try {
      const pendingAutomations = Array.from(this.automations.values())
        .filter(automation => 
          automation.status === AUTOMATION_STATUS.ACTIVE &&
          automation.nextExecution <= now
        )
        .sort((a, b) => a.nextExecution - b.nextExecution)

      logger.info(`Processing ${pendingAutomations.length} pending automations`)

      for (const automation of pendingAutomations) {
        try {
          await this.executeAutomation(automation)
        } catch (error) {
          logger.error(`Failed to execute automation ${automation.id}:`, error)
          this.handleExecutionFailure(automation, error)
        }
      }
    } catch (error) {
      logger.error('Error processing automations:', error)
    } finally {
      this.isProcessing = false
    }
  }

  /**
   * Execute a specific automation
   */
  async executeAutomation(automation) {
    const startTime = Date.now()
    
    try {
      logger.info(`Executing automation ${automation.id} (${automation.type})`)

      let result
      switch (automation.type) {
        case AUTOMATION_TYPES.SCHEDULED_DEPOSIT:
          result = await this.executeScheduledDeposit(automation)
          break
        case AUTOMATION_TYPES.STRATEGY_EXECUTION:
          result = await this.executeStrategy(automation)
          break
        case AUTOMATION_TYPES.REBALANCING:
          result = await this.executeRebalancing(automation)
          break
        case AUTOMATION_TYPES.TAKE_PROFIT:
          result = await this.executeTakeProfit(automation)
          break
        case AUTOMATION_TYPES.YIELD_HARVEST:
          result = await this.executeYieldHarvest(automation)
          break
        default:
          throw new Error(`Unknown automation type: ${automation.type}`)
      }

      // Update automation status
      automation.lastExecuted = Date.now()
      automation.executionCount++
      automation.failureCount = 0 // Reset failure count on success
      
      // Calculate next execution
      if (automation.frequency && (!automation.endDate || automation.nextExecution < automation.endDate)) {
        automation.nextExecution = this.calculateNextExecution(automation.frequency, automation.lastExecuted)
      } else {
        automation.status = AUTOMATION_STATUS.COMPLETED
      }

      this.automations.set(automation.id, automation)
      this.persistAutomations()

      const executionTime = Date.now() - startTime

      secureLogger.audit('AUTOMATION_EXECUTED', {
        automationId: automation.id,
        type: automation.type,
        executionTime,
        result: result?.success || false
      })

      logger.info(`Automation ${automation.id} executed successfully in ${executionTime}ms`)
      return result
    } catch (error) {
      logger.error(`Automation execution failed for ${automation.id}:`, error)
      throw error
    }
  }

  /**
   * Execute scheduled deposit
   */
  async executeScheduledDeposit(automation) {
    const { amount, sourceAccount, targetStrategy, currency } = automation.parameters

    try {
      // Validate source account has sufficient funds
      const balance = await this.getAccountBalance(sourceAccount)
      if (balance < amount) {
        throw new Error(`Insufficient funds in source account. Required: ${amount}, Available: ${balance}`)
      }

      // Process deposit
      const transaction = {
        type: 'deposit',
        amount,
        currency,
        sourceAccount,
        targetStrategy,
        timestamp: Date.now(),
        automationId: automation.id
      }

      // If targeting a specific strategy, add to that strategy
      if (targetStrategy) {
        await dataManager.updateStrategyBalance(targetStrategy, amount, {
          name: `Automated Deposit - ${automation.name}`,
          source: 'automation'
        })
      } else {
        // Add to available balance
        await dataManager.updateBalance(amount, 'scheduled_deposit')
      }

      // Record transaction
      await dataManager.addTransaction(transaction)

      return {
        success: true,
        transaction,
        message: `Deposited ${amount} ${currency} successfully`
      }
    } catch (error) {
      logger.error('Scheduled deposit execution failed:', error)
      throw error
    }
  }

  /**
   * Execute strategy
   */
  async executeStrategy(automation) {
    const { strategyId, amount, conditions, riskParameters } = automation.parameters

    try {
      // Check conditions before execution
      if (conditions && !await this.checkConditions(conditions)) {
        return {
          success: false,
          skipped: true,
          reason: 'Execution conditions not met'
        }
      }

      // Get strategy details
      const strategy = await this.getStrategyConfig(strategyId)
      if (!strategy) {
        throw new Error(`Strategy ${strategyId} not found`)
      }

      // Risk assessment
      if (riskParameters.requireRiskCheck) {
        const riskAssessment = await riskEngine.assessPortfolioRisk(
          await this.getCurrentPortfolio(),
          riskParameters.riskTolerance
        )

        if (!riskAssessment.isWithinTolerance) {
          return {
            success: false,
            skipped: true,
            reason: 'Risk tolerance exceeded',
            riskAssessment
          }
        }
      }

      // Execute strategy
      await dataManager.updateStrategyBalance(strategyId, amount, {
        name: strategy.name,
        apy: strategy.expectedAPY,
        protocol: strategy.protocol,
        source: 'automation'
      })

      const transaction = {
        type: 'start_strategy',
        amount,
        strategyId,
        timestamp: Date.now(),
        automationId: automation.id
      }

      await dataManager.addTransaction(transaction)

      return {
        success: true,
        transaction,
        strategy,
        message: `Strategy ${strategyId} executed with ${amount} USD`
      }
    } catch (error) {
      logger.error('Strategy execution failed:', error)
      throw error
    }
  }

  /**
   * Execute portfolio rebalancing
   */
  async executeRebalancing(automation) {
    const { portfolioId, targetAllocations, rebalanceThreshold, riskTolerance } = automation.parameters

    try {
      const portfolio = await this.getCurrentPortfolio(portfolioId)
      
      // Generate rebalancing recommendation
      const recommendation = await riskEngine.generateRebalanceRecommendation(
        portfolio,
        riskTolerance,
        targetAllocations
      )

      if (!recommendation.needsRebalancing) {
        return {
          success: true,
          skipped: true,
          reason: 'Portfolio already balanced',
          currentAllocations: portfolio.allocations
        }
      }

      // Execute rebalancing actions
      const results = []
      for (const action of recommendation.actions) {
        try {
          const result = await this.executeRebalancingAction(action, portfolio)
          results.push(result)
        } catch (error) {
          logger.error(`Rebalancing action failed:`, error)
          results.push({
            action,
            success: false,
            error: error.message
          })
        }
      }

      const successfulActions = results.filter(r => r.success).length
      const totalActions = results.length

      return {
        success: successfulActions > 0,
        actions: results,
        successRate: successfulActions / totalActions,
        recommendation,
        message: `Rebalancing completed: ${successfulActions}/${totalActions} actions successful`
      }
    } catch (error) {
      logger.error('Rebalancing execution failed:', error)
      throw error
    }
  }

  /**
   * Execute take profit
   */
  async executeTakeProfit(automation) {
    const { strategyId, targetReturn, sellPercentage, conditions } = automation.parameters

    try {
      const strategy = dataManager.getActiveStrategies().find(s => s.id === strategyId)
      if (!strategy) {
        throw new Error(`Strategy ${strategyId} not found or inactive`)
      }

      // Calculate current return
      const currentReturn = ((strategy.currentAmount - strategy.targetAmount) / strategy.targetAmount) * 100

      if (currentReturn < targetReturn) {
        return {
          success: true,
          skipped: true,
          reason: `Current return (${currentReturn.toFixed(2)}%) below target (${targetReturn}%)`,
          currentReturn
        }
      }

      // Check additional conditions
      if (conditions && !await this.checkConditions(conditions)) {
        return {
          success: true,
          skipped: true,
          reason: 'Take profit conditions not met'
        }
      }

      // Calculate amount to sell
      const amountToSell = (strategy.currentAmount * sellPercentage) / 100

      // Execute partial or full exit
      const result = await this.executeStrategyExit(strategyId, amountToSell)

      return {
        success: true,
        result,
        amountSold: amountToSell,
        currentReturn,
        message: `Take profit executed: sold ${sellPercentage}% at ${currentReturn.toFixed(2)}% return`
      }
    } catch (error) {
      logger.error('Take profit execution failed:', error)
      throw error
    }
  }

  /**
   * Execute yield harvest
   */
  async executeYieldHarvest(automation) {
    const { strategies, minHarvestAmount } = automation.parameters

    try {
      const results = []
      
      for (const strategyId of strategies) {
        try {
          const harvestResult = await this.harvestYield(strategyId, minHarvestAmount)
          results.push(harvestResult)
        } catch (error) {
          logger.error(`Yield harvest failed for strategy ${strategyId}:`, error)
          results.push({
            strategyId,
            success: false,
            error: error.message
          })
        }
      }

      const totalHarvested = results
        .filter(r => r.success)
        .reduce((sum, r) => sum + (r.amount || 0), 0)

      return {
        success: totalHarvested > 0,
        results,
        totalHarvested,
        message: `Harvested ${totalHarvested} USD from ${results.filter(r => r.success).length} strategies`
      }
    } catch (error) {
      logger.error('Yield harvest execution failed:', error)
      throw error
    }
  }

  /**
   * Handle automation execution failure
   */
  handleExecutionFailure(automation, error) {
    automation.failureCount++
    automation.lastFailure = {
      timestamp: Date.now(),
      error: error.message,
      stack: error.stack
    }

    // If too many failures, pause the automation
    if (automation.failureCount >= this.retryAttempts) {
      automation.status = AUTOMATION_STATUS.FAILED
      logger.warn(`Automation ${automation.id} failed ${this.retryAttempts} times, marking as failed`)
    } else {
      // Retry with exponential backoff
      const delay = this.retryDelay * Math.pow(2, automation.failureCount - 1)
      automation.nextExecution = Date.now() + delay
      logger.warn(`Automation ${automation.id} failed, retrying in ${delay}ms`)
    }

    this.automations.set(automation.id, automation)
    this.persistAutomations()

    secureLogger.audit('AUTOMATION_FAILED', {
      automationId: automation.id,
      type: automation.type,
      failureCount: automation.failureCount,
      error: error.message
    })
  }

  /**
   * Pause automation
   */
  pauseAutomation(automationId) {
    const automation = this.automations.get(automationId)
    if (!automation) {
      throw new Error(`Automation ${automationId} not found`)
    }

    automation.status = AUTOMATION_STATUS.PAUSED
    automation.pausedAt = Date.now()
    
    this.automations.set(automationId, automation)
    this.persistAutomations()

    logger.info(`Automation ${automationId} paused`)
    return automation
  }

  /**
   * Resume automation
   */
  resumeAutomation(automationId) {
    const automation = this.automations.get(automationId)
    if (!automation) {
      throw new Error(`Automation ${automationId} not found`)
    }

    automation.status = AUTOMATION_STATUS.ACTIVE
    automation.resumedAt = Date.now()
    
    // Recalculate next execution
    automation.nextExecution = this.calculateNextExecution(automation.frequency)
    
    this.automations.set(automationId, automation)
    this.persistAutomations()

    logger.info(`Automation ${automationId} resumed`)
    return automation
  }

  /**
   * Cancel automation
   */
  cancelAutomation(automationId) {
    const automation = this.automations.get(automationId)
    if (!automation) {
      throw new Error(`Automation ${automationId} not found`)
    }

    automation.status = AUTOMATION_STATUS.CANCELLED
    automation.cancelledAt = Date.now()
    
    this.automations.set(automationId, automation)
    this.persistAutomations()

    logger.info(`Automation ${automationId} cancelled`)
    return automation
  }

  /**
   * Get all automations
   */
  getAllAutomations() {
    return Array.from(this.automations.values())
  }

  /**
   * Get automations by status
   */
  getAutomationsByStatus(status) {
    return Array.from(this.automations.values())
      .filter(automation => automation.status === status)
  }

  /**
   * Helper methods
   */
  generateAutomationId() {
    return `automation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  validateAutomation(automation) {
    const errors = []

    if (!automation.type) {
      errors.push('Automation type is required')
    }

    if (!Object.values(AUTOMATION_TYPES).includes(automation.type)) {
      errors.push('Invalid automation type')
    }

    if (automation.frequency && !Object.values(FREQUENCY_TYPES).includes(automation.frequency)) {
      errors.push('Invalid frequency')
    }

    if (!automation.parameters) {
      errors.push('Automation parameters are required')
    }

    return {
      valid: errors.length === 0,
      errors
    }
  }

  calculateNextExecution(frequency, fromDate = Date.now()) {
    const date = new Date(fromDate)

    switch (frequency) {
      case FREQUENCY_TYPES.DAILY:
        date.setDate(date.getDate() + 1)
        break
      case FREQUENCY_TYPES.WEEKLY:
        date.setDate(date.getDate() + 7)
        break
      case FREQUENCY_TYPES.BIWEEKLY:
        date.setDate(date.getDate() + 14)
        break
      case FREQUENCY_TYPES.MONTHLY:
        date.setMonth(date.getMonth() + 1)
        break
      case FREQUENCY_TYPES.QUARTERLY:
        date.setMonth(date.getMonth() + 3)
        break
      default:
        throw new Error(`Invalid frequency: ${frequency}`)
    }

    return date.getTime()
  }

  async checkConditions(conditions) {
    // Implement condition checking logic
    // This could include market conditions, balance thresholds, etc.
    return true // Simplified for now
  }

  async getAccountBalance(accountId) {
    // Mock implementation - in production would connect to actual account
    return 10000 // Return mock balance
  }

  async getStrategyConfig(strategyId) {
    // Mock strategy configuration
    return {
      id: strategyId,
      name: `Strategy ${strategyId}`,
      expectedAPY: 8.5,
      protocol: 'compound'
    }
  }

  async getCurrentPortfolio(portfolioId = 'default') {
    // Get current portfolio from DataManager
    const balance = dataManager.getBalance()
    const strategies = dataManager.getActiveStrategies()

    return {
      id: portfolioId,
      totalValue: balance.totalUSD,
      positions: strategies.map(strategy => ({
        asset: 'USDC', // Simplified
        protocol: strategy.protocol || 'compound',
        value: strategy.currentAmount
      }))
    }
  }

  async executeRebalancingAction(action, portfolio) {
    // Mock rebalancing action execution
    return {
      action,
      success: true,
      executedAt: Date.now()
    }
  }

  async executeStrategyExit(strategyId, amount) {
    // Execute partial or full strategy exit
    const currentAmount = dataManager.getActiveStrategies()
      .find(s => s.id === strategyId)?.currentAmount || 0

    if (amount > currentAmount) {
      amount = currentAmount
    }

    // Update strategy balance (negative amount for withdrawal)
    await dataManager.updateStrategyBalance(strategyId, -amount)

    return {
      strategyId,
      amountWithdrawn: amount,
      remainingAmount: currentAmount - amount
    }
  }

  async harvestYield(strategyId, minAmount = 0) {
    // Mock yield harvesting - in production would call actual protocol
    const harvestedAmount = Math.random() * 100 + minAmount

    if (harvestedAmount < minAmount) {
      return {
        strategyId,
        success: false,
        reason: `Harvested amount (${harvestedAmount}) below minimum (${minAmount})`
      }
    }

    return {
      strategyId,
      success: true,
      amount: harvestedAmount,
      harvestedAt: Date.now()
    }
  }

  startProcessor() {
    // Process automations every minute
    this.processInterval = setInterval(() => {
      this.processPendingAutomations().catch(error => {
        logger.error('Automation processor error:', error)
      })
    }, 60000) // 1 minute

    logger.info('Automation processor started')
  }

  stopProcessor() {
    if (this.processInterval) {
      clearInterval(this.processInterval)
      this.processInterval = null
      logger.info('Automation processor stopped')
    }
  }

  loadAutomations() {
    // In production, would load from persistent storage
    logger.info('Automations loaded from storage')
  }

  persistAutomations() {
    // In production, would save to persistent storage
    logger.debug('Automations persisted to storage')
  }
}

// Create singleton instance
export const automationService = new AutomationService()
export default automationService