/**
 * Auth Result
 * Standardized result object for authentication operations
 */

export class AuthResult {
  constructor(data = {}) {
    this.success = data.success || false
    this.user = data.user || null
    this.token = data.token || null
    this.refreshToken = data.refreshToken || null
    this.expiresAt = data.expiresAt || null
    this.provider = data.provider || null
    this.error = data.error || null
    this.metadata = data.metadata || {}
  }

  /**
   * Create a successful auth result
   */
  static success(user, token, options = {}) {
    return new AuthResult({
      success: true,
      user,
      token,
      refreshToken: options.refreshToken,
      expiresAt: options.expiresAt || new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours default
      provider: options.provider,
      metadata: options.metadata
    })
  }

  /**
   * Create a failed auth result
   */
  static failure(error, provider = null) {
    return new AuthResult({
      success: false,
      error,
      provider
    })
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      success: this.success,
      user: this.user,
      token: this.token,
      refreshToken: this.refreshToken,
      expiresAt: this.expiresAt,
      provider: this.provider,
      error: this.error,
      metadata: this.metadata
    }
  }
}

export default AuthResult