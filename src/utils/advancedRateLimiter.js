/**
 * Advanced Rate Limiting System for diBoaS FinTech Application
 * Implements multiple rate limiting strategies with security focus
 */

import secureLogger from './secureLogger.js'

/**
 * Rate limiting tiers based on operation sensitivity
 */
export const RATE_LIMIT_TIERS = {
  // Authentication operations - most restrictive
  AUTH: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 minutes block
    name: 'authentication'
  },
  
  // Financial transactions - highly restrictive
  TRANSACTION: {
    maxRequests: 10,
    windowMs: 5 * 60 * 1000, // 5 minutes
    blockDurationMs: 15 * 60 * 1000, // 15 minutes block
    name: 'transaction'
  },
  
  // Password operations - very restrictive
  PASSWORD: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 hour
    blockDurationMs: 2 * 60 * 60 * 1000, // 2 hours block
    name: 'password'
  },
  
  // Balance queries - moderate
  BALANCE: {
    maxRequests: 30,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 5 * 60 * 1000, // 5 minutes block
    name: 'balance'
  },
  
  // General API calls - least restrictive
  GENERAL: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    blockDurationMs: 2 * 60 * 1000, // 2 minutes block
    name: 'general'
  }
}

/**
 * Advanced Rate Limiter with multiple strategies
 */
export class AdvancedRateLimiter {
  constructor() {
    this.requests = new Map() // Track requests by identifier
    this.blocked = new Map()  // Track blocked identifiers
    this.violations = new Map() // Track security violations
    
    // Clean up old data every 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanup()
    }, 5 * 60 * 1000)
  }

  /**
   * Check if request is allowed with detailed tracking
   */
  isAllowed(identifier, tier = RATE_LIMIT_TIERS.GENERAL, context = {}) {
    const now = Date.now()
    const key = `${identifier}:${tier.name}`
    
    // Check if identifier is currently blocked
    if (this.isBlocked(key)) {
      this.recordViolation(identifier, 'BLOCKED_REQUEST_ATTEMPT', {
        tier: tier.name,
        ...context
      })
      return {
        allowed: false,
        reason: 'BLOCKED',
        retryAfter: this.getBlockRemainingTime(key),
        violations: this.violations.get(identifier) || 0
      }
    }

    // Get request history
    const userRequests = this.requests.get(key) || []
    
    // Remove old requests outside the window
    const validRequests = userRequests.filter(
      request => now - request.timestamp < tier.windowMs
    )

    // Check rate limit
    if (validRequests.length >= tier.maxRequests) {
      // Block the identifier
      this.blockIdentifier(key, tier.blockDurationMs)
      
      // Record rate limit violation
      this.recordViolation(identifier, 'RATE_LIMIT_EXCEEDED', {
        tier: tier.name,
        requests: validRequests.length,
        maxRequests: tier.maxRequests,
        windowMs: tier.windowMs,
        ...context
      })

      return {
        allowed: false,
        reason: 'RATE_LIMIT_EXCEEDED',
        retryAfter: tier.blockDurationMs,
        violations: this.violations.get(identifier) || 0
      }
    }

    // Add current request
    validRequests.push({
      timestamp: now,
      context: { ...context }
    })
    this.requests.set(key, validRequests)

    return {
      allowed: true,
      remaining: tier.maxRequests - validRequests.length,
      resetTime: now + tier.windowMs,
      violations: this.violations.get(identifier) || 0
    }
  }

  /**
   * Block an identifier for a specific duration
   */
  blockIdentifier(key, durationMs) {
    const now = Date.now()
    this.blocked.set(key, {
      blockedAt: now,
      unblockAt: now + durationMs,
      duration: durationMs
    })

    secureLogger.audit('IDENTIFIER_BLOCKED', {
      key,
      duration: durationMs,
      blockedUntil: new Date(now + durationMs).toISOString()
    })
  }

  /**
   * Check if identifier is currently blocked
   */
  isBlocked(key) {
    const blockInfo = this.blocked.get(key)
    if (!blockInfo) return false

    const now = Date.now()
    if (now >= blockInfo.unblockAt) {
      this.blocked.delete(key)
      return false
    }

    return true
  }

  /**
   * Get remaining block time in milliseconds
   */
  getBlockRemainingTime(key) {
    const blockInfo = this.blocked.get(key)
    if (!blockInfo) return 0

    const now = Date.now()
    return Math.max(0, blockInfo.unblockAt - now)
  }

  /**
   * Record security violation
   */
  recordViolation(identifier, violationType, details = {}) {
    const violations = this.violations.get(identifier) || 0
    this.violations.set(identifier, violations + 1)

    secureLogger.audit('RATE_LIMIT_VIOLATION', {
      identifier,
      violationType,
      violationCount: violations + 1,
      timestamp: new Date().toISOString(),
      ...details
    })

    // Auto-escalate if too many violations
    if (violations >= 10) {
      this.escalateSecurityThreat(identifier, violations + 1)
    }
  }

  /**
   * Escalate security threat for repeated violators
   */
  escalateSecurityThreat(identifier, violationCount) {
    // Block for extended period
    const extendedBlockTime = 24 * 60 * 60 * 1000 // 24 hours
    
    Object.values(RATE_LIMIT_TIERS).forEach(tier => {
      const key = `${identifier}:${tier.name}`
      this.blockIdentifier(key, extendedBlockTime)
    })

    secureLogger.audit('SECURITY_THREAT_ESCALATED', {
      identifier,
      violationCount,
      blockDuration: extendedBlockTime,
      escalatedAt: new Date().toISOString()
    })
  }

  /**
   * Manually unblock an identifier (admin function)
   */
  unblockIdentifier(identifier) {
    Object.values(RATE_LIMIT_TIERS).forEach(tier => {
      const key = `${identifier}:${tier.name}`
      this.blocked.delete(key)
    })

    secureLogger.audit('IDENTIFIER_UNBLOCKED', {
      identifier,
      unblockedAt: new Date().toISOString()
    })
  }

  /**
   * Get rate limit status for identifier
   */
  getStatus(identifier, tier = RATE_LIMIT_TIERS.GENERAL) {
    const key = `${identifier}:${tier.name}`
    const now = Date.now()
    
    const userRequests = this.requests.get(key) || []
    const validRequests = userRequests.filter(
      request => now - request.timestamp < tier.windowMs
    )

    // const blockInfo = this.blocked.get(key) // Removed unused variable
    const violations = this.violations.get(identifier) || 0

    return {
      identifier,
      tier: tier.name,
      requests: validRequests.length,
      maxRequests: tier.maxRequests,
      remaining: Math.max(0, tier.maxRequests - validRequests.length),
      resetTime: now + tier.windowMs,
      isBlocked: this.isBlocked(key),
      blockRemainingTime: this.getBlockRemainingTime(key),
      violations,
      windowMs: tier.windowMs
    }
  }

  /**
   * Clean up old data
   */
  cleanup() {
    const now = Date.now()
    
    // Clean old requests
    for (const [key, requests] of this.requests.entries()) {
      const tier = this.getTierFromKey(key)
      if (tier) {
        const validRequests = requests.filter(
          request => now - request.timestamp < tier.windowMs
        )
        
        if (validRequests.length === 0) {
          this.requests.delete(key)
        } else {
          this.requests.set(key, validRequests)
        }
      }
    }

    // Clean expired blocks
    for (const [key, blockInfo] of this.blocked.entries()) {
      if (now >= blockInfo.unblockAt) {
        this.blocked.delete(key)
      }
    }

    // Clean old violations (keep for 24 hours)
    // const violationRetentionTime = 24 * 60 * 60 * 1000 // Removed unused variable
    for (const [_identifier, _] of this.violations.entries()) {
      // For simplicity, we'll keep all violations
      // In production, you might want to implement time-based cleanup
    }
  }

  /**
   * Get tier from key
   */
  getTierFromKey(key) {
    const tierName = key.split(':')[1]
    return Object.values(RATE_LIMIT_TIERS).find(tier => tier.name === tierName)
  }

  /**
   * Get comprehensive security report
   */
  getSecurityReport() {
    const now = Date.now()
    
    return {
      timestamp: new Date().toISOString(),
      activeBlocks: this.blocked.size,
      totalViolations: Array.from(this.violations.values()).reduce((sum, count) => sum + count, 0),
      uniqueViolators: this.violations.size,
      blockDetails: Array.from(this.blocked.entries()).map(([key, blockInfo]) => ({
        key,
        remainingTime: blockInfo.unblockAt - now,
        duration: blockInfo.duration
      })),
      topViolators: Array.from(this.violations.entries())
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([identifier, count]) => ({ identifier, violationCount: count }))
    }
  }

  /**
   * Destroy the rate limiter and clean up
   */
  destroy() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.requests.clear()
    this.blocked.clear()
    this.violations.clear()
  }
}

// Create global rate limiter instance
export const rateLimiter = new AdvancedRateLimiter()

// Convenience functions for common operations
export const checkAuthRateLimit = (identifier, context) => 
  rateLimiter.isAllowed(identifier, RATE_LIMIT_TIERS.AUTH, context)

export const checkTransactionRateLimit = (identifier, context) => 
  rateLimiter.isAllowed(identifier, RATE_LIMIT_TIERS.TRANSACTION, context)

export const checkPasswordRateLimit = (identifier, context) => 
  rateLimiter.isAllowed(identifier, RATE_LIMIT_TIERS.PASSWORD, context)

export const checkBalanceRateLimit = (identifier, context) => 
  rateLimiter.isAllowed(identifier, RATE_LIMIT_TIERS.BALANCE, context)

export const checkGeneralRateLimit = (identifier, context) => 
  rateLimiter.isAllowed(identifier, RATE_LIMIT_TIERS.GENERAL, context)

export default rateLimiter