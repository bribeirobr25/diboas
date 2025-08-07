/**
 * Integration Tests for Strategy Launch Transaction Bug Fixes
 * Tests transaction recording and balance updates for strategy launches
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { dataManager } from '../../services/DataManager.js'
import strategyLifecycleManager from '../../services/strategies/StrategyLifecycleManager.js'

// Mock logger to avoid console output during tests
vi.mock('../../utils/logger', () => ({
  default: {
    info: vi.fn(),
    error: vi.fn(),
    warn: vi.fn()
  }
}))

describe('Strategy Launch Transaction Bug Fixes', () => {
  let initialBalance
  let mockTransactionRecord
  let mockStrategyInstance

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset DataManager state
    initialBalance = {
      totalUSD: 1000,
      availableForSpending: 1000,
      investedAmount: 0,
      strategyBalance: 0,
      strategies: {},
      lastUpdated: Date.now()
    }
    
    dataManager.state = {
      balance: { ...initialBalance },
      transactions: [],
      user: { id: 'test_user' }
    }
    
    // Mock transaction record from StrategyLifecycleManager
    mockTransactionRecord = {
      id: 'strategy_launch_test_123',
      type: 'start_strategy',
      status: 'completed',
      amount: 100,
      fees: {
        breakdown: {
          diboas: 0.09,
          network: 0.05,
          dex: 0.5,
          provider: 0,
          defi: 0
        },
        total: 0.64
      },
      totalAmount: 100.64,
      asset: 'USDC',
      chain: 'SOL',
      timestamp: new Date().toISOString(),
      strategyInstanceId: 'strategy_test_instance_123',
      strategyName: 'Test Emergency Fund',
      metadata: {
        strategyId: 'emergency-fund',
        protocolName: 'Aave',
        targetAPY: 4.5,
        defiTransactionHash: '0xtest123'
      }
    }
    
    mockStrategyInstance = {
      id: 'strategy_test_instance_123',
      strategyId: 'emergency-fund',
      status: 'running',
      initialAmount: 100,
      currentValue: 100,
      totalDeposited: 100
    }
    
    // Mock StrategyLifecycleManager
    vi.spyOn(strategyLifecycleManager, 'launchStrategy').mockResolvedValue({
      success: true,
      strategyInstance: mockStrategyInstance,
      transaction: mockTransactionRecord,
      balanceChanges: {
        availableChange: -100.64,
        strategyChange: +100
      }
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Transaction Recording', () => {
    it('should add strategy launch transaction to history with correct data', async () => {
      const transactionData = {
        ...mockTransactionRecord,
        type: 'start_strategy',
        amount: 100,
        paymentMethod: 'diboas_wallet', // This was the missing field causing the bug
        description: 'Started Test Emergency Fund strategy',
        strategyConfig: {
          strategyId: 'emergency-fund',
          strategyName: 'Test Emergency Fund',
          protocol: 'Aave',
          apy: 4.5
        }
      }
      
      // Add transaction using DataManager
      const addedTransaction = dataManager.addTransaction(transactionData)
      
      // Verify transaction was added to state
      expect(dataManager.state.transactions).toHaveLength(1)
      expect(dataManager.state.transactions[0]).toMatchObject({
        id: expect.stringMatching(/^strategy_launch_test_123/),
        type: 'start_strategy',
        amount: 100,
        paymentMethod: 'diboas_wallet',
        description: 'Started Test Emergency Fund strategy',
        category: 'yield', // Should be categorized as yield transaction
        status: 'completed'
      })
      
      // Verify strategy configuration is preserved
      expect(addedTransaction.strategyConfig).toEqual({
        strategyId: 'emergency-fund',
        strategyName: 'Test Emergency Fund',
        protocol: 'Aave',
        apy: 4.5
      })
    })

    it('should generate appropriate transaction description for strategy launches', async () => {
      const transactionData = {
        type: 'start_strategy',
        amount: 250,
        paymentMethod: 'diboas_wallet',
        strategyConfig: {
          strategyName: 'Dream Vacation Fund'
        }
      }
      
      const addedTransaction = dataManager.addTransaction(transactionData)
      
      expect(addedTransaction.description).toBe('Started Dream Vacation Fund with $250')
    })

    it('should handle strategy transactions without strategy name gracefully', async () => {
      const transactionData = {
        type: 'start_strategy',
        amount: 100,
        paymentMethod: 'diboas_wallet',
        strategyConfig: {} // Missing strategyName
      }
      
      const addedTransaction = dataManager.addTransaction(transactionData)
      
      expect(addedTransaction.description).toBe('Started strategy with $100')
    })

    it('should categorize strategy transactions as yield category', async () => {
      const transactionData = {
        type: 'start_strategy',
        amount: 100,
        paymentMethod: 'diboas_wallet'
      }
      
      const addedTransaction = dataManager.addTransaction(transactionData)
      
      expect(addedTransaction.category).toBe('yield')
    })

    it('should also handle stop_strategy transactions', async () => {
      const transactionData = {
        type: 'stop_strategy',
        amount: 105.50,
        paymentMethod: 'diboas_wallet',
        strategyConfig: {
          strategyName: 'Emergency Fund'
        }
      }
      
      const addedTransaction = dataManager.addTransaction(transactionData)
      
      expect(addedTransaction.category).toBe('yield')
      expect(addedTransaction.description).toBe('Stopped Emergency Fund strategy')
    })
  })

  describe('Balance Updates', () => {
    it('should update balances correctly for strategy launch with diboas_wallet payment', async () => {
      const transactionData = {
        type: 'start_strategy',
        amount: 100,
        paymentMethod: 'diboas_wallet', // Critical field for balance logic
        fees: {
          breakdown: { diboas: 0.09, network: 0.05, dex: 0.5 },
          total: 0.64
        }
      }
      
      // Execute balance update
      await dataManager.updateBalance(transactionData)
      
      // Verify balance changes
      expect(dataManager.state.balance.availableForSpending).toBe(899.36) // 1000 - 100.64
      expect(dataManager.state.balance.strategyBalance).toBe(99.36) // 100 - 0.64 fees
      expect(dataManager.state.balance.investedAmount).toBe(0) // Should remain unchanged
      expect(dataManager.state.balance.totalUSD).toBe(999.36) // 899.36 + 0 + 99.36
    })

    it('should update balances correctly with external payment method', async () => {
      const transactionData = {
        type: 'start_strategy',
        amount: 100,
        paymentMethod: 'bank_account', // External payment method
        fees: {
          breakdown: { diboas: 0.09, network: 0.05, dex: 0.5 },
          total: 0.64
        }
      }
      
      await dataManager.updateBalance(transactionData)
      
      // With external payment: available balance unchanged, strategy balance increases
      expect(dataManager.state.balance.availableForSpending).toBe(1000) // Unchanged
      expect(dataManager.state.balance.strategyBalance).toBe(99.36) // 100 - 0.64 fees
      expect(dataManager.state.balance.investedAmount).toBe(0) // Unchanged
      expect(dataManager.state.balance.totalUSD).toBe(1099.36) // 1000 + 0 + 99.36
    })

    it('should handle zero fee transactions correctly', async () => {
      const transactionData = {
        type: 'start_strategy',
        amount: 100,
        paymentMethod: 'diboas_wallet',
        fees: {
          breakdown: { diboas: 0, network: 0, dex: 0 },
          total: 0
        }
      }
      
      await dataManager.updateBalance(transactionData)
      
      expect(dataManager.state.balance.availableForSpending).toBe(900) // 1000 - 100
      expect(dataManager.state.balance.strategyBalance).toBe(100) // Full amount
      expect(dataManager.state.balance.totalUSD).toBe(1000) // No change in total
    })

    it('should handle missing fees object gracefully', async () => {
      const transactionData = {
        type: 'start_strategy',
        amount: 100,
        paymentMethod: 'diboas_wallet'
        // Missing fees object
      }
      
      await dataManager.updateBalance(transactionData)
      
      // Should treat as zero fees
      expect(dataManager.state.balance.availableForSpending).toBe(900)
      expect(dataManager.state.balance.strategyBalance).toBe(100)
      expect(dataManager.state.balance.totalUSD).toBe(1000)
    })

    it('should update strategy records in balance state', async () => {
      const transactionData = {
        type: 'start_strategy',
        amount: 100,
        paymentMethod: 'diboas_wallet',
        fees: { total: 0.64 },
        strategyConfig: {
          strategyName: 'Test Strategy',
          riskLevel: 'low',
          timeline: '6-to-12-months',
          simulation: { yieldPercentage: '4.5' }
        }
      }
      
      await dataManager.updateBalance(transactionData)
      
      // Should create strategy record
      const strategies = Object.values(dataManager.state.balance.strategies)
      expect(strategies).toHaveLength(1)
      
      const strategy = strategies[0]
      expect(strategy).toMatchObject({
        name: 'Test Strategy',
        currentAmount: 99.36, // amount - fees
        initialAmount: 99.36,
        riskLevel: 'low',
        timeline: '6-to-12-months',
        status: 'active',
        apy: 4.5
      })
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle extremely large transaction amounts', async () => {
      const transactionData = {
        type: 'start_strategy',
        amount: 999999999,
        paymentMethod: 'diboas_wallet',
        fees: { total: 1000 }
      }
      
      // Should not crash with large numbers
      await expect(dataManager.updateBalance(transactionData)).resolves.toBeDefined()
    })

    it('should handle negative amounts gracefully', async () => {
      const transactionData = {
        type: 'start_strategy',
        amount: -100,
        paymentMethod: 'diboas_wallet',
        fees: { total: 1 }
      }
      
      await dataManager.updateBalance(transactionData)
      
      // Should handle negative amounts without breaking balance logic
      expect(dataManager.state.balance.totalUSD).toBeGreaterThanOrEqual(0)
    })

    it('should handle malformed fee data', async () => {
      const transactionData = {
        type: 'start_strategy',
        amount: 100,
        paymentMethod: 'diboas_wallet',
        fees: {
          breakdown: "not an object",
          total: "not a number"
        }
      }
      
      await expect(dataManager.updateBalance(transactionData)).resolves.toBeDefined()
      
      // Should not crash and provide reasonable defaults
      expect(dataManager.state.balance.availableForSpending).toBeLessThanOrEqual(1000)
    })

    it('should handle concurrent strategy launches', async () => {
      const transactionData1 = {
        type: 'start_strategy',
        amount: 100,
        paymentMethod: 'diboas_wallet',
        fees: { total: 1 }
      }
      
      const transactionData2 = {
        type: 'start_strategy',
        amount: 200,
        paymentMethod: 'diboas_wallet',
        fees: { total: 2 }
      }
      
      // Execute concurrent transactions
      await Promise.all([
        dataManager.updateBalance(transactionData1),
        dataManager.updateBalance(transactionData2)
      ])
      
      // Final balance should be consistent
      expect(dataManager.state.balance.availableForSpending).toBe(697) // 1000 - 300 - 3
      expect(dataManager.state.balance.strategyBalance).toBe(297) // 300 - 3
      expect(dataManager.state.balance.totalUSD).toBe(994) // 697 + 0 + 297
    })
  })

  describe('System Recovery', () => {
    it('should recover from balance calculation errors', async () => {
      // Corrupt balance state
      dataManager.state.balance.availableForSpending = NaN
      dataManager.state.balance.strategyBalance = null
      
      const transactionData = {
        type: 'start_strategy',
        amount: 100,
        paymentMethod: 'diboas_wallet',
        fees: { total: 1 }
      }
      
      await dataManager.updateBalance(transactionData)
      
      // Should recover with reasonable values
      expect(isNaN(dataManager.state.balance.totalUSD)).toBe(false)
      expect(dataManager.state.balance.totalUSD).toBeGreaterThanOrEqual(0)
    })

    it('should maintain transaction atomicity on errors', async () => {
      const originalBalance = { ...dataManager.state.balance }
      
      // Mock an error during balance update
      const originalUpdateBalance = dataManager.updateBalanceOriginal
      dataManager.updateBalanceOriginal = vi.fn().mockImplementation(() => {
        throw new Error('Balance update failed')
      })
      
      const transactionData = {
        type: 'start_strategy',
        amount: 100,
        paymentMethod: 'diboas_wallet'
      }
      
      await expect(dataManager.updateBalance(transactionData)).rejects.toThrow()
      
      // Balance should be reverted on error
      expect(dataManager.state.balance.totalUSD).toBe(originalBalance.totalUSD)
      
      // Restore original method
      dataManager.updateBalanceOriginal = originalUpdateBalance
    })

    it('should handle transaction persistence failures gracefully', async () => {
      // Mock persistence failure
      vi.spyOn(dataManager, 'persistTransactions').mockImplementation(() => {
        throw new Error('Persistence failed')
      })
      
      const transactionData = {
        type: 'start_strategy',
        amount: 100,
        paymentMethod: 'diboas_wallet'
      }
      
      // Should not crash even if persistence fails
      const addedTransaction = dataManager.addTransaction(transactionData)
      expect(addedTransaction).toBeDefined()
      expect(dataManager.state.transactions).toContain(addedTransaction)
    })
  })

  describe('Full Integration Flow', () => {
    it('should complete full strategy launch flow correctly', async () => {
      // Simulate complete strategy launch flow
      const strategyConfig = {
        strategyId: 'emergency-fund',
        strategyData: {
          name: 'Emergency Fund Strategy',
          protocol: 'Aave',
          apy: { current: 4.5 }
        },
        goalConfig: {
          initialAmount: 100
        },
        initialAmount: 100,
        selectedChain: 'SOL'
      }
      
      const userBalance = {
        available: 1000,
        strategy: 0
      }
      
      // Launch strategy
      const launchResult = await strategyLifecycleManager.launchStrategy(strategyConfig, userBalance)
      expect(launchResult.success).toBe(true)
      
      // Process transaction and balance update
      const transactionData = {
        ...launchResult.transaction,
        paymentMethod: 'diboas_wallet',
        description: 'Started Emergency Fund Strategy strategy',
        strategyConfig: {
          strategyId: 'emergency-fund',
          strategyName: 'Emergency Fund Strategy',
          protocol: 'Aave',
          apy: 4.5
        }
      }
      
      // Add transaction and update balance
      dataManager.addTransaction(transactionData)
      await dataManager.updateBalance(transactionData)
      
      // Verify final state
      expect(dataManager.state.transactions).toHaveLength(1)
      expect(dataManager.state.transactions[0].type).toBe('start_strategy')
      expect(dataManager.state.transactions[0].category).toBe('yield')
      
      expect(dataManager.state.balance.availableForSpending).toBeLessThan(1000)
      expect(dataManager.state.balance.strategyBalance).toBeGreaterThan(0)
      expect(dataManager.state.balance.totalUSD).toBeLessThanOrEqual(1000) // Accounting for fees
    })
  })
})