/**
 * Unit Tests for OnChainTransactionManager
 * Tests transaction execution with blockchain confirmation gating
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { OnChainTransactionManager } from '../OnChainTransactionManager.js'
import { TRANSACTION_STATUS } from '../../onchain/OnChainStatusProvider.js'

// Mock dependencies
vi.mock('../../onchain/OnChainStatusProvider.js', () => ({
  mockOnChainStatusProvider: {
    submitTransaction: vi.fn(),
    getTransactionStatus: vi.fn(),
    startConfirmationProcess: vi.fn()
  },
  TRANSACTION_STATUS: {
    PENDING: 'pending',
    CONFIRMING: 'confirming',
    CONFIRMED: 'confirmed',
    FAILED: 'failed',
    TIMEOUT: 'timeout'
  }
}))

vi.mock('../../DataManager.js', () => {
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

vi.mock('../../../utils/secureRandom.js', () => ({
  generateSecureTransactionId: vi.fn(() => 'secure-tx-123')
}))

vi.mock('../../../utils/securityLogging.js', () => ({
  logSecureEvent: vi.fn(() => Promise.resolve())
}))

describe('OnChainTransactionManager', () => {
  let manager
  let mockOnChainProvider
  let mockDataManager
  let mockLogSecureEvent
  let mockGenerateSecureTransactionId

  beforeEach(async () => {
    manager = new OnChainTransactionManager()
    await manager.initialize()
    
    mockOnChainProvider = (await import('../../onchain/OnChainStatusProvider.js')).mockOnChainStatusProvider
    mockDataManager = (await import('../../DataManager.js')).getDataManager()
    mockLogSecureEvent = (await import('../../../utils/securityLogging.js')).logSecureEvent
    mockGenerateSecureTransactionId = (await import('../../../utils/secureRandom.js')).generateSecureTransactionId
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('executeTransaction', () => {
    const mockTransactionData = {
      type: 'transfer',
      amount: 100,
      recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      asset: 'USDC',
      paymentMethod: 'diboas_wallet',
      userId: 'user-123'
    }

    it('should successfully execute transaction and return result', async () => {
      mockOnChainProvider.submitTransaction.mockResolvedValue({
        success: true,
        txHash: 'tx-hash-123',
        explorerLink: 'https://solscan.io/tx/tx-hash-123',
        estimatedConfirmationTime: 5000
      })

      const result = await manager.executeTransaction(mockTransactionData)

      expect(result.success).toBe(true)
      expect(result.transactionId).toBe('secure-tx-123')
      expect(result.txHash).toBe('tx-hash-123')
      expect(result.explorerLink).toBe('https://solscan.io/tx/tx-hash-123')
      expect(result.status).toBe('pending_confirmation')

      // Verify transaction was stored
      expect(manager.pendingTransactions.has('secure-tx-123')).toBe(true)

      // Verify logging
      expect(mockLogSecureEvent).toHaveBeenCalledWith('TRANSACTION_INITIATED', 'user-123', {
        transactionId: 'secure-tx-123',
        type: 'transfer',
        amount: 100,
        asset: 'USDC',
        paymentMethod: 'external_payment'
      })
    })

    it('should handle blockchain submission failure', async () => {
      mockOnChainProvider.submitTransaction.mockResolvedValue({
        success: false,
        error: 'Insufficient gas fees'
      })

      const result = await manager.executeTransaction(mockTransactionData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Insufficient gas fees')
      expect(result.status).toBe('failed')

      // Verify transaction was stored with failed status
      const pendingTx = manager.pendingTransactions.get('secure-tx-123')
      expect(pendingTx.status).toBe('failed')
      expect(pendingTx.error).toBe('Insufficient gas fees')
    })

    it('should handle unexpected errors', async () => {
      mockOnChainProvider.submitTransaction.mockRejectedValue(new Error('Network error'))

      const result = await manager.executeTransaction(mockTransactionData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error')
      expect(result.status).toBe('failed')
    })

    it('should determine correct blockchain for transaction', async () => {
      mockOnChainProvider.submitTransaction.mockResolvedValue({
        success: true,
        txHash: 'tx-hash-123',
        explorerLink: 'https://etherscan.io/tx/tx-hash-123'
      })

      // Test Ethereum address detection
      await manager.executeTransaction({
        ...mockTransactionData,
        type: 'transfer',
        recipient: '0x742d35Cc6634C0532925a3b8D7389e4B5F1c16e3'
      })

      const pendingTx = manager.pendingTransactions.get('secure-tx-123')
      expect(pendingTx.chain).toBe('ETH')
    })
  })

  describe('handleTransactionConfirmed', () => {
    beforeEach(() => {
      // Setup mock data manager state with new balance structure
      mockDataManager.getState.mockReturnValue({
        balance: {
          totalUSD: 1500,
          availableForSpending: 1000,
          investedAmount: 500,
          assets: {},
          breakdown: {}
        }
      })
    })

    it('should update balances after confirmation for transfer transaction', async () => {
      const pendingTx = {
        id: 'tx-123',
        type: 'transfer',
        amount: 100,
        fees: { total: 5 }, // Add fees for realistic test
        userId: 'user-123',
        txHash: 'hash-123',
        explorerLink: 'link-123',
        balanceUpdateApplied: false
      }
      manager.pendingTransactions.set('tx-123', pendingTx)

      await manager.handleTransactionConfirmed('tx-123')

      // Verify balance update was called with correct parameters
      expect(mockDataManager.updateBalance).toHaveBeenCalledWith({
        type: 'transfer',
        amount: 100,
        fees: { total: 5 },
        asset: undefined,
        paymentMethod: undefined
      })

      // Verify transaction status was updated
      expect(mockDataManager.updateTransaction).toHaveBeenCalledWith('tx-123', {
        status: 'confirmed',
        confirmedAt: expect.any(String),
        onChainStatus: 'confirmed',
        balanceUpdateApplied: true
      })

      // Verify status updates
      expect(pendingTx.status).toBe('confirmed')
      expect(pendingTx.balanceUpdateApplied).toBe(true)
    })

    it('should update balances correctly for buy transaction with diBoaS wallet', async () => {
      const pendingTx = {
        id: 'tx-123',
        type: 'buy',
        amount: 200,
        fees: { total: 10 }, // Add fees for realistic test
        asset: 'BTC',
        paymentMethod: 'diboas_wallet',
        userId: 'user-123',
        txHash: 'hash-123',
        explorerLink: 'link-123',
        balanceUpdateApplied: false
      }
      manager.pendingTransactions.set('tx-123', pendingTx)

      await manager.handleTransactionConfirmed('tx-123')

      // Verify balance update was called with correct parameters
      // Buy transaction diBoaS wallet:
      // Available Balance = current - transaction amount
      // Invested Balance = current + (transaction amount - fees)
      expect(mockDataManager.updateBalance).toHaveBeenCalledWith({
        type: 'buy',
        amount: 200,
        fees: { total: 10 },
        asset: 'BTC',
        paymentMethod: 'diboas_wallet'
      })

      // Verify transaction status was updated
      expect(mockDataManager.updateTransaction).toHaveBeenCalledWith('tx-123', {
        status: 'confirmed',
        confirmedAt: expect.any(String),
        onChainStatus: 'confirmed',
        balanceUpdateApplied: true
      })
    })

    it('should update balances correctly for sell transaction', async () => {
      const pendingTx = {
        id: 'tx-123',
        type: 'sell',
        amount: 150,
        fees: { total: 7 }, // Add fees for realistic test
        asset: 'BTC',
        userId: 'user-123',
        txHash: 'hash-123',
        explorerLink: 'link-123',
        balanceUpdateApplied: false
      }
      manager.pendingTransactions.set('tx-123', pendingTx)

      await manager.handleTransactionConfirmed('tx-123')

      // Verify balance update was called with correct parameters
      // Sell transaction:
      // Available Balance = current + (transaction amount - fees)
      // Invested Balance = current - transaction amount
      expect(mockDataManager.updateBalance).toHaveBeenCalledWith({
        type: 'sell',
        amount: 150,
        fees: { total: 7 },
        asset: 'BTC',
        paymentMethod: undefined
      })

      // Verify transaction status was updated
      expect(mockDataManager.updateTransaction).toHaveBeenCalledWith('tx-123', {
        status: 'confirmed',
        confirmedAt: expect.any(String),
        onChainStatus: 'confirmed',
        balanceUpdateApplied: true
      })
    })

    it('should update balances correctly for buy transaction with external payment', async () => {
      const pendingTx = {
        id: 'tx-123',
        type: 'buy',
        amount: 200,
        fees: { total: 10 },
        asset: 'ETH',
        paymentMethod: 'credit_debit_card',
        userId: 'user-123',
        txHash: 'hash-123',
        explorerLink: 'link-123',
        balanceUpdateApplied: false
      }
      manager.pendingTransactions.set('tx-123', pendingTx)

      await manager.handleTransactionConfirmed('tx-123')

      // Verify balance update was called with correct parameters
      // Buy transaction other payment methods:
      // Available Balance = no changes
      // Invested Balance = current + (transaction amount - fees)
      expect(mockDataManager.updateBalance).toHaveBeenCalledWith({
        type: 'buy',
        amount: 200,
        fees: { total: 10 },
        asset: 'ETH',
        paymentMethod: 'credit_debit_card'
      })
    })

    it('should handle balance update errors gracefully', async () => {
      const pendingTx = {
        id: 'tx-123',
        type: 'transfer',
        amount: 100,
        userId: 'user-123',
        balanceUpdateApplied: false
      }
      manager.pendingTransactions.set('tx-123', pendingTx)

      mockDataManager.setState.mockRejectedValue(new Error('Database error'))

      // Should not throw
      await expect(manager.handleTransactionConfirmed('tx-123')).resolves.toBeUndefined()

      // Should log critical error
      expect(mockLogSecureEvent).toHaveBeenCalledWith('TRANSACTION_BALANCE_UPDATE_FAILED', 'user-123', {
        transactionId: 'tx-123',
        error: 'Database error',
        critical: true
      })
    })
  })

  describe('handleTransactionFailed', () => {
    it('should handle failed transaction without updating balances', async () => {
      const pendingTx = {
        id: 'tx-123',
        type: 'transfer',
        amount: 100,
        userId: 'user-123',
        txHash: 'hash-123',
        explorerLink: 'link-123',
        balanceUpdateApplied: false
      }
      manager.pendingTransactions.set('tx-123', pendingTx)

      await manager.handleTransactionFailed('tx-123', 'Gas fees too high')

      // Verify balances were NOT updated
      expect(mockDataManager.setState).not.toHaveBeenCalled()

      // Verify transaction marked as failed
      expect(pendingTx.status).toBe('failed')
      expect(pendingTx.error).toBe('Gas fees too high')
      expect(pendingTx.balanceUpdateApplied).toBe(false)

      // Verify failed transaction was added to history
      expect(mockDataManager.addTransaction).toHaveBeenCalled()

      // Verify security logging
      expect(mockLogSecureEvent).toHaveBeenCalledWith('TRANSACTION_FAILED', 'user-123', {
        transactionId: 'tx-123',
        txHash: 'hash-123',
        explorerLink: 'link-123',
        error: 'Gas fees too high',
        fundsAffected: false
      })
    })
  })

  describe('getTransactionStatus', () => {
    it('should return null for non-existent transaction', () => {
      const status = manager.getTransactionStatus('non-existent')
      expect(status).toBeNull()
    })

    it('should return transaction status with on-chain data', () => {
      const pendingTx = {
        id: 'tx-123',
        type: 'transfer',
        amount: 100,
        status: 'pending_confirmation'
      }
      manager.pendingTransactions.set('tx-123', pendingTx)

      mockOnChainProvider.getTransactionStatus.mockReturnValue({
        status: TRANSACTION_STATUS.CONFIRMING,
        confirmations: 3,
        explorerLink: 'https://solscan.io/tx/hash'
      })

      const status = manager.getTransactionStatus('tx-123')
      
      expect(status).toEqual({
        ...pendingTx,
        onChainStatus: TRANSACTION_STATUS.CONFIRMING,
        confirmations: 3,
        explorerLink: 'https://solscan.io/tx/hash'
      })
    })
  })

  describe('getPendingTransactions', () => {
    it('should return all pending transactions for a user', () => {
      manager.pendingTransactions.set('tx-1', { userId: 'user-123', id: 'tx-1' })
      manager.pendingTransactions.set('tx-2', { userId: 'user-456', id: 'tx-2' })
      manager.pendingTransactions.set('tx-3', { userId: 'user-123', id: 'tx-3' })

      mockOnChainProvider.getTransactionStatus.mockReturnValue({
        status: TRANSACTION_STATUS.PENDING,
        confirmations: 0
      })

      const userTransactions = manager.getPendingTransactions('user-123')
      
      expect(userTransactions).toHaveLength(2)
      expect(userTransactions[0].id).toBe('tx-1')
      expect(userTransactions[1].id).toBe('tx-3')
    })
  })

  describe('generateTransactionDescription', () => {
    it('should generate correct descriptions for different transaction types', () => {
      const testCases = [
        {
          transaction: { type: 'add', amount: 100, paymentMethod: 'credit_debit_card', status: 'confirmed' },
          expected: 'Deposit $100.00 via Credit/Debit Card'
        },
        {
          transaction: { type: 'withdraw', amount: 50, paymentMethod: 'bank_account', status: 'failed' },
          expected: 'Withdraw $50.00 to Bank Account (Failed)'
        },
        {
          transaction: { type: 'send', amount: 25, recipient: '@alice', status: 'confirmed' },
          expected: 'Send $25.00 to @alice'
        },
        {
          transaction: { type: 'transfer', amount: 75, status: 'confirmed' },
          expected: 'Transfer $75.00 to external wallet'
        },
        {
          transaction: { type: 'buy', amount: 200, asset: 'BTC', status: 'confirmed' },
          expected: 'Buy $200.00 BTC'
        },
        {
          transaction: { type: 'sell', amount: 150, asset: 'ETH', status: 'confirmed' },
          expected: 'Sell $150.00 ETH'
        }
      ]

      testCases.forEach(({ transaction, expected }) => {
        const description = manager.generateTransactionDescription(transaction)
        expect(description).toBe(expected)
      })
    })
  })

  describe('determineChain', () => {
    it('should determine correct chain for buy/sell transactions', () => {
      expect(manager.determineChain('buy', 'BTC')).toBe('BTC')
      expect(manager.determineChain('sell', 'ETH')).toBe('ETH')
      expect(manager.determineChain('buy', 'SOL')).toBe('SOL')
      expect(manager.determineChain('sell', 'SUI')).toBe('SUI')
    })

    it('should detect chain from recipient address for transfers', () => {
      // BTC addresses
      expect(manager.determineChain('transfer', null, '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')).toBe('BTC')
      expect(manager.determineChain('transfer', null, 'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4')).toBe('BTC')
      
      // ETH address
      expect(manager.determineChain('transfer', null, '0x742d35Cc6634C0532925a3b8D7389e4B5F1c16e3')).toBe('ETH')
      
      // SOL address
      expect(manager.determineChain('transfer', null, '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBe('SOL')
      
      // SUI address
      expect(manager.determineChain('transfer', null, '0x7c3e1ad62f0ac85e1227cb7b3dfa123c03c8191f9c3fbac9548ded485c52e169')).toBe('SUI')
    })

    it('should default to SOL for unknown patterns', () => {
      expect(manager.determineChain('add')).toBe('SOL')
      expect(manager.determineChain('transfer', null, 'invalid-address')).toBe('SOL')
    })
  })
})