/**
 * Withdraw Transaction Handler (Off-Ramp)
 * Handles withdrawing money from the platform to external accounts
 * Follows DDD patterns with single responsibility
 */

import { BaseTransactionHandler } from './BaseTransactionHandler.js'
import { OffRampInitiated, OffRampCompleted } from '../events/TransactionEvents.js'
import logger from '../../../utils/logger.js'

export class WithdrawTransactionHandler extends BaseTransactionHandler {
  
  /**
   * Handle withdraw transaction (off-ramp)
   */
  async handle(userId, transactionData, routingPlan, fees, options = {}) {
    const { amount, paymentMethod, destination } = transactionData

    try {
      // Handle external wallet withdrawal differently
      if (paymentMethod === 'external_wallet') {
        return await this._handleExternalWalletWithdrawal(userId, transactionData, routingPlan, fees)
      }

      // Emit initiation event
      this._emitOffRampInitiated(userId, transactionData)

      // Check KYC requirement for off-ramp withdrawals
      const kycStatus = await this._checkKYCStatus(userId)
      if (!kycStatus.verified) {
        // Trigger KYC process
        await this._triggerKYC(userId, transactionData)
        throw new Error('KYC verification required for withdrawal')
      }

      // Execute withdrawal via payment integration
      const result = await this._integrationManager.execute(
        'payment',
        'processWithdrawal',
        {
          amount,
          currency: 'USD',
          destination,
          metadata: {
            userId,
            type: 'offramp',
            sourceChain: 'SOL'
          }
        }
      )

      if (result.success) {
        const completionData = {
          success: true,
          transactionHash: `tx_offramp_${Date.now()}`,
          providerTransactionId: result.result.id,
          amountSent: parseFloat(amount)
        }

        // Emit completion event
        this._emitOffRampCompleted(userId, completionData)

        return completionData
      }

      throw new Error('Off-ramp provider failed')
      
    } catch (error) {
      logger.error('Withdraw transaction failed', {
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
   * Handle external wallet withdrawal (crypto transfer)
   */
  async _handleExternalWalletWithdrawal(userId, transactionData, routingPlan, fees) {
    const { amount, recipient } = transactionData

    try {
      // Execute routing if needed
      if (routingPlan.needsRouting) {
        const routingOption = {
          fromChain: routingPlan.fromChain,
          fromAsset: routingPlan.fromAsset,
          toChain: routingPlan.toChain,
          toAsset: routingPlan.toAsset,
          fromAmount: parseFloat(amount)
        }

        await this._walletManager.executeRouting(userId, routingOption)
      }

      // Execute external transfer
      const result = await this._integrationManager.execute(
        'onchain',
        'sendTransaction',
        {
          toAddress: recipient,
          amount,
          asset: 'USDC',
          chain: routingPlan.toChain
        }
      )

      return {
        success: result.success,
        transactionHash: result.transactionHash || `tx_external_withdraw_${Date.now()}`,
        recipient,
        chain: routingPlan.toChain,
        amountSent: parseFloat(amount)
      }
      
    } catch (error) {
      logger.error('External wallet withdrawal failed', {
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
   * Validate withdraw-specific transaction data
   */
  async _performSpecificValidation(transactionData) {
    const { paymentMethod, amount, destination, recipient } = transactionData

    // Validate minimum amount
    if (parseFloat(amount) < 5.0) {
      return {
        isValid: false,
        error: 'Minimum withdrawal amount is $5.00'
      }
    }

    // External wallet validation
    if (paymentMethod === 'external_wallet') {
      if (!recipient) {
        return {
          isValid: false,
          error: 'Wallet address is required for external wallet withdrawal'
        }
      }
      
      if (!this._isValidWalletAddress(recipient)) {
        return {
          isValid: false,
          error: 'Invalid wallet address'
        }
      }
    } else {
      // Traditional off-ramp validation
      const validMethods = ['bank_account', 'paypal', 'debit_card']
      
      if (!validMethods.includes(paymentMethod)) {
        return {
          isValid: false,
          error: `Invalid withdrawal method: ${paymentMethod}`
        }
      }

      if (!destination) {
        return {
          isValid: false,
          error: 'Destination account is required'
        }
      }
    }

    return { isValid: true }
  }

  /**
   * Check KYC status for user
   */
  async _checkKYCStatus(userId) {
    try {
      const result = await this._integrationManager.execute(
        'kyc',
        'checkStatus',
        { userId }
      )
      return result.success ? result.result : { verified: false }
    } catch {
      return { verified: false }
    }
  }

  /**
   * Trigger KYC verification
   */
  async _triggerKYC(userId, transactionData) {
    try {
      await this._integrationManager.execute(
        'kyc',
        'startVerification',
        {
          userId,
          trigger: 'withdrawal',
          amount: transactionData.amount
        }
      )
    } catch (error) {
      logger.warn('Failed to trigger KYC:', error.message)
    }
  }

  /**
   * Validate wallet address format
   */
  _isValidWalletAddress(address) {
    if (!address || typeof address !== 'string') return false
    
    // Bitcoin patterns
    if (/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/.test(address)) return true
    if (/^bc1[a-z0-9]{39,59}$/.test(address)) return true
    
    // Ethereum pattern
    if (/^0x[a-fA-F0-9]{40}$/.test(address)) return true
    
    // Solana pattern
    if (/^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(address)) return true
    
    // Sui pattern
    if (/^0x[a-fA-F0-9]{62,}$/.test(address)) return true
    
    return false
  }

  /**
   * Emit off-ramp initiated event
   */
  _emitOffRampInitiated(userId, transactionData) {
    const event = new OffRampInitiated({
      userId,
      amount: transactionData.amount,
      destination: transactionData.destination,
      paymentMethod: transactionData.paymentMethod,
      sourceChain: 'SOL',
      sourceAsset: 'USDC'
    })

    this._eventBus?.emit(event)
  }

  /**
   * Emit off-ramp completed event
   */
  _emitOffRampCompleted(userId, completionData) {
    const event = new OffRampCompleted({
      userId,
      amountSent: completionData.amountSent,
      providerTransactionId: completionData.providerTransactionId,
      transactionHash: completionData.transactionHash
    })

    this._eventBus?.emit(event)
  }

  /**
   * Get supported transaction types
   */
  static getSupportedTypes() {
    return ['withdraw']
  }

  /**
   * Get handler priority
   */
  static getPriority() {
    return 15 // High priority for cash-out operations
  }
}

export default WithdrawTransactionHandler