/**
 * Comprehensive Transaction Fee Tests
 * Tests all transaction types (Banking, Investing, Yield Strategy) with fees, edge cases, and recovery scenarios
 * 
 * Test Coverage:
 * - Banking: Add, Send, Withdraw
 * - Investing: Buy, Sell
 * - Yield Strategy: Start Strategy, Stop Strategy
 * - Happy path, failures, edge cases, recovery scenarios
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FeeCalculator } from '../../utils/feeCalculations.js'
import { TransactionEngine } from '../../services/transactions/TransactionEngine.js'
import { useTransactions } from '../../hooks/useTransactions.jsx'
import { dataManager } from '../../services/DataManager.js'

// Mock external dependencies
vi.mock('../../services/DataManager.js', () => ({
  dataManager: {
    getBalance: vi.fn(),
    setBalance: vi.fn(),
    getTransactions: vi.fn(),
    addTransaction: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    emit: vi.fn()
  }
}))

vi.mock('../../services/integrations/IntegrationManager.js', () => ({
  getIntegrationManager: vi.fn(() => ({
    execute: vi.fn().mockResolvedValue({ success: true, result: { id: 'mock_id' } })
  }))
}))

vi.mock('../../utils/security.js', () => ({
  generateSecureId: vi.fn(() => 'test_id_123')
}))

vi.mock('../../utils/securityLogging.js', () => ({
  logSecureEvent: vi.fn()
}))

vi.mock('../../security/SecurityManager.js', () => ({
  securityManager: {
    logSecurityEvent: vi.fn()
  },
  validateFinancialOperation: vi.fn(),
  checkRateLimit: vi.fn(() => ({ allowed: true })),
  SECURITY_EVENT_TYPES: {
    RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded'
  }
}))

vi.mock('../../utils/advancedRateLimiter.js', () => ({
  checkTransactionRateLimit: vi.fn(() => ({ allowed: true }))
}))

describe('Comprehensive Transaction Fee Tests', () => {
  let feeCalculator
  let transactionEngine
  let mockDataManager

  beforeEach(async () => {
    feeCalculator = new FeeCalculator()
    transactionEngine = new TransactionEngine()
    await transactionEngine.initialize()
    mockDataManager = dataManager

    // Reset all mocks
    vi.clearAllMocks()

    // Set up default mock balance
    mockDataManager.getBalance.mockResolvedValue({
      total: 10000,
      available: 8000,
      availableForSpending: 8000,
      invested: 2000,
      breakdown: {
        SOL: { usdc: 5000, sol: 50, usdValue: 8000 },
        BTC: { balance: 0.05, usdValue: 2000 },
        ETH: { balance: 0.5, usdValue: 1500 }
      },
      assets: {
        BTC: { usdValue: 2000 },
        ETH: { usdValue: 1500 },
        SOL: { usdValue: 2500 }
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    feeCalculator.clearCache()
  })

  describe('BANKING TRANSACTIONS - Add, Send, Withdraw', () => {
    describe('Add Transaction (On-Ramp)', () => {
      describe('Happy Path', () => {
        it('should calculate correct fees for credit card add', async () => {
          const transactionData = {
            type: 'add',
            amount: 1000,
            paymentMethod: 'credit_debit_card',
            asset: 'USDC'
          }

          const fees = await feeCalculator.calculateComprehensiveFees({
            ...transactionData,
            chains: ['SOL']
          })

          expect(fees.diBoaS).toBeCloseTo(0.9, 2) // 1000 * 0.0009
          expect(fees.provider).toBeCloseTo(10, 2) // 1000 * 0.01
          expect(fees.network).toBeCloseTo(0.01, 3) // SOL network fee
          expect(fees.total).toBeCloseTo(10.91, 2)
        })

        it('should process add transaction successfully', async () => {
          const result = await transactionEngine.processTransaction('user123', {
            type: 'add',
            amount: 500,
            paymentMethod: 'apple_pay',
            asset: 'USDC'
          })

          expect(result.success).toBe(true)
          expect(result.transactionId).toBeDefined()
          expect(result.transaction.type).toBe('add')
          expect(result.transaction.amount).toBe(500)
        })
      })

      describe('Edge Cases', () => {
        it('should handle minimum amount validation', async () => {
          try {
            await transactionEngine.processTransaction('user123', {
              type: 'add',
              amount: 5, // Below minimum of $10
              paymentMethod: 'credit_debit_card'
            })
            expect.fail('Should have thrown validation error')
          } catch (error) {
            expect(error.message).toContain('Minimum amount for add is $10')
          }
        })

        it('should handle large amounts', async () => {
          const fees = await feeCalculator.calculateComprehensiveFees({
            type: 'add',
            amount: 100000,
            paymentMethod: 'bank_account',
            chains: ['SOL']
          })

          expect(fees.diBoaS).toBeCloseTo(90, 2)
          expect(fees.provider).toBeCloseTo(500, 2) // Bank account 0.5%
          expect(fees.total).toBeLessThan(1000) // Reasonable total
        })
      })

      describe('Failure Scenarios', () => {
        it('should handle payment provider failures', async () => {
          // Mock integration manager to fail
          const mockIntegrationManager = await import('../../services/integrations/IntegrationManager.js')
          mockIntegrationManager.getIntegrationManager.mockResolvedValue({
            execute: vi.fn().mockResolvedValue({ success: false, error: 'Payment failed' })
          })

          const result = await transactionEngine.processTransaction('user123', {
            type: 'add',
            amount: 100,
            paymentMethod: 'credit_debit_card'
          })

          expect(result.success).toBe(false)
        })
      })
    })

    describe('Send Transaction (P2P)', () => {
      describe('Happy Path', () => {
        it('should calculate correct fees for send transaction', async () => {
          const fees = await feeCalculator.calculateComprehensiveFees({
            type: 'send',
            amount: 500,
            paymentMethod: null,
            chains: ['SOL']
          })

          expect(fees.diBoaS).toBeCloseTo(0.45, 2) // 500 * 0.0009
          expect(fees.network).toBeCloseTo(0.005, 3) // SOL network fee
          expect(fees.provider).toBe(0) // No provider fee for P2P
          expect(fees.total).toBeCloseTo(0.455, 3)
        })

        it('should process send transaction with sufficient balance', async () => {
          const result = await transactionEngine.processTransaction('user123', {
            type: 'send',
            amount: 100,
            recipient: '@johndoe',
            asset: 'USDC'
          })

          expect(result.success).toBe(true)
          expect(result.transaction.type).toBe('send')
        })
      })

      describe('Edge Cases', () => {
        it('should validate recipient format', async () => {
          try {
            await transactionEngine.processTransaction('user123', {
              type: 'send',
              amount: 100,
              recipient: 'invalid_recipient' // Invalid format
            })
            expect.fail('Should have thrown validation error')
          } catch (error) {
            expect(error.message).toContain('Invalid diBoaS username')
          }
        })

        it('should handle insufficient balance', async () => {
          // Mock low balance
          mockDataManager.getBalance.mockResolvedValue({
            total: 50,
            available: 50,
            breakdown: { SOL: { usdc: 50, usdValue: 50 } }
          })

          try {
            await transactionEngine.processTransaction('user123', {
              type: 'send',
              amount: 1000, // More than available
              recipient: '@johndoe'
            })
            expect.fail('Should have thrown insufficient funds error')
          } catch (error) {
            expect(error.message).toContain('Insufficient funds')
          }
        })
      })
    })

    describe('Withdraw Transaction (Off-Ramp)', () => {
      describe('Happy Path', () => {
        it('should calculate correct fees for bank account withdrawal', async () => {
          const fees = await feeCalculator.calculateComprehensiveFees({
            type: 'withdraw',
            amount: 2000,
            paymentMethod: 'bank_account',
            chains: ['SOL']
          })

          expect(fees.diBoaS).toBeCloseTo(18, 2) // 2000 * 0.009
          expect(fees.provider).toBeCloseTo(10, 2) // 2000 * 0.005
          expect(fees.network).toBeCloseTo(0.02, 3)
          expect(fees.total).toBeCloseTo(28.02, 2)
        })

        it('should handle external wallet withdrawal', async () => {
          const fees = await feeCalculator.calculateComprehensiveFees({
            type: 'withdraw',
            amount: 1000,
            paymentMethod: 'external_wallet',
            chains: ['BTC']
          })

          expect(fees.diBoaS).toBeCloseTo(9, 2) // 1000 * 0.009
          expect(fees.provider).toBeCloseTo(8, 2) // 1000 * 0.008 (DEX fee)
          expect(fees.network).toBeCloseTo(90, 2) // BTC 9% network fee
          expect(fees.total).toBeCloseTo(107, 1)
        })
      })

      describe('Edge Cases', () => {
        it('should validate wallet address for external withdrawal', async () => {
          try {
            await transactionEngine.processTransaction('user123', {
              type: 'withdraw',
              amount: 100,
              paymentMethod: 'external_wallet',
              recipient: 'invalid_address'
            })
            expect.fail('Should have thrown validation error')
          } catch (error) {
            expect(error.message).toContain('Invalid wallet address')
          }
        })
      })
    })
  })

  describe('INVESTING TRANSACTIONS - Buy, Sell', () => {
    describe('Buy Transaction', () => {
      describe('Happy Path', () => {
        it('should calculate correct fees for buy with diBoaS wallet', async () => {
          const fees = await feeCalculator.calculateComprehensiveFees({
            type: 'buy',
            amount: 1000,
            paymentMethod: 'diboas_wallet',
            asset: 'BTC',
            chains: ['BTC']
          })

          expect(fees.diBoaS).toBeCloseTo(0.9, 2) // 1000 * 0.0009
          expect(fees.dex).toBeCloseTo(2, 2) // 1000 * 0.002 (DEX fee)
          expect(fees.provider).toBeCloseTo(2, 2) // DEX fee
          expect(fees.network).toBeCloseTo(90, 2) // BTC 9% network fee
          expect(fees.total).toBeCloseTo(92.9, 1)
        })

        it('should calculate correct fees for buy with external payment', async () => {
          const fees = await feeCalculator.calculateComprehensiveFees({
            type: 'buy',
            amount: 1000,
            paymentMethod: 'credit_debit_card',
            asset: 'ETH',
            chains: ['ETH']
          })

          expect(fees.diBoaS).toBeCloseTo(0.9, 2)
          expect(fees.dex).toBe(0) // No DEX fee for external payment
          expect(fees.provider).toBeCloseTo(10, 2) // Credit card 1%
          expect(fees.network).toBeCloseTo(5, 2) // ETH 0.5% network fee
          expect(fees.total).toBeCloseTo(15.9, 1)
        })

        it('should process buy transaction successfully', async () => {
          const result = await transactionEngine.processTransaction('user123', {
            type: 'buy',
            amount: 500,
            asset: 'SOL',
            paymentMethod: 'diboas_wallet'
          })

          expect(result.success).toBe(true)
          expect(result.transaction.type).toBe('buy')
        })
      })

      describe('Edge Cases', () => {
        it('should prevent buying USD', async () => {
          try {
            await transactionEngine.processTransaction('user123', {
              type: 'buy',
              amount: 100,
              asset: 'USD' // Invalid asset
            })
            expect.fail('Should have thrown validation error')
          } catch (error) {
            expect(error.message).toContain('Cannot buy USD')
          }
        })

        it('should validate asset for buy transaction', async () => {
          try {
            await transactionEngine.processTransaction('user123', {
              type: 'buy',
              amount: 100,
              asset: 'INVALID_ASSET'
            })
            expect.fail('Should have thrown validation error')
          } catch (error) {
            expect(error.message).toContain('Invalid asset for buy transaction')
          }
        })
      })
    })

    describe('Sell Transaction', () => {
      describe('Happy Path', () => {
        it('should calculate correct fees for sell transaction', async () => {
          const fees = await feeCalculator.calculateComprehensiveFees({
            type: 'sell',
            amount: 1500,
            paymentMethod: null,
            asset: 'ETH',
            chains: ['ETH']
          })

          expect(fees.diBoaS).toBeCloseTo(1.35, 2) // 1500 * 0.0009
          expect(fees.dex).toBeCloseTo(3, 2) // 1500 * 0.002
          expect(fees.provider).toBeCloseTo(3, 2) // DEX fee
          expect(fees.network).toBeCloseTo(7.5, 2) // ETH 0.5% network fee
          expect(fees.total).toBeCloseTo(11.85, 2)
        })

        it('should process sell transaction successfully', async () => {
          const result = await transactionEngine.processTransaction('user123', {
            type: 'sell',
            amount: 200,
            asset: 'BTC'
          })

          expect(result.success).toBe(true)
          expect(result.transaction.type).toBe('sell')
        })
      })

      describe('Edge Cases', () => {
        it('should handle insufficient asset balance', async () => {
          // Mock insufficient asset balance
          mockDataManager.getBalance.mockResolvedValue({
            total: 100,
            available: 100,
            breakdown: { SOL: { usdc: 100 } },
            assets: { BTC: { usdValue: 50 } } // Insufficient BTC
          })

          try {
            await transactionEngine.processTransaction('user123', {
              type: 'sell',
              amount: 1000, // More than available BTC value
              asset: 'BTC'
            })
            expect.fail('Should have thrown insufficient funds error')
          } catch (error) {
            expect(error.message).toContain('Insufficient funds')
          }
        })
      })
    })
  })

  describe('YIELD STRATEGY TRANSACTIONS - Start, Stop', () => {
    describe('Start Strategy Transaction', () => {
      describe('Happy Path', () => {
        it('should calculate correct fees for strategy start', async () => {
          const fees = await feeCalculator.calculateComprehensiveFees({
            type: 'start_strategy',
            amount: 5000,
            paymentMethod: 'diboas_wallet',
            asset: 'USDC',
            chains: ['SOL']
          })

          expect(fees.diBoaS).toBeCloseTo(4.5, 2) // 5000 * 0.0009
          expect(fees.provider).toBeCloseTo(25, 2) // 5000 * 0.005 (DeFi fee)
          expect(fees.network).toBeCloseTo(0.05, 3) // SOL network fee
          expect(fees.total).toBeCloseTo(29.55, 2)
        })

        it('should process start strategy transaction successfully', async () => {
          const result = await transactionEngine.processTransaction('user123', {
            type: 'start_strategy',
            amount: 1000,
            strategyConfig: {
              objective: 'emergency-fund',
              timeline: 12,
              riskLevel: 'conservative'
            },
            paymentMethod: 'diboas_wallet'
          })

          expect(result.success).toBe(true)
          expect(result.transaction.type).toBe('start_strategy')
        })

        it('should handle strategy start with external payment', async () => {
          const fees = await feeCalculator.calculateComprehensiveFees({
            type: 'start_strategy',
            amount: 3000,
            paymentMethod: 'credit_debit_card',
            asset: 'USDC',
            chains: ['SOL']
          })

          expect(fees.diBoaS).toBeCloseTo(2.7, 2)
          expect(fees.provider).toBeCloseTo(30, 2) // Credit card 1%
          expect(fees.network).toBeCloseTo(0.03, 3)
          expect(fees.total).toBeCloseTo(32.73, 2)
        })
      })

      describe('Edge Cases', () => {
        it('should enforce minimum amount for strategy start', async () => {
          try {
            await transactionEngine.processTransaction('user123', {
              type: 'start_strategy',
              amount: 25, // Below minimum of $50
              strategyConfig: { objective: 'emergency-fund' }
            })
            expect.fail('Should have thrown validation error')
          } catch (error) {
            expect(error.message).toContain('Minimum amount for start_strategy is $50')
          }
        })

        it('should handle insufficient balance for strategy start', async () => {
          // Mock low balance
          mockDataManager.getBalance.mockResolvedValue({
            total: 100,
            available: 100,
            breakdown: { SOL: { usdc: 100 } }
          })

          try {
            await transactionEngine.processTransaction('user123', {
              type: 'start_strategy',
              amount: 5000, // More than available
              strategyConfig: { objective: 'emergency-fund' },
              paymentMethod: 'diboas_wallet'
            })
            expect.fail('Should have thrown insufficient funds error')
          } catch (error) {
            expect(error.message).toContain('Insufficient funds')
          }
        })
      })
    })

    describe('Stop Strategy Transaction', () => {
      describe('Happy Path', () => {
        it('should calculate correct fees for strategy stop', async () => {
          const fees = await feeCalculator.calculateComprehensiveFees({
            type: 'stop_strategy',
            amount: 2500,
            paymentMethod: 'diboas_wallet',
            asset: 'USDC',
            chains: ['SOL']
          })

          expect(fees.diBoaS).toBeCloseTo(2.25, 2) // 2500 * 0.0009
          expect(fees.provider).toBeCloseTo(12.5, 2) // 2500 * 0.005 (DeFi fee)
          expect(fees.network).toBeCloseTo(0.025, 3)
          expect(fees.total).toBeCloseTo(14.775, 3)
        })

        it('should process stop strategy transaction successfully', async () => {
          const result = await transactionEngine.processTransaction('user123', {
            type: 'stop_strategy',
            amount: 1500,
            strategyId: 'strategy_123'
          })

          expect(result.success).toBe(true)
          expect(result.transaction.type).toBe('stop_strategy')
        })
      })

      describe('Edge Cases', () => {
        it('should allow zero minimum for stop strategy', async () => {
          // Should not throw error for small amounts
          const result = await transactionEngine.processTransaction('user123', {
            type: 'stop_strategy',
            amount: 1, // Very small amount should be allowed
            strategyId: 'strategy_123'
          })

          expect(result.success).toBe(true)
        })
      })
    })
  })

  describe('RECOVERY SCENARIOS', () => {
    describe('Network Failures', () => {
      it('should handle blockchain network timeouts', async () => {
        // Mock network timeout
        const mockIntegrationManager = await import('../../services/integrations/IntegrationManager.js')
        mockIntegrationManager.getIntegrationManager.mockResolvedValue({
          execute: vi.fn().mockRejectedValue(new Error('Network timeout'))
        })

        try {
          await transactionEngine.processTransaction('user123', {
            type: 'send',
            amount: 100,
            recipient: '@johndoe'
          })
          expect.fail('Should have thrown network error')
        } catch (error) {
          expect(error.message).toContain('Network timeout')
        }
      })

      it('should handle retry mechanism for retryable errors', async () => {
        // Mock retryable error followed by success
        const mockIntegrationManager = await import('../../services/integrations/IntegrationManager.js')
        const executeMock = vi.fn()
          .mockRejectedValueOnce(new Error('Temporary network error'))
          .mockResolvedValue({ success: true, result: { id: 'retry_success' } })

        mockIntegrationManager.getIntegrationManager.mockResolvedValue({
          execute: executeMock
        })

        const result = await transactionEngine.executeTransactionWithRetry('user123', {
          type: 'add',
          amount: 100,
          paymentMethod: 'credit_debit_card'
        })

        expect(result).toBeDefined()
        expect(executeMock).toHaveBeenCalledTimes(2) // Initial + 1 retry
      })
    })

    describe('Rate Limiting', () => {
      it('should handle rate limit exceeded scenarios', async () => {
        // Mock rate limit exceeded
        const { checkTransactionRateLimit } = await import('../../utils/advancedRateLimiter.js')
        checkTransactionRateLimit.mockReturnValue({
          allowed: false,
          reason: 'Too many requests',
          retryAfter: 60
        })

        try {
          await transactionEngine.processTransaction('user123', {
            type: 'send',
            amount: 100,
            recipient: '@johndoe'
          })
          expect.fail('Should have thrown rate limit error')
        } catch (error) {
          expect(error.message).toContain('Rate limit exceeded')
        }
      })
    })

    describe('Balance Inconsistencies', () => {
      it('should handle balance update failures gracefully', async () => {
        // Mock balance update failure
        mockDataManager.getBalance.mockRejectedValue(new Error('Balance service unavailable'))

        try {
          await transactionEngine.processTransaction('user123', {
            type: 'add',
            amount: 100,
            paymentMethod: 'apple_pay'
          })
          expect.fail('Should have thrown balance error')
        } catch (error) {
          expect(error.message).toContain('Balance service unavailable')
        }
      })
    })

    describe('Fee Calculation Failures', () => {
      it('should handle fee calculation service failures', async () => {
        // Mock fee calculation failure
        vi.spyOn(feeCalculator, 'calculateComprehensiveFees').mockRejectedValue(
          new Error('Fee service unavailable')
        )

        try {
          await transactionEngine.processTransaction('user123', {
            type: 'buy',
            amount: 100,
            asset: 'BTC'
          })
          expect.fail('Should have thrown fee calculation error')
        } catch (error) {
          expect(error.message).toContain('Fee service unavailable')
        }
      })

      it('should provide fallback fee estimates when API fails', async () => {
        // Test that the fee calculator provides reasonable fallbacks
        vi.spyOn(feeCalculator, 'calculateProviderFee').mockResolvedValue(10) // Fallback

        const fees = await feeCalculator.calculateComprehensiveFees({
          type: 'add',
          amount: 1000,
          paymentMethod: 'credit_debit_card',
          chains: ['SOL']
        })

        expect(fees.provider).toBeGreaterThan(0) // Should have fallback fee
        expect(fees.total).toBeGreaterThan(0)
      })
    })
  })

  describe('PERFORMANCE AND STRESS TESTS', () => {
    it('should handle concurrent fee calculations', async () => {
      const promises = Array.from({ length: 50 }, (_, i) =>
        feeCalculator.calculateComprehensiveFees({
          type: 'send',
          amount: 100 + i,
          chains: ['SOL']
        })
      )

      const results = await Promise.all(promises)
      
      expect(results).toHaveLength(50)
      results.forEach((fees, index) => {
        expect(fees.total).toBeGreaterThan(0)
        expect(fees.diBoaS).toBeCloseTo((100 + index) * 0.0009, 3)
      })
    })

    it('should maintain performance under load', async () => {
      const start = performance.now()
      
      // Run 1000 fee calculations
      const promises = Array.from({ length: 1000 }, () =>
        feeCalculator.calculateComprehensiveFees({
          type: 'buy',
          amount: 1000,
          paymentMethod: 'diboas_wallet',
          asset: 'BTC',
          chains: ['BTC']
        })
      )

      await Promise.all(promises)
      
      const duration = performance.now() - start
      expect(duration).toBeLessThan(5000) // Should complete within 5 seconds
    })
  })

  describe('INTEGRATION TESTS', () => {
    it('should integrate fee calculation with transaction processing', async () => {
      const transactionData = {
        type: 'buy',
        amount: 1000,
        asset: 'ETH',
        paymentMethod: 'diboas_wallet'
      }

      // Calculate fees separately
      const expectedFees = await feeCalculator.calculateComprehensiveFees({
        ...transactionData,
        chains: ['ETH']
      })

      // Process transaction (which should use same fee calculation)
      const result = await transactionEngine.processTransaction('user123', transactionData)

      expect(result.success).toBe(true)
      expect(result.transaction.fees.total).toBeCloseTo(expectedFees.total, 2)
    })

    it('should maintain consistency across all transaction types', async () => {
      const transactionTypes = [
        { type: 'add', amount: 1000, paymentMethod: 'credit_debit_card' },
        { type: 'send', amount: 500, recipient: '@johndoe' },
        { type: 'withdraw', amount: 800, paymentMethod: 'bank_account' },
        { type: 'buy', amount: 1200, asset: 'BTC', paymentMethod: 'diboas_wallet' },
        { type: 'sell', amount: 600, asset: 'ETH' },
        { type: 'start_strategy', amount: 2000, strategyConfig: { objective: 'emergency-fund' } }
      ]

      for (const txData of transactionTypes) {
        const result = await transactionEngine.processTransaction('user123', txData)
        expect(result.success).toBe(true)
        expect(result.transaction.fees.total).toBeGreaterThan(0)
        expect(result.transaction.fees.diBoaS).toBeGreaterThan(0)
      }
    })
  })
})