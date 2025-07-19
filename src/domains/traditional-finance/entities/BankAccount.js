/**
 * Bank Account Entity - Traditional Finance Domain
 * Handles traditional banking operations with regulatory compliance
 */

import Money from '../../shared/value-objects/Money.js'

export class BankAccount {
  constructor(accountId, userId, accountNumber, routingNumber, bankName, accountType = 'CHECKING') {
    this.accountId = accountId
    this.userId = userId
    this.accountNumber = this.maskAccountNumber(accountNumber)
    this.routingNumber = routingNumber
    this.bankName = bankName
    this.accountType = accountType
    this.balance = Money.zero('USD')
    this.status = 'ACTIVE'
    this.verificationStatus = 'PENDING'
    this.linkedAt = new Date()
    this.lastSyncAt = null
    this.complianceFlags = []
    
    // Traditional finance specific properties
    this.fdic_insured = true
    this.account_nickname = null
    this.monthly_statement_day = 1
    this.overdraft_protection = false
    this.minimum_balance = Money.usd(0)
    
    // Audit trail
    this.createdAt = new Date()
    this.updatedAt = new Date()
    
    this.validate()
  }

  /**
   * Update account balance (from bank sync)
   */
  updateBalance(newBalance) {
    if (!(newBalance instanceof Money)) {
      throw new Error('Balance must be a Money object')
    }
    
    if (!newBalance.isTraditionalCurrency()) {
      throw new Error('Bank account can only hold traditional currencies')
    }

    const oldBalance = this.balance
    this.balance = newBalance
    this.lastSyncAt = new Date()
    this.updatedAt = new Date()

    // Emit domain event
    this.addDomainEvent({
      type: 'BankAccountBalanceUpdated',
      accountId: this.accountId,
      userId: this.userId,
      oldBalance: oldBalance.toJSON(),
      newBalance: newBalance.toJSON(),
      timestamp: new Date()
    })

    // Check for compliance triggers
    this.checkComplianceTriggers(oldBalance, newBalance)
  }

  /**
   * Initiate ACH transfer from this account
   */
  initiateACHTransfer(amount, destinationAccount, memo = '') {
    this.validateTransferEligibility()
    
    if (amount.greaterThan(this.balance)) {
      throw new Error('Insufficient funds for transfer')
    }

    if (!amount.meetsMinimumTransfer()) {
      throw new Error('Transfer amount below minimum threshold')
    }

    // Apply daily transfer limits
    if (amount.greaterThan(Money.usd(25000))) {
      throw new Error('Transfer amount exceeds daily limit')
    }

    // Check for suspicious activity
    if (amount.requiresAdditionalVerification()) {
      this.flagForManualReview('LARGE_TRANSFER', amount)
    }

    // Create transfer object (would be handled by payment service)
    const transfer = {
      transferId: this.generateTransferId(),
      fromAccount: this.accountId,
      toAccount: destinationAccount,
      amount: amount.toJSON(),
      memo,
      status: 'INITIATED',
      estimatedSettlement: this.calculateSettlementDate(),
      complianceChecked: true,
      initiatedAt: new Date()
    }

    // Emit domain event
    this.addDomainEvent({
      type: 'ACHTransferInitiated',
      transferId: transfer.transferId,
      accountId: this.accountId,
      userId: this.userId,
      amount: amount.toJSON(),
      destinationAccount,
      timestamp: new Date()
    })

    return transfer
  }

  /**
   * Process incoming ACH transfer
   */
  receiveACHTransfer(amount, sourceAccount, transferId) {
    if (this.status !== 'ACTIVE') {
      throw new Error('Cannot receive transfers to inactive account')
    }

    // Update balance
    this.balance = this.balance.add(amount)
    this.lastSyncAt = new Date()
    this.updatedAt = new Date()

    // Emit domain event
    this.addDomainEvent({
      type: 'ACHTransferReceived',
      transferId,
      accountId: this.accountId,
      userId: this.userId,
      amount: amount.toJSON(),
      sourceAccount,
      newBalance: this.balance.toJSON(),
      timestamp: new Date()
    })

    // Check for compliance triggers on deposits
    if (amount.requiresAdditionalVerification()) {
      this.flagForManualReview('LARGE_DEPOSIT', amount)
    }
  }

  /**
   * Verify account ownership (micro-deposits)
   */
  verifyOwnership(microDeposit1, microDeposit2) {
    // This would integrate with bank verification service
    if (this.verificationStatus === 'VERIFIED') {
      throw new Error('Account already verified')
    }

    // Simulate micro-deposit verification
    const isValid = this.validateMicroDeposits(microDeposit1, microDeposit2)
    
    if (isValid) {
      this.verificationStatus = 'VERIFIED'
      this.updatedAt = new Date()

      this.addDomainEvent({
        type: 'BankAccountVerified',
        accountId: this.accountId,
        userId: this.userId,
        timestamp: new Date()
      })
    } else {
      this.verificationStatus = 'FAILED'
      throw new Error('Micro-deposit verification failed')
    }
  }

  /**
   * Compliance and regulatory methods
   */
  
  flagForManualReview(reason, additionalData = null) {
    this.complianceFlags.push({
      reason,
      flaggedAt: new Date(),
      data: additionalData,
      resolved: false
    })

    this.addDomainEvent({
      type: 'AccountFlaggedForReview',
      accountId: this.accountId,
      userId: this.userId,
      reason,
      data: additionalData,
      timestamp: new Date()
    })
  }

  checkComplianceTriggers(oldBalance, newBalance) {
    // Large cash transaction reporting (BSA/AML)
    const change = newBalance.subtract(oldBalance)
    
    if (change.greaterThan(Money.usd(10000))) {
      this.flagForManualReview('CTR_THRESHOLD', change) // Currency Transaction Report
    }

    // Suspicious activity patterns
    if (this.detectSuspiciousPattern()) {
      this.flagForManualReview('SUSPICIOUS_PATTERN')
    }
  }

  detectSuspiciousPattern() {
    // This would implement sophisticated pattern detection
    // For now, simplified logic
    return false
  }

  /**
   * Account management methods
   */
  
  setNickname(nickname) {
    this.account_nickname = nickname
    this.updatedAt = new Date()
  }

  enableOverdraftProtection() {
    this.overdraft_protection = true
    this.updatedAt = new Date()
  }

  disableOverdraftProtection() {
    this.overdraft_protection = false
    this.updatedAt = new Date()
  }

  freeze() {
    this.status = 'FROZEN'
    this.updatedAt = new Date()

    this.addDomainEvent({
      type: 'BankAccountFrozen',
      accountId: this.accountId,
      userId: this.userId,
      timestamp: new Date()
    })
  }

  unfreeze() {
    this.status = 'ACTIVE'
    this.updatedAt = new Date()

    this.addDomainEvent({
      type: 'BankAccountUnfrozen',
      accountId: this.accountId,
      userId: this.userId,
      timestamp: new Date()
    })
  }

  /**
   * Private helper methods
   */
  
  validate() {
    if (!this.accountNumber || this.accountNumber.length < 4) {
      throw new Error('Invalid account number')
    }
    
    if (!this.routingNumber || !/^\d{9}$/.test(this.routingNumber)) {
      throw new Error('Invalid routing number')
    }

    if (!['CHECKING', 'SAVINGS', 'MONEY_MARKET'].includes(this.accountType)) {
      throw new Error('Invalid account type')
    }
  }

  validateTransferEligibility() {
    if (this.status !== 'ACTIVE') {
      throw new Error('Account is not active')
    }

    if (this.verificationStatus !== 'VERIFIED') {
      throw new Error('Account must be verified before transfers')
    }

    // Check if account is flagged
    const unresolvedFlags = this.complianceFlags.filter(flag => !flag.resolved)
    if (unresolvedFlags.length > 0) {
      throw new Error('Account has unresolved compliance flags')
    }
  }

  maskAccountNumber(accountNumber) {
    if (!accountNumber || accountNumber.length < 4) {
      return accountNumber
    }
    return '****' + accountNumber.slice(-4)
  }

  generateTransferId() {
    // SECURITY: Use cryptographically secure random ID generation
    if (typeof window !== 'undefined' && window.crypto && window.crypto.getRandomValues) {
      const array = new Uint8Array(16)
      window.crypto.getRandomValues(array)
      const randomHex = Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
      return `ach_${randomHex}`
    }
    
    // Fallback for Node.js environments
    try {
      const crypto = require('crypto')
      return `ach_${crypto.randomBytes(16).toString('hex')}`
    } catch (error) {
      // Ultimate fallback (should not be used in production)
      console.warn('⚠️  Using weak random ID generation. Install crypto module.')
      return `ach_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`
    }
  }

  calculateSettlementDate() {
    // ACH transfers typically settle in 1-3 business days
    const now = new Date()
    const businessDays = 2 // Standard ACH settlement
    
    let settlementDate = new Date(now)
    let addedDays = 0
    
    while (addedDays < businessDays) {
      settlementDate.setDate(settlementDate.getDate() + 1)
      // Skip weekends (simplified - real implementation would skip holidays too)
      if (settlementDate.getDay() !== 0 && settlementDate.getDay() !== 6) {
        addedDays++
      }
    }
    
    return settlementDate
  }

  validateMicroDeposits(deposit1, deposit2) {
    // This would validate against actual micro-deposits sent
    // For demo purposes, accept any small amounts
    return deposit1 > 0 && deposit1 < 1 && deposit2 > 0 && deposit2 < 1
  }

  addDomainEvent(event) {
    if (!this.domainEvents) {
      this.domainEvents = []
    }
    this.domainEvents.push(event)
  }

  clearDomainEvents() {
    this.domainEvents = []
  }

  /**
   * Serialization for persistence
   */
  toJSON() {
    return {
      accountId: this.accountId,
      userId: this.userId,
      accountNumber: this.accountNumber,
      routingNumber: this.routingNumber,
      bankName: this.bankName,
      accountType: this.accountType,
      balance: this.balance.toJSON(),
      status: this.status,
      verificationStatus: this.verificationStatus,
      linkedAt: this.linkedAt.toISOString(),
      lastSyncAt: this.lastSyncAt?.toISOString(),
      complianceFlags: this.complianceFlags,
      fdic_insured: this.fdic_insured,
      account_nickname: this.account_nickname,
      monthly_statement_day: this.monthly_statement_day,
      overdraft_protection: this.overdraft_protection,
      minimum_balance: this.minimum_balance.toJSON(),
      createdAt: this.createdAt.toISOString(),
      updatedAt: this.updatedAt.toISOString()
    }
  }

  static fromJSON(data) {
    const account = new BankAccount(
      data.accountId,
      data.userId,
      data.accountNumber,
      data.routingNumber,
      data.bankName,
      data.accountType
    )

    account.balance = Money.fromJSON(data.balance)
    account.status = data.status
    account.verificationStatus = data.verificationStatus
    account.linkedAt = new Date(data.linkedAt)
    account.lastSyncAt = data.lastSyncAt ? new Date(data.lastSyncAt) : null
    account.complianceFlags = data.complianceFlags || []
    account.fdic_insured = data.fdic_insured
    account.account_nickname = data.account_nickname
    account.monthly_statement_day = data.monthly_statement_day
    account.overdraft_protection = data.overdraft_protection
    account.minimum_balance = Money.fromJSON(data.minimum_balance)
    account.createdAt = new Date(data.createdAt)
    account.updatedAt = new Date(data.updatedAt)

    return account
  }
}

export default BankAccount