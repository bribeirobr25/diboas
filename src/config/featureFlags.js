/**
 * Advanced Feature Flag System for diBoaS
 * Enables controlled feature rollouts by environment, region, user segment, and A/B testing
 * Supports gradual rollouts, kill switches, and real-time feature toggling
 */

import { getCurrentEnvironment, getCurrentRegion, ENV_TYPES, REGIONS, isProduction } from './environments.js'
import logger from '../utils/logger'

/**
 * Feature flag types for different rollout strategies
 */
export const FLAG_TYPES = {
  BOOLEAN: 'boolean',           // Simple on/off
  PERCENTAGE: 'percentage',     // Gradual rollout (0-100%)
  REGIONAL: 'regional',         // Region-specific
  USER_SEGMENT: 'user_segment', // Based on user attributes
  A_B_TEST: 'a_b_test',        // A/B testing variants
  KILL_SWITCH: 'kill_switch'    // Emergency disable
}

/**
 * User segments for targeted feature rollouts
 */
export const USER_SEGMENTS = {
  ALL: 'all',
  BETA_USERS: 'beta_users',
  PREMIUM_USERS: 'premium_users',
  NEW_USERS: 'new_users',
  POWER_USERS: 'power_users',
  INTERNAL: 'internal',
  REGION_SPECIFIC: 'region_specific'
}

/**
 * Core feature flag definitions
 * Each flag can have different configurations per environment
 */
const featureFlags = {
  // Authentication & Security Features
  ENHANCED_AUTHENTICATION: {
    name: 'Enhanced Authentication Flow',
    type: FLAG_TYPES.BOOLEAN,
    description: 'New authentication with biometric support and MFA',
    environments: {
      [ENV_TYPES.DEVELOPMENT]: { enabled: true },
      [ENV_TYPES.STAGING]: { enabled: true },
      [ENV_TYPES.PRODUCTION]: { 
        enabled: true,
        regions: {
          [REGIONS.US_EAST]: true,
          [REGIONS.US_WEST]: true,
          [REGIONS.EU_WEST]: false, // Not yet available in EU
          [REGIONS.ASIA_PACIFIC]: false
        }
      }
    }
  },

  SOCIAL_LOGIN_PROVIDERS: {
    name: 'Social Login Providers',
    type: FLAG_TYPES.REGIONAL,
    description: 'Additional OAuth providers (Apple, X, etc.)',
    environments: {
      [ENV_TYPES.DEVELOPMENT]: { enabled: true },
      [ENV_TYPES.STAGING]: { enabled: true },
      [ENV_TYPES.PRODUCTION]: {
        enabled: true,
        regions: {
          [REGIONS.US_EAST]: true,
          [REGIONS.US_WEST]: true,
          [REGIONS.EU_WEST]: true,
          [REGIONS.ASIA_PACIFIC]: false // Pending regulatory approval
        }
      }
    }
  },

  // Financial Features
  CRYPTO_WALLET_INTEGRATION: {
    name: 'Crypto Wallet Integration',
    type: FLAG_TYPES.PERCENTAGE,
    description: 'MetaMask, Phantom wallet connections',
    environments: {
      [ENV_TYPES.DEVELOPMENT]: { enabled: true, percentage: 100 },
      [ENV_TYPES.STAGING]: { enabled: true, percentage: 100 },
      [ENV_TYPES.PRODUCTION]: {
        enabled: true,
        percentage: 75, // Gradual rollout to 75% of users
        regions: {
          [REGIONS.US_EAST]: 100,
          [REGIONS.US_WEST]: 75,
          [REGIONS.EU_WEST]: 50, // More cautious in EU
          [REGIONS.ASIA_PACIFIC]: 25
        }
      }
    }
  },

  DEFI_INVESTMENTS: {
    name: 'DeFi Investment Options',
    type: FLAG_TYPES.USER_SEGMENT,
    description: 'Access to DeFi protocols and yield farming',
    environments: {
      [ENV_TYPES.DEVELOPMENT]: { enabled: true },
      [ENV_TYPES.STAGING]: { enabled: true },
      [ENV_TYPES.PRODUCTION]: {
        enabled: true,
        userSegments: {
          [USER_SEGMENTS.PREMIUM_USERS]: true,
          [USER_SEGMENTS.POWER_USERS]: true,
          [USER_SEGMENTS.BETA_USERS]: true,
          [USER_SEGMENTS.NEW_USERS]: false // Too risky for new users
        },
        regions: {
          [REGIONS.US_EAST]: true,
          [REGIONS.US_WEST]: true,
          [REGIONS.EU_WEST]: false, // Regulatory restrictions
          [REGIONS.ASIA_PACIFIC]: false
        }
      }
    }
  },

  HIGH_FREQUENCY_TRADING: {
    name: 'High Frequency Trading',
    type: FLAG_TYPES.A_B_TEST,
    description: 'Advanced trading features for power users',
    environments: {
      [ENV_TYPES.DEVELOPMENT]: { enabled: true },
      [ENV_TYPES.STAGING]: { enabled: true },
      [ENV_TYPES.PRODUCTION]: {
        enabled: true,
        variants: {
          control: { percentage: 50, features: [] },
          variant_a: { percentage: 30, features: ['advanced_charts'] },
          variant_b: { percentage: 20, features: ['advanced_charts', 'ai_recommendations'] }
        },
        userSegments: {
          [USER_SEGMENTS.POWER_USERS]: true,
          [USER_SEGMENTS.PREMIUM_USERS]: true
        }
      }
    }
  },

  // UI/UX Features
  NEW_DASHBOARD_DESIGN: {
    name: 'New Dashboard Design',
    type: FLAG_TYPES.PERCENTAGE,
    description: 'Updated dashboard with improved UX',
    environments: {
      [ENV_TYPES.DEVELOPMENT]: { enabled: true, percentage: 100 },
      [ENV_TYPES.STAGING]: { enabled: true, percentage: 100 },
      [ENV_TYPES.PRODUCTION]: {
        enabled: true,
        percentage: 20, // Gradual rollout starting with 20%
        userSegments: {
          [USER_SEGMENTS.BETA_USERS]: 100, // Beta users get it first
          [USER_SEGMENTS.INTERNAL]: 100
        }
      }
    }
  },

  CATEGORIES_NAVIGATION: {
    name: 'Categories Navigation',
    type: FLAG_TYPES.BOOLEAN,
    description: 'Replace Quick Actions with category-based navigation',
    environments: {
      [ENV_TYPES.DEVELOPMENT]: { enabled: true },
      [ENV_TYPES.STAGING]: { enabled: true },
      [ENV_TYPES.PRODUCTION]: { enabled: true } // Enable for production as well
    }
  },

  DARK_MODE: {
    name: 'Dark Mode Theme',
    type: FLAG_TYPES.BOOLEAN,
    description: 'Dark theme option for the application',
    environments: {
      [ENV_TYPES.DEVELOPMENT]: { enabled: true },
      [ENV_TYPES.STAGING]: { enabled: true },
      [ENV_TYPES.PRODUCTION]: { enabled: true } // Available everywhere
    }
  },

  // Experimental Features
  AI_FINANCIAL_ADVISOR: {
    name: 'AI Financial Advisor',
    type: FLAG_TYPES.USER_SEGMENT,
    description: 'AI-powered investment recommendations',
    environments: {
      [ENV_TYPES.DEVELOPMENT]: { enabled: true },
      [ENV_TYPES.STAGING]: { enabled: true },
      [ENV_TYPES.PRODUCTION]: {
        enabled: true,
        userSegments: {
          [USER_SEGMENTS.BETA_USERS]: true,
          [USER_SEGMENTS.INTERNAL]: true,
          [USER_SEGMENTS.PREMIUM_USERS]: false // Not ready for premium yet
        },
        regions: {
          [REGIONS.US_EAST]: true,
          [REGIONS.US_WEST]: false,
          [REGIONS.EU_WEST]: false,
          [REGIONS.ASIA_PACIFIC]: false
        }
      }
    }
  },

  // Analytics & Monitoring
  ADVANCED_ANALYTICS: {
    name: 'Advanced User Analytics',
    type: FLAG_TYPES.BOOLEAN,
    description: 'Enhanced user behavior tracking',
    environments: {
      [ENV_TYPES.DEVELOPMENT]: { enabled: false }, // Privacy in dev
      [ENV_TYPES.STAGING]: { enabled: true },
      [ENV_TYPES.PRODUCTION]: { enabled: true }
    }
  },

  // Kill Switches for Emergency Situations
  DISABLE_TRADING: {
    name: 'Emergency Trading Disable',
    type: FLAG_TYPES.KILL_SWITCH,
    description: 'Disable all trading during market volatility',
    environments: {
      [ENV_TYPES.DEVELOPMENT]: { enabled: false },
      [ENV_TYPES.STAGING]: { enabled: false },
      [ENV_TYPES.PRODUCTION]: { enabled: false } // Only activated during emergencies
    }
  },

  DISABLE_WITHDRAWALS: {
    name: 'Emergency Withdrawal Disable',
    type: FLAG_TYPES.KILL_SWITCH,
    description: 'Disable withdrawals during security incidents',
    environments: {
      [ENV_TYPES.DEVELOPMENT]: { enabled: false },
      [ENV_TYPES.STAGING]: { enabled: false },
      [ENV_TYPES.PRODUCTION]: { enabled: false }
    }
  }
}

/**
 * Feature flag evaluation engine
 */
class FeatureFlagManager {
  constructor() {
    this.environment = getCurrentEnvironment()
    this.region = getCurrentRegion()
    this.cache = new Map()
    this.cacheTimeout = 5 * 60 * 1000 // 5 minutes
  }

  /**
   * Check if a feature flag is enabled
   */
  isEnabled(flagName, userContext = {}) {
    const cacheKey = `${flagName}_${JSON.stringify(userContext)}`
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey)
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        return cached.value
      }
    }

    const result = this.evaluateFlag(flagName, userContext)
    
    // Cache the result
    this.cache.set(cacheKey, {
      value: result,
      timestamp: Date.now()
    })

    return result
  }

  /**
   * Evaluate a specific feature flag
   */
  evaluateFlag(flagName, userContext = {}) {
    const flag = featureFlags[flagName]
    
    if (!flag) {
      logger.warn(`Feature flag '${flagName}' not found`)
      return false
    }

    const envConfig = flag.environments[this.environment]
    
    if (!envConfig) {
      return false
    }

    // Basic enabled/disabled check
    if (!envConfig.enabled) {
      return false
    }

    // Regional restrictions
    if (envConfig.regions && this.region !== REGIONS.GLOBAL) {
      const regionalValue = envConfig.regions[this.region]
      if (regionalValue === false) {
        return false
      }
      if (typeof regionalValue === 'number') {
        // Percentage rollout by region
        return this.evaluatePercentage(regionalValue, userContext.userId)
      }
    }

    // User segment targeting
    if (envConfig.userSegments && userContext.segment) {
      if (!envConfig.userSegments[userContext.segment]) {
        return false
      }
    }

    // Percentage-based rollout
    if (flag.type === FLAG_TYPES.PERCENTAGE && envConfig.percentage !== undefined) {
      const percentage = envConfig.regions && envConfig.regions[this.region] 
        ? envConfig.regions[this.region] 
        : envConfig.percentage
      return this.evaluatePercentage(percentage, userContext.userId)
    }

    // A/B testing
    if (flag.type === FLAG_TYPES.A_B_TEST && envConfig.variants) {
      return this.evaluateABTest(envConfig.variants, userContext)
    }

    // Kill switch (always check production status)
    if (flag.type === FLAG_TYPES.KILL_SWITCH && isProduction()) {
      // In production, kill switches should be checked against real-time config
      return this.checkKillSwitch(flagName)
    }

    return true
  }

  /**
   * Evaluate percentage-based rollout
   */
  evaluatePercentage(percentage, userId) {
    if (!userId) {
      // Fallback to random if no user ID
      return Math.random() * 100 < percentage
    }

    // Consistent hash-based distribution
    const hash = this.hashUserId(userId)
    return (hash % 100) < percentage
  }

  /**
   * Evaluate A/B test variants
   */
  evaluateABTest(variants, userContext) {
    const { userId } = userContext
    if (!userId) return false

    const hash = this.hashUserId(userId)
    let cumulative = 0

    for (const [variant, config] of Object.entries(variants)) {
      cumulative += config.percentage
      if ((hash % 100) < cumulative) {
        return {
          enabled: true,
          variant,
          features: config.features || []
        }
      }
    }

    return false
  }

  /**
   * Check kill switch status (would integrate with real-time config in production)
   */
  checkKillSwitch(flagName) {
    // In production, this would check against a real-time configuration service
    // For now, we'll use the static configuration
    return featureFlags[flagName].environments[this.environment].enabled
  }

  /**
   * Simple hash function for consistent user distribution
   */
  hashUserId(userId) {
    let hash = 0
    for (let i = 0; i < userId.length; i++) {
      const char = userId.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32-bit integer
    }
    return Math.abs(hash)
  }

  /**
   * Get all enabled features for a user
   */
  getEnabledFeatures(userContext = {}) {
    const enabled = {}
    
    for (const flagName of Object.keys(featureFlags)) {
      enabled[flagName] = this.isEnabled(flagName, userContext)
    }

    return enabled
  }

  /**
   * Get feature flag information for debugging
   */
  getFeatureFlagInfo(flagName) {
    const flag = featureFlags[flagName]
    if (!flag) return null

    return {
      name: flag.name,
      type: flag.type,
      description: flag.description,
      environment: this.environment,
      region: this.region,
      currentConfig: flag.environments[this.environment]
    }
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache() {
    this.cache.clear()
  }
}

// Global instance
export const featureFlagManager = new FeatureFlagManager()

// Convenience functions
export const isFeatureEnabled = (flagName, userContext) => 
  featureFlagManager.isEnabled(flagName, userContext)

export const getEnabledFeatures = (userContext) => 
  featureFlagManager.getEnabledFeatures(userContext)

export const getFeatureFlagInfo = (flagName) => 
  featureFlagManager.getFeatureFlagInfo(flagName)

// React hook for feature flags
export const useFeatureFlag = (flagName, userContext = {}) => {
  // In a real React app, this would use useState and useEffect for reactivity
  return featureFlagManager.isEnabled(flagName, userContext)
}

// Export flag names for easy reference
export const FEATURE_FLAGS = Object.keys(featureFlags).reduce((acc, key) => {
  acc[key] = key
  return acc
}, {})

export default featureFlagManager