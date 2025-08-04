/**
 * Command Bus Implementation for CQRS Pattern
 * Handles command validation, execution, and event generation
 */

import { eventStore, EVENT_TYPES } from '../events/EventStore.js'
import { securityManager, SECURITY_EVENT_TYPES } from '../security/SecurityManager.js'
import { checkTransactionRateLimit } from '../utils/advancedRateLimiter.js'

/**
 * Command types for the application
 */
export const COMMAND_TYPES = {
  // Transaction Commands
  CREATE_TRANSACTION: 'create_transaction',
  PROCESS_TRANSACTION: 'process_transaction',
  CONFIRM_TRANSACTION: 'confirm_transaction',
  CANCEL_TRANSACTION: 'cancel_transaction',
  
  // Balance Commands
  UPDATE_BALANCE: 'update_balance',
  CREDIT_BALANCE: 'credit_balance',
  DEBIT_BALANCE: 'debit_balance',
  
  // Strategy Commands
  CREATE_STRATEGY: 'create_strategy',
  ACTIVATE_STRATEGY: 'activate_strategy',
  PAUSE_STRATEGY: 'pause_strategy',
  COMPLETE_STRATEGY: 'complete_strategy',
  
  // Market Data Commands
  UPDATE_MARKET_DATA: 'update_market_data',
  
  // User Commands
  LOGIN_USER: 'login_user',
  LOGOUT_USER: 'logout_user',
  UPDATE_USER_PREFERENCES: 'update_user_preferences'
}

/**
 * Base Command class
 */
export class Command {
  constructor(type, aggregateId, data, metadata = {}) {
    this.id = this.generateCommandId()
    this.type = type
    this.aggregateId = aggregateId
    this.data = data
    this.metadata = {
      userId: metadata.userId || 'system',
      timestamp: Date.now(),
      correlationId: metadata.correlationId || this.generateCorrelationId(),
      ...metadata
    }
  }

  generateCommandId() {
    return `cmd_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  generateCorrelationId() {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Command Handler interface
 */
export class CommandHandler {
  constructor(commandType) {
    this.commandType = commandType
  }

  /**
   * Validate command before execution
   */
  validate(command) {
    throw new Error('validate() must be implemented by subclass')
  }

  /**
   * Execute the command
   */
  async execute(command) {
    throw new Error('execute() must be implemented by subclass')
  }
}

/**
 * Transaction Command Handlers
 */
export class CreateTransactionHandler extends CommandHandler {
  constructor() {
    super(COMMAND_TYPES.CREATE_TRANSACTION)
  }

  validate(command) {
    const { type, amount, asset, userId } = command.data
    
    // Security validation
    const rateLimitResult = checkTransactionRateLimit(userId, {
      operation: 'create_transaction',
      type,
      amount
    })
    
    if (!rateLimitResult.allowed) {
      throw new Error('Rate limit exceeded for transaction creation')
    }

    // Business validation
    if (!type || !amount || amount <= 0) {
      throw new Error('Invalid transaction data')
    }

    if (type === 'buy' && asset === 'USD') {
      throw new Error('Cannot buy USD')
    }

    return true
  }

  async execute(command) {
    // Generate transaction ID
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Create event
    const event = await eventStore.appendEvent(
      command.aggregateId,
      EVENT_TYPES.TRANSACTION_CREATED,
      {
        transactionId,
        ...command.data,
        userId: command.metadata.userId,
        correlationId: command.metadata.correlationId
      }
    )

    return {
      success: true,
      transactionId,
      eventId: event.id
    }
  }
}

export class UpdateBalanceHandler extends CommandHandler {
  constructor() {
    super(COMMAND_TYPES.UPDATE_BALANCE)
  }

  validate(command) {
    const { balance } = command.data
    
    if (!balance || typeof balance !== 'object') {
      throw new Error('Invalid balance data')
    }

    // Validate balance amounts
    for (const [key, value] of Object.entries(balance)) {
      if (typeof value === 'number' && value < 0) {
        throw new Error(`Negative balance not allowed for ${key}`)
      }
    }

    return true
  }

  async execute(command) {
    const event = await eventStore.appendEvent(
      command.aggregateId,
      EVENT_TYPES.BALANCE_UPDATED,
      {
        balance: command.data.balance,
        userId: command.metadata.userId,
        correlationId: command.metadata.correlationId
      }
    )

    return {
      success: true,
      eventId: event.id
    }
  }
}

export class CreateStrategyHandler extends CommandHandler {
  constructor() {
    super(COMMAND_TYPES.CREATE_STRATEGY)
  }

  validate(command) {
    const { strategyName, amount, riskLevel } = command.data
    
    if (!strategyName || !amount || amount <= 0) {
      throw new Error('Invalid strategy data')
    }

    const validRiskLevels = ['Conservative', 'Moderate', 'Balanced', 'Aggressive']
    if (!validRiskLevels.includes(riskLevel)) {
      throw new Error('Invalid risk level')
    }

    return true
  }

  async execute(command) {
    const strategyId = `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const event = await eventStore.appendEvent(
      command.aggregateId,
      EVENT_TYPES.STRATEGY_CREATED,
      {
        strategyId,
        ...command.data,
        userId: command.metadata.userId,
        correlationId: command.metadata.correlationId
      }
    )

    return {
      success: true,
      strategyId,
      eventId: event.id
    }
  }
}

/**
 * Command Bus - coordinates command handling
 */
export class CommandBus {
  constructor() {
    this.handlers = new Map()
    this.middleware = []
    this.commandHistory = []
    
    this.registerDefaultHandlers()
  }

  /**
   * Register default command handlers
   */
  registerDefaultHandlers() {
    this.register(new CreateTransactionHandler())
    this.register(new UpdateBalanceHandler())
    this.register(new CreateStrategyHandler())
  }

  /**
   * Register a command handler
   */
  register(handler) {
    this.handlers.set(handler.commandType, handler)
  }

  /**
   * Add middleware for command processing
   */
  use(middleware) {
    this.middleware.push(middleware)
  }

  /**
   * Execute a command
   */
  async execute(command) {
    try {
      // Security logging
      securityManager.logSecurityEvent(SECURITY_EVENT_TYPES.FINANCIAL_OPERATION, {
        action: 'command_received',
        commandType: command.type,
        commandId: command.id,
        userId: command.metadata.userId
      })

      // Apply middleware
      for (const middleware of this.middleware) {
        command = await middleware(command)
      }

      // Get handler
      const handler = this.handlers.get(command.type)
      if (!handler) {
        throw new Error(`No handler registered for command type: ${command.type}`)
      }

      // Validate command
      handler.validate(command)

      // Execute command
      const result = await handler.execute(command)

      // Store command in history
      this.commandHistory.push({
        command,
        result,
        timestamp: Date.now(),
        success: true
      })

      // Log success
      securityManager.logSecurityEvent(SECURITY_EVENT_TYPES.FINANCIAL_OPERATION, {
        action: 'command_executed',
        commandType: command.type,
        commandId: command.id,
        success: true
      })

      return result

    } catch (error) {
      // Store failed command in history
      this.commandHistory.push({
        command,
        error: error.message,
        timestamp: Date.now(),
        success: false
      })

      // Log failure
      securityManager.logSecurityEvent(SECURITY_EVENT_TYPES.SECURITY_VIOLATION, {
        action: 'command_failed',
        commandType: command.type,
        commandId: command.id,
        error: error.message,
        severity: 'medium'
      })

      throw error
    }
  }

  /**
   * Get command execution history
   */
  getHistory(limit = 100) {
    return this.commandHistory.slice(-limit)
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const typeStats = this.commandHistory.reduce((stats, entry) => {
      const type = entry.command.type
      if (!stats[type]) {
        stats[type] = { total: 0, success: 0, failed: 0 }
      }
      stats[type].total++
      if (entry.success) {
        stats[type].success++
      } else {
        stats[type].failed++
      }
      return stats
    }, {})

    return {
      totalCommands: this.commandHistory.length,
      registeredHandlers: this.handlers.size,
      activeMiddleware: this.middleware.length,
      typeStatistics: typeStats
    }
  }

  /**
   * Reset command bus (for testing)
   */
  reset() {
    this.commandHistory = []
  }
}

// Global command bus instance
export const commandBus = new CommandBus()

// Convenience functions for creating commands
export const createTransactionCommand = (aggregateId, transactionData, metadata) => 
  new Command(COMMAND_TYPES.CREATE_TRANSACTION, aggregateId, transactionData, metadata)

export const updateBalanceCommand = (aggregateId, balanceData, metadata) => 
  new Command(COMMAND_TYPES.UPDATE_BALANCE, aggregateId, balanceData, metadata)

export const createStrategyCommand = (aggregateId, strategyData, metadata) => 
  new Command(COMMAND_TYPES.CREATE_STRATEGY, aggregateId, strategyData, metadata)