/**
 * Strategy Configuration Wizard Tests
 * Tests for the 8-step strategy configuration process
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import userEvent from '@testing-library/user-event'
import StrategyConfigurationWizard from '../StrategyConfigurationWizard.jsx'

// Mock dependencies
const mockNavigate = vi.fn()
const mockUseSearchParams = vi.fn(() => [new URLSearchParams()])

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => mockUseSearchParams()
  }
})

vi.mock('../../shared/PageHeader.jsx', () => ({
  default: ({ title, subtitle }) => (
    <div data-testid="page-header">
      <h1>{title}</h1>
      <p>{subtitle}</p>
    </div>
  )
}))

vi.mock('../../../hooks/transactions/index.js', () => ({
  useWalletBalance: () => ({ balance: { available: 10000, invested: 5000, strategy: 2000 } }),
  useTransactionFlow: () => ({ isProcessing: false }),
  useFeeCalculator: () => ({
    calculateFees: vi.fn().mockReturnValue({
      total: 5.50,
      breakdown: { diboas: 0.09, network: 0.001, dex: 5.00, provider: 0, defi: 0 }
    })
  })
}))

vi.mock('../../../services/strategies/StrategySearchEngine.js', () => ({
  default: {
    searchStrategies: vi.fn().mockResolvedValue({
      requiredAPY: 8.5,
      strategiesFound: 3,
      strategies: [
        {
          id: 'marinade-staking',
          name: 'Marinade Liquid Staking',
          protocol: 'Marinade Finance',
          chain: 'SOL',
          apy: { current: 7.0 },
          risk: 'low',
          score: 0.95
        },
        {
          id: 'aave-lending',
          name: 'Aave V3 Lending',
          protocol: 'Aave',
          chain: 'ETH',
          apy: { current: 4.2 },
          risk: 'low',
          score: 0.85
        }
      ],
      searchMetadata: {
        timestamp: new Date().toISOString(),
        searchDuration: 2000,
        chainsSearched: ['SOL', 'ETH', 'SUI']
      }
    })
  }
}))

vi.mock('../../../services/strategies/StrategyLifecycleManager.js', () => ({
  default: {
    launchStrategy: vi.fn().mockResolvedValue({
      success: true,
      strategyInstance: {
        id: 'strategy_123456_0001',
        status: 'running',
        initialAmount: 1000
      },
      transaction: {
        id: 'strategy_launch_123456_0001_1234567890',
        type: 'start_strategy',
        status: 'completed'
      },
      balanceChanges: {
        availableChange: -1005.50,
        strategyChange: 1000
      }
    })
  }
}))

describe('StrategyConfigurationWizard', () => {
  let user

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  const renderWizard = (searchParams = '') => {
    mockUseSearchParams.mockReturnValue([new URLSearchParams(searchParams)])
    return render(
      <BrowserRouter>
        <StrategyConfigurationWizard />
      </BrowserRouter>
    )
  }

  describe('Step 1: Name & Image', () => {
    test('renders step 1 with strategy name input', () => {
      renderWizard()

      expect(screen.getByText('Name & Image')).toBeInTheDocument()
      expect(screen.getByText('Step 1 of 8')).toBeInTheDocument()
      expect(screen.getByLabelText(/Strategy Name/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Strategy Image URL/)).toBeInTheDocument()
    })

    test('shows template information when template parameter is provided', () => {
      renderWizard('template=free-coffee')

      expect(screen.getByText('Free Coffee Template')).toBeInTheDocument()
      expect(screen.getByText(/Generate passive income to cover/)).toBeInTheDocument()
      expect(screen.getByText('low risk')).toBeInTheDocument()
    })

    test('validates required strategy name', async () => {
      renderWizard()

      const nextButton = screen.getByText('Next')
      await user.click(nextButton)

      expect(screen.getByText('Strategy name is required')).toBeInTheDocument()
    })

    test('proceeds to step 2 when valid name is entered', async () => {
      renderWizard()

      const nameInput = screen.getByLabelText(/Strategy Name/)
      await user.type(nameInput, 'My Test Strategy')

      const nextButton = screen.getByText('Next')
      await user.click(nextButton)

      expect(screen.getByText('Step 2 of 8')).toBeInTheDocument()
      expect(screen.getByText('Investment Amount')).toBeInTheDocument()
    })
  })

  describe('Step 2: Investment Amount', () => {
    beforeEach(async () => {
      renderWizard()
      
      // Navigate to step 2
      const nameInput = screen.getByLabelText(/Strategy Name/)
      await user.type(nameInput, 'Test Strategy')
      await user.click(screen.getByText('Next'))
    })

    test('renders investment amount inputs', () => {
      expect(screen.getByText('Investment Amount')).toBeInTheDocument()
      expect(screen.getByLabelText(/Initial Investment Amount/)).toBeInTheDocument()
      expect(screen.getByText(/Available Balance/)).toBeInTheDocument()
      expect(screen.getByText('$10,000.00')).toBeInTheDocument()
    })

    test('shows recurring investment options when checkbox is checked', async () => {
      const recurringCheckbox = screen.getByLabelText(/Add recurring investments/)
      await user.click(recurringCheckbox)

      expect(screen.getByLabelText(/Recurring Amount/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Frequency/)).toBeInTheDocument()
    })

    test('validates initial amount is required and positive', async () => {
      const nextButton = screen.getByText('Next')
      await user.click(nextButton)

      expect(screen.getByText('Initial amount must be greater than 0')).toBeInTheDocument()
    })

    test('validates sufficient balance', async () => {
      const amountInput = screen.getByLabelText(/Initial Investment Amount/)
      await user.type(amountInput, '15000') // More than available balance

      const nextButton = screen.getByText('Next')
      await user.click(nextButton)

      expect(screen.getByText(/Insufficient balance/)).toBeInTheDocument()
    })

    test('validates recurring amount when recurring is enabled', async () => {
      const amountInput = screen.getByLabelText(/Initial Investment Amount/)
      await user.type(amountInput, '1000')

      const recurringCheckbox = screen.getByLabelText(/Add recurring investments/)
      await user.click(recurringCheckbox)

      const nextButton = screen.getByText('Next')
      await user.click(nextButton)

      expect(screen.getByText('Recurring amount must be greater than 0')).toBeInTheDocument()
    })
  })

  describe('Step 3: Investment Goals', () => {
    beforeEach(async () => {
      renderWizard()
      
      // Navigate to step 3
      const nameInput = screen.getByLabelText(/Strategy Name/)
      await user.type(nameInput, 'Test Strategy')
      await user.click(screen.getByText('Next'))

      const amountInput = screen.getByLabelText(/Initial Investment Amount/)
      await user.type(amountInput, '1000')
      await user.click(screen.getByText('Next'))
    })

    test('renders goal type selection', () => {
      expect(screen.getByText('Investment Goals')).toBeInTheDocument()
      expect(screen.getByText(/Specific amount by specific date/)).toBeInTheDocument()
      expect(screen.getByText(/Regular income generation/)).toBeInTheDocument()
    })

    test('shows target date fields when target-date goal is selected', () => {
      // target-date should be selected by default
      expect(screen.getByLabelText(/Target Amount/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Target Date/)).toBeInTheDocument()
    })

    test('shows periodic income fields when periodic-income goal is selected', async () => {
      const periodicRadio = screen.getByLabelText(/Regular income generation/)
      await user.click(periodicRadio)

      expect(screen.getByLabelText(/Income Amount/)).toBeInTheDocument()
      expect(screen.getByLabelText(/Period/)).toBeInTheDocument()
    })

    test('validates target date goal fields', async () => {
      const nextButton = screen.getByText('Search Strategies')
      await user.click(nextButton)

      expect(screen.getByText('Target amount is required')).toBeInTheDocument()
      expect(screen.getByText('Target date is required')).toBeInTheDocument()
    })

    test('validates target date is in the future', async () => {
      const targetAmountInput = screen.getByLabelText(/Target Amount/)
      await user.type(targetAmountInput, '5000')

      const targetDateInput = screen.getByLabelText(/Target Date/)
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      await user.type(targetDateInput, yesterday.toISOString().split('T')[0])

      const nextButton = screen.getByText('Search Strategies')
      await user.click(nextButton)

      expect(screen.getByText('Target date must be in the future')).toBeInTheDocument()
    })
  })

  describe('Step 4: Strategy Search', () => {
    beforeEach(async () => {
      renderWizard()
      
      // Navigate to step 4
      const nameInput = screen.getByLabelText(/Strategy Name/)
      await user.type(nameInput, 'Test Strategy')
      await user.click(screen.getByText('Next'))

      const amountInput = screen.getByLabelText(/Initial Investment Amount/)
      await user.type(amountInput, '1000')
      await user.click(screen.getByText('Next'))

      const targetAmountInput = screen.getByLabelText(/Target Amount/)
      await user.type(targetAmountInput, '5000')

      const targetDateInput = screen.getByLabelText(/Target Date/)
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      await user.type(targetDateInput, futureDate.toISOString().split('T')[0])

      await user.click(screen.getByText('Search Strategies'))
    })

    test('shows search progress', () => {
      expect(screen.getByText('Finding Strategies')).toBeInTheDocument()
      expect(screen.getByText(/diBoaS is searching for the best DeFi strategies/)).toBeInTheDocument()
    })

    test('displays required APY information', async () => {
      await waitFor(() => {
        expect(screen.getByText(/Required APY:/)).toBeInTheDocument()
      })
    })
  })

  describe('Step 5: Strategy Selection', () => {
    beforeEach(async () => {
      renderWizard()
      
      // Navigate to step 5 by completing previous steps
      const nameInput = screen.getByLabelText(/Strategy Name/)
      await user.type(nameInput, 'Test Strategy')
      await user.click(screen.getByText('Next'))

      const amountInput = screen.getByLabelText(/Initial Investment Amount/)
      await user.type(amountInput, '1000')
      await user.click(screen.getByText('Next'))

      const targetAmountInput = screen.getByLabelText(/Target Amount/)
      await user.type(targetAmountInput, '5000')

      const targetDateInput = screen.getByLabelText(/Target Date/)
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      await user.type(targetDateInput, futureDate.toISOString().split('T')[0])

      await user.click(screen.getByText('Search Strategies'))

      // Wait for search to complete
      await waitFor(() => {
        expect(screen.getByText('Select Strategy')).toBeInTheDocument()
      })
    })

    test('displays found strategies', () => {
      expect(screen.getByText('Found 3 strategies matching your goals')).toBeInTheDocument()
      expect(screen.getByText('Marinade Liquid Staking')).toBeInTheDocument()
      expect(screen.getByText('Aave V3 Lending')).toBeInTheDocument()
    })

    test('allows strategy selection', async () => {
      const marinadeCard = screen.getByText('Marinade Liquid Staking').closest('.cursor-pointer')
      await user.click(marinadeCard)

      expect(marinadeCard).toHaveClass('ring-2', 'ring-blue-500', 'bg-blue-50')
    })

    test('validates strategy selection before proceeding', async () => {
      const nextButton = screen.getByText('Next')
      await user.click(nextButton)

      expect(screen.getByText('Please select a strategy')).toBeInTheDocument()
    })

    test('proceeds to review step when strategy is selected', async () => {
      const marinadeCard = screen.getByText('Marinade Liquid Staking').closest('.cursor-pointer')
      await user.click(marinadeCard)

      const nextButton = screen.getByText('Next')
      await user.click(nextButton)

      expect(screen.getByText('Review & Launch')).toBeInTheDocument()
    })
  })

  describe('Step 6: Review & Launch', () => {
    beforeEach(async () => {
      renderWizard()
      
      // Complete all steps to reach review
      const nameInput = screen.getByLabelText(/Strategy Name/)
      await user.type(nameInput, 'Test Strategy')
      await user.click(screen.getByText('Next'))

      const amountInput = screen.getByLabelText(/Initial Investment Amount/)
      await user.type(amountInput, '1000')
      await user.click(screen.getByText('Next'))

      const targetAmountInput = screen.getByLabelText(/Target Amount/)
      await user.type(targetAmountInput, '5000')
      const targetDateInput = screen.getByLabelText(/Target Date/)
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      await user.type(targetDateInput, futureDate.toISOString().split('T')[0])
      await user.click(screen.getByText('Search Strategies'))

      await waitFor(() => {
        expect(screen.getByText('Select Strategy')).toBeInTheDocument()
      })

      const marinadeCard = screen.getByText('Marinade Liquid Staking').closest('.cursor-pointer')
      await user.click(marinadeCard)
      await user.click(screen.getByText('Next'))
    })

    test('displays strategy summary', () => {
      expect(screen.getByText('Review & Launch')).toBeInTheDocument()
      expect(screen.getByText('Test Strategy')).toBeInTheDocument()
      expect(screen.getByText('Marinade Liquid Staking')).toBeInTheDocument()
      expect(screen.getByText('Marinade Finance')).toBeInTheDocument()
      expect(screen.getByText('SOL')).toBeInTheDocument()
    })

    test('displays investment details', () => {
      expect(screen.getByText('Initial Investment:')).toBeInTheDocument()
      expect(screen.getByText('$1,000.00')).toBeInTheDocument()
    })

    test('displays fee breakdown', () => {
      expect(screen.getByText('Fee Breakdown')).toBeInTheDocument()
      expect(screen.getByText('diBoaS Fee (0.09%):')).toBeInTheDocument()
      expect(screen.getByText('Network Fee:')).toBeInTheDocument()
      expect(screen.getByText('DEX Fee (0.5%):')).toBeInTheDocument()
      expect(screen.getByText('Total Fees:')).toBeInTheDocument()
    })

    test('launches strategy when Launch Strategy button is clicked', async () => {
      const launchButton = screen.getByText('Launch Strategy')
      await user.click(launchButton)

      expect(screen.getByText('Launching Strategy')).toBeInTheDocument()
      expect(screen.getByText(/Deploying to Marinade Finance/)).toBeInTheDocument()
    })
  })

  describe('Step 7: Launching', () => {
    test('shows launch progress and success', async () => {
      renderWizard()
      
      // Navigate through all steps quickly (mocked)
      const nameInput = screen.getByLabelText(/Strategy Name/)
      await user.type(nameInput, 'Test Strategy')
      await user.click(screen.getByText('Next'))

      const amountInput = screen.getByLabelText(/Initial Investment Amount/)
      await user.type(amountInput, '1000')
      await user.click(screen.getByText('Next'))

      const targetAmountInput = screen.getByLabelText(/Target Amount/)
      await user.type(targetAmountInput, '5000')
      const targetDateInput = screen.getByLabelText(/Target Date/)
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      await user.type(targetDateInput, futureDate.toISOString().split('T')[0])
      await user.click(screen.getByText('Search Strategies'))

      await waitFor(() => {
        expect(screen.getByText('Select Strategy')).toBeInTheDocument()
      })

      const marinadeCard = screen.getByText('Marinade Liquid Staking').closest('.cursor-pointer')
      await user.click(marinadeCard)
      await user.click(screen.getByText('Next'))

      const launchButton = screen.getByText('Launch Strategy')
      await user.click(launchButton)

      // Should show launching state
      expect(screen.getByText('Launching Strategy')).toBeInTheDocument()

      // Wait for success
      await waitFor(() => {
        expect(screen.getByText('Strategy Launched Successfully! 🎉')).toBeInTheDocument()
      })
    })
  })

  describe('Step 8: Success', () => {
    test('shows success state and navigation options', async () => {
      renderWizard()
      
      // Complete full flow (abbreviated for test)
      const nameInput = screen.getByLabelText(/Strategy Name/)
      await user.type(nameInput, 'Test Strategy')
      await user.click(screen.getByText('Next'))

      const amountInput = screen.getByLabelText(/Initial Investment Amount/)
      await user.type(amountInput, '1000')
      await user.click(screen.getByText('Next'))

      const targetAmountInput = screen.getByLabelText(/Target Amount/)
      await user.type(targetAmountInput, '5000')
      const targetDateInput = screen.getByLabelText(/Target Date/)
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      await user.type(targetDateInput, futureDate.toISOString().split('T')[0])
      await user.click(screen.getByText('Search Strategies'))

      await waitFor(() => {
        expect(screen.getByText('Select Strategy')).toBeInTheDocument()
      })

      const marinadeCard = screen.getByText('Marinade Liquid Staking').closest('.cursor-pointer')
      await user.click(marinadeCard)
      await user.click(screen.getByText('Next'))

      const launchButton = screen.getByText('Launch Strategy')
      await user.click(launchButton)

      // Wait for complete success
      await waitFor(() => {
        expect(screen.getByText('Strategy is Running!')).toBeInTheDocument()
      })

      expect(screen.getByText('Test Strategy')).toBeInTheDocument()
      expect(screen.getByText('Running')).toBeInTheDocument()
      expect(screen.getByText('View All Strategies')).toBeInTheDocument()
      expect(screen.getByText('View Transaction History')).toBeInTheDocument()
    })

    test('navigates correctly from success page', async () => {
      renderWizard()
      
      // Complete full flow to success
      const nameInput = screen.getByLabelText(/Strategy Name/)
      await user.type(nameInput, 'Test Strategy')
      await user.click(screen.getByText('Next'))

      const amountInput = screen.getByLabelText(/Initial Investment Amount/)
      await user.type(amountInput, '1000')
      await user.click(screen.getByText('Next'))

      const targetAmountInput = screen.getByLabelText(/Target Amount/)
      await user.type(targetAmountInput, '5000')
      const targetDateInput = screen.getByLabelText(/Target Date/)
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      await user.type(targetDateInput, futureDate.toISOString().split('T')[0])
      await user.click(screen.getByText('Search Strategies'))

      await waitFor(() => {
        expect(screen.getByText('Select Strategy')).toBeInTheDocument()
      })

      const marinadeCard = screen.getByText('Marinade Liquid Staking').closest('.cursor-pointer')
      await user.click(marinadeCard)
      await user.click(screen.getByText('Next'))

      const launchButton = screen.getByText('Launch Strategy')
      await user.click(launchButton)

      await waitFor(() => {
        expect(screen.getByText('Strategy is Running!')).toBeInTheDocument()
      })

      // Test navigation
      const viewStrategiesButton = screen.getByText('View All Strategies')
      await user.click(viewStrategiesButton)
      expect(mockNavigate).toHaveBeenCalledWith('/category/yield')

      const viewHistoryButton = screen.getByText('View Transaction History')
      await user.click(viewHistoryButton)
      expect(mockNavigate).toHaveBeenCalledWith('/account')
    })
  })

  describe('Navigation and Progress', () => {
    test('shows correct progress throughout wizard', async () => {
      renderWizard()

      // Step 1
      expect(screen.getByText('Step 1 of 8')).toBeInTheDocument()
      expect(screen.getByText('12% Complete')).toBeInTheDocument()

      // Navigate to step 2
      const nameInput = screen.getByLabelText(/Strategy Name/)
      await user.type(nameInput, 'Test Strategy')
      await user.click(screen.getByText('Next'))

      expect(screen.getByText('Step 2 of 8')).toBeInTheDocument()
      expect(screen.getByText('25% Complete')).toBeInTheDocument()
    })

    test('allows going back to previous steps', async () => {
      renderWizard()

      // Navigate to step 2
      const nameInput = screen.getByLabelText(/Strategy Name/)
      await user.type(nameInput, 'Test Strategy')
      await user.click(screen.getByText('Next'))

      // Go back to step 1
      const previousButton = screen.getByText('Previous')
      await user.click(previousButton)

      expect(screen.getByText('Step 1 of 8')).toBeInTheDocument()
      expect(screen.getByText('Name & Image')).toBeInTheDocument()
    })

    test('disables Previous button on step 1', () => {
      renderWizard()

      const previousButton = screen.getByText('Previous')
      expect(previousButton).toBeDisabled()
    })
  })

  describe('Error Handling', () => {
    test('handles search engine errors gracefully', async () => {
      // Mock search failure
      const StrategySearchEngine = await import('../../../services/strategies/StrategySearchEngine.js')
      StrategySearchEngine.default.searchStrategies = vi.fn().mockRejectedValue(new Error('Search failed'))

      renderWizard()
      
      // Navigate to search step
      const nameInput = screen.getByLabelText(/Strategy Name/)
      await user.type(nameInput, 'Test Strategy')
      await user.click(screen.getByText('Next'))

      const amountInput = screen.getByLabelText(/Initial Investment Amount/)
      await user.type(amountInput, '1000')
      await user.click(screen.getByText('Next'))

      const targetAmountInput = screen.getByLabelText(/Target Amount/)
      await user.type(targetAmountInput, '5000')
      const targetDateInput = screen.getByLabelText(/Target Date/)
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      await user.type(targetDateInput, futureDate.toISOString().split('T')[0])

      await user.click(screen.getByText('Search Strategies'))

      await waitFor(() => {
        expect(screen.getByText(/Search failed/)).toBeInTheDocument()
      })
    })

    test('handles launch failures gracefully', async () => {
      // Mock launch failure
      const StrategyLifecycleManager = await import('../../../services/strategies/StrategyLifecycleManager.js')
      StrategyLifecycleManager.default.launchStrategy = vi.fn().mockResolvedValue({
        success: false,
        error: 'Insufficient balance'
      })

      renderWizard()
      
      // Complete flow to launch
      const nameInput = screen.getByLabelText(/Strategy Name/)
      await user.type(nameInput, 'Test Strategy')
      await user.click(screen.getByText('Next'))

      const amountInput = screen.getByLabelText(/Initial Investment Amount/)
      await user.type(amountInput, '1000')
      await user.click(screen.getByText('Next'))

      const targetAmountInput = screen.getByLabelText(/Target Amount/)
      await user.type(targetAmountInput, '5000')
      const targetDateInput = screen.getByLabelText(/Target Date/)
      const futureDate = new Date()
      futureDate.setFullYear(futureDate.getFullYear() + 1)
      await user.type(targetDateInput, futureDate.toISOString().split('T')[0])
      await user.click(screen.getByText('Search Strategies'))

      await waitFor(() => {
        expect(screen.getByText('Select Strategy')).toBeInTheDocument()
      })

      const marinadeCard = screen.getByText('Marinade Liquid Staking').closest('.cursor-pointer')
      await user.click(marinadeCard)
      await user.click(screen.getByText('Next'))

      const launchButton = screen.getByText('Launch Strategy')
      await user.click(launchButton)

      await waitFor(() => {
        expect(screen.getByText('Launch Failed')).toBeInTheDocument()
        expect(screen.getByText('Insufficient balance')).toBeInTheDocument()
      })
    })
  })
})