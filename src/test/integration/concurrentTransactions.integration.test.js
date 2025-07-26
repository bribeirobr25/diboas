/**
 * Concurrent Transaction Integration Tests
 * Tests race conditions, concurrent operations, and transaction integrity
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OnChainTransactionManager } from '../../services/transactions/OnChainTransactionManager.js'
import { MockOnChainStatusProvider, TRANSACTION_STATUS } from '../../services/onchain/OnChainStatusProvider.js'

// Mock dependencies
vi.mock('../../services/DataManager.js', () => {
  const mockDataManager = {
    getState: vi.fn(),
    updateBalance: vi.fn(),
    updateTransaction: vi.fn(),
    addTransaction: vi.fn(),
    emit: vi.fn()
  }
  return {
    getDataManager: vi.fn(() => mockDataManager),
    default: mockDataManager
  }
})

vi.mock('../../utils/secureRandom.js', () => ({
  generateSecureTransactionId: vi.fn(() => `tx-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`)
}))

vi.mock('../../utils/securityLogging.js', () => ({
  logSecureEvent: vi.fn(() => Promise.resolve())
}))

describe('Concurrent Transaction Integration Tests', () => {
  let onChainManager
  let statusProvider
  let mockDataManager

  beforeEach(async () => {
    statusProvider = new MockOnChainStatusProvider()
    onChainManager = new OnChainTransactionManager()
    onChainManager.onChainProvider = statusProvider
    await onChainManager.initialize()

    mockDataManager = (await import('../../services/DataManager.js')).getDataManager()
    
    // Setup realistic balance state with new structure
    mockDataManager.getState.mockReturnValue({
      balance: {
        totalUSD: 1500,
        availableForSpending: 1000,
        investedAmount: 500,
        total: 1500,
        assets: {
          BTC: { amount: 0, value: 200 },
          ETH: { amount: 0, value: 300 }
        }
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Race Condition Prevention', () => {
    it('should handle multiple simultaneous transactions from same user', async () => {
      vi.useFakeTimers()
      
      const userId = 'user-123'
      const transactions = [
        { type: 'transfer', amount: 100, recipient: 'addr1', userId },
        { type: 'transfer', amount: 150, recipient: 'addr2', userId },
        { type: 'buy', amount: 200, asset: 'BTC', paymentMethod: 'diboas_wallet', userId }
      ]

      // Execute all transactions simultaneously
      const promises = transactions.map(tx => onChainManager.executeTransaction(tx))
      const results = await Promise.allSettled(promises)

      // All should succeed initially (submitted to blockchain)
      results.forEach(result => {
        expect(result.status).toBe('fulfilled')
        expect(result.value.success).toBe(true)
      })

      // Wait for all confirmations
      await vi.advanceTimersByTimeAsync(5000)

      // Verify balance integrity - total debits should not exceed available balance
      const mockSetStateCalls = mockDataManager.setState.mock.calls
      let finalBalance = 1000 // Starting balance

      mockSetStateCalls.forEach(call => {
        const balanceUpdate = call[0].balance
        if (balanceUpdate) {
          finalBalance = balanceUpdate.available
        }
      })

      // Final balance should never go negative
      expect(finalBalance).toBeGreaterThanOrEqual(0)
      
      // Total transaction amounts should not exceed starting balance
      const totalTransactionAmount = transactions
        .filter(tx => tx.type === 'transfer' || (tx.type === 'buy' && tx.paymentMethod === 'diboas_wallet'))
        .reduce((sum, tx) => sum + tx.amount, 0)
      
      if (totalTransactionAmount > 1000) {
        // Some transactions should have failed to prevent overdraft
        const failedTransactions = results.filter(result => 
          result.status === 'rejected' || !result.value.success
        )
        expect(failedTransactions.length).toBeGreaterThan(0)
      }

      vi.useRealTimers()
    })

    it('should prevent double-spending attacks', async () => {
      vi.useFakeTimers()
      
      const userId = 'user-123'
      
      // Attempt to spend the same funds twice simultaneously
      const spendTransaction = {
        type: 'transfer',
        amount: 900, // Almost entire balance
        recipient: 'target-address',
        userId
      }

      // Execute the same transaction twice at exactly the same time
      const [result1, result2] = await Promise.allSettled([
        onChainManager.executeTransaction(spendTransaction),
        onChainManager.executeTransaction(spendTransaction)
      ])

      // Both may initially succeed (submitted to blockchain)
      // But balance updates should prevent double-spending
      await vi.advanceTimersByTimeAsync(5000)

      // Verify that total debited amount doesn't exceed available balance
      const balanceUpdates = mockDataManager.setState.mock.calls
        .map(call => call[0].balance)
        .filter(Boolean)

      if (balanceUpdates.length > 0) {
        const finalBalance = balanceUpdates[balanceUpdates.length - 1]
        expect(finalBalance.available).toBeGreaterThanOrEqual(0)
      }

      vi.useRealTimers()
    })

    it('should handle concurrent balance inquiries during transactions', async () => {
      vi.useFakeTimers()
      
      const userId = 'user-123'
      
      // Start a transaction
      const transactionPromise = onChainManager.executeTransaction({
        type: 'transfer',
        amount: 100,
        recipient: 'addr1',
        userId
      })

      // While transaction is processing, check balance multiple times
      const balanceChecks = Array(10).fill(null).map(() => 
        mockDataManager.getState()
      )

      await transactionPromise
      await vi.advanceTimersByTimeAsync(3000)

      // All balance checks should return consistent data
      balanceChecks.forEach(balance => {
        expect(balance.balance.total).toBe(1500)
        expect(balance.balance.available).toBeLessThanOrEqual(1000)
        expect(balance.balance.invested).toBe(500)
      })

      vi.useRealTimers()
    })
  })

  describe('Transaction Ordering & Consistency', () => {
    it('should maintain FIFO ordering for transactions', async () => {
      vi.useFakeTimers()
      
      const userId = 'user-123'
      const orderedTransactions = [
        { type: 'transfer', amount: 50, recipient: 'addr1', userId, order: 1 },
        { type: 'transfer', amount: 75, recipient: 'addr2', userId, order: 2 },
        { type: 'transfer', amount: 100, recipient: 'addr3', userId, order: 3 }
      ]

      const startTimes = []
      
      // Execute transactions in rapid succession
      for (const tx of orderedTransactions) {
        startTimes.push(Date.now())
        await onChainManager.executeTransaction(tx)
        // Small delay to ensure ordering
        await vi.advanceTimersByTimeAsync(10)
      }

      // Wait for all confirmations
      await vi.advanceTimersByTimeAsync(5000)

      // Verify transactions were processed in order
      const transactionHistory = mockDataManager.addTransaction.mock.calls
      if (transactionHistory.length > 0) {
        for (let i = 1; i < transactionHistory.length; i++) {
          const prevTx = transactionHistory[i - 1][0]
          const currentTx = transactionHistory[i][0]
          
          // Later transactions should have later timestamps
          expect(new Date(currentTx.createdAt).getTime())
            .toBeGreaterThanOrEqual(new Date(prevTx.createdAt).getTime())
        }
      }

      vi.useRealTimers()
    })

    it('should maintain atomic balance updates', async () => {
      vi.useFakeTimers()
      
      const userId = 'user-123'
      
      // Transaction that should partially succeed/fail
      const complexTransaction = {
        type: 'buy',
        amount: 1200, // More than available balance
        asset: 'BTC',
        paymentMethod: 'diboas_wallet',
        userId
      }

      try {
        await onChainManager.executeTransaction(complexTransaction)
        await vi.advanceTimersByTimeAsync(5000)
      } catch (error) {
        // Expected to fail
      }

      // Verify balance remained consistent (all or nothing)
      const balanceUpdates = mockDataManager.setState.mock.calls
        .map(call => call[0].balance)
        .filter(Boolean)

      balanceUpdates.forEach(balance => {
        // Balance should always be mathematically consistent
        expect(balance.total).toBe(balance.available + balance.invested)
        expect(balance.available).toBeGreaterThanOrEqual(0)
        expect(balance.invested).toBeGreaterThanOrEqual(0)
      })

      vi.useRealTimers()
    })
  })

  describe('Network Failure Scenarios', () => {
    it('should handle partial network failures gracefully', async () => {
      vi.useFakeTimers()
      
      // Mock intermittent network failures
      let callCount = 0
      vi.spyOn(statusProvider, 'submitTransaction').mockImplementation(async (txData) => {
        callCount++
        if (callCount % 3 === 0) {
          // Every third call fails
          throw new Error('Network timeout')
        }
        return {
          success: true,
          txHash: `hash-${callCount}`,
          explorerLink: `https://explorer.com/tx/hash-${callCount}`,
          estimatedConfirmationTime: 2000
        }
      })

      const transactions = Array(10).fill(null).map((_, i) => ({
        type: 'transfer',
        amount: 10,
        recipient: `addr${i}`,
        userId: 'user-123'
      }))

      const results = await Promise.allSettled(
        transactions.map(tx => onChainManager.executeTransaction(tx))
      )

      // Some should succeed, some should fail
      const successes = results.filter(r => r.status === 'fulfilled' && r.value.success)
      const failures = results.filter(r => r.status === 'rejected' || !r.value.success)

      expect(successes.length).toBeGreaterThan(0)
      expect(failures.length).toBeGreaterThan(0)

      // Failed transactions should not affect balance
      await vi.advanceTimersByTimeAsync(5000)

      const finalBalance = mockDataManager.getState().balance.available
      const expectedDeduction = successes.length * 10
      expect(finalBalance).toBeGreaterThanOrEqual(1000 - expectedDeduction)

      vi.useRealTimers()
    })

    it('should handle blockchain network congestion', async () => {
      vi.useFakeTimers()
      
      // Mock slow blockchain confirmations
      vi.spyOn(statusProvider, 'startConfirmationProcess').mockImplementation(async (txId) => {
        const tx = statusProvider.pendingTransactions.get(txId)
        if (!tx) return

        // Simulate very slow confirmation (network congestion)
        setTimeout(() => {
          tx.status = TRANSACTION_STATUS.CONFIRMED
          tx.confirmations = tx.requiredConfirmations
          tx.confirmedAt = new Date().toISOString()
        }, 30000) // 30 seconds delay
      })

      const transaction = {
        type: 'transfer',
        amount: 100,
        recipient: 'slow-network-addr',
        userId: 'user-123'
      }

      const result = await onChainManager.executeTransaction(transaction)
      expect(result.success).toBe(true)

      // Transaction should remain pending for extended time
      await vi.advanceTimersByTimeAsync(20000) // 20 seconds
      
      const status = onChainManager.getTransactionStatus(result.transactionId)
      expect(status.status).not.toBe('confirmed')

      // Eventually should confirm
      await vi.advanceTimersByTimeAsync(15000) // Additional 15 seconds
      
      const finalStatus = onChainManager.getTransactionStatus(result.transactionId)
      expect(finalStatus.status).toBe('confirmed')

      vi.useRealTimers()
    })
  })

  describe('Resource Exhaustion Scenarios', () => {
    it('should handle high transaction volume without memory leaks', async () => {
      vi.useFakeTimers()
      
      const initialMemory = process.memoryUsage().heapUsed
      const transactionCount = 1000

      // Create high volume of transactions
      const transactions = Array(transactionCount).fill(null).map((_, i) => ({
        type: 'transfer',
        amount: 1, // Small amounts to avoid balance issues
        recipient: `addr${i}`,
        userId: `user-${i % 10}` // Distribute across 10 users
      }))

      // Process in batches to simulate real load
      const batchSize = 50
      for (let i = 0; i < transactions.length; i += batchSize) {
        const batch = transactions.slice(i, i + batchSize)
        await Promise.allSettled(
          batch.map(tx => onChainManager.executeTransaction(tx))
        )
        
        // Small delay between batches
        await vi.advanceTimersByTimeAsync(100)
      }

      // Wait for all confirmations
      await vi.advanceTimersByTimeAsync(10000)

      // Memory usage should not have grown excessively
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      const memoryPerTransaction = memoryIncrease / transactionCount

      // Each transaction should not consume excessive memory
      expect(memoryPerTransaction).toBeLessThan(10000) // 10KB per transaction

      vi.useRealTimers()
    })

    it('should handle provider service unavailability', async () => {
      vi.useFakeTimers()
      
      // Mock all providers failing
      vi.spyOn(statusProvider, 'submitTransaction').mockRejectedValue(
        new Error('All blockchain providers unavailable')
      )

      const transaction = {
        type: 'transfer',
        amount: 100,
        recipient: 'unavailable-addr',
        userId: 'user-123'
      }

      const result = await onChainManager.executeTransaction(transaction)
      
      expect(result.success).toBe(false)
      expect(result.error).toMatch(/unavailable|failed/i)

      // Balance should remain unchanged
      const balance = mockDataManager.getState().balance
      expect(balance.available).toBe(1000)

      vi.useRealTimers()
    })
  })

  describe('Data Consistency Under Load', () => {
    it('should maintain data integrity under concurrent operations', async () => {
      vi.useFakeTimers()
      
      const userId = 'user-123'
      const concurrentOperations = [
        // Transfers
        ...Array(5).fill(null).map((_, i) => ({
          type: 'transfer',
          amount: 50,
          recipient: `addr${i}`,
          userId
        })),
        // Buys
        ...Array(3).fill(null).map((_, i) => ({
          type: 'buy',
          amount: 100,
          asset: 'BTC',
          paymentMethod: 'diboas_wallet',
          userId
        })),
        // Sells
        ...Array(2).fill(null).map((_, i) => ({
          type: 'sell',
          amount: 75,
          asset: 'ETH',
          userId
        }))
      ]

      // Execute all operations simultaneously
      const results = await Promise.allSettled(
        concurrentOperations.map(op => onChainManager.executeTransaction(op))
      )

      // Wait for all to complete
      await vi.advanceTimersByTimeAsync(10000)

      // Verify final state consistency
      const allBalanceUpdates = mockDataManager.setState.mock.calls
        .map(call => call[0].balance)
        .filter(Boolean)

      if (allBalanceUpdates.length > 0) {
        const finalBalance = allBalanceUpdates[allBalanceUpdates.length - 1]
        
        // Mathematical consistency
        expect(finalBalance.total).toBe(finalBalance.available + finalBalance.invested)
        
        // No negative balances
        expect(finalBalance.available).toBeGreaterThanOrEqual(0)
        expect(finalBalance.invested).toBeGreaterThanOrEqual(0)
        
        // Asset values should be consistent
        if (finalBalance.assets) {
          Object.values(finalBalance.assets).forEach(asset => {
            expect(asset.value).toBeGreaterThanOrEqual(0)
          })
        }
      }

      vi.useRealTimers()
    })
  })

  describe('Transaction State Recovery', () => {
    it('should recover from partial transaction state corruption', async () => {
      vi.useFakeTimers()
      
      const transaction = {
        type: 'transfer',
        amount: 100,
        recipient: 'recovery-addr',
        userId: 'user-123'
      }

      const result = await onChainManager.executeTransaction(transaction)
      
      // Simulate state corruption
      const pendingTx = onChainManager.pendingTransactions.get(result.transactionId)
      pendingTx.status = 'corrupted-state'
      pendingTx.balanceUpdateApplied = undefined

      // System should detect and handle corruption
      const status = onChainManager.getTransactionStatus(result.transactionId)
      expect(status).toBeDefined()
      
      // Should either recover or mark as failed gracefully
      await vi.advanceTimersByTimeAsync(5000)
      
      const finalStatus = onChainManager.getTransactionStatus(result.transactionId)
      expect(['confirmed', 'failed'].includes(finalStatus.status)).toBe(true)

      vi.useRealTimers()
    })
  })
})