import logger from './logger'

/**
 * Security Logging Utilities
 * Secure and structured logging for security-sensitive events
 */

/**
 * Log security event (simplified for testing)
 */
export const logSecureEvent = async (eventType, userId, data = {}, metadata = {}) => {
  try {
    const logEntry = {
      timestamp: new Date().toISOString(),
      eventType,
      userId: userId || 'anonymous',
      data,
      metadata
    }
    
    // In development/test, just log to console
    if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'test') {
      logger.debug(`[SECURITY] ${eventType}`, logEntry)
      return logEntry
    }
    
    return logEntry
  } catch (error) {
    logger.error('Error in security logging:', error)
    return null
  }
}

export default {
  logSecureEvent
}