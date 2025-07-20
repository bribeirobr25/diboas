/**
 * KYC Provider Registry
 * Manages Know Your Customer verification providers
 */

import { BaseProviderRegistry } from '../BaseProviderRegistry.js'

export class KYCProviderRegistry extends BaseProviderRegistry {
  constructor() {
    super('kyc')
  }

  /**
   * Start KYC verification process
   */
  async startVerification(userData, options = {}) {
    return await this.executeWithFallback('startVerification', { userData, ...options })
  }

  /**
   * Check verification status
   */
  async checkStatus(verificationId, options = {}) {
    return await this.executeWithFallback('checkStatus', { verificationId, ...options })
  }

  /**
   * Submit documents for verification
   */
  async submitDocuments(verificationId, documents, options = {}) {
    return await this.executeWithFallback('submitDocuments', { verificationId, documents, ...options })
  }

  /**
   * Get verification result
   */
  async getVerificationResult(verificationId, options = {}) {
    return await this.executeWithFallback('getVerificationResult', { verificationId, ...options })
  }

  /**
   * Cancel verification
   */
  async cancelVerification(verificationId, options = {}) {
    return await this.executeWithFallback('cancelVerification', { verificationId, ...options })
  }

  /**
   * Get user KYC status
   */
  async getUserKYCStatus(userId, options = {}) {
    return await this.executeWithFallback('getUserKYCStatus', { userId, ...options })
  }
}

export default KYCProviderRegistry