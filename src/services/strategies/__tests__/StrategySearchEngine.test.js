/**
 * Strategy Search Engine Tests
 * Comprehensive tests for DeFi strategy matching and recommendation
 */

import { describe, test, expect, beforeEach, vi } from 'vitest'
import strategySearchEngine, { StrategySearchEngine } from '../StrategySearchEngine.js'

describe('StrategySearchEngine', () => {
  let searchEngine

  beforeEach(() => {
    searchEngine = new StrategySearchEngine()
  })

  describe('calculateRequiredAPY', () => {
    test('calculates APY for target date goal correctly', () => {
      const goalConfig = {
        initialAmount: 1000,
        recurringAmount: 100,
        recurringPeriod: 'monthly',
        targetAmount: 5000,
        targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year from now
      }

      const requiredAPY = searchEngine.calculateRequiredAPY(goalConfig)
      
      expect(requiredAPY).toBeGreaterThan(0)
      expect(requiredAPY).toBeLessThan(200) // Reasonable upper bound
    })

    test('calculates APY for periodic income goal correctly', () => {
      const goalConfig = {
        initialAmount: 10000,
        recurringAmount: 0,
        recurringPeriod: 'monthly',
        targetPeriodAmount: 100,
        targetPeriod: 'monthly'
      }

      const requiredAPY = searchEngine.calculateRequiredAPY(goalConfig)
      
      expect(requiredAPY).toBeCloseTo(12, 1) // 100*12/10000 = 12%
    })

    test('returns default APY for invalid goals', () => {
      const goalConfig = {}
      const requiredAPY = searchEngine.calculateRequiredAPY(goalConfig)
      expect(requiredAPY).toBe(8)
    })

    test('handles edge cases gracefully', () => {
      const edgeCases = [
        { initialAmount: 0, targetAmount: 1000, targetDate: '2024-12-31' },
        { initialAmount: 1000, targetAmount: 500, targetDate: '2025-12-31' }, // Target less than initial
        { initialAmount: 1000, targetPeriodAmount: 0, targetPeriod: 'monthly' }
      ]

      edgeCases.forEach(goalConfig => {
        const apy = searchEngine.calculateRequiredAPY(goalConfig)
        expect(apy).toBeGreaterThanOrEqual(0)
        expect(apy).toBeLessThan(1000) // Reasonable bounds
      })
    })
  })

  describe('searchStrategies', () => {
    test('returns strategies matching user requirements', async () => {
      const searchConfig = {
        goalConfig: {
          initialAmount: 1000,
          recurringAmount: 100,
          recurringPeriod: 'monthly',
          targetAmount: 5000,
          targetDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString()
        },
        riskTolerance: 'medium',
        preferredChains: ['SOL', 'ETH'],
        minLiquidity: 'medium'
      }

      const results = await searchEngine.searchStrategies(searchConfig)

      expect(results).toHaveProperty('strategiesFound')
      expect(results).toHaveProperty('strategies')
      expect(results).toHaveProperty('requiredAPY')
      expect(results.strategies).toBeInstanceOf(Array)
      expect(results.strategiesFound).toBeGreaterThan(0)
      
      // Check that strategies are sorted by score
      for (let i = 1; i < results.strategies.length; i++) {
        expect(results.strategies[i].score).toBeLessThanOrEqual(results.strategies[i - 1].score)
      }
    })

    test('filters strategies by preferred chains', async () => {
      const searchConfig = {
        goalConfig: { initialAmount: 1000 },
        preferredChains: ['SOL']
      }

      const results = await searchEngine.searchStrategies(searchConfig)
      
      results.strategies.forEach(strategy => {
        expect(strategy.chain).toBe('SOL')
      })
    })

    test('handles empty search results gracefully', async () => {
      const searchConfig = {
        goalConfig: { initialAmount: 1000 },
        preferredChains: ['INVALID_CHAIN']
      }

      const results = await searchEngine.searchStrategies(searchConfig)
      
      expect(results.strategiesFound).toBe(0)
      expect(results.strategies).toEqual([])
    })

    test('caches search results', async () => {
      const searchConfig = {
        goalConfig: { initialAmount: 1000 },
        riskTolerance: 'low'
      }

      // First search
      const results1 = await searchEngine.searchStrategies(searchConfig)
      
      // Second search with same config should be cached
      const results2 = await searchEngine.searchStrategies(searchConfig)
      
      expect(results1).toEqual(results2)
    })
  })

  describe('strategy scoring', () => {
    test('scores strategies based on APY matching', () => {
      const strategy = {
        apy: { current: 10 },
        risk: 'medium',
        liquidity: 'high',
        timeCommitment: 'flexible',
        minAmount: 1,
        maxAmount: 100000
      }

      const requirements = {
        requiredAPY: 8,
        riskTolerance: 'medium',
        minLiquidity: 'medium',
        maxTimeCommitment: 'flexible',
        goalConfig: { initialAmount: 1000 }
      }

      const score = searchEngine.calculateStrategyScore(strategy, requirements)
      
      expect(score).toBeGreaterThan(0.8) // Should score highly
      expect(score).toBeLessThanOrEqual(1.0)
    })

    test('penalizes strategies not meeting APY requirements', () => {
      const lowAPYStrategy = {
        apy: { current: 3 },
        risk: 'medium',
        liquidity: 'high',
        timeCommitment: 'flexible',
        minAmount: 1,
        maxAmount: 100000
      }

      const highAPYStrategy = {
        apy: { current: 12 },
        risk: 'medium',
        liquidity: 'high',
        timeCommitment: 'flexible',
        minAmount: 1,
        maxAmount: 100000
      }

      const requirements = {
        requiredAPY: 10,
        riskTolerance: 'medium',
        minLiquidity: 'medium',
        maxTimeCommitment: 'flexible',
        goalConfig: { initialAmount: 1000 }
      }

      const lowScore = searchEngine.calculateStrategyScore(lowAPYStrategy, requirements)
      const highScore = searchEngine.calculateStrategyScore(highAPYStrategy, requirements)
      
      expect(highScore).toBeGreaterThan(lowScore)
    })

    test('matches risk tolerance preferences', () => {
      const riskStrategy = {
        apy: { current: 10 },
        risk: 'high',
        liquidity: 'high',
        timeCommitment: 'flexible',
        minAmount: 1,
        maxAmount: 100000
      }

      const conservativeRequirements = {
        requiredAPY: 8,
        riskTolerance: 'low',
        minLiquidity: 'medium',
        maxTimeCommitment: 'flexible',
        goalConfig: { initialAmount: 1000 }
      }

      const aggressiveRequirements = {
        ...conservativeRequirements,
        riskTolerance: 'high'
      }

      const conservativeScore = searchEngine.calculateStrategyScore(riskStrategy, conservativeRequirements)
      const aggressiveScore = searchEngine.calculateStrategyScore(riskStrategy, aggressiveRequirements)
      
      expect(aggressiveScore).toBeGreaterThan(conservativeScore)
    })
  })

  describe('getAllStrategiesFromChains', () => {
    test('returns strategies from specified chains only', () => {
      const solStrategies = searchEngine.getAllStrategiesFromChains(['SOL'])
      const ethStrategies = searchEngine.getAllStrategiesFromChains(['ETH'])
      
      solStrategies.forEach(strategy => {
        expect(strategy.chain).toBe('SOL')
      })
      
      ethStrategies.forEach(strategy => {
        expect(strategy.chain).toBe('ETH')
      })
      
      expect(solStrategies.length).toBeGreaterThan(0)
      expect(ethStrategies.length).toBeGreaterThan(0)
    })

    test('returns empty array for invalid chains', () => {
      const strategies = searchEngine.getAllStrategiesFromChains(['INVALID'])
      expect(strategies).toEqual([])
    })
  })

  describe('getStrategyById', () => {
    test('finds strategy by ID', () => {
      const strategy = searchEngine.getStrategyById('marinade-staking')
      
      expect(strategy).toBeTruthy()
      expect(strategy.id).toBe('marinade-staking')
      expect(strategy.name).toBe('Marinade Liquid Staking')
    })

    test('returns null for non-existent strategy', () => {
      const strategy = searchEngine.getStrategyById('non-existent')
      expect(strategy).toBeNull()
    })
  })

  describe('updateStrategyAPYs', () => {
    test('updates APY values for all strategies', async () => {
      // Get initial APY values
      const initialSolStrategies = searchEngine.getAllStrategiesFromChains(['SOL'])
      const initialAPYs = initialSolStrategies.map(s => s.apy.current)
      
      // Update APYs
      await searchEngine.updateStrategyAPYs()
      
      // Get updated APY values
      const updatedSolStrategies = searchEngine.getAllStrategiesFromChains(['SOL'])
      const updatedAPYs = updatedSolStrategies.map(s => s.apy.current)
      
      // APYs should still be within min/max bounds
      updatedSolStrategies.forEach(strategy => {
        expect(strategy.apy.current).toBeGreaterThanOrEqual(strategy.apy.min)
        expect(strategy.apy.current).toBeLessThanOrEqual(strategy.apy.max)
      })
    })
  })

  describe('cache management', () => {
    test('respects cache duration', () => {
      const key = 'test-key'
      const data = { test: 'data' }
      
      searchEngine.setInCache(key, data)
      
      // Should retrieve from cache
      const cached = searchEngine.getFromCache(key)
      expect(cached).toEqual(data)
      
      // Manually expire cache
      searchEngine.searchCache.set(key, {
        data,
        timestamp: Date.now() - searchEngine.CACHE_DURATION - 1000
      })
      
      // Should return null for expired cache
      const expired = searchEngine.getFromCache(key)
      expect(expired).toBeNull()
    })

    test('limits cache size', () => {
      // Fill cache beyond limit
      for (let i = 0; i < 150; i++) {
        searchEngine.setInCache(`key-${i}`, { data: i })
      }
      
      expect(searchEngine.searchCache.size).toBeLessThanOrEqual(100)
    })
  })

  describe('error handling', () => {
    test('handles search errors gracefully', async () => {
      // Mock a search that throws an error
      const originalGetAllStrategies = searchEngine.getAllStrategiesFromChains
      searchEngine.getAllStrategiesFromChains = vi.fn(() => {
        throw new Error('Mock search error')
      })
      
      await expect(searchEngine.searchStrategies({
        goalConfig: { initialAmount: 1000 }
      })).rejects.toThrow('Strategy search temporarily unavailable')
      
      // Restore original method
      searchEngine.getAllStrategiesFromChains = originalGetAllStrategies
    })

    test('handles APY calculation errors gracefully', () => {
      const invalidGoalConfig = {
        initialAmount: null,
        targetAmount: undefined,
        targetDate: 'invalid-date'
      }

      const apy = searchEngine.calculateRequiredAPY(invalidGoalConfig)
      expect(apy).toBe(8) // Should return default
    })
  })

  describe('integration with default instance', () => {
    test('default export works correctly', async () => {
      const searchConfig = {
        goalConfig: { initialAmount: 1000 },
        riskTolerance: 'medium'
      }

      const results = await strategySearchEngine.searchStrategies(searchConfig)
      
      expect(results).toHaveProperty('strategies')
      expect(results.strategies).toBeInstanceOf(Array)
    })
  })
})