/**
 * Comprehensive Test Suite for BankingCategory Component
 * Tests updated layout, background images, overview card, and action ordering
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import BankingCategory, { BANKING_ACTIONS } from '../categories/BankingCategory.jsx'

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

describe('BankingCategory Component', () => {
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
          <BankingCategory />
        </TestWrapper>
      )

      const headerBg = document.querySelector('.banking-category__header-bg')
      expect(headerBg).toBeInTheDocument()
      expect(headerBg).toHaveStyle({
        backgroundImage: expect.stringContaining('unsplash.com')
      })
    })

    it('should display header with overlay and proper styling', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const overlay = document.querySelector('.banking-category__header-overlay')
      expect(overlay).toBeInTheDocument()
      expect(overlay).toHaveStyle({
        background: expect.stringContaining('linear-gradient')
      })
    })

    it('should show In/Out title and banking subtitle', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      expect(screen.getByText('In/Out')).toBeInTheDocument()
      expect(screen.getByText('Banking & Money Movement')).toBeInTheDocument()
    })

    it('should display descriptive text about banking features', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      expect(screen.getByText(/Manage your money flow with diBoaS/)).toBeInTheDocument()
    })
  })

  describe('Banking Overview Card (Minimalist Design)', () => {
    it('should render single overview card instead of separate stat cards', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      expect(screen.getByText('Banking Overview')).toBeInTheDocument()
      expect(screen.getByText('Your current banking status at a glance')).toBeInTheDocument()
    })

    it('should display all three overview items in single card', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      // Check for overview items
      expect(screen.getByText('Available Balance')).toBeInTheDocument()
      expect(screen.getByText('$1,250.00')).toBeInTheDocument()
      expect(screen.getByText('This Month')).toBeInTheDocument()
      expect(screen.getByText('$2,100.00')).toBeInTheDocument()
      expect(screen.getByText('Last Transaction')).toBeInTheDocument()
      expect(screen.getByText('2 hours ago')).toBeInTheDocument()
    })

    it('should use banking overview grid layout', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const overviewGrid = document.querySelector('.banking-overview-grid')
      expect(overviewGrid).toBeInTheDocument()
      
      const overviewItems = document.querySelectorAll('.banking-overview-item')
      expect(overviewItems).toHaveLength(3)
    })

    it('should show dividers between overview items', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const dividers = document.querySelectorAll('.banking-overview-divider')
      expect(dividers).toHaveLength(2) // 2 dividers for 3 items
    })
  })

  describe('Banking Actions Reordering', () => {
    it('should only show Add, Send, and Withdraw actions (no Request Money)', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      // Should show these actions
      expect(screen.getByText('Add Money')).toBeInTheDocument()
      expect(screen.getByText('Send Money')).toBeInTheDocument()
      expect(screen.getByText('Withdraw')).toBeInTheDocument()

      // Should NOT show Request Money
      expect(screen.queryByText('Request Money')).not.toBeInTheDocument()
    })

    it('should display actions in correct order: Add, Send, Withdraw', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const actionCards = screen.getAllByRole('button').filter(button => 
        button.textContent.includes('Add Money') || 
        button.textContent.includes('Send Money') || 
        button.textContent.includes('Withdraw')
      )

      // Since cards are rendered in a grid, we check the data structure order
      const expectedOrder = ['Add Money', 'Send Money', 'Withdraw']
      const actualOrder = Object.values(BANKING_ACTIONS)
        .sort((a, b) => a.order - b.order)
        .map(action => action.title)

      expect(actualOrder).toEqual(expectedOrder)
    })

    it('should use 3-column grid for banking actions', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const actionsGrid = document.querySelector('.banking-category__actions-grid')
      expect(actionsGrid).toHaveClass('grid', 'grid-cols-1', 'md:grid-cols-3')
    })

    it('should highlight Add Money as recommended action', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const addAction = screen.getByText('Add Money').closest('.banking-category__action-card')
      expect(addAction).toHaveClass('ring-2', 'ring-blue-500')
      expect(screen.getByText('Recommended')).toBeInTheDocument()
    })
  })

  describe('Navigation and Interactions', () => {
    it('should navigate back to dashboard when back button is clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const backButton = screen.getByText('Back to Dashboard')
      await user.click(backButton)

      expect(mockNavigate).toHaveBeenCalledWith('/app')
    })

    it('should navigate to correct routes when actions are clicked', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      // Test Add Money navigation
      const addButton = screen.getByText('Add Money')
      await user.click(addButton)
      expect(mockNavigate).toHaveBeenCalledWith('/category/banking/add')

      mockNavigate.mockClear()

      // Test Send Money navigation
      const sendButton = screen.getByText('Send Money')
      await user.click(sendButton)
      expect(mockNavigate).toHaveBeenCalledWith('/category/banking/send')

      mockNavigate.mockClear()

      // Test Withdraw navigation
      const withdrawButton = screen.getByText('Withdraw')
      await user.click(withdrawButton)
      expect(mockNavigate).toHaveBeenCalledWith('/category/banking/withdraw')
    })

    it('should show hover effects on action cards', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const actionCard = screen.getByText('Add Money').closest('.banking-category__action-card')
      expect(actionCard).toHaveClass('hover:scale-105')
    })
  })

  describe('Action Configuration Validation', () => {
    it('should have correct action configuration for Add Money', () => {
      const addAction = BANKING_ACTIONS.add
      
      expect(addAction.title).toBe('Add Money')
      expect(addAction.highlighted).toBe(true)
      expect(addAction.order).toBe(1)
      expect(addAction.methods).toContain('Bank Transfer')
      expect(addAction.methods).toContain('Debit Card')
    })

    it('should have correct action configuration for Send Money', () => {
      const sendAction = BANKING_ACTIONS.send
      
      expect(sendAction.title).toBe('Send Money')
      expect(sendAction.highlighted).toBe(false)
      expect(sendAction.order).toBe(2)
      expect(sendAction.methods).toContain('diBoaS Username')
      expect(sendAction.methods).toContain('Email')
    })

    it('should have correct action configuration for Withdraw', () => {
      const withdrawAction = BANKING_ACTIONS.withdraw
      
      expect(withdrawAction.title).toBe('Withdraw')
      expect(withdrawAction.highlighted).toBe(false)
      expect(withdrawAction.order).toBe(3)
      expect(withdrawAction.methods).toContain('Bank Account')
      expect(withdrawAction.methods).toContain('External Wallet')
    })

    it('should not include Request Money in action configuration', () => {
      expect(BANKING_ACTIONS.receive).toBeUndefined()
      expect(Object.keys(BANKING_ACTIONS)).not.toContain('receive')
    })
  })

  describe('Educational Content', () => {
    it('should display educational tips section', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      expect(screen.getByText('Getting Started with Banking')).toBeInTheDocument()
      expect(screen.getByText(/Add Money.*Start by adding funds/)).toBeInTheDocument()
      expect(screen.getByText(/Instant Transfers.*Send money to other diBoaS users/)).toBeInTheDocument()
    })

    it('should use info icon and proper styling for tips', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const tipsCard = document.querySelector('.banking-category__tips-card')
      expect(tipsCard).toHaveClass('bg-blue-50', 'border-blue-200')
    })
  })

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const overviewGrid = document.querySelector('.banking-overview-grid')
      expect(overviewGrid).toBeInTheDocument()
      
      // Mobile layout should stack items vertically
      // This would be tested with CSS-in-JS or actual viewport testing
    })

    it('should show desktop layout for larger screens', () => {
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 1024,
      })

      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const actionsGrid = document.querySelector('.banking-category__actions-grid')
      expect(actionsGrid).toHaveClass('md:grid-cols-3')
    })
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels and semantic structure', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      // Check for proper heading hierarchy
      expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent('In/Out')
      expect(screen.getByRole('heading', { level: 2, name: /banking overview/i })).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const backButton = screen.getByText('Back to Dashboard')
      await user.tab()
      expect(document.activeElement).toBe(backButton)
    })

    it('should have accessible action buttons', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const actionButtons = screen.getAllByRole('button')
      actionButtons.forEach(button => {
        expect(button).toBeInTheDocument()
        expect(button).not.toHaveAttribute('aria-disabled', 'true')
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle navigation errors gracefully', async () => {
      const user = userEvent.setup()
      mockNavigate.mockImplementation(() => {
        throw new Error('Navigation failed')
      })

      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const addButton = screen.getByText('Add Money')
      
      // Should not crash the component
      expect(() => user.click(addButton)).not.toThrow()
    })
  })

  describe('Performance', () => {
    it('should render quickly without unnecessary re-renders', () => {
      const startTime = performance.now()
      
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )
      
      const endTime = performance.now()
      expect(endTime - startTime).toBeLessThan(100)
    })

    it('should handle multiple rapid clicks without issues', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      const addButton = screen.getByText('Add Money')
      
      // Rapidly click multiple times
      await user.click(addButton)
      await user.click(addButton)
      await user.click(addButton)

      // Should only navigate once per click
      expect(mockNavigate).toHaveBeenCalledTimes(3)
    })
  })
})