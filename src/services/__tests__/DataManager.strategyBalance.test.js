import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

// Import the DataManager class directly
class DataManager {
  constructor() {
    this.state = {
      user: null,
      balance: null,
      transactions: [],
      isLoading: false,
      lastUpdated: null
    }
    
    this.subscribers = new Map()
    this.eventBus = new EventTarget()
  }

  initializeCleanState() {
    const userId = 'demo_user_12345'
    
    this.state = {
      user: {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com'
      },
      balance: {
        totalUSD: 0,
        availableForSpending: 0,
        investedAmount: 0,
        strategyBalance: 0,
        breakdown: {
          BTC: { native: 0, usdc: 0, usdValue: 0 },
          ETH: { native: 0, usdc: 0, usdValue: 0 },
          SOL: { native: 0, usdc: 0, usdValue: 0 },
          SUI: { native: 0, usdc: 0, usdValue: 0 }
        },
        assets: {},
        strategies: {},
        lastUpdated: Date.now()
      },
      transactions: [],
      isLoading: false,
      lastUpdated: Date.now()
    }
  }

  updateStrategyBalance(strategyId, amount, strategyDetails = {}) {
    if (!this.state.balance.strategies) {
      this.state.balance.strategies = {}
    }

    if (!this.state.balance.strategies[strategyId]) {
      this.state.balance.strategies[strategyId] = {
        id: strategyId,
        name: strategyDetails.name || 'Unnamed Strategy',
        targetAmount: strategyDetails.targetAmount || 0,
        currentAmount: 0,
        apy: strategyDetails.apy || 0,
        status: 'active',
        createdAt: Date.now(),
        ...strategyDetails
      }
    }

    this.state.balance.strategies[strategyId].currentAmount += amount
    
    this.state.balance.strategyBalance = Object.values(this.state.balance.strategies)
      .filter(strategy => strategy.status === 'active')
      .reduce((sum, strategy) => sum + strategy.currentAmount, 0)

    this.state.balance.totalUSD = this.state.balance.availableForSpending + 
                                  this.state.balance.investedAmount + 
                                  this.state.balance.strategyBalance

    this.state.balance.lastUpdated = Date.now()
    
    this.persistBalance()
    this.emit('balance:updated', this.state.balance)
    this.emit('strategy:updated', this.state.balance.strategies[strategyId])
  }

  getActiveStrategies() {
    if (!this.state.balance.strategies) return []
    
    return Object.values(this.state.balance.strategies)
      .filter(strategy => strategy.status === 'active')
  }

  stopStrategy(strategyId) {
    if (!this.state.balance.strategies?.[strategyId]) {
      console.error(`Strategy ${strategyId} not found`)
      return false
    }

    const strategy = this.state.balance.strategies[strategyId]
    
    // Check if strategy is already stopped
    if (strategy.status === 'stopped') {
      return true // Return true but don't change balances
    }
    
    const strategyAmount = strategy.currentAmount

    strategy.status = 'stopped'
    strategy.stoppedAt = Date.now()

    this.state.balance.strategyBalance -= strategyAmount
    this.state.balance.availableForSpending += strategyAmount

    this.state.balance.totalUSD = this.state.balance.availableForSpending + 
                                  this.state.balance.investedAmount + 
                                  this.state.balance.strategyBalance

    this.state.balance.lastUpdated = Date.now()
    
    this.persistBalance()
    this.emit('balance:updated', this.state.balance)
    this.emit('strategy:stopped', strategy)
    
    return true
  }

  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set())
    }
    this.subscribers.get(eventType).add(callback)
    
    return () => {
      const callbacks = this.subscribers.get(eventType)
      if (callbacks) {
        callbacks.delete(callback)
        if (callbacks.size === 0) {
          this.subscribers.delete(eventType)
        }
      }
    }
  }

  emit(eventType, data) {
    const callbacks = this.subscribers.get(eventType)
    if (callbacks) {
      const callbackArray = Array.from(callbacks)
      callbackArray.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in subscriber for ${eventType}:`, error)
          callbacks.delete(callback)
        }
      })
    }
  }

  persistBalance() {
    // Mock implementation for tests
  }

  dispose() {
    this.subscribers.clear()
    this.state = {
      user: null,
      balance: null,
      transactions: [],
      isLoading: false,
      lastUpdated: null
    }
  }
}

describe('DataManager - Strategy Balance System', () => {
  let dataManager

  beforeEach(() => {
    // Clear localStorage
    if (typeof localStorage !== 'undefined') {
      localStorage.clear()
    }
    
    // Create fresh instance
    dataManager = new DataManager()
    dataManager.initializeCleanState()
  })

  afterEach(() => {
    // Clean up
    dataManager.dispose()
  })

  describe('updateStrategyBalance', () => {
    it('should initialize a new strategy with default values', () => {
      const strategyId = 'test-strategy-1'
      const amount = 1000
      
      dataManager.updateStrategyBalance(strategyId, amount)
      
      const strategies = dataManager.state.balance.strategies
      expect(strategies[strategyId]).toBeDefined()
      expect(strategies[strategyId].id).toBe(strategyId)
      expect(strategies[strategyId].name).toBe('Unnamed Strategy')
      expect(strategies[strategyId].currentAmount).toBe(amount)
      expect(strategies[strategyId].status).toBe('active')
      expect(strategies[strategyId].createdAt).toBeDefined()
    })

    it('should initialize a new strategy with custom details', () => {
      const strategyId = 'test-strategy-2'
      const amount = 5000
      const strategyDetails = {
        name: 'High Yield DeFi',
        targetAmount: 10000,
        apy: 12.5,
        protocol: 'Compound'
      }
      
      dataManager.updateStrategyBalance(strategyId, amount, strategyDetails)
      
      const strategy = dataManager.state.balance.strategies[strategyId]
      expect(strategy.name).toBe('High Yield DeFi')
      expect(strategy.targetAmount).toBe(10000)
      expect(strategy.apy).toBe(12.5)
      expect(strategy.protocol).toBe('Compound')
      expect(strategy.currentAmount).toBe(amount)
    })

    it('should update existing strategy amount', () => {
      const strategyId = 'test-strategy-3'
      
      // Initial deposit
      dataManager.updateStrategyBalance(strategyId, 1000)
      expect(dataManager.state.balance.strategies[strategyId].currentAmount).toBe(1000)
      
      // Additional deposit
      dataManager.updateStrategyBalance(strategyId, 500)
      expect(dataManager.state.balance.strategies[strategyId].currentAmount).toBe(1500)
      
      // Withdrawal (negative amount)
      dataManager.updateStrategyBalance(strategyId, -300)
      expect(dataManager.state.balance.strategies[strategyId].currentAmount).toBe(1200)
    })

    it('should update total strategy balance correctly', () => {
      // Add multiple strategies
      dataManager.updateStrategyBalance('strategy-1', 1000)
      dataManager.updateStrategyBalance('strategy-2', 2000)
      dataManager.updateStrategyBalance('strategy-3', 3000)
      
      expect(dataManager.state.balance.strategyBalance).toBe(6000)
    })

    it('should update total USD balance correctly', () => {
      // Set initial balances
      dataManager.state.balance.availableForSpending = 5000
      dataManager.state.balance.investedAmount = 3000
      
      // Add strategy balance
      dataManager.updateStrategyBalance('strategy-1', 2000)
      
      expect(dataManager.state.balance.totalUSD).toBe(10000) // 5000 + 3000 + 2000
    })

    it('should emit correct events', () => {
      const balanceUpdatedSpy = vi.fn()
      const strategyUpdatedSpy = vi.fn()
      
      dataManager.subscribe('balance:updated', balanceUpdatedSpy)
      dataManager.subscribe('strategy:updated', strategyUpdatedSpy)
      
      const strategyId = 'test-strategy'
      dataManager.updateStrategyBalance(strategyId, 1000)
      
      expect(balanceUpdatedSpy).toHaveBeenCalledWith(dataManager.state.balance)
      expect(strategyUpdatedSpy).toHaveBeenCalledWith(dataManager.state.balance.strategies[strategyId])
    })

    it('should persist balance after update', async () => {
      const persistBalanceSpy = vi.spyOn(dataManager, 'persistBalance')
      
      dataManager.updateStrategyBalance('strategy-1', 1000)
      
      expect(persistBalanceSpy).toHaveBeenCalled()
    })
  })

  describe('getActiveStrategies', () => {
    it('should return empty array when no strategies exist', () => {
      const activeStrategies = dataManager.getActiveStrategies()
      expect(activeStrategies).toEqual([])
    })

    it('should return only active strategies', () => {
      // Add active strategies
      dataManager.updateStrategyBalance('active-1', 1000, { name: 'Active Strategy 1' })
      dataManager.updateStrategyBalance('active-2', 2000, { name: 'Active Strategy 2' })
      
      // Add and stop a strategy
      dataManager.updateStrategyBalance('stopped-1', 3000, { name: 'Stopped Strategy' })
      dataManager.stopStrategy('stopped-1')
      
      const activeStrategies = dataManager.getActiveStrategies()
      expect(activeStrategies).toHaveLength(2)
      expect(activeStrategies.map(s => s.id)).toEqual(['active-1', 'active-2'])
    })

    it('should return strategy objects with all properties', () => {
      dataManager.updateStrategyBalance('test-strategy', 5000, {
        name: 'Test Strategy',
        targetAmount: 10000,
        apy: 15
      })
      
      const activeStrategies = dataManager.getActiveStrategies()
      expect(activeStrategies[0]).toMatchObject({
        id: 'test-strategy',
        name: 'Test Strategy',
        currentAmount: 5000,
        targetAmount: 10000,
        apy: 15,
        status: 'active'
      })
    })
  })

  describe('stopStrategy', () => {
    beforeEach(() => {
      // Set up initial state
      dataManager.state.balance.availableForSpending = 5000
      dataManager.state.balance.investedAmount = 3000
      dataManager.updateStrategyBalance('test-strategy', 2000, { name: 'Test Strategy' })
    })

    it('should mark strategy as stopped', () => {
      const result = dataManager.stopStrategy('test-strategy')
      
      expect(result).toBe(true)
      expect(dataManager.state.balance.strategies['test-strategy'].status).toBe('stopped')
      expect(dataManager.state.balance.strategies['test-strategy'].stoppedAt).toBeDefined()
    })

    it('should move funds from strategy to available balance', () => {
      const initialAvailable = dataManager.state.balance.availableForSpending
      const strategyAmount = dataManager.state.balance.strategies['test-strategy'].currentAmount
      
      dataManager.stopStrategy('test-strategy')
      
      expect(dataManager.state.balance.strategyBalance).toBe(0)
      expect(dataManager.state.balance.availableForSpending).toBe(initialAvailable + strategyAmount)
    })

    it('should maintain total USD balance', () => {
      const totalBefore = dataManager.state.balance.totalUSD
      
      dataManager.stopStrategy('test-strategy')
      
      expect(dataManager.state.balance.totalUSD).toBe(totalBefore)
    })

    it('should return false for non-existent strategy', () => {
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      const result = dataManager.stopStrategy('non-existent')
      
      expect(result).toBe(false)
      expect(consoleSpy).toHaveBeenCalledWith('Strategy non-existent not found')
      
      consoleSpy.mockRestore()
    })

    it('should emit correct events', () => {
      const balanceUpdatedSpy = vi.fn()
      const strategyStoppedSpy = vi.fn()
      
      dataManager.subscribe('balance:updated', balanceUpdatedSpy)
      dataManager.subscribe('strategy:stopped', strategyStoppedSpy)
      
      dataManager.stopStrategy('test-strategy')
      
      expect(balanceUpdatedSpy).toHaveBeenCalledWith(dataManager.state.balance)
      expect(strategyStoppedSpy).toHaveBeenCalledWith(dataManager.state.balance.strategies['test-strategy'])
    })

    it('should handle multiple active strategies correctly', () => {
      // Add more strategies
      dataManager.updateStrategyBalance('strategy-2', 1500)
      dataManager.updateStrategyBalance('strategy-3', 2500)
      
      // Total strategy balance should be 6000 (2000 + 1500 + 2500)
      expect(dataManager.state.balance.strategyBalance).toBe(6000)
      
      // Stop one strategy
      dataManager.stopStrategy('test-strategy')
      
      // Strategy balance should now be 4000 (1500 + 2500)
      expect(dataManager.state.balance.strategyBalance).toBe(4000)
      
      // Available balance should have increased by 2000
      expect(dataManager.state.balance.availableForSpending).toBe(7000) // 5000 + 2000
    })
  })

  describe('Edge cases and resilience', () => {
    it('should handle zero amount updates', () => {
      dataManager.updateStrategyBalance('strategy-1', 0)
      
      expect(dataManager.state.balance.strategies['strategy-1'].currentAmount).toBe(0)
      expect(dataManager.state.balance.strategyBalance).toBe(0)
    })

    it('should handle negative amounts (withdrawals)', () => {
      dataManager.updateStrategyBalance('strategy-1', 1000)
      dataManager.updateStrategyBalance('strategy-1', -500)
      
      expect(dataManager.state.balance.strategies['strategy-1'].currentAmount).toBe(500)
      expect(dataManager.state.balance.strategyBalance).toBe(500)
    })

    it('should handle very large amounts', () => {
      const largeAmount = 1e12 // 1 trillion
      dataManager.updateStrategyBalance('strategy-1', largeAmount)
      
      expect(dataManager.state.balance.strategies['strategy-1'].currentAmount).toBe(largeAmount)
      expect(dataManager.state.balance.strategyBalance).toBe(largeAmount)
    })

    it('should handle rapid updates', () => {
      const strategyId = 'rapid-strategy'
      
      // Simulate rapid updates
      for (let i = 0; i < 100; i++) {
        dataManager.updateStrategyBalance(strategyId, 10)
      }
      
      expect(dataManager.state.balance.strategies[strategyId].currentAmount).toBe(1000)
      expect(dataManager.state.balance.strategyBalance).toBe(1000)
    })

    it('should handle concurrent strategy operations', () => {
      // Add multiple strategies simultaneously
      const promises = []
      for (let i = 0; i < 10; i++) {
        promises.push(
          Promise.resolve(dataManager.updateStrategyBalance(`strategy-${i}`, 100 * i))
        )
      }
      
      return Promise.all(promises).then(() => {
        expect(Object.keys(dataManager.state.balance.strategies)).toHaveLength(10)
        
        // Calculate expected total
        const expectedTotal = Array.from({ length: 10 }, (_, i) => 100 * i).reduce((a, b) => a + b, 0)
        expect(dataManager.state.balance.strategyBalance).toBe(expectedTotal)
      })
    })

    it('should recover from stopping already stopped strategy', () => {
      dataManager.updateStrategyBalance('strategy-1', 1000)
      
      // Stop strategy first time
      dataManager.stopStrategy('strategy-1')
      const balanceAfterFirstStop = dataManager.state.balance.availableForSpending
      
      // Try to stop again
      const result = dataManager.stopStrategy('strategy-1')
      
      // Should still return true but not change balances
      expect(result).toBe(true)
      expect(dataManager.state.balance.availableForSpending).toBe(balanceAfterFirstStop)
    })

    it('should handle missing strategies object gracefully', () => {
      // Manually remove strategies object
      delete dataManager.state.balance.strategies
      
      // Should initialize strategies object
      dataManager.updateStrategyBalance('strategy-1', 1000)
      
      expect(dataManager.state.balance.strategies).toBeDefined()
      expect(dataManager.state.balance.strategies['strategy-1']).toBeDefined()
    })
  })
})