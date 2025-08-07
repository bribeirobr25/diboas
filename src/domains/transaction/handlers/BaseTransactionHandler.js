/**
 * Base Transaction Handler
 * Abstract base class for all transaction handlers following DDD patterns
 * Implements common transaction processing logic and event emission
 */

import logger from '../../../utils/logger.js'
import { generateSecureId } from '../../../utils/security.js'
import { logSecureEvent } from '../../../utils/securityLogging.js'
import { TransactionCompletedEvent } from '../events/TransactionEvents.js'

export class BaseTransactionHandler {
  constructor(eventBus, integrationManager, walletManager) {
    this._eventBus = eventBus
    this._integrationManager = integrationManager
    this._walletManager = walletManager
    this._handlerType = this.constructor.name.replace('Handler', '').toLowerCase()
  }

  /**
   * Abstract method - must be implemented by subclasses
   */
  async handle(userId, transactionData, routingPlan, fees, options = {}) {
    throw new Error(`handle() method must be implemented by ${this.constructor.name}`)
  }

  /**
   * Validate transaction data specific to this handler type
   */
  async validateTransactionData(transactionData) {
    const { type, amount, asset } = transactionData

    if (!type) {
      throw new Error('Transaction type is required')
    }

    if (!amount || amount <= 0) {
      throw new Error('Amount must be positive')
    }

    // Subclasses can override this for specific validation
    return this._performSpecificValidation(transactionData)
  }

  /**
   * Override in subclasses for specific validation
   */
  async _performSpecificValidation(transactionData) {
    return { isValid: true }
  }

  /**
   * Execute the transaction with comprehensive error handling
   */
  async executeTransaction(userId, transactionData, routingPlan, fees, options = {}) {
    const transactionId = generateSecureId()
    const startTime = Date.now()

    try {
      // Log transaction start
      logSecureEvent('transaction_handler_start', {
        transactionId,
        userId,
        handlerType: this._handlerType,
        type: transactionData.type,
        amount: transactionData.amount
      })

      // Validate transaction data
      const validation = await this.validateTransactionData(transactionData)
      if (!validation.isValid) {
        throw new Error(`Validation failed: ${validation.error}`)
      }

      // Execute the specific handler logic
      const result = await this.handle(userId, transactionData, routingPlan, fees, options)

      // Create transaction record
      const transaction = {
        id: transactionId,
        userId,
        type: transactionData.type,
        status: result.success ? 'completed' : 'failed',
        amount: transactionData.amount,
        fees,
        routing: routingPlan,
        result,
        handlerType: this._handlerType,
        metadata: {
          ...transactionData,
          executedAt: new Date().toISOString(),
          executionTimeMs: Date.now() - startTime,
          userAgent: options.userAgent,
          ipAddress: options.ipAddress
        }
      }

      // Emit domain event
      this._emitTransactionProcessedEvent(transaction)

      // Update wallet balances if successful
      if (result.success) {
        await this._updateWalletBalances(userId, transaction)
      }

      logger.info(`Transaction ${transactionId} processed by ${this._handlerType}`, {
        success: result.success,
        executionTimeMs: Date.now() - startTime
      })

      return {
        success: result.success,
        transactionId,
        transaction,
        result
      }

    } catch (error) {
      logger.error(`Transaction ${transactionId} failed in ${this._handlerType}`, {
        error: error.message,
        userId,
        transactionData
      })

      logSecureEvent('transaction_handler_failed', {
        transactionId,
        userId,
        handlerType: this._handlerType,
        error: error.message
      })

      throw new TransactionHandlerError(
        `${this._handlerType} failed: ${error.message}`, 
        error,
        this._handlerType
      )
    }
  }

  /**
   * Update wallet balances after successful transaction
   */
  async _updateWalletBalances(userId, transaction) {
    await this._walletManager.updateBalances(userId, {
      type: transaction.type,
      amount: transaction.amount,
      netAmount: parseFloat(transaction.amount) - parseFloat(transaction.fees.total || 0),
      fees: transaction.fees,
      paymentMethod: transaction.metadata.paymentMethod,
      fromChain: transaction.routing?.fromChain,
      toChain: transaction.routing?.toChain,
      asset: transaction.metadata.asset
    })
  }

  /**
   * Emit transaction processed domain event
   */
  _emitTransactionProcessedEvent(transaction) {
    const event = new TransactionCompletedEvent({
      transactionId: transaction.id,
      accountId: transaction.userId,
      result: transaction.result
    })

    this._eventBus?.emit(event)
  }

  /**
   * Get supported transaction types for this handler
   */
  static getSupportedTypes() {
    throw new Error(`getSupportedTypes() must be implemented by ${this.name}`)
  }

  /**
   * Get handler priority (lower number = higher priority)
   */
  static getPriority() {
    return 100 // Default priority
  }

  /**
   * Check if this handler can process the given transaction type
   */
  static canHandle(transactionType) {
    return this.getSupportedTypes().includes(transactionType)
  }
}

/**
 * Transaction Handler Error
 */
export class TransactionHandlerError extends Error {
  constructor(message, cause, handlerType) {
    super(message)
    this.name = 'TransactionHandlerError'
    this.cause = cause
    this.handlerType = handlerType
  }
}

export default BaseTransactionHandler