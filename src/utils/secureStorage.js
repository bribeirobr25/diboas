import logger from './logger'

/**
 * Secure Storage Utility for Financial Data
 * Encrypts sensitive data before storing in localStorage
 */

/**
 * Simple but secure encryption for client-side data
 * Uses Web Crypto API with AES-GCM encryption
 */
class SecureFinancialStorage {
  constructor() {
    this.algorithm = 'AES-GCM'
    this.keyLength = 256
    this.ivLength = 12
  }

  /**
   * Generate a cryptographic key from a password/seed
   */
  async deriveKey(password) {
    const encoder = new TextEncoder()
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveKey']
    )

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: encoder.encode('diboas-secure-salt-2024'), // Static salt for demo
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: this.algorithm, length: this.keyLength },
      false,
      ['encrypt', 'decrypt']
    )
  }

  /**
   * Encrypt data for secure storage
   */
  async encryptData(data, userKey = 'diboas-demo-encryption-key') {
    try {
      const key = await this.deriveKey(userKey)
      const encoder = new TextEncoder()
      const encodedData = encoder.encode(JSON.stringify(data))
      
      const iv = crypto.getRandomValues(new Uint8Array(this.ivLength))
      
      const encryptedData = await crypto.subtle.encrypt(
        { name: this.algorithm, iv: iv },
        key,
        encodedData
      )

      // Combine IV and encrypted data
      const combined = new Uint8Array(iv.length + encryptedData.byteLength)
      combined.set(iv)
      combined.set(new Uint8Array(encryptedData), iv.length)

      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combined))
    } catch (error) {
      logger.error('Encryption failed:', error)
      throw new Error('Failed to encrypt financial data')
    }
  }

  /**
   * Decrypt data from secure storage
   */
  async decryptData(encryptedData, userKey = 'diboas-demo-encryption-key') {
    try {
      const key = await this.deriveKey(userKey)
      
      // Convert from base64
      const combined = new Uint8Array(
        atob(encryptedData).split('').map(char => char.charCodeAt(0))
      )
      
      // Extract IV and encrypted data
      const iv = combined.slice(0, this.ivLength)
      const encrypted = combined.slice(this.ivLength)

      const decryptedData = await crypto.subtle.decrypt(
        { name: this.algorithm, iv: iv },
        key,
        encrypted
      )

      const decoder = new TextDecoder()
      const decryptedString = decoder.decode(decryptedData)
      
      return JSON.parse(decryptedString)
    } catch (error) {
      logger.error('Decryption failed:', error)
      // Return null for invalid/corrupted data instead of throwing
      return null
    }
  }

  /**
   * Securely store financial data
   */
  async setSecureItem(key, data, userKey) {
    try {
      const encryptedData = await this.encryptData(data, userKey)
      localStorage.setItem(key, encryptedData)
      return true
    } catch (error) {
      logger.error('Secure storage failed:', error)
      return false
    }
  }

  /**
   * Securely retrieve financial data
   */
  async getSecureItem(key, userKey) {
    try {
      const encryptedData = localStorage.getItem(key)
      if (!encryptedData) return null
      
      return await this.decryptData(encryptedData, userKey)
    } catch (error) {
      logger.error('Secure retrieval failed:', error)
      return null
    }
  }

  /**
   * Remove encrypted data
   */
  removeSecureItem(key) {
    localStorage.removeItem(key)
  }

  /**
   * Clear all encrypted financial data
   */
  clearAllSecureData(userId) {
    const patterns = [
      `diboas_balance_state_${userId}`,
      `diboas_transaction_history_${userId}`,
      `diboas_portfolio_${userId}`,
      `diboas_preferences_${userId}`
    ]
    
    patterns.forEach(pattern => {
      this.removeSecureItem(pattern)
    })
  }
}

// Export singleton instance
export const secureStorage = new SecureFinancialStorage()

// Export class for testing
export { SecureFinancialStorage }

export default secureStorage