/**
 * Transaction Domain Events
 * Events that occur within the transaction bounded context
 */

/**
 * Base Transaction Event
 */
export class TransactionEvent {
  constructor(data) {
    this.timestamp = new Date().toISOString()
    this.data = data
  }
}

/**
 * Transaction Created Event
 */
export class TransactionCreatedEvent extends TransactionEvent {
  constructor(data) {
    super(data)
    this.type = 'TransactionCreated'
    this.transactionId = data.transactionId
    this.accountId = data.accountId
    this.transactionType = data.type
    this.amount = data.amount
    this.asset = data.asset
    this.fees = data.fees
  }
}

/**
 * Transaction Processing Started Event
 */
export class TransactionProcessingStartedEvent extends TransactionEvent {
  constructor(data) {
    super(data)
    this.type = 'TransactionProcessingStarted'
    this.transactionId = data.transactionId
    this.accountId = data.accountId
  }
}

/**
 * Transaction Completed Event
 */
export class TransactionCompletedEvent extends TransactionEvent {
  constructor(data) {
    super(data)
    this.type = 'TransactionCompleted'
    this.transactionId = data.transactionId
    this.accountId = data.accountId
    this.result = data.result
  }
}

/**
 * Transaction Failed Event
 */
export class TransactionFailedEvent extends TransactionEvent {
  constructor(data) {
    super(data)
    this.type = 'TransactionFailed'
    this.transactionId = data.transactionId
    this.accountId = data.accountId
    this.error = data.error
  }
}

/**
 * Transaction Cancelled Event
 */
export class TransactionCancelledEvent extends TransactionEvent {
  constructor(data) {
    super(data)
    this.type = 'TransactionCancelled'
    this.transactionId = data.transactionId
    this.accountId = data.accountId
    this.reason = data.reason
  }
}

/**
 * Transaction Confirmed Event
 */
export class TransactionConfirmedEvent extends TransactionEvent {
  constructor(data) {
    super(data)
    this.type = 'TransactionConfirmed'
    this.transactionId = data.transactionId
    this.hash = data.hash
    this.confirmations = data.confirmations
  }
}

/**
 * Transaction Fees Updated Event
 */
export class TransactionFeesUpdatedEvent extends TransactionEvent {
  constructor(data) {
    super(data)
    this.type = 'TransactionFeesUpdated'
    this.transactionId = data.transactionId
    this.fees = data.fees
  }
}

/**
 * Payment Received Event
 */
export class PaymentReceivedEvent extends TransactionEvent {
  constructor(data) {
    super(data)
    this.type = 'PaymentReceived'
    this.transactionId = data.transactionId
    this.paymentId = data.paymentId
    this.amount = data.amount
    this.paymentMethod = data.paymentMethod
  }
}

/**
 * Withdrawal Processed Event
 */
export class WithdrawalProcessedEvent extends TransactionEvent {
  constructor(data) {
    super(data)
    this.type = 'WithdrawalProcessed'
    this.transactionId = data.transactionId
    this.withdrawalId = data.withdrawalId
    this.destination = data.destination
  }
}

/**
 * Transfer Initiated Event
 */
export class TransferInitiatedEvent extends TransactionEvent {
  constructor(data) {
    super(data)
    this.type = 'TransferInitiated'
    this.transactionId = data.transactionId
    this.fromChain = data.fromChain
    this.toChain = data.toChain
    this.recipient = data.recipient
  }
}

/**
 * Trade Executed Event
 */
export class TradeExecutedEvent extends TransactionEvent {
  constructor(data) {
    super(data)
    this.type = 'TradeExecuted'
    this.transactionId = data.transactionId
    this.tradeType = data.tradeType // buy or sell
    this.fromAsset = data.fromAsset
    this.toAsset = data.toAsset
    this.fromAmount = data.fromAmount
    this.toAmount = data.toAmount
    this.exchangeRate = data.exchangeRate
    this.dexProvider = data.dexProvider
  }
}

/**
 * Investment Created Event
 */
export class InvestmentCreatedEvent extends TransactionEvent {
  constructor(data) {
    super(data)
    this.type = 'InvestmentCreated'
    this.transactionId = data.transactionId
    this.investmentId = data.investmentId
    this.strategyId = data.strategyId
    this.amount = data.amount
  }
}

/**
 * Transaction Rate Limited Event
 */
export class TransactionRateLimitedEvent extends TransactionEvent {
  constructor(data) {
    super(data)
    this.type = 'TransactionRateLimited'
    this.accountId = data.accountId
    this.transactionType = data.transactionType
    this.reason = data.reason
    this.retryAfter = data.retryAfter
  }
}

/**
 * Transaction Compliance Check Event
 */
export class TransactionComplianceCheckEvent extends TransactionEvent {
  constructor(data) {
    super(data)
    this.type = 'TransactionComplianceCheck'
    this.transactionId = data.transactionId
    this.checkType = data.checkType
    this.result = data.result
    this.flags = data.flags || []
  }
}

/**
 * Large Transaction Alert Event
 */
export class LargeTransactionAlertEvent extends TransactionEvent {
  constructor(data) {
    super(data)
    this.type = 'LargeTransactionAlert'
    this.transactionId = data.transactionId
    this.accountId = data.accountId
    this.amount = data.amount
    this.threshold = data.threshold
  }
}