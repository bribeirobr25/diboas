/**
 * User Entity - Core domain model for user accounts
 */

import { generateSecureId } from '../../../utils/security.js'
import { AggregateRoot } from '../../shared/AggregateRoot.js'
import { ValueObject, Email, Username, Phone } from '../../shared/ValueObject.js'

/**
 * User entity representing a diBoaS platform user
 */
export class User extends AggregateRoot {
  constructor(data = {}) {
    super()
    this.id = data.id || generateSecureId('user')
    this.username = data.username // @username format
    this.email = data.email
    this.profile = new UserProfile(data.profile || {})
    this.preferences = new UserPreferences(data.preferences || {})
    this.security = new UserSecurity(data.security || {})
    this.status = data.status || UserStatus.ACTIVE
    this.createdAt = data.createdAt || new Date().toISOString()
    this.updatedAt = data.updatedAt || new Date().toISOString()
    this.lastLoginAt = data.lastLoginAt || null
  }

  /**
   * Update user profile
   */
  updateProfile(profileData) {
    this.profile = new UserProfile({ ...this.profile, ...profileData })
    this.updatedAt = new Date().toISOString()
    return this
  }

  /**
   * Update user preferences
   */
  updatePreferences(preferencesData) {
    this.preferences = new UserPreferences({ ...this.preferences, ...preferencesData })
    this.updatedAt = new Date().toISOString()
    return this
  }

  /**
   * Record login
   */
  recordLogin() {
    this.lastLoginAt = new Date().toISOString()
    this.security.lastLoginAt = this.lastLoginAt
    return this
  }

  /**
   * Enable two-factor authentication
   */
  enableTwoFactor(secret) {
    this.security.twoFactorEnabled = true
    this.security.twoFactorSecret = secret
    this.updatedAt = new Date().toISOString()
    return this
  }

  /**
   * Disable two-factor authentication
   */
  disableTwoFactor() {
    this.security.twoFactorEnabled = false
    this.security.twoFactorSecret = null
    this.updatedAt = new Date().toISOString()
    return this
  }

  /**
   * Suspend user account
   */
  suspend(reason) {
    this.status = UserStatus.SUSPENDED
    this.security.suspensionReason = reason
    this.security.suspendedAt = new Date().toISOString()
    this.updatedAt = new Date().toISOString()
    return this
  }

  /**
   * Reactivate user account
   */
  reactivate() {
    this.status = UserStatus.ACTIVE
    this.security.suspensionReason = null
    this.security.suspendedAt = null
    this.updatedAt = new Date().toISOString()
    return this
  }

  /**
   * Check if user can perform financial operations
   */
  canPerformFinancialOperations() {
    return this.status === UserStatus.ACTIVE && 
           this.security.kycStatus === KYCStatus.VERIFIED
  }

  /**
   * Check if user requires KYC
   */
  requiresKYC() {
    return this.security.kycStatus === KYCStatus.NOT_STARTED ||
           this.security.kycStatus === KYCStatus.PENDING
  }

  /**
   * Validate user invariants
   */
  validate() {
    if (!this.id || !this.username || !this.email) {
      return false
    }
    
    try {
      new Username(this.username)
      new Email(this.email)
      return true
    } catch {
      return false
    }
  }

  /**
   * Create snapshot for event sourcing
   */
  toSnapshot() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      profile: this.profile,
      preferences: this.preferences,
      security: this.security,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt
    }
  }

  /**
   * Load from snapshot
   */
  fromSnapshot(state) {
    this.id = state.id
    this.username = state.username
    this.email = state.email
    this.profile = new UserProfile(state.profile || {})
    this.preferences = new UserPreferences(state.preferences || {})
    this.security = new UserSecurity(state.security || {})
    this.status = state.status
    this.createdAt = state.createdAt
    this.updatedAt = state.updatedAt
    this.lastLoginAt = state.lastLoginAt
  }

  /**
   * Convert to plain object
   */
  toJSON() {
    return {
      id: this.id,
      username: this.username,
      email: this.email,
      profile: this.profile,
      preferences: this.preferences,
      security: {
        ...this.security,
        twoFactorSecret: undefined // Never expose secret
      },
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      lastLoginAt: this.lastLoginAt
    }
  }

  /**
   * Create from plain object
   */
  static fromJSON(data) {
    return new User(data)
  }
}

/**
 * User Profile Value Object
 */
export class UserProfile {
  constructor(data = {}) {
    this.firstName = data.firstName || ''
    this.lastName = data.lastName || ''
    this.displayName = data.displayName || ''
    this.avatarUrl = data.avatarUrl || null
    this.bio = data.bio || ''
    this.location = data.location || ''
    this.phone = data.phone || ''
  }

  get fullName() {
    return `${this.firstName} ${this.lastName}`.trim()
  }
}

/**
 * User Preferences Value Object
 */
export class UserPreferences {
  constructor(data = {}) {
    this.language = data.language || 'en'
    this.currency = data.currency || 'USD'
    this.timezone = data.timezone || 'UTC'
    this.notifications = new NotificationPreferences(data.notifications || {})
    this.privacy = new PrivacyPreferences(data.privacy || {})
    this.theme = data.theme || 'light'
  }
}

/**
 * Notification Preferences Value Object
 */
export class NotificationPreferences {
  constructor(data = {}) {
    this.email = data.email !== false
    this.push = data.push !== false
    this.sms = data.sms !== false
    this.transactionAlerts = data.transactionAlerts !== false
    this.priceAlerts = data.priceAlerts !== false
    this.strategyUpdates = data.strategyUpdates !== false
    this.marketingEmails = data.marketingEmails || false
  }
}

/**
 * Privacy Preferences Value Object
 */
export class PrivacyPreferences {
  constructor(data = {}) {
    this.publicProfile = data.publicProfile || false
    this.showBalance = data.showBalance || false
    this.showActivity = data.showActivity || false
    this.allowAnalytics = data.allowAnalytics !== false
  }
}

/**
 * User Security Value Object
 */
export class UserSecurity {
  constructor(data = {}) {
    this.twoFactorEnabled = data.twoFactorEnabled || false
    this.twoFactorSecret = data.twoFactorSecret || null
    this.kycStatus = data.kycStatus || KYCStatus.NOT_STARTED
    this.kycCompletedAt = data.kycCompletedAt || null
    this.amlStatus = data.amlStatus || AMLStatus.NOT_CHECKED
    this.riskScore = data.riskScore || 0
    this.lastLoginAt = data.lastLoginAt || null
    this.lastPasswordChange = data.lastPasswordChange || null
    this.suspensionReason = data.suspensionReason || null
    this.suspendedAt = data.suspendedAt || null
  }
}

/**
 * User Status Enum
 */
export const UserStatus = {
  ACTIVE: 'active',
  SUSPENDED: 'suspended',
  DEACTIVATED: 'deactivated',
  PENDING_VERIFICATION: 'pending_verification'
}

/**
 * KYC Status Enum
 */
export const KYCStatus = {
  NOT_STARTED: 'not_started',
  PENDING: 'pending',
  VERIFIED: 'verified',
  REJECTED: 'rejected',
  EXPIRED: 'expired'
}

/**
 * AML Status Enum
 */
export const AMLStatus = {
  NOT_CHECKED: 'not_checked',
  CLEAR: 'clear',
  REVIEW: 'review',
  FLAGGED: 'flagged'
}