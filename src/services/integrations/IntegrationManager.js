/**
 * Integration Manager
 * Central hub for managing all third-party integrations in a provider-agnostic way
 */

import { AuthProviderRegistry } from './auth/AuthProviderRegistry.js'
import { PaymentProviderRegistry } from './payments/PaymentProviderRegistry.js'
import { WalletProviderRegistry } from './wallets/WalletProviderRegistry.js'
import { KYCProviderRegistry } from './kyc/KYCProviderRegistry.js'
import { TwoFAProviderRegistry } from './twofa/TwoFAProviderRegistry.js'
import { OnChainProviderRegistry } from './onchain/OnChainProviderRegistry.js'
import { ProviderHealthMonitor } from './ProviderHealthMonitor.js'
import { IntegrationLogger } from './IntegrationLogger.js'
import { INTEGRATION_CONFIG } from '../../config/integrations.js'

export class IntegrationManager {
  constructor() {
    // Provider registries
    this.authRegistry = new AuthProviderRegistry()
    this.paymentRegistry = new PaymentProviderRegistry()
    this.walletRegistry = new WalletProviderRegistry()
    this.kycRegistry = new KYCProviderRegistry()
    this.twoFARegistry = new TwoFAProviderRegistry()
    this.onChainRegistry = new OnChainProviderRegistry()
    
    // Transaction-specific registries
    this.registries = new Map()
    
    // Support services
    this.healthMonitor = new ProviderHealthMonitor()
    this.logger = new IntegrationLogger()
    
    // Initialization state
    this.isInitialized = false
    this.initializationPromise = null
  }

  /**
   * Register additional registry (for transaction providers)
   */
  registerRegistry(name, registry) {
    this.registries.set(name, registry)
  }

  /**
   * Initialize all provider registries with configuration
   */
  async initialize() {
    if (this.isInitialized) {
      return this
    }

    if (this.initializationPromise) {
      return await this.initializationPromise
    }

    this.initializationPromise = this._performInitialization()
    await this.initializationPromise
    
    // Initialize transaction providers
    await this._initializeTransactionProviders()
    
    this.isInitialized = true
    
    return this
  }

  async _performInitialization() {
    try {
      this.logger.info('Starting integration manager initialization')

      // Initialize all registries in parallel for better performance
      await Promise.all([
        this._initializeAuthProviders(),
        this._initializePaymentProviders(),
        this._initializeWalletProviders(),
        this._initializeKYCProviders(),
        this._initializeTwoFAProviders(),
        this._initializeOnChainProviders()
      ])

      // Start health monitoring
      await this.healthMonitor.start()

      this.logger.info('Integration manager initialization completed')
    } catch (error) {
      this.logger.error('Integration manager initialization failed', error)
      throw error
    }
  }

  /**
   * Initialize authentication providers
   */
  async _initializeAuthProviders() {
    const { SocialAuthProvider } = await import('./auth/providers/SocialAuthProvider.js')
    const { EmailAuthProvider } = await import('./auth/providers/EmailAuthProvider.js')
    
    const config = INTEGRATION_CONFIG.auth

    // Social authentication providers
    if (config.social?.enabled) {
      const socialProvider = new SocialAuthProvider(config.social)
      this.authRegistry.register('social', socialProvider)
      this.logger.info('Social auth provider registered')
    }

    // Email/password authentication
    if (config.email?.enabled) {
      const emailProvider = new EmailAuthProvider(config.email)
      this.authRegistry.register('email', emailProvider)
      this.logger.info('Email auth provider registered')
    }
  }

  /**
   * Initialize payment providers
   */
  async _initializePaymentProviders() {
    const config = INTEGRATION_CONFIG.payments

    // Stripe for card payments
    if (config.stripe?.enabled) {
      const { StripeProvider } = await import('./payments/providers/StripeProvider.js')
      const stripeProvider = new StripeProvider(config.stripe)
      this.paymentRegistry.register('stripe', stripeProvider)
      this.logger.info('Stripe payment provider registered')
    }

    // Plaid for bank connections
    if (config.plaid?.enabled) {
      const { PlaidProvider } = await import('./payments/providers/PlaidProvider.js')
      const plaidProvider = new PlaidProvider(config.plaid)
      this.paymentRegistry.register('plaid', plaidProvider)
      this.logger.info('Plaid payment provider registered')
    }

    // PayPal integration
    if (config.paypal?.enabled) {
      const { PayPalProvider } = await import('./payments/providers/PayPalProvider.js')
      const paypalProvider = new PayPalProvider(config.paypal)
      this.paymentRegistry.register('paypal', paypalProvider)
      this.logger.info('PayPal payment provider registered')
    }
  }

  /**
   * Initialize wallet providers
   */
  async _initializeWalletProviders() {
    const { MetaMaskProvider } = await import('./wallets/providers/MetaMaskProvider.js')
    const { PhantomProvider } = await import('./wallets/providers/PhantomProvider.js')
    const { CoinbaseWalletProvider } = await import('./wallets/providers/CoinbaseWalletProvider.js')
    
    const config = INTEGRATION_CONFIG.wallets

    if (config.metamask?.enabled) {
      const metamaskProvider = new MetaMaskProvider(config.metamask)
      this.walletRegistry.register('metamask', metamaskProvider)
      this.logger.info('MetaMask wallet provider registered')
    }

    if (config.phantom?.enabled) {
      const phantomProvider = new PhantomProvider(config.phantom)
      this.walletRegistry.register('phantom', phantomProvider)
      this.logger.info('Phantom wallet provider registered')
    }

    if (config.coinbase?.enabled) {
      const coinbaseWalletProvider = new CoinbaseWalletProvider(config.coinbase)
      this.walletRegistry.register('coinbase', coinbaseWalletProvider)
      this.logger.info('Coinbase Wallet provider registered')
    }
  }

  /**
   * Initialize KYC providers
   */
  async _initializeKYCProviders() {
    const config = INTEGRATION_CONFIG.kyc

    if (config.jumio?.enabled) {
      const { JumioProvider } = await import('./kyc/providers/JumioProvider.js')
      const jumioProvider = new JumioProvider(config.jumio)
      this.kycRegistry.register('jumio', jumioProvider)
      this.logger.info('Jumio KYC provider registered')
    }

    if (config.onfido?.enabled) {
      const { OnfidoProvider } = await import('./kyc/providers/OnfidoProvider.js')
      const onfidoProvider = new OnfidoProvider(config.onfido)
      this.kycRegistry.register('onfido', onfidoProvider)
      this.logger.info('Onfido KYC provider registered')
    }
  }

  /**
   * Initialize 2FA providers
   */
  async _initializeTwoFAProviders() {
    const config = INTEGRATION_CONFIG.twoFA

    if (config.twilio?.enabled) {
      const { TwilioProvider } = await import('./twofa/providers/TwilioProvider.js')
      const twilioProvider = new TwilioProvider(config.twilio)
      this.twoFARegistry.register('sms', twilioProvider)
      this.logger.info('Twilio SMS 2FA provider registered')
    }

    if (config.authy?.enabled) {
      const { AuthyProvider } = await import('./twofa/providers/AuthyProvider.js')
      const authyProvider = new AuthyProvider(config.authy)
      this.twoFARegistry.register('app', authyProvider)
      this.logger.info('Authy 2FA provider registered')
    }
  }

  /**
   * Initialize on-chain transaction providers
   */
  async _initializeOnChainProviders() {
    const config = INTEGRATION_CONFIG.blockchain

    // Ethereum providers
    if (config.ethereum?.enabled) {
      const { EthereumProvider } = await import('./onchain/providers/EthereumProvider.js')
      const ethereumProvider = new EthereumProvider(config.ethereum)
      this.onChainRegistry.register('ethereum', ethereumProvider)
      this.logger.info('Ethereum on-chain provider registered')
    }

    // Solana providers
    if (config.solana?.enabled) {
      const { SolanaProvider } = await import('./onchain/providers/SolanaProvider.js')
      const solanaProvider = new SolanaProvider(config.solana)
      this.onChainRegistry.register('solana', solanaProvider)
      this.logger.info('Solana on-chain provider registered')
    }

    // Bitcoin providers
    if (config.bitcoin?.enabled) {
      const { BitcoinProvider } = await import('./onchain/providers/BitcoinProvider.js')
      const bitcoinProvider = new BitcoinProvider(config.bitcoin)
      this.onChainRegistry.register('bitcoin', bitcoinProvider)
      this.logger.info('Bitcoin on-chain provider registered')
    }
  }

  /**
   * Get a specific registry
   */
  getRegistry(type) {
    const registries = {
      auth: this.authRegistry,
      payment: this.paymentRegistry,
      wallet: this.walletRegistry,
      kyc: this.kycRegistry,
      twofa: this.twoFARegistry,
      onchain: this.onChainRegistry
    }

    const registry = registries[type]
    if (!registry) {
      throw new Error(`Unknown registry type: ${type}`)
    }

    return registry
  }

  /**
   * Execute operation with automatic provider selection and fallback
   */
  async execute(registryType, operation, operationData, options = {}) {
    if (!this.isInitialized) {
      await this.initialize()
    }

    const registry = this.getRegistry(registryType)
    
    try {
      const result = await registry.executeWithFallback(operation, operationData, options)
      
      this.logger.info(`${registryType} operation successful`, {
        operation,
        provider: result.provider,
        duration: result.duration
      })
      
      return result
    } catch (error) {
      this.logger.error(`${registryType} operation failed`, {
        operation,
        error: error.message,
        attempts: error.attempts
      })
      
      throw error
    }
  }

  /**
   * Get provider health status
   */
  async getHealthStatus() {
    return await this.healthMonitor.getOverallHealth()
  }

  /**
   * Shutdown all integrations gracefully
   */
  async shutdown() {
    try {
      await this.healthMonitor.stop()
      
      // Shutdown all registries
      await Promise.all([
        this.authRegistry.shutdown(),
        this.paymentRegistry.shutdown(),
        this.walletRegistry.shutdown(),
        this.kycRegistry.shutdown(),
        this.twoFARegistry.shutdown(),
        this.onChainRegistry.shutdown()
      ])

      this.isInitialized = false
      this.initializationPromise = null
      
      this.logger.info('Integration manager shutdown completed')
    } catch (error) {
      this.logger.error('Integration manager shutdown failed', error)
      throw error
    }
  }
}

// Singleton instance
let integrationManager = null

export const getIntegrationManager = async () => {
  if (!integrationManager) {
    integrationManager = new IntegrationManager()
    await integrationManager.initialize()
  }
  return integrationManager
}

export default IntegrationManager