/**
 * Wallet Provider Registry
 * Manages wallet creation and connection providers
 */

import { BaseProviderRegistry } from '../BaseProviderRegistry.js'

export class WalletProviderRegistry extends BaseProviderRegistry {
  constructor() {
    super('wallet')
  }

  /**
   * Create a new wallet
   */
  async createWallet(walletType, options = {}) {
    return await this.executeWithFallback('createWallet', { walletType, ...options })
  }

  /**
   * Connect to existing wallet
   */
  async connectWallet(walletType, credentials, options = {}) {
    return await this.executeWithFallback('connectWallet', { walletType, credentials, ...options })
  }

  /**
   * Get wallet balance
   */
  async getBalance(walletId, options = {}) {
    return await this.executeWithFallback('getBalance', { walletId, ...options })
  }

  /**
   * Sign transaction
   */
  async signTransaction(walletId, transaction, options = {}) {
    return await this.executeWithFallback('signTransaction', { walletId, transaction, ...options })
  }

  /**
   * Send transaction
   */
  async sendTransaction(walletId, transaction, options = {}) {
    return await this.executeWithFallback('sendTransaction', { walletId, transaction, ...options })
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(walletId, options = {}) {
    return await this.executeWithFallback('getTransactionHistory', { walletId, ...options })
  }

  /**
   * Disconnect wallet
   */
  async disconnectWallet(walletId, options = {}) {
    return await this.executeWithFallback('disconnectWallet', { walletId, ...options })
  }
}

export default WalletProviderRegistry