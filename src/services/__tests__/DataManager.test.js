/**
 * Comprehensive Test Suite for DataManager
 * Tests balance management, transaction processing, and data integrity
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { dataManager } from '../DataManager.js'

describe('DataManager', () => {
  beforeEach(() => {
    // Reset to clean state before each test
    dataManager.initializeCleanState()
    vi.clearAllTimers()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Balance Management', () => {
    describe('Happy Path Balance Operations', () => {
      it('should initialize with clean state', () => {
        const state = dataManager.getState()
        expect(state.balance.totalUSD).toBe(0)
        expect(state.balance.availableForSpending).toBe(0)
        expect(state.balance.investedAmount).toBe(0)
        expect(state.transactions).toEqual([])
      })

      it('should process ADD transaction correctly', async () => {
        const transactionData = {
          type: 'add',
          amount: 100,
          fees: { total: 1 }
        }

        await dataManager.updateBalance(transactionData)
        const balance = dataManager.getBalance()

        expect(balance.availableForSpending).toBe(99) // 100 - 1 fee
        expect(balance.investedAmount).toBe(0)
        expect(balance.totalUSD).toBe(99)
      })

      it('should process WITHDRAW transaction correctly', async () => {
        // First add money
        await dataManager.updateBalance({ type: 'add', amount: 100, fees: { total: 0 } })
        
        // Then withdraw
        await dataManager.updateBalance({ type: 'withdraw', amount: 50 })
        const balance = dataManager.getBalance()

        expect(balance.availableForSpending).toBe(50) // 100 - 50
        expect(balance.totalUSD).toBe(50)
      })

      it('should process BUY transaction with diBoaS wallet correctly', async () => {
        // First add money
        await dataManager.updateBalance({ type: 'add', amount: 200, fees: { total: 0 } })
        
        // Then buy with diBoaS wallet
        const buyTransaction = {
          type: 'buy',
          amount: 100,
          fees: { total: 2 },
          asset: 'BTC',
          paymentMethod: 'diboas_wallet'
        }

        await dataManager.updateBalance(buyTransaction)
        const balance = dataManager.getBalance()

        expect(balance.availableForSpending).toBe(100) // 200 - 100
        expect(balance.investedAmount).toBe(98) // 100 - 2 fees
        expect(balance.totalUSD).toBe(198) // 100 + 98
        expect(balance.assets.BTC.investedAmount).toBe(98)
      })

      it('should process BUY transaction with external payment correctly', async () => {
        const buyTransaction = {
          type: 'buy',
          amount: 100,
          fees: { total: 3 },
          asset: 'ETH',
          paymentMethod: 'credit_card'
        }

        await dataManager.updateBalance(buyTransaction)
        const balance = dataManager.getBalance()

        expect(balance.availableForSpending).toBe(0) // No change
        expect(balance.investedAmount).toBe(97) // 100 - 3 fees
        expect(balance.totalUSD).toBe(97)
        expect(balance.assets.ETH.investedAmount).toBe(97)
      })

      it('should process SELL transaction correctly', async () => {
        // Setup: Add money and buy assets
        await dataManager.updateBalance({ type: 'add', amount: 200, fees: { total: 0 } })
        await dataManager.updateBalance({
          type: 'buy',
          amount: 100,
          fees: { total: 0 },
          asset: 'BTC',
          paymentMethod: 'diboas_wallet'
        })

        // Now sell
        const sellTransaction = {
          type: 'sell',
          amount: 50,
          fees: { total: 1 },
          asset: 'BTC'
        }

        await dataManager.updateBalance(sellTransaction)
        const balance = dataManager.getBalance()

        expect(balance.availableForSpending).toBe(149) // 100 + 49 (sell proceeds)
        expect(balance.investedAmount).toBe(50) // 100 - 50 sold
        expect(balance.totalUSD).toBe(199)
        expect(balance.assets.BTC.investedAmount).toBe(50)
      })
    })

    describe('Edge Cases and Error Scenarios', () => {
      it('should handle insufficient balance for withdraw', async () => {
        await dataManager.updateBalance({ type: 'add', amount: 50, fees: { total: 0 } })
        
        await expect(
          dataManager.updateBalance({ type: 'withdraw', amount: 100 })
        ).rejects.toThrow()
      })

      it('should handle zero amounts gracefully', async () => {
        await dataManager.updateBalance({ type: 'add', amount: 0, fees: { total: 0 } })
        const balance = dataManager.getBalance()
        
        expect(balance.availableForSpending).toBe(0)
        expect(balance.totalUSD).toBe(0)
      })

      it('should handle negative amounts gracefully', async () => {
        await expect(
          dataManager.updateBalance({ type: 'add', amount: -100, fees: { total: 0 } })
        ).rejects.toThrow()
      })

      it('should handle missing transaction data', async () => {
        await expect(
          dataManager.updateBalance({})
        ).rejects.toThrow()
      })

      it('should handle invalid transaction types', async () => {
        await expect(
          dataManager.updateBalance({ type: 'invalid_type', amount: 100 })
        ).rejects.toThrow()
      })

      it('should prevent balance from going negative', async () => {
        await dataManager.updateBalance({ type: 'add', amount: 50, fees: { total: 0 } })
        await dataManager.updateBalance({ type: 'withdraw', amount: 60 })
        
        const balance = dataManager.getBalance()
        expect(balance.availableForSpending).toBeGreaterThanOrEqual(0)
      })
    })

    describe('Asset Tracking', () => {
      it('should track multiple assets correctly', async () => {
        await dataManager.updateBalance({ type: 'add', amount: 1000, fees: { total: 0 } })
        
        // Buy BTC
        await dataManager.updateBalance({
          type: 'buy',
          amount: 300,
          fees: { total: 3 },
          asset: 'BTC',
          paymentMethod: 'diboas_wallet'
        })
        
        // Buy ETH
        await dataManager.updateBalance({
          type: 'buy',
          amount: 200,
          fees: { total: 2 },
          asset: 'ETH',
          paymentMethod: 'diboas_wallet'
        })
        
        const balance = dataManager.getBalance()
        expect(balance.assets.BTC.investedAmount).toBe(297)
        expect(balance.assets.ETH.investedAmount).toBe(198)
        expect(balance.investedAmount).toBe(495) // 297 + 198
        expect(balance.availableForSpending).toBe(500) // 1000 - 300 - 200
      })

      it('should remove asset when fully sold', async () => {
        await dataManager.updateBalance({ type: 'add', amount: 200, fees: { total: 0 } })
        await dataManager.updateBalance({
          type: 'buy',
          amount: 100,
          fees: { total: 0 },
          asset: 'BTC',
          paymentMethod: 'diboas_wallet'
        })
        
        // Sell all BTC
        await dataManager.updateBalance({
          type: 'sell',
          amount: 100,
          fees: { total: 0 },
          asset: 'BTC'
        })
        
        const balance = dataManager.getBalance()
        expect(balance.assets.BTC).toBeUndefined()
        expect(balance.investedAmount).toBe(0)
      })
    })
  })

  describe('Transaction History Management', () => {
    describe('Transaction Addition', () => {
      it('should add transactions to history', () => {
        const transactionData = {
          id: 'tx_123',
          type: 'add',
          amount: 100,
          currency: 'USD',
          status: 'completed'
        }

        const transaction = dataManager.addTransaction(transactionData)
        const transactions = dataManager.getTransactions()

        expect(transactions).toHaveLength(1)
        expect(transaction.id).toBe('tx_123')
        expect(transaction.type).toBe('add')
        expect(transaction.amount).toBe(100)
      })

      it('should generate transaction ID if not provided', () => {
        const transactionData = {
          type: 'send',
          amount: 50
        }

        const transaction = dataManager.addTransaction(transactionData)
        expect(transaction.id).toBeDefined()
        expect(transaction.id).toMatch(/^tx_\d+_[a-z0-9]+$/)
      })

      it('should add category information automatically', () => {
        const transactionData = {
          type: 'buy',
          amount: 200
        }

        const transaction = dataManager.addTransaction(transactionData)
        expect(transaction.category).toBe('investment')
      })

      it('should maintain transaction order (newest first)', () => {
        dataManager.addTransaction({ id: 'tx_1', type: 'add', amount: 100 })
        dataManager.addTransaction({ id: 'tx_2', type: 'send', amount: 50 })
        dataManager.addTransaction({ id: 'tx_3', type: 'buy', amount: 200 })

        const transactions = dataManager.getTransactions()
        expect(transactions[0].id).toBe('tx_3')
        expect(transactions[1].id).toBe('tx_2')
        expect(transactions[2].id).toBe('tx_1')
      })

      it('should limit transaction history to 100 items', () => {
        // Add 105 transactions
        for (let i = 0; i < 105; i++) {
          dataManager.addTransaction({
            id: `tx_${i}`,
            type: 'add',
            amount: 10
          })
        }

        const transactions = dataManager.getTransactions()
        expect(transactions).toHaveLength(100)
        expect(transactions[0].id).toBe('tx_104') // Most recent
        expect(transactions[99].id).toBe('tx_5') // Oldest kept
      })
    })

    describe('Transaction Updates', () => {
      it('should update existing transactions', () => {
        const transaction = dataManager.addTransaction({
          id: 'tx_update',
          type: 'add',
          amount: 100,
          status: 'pending'
        })

        const updated = dataManager.updateTransaction('tx_update', {
          status: 'completed',
          confirmedAt: new Date().toISOString()
        })

        expect(updated.status).toBe('completed')
        expect(updated.confirmedAt).toBeDefined()
        expect(updated.lastUpdated).toBeDefined()
      })

      it('should return null for non-existent transaction updates', () => {
        const result = dataManager.updateTransaction('non_existent', { status: 'completed' })
        expect(result).toBeNull()
      })
    })
  })

  describe('Event System', () => {
    describe('Event Subscriptions', () => {
      it('should allow subscribing to events', () => {
        const callback = vi.fn()
        const unsubscribe = dataManager.subscribe('balance:updated', callback)

        expect(typeof unsubscribe).toBe('function')
      })

      it('should emit events when balance is updated', async () => {
        const callback = vi.fn()
        dataManager.subscribe('balance:updated', callback)

        await dataManager.updateBalance({ type: 'add', amount: 100, fees: { total: 0 } })

        expect(callback).toHaveBeenCalledWith(
          expect.objectContaining({
            availableForSpending: 100,
            totalUSD: 100
          })
        )
      })

      it('should emit events when transactions are added', () => {
        const callback = vi.fn()
        dataManager.subscribe('transaction:added', callback)

        const transaction = dataManager.addTransaction({
          type: 'send',
          amount: 50
        })

        expect(callback).toHaveBeenCalledWith(transaction)
      })

      it('should allow unsubscribing from events', () => {
        const callback = vi.fn()
        const unsubscribe = dataManager.subscribe('balance:updated', callback)

        unsubscribe()
        dataManager.emit('balance:updated', {})

        expect(callback).not.toHaveBeenCalled()
      })
    })

    describe('Event Memory Management', () => {
      it('should clean up empty subscription sets', () => {
        const callback = vi.fn()
        const unsubscribe = dataManager.subscribe('test:event', callback)
        
        unsubscribe()
        dataManager.cleanupSubscriptions()

        // Should not throw when emitting to cleaned up events
        expect(() => dataManager.emit('test:event', {})).not.toThrow()
      })

      it('should handle failed callbacks gracefully', () => {
        const failingCallback = vi.fn(() => {
          throw new Error('Callback failed')
        })
        const workingCallback = vi.fn()

        dataManager.subscribe('test:event', failingCallback)
        dataManager.subscribe('test:event', workingCallback)

        expect(() => dataManager.emit('test:event', {})).not.toThrow()
        expect(workingCallback).toHaveBeenCalled()
      })
    })
  })

  describe('Concurrency and Locking', () => {
    describe('Transaction Locking', () => {
      it('should prevent concurrent balance updates', async () => {
        const results = await Promise.all([
          dataManager.updateBalance({ type: 'add', amount: 100, fees: { total: 0 } }),
          dataManager.updateBalance({ type: 'add', amount: 50, fees: { total: 0 } }),
          dataManager.updateBalance({ type: 'add', amount: 25, fees: { total: 0 } })
        ])

        const balance = dataManager.getBalance()
        expect(balance.availableForSpending).toBe(175) // All transactions should complete
      })

      it('should handle operation timeouts', async () => {
        // Mock a long-running operation
        const longOperation = () => new Promise(resolve => setTimeout(resolve, 100))
        
        const startTime = Date.now()
        await dataManager.withTransactionLock('test-operation', longOperation)
        const endTime = Date.now()

        expect(endTime - startTime).toBeGreaterThanOrEqual(100)
      })
    })

    describe('Data Integrity Under Load', () => {
      it('should maintain data integrity with rapid updates', async () => {
        const operations = []
        
        // Create 50 concurrent add operations
        for (let i = 0; i < 50; i++) {
          operations.push(
            dataManager.updateBalance({
              type: 'add',
              amount: 10,
              fees: { total: 0 }
            })
          )
        }

        await Promise.all(operations)
        
        const balance = dataManager.getBalance()
        expect(balance.availableForSpending).toBe(500) // 50 * 10
        expect(balance.totalUSD).toBe(500)
      })
    })
  })

  describe('Memory Management and Cleanup', () => {
    describe('Cleanup Operations', () => {
      it('should trim transaction history when limit exceeded', () => {
        dataManager.maxTransactionHistory = 5
        
        // Add 10 transactions
        for (let i = 0; i < 10; i++) {
          dataManager.addTransaction({
            id: `tx_${i}`,
            type: 'add',
            amount: 10
          })
        }

        dataManager.trimTransactionHistory()
        const transactions = dataManager.getTransactions()
        
        expect(transactions).toHaveLength(5)
        expect(transactions[0].id).toBe('tx_9') // Most recent
      })

      it('should clean up stale locks', () => {
        const lockKey = 'test-lock'
        dataManager.transactionLock.set(`lock-${lockKey}`, {
          timestamp: Date.now() - 60000, // 1 minute ago
          operationId: lockKey
        })

        dataManager.cleanupStaleLocks()
        
        expect(dataManager.transactionLock.has(`lock-${lockKey}`)).toBe(false)
      })

      it('should dispose cleanly', () => {
        const callback = vi.fn()
        dataManager.subscribe('test:event', callback)
        
        dataManager.dispose()
        
        expect(dataManager.disposed).toBe(true)
        expect(dataManager.subscribers.size).toBe(0)
        expect(dataManager.transactionLock.size).toBe(0)
        expect(dataManager.operationQueue.length).toBe(0)
      })
    })
  })

  describe('Error Recovery Scenarios', () => {
    describe('System Recovery', () => {
      it('should recover from corrupted balance data', async () => {
        // Corrupt the balance
        dataManager.state.balance = null

        await expect(
          dataManager.updateBalance({ type: 'add', amount: 100, fees: { total: 0 } })
        ).rejects.toThrow()

        // System should be able to reset
        dataManager.initializeCleanState()
        const balance = dataManager.getBalance()
        
        expect(balance).toBeDefined()
        expect(balance.totalUSD).toBe(0)
      })

      it('should handle storage failures gracefully', async () => {
        // Mock storage failure
        vi.spyOn(dataManager, 'persistBalance').mockRejectedValue(new Error('Storage failed'))

        // Operation should still complete
        await expect(
          dataManager.updateBalance({ type: 'add', amount: 100, fees: { total: 0 } })
        ).resolves.toBeDefined()

        const balance = dataManager.getBalance()
        expect(balance.availableForSpending).toBe(100)
      })

      it('should maintain consistency after errors', async () => {
        await dataManager.updateBalance({ type: 'add', amount: 200, fees: { total: 0 } })

        // Simulate an error in the middle of a transaction
        vi.spyOn(dataManager, 'addTransaction').mockImplementationOnce(() => {
          throw new Error('Transaction save failed')
        })

        await expect(
          dataManager.processTransaction({ type: 'send', amount: 50 })
        ).rejects.toThrow()

        // Balance should be consistent
        const balance = dataManager.getBalance()
        expect(balance.availableForSpending).toBe(200) // No change due to error
      })
    })
  })

  describe('Security and Validation', () => {
    describe('Input Validation', () => {
      it('should validate transaction amounts', async () => {
        await expect(
          dataManager.updateBalance({ type: 'add', amount: 'invalid' })
        ).rejects.toThrow()
      })

      it('should validate transaction types', async () => {
        await expect(
          dataManager.updateBalance({ type: 'malicious_type', amount: 100 })
        ).rejects.toThrow()
      })

      it('should prevent balance manipulation', async () => {
        const originalBalance = 100
        await dataManager.updateBalance({ type: 'add', amount: originalBalance, fees: { total: 0 } })

        // Attempt to manipulate balance directly
        dataManager.state.balance.availableForSpending = 999999

        // Next transaction should validate and potentially reset
        await expect(
          dataManager.updateBalance({ type: 'withdraw', amount: 50 })
        ).rejects.toThrow()
      })
    })

    describe('Data Protection', () => {
      it('should return defensive copies of state', () => {
        const balance1 = dataManager.getBalance()
        const balance2 = dataManager.getBalance()

        balance1.availableForSpending = 999999
        
        expect(balance2.availableForSpending).not.toBe(999999)
        expect(dataManager.getBalance().availableForSpending).not.toBe(999999)
      })

      it('should return defensive copies of transactions', () => {
        dataManager.addTransaction({ id: 'tx_1', type: 'add', amount: 100 })
        
        const transactions1 = dataManager.getTransactions()
        const transactions2 = dataManager.getTransactions()

        transactions1[0].amount = 999999
        
        expect(transactions2[0].amount).toBe(100)
        expect(dataManager.getTransactions()[0].amount).toBe(100)
      })
    })
  })
})