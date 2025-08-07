/**
 * Transaction Aggregate Root
 * Manages all transaction types and states
 */

import { generateSecureId } from '../../../utils/security.js'
import { AggregateRoot } from '../../shared/AggregateRoot.js'
import { Money } from '../../shared/ValueObject.js'

/**
 * Transaction aggregate root
 */
export class Transaction extends AggregateRoot {
  constructor(data = {}) {
    super()
    this.id = data.id || generateSecureId('tx')
    this.accountId = data.accountId
    this.type = data.type
    this.status = data.status || TransactionStatus.PENDING
    this.amount = data.amount instanceof Money ? data.amount : new Money(data.amount || 0, data.asset || 'USDC')
    this.asset = data.asset || 'USDC'
    this.chain = data.chain || 'SOL'
    this.direction = data.direction || this.determineDirection(data.type)
    this.fees = new TransactionFees(data.fees || {})
    this.metadata = new TransactionMetadata(data.metadata || {})
    this.timeline = new TransactionTimeline(data.timeline || {})
    this.result = data.result || null
    this.error = data.error || null
  }

  /**
   * Determine transaction direction
   */
  determineDirection(type) {
    const incomingTypes = ['add', 'receive', 'buy']
    const outgoingTypes = ['withdraw', 'send', 'sell']
    
    if (incomingTypes.includes(type)) return TransactionDirection.INCOMING
    if (outgoingTypes.includes(type)) return TransactionDirection.OUTGOING
    return TransactionDirection.INTERNAL
  }

  /**
   * Start processing transaction
   */
  startProcessing() {
    if (this.status !== TransactionStatus.PENDING) {
      throw new Error('Transaction already processed')
    }
    
    this.status = TransactionStatus.PROCESSING
    this.timeline.processingStartedAt = new Date().toISOString()
    this._version++
    
    this.addDomainEvent({
      type: 'TransactionProcessingStarted',
      data: {
        transactionId: this.id,
        accountId: this.accountId
      }
    })
    
    return this
  }

  /**
   * Complete transaction successfully
   */
  complete(result) {
    if (this.status !== TransactionStatus.PROCESSING) {
      throw new Error('Transaction must be processing to complete')
    }
    
    this.status = TransactionStatus.COMPLETED
    this.result = result
    this.timeline.completedAt = new Date().toISOString()
    this._version++
    
    this.addDomainEvent({
      type: 'TransactionCompleted',
      data: {
        transactionId: this.id,
        accountId: this.accountId,
        result
      }
    })
    
    return this
  }

  /**
   * Fail transaction
   */
  fail(error) {
    if ([TransactionStatus.COMPLETED, TransactionStatus.FAILED].includes(this.status)) {
      throw new Error('Transaction already finalized')
    }
    
    this.status = TransactionStatus.FAILED
    this.error = {
      message: error.message || error,
      code: error.code,
      timestamp: new Date().toISOString()
    }
    this.timeline.failedAt = new Date().toISOString()
    this._version++
    
    this.addDomainEvent({
      type: 'TransactionFailed',
      data: {
        transactionId: this.id,
        accountId: this.accountId,
        error: this.error
      }
    })
    
    return this
  }

  /**
   * Cancel transaction
   */
  cancel(reason) {
    if ([TransactionStatus.COMPLETED, TransactionStatus.FAILED].includes(this.status)) {
      throw new Error('Cannot cancel finalized transaction')
    }
    
    this.status = TransactionStatus.CANCELLED
    this.metadata.cancellationReason = reason
    this.timeline.cancelledAt = new Date().toISOString()
    this._version++
    
    this.addDomainEvent({
      type: 'TransactionCancelled',
      data: {
        transactionId: this.id,
        accountId: this.accountId,
        reason
      }
    })
    
    return this
  }

  /**
   * Update fees
   */
  updateFees(fees) {
    this.fees = new TransactionFees({ ...this.fees, ...fees })
    this._version++
    
    this.addDomainEvent({
      type: 'TransactionFeesUpdated',
      data: {
        transactionId: this.id,
        fees: this.fees
      }
    })
    
    return this
  }

  /**
   * Add blockchain confirmation
   */
  addConfirmation(hash, confirmations = 1) {
    this.metadata.transactionHash = hash
    this.metadata.confirmations = confirmations
    this.timeline.confirmedAt = new Date().toISOString()
    this._version++
    
    this.addDomainEvent({
      type: 'TransactionConfirmed',
      data: {
        transactionId: this.id,
        hash,
        confirmations
      }
    })
    
    return this
  }

  /**
   * Get net amount (after fees)
   */
  getNetAmount() {
    if (this.direction === TransactionDirection.INCOMING) {
      return this.amount.subtract(new Money(this.fees.total, this.amount.currency))
    } else {
      return this.amount
    }
  }

  /**
   * Get total cost (amount + fees)
   */
  getTotalCost() {
    if (this.direction === TransactionDirection.OUTGOING) {
      return this.amount.add(new Money(this.fees.total, this.amount.currency))
    } else {
      return this.amount
    }
  }

  /**
   * Check if transaction is final
   */
  isFinal() {
    return [
      TransactionStatus.COMPLETED,
      TransactionStatus.FAILED,
      TransactionStatus.CANCELLED
    ].includes(this.status)
  }

  /**
   * Validate transaction invariants
   */
  validate() {
    if (!this.id || !this.accountId || !this.type) {
      return false
    }
    
    if (!this.amount || this.amount.amount <= 0) {
      return false
    }
    
    if (!Object.values(TransactionStatus).includes(this.status)) {
      return false
    }
    
    return true
  }

  /**
   * Create snapshot for event sourcing
   */
  createSnapshot() {
    return {
      id: this.id,
      accountId: this.accountId,
      type: this.type,
      status: this.status,
      amount: this.amount.toJSON(),
      asset: this.asset,
      chain: this.chain,
      direction: this.direction,
      fees: this.fees,
      metadata: this.metadata,
      timeline: this.timeline,
      result: this.result,
      error: this.error,
      version: this.getVersion()
    }
  }

  /**
   * Load from snapshot
   */
  loadFromSnapshot(snapshot) {
    this.id = snapshot.id
    this.accountId = snapshot.accountId
    this.type = snapshot.type
    this.status = snapshot.status
    this.amount = new Money(snapshot.amount.amount, snapshot.amount.currency)
    this.asset = snapshot.asset
    this.chain = snapshot.chain
    this.direction = snapshot.direction
    this.fees = new TransactionFees(snapshot.fees || {})
    this.metadata = new TransactionMetadata(snapshot.metadata || {})
    this.timeline = new TransactionTimeline(snapshot.timeline || {})
    this.result = snapshot.result
    this.error = snapshot.error
    this._version = snapshot.version || 0
  }

  /**
   * Replay events for event sourcing
   */
  replayEvents(events) {
    for (const event of events) {
      this.applyEvent(event)
    }
  }

  /**
   * Apply event to aggregate
   */
  applyEvent(event) {
    switch (event.type) {
      case 'TransactionProcessingStarted':
        this.status = TransactionStatus.PROCESSING
        this.timeline.processingStartedAt = event.timestamp
        break
      case 'TransactionCompleted':
        this.status = TransactionStatus.COMPLETED
        this.result = event.data.result
        this.timeline.completedAt = event.timestamp
        break
      case 'TransactionFailed':
        this.status = TransactionStatus.FAILED
        this.error = event.data.error
        this.timeline.failedAt = event.timestamp
        break
      case 'TransactionCancelled':
        this.status = TransactionStatus.CANCELLED
        this.metadata.cancellationReason = event.data.reason
        this.timeline.cancelledAt = event.timestamp
        break
      case 'TransactionFeesUpdated':
        this.fees = new TransactionFees(event.data.fees)
        break
      case 'TransactionConfirmed':
        this.metadata.transactionHash = event.data.hash
        this.metadata.confirmations = event.data.confirmations
        this.timeline.confirmedAt = event.timestamp
        break
    }
    
    this._version++
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      accountId: this.accountId,
      type: this.type,
      status: this.status,
      amount: this.amount.toJSON(),
      asset: this.asset,
      chain: this.chain,
      direction: this.direction,
      fees: this.fees,
      metadata: this.metadata,
      timeline: this.timeline,
      result: this.result,
      error: this.error,
      version: this.version
    }
  }
}

/**
 * Transaction Fees Value Object
 */
export class TransactionFees {
  constructor(data = {}) {
    this.diBoaS = data.diBoaS || 0
    this.network = data.network || 0
    this.provider = data.provider || 0
    this.routing = data.routing || 0
    this.total = data.total || this.calculateTotal()
    this.breakdown = data.breakdown || []
  }

  calculateTotal() {
    return this.diBoaS + this.network + this.provider + this.routing
  }
}

/**
 * Transaction Metadata Value Object
 */
export class TransactionMetadata {
  constructor(data = {}) {
    this.recipient = data.recipient
    this.sender = data.sender
    this.paymentMethod = data.paymentMethod
    this.note = data.note
    this.category = data.category
    this.tags = data.tags || []
    this.transactionHash = data.transactionHash
    this.confirmations = data.confirmations || 0
    this.exchangeRate = data.exchangeRate
    this.cancellationReason = data.cancellationReason
    this.ipAddress = data.ipAddress
    this.userAgent = data.userAgent
  }
}

/**
 * Transaction Timeline Value Object
 */
export class TransactionTimeline {
  constructor(data = {}) {
    this.createdAt = data.createdAt || new Date().toISOString()
    this.processingStartedAt = data.processingStartedAt
    this.confirmedAt = data.confirmedAt
    this.completedAt = data.completedAt
    this.failedAt = data.failedAt
    this.cancelledAt = data.cancelledAt
  }

  getDuration() {
    if (!this.completedAt && !this.failedAt && !this.cancelledAt) {
      return null
    }
    
    const endTime = this.completedAt || this.failedAt || this.cancelledAt
    return new Date(endTime) - new Date(this.createdAt)
  }
}

/**
 * Transaction Status Enum
 */
export const TransactionStatus = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
  CANCELLED: 'cancelled'
}

/**
 * Transaction Type Enum
 */
export const TransactionType = {
  ADD: 'add',
  WITHDRAW: 'withdraw',
  SEND: 'send',
  RECEIVE: 'receive',
  BUY: 'buy',
  SELL: 'sell',
  INVEST: 'invest'
}

/**
 * Transaction Direction Enum
 */
export const TransactionDirection = {
  INCOMING: 'incoming',
  OUTGOING: 'outgoing',
  INTERNAL: 'internal'
}