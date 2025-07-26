/**
 * Unit Tests for OnChainStatusProvider
 * Tests blockchain transaction simulation, status tracking, and error handling
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { MockOnChainStatusProvider, TRANSACTION_STATUS } from '../OnChainStatusProvider.js'

describe('OnChainStatusProvider', () => {
  let provider
  let mockDateNow

  beforeEach(() => {
    provider = new MockOnChainStatusProvider()
    mockDateNow = vi.spyOn(Date, 'now').mockReturnValue(1000000)
  })

  afterEach(() => {
    vi.clearAllMocks()
    mockDateNow.mockRestore()
  })

  describe('constructor', () => {
    it('should initialize with correct default values', () => {
      expect(provider.name).toBe('MockOnChainStatusProvider')
      expect(provider.errorRate).toBe(0.05) // 5% error rate
      expect(provider.pendingTransactions).toBeInstanceOf(Map)
      expect(provider.pendingTransactions.size).toBe(0)
    })
  })

  describe('submitTransaction', () => {
    const mockTransactionData = {
      id: 'test-tx-123',
      type: 'transfer',
      amount: 100,
      chain: 'SOL',
      recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
      asset: 'USDC'
    }

    it('should successfully submit transaction', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1) // No error

      const result = await provider.submitTransaction(mockTransactionData)

      expect(result.success).toBe(true)
      expect(result.txHash).toBeTruthy()
      expect(result.status).toBe(TRANSACTION_STATUS.PENDING)
      expect(result.explorerLink).toBeTruthy()
      expect(result.estimatedConfirmationTime).toBe(5000) // SOL timeout
    })

    it('should fail transaction with 5% error rate', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.01) // Trigger error

      const result = await provider.submitTransaction(mockTransactionData)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Network error: Failed to broadcast transaction')
      expect(result.txHash).toBeNull()
      expect(result.status).toBe(TRANSACTION_STATUS.FAILED)
    })

    it('should generate correct transaction hash format for different chains', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1) // No error

      // Test BTC
      const btcResult = await provider.submitTransaction({
        ...mockTransactionData,
        chain: 'BTC'
      })
      expect(btcResult.txHash).toMatch(/^[a-z0-9]{64}$/)

      // Test ETH
      const ethResult = await provider.submitTransaction({
        ...mockTransactionData,
        chain: 'ETH'
      })
      expect(ethResult.txHash).toMatch(/^0x[a-z0-9]{64}$/)

      // Test SOL
      const solResult = await provider.submitTransaction({
        ...mockTransactionData,
        chain: 'SOL'
      })
      expect(solResult.txHash).toMatch(/^[a-zA-Z0-9]+SOL[a-z0-9]+$/)

      // Test SUI
      const suiResult = await provider.submitTransaction({
        ...mockTransactionData,
        chain: 'SUI'
      })
      expect(suiResult.txHash).toMatch(/^[a-zA-Z0-9]+SUI[a-z0-9]+$/)
    })

    it('should store pending transaction with correct data', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1) // No error

      await provider.submitTransaction(mockTransactionData)

      const pendingTx = provider.pendingTransactions.get('test-tx-123')
      expect(pendingTx).toBeDefined()
      expect(pendingTx.id).toBe('test-tx-123')
      expect(pendingTx.type).toBe('transfer')
      expect(pendingTx.amount).toBe(100)
      expect(pendingTx.chain).toBe('SOL')
      expect(pendingTx.status).toBe(TRANSACTION_STATUS.CONFIRMING)
      expect(pendingTx.confirmations).toBe(0)
      expect(pendingTx.requiredConfirmations).toBe(1) // SOL requirement
    })
  })

  describe('getTransactionStatus', () => {
    it('should return null for non-existent transaction', () => {
      const status = provider.getTransactionStatus('non-existent')
      expect(status).toBeNull()
    })

    it('should return correct status for existing transaction', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1) // No error

      await provider.submitTransaction({
        id: 'test-tx-456',
        type: 'transfer',
        amount: 50,
        chain: 'ETH'
      })

      const status = provider.getTransactionStatus('test-tx-456')
      expect(status).toBeDefined()
      expect(status.id).toBe('test-tx-456')
      expect(status.chain).toBe('ETH')
      expect(status.status).toBe(TRANSACTION_STATUS.CONFIRMING)
      expect(status.confirmations).toBe(0)
      expect(status.requiredConfirmations).toBe(12) // ETH requirement
    })
  })

  describe('generateExplorerLink', () => {
    it('should generate correct explorer links for different chains', () => {
      const btcLink = provider.generateExplorerLink('BTC', 'transaction')
      expect(btcLink).toBe('https://mempool.space/tx/bd2e7c74f5701c96673b16ecdc33d01d3e93574c81e869e715a78ff4698a556a')

      const ethLink = provider.generateExplorerLink('ETH', 'account')
      expect(ethLink).toBe('https://etherscan.io/address/0xac893c187843a775c74de8a7dd4cf749e5a4e262')

      const solLink = provider.generateExplorerLink('SOL', 'transaction')
      expect(solLink).toBe('https://solscan.io/tx/3pW7WADA8ysmwgMngGgu9RYdXpSvNeLRM7ftbsDV52doC91Gcc7mrtkteCu6HPjnWu9HTV9mKo43PshbRUe4AgmP')

      const suiLink = provider.generateExplorerLink('SUI', 'account')
      expect(suiLink).toBe('https://suivision.xyz/account/0x7c3e1ad62f0ac85e1227cb7b3dfa123c03c8191f9c3fbac9548ded485c52e169?tab=Activity')
    })

    it('should return default for unknown chain', () => {
      const unknownLink = provider.generateExplorerLink('UNKNOWN', 'transaction')
      expect(unknownLink).toBe('#')
    })
  })

  describe('startConfirmationProcess', () => {
    it('should handle BTC confirmation timing correctly', async () => {
      vi.useFakeTimers()
      vi.spyOn(Math, 'random').mockReturnValue(0.1) // No error

      await provider.submitTransaction({
        id: 'btc-tx-123',
        type: 'transfer',
        amount: 100,
        chain: 'BTC'
      })

      // Fast-forward to confirmation time (5 seconds for BTC)
      await vi.advanceTimersByTimeAsync(6000)
      await vi.runAllTimersAsync()

      const status = provider.getTransactionStatus('btc-tx-123')
      expect(status.status).toBe(TRANSACTION_STATUS.CONFIRMED)
      expect(status.confirmations).toBe(1)

      vi.useRealTimers()
    }, 10000)

    it('should handle other chains confirmation timing correctly', async () => {
      vi.useFakeTimers()
      vi.spyOn(Math, 'random').mockReturnValue(0.1) // No error

      await provider.submitTransaction({
        id: 'sol-tx-123',
        type: 'transfer',
        amount: 100,
        chain: 'SOL'
      })

      // Fast-forward to confirmation time (2 seconds for non-BTC)
      await vi.advanceTimersByTimeAsync(3000)
      await vi.runAllTimersAsync()

      const status = provider.getTransactionStatus('sol-tx-123')
      expect(status.status).toBe(TRANSACTION_STATUS.CONFIRMED)
      expect(status.confirmations).toBe(1)

      vi.useRealTimers()
    }, 10000)

    it('should handle confirmation failure (3% rate)', async () => {
      vi.useFakeTimers()
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.1) // No submission error
        .mockReturnValueOnce(0.01) // Trigger confirmation failure

      await provider.submitTransaction({
        id: 'fail-tx-123',
        type: 'transfer',
        amount: 100,
        chain: 'SOL'
      })

      // Fast-forward to confirmation time
      await vi.advanceTimersByTimeAsync(3000)

      const status = provider.getTransactionStatus('fail-tx-123')
      expect(status.status).toBe(TRANSACTION_STATUS.FAILED)
      expect(status.error).toBe('Transaction failed during confirmation: Insufficient gas fees')

      vi.useRealTimers()
    })
  })

  describe('cancelTransaction', () => {
    it('should return error for non-existent transaction', async () => {
      const result = await provider.cancelTransaction('non-existent')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Transaction not found')
    })

    it('should not cancel confirmed transaction', async () => {
      vi.spyOn(Math, 'random').mockReturnValue(0.1) // No error

      await provider.submitTransaction({
        id: 'confirmed-tx',
        type: 'transfer',
        amount: 100,
        chain: 'SOL'
      })

      // Manually set to confirmed
      const tx = provider.pendingTransactions.get('confirmed-tx')
      tx.status = TRANSACTION_STATUS.CONFIRMED

      const result = await provider.cancelTransaction('confirmed-tx')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Cannot cancel confirmed transaction')
    })

    it('should successfully cancel pending transaction (70% chance)', async () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.1) // No submission error
        .mockReturnValueOnce(0.5) // Successful cancellation

      await provider.submitTransaction({
        id: 'cancel-tx',
        type: 'transfer',
        amount: 100,
        chain: 'SOL'
      })

      const result = await provider.cancelTransaction('cancel-tx')
      expect(result.success).toBe(true)
      expect(result.message).toBe('Transaction cancelled successfully')

      const status = provider.getTransactionStatus('cancel-tx')
      expect(status.status).toBe(TRANSACTION_STATUS.FAILED)
      expect(status.error).toBe('Transaction cancelled by user')
    })

    it('should fail to cancel transaction (30% chance)', async () => {
      vi.spyOn(Math, 'random')
        .mockReturnValueOnce(0.1) // No submission error
        .mockReturnValueOnce(0.8) // Failed cancellation

      await provider.submitTransaction({
        id: 'no-cancel-tx',
        type: 'transfer',
        amount: 100,
        chain: 'SOL'
      })

      const result = await provider.cancelTransaction('no-cancel-tx')
      expect(result.success).toBe(false)
      expect(result.error).toBe('Transaction too far in confirmation process to cancel')
    })
  })

  describe('healthCheck', () => {
    it('should return healthy status', async () => {
      const health = await provider.healthCheck()
      
      expect(health.success).toBe(true)
      expect(health.status).toBe('healthy')
      expect(health.service).toBe('mock_onchain_status')
      expect(health.timestamp).toBeTruthy()
      expect(health.pendingTransactions).toBe(0)
    })
  })

  describe('simulateNetworkDelay', () => {
    it('should simulate network delay within range', async () => {
      vi.useFakeTimers()
      
      const delayPromise = provider.simulateNetworkDelay(100, 200)
      
      await vi.advanceTimersByTimeAsync(150)
      await expect(delayPromise).resolves.toBeUndefined()
      
      vi.useRealTimers()
    })
  })
})