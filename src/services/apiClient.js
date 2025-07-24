/**
 * Environment-aware API Client for diBoaS
 * Automatically configures endpoints, credentials, and behavior based on environment
 * Prevents accidental cross-environment API calls
 */

import { getApiConfig, getEnvironmentConfig, validateEnvironment } from '../config/environments.js'
import { isFeatureEnabled } from '../config/featureFlags.js'
import { credentialManager, CREDENTIAL_TYPES } from '../utils/secureCredentialManager.js'
import { checkGeneralRateLimit } from '../utils/advancedRateLimiter.js'

/**
 * API Error class for standardized error handling
 */
class ApiError extends Error {
  constructor(type, message, statusCode = null, details = {}) {
    super(message)
    this.name = 'ApiError'
    this.type = type
    this.statusCode = statusCode
    this.details = details
    this.timestamp = new Date().toISOString()
  }
}

/**
 * API Client class with environment-specific configuration
 */
class ApiClient {
  constructor() {
    this.envConfig = getEnvironmentConfig()
    this.apiConfig = getApiConfig()
    this.apiKey = null // Will be loaded securely
    
    // Validate environment on initialization
    const validation = validateEnvironment()
    if (!validation.isValid) {
      console.error('Environment validation failed:', validation.issues)
      if (validation.environment === 'production') {
        throw new Error('Cannot start in production with invalid configuration')
      }
    }
    
    // Initialize secure credentials
    this.initializeCredentials()
    
    // Configure base request settings (without credentials initially)
    this.baseRequestConfig = {
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': '1.0',
        'X-Client-Version': import.meta.env.VITE_APP_VERSION || '1.0.0',
        'X-Environment': this.envConfig.name
      },
      timeout: this.envConfig.apiTimeout,
      retries: this.envConfig.retryAttempts
    }

    // Bind methods to preserve context
    this.request = this.request.bind(this)
    this.get = this.get.bind(this)
    this.post = this.post.bind(this)
    this.put = this.put.bind(this)
    this.delete = this.delete.bind(this)
  }

  /**
   * Initialize secure credentials
   */
  async initializeCredentials() {
    try {
      this.apiKey = await credentialManager.getCredential(
        CREDENTIAL_TYPES.API_KEY, 
        this.envConfig.environment
      )
    } catch (error) {
      console.warn('Failed to initialize secure credentials:', error.message)
      // SECURITY: Never use hardcoded fallback credentials
      if (this.envConfig.environment === 'development') {
        throw new Error('API credentials not configured. Please set VITE_API_KEY environment variable.')
      } else {
        throw new Error('Failed to initialize secure credentials. Check environment configuration.')
      }
    }
  }

  /**
   * Get authorization header with secure credentials
   */
  async getAuthHeaders() {
    if (!this.apiKey) {
      await this.initializeCredentials()
    }
    
    return {
      'Authorization': `Bearer ${this.apiKey}`
    }
  }

  /**
   * Generic request method with environment-specific behavior
   */
  async request(endpoint, options = {}) {
    // Check rate limiting first
    const userIdentifier = this.getUserIdentifier()
    const rateLimitResult = checkGeneralRateLimit(userIdentifier, {
      endpoint,
      method: options.method || 'GET',
      environment: this.envConfig.environment
    })
    
    if (!rateLimitResult.allowed) {
      throw new ApiError('RATE_LIMITED', `Rate limit exceeded. Try again in ${Math.ceil(rateLimitResult.retryAfter / 1000)} seconds.`)
    }
    
    const url = this.buildUrl(endpoint)
    const config = await this.buildRequestConfig(options)
    
    // Log requests in development (without sensitive headers)
    if (this.envConfig.debugMode) {
      const safeHeaders = { ...config.headers }
      delete safeHeaders.Authorization // Don't log auth headers
      
      console.debug(`API Request [${this.envConfig.name}]:`, {
        method: config.method || 'GET',
        url,
        headers: safeHeaders,
        body: config.body
      })
    }

    try {
      const response = await this.makeRequest(url, config)
      return await this.handleResponse(response)
    } catch (error) {
      return this.handleError(error, endpoint, config)
    }
  }

  /**
   * Get user identifier for rate limiting
   */
  getUserIdentifier() {
    // Use a combination of factors for identification
    return 'api-client-' + (this.envConfig.environment || 'unknown')
  }

  /**
   * Build full URL from endpoint
   */
  buildUrl(endpoint) {
    const baseUrl = this.apiConfig.baseUrl
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
    return `${baseUrl}/${cleanEndpoint}`
  }

  /**
   * Build request configuration with secure credentials
   */
  async buildRequestConfig(options) {
    // Get secure auth headers
    const authHeaders = await this.getAuthHeaders()
    
    const config = {
      ...this.baseRequestConfig,
      ...options,
      headers: {
        ...this.baseRequestConfig.headers,
        ...authHeaders,
        ...options.headers
      }
    }

    // Add request ID for tracking
    config.headers['X-Request-ID'] = this.generateRequestId()

    // Add user context if available
    const userContext = this.getUserContext()
    if (userContext?.userId) {
      config.headers['X-User-ID'] = userContext.userId
    }
    if (userContext?.sessionId) {
      config.headers['X-Session-ID'] = userContext.sessionId
    }

    return config
  }

  /**
   * Make the actual HTTP request with retry logic
   */
  async makeRequest(url, config) {
    let lastError
    const maxRetries = config.retries || 0

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), config.timeout)

        const response = await fetch(url, {
          ...config,
          signal: controller.signal
        })

        clearTimeout(timeoutId)
        return response
      } catch (error) {
        lastError = error
        
        // Don't retry on certain errors
        if (this.shouldNotRetry(error)) {
          break
        }
        
        // Wait before retry with exponential backoff
        if (attempt < maxRetries) {
          await this.delay(Math.pow(2, attempt) * 1000)
        }
      }
    }

    throw lastError
  }

  /**
   * Handle successful response
   */
  async handleResponse(response) {
    if (!response.ok) {
      throw new ApiError(
        response.status,
        response.statusText,
        await response.text()
      )
    }

    const contentType = response.headers.get('content-type')
    
    if (contentType?.includes('application/json')) {
      return await response.json()
    }
    
    return await response.text()
  }

  /**
   * Handle request errors
   */
  handleError(error, endpoint, config) {
    // Log errors based on environment
    if (this.envConfig.debugMode) {
      console.error(`API Error [${this.envConfig.name}]:`, {
        endpoint,
        error: error.message,
        config
      })
    }

    // In production, don't expose detailed error information
    if (this.envConfig.name === 'Production') {
      throw new ApiError(500, 'Service temporarily unavailable')
    }

    throw error
  }

  /**
   * Check if error should not be retried
   */
  shouldNotRetry(error) {
    // Don't retry 4xx errors (client errors)
    if (error instanceof ApiError && error.status >= 400 && error.status < 500) {
      return true
    }
    
    // Don't retry abort errors
    if (error.name === 'AbortError') {
      return true
    }
    
    return false
  }

  /**
   * Delay utility for retry logic
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  /**
   * Generate unique request ID
   */
  generateRequestId() {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get user context (implement based on your auth system)
   */
  getUserContext() {
    // This would integrate with your authentication system
    // For now, return mock data in development
    if (this.envConfig.enableMockData) {
      return {
        userId: 'user_dev_123',
        sessionId: 'session_dev_456',
        region: 'us-east-1'
      }
    }
    
    return {}
  }

  // Convenience methods
  async get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' })
  }

  async post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data)
    })
  }

  async put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data)
    })
  }

  async delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' })
  }
}

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(status, statusText, body = '') {
    super(`API Error ${status}: ${statusText}`)
    this.name = 'ApiError'
    this.status = status
    this.statusText = statusText
    this.body = body
  }
}

/**
 * Environment-specific API endpoints
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH: {
    LOGIN: 'auth/login',
    REGISTER: 'auth/register',
    LOGOUT: 'auth/logout',
    REFRESH: 'auth/refresh',
    VERIFY: 'auth/verify',
    RESET_PASSWORD: 'auth/reset-password'
  },

  // User Management
  USER: {
    PROFILE: 'user/profile',
    PREFERENCES: 'user/preferences',
    SECURITY: 'user/security',
    VERIFICATION: 'user/verification'
  },

  // Financial Operations
  FINANCE: {
    BALANCE: 'finance/balance',
    TRANSACTIONS: 'finance/transactions',
    TRANSFER: 'finance/transfer',
    WITHDRAW: 'finance/withdraw',
    DEPOSIT: 'finance/deposit'
  },

  // Crypto Operations (Feature flag controlled)
  CRYPTO: {
    WALLETS: 'crypto/wallets',
    CONNECT: 'crypto/connect',
    TRANSACTIONS: 'crypto/transactions',
    DEFI: 'crypto/defi'
  },

  // Market Data
  MARKET: {
    PRICES: 'market/prices',
    TRENDS: 'market/trends',
    NEWS: 'market/news'
  },

  // Analytics (Production only)
  ANALYTICS: {
    EVENTS: 'analytics/events',
    METRICS: 'analytics/metrics'
  }
}

/**
 * Feature-flag aware API client
 */
class FeatureAwareApiClient extends ApiClient {
  async request(endpoint, options = {}) {
    // Check if endpoint requires feature flag
    if (this.requiresFeatureFlag(endpoint)) {
      const flagName = this.getRequiredFeatureFlag(endpoint)
      if (!isFeatureEnabled(flagName)) {
        throw new ApiError(403, 'Feature not available')
      }
    }

    return super.request(endpoint, options)
  }

  requiresFeatureFlag(endpoint) {
    return endpoint.includes('/crypto/') || 
           endpoint.includes('/defi/') ||
           endpoint.includes('/analytics/')
  }

  getRequiredFeatureFlag(endpoint) {
    if (endpoint.includes('/crypto/')) return 'CRYPTO_WALLET_INTEGRATION'
    if (endpoint.includes('/defi/')) return 'DEFI_INVESTMENTS'
    if (endpoint.includes('/analytics/')) return 'ADVANCED_ANALYTICS'
    return null
  }
}

// Create singleton instances
export const apiClient = new FeatureAwareApiClient()

// Export for testing
export { ApiClient, ApiError }

// Mock API responses for development
export const mockApiResponses = {
  [API_ENDPOINTS.AUTH.LOGIN]: {
    success: true,
    user: { id: '123', email: 'user@example.com' },
    token: process.env.NODE_ENV === 'test' ? 'test-jwt-token' : 'SECURITY_WARNING_MOCK_TOKEN_SHOULD_NOT_BE_USED'
  },
  
  [API_ENDPOINTS.FINANCE.BALANCE]: {
    total: 40676.50,
    available: 38450.25,
    invested: 2226.25,
    currency: 'USD'
  },
  
  [API_ENDPOINTS.FINANCE.TRANSACTIONS]: [
    {
      id: 'tx_1',
      type: 'received',
      amount: 3200.00,
      description: 'Salary Deposit',
      timestamp: new Date().toISOString()
    }
  ]
}

export default apiClient