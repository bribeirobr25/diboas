import logger from '../../utils/logger'

/**
 * Transaction System Integration
 * Extends the main integration manager with transaction capabilities
 */

import { 
  TradingProviderRegistry,
  InvestmentProviderRegistry,
  BridgeProviderRegistry,
  MockTradingProvider,
  MockInvestmentProvider,
  MockBridgeProvider
} from './IntegrationRegistry.js'

/**
 * Initialize transaction-specific providers
 */
export async function initializeTransactionProviders(integrationManager) {
  try {
    // Extend integration manager if needed
    try {
      const { extendIntegrationManager } = await import('../integrations/IntegrationManagerExtensions.js')
      extendIntegrationManager(integrationManager)
    } catch (error) {
      logger.warn('Could not extend integration manager:', error.message)
    }
    
    // Initialize trading registry
    const tradingRegistry = new TradingProviderRegistry()
    
    // Register mock trading provider
    await tradingRegistry.registerProvider('mock_dex', new MockTradingProvider(), {
      name: 'Mock DEX',
      supportedAssets: ['BTC', 'ETH', 'SOL', 'SUI', 'USDC'],
      priceFeeds: ['BTC', 'ETH', 'SOL', 'SUI', 'USDC'],
      enabled: true
    })

    // Register trading registry with integration manager
    integrationManager.registerRegistry('trading', tradingRegistry)

    // Initialize investment registry
    const investmentRegistry = new InvestmentProviderRegistry()
    
    // Register mock investment provider
    await investmentRegistry.registerProvider('mock_investment', new MockInvestmentProvider(), {
      name: 'Mock Investment Platform',
      categories: ['gold', 'stocks', 'realestate'],
      minimumInvestment: 10,
      enabled: true
    })

    // Register investment registry with integration manager
    integrationManager.registerRegistry('investment', investmentRegistry)

    // Initialize bridge registry
    const bridgeRegistry = new BridgeProviderRegistry()
    
    // Register mock bridge provider
    await bridgeRegistry.registerProvider('mock_bridge', new MockBridgeProvider(), {
      name: 'Mock Cross-Chain Bridge',
      supportedChains: ['BTC', 'ETH', 'SOL', 'SUI'],
      routes: [
        { from: 'BTC', to: 'SOL', assets: ['BTC', 'USDC'] },
        { from: 'ETH', to: 'SOL', assets: ['ETH', 'USDC'] },
        { from: 'SUI', to: 'SOL', assets: ['SUI', 'USDC'] },
        { from: 'SOL', to: 'BTC', assets: ['USDC'] },
        { from: 'SOL', to: 'ETH', assets: ['USDC'] },
        { from: 'SOL', to: 'SUI', assets: ['USDC'] }
      ],
      enabled: true
    })

    // Register bridge registry with integration manager
    integrationManager.registerRegistry('bridge', bridgeRegistry)

    logger.debug('Transaction providers initialized successfully')
    return { success: true }
  } catch (error) {
    logger.error('Failed to initialize transaction providers:', error)
    throw error
  }
}

/**
 * Transaction provider configurations for production
 */
export const TRANSACTION_PROVIDER_CONFIGS = {
  // DEX/Trading providers
  trading: {
    jupiter: {
      name: 'Jupiter (Solana)',
      endpoint: 'https://quote-api.jup.ag/v6',
      supportedChains: ['SOL'],
      supportedAssets: ['SOL', 'USDC', 'BTC', 'ETH'],
      fees: { swap: 0.003 }
    },
    oneInch: {
      name: '1inch (Ethereum)',
      endpoint: 'https://api.1inch.exchange/v5.0/1',
      supportedChains: ['ETH'],
      supportedAssets: ['ETH', 'USDC', 'BTC'],
      fees: { swap: 0.003 }
    },
    uniswap: {
      name: 'Uniswap V3',
      endpoint: 'https://api.uniswap.org/v1',
      supportedChains: ['ETH'],
      supportedAssets: ['ETH', 'USDC', 'BTC'],
      fees: { swap: 0.003 }
    }
  },

  // Bridge providers
  bridge: {
    wormhole: {
      name: 'Wormhole Bridge',
      endpoint: 'https://api.wormhole.com',
      supportedChains: ['ETH', 'SOL', 'SUI'],
      supportedAssets: ['USDC', 'ETH'],
      fees: { bridge: 0.001 }
    },
    layerZero: {
      name: 'LayerZero',
      endpoint: 'https://api.layerzero.network',
      supportedChains: ['ETH', 'SOL'],
      supportedAssets: ['USDC'],
      fees: { bridge: 0.0015 }
    }
  },

  // Investment providers
  investment: {
    backed: {
      name: 'Backed Finance',
      endpoint: 'https://api.backed.fi',
      categories: ['stocks'],
      minimumInvestment: 1,
      fees: { purchase: 0.005 }
    },
    tether_gold: {
      name: 'Tether Gold',
      endpoint: 'https://api.tether.to/gold',
      categories: ['gold'],
      minimumInvestment: 50,
      fees: { purchase: 0.0075 }
    },
    realt: {
      name: 'RealT',
      endpoint: 'https://api.realt.co',
      categories: ['realestate'],
      minimumInvestment: 100,
      fees: { purchase: 0.01 }
    }
  }
}

/**
 * Provider health check configurations
 */
export const PROVIDER_HEALTH_CHECKS = {
  trading: {
    checkInterval: 30000, // 30 seconds
    healthEndpoint: '/health',
    timeout: 5000,
    retryAttempts: 3
  },
  bridge: {
    checkInterval: 60000, // 1 minute
    healthEndpoint: '/status',
    timeout: 10000,
    retryAttempts: 2
  },
  investment: {
    checkInterval: 300000, // 5 minutes
    healthEndpoint: '/api/health',
    timeout: 15000,
    retryAttempts: 2
  }
}

export default {
  initializeTransactionProviders,
  TRANSACTION_PROVIDER_CONFIGS,
  PROVIDER_HEALTH_CHECKS
}