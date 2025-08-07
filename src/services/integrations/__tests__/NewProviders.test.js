/**
 * New Provider Integrations Tests
 * Test suite for newly added provider integrations
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { AlphaVantageProvider } from '../marketData/providers/AlphaVantageProvider.js'
import { RazorpayProvider } from '../payments/providers/RazorpayProvider.js'
import { WalletConnectProvider } from '../wallets/providers/WalletConnectProvider.js'
import { OnfidoEnhancedProvider } from '../kyc/providers/OnfidoEnhancedProvider.js'

// Mock dependencies
vi.mock('../../../utils/secureLogger.js', () => ({
  default: {
    audit: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

// Also mock the deeper path that providers use
vi.mock('../../../../utils/secureLogger.js', () => ({
  default: {
    audit: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

// Mock fetch for API calls
global.fetch = vi.fn()

describe('New Provider Integrations', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    global.fetch.mockClear()
  })

  describe('AlphaVantageProvider', () => {
    let provider

    beforeEach(() => {
      provider = new AlphaVantageProvider({
        apiKey: 'test-api-key'
      })
    })

    it('should initialize with required config', () => {
      expect(provider.apiKey).toBe('test-api-key')
      expect(provider.baseUrl).toBe('https://www.alphavantage.co/query')
    })

    it('should throw error without API key', () => {
      expect(() => {
        new AlphaVantageProvider({})
      }).toThrow('Alpha Vantage API key is required')
    })

    it('should perform health check', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'Global Quote': {
            '05. price': '150.00'
          }
        })
      })

      const result = await provider.healthCheck()
      
      expect(result.healthy).toBe(true)
      expect(result.provider).toBe('alphavantage')
    })

    it('should get stock data', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'Global Quote': {
            '01. symbol': 'AAPL',
            '05. price': '175.50',
            '09. change': '2.50',
            '10. change percent': '1.45%',
            '03. high': '177.00',
            '04. low': '173.00',
            '06. volume': '50000000',
            '08. previous close': '173.00',
            '07. latest trading day': '2024-01-15'
          }
        })
      })

      const result = await provider.getStockData(['AAPL'])
      
      expect(result).toHaveLength(1)
      expect(result[0].symbol).toBe('AAPL')
      expect(result[0].price).toBe(175.50)
      expect(result[0].change24h).toBe(1.45)
      expect(result[0].source).toBe('alphavantage')
    })

    it('should get crypto data', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'Realtime Currency Exchange Rate': {
            '5. Exchange Rate': '43250.00',
            '6. Last Refreshed': '2024-01-15 10:00:00'
          }
        })
      })

      const result = await provider.getCryptoData(['BTC'])
      
      expect(result).toHaveLength(1)
      expect(result[0].symbol).toBe('BTC')
      expect(result[0].price).toBe(43250.00)
      expect(result[0].source).toBe('alphavantage')
    })

    it('should handle API errors gracefully', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          'Error Message': 'Invalid API call'
        })
      })

      const result = await provider.getStockData(['INVALID'])
      
      expect(result).toHaveLength(1)
      expect(result[0].symbol).toBe('INVALID')
      expect(result[0].price).toBeNull()
      expect(result[0].error).toContain('Invalid API call')
    })

    it('should enforce rate limiting', async () => {
      // Set a shorter rate limit delay for testing
      provider.rateLimitDelay = 100 // 100ms instead of 12 seconds
      provider.lastRequestTime = Date.now() - 50 // 50ms ago, should trigger 50ms wait
      
      const startTime = Date.now()
      await provider.enforceRateLimit()
      const duration = Date.now() - startTime
      
      // Should have waited at least 40ms (allowing for some timing variance)
      expect(duration).toBeGreaterThan(40)
    })
  })

  describe('RazorpayProvider', () => {
    let provider

    beforeEach(() => {
      provider = new RazorpayProvider({
        keyId: 'test-key-id',
        keySecret: 'test-key-secret'
      })
    })

    it('should initialize with required config', () => {
      expect(provider.keyId).toBe('test-key-id')
      expect(provider.keySecret).toBe('test-key-secret')
      expect(provider.baseUrl).toBe('https://api.razorpay.com/v1')
    })

    it('should throw error without credentials', () => {
      expect(() => {
        new RazorpayProvider({})
      }).toThrow('Razorpay key ID and secret are required')
    })

    it('should create payment order', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'order_12345',
          amount: 10000,
          currency: 'INR',
          receipt: 'order_test',
          status: 'created',
          created_at: 1642723200
        })
      })

      const result = await provider.createPayment({
        amount: 100,
        currency: 'INR',
        orderId: 'order_test'
      })

      expect(result.success).toBe(true)
      expect(result.transactionId).toBe('order_12345')
      expect(result.amount).toBe(100)
      expect(result.provider).toBe('razorpay')
    })

    it('should handle payment processing', async () => {
      // Mock order creation
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'order_12345',
          amount: 10000,
          currency: 'INR',
          receipt: 'order_test',
          status: 'created'
        })
      })

      const result = await provider.processPayment({
        amount: 100,
        currency: 'INR',
        orderId: 'order_test'
      })

      expect(result.success).toBe(true)
      expect(result.status).toBe('created')
      expect(result.provider).toBe('razorpay')
    })

    it('should create customer', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'cust_12345',
          name: 'John Doe',
          email: 'john@example.com'
        })
      })

      const result = await provider.createCustomer({
        name: 'John Doe',
        email: 'john@example.com',
        phone: '+1234567890'
      })

      expect(result.success).toBe(true)
      expect(result.customerId).toBe('cust_12345')
      expect(result.provider).toBe('razorpay')
    })

    it('should map Razorpay status correctly', () => {
      expect(provider.mapRazorpayStatus('created')).toBe('pending')
      expect(provider.mapRazorpayStatus('captured')).toBe('completed')
      expect(provider.mapRazorpayStatus('failed')).toBe('failed')
      expect(provider.mapRazorpayStatus('refunded')).toBe('refunded')
    })
  })

  describe('WalletConnectProvider', () => {
    let provider

    beforeEach(() => {
      provider = new WalletConnectProvider({
        projectId: 'test-project-id',
        appName: 'Test App'
      })
    })

    it('should initialize with required config', () => {
      expect(provider.projectId).toBe('test-project-id')
      expect(provider.appName).toBe('Test App')
      expect(provider.chains).toEqual([1, 137, 56, 42161])
    })

    it('should throw error without project ID', () => {
      expect(() => {
        new WalletConnectProvider({})
      }).toThrow('WalletConnect project ID is required')
    })

    it('should perform health check', async () => {
      const result = await provider.healthCheck()
      
      expect(result.healthy).toBe(true)
      expect(result.connected).toBe(false)
      expect(result.provider).toBe('walletconnect')
    })

    it('should simulate wallet connection', async () => {
      const result = await provider.connect({
        mockAccount: '0x123456789abcdef123456789abcdef123456789a',
        mockChainId: 1
      })

      expect(result.success).toBe(true)
      expect(result.account).toBe('0x123456789abcdef123456789abcdef123456789a')
      expect(result.chainId).toBe(1)
      expect(result.provider).toBe('walletconnect')
      expect(provider.isConnected).toBe(true)
    })

    it('should get account information', async () => {
      await provider.connect({
        mockAccount: '0x123456789abcdef123456789abcdef123456789a',
        mockChainId: 1
      })

      const account = await provider.getAccount()
      
      expect(account.address).toBe('0x123456789abcdef123456789abcdef123456789a')
      expect(account.chainId).toBe(1)
      expect(account.provider).toBe('walletconnect')
    })

    it('should simulate transaction sending', async () => {
      await provider.connect({
        mockAccount: '0x123456789abcdef123456789abcdef123456789a',
        mockChainId: 1
      })

      const result = await provider.sendTransaction({
        to: '0x987654321fedcba987654321fedcba987654321f',
        value: '0x1000000000000000000', // 1 ETH
        gas: '0x5208'
      })

      expect(result.success).toBe(true)
      expect(result.transactionHash).toMatch(/^0x[a-f0-9]{64}$/)
      expect(result.provider).toBe('walletconnect')
    })

    it('should simulate message signing', async () => {
      await provider.connect({
        mockAccount: '0x123456789abcdef123456789abcdef123456789a'
      })

      const result = await provider.signMessage('Hello, world!')

      expect(result.success).toBe(true)
      expect(result.signature).toMatch(/^0x[a]{130}$/)
      expect(result.message).toBe('Hello, world!')
      expect(result.provider).toBe('walletconnect')
    })

    it('should switch chains', async () => {
      await provider.connect({
        mockAccount: '0x123456789abcdef123456789abcdef123456789a',
        mockChainId: 1
      })

      const result = await provider.switchChain(137) // Polygon

      expect(result.success).toBe(true)
      expect(result.chainId).toBe(137)
      expect(provider.chainId).toBe(137)
    })

    it('should get chain currency correctly', () => {
      expect(provider.getChainCurrency(1)).toBe('ETH')
      expect(provider.getChainCurrency(137)).toBe('MATIC')
      expect(provider.getChainCurrency(56)).toBe('BNB')
      expect(provider.getChainCurrency(999)).toBe('ETH') // Default
    })

    it('should disconnect wallet', async () => {
      await provider.connect()
      
      const result = await provider.disconnect()

      expect(result.success).toBe(true)
      expect(provider.isConnected).toBe(false)
      expect(provider.account).toBeNull()
      expect(provider.session).toBeNull()
    })
  })

  describe('OnfidoEnhancedProvider', () => {
    let provider

    beforeEach(() => {
      provider = new OnfidoEnhancedProvider({
        apiToken: 'test-api-token'
      })
    })

    it('should initialize with required config', () => {
      expect(provider.apiToken).toBe('test-api-token')
      expect(provider.baseUrl).toBe('https://api.onfido.com/v3.6')
    })

    it('should throw error without API token', () => {
      expect(() => {
        new OnfidoEnhancedProvider({})
      }).toThrow('Onfido API token is required')
    })

    it('should create applicant', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'applicant_12345',
          href: '/v3.6/applicants/applicant_12345'
        })
      })

      const result = await provider.createApplicant({
        firstName: 'John',
        lastName: 'Doe',
        email: 'john@example.com',
        dateOfBirth: '1990-01-01'
      })

      expect(result.success).toBe(true)
      expect(result.applicantId).toBe('applicant_12345')
      expect(result.provider).toBe('onfido')
    })

    it('should create KYC check', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          id: 'check_12345',
          status: 'in_progress',
          result: null,
          href: '/v3.6/checks/check_12345',
          reports: []
        })
      })

      const result = await provider.createCheck('applicant_12345', {
        type: 'express'
      })

      expect(result.success).toBe(true)
      expect(result.checkId).toBe('check_12345')
      expect(result.status).toBe('in_progress')
      expect(result.provider).toBe('onfido')
    })

    it('should create SDK token', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          token: 'sdk_token_12345'
        })
      })

      const result = await provider.createSdkToken('applicant_12345')

      expect(result.success).toBe(true)
      expect(result.token).toBe('sdk_token_12345')
      expect(result.provider).toBe('onfido')
    })

    it('should handle API errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 400,
        json: async () => ({
          error: {
            message: 'Invalid request'
          }
        })
      })

      const result = await provider.createApplicant({
        firstName: 'John',
        lastName: 'Doe',
        email: 'invalid-email'
      })

      expect(result.success).toBe(false)
      expect(result.error).toContain('Invalid request')
    })

    it('should get capabilities', () => {
      const capabilities = provider.getCapabilities()

      expect(capabilities.documentVerification).toBe(true)
      expect(capabilities.facialRecognition).toBe(true)
      expect(capabilities.supportedDocuments).toContain('passport')
      expect(capabilities.supportedCountries).toContain('US')
      expect(capabilities.provider).toBe('onfido')
    })
  })

  describe('Provider Integration with Enhanced Registry', () => {
    it('should work with all new providers', () => {
      const providers = [
        new AlphaVantageProvider({ apiKey: 'test' }),
        new RazorpayProvider({ keyId: 'test', keySecret: 'test' }),
        new WalletConnectProvider({ projectId: 'test' }),
        new OnfidoEnhancedProvider({ apiToken: 'test' })
      ]

      providers.forEach(provider => {
        expect(provider).toBeDefined()
        expect(typeof provider.healthCheck).toBe('function')
        expect(typeof provider.getCapabilities).toBe('function')
      })
    })

    it('should have consistent health check interface', async () => {
      const providers = [
        new AlphaVantageProvider({ apiKey: 'test' }),
        new WalletConnectProvider({ projectId: 'test' })
      ]

      for (const provider of providers) {
        const health = await provider.healthCheck()
        expect(health).toHaveProperty('healthy')
        expect(health).toHaveProperty('provider')
        expect(typeof health.healthy).toBe('boolean')
        expect(typeof health.provider).toBe('string')
      }
    })

    it('should have consistent capabilities interface', () => {
      const providers = [
        new AlphaVantageProvider({ apiKey: 'test' }),
        new RazorpayProvider({ keyId: 'test', keySecret: 'test' }),
        new WalletConnectProvider({ projectId: 'test' }),
        new OnfidoEnhancedProvider({ apiToken: 'test' })
      ]

      providers.forEach(provider => {
        const capabilities = provider.getCapabilities()
        expect(capabilities).toHaveProperty('provider')
        expect(typeof capabilities.provider).toBe('string')
      })
    })
  })
})