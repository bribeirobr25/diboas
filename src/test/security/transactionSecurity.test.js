/**
 * Transaction Security Tests
 * Critical security tests for financial transaction integrity
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { dataManager } from '../../services/DataManager.js'
import secureLogger from '../../utils/secureLogger.js'

// Mock secure logger
vi.mock('../../utils/secureLogger.js', () => ({
  default: {
    audit: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

describe('Transaction Security Tests', () => {
  beforeEach(() => {
    dataManager.initializeCleanState()
    vi.clearAllMocks()
  })

  describe('Transaction Integrity', () => {
    it('should prevent amount tampering during transaction processing', async () => {
      const originalTransaction = {
        id: 'tx_001',
        amount: 100.00,
        type: 'transfer',
        timestamp: Date.now(),
        hash: 'original_hash'
      }

      // Simulate transaction being processed
      const processedTransaction = await dataManager.processTransaction(originalTransaction)

      // Attempt to tamper with amount after processing
      const tamperedTransaction = { ...processedTransaction, amount: 1000.00 }

      // Validation should detect tampering
      const isValid = dataManager.validateTransactionIntegrity(tamperedTransaction, originalTransaction)
      
      expect(isValid).toBe(false)
      expect(secureLogger.audit).toHaveBeenCalledWith('TRANSACTION_INTEGRITY_VIOLATION', 
        expect.objectContaining({
          originalAmount: 100.00,
          tamperedAmount: 1000.00
        })
      )
    })

    it('should detect replay attacks on transactions', async () => {
      const transaction = {
        id: 'tx_replay',
        amount: 50.00,
        nonce: 12345,
        timestamp: Date.now(),
        signature: 'valid_signature'
      }

      // Process transaction first time
      await dataManager.processTransaction(transaction)

      // Attempt to replay the same transaction
      const replayResult = await dataManager.processTransaction(transaction)

      expect(replayResult.success).toBe(false)
      expect(replayResult.error).toContain('possible double spend attempt')
      expect(secureLogger.audit).toHaveBeenCalledWith('REPLAY_ATTACK_DETECTED', 
        expect.objectContaining({
          transactionId: 'tx_replay',
          nonce: 12345
        })
      )
    })

    it('should validate digital signatures on transactions', async () => {
      const transaction = {
        id: 'tx_signature',
        amount: 75.00,
        from: 'user_123',
        to: 'user_456',
        signature: 'invalid_signature'
      }

      const result = await dataManager.validateTransactionSignature(transaction)

      expect(result.valid).toBe(false)
      expect(result.error).toContain('Invalid or missing signature')
      expect(secureLogger.audit).toHaveBeenCalledWith('INVALID_SIGNATURE_DETECTED', 
        expect.objectContaining({
          transactionId: 'tx_signature',
          from: 'user_123'
        })
      )
    })

    it('should enforce transaction limits per user', async () => {
      const userId = 'user_limit_test'
      const largeTransaction = {
        id: 'tx_large',
        amount: 50000.00, // Exceeds daily limit
        userId: userId,
        type: 'transfer'
      }

      const result = await dataManager.processTransaction(largeTransaction)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Transaction limit exceeded')
      expect(secureLogger.audit).toHaveBeenCalledWith('TRANSACTION_LIMIT_EXCEEDED', 
        expect.objectContaining({
          userId: userId,
          amount: 50000.00,
          limit: expect.any(Number)
        })
      )
    })
  })

  describe('Data Validation Security', () => {
    it('should prevent SQL injection in transaction data', async () => {
      const maliciousTransaction = {
        id: 'tx_sql',
        amount: 100.00,
        description: "'; DROP TABLE transactions; --",
        userId: 'user_123'
      }

      const result = await dataManager.processTransaction(maliciousTransaction)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid characters detected')
      expect(secureLogger.audit).toHaveBeenCalledWith('SQL_INJECTION_ATTEMPT', 
        expect.objectContaining({
          field: 'description',
          userId: 'user_123'
        })
      )
    })

    it('should sanitize XSS attempts in user inputs', async () => {
      const xssTransaction = {
        id: 'tx_xss',
        amount: 100.00,
        description: '<script>alert("xss")</script>',
        userId: 'user_123'
      }

      const result = await dataManager.processTransaction(xssTransaction)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid characters detected')
      expect(secureLogger.audit).toHaveBeenCalledWith('XSS_ATTEMPT_DETECTED', 
        expect.objectContaining({
          field: 'description',
          userId: 'user_123'
        })
      )
    })

    it('should validate decimal precision in financial amounts', () => {
      const invalidAmounts = [
        123.123456789, // Too many decimal places
        '100.001',     // String with excessive precision
        Infinity,      // Invalid number
        NaN,          // Not a number
        -0.001        // Negative micro-amount
      ]

      invalidAmounts.forEach(amount => {
        const isValid = dataManager.validateFinancialAmount(amount)
        expect(isValid).toBe(false)
      })

      // Valid amounts should pass
      const validAmounts = [100.00, 99.99, 0.01, 1000000.00]
      validAmounts.forEach(amount => {
        const isValid = dataManager.validateFinancialAmount(amount)
        expect(isValid).toBe(true)
      })
    })
  })

  describe('Balance Manipulation Prevention', () => {
    it('should prevent direct balance manipulation', async () => {
      const userId = 'user_balance_test'
      
      // Set initial balance
      await dataManager.updateBalance(userId, 1000.00, 'initial_deposit')
      
      // Attempt direct balance manipulation
      const maliciousUpdate = {
        userId: userId,
        balance: 1000000.00, // Unrealistic jump
        operation: 'direct_set' // Bypassing normal transaction flow
      }

      const result = await dataManager.updateBalance(
        maliciousUpdate.userId, 
        maliciousUpdate.balance, 
        maliciousUpdate.operation
      )

      expect(result.success).toBe(false)
      expect(result.error).toContain('unauthorized balance modification')
      expect(secureLogger.audit).toHaveBeenCalledWith('BALANCE_MANIPULATION_ATTEMPT', 
        expect.objectContaining({
          userId: userId,
          previousBalance: 1000.00,
          attemptedBalance: 1000000.00
        })
      )
    })

    it('should track all balance changes with audit trail', async () => {
      const userId = 'user_audit_test'
      
      await dataManager.updateBalance(userId, 500.00, 'deposit')
      await dataManager.updateBalance(userId, -100.00, 'withdrawal')
      
      const auditTrail = await dataManager.getBalanceAuditTrail(userId)
      
      expect(auditTrail).toHaveLength(2)
      expect(auditTrail[0]).toMatchObject({
        operation: 'deposit',
        amount: 500.00,
        userId: userId
      })
      expect(auditTrail[1]).toMatchObject({
        operation: 'withdrawal',
        amount: -100.00,
        userId: userId
      })
    })
  })

  describe('Rate Limiting and DoS Protection', () => {
    it('should enforce rate limits on transaction submissions', async () => {
      const userId = 'user_rate_limit'
      const rapidTransactions = Array.from({ length: 20 }, (_, i) => ({
        id: `tx_rapid_${i}`,
        amount: 10.00,
        userId: userId,
        timestamp: Date.now()
      }))

      // Submit transactions rapidly
      const results = await Promise.all(
        rapidTransactions.map(tx => dataManager.processTransaction(tx))
      )

      // Should start rejecting after rate limit exceeded
      const rejectedCount = results.filter(r => !r.success && r.error.includes('rate limit')).length
      expect(rejectedCount).toBeGreaterThan(0)
      
      expect(secureLogger.audit).toHaveBeenCalledWith('RATE_LIMIT_EXCEEDED', 
        expect.objectContaining({
          userId: userId,
          attemptedTransactions: 20
        })
      )
    })

    it('should implement circuit breaker for external API calls', async () => {
      // Mock external API failures
      vi.spyOn(dataManager, 'callExternalAPI').mockRejectedValue(new Error('API unavailable'))

      // Make multiple failed calls to trigger circuit breaker
      const failedCalls = Array.from({ length: 10 }, () => 
        dataManager.processExternalTransaction({ amount: 100 })
      )

      await Promise.allSettled(failedCalls)

      // Next call should be immediately rejected by circuit breaker
      const circuitBreakerResult = await dataManager.processExternalTransaction({ amount: 100 })
      
      expect(circuitBreakerResult.success).toBe(false)
      expect(circuitBreakerResult.error).toContain('circuit breaker')
      expect(secureLogger.audit).toHaveBeenCalledWith('CIRCUIT_BREAKER_ACTIVATED', 
        expect.objectContaining({
          service: 'external_api',
          failureCount: expect.any(Number)
        })
      )
    })
  })

  describe('Cryptocurrency Security', () => {
    it('should validate wallet addresses before transactions', async () => {
      const invalidAddresses = [
        '0xinvalid',                                           // Too short
        '0x1234567890123456789012345678901234567890123',     // Too long  
        'not_a_valid_address',                                // Wrong format
        '0xGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGGG',     // Invalid characters
      ]

      for (const address of invalidAddresses) {
        const transaction = {
          id: `tx_invalid_addr_${address.slice(-5)}`,
          amount: 100.00,
          toAddress: address,
          type: 'crypto_transfer'
        }

        const result = await dataManager.processTransaction(transaction)
        
        expect(result.success).toBe(false)
        expect(result.error).toContain('Invalid wallet address')
      }
    })

    it('should prevent double-spending attacks', async () => {
      const transaction = {
        id: 'tx_double_spend',
        amount: 500.00,
        fromAddress: '0x1234567890123456789012345678901234567890',
        toAddress: '0x0987654321098765432109876543210987654321',
        nonce: 1
      }

      // Process transaction first time
      const firstResult = await dataManager.processTransaction(transaction)
      expect(firstResult.success).toBe(true)

      // Attempt to process same transaction again (same nonce)
      const doubleSpendResult = await dataManager.processTransaction(transaction)
      
      expect(doubleSpendResult.success).toBe(false)
      expect(doubleSpendResult.error).toContain('double spend')
      expect(secureLogger.audit).toHaveBeenCalledWith('DOUBLE_SPEND_ATTEMPT', 
        expect.objectContaining({
          transactionId: 'tx_double_spend',
          nonce: 1
        })
      )
    })
  })
})