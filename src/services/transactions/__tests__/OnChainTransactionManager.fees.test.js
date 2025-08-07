import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { OnChainTransactionManager } from '../OnChainTransactionManager.js'
import dataManager from '../../DataManager.js'
import { mockOnChainStatusProvider } from '../../onchain/OnChainStatusProvider.js'
import { generateSecureTransactionId } from '../../../utils/secureRandom.js'
import { logSecureEvent } from '../../../utils/securityLogging.js'

// Mock dependencies
vi.mock('../../DataManager.js')
vi.mock('../../onchain/OnChainStatusProvider.js')
vi.mock('../../../utils/secureRandom.js')
vi.mock('../../../utils/securityLogging.js')
vi.mock('../../../utils/logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

describe('OnChainTransactionManager - Fee Handling', () => {
  let manager
  let mockDataManager
  
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup mock implementations
    generateSecureTransactionId.mockReturnValue('tx_test_123')
    logSecureEvent.mockResolvedValue()
    
    // Mock DataManager
    mockDataManager = {
      updateBalance: vi.fn().mockResolvedValue(),
      addTransaction: vi.fn().mockResolvedValue(),
      updateTransaction: vi.fn().mockResolvedValue(),
      getState: vi.fn().mockReturnValue({
        balance: {
          availableForSpending: 1000,
          investedAmount: 500,
          totalUSD: 1500
        }
      }),
      emit: vi.fn()
    }
    
    // Mock onChainProvider
    mockOnChainStatusProvider.submitTransaction = vi.fn().mockResolvedValue({
      success: true,
      txHash: 'test_hash_123',
      explorerLink: 'https://explorer.test/tx/test_hash_123',
      estimatedConfirmationTime: '10-30 seconds'
    })
    
    mockOnChainStatusProvider.getTransactionStatus = vi.fn()
      .mockReturnValueOnce({ status: 'confirming', confirmations: 0 })
      .mockReturnValueOnce({ status: 'confirmed', confirmations: 1 })
    
    manager = new OnChainTransactionManager()
    manager.dataManager = mockDataManager
  })
  
  afterEach(() => {
    manager.pendingTransactions.clear()
  })

  describe('Transaction Execution with Fees', () => {
    it('should store fees in pending transaction', async () => {
      const transactionData = {
        type: 'add',
        amount: 100,
        fees: {
          total: 0.59,
          diBoaS: 0.09,
          network: 0.0001,
          provider: 0.5,
          dex: 0
        },
        paymentMethod: 'apple_pay',
        userId: 'test_user'
      }
      
      const result = await manager.executeTransaction(transactionData)
      
      expect(result.success).toBe(true)
      expect(result.transactionId).toBe('tx_test_123')
      
      // Check that fees are stored in pending transaction
      const pendingTx = manager.pendingTransactions.get('tx_test_123')
      expect(pendingTx).toBeDefined()
      expect(pendingTx.fees).toEqual(transactionData.fees)
      expect(pendingTx.fees.total).toBe(0.59)
    })
    
    it('should pass fees to updateBalance when transaction is confirmed', async () => {
      const pendingTx = {
        id: 'tx_test_123',
        type: 'add',
        amount: 100,
        fees: {
          total: 0.59,
          diBoaS: 0.09,
          network: 0.0001,
          provider: 0.5,
          dex: 0
        },
        paymentMethod: 'apple_pay',
        userId: 'test_user',
        status: 'pending_confirmation'
      }
      
      manager.pendingTransactions.set('tx_test_123', pendingTx)
      
      await manager.handleTransactionConfirmed('tx_test_123')
      
      // Verify updateBalance was called with correct fees
      expect(mockDataManager.updateBalance).toHaveBeenCalledWith({
        type: 'add',
        amount: 100,
        fees: {
          total: 0.59,
          diBoaS: 0.09,
          network: 0.0001,
          provider: 0.5,
          dex: 0
        },
        asset: undefined,
        paymentMethod: 'apple_pay'
      })
    })
    
    it('should handle missing fees gracefully', async () => {
      const transactionData = {
        type: 'add',
        amount: 100,
        fees: undefined, // No fees provided
        paymentMethod: 'crypto_wallet',
        userId: 'test_user'
      }
      
      const result = await manager.executeTransaction(transactionData)
      
      expect(result.success).toBe(true)
      
      const pendingTx = manager.pendingTransactions.get('tx_test_123')
      expect(pendingTx.fees).toBeUndefined()
      
      // Confirm transaction
      await manager.handleTransactionConfirmed('tx_test_123')
      
      // Should call updateBalance with default fees object when fees are undefined
      expect(mockDataManager.updateBalance).toHaveBeenCalledWith({
        type: 'add',
        amount: 100,
        fees: { total: 0 }, // OnChainTransactionManager defaults undefined fees to { total: 0 }
        netAmount: undefined,
        asset: undefined,
        paymentMethod: 'crypto_wallet'
      })
    })
  })
  
  describe('Different Transaction Types', () => {
    it('should handle add transaction fees correctly', async () => {
      const transactionData = {
        type: 'add',
        amount: 1000,
        fees: {
          total: 10.5, // 1.05% total fees
          diBoaS: 0.9,
          network: 0.001,
          provider: 9.599,
          dex: 0
        },
        paymentMethod: 'bank_account',
        userId: 'test_user'
      }
      
      await manager.executeTransaction(transactionData)
      const pendingTx = manager.pendingTransactions.get('tx_test_123')
      
      await manager.handleTransactionConfirmed('tx_test_123')
      
      expect(mockDataManager.updateBalance).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'add',
          amount: 1000,
          fees: expect.objectContaining({
            total: 10.5
          })
        })
      )
    })
    
    it('should handle withdraw transaction fees correctly', async () => {
      const transactionData = {
        type: 'withdraw',
        amount: 500,
        fees: {
          total: 14.5, // 2.9% total fees
          diBoaS: 4.5,
          network: 0.0005,
          provider: 10.0,
          dex: 0
        },
        paymentMethod: 'bank_account',
        userId: 'test_user'
      }
      
      await manager.executeTransaction(transactionData)
      await manager.handleTransactionConfirmed('tx_test_123')
      
      expect(mockDataManager.updateBalance).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'withdraw',
          amount: 500,
          fees: expect.objectContaining({
            total: 14.5
          })
        })
      )
    })
    
    it('should handle buy transaction with DEX fees', async () => {
      const transactionData = {
        type: 'buy',
        amount: 250,
        asset: 'BTC',
        fees: {
          total: 2.225, // 0.89% total
          diBoaS: 0.225,
          network: 0.25, // 0.1% BTC network
          provider: 0,
          dex: 2.0 // 0.8% cross-chain DEX
        },
        paymentMethod: 'diboas_wallet',
        userId: 'test_user'
      }
      
      await manager.executeTransaction(transactionData)
      await manager.handleTransactionConfirmed('tx_test_123')
      
      expect(mockDataManager.updateBalance).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'buy',
          amount: 250,
          asset: 'BTC',
          fees: expect.objectContaining({
            total: 2.225,
            dex: 2.0
          })
        })
      )
    })
  })
  
  describe('Transaction History with Fees', () => {
    it('should include fees in transaction history', async () => {
      const transactionData = {
        type: 'send',
        amount: 50,
        recipient: '@john_doe',
        fees: {
          total: 0.045,
          diBoaS: 0.045,
          network: 0.00001,
          provider: 0,
          dex: 0
        },
        userId: 'test_user'
      }
      
      await manager.executeTransaction(transactionData)
      
      // Check addTransaction was called with fees
      expect(mockDataManager.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'tx_test_123',
          type: 'send',
          amount: 50,
          fees: transactionData.fees,
          status: 'pending_confirmation'
        })
      )
    })
  })
  
  describe('Error Scenarios', () => {
    it('should not update balance if transaction fails', async () => {
      const pendingTx = {
        id: 'tx_test_123',
        type: 'add',
        amount: 100,
        fees: { total: 0.59 },
        paymentMethod: 'apple_pay',
        userId: 'test_user',
        status: 'pending_confirmation'
      }
      
      manager.pendingTransactions.set('tx_test_123', pendingTx)
      
      await manager.handleTransactionFailed('tx_test_123', 'Network error')
      
      // Should NOT call updateBalance for failed transactions
      expect(mockDataManager.updateBalance).not.toHaveBeenCalled()
      
      // Should update transaction status to failed
      expect(mockDataManager.updateTransaction).toHaveBeenCalledWith(
        'tx_test_123',
        expect.objectContaining({
          status: 'failed',
          error: 'Network error',
          balanceUpdateApplied: false
        })
      )
    })
    
    it('should handle balance update errors gracefully', async () => {
      mockDataManager.updateBalance.mockRejectedValue(new Error('Balance update failed'))
      
      const pendingTx = {
        id: 'tx_test_123',
        type: 'add',
        amount: 100,
        fees: { total: 0.59 },
        paymentMethod: 'apple_pay',
        userId: 'test_user',
        status: 'pending_confirmation'
      }
      
      manager.pendingTransactions.set('tx_test_123', pendingTx)
      
      // Should not throw, but log error
      await expect(manager.handleTransactionConfirmed('tx_test_123')).resolves.not.toThrow()
      
      // Should log critical security event
      expect(logSecureEvent).toHaveBeenCalledWith(
        'TRANSACTION_BALANCE_UPDATE_FAILED',
        'test_user',
        expect.objectContaining({
          transactionId: 'tx_test_123',
          error: 'Balance update failed',
          critical: true
        })
      )
    })
  })
  
  describe('Monitoring and Confirmation Flow', () => {
    it('should monitor transaction until confirmed and then update balance', async () => {
      vi.useFakeTimers()
      
      const transactionData = {
        type: 'add',
        amount: 100,
        fees: {
          total: 0.59,
          diBoaS: 0.09,
          network: 0.0001,
          provider: 0.5,
          dex: 0
        },
        paymentMethod: 'apple_pay',
        userId: 'test_user'
      }
      
      await manager.executeTransaction(transactionData)
      
      // Advance timer to trigger first poll
      vi.advanceTimersByTime(1000)
      
      // Advance timer to trigger second poll (confirmed)
      vi.advanceTimersByTime(2000)
      
      // Wait for promises to resolve
      await vi.runOnlyPendingTimersAsync()
      
      // Should have called updateBalance after confirmation
      expect(mockDataManager.updateBalance).toHaveBeenCalledWith(
        expect.objectContaining({
          fees: expect.objectContaining({
            total: 0.59
          })
        })
      )
      
      vi.useRealTimers()
    })
  })
})