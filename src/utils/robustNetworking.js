/**
 * Robust Networking Utilities
 * Provides resilient network operations with comprehensive error handling
 * Includes retry logic, circuit breakers, timeouts, and graceful degradation
 */

import logger from './logger'
import { safeJSONParse, safeJSONStringify } from './safeDataHandling'

// Circuit breaker states
export const CIRCUIT_BREAKER_STATES = {
  CLOSED: 'closed',
  OPEN: 'open',
  HALF_OPEN: 'half_open'
}

// Network error types
export const NETWORK_ERROR_TYPES = {
  TIMEOUT: 'timeout',
  NO_NETWORK: 'no_network',
  SERVER_ERROR: 'server_error',
  CLIENT_ERROR: 'client_error',
  PARSE_ERROR: 'parse_error',
  CIRCUIT_OPEN: 'circuit_open'
}

// Default configuration
const DEFAULT_CONFIG = {
  timeout: 30000,
  retries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  maxRetryDelay: 10000,
  circuitBreakerFailures: 5,
  circuitBreakerTimeout: 60000,
  validateStatus: (status) => status >= 200 && status < 300
}

/**
 * Circuit breaker implementation for network requests
 */
class CircuitBreaker {
  constructor(options = {}) {
    this.failureThreshold = options.failureThreshold || 5
    this.timeout = options.timeout || 60000
    this.monitoringPeriod = options.monitoringPeriod || 10000
    
    this.state = CIRCUIT_BREAKER_STATES.CLOSED
    this.failures = 0
    this.lastFailureTime = null
    this.successCount = 0
    this.requestCount = 0
  }

  async execute(operation, context = '') {
    if (this.state === CIRCUIT_BREAKER_STATES.OPEN) {
      if (Date.now() - this.lastFailureTime > this.timeout) {
        this.state = CIRCUIT_BREAKER_STATES.HALF_OPEN
        this.successCount = 0
        logger.info(`Circuit breaker ${context} transitioning to HALF_OPEN`)
      } else {
        const error = new Error(`Circuit breaker ${context} is OPEN`)
        error.type = NETWORK_ERROR_TYPES.CIRCUIT_OPEN
        throw error
      }
    }

    try {
      this.requestCount++
      const result = await operation()
      
      if (this.state === CIRCUIT_BREAKER_STATES.HALF_OPEN) {
        this.successCount++
        if (this.successCount >= 3) {
          this.state = CIRCUIT_BREAKER_STATES.CLOSED
          this.failures = 0
          logger.info(`Circuit breaker ${context} reset to CLOSED`)
        }
      } else {
        this.failures = Math.max(0, this.failures - 1)
      }
      
      return result
    } catch (error) {
      this.failures++
      this.lastFailureTime = Date.now()
      
      if (this.failures >= this.failureThreshold) {
        this.state = CIRCUIT_BREAKER_STATES.OPEN
        logger.warn(`Circuit breaker ${context} opened after ${this.failures} failures`)
      }
      
      throw error
    }
  }

  getStatus() {
    return {
      state: this.state,
      failures: this.failures,
      requestCount: this.requestCount,
      lastFailureTime: this.lastFailureTime
    }
  }

  reset() {
    this.state = CIRCUIT_BREAKER_STATES.CLOSED
    this.failures = 0
    this.successCount = 0
    this.lastFailureTime = null
  }
}

/**
 * Network request manager with circuit breakers
 */
class NetworkManager {
  constructor() {
    this.circuitBreakers = new Map()
    this.activeRequests = new Map()
    this.requestHistory = []
  }

  getCircuitBreaker(url) {
    const host = new URL(url).hostname
    if (!this.circuitBreakers.has(host)) {
      this.circuitBreakers.set(host, new CircuitBreaker({
        failureThreshold: 5,
        timeout: 60000
      }))
    }
    return this.circuitBreakers.get(host)
  }

  addToHistory(request) {
    this.requestHistory.push({
      ...request,
      timestamp: Date.now()
    })
    
    // Keep only last 100 requests
    if (this.requestHistory.length > 100) {
      this.requestHistory.shift()
    }
  }

  getNetworkStats() {
    const recent = this.requestHistory.filter(req => 
      Date.now() - req.timestamp < 60000 // Last minute
    )
    
    const successful = recent.filter(req => req.success).length
    const failed = recent.length - successful
    const successRate = recent.length > 0 ? successful / recent.length : 1
    
    const circuitBreakerStats = {}
    this.circuitBreakers.forEach((breaker, host) => {
      circuitBreakerStats[host] = breaker.getStatus()
    })
    
    return {
      recentRequests: recent.length,
      successRate,
      successfulRequests: successful,
      failedRequests: failed,
      activeRequests: this.activeRequests.size,
      circuitBreakers: circuitBreakerStats
    }
  }
}

// Global network manager instance
const networkManager = new NetworkManager()

/**
 * Enhanced fetch with comprehensive error handling and resilience
 * @param {string} url - Request URL
 * @param {object} options - Request options
 * @returns {Promise} Response or throws enhanced error
 */
export async function robustFetch(url, options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options }
  const requestId = `${Date.now()}_${Math.random()}`
  
  // Track active request
  networkManager.activeRequests.set(requestId, {
    url,
    startTime: Date.now(),
    config: { ...config, headers: config.headers ? '***' : undefined }
  })
  
  const circuitBreaker = networkManager.getCircuitBreaker(url)
  let lastError = null
  
  try {
    const result = await circuitBreaker.execute(async () => {
      return await executeRequest(url, config, requestId)
    }, new URL(url).hostname)
    
    // Track successful request
    networkManager.addToHistory({
      url,
      success: true,
      duration: Date.now() - networkManager.activeRequests.get(requestId).startTime,
      retries: 0
    })
    
    return result
  } catch (error) {
    lastError = error
    
    // Track failed request
    networkManager.addToHistory({
      url,
      success: false,
      duration: Date.now() - networkManager.activeRequests.get(requestId).startTime,
      error: error.message,
      errorType: error.type || NETWORK_ERROR_TYPES.SERVER_ERROR
    })
    
    throw error
  } finally {
    networkManager.activeRequests.delete(requestId)
  }
}

/**
 * Execute individual request with retry logic
 */
async function executeRequest(url, config, requestId) {
  let lastError = null
  let attempt = 0
  
  while (attempt < config.retries) {
    try {
      const response = await makeRequest(url, config, attempt)
      return response
    } catch (error) {
      lastError = error
      attempt++
      
      logger.warn(`robustFetch: Attempt ${attempt} failed for ${url}:`, {
        error: error.message,
        type: error.type,
        requestId,
        retriesLeft: config.retries - attempt
      })
      
      // Don't retry on certain error types
      if (!shouldRetry(error, attempt, config.retries)) {
        break
      }
      
      // Calculate delay with exponential backoff
      if (attempt < config.retries) {
        const delay = calculateRetryDelay(attempt, config)
        await sleep(delay)
      }
    }
  }
  
  // Enhance error with retry information
  if (lastError) {
    lastError.retries = attempt
    lastError.maxRetries = config.retries
  }
  
  throw lastError
}

/**
 * Make individual HTTP request
 */
async function makeRequest(url, config, attempt) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), config.timeout)
  
  try {
    // Prepare request options
    const fetchOptions = {
      ...config,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...config.headers
      }
    }
    
    // Add request body if present
    if (config.data) {
      fetchOptions.body = safeJSONStringify(config.data)
    }
    
    // Make request
    const response = await fetch(url, fetchOptions)
    
    // Clear timeout
    clearTimeout(timeoutId)
    
    // Check response status
    if (!config.validateStatus(response.status)) {
      const error = new Error(`HTTP ${response.status}: ${response.statusText}`)
      error.status = response.status
      error.type = response.status >= 500 ? 
        NETWORK_ERROR_TYPES.SERVER_ERROR : 
        NETWORK_ERROR_TYPES.CLIENT_ERROR
      error.response = response
      throw error
    }
    
    // Parse response
    const result = await parseResponse(response, config)
    return result
    
  } catch (error) {
    clearTimeout(timeoutId)
    
    // Handle different error types
    if (error.name === 'AbortError') {
      const timeoutError = new Error(`Request timeout after ${config.timeout}ms`)
      timeoutError.type = NETWORK_ERROR_TYPES.TIMEOUT
      timeoutError.timeout = config.timeout
      throw timeoutError
    }
    
    if (error.message.includes('Failed to fetch')) {
      const networkError = new Error('Network connection failed')
      networkError.type = NETWORK_ERROR_TYPES.NO_NETWORK
      networkError.originalError = error
      throw networkError
    }
    
    // Re-throw with enhanced information
    if (!error.type) {
      error.type = NETWORK_ERROR_TYPES.SERVER_ERROR
    }
    error.attempt = attempt + 1
    error.url = url
    
    throw error
  }
}

/**
 * Parse response based on content type
 */
async function parseResponse(response, config) {
  const contentType = response.headers.get('content-type') || ''
  
  try {
    if (contentType.includes('application/json')) {
      const text = await response.text()
      return safeJSONParse(text, null, true)
    } else if (contentType.includes('text/')) {
      return await response.text()
    } else if (config.responseType === 'blob') {
      return await response.blob()
    } else if (config.responseType === 'arrayBuffer') {
      return await response.arrayBuffer()
    } else {
      // Default to text
      return await response.text()
    }
  } catch (error) {
    const parseError = new Error(`Failed to parse response: ${error.message}`)
    parseError.type = NETWORK_ERROR_TYPES.PARSE_ERROR
    parseError.originalError = error
    parseError.response = response
    throw parseError
  }
}

/**
 * Determine if request should be retried
 */
function shouldRetry(error, attempt, maxRetries) {
  // Don't retry if max attempts reached
  if (attempt >= maxRetries) return false
  
  // Don't retry client errors (4xx)
  if (error.type === NETWORK_ERROR_TYPES.CLIENT_ERROR) {
    return false
  }
  
  // Don't retry circuit breaker errors
  if (error.type === NETWORK_ERROR_TYPES.CIRCUIT_OPEN) {
    return false
  }
  
  // Retry network, timeout, and server errors
  return [
    NETWORK_ERROR_TYPES.NO_NETWORK,
    NETWORK_ERROR_TYPES.TIMEOUT,
    NETWORK_ERROR_TYPES.SERVER_ERROR
  ].includes(error.type)
}

/**
 * Calculate retry delay with exponential backoff and jitter
 */
function calculateRetryDelay(attempt, config) {
  let delay = config.retryDelay
  
  if (config.exponentialBackoff) {
    delay = config.retryDelay * Math.pow(2, attempt)
  }
  
  // Apply maximum delay limit
  delay = Math.min(delay, config.maxRetryDelay)
  
  // Add jitter to prevent thundering herd
  const jitter = Math.random() * 0.1 * delay
  delay = delay + jitter
  
  return Math.floor(delay)
}

/**
 * Sleep utility
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Convenience methods for different HTTP methods
 */
export const robustHttp = {
  get: (url, options = {}) => robustFetch(url, { ...options, method: 'GET' }),
  post: (url, data, options = {}) => robustFetch(url, { ...options, method: 'POST', data }),
  put: (url, data, options = {}) => robustFetch(url, { ...options, method: 'PUT', data }),
  patch: (url, data, options = {}) => robustFetch(url, { ...options, method: 'PATCH', data }),
  delete: (url, options = {}) => robustFetch(url, { ...options, method: 'DELETE' })
}

/**
 * Create a network client with default configuration
 */
export function createNetworkClient(baseConfig = {}) {
  const defaultConfig = { ...DEFAULT_CONFIG, ...baseConfig }
  
  return {
    request: (url, options = {}) => robustFetch(url, { ...defaultConfig, ...options }),
    get: (url, options = {}) => robustHttp.get(url, { ...defaultConfig, ...options }),
    post: (url, data, options = {}) => robustHttp.post(url, data, { ...defaultConfig, ...options }),
    put: (url, data, options = {}) => robustHttp.put(url, data, { ...defaultConfig, ...options }),
    patch: (url, data, options = {}) => robustHttp.patch(url, data, { ...defaultConfig, ...options }),
    delete: (url, options = {}) => robustHttp.delete(url, { ...defaultConfig, ...options }),
    
    // Utility methods
    getStats: () => networkManager.getNetworkStats(),
    resetCircuitBreakers: () => {
      networkManager.circuitBreakers.forEach(breaker => breaker.reset())
    }
  }
}

/**
 * Network status monitoring
 */
export class NetworkMonitor {
  constructor() {
    this.listeners = []
    this.isOnline = navigator.onLine
    this.setupEventListeners()
  }
  
  setupEventListeners() {
    if (typeof window !== 'undefined') {
      window.addEventListener('online', () => {
        this.isOnline = true
        this.notifyListeners({ type: 'online' })
      })
      
      window.addEventListener('offline', () => {
        this.isOnline = false
        this.notifyListeners({ type: 'offline' })
      })
    }
  }
  
  addListener(callback) {
    this.listeners.push(callback)
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback)
    }
  }
  
  notifyListeners(event) {
    this.listeners.forEach(listener => {
      try {
        listener(event)
      } catch (error) {
        logger.warn('NetworkMonitor: Listener error:', error.message)
      }
    })
  }
  
  getStatus() {
    return {
      online: this.isOnline,
      networkStats: networkManager.getNetworkStats()
    }
  }
}

// Global network monitor
export const networkMonitor = new NetworkMonitor()

/**
 * Hook for network status (if using in React components)
 * Note: Import React hooks when using this in React components
 */
/**
 * Network status utilities for vanilla JS usage
 */
export const networkStatusUtils = {
  isOnline: () => navigator.onLine,
  getStats: () => networkManager.getNetworkStats(),
  addStatusListener: (callback) => networkMonitor.addListener(callback),
  resetCircuitBreakers: () => networkManager.circuitBreakers.forEach(breaker => breaker.reset())
}

export default {
  robustFetch,
  robustHttp,
  createNetworkClient,
  networkMonitor,
  networkStatusUtils,
  NetworkManager,
  CircuitBreaker,
  NETWORK_ERROR_TYPES,
  CIRCUIT_BREAKER_STATES
}