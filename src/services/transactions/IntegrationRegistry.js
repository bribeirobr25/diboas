/**
 * Transaction Integration Registry
 * Extends the main integration system with transaction-specific providers
 */

import { ProviderRegistry } from '../integrations/ProviderRegistry.js'

/**
 * Trading Provider Registry for asset buy/sell operations
 */
export class TradingProviderRegistry extends ProviderRegistry {
  constructor() {
    super('trading')
    this.supportedAssets = new Map()
    this.priceFeeds = new Map()
  }

  /**
   * Register trading provider with asset support
   */
  async registerProvider(providerId, provider, config = {}) {
    await super.registerProvider(providerId, provider, config)
    
    // Register supported assets
    if (config.supportedAssets) {
      this.supportedAssets.set(providerId, config.supportedAssets)
    }
    
    // Register price feeds
    if (config.priceFeeds) {
      this.priceFeeds.set(providerId, config.priceFeeds)
    }
  }

  /**
   * Execute asset purchase
   */
  async buyAsset(asset, amountUSD, chain, options = {}) {
    const providers = this.getProvidersForAsset(asset, 'buy')
    
    for (const providerId of providers) {
      try {
        const provider = this.providers.get(providerId)
        const result = await provider.buyAsset({
          asset,
          amountUSD,
          chain,
          ...options
        })

        if (result.success) {
          await this.recordExecution(providerId, 'buyAsset', { asset, amountUSD, chain })
          return {
            success: true,
            providerId,
            result: {
              transactionHash: result.transactionHash,
              assetAmount: result.assetAmount,
              actualPrice: result.actualPrice,
              slippage: result.slippage
            }
          }
        }
      } catch (error) {
        await this.recordFailure(providerId, 'buyAsset', error)
        continue
      }
    }

    throw new Error(`No available providers for buying ${asset}`)
  }

  /**
   * Execute asset sale
   */
  async sellAsset(asset, amount, chain, options = {}) {
    const providers = this.getProvidersForAsset(asset, 'sell')
    
    for (const providerId of providers) {
      try {
        const provider = this.providers.get(providerId)
        const result = await provider.sellAsset({
          asset,
          amount,
          chain,
          ...options
        })

        if (result.success) {
          await this.recordExecution(providerId, 'sellAsset', { asset, amount, chain })
          return {
            success: true,
            providerId,
            result: {
              transactionHash: result.transactionHash,
              usdReceived: result.usdReceived,
              actualPrice: result.actualPrice,
              slippage: result.slippage
            }
          }
        }
      } catch (error) {
        await this.recordFailure(providerId, 'sellAsset', error)
        continue
      }
    }

    throw new Error(`No available providers for selling ${asset}`)
  }

  /**
   * Get current asset price
   */
  async getAssetPrice(asset, currency = 'USD') {
    const providers = Array.from(this.priceFeeds.keys())
    
    for (const providerId of providers) {
      try {
        const provider = this.providers.get(providerId)
        const price = await provider.getPrice(asset, currency)
        
        if (price && price > 0) {
          return {
            asset,
            currency,
            price,
            providerId,
            timestamp: Date.now()
          }
        }
      } catch (error) {
        continue
      }
    }

    throw new Error(`No price feed available for ${asset}`)
  }

  /**
   * Get providers that support specific asset operations
   */
  getProvidersForAsset(asset, operation) {
    const supportingProviders = []
    
    for (const [providerId, assets] of this.supportedAssets) {
      if (assets.includes(asset) || assets.includes('*')) {
        const provider = this.providers.get(providerId)
        if (provider && provider[operation === 'buy' ? 'buyAsset' : 'sellAsset']) {
          supportingProviders.push(providerId)
        }
      }
    }

    // Sort by health score
    return this.sortProvidersByHealth(supportingProviders)
  }
}

/**
 * Investment Provider Registry for tokenized assets
 */
export class InvestmentProviderRegistry extends ProviderRegistry {
  constructor() {
    super('investment')
    this.categories = new Map()
    this.minimumInvestments = new Map()
  }

  /**
   * Register investment provider
   */
  async registerProvider(providerId, provider, config = {}) {
    await super.registerProvider(providerId, provider, config)
    
    // Register investment categories
    if (config.categories) {
      this.categories.set(providerId, config.categories)
    }
    
    // Register minimum investments
    if (config.minimumInvestment) {
      this.minimumInvestments.set(providerId, config.minimumInvestment)
    }
  }

  /**
   * Purchase investment asset
   */
  async purchaseAsset(category, asset, amountUSD, chain, options = {}) {
    const providers = this.getProvidersForCategory(category)
    
    for (const providerId of providers) {
      try {
        const provider = this.providers.get(providerId)
        const minInvestment = this.minimumInvestments.get(providerId) || 0
        
        if (amountUSD < minInvestment) {
          continue // Skip if below minimum
        }

        const result = await provider.purchaseAsset({
          category,
          asset,
          amountUSD,
          chain,
          ...options
        })

        if (result.success) {
          await this.recordExecution(providerId, 'purchaseAsset', { category, asset, amountUSD })
          return {
            success: true,
            providerId,
            result: {
              transactionHash: result.transactionHash,
              tokensReceived: result.tokensReceived,
              tokenPrice: result.tokenPrice,
              fees: result.fees
            }
          }
        }
      } catch (error) {
        await this.recordFailure(providerId, 'purchaseAsset', error)
        continue
      }
    }

    throw new Error(`No available providers for ${category} investments`)
  }

  /**
   * Get available investment options
   */
  async getInvestmentOptions(category) {
    const providers = this.getProvidersForCategory(category)
    const options = []
    
    for (const providerId of providers) {
      try {
        const provider = this.providers.get(providerId)
        const assets = await provider.getAvailableAssets(category)
        
        options.push({
          providerId,
          category,
          assets,
          minimumInvestment: this.minimumInvestments.get(providerId) || 0
        })
      } catch (error) {
        continue
      }
    }

    return options
  }

  /**
   * Get providers for investment category
   */
  getProvidersForCategory(category) {
    const supportingProviders = []
    
    for (const [providerId, categories] of this.categories) {
      if (categories.includes(category) || categories.includes('*')) {
        supportingProviders.push(providerId)
      }
    }

    return this.sortProvidersByHealth(supportingProviders)
  }
}

/**
 * Bridge Provider Registry for cross-chain operations
 */
export class BridgeProviderRegistry extends ProviderRegistry {
  constructor() {
    super('bridge')
    this.supportedChains = new Map()
    this.bridgeRoutes = new Map()
  }

  /**
   * Register bridge provider
   */
  async registerProvider(providerId, provider, config = {}) {
    await super.registerProvider(providerId, provider, config)
    
    // Register supported chains
    if (config.supportedChains) {
      this.supportedChains.set(providerId, config.supportedChains)
    }
    
    // Register bridge routes
    if (config.routes) {
      this.bridgeRoutes.set(providerId, config.routes)
    }
  }

  /**
   * Execute cross-chain bridge
   */
  async bridgeAsset(fromChain, toChain, asset, amount, options = {}) {
    const providers = this.getProvidersForRoute(fromChain, toChain, asset)
    
    for (const providerId of providers) {
      try {
        const provider = this.providers.get(providerId)
        const result = await provider.bridge({
          fromChain,
          toChain,
          asset,
          amount,
          ...options
        })

        if (result.success) {
          await this.recordExecution(providerId, 'bridge', { fromChain, toChain, asset, amount })
          return {
            success: true,
            providerId,
            result: {
              sourceTransactionHash: result.sourceTransactionHash,
              destinationTransactionHash: result.destinationTransactionHash,
              bridgeId: result.bridgeId,
              estimatedTime: result.estimatedTime,
              fees: result.fees
            }
          }
        }
      } catch (error) {
        await this.recordFailure(providerId, 'bridge', error)
        continue
      }
    }

    throw new Error(`No available bridge providers for ${fromChain} to ${toChain}`)
  }

  /**
   * Get bridge quote
   */
  async getBridgeQuote(fromChain, toChain, asset, amount) {
    const providers = this.getProvidersForRoute(fromChain, toChain, asset)
    const quotes = []
    
    for (const providerId of providers) {
      try {
        const provider = this.providers.get(providerId)
        const quote = await provider.getQuote({
          fromChain,
          toChain,
          asset,
          amount
        })

        if (quote) {
          quotes.push({
            providerId,
            ...quote
          })
        }
      } catch (error) {
        continue
      }
    }

    // Sort by best rate (lowest fees)
    return quotes.sort((a, b) => a.total - b.total)
  }

  /**
   * Get providers for specific bridge route
   */
  getProvidersForRoute(fromChain, toChain, asset) {
    const supportingProviders = []
    
    for (const [providerId, routes] of this.bridgeRoutes) {
      const supportsRoute = routes.some(route => 
        route.from === fromChain && 
        route.to === toChain && 
        (route.assets.includes(asset) || route.assets.includes('*'))
      )
      
      if (supportsRoute) {
        supportingProviders.push(providerId)
      }
    }

    return this.sortProvidersByHealth(supportingProviders)
  }
}

/**
 * Mock Trading Provider
 */
export class MockTradingProvider {
  constructor(config = {}) {
    this.config = config
    this.supportedAssets = ['BTC', 'ETH', 'SOL', 'SUI', 'USDC']
  }

  async buyAsset({ asset, amountUSD, chain }) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    // Mock price calculation
    const prices = {
      BTC: 43250,
      ETH: 2680,
      SOL: 98.5,
      SUI: 3.45,
      USDC: 1.0
    }
    
    const price = prices[asset] || 1
    const slippage = 0.001 + Math.random() * 0.004 // 0.1% - 0.5% slippage
    const actualPrice = price * (1 + slippage)
    const assetAmount = amountUSD / actualPrice
    
    return {
      success: true,
      transactionHash: `tx_buy_${asset}_${Date.now()}`,
      assetAmount,
      actualPrice,
      slippage: slippage * 100
    }
  }

  async sellAsset({ asset, amount, chain }) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000))
    
    // Mock price calculation
    const prices = {
      BTC: 43250,
      ETH: 2680,
      SOL: 98.5,
      SUI: 3.45,
      USDC: 1.0
    }
    
    const price = prices[asset] || 1
    const slippage = 0.001 + Math.random() * 0.004 // 0.1% - 0.5% slippage
    const actualPrice = price * (1 - slippage)
    const usdReceived = amount * actualPrice
    
    return {
      success: true,
      transactionHash: `tx_sell_${asset}_${Date.now()}`,
      usdReceived,
      actualPrice,
      slippage: slippage * 100
    }
  }

  async getPrice(asset, currency = 'USD') {
    const prices = {
      BTC: 43250,
      ETH: 2680,
      SOL: 98.5,
      SUI: 3.45,
      USDC: 1.0
    }
    
    return prices[asset] * (0.99 + Math.random() * 0.02) // ±1% variation
  }
}

/**
 * Mock Investment Provider
 */
export class MockInvestmentProvider {
  constructor(config = {}) {
    this.config = config
    this.categories = ['gold', 'stocks', 'realestate']
  }

  async purchaseAsset({ category, asset, amountUSD, chain }) {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 2500))
    
    // Mock token calculation
    const tokenPrices = {
      gold: 2045.30, // Per ounce
      stocks: 1.0,   // Per dollar
      realestate: 100.0 // Per share
    }
    
    const tokenPrice = tokenPrices[category] || 1
    const tokensReceived = amountUSD / tokenPrice
    const fees = amountUSD * 0.005 // 0.5% fee
    
    return {
      success: true,
      transactionHash: `tx_invest_${category}_${Date.now()}`,
      tokensReceived,
      tokenPrice,
      fees
    }
  }

  async getAvailableAssets(category) {
    const assets = {
      gold: [
        { name: 'Gold Token', symbol: 'GOLD', description: 'Physical gold backed tokens' }
      ],
      stocks: [
        { name: 'S&P 500 Token', symbol: 'SPY', description: 'S&P 500 index exposure' },
        { name: 'Tech Token', symbol: 'TECH', description: 'Technology sector exposure' }
      ],
      realestate: [
        { name: 'REIT Token', symbol: 'REIT', description: 'Real estate investment trust' }
      ]
    }
    
    return assets[category] || []
  }
}

/**
 * Mock Bridge Provider
 */
export class MockBridgeProvider {
  constructor(config = {}) {
    this.config = config
    this.supportedChains = ['BTC', 'ETH', 'SOL', 'SUI']
  }

  async bridge({ fromChain, toChain, asset, amount }) {
    // Simulate bridge delay
    await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000))
    
    const fees = amount * 0.001 // 0.1% bridge fee
    const estimatedTime = 300 + Math.random() * 600 // 5-15 minutes
    
    return {
      success: true,
      sourceTransactionHash: `tx_source_${fromChain}_${Date.now()}`,
      destinationTransactionHash: `tx_dest_${toChain}_${Date.now() + 1000}`,
      bridgeId: `bridge_${Date.now()}`,
      estimatedTime,
      fees
    }
  }

  async getQuote({ fromChain, toChain, asset, amount }) {
    const baseFee = 5.0 // Base fee in USD
    const percentageFee = amount * 0.001 // 0.1%
    const total = baseFee + percentageFee
    const estimatedTime = 300 + Math.random() * 600 // 5-15 minutes
    
    return {
      fromChain,
      toChain,
      asset,
      amount,
      total,
      estimatedTime,
      rate: 1 - (total / amount)
    }
  }
}

export default {
  TradingProviderRegistry,
  InvestmentProviderRegistry,
  BridgeProviderRegistry,
  MockTradingProvider,
  MockInvestmentProvider,
  MockBridgeProvider
}