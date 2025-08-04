/**
 * ObjectiveConfig Wizard Test
 * Tests the multi-step strategy configuration wizard
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
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
    processTransaction: vi.fn(() => Promise.resolve({ success: true })),
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
    executeTransactionFlow: vi.fn(() => Promise.resolve({ success: true })),
    confirmTransaction: vi.fn(() => Promise.resolve({ success: true })),
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
      <div>Processing: {transactionData.strategyName}</div>
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

describe('ObjectiveConfig - Multi-Step Wizard', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Wizard Progress', () => {
    it('should display correct step progress', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      expect(screen.getByText('Step 1 of 11')).toBeInTheDocument()
      expect(screen.getByText('Template Image')).toBeInTheDocument()
      expect(screen.getByText('Choose your strategy image')).toBeInTheDocument()
    })

    it('should show progress bar with correct width', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      const progressBar = document.querySelector('.bg-blue-600')
      expect(progressBar).toHaveStyle('width: 9.090909090909092%') // 1/11 * 100%
    })
  })

  describe('Step Navigation', () => {
    it('should navigate to next step when Next button is clicked', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Click Next to go to step 2
      const nextButton = screen.getByText('Next')
      fireEvent.click(nextButton)

      await waitFor(() => {
        expect(screen.getByText('Step 2 of 11')).toBeInTheDocument()
        expect(screen.getByText('Name your objective')).toBeInTheDocument()
      })
    })

    it('should navigate to previous step when Previous button is clicked', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Go to step 2 first
      fireEvent.click(screen.getByText('Next'))
      
      await waitFor(() => {
        expect(screen.getByText('Step 2 of 11')).toBeInTheDocument()
      })

      // Then go back to step 1
      fireEvent.click(screen.getByText('Previous'))

      await waitFor(() => {
        expect(screen.getByText('Step 1 of 11')).toBeInTheDocument()
        expect(screen.getByText('Template Image')).toBeInTheDocument()
      })
    })

    it('should disable Previous button on first step', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      const previousButton = screen.getByText('Previous')
      expect(previousButton).toBeDisabled()
    })
  })

  describe('Step 2 - Strategy Name', () => {
    it('should validate strategy name length', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Go to step 2
      fireEvent.click(screen.getByText('Next'))

      await waitFor(() => {
        expect(screen.getByText('Name your objective')).toBeInTheDocument()
      })

      // Clear the input and enter a short name
      const nameInput = screen.getByLabelText('Strategy Name')
      fireEvent.change(nameInput, { target: { value: 'AB' } })

      // Next button should be disabled due to validation
      const nextButton = screen.getByText('Next')
      expect(nextButton).toBeDisabled()
    })

    it('should enable Next button with valid strategy name', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Go to step 2
      fireEvent.click(screen.getByText('Next'))

      await waitFor(() => {
        const nameInput = screen.getByLabelText('Strategy Name')
        fireEvent.change(nameInput, { target: { value: 'My Emergency Fund' } })
      })

      const nextButton = screen.getByText('Next')
      expect(nextButton).not.toBeDisabled()
    })
  })

  describe('Step 3 - Timeline Selection', () => {
    it('should render timeline options', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Navigate to step 3
      fireEvent.click(screen.getByText('Next')) // Step 2
      await waitFor(() => fireEvent.click(screen.getByText('Next'))) // Step 3

      await waitFor(() => {
        expect(screen.getByText('When do you want to use this money?')).toBeInTheDocument()
        expect(screen.getByText('Up to 6 months')).toBeInTheDocument()
        expect(screen.getByText('6 to 12 months')).toBeInTheDocument()
        expect(screen.getByText('More than 12 months')).toBeInTheDocument()
      })
    })

    it('should select timeline option', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Navigate to step 3
      fireEvent.click(screen.getByText('Next'))
      await waitFor(() => fireEvent.click(screen.getByText('Next')))

      await waitFor(() => {
        const timelineOption = screen.getByText('6 to 12 months').closest('.cursor-pointer')
        fireEvent.click(timelineOption)
      })

      // Should highlight the selected option
      const selectedOption = screen.getByText('6 to 12 months').closest('.cursor-pointer')
      expect(selectedOption).toHaveClass('border-blue-500')
    })
  })

  describe('Step 4 - Initial Amount', () => {
    it('should validate minimum amount', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Navigate to step 4
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByText('Next'))
        await waitFor(() => {})
      }

      await waitFor(() => {
        const amountInput = screen.getByLabelText('How much do you want to start with?')
        fireEvent.change(amountInput, { target: { value: '5' } })
      })

      const nextButton = screen.getByText('Next')
      expect(nextButton).toBeDisabled()
    })

    it('should accept valid initial amount', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Navigate to step 4
      for (let i = 0; i < 3; i++) {
        fireEvent.click(screen.getByText('Next'))
        await waitFor(() => {})
      }

      await waitFor(() => {
        const amountInput = screen.getByLabelText('How much do you want to start with?')
        fireEvent.change(amountInput, { target: { value: '100' } })
      })

      const nextButton = screen.getByText('Next')
      expect(nextButton).not.toBeDisabled()
    })
  })

  describe('Step 7 - Risk & Yield Selection', () => {
    it('should display risk level options', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Navigate to step 7
      for (let i = 0; i < 6; i++) {
        fireEvent.click(screen.getByText('Next'))
        await waitFor(() => {})
      }

      await waitFor(() => {
        expect(screen.getByText('Choose your risk and yield profile')).toBeInTheDocument()
        expect(screen.getByText('Conservative')).toBeInTheDocument()
        expect(screen.getByText('Moderate')).toBeInTheDocument()
        expect(screen.getByText('Aggressive')).toBeInTheDocument()
        expect(screen.getByText('Very Aggressive')).toBeInTheDocument()
      })
    })

    it('should display risk warning', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Navigate to step 7
      for (let i = 0; i < 6; i++) {
        fireEvent.click(screen.getByText('Next'))
        await waitFor(() => {})
      }

      await waitFor(() => {
        expect(screen.getByText('Investment Risk Warning:')).toBeInTheDocument()
        expect(screen.getByText('Learn more about investment risks')).toBeInTheDocument()
      })
    })
  })

  describe('Step 10 - Risk Acceptance', () => {
    it('should require risk acceptance checkbox', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Navigate to step 10
      for (let i = 0; i < 9; i++) {
        fireEvent.click(screen.getByText('Next'))
        await waitFor(() => {})
      }

      await waitFor(() => {
        expect(screen.getByText('Important Risk Disclosure')).toBeInTheDocument()
      })

      // Next should be disabled without checkbox
      const nextButton = screen.getByText('Next')
      expect(nextButton).toBeDisabled()
    })

    it('should enable Next when risk acceptance is checked', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Navigate to step 10
      for (let i = 0; i < 9; i++) {
        fireEvent.click(screen.getByText('Next'))
        await waitFor(() => {})
      }

      await waitFor(() => {
        const checkbox = screen.getByLabelText(/I understand and accept the risks/)
        fireEvent.click(checkbox)
      })

      const nextButton = screen.getByText('Next')
      expect(nextButton).not.toBeDisabled()
    })
  })

  describe('Step 11 - Final Step', () => {
    it('should show Start Strategy button on final step', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      // Navigate to step 10 (Risk Acceptance)
      for (let i = 0; i < 9; i++) {
        fireEvent.click(screen.getByText('Next'))
        await waitFor(() => {})
      }

      // On step 10, check the risk acceptance checkbox to enable Next button
      await waitFor(() => {
        const checkbox = screen.getByLabelText(/I understand and accept the risks/)
        fireEvent.click(checkbox)
      })

      // Now navigate to final step (step 11)
      await waitFor(() => {
        const nextButton = screen.getByText('Next')
        fireEvent.click(nextButton)
      })

      await waitFor(() => {
        expect(screen.getByText('Ready to Start!')).toBeInTheDocument()
        expect(screen.getByRole('button', { name: /Start Strategy/ })).toBeInTheDocument()
      })
    })
  })

  describe('Template Loading', () => {
    it('should load Emergency Funds template correctly', async () => {
      // Set mock search params for emergency funds
      mockSearchParams = new URLSearchParams('objective=emergency-funds')
      
      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/yield/configure?objective=emergency-funds']}>
            <ObjectiveConfig />
          </MemoryRouter>
        )
      })

      // Navigate to step 2 to see strategy name
      fireEvent.click(screen.getByText('Next'))

      await waitFor(() => {
        // Check for strategy name input field with Emergency Funds value
        expect(screen.getByDisplayValue('Emergency Funds')).toBeInTheDocument()
      })
    })

    it('should load Free Coffee template correctly', async () => {
      // Set mock search params for free coffee
      mockSearchParams = new URLSearchParams('objective=free-coffee')
      
      await act(async () => {
        render(
          <MemoryRouter initialEntries={['/yield/configure?objective=free-coffee']}>
            <ObjectiveConfig />
          </MemoryRouter>
        )
      })

      // Navigate to step 2 to see strategy name
      fireEvent.click(screen.getByText('Next'))

      await waitFor(() => {
        // Check for strategy name input field with Free Coffee value
        expect(screen.getByDisplayValue('Free Coffee')).toBeInTheDocument()  
      })
    })
  })

  describe('Back Navigation', () => {
    it('should navigate back to yield page when back button is clicked', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <ObjectiveConfig />
          </BrowserRouter>
        )
      })

      const backButton = screen.getByText('Back to Yield')
      fireEvent.click(backButton)

      expect(mockNavigate).toHaveBeenCalledWith('/yield')
    })
  })
})