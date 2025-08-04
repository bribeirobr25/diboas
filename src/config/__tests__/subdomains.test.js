import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import {
  SUBDOMAINS,
  detectCurrentSubdomain,
  getDomainConfig,
  buildSubdomainUrl,
  isRouteValidForSubdomain,
  getSubdomainSecurityPolicy,
  getSubdomainPerformanceConfig,
  initializeSubdomainConfig
} from '../subdomains.js'

// Mock window.location
const mockLocation = {
  hostname: 'localhost',
  pathname: '/',
  href: 'http://localhost:5173/'
}

Object.defineProperty(window, 'location', {
  value: mockLocation,
  writable: true
})

describe('Subdomain Configuration', () => {
  beforeEach(() => {
    // Reset location mock
    mockLocation.hostname = 'localhost'
    mockLocation.pathname = '/'
    mockLocation.href = 'http://localhost:5173/'
    
    // Clear environment variables
    vi.unstubAllEnvs()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('detectCurrentSubdomain', () => {
    it('should detect www subdomain in production', () => {
      mockLocation.hostname = 'www.diboas.com'
      vi.stubEnv('VITE_APP_ENV', 'production')
      
      const subdomain = detectCurrentSubdomain()
      expect(subdomain).toBe(SUBDOMAINS.WWW)
    })

    it('should detect app subdomain in production', () => {
      mockLocation.hostname = 'app.diboas.com'
      vi.stubEnv('VITE_APP_ENV', 'production')
      
      const subdomain = detectCurrentSubdomain()
      expect(subdomain).toBe(SUBDOMAINS.APP)
    })

    it('should default to app subdomain for development', () => {
      mockLocation.hostname = 'localhost'
      mockLocation.pathname = '/app'
      vi.stubEnv('VITE_APP_ENV', 'development')
      
      const subdomain = detectCurrentSubdomain()
      expect(subdomain).toBe(SUBDOMAINS.APP)
    })

    it('should detect www for landing page in development', () => {
      mockLocation.hostname = 'localhost'
      mockLocation.pathname = '/'
      vi.stubEnv('VITE_APP_ENV', 'development')
      
      const subdomain = detectCurrentSubdomain()
      expect(subdomain).toBe(SUBDOMAINS.WWW)
    })
  })

  describe('getDomainConfig', () => {
    it('should return development config by default', () => {
      const config = getDomainConfig('development')
      expect(config.baseDomain).toBe('localhost')
      expect(config.protocol).toBe('http')
      expect(config.port).toBe(5173)
    })

    it('should return production config', () => {
      const config = getDomainConfig('production')
      expect(config.baseDomain).toBe('diboas.com')
      expect(config.protocol).toBe('https')
      expect(config.port).toBeUndefined()
    })

    it('should fallback to development for unknown environment', () => {
      const config = getDomainConfig('unknown')
      expect(config.baseDomain).toBe('localhost')
    })
  })

  describe('buildSubdomainUrl', () => {
    it('should build correct URL for development', () => {
      const url = buildSubdomainUrl(SUBDOMAINS.APP, '/dashboard', 'development')
      expect(url).toBe('http://localhost:5173/dashboard')
    })

    it('should build correct URL for production', () => {
      const url = buildSubdomainUrl(SUBDOMAINS.APP, '/dashboard', 'production')
      expect(url).toBe('https://app.diboas.com/dashboard')
    })

    it('should handle empty path', () => {
      const url = buildSubdomainUrl(SUBDOMAINS.WWW, '', 'production')
      expect(url).toBe('https://www.diboas.com/')
    })

    it('should handle path without leading slash', () => {
      const url = buildSubdomainUrl(SUBDOMAINS.API, 'users', 'production')
      expect(url).toBe('https://api.diboas.com/users')
    })

    it('should handle regional domains', () => {
      const url = buildSubdomainUrl(SUBDOMAINS.APP, '/dashboard', 'production', 'eu-west-1')
      expect(url).toBe('https://app-eu.diboas.com/dashboard')
    })
  })

  describe('isRouteValidForSubdomain', () => {
    it('should validate www routes correctly', () => {
      expect(isRouteValidForSubdomain('/', SUBDOMAINS.WWW)).toBe(true)
      expect(isRouteValidForSubdomain('/auth', SUBDOMAINS.WWW)).toBe(true)
      expect(isRouteValidForSubdomain('/app', SUBDOMAINS.WWW)).toBe(false)
    })

    it('should validate app routes correctly', () => {
      expect(isRouteValidForSubdomain('/app', SUBDOMAINS.APP)).toBe(true)
      expect(isRouteValidForSubdomain('/account', SUBDOMAINS.APP)).toBe(true)
      expect(isRouteValidForSubdomain('/category/banking', SUBDOMAINS.APP)).toBe(true)
      expect(isRouteValidForSubdomain('/', SUBDOMAINS.APP)).toBe(false)
    })

    it('should handle wildcard routes', () => {
      expect(isRouteValidForSubdomain('/category/banking', SUBDOMAINS.APP)).toBe(true)
      expect(isRouteValidForSubdomain('/category/investment', SUBDOMAINS.APP)).toBe(true)
      expect(isRouteValidForSubdomain('/yield/configure', SUBDOMAINS.APP)).toBe(true)
    })
  })

  describe('getSubdomainSecurityPolicy', () => {
    it('should return appropriate security policy for www subdomain', () => {
      const policy = getSubdomainSecurityPolicy(SUBDOMAINS.WWW)
      expect(policy.csp['default-src']).toContain("'self'")
      expect(policy.hsts).toContain('max-age=31536000')
      expect(policy.referrerPolicy).toBe('strict-origin-when-cross-origin')
    })

    it('should return strict security policy for app subdomain', () => {
      const policy = getSubdomainSecurityPolicy(SUBDOMAINS.APP)
      expect(policy.csp['frame-ancestors']).toContain("'none'")
      expect(policy.frameOptions).toBe('DENY')
      expect(policy.referrerPolicy).toBe('same-origin')
    })

    it('should return minimal policy for API subdomain', () => {
      const policy = getSubdomainSecurityPolicy(SUBDOMAINS.API)
      expect(policy.csp['default-src']).toContain("'none'")
      expect(policy.frameOptions).toBe('DENY')
    })
  })

  describe('getSubdomainPerformanceConfig', () => {
    it('should return appropriate performance config for each subdomain', () => {
      const wwwConfig = getSubdomainPerformanceConfig(SUBDOMAINS.WWW)
      const appConfig = getSubdomainPerformanceConfig(SUBDOMAINS.APP)
      
      expect(wwwConfig.cacheStrategy).toBe('marketing')
      expect(appConfig.cacheStrategy).toBe('aggressive')
      
      expect(appConfig.performanceBudget.initialBundle).toBe('300KB')
      expect(wwwConfig.performanceBudget.initialBundle).toBe('400KB')
    })

    it('should enable service worker for all subdomains', () => {
      const config = getSubdomainPerformanceConfig(SUBDOMAINS.APP)
      expect(config.serviceWorkerEnabled).toBe(true)
    })
  })

  describe('initializeSubdomainConfig', () => {
    it('should initialize subdomain configuration correctly', () => {
      const config = initializeSubdomainConfig()
      
      expect(config.subdomain).toBeDefined()
      expect(config.security).toBeDefined()
      expect(config.performance).toBeDefined()
      expect(config.security.csp).toBeDefined()
      expect(config.performance.cacheStrategy).toBeDefined()
    })

    it('should set meta tags for security policies', () => {
      // Mock document.head and querySelector
      const mockMeta = document.createElement('meta')
      const mockHead = {
        appendChild: vi.fn()
      }
      const mockQuerySelector = vi.fn().mockReturnValue(null)
      
      Object.defineProperty(document, 'head', {
        value: mockHead,
        writable: true
      })
      Object.defineProperty(document, 'querySelector', {
        value: mockQuerySelector,
        writable: true
      })
      Object.defineProperty(document, 'createElement', {
        value: vi.fn().mockReturnValue(mockMeta),
        writable: true
      })

      initializeSubdomainConfig()
      
      expect(mockQuerySelector).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should handle unknown subdomain gracefully', () => {
      const policy = getSubdomainSecurityPolicy('unknown')
      expect(policy).toBeDefined()
      expect(policy.csp).toBeDefined()
    })

    it('should handle SSR environment (no window)', () => {
      const originalWindow = global.window
      delete global.window
      
      const subdomain = detectCurrentSubdomain()
      expect(subdomain).toBe(SUBDOMAINS.APP)
      
      global.window = originalWindow
    })

    it('should build URL with fallback for unknown subdomain', () => {
      const url = buildSubdomainUrl('unknown', '/test', 'production')
      expect(url).toBe('https://app.diboas.com/test')
    })
  })
})