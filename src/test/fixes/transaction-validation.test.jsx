/**
 * Unit Tests for Transaction Validation Bug Fixes
 * Tests all scenarios for payment method validation and balance display
 */

import { renderHook, act } from '@testing-library/react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import useTransactionValidation from '../../hooks/transactions/useTransactionValidation.js'
import TransactionPage from '../../components/TransactionPage.jsx'
import { dataManager } from '../../services/DataManager.js'

// Mock dependencies
vi.mock('../../services/DataManager.js', () => ({
  dataManager: {
    getState: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn()
  }
}))

vi.mock('../../hooks/transactions/useWalletBalance.js', () => ({
  useWalletBalance: () => ({
    availableForSpending: 1000,
    investedAmount: 500,
    assets: {
      'SOL': { investedAmount: 100 }
    }
  })
}))

vi.mock('../../hooks/transactions/useFeeCalculator.js', () => ({
  useFeeCalculator: () => ({
    calculateFees: vi.fn().mockReturnValue({
      breakdown: { diboas: 1, network: 0.5, dex: 2 },
      total: 3.5
    }),
    isCalculating: false
  })
}))

describe('Transaction Validation Bug Fixes', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    dataManager.getState.mockReturnValue({
      balance: {
        availableForSpending: 1000,
        investedAmount: 500,
        assets: { 'SOL': { investedAmount: 100 } }
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Payment Method Validation', () => {
    it('should require payment method for withdraw transactions', () => {
      const { result } = renderHook(() => useTransactionValidation())
      
      act(() => {
        const validation = result.current.validateTransaction({
          type: 'withdraw',
          amount: 100,
          paymentMethod: null
        })
        
        expect(validation.isValid).toBe(false)
        expect(validation.errors.paymentMethod).toEqual({
          message: 'Please select where to withdraw funds',
          isValid: false
        })
      })
    })

    it('should require payment method for buy transactions', () => {
      const { result } = renderHook(() => useTransactionValidation())
      
      act(() => {
        const validation = result.current.validateTransaction({
          type: 'buy',
          amount: 100,
          paymentMethod: null
        })
        
        expect(validation.isValid).toBe(false)
        expect(validation.errors.paymentMethod).toEqual({
          message: 'Please select a payment method',
          isValid: false
        })
      })
    })

    it('should require payment method for add transactions', () => {
      const { result } = renderHook(() => useTransactionValidation())
      
      act(() => {
        const validation = result.current.validateTransaction({
          type: 'add',
          amount: 100,
          paymentMethod: null
        })
        
        expect(validation.isValid).toBe(false)
        expect(validation.errors.paymentMethod).toEqual({
          message: 'Please select a payment method',
          isValid: false
        })
      })
    })

    it('should pass validation when payment method is provided', () => {
      const { result } = renderHook(() => useTransactionValidation())
      
      act(() => {
        const validation = result.current.validateTransaction({
          type: 'withdraw',
          amount: 100,
          paymentMethod: 'bank_account'
        })
        
        expect(validation.errors.paymentMethod).toBeUndefined()
      })
    })

    it('should not require payment method for send transactions', () => {
      const { result } = renderHook(() => useTransactionValidation())
      
      act(() => {
        const validation = result.current.validateTransaction({
          type: 'send',
          amount: 100,
          recipient: 'user@example.com'
        })
        
        expect(validation.errors.paymentMethod).toBeUndefined()
      })
    })
  })

  describe('Balance Display', () => {
    const renderTransactionPageWithRouter = (searchParams = '') => {
      const MockedTransactionPage = () => (
        <BrowserRouter>
          <TransactionPage />
        </BrowserRouter>
      )
      return render(<MockedTransactionPage />)
    }

    it('should display correct available balance for buy transactions', async () => {
      // Mock URL search params for buy transaction
      Object.defineProperty(window, 'location', {
        value: { search: '?asset=SOL' },
        writable: true
      })
      
      renderTransactionPageWithRouter()
      
      await waitFor(() => {
        // Should show available balance for spending
        expect(screen.getByText(/\$1,000\.00/)).toBeInTheDocument()
      })
    })

    it('should display correct balance for sell transactions', async () => {
      // Mock URL search params for sell transaction  
      Object.defineProperty(window, 'location', {
        value: { search: '?asset=SOL&type=sell' },
        writable: true
      })
      
      renderTransactionPageWithRouter()
      
      await waitFor(() => {
        // Should show invested amount for the specific asset
        expect(screen.getByText(/\$100\.00/)).toBeInTheDocument()
      })
    })

    it('should handle zero balance gracefully', async () => {
      dataManager.getState.mockReturnValue({
        balance: {
          availableForSpending: 0,
          investedAmount: 0,
          assets: {}
        }
      })
      
      renderTransactionPageWithRouter()
      
      await waitFor(() => {
        expect(screen.getByText(/\$0\.00/)).toBeInTheDocument()
      })
    })

    it('should handle missing balance data gracefully', async () => {
      dataManager.getState.mockReturnValue({
        balance: null
      })
      
      renderTransactionPageWithRouter()
      
      await waitFor(() => {
        expect(screen.getByText(/\$0\.00/)).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases and Error Scenarios', () => {
    it('should handle invalid transaction types gracefully', () => {
      const { result } = renderHook(() => useTransactionValidation())
      
      act(() => {
        const validation = result.current.validateTransaction({
          type: 'invalid_type',
          amount: 100
        })
        
        // Should not crash and provide reasonable defaults
        expect(validation).toBeDefined()
        expect(typeof validation.isValid).toBe('boolean')
      })
    })

    it('should handle negative amounts', () => {
      const { result } = renderHook(() => useTransactionValidation())
      
      act(() => {
        const validation = result.current.validateTransaction({
          type: 'buy',
          amount: -100,
          paymentMethod: 'diboas_wallet'
        })
        
        expect(validation.isValid).toBe(false)
        expect(validation.errors.amount).toBeDefined()
      })
    })

    it('should handle extremely large amounts', () => {
      const { result } = renderHook(() => useTransactionValidation())
      
      act(() => {
        const validation = result.current.validateTransaction({
          type: 'buy',
          amount: Number.MAX_SAFE_INTEGER,
          paymentMethod: 'diboas_wallet'
        })
        
        expect(validation.isValid).toBe(false)
        expect(validation.errors.amount).toBeDefined()
      })
    })

    it('should handle null/undefined transaction data', () => {
      const { result } = renderHook(() => useTransactionValidation())
      
      act(() => {
        const validation1 = result.current.validateTransaction(null)
        const validation2 = result.current.validateTransaction(undefined)
        const validation3 = result.current.validateTransaction({})
        
        expect(validation1.isValid).toBe(false)
        expect(validation2.isValid).toBe(false)  
        expect(validation3.isValid).toBe(false)
      })
    })
  })

  describe('System Recovery', () => {
    it('should recover from validation errors when corrected', () => {
      const { result } = renderHook(() => useTransactionValidation())
      
      // Initial invalid state
      act(() => {
        const validation1 = result.current.validateTransaction({
          type: 'withdraw',
          amount: 100,
          paymentMethod: null
        })
        expect(validation1.isValid).toBe(false)
      })
      
      // Corrected state
      act(() => {
        const validation2 = result.current.validateTransaction({
          type: 'withdraw',
          amount: 100,
          paymentMethod: 'bank_account'
        })
        expect(validation2.isValid).toBe(true)
      })
    })

    it('should handle concurrent validation calls', () => {
      const { result } = renderHook(() => useTransactionValidation())
      
      act(() => {
        // Simulate rapid validation calls
        const validations = []
        for (let i = 0; i < 10; i++) {
          validations.push(result.current.validateTransaction({
            type: 'buy',
            amount: 100 + i,
            paymentMethod: 'diboas_wallet'
          }))
        }
        
        // All should complete without errors
        validations.forEach(validation => {
          expect(validation).toBeDefined()
          expect(typeof validation.isValid).toBe('boolean')
        })
      })
    })
  })
})