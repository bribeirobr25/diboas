/**
 * Email Authentication Provider
 * Handles traditional email/password authentication
 */

import { AuthResult } from '../AuthResult.js'
import { AuthError } from '../AuthError.js'

export class EmailAuthProvider {
  constructor(config) {
    this.config = config
    this.name = 'EmailAuthProvider'
    this.mockUsers = new Map() // For development mode
  }

  /**
   * Authenticate with email and password
   */
  async authenticate(credentials, options = {}) {
    const { email, password, isSignUp = false } = credentials

    if (!email || !password) {
      throw new AuthError('Email and password are required', 'email')
    }

    if (!this._isValidEmail(email)) {
      throw new AuthError('Invalid email format', 'email')
    }

    try {
      if (isSignUp) {
        return await this._signUp(email, password, options)
      } else {
        return await this._signIn(email, password, options)
      }
    } catch (error) {
      throw new AuthError(error.message, 'email', error)
    }
  }

  /**
   * Sign up new user
   */
  async _signUp(email, password, options) {
    // Validate password strength
    if (!this._isStrongPassword(password)) {
      throw new AuthError('Password must be at least 8 characters with mixed case, numbers, and symbols', 'email')
    }

    // In development/mock mode
    if (import.meta.env.DEV || options.mock) {
      return await this._mockSignUp(email, password, options)
    }

    // Real implementation would integrate with backend auth service
    // Example with Supabase:
    /*
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(this.config.config.url, this.config.config.anonKey)
    
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: options.fullName,
          avatar_url: options.avatarUrl
        }
      }
    })
    
    if (error) throw new AuthError(error.message, 'email')
    */

    // Mock implementation for development
    return this._mockSignUp(email, password, options)
  }

  /**
   * Sign in existing user
   */
  async _signIn(email, password, options) {
    // In development/mock mode
    if (import.meta.env.DEV || options.mock) {
      return await this._mockSignIn(email, password, options)
    }

    // Real implementation would verify credentials with backend
    // Example with Supabase:
    /*
    const { createClient } = require('@supabase/supabase-js')
    const supabase = createClient(this.config.config.url, this.config.config.anonKey)
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) throw new AuthError(error.message, 'email')
    */

    // Mock implementation for development
    return this._mockSignIn(email, password, options)
  }

  /**
   * Verify authentication token
   */
  async verifyToken(token, options = {}) {
    try {
      // In development/mock mode
      if (import.meta.env.DEV || options.mock) {
        return this._mockTokenVerification(token)
      }

      // Real implementation would verify JWT token
      // Example:
      /*
      const jwt = require('jsonwebtoken')
      const decoded = jwt.verify(token, this.config.config.jwtSecret)
      return decoded && decoded.exp > Date.now() / 1000
      */

      return this._mockTokenVerification(token)
    } catch (error) {
      return false
    }
  }

  /**
   * Sign out user
   */
  async signOut(token, options = {}) {
    try {
      // In real implementation, might invalidate token on server
      // Example with Supabase:
      /*
      const supabase = createClient(this.config.config.url, this.config.config.anonKey)
      const { error } = await supabase.auth.signOut()
      */

      return { success: true }
    } catch (error) {
      throw new AuthError(error.message, 'email', error)
    }
  }

  /**
   * Refresh authentication token
   */
  async refreshToken(token, options = {}) {
    try {
      // In development/mock mode
      if (import.meta.env.DEV || options.mock) {
        return this._mockRefreshToken(token)
      }

      // Real implementation would refresh token with backend
      return this._mockRefreshToken(token)
    } catch (error) {
      throw new AuthError(error.message, 'email', error)
    }
  }

  /**
   * Send password reset email
   */
  async sendPasswordReset(email, options = {}) {
    if (!this._isValidEmail(email)) {
      throw new AuthError('Invalid email format', 'email')
    }

    try {
      // In development/mock mode
      if (import.meta.env.DEV || options.mock) {
        return await this._mockPasswordReset(email)
      }

      // Real implementation would send reset email
      return this._mockPasswordReset(email)
    } catch (error) {
      throw new AuthError(error.message, 'email', error)
    }
  }

  /**
   * Reset password with token
   */
  async resetPassword(token, newPassword, options = {}) {
    if (!this._isStrongPassword(newPassword)) {
      throw new AuthError('Password must be at least 8 characters with mixed case, numbers, and symbols', 'email')
    }

    try {
      // In development/mock mode
      if (import.meta.env.DEV || options.mock) {
        return await this._mockPasswordUpdate(token, newPassword)
      }

      // Real implementation would update password
      return this._mockPasswordUpdate(token, newPassword)
    } catch (error) {
      throw new AuthError(error.message, 'email', error)
    }
  }

  /**
   * Mock sign up for development
   */
  async _mockSignUp(email, password, options) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 700))

    // Check if user already exists
    if (this.mockUsers.has(email)) {
      throw new AuthError('Email already exists', 'email')
    }

    // Create mock user
    const user = {
      id: 'mock_user_' + Date.now(),
      email,
      name: options.fullName || email.split('@')[0],
      avatar: options.avatarUrl || null,
      createdAt: new Date(),
      emailVerified: false,
      provider: 'email'
    }

    // Store user (in real app, this would be in database)
    this.mockUsers.set(email, {
      ...user,
      password: this._hashPassword(password) // In real app, properly hash password
    })

    return AuthResult.success(
      user,
      this._generateJWT(user),
      {
        provider: 'email',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
        metadata: { 
          mockMode: true, 
          requiresEmailVerification: true 
        }
      }
    )
  }

  /**
   * Mock sign in for development
   */
  async _mockSignIn(email, password, options) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 600 + Math.random() * 400))

    // Check if user exists
    const userData = this.mockUsers.get(email)
    if (!userData) {
      throw new AuthError('Account not found', 'email')
    }

    // Verify password
    if (!this._verifyPassword(password, userData.password)) {
      throw new AuthError('Invalid password', 'email')
    }

    const user = {
      id: userData.id,
      email: userData.email,
      name: userData.name,
      avatar: userData.avatar,
      provider: 'email'
    }

    return AuthResult.success(
      user,
      this._generateJWT(user),
      {
        provider: 'email',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        metadata: { 
          mockMode: true,
          lastSignIn: new Date()
        }
      }
    )
  }

  /**
   * Mock token verification
   */
  _mockTokenVerification(token) {
    try {
      // Simple mock JWT verification
      if (token.startsWith('mock_jwt_')) {
        const parts = token.split('_')
        const timestamp = parseInt(parts[parts.length - 1])
        const age = Date.now() - timestamp
        
        // Token valid for 24 hours
        return age < 24 * 60 * 60 * 1000
      }
      return false
    } catch {
      return false
    }
  }

  /**
   * Mock token refresh
   */
  async _mockRefreshToken(token) {
    if (!this._mockTokenVerification(token)) {
      throw new AuthError('Invalid or expired token', 'email')
    }

    // Extract user from token (simplified)
    const newToken = 'mock_jwt_refreshed_' + Date.now()
    
    return AuthResult.success(
      null, // User data would be extracted from original token
      newToken,
      {
        provider: 'email',
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        metadata: { refreshed: true, mockMode: true }
      }
    )
  }

  /**
   * Mock password reset
   */
  async _mockPasswordReset(email) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))

    // In real implementation, this would send an email
    console.log(`[MOCK] Password reset email sent to: ${email}`)
    
    return { 
      success: true, 
      message: 'Password reset email sent',
      resetToken: 'mock_reset_' + Date.now() // In real app, this would be secure
    }
  }

  /**
   * Mock password update
   */
  async _mockPasswordUpdate(resetToken, newPassword) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500))

    if (!resetToken.startsWith('mock_reset_')) {
      throw new AuthError('Invalid reset token', 'email')
    }

    // In real implementation, would update password in database
    return { success: true, message: 'Password updated successfully' }
  }

  /**
   * Validate email format
   */
  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  /**
   * Validate password strength
   */
  _isStrongPassword(password) {
    // At least 8 characters, mixed case, numbers, and symbols
    const minLength = password.length >= 8
    const hasUpper = /[A-Z]/.test(password)
    const hasLower = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSymbol = /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)
    
    return minLength && hasUpper && hasLower && hasNumber && hasSymbol
  }

  /**
   * Hash password (simplified for mock)
   */
  _hashPassword(password) {
    // In real implementation, use bcrypt or similar
    return 'hashed_' + Buffer.from(password).toString('base64')
  }

  /**
   * Verify password (simplified for mock)
   */
  _verifyPassword(password, hashedPassword) {
    return this._hashPassword(password) === hashedPassword
  }

  /**
   * Generate JWT token (simplified for mock)
   */
  _generateJWT(user) {
    // In real implementation, use proper JWT library
    const payload = {
      sub: user.id,
      email: user.email,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
    }
    
    return 'mock_jwt_' + Buffer.from(JSON.stringify(payload)).toString('base64') + '_' + Date.now()
  }

  /**
   * Health check
   */
  async healthCheck() {
    // Check if auth service configuration is valid
    return this.config && this.config.enabled
  }

  /**
   * Get provider info
   */
  getProviderInfo() {
    return {
      name: this.name,
      features: ['signup', 'signin', 'password_reset', 'token_refresh'],
      mockMode: import.meta.env.DEV
    }
  }
}

export default EmailAuthProvider