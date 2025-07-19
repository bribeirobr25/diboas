/**
 * Integration Logger
 * Centralized logging for all integration operations
 */

export class IntegrationLogger {
  constructor() {
    this.logs = []
    this.maxLogs = 1000
    this.logLevel = import.meta.env.DEV ? 'debug' : 'info'
    this.enableConsole = import.meta.env.DEV
  }

  /**
   * Log levels
   */
  static LOG_LEVELS = {
    debug: 0,
    info: 1,
    warn: 2,
    error: 3
  }

  /**
   * Check if log level should be processed
   */
  shouldLog(level) {
    return IntegrationLogger.LOG_LEVELS[level] >= IntegrationLogger.LOG_LEVELS[this.logLevel]
  }

  /**
   * Create log entry
   */
  createLogEntry(level, message, data = null) {
    const entry = {
      timestamp: new Date(),
      level,
      message,
      data: data ? this.sanitizeData(data) : null,
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }

    // Add to in-memory logs
    this.logs.push(entry)
    
    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogs) {
      this.logs.splice(0, this.logs.length - this.maxLogs)
    }

    return entry
  }

  /**
   * Sanitize data for logging (remove sensitive information)
   */
  sanitizeData(data) {
    if (!data || typeof data !== 'object') {
      return data
    }

    const sensitiveKeys = [
      'password',
      'secret',
      'token',
      'key',
      'auth',
      'credential',
      'ssn',
      'cardNumber',
      'cvv',
      'pin'
    ]

    const sanitized = JSON.parse(JSON.stringify(data))

    const sanitizeRecursive = (obj) => {
      if (!obj || typeof obj !== 'object') return obj

      for (const key in obj) {
        if (typeof key === 'string') {
          const lowerKey = key.toLowerCase()
          
          // Check if key contains sensitive information
          if (sensitiveKeys.some(sensitive => lowerKey.includes(sensitive))) {
            obj[key] = '[REDACTED]'
          } else if (typeof obj[key] === 'object') {
            sanitizeRecursive(obj[key])
          }
        }
      }
    }

    sanitizeRecursive(sanitized)
    return sanitized
  }

  /**
   * Debug logging
   */
  debug(message, data = null) {
    if (!this.shouldLog('debug')) return

    const entry = this.createLogEntry('debug', message, data)
    
    if (this.enableConsole) {
      console.debug(`[INTEGRATION] ${message}`, data || '')
    }

    return entry
  }

  /**
   * Info logging
   */
  info(message, data = null) {
    if (!this.shouldLog('info')) return

    const entry = this.createLogEntry('info', message, data)
    
    if (this.enableConsole) {
      console.log(`[INTEGRATION] ${message}`, data || '')
    }

    return entry
  }

  /**
   * Warning logging
   */
  warn(message, data = null) {
    if (!this.shouldLog('warn')) return

    const entry = this.createLogEntry('warn', message, data)
    
    if (this.enableConsole) {
      console.warn(`[INTEGRATION] ${message}`, data || '')
    }

    return entry
  }

  /**
   * Error logging
   */
  error(message, error = null) {
    if (!this.shouldLog('error')) return

    const errorData = error ? {
      name: error.name,
      message: error.message,
      stack: error.stack,
      details: error.getDetails ? error.getDetails() : null
    } : null

    const entry = this.createLogEntry('error', message, errorData)
    
    if (this.enableConsole) {
      console.error(`[INTEGRATION] ${message}`, error || '')
    }

    return entry
  }

  /**
   * Get logs with optional filtering
   */
  getLogs(filters = {}) {
    let filteredLogs = [...this.logs]

    // Filter by level
    if (filters.level) {
      filteredLogs = filteredLogs.filter(log => log.level === filters.level)
    }

    // Filter by time range
    if (filters.since) {
      const sinceDate = new Date(filters.since)
      filteredLogs = filteredLogs.filter(log => log.timestamp >= sinceDate)
    }

    if (filters.until) {
      const untilDate = new Date(filters.until)
      filteredLogs = filteredLogs.filter(log => log.timestamp <= untilDate)
    }

    // Filter by message content
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      filteredLogs = filteredLogs.filter(log => 
        log.message.toLowerCase().includes(searchTerm)
      )
    }

    // Limit results
    const limit = filters.limit || 100
    return filteredLogs.slice(-limit)
  }

  /**
   * Get logs summary
   */
  getLogsSummary() {
    const summary = {
      total: this.logs.length,
      byLevel: {},
      recentErrors: [],
      oldestLog: null,
      newestLog: null
    }

    // Count by level
    for (const log of this.logs) {
      summary.byLevel[log.level] = (summary.byLevel[log.level] || 0) + 1
    }

    // Get recent errors (last 10)
    summary.recentErrors = this.logs
      .filter(log => log.level === 'error')
      .slice(-10)
      .map(log => ({
        timestamp: log.timestamp,
        message: log.message,
        id: log.id
      }))

    // Get oldest and newest logs
    if (this.logs.length > 0) {
      summary.oldestLog = this.logs[0].timestamp
      summary.newestLog = this.logs[this.logs.length - 1].timestamp
    }

    return summary
  }

  /**
   * Clear logs
   */
  clearLogs() {
    const clearedCount = this.logs.length
    this.logs = []
    this.info(`Cleared ${clearedCount} log entries`)
    return clearedCount
  }

  /**
   * Export logs as JSON
   */
  exportLogs(filters = {}) {
    const logs = this.getLogs(filters)
    return {
      exportDate: new Date(),
      totalLogs: logs.length,
      filters,
      logs
    }
  }

  /**
   * Set log level
   */
  setLogLevel(level) {
    if (!IntegrationLogger.LOG_LEVELS.hasOwnProperty(level)) {
      throw new Error(`Invalid log level: ${level}`)
    }
    
    this.logLevel = level
    this.info(`Log level changed to: ${level}`)
  }

  /**
   * Enable/disable console logging
   */
  setConsoleLogging(enabled) {
    this.enableConsole = enabled
    this.info(`Console logging ${enabled ? 'enabled' : 'disabled'}`)
  }

  /**
   * Set maximum number of logs to keep
   */
  setMaxLogs(maxLogs) {
    this.maxLogs = maxLogs
    
    // Trim existing logs if needed
    if (this.logs.length > maxLogs) {
      const removed = this.logs.length - maxLogs
      this.logs.splice(0, removed)
      this.info(`Trimmed ${removed} old log entries`)
    }
  }

  /**
   * Performance logging helper
   */
  timeOperation(operationName) {
    const startTime = Date.now()
    
    return {
      finish: (success = true, additionalData = {}) => {
        const duration = Date.now() - startTime
        const level = success ? 'info' : 'warn'
        
        this[level](`Operation completed: ${operationName}`, {
          duration: `${duration}ms`,
          success,
          ...additionalData
        })
        
        return duration
      }
    }
  }

  /**
   * Create a logger for a specific component
   */
  createComponentLogger(componentName) {
    return {
      debug: (message, data) => this.debug(`[${componentName}] ${message}`, data),
      info: (message, data) => this.info(`[${componentName}] ${message}`, data),
      warn: (message, data) => this.warn(`[${componentName}] ${message}`, data),
      error: (message, error) => this.error(`[${componentName}] ${message}`, error),
      timeOperation: (operationName) => this.timeOperation(`${componentName}:${operationName}`)
    }
  }
}

export default IntegrationLogger