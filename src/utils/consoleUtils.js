/**
 * Console Utilities for Development
 * Helps manage console output and suppress known browser extension warnings
 */

/**
 * Initialize console management for development
 */
export const initializeConsoleManagement = () => {
  // Only apply in development
  if (process.env.NODE_ENV !== 'development') {
    return
  }

  // Store original console methods
  const originalConsole = {
    error: console.error,
    warn: console.warn,
    log: console.log
  }

  // Filter out known browser extension warnings
  const extensionPatterns = [
    /chrome-extension:/,
    /extension.*manifest.*key/,
    /Backpack.*override.*window.ethereum/,
    /MetaMask.*extension.*not.*found/,
    /Could not establish connection.*Receiving end does not exist/,
    /web_accessible_resources.*manifest.*key/,
    /Content Security Policy.*frame-ancestors.*ignored.*meta/
  ]

  const shouldSuppressMessage = (message) => {
    const messageStr = String(message)
    return extensionPatterns.some(pattern => pattern.test(messageStr))
  }

  // Override console methods to filter extension warnings
  console.error = (...args) => {
    if (shouldSuppressMessage(args[0])) {
      return // Suppress browser extension warnings
    }
    originalConsole.error(...args)
  }

  console.warn = (...args) => {
    if (shouldSuppressMessage(args[0])) {
      return // Suppress browser extension warnings
    }
    originalConsole.warn(...args)
  }

  // Add helpful development message
  console.log(
    '%c🎯 diBoaS Development Mode',
    'color: #1E40AF; font-weight: bold; font-size: 14px;'
  )
  console.log(
    '%c✨ Browser extension warnings have been filtered from the console',
    'color: #06B6D4; font-size: 12px;'
  )
  console.log(
    '%c🛡️ Application security and functionality remain unaffected',
    'color: #10B981; font-size: 12px;'
  )
}

/**
 * Log important application events
 */
export const logAppEvent = (event, data = {}) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(
      `%c[diBoaS] ${event}`,
      'color: #1E40AF; font-weight: bold;',
      data
    )
  }
}

/**
 * Log performance metrics
 */
export const logPerformanceMetric = (metric, value, unit = 'ms') => {
  if (process.env.NODE_ENV === 'development') {
    const color = value < 100 ? '#10B981' : value < 500 ? '#F59E0B' : '#EF4444'
    console.log(
      `%c[Performance] ${metric}: ${value}${unit}`,
      `color: ${color}; font-weight: bold;`
    )
  }
}

/**
 * Log security events (always logged regardless of environment)
 */
export const audit = (event, level = 'info') => {
  const colors = {
    info: '#06B6D4',
    warn: '#F59E0B', 
    error: '#EF4444'
  }
  
  console.log(
    `%c[Security] ${event}`,
    `color: ${colors[level]}; font-weight: bold;`
  )
}