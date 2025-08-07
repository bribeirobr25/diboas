/**
 * Buy Transaction Handler (Asset Purchase)
 * Handles purchasing crypto assets and tokenized assets
 * Follows DDD patterns with single responsibility
 */

import { BaseTransactionHandler } from './BaseTransactionHandler.js'
import { AssetPurchaseInitiated, AssetPurchaseCompleted } from '../events/TransactionEvents.js'
import logger from '../../../utils/logger.js'

export class BuyTransactionHandler extends BaseTransactionHandler {
  
  /**
   * Handle buy transaction (asset purchase)
   */
  async handle(userId, transactionData, routingPlan, fees, options = {}) {
    const { amount, asset, paymentMethod } = transactionData

    try {
      // Emit initiation event
      this._emitAssetPurchaseInitiated(userId, transactionData)

      // Execute routing to get funds to correct chain if needed
      if (routingPlan.needsRouting) {
        const routingOption = {
          fromChain: routingPlan.fromChain,
          toChain: routingPlan.toChain,
          fromAsset: 'USDC',
          toAsset: asset,
          fromAmount: parseFloat(amount)
        }

        await this._walletManager.executeRouting(userId, routingOption)
      }

      // Execute asset purchase
      const result = await this._integrationManager.execute(
        'trading',
        'buyAsset',
        {
          asset,
          amountUSD: amount,
          chain: routingPlan.toChain
        }
      )

      if (result.success) {
        const completionData = {
          success: true,
          transactionHash: result.transactionHash || `tx_buy_${Date.now()}`,
          asset,
          amountPurchased: result.assetAmount || 0,
          // Enhanced metadata for transparency
          fromAsset: paymentMethod === 'diboas_wallet' ? 'USDC' : undefined,
          fromAmount: paymentMethod === 'diboas_wallet' ? parseFloat(amount) : undefined,
          toAsset: asset,
          toAmount: result.assetAmount || 0,
          dexProvider: result.dexProvider || 'Jupiter',
          exchangeRate: result.exchangeRate,
          amountSpent: parseFloat(amount)
        }

        // Emit completion event
        this._emitAssetPurchaseCompleted(userId, completionData)

        return completionData
      }

      throw new Error('Asset purchase failed')
      
    } catch (error) {
      logger.error('Buy transaction failed', {
        userId,
        amount,
        asset,
        error: error.message
      })

      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Validate buy-specific transaction data
   */
  async _performSpecificValidation(transactionData) {
    const { asset, amount } = transactionData

    // Validate asset is provided
    if (!asset) {
      return {
        isValid: false,
        error: 'Asset selection is required for buy transactions'
      }
    }

    // Critical business rule: Prevent Buy USD transactions
    if (asset === 'USD') {
      return {
        isValid: false,
        error: 'Cannot buy USD. Please select a cryptocurrency or tokenized asset'
      }
    }

    // Validate asset is supported for buying
    if (!this._isValidBuyAsset(asset)) {
      return {
        isValid: false,
        error: `Asset ${asset} is not available for purchase`
      }
    }

    // Validate minimum amount
    if (parseFloat(amount) < 10.0) {
      return {
        isValid: false,
        error: 'Minimum buy amount is $10.00'
      }
    }

    return { isValid: true }
  }

  /**
   * Check if asset is valid for buying
   */
  _isValidBuyAsset(asset) {
    const validBuyAssets = [
      // Cryptocurrencies
      'BTC', 'ETH', 'SOL', 'SUI', 'USDC',
      // Tokenized Assets
      'GOLD', 'STOCKS', 'REALESTATE'
    ]

    return validBuyAssets.includes(asset)
  }

  /**
   * Get asset's native chain
   */
  _getAssetNativeChain(asset) {
    const assetChains = {
      BTC: 'BTC',
      ETH: 'ETH',
      SOL: 'SOL',
      SUI: 'SUI',
      USDC: 'SOL', // Default USDC to Solana
      GOLD: 'SOL',
      STOCKS: 'SOL',
      REALESTATE: 'SOL'
    }

    return assetChains[asset] || 'SOL'
  }

  /**
   * Emit asset purchase initiated event
   */
  _emitAssetPurchaseInitiated(userId, transactionData) {
    const event = new AssetPurchaseInitiated({
      userId,
      asset: transactionData.asset,
      amountUSD: transactionData.amount,
      paymentMethod: transactionData.paymentMethod,
      targetChain: this._getAssetNativeChain(transactionData.asset)
    })

    this._eventBus?.emit(event)
  }

  /**
   * Emit asset purchase completed event
   */
  _emitAssetPurchaseCompleted(userId, completionData) {
    const event = new AssetPurchaseCompleted({
      userId,
      asset: completionData.asset,
      amountPurchased: completionData.amountPurchased,
      exchangeRate: completionData.exchangeRate,
      dexProvider: completionData.dexProvider,
      transactionHash: completionData.transactionHash,
      amountSpent: completionData.amountSpent
    })

    this._eventBus?.emit(event)
  }

  /**
   * Get supported transaction types
   */
  static getSupportedTypes() {
    return ['buy']
  }

  /**
   * Get handler priority
   */
  static getPriority() {
    return 30 // Medium priority for trading
  }
}

export default BuyTransactionHandler