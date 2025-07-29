/**
 * Comprehensive Test Suite for TransactionForm Component
 * Tests all transaction types, validation, error handling, and user interactions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import TransactionForm from '../TransactionForm.jsx'
import { dataManager } from '../../services/DataManager.js'

// Mock dependencies
vi.mock('../../services/DataManager.js', () => ({
  dataManager: {
    getState: vi.fn(),
    getBalance: vi.fn(),
    subscribe: vi.fn(),
    updateBalance: vi.fn(),
    addTransaction: vi.fn(),
    processTransaction: vi.fn(),
    emit: vi.fn()
  }
}))

vi.mock('../../utils/userSettings.js', () => ({
  useUserSettings: () => ({
    advancedMode: false,
    setAdvancedMode: vi.fn()
  })
}))

vi.mock('../../services/onchain/OnChainTransactionManager.js', () => ({
  onChainTransactionManager: {
    createTransaction: vi.fn(),
    getTransactionStatus: vi.fn(),
    validateAddress: vi.fn()
  }
}))

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('TransactionForm Component', () => {
  let mockUser
  let mockBalance
  let mockOnTransactionComplete

  beforeEach(() => {
    mockUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      wallets: {
        solana: { address: 'test-sol-address' },
        ethereum: { address: 'test-eth-address' },
        bitcoin: { address: 'test-btc-address' }
      }
    }

    mockBalance = {
      availableForSpending: 1000,
      investedAmount: 500,
      totalUSD: 1500,
      assets: {
        BTC: { investedAmount: 200, currentValue: 210 },
        ETH: { investedAmount: 300, currentValue: 295 }
      }
    }

    mockOnTransactionComplete = vi.fn()

    dataManager.getBalance.mockReturnValue(mockBalance)
    dataManager.getState.mockReturnValue({
      balance: mockBalance,
      user: mockUser
    })
    dataManager.subscribe.mockReturnValue(() => {}) // unsubscribe function
    dataManager.processTransaction.mockResolvedValue({
      success: true,
      transactionId: 'tx_test_123'
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Form Rendering and Initialization', () => {
    it('should render ADD transaction form by default', () => {
      render(
        <TestWrapper>
          <TransactionForm />
        </TestWrapper>
      )

      expect(screen.getByText(/add money/i)).toBeInTheDocument()
      expect(screen.getByPlaceholderText(/enter amount/i)).toBeInTheDocument()
      expect(screen.getByText(/payment method/i)).toBeInTheDocument()
    })

    it('should render specific transaction type when provided', () => {
      render(
        <TestWrapper>
          <TransactionForm initialTransactionType="withdraw" />
        </TestWrapper>
      )

      expect(screen.getByText(/withdraw money/i)).toBeInTheDocument()
    })

    it('should display current balance information', () => {
      render(
        <TestWrapper>
          <TransactionForm />
        </TestWrapper>
      )

      expect(screen.getByText(/available.*\$1,000/i)).toBeInTheDocument()
    })

    it('should show all transaction type options', () => {
      render(
        <TestWrapper>
          <TransactionForm />
        </TestWrapper>
      )

      // Should have transaction type selector
      const typeButtons = screen.getAllByRole('button')
      const typeSelector = typeButtons.find(btn => 
        btn.textContent?.toLowerCase().includes('add') ||
        btn.textContent?.toLowerCase().includes('withdraw') ||
        btn.textContent?.toLowerCase().includes('send') ||
        btn.textContent?.toLowerCase().includes('buy') ||
        btn.textContent?.toLowerCase().includes('sell')
      )

      expect(typeSelector).toBeTruthy()
    })
  })

  describe('ADD Transaction Flow', () => {
    beforeEach(() => {
      render(
        <TestWrapper>
          <TransactionForm 
            initialTransactionType="add" 
            onTransactionComplete={mockOnTransactionComplete} 
          />
        </TestWrapper>
      )
    })

    it('should validate minimum amount for ADD transactions', async () => {
      const user = userEvent.setup()
      const amountInput = screen.getByPlaceholderText(/enter amount/i)

      await user.type(amountInput, '5')
      fireEvent.blur(amountInput)

      await waitFor(() => {
        expect(screen.getByText(/minimum.*\$10/i)).toBeInTheDocument()
      })
    })

    it('should show payment method options for ADD', async () => {
      expect(screen.getByText(/credit.*card/i)).toBeInTheDocument()
      expect(screen.getByText(/bank.*account/i)).toBeInTheDocument()
      expect(screen.getByText(/apple.*pay/i)).toBeInTheDocument()
      expect(screen.getByText(/google.*pay/i)).toBeInTheDocument()
    })

    it('should calculate and display fees correctly', async () => {
      const user = userEvent.setup()
      const amountInput = screen.getByPlaceholderText(/enter amount/i)

      await user.type(amountInput, '100')
      fireEvent.blur(amountInput)

      await waitFor(() => {
        // Should show diBoaS fee (0.09%) and payment method fee
        expect(screen.getByText(/fee/i)).toBeInTheDocument()
      })
    })

    it('should process ADD transaction successfully', async () => {
      const user = userEvent.setup()
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      const submitButton = screen.getByRole('button', { name: /add money/i })

      await user.type(amountInput, '100')
      await user.click(submitButton)

      await waitFor(() => {
        expect(dataManager.processTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'add',
            amount: 100
          })
        )
      })
    })
  })

  describe('WITHDRAW Transaction Flow', () => {
    beforeEach(() => {
      render(
        <TestWrapper>
          <TransactionForm 
            initialTransactionType="withdraw" 
            onTransactionComplete={mockOnTransactionComplete} 
          />
        </TestWrapper>
      )
    })

    it('should validate minimum amount for WITHDRAW transactions', async () => {
      const user = userEvent.setup()
      const amountInput = screen.getByPlaceholderText(/enter amount/i)

      await user.type(amountInput, '3')
      fireEvent.blur(amountInput)

      await waitFor(() => {
        expect(screen.getByText(/minimum.*\$5/i)).toBeInTheDocument()
      })
    })

    it('should validate sufficient balance for WITHDRAW', async () => {
      const user = userEvent.setup()
      const amountInput = screen.getByPlaceholderText(/enter amount/i)

      await user.type(amountInput, '1500') // More than available balance
      fireEvent.blur(amountInput)

      await waitFor(() => {
        expect(screen.getByText(/insufficient.*balance/i)).toBeInTheDocument()
      })
    })

    it('should show output method options for WITHDRAW', () => {
      expect(screen.getByText(/bank.*account/i)).toBeInTheDocument()
      expect(screen.getByText(/paypal/i)).toBeInTheDocument()
    })

    it('should calculate higher fees for WITHDRAW (0.9%)', async () => {
      const user = userEvent.setup()
      const amountInput = screen.getByPlaceholderText(/enter amount/i)

      await user.type(amountInput, '100')
      fireEvent.blur(amountInput)

      await waitFor(() => {
        // Should show 0.9% diBoaS fee
        expect(screen.getByText(/0\.9%/i)).toBeInTheDocument()
      })
    })
  })

  describe('BUY Transaction Flow', () => {
    beforeEach(() => {
      render(
        <TestWrapper>
          <TransactionForm 
            initialTransactionType="buy" 
            onTransactionComplete={mockOnTransactionComplete} 
          />
        </TestWrapper>
      )
    })

    it('should show asset selection for BUY transactions', () => {
      expect(screen.getByText(/select.*asset/i)).toBeInTheDocument()
      expect(screen.getByText('BTC')).toBeInTheDocument()
      expect(screen.getByText('ETH')).toBeInTheDocument()
      expect(screen.getByText('SOL')).toBeInTheDocument()
    })

    it('should show payment method options including diBoaS wallet', () => {
      expect(screen.getByText(/diboas.*wallet/i)).toBeInTheDocument()
      expect(screen.getByText(/credit.*card/i)).toBeInTheDocument()
    })

    it('should validate diBoaS wallet balance for internal payments', async () => {
      const user = userEvent.setup()
      
      // Select diBoaS wallet payment method
      await user.click(screen.getByText(/diboas.*wallet/i))
      
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      await user.type(amountInput, '1200') // More than available balance

      fireEvent.blur(amountInput)

      await waitFor(() => {
        expect(screen.getByText(/insufficient.*balance/i)).toBeInTheDocument()
      })
    })

    it('should not validate balance for external payment methods', async () => {
      const user = userEvent.setup()
      
      // Select external payment method
      await user.click(screen.getByText(/credit.*card/i))
      
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      await user.type(amountInput, '5000') // Amount higher than wallet balance

      fireEvent.blur(amountInput)

      await waitFor(() => {
        expect(screen.queryByText(/insufficient.*balance/i)).not.toBeInTheDocument()
      })
    })
  })

  describe('SELL Transaction Flow', () => {
    beforeEach(() => {
      render(
        <TestWrapper>
          <TransactionForm 
            initialTransactionType="sell" 
            onTransactionComplete={mockOnTransactionComplete} 
          />
        </TestWrapper>
      )
    })

    it('should show only owned assets for SELL transactions', () => {
      expect(screen.getByText('BTC')).toBeInTheDocument()
      expect(screen.getByText('ETH')).toBeInTheDocument()
      // Should not show assets not owned
      expect(screen.queryByText('SOL')).not.toBeInTheDocument()
    })

    it('should validate asset balance for SELL transactions', async () => {
      const user = userEvent.setup()
      
      // Select BTC
      await user.click(screen.getByText('BTC'))
      
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      await user.type(amountInput, '300') // More than BTC invested amount (200)

      fireEvent.blur(amountInput)

      await waitFor(() => {
        expect(screen.getByText(/insufficient.*BTC/i)).toBeInTheDocument()
      })
    })

    it('should show net proceeds after fees', async () => {
      const user = userEvent.setup()
      
      await user.click(screen.getByText('BTC'))
      
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      await user.type(amountInput, '100')

      fireEvent.blur(amountInput)

      await waitFor(() => {
        expect(screen.getByText(/you.*receive/i)).toBeInTheDocument()
      })
    })
  })

  describe('SEND Transaction Flow', () => {
    beforeEach(() => {
      render(
        <TestWrapper>
          <TransactionForm 
            initialTransactionType="send" 
            onTransactionComplete={mockOnTransactionComplete} 
          />
        </TestWrapper>
      )
    })

    it('should require recipient information for SEND', () => {
      expect(screen.getByPlaceholderText(/recipient.*address/i)).toBeInTheDocument()
    })

    it('should validate recipient address format', async () => {
      const user = userEvent.setup()
      const recipientInput = screen.getByPlaceholderText(/recipient.*address/i)

      await user.type(recipientInput, 'invalid-address')
      fireEvent.blur(recipientInput)

      await waitFor(() => {
        expect(screen.getByText(/invalid.*address/i)).toBeInTheDocument()
      })
    })

    it('should validate sufficient balance for SEND', async () => {
      const user = userEvent.setup()
      const amountInput = screen.getByPlaceholderText(/enter amount/i)

      await user.type(amountInput, '1200') // More than available balance
      fireEvent.blur(amountInput)

      await waitFor(() => {
        expect(screen.getByText(/insufficient.*balance/i)).toBeInTheDocument()
      })
    })
  })

  describe('Fee Calculations', () => {
    it('should calculate ADD fees correctly (0.09% + payment method)', async () => {
      render(
        <TestWrapper>
          <TransactionForm initialTransactionType="add" />
        </TestWrapper>
      )

      const user = userEvent.setup()
      const amountInput = screen.getByPlaceholderText(/enter amount/i)

      await user.type(amountInput, '1000')
      fireEvent.blur(amountInput)

      await waitFor(() => {
        // Should show 0.09% + payment method fee
        expect(screen.getByText(/\$0\.90/)).toBeInTheDocument() // 0.09% of 1000
      })
    })

    it('should calculate WITHDRAW fees correctly (0.9% + payment method)', async () => {
      render(
        <TestWrapper>
          <TransactionForm initialTransactionType="withdraw" />
        </TestWrapper>
      )

      const user = userEvent.setup()
      const amountInput = screen.getByPlaceholderText(/enter amount/i)

      await user.type(amountInput, '100')
      fireEvent.blur(amountInput)

      await waitFor(() => {
        // Should show 0.9% + payment method fee
        expect(screen.getByText(/\$0\.90/)).toBeInTheDocument() // 0.9% of 100
      })
    })

    it('should show fee breakdown for complex transactions', async () => {
      render(
        <TestWrapper>
          <TransactionForm initialTransactionType="buy" />
        </TestWrapper>
      )

      const user = userEvent.setup()
      await user.click(screen.getByText(/credit.*card/i))
      
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      await user.type(amountInput, '200')
      fireEvent.blur(amountInput)

      await waitFor(() => {
        expect(screen.getByText(/diboas.*fee/i)).toBeInTheDocument()
        expect(screen.getByText(/network.*fee/i)).toBeInTheDocument()
        expect(screen.getByText(/provider.*fee/i)).toBeInTheDocument()
      })
    })
  })

  describe('Form Validation', () => {
    it('should prevent submission with invalid data', async () => {
      render(
        <TestWrapper>
          <TransactionForm 
            initialTransactionType="add"
            onTransactionComplete={mockOnTransactionComplete} 
          />
        </TestWrapper>
      )

      const user = userEvent.setup()
      const submitButton = screen.getByRole('button', { name: /add money/i })

      // Try to submit without amount
      await user.click(submitButton)

      expect(mockOnTransactionComplete).not.toHaveBeenCalled()
      expect(dataManager.processTransaction).not.toHaveBeenCalled()
    })

    it('should show validation errors for required fields', async () => {
      render(
        <TestWrapper>
          <TransactionForm initialTransactionType="send" />
        </TestWrapper>
      )

      const user = userEvent.setup()
      const submitButton = screen.getByRole('button', { name: /send/i })

      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/amount.*required/i)).toBeInTheDocument()
        expect(screen.getByText(/recipient.*required/i)).toBeInTheDocument()
      })
    })

    it('should validate amount format (numbers only)', async () => {
      render(
        <TestWrapper>
          <TransactionForm />
        </TestWrapper>
      )

      const user = userEvent.setup()
      const amountInput = screen.getByPlaceholderText(/enter amount/i)

      await user.type(amountInput, 'abc123')
      fireEvent.blur(amountInput)

      await waitFor(() => {
        expect(screen.getByText(/invalid.*amount/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle transaction processing errors gracefully', async () => {
      dataManager.processTransaction.mockRejectedValueOnce(
        new Error('Network error')
      )

      render(
        <TestWrapper>
          <TransactionForm 
            initialTransactionType="add"
            onTransactionComplete={mockOnTransactionComplete} 
          />
        </TestWrapper>
      )

      const user = userEvent.setup()
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      const submitButton = screen.getByRole('button', { name: /add money/i })

      await user.type(amountInput, '100')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/transaction.*failed/i)).toBeInTheDocument()
      })
    })

    it('should retry failed transactions', async () => {
      dataManager.processTransaction
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce({ success: true, transactionId: 'tx_retry_123' })

      render(
        <TestWrapper>
          <TransactionForm 
            initialTransactionType="add"
            onTransactionComplete={mockOnTransactionComplete} 
          />
        </TestWrapper>
      )

      const user = userEvent.setup()
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      const submitButton = screen.getByRole('button', { name: /add money/i })

      await user.type(amountInput, '100')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/transaction.*failed/i)).toBeInTheDocument()
      })

      const retryButton = screen.getByRole('button', { name: /retry/i })
      await user.click(retryButton)

      await waitFor(() => {
        expect(mockOnTransactionComplete).toHaveBeenCalledWith(
          expect.objectContaining({ transactionId: 'tx_retry_123' })
        )
      })
    })

    it('should handle network timeout gracefully', async () => {
      const timeoutError = new Error('Request timeout')
      timeoutError.code = 'TIMEOUT'
      
      dataManager.processTransaction.mockRejectedValueOnce(timeoutError)

      render(
        <TestWrapper>
          <TransactionForm 
            initialTransactionType="add"
            onTransactionComplete={mockOnTransactionComplete} 
          />
        </TestWrapper>
      )

      const user = userEvent.setup()
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      const submitButton = screen.getByRole('button', { name: /add money/i })

      await user.type(amountInput, '100')
      await user.click(submitButton)

      await waitFor(() => {
        expect(screen.getByText(/network.*timeout/i)).toBeInTheDocument()
      })
    })
  })

  describe('User Experience', () => {
    it('should show loading state during transaction processing', async () => {
      let resolveTransaction
      const transactionPromise = new Promise(resolve => {
        resolveTransaction = resolve
      })
      
      dataManager.processTransaction.mockReturnValueOnce(transactionPromise)

      render(
        <TestWrapper>
          <TransactionForm 
            initialTransactionType="add"
            onTransactionComplete={mockOnTransactionComplete} 
          />
        </TestWrapper>
      )

      const user = userEvent.setup()
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      const submitButton = screen.getByRole('button', { name: /add money/i })

      await user.type(amountInput, '100')
      await user.click(submitButton)

      expect(screen.getByText(/processing/i)).toBeInTheDocument()
      expect(submitButton).toBeDisabled()

      resolveTransaction({ success: true, transactionId: 'tx_loading_test' })

      await waitFor(() => {
        expect(screen.queryByText(/processing/i)).not.toBeInTheDocument()
      })
    })

    it('should provide helpful tooltips for complex fields', () => {
      render(
        <TestWrapper>
          <TransactionForm initialTransactionType="buy" />
        </TestWrapper>
      )

      expect(screen.getByText(/asset.*tooltip/i)).toBeInTheDocument()
      expect(screen.getByText(/payment.*method.*tooltip/i)).toBeInTheDocument()
    })

    it('should show transaction preview before confirmation', async () => {
      render(
        <TestWrapper>
          <TransactionForm initialTransactionType="add" />
        </TestWrapper>
      )

      const user = userEvent.setup()
      const amountInput = screen.getByPlaceholderText(/enter amount/i)

      await user.type(amountInput, '100')
      fireEvent.blur(amountInput)

      await waitFor(() => {
        expect(screen.getByText(/preview/i)).toBeInTheDocument()
        expect(screen.getByText(/\$100/)).toBeInTheDocument()
      })
    })

    it('should clear form after successful transaction', async () => {
      render(
        <TestWrapper>
          <TransactionForm 
            initialTransactionType="add"
            onTransactionComplete={mockOnTransactionComplete} 
          />
        </TestWrapper>
      )

      const user = userEvent.setup()
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      const submitButton = screen.getByRole('button', { name: /add money/i })

      await user.type(amountInput, '100')
      await user.click(submitButton)

      await waitFor(() => {
        expect(mockOnTransactionComplete).toHaveBeenCalled()
        expect(amountInput).toHaveValue('')
      })
    })
  })

  describe('Advanced Mode Features', () => {
    it('should show additional details in advanced mode', async () => {
      const mockAdvancedSettings = {
        advancedMode: true,
        setAdvancedMode: vi.fn()
      }

      vi.mocked(require('../../utils/userSettings.js').useUserSettings)
        .mockReturnValueOnce(mockAdvancedSettings)

      render(
        <TestWrapper>
          <TransactionForm initialTransactionType="buy" />
        </TestWrapper>
      )

      expect(screen.getByText(/gas.*fee/i)).toBeInTheDocument()
      expect(screen.getByText(/slippage/i)).toBeInTheDocument()
    })

    it('should allow manual fee adjustment in advanced mode', async () => {
      const mockAdvancedSettings = {
        advancedMode: true,
        setAdvancedMode: vi.fn()
      }

      vi.mocked(require('../../utils/userSettings.js').useUserSettings)
        .mockReturnValueOnce(mockAdvancedSettings)

      render(
        <TestWrapper>
          <TransactionForm initialTransactionType="send" />
        </TestWrapper>
      )

      const user = userEvent.setup()
      const customFeeInput = screen.getByPlaceholderText(/custom.*fee/i)

      await user.type(customFeeInput, '0.001')
      fireEvent.blur(customFeeInput)

      expect(customFeeInput).toHaveValue('0.001')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <TransactionForm />
        </TestWrapper>
      )

      expect(screen.getByRole('form')).toBeInTheDocument()
      expect(screen.getByLabelText(/amount/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/payment.*method/i)).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <TransactionForm />
        </TestWrapper>
      )

      const user = userEvent.setup()
      const amountInput = screen.getByPlaceholderText(/enter amount/i)

      await user.tab()
      expect(document.activeElement).toBe(amountInput)

      await user.tab()
      // Should focus on next interactive element
      expect(document.activeElement).not.toBe(amountInput)
    })

    it('should announce validation errors to screen readers', async () => {
      render(
        <TestWrapper>
          <TransactionForm />
        </TestWrapper>
      )

      const user = userEvent.setup()
      const amountInput = screen.getByPlaceholderText(/enter amount/i)

      await user.type(amountInput, '5') // Below minimum
      fireEvent.blur(amountInput)

      await waitFor(() => {
        const errorElement = screen.getByText(/minimum.*\$10/i)
        expect(errorElement).toHaveAttribute('role', 'alert')
      })
    })
  })
})