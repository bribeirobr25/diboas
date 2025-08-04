/**
 * Shared DataManager Mock Utility
 * Centralizes DataManager mocking to reduce duplication across test files
 */

import { vi } from 'vitest'
import { EventEmitter } from 'events'

/**
 * Creates a mock DataManager instance with all common methods
 */
export function createMockDataManager(initialState = {}) {
  const eventEmitter = new EventEmitter()
  
  const defaultState = {
    balance: {
      totalUSD: 0,
      availableForSpending: 0,
      investedAmount: 0,
      strategyBalance: 0,
      assets: {},
      strategies: {}
    },
    transactions: [],
    user: {
      userId: 'test-user-123',
      email: 'test@example.com',
      displayName: 'Test User'
    },
    isLoading: false,
    finObjectives: {},
    yieldData: {
      totalAllocated: 0,
      activeStrategies: 0,
      totalEarning: 0,
      avgAPY: 0,
      goalsProgress: 0
    },
    ...initialState
  }

  const mockDataManager = {
    // State
    state: { ...defaultState },
    
    // State getters
    getState: vi.fn(() => ({ ...mockDataManager.state })),
    getBalance: vi.fn(() => ({ ...mockDataManager.state.balance })),
    getTransactions: vi.fn(() => [...mockDataManager.state.transactions]),
    getUser: vi.fn(() => ({ ...mockDataManager.state.user })),
    getFinObjectives: vi.fn(() => ({ ...mockDataManager.state.finObjectives })),
    getYieldData: vi.fn(() => ({ ...mockDataManager.state.yieldData })),
    
    // State setters
    updateBalance: vi.fn((transactionData) => {
      // Simple mock implementation
      const { type, amount } = transactionData
      if (type === 'add') {
        mockDataManager.state.balance.availableForSpending += amount
        mockDataManager.state.balance.totalUSD += amount
      } else if (type === 'withdraw') {
        mockDataManager.state.balance.availableForSpending -= amount
        mockDataManager.state.balance.totalUSD -= amount
      }
      mockDataManager.emit('balance:updated', mockDataManager.state.balance)
      return Promise.resolve(mockDataManager.state.balance)
    }),
    
    addTransaction: vi.fn((transaction) => {
      const newTransaction = {
        id: `tx_${Date.now()}`,
        timestamp: new Date().toISOString(),
        ...transaction
      }
      mockDataManager.state.transactions.unshift(newTransaction)
      mockDataManager.emit('transaction:added', newTransaction)
      return newTransaction
    }),
    
    processTransaction: vi.fn((transactionData) => {
      const transaction = mockDataManager.addTransaction(transactionData)
      mockDataManager.updateBalance(transactionData)
      mockDataManager.emit('transaction:completed', { transaction, balance: mockDataManager.state.balance })
      return Promise.resolve({ success: true, transaction, balance: mockDataManager.state.balance })
    }),
    
    // Event system
    subscribers: new Map(),
    
    subscribe: vi.fn((eventType, callback) => {
      if (!mockDataManager.subscribers.has(eventType)) {
        mockDataManager.subscribers.set(eventType, new Set())
      }
      mockDataManager.subscribers.get(eventType).add(callback)
      
      // Return unsubscribe function
      return () => {
        const callbacks = mockDataManager.subscribers.get(eventType)
        if (callbacks) {
          callbacks.delete(callback)
        }
      }
    }),
    
    emit: vi.fn((eventType, data) => {
      const callbacks = mockDataManager.subscribers.get(eventType)
      if (callbacks) {
        callbacks.forEach(callback => {
          try {
            callback(data)
          } catch (error) {
            console.error(`Error in mock subscriber for ${eventType}:`, error)
          }
        })
      }
      
      // Also emit to EventEmitter for compatibility
      eventEmitter.emit(eventType, data)
    }),
    
    // Lifecycle methods
    initializeCleanState: vi.fn(() => {
      mockDataManager.state = { ...defaultState }
      mockDataManager.emit('state:initialized', mockDataManager.state)
    }),
    
    loadState: vi.fn(() => {
      mockDataManager.emit('state:loaded', mockDataManager.state)
      return Promise.resolve()
    }),
    
    resetToCleanState: vi.fn(() => {
      mockDataManager.initializeCleanState()
    }),
    
    dispose: vi.fn(() => {
      mockDataManager.subscribers.clear()
      eventEmitter.removeAllListeners()
    }),
    
    // Strategy and objectives methods
    startFinObjective: vi.fn((objectiveId, amount) => {
      mockDataManager.state.finObjectives[objectiveId] = {
        id: objectiveId,
        currentAmount: amount,
        isActive: true,
        progress: 0
      }
      mockDataManager.emit('finObjective:started', mockDataManager.state.finObjectives[objectiveId])
      return mockDataManager.state.finObjectives[objectiveId]
    }),
    
    updateStrategyBalance: vi.fn((strategyId, amount) => {
      if (!mockDataManager.state.balance.strategies[strategyId]) {
        mockDataManager.state.balance.strategies[strategyId] = {
          id: strategyId,
          currentAmount: 0,
          status: 'active'
        }
      }
      mockDataManager.state.balance.strategies[strategyId].currentAmount += amount
      mockDataManager.emit('strategy:updated', mockDataManager.state.balance.strategies[strategyId])
    }),
    
    stopStrategy: vi.fn((strategyId) => {
      if (mockDataManager.state.balance.strategies[strategyId]) {
        mockDataManager.state.balance.strategies[strategyId].status = 'stopped'
        mockDataManager.emit('strategy:stopped', mockDataManager.state.balance.strategies[strategyId])
      }
      return true
    }),
    
    // Security validation methods (for security tests)
    validateFinancialAmount: vi.fn(() => true),
    validateTransactionIntegrity: vi.fn(() => true),
    validateTransactionSignature: vi.fn(() => ({ valid: true })),
    checkRateLimit: vi.fn(() => ({ allowed: true, remaining: 10 })),
    
    // Utility methods
    cleanupSubscriptions: vi.fn(),
    cleanupStaleLocks: vi.fn(),
    
    // Add EventEmitter compatibility
    on: (event, handler) => eventEmitter.on(event, handler),
    off: (event, handler) => eventEmitter.off(event, handler),
    once: (event, handler) => eventEmitter.once(event, handler),
    removeAllListeners: () => eventEmitter.removeAllListeners()
  }
  
  return mockDataManager
}

/**
 * Creates a minimal mock DataManager for simple tests
 */
export function createMinimalMockDataManager() {
  return {
    getBalance: vi.fn(() => ({ totalUSD: 0, availableForSpending: 0 })),
    getTransactions: vi.fn(() => []),
    subscribe: vi.fn(() => () => {}),
    emit: vi.fn(),
    dispose: vi.fn()
  }
}

/**
 * Helper to setup DataManager mock in tests
 */
export function setupDataManagerMock() {
  const mockDataManager = createMockDataManager()
  
  // Mock the import
  vi.mock('../../services/DataManager.js', () => ({
    dataManager: mockDataManager,
    default: mockDataManager,
    useDataManager: () => mockDataManager,
    getDataManager: () => mockDataManager
  }))
  
  return mockDataManager
}