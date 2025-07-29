/**
 * CategoryDashboard Component Tests
 * Tests the category-based navigation dashboard functionality
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import CategoryDashboard from '../CategoryDashboard.jsx'

// Get the mocked function
const { useFeatureFlag } = vi.hoisted(() => ({
  useFeatureFlag: vi.fn()
}))

// Mock the feature flag
vi.mock('../../../config/featureFlags.js', () => ({
  useFeatureFlag
}))

// Mock the useNavigate hook
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

describe('CategoryDashboard', () => {

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Feature Flag Integration', () => {
    test('renders when categories feature flag is enabled', () => {
      useFeatureFlag.mockReturnValue(true)

      render(
        <BrowserRouter>
          <CategoryDashboard />
        </BrowserRouter>
      )

      expect(screen.getByText('What would you like to do?')).toBeInTheDocument()
      expect(screen.getByText('Choose a category to get started with your financial journey')).toBeInTheDocument()
    })

    test('does not render when categories feature flag is disabled', () => {
      useFeatureFlag.mockReturnValue(false)

      const { container } = render(
        <BrowserRouter>
          <CategoryDashboard />
        </BrowserRouter>
      )

      expect(container.firstChild).toBeNull()
    })
  })

  describe('Category Display', () => {
    beforeEach(() => {
      useFeatureFlag.mockReturnValue(true)
    })

    test('displays all three category cards', () => {
      render(
        <BrowserRouter>
          <CategoryDashboard />
        </BrowserRouter>
      )

      // Check for all three categories using getAllByText to handle duplicates
      expect(screen.getAllByText('In/Out')).toHaveLength(2) // Title and helper text
      expect(screen.getByText('Buy/Sell')).toBeInTheDocument()
      expect(screen.getByText('FinObjective')).toBeInTheDocument()

      // Check for subtitles
      expect(screen.getByText('Banking')).toBeInTheDocument()
      expect(screen.getByText('Invest')).toBeInTheDocument()
      expect(screen.getByText('Yield')).toBeInTheDocument()

      // Check for descriptions
      expect(screen.getByText('Move money in and out of your diBoaS wallet')).toBeInTheDocument()
      expect(screen.getByText('Build your portfolio with crypto and tokenized assets')).toBeInTheDocument()
      expect(screen.getByText('Grow your wealth with goal-driven DeFi strategies')).toBeInTheDocument()
    })

    test('displays highlight actions for each category', () => {
      render(
        <BrowserRouter>
          <CategoryDashboard />
        </BrowserRouter>
      )

      expect(screen.getByText('Add Money')).toBeInTheDocument()
      expect(screen.getByText('Crypto')).toBeInTheDocument()
      expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
    })

    test('displays helper text for new users', () => {
      render(
        <BrowserRouter>
          <CategoryDashboard />
        </BrowserRouter>
      )

      expect(screen.getByText(/New to diBoaS/)).toBeInTheDocument()
      expect(screen.getByText(/Start with/)).toBeInTheDocument()
      expect(screen.getAllByText(/In\/Out/)).toHaveLength(2) // Title and helper text
      expect(screen.getByText(/to add money to your wallet/)).toBeInTheDocument()
    })
  })

  describe('Navigation', () => {
    beforeEach(() => {
      useFeatureFlag.mockReturnValue(true)
    })

    test('navigates to banking category when clicked', () => {
      render(
        <BrowserRouter>
          <CategoryDashboard />
        </BrowserRouter>
      )

      // Get the banking card specifically using the title element
      const bankingTitleElements = screen.getAllByText('In/Out')
      const bankingCard = bankingTitleElements[0].closest('.category-card')
      fireEvent.click(bankingCard)

      expect(mockNavigate).toHaveBeenCalledWith('/category/banking')
    })

    test('navigates to investment category when clicked', () => {
      render(
        <BrowserRouter>
          <CategoryDashboard />
        </BrowserRouter>
      )

      const investmentCard = screen.getByText('Buy/Sell').closest('.category-card')
      fireEvent.click(investmentCard)

      expect(mockNavigate).toHaveBeenCalledWith('/category/investment')
    })

    test('navigates to yield category when clicked', () => {
      render(
        <BrowserRouter>
          <CategoryDashboard />
        </BrowserRouter>
      )

      const yieldCard = screen.getByText('FinObjective').closest('.category-card')
      fireEvent.click(yieldCard)

      expect(mockNavigate).toHaveBeenCalledWith('/category/yield')
    })

    test('navigates when highlight button is clicked', () => {
      render(
        <BrowserRouter>
          <CategoryDashboard />
        </BrowserRouter>
      )

      const addMoneyButton = screen.getByText('Add Money')
      fireEvent.click(addMoneyButton)

      expect(mockNavigate).toHaveBeenCalledWith('/category/banking')
    })
  })

  describe('CSS Classes and Styling', () => {
    beforeEach(() => {
      useFeatureFlag.mockReturnValue(true)
    })

    test('applies semantic CSS classes', () => {
      render(
        <BrowserRouter>
          <CategoryDashboard />
        </BrowserRouter>
      )

      // Check main container class
      expect(document.querySelector('.category-dashboard')).toBeInTheDocument()
      
      // Check header classes
      expect(document.querySelector('.category-dashboard__header')).toBeInTheDocument()
      expect(document.querySelector('.category-dashboard__title')).toBeInTheDocument()
      expect(document.querySelector('.category-dashboard__description')).toBeInTheDocument()
      
      // Check grid and footer classes
      expect(document.querySelector('.category-dashboard__grid')).toBeInTheDocument()
      expect(document.querySelector('.category-dashboard__footer')).toBeInTheDocument()
    })

    test('applies custom className prop', () => {
      render(
        <BrowserRouter>
          <CategoryDashboard className="custom-class" />
        </BrowserRouter>
      )

      expect(document.querySelector('.category-dashboard.custom-class')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    beforeEach(() => {
      useFeatureFlag.mockReturnValue(true)
    })

    test('has proper semantic structure', () => {
      render(
        <BrowserRouter>
          <CategoryDashboard />
        </BrowserRouter>
      )

      // Check for semantic HTML elements
      expect(screen.getByRole('heading', { level: 2 })).toBeInTheDocument()
      expect(screen.getByText('What would you like to do?')).toBeInTheDocument()
    })

    test('category cards are interactive and accessible', () => {
      render(
        <BrowserRouter>
          <CategoryDashboard />
        </BrowserRouter>
      )

      const categoryCards = document.querySelectorAll('.category-card')
      expect(categoryCards).toHaveLength(3)

      categoryCards.forEach(card => {
        expect(card).toHaveClass('interactive-card')
      })
    })
  })

  describe('Integration with Category Configuration', () => {
    beforeEach(() => {
      useFeatureFlag.mockReturnValue(true)
    })

    test('exports CATEGORIES configuration for other components', async () => {
      // Test that the CATEGORIES export is available
      const { CATEGORIES } = await import('../CategoryDashboard.jsx')
      
      expect(CATEGORIES).toBeDefined()
      expect(CATEGORIES.banking).toEqual({
        id: 'banking',
        title: 'In/Out',
        subtitle: 'Banking',
        description: 'Move money in and out of your diBoaS wallet',
        highlight: 'Add Money',
        route: '/category/banking'
      })
      
      expect(CATEGORIES.investment).toEqual({
        id: 'investment',
        title: 'Buy/Sell',
        subtitle: 'Invest',
        description: 'Build your portfolio with crypto and tokenized assets',
        highlight: 'Crypto',
        route: '/category/investment'
      })
      
      expect(CATEGORIES.yield).toEqual({
        id: 'yield',
        title: 'FinObjective',
        subtitle: 'Yield',
        description: 'Grow your wealth with goal-driven DeFi strategies',
        highlight: 'Emergency Fund',
        route: '/category/yield'
      })
    })
  })
})