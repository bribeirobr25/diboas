/**
 * Environment Configuration System for diBoaS
 * Provides clean separation between development, staging, and production environments
 * Prevents accidental use of production credentials in development
 */

/**
 * Environment types
 */
export const ENV_TYPES = {
  DEVELOPMENT: 'development',
  STAGING: 'staging', 
  PRODUCTION: 'production',
  TEST: 'test'
}

/**
 * API Environments - separate from app environments for flexibility
 */
export const API_ENVIRONMENTS = {
  LOCAL: 'local',
  DEV: 'dev',
  STAGING: 'staging',
  PRODUCTION: 'production'
}

/**
 * Regional configurations for feature rollouts
 */
export const REGIONS = {
  US_EAST: 'us-east-1',
  US_WEST: 'us-west-1', 
  EU_WEST: 'eu-west-1',
  ASIA_PACIFIC: 'ap-southeast-1',
  GLOBAL: 'global'
}

/**
 * Current environment detection
 */
export const getCurrentEnvironment = () => {
  // Check for explicit environment variable first
  if (import.meta.env.VITE_APP_ENV) {
    return import.meta.env.VITE_APP_ENV
  }
  
  // Fallback to NODE_ENV
  if (import.meta.env.DEV) {
    return ENV_TYPES.DEVELOPMENT
  }
  
  if (import.meta.env.PROD) {
    return ENV_TYPES.PRODUCTION
  }
  
  return ENV_TYPES.DEVELOPMENT
}

/**
 * Current region detection
 */
export const getCurrentRegion = () => {
  return import.meta.env.VITE_APP_REGION || REGIONS.GLOBAL
}

/**
 * Environment-specific configurations
 */
const environmentConfigs = {
  [ENV_TYPES.DEVELOPMENT]: {
    name: 'Development',
    apiEnvironment: API_ENVIRONMENTS.LOCAL,
    debugMode: true,
    enableErrorReporting: false,
    enableAnalytics: false,
    enablePerformanceTracking: false,
    apiTimeout: 30000,
    retryAttempts: 3,
    enableMockData: true,
    enableDevTools: true,
    logLevel: 'debug',
    cacheEnabled: false,
    sslRequired: false
  },
  
  [ENV_TYPES.STAGING]: {
    name: 'Staging',
    apiEnvironment: API_ENVIRONMENTS.STAGING,
    debugMode: true,
    enableErrorReporting: true,
    enableAnalytics: false,
    enablePerformanceTracking: true,
    apiTimeout: 25000,
    retryAttempts: 2,
    enableMockData: false,
    enableDevTools: true,
    logLevel: 'info',
    cacheEnabled: true,
    sslRequired: true
  },
  
  [ENV_TYPES.PRODUCTION]: {
    name: 'Production',
    apiEnvironment: API_ENVIRONMENTS.PRODUCTION,
    debugMode: false,
    enableErrorReporting: true,
    enableAnalytics: true,
    enablePerformanceTracking: true,
    apiTimeout: 20000,
    retryAttempts: 1,
    enableMockData: false,
    enableDevTools: false,
    logLevel: 'error',
    cacheEnabled: true,
    sslRequired: true
  },
  
  [ENV_TYPES.TEST]: {
    name: 'Test',
    apiEnvironment: API_ENVIRONMENTS.LOCAL,
    debugMode: false,
    enableErrorReporting: false,
    enableAnalytics: false,
    enablePerformanceTracking: false,
    apiTimeout: 5000,
    retryAttempts: 0,
    enableMockData: true,
    enableDevTools: false,
    logLevel: 'silent',
    cacheEnabled: false,
    sslRequired: false
  }
}

/**
 * API Base URLs per environment
 */
const apiConfigs = {
  [API_ENVIRONMENTS.LOCAL]: {
    baseUrl: 'http://localhost:3001/api',
    authUrl: 'http://localhost:3001/auth',
    wsUrl: 'ws://localhost:3001',
    cdnUrl: 'http://localhost:3001/assets'
  },
  
  [API_ENVIRONMENTS.DEV]: {
    baseUrl: 'https://api-dev.diboas.com/api',
    authUrl: 'https://auth-dev.diboas.com',
    wsUrl: 'wss://ws-dev.diboas.com',
    cdnUrl: 'https://cdn-dev.diboas.com'
  },
  
  [API_ENVIRONMENTS.STAGING]: {
    baseUrl: 'https://api-staging.diboas.com/api',
    authUrl: 'https://auth-staging.diboas.com',
    wsUrl: 'wss://ws-staging.diboas.com',
    cdnUrl: 'https://cdn-staging.diboas.com'
  },
  
  [API_ENVIRONMENTS.PRODUCTION]: {
    baseUrl: 'https://api.diboas.com/api',
    authUrl: 'https://auth.diboas.com',
    wsUrl: 'wss://ws.diboas.com',
    cdnUrl: 'https://cdn.diboas.com'
  }
}

/**
 * Get current environment configuration
 */
export const getEnvironmentConfig = () => {
  const currentEnv = getCurrentEnvironment()
  const config = environmentConfigs[currentEnv]
  
  if (!config) {
    console.warn(`Unknown environment: ${currentEnv}, falling back to development`)
    return environmentConfigs[ENV_TYPES.DEVELOPMENT]
  }
  
  return config
}

/**
 * Get API configuration for current environment
 */
export const getApiConfig = () => {
  const envConfig = getEnvironmentConfig()
  const apiConfig = apiConfigs[envConfig.apiEnvironment]
  
  if (!apiConfig) {
    console.warn(`Unknown API environment: ${envConfig.apiEnvironment}, falling back to local`)
    return apiConfigs[API_ENVIRONMENTS.LOCAL]
  }
  
  return apiConfig
}

/**
 * Environment validation helpers
 */
export const isProduction = () => getCurrentEnvironment() === ENV_TYPES.PRODUCTION
export const isDevelopment = () => getCurrentEnvironment() === ENV_TYPES.DEVELOPMENT
export const isStaging = () => getCurrentEnvironment() === ENV_TYPES.STAGING
export const isTest = () => getCurrentEnvironment() === ENV_TYPES.TEST

/**
 * Environment-safe credential helpers
 */
export const getCredentials = () => {
  const env = getCurrentEnvironment()
  
  // Prevent accidental production credential usage in development
  if (env === ENV_TYPES.DEVELOPMENT || env === ENV_TYPES.TEST) {
    return {
      apiKey: import.meta.env.VITE_DEV_API_KEY || 'dev-key-placeholder',
      clientId: import.meta.env.VITE_DEV_CLIENT_ID || 'dev-client-placeholder',
      encryptionKey: import.meta.env.VITE_DEV_ENCRYPTION_KEY || 'dev-encryption-placeholder'
    }
  }
  
  if (env === ENV_TYPES.STAGING) {
    return {
      apiKey: import.meta.env.VITE_STAGING_API_KEY,
      clientId: import.meta.env.VITE_STAGING_CLIENT_ID,
      encryptionKey: import.meta.env.VITE_STAGING_ENCRYPTION_KEY
    }
  }
  
  if (env === ENV_TYPES.PRODUCTION) {
    return {
      apiKey: import.meta.env.VITE_PROD_API_KEY,
      clientId: import.meta.env.VITE_PROD_CLIENT_ID,
      encryptionKey: import.meta.env.VITE_PROD_ENCRYPTION_KEY
    }
  }
  
  throw new Error(`Invalid environment for credentials: ${env}`)
}

/**
 * Environment information display (for debugging)
 */
export const getEnvironmentInfo = () => {
  const currentEnv = getCurrentEnvironment()
  const currentRegion = getCurrentRegion()
  const envConfig = getEnvironmentConfig()
  const apiConfig = getApiConfig()
  
  return {
    environment: currentEnv,
    region: currentRegion,
    name: envConfig.name,
    apiEnvironment: envConfig.apiEnvironment,
    baseUrl: apiConfig.baseUrl,
    debugMode: envConfig.debugMode,
    buildTime: import.meta.env.VITE_BUILD_TIME || 'unknown',
    version: import.meta.env.VITE_APP_VERSION || '1.0.0'
  }
}

/**
 * Runtime environment validation
 */
export const validateEnvironment = () => {
  const env = getCurrentEnvironment()
  const config = getEnvironmentConfig()
  const apiConfig = getApiConfig()
  const issues = []
  
  // Check for required environment variables in production
  if (env === ENV_TYPES.PRODUCTION) {
    if (!import.meta.env.VITE_PROD_API_KEY) {
      issues.push('Missing VITE_PROD_API_KEY')
    }
    if (!import.meta.env.VITE_PROD_CLIENT_ID) {
      issues.push('Missing VITE_PROD_CLIENT_ID')
    }
  }
  
  // Warn about development credentials in production
  if (env === ENV_TYPES.PRODUCTION) {
    if (apiConfig.baseUrl.includes('localhost')) {
      issues.push('Using localhost API in production')
    }
  }
  
  // Check SSL requirements
  if (config.sslRequired && !apiConfig.baseUrl.startsWith('https')) {
    issues.push('SSL required but HTTP URL configured')
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    environment: env
  }
}