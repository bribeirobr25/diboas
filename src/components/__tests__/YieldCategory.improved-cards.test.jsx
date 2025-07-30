/**
 * YieldCategory Improved Cards Test
 * Tests the improved card design without square aspect ratio
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'

// Mock dependencies
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
    getFinObjectives: vi.fn(() => ({
      'emergency-fund': {
        id: 'emergency-fund',
        title: 'Emergency Fund',
        description: 'Build a 6-month emergency safety net',
        icon: 'Umbrella',
        color: 'bg-blue-100 text-blue-600',
        targetAmount: 10000,
        timeframe: '12 months',
        expectedApy: '8.5%',
        riskLevel: 'Low',
        strategy: 'Conservative DeFi yield strategies',
        popular: true,
        isActive: false,
        progress: 0,
        currentAmount: 0
      },
      'house-down-payment': {
        id: 'house-down-payment',
        title: 'House Down Payment',
        description: 'Save for your dream home down payment',
        icon: 'Home',
        color: 'bg-green-100 text-green-600',
        targetAmount: 50000,
        timeframe: '3 years',
        expectedApy: '12.3%',
        riskLevel: 'Medium',
        strategy: 'Balanced DeFi strategies with moderate risk',
        popular: true,
        isActive: true,
        progress: 25.4,
        currentAmount: 12700
      },
      'vacation-fund': {
        id: 'vacation-fund',
        title: 'Vacation Fund',
        description: 'Plan your dream vacation',
        icon: 'Plane',
        color: 'bg-purple-100 text-purple-600',
        targetAmount: 5000,
        timeframe: '8 months',
        expectedApy: '6.8%',
        riskLevel: 'Low',
        strategy: 'Low-risk yield farming',
        popular: false,
        isActive: false,
        progress: 0,
        currentAmount: 0
      }
    })),
    getRiskLevels: vi.fn(() => ({
      Low: { color: 'bg-green-100 text-green-800' },
      Medium: { color: 'bg-yellow-100 text-yellow-800' },
      High: { color: 'bg-red-100 text-red-800' }
    })),
    getYieldData: vi.fn(() => ({
      activeStrategies: 2,
      totalEarning: 234.56,
      avgAPY: 8.7,
      goalsProgress: 15.3
    })),
    subscribe: vi.fn(() => vi.fn())
  }
}))

vi.mock('../shared/PageHeader.jsx', () => ({
  default: ({ showUserActions }) => (
    <div data-testid="page-header">
      Page Header {showUserActions && '(with user actions)'}
    </div>
  )
}))

// Import component after mocks
import YieldCategory from '../categories/YieldCategory.jsx'

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('YieldCategory Improved Cards Design', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  describe('Card Layout and Design', () => {
    it('should remove aspect-square class from all cards', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Check that no cards have aspect-square class
      const squareCards = document.querySelectorAll('.aspect-square')
      expect(squareCards.length).toBe(0)
    })

    it('should use responsive grid without square constraints', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Check grid layouts are still responsive
      const popularGrid = document.querySelector('.yield-category__popular-grid')
      expect(popularGrid).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-3', 'gap-4')

      const allGrid = document.querySelector('.yield-category__all-grid')
      expect(allGrid).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-3', 'gap-4')
    })

    it('should have improved card content layout', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Check for improved padding and layout
      const cardContents = document.querySelectorAll('.yield-category__objective-card [data-slot="card-content"]')
      cardContents.forEach(content => {
        expect(content).toHaveClass('p-5') // Increased padding
        expect(content).not.toHaveClass('h-full', 'flex', 'flex-col', 'justify-between') // Removed flex constraints
      })
    })

    it('should display larger icons and improved typography', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Check for improved icon containers
      const iconContainers = document.querySelectorAll('.yield-category__objective-card .p-3')
      expect(iconContainers.length).toBeGreaterThan(0)

      // Check for larger titles
      const titles = document.querySelectorAll('.yield-category__objective-card h3')
      titles.forEach(title => {
        expect(title).toHaveClass('text-xl') // Larger font size
      })
    })

    it('should have better spaced details section', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Check for improved text sizes in details
      expect(screen.getAllByText('Target:')[0]).toHaveClass('text-sm') // Larger label text
      
      // Check for larger value text (using specific target amount)
      const targetValues = document.querySelectorAll('.text-lg.font-semibold')
      expect(targetValues.length).toBeGreaterThan(0)
    })
  })

  describe('Popular Objectives Section', () => {
    it('should render popular objectives with improved design', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Check for popular objectives
      expect(screen.getAllByText('Emergency Fund').length).toBeGreaterThan(0)
      expect(screen.getAllByText('House Down Payment').length).toBeGreaterThan(0)

      // Check for popular badges (appears in both popular and all sections)
      const popularBadges = screen.getAllByText('Popular')
      expect(popularBadges.length).toBe(4) // 2 popular objectives x 2 sections
    })

    it('should have better description readability', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Check for improved description styling
      const descriptions = document.querySelectorAll('.text-sm.text-gray-600.leading-relaxed')
      expect(descriptions.length).toBeGreaterThan(0)
    })
  })

  describe('All Objectives Section', () => {
    it('should render all objectives with enhanced layout', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Should show all 3 objectives in mock data
      const allCards = document.querySelectorAll('.yield-category__all-grid .yield-category__objective-card')
      expect(allCards.length).toBe(3)
    })

    it('should display both popular and active badges where applicable', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // House Down Payment should have both badges
      const popularBadges = screen.getAllByText('Popular')
      const activeBadges = screen.getAllByText('Active')
      
      expect(popularBadges.length).toBeGreaterThan(0)
      expect(activeBadges.length).toBe(1) // Only House Down Payment is active
    })

    it('should show enhanced progress information for active objectives', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Check for current amount and progress
      expect(screen.getAllByText('Current:').length).toBe(1)
      expect(screen.getAllByText('Progress:').length).toBeGreaterThan(0)
      
      // Check for progress value
      expect(screen.getAllByText('25.4%').length).toBeGreaterThan(0) // Progress
    })
  })

  describe('Custom Objective Section', () => {
    it('should render custom card without square constraints', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const customCard = document.querySelector('.yield-category__custom-card')
      expect(customCard).toBeInTheDocument()
      expect(customCard).not.toHaveClass('aspect-square')
    })

    it('should have improved custom card styling', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const customContent = document.querySelector('.yield-category__custom-card [data-slot="card-content"]')
      expect(customContent).toHaveClass('p-6', 'text-center') // Better padding
      
      // Check for larger title
      const customTitle = screen.getByText('Create Custom')
      expect(customTitle).toHaveClass('text-xl')
    })

    it('should maintain functionality and navigation', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const customCard = document.querySelector('.yield-category__custom-card')
      fireEvent.click(customCard)
      
      expect(mockNavigate).toHaveBeenCalledWith('/yield/custom')
    })
  })

  describe('Interactive Functionality', () => {
    it('should maintain card click functionality', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const firstCard = document.querySelector('.yield-category__objective-card')
      fireEvent.click(firstCard)
      
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/yield/configure?objective='))
    })

    it('should preserve hover effects', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const cards = document.querySelectorAll('.yield-category__objective-card')
      cards.forEach(card => {
        expect(card).toHaveClass('hover:scale-105', 'hover:shadow-lg', 'transition-all', 'duration-200')
      })
    })
  })

  describe('Visual Consistency', () => {
    it('should maintain consistent spacing across all sections', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Check for consistent gap in all grids
      const grids = document.querySelectorAll('.grid-cols-2.md\\:grid-cols-3')
      grids.forEach(grid => {
        expect(grid).toHaveClass('gap-4')
      })
    })

    it('should use consistent border and hover styling', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const objectiveCards = document.querySelectorAll('.yield-category__objective-card')
      objectiveCards.forEach(card => {
        expect(card).toHaveClass('border-2', 'hover:border-purple-200')
      })
    })

    it('should maintain purple theme consistency', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Check header gradient
      const overlay = document.querySelector('.yield-category__header-overlay')
      expect(overlay.getAttribute('style')).toContain('rgba(168, 85, 247')
      
      // Check custom card purple theme
      const customCard = document.querySelector('.yield-category__custom-card')
      expect(customCard).toHaveClass('from-purple-50', 'to-blue-50', 'border-purple-200')
    })
  })
})