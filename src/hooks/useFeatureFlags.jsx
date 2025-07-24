/**
 * React hooks for Feature Flag integration
 * Provides reactive feature flag checking with caching and optimization
 */

import { useState, useEffect, useContext, createContext, useCallback } from 'react'
import { featureFlagManager, FEATURE_FLAGS } from '../config/featureFlags.js'
import { getEnvironmentInfo } from '../config/environments.js'

/**
 * Feature Flag Context for providing user context throughout the app
 */
const FeatureFlagContext = createContext({
  userContext: {},
  setUserContext: () => {},
  isFeatureEnabled: () => false,
  getAllFeatures: () => ({}),
  refreshFlags: () => {}
})

/**
 * Feature Flag Provider Component
 * Wrap your app with this to provide feature flag functionality
 */
export function FeatureFlagProvider({ children, initialUserContext = {} }) {
  const [userContext, setUserContext] = useState(initialUserContext)
  const [featuresCache, setFeaturesCache] = useState({})
  const [lastRefresh, setLastRefresh] = useState(Date.now())

  // Refresh cache every 5 minutes or when user context changes
  useEffect(() => {
    refreshFlags()
    
    const interval = setInterval(refreshFlags, 5 * 60 * 1000) // 5 minutes
    return () => clearInterval(interval)
  }, [userContext])

  const refreshFlags = useCallback(() => {
    const allFeatures = featureFlagManager.getEnabledFeatures(userContext)
    setFeaturesCache(allFeatures)
    setLastRefresh(Date.now())
    
    // Log feature flag refresh in development
    if (getEnvironmentInfo().debugMode) {
      console.debug('Feature flags refreshed:', allFeatures)
    }
  }, [userContext])

  const isFeatureEnabled = useCallback((flagName) => {
    // Check cache first for performance
    if (featuresCache.hasOwnProperty(flagName)) {
      return featuresCache[flagName]
    }
    
    // Fallback to real-time check
    return featureFlagManager.isEnabled(flagName, userContext)
  }, [featuresCache, userContext])

  const getAllFeatures = useCallback(() => {
    return featuresCache
  }, [featuresCache])

  const contextValue = {
    userContext,
    setUserContext,
    isFeatureEnabled,
    getAllFeatures,
    refreshFlags,
    lastRefresh
  }

  return (
    <FeatureFlagContext.Provider value={contextValue}>
      {children}
    </FeatureFlagContext.Provider>
  )
}

/**
 * Hook to access feature flag context
 */
export function useFeatureFlagContext() {
  const context = useContext(FeatureFlagContext)
  if (!context) {
    throw new Error('useFeatureFlagContext must be used within a FeatureFlagProvider')
  }
  return context
}

/**
 * Hook to check if a specific feature is enabled
 */
export function useFeatureFlag(flagName) {
  const { isFeatureEnabled } = useFeatureFlagContext()
  return isFeatureEnabled(flagName)
}

/**
 * Hook to get multiple feature flags at once
 */
export function useFeatureFlags(flagNames) {
  const { isFeatureEnabled } = useFeatureFlagContext()
  
  return flagNames.reduce((acc, flagName) => {
    acc[flagName] = isFeatureEnabled(flagName)
    return acc
  }, {})
}

/**
 * Hook for A/B testing variants
 */
export function useABTest(flagName) {
  const { userContext } = useFeatureFlagContext()
  const result = featureFlagManager.isEnabled(flagName, userContext)
  
  if (typeof result === 'object' && result.enabled) {
    return {
      isInTest: true,
      variant: result.variant,
      features: result.features || []
    }
  }
  
  return {
    isInTest: false,
    variant: 'control',
    features: []
  }
}

/**
 * Hook for conditional rendering based on feature flags
 */
export function useConditionalRender(flagName, fallbackComponent = null) {
  const isEnabled = useFeatureFlag(flagName)
  
  return useCallback((component) => {
    return isEnabled ? component : fallbackComponent
  }, [isEnabled, fallbackComponent])
}

/**
 * Higher-order component for feature flag protection
 */
export function withFeatureFlag(flagName, FallbackComponent = null) {
  return function WrappedComponent(Component) {
    return function FeatureFlagWrapper(props) {
      const isEnabled = useFeatureFlag(flagName)
      
      if (!isEnabled) {
        return FallbackComponent ? <FallbackComponent {...props} /> : null
      }
      
      return <Component {...props} />
    }
  }
}

/**
 * Hook for feature flag debugging (development only)
 */
export function useFeatureFlagDebugger() {
  const { getAllFeatures, userContext, lastRefresh } = useFeatureFlagContext()
  const envInfo = getEnvironmentInfo()
  
  if (!envInfo.debugMode) {
    return null
  }
  
  return {
    allFeatures: getAllFeatures(),
    userContext,
    lastRefresh: new Date(lastRefresh).toLocaleTimeString(),
    environment: envInfo.environment,
    region: envInfo.region,
    
    // Debug helpers
    logFeatures: () => {
      console.table(getAllFeatures())
    },
    
    getFeatureInfo: (flagName) => {
      return featureFlagManager.getFeatureFlagInfo(flagName)
    },
    
    clearCache: () => {
      featureFlagManager.clearCache()
    }
  }
}

/**
 * Custom hook for gradual feature rollout status
 */
export function useFeatureRolloutStatus(flagName) {
  const { userContext } = useFeatureFlagContext()
  const envInfo = getEnvironmentInfo()
  
  const flagInfo = featureFlagManager.getFeatureFlagInfo(flagName)
  const isEnabled = useFeatureFlag(flagName)
  
  if (!flagInfo) {
    return { status: 'unknown', percentage: 0, isEnabled: false }
  }
  
  const envConfig = flagInfo.currentConfig
  let percentage = 0
  let status = 'disabled'
  
  if (envConfig?.enabled) {
    if (envConfig.percentage !== undefined) {
      percentage = envConfig.percentage
      status = percentage === 100 ? 'fully_enabled' : 'gradual_rollout'
    } else {
      percentage = 100
      status = 'fully_enabled'
    }
  }
  
  return {
    status,
    percentage,
    isEnabled,
    region: envInfo.region,
    environment: envInfo.environment,
    flagType: flagInfo.type
  }
}

/**
 * Utility hook for feature flag analytics
 */
export function useFeatureFlagAnalytics() {
  const { getAllFeatures, userContext } = useFeatureFlagContext()
  const envInfo = getEnvironmentInfo()
  
  const trackFeatureUsage = useCallback((flagName, action = 'used') => {
    // Only track in production with analytics enabled
    if (envInfo.environment === 'production' && envInfo.enableAnalytics) {
      // In a real app, this would send to analytics service
      console.info(`Feature flag analytics: ${flagName} - ${action}`, {
        userContext,
        timestamp: Date.now(),
        environment: envInfo.environment,
        region: envInfo.region
      })
    }
  }, [userContext, envInfo])
  
  return {
    trackFeatureUsage,
    generateReport: () => {
      const features = getAllFeatures()
      const enabledCount = Object.values(features).filter(Boolean).length
      const totalCount = Object.keys(features).length
      
      return {
        totalFeatures: totalCount,
        enabledFeatures: enabledCount,
        enabledPercentage: Math.round((enabledCount / totalCount) * 100),
        features,
        userContext,
        environment: envInfo.environment,
        region: envInfo.region,
        timestamp: Date.now()
      }
    }
  }
}

// Note: FEATURE_FLAGS and featureFlagManager are imported from ../config/featureFlags.js
// They should be imported directly from the config file to avoid duplication