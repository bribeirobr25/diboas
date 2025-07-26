/**
 * Simple test to verify balance calculations
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { dataManager } from '../services/DataManager.js'

describe('Balance Calculations', () => {
  beforeEach(() => {
    // Reset to clean state
    dataManager.initializeCleanState()
  })

  it('should calculate add transaction correctly', async () => {
    // Initial state: Available: 0, Invested: 0
    const initialBalance = dataManager.getBalance()
    expect(initialBalance.availableForSpending).toBe(0)
    expect(initialBalance.investedAmount).toBe(0)

    // Add $100 with $5 fees
    await dataManager.updateBalance({
      type: 'add',
      amount: 100,
      fees: { total: 5 },
      asset: 'USD',
      paymentMethod: 'credit_debit_card'
    })

    const updatedBalance = dataManager.getBalance()
    // Available Balance = current + (transaction amount - fees) = 0 + (100 - 5) = 95
    // Invested Balance = no changes = 0
    expect(updatedBalance.availableForSpending).toBe(95)
    expect(updatedBalance.investedAmount).toBe(0)
    expect(updatedBalance.totalUSD).toBe(95)
  })

  it('should calculate buy transaction with diBoaS wallet correctly', async () => {
    // Set initial balance
    dataManager.state.balance.availableForSpending = 1000
    dataManager.state.balance.investedAmount = 500
    dataManager.state.balance.totalUSD = 1500

    // Buy $200 BTC with $10 fees using diBoaS wallet
    await dataManager.updateBalance({
      type: 'buy',
      amount: 200,
      fees: { total: 10 },
      asset: 'BTC',
      paymentMethod: 'diboas_wallet'
    })

    const updatedBalance = dataManager.getBalance()
    // Available Balance = current - transaction amount = 1000 - 200 = 800
    // Invested Balance = current + (transaction amount - fees) = 500 + (200 - 10) = 690
    expect(updatedBalance.availableForSpending).toBe(800)
    expect(updatedBalance.investedAmount).toBe(690)
    expect(updatedBalance.totalUSD).toBe(1490)
  })

  it('should calculate buy transaction with external payment correctly', async () => {
    // Set initial balance
    dataManager.state.balance.availableForSpending = 1000
    dataManager.state.balance.investedAmount = 500
    dataManager.state.balance.totalUSD = 1500

    // Buy $200 ETH with $10 fees using credit card
    await dataManager.updateBalance({
      type: 'buy',
      amount: 200,
      fees: { total: 10 },
      asset: 'ETH',
      paymentMethod: 'credit_debit_card'
    })

    const updatedBalance = dataManager.getBalance()
    // Available Balance = no changes = 1000
    // Invested Balance = current + (transaction amount - fees) = 500 + (200 - 10) = 690
    expect(updatedBalance.availableForSpending).toBe(1000)
    expect(updatedBalance.investedAmount).toBe(690)
    expect(updatedBalance.totalUSD).toBe(1690)
  })

  it('should calculate sell transaction correctly', async () => {
    // Set initial balance
    dataManager.state.balance.availableForSpending = 1000
    dataManager.state.balance.investedAmount = 500
    dataManager.state.balance.totalUSD = 1500

    // Sell $150 BTC with $7 fees
    await dataManager.updateBalance({
      type: 'sell',
      amount: 150,
      fees: { total: 7 },
      asset: 'BTC',
      paymentMethod: undefined
    })

    const updatedBalance = dataManager.getBalance()
    // Available Balance = current + (transaction amount - fees) = 1000 + (150 - 7) = 1143
    // Invested Balance = current - transaction amount = 500 - 150 = 350
    expect(updatedBalance.availableForSpending).toBe(1143)
    expect(updatedBalance.investedAmount).toBe(350)
    expect(updatedBalance.totalUSD).toBe(1493)
  })

  it('should calculate transfer transaction correctly', async () => {
    // Set initial balance
    dataManager.state.balance.availableForSpending = 1000
    dataManager.state.balance.investedAmount = 500
    dataManager.state.balance.totalUSD = 1500

    // Transfer $100 with $5 fees
    await dataManager.updateBalance({
      type: 'transfer',
      amount: 100,
      fees: { total: 5 },
      asset: 'USD',
      paymentMethod: 'diboas_wallet'
    })

    const updatedBalance = dataManager.getBalance()
    // Available Balance = current - amount = 1000 - 100 = 900
    // Invested Balance = no changes = 500
    expect(updatedBalance.availableForSpending).toBe(900)
    expect(updatedBalance.investedAmount).toBe(500)
    expect(updatedBalance.totalUSD).toBe(1400)
  })
})