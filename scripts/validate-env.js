#!/usr/bin/env node

/**
 * Environment Validation Script
 * Validates environment configuration and displays current setup
 */

// Set up environment variables for Node.js execution
process.env.VITE_APP_ENV = process.env.VITE_APP_ENV || 'development'
process.env.VITE_APP_REGION = process.env.VITE_APP_REGION || 'global'
process.env.VITE_APP_VERSION = process.env.VITE_APP_VERSION || '1.0.0-dev'

// Mock import.meta.env for Node.js
if (typeof globalThis.import === 'undefined') {
  globalThis.import = {
    meta: {
      env: {
        DEV: process.env.NODE_ENV !== 'production',
        PROD: process.env.NODE_ENV === 'production',
        VITE_APP_ENV: process.env.VITE_APP_ENV,
        VITE_APP_REGION: process.env.VITE_APP_REGION,
        VITE_APP_VERSION: process.env.VITE_APP_VERSION,
        VITE_DEBUG_MODE: process.env.VITE_DEBUG_MODE || 'true',
        VITE_DEV_API_KEY: process.env.VITE_DEV_API_KEY,
        VITE_STAGING_API_KEY: process.env.VITE_STAGING_API_KEY,
        VITE_PROD_API_KEY: process.env.VITE_PROD_API_KEY
      }
    }
  }
}

import { validateEnvironment, getEnvironmentInfo } from '../src/config/environments.js'

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
  console.log(colorize('=' * 50, 'cyan'))
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