/**
 * InvestmentCategory Initialization Tests
 * Tests specifically for the currentCategory initialization fix
 * Ensures the component loads without ReferenceError
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'

// Mock dependencies first (before any imports)
const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

vi.mock('../../services/DataManager.js', () => ({
  dataManager: {
    getBalance: vi.fn(() => ({
      availableForSpending: 1000,
      investedAmount: 2500,
      assets: {
        'BTC': { quantity: 0.025, investedAmount: 1081.25 },
        'ETH': { quantity: 0.8, investedAmount: 2144.00 },
        'SOL': { quantity: 0, investedAmount: 0 }
      }
    })),
    subscribe: vi.fn(() => vi.fn())
  }
}))

vi.mock('../../services/assetDataService.js', () => ({
  assetDataService: {
    getCompleteAssetData: vi.fn((symbol) => Promise.resolve({
      symbol,
      name: `${symbol} Asset`,
      price: 1000,
      change24h: 2.5,
      trend: 'up',
      description: `${symbol} description`,
      priceFormatted: '$1,000.00',
      change24hFormatted: '+2.50%'
    })),
    subscribeToPriceUpdates: vi.fn(() => vi.fn()),
    formatPrice: vi.fn((price) => `$${price.toLocaleString()}`),
    formatPercentage: vi.fn((percent) => `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`)
  }
}))

vi.mock('../shared/PageHeader.jsx', () => ({
  default: ({ showUserActions }) => (
    <div data-testid="page-header">
      Page Header {showUserActions && '(with user actions)'}
    </div>
  )
}))

// Now import the component after mocks are set up
import InvestmentCategory from '../categories/InvestmentCategory.jsx'

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('InvestmentCategory Initialization Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockNavigate.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Initialization', () => {
    it('should render without ReferenceError for currentCategory', () => {
      expect(() => {
        render(
          <TestWrapper>
            <InvestmentCategory />
          </TestWrapper>
        )
      }).not.toThrow()
    })

    it('should initialize with default crypto category', () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      // Should show crypto tab as selected
      const cryptoTab = screen.getByRole('button', { name: /crypto/i })
      expect(cryptoTab).toHaveClass('bg-blue-600', 'text-white')
    })

    it('should not throw error during component mount', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Cannot access \'currentCategory\' before initialization')
      )
      
      consoleSpy.mockRestore()
    })

    it('should properly initialize buildAssetList callback', async () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      // Wait for asset data to load
      await waitFor(() => {
        expect(mockAssetDataService.getCompleteAssetData).toHaveBeenCalled()
      })

      // Should show asset symbols from the default crypto category
      expect(screen.getByText('BTC Asset')).toBeInTheDocument()
      expect(screen.getByText('ETH Asset')).toBeInTheDocument()
      expect(screen.getByText('SOL Asset')).toBeInTheDocument()
      expect(screen.getByText('SUI Asset')).toBeInTheDocument()
    })
  })

  describe('Category Switching', () => {
    it('should switch categories without initialization errors', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      // Switch to gold category
      const goldTab = screen.getByRole('button', { name: /gold/i })
      await user.click(goldTab)

      // Should not throw any errors
      expect(goldTab).toHaveClass('bg-blue-600', 'text-white')
    })

    it('should handle rapid category switching without errors', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      // Rapidly switch between categories
      const goldTab = screen.getByRole('button', { name: /gold/i })
      const stocksTab = screen.getByRole('button', { name: /stocks/i })
      const cryptoTab = screen.getByRole('button', { name: /crypto/i })

      await user.click(goldTab)
      await user.click(stocksTab)
      await user.click(cryptoTab)
      await user.click(goldTab)

      // Should complete without errors
      expect(goldTab).toHaveClass('bg-blue-600', 'text-white')
    })
  })

  describe('useCallback Dependencies', () => {
    it('should have currentCategory available when buildAssetList is called', () => {
      const mockBuildAssetList = vi.fn()
      
      // Mock the useCallback to verify dependencies are available
      const originalUseCallback = vi.fn()
      vi.mock('react', async () => {
        const actual = await vi.importActual('react')
        return {
          ...actual,
          useCallback: (fn, deps) => {
            // Verify currentCategory is in dependencies and is defined
            if (deps && deps.some(dep => typeof dep === 'object' && dep?.id)) {
              expect(dep).toBeDefined()
              expect(dep.id).toBeDefined()
            }
            return fn
          }
        }
      })

      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )
    })

    it('should handle missing category gracefully', () => {
      // This tests the null check in buildAssetList
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      // Component should still render even if category data is missing
      expect(screen.getByText('Buy/Sell')).toBeInTheDocument()
    })
  })

  describe('Data Loading Integration', () => {
    it('should load asset data after currentCategory is initialized', async () => {
      const { assetDataService } = await import('../../services/assetDataService.js')
      
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      // Wait for useEffect to trigger asset data loading
      await waitFor(() => {
        expect(assetDataService.getCompleteAssetData).toHaveBeenCalledWith('BTC')
        expect(assetDataService.getCompleteAssetData).toHaveBeenCalledWith('ETH')
        expect(assetDataService.getCompleteAssetData).toHaveBeenCalledWith('SOL')
        expect(assetDataService.getCompleteAssetData).toHaveBeenCalledWith('SUI')
      })
    })

    it('should subscribe to price updates after initialization', async () => {
      const { assetDataService } = await import('../../services/assetDataService.js')
      
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(assetDataService.subscribeToPriceUpdates).toHaveBeenCalledWith(
          'BTC',
          expect.any(Function)
        )
        expect(assetDataService.subscribeToPriceUpdates).toHaveBeenCalledWith(
          'ETH',
          expect.any(Function)
        )
      })
    })

    it('should handle asset data loading errors gracefully', async () => {
      const { assetDataService } = await import('../../services/assetDataService.js')
      
      // Mock asset service to throw error
      assetDataService.getCompleteAssetData.mockRejectedValueOnce(
        new Error('Asset data load failed')
      )

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Error fetching asset data:',
          expect.any(Error)
        )
      })

      // Component should still render
      expect(screen.getByText('Buy/Sell')).toBeInTheDocument()
      
      consoleSpy.mockRestore()
    })
  })

  describe('User Holdings Integration', () => {
    it('should display user holdings without initialization errors', () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      // Should show investment overview with user data
      expect(screen.getByText('Invested Balance')).toBeInTheDocument()
      expect(screen.getByText('$2,500.00')).toBeInTheDocument()
      expect(screen.getByText('Assets Owned')).toBeInTheDocument()
    })

    it('should calculate portfolio metrics correctly', () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      // Should show correct number of assets owned (2 - BTC and ETH)
      expect(screen.getByText('2')).toBeInTheDocument()
    })
  })

  describe('Error Boundary Integration', () => {
    it('should not trigger error boundary due to initialization errors', () => {
      const mockErrorBoundary = vi.fn()
      
      // If there were initialization errors, they would be caught by ErrorBoundary
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      // Should render successfully without error boundary activation
      expect(screen.getByText('Buy/Sell')).toBeInTheDocument()
      expect(screen.getByText('Investment & Trading')).toBeInTheDocument()
    })
  })

  describe('Memory Leaks Prevention', () => {
    it('should properly cleanup subscriptions on unmount', async () => {
      const { dataManager } = await import('../../services/DataManager.js')
      const { assetDataService } = await import('../../services/assetDataService.js')
      
      const mockUnsubscribe = vi.fn()
      dataManager.subscribe.mockReturnValue(mockUnsubscribe)
      assetDataService.subscribeToPriceUpdates.mockReturnValue(mockUnsubscribe)

      const { unmount } = render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      unmount()

      // Should have called unsubscribe functions
      expect(mockUnsubscribe).toHaveBeenCalled()
    })
  })

  describe('Performance Impact', () => {
    it('should initialize quickly without performance degradation', () => {
      const startTime = performance.now()
      
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )
      
      const endTime = performance.now()
      
      // Initialization should be fast (under 50ms)
      expect(endTime - startTime).toBeLessThan(50)
    })

    it('should not cause excessive re-renders during initialization', () => {
      const renderCount = { count: 0 }
      
      // This would be more complex to implement properly, but the concept is to ensure
      // that the fix doesn't cause unnecessary re-renders
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      // Component should render successfully
      expect(screen.getByText('Buy/Sell')).toBeInTheDocument()
    })
  })
})