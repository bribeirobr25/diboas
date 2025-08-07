/**
 * Investment Buy Network Fee Display Issue Test
 * Testing the specific issue where network fee label shows correct percentage
 * but the dollar value is wrong in the UI
 */

import { describe, it, expect } from 'vitest'
import { FeeCalculator } from '../../utils/feeCalculations.js'

describe('Investment Buy Network Fee Display Issue', () => {
  let feeCalculator

  beforeEach(() => {
    feeCalculator = new FeeCalculator()
  })

  describe('Buy Transaction Network Fee Values', () => {
    it('should have correct network fee values for different assets', async () => {
      const testCases = [
        { asset: 'BTC', expectedNetwork: 90, expectedRate: 0.09 },
        { asset: 'ETH', expectedNetwork: 5, expectedRate: 0.005 },
        { asset: 'SUI', expectedNetwork: 0.03, expectedRate: 0.00003 },
        { asset: 'SOL', expectedNetwork: 0.01, expectedRate: 0.00001 }
      ]

      for (const { asset, expectedNetwork, expectedRate } of testCases) {
        console.log(`\n=== Testing ${asset} Buy Transaction ===`)
        
        const fees = await feeCalculator.calculateTransactionFees({
          type: 'buy',
          amount: 1000,
          paymentMethod: 'diboas_wallet',
          asset: asset,
          chains: [asset === 'SOL' ? 'SOL' : asset] // SOL uses SOL chain, others use their own
        })

        console.log(`Network Fee Value: $${fees.network}`)
        console.log(`Network Fee (networkFee property): $${fees.networkFee}`)
        console.log(`Expected: $${expectedNetwork}`)
        console.log(`Total Fees: $${fees.total}`)
        console.log(`All fee properties:`, {
          diBoaS: fees.diBoaS,
          network: fees.network,
          networkFee: fees.networkFee,
          provider: fees.provider,
          dex: fees.dex,
          total: fees.total
        })

        // Verify the network fee values match
        expect(fees.network).toBeCloseTo(expectedNetwork, 2)
        expect(fees.networkFee).toBeCloseTo(expectedNetwork, 2)
        
        // Verify both properties have the same value
        expect(fees.network).toBeCloseTo(fees.networkFee, 3)
        
        // Verify breakdown has correct rate and amount
        expect(fees.breakdown.network.rate).toBeCloseTo(expectedRate, 5)
        expect(fees.breakdown.network.amount).toBeCloseTo(expectedNetwork, 2)
      }
    })

    it('should verify UI display values match calculated values', async () => {
      // Test the exact scenario from user report - BTC buy
      const btcBuyFees = await feeCalculator.calculateTransactionFees({
        type: 'buy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'BTC',
        chains: ['BTC']
      })

      console.log('\n=== BTC Buy Fee Analysis ===')
      console.log('Values that should be displayed in UI:')
      console.log(`diBoaS Fee: $${btcBuyFees.diBoaS} (should show this value)`)
      console.log(`Network Fee: $${btcBuyFees.network} (should show this value)`)
      console.log(`DEX Fee: $${btcBuyFees.dex} (should show this value)`)
      console.log(`Total: $${btcBuyFees.total}`)
      
      console.log('\nBreakdown object:')
      console.log(`Network rate: ${btcBuyFees.breakdown.network.rate * 100}%`)
      console.log(`Network amount: $${btcBuyFees.breakdown.network.amount}`)

      // The UI should display these values
      expect(btcBuyFees.network).toBe(90) // $90 network fee for BTC
      expect(btcBuyFees.breakdown.network.amount).toBe(90)
      expect(btcBuyFees.breakdown.network.rate).toBe(0.09) // 9%
    })

    it('should compare buy vs sell network fees to ensure consistency', async () => {
      // Test that buy and sell have the same network fees for the same asset
      const buyFees = await feeCalculator.calculateTransactionFees({
        type: 'buy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'ETH',
        chains: ['ETH']
      })

      const sellFees = await feeCalculator.calculateTransactionFees({
        type: 'sell',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'ETH',
        chains: ['ETH']
      })

      console.log('\n=== Buy vs Sell Network Fee Comparison ===')
      console.log(`ETH Buy Network Fee: $${buyFees.network}`)
      console.log(`ETH Sell Network Fee: $${sellFees.network}`)

      // Network fees should be identical for buy and sell
      expect(buyFees.network).toBeCloseTo(sellFees.network, 3)
      expect(buyFees.networkFee).toBeCloseTo(sellFees.networkFee, 3)
    })
  })

  describe('Potential UI Mapping Issues', () => {
    it('should check all fee property variations', async () => {
      const fees = await feeCalculator.calculateTransactionFees({
        type: 'buy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'SUI',
        chains: ['SUI']
      })

      console.log('\n=== All Fee Properties ===')
      console.log('Main properties:')
      console.log(`fees.network: $${fees.network}`)
      console.log(`fees.networkFee: $${fees.networkFee}`)
      
      console.log('\nBreakdown properties:')
      console.log(`fees.breakdown.network.amount: $${fees.breakdown.network.amount}`)
      console.log(`fees.breakdown.network.rate: ${fees.breakdown.network.rate}`)

      // All network fee references should have the same value
      expect(fees.network).toBeCloseTo(fees.networkFee, 3)
      expect(fees.network).toBeCloseTo(fees.breakdown.network.amount, 3)
    })
  })
})