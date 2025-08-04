/**
 * Account Aggregate Root - Main account entity
 */

import { generateSecureId } from '../../../utils/security.js'
import { AggregateRoot } from '../../shared/AggregateRoot.js'

/**
 * Account aggregate root
 */
export class Account extends AggregateRoot {
  constructor(data = {}) {
    super()
    this.id = data.id || generateSecureId('account')
    this.userId = data.userId
    this.type = data.type || AccountType.PERSONAL
    this.status = data.status || AccountStatus.ACTIVE
    this.wallets = data.wallets || []
    this.limits = new AccountLimits(data.limits || {})
    this.features = new AccountFeatures(data.features || {})
    this.metadata = data.metadata || {}
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || new Date().toISOString()
  }

  /**
   * Add wallet to account
   */
  addWallet(walletData) {
    const wallet = new Wallet({
      ...walletData,
      accountId: this.id
    })
    
    this.wallets.push(wallet)
    this.updatedAt = new Date().toISOString()
    
    this.addDomainEvent({
      type: 'WalletAdded',
      data: { accountId: this.id, wallet }
    })
    
    return wallet
  }

  /**
   * Remove wallet from account
   */
  removeWallet(walletId) {
    const walletIndex = this.wallets.findIndex(w => w.id === walletId)
    if (walletIndex === -1) {
      throw new Error('Wallet not found')
    }
    
    const wallet = this.wallets[walletIndex]
    if (wallet.balance > 0) {
      throw new Error('Cannot remove wallet with positive balance')
    }
    
    this.wallets.splice(walletIndex, 1)
    this.updatedAt = new Date().toISOString()
    
    this.addDomainEvent({
      type: 'WalletRemoved',
      data: { accountId: this.id, walletId }
    })
  }

  /**
   * Update account limits
   */
  updateLimits(newLimits) {
    this.limits = new AccountLimits({ ...this.limits, ...newLimits })
    this.updatedAt = new Date().toISOString()
    
    this.addDomainEvent({
      type: 'AccountLimitsUpdated',
      data: { accountId: this.id, limits: this.limits }
    })
    
    return this
  }

  /**
   * Enable feature
   */
  enableFeature(feature) {
    this.features[feature] = true
    this.updatedAt = new Date().toISOString()
    
    this.addDomainEvent({
      type: 'FeatureEnabled',
      data: { accountId: this.id, feature }
    })
    
    return this
  }

  /**
   * Disable feature
   */
  disableFeature(feature) {
    this.features[feature] = false
    this.updatedAt = new Date().toISOString()
    
    this.addDomainEvent({
      type: 'FeatureDisabled',
      data: { accountId: this.id, feature }
    })
    
    return this
  }

  /**
   * Check if can perform transaction
   */
  canPerformTransaction(amount, transactionType) {
    if (this.status !== AccountStatus.ACTIVE) {
      return { allowed: false, reason: 'Account not active' }
    }
    
    const dailyLimit = this.limits.getDailyLimit(transactionType)
    const monthlyLimit = this.limits.getMonthlyLimit(transactionType)
    
    if (amount > dailyLimit) {
      return { allowed: false, reason: 'Exceeds daily limit' }
    }
    
    if (amount > monthlyLimit) {
      return { allowed: false, reason: 'Exceeds monthly limit' }
    }
    
    return { allowed: true }
  }

  /**
   * Get primary wallet
   */
  getPrimaryWallet() {
    return this.wallets.find(w => w.isPrimary) || this.wallets[0]
  }

  /**
   * Get wallet by chain
   */
  getWalletByChain(chain) {
    return this.wallets.find(w => w.chain === chain)
  }

  /**
   * Validate account invariants
   */
  validate() {
    if (!this.id || !this.userId) {
      return false
    }
    
    if (!Object.values(AccountType).includes(this.type)) {
      return false
    }
    
    if (!Object.values(AccountStatus).includes(this.status)) {
      return false
    }
    
    return true
  }

  /**
   * Create snapshot for event sourcing
   */
  toSnapshot() {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      status: this.status,
      wallets: this.wallets,
      limits: this.limits,
      features: this.features,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }

  /**
   * Load from snapshot
   */
  fromSnapshot(state) {
    this.id = state.id
    this.userId = state.userId
    this.type = state.type
    this.status = state.status
    this.wallets = state.wallets
    this.limits = new AccountLimits(state.limits || {})
    this.features = new AccountFeatures(state.features || {})
    this.metadata = state.metadata
    this.createdAt = state.createdAt
    this.updatedAt = state.updatedAt
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      status: this.status,
      wallets: this.wallets,
      limits: this.limits,
      features: this.features,
      metadata: this.metadata,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    }
  }
}

/**
 * Wallet Value Object
 */
export class Wallet {
  constructor(data = {}) {
    this.id = data.id || generateSecureId('wallet')
    this.accountId = data.accountId
    this.chain = data.chain
    this.address = data.address
    this.type = data.type || WalletType.INTERNAL
    this.isPrimary = data.isPrimary || false
    this.balance = data.balance || 0
    this.label = data.label || ''
    this.createdAt = data.createdAt || new Date().toISOString()
  }
}

/**
 * Account Limits Value Object
 */
export class AccountLimits {
  constructor(data = {}) {
    this.daily = {
      add: data.daily?.add || 5000,
      withdraw: data.daily?.withdraw || 5000,
      send: data.daily?.send || 10000,
      buy: data.daily?.buy || 10000,
      sell: data.daily?.sell || 10000,
      invest: data.daily?.invest || 50000
    }
    
    this.monthly = {
      add: data.monthly?.add || 50000,
      withdraw: data.monthly?.withdraw || 50000,
      send: data.monthly?.send || 100000,
      buy: data.monthly?.buy || 100000,
      sell: data.monthly?.sell || 100000,
      invest: data.monthly?.invest || 500000
    }
    
    this.perTransaction = {
      add: data.perTransaction?.add || 5000,
      withdraw: data.perTransaction?.withdraw || 5000,
      send: data.perTransaction?.send || 10000,
      buy: data.perTransaction?.buy || 10000,
      sell: data.perTransaction?.sell || 10000,
      invest: data.perTransaction?.invest || 50000
    }
  }
  
  getDailyLimit(transactionType) {
    return this.daily[transactionType] || 0
  }
  
  getMonthlyLimit(transactionType) {
    return this.monthly[transactionType] || 0
  }
  
  getPerTransactionLimit(transactionType) {
    return this.perTransaction[transactionType] || 0
  }
}

/**
 * Account Features Value Object
 */
export class AccountFeatures {
  constructor(data = {}) {
    this.trading = data.trading !== false
    this.staking = data.staking !== false
    this.lending = data.lending || false
    this.strategies = data.strategies !== false
    this.multiChain = data.multiChain !== false
    this.advancedAnalytics = data.advancedAnalytics || false
    this.apiAccess = data.apiAccess || false
  }
}

/**
 * Account Type Enum
 */
export const AccountType = {
  PERSONAL: 'personal',
  BUSINESS: 'business',
  INSTITUTION: 'institution'
}

/**
 * Account Status Enum
 */
export const AccountStatus = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  FROZEN: 'frozen',
  CLOSED: 'closed'
}

/**
 * Wallet Type Enum
 */
export const WalletType = {
  INTERNAL: 'internal',
  EXTERNAL: 'external',
  HARDWARE: 'hardware'
}