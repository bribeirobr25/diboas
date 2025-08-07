/**
 * Send Transaction Handler (P2P Internal)
 * Handles sending money to other diBoaS users
 * Follows DDD patterns with single responsibility
 */

import { BaseTransactionHandler } from './BaseTransactionHandler.js'
import { P2PSendInitiated, P2PSendCompleted } from '../events/TransactionEvents.js'
import logger from '../../../utils/logger.js'

export class SendTransactionHandler extends BaseTransactionHandler {
  
  /**
   * Handle send transaction (P2P internal)
   */
  async handle(userId, transactionData, routingPlan, fees, options = {}) {
    const { amount, recipient } = transactionData

    try {
      // Emit initiation event
      this._emitP2PSendInitiated(userId, transactionData)

      // Resolve recipient diBoaS username to wallet address
      const recipientAddress = await this._resolveDiBoaSUsername(recipient)
      
      // Execute on-chain transfer
      const result = await this._integrationManager.execute(
        'onchain',
        'sendTransaction',
        {
          fromAddress: routingPlan.fromAddress,
          toAddress: recipientAddress,
          amount,
          asset: 'USDC',
          chain: 'SOL'
        }
      )

      const completionData = {
        success: result.success,
        transactionHash: result.transactionHash || `tx_send_${Date.now()}`,
        recipient,
        amountSent: parseFloat(amount)
      }

      if (result.success) {
        // Emit completion event
        this._emitP2PSendCompleted(userId, completionData)
      }

      return completionData
      
    } catch (error) {
      logger.error('Send transaction failed', {
        userId,
        amount,
        recipient,
        error: error.message
      })

      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Validate send-specific transaction data
   */
  async _performSpecificValidation(transactionData) {
    const { recipient, amount } = transactionData

    // Validate recipient is provided
    if (!recipient) {
      return {
        isValid: false,
        error: 'Recipient is required for send transactions'
      }
    }

    // Validate recipient format (diBoaS username)
    if (!this._isValidDiBoaSUsername(recipient)) {
      return {
        isValid: false,
        error: 'Invalid diBoaS username format'
      }
    }

    // Validate minimum amount
    if (parseFloat(amount) < 5.0) {
      return {
        isValid: false,
        error: 'Minimum send amount is $5.00'
      }
    }

    return { isValid: true }
  }

  /**
   * Resolve diBoaS username to wallet address
   */
  async _resolveDiBoaSUsername(username) {
    // In real implementation, this would query user database
    // For now, mock resolution
    return `sol_address_for_${username.replace('@', '')}`
  }

  /**
   * Validate diBoaS username format
   */
  _isValidDiBoaSUsername(username) {
    return /^@[a-zA-Z0-9_]{3,20}$/.test(username)
  }

  /**
   * Emit P2P send initiated event
   */
  _emitP2PSendInitiated(userId, transactionData) {
    const event = new P2PSendInitiated({
      userId,
      recipient: transactionData.recipient,
      amount: transactionData.amount,
      message: transactionData.message || '',
      asset: 'USDC',
      chain: 'SOL'
    })

    this._eventBus?.emit(event)
  }

  /**
   * Emit P2P send completed event
   */
  _emitP2PSendCompleted(userId, completionData) {
    const event = new P2PSendCompleted({
      userId,
      recipient: completionData.recipient,
      transactionHash: completionData.transactionHash,
      amountSent: completionData.amountSent
    })

    this._eventBus?.emit(event)
  }

  /**
   * Get supported transaction types
   */
  static getSupportedTypes() {
    return ['send']
  }

  /**
   * Get handler priority
   */
  static getPriority() {
    return 20 // Medium priority for transfers
  }
}

export default SendTransactionHandler