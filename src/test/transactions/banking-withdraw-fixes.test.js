/**
 * Banking Withdraw Fee Calculation Fixes Tests
 * Tests for the fixed withdraw fee calculation issues
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FeeCalculator } from '../../utils/feeCalculations.js'

describe('Banking Withdraw Fee Calculation Fixes', () => {
  let feeCalculator

  beforeEach(() => {
    feeCalculator = new FeeCalculator()
  })

  describe('Off-Ramp Withdraw Fees (Bank, Card, PayPal)', () => {
    it('should calculate correct fees for bank account withdrawal - NO DEX fee', async () => {
      const bankWithdraw = await feeCalculator.calculateTransactionFees({
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'bank_account',
        asset: 'USDC',
        chains: ['SOL']
      })

      console.log('Bank Account Withdraw:')
      console.log(`diBoaS Fee: $${bankWithdraw.diboas} (should be $9.00)`)
      console.log(`Network Fee: $${bankWithdraw.networkFee} (should be $0.01)`)
      console.log(`Provider Fee: $${bankWithdraw.providerFee} (should be $20.00)`)
      console.log(`DEX Fee: $${bankWithdraw.dexFee} (should be $0.00)`)
      console.log(`Total: $${bankWithdraw.totalFees} (should be $29.01)`)

      // Verify fees
      expect(bankWithdraw.diboas).toBeCloseTo(9.00, 2) // 0.9%
      expect(bankWithdraw.networkFee).toBeCloseTo(0.01, 3) // SOL network fee
      expect(bankWithdraw.providerFee).toBeCloseTo(20.00, 2) // 2% bank fee
      expect(bankWithdraw.dexFee).toBe(0) // NO DEX fee for off-ramp
      expect(bankWithdraw.totalFees).toBeCloseTo(29.01, 2) // diBoaS + Network + Provider ONLY
    })

    it('should calculate correct fees for credit card withdrawal - NO DEX fee', async () => {
      const cardWithdraw = await feeCalculator.calculateTransactionFees({
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'credit_debit_card',
        asset: 'USDC',
        chains: ['SOL']
      })

      console.log('\nCredit Card Withdraw:')
      console.log(`diBoaS Fee: $${cardWithdraw.diboas}`)
      console.log(`Network Fee: $${cardWithdraw.networkFee}`)
      console.log(`Provider Fee: $${cardWithdraw.providerFee}`)
      console.log(`DEX Fee: $${cardWithdraw.dexFee} (should be $0.00)`)
      console.log(`Total: $${cardWithdraw.totalFees} (should be $29.01)`)

      expect(cardWithdraw.diboas).toBeCloseTo(9.00, 2)
      expect(cardWithdraw.networkFee).toBeCloseTo(0.01, 3)
      expect(cardWithdraw.providerFee).toBeCloseTo(20.00, 2) // 2% card fee
      expect(cardWithdraw.dexFee).toBe(0) // NO DEX fee
      expect(cardWithdraw.totalFees).toBeCloseTo(29.01, 2)
    })

    it('should calculate correct fees for PayPal withdrawal - NO DEX fee', async () => {
      const paypalWithdraw = await feeCalculator.calculateTransactionFees({
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'paypal',
        asset: 'USDC',
        chains: ['SOL']
      })

      console.log('\nPayPal Withdraw:')
      console.log(`diBoaS Fee: $${paypalWithdraw.diboas}`)
      console.log(`Network Fee: $${paypalWithdraw.networkFee}`)
      console.log(`Provider Fee: $${paypalWithdraw.providerFee}`)
      console.log(`DEX Fee: $${paypalWithdraw.dexFee} (should be $0.00)`)
      console.log(`Total: $${paypalWithdraw.totalFees} (should be $49.01)`)

      expect(paypalWithdraw.diboas).toBeCloseTo(9.00, 2)
      expect(paypalWithdraw.networkFee).toBeCloseTo(0.01, 3)
      expect(paypalWithdraw.providerFee).toBeCloseTo(40.00, 2) // 4% PayPal fee
      expect(paypalWithdraw.dexFee).toBe(0) // NO DEX fee
      expect(paypalWithdraw.totalFees).toBeCloseTo(49.01, 2)
    })

    it('should verify breakdown rates for off-ramp withdrawals', async () => {
      const bankWithdraw = await feeCalculator.calculateTransactionFees({
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'bank_account',
        asset: 'USDC',
        chains: ['SOL']
      })

      // Verify breakdown rates
      expect(bankWithdraw.breakdown.diBoaS.rate).toBe(0.009) // 0.9%
      expect(bankWithdraw.breakdown.network.rate).toBe(0.00001) // 0.001% for SOL
      expect(bankWithdraw.breakdown.provider.rate).toBe(0.02) // 2% for bank
      expect(bankWithdraw.breakdown.dex.rate).toBe(0) // 0% DEX fee for off-ramp
    })
  })

  describe('External Wallet Withdraw Fees', () => {
    it('should calculate correct fees for SOL external wallet - NO DEX fee', async () => {
      const solWithdraw = await feeCalculator.calculateTransactionFees({
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'external_wallet',
        asset: 'USDC',
        chains: ['SOL']
      })

      console.log('\nSOL External Wallet Withdraw:')
      console.log(`diBoaS Fee: $${solWithdraw.diboas} (should be $9.00)`)
      console.log(`Network Fee: $${solWithdraw.networkFee} (should be $0.01)`)
      console.log(`Provider Fee: $${solWithdraw.providerFee} (should be $0.00)`)
      console.log(`DEX Fee: $${solWithdraw.dexFee} (should be $0.00)`)
      console.log(`Total: $${solWithdraw.totalFees} (should be $9.01)`)

      expect(solWithdraw.diboas).toBeCloseTo(9.00, 2)
      expect(solWithdraw.networkFee).toBeCloseTo(0.01, 3)
      expect(solWithdraw.providerFee).toBe(0) // No provider fee
      expect(solWithdraw.dexFee).toBe(0) // NO DEX fee for SOL
      expect(solWithdraw.totalFees).toBeCloseTo(9.01, 2) // diBoaS + Network ONLY
    })

    it('should calculate correct fees for SUI external wallet - WITH DEX fee', async () => {
      const suiWithdraw = await feeCalculator.calculateTransactionFees({
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'external_wallet',
        asset: 'USDC',
        chains: ['SUI']
      })

      console.log('\nSUI External Wallet Withdraw:')
      console.log(`diBoaS Fee: $${suiWithdraw.diboas} (should be $9.00)`)
      console.log(`Network Fee: $${suiWithdraw.networkFee} (should be $0.03)`)
      console.log(`Provider Fee: $${suiWithdraw.providerFee} (should be $0.00)`)
      console.log(`DEX Fee: $${suiWithdraw.dexFee} (should be $5.00)`)
      console.log(`Total: $${suiWithdraw.totalFees} (should be $14.03)`)

      expect(suiWithdraw.diboas).toBeCloseTo(9.00, 2)
      expect(suiWithdraw.networkFee).toBeCloseTo(0.03, 3)
      expect(suiWithdraw.providerFee).toBe(0)
      expect(suiWithdraw.dexFee).toBeCloseTo(5.00, 2) // 0.5% DEX fee for cross-chain
      expect(suiWithdraw.totalFees).toBeCloseTo(14.03, 2) // diBoaS + Network + DEX
    })

    it('should calculate correct fees for BTC external wallet - WITH DEX fee', async () => {
      const btcWithdraw = await feeCalculator.calculateTransactionFees({
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'external_wallet',
        asset: 'USDC',
        chains: ['BTC']
      })

      console.log('\nBTC External Wallet Withdraw:')
      console.log(`diBoaS Fee: $${btcWithdraw.diboas}`)
      console.log(`Network Fee: $${btcWithdraw.networkFee} (should be $90.00)`)
      console.log(`Provider Fee: $${btcWithdraw.providerFee}`)
      console.log(`DEX Fee: $${btcWithdraw.dexFee} (should be $5.00)`)
      console.log(`Total: $${btcWithdraw.totalFees} (should be $104.00)`)

      expect(btcWithdraw.diboas).toBeCloseTo(9.00, 2)
      expect(btcWithdraw.networkFee).toBeCloseTo(90.00, 2) // 9% BTC network fee
      expect(btcWithdraw.providerFee).toBe(0)
      expect(btcWithdraw.dexFee).toBeCloseTo(5.00, 2) // 0.5% DEX fee
      expect(btcWithdraw.totalFees).toBeCloseTo(104.00, 2)
    })

    it('should calculate correct fees for ETH external wallet - WITH DEX fee', async () => {
      const ethWithdraw = await feeCalculator.calculateTransactionFees({
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'external_wallet',
        asset: 'USDC',
        chains: ['ETH']
      })

      console.log('\nETH External Wallet Withdraw:')
      console.log(`diBoaS Fee: $${ethWithdraw.diboas}`)
      console.log(`Network Fee: $${ethWithdraw.networkFee} (should be $5.00)`)
      console.log(`Provider Fee: $${ethWithdraw.providerFee}`)
      console.log(`DEX Fee: $${ethWithdraw.dexFee} (should be $5.00)`)
      console.log(`Total: $${ethWithdraw.totalFees} (should be $19.00)`)

      expect(ethWithdraw.diboas).toBeCloseTo(9.00, 2)
      expect(ethWithdraw.networkFee).toBeCloseTo(5.00, 2) // 0.5% ETH network fee
      expect(ethWithdraw.providerFee).toBe(0)
      expect(ethWithdraw.dexFee).toBeCloseTo(5.00, 2) // 0.5% DEX fee
      expect(ethWithdraw.totalFees).toBeCloseTo(19.00, 2)
    })

    it('should verify breakdown rates for external wallet withdrawals', async () => {
      const suiWithdraw = await feeCalculator.calculateTransactionFees({
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'external_wallet',
        asset: 'USDC',
        chains: ['SUI']
      })

      const solWithdraw = await feeCalculator.calculateTransactionFees({
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'external_wallet',
        asset: 'USDC',
        chains: ['SOL']
      })

      // SUI should have DEX fee
      expect(suiWithdraw.breakdown.dex.rate).toBe(0.005) // 0.5%
      expect(suiWithdraw.breakdown.provider.rate).toBe(0) // No provider fee

      // SOL should not have DEX fee
      expect(solWithdraw.breakdown.dex.rate).toBe(0) // 0%
      expect(solWithdraw.breakdown.provider.rate).toBe(0) // No provider fee
    })
  })

  describe('Comparison Tests - Off-ramp vs External Wallet', () => {
    it('should show different totals for same amount - bank vs external wallet', async () => {
      const amount = 1000

      const bankWithdraw = await feeCalculator.calculateTransactionFees({
        type: 'withdraw',
        amount,
        paymentMethod: 'bank_account',
        asset: 'USDC',
        chains: ['SUI']
      })

      const externalWithdraw = await feeCalculator.calculateTransactionFees({
        type: 'withdraw',
        amount,
        paymentMethod: 'external_wallet',
        asset: 'USDC',
        chains: ['SUI']
      })

      console.log('\nComparison - Bank vs External Wallet (SUI):')
      console.log(`Bank Total: $${bankWithdraw.totalFees} (diBoaS + Network + Provider)`)
      console.log(`External Total: $${externalWithdraw.totalFees} (diBoaS + Network + DEX)`)

      // Bank should be more expensive due to provider fee
      expect(bankWithdraw.totalFees).toBeGreaterThan(externalWithdraw.totalFees)
      
      // Verify components
      expect(bankWithdraw.providerFee).toBeGreaterThan(0) // Has provider fee
      expect(bankWithdraw.dexFee).toBe(0) // No DEX fee
      
      expect(externalWithdraw.providerFee).toBe(0) // No provider fee
      expect(externalWithdraw.dexFee).toBeGreaterThan(0) // Has DEX fee
    })
  })

  describe('Edge Cases', () => {
    it('should handle diboas_wallet payment method correctly', async () => {
      // diboas_wallet should behave like external_wallet for withdraws
      const diboasWithdraw = await feeCalculator.calculateTransactionFees({
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['SUI']
      })

      console.log('\ndiBoaS Wallet Withdraw (SUI):')
      console.log(`Total: $${diboasWithdraw.totalFees}`)
      console.log(`DEX Fee: $${diboasWithdraw.dexFee} (should be $5.00)`)

      expect(diboasWithdraw.dexFee).toBeCloseTo(5.00, 2) // Should have DEX fee for cross-chain
      expect(diboasWithdraw.providerFee).toBe(0) // No provider fee
    })

    it('should handle small amounts correctly', async () => {
      const smallWithdraw = await feeCalculator.calculateTransactionFees({
        type: 'withdraw',
        amount: 10,
        paymentMethod: 'external_wallet',
        asset: 'USDC',
        chains: ['SUI']
      })

      expect(smallWithdraw.diboas).toBeCloseTo(0.09, 3) // 0.9% of $10
      expect(smallWithdraw.dexFee).toBeCloseTo(0.05, 3) // 0.5% of $10
      expect(smallWithdraw.totalFees).toBeGreaterThan(0)
    })
  })
})