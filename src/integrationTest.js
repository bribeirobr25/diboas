/**
 * Integration Test for Abstraction Layer
 * Verify that the abstraction layer is working correctly
 */

import { marketDataRegistry } from './services/integrations/marketData/MarketDataProviderRegistry.js'
import { CoinGeckoProvider } from './services/integrations/marketData/providers/CoinGeckoProvider.js'
import { marketDataService } from './services/marketData/MarketDataService.js'
import logger from './utils/logger'

logger.debug('🧪 Testing abstraction layer...')

// Test 1: Provider registration works
try {
  const provider = new CoinGeckoProvider()
  logger.debug('✅ CoinGecko provider created successfully')
  
  // Test 2: Registry accepts provider
  await marketDataRegistry.registerProvider('test-coingecko', provider, {
    priority: 10,
    features: ['crypto-data']
  })
  logger.debug('✅ Provider registered successfully')
  
  // Test 3: Business service can initialize
  await marketDataService.initializeProviders()
  logger.debug('✅ MarketDataService initialized successfully')
  
  logger.debug('🎉 All abstraction layer tests passed!')
  
} catch (error) {
  logger.error('❌ Abstraction layer test failed:', error.message)
}