/**
 * FinTech Secure Logging Service
 * Provides production-safe logging with sensitive data protection
 */

import { getEnvironmentConfig, getCurrentEnvironment, ENV_TYPES } from '../config/environments.js'

/**
 * Sensitive data patterns to scrub from logs
 */
const SENSITIVE_PATTERNS = [
  // Credit card numbers (partial patterns for security)
  /\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g,
  // Social Security Numbers
  /\b\d{3}[-\s]?\d{2}[-\s]?\d{4}\b/g,
  // Email addresses (in some contexts)
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  // Phone numbers
  /\b\d{3}[-\s]?\d{3}[-\s]?\d{4}\b/g,
  // API keys and tokens
  /\b(api_key|token|secret|password|pwd)[\s]*[=:]\s*[\w\-._]+/gi,
  // Bank account numbers (basic pattern)
  /\b\d{8,17}\b/g
]

/**
 * Sensitive field names to scrub
 */
const SENSITIVE_FIELDS = [
  'password', 'pwd', 'secret', 'token', 'apiKey', 'api_key',
  'encryptionKey', 'privateKey', 'accountNumber', 'routingNumber',
  'ssn', 'socialSecurityNumber', 'creditCard', 'cvv', 'pin',
  'bankAccount', 'iban', 'swift'
]

/**
 * Log levels with numerical values for filtering
 */
export const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
}

/**
 * Audit event types for financial compliance
 */
export const AUDIT_EVENTS = {
  USER_LOGIN: 'USER_LOGIN',
  USER_LOGOUT: 'USER_LOGOUT',
  PASSWORD_CHANGE: 'PASSWORD_CHANGE',
  TRANSACTION_INITIATED: 'TRANSACTION_INITIATED',
  TRANSACTION_COMPLETED: 'TRANSACTION_COMPLETED',
  TRANSACTION_FAILED: 'TRANSACTION_FAILED',
  ACCOUNT_ACCESS: 'ACCOUNT_ACCESS',
  SENSITIVE_DATA_ACCESS: 'SENSITIVE_DATA_ACCESS',
  CONFIGURATION_CHANGE: 'CONFIGURATION_CHANGE',
  SECURITY_VIOLATION: 'SECURITY_VIOLATION'
}

class SecureLogger {
  constructor() {
    this.config = getEnvironmentConfig()
    this.environment = getCurrentEnvironment()
    this.isProduction = this.environment === ENV_TYPES.PRODUCTION
    this.auditLogs = []
  }

  /**
   * Scrub sensitive data from log messages
   */
  scrubSensitiveData(data) {
    if (typeof data === 'string') {
      let scrubbed = data
      SENSITIVE_PATTERNS.forEach(pattern => {
        scrubbed = scrubbed.replace(pattern, '[REDACTED]')
      })
      return scrubbed
    }

    if (typeof data === 'object' && data !== null) {
      const scrubbed = { ...data }
      
      // Recursively scrub nested objects
      Object.keys(scrubbed).forEach(key => {
        if (SENSITIVE_FIELDS.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
          scrubbed[key] = '[REDACTED]'
        } else if (typeof scrubbed[key] === 'object') {
          scrubbed[key] = this.scrubSensitiveData(scrubbed[key])
        } else if (typeof scrubbed[key] === 'string') {
          scrubbed[key] = this.scrubSensitiveData(scrubbed[key])
        }
      })
      
      return scrubbed
    }

    return data
  }

  /**
   * Format log entry with metadata
   */
  formatLogEntry(level, message, data = null, context = {}) {
    const timestamp = new Date().toISOString()
    const scrubbedData = data ? this.scrubSensitiveData(data) : null
    
    return {
      timestamp,
      level,
      environment: this.environment,
      message: this.scrubSensitiveData(message),
      data: scrubbedData,
      context: {
        userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : 'server',
        url: typeof window !== 'undefined' ? window.location?.href : null,
        ...context
      },
      sessionId: this.getSessionId()
    }
  }

  /**
   * Get or generate session ID for log correlation
   */
  getSessionId() {
    if (typeof window === 'undefined') return null
    
    let sessionId = sessionStorage.getItem('diboas_session_id')
    if (!sessionId) {
      sessionId = this.generateSecureId()
      sessionStorage.setItem('diboas_session_id', sessionId)
    }
    return sessionId
  }

  /**
   * Generate cryptographically secure ID
   */
  generateSecureId() {
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(16)
      window.crypto.getRandomValues(array)
      return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
    }
    // Fallback for environments without crypto API
    return Date.now().toString(36) + Math.random().toString(36).substr(2)
  }

  /**
   * Determine if we should log based on level and environment
   */
  shouldLog(level) {
    const configLevels = {
      [ENV_TYPES.DEVELOPMENT]: LOG_LEVELS.DEBUG,
      [ENV_TYPES.TEST]: LOG_LEVELS.ERROR,
      [ENV_TYPES.STAGING]: LOG_LEVELS.INFO,
      [ENV_TYPES.PRODUCTION]: LOG_LEVELS.ERROR
    }
    
    return level <= (configLevels[this.environment] ?? LOG_LEVELS.ERROR)
  }

  /**
   * Send logs to appropriate destination
   */
  sendLog(logEntry) {
    if (this.isProduction) {
      // In production, send to secure logging service
      // This would integrate with services like DataDog, Splunk, or AWS CloudWatch
      this.sendToProductionLogger(logEntry)
    } else {
      // Development/staging console logging with formatting
      this.sendToConsole(logEntry)
    }
  }

  /**
   * Production logging service integration
   */
  sendToProductionLogger(logEntry) {
    // This would be replaced with actual production logging service
    // Example integrations:
    // - DataDog: dataDogLogger.log(logEntry)
    // - Splunk: splunkLogger.send(logEntry)
    // - AWS CloudWatch: cloudWatchLogger.putLogEvents(logEntry)
    
    // For now, use console in production but with strict formatting
    if (logEntry.level <= LOG_LEVELS.ERROR) {
      console.error(JSON.stringify(logEntry))
    }
  }

  /**
   * Console logging for development
   */
  sendToConsole(logEntry) {
    const { level, message, data, timestamp } = logEntry
    const colorMap = {
      [LOG_LEVELS.ERROR]: '\x1b[31m', // Red
      [LOG_LEVELS.WARN]: '\x1b[33m',  // Yellow
      [LOG_LEVELS.INFO]: '\x1b[36m',  // Cyan
      [LOG_LEVELS.DEBUG]: '\x1b[37m'  // White
    }
    
    const color = colorMap[level] || '\x1b[37m'
    const reset = '\x1b[0m'
    
    console.log(`${color}[${timestamp}] ${message}${reset}`)
    if (data) {
      console.log(color, data, reset)
    }
  }

  /**
   * Public logging methods
   */
  error(message, data = null, context = {}) {
    if (!this.shouldLog(LOG_LEVELS.ERROR)) return
    
    const logEntry = this.formatLogEntry(LOG_LEVELS.ERROR, message, data, context)
    this.sendLog(logEntry)
  }

  warn(message, data = null, context = {}) {
    if (!this.shouldLog(LOG_LEVELS.WARN)) return
    
    const logEntry = this.formatLogEntry(LOG_LEVELS.WARN, message, data, context)
    this.sendLog(logEntry)
  }

  info(message, data = null, context = {}) {
    if (!this.shouldLog(LOG_LEVELS.INFO)) return
    
    const logEntry = this.formatLogEntry(LOG_LEVELS.INFO, message, data, context)
    this.sendLog(logEntry)
  }

  debug(message, data = null, context = {}) {
    if (!this.shouldLog(LOG_LEVELS.DEBUG)) return
    
    const logEntry = this.formatLogEntry(LOG_LEVELS.DEBUG, message, data, context)
    this.sendLog(logEntry)
  }

  /**
   * Audit logging for financial compliance
   */
  audit(eventType, details = {}, userId = null) {
    const auditEntry = {
      eventType,
      userId,
      timestamp: new Date().toISOString(),
      environment: this.environment,
      details: this.scrubSensitiveData(details),
      sessionId: this.getSessionId(),
      ipAddress: this.getClientIP(),
      userAgent: typeof window !== 'undefined' ? window.navigator?.userAgent : null
    }

    // Store audit logs for compliance (in production, send to secure audit service)
    this.auditLogs.push(auditEntry)
    
    // Also log as info for immediate visibility
    this.info(`AUDIT: ${eventType}`, auditEntry)

    // In production, send immediately to compliance logging service
    if (this.isProduction) {
      this.sendToAuditService(auditEntry)
    }
  }

  /**
   * Get client IP (in a real app, this would come from server)
   */
  getClientIP() {
    // This would be populated by server-side logging
    return 'client-side-unknown'
  }

  /**
   * Send to audit service for compliance
   */
  sendToAuditService(auditEntry) {
    // Integration with compliance audit services
    // Example: AWS CloudTrail, DataDog Audit, etc.
    console.info('[AUDIT]', JSON.stringify(auditEntry))
  }

  /**
   * Get audit logs for compliance reporting
   */
  getAuditLogs(startDate = null, endDate = null) {
    let logs = [...this.auditLogs]
    
    if (startDate) {
      logs = logs.filter(log => new Date(log.timestamp) >= startDate)
    }
    
    if (endDate) {
      logs = logs.filter(log => new Date(log.timestamp) <= endDate)
    }
    
    return logs
  }
}

// Singleton instance
const logger = new SecureLogger()

export default logger
export { AUDIT_EVENTS, LOG_LEVELS }