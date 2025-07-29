/**
 * Integration tests for TransactionProgressScreen with enhanced error handling
 * Verifies all transaction flows work properly after TransactionErrorHandler integration
 */

import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import TransactionProgressScreen from '../shared/TransactionProgressScreen.jsx'
import { TRANSACTION_STATUS } from '../../services/transactions/TransactionStatusService.js'

// Mock navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock transaction status hook
const mockUseTransactionProgress = vi.fn()
vi.mock('../../hooks/useTransactionStatus.js', () => ({
  useTransactionProgress: mockUseTransactionProgress
}))

describe('TransactionProgressScreen Integration Tests', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    mockUseTransactionProgress.mockReturnValue({
      status: null,
      isLoading: false,
      error: null,
      progress: 0,
      progressText: '',
      progressColor: '',
      timeRemaining: null,
      onChainHash: null,
      confirmations: 0,
      requiredConfirmations: 1
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderComponent = (props = {}) => {
    const defaultProps = {
      transactionData: {
        type: 'add',
        amount: 100,
        paymentMethod: 'credit_debit_card'
      },
      currentStep: 'Processing payment',
      isCompleted: false,
      isError: false,
      errorMessage: '',
      fees: { total: 0.59 },
      onConfirm: vi.fn(),
      onCancel: vi.fn(),
      flowState: 'processing',
      flowError: null,
      ...props
    }

    return render(
      <BrowserRouter>
        <TransactionProgressScreen {...defaultProps} />
      </BrowserRouter>
    )
  }

  describe('Success Flow Integration', () => {
    it('should display success screen when transaction completes', async () => {
      renderComponent({ 
        isCompleted: true,
        flowState: 'completed'
      })

      expect(screen.getByText(/Deposit Successful!/i)).toBeInTheDocument()
      expect(screen.getByText(/Your deposit has been completed successfully/i)).toBeInTheDocument()
      
      // Check success elements are present
      const successIcon = document.querySelector('.lucide-check-circle')
      expect(successIcon).toBeInTheDocument()
      
      const dashboardButton = screen.getByText('Back to Dashboard')
      expect(dashboardButton).toBeInTheDocument()
    })

    it('should preserve all success screen functionality', async () => {
      renderComponent({ 
        isCompleted: true,
        flowState: 'completed',
        transactionData: {
          type: 'withdraw',
          amount: 250,
          paymentMethod: 'bank_account'
        }
      })

      expect(screen.getByText('Withdrawal Successful!')).toBeInTheDocument()
      
      // Navigate to dashboard should work
      const dashboardButton = screen.getByText('Back to Dashboard')
      fireEvent.click(dashboardButton)
      expect(mockNavigate).toHaveBeenCalledWith('/app')
    })

    it('should display correct transaction summary in success screen', async () => {
      const transactionData = {
        type: 'send',
        amount: 75.50,
        recipient: 'user@example.com'
      }

      renderComponent({ 
        isCompleted: true,
        flowState: 'completed',
        transactionData,
        fees: { total: 1.25 }
      })

      expect(screen.getByText('$75.5')).toBeInTheDocument()
      expect(screen.getByText('$1.25')).toBeInTheDocument()
    })
  })

  describe('Confirmation Flow Integration', () => {
    it('should display confirmation screen correctly', async () => {
      const mockOnConfirm = vi.fn()
      const mockOnCancel = vi.fn()

      renderComponent({ 
        flowState: 'confirming',
        onConfirm: mockOnConfirm,
        onCancel: mockOnCancel
      })

      expect(screen.getByText('Confirm Deposit')).toBeInTheDocument()
      expect(screen.getByText(/Please review and confirm your transaction details/i)).toBeInTheDocument()
      
      // Check confirmation elements
      const confirmButton = screen.getByText('Confirm Transaction')
      expect(confirmButton).toBeInTheDocument()
      
      const cancelButton = screen.getByText('Cancel')
      expect(cancelButton).toBeInTheDocument()
      
      // Test button functionality
      fireEvent.click(confirmButton)
      expect(mockOnConfirm).toHaveBeenCalledTimes(1)
      
      fireEvent.click(cancelButton)
      expect(mockOnCancel).toHaveBeenCalledTimes(1)
    })

    it('should preserve confirmation screen transaction details', async () => {
      const transactionData = {
        type: 'buy',
        amount: 500,
        asset: 'BTC',
        paymentMethod: 'diboas_wallet'
      }

      renderComponent({ 
        flowState: 'confirming',
        transactionData,
        fees: { total: 1.00 }
      })

      expect(screen.getByText('$500')).toBeInTheDocument()
      expect(screen.getByText('$1.00')).toBeInTheDocument()
    })
  })

  describe('Progress Flow Integration', () => {
    it('should display progress screen during processing', async () => {
      renderComponent({ 
        flowState: 'processing',
        currentStep: 'Validating payment method'
      })

      expect(screen.getByText('Processing Deposit')).toBeInTheDocument()
      expect(screen.getByText(/Your transaction is being processed/i)).toBeInTheDocument()
      
      // Check progress elements
      const progressSteps = screen.getByText(/Step \d+ of \d+/i)
      expect(progressSteps).toBeInTheDocument()
    })

    it('should update progress steps correctly', async () => {
      const { rerender } = renderComponent({ 
        flowState: 'processing',
        currentStep: 'Validating payment method'
      })

      expect(screen.getByText(/Validating payment method/i)).toBeInTheDocument()

      // Update to next step
      rerender(
        <BrowserRouter>
          <TransactionProgressScreen 
            transactionData={{ type: 'add', amount: 100 }}
            flowState="processing"
            currentStep="Processing payment"
            onConfirm={vi.fn()}
            onCancel={vi.fn()}
          />
        </BrowserRouter>
      )

      expect(screen.getByText(/Processing payment/i)).toBeInTheDocument()
    })

    it('should handle real-time status updates', async () => {
      mockUseTransactionProgress.mockReturnValue({
        status: { status: TRANSACTION_STATUS.PROCESSING },
        progress: 0.5,
        progressText: 'Broadcasting to network...',
        progressColor: 'text-blue-600',
        onChainHash: 'abc123',
        confirmations: 1,
        requiredConfirmations: 3
      })

      renderComponent({ 
        transactionId: 'tx_123',
        flowState: 'pending_blockchain'
      })

      expect(screen.getByText(/Broadcasting to network/i)).toBeInTheDocument()
      expect(screen.getByText(/1 of 3 confirmations/i)).toBeInTheDocument()
    })
  })

  describe('Enhanced Error Flow Integration', () => {
    it('should use TransactionErrorHandler for error display', async () => {
      const error = new Error('Payment declined by bank')
      
      renderComponent({ 
        isError: true,
        flowError: error,
        flowState: 'error'
      })

      // Should show enhanced error screen
      expect(screen.getByText('Your Funds Are Safe')).toBeInTheDocument()
      expect(screen.getByText('Payment Method Declined')).toBeInTheDocument()
      expect(screen.getByText(/Your bank or payment provider declined the transaction/i)).toBeInTheDocument()
    })

    it('should provide transaction context in error screen', async () => {
      const error = new Error('Network timeout')
      const transactionData = {
        type: 'withdraw',
        amount: 200,
        paymentMethod: 'external_wallet'
      }

      renderComponent({ 
        isError: true,
        flowError: error,
        flowState: 'error',
        transactionData,
        currentStep: 'Processing withdrawal'
      })

      // Check transaction details are shown
      expect(screen.getByText('Transaction Details')).toBeInTheDocument()
      expect(screen.getByText('Withdraw')).toBeInTheDocument()
      expect(screen.getByText('$200')).toBeInTheDocument()
      expect(screen.getByText('Processing withdrawal')).toBeInTheDocument()
    })

    it('should handle error recovery actions', async () => {
      const mockOnCancel = vi.fn()
      const error = new Error('Server error')

      renderComponent({ 
        isError: true,
        flowError: error,
        flowState: 'error',
        onCancel: mockOnCancel
      })

      // Test retry functionality
      const tryAgainButton = screen.getByText('Try Again')
      fireEvent.click(tryAgainButton)
      
      expect(mockOnCancel).toHaveBeenCalledTimes(1)
      expect(mockNavigate).toHaveBeenCalledWith(-1)
    })

    it('should handle different error types correctly', async () => {
      const errorTypes = [
        { error: new Error('Network connection failed'), expectedTitle: 'Network Connection Error' },
        { error: new Error('Insufficient funds'), expectedTitle: 'Insufficient Funds' },
        { error: new Error('Transaction timeout'), expectedTitle: 'Transaction Timeout' },
        { error: new Error('Internal server error'), expectedTitle: 'Server Error' }
      ]

      for (const { error, expectedTitle } of errorTypes) {
        const { unmount } = renderComponent({ 
          isError: true,
          flowError: error,
          flowState: 'error'
        })

        expect(screen.getByText(expectedTitle)).toBeInTheDocument()
        unmount()
      }
    })
  })

  describe('Edge Cases and System Recovery', () => {
    it('should handle null/undefined error gracefully', async () => {
      renderComponent({ 
        isError: true,
        flowError: null,
        flowState: 'error'
      })

      // Should still show error screen with fallback message
      expect(screen.getByText('Your Funds Are Safe')).toBeInTheDocument()
      expect(screen.getByText('Unexpected Error')).toBeInTheDocument()
    })

    it('should handle empty transaction data', async () => {
      renderComponent({ 
        isError: true,
        flowError: new Error('Test error'),
        flowState: 'error',
        transactionData: null
      })

      // Should not crash and still show error handler
      expect(screen.getByText('Your Funds Are Safe')).toBeInTheDocument()
    })

    it('should handle missing step information', async () => {
      renderComponent({ 
        isError: true,
        flowError: new Error('Test error'),
        flowState: 'error',
        currentStep: null
      })

      // Should fallback to generic step name
      expect(screen.getByText('Your Funds Are Safe')).toBeInTheDocument()
    })

    it('should handle real-time status errors', async () => {
      mockUseTransactionProgress.mockReturnValue({
        status: { status: TRANSACTION_STATUS.FAILED },
        error: new Error('Blockchain network error'),
        progress: 0.8
      })

      renderComponent({ 
        transactionId: 'tx_456',
        flowState: 'pending_blockchain'
      })

      // Should show enhanced error for real-time failures
      expect(screen.getByText('Your Funds Are Safe')).toBeInTheDocument()
      expect(screen.getByText('Blockchain Network Error')).toBeInTheDocument()
    })

    it('should handle timeout status correctly', async () => {
      mockUseTransactionProgress.mockReturnValue({
        status: { status: TRANSACTION_STATUS.TIMEOUT },
        error: new Error('Transaction timed out')
      })

      renderComponent({ 
        transactionId: 'tx_789',
        flowState: 'pending_blockchain'
      })

      expect(screen.getByText('Transaction Timeout')).toBeInTheDocument()
    })

    it('should preserve navigation after error recovery', async () => {
      const error = new Error('Network error')

      renderComponent({ 
        isError: true,
        flowError: error,
        flowState: 'error'
      })

      // Test dashboard navigation
      const dashboardButton = screen.getByText('Dashboard')
      fireEvent.click(dashboardButton)
      expect(mockNavigate).toHaveBeenCalledWith('/app')
    })
  })

  describe('State Management and Flow Transitions', () => {
    it('should transition between states correctly', async () => {
      const { rerender } = renderComponent({ 
        flowState: 'processing',
        isCompleted: false,
        isError: false
      })

      expect(screen.getByText('Processing Deposit')).toBeInTheDocument()

      // Transition to confirmation
      rerender(
        <BrowserRouter>
          <TransactionProgressScreen 
            transactionData={{ type: 'add', amount: 100 }}
            flowState="confirming"
            onConfirm={vi.fn()}
            onCancel={vi.fn()}
          />
        </BrowserRouter>
      )

      expect(screen.getByText('Confirm Deposit')).toBeInTheDocument()

      // Transition to completion
      rerender(
        <BrowserRouter>
          <TransactionProgressScreen 
            transactionData={{ type: 'add', amount: 100 }}
            flowState="completed"
            isCompleted={true}
            onConfirm={vi.fn()}
            onCancel={vi.fn()}
          />
        </BrowserRouter>
      )

      expect(screen.getByText('Deposit Successful!')).toBeInTheDocument()
    })

    it('should handle simultaneous state changes', async () => {
      const { rerender } = renderComponent({ 
        flowState: 'processing',
        isCompleted: false,
        isError: false
      })

      // Rapidly change to error state
      act(() => {
        rerender(
          <BrowserRouter>
            <TransactionProgressScreen 
              transactionData={{ type: 'add', amount: 100 }}
              flowState="error"
              isError={true}
              flowError={new Error('Rapid state change')}
              onConfirm={vi.fn()}
              onCancel={vi.fn()}
            />
          </BrowserRouter>
        )
      })

      expect(screen.getByText('Your Funds Are Safe')).toBeInTheDocument()
    })
  })

  describe('All Transaction Types Support', () => {
    const transactionTypes = [
      { type: 'add', expectedTitle: 'Processing Deposit' },
      { type: 'withdraw', expectedTitle: 'Processing Withdrawal' },
      { type: 'send', expectedTitle: 'Processing Send Money' },
      { type: 'buy', expectedTitle: 'Processing Buy' },
      { type: 'sell', expectedTitle: 'Processing Sell' }
    ]

    transactionTypes.forEach(({ type, expectedTitle }) => {
      it(`should handle ${type} transaction type correctly`, async () => {
        renderComponent({ 
          transactionData: { type, amount: 100 },
          flowState: 'processing'
        })

        expect(screen.getByText(expectedTitle)).toBeInTheDocument()
      })

      it(`should handle ${type} transaction errors correctly`, async () => {
        const error = new Error(`${type} transaction failed`)
        
        renderComponent({ 
          transactionData: { type, amount: 100 },
          flowState: 'error',
          isError: true,
          flowError: error
        })

        expect(screen.getByText('Your Funds Are Safe')).toBeInTheDocument()
        expect(screen.getByText(type.charAt(0).toUpperCase() + type.slice(1))).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility and User Experience', () => {
    it('should maintain accessibility standards in all flows', async () => {
      // Test progress flow accessibility
      renderComponent({ flowState: 'processing' })
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()

      // Test error flow accessibility  
      const { rerender } = renderComponent()
      rerender(
        <BrowserRouter>
          <TransactionProgressScreen 
            transactionData={{ type: 'add', amount: 100 }}
            flowState="error"
            isError={true}
            flowError={new Error('Test error')}
            onConfirm={vi.fn()}
            onCancel={vi.fn()}
          />
        </BrowserRouter>
      )

      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should preserve proper focus management', async () => {
      renderComponent({ 
        isError: true,
        flowError: new Error('Focus test'),
        flowState: 'error'
      })

      const tryAgainButton = screen.getByText('Try Again')
      expect(tryAgainButton).toBeInTheDocument()
      expect(tryAgainButton.tabIndex).not.toBe(-1)
    })
  })
})