/**
 * Unit Tests for useOnChainStatus Hook
 * Tests real-time transaction status tracking and blockchain confirmation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useOnChainStatus, useMultipleOnChainStatus } from '../useOnChainStatus.js'
import { TRANSACTION_STATUS } from '../../services/onchain/OnChainStatusProvider.js'

// Mock the OnChainStatusProvider
vi.mock('../../services/onchain/OnChainStatusProvider.js', () => ({
  mockOnChainStatusProvider: {
    getTransactionStatus: vi.fn(),
    cancelTransaction: vi.fn()
  },
  TRANSACTION_STATUS: {
    PENDING: 'pending',
    CONFIRMING: 'confirming',
    CONFIRMED: 'confirmed',
    FAILED: 'failed',
    TIMEOUT: 'timeout'
  }
}))

describe('useOnChainStatus', () => {
  let mockProvider

  beforeEach(async () => {
    vi.useFakeTimers()
    mockProvider = (await import('../../services/onchain/OnChainStatusProvider.js')).mockOnChainStatusProvider
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('basic functionality', () => {
    it('should return initial state correctly', () => {
      const { result } = renderHook(() => useOnChainStatus('tx-123'))

      expect(result.current.status).toBeNull()
      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBeNull()
      expect(result.current.isPending).toBe(false)
      expect(result.current.isConfirming).toBe(false)
      expect(result.current.isConfirmed).toBe(false)
      expect(result.current.isFailed).toBe(false)
      expect(result.current.progress).toBeNull()
    })

    it('should not start polling without transaction ID', () => {
      const { result } = renderHook(() => useOnChainStatus(null))

      act(() => {
        vi.advanceTimersByTime(5000)
      })

      expect(mockProvider.getTransactionStatus).not.toHaveBeenCalled()
      expect(result.current.isLoading).toBe(false)
    })
  })

  describe('polling behavior', () => {
    it('should start polling when transaction ID is provided', async () => {
      mockProvider.getTransactionStatus.mockReturnValue({
        status: TRANSACTION_STATUS.PENDING,
        confirmations: 0,
        requiredConfirmations: 1,
        txHash: 'hash-123',
        chain: 'SOL',
        explorerLink: 'https://solscan.io/tx/hash-123'
      })

      const { result } = renderHook(() => useOnChainStatus('tx-123'))

      expect(result.current.isLoading).toBe(true)

      act(() => {
        vi.advanceTimersByTime(2000) // Advance past first poll
      })

      await waitFor(() => {
        expect(mockProvider.getTransactionStatus).toHaveBeenCalledWith('tx-123')
      })

      expect(result.current.status).toBeDefined()
      expect(result.current.isPending).toBe(true)
      expect(result.current.txHash).toBe('hash-123')
      expect(result.current.explorerLink).toBe('https://solscan.io/tx/hash-123')
    })

    it('should stop polling when transaction is confirmed', async () => {
      const onConfirmed = vi.fn()
      
      mockProvider.getTransactionStatus.mockReturnValue({
        status: TRANSACTION_STATUS.CONFIRMED,
        confirmations: 1,
        requiredConfirmations: 1,
        txHash: 'hash-123'
      })

      const { result } = renderHook(() => 
        useOnChainStatus('tx-123', { onConfirmed })
      )

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(result.current.isConfirmed).toBe(true)
      })

      expect(result.current.isLoading).toBe(false)
      expect(onConfirmed).toHaveBeenCalledWith(expect.objectContaining({
        status: TRANSACTION_STATUS.CONFIRMED
      }))

      // Verify polling stopped
      const callCountBefore = mockProvider.getTransactionStatus.mock.calls.length
      act(() => {
        vi.advanceTimersByTime(5000)
      })
      const callCountAfter = mockProvider.getTransactionStatus.mock.calls.length
      expect(callCountAfter).toBe(callCountBefore)
    })

    it('should stop polling when transaction fails', async () => {
      const onFailed = vi.fn()
      
      mockProvider.getTransactionStatus.mockReturnValue({
        status: TRANSACTION_STATUS.FAILED,
        error: 'Gas fees too high',
        txHash: 'hash-123'
      })

      const { result } = renderHook(() => 
        useOnChainStatus('tx-123', { onFailed })
      )

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      await waitFor(() => {
        expect(result.current.isFailed).toBe(true)
      })

      expect(result.current.isLoading).toBe(false)
      expect(result.current.error).toBe('Gas fees too high')
      expect(onFailed).toHaveBeenCalledWith(expect.objectContaining({
        status: TRANSACTION_STATUS.FAILED
      }))
    })

    it('should handle timeout correctly', async () => {
      const onTimeout = vi.fn()
      
      mockProvider.getTransactionStatus.mockReturnValue({
        status: TRANSACTION_STATUS.PENDING,
        confirmations: 0,
        requiredConfirmations: 1
      })

      const { result } = renderHook(() => 
        useOnChainStatus('tx-123', { timeout: 5000, onTimeout })
      )

      act(() => {
        vi.advanceTimersByTime(6000) // Exceed timeout
      })

      await waitFor(() => {
        expect(result.current.error).toBe('Transaction confirmation timeout')
      })

      expect(result.current.isLoading).toBe(false)
      expect(onTimeout).toHaveBeenCalled()
    })
  })

  describe('progress calculation', () => {
    it('should calculate progress correctly', () => {
      mockProvider.getTransactionStatus.mockReturnValue({
        status: TRANSACTION_STATUS.CONFIRMING,
        confirmations: 6,
        requiredConfirmations: 12,
        txHash: 'hash-123'
      })

      const { result } = renderHook(() => useOnChainStatus('tx-123'))

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(result.current.progress).toEqual({
        current: 6,
        required: 12,
        percentage: 50
      })
    })

    it('should cap progress at 100%', () => {
      mockProvider.getTransactionStatus.mockReturnValue({
        status: TRANSACTION_STATUS.CONFIRMED,
        confirmations: 15,
        requiredConfirmations: 12,
        txHash: 'hash-123'
      })

      const { result } = renderHook(() => useOnChainStatus('tx-123'))

      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(result.current.progress.percentage).toBe(100)
    })
  })

  describe('control functions', () => {
    it('should refresh status manually', async () => {
      mockProvider.getTransactionStatus.mockReturnValue({
        status: TRANSACTION_STATUS.PENDING,
        confirmations: 0
      })

      const { result } = renderHook(() => useOnChainStatus('tx-123'))

      await act(async () => {
        const status = await result.current.refreshStatus()
        expect(status).toBeDefined()
        expect(mockProvider.getTransactionStatus).toHaveBeenCalledWith('tx-123')
      })
    })

    it('should handle refresh errors', async () => {
      mockProvider.getTransactionStatus.mockImplementation(() => {
        throw new Error('Network error')
      })

      const { result } = renderHook(() => useOnChainStatus('tx-123'))

      await act(async () => {
        await result.current.refreshStatus()
      })

      expect(result.current.error).toBe('Network error')
    })

    it('should cancel transaction successfully', async () => {
      mockProvider.cancelTransaction.mockResolvedValue({
        success: true,
        message: 'Transaction cancelled'
      })

      mockProvider.getTransactionStatus.mockReturnValue({
        status: TRANSACTION_STATUS.FAILED,
        error: 'Transaction cancelled by user'
      })

      const { result } = renderHook(() => useOnChainStatus('tx-123'))

      await act(async () => {
        const cancelResult = await result.current.cancelTransaction()
        expect(cancelResult.success).toBe(true)
      })

      expect(mockProvider.cancelTransaction).toHaveBeenCalledWith('tx-123')
    })

    it('should handle cancellation failure', async () => {
      mockProvider.cancelTransaction.mockResolvedValue({
        success: false,
        error: 'Transaction too far in confirmation process'
      })

      const { result } = renderHook(() => useOnChainStatus('tx-123'))

      await act(async () => {
        const cancelResult = await result.current.cancelTransaction()
        expect(cancelResult.success).toBe(false)
      })

      expect(result.current.error).toBe('Transaction too far in confirmation process')
    })
  })

  describe('cleanup', () => {
    it('should cleanup on unmount', () => {
      const { unmount } = renderHook(() => useOnChainStatus('tx-123'))

      unmount()

      // Advance timers to ensure no polling occurs
      act(() => {
        vi.advanceTimersByTime(10000)
      })

      expect(mockProvider.getTransactionStatus).not.toHaveBeenCalled()
    })

    it('should cleanup when transaction ID changes', () => {
      const { result, rerender } = renderHook(
        ({ txId }) => useOnChainStatus(txId),
        { initialProps: { txId: 'tx-123' } }
      )

      // Start polling for first transaction
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      const initialCallCount = mockProvider.getTransactionStatus.mock.calls.length

      // Change transaction ID
      rerender({ txId: 'tx-456' })

      // Verify old polling stopped and new polling started
      act(() => {
        vi.advanceTimersByTime(2000)
      })

      expect(mockProvider.getTransactionStatus).toHaveBeenCalledWith('tx-456')
    })
  })
})

describe('useMultipleOnChainStatus', () => {
  let mockProvider

  beforeEach(async () => {
    vi.useFakeTimers()
    mockProvider = (await import('../../services/onchain/OnChainStatusProvider.js')).mockOnChainStatusProvider
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('should track multiple transactions', () => {
    mockProvider.getTransactionStatus
      .mockReturnValueOnce({
        status: TRANSACTION_STATUS.PENDING,
        confirmations: 0
      })
      .mockReturnValueOnce({
        status: TRANSACTION_STATUS.CONFIRMING,
        confirmations: 3
      })

    const { result } = renderHook(() => 
      useMultipleOnChainStatus(['tx-1', 'tx-2'])
    )

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.statuses['tx-1']).toBeDefined()
    expect(result.current.statuses['tx-2']).toBeDefined()
    expect(result.current.statuses['tx-1'].status).toBe(TRANSACTION_STATUS.PENDING)
    expect(result.current.statuses['tx-2'].status).toBe(TRANSACTION_STATUS.CONFIRMING)
  })

  it('should stop polling when all transactions complete', () => {
    mockProvider.getTransactionStatus
      .mockReturnValue({
        status: TRANSACTION_STATUS.CONFIRMED,
        confirmations: 1
      })

    const { result } = renderHook(() => 
      useMultipleOnChainStatus(['tx-1', 'tx-2'])
    )

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.isLoading).toBe(false)
  })

  it('should handle errors for individual transactions', () => {
    mockProvider.getTransactionStatus
      .mockImplementationOnce(() => {
        throw new Error('Network error for tx-1')
      })
      .mockReturnValueOnce({
        status: TRANSACTION_STATUS.PENDING
      })

    const { result } = renderHook(() => 
      useMultipleOnChainStatus(['tx-1', 'tx-2'])
    )

    act(() => {
      vi.advanceTimersByTime(2000)
    })

    expect(result.current.errors['tx-1']).toBe('Network error for tx-1')
    expect(result.current.statuses['tx-2']).toBeDefined()
  })
})