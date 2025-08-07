/**
 * Balance Aggregate Root
 * Manages wallet balances and financial state
 */

import { generateSecureId } from '../../../utils/security.js'
import { AggregateRoot } from '../../shared/AggregateRoot.js'
import { Money } from '../../shared/ValueObject.js'

/**
 * Balance aggregate root
 */
export class Balance extends AggregateRoot {
  constructor(data = {}) {
    super()
    this.id = data.id || generateSecureId('balance')
    this.accountId = data.accountId
    this.totalUSD = data.totalUSD || 0
    this.availableForSpending = data.availableForSpending || 0
    this.investedAmount = data.investedAmount || 0
    this.strategyBalance = data.strategyBalance || 0
    this.assets = new Map(data.assets || [])
    this.chains = new Map(data.chains || [])
    this.lastUpdated = data.lastUpdated || new Date().toISOString()
  }

  /**
   * Update asset balance
   */
  updateAssetBalance(asset, amount, chain) {
    const assetBalance = this.assets.get(asset) || new AssetBalance({ asset, chain })
    assetBalance.updateBalance(amount)
    this.assets.set(asset, assetBalance)
    
    // Update chain balance
    const chainBalance = this.chains.get(chain) || new ChainBalance({ chain })
    chainBalance.updateAssetBalance(asset, amount)
    this.chains.set(chain, chainBalance)
    
    // Recalculate totals
    this.recalculateTotals()
    
    this.addDomainEvent({
      type: 'AssetBalanceUpdated',
      data: {
        accountId: this.accountId,
        asset,
        amount,
        chain,
        newBalance: assetBalance.balance
      }
    })
    
    return this
  }

  /**
   * Add to balance
   */
  credit(amount, asset = 'USD', chain = 'SOL') {
    if (amount <= 0) {
      throw new Error('Credit amount must be positive')
    }
    
    const assetBalance = this.assets.get(asset) || new AssetBalance({ asset, chain })
    const newBalance = assetBalance.balance + amount
    this.updateAssetBalance(asset, newBalance, chain)
    
    this.addDomainEvent({
      type: 'BalanceCredited',
      data: {
        accountId: this.accountId,
        amount,
        asset,
        chain,
        reason: 'credit'
      }
    })
    
    return this
  }

  /**
   * Deduct from balance
   */
  debit(amount, asset = 'USD', chain = 'SOL') {
    if (amount <= 0) {
      throw new Error('Debit amount must be positive')
    }
    
    const assetBalance = this.assets.get(asset)
    if (!assetBalance || assetBalance.balance < amount) {
      throw new Error('Insufficient balance')
    }
    
    const newBalance = assetBalance.balance - amount
    this.updateAssetBalance(asset, newBalance, chain)
    
    this.addDomainEvent({
      type: 'BalanceDebited',
      data: {
        accountId: this.accountId,
        amount,
        asset,
        chain,
        reason: 'debit'
      }
    })
    
    return this
  }

  /**
   * Lock funds for strategy
   */
  lockForStrategy(amount, strategyId) {
    if (amount <= 0) {
      throw new Error('Lock amount must be positive')
    }
    
    if (this.availableForSpending < amount) {
      throw new Error('Insufficient available balance')
    }
    
    this.availableForSpending -= amount
    this.investedAmount += amount
    this.strategyBalance += amount
    this.lastUpdated = new Date().toISOString()
    this._version++
    
    this.addDomainEvent({
      type: 'FundsLockedForStrategy',
      data: {
        accountId: this.accountId,
        amount,
        strategyId
      }
    })
    
    return this
  }

  /**
   * Release funds from strategy
   */
  releaseFromStrategy(amount, strategyId) {
    if (amount <= 0) {
      throw new Error('Release amount must be positive')
    }
    
    if (this.strategyBalance < amount) {
      throw new Error('Insufficient strategy balance')
    }
    
    this.strategyBalance -= amount
    this.investedAmount -= amount
    this.availableForSpending += amount
    this.lastUpdated = new Date().toISOString()
    this._version++
    
    this.addDomainEvent({
      type: 'FundsReleasedFromStrategy',
      data: {
        accountId: this.accountId,
        amount,
        strategyId
      }
    })
    
    return this
  }

  /**
   * Recalculate total balances
   */
  recalculateTotals() {
    let totalUSD = 0
    let availableUSD = 0
    
    // Calculate total USD value across all assets
    for (const [asset, balance] of this.assets) {
      totalUSD += balance.usdValue || 0
      if (asset === 'USD' || asset === 'USDC') {
        availableUSD += balance.balance
      }
    }
    
    this.totalUSD = totalUSD
    this.availableForSpending = availableUSD - this.strategyBalance
    this.lastUpdated = new Date().toISOString()
    this._version++
  }

  /**
   * Get balance for specific asset
   */
  getAssetBalance(asset) {
    const assetBalance = this.assets.get(asset)
    return assetBalance ? assetBalance.balance : 0
  }

  /**
   * Get balance for specific chain
   */
  getChainBalance(chain) {
    const chainBalance = this.chains.get(chain)
    return chainBalance ? chainBalance.getTotalUSDValue() : 0
  }

  /**
   * Check if has sufficient balance
   */
  hasSufficientBalance(amount, asset = 'USD') {
    const balance = this.getAssetBalance(asset)
    return balance >= amount
  }

  /**
   * Validate balance invariants
   */
  validate() {
    if (!this.id || !this.accountId) {
      return false
    }
    
    if (this.totalUSD < 0 || this.availableForSpending < 0 || this.investedAmount < 0) {
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
      totalUSD: this.totalUSD,
      availableForSpending: this.availableForSpending,
      investedAmount: this.investedAmount,
      strategyBalance: this.strategyBalance,
      assets: Array.from(this.assets.entries()),
      chains: Array.from(this.chains.entries()),
      lastUpdated: this.lastUpdated,
      version: this.getVersion()
    }
  }

  /**
   * Load from snapshot
   */
  loadFromSnapshot(snapshot) {
    this.id = snapshot.id
    this.accountId = snapshot.accountId
    this.totalUSD = snapshot.totalUSD
    this.availableForSpending = snapshot.availableForSpending
    this.investedAmount = snapshot.investedAmount
    this.strategyBalance = snapshot.strategyBalance
    this.assets = new Map(snapshot.assets || [])
    this.chains = new Map(snapshot.chains || [])
    this.lastUpdated = snapshot.lastUpdated
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
      case 'AssetBalanceUpdated':
        // Event already applied during updateAssetBalance
        break
      case 'BalanceCredited':
        this.recalculateTotals()
        break
      case 'BalanceDebited':
        this.recalculateTotals()
        break
      case 'FundsLockedForStrategy':
        this.availableForSpending -= event.data.amount
        this.investedAmount += event.data.amount
        this.strategyBalance += event.data.amount
        break
      case 'FundsReleasedFromStrategy':
        this.strategyBalance -= event.data.amount
        this.investedAmount -= event.data.amount
        this.availableForSpending += event.data.amount
        break
    }
    
    this._version++
    this.lastUpdated = new Date().toISOString()
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      accountId: this.accountId,
      totalUSD: this.totalUSD,
      availableForSpending: this.availableForSpending,
      investedAmount: this.investedAmount,
      strategyBalance: this.strategyBalance,
      assets: Array.from(this.assets.entries()),
      chains: Array.from(this.chains.entries()),
      lastUpdated: this.lastUpdated,
      version: this.version
    }
  }

  /**
   * Create from JSON
   */
  static fromJSON(data) {
    return new Balance(data)
  }
}

/**
 * Asset Balance Value Object
 */
export class AssetBalance {
  constructor(data = {}) {
    this.asset = data.asset
    this.chain = data.chain
    this.balance = data.balance || 0
    this.usdValue = data.usdValue || 0
    this.lastPrice = data.lastPrice || 0
    this.lastUpdated = data.lastUpdated || new Date().toISOString()
  }

  updateBalance(newBalance) {
    this.balance = newBalance
    this.updateUSDValue()
    this.lastUpdated = new Date().toISOString()
  }

  updatePrice(price) {
    this.lastPrice = price
    this.updateUSDValue()
    this.lastUpdated = new Date().toISOString()
  }

  updateUSDValue() {
    if (this.asset === 'USD' || this.asset === 'USDC') {
      this.usdValue = this.balance
    } else {
      this.usdValue = this.balance * this.lastPrice
    }
  }
}

/**
 * Chain Balance Value Object
 */
export class ChainBalance {
  constructor(data = {}) {
    this.chain = data.chain
    this.assets = new Map(data.assets || [])
    this.gasBalance = data.gasBalance || 0
    this.lastUpdated = data.lastUpdated || new Date().toISOString()
  }

  updateAssetBalance(asset, balance) {
    this.assets.set(asset, balance)
    this.lastUpdated = new Date().toISOString()
  }

  updateGasBalance(balance) {
    this.gasBalance = balance
    this.lastUpdated = new Date().toISOString()
  }

  getTotalUSDValue() {
    let total = 0
    for (const [asset, data] of this.assets) {
      if (typeof data === 'object' && data.usdValue) {
        total += data.usdValue
      } else if (asset === 'USD' || asset === 'USDC') {
        total += data
      }
    }
    return total
  }
}

/**
 * Balance Snapshot for historical tracking
 */
export class BalanceSnapshot {
  constructor(balance) {
    this.id = generateSecureId('snapshot')
    this.balanceId = balance.id
    this.accountId = balance.accountId
    this.totalUSD = balance.totalUSD
    this.availableForSpending = balance.availableForSpending
    this.investedAmount = balance.investedAmount
    this.strategyBalance = balance.strategyBalance
    this.assets = Array.from(balance.assets.entries())
    this.chains = Array.from(balance.chains.entries())
    this.createdAt = new Date().toISOString()
    this.version = balance.version
  }
}