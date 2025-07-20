/**
 * Comprehensive Fee Calculation System
 * Handles all fee calculations for different transaction types as per requirements
 */

/**
 * Fee structure configuration matching TRANSACTIONS.md requirements
 */
export const FEE_STRUCTURE = {
  // diBoaS fees
  DIBOAS_FEES: {
    'add': 0.0009,      // 0.09%
    'withdraw': 0.009,   // 0.9%
    'send': 0.0009,     // 0.09%
    'receive': 0.0009,  // 0.09%
    'transfer': 0.009,  // 0.9%
    'buy': 0.0009,      // 0.09%
    'sell': 0.0009,     // 0.09%
    'invest': 0.0009    // 0.09%
  },

  // Network fees (percentage of transaction amount)
  NETWORK_FEES: {
    'BTC': 0.09,      // 9%
    'ETH': 0.005,     // 0.5% (ETH L2)
    'SOL': 0.00001,   // 0.001%
    'SUI': 0.00003    // 0.003%
  },

  // Payment Provider fees (On/Off-Ramp)
  PAYMENT_PROVIDER_FEES: {
    // On-Ramp (Add/Deposit) fees
    onramp: {
      'apple_pay': 0.005,     // 0.5%
      'credit_card': 0.01,    // 1%
      'bank': 0.01,           // 1%
      'paypal': 0.03,         // 3%
      'google_pay': 0.005     // 0.5%
    },
    // Off-Ramp (Withdraw) fees
    offramp: {
      'apple_pay': 0.01,      // 1%
      'credit_card': 0.02,    // 2%
      'bank': 0.02,           // 2%
      'paypal': 0.04,         // 4%
      'google_pay': 0.01      // 1%
    }
  },

  // On-Chain Provider fees
  ONCHAIN_FEES: {
    swap: { min: 0.001, max: 0.003 },    // 0.1-0.3% depending on liquidity
    bridge: { base: 2, percentage: 0.0005 }, // $2-10 + 0.05%
    defi: 0.002                          // 0.2% average DeFi protocol fee
  },

  // Minimum fees
  MINIMUM_FEES: {
    network: 0.10,
    provider: 0.50,
    diBoaS: 0.01
  }
}

/**
 * Real-time fee calculator with provider integration
 */
export class FeeCalculator {
  constructor() {
    this.priceCache = new Map()
    this.feeCache = new Map()
    this.lastPriceUpdate = 0
    this.PRICE_CACHE_DURATION = 60000 // 1 minute
  }

  /**
   * Calculate comprehensive fees for any transaction type
   */
  async calculateTransactionFees(transactionData, routingPlan = null) {
    const { type, amount, asset, fromChain, toChain, paymentMethod } = transactionData
    const numericAmount = parseFloat(amount)

    if (isNaN(numericAmount) || numericAmount <= 0) {
      throw new Error('Invalid transaction amount')
    }

    const fees = {
      diBoaS: 0,
      network: 0,
      provider: 0,
      routing: 0,
      gas: 0,
      total: 0,
      breakdown: [],
      effectiveRate: 0,
      displaySummary: ''
    }

    // Calculate diBoaS fee
    const diBoaSRate = FEE_STRUCTURE.DIBOAS_FEES[type] || 0
    fees.diBoaS = Math.max(numericAmount * diBoaSRate, FEE_STRUCTURE.MINIMUM_FEES.diBoaS)

    // Calculate network fees based on transaction type
    fees.network = await this.calculateNetworkFees(type, numericAmount, fromChain, toChain)

    // Calculate provider fees
    fees.provider = await this.calculateProviderFees(type, numericAmount, paymentMethod, asset)

    // Calculate routing fees if cross-chain operation
    if (routingPlan?.needsRouting) {
      fees.routing = await this.calculateRoutingFees(routingPlan, numericAmount)
    }

    // Calculate gas fees
    fees.gas = await this.calculateGasFees(type, fromChain, toChain, asset)

    // Build detailed breakdown
    fees.breakdown = this.buildFeeBreakdown(fees, type, numericAmount)

    // Calculate totals
    fees.total = fees.diBoaS + fees.network + fees.provider + fees.routing + fees.gas
    fees.effectiveRate = (fees.total / numericAmount) * 100

    // Generate display summary
    fees.displaySummary = this.generateDisplaySummary(fees, type)

    return fees
  }

  /**
   * Calculate network fees for transaction (now percentage-based)
   */
  async calculateNetworkFees(type, amount, fromChain, toChain) {
    let networkFeeRate = 0

    // On-ramp and off-ramp use destination chain
    if (type === 'add') {
      networkFeeRate = FEE_STRUCTURE.NETWORK_FEES.SOL // Always Solana for on-ramp
    } else if (type === 'withdraw') {
      networkFeeRate = FEE_STRUCTURE.NETWORK_FEES.SOL // Always from Solana
    } else if (['send', 'receive'].includes(type)) {
      networkFeeRate = FEE_STRUCTURE.NETWORK_FEES.SOL // P2P on Solana
    } else if (type === 'transfer') {
      // External transfer - may involve multiple chains
      networkFeeRate = FEE_STRUCTURE.NETWORK_FEES[fromChain] || 0
      if (toChain && toChain !== fromChain) {
        networkFeeRate += FEE_STRUCTURE.NETWORK_FEES[toChain] || 0
      }
    } else if (['buy', 'sell'].includes(type)) {
      // Asset transactions may involve multiple chains
      networkFeeRate = FEE_STRUCTURE.NETWORK_FEES[fromChain] || FEE_STRUCTURE.NETWORK_FEES.SOL
      if (toChain && toChain !== fromChain) {
        networkFeeRate += FEE_STRUCTURE.NETWORK_FEES[toChain] || 0
      }
    } else if (type === 'invest') {
      networkFeeRate = FEE_STRUCTURE.NETWORK_FEES.SOL // Investments on Solana
    }

    const networkFee = parseFloat(amount) * networkFeeRate
    return Math.max(networkFee, FEE_STRUCTURE.MINIMUM_FEES.network)
  }

  /**
   * Calculate provider-specific fees
   */
  async calculateProviderFees(type, amount, paymentMethod, asset) {
    let providerFee = 0

    // Return 0 if no payment method selected (as per requirements)
    if (!paymentMethod) {
      return 0
    }

    switch (type) {
      case 'add':
        // On-ramp provider fees based on payment method
        const onrampRate = FEE_STRUCTURE.PAYMENT_PROVIDER_FEES.onramp[paymentMethod] || 0
        providerFee = amount * onrampRate
        break

      case 'withdraw':
        // Off-ramp provider fees based on payment method
        const offrampRate = FEE_STRUCTURE.PAYMENT_PROVIDER_FEES.offramp[paymentMethod] || 0
        providerFee = amount * offrampRate
        break

      case 'invest':
        // Investment provider fees + potential on-chain fees
        providerFee = amount * FEE_STRUCTURE.ONCHAIN_FEES.defi
        break

      case 'buy':
      case 'sell':
        // DEX/trading fees for asset swaps
        if (asset && asset !== 'USDC') {
          const swapRate = (FEE_STRUCTURE.ONCHAIN_FEES.swap.min + FEE_STRUCTURE.ONCHAIN_FEES.swap.max) / 2
          providerFee = amount * swapRate
        }
        break

      case 'send':
      case 'receive':
      case 'transfer':
        // On-chain fees for cross-chain operations
        const bridgeBaseFee = FEE_STRUCTURE.ONCHAIN_FEES.bridge.base
        const bridgePercentageFee = amount * FEE_STRUCTURE.ONCHAIN_FEES.bridge.percentage
        providerFee = bridgeBaseFee + bridgePercentageFee
        break

      default:
        providerFee = 0
    }

    return Math.max(providerFee, providerFee > 0 ? FEE_STRUCTURE.MINIMUM_FEES.provider : 0)
  }

  /**
   * Calculate routing fees for cross-chain operations
   */
  async calculateRoutingFees(routingPlan, amount) {
    if (!routingPlan?.routingSteps) return 0

    let routingFee = 0

    routingPlan.routingSteps.forEach(step => {
      switch (step.action) {
        case 'swap':
          routingFee += amount * FEE_STRUCTURE.PROVIDER_FEES.swap
          break
        case 'bridge':
          routingFee += amount * FEE_STRUCTURE.PROVIDER_FEES.bridge
          break
        default:
          // Other routing steps may have specific fees
          break
      }
    })

    return routingFee
  }

  /**
   * Calculate gas fees for smart contract interactions
   */
  async calculateGasFees(type, fromChain, toChain, asset) {
    // Gas fees are typically included in network fees
    // This method can be expanded for more granular gas estimation
    let gasFee = 0

    // Complex transactions may have additional gas costs
    if (['buy', 'sell', 'invest'].includes(type)) {
      gasFee = 2.0 // Additional smart contract interaction costs
    }

    // Cross-chain operations have higher gas requirements
    if (fromChain !== toChain) {
      gasFee += 3.0
    }

    return gasFee
  }

  /**
   * Build detailed fee breakdown for display
   */
  buildFeeBreakdown(fees, type, amount) {
    const breakdown = []

    // diBoaS fee
    if (fees.diBoaS > 0) {
      const rate = FEE_STRUCTURE.DIBOAS_FEES[type] * 100
      breakdown.push({
        type: 'diBoaS',
        description: `diBoaS Fee (${rate.toFixed(2)}%)`,
        amount: fees.diBoaS,
        percentage: (fees.diBoaS / amount) * 100
      })
    }

    // Network fees
    if (fees.network > 0) {
      breakdown.push({
        type: 'network',
        description: 'Blockchain Network Fee',
        amount: fees.network,
        isFixed: true
      })
    }

    // Provider fees
    if (fees.provider > 0) {
      let description = 'Provider Fee'
      if (['add', 'withdraw'].includes(type)) {
        description = 'Payment Provider Fee (2.9%)'
      } else if (type === 'invest') {
        description = 'Investment Provider Fee (0.5%)'
      } else if (['buy', 'sell'].includes(type)) {
        description = 'Trading Fee (0.3%)'
      }

      breakdown.push({
        type: 'provider',
        description,
        amount: fees.provider,
        percentage: (fees.provider / amount) * 100
      })
    }

    // Routing fees
    if (fees.routing > 0) {
      breakdown.push({
        type: 'routing',
        description: 'Cross-chain Routing Fee',
        amount: fees.routing,
        percentage: (fees.routing / amount) * 100
      })
    }

    // Gas fees
    if (fees.gas > 0) {
      breakdown.push({
        type: 'gas',
        description: 'Smart Contract Gas Fee',
        amount: fees.gas,
        isFixed: true
      })
    }

    return breakdown
  }

  /**
   * Generate user-friendly fee summary
   */
  generateDisplaySummary(fees, type) {
    const parts = []

    if (fees.diBoaS > 0) {
      const rate = FEE_STRUCTURE.DIBOAS_FEES[type] * 100
      parts.push(`${rate.toFixed(2)}% diBoaS fee`)
    }

    if (fees.provider > 0) {
      if (['add', 'withdraw'].includes(type)) {
        parts.push('2.9% payment provider fee')
      } else if (type === 'invest') {
        parts.push('0.5% investment fee')
      } else {
        parts.push('trading fees')
      }
    }

    if (fees.network > 0 || fees.gas > 0) {
      parts.push('network fees')
    }

    if (fees.routing > 0) {
      parts.push('cross-chain fees')
    }

    const summary = parts.length > 0 ? parts.join(', ') : 'minimal fees'
    return `Includes ${summary}. Total: $${fees.total.toFixed(2)} (${fees.effectiveRate.toFixed(2)}%)`
  }

  /**
   * Real-time fee estimation with provider APIs
   */
  async getRealTimeFees(transactionData) {
    const cacheKey = this.generateCacheKey(transactionData)
    
    // Check cache first
    if (this.feeCache.has(cacheKey)) {
      const cached = this.feeCache.get(cacheKey)
      if (Date.now() - cached.timestamp < 30000) { // 30 second cache
        return cached.data
      }
    }

    try {
      // Calculate base fees
      const fees = await this.calculateTransactionFees(transactionData)

      // Enhance with real-time data if available
      if (this.shouldFetchRealTimeData(transactionData.type)) {
        await this.enhanceWithRealTimeData(fees, transactionData)
      }

      // Cache result
      this.feeCache.set(cacheKey, {
        data: fees,
        timestamp: Date.now()
      })

      return fees
    } catch (error) {
      throw new Error(`Fee calculation failed: ${error.message}`)
    }
  }

  /**
   * Compare fees across different routing options
   */
  async compareFeeOptions(transactionData, routingOptions) {
    const comparisons = []

    for (const option of routingOptions) {
      try {
        const fees = await this.calculateTransactionFees(transactionData, option)
        comparisons.push({
          option,
          fees,
          totalCost: parseFloat(transactionData.amount) + fees.total,
          effectiveRate: fees.effectiveRate,
          estimatedTime: option.estimatedTime || 300 // 5 minutes default
        })
      } catch (error) {
        comparisons.push({
          option,
          error: error.message,
          fees: null
        })
      }
    }

    // Sort by total cost
    return comparisons
      .filter(c => c.fees)
      .sort((a, b) => a.totalCost - b.totalCost)
  }

  /**
   * Optimize transaction for lowest fees
   */
  async optimizeForFees(transactionData, availableOptions = []) {
    if (availableOptions.length === 0) {
      return await this.getRealTimeFees(transactionData)
    }

    const comparisons = await this.compareFeeOptions(transactionData, availableOptions)
    
    if (comparisons.length === 0) {
      throw new Error('No viable fee options available')
    }

    return {
      recommended: comparisons[0],
      alternatives: comparisons.slice(1, 3), // Show top 3 alternatives
      savings: comparisons.length > 1 ? 
        comparisons[comparisons.length - 1].totalCost - comparisons[0].totalCost : 0
    }
  }

  /**
   * Helper methods
   */
  generateCacheKey(transactionData) {
    const { type, amount, asset, fromChain, toChain } = transactionData
    return `${type}_${amount}_${asset || 'none'}_${fromChain || 'none'}_${toChain || 'none'}`
  }

  shouldFetchRealTimeData(type) {
    return ['add', 'withdraw', 'buy', 'sell'].includes(type)
  }

  async enhanceWithRealTimeData(fees, transactionData) {
    // In real implementation, this would fetch current rates from:
    // - Payment processors (Stripe, PayPal)
    // - DEX aggregators (1inch, Jupiter)
    // - Bridge services (Wormhole, LayerZero)
    // - Gas oracle services

    // Mock enhancement for now
    const volatilityFactor = 0.95 + (Math.random() * 0.1) // ±5% variation
    fees.network *= volatilityFactor
    fees.provider *= volatilityFactor
    fees.total = fees.diBoaS + fees.network + fees.provider + fees.routing + fees.gas
  }

  /**
   * Get fee estimation for UI display
   */
  async getQuickEstimate(type, amount) {
    const basicFees = {
      diBoaS: parseFloat(amount) * (FEE_STRUCTURE.DIBOAS_FEES[type] || 0),
      network: FEE_STRUCTURE.NETWORK_FEES.SOL || 1.0,
      provider: 0
    }

    if (['add', 'withdraw'].includes(type)) {
      basicFees.provider = parseFloat(amount) * FEE_STRUCTURE.PROVIDER_FEES.onramp
    } else if (type === 'invest') {
      basicFees.provider = parseFloat(amount) * FEE_STRUCTURE.PROVIDER_FEES.investment
    }

    basicFees.total = basicFees.diBoaS + basicFees.network + basicFees.provider
    basicFees.effectiveRate = (basicFees.total / parseFloat(amount)) * 100

    return basicFees
  }
}

/**
 * Utility functions for fee calculations
 */
export const FeeUtils = {
  /**
   * Format fee amount for display
   */
  formatFee: (amount, currency = 'USD') => {
    if (currency === 'USD') {
      return `$${amount.toFixed(2)}`
    }
    return `${amount.toFixed(6)} ${currency}`
  },

  /**
   * Calculate fee as percentage
   */
  calculatePercentage: (feeAmount, totalAmount) => {
    return (feeAmount / totalAmount) * 100
  },

  /**
   * Check if fees are reasonable (under 5% total)
   */
  areFeesReasonable: (feeAmount, totalAmount, threshold = 0.05) => {
    return (feeAmount / totalAmount) <= threshold
  },

  /**
   * Get fee tier based on amount
   */
  getFeeTier: (amount) => {
    if (amount < 100) return 'micro'
    if (amount < 1000) return 'small'
    if (amount < 10000) return 'medium'
    return 'large'
  },

  /**
   * Estimate time to execute based on fees paid
   */
  estimateExecutionTime: (feeLevel) => {
    const times = {
      low: 900,    // 15 minutes
      medium: 300, // 5 minutes
      high: 60     // 1 minute
    }
    return times[feeLevel] || times.medium
  }
}

// Default instance for immediate use
export const defaultFeeCalculator = new FeeCalculator()

export default {
  FeeCalculator,
  FEE_STRUCTURE,
  FeeUtils,
  defaultFeeCalculator
}