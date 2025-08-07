/**
 * Comprehensive Test Suite for ObjectiveConfig Strategy Launch Flow
 * Tests fee calculations, balance validation, payment methods, edge cases, and system recovery
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import React from 'react'
import ObjectiveConfig from '../../components/yield/ObjectiveConfig.jsx'

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

// Mock hooks with realistic implementations
const mockNavigate = vi.fn()
const mockCalculateFees = vi.fn()
const mockExecuteTransactionFlow = vi.fn()
const mockConfirmTransaction = vi.fn()
const mockResetFlow = vi.fn()

// Default mock balance - sufficient funds
const defaultBalance = {
  availableForSpending: 2000,
  totalBalance: 5000,
  lockedInStrategies: 3000
}

// Mock fee structure (4x less than standard rates)
const mockFees = {
  providerFee: 0.5, // 0.05% of 1000
  networkFee: 0.003, // 0.0003% of 1000  
  total: 0.503,
  providerFeeRate: '0.05%',
  networkFeeRate: '0.0003%'
}

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('?objective=emergency-funds')]
  }
})

vi.mock('../../hooks/transactions/index.js', () => ({
  useWalletBalance: () => ({ balance: defaultBalance }),
  useFeeCalculator: () => ({ calculateFees: mockCalculateFees }),
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

const navigateToLaunchStep = async () => {
  // Navigate through all steps to reach launch
  for (let i = 0; i < 4; i++) {
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
  }
  
  // Accept risks
  fireEvent.click(screen.getByRole('checkbox'))
  fireEvent.click(screen.getByRole('button', { name: /review/i }))
}

describe('ObjectiveConfig - Strategy Launch Flow Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.spyOn(console, 'error').mockImplementation(() => {})
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    
    // Setup default fee calculation mock
    mockCalculateFees.mockResolvedValue(mockFees)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Fee Calculation Integration', () => {
    it('should use centralized fee calculator for consistency', async () => {
      renderWithRouter(<ObjectiveConfig />)
      
      // Wait for initial fee calculation
      await waitFor(() => {
        expect(mockCalculateFees).toHaveBeenCalledWith({
          type: 'start_strategy',
          amount: 1000, // Emergency funds default amount
          paymentMethod: 'diboas_wallet',
          asset: 'USDC',
          chains: ['SOL']
        })
      })
    })

    it('should recalculate fees when payment method changes', async () => {
      renderWithRouter(<ObjectiveConfig />)
      
      // Navigate to payment step
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByRole('button', { name: /next/i }))
      }
      
      // Change to credit card
      const creditCard = screen.getByText('Credit/Debit Card').closest('.cursor-pointer')
      fireEvent.click(creditCard)
      
      await waitFor(() => {
        expect(mockCalculateFees).toHaveBeenCalledWith({
          type: 'start_strategy',
          amount: 1000,
          paymentMethod: 'credit_debit_card',
          asset: 'USDC',
          chains: ['SOL']
        })
      })
    })

    it('should recalculate fees when amount changes', async () => {
      renderWithRouter(<ObjectiveConfig />)
      
      // Change amount in step 2
      fireEvent.click(screen.getByRole('button', { name: /next/i }))
      const amountInput = screen.getByLabelText('Initial Investment')
      fireEvent.change(amountInput, { target: { value: '2000' } })
      
      await waitFor(() => {
        expect(mockCalculateFees).toHaveBeenCalledWith({
          type: 'start_strategy',
          amount: 2000,
          paymentMethod: 'diboas_wallet',
          asset: 'USDC',
          chains: ['SOL']
        })
      })
    })

    it('should handle fee calculation errors gracefully', async () => {
      mockCalculateFees.mockRejectedValue(new Error('Fee service unavailable'))
      
      renderWithRouter(<ObjectiveConfig />)
      
      // Should still render without crashing
      expect(screen.getByText('Strategy Basics')).toBeInTheDocument()
      
      // Should show fallback fee information
      await waitFor(() => {
        expect(screen.queryByText('Processing: 0.05%')).toBeInTheDocument()
      })
    })
  })

  describe('diBoaS Wallet Balance Validation', () => {
    it('should validate sufficient balance including fees', async () => {
      // Mock fees that would make total requirement 1000.503
      mockCalculateFees.mockResolvedValue({ ...mockFees, total: 0.503 })
      
      renderWithRouter(<ObjectiveConfig />)
      
      // Navigate to payment step
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByRole('button', { name: /next/i }))
      }
      
      // Should show available balance
      expect(screen.getByText('$2000.00')).toBeInTheDocument()
      expect(screen.getByText('Available')).toBeInTheDocument()
      
      // Review button should be enabled (sufficient balance)
      fireEvent.click(screen.getByRole('checkbox'))
      const reviewButton = screen.getByRole('button', { name: /review/i })
      expect(reviewButton).toBeEnabled()
    })

    it('should detect insufficient balance including fees', async () => {
      // Mock high fees that would exceed available balance
      mockCalculateFees.mockResolvedValue({
        ...mockFees,
        total: 1500, // Would make total requirement 2500 > 2000 available
        providerFee: 1499,
        networkFee: 1
      })
      
      // Re-mock with insufficient balance
      vi.doMock('../../hooks/transactions/index.js', () => ({
        useWalletBalance: () => ({ 
          balance: { ...defaultBalance, availableForSpending: 2000 } 
        }),
        useFeeCalculator: () => ({ calculateFees: mockCalculateFees }),
        useTransactionFlow: () => ({
          flowState: 'idle',
          flowData: null,
          flowError: null,
          executeTransactionFlow: mockExecuteTransactionFlow,
          confirmTransaction: mockConfirmTransaction,
          resetFlow: mockResetFlow
        })
      }))
      
      renderWithRouter(<ObjectiveConfig />)
      
      // Navigate to payment step
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByRole('button', { name: /next/i }))
      }
      
      // Should show insufficient balance warning
      await waitFor(() => {
        expect(screen.getByText('Insufficient Balance')).toBeInTheDocument()
        expect(screen.getByText(/including fees/)).toBeInTheDocument()
      })
    })

    it('should provide Add Money link for insufficient balance', async () => {
      // Mock very low balance
      vi.doMock('../../hooks/transactions/index.js', () => ({
        useWalletBalance: () => ({ 
          balance: { ...defaultBalance, availableForSpending: 500 } 
        }),
        useFeeCalculator: () => ({ calculateFees: mockCalculateFees }),
        useTransactionFlow: () => ({
          flowState: 'idle',
          flowData: null,
          flowError: null,
          executeTransactionFlow: mockExecuteTransactionFlow,
          confirmTransaction: mockConfirmTransaction,
          resetFlow: mockResetFlow
        })
      }))
      
      renderWithRouter(<ObjectiveConfig />)
      
      // Navigate to payment step
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByRole('button', { name: /next/i }))
      }
      
      // Click Add Money link
      const addMoneyLink = screen.getByText('Add Money to Wallet')
      fireEvent.click(addMoneyLink)
      
      expect(mockNavigate).toHaveBeenCalledWith('/category/banking/add')
    })
  })

  describe('External Payment Methods Flow', () => {
    it('should bypass balance validation for credit card payments', async () => {
      // Mock very low balance that would be insufficient
      vi.doMock('../../hooks/transactions/index.js', () => ({
        useWalletBalance: () => ({ 
          balance: { ...defaultBalance, availableForSpending: 100 } 
        }),
        useFeeCalculator: () => ({ calculateFees: mockCalculateFees }),
        useTransactionFlow: () => ({
          flowState: 'idle',
          flowData: null,
          flowError: null,
          executeTransactionFlow: mockExecuteTransactionFlow,
          confirmTransaction: mockConfirmTransaction,
          resetFlow: mockResetFlow
        })
      }))
      
      renderWithRouter(<ObjectiveConfig />)
      
      // Navigate to payment step
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByRole('button', { name: /next/i }))
      }
      
      // Select credit card
      const creditCard = screen.getByText('Credit/Debit Card').closest('.cursor-pointer')
      fireEvent.click(creditCard)
      
      // Should NOT show insufficient balance warning
      expect(screen.queryByText('Insufficient Balance')).not.toBeInTheDocument()
      
      // Review button should be enabled after accepting risks
      fireEvent.click(screen.getByRole('checkbox'))
      const reviewButton = screen.getByRole('button', { name: /review/i })
      expect(reviewButton).toBeEnabled()
    })

    it('should test all external payment methods', async () => {
      const externalMethods = [
        'Credit/Debit Card',
        'Bank Account', 
        'Apple Pay',
        'Google Pay',
        'PayPal'
      ]
      
      renderWithRouter(<ObjectiveConfig />)
      
      // Navigate to payment step
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByRole('button', { name: /next/i }))
      }
      
      for (const methodName of externalMethods) {
        const methodCard = screen.getByText(methodName).closest('.cursor-pointer')
        fireEvent.click(methodCard)
        
        // Should be selectable and not show balance warnings
        expect(methodCard).toHaveClass('border-blue-500')
        expect(screen.queryByText('Insufficient Balance')).not.toBeInTheDocument()
      }
    })

    it('should show different fee rates for different payment methods', async () => {
      const paymentMethodFees = {
        diboas_wallet: { providerFee: 0.5, networkFee: 0.003 },
        credit_debit_card: { providerFee: 7.5, networkFee: 0.003 }, // 0.75%
        bank_account: { providerFee: 2.5, networkFee: 0.003 }, // 0.25%
        paypal: { providerFee: 7.25, networkFee: 0.003 } // 0.725%
      }
      
      renderWithRouter(<ObjectiveConfig />)
      
      // Navigate to payment step
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByRole('button', { name: /next/i }))
      }
      
      // Test each payment method shows correct fees
      for (const [methodId, expectedFees] of Object.entries(paymentMethodFees)) {
        mockCalculateFees.mockResolvedValue({
          ...expectedFees,
          total: expectedFees.providerFee + expectedFees.networkFee
        })
        
        const methodMap = {
          diboas_wallet: 'diBoaS Wallet',
          credit_debit_card: 'Credit/Debit Card',
          bank_account: 'Bank Account',
          paypal: 'PayPal'
        }
        
        if (methodMap[methodId]) {
          const methodCard = screen.getByText(methodMap[methodId]).closest('.cursor-pointer')
          fireEvent.click(methodCard)
          
          await waitFor(() => {
            expect(mockCalculateFees).toHaveBeenCalledWith({
              type: 'start_strategy',
              amount: 1000,
              paymentMethod: methodId,
              asset: 'USDC',
              chains: ['SOL']
            })
          })
        }
      }
    })
  })

  describe('Strategy Launch Execution', () => {
    it('should execute transaction flow with correct parameters', async () => {
      renderWithRouter(<ObjectiveConfig />)
      
      await navigateToLaunchStep()
      
      // Launch strategy
      const launchButton = screen.getByRole('button', { name: /launch strategy/i })
      fireEvent.click(launchButton)
      
      expect(mockExecuteTransactionFlow).toHaveBeenCalledWith({
        type: 'start_strategy',
        amount: 1000,
        strategyConfig: expect.objectContaining({
          objectiveId: 'emergency-funds',
          strategyName: 'Emergency Funds',
          initialAmount: '1000',
          paymentMethod: 'diboas_wallet',
          riskLevel: 'Conservative'
        }),
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        targetChain: 'SOL'
      })
    })

    it('should include simulation data in strategy config', async () => {
      renderWithRouter(<ObjectiveConfig />)
      
      await navigateToLaunchStep()
      
      const launchButton = screen.getByRole('button', { name: /launch strategy/i })
      fireEvent.click(launchButton)
      
      const callArgs = mockExecuteTransactionFlow.mock.calls[0][0]
      expect(callArgs.strategyConfig.simulation).toBeDefined()
      expect(callArgs.strategyConfig.simulation).toEqual(expect.objectContaining({
        initialAmount: expect.any(Number),
        projectedValue: expect.any(Number),
        timelineMonths: expect.any(Number)
      }))
    })

    it('should handle processing state during transaction', async () => {
      renderWithRouter(<ObjectiveConfig />)
      
      await navigateToLaunchStep()
      
      const launchButton = screen.getByRole('button', { name: /launch strategy/i })
      fireEvent.click(launchButton)
      
      // Button should be disabled during processing
      expect(launchButton).toBeDisabled()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle zero amount edge case', async () => {
      renderWithRouter(<ObjectiveConfig />)
      
      // Set amount to 0
      fireEvent.click(screen.getByRole('button', { name: /next/i }))
      const amountInput = screen.getByLabelText('Initial Investment')
      fireEvent.change(amountInput, { target: { value: '0' } })
      
      // Next button should be disabled
      const nextButton = screen.getByRole('button', { name: /next/i })
      expect(nextButton).toBeDisabled()
    })

    it('should handle very large amounts', async () => {
      renderWithRouter(<ObjectiveConfig />)
      
      // Set very large amount
      fireEvent.click(screen.getByRole('button', { name: /next/i }))
      const amountInput = screen.getByLabelText('Initial Investment')
      fireEvent.change(amountInput, { target: { value: '999999999' } })
      
      // Should calculate fees for large amount
      await waitFor(() => {
        expect(mockCalculateFees).toHaveBeenCalledWith(
          expect.objectContaining({ amount: 999999999 })
        )
      })
    })

    it('should handle decimal amounts correctly', async () => {
      renderWithRouter(<ObjectiveConfig />)
      
      fireEvent.click(screen.getByRole('button', { name: /next/i }))
      const amountInput = screen.getByLabelText('Initial Investment')
      fireEvent.change(amountInput, { target: { value: '1234.56' } })
      
      await waitFor(() => {
        expect(mockCalculateFees).toHaveBeenCalledWith(
          expect.objectContaining({ amount: 1234.56 })
        )
      })
    })

    it('should handle network timeout errors', async () => {
      mockExecuteTransactionFlow.mockRejectedValue(new Error('Network timeout'))
      
      renderWithRouter(<ObjectiveConfig />)
      
      await navigateToLaunchStep()
      
      const launchButton = screen.getByRole('button', { name: /launch strategy/i })
      fireEvent.click(launchButton)
      
      await waitFor(() => {
        expect(screen.getByText('Network timeout')).toBeInTheDocument()
      })
    })

    it('should handle transaction validation errors', async () => {
      mockExecuteTransactionFlow.mockRejectedValue(new Error('Invalid strategy configuration'))
      
      renderWithRouter(<ObjectiveConfig />)
      
      await navigateToLaunchStep()
      
      const launchButton = screen.getByRole('button', { name: /launch strategy/i })
      fireEvent.click(launchButton)
      
      await waitFor(() => {
        expect(screen.getByText('Invalid strategy configuration')).toBeInTheDocument()
      })
    })

    it('should prevent double-submission', async () => {
      renderWithRouter(<ObjectiveConfig />)
      
      await navigateToLaunchStep()
      
      const launchButton = screen.getByRole('button', { name: /launch strategy/i })
      
      // Rapid clicks
      fireEvent.click(launchButton)
      fireEvent.click(launchButton)
      fireEvent.click(launchButton)
      
      // Should only call once
      expect(mockExecuteTransactionFlow).toHaveBeenCalledTimes(1)
    })
  })

  describe('System Recovery Scenarios', () => {
    it('should recover from transaction failures with retry', async () => {
      mockExecuteTransactionFlow
        .mockRejectedValueOnce(new Error('Blockchain congestion'))
        .mockResolvedValueOnce({ success: true })
      
      renderWithRouter(<ObjectiveConfig />)
      
      await navigateToLaunchStep()
      
      const launchButton = screen.getByRole('button', { name: /launch strategy/i })
      
      // First attempt fails
      fireEvent.click(launchButton)
      
      await waitFor(() => {
        expect(screen.getByText('Blockchain congestion')).toBeInTheDocument()
      })
      
      // Retry succeeds (button should be re-enabled)
      fireEvent.click(launchButton)
      
      expect(mockExecuteTransactionFlow).toHaveBeenCalledTimes(2)
    })

    it('should maintain form state during navigation', async () => {
      renderWithRouter(<ObjectiveConfig />)
      
      // Modify strategy name
      const nameInput = screen.getByLabelText('Strategy Name')
      fireEvent.change(nameInput, { target: { value: 'My Custom Emergency Fund' } })
      
      // Navigate forward
      fireEvent.click(screen.getByRole('button', { name: /next/i }))
      fireEvent.click(screen.getByRole('button', { name: /next/i }))
      
      // Navigate back
      fireEvent.click(screen.getByRole('button', { name: /previous/i }))
      fireEvent.click(screen.getByRole('button', { name: /previous/i }))
      
      // Form state should be preserved
      expect(screen.getByLabelText('Strategy Name')).toHaveValue('My Custom Emergency Fund')
    })

    it('should handle balance updates during configuration', async () => {
      const { rerender } = renderWithRouter(<ObjectiveConfig />)
      
      // Navigate to payment step
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByRole('button', { name: /next/i }))
      }
      
      // Initial balance shows
      expect(screen.getByText('$2000.00')).toBeInTheDocument()
      
      // Mock balance update (external transaction)
      vi.doMock('../../hooks/transactions/index.js', () => ({
        useWalletBalance: () => ({ 
          balance: { ...defaultBalance, availableForSpending: 5000 } 
        }),
        useFeeCalculator: () => ({ calculateFees: mockCalculateFees }),
        useTransactionFlow: () => ({
          flowState: 'idle',
          flowData: null,
          flowError: null,
          executeTransactionFlow: mockExecuteTransactionFlow,
          confirmTransaction: mockConfirmTransaction,
          resetFlow: mockResetFlow
        })
      }))
      
      // Re-render to trigger balance update
      rerender(<ObjectiveConfig />)
      
      // Updated balance should show
      expect(screen.getByText('$5000.00')).toBeInTheDocument()
    })

    it('should handle incomplete strategy configuration recovery', async () => {
      renderWithRouter(<ObjectiveConfig />)
      
      // Start configuration but don't complete
      fireEvent.click(screen.getByRole('button', { name: /next/i }))
      
      // Simulate component unmount/remount (page refresh)
      const { rerender } = renderWithRouter(<ObjectiveConfig />)
      
      // Should restart from beginning with defaults
      expect(screen.getByText('Strategy Basics')).toBeInTheDocument()
      expect(screen.getByText('Step 1 of 5')).toBeInTheDocument()
    })

    it('should handle concurrent fee calculations', async () => {
      renderWithRouter(<ObjectiveConfig />)
      
      // Rapidly change amount multiple times
      fireEvent.click(screen.getByRole('button', { name: /next/i }))
      const amountInput = screen.getByLabelText('Initial Investment')
      
      fireEvent.change(amountInput, { target: { value: '1000' } })
      fireEvent.change(amountInput, { target: { value: '2000' } })
      fireEvent.change(amountInput, { target: { value: '3000' } })
      
      // Should handle multiple concurrent fee calculations gracefully
      await waitFor(() => {
        expect(mockCalculateFees).toHaveBeenCalled()
      })
      
      // Component should still be functional
      expect(screen.getByLabelText('Initial Investment')).toHaveValue('3000')
    })
  })

  describe('Accessibility and User Experience', () => {
    it('should provide clear error messages', async () => {
      mockExecuteTransactionFlow.mockRejectedValue(new Error('Payment method declined'))
      
      renderWithRouter(<ObjectiveConfig />)
      
      await navigateToLaunchStep()
      
      const launchButton = screen.getByRole('button', { name: /launch strategy/i })
      fireEvent.click(launchButton)
      
      await waitFor(() => {
        const errorMessage = screen.getByText('Payment method declined')
        expect(errorMessage).toBeInTheDocument()
        expect(errorMessage).toHaveClass('text-red-600')
      })
    })

    it('should maintain focus management during steps', async () => {
      renderWithRouter(<ObjectiveConfig />)
      
      const nextButton = screen.getByRole('button', { name: /next/i })
      nextButton.focus()
      
      fireEvent.click(nextButton)
      
      // Focus should move to next relevant element
      expect(document.activeElement).not.toBe(nextButton)
    })

    it('should provide proper ARIA labels for payment methods', async () => {
      renderWithRouter(<ObjectiveConfig />)
      
      // Navigate to payment step
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByRole('button', { name: /next/i }))
      }
      
      // All payment method cards should have proper labels
      const paymentMethods = ['diBoaS Wallet', 'Credit/Debit Card', 'Bank Account']
      paymentMethods.forEach(method => {
        const element = screen.getByText(method)
        expect(element.closest('.cursor-pointer')).toBeInTheDocument()
      })
    })
  })
})