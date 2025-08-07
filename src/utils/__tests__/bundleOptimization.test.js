/**
 * Bundle Optimization Tests
 * Tests for advanced bundle optimization and code splitting
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { 
  moduleCache, 
  TreeShaking, 
  BundleSizeAnalyzer, 
  PerformanceBudget,
  PreloadingStrategy,
  bundleSizeAnalyzer,
  performanceBudget,
  preloadingStrategy
} from '../bundleOptimization.js'

// Mock performance API
global.performance = {
  now: vi.fn(() => Date.now()),
  mark: vi.fn(),
  measure: vi.fn()
}

// Mock dynamic imports
vi.mock('../testModule.js', () => ({
  default: { testFunction: () => 'test' },
  namedExport: () => 'named'
}), { virtual: true })

describe('Bundle Optimization', () => {
  beforeEach(() => {
    moduleCache.clearCache()
    vi.clearAllMocks()
  })

  describe('ModuleCache', () => {
    it('should cache imported modules', async () => {
      const mockModule = { default: { test: true } }
      
      // Mock dynamic import
      const importFn = vi.fn().mockResolvedValue(mockModule)
      vi.doMock('./testModule.js', importFn)

      const result1 = await moduleCache.importModule('./testModule.js')
      const result2 = await moduleCache.importModule('./testModule.js')

      expect(importFn).toHaveBeenCalledOnce()
      expect(result1).toBe(result2)
    })

    it('should handle import failures with retries', async () => {
      const error = new Error('Import failed')
      const importFn = vi.fn()
        .mockRejectedValueOnce(error)
        .mockRejectedValueOnce(error)
        .mockResolvedValue({ default: { success: true } })

      vi.doMock('./failingModule.js', importFn)

      const result = await moduleCache.importModule('./failingModule.js', { retries: 3 })

      expect(importFn).toHaveBeenCalledTimes(3)
      expect(result.default.success).toBe(true)
    })

    it('should respect timeout settings', async () => {
      const slowImport = () => new Promise(resolve => 
        setTimeout(() => resolve({ default: {} }), 200)
      )

      vi.doMock('./slowModule.js', slowImport)

      await expect(
        moduleCache.importModule('./slowModule.js', { timeout: 100 })
      ).rejects.toThrow('Module load timeout')
    })

    it('should use fallback modules when available', async () => {
      const fallbackModule = { default: { fallback: true } }
      
      vi.doMock('./primaryModule.js', () => Promise.reject(new Error('Failed')))
      vi.doMock('./fallbackModule.js', () => Promise.resolve(fallbackModule))

      const result = await moduleCache.importModule('./primaryModule.js', {
        retries: 0,
        fallback: './fallbackModule.js'
      })

      expect(result.default.fallback).toBe(true)
    })

    it('should provide cache statistics', () => {
      moduleCache.cache.set('module1', { default: {} })
      moduleCache.cache.set('module2', { default: {} })

      const stats = moduleCache.getCacheStats()

      expect(stats.cachedModules).toBe(2)
      expect(stats.modules).toContain('module1')
      expect(stats.modules).toContain('module2')
    })
  })

  describe('TreeShaking', () => {
    it('should import specific functions from modules', async () => {
      const mockModule = {
        functionA: () => 'a',
        functionB: () => 'b',
        functionC: () => 'c'
      }

      vi.doMock('./utilModule.js', () => Promise.resolve(mockModule))

      const result = await TreeShaking.importFunctions('./utilModule.js', ['functionA', 'functionC'])

      expect(result.functionA).toBeDefined()
      expect(result.functionC).toBeDefined()
      expect(result.functionB).toBeUndefined()
    })

    it('should handle missing functions gracefully', async () => {
      const mockModule = {
        existingFunction: () => 'exists',
        missingFunction: undefined // Explicitly define as undefined
      }

      vi.doMock('./partialModule.js', () => Promise.resolve(mockModule))

      const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const result = await TreeShaking.importFunctions('./partialModule.js', ['existingFunction', 'missingFunction'])

      expect(result.existingFunction).toBeDefined()
      expect(result.missingFunction).toBeUndefined()
      expect(consoleSpy).toHaveBeenCalledWith('Function missingFunction not found in module ./partialModule.js')
      
      consoleSpy.mockRestore()
    })

    it('should load modules conditionally', async () => {
      const mockModule = { default: { loaded: true } }
      vi.doMock('./conditionalModule.js', () => Promise.resolve(mockModule))

      const resultTrue = await TreeShaking.loadConditionalModule('./conditionalModule.js', true)
      const resultFalse = await TreeShaking.loadConditionalModule('./conditionalModule.js', false)

      expect(resultTrue.default.loaded).toBe(true)
      expect(resultFalse).toBeNull()
    })
  })

  describe('BundleSizeAnalyzer', () => {
    let analyzer

    beforeEach(() => {
      analyzer = new BundleSizeAnalyzer()
    })

    it('should register and track modules', () => {
      analyzer.registerModule('module1', 50000, 100)
      analyzer.registerModule('module2', 30000, 150)

      const stats = analyzer.getModuleStats()

      expect(stats.totalModules).toBe(2)
      expect(stats.totalSize).toBe(80000)
      expect(stats.averageLoadTime).toBe(125)
    })

    it('should identify largest modules', () => {
      analyzer.registerModule('small', 10000, 50)
      analyzer.registerModule('large', 100000, 200)
      analyzer.registerModule('medium', 50000, 100)

      const largest = analyzer.getLargestModules(2)

      expect(largest).toHaveLength(2)
      expect(largest[0].name).toBe('large')
      expect(largest[0].size).toBe(100000)
      expect(largest[1].name).toBe('medium')
    })

    it('should identify slowest modules', () => {
      analyzer.registerModule('fast', 10000, 50)
      analyzer.registerModule('slow', 20000, 300)
      analyzer.registerModule('medium', 30000, 150)

      const slowest = analyzer.getSlowestModules(2)

      expect(slowest).toHaveLength(2)
      expect(slowest[0].name).toBe('slow')
      expect(slowest[0].loadTime).toBe(300)
      expect(slowest[1].name).toBe('medium')
    })

    it('should format sizes correctly', () => {
      expect(analyzer.formatSize(1024)).toBe('1 KB')
      expect(analyzer.formatSize(1048576)).toBe('1 MB')
      expect(analyzer.formatSize(500)).toBe('500 B')
    })

    it('should generate recommendations', () => {
      analyzer.registerModule('slow1', 10000, 3000)
      analyzer.registerModule('slow2', 10000, 2500)
      analyzer.registerModule('large', 200000, 100)

      // Register many modules to trigger module count recommendation
      for (let i = 0; i < 60; i++) {
        analyzer.registerModule(`module${i}`, 1000, 10)
      }

      const report = analyzer.generateReport()

      // Check that recommendations contain expected types
      const recommendationTypes = report.recommendations.map(r => r.type)
      expect(recommendationTypes).toContain('performance')
      expect(recommendationTypes).toContain('architecture')
      expect(recommendationTypes).toContain('size')
    })
  })

  describe('PerformanceBudget', () => {
    let budget

    beforeEach(() => {
      budget = new PerformanceBudget({
        maxBundleSize: 100000,
        maxLoadTime: 1000,
        maxModuleCount: 10
      })
    })

    it('should pass when within budget', () => {
      const stats = {
        totalSize: 80000,
        averageLoadTime: 800,
        totalModules: 8
      }

      const result = budget.checkBudget(stats)

      expect(result.passed).toBe(true)
      expect(result.violations).toHaveLength(0)
    })

    it('should detect budget violations', () => {
      const stats = {
        totalSize: 150000,
        averageLoadTime: 1500,
        totalModules: 15
      }

      const result = budget.checkBudget(stats)

      expect(result.passed).toBe(false)
      expect(result.violations).toHaveLength(3)
      expect(result.violations[0].type).toBe('bundle-size')
      expect(result.violations[1].type).toBe('load-time')
      expect(result.violations[2].type).toBe('module-count')
    })

    it('should report violations correctly', () => {
      const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {})
      const consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
      const consoleGroupSpy = vi.spyOn(console, 'group').mockImplementation(() => {})
      const consoleGroupEndSpy = vi.spyOn(console, 'groupEnd').mockImplementation(() => {})

      budget.violations = [
        { message: 'Test violation 1' },
        { message: 'Test violation 2' }
      ]

      budget.reportViolations()

      expect(consoleGroupSpy).toHaveBeenCalledWith('⚠️  Performance Budget Violations')
      expect(consoleWarnSpy).toHaveBeenCalledWith('Test violation 1')
      expect(consoleWarnSpy).toHaveBeenCalledWith('Test violation 2')
      expect(consoleGroupEndSpy).toHaveBeenCalled()

      // Test passing case
      budget.violations = []
      budget.reportViolations()

      expect(consoleSpy).toHaveBeenCalledWith('✅ All performance budgets are within limits')

      consoleSpy.mockRestore()
      consoleWarnSpy.mockRestore()
      consoleGroupSpy.mockRestore()
      consoleGroupEndSpy.mockRestore()
    })
  })

  describe('PreloadingStrategy', () => {
    let strategy

    beforeEach(() => {
      strategy = new PreloadingStrategy()
      global.requestIdleCallback = vi.fn((callback) => {
        callback({ timeRemaining: () => 50 })
      })
    })

    it('should preload modules on idle', () => {
      const modules = ['./module1.js', './module2.js']
      
      strategy.preloadOnIdle(modules)

      expect(global.requestIdleCallback).toHaveBeenCalled()
    })

    it('should analyze user patterns', () => {
      const actions = ['dashboard', 'transactions', 'banking', 'banking', 'dashboard']
      
      const patterns = strategy.analyzeUserPatterns(actions)

      // Check that patterns include expected modules
      const modules = patterns.map(p => p.module)
      const priorities = patterns.map(p => p.priority)
      
      expect(modules).toContain('./components/TransactionPage.jsx')
      expect(modules).toContain('./components/categories/BankingCategory.jsx')
      expect(priorities).toContain('high')
    })

    it('should queue modules with priority', () => {
      strategy.queueModuleForPreload('./module1.js', 'low')
      strategy.queueModuleForPreload('./module2.js', 'high')
      strategy.queueModuleForPreload('./module3.js', 'normal')

      const stats = strategy.getStats()

      expect(stats.queueLength).toBe(3)
      // High priority should be first
      expect(strategy.preloadQueue[0].priority).toBe('high')
    })

    it('should provide statistics', () => {
      strategy.preloadedModules.add('./module1.js')
      strategy.preloadedModules.add('./module2.js')
      strategy.queueModuleForPreload('./module3.js')

      const stats = strategy.getStats()

      expect(stats.preloadedCount).toBe(2)
      expect(stats.queueLength).toBe(1)
      expect(stats.preloadedModules).toContain('./module1.js')
      expect(stats.preloadedModules).toContain('./module2.js')
    })
  })

  describe('Global Instances', () => {
    it('should have initialized global instances', () => {
      expect(bundleSizeAnalyzer).toBeInstanceOf(BundleSizeAnalyzer)
      expect(performanceBudget).toBeInstanceOf(PerformanceBudget)
      expect(preloadingStrategy).toBeInstanceOf(PreloadingStrategy)
    })

    it('should track bundle metrics in analyzer', () => {
      bundleSizeAnalyzer.registerModule('test-module', 25000, 120)
      
      const stats = bundleSizeAnalyzer.getModuleStats()
      expect(stats.totalModules).toBeGreaterThan(0)
    })
  })
})