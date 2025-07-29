/**
 * Test Suite for AssetDetailPage Component
 * Tests Phantom wallet-style design and functionality
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import AssetDetailPage from '../AssetDetailPage.jsx'

const TestWrapper = ({ symbol = 'BTC' }) => (
  <BrowserRouter>
    <Routes>
      <Route path="/asset/:symbol" element={<AssetDetailPage />} />
    </Routes>
  </BrowserRouter>
)

const mockNavigate = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ symbol: 'BTC' })
  }
})

describe('AssetDetailPage Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Phantom Wallet Style Design', () => {
    it('should render with Phantom wallet-inspired layout', () => {
      render(<TestWrapper />)

      // Should have main layout structure
      expect(document.querySelector('.main-layout')).toBeInTheDocument()
      expect(document.querySelector('.page-container')).toBeInTheDocument()
    })

    it('should display asset header with large icon and details', () => {
      render(<TestWrapper />)

      // Should show large asset icon
      const assetIcon = document.querySelector('.asset-detail__icon')
      expect(assetIcon).toBeInTheDocument()
      expect(assetIcon).toHaveClass('w-16', 'h-16', 'rounded-full')

      // Should show asset name and symbol prominently
      expect(screen.getByText('Bitcoin')).toBeInTheDocument()
      expect(screen.getByText('BTC')).toBeInTheDocument()
    })

    it('should show prominent price display', () => {
      render(<TestWrapper />)

      const price = document.querySelector('.asset-detail__price')
      expect(price).toBeInTheDocument()
      expect(price).toHaveClass('text-3xl', 'font-bold')
      expect(screen.getByText('$43,250.00')).toBeInTheDocument()
    })

    it('should display price change with trending icon', () => {
      render(<TestWrapper />)

      const changeElement = document.querySelector('.asset-detail__change')
      expect(changeElement).toBeInTheDocument()
      expect(changeElement).toHaveClass('text-green-600') // Positive change

      expect(screen.getByText('+2.4%')).toBeInTheDocument()
      expect(screen.getByText('(+$1,012.50)')).toBeInTheDocument()
    })

    it('should show asset rank badge', () => {
      render(<TestWrapper />)

      expect(screen.getByText('#1')).toBeInTheDocument()
    })
  })

  describe('User Holdings Display', () => {
    it('should show user holdings card when user owns the asset', () => {
      render(<TestWrapper />)

      expect(screen.getByText('Your Holdings')).toBeInTheDocument()
      expect(document.querySelector('.asset-detail__holdings-card')).toBeInTheDocument()
    })

    it('should display user quantity, value, and average buy price', () => {
      render(<TestWrapper />)

      expect(screen.getByText('0.025 BTC')).toBeInTheDocument()
      expect(screen.getByText('$1,081.25')).toBeInTheDocument()
      expect(screen.getByText('$41,200')).toBeInTheDocument()
    })

    it('should style holdings card with blue theme', () => {
      render(<TestWrapper />)

      const holdingsCard = document.querySelector('.asset-detail__holdings-card')
      expect(holdingsCard).toHaveClass('bg-blue-50', 'border-blue-200')
    })
  })

  describe('Trading Actions', () => {
    it('should show buy button for all assets', () => {
      render(<TestWrapper />)

      const buyButton = document.querySelector('.asset-detail__buy-button')
      expect(buyButton).toBeInTheDocument()
      expect(buyButton).toHaveClass('bg-green-600')
      expect(screen.getByText('Buy BTC')).toBeInTheDocument()
    })

    it('should show sell button only for owned assets', () => {
      render(<TestWrapper />)

      const sellButton = document.querySelector('.asset-detail__sell-button')
      expect(sellButton).toBeInTheDocument()
      expect(sellButton).toHaveClass('border-red-300', 'text-red-600')
      expect(screen.getByText('Sell BTC')).toBeInTheDocument()
    })

    it('should navigate to buy page when buy button is clicked', async () => {
      const user = userEvent.setup()
      render(<TestWrapper />)

      const buyButton = screen.getByText('Buy BTC')
      await user.click(buyButton)

      expect(mockNavigate).toHaveBeenCalledWith('/category/investment/buy?asset=BTC')
    })

    it('should navigate to sell page when sell button is clicked', async () => {
      const user = userEvent.setup()
      render(<TestWrapper />)

      const sellButton = screen.getByText('Sell BTC')
      await user.click(sellButton)

      expect(mockNavigate).toHaveBeenCalledWith('/category/investment/sell?asset=BTC')
    })
  })

  describe('Market Statistics', () => {
    it('should display market statistics cards', () => {
      render(<TestWrapper />)

      expect(screen.getByText('Market Statistics')).toBeInTheDocument()
      expect(screen.getByText('Market Cap')).toBeInTheDocument()
      expect(screen.getByText('24h Volume')).toBeInTheDocument()
      expect(screen.getByText('Supply')).toBeInTheDocument()
      expect(screen.getByText('Rank')).toBeInTheDocument()
    })

    it('should show correct market data values', () => {
      render(<TestWrapper />)

      expect(screen.getByText('$850.2B')).toBeInTheDocument() // Market cap
      expect(screen.getByText('$28.4B')).toBeInTheDocument() // 24h volume
      expect(screen.getByText('19.8M BTC')).toBeInTheDocument() // Supply
      expect(screen.getByText('#1')).toBeInTheDocument() // Rank
    })

    it('should use different colored icons for each stat', () => {
      render(<TestWrapper />)

      const statCards = document.querySelectorAll('.p-4')
      expect(statCards.length).toBeGreaterThan(3)
    })
  })

  describe('Price Chart Section', () => {
    it('should display price chart placeholder', () => {
      render(<TestWrapper />)

      expect(screen.getByText('Price Chart (24h)')).toBeInTheDocument()
      expect(screen.getByText('Price chart visualization')).toBeInTheDocument()
      expect(screen.getByText('Integration with charting library needed')).toBeInTheDocument()
    })

    it('should have proper chart container styling', () => {
      render(<TestWrapper />)

      const chartContainer = document.querySelector('.h-48.bg-gray-50')
      expect(chartContainer).toBeInTheDocument()
    })
  })

  describe('Additional Information', () => {
    it('should display additional information section', () => {
      render(<TestWrapper />)

      expect(screen.getByText('Additional Information')).toBeInTheDocument()
      expect(screen.getByText('Official Website')).toBeInTheDocument()
      expect(screen.getByText('Whitepaper')).toBeInTheDocument()
    })

    it('should show external links for website and whitepaper', () => {
      render(<TestWrapper />)

      const websiteLink = screen.getByRole('link', { name: /visit website/i })
      expect(websiteLink).toHaveAttribute('href', 'https://bitcoin.org')
      expect(websiteLink).toHaveAttribute('target', '_blank')

      const whitepaperLink = screen.getByRole('link', { name: /read whitepaper/i })
      expect(whitepaperLink).toHaveAttribute('href', 'https://bitcoin.org/bitcoin.pdf')
      expect(whitepaperLink).toHaveAttribute('target', '_blank')
    })

    it('should show external link icons', () => {
      render(<TestWrapper />)

      const externalIcons = document.querySelectorAll('.w-4.h-4')
      expect(externalIcons.length).toBeGreaterThan(1)
    })
  })

  describe('Navigation', () => {
    it('should show back button to investments', () => {
      render(<TestWrapper />)

      expect(screen.getByText('Back to Investments')).toBeInTheDocument()
    })

    it('should navigate back to investment category when back button is clicked', async () => {
      const user = userEvent.setup()
      render(<TestWrapper />)

      const backButton = screen.getByText('Back to Investments')
      await user.click(backButton)

      expect(mockNavigate).toHaveBeenCalledWith('/category/investment')
    })
  })

  describe('Different Assets Support', () => {
    it('should handle Ethereum asset data', () => {
      vi.mocked(require('react-router-dom').useParams).mockReturnValue({ symbol: 'ETH' })
      
      render(<TestWrapper />)

      expect(screen.getByText('Ethereum')).toBeInTheDocument()
      expect(screen.getByText('$2,680.00')).toBeInTheDocument()
      expect(screen.getByText('Decentralized platform for smart contracts and DApps')).toBeInTheDocument()
    })

    it('should handle gold asset data', () => {
      vi.mocked(require('react-router-dom').useParams).mockReturnValue({ symbol: 'PAXG' })
      
      render(<TestWrapper />)

      expect(screen.getByText('PAX Gold')).toBeInTheDocument()
      expect(screen.getByText('$2,687.34')).toBeInTheDocument()
      expect(screen.getByText(/Gold-backed cryptocurrency/)).toBeInTheDocument()
    })
  })

  describe('Error Handling', () => {
    it('should redirect to investment category for unknown assets', () => {
      vi.mocked(require('react-router-dom').useParams).mockReturnValue({ symbol: 'UNKNOWN' })
      
      render(<TestWrapper />)

      // Should navigate away from unknown asset
      expect(mockNavigate).toHaveBeenCalledWith('/category/investment')
    })

    it('should handle missing asset data gracefully', () => {
      vi.mocked(require('react-router-dom').useParams).mockReturnValue({ symbol: null })
      
      expect(() => render(<TestWrapper />)).not.toThrow()
    })
  })

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(<TestWrapper />)

      // Should maintain layout structure on mobile
      expect(document.querySelector('.asset-detail__header')).toBeInTheDocument()
      expect(document.querySelector('.asset-detail__actions')).toBeInTheDocument()
    })

    it('should use responsive grid for statistics', () => {
      render(<TestWrapper />)

      const statsGrid = document.querySelector('.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4')
      expect(statsGrid).toBeInTheDocument()
    })

    it('should stack trading buttons properly on mobile', () => {
      render(<TestWrapper />)

      const actionsGrid = document.querySelector('.grid-cols-2')
      expect(actionsGrid).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(<TestWrapper />)

      const h1 = screen.getByRole('heading', { level: 1 })
      expect(h1).toHaveTextContent('Bitcoin')
    })

    it('should have accessible external links', () => {
      render(<TestWrapper />)

      const externalLinks = screen.getAllByRole('link')
      externalLinks.forEach(link => {
        if (link.getAttribute('target') === '_blank') {
          expect(link).toHaveAttribute('rel', 'noopener noreferrer')
        }
      })
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      render(<TestWrapper />)

      const backButton = screen.getByText('Back to Investments')
      await user.tab()
      expect(document.activeElement).toBe(backButton)

      await user.tab()
      const buyButton = screen.getByText('Buy BTC')
      expect(document.activeElement).toBe(buyButton)
    })
  })

  describe('Performance', () => {
    it('should render quickly with complex asset data', () => {
      const startTime = performance.now()
      
      render(<TestWrapper />)
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('should handle rapid navigation between assets', async () => {
      const user = userEvent.setup()
      
      render(<TestWrapper />)

      const backButton = screen.getByText('Back to Investments')
      
      // Rapid clicks should not cause issues
      await user.click(backButton)
      await user.click(backButton)
      
      expect(mockNavigate).toHaveBeenCalledTimes(2)
    })
  })

  describe('Data Display Accuracy', () => {
    it('should calculate and display holdings correctly', () => {
      render(<TestWrapper />)

      // Verify holdings calculations
      expect(screen.getByText('0.025 BTC')).toBeInTheDocument() // Quantity
      expect(screen.getByText('$1,081.25')).toBeInTheDocument() // Current value
      expect(screen.getByText('$41,200')).toBeInTheDocument() // Avg buy price
    })

    it('should show real-time price information', () => {
      render(<TestWrapper />)

      expect(screen.getByText('Real-time')).toBeInTheDocument()
    })

    it('should display asset description accurately', () => {
      render(<TestWrapper />)

      expect(screen.getByText(/The world's first and largest cryptocurrency/)).toBeInTheDocument()
    })
  })
})