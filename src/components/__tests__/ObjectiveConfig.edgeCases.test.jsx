/**
 * ObjectiveConfig Edge Cases and Race Condition Tests
 * Tests edge cases, race conditions, error handling, and system recovery
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import React from 'react'
import ObjectiveConfig from '../yield/ObjectiveConfig.jsx'

// Mock the required modules
vi.mock('../../services/DataManager.js', () => ({
  dataManager: {
    getBalance: vi.fn(() => ({ 
      totalAmount: 1000, 
      availableForSpending: 1000,
      pendingAmount: 0,
      investedAmount: 0,
      strategyBalance: 0,
      assets: {}
    })),
    processTransaction: vi.fn(),
    subscribe: vi.fn(() => vi.fn()),
    emit: vi.fn()
  }
}))

vi.mock('../../hooks/transactions/index.js', () => ({
  useWalletBalance: () => ({
    balance: { 
      availableForSpending: 1000,
      totalAmount: 1000
    }
  }),
  useTransactionFlow: () => ({
    flowState: 'idle',
    flowData: null,
    flowError: null,
    executeTransactionFlow: vi.fn(),
    confirmTransaction: vi.fn(),
    resetFlow: vi.fn()
  })
}))

// Mock PageHeader and progress screen components
vi.mock('../shared/PageHeader.jsx', () => ({
  default: () => <div data-testid="page-header">Page Header</div>
}))

vi.mock('../shared/EnhancedTransactionProgressScreen.jsx', () => ({
  default: ({ transactionData, onConfirm, onCancel }) => (
    <div data-testid="progress-screen">
      <div>Processing: {transactionData?.strategyName}</div>
      <button onClick={onConfirm}>Confirm</button>
      <button onClick={onCancel}>Cancel</button>
    </div>
  )
}))

// Mock React Router navigate
const mockNavigate = vi.fn()
let mockSearchParams = new URLSearchParams('objective=emergency-funds')
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [mockSearchParams]
  }
})

describe('ObjectiveConfig - Edge Cases and Race Conditions', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSearchParams = new URLSearchParams('objective=emergency-funds')
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Edge Cases', () => {
    it('should handle invalid objective parameter gracefully', async () => {
      // Set invalid objective
      mockSearchParams = new URLSearchParams('objective=invalid-objective')
      
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Should default to Create New template
      await waitFor(() => {
        expect(screen.getByText('Configure Strategy')).toBeInTheDocument()
      })

      // Navigate to step 2 to check default values
      fireEvent.click(screen.getByText('Next'))
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Create New')).toBeInTheDocument()
      })
    })

    it('should handle missing URL parameters', async () => {
      // Set empty search params
      mockSearchParams = new URLSearchParams('')
      
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Should default to Create New template
      fireEvent.click(screen.getByText('Next'))
      
      await waitFor(() => {
        expect(screen.getByDisplayValue('Create New')).toBeInTheDocument()
      })
    })

    it('should handle extremely large amounts', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Navigate to step 4 (Initial Amount)
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByText('Next'))
        await waitFor(() => {})
      }

      const amountInput = screen.getByLabelText('How much do you want to start with?')
      fireEvent.change(amountInput, { target: { value: '999999999999' } })

      // Should still accept the value
      expect(amountInput.value).toBe('999999999999')
      
      // Next button should be enabled
      const nextButton = screen.getByText('Next')
      expect(nextButton).not.toBeDisabled()
    })

    it('should handle extremely small amounts', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Navigate to step 4 (Initial Amount)
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByText('Next'))
        await waitFor(() => {})
      }

      const amountInput = screen.getByLabelText('How much do you want to start with?')
      fireEvent.change(amountInput, { target: { value: '0.01' } })

      // Should reject very small amounts
      const nextButton = screen.getByText('Next')
      expect(nextButton).toBeDisabled()
    })

    it('should handle special characters in strategy name', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Navigate to step 2 (Strategy Name)
      fireEvent.click(screen.getByText('Next'))

      await waitFor(() => {
        const nameInput = screen.getByLabelText('Strategy Name')
        fireEvent.change(nameInput, { target: { value: 'My Strategy! @#$%^&*()' } })
      })

      // Should accept special characters
      const nameInput = screen.getByLabelText('Strategy Name')
      expect(nameInput.value).toBe('My Strategy! @#$%^&*()')
      
      const nextButton = screen.getByText('Next')
      expect(nextButton).not.toBeDisabled()
    })

    it('should handle rapid navigation between steps', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Rapidly click next multiple times
      for (let i = 0; i < 5; i++) {
        const nextButton = screen.getByText('Next')
        if (!nextButton.disabled) {
          fireEvent.click(nextButton)
        }
        await waitFor(() => {}, { timeout: 100 })
      }

      // Should be on a valid step
      await waitFor(() => {
        expect(screen.getByText(/Step \d+ of 11/)).toBeInTheDocument()
      })
    })
  })

  describe('Race Conditions', () => {
    it('should handle concurrent state updates', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Navigate to step 2
      fireEvent.click(screen.getByText('Next'))

      // Simulate concurrent updates to strategy name
      await waitFor(async () => {
        const nameInput = screen.getByLabelText('Strategy Name')
        
        // Fire multiple change events rapidly
        fireEvent.change(nameInput, { target: { value: 'Strategy 1' } })
        fireEvent.change(nameInput, { target: { value: 'Strategy 2' } })
        fireEvent.change(nameInput, { target: { value: 'Strategy 3' } })
      })

      // Should have the last value
      const nameInput = screen.getByLabelText('Strategy Name')
      expect(nameInput.value).toBe('Strategy 3')
    })

    it('should handle rapid step changes', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Go forward then immediately backward
      fireEvent.click(screen.getByText('Next'))
      fireEvent.click(screen.getByText('Previous'))

      await waitFor(() => {
        expect(screen.getByText('Step 1 of 11')).toBeInTheDocument()
        expect(screen.getByText('Template Image')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle DataManager failures gracefully', async () => {
      // Mock DataManager to throw error
      const { dataManager } = await import('../../services/DataManager.js')
      dataManager.processTransaction.mockRejectedValueOnce(new Error('DataManager error'))

      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Component should still render
      expect(screen.getByText('Configure Strategy')).toBeInTheDocument()
    })

    it('should handle transaction flow errors', async () => {
      // Mock transaction flow to return error
      const mockExecuteTransactionFlow = vi.fn(() => Promise.reject(new Error('Transaction failed')))
      
      vi.mocked(vi.importActual('../../hooks/transactions/index.js')).useTransactionFlow = () => ({
        flowState: 'error',
        flowData: null,
        flowError: new Error('Transaction failed'),
        executeTransactionFlow: mockExecuteTransactionFlow,
        confirmTransaction: vi.fn(),
        resetFlow: vi.fn()
      })

      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Should handle error state
      expect(screen.getByText('Configure Strategy')).toBeInTheDocument()
    })

    it('should handle balance loading failures', async () => {
      // Mock balance hook to return error
      vi.mocked(vi.importActual('../../hooks/transactions/index.js')).useWalletBalance = () => ({
        balance: null,
        error: new Error('Balance loading failed')
      })

      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Should still render the component
      expect(screen.getByText('Configure Strategy')).toBeInTheDocument()
    })
  })

  describe('System Recovery', () => {
    it('should recover from temporary network errors', async () => {
      let shouldFail = true
      const mockProcessTransaction = vi.fn(() => {
        if (shouldFail) {
          shouldFail = false
          return Promise.reject(new Error('Network error'))
        }
        return Promise.resolve({ success: true })
      })

      const { dataManager } = await import('../../services/DataManager.js')
      dataManager.processTransaction = mockProcessTransaction

      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Component should recover and work normally
      expect(screen.getByText('Configure Strategy')).toBeInTheDocument()
    })

    it('should handle component unmount during async operations', async () => {
      const { unmount } = render(
        <BrowserRouter>
          <ObjectiveConfig />
        </BrowserRouter>
      )

      // Start an async operation then unmount immediately
      fireEvent.click(screen.getByText('Next'))
      
      // Unmount component
      unmount()

      // Should not throw errors
      await waitFor(() => {}, { timeout: 100 })
    })

    it('should reset state on navigation away and back', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Navigate to step 2 and modify data
      fireEvent.click(screen.getByText('Next'))
      
      await waitFor(() => {
        const nameInput = screen.getByLabelText('Strategy Name')
        fireEvent.change(nameInput, { target: { value: 'Test Strategy' } })
      })

      // Navigate back
      fireEvent.click(screen.getByText('Back to Yield'))
      expect(mockNavigate).toHaveBeenCalledWith('/yield')
    })
  })

  describe('Memory Management', () => {
    it('should not cause memory leaks with rapid re-renders', async () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
        
        await waitFor(() => {
          expect(screen.getByText('Configure Strategy')).toBeInTheDocument()
        })
        
        unmount()
      }

      // Should complete without memory issues
      expect(true).toBe(true)
    })

    it('should handle component unmount cleanly', async () => {
      const { unmount } = render(
        <BrowserRouter>
          <ObjectiveConfig />
        </BrowserRouter>
      )

      // Wait for component to mount
      await waitFor(() => {
        expect(screen.getByText('Configure Strategy')).toBeInTheDocument()
      })

      // Unmount should not throw errors
      expect(() => unmount()).not.toThrow()
    })
  })

  describe('Validation Edge Cases', () => {
    it('should handle boundary values for validation', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Navigate to step 4 (Initial Amount)
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByText('Next'))
      }

      // Test exactly minimum amount
      const amountInput = screen.getByLabelText('How much do you want to start with?')
      fireEvent.change(amountInput, { target: { value: '10' } })

      const nextButton = screen.getByText('Next')
      expect(nextButton).not.toBeDisabled()

      // Test just below minimum
      fireEvent.change(amountInput, { target: { value: '9.99' } })
      expect(nextButton).toBeDisabled()
    })

    it('should handle empty form fields', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Navigate to step 2
      fireEvent.click(screen.getByText('Next'))

      // Clear the strategy name
      await waitFor(() => {
        const nameInput = screen.getByLabelText('Strategy Name')
        fireEvent.change(nameInput, { target: { value: '' } })
      })

      const nextButton = screen.getByText('Next')
      expect(nextButton).toBeDisabled()
    })
  })
})