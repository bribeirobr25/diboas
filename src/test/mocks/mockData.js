/**
 * Mock Data for Testing
 * Centralized mock data for consistent testing across the application
 */

export const mockUser = {
  id: 'test-user-123',
  email: 'test@diboas.com',
  name: 'Test User',
  profile: {
    firstName: 'Test',
    lastName: 'User',
    avatar: '/avatar-test.png'
  },
  preferences: {
    theme: 'light',
    currency: 'USD',
    language: 'en'
  },
  kyc: {
    status: 'verified',
    level: 'level_2'
  }
}

export const mockBalance = {
  total: 1250.50,
  crypto: {
    BTC: { amount: 0.025, value: 1087.50 },
    ETH: { amount: 0.065, value: 163.00 },
    SOL: { amount: 0, value: 0 },
    SUI: { amount: 0, value: 0 },
    USDC: { amount: 0, value: 0 }
  },
  traditional: {
    checking: 0,
    savings: 0
  },
  lastUpdated: '2025-01-22T10:30:00Z'
}

export const mockTransactions = [
  {
    id: 'tx-001',
    type: 'BUY',
    asset: 'BTC',
    amount: 0.005,
    value: 217.50,
    fee: 2.50,
    status: 'completed',
    timestamp: '2025-01-22T09:30:00Z',
    onChainHash: '0x1234567890abcdef'
  },
  {
    id: 'tx-002',
    type: 'SELL',
    asset: 'ETH',
    amount: 0.01,
    value: 26.80,
    fee: 0.50,
    status: 'completed',
    timestamp: '2025-01-21T15:45:00Z',
    onChainHash: '0xabcdef1234567890'
  },
  {
    id: 'tx-003',
    type: 'SEND',
    asset: 'BTC',
    amount: 0.001,
    value: 43.50,
    fee: 1.25,
    status: 'pending',
    timestamp: '2025-01-22T10:15:00Z',
    toAddress: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
  }
]

export const mockMarketData = {
  crypto: [
    {
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 43250.50,
      change24h: 2.4,
      marketCap: 845000000000,
      volume24h: 28000000000,
      lastUpdate: '2025-01-22T10:30:00Z',
      source: 'coingecko',
      provider: 'CoinGecko'
    },
    {
      symbol: 'ETH',
      name: 'Ethereum',
      price: 2680.75,
      change24h: -1.2,
      marketCap: 322000000000,
      volume24h: 15000000000,
      lastUpdate: '2025-01-22T10:30:00Z',
      source: 'coingecko',
      provider: 'CoinGecko'
    }
  ]
}

export const mockFeatureFlags = {
  HIGH_FREQUENCY_TRADING: true,
  ADVANCED_CHARTING: true,
  SOCIAL_TRADING: false,
  CRYPTO_STAKING: true,
  DEFI_INTEGRATIONS: false
}

export const mockApiResponses = {
  '/api/balance': mockBalance,
  '/api/transactions': mockTransactions,
  '/api/market-data/crypto': mockMarketData.crypto,
  '/api/user/profile': mockUser,
  '/api/feature-flags': mockFeatureFlags
}

export const mockProviderHealthStatus = {
  overallHealth: 95.5,
  healthyProviders: 2,
  totalProviders: 3,
  providers: [
    {
      providerId: 'coingecko',
      status: 'healthy',
      successRate: 0.98,
      averageLatency: 1250,
      uptime: 99.2,
      lastSuccess: '2025-01-22T10:30:00Z'
    }
  ]
}