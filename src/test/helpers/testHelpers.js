/**
 * Test Helpers and Utilities
 * Common utilities for setting up and running tests
 */

import { vi } from 'vitest'

/**
 * Mock user data for testing
 */
export const createMockUser = (overrides = {}) => ({
  id: 'test-user-123',
  email: 'test@example.com',
  name: 'Test User',
  verified: true,
  createdAt: '2024-01-01T00:00:00Z',
  ...overrides
})

/**
 * Mock balance data for testing
 */
export const createMockBalance = (overrides = {}) => ({
  available: 1000,
  invested: 500,
  total: 1500,
  lastUpdated: new Date().toISOString(),
  assets: {
    BTC: { amount: 0, value: 200 },
    ETH: { amount: 0, value: 300 },
    SOL: { amount: 0, value: 100 },
    SUI: { amount: 0, value: 50 }
  },
  ...overrides
})

/**
 * Mock transaction data for testing
 */
export const createMockTransaction = (overrides = {}) => ({
  id: `tx-${Date.now()}`,
  type: 'transfer',
  amount: 100,
  status: 'completed',
  recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
  asset: 'USDC',
  paymentMethod: 'diboas_wallet',
  userId: 'test-user-123',
  createdAt: new Date().toISOString(),
  confirmedAt: new Date().toISOString(),
  fees: {
    total: 1.5,
    diBoaS: 0.5,
    network: 0.5,
    provider: 0.5
  },
  ...overrides
})

/**
 * Mock on-chain status for testing
 */
export const createMockOnChainStatus = (overrides = {}) => ({
  id: 'tx-123',
  txHash: '0x1234567890abcdef',
  chain: 'SOL',
  status: 'confirmed',
  confirmations: 1,
  requiredConfirmations: 1,
  explorerLink: 'https://solscan.io/tx/0x1234567890abcdef',
  submittedAt: new Date().toISOString(),
  confirmedAt: new Date().toISOString(),
  ...overrides
})

/**
 * Setup mock DataManager for testing
 */
export const setupMockDataManager = () => {
  const mockDataManager = {
    getState: vi.fn(() => ({
      balance: createMockBalance(),
      user: createMockUser(),
      transactions: []
    })),
    setState: vi.fn(),
    addTransaction: vi.fn(),
    updateTransaction: vi.fn(),
    getTransactions: vi.fn(() => []),
    subscribe: vi.fn(() => vi.fn()), // Return unsubscribe function
    emit: vi.fn()
  }

  return mockDataManager
}

/**
 * Setup mock OnChainStatusProvider for testing
 */
export const setupMockOnChainProvider = () => {
  const mockProvider = {
    submitTransaction: vi.fn(),
    getTransactionStatus: vi.fn(),
    cancelTransaction: vi.fn(),
    healthCheck: vi.fn(),
    generateExplorerLink: vi.fn(),
    simulateNetworkDelay: vi.fn()
  }

  return mockProvider
}

/**
 * Setup mock navigation for React Router
 */
export const setupMockNavigation = () => {
  const mockNavigate = vi.fn()
  const mockLocation = {
    pathname: '/app',
    search: '',
    hash: '',
    state: null
  }

  return { mockNavigate, mockLocation }
}

/**
 * Wait for async operations in tests
 */
export const waitForAsync = (ms = 0) => new Promise(resolve => setTimeout(resolve, ms))

/**
 * Advance timers and wait for async operations
 */
export const advanceTimersAndWait = async (ms = 1000) => {
  vi.advanceTimersByTime(ms)
  await waitForAsync(0) // Allow async operations to complete
}

/**
 * Create a mock React component for testing
 */
export const createMockComponent = (name, props = {}) => {
  const MockComponent = (componentProps) => {
    return <div data-testid={`mock-${name.toLowerCase()}`} {...componentProps} />
  }
  MockComponent.displayName = `Mock${name}`
  return MockComponent
}

/**
 * Setup localStorage mock with data
 */
export const setupMockLocalStorage = (initialData = {}) => {
  const store = { ...initialData }
  
  const mockStorage = {
    getItem: vi.fn((key) => store[key] || null),
    setItem: vi.fn((key, value) => {
      store[key] = String(value)
    }),
    removeItem: vi.fn((key) => {
      delete store[key]
    }),
    clear: vi.fn(() => {
      Object.keys(store).forEach(key => delete store[key])
    }),
    length: 0,
    key: vi.fn()
  }

  Object.defineProperty(window, 'localStorage', {
    value: mockStorage,
    writable: true
  })

  return mockStorage
}

/**
 * Mock fetch responses for API testing
 */
export const setupMockFetch = (responses = {}) => {
  const mockFetch = vi.fn((url, options) => {
    const key = `${options?.method || 'GET'} ${url}`
    const response = responses[key] || responses[url] || { status: 200, data: {} }
    
    return Promise.resolve({
      ok: response.status < 400,
      status: response.status,
      json: () => Promise.resolve(response.data),
      text: () => Promise.resolve(JSON.stringify(response.data))
    })
  })

  global.fetch = mockFetch
  return mockFetch
}

/**
 * Create test data for different transaction types
 */
export const createTransactionTestData = {
  add: () => ({
    type: 'add',
    amount: 100,
    paymentMethod: 'credit_debit_card',
    userId: 'test-user-123'
  }),
  
  withdraw: () => ({
    type: 'withdraw',
    amount: 50,
    paymentMethod: 'bank_account',
    userId: 'test-user-123'
  }),
  
  send: () => ({
    type: 'send',
    amount: 25,
    recipient: '@alice',
    userId: 'test-user-123'
  }),
  
  transfer: () => ({
    type: 'transfer',
    amount: 75,
    recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    userId: 'test-user-123'
  }),
  
  buy: () => ({
    type: 'buy',
    amount: 200,
    asset: 'BTC',
    paymentMethod: 'diboas_wallet',
    userId: 'test-user-123'
  }),
  
  sell: () => ({
    type: 'sell',
    amount: 150,
    asset: 'ETH',
    userId: 'test-user-123'
  })
}

/**
 * Assert that an element has specific attributes
 */
export const assertElementAttributes = (element, expectedAttributes) => {
  Object.entries(expectedAttributes).forEach(([attr, value]) => {
    expect(element).toHaveAttribute(attr, value)
  })
}

/**
 * Wait for an element to have specific text content
 */
export const waitForTextContent = async (getByText, text, timeout = 5000) => {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    try {
      const element = getByText(text)
      if (element) return element
    } catch (error) {
      // Element not found yet, continue waiting
    }
    
    await waitForAsync(100)
  }
  
  throw new Error(`Element with text "${text}" not found within ${timeout}ms`)
}

/**
 * Mock console methods for testing
 */
export const setupMockConsole = () => {
  const originalConsole = { ...console }
  
  const mockConsole = {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
    debug: vi.fn()
  }
  
  Object.assign(console, mockConsole)
  
  return {
    mockConsole,
    restore: () => Object.assign(console, originalConsole)
  }
}

/**
 * Create a test environment with common mocks
 */
export const createTestEnvironment = () => {
  const mockDataManager = setupMockDataManager()
  const mockOnChainProvider = setupMockOnChainProvider()
  const { mockNavigate, mockLocation } = setupMockNavigation()
  const mockLocalStorage = setupMockLocalStorage()
  const mockFetch = setupMockFetch()
  
  return {
    mockDataManager,
    mockOnChainProvider,
    mockNavigate,
    mockLocation,
    mockLocalStorage,
    mockFetch,
    cleanup: () => {
      vi.clearAllMocks()
    }
  }
}

/**
 * Helper to test async state changes
 */
export const waitForStateChange = async (stateAccessor, expectedValue, timeout = 5000) => {
  const startTime = Date.now()
  
  while (Date.now() - startTime < timeout) {
    const currentValue = stateAccessor()
    if (currentValue === expectedValue) {
      return currentValue
    }
    await waitForAsync(50)
  }
  
  throw new Error(`State did not change to expected value "${expectedValue}" within ${timeout}ms`)
}

/**
 * Mock window methods for testing
 */
export const setupMockWindow = (overrides = {}) => {
  const mockWindow = {
    open: vi.fn(),
    location: {
      href: 'http://localhost:3000',
      origin: 'http://localhost:3000',
      pathname: '/',
      search: '',
      hash: ''
    },
    history: {
      pushState: vi.fn(),
      replaceState: vi.fn(),
      back: vi.fn(),
      forward: vi.fn(),
      go: vi.fn()
    },
    ...overrides
  }
  
  Object.assign(window, mockWindow)
  return mockWindow
}