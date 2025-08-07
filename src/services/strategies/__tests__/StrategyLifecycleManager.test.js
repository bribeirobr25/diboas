/**
 * Strategy Lifecycle Manager Tests
 * Tests for strategy launch, stop, and management functionality
 */

import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest'
import strategyLifecycleManager, { StrategyLifecycleManager } from '../StrategyLifecycleManager.js'

// Mock fee calculator
vi.mock('../../../utils/feeCalculations.js', () => ({
  CentralizedFeeCalculator: vi.fn().mockImplementation(() => ({
    calculateFees: vi.fn().mockReturnValue({
      total: 5.50,
      breakdown: {
        diboas: 0.09,
        network: 0.001,
        dex: 5.00,
        provider: 0,
        defi: 0
      }
    })
  }))
}))

describe('StrategyLifecycleManager', () => {
  let lifecycleManager
  let mockUserBalance

  beforeEach(() => {
    lifecycleManager = new StrategyLifecycleManager()
    mockUserBalance = {
      available: 10000,
      invested: 5000,
      strategy: 2000
    }
  })

  afterEach(() => {
    // Clear active strategies
    lifecycleManager.activeStrategies.clear()
  })

  describe('launchStrategy', () => {
    test('launches strategy successfully with sufficient balance', async () => {
      const strategyConfig = {
        strategyId: 'marinade-staking',
        strategyData: {
          id: 'marinade-staking',
          name: 'Marinade Liquid Staking',
          protocol: 'Marinade Finance',
          chain: 'SOL',
          apy: { current: 7.0 }
        },
        goalConfig: {
          initialAmount: 1000,
          targetAmount: 5000,
          targetDate: '2025-12-31'
        },
        initialAmount: 1000,
        selectedChain: 'SOL'
      }

      const result = await lifecycleManager.launchStrategy(strategyConfig, mockUserBalance)

      expect(result.success).toBe(true)
      expect(result.strategyInstance).toBeDefined()
      expect(result.transaction).toBeDefined()
      expect(result.balanceChanges.availableChange).toBeLessThan(0)
      expect(result.balanceChanges.strategyChange).toBeGreaterThan(0)

      // Verify strategy is stored
      expect(lifecycleManager.activeStrategies.size).toBe(1)
      
      const strategy = result.strategyInstance
      expect(strategy.status).toBe('running')
      expect(strategy.initialAmount).toBe(1000)
      expect(strategy.chain).toBe('SOL')
    })

    test('fails when insufficient balance', async () => {
      const strategyConfig = {
        strategyId: 'test-strategy',
        strategyData: { name: 'Test Strategy', apy: { current: 8.0 } },
        goalConfig: {},
        initialAmount: 15000, // More than available balance
        selectedChain: 'SOL'
      }

      const result = await lifecycleManager.launchStrategy(strategyConfig, mockUserBalance)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Insufficient balance')
      expect(result.balanceChanges.availableChange).toBe(0)
      expect(result.balanceChanges.strategyChange).toBe(0)
    })

    test('fails when insufficient balance including fees', async () => {
      const strategyConfig = {
        strategyId: 'test-strategy',
        strategyData: { name: 'Test Strategy', apy: { current: 8.0 } },
        goalConfig: {},
        initialAmount: 9999, // Close to available balance, but fees would push over
        selectedChain: 'SOL'
      }

      const result = await lifecycleManager.launchStrategy(strategyConfig, mockUserBalance)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Insufficient balance including fees')
    })

    test('handles DeFi platform deployment failures', async () => {
      // Mock deployment failure
      const originalDeploy = lifecycleManager.deployToDefiPlatform
      lifecycleManager.deployToDefiPlatform = vi.fn().mockResolvedValue({
        success: false,
        error: 'Platform maintenance'
      })

      const strategyConfig = {
        strategyId: 'test-strategy',
        strategyData: { name: 'Test Strategy', apy: { current: 8.0 } },
        goalConfig: {},
        initialAmount: 1000,
        selectedChain: 'SOL'
      }

      const result = await lifecycleManager.launchStrategy(strategyConfig, mockUserBalance)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Platform maintenance')

      // Restore original method
      lifecycleManager.deployToDefiPlatform = originalDeploy
    })

    test('generates unique strategy instance IDs', async () => {
      const strategyConfig = {
        strategyId: 'test-strategy',
        strategyData: { name: 'Test Strategy', apy: { current: 8.0 } },
        goalConfig: {},
        initialAmount: 1000,
        selectedChain: 'SOL'
      }

      const result1 = await lifecycleManager.launchStrategy(strategyConfig, mockUserBalance)
      const result2 = await lifecycleManager.launchStrategy(strategyConfig, mockUserBalance)

      expect(result1.success).toBe(true)
      expect(result2.success).toBe(true)
      expect(result1.strategyInstance.id).not.toBe(result2.strategyInstance.id)
    })
  })

  describe('stopStrategy', () => {
    let activeStrategyId

    beforeEach(async () => {
      // Launch a strategy first
      const strategyConfig = {
        strategyId: 'test-strategy',
        strategyData: {
          name: 'Test Strategy',
          protocol: 'Test Protocol',
          apy: { current: 8.0 }
        },
        goalConfig: {},
        initialAmount: 1000,
        selectedChain: 'SOL'
      }

      const launchResult = await lifecycleManager.launchStrategy(strategyConfig, mockUserBalance)
      activeStrategyId = launchResult.strategyInstance.id
    })

    test('stops strategy successfully', async () => {
      const result = await lifecycleManager.stopStrategy(activeStrategyId, mockUserBalance)

      expect(result.success).toBe(true)
      expect(result.strategyInstance).toBeDefined()
      expect(result.transaction).toBeDefined()
      expect(result.performance).toBeDefined()

      // Strategy should be removed from active strategies
      expect(lifecycleManager.activeStrategies.has(activeStrategyId)).toBe(false)

      // Check performance metrics
      expect(result.performance.totalEarnings).toBeDefined()
      expect(result.performance.returnPercentage).toBeDefined()
      expect(result.performance.daysRunning).toBeGreaterThanOrEqual(0)

      // Balance changes should be positive (money returned)
      expect(result.balanceChanges.availableChange).toBeGreaterThan(0)
    })

    test('fails to stop non-existent strategy', async () => {
      const result = await lifecycleManager.stopStrategy('non-existent-id', mockUserBalance)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Strategy not found')
    })

    test('fails to stop already stopped strategy', async () => {
      // First stop
      await lifecycleManager.stopStrategy(activeStrategyId, mockUserBalance)

      // Try to stop again
      const result = await lifecycleManager.stopStrategy(activeStrategyId, mockUserBalance)

      expect(result.success).toBe(false)
      expect(result.error).toBe('Strategy not found')
    })

    test('handles DeFi platform withdrawal failures', async () => {
      // Mock withdrawal failure
      const originalWithdraw = lifecycleManager.withdrawFromDefiPlatform
      lifecycleManager.withdrawFromDefiPlatform = vi.fn().mockResolvedValue({
        success: false,
        error: 'Withdrawal failed'
      })

      const result = await lifecycleManager.stopStrategy(activeStrategyId, mockUserBalance)

      expect(result.success).toBe(false)
      expect(result.error).toContain('Withdrawal failed')

      // Strategy should still be active (rollback)
      const strategy = lifecycleManager.getStrategyInstance(activeStrategyId)
      expect(strategy.status).toBe('running')

      // Restore original method
      lifecycleManager.withdrawFromDefiPlatform = originalWithdraw
    })

    test('calculates performance metrics correctly', async () => {
      // Mock current value higher than initial
      const originalGetCurrentValue = lifecycleManager.getCurrentStrategyValue
      lifecycleManager.getCurrentStrategyValue = vi.fn().mockResolvedValue(1100) // 10% gain

      const result = await lifecycleManager.stopStrategy(activeStrategyId, mockUserBalance)

      expect(result.success).toBe(true)
      expect(result.performance.totalEarnings).toBe(100)
      expect(result.performance.returnPercentage).toBe(10)

      // Restore original method
      lifecycleManager.getCurrentStrategyValue = originalGetCurrentValue
    })
  })

  describe('strategy management', () => {
    test('getActiveStrategies returns all active strategies', async () => {
      expect(lifecycleManager.getActiveStrategies()).toEqual([])

      // Launch two strategies
      const strategyConfig1 = {
        strategyId: 'strategy-1',
        strategyData: { name: 'Strategy 1', apy: { current: 7.0 } },
        goalConfig: {},
        initialAmount: 1000,
        selectedChain: 'SOL'
      }

      const strategyConfig2 = {
        strategyId: 'strategy-2',
        strategyData: { name: 'Strategy 2', apy: { current: 8.0 } },
        goalConfig: {},
        initialAmount: 1500,
        selectedChain: 'ETH'
      }

      await lifecycleManager.launchStrategy(strategyConfig1, mockUserBalance)
      await lifecycleManager.launchStrategy(strategyConfig2, mockUserBalance)

      const activeStrategies = lifecycleManager.getActiveStrategies()
      expect(activeStrategies).toHaveLength(2)
      expect(activeStrategies[0].strategyData.name).toBe('Strategy 1')
      expect(activeStrategies[1].strategyData.name).toBe('Strategy 2')
    })

    test('getStrategyInstance returns correct strategy', async () => {
      const strategyConfig = {
        strategyId: 'test-strategy',
        strategyData: { name: 'Test Strategy', apy: { current: 8.0 } },
        goalConfig: {},
        initialAmount: 1000,
        selectedChain: 'SOL'
      }

      const launchResult = await lifecycleManager.launchStrategy(strategyConfig, mockUserBalance)
      const strategyId = launchResult.strategyInstance.id

      const strategy = lifecycleManager.getStrategyInstance(strategyId)
      expect(strategy).toBeTruthy()
      expect(strategy.id).toBe(strategyId)
      expect(strategy.strategyData.name).toBe('Test Strategy')

      // Non-existent strategy should return null
      expect(lifecycleManager.getStrategyInstance('non-existent')).toBeNull()
    })
  })

  describe('updateStrategyPerformance', () => {
    let activeStrategyId

    beforeEach(async () => {
      const strategyConfig = {
        strategyId: 'test-strategy',
        strategyData: { name: 'Test Strategy', apy: { current: 8.0 } },
        goalConfig: {},
        initialAmount: 1000,
        selectedChain: 'SOL'
      }

      const launchResult = await lifecycleManager.launchStrategy(strategyConfig, mockUserBalance)
      activeStrategyId = launchResult.strategyInstance.id
    })

    test('updates performance for running strategy', async () => {
      // Mock current value with gains
      const originalGetCurrentValue = lifecycleManager.getCurrentStrategyValue
      lifecycleManager.getCurrentStrategyValue = vi.fn().mockResolvedValue(1050)

      const result = await lifecycleManager.updateStrategyPerformance(activeStrategyId)

      expect(result.success).toBe(true)
      expect(result.performanceUpdate.currentValue).toBe(1050)
      expect(result.performanceUpdate.totalEarnings).toBe(50)
      expect(result.performanceUpdate.returnPercentage).toBe(5)

      // Check that strategy instance was updated
      const strategy = lifecycleManager.getStrategyInstance(activeStrategyId)
      expect(strategy.currentValue).toBe(1050)
      expect(strategy.earnings).toBe(50)

      // Restore original method
      lifecycleManager.getCurrentStrategyValue = originalGetCurrentValue
    })

    test('fails for non-existent strategy', async () => {
      const result = await lifecycleManager.updateStrategyPerformance('non-existent')

      expect(result.success).toBe(false)
      expect(result.error).toBe('Strategy not active')
    })
  })

  describe('getStrategyStatistics', () => {
    test('returns empty stats when no strategies', () => {
      const stats = lifecycleManager.getStrategyStatistics()

      expect(stats.totalStrategies).toBe(0)
      expect(stats.totalInvested).toBe(0)
      expect(stats.totalCurrentValue).toBe(0)
      expect(stats.totalEarnings).toBe(0)
      expect(stats.averageReturn).toBe(0)
      expect(stats.bestPerformer).toBeNull()
    })

    test('calculates stats correctly with active strategies', async () => {
      // Launch two strategies
      const strategyConfig1 = {
        strategyId: 'strategy-1',
        strategyData: { name: 'Strategy 1', apy: { current: 7.0 } },
        goalConfig: {},
        initialAmount: 1000,
        selectedChain: 'SOL'
      }

      const strategyConfig2 = {
        strategyId: 'strategy-2',
        strategyData: { name: 'Strategy 2', apy: { current: 8.0 } },
        goalConfig: {},
        initialAmount: 2000,
        selectedChain: 'ETH'
      }

      const result1 = await lifecycleManager.launchStrategy(strategyConfig1, mockUserBalance)
      const result2 = await lifecycleManager.launchStrategy(strategyConfig2, mockUserBalance)

      // Mock current values
      const originalGetCurrentValue = lifecycleManager.getCurrentStrategyValue
      lifecycleManager.getCurrentStrategyValue = vi.fn()
        .mockResolvedValueOnce(1100) // Strategy 1: 10% gain
        .mockResolvedValueOnce(2100) // Strategy 2: 5% gain

      // Update performances
      await lifecycleManager.updateStrategyPerformance(result1.strategyInstance.id)
      await lifecycleManager.updateStrategyPerformance(result2.strategyInstance.id)

      const stats = lifecycleManager.getStrategyStatistics()

      expect(stats.totalStrategies).toBe(2)
      expect(stats.totalInvested).toBe(3000)
      expect(stats.totalCurrentValue).toBe(3200)
      expect(stats.totalEarnings).toBe(200)
      expect(stats.averageReturn).toBeCloseTo(6.67, 1) // (200/3000)*100

      // Best performer should be strategy 1 (10% return)
      expect(stats.bestPerformer.id).toBe(result1.strategyInstance.id)

      // Restore original method
      lifecycleManager.getCurrentStrategyValue = originalGetCurrentValue
    })
  })

  describe('utility methods', () => {
    test('getTargetAsset returns correct asset for different chains and types', () => {
      const testCases = [
        { chain: 'SOL', type: 'staking', expected: 'SOL' },
        { chain: 'ETH', type: 'staking', expected: 'ETH' },
        { chain: 'SUI', type: 'amm-liquidity', expected: 'SUI' },
        { chain: 'SOL', type: 'lending', expected: 'USDC' },
        { chain: 'ETH', type: 'stable-earn', expected: 'USDC' }
      ]

      testCases.forEach(({ chain, type, expected }) => {
        const strategyData = { type }
        const result = lifecycleManager.getTargetAsset(strategyData, chain)
        expect(result).toBe(expected)
      })
    })

    test('generateStrategyInstanceId creates unique IDs', () => {
      const id1 = lifecycleManager.generateStrategyInstanceId()
      const id2 = lifecycleManager.generateStrategyInstanceId()

      expect(id1).not.toBe(id2)
      expect(id1).toMatch(/^strategy_\d+_\d{4}$/)
      expect(id2).toMatch(/^strategy_\d+_\d{4}$/)
    })
  })

  describe('mock DeFi platform interactions', () => {
    test('deployToDefiPlatform simulates network delays and occasional failures', async () => {
      const mockStrategy = { chain: 'SOL' }
      
      // Run multiple deployments to test randomness
      let successCount = 0
      let failureCount = 0
      
      for (let i = 0; i < 20; i++) {
        const result = await lifecycleManager.deployToDefiPlatform(mockStrategy)
        if (result.success) {
          successCount++
          expect(result.transactionHash).toMatch(/^0x[a-f0-9]{64}$/)
          expect(result.protocolAddress).toContain('SOL:')
        } else {
          failureCount++
          expect(result.error).toBe('DeFi platform temporarily unavailable')
        }
      }
      
      // Should have mostly successes with some failures
      expect(successCount).toBeGreaterThan(failureCount)
    })

    test('getCurrentStrategyValue simulates earnings over time', async () => {
      const mockStrategy = {
        totalDeposited: 1000,
        launchedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        performance: { currentAPY: 10 }
      }

      const currentValue = await lifecycleManager.getCurrentStrategyValue(mockStrategy)

      expect(currentValue).toBeGreaterThanOrEqual(800) // Minimum 80% of original
      expect(currentValue).toBeGreaterThan(1000) // Should have some growth after 1 day
    })
  })

  describe('integration with default instance', () => {
    test('default export works correctly', async () => {
      const strategyConfig = {
        strategyId: 'test-strategy',
        strategyData: { name: 'Test Strategy', apy: { current: 8.0 } },
        goalConfig: {},
        initialAmount: 1000,
        selectedChain: 'SOL'
      }

      const result = await strategyLifecycleManager.launchStrategy(strategyConfig, mockUserBalance)
      
      expect(result.success).toBe(true)
      expect(strategyLifecycleManager.getActiveStrategies()).toHaveLength(1)
    })
  })
})