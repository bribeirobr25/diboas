import logger from '../utils/logger'

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
 * API Base URLs per environment - Updated for subdomain architecture
 */
const apiConfigs = {
  [API_ENVIRONMENTS.LOCAL]: {
    baseUrl: 'http://localhost:3001/api',
    authUrl: 'http://localhost:3002/auth',
    wsUrl: 'ws://localhost:3001',
    cdnUrl: 'http://localhost:3001/assets',
    appUrl: 'http://localhost:5173',
    docsUrl: 'http://localhost:5173/docs'
  },
  
  [API_ENVIRONMENTS.DEV]: {
    baseUrl: 'https://api-dev.diboas.com/api',
    authUrl: 'https://auth-dev.diboas.com',
    wsUrl: 'wss://ws-dev.diboas.com',
    cdnUrl: 'https://cdn-dev.diboas.com',
    appUrl: 'https://app-dev.diboas.com',
    docsUrl: 'https://docs-dev.diboas.com'
  },
  
  [API_ENVIRONMENTS.STAGING]: {
    baseUrl: 'https://api.staging.diboas.com/api',
    authUrl: 'https://auth.staging.diboas.com',
    wsUrl: 'wss://ws.staging.diboas.com',
    cdnUrl: 'https://cdn.staging.diboas.com',
    appUrl: 'https://app.staging.diboas.com',
    docsUrl: 'https://docs.staging.diboas.com'
  },
  
  [API_ENVIRONMENTS.PRODUCTION]: {
    baseUrl: 'https://api.diboas.com/api',
    authUrl: 'https://auth.diboas.com',
    wsUrl: 'wss://ws.diboas.com',
    cdnUrl: 'https://cdn.diboas.com',
    appUrl: 'https://app.diboas.com',
    docsUrl: 'https://docs.diboas.com'
  }
}

/**
 * Get current environment configuration
 */
export const getEnvironmentConfig = () => {
  const currentEnv = getCurrentEnvironment()
  const config = environmentConfigs[currentEnv]
  
  if (!config) {
    logger.warn(`Unknown environment: ${currentEnv}, falling back to development`)
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
    logger.warn(`Unknown API environment: ${envConfig.apiEnvironment}, falling back to local`)
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
 * SECURITY: No placeholder credentials - fail securely if missing
 */
export const getCredentials = () => {
  const env = getCurrentEnvironment()
  
  // Validate all required credentials are present
  const validateCredentials = (creds, envName) => {
    const missing = []
    if (!creds.apiKey) missing.push('apiKey')
    if (!creds.clientId) missing.push('clientId')
    if (!creds.encryptionKey) missing.push('encryptionKey')
    
    if (missing.length > 0) {
      throw new Error(
        `Missing required credentials for ${envName}: ${missing.join(', ')}. ` +
        `Set the following environment variables: ${missing.map(key => 
          `VITE_${envName.toUpperCase()}_${key.toUpperCase().replace(/([A-Z])/g, '_$1')}`
        ).join(', ')}`
      )
    }
    return creds
  }
  
  if (env === ENV_TYPES.DEVELOPMENT || env === ENV_TYPES.TEST) {
    const creds = {
      apiKey: import.meta.env.VITE_DEV_API_KEY,
      clientId: import.meta.env.VITE_DEV_CLIENT_ID,
      encryptionKey: import.meta.env.VITE_DEV_ENCRYPTION_KEY
    }
    
    // Allow missing credentials in development for easier local setup
    if (env === ENV_TYPES.DEVELOPMENT && (!creds.apiKey || !creds.clientId || !creds.encryptionKey)) {
      logger.warn('⚠️  Missing development credentials. Some features may not work.')
      return {
        apiKey: creds.apiKey || null,
        clientId: creds.clientId || null,
        encryptionKey: creds.encryptionKey || null
      }
    }
    
    return validateCredentials(creds, 'dev')
  }
  
  if (env === ENV_TYPES.STAGING) {
    const creds = {
      apiKey: import.meta.env.VITE_STAGING_API_KEY,
      clientId: import.meta.env.VITE_STAGING_CLIENT_ID,
      encryptionKey: import.meta.env.VITE_STAGING_ENCRYPTION_KEY
    }
    return validateCredentials(creds, 'staging')
  }
  
  if (env === ENV_TYPES.PRODUCTION) {
    const creds = {
      apiKey: import.meta.env.VITE_PROD_API_KEY,
      clientId: import.meta.env.VITE_PROD_CLIENT_ID,
      encryptionKey: import.meta.env.VITE_PROD_ENCRYPTION_KEY
    }
    return validateCredentials(creds, 'production')
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