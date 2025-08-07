/**
 * Balance Repository Implementation
 * Handles persistence and retrieval of Balance aggregates
 */

import { EventSourcedRepository, InMemoryRepository } from '../../shared/Repository.js'
import { Balance } from '../models/Balance.js'

/**
 * Event Sourced Balance Repository
 */
export class EventSourcedBalanceRepository extends EventSourcedRepository {
  constructor() {
    super(Balance)
  }

  /**
   * Find balance by account ID
   */
  async findByAccountId(accountId) {
    // In a real implementation, this would query an index
    // For now, we'll search through all balances
    const allBalances = await this.findAll()
    return allBalances.find(balance => balance.accountId === accountId) || null
  }

  async findAll() {
    // This is a simplified implementation
    // In production, you'd have proper indexing
    const allIds = Array.from(this.snapshots.keys())
    const balances = []
    
    for (const id of allIds) {
      const balance = await this.findById(id)
      if (balance && !balance.isDeleted()) {
        balances.push(balance)
      }
    }
    
    return balances
  }
}

/**
 * Balance Repository Interface (for legacy compatibility)
 */
export class BalanceRepository {
  /**
   * Find balance by ID
   * @param {string} id - Balance ID
   * @returns {Promise<Balance|null>}
   */
  async findById(id) {
    throw new Error('Method not implemented')
  }

  /**
   * Find balance by account ID
   * @param {string} accountId - Account ID
   * @returns {Promise<Balance|null>}
   */
  async findByAccountId(accountId) {
    throw new Error('Method not implemented')
  }

  /**
   * Save balance
   * @param {Balance} balance - Balance entity
   * @returns {Promise<Balance>}
   */
  async save(balance) {
    throw new Error('Method not implemented')
  }

  /**
   * Delete balance
   * @param {string} id - Balance ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('Method not implemented')
  }

  /**
   * Find balances by asset
   * @param {string} asset - Asset symbol
   * @returns {Promise<Balance[]>}
   */
  async findByAsset(asset) {
    throw new Error('Method not implemented')
  }

  /**
   * Find balances by chain
   * @param {string} chain - Chain name
   * @returns {Promise<Balance[]>}
   */
  async findByChain(chain) {
    throw new Error('Method not implemented')
  }

  /**
   * Get total value locked
   * @returns {Promise<number>}
   */
  async getTotalValueLocked() {
    throw new Error('Method not implemented')
  }
}

/**
 * Enhanced In-Memory Balance Repository Implementation
 * Extends base InMemoryRepository with balance-specific functionality
 */
export class InMemoryBalanceRepository extends InMemoryRepository {
  constructor() {
    super()
    this.balances = new Map()
    this.accountIndex = new Map()
    this.assetIndex = new Map()
    this.chainIndex = new Map()
  }

  async findById(id) {
    return this.balances.get(id) || null
  }

  async findByAccountId(accountId) {
    const balanceId = this.accountIndex.get(accountId)
    return balanceId ? this.balances.get(balanceId) : null
  }

  async save(balance) {
    // Update indexes
    this.accountIndex.set(balance.accountId, balance.id)
    
    // Update asset index
    for (const [asset] of balance.assets) {
      if (!this.assetIndex.has(asset)) {
        this.assetIndex.set(asset, new Set())
      }
      this.assetIndex.get(asset).add(balance.id)
    }
    
    // Update chain index
    for (const [chain] of balance.chains) {
      if (!this.chainIndex.has(chain)) {
        this.chainIndex.set(chain, new Set())
      }
      this.chainIndex.get(chain).add(balance.id)
    }
    
    this.balances.set(balance.id, balance)
    return balance
  }

  async delete(id) {
    const balance = this.balances.get(id)
    if (!balance) return false
    
    // Remove from indexes
    this.accountIndex.delete(balance.accountId)
    
    for (const [asset] of balance.assets) {
      const assetSet = this.assetIndex.get(asset)
      if (assetSet) {
        assetSet.delete(balance.id)
      }
    }
    
    for (const [chain] of balance.chains) {
      const chainSet = this.chainIndex.get(chain)
      if (chainSet) {
        chainSet.delete(balance.id)
      }
    }
    
    return this.balances.delete(id)
  }

  async findByAsset(asset) {
    const balanceIds = this.assetIndex.get(asset) || new Set()
    const balances = []
    
    for (const id of balanceIds) {
      const balance = this.balances.get(id)
      if (balance) {
        balances.push(balance)
      }
    }
    
    return balances
  }

  async findByChain(chain) {
    const balanceIds = this.chainIndex.get(chain) || new Set()
    const balances = []
    
    for (const id of balanceIds) {
      const balance = this.balances.get(id)
      if (balance) {
        balances.push(balance)
      }
    }
    
    return balances
  }

  async getTotalValueLocked() {
    let total = 0
    
    for (const balance of this.balances.values()) {
      total += balance.totalUSD
    }
    
    return total
  }

  // Helper method for testing
  clear() {
    this.balances.clear()
    this.accountIndex.clear()
    this.assetIndex.clear()
    this.chainIndex.clear()
  }
}