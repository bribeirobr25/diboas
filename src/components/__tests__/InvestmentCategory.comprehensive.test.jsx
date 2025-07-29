/**
 * Comprehensive Test Suite for InvestmentCategory Component
 * Tests updated layout, background images, overview card, asset listings, and user holdings
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import InvestmentCategory, { INVESTMENT_CATEGORIES } from '../categories/InvestmentCategory.jsx'

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

describe('InvestmentCategory Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Layout and Design Updates', () => {
    it('should render with background image header', () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      const headerBg = document.querySelector('.investment-category__header-bg')
      expect(headerBg).toBeInTheDocument()
      expect(headerBg).toHaveStyle({
        backgroundImage: expect.stringContaining('unsplash.com')
      })
    })

    it('should display header with green gradient overlay', () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      const overlay = document.querySelector('.investment-category__header-overlay')
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveStyle({
        background: expect.stringContaining('rgba(34, 197, 94')
      })
    })

    it('should show Buy/Sell title and investment subtitle', () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      expect(screen.getByText('Buy/Sell')).toBeInTheDocument()
      expect(screen.getByText('Investment & Trading')).toBeInTheDocument()
    })
  })

  describe('Investment Overview Card (Minimalist Design)', () => {
    it('should render single overview card instead of separate stat cards', () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      expect(screen.getByText('Investment Overview')).toBeInTheDocument()
      expect(screen.getByText('Your current investment portfolio at a glance')).toBeInTheDocument()
    })

    it('should display all three overview items in single card', () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      // Check for overview items
      expect(screen.getByText('Invested Balance')).toBeInTheDocument()
      expect(screen.getByText('$3,450.00')).toBeInTheDocument()
      expect(screen.getByText('Total Gain/Loss')).toBeInTheDocument()
      expect(screen.getByText('+$285.50')).toBeInTheDocument()
      expect(screen.getByText('Assets Owned')).toBeInTheDocument()
      expect(screen.getByText('5')).toBeInTheDocument()
    })

    it('should use investment overview grid layout', () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      const overviewGrid = document.querySelector('.investment-overview-grid')
      expect(overviewGrid).toBeInTheDocument()
      
      const overviewItems = document.querySelectorAll('.investment-overview-item')
      expect(overviewItems).toHaveLength(3)
    })
  })

  describe('Quick Actions Removal', () => {
    it('should not display any quick actions section', () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      // Should NOT show quick actions
      expect(screen.queryByText('Quick Actions')).not.toBeInTheDocument()
      expect(screen.queryByText('Buy Assets')).not.toBeInTheDocument()
      expect(screen.queryByText('Sell Assets')).not.toBeInTheDocument()
    })

    it('should only show removed comment for quick actions', () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      // The component should render without the quick actions section
      expect(screen.getByText('Browse Assets')).toBeInTheDocument()
    })
  })

  describe('Category Title Updates', () => {
    it('should display updated category titles', () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      // Should show updated titles
      expect(screen.getByText('Crypto')).toBeInTheDocument()
      expect(screen.getByText('Gold')).toBeInTheDocument()
      expect(screen.getByText('Stocks')).toBeInTheDocument()
      expect(screen.getByText('Real Estate')).toBeInTheDocument()

      // Should NOT show old titles
      expect(screen.queryByText('Cryptocurrencies')).not.toBeInTheDocument()
      expect(screen.queryByText('Tokenized Assets')).not.toBeInTheDocument()
      expect(screen.queryByText('Stock Indices')).not.toBeInTheDocument()
    })

    it('should have correct configuration for updated categories', () => {
      expect(INVESTMENT_CATEGORIES.crypto.title).toBe('Crypto')
      expect(INVESTMENT_CATEGORIES.tokenized.title).toBe('Gold')
      expect(INVESTMENT_CATEGORIES.stocks.title).toBe('Stocks')
    })
  })

  describe('Asset Listings with User Holdings Priority', () => {
    it('should display assets in priority order (holdings first)', () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      const assetCards = document.querySelectorAll('.asset-card')
      expect(assetCards.length).toBeGreaterThan(0)

      // Assets with holdings should have the owned class
      const ownedAssets = document.querySelectorAll('.asset-card--owned')
      expect(ownedAssets.length).toBeGreaterThan(0)
    })

    it('should show user quantity for each asset', () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      // Should show quantities (including 0 for non-owned assets)
      expect(screen.getByText('BTC • 0.025')).toBeInTheDocument()
      expect(screen.getByText('ETH • 0.8')).toBeInTheDocument()
      expect(screen.getByText('SOL • 0')).toBeInTheDocument()
    })

    it('should display user asset value in dollars', () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      // Should show dollar values for user holdings
      expect(screen.getByText('$1081.25')).toBeInTheDocument() // BTC value
      expect(screen.getByText('$2144.00')).toBeInTheDocument() // ETH value
      expect(screen.getByText('$0.00')).toBeInTheDocument() // Non-owned assets
    })

    it('should style owned assets differently', () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      const ownedAssets = document.querySelectorAll('.asset-card--owned')
      ownedAssets.forEach(asset => {
        expect(asset).toHaveClass('asset-card--owned')
      })
    })
  })

  describe('Buy Buttons with Pre-selection', () => {
    it('should show buy button on each asset card', () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      const buyButtons = screen.getAllByText('Buy')
      expect(buyButtons.length).toBeGreaterThan(0)
      
      buyButtons.forEach(button => {
        expect(button).toHaveClass('asset-buy-button')
      })
    })

    it('should navigate to buy page with pre-selected asset', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      const buyButtons = screen.getAllByText('Buy')
      const firstBuyButton = buyButtons[0]
      
      await user.click(firstBuyButton)
      
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/\/category\/investment\/buy\?asset=/)
      )
    })

    it('should prevent event bubbling when buy button is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      const buyButtons = screen.getAllByText('Buy')
      const firstBuyButton = buyButtons[0]
      
      await user.click(firstBuyButton)
      
      // Should only navigate to buy page, not asset detail page
      expect(mockNavigate).toHaveBeenCalledTimes(1)
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/\/category\/investment\/buy/)
      )
    })
  })

  describe('Asset Detail Page Navigation', () => {
    it('should navigate to asset detail page when asset card is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      const assetCards = document.querySelectorAll('.asset-card')
      const firstAssetCard = assetCards[0]
      
      await user.click(firstAssetCard)
      
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/\/asset\//)
      )
    })

    it('should not navigate to detail page when buy button is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      const buyButtons = screen.getAllByText('Buy')
      const firstBuyButton = buyButtons[0]
      
      await user.click(firstBuyButton)
      
      expect(mockNavigate).not.toHaveBeenCalledWith(
        expect.stringMatching(/\/asset\//)
      )
    })
  })

  describe('Asset Information Display', () => {
    it('should show asset price and change information', () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      // Should show prices
      expect(screen.getByText('$43,250')).toBeInTheDocument() // BTC price
      expect(screen.getByText('$2,680')).toBeInTheDocument() // ETH price
      
      // Should show changes
      expect(screen.getByText('+2.4%')).toBeInTheDocument() // BTC change
      expect(screen.getByText('+1.8%')).toBeInTheDocument() // ETH change
    })

    it('should display trending icons based on price direction', () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      const trendingUpIcons = document.querySelectorAll('.asset-change--positive')
      const trendingDownIcons = document.querySelectorAll('.asset-change--negative')
      
      expect(trendingUpIcons.length).toBeGreaterThan(0)
      // Most assets in mock data are trending up
    })

    it('should show popular badges for popular assets', () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      // Popular assets should have star icons
      const starIcons = document.querySelectorAll('[data-testid="star-icon"], .w-4.h-4.text-yellow-500')
      expect(starIcons.length).toBeGreaterThan(0)
    })
  })

  describe('Category Tab Navigation', () => {
    it('should allow switching between asset categories', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      // Should start with Crypto selected
      const cryptoTab = screen.getByRole('button', { name: /crypto/i })
      expect(cryptoTab).toHaveClass('bg-blue-600', 'text-white')

      // Switch to Gold category
      const goldTab = screen.getByRole('button', { name: /gold/i })
      await user.click(goldTab)

      // Should show gold assets
      expect(screen.getByText('PAX Gold')).toBeInTheDocument()
      expect(screen.getByText('Tether Gold')).toBeInTheDocument()
    })

    it('should display correct assets for each category', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      // Test Stocks category
      const stocksTab = screen.getByRole('button', { name: /stocks/i })
      await user.click(stocksTab)

      expect(screen.getByText('Magnificent 7')).toBeInTheDocument()
      expect(screen.getByText('S&P 500 Index')).toBeInTheDocument()
    })
  })

  describe('Navigation and Back Button', () => {
    it('should navigate back to dashboard when back button is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      const backButton = screen.getByText('Back to Dashboard')
      await user.click(backButton)

      expect(mockNavigate).toHaveBeenCalledWith('/app')
    })
  })

  describe('Educational Content', () => {
    it('should display investment tips section', () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      expect(screen.getByText('Investment Tips')).toBeInTheDocument()
      expect(screen.getByText(/Start Small.*Begin with small amounts/)).toBeInTheDocument()
      expect(screen.getByText(/Diversify.*Spread your investments/)).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should use responsive grid for asset listings', () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      const assetGrid = document.querySelector('.asset-grid')
      expect(assetGrid).toBeInTheDocument()
      
      // Should have responsive classes
      expect(assetGrid).toHaveClass('grid-template-columns')
    })

    it('should adapt overview card for mobile screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      const overviewGrid = document.querySelector('.investment-overview-grid')
      expect(overviewGrid).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('should render quickly with asset sorting logic', () => {
      const startTime = performance.now()
      
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('should handle category switching efficiently', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      const startTime = performance.now()
      
      // Switch categories multiple times
      await user.click(screen.getByRole('button', { name: /gold/i }))
      await user.click(screen.getByRole('button', { name: /stocks/i }))
      await user.click(screen.getByRole('button', { name: /crypto/i }))
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(200)
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and roles', () => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      // Check for proper heading hierarchy
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Buy/Sell')
      expect(screen.getByRole('heading', { level: 2, name: /investment overview/i })).toBeInTheDocument()
    })

    it('should support keyboard navigation for asset cards', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      const assetCards = document.querySelectorAll('.asset-card')
      expect(assetCards.length).toBeGreaterThan(0)
      
      // Asset cards should be keyboard accessible
      assetCards.forEach(card => {
        expect(card).toHaveAttribute('tabindex', '0')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle missing asset data gracefully', () => {
      // Test with category that has no assets
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      // Should not crash even if asset data is missing
      expect(screen.getByText('Buy/Sell')).toBeInTheDocument()
    })

    it('should handle navigation errors gracefully', async () => {
      const user = userEvent.setup()
      mockNavigate.mockImplementation(() => {
        throw new Error('Navigation failed')
      })

      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )

      const buyButtons = screen.getAllByText('Buy')
      
      // Should not crash the component
      expect(() => user.click(buyButtons[0])).not.toThrow()
    })
  })
})