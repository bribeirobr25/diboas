/**
 * Integration Tests for On-Chain Transaction Flow
 * Tests complete transaction execution from submission to blockchain confirmation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OnChainTransactionManager } from '../../services/transactions/OnChainTransactionManager.js'
import { MockOnChainStatusProvider, TRANSACTION_STATUS } from '../../services/onchain/OnChainStatusProvider.js'
import { dataManager } from '../../services/DataManager.js'

// Mock dependencies
vi.mock('../../services/DataManager.js', () => ({
  dataManager: {
    getState: vi.fn(),
    updateBalance: vi.fn(),
    updateTransaction: vi.fn(),
    addTransaction: vi.fn(),
    emit: vi.fn()
  }
}))

vi.mock('../../utils/secureRandom.js', () => ({
  generateSecureTransactionId: vi.fn(() => `tx-${Date.now()}`)
}))

vi.mock('../../utils/securityLogging.js', () => ({
  logSecureEvent: vi.fn(() => Promise.resolve())
}))

describe('On-Chain Transaction Flow Integration', () => {
  let onChainManager
  let statusProvider
  let mockDataManager

  beforeEach(async () => {
    // Use real provider for integration testing
    statusProvider = new MockOnChainStatusProvider()
    onChainManager = new OnChainTransactionManager()
    onChainManager.onChainProvider = statusProvider
    await onChainManager.initialize()

    mockDataManager = dataManager
    
    // Setup default balance state with new structure
    mockDataManager.getState.mockReturnValue({
      balance: {
        totalUSD: 1500,
        availableForSpending: 1000,
        investedAmount: 500,
        assets: {
          BTC: { amount: 0, usdValue: 200, investedAmount: 200 },
          ETH: { amount: 0, usdValue: 300, investedAmount: 300 }
        },
        breakdown: {}
      }
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('successful transaction flow', () => {
    it('should complete full transaction lifecycle from submission to confirmation', async () => {
      vi.useFakeTimers()
      
      const transactionData = {
        type: 'transfer',
        amount: 100,
        recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        asset: 'USDC',
        paymentMethod: 'diboas_wallet',
        userId: 'user-123'
      }

      // Step 1: Execute transaction
      const executionResult = await onChainManager.executeTransaction(transactionData)
      
      expect(executionResult.success).toBe(true)
      expect(executionResult.transactionId).toBeTruthy()
      expect(executionResult.txHash).toBeTruthy()
      expect(executionResult.explorerLink).toBeTruthy()
      expect(executionResult.status).toBe('pending_confirmation')

      // Verify transaction is stored
      const pendingTx = onChainManager.pendingTransactions.get(executionResult.transactionId)
      expect(pendingTx).toBeDefined()
      expect(pendingTx.status).toBe('pending_confirmation')
      expect(pendingTx.balanceUpdateApplied).toBe(false)

      // Step 2: Wait for blockchain confirmation (simulate time passing)
      await vi.advanceTimersByTimeAsync(3000) // Wait for confirmation process

      // Step 3: Verify transaction was confirmed
      const finalTx = onChainManager.pendingTransactions.get(executionResult.transactionId)
      expect(finalTx.status).toBe('confirmed')
      expect(finalTx.balanceUpdateApplied).toBe(true)

      // Step 4: Verify balance was updated correctly
      expect(mockDataManager.updateBalance).toHaveBeenCalledWith({
        type: 'transfer',
        amount: 100,
        fees: { total: 0 },
        asset: 'USDC',
        paymentMethod: 'diboas_wallet'
      })

      // Step 5: Verify transaction was added to history
      expect(mockDataManager.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          id: executionResult.transactionId,
          type: 'transfer',
          amount: 100,
          status: 'confirmed',
          txHash: executionResult.txHash,
          explorerLink: executionResult.explorerLink,
          chain: 'SOL'
        })
      )

      vi.useRealTimers()
    })

    it('should handle buy transaction with diboas wallet payment', async () => {
      vi.useFakeTimers()
      
      const transactionData = {
        type: 'buy',
        amount: 200,
        asset: 'BTC',
        paymentMethod: 'diboas_wallet',
        userId: 'user-123'
      }

      const executionResult = await onChainManager.executeTransaction(transactionData)
      
      expect(executionResult.success).toBe(true)

      // Wait for confirmation
      await vi.advanceTimersByTimeAsync(3000)

      // Verify balance update for buy transaction
      expect(mockDataManager.updateBalance).toHaveBeenCalledWith({
        type: 'buy',
        amount: 200,
        fees: { total: 0 },
        asset: 'BTC',
        paymentMethod: 'diboas_wallet'
      })

      vi.useRealTimers()
    })

    it('should handle sell transaction correctly', async () => {
      vi.useFakeTimers()
      
      const transactionData = {
        type: 'sell',
        amount: 150,
        asset: 'ETH',
        userId: 'user-123'
      }

      const executionResult = await onChainManager.executeTransaction(transactionData)
      
      expect(executionResult.success).toBe(true)

      // Wait for confirmation
      await vi.advanceTimersByTimeAsync(3000)

      // Verify balance update for sell transaction
      expect(mockDataManager.updateBalance).toHaveBeenCalledWith({
        type: 'sell',
        amount: 150,
        fees: { total: 0 },
        asset: 'ETH',
        paymentMethod: undefined
      })

      vi.useRealTimers()
    })

    it('should handle add transaction correctly', async () => {
      vi.useFakeTimers()
      
      const transactionData = {
        type: 'add',
        amount: 300,
        paymentMethod: 'credit_debit_card',
        userId: 'user-123'
      }

      const executionResult = await onChainManager.executeTransaction(transactionData)
      
      expect(executionResult.success).toBe(true)

      // Wait for confirmation
      await vi.advanceTimersByTimeAsync(3000)

      // Verify balance update for add transaction
      // Add/Deposit transaction:
      // Available Balance = current + (transaction amount - fees)
      // Invested Balance = no changes
      expect(mockDataManager.updateBalance).toHaveBeenCalledWith({
        type: 'add',
        amount: 300,
        fees: { total: 0 },
        asset: undefined,
        paymentMethod: 'credit_debit_card'
      })

      vi.useRealTimers()
    })
  })

  describe('failed transaction flow', () => {
    it('should handle blockchain submission failure without affecting balances', async () => {
      // Force submission failure by mocking random to trigger error
      vi.spyOn(Math, 'random').mockReturnValue(0.01) // Below 5% threshold

      const transactionData = {
        type: 'transfer',
        amount: 100,
        recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        userId: 'user-123'
      }

      const executionResult = await onChainManager.executeTransaction(transactionData)
      
      expect(executionResult.success).toBe(false)
      expect(executionResult.error).toBe('Network error: Failed to broadcast transaction')

      // Verify no balance updates occurred
      expect(mockDataManager.setState).not.toHaveBeenCalled()

      // Verify transaction was stored with failed status
      const failedTx = onChainManager.pendingTransactions.get(executionResult.transactionId)
      expect(failedTx.status).toBe('failed')
      expect(failedTx.balanceUpdateApplied).toBe(false)
    })

    it('should handle confirmation failure without affecting balances', async () => {
      vi.useFakeTimers()
      
      // First submission succeeds, then confirmation fails
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.1) // No submission error
        .mockReturnValueOnce(0.01) // Trigger confirmation failure

      const transactionData = {
        type: 'transfer',
        amount: 100,
        recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        userId: 'user-123'
      }

      const executionResult = await onChainManager.executeTransaction(transactionData)
      
      expect(executionResult.success).toBe(true)
      expect(executionResult.status).toBe('pending_confirmation')

      // Wait for confirmation to fail
      await vi.advanceTimersByTimeAsync(3000)

      // Verify transaction failed during confirmation
      const failedTx = onChainManager.pendingTransactions.get(executionResult.transactionId)
      expect(failedTx.status).toBe('failed')
      expect(failedTx.error).toContain('Insufficient gas fees')
      expect(failedTx.balanceUpdateApplied).toBe(false)

      // Verify no balance updates occurred
      expect(mockDataManager.setState).not.toHaveBeenCalled()

      // Verify failed transaction was added to history
      expect(mockDataManager.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          status: 'failed',
          error: expect.stringContaining('Insufficient gas fees')
        })
      )

      vi.useRealTimers()
    })
  })

  describe('transaction status tracking', () => {
    it('should provide real-time status updates during confirmation', async () => {
      vi.useFakeTimers()
      
      const transactionData = {
        type: 'transfer',
        amount: 100,
        recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        userId: 'user-123'
      }

      const executionResult = await onChainManager.executeTransaction(transactionData)
      const transactionId = executionResult.transactionId

      // Initial status should be pending_confirmation
      let status = onChainManager.getTransactionStatus(transactionId)
      expect(status.status).toBe('pending_confirmation')

      // Advance time partially
      await vi.advanceTimersByTimeAsync(1000)

      // Status should still be pending or confirming
      status = onChainManager.getTransactionStatus(transactionId)
      expect(['pending_confirmation', 'confirming'].includes(status.status)).toBe(true)

      // Complete confirmation
      await vi.advanceTimersByTimeAsync(3000)

      // Status should be confirmed
      status = onChainManager.getTransactionStatus(transactionId)
      expect(status.status).toBe('confirmed')

      vi.useRealTimers()
    })

    it('should return null for non-existent transactions', () => {
      const status = onChainManager.getTransactionStatus('non-existent-tx')
      expect(status).toBeNull()
    })

    it('should track multiple transactions independently', async () => {
      vi.useFakeTimers()
      
      const tx1Data = {
        type: 'transfer',
        amount: 100,
        recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        userId: 'user-123'
      }

      const tx2Data = {
        type: 'buy',
        amount: 200,
        asset: 'BTC',
        paymentMethod: 'diboas_wallet',
        userId: 'user-123'
      }

      // Execute both transactions
      const result1 = await onChainManager.executeTransaction(tx1Data)
      const result2 = await onChainManager.executeTransaction(tx2Data)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)

      // Both should be pending initially
      let status1 = onChainManager.getTransactionStatus(result1.transactionId)
      let status2 = onChainManager.getTransactionStatus(result2.transactionId)
      expect(status1.status).toBe('pending_confirmation')
      expect(status2.status).toBe('pending_confirmation')

      // Wait for confirmations
      await vi.advanceTimersByTimeAsync(3000)

      // Both should be confirmed
      status1 = onChainManager.getTransactionStatus(result1.transactionId)
      status2 = onChainManager.getTransactionStatus(result2.transactionId)
      expect(status1.status).toBe('confirmed')
      expect(status2.status).toBe('confirmed')

      vi.useRealTimers()
    })
  })

  describe('chain detection and explorer links', () => {
    it('should detect Bitcoin chain from address and use correct timing', async () => {
      vi.useFakeTimers()
      
      const transactionData = {
        type: 'transfer',
        amount: 100,
        recipient: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Bitcoin address
        userId: 'user-123'
      }

      const executionResult = await onChainManager.executeTransaction(transactionData)
      
      const pendingTx = onChainManager.pendingTransactions.get(executionResult.transactionId)
      expect(pendingTx.chain).toBe('BTC')
      expect(executionResult.explorerLink).toContain('mempool.space')

      // BTC should take 5 seconds for confirmation
      await vi.advanceTimersByTimeAsync(6000)

      const confirmedTx = onChainManager.pendingTransactions.get(executionResult.transactionId)
      expect(confirmedTx.status).toBe('confirmed')

      vi.useRealTimers()
    })

    it('should detect Ethereum chain from address', async () => {
      const transactionData = {
        type: 'transfer',
        amount: 100,
        recipient: '0x742d35Cc6634C0532925a3b8D7389e4B5F1c16e3', // Ethereum address
        userId: 'user-123'
      }

      const executionResult = await onChainManager.executeTransaction(transactionData)
      
      const pendingTx = onChainManager.pendingTransactions.get(executionResult.transactionId)
      expect(pendingTx.chain).toBe('ETH')
      expect(executionResult.explorerLink).toContain('etherscan.io')
    })

    it('should detect Sui chain from address', async () => {
      const transactionData = {
        type: 'transfer',
        amount: 100,
        recipient: '0x7c3e1ad62f0ac85e1227cb7b3dfa123c03c8191f9c3fbac9548ded485c52e169', // Sui address
        userId: 'user-123'
      }

      const executionResult = await onChainManager.executeTransaction(transactionData)
      
      const pendingTx = onChainManager.pendingTransactions.get(executionResult.transactionId)
      expect(pendingTx.chain).toBe('SUI')
      expect(executionResult.explorerLink).toContain('suivision.xyz')
    })
  })

  describe('error handling and edge cases', () => {
    it('should handle balance update errors gracefully', async () => {
      vi.useFakeTimers()
      
      // Mock balance update failure
      mockDataManager.setState.mockRejectedValue(new Error('Database connection lost'))

      const transactionData = {
        type: 'transfer',
        amount: 100,
        recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        userId: 'user-123'
      }

      const executionResult = await onChainManager.executeTransaction(transactionData)
      
      // Wait for confirmation attempt
      await vi.advanceTimersByTimeAsync(3000)

      // Transaction should still be marked as confirmed, but balance update failed
      const confirmedTx = onChainManager.pendingTransactions.get(executionResult.transactionId)
      expect(confirmedTx.status).toBe('confirmed')

      vi.useRealTimers()
    })

    it('should clean up completed transactions after timeout', async () => {
      vi.useFakeTimers()
      
      const transactionData = {
        type: 'transfer',
        amount: 100,
        recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        userId: 'user-123'
      }

      const executionResult = await onChainManager.executeTransaction(transactionData)
      const transactionId = executionResult.transactionId

      // Wait for confirmation
      await vi.advanceTimersByTimeAsync(3000)

      // Transaction should exist
      expect(onChainManager.pendingTransactions.has(transactionId)).toBe(true)

      // Wait for cleanup (5 minutes)
      await vi.advanceTimersByTimeAsync(300000)

      // Transaction should be cleaned up
      expect(onChainManager.pendingTransactions.has(transactionId)).toBe(false)

      vi.useRealTimers()
    })
  })

  describe('user transaction queries', () => {
    it('should return all pending transactions for a user', async () => {
      const userData1 = { userId: 'user-123', type: 'transfer', amount: 100, recipient: 'addr1' }
      const userData2 = { userId: 'user-456', type: 'transfer', amount: 200, recipient: 'addr2' }
      const userData3 = { userId: 'user-123', type: 'buy', amount: 300, asset: 'BTC', paymentMethod: 'diboas_wallet' }

      await onChainManager.executeTransaction(userData1)
      await onChainManager.executeTransaction(userData2)
      await onChainManager.executeTransaction(userData3)

      const user123Transactions = onChainManager.getPendingTransactions('user-123')
      const user456Transactions = onChainManager.getPendingTransactions('user-456')

      expect(user123Transactions).toHaveLength(2)
      expect(user456Transactions).toHaveLength(1)
      expect(user123Transactions[0].userId).toBe('user-123')
      expect(user123Transactions[1].userId).toBe('user-123')
      expect(user456Transactions[0].userId).toBe('user-456')
    })
  })
})