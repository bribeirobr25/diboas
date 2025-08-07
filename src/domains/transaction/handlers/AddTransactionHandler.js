/**
 * Add Transaction Handler (On-Ramp)
 * Handles adding money to the platform via payment processors
 * Follows DDD patterns with single responsibility
 */

import { BaseTransactionHandler } from './BaseTransactionHandler.js'
import { OnRampInitiated, OnRampCompleted } from '../events/TransactionEvents.js'
import logger from '../../../utils/logger.js'

export class AddTransactionHandler extends BaseTransactionHandler {
  
  /**
   * Handle add transaction (on-ramp)
   */
  async handle(userId, transactionData, routingPlan, fees, options = {}) {
    const { amount, paymentMethod } = transactionData

    try {
      // Emit initiation event
      this._emitOnRampInitiated(userId, transactionData)

      // Execute payment via integration
      const result = await this._integrationManager.execute(
        'payment',
        'processPayment',
        {
          amount,
          currency: 'USD',
          paymentMethod,
          metadata: {
            userId,
            type: 'onramp',
            targetChain: 'SOL'
          }
        }
      )

      if (result.success) {
        // Simulate wallet funding delay
        await new Promise(resolve => setTimeout(resolve, 2000))
        
        const completionData = {
          success: true,
          transactionHash: `tx_onramp_${Date.now()}`,
          providerTransactionId: result.result.id,
          amountReceived: parseFloat(amount) - (fees.total || 0)
        }

        // Emit completion event
        this._emitOnRampCompleted(userId, completionData)

        return completionData
      }

      throw new Error('On-ramp provider failed')
      
    } catch (error) {
      logger.error('Add transaction failed', {
        userId,
        amount,
        paymentMethod,
        error: error.message
      })

      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Validate add-specific transaction data
   */
  async _performSpecificValidation(transactionData) {
    const { paymentMethod, amount } = transactionData

    // Validate payment method
    const validPaymentMethods = [
      'credit_debit_card',
      'bank_account', 
      'apple_pay',
      'google_pay'
    ]

    if (!validPaymentMethods.includes(paymentMethod)) {
      return {
        isValid: false,
        error: `Invalid payment method: ${paymentMethod}`
      }
    }

    // Validate minimum amount
    if (parseFloat(amount) < 10.0) {
      return {
        isValid: false,
        error: 'Minimum add amount is $10.00'
      }
    }

    return { isValid: true }
  }

  /**
   * Emit on-ramp initiated event
   */
  _emitOnRampInitiated(userId, transactionData) {
    const event = new OnRampInitiated({
      userId,
      amount: transactionData.amount,
      paymentMethod: transactionData.paymentMethod,
      targetChain: 'SOL',
      targetAsset: 'USDC'
    })

    this._eventBus?.emit(event)
  }

  /**
   * Emit on-ramp completed event
   */
  _emitOnRampCompleted(userId, completionData) {
    const event = new OnRampCompleted({
      userId,
      amountReceived: completionData.amountReceived,
      providerTransactionId: completionData.providerTransactionId,
      transactionHash: completionData.transactionHash
    })

    this._eventBus?.emit(event)
  }

  /**
   * Get supported transaction types
   */
  static getSupportedTypes() {
    return ['add']
  }

  /**
   * Get handler priority
   */
  static getPriority() {
    return 10 // High priority for funding operations
  }
}

export default AddTransactionHandler