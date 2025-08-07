/**
 * Account Domain Events
 * Events that occur within the account bounded context
 */

/**
 * Base Account Event
 */
export class AccountEvent {
  constructor(data) {
    this.timestamp = new Date().toISOString()
    this.data = data
  }
}

/**
 * Account Created Event
 */
export class AccountCreatedEvent extends AccountEvent {
  constructor(data) {
    super(data)
    this.type = 'AccountCreated'
    this.accountId = data.accountId
    this.userId = data.userId
    this.username = data.username
    this.accountType = data.accountType
  }
}

/**
 * Account Updated Event
 */
export class AccountUpdatedEvent extends AccountEvent {
  constructor(data) {
    super(data)
    this.type = 'AccountUpdated'
    this.accountId = data.accountId
    this.changes = data.changes
  }
}

/**
 * Account Suspended Event
 */
export class AccountSuspendedEvent extends AccountEvent {
  constructor(data) {
    super(data)
    this.type = 'AccountSuspended'
    this.accountId = data.accountId
    this.userId = data.userId
    this.reason = data.reason
    this.suspendedAt = data.suspendedAt
  }
}

/**
 * Account Reactivated Event
 */
export class AccountReactivatedEvent extends AccountEvent {
  constructor(data) {
    super(data)
    this.type = 'AccountReactivated'
    this.accountId = data.accountId
    this.userId = data.userId
    this.reactivatedAt = data.reactivatedAt
  }
}

/**
 * Wallet Added Event
 */
export class WalletAddedEvent extends AccountEvent {
  constructor(data) {
    super(data)
    this.type = 'WalletAdded'
    this.accountId = data.accountId
    this.walletId = data.walletId
    this.chain = data.chain
    this.address = data.address
  }
}

/**
 * Wallet Removed Event
 */
export class WalletRemovedEvent extends AccountEvent {
  constructor(data) {
    super(data)
    this.type = 'WalletRemoved'
    this.accountId = data.accountId
    this.walletId = data.walletId
  }
}

/**
 * KYC Started Event
 */
export class KYCStartedEvent extends AccountEvent {
  constructor(data) {
    super(data)
    this.type = 'KYCStarted'
    this.userId = data.userId
    this.accountId = data.accountId
    this.provider = data.provider
  }
}

/**
 * KYC Completed Event
 */
export class KYCCompletedEvent extends AccountEvent {
  constructor(data) {
    super(data)
    this.type = 'KYCCompleted'
    this.userId = data.userId
    this.accountId = data.accountId
    this.kycStatus = data.kycStatus
    this.completedAt = data.completedAt
  }
}

/**
 * User Profile Updated Event
 */
export class UserProfileUpdatedEvent extends AccountEvent {
  constructor(data) {
    super(data)
    this.type = 'UserProfileUpdated'
    this.userId = data.userId
    this.changes = data.changes
  }
}

/**
 * User Preferences Updated Event
 */
export class UserPreferencesUpdatedEvent extends AccountEvent {
  constructor(data) {
    super(data)
    this.type = 'UserPreferencesUpdated'
    this.userId = data.userId
    this.changes = data.changes
  }
}

/**
 * Two Factor Enabled Event
 */
export class TwoFactorEnabledEvent extends AccountEvent {
  constructor(data) {
    super(data)
    this.type = 'TwoFactorEnabled'
    this.userId = data.userId
    this.enabledAt = data.enabledAt
  }
}

/**
 * Two Factor Disabled Event
 */
export class TwoFactorDisabledEvent extends AccountEvent {
  constructor(data) {
    super(data)
    this.type = 'TwoFactorDisabled'
    this.userId = data.userId
    this.disabledAt = data.disabledAt
  }
}

/**
 * Account Limits Updated Event
 */
export class AccountLimitsUpdatedEvent extends AccountEvent {
  constructor(data) {
    super(data)
    this.type = 'AccountLimitsUpdated'
    this.accountId = data.accountId
    this.limits = data.limits
  }
}

/**
 * Feature Enabled Event
 */
export class FeatureEnabledEvent extends AccountEvent {
  constructor(data) {
    super(data)
    this.type = 'FeatureEnabled'
    this.accountId = data.accountId
    this.feature = data.feature
  }
}

/**
 * Feature Disabled Event
 */
export class FeatureDisabledEvent extends AccountEvent {
  constructor(data) {
    super(data)
    this.type = 'FeatureDisabled'
    this.accountId = data.accountId
    this.feature = data.feature
  }
}

/**
 * Login Event
 */
export class UserLoggedInEvent extends AccountEvent {
  constructor(data) {
    super(data)
    this.type = 'UserLoggedIn'
    this.userId = data.userId
    this.loginMethod = data.loginMethod
    this.ipAddress = data.ipAddress
    this.userAgent = data.userAgent
  }
}

/**
 * Logout Event
 */
export class UserLoggedOutEvent extends AccountEvent {
  constructor(data) {
    super(data)
    this.type = 'UserLoggedOut'
    this.userId = data.userId
    this.logoutReason = data.logoutReason
  }
}