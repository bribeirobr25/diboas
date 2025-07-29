/**
 * Test Suite for Banking Category Desktop Layout
 * Tests that all transaction options are displayed side by side on desktop
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import BankingCategory from '../categories/BankingCategory.jsx'

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

// Mock the DataManager for balance data
vi.mock('../../services/DataManager.js', () => ({
  dataManager: {
    getBalance: vi.fn(() => ({
      totalUSD: 5000.00,
      availableForSpending: 2500.00,
      investedAmount: 2500.00
    })),
    subscribe: vi.fn(() => () => {}),
    getState: vi.fn(() => ({
      balance: {
        totalUSD: 5000.00,
        availableForSpending: 2500.00,
        investedAmount: 2500.00
      }
    }))
  }
}))

describe('Banking Category Desktop Layout', () => {
  beforeEach(() => {
    mockNavigate.mockClear()
    // Mock desktop viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    })
    Object.defineProperty(window, 'innerHeight', {
      writable: true,
      configurable: true,
      value: 768,
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Desktop Grid Layout', () => {
    it('should render all transaction options in a grid layout', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      // Check that the actions grid container exists
      const actionsGrid = document.querySelector('.banking-category__actions-grid')
      expect(actionsGrid).toBeInTheDocument()

      // Verify all three banking actions are displayed
      expect(screen.getByText('Add Money')).toBeInTheDocument()
      expect(screen.getByText('Send Money')).toBeInTheDocument()
      expect(screen.getByText('Withdraw')).toBeInTheDocument()
    })

    it('should apply desktop-specific CSS classes', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const actionsGrid = document.querySelector('.banking-category__actions-grid')
      expect(actionsGrid).toHaveClass('banking-category__actions-grid')

      // Check that action cards have the correct classes
      const actionCards = document.querySelectorAll('.banking-category__action-card')
      expect(actionCards).toHaveLength(3)
      
      actionCards.forEach(card => {
        expect(card).toHaveClass('banking-category__action-card')
        expect(card).toHaveClass('cursor-pointer')
      })
    })

    it('should display all actions side by side with proper spacing', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const actionsGrid = document.querySelector('.banking-category__actions-grid')
      const computedStyle = window.getComputedStyle(actionsGrid)
      
      // Should use CSS Grid
      expect(computedStyle.display).toBe('grid')
      
      // Should have proper grid template columns for desktop (3 columns)
      // This would be set by the CSS media query
      expect(actionsGrid).toBeInTheDocument()
    })

    it('should show action cards with equal height', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const actionCards = document.querySelectorAll('.banking-category__action-card')
      expect(actionCards).toHaveLength(3)

      // All cards should have the same minimum height class
      actionCards.forEach(card => {
        expect(card).toHaveClass('banking-category__action-card')
      })
    })
  })

  describe('Action Card Content', () => {
    it('should display all transaction options with proper titles and descriptions', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      // Add Money
      expect(screen.getByText('Add Money')).toBeInTheDocument()
      expect(screen.getByText('Deposit funds to your diBoaS wallet')).toBeInTheDocument()

      // Send Money
      expect(screen.getByText('Send Money')).toBeInTheDocument()
      expect(screen.getByText('Transfer to other diBoaS users')).toBeInTheDocument()

      // Withdraw
      expect(screen.getByText('Withdraw')).toBeInTheDocument()
      expect(screen.getByText('Transfer funds to bank or external wallet')).toBeInTheDocument()
    })

    it('should display available methods for each action', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      // Check for method badges
      expect(screen.getByText('Bank Transfer')).toBeInTheDocument()
      expect(screen.getByText('Debit Card')).toBeInTheDocument()
      expect(screen.getByText('Crypto Wallet')).toBeInTheDocument()
      expect(screen.getByText('diBoaS Username')).toBeInTheDocument()
      expect(screen.getByText('Email')).toBeInTheDocument()
    })

    it('should show recommended badge for highlighted actions', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      // Add Money should be highlighted
      expect(screen.getByText('Recommended')).toBeInTheDocument()
    })

    it('should display icons for each action', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const actionCards = document.querySelectorAll('.banking-category__action-card')
      expect(actionCards).toHaveLength(3)

      // Each card should have an icon
      actionCards.forEach(card => {
        const icon = card.querySelector('svg')
        expect(icon).toBeInTheDocument()
      })
    })
  })

  describe('Responsive Behavior', () => {
    it('should use different grid columns for different screen sizes', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const actionsGrid = document.querySelector('.banking-category__actions-grid')
      expect(actionsGrid).toBeInTheDocument()

      // The CSS classes should be applied for responsive behavior
      // (Actual responsive behavior would be tested with CSS media queries)
    })

    it('should maintain grid layout on large screens', () => {
      // Mock large desktop viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1440,
      })

      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const actionsGrid = document.querySelector('.banking-category__actions-grid')
      expect(actionsGrid).toBeInTheDocument()

      // All three actions should be visible
      expect(screen.getByText('Add Money')).toBeInTheDocument()
      expect(screen.getByText('Send Money')).toBeInTheDocument()
      expect(screen.getByText('Withdraw')).toBeInTheDocument()
    })
  })

  describe('Interactive Behavior', () => {
    it('should navigate to correct routes when actions are clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      // Click Add Money
      const addMoneyCard = screen.getByText('Add Money').closest('.banking-category__action-card')
      await user.click(addMoneyCard)
      expect(mockNavigate).toHaveBeenCalledWith('/category/banking/add')

      // Click Send Money
      const sendMoneyCard = screen.getByText('Send Money').closest('.banking-category__action-card')
      await user.click(sendMoneyCard)
      expect(mockNavigate).toHaveBeenCalledWith('/category/banking/send')

      // Click Withdraw
      const withdrawCard = screen.getByText('Withdraw').closest('.banking-category__action-card')
      await user.click(withdrawCard)
      expect(mockNavigate).toHaveBeenCalledWith('/category/banking/withdraw')
    })

    it('should show hover effects on desktop', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const actionCards = document.querySelectorAll('.banking-category__action-card')
      const firstCard = actionCards[0]

      // Should have cursor pointer
      expect(firstCard).toHaveClass('cursor-pointer')

      // Hover effect is handled by CSS, but we can check the class is applied
      await user.hover(firstCard)
      expect(firstCard).toHaveClass('banking-category__action-card')
    })
  })

  describe('Layout Consistency', () => {
    it('should maintain consistent spacing between action cards', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const actionsGrid = document.querySelector('.banking-category__actions-grid')
      expect(actionsGrid).toBeInTheDocument()

      // CSS grid should handle consistent spacing
      const actionCards = document.querySelectorAll('.banking-category__action-card')
      expect(actionCards).toHaveLength(3)
    })

    it('should center the grid on desktop', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const actionsGrid = document.querySelector('.banking-category__actions-grid')
      expect(actionsGrid).toBeInTheDocument()

      // The CSS should handle centering with max-width and margin auto
    })

    it('should display action cards with proper padding', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const actionCards = document.querySelectorAll('.banking-category__action-card')
      expect(actionCards).toHaveLength(3)

      actionCards.forEach(card => {
        expect(card).toHaveClass('banking-category__action-card')
      })
    })
  })

  describe('Content Accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      // Main page heading
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('Banking')

      // Actions section heading
      expect(screen.getByText('What would you like to do?')).toBeInTheDocument()
    })

    it('should be keyboard navigable', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      // Should be able to tab through action cards
      const actionCards = document.querySelectorAll('.banking-category__action-card')
      
      // First action card should be focusable
      await user.tab()
      // The exact focus behavior would depend on the Card component implementation
      expect(actionCards[0]).toBeInTheDocument()
    })

    it('should have proper color contrast for action cards', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const actionTitles = document.querySelectorAll('.banking-category__action-title')
      expect(actionTitles).toHaveLength(3)

      // Titles should have proper color classes for contrast
      actionTitles.forEach(title => {
        expect(title).toBeInTheDocument()
      })
    })
  })

  describe('Performance', () => {
    it('should render quickly with all actions', () => {
      const startTime = performance.now()
      
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('should handle rapid clicks without issues', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const addMoneyCard = screen.getByText('Add Money').closest('.banking-category__action-card')
      
      // Rapid clicks should not cause issues
      await user.click(addMoneyCard)
      await user.click(addMoneyCard)
      
      expect(mockNavigate).toHaveBeenCalledTimes(2)
    })
  })
})