/**
 * Safe Data Handling Utilities
 * Provides robust error handling for common operations that could crash the app
 * Prevents crashes from corrupted data, network failures, and parsing errors
 */

import logger from './logger'

/**
 * Safely parse JSON with fallback and corruption detection
 * @param {string} jsonString - String to parse as JSON
 * @param {*} fallback - Value to return if parsing fails
 * @param {boolean} logError - Whether to log parsing errors
 * @returns {*} Parsed object or fallback value
 */
export function safeJSONParse(jsonString, fallback = null, logError = true) {
  if (!jsonString || typeof jsonString !== 'string') {
    return fallback
  }

  try {
    const parsed = JSON.parse(jsonString)
    
    // Additional validation for common corruption patterns
    if (parsed === null && jsonString.trim() !== 'null') {
      if (logError) {
        logger.warn('safeJSONParse: Parsed null from non-null string, possible corruption:', jsonString.slice(0, 100))
      }
      return fallback
    }
    
    return parsed
  } catch (error) {
    if (logError) {
      logger.warn('safeJSONParse: Failed to parse JSON:', {
        error: error.message,
        jsonPreview: jsonString.slice(0, 100),
        fallbackType: typeof fallback
      })
    }
    return fallback
  }
}

/**
 * Safely stringify JSON with circular reference detection
 * @param {*} object - Object to stringify
 * @param {string} fallback - String to return if stringification fails
 * @param {boolean} logError - Whether to log errors
 * @returns {string} JSON string or fallback
 */
export function safeJSONStringify(object, fallback = '{}', logError = true) {
  if (object === undefined) {
    return fallback
  }

  try {
    const seen = new WeakSet()
    const result = JSON.stringify(object, (key, value) => {
      if (typeof value === 'object' && value !== null) {
        if (seen.has(value)) {
          return '[Circular Reference]'
        }
        seen.add(value)
      }
      return value
    })
    
    return result
  } catch (error) {
    if (logError) {
      logger.warn('safeJSONStringify: Failed to stringify object:', {
        error: error.message,
        objectType: typeof object,
        fallback
      })
    }
    return fallback
  }
}

/**
 * Safely access nested object properties without crashes
 * @param {object} obj - Object to access
 * @param {string} path - Dot-notation path (e.g., 'user.profile.name')
 * @param {*} fallback - Value to return if path doesn't exist
 * @returns {*} Property value or fallback
 */
export function safeGet(obj, path, fallback = undefined) {
  if (!obj || typeof obj !== 'object' || !path) {
    return fallback
  }

  try {
    const keys = path.split('.')
    let current = obj
    
    for (const key of keys) {
      if (current === null || current === undefined || typeof current !== 'object') {
        return fallback
      }
      current = current[key]
    }
    
    return current !== undefined ? current : fallback
  } catch (error) {
    logger.warn('safeGet: Error accessing path:', {
      path,
      error: error.message,
      objectType: typeof obj
    })
    return fallback
  }
}

/**
 * Safely set nested object properties without crashes
 * @param {object} obj - Object to modify
 * @param {string} path - Dot-notation path
 * @param {*} value - Value to set
 * @param {boolean} createPath - Whether to create missing intermediate objects
 * @returns {boolean} Success status
 */
export function safeSet(obj, path, value, createPath = true) {
  if (!obj || typeof obj !== 'object' || !path) {
    return false
  }

  try {
    const keys = path.split('.')
    const lastKey = keys.pop()
    let current = obj
    
    for (const key of keys) {
      if (current[key] === null || current[key] === undefined) {
        if (!createPath) return false
        current[key] = {}
      } else if (typeof current[key] !== 'object') {
        return false // Can't traverse through primitive values
      }
      current = current[key]
    }
    
    current[lastKey] = value
    return true
  } catch (error) {
    logger.warn('safeSet: Error setting path:', {
      path,
      value,
      error: error.message
    })
    return false
  }
}

/**
 * Safely parse numbers with validation
 * @param {*} value - Value to parse as number
 * @param {number} fallback - Default value if parsing fails
 * @param {object} options - Parsing options
 * @returns {number} Parsed number or fallback
 */
export function safeParseFloat(value, fallback = 0, options = {}) {
  const { min, max, allowNaN = false, allowInfinity = false } = options
  
  if (value === null || value === undefined || value === '') {
    return fallback
  }
  
  try {
    let parsed
    
    if (typeof value === 'string') {
      // Clean string input
      const cleaned = value.trim().replace(/[,$%]/g, '')
      parsed = parseFloat(cleaned)
    } else if (typeof value === 'number') {
      parsed = value
    } else {
      parsed = parseFloat(String(value))
    }
    
    // Validate result
    if (!allowNaN && isNaN(parsed)) return fallback
    if (!allowInfinity && !isFinite(parsed)) return fallback
    if (min !== undefined && parsed < min) return fallback
    if (max !== undefined && parsed > max) return fallback
    
    return parsed
  } catch (error) {
    logger.warn('safeParseFloat: Failed to parse number:', {
      value,
      error: error.message,
      fallback
    })
    return fallback
  }
}

/**
 * Safely parse integers with validation
 * @param {*} value - Value to parse as integer
 * @param {number} fallback - Default value if parsing fails
 * @param {object} options - Parsing options
 * @returns {number} Parsed integer or fallback
 */
export function safeParseInt(value, fallback = 0, options = {}) {
  const { min, max, radix = 10 } = options
  
  if (value === null || value === undefined || value === '') {
    return fallback
  }
  
  try {
    let parsed
    
    if (typeof value === 'string') {
      const cleaned = value.trim().replace(/[,$%]/g, '')
      parsed = parseInt(cleaned, radix)
    } else {
      parsed = parseInt(String(value), radix)
    }
    
    // Validate result
    if (isNaN(parsed)) return fallback
    if (min !== undefined && parsed < min) return fallback
    if (max !== undefined && parsed > max) return fallback
    
    return parsed
  } catch (error) {
    logger.warn('safeParseInt: Failed to parse integer:', {
      value,
      error: error.message,
      fallback
    })
    return fallback
  }
}

/**
 * Safely execute async function with timeout and retry logic
 * @param {Function} asyncFn - Async function to execute
 * @param {object} options - Execution options
 * @returns {Promise} Result or throws after retries exhausted
 */
export async function safeAsyncExecute(asyncFn, options = {}) {
  const {
    timeout = 30000,
    retries = 3,
    retryDelay = 1000,
    exponentialBackoff = true,
    fallback = null,
    throwOnFailure = false
  } = options
  
  let lastError
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      // Create timeout promise
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error(`Operation timed out after ${timeout}ms`)), timeout)
      })
      
      // Race between function execution and timeout
      const result = await Promise.race([
        asyncFn(),
        timeoutPromise
      ])
      
      return result
    } catch (error) {
      lastError = error
      
      logger.warn(`safeAsyncExecute: Attempt ${attempt + 1} failed:`, {
        error: error.message,
        retriesLeft: retries - attempt - 1
      })
      
      // Don't wait after the last attempt
      if (attempt < retries - 1) {
        const delay = exponentialBackoff 
          ? retryDelay * Math.pow(2, attempt)
          : retryDelay
          
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  
  if (throwOnFailure) {
    throw lastError
  }
  
  logger.error('safeAsyncExecute: All attempts failed:', {
    error: lastError.message,
    attempts: retries,
    returnFallback: fallback
  })
  
  return fallback
}

/**
 * Create a safe wrapper for any function that might throw
 * @param {Function} fn - Function to wrap
 * @param {*} fallback - Value to return on error
 * @param {boolean} logErrors - Whether to log errors
 * @returns {Function} Safe wrapped function
 */
export function createSafeWrapper(fn, fallback = null, logErrors = true) {
  return function safeFn(...args) {
    try {
      const result = fn.apply(this, args)
      
      // Handle promises
      if (result && typeof result.then === 'function') {
        return result.catch(error => {
          if (logErrors) {
            logger.warn('createSafeWrapper: Async function failed:', {
              error: error.message,
              functionName: fn.name || 'anonymous'
            })
          }
          return fallback
        })
      }
      
      return result
    } catch (error) {
      if (logErrors) {
        logger.warn('createSafeWrapper: Function failed:', {
          error: error.message,
          functionName: fn.name || 'anonymous',
          args: args.length
        })
      }
      return fallback
    }
  }
}

/**
 * Validate and sanitize user input
 * @param {string} input - User input string
 * @param {object} rules - Validation rules
 * @returns {object} Validation result with sanitized value
 */
export function safeValidateInput(input, rules = {}) {
  const {
    maxLength = 10000,
    allowedChars = null,
    trim = true,
    required = false,
    type = 'string'
  } = rules
  
  let sanitized = input
  const errors = []
  
  try {
    // Handle null/undefined
    if (sanitized === null || sanitized === undefined) {
      sanitized = ''
    }
    
    // Convert to string
    sanitized = String(sanitized)
    
    // Trim whitespace
    if (trim) {
      sanitized = sanitized.trim()
    }
    
    // Check required
    if (required && sanitized === '') {
      errors.push('Value is required')
    }
    
    // Check length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.slice(0, maxLength)
      errors.push(`Value truncated to ${maxLength} characters`)
    }
    
    // Check allowed characters
    if (allowedChars && sanitized !== '') {
      const regex = new RegExp(`^[${allowedChars}]*$`)
      if (!regex.test(sanitized)) {
        errors.push('Value contains invalid characters')
        // Remove invalid characters
        sanitized = sanitized.replace(new RegExp(`[^${allowedChars}]`, 'g'), '')
      }
    }
    
    // Type conversion
    if (type === 'number') {
      sanitized = safeParseFloat(sanitized)
    } else if (type === 'integer') {
      sanitized = safeParseInt(sanitized)
    }
    
    return {
      isValid: errors.length === 0,
      value: sanitized,
      errors,
      original: input
    }
  } catch (error) {
    logger.warn('safeValidateInput: Validation failed:', {
      error: error.message,
      input: String(input).slice(0, 100)
    })
    
    return {
      isValid: false,
      value: '',
      errors: ['Validation failed: ' + error.message],
      original: input
    }
  }
}

/**
 * Array operations with safety checks
 */
export const safeArray = {
  /**
   * Safely get array item by index
   */
  get(arr, index, fallback = undefined) {
    if (!Array.isArray(arr) || index < 0 || index >= arr.length) {
      return fallback
    }
    return arr[index]
  },
  
  /**
   * Safely find array item
   */
  find(arr, predicate, fallback = undefined) {
    if (!Array.isArray(arr) || typeof predicate !== 'function') {
      return fallback
    }
    try {
      return arr.find(predicate) || fallback
    } catch (error) {
      logger.warn('safeArray.find: Predicate failed:', error.message)
      return fallback
    }
  },
  
  /**
   * Safely filter array
   */
  filter(arr, predicate, fallback = []) {
    if (!Array.isArray(arr) || typeof predicate !== 'function') {
      return fallback
    }
    try {
      return arr.filter(predicate)
    } catch (error) {
      logger.warn('safeArray.filter: Predicate failed:', error.message)
      return fallback
    }
  },
  
  /**
   * Safely map array
   */
  map(arr, mapper, fallback = []) {
    if (!Array.isArray(arr) || typeof mapper !== 'function') {
      return fallback
    }
    try {
      return arr.map(mapper)
    } catch (error) {
      logger.warn('safeArray.map: Mapper failed:', error.message)
      return fallback
    }
  }
}

export default {
  safeJSONParse,
  safeJSONStringify,
  safeGet,
  safeSet,
  safeParseFloat,
  safeParseInt,
  safeAsyncExecute,
  createSafeWrapper,
  safeValidateInput,
  safeArray
}