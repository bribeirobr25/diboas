/**
 * Centralized Data Manager - Single Source of Truth
 * Event-driven architecture for diBoaS application state management
 */

import { secureStorage } from '../utils/secureStorage.js'

class DataManager {
  constructor() {
    this.state = {
      user: null,
      balance: null,
      transactions: [],
      isLoading: false,
      lastUpdated: null
    }
    
    this.subscribers = new Map()
    this.eventBus = new EventTarget()
    
    // SECURITY: Add transaction locking to prevent race conditions
    this.transactionLock = new Map() // Track locked operations
    this.operationQueue = [] // Queue for concurrent operations
    
    // MEMORY MANAGEMENT: Add cleanup intervals and size limits
    this.maxTransactionHistory = 1000 // Limit transaction history
    this.maxOperationQueue = 100 // Limit operation queue
    this.cleanupInterval = null
    this.lockCleanupInterval = null
    this.disposed = false
    
    // Start automatic cleanup
    this.startCleanupScheduler()
    
    // Initialize with clean state
    this.initializeCleanState()
  }

  /**
   * Initialize with completely clean state for testing
   */
  initializeCleanState() {
    const userId = 'demo_user_12345'
    
    // Clear any existing data
    this.clearAllData(userId)
    
    // Set clean initial state
    this.state = {
      user: {
        id: userId,
        name: 'John Doe',
        email: 'john@example.com'
      },
      balance: {
        totalUSD: 0,
        availableForSpending: 0,
        investedAmount: 0,
        breakdown: {
          BTC: { native: 0, usdc: 0, usdValue: 0 },
          ETH: { native: 0, usdc: 0, usdValue: 0 },
          SOL: { native: 0, usdc: 0, usdValue: 0 },
          SUI: { native: 0, usdc: 0, usdValue: 0 }
        },
        assets: {},
        lastUpdated: Date.now()
      },
      transactions: [],
      isLoading: false,
      lastUpdated: Date.now()
    }
    
    // Persist clean state
    this.persistState()
    
    // Notify all subscribers
    this.emit('state:initialized', this.state)
  }

  /**
   * Clear all stored data for user
   */
  clearAllData(userId) {
    const keysToRemove = [
      `diboas_balances_${userId}`,
      `diboas_transaction_history_${userId}`,
      `diboas_wallets_${userId}`
    ]
    
    keysToRemove.forEach(key => {
      localStorage.removeItem(key)
    })
  }

  /**
   * Subscribe to state changes
   */
  /**
   * MEMORY MANAGEMENT: Start automatic cleanup schedulers
   */
  startCleanupScheduler() {
    // Clean up stale locks every 30 seconds
    this.lockCleanupInterval = setInterval(() => {
      if (!this.disposed) {
        this.cleanupStaleLocks()
      }
    }, 30000)
    
    // Clean up empty subscription sets and trim data every 5 minutes
    this.cleanupInterval = setInterval(() => {
      if (!this.disposed) {
        this.cleanupSubscriptions()
        this.trimTransactionHistory()
        this.trimOperationQueue()
      }
    }, 300000)
  }

  /**
   * Subscribe to state changes with improved memory management
   */
  subscribe(eventType, callback) {
    if (this.disposed) {
      console.warn('DataManager is disposed, cannot subscribe')
      return () => {}
    }
    
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set())
    }
    this.subscribers.get(eventType).add(callback)
    
    // Return unsubscribe function with cleanup
    return () => {
      const callbacks = this.subscribers.get(eventType)
      if (callbacks) {
        callbacks.delete(callback)
        // MEMORY FIX: Clean up empty Sets immediately
        if (callbacks.size === 0) {
          this.subscribers.delete(eventType)
        }
      }
    }
  }

  /**
   * Emit events to subscribers
   */
  emit(eventType, data) {
    if (this.disposed) {
      return
    }
    
    const callbacks = this.subscribers.get(eventType)
    if (callbacks) {
      // Convert to array to avoid issues if callbacks are removed during iteration
      const callbackArray = Array.from(callbacks)
      callbackArray.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in subscriber for ${eventType}:`, error)
          // MEMORY FIX: Remove failed callbacks to prevent memory leaks
          callbacks.delete(callback)
        }
      })
    }
    
    // Also dispatch as custom DOM event for cross-component communication
    // MEMORY FIX: Only dispatch if not disposed
    try {
      this.eventBus.dispatchEvent(new CustomEvent(eventType, { detail: data }))
      window.dispatchEvent(new CustomEvent(`diboas:${eventType}`, { detail: data }))
    } catch (error) {
      console.error(`Error dispatching event ${eventType}:`, error)
    }
  }

  /**
   * Get current state
   */
  getState() {
    return { ...this.state }
  }

  /**
   * Get specific state slice
   */
  getBalance() {
    return { ...this.state.balance }
  }

  getTransactions() {
    return [...this.state.transactions]
  }

  getUser() {
    return { ...this.state.user }
  }

  /**
   * Update balance after transaction - Updated to match proper financial flow
   */
  async updateBalance(transactionData) {
    this.state.isLoading = true
    this.emit('balance:loading', true)

    try {
      const { type, amount, fees, asset, paymentMethod } = transactionData
      const numericAmount = parseFloat(amount)
      const feesTotal = parseFloat(fees?.total || 0)

      // Update balance based on transaction type
      switch (type) {
        case 'add': {
          // Add/Deposit transaction
          // Available Balance = current + (transaction amount - fees)
          // Invested Balance = no changes
          const netAmountAdded = numericAmount - feesTotal
          this.state.balance.availableForSpending += netAmountAdded
          // Invested balance unchanged
          break
        }
          
        case 'withdraw':
          // Withdraw (Off-Ramp): Only affects Available Balance  
          // Available Balance = current - amount (fees already deducted from amount by provider)
          this.state.balance.availableForSpending = Math.max(0, this.state.balance.availableForSpending - numericAmount)
          break
          
        case 'send':
        case 'transfer':
          // Send/Transfer (On-Chain): Only affects Available Balance
          // Available Balance = current - amount (includes fees)
          this.state.balance.availableForSpending = Math.max(0, this.state.balance.availableForSpending - numericAmount)
          break
          
        case 'receive':
          // Receive: Add full amount to Available Balance
          this.state.balance.availableForSpending += numericAmount
          break
          
        case 'buy': {
          // Buy transaction
          const netInvestmentAmount = numericAmount - feesTotal
          
          if (paymentMethod === 'diboas_wallet') {
            // Buy transaction diBoaS wallet
            // Available Balance = current - transaction amount
            // Invested Balance = current + (transaction amount - fees)
            this.state.balance.availableForSpending = Math.max(0, this.state.balance.availableForSpending - numericAmount)
            this.state.balance.investedAmount += netInvestmentAmount
          } else {
            // Buy transaction other payment methods
            // Available Balance = no changes
            // Invested Balance = current + (transaction amount - fees)
            this.state.balance.investedAmount += netInvestmentAmount
          }
          
          // Update asset tracking for invested assets
          if (!this.state.balance.assets[asset]) {
            this.state.balance.assets[asset] = { amount: 0, usdValue: 0, investedAmount: 0 }
          }
          this.state.balance.assets[asset].usdValue += netInvestmentAmount
          this.state.balance.assets[asset].investedAmount += netInvestmentAmount
          break
        }
          
        case 'sell': {
          // Sell transaction
          // Available Balance = current + (transaction amount - fees)
          // Invested Balance = current - transaction amount
          const netSellProceeds = numericAmount - feesTotal
          this.state.balance.availableForSpending += netSellProceeds
          this.state.balance.investedAmount = Math.max(0, this.state.balance.investedAmount - numericAmount)
          
          // Update asset tracking
          if (this.state.balance.assets[asset]) {
            this.state.balance.assets[asset].usdValue = Math.max(0, this.state.balance.assets[asset].usdValue - numericAmount)
            this.state.balance.assets[asset].investedAmount = Math.max(0, this.state.balance.assets[asset].investedAmount - numericAmount)
            if (this.state.balance.assets[asset].investedAmount === 0) {
              delete this.state.balance.assets[asset]
            }
          }
          break
        }
      }

      // Recalculate total balance: Total = Available + Invested
      this.state.balance.totalUSD = this.state.balance.availableForSpending + this.state.balance.investedAmount
      this.state.balance.lastUpdated = Date.now()
      
      // Persist updated balance
      this.persistBalance()
      
      // Emit balance update event
      this.emit('balance:updated', this.state.balance)
      
      return this.state.balance
    } catch (error) {
      this.emit('balance:error', error)
      throw error
    } finally {
      this.state.isLoading = false
      this.emit('balance:loading', false)
    }
  }

  /**
   * Update existing transaction in history
   */
  updateTransaction(transactionId, updates) {
    const transactionIndex = this.state.transactions.findIndex(tx => tx.id === transactionId)
    
    if (transactionIndex === -1) {
      console.warn(`Transaction ${transactionId} not found for update`)
      return null
    }
    
    // Update transaction with new data
    this.state.transactions[transactionIndex] = {
      ...this.state.transactions[transactionIndex],
      ...updates,
      lastUpdated: new Date().toISOString()
    }
    
    // Persist transactions
    this.persistTransactions()
    
    // Emit transaction events
    this.emit('transaction:updated', this.state.transactions[transactionIndex])
    this.emit('transactions:updated', this.state.transactions)
    
    return this.state.transactions[transactionIndex]
  }

  /**
   * Add transaction to history
   */
  addTransaction(transactionData) {
    // If transaction already has detailed data (from OnChainTransactionManager), use it
    // Otherwise generate mock data for backward compatibility
    const transaction = {
      id: transactionData.id || `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type: transactionData.type,
      amount: transactionData.amount,
      currency: transactionData.currency || 'USD',
      status: transactionData.status || 'completed',
      description: transactionData.description || this.generateTransactionDescription(transactionData),
      recipient: transactionData.recipient,
      asset: transactionData.asset || 'USDC',
      paymentMethod: transactionData.paymentMethod,
      fees: transactionData.fees || {},
      createdAt: transactionData.createdAt || new Date().toISOString(),
      submittedAt: transactionData.submittedAt,
      confirmedAt: transactionData.confirmedAt,
      failedAt: transactionData.failedAt,
      // On-chain specific fields (preserve if provided)
      txHash: transactionData.txHash || this.generateMockTransactionHash(transactionData.type, transactionData.asset),
      explorerLink: transactionData.explorerLink || this.generateMockTransactionLink(transactionData.txHash || 'mock', transactionData.type, transactionData.asset),
      chain: transactionData.chain,
      onChainStatus: transactionData.onChainStatus || 'confirmed',
      error: transactionData.error,
      // Enhanced exchange metadata for buy/sell transparency
      fromAsset: transactionData.fromAsset || 
        (transactionData.type === 'buy' && transactionData.paymentMethod === 'diboas_wallet' ? 'USDC' : 
         transactionData.type === 'sell' ? transactionData.asset : undefined),
      fromAmount: transactionData.fromAmount ||
        (transactionData.type === 'sell' ? transactionData.amount : undefined),
      toAsset: transactionData.toAsset || 
        (transactionData.type === 'sell' ? 'USDC' : transactionData.asset),
      toAmount: transactionData.toAmount ||
        (transactionData.type === 'sell' ? (transactionData.netAmount || transactionData.amount - (transactionData.fees?.total || 0)) : undefined),
      dexProvider: transactionData.dexProvider,
      exchangeRate: transactionData.exchangeRate,
      // Legacy fields for backward compatibility
      timestamp: transactionData.createdAt || new Date().toISOString(),
      transactionHash: transactionData.txHash || this.generateMockTransactionHash(transactionData.type, transactionData.asset),
      transactionLink: transactionData.explorerLink || this.generateMockTransactionLink(transactionData.txHash || 'mock', transactionData.type, transactionData.asset),
      netAmount: transactionData.netAmount
    }
    
    // Add to state
    this.state.transactions.unshift(transaction)
    
    // Keep only last 100 transactions
    if (this.state.transactions.length > 100) {
      this.state.transactions = this.state.transactions.slice(0, 100)
    }
    
    // Persist transactions
    this.persistTransactions()
    
    // Emit transaction events
    this.emit('transaction:added', transaction)
    this.emit('transactions:updated', this.state.transactions)
    
    return transaction
  }

  /**
   * Process complete transaction (balance + history)
   */
  async processTransaction(transactionData) {
    try {
      // Update balance first
      await this.updateBalance(transactionData)
      
      // Add to transaction history
      const transaction = this.addTransaction(transactionData)
      
      // Emit complete transaction event
      this.emit('transaction:completed', { transaction, balance: this.state.balance })
      
      // Also dispatch the specific event that AppDashboard is listening for
      window.dispatchEvent(new CustomEvent('diboas-transaction-completed', {
        detail: { transaction, userId: transactionData.userId || 'demo_user_12345' }
      }))
      
      return { transaction, balance: this.state.balance }
    } catch (error) {
      this.emit('transaction:error', error)
      throw error
    }
  }

  /**
   * Load state from persistence
   */
  async loadState() {
    const userId = this.state.user?.id || 'demo_user_12345'
    
    // Load encrypted balance
    try {
      const balanceKey = `${userId}-balance-encryption-key`
      const balance = await secureStorage.getSecureItem(
        `diboas_balance_state_${userId}`,
        balanceKey
      )
      if (balance) {
        this.state.balance = balance
      }
    } catch (error) {
      console.warn('Failed to load encrypted balance:', error)
      // Fallback to try legacy unencrypted data
      this.loadLegacyBalance(userId)
    }
    
    // Load encrypted transactions
    try {
      const transactionKey = `${userId}-transaction-encryption-key`
      const transactions = await secureStorage.getSecureItem(
        `diboas_transaction_history_${userId}`,
        transactionKey
      )
      if (transactions) {
        this.state.transactions = transactions
      }
    } catch (error) {
      console.warn('Failed to load encrypted transactions:', error)
      // Fallback to try legacy unencrypted data
      this.loadLegacyTransactions(userId)
    }
    
    this.state.lastUpdated = Date.now()
    this.emit('state:loaded', this.state)
  }

  /**
   * Legacy fallback methods for unencrypted data migration
   */
  loadLegacyBalance(userId) {
    const storedBalance = localStorage.getItem(`diboas_balances_${userId}`)
    if (storedBalance) {
      try {
        const balance = JSON.parse(storedBalance)
        this.state.balance = balance
        // Migrate to encrypted storage
        this.persistBalance()
        // Remove legacy unencrypted data
        localStorage.removeItem(`diboas_balances_${userId}`)
      } catch (error) {
        console.warn('Failed to migrate legacy balance:', error)
      }
    }
  }

  loadLegacyTransactions(userId) {
    const storedTransactions = localStorage.getItem(`diboas_transaction_history_${userId}`)
    if (storedTransactions) {
      try {
        const transactions = JSON.parse(storedTransactions)
        this.state.transactions = transactions
        // Migrate to encrypted storage
        this.persistTransactions()
        // Remove legacy unencrypted data
        localStorage.removeItem(`diboas_transaction_history_${userId}`)
      } catch (error) {
        console.warn('Failed to migrate legacy transactions:', error)
      }
    }
  }

  /**
   * Persist current state
   */
  persistState() {
    this.persistBalance()
    this.persistTransactions()
  }

  async persistBalance() {
    const userId = this.state.user?.id || 'demo_user_12345'
    const userKey = `${userId}-balance-encryption-key`
    
    try {
      await secureStorage.setSecureItem(
        `diboas_balance_state_${userId}`, 
        this.state.balance,
        userKey
      )
    } catch (error) {
      console.error('Failed to persist encrypted balance:', error)
    }
  }

  async persistTransactions() {
    const userId = this.state.user?.id || 'demo_user_12345'
    const userKey = `${userId}-transaction-encryption-key`
    
    try {
      await secureStorage.setSecureItem(
        `diboas_transaction_history_${userId}`, 
        this.state.transactions,
        userKey
      )
    } catch (error) {
      console.error('Failed to persist encrypted transactions:', error)
    }
  }

  /**
   * Generate transaction description
   */
  generateTransactionDescription(transactionData) {
    const { type, amount, asset, paymentMethod } = transactionData
    
    switch (type) {
      case 'add':
        return `Added $${amount} using ${paymentMethod || 'payment method'}`
      case 'send':
        return `Sent $${amount} to user`
      case 'receive':
        return `Received $${amount} from user`
      case 'withdraw':
        return `Withdrew $${amount} to ${paymentMethod || 'bank account'}`
      case 'buy':
        return `Bought $${amount} worth of ${asset}`
      case 'sell':
        return `Sold $${amount} worth of ${asset}`
      case 'transfer':
        return `Transferred $${amount} to external wallet`
      default:
        return `${type} transaction of $${amount}`
    }
  }

  /**
   * Generate mock transaction hash
   */
  generateMockTransactionHash(type, asset = 'SOL') {
    const randomHex = () => Math.random().toString(16).substring(2)
    
    // Generate different hash formats based on the chain/asset
    switch (asset) {
      case 'BTC':
        return `${randomHex()}${randomHex()}${randomHex()}${randomHex()}`.substring(0, 64)
      case 'ETH':
        return `0x${randomHex()}${randomHex()}${randomHex()}${randomHex()}`.substring(0, 66)
      case 'SOL':
      default:
        return `${randomHex()}${randomHex()}${randomHex()}${randomHex()}${randomHex()}`.substring(0, 88)
      case 'SUI':
        return `0x${randomHex()}${randomHex()}${randomHex()}${randomHex()}`.substring(0, 66)
    }
  }

  /**
   * Generate mock transaction link
   */
  generateMockTransactionLink(txHash, type, asset = 'SOL') {
    const explorers = {
      'BTC': 'https://blockstream.info/tx/',
      'ETH': 'https://etherscan.io/tx/',
      'SOL': 'https://solscan.io/tx/',
      'SUI': 'https://suiexplorer.com/txblock/'
    }
    
    const baseUrl = explorers[asset] || explorers['SOL']
    return `${baseUrl}${txHash}`
  }

  /**
   * Reset to completely clean state
   */
  resetToCleanState() {
    this.initializeCleanState()
  }

  /**
   * SECURITY: Atomic transaction operations to prevent race conditions
   * Critical for financial operations where concurrent access could cause data corruption
   */
  async withTransactionLock(operationId, operation) {
    const lockKey = `lock-${operationId}`
    
    // Check if operation is already locked
    if (this.transactionLock.has(lockKey)) {
      // Queue the operation
      return new Promise((resolve, reject) => {
        this.operationQueue.push({
          operationId,
          operation,
          resolve,
          reject,
          timestamp: Date.now()
        })
      })
    }

    try {
      // Acquire lock
      this.transactionLock.set(lockKey, {
        timestamp: Date.now(),
        operationId
      })

      // Execute operation
      const result = await operation()

      // Process queued operations for this type
      this.processQueuedOperations(operationId)

      return result

    } catch (error) {
      console.error(`Transaction operation ${operationId} failed:`, error)
      throw error
    } finally {
      // Always release lock
      this.transactionLock.delete(lockKey)
    }
  }

  /**
   * Process queued operations after lock is released
   */
  processQueuedOperations(operationId) {
    const queuedOps = this.operationQueue.filter(op => op.operationId === operationId)
    
    if (queuedOps.length > 0) {
      // Remove from queue
      this.operationQueue = this.operationQueue.filter(op => op.operationId !== operationId)
      
      // Process first queued operation
      const nextOp = queuedOps[0]
      setTimeout(async () => {
        try {
          const result = await this.withTransactionLock(nextOp.operationId, nextOp.operation)
          nextOp.resolve(result)
        } catch (error) {
          nextOp.reject(error)
        }
      }, 0)
    }
  }

  /**
   * Atomic balance update with locking
   */
  async updateBalanceAtomic(newBalance) {
    return this.withTransactionLock('balance-update', async () => {
      // Validate balance before update
      if (!newBalance || typeof newBalance.totalUSD !== 'number') {
        throw new Error('Invalid balance data provided')
      }

      // const previousBalance = { ...this.state.balance } // Removed unused variable
      
      // Update balance
      this.state.balance = {
        ...this.state.balance,
        ...newBalance,
        lastUpdated: new Date().toISOString()
      }

      // Balance updated atomically

      // Emit event
      this.emit('balance:updated', this.state.balance)
      
      // Persist to storage
      await this.saveBalanceToStorage()
      
      return this.state.balance
    })
  }

  /**
   * Atomic transaction addition with locking
   */
  async addTransactionAtomic(transaction) {
    return this.withTransactionLock('transaction-add', async () => {
      // Validate transaction
      if (!transaction || !transaction.id) {
        throw new Error('Invalid transaction data provided')
      }

      // Check for duplicate transaction IDs
      const existingTransaction = this.state.transactions.find(tx => tx.id === transaction.id)
      if (existingTransaction) {
        throw new Error(`Transaction with ID ${transaction.id} already exists`)
      }

      // Add transaction
      this.state.transactions.unshift({
        ...transaction,
        timestamp: transaction.timestamp || new Date().toISOString()
      })

      // Update last updated timestamp
      this.state.lastUpdated = new Date().toISOString()

      // Emit events
      this.emit('transaction:added', transaction)
      this.emit('transactions:updated', this.state.transactions)

      // Persist to storage
      await this.saveTransactionsToStorage()

      return transaction
    })
  }

  /**
   * MEMORY MANAGEMENT: Clean up empty subscription sets
   */
  cleanupSubscriptions() {
    for (const [eventType, callbacks] of this.subscribers.entries()) {
      if (callbacks.size === 0) {
        this.subscribers.delete(eventType)
      }
    }
    // Active subscriptions cleanup completed
  }

  /**
   * MEMORY MANAGEMENT: Trim transaction history to prevent unbounded growth
   */
  trimTransactionHistory() {
    if (this.state.transactions.length > this.maxTransactionHistory) {
      const trimCount = this.state.transactions.length - this.maxTransactionHistory
      this.state.transactions = this.state.transactions.slice(trimCount)
      // Trimmed old transactions
      this.persistState()
    }
  }

  /**
   * MEMORY MANAGEMENT: Trim operation queue to prevent unbounded growth
   */
  trimOperationQueue() {
    if (this.operationQueue.length > this.maxOperationQueue) {
      const trimCount = this.operationQueue.length - this.maxOperationQueue
      this.operationQueue = this.operationQueue.slice(trimCount)
      // Trimmed old queued operations
    }
  }

  /**
   * Clean up old locks (safety mechanism)
   */
  cleanupStaleLocks() {
    const now = Date.now()
    const LOCK_TIMEOUT = 30000 // 30 seconds

    for (const [lockKey, lockInfo] of this.transactionLock.entries()) {
      if (now - lockInfo.timestamp > LOCK_TIMEOUT) {
        console.warn(`Cleaning up stale lock: ${lockKey}`)
        this.transactionLock.delete(lockKey)
      }
    }
  }

  /**
   * MEMORY MANAGEMENT: Dispose of DataManager and clean up all resources
   */
  dispose() {
    // Disposing and cleaning up resources
    this.disposed = true
    
    // Clear all intervals
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }
    
    if (this.lockCleanupInterval) {
      clearInterval(this.lockCleanupInterval)
      this.lockCleanupInterval = null
    }
    
    // Clear all subscribers
    this.subscribers.clear()
    
    // Clear all locks and operations
    this.transactionLock.clear()
    this.operationQueue.length = 0
    
    // Clear state
    this.state = {
      user: null,
      balance: null,
      transactions: [],
      isLoading: false,
      lastUpdated: null
    }
    
    // Disposal complete
  }
}

// Create singleton instance
export const dataManager = new DataManager()

// MEMORY MANAGEMENT: Add cleanup on page unload
if (typeof window !== 'undefined') {
  // Clean up DataManager when page unloads
  window.addEventListener('beforeunload', () => {
    dataManager.dispose()
  })
  
  // Also clean up on page visibility change (when tab becomes hidden)
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      // Run cleanup but don't dispose completely
      dataManager.cleanupSubscriptions()
      dataManager.cleanupStaleLocks()
    }
  })
}

// React hook for easy consumption with automatic cleanup
export const useDataManager = () => {
  return dataManager
}

// Function export for backward compatibility with tests
export const getDataManager = () => {
  return dataManager
}

export default dataManager