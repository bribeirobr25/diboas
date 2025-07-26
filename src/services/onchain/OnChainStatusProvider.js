/**
 * On-Chain Transaction Status Provider
 * Handles blockchain transaction confirmation and status tracking
 */

/**
 * Explorer link templates for different chains
 */
const EXPLORER_LINKS = {
  BTC: {
    account: 'https://mempool.space/address/bc1q8ys49pxp3c6um7enemwdkl4ud5fwwg2rpdegxu',
    transaction: 'https://mempool.space/tx/bd2e7c74f5701c96673b16ecdc33d01d3e93574c81e869e715a78ff4698a556a'
  },
  ETH: {
    account: 'https://etherscan.io/address/0xac893c187843a775c74de8a7dd4cf749e5a4e262',
    transaction: 'https://etherscan.io/tx/0x2b21b80353ab6011a9b5df21db0a68755c2b787290e6250fdb4f8512d173f1e1'
  },
  SOL: {
    account: 'https://solscan.io/account/EgecX8HBapUxRW3otU4ES55WuygDDPSMMFSTCwfP57XR',
    transaction: 'https://solscan.io/tx/3pW7WADA8ysmwgMngGgu9RYdXpSvNeLRM7ftbsDV52doC91Gcc7mrtkteCu6HPjnWu9HTV9mKo43PshbRUe4AgmP'
  },
  SUI: {
    account: 'https://suivision.xyz/account/0x7c3e1ad62f0ac85e1227cb7b3dfa123c03c8191f9c3fbac9548ded485c52e169?tab=Activity',
    transaction: 'https://suivision.xyz/txblock/7r3zvFqvZNUavgXRVSp1uyaAoJvYCgP7CBSMZKRDyzQW'
  }
}

/**
 * Transaction status constants
 */
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  CONFIRMING: 'confirming', 
  CONFIRMED: 'confirmed',
  FAILED: 'failed',
  TIMEOUT: 'timeout'
}

/**
 * Chain-specific confirmation requirements
 */
const CONFIRMATION_REQUIREMENTS = {
  BTC: { required: 1, timeout: 30000 }, // 30 seconds for demo
  ETH: { required: 12, timeout: 15000 }, // 15 seconds
  SOL: { required: 1, timeout: 5000 }, // 5 seconds
  SUI: { required: 1, timeout: 8000 } // 8 seconds
}

/**
 * Mock On-Chain Status Provider
 * Simulates real blockchain interactions with realistic timing and error rates
 */
export class MockOnChainStatusProvider {
  constructor() {
    this.pendingTransactions = new Map()
    this.errorRate = 0.05 // 5% error rate similar to auth operations
    this.name = 'MockOnChainStatusProvider'
  }

  /**
   * Submit transaction to blockchain (mockup)
   * @param {Object} transactionData - Transaction details
   * @returns {Promise<Object>} Transaction submission result
   */
  async submitTransaction(transactionData) {
    const { id, type, amount, chain = 'SOL', recipient, asset } = transactionData
    
    // Generate mock transaction hash
    const txHash = this.generateMockTxHash(chain)
    
    // Simulate network delay
    await this.simulateNetworkDelay(100, 500)
    
    // Random failure simulation (5% error rate)
    if (Math.random() < this.errorRate) {
      return {
        success: false,
        error: 'Network error: Failed to broadcast transaction',
        txHash: null,
        status: TRANSACTION_STATUS.FAILED
      }
    }
    
    // Create pending transaction record
    const pendingTx = {
      id,
      txHash,
      chain,
      type,
      amount,
      recipient,
      asset,
      status: TRANSACTION_STATUS.PENDING,
      submittedAt: new Date().toISOString(),
      confirmations: 0,
      requiredConfirmations: CONFIRMATION_REQUIREMENTS[chain].required,
      explorerLink: this.generateExplorerLink(chain, 'transaction', txHash)
    }
    
    this.pendingTransactions.set(id, pendingTx)
    
    // Start confirmation process
    this.startConfirmationProcess(id)
    
    return {
      success: true,
      txHash,
      status: TRANSACTION_STATUS.PENDING,
      explorerLink: pendingTx.explorerLink,
      estimatedConfirmationTime: CONFIRMATION_REQUIREMENTS[chain].timeout
    }
  }

  /**
   * Get current transaction status
   * @param {string} transactionId - Transaction ID
   * @returns {Object|null} Current transaction status
   */
  getTransactionStatus(transactionId) {
    const tx = this.pendingTransactions.get(transactionId)
    if (!tx) return null
    
    return {
      id: tx.id,
      txHash: tx.txHash,
      chain: tx.chain,
      status: tx.status,
      confirmations: tx.confirmations,
      requiredConfirmations: tx.requiredConfirmations,
      explorerLink: tx.explorerLink,
      submittedAt: tx.submittedAt,
      confirmedAt: tx.confirmedAt,
      failedAt: tx.failedAt,
      error: tx.error
    }
  }

  /**
   * Start the confirmation process for a transaction
   * @param {string} transactionId - Transaction ID
   */
  async startConfirmationProcess(transactionId) {
    const tx = this.pendingTransactions.get(transactionId)
    if (!tx) return
    
    const { chain, timeout } = CONFIRMATION_REQUIREMENTS[tx.chain]
    
    // Update status to confirming
    tx.status = TRANSACTION_STATUS.CONFIRMING
    
    // Chain-specific timing based on documentation
    let confirmationDelay
    if (chain === 'BTC') {
      confirmationDelay = 5000 // 5 seconds for BTC per docs
    } else {
      confirmationDelay = 2000 // 2 seconds for all other assets per docs
    }
    
    // Wait for confirmation delay
    await this.simulateNetworkDelay(confirmationDelay, confirmationDelay + 1000)
    
    // Check if transaction still exists (might have been cleaned up)
    const currentTx = this.pendingTransactions.get(transactionId)
    if (!currentTx) return
    
    // Random failure during confirmation (lower rate: 3%)
    if (Math.random() < 0.03) {
      currentTx.status = TRANSACTION_STATUS.FAILED
      currentTx.failedAt = new Date().toISOString()
      currentTx.error = 'Transaction failed during confirmation: Insufficient gas fees'
      return
    }
    
    // Successfully confirmed
    currentTx.status = TRANSACTION_STATUS.CONFIRMED
    currentTx.confirmations = currentTx.requiredConfirmations
    currentTx.confirmedAt = new Date().toISOString()
    
    // Clean up after 5 minutes to prevent memory leaks
    setTimeout(() => {
      this.pendingTransactions.delete(transactionId)
    }, 300000)
  }

  /**
   * Generate mock transaction hash
   * @param {string} chain - Blockchain identifier
   * @returns {string} Mock transaction hash
   */
  generateMockTxHash(chain) {
    const timestamp = Date.now().toString(36)
    const random = Math.random().toString(36).substring(2, 8)
    
    switch (chain) {
      case 'BTC':
        // Bitcoin transaction hash format (64 hex characters)
        return `${timestamp}${random}${'a'.repeat(64 - timestamp.length - random.length)}`
      case 'ETH':
        // Ethereum transaction hash format (0x + 64 hex characters)
        return `0x${timestamp}${random}${'b'.repeat(64 - timestamp.length - random.length)}`
      case 'SOL':
        // Solana transaction signature format (Base58, ~88 characters)
        return `${timestamp}${random}SOL${'c'.repeat(85 - timestamp.length - random.length)}`
      case 'SUI':
        // Sui transaction digest format (Base58, ~44 characters)
        return `${timestamp}${random}SUI${'d'.repeat(40 - timestamp.length - random.length)}`
      default:
        return `${timestamp}${random}UNKNOWN`
    }
  }

  /**
   * Generate explorer link for account or transaction
   * @param {string} chain - Blockchain identifier
   * @param {string} type - 'account' or 'transaction'
   * @param {string} identifier - Account address or transaction hash
   * @returns {string} Explorer URL
   */
  generateExplorerLink(chain, type = 'transaction', identifier = null) {
    const chainLinks = EXPLORER_LINKS[chain]
    if (!chainLinks) return '#'
    
    // For mockup, always return the template links
    // In real implementation, this would use the actual identifier
    return chainLinks[type] || chainLinks.transaction
  }

  /**
   * Get account explorer link
   * @param {string} chain - Blockchain identifier  
   * @param {string} address - Wallet address
   * @returns {string} Account explorer URL
   */
  getAccountExplorerLink(chain, address) {
    return this.generateExplorerLink(chain, 'account', address)
  }

  /**
   * Simulate network delay
   * @param {number} min - Minimum delay in ms
   * @param {number} max - Maximum delay in ms
   */
  async simulateNetworkDelay(min = 100, max = 1000) {
    const delay = Math.floor(Math.random() * (max - min + 1)) + min
    return new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check for the provider
   * @returns {Promise<Object>} Health status
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(50, 200)
      return {
        success: true,
        status: 'healthy',
        service: 'mock_onchain_status',
        timestamp: new Date().toISOString(),
        pendingTransactions: this.pendingTransactions.size
      }
    } catch (error) {
      return {
        success: false,
        status: 'unhealthy',
        error: error.message,
        timestamp: new Date().toISOString()
      }
    }
  }

  /**
   * Get transaction history with explorer links
   * @param {string} userId - User identifier
   * @param {number} limit - Number of transactions to return
   * @returns {Array} Transaction history with explorer links
   */
  async getTransactionHistory(userId, limit = 50) {
    // This would integrate with your existing transaction history
    // For now, return empty array as this will be handled by DataManager
    return []
  }

  /**
   * Cancel pending transaction (if possible)
   * @param {string} transactionId - Transaction ID
   * @returns {Promise<Object>} Cancellation result
   */
  async cancelTransaction(transactionId) {
    const tx = this.pendingTransactions.get(transactionId)
    if (!tx) {
      return {
        success: false,
        error: 'Transaction not found'
      }
    }
    
    if (tx.status === TRANSACTION_STATUS.CONFIRMED) {
      return {
        success: false,
        error: 'Cannot cancel confirmed transaction'
      }
    }
    
    // Simulate cancellation attempt
    await this.simulateNetworkDelay(500, 1500)
    
    // 70% chance of successful cancellation if still pending
    if (tx.status === TRANSACTION_STATUS.PENDING && Math.random() < 0.7) {
      tx.status = TRANSACTION_STATUS.FAILED
      tx.failedAt = new Date().toISOString()
      tx.error = 'Transaction cancelled by user'
      
      return {
        success: true,
        message: 'Transaction cancelled successfully'
      }
    }
    
    return {
      success: false,
      error: 'Transaction too far in confirmation process to cancel'
    }
  }
}

// Export singleton instance
export const mockOnChainStatusProvider = new MockOnChainStatusProvider()
export default mockOnChainStatusProvider