#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates environment configuration and displays current setup
 */

// Set up environment variables for Node.js execution
process.env.VITE_APP_ENV = process.env.VITE_APP_ENV || 'development'
process.env.VITE_APP_REGION = process.env.VITE_APP_REGION || 'global'
process.env.VITE_APP_VERSION = process.env.VITE_APP_VERSION || '1.0.0-dev'

// Node.js compatible environment functions (inline to avoid import.meta.env issues)
const ENV_TYPES = {
  DEVELOPMENT: 'development',
  STAGING: 'staging',
  PRODUCTION: 'production',
  TEST: 'test'
}

const API_ENVIRONMENTS = {
  LOCAL: 'local',
  DEV: 'dev',
  STAGING: 'staging',
  PRODUCTION: 'production'
}

const REGIONS = {
  US_EAST: 'us-east-1',
  US_WEST: 'us-west-1',
  EU_WEST: 'eu-west-1',
  ASIA_PACIFIC: 'ap-southeast-1',
  GLOBAL: 'global'
}

const getCurrentEnvironment = () => {
  if (process.env.VITE_APP_ENV) {
    return process.env.VITE_APP_ENV
  }
  
  if (process.env.NODE_ENV === 'production') {
    return ENV_TYPES.PRODUCTION
  }
  
  return ENV_TYPES.DEVELOPMENT
}

const getCurrentRegion = () => {
  return process.env.VITE_APP_REGION || REGIONS.GLOBAL
}

const environmentConfigs = {
  [ENV_TYPES.DEVELOPMENT]: {
    name: 'Development',
    apiEnvironment: API_ENVIRONMENTS.LOCAL,
    debugMode: true,
    sslRequired: false
  },
  [ENV_TYPES.STAGING]: {
    name: 'Staging',
    apiEnvironment: API_ENVIRONMENTS.STAGING,
    debugMode: true,
    sslRequired: true
  },
  [ENV_TYPES.PRODUCTION]: {
    name: 'Production',
    apiEnvironment: API_ENVIRONMENTS.PRODUCTION,
    debugMode: false,
    sslRequired: true
  }
}

const apiConfigs = {
  [API_ENVIRONMENTS.LOCAL]: {
    baseUrl: 'http://localhost:3001/api'
  },
  [API_ENVIRONMENTS.STAGING]: {
    baseUrl: 'https://api-staging.diboas.com/api'
  },
  [API_ENVIRONMENTS.PRODUCTION]: {
    baseUrl: 'https://api.diboas.com/api'
  }
}

const getEnvironmentConfig = () => {
  const currentEnv = getCurrentEnvironment()
  return environmentConfigs[currentEnv] || environmentConfigs[ENV_TYPES.DEVELOPMENT]
}

const getApiConfig = () => {
  const envConfig = getEnvironmentConfig()
  return apiConfigs[envConfig.apiEnvironment] || apiConfigs[API_ENVIRONMENTS.LOCAL]
}

const getEnvironmentInfo = () => {
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
    buildTime: process.env.VITE_BUILD_TIME || 'development',
    version: process.env.VITE_APP_VERSION || '1.0.0-dev'
  }
}

const validateEnvironment = () => {
  const env = getCurrentEnvironment()
  const config = getEnvironmentConfig()
  const apiConfig = getApiConfig()
  const issues = []
  
  if (env === ENV_TYPES.PRODUCTION) {
    if (!process.env.VITE_PROD_API_KEY) {
      issues.push('Missing VITE_PROD_API_KEY')
    }
    if (!process.env.VITE_PROD_CLIENT_ID) {
      issues.push('Missing VITE_PROD_CLIENT_ID')
    }
  }
  
  if (env === ENV_TYPES.PRODUCTION) {
    if (apiConfig.baseUrl.includes('localhost')) {
      issues.push('Using localhost API in production')
    }
  }
  
  if (config.sslRequired && !apiConfig.baseUrl.startsWith('https')) {
    issues.push('SSL required but HTTP URL configured')
  }
  
  return {
    isValid: issues.length === 0,
    issues,
    environment: env
  }
}

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
}

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`
}

function printHeader() {
  console.log(colorize('\n🚀 diBoaS Environment Validation', 'cyan'))
  console.log(colorize('='.repeat(50), 'cyan'))
}

function printEnvironmentInfo() {
  const envInfo = getEnvironmentInfo()
  
  console.log(colorize('\n📋 Environment Information:', 'blue'))
  console.log(`Environment: ${colorize(envInfo.environment, 'bright')}`)
  console.log(`Region: ${colorize(envInfo.region, 'bright')}`)
  console.log(`Version: ${colorize(envInfo.version, 'bright')}`)
  console.log(`Debug Mode: ${colorize(envInfo.debugMode ? 'ON' : 'OFF', envInfo.debugMode ? 'green' : 'yellow')}`)
  console.log(`API Base URL: ${colorize(envInfo.baseUrl, 'bright')}`)
  console.log(`Build Time: ${colorize(envInfo.buildTime || 'Development', 'bright')}`)
}

function printValidationResults() {
  const validation = validateEnvironment()
  
  console.log(colorize('\n🔍 Validation Results:', 'blue'))
  
  if (validation.isValid) {
    console.log(colorize('✅ Environment configuration is valid', 'green'))
  } else {
    console.log(colorize('❌ Environment configuration has issues:', 'red'))
    validation.issues.forEach(issue => {
      console.log(colorize(`   • ${issue}`, 'red'))
    })
  }
}

function printEnvironmentVariables() {
  console.log(colorize('\n🔧 Environment Variables:', 'blue'))
  
  const envVars = [
    'VITE_APP_ENV',
    'VITE_APP_REGION',
    'VITE_APP_VERSION',
    'VITE_DEBUG_MODE',
    'VITE_DEV_API_KEY',
    'VITE_STAGING_API_KEY',
    'VITE_PROD_API_KEY'
  ]
  
  envVars.forEach(varName => {
    const value = process.env[varName]
    if (value) {
      const displayValue = varName.includes('KEY') || varName.includes('SECRET') 
        ? value.substring(0, 8) + '...' 
        : value
      console.log(`${varName}: ${colorize(displayValue, 'bright')}`)
    } else {
      console.log(`${varName}: ${colorize('Not set', 'yellow')}`)
    }
  })
}

function printRecommendations() {
  const envInfo = getEnvironmentInfo()
  const validation = validateEnvironment()
  
  console.log(colorize('\n💡 Recommendations:', 'blue'))
  
  if (envInfo.environment === 'production' && envInfo.debugMode) {
    console.log(colorize('   • Disable debug mode in production', 'yellow'))
  }
  
  if (!validation.isValid) {
    console.log(colorize('   • Fix configuration issues before deployment', 'red'))
  }
  
  if (envInfo.environment === 'development') {
    console.log(colorize('   • Use staging environment for pre-production testing', 'cyan'))
  }
  
  if (!process.env.VITE_PROD_API_KEY && envInfo.environment !== 'development') {
    console.log(colorize('   • Set production API keys via secure environment variables', 'yellow'))
  }
}

function main() {
  try {
    printHeader()
    printEnvironmentInfo()
    printValidationResults()
    printEnvironmentVariables()
    printRecommendations()
    
    console.log(colorize('\n✨ Validation complete!\n', 'green'))
    
    const validation = validateEnvironment()
    process.exit(validation.isValid ? 0 : 1)
    
  } catch (error) {
    console.error(colorize(`\n❌ Validation failed: ${error.message}\n`, 'red'))
    process.exit(1)
  }
}

main()