/**
 * Transaction Failure Tests
 * Tests transaction failure scenarios and error feedback
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { dataManager } from '../../services/DataManager.js'
import { FeeCalculator } from '../../utils/feeCalculations.js'

describe('Transaction Failure Tests', () => {
  let feeCalculator

  beforeEach(() => {
    feeCalculator = new FeeCalculator()
    // Clear transaction history for clean state
    dataManager.state.transactions = []
  })

  describe('Transaction Failure Logging', () => {
    it('should log failed transactions to history with failed status', async () => {
      const invalidTransaction = {
        type: 'add',
        amount: 0, // Invalid amount
        paymentMethod: 'credit_debit_card',
        userId: 'test_user'
      }

      const result = await dataManager.processTransaction(invalidTransaction)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid transaction amount')
      expect(result.transaction).toBeDefined()
      expect(result.transaction.status).toBe('failed')
      expect(result.transaction.isFailed).toBe(true)
      expect(result.transaction.error).toBe('Invalid transaction amount')
      
      // Check transaction is in history
      const transactions = dataManager.getTransactions()
      const failedTransaction = transactions.find(tx => tx.id === result.transaction.id)
      expect(failedTransaction).toBeDefined()
      expect(failedTransaction.status).toBe('failed')
    })

    it('should log transaction limit exceeded failures', async () => {
      const oversizedTransaction = {
        type: 'add',
        amount: 15000, // Exceeds 10000 limit
        paymentMethod: 'credit_debit_card',
        userId: 'test_user'
      }

      const result = await dataManager.processTransaction(oversizedTransaction)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Transaction limit exceeded')
      expect(result.transaction.status).toBe('failed')
      expect(result.transaction.error).toBe('Transaction limit exceeded')
      
      // Check transaction is in history
      const transactions = dataManager.getTransactions()
      const failedTransaction = transactions.find(tx => tx.id === result.transaction.id)
      expect(failedTransaction).toBeDefined()
      expect(failedTransaction.status).toBe('failed')
    })

    it('should log invalid wallet address failures for crypto transfers', async () => {
      const invalidTransferTransaction = {
        type: 'crypto_transfer',
        amount: 100,
        toAddress: 'invalid_address_format',
        paymentMethod: 'diboas_wallet',
        userId: 'test_user'
      }

      const result = await dataManager.processTransaction(invalidTransferTransaction)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid wallet address format')
      expect(result.transaction.status).toBe('failed')
      
      // Check transaction is in history
      const transactions = dataManager.getTransactions()
      const failedTransaction = transactions.find(tx => tx.id === result.transaction.id)
      expect(failedTransaction).toBeDefined()
      expect(failedTransaction.status).toBe('failed')
    })

    it('should emit transaction:failed events for UI feedback', async () => {
      let emittedEvent = null
      
      // Listen for failed transaction event
      dataManager.subscribe('transaction:failed', (event) => {
        emittedEvent = event
      })

      const invalidTransaction = {
        type: 'add',
        amount: -100, // Negative amount
        paymentMethod: 'credit_debit_card',
        userId: 'test_user'
      }

      await dataManager.processTransaction(invalidTransaction)
      
      expect(emittedEvent).not.toBeNull()
      expect(emittedEvent.transaction.status).toBe('failed')
      expect(emittedEvent.error).toBe('Invalid transaction amount')
    })

    it('should handle exceptions and log them as failed transactions', async () => {
      // Mock a method to throw an error
      const originalUpdateBalance = dataManager.updateBalance
      dataManager.updateBalance = vi.fn().mockRejectedValue(new Error('Database connection failed'))

      const transaction = {
        type: 'add',
        amount: 100,
        paymentMethod: 'credit_debit_card',
        userId: 'test_user'
      }

      const result = await dataManager.processTransaction(transaction)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Database connection failed')
      expect(result.transaction.status).toBe('failed')
      
      // Restore original method
      dataManager.updateBalance = originalUpdateBalance
    })

    it('should not update balance for failed transactions', async () => {
      const initialBalance = dataManager.getBalance()
      
      const invalidTransaction = {
        type: 'add',
        amount: 0, // Invalid amount
        paymentMethod: 'credit_debit_card',
        userId: 'test_user'
      }

      await dataManager.processTransaction(invalidTransaction)
      
      const finalBalance = dataManager.getBalance()
      expect(finalBalance.availableForSpending).toBe(initialBalance.availableForSpending)
      expect(finalBalance.totalUSD).toBe(initialBalance.totalUSD)
    })
  })

  describe('Failed Transaction Display', () => {
    it('should include failed transactions in transaction history', async () => {
      // Create a successful transaction
      const successTransaction = {
        type: 'add',
        amount: 100,
        paymentMethod: 'credit_debit_card',
        userId: 'test_user'
      }
      await dataManager.processTransaction(successTransaction)

      // Create a failed transaction
      const failedTransaction = {
        type: 'add',
        amount: 0, // Invalid
        paymentMethod: 'credit_debit_card',
        userId: 'test_user'
      }
      await dataManager.processTransaction(failedTransaction)

      const transactions = dataManager.getTransactions()
      expect(transactions.length).toBe(2)
      
      const successful = transactions.find(tx => tx.status === 'completed')
      const failed = transactions.find(tx => tx.status === 'failed')
      
      expect(successful).toBeDefined()
      expect(failed).toBeDefined()
      expect(failed.isFailed).toBe(true)
      expect(failed.error).toBeDefined()
    })

    it('should show clear error messages for different failure types', async () => {
      const failureScenarios = [
        {
          transaction: { type: 'add', amount: 0, paymentMethod: 'credit_debit_card' },
          expectedError: 'Invalid transaction amount'
        },
        {
          transaction: { type: 'add', amount: 15000, paymentMethod: 'credit_debit_card' },
          expectedError: 'Transaction limit exceeded'
        },
        {
          transaction: { type: 'crypto_transfer', amount: 100, toAddress: 'invalid', paymentMethod: 'diboas_wallet' },
          expectedError: 'Invalid wallet address format'
        }
      ]

      for (const scenario of failureScenarios) {
        const result = await dataManager.processTransaction({
          ...scenario.transaction,
          userId: 'test_user'
        })
        
        expect(result.success).toBe(false)
        expect(result.error).toBe(scenario.expectedError)
        expect(result.transaction.error).toBe(scenario.expectedError)
      }
    })
  })

  describe('Progress Dialog Error Feedback', () => {
    it('should provide failure information for UI progress dialogs', async () => {
      const failedTransaction = {
        type: 'add',
        amount: 0,
        paymentMethod: 'credit_debit_card',
        userId: 'test_user'
      }

      const result = await dataManager.processTransaction(failedTransaction)
      
      // Verify the result contains all necessary information for UI feedback
      expect(result).toMatchObject({
        success: false,
        error: expect.any(String),
        transaction: expect.objectContaining({
          id: expect.any(String),
          status: 'failed',
          error: expect.any(String),
          failedAt: expect.any(String),
          isFailed: true
        })
      })
    })

    it('should emit events that UI components can listen to', async () => {
      const events = []
      
      // Listen for all transaction-related events
      dataManager.subscribe('transaction:failed', (event) => {
        events.push({ type: 'failed', data: event })
      })
      
      dataManager.subscribe('transaction:added', (transaction) => {
        events.push({ type: 'added', data: transaction })
      })

      const failedTransaction = {
        type: 'add',
        amount: 0,
        paymentMethod: 'credit_debit_card',
        userId: 'test_user'
      }

      await dataManager.processTransaction(failedTransaction)
      
      expect(events.length).toBeGreaterThan(0)
      const failedEvent = events.find(e => e.type === 'failed')
      const addedEvent = events.find(e => e.type === 'added')
      
      expect(failedEvent).toBeDefined()
      expect(addedEvent).toBeDefined()
      expect(addedEvent.data.status).toBe('failed')
    })
  })

  describe('Security Failure Scenarios', () => {
    it('should handle SQL injection attempts', async () => {
      const sqlInjectionTransaction = {
        type: 'add',
        amount: 100,
        description: "'; DROP TABLE users; --",
        paymentMethod: 'credit_debit_card',
        userId: 'test_user'
      }

      const result = await dataManager.processTransaction(sqlInjectionTransaction)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid characters detected in transaction data')
      expect(result.transaction.status).toBe('failed')
    })

    it('should handle XSS attempts', async () => {
      const xssTransaction = {
        type: 'add',
        amount: 100,
        description: '<script>alert("xss")</script>',
        paymentMethod: 'credit_debit_card',
        userId: 'test_user'
      }

      const result = await dataManager.processTransaction(xssTransaction)
      
      expect(result.success).toBe(false)
      expect(result.error).toBe('Invalid script content detected')
      expect(result.transaction.status).toBe('failed')
    })

    it('should handle duplicate transaction attempts', async () => {
      const transaction = {
        id: 'duplicate_test_id',
        type: 'add',
        amount: 100,
        paymentMethod: 'credit_debit_card',
        userId: 'test_user'
      }

      // First transaction should succeed
      const result1 = await dataManager.processTransaction(transaction)
      expect(result1.success).toBe(true)

      // Second transaction with same ID should fail
      const result2 = await dataManager.processTransaction(transaction)
      expect(result2.success).toBe(false)
      expect(result2.error).toBe('Transaction already processed - possible double spend attempt')
      expect(result2.transaction.status).toBe('failed')
    })
  })
})