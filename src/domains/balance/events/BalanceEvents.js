/**
 * Balance Domain Events
 * Events that occur within the balance bounded context
 */

/**
 * Base Balance Event
 */
export class BalanceEvent {
  constructor(data) {
    this.timestamp = new Date().toISOString()
    this.data = data
  }
}

/**
 * Balance Initialized Event
 */
export class BalanceInitializedEvent extends BalanceEvent {
  constructor(data) {
    super(data)
    this.type = 'BalanceInitialized'
    this.balanceId = data.balanceId
    this.accountId = data.accountId
  }
}

/**
 * Balance Updated Event
 */
export class BalanceUpdatedEvent extends BalanceEvent {
  constructor(data) {
    super(data)
    this.type = 'BalanceUpdated'
    this.balanceId = data.balanceId
    this.accountId = data.accountId
    this.totalUSD = data.totalUSD
    this.availableForSpending = data.availableForSpending
  }
}

/**
 * Balance Credited Event
 */
export class BalanceCreditedEvent extends BalanceEvent {
  constructor(data) {
    super(data)
    this.type = 'BalanceCredited'
    this.accountId = data.accountId
    this.amount = data.amount
    this.asset = data.asset
    this.chain = data.chain
    this.reason = data.reason
    this.metadata = data.metadata
  }
}

/**
 * Balance Debited Event
 */
export class BalanceDebitedEvent extends BalanceEvent {
  constructor(data) {
    super(data)
    this.type = 'BalanceDebited'
    this.accountId = data.accountId
    this.amount = data.amount
    this.asset = data.asset
    this.chain = data.chain
    this.reason = data.reason
    this.metadata = data.metadata
  }
}

/**
 * Asset Balance Updated Event
 */
export class AssetBalanceUpdatedEvent extends BalanceEvent {
  constructor(data) {
    super(data)
    this.type = 'AssetBalanceUpdated'
    this.accountId = data.accountId
    this.asset = data.asset
    this.chain = data.chain
    this.previousBalance = data.previousBalance
    this.newBalance = data.newBalance
    this.usdValue = data.usdValue
  }
}

/**
 * Asset Transfer Completed Event
 */
export class AssetTransferCompletedEvent extends BalanceEvent {
  constructor(data) {
    super(data)
    this.type = 'AssetTransferCompleted'
    this.accountId = data.accountId
    this.fromAsset = data.fromAsset
    this.toAsset = data.toAsset
    this.fromAmount = data.fromAmount
    this.toAmount = data.toAmount
    this.exchangeRate = data.exchangeRate
    this.chain = data.chain
  }
}

/**
 * Funds Locked For Strategy Event
 */
export class FundsLockedForStrategyEvent extends BalanceEvent {
  constructor(data) {
    super(data)
    this.type = 'FundsLockedForStrategy'
    this.accountId = data.accountId
    this.amount = data.amount
    this.strategyId = data.strategyId
    this.lockedAt = data.lockedAt || new Date().toISOString()
  }
}

/**
 * Funds Released From Strategy Event
 */
export class FundsReleasedFromStrategyEvent extends BalanceEvent {
  constructor(data) {
    super(data)
    this.type = 'FundsReleasedFromStrategy'
    this.accountId = data.accountId
    this.amount = data.amount
    this.strategyId = data.strategyId
    this.releasedAt = data.releasedAt || new Date().toISOString()
  }
}

/**
 * Price Updated Event
 */
export class PriceUpdatedEvent extends BalanceEvent {
  constructor(data) {
    super(data)
    this.type = 'PriceUpdated'
    this.asset = data.asset
    this.previousPrice = data.previousPrice
    this.newPrice = data.newPrice
    this.changePercent = data.changePercent
  }
}

/**
 * Low Balance Alert Event
 */
export class LowBalanceAlertEvent extends BalanceEvent {
  constructor(data) {
    super(data)
    this.type = 'LowBalanceAlert'
    this.accountId = data.accountId
    this.asset = data.asset
    this.currentBalance = data.currentBalance
    this.threshold = data.threshold
  }
}

/**
 * Balance Snapshot Created Event
 */
export class BalanceSnapshotCreatedEvent extends BalanceEvent {
  constructor(data) {
    super(data)
    this.type = 'BalanceSnapshotCreated'
    this.snapshotId = data.snapshotId
    this.balanceId = data.balanceId
    this.accountId = data.accountId
    this.totalUSD = data.totalUSD
  }
}

/**
 * Chain Balance Updated Event
 */
export class ChainBalanceUpdatedEvent extends BalanceEvent {
  constructor(data) {
    super(data)
    this.type = 'ChainBalanceUpdated'
    this.accountId = data.accountId
    this.chain = data.chain
    this.totalValue = data.totalValue
    this.gasBalance = data.gasBalance
  }
}

/**
 * Insufficient Balance Event
 */
export class InsufficientBalanceEvent extends BalanceEvent {
  constructor(data) {
    super(data)
    this.type = 'InsufficientBalance'
    this.accountId = data.accountId
    this.requestedAmount = data.requestedAmount
    this.availableAmount = data.availableAmount
    this.asset = data.asset
    this.operation = data.operation
  }
}