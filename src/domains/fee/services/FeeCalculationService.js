/**
 * Fee Calculation Domain Service
 * Encapsulates all fee calculation business logic in the domain layer
 * Implements DDD patterns with proper abstraction and event emission
 */

import logger from '../../../utils/logger.js'
import { Money } from '../../shared/value-objects/Money.js'
import { FeeAmount, FeeType } from '../value-objects/FeeAmount.js'
import { FeeStructure } from '../value-objects/FeeStructure.js'
import { FeeCalculated } from '../events/FeeEvents.js'

export class FeeCalculationService {
  constructor(feeProviderService, eventBus) {
    this._feeProviderService = feeProviderService
    this._eventBus = eventBus
  }

  /**
   * Calculate comprehensive fees for a transaction
   * Main entry point for all fee calculations
   */
  async calculateTransactionFees(transactionRequest) {
    const { type, amount, asset, paymentMethod, chains } = transactionRequest
    
    try {
      // Validate inputs
      this._validateCalculationInputs(transactionRequest)
      
      // Load dynamic fee rates from provider
      const feeRates = await this._feeProviderService.getAllFeeData()
      
      // Create transaction context
      const context = this._createCalculationContext(transactionRequest, feeRates)
      
      // Calculate individual fee components
      const fees = await this._calculateFeeComponents(context)
      
      // Create fee structure
      const feeStructure = new FeeStructure(fees)
      
      // Apply business rules
      const finalFeeStructure = this._applyBusinessRules(feeStructure, context)
      
      // Validate final result
      finalFeeStructure.validate()
      
      // Emit domain event
      this._emitFeeCalculatedEvent(finalFeeStructure, context)
      
      logger.debug('Fee calculation completed', {
        transactionType: type,
        totalFees: finalFeeStructure.getTotal().amount,
        currency: asset
      })
      
      return finalFeeStructure
      
    } catch (error) {
      logger.error('Fee calculation failed', {
        transactionRequest,
        error: error.message
      })
      throw new FeeCalculationError(`Fee calculation failed: ${error.message}`, error)
    }
  }

  /**
   * Calculate platform fee (diBoaS fee)
   */
  _calculatePlatformFee(context) {
    const { amount, type, feeRates, minimums } = context
    
    const rate = feeRates.diboas[type] || 0
    let feeAmount = amount.multiply(rate)
    
    // Apply minimum fee
    const minimumFee = new Money(minimums.diboas || 0, amount.currency)
    if (feeAmount.lessThan(minimumFee)) {
      feeAmount = minimumFee
    }
    
    return FeeAmount.platformFee(feeAmount, amount.currency, `${type} platform fee`)
  }

  /**
   * Calculate network fee
   */
  _calculateNetworkFee(context) {
    const { amount, asset, chains, feeRates, minimums } = context
    
    const primaryChain = chains[0] || asset
    const rate = feeRates.network[primaryChain] || feeRates.network[asset] || 0
    let feeAmount = amount.multiply(rate)
    
    // Apply minimum fee
    const minimumFee = new Money(minimums.network || 0, amount.currency)
    if (feeAmount.lessThan(minimumFee)) {
      feeAmount = minimumFee
    }
    
    return FeeAmount.networkFee(feeAmount, amount.currency, `${primaryChain} network fee`)
  }

  /**
   * Calculate provider fee (payment processor)
   */
  _calculateProviderFee(context) {
    const { amount, type, paymentMethod, feeRates } = context
    
    // Strategy transactions only use diBoaS wallet - no provider fees
    if (['start_strategy', 'stop_strategy'].includes(type)) {
      return FeeAmount.zero(amount.currency, FeeType.PROVIDER)
    }
    
    // diBoaS wallet has no provider fees
    if (paymentMethod === 'diboas_wallet') {
      return FeeAmount.zero(amount.currency, FeeType.PROVIDER)
    }
    
    const rate = this._getProviderRate(type, paymentMethod, feeRates)
    const feeAmount = amount.multiply(rate)
    
    return FeeAmount.providerFee(feeAmount, amount.currency, `${paymentMethod} provider fee`)
  }

  /**
   * Calculate DEX fee
   */
  _calculateDexFee(context) {
    const { amount, type, paymentMethod, chains, asset, feeRates } = context
    
    const primaryChain = chains[0] || asset
    
    // Send transactions have NO DEX fees
    if (type === 'send') {
      return FeeAmount.zero(amount.currency, FeeType.DEX)
    }
    
    // Strategy transactions use DeFi fees, not DEX fees
    if (['start_strategy', 'stop_strategy'].includes(type)) {
      return FeeAmount.zero(amount.currency, FeeType.DEX)
    }
    
    // Buy transactions - only with diboas_wallet
    if (type === 'buy' && paymentMethod !== 'diboas_wallet') {
      return FeeAmount.zero(amount.currency, FeeType.DEX)
    }
    
    // Withdraw transactions - only for external wallets
    if (type === 'withdraw' && 
        !['external_wallet', 'diboas_wallet'].includes(paymentMethod)) {
      return FeeAmount.zero(amount.currency, FeeType.DEX)
    }
    
    const rate = this._getDexRate(primaryChain, feeRates)
    const feeAmount = amount.multiply(rate)
    
    return FeeAmount.dexFee(feeAmount, amount.currency, `${primaryChain} DEX fee`)
  }

  /**
   * Calculate DeFi protocol fee
   */
  _calculateDefiFee(context) {
    const { amount, type, chains, asset, feeRates } = context
    
    // Only strategy transactions use DeFi fees
    if (!['start_strategy', 'stop_strategy'].includes(type)) {
      return FeeAmount.zero(amount.currency, FeeType.DEFI)
    }
    
    const primaryChain = chains[0] || asset
    const rate = feeRates.defi[primaryChain] || feeRates.defi.SOL || 0
    const feeAmount = amount.multiply(rate)
    
    return FeeAmount.defiFee(feeAmount, amount.currency, `${primaryChain} DeFi protocol fee`)
  }

  /**
   * Calculate all fee components
   */
  async _calculateFeeComponents(context) {
    const allFees = [
      this._calculatePlatformFee(context),
      this._calculateNetworkFee(context),
      this._calculateProviderFee(context),
      this._calculateDexFee(context),
      this._calculateDefiFee(context)
    ]
    
    // Return all fees (FeeStructure will filter zero fees automatically)
    return allFees
  }

  /**
   * Apply business rules to fee structure
   */
  _applyBusinessRules(feeStructure, context) {
    return feeStructure.applyBusinessRules(
      context.type, 
      context.paymentMethod, 
      context.amount
    )
  }

  /**
   * Helper methods
   */
  _createCalculationContext(transactionRequest, feeRates) {
    const { type, amount, asset, paymentMethod, chains } = transactionRequest
    
    return {
      type,
      amount: amount instanceof Money ? amount : new Money(amount, asset),
      asset,
      paymentMethod: paymentMethod || 'diboas_wallet',
      chains: chains || [asset],
      feeRates,
      minimums: feeRates.minimums || {},
      calculatedAt: new Date().toISOString()
    }
  }

  _getProviderRate(type, paymentMethod, feeRates) {
    const direction = ['add', 'buy'].includes(type) ? 'onramp' : 'offramp'
    return feeRates.provider[direction][paymentMethod] || 0
  }

  _getDexRate(chain, feeRates) {
    return chain === 'SOL' ? feeRates.dex.solana : feeRates.dex.standard
  }

  _validateCalculationInputs(request) {
    const { type, amount, asset } = request
    
    if (!type) {
      throw new Error('Transaction type is required')
    }
    
    if (!amount || amount <= 0) {
      throw new Error('Amount must be positive')
    }
    
    if (!asset) {
      throw new Error('Asset is required')
    }
    
    // Validate supported transaction types
    const supportedTypes = [
      'add', 'withdraw', 'send', 'receive', 
      'buy', 'sell', 'start_strategy', 'stop_strategy'
    ]
    if (!supportedTypes.includes(type)) {
      throw new Error(`Unsupported transaction type: ${type}`)
    }
  }

  _emitFeeCalculatedEvent(feeStructure, context) {
    const event = new FeeCalculated({
      feeStructure: feeStructure.toJSON(),
      transactionType: context.type,
      amount: context.amount.toJSON(),
      paymentMethod: context.paymentMethod,
      calculatedAt: context.calculatedAt,
      totalFees: feeStructure.getTotal().toJSON()
    })
    
    this._eventBus?.emit(event)
  }

  /**
   * Get fee estimates for comparison
   */
  async calculateFeeComparison(transactionRequest, paymentMethods) {
    const comparisons = []
    
    for (const paymentMethod of paymentMethods) {
      try {
        const request = { ...transactionRequest, paymentMethod }
        const feeStructure = await this.calculateTransactionFees(request)
        
        comparisons.push({
          paymentMethod,
          totalFees: feeStructure.getTotal(),
          breakdown: feeStructure.getSummary(),
          recommended: false // Will be set by comparison logic
        })
      } catch (error) {
        logger.warn(`Fee calculation failed for ${paymentMethod}`, error)
        // Continue with other payment methods
      }
    }
    
    // Sort by total fees and mark cheapest as recommended
    comparisons.sort((a, b) => a.totalFees.amount - b.totalFees.amount)
    if (comparisons.length > 0) {
      comparisons[0].recommended = true
    }
    
    return comparisons
  }

  /**
   * Calculate fee impact on transaction amount
   */
  calculateFeeImpact(transactionRequest) {
    return this.calculateTransactionFees(transactionRequest).then(feeStructure => {
      const amount = transactionRequest.amount instanceof Money 
        ? transactionRequest.amount 
        : new Money(transactionRequest.amount, transactionRequest.asset)
      
      const totalFees = feeStructure.getTotal()
      const impactPercentage = totalFees.divide(amount.amount).multiply(100)
      
      return {
        originalAmount: amount,
        totalFees,
        netAmount: amount.subtract(totalFees),
        impactPercentage: Math.round(impactPercentage.amount * 100) / 100
      }
    })
  }
}

/**
 * Fee Calculation Error
 */
export class FeeCalculationError extends Error {
  constructor(message, cause) {
    super(message)
    this.name = 'FeeCalculationError'
    this.cause = cause
  }
}

export default FeeCalculationService