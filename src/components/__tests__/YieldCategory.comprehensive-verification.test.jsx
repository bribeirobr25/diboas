/**
 * YieldCategory Comprehensive Verification Test
 * Tests all requested design changes with detailed verification
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
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
      },
      'education-fund': {
        id: 'education-fund',
        title: 'Education Fund',
        description: 'Invest in your future education',
        icon: 'GraduationCap',
        color: 'bg-indigo-100 text-indigo-600',
        targetAmount: 25000,
        timeframe: '2 years',
        expectedApy: '10.2%',
        riskLevel: 'Medium',
        strategy: 'Education-focused DeFi strategies',
        popular: false,
        isActive: true,
        progress: 15.8,
        currentAmount: 3950
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

describe('YieldCategory Comprehensive Verification', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
  })

  describe('1. Background Image Header Implementation', () => {
    it('should have background image with proper styling structure', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Check for header wrapper
      const headerWrapper = document.querySelector('.yield-category__header-with-bg')
      expect(headerWrapper).toBeInTheDocument()

      // Check for background div with inline styles
      const headerBg = document.querySelector('.yield-category__header-bg')
      expect(headerBg).toBeInTheDocument()
      
      // Verify background image URL is set
      const bgStyle = headerBg.getAttribute('style')
      expect(bgStyle).toContain('background-image: url("https://images.unsplash.com/photo-1579621970563-ebec7560ff3e')
      expect(bgStyle).toContain('background-size: cover')
      expect(bgStyle).toContain('background-position: center')
      expect(bgStyle).toContain('border-radius: 1rem')
    })

    it('should have purple gradient overlay', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const overlay = document.querySelector('.yield-category__header-overlay')
      expect(overlay).toBeInTheDocument()
      
      const overlayStyle = overlay.getAttribute('style')
      expect(overlayStyle).toContain('background: linear-gradient(135deg, rgba(168, 85, 247, 0.9), rgba(147, 51, 234, 0.8))')
      expect(overlayStyle).toContain('position: absolute')
      expect(overlayStyle).toContain('inset: 0')
    })

    it('should display white text on background header', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const title = screen.getByText('FinObjective')
      const subtitle = screen.getByText('Goal-Driven DeFi Strategies')
      
      expect(title).toHaveClass('text-white')
      expect(subtitle).toHaveClass('text-white/90')
    })

    it('should have icon with backdrop blur effect', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const iconContainer = document.querySelector('.yield-category__icon')
      expect(iconContainer).toHaveClass('bg-white/20', 'backdrop-blur-sm')
    })
  })

  describe('2. Popular Objectives Section - Square Cards & Responsive Grid', () => {
    it('should use responsive grid: 2 cols mobile, 3 cols desktop', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const popularGrid = document.querySelector('.yield-category__popular-grid')
      expect(popularGrid).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-3', 'gap-4')
    })

    it('should render popular objectives as square cards', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const popularCards = document.querySelectorAll('.yield-category__popular-grid .aspect-square')
      expect(popularCards.length).toBe(2) // 2 popular objectives in mock data
      
      // Verify each card has aspect-square class
      popularCards.forEach(card => {
        expect(card).toHaveClass('aspect-square')
        expect(card).toHaveClass('cursor-pointer')
        expect(card).toHaveClass('transition-all')
        expect(card).toHaveClass('duration-200')
        expect(card).toHaveClass('hover:scale-105')
        expect(card).toHaveClass('hover:shadow-lg')
      })
    })

    it('should display popular objectives with minimalist layout', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Check for Emergency Fund (popular)
      expect(screen.getAllByText('Emergency Fund').length).toBeGreaterThan(0)
      expect(screen.getAllByText('House Down Payment').length).toBeGreaterThan(0)
      
      // Check for Popular badges
      const popularBadges = screen.getAllByText('Popular')
      expect(popularBadges.length).toBeGreaterThan(0)
      
      // Check for compact details
      expect(screen.getAllByText('Target:').length).toBeGreaterThan(0)
      expect(screen.getAllByText('APY:').length).toBeGreaterThan(0)
      expect(screen.getAllByText('Risk:').length).toBeGreaterThan(0)
    })

    it('should use flex layout for proper spacing in square cards', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const cardContents = document.querySelectorAll('.yield-category__popular-grid .aspect-square [data-slot="card-content"]')
      cardContents.forEach(content => {
        expect(content).toHaveClass('h-full', 'flex', 'flex-col', 'justify-between')
      })
    })
  })

  describe('3. All Objectives Section - Same Square Style', () => {
    it('should use same responsive grid as popular section', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const allGrid = document.querySelector('.yield-category__all-grid')
      expect(allGrid).toHaveClass('grid', 'grid-cols-2', 'md:grid-cols-3', 'gap-4')
    })

    it('should render all objectives as square cards', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const allCards = document.querySelectorAll('.yield-category__all-grid .aspect-square')
      expect(allCards.length).toBe(4) // 4 total objectives in mock data
      
      // Verify square styling
      allCards.forEach(card => {
        expect(card).toHaveClass('aspect-square')
        expect(card).toHaveClass('cursor-pointer')
        expect(card).toHaveClass('hover:scale-105')
        expect(card).toHaveClass('hover:shadow-lg')
      })
    })

    it('should highlight active objectives with green styling', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const activeCards = document.querySelectorAll('.yield-category__all-grid .border-green-300')
      expect(activeCards.length).toBe(2) // 2 active objectives in mock data
      
      activeCards.forEach(card => {
        expect(card).toHaveClass('bg-green-50')
      })
      
      // Check for Active badges
      const activeBadges = screen.getAllByText('Active')
      expect(activeBadges.length).toBe(2)
    })

    it('should display both popular and active badges for applicable objectives', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // House Down Payment should have both Popular and Active badges
      const popularBadges = screen.getAllByText('Popular')
      const activeBadges = screen.getAllByText('Active')
      
      expect(popularBadges.length).toBeGreaterThan(0)
      expect(activeBadges.length).toBeGreaterThan(0)
    })

    it('should show progress information for active objectives', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Check for progress labels (they appear in both popular and all sections)
      expect(screen.getAllByText('Progress:').length).toBeGreaterThanOrEqual(2) // Active objectives appear in both sections
      expect(screen.getAllByText('Current:').length).toBeGreaterThanOrEqual(2)
      
      // Check for specific progress values (using getAllByText since they appear in both sections)
      expect(screen.getAllByText('25.4%').length).toBeGreaterThan(0) // House Down Payment
      expect(screen.getAllByText('15.8%').length).toBeGreaterThan(0) // Education Fund
    })
  })

  describe('4. Custom Objective Section - Square Card Format', () => {
    it('should render custom objective as square card in same grid', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const customGrid = document.querySelector('.yield-category__custom .grid')
      expect(customGrid).toHaveClass('grid-cols-2', 'md:grid-cols-3', 'gap-4')
      
      const customCard = document.querySelector('.yield-category__custom-card')
      expect(customCard).toHaveClass('aspect-square')
      expect(customCard).toHaveClass('cursor-pointer')
      expect(customCard).toHaveClass('hover:scale-105')
      expect(customCard).toHaveClass('hover:shadow-lg')
    })

    it('should have purple gradient background and proper styling', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const customCard = document.querySelector('.yield-category__custom-card')
      expect(customCard).toHaveClass('bg-gradient-to-br', 'from-purple-50', 'to-blue-50')
      expect(customCard).toHaveClass('border-2', 'border-purple-200', 'hover:border-purple-300')
    })

    it('should be centered vertically and horizontally', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const customContent = document.querySelector('.yield-category__custom-card [data-slot="card-content"]')
      expect(customContent).toHaveClass('flex', 'flex-col', 'justify-center', 'items-center', 'text-center')
    })

    it('should display custom objective content correctly', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      expect(screen.getByText('Create Custom')).toBeInTheDocument()
      expect(screen.getByText('Design your own financial goal with personalized DeFi strategies')).toBeInTheDocument()
      expect(screen.getByText('Personalized')).toBeInTheDocument()
    })

    it('should be clickable and trigger navigation', () => {
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

  describe('5. Interactive Functionality', () => {
    it('should navigate to objective configuration when cards are clicked', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const firstCard = document.querySelector('.yield-category__objective-card')
      fireEvent.click(firstCard)
      
      expect(mockNavigate).toHaveBeenCalledWith(expect.stringContaining('/yield/configure?objective='))
    })

    it('should navigate back to dashboard when back button is clicked', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const backButton = screen.getByText('Back to Dashboard')
      fireEvent.click(backButton)
      
      expect(mockNavigate).toHaveBeenCalledWith('/app')
    })
  })

  describe('6. Visual Consistency & Styling', () => {
    it('should maintain consistent gap spacing across all grids', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const grids = document.querySelectorAll('.grid-cols-2.md\\:grid-cols-3')
      grids.forEach(grid => {
        expect(grid).toHaveClass('gap-4')
      })
    })

    it('should use consistent purple theme colors', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Header gradient
      const overlay = document.querySelector('.yield-category__header-overlay')
      expect(overlay.getAttribute('style')).toContain('rgba(168, 85, 247')
      
      // Custom card
      const customCard = document.querySelector('.yield-category__custom-card')
      expect(customCard).toHaveClass('from-purple-50', 'to-blue-50', 'border-purple-200')
    })

    it('should have proper hover effects on all cards', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const allCards = document.querySelectorAll('.aspect-square')
      allCards.forEach(card => {
        expect(card).toHaveClass('hover:scale-105')
        expect(card).toHaveClass('transition-all', 'duration-200')
      })
    })

    it('should maintain consistent border styling', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const objectiveCards = document.querySelectorAll('.yield-category__objective-card')
      objectiveCards.forEach(card => {
        expect(card).toHaveClass('border-2')
        expect(card).toHaveClass('hover:border-purple-200')
      })
    })
  })

  describe('7. Content Display & Layout', () => {
    it('should display yield overview section unchanged', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      expect(screen.getByText('Yield Overview')).toBeInTheDocument()
      expect(screen.getByText('Active Strategies')).toBeInTheDocument()
      expect(screen.getByText('Total Earning')).toBeInTheDocument()
      expect(screen.getByText('Avg APY')).toBeInTheDocument()
      expect(screen.getByText('Goals Progress')).toBeInTheDocument()
      
      // Check specific values from mock data
      expect(screen.getByText('2')).toBeInTheDocument() // activeStrategies
      expect(screen.getByText('$234.56')).toBeInTheDocument() // totalEarning
      expect(screen.getByText('8.7%')).toBeInTheDocument() // avgAPY
      expect(screen.getByText('15%')).toBeInTheDocument() // goalsProgress (rounded)
    })

    it('should display educational tips section unchanged', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      expect(screen.getByText('How FinObjective Works')).toBeInTheDocument()
      expect(screen.getByText(/Goal-Oriented:/)).toBeInTheDocument()
      expect(screen.getByText(/Risk-Adjusted:/)).toBeInTheDocument()
      expect(screen.getByText(/Automated Rebalancing:/)).toBeInTheDocument()
      expect(screen.getByText(/Progress Tracking:/)).toBeInTheDocument()
    })

    it('should show trending badge in popular section', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      expect(screen.getByText('Trending')).toBeInTheDocument()
      
      const trendingBadge = screen.getByText('Trending').closest('.yield-category__popular-badge')
      expect(trendingBadge).toHaveClass('bg-purple-100', 'text-purple-800')
    })
  })

  describe('8. Responsive Behavior', () => {
    it('should adapt grid layout for different screen sizes', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // All grids should have responsive classes
      const responsiveGrids = document.querySelectorAll('.grid-cols-2.md\\:grid-cols-3')
      expect(responsiveGrids.length).toBe(3) // popular, all, custom sections
      
      responsiveGrids.forEach(grid => {
        expect(grid).toHaveClass('grid-cols-2') // Mobile: 2 columns
        expect(grid).toHaveClass('md:grid-cols-3') // Desktop: 3 columns
      })
    })

    it('should maintain square aspect ratio at all screen sizes', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      const squareCards = document.querySelectorAll('.aspect-square')
      expect(squareCards.length).toBeGreaterThan(0)
      
      squareCards.forEach(card => {
        expect(card).toHaveClass('aspect-square')
      })
    })

    it('should use responsive text sizes', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Header should have responsive text
      const headerTitle = screen.getByText('FinObjective')
      expect(headerTitle).toHaveClass('text-3xl')
      
      // Cards should have appropriate text sizes
      const cardTitles = document.querySelectorAll('.aspect-square h3')
      cardTitles.forEach(title => {
        expect(title).toHaveClass('text-lg')
      })
    })
  })
})