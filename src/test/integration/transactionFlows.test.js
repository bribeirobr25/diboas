/**
 * Transaction Flow Integration Tests
 * Tests complete transaction workflows from initiation to completion
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { TransactionEngine } from '../../services/transactions/TransactionEngine.js'
import MultiWalletManager from '../../services/transactions/MultiWalletManager.js'
import { dataManager } from '../../services/DataManager.js'
import { mockUser, mockBalance, mockTransactions } from '../mocks/mockData.js'

// Mock external services
vi.mock('../../services/DataManager.js', () => ({
  dataManager: {
    getBalance: vi.fn(),
    setBalance: vi.fn(),
    getTransactions: vi.fn(),
    addTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    emit: vi.fn()
  }
}))

vi.mock('../../services/integrations/IntegrationManager.js', () => ({
  getIntegrationManager: vi.fn(() => Promise.resolve({
    execute: vi.fn(),
    validatePaymentMethod: vi.fn(),
    processPayment: vi.fn(),
    estimateFees: vi.fn()
  }))
}))

vi.mock('../../utils/secureLogger.js', () => ({
  default: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn()
  }
}))

describe('Transaction Flow Integration Tests', () => {
  let transactionEngine
  let walletManager
  let mockDataManager

  beforeEach(async () => {
    // Initialize services
    transactionEngine = new TransactionEngine()
    walletManager = new MultiWalletManager()
    mockDataManager = dataManager

    // Reset all mocks
    vi.clearAllMocks()

    // Set up default mock responses
    mockDataManager.getBalance.mockResolvedValue({
      total: 1000,
      available: 600,
      invested: 400,
      breakdown: {
        SOL: { usdc: 600, sol: 2.5, usdValue: 600 },
        BTC: { balance: 0.01, usdValue: 430 }
      },
      assets: {
        BTC: { amount: 0.01, usdValue: 430 },
        ETH: { amount: 0.1, usdValue: 300 }
      }
    })

    mockDataManager.getTransactions.mockResolvedValue(mockTransactions)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Add (On-Ramp) Transaction Flow', () => {
    it('should complete full add transaction workflow', async () => {
      const transactionData = {
        type: 'add',
        amount: '100',
        paymentMethod: 'credit_card',
        userId: 'test-user-123'
      }

      // Step 1: Validate transaction
      const validation = await transactionEngine.validateTransaction(
        transactionData.userId, 
        transactionData
      )
      expect(validation.isValid).toBe(true)

      // Step 2: Plan routing
      const routing = await transactionEngine.planTransactionRouting(
        transactionData.userId,
        transactionData
      )
      expect(routing.feasible).toBe(true)
      expect(routing.toChain).toBe('SOL')
      expect(routing.toAsset).toBe('USDC')

      // Step 3: Calculate fees
      const fees = await transactionEngine.calculateComprehensiveFees(
        transactionData,
        routing
      )
      expect(fees.total).toBeGreaterThan(0)
      expect(fees.diBoaS).toBeCloseTo(0.09, 2) // 100 * 0.0009
      expect(fees.provider).toBeCloseTo(1, 2)   // Credit card fee

      // Step 4: Execute transaction
      const transaction = await transactionEngine.executeTransaction(
        transactionData.userId,
        {
          ...transactionData,
          routing,
          fees
        }
      )
      
      expect(transaction.status).toBe('pending')
      expect(transaction.amount).toBe(100)
      expect(transaction.netAmount).toBeCloseTo(98.91, 2) // 100 - fees
      expect(mockDataManager.addTransaction).toHaveBeenCalled()

      // Step 5: Verify balance update on completion
      await transactionEngine.completeTransaction(transaction.id, {
        status: 'completed',
        onChainHash: '0xtest123'
      })

      expect(mockDataManager.setBalance).toHaveBeenCalledWith(
        transactionData.userId,
        expect.objectContaining({
          total: expect.any(Number),
          available: expect.any(Number)
        })
      )
    })

    it('should handle add transaction with Apple Pay', async () => {
      const transactionData = {
        type: 'add',
        amount: '500',
        paymentMethod: 'apple_pay',
        userId: 'test-user-123'
      }

      const validation = await transactionEngine.validateTransaction(
        transactionData.userId,
        transactionData
      )
      expect(validation.isValid).toBe(true)

      const routing = await transactionEngine.planTransactionRouting(
        transactionData.userId,
        transactionData
      )
      expect(routing.feasible).toBe(true)

      const fees = await transactionEngine.calculateComprehensiveFees(
        transactionData,
        routing
      )
      expect(fees.provider).toBeCloseTo(2.5, 2) // Apple Pay 0.5%
      expect(fees.total).toBeLessThan(4) // Should be less than credit card
    })

    it('should reject add transaction below minimum amount', async () => {
      const transactionData = {
        type: 'add',
        amount: '5', // Below $10 minimum
        paymentMethod: 'credit_card',
        userId: 'test-user-123'
      }

      const validation = await transactionEngine.validateTransaction(
        transactionData.userId,
        transactionData
      )
      expect(validation.isValid).toBe(false)
      expect(validation.error).toContain('Minimum amount for add is $10')
    })
  })

  describe('Withdraw (Off-Ramp) Transaction Flow', () => {
    it('should complete full withdraw transaction workflow', async () => {
      const transactionData = {
        type: 'withdraw',
        amount: '200',
        paymentMethod: 'bank_account',
        userId: 'test-user-123'
      }

      // Step 1: Validate transaction
      const validation = await transactionEngine.validateTransaction(
        transactionData.userId,
        transactionData
      )
      expect(validation.isValid).toBe(true)

      // Step 2: Plan routing
      const routing = await transactionEngine.planTransactionRouting(
        transactionData.userId,
        transactionData
      )
      expect(routing.feasible).toBe(true)
      expect(routing.fromChain).toBe('SOL')
      expect(routing.fromAsset).toBe('USDC')

      // Step 3: Calculate fees
      const fees = await transactionEngine.calculateComprehensiveFees(
        transactionData,
        routing
      )
      expect(fees.diBoaS).toBeCloseTo(1.8, 2) // 200 * 0.009
      expect(fees.provider).toBeCloseTo(4, 2)  // Bank account 2%

      // Step 4: Execute transaction
      const transaction = await transactionEngine.executeTransaction(
        transactionData.userId,
        {
          ...transactionData,
          routing,
          fees
        }
      )

      expect(transaction.status).toBe('pending')
      expect(transaction.amount).toBe(200)
      expect(mockDataManager.addTransaction).toHaveBeenCalled()

      // Step 5: Verify balance reduction
      await transactionEngine.completeTransaction(transaction.id, {
        status: 'completed'
      })

      expect(mockDataManager.setBalance).toHaveBeenCalledWith(
        transactionData.userId,
        expect.objectContaining({
          available: expect.any(Number) // Should be reduced
        })
      )
    })

    it('should reject withdraw with insufficient balance', async () => {
      const transactionData = {
        type: 'withdraw',
        amount: '700', // More than available USDC (600)
        paymentMethod: 'bank_account',
        userId: 'test-user-123'
      }

      const validation = await transactionEngine.validateTransaction(
        transactionData.userId,
        transactionData
      )
      expect(validation.isValid).toBe(false)
      expect(validation.error).toContain('Insufficient balance')
    })
  })

  describe('Send (P2P) Transaction Flow', () => {
    it('should complete P2P send transaction workflow', async () => {
      const transactionData = {
        type: 'send',
        amount: '50',
        recipient: '@testuser',
        userId: 'test-user-123'
      }

      // Step 1: Validate transaction
      const validation = await transactionEngine.validateTransaction(
        transactionData.userId,
        transactionData
      )
      expect(validation.isValid).toBe(true)

      // Step 2: Plan routing
      const routing = await transactionEngine.planTransactionRouting(
        transactionData.userId,
        transactionData
      )
      expect(routing.feasible).toBe(true)
      expect(routing.fromChain).toBe('SOL')
      expect(routing.toChain).toBe('SOL')

      // Step 3: Calculate fees
      const fees = await transactionEngine.calculateComprehensiveFees(
        transactionData,
        routing
      )
      expect(fees.diBoaS).toBeCloseTo(0.045, 3) // 50 * 0.0009
      expect(fees.provider).toBe(0) // No provider fee for P2P
      expect(fees.network).toBeCloseTo(0.025, 3) // SOL network fee

      // Step 4: Execute transaction
      const transaction = await transactionEngine.executeTransaction(
        transactionData.userId,
        {
          ...transactionData,
          routing,
          fees
        }
      )

      expect(transaction.status).toBe('pending')
      expect(transaction.recipient).toBe('@testuser')
      expect(mockDataManager.addTransaction).toHaveBeenCalled()
    })

    it('should validate recipient username format', async () => {
      const transactionData = {
        type: 'send',
        amount: '50',
        recipient: 'invalidusername', // Missing @ prefix
        userId: 'test-user-123'
      }

      const validation = await transactionEngine.validateTransaction(
        transactionData.userId,
        transactionData
      )
      expect(validation.isValid).toBe(false)
      expect(validation.error).toContain('Invalid diBoaS username')
    })
  })

  describe('Transfer (External) Transaction Flow', () => {
    it('should complete cross-chain transfer workflow', async () => {
      const transactionData = {
        type: 'transfer',
        amount: '100',
        recipient: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Bitcoin address
        userId: 'test-user-123'
      }

      // Step 1: Validate transaction
      const validation = await transactionEngine.validateTransaction(
        transactionData.userId,
        transactionData
      )
      expect(validation.isValid).toBe(true)

      // Step 2: Plan routing
      const routing = await transactionEngine.planTransactionRouting(
        transactionData.userId,
        transactionData
      )
      expect(routing.feasible).toBe(true)
      expect(routing.fromChain).toBe('SOL')
      expect(routing.toChain).toBe('BTC')
      expect(routing.needsRouting).toBe(true)

      // Step 3: Calculate fees
      const fees = await transactionEngine.calculateComprehensiveFees(
        transactionData,
        routing
      )
      expect(fees.diBoaS).toBeCloseTo(0.9, 2) // 100 * 0.009
      expect(fees.network).toBeGreaterThan(9) // Bitcoin network fees are high
      expect(fees.routing).toBeGreaterThan(0) // Cross-chain routing fee

      // Step 4: Execute transaction
      const transaction = await transactionEngine.executeTransaction(
        transactionData.userId,
        {
          ...transactionData,
          routing,
          fees
        }
      )

      expect(transaction.status).toBe('pending')
      expect(transaction.toChain).toBe('BTC')
      expect(transaction.recipient).toBe('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
    })

    it('should handle Ethereum transfer', async () => {
      const transactionData = {
        type: 'transfer',
        amount: '100',
        recipient: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',
        userId: 'test-user-123'
      }

      const validation = await transactionEngine.validateTransaction(
        transactionData.userId,
        transactionData
      )
      expect(validation.isValid).toBe(true)

      const routing = await transactionEngine.planTransactionRouting(
        transactionData.userId,
        transactionData
      )
      expect(routing.toChain).toBe('ETH')
    })

    it('should handle Solana transfer', async () => {
      const transactionData = {
        type: 'transfer',
        amount: '100',
        recipient: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NFD',
        userId: 'test-user-123'
      }

      const validation = await transactionEngine.validateTransaction(
        transactionData.userId,
        transactionData
      )
      expect(validation.isValid).toBe(true)

      const routing = await transactionEngine.planTransactionRouting(
        transactionData.userId,
        transactionData
      )
      expect(routing.toChain).toBe('SOL')
      expect(routing.needsRouting).toBe(false) // Same chain
    })
  })

  describe('Buy Asset Transaction Flow', () => {
    it('should complete Bitcoin purchase workflow', async () => {
      const transactionData = {
        type: 'buy',
        amount: '500',
        asset: 'BTC',
        paymentMethod: 'credit_card',
        userId: 'test-user-123'
      }

      // Step 1: Validate transaction
      const validation = await transactionEngine.validateTransaction(
        transactionData.userId,
        transactionData
      )
      expect(validation.isValid).toBe(true)

      // Step 2: Plan routing
      const routing = await transactionEngine.planTransactionRouting(
        transactionData.userId,
        transactionData
      )
      expect(routing.feasible).toBe(true)
      expect(routing.fromAsset).toBe('USDC')
      expect(routing.toAsset).toBe('BTC')
      expect(routing.toChain).toBe('BTC')

      // Step 3: Calculate fees
      const fees = await transactionEngine.calculateComprehensiveFees(
        transactionData,
        routing
      )
      expect(fees.diBoaS).toBeCloseTo(0.45, 2) // 500 * 0.0009
      expect(fees.network).toBeGreaterThan(45) // Bitcoin network fees
      expect(fees.provider).toBeGreaterThan(0) // Credit card or DEX fee

      // Step 4: Execute transaction
      const transaction = await transactionEngine.executeTransaction(
        transactionData.userId,
        {
          ...transactionData,
          routing,
          fees
        }
      )

      expect(transaction.asset).toBe('BTC')
      expect(transaction.toChain).toBe('BTC')
    })

    it('should handle buy with diBoaS wallet (DEX)', async () => {
      // First ensure user has sufficient USDC balance
      mockDataManager.getBalance.mockResolvedValue({
        total: 1000,
        available: 600,
        invested: 400,
        breakdown: {
          SOL: { usdc: 600, sol: 2.5, usdValue: 600 }
        }
      })

      const transactionData = {
        type: 'buy',
        amount: '200',
        asset: 'ETH',
        paymentMethod: 'diboas_wallet',
        userId: 'test-user-123'
      }

      const validation = await transactionEngine.validateTransaction(
        transactionData.userId,
        transactionData
      )
      expect(validation.isValid).toBe(true)

      const fees = await transactionEngine.calculateComprehensiveFees(
        transactionData,
        { fromChain: 'SOL', toChain: 'ETH', needsRouting: true }
      )
      expect(fees.provider).toBeCloseTo(2, 2) // DEX fee 1%
    })

    it('should reject buy with insufficient USDC balance', async () => {
      const transactionData = {
        type: 'buy',
        amount: '700', // More than available USDC
        asset: 'BTC',
        paymentMethod: 'diboas_wallet',
        userId: 'test-user-123'
      }

      const validation = await transactionEngine.validateTransaction(
        transactionData.userId,
        transactionData
      )
      expect(validation.isValid).toBe(false)
      expect(validation.error).toContain('Insufficient balance')
    })
  })

  describe('Sell Asset Transaction Flow', () => {
    it('should complete Bitcoin sell workflow', async () => {
      const transactionData = {
        type: 'sell',
        amount: '400', // Less than BTC value (430)
        asset: 'BTC',
        userId: 'test-user-123'
      }

      // Step 1: Validate transaction
      const validation = await transactionEngine.validateTransaction(
        transactionData.userId,
        transactionData
      )
      expect(validation.isValid).toBe(true)

      // Step 2: Plan routing
      const routing = await transactionEngine.planTransactionRouting(
        transactionData.userId,
        transactionData
      )
      expect(routing.feasible).toBe(true)
      expect(routing.fromAsset).toBe('BTC')
      expect(routing.toAsset).toBe('USDC')
      expect(routing.toChain).toBe('SOL')

      // Step 3: Calculate fees
      const fees = await transactionEngine.calculateComprehensiveFees(
        transactionData,
        routing
      )
      expect(fees.diBoaS).toBeCloseTo(0.36, 2) // 400 * 0.0009
      expect(fees.provider).toBeCloseTo(4, 2)  // DEX fee 1%

      // Step 4: Execute transaction
      const transaction = await transactionEngine.executeTransaction(
        transactionData.userId,
        {
          ...transactionData,
          routing,
          fees
        }
      )

      expect(transaction.asset).toBe('BTC')
      expect(transaction.type).toBe('sell')
    })

    it('should reject sell with insufficient asset balance', async () => {
      const transactionData = {
        type: 'sell',
        amount: '500', // More than BTC value (430)
        asset: 'BTC',
        userId: 'test-user-123'
      }

      const validation = await transactionEngine.validateTransaction(
        transactionData.userId,
        transactionData
      )
      expect(validation.isValid).toBe(false)
      expect(validation.error).toContain('Insufficient balance')
    })
  })

  describe('Transaction Status Management', () => {
    it('should handle transaction status updates', async () => {
      const transactionId = 'test-tx-123'
      
      // Update to completed
      await transactionEngine.updateTransactionStatus(transactionId, 'completed', {
        onChainHash: '0xabcdef123456'
      })

      expect(mockDataManager.updateTransaction).toHaveBeenCalledWith(
        transactionId,
        expect.objectContaining({
          status: 'completed',
          onChainHash: '0xabcdef123456'
        })
      )
    })

    it('should handle transaction failures', async () => {
      const transactionId = 'test-tx-456'

      await transactionEngine.updateTransactionStatus(transactionId, 'failed', {
        error: 'Network timeout'
      })

      expect(mockDataManager.updateTransaction).toHaveBeenCalledWith(
        transactionId,
        expect.objectContaining({
          status: 'failed',
          error: 'Network timeout'
        })
      )
    })
  })

  describe('Error Recovery and Edge Cases', () => {
    it('should handle network failures gracefully', async () => {
      // Mock network failure
      mockDataManager.getBalance.mockRejectedValue(new Error('Network error'))

      const transactionData = {
        type: 'send',
        amount: '50',
        recipient: '@testuser',
        userId: 'test-user-123'
      }

      await expect(
        transactionEngine.validateTransaction(transactionData.userId, transactionData)
      ).rejects.toThrow('Network error')
    })

    it('should handle concurrent transaction validation', async () => {
      const transactionData1 = {
        type: 'withdraw',
        amount: '300',
        paymentMethod: 'bank_account',
        userId: 'test-user-123'
      }

      const transactionData2 = {
        type: 'send',
        amount: '350',
        recipient: '@testuser',
        userId: 'test-user-123'
      }

      // Both transactions should validate individually but not together
      const validation1 = await transactionEngine.validateTransaction(
        transactionData1.userId,
        transactionData1
      )
      expect(validation1.isValid).toBe(true)

      const validation2 = await transactionEngine.validateTransaction(
        transactionData2.userId,
        transactionData2
      )
      expect(validation2.isValid).toBe(true)

      // Total amount (650) exceeds available balance (600)
      // This would be caught at execution time with proper balance locking
    })

    it('should handle partial transaction completion', async () => {
      const transactionData = {
        type: 'transfer',
        amount: '100',
        recipient: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        userId: 'test-user-123'
      }

      const transaction = await transactionEngine.executeTransaction(
        transactionData.userId,
        transactionData
      )

      // Simulate partial completion (balance deducted but on-chain transaction pending)
      await transactionEngine.updateTransactionStatus(transaction.id, 'processing', {
        stage: 'blockchain_submission'
      })

      expect(mockDataManager.updateTransaction).toHaveBeenCalledWith(
        transaction.id,
        expect.objectContaining({
          status: 'processing',
          stage: 'blockchain_submission'
        })
      )
    })
  })

  describe('Fee Optimization', () => {
    it('should recommend optimal payment methods', async () => {
      const transactionData = {
        type: 'add',
        amount: '1000',
        userId: 'test-user-123'
      }

      const paymentMethods = ['credit_card', 'apple_pay', 'bank_account', 'paypal']
      const feeComparisons = []

      for (const method of paymentMethods) {
        const routing = await transactionEngine.planTransactionRouting(
          transactionData.userId,
          { ...transactionData, paymentMethod: method }
        )
        
        const fees = await transactionEngine.calculateComprehensiveFees(
          { ...transactionData, paymentMethod: method },
          routing
        )
        
        feeComparisons.push({ method, total: fees.total })
      }

      // Sort by lowest fee
      feeComparisons.sort((a, b) => a.total - b.total)
      
      // Apple Pay should be among the lowest fees
      expect(feeComparisons[0].method).toMatch(/^(apple_pay|google_pay|bank_account)$/)
      
      // PayPal should be the highest
      expect(feeComparisons[feeComparisons.length - 1].method).toBe('paypal')
    })

    it('should optimize routing for lowest network fees', async () => {
      const transactionData = {
        type: 'transfer',
        amount: '100',
        userId: 'test-user-123'
      }

      // Compare Solana vs Bitcoin routing costs
      const solanaRecipient = '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NFD'
      const bitcoinRecipient = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'

      const solanaRouting = await transactionEngine.planTransactionRouting(
        transactionData.userId,
        { ...transactionData, recipient: solanaRecipient }
      )
      
      const bitcoinRouting = await transactionEngine.planTransactionRouting(
        transactionData.userId,
        { ...transactionData, recipient: bitcoinRecipient }
      )

      const solanaFees = await transactionEngine.calculateComprehensiveFees(
        { ...transactionData, recipient: solanaRecipient },
        solanaRouting
      )
      
      const bitcoinFees = await transactionEngine.calculateComprehensiveFees(
        { ...transactionData, recipient: bitcoinRecipient },
        bitcoinRouting
      )

      // Solana should be significantly cheaper
      expect(solanaFees.total).toBeLessThan(bitcoinFees.total)
      expect(bitcoinFees.total - solanaFees.total).toBeGreaterThan(80)
    })
  })
})