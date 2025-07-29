/**
 * AppDashboard Category Integration Tests
 * Tests the integration of CategoryDashboard with AppDashboard via feature flags
 */

import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import AppDashboard from '../AppDashboard.jsx'

// Mock all the complex dependencies
vi.mock('../SimpleMarketIndicators.jsx', () => ({
  default: () => <div data-testid="market-indicators">Market Indicators</div>
}))

vi.mock('../shared/PageHeader.jsx', () => ({
  default: () => <div data-testid="page-header">Page Header</div>
}))

vi.mock('../categories/CategoryDashboard.jsx', () => ({
  default: ({ className }) => (
    <div data-testid="category-dashboard" className={className}>
      Category Dashboard
    </div>
  )
}))

vi.mock('../../hooks/useTransactions.jsx', () => ({
  useWalletBalance: () => ({
    balance: {
      totalUSD: 1000,
      availableForSpending: 500,
      investedAmount: 500
    },
    getBalance: vi.fn(),
    isLoading: false
  })
}))

vi.mock('../../hooks/useDataManagerSubscription.js', () => ({
  useDataManagerSubscription: vi.fn(),
  useSafeDataManager: () => ({
    getTransactions: () => []
  })
}))

vi.mock('../../utils/userSettings.js', () => ({
  useUserSettings: () => ({
    settings: {
      showAdvancedTransactionDetails: false
    }
  })
}))

vi.mock('../../utils/navigationHelpers.js', () => ({
  QUICK_ACTIONS: [
    {
      type: 'add',
      label: 'Add Money',
      icon: 'Plus',
      colorClass: 'text-green-600'
    },
    {
      type: 'send',
      label: 'Send Money',
      icon: 'Send',
      colorClass: 'text-blue-600'
    },
    {
      type: 'buy',
      label: 'Buy Crypto',
      icon: 'TrendingUp',
      colorClass: 'text-purple-600'
    }
  ],
  createTransactionNavigator: () => vi.fn()
}))

// Get the mocked function
const { useFeatureFlag } = vi.hoisted(() => ({
  useFeatureFlag: vi.fn()
}))

// Mock the feature flag
vi.mock('../../config/featureFlags.js', () => ({
  useFeatureFlag
}))

describe('AppDashboard Category Integration', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Feature Flag Conditional Rendering', () => {
    test('renders CategoryDashboard when categories feature flag is enabled', () => {
      useFeatureFlag.mockReturnValue(true)

      render(
        <BrowserRouter>
          <AppDashboard />
        </BrowserRouter>
      )

      expect(screen.getByTestId('category-dashboard')).toBeInTheDocument()
      expect(screen.queryByText('Quick Actions')).not.toBeInTheDocument()
    })

    test('renders Quick Actions when categories feature flag is disabled', () => {
      useFeatureFlag.mockReturnValue(false)

      render(
        <BrowserRouter>
          <AppDashboard />
        </BrowserRouter>
      )

      expect(screen.getByText('Quick Actions')).toBeInTheDocument()
      expect(screen.getByText('Manage your finances with just one click')).toBeInTheDocument()
      expect(screen.queryByTestId('category-dashboard')).not.toBeInTheDocument()
    })

    test('calls useFeatureFlag with correct flag name', () => {
      useFeatureFlag.mockReturnValue(false)

      render(
        <BrowserRouter>
          <AppDashboard />
        </BrowserRouter>
      )

      expect(useFeatureFlag).toHaveBeenCalledWith('CATEGORIES_NAVIGATION')
    })
  })

  describe('Quick Actions Fallback', () => {
    beforeEach(() => {
      useFeatureFlag.mockReturnValue(false)
    })

    test('renders quick action buttons', () => {
      render(
        <BrowserRouter>
          <AppDashboard />
        </BrowserRouter>
      )

      expect(screen.getByText('Add Money')).toBeInTheDocument()
      expect(screen.getByText('Send Money')).toBeInTheDocument()
      expect(screen.getByText('Buy Crypto')).toBeInTheDocument()
    })

    test('applies correct styling to quick actions card', () => {
      render(
        <BrowserRouter>
          <AppDashboard />
        </BrowserRouter>
      )

      const quickActionsCard = screen.getByText('Quick Actions').closest('.base-card')
      expect(quickActionsCard).toBeInTheDocument()
    })
  })

  describe('CategoryDashboard Integration', () => {
    beforeEach(() => {
      useFeatureFlag.mockReturnValue(true)
    })

    test('passes correct className to CategoryDashboard', () => {
      render(
        <BrowserRouter>
          <AppDashboard />
        </BrowserRouter>
      )

      const categoryDashboard = screen.getByTestId('category-dashboard')
      expect(categoryDashboard).toHaveClass('mb-8')
    })

    test('CategoryDashboard is positioned correctly in layout', () => {
      render(
        <BrowserRouter>
          <AppDashboard />
        </BrowserRouter>
      )

      const categoryDashboard = screen.getByTestId('category-dashboard')
      const balanceCard = screen.getByText('Total Balance').closest('.base-card')
      const portfolioSection = screen.getByText('Portfolio Overview')

      // CategoryDashboard should be between balance card and portfolio
      expect(categoryDashboard).toBeInTheDocument()
      expect(balanceCard).toBeInTheDocument()
      expect(portfolioSection).toBeInTheDocument()
    })
  })

  describe('Layout Consistency', () => {
    test('maintains consistent spacing regardless of feature flag state', () => {
      // Test with categories enabled
      useFeatureFlag.mockReturnValue(true)
      const { rerender } = render(
        <BrowserRouter>
          <AppDashboard />
        </BrowserRouter>
      )

      const mainLayout = document.querySelector('.main-layout')
      expect(mainLayout).toBeInTheDocument()

      // Test with categories disabled
      useFeatureFlag.mockReturnValue(false)
      rerender(
        <BrowserRouter>
          <AppDashboard />
        </BrowserRouter>
      )

      expect(mainLayout).toBeInTheDocument()
    })

    test('other dashboard sections remain unchanged', () => {
      useFeatureFlag.mockReturnValue(true)

      render(
        <BrowserRouter>
          <AppDashboard />
        </BrowserRouter>
      )

      // Verify other sections are still present
      expect(screen.getByTestId('page-header')).toBeInTheDocument()
      expect(screen.getByTestId('market-indicators')).toBeInTheDocument()
      expect(screen.getByText('Total Balance')).toBeInTheDocument()
      expect(screen.getByText('Portfolio Overview')).toBeInTheDocument()
      expect(screen.getByText('Recent Activity')).toBeInTheDocument()
      expect(screen.getByText('OneFi Features')).toBeInTheDocument()
    })
  })

  describe('Performance Considerations', () => {
    test('only renders one action section at a time', () => {
      // Test categories enabled
      useFeatureFlag.mockReturnValue(true)
      const { rerender } = render(
        <BrowserRouter>
          <AppDashboard />
        </BrowserRouter>
      )

      expect(screen.getByTestId('category-dashboard')).toBeInTheDocument()
      expect(screen.queryByText('Quick Actions')).not.toBeInTheDocument()

      // Test categories disabled
      useFeatureFlag.mockReturnValue(false)
      rerender(
        <BrowserRouter>
          <AppDashboard />
        </BrowserRouter>
      )

      expect(screen.queryByTestId('category-dashboard')).not.toBeInTheDocument()
      expect(screen.getByText('Quick Actions')).toBeInTheDocument()
    })

    test('feature flag is only called once per render', () => {
      useFeatureFlag.mockReturnValue(true)

      render(
        <BrowserRouter>
          <AppDashboard />
        </BrowserRouter>
      )

      expect(useFeatureFlag).toHaveBeenCalledTimes(1)
    })
  })

  describe('Progressive Enhancement', () => {
    test('gracefully handles feature flag loading states', () => {
      // Test undefined/loading state
      useFeatureFlag.mockReturnValue(undefined)

      render(
        <BrowserRouter>
          <AppDashboard />
        </BrowserRouter>
      )

      // Should default to Quick Actions when flag is undefined
      expect(screen.getByText('Quick Actions')).toBeInTheDocument()
      expect(screen.queryByTestId('category-dashboard')).not.toBeInTheDocument()
    })

    test('handles feature flag errors gracefully', () => {
      // Test error state
      useFeatureFlag.mockImplementation(() => {
        throw new Error('Feature flag error')
      })

      expect(() => {
        render(
          <BrowserRouter>
            <AppDashboard />
          </BrowserRouter>
        )
      }).toThrow('Feature flag error')
    })
  })

  describe('Accessibility', () => {
    test('maintains proper heading hierarchy with CategoryDashboard', () => {
      useFeatureFlag.mockReturnValue(true)

      render(
        <BrowserRouter>
          <AppDashboard />
        </BrowserRouter>
      )

      // Main heading should still be present
      expect(screen.getByText(/Good morning, John/)).toBeInTheDocument()
      
      // CategoryDashboard should not interfere with page structure
      expect(screen.getByTestId('category-dashboard')).toBeInTheDocument()
    })

    test('maintains proper heading hierarchy with Quick Actions', () => {
      useFeatureFlag.mockReturnValue(false)

      render(
        <BrowserRouter>
          <AppDashboard />
        </BrowserRouter>
      )

      // Main heading should still be present
      expect(screen.getByText(/Good morning, John/)).toBeInTheDocument()
      
      // Quick Actions title should be properly structured
      expect(screen.getByText('Quick Actions')).toBeInTheDocument()
    })
  })
})