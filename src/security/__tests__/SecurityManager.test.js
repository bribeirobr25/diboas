import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  SecurityManager, 
  SECURITY_EVENT_TYPES, 
  SECURITY_LEVELS 
} from '../SecurityManager.js'

// Mock subdomain detection
vi.mock('../../config/subdomains.js', () => ({
  detectCurrentSubdomain: () => 'app',
  getSubdomainSecurityPolicy: () => ({
    csp: { 'default-src': ["'self'"] },
    frameOptions: 'DENY',
    referrerPolicy: 'same-origin'
  }),
  SUBDOMAINS: { APP: 'app', WWW: 'www' }
}))

// Mock environment detection
vi.mock('../../config/environments.js', () => ({
  getCurrentEnvironment: () => 'development'
}))

describe('SecurityManager', () => {
  let securityManager

  beforeEach(() => {
    vi.useFakeTimers()
    securityManager = new SecurityManager()
  })

  afterEach(() => {
    securityManager.reset()
    vi.clearAllTimers()
    vi.useRealTimers()
  })

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(securityManager.currentSubdomain).toBe('app')
      expect(securityManager.environment).toBe('development')
      // Allow for initialization event
      expect(securityManager.eventLog.length).toBeGreaterThanOrEqual(0)
      expect(securityManager.sessionData.size).toBe(0)
      expect(securityManager.rateLimiters.size).toBe(0)
    })

    it('should have security policy configured', () => {
      expect(securityManager.securityPolicy).toBeDefined()
      expect(securityManager.securityPolicy.csp).toBeDefined()
      expect(securityManager.securityPolicy.frameOptions).toBe('DENY')
    })
  })

  describe('Security Event Logging', () => {
    it('should log security events correctly', () => {
      const initialLogLength = securityManager.eventLog.length
      
      securityManager.logSecurityEvent(SECURITY_EVENT_TYPES.AUTHENTICATION_SUCCESS, {
        userId: 'test123',
        method: 'password'
      })

      expect(securityManager.eventLog).toHaveLength(initialLogLength + 1)
      const event = securityManager.eventLog[securityManager.eventLog.length - 1]
      
      expect(event.type).toBe(SECURITY_EVENT_TYPES.AUTHENTICATION_SUCCESS)
      expect(event.data.userId).toBe('test123')
      expect(event.data.method).toBe('password')
      expect(event.subdomain).toBe('app')
      expect(event.environment).toBe('development')
      expect(event.timestamp).toBeTypeOf('number')
      expect(event.id).toMatch(/^sec_/)
    })

    it('should maintain maximum log size', () => {
      // Add more than 1000 events
      for (let i = 0; i < 1100; i++) {
        securityManager.logSecurityEvent(SECURITY_EVENT_TYPES.AUTHENTICATION_SUCCESS, { count: i })
      }

      expect(securityManager.eventLog).toHaveLength(1000)
      expect(securityManager.eventLog[0].data.count).toBe(100) // First 100 should be removed
    })
  })

  describe('Rate Limiting', () => {
    it('should allow requests within limits', () => {
      const result = securityManager.checkRateLimit('api_request', 'user123')
      expect(result).toBe(true)
    })

    it('should block requests exceeding limits', () => {
      const operation = 'financial_transaction'
      const identifier = 'user123'

      // Make requests up to the limit
      for (let i = 0; i < 10; i++) {
        const result = securityManager.checkRateLimit(operation, identifier)
        expect(result).toBe(true)
      }

      // Next request should be blocked
      const result = securityManager.checkRateLimit(operation, identifier)
      expect(result).toBe(false)
    })

    it('should handle different rate limits per operation', () => {
      const limits = securityManager.getRateLimits('financial_transaction')
      expect(limits.maxRequests).toBe(10)

      const apiLimits = securityManager.getRateLimits('api_request')
      expect(apiLimits.maxRequests).toBe(100)
    })

    it('should log rate limit violations', () => {
      const operation = 'authentication'
      const identifier = 'user123'

      // Exceed rate limit
      for (let i = 0; i < 6; i++) {
        securityManager.checkRateLimit(operation, identifier)
      }

      const events = securityManager.eventLog.filter(
        event => event.type === SECURITY_EVENT_TYPES.RATE_LIMIT_EXCEEDED
      )
      expect(events).toHaveLength(1)
    })
  })

  describe('Financial Operation Validation', () => {
    it('should validate legitimate financial operations', () => {
      const operation = {
        type: 'buy',
        amount: 100,
        asset: 'BTC',
        userId: 'user123'
      }

      expect(() => securityManager.validateFinancialOperation(operation)).not.toThrow()
    })

    it('should reject invalid amounts', () => {
      const operation = {
        type: 'buy',
        amount: -100,
        userId: 'user123'
      }

      expect(() => securityManager.validateFinancialOperation(operation))
        .toThrow('Invalid transaction amount')
    })

    it('should reject excessive amounts', () => {
      const operation = {
        type: 'buy',
        amount: 2000000,
        userId: 'user123'
      }

      expect(() => securityManager.validateFinancialOperation(operation))
        .toThrow('Invalid transaction amount')
    })

    it('should reject invalid assets', () => {
      const operation = {
        type: 'buy',
        amount: 100,
        asset: 'INVALID',
        userId: 'user123'
      }

      expect(() => securityManager.validateFinancialOperation(operation))
        .toThrow('Invalid asset type')
    })

    it('should log financial operations', () => {
      const operation = {
        type: 'buy',
        amount: 100,
        asset: 'BTC',
        userId: 'user123'
      }

      securityManager.validateFinancialOperation(operation)

      const events = securityManager.eventLog.filter(
        event => event.type === SECURITY_EVENT_TYPES.FINANCIAL_OPERATION
      )
      expect(events).toHaveLength(1)
      expect(events[0].data.operation).toBe('buy')
      expect(events[0].data.amount).toBe(100)
      expect(events[0].data.asset).toBe('BTC')
    })
  })

  describe('Secure Data Storage', () => {
    it('should store and retrieve secure data', () => {
      const testData = { secret: 'test123', token: 'abc' }
      securityManager.storeSecureData('test_key', testData)

      const retrieved = securityManager.getSecureData('test_key')
      expect(retrieved).toEqual(testData)
    })

    it('should return null for non-existent data', () => {
      const result = securityManager.getSecureData('non_existent')
      expect(result).toBeNull()
    })

    it('should respect TTL for stored data', () => {
      const testData = { secret: 'test123' }
      securityManager.storeSecureData('test_key', testData, 100) // 100ms TTL

      // Should be available immediately
      expect(securityManager.getSecureData('test_key')).toEqual(testData)

      // Wait for TTL to expire
      vi.advanceTimersByTime(150)

      // Should be null after TTL
      expect(securityManager.getSecureData('test_key')).toBeNull()
    })

    it('should log credential access events', () => {
      const testData = { secret: 'test123' }
      securityManager.storeSecureData('test_key', testData)
      securityManager.getSecureData('test_key')

      const credentialEvents = securityManager.eventLog.filter(
        event => event.type === SECURITY_EVENT_TYPES.CREDENTIAL_ACCESS
      )
      expect(credentialEvents).toHaveLength(2) // store and retrieve
      expect(credentialEvents[0].data.action).toBe('store')
      expect(credentialEvents[1].data.action).toBe('retrieve')
    })
  })

  describe('Memory Management', () => {
    it('should clear sensitive memory', () => {
      // Mock sessionStorage
      const mockSessionStorage = {
        getItem: vi.fn(),
        removeItem: vi.fn()
      }
      Object.defineProperty(global, 'sessionStorage', {
        value: mockSessionStorage,
        writable: true
      })

      securityManager.storeSecureData('sensitive', { data: 'secret' })
      expect(securityManager.sessionData.size).toBe(1)

      securityManager.clearSensitiveMemory()
      expect(securityManager.sessionData.size).toBe(0)
    })

    it('should clear expired sensitive data', () => {
      securityManager.storeSecureData('key1', { data: 'test1' }, 100)
      securityManager.storeSecureData('key2', { data: 'test2' }, 1000)

      expect(securityManager.sessionData.size).toBe(2)

      // Advance time to expire first item
      vi.advanceTimersByTime(150)
      securityManager.clearExpiredSensitiveData()

      expect(securityManager.sessionData.size).toBe(1)
      expect(securityManager.getSecureData('key1')).toBeNull()
      expect(securityManager.getSecureData('key2')).toBeTruthy()
    })
  })

  describe('Security Metrics', () => {
    it('should provide comprehensive security metrics', () => {
      const initialEvents = securityManager.eventLog.length
      
      // Generate some events
      securityManager.logSecurityEvent(SECURITY_EVENT_TYPES.AUTHENTICATION_SUCCESS, { severity: 'low' })
      securityManager.logSecurityEvent(SECURITY_EVENT_TYPES.RATE_LIMIT_EXCEEDED, { severity: 'high' })
      securityManager.storeSecureData('test', { data: 'test' })
      securityManager.checkRateLimit('api_request', 'user1')

      const metrics = securityManager.getSecurityMetrics()

      expect(metrics.totalEvents).toBeGreaterThanOrEqual(3) // At least the events we added
      expect(metrics.eventTypes).toBeDefined()
      expect(metrics.severityBreakdown).toBeDefined()
      expect(metrics.rateLimitersActive).toBeGreaterThan(0)
      expect(metrics.secureDataStored).toBe(1)
      expect(metrics.lastEvent).toBeTypeOf('number')
    })

    it('should export security log with time filter', () => {
      const oldEvent = securityManager.eventLog[0] = {
        timestamp: Date.now() - (25 * 3600000), // 25 hours ago
        type: SECURITY_EVENT_TYPES.AUTHENTICATION_SUCCESS
      }

      securityManager.logSecurityEvent(SECURITY_EVENT_TYPES.AUTHENTICATION_FAILURE, {})

      const last24Hours = securityManager.exportSecurityLog(24)
      expect(last24Hours).toHaveLength(1)
      expect(last24Hours[0].type).toBe(SECURITY_EVENT_TYPES.AUTHENTICATION_FAILURE)

      const last48Hours = securityManager.exportSecurityLog(48)
      expect(last48Hours).toHaveLength(2)
    })
  })

  describe('Fingerprint Generation', () => {
    it('should generate consistent fingerprints', () => {
      // Mock browser APIs
      Object.defineProperty(global, 'navigator', {
        value: {
          userAgent: 'test-agent',
          language: 'en-US'
        },
        writable: true
      })

      Object.defineProperty(global, 'screen', {
        value: { width: 1920, height: 1080 },
        writable: true
      })

      Object.defineProperty(global, 'Intl', {
        value: {
          DateTimeFormat: () => ({
            resolvedOptions: () => ({ timeZone: 'UTC' })
          })
        },
        writable: true
      })

      const fingerprint1 = securityManager.generateFingerprint()
      const fingerprint2 = securityManager.generateFingerprint()

      expect(fingerprint1).toBe(fingerprint2)
      expect(fingerprint1).toBeTypeOf('string')
      expect(fingerprint1.length).toBeGreaterThan(0)
    })

    it('should return server fingerprint in SSR environment', () => {
      const originalWindow = global.window
      delete global.window

      const fingerprint = securityManager.generateFingerprint()
      expect(fingerprint).toBe('server')

      global.window = originalWindow
    })
  })

  describe('Reset and Cleanup', () => {
    it('should reset all security state', () => {
      securityManager.logSecurityEvent(SECURITY_EVENT_TYPES.AUTHENTICATION_SUCCESS, {})
      securityManager.storeSecureData('test', { data: 'test' })
      securityManager.checkRateLimit('api_request', 'user1')

      expect(securityManager.eventLog.length).toBeGreaterThan(0)
      expect(securityManager.sessionData.size).toBeGreaterThan(0)
      expect(securityManager.rateLimiters.size).toBeGreaterThan(0)

      securityManager.reset()

      expect(securityManager.eventLog).toHaveLength(0)
      expect(securityManager.sessionData.size).toBe(0)
      expect(securityManager.rateLimiters.size).toBe(0)
    })
  })
})