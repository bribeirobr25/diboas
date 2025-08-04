/**
 * On-Chain Transaction Manager
 * Handles transaction execution with on-chain confirmation gating
 * Ensures funds are only updated after blockchain confirmation
 */

import { mockOnChainStatusProvider, TRANSACTION_STATUS } from '../onchain/OnChainStatusProvider.js'
import dataManager from '../DataManager.js'
import { generateSecureTransactionId } from '../../utils/secureRandom.js'
import { logSecureEvent } from '../../utils/securityLogging.js'
import logger from '../../utils/logger'

/**
 * Enhanced transaction execution with on-chain confirmation gating
 */
export class OnChainTransactionManager {
  constructor() {
    this.pendingTransactions = new Map()
    this.dataManager = null
    this.onChainProvider = mockOnChainStatusProvider
  }

  /**
   * Initialize the transaction manager
   */
  async initialize() {
    this.dataManager = dataManager
    return { success: true }
  }

  /**
   * Execute transaction with on-chain confirmation gating
   * @param {Object} transactionData - Transaction details
   * @returns {Promise<Object>} Transaction execution result
   */
  async executeTransaction(transactionData) {
    const { type, amount, recipient, asset, paymentMethod, userId } = transactionData
    
    // Generate secure transaction ID
    const transactionId = generateSecureTransactionId('tx')
    
    // Log transaction initiation
    await logSecureEvent('TRANSACTION_INITIATED', userId, {
      transactionId,
      type,
      amount,
      asset,
      paymentMethod: paymentMethod ? this.maskPaymentMethod(paymentMethod) : null
    })

    try {
      // Step 1: Create pending transaction record
      const pendingTransaction = {
        id: transactionId,
        type,
        amount: parseFloat(amount),
        recipient,
        asset,
        paymentMethod,
        userId,
        fees: transactionData.fees, // IMPORTANT: Store the fees in the transaction
        status: 'pending_submission',
        createdAt: new Date().toISOString(),
        chain: this.determineChain(type, asset, recipient),
        balanceUpdateApplied: false
      }

      this.pendingTransactions.set(transactionId, pendingTransaction)

      // Step 2: Submit to blockchain (mockup)
      const submissionResult = await this.onChainProvider.submitTransaction({
        id: transactionId,
        type,
        amount,
        chain: pendingTransaction.chain,
        recipient,
        asset
      })

      if (!submissionResult.success) {
        // Submission failed - transaction never made it to blockchain
        pendingTransaction.status = 'failed'
        pendingTransaction.error = submissionResult.error
        pendingTransaction.failedAt = new Date().toISOString()

        await logSecureEvent('TRANSACTION_SUBMISSION_FAILED', userId, {
          transactionId,
          error: submissionResult.error
        })

        return {
          success: false,
          transactionId,
          error: submissionResult.error,
          status: 'failed'
        }
      }

      // Step 3: Update pending transaction with blockchain details
      pendingTransaction.txHash = submissionResult.txHash
      pendingTransaction.explorerLink = submissionResult.explorerLink
      pendingTransaction.status = 'pending_confirmation'
      pendingTransaction.submittedAt = new Date().toISOString()

      await logSecureEvent('TRANSACTION_SUBMITTED', userId, {
        transactionId,
        txHash: submissionResult.txHash,
        explorerLink: submissionResult.explorerLink
      })

      // Add to transaction history with pending status
      await this.addToTransactionHistory(pendingTransaction)

      // Step 4: Start monitoring for confirmation
      logger.debug('🔄 Starting confirmation monitoring for transaction:', transactionId)
      this.startConfirmationMonitoring(transactionId)

      return {
        success: true,
        transactionId,
        txHash: submissionResult.txHash,
        explorerLink: submissionResult.explorerLink,
        status: 'pending_confirmation',
        estimatedConfirmationTime: submissionResult.estimatedConfirmationTime
      }

    } catch (error) {
      // Handle unexpected errors
      const pendingTx = this.pendingTransactions.get(transactionId)
      if (pendingTx) {
        pendingTx.status = 'failed'
        pendingTx.error = error.message
        pendingTx.failedAt = new Date().toISOString()
      }

      await logSecureEvent('TRANSACTION_ERROR', userId, {
        transactionId,
        error: error.message
      })

      return {
        success: false,
        transactionId,
        error: error.message,
        status: 'failed'
      }
    }
  }

  /**
   * Start monitoring transaction for confirmation
   * @param {string} transactionId - Transaction ID to monitor
   */
  startConfirmationMonitoring(transactionId) {
    logger.debug('🎯 Starting confirmation monitoring for:', transactionId)
    
    const pollForConfirmation = async () => {
      const pendingTx = this.pendingTransactions.get(transactionId)
      if (!pendingTx) {
        logger.debug('⚠️ Transaction not found in pending transactions:', transactionId)
        return // Transaction was cleaned up
      }

      try {
        const onChainStatus = this.onChainProvider.getTransactionStatus(transactionId)
        
        logger.debug('📊 On-chain status check:', {
          transactionId,
          status: onChainStatus?.status,
          confirmations: onChainStatus?.confirmations,
          hasStatus: !!onChainStatus
        })
        
        if (!onChainStatus) {
          // No status yet, continue polling
          logger.debug('⏳ No on-chain status yet, continuing to poll in 2s')
          setTimeout(pollForConfirmation, 2000)
          return
        }

        // Update transaction status
        pendingTx.onChainStatus = onChainStatus.status
        pendingTx.confirmations = onChainStatus.confirmations
        pendingTx.lastUpdated = new Date().toISOString()

        if (onChainStatus.status === TRANSACTION_STATUS.CONFIRMED) {
          // SUCCESS: Transaction confirmed on blockchain
          logger.debug('🎉 Transaction confirmed, processing completion:', transactionId)
          await this.handleTransactionConfirmed(transactionId)
        } else if (onChainStatus.status === TRANSACTION_STATUS.FAILED) {
          // FAILURE: Transaction failed on blockchain
          logger.debug('❌ Transaction failed on blockchain:', transactionId)
          await this.handleTransactionFailed(transactionId, onChainStatus.error)
        } else {
          // Still pending/confirming, continue polling
          logger.debug('🔄 Transaction still pending/confirming, continuing to poll:', onChainStatus.status)
          setTimeout(pollForConfirmation, 2000)
        }

      } catch (error) {
        logger.error('💥 Error monitoring transaction confirmation:', error)
        setTimeout(pollForConfirmation, 2000) // Continue polling despite error
      }
    }

    // Start polling after initial delay
    logger.debug('⏰ Setting initial polling timer for transaction:', transactionId)
    setTimeout(pollForConfirmation, 1000)
  }

  /**
   * Handle successful transaction confirmation
   * @param {string} transactionId - Transaction ID
   */
  async handleTransactionConfirmed(transactionId) {
    const pendingTx = this.pendingTransactions.get(transactionId)
    if (!pendingTx) return

    try {
      // CRITICAL: Only update balances AFTER on-chain confirmation
      await this.updateUserBalances(pendingTx)
      
      // Update transaction status to confirmed
      pendingTx.status = 'confirmed'
      pendingTx.confirmedAt = new Date().toISOString()
      pendingTx.balanceUpdateApplied = true
      
      // Update transaction in history with confirmed status
      await this.dataManager.updateTransaction(transactionId, {
        status: 'confirmed',
        confirmedAt: pendingTx.confirmedAt,
        onChainStatus: 'confirmed',
        balanceUpdateApplied: true
      })

      await logSecureEvent('TRANSACTION_CONFIRMED', pendingTx.userId, {
        transactionId,
        txHash: pendingTx.txHash,
        explorerLink: pendingTx.explorerLink,
        balanceUpdateApplied: true
      })

      // Emit event for UI updates
      this.dataManager.emit('transaction:confirmed', {
        transactionId,
        transaction: pendingTx
      })

      // Clean up after 5 minutes
      setTimeout(() => {
        this.pendingTransactions.delete(transactionId)
      }, 300000)

    } catch (error) {
      logger.error('Error handling transaction confirmation:', error)
      
      // If balance update fails after confirmation, this is critical
      await logSecureEvent('TRANSACTION_BALANCE_UPDATE_FAILED', pendingTx.userId, {
        transactionId,
        error: error.message,
        critical: true
      })
    }
  }

  /**
   * Handle failed transaction
   * @param {string} transactionId - Transaction ID
   * @param {string} error - Error message
   */
  async handleTransactionFailed(transactionId, error) {
    const pendingTx = this.pendingTransactions.get(transactionId)
    if (!pendingTx) return

    try {
      // IMPORTANT: Do NOT update balances for failed transactions
      pendingTx.status = 'failed'
      pendingTx.failedAt = new Date().toISOString()
      pendingTx.error = error || 'Transaction failed on blockchain'
      pendingTx.balanceUpdateApplied = false // Explicitly mark as no balance update

      // Update transaction in history with failed status
      await this.dataManager.updateTransaction(transactionId, {
        status: 'failed',
        failedAt: pendingTx.failedAt,
        error: pendingTx.error,
        onChainStatus: 'failed',
        balanceUpdateApplied: false
      })

      await logSecureEvent('TRANSACTION_FAILED', pendingTx.userId, {
        transactionId,
        txHash: pendingTx.txHash,
        explorerLink: pendingTx.explorerLink,
        error: pendingTx.error,
        fundsAffected: false
      })

      // Emit event for UI updates
      this.dataManager.emit('transaction:failed', {
        transactionId,
        transaction: pendingTx,
        error: pendingTx.error
      })

      // Clean up after 5 minutes
      setTimeout(() => {
        this.pendingTransactions.delete(transactionId)
      }, 300000)

    } catch (error) {
      logger.error('Error handling transaction failure:', error)
    }
  }

  /**
   * Update user balances after confirmed transaction
   * @param {Object} transaction - Transaction details
   */
  async updateUserBalances(transaction) {
    const { type, amount, asset, userId } = transaction

    try {
      // Update balance in data manager - this method handles all the balance calculations
      await this.dataManager.updateBalance({
        type: transaction.type,
        amount: transaction.amount,
        fees: transaction.fees || { total: 0 },
        asset: transaction.asset,
        paymentMethod: transaction.paymentMethod
      })

      // Get updated balance for logging
      const updatedState = this.dataManager.getState()
      const updatedBalance = updatedState.balance || {}

      await logSecureEvent('BALANCE_UPDATED', userId, {
        transactionId: transaction.id,
        transactionType: type,
        amount,
        newBalance: {
          available: updatedBalance.availableForSpending || 0,
          invested: updatedBalance.investedAmount || 0,
          total: updatedBalance.totalUSD || 0
        }
      })

    } catch (error) {
      logger.error('Error updating user balances:', error)
      throw error
    }
  }

  /**
   * Add transaction to history with explorer link
   * @param {Object} transaction - Transaction details
   */
  async addToTransactionHistory(transaction) {
    try {
      const historyEntry = {
        id: transaction.id,
        type: transaction.type,
        amount: transaction.amount,
        currency: 'USD',
        status: transaction.status,
        description: this.generateTransactionDescription(transaction),
        recipient: transaction.recipient,
        asset: transaction.asset,
        paymentMethod: transaction.paymentMethod,
        fees: transaction.fees || {},
        createdAt: transaction.createdAt,
        submittedAt: transaction.submittedAt,
        confirmedAt: transaction.confirmedAt || undefined,
        failedAt: transaction.failedAt || undefined,
        // On-chain specific fields
        txHash: transaction.txHash,
        explorerLink: transaction.explorerLink,
        chain: transaction.chain,
        onChainStatus: transaction.onChainStatus,
        error: transaction.error || undefined
      }

      // Add to transaction history
      await this.dataManager.addTransaction(historyEntry)

      await logSecureEvent('TRANSACTION_ADDED_TO_HISTORY', transaction.userId, {
        transactionId: transaction.id,
        status: transaction.status,
        explorerLink: transaction.explorerLink
      })

    } catch (error) {
      logger.error('Error adding transaction to history:', error)
      throw error
    }
  }

  /**
   * Generate human-readable transaction description
   * @param {Object} transaction - Transaction details
   * @returns {string} Transaction description
   */
  generateTransactionDescription(transaction) {
    const { type, amount, asset, recipient, paymentMethod, status } = transaction

    const statusText = status === 'failed' ? ' (Failed)' : ''
    
    switch (type) {
      case 'add':
        return `Deposit $${amount.toFixed(2)} via ${this.formatPaymentMethod(paymentMethod)}${statusText}`
      case 'withdraw':
        return `Withdraw $${amount.toFixed(2)} to ${this.formatPaymentMethod(paymentMethod)}${statusText}`
      case 'send':
        return `Send $${amount.toFixed(2)} to ${recipient}${statusText}`
      case 'transfer':
        return `Transfer $${amount.toFixed(2)} to external wallet${statusText}`
      case 'buy':
        return `Buy $${amount.toFixed(2)} ${asset}${statusText}`
      case 'sell':
        return `Sell $${amount.toFixed(2)} ${asset}${statusText}`
      default:
        return `${type} transaction for $${amount.toFixed(2)}${statusText}`
    }
  }

  /**
   * Determine blockchain for transaction
   * @param {string} type - Transaction type
   * @param {string} asset - Asset type
   * @param {string} recipient - Recipient address
   * @returns {string} Chain identifier
   */
  determineChain(type, asset, recipient) {
    // For buy/sell, use asset's native chain
    if (['buy', 'sell'].includes(type) && asset) {
      const assetChainMap = {
        'BTC': 'BTC',
        'ETH': 'ETH', 
        'SOL': 'SOL',
        'SUI': 'SUI'
      }
      return assetChainMap[asset] || 'SOL'
    }
    
    // For transfers, detect chain from recipient address
    if (type === 'transfer' && recipient) {
      if (recipient.match(/^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/) || recipient.match(/^bc1[a-z0-9]{39,59}$/)) {
        return 'BTC'
      }
      if (recipient.match(/^0x[a-fA-F0-9]{40}$/)) {
        return 'ETH'
      }
      if (recipient.match(/^0x[a-fA-F0-9]{64}$/)) {
        return 'SUI'
      }
      if (recipient.match(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/)) {
        return 'SOL'
      }
    }
    
    // Default to Solana for most operations
    return 'SOL'
  }

  /**
   * Format payment method for display
   * @param {string} paymentMethod - Payment method ID
   * @returns {string} Formatted payment method name
   */
  formatPaymentMethod(paymentMethod) {
    const methodMap = {
      'credit_debit_card': 'Credit/Debit Card',
      'bank_account': 'Bank Account',
      'apple_pay': 'Apple Pay',
      'google_pay': 'Google Pay',
      'paypal': 'PayPal',
      'diboas_wallet': 'diBoaS Wallet'
    }
    return methodMap[paymentMethod] || paymentMethod
  }

  /**
   * Mask payment method for logging
   * @param {string} paymentMethod - Payment method
   * @returns {string} Masked payment method
   */
  maskPaymentMethod(paymentMethod) {
    // For security logging, don't reveal specific payment details
    return paymentMethod ? 'external_payment' : 'unknown'
  }

  /**
   * Get transaction status
   * @param {string} transactionId - Transaction ID
   * @returns {Object|null} Transaction status
   */
  getTransactionStatus(transactionId) {
    const pendingTx = this.pendingTransactions.get(transactionId)
    if (!pendingTx) return null

    const onChainStatus = this.onChainProvider.getTransactionStatus(transactionId)
    
    return {
      ...pendingTx,
      onChainStatus: onChainStatus?.status,
      confirmations: onChainStatus?.confirmations,
      explorerLink: onChainStatus?.explorerLink
    }
  }

  /**
   * Get all pending transactions for a user
   * @param {string} userId - User ID
   * @returns {Array} Pending transactions
   */
  getPendingTransactions(userId) {
    const userTransactions = []
    
    for (const [id, tx] of this.pendingTransactions) {
      if (tx.userId === userId) {
        const onChainStatus = this.onChainProvider.getTransactionStatus(id)
        userTransactions.push({
          ...tx,
          onChainStatus: onChainStatus?.status,
          confirmations: onChainStatus?.confirmations
        })
      }
    }
    
    return userTransactions
  }
}

// Export singleton instance
export const onChainTransactionManager = new OnChainTransactionManager()
export default onChainTransactionManager