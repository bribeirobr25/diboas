/**
 * Enhanced Security Manager for diBoaS Platform
 * Implements comprehensive security framework with subdomain-specific policies
 */

import { 
  detectCurrentSubdomain, 
  getSubdomainSecurityPolicy,
  SUBDOMAINS 
} from '../config/subdomains.js'
import { getCurrentEnvironment } from '../config/environments.js'
import logger from '../utils/logger'

/**
 * Security event types for monitoring and logging
 */
export const SECURITY_EVENT_TYPES = {
  AUTHENTICATION_SUCCESS: 'auth_success',
  AUTHENTICATION_FAILURE: 'auth_failure',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  CREDENTIAL_ACCESS: 'credential_access',
  SECURITY_VIOLATION: 'security_violation',
  CSP_VIOLATION: 'csp_violation',
  SESSION_HIJACK_ATTEMPT: 'session_hijack_attempt',
  FINANCIAL_OPERATION: 'financial_operation',
  DATA_BREACH_ATTEMPT: 'data_breach_attempt'
}

/**
 * Security levels for different operations
 */
export const SECURITY_LEVELS = {
  PUBLIC: 'public',
  AUTHENTICATED: 'authenticated', 
  FINANCIAL: 'financial',
  ADMINISTRATIVE: 'administrative'
}

/**
 * Main Security Manager class
 */
export class SecurityManager {
  constructor() {
    this.currentSubdomain = detectCurrentSubdomain()
    this.environment = getCurrentEnvironment()
    this.securityPolicy = getSubdomainSecurityPolicy(this.currentSubdomain)
    this.eventLog = []
    this.sessionData = new Map()
    this.rateLimiters = new Map()
    
    this.initializeSecurity()
  }

  /**
   * Initialize security framework
   */
  initializeSecurity() {
    this.setupCSPMonitoring()
    this.setupSessionSecurity()
    this.setupMemoryClearing()
    this.setupSecurityHeaders()
    
    // Log security initialization
    this.logSecurityEvent(SECURITY_EVENT_TYPES.AUTHENTICATION_SUCCESS, {
      action: 'security_manager_initialized',
      subdomain: this.currentSubdomain,
      environment: this.environment
    })
  }

  /**
   * Content Security Policy monitoring
   */
  setupCSPMonitoring() {
    if (typeof document !== 'undefined') {
      document.addEventListener('securitypolicyviolation', (event) => {
        this.logSecurityEvent(SECURITY_EVENT_TYPES.CSP_VIOLATION, {
          violatedDirective: event.violatedDirective,
          blockedURI: event.blockedURI,
          sourceFile: event.sourceFile,
          lineNumber: event.lineNumber,
          severity: 'high'
        })
      })
    }
  }

  /**
   * Session security monitoring
   */
  setupSessionSecurity() {
    if (typeof window !== 'undefined') {
      // Monitor for session hijacking attempts
      const originalFingerprint = this.generateFingerprint()
      
      setInterval(() => {
        const currentFingerprint = this.generateFingerprint()
        if (currentFingerprint !== originalFingerprint) {
          this.logSecurityEvent(SECURITY_EVENT_TYPES.SESSION_HIJACK_ATTEMPT, {
            originalFingerprint,
            currentFingerprint,
            severity: 'critical'
          })
        }
      }, 60000) // Check every minute
    }
  }

  /**
   * Generate browser fingerprint for session security
   */
  generateFingerprint() {
    if (typeof window === 'undefined') return 'server'
    
    let canvasFingerprint = 'not_available'
    try {
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.textBaseline = 'top'
        ctx.font = '14px Arial'
        ctx.fillText('Browser fingerprint', 2, 2)
        canvasFingerprint = canvas.toDataURL()
      }
    } catch (error) {
      // Canvas not available in test environment
      canvasFingerprint = 'canvas_not_available'
    }
    
    return btoa(JSON.stringify({
      userAgent: navigator?.userAgent || 'unknown',
      language: navigator?.language || 'unknown',
      timezone: Intl?.DateTimeFormat?.().resolvedOptions?.().timeZone || 'unknown',
      screen: typeof screen !== 'undefined' ? `${screen.width}x${screen.height}` : 'unknown',
      canvas: canvasFingerprint
    }))
  }

  /**
   * Memory clearing for sensitive data
   */
  setupMemoryClearing() {
    // Clear sensitive data on page unload
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        this.clearSensitiveMemory()
      })
      
      // Clear sensitive data periodically
      setInterval(() => {
        this.clearExpiredSensitiveData()
      }, 300000) // Every 5 minutes
    }
  }

  /**
   * Clear sensitive data from memory
   */
  clearSensitiveMemory() {
    // Clear session storage
    if (typeof sessionStorage !== 'undefined') {
      const sensitiveKeys = ['authToken', 'privateKey', 'encryptionKey', 'balance']
      sensitiveKeys.forEach(key => {
        if (sessionStorage.getItem(key)) {
          sessionStorage.removeItem(key)
        }
      })
    }
    
    // Clear variables in memory
    this.sessionData.clear()
    
    this.logSecurityEvent(SECURITY_EVENT_TYPES.FINANCIAL_OPERATION, {
      action: 'memory_cleared',
      timestamp: Date.now()
    })
  }

  /**
   * Clear expired sensitive data
   */
  clearExpiredSensitiveData() {
    const now = Date.now()
    
    for (const [key, data] of this.sessionData.entries()) {
      if (data.timestamp && data.ttl && (now - data.timestamp) > data.ttl) {
        this.sessionData.delete(key)
      }
    }
  }

  /**
   * Setup security headers
   */
  setupSecurityHeaders() {
    if (typeof document !== 'undefined') {
      // Create and add security meta tags
      const securityHeaders = [
        { name: 'X-Content-Type-Options', content: 'nosniff' },
        { name: 'X-Frame-Options', content: this.securityPolicy.frameOptions || 'DENY' },
        { name: 'X-XSS-Protection', content: '1; mode=block' },
        { name: 'Referrer-Policy', content: this.securityPolicy.referrerPolicy },
        { name: 'Permissions-Policy', content: 'geolocation=(), microphone=(), camera=()' }
      ]

      securityHeaders.forEach(header => {
        let meta = document.querySelector(`meta[http-equiv="${header.name}"]`)
        if (!meta) {
          meta = document.createElement('meta')
          meta.setAttribute('http-equiv', header.name)
          document.head.appendChild(meta)
        }
        meta.setAttribute('content', header.content)
      })
    }
  }

  /**
   * Rate limiting with subdomain-specific rules
   */
  checkRateLimit(operation, identifier = 'default') {
    const key = `${this.currentSubdomain}:${operation}:${identifier}`
    const now = Date.now()
    
    if (!this.rateLimiters.has(key)) {
      this.rateLimiters.set(key, {
        requests: [],
        blocked: false,
        blockedUntil: 0
      })
    }
    
    const limiter = this.rateLimiters.get(key)
    
    // Check if currently blocked
    if (limiter.blocked && now < limiter.blockedUntil) {
      this.logSecurityEvent(SECURITY_EVENT_TYPES.RATE_LIMIT_EXCEEDED, {
        operation,
        identifier,
        subdomain: this.currentSubdomain,
        blockedUntil: limiter.blockedUntil
      })
      return false
    }
    
    // Clean old requests
    limiter.requests = limiter.requests.filter(time => (now - time) < 60000) // 1 minute window
    
    // Get rate limits based on operation and subdomain
    const limits = this.getRateLimits(operation)
    
    if (limiter.requests.length >= limits.maxRequests) {
      limiter.blocked = true
      limiter.blockedUntil = now + limits.blockDuration
      
      this.logSecurityEvent(SECURITY_EVENT_TYPES.RATE_LIMIT_EXCEEDED, {
        operation,
        identifier,
        requestCount: limiter.requests.length,
        maxRequests: limits.maxRequests,
        severity: 'medium'
      })
      
      return false
    }
    
    limiter.requests.push(now)
    return true
  }

  /**
   * Get rate limits based on operation and subdomain
   */
  getRateLimits(operation) {
    const baseLimits = {
      'financial_transaction': { maxRequests: 10, blockDuration: 300000 }, // 10 per minute, 5min block
      'authentication': { maxRequests: 5, blockDuration: 900000 }, // 5 per minute, 15min block
      'api_request': { maxRequests: 100, blockDuration: 60000 }, // 100 per minute, 1min block
      'data_access': { maxRequests: 50, blockDuration: 120000 } // 50 per minute, 2min block
    }
    
    // Subdomain-specific adjustments
    const subdomainMultipliers = {
      [SUBDOMAINS.APP]: 1.0,
      [SUBDOMAINS.API]: 2.0,
      [SUBDOMAINS.WWW]: 0.5
    }
    
    const multiplier = subdomainMultipliers[this.currentSubdomain] || 1.0
    const baseLimit = baseLimits[operation] || baseLimits.api_request
    
    return {
      maxRequests: Math.floor(baseLimit.maxRequests * multiplier),
      blockDuration: baseLimit.blockDuration
    }
  }

  /**
   * Validate financial operation security
   */
  validateFinancialOperation(operation) {
    // Check rate limiting
    if (!this.checkRateLimit('financial_transaction', operation.userId)) {
      throw new Error('Rate limit exceeded for financial operations')
    }
    
    // Validate operation amount
    if (operation.amount && (operation.amount <= 0 || operation.amount > 1000000)) {
      this.logSecurityEvent(SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY, {
        operation: operation.type,
        amount: operation.amount,
        userId: operation.userId,
        severity: 'high'
      })
      throw new Error('Invalid transaction amount')
    }
    
    // Validate asset types
    const allowedAssets = ['USD', 'BTC', 'ETH', 'SOL', 'SUI', 'USDC']
    if (operation.asset && !allowedAssets.includes(operation.asset)) {
      this.logSecurityEvent(SECURITY_EVENT_TYPES.SECURITY_VIOLATION, {
        operation: operation.type,
        invalidAsset: operation.asset,
        severity: 'medium'
      })
      throw new Error('Invalid asset type')
    }
    
    this.logSecurityEvent(SECURITY_EVENT_TYPES.FINANCIAL_OPERATION, {
      operation: operation.type,
      amount: operation.amount,
      asset: operation.asset,
      userId: operation.userId
    })
    
    return true
  }

  /**
   * Secure credential storage and retrieval
   */
  storeSecureData(key, data, ttl = 900000) { // 15 minutes default TTL
    const encrypted = this.encryptData(data)
    this.sessionData.set(key, {
      data: encrypted,
      timestamp: Date.now(),
      ttl
    })
    
    this.logSecurityEvent(SECURITY_EVENT_TYPES.CREDENTIAL_ACCESS, {
      action: 'store',
      key: this.hashKey(key)
    })
  }

  /**
   * Retrieve secure data
   */
  getSecureData(key) {
    const stored = this.sessionData.get(key)
    if (!stored) return null
    
    const now = Date.now()
    if (stored.timestamp + stored.ttl < now) {
      this.sessionData.delete(key)
      return null
    }
    
    this.logSecurityEvent(SECURITY_EVENT_TYPES.CREDENTIAL_ACCESS, {
      action: 'retrieve',
      key: this.hashKey(key)
    })
    
    return this.decryptData(stored.data)
  }

  /**
   * Simple encryption for sensitive data (in production, use proper encryption)
   */
  encryptData(data) {
    // In production, use proper encryption like AES
    return btoa(JSON.stringify(data))
  }

  /**
   * Simple decryption for sensitive data
   */
  decryptData(encrypted) {
    try {
      return JSON.parse(atob(encrypted))
    } catch (error) {
      this.logSecurityEvent(SECURITY_EVENT_TYPES.SECURITY_VIOLATION, {
        action: 'decryption_failed',
        error: error.message
      })
      return null
    }
  }

  /**
   * Hash key for logging (don't log actual keys)
   */
  hashKey(key) {
    // Simple hash for logging purposes
    let hash = 0
    for (let i = 0; i < key.length; i++) {
      const char = key.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return hash.toString(16)
  }

  /**
   * Log security events
   */
  logSecurityEvent(type, data) {
    const event = {
      id: `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type,
      timestamp: Date.now(),
      subdomain: this.currentSubdomain,
      environment: this.environment,
      data: { ...data }
    }
    
    this.eventLog.push(event)
    
    // Keep only last 1000 events to prevent memory issues
    if (this.eventLog.length > 1000) {
      this.eventLog = this.eventLog.slice(-1000)
    }
    
    // In development, log to console
    if (this.environment === 'development' && event.data?.severity) {
      const severityColors = {
        low: '\x1b[32m',      // Green
        medium: '\x1b[33m',   // Yellow
        high: '\x1b[31m',     // Red
        critical: '\x1b[35m'  // Magenta
      }
      
      const color = severityColors[event.data.severity] || '\x1b[0m'
      logger.debug(`${color}[SECURITY ${event.data.severity?.toUpperCase()}] ${type}:`, event.data, '\x1b[0m')
    }
  }

  /**
   * Get security metrics for monitoring
   */
  getSecurityMetrics() {
    const recentEvents = this.eventLog.filter(event => 
      (Date.now() - event.timestamp) < 3600000 // Last hour
    )
    
    const eventCounts = recentEvents.reduce((counts, event) => {
      counts[event.type] = (counts[event.type] || 0) + 1
      return counts
    }, {})
    
    const severityCounts = recentEvents.reduce((counts, event) => {
      const severity = event.data?.severity || 'low'
      counts[severity] = (counts[severity] || 0) + 1
      return counts
    }, {})
    
    return {
      totalEvents: recentEvents.length,
      eventTypes: eventCounts,
      severityBreakdown: severityCounts,
      rateLimitersActive: this.rateLimiters.size,
      secureDataStored: this.sessionData.size,
      lastEvent: this.eventLog[this.eventLog.length - 1]?.timestamp || null
    }
  }

  /**
   * Export security log for analysis
   */
  exportSecurityLog(hours = 24) {
    const cutoff = Date.now() - (hours * 3600000)
    return this.eventLog.filter(event => event.timestamp >= cutoff)
  }

  /**
   * Reset security state (for testing)
   */
  reset() {
    this.eventLog = []
    this.sessionData.clear()
    this.rateLimiters.clear()
  }
}

// Global security manager instance
export const securityManager = new SecurityManager()

// Convenience functions
export const logSecurityEvent = (type, data) => securityManager.logSecurityEvent(type, data)
export const checkRateLimit = (operation, identifier) => securityManager.checkRateLimit(operation, identifier)
export const validateFinancialOperation = (operation) => securityManager.validateFinancialOperation(operation)
export const storeSecureData = (key, data, ttl) => securityManager.storeSecureData(key, data, ttl)
export const getSecureData = (key) => securityManager.getSecureData(key)
export const getSecurityMetrics = () => securityManager.getSecurityMetrics()