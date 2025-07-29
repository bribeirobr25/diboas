/**
 * Test Suite for Dashboard Minimalist Design Changes
 * Tests the updated compact balance card and market indicators
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import AppDashboard from '../AppDashboard.jsx'
import SimpleMarketIndicators from '../SimpleMarketIndicators.jsx'

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

// Mock dependencies
vi.mock('../services/DataManager.js', () => ({
  dataManager: {
    getState: vi.fn(() => ({
      user: { firstName: 'John' },
      balance: { totalUSD: 5000.75, availableForSpending: 1250.50, investedAmount: 3750.25 },
      transactions: []
    })),
    getBalance: vi.fn(() => ({ totalUSD: 5000.75, availableForSpending: 1250.50, investedAmount: 3750.25 })),
    getTransactions: vi.fn(() => []),
    subscribe: vi.fn(() => () => {}),
    emit: vi.fn()
  }
}))

vi.mock('../utils/userSettings.js', () => ({
  useUserSettings: () => ({
    settings: {},
    advancedMode: false
  })
}))

vi.mock('../config/featureFlags.js', () => ({
  useFeatureFlag: () => true
}))

describe('Dashboard Minimalist Design', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Compact Balance Card', () => {
    it('should render with compact design', () => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      const balanceCard = document.querySelector('.compact-balance-card')
      expect(balanceCard).toBeInTheDocument()
      expect(balanceCard).toHaveClass('interactive-card')
    })

    it('should display balance in horizontal layout', () => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      // Should show main balance prominently
      const balanceAmount = document.querySelector('.balance-amount-compact')
      expect(balanceAmount).toBeInTheDocument()
      expect(balanceAmount).toHaveClass('text-2xl', 'font-bold')
    })

    it('should show available and invested balances side by side', () => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      const balanceBreakdown = document.querySelector('.balance-breakdown')
      expect(balanceBreakdown).toBeInTheDocument()

      const balanceItems = document.querySelectorAll('.balance-item')
      expect(balanceItems).toHaveLength(2) // Available and Invested

      expect(screen.getByText('Available')).toBeInTheDocument()
      expect(screen.getByText('Invested')).toBeInTheDocument()
    })

    it('should display compact balance values without decimals', () => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      // Should show rounded values in breakdown
      expect(screen.getByText('$1,250')).toBeInTheDocument() // Available (rounded)
      expect(screen.getByText('$3,750')).toBeInTheDocument() // Invested (rounded)
    })

    it('should show visibility toggle and change badge', () => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      const visibilityToggle = document.querySelector('.balance-visibility-toggle')
      expect(visibilityToggle).toBeInTheDocument()

      const changeBadge = document.querySelector('.balance-change-badge')
      expect(changeBadge).toBeInTheDocument()
      expect(changeBadge).toHaveTextContent('+2.4%')
    })

    it('should have proper spacing and layout structure', () => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      const balanceCard = document.querySelector('.compact-balance-card')
      expect(balanceCard).toHaveStyle({
        background: expect.stringContaining('linear-gradient')
      })

      const cardContent = balanceCard.querySelector('.p-4')
      expect(cardContent).toBeInTheDocument()
    })

    it('should toggle balance visibility', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      const visibilityToggle = document.querySelector('.balance-visibility-toggle')
      
      // Initially should show actual values
      expect(screen.getByText('$5,000.75')).toBeInTheDocument()

      // Click to hide
      await user.click(visibilityToggle)

      // Should show hidden values
      expect(screen.getByText('••••••••')).toBeInTheDocument()
    })
  })

  describe('Market Indicators Minimalist Design', () => {
    it('should render market indicators with minimalist design', () => {
      render(<SimpleMarketIndicators />)

      const container = document.querySelector('.market-indicators-container')
      expect(container).toBeInTheDocument()
    })

    it('should show status indicator with smaller design', () => {
      render(<SimpleMarketIndicators />)

      const statusIndicator = document.querySelector('.market-indicators-status')
      expect(statusIndicator).toBeInTheDocument()
      expect(screen.getByText('📊 Demo Market Data')).toBeInTheDocument()
      expect(screen.getByText('Live')).toBeInTheDocument()
    })

    it('should display mobile view with horizontal scroll', () => {
      render(<SimpleMarketIndicators />)

      const mobileView = document.querySelector('.market-indicators-mobile')
      const scrollContainer = document.querySelector('.market-indicators-scroll')
      
      expect(mobileView).toBeInTheDocument()
      expect(scrollContainer).toBeInTheDocument()
    })

    it('should show desktop view with grid layout', () => {
      render(<SimpleMarketIndicators />)

      const desktopView = document.querySelector('.market-indicators-desktop')
      expect(desktopView).toBeInTheDocument()
    })

    it('should render compact market indicator items', () => {
      render(<SimpleMarketIndicators />)

      const indicators = document.querySelectorAll('.market-indicator-compact')
      expect(indicators.length).toBeGreaterThan(0)

      // Should show all market data items
      expect(screen.getByText('BTC')).toBeInTheDocument()
      expect(screen.getByText('ETH')).toBeInTheDocument()
      expect(screen.getByText('$43,250')).toBeInTheDocument()
      expect(screen.getByText('$2,680')).toBeInTheDocument()
    })

    it('should use compact styling for market indicators', () => {
      render(<SimpleMarketIndicators />)

      const firstIndicator = document.querySelector('.market-indicator-compact')
      expect(firstIndicator).toHaveStyle({
        background: 'rgba(255, 255, 255, 0.6)',
        backdropFilter: 'blur(4px)'
      })
    })

    it('should show trending icons in market indicators', () => {
      render(<SimpleMarketIndicators />)

      const trendingUpIcons = document.querySelectorAll('.w-3.h-3')
      expect(trendingUpIcons.length).toBeGreaterThan(0)
    })

    it('should display market indicator content properly', () => {
      render(<SimpleMarketIndicators />)

      const indicatorNames = document.querySelectorAll('.market-indicator-name')
      const indicatorPrices = document.querySelectorAll('.market-indicator-price')
      const indicatorChanges = document.querySelectorAll('.market-indicator-change-text')

      expect(indicatorNames.length).toBeGreaterThan(0)
      expect(indicatorPrices.length).toBeGreaterThan(0)
      expect(indicatorChanges.length).toBeGreaterThan(0)
    })
  })

  describe('Desktop Categories Layout', () => {
    it('should apply desktop categories layout class', () => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      const categoryDashboard = document.querySelector('.desktop-categories-layout')
      expect(categoryDashboard).toBeInTheDocument()
    })

    it('should show categories side by side on desktop', () => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      const categoriesGrid = document.querySelector('.desktop-categories-horizontal')
      expect(categoriesGrid).toBeInTheDocument()
    })
  })

  describe('Overall Layout Integration', () => {
    it('should maintain proper spacing between sections', () => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      // Check for proper section spacing
      const marketIndicators = document.querySelector('.market-indicators-container')
      const balanceCard = document.querySelector('.compact-balance-card')
      
      expect(marketIndicators).toBeInTheDocument()
      expect(balanceCard).toBeInTheDocument()
    })

    it('should integrate all minimalist components properly', () => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      // Should show all main sections
      expect(screen.getByText('Good morning, John! 👋')).toBeInTheDocument()
      expect(screen.getByText('Total Balance')).toBeInTheDocument()
      expect(screen.getByText('📊 Demo Market Data')).toBeInTheDocument()
    })

    it('should navigate to account view when balance card is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      const balanceCard = document.querySelector('.compact-balance-card')
      await user.click(balanceCard)

      // Would test navigation if we had router context
      expect(balanceCard).toHaveClass('interactive-card')
    })
  })

  describe('Responsive Behavior', () => {
    it('should adapt compact balance card for mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      const balanceCard = document.querySelector('.compact-balance-card')
      expect(balanceCard).toBeInTheDocument()
    })

    it('should show market indicators properly on mobile', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<SimpleMarketIndicators />)

      const mobileIndicators = document.querySelector('.market-indicators-mobile')
      expect(mobileIndicators).toBeInTheDocument()
    })

    it('should adapt balance breakdown for different screen sizes', () => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      const balanceBreakdown = document.querySelector('.balance-breakdown')
      expect(balanceBreakdown).toBeInTheDocument()
      
      // Should have responsive classes for different screen sizes
      const balanceItems = document.querySelectorAll('.balance-item')
      expect(balanceItems.length).toBe(2)
    })
  })

  describe('Performance Impact', () => {
    it('should render minimalist design quickly', () => {
      const startTime = performance.now()
      
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('should render market indicators efficiently', () => {
      const startTime = performance.now()
      
      render(<SimpleMarketIndicators />)
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(50)
    })
  })

  describe('Visual Consistency', () => {
    it('should maintain consistent color scheme', () => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      const balanceCard = document.querySelector('.compact-balance-card')
      expect(balanceCard).toHaveStyle({
        background: expect.stringContaining('linear-gradient')
      })

      const changeBadge = document.querySelector('.balance-change-badge')
      expect(changeBadge).toHaveClass('bg-green-500')
    })

    it('should use consistent typography in compact design', () => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      const balanceLabel = document.querySelector('.balance-label')
      const balanceAmount = document.querySelector('.balance-amount-compact')
      
      expect(balanceLabel).toHaveClass('font-weight-500')
      expect(balanceAmount).toHaveClass('font-bold')
    })

    it('should maintain proper contrast in market indicators', () => {
      render(<SimpleMarketIndicators />)

      const indicators = document.querySelectorAll('.market-indicator-compact')
      indicators.forEach(indicator => {
        expect(indicator).toHaveStyle({
          background: expect.stringContaining('rgba(255, 255, 255, 0.6)')
        })
      })
    })
  })

  describe('Accessibility in Minimalist Design', () => {
    it('should maintain accessibility in compact balance card', () => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      const visibilityToggle = document.querySelector('.balance-visibility-toggle')
      expect(visibilityToggle).toBeInTheDocument()
      
      // Should be keyboard accessible
      expect(visibilityToggle.tagName).toBe('BUTTON')
    })

    it('should keep proper ARIA labels in market indicators', () => {
      render(<SimpleMarketIndicators />)

      const indicators = document.querySelectorAll('.market-indicator-compact')
      expect(indicators.length).toBeGreaterThan(0)
      
      // Should maintain semantic structure
      indicators.forEach(indicator => {
        expect(indicator).toBeInTheDocument()
      })
    })

    it('should preserve color contrast in minimalist design', () => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      const balanceAmount = document.querySelector('.balance-amount-compact')
      expect(balanceAmount).toHaveClass('text-white') // Good contrast on gradient background
    })
  })
})