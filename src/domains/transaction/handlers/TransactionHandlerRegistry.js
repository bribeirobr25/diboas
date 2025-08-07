/**
 * Transaction Handler Registry
 * Centralized registry for all transaction handlers following DDD patterns
 * Implements handler discovery, routing, and lifecycle management
 */

import logger from '../../../utils/logger.js'
import { AddTransactionHandler } from './AddTransactionHandler.js'
import { SendTransactionHandler } from './SendTransactionHandler.js'
import { WithdrawTransactionHandler } from './WithdrawTransactionHandler.js'
import { BuyTransactionHandler } from './BuyTransactionHandler.js'

export class TransactionHandlerRegistry {
  constructor(eventBus, integrationManager, walletManager) {
    this._eventBus = eventBus
    this._integrationManager = integrationManager
    this._walletManager = walletManager
    this._handlers = new Map()
    this._handlerClasses = []
    
    this._registerDefaultHandlers()
  }

  /**
   * Register default transaction handlers
   */
  _registerDefaultHandlers() {
    const handlerClasses = [
      AddTransactionHandler,
      SendTransactionHandler,
      WithdrawTransactionHandler,
      BuyTransactionHandler
    ]

    for (const HandlerClass of handlerClasses) {
      this.registerHandler(HandlerClass)
    }
  }

  /**
   * Register a transaction handler class
   */
  registerHandler(HandlerClass) {
    if (!HandlerClass.getSupportedTypes || !HandlerClass.getPriority) {
      throw new Error(`Handler ${HandlerClass.name} must implement getSupportedTypes() and getPriority()`)
    }

    const supportedTypes = HandlerClass.getSupportedTypes()
    const priority = HandlerClass.getPriority()

    for (const type of supportedTypes) {
      if (!this._handlers.has(type)) {
        this._handlers.set(type, [])
      }

      // Add handler with priority-based sorting
      const handlers = this._handlers.get(type)
      handlers.push({ HandlerClass, priority })
      handlers.sort((a, b) => a.priority - b.priority)
    }

    this._handlerClasses.push(HandlerClass)
    
    logger.info(`Registered transaction handler: ${HandlerClass.name}`, {
      supportedTypes,
      priority
    })
  }

  /**
   * Get the appropriate handler for a transaction type
   */
  getHandler(transactionType) {
    const handlers = this._handlers.get(transactionType)
    
    if (!handlers || handlers.length === 0) {
      throw new Error(`No handler registered for transaction type: ${transactionType}`)
    }

    // Return highest priority handler (lowest number = highest priority)
    const { HandlerClass } = handlers[0]
    
    // Create handler instance with dependencies
    return new HandlerClass(
      this._eventBus,
      this._integrationManager,
      this._walletManager
    )
  }

  /**
   * Check if a transaction type is supported
   */
  isSupported(transactionType) {
    return this._handlers.has(transactionType)
  }

  /**
   * Get all supported transaction types
   */
  getSupportedTypes() {
    return Array.from(this._handlers.keys())
  }

  /**
   * Get handler statistics
   */
  getStats() {
    const stats = {
      totalHandlers: this._handlerClasses.length,
      supportedTypes: this.getSupportedTypes(),
      handlersByType: {}
    }

    for (const [type, handlers] of this._handlers) {
      stats.handlersByType[type] = {
        count: handlers.length,
        primary: handlers[0].HandlerClass.name,
        alternates: handlers.slice(1).map(h => h.HandlerClass.name)
      }
    }

    return stats
  }

  /**
   * Execute a transaction with the appropriate handler
   */
  async executeTransaction(userId, transactionData, routingPlan, fees, options = {}) {
    const { type } = transactionData

    try {
      // Get appropriate handler
      const handler = this.getHandler(type)
      
      logger.info(`Executing ${type} transaction with ${handler.constructor.name}`, {
        userId,
        amount: transactionData.amount
      })

      // Execute transaction
      const result = await handler.executeTransaction(
        userId, 
        transactionData, 
        routingPlan, 
        fees, 
        options
      )

      logger.info(`Transaction ${result.transactionId} executed successfully`, {
        handlerType: handler.constructor.name,
        success: result.success
      })

      return result

    } catch (error) {
      logger.error(`Transaction execution failed for type: ${type}`, {
        error: error.message,
        userId,
        transactionData
      })

      throw new TransactionRegistryError(
        `Failed to execute ${type} transaction: ${error.message}`,
        error,
        type
      )
    }
  }

  /**
   * Execute transaction with retry mechanism
   */
  async executeTransactionWithRetry(userId, transactionData, routingPlan, fees, options = {}) {
    const { maxRetries = 3 } = options
    let lastError

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.executeTransaction(userId, transactionData, routingPlan, fees, options)
      } catch (error) {
        lastError = error
        
        if (attempt < maxRetries && this._isRetryableError(error)) {
          const delay = 1000 * attempt // Exponential backoff
          logger.warn(`Transaction attempt ${attempt} failed, retrying in ${delay}ms`, {
            error: error.message,
            attempt,
            maxRetries
          })
          
          await new Promise(resolve => setTimeout(resolve, delay))
          continue
        }
        
        throw error
      }
    }

    throw lastError
  }

  /**
   * Check if an error is retryable
   */
  _isRetryableError(error) {
    const retryablePatterns = [
      'Temporary network error',
      'Rate limit exceeded',
      'Service unavailable',
      'Connection timeout'
    ]

    return retryablePatterns.some(pattern => 
      error.message.toLowerCase().includes(pattern.toLowerCase())
    )
  }

  /**
   * Validate handler registration
   */
  _validateHandler(HandlerClass) {
    const requiredMethods = ['handle', 'getSupportedTypes', 'getPriority']
    
    for (const method of requiredMethods) {
      if (typeof HandlerClass.prototype[method] !== 'function' && 
          typeof HandlerClass[method] !== 'function') {
        throw new Error(`Handler ${HandlerClass.name} must implement ${method}()`)
      }
    }

    return true
  }

  /**
   * Health check for all registered handlers
   */
  async healthCheck() {
    const results = {
      healthy: true,
      handlers: {},
      timestamp: new Date().toISOString()
    }

    for (const HandlerClass of this._handlerClasses) {
      try {
        // Basic validation
        this._validateHandler(HandlerClass)
        
        results.handlers[HandlerClass.name] = {
          status: 'healthy',
          supportedTypes: HandlerClass.getSupportedTypes(),
          priority: HandlerClass.getPriority()
        }
      } catch (error) {
        results.healthy = false
        results.handlers[HandlerClass.name] = {
          status: 'unhealthy',
          error: error.message
        }
      }
    }

    return results
  }
}

/**
 * Transaction Registry Error
 */
export class TransactionRegistryError extends Error {
  constructor(message, cause, transactionType) {
    super(message)
    this.name = 'TransactionRegistryError'
    this.cause = cause
    this.transactionType = transactionType
  }
}

export default TransactionHandlerRegistry