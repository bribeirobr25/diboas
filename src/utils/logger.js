/**
 * Application Logger Utility
 * Provides environment-aware logging with proper production handling
 */

const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
}

class Logger {
  constructor() {
    this.isDevelopment = import.meta.env?.DEV || process.env.NODE_ENV === 'development'
    this.logLevel = this.isDevelopment ? LOG_LEVELS.DEBUG : LOG_LEVELS.ERROR
  }

  error(message, ...args) {
    if (this.logLevel >= LOG_LEVELS.ERROR) {
      if (this.isDevelopment) {
        console.error(`[ERROR] ${message}`, ...args)
      } else {
        // In production, send to error tracking service
        this.sendToErrorTracking('error', message, args)
      }
    }
  }

  warn(message, ...args) {
    if (this.logLevel >= LOG_LEVELS.WARN) {
      if (this.isDevelopment) {
        console.warn(`[WARN] ${message}`, ...args)
      } else {
        // In production, only log warnings if critical
        this.sendToErrorTracking('warn', message, args)
      }
    }
  }

  info(message, ...args) {
    if (this.logLevel >= LOG_LEVELS.INFO && this.isDevelopment) {
      console.info(`[INFO] ${message}`, ...args)
    }
  }

  debug(message, ...args) {
    if (this.logLevel >= LOG_LEVELS.DEBUG && this.isDevelopment) {
      console.log(`[DEBUG] ${message}`, ...args)
    }
  }

  // Group logging for better organization
  group(label) {
    if (this.isDevelopment) {
      console.group(label)
    }
  }

  groupEnd() {
    if (this.isDevelopment) {
      console.groupEnd()
    }
  }

  // Table logging for data visualization
  table(data, columns) {
    if (this.isDevelopment) {
      console.table(data, columns)
    }
  }

  // Performance timing
  time(label) {
    if (this.isDevelopment) {
      console.time(label)
    }
  }

  timeEnd(label) {
    if (this.isDevelopment) {
      console.timeEnd(label)
    }
  }

  // Mock error tracking service integration
  sendToErrorTracking(level, message, args) {
    // In production, this would send to Sentry, LogRocket, etc.
    // For now, we'll store in localStorage for debugging
    try {
      const errorLog = {
        level,
        message,
        args,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent,
        url: window.location.href
      }
      
      const existingLogs = JSON.parse(localStorage.getItem('diboas_error_logs') || '[]')
      existingLogs.push(errorLog)
      
      // Keep only last 100 errors
      if (existingLogs.length > 100) {
        existingLogs.splice(0, existingLogs.length - 100)
      }
      
      localStorage.setItem('diboas_error_logs', JSON.stringify(existingLogs))
    } catch (e) {
      // Fail silently in production
    }
  }

  // Clear stored error logs
  clearErrorLogs() {
    try {
      localStorage.removeItem('diboas_error_logs')
    } catch (e) {
      // Fail silently
    }
  }

  // Get stored error logs (for debugging)
  getErrorLogs() {
    try {
      return JSON.parse(localStorage.getItem('diboas_error_logs') || '[]')
    } catch (e) {
      return []
    }
  }
}

// Create singleton instance
const logger = new Logger()

// Export individual methods for convenience
export const logError = logger.error.bind(logger)
export const logWarn = logger.warn.bind(logger)
export const logInfo = logger.info.bind(logger)
export const logDebug = logger.debug.bind(logger)

export default logger