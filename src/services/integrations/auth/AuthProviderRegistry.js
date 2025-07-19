/**
 * Authentication Provider Registry
 * Manages all authentication providers in a unified interface
 */

import { BaseProviderRegistry } from '../BaseProviderRegistry.js'
import { AuthResult } from './AuthResult.js'
import { AuthError } from './AuthError.js'

export class AuthProviderRegistry extends BaseProviderRegistry {
  constructor() {
    super('auth')
    this.activeProviders = new Map()
    this.userSessions = new Map()
  }

  /**
   * Register an authentication provider
   */
  register(providerId, provider) {
    if (!provider.authenticate || typeof provider.authenticate !== 'function') {
      throw new Error(`Auth provider ${providerId} must implement authenticate method`)
    }

    if (!provider.verifyToken || typeof provider.verifyToken !== 'function') {
      throw new Error(`Auth provider ${providerId} must implement verifyToken method`)
    }

    super.register(providerId, provider)
    this.logger.info(`Auth provider registered: ${providerId}`)
  }

  /**
   * Authenticate user with specified provider
   */
  async authenticate(providerId, credentials, options = {}) {
    const provider = this.getProvider(providerId)
    
    try {
      this.logger.info(`Starting authentication with provider: ${providerId}`)
      
      const result = await provider.authenticate(credentials, options)
      
      if (result.success) {
        // Store session information
        this.userSessions.set(result.user.id, {
          providerId,
          user: result.user,
          token: result.token,
          expiresAt: result.expiresAt,
          createdAt: new Date()
        })

        this.logger.info(`Authentication successful for user: ${result.user.id}`)
      }

      return new AuthResult(result)
    } catch (error) {
      this.logger.error(`Authentication failed with provider ${providerId}`, error)
      throw new AuthError(error.message, providerId, error)
    }
  }

  /**
   * Authenticate with automatic provider selection and fallback
   */
  async authenticateWithFallback(authType, credentials, options = {}) {
    const providers = this.getProvidersForAuthType(authType)
    
    if (providers.length === 0) {
      throw new AuthError(`No providers available for auth type: ${authType}`, null)
    }

    const errors = []

    for (const providerId of providers) {
      try {
        const result = await this.authenticate(providerId, credentials, options)
        
        if (result.success) {
          return result
        }
      } catch (error) {
        errors.push({ providerId, error })
        this.logger.warn(`Auth provider ${providerId} failed, trying next provider`)
        continue
      }
    }

    // All providers failed
    throw new AuthError('All authentication providers failed', null, errors)
  }

  /**
   * Verify authentication token
   */
  async verifyToken(token, options = {}) {
    // Try to find which provider issued this token
    for (const [userId, session] of this.userSessions) {
      if (session.token === token) {
        const provider = this.getProvider(session.providerId)
        
        try {
          const isValid = await provider.verifyToken(token, options)
          
          if (isValid && session.expiresAt > new Date()) {
            return {
              valid: true,
              user: session.user,
              providerId: session.providerId,
              expiresAt: session.expiresAt
            }
          } else if (session.expiresAt <= new Date()) {
            // Token expired, remove session
            this.userSessions.delete(userId)
            return { valid: false, reason: 'Token expired' }
          }
        } catch (error) {
          this.logger.error(`Token verification failed for provider ${session.providerId}`, error)
          return { valid: false, reason: 'Verification failed' }
        }
      }
    }

    return { valid: false, reason: 'Token not found' }
  }

  /**
   * Sign out user
   */
  async signOut(userId, options = {}) {
    const session = this.userSessions.get(userId)
    
    if (!session) {
      throw new AuthError('User session not found', null)
    }

    const provider = this.getProvider(session.providerId)
    
    try {
      // Call provider's sign out method if available
      if (provider.signOut) {
        await provider.signOut(session.token, options)
      }

      // Remove session
      this.userSessions.delete(userId)
      
      this.logger.info(`User signed out: ${userId}`)
      
      return { success: true }
    } catch (error) {
      this.logger.error(`Sign out failed for user ${userId}`, error)
      throw new AuthError(error.message, session.providerId, error)
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(userId, options = {}) {
    const session = this.userSessions.get(userId)
    
    if (!session) {
      throw new AuthError('User session not found', null)
    }

    const provider = this.getProvider(session.providerId)
    
    try {
      if (!provider.refreshToken) {
        throw new Error('Provider does not support token refresh')
      }

      const result = await provider.refreshToken(session.token, options)
      
      if (result.success) {
        // Update session with new token
        session.token = result.token
        session.expiresAt = result.expiresAt
        this.userSessions.set(userId, session)
      }

      return result
    } catch (error) {
      this.logger.error(`Token refresh failed for user ${userId}`, error)
      throw new AuthError(error.message, session.providerId, error)
    }
  }

  /**
   * Get providers for specific authentication type
   */
  getProvidersForAuthType(authType) {
    const providerMappings = {
      social: ['social'],
      email: ['email'],
      wallet: ['wallet'],
      phone: ['sms'],
      biometric: ['biometric']
    }

    const providerIds = providerMappings[authType] || []
    return providerIds.filter(id => this.providers.has(id))
  }

  /**
   * Get active user sessions
   */
  getActiveSessions() {
    return Array.from(this.userSessions.entries()).map(([userId, session]) => ({
      userId,
      providerId: session.providerId,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt
    }))
  }

  /**
   * Clean up expired sessions
   */
  cleanupExpiredSessions() {
    const now = new Date()
    let cleanedCount = 0

    for (const [userId, session] of this.userSessions) {
      if (session.expiresAt <= now) {
        this.userSessions.delete(userId)
        cleanedCount++
      }
    }

    if (cleanedCount > 0) {
      this.logger.info(`Cleaned up ${cleanedCount} expired sessions`)
    }

    return cleanedCount
  }

  /**
   * Get authentication statistics
   */
  getStats() {
    const stats = {
      totalProviders: this.providers.size,
      activeSessions: this.userSessions.size,
      providerHealth: {}
    }

    // Add provider-specific stats
    for (const [providerId, provider] of this.providers) {
      stats.providerHealth[providerId] = {
        enabled: this.isProviderHealthy(providerId),
        lastUsed: this.getProviderLastUsed(providerId)
      }
    }

    return stats
  }

  /**
   * Start session cleanup interval
   */
  startSessionCleanup(intervalMs = 300000) { // 5 minutes
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions()
    }, intervalMs)
  }

  /**
   * Stop session cleanup interval
   */
  stopSessionCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
  }

  /**
   * Shutdown the registry
   */
  async shutdown() {
    this.stopSessionCleanup()
    
    // Sign out all active sessions
    const signOutPromises = Array.from(this.userSessions.keys()).map(userId => 
      this.signOut(userId).catch(error => 
        this.logger.error(`Failed to sign out user ${userId} during shutdown`, error)
      )
    )

    await Promise.allSettled(signOutPromises)
    
    await super.shutdown()
  }
}

export default AuthProviderRegistry