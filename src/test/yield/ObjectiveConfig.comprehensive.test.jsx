/**
 * Comprehensive Test Suite for ObjectiveConfig Component
 * Tests streamlined 5-step flow, payment validation, fees, and edge cases
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import ObjectiveConfig from '../../components/yield/ObjectiveConfig.jsx'
import { dataManager } from '../../services/DataManager.js'

// Mock dependencies
vi.mock('../../services/DataManager.js', () => ({
  dataManager: {
    getBalance: vi.fn(),
    getFinObjectives: vi.fn(),
    getRiskLevels: vi.fn(),
    emit: vi.fn(),
    subscribe: vi.fn()
  }
}))

// Mock hooks
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('?objective=emergency-funds')]
  }
})

// Mock transaction hooks
const mockExecuteTransactionFlow = vi.fn()
const mockConfirmTransaction = vi.fn()
const mockResetFlow = vi.fn()

vi.mock('../../hooks/transactions/index.js', () => ({
  useWalletBalance: () => ({
    balance: {
      availableForSpending: 5000,
      totalBalance: 10000,
      lockedInStrategies: 5000
    }
  }),
  useTransactionFlow: () => ({
    flowState: 'idle',
    flowData: null,
    flowError: null,
    executeTransactionFlow: mockExecuteTransactionFlow,
    confirmTransaction: mockConfirmTransaction,
    resetFlow: mockResetFlow
  })
}))

// Test utilities
const renderWithRouter = (component, initialRoute = '/yield/configure?objective=emergency-funds') => {
  return render(
    <MemoryRouter initialEntries={[initialRoute]}>
      {component}
    </MemoryRouter>
  )
}

describe('ObjectiveConfig - Comprehensive Test Suite', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    
    // Mock console to avoid noise
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Initialization', () => {
    it('should render with correct initial state', () => {
      renderWithRouter(<ObjectiveConfig />)
      
      // Check step 1 is displayed
      expect(screen.getByText('Strategy Basics')).toBeInTheDocument()
      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument()
      
      // Check initial form fields
      expect(screen.getByLabelText('Strategy Name')).toHaveValue('Emergency Funds')
      expect(screen.getByText('When do you want to use this money?')).toBeInTheDocument()
    })

    it('should handle missing objective parameter gracefully', () => {
      render(
        <MemoryRouter initialEntries={['/yield/configure']}>
          <ObjectiveConfig />
        </MemoryRouter>
      )
      
      // Should default to 'create-new' template
      expect(screen.getByLabelText('Strategy Name')).toHaveValue('Create New')
    })
  })

  describe('Step 1: Strategy Basics', () => {
    it('should validate strategy name length', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      const nameInput = screen.getByLabelText('Strategy Name')
      await user.clear(nameInput)
      await user.type(nameInput, 'AB')
      
      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()
      
      await user.type(nameInput, 'C')
      expect(nextButton).toBeEnabled()
    })

    it('should require timeline selection', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      // Timeline should already be selected from template
      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeEnabled()
      
      // Test timeline selection
      const timeline6Months = screen.getByText('Up to 6 months')
      await user.click(timeline6Months)
      
      const selectedCard = timeline6Months.closest('[class*="border-blue-500"]')
      expect(selectedCard).toBeInTheDocument()
    })

    it('should toggle advanced options for custom image', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      expect(screen.queryByText('Upload custom image')).not.toBeInTheDocument()
      
      const advancedToggle = screen.getByText(/show advanced options/i)
      await user.click(advancedToggle)
      
      expect(screen.getByText('Upload custom image')).toBeInTheDocument()
    })
  })

  describe('Step 2: Investment Parameters', () => {
    it('should validate initial amount minimum', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      // Go to step 2
      await user.click(screen.getByRole('button', { name: /next/i }))
      
      const amountInput = screen.getByLabelText('Initial Investment')
      await user.clear(amountInput)
      await user.type(amountInput, '5')
      
      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()
      
      await user.clear(amountInput)
      await user.type(amountInput, '10')
      expect(nextButton).toBeEnabled()
    })

    it('should handle recurring contributions toggle', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      await user.click(screen.getByRole('button', { name: /next/i }))
      
      const recurringCheckbox = screen.getByRole('checkbox')
      expect(recurringCheckbox).not.toBeChecked()
      
      await user.click(recurringCheckbox)
      expect(recurringCheckbox).toBeChecked()
      
      // Should show recurring options
      expect(screen.getByLabelText('Frequency')).toBeInTheDocument()
      expect(screen.getByLabelText('Amount')).toBeInTheDocument()
    })

    it('should validate recurring amount when enabled', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      await user.click(screen.getByRole('button', { name: /next/i }))
      
      const recurringCheckbox = screen.getByRole('checkbox')
      await user.click(recurringCheckbox)
      
      const recurringAmount = screen.getByLabelText('Amount')
      await user.type(recurringAmount, '5')
      
      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()
      
      await user.clear(recurringAmount)
      await user.type(recurringAmount, '10')
      expect(nextButton).toBeEnabled()
    })

    it('should show quick amount buttons', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      await user.click(screen.getByRole('button', { name: /next/i }))
      
      const quickButtons = ['$50', '$100', '$250', '$500']
      quickButtons.forEach(amount => {
        expect(screen.getByRole('button', { name: amount })).toBeInTheDocument()
      })
      
      await user.click(screen.getByRole('button', { name: '$250' }))
      expect(screen.getByLabelText('Initial Investment')).toHaveValue('250')
    })

    it('should calculate and display investment preview', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      await user.click(screen.getByRole('button', { name: /next/i }))
      
      const amountInput = screen.getByLabelText('Initial Investment')
      await user.clear(amountInput)
      await user.type(amountInput, '1000')
      
      expect(screen.getByText('$1000.00')).toBeInTheDocument()
      
      // Enable recurring
      await user.click(screen.getByRole('checkbox'))
      const recurringAmount = screen.getByLabelText('Amount')
      await user.type(recurringAmount, '100')
      
      // Should show 12 month projection (monthly default)
      expect(screen.getByText('$2200.00')).toBeInTheDocument() // 1000 + (100 * 12)
    })
  })

  describe('Step 3: Risk & Strategy Selection', () => {
    it('should display all risk levels', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      // Navigate to step 3
      await user.click(screen.getByRole('button', { name: /next/i }))
      await user.click(screen.getByRole('button', { name: /next/i }))
      
      const riskLevels = ['Conservative', 'Moderate', 'Balanced', 'Aggressive', 'Very Aggressive']
      riskLevels.forEach(level => {
        expect(screen.getByText(level)).toBeInTheDocument()
      })
    })

    it('should update projections based on risk level', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      // Navigate to step 3
      await user.click(screen.getByRole('button', { name: /next/i }))
      await user.click(screen.getByRole('button', { name: /next/i }))
      
      // Select aggressive risk
      const aggressiveCard = screen.getByText('Aggressive').closest('.cursor-pointer')
      await user.click(aggressiveCard)
      
      // Should show higher APY
      expect(screen.getByText('12-25%')).toBeInTheDocument()
    })

    it('should show risk disclosure link', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      await user.click(screen.getByRole('button', { name: /next/i }))
      await user.click(screen.getByRole('button', { name: /next/i }))
      
      const disclosureLink = screen.getByText(/view full risk disclosure/i)
      expect(disclosureLink).toBeInTheDocument()
    })
  })

  describe('Step 4: Review & Payment - Balance Validation', () => {
    it('should show available balance for diBoaS wallet', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      // Navigate to step 4
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }))
      }
      
      expect(screen.getByText('$5000.00')).toBeInTheDocument()
      expect(screen.getByText('Available')).toBeInTheDocument()
    })

    it('should detect insufficient balance', async () => {
      // Mock insufficient balance
      vi.mocked(useWalletBalance).mockReturnValue({
        balance: {
          availableForSpending: 50,
          totalBalance: 100,
          lockedInStrategies: 50
        }
      })
      
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      // Set amount higher than balance
      await user.click(screen.getByRole('button', { name: /next/i }))
      const amountInput = screen.getByLabelText('Initial Investment')
      await user.clear(amountInput)
      await user.type(amountInput, '100')
      
      // Navigate to step 4
      await user.click(screen.getByRole('button', { name: /next/i }))
      await user.click(screen.getByRole('button', { name: /next/i }))
      
      // Should show insufficient balance warning
      expect(screen.getByText('Insufficient Balance')).toBeInTheDocument()
      expect(screen.getByText(/You need \$100.00 but only have \$50.00/)).toBeInTheDocument()
      
      // Should disable Next button
      const reviewButton = screen.getByRole('button', { name: /review/i })
      expect(reviewButton).toBeDisabled()
    })

    it('should show Add Money link when balance insufficient', async () => {
      vi.mocked(useWalletBalance).mockReturnValue({
        balance: {
          availableForSpending: 50,
          totalBalance: 100,
          lockedInStrategies: 50
        }
      })
      
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      // Navigate to payment step with high amount
      await user.click(screen.getByRole('button', { name: /next/i }))
      const amountInput = screen.getByLabelText('Initial Investment')
      await user.clear(amountInput)
      await user.type(amountInput, '100')
      
      await user.click(screen.getByRole('button', { name: /next/i }))
      await user.click(screen.getByRole('button', { name: /next/i }))
      
      const addMoneyLink = screen.getByText('Add Money to Wallet')
      expect(addMoneyLink).toBeInTheDocument()
      
      await user.click(addMoneyLink)
      expect(mockNavigate).toHaveBeenCalledWith('/category/banking/add')
    })
  })

  describe('Step 4: Payment Methods and Fees', () => {
    it('should display all payment methods with fees', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      // Navigate to step 4
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }))
      }
      
      const paymentMethods = [
        { name: 'diBoaS Wallet', processing: '0.05%', network: '0.0003%' },
        { name: 'Credit/Debit Card', processing: '0.75%', network: '0.0003%' },
        { name: 'Bank Account', processing: '0.25%', network: '0.0003%' },
        { name: 'Apple Pay', processing: '0.625%', network: '0.0003%' },
        { name: 'Google Pay', processing: '0.625%', network: '0.0003%' },
        { name: 'PayPal', processing: '0.725%', network: '0.0003%' }
      ]
      
      paymentMethods.forEach(method => {
        expect(screen.getByText(method.name)).toBeInTheDocument()
        expect(screen.getByText(`Processing: ${method.processing}`)).toBeInTheDocument()
        expect(screen.getByText(`Network: ${method.network}`)).toBeInTheDocument()
      })
    })

    it('should calculate fees correctly', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      // Set amount to 1000
      await user.click(screen.getByRole('button', { name: /next/i }))
      const amountInput = screen.getByLabelText('Initial Investment')
      await user.clear(amountInput)
      await user.type(amountInput, '1000')
      
      // Navigate to payment
      await user.click(screen.getByRole('button', { name: /next/i }))
      await user.click(screen.getByRole('button', { name: /next/i }))
      
      // Select credit card (0.75% + 0.0003%)
      const creditCard = screen.getByText('Credit/Debit Card').closest('.cursor-pointer')
      await user.click(creditCard)
      
      // Should show fee breakdown
      expect(screen.getByText('Fee Breakdown')).toBeInTheDocument()
      expect(screen.getByText('$7.50')).toBeInTheDocument() // Processing fee
      expect(screen.getByText('$0.00')).toBeInTheDocument() // Network fee (rounds to 0)
      expect(screen.getByText('$992.50')).toBeInTheDocument() // Net amount
    })

    it('should update fees when changing payment method', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      // Navigate to payment with $1000
      await user.click(screen.getByRole('button', { name: /next/i }))
      const amountInput = screen.getByLabelText('Initial Investment')
      await user.clear(amountInput)
      await user.type(amountInput, '1000')
      
      await user.click(screen.getByRole('button', { name: /next/i }))
      await user.click(screen.getByRole('button', { name: /next/i }))
      
      // Select diBoaS wallet first (0.05%)
      const wallet = screen.getByText('diBoaS Wallet').closest('.cursor-pointer')
      await user.click(wallet)
      expect(screen.getByText('$999.50')).toBeInTheDocument() // Net amount
      
      // Switch to PayPal (0.725%)
      const paypal = screen.getByText('PayPal').closest('.cursor-pointer')
      await user.click(paypal)
      expect(screen.getByText('$992.75')).toBeInTheDocument() // Net amount
    })

    it('should validate risk acceptance checkbox', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      // Navigate to payment
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }))
      }
      
      const reviewButton = screen.getByRole('button', { name: /review/i })
      expect(reviewButton).toBeDisabled()
      
      // Accept risks
      const riskCheckbox = screen.getByRole('checkbox', { name: /I understand and accept/i })
      await user.click(riskCheckbox)
      
      expect(reviewButton).toBeEnabled()
    })
  })

  describe('Step 5: Confirm & Launch', () => {
    it('should display transaction summary with fees', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      // Complete all steps
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }))
      }
      
      // Accept risks and continue
      const riskCheckbox = screen.getByRole('checkbox')
      await user.click(riskCheckbox)
      await user.click(screen.getByRole('button', { name: /review/i }))
      
      // Check summary
      expect(screen.getByText('Transaction Summary')).toBeInTheDocument()
      expect(screen.getByText('Gross Investment:')).toBeInTheDocument()
      expect(screen.getByText('Total Fees:')).toBeInTheDocument()
      expect(screen.getByText('Net Investment:')).toBeInTheDocument()
    })

    it('should launch strategy on confirmation', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      // Complete all steps
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }))
      }
      
      await user.click(screen.getByRole('checkbox'))
      await user.click(screen.getByRole('button', { name: /review/i }))
      
      const launchButton = screen.getByRole('button', { name: /launch strategy/i })
      await user.click(launchButton)
      
      expect(mockExecuteTransactionFlow).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'start_strategy',
          amount: 1000,
          paymentMethod: 'diboas_wallet',
          asset: 'USDC'
        })
      )
    })
  })

  describe('Navigation and Routing', () => {
    it('should navigate back to category/yield', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      const backButton = screen.getByText('Back to Yield')
      await user.click(backButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/category/yield')
    })

    it('should allow editing from review step', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      // Navigate to review
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }))
      }
      
      await user.click(screen.getByRole('checkbox'))
      
      // Find edit buttons in summary
      const editButtons = screen.getAllByRole('button', { name: /edit/i })
      expect(editButtons).toHaveLength(3) // Strategy, Investment, Risk
      
      // Click first edit (should go to step 1)
      await user.click(editButtons[0])
      expect(screen.getByText('Strategy Basics')).toBeInTheDocument()
    })

    it('should handle browser back button', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      // Go forward two steps
      await user.click(screen.getByRole('button', { name: /next/i }))
      await user.click(screen.getByRole('button', { name: /next/i }))
      
      // Click Previous button
      await user.click(screen.getByRole('button', { name: /previous/i }))
      
      // Should be on step 2
      expect(screen.getByText('Investment Parameters')).toBeInTheDocument()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockExecuteTransactionFlow.mockRejectedValueOnce(new Error('Network error'))
      
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      // Complete all steps
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }))
      }
      
      await user.click(screen.getByRole('checkbox'))
      await user.click(screen.getByRole('button', { name: /review/i }))
      await user.click(screen.getByRole('button', { name: /launch strategy/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })

    it('should handle very large amounts', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      await user.click(screen.getByRole('button', { name: /next/i }))
      
      const amountInput = screen.getByLabelText('Initial Investment')
      await user.clear(amountInput)
      await user.type(amountInput, '999999999')
      
      // Should calculate fees correctly
      await user.click(screen.getByRole('button', { name: /next/i }))
      await user.click(screen.getByRole('button', { name: /next/i }))
      
      // Select PayPal (0.725%)
      const paypal = screen.getByText('PayPal').closest('.cursor-pointer')
      await user.click(paypal)
      
      // Should show large fee
      expect(screen.getByText(/7249999.99/)).toBeInTheDocument() // Processing fee
    })

    it('should handle decimal amounts correctly', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      await user.click(screen.getByRole('button', { name: /next/i }))
      
      const amountInput = screen.getByLabelText('Initial Investment')
      await user.clear(amountInput)
      await user.type(amountInput, '123.45')
      
      expect(screen.getByText('$123.45')).toBeInTheDocument()
    })

    it('should handle rapid payment method switching', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      // Navigate to payment
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }))
      }
      
      // Rapidly switch between payment methods
      const methods = ['diBoaS Wallet', 'Credit/Debit Card', 'Bank Account']
      
      for (const method of methods) {
        const card = screen.getByText(method).closest('.cursor-pointer')
        await user.click(card)
      }
      
      // Should have Bank Account selected (last clicked)
      const bankCard = screen.getByText('Bank Account').closest('[class*="border-blue-500"]')
      expect(bankCard).toBeInTheDocument()
    })
  })

  describe('System Recovery Scenarios', () => {
    it('should recover from transaction flow errors', async () => {
      mockExecuteTransactionFlow
        .mockRejectedValueOnce(new Error('Transaction failed'))
        .mockResolvedValueOnce({ success: true })
      
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      // Complete flow
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }))
      }
      
      await user.click(screen.getByRole('checkbox'))
      await user.click(screen.getByRole('button', { name: /review/i }))
      
      // First attempt fails
      await user.click(screen.getByRole('button', { name: /launch strategy/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Transaction failed')).toBeInTheDocument()
      })
      
      // Retry succeeds
      await user.click(screen.getByRole('button', { name: /launch strategy/i }))
      
      expect(mockExecuteTransactionFlow).toHaveBeenCalledTimes(2)
    })

    it('should maintain form state after navigation away and back', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      // Fill in custom values
      const nameInput = screen.getByLabelText('Strategy Name')
      await user.clear(nameInput)
      await user.type(nameInput, 'My Custom Strategy')
      
      await user.click(screen.getByRole('button', { name: /next/i }))
      
      const amountInput = screen.getByLabelText('Initial Investment')
      await user.clear(amountInput)
      await user.type(amountInput, '2500')
      
      // Navigate back
      await user.click(screen.getByRole('button', { name: /previous/i }))
      
      // Values should be preserved
      expect(screen.getByLabelText('Strategy Name')).toHaveValue('My Custom Strategy')
      
      // Go forward again
      await user.click(screen.getByRole('button', { name: /next/i }))
      expect(screen.getByLabelText('Initial Investment')).toHaveValue('2500')
    })

    it('should handle balance updates while on payment step', async () => {
      const { rerender } = renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      // Navigate to payment
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }))
      }
      
      // Initial balance shows
      expect(screen.getByText('$5000.00')).toBeInTheDocument()
      
      // Mock balance update
      vi.mocked(useWalletBalance).mockReturnValue({
        balance: {
          availableForSpending: 3000,
          totalBalance: 8000,
          lockedInStrategies: 5000
        }
      })
      
      // Re-render component
      rerender(<ObjectiveConfig />)
      
      // Updated balance should show
      expect(screen.getByText('$3000.00')).toBeInTheDocument()
    })

    it('should handle concurrent strategy creation attempts', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      // Complete flow
      for (let i = 0; i < 3; i++) {
        await user.click(screen.getByRole('button', { name: /next/i }))
      }
      
      await user.click(screen.getByRole('checkbox'))
      await user.click(screen.getByRole('button', { name: /review/i }))
      
      const launchButton = screen.getByRole('button', { name: /launch strategy/i })
      
      // Click multiple times rapidly
      await user.click(launchButton)
      await user.click(launchButton)
      await user.click(launchButton)
      
      // Should only call once (button should be disabled after first click)
      expect(mockExecuteTransactionFlow).toHaveBeenCalledTimes(1)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels', async () => {
      renderWithRouter(<ObjectiveConfig />)
      
      expect(screen.getByLabelText('Strategy Name')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /next/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /previous/i })).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      // Tab through elements
      await user.tab()
      expect(screen.getByText('Back to Yield')).toHaveFocus()
      
      await user.tab()
      expect(screen.getByLabelText('Strategy Name')).toHaveFocus()
      
      // Use arrow keys for timeline selection
      const timelines = screen.getAllByRole('button')
      await user.keyboard('{ArrowRight}')
    })

    it('should announce step changes to screen readers', async () => {
      renderWithRouter(<ObjectiveConfig />)
      const user = userEvent.setup()
      
      // Progress indicator should have proper role
      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument()
      
      await user.click(screen.getByRole('button', { name: /next/i }))
      
      expect(screen.getByText('Step 2 of 5')).toBeInTheDocument()
    })
  })
})