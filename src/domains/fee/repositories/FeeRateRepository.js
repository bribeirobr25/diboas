/**
 * Fee Rate Repository
 * Abstracts fee rate persistence and retrieval
 * Part of DDD infrastructure layer
 */

import { Repository } from '../../shared/Repository.js'
import logger from '../../../utils/logger.js'

export class FeeRateRepository extends Repository {
  constructor(storage) {
    super()
    this._storage = storage
    this._cacheKey = 'fee-rates'
    this._cacheTTL = 5 * 60 * 1000 // 5 minutes
  }

  /**
   * Get current fee rates
   */
  async getFeeRates() {
    try {
      // Try cache first
      const cached = this._storage.get(this._cacheKey)
      if (cached && this._isValidCache(cached)) {
        logger.debug('Fee rates retrieved from cache')
        return cached.data
      }

      // If no valid cache, return default rates
      logger.debug('Using default fee rates (no cache available)')
      return this._getDefaultFeeRates()
      
    } catch (error) {
      logger.error('Failed to get fee rates', error)
      throw new Error('Fee rate retrieval failed')
    }
  }

  /**
   * Save fee rates to cache
   */
  async saveFeeRates(feeRates) {
    try {
      const cacheData = {
        data: feeRates,
        timestamp: Date.now(),
        ttl: this._cacheTTL
      }
      
      this._storage.set(this._cacheKey, cacheData)
      logger.debug('Fee rates saved to cache')
      
    } catch (error) {
      logger.error('Failed to save fee rates', error)
      // Don't throw - this is not critical
    }
  }

  /**
   * Clear cached fee rates
   */
  async clearFeeRates() {
    try {
      this._storage.delete(this._cacheKey)
      logger.debug('Fee rates cache cleared')
    } catch (error) {
      logger.error('Failed to clear fee rates cache', error)
    }
  }

  /**
   * Check if cache is valid
   */
  _isValidCache(cached) {
    if (!cached || !cached.timestamp || !cached.ttl) {
      return false
    }
    
    const age = Date.now() - cached.timestamp
    return age < cached.ttl
  }

  /**
   * Get default fee rates when none are available
   */
  _getDefaultFeeRates() {
    return {
      diboas: {
        add: 0.005,      // 0.5%
        withdraw: 0.005, // 0.5%
        send: 0.002,     // 0.2%
        buy: 0.005,      // 0.5%
        sell: 0.005,     // 0.5%
        start_strategy: 0.001, // 0.1%
        stop_strategy: 0.001   // 0.1%
      },
      network: {
        SOL: 0.000025,   // Very low for Solana
        ETH: 0.003,      // Higher for Ethereum
        BTC: 0.0005,     // Moderate for Bitcoin
        SUI: 0.00005     // Low for Sui
      },
      provider: {
        onramp: {
          credit_debit_card: 0.029,  // 2.9%
          bank_account: 0.01,        // 1%
          apple_pay: 0.025,          // 2.5%
          google_pay: 0.025,         // 2.5%
          paypal: 0.029              // 2.9%
        },
        offramp: {
          bank_account: 0.01,        // 1%
          paypal: 0.025              // 2.5%
        }
      },
      dex: {
        solana: 0.002,     // 0.2% for Solana DEXs
        standard: 0.003    // 0.3% for other DEXs
      },
      defi: {
        SOL: 0.001,        // 0.1% for Solana DeFi
        ETH: 0.002,        // 0.2% for Ethereum DeFi
        BTC: 0.0015,       // 0.15% for Bitcoin DeFi
        SUI: 0.001         // 0.1% for Sui DeFi
      },
      minimums: {
        diboas: 0.01,      // $0.01 minimum platform fee
        network: 0.001,    // $0.001 minimum network fee
        provider: 0.05     // $0.05 minimum provider fee
      },
      maximums: {
        diboas: 100,       // $100 maximum platform fee
        network: 10,       // $10 maximum network fee
        provider: 500      // $500 maximum provider fee
      }
    }
  }

  /**
   * Get fee rate history for analytics
   */
  async getFeeRateHistory(fromDate, toDate) {
    // In a real implementation, this would query historical data
    // For now, return empty array as we don't have historical storage
    return []
  }

  /**
   * Update specific fee rate
   */
  async updateFeeRate(category, type, rate) {
    try {
      const currentRates = await this.getFeeRates()
      
      if (!currentRates[category]) {
        throw new Error(`Invalid fee category: ${category}`)
      }
      
      currentRates[category][type] = rate
      await this.saveFeeRates(currentRates)
      
      logger.info(`Fee rate updated: ${category}.${type} = ${rate}`)
      
    } catch (error) {
      logger.error('Failed to update fee rate', error)
      throw error
    }
  }

  /**
   * Get fee rates for specific transaction type
   */
  async getFeeRatesForTransaction(transactionType) {
    const allRates = await this.getFeeRates()
    
    return {
      platform: allRates.diboas[transactionType] || 0,
      network: allRates.network,
      provider: allRates.provider,
      dex: allRates.dex,
      defi: allRates.defi,
      minimums: allRates.minimums,
      maximums: allRates.maximums
    }
  }
}

export default FeeRateRepository