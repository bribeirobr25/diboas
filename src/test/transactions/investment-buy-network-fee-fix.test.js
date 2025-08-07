/**
 * Investment Buy Network Fee Fix Test
 * Verifies that Buy transactions now correctly calculate network fees
 * based on the target asset's chain, not source chain
 * Also tests provider fee calculations for external payment methods
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FeeCalculator } from '../../utils/feeCalculations.js'

describe('Investment Buy Network Fee Fix', () => {
  let feeCalculator

  beforeEach(() => {
    feeCalculator = new FeeCalculator()
  })

  describe('Fixed Network Fee Calculations for Buy Transactions', () => {
    it('should calculate correct network fees for BTC buy transaction', async () => {
      // Using the fixed chain configuration
      const btcBuy = await feeCalculator.calculateTransactionFees({
        type: 'buy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'BTC',
        chains: ['BTC'] // Fixed: now uses BTC chain for network fees
      })

      console.log('BTC Buy (FIXED):')
      console.log(`Network Fee: $${btcBuy.network} (should be $90)`)
      console.log(`Network Rate: ${btcBuy.breakdown.network.rate * 100}% (should be 9%)`)
      console.log(`Total: $${btcBuy.total}`)

      expect(btcBuy.network).toBeCloseTo(90, 2) // 9% of $1000
      expect(btcBuy.networkFee).toBeCloseTo(90, 2) // Legacy property
      expect(btcBuy.breakdown.network.rate).toBe(0.09) // 9%
      expect(btcBuy.total).toBeCloseTo(100.9, 2) // $0.9 + $90 + $10 DEX
    })

    it('should calculate correct network fees for ETH buy transaction', async () => {
      const ethBuy = await feeCalculator.calculateTransactionFees({
        type: 'buy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'ETH',
        chains: ['ETH'] // Fixed: now uses ETH chain
      })

      console.log('\nETH Buy (FIXED):')
      console.log(`Network Fee: $${ethBuy.network} (should be $5)`)
      console.log(`Network Rate: ${ethBuy.breakdown.network.rate * 100}% (should be 0.5%)`)
      console.log(`Total: $${ethBuy.total}`)

      expect(ethBuy.network).toBeCloseTo(5, 2) // 0.5% of $1000
      expect(ethBuy.breakdown.network.rate).toBe(0.005) // 0.5%
      expect(ethBuy.total).toBeCloseTo(15.9, 2)
    })

    it('should calculate correct network fees for SUI buy transaction', async () => {
      const suiBuy = await feeCalculator.calculateTransactionFees({
        type: 'buy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'SUI',
        chains: ['SUI'] // Fixed: now uses SUI chain
      })

      console.log('\nSUI Buy (FIXED):')
      console.log(`Network Fee: $${suiBuy.network} (should be $0.03)`)
      console.log(`Network Rate: ${suiBuy.breakdown.network.rate * 100}% (should be 0.003%)`)
      console.log(`Total: $${suiBuy.total}`)

      expect(suiBuy.network).toBeCloseTo(0.03, 3) // 0.003% of $1000
      expect(suiBuy.breakdown.network.rate).toBe(0.00003) // 0.003%
      expect(suiBuy.total).toBeCloseTo(10.93, 2)
    })

    it('should maintain correct network fees for SOL buy transaction', async () => {
      const solBuy = await feeCalculator.calculateTransactionFees({
        type: 'buy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'SOL',
        chains: ['SOL'] // SOL remains the same
      })

      console.log('\nSOL Buy (unchanged):')
      console.log(`Network Fee: $${solBuy.network} (should be $0.01)`)
      console.log(`Network Rate: ${solBuy.breakdown.network.rate * 100}% (should be 0.001%)`)
      console.log(`Total: $${solBuy.total}`)

      expect(solBuy.network).toBeCloseTo(0.01, 3) // 0.001% of $1000
      expect(solBuy.breakdown.network.rate).toBe(0.00001) // 0.001%
      expect(solBuy.total).toBeCloseTo(10.91, 2)
    })
  })

  describe('Verify Fix Addresses the Original Issue', () => {
    it('should show correct network fee values that match the labels', async () => {
      const testCases = [
        { 
          asset: 'BTC', 
          expectedFee: 90, 
          expectedRate: '9%',
          description: 'BTC should show $90 network fee (9%)'
        },
        { 
          asset: 'ETH', 
          expectedFee: 5, 
          expectedRate: '0.5%',
          description: 'ETH should show $5 network fee (0.5%)'
        },
        { 
          asset: 'SUI', 
          expectedFee: 0.03, 
          expectedRate: '0.003%',
          description: 'SUI should show $0.03 network fee (0.003%)'
        }
      ]

      console.log('\n=== Verification: Network Fee Values Match Labels ===')

      for (const { asset, expectedFee, expectedRate, description } of testCases) {
        const fees = await feeCalculator.calculateTransactionFees({
          type: 'buy',
          amount: 1000,
          paymentMethod: 'diboas_wallet',
          asset: asset,
          chains: [asset]
        })

        console.log(`\n${description}:`)
        console.log(`  Network Fee Value: $${fees.network}`)
        console.log(`  Network Fee Rate: ${fees.breakdown.network.rate * 100}%`)
        console.log(`  ✅ Label and value now match!`)

        expect(fees.network).toBeCloseTo(expectedFee, 2)
      }
    })

    it('should verify buy and sell have consistent network fees', async () => {
      const assets = ['BTC', 'ETH', 'SUI', 'SOL']

      console.log('\n=== Buy vs Sell Network Fee Consistency ===')

      for (const asset of assets) {
        const buyFees = await feeCalculator.calculateTransactionFees({
          type: 'buy',
          amount: 1000,
          paymentMethod: 'diboas_wallet',
          asset: asset,
          chains: [asset]
        })

        const sellFees = await feeCalculator.calculateTransactionFees({
          type: 'sell',
          amount: 1000,
          paymentMethod: 'diboas_wallet',
          asset: asset,
          chains: [asset]
        })

        console.log(`\n${asset}:`)
        console.log(`  Buy Network Fee: $${buyFees.network}`)
        console.log(`  Sell Network Fee: $${sellFees.network}`)
        console.log(`  Match: ${buyFees.network === sellFees.network ? '✅' : '❌'}`)

        expect(buyFees.network).toBeCloseTo(sellFees.network, 3)
      }
    })
  })

  describe('Provider Fee Calculations for External Payment Methods', () => {
    it('should calculate correct provider fees for Buy with credit card', async () => {
      const btcBuyWithCard = await feeCalculator.calculateTransactionFees({
        type: 'buy',
        amount: 1000,
        paymentMethod: 'credit_debit_card',
        asset: 'BTC',
        chains: ['BTC']
      })

      console.log('\n=== BTC Buy with Credit Card ===')
      console.log(`diBoaS Fee: $${btcBuyWithCard.diBoaS} (0.09%)`)
      console.log(`Network Fee: $${btcBuyWithCard.network} (9%)`)
      console.log(`Provider Fee: $${btcBuyWithCard.provider} (1%)`)
      console.log(`Total: $${btcBuyWithCard.total}`)

      expect(btcBuyWithCard.diBoaS).toBeCloseTo(0.9, 2) // 0.09%
      expect(btcBuyWithCard.network).toBeCloseTo(90, 2) // 9%
      expect(btcBuyWithCard.provider).toBeCloseTo(10, 2) // 1% credit card fee
      expect(btcBuyWithCard.dex).toBe(0) // No DEX fee for external payment
      expect(btcBuyWithCard.total).toBeCloseTo(100.9, 2)
    })

    it('should calculate correct provider fees for Buy with bank account', async () => {
      const ethBuyWithBank = await feeCalculator.calculateTransactionFees({
        type: 'buy',
        amount: 1000,
        paymentMethod: 'bank_account',
        asset: 'ETH',
        chains: ['ETH']
      })

      console.log('\n=== ETH Buy with Bank Account ===')
      console.log(`diBoaS Fee: $${ethBuyWithBank.diBoaS} (0.09%)`)
      console.log(`Network Fee: $${ethBuyWithBank.network} (0.5%)`)
      console.log(`Provider Fee: $${ethBuyWithBank.provider} (1%)`)
      console.log(`Total: $${ethBuyWithBank.total}`)

      expect(ethBuyWithBank.diBoaS).toBeCloseTo(0.9, 2)
      expect(ethBuyWithBank.network).toBeCloseTo(5, 2) // ETH rate
      expect(ethBuyWithBank.provider).toBeCloseTo(10, 2) // 1% bank fee
      expect(ethBuyWithBank.dex).toBe(0)
      expect(ethBuyWithBank.total).toBeCloseTo(15.9, 2)
    })

    it('should calculate correct provider fees for Buy with PayPal', async () => {
      const suiBuyWithPayPal = await feeCalculator.calculateTransactionFees({
        type: 'buy',
        amount: 1000,
        paymentMethod: 'paypal',
        asset: 'SUI',
        chains: ['SUI']
      })

      console.log('\n=== SUI Buy with PayPal ===')
      console.log(`diBoaS Fee: $${suiBuyWithPayPal.diBoaS} (0.09%)`)
      console.log(`Network Fee: $${suiBuyWithPayPal.network} (0.003%)`)
      console.log(`Provider Fee: $${suiBuyWithPayPal.provider} (3%)`)
      console.log(`Total: $${suiBuyWithPayPal.total}`)

      expect(suiBuyWithPayPal.diBoaS).toBeCloseTo(0.9, 2)
      expect(suiBuyWithPayPal.network).toBeCloseTo(0.03, 3) // SUI rate
      expect(suiBuyWithPayPal.provider).toBeCloseTo(30, 2) // 3% PayPal fee
      expect(suiBuyWithPayPal.dex).toBe(0)
      expect(suiBuyWithPayPal.total).toBeCloseTo(30.93, 2)
    })

    it('should calculate correct provider fees for Buy with Apple Pay', async () => {
      const solBuyWithApplePay = await feeCalculator.calculateTransactionFees({
        type: 'buy',
        amount: 1000,
        paymentMethod: 'apple_pay',
        asset: 'SOL',
        chains: ['SOL']
      })

      console.log('\n=== SOL Buy with Apple Pay ===')
      console.log(`diBoaS Fee: $${solBuyWithApplePay.diBoaS} (0.09%)`)
      console.log(`Network Fee: $${solBuyWithApplePay.network} (0.001%)`)
      console.log(`Provider Fee: $${solBuyWithApplePay.provider} (0.5%)`)
      console.log(`Total: $${solBuyWithApplePay.total}`)

      expect(solBuyWithApplePay.diBoaS).toBeCloseTo(0.9, 2)
      expect(solBuyWithApplePay.network).toBeCloseTo(0.01, 3) // SOL rate
      expect(solBuyWithApplePay.provider).toBeCloseTo(5, 2) // 0.5% Apple Pay fee
      expect(solBuyWithApplePay.dex).toBe(0)
      expect(solBuyWithApplePay.total).toBeCloseTo(5.91, 2)
    })

    it('should verify diBoaS wallet has DEX fee instead of provider fee', async () => {
      const btcBuyWithWallet = await feeCalculator.calculateTransactionFees({
        type: 'buy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'BTC',
        chains: ['BTC']
      })

      console.log('\n=== BTC Buy with diBoaS Wallet (DEX fee, no provider) ===')
      console.log(`diBoaS Fee: $${btcBuyWithWallet.diBoaS} (0.09%)`)
      console.log(`Network Fee: $${btcBuyWithWallet.network} (9%)`)
      console.log(`Provider Fee: $${btcBuyWithWallet.provider} (should be 0)`)
      console.log(`DEX Fee: $${btcBuyWithWallet.dex} (1%)`)
      console.log(`Total: $${btcBuyWithWallet.total}`)

      expect(btcBuyWithWallet.diBoaS).toBeCloseTo(0.9, 2)
      expect(btcBuyWithWallet.network).toBeCloseTo(90, 2)
      expect(btcBuyWithWallet.provider).toBe(0) // No provider fee for diBoaS wallet
      expect(btcBuyWithWallet.dex).toBeCloseTo(10, 2) // 1% DEX fee for diBoaS wallet
      expect(btcBuyWithWallet.total).toBeCloseTo(100.9, 2)
    })

    it('should compare all payment methods for same asset', async () => {
      console.log('\n=== Payment Method Comparison for BTC Buy ===')
      
      const paymentMethods = [
        { method: 'diboas_wallet', expectedProvider: 0, expectedDex: 10 },
        { method: 'credit_debit_card', expectedProvider: 10, expectedDex: 0 },
        { method: 'bank_account', expectedProvider: 10, expectedDex: 0 },
        { method: 'apple_pay', expectedProvider: 5, expectedDex: 0 },
        { method: 'paypal', expectedProvider: 30, expectedDex: 0 }
      ]

      for (const { method, expectedProvider, expectedDex } of paymentMethods) {
        const fees = await feeCalculator.calculateTransactionFees({
          type: 'buy',
          amount: 1000,
          paymentMethod: method,
          asset: 'BTC',
          chains: ['BTC']
        })

        console.log(`\n${method}:`)
        console.log(`  Provider Fee: $${fees.provider} (expected: $${expectedProvider})`)
        console.log(`  DEX Fee: $${fees.dex} (expected: $${expectedDex})`)
        console.log(`  Total: $${fees.total}`)

        expect(fees.provider).toBeCloseTo(expectedProvider, 2)
        expect(fees.dex).toBeCloseTo(expectedDex, 2)
      }
    })
  })

  describe('Edge Cases and Validation', () => {
    it('should handle tokenized assets correctly', async () => {
      // Tokenized assets should use SOL network
      const tokenizedAssets = ['MAG7', 'SPX', 'REIT', 'USDC']

      for (const asset of tokenizedAssets) {
        const fees = await feeCalculator.calculateTransactionFees({
          type: 'buy',
          amount: 1000,
          paymentMethod: 'diboas_wallet',
          asset: asset,
          chains: ['SOL'] // These should use SOL network
        })

        console.log(`\n${asset} Buy:`)
        console.log(`Network Fee: $${fees.network} (should be $0.01 - SOL network)`)

        expect(fees.network).toBeCloseTo(0.01, 3) // SOL rate
        expect(fees.breakdown.network.rate).toBe(0.00001) // SOL rate
      }
    })

    it('should handle precious metals correctly', async () => {
      // PAXG and XAUT should use ETH network
      const preciousMetals = ['PAXG', 'XAUT']

      for (const asset of preciousMetals) {
        const fees = await feeCalculator.calculateTransactionFees({
          type: 'buy',
          amount: 1000,
          paymentMethod: 'diboas_wallet',
          asset: asset,
          chains: ['ETH'] // These should use ETH network
        })

        console.log(`\n${asset} Buy:`)
        console.log(`Network Fee: $${fees.network} (should be $5 - ETH network)`)

        expect(fees.network).toBeCloseTo(5, 2) // ETH rate
        expect(fees.breakdown.network.rate).toBe(0.005) // ETH rate
      }
    })
  })
})