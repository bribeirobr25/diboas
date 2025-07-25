/**
 * Integration Configuration
 * Provider-agnostic configuration for all third-party integrations
 */

// Environment variables with fallbacks for different providers
const getEnvVar = (key, fallback = null) => {
  return import.meta.env[key] || fallback
}

// Security filter: Remove sensitive keys from client-side config
const filterSecrets = (config) => {
  const sensitiveKeys = ['secret', 'private', 'api_key', 'webhook']
  
  const filtered = JSON.parse(JSON.stringify(config))
  
  const removeSecrets = (obj) => {
    if (typeof obj !== 'object' || obj === null) return obj
    
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        // Replace with placeholder indicating server-side handling
        obj[key] = `[SERVER_SIDE_ONLY]`
      } else if (typeof value === 'object') {
        removeSecrets(value)
      }
    }
  }
  
  removeSecrets(filtered)
  return filtered
}

export const INTEGRATION_CONFIG = {
  // Authentication providers
  auth: {
    social: {
      enabled: true,
      providers: {
        google: {
          clientId: getEnvVar('VITE_GOOGLE_CLIENT_ID'),
          // clientSecret removed - handled server-side only
          scopes: ['email', 'profile'],
          enabled: true
        },
        apple: {
          clientId: getEnvVar('VITE_APPLE_CLIENT_ID'),
          // privateKey and secrets moved to server-side
          enabled: true
        },
        twitter: {
          clientId: getEnvVar('VITE_TWITTER_CLIENT_ID'),
          clientSecret: getEnvVar('VITE_TWITTER_CLIENT_SECRET'),
          enabled: true
        },
        facebook: {
          appId: getEnvVar('VITE_FACEBOOK_APP_ID'),
          appSecret: getEnvVar('VITE_FACEBOOK_APP_SECRET'),
          enabled: false // Can be enabled later
        }
      }
    },
    email: {
      enabled: true,
      provider: 'supabase', // or 'firebase', 'auth0', etc.
      config: {
        url: getEnvVar('VITE_SUPABASE_URL'),
        anonKey: getEnvVar('VITE_SUPABASE_ANON_KEY'),
        jwtSecret: getEnvVar('VITE_SUPABASE_JWT_SECRET')
      }
    }
  },

  // Payment providers for on/off-ramp
  payments: {
    // Card payments and general payment processing
    stripe: {
      enabled: true,
      publishableKey: getEnvVar('VITE_STRIPE_PUBLISHABLE_KEY'),
      secretKey: getEnvVar('VITE_STRIPE_SECRET_KEY'),
      webhookSecret: getEnvVar('VITE_STRIPE_WEBHOOK_SECRET'),
      supportedCurrencies: ['USD', 'EUR', 'GBP', 'CAD'],
      supportedPaymentMethods: ['card', 'ach', 'sepa'],
      feeStructure: {
        card: { percentage: 2.9, fixed: 0.30 },
        ach: { percentage: 0.8, fixed: 0.00 },
        sepa: { percentage: 0.8, fixed: 0.00 }
      },
      limits: {
        daily: { min: 1, max: 50000 },
        monthly: { min: 1, max: 200000 }
      }
    },

    // Bank account linking and ACH transfers
    plaid: {
      enabled: true,
      clientId: getEnvVar('VITE_PLAID_CLIENT_ID'),
      secret: getEnvVar('VITE_PLAID_SECRET'),
      environment: getEnvVar('VITE_PLAID_ENV', 'sandbox'), // sandbox, development, production
      products: ['auth', 'transactions', 'identity'],
      countryCodes: ['US', 'CA'],
      webhookUrl: getEnvVar('VITE_PLAID_WEBHOOK_URL')
    },

    // PayPal integration
    paypal: {
      enabled: true,
      clientId: getEnvVar('VITE_PAYPAL_CLIENT_ID'),
      clientSecret: getEnvVar('VITE_PAYPAL_CLIENT_SECRET'),
      environment: getEnvVar('VITE_PAYPAL_ENV', 'sandbox'), // sandbox, production
      supportedCurrencies: ['USD', 'EUR', 'GBP'],
      feeStructure: {
        percentage: 3.49,
        fixed: 0.00
      }
    },

    // Alternative providers (can be enabled as needed)
    moonpay: {
      enabled: false,
      apiKey: getEnvVar('VITE_MOONPAY_API_KEY'),
      secretKey: getEnvVar('VITE_MOONPAY_SECRET_KEY'),
      environment: getEnvVar('VITE_MOONPAY_ENV', 'sandbox')
    },

    ramp: {
      enabled: false,
      apiKey: getEnvVar('VITE_RAMP_API_KEY'),
      environment: getEnvVar('VITE_RAMP_ENV', 'sandbox')
    },

    // Smart routing configuration
    routing: {
      defaultProvider: 'stripe',
      rules: [
        {
          condition: 'amount >= 10000 && currency === "USD"',
          provider: 'plaid',
          reason: 'Lower fees for large ACH transfers'
        },
        {
          condition: 'region === "EU"',
          provider: 'stripe',
          reason: 'Better EU support'
        },
        {
          condition: 'paymentMethod === "paypal"',
          provider: 'paypal',
          reason: 'PayPal payments'
        }
      ]
    }
  },

  // Cryptocurrency wallet providers
  wallets: {
    metamask: {
      enabled: true,
      supportedNetworks: ['ethereum', 'polygon', 'bsc', 'arbitrum'],
      autoConnect: false,
      deepLinkFallback: 'https://metamask.io/download/'
    },
    
    phantom: {
      enabled: true,
      supportedNetworks: ['solana'],
      autoConnect: false,
      deepLinkFallback: 'https://phantom.app/download'
    },
    
    coinbase: {
      enabled: true,
      supportedNetworks: ['ethereum', 'polygon'],
      autoConnect: false,
      deepLinkFallback: 'https://wallet.coinbase.com/'
    },

    walletconnect: {
      enabled: true,
      projectId: getEnvVar('VITE_WALLETCONNECT_PROJECT_ID'),
      supportedNetworks: ['ethereum', 'polygon', 'arbitrum'],
      metadata: {
        name: 'diBoaS OneFi Platform',
        description: 'Unified finance platform',
        url: 'https://diboas.com',
        icons: ['https://diboas.com/logo.png']
      }
    }
  },

  // KYC verification providers
  kyc: {
    // Jumio identity verification
    jumio: {
      enabled: true,
      apiToken: getEnvVar('VITE_JUMIO_API_TOKEN'),
      apiSecret: getEnvVar('VITE_JUMIO_API_SECRET'),
      environment: getEnvVar('VITE_JUMIO_ENV', 'sandbox'), // sandbox, production
      datacenter: getEnvVar('VITE_JUMIO_DATACENTER', 'US'),
      supportedDocuments: ['passport', 'driverLicense', 'identityCard'],
      supportedCountries: ['US', 'CA', 'GB', 'DE', 'FR', 'ES', 'IT']
    },

    // Onfido verification
    onfido: {
      enabled: false, // Alternative to Jumio
      apiToken: getEnvVar('VITE_ONFIDO_API_TOKEN'),
      environment: getEnvVar('VITE_ONFIDO_ENV', 'sandbox'),
      region: getEnvVar('VITE_ONFIDO_REGION', 'US')
    },

    // Persona verification
    persona: {
      enabled: false, // Another alternative
      apiKey: getEnvVar('VITE_PERSONA_API_KEY'),
      environment: getEnvVar('VITE_PERSONA_ENV', 'sandbox')
    },

    // KYC routing rules
    routing: {
      defaultProvider: 'jumio',
      rules: [
        {
          condition: 'region === "EU"',
          provider: 'jumio',
          reason: 'GDPR compliance'
        },
        {
          condition: 'amount >= 50000',
          provider: 'jumio',
          reason: 'Enhanced verification for large amounts'
        }
      ]
    }
  },

  // Two-Factor Authentication providers
  twoFA: {
    // SMS verification via Twilio
    twilio: {
      enabled: true,
      accountSid: getEnvVar('VITE_TWILIO_ACCOUNT_SID'),
      authToken: getEnvVar('VITE_TWILIO_AUTH_TOKEN'),
      fromPhoneNumber: getEnvVar('VITE_TWILIO_PHONE_NUMBER'),
      serviceSid: getEnvVar('VITE_TWILIO_VERIFY_SERVICE_SID')
    },

    // Authenticator app via Authy
    authy: {
      enabled: true,
      apiKey: getEnvVar('VITE_AUTHY_API_KEY'),
      environment: getEnvVar('VITE_AUTHY_ENV', 'sandbox')
    },

    // Email-based 2FA
    email: {
      enabled: true,
      provider: 'sendgrid', // or 'ses', 'mailgun'
      config: {
        apiKey: getEnvVar('VITE_SENDGRID_API_KEY'),
        fromEmail: getEnvVar('VITE_FROM_EMAIL', 'noreply@diboas.com'),
        templateId: getEnvVar('VITE_2FA_EMAIL_TEMPLATE_ID')
      }
    },

    // Hardware keys (WebAuthn)
    webauthn: {
      enabled: true,
      rpId: getEnvVar('VITE_WEBAUTHN_RP_ID', 'diboas.com'),
      rpName: 'diBoaS OneFi Platform',
      timeout: 60000,
      attestation: 'none'
    }
  },

  // Blockchain and on-chain transaction providers
  blockchain: {
    ethereum: {
      enabled: true,
      providers: {
        alchemy: {
          apiKey: getEnvVar('VITE_ALCHEMY_API_KEY'),
          network: 'mainnet',
          priority: 1
        },
        infura: {
          projectId: getEnvVar('VITE_INFURA_PROJECT_ID'),
          projectSecret: getEnvVar('VITE_INFURA_PROJECT_SECRET'),
          network: 'mainnet',
          priority: 2
        },
        quicknode: {
          endpoint: getEnvVar('VITE_QUICKNODE_ENDPOINT'),
          priority: 3
        }
      },
      gasStrategy: {
        default: 'standard',
        options: {
          slow: { multiplier: 0.8, maxWaitTime: 600 },
          standard: { multiplier: 1.0, maxWaitTime: 300 },
          fast: { multiplier: 1.2, maxWaitTime: 60 },
          instant: { multiplier: 1.5, maxWaitTime: 15 }
        }
      }
    },

    solana: {
      enabled: true,
      providers: {
        helius: {
          apiKey: getEnvVar('VITE_HELIUS_API_KEY'),
          network: 'mainnet-beta',
          priority: 1
        },
        quicknode: {
          endpoint: getEnvVar('VITE_QUICKNODE_SOLANA_ENDPOINT'),
          priority: 2
        },
        rpc: {
          endpoint: 'https://api.mainnet-beta.solana.com',
          priority: 3
        }
      }
    },

    bitcoin: {
      enabled: true,
      providers: {
        blockstream: {
          endpoint: 'https://blockstream.info/api',
          priority: 1
        },
        blockcypher: {
          apiKey: getEnvVar('VITE_BLOCKCYPHER_API_KEY'),
          priority: 2
        }
      }
    }
  },

  // Provider health monitoring
  monitoring: {
    enabled: true,
    healthCheckInterval: 30000, // 30 seconds
    timeoutThreshold: 5000, // 5 seconds
    errorThreshold: 5, // Number of consecutive errors before marking as unhealthy
    retryPolicy: {
      maxRetries: 3,
      backoffMultiplier: 1.5,
      maxBackoffTime: 30000
    }
  },

  // Feature flags for gradual rollout
  featureFlags: {
    useProviderFallback: true,
    enableHealthMonitoring: true,
    enableSmartRouting: true,
    enableCostOptimization: true,
    enableProviderLoadBalancing: false,
    enableRealTimeProviderSwitching: false
  }
}

// Development overrides
if (import.meta.env.DEV) {
  // Use sandbox/test environments in development
  INTEGRATION_CONFIG.payments.stripe.secretKey = INTEGRATION_CONFIG.payments.stripe.secretKey || 'sk_test_...'
  INTEGRATION_CONFIG.payments.plaid.environment = 'sandbox'
  INTEGRATION_CONFIG.kyc.jumio.environment = 'sandbox'
  INTEGRATION_CONFIG.twoFA.authy.environment = 'sandbox'
}

// Export filtered config for client-side use (secrets removed)
const SECURE_INTEGRATION_CONFIG = filterSecrets(INTEGRATION_CONFIG)

export default SECURE_INTEGRATION_CONFIG
export { INTEGRATION_CONFIG as RAW_CONFIG } // Only for server-side use