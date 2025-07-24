/**
 * Integration Tests for Market Data System
 * Tests the complete flow from provider registry to component display
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MarketDataProviderRegistry } from '../../services/integrations/marketData/MarketDataProviderRegistry.js'
import { CoinGeckoProvider } from '../../services/integrations/marketData/providers/CoinGeckoProvider.js'
import { MarketDataService } from '../../services/marketData/MarketDataService.js'
import { mockFetch, mockApiResponses } from '../utils/testHelpers.js'

describe('Market Data Integration', () => {
  let registry
  let mockProvider
  let marketDataService
  
  beforeEach(() => {
    registry = new MarketDataProviderRegistry()
    mockProvider = new CoinGeckoProvider()
    marketDataService = new MarketDataService()
    
    // Mock fetch for API calls
    mockFetch(mockApiResponses)
  })
  
  afterEach(() => {
    vi.clearAllMocks()
  })
  
  describe('Provider Registry Integration', () => {
    it('should register and manage multiple providers', async () => {
      // Register primary provider
      await registry.registerProvider('coingecko', mockProvider, {
        priority: 10,
        features: ['crypto-data']
      })
      
      // Register fallback provider
      const mockFallbackProvider = {
        healthCheck: vi.fn().mockResolvedValue({ healthy: true }),
        getCryptoData: vi.fn().mockResolvedValue([
          { symbol: 'BTC', price: 43000, change24h: 2.0 }
        ])
      }
      
      await registry.registerProvider('fallback', mockFallbackProvider, {
        priority: 5,
        features: ['crypto-data']
      })
      
      const providers = registry.getRegisteredProviders()
      expect(providers).toHaveLength(2)
      expect(providers[0].providerId).toBe('coingecko') // Higher priority first
    })
    
    it('should automatically failover to backup provider', async () => {
      // Register failing primary provider
      const failingProvider = {
        healthCheck: vi.fn().mockResolvedValue({ healthy: false }),
        getCryptoData: vi.fn().mockRejectedValue(new Error('API Error'))
      }
      
      await registry.registerProvider('failing', failingProvider, {
        priority: 10,
        features: ['crypto-data']
      })
      
      // Register working backup provider
      const workingProvider = {
        healthCheck: vi.fn().mockResolvedValue({ healthy: true }),
        getCryptoData: vi.fn().mockResolvedValue([
          { symbol: 'BTC', price: 43000, change24h: 2.0, provider: 'backup' }
        ])
      }
      
      await registry.registerProvider('backup', workingProvider, {
        priority: 5,
        features: ['crypto-data']
      })
      
      // Request should succeed via backup provider
      const result = await registry.getCryptoData(['BTC'])
      
      expect(result).toHaveLength(1)
      expect(result[0].provider).toBe('backup')
      expect(workingProvider.getCryptoData).toHaveBeenCalled()
    })
    
    it('should handle rate limiting across providers', async () => {
      // Mock rate-limited provider
      const rateLimitedProvider = {
        healthCheck: vi.fn().mockResolvedValue({ healthy: true }),
        getCryptoData: vi.fn()
          .mockRejectedValueOnce(new Error('Rate limit exceeded'))
          .mockResolvedValue([{ symbol: 'BTC', price: 43000 }])
      }
      
      await registry.registerProvider('rate-limited', rateLimitedProvider, {
        priority: 10,
        features: ['crypto-data'],
        rateLimit: 1 // Very low rate limit
      })
      
      // First call should fail due to rate limiting
      await expect(registry.getCryptoData(['BTC'])).rejects.toThrow()
      
      // Wait for rate limit reset and try again
      await new Promise(resolve => setTimeout(resolve, 1100))
      
      const result = await registry.getCryptoData(['BTC'])
      expect(result).toHaveLength(1)
    })
  })
  
  describe('Service Layer Integration', () => {
    it('should integrate with DataManager for events', async () => {
      const eventEmissions = []
      
      // Mock DataManager
      const mockDataManager = {
        emit: vi.fn((event, data) => {
          eventEmissions.push({ event, data })
        }),
        subscribe: vi.fn(() => vi.fn())
      }
      
      // Initialize service with mocked DataManager
      marketDataService.dataManager = mockDataManager
      
      await registry.registerProvider('test', mockProvider, {
        priority: 10,
        features: ['crypto-data']
      })
      
      // Mock successful API response
      vi.spyOn(mockProvider, 'getCryptoData').mockResolvedValue([
        { symbol: 'BTC', price: 43250.50, change24h: 2.4 }
      ])
      
      // Update crypto data
      await marketDataService.updateCryptoData()
      
      // Check that events were emitted
      const cryptoUpdateEvent = eventEmissions.find(e => e.event === 'market:crypto:updated')
      expect(cryptoUpdateEvent).toBeDefined()
      expect(cryptoUpdateEvent.data).toHaveLength(1)
      expect(cryptoUpdateEvent.data[0].symbol).toBe('BTC')
    })
    
    it('should handle service initialization and health checks', async () => {
      await registry.registerProvider('health-test', mockProvider, {
        priority: 10,
        features: ['crypto-data']
      })
      
      // Mock health check
      vi.spyOn(mockProvider, 'healthCheck').mockResolvedValue({
        healthy: true,
        latency: 1250,
        timestamp: new Date().toISOString()
      })
      
      await marketDataService.initializeProviders()
      
      const healthStatus = await marketDataService.getHealthStatus()
      expect(healthStatus.isActive).toBe(true)
      expect(healthStatus.providerHealth).toBeDefined()
    })
  })
  
  describe('End-to-End Data Flow', () => {
    it('should complete full data flow from API to component', async () => {
      // Setup complete chain
      await registry.registerProvider('e2e-test', mockProvider, {
        priority: 10,
        features: ['crypto-data']
      })
      
      // Mock CoinGecko API response
      const mockCoinGeckoResponse = {
        bitcoin: {
          usd: 43250.50,
          usd_24h_change: 2.4,
          usd_market_cap: 845000000000,
          usd_24h_vol: 28000000000
        },
        ethereum: {
          usd: 2680.75,
          usd_24h_change: -1.2,
          usd_market_cap: 322000000000,
          usd_24h_vol: 15000000000
        }
      }
      
      vi.spyOn(mockProvider, 'getCryptoData').mockImplementation(async (assets) => {
        // Simulate transformation that real provider does
        return assets.map(asset => ({
          symbol: asset.toUpperCase(),
          name: asset === 'bitcoin' ? 'Bitcoin' : 'Ethereum',
          price: mockCoinGeckoResponse[asset.toLowerCase()].usd,
          change24h: mockCoinGeckoResponse[asset.toLowerCase()].usd_24h_change,
          marketCap: mockCoinGeckoResponse[asset.toLowerCase()].usd_market_cap,
          volume24h: mockCoinGeckoResponse[asset.toLowerCase()].usd_24h_vol,
          lastUpdate: new Date().toISOString(),
          source: 'coingecko',
          provider: 'CoinGecko'
        }))
      })
      
      // Initialize the service
      marketDataService.registry = registry
      
      // Request data through the service
      await marketDataService.updateCryptoData()
      
      // Verify data was processed correctly
      const cryptoData = marketDataService.getMarketData('crypto')
      expect(cryptoData).toHaveLength(2) // BTC and ETH
      
      const btcData = cryptoData.find(item => item.symbol === 'BTC')
      expect(btcData.price).toBe(43250.50)
      expect(btcData.change24h).toBe(2.4)
      expect(btcData.provider).toBe('CoinGecko')
    })
    
    it('should handle error recovery in complete flow', async () => {
      // Setup registry with failing primary and working backup
      const failingProvider = {
        healthCheck: vi.fn().mockResolvedValue({ healthy: false }),
        getCryptoData: vi.fn().mockRejectedValue(new Error('Provider unavailable'))
      }
      
      const backupProvider = {
        healthCheck: vi.fn().mockResolvedValue({ healthy: true }),
        getCryptoData: vi.fn().mockResolvedValue([
          {
            symbol: 'BTC',
            price: 42000, // Different price from backup
            change24h: 1.5,
            provider: 'Backup Provider'
          }
        ])
      }
      
      await registry.registerProvider('failing', failingProvider, {
        priority: 10,
        features: ['crypto-data']
      })
      
      await registry.registerProvider('backup', backupProvider, {
        priority: 5,
        features: ['crypto-data']
      })
      
      marketDataService.registry = registry
      
      // Service should gracefully handle primary failure and use backup
      await marketDataService.updateCryptoData()
      
      const cryptoData = marketDataService.getMarketData('crypto')
      expect(cryptoData).toHaveLength(1)
      expect(cryptoData[0].provider).toBe('Backup Provider')
      expect(cryptoData[0].price).toBe(42000)
    })
  })
  
  describe('Performance Integration', () => {
    it('should handle concurrent requests efficiently', async () => {
      await registry.registerProvider('concurrent-test', mockProvider, {
        priority: 10,
        features: ['crypto-data']
      })
      
      // Mock provider with delay to simulate real API
      vi.spyOn(mockProvider, 'getCryptoData').mockImplementation(async (assets) => {
        await new Promise(resolve => setTimeout(resolve, 100))
        return assets.map(asset => ({ 
          symbol: asset.toUpperCase(), 
          price: Math.random() * 50000 
        }))
      })
      
      const startTime = Date.now()
      
      // Make multiple concurrent requests
      const requests = [
        registry.getCryptoData(['BTC']),
        registry.getCryptoData(['ETH']),
        registry.getCryptoData(['SOL'])
      ]
      
      const results = await Promise.all(requests)
      const endTime = Date.now()
      
      // All requests should complete
      expect(results).toHaveLength(3)
      results.forEach(result => {
        expect(result).toHaveLength(1)
      })
      
      // Should complete in reasonable time (not 300ms if truly concurrent)
      expect(endTime - startTime).toBeLessThan(200)
    })
  })
})