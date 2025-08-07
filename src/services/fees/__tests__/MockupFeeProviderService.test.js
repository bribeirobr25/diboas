/**
 * MockupFeeProviderService Tests
 * Verifies fee provider service functionality
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { MockupFeeProviderService } from '../MockupFeeProviderService.js'

describe('MockupFeeProviderService', () => {
  let feeProvider

  beforeEach(() => {
    feeProvider = new MockupFeeProviderService()
  })

  afterEach(() => {
    feeProvider.clearCache()
  })

  describe('Fee Data Loading', () => {
    test('should load diBoaS fees', async () => {
      const diboasFees = await feeProvider.getDiBoaSFees()
      
      expect(diboasFees).toMatchObject({
        add: 0.0009,
        withdraw: 0.009,
        send: 0.0009,
        transfer: 0.009,
        buy: 0.0009,
        sell: 0.0009,
        start_strategy: 0.0009,
        stop_strategy: 0.0009
      })
    })

    test('should load network fees', async () => {
      const networkFees = await feeProvider.getNetworkFees()
      
      expect(networkFees).toMatchObject({
        BTC: 0.01,
        ETH: 0.005,
        SOL: 0.000001,
        SUI: 0.000003
      })
    })

    test('should load payment provider fees', async () => {
      const providerFees = await feeProvider.getPaymentProviderFees()
      
      expect(providerFees).toHaveProperty('onramp')
      expect(providerFees).toHaveProperty('offramp')
      expect(providerFees.onramp).toMatchObject({
        apple_pay: 0.005,
        credit_debit_card: 0.01,
        paypal: 0.03
      })
    })

    test('should load DEX fees', async () => {
      const dexFees = await feeProvider.getDexFees()
      
      expect(dexFees).toMatchObject({
        standard: 0.008,
        solana: 0
      })
    })

    test('should load DeFi fees', async () => {
      const defiFees = await feeProvider.getDefiFees()
      
      expect(defiFees).toMatchObject({
        SOL: 0.007,
        ETH: 0.012,
        BTC: 0.015
      })
    })

    test('should load all fee data at once', async () => {
      const allFeeData = await feeProvider.getAllFeeData()
      
      expect(allFeeData).toHaveProperty('diboas')
      expect(allFeeData).toHaveProperty('network')
      expect(allFeeData).toHaveProperty('provider')
      expect(allFeeData).toHaveProperty('dex')
      expect(allFeeData).toHaveProperty('defi')
      expect(allFeeData).toHaveProperty('minimums')
      expect(allFeeData).toHaveProperty('timestamp')
    })
  })

  describe('Caching', () => {
    test('should cache fee data', async () => {
      const start = Date.now()
      await feeProvider.getAllFeeData()
      const firstCallTime = Date.now() - start

      const start2 = Date.now()
      await feeProvider.getAllFeeData()
      const secondCallTime = Date.now() - start2

      // Second call should be much faster due to cache
      expect(secondCallTime).toBeLessThan(firstCallTime)
    })

    test('should clear cache', () => {
      feeProvider.setCache('test', { data: 'test' })
      expect(feeProvider.getFromCache('test')).toBeTruthy()
      
      feeProvider.clearCache()
      expect(feeProvider.getFromCache('test')).toBeNull()
    })
  })

  describe('Health Check', () => {
    test('should perform health check', async () => {
      const health = await feeProvider.healthCheck()
      
      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('timestamp')
      expect(['healthy', 'unhealthy']).toContain(health.status)
    })
  })

  describe('Transaction-Specific Fees', () => {
    test('should get fees for specific transaction type', async () => {
      const sellFees = await feeProvider.getFeesForTransaction('sell', 'ETH', 'ETH')
      
      expect(sellFees).toHaveProperty('diboas')
      expect(sellFees).toHaveProperty('network')
      expect(sellFees).toHaveProperty('dex')
      expect(sellFees.diboas).toBe(0.0009) // 0.09%
      expect(sellFees.network).toBe(0.005)  // 0.5% for ETH
    })
  })
})