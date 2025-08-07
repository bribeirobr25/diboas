/**
 * Unit Tests for Transaction Progress Logging Bug Fixes
 * Tests transaction logging at all stages including early failures
 */

import { renderHook, act } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import useTransactions from '../../hooks/useTransactions.jsx'
import { dataManager } from '../../services/DataManager.js'

// Mock dependencies
vi.mock('../../services/DataManager.js', () => ({
  dataManager: {
    addTransaction: vi.fn(),
    updateBalance: vi.fn(),
    getState: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    emit: vi.fn()
  }
}))

vi.mock('../../hooks/transactions/useTransactionValidation.js', () => ({
  default: () => ({
    validateTransaction: vi.fn()
  })
}))

vi.mock('../../hooks/transactions/useWalletBalance.js', () => ({
  useWalletBalance: () => ({
    availableForSpending: 1000,
    checkSufficientBalance: vi.fn()
  })
}))

vi.mock('../../hooks/transactions/useFeeCalculator.js', () => ({
  useFeeCalculator: () => ({
    calculateFees: vi.fn(),
    isCalculating: false
  })
}))

vi.mock('../../services/transactions/OnChainTransactionManager.js', () => ({
  default: {
    executeTransaction: vi.fn()
  }
}))

describe('Transaction Progress Logging Bug Fixes', () => {
  let mockValidateTransaction
  let mockCheckSufficientBalance  
  let mockCalculateFees
  let mockExecuteTransaction

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    dataManager.getState.mockReturnValue({
      balance: { availableForSpending: 1000 },
      transactions: []
    })
    
    mockValidateTransaction = vi.fn()
    mockCheckSufficientBalance = vi.fn()
    mockCalculateFees = vi.fn()
    mockExecuteTransaction = vi.fn()
    
    const useTransactionValidation = require('../../hooks/transactions/useTransactionValidation.js').default
    const useWalletBalance = require('../../hooks/transactions/useWalletBalance.js').useWalletBalance
    const useFeeCalculator = require('../../hooks/transactions/useFeeCalculator.js').useFeeCalculator
    const OnChainTransactionManager = require('../../services/transactions/OnChainTransactionManager.js').default
    
    useTransactionValidation.mockReturnValue({
      validateTransaction: mockValidateTransaction
    })
    
    useWalletBalance.mockReturnValue({
      availableForSpending: 1000,
      checkSufficientBalance: mockCheckSufficientBalance
    })
    
    useFeeCalculator.mockReturnValue({
      calculateFees: mockCalculateFees,
      isCalculating: false
    })
    
    OnChainTransactionManager.executeTransaction = mockExecuteTransaction
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Early Stage Transaction Logging', () => {
    it('should log failed transactions at validation step', async () => {
      const { result } = renderHook(() => useTransactions())
      
      // Mock validation failure
      mockValidateTransaction.mockReturnValue({
        isValid: false,
        errors: { amount: { message: 'Invalid amount' } }
      })
      
      const transactionData = {
        type: 'buy',
        amount: 100,
        asset: 'SOL',
        paymentMethod: 'diboas_wallet'
      }
      
      await act(async () => {
        const result_val = await result.current.executeTransactionFlow(transactionData)
        expect(result_val.success).toBe(false)
      })
      
      // Should log failed transaction with validation error
      expect(dataManager.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'buy',
          status: 'failed',
          error: expect.stringContaining('Validation failed'),
          failedAtStep: 'validation',
          description: expect.stringContaining('Failed buy transaction - Validation error')
        })
      )
    })

    it('should log failed transactions at balance check step', async () => {
      const { result } = renderHook(() => useTransactions())
      
      // Mock validation success but balance check failure
      mockValidateTransaction.mockReturnValue({ isValid: true, errors: {} })
      mockCheckSufficientBalance.mockReturnValue({
        sufficient: false,
        shortfall: 50
      })
      
      const transactionData = {
        type: 'buy',
        amount: 1050, // More than available balance
        asset: 'SOL',
        paymentMethod: 'diboas_wallet'
      }
      
      await act(async () => {
        const result_val = await result.current.executeTransactionFlow(transactionData)
        expect(result_val.success).toBe(false)
      })
      
      // Should log failed transaction with balance error
      expect(dataManager.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'buy',
          status: 'failed',
          error: expect.stringContaining('Insufficient balance'),
          failedAtStep: 'balance_check',
          description: expect.stringContaining('Failed buy transaction - Insufficient balance')
        })
      )
    })

    it('should log failed transactions at fee calculation step', async () => {
      const { result } = renderHook(() => useTransactions())
      
      // Mock validation and balance check success but fee calculation failure
      mockValidateTransaction.mockReturnValue({ isValid: true, errors: {} })
      mockCheckSufficientBalance.mockReturnValue({ sufficient: true })
      mockCalculateFees.mockImplementation(() => {
        throw new Error('Fee calculation service unavailable')
      })
      
      const transactionData = {
        type: 'buy',
        amount: 100,
        asset: 'SOL',
        paymentMethod: 'diboas_wallet'
      }
      
      await act(async () => {
        const result_val = await result.current.executeTransactionFlow(transactionData)
        expect(result_val.success).toBe(false)
      })
      
      // Should log failed transaction with fee calculation error
      expect(dataManager.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'buy',
          status: 'failed',
          error: expect.stringContaining('Fee calculation service unavailable'),
          failedAtStep: 'fee_calculation',
          description: expect.stringContaining('Failed buy transaction - Fee calculation error')
        })
      )
    })

    it('should log failed transactions at execution step', async () => {
      const { result } = renderHook(() => useTransactions())
      
      // Mock all early steps success but execution failure
      mockValidateTransaction.mockReturnValue({ isValid: true, errors: {} })
      mockCheckSufficientBalance.mockReturnValue({ sufficient: true })
      mockCalculateFees.mockReturnValue({
        breakdown: { diboas: 1, network: 0.5 },
        total: 1.5
      })
      mockExecuteTransaction.mockRejectedValue(new Error('Network error'))
      
      const transactionData = {
        type: 'buy',
        amount: 100,
        asset: 'SOL',
        paymentMethod: 'diboas_wallet'
      }
      
      await act(async () => {
        const result_val = await result.current.executeTransactionFlow(transactionData)
        expect(result_val.success).toBe(false)
      })
      
      // Should log failed transaction with execution error
      expect(dataManager.addTransaction).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'buy',
          status: 'failed', 
          error: expect.stringContaining('Network error'),
          failedAtStep: 'execution',
          description: expect.stringContaining('Failed buy transaction - Execution error')
        })
      )
    })
  })

  describe('Transaction ID Generation', () => {
    it('should generate unique transaction IDs for failed transactions', async () => {
      const { result } = renderHook(() => useTransactions())
      
      mockValidateTransaction.mockReturnValue({
        isValid: false,
        errors: { amount: { message: 'Invalid amount' } }
      })
      
      const transactionData = {
        type: 'buy',
        amount: 100,
        asset: 'SOL'
      }
      
      // Execute multiple failed transactions
      await act(async () => {
        await result.current.executeTransactionFlow(transactionData)
        await result.current.executeTransactionFlow(transactionData)
        await result.current.executeTransactionFlow(transactionData)
      })
      
      // Should generate unique IDs for each
      expect(dataManager.addTransaction).toHaveBeenCalledTimes(3)
      const calls = dataManager.addTransaction.mock.calls
      const ids = calls.map(call => call[0].id)
      const uniqueIds = new Set(ids)
      expect(uniqueIds.size).toBe(3) // All IDs should be unique
    })

    it('should include timestamp in transaction IDs', async () => {
      const { result } = renderHook(() => useTransactions())
      
      mockValidateTransaction.mockReturnValue({
        isValid: false,
        errors: { amount: { message: 'Invalid amount' } }
      })
      
      const transactionData = { type: 'buy', amount: 100 }
      
      await act(async () => {
        await result.current.executeTransactionFlow(transactionData)
      })
      
      const calls = dataManager.addTransaction.mock.calls
      const transactionId = calls[0][0].id
      expect(transactionId).toMatch(/^tx_\d+_[a-z0-9]{6}$/) // Format: tx_timestamp_randomString
    })
  })

  describe('Edge Cases and Error Recovery', () => {
    it('should handle logging failures gracefully', async () => {
      const { result } = renderHook(() => useTransactions())
      
      // Mock dataManager.addTransaction to throw error
      dataManager.addTransaction.mockImplementation(() => {
        throw new Error('Logging service unavailable')
      })
      
      mockValidateTransaction.mockReturnValue({
        isValid: false,
        errors: { amount: { message: 'Invalid amount' } }
      })
      
      const transactionData = { type: 'buy', amount: 100 }
      
      // Should not crash even if logging fails
      await act(async () => {
        const result_val = await result.current.executeTransactionFlow(transactionData)
        expect(result_val.success).toBe(false)
        expect(result_val.error).toBeDefined()
      })
    })

    it('should handle concurrent transaction failures', async () => {
      const { result } = renderHook(() => useTransactions())
      
      mockValidateTransaction.mockReturnValue({
        isValid: false,
        errors: { amount: { message: 'Invalid amount' } }
      })
      
      const transactionData = { type: 'buy', amount: 100 }
      
      // Execute multiple concurrent transactions
      await act(async () => {
        const promises = Array(5).fill().map(() => 
          result.current.executeTransactionFlow(transactionData)
        )
        const results = await Promise.all(promises)
        
        // All should fail gracefully
        results.forEach(result => {
          expect(result.success).toBe(false)
        })
      })
      
      // Should log all failures
      expect(dataManager.addTransaction).toHaveBeenCalledTimes(5)
    })

    it('should preserve transaction context in error logs', async () => {
      const { result } = renderHook(() => useTransactions())
      
      mockValidateTransaction.mockReturnValue({
        isValid: false,
        errors: { 
          amount: { message: 'Amount too low', field: 'amount' },
          paymentMethod: { message: 'Missing payment method', field: 'paymentMethod' }
        }
      })
      
      const transactionData = {
        type: 'withdraw',
        amount: 0.01,
        asset: 'BTC',
        recipient: 'user@example.com'
      }
      
      await act(async () => {
        await result.current.executeTransactionFlow(transactionData)
      })
      
      const loggedTransaction = dataManager.addTransaction.mock.calls[0][0]
      expect(loggedTransaction).toMatchObject({
        type: 'withdraw',
        amount: 0.01,
        asset: 'BTC',
        recipient: 'user@example.com',
        status: 'failed',
        failedAtStep: 'validation'
      })
    })
  })

  describe('System Recovery and Resilience', () => {
    it('should continue processing after individual transaction failures', async () => {
      const { result } = renderHook(() => useTransactions())
      
      // First transaction fails at validation
      mockValidateTransaction
        .mockReturnValueOnce({ isValid: false, errors: { amount: { message: 'Invalid' } } })
        .mockReturnValueOnce({ isValid: true, errors: {} })
      
      mockCheckSufficientBalance.mockReturnValue({ sufficient: true })
      mockCalculateFees.mockReturnValue({ breakdown: {}, total: 1 })
      mockExecuteTransaction.mockResolvedValue({ success: true, txHash: '0x123' })
      
      const failedTransactionData = { type: 'buy', amount: -100 }
      const successTransactionData = { type: 'buy', amount: 100, paymentMethod: 'diboas_wallet' }
      
      await act(async () => {
        // First should fail
        const result1 = await result.current.executeTransactionFlow(failedTransactionData)
        expect(result1.success).toBe(false)
        
        // Second should succeed  
        const result2 = await result.current.executeTransactionFlow(successTransactionData)
        expect(result2.success).toBe(true)
      })
      
      // Should log both transactions appropriately
      expect(dataManager.addTransaction).toHaveBeenCalledTimes(2)
    })
  })
})