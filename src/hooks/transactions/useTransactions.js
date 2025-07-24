/**
 * Main Transaction Hook
 * Core transaction system initialization and access
 */

import { useState, useEffect, useRef } from 'react'
import { getTransactionEngine, getWalletManager } from './transactionSingletons.js'
import { useAuth } from '../useIntegrations.jsx'

/**
 * Main transaction hook
 */
export const useTransactions = () => {
  const { user } = useAuth()
  const [transactionEngine, setTransactionEngine] = useState(null)
  const [walletManager, setWalletManager] = useState(null)
  const [isInitialized, setIsInitialized] = useState(false)
  const [error, setError] = useState(null)
  const initializationRef = useRef(null)

  // Initialize transaction system
  useEffect(() => {
    if (initializationRef.current) return

    initializationRef.current = Promise.all([
      getTransactionEngine(),
      Promise.resolve(getWalletManager())
    ])
      .then(([engine, wallet]) => {
        setTransactionEngine(engine)
        setWalletManager(wallet)
        setIsInitialized(true)
        setError(null)
      })
      .catch(err => {
        setError(err)
        setIsInitialized(false)
      })

    return () => {
      if (initializationRef.current) {
        initializationRef.current = null
      }
    }
  }, [])

  return {
    transactionEngine,
    walletManager,
    isInitialized,
    error,
    user
  }
}