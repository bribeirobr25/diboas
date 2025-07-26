/**
 * Test Utilities and Helpers
 * Common utilities for testing across the application
 */

import { vi } from 'vitest'

/**
 * Mock fetch with custom responses
 */
export const mockFetch = (response) => {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      status: 200,
      json: () => Promise.resolve(response),
      text: () => Promise.resolve(JSON.stringify(response)),
    })
  )
}

/**
 * Common API response mocks
 */
export const mockApiResponses = {
  marketData: {
    bitcoin: {
      id: 'bitcoin',
      symbol: 'btc',
      name: 'Bitcoin',
      current_price: 45000,
      price_change_percentage_24h: -2.5,
      market_cap: 850000000000,
      volume_24h: 25000000000
    },
    ethereum: {
      id: 'ethereum',
      symbol: 'eth',
      name: 'Ethereum',
      current_price: 3200,
      price_change_percentage_24h: 1.8,
      market_cap: 380000000000,
      volume_24h: 15000000000
    }
  },
  transactionStatus: {
    pending: {
      id: 'tx-123',
      status: 'pending',
      progress: 0,
      estimatedTimeRemaining: 300
    },
    completed: {
      id: 'tx-123',
      status: 'completed',
      progress: 100,
      onChainHash: '0x1234567890abcdef'
    }
  }
}

/**
 * Mock React Router
 */
export const mockRouter = {
  navigate: vi.fn(),
  location: { pathname: '/', search: '', hash: '', state: null },
  params: {}
}

/**
 * Test data generators
 */
export const generateTestTransaction = (overrides = {}) => ({
  id: 'test-tx-' + Math.random().toString(36).substr(2, 9),
  type: 'send',
  amount: '100.00',
  currency: 'USD',
  status: 'pending',
  timestamp: new Date().toISOString(),
  ...overrides
})

export const generateTestUser = (overrides = {}) => ({
  id: 'test-user-' + Math.random().toString(36).substr(2, 9),
  username: 'testuser',
  email: 'test@example.com',
  verified: true,
  ...overrides
})

/**
 * Component test wrappers
 */
export const renderWithProviders = (ui, options = {}) => {
  // This would include providers like Router, Theme, etc.
  // For now, we'll keep it simple
  return ui
}

/**
 * Wait for async operations in tests
 */
export const waitForAsync = (ms = 0) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Mock console methods for testing
 */
export const mockConsole = () => {
  const originalConsole = { ...console }
  
  beforeEach(() => {
    console.error = vi.fn()
    console.warn = vi.fn()
    console.log = vi.fn()
  })
  
  afterEach(() => {
    Object.assign(console, originalConsole)
  })
}