/**
 * Sell Transaction Enhancement Tests
 * Tests the enhanced sell transaction processing with proper metadata
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { dataManager } from '../services/DataManager.js'

describe('Sell Transaction Enhancements', () => {
  beforeEach(() => {
    // Reset to clean state
    dataManager.initializeCleanState()
  })

  describe('Sell Transaction Balance Calculations', () => {
    it('should calculate sell transaction correctly with positive proceeds', async () => {
      // Set initial balance with investments
      dataManager.state.balance.availableForSpending = 500
      dataManager.state.balance.investedAmount = 1000
      dataManager.state.balance.totalUSD = 1500
      dataManager.state.balance.assets = {
        BTC: { amount: 0.01, usdValue: 400, investedAmount: 400 }
      }

      // Sell $300 worth of BTC with $15 fees, getting $285 proceeds
      await dataManager.updateBalance({
        type: 'sell',
        amount: 300,
        fees: { total: 15 },
        asset: 'BTC',
        netAmount: 285
      })

      const updatedBalance = dataManager.getBalance()
      
      // Available Balance = current + proceeds = 500 + 285 = 785
      expect(updatedBalance.availableForSpending).toBe(785)
      
      // Invested Balance = current - sold amount = 1000 - 300 = 700
      expect(updatedBalance.investedAmount).toBe(700)
      
      // Total Balance = Available + Invested = 785 + 700 = 1485
      expect(updatedBalance.totalUSD).toBe(1485)
      
      // Asset tracking should be updated
      expect(updatedBalance.assets.BTC.usdValue).toBe(100) // 400 - 300
      expect(updatedBalance.assets.BTC.investedAmount).toBe(100) // 400 - 300
    })

    it('should handle sell transaction with complete asset liquidation', async () => {
      // Set initial balance
      dataManager.state.balance.availableForSpending = 1000
      dataManager.state.balance.investedAmount = 500
      dataManager.state.balance.totalUSD = 1500
      dataManager.state.balance.assets = {
        ETH: { amount: 0.2, usdValue: 500, investedAmount: 500 }
      }

      // Sell all ETH for $480 (after $20 fees)
      await dataManager.updateBalance({
        type: 'sell',
        amount: 500,
        fees: { total: 20 },
        asset: 'ETH',
        netAmount: 480
      })

      const updatedBalance = dataManager.getBalance()
      
      // Available Balance = 1000 + 480 = 1480
      expect(updatedBalance.availableForSpending).toBe(1480)
      
      // Invested Balance = 500 - 500 = 0
      expect(updatedBalance.investedAmount).toBe(0)
      
      // Total Balance = 1480 + 0 = 1480
      expect(updatedBalance.totalUSD).toBe(1480)
      
      // ETH asset should be removed completely
      expect(updatedBalance.assets.ETH).toBeUndefined()
    })
  })

  describe('Sell Transaction Metadata Enhancement', () => {
    it('should add enhanced exchange metadata for sell transactions', () => {
      const sellTransactionData = {
        type: 'sell',
        amount: 300,
        asset: 'BTC',
        fees: { total: 15 },
        netAmount: 285
      }

      const transaction = dataManager.addTransaction(sellTransactionData)
      
      // Should have enhanced metadata
      expect(transaction.fromAsset).toBe('BTC')
      expect(transaction.fromAmount).toBe(300)
      expect(transaction.toAsset).toBe('USDC')
      expect(transaction.toAmount).toBe(285)
      expect(transaction.type).toBe('sell')
      expect(transaction.netAmount).toBe(285)
    })

    it('should add enhanced metadata with custom from/to data', () => {
      const sellTransactionData = {
        type: 'sell',
        amount: 200,
        asset: 'ETH',
        fromAsset: 'ETH',
        fromAmount: 0.1,
        toAsset: 'USDC',
        toAmount: 190,
        dexProvider: 'Jupiter',
        exchangeRate: 2000,
        fees: { total: 10 }
      }

      const transaction = dataManager.addTransaction(sellTransactionData)
      
      // Should preserve custom metadata
      expect(transaction.fromAsset).toBe('ETH')
      expect(transaction.fromAmount).toBe(0.1)
      expect(transaction.toAsset).toBe('USDC')
      expect(transaction.toAmount).toBe(190)
      expect(transaction.dexProvider).toBe('Jupiter')
      expect(transaction.exchangeRate).toBe(2000)
    })

    it('should generate proper transaction description for sell', () => {
      const sellTransactionData = {
        type: 'sell',
        amount: 300,
        asset: 'BTC',
        fromAsset: 'BTC',
        fromAmount: 0.01,
        toAsset: 'USDC',
        toAmount: 285,
        fees: { total: 15 }
      }

      const transaction = dataManager.addTransaction(sellTransactionData)
      
      // Description should be automatically generated based on metadata
      expect(transaction.description).toContain('Sold')
      expect(transaction.description).toContain('BTC')
    })
  })

  describe('Sell Transaction Processing Integration', () => {
    it('should process complete sell transaction correctly', async () => {
      // Set initial state
      dataManager.state.balance.availableForSpending = 1000
      dataManager.state.balance.investedAmount = 800
      dataManager.state.balance.totalUSD = 1800

      const sellTransactionData = {
        type: 'sell',
        amount: 200,
        asset: 'SOL',
        fromAsset: 'SOL',
        fromAmount: 10,
        fees: { total: 10 },
        netAmount: 190,
        userId: 'demo_user_12345'
      }

      const result = await dataManager.processTransaction(sellTransactionData)
      
      // Should return transaction and updated balance
      expect(result.transaction).toBeDefined()
      expect(result.balance).toBeDefined()
      
      // Transaction should have correct type and amounts
      expect(result.transaction.type).toBe('sell')
      expect(result.transaction.amount).toBe(200)
      expect(result.transaction.netAmount).toBe(190)
      
      // Balance should be updated correctly
      expect(result.balance.availableForSpending).toBe(1190) // 1000 + 190
      expect(result.balance.investedAmount).toBe(600) // 800 - 200
      expect(result.balance.totalUSD).toBe(1790) // 1190 + 600
      
      // Transaction should be in history
      const transactions = dataManager.getTransactions()
      expect(transactions).toHaveLength(1)
      expect(transactions[0].type).toBe('sell')
    })

    it('should emit proper events for sell transactions', async () => {
      let transactionCompletedEvent = null
      let balanceUpdatedEvent = null

      // Listen for events
      const unsubscribeTransaction = dataManager.subscribe('transaction:completed', (data) => {
        transactionCompletedEvent = data
      })
      
      const unsubscribeBalance = dataManager.subscribe('balance:updated', (data) => {
        balanceUpdatedEvent = data
      })

      const sellTransactionData = {
        type: 'sell',
        amount: 150,
        asset: 'SUI',
        fees: { total: 5 },
        netAmount: 145
      }

      await dataManager.processTransaction(sellTransactionData)
      
      // Events should have been emitted
      expect(transactionCompletedEvent).toBeDefined()
      expect(balanceUpdatedEvent).toBeDefined()
      
      // Clean up
      unsubscribeTransaction()
      unsubscribeBalance()
    })
  })
})