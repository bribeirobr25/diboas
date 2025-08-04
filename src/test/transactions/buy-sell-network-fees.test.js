/**
 * Buy/Sell Network Fee Tests
 * Tests to verify network fees are calculated correctly for buy/sell transactions
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FeeCalculator } from '../../utils/feeCalculations.js'

describe('Buy/Sell Network Fee Calculation Tests', () => {
  let feeCalculator

  beforeEach(() => {
    feeCalculator = new FeeCalculator()
  })

  describe('Buy Transaction Network Fees', () => {
    it('should calculate network fees for BTC buy with diBoaS wallet', async () => {
      const fees = await feeCalculator.calculateTransactionFees({
        type: 'buy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'BTC',
        chains: ['BTC']
      })

      console.log('BTC Buy Fees:', {
        total: fees.totalFees,
        diboas: fees.diboas,
        network: fees.networkFee,
        provider: fees.providerFee,
        dex: fees.dexFee
      })

      expect(fees.networkFee).toBeGreaterThan(0)
      expect(fees.networkFee).toBeCloseTo(90, 2) // 9% of 1000 = 90
      expect(fees.diboas).toBeCloseTo(0.9, 2) // 0.09%
      expect(fees.dexFee).toBeCloseTo(10, 2) // 1%
      expect(fees.providerFee).toBe(0) // No provider fee for diBoaS wallet
    })

    it('should calculate network fees for ETH buy with diBoaS wallet', async () => {
      const fees = await feeCalculator.calculateTransactionFees({
        type: 'buy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'ETH',
        chains: ['ETH']
      })

      console.log('ETH Buy Fees:', {
        total: fees.totalFees,
        diboas: fees.diboas,
        network: fees.networkFee,
        provider: fees.providerFee,
        dex: fees.dexFee
      })

      expect(fees.networkFee).toBeGreaterThan(0)
      expect(fees.networkFee).toBeCloseTo(5, 2) // 0.5% of 1000 = 5
      expect(fees.diboas).toBeCloseTo(0.9, 2) // 0.09%
      expect(fees.dexFee).toBeCloseTo(10, 2) // 1%
    })

    it('should calculate network fees for SOL buy with diBoaS wallet', async () => {
      const fees = await feeCalculator.calculateTransactionFees({
        type: 'buy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'SOL',
        chains: ['SOL']
      })

      console.log('SOL Buy Fees:', {
        total: fees.totalFees,
        diboas: fees.diboas,
        network: fees.networkFee,
        provider: fees.providerFee,
        dex: fees.dexFee
      })

      expect(fees.networkFee).toBeGreaterThan(0)
      expect(fees.networkFee).toBeCloseTo(0.01, 3) // 0.001% of 1000 = 0.01
      expect(fees.diboas).toBeCloseTo(0.9, 2) // 0.09%
      expect(fees.dexFee).toBeCloseTo(10, 2) // 1%
    })

    it('should calculate network fees for buy with external payment methods', async () => {
      const fees = await feeCalculator.calculateTransactionFees({
        type: 'buy',
        amount: 1000,
        paymentMethod: 'credit_debit_card',
        asset: 'BTC',
        chains: ['BTC']
      })

      console.log('BTC Buy with Credit Card:', {
        total: fees.totalFees,
        diboas: fees.diboas,
        network: fees.networkFee,
        provider: fees.providerFee,
        dex: fees.dexFee
      })

      expect(fees.networkFee).toBeGreaterThan(0)
      expect(fees.networkFee).toBeCloseTo(90, 2) // 9% network fee still applies
      expect(fees.providerFee).toBeCloseTo(10, 2) // 1% credit card fee
      expect(fees.dexFee).toBe(0) // No DEX fee for external payments
    })
  })

  describe('Sell Transaction Network Fees', () => {
    it('should calculate network fees for BTC sell with diBoaS wallet', async () => {
      const fees = await feeCalculator.calculateTransactionFees({
        type: 'sell',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'BTC',
        chains: ['BTC']
      })

      console.log('BTC Sell Fees:', {
        total: fees.totalFees,
        diboas: fees.diboas,
        network: fees.networkFee,
        provider: fees.providerFee,
        dex: fees.dexFee
      })

      expect(fees.networkFee).toBeGreaterThan(0)
      expect(fees.networkFee).toBeCloseTo(90, 2) // 9% of 1000 = 90
      expect(fees.diboas).toBeCloseTo(0.9, 2) // 0.09%
      expect(fees.dexFee).toBeCloseTo(10, 2) // 1%
      expect(fees.providerFee).toBe(0) // No provider fee for diBoaS wallet
    })

    it('should calculate network fees for ETH sell with diBoaS wallet', async () => {
      const fees = await feeCalculator.calculateTransactionFees({
        type: 'sell',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'ETH',
        chains: ['ETH']
      })

      console.log('ETH Sell Fees:', {
        total: fees.totalFees,
        diboas: fees.diboas,
        network: fees.networkFee,
        provider: fees.providerFee,
        dex: fees.dexFee
      })

      expect(fees.networkFee).toBeGreaterThan(0)
      expect(fees.networkFee).toBeCloseTo(5, 2) // 0.5% of 1000 = 5
      expect(fees.diboas).toBeCloseTo(0.9, 2) // 0.09%
      expect(fees.dexFee).toBeCloseTo(10, 2) // 1%
    })

    it('should calculate network fees for SUI sell with diBoaS wallet', async () => {
      const fees = await feeCalculator.calculateTransactionFees({
        type: 'sell',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'SUI',
        chains: ['SUI']
      })

      console.log('SUI Sell Fees:', {
        total: fees.totalFees,
        diboas: fees.diboas,
        network: fees.networkFee,
        provider: fees.providerFee,
        dex: fees.dexFee
      })

      expect(fees.networkFee).toBeGreaterThan(0)
      expect(fees.networkFee).toBeCloseTo(0.03, 3) // 0.003% of 1000 = 0.03
      expect(fees.diboas).toBeCloseTo(0.9, 2) // 0.09%
      expect(fees.dexFee).toBeCloseTo(10, 2) // 1%
    })
  })

  describe('Withdraw DEX Fee Tests', () => {
    it('should calculate DEX fees for banking withdraw transactions', async () => {
      const fees = await feeCalculator.calculateTransactionFees({
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'bank_account',
        asset: 'USDC',
        chains: ['SOL']
      })

      console.log('Banking Withdraw Fees:', {
        total: fees.totalFees,
        diboas: fees.diboas,
        network: fees.networkFee,
        provider: fees.providerFee,
        dex: fees.dexFee
      })

      expect(fees.dexFee).toBe(0) // FIXED: No DEX fee for off-ramp withdrawals
      expect(fees.diboas).toBeCloseTo(9, 2) // 0.9% diBoaS fee for withdrawals
      expect(fees.providerFee).toBeCloseTo(20, 2) // 2% bank account withdrawal fee
      expect(fees.totalFees).toBeCloseTo(29.01, 2) // Total: diBoaS + Network + Provider only
    })

    it('should calculate DEX fees for withdraw to different payment methods', async () => {
      const paymentMethods = [
        { method: 'bank_account', expectedProviderRate: 0.02 },
        { method: 'credit_debit_card', expectedProviderRate: 0.02 },
        { method: 'apple_pay', expectedProviderRate: 0.01 },
        { method: 'google_pay', expectedProviderRate: 0.01 }
      ]

      for (const { method, expectedProviderRate } of paymentMethods) {
        const fees = await feeCalculator.calculateTransactionFees({
          type: 'withdraw',
          amount: 1000,
          paymentMethod: method,
          asset: 'USDC',
          chains: ['SOL']
        })

        console.log(`Withdraw via ${method}:`, {
          total: fees.totalFees,
          dex: fees.dexFee,
          provider: fees.providerFee
        })

        expect(fees.dexFee).toBe(0) // FIXED: No DEX fee for off-ramp withdrawals
        expect(fees.providerFee).toBeCloseTo(1000 * expectedProviderRate, 2)
      }
    })
  })

  describe('Fee Structure Verification', () => {
    it('should have correct fee rates defined', () => {
      const rates = feeCalculator.getFeeRatesForTransaction('buy')
      
      expect(rates.diboas).toBe(0.0009) // 0.09%
      expect(rates.network.BTC).toBe(0.09) // 9%
      expect(rates.network.ETH).toBe(0.005) // 0.5%
      expect(rates.network.SOL).toBe(0.00001) // 0.001%
      expect(rates.network.SUI).toBe(0.00003) // 0.003%
      expect(rates.dex).toBe(0.01) // 1% for buy
    })

    it('should calculate all fee components for complex transactions', async () => {
      const complexTransaction = {
        type: 'buy',
        amount: 5000,
        paymentMethod: 'diboas_wallet',
        asset: 'BTC',
        chains: ['BTC']
      }

      const fees = await feeCalculator.calculateTransactionFees(complexTransaction)

      console.log('Complex BTC Buy (5000):', {
        total: fees.totalFees,
        diboas: fees.diboas,
        network: fees.networkFee,
        provider: fees.providerFee,
        dex: fees.dexFee,
        breakdown: fees
      })

      // Verify each component
      expect(fees.diboas).toBeCloseTo(4.5, 2) // 0.09% of 5000
      expect(fees.networkFee).toBeCloseTo(450, 2) // 9% of 5000
      expect(fees.dexFee).toBeCloseTo(50, 2) // 1% of 5000
      expect(fees.providerFee).toBe(0) // diBoaS wallet
      
      // Total should be sum of all components
      const expectedTotal = fees.diboas + fees.networkFee + fees.dexFee + fees.providerFee
      expect(fees.totalFees).toBeCloseTo(expectedTotal, 2)
    })
  })
})