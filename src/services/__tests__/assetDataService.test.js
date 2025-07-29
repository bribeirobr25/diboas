/**
 * Tests for AssetDataService
 * Comprehensive testing of asset data service functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { AssetDataService, CACHE_CONFIG, MOCK_ASSET_DATA } from '../assetDataService.js'

describe('AssetDataService', () => {
  let service

  beforeEach(() => {
    service = new AssetDataService()
    vi.useFakeTimers()
  })

  afterEach(() => {
    service.cleanup()
    vi.useRealTimers()
  })

  describe('Asset Info', () => {
    it('should get asset info for valid symbol', async () => {
      const info = await service.getAssetInfo('BTC')
      
      expect(info).toMatchObject({
        symbol: 'BTC',
        name: 'Bitcoin',
        icon: '₿',
        description: expect.any(String),
        website: expect.any(String),
        chain: 'BTC',
        decimals: 8
      })
      expect(info.lastUpdated).toBeTruthy()
    })

    it('should throw error for invalid symbol', async () => {
      await expect(service.getAssetInfo('INVALID')).rejects.toThrow('Asset INVALID not found')
    })

    it('should return cached data within cache time', async () => {
      const info1 = await service.getAssetInfo('BTC')
      const info2 = await service.getAssetInfo('BTC')
      
      expect(info1.lastUpdated).toBe(info2.lastUpdated)
    })

    it('should refresh data after cache expires', async () => {
      const info1 = await service.getAssetInfo('BTC')
      
      // Fast forward past cache expiry
      vi.advanceTimersByTime(CACHE_CONFIG.STATIC_DATA + 1000)
      
      const info2 = await service.getAssetInfo('BTC')
      
      expect(info1.lastUpdated).not.toBe(info2.lastUpdated)
    })
  })

  describe('Asset Price', () => {
    it('should get price data for valid symbol', async () => {
      const price = await service.getAssetPrice('BTC')
      
      expect(price).toMatchObject({
        symbol: 'BTC',
        price: expect.any(Number),
        change24h: expect.any(Number),
        changeAmount: expect.any(Number),
        trend: expect.stringMatching(/^(up|down)$/),
        high24h: expect.any(Number),
        low24h: expect.any(Number)
      })
      expect(price.lastUpdated).toBeTruthy()
    })

    it('should generate realistic price variations', async () => {
      const prices = []
      for (let i = 0; i < 10; i++) {
        const price = await service.getAssetPrice('BTC')
        prices.push(price.price)
        // Clear cache to get new price
        service.clearCache()
      }
      
      // Prices should vary but stay within reasonable bounds
      const min = Math.min(...prices)
      const max = Math.max(...prices)
      const variation = (max - min) / min
      
      expect(variation).toBeGreaterThan(0)
      expect(variation).toBeLessThan(0.1) // Less than 10% variation
    })

    it('should cache price data correctly', async () => {
      const price1 = await service.getAssetPrice('BTC')
      const price2 = await service.getAssetPrice('BTC')
      
      expect(price1.price).toBe(price2.price)
      expect(price1.lastUpdated).toBe(price2.lastUpdated)
    })
  })

  describe('Market Statistics', () => {
    it('should get market stats for valid symbol', async () => {
      const stats = await service.getMarketStats('BTC')
      
      expect(stats).toMatchObject({
        marketCap: expect.any(Number),
        volume24h: expect.any(Number),
        supply: expect.any(String),
        rank: expect.any(Number)
      })
      expect(stats.lastUpdated).toBeTruthy()
    })

    it('should return appropriate market cap values', async () => {
      const btcStats = await service.getMarketStats('BTC')
      const reitStats = await service.getMarketStats('REIT')
      
      expect(btcStats.marketCap).toBeGreaterThan(reitStats.marketCap)
      expect(btcStats.rank).toBeLessThan(reitStats.rank)
    })
  })

  describe('Complete Asset Data', () => {
    it('should get complete asset data', async () => {
      const data = await service.getCompleteAssetData('BTC')
      
      expect(data).toMatchObject({
        // Asset info
        symbol: 'BTC',
        name: 'Bitcoin',
        icon: '₿',
        description: expect.any(String),
        
        // Price data
        price: expect.any(Number),
        change24h: expect.any(Number),
        trend: expect.stringMatching(/^(up|down)$/),
        
        // Market stats
        marketCap: expect.any(Number),
        volume24h: expect.any(Number),
        rank: expect.any(Number),
        
        // Formatted data
        priceFormatted: expect.any(String),
        change24hFormatted: expect.any(String),
        changeAmountFormatted: expect.any(String),
        marketCapFormatted: expect.any(String),
        volume24hFormatted: expect.any(String)
      })
    })

    it('should format prices correctly', async () => {
      const btcData = await service.getCompleteAssetData('BTC')
      const suiData = await service.getCompleteAssetData('SUI')
      
      expect(btcData.priceFormatted).toMatch(/^\$[\d,]+\.\d{2}$/) // High value format
      expect(suiData.priceFormatted).toMatch(/^\$\d+\.\d{2,4}$/) // Low value format
    })

    it('should format percentages correctly', async () => {
      const data = await service.getCompleteAssetData('BTC')
      
      expect(data.change24hFormatted).toMatch(/^[+-]\d+\.\d{2}%$/)
    })

    it('should format market cap correctly', async () => {
      const btcData = await service.getCompleteAssetData('BTC')
      const reitData = await service.getCompleteAssetData('REIT')
      
      expect(btcData.marketCapFormatted).toMatch(/^\$\d+\.\d+[BTM]$/)
      expect(reitData.marketCapFormatted).toMatch(/^\$\d+\.\d+[KM]$/)
    })
  })

  describe('Price Subscriptions', () => {
    it('should allow subscription to price updates', async () => {
      const callback = vi.fn()
      const unsubscribe = service.subscribeToPriceUpdates('BTC', callback)
      
      expect(typeof unsubscribe).toBe('function')
      
      unsubscribe()
    })

    it('should call callback on price updates', async () => {
      const callback = vi.fn()
      const unsubscribe = service.subscribeToPriceUpdates('BTC', callback)
      
      // Trigger price update
      service.emitPriceUpdate('BTC', { symbol: 'BTC', price: 50000 })
      
      expect(callback).toHaveBeenCalledWith({ symbol: 'BTC', price: 50000 })
      
      unsubscribe()
    })

    it('should start automatic updates when subscribing', async () => {
      const callback = vi.fn()
      const unsubscribe = service.subscribeToPriceUpdates('BTC', callback)
      
      expect(service.updateIntervals.has('BTC')).toBe(true)
      
      unsubscribe()
      
      expect(service.updateIntervals.has('BTC')).toBe(false)
    })

    it('should handle multiple subscribers', async () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      
      const unsubscribe1 = service.subscribeToPriceUpdates('BTC', callback1)
      const unsubscribe2 = service.subscribeToPriceUpdates('BTC', callback2)
      
      service.emitPriceUpdate('BTC', { symbol: 'BTC', price: 50000 })
      
      expect(callback1).toHaveBeenCalled()
      expect(callback2).toHaveBeenCalled()
      
      unsubscribe1()
      unsubscribe2()
    })

    it('should stop updates when all subscribers unsubscribe', async () => {
      const callback1 = vi.fn()
      const callback2 = vi.fn()
      
      const unsubscribe1 = service.subscribeToPriceUpdates('BTC', callback1)
      const unsubscribe2 = service.subscribeToPriceUpdates('BTC', callback2)
      
      expect(service.updateIntervals.has('BTC')).toBe(true)
      
      unsubscribe1()
      expect(service.updateIntervals.has('BTC')).toBe(true) // Still has subscriber
      
      unsubscribe2()
      expect(service.updateIntervals.has('BTC')).toBe(false) // No more subscribers
    })
  })

  describe('Cache Management', () => {
    it('should store and retrieve from cache', () => {
      const testData = { test: 'data' }
      service.setCache('test-key', testData)
      
      const retrieved = service.getFromCache('test-key', 1000)
      expect(retrieved).toEqual(testData)
    })

    it('should return null for expired cache', () => {
      const testData = { test: 'data' }
      service.setCache('test-key', testData)
      
      // Fast forward past expiry
      vi.advanceTimersByTime(2000)
      
      const retrieved = service.getFromCache('test-key', 1000)
      expect(retrieved).toBeNull()
    })

    it('should clear cache completely', () => {
      service.setCache('test-key-1', { test: 'data1' })
      service.setCache('test-key-2', { test: 'data2' })
      
      service.clearCache()
      
      expect(service.getFromCache('test-key-1', 1000)).toBeNull()
      expect(service.getFromCache('test-key-2', 1000)).toBeNull()
    })
  })

  describe('Format Helpers', () => {
    it('should format prices correctly', () => {
      expect(service.formatPrice(43250.50)).toBe('$43,250.50')
      expect(service.formatPrice(2.5678)).toBe('$2.57')
      expect(service.formatPrice(0.1234)).toBe('$0.1234')
    })

    it('should format percentages correctly', () => {
      expect(service.formatPercentage(2.45)).toBe('+2.45%')
      expect(service.formatPercentage(-1.23)).toBe('-1.23%')
      expect(service.formatPercentage(0)).toBe('+0.00%')
    })

    it('should format market cap correctly', () => {
      expect(service.formatMarketCap(1.5e12)).toBe('$1.5T')
      expect(service.formatMarketCap(850.2e9)).toBe('$850.2B')
      expect(service.formatMarketCap(540.2e6)).toBe('$540.2M')
      expect(service.formatMarketCap(1500)).toBe('$1.5K')
    })

    it('should format volume correctly', () => {
      expect(service.formatVolume(28.4e9)).toBe('$28.4B')
      expect(service.formatVolume(15.2e9)).toBe('$15.2B')
      expect(service.formatVolume(890e3)).toBe('$890.0K')
    })
  })

  describe('Error Handling', () => {
    it('should handle subscription callback errors gracefully', () => {
      const faultyCallback = vi.fn(() => {
        throw new Error('Callback error')
      })
      
      const unsubscribe = service.subscribeToPriceUpdates('BTC', faultyCallback)
      
      expect(() => {
        service.emitPriceUpdate('BTC', { symbol: 'BTC', price: 50000 })
      }).not.toThrow()
      
      unsubscribe()
    })

    it('should cleanup all resources on cleanup', () => {
      const callback = vi.fn()
      service.subscribeToPriceUpdates('BTC', callback)
      service.subscribeToPriceUpdates('ETH', callback)
      service.setCache('test-key', { test: 'data' })
      
      expect(service.updateIntervals.size).toBeGreaterThan(0)
      expect(service.subscriptions.size).toBeGreaterThan(0)
      expect(service.cache.size).toBeGreaterThan(0)
      
      service.cleanup()
      
      expect(service.updateIntervals.size).toBe(0)
      expect(service.subscriptions.size).toBe(0)
      expect(service.cache.size).toBe(0)
    })
  })

  describe('Mock Data Validation', () => {
    it('should have valid mock data for all supported assets', () => {
      const supportedAssets = ['BTC', 'ETH', 'SOL', 'SUI', 'PAXG', 'XAUT', 'MAG7', 'SPX', 'REIT']
      
      supportedAssets.forEach(symbol => {
        const mockData = MOCK_ASSET_DATA[symbol]
        expect(mockData).toBeDefined()
        expect(mockData.symbol).toBe(symbol)
        expect(mockData.name).toBeTruthy()
        expect(mockData.description).toBeTruthy()
        expect(mockData.chain).toBeTruthy()
        expect(typeof mockData.decimals).toBe('number')
      })
    })

    it('should have consistent data structure across all assets', () => {
      Object.values(MOCK_ASSET_DATA).forEach(assetData => {
        expect(assetData).toMatchObject({
          symbol: expect.any(String),
          name: expect.any(String),
          icon: expect.any(String),
          description: expect.any(String),
          website: expect.any(String),
          chain: expect.any(String),
          decimals: expect.any(Number)
        })
      })
    })
  })
})