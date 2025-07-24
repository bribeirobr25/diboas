/**
 * Test Helper Utilities
 * Common utilities for testing React components and business logic
 */

import { render } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import { mockUser, mockBalance, mockFeatureFlags } from '../mocks/mockData.js'

/**
 * Custom render function with providers
 */
export const renderWithProviders = (ui, options = {}) => {
  const {
    route = '/',
    user = mockUser,
    balance = mockBalance,
    featureFlags = mockFeatureFlags,
    ...renderOptions
  } = options

  // Mock the hooks that components might use
  const mockDataManager = {
    subscribe: vi.fn(() => vi.fn()), // Returns unsubscribe function
    emit: vi.fn(),
    getBalance: vi.fn().mockReturnValue(balance)
  }

  const mockFeatureFlagManager = {
    isEnabled: vi.fn((flag) => featureFlags[flag] || false),
    getEnabledFeatures: vi.fn().mockReturnValue(featureFlags)
  }

  // Set initial URL (only if window.history exists)
  if (typeof window !== 'undefined' && window.history) {
    window.history.pushState({}, 'Test page', route)
  }

  const Wrapper = ({ children }) => (
    <BrowserRouter>
      {children}
    </BrowserRouter>
  )

  return {
    ...render(ui, { wrapper: Wrapper, ...renderOptions }),
    mockDataManager,
    mockFeatureFlagManager
  }
}

/**
 * Mock API fetch responses
 */
export const mockFetch = (responses) => {
  global.fetch = vi.fn((url) => {
    const response = responses[url]
    if (response) {
      return Promise.resolve({
        ok: true,
        json: () => Promise.resolve(response),
        status: 200,
        statusText: 'OK'
      })
    }
    return Promise.reject(new Error(`Mock fetch: No response defined for ${url}`))
  })
}

/**
 * Create a mock transaction for testing
 */
export const createMockTransaction = (overrides = {}) => ({
  id: `tx-${Date.now()}`,
  type: 'BUY',
  asset: 'BTC',
  amount: 0.001,
  value: 43.25,
  fee: 1.25,
  status: 'completed',
  timestamp: new Date().toISOString(),
  ...overrides
})

/**
 * Create mock market data for testing
 */
export const createMockMarketData = (symbol, overrides = {}) => ({
  symbol: symbol.toUpperCase(),
  name: symbol === 'BTC' ? 'Bitcoin' : 'Test Asset',
  price: Math.random() * 50000,
  change24h: (Math.random() - 0.5) * 10,
  marketCap: Math.random() * 1000000000000,
  volume24h: Math.random() * 50000000000,
  lastUpdate: new Date().toISOString(),
  source: 'test',
  provider: 'Test Provider',
  ...overrides
})

/**
 * Wait for async operations to complete
 */
export const waitFor = async (callback, { timeout = 5000, interval = 50 } = {}) => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now()
    
    const check = async () => {
      try {
        const result = await callback()
        if (result) {
          resolve(result)
          return
        }
      } catch (error) {
        // Continue checking unless timeout exceeded
      }
      
      if (Date.now() - startTime >= timeout) {
        reject(new Error(`waitFor timeout exceeded (${timeout}ms)`))
        return
      }
      
      setTimeout(check, interval)
    }
    
    check()
  })
}

/**
 * Mock localStorage for testing
 */
export const mockLocalStorage = () => {
  const store = new Map()
  
  global.localStorage = {
    getItem: vi.fn((key) => store.get(key) || null),
    setItem: vi.fn((key, value) => store.set(key, value)),
    removeItem: vi.fn((key) => store.delete(key)),
    clear: vi.fn(() => store.clear()),
    length: 0,
    key: vi.fn()
  }
  
  return store
}

/**
 * Mock console methods for testing
 */
export const mockConsole = () => {
  const originalConsole = { ...console }
  
  console.log = vi.fn()
  console.error = vi.fn()
  console.warn = vi.fn()
  console.info = vi.fn()
  
  return {
    restore: () => {
      Object.assign(console, originalConsole)
    }
  }
}

/**
 * Simulate user interaction delay
 */
export const simulateDelay = (ms = 100) => {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Assert that an element is accessible
 */
export const expectAccessible = async (element) => {
  // Check for ARIA attributes
  if (element.tagName === 'BUTTON' && !element.getAttribute('aria-label') && !element.textContent.trim()) {
    throw new Error('Button must have aria-label or text content')
  }
  
  if (element.tagName === 'INPUT' && !element.getAttribute('aria-label') && !document.querySelector(`label[for="${element.id}"]`)) {
    throw new Error('Input must have aria-label or associated label')
  }
  
  // Check for focus management
  if (element.tabIndex < 0 && !element.getAttribute('aria-hidden')) {
    throw new Error('Interactive elements should be focusable')
  }
  
  return true
}