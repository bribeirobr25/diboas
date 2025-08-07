/**
 * Withdraw to External Wallet Fix Tests
 * Tests to verify the correct fee calculation for different withdrawal types
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FeeCalculator } from '../../utils/feeCalculations.js'

describe('Withdraw to External Wallet Fix Tests', () => {
  let feeCalculator

  beforeEach(() => {
    feeCalculator = new FeeCalculator()
  })

  describe('Banking Withdraw vs Transfer to External Wallet', () => {
    it('should calculate different fees for banking withdraw vs external wallet transfer', async () => {
      const amount = 1000

      // Banking withdraw (to bank account) - what system currently does
      const bankWithdraw = await feeCalculator.calculateTransactionFees({
        type: 'withdraw',
        amount: amount,
        paymentMethod: 'bank_account',
        asset: 'USDC',
        chains: ['SUI']
      })

      // Transfer to external wallet - what user might expect
      const externalTransfer = await feeCalculator.calculateTransactionFees({
        type: 'transfer',
        amount: amount,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['SUI']
      })

      console.log('Banking Withdraw to bank account:')
      console.log(`Total: $${bankWithdraw.total}`)
      console.log(`diBoaS: $${bankWithdraw.diboas} (${bankWithdraw.breakdown.diBoaS.rate * 100}%)`)
      console.log(`Network: $${bankWithdraw.networkFee} (${bankWithdraw.breakdown.network.rate * 100}%)`)
      console.log(`DEX: $${bankWithdraw.dexFee} (${bankWithdraw.breakdown.dex.rate * 100}%)`)
      console.log(`Provider: $${bankWithdraw.providerFee} (${bankWithdraw.breakdown.provider.rate * 100}%)`)

      console.log('\nTransfer to External Wallet:')
      console.log(`Total: $${externalTransfer.total}`)
      console.log(`diBoaS: $${externalTransfer.diboas} (${externalTransfer.breakdown.diBoaS.rate * 100}%)`)
      console.log(`Network: $${externalTransfer.networkFee} (${externalTransfer.breakdown.network.rate * 100}%)`)
      console.log(`DEX: $${externalTransfer.dexFee} (${externalTransfer.breakdown.dex.rate * 100}%)`)
      console.log(`Provider: $${externalTransfer.providerFee} (${externalTransfer.breakdown.provider.rate * 100}%)`)

      // UPDATED: Banking withdraw fees - NO DEX fee for off-ramp
      expect(bankWithdraw.diboas).toBeCloseTo(9, 2) // 0.9%
      expect(bankWithdraw.networkFee).toBeCloseTo(0.03, 3) // 0.003% for SUI
      expect(bankWithdraw.dexFee).toBe(0) // NO DEX fee for off-ramp withdrawals
      expect(bankWithdraw.providerFee).toBeCloseTo(20, 2) // 2% bank fee
      expect(bankWithdraw.total).toBeCloseTo(29.03, 2) // Only diBoaS + Network + Provider

      // Verify external transfer fees
      expect(externalTransfer.diboas).toBeCloseTo(9, 2) // 0.9%
      expect(externalTransfer.networkFee).toBeCloseTo(0.03, 3) // 0.003% for SUI
      expect(externalTransfer.dexFee).toBeCloseTo(8, 2) // 0.8%
      expect(externalTransfer.providerFee).toBe(0) // No provider fee
      expect(externalTransfer.total).toBeCloseTo(17.03, 2)
    })

    it('should handle user expected scenario - assuming they mean transfer', async () => {
      // Based on user description: Amount $1000, expecting $14.01 total
      // This suggests they want: $9 diBoaS + $0.01 network (SOL) + $0.8 DEX (8%) = $17.81
      // But they reported $14.01, which might be a miscalculation or different scenario

      const userScenario = await feeCalculator.calculateTransactionFees({
        type: 'transfer',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['SOL'] // User might be expecting SOL network fees
      })

      console.log('\nUser Expected Scenario (SOL Transfer):')
      console.log(`Total: $${userScenario.total}`)
      console.log(`diBoaS: $${userScenario.diboas}`)
      console.log(`Network: $${userScenario.networkFee}`)
      console.log(`DEX: $${userScenario.dexFee}`)
      console.log(`Provider: $${userScenario.providerFee}`)

      expect(userScenario.diboas).toBeCloseTo(9, 2) // 0.9%
      expect(userScenario.networkFee).toBeCloseTo(0.01, 3) // 0.001% for SOL
      expect(userScenario.dexFee).toBeCloseTo(8, 2) // 0.8%
      expect(userScenario.providerFee).toBe(0) // No provider fee
      expect(userScenario.total).toBeCloseTo(17.01, 2) // Close to but not exactly $14.01
    })

    it('should properly calculate network fees for different chains', async () => {
      const chains = ['SOL', 'SUI', 'ETH', 'BTC']
      const expectedNetworkFees = [0.01, 0.03, 5, 90] // For $1000

      for (let i = 0; i < chains.length; i++) {
        const chain = chains[i]
        const expected = expectedNetworkFees[i]

        const transfer = await feeCalculator.calculateTransactionFees({
          type: 'transfer',
          amount: 1000,
          paymentMethod: 'diboas_wallet',
          asset: 'USDC',
          chains: [chain]
        })

        console.log(`\n${chain} Transfer:`)
        console.log(`Network Fee: $${transfer.networkFee} (expected: $${expected})`)
        console.log(`DEX Fee: $${transfer.dexFee}`)
        console.log(`Total: $${transfer.total}`)

        expect(transfer.networkFee).toBeCloseTo(expected, 2)
        expect(transfer.dexFee).toBeCloseTo(8, 2) // 0.8% should be consistent
      }
    })
  })

  describe('Fixed DEX Fee Calculation', () => {
    it('should show correct DEX fee rates in breakdown', async () => {
      const withdraw = await feeCalculator.calculateTransactionFees({
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'bank_account',
        asset: 'USDC',
        chains: ['SUI']
      })

      const transfer = await feeCalculator.calculateTransactionFees({
        type: 'transfer',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['SUI']
      })

      // UPDATED: Verify breakdown shows correct rates
      // Withdraw with bank_account has NO DEX fee, but external wallet withdraws to SUI have DEX fee
      const externalWithdraw = await feeCalculator.calculateTransactionFees({
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'external_wallet',
        asset: 'USDC',
        chains: ['SUI']
      })
      
      expect(withdraw.breakdown.dex.rate).toBe(0) // 0% for off-ramp withdraw
      expect(externalWithdraw.breakdown.dex.rate).toBe(0.005) // 0.5% for external wallet withdraw to SUI
      expect(transfer.breakdown.dex.rate).toBe(0.008) // 0.8% for transfer

      // Verify amounts match rates
      expect(withdraw.breakdown.dex.amount).toBe(0) // No DEX fee for off-ramp
      expect(externalWithdraw.breakdown.dex.amount).toBeCloseTo(1000 * 0.005, 2) // External wallet DEX fee
      expect(transfer.breakdown.dex.amount).toBeCloseTo(1000 * 0.008, 2) // Transfer DEX fee
    })
  })

  describe('Edge Cases and Validation', () => {
    it('should handle minimum amounts correctly', async () => {
      const transfer = await feeCalculator.calculateTransactionFees({
        type: 'transfer',
        amount: 1,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['SOL']
      })

      expect(transfer.total).toBeGreaterThan(0)
      expect(transfer.diboas).toBeCloseTo(0.01, 3) // Minimum fee applied
      expect(transfer.dexFee).toBeCloseTo(0.008, 3) // 0.8% of $1
    })

    it('should handle large amounts correctly', async () => {
      const transfer = await feeCalculator.calculateTransactionFees({
        type: 'transfer',
        amount: 100000,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        chains: ['SOL']
      })

      expect(transfer.total).toBeGreaterThan(0)
      expect(transfer.diboas).toBeCloseTo(900, 2) // 0.9% of $100k
      expect(transfer.dexFee).toBeCloseTo(800, 2) // 0.8% of $100k
    })
  })
})