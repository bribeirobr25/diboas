/**
 * Transaction Types Hook
 * Provides dynamic transaction type configurations with icons and metadata
 */

import React, { useState, useEffect, useCallback } from 'react'
import { Plus, Send, TrendingUp, TrendingDown, CreditCard, ArrowRight, Play } from 'lucide-react'
import { mockupTransactionTypeProviderService } from '../services/transactions/MockupTransactionTypeProviderService'
import logger from '../utils/logger'

// Icon mapping for transaction types
const ICON_MAP = {
  'plus': Plus,
  'send': Send,
  'trending_up': TrendingUp,
  'trending_down': TrendingDown,
  'credit_card': CreditCard,
  'arrow_right': ArrowRight,
  'play': Play
}

export const useTransactionTypes = (category = null, userId = null) => {
  const [transactionTypes, setTransactionTypes] = useState([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  // Convert icon type to JSX component
  const formatTransactionTypes = (types) => {
    return types.map(type => ({
      ...type,
      icon: ICON_MAP[type.iconType] ? 
        React.createElement(ICON_MAP[type.iconType], { className: "w-4 h-4" }) : 
        React.createElement(Plus, { className: "w-4 h-4" }) // fallback
    }))
  }

  // Load transaction types
  const loadTransactionTypes = useCallback(async (forceRefresh = false) => {
    if (!forceRefresh && transactionTypes.length > 0 && 
        Date.now() - lastUpdated < 300000) { // 5 minute cache
      return transactionTypes
    }

    setIsLoading(true)
    setError(null)

    try {
      let types
      
      if (category) {
        types = await mockupTransactionTypeProviderService.getTransactionTypesByCategory(category)
      } else if (userId) {
        types = await mockupTransactionTypeProviderService.getTransactionTypesForUser(userId)
      } else {
        types = await mockupTransactionTypeProviderService.getAllTransactionTypes()
      }

      const formattedTypes = formatTransactionTypes(types)
      setTransactionTypes(formattedTypes)
      setLastUpdated(Date.now())
      
      logger.debug('useTransactionTypes: Loaded transaction types:', {
        count: formattedTypes.length,
        category,
        userId
      })

      return formattedTypes
    } catch (err) {
      logger.error('useTransactionTypes: Failed to load transaction types:', err)
      setError(err)
      
      // Try to use fallback data
      try {
        const fallbackTypes = await mockupTransactionTypeProviderService._getFallbackTransactionTypes()
        const formattedFallback = formatTransactionTypes(fallbackTypes)
        setTransactionTypes(formattedFallback)
        return formattedFallback
      } catch (fallbackError) {
        logger.error('useTransactionTypes: Fallback also failed:', fallbackError)
        throw err
      }
    } finally {
      setIsLoading(false)
    }
  }, [category, userId, transactionTypes, lastUpdated])

  // Get transaction type by ID
  const getTransactionTypeById = useCallback(async (typeId) => {
    try {
      const type = await mockupTransactionTypeProviderService.getTransactionTypeById(typeId)
      if (type) {
        const formatted = formatTransactionTypes([type])
        return formatted[0]
      }
      return null
    } catch (err) {
      logger.error('useTransactionTypes: Failed to get transaction type by ID:', err)
      return null
    }
  }, [])

  // Get recommended transaction types for user
  const getRecommendedTypes = useCallback(async (userActivity = {}) => {
    if (!userId) return []

    try {
      const types = await mockupTransactionTypeProviderService.getRecommendedTransactionTypes(userId, userActivity)
      return formatTransactionTypes(types)
    } catch (err) {
      logger.error('useTransactionTypes: Failed to get recommended types:', err)
      return []
    }
  }, [userId])

  // Check if transaction type is available for user
  const isTypeAvailable = useCallback((typeId, userPermissions = {}) => {
    const type = transactionTypes.find(t => t.id === typeId)
    if (!type) return false
    
    // Check basic availability
    if (!type.enabled) return false
    
    // Check auth requirements
    if (type.requiresAuth && !userPermissions.isAuthenticated) return false
    
    // Check regional support
    const userRegion = userPermissions.region || 'US'
    if (!type.supportedRegions?.includes('GLOBAL') && 
        !type.supportedRegions?.includes(userRegion)) {
      return false
    }
    
    return true
  }, [transactionTypes])

  // Filter types by multiple criteria
  const filterTypes = useCallback((filters = {}) => {
    let filtered = [...transactionTypes]
    
    if (filters.category) {
      filtered = filtered.filter(type => type.category === filters.category)
    }
    
    if (filters.enabled !== undefined) {
      filtered = filtered.filter(type => type.enabled === filters.enabled)
    }
    
    if (filters.requiresAuth !== undefined) {
      filtered = filtered.filter(type => type.requiresAuth === filters.requiresAuth)
    }
    
    if (filters.minAmount !== undefined) {
      filtered = filtered.filter(type => type.minimumAmount <= filters.minAmount)
    }
    
    if (filters.maxAmount !== undefined) {
      filtered = filtered.filter(type => type.maximumAmount >= filters.maxAmount)
    }
    
    if (filters.supportedAsset) {
      filtered = filtered.filter(type => 
        !type.supportedAssets || type.supportedAssets.includes(filters.supportedAsset)
      )
    }
    
    if (filters.supportedPaymentMethod) {
      filtered = filtered.filter(type => 
        type.supportedPaymentMethods?.includes(filters.supportedPaymentMethod)
      )
    }
    
    return filtered
  }, [transactionTypes])

  // Load on mount and when dependencies change
  useEffect(() => {
    loadTransactionTypes()
  }, [category, userId])

  return {
    transactionTypes,
    isLoading,
    error,
    lastUpdated,
    loadTransactionTypes,
    getTransactionTypeById,
    getRecommendedTypes,
    isTypeAvailable,
    filterTypes,
    refreshTransactionTypes: () => loadTransactionTypes(true)
  }
}

export default useTransactionTypes