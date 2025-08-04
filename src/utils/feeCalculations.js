/**
 * Centralized Fee Calculation System
 * Single source of truth for all fee calculations as per TRANSACTIONS.md
 */

import logger from './logger'

/**
 * Centralized Fee Rates Configuration - SINGLE SOURCE OF TRUTH
 * All rates match TRANSACTIONS.md specifications exactly
 */
export const FEE_RATES = {
  // diBoaS fees (Section 4.2 of TRANSACTIONS.md)
  DIBOAS: {
    add: 0.0009,           // 0.09%
    withdraw: 0.009,       // 0.9%
    send: 0.0009,          // 0.09%
    transfer: 0.009,       // 0.9%
    buy: 0.0009,           // 0.09%
    sell: 0.0009,          // 0.09%
    invest: 0.0009,        // 0.09%
    start_strategy: 0.0009, // 0.09% - FinObjective DeFi start
    stop_strategy: 0.0009   // 0.09% - FinObjective DeFi stop
  },
  
  // Network fees (Section 4.1 of TRANSACTIONS.md) - NO MINIMUMS
  NETWORK: {
    BTC: 0.09,    // 9%
    ETH: 0.005,   // 0.5% (ETH L2)
    SOL: 0.00001, // 0.001%
    SUI: 0.00003  // 0.003%
  },
  
  // Payment Provider fees (Section 4.3 of TRANSACTIONS.md)
  PAYMENT_PROVIDER: {
    // On-Ramp (Add/Deposit) fees
    onramp: {
      apple_pay: 0.005,        // 0.5%
      google_pay: 0.005,       // 0.5%
      credit_debit_card: 0.01, // 1%
      bank_account: 0.01,      // 1%
      paypal: 0.03             // 3%
    },
    // Off-Ramp (Withdraw) fees
    offramp: {
      apple_pay: 0.01,         // 1%
      google_pay: 0.01,        // 1%
      credit_debit_card: 0.02, // 2%
      bank_account: 0.02,      // 2%
      paypal: 0.04             // 4%
    }
  },
  
  // DEX fees (Section 4.3 of TRANSACTIONS.md)
  DEX: {
    buy: 0.002,          // 0.2% for Buy transactions
    sell: 0.002,         // 0.2% for Sell transactions
    transfer: 0.008,     // 0.8% for Transfer transactions (not using SOLANA wallets)
    withdraw: 0.005,     // 0.5% for Withdraw transactions (like external wallet transactions)
    start_strategy: 0.005, // 0.5% for Launch Strategy transactions
    stop_strategy: 0.005   // 0.5% for Stop Strategy transactions
  },
  
  // DeFi fees (Section 4.3 of TRANSACTIONS.md) - Not used for strategies
  DEFI: {
    start_strategy: 0,   // 0% - Strategies use DEX fees instead
    stop_strategy: 0     // 0% - Strategies use DEX fees instead
  },
  
  // Minimum fees (Section 4.1 of TRANSACTIONS.md)
  MINIMUMS: {
    network: 0,   // NO minimums for network fees
    provider: 0,  // NO minimums for provider fees
    diboas: 0.01  // diBoaS minimum (business requirement)
  }
}

/**
 * Centralized Fee Calculator Class
 * Single core algorithm that handles ALL transaction types
 */
export class CentralizedFeeCalculator {
  constructor() {
    this.cache = new Map()
    this.CACHE_DURATION = 60000 // 1 minute
  }

  /**
   * Main fee calculation method - handles ALL transaction types
   * @param {Object} transactionConfig - Transaction configuration
   * @returns {Object} Comprehensive fee breakdown
   */
  calculateFees(transactionConfig) {
    const { type, amount, asset = 'SOL', paymentMethod = 'diboas_wallet', chains = ['SOL'] } = transactionConfig
    
    // Validate inputs
    this.validateInputs(type, amount, asset, paymentMethod, chains)
    
    // Create cache key
    const cacheKey = JSON.stringify({ type, amount, asset, paymentMethod, chains })
    const cached = this.getFromCache(cacheKey)
    if (cached) return cached
    
    const numericAmount = parseFloat(amount)
    
    // Calculate individual fee components using core algorithm
    const fees = {
      diBoaSFee: this._calculateDiBoaSFee(numericAmount, type),
      networkFee: this._calculateNetworkFee(numericAmount, asset, chains),
      providerFee: this._calculateProviderFee(numericAmount, type, paymentMethod),
      dexFee: this._calculateDexFee(numericAmount, type, paymentMethod, chains, asset),
      defiFee: this._calculateDefiFee(numericAmount, type)
    }
    
    // Calculate total fees
    fees.totalFees = fees.diBoaSFee + fees.networkFee + fees.providerFee + fees.dexFee + fees.defiFee
    
    // Apply minimum fee rules (only for diBoaS fees)
    fees.diBoaSFee = Math.max(fees.diBoaSFee, FEE_RATES.MINIMUMS.diboas)
    fees.totalFees = fees.diBoaSFee + fees.networkFee + fees.providerFee + fees.dexFee + fees.defiFee
    
    // Add formatted breakdown for UI compatibility
    const result = {
      ...fees,
      // Legacy format for backward compatibility
      diBoaS: fees.diBoaSFee,
      network: fees.networkFee,
      provider: ['start_strategy', 'stop_strategy', 'buy', 'sell'].includes(type) && paymentMethod === 'diboas_wallet' ? fees.dexFee : fees.providerFee, // For strategies and buy/sell with diboas_wallet, show DEX fee as provider fee
      dex: fees.dexFee,
      defi: fees.defiFee,
      total: fees.totalFees,
      // Detailed breakdown
      breakdown: {
        diBoaS: { amount: fees.diBoaSFee, rate: FEE_RATES.DIBOAS[type] || 0 },
        network: { amount: fees.networkFee, rate: FEE_RATES.NETWORK[chains[0] || asset] || FEE_RATES.NETWORK[asset] || 0 },
        provider: { 
          amount: ['start_strategy', 'stop_strategy'].includes(type) ? fees.dexFee : fees.providerFee, 
          rate: ['start_strategy', 'stop_strategy'].includes(type) ? 0.005 : this.getProviderRate(type, paymentMethod) 
        },
        dex: { 
          amount: fees.dexFee, 
          rate: this._getDexFeeRate(type, paymentMethod, chains, asset)
        },
        defi: { amount: fees.defiFee, rate: FEE_RATES.DEFI[type] || 0 }
      }
    }
    
    // Cache result
    this.setCache(cacheKey, result)
    
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
   * @returns {number} diBoaS fee
   */
  _calculateDiBoaSFee(amount, type) {
    const rate = FEE_RATES.DIBOAS[type] || 0
    return this.calculateCoreFee(amount, rate)
  }

  /**
   * Calculate network fee using core algorithm (internal method)
   * @param {number} amount - Transaction amount
   * @param {string} asset - Asset type
   * @param {Array} chains - Chain array
   * @returns {number} Network fee
   */
  _calculateNetworkFee(amount, asset, chains) {
    // Use primary chain for network fee calculation
    const primaryChain = chains[0] || asset
    const rate = FEE_RATES.NETWORK[primaryChain] || FEE_RATES.NETWORK[asset] || 0
    return this.calculateCoreFee(amount, rate)
  }

  /**
   * Calculate payment provider fee using core algorithm (internal method)
   * @param {number} amount - Transaction amount
   * @param {string} type - Transaction type
   * @param {string} paymentMethod - Payment method
   * @returns {number} Provider fee
   */
  _calculateProviderFee(amount, type, paymentMethod) {
    // Strategy transactions: Only diBoaS wallet allowed, no provider fees
    if (['start_strategy', 'stop_strategy'].includes(type)) {
      return 0 // Strategies only use diBoaS wallet
    }
    
    // diBoaS wallet has no provider fees for other transactions
    if (paymentMethod === 'diboas_wallet') return 0
    
    const rate = this.getProviderRate(type, paymentMethod)
    return this.calculateCoreFee(amount, rate)
  }

  /**
   * Calculate DEX fee using core algorithm (internal method)
   * @param {number} amount - Transaction amount
   * @param {string} type - Transaction type
   * @param {string} paymentMethod - Payment method
   * @param {Array} chains - Chain array for external wallet detection
   * @param {string} asset - Asset type (e.g., 'BTC', 'ETH', 'SOL')
   * @returns {number} DEX fee
   */
  _calculateDexFee(amount, type, paymentMethod, chains = ['SOL'], asset = 'SOL') {
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
      // Apply DEX fee when buying with existing balance
      const rate = FEE_RATES.DEX[type] || 0
      return this.calculateCoreFee(amount, rate)
    }
    
    // Sell transactions - apply DEX fees for non-SOL assets
    if (type === 'sell') {
      // No DEX fee for SOL assets (native chain)
      if (asset === 'SOL') {
        return 0
      }
      // Apply DEX fee for all other assets (BTC, ETH, SUI, PAXG, etc.)
      const rate = FEE_RATES.DEX[type] || 0
      return this.calculateCoreFee(amount, rate)
    }
    
    if (type === 'transfer') {
      const rate = FEE_RATES.DEX.transfer || 0
      return this.calculateCoreFee(amount, rate)
    }
    
    // FIXED: Withdraw transactions - DEX fee only for external wallets
    if (type === 'withdraw') {
      // Off-ramp withdrawals (bank, card, paypal) - NO DEX fee
      if (paymentMethod !== 'external_wallet' && paymentMethod !== 'diboas_wallet') {
        return 0 // No DEX fee for off-ramp transactions
      }
      
      // External wallet withdrawals - DEX fee depends on destination chain
      if (paymentMethod === 'external_wallet' || paymentMethod === 'diboas_wallet') {
        const destinationChain = chains[0] || 'SOL'
        
        // SOL transactions - no DEX fee (same chain)
        if (destinationChain === 'SOL') {
          return 0
        }
        
        // Cross-chain transactions (BTC, ETH, SUI) - 0.5% DEX fee
        return this.calculateCoreFee(amount, 0.005) // 0.5% DEX fee for cross-chain
      }
    }
    
    // Strategy transactions - Fixed 0.5% DEX fee
    if (['start_strategy', 'stop_strategy'].includes(type)) {
      return this.calculateCoreFee(amount, 0.005) // 0.5% fixed DEX fee
    }
    
    return 0
  }

  /**
   * Calculate DeFi protocol fee using core algorithm (internal method)
   * @param {number} amount - Transaction amount
   * @param {string} type - Transaction type
   * @returns {number} DeFi fee
   */
  _calculateDefiFee(amount, type) {
    // NEW: Strategy transactions don't use DeFi fees - they use DEX fees instead
    if (['start_strategy', 'stop_strategy'].includes(type)) {
      return 0 // Use DEX fee instead
    }
    
    const rate = FEE_RATES.DEFI[type] || 0
    return this.calculateCoreFee(amount, rate)
  }

  /**
   * Get DEX fee rate for breakdown display
   * @param {string} type - Transaction type
   * @param {string} paymentMethod - Payment method
   * @param {Array} chains - Chain array
   * @param {string} asset - Asset type
   * @returns {number} DEX fee rate
   */
  _getDexFeeRate(type, paymentMethod, chains = ['SOL'], asset = 'SOL') {
    if (['start_strategy', 'stop_strategy'].includes(type)) {
      return 0.005 // 0.5% for strategy transactions
    }
    
    // Sell transactions - check asset
    if (type === 'sell') {
      // No DEX fee for SOL assets
      if (asset === 'SOL') {
        return 0
      }
      // DEX fee for all other assets
      return FEE_RATES.DEX[type] || 0
    }
    
    if (type === 'withdraw') {
      // Off-ramp withdrawals - no DEX fee
      if (paymentMethod !== 'external_wallet' && paymentMethod !== 'diboas_wallet') {
        return 0
      }
      
      // External wallet withdrawals - depends on chain
      const destinationChain = chains[0] || 'SOL'
      return destinationChain === 'SOL' ? 0 : 0.005 // 0% for SOL, 0.5% for others
    }
    
    return FEE_RATES.DEX[type] || 0
  }

  /**
   * Get provider fee rate based on transaction type and payment method
   * @param {string} type - Transaction type
   * @param {string} paymentMethod - Payment method
   * @returns {number} Provider fee rate
   */
  getProviderRate(type, paymentMethod) {
    if (paymentMethod === 'diboas_wallet') return 0
    
    // Determine direction (onramp vs offramp)
    const direction = ['add', 'buy'].includes(type) ? 'onramp' : 'offramp'
    
    return FEE_RATES.PAYMENT_PROVIDER[direction][paymentMethod] || 0
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

  /**
   * Cache management
   */
  getFromCache(key) {
    const cached = this.cache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }
    return null
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    })
  }

  /**
   * Legacy method compatibility - calculateComprehensiveFees
   * Maintains backward compatibility with existing code
   */
  calculateComprehensiveFees(params) {
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

    return this.calculateFees({ type, amount, asset, paymentMethod, chains })
  }

  /**
   * Legacy method compatibility - calculateDiBoaSFee
   */
  calculateDiBoaSFee(type, amount) {
    if (!type) {
      throw new Error('Invalid transaction type')
    }
    if (amount === 0) return 0
    if (!amount || amount < 0) {
      throw new Error('Amount must be positive')
    }

    const numericAmount = parseFloat(amount)
    const rate = FEE_RATES.DIBOAS[type]
    if (rate === undefined) {
      throw new Error('Invalid transaction type')
    }
    
    return this.calculateCoreFee(numericAmount, rate)
  }

  /**
   * Legacy method compatibility - calculateNetworkFee
   */
  calculateNetworkFee(chain, amount) {
    if (!amount || amount < 0) {
      throw new Error('Amount must be positive')
    }
    if (amount === 0) return 0

    const numericAmount = parseFloat(amount)
    const rate = FEE_RATES.NETWORK[chain] || 0
    return this.calculateCoreFee(numericAmount, rate)
  }

  // Additional utility methods for specific use cases
  
  /**
   * Get all fee rates for a specific transaction type
   */
  getFeeRatesForTransaction(type) {
    return {
      diboas: FEE_RATES.DIBOAS[type] || 0,
      network: FEE_RATES.NETWORK,
      provider: FEE_RATES.PAYMENT_PROVIDER,
      dex: FEE_RATES.DEX[type] || 0,
      defi: FEE_RATES.DEFI[type] || 0
    }
  }

  /**
   * Calculate quick estimate for UI display
   */
  getQuickEstimate(type, amount) {
    const diboasRate = FEE_RATES.DIBOAS[type] || 0
    const estimatedFee = this.calculateCoreFee(amount, diboasRate)
    
    return {
      estimatedDiBoaSFee: Math.max(estimatedFee, FEE_RATES.MINIMUMS.diboas),
      message: 'Additional network and provider fees may apply based on payment method'
    }
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
        totalFees: fees.totalFees,
        breakdown: fees.breakdown
      })
    }
    
    // Sort by total fees (lowest first)
    return results.sort((a, b) => a.totalFees - b.totalFees)
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
      
      // Return in legacy format for backward compatibility
      return {
        ...fees,
        // Legacy field mappings
        diboas: fees.diBoaS,
        platformFee: fees.diBoaS,
        networkFee: fees.network,
        providerFee: fees.provider,
        dexFee: fees.dex,
        defiFee: fees.defi,
        totalFee: fees.total,
        totalFees: fees.total
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
    
    // Return in legacy format for backward compatibility
    return {
      ...fees,
      // Legacy field mappings
      diboas: fees.diBoaS,
      platformFee: fees.diBoaS,
      networkFee: fees.network,
      providerFee: fees.provider,
      dexFee: fees.dex,
      defiFee: fees.defi,
      totalFee: fees.total,
      totalFees: fees.total
    }
  }
}

// Export singleton instance for use throughout the application
export const centralizedFeeCalculator = new CentralizedFeeCalculator()

// Maintain backward compatibility
export const defaultFeeCalculator = centralizedFeeCalculator

// Legacy export for existing code
export const FeeCalculator = CentralizedFeeCalculator

// Legacy export
export const FEE_STRUCTURE = {
  DIBOAS_FEES: FEE_RATES.DIBOAS,
  NETWORK_FEES: FEE_RATES.NETWORK,
  PAYMENT_PROVIDER_FEES: FEE_RATES.PAYMENT_PROVIDER,
  ONCHAIN_FEES: { swap: { min: 0.001, max: 0.003 }, bridge: { base: 2, percentage: 0.0005 }, defi: 0.002 },
  MINIMUM_FEES: FEE_RATES.MINIMUMS
}