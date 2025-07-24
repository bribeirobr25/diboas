import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { checkAuthRateLimit, checkPasswordRateLimit } from '../utils/advancedRateLimiter.js'

/**
 * Authentication error types for user-friendly messages
 */
const AUTH_ERRORS = {
  NETWORK_ERROR: 'network_error',
  INVALID_CREDENTIALS: 'invalid_credentials',
  EMAIL_EXISTS: 'email_exists',
  WEAK_PASSWORD: 'weak_password',
  PROVIDER_ERROR: 'provider_error',
  WALLET_ERROR: 'wallet_error',
  TIMEOUT: 'timeout',
  RATE_LIMITED: 'rate_limited',
  BLOCKED: 'blocked',
  UNKNOWN: 'unknown'
}

/**
 * User-friendly error messages
 */
const ERROR_MESSAGES = {
  [AUTH_ERRORS.NETWORK_ERROR]: {
    title: 'Connection Error',
    message: 'Unable to connect to diBoaS servers. Please check your internet connection and try again.',
    action: 'Retry'
  },
  [AUTH_ERRORS.INVALID_CREDENTIALS]: {
    title: 'Invalid Credentials',
    message: 'The email or password you entered is incorrect. Please check your details and try again.',
    action: 'Try Again'
  },
  [AUTH_ERRORS.EMAIL_EXISTS]: {
    title: 'Email Already Registered',
    message: 'An account with this email already exists. Please sign in instead or use a different email.',
    action: 'Sign In'
  },
  [AUTH_ERRORS.WEAK_PASSWORD]: {
    title: 'Password Too Weak',
    message: 'Password must be at least 8 characters with uppercase, lowercase, number, and special character.',
    action: 'Choose Stronger Password'
  },
  [AUTH_ERRORS.PROVIDER_ERROR]: {
    title: 'Provider Connection Failed',
    message: 'Unable to connect with the selected provider. Please try again or use a different method.',
    action: 'Try Different Method'
  },
  [AUTH_ERRORS.WALLET_ERROR]: {
    title: 'Wallet Connection Failed',
    message: 'Unable to connect to your wallet. Please make sure it\'s installed and unlocked.',
    action: 'Check Wallet'
  },
  [AUTH_ERRORS.TIMEOUT]: {
    title: 'Request Timeout',
    message: 'The request is taking longer than expected. Please try again.',
    action: 'Try Again'
  },
  [AUTH_ERRORS.RATE_LIMITED]: {
    title: 'Too Many Attempts',
    message: 'Too many authentication attempts. Please wait before trying again.',
    action: 'Wait and Retry'
  },
  [AUTH_ERRORS.BLOCKED]: {
    title: 'Account Temporarily Blocked',
    message: 'Your account has been temporarily blocked for security reasons. Please contact support.',
    action: 'Contact Support'
  },
  [AUTH_ERRORS.UNKNOWN]: {
    title: 'Unexpected Error',
    message: 'Something went wrong. Please try again or contact support if the problem persists.',
    action: 'Try Again'
  }
}

/**
 * Reusable authentication hook with comprehensive error handling
 * Eliminates authentication logic duplication across components
 */
export function useAuthentication() {
  const navigate = useNavigate()
  const [isProcessingAuth, setIsProcessingAuth] = useState(false)
  const [currentProcessingStep, setCurrentProcessingStep] = useState('')
  const [authError, setAuthError] = useState(null)
  const [retryCount, setRetryCount] = useState(0)

  /**
   * Enhanced email authentication with comprehensive error handling
   */
  const processEmailAuthentication = async (email, password, isRegistering = true) => {
    // Clear previous errors
    setAuthError(null)
    setIsProcessingAuth(true)
    
    try {
      // Check rate limiting first
      const userIdentifier = email || 'anonymous'
      const rateLimitResult = checkAuthRateLimit(userIdentifier, {
        operation: isRegistering ? 'signup' : 'signin',
        email: email,
        userAgent: navigator.userAgent
      })
      
      if (!rateLimitResult.allowed) {
        if (rateLimitResult.reason === 'BLOCKED') {
          throw new AuthError(AUTH_ERRORS.BLOCKED)
        } else {
          throw new AuthError(AUTH_ERRORS.RATE_LIMITED, 
            `Please wait ${Math.ceil(rateLimitResult.retryAfter / 1000)} seconds before trying again.`)
        }
      }
      
      // Input validation
      const validationError = validateEmailPassword(email, password, isRegistering)
      if (validationError) {
        throw new AuthError(validationError.type, validationError.message)
      }
      
      // Set timeout for the operation
      const authPromise = performEmailAuthentication(email, password, isRegistering)
      const timeoutPromise = createTimeoutPromise(30000) // 30 second timeout
      
      await Promise.race([authPromise, timeoutPromise])
      
      // Success - reset retry count and navigate
      setRetryCount(0)
      setIsProcessingAuth(false)
      navigate('/app')
      
    } catch (error) {
      setIsProcessingAuth(false)
      handleAuthError(error)
    }
  }
  
  /**
   * Internal function to handle email authentication steps
   */
  const performEmailAuthentication = async (email, password, isRegistering) => {
    if (isRegistering) {
      setCurrentProcessingStep('Validating email address...')
      await simulateAPICall(1000)
      
      // Simulate email existence check
      if (email.toLowerCase().includes('existing')) {
        throw new AuthError(AUTH_ERRORS.EMAIL_EXISTS)
      }
      
      setCurrentProcessingStep('Creating diBoaS account...')
      await simulateAPICall(2000)
      
      setCurrentProcessingStep('Setting up your wallet...')
      await simulateAPICall(2000)
      
      setCurrentProcessingStep('Finalizing setup...')
      await simulateAPICall(1000)
    } else {
      setCurrentProcessingStep('Verifying credentials...')
      await simulateAPICall(1000)
      
      // Simulate invalid credentials
      if (email.toLowerCase().includes('invalid') || password === 'wrong') {
        throw new AuthError(AUTH_ERRORS.INVALID_CREDENTIALS)
      }
      
      setCurrentProcessingStep('Signing you in...')
      await simulateAPICall(1500)
    }
  }

  /**
   * Enhanced social provider authentication with error handling
   */
  const connectWithSocialProvider = async (providerName, isRegistering = true) => {
    setAuthError(null)
    setIsProcessingAuth(true)
    
    try {
      setCurrentProcessingStep(`Opening ${providerName} login...`)
      await simulateAPICall(500)
      
      // Simulate provider rejection (for demo)
      if (providerName.toLowerCase() === 'rejected') {
        throw new AuthError(AUTH_ERRORS.PROVIDER_ERROR)
      }
      
      setCurrentProcessingStep(`Connecting with ${providerName}...`)
      await simulateAPICall(1500)
      
      if (isRegistering) {
        setCurrentProcessingStep('Creating diBoaS account...')
        await simulateAPICall(2000)
        
        setCurrentProcessingStep('Setting up your wallet...')
        await simulateAPICall(2000)
      }
      
      setRetryCount(0)
      setIsProcessingAuth(false)
      navigate('/app')
      
    } catch (error) {
      setIsProcessingAuth(false)
      handleAuthError(error)
    }
  }

  /**
   * Enhanced crypto wallet connection with error handling
   */
  const connectCryptoWallet = async (walletName, isRegistering = true) => {
    setAuthError(null)
    setIsProcessingAuth(true)
    
    try {
      setCurrentProcessingStep(`Checking ${walletName} installation...`)
      await simulateAPICall(500)
      
      // Simulate wallet not installed
      if (walletName.toLowerCase() === 'notinstalled') {
        throw new AuthError(AUTH_ERRORS.WALLET_ERROR, 
          `${walletName} wallet not found. Please install ${walletName} and try again.`)
      }
      
      setCurrentProcessingStep(`Connecting ${walletName} wallet...`)
      await simulateAPICall(2000)
      
      if (isRegistering) {
        setCurrentProcessingStep('Creating diBoaS account...')
        await simulateAPICall(2000)
        
        setCurrentProcessingStep('Linking your wallet...')
        await simulateAPICall(1500)
      }
      
      setRetryCount(0)
      setIsProcessingAuth(false)
      navigate('/app')
      
    } catch (error) {
      setIsProcessingAuth(false)
      handleAuthError(error)
    }
  }

  /**
   * Handles authentication errors with user-friendly messages
   */
  const handleAuthError = (error) => {
    console.error('Authentication error:', error)
    
    let errorType = AUTH_ERRORS.UNKNOWN
    let customMessage = null
    
    if (error instanceof AuthError) {
      errorType = error.type
      customMessage = error.message
    } else if (error.name === 'TimeoutError') {
      errorType = AUTH_ERRORS.TIMEOUT
    } else if (error.message?.includes('network') || error.message?.includes('fetch')) {
      errorType = AUTH_ERRORS.NETWORK_ERROR
    }
    
    const errorInfo = ERROR_MESSAGES[errorType]
    setAuthError({
      type: errorType,
      title: errorInfo.title,
      message: customMessage || errorInfo.message,
      action: errorInfo.action,
      canRetry: !([AUTH_ERRORS.INVALID_CREDENTIALS, AUTH_ERRORS.EMAIL_EXISTS, AUTH_ERRORS.WEAK_PASSWORD].includes(errorType))
    })
    
    setRetryCount(prev => prev + 1)
  }
  
  /**
   * Clears current error state
   */
  const clearError = () => {
    setAuthError(null)
  }
  
  /**
   * Retries the last failed operation
   */
  const retryAuthentication = () => {
    setAuthError(null)
    // Note: In a real implementation, you'd store the last operation parameters
    // For this demo, we just clear the error and let the user try again
  }

  return {
    isProcessingAuth,
    currentProcessingStep,
    authError,
    retryCount,
    processEmailAuthentication,
    connectWithSocialProvider,
    connectCryptoWallet,
    clearError,
    retryAuthentication
  }
}

/**
 * Custom error class for authentication errors
 */
class AuthError extends Error {
  constructor(type, message = null) {
    super(message || ERROR_MESSAGES[type]?.message || 'Authentication error')
    this.name = 'AuthError'
    this.type = type
  }
}

/**
 * Enhanced utility function to simulate API calls with potential failures
 */
function simulateAPICall(ms, failureRate = 0.05) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // Simulate random network failures
      if (Math.random() < failureRate) {
        reject(new AuthError(AUTH_ERRORS.NETWORK_ERROR))
      } else {
        resolve()
      }
    }, ms)
  })
}

/**
 * Creates a timeout promise for racing against long operations
 */
function createTimeoutPromise(ms) {
  return new Promise((_, reject) => {
    setTimeout(() => {
      const error = new Error('Operation timed out')
      error.name = 'TimeoutError'
      reject(error)
    }, ms)
  })
}

/**
 * Validates email and password inputs
 */
function validateEmailPassword(email, password, isRegistering) {
  if (!email || !email.trim()) {
    return { type: AUTH_ERRORS.INVALID_CREDENTIALS, message: 'Email is required' }
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  if (!emailRegex.test(email)) {
    return { type: AUTH_ERRORS.INVALID_CREDENTIALS, message: 'Please enter a valid email address' }
  }
  
  if (!password || password.length < 3) {
    return { type: AUTH_ERRORS.INVALID_CREDENTIALS, message: 'Password is required' }
  }
  
  if (isRegistering) {
    if (password.length < 8) {
      return { type: AUTH_ERRORS.WEAK_PASSWORD }
    }
    
    const hasUppercase = /[A-Z]/.test(password)
    const hasLowercase = /[a-z]/.test(password)
    const hasNumber = /\d/.test(password)
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password)
    
    if (!(hasUppercase && hasLowercase && hasNumber && hasSpecial)) {
      return { type: AUTH_ERRORS.WEAK_PASSWORD }
    }
  }
  
  return null
}

export { AUTH_ERRORS, ERROR_MESSAGES }