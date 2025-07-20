/**
 * On-Chain Provider Registry
 * Manages blockchain transaction providers
 */

import { BaseProviderRegistry } from '../BaseProviderRegistry.js'

export class OnChainProviderRegistry extends BaseProviderRegistry {
  constructor() {
    super('onchain')
  }

  /**
   * Send on-chain transaction
   */
  async sendTransaction(transactionData, options = {}) {
    return await this.executeWithFallback('sendTransaction', { transactionData, ...options })
  }

  /**
   * Get transaction status
   */
  async getTransactionStatus(transactionHash, options = {}) {
    return await this.executeWithFallback('getTransactionStatus', { transactionHash, ...options })
  }

  /**
   * Get account balance
   */
  async getBalance(address, chain, options = {}) {
    return await this.executeWithFallback('getBalance', { address, chain, ...options })
  }

  /**
   * Get transaction history
   */
  async getTransactionHistory(address, chain, options = {}) {
    return await this.executeWithFallback('getTransactionHistory', { address, chain, ...options })
  }

  /**
   * Estimate transaction fees
   */
  async estimateFees(transactionData, options = {}) {
    return await this.executeWithFallback('estimateFees', { transactionData, ...options })
  }

  /**
   * Get current gas prices
   */
  async getGasPrices(chain, options = {}) {
    return await this.executeWithFallback('getGasPrices', { chain, ...options })
  }

  /**
   * Validate address
   */
  async validateAddress(address, chain, options = {}) {
    return await this.executeWithFallback('validateAddress', { address, chain, ...options })
  }

  /**
   * Get network status
   */
  async getNetworkStatus(chain, options = {}) {
    return await this.executeWithFallback('getNetworkStatus', { chain, ...options })
  }
}

export default OnChainProviderRegistry