/**
 * Account Domain Service
 * Handles account-related business logic and orchestration
 */

import { User, UserStatus, KYCStatus } from '../models/User.js'
import { Account, AccountType, AccountStatus } from '../models/Account.js'
import { AccountCreatedEvent, AccountUpdatedEvent, KYCCompletedEvent } from '../events/AccountEvents.js'
import { eventStore } from '../../../events/EventStore.js'
import { commandBus } from '../../../cqrs/CommandBus.js'
import { securityManager } from '../../../security/SecurityManager.js'

/**
 * Account Service - Domain service for account operations
 */
export class AccountService {
  constructor(userRepository, accountRepository) {
    this.userRepository = userRepository
    this.accountRepository = accountRepository
  }

  /**
   * Create new user account
   */
  async createUserAccount(userData) {
    // Validate unique username and email
    if (await this.userRepository.usernameExists(userData.username)) {
      throw new Error('Username already exists')
    }
    
    if (await this.userRepository.emailExists(userData.email)) {
      throw new Error('Email already exists')
    }
    
    // Create user entity
    const user = new User({
      ...userData,
      status: UserStatus.PENDING_VERIFICATION
    })
    
    // Create account entity
    const account = new Account({
      userId: user.id,
      type: AccountType.PERSONAL,
      status: AccountStatus.ACTIVE
    })
    
    // Add default Solana wallet
    account.addWallet({
      chain: 'SOL',
      address: this.generateMockWalletAddress('SOL'),
      type: 'internal',
      isPrimary: true
    })
    
    // Save entities
    await this.userRepository.save(user)
    await this.accountRepository.save(account)
    
    // Publish domain event
    await eventStore.appendEvent(
      account.id,
      'ACCOUNT_CREATED',
      new AccountCreatedEvent({
        accountId: account.id,
        userId: user.id,
        username: user.username,
        accountType: account.type
      })
    )
    
    // Log security event
    securityManager.logSecurityEvent('AUTHENTICATION_SUCCESS', {
      action: 'account_created',
      userId: user.id,
      accountId: account.id
    })
    
    return { user, account }
  }

  /**
   * Update user profile
   */
  async updateUserProfile(userId, profileData) {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }
    
    user.updateProfile(profileData)
    await this.userRepository.save(user)
    
    // Publish event
    await eventStore.appendEvent(
      userId,
      'USER_PROFILE_UPDATED',
      {
        userId: user.id,
        changes: profileData
      }
    )
    
    return user
  }

  /**
   * Complete KYC verification
   */
  async completeKYC(userId, kycData) {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }
    
    const account = await this.accountRepository.findByUserId(userId)
    if (!account) {
      throw new Error('Account not found')
    }
    
    // Update user KYC status
    user.security.kycStatus = kycData.status
    user.security.kycCompletedAt = new Date().toISOString()
    await this.userRepository.save(user)
    
    // Update account limits based on KYC
    if (kycData.status === KYCStatus.VERIFIED) {
      account.updateLimits({
        daily: {
          add: 25000,
          withdraw: 25000,
          send: 50000,
          buy: 50000,
          sell: 50000,
          invest: 100000
        },
        monthly: {
          add: 250000,
          withdraw: 250000,
          send: 500000,
          buy: 500000,
          sell: 500000,
          invest: 1000000
        }
      })
      
      await this.accountRepository.save(account)
    }
    
    // Publish KYC completed event
    await eventStore.appendEvent(
      account.id,
      'KYC_COMPLETED',
      new KYCCompletedEvent({
        userId: user.id,
        accountId: account.id,
        kycStatus: kycData.status,
        completedAt: user.security.kycCompletedAt
      })
    )
    
    return { user, account }
  }

  /**
   * Add wallet to account
   */
  async addWallet(userId, walletData) {
    const account = await this.accountRepository.findByUserId(userId)
    if (!account) {
      throw new Error('Account not found')
    }
    
    // Check if wallet already exists
    if (account.wallets.some(w => w.address === walletData.address)) {
      throw new Error('Wallet already exists')
    }
    
    // Add wallet
    const wallet = account.addWallet({
      ...walletData,
      address: walletData.address || this.generateMockWalletAddress(walletData.chain)
    })
    
    await this.accountRepository.save(account)
    
    // Get and publish domain events
    const events = account.getEvents()
    for (const event of events) {
      await eventStore.appendEvent(account.id, event.type, event.data)
    }
    
    return wallet
  }

  /**
   * Get user with account details
   */
  async getUserWithAccount(userId) {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }
    
    const account = await this.accountRepository.findByUserId(userId)
    if (!account) {
      throw new Error('Account not found')
    }
    
    return { user, account }
  }

  /**
   * Suspend user account
   */
  async suspendAccount(userId, reason) {
    const user = await this.userRepository.findById(userId)
    if (!user) {
      throw new Error('User not found')
    }
    
    const account = await this.accountRepository.findByUserId(userId)
    if (!account) {
      throw new Error('Account not found')
    }
    
    // Suspend user
    user.suspend(reason)
    await this.userRepository.save(user)
    
    // Suspend account
    account.status = AccountStatus.SUSPENDED
    await this.accountRepository.save(account)
    
    // Publish event
    await eventStore.appendEvent(
      account.id,
      'ACCOUNT_SUSPENDED',
      {
        userId: user.id,
        accountId: account.id,
        reason,
        suspendedAt: user.security.suspendedAt
      }
    )
    
    // Log security event
    securityManager.logSecurityEvent('SECURITY_VIOLATION', {
      action: 'account_suspended',
      userId: user.id,
      accountId: account.id,
      reason,
      severity: 'high'
    })
    
    return { user, account }
  }

  /**
   * Generate mock wallet address
   */
  generateMockWalletAddress(chain) {
    const prefixes = {
      SOL: '11111111111111111111111111111111',
      ETH: '0x0000000000000000000000000000000000000000',
      BTC: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
      SUI: '0x0000000000000000000000000000000000000000000000000000000000000000'
    }
    
    const prefix = prefixes[chain] || ''
    const random = Math.random().toString(36).substring(2, 8)
    
    return `${prefix.slice(0, -6)}${random}`
  }
}