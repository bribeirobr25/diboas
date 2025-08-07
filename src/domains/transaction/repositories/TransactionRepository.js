/**
 * Transaction Repository Implementation
 * Handles persistence and retrieval of Transaction aggregates
 */

import { EventSourcedRepository, InMemoryRepository } from '../../shared/Repository.js'
import { Transaction } from '../models/Transaction.js'

/**
 * Event Sourced Transaction Repository
 */
export class EventSourcedTransactionRepository extends EventSourcedRepository {
  constructor() {
    super(Transaction)
  }

  /**
   * Find transactions by account ID
   */
  async findByAccountId(accountId) {
    const allTransactions = await this.findAll()
    return allTransactions.filter(tx => tx.accountId === accountId)
  }

  /**
   * Find transactions by status
   */
  async findByStatus(status) {
    const allTransactions = await this.findAll()
    return allTransactions.filter(tx => tx.status === status)
  }

  /**
   * Find transactions by type
   */
  async findByType(type) {
    const allTransactions = await this.findAll()
    return allTransactions.filter(tx => tx.type === type)
  }

  async findAll() {
    const allIds = Array.from(this.snapshots.keys())
    const transactions = []
    
    for (const id of allIds) {
      const transaction = await this.findById(id)
      if (transaction && !transaction.isDeleted()) {
        transactions.push(transaction)
      }
    }
    
    return transactions
  }
}

/**
 * Transaction Repository Interface (for legacy compatibility)
 */
export class TransactionRepository {
  /**
   * Find transaction by ID
   * @param {string} id - Transaction ID
   * @returns {Promise<Transaction|null>}
   */
  async findById(id) {
    throw new Error('Method not implemented')
  }

  /**
   * Find transactions by account ID
   * @param {string} accountId - Account ID
   * @param {Object} options - Query options
   * @returns {Promise<Transaction[]>}
   */
  async findByAccountId(accountId, options = {}) {
    throw new Error('Method not implemented')
  }

  /**
   * Find transactions by criteria
   * @param {Object} criteria - Search criteria
   * @returns {Promise<Transaction[]>}
   */
  async findByCriteria(criteria) {
    throw new Error('Method not implemented')
  }

  /**
   * Save transaction
   * @param {Transaction} transaction - Transaction entity
   * @returns {Promise<Transaction>}
   */
  async save(transaction) {
    throw new Error('Method not implemented')
  }

  /**
   * Delete transaction
   * @param {string} id - Transaction ID
   * @returns {Promise<boolean>}
   */
  async delete(id) {
    throw new Error('Method not implemented')
  }

  /**
   * Count transactions
   * @param {Object} criteria - Count criteria
   * @returns {Promise<number>}
   */
  async count(criteria = {}) {
    throw new Error('Method not implemented')
  }

  /**
   * Get transaction statistics
   * @param {string} accountId - Account ID
   * @returns {Promise<Object>}
   */
  async getStatistics(accountId) {
    throw new Error('Method not implemented')
  }
}

/**
 * Enhanced In-Memory Transaction Repository Implementation
 * Extends base InMemoryRepository with transaction-specific functionality
 */
export class InMemoryTransactionRepository extends InMemoryRepository {
  constructor() {
    super()
    this.accountIndex = new Map()
    this.statusIndex = new Map()
    this.typeIndex = new Map()
    this.assetIndex = new Map()
    this.chainIndex = new Map()
  }

  /**
   * Find transactions by account ID
   */
  async findByAccountId(accountId) {
    const transactionIds = this.accountIndex.get(accountId) || new Set()
    const transactions = []
    
    for (const id of transactionIds) {
      const transaction = await this.findById(id)
      if (transaction) {
        transactions.push(transaction)
      }
    }
    
    return transactions.sort((a, b) => new Date(b.timeline.createdAt) - new Date(a.timeline.createdAt))
  }

  /**
   * Find recent transactions by account
   */
  async findRecentByAccountId(accountId, limit = 10) {
    const transactions = await this.findByAccountId(accountId)
    return transactions.slice(0, limit)
  }

  /**
   * Find transactions by status
   */
  async findByStatus(status) {
    const transactionIds = this.statusIndex.get(status) || new Set()
    const transactions = []
    
    for (const id of transactionIds) {
      const transaction = await this.findById(id)
      if (transaction) {
        transactions.push(transaction)
      }
    }
    
    return transactions
  }

  /**
   * Find transactions by type
   */
  async findByType(type) {
    const transactionIds = this.typeIndex.get(type) || new Set()
    const transactions = []
    
    for (const id of transactionIds) {
      const transaction = await this.findById(id)
      if (transaction) {
        transactions.push(transaction)
      }
    }
    
    return transactions
  }

  /**
   * Update indexes
   */
  async updateIndexes(transaction) {
    // Account index
    if (transaction.accountId) {
      if (!this.accountIndex.has(transaction.accountId)) {
        this.accountIndex.set(transaction.accountId, new Set())
      }
      this.accountIndex.get(transaction.accountId).add(transaction.id)
    }

    // Status index
    if (transaction.status) {
      if (!this.statusIndex.has(transaction.status)) {
        this.statusIndex.set(transaction.status, new Set())
      }
      this.statusIndex.get(transaction.status).add(transaction.id)
    }

    // Type index
    if (transaction.type) {
      if (!this.typeIndex.has(transaction.type)) {
        this.typeIndex.set(transaction.type, new Set())
      }
      this.typeIndex.get(transaction.type).add(transaction.id)
    }

    // Asset index
    if (transaction.asset) {
      if (!this.assetIndex.has(transaction.asset)) {
        this.assetIndex.set(transaction.asset, new Set())
      }
      this.assetIndex.get(transaction.asset).add(transaction.id)
    }

    // Chain index
    if (transaction.chain) {
      if (!this.chainIndex.has(transaction.chain)) {
        this.chainIndex.set(transaction.chain, new Set())
      }
      this.chainIndex.get(transaction.chain).add(transaction.id)
    }
  }

  /**
   * Remove from indexes
   */
  async removeFromIndexes(transaction) {
    // Remove from account index
    if (transaction.accountId) {
      const accountSet = this.accountIndex.get(transaction.accountId)
      if (accountSet) {
        accountSet.delete(transaction.id)
      }
    }

    // Remove from status index
    if (transaction.status) {
      const statusSet = this.statusIndex.get(transaction.status)
      if (statusSet) {
        statusSet.delete(transaction.id)
      }
    }

    // Remove from type index
    if (transaction.type) {
      const typeSet = this.typeIndex.get(transaction.type)
      if (typeSet) {
        typeSet.delete(transaction.id)
      }
    }

    // Remove from asset index
    if (transaction.asset) {
      const assetSet = this.assetIndex.get(transaction.asset)
      if (assetSet) {
        assetSet.delete(transaction.id)
      }
    }

    // Remove from chain index
    if (transaction.chain) {
      const chainSet = this.chainIndex.get(transaction.chain)
      if (chainSet) {
        chainSet.delete(transaction.id)
      }
    }
  }

  /**
   * Clear repository and indexes
   */
  clear() {
    super.clear()
    this.accountIndex.clear()
    this.statusIndex.clear()
    this.typeIndex.clear()
    this.assetIndex.clear()
    this.chainIndex.clear()
  }
}