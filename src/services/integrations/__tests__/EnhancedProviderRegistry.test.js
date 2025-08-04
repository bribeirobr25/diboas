/**
 * Enhanced Provider Registry Tests
 * Comprehensive test suite for the enhanced provider registry system
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { EnhancedProviderRegistry, CIRCUIT_BREAKER_STATES, LOAD_BALANCING_STRATEGIES } from '../EnhancedProviderRegistry.js'

// Mock dependencies
vi.mock('../../../utils/caching/CacheManager.js', () => ({
  cacheManager: {
    get: vi.fn(() => Promise.resolve(null)),
    set: vi.fn(() => Promise.resolve()),
    delete: vi.fn(() => Promise.resolve())
  },
  CACHE_POLICIES: {
    DYNAMIC: { ttl: 300000 },
    API: { ttl: 600000 },
    STATIC: { ttl: 86400000 }
  }
}))

vi.mock('../../../utils/secureLogger.js', () => ({
  default: {
    audit: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

vi.mock('../../../utils/advancedRateLimiter.js', () => ({
  checkGeneralRateLimit: vi.fn(() => ({
    allowed: true,
    remaining: 100,
    resetTime: Date.now() + 60000
  }))
}))

// Mock provider for testing
class MockProvider {
  constructor(config = {}) {
    this.config = config
    this.shouldFail = config.shouldFail || false
    this.responseTime = config.responseTime || 100
    this.callCount = 0
  }

  async testOperation() {
    this.callCount++
    
    await new Promise(resolve => setTimeout(resolve, this.responseTime))
    
    if (this.shouldFail) {
      throw new Error('Mock provider failure')
    }
    
    return { success: true, callCount: this.callCount }
  }

  async healthCheck() {
    if (this.shouldFail) {
      return { healthy: false }
    }
    return { healthy: true }
  }
}

describe('Enhanced Provider Registry', () => {
  let registry
  let mockProvider1, mockProvider2, mockProvider3

  beforeEach(async () => {
    registry = new EnhancedProviderRegistry('test-registry', {
      healthCheckInterval: 1000,
      maxRetries: 2,
      retryDelay: 100
    })

    mockProvider1 = new MockProvider({ responseTime: 100 })
    mockProvider2 = new MockProvider({ responseTime: 200 })
    mockProvider3 = new MockProvider({ responseTime: 300, shouldFail: true })

    await registry.registerProvider('provider1', mockProvider1, {
      priority: 3,
      weight: 2,
      enabled: true,
      environments: ['development', 'staging', 'production', 'test']
    })

    await registry.registerProvider('provider2', mockProvider2, {
      priority: 2,
      weight: 1,
      enabled: true,
      environments: ['development', 'staging', 'production', 'test']
    })

    await registry.registerProvider('provider3', mockProvider3, {
      priority: 1,
      weight: 1,
      enabled: true,
      environments: ['development', 'staging', 'production', 'test']
    })

    // Wait a bit for registration to complete
    await new Promise(resolve => setTimeout(resolve, 10))
  })

  afterEach(() => {
    registry.destroy()
  })

  describe('Enhanced Provider Registration', () => {
    it('should register providers with circuit breakers', () => {
      expect(registry.providers.size).toBe(3)
      expect(registry.circuitBreakers.size).toBe(3)
      expect(registry.adaptiveThresholds.size).toBe(3)
    })

    it('should initialize circuit breakers with correct state', () => {
      const circuitBreaker = registry.circuitBreakers.get('provider1')
      expect(circuitBreaker.state).toBe(CIRCUIT_BREAKER_STATES.CLOSED)
      expect(circuitBreaker.failureCount).toBe(0)
    })

    it('should initialize adaptive thresholds', () => {
      const thresholds = registry.adaptiveThresholds.get('provider1')
      expect(thresholds.responseTimeThreshold).toBeDefined()
      expect(thresholds.successRateThreshold).toBeDefined()
    })
  })

  describe('Load Balancing Strategies', () => {
    it('should select providers using round robin', () => {
      const provider1 = registry.selectRoundRobin(['provider1', 'provider2', 'provider3'])
      const provider2 = registry.selectRoundRobin(['provider1', 'provider2', 'provider3'])
      const provider3 = registry.selectRoundRobin(['provider1', 'provider2', 'provider3'])
      const provider4 = registry.selectRoundRobin(['provider1', 'provider2', 'provider3'])

      expect(provider1).toBe('provider1')
      expect(provider2).toBe('provider2')
      expect(provider3).toBe('provider3')
      expect(provider4).toBe('provider1') // Should cycle back
    })

    it('should select providers using weighted round robin', () => {
      const selections = []
      for (let i = 0; i < 10; i++) {
        selections.push(registry.selectWeightedRoundRobin(['provider1', 'provider2']))
      }

      // Provider1 has weight 2, provider2 has weight 1
      // So provider1 should be selected more frequently
      const provider1Count = selections.filter(p => p === 'provider1').length
      const provider2Count = selections.filter(p => p === 'provider2').length
      
      expect(provider1Count).toBeGreaterThan(provider2Count)
    })

    it('should select provider with least response time', () => {
      // Record some metrics
      registry.performanceMetrics.record('provider1', 'test', 100, true)
      registry.performanceMetrics.record('provider2', 'test', 200, true)
      registry.performanceMetrics.record('provider3', 'test', 300, true)

      const selected = registry.selectLeastResponseTime(['provider1', 'provider2', 'provider3'], 'test')
      expect(selected).toBe('provider1')
    })

    it('should select provider based on health', () => {
      // Set different health states
      const stats1 = registry.providerStats.get('provider1')
      const stats2 = registry.providerStats.get('provider2')
      const stats3 = registry.providerStats.get('provider3')

      stats1.uptime = 100
      stats2.uptime = 80
      stats3.uptime = 60

      const selected = registry.selectHealthBased(['provider1', 'provider2', 'provider3'])
      expect(selected).toBe('provider1')
    })
  })

  describe('Circuit Breaker Functionality', () => {
    it('should open circuit breaker after threshold failures', async () => {
      const circuitBreaker = registry.circuitBreakers.get('provider3')
      
      // Trigger enough failures to open circuit breaker
      for (let i = 0; i < 10; i++) {
        try {
          await circuitBreaker.execute(() => mockProvider3.testOperation(), 'provider3')
        } catch (error) {
          // Expected to fail
        }
      }
      
      expect(circuitBreaker.state).toBe(CIRCUIT_BREAKER_STATES.OPEN)
    })

    it('should block requests when circuit breaker is open', async () => {
      const circuitBreaker = registry.circuitBreakers.get('provider3')
      
      // Force circuit breaker to open
      circuitBreaker.state = CIRCUIT_BREAKER_STATES.OPEN
      circuitBreaker.nextAttempt = Date.now() + 10000 // 10 seconds in future
      
      await expect(
        circuitBreaker.execute(() => mockProvider3.testOperation(), 'provider3')
      ).rejects.toThrow('Circuit breaker OPEN')
    })

    it('should transition to half-open after recovery timeout', async () => {
      const circuitBreaker = registry.circuitBreakers.get('provider3')
      
      // Set circuit breaker to open with past recovery time
      circuitBreaker.state = CIRCUIT_BREAKER_STATES.OPEN
      circuitBreaker.nextAttempt = Date.now() - 1000 // 1 second ago
      
      // Successful execution should transition to closed
      mockProvider3.shouldFail = false
      await circuitBreaker.execute(() => mockProvider3.testOperation(), 'provider3')
      
      expect(circuitBreaker.state).toBe(CIRCUIT_BREAKER_STATES.CLOSED)
    })
  })

  describe('Performance Metrics', () => {
    it('should record operation metrics', () => {
      registry.performanceMetrics.record('provider1', 'testOp', 150, true)
      registry.performanceMetrics.record('provider1', 'testOp', 200, false)
      
      const metrics = registry.performanceMetrics.getMetrics('provider1', 'testOp')
      
      expect(metrics.count).toBe(2)
      expect(metrics.successCount).toBe(1)
      expect(metrics.failureCount).toBe(1)
      expect(metrics.totalDuration).toBe(350)
    })

    it('should calculate percentiles correctly', () => {
      const durations = [100, 150, 200, 250, 300, 350, 400, 450, 500, 1000]
      
      for (const duration of durations) {
        registry.performanceMetrics.record('provider1', 'testOp', duration, true)
      }
      
      const metrics = registry.performanceMetrics.getMetrics('provider1', 'testOp')
      
      expect(metrics.p95).toBeGreaterThan(400)
      expect(metrics.p99).toBeGreaterThan(800)
    })

    it('should identify top performers', () => {
      // Record metrics for different providers
      registry.performanceMetrics.record('provider1', 'testOp', 100, true)
      registry.performanceMetrics.record('provider1', 'testOp', 120, true)
      
      registry.performanceMetrics.record('provider2', 'testOp', 200, true)
      registry.performanceMetrics.record('provider2', 'testOp', 180, false)
      
      const topPerformers = registry.performanceMetrics.getTopPerformers('testOp', 2)
      
      expect(topPerformers).toHaveLength(2)
      expect(topPerformers[0].providerId).toBe('provider1') // Better performance
    })
  })

  describe('Enhanced Execution with Failover', () => {
    it('should execute operation with performance tracking', async () => {
      // Ensure provider3 doesn't fail for this test
      mockProvider3.shouldFail = false
      
      // Mark providers as healthy by adding some successful requests
      const stats1 = registry.providerStats.get('provider1')
      const stats2 = registry.providerStats.get('provider2')
      const stats3 = registry.providerStats.get('provider3')
      
      stats1.successCount = 10
      stats1.totalRequests = 10
      stats2.successCount = 10
      stats2.totalRequests = 10
      stats3.successCount = 10
      stats3.totalRequests = 10
      
      registry.updateProviderHealth('provider1')
      registry.updateProviderHealth('provider2')
      registry.updateProviderHealth('provider3')
      
      const operation = async (provider, providerId) => {
        return await provider.testOperation()
      }

      const result = await registry.executeWithFailover(operation, {
        operationName: 'testOperation'
      })

      expect(result.success).toBe(true)
      expect(result.providerId).toBeDefined()
      expect(result.latency).toBeGreaterThan(0)
      expect(result.attempts).toBe(1)
      expect(result.circuitBreakerState).toBe(CIRCUIT_BREAKER_STATES.CLOSED)
    })

    it('should failover to next provider on failure', async () => {
      // Ensure provider2 and provider3 don't fail for this test
      mockProvider2.shouldFail = false
      mockProvider3.shouldFail = false
      
      // Mark providers as healthy by adding some successful requests
      const stats1 = registry.providerStats.get('provider1')
      const stats2 = registry.providerStats.get('provider2')
      const stats3 = registry.providerStats.get('provider3')
      
      stats1.successCount = 10
      stats1.totalRequests = 10
      stats2.successCount = 10
      stats2.totalRequests = 10
      stats3.successCount = 10
      stats3.totalRequests = 10
      
      registry.updateProviderHealth('provider1')
      registry.updateProviderHealth('provider2')
      registry.updateProviderHealth('provider3')
      
      const operation = async (provider, providerId) => {
        if (providerId === 'provider1') {
          throw new Error('Provider 1 failed')
        }
        return await provider.testOperation()
      }

      const result = await registry.executeWithFailover(operation, {
        operationName: 'testOperation',
        maxAttempts: 3
      })

      expect(result.success).toBe(true)
      expect(result.providerId).not.toBe('provider1') // Should not use failed provider
      expect(result.attempts).toBeGreaterThanOrEqual(1)
    })

    it('should throw error when all providers fail', async () => {
      const operation = async (provider, providerId) => {
        throw new Error(`Provider ${providerId} failed`)
      }

      await expect(
        registry.executeWithFailover(operation, {
          operationName: 'testOperation',
          maxAttempts: 3
        })
      ).rejects.toThrow('All providers failed')
    })
  })

  describe('Adaptive Thresholds', () => {
    it('should update thresholds based on performance', async () => {
      const initialThresholds = registry.adaptiveThresholds.get('provider1')
      const initialResponseTimeThreshold = initialThresholds.responseTimeThreshold
      
      // Record very good performance
      for (let i = 0; i < 50; i++) {
        registry.performanceMetrics.record('provider1', 'default', 50, true)
      }
      
      // Force threshold update by setting last adjustment time in past
      initialThresholds.lastAdjustment = Date.now() - 400000 // 6+ minutes ago
      
      await registry.updateAdaptiveThresholds('provider1', 50, true)
      
      const updatedThresholds = registry.adaptiveThresholds.get('provider1')
      // Should be more lenient due to good performance
      expect(updatedThresholds.responseTimeThreshold).toBeGreaterThanOrEqual(initialResponseTimeThreshold)
    })
  })

  describe('A/B Testing Support', () => {
    it('should apply A/B testing to provider selection', () => {
      registry.abTests.set('provider1', {
        enabled: true,
        trafficPercentage: 50
      })

      const availableProviders = ['provider1', 'provider2']
      
      // Test multiple times to check randomization
      const results = []
      for (let i = 0; i < 100; i++) {
        const testProviders = registry.applyABTesting(availableProviders, 'testGroup')
        results.push(testProviders.length)
      }
      
      // Should have variation in results due to traffic percentage
      const uniqueResults = [...new Set(results)]
      expect(uniqueResults.length).toBeGreaterThan(1)
    })
  })

  describe('Provider Availability Checks', () => {
    it('should check circuit breaker state', () => {
      const circuitBreaker = registry.circuitBreakers.get('provider1')
      circuitBreaker.state = CIRCUIT_BREAKER_STATES.OPEN
      
      expect(registry.isProviderAvailable('provider1')).toBe(false)
      
      circuitBreaker.state = CIRCUIT_BREAKER_STATES.CLOSED
      expect(registry.isProviderAvailable('provider1')).toBe(true)
    })

    it('should check feature flags', () => {
      registry.featureFlags.set('provider1', { testOperation: false })
      
      expect(registry.isProviderAvailable('provider1', 'testOperation')).toBe(false)
      expect(registry.isProviderAvailable('provider1', 'otherOperation')).toBe(true)
    })
  })

  describe('Analytics and Monitoring', () => {
    it('should record analytics data', () => {
      const initialBufferSize = registry.analyticsBuffer.length
      
      registry.recordAnalytics({
        type: 'test_event',
        providerId: 'provider1',
        timestamp: new Date().toISOString()
      })
      
      expect(registry.analyticsBuffer.length).toBe(initialBufferSize + 1)
    })

    it('should prevent analytics buffer overflow', () => {
      // Fill buffer beyond maximum
      for (let i = 0; i < registry.maxAnalyticsBuffer + 100; i++) {
        registry.recordAnalytics({
          type: 'test_event',
          index: i
        })
      }
      
      expect(registry.analyticsBuffer.length).toBeLessThanOrEqual(registry.maxAnalyticsBuffer)
    })
  })

  describe('Enhanced Health Status', () => {
    it('should return comprehensive health status', () => {
      const healthStatus = registry.getEnhancedHealthStatus()
      
      expect(healthStatus).toHaveProperty('registryType')
      expect(healthStatus).toHaveProperty('circuitBreakers')
      expect(healthStatus).toHaveProperty('performanceMetrics')
      expect(healthStatus).toHaveProperty('adaptiveThresholds')
      expect(healthStatus).toHaveProperty('loadBalancingStrategy')
      expect(healthStatus).toHaveProperty('enhancedFeatures')
      
      expect(healthStatus.enhancedFeatures.circuitBreakers).toBe(true)
      expect(healthStatus.enhancedFeatures.adaptiveThresholds).toBe(true)
      expect(healthStatus.enhancedFeatures.performanceAnalytics).toBe(true)
    })

    it('should include circuit breaker states', () => {
      const healthStatus = registry.getEnhancedHealthStatus()
      
      expect(healthStatus.circuitBreakers).toHaveProperty('provider1')
      expect(healthStatus.circuitBreakers).toHaveProperty('provider2')
      expect(healthStatus.circuitBreakers).toHaveProperty('provider3')
      
      expect(healthStatus.circuitBreakers.provider1.state).toBe(CIRCUIT_BREAKER_STATES.CLOSED)
    })
  })

  describe('Performance Analytics', () => {
    it('should calculate performance analytics', () => {
      // Add some analytics data
      const now = Date.now()
      registry.analyticsBuffer.push(
        { type: 'provider_execution', providerId: 'provider1', duration: 100, success: true, timestamp: new Date(now - 1000).toISOString() },
        { type: 'provider_execution', providerId: 'provider1', duration: 150, success: true, timestamp: new Date(now - 2000).toISOString() },
        { type: 'provider_execution', providerId: 'provider2', duration: 200, success: false, timestamp: new Date(now - 3000).toISOString() }
      )
      
      const analytics = registry.getPerformanceAnalytics(60000) // 1 minute window
      
      expect(analytics.totalRequests).toBe(3)
      expect(analytics.successfulRequests).toBe(2)
      expect(analytics.failedRequests).toBe(1)
      expect(analytics.avgDuration).toBeCloseTo(150, 0)
      expect(analytics.providerBreakdown).toHaveProperty('provider1')
      expect(analytics.providerBreakdown).toHaveProperty('provider2')
    })
  })

  describe('Feature Flag Management', () => {
    it('should set and retrieve feature flags', () => {
      registry.setFeatureFlag('provider1', 'testOperation', false)
      
      const flags = registry.featureFlags.get('provider1')
      expect(flags.testOperation).toBe(false)
    })

    it('should respect feature flags in provider selection', () => {
      registry.setFeatureFlag('provider1', 'testOperation', false)
      
      const availableProviders = registry.getAvailableProviders({
        operation: 'testOperation'
      })
      
      expect(availableProviders).not.toContain('provider1')
    })
  })

  describe('A/B Test Configuration', () => {
    it('should configure A/B tests', () => {
      registry.setABTest('provider1', {
        enabled: true,
        trafficPercentage: 25,
        startDate: new Date().toISOString()
      })
      
      const abTest = registry.abTests.get('provider1')
      expect(abTest.enabled).toBe(true)
      expect(abTest.trafficPercentage).toBe(25)
    })
  })

  describe('Resource Cleanup', () => {
    it('should clean up resources on destroy', () => {
      registry.destroy()
      
      expect(registry.performanceMetrics).toBeNull()
      expect(registry.circuitBreakers.size).toBe(0)
      expect(registry.adaptiveThresholds.size).toBe(0)
      expect(registry.analyticsBuffer.length).toBe(0)
    })
  })
})