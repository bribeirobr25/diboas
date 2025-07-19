# diBoaS Feature Flags & Environment Management

This document explains how to use the comprehensive Feature Flag and Environment Management system in diBoaS.

## 🌍 Environment Management

### Supported Environments

- **Development** (`development`) - Local development with mock data
- **Staging** (`staging`) - Pre-production testing environment  
- **Production** (`production`) - Live production environment
- **Test** (`test`) - Automated testing environment

### Supported Regions

- **US East** (`us-east-1`) - United States East Coast
- **US West** (`us-west-1`) - United States West Coast  
- **EU West** (`eu-west-1`) - European Union
- **Asia Pacific** (`ap-southeast-1`) - Asia Pacific region
- **Global** (`global`) - Default/global region

### Environment Configuration

Each environment has its own configuration file:

```bash
.env.development    # Development environment
.env.staging       # Staging environment  
.env.production    # Production environment
```

### Environment Variables Structure

```bash
# Application Environment
VITE_APP_ENV=development
VITE_APP_REGION=global
VITE_APP_VERSION=1.0.0

# API Credentials (Environment-specific)
VITE_DEV_API_KEY=dev-key-safe-to-commit
VITE_STAGING_API_KEY=staging-key-from-ci-cd
VITE_PROD_API_KEY=prod-key-from-secrets-manager

# Feature Flag Overrides
VITE_FF_CRYPTO_WALLET_INTEGRATION=true
VITE_FF_NEW_DASHBOARD_DESIGN=false
```

## 🎛️ Feature Flag System

### Feature Flag Types

1. **Boolean** - Simple on/off switches
2. **Percentage** - Gradual rollouts (0-100%)
3. **Regional** - Region-specific availability
4. **User Segment** - Target specific user groups
5. **A/B Test** - Multiple variants with different features
6. **Kill Switch** - Emergency disable functionality

### Available Feature Flags

#### Authentication & Security
- `ENHANCED_AUTHENTICATION` - Enhanced auth flow with MFA
- `SOCIAL_LOGIN_PROVIDERS` - Apple, Google, X login options

#### Financial Features  
- `CRYPTO_WALLET_INTEGRATION` - MetaMask, Phantom wallet support
- `DEFI_INVESTMENTS` - DeFi protocols and yield farming
- `HIGH_FREQUENCY_TRADING` - Advanced trading features

#### UI/UX Features
- `NEW_DASHBOARD_DESIGN` - Updated dashboard layout
- `DARK_MODE` - Dark theme support

#### Experimental
- `AI_FINANCIAL_ADVISOR` - AI-powered investment advice

#### Analytics
- `ADVANCED_ANALYTICS` - Enhanced user behavior tracking

#### Emergency Controls
- `DISABLE_TRADING` - Emergency trading disable
- `DISABLE_WITHDRAWALS` - Emergency withdrawal disable

### Feature Flag Configuration Examples

```javascript
// Simple boolean flag
ENHANCED_AUTHENTICATION: {
  environments: {
    development: { enabled: true },
    staging: { enabled: true },
    production: { enabled: true }
  }
}

// Regional rollout
SOCIAL_LOGIN_PROVIDERS: {
  type: 'REGIONAL',
  environments: {
    production: {
      enabled: true,
      regions: {
        'us-east-1': true,
        'us-west-1': true,
        'eu-west-1': true,
        'ap-southeast-1': false // Pending approval
      }
    }
  }
}

// Gradual percentage rollout
CRYPTO_WALLET_INTEGRATION: {
  type: 'PERCENTAGE',
  environments: {
    production: {
      enabled: true,
      percentage: 75, // 75% of users
      regions: {
        'us-east-1': 100,
        'eu-west-1': 50 // More cautious in EU
      }
    }
  }
}

// User segment targeting
DEFI_INVESTMENTS: {
  type: 'USER_SEGMENT',
  environments: {
    production: {
      enabled: true,
      userSegments: {
        premium_users: true,
        power_users: true,
        new_users: false
      }
    }
  }
}

// A/B testing
HIGH_FREQUENCY_TRADING: {
  type: 'A_B_TEST',
  environments: {
    production: {
      enabled: true,
      variants: {
        control: { percentage: 50, features: [] },
        variant_a: { percentage: 30, features: ['advanced_charts'] },
        variant_b: { percentage: 20, features: ['advanced_charts', 'ai_recommendations'] }
      }
    }
  }
}
```

## 🔧 Usage in React Components

### Basic Feature Flag Usage

```jsx
import { useFeatureFlag } from '../hooks/useFeatureFlags.js'
import { FEATURE_FLAGS } from '../config/featureFlags.js'

function CryptoWalletComponent() {
  const isCryptoEnabled = useFeatureFlag(FEATURE_FLAGS.CRYPTO_WALLET_INTEGRATION)

  if (!isCryptoEnabled) {
    return <div>Crypto wallets coming soon!</div>
  }

  return (
    <div>
      <button>Connect MetaMask</button>
      <button>Connect Phantom</button>
    </div>
  )
}
```

### Multiple Feature Flags

```jsx
import { useFeatureFlags } from '../hooks/useFeatureFlags.js'

function Dashboard() {
  const features = useFeatureFlags([
    FEATURE_FLAGS.NEW_DASHBOARD_DESIGN,
    FEATURE_FLAGS.AI_FINANCIAL_ADVISOR,
    FEATURE_FLAGS.DARK_MODE
  ])

  return (
    <div className={features.NEW_DASHBOARD_DESIGN ? 'new-layout' : 'old-layout'}>
      {features.AI_FINANCIAL_ADVISOR && <AIAdvisorPanel />}
      {features.DARK_MODE && <ThemeToggle />}
    </div>
  )
}
```

### A/B Testing

```jsx
import { useABTest } from '../hooks/useFeatureFlags.js'

function TradingInterface() {
  const abTest = useABTest(FEATURE_FLAGS.HIGH_FREQUENCY_TRADING)

  if (!abTest.isInTest) {
    return <BasicTradingInterface />
  }

  return (
    <div>
      <h2>Advanced Trading - Variant {abTest.variant}</h2>
      {abTest.features.includes('advanced_charts') && <AdvancedCharts />}
      {abTest.features.includes('ai_recommendations') && <AIRecommendations />}
    </div>
  )
}
```

### Higher-Order Component Pattern

```jsx
import { withFeatureFlag } from '../hooks/useFeatureFlags.js'

const CryptoSection = withFeatureFlag(
  FEATURE_FLAGS.CRYPTO_WALLET_INTEGRATION,
  () => <div>Crypto features coming soon!</div>
)(function CryptoSection() {
  return <div>Crypto wallet features here</div>
})
```

## 🚀 Deployment & Management

### Environment-Specific Builds

```bash
# Development build
pnpm run dev
pnpm run build

# Staging build  
pnpm run dev:staging
pnpm run build:staging

# Production build
pnpm run build:production
```

### Deployment Commands

```bash
# Deploy to development
pnpm run deploy:dev

# Deploy to staging with region
pnpm run deploy:staging us-east-1

# Deploy to production with version
pnpm run deploy:prod us-east-1 --version 1.2.3

# Dry run (see what would be deployed)
./scripts/deploy.sh production us-east-1 --dry-run

# Emergency rollback
./scripts/deploy.sh production --rollback
```

### Environment Validation

```bash
# Validate current environment
pnpm run env:validate

# List all feature flags
pnpm run feature-flags:list

# Toggle a feature flag (if supported)
pnpm run feature-flags:toggle CRYPTO_WALLET_INTEGRATION
```

## 🔍 Debugging & Development

### Development Debug Panel

In development mode, a floating debug panel shows:
- Current environment and region
- All feature flag states
- API endpoint configuration
- Environment validation status

Access via the gear icon in the bottom-right corner.

### Feature Flag Context

```jsx
import { useFeatureFlagDebugger } from '../hooks/useFeatureFlags.js'

function DevPanel() {
  const debugger = useFeatureFlagDebugger()
  
  if (!debugger) return null // Only in development
  
  return (
    <div>
      <h3>Feature Flags ({Object.keys(debugger.allFeatures).length})</h3>
      <button onClick={debugger.logFeatures}>Log to Console</button>
      <button onClick={debugger.clearCache}>Clear Cache</button>
    </div>
  )
}
```

### Environment Information

```jsx
import { getEnvironmentInfo } from '../config/environments.js'

function EnvironmentInfo() {
  const env = getEnvironmentInfo()
  
  return (
    <div>
      <p>Environment: {env.environment}</p>
      <p>Region: {env.region}</p>
      <p>Version: {env.version}</p>
      <p>Debug Mode: {env.debugMode ? 'On' : 'Off'}</p>
    </div>
  )
}
```

## 🛡️ Security Best Practices

### Credential Management

1. **Never commit production secrets** to version control
2. **Use environment-specific credential prefixes**:
   - `VITE_DEV_*` for development (safe to commit placeholders)
   - `VITE_STAGING_*` for staging (set via CI/CD)
   - `VITE_PROD_*` for production (set via secrets manager)

3. **Validate environments** before deployment
4. **Use different API endpoints** per environment

### Feature Flag Security

1. **Kill switches** for emergency feature disabling
2. **Regional compliance** - disable features in restricted regions
3. **User segment targeting** - limit risky features to experienced users
4. **Gradual rollouts** - start with small percentages

## 📝 Configuration Examples

### Development Environment

```bash
# .env.development
VITE_APP_ENV=development
VITE_APP_REGION=global
VITE_DEBUG_MODE=true
VITE_ENABLE_MOCK_DATA=true

# All features enabled for development
VITE_FF_CRYPTO_WALLET_INTEGRATION=true
VITE_FF_AI_FINANCIAL_ADVISOR=true
```

### Production Environment

```bash
# .env.production (secrets managed externally)
VITE_APP_ENV=production
VITE_APP_REGION=us-east-1
VITE_DEBUG_MODE=false

# Conservative feature rollout
VITE_FF_CRYPTO_WALLET_INTEGRATION=false  # Controlled by feature flag system
VITE_FF_AI_FINANCIAL_ADVISOR=false       # Beta users only
```

### Regional Deployment

```bash
# Deploy to multiple regions
./scripts/deploy.sh production us-east-1 --version 1.2.3
./scripts/deploy.sh production eu-west-1 --version 1.2.3

# Different feature availability per region
# US: Full features
# EU: Limited due to regulations
```

## 🎯 Best Practices

### Feature Flag Naming

- Use **UPPER_SNAKE_CASE** for flag names
- Include **category prefix** (e.g., `AUTH_`, `CRYPTO_`, `UI_`)
- Be **descriptive** but **concise**
- Examples: `CRYPTO_WALLET_INTEGRATION`, `NEW_DASHBOARD_DESIGN`

### Environment Management

1. **Validate early** - check environment on app startup
2. **Fail fast** - stop deployment if configuration is invalid
3. **Log appropriately** - debug info in dev, errors only in prod
4. **Cache efficiently** - feature flags with timeout-based cache

### Deployment Strategy

1. **Development** → **Staging** → **Production**
2. **Regional rollouts** for global features
3. **Percentage-based** gradual rollouts
4. **A/B testing** for UX changes
5. **Kill switches** for emergency situations

### User Experience

1. **Graceful degradation** - fallbacks for disabled features
2. **Clear messaging** - "Coming soon" vs "Not available in your region"
3. **Progressive enhancement** - basic features first, advanced optional
4. **Performance** - lazy load feature-flagged components

## 🚨 Emergency Procedures

### Kill Switch Activation

```bash
# Emergency disable trading
export VITE_FF_DISABLE_TRADING=true
./scripts/deploy.sh production --force

# Emergency disable withdrawals  
export VITE_FF_DISABLE_WITHDRAWALS=true
./scripts/deploy.sh production --force
```

### Rollback Procedure

```bash
# Rollback to previous version
./scripts/deploy.sh production --rollback

# Or deploy specific version
./scripts/deploy.sh production --version 1.1.9 --force
```

This system ensures that diBoaS can safely deploy features across different environments and regions while maintaining strict separation between development and production configurations.