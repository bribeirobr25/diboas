/**
 * Test utilities for React component testing
 * Provides common testing helpers and setup functions
 */

import { render, act } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'

/**
 * Enhanced render function that wraps components with necessary providers
 */
export const renderWithProviders = (ui, options = {}) => {
  const {
    route = '/',
    ...renderOptions
  } = options

  // Create wrapper component with providers
  const Wrapper = ({ children }) => {
    return (
      <BrowserRouter>
        {children}
      </BrowserRouter>
    )
  }

  let result
  act(() => {
    result = render(ui, { wrapper: Wrapper, ...renderOptions })
  })
  
  return result
}

/**
 * Helper to create mock hooks for testing
 */
export const createMockHook = (returnValue) => {
  return vi.fn(() => returnValue)
}

/**
 * Helper to safely fire events with act() wrapper
 */
export const safeFireEvent = (callback) => {
  act(() => {
    callback()
  })
}

/**
 * Default mock data for testing
 */
export const mockAccountData = {
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
}

export const mockTransactionData = {
  transactions: [
    {
      id: 'tx-1',
      type: 'deposit',
      amount: 100.00,
      currency: 'USD',
      status: 'completed',
      timestamp: new Date().toISOString()
    }
  ],
  isLoading: false,
  error: null,
  hasMore: false,
  loadMore: vi.fn()
}

/**
 * Create mock environment for tests
 */
export const setupTestEnvironment = () => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  })

  // Mock performance.now
  if (!window.performance) {
    window.performance = {}
  }
  if (!window.performance.now) {
    window.performance.now = vi.fn(() => Date.now())
  }

  // Mock ResizeObserver
  global.ResizeObserver = vi.fn().mockImplementation(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
  }))
}

/**
 * Helper to test component rendering without errors
 */
export const expectComponentToRender = (component) => {
  expect(() => {
    renderWithProviders(component)
  }).not.toThrow()
}

/**
 * Helper to test component has semantic CSS classes
 */
export const expectSemanticClasses = (container, classPatterns = []) => {
  const defaultPatterns = [
    '.page-container',
    '.dashboard-grid', 
    '[class*="semantic-"]',
    '[class*="transaction-"]',
    '[class*="account-"]'
  ]
  
  const allPatterns = [...defaultPatterns, ...classPatterns]
  
  const hasSemanticClasses = allPatterns.some(pattern => {
    return container.querySelector(pattern) !== null
  })
  
  expect(hasSemanticClasses).toBe(true)
}

/**
 * Performance test helper
 */
export const expectPerformantRender = (renderFn, maxTime = 150) => {
  const startTime = performance.now()
  renderFn()
  const endTime = performance.now()
  
  expect(endTime - startTime).toBeLessThan(maxTime)
}