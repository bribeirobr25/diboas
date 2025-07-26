/**
 * Integration Hook
 * React hook for accessing provider-agnostic integrations
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { getIntegrationManager } from '../services/integrations/IntegrationManager.js'
import { secureStorage } from '../utils/secureStorage.js'

export const useIntegrations = () => {
  const [integrationManager, setIntegrationManager] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState(null)
  const initializationRef = useRef(null)

  // Initialize integration manager
  useEffect(() => {
    if (initializationRef.current) {
      return // Already initializing
    }

    initializationRef.current = getIntegrationManager()
      .then(manager => {
        setIntegrationManager(manager)
        setIsInitialized(true)
        setError(null)
      })
      .catch(err => {
        setError(err)
        setIsInitialized(false)
      })

    return () => {
      // Cleanup if component unmounts during initialization
      if (initializationRef.current) {
        initializationRef.current = null
      }
    }
  }, [])

  return {
    integrationManager,
    isInitialized,
    error
  }
}

/**
 * Authentication Hook
 */
export const useAuth = () => {
  const { integrationManager, isInitialized } = useIntegrations()
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState(() => {
    // Initialize with demo user immediately to prevent loops
    return {
      id: 'demo_user_12345',
      email: 'demo@diboas.com',
      name: 'Demo User',
      wallets: {
        BTC: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh',
        ETH: '0x742d35Cc6634C0532925a3b8D0b2B0B04D4A9A47',
        SOL: 'J3dxNj7nDRRqRRXuEMynDG57DkZK4jYRuv3Garmb1i99',
        SUI: '0x123456789abcdef123456789abcdef123456789abcdef'
      },
      settings: {
        twoFAEnabled: true,
        notifications: true,
        currency: 'USD'
      },
      createdAt: new Date().toISOString(),
      lastLogin: new Date().toISOString()
    }
  })
  const [error, setError] = useState(null)

  // Sign in with email/password
  const signInWithEmail = useCallback(async (email, password) => {
    if (!integrationManager) throw new Error('Integration manager not ready')

    setIsLoading(true)
    setError(null)

    try {
      const result = await integrationManager.execute(
        'auth',
        'authenticate',
        { email, password, isSignUp: false }
      )

      if (result.success) {
        setUser(result.result.user)
        // Store token in secure encrypted storage
        await secureStorage.setSecureItem('authToken', result.result.token, 'auth-session-key')
      }

      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [integrationManager])

  // Sign up with email/password
  const signUpWithEmail = useCallback(async (email, password, options = {}) => {
    if (!integrationManager) throw new Error('Integration manager not ready')

    setIsLoading(true)
    setError(null)

    try {
      const result = await integrationManager.execute(
        'auth',
        'authenticate',
        { email, password, isSignUp: true, ...options }
      )

      if (result.success) {
        setUser(result.result.user)
        await secureStorage.setSecureItem('authToken', result.result.token, 'auth-session-key')
      }

      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [integrationManager])

  // Sign in with social provider
  const signInWithSocial = useCallback(async (provider, credentials) => {
    if (!integrationManager) throw new Error('Integration manager not ready')

    setIsLoading(true)
    setError(null)

    try {
      const result = await integrationManager.execute(
        'auth',
        'authenticate',
        { provider, ...credentials },
        { providerId: 'social' }
      )

      if (result.success) {
        setUser(result.result.user)
        await secureStorage.setSecureItem('authToken', result.result.token, 'auth-session-key')
      }

      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [integrationManager])

  // Sign out
  const signOut = useCallback(async () => {
    if (!integrationManager || !user) return

    setIsLoading(true)
    setError(null)

    try {
      await integrationManager.execute(
        'auth',
        'signOut',
        { userId: user.id }
      )

      setUser(null)
      localStorage.removeItem('authToken')
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [integrationManager, user])

  return {
    user,
    isLoading,
    error,
    isInitialized,
    signInWithEmail,
    signUpWithEmail,
    signInWithSocial,
    signOut
  }
}

/**
 * Payment Hook
 */
export const usePayments = () => {
  const { integrationManager, isInitialized } = useIntegrations()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState(null)

  // Process payment
  const processPayment = useCallback(async (paymentRequest, options = {}) => {
    if (!integrationManager) throw new Error('Integration manager not ready')

    setIsProcessing(true)
    setError(null)

    try {
      const result = await integrationManager.execute(
        'payment',
        'processPayment',
        paymentRequest,
        options
      )

      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [integrationManager])

  // Process payment with fallback
  const processPaymentWithFallback = useCallback(async (paymentRequest, options = {}) => {
    if (!integrationManager) throw new Error('Integration manager not ready')

    setIsProcessing(true)
    setError(null)

    try {
      const result = await integrationManager.execute(
        'payment',
        'processPaymentWithFallback',
        paymentRequest,
        options
      )

      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsProcessing(false)
    }
  }, [integrationManager])

  // Get available payment methods
  const getPaymentMethods = useCallback(async (filters = {}) => {
    if (!integrationManager) return []

    try {
      const result = await integrationManager.execute(
        'payment',
        'getAvailablePaymentMethods',
        filters
      )

      return result.success ? result.result : []
    } catch (err) {
      setError(err)
      return []
    }
  }, [integrationManager])

  // Calculate fees
  const calculateFees = useCallback(async (paymentRequest) => {
    if (!integrationManager) return null

    try {
      const result = await integrationManager.execute(
        'payment',
        'calculateFeesAcrossProviders',
        paymentRequest
      )

      return result.success ? result.result : null
    } catch (err) {
      setError(err)
      return null
    }
  }, [integrationManager])

  return {
    isProcessing,
    error,
    isInitialized,
    processPayment,
    processPaymentWithFallback,
    getPaymentMethods,
    calculateFees
  }
}

/**
 * Wallet Hook
 */
export const useWallet = () => {
  const { integrationManager, isInitialized } = useIntegrations()
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectedWallet, setConnectedWallet] = useState(null)
  const [error, setError] = useState(null)

  // Connect wallet
  const connectWallet = useCallback(async (walletType, options = {}) => {
    if (!integrationManager) throw new Error('Integration manager not ready')

    setIsConnecting(true)
    setError(null)

    try {
      const result = await integrationManager.execute(
        'wallet',
        'connect',
        { walletType, ...options }
      )

      if (result.success) {
        setConnectedWallet(result.result)
      }

      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsConnecting(false)
    }
  }, [integrationManager])

  // Disconnect wallet
  const disconnectWallet = useCallback(async () => {
    if (!integrationManager || !connectedWallet) return

    setIsConnecting(true)
    setError(null)

    try {
      await integrationManager.execute(
        'wallet',
        'disconnect',
        { walletId: connectedWallet.id }
      )

      setConnectedWallet(null)
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsConnecting(false)
    }
  }, [integrationManager, connectedWallet])

  // Send transaction
  const sendTransaction = useCallback(async (transactionData) => {
    if (!integrationManager || !connectedWallet) {
      throw new Error('Wallet not connected')
    }

    setIsConnecting(true)
    setError(null)

    try {
      const result = await integrationManager.execute(
        'onchain',
        'sendTransaction',
        { ...transactionData, wallet: connectedWallet }
      )

      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsConnecting(false)
    }
  }, [integrationManager, connectedWallet])

  return {
    connectedWallet,
    isConnecting,
    error,
    isInitialized,
    connectWallet,
    disconnectWallet,
    sendTransaction
  }
}

/**
 * KYC Hook
 */
export const useKYC = () => {
  const { integrationManager, isInitialized } = useIntegrations()
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState(null)
  const [error, setError] = useState(null)

  // Start KYC verification
  const startVerification = useCallback(async (userData) => {
    if (!integrationManager) throw new Error('Integration manager not ready')

    setIsVerifying(true)
    setError(null)

    try {
      const result = await integrationManager.execute(
        'kyc',
        'startVerification',
        userData
      )

      if (result.success) {
        setVerificationStatus(result.result)
      }

      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsVerifying(false)
    }
  }, [integrationManager])

  // Check verification status
  const checkStatus = useCallback(async (verificationId) => {
    if (!integrationManager) throw new Error('Integration manager not ready')

    try {
      const result = await integrationManager.execute(
        'kyc',
        'checkStatus',
        { verificationId }
      )

      if (result.success) {
        setVerificationStatus(result.result)
      }

      return result
    } catch (err) {
      setError(err)
      throw err
    }
  }, [integrationManager])

  return {
    verificationStatus,
    isVerifying,
    error,
    isInitialized,
    startVerification,
    checkStatus
  }
}

/**
 * Two-Factor Authentication Hook
 */
export const useTwoFA = () => {
  const { integrationManager, isInitialized } = useIntegrations()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)

  // Send 2FA code
  const sendCode = useCallback(async (method, destination) => {
    if (!integrationManager) throw new Error('Integration manager not ready')

    setIsLoading(true)
    setError(null)

    try {
      const result = await integrationManager.execute(
        'twofa',
        'sendCode',
        { method, destination }
      )

      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [integrationManager])

  // Verify 2FA code
  const verifyCode = useCallback(async (code, sessionId) => {
    if (!integrationManager) throw new Error('Integration manager not ready')

    setIsLoading(true)
    setError(null)

    try {
      const result = await integrationManager.execute(
        'twofa',
        'verifyCode',
        { code, sessionId }
      )

      return result
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsLoading(false)
    }
  }, [integrationManager])

  return {
    isLoading,
    error,
    isInitialized,
    sendCode,
    verifyCode
  }
}

export default {
  useIntegrations,
  useAuth,
  usePayments,
  useWallet,
  useKYC,
  useTwoFA
}