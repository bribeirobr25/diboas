/**
 * Transaction Performance Tests
 * Performance benchmarks and load testing for financial operations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { DataManager } from '../../services/DataManager.js'

describe('Transaction Performance Tests', () => {
  let dataManager
  let performanceMetrics

  beforeEach(() => {
    dataManager = new DataManager()
    performanceMetrics = {
      startTime: 0,
      endTime: 0,
      memoryStart: 0,
      memoryEnd: 0
    }
  })

  afterEach(() => {
    // Cleanup any performance monitoring
    if (global.gc) {
      global.gc() // Force garbage collection if available
    }
  })

  describe('Transaction Processing Speed', () => {
    it('should process single transaction under 100ms', async () => {
      const transaction = {
        id: 'perf_single',
        amount: 100.00,
        type: 'transfer',
        userId: 'user_perf'
      }

      const startTime = performance.now()
      const result = await dataManager.processTransaction(transaction)
      const endTime = performance.now()

      const duration = endTime - startTime
      
      expect(result.success).toBe(true)
      expect(duration).toBeLessThan(100) // Less than 100ms
    })

    it('should process 100 transactions under 5 seconds', async () => {
      const transactions = Array.from({ length: 100 }, (_, i) => ({
        id: `perf_batch_${i}`,
        amount: Math.floor(Math.random() * 1000) + 1,
        type: 'transfer',
        userId: `user_${i % 10}` // 10 different users
      }))

      const startTime = performance.now()
      const results = await Promise.all(
        transactions.map(tx => dataManager.processTransaction(tx))
      )
      const endTime = performance.now()

      const duration = endTime - startTime
      const successCount = results.filter(r => r.success).length

      expect(successCount).toBeGreaterThan(95) // At least 95% success rate
      expect(duration).toBeLessThan(5000) // Less than 5 seconds
      expect(duration / transactions.length).toBeLessThan(50) // Average < 50ms per transaction
    })

    it('should handle burst load of 1000 concurrent transactions', async () => {
      const burstTransactions = Array.from({ length: 1000 }, (_, i) => ({
        id: `burst_${i}`,
        amount: 10.00,
        type: 'micro_transfer',
        userId: `user_${i % 50}`, // 50 different users
        timestamp: Date.now()
      }))

      const startTime = performance.now()
      
      // Process all transactions concurrently
      const results = await Promise.allSettled(
        burstTransactions.map(tx => dataManager.processTransaction(tx))
      )
      
      const endTime = performance.now()
      const duration = endTime - startTime

      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length
      const failureCount = results.length - successCount

      // Performance expectations
      expect(duration).toBeLessThan(10000) // Less than 10 seconds for 1000 transactions
      expect(successCount).toBeGreaterThan(900) // At least 90% success rate under load
      expect(failureCount).toBeLessThan(100) // Less than 10% failures acceptable under burst

      // Log performance metrics
      console.log(`Burst Performance: ${successCount}/1000 transactions in ${duration}ms`)
      console.log(`Average time per transaction: ${duration / 1000}ms`)
    })
  })

  describe('Memory Usage and Leak Detection', () => {
    it('should not create memory leaks during transaction processing', async () => {
      // Force garbage collection before test
      if (global.gc) global.gc()
      
      const initialMemory = process.memoryUsage().heapUsed

      // Process many transactions
      for (let i = 0; i < 500; i++) {
        await dataManager.processTransaction({
          id: `mem_test_${i}`,
          amount: 50.00,
          type: 'transfer',
          userId: 'memory_test_user'
        })
      }

      // Force garbage collection after processing
      if (global.gc) global.gc()
      
      // Wait for cleanup
      await new Promise(resolve => setTimeout(resolve, 100))
      
      const finalMemory = process.memoryUsage().heapUsed
      const memoryIncrease = finalMemory - initialMemory
      const memoryIncreasePerTx = memoryIncrease / 500

      // Memory increase should be minimal (less than 1KB per transaction)
      expect(memoryIncreasePerTx).toBeLessThan(1024)
      
      console.log(`Memory usage per transaction: ${memoryIncreasePerTx} bytes`)
    })

    it('should cleanup transaction history efficiently', async () => {
      const userId = 'cleanup_test_user'
      
      // Create many transactions for cleanup
      const oldTransactions = Array.from({ length: 1000 }, (_, i) => ({
        id: `old_tx_${i}`,
        amount: 25.00,
        userId: userId,
        timestamp: Date.now() - (30 * 24 * 60 * 60 * 1000) // 30 days old
      }))

      // Process old transactions
      await Promise.all(oldTransactions.map(tx => dataManager.processTransaction(tx)))

      const beforeCleanupMemory = process.memoryUsage().heapUsed

      // Perform cleanup
      const startTime = performance.now()
      await dataManager.cleanupOldTransactions(userId, 30) // Cleanup 30+ day old transactions
      const endTime = performance.now()

      const cleanupDuration = endTime - startTime
      const afterCleanupMemory = process.memoryUsage().heapUsed
      const memoryFreed = beforeCleanupMemory - afterCleanupMemory

      // Cleanup should be fast and free memory
      expect(cleanupDuration).toBeLessThan(1000) // Less than 1 second
      expect(memoryFreed).toBeGreaterThan(0) // Should free some memory
    })
  })

  describe('Concurrent Operations', () => {
    it('should handle concurrent balance updates without race conditions', async () => {
      const userId = 'concurrent_test_user'
      
      // Initialize balance
      await dataManager.updateBalance(userId, 1000.00, 'initial')

      // Create concurrent operations
      const concurrentOps = Array.from({ length: 50 }, (_, i) => {
        const isDeposit = i % 2 === 0
        return dataManager.updateBalance(
          userId, 
          isDeposit ? 10.00 : -10.00, 
          isDeposit ? 'deposit' : 'withdrawal'
        )
      })

      const results = await Promise.allSettled(concurrentOps)
      const finalBalance = await dataManager.getBalance(userId)

      // All operations should succeed and balance should be correct
      const successCount = results.filter(r => r.status === 'fulfilled' && r.value.success).length
      expect(successCount).toBe(50)
      expect(finalBalance).toBe(1000.00) // Should return to original balance (25 deposits, 25 withdrawals)
    })

    it('should maintain transaction ordering under concurrent load', async () => {
      const userId = 'ordering_test_user'
      const transactionCount = 100
      
      // Create ordered transactions with sequential amounts
      const orderedTransactions = Array.from({ length: transactionCount }, (_, i) => ({
        id: `ordered_${i}`,
        amount: i + 1, // Sequential amounts: 1, 2, 3, ...
        userId: userId,
        sequence: i,
        timestamp: Date.now() + i // Sequential timestamps
      }))

      // Process concurrently (but they should maintain order by timestamp)
      await Promise.all(orderedTransactions.map(tx => dataManager.processTransaction(tx)))

      // Retrieve transaction history
      const history = await dataManager.getTransactionHistory(userId, { limit: transactionCount })

      // Verify transactions are ordered correctly by sequence
      for (let i = 0; i < history.length - 1; i++) {
        expect(history[i].sequence).toBeLessThan(history[i + 1].sequence)
      }
    })
  })

  describe('Database Performance', () => {
    it('should query large transaction history efficiently', async () => {
      const userId = 'large_history_user'
      
      // Create large transaction history (simulate existing data)
      const largeHistory = Array.from({ length: 10000 }, (_, i) => ({
        id: `history_${i}`,
        amount: Math.random() * 1000,
        userId: userId,
        timestamp: Date.now() - (i * 60000) // 1 minute intervals
      }))

      // Simulate having large history in database
      await dataManager.bulkInsertTransactions(largeHistory)

      // Test query performance
      const startTime = performance.now()
      const recentHistory = await dataManager.getTransactionHistory(userId, { 
        limit: 50,
        offset: 0 
      })
      const endTime = performance.now()

      const queryDuration = endTime - startTime

      expect(recentHistory).toHaveLength(50)
      expect(queryDuration).toBeLessThan(500) // Query should be under 500ms even with 10k records
    })

    it('should perform complex balance calculations efficiently', async () => {
      const userId = 'calculation_test_user'
      
      // Create complex scenario with multiple transaction types
      const complexTransactions = [
        ...Array.from({ length: 100 }, (_, i) => ({ 
          type: 'deposit', amount: 100 + i, userId, fee: 1.00 
        })),
        ...Array.from({ length: 50 }, (_, i) => ({ 
          type: 'withdrawal', amount: 50 + i, userId, fee: 2.00 
        })),
        ...Array.from({ length: 75 }, (_, i) => ({ 
          type: 'trade', amount: 25 + i, userId, fee: 0.5 
        }))
      ]

      await Promise.all(complexTransactions.map(tx => dataManager.processTransaction(tx)))

      const startTime = performance.now()
      const balanceReport = await dataManager.calculateComplexBalance(userId, {
        includeFeesTotals: true,
        includePendingTransactions: true,
        includeProjectedBalance: true
      })
      const endTime = performance.now()

      const calculationDuration = endTime - startTime

      expect(balanceReport).toHaveProperty('totalBalance')
      expect(balanceReport).toHaveProperty('totalFees')
      expect(balanceReport).toHaveProperty('transactionCount')
      expect(calculationDuration).toBeLessThan(200) // Complex calculation under 200ms
    })
  })

  describe('API Response Times', () => {
    it('should respond to balance queries under 50ms', async () => {
      const userId = 'api_response_user'
      
      const startTime = performance.now()
      const balance = await dataManager.getBalance(userId)
      const endTime = performance.now()

      const responseTime = endTime - startTime

      expect(typeof balance).toBe('number')
      expect(responseTime).toBeLessThan(50) // Under 50ms for balance query
    })

    it('should handle high-frequency balance checks efficiently', async () => {
      const userId = 'high_freq_user'
      const checkCount = 1000
      
      const startTime = performance.now()
      
      // Simulate high-frequency balance checking
      const balanceChecks = Array.from({ length: checkCount }, () => 
        dataManager.getBalance(userId)
      )
      
      const results = await Promise.all(balanceChecks)
      const endTime = performance.now()

      const totalDuration = endTime - startTime
      const avgResponseTime = totalDuration / checkCount

      expect(results).toHaveLength(checkCount)
      expect(avgResponseTime).toBeLessThan(10) // Average under 10ms per check
      expect(totalDuration).toBeLessThan(5000) // Total under 5 seconds
    })
  })

  describe('Resource Management', () => {
    it('should handle database connection pooling efficiently', async () => {
      // Simulate many concurrent database operations
      const dbOperations = Array.from({ length: 200 }, (_, i) => 
        dataManager.performDatabaseOperation({
          operation: 'select',
          table: 'transactions',
          where: { userId: `user_${i % 20}` }
        })
      )

      const startTime = performance.now()
      const results = await Promise.allSettled(dbOperations)
      const endTime = performance.now()

      const duration = endTime - startTime
      const successCount = results.filter(r => r.status === 'fulfilled').length

      // Should handle connection pooling without timeouts
      expect(successCount).toBeGreaterThan(190) // At least 95% success
      expect(duration).toBeLessThan(3000) // Under 3 seconds for 200 operations
    })

    it('should implement proper timeout handling for external services', async () => {
      const slowExternalCall = dataManager.callExternalAPI({
        url: 'https://slow-api.example.com/data',
        timeout: 1000 // 1 second timeout
      })

      const startTime = performance.now()
      
      try {
        await slowExternalCall
      } catch (error) {
        const endTime = performance.now()
        const duration = endTime - startTime
        
        expect(error.message).toContain('timeout')
        expect(duration).toBeLessThan(1200) // Should timeout around 1 second (allow 200ms buffer)
        expect(duration).toBeGreaterThan(800) // But not too early
      }
    })
  })
})