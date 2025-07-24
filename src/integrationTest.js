/**
 * Integration Test for Abstraction Layer
 * Verify that the abstraction layer is working correctly
 */

import { marketDataRegistry } from './services/integrations/marketData/MarketDataProviderRegistry.js'
import { CoinGeckoProvider } from './services/integrations/marketData/providers/CoinGeckoProvider.js'
import { marketDataService } from './services/marketData/MarketDataService.js'

console.log('🧪 Testing abstraction layer...')

// Test 1: Provider registration works
try {
  const provider = new CoinGeckoProvider()
  console.log('✅ CoinGecko provider created successfully')
  
  // Test 2: Registry accepts provider
  await marketDataRegistry.registerProvider('test-coingecko', provider, {
    priority: 10,
    features: ['crypto-data']
  })
  console.log('✅ Provider registered successfully')
  
  // Test 3: Business service can initialize
  await marketDataService.initializeProviders()
  console.log('✅ MarketDataService initialized successfully')
  
  console.log('🎉 All abstraction layer tests passed!')
  
} catch (error) {
  console.error('❌ Abstraction layer test failed:', error.message)
}