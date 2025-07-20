/**
 * Two-Factor Authentication Provider Registry
 * Manages 2FA verification providers
 */

import { BaseProviderRegistry } from '../BaseProviderRegistry.js'

export class TwoFAProviderRegistry extends BaseProviderRegistry {
  constructor() {
    super('twofa')
  }

  /**
   * Send 2FA code
   */
  async sendCode(method, destination, options = {}) {
    return await this.executeWithFallback('sendCode', { method, destination, ...options })
  }

  /**
   * Verify 2FA code
   */
  async verifyCode(code, sessionId, options = {}) {
    return await this.executeWithFallback('verifyCode', { code, sessionId, ...options })
  }

  /**
   * Setup 2FA for user
   */
  async setup2FA(userId, method, options = {}) {
    return await this.executeWithFallback('setup2FA', { userId, method, ...options })
  }

  /**
   * Disable 2FA for user
   */
  async disable2FA(userId, verificationCode, options = {}) {
    return await this.executeWithFallback('disable2FA', { userId, verificationCode, ...options })
  }

  /**
   * Get 2FA status for user
   */
  async get2FAStatus(userId, options = {}) {
    return await this.executeWithFallback('get2FAStatus', { userId, ...options })
  }

  /**
   * Generate backup codes
   */
  async generateBackupCodes(userId, options = {}) {
    return await this.executeWithFallback('generateBackupCodes', { userId, ...options })
  }

  /**
   * Verify backup code
   */
  async verifyBackupCode(userId, backupCode, options = {}) {
    return await this.executeWithFallback('verifyBackupCode', { userId, backupCode, ...options })
  }
}

export default TwoFAProviderRegistry