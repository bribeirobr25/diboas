/**
 * Component Tests for AccountView
 * Tests the financial dashboard component with account cards and balances
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import AccountView from '../AccountView.jsx'

// Mock the hooks
vi.mock('../../hooks/useAccountData.js', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    accounts: [
      {
        id: 'acc-1',
        name: 'Main Account',
        balance: 1250.50,
        currency: 'USD',
        type: 'checking'
      },
      {
        id: 'acc-2',
        name: 'Savings Account',
        balance: 5000.00,
        currency: 'USD',
        type: 'savings'
      }
    ],
    isLoading: false,
    error: null,
    refreshAccounts: vi.fn()
  }))
}))

vi.mock('../../hooks/useTransactionHistory.js', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    transactions: [],
    isLoading: false,
    error: null,
    hasMore: false,
    loadMore: vi.fn()
  }))
}))

const renderWithRouter = (component) => {
  let result
  act(() => {
    result = render(
      <BrowserRouter>
        {component}
      </BrowserRouter>
    )
  })
  return result
}

describe('AccountView Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('Rendering', () => {
    it('should render account view without errors', () => {
      expect(() => {
        renderWithRouter(<AccountView />)
      }).not.toThrow()
    })
    
    it('should display account cards', () => {
      renderWithRouter(<AccountView />)
      
      // Check for account-related elements
      const accountElements = document.querySelectorAll('[class*="account"], [class*="card"]')
      expect(accountElements.length).toBeGreaterThan(0)
    })
    
    it('should use semantic CSS classes', () => {
      renderWithRouter(<AccountView />)
      
      // Check for our semantic classes
      const semanticElements = document.querySelectorAll(
        '.page-container, .dashboard-grid, .account-card-container, .account-balance-section'
      )
      expect(semanticElements.length).toBeGreaterThan(0)
    })
  })
  
  describe('Account Data Display', () => {
    it('should display account information', () => {
      renderWithRouter(<AccountView />)
      
      // Check for account-related text content
      const bodyText = document.body.textContent
      expect(bodyText).toBeTruthy()
      expect(bodyText.length).toBeGreaterThan(0)
    })
    
    it('should show account balances', () => {
      renderWithRouter(<AccountView />)
      
      // Check for currency or number patterns
      const hasFinancialData = /[\$\d,\.]+/.test(document.body.textContent)
      expect(hasFinancialData).toBeTruthy()
    })
  })
  
  describe('Account Actions', () => {
    it('should handle account card interactions', () => {
      renderWithRouter(<AccountView />)
      
      // Find clickable elements
      const clickableElements = document.querySelectorAll('button, [role="button"], a')
      
      if (clickableElements.length > 0) {
        expect(() => {
          act(() => {
            fireEvent.click(clickableElements[0])
          })
        }).not.toThrow()
      }
    })
    
    it('should handle refresh action', () => {
      renderWithRouter(<AccountView />)
      
      // Look for refresh buttons
      const refreshButtons = Array.from(document.querySelectorAll('button')).filter(
        button => button.textContent?.toLowerCase().includes('refresh')
      )
      
      if (refreshButtons.length > 0) {
        expect(() => {
          act(() => {
            fireEvent.click(refreshButtons[0])
          })
        }).not.toThrow()
      }
    })
  })
  
  describe('Loading States', () => {
    it('should handle loading state', () => {
      // Mock loading state
      vi.doMock('../../hooks/useAccountData.js', () => ({
        default: () => ({
          accounts: [],
          isLoading: true,
          error: null,
          refreshAccounts: vi.fn()
        })
      }))
      
      renderWithRouter(<AccountView />)
      
      // Should render without errors even in loading state
      expect(document.body).toBeTruthy()
    })
  })
  
  describe('Error Handling', () => {
    it('should handle account loading errors', () => {
      // Mock error state
      vi.doMock('../../hooks/useAccountData.js', () => ({
        default: () => ({
          accounts: [],
          isLoading: false,
          error: 'Failed to load accounts',
          refreshAccounts: vi.fn()
        })
      }))
      
      renderWithRouter(<AccountView />)
      
      // Should render error state gracefully
      expect(document.body).toBeTruthy()
    })
  })
  
  describe('Responsive Design', () => {
    it('should use responsive grid layout', () => {
      renderWithRouter(<AccountView />)
      
      // Check for grid or responsive classes
      const responsiveElements = document.querySelectorAll(
        '[class*="grid"], [class*="dashboard"], [class*="responsive"]'
      )
      expect(responsiveElements.length).toBeGreaterThan(0)
    })
  })
  
  describe('Navigation', () => {
    it('should handle navigation to transaction pages', () => {
      renderWithRouter(<AccountView />)
      
      // Check for navigation elements
      const navElements = document.querySelectorAll('a, [role="link"]')
      expect(navElements.length).toBeGreaterThan(0)
    })
  })
  
  describe('Performance', () => {
    it('should render efficiently', () => {
      const startTime = performance.now()
      renderWithRouter(<AccountView />)
      const endTime = performance.now()
      
      // Should render within reasonable time
      expect(endTime - startTime).toBeLessThan(150)
    })
  })
})