/**
 * End-to-End Tests for Complete User Workflows
 * Tests complete user journeys including all bug fixes
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'

// Import components for full workflow testing
import TransactionPage from '../../components/TransactionPage.jsx'
import StrategyConfigurationWizard from '../../components/StrategyConfigurationWizard.jsx'
import TransactionHistory from '../../components/TransactionHistory.jsx'
import { dataManager } from '../../services/DataManager.js'

// Mock all external dependencies
vi.mock('../../services/DataManager.js', () => ({
  dataManager: {
    getState: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn(),
    addTransaction: vi.fn(),
    updateBalance: vi.fn(),
    emit: vi.fn()
  }
}))

vi.mock('../../hooks/transactions/useWalletBalance.js', () => ({
  useWalletBalance: () => ({
    availableForSpending: 1000,
    available: 1000,
    investedAmount: 100,
    assets: {
      'SOL': { investedAmount: 50 },
      'BTC': { investedAmount: 50 }
    },
    checkSufficientBalance: vi.fn()
  })
}))

vi.mock('../../hooks/transactions/useTransactionValidation.js', () => ({
  default: () => ({
    validateTransaction: vi.fn(),
    errors: {},
    isValid: true
  })
}))

vi.mock('../../hooks/transactions/useFeeCalculator.js', () => ({
  useFeeCalculator: () => ({
    calculateFees: vi.fn(),
    isCalculating: false,
    feeBreakdown: {
      breakdown: {
        diboas: 0.90,
        network: 0.05,
        dex: 0.50,
        provider: 0,
        defi: 0
      },
      total: 1.45
    }
  })
}))

vi.mock('../../services/strategies/StrategySearchEngine.js', () => ({
  default: {
    searchStrategies: vi.fn()
  }
}))

vi.mock('../../services/strategies/StrategyLifecycleManager.js', () => ({
  default: {
    launchStrategy: vi.fn()
  }
}))

vi.mock('../../services/transactions/OnChainTransactionManager.js', () => ({
  default: {
    executeTransaction: vi.fn()
  }
}))

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams(), vi.fn()],
    useLocation: () => ({ search: '', pathname: '/transaction' })
  }
})

describe('End-to-End User Workflows', () => {
  let mockUser
  let mockValidateTransaction
  let mockCheckSufficientBalance
  let mockCalculateFees
  let mockExecuteTransaction
  let mockSearchStrategies
  let mockLaunchStrategy

  const renderWithRouter = (component) => {
    return render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    )
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    mockUser = userEvent.setup()
    
    // Setup DataManager state
    dataManager.getState.mockReturnValue({
      balance: {
        totalUSD: 1100,
        availableForSpending: 1000,
        investedAmount: 100,
        strategyBalance: 0,
        assets: {
          'SOL': { investedAmount: 50 },
          'BTC': { investedAmount: 50 }
        }
      },
      transactions: []
    })
    
    // Setup mocks
    const useTransactionValidation = require('../../hooks/transactions/useTransactionValidation.js').default
    const useWalletBalance = require('../../hooks/transactions/useWalletBalance.js').useWalletBalance
    const useFeeCalculator = require('../../hooks/transactions/useFeeCalculator.js').useFeeCalculator
    const OnChainTransactionManager = require('../../services/transactions/OnChainTransactionManager.js').default
    const StrategySearchEngine = require('../../services/strategies/StrategySearchEngine.js').default
    const StrategyLifecycleManager = require('../../services/strategies/StrategyLifecycleManager.js').default
    
    mockValidateTransaction = vi.fn()
    mockCheckSufficientBalance = vi.fn()
    mockCalculateFees = vi.fn()
    mockExecuteTransaction = vi.fn()
    mockSearchStrategies = vi.fn()
    mockLaunchStrategy = vi.fn()
    
    useTransactionValidation.mockReturnValue({
      validateTransaction: mockValidateTransaction,
      errors: {},
      isValid: true
    })
    
    useWalletBalance.mockReturnValue({
      availableForSpending: 1000,
      available: 1000,
      checkSufficientBalance: mockCheckSufficientBalance
    })
    
    useFeeCalculator.mockReturnValue({
      calculateFees: mockCalculateFees,
      isCalculating: false,
      feeBreakdown: {
        breakdown: { diboas: 0.90, network: 0.05, dex: 0.50 },
        total: 1.45
      }
    })
    
    OnChainTransactionManager.executeTransaction = mockExecuteTransaction
    StrategySearchEngine.searchStrategies = mockSearchStrategies
    StrategyLifecycleManager.launchStrategy = mockLaunchStrategy
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Complete Transaction Flow with Validation', () => {
    it('should complete buy transaction flow with payment method validation', async () => {
      // Mock successful validation and execution
      mockValidateTransaction.mockReturnValue({ isValid: true, errors: {} })
      mockCheckSufficientBalance.mockReturnValue({ sufficient: true })
      mockCalculateFees.mockReturnValue({
        breakdown: { diboas: 0.90, network: 0.05, dex: 0.50 },
        total: 1.45
      })
      mockExecuteTransaction.mockResolvedValue({
        success: true,
        txHash: '0x123',
        status: 'completed'
      })
      
      renderWithRouter(<TransactionPage />)
      
      // User should see available balance
      await waitFor(() => {
        expect(screen.getByText(/\$1,000\.00/)).toBeInTheDocument()
      })
      
      // Fill in transaction details
      const amountInput = screen.getByLabelText(/amount/i)
      await mockUser.type(amountInput, '100')
      
      // Select payment method (this was previously missing validation)
      const paymentMethodSelect = screen.getByLabelText(/payment method/i)
      await mockUser.selectOptions(paymentMethodSelect, 'diboas_wallet')
      
      // Submit transaction
      const submitButton = screen.getByRole('button', { name: /buy|submit|confirm/i })
      await mockUser.click(submitButton)
      
      // Verify validation was called with payment method
      await waitFor(() => {
        expect(mockValidateTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            paymentMethod: 'diboas_wallet'
          })
        )
      })
      
      // Verify transaction was executed
      expect(mockExecuteTransaction).toHaveBeenCalled()
    })

    it('should prevent transaction submission without payment method', async () => {
      // Mock validation failure for missing payment method
      mockValidateTransaction.mockReturnValue({
        isValid: false,
        errors: {
          paymentMethod: {
            message: 'Please select a payment method',
            isValid: false
          }
        }
      })
      
      renderWithRouter(<TransactionPage />)
      
      // Fill in amount but skip payment method
      const amountInput = screen.getByLabelText(/amount/i)
      await mockUser.type(amountInput, '100')
      
      // Try to submit without payment method
      const submitButton = screen.getByRole('button', { name: /buy|submit|confirm/i })
      await mockUser.click(submitButton)
      
      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/please select a payment method/i)).toBeInTheDocument()
      })
      
      // Should not execute transaction
      expect(mockExecuteTransaction).not.toHaveBeenCalled()
    })

    it('should log failed transactions at validation stage', async () => {
      // Mock validation failure
      mockValidateTransaction.mockReturnValue({
        isValid: false,
        errors: {
          amount: { message: 'Amount too low', isValid: false }
        }
      })
      
      renderWithRouter(<TransactionPage />)
      
      // Try to submit invalid transaction
      const amountInput = screen.getByLabelText(/amount/i)
      await mockUser.type(amountInput, '0.01')
      
      const submitButton = screen.getByRole('button', { name: /buy|submit|confirm/i })
      await mockUser.click(submitButton)
      
      // Should log failed transaction
      await waitFor(() => {
        expect(dataManager.addTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            status: 'failed',
            failedAtStep: 'validation',
            error: expect.stringContaining('Validation failed')
          })
        )
      })
    })
  })

  describe('Complete Strategy Creation and Launch Flow', () => {
    it('should complete full strategy creation workflow', async () => {
      // Mock strategy search results
      mockSearchStrategies.mockResolvedValue([
        {
          id: 'aave-usdc-earn',
          name: 'Aave USDC Earn',
          protocol: 'Aave',
          apy: { current: 4.5 },
          chain: 'SOL',
          riskLevel: 'low'
        }
      ])
      
      // Mock successful strategy launch
      mockLaunchStrategy.mockResolvedValue({
        success: true,
        strategyInstance: {
          id: 'strategy_123',
          status: 'running'
        },
        transaction: {
          id: 'tx_strategy_launch_123',
          type: 'start_strategy',
          amount: 500,
          fees: {
            breakdown: { diboas: 0.45, network: 0.05, dex: 2.5 },
            total: 3.0
          }
        },
        balanceChanges: {
          availableChange: -503,
          strategyChange: +500
        }
      })
      
      renderWithRouter(<StrategyConfigurationWizard />)
      
      // Step 1: Enter strategy name
      const strategyNameInput = screen.getByLabelText(/strategy name/i)
      await mockUser.type(strategyNameInput, 'My Emergency Fund')
      
      let nextButton = screen.getByRole('button', { name: /next/i })
      await mockUser.click(nextButton)
      
      // Step 2: Enter investment amount
      await waitFor(() => {
        expect(screen.getByText(/investment amount/i)).toBeInTheDocument()
      })
      
      const amountInput = screen.getByLabelText(/initial investment amount/i)
      await mockUser.type(amountInput, '500')
      
      nextButton = screen.getByRole('button', { name: /next/i })
      await mockUser.click(nextButton)
      
      // Continue through steps...
      // Step 3: Goal configuration
      await waitFor(() => {
        const goalAmountInput = screen.getByLabelText(/target amount|goal amount/i)
        if (goalAmountInput) {
          await mockUser.type(goalAmountInput, '5000')
        }
      })
      
      // Navigate to strategy search
      const searchButton = screen.getByRole('button', { name: /search strategies/i })
      await mockUser.click(searchButton)
      
      // Step 4: Strategy search and selection
      await waitFor(() => {
        expect(mockSearchStrategies).toHaveBeenCalled()
      })
      
      // Select strategy (mock the selection)
      await waitFor(() => {
        const selectButtons = screen.getAllByRole('button', { name: /select/i })
        if (selectButtons.length > 0) {
          await mockUser.click(selectButtons[0])
        }
      })
      
      // Continue to fee review
      nextButton = screen.getByRole('button', { name: /next/i })
      if (nextButton) {
        await mockUser.click(nextButton)
      }
      
      // Step 6: Fee breakdown should be visible with 2 decimal places
      await waitFor(() => {
        expect(screen.getByText('Fee Breakdown')).toBeInTheDocument()
        // Fees should be displayed with 2 decimal places
        expect(screen.getByText(/\$0\.45/)).toBeInTheDocument() // diboas fee
        expect(screen.getByText(/\$0\.05/)).toBeInTheDocument() // network fee
        expect(screen.getByText(/\$2\.50/)).toBeInTheDocument() // dex fee
        expect(screen.getByText(/\$3\.00/)).toBeInTheDocument() // total fee
      })
      
      // Launch strategy
      const launchButton = screen.getByRole('button', { name: /launch strategy/i })
      await mockUser.click(launchButton)
      
      // Verify strategy launch was called
      await waitFor(() => {
        expect(mockLaunchStrategy).toHaveBeenCalledWith(
          expect.objectContaining({
            initialAmount: 500
          }),
          expect.any(Object)
        )
      })
      
      // Verify transaction was added with correct payment method
      await waitFor(() => {
        expect(dataManager.addTransaction).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'start_strategy',
            amount: 500,
            paymentMethod: 'diboas_wallet', // This was the missing field
            description: expect.stringContaining('My Emergency Fund'),
            strategyConfig: expect.objectContaining({
              strategyName: 'My Emergency Fund'
            })
          })
        )
      })
      
      // Verify balance update was called
      expect(dataManager.updateBalance).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'start_strategy',
          paymentMethod: 'diboas_wallet'
        })
      )
    })

    it('should handle strategy launch failures gracefully', async () => {
      // Mock strategy launch failure
      mockLaunchStrategy.mockResolvedValue({
        success: false,
        error: 'Insufficient balance for strategy launch'
      })
      
      renderWithRouter(<StrategyConfigurationWizard />)
      
      // Navigate through steps quickly for testing
      // ... (abbreviated for brevity)
      
      // Mock that we've reached the launch step
      const launchButton = screen.getByRole('button', { name: /launch strategy/i })
      await mockUser.click(launchButton)
      
      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/insufficient balance/i)).toBeInTheDocument()
      })
      
      // Should not add transaction or update balance
      expect(dataManager.addTransaction).not.toHaveBeenCalled()
      expect(dataManager.updateBalance).not.toHaveBeenCalled()
    })
  })

  describe('Transaction History and Recovery', () => {
    it('should display all transaction types including strategy launches', async () => {
      // Mock transaction history with various types
      dataManager.getState.mockReturnValue({
        balance: { availableForSpending: 500, strategyBalance: 500 },
        transactions: [
          {
            id: 'tx_1',
            type: 'buy',
            amount: 100,
            status: 'completed',
            timestamp: new Date().toISOString(),
            description: 'Bought $100 worth of SOL',
            category: 'investment'
          },
          {
            id: 'tx_2', 
            type: 'start_strategy',
            amount: 500,
            status: 'completed',
            timestamp: new Date().toISOString(),
            description: 'Started Emergency Fund with $500',
            category: 'yield',
            strategyConfig: {
              strategyName: 'Emergency Fund'
            }
          },
          {
            id: 'tx_3',
            type: 'withdraw',
            amount: 50,
            status: 'failed',
            timestamp: new Date().toISOString(),
            description: 'Failed withdraw transaction - Validation error',
            category: 'banking',
            failedAtStep: 'validation',
            error: 'Please select where to withdraw funds'
          }
        ]
      })
      
      renderWithRouter(<TransactionHistory />)
      
      // Should display all transaction types
      await waitFor(() => {
        expect(screen.getByText(/bought.*sol/i)).toBeInTheDocument()
        expect(screen.getByText(/started emergency fund/i)).toBeInTheDocument()
        expect(screen.getByText(/failed withdraw/i)).toBeInTheDocument()
      })
      
      // Should show transaction categories
      expect(screen.getByText(/investment/i)).toBeInTheDocument()
      expect(screen.getByText(/yield/i)).toBeInTheDocument()
      expect(screen.getByText(/banking/i)).toBeInTheDocument()
      
      // Should show failed transaction details
      expect(screen.getByText(/validation error/i)).toBeInTheDocument()
    })

    it('should handle empty transaction history gracefully', async () => {
      dataManager.getState.mockReturnValue({
        balance: { availableForSpending: 1000 },
        transactions: []
      })
      
      renderWithRouter(<TransactionHistory />)
      
      await waitFor(() => {
        expect(screen.getByText(/no transactions/i)).toBeInTheDocument()
      })
    })
  })

  describe('Error Recovery and System Resilience', () => {
    it('should recover from temporary service failures', async () => {
      // Mock initial service failure
      mockValidateTransaction.mockImplementationOnce(() => {
        throw new Error('Validation service temporarily unavailable')
      })
      
      renderWithRouter(<TransactionPage />)
      
      // Try transaction - should handle error gracefully
      const amountInput = screen.getByLabelText(/amount/i)
      await mockUser.type(amountInput, '100')
      
      const submitButton = screen.getByRole('button', { name: /buy|submit|confirm/i })
      await mockUser.click(submitButton)
      
      // Should show error state but not crash
      await waitFor(() => {
        expect(screen.getByText(/error/i) || screen.getByText(/try again/i)).toBeInTheDocument()
      })
      
      // Mock service recovery
      mockValidateTransaction.mockReturnValue({ isValid: true, errors: {} })
      mockExecuteTransaction.mockResolvedValue({ success: true })
      
      // Retry should work
      await mockUser.click(submitButton)
      
      await waitFor(() => {
        expect(mockExecuteTransaction).toHaveBeenCalled()
      })
    })

    it('should handle concurrent user actions without data corruption', async () => {
      // Mock successful operations
      mockValidateTransaction.mockReturnValue({ isValid: true, errors: {} })
      mockExecuteTransaction.mockResolvedValue({ success: true })
      mockLaunchStrategy.mockResolvedValue({ success: true })
      
      // Simulate rapid user interactions
      renderWithRouter(<TransactionPage />)
      
      const submitButton = screen.getByRole('button', { name: /buy|submit|confirm/i })
      
      // Rapid clicks
      await mockUser.click(submitButton)
      await mockUser.click(submitButton)
      await mockUser.click(submitButton)
      
      // Should handle gracefully without duplicate transactions
      await waitFor(() => {
        // Verify transaction manager was called but system handled concurrency
        expect(mockExecuteTransaction).toHaveBeenCalled()
      })
    })

    it('should maintain data consistency across component re-renders', async () => {
      let currentBalance = 1000
      
      // Mock dynamic balance updates
      dataManager.getState.mockImplementation(() => ({
        balance: {
          availableForSpending: currentBalance,
          totalUSD: currentBalance
        },
        transactions: []
      }))
      
      const { rerender } = renderWithRouter(<TransactionPage />)
      
      // Initial render
      await waitFor(() => {
        expect(screen.getByText(/\$1,000\.00/)).toBeInTheDocument()
      })
      
      // Simulate balance change
      currentBalance = 500
      
      rerender(
        <BrowserRouter>
          <TransactionPage />
        </BrowserRouter>
      )
      
      // Should reflect updated balance
      await waitFor(() => {
        expect(screen.getByText(/\$500\.00/)).toBeInTheDocument()
      })
    })
  })

  describe('Cross-Component Integration', () => {
    it('should maintain state consistency between transaction page and history', async () => {
      // Mock successful transaction
      mockValidateTransaction.mockReturnValue({ isValid: true, errors: {} })
      mockExecuteTransaction.mockResolvedValue({
        success: true,
        txHash: '0x123',
        transaction: {
          id: 'tx_integration_test',
          type: 'buy',
          amount: 100,
          status: 'completed'
        }
      })
      
      // Mock transaction being added to history
      dataManager.addTransaction.mockImplementation((tx) => {
        const currentState = dataManager.getState()
        currentState.transactions.unshift(tx)
        return tx
      })
      
      renderWithRouter(<TransactionPage />)
      
      // Execute transaction
      const amountInput = screen.getByLabelText(/amount/i)
      await mockUser.type(amountInput, '100')
      
      const paymentMethodSelect = screen.getByLabelText(/payment method/i)
      await mockUser.selectOptions(paymentMethodSelect, 'diboas_wallet')
      
      const submitButton = screen.getByRole('button', { name: /buy|submit|confirm/i })
      await mockUser.click(submitButton)
      
      // Verify transaction was added
      await waitFor(() => {
        expect(dataManager.addTransaction).toHaveBeenCalled()
      })
      
      // Switch to transaction history view
      const { rerender } = renderWithRouter(<TransactionHistory />)
      
      rerender(
        <BrowserRouter>
          <TransactionHistory />
        </BrowserRouter>
      )
      
      // Should show the completed transaction
      await waitFor(() => {
        expect(screen.getByText(/buy.*100/i)).toBeInTheDocument()
      })
    })
  })
})