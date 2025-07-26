/**
 * Secure Random Utilities
 * Cryptographically secure random number and ID generation
 */

/**
 * Generate a cryptographically secure random string
 * @param {number} length - Length of the random string
 * @returns {string} Secure random string
 */
export const generateSecureRandomString = (length = 32) => {
  // Use browser crypto API for secure random bytes
  const array = new Uint8Array(Math.ceil(length / 2))
  crypto.getRandomValues(array)
  
  return Array.from(array)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    .slice(0, length)
}

/**
 * Generate a secure transaction ID
 * @param {string} prefix - Prefix for the transaction ID
 * @returns {string} Secure transaction ID
 */
export const generateSecureTransactionId = (prefix = 'tx') => {
  const timestamp = Date.now().toString(36)
  const randomPart = generateSecureRandomString(12)
  return `${prefix}_${timestamp}_${randomPart}`
}

/**
 * Generate a secure session ID
 * @returns {string} Secure session ID
 */
export const generateSecureSessionId = () => {
  return generateSecureRandomString(64)
}

/**
 * Generate a secure API key
 * @returns {string} Secure API key
 */
export const generateSecureApiKey = () => {
  const prefix = 'sk'
  const randomPart = generateSecureRandomString(48)
  return `${prefix}_${randomPart}`
}

/**
 * Generate a secure random number between min and max
 * @param {number} min - Minimum value (inclusive)
 * @param {number} max - Maximum value (exclusive)
 * @returns {number} Secure random number
 */
export const generateSecureRandomNumber = (min = 0, max = 1) => {
  const range = max - min
  const randomBytes = crypto.getRandomValues(new Uint32Array(1))[0]
  return min + (randomBytes / (0xFFFFFFFF + 1)) * range
}

/**
 * Generate a secure random boolean
 * @returns {boolean} Secure random boolean
 */
export const generateSecureRandomBoolean = () => {
  return generateSecureRandomNumber(0, 2) >= 1
}

/**
 * Generate a secure UUID v4
 * @returns {string} Secure UUID v4
 */
export const generateSecureUUID = () => {
  const randomBytes = crypto.getRandomValues(new Uint8Array(16))
  
  // Set version (4) and variant bits
  randomBytes[6] = (randomBytes[6] & 0x0f) | 0x40
  randomBytes[8] = (randomBytes[8] & 0x3f) | 0x80
  
  const hex = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  
  return [
    hex.slice(0, 8),
    hex.slice(8, 12),
    hex.slice(12, 16),
    hex.slice(16, 20),
    hex.slice(20, 32)
  ].join('-')
}

/**
 * Generate a secure random array of specified length
 * @param {number} length - Length of the array
 * @param {number} min - Minimum value for each element
 * @param {number} max - Maximum value for each element
 * @returns {number[]} Array of secure random numbers
 */
export const generateSecureRandomArray = (length, min = 0, max = 1) => {
  return Array.from({ length }, () => generateSecureRandomNumber(min, max))
}

/**
 * Shuffle an array securely
 * @param {any[]} array - Array to shuffle
 * @returns {any[]} Shuffled array (new array, original unchanged)
 */
export const secureArrayShuffle = (array) => {
  const shuffled = [...array]
  
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(generateSecureRandomNumber(0, i + 1))
    ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
  }
  
  return shuffled
}

export default {
  generateSecureRandomString,
  generateSecureTransactionId,
  generateSecureSessionId,
  generateSecureApiKey,
  generateSecureRandomNumber,
  generateSecureRandomBoolean,
  generateSecureUUID,
  generateSecureRandomArray,
  secureArrayShuffle
}