/**
 * Secure Credential Manager for diBoaS FinTech Application
 * Handles API keys and sensitive credentials securely
 */

import { secureStorage } from './secureStorage.js'
import secureLogger from './secureLogger.js'
import logger from './logger'

/**
 * Credential types for different API services
 */
export const CREDENTIAL_TYPES = {
  API_KEY: 'api_key',
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  SESSION_TOKEN: 'session_token',
  ENCRYPTION_KEY: 'encryption_key'
}

/**
 * Environment-specific credential sources
 */
const CREDENTIAL_SOURCES = {
  development: {
    source: 'environment',
    fallback: 'mock'
  },
  staging: {
    source: 'secure_storage',
    fallback: 'environment'
  },
  production: {
    source: 'secure_endpoint',
    fallback: 'secure_storage'
  }
}

/**
 * Secure Credential Manager
 */
class SecureCredentialManager {
  constructor() {
    this.credentials = new Map()
    this.encryptionKey = this.generateEncryptionKey()
    this.lastRotation = Date.now()
    this.rotationInterval = 24 * 60 * 60 * 1000 // 24 hours
    
    // Setup credential rotation
    this.setupCredentialRotation()
  }

  /**
   * Get secure credentials based on environment
   */
  async getCredential(type, environment = 'development') {
    try {
      const source = CREDENTIAL_SOURCES[environment] || CREDENTIAL_SOURCES.development
      
      // Try primary source first
      let credential = await this.getCredentialFromSource(type, source.source, environment)
      
      // Fallback if primary fails
      if (!credential && source.fallback) {
        credential = await this.getCredentialFromSource(type, source.fallback, environment)
      }
      
      if (!credential) {
        // Use mock credentials for development
        if (environment === 'development') {
          credential = this.getMockCredential(type)
        } else {
          throw new Error(`Failed to retrieve credential: ${type}`)
        }
      }

      // Log credential access (without exposing the actual credential)
      secureLogger.audit('CREDENTIAL_ACCESSED', {
        type,
        environment,
        hasCredential: !!credential,
        source: source.source
      })

      return credential
    } catch (error) {
      secureLogger.audit('CREDENTIAL_ACCESS_FAILED', {
        type,
        environment,
        error: error.message
      })
      throw error
    }
  }

  /**
   * Get credential from specific source
   */
  async getCredentialFromSource(type, source, environment) {
    switch (source) {
      case 'environment':
        return this.getEnvironmentCredential(type, environment)
      
      case 'secure_storage':
        return await this.getStoredCredential(type)
      
      case 'secure_endpoint':
        return await this.getCredentialFromEndpoint(type, environment)
      
      case 'mock':
        return this.getMockCredential(type)
      
      default:
        return null
    }
  }

  /**
   * Get credential from environment variables
   */
  getEnvironmentCredential(type, environment) {
    const envMap = {
      [CREDENTIAL_TYPES.API_KEY]: {
        development: 'VITE_DEV_API_KEY',
        staging: 'VITE_STAGING_API_KEY',
        production: 'VITE_PROD_API_KEY'
      },
      [CREDENTIAL_TYPES.AUTH_TOKEN]: {
        development: 'VITE_DEV_AUTH_TOKEN',
        staging: 'VITE_STAGING_AUTH_TOKEN',
        production: 'VITE_PROD_AUTH_TOKEN'
      }
    }

    const envVar = envMap[type]?.[environment]
    if (!envVar) return null

    const credential = import.meta.env[envVar]
    
    // Warn if using production credentials in non-production
    if (environment !== 'production' && envVar.includes('PROD')) {
      logger.warn('WARNING: Using production credentials in non-production environment')
    }

    return credential
  }

  /**
   * Get credential from secure storage
   */
  async getStoredCredential(type) {
    try {
      const key = `credential_${type}`
      return await secureStorage.getSecureItem(key, this.encryptionKey)
    } catch (error) {
      logger.warn('Failed to retrieve stored credential:', error.message)
      return null
    }
  }

  /**
   * Store credential securely
   */
  async storeCredential(type, credential) {
    try {
      const key = `credential_${type}`
      await secureStorage.setSecureItem(key, credential, this.encryptionKey)
      
      secureLogger.audit('CREDENTIAL_STORED', {
        type,
        timestamp: new Date().toISOString()
      })
      
      return true
    } catch (error) {
      secureLogger.audit('CREDENTIAL_STORAGE_FAILED', {
        type,
        error: error.message
      })
      return false
    }
  }

  /**
   * Get credential from secure endpoint (production)
   */
  async getCredentialFromEndpoint(type, environment) {
    // This would typically call a secure credential service
    // For this implementation, we'll simulate it
    
    try {
      // In production, this would be a secure API call
      // const credentialEndpoint = `https://credentials.diboas.com/api/v1/credentials/${type}` // Removed unused variable
      
      // Simulate secure endpoint call
      // In real implementation, this would use client certificates or other secure auth
      logger.warn('Credential endpoint not implemented - using fallback')
      return null
      
    } catch (error) {
      secureLogger.audit('CREDENTIAL_ENDPOINT_FAILED', {
        type,
        environment,
        error: error.message
      })
      return null
    }
  }

  /**
   * Get mock credentials for development
   */
  getMockCredential(type) {
    const mockCredentials = {
      [CREDENTIAL_TYPES.API_KEY]: 'dev-api-key-safe-for-demo-12345',
      [CREDENTIAL_TYPES.AUTH_TOKEN]: 'dev-auth-token-mock-67890',
      [CREDENTIAL_TYPES.REFRESH_TOKEN]: 'dev-refresh-token-demo-abcde',
      [CREDENTIAL_TYPES.SESSION_TOKEN]: 'dev-session-token-test-fghij',
      [CREDENTIAL_TYPES.ENCRYPTION_KEY]: 'dev-encryption-key-demo-klmno'
    }

    return mockCredentials[type] || null
  }

  /**
   * Generate cryptographically secure encryption key for credential storage
   * SECURITY: Uses Web Crypto API for secure random generation
   */
  generateEncryptionKey() {
    try {
      // Use cryptographically secure random generation
      if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const randomBytes = new Uint8Array(32)
        crypto.getRandomValues(randomBytes)
        
        // Convert to base64 for key generation
        const randomB64 = btoa(String.fromCharCode(...randomBytes))
        return `diboas-cred-key-${randomB64.slice(0, 32)}`
      }
      
      // Node.js environment fallback
      if (typeof require !== 'undefined') {
        const nodeKeys = require('crypto')
        const randomBytes = nodeKeys.randomBytes(32)
        return `diboas-cred-key-${randomBytes.toString('base64').slice(0, 32)}`
      }
      
      // Last resort - but warn about insecurity
      logger.warn('SECURITY WARNING: Using weak random generation for encryption key')
      const timestamp = Date.now().toString()
      const weakRandom = Math.random().toString(36)
      return `diboas-cred-key-WEAK-${btoa(timestamp + weakRandom).slice(0, 32)}`
      
    } catch (error) {
      throw new Error('Failed to generate secure encryption key: ' + error.message)
    }
  }

  /**
   * Rotate credentials periodically
   */
  setupCredentialRotation() {
    setInterval(() => {
      this.rotateCredentials()
    }, this.rotationInterval)
  }

  /**
   * Rotate stored credentials
   */
  async rotateCredentials() {
    try {
      secureLogger.audit('CREDENTIAL_ROTATION_STARTED', {
        lastRotation: new Date(this.lastRotation).toISOString()
      })
      
      // Clear expired credentials
      this.credentials.clear()
      
      // Generate new encryption key
      this.encryptionKey = this.generateEncryptionKey()
      this.lastRotation = Date.now()
      
      secureLogger.audit('CREDENTIAL_ROTATION_COMPLETED', {
        rotationTime: new Date().toISOString()
      })
      
    } catch (error) {
      secureLogger.audit('CREDENTIAL_ROTATION_FAILED', {
        error: error.message
      })
    }
  }

  /**
   * Clear all credentials (logout/security incident)
   */
  async clearAllCredentials() {
    try {
      this.credentials.clear()
      
      // Clear from secure storage
      const credentialTypes = Object.values(CREDENTIAL_TYPES)
      for (const type of credentialTypes) {
        const key = `credential_${type}`
        secureStorage.removeSecureItem(key)
      }
      
      secureLogger.audit('ALL_CREDENTIALS_CLEARED', {
        timestamp: new Date().toISOString()
      })
      
    } catch (error) {
      secureLogger.audit('CREDENTIAL_CLEAR_FAILED', {
        error: error.message
      })
    }
  }

  /**
   * Validate credential format and security
   */
  validateCredential(type, credential) {
    if (!credential || typeof credential !== 'string') {
      return { valid: false, reason: 'Invalid credential format' }
    }

    // Basic security checks
    const checks = {
      minLength: credential.length >= 16,
      notEmpty: credential.trim().length > 0,
      notPlaintext: !credential.includes('password') && !credential.includes('secret'),
      hasComplexity: /[A-Za-z0-9]/.test(credential)
    }

    const failedChecks = Object.entries(checks)
      .filter(([, passed]) => !passed)
      .map(([check]) => check)

    return {
      valid: failedChecks.length === 0,
      reason: failedChecks.length > 0 ? `Failed checks: ${failedChecks.join(', ')}` : 'Valid',
      checks
    }
  }

  /**
   * Get credential manager status
   */
  getStatus() {
    return {
      encryptionKeyGenerated: !!this.encryptionKey,
      lastRotation: new Date(this.lastRotation).toISOString(),
      nextRotation: new Date(this.lastRotation + this.rotationInterval).toISOString(),
      credentialsInMemory: this.credentials.size,
      rotationInterval: this.rotationInterval
    }
  }
}

// Create global credential manager instance
export const credentialManager = new SecureCredentialManager()

// Convenience functions
export const getApiKey = (environment) => 
  credentialManager.getCredential(CREDENTIAL_TYPES.API_KEY, environment)

export const getAuthToken = (environment) => 
  credentialManager.getCredential(CREDENTIAL_TYPES.AUTH_TOKEN, environment)

export const storeApiKey = (apiKey) => 
  credentialManager.storeCredential(CREDENTIAL_TYPES.API_KEY, apiKey)

export const clearCredentials = () => 
  credentialManager.clearAllCredentials()

export default credentialManager