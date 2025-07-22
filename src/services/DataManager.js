/**
 * Centralized Data Manager - Single Source of Truth
 * Event-driven architecture for diBoaS application state management
 */

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
  subscribe(eventType, callback) {
    if (!this.subscribers.has(eventType)) {
      this.subscribers.set(eventType, new Set())
    }
    this.subscribers.get(eventType).add(callback)
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscribers.get(eventType)
      if (callbacks) {
        callbacks.delete(callback)
      }
    }
  }

  /**
   * Emit events to subscribers
   */
  emit(eventType, data) {
    const callbacks = this.subscribers.get(eventType)
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data)
        } catch (error) {
          console.error(`Error in subscriber for ${eventType}:`, error)
        }
      })
    }
    
    // Also dispatch as custom DOM event for cross-component communication
    this.eventBus.dispatchEvent(new CustomEvent(eventType, { detail: data }))
    window.dispatchEvent(new CustomEvent(`diboas:${eventType}`, { detail: data }))
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
      const { type, amount, netAmount, fees, asset, paymentMethod } = transactionData
      const numericAmount = parseFloat(amount)
      const feesTotal = parseFloat(fees?.total || 0)

      // Update balance based on transaction type
      switch (type) {
        case 'add':
          // Add (On-Ramp): Only affects Available Balance
          // Available Balance = current + (amount - fees)
          const netAmountAdded = numericAmount - feesTotal
          this.state.balance.availableForSpending += netAmountAdded
          break
          
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
          
        case 'buy':
          // Buy: Can be On-Ramp or On-Chain
          const netInvestmentAmount = numericAmount - feesTotal
          
          if (paymentMethod === 'diboas_wallet') {
            // Buy On-Chain: Uses diBoaS Available Balance
            // Available Balance = current - amount
            // Invested Balance = current + (amount - fees)
            this.state.balance.availableForSpending = Math.max(0, this.state.balance.availableForSpending - numericAmount)
            this.state.balance.investedAmount += netInvestmentAmount
          } else {
            // Buy On-Ramp: Uses external payment (credit card, bank, etc.)
            // Available Balance = current (no change)
            // Invested Balance = current + (amount - fees)
            this.state.balance.investedAmount += netInvestmentAmount
          }
          
          // Update asset tracking for invested assets
          if (!this.state.balance.assets[asset]) {
            this.state.balance.assets[asset] = { amount: 0, usdValue: 0, investedAmount: 0 }
          }
          this.state.balance.assets[asset].usdValue += netInvestmentAmount
          this.state.balance.assets[asset].investedAmount += netInvestmentAmount
          break
          
        case 'sell':
          // Sell (On-Chain): Transfer from Invested to Available
          // Available Balance = current + (amount - fees)
          // Invested Balance = current - amount
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
   * Add transaction to history
   */
  addTransaction(transactionData) {
    // Generate mock transaction hash and link
    const txHash = this.generateMockTransactionHash(transactionData.type, transactionData.asset)
    const txLink = this.generateMockTransactionLink(txHash, transactionData.type, transactionData.asset)
    
    const transaction = {
      id: `tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type: transactionData.type,
      amount: transactionData.amount,
      netAmount: transactionData.netAmount,
      fees: transactionData.fees,
      asset: transactionData.asset || 'USDC',
      paymentMethod: transactionData.paymentMethod,
      status: 'completed',
      timestamp: new Date().toISOString(),
      description: this.generateTransactionDescription(transactionData),
      transactionHash: txHash,
      transactionLink: txLink,
      onChainStatus: 'confirmed'
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
      
      return { transaction, balance: this.state.balance }
    } catch (error) {
      this.emit('transaction:error', error)
      throw error
    }
  }

  /**
   * Load state from persistence
   */
  loadState() {
    const userId = this.state.user?.id || 'demo_user_12345'
    
    // Load balance
    const storedBalance = localStorage.getItem(`diboas_balances_${userId}`)
    if (storedBalance) {
      try {
        const balance = JSON.parse(storedBalance)
        this.state.balance = balance
      } catch (error) {
        console.warn('Failed to load stored balance:', error)
      }
    }
    
    // Load transactions
    const storedTransactions = localStorage.getItem(`diboas_transaction_history_${userId}`)
    if (storedTransactions) {
      try {
        const transactions = JSON.parse(storedTransactions)
        this.state.transactions = transactions
      } catch (error) {
        console.warn('Failed to load stored transactions:', error)
      }
    }
    
    this.state.lastUpdated = Date.now()
    this.emit('state:loaded', this.state)
  }

  /**
   * Persist current state
   */
  persistState() {
    this.persistBalance()
    this.persistTransactions()
  }

  persistBalance() {
    const userId = this.state.user?.id || 'demo_user_12345'
    localStorage.setItem(`diboas_balance_state_${userId}`, JSON.stringify(this.state.balance))
  }

  persistTransactions() {
    const userId = this.state.user?.id || 'demo_user_12345'
    localStorage.setItem(`diboas_transaction_history_${userId}`, JSON.stringify(this.state.transactions))
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
}

// Create singleton instance
export const dataManager = new DataManager()

// React hook for easy consumption
export const useDataManager = () => {
  return dataManager
}

export default dataManager