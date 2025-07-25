#!/usr/bin/env node

/**
 * Feature Flag Listing Script
 * Lists all feature flags and their current status
 */

import { featureFlagManager } from '../src/config/featureFlags.js'
import { getEnvironmentInfo } from '../src/config/environments.js'

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
  const envInfo = getEnvironmentInfo()
  console.log(colorize('\n🎛️  diBoaS Feature Flags', 'cyan'))
  console.log(colorize('=' * 50, 'cyan'))
  console.log(`Environment: ${colorize(envInfo.environment, 'bright')}`)
  console.log(`Region: ${colorize(envInfo.region, 'bright')}`)
}

function printFeatureFlags() {
  console.log(colorize('\n📋 Feature Flag Status:', 'blue'))
  
  // Mock user context for testing
  const userContext = {
    userId: 'demo_user_123',
    segment: 'beta_users',
    region: getEnvironmentInfo().region
  }
  
  const features = featureFlagManager.getEnabledFeatures(userContext)
  
  // Group features by category
  const categories = {
    'Authentication & Security': [
      'ENHANCED_AUTHENTICATION',
      'SOCIAL_LOGIN_PROVIDERS'
    ],
    'Financial Features': [
      'CRYPTO_WALLET_INTEGRATION',
      'DEFI_INVESTMENTS',
      'HIGH_FREQUENCY_TRADING'
    ],
    'UI/UX Features': [
      'NEW_DASHBOARD_DESIGN',
      'DARK_MODE'
    ],
    'Experimental': [
      'AI_FINANCIAL_ADVISOR'
    ],
    'Analytics & Monitoring': [
      'ADVANCED_ANALYTICS'
    ],
    'Emergency Controls': [
      'DISABLE_TRADING',
      'DISABLE_WITHDRAWALS'
    ]
  }
  
  Object.entries(categories).forEach(([category, flagNames]) => {
    console.log(colorize(`\n  ${category}:`, 'magenta'))
    
    flagNames.forEach(flagName => {
      const enabled = features[flagName]
      const flagInfo = featureFlagManager.getFeatureFlagInfo(flagName)
      
      if (flagInfo) {
        const status = enabled ? colorize('ON', 'green') : colorize('OFF', 'red')
        const name = flagInfo.name
        const type = colorize(`[${flagInfo.type}]`, 'yellow')
        
        console.log(`    ${status} ${name} ${type}`)
        
        if (flagInfo.description) {
          console.log(colorize(`         ${flagInfo.description}`, 'reset'))
        }
      }
    })
  })
}

function printStatistics() {
  const userContext = {
    userId: 'demo_user_123',
    segment: 'beta_users',
    region: getEnvironmentInfo().region
  }
  
  const features = featureFlagManager.getEnabledFeatures(userContext)
  const totalFeatures = Object.keys(features).length
  const enabledFeatures = Object.values(features).filter(Boolean).length
  const percentage = Math.round((enabledFeatures / totalFeatures) * 100)
  
  console.log(colorize('\n📊 Statistics:', 'blue'))
  console.log(`Total Features: ${colorize(totalFeatures, 'bright')}`)
  console.log(`Enabled Features: ${colorize(enabledFeatures, 'green')}`)
  console.log(`Disabled Features: ${colorize(totalFeatures - enabledFeatures, 'red')}`)
  console.log(`Enabled Percentage: ${colorize(`${percentage}%`, 'bright')}`)
}

function printUsageExamples() {
  console.log(colorize('\n💻 Usage Examples:', 'blue'))
  console.log('JavaScript:')
  console.log(colorize('  import { useFeatureFlag } from "./hooks/useFeatureFlags.js"', 'cyan'))
  console.log(colorize('  const isEnabled = useFeatureFlag("CRYPTO_WALLET_INTEGRATION")', 'cyan'))
  console.log('')
  console.log('Feature Flag Toggle:')
  console.log(colorize('  pnpm feature-flags:toggle CRYPTO_WALLET_INTEGRATION', 'cyan'))
  console.log('')
  console.log('Environment Validation:')
  console.log(colorize('  pnpm env:validate', 'cyan'))
}

function main() {
  try {
    printHeader()
    printFeatureFlags()
    printStatistics()
    printUsageExamples()
    
    console.log(colorize('\n✨ Feature flag listing complete!\n', 'green'))
    
  } catch (error) {
    console.error(colorize(`\n❌ Failed to list features: ${error.message}\n`, 'red'))
    process.exit(1)
  }
}

main()