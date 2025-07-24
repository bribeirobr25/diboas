/**
 * Real-Time Transaction Status Service for diBoaS
 * WebSocket simulation for transaction status updates with realistic timing
 * Implements security, logging, and proper event handling
 */

import secureLogger from '../../utils/secureLogger.js'
import { dataManager } from '../DataManager.js'
import { checkGeneralRateLimit } from '../../utils/advancedRateLimiter.js'

/**
 * Transaction Status Types
 */
export const TRANSACTION_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  CONFIRMING: 'confirming',
  COMPLETED: 'completed',
  FAILED: 'failed',
  TIMEOUT: 'timeout'
}

/**
 * Transaction Types and their expected durations (in milliseconds)
 */
const TRANSACTION_TIMING = {
  // Crypto asset transactions
  BTC: { min: 4000, max: 6000, confirmations: 3 },
  ETH: { min: 1500, max: 2500, confirmations: 2 },
  SOL: { min: 800, max: 1200, confirmations: 1 },
  SUI: { min: 1000, max: 1800, confirmations: 1 },
  
  // Transaction types
  ADD: { min: 2000, max: 3000, confirmations: 1 },
  WITHDRAW: { min: 2500, max: 4000, confirmations: 2 },
  SEND: { min: 1000, max: 2000, confirmations: 1 },
  TRANSFER: { min: 2000, max: 5000, confirmations: 2 }, // Varies by network
  BUY: { min: 1500, max: 3000, confirmations: 1 },
  SELL: { min: 1500, max: 2500, confirmations: 1 }
}

/**
 * Transaction Status Service Class
 */
export class TransactionStatusService {
  constructor() {
    this.activeTransactions = new Map()
    this.statusCallbacks = new Map()
    this.simulatedWebSocket = null
    this.isConnected = false
    this.reconnectAttempts = 0
    this.maxReconnectAttempts = 5
    this.heartbeatInterval = null
    this.eventQueue = []
  }

  /**
   * Initialize WebSocket simulation connection
   */
  async connect() {
    try {
      secureLogger.audit('TRANSACTION_STATUS_SERVICE_CONNECTING', {
        timestamp: new Date().toISOString()
      })

      // Simulate WebSocket connection delay
      await new Promise(resolve => setTimeout(resolve, 500 + Math.random() * 1000))

      this.isConnected = true
      this.reconnectAttempts = 0
      
      // Start heartbeat
      this.startHeartbeat()
      
      // Process queued events
      this.processEventQueue()

      secureLogger.audit('TRANSACTION_STATUS_SERVICE_CONNECTED', {
        timestamp: new Date().toISOString(),
        activeTransactions: this.activeTransactions.size
      })

      // Emit connection status
      dataManager.emit('transaction-status:connection', { 
        connected: true, 
        timestamp: new Date().toISOString() 
      })

    } catch (error) {
      this.handleConnectionError(error)
    }
  }

  /**
   * Disconnect WebSocket simulation
   */
  disconnect() {
    this.isConnected = false
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval)
      this.heartbeatInterval = null
    }

    // Clear active transactions
    for (const [transactionId, transaction] of this.activeTransactions) {
      if (transaction.timeoutId) {
        clearTimeout(transaction.timeoutId)
      }
    }

    secureLogger.audit('TRANSACTION_STATUS_SERVICE_DISCONNECTED', {
      timestamp: new Date().toISOString(),
      activeTransactions: this.activeTransactions.size
    })

    dataManager.emit('transaction-status:connection', { 
      connected: false, 
      timestamp: new Date().toISOString() 
    })
  }

  /**
   * Start tracking a new transaction
   */
  async startTracking(transactionData) {
    const rateLimitResult = checkGeneralRateLimit('transaction-status', {
      operation: 'start_tracking',
      transactionId: transactionData.id
    })

    if (!rateLimitResult.allowed) {
      throw new Error('Rate limit exceeded for transaction status tracking')
    }

    const transaction = {
      id: transactionData.id,
      type: transactionData.type,
      asset: transactionData.asset,
      amount: transactionData.amount,
      chain: transactionData.chain || this.getChainFromAsset(transactionData.asset),
      status: TRANSACTION_STATUS.PENDING,
      startTime: Date.now(),
      onChainHash: null,
      confirmations: 0,
      requiredConfirmations: this.getRequiredConfirmations(transactionData),
      estimatedDuration: this.calculateEstimatedDuration(transactionData),
      ...transactionData
    }

    this.activeTransactions.set(transaction.id, transaction)

    secureLogger.audit('TRANSACTION_TRACKING_STARTED', {
      transactionId: transaction.id,
      type: transaction.type,
      asset: transaction.asset,
      chain: transaction.chain,
      estimatedDuration: transaction.estimatedDuration
    })

    // Start transaction progression
    this.simulateTransactionProgression(transaction)

    // Emit initial status
    this.emitStatusUpdate(transaction)

    return transaction
  }

  /**
   * Get current transaction status
   */
  getTransactionStatus(transactionId) {
    const transaction = this.activeTransactions.get(transactionId)
    if (!transaction) {
      return null
    }

    return {
      id: transaction.id,
      status: transaction.status,
      onChainHash: transaction.onChainHash,
      confirmations: transaction.confirmations,
      requiredConfirmations: transaction.requiredConfirmations,
      progress: this.calculateProgress(transaction),
      estimatedTimeRemaining: this.calculateTimeRemaining(transaction),
      lastUpdate: transaction.lastUpdate
    }
  }

  /**
   * Simulate realistic transaction progression
   */
  simulateTransactionProgression(transaction) {
    const progressSteps = [
      { status: TRANSACTION_STATUS.PROCESSING, delay: 500 },
      { status: TRANSACTION_STATUS.CONFIRMING, delay: transaction.estimatedDuration * 0.3 },
      { status: TRANSACTION_STATUS.COMPLETED, delay: transaction.estimatedDuration * 0.7 }
    ]

    let currentDelay = 0

    progressSteps.forEach((step, index) => {
      currentDelay += step.delay
      
      const timeoutId = setTimeout(() => {
        if (!this.activeTransactions.has(transaction.id)) return

        const updatedTransaction = this.activeTransactions.get(transaction.id)
        
        // Simulate potential failure (2% chance)
        if (Math.random() < 0.02 && step.status !== TRANSACTION_STATUS.COMPLETED) {
          this.handleTransactionFailure(updatedTransaction, 'Network congestion')
          return
        }

        updatedTransaction.status = step.status
        updatedTransaction.lastUpdate = new Date().toISOString()

        // Generate on-chain hash when processing starts
        if (step.status === TRANSACTION_STATUS.PROCESSING && !updatedTransaction.onChainHash) {
          updatedTransaction.onChainHash = this.generateTransactionHash(updatedTransaction)
        }

        // Simulate confirmations
        if (step.status === TRANSACTION_STATUS.CONFIRMING) {
          this.simulateConfirmations(updatedTransaction)
        }

        // Complete transaction
        if (step.status === TRANSACTION_STATUS.COMPLETED) {
          updatedTransaction.completedAt = new Date().toISOString()
          updatedTransaction.confirmations = updatedTransaction.requiredConfirmations
          this.completeTransaction(updatedTransaction)
        }

        this.emitStatusUpdate(updatedTransaction)

      }, currentDelay)

      transaction.timeoutId = timeoutId
    })

    // Set overall timeout
    setTimeout(() => {
      if (this.activeTransactions.has(transaction.id)) {
        const timedOutTransaction = this.activeTransactions.get(transaction.id)
        if (timedOutTransaction.status !== TRANSACTION_STATUS.COMPLETED) {
          this.handleTransactionTimeout(timedOutTransaction)
        }
      }
    }, transaction.estimatedDuration * 2)
  }

  /**
   * Simulate confirmation process
   */
  simulateConfirmations(transaction) {
    const confirmationInterval = transaction.estimatedDuration * 0.7 / transaction.requiredConfirmations
    let currentConfirmations = 0

    const addConfirmation = () => {
      if (!this.activeTransactions.has(transaction.id)) return
      if (transaction.status === TRANSACTION_STATUS.COMPLETED) return

      currentConfirmations++
      transaction.confirmations = currentConfirmations
      transaction.lastUpdate = new Date().toISOString()

      this.emitStatusUpdate(transaction)

      if (currentConfirmations < transaction.requiredConfirmations) {
        setTimeout(addConfirmation, confirmationInterval)
      }
    }

    setTimeout(addConfirmation, confirmationInterval)
  }

  /**
   * Complete transaction and update balances
   */
  completeTransaction(transaction) {
    secureLogger.audit('TRANSACTION_COMPLETED', {
      transactionId: transaction.id,
      type: transaction.type,
      asset: transaction.asset,
      amount: transaction.amount,
      onChainHash: transaction.onChainHash,
      duration: Date.now() - transaction.startTime
    })

    // Emit balance update event
    dataManager.emit('transaction:completed', {
      id: transaction.id,
      type: transaction.type,
      asset: transaction.asset,
      amount: transaction.amount,
      chain: transaction.chain,
      onChainHash: transaction.onChainHash,
      timestamp: new Date().toISOString()
    })

    // Remove from active tracking after delay
    setTimeout(() => {
      this.activeTransactions.delete(transaction.id)
    }, 30000) // Keep for 30 seconds for final status checks
  }

  /**
   * Handle transaction failure
   */
  handleTransactionFailure(transaction, reason) {
    transaction.status = TRANSACTION_STATUS.FAILED
    transaction.failureReason = reason
    transaction.lastUpdate = new Date().toISOString()

    secureLogger.audit('TRANSACTION_FAILED', {
      transactionId: transaction.id,
      type: transaction.type,
      reason,
      duration: Date.now() - transaction.startTime
    })

    this.emitStatusUpdate(transaction)

    // Emit failure event
    dataManager.emit('transaction:failed', {
      id: transaction.id,
      type: transaction.type,
      reason,
      timestamp: new Date().toISOString()
    })

    // Remove from tracking
    setTimeout(() => {
      this.activeTransactions.delete(transaction.id)
    }, 60000) // Keep failed transactions longer for debugging
  }

  /**
   * Handle transaction timeout
   */
  handleTransactionTimeout(transaction) {
    transaction.status = TRANSACTION_STATUS.TIMEOUT
    transaction.lastUpdate = new Date().toISOString()

    secureLogger.audit('TRANSACTION_TIMEOUT', {
      transactionId: transaction.id,
      type: transaction.type,
      duration: Date.now() - transaction.startTime
    })

    this.emitStatusUpdate(transaction)
    this.activeTransactions.delete(transaction.id)
  }

  /**
   * Emit status update event
   */
  emitStatusUpdate(transaction) {
    const statusData = {
      id: transaction.id,
      status: transaction.status,
      onChainHash: transaction.onChainHash,
      confirmations: transaction.confirmations,
      requiredConfirmations: transaction.requiredConfirmations,
      progress: this.calculateProgress(transaction),
      estimatedTimeRemaining: this.calculateTimeRemaining(transaction),
      lastUpdate: transaction.lastUpdate,
      failureReason: transaction.failureReason
    }

    dataManager.emit('transaction-status:update', statusData)

    // Also emit specific transaction event
    dataManager.emit(`transaction:${transaction.id}:status`, statusData)
  }

  /**
   * Calculate transaction progress (0-100)
   */
  calculateProgress(transaction) {
    switch (transaction.status) {
      case TRANSACTION_STATUS.PENDING:
        return 0
      case TRANSACTION_STATUS.PROCESSING:
        return 25
      case TRANSACTION_STATUS.CONFIRMING:
        const confirmationProgress = (transaction.confirmations / transaction.requiredConfirmations) * 50
        return 25 + confirmationProgress
      case TRANSACTION_STATUS.COMPLETED:
        return 100
      case TRANSACTION_STATUS.FAILED:
      case TRANSACTION_STATUS.TIMEOUT:
        return 0
      default:
        return 0
    }
  }

  /**
   * Calculate estimated time remaining
   */
  calculateTimeRemaining(transaction) {
    if (transaction.status === TRANSACTION_STATUS.COMPLETED) {
      return 0
    }

    const elapsed = Date.now() - transaction.startTime
    const remaining = Math.max(0, transaction.estimatedDuration - elapsed)
    
    return Math.ceil(remaining / 1000) // Return in seconds
  }

  /**
   * Calculate estimated duration based on transaction data
   */
  calculateEstimatedDuration(transactionData) {
    const assetTiming = TRANSACTION_TIMING[transactionData.asset]
    const typeTiming = TRANSACTION_TIMING[transactionData.type?.toUpperCase()]
    
    let baseTiming = { min: 2000, max: 3000 }
    
    if (assetTiming) {
      baseTiming = assetTiming
    } else if (typeTiming) {
      baseTiming = typeTiming
    }
    
    // Add random variation
    return baseTiming.min + Math.random() * (baseTiming.max - baseTiming.min)
  }

  /**
   * Get required confirmations
   */
  getRequiredConfirmations(transactionData) {
    const assetTiming = TRANSACTION_TIMING[transactionData.asset]
    const typeTiming = TRANSACTION_TIMING[transactionData.type?.toUpperCase()]
    
    if (assetTiming?.confirmations) {
      return assetTiming.confirmations
    }
    if (typeTiming?.confirmations) {
      return typeTiming.confirmations
    }
    
    return 1 // Default
  }

  /**
   * Get blockchain from asset
   */
  getChainFromAsset(asset) {
    const chainMap = {
      BTC: 'Bitcoin',
      ETH: 'Ethereum',
      SOL: 'Solana',
      SUI: 'Sui',
      USDC: 'Solana' // Default USDC to Solana
    }
    
    return chainMap[asset] || 'Unknown'
  }

  /**
   * Generate realistic transaction hash
   */
  generateTransactionHash(transaction) {
    const hashFormats = {
      Bitcoin: () => this.generateHash(64, '0123456789abcdef'),
      Ethereum: () => '0x' + this.generateHash(64, '0123456789abcdef'),
      Solana: () => this.generateHash(88, 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz123456789'),
      Sui: () => '0x' + this.generateHash(64, '0123456789abcdef')
    }

    const generator = hashFormats[transaction.chain]
    return generator ? generator() : this.generateHash(64, '0123456789abcdef')
  }

  /**
   * Generate random hash
   */
  generateHash(length, charset) {
    let result = ''
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charset.length))
    }
    return result
  }

  /**
   * Start heartbeat to maintain connection
   */
  startHeartbeat() {
    this.heartbeatInterval = setInterval(() => {
      if (this.isConnected) {
        dataManager.emit('transaction-status:heartbeat', {
          timestamp: new Date().toISOString(),
          activeTransactions: this.activeTransactions.size
        })
      }
    }, 30000) // Every 30 seconds
  }

  /**
   * Handle connection errors
   */
  handleConnectionError(error) {
    this.isConnected = false
    this.reconnectAttempts++

    secureLogger.audit('TRANSACTION_STATUS_CONNECTION_ERROR', {
      error: error.message,
      reconnectAttempts: this.reconnectAttempts
    })

    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      // Exponential backoff
      const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
      setTimeout(() => this.connect(), delay)
    }

    dataManager.emit('transaction-status:error', {
      error: error.message,
      reconnectAttempts: this.reconnectAttempts,
      willRetry: this.reconnectAttempts < this.maxReconnectAttempts
    })
  }

  /**
   * Process queued events
   */
  processEventQueue() {
    while (this.eventQueue.length > 0 && this.isConnected) {
      const event = this.eventQueue.shift()
      this.startTracking(event)
    }
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    return {
      connected: this.isConnected,
      activeTransactions: this.activeTransactions.size,
      reconnectAttempts: this.reconnectAttempts,
      queuedEvents: this.eventQueue.length,
      lastHeartbeat: this.heartbeatInterval ? new Date().toISOString() : null
    }
  }

  /**
   * Get all active transactions
   */
  getAllActiveTransactions() {
    return Array.from(this.activeTransactions.values()).map(transaction => ({
      id: transaction.id,
      type: transaction.type,
      asset: transaction.asset,
      status: transaction.status,
      progress: this.calculateProgress(transaction),
      estimatedTimeRemaining: this.calculateTimeRemaining(transaction)
    }))
  }
}

// Create global transaction status service instance
export const transactionStatusService = new TransactionStatusService()

export default transactionStatusService