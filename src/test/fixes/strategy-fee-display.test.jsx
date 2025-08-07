/**
 * Component Tests for Strategy Fee Display Bug Fixes
 * Tests fee breakdown visibility and decimal formatting
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import StrategyConfigurationWizard from '../../components/yield/StrategyConfigurationWizard.jsx'
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
    available: 1000
  })
}))

vi.mock('../../hooks/transactions/useFeeCalculator.js', () => ({
  useFeeCalculator: () => ({
    calculateFees: vi.fn(),
    isCalculating: false
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

// Mock React Router hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn(),
    useSearchParams: () => [new URLSearchParams(), vi.fn()]
  }
})

describe('Strategy Fee Display Bug Fixes', () => {
  let mockCalculateFees
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
    
    dataManager.getState.mockReturnValue({
      balance: { availableForSpending: 1000 }
    })
    
    const useFeeCalculator = require('../../hooks/transactions/useFeeCalculator.js').useFeeCalculator
    const StrategySearchEngine = require('../../services/strategies/StrategySearchEngine.js').default
    const StrategyLifecycleManager = require('../../services/strategies/StrategyLifecycleManager.js').default
    
    mockCalculateFees = vi.fn()
    mockSearchStrategies = vi.fn()
    mockLaunchStrategy = vi.fn()
    
    useFeeCalculator.mockReturnValue({
      calculateFees: mockCalculateFees,
      isCalculating: false
    })
    
    StrategySearchEngine.searchStrategies = mockSearchStrategies
    StrategyLifecycleManager.launchStrategy = mockLaunchStrategy
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Fee Breakdown Visibility', () => {
    it('should always show fee breakdown card even when calculating', async () => {
      // Mock fee calculation as in progress
      const useFeeCalculator = require('../../hooks/transactions/useFeeCalculator.js').useFeeCalculator
      useFeeCalculator.mockReturnValue({
        calculateFees: mockCalculateFees,
        isCalculating: true // Still calculating
      })
      
      renderWithRouter(<StrategyConfigurationWizard />)
      
      // Navigate to step 6 where fees are shown
      const nextButtons = screen.getAllByText(/Next/i)
      if (nextButtons.length > 0) {
        // Navigate through steps to reach fee display
        for (let i = 0; i < 5; i++) {
          const nextButton = screen.queryByText(/Next/i)
          if (nextButton && !nextButton.disabled) {
            fireEvent.click(nextButton)
            await waitFor(() => {}, { timeout: 100 })
          }
        }
      }
      
      // Fee breakdown card should be visible even while calculating
      await waitFor(() => {
        expect(screen.getByText('Fee Breakdown')).toBeInTheDocument()
        expect(screen.getByText('Calculating fees...')).toBeInTheDocument()
      })
    })

    it('should show fee breakdown details when fees are calculated', async () => {
      // Mock calculated fees
      mockCalculateFees.mockReturnValue({
        breakdown: {
          diboas: 4.5432,
          network: 0.0567,
          dex: 2.3456,
          provider: 1.2345,
          defi: 0.8765
        },
        total: 9.0565
      })
      
      const useFeeCalculator = require('../../hooks/transactions/useFeeCalculator.js').useFeeCalculator
      useFeeCalculator.mockReturnValue({
        calculateFees: mockCalculateFees,
        isCalculating: false,
        feeBreakdown: {
          breakdown: {
            diboas: 4.5432,
            network: 0.0567, 
            dex: 2.3456,
            provider: 1.2345,
            defi: 0.8765
          },
          total: 9.0565
        }
      })
      
      renderWithRouter(<StrategyConfigurationWizard />)
      
      // The fee breakdown should be visible with calculated values
      await waitFor(() => {
        expect(screen.getByText('Fee Breakdown')).toBeInTheDocument()
        // Should not show calculating message
        expect(screen.queryByText('Calculating fees...')).not.toBeInTheDocument()
      })
    })

    it('should show fee breakdown card even with zero fees', async () => {
      mockCalculateFees.mockReturnValue({
        breakdown: {
          diboas: 0,
          network: 0,
          dex: 0,
          provider: 0,
          defi: 0
        },
        total: 0
      })
      
      const useFeeCalculator = require('../../hooks/transactions/useFeeCalculator.js').useFeeCalculator
      useFeeCalculator.mockReturnValue({
        calculateFees: mockCalculateFees,
        isCalculating: false,
        feeBreakdown: {
          breakdown: {
            diboas: 0,
            network: 0,
            dex: 0,
            provider: 0,
            defi: 0
          },
          total: 0
        }
      })
      
      renderWithRouter(<StrategyConfigurationWizard />)
      
      await waitFor(() => {
        expect(screen.getByText('Fee Breakdown')).toBeInTheDocument()
      })
    })
  })

  describe('Decimal Place Formatting', () => {
    it('should display all fees with exactly 2 decimal places', async () => {
      // Mock fees with various decimal places
      const mockFees = {
        breakdown: {
          diboas: 4.5432,    // Should become $4.54
          network: 0.0567,   // Should become $0.06  
          dex: 2.3456789,    // Should become $2.35
          provider: 1.2,     // Should become $1.20
          defi: 0.87654321   // Should become $0.88
        },
        total: 9.0565789     // Should become $9.06
      }
      
      mockCalculateFees.mockReturnValue(mockFees)
      
      const useFeeCalculator = require('../../hooks/transactions/useFeeCalculator.js').useFeeCalculator
      useFeeCalculator.mockReturnValue({
        calculateFees: mockCalculateFees,
        isCalculating: false,
        feeBreakdown: mockFees
      })
      
      renderWithRouter(<StrategyConfigurationWizard />)
      
      await waitFor(() => {
        // Check that all fees are displayed with exactly 2 decimal places
        expect(screen.getByText(/\$4\.54/)).toBeInTheDocument() // diboas fee
        expect(screen.getByText(/\$0\.06/)).toBeInTheDocument() // network fee  
        expect(screen.getByText(/\$2\.35/)).toBeInTheDocument() // dex fee
        expect(screen.getByText(/\$1\.20/)).toBeInTheDocument() // provider fee
        expect(screen.getByText(/\$0\.88/)).toBeInTheDocument() // defi fee
        expect(screen.getByText(/\$9\.06/)).toBeInTheDocument() // total fee
      })
    })

    it('should handle edge case decimal values correctly', async () => {
      const mockFees = {
        breakdown: {
          diboas: 0.999,     // Should round to $1.00
          network: 0.001,    // Should round to $0.00
          dex: 1.995,        // Should round to $2.00  
          provider: 0.005,   // Should round to $0.01
          defi: 0.004        // Should round to $0.00
        },
        total: 3.004         // Should round to $3.00
      }
      
      mockCalculateFees.mockReturnValue(mockFees)
      
      const useFeeCalculator = require('../../hooks/transactions/useFeeCalculator.js').useFeeCalculator
      useFeeCalculator.mockReturnValue({
        calculateFees: mockCalculateFees,
        isCalculating: false,
        feeBreakdown: mockFees
      })
      
      renderWithRouter(<StrategyConfigurationWizard />)
      
      await waitFor(() => {
        expect(screen.getByText(/\$1\.00/)).toBeInTheDocument() // diboas fee rounded up
        expect(screen.getByText(/\$0\.00/)).toBeInTheDocument() // network fee rounded down
        expect(screen.getByText(/\$2\.00/)).toBeInTheDocument() // dex fee rounded up
        expect(screen.getByText(/\$0\.01/)).toBeInTheDocument() // provider fee rounded up  
        expect(screen.getByText(/\$3\.00/)).toBeInTheDocument() // total fee
      })
    })

    it('should handle null/undefined fee values gracefully', async () => {
      const mockFees = {
        breakdown: {
          diboas: null,
          network: undefined,
          dex: NaN,
          provider: 1.23,
          defi: 0
        },
        total: undefined
      }
      
      mockCalculateFees.mockReturnValue(mockFees)
      
      const useFeeCalculator = require('../../hooks/transactions/useFeeCalculator.js').useFeeCalculator
      useFeeCalculator.mockReturnValue({
        calculateFees: mockCalculateFees,
        isCalculating: false,
        feeBreakdown: mockFees
      })
      
      renderWithRouter(<StrategyConfigurationWizard />)
      
      // Should not crash and should show default values
      await waitFor(() => {
        expect(screen.getByText('Fee Breakdown')).toBeInTheDocument()
        // Should show $0.00 for invalid values
        expect(screen.getByText(/\$0\.00/)).toBeInTheDocument()
        expect(screen.getByText(/\$1\.23/)).toBeInTheDocument() // Valid provider fee
      })
    })
  })

  describe('Loading States', () => {
    it('should show calculating message while fees are being computed', async () => {
      const useFeeCalculator = require('../../hooks/transactions/useFeeCalculator.js').useFeeCalculator
      useFeeCalculator.mockReturnValue({
        calculateFees: mockCalculateFees,
        isCalculating: true,
        feeBreakdown: null
      })
      
      renderWithRouter(<StrategyConfigurationWizard />)
      
      await waitFor(() => {
        expect(screen.getByText('Fee Breakdown')).toBeInTheDocument()
        expect(screen.getByText('Calculating fees...')).toBeInTheDocument()
      })
    })

    it('should transition from loading to showing fees', async () => {
      const useFeeCalculator = require('../../hooks/transactions/useFeeCalculator.js').useFeeCalculator
      
      // Initially calculating
      useFeeCalculator.mockReturnValue({
        calculateFees: mockCalculateFees,
        isCalculating: true,
        feeBreakdown: null
      })
      
      const { rerender } = renderWithRouter(<StrategyConfigurationWizard />)
      
      await waitFor(() => {
        expect(screen.getByText('Calculating fees...')).toBeInTheDocument()
      })
      
      // Simulate fee calculation completion
      useFeeCalculator.mockReturnValue({
        calculateFees: mockCalculateFees,
        isCalculating: false,
        feeBreakdown: {
          breakdown: {
            diboas: 1.23,
            network: 0.05,
            dex: 0.67,
            provider: 0,
            defi: 0
          },
          total: 1.95
        }
      })
      
      rerender(
        <BrowserRouter>
          <StrategyConfigurationWizard />
        </BrowserRouter>
      )
      
      await waitFor(() => {
        expect(screen.queryByText('Calculating fees...')).not.toBeInTheDocument()
        expect(screen.getByText(/\$1\.23/)).toBeInTheDocument()
        expect(screen.getByText(/\$1\.95/)).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle fee calculation errors gracefully', async () => {
      mockCalculateFees.mockImplementation(() => {
        throw new Error('Fee calculation failed')
      })
      
      const useFeeCalculator = require('../../hooks/transactions/useFeeCalculator.js').useFeeCalculator
      useFeeCalculator.mockReturnValue({
        calculateFees: mockCalculateFees,
        isCalculating: false,
        feeBreakdown: null,
        error: 'Fee calculation failed'
      })
      
      renderWithRouter(<StrategyConfigurationWizard />)
      
      // Should still show fee breakdown card
      await waitFor(() => {
        expect(screen.getByText('Fee Breakdown')).toBeInTheDocument()
        // Should show some indication of error or fallback state
        expect(screen.getByText('Calculating fees...')).toBeInTheDocument()
      })
    })

    it('should handle malformed fee data', async () => {
      const malformedFees = {
        breakdown: "not an object",
        total: "not a number"
      }
      
      mockCalculateFees.mockReturnValue(malformedFees)
      
      const useFeeCalculator = require('../../hooks/transactions/useFeeCalculator.js').useFeeCalculator
      useFeeCalculator.mockReturnValue({
        calculateFees: mockCalculateFees,
        isCalculating: false,
        feeBreakdown: malformedFees
      })
      
      renderWithRouter(<StrategyConfigurationWizard />)
      
      // Should not crash
      await waitFor(() => {
        expect(screen.getByText('Fee Breakdown')).toBeInTheDocument()
      })
    })
  })

  describe('Accessibility and UX', () => {
    it('should maintain proper ARIA labels for fee breakdown', async () => {
      const mockFees = {
        breakdown: {
          diboas: 1.50,
          network: 0.25,
          dex: 0.75,
          provider: 0,
          defi: 0
        },
        total: 2.50
      }
      
      const useFeeCalculator = require('../../hooks/transactions/useFeeCalculator.js').useFeeCalculator
      useFeeCalculator.mockReturnValue({
        calculateFees: mockCalculateFees,
        isCalculating: false,
        feeBreakdown: mockFees
      })
      
      renderWithRouter(<StrategyConfigurationWizard />)
      
      await waitFor(() => {
        const feeBreakdown = screen.getByText('Fee Breakdown')
        expect(feeBreakdown).toBeInTheDocument()
        // Should be properly structured for screen readers
        expect(feeBreakdown.closest('[role="region"]') || feeBreakdown.closest('section')).toBeTruthy()
      })
    })
  })
})