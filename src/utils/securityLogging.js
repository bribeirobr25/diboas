/**
 * Security Event Logging
 * Secure logging for sensitive operations and security events
 */

import { generateSecureId } from './security.js'

/**
 * Security event types
 */
export const SECURITY_EVENT_TYPES = {
  TRANSACTION_INITIATED: 'transaction_initiated',
  TRANSACTION_COMPLETED: 'transaction_completed',
  TRANSACTION_FAILED: 'transaction_failed',
  AUTHENTICATION_SUCCESS: 'auth_success',
  AUTHENTICATION_FAILED: 'auth_failed',
  TWO_FA_REQUESTED: 'twofa_requested',
  TWO_FA_VERIFIED: 'twofa_verified',
  TWO_FA_FAILED: 'twofa_failed',
  KYC_INITIATED: 'kyc_initiated',
  KYC_COMPLETED: 'kyc_completed',
  WALLET_CREATED: 'wallet_created',
  WALLET_ACCESSED: 'wallet_accessed',
  PROVIDER_FAILURE: 'provider_failure',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  DATA_ACCESS: 'data_access',
  CONFIGURATION_CHANGED: 'config_changed'
}

/**
 * Security event logger
 */
class SecurityLogger {
  constructor() {
    this.events = []
    this.maxEvents = 1000
    this.sensitiveFields = new Set([
      'password', 'token', 'key', 'secret', 'privateKey', 
      'mnemonic', 'seed', 'pin', 'ssn', 'creditCard'
    ])
  }

  /**
   * Log a security event
   */
  log(eventType, data = {}, metadata = {}) {
    const event = {
      id: generateSecureId('evt'),
      type: eventType,
      timestamp: new Date().toISOString(),
      data: this.sanitizeData(data),
      metadata: {
        ...metadata,
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        timestamp: Date.now()
      }
    }

    // Add to in-memory store
    this.events.push(event)
    
    // Keep only recent events in memory
    if (this.events.length > this.maxEvents) {
      this.events = this.events.slice(-this.maxEvents)
    }

    // Log to console in development
    if (import.meta.env.DEV) {
      const logLevel = this.getLogLevel(eventType)
      console[logLevel](`[SECURITY] ${eventType}:`, {
        id: event.id,
        data: event.data,
        timestamp: event.timestamp
      })
    }

    // Store in localStorage for persistence (development only)
    if (import.meta.env.DEV) {
      this.persistEvent(event)
    }

    // In production, this would send to a secure logging service
    if (import.meta.env.PROD) {
      this.sendToSecureLoggingService(event)
    }

    return event.id
  }

  /**
   * Sanitize sensitive data before logging
   */
  sanitizeData(data) {
    if (typeof data !== 'object' || data === null) {
      return data
    }

    const sanitized = {}
    
    for (const [key, value] of Object.entries(data)) {
      const lowerKey = key.toLowerCase()
      
      // Check if field contains sensitive information
      const isSensitive = this.sensitiveFields.has(lowerKey) || 
                         lowerKey.includes('password') ||
                         lowerKey.includes('token') ||
                         lowerKey.includes('key') ||
                         lowerKey.includes('secret')

      if (isSensitive) {
        sanitized[key] = '[REDACTED]'
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeData(value)
      } else if (typeof value === 'string' && value.length > 100) {
        // Truncate very long strings
        sanitized[key] = value.substring(0, 100) + '...'
      } else {
        sanitized[key] = value
      }
    }

    return sanitized
  }

  /**
   * Get appropriate log level for event type
   */
  getLogLevel(eventType) {
    const errorEvents = [
      SECURITY_EVENT_TYPES.TRANSACTION_FAILED,
      SECURITY_EVENT_TYPES.AUTHENTICATION_FAILED,
      SECURITY_EVENT_TYPES.TWO_FA_FAILED,
      SECURITY_EVENT_TYPES.PROVIDER_FAILURE,
      SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY
    ]

    const warnEvents = [
      SECURITY_EVENT_TYPES.RATE_LIMIT_EXCEEDED,
      SECURITY_EVENT_TYPES.KYC_INITIATED
    ]

    if (errorEvents.includes(eventType)) return 'error'
    if (warnEvents.includes(eventType)) return 'warn'
    return 'info'
  }

  /**
   * Persist event to localStorage (development only)
   */
  persistEvent(event) {
    try {
      const existingEvents = JSON.parse(localStorage.getItem('diboas_security_events') || '[]')
      existingEvents.push(event)
      
      // Keep only last 100 events
      const recentEvents = existingEvents.slice(-100)
      localStorage.setItem('diboas_security_events', JSON.stringify(recentEvents))
    } catch (error) {
      console.warn('Failed to persist security event:', error)
    }
  }

  /**
   * Send to secure logging service (production)
   */
  async sendToSecureLoggingService(event) {
    try {
      // In production, this would send to your secure logging infrastructure
      // For now, we'll just simulate the call
      
      const response = await fetch('/api/security/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getApiToken()}`
        },
        body: JSON.stringify(event)
      })

      if (!response.ok) {
        throw new Error(`Logging service returned ${response.status}`)
      }
    } catch (error) {
      // Fallback to console logging if service is unavailable
      console.error('Failed to send security event to logging service:', error)
      console.error('Event data:', event)
    }
  }

  /**
   * Get API token for logging service
   */
  getApiToken() {
    // In production, this would retrieve from secure storage
    return import.meta.env.VITE_LOGGING_API_TOKEN || 'dev-token'
  }

  /**
   * Get recent security events
   */
  getRecentEvents(limit = 50, eventType = null) {
    let filteredEvents = this.events

    if (eventType) {
      filteredEvents = this.events.filter(event => event.type === eventType)
    }

    return filteredEvents
      .slice(-limit)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  /**
   * Search events by criteria
   */
  searchEvents(criteria = {}) {
    const { eventType, userId, startTime, endTime, limit = 50 } = criteria
    
    let filteredEvents = this.events

    if (eventType) {
      filteredEvents = filteredEvents.filter(event => event.type === eventType)
    }

    if (userId) {
      filteredEvents = filteredEvents.filter(event => 
        event.data.userId === userId || event.metadata.userId === userId
      )
    }

    if (startTime) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.timestamp) >= new Date(startTime)
      )
    }

    if (endTime) {
      filteredEvents = filteredEvents.filter(event => 
        new Date(event.timestamp) <= new Date(endTime)
      )
    }

    return filteredEvents
      .slice(-limit)
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  }

  /**
   * Export events for analysis
   */
  exportEvents(format = 'json') {
    const data = {
      exportTimestamp: new Date().toISOString(),
      eventCount: this.events.length,
      events: this.events
    }

    if (format === 'json') {
      return JSON.stringify(data, null, 2)
    } else if (format === 'csv') {
      return this.convertToCSV(this.events)
    }

    throw new Error(`Unsupported export format: ${format}`)
  }

  /**
   * Convert events to CSV format
   */
  convertToCSV(events) {
    if (events.length === 0) return ''

    const headers = ['id', 'type', 'timestamp', 'data', 'metadata']
    const csvRows = [headers.join(',')]

    events.forEach(event => {
      const row = [
        event.id,
        event.type,
        event.timestamp,
        JSON.stringify(event.data).replace(/"/g, '""'),
        JSON.stringify(event.metadata).replace(/"/g, '""')
      ]
      csvRows.push(row.join(','))
    })

    return csvRows.join('\n')
  }

  /**
   * Clear all events (development only)
   */
  clearEvents() {
    if (import.meta.env.PROD) {
      throw new Error('Cannot clear events in production')
    }

    this.events = []
    localStorage.removeItem('diboas_security_events')
  }
}

// Singleton instance
const securityLogger = new SecurityLogger()

/**
 * Convenient logging function
 */
export function logSecureEvent(eventType, data = {}, metadata = {}) {
  return securityLogger.log(eventType, data, metadata)
}

/**
 * Specific logging functions for common events
 */
export const securityLog = {
  transactionInitiated: (transactionId, userId, amount, type) => 
    logSecureEvent(SECURITY_EVENT_TYPES.TRANSACTION_INITIATED, {
      transactionId, userId, amount, type
    }),

  transactionCompleted: (transactionId, userId, amount, type) =>
    logSecureEvent(SECURITY_EVENT_TYPES.TRANSACTION_COMPLETED, {
      transactionId, userId, amount, type
    }),

  transactionFailed: (transactionId, userId, amount, type, error) =>
    logSecureEvent(SECURITY_EVENT_TYPES.TRANSACTION_FAILED, {
      transactionId, userId, amount, type, error: error.message
    }),

  authSuccess: (userId, method) =>
    logSecureEvent(SECURITY_EVENT_TYPES.AUTHENTICATION_SUCCESS, {
      userId, method
    }),

  authFailed: (identifier, method, reason) =>
    logSecureEvent(SECURITY_EVENT_TYPES.AUTHENTICATION_FAILED, {
      identifier, method, reason
    }),

  twoFARequested: (userId, method) =>
    logSecureEvent(SECURITY_EVENT_TYPES.TWO_FA_REQUESTED, {
      userId, method
    }),

  twoFAVerified: (userId, method) =>
    logSecureEvent(SECURITY_EVENT_TYPES.TWO_FA_VERIFIED, {
      userId, method
    }),

  twoFAFailed: (userId, method, reason) =>
    logSecureEvent(SECURITY_EVENT_TYPES.TWO_FA_FAILED, {
      userId, method, reason
    }),

  walletCreated: (userId, walletType, address) =>
    logSecureEvent(SECURITY_EVENT_TYPES.WALLET_CREATED, {
      userId, walletType, address: address ? address.substring(0, 10) + '...' : null
    }),

  providerFailure: (providerId, operation, error) =>
    logSecureEvent(SECURITY_EVENT_TYPES.PROVIDER_FAILURE, {
      providerId, operation, error: error.message
    }),

  rateLimitExceeded: (identifier, operation) =>
    logSecureEvent(SECURITY_EVENT_TYPES.RATE_LIMIT_EXCEEDED, {
      identifier, operation
    }),

  suspiciousActivity: (userId, activity, details) =>
    logSecureEvent(SECURITY_EVENT_TYPES.SUSPICIOUS_ACTIVITY, {
      userId, activity, details
    })
}

export { securityLogger, SecurityLogger }
export default securityLogger