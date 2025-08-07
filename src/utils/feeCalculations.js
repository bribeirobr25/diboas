/**
 * Centralized Fee Calculation System
 * Now uses MockupFeeProviderService for dynamic fee rates
 * Future-ready for real 3rd party provider integration
 */

import logger from './logger'
import { mockupFeeProviderService } from '../services/fees/MockupFeeProviderService.js'

// Legacy FEE_RATES removed - use centralized fee calculator with MockupFeeProviderService

/**
 * Centralized Fee Calculator Class
 * Now uses MockupFeeProviderService for dynamic fee rates
 * Single core algorithm that handles ALL transaction types
 */
export class CentralizedFeeCalculator {
  constructor(feeProviderService = null) {
    this.feeProvider = feeProviderService || mockupFeeProviderService
    // REMOVED: All caching mechanisms per requirements
    // Fee data must always be fetched real-time from service
  }

  /**
   * Load current fee data from provider service - REAL TIME ONLY
   * NO caching, NO fallbacks - always fresh data from service
   * @returns {Promise<Object>} Fresh fee data from provider
   * @throws {Error} If service is unavailable - UI must handle this
   */
  async loadFeeData() {
    try {
      // Always load fresh fee data from provider - NO CACHING
      const feeData = await this.feeProvider.getAllFeeData()
      
      logger.debug('FeeCalculator: Loaded fresh fee data from provider')
      return feeData
    } catch (error) {
      logger.error('FeeCalculator: Failed to load fee data from provider:', error)
      
      // NO FALLBACKS - rethrow error for UI to handle
      throw new Error(`Fee service unavailable: ${error.message}`)
    }
  }

  /**
   * Main fee calculation method - handles ALL transaction types
   * @param {Object} transactionConfig - Transaction configuration
   * @returns {Object} Comprehensive fee breakdown
   */
  async calculateFees(transactionConfig) {
    const { type, amount, asset = 'SOL', paymentMethod = 'diboas_wallet', chains = ['SOL'] } = transactionConfig
    
    // Validate inputs
    this.validateInputs(type, amount, asset, paymentMethod, chains)
    
    // Load REAL-TIME fee data from provider - NO CACHING
    const feeData = await this.loadFeeData()
    
    const numericAmount = parseFloat(amount)
    
    // Calculate individual fee components using core algorithm and dynamic fee data
    const primaryChain = chains[0] || asset
    const fees = {
      diBoaSFee: this._calculateDiBoaSFee(numericAmount, type, feeData),
      networkFee: this._calculateNetworkFee(numericAmount, asset, chains, feeData),
      providerFee: this._calculateProviderFee(numericAmount, type, paymentMethod, feeData),
      dexFee: this._calculateDexFee(numericAmount, type, paymentMethod, chains, asset, feeData),
      defiFee: this._calculateDefiFee(numericAmount, type, primaryChain, feeData)
    }
    
    // Apply minimum fee rules (only for diBoaS fees)
    fees.diBoaSFee = Math.max(fees.diBoaSFee, feeData.minimums.diboas)
    
    // Calculate total fees - SINGLE SOURCE OF TRUTH
    const total = fees.diBoaSFee + fees.networkFee + fees.providerFee + fees.dexFee + fees.defiFee
    
    // Return only .total property - NO LEGACY PROPERTIES
    const result = {
      diBoaS: fees.diBoaSFee,
      network: fees.networkFee,
      provider: fees.providerFee,
      dex: fees.dexFee,
      defi: fees.defiFee,
      total: total,
      // Detailed breakdown
      breakdown: {
        diBoaS: { amount: fees.diBoaSFee, rate: feeData.diboas[type] || 0 },
        network: { amount: fees.networkFee, rate: feeData.network[primaryChain] || feeData.network[asset] || 0 },
        provider: { 
          amount: fees.providerFee, 
          rate: this.getProviderRate(type, paymentMethod, feeData) 
        },
        dex: { 
          amount: fees.dexFee, 
          rate: this._getDexFeeRate(type, paymentMethod, chains, asset, feeData)
        },
        defi: { amount: fees.defiFee, rate: feeData.defi[primaryChain] || 0 }
      }
    }
    
    return result
  }

  /**
   * Core fee calculation algorithm - used by all fee types
   * @param {number} amount - Transaction amount
   * @param {number} rate - Fee rate (as decimal)
   * @returns {number} Calculated fee
   */
  calculateCoreFee(amount, rate) {
    if (!amount || amount <= 0 || !rate) return 0
    return parseFloat(amount) * rate
  }

  /**
   * Calculate diBoaS fee using core algorithm (internal method)
   * @param {number} amount - Transaction amount
   * @param {string} type - Transaction type
   * @param {Object} feeData - Dynamic fee data from provider
   * @returns {number} diBoaS fee
   */
  _calculateDiBoaSFee(amount, type, feeData) {
    const rate = feeData.diboas[type] || 0
    return this.calculateCoreFee(amount, rate)
  }

  /**
   * Calculate network fee using core algorithm (internal method)
   * @param {number} amount - Transaction amount
   * @param {string} asset - Asset type
   * @param {Array} chains - Chain array
   * @param {Object} feeData - Dynamic fee data from provider
   * @returns {number} Network fee
   */
  _calculateNetworkFee(amount, asset, chains, feeData) {
    // Use primary chain for network fee calculation
    const primaryChain = chains[0] || asset
    const rate = feeData.network[primaryChain] || feeData.network[asset] || 0
    return this.calculateCoreFee(amount, rate)
  }

  /**
   * Calculate payment provider fee using core algorithm (internal method)
   * @param {number} amount - Transaction amount
   * @param {string} type - Transaction type
   * @param {string} paymentMethod - Payment method
   * @param {Object} feeData - Dynamic fee data from provider
   * @returns {number} Provider fee
   */
  _calculateProviderFee(amount, type, paymentMethod, feeData) {
    // Strategy transactions: Only diBoaS wallet allowed, no provider fees
    if (['start_strategy', 'stop_strategy'].includes(type)) {
      return 0 // Strategies only use diBoaS wallet
    }
    
    // diBoaS wallet has no provider fees for other transactions
    if (paymentMethod === 'diboas_wallet') return 0
    
    const rate = this.getProviderRate(type, paymentMethod, feeData)
    return this.calculateCoreFee(amount, rate)
  }

  /**
   * Calculate DEX fee using core algorithm (internal method)
   * @param {number} amount - Transaction amount
   * @param {string} type - Transaction type
   * @param {string} paymentMethod - Payment method
   * @param {Array} chains - Chain array for external wallet detection
   * @param {string} asset - Asset type (e.g., 'BTC', 'ETH', 'SOL')
   * @param {Object} feeData - Dynamic fee data from provider
   * @returns {number} DEX fee
   */
  _calculateDexFee(amount, type, paymentMethod, chains = ['SOL'], asset = 'SOL', feeData) {
    const primaryChain = chains[0] || asset
    
    // Determine DEX fee rate based on chain per TRANSACTIONS.md
    const getDexRate = (chain) => {
      return chain === 'SOL' ? feeData.dex.solana : feeData.dex.standard
    }
    
    // Send transactions have NO DEX fees - only diBoaS + network fees
    if (type === 'send') {
      return 0
    }
    
    // Buy transactions - only apply DEX fees when using diboas_wallet
    if (type === 'buy') {
      // No DEX fee for external payment methods (on-ramp)
      if (paymentMethod !== 'diboas_wallet') {
        return 0
      }
      // Apply chain-specific DEX fee when buying with existing balance
      const rate = getDexRate(primaryChain)
      return this.calculateCoreFee(amount, rate)
    }
    
    // Sell transactions - apply chain-specific DEX fees
    if (type === 'sell') {
      const rate = getDexRate(asset)
      return this.calculateCoreFee(amount, rate)
    }
    
    
    // Withdraw transactions - DEX fee for external wallets only
    if (type === 'withdraw') {
      // Off-ramp withdrawals (bank, card, paypal) - NO DEX fee
      if (paymentMethod !== 'external_wallet' && paymentMethod !== 'diboas_wallet') {
        return 0 // No DEX fee for off-ramp transactions
      }
      
      // External wallet withdrawals - chain-specific DEX fee
      if (paymentMethod === 'external_wallet' || paymentMethod === 'diboas_wallet') {
        const rate = getDexRate(primaryChain)
        return this.calculateCoreFee(amount, rate)
      }
    }
    
    // Strategy transactions should NOT have DEX fees - they use DeFi fees instead
    if (['start_strategy', 'stop_strategy'].includes(type)) {
      return 0 // Strategies use DeFi fees, not DEX fees
    }
    
    return 0
  }

  /**
   * Calculate DeFi protocol fee using core algorithm (internal method)
   * @param {number} amount - Transaction amount
   * @param {string} type - Transaction type
   * @param {string} chain - Primary chain for strategy transactions
   * @param {Object} feeData - Dynamic fee data from provider
   * @returns {number} DeFi fee
   */
  _calculateDefiFee(amount, type, chain = 'SOL', feeData) {
    // Strategy transactions use chain-specific DeFi fees per TRANSACTIONS.md
    if (['start_strategy', 'stop_strategy'].includes(type)) {
      const rate = feeData.defi[chain] || feeData.defi.SOL
      return this.calculateCoreFee(amount, rate)
    }
    
    // Other transaction types don't use DeFi fees
    return 0
  }

  /**
   * Get DEX fee rate for breakdown display
   * @param {string} type - Transaction type
   * @param {string} paymentMethod - Payment method
   * @param {Array} chains - Chain array
   * @param {string} asset - Asset type
   * @param {Object} feeData - Dynamic fee data from provider
   * @returns {number} DEX fee rate
   */
  _getDexFeeRate(type, paymentMethod, chains = ['SOL'], asset = 'SOL', feeData) {
    const primaryChain = chains[0] || asset
    
    // Strategy transactions should NOT have DEX fees
    if (['start_strategy', 'stop_strategy'].includes(type)) {
      return 0 // Strategies use DeFi fees, not DEX fees
    }
    
    // Determine rate based on chain per TRANSACTIONS.md
    const getDexRate = (chain) => {
      return chain === 'SOL' ? feeData.dex.solana : feeData.dex.standard
    }
    
    // Send transactions have no DEX fees
    if (type === 'send') {
      return 0
    }
    
    // Buy transactions - only with diboas_wallet
    if (type === 'buy') {
      if (paymentMethod !== 'diboas_wallet') {
        return 0
      }
      return getDexRate(primaryChain)
    }
    
    // Sell transactions - chain-specific DEX fees
    if (type === 'sell') {
      return getDexRate(asset)
    }
    
    
    // Withdraw transactions
    if (type === 'withdraw') {
      // Off-ramp withdrawals - no DEX fee
      if (paymentMethod !== 'external_wallet' && paymentMethod !== 'diboas_wallet') {
        return 0
      }
      
      // External wallet withdrawals - chain-specific DEX fee
      return getDexRate(primaryChain)
    }
    
    return 0
  }

  /**
   * Get provider fee rate based on transaction type and payment method
   * @param {string} type - Transaction type
   * @param {string} paymentMethod - Payment method
   * @param {Object} feeData - Dynamic fee data from provider
   * @returns {number} Provider fee rate
   */
  getProviderRate(type, paymentMethod, feeData) {
    if (paymentMethod === 'diboas_wallet') return 0
    
    // Determine direction (onramp vs offramp)
    const direction = ['add', 'buy'].includes(type) ? 'onramp' : 'offramp'
    
    return feeData.provider[direction][paymentMethod] || 0
  }

  /**
   * Input validation
   * @param {string} type - Transaction type
   * @param {number} amount - Transaction amount
   * @param {string} asset - Asset type
   * @param {string} paymentMethod - Payment method
   * @param {Array} chains - Chains array
   */
  validateInputs(type, amount, asset, paymentMethod, chains) {
    if (!type) {
      throw new Error('Transaction type is required')
    }
    if (!amount || amount <= 0) {
      throw new Error('Amount must be positive')
    }
    if (!chains || !Array.isArray(chains) || chains.length === 0) {
      throw new Error('Chains array is required')
    }
  }

  // REMOVED: All cache management per requirements
  // No caching allowed - always real-time data

  // REMOVED: All synchronous versions per requirements
  // Fee calculation must always be async and real-time

  /**
   * Legacy method compatibility - calculateComprehensiveFees
   * Maintains backward compatibility with existing code
   */
  async calculateComprehensiveFees(params) {
    // Handle both object and individual parameter calls for backward compatibility
    let type, amount, chains, paymentMethod, asset
    
    if (typeof params === 'object' && params !== null) {
      ({ type, amount, chains, paymentMethod = 'diboas_wallet', asset = 'SOL' } = params)
    } else {
      // Legacy individual parameter support
      type = arguments[0]
      amount = arguments[1]
      chains = arguments[2] || ['SOL']
      paymentMethod = arguments[3] || 'diboas_wallet'
      asset = arguments[4] || 'SOL'
    }

    return await this.calculateFees({ type, amount, asset, paymentMethod, chains })
  }

  /**
   * Legacy method compatibility - calculateDiBoaSFee
   * @deprecated Use calculateFees() instead
   */
  calculateDiBoaSFee(type, amount) {
    throw new Error('Deprecated method: Use calculateFees() instead')
  }

  /**
   * Legacy method compatibility - calculateNetworkFee
   * @deprecated Use calculateFees() instead
   */
  calculateNetworkFee(chain, amount) {
    throw new Error('Deprecated method: Use calculateFees() instead')
  }

  // Additional utility methods for specific use cases
  
  /**
   * Get all fee rates for a specific transaction type
   * @deprecated Use calculateFees() instead
   */
  getFeeRatesForTransaction(type) {
    throw new Error('Deprecated method: Use calculateFees() instead')
  }

  /**
   * Calculate quick estimate for UI display
   * @deprecated Use calculateFees() instead  
   */
  getQuickEstimate(type, amount) {
    throw new Error('Deprecated method: Use calculateFees() instead')
  }

  /**
   * Compare fees across different payment methods
   */
  compareFeeOptions(transactionConfig, paymentMethods) {
    const results = []
    
    for (const paymentMethod of paymentMethods) {
      const config = { ...transactionConfig, paymentMethod }
      const fees = this.calculateFees(config)
      
      results.push({
        paymentMethod,
        total: fees.total,
        breakdown: fees.breakdown
      })
    }
    
    // Sort by total fees (lowest first)
    return results.sort((a, b) => a.total - b.total)
  }

  /**
   * Get real-time fees (same as calculateFees for now, can be enhanced later)
   */
  async getRealTimeFees(transactionConfig) {
    return this.calculateFees(transactionConfig)
  }

  /**
   * Clear cache - for testing and cache management
   */
  clearCache() {
    this.cache.clear()
  }

  /**
   * Legacy compatibility - calculateProviderFee
   */
  calculateProviderFee(amount, type, paymentMethod) {
    return this._calculateProviderFee(amount, type, paymentMethod)
  }

  /**
   * Legacy compatibility - calculateTransactionFees
   * Maps old transaction data format to new format
   */
  async calculateTransactionFees(transactionData, routingPlan = null) {
    try {
      // Extract required fields from transaction data
      const { type, amount, paymentMethod = 'diboas_wallet', asset = 'SOL', chains = ['SOL'] } = transactionData
      
      // Handle routing plan if provided (for cross-chain transactions)
      const targetChains = routingPlan?.targetChains || chains
      
      // Calculate fees using new method
      const fees = this.calculateFees({
        type,
        amount,
        paymentMethod,
        asset,
        chains: targetChains
      })
      
      // Return only .total property - NO LEGACY PROPERTIES
      return {
        ...fees,
        // Clean field mappings - single source of truth
        diboas: fees.diBoaS,
        platformFee: fees.diBoaS,
        networkFee: fees.network,
        providerFee: fees.provider,
        dexFee: fees.dex,
        defiFee: fees.defi
      }
    } catch (error) {
      logger.error('Error calculating transaction fees:', error)
      throw new Error('Fee calculation failed')
    }
  }

  /**
   * Synchronous version of calculateTransactionFees for testing
   */
  calculateTransactionFeesSync(transactionData, routingPlan = null) {
    // Extract required fields from transaction data
    const { type, amount, paymentMethod = 'diboas_wallet', asset = 'SOL', chains = ['SOL'] } = transactionData
    
    // Handle routing plan if provided (for cross-chain transactions)
    const targetChains = routingPlan?.targetChains || chains
    
    // Calculate fees using new method
    const fees = this.calculateFees({
      type,
      amount,
      paymentMethod,
      asset,
      chains: targetChains
    })
    
    // Return only .total property - NO LEGACY PROPERTIES  
    return {
      ...fees,
      // Clean field mappings - single source of truth
      diboas: fees.diBoaS,
      platformFee: fees.diBoaS,
      networkFee: fees.network,
      providerFee: fees.provider,
      dexFee: fees.dex,
      defiFee: fees.defi
    }
  }
}

// Export singleton instance for use throughout the application
export const centralizedFeeCalculator = new CentralizedFeeCalculator()

// Maintain backward compatibility
export const defaultFeeCalculator = centralizedFeeCalculator

// REMOVED: No pre-loading per requirements
// Fee data must always be loaded on-demand in real-time

// Legacy export for existing code
export const FeeCalculator = CentralizedFeeCalculator

// Legacy export removed - use centralizedFeeCalculator