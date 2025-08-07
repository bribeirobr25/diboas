/**
 * Centralized Data Manager - Single Source of Truth
 * Event-driven architecture for diBoaS application state management
 */

import { secureStorage } from '../utils/secureStorage.js'
import secureLogger from '../utils/secureLogger.js'
import logger from '../utils/logger'

// Import new services for goal-strategies system
import strategyAnalyticsService from './analytics/StrategyAnalyticsService.js'
import protocolService from './defi/ProtocolService.js'
import riskEngine from './risk/RiskEngine.js'
import automationService from './automation/AutomationService.js'

// Import advanced financial services
import taxOptimizationService from './tax/TaxOptimizationService.js'
import lendingPoolService from './lending/LendingPoolService.js'
import portfolioInsightsService from './insights/PortfolioInsightsService.js'

// Import performance monitoring
import performanceMonitoringService from './monitoring/PerformanceMonitoringService.js'

// Import security monitoring
import securityMonitoringService from './monitoring/SecurityMonitoringService.js'

// Import error recovery
import errorRecoveryService from './errorHandling/ErrorRecoveryService.js'

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
   * Initialize with completely clean state - no mock user data
   */
  initializeCleanState() {
    const userId = 'demo_user_12345'
    
    // Clear any existing data and localStorage
    this.clearAllData(userId)
    
    // Force clear localStorage to ensure completely clean state
    const keysToRemove = [
      `diboas_balances_${userId}`,
      `diboas_balance_state_${userId}`, 
      `diboas_transaction_history_${userId}`,
      `diboas_wallets_${userId}`
    ]
    keysToRemove.forEach(key => {
      if (typeof localStorage !== 'undefined') {
        localStorage.removeItem(key)
      }
    })
    
    // Set clean initial state - no mock balances or transactions
    this.state = {
      user: {
        id: userId,
        name: 'New User',
        email: 'user@example.com'
      },
      balance: {
        totalUSD: 0,
        availableForSpending: 0,
        investedAmount: 0,
        strategyBalance: 0,
        breakdown: {
          BTC: { native: 0, usdc: 0, usdValue: 0 },
          ETH: { native: 0, usdc: 0, usdValue: 0 },
          SOL: { native: 0, usdc: 0, usdValue: 0 },
          SUI: { native: 0, usdc: 0, usdValue: 0 },
          PAXG: { native: 0, usdc: 0, usdValue: 0 },
          XAUT: { native: 0, usdc: 0, usdValue: 0 },
          MAG7: { native: 0, usdc: 0, usdValue: 0 },
          SPX: { native: 0, usdc: 0, usdValue: 0 },
          REIT: { native: 0, usdc: 0, usdValue: 0 }
        },
        assets: {}, // Start with no assets - user will build portfolio through transactions
        strategies: {},
        lastUpdated: Date.now()
      },
      finObjectives: this.getCleanFinObjectives(),
      yieldData: this.getCleanYieldData(),
      transactions: [], // Start with no transaction history
      isLoading: false,
      lastUpdated: Date.now()
    }
    
    // Persist clean state
    this.persistState()
    
    // Notify all subscribers
    this.emit('state:initialized', this.state)
  }

  /**
   * Update strategy balance for FinObjective DeFi investments
   * @param {string} strategyId - Unique strategy identifier
   * @param {number} amount - Amount to add/subtract (negative for withdrawals)
   * @param {Object} strategyDetails - Strategy metadata
   */
  updateStrategyBalance(strategyId, amount, strategyDetails = {}) {
    if (!this.state.balance.strategies) {
      this.state.balance.strategies = {}
    }

    // Initialize strategy if not exists
    if (!this.state.balance.strategies[strategyId]) {
      this.state.balance.strategies[strategyId] = {
        id: strategyId,
        name: strategyDetails.name || 'Unnamed Strategy',
        targetAmount: strategyDetails.targetAmount || 0,
        currentAmount: 0,
        apy: strategyDetails.apy || 0,
        status: 'active',
        createdAt: Date.now(),
        ...strategyDetails
      }
    }

    // Update strategy amount
    this.state.balance.strategies[strategyId].currentAmount += amount
    
    // Update total strategy balance
    this.state.balance.strategyBalance = Object.values(this.state.balance.strategies)
      .filter(strategy => strategy.status === 'active')
      .reduce((sum, strategy) => sum + strategy.currentAmount, 0)

    // Update total balance
    this.state.balance.totalUSD = this.state.balance.availableForSpending + 
                                  this.state.balance.investedAmount + 
                                  this.state.balance.strategyBalance

    this.state.balance.lastUpdated = Date.now()
    
    // Persist and emit events
    this.persistBalance()
    this.emit('balance:updated', this.state.balance)
    this.emit('strategy:updated', this.state.balance.strategies[strategyId])
  }

  /**
   * Get all active strategies
   */
  getActiveStrategies() {
    if (!this.state.balance.strategies) return []
    
    return Object.values(this.state.balance.strategies)
      .filter(strategy => strategy.status === 'active')
  }

  /**
   * Get clean FinObjective configurations (templates only)
   */
  getCleanFinObjectives() {
    return {
      emergency: {
        id: 'emergency',
        title: 'Emergency Fund',
        description: 'Build a safety net for unexpected expenses',
        icon: 'Umbrella',
        color: 'bg-blue-100 text-blue-800',
        targetAmount: 5000,
        timeframe: '12 months',
        riskLevel: 'Low',
        expectedApy: '4-6%',
        strategy: 'Stable liquidity protocols',
        popular: true,
        strategies: ['USDC Lending', 'Compound', 'Aave'],
        currentAmount: 0,
        progress: 0,
        isActive: false
      },
      coffee: {
        id: 'coffee',
        title: 'Free Coffee',
        description: 'Generate enough yield for daily coffee',
        icon: 'Coffee',
        color: 'bg-yellow-100 text-yellow-800',
        targetAmount: 1500,
        timeframe: '6 months',
        riskLevel: 'Low',
        expectedApy: '5-8%',
        strategy: 'Conservative yield farming',
        popular: true,
        strategies: ['Stablecoin Pools', 'Lending Protocols'],
        currentAmount: 0,
        progress: 0,
        isActive: false
      },
      vacation: {
        id: 'vacation',
        title: 'Dream Vacation',
        description: 'Save for that perfect getaway',
        icon: 'Plane',
        color: 'bg-green-100 text-green-800',
        targetAmount: 8000,
        timeframe: '18 months',
        riskLevel: 'Medium',
        expectedApy: '8-12%',
        strategy: 'Balanced DeFi portfolio',
        popular: true,
        strategies: ['Liquidity Mining', 'Yield Farming', 'Staking'],
        currentAmount: 0,
        progress: 0,
        isActive: false
      },
      car: {
        id: 'car',
        title: 'New Car',
        description: 'Build towards your next vehicle',
        icon: 'Car',
        color: 'bg-purple-100 text-purple-800',
        targetAmount: 25000,
        timeframe: '36 months',
        riskLevel: 'Medium',
        expectedApy: '10-15%',
        strategy: 'Growth-oriented protocols',
        popular: false,
        strategies: ['DeFi Indexes', 'Yield Optimization', 'Liquidity Provision'],
        currentAmount: 0,
        progress: 0,
        isActive: false
      },
      house: {
        id: 'house',
        title: 'Home Down Payment',
        description: 'Save for your dream home',
        icon: 'Home',
        color: 'bg-indigo-100 text-indigo-800',
        targetAmount: 50000,
        timeframe: '60 months',
        riskLevel: 'Medium-High',
        expectedApy: '12-18%',
        strategy: 'Diversified DeFi strategies',
        popular: false,
        strategies: ['Multi-Protocol Farming', 'Governance Tokens', 'Restaking'],
        currentAmount: 0,
        progress: 0,
        isActive: false
      },
      education: {
        id: 'education',
        title: 'Education Fund',
        description: 'Invest in learning and growth',
        icon: 'GraduationCap',
        color: 'bg-red-100 text-red-800',
        targetAmount: 15000,
        timeframe: '24 months',
        riskLevel: 'Medium',
        expectedApy: '8-14%',
        strategy: 'Steady growth protocols',
        popular: false,
        strategies: ['Education-focused DeFi', 'Skill Token Staking'],
        currentAmount: 0,
        progress: 0,
        isActive: false
      }
    }
  }

  /**
   * Keep original method for backward compatibility
   */
  getDefaultFinObjectives() {
    return this.getCleanFinObjectives()
  }

  /**
   * Get clean yield data
   */
  getCleanYieldData() {
    return {
      activeStrategies: 0,
      totalEarning: 0,
      avgAPY: 0,
      goalsProgress: 0,
      lastUpdated: Date.now()
    }
  }

  /**
   * Keep original method for backward compatibility
   */
  getDefaultYieldData() {
    return this.getCleanYieldData()
  }

  /**
   * Get risk level configurations
   */
  getRiskLevels() {
    return {
      Low: { color: 'bg-green-100 text-green-800', description: 'Stable returns, minimal volatility' },
      Medium: { color: 'bg-yellow-100 text-yellow-800', description: 'Balanced risk-reward ratio' },
      'Medium-High': { color: 'bg-orange-100 text-orange-800', description: 'Higher returns, increased volatility' },
      High: { color: 'bg-red-100 text-red-800', description: 'Maximum returns, significant risk' }
    }
  }

  /**
   * Get all FinObjective configurations
   */
  getFinObjectives() {
    return { ...this.state.finObjectives }
  }

  /**
   * Get specific FinObjective by ID
   */
  getFinObjective(objectiveId) {
    return this.state.finObjectives[objectiveId] || null
  }

  /**
   * Start a FinObjective strategy
   */
  startFinObjective(objectiveId, initialAmount = 0) {
    if (!this.state.finObjectives[objectiveId]) {
      throw new Error(`FinObjective ${objectiveId} not found`)
    }

    const objective = this.state.finObjectives[objectiveId]
    
    // Update objective status
    objective.isActive = true
    objective.currentAmount = initialAmount
    objective.progress = objective.targetAmount > 0 ? (initialAmount / objective.targetAmount) * 100 : 0
    objective.startedAt = Date.now()

    // Create strategy in balance tracking
    this.updateStrategyBalance(objectiveId, initialAmount, {
      name: objective.title,
      targetAmount: objective.targetAmount,
      apy: parseFloat(objective.expectedApy.split('-')[0]) || 0,
      riskLevel: objective.riskLevel,
      strategy: objective.strategy
    })

    // Update yield data
    this.updateYieldData()

    // Emit events
    this.emit('finObjective:started', objective)
    this.emit('finObjectives:updated', this.state.finObjectives)

    return objective
  }

  /**
   * Update FinObjective progress
   */
  updateFinObjective(objectiveId, additionalAmount) {
    if (!this.state.finObjectives[objectiveId]) {
      throw new Error(`FinObjective ${objectiveId} not found`)
    }

    const objective = this.state.finObjectives[objectiveId]
    
    // Update amounts
    objective.currentAmount += additionalAmount
    objective.progress = objective.targetAmount > 0 ? Math.min((objective.currentAmount / objective.targetAmount) * 100, 100) : 0
    objective.lastUpdated = Date.now()

    // Update strategy balance
    this.updateStrategyBalance(objectiveId, additionalAmount)

    // Check if objective is completed
    if (objective.progress >= 100 && !objective.completedAt) {
      objective.completedAt = Date.now()
      objective.isActive = false
      this.emit('finObjective:completed', objective)
    }

    // Update yield data
    this.updateYieldData()

    // Emit events
    this.emit('finObjective:updated', objective)
    this.emit('finObjectives:updated', this.state.finObjectives)

    return objective
  }

  /**
   * Stop a FinObjective strategy
   */
  stopFinObjective(objectiveId) {
    if (!this.state.finObjectives[objectiveId]) {
      throw new Error(`FinObjective ${objectiveId} not found`)
    }

    const objective = this.state.finObjectives[objectiveId]
    
    // Mark as stopped
    objective.isActive = false
    objective.stoppedAt = Date.now()

    // Stop the corresponding strategy
    this.stopStrategy(objectiveId)

    // Update yield data
    this.updateYieldData()

    // Emit events
    this.emit('finObjective:stopped', objective)
    this.emit('finObjectives:updated', this.state.finObjectives)

    return objective
  }

  /**
   * Calculate and update yield data based on current strategies
   */
  updateYieldData() {
    const strategies = this.getActiveStrategies()
    const finObjectives = Object.values(this.state.finObjectives)
    
    // Calculate metrics
    const activeStrategies = strategies.length
    const totalEarning = strategies.reduce((sum, strategy) => {
      // Simulate earnings based on strategy amount and APY
      const timeActive = (Date.now() - (strategy.createdAt || Date.now())) / (1000 * 60 * 60 * 24 * 365) // Years
      const earnings = strategy.currentAmount * (strategy.apy / 100) * timeActive
      return sum + earnings
    }, 0)
    
    const avgAPY = strategies.length > 0 
      ? strategies.reduce((sum, strategy) => sum + (strategy.apy || 0), 0) / strategies.length
      : 0

    const activeObjectives = finObjectives.filter(obj => obj.isActive)
    const completedObjectives = finObjectives.filter(obj => obj.progress >= 100)
    const goalsProgress = activeObjectives.length > 0 
      ? (completedObjectives.length / finObjectives.length) * 100
      : 0

    // Update yield data
    this.state.yieldData = {
      activeStrategies,
      totalEarning,
      avgAPY,
      goalsProgress,
      lastUpdated: Date.now()
    }

    // Emit update
    this.emit('yieldData:updated', this.state.yieldData)
  }

  /**
   * Get current yield data
   */
  getYieldData() {
    return { ...this.state.yieldData }
  }

  /**
   * Get popular FinObjectives
   */
  getPopularFinObjectives() {
    return Object.values(this.state.finObjectives).filter(obj => obj.popular)
  }

  /**
   * Stop a strategy and move funds back to available balance
   */
  stopStrategy(strategyId) {
    if (!this.state.balance.strategies?.[strategyId]) {
      logger.error(`Strategy ${strategyId} not found`)
      return false
    }

    const strategy = this.state.balance.strategies[strategyId]
    
    // Check if strategy is already stopped
    if (strategy.status === 'stopped') {
      return true // Return true but don't change balances
    }
    
    const strategyAmount = strategy.currentAmount

    // Mark strategy as stopped
    strategy.status = 'stopped'
    strategy.stoppedAt = Date.now()

    // Move funds from strategy balance to available balance
    this.state.balance.strategyBalance -= strategyAmount
    this.state.balance.availableForSpending += strategyAmount

    // Update total balance (should remain the same)
    this.state.balance.totalUSD = this.state.balance.availableForSpending + 
                                  this.state.balance.investedAmount + 
                                  this.state.balance.strategyBalance

    this.state.balance.lastUpdated = Date.now()
    
    // Persist and emit events
    this.persistBalance()
    this.emit('balance:updated', this.state.balance)
    this.emit('strategy:stopped', strategy)
    
    return true
  }

  /**
   * Get estimated asset price for quantity calculations
   * This is a simplified version - in production would integrate with price feeds
   */
  getEstimatedAssetPrice(asset) {
    const basePrices = {
      'BTC': 43250,
      'ETH': 2680,
      'SOL': 98.75,
      'SUI': 1.85,
      'PAXG': 2687.34,
      'XAUT': 2689.45,
      'MAG7': 485.23,
      'SPX': 5125.45,
      'REIT': 245.67
    }
    return basePrices[asset] || 100
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
      logger.warn('DataManager is disposed, cannot subscribe')
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
          logger.error(`Error in subscriber for ${eventType}:`, error)
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
      logger.error(`Error dispatching event ${eventType}:`, error)
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
   * Original balance update logic - Updated to match proper financial flow
   */
  async updateBalanceOriginal(transactionData) {
    this.state.isLoading = true
    this.emit('balance:loading', true)

    try {
      const { type, amount, netAmount, fees, asset, paymentMethod } = transactionData
      
      // Use the pre-calculated netAmount if provided (single source of truth)
      // Otherwise fall back to amount for backward compatibility
      const amountToProcess = netAmount !== undefined ? parseFloat(netAmount) : parseFloat(amount)
      
      // Debug logging to track balance processing
      logger.debug('DataManager updateBalance:', {
        transactionType: type,
        originalAmount: amount,
        netAmount: netAmount,
        amountToProcess: amountToProcess,
        fees: fees,
        paymentMethod
      })

      // Update balance based on transaction type
      switch (type) {
        case 'add': {
          // Add/Deposit transaction per TRANSACTIONS.md section 3.1.1
          // The net amount (amount - fees) has already been calculated in the transaction flow
          // This is the single source of truth - we just apply it directly
          
          logger.debug('Add transaction balance update:', {
            currentAvailable: this.state.balance.availableForSpending,
            amountToAdd: amountToProcess,
            newAvailable: this.state.balance.availableForSpending + amountToProcess
          })
          
          this.state.balance.availableForSpending += amountToProcess
          // Invested balance unchanged
          break
        }
          
        case 'withdraw': {
          // Withdraw transaction per specification section 3.1.2
          // Money Flow: From = diBoaS Available Balance (transaction amount) → To = selected external method (amount - fees)
          // Technical: USDC → Fiat (Off-ramp) or USDC → USDC (On-chain)
          // Available Balance = current - transaction amount (full amount deducted upfront)
          // Invested Balance = no changes, Strategy Balance = no changes
          this.state.balance.availableForSpending = Math.max(0, this.state.balance.availableForSpending - amountToProcess)
          break
        }
          
        case 'send':
          // Send transaction per specification section 3.1.3
          // Money Flow: From = diBoaS Available Balance (transaction amount) → To = another user diBoaS Available Balance (amount - fees)
          // Available Balance = current - transaction amount, Invested Balance = no change, Strategy Balance = no change
          this.state.balance.availableForSpending = Math.max(0, this.state.balance.availableForSpending - amountToProcess)
          break
          
        case 'receive':
          // Receive: Add full amount to Available Balance
          this.state.balance.availableForSpending += amountToProcess
          break
          
        case 'buy': {
          // Buy transaction - use original amount and calculate net amount for invested balance
          const originalAmount = parseFloat(amount)
          const feesTotal = parseFloat(fees?.total || 0)
          const netInvestmentAmount = originalAmount - feesTotal
          
          if (paymentMethod === 'diboas_wallet') {
            // Buy transaction diBoaS wallet
            // Available Balance = current - transaction amount (full amount deducted)
            // Invested Balance = current + (transaction amount - fees)
            this.state.balance.availableForSpending = Math.max(0, this.state.balance.availableForSpending - originalAmount)
            this.state.balance.investedAmount += netInvestmentAmount
          } else {
            // Buy transaction other payment methods
            // Available Balance = no changes (external payment)
            // Invested Balance = current + (transaction amount - fees)
            this.state.balance.investedAmount += netInvestmentAmount
          }
          
          // Update asset tracking for invested assets
          if (!this.state.balance.assets[asset]) {
            this.state.balance.assets[asset] = { amount: 0, usdValue: 0, investedAmount: 0, quantity: 0 }
          }
          this.state.balance.assets[asset].usdValue += netInvestmentAmount
          this.state.balance.assets[asset].investedAmount += netInvestmentAmount
          
          // Update quantity tracking (simplified calculation for now)
          // In production, this would use actual asset prices
          const estimatedPrice = this.getEstimatedAssetPrice(asset)
          const quantityPurchased = netInvestmentAmount / estimatedPrice
          this.state.balance.assets[asset].quantity += quantityPurchased
          break
        }
          
        case 'sell': {
          // Sell transaction
          // Available Balance = current + (transaction amount - fees)
          // Invested Balance = current - transaction amount
          const originalAmount = parseFloat(amount)
          const feesTotal = parseFloat(fees?.total || 0)
          const netSellProceeds = originalAmount - feesTotal
          this.state.balance.availableForSpending += netSellProceeds
          this.state.balance.investedAmount = Math.max(0, this.state.balance.investedAmount - originalAmount)
          
          // Update asset tracking
          if (this.state.balance.assets[asset]) {
            this.state.balance.assets[asset].usdValue = Math.max(0, this.state.balance.assets[asset].usdValue - originalAmount)
            this.state.balance.assets[asset].investedAmount = Math.max(0, this.state.balance.assets[asset].investedAmount - originalAmount)
            
            // Update quantity tracking
            const estimatedPrice = this.getEstimatedAssetPrice(asset)
            const quantitySold = originalAmount / estimatedPrice
            this.state.balance.assets[asset].quantity = Math.max(0, this.state.balance.assets[asset].quantity - quantitySold)
            
            if (this.state.balance.assets[asset].investedAmount === 0) {
              delete this.state.balance.assets[asset]
            }
          }
          break
        }
          
        case 'start_strategy': {
          // Start Strategy transaction
          const originalAmount = parseFloat(amount)
          const feesTotal = parseFloat(fees?.total || 0)
          const netStrategyAmount = originalAmount - feesTotal
          
          if (paymentMethod === 'diboas_wallet') {
            // Start strategy using diBoaS wallet
            // Available Balance = current - transaction amount
            // Strategy Balance = current + (transaction amount - fees)
            this.state.balance.availableForSpending = Math.max(0, this.state.balance.availableForSpending - amountToProcess)
            this.state.balance.strategyBalance += netStrategyAmount
          } else {
            // Start strategy using external payment methods
            // Available Balance = no changes
            // Strategy Balance = current + (transaction amount - fees)
            this.state.balance.strategyBalance += netStrategyAmount
          }
          
          // Create or update strategy record
          const strategyConfig = transactionData.strategyConfig || {}
          const strategyId = `strategy_${Date.now()}`
          
          if (!this.state.balance.strategies) {
            this.state.balance.strategies = {}
          }
          
          this.state.balance.strategies[strategyId] = {
            id: strategyId,
            name: strategyConfig.strategyName || 'Unnamed Strategy',
            currentAmount: netStrategyAmount,
            initialAmount: netStrategyAmount,
            riskLevel: strategyConfig.riskLevel || 'Moderate',
            timeline: strategyConfig.timeline || '6-to-12-months',
            status: 'active',
            createdAt: Date.now(),
            apy: parseFloat(strategyConfig.simulation?.yieldPercentage || '5'),
            config: strategyConfig
          }
          
          // Update FinObjective if this is based on a template
          if (strategyConfig.objectiveId && strategyConfig.objectiveId !== 'create-new') {
            this.startFinObjective(strategyConfig.objectiveId, netStrategyAmount)
          }
          
          break
        }
          
        case 'stop_strategy': {
          // Stop Strategy transaction per TRANSACTIONS.md section 3.3.3
          const originalAmount = parseFloat(amount)
          const totalStrategyValue = originalAmount // This is the total strategy value including yields
          const netProceeds = totalStrategyValue - feesTotal
          
          // Available Balance = current + (total strategy value - fees)
          this.state.balance.availableForSpending += netProceeds
          
          // Strategy Balance = current - total strategy value
          this.state.balance.strategyBalance = Math.max(0, this.state.balance.strategyBalance - totalStrategyValue)
          
          // Update specific strategy record if strategyId provided
          const strategyId = transactionData.strategyId
          if (strategyId && this.state.balance.strategies && this.state.balance.strategies[strategyId]) {
            // Mark strategy as stopped and archive performance data
            const strategy = this.state.balance.strategies[strategyId]
            strategy.status = 'stopped'
            strategy.stoppedAt = Date.now()
            strategy.finalAmount = totalStrategyValue
            strategy.totalEarned = totalStrategyValue - strategy.initialAmount
            strategy.finalAPY = ((totalStrategyValue / strategy.initialAmount) - 1) * 100
            
            // Move to archived strategies for historical tracking
            if (!this.state.balance.archivedStrategies) {
              this.state.balance.archivedStrategies = {}
            }
            this.state.balance.archivedStrategies[strategyId] = { ...strategy }
            
            // Remove from active strategies
            delete this.state.balance.strategies[strategyId]
          }
          
          break
        }
      }

      // Recalculate total balance: Total = Available + Invested + Strategy
      this.state.balance.totalUSD = this.state.balance.availableForSpending + 
                                    this.state.balance.investedAmount + 
                                    this.state.balance.strategyBalance
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
      logger.warn(`Transaction ${transactionId} not found for update`)
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
      // Category information for filtering
      category: transactionData.category || this.getTransactionCategory(transactionData.type),
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
   * Add failed transaction to history for user feedback and audit trail
   */
  addFailedTransaction(transactionData, errorMessage) {
    const transaction = {
      id: transactionData.id || `failed_tx_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
      type: transactionData.type,
      amount: transactionData.amount,
      currency: transactionData.currency || 'USD',
      status: 'failed',
      description: transactionData.description || this.generateTransactionDescription(transactionData),
      recipient: transactionData.recipient,
      asset: transactionData.asset || 'USDC',
      paymentMethod: transactionData.paymentMethod,
      fees: transactionData.fees || {},
      createdAt: new Date().toISOString(),
      failedAt: new Date().toISOString(),
      error: errorMessage,
      category: transactionData.category || this.getTransactionCategory(transactionData.type),
      // Mark as failed transaction for UI differentiation
      isFailed: true,
      onChainStatus: 'failed',
      // Legacy fields for backward compatibility
      timestamp: new Date().toISOString(),
      netAmount: 0 // No balance change for failed transactions
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
   * Process complete transaction (balance + history) with security validations
   */
  async processTransaction(transactionData) {
    try {
      // SECURITY: Validate financial amounts
      if (!this.validateFinancialAmount(transactionData.amount)) {
        const failedTransaction = this.addFailedTransaction(transactionData, 'Invalid transaction amount')
        this.emit('transaction:failed', { transaction: failedTransaction, error: 'Invalid transaction amount' })
        return {
          success: false,
          error: 'Invalid transaction amount',
          transaction: failedTransaction
        }
      }

      // SECURITY: Check for SQL injection attempts
      if (transactionData.description && this.detectSQLInjection(transactionData.description)) {
        secureLogger.audit('SQL_INJECTION_ATTEMPT', {
          field: 'description',
          userId: transactionData.userId
        })
        const failedTransaction = this.addFailedTransaction(transactionData, 'Invalid characters detected in transaction data')
        this.emit('transaction:failed', { transaction: failedTransaction, error: 'Invalid characters detected in transaction data' })
        return {
          success: false,
          error: 'Invalid characters detected in transaction data',
          transaction: failedTransaction
        }
      }

      // SECURITY: Check for XSS attempts
      if (transactionData.description && this.detectXSSAttempt(transactionData.description)) {
        secureLogger.audit('XSS_ATTEMPT_DETECTED', {
          field: 'description',
          userId: transactionData.userId
        })
        const failedTransaction = this.addFailedTransaction(transactionData, 'Invalid script content detected')
        this.emit('transaction:failed', { transaction: failedTransaction, error: 'Invalid script content detected' })
        return {
          success: false,
          error: 'Invalid script content detected',
          transaction: failedTransaction
        }
      }

      // SECURITY: Check transaction limits
      const userId = transactionData.userId || 'demo_user_12345'
      if (transactionData.amount > 10000) { // Daily limit example
        secureLogger.audit('TRANSACTION_LIMIT_EXCEEDED', {
          userId: userId,
          amount: transactionData.amount,
          limit: 10000
        })
        const failedTransaction = this.addFailedTransaction(transactionData, 'Transaction limit exceeded')
        this.emit('transaction:failed', { transaction: failedTransaction, error: 'Transaction limit exceeded' })
        return {
          success: false,
          error: 'Transaction limit exceeded',
          transaction: failedTransaction
        }
      }

      // SECURITY: Check for replay attacks (duplicate nonce/ID)
      if (transactionData.nonce && this.state.transactions.some(tx => tx.nonce === transactionData.nonce)) {
        secureLogger.audit('REPLAY_ATTACK_DETECTED', {
          transactionId: transactionData.id,
          nonce: transactionData.nonce
        })
        const failedTransaction = this.addFailedTransaction(transactionData, 'Duplicate transaction detected - possible replay attack')
        this.emit('transaction:failed', { transaction: failedTransaction, error: 'Duplicate transaction detected - possible replay attack' })
        return {
          success: false,
          error: 'Duplicate transaction detected - possible replay attack',
          transaction: failedTransaction
        }
      }

      // SECURITY: Validate wallet addresses for crypto transactions
      if (transactionData.type === 'crypto_transfer' && transactionData.toAddress) {
        if (!this.validateWalletAddress(transactionData.toAddress)) {
          const failedTransaction = this.addFailedTransaction(transactionData, 'Invalid wallet address format')
          this.emit('transaction:failed', { transaction: failedTransaction, error: 'Invalid wallet address format' })
          return {
            success: false,
            error: 'Invalid wallet address format',
            transaction: failedTransaction
          }
        }
      }

      // SECURITY: Check for double-spending (same transaction ID)
      if (transactionData.id && this.state.transactions.some(tx => tx.id === transactionData.id)) {
        secureLogger.audit('DOUBLE_SPEND_ATTEMPT', {
          transactionId: transactionData.id,
          nonce: transactionData.nonce
        })
        const failedTransaction = this.addFailedTransaction(transactionData, 'Transaction already processed - possible double spend attempt')
        this.emit('transaction:failed', { transaction: failedTransaction, error: 'Transaction already processed - possible double spend attempt' })
        return {
          success: false,
          error: 'Transaction already processed - possible double spend attempt',
          transaction: failedTransaction
        }
      }

      // SECURITY: Rate limiting check
      const rateLimitCheck = this.checkRateLimit(userId)
      if (!rateLimitCheck.allowed) {
        const errorMessage = `Rate limit exceeded. Try again in ${Math.ceil(rateLimitCheck.remainingTime / 1000)} seconds`
        const failedTransaction = this.addFailedTransaction(transactionData, errorMessage)
        this.emit('transaction:failed', { transaction: failedTransaction, error: errorMessage })
        return {
          success: false,
          error: errorMessage,
          transaction: failedTransaction
        }
      }

      // Update balance first
      await this.updateBalance(transactionData)
      
      // Add to transaction history
      const transaction = this.addTransaction(transactionData)
      
      // Emit complete transaction event
      this.emit('transaction:completed', { transaction, balance: this.state.balance })
      
      // Also dispatch the specific event that AppDashboard is listening for
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('diboas-transaction-completed', {
          detail: { transaction, userId: userId }
        }))
      }
      
      return { 
        success: true,
        transaction, 
        balance: this.state.balance 
      }
    } catch (error) {
      const failedTransaction = this.addFailedTransaction(transactionData, error.message)
      this.emit('transaction:error', error)
      this.emit('transaction:failed', { transaction: failedTransaction, error: error.message })
      return {
        success: false,
        error: error.message,
        transaction: failedTransaction
      }
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
      logger.warn('Failed to load encrypted balance:', error)
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
      logger.warn('Failed to load encrypted transactions:', error)
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
        logger.warn('Failed to migrate legacy balance:', error)
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
        logger.warn('Failed to migrate legacy transactions:', error)
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
      logger.error('Failed to persist encrypted balance:', error)
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
      logger.error('Failed to persist encrypted transactions:', error)
    }
  }

  /**
   * Get transaction category based on type
   */
  getTransactionCategory(type) {
    const categoryMap = {
      'add': 'banking',
      'send': 'banking',
      'receive': 'banking',
      'withdraw': 'banking',
      'buy': 'investment',
      'sell': 'investment',
      'transfer': 'banking',
      'yield': 'yield',
      'stake': 'yield',
      'unstake': 'yield',
      'start_strategy': 'yield',
      'stop_strategy': 'yield'
    }
    return categoryMap[type] || 'banking'
  }

  /**
   * Generate transaction description
   */
  generateTransactionDescription(transactionData) {
    const { type, amount, asset, paymentMethod, strategyConfig } = transactionData
    
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
      case 'start_strategy':
        return `Started ${strategyConfig?.strategyName || 'strategy'} with $${amount}`
      case 'stop_strategy':
        return `Stopped ${strategyConfig?.strategyName || 'strategy'} strategy`
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
      case 'PAXG':
      case 'XAUT':
        return `0x${randomHex()}${randomHex()}${randomHex()}${randomHex()}`.substring(0, 66)
      case 'SOL':
      case 'MAG7':
      case 'SPX':
      case 'REIT':
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
      'SUI': 'https://suiexplorer.com/txblock/',
      'PAXG': 'https://etherscan.io/tx/',
      'XAUT': 'https://etherscan.io/tx/',
      'MAG7': 'https://solscan.io/tx/',
      'SPX': 'https://solscan.io/tx/',
      'REIT': 'https://solscan.io/tx/'
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
      logger.error(`Transaction operation ${operationId} failed:`, error)
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
        logger.warn(`Cleaning up stale lock: ${lockKey}`)
        this.transactionLock.delete(lockKey)
      }
    }
  }

  /**
   * SECURITY: Validate financial amounts for precision and security
   */
  validateFinancialAmount(amount) {
    // Check for valid number
    if (amount === null || amount === undefined || Number.isNaN(amount) || !Number.isFinite(amount)) {
      return false
    }
    
    // Check for zero or negative amounts
    if (amount <= 0) {
      return false
    }
    
    // Check decimal precision (max 2 decimal places for USD)
    const amountStr = amount.toString()
    if (amountStr.includes('.')) {
      const decimalPlaces = amountStr.split('.')[1]
      if (decimalPlaces && decimalPlaces.length > 2) {
        return false
      }
    }
    
    // Check for reasonable ranges (prevent overflow attacks)
    if (Math.abs(amount) > 1000000000) { // 1 billion limit
      return false
    }
    
    return true
  }

  /**
   * SECURITY: Validate transaction integrity to prevent tampering
   */
  validateTransactionIntegrity(transaction, originalTransaction) {
    if (!transaction || !originalTransaction) {
      return false
    }
    
    // Check critical fields haven't been tampered with
    const criticalFields = ['id', 'amount', 'userId', 'timestamp']
    for (const field of criticalFields) {
      if (transaction[field] !== originalTransaction[field]) {
        secureLogger.audit('TRANSACTION_INTEGRITY_VIOLATION', {
          field,
          original: originalTransaction[field],
          tampered: transaction[field],
          transactionId: transaction.id
        })
        return false
      }
    }
    
    // Check hash integrity if present
    if (originalTransaction.hash && transaction.hash !== originalTransaction.hash) {
      secureLogger.audit('TRANSACTION_HASH_MISMATCH', {
        originalHash: originalTransaction.hash,
        currentHash: transaction.hash,
        transactionId: transaction.id
      })
      return false
    }
    
    return true
  }

  /**
   * SECURITY: Validate transaction signature (mock implementation)
   */
  async validateTransactionSignature(transaction) {
    // Mock validation - in production would verify cryptographic signatures
    if (!transaction.signature || transaction.signature === 'invalid_signature') {
      secureLogger.audit('INVALID_SIGNATURE_DETECTED', {
        transactionId: transaction.id,
        from: transaction.from
      })
      return {
        valid: false,
        error: 'Invalid or missing signature'
      }
    }
    
    return {
      valid: true
    }
  }

  /**
   * SECURITY: Enhanced updateBalance with validation
   */
  async updateBalance(transactionData, operation = 'transaction') {
    const userId = transactionData.userId || 'demo_user_12345'
    const previousBalance = this.state.balance ? this.state.balance.totalUSD : 0
    
    // Call original updateBalance logic
    await this.updateBalanceOriginal(transactionData)
    
    const newBalance = this.state.balance.totalUSD
    
    // Validate the balance change with transaction data for context
    const validation = this.validateBalanceChange(userId, previousBalance, newBalance, operation, transactionData)
    if (!validation.success) {
      // Revert balance change
      this.state.balance.totalUSD = previousBalance
      throw new Error(validation.error)
    }
    
    return this.state.balance
  }

  /**
   * SECURITY: Prevent balance manipulation by validating balance changes
   */
  validateBalanceChange(userId, previousBalance, newBalance, operation, transactionData = null) {
    // Prevent direct balance manipulation (bypassing transaction flow)
    if (operation === 'direct_set') {
      secureLogger.audit('BALANCE_MANIPULATION_ATTEMPT', {
        userId,
        previousBalance,
        attemptedBalance: newBalance,
        operation
      })
      return {
        success: false,
        error: 'Unauthorized balance modification attempt'
      }
    }
    
    // Check for unrealistic balance jumps
    const balanceChange = Math.abs(newBalance - previousBalance)
    const changePercent = previousBalance > 0 ? (balanceChange / previousBalance) * 100 : 0
    
    // Allow large percentage increases for legitimate on-ramp transactions
    const isLegitimateDeposit = transactionData && 
      (transactionData.type === 'add' || transactionData.type === 'deposit') &&
      transactionData.paymentMethod !== 'diboas_wallet' && // External payment method
      balanceChange <= 100000 // Cap at $100K for single transaction
    
    // Allow large increases if it's a legitimate external deposit or if previous balance was very small
    if (changePercent > 1000 && previousBalance > 0 && !isLegitimateDeposit && previousBalance > 100) {
      secureLogger.audit('SUSPICIOUS_BALANCE_CHANGE', {
        userId,
        previousBalance,
        newBalance,
        changePercent,
        operation,
        transactionType: transactionData?.type,
        paymentMethod: transactionData?.paymentMethod
      })
      return {
        success: false,
        error: 'Suspicious balance change detected'
      }
    }
    
    return {
      success: true
    }
  }

  /**
   * SECURITY: Get balance audit trail for security monitoring
   */
  async getBalanceAuditTrail(userId, limit = 50) {
    // Mock implementation - in production would query audit database
    return this.state.transactions
      .filter(tx => tx.userId === userId)
      .map(tx => ({
        operation: tx.type,
        amount: tx.type === 'withdraw' ? -tx.amount : tx.amount,
        userId: tx.userId,
        timestamp: tx.timestamp,
        transactionId: tx.id
      }))
      .slice(0, limit)
  }

  /**
   * SECURITY: Rate limiting for transaction submissions
   */
  checkRateLimit(userId, timeWindowMs = 60000, maxTransactions = 10) {
    const now = Date.now()
    const recentTransactions = this.state.transactions.filter(tx => 
      tx.userId === userId && (now - new Date(tx.timestamp).getTime()) < timeWindowMs
    )
    
    if (recentTransactions.length >= maxTransactions) {
      secureLogger.audit('RATE_LIMIT_EXCEEDED', {
        userId,
        attemptedTransactions: recentTransactions.length + 1,
        timeWindow: timeWindowMs,
        limit: maxTransactions
      })
      return {
        allowed: false,
        remainingTime: timeWindowMs - (now - new Date(recentTransactions[0].timestamp).getTime())
      }
    }
    
    return {
      allowed: true,
      remaining: maxTransactions - recentTransactions.length
    }
  }

  /**
   * SECURITY: Process external transaction with circuit breaker
   */
  async processExternalTransaction(transactionData) {
    // Mock circuit breaker implementation
    const circuitBreakerKey = 'external_api'
    const failureThreshold = 5
    const failures = this._circuitBreakerFailures || {}
    
    if (failures[circuitBreakerKey] >= failureThreshold) {
      secureLogger.audit('CIRCUIT_BREAKER_ACTIVATED', {
        service: circuitBreakerKey,
        failureCount: failures[circuitBreakerKey]
      })
      return {
        success: false,
        error: 'Circuit breaker activated - service temporarily unavailable'
      }
    }
    
    try {
      // Mock external API call
      if (Math.random() < 0.1) { // 10% failure rate
        throw new Error('External API unavailable')
      }
      
      return {
        success: true,
        transactionId: `ext_${Date.now()}`,
        amount: transactionData.amount
      }
    } catch (error) {
      // Track failures for circuit breaker
      if (!this._circuitBreakerFailures) {
        this._circuitBreakerFailures = {}
      }
      this._circuitBreakerFailures[circuitBreakerKey] = (failures[circuitBreakerKey] || 0) + 1
      
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * SECURITY: Mock method for calling external APIs
   */
  async callExternalAPI(options) {
    // Mock implementation that can fail
    throw new Error('API unavailable')
  }

  /**
   * SECURITY: Detect SQL injection attempts
   */
  detectSQLInjection(input) {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
      /(--|\*\/|\/\*)/,
      /('|('')|";|;')/,
      /((\%3D)|(=))[^\n]*(\%27|(\'))/i
    ]
    
    return sqlPatterns.some(pattern => pattern.test(input))
  }

  /**
   * SECURITY: Detect XSS attempts
   */
  detectXSSAttempt(input) {
    const xssPatterns = [
      /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
      /<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<[^>]*\s+on\w+\s*=/gi
    ]
    
    return xssPatterns.some(pattern => pattern.test(input))
  }

  /**
   * SECURITY: Validate wallet address format
   */
  validateWalletAddress(address) {
    if (!address || typeof address !== 'string') {
      return false
    }
    
    // Ethereum-style address validation (0x + 40 hex chars)
    if (address.startsWith('0x')) {
      return /^0x[a-fA-F0-9]{40}$/.test(address)
    }
    
    // Other address formats can be added here
    return false
  }

  /**
   * PERFORMANCE: Bulk insert transactions for testing
   */
  async bulkInsertTransactions(transactions) {
    return this.withTransactionLock('bulk-insert', async () => {
      // Validate all transactions first
      for (const tx of transactions) {
        if (!tx.id || !tx.userId || !tx.amount) {
          throw new Error('Invalid transaction in bulk insert')
        }
      }
      
      // Add all transactions
      this.state.transactions.unshift(...transactions)
      
      // Trim to maintain size limits
      this.trimTransactionHistory()
      
      // Persist to storage
      this.persistTransactions()
      
      return transactions.length
    })
  }

  /**
   * PERFORMANCE: Complex balance calculation for testing
   */
  async calculateComplexBalance(userId, options = {}) {
    const userTransactions = this.state.transactions.filter(tx => tx.userId === userId)
    
    let totalBalance = 0
    let total = 0
    let pendingAmount = 0
    
    for (const tx of userTransactions) {
      if (tx.status === 'pending') {
        pendingAmount += tx.amount
      } else if (tx.status === 'completed') {
        totalBalance += tx.type === 'withdraw' ? -tx.amount : tx.amount
        total += tx.fees?.total || 0
      }
    }
    
    const result = {
      totalBalance,
      total,
      pendingAmount,
      transactionCount: userTransactions.length,
      lastCalculated: Date.now()
    }
    
    if (options.includeProjectedBalance) {
      result.projectedBalance = totalBalance + pendingAmount
    }
    
    return result
  }

  /**
   * PERFORMANCE: Clean up old transactions
   */
  async cleanupOldTransactions(userId, daysOld = 30) {
    const cutoffTime = Date.now() - (daysOld * 24 * 60 * 60 * 1000)
    
    const initialCount = this.state.transactions.length
    this.state.transactions = this.state.transactions.filter(tx => {
      if (tx.userId === userId) {
        const txTime = new Date(tx.timestamp).getTime()
        return txTime > cutoffTime
      }
      return true // Keep transactions from other users
    })
    
    const cleanedCount = initialCount - this.state.transactions.length
    
    if (cleanedCount > 0) {
      this.persistTransactions()
    }
    
    return cleanedCount
  }

  /**
   * PERFORMANCE: Get transaction history with pagination
   */
  async getTransactionHistory(userId, options = {}) {
    const { limit = 50, offset = 0 } = options
    
    const userTransactions = this.state.transactions
      .filter(tx => tx.userId === userId)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(offset, offset + limit)
    
    return userTransactions
  }

  /**
   * PERFORMANCE: Mock database operation for testing
   */
  async performDatabaseOperation(options) {
    // Mock database operation with variable latency
    const latency = Math.random() * 100 + 10 // 10-110ms
    await new Promise(resolve => setTimeout(resolve, latency))
    
    return {
      success: true,
      operation: options.operation,
      table: options.table,
      latency: latency
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

  // ====================
  // GOAL-STRATEGIES SYSTEM INTEGRATION METHODS
  // ====================

  /**
   * Get strategy performance analytics
   */
  async getStrategyAnalytics(strategyId, timeframe = '1year') {
    try {
      const strategy = this.state.balance.strategies[strategyId]
      if (!strategy) {
        throw new Error(`Strategy ${strategyId} not found`)
      }

      // Get strategy transactions
      const strategyTransactions = this.state.transactions.filter(tx => 
        tx.type === 'start_strategy' || tx.type === 'stop_strategy' || 
        (tx.type === 'deposit' && tx.targetStrategy === strategyId)
      )

      // Calculate performance metrics using StrategyAnalyticsService
      const analytics = await strategyAnalyticsService.calculatePerformanceMetrics(
        strategyId,
        strategyTransactions,
        strategy.currentAmount,
        timeframe
      )

      return analytics
    } catch (error) {
      logger.error(`Failed to get strategy analytics for ${strategyId}:`, error)
      throw error
    }
  }

  /**
   * Generate strategy projections
   */
  async getStrategyProjections(strategyId, monthlyContribution = 0, timeHorizon = '1year') {
    try {
      const strategy = this.state.balance.strategies[strategyId]
      if (!strategy) {
        throw new Error(`Strategy ${strategyId} not found`)
      }

      const projections = await strategyAnalyticsService.generateProjections(
        strategy.currentAmount,
        monthlyContribution,
        timeHorizon,
        strategy.apy || 8,
        strategy.riskLevel || 'Moderate'
      )

      return projections
    } catch (error) {
      logger.error(`Failed to generate projections for ${strategyId}:`, error)
      throw error
    }
  }

  /**
   * Get optimal protocol recommendations
   */
  async getProtocolRecommendations(asset, riskTolerance, targetAmount, chain = 'ethereum') {
    try {
      const recommendations = await protocolService.getOptimalProtocol(
        asset,
        riskTolerance,
        targetAmount,
        chain
      )

      return recommendations
    } catch (error) {
      logger.error('Failed to get protocol recommendations:', error)
      throw error
    }
  }

  /**
   * Assess portfolio risk
   */
  async assessPortfolioRisk(userRiskTolerance = 'Moderate') {
    try {
      // Build portfolio from current strategies
      const portfolio = {
        totalValue: this.state.balance.strategyBalance,
        positions: Object.values(this.state.balance.strategies)
          .filter(strategy => strategy.status === 'active')
          .map(strategy => ({
            asset: 'USDC', // Simplified - in production would track actual assets
            protocol: strategy.protocol || 'compound',
            value: strategy.currentAmount
          }))
      }

      const riskAssessment = await riskEngine.assessPortfolioRisk(portfolio, userRiskTolerance)
      return riskAssessment
    } catch (error) {
      logger.error('Portfolio risk assessment failed:', error)
      throw error
    }
  }

  /**
   * Generate rebalancing recommendations
   */
  async getRebalancingRecommendations(userRiskTolerance = 'Moderate', targetAllocations = null) {
    try {
      const portfolio = {
        totalValue: this.state.balance.strategyBalance,
        positions: Object.values(this.state.balance.strategies)
          .filter(strategy => strategy.status === 'active')
          .map(strategy => ({
            asset: 'USDC',
            protocol: strategy.protocol || 'compound',
            value: strategy.currentAmount
          }))
      }

      const recommendation = await riskEngine.generateRebalanceRecommendation(
        portfolio,
        userRiskTolerance,
        targetAllocations
      )

      return recommendation
    } catch (error) {
      logger.error('Rebalancing recommendation failed:', error)
      throw error
    }
  }

  /**
   * Create automation (scheduled deposits, rebalancing, etc.)
   */
  async createAutomation(automationConfig) {
    try {
      const automation = await automationService.createAutomation(automationConfig)
      
      // Emit automation event
      this.emit('automation:created', automation)
      
      return automation
    } catch (error) {
      logger.error('Failed to create automation:', error)
      throw error
    }
  }

  /**
   * Get all user automations
   */
  getAllAutomations() {
    return automationService.getAllAutomations()
  }

  /**
   * Simulate strategy stress test
   */
  async runStrategyStressTest(strategyId, scenarios = ['market_crash', 'high_volatility', 'liquidity_crisis']) {
    try {
      const strategy = this.state.balance.strategies[strategyId]
      if (!strategy) {
        throw new Error(`Strategy ${strategyId} not found`)
      }

      const portfolio = {
        totalValue: strategy.currentAmount,
        positions: [{
          asset: 'USDC',
          protocol: strategy.protocol || 'compound',
          value: strategy.currentAmount
        }]
      }

      const stressTest = await riskEngine.simulateStressTest(portfolio, scenarios)
      return stressTest
    } catch (error) {
      logger.error(`Stress test failed for strategy ${strategyId}:`, error)
      throw error
    }
  }

  /**
   * Enhanced yield data calculation with real analytics
   */
  async getEnhancedYieldData() {
    try {
      const activeStrategies = this.getActiveStrategies()
      let totalEarning = 0
      let totalInvested = 0
      let weightedAPY = 0
      let goalsProgress = 0

      // Calculate enhanced metrics using analytics service
      for (const strategy of activeStrategies) {
        try {
          const analytics = await this.getStrategyAnalytics(strategy.id, '1year')
          
          totalEarning += analytics.unrealizedGain || 0
          totalInvested += strategy.currentAmount
          
          if (strategy.currentAmount > 0) {
            weightedAPY += (analytics.annualizedReturn || 0) * (strategy.currentAmount / totalInvested)
          }

          // Calculate goal progress
          if (strategy.targetAmount > 0) {
            const progress = (strategy.currentAmount / strategy.targetAmount) * 100
            goalsProgress += progress
          }
        } catch (error) {
          // Fallback to basic calculation if analytics fail
          logger.warn(`Analytics failed for strategy ${strategy.id}, using fallback`)
        }
      }

      // Average goal progress
      if (activeStrategies.length > 0) {
        goalsProgress = goalsProgress / activeStrategies.length
      }

      return {
        activeStrategies: activeStrategies.length,
        totalEarning: parseFloat(totalEarning.toFixed(2)),
        avgAPY: parseFloat(weightedAPY.toFixed(1)),
        goalsProgress: parseFloat(goalsProgress.toFixed(0)),
        totalInvested: parseFloat(totalInvested.toFixed(2)),
        lastUpdated: Date.now()
      }
    } catch (error) {
      logger.error('Enhanced yield data calculation failed:', error)
      // Fallback to basic yield data
      return this.getYieldData()
    }
  }

  // ====================
  // ADVANCED FINANCIAL FEATURES INTEGRATION
  // ====================

  /**
   * Get comprehensive tax analysis and optimization recommendations
   */
  async getTaxOptimizationReport(userProfile) {
    try {
      // Build portfolio from current state
      const portfolio = {
        totalValue: this.state.balance.totalUSD,
        positions: this.buildPortfolioPositions()
      }

      const taxReport = await taxOptimizationService.generateTaxOptimizationRecommendations(
        portfolio,
        userProfile
      )

      return taxReport
    } catch (error) {
      logger.error('Tax optimization report failed:', error)
      throw error
    }
  }

  /**
   * Calculate tax liability for current portfolio
   */
  async calculateTaxLiability(userProfile) {
    try {
      const portfolio = {
        totalValue: this.state.balance.totalUSD,
        positions: this.buildPortfolioPositions()
      }

      const taxLiability = await taxOptimizationService.calculateTaxLiability(
        portfolio,
        userProfile
      )

      return taxLiability
    } catch (error) {
      logger.error('Tax liability calculation failed:', error)
      throw error
    }
  }

  /**
   * Identify tax loss harvesting opportunities
   */
  async getTaxLossHarvestingOpportunities(minLossThreshold = 1000) {
    try {
      const portfolio = {
        totalValue: this.state.balance.totalUSD,
        positions: this.buildPortfolioPositions()
      }

      const opportunities = await taxOptimizationService.identifyHarvestingOpportunities(
        portfolio,
        minLossThreshold
      )

      return opportunities
    } catch (error) {
      logger.error('Tax loss harvesting analysis failed:', error)
      throw error
    }
  }

  /**
   * Generate year-end tax planning report
   */
  async getYearEndTaxReport(userProfile) {
    try {
      const portfolio = {
        totalValue: this.state.balance.totalUSD,
        positions: this.buildPortfolioPositions()
      }

      const yearEndReport = await taxOptimizationService.generateYearEndTaxReport(
        portfolio,
        userProfile
      )

      return yearEndReport
    } catch (error) {
      logger.error('Year-end tax report failed:', error)
      throw error
    }
  }

  /**
   * Get available lending pools
   */
  getAllLendingPools() {
    try {
      return lendingPoolService.getAllLendingPools()
    } catch (error) {
      logger.error('Failed to get lending pools:', error)
      throw error
    }
  }

  /**
   * Apply for a loan from lending pool
   */
  async applyForLoan(applicationData) {
    try {
      const application = await lendingPoolService.applyForLoan(applicationData)
      
      // Emit loan application event
      this.emit('loan:applied', application)
      
      return application
    } catch (error) {
      logger.error('Loan application failed:', error)
      throw error
    }
  }

  /**
   * Execute flash loan
   */
  async executeFlashLoan(flashLoanData) {
    try {
      const result = await lendingPoolService.executeFlashLoan(flashLoanData)
      
      // Add flash loan transaction to history
      if (result.success) {
        await this.addTransaction({
          type: 'flash_loan',
          amount: flashLoanData.amount,
          currency: flashLoanData.asset,
          description: `Flash loan: ${flashLoanData.asset} ${flashLoanData.amount}`,
          profit: result.actualProfit,
          fee: result.fee,
          duration: result.executionTime
        })
      }

      this.emit('flash_loan:executed', result)
      
      return result
    } catch (error) {
      logger.error('Flash loan execution failed:', error)
      throw error
    }
  }

  /**
   * Provide liquidity to lending pool
   */
  async provideLiquidity(liquidityData) {
    try {
      const position = await lendingPoolService.provideLiquidity(liquidityData)
      
      // Update balance - subtract provided liquidity
      await this.updateBalance(-liquidityData.amount, 'liquidity_provision')
      
      // Add transaction record
      await this.addTransaction({
        type: 'provide_liquidity',
        amount: liquidityData.amount,
        currency: 'USD',
        description: `Provided liquidity to ${liquidityData.poolId} pool`,
        poolId: liquidityData.poolId,
        expectedAPY: position.expectedAPY
      })

      this.emit('liquidity:provided', position)
      
      return position
    } catch (error) {
      logger.error('Liquidity provision failed:', error)
      throw error
    }
  }

  /**
   * Get lending pool analytics
   */
  async getLendingPoolAnalytics(poolId) {
    try {
      return await lendingPoolService.getLendingPoolAnalytics(poolId)
    } catch (error) {
      logger.error('Lending pool analytics failed:', error)
      throw error
    }
  }

  /**
   * Get user's lending positions
   */
  getUserLendingPositions(userAddress) {
    try {
      return lendingPoolService.getUserLendingPositions(userAddress)
    } catch (error) {
      logger.error('Failed to get lending positions:', error)
      throw error
    }
  }

  /**
   * Generate comprehensive portfolio insights
   */
  async getPortfolioInsights(userProfile, timeframe = '30d') {
    try {
      const portfolio = {
        totalValue: this.state.balance.totalUSD,
        positions: this.buildPortfolioPositions()
      }

      const insights = await portfolioInsightsService.generatePortfolioInsights(
        portfolio,
        userProfile,
        timeframe
      )

      return insights
    } catch (error) {
      logger.error('Portfolio insights generation failed:', error)
      throw error
    }
  }

  /**
   * Get portfolio health assessment
   */
  async getPortfolioHealthAssessment() {
    try {
      const portfolio = {
        totalValue: this.state.balance.totalUSD,
        positions: this.buildPortfolioPositions()
      }

      const healthAssessment = await portfolioInsightsService.assessPortfolioHealth(portfolio)
      
      return healthAssessment
    } catch (error) {
      logger.error('Portfolio health assessment failed:', error)
      throw error
    }
  }

  /**
   * Get market conditions analysis
   */
  getMarketConditions() {
    try {
      return portfolioInsightsService.assessMarketConditions()
    } catch (error) {
      logger.error('Market conditions analysis failed:', error)
      throw error
    }
  }

  /**
   * Get personalized financial dashboard data
   */
  async getFinancialDashboard(userProfile) {
    try {
      // Gather data from all services
      const [
        enhancedYieldData,
        portfolioInsights,
        portfolioHealth,
        marketConditions,
        taxOptimization,
        lendingPools,
        rebalancingRecommendations
      ] = await Promise.allSettled([
        this.getEnhancedYieldData(),
        this.getPortfolioInsights(userProfile, '30d'),
        this.getPortfolioHealthAssessment(),
        Promise.resolve(this.getMarketConditions()),
        this.getTaxOptimizationReport(userProfile).catch(() => null),
        Promise.resolve(this.getAllLendingPools()),
        this.getRebalancingRecommendations(userProfile.riskTolerance).catch(() => null)
      ])

      // Extract fulfilled values
      const dashboard = {
        overview: {
          totalValue: this.state.balance.totalUSD,
          availableBalance: this.state.balance.availableForSpending,
          investedAmount: this.state.balance.investedAmount,
          strategyBalance: this.state.balance.strategyBalance,
          yieldData: enhancedYieldData.status === 'fulfilled' ? enhancedYieldData.value : null
        },
        insights: {
          portfolio: portfolioInsights.status === 'fulfilled' ? portfolioInsights.value : null,
          health: portfolioHealth.status === 'fulfilled' ? portfolioHealth.value : null,
          market: marketConditions.status === 'fulfilled' ? marketConditions.value : null
        },
        optimization: {
          tax: taxOptimization.status === 'fulfilled' ? taxOptimization.value : null,
          rebalancing: rebalancingRecommendations.status === 'fulfilled' ? rebalancingRecommendations.value : null
        },
        opportunities: {
          lending: lendingPools.status === 'fulfilled' ? lendingPools.value : [],
          automations: this.getAllAutomations()
        },
        alerts: this.generateDashboardAlerts(portfolioInsights.value, portfolioHealth.value),
        lastUpdated: new Date().toISOString()
      }

      // Cache dashboard data
      this.state.dashboard = dashboard

      secureLogger.audit('FINANCIAL_DASHBOARD_GENERATED', {
        userId: userProfile.userId,
        totalValue: dashboard.overview.totalValue,
        insightCount: dashboard.insights.portfolio?.insights?.length || 0
      })

      return dashboard
    } catch (error) {
      logger.error('Financial dashboard generation failed:', error)
      throw error
    }
  }

  /**
   * Helper method to build portfolio positions from current state
   */
  buildPortfolioPositions() {
    const positions = []

    // Add strategy positions
    if (this.state.balance.strategies) {
      Object.values(this.state.balance.strategies).forEach(strategy => {
        if (strategy.status === 'active') {
          positions.push({
            id: strategy.id,
            asset: 'USDC', // Simplified - in production would track actual assets
            protocol: strategy.protocol || 'compound',
            value: strategy.currentAmount,
            costBasis: strategy.targetAmount || strategy.currentAmount,
            currentValue: strategy.currentAmount,
            assetType: 'strategy',
            purchaseDate: strategy.createdAt
          })
        }
      })
    }

    // Add asset positions from balance breakdown
    if (this.state.balance.breakdown) {
      Object.entries(this.state.balance.breakdown).forEach(([asset, data]) => {
        if (data.usdValue > 0) {
          positions.push({
            id: `${asset}_holding`,
            asset: asset,
            protocol: 'wallet',
            value: data.usdValue,
            costBasis: data.usdValue, // Simplified
            currentValue: data.usdValue,
            assetType: 'crypto',
            amount: data.native
          })
        }
      })
    }

    return positions
  }

  /**
   * Generate dashboard alerts based on insights and health
   */
  generateDashboardAlerts(insights, health) {
    const alerts = []

    // Critical insights become alerts
    if (insights?.insights) {
      const criticalInsights = insights.insights.filter(insight => 
        insight.priority === 'critical' || insight.priority === 'high'
      )

      criticalInsights.slice(0, 3).forEach(insight => {
        alerts.push({
          type: 'insight',
          priority: insight.priority,
          title: insight.title,
          message: insight.description,
          action: insight.recommendation
        })
      })
    }

    // Health-based alerts
    if (health?.overallScore < 60) {
      alerts.push({
        type: 'health',
        priority: 'medium',
        title: 'Portfolio Health Needs Attention',
        message: `Your portfolio health score is ${health.overallScore}/100`,
        action: 'Review portfolio balance and diversification'
      })
    }

    // Balance alerts
    if (this.state.balance.availableForSpending < 1000) {
      alerts.push({
        type: 'balance',
        priority: 'low',
        title: 'Low Available Balance',
        message: 'Consider adding funds for new opportunities',
        action: 'Add money to your wallet'
      })
    }

    return alerts.slice(0, 5) // Limit to 5 alerts
  }

  /**
   * PERFORMANCE MONITORING METHODS
   */

  /**
   * Start performance monitoring for the application
   */
  startPerformanceMonitoring() {
    try {
      performanceMonitoringService.startMonitoring()
      
      // Track DataManager operations
      this.instrumentDataManagerMethods()
      
      logger.info('Performance monitoring started for DataManager')
    } catch (error) {
      logger.error('Failed to start performance monitoring:', error)
    }
  }

  /**
   * Stop performance monitoring
   */
  stopPerformanceMonitoring() {
    try {
      performanceMonitoringService.stopMonitoring()
      logger.info('Performance monitoring stopped')
    } catch (error) {
      logger.error('Failed to stop performance monitoring:', error)
    }
  }

  /**
   * Get performance metrics summary
   */
  getPerformanceMetrics(timeWindow) {
    try {
      return performanceMonitoringService.getMetricsSummary(timeWindow)
    } catch (error) {
      logger.error('Failed to get performance metrics:', error)
      return {}
    }
  }

  /**
   * Get performance alerts
   */
  getPerformanceAlerts(limit) {
    try {
      return performanceMonitoringService.getRecentAlerts(limit)
    } catch (error) {
      logger.error('Failed to get performance alerts:', error)
      return []
    }
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(timeWindow) {
    try {
      return performanceMonitoringService.generatePerformanceReport(timeWindow)
    } catch (error) {
      logger.error('Failed to generate performance report:', error)
      return null
    }
  }

  /**
   * Record custom performance metric
   */
  recordPerformanceMetric(name, value, type, tags) {
    try {
      return performanceMonitoringService.recordMetric(name, value, type, tags)
    } catch (error) {
      logger.error('Failed to record performance metric:', error)
      return null
    }
  }

  /**
   * Track database query performance
   */
  trackDatabaseQuery(query, duration, resultCount) {
    try {
      performanceMonitoringService.recordDatabaseQuery(query, duration, resultCount)
    } catch (error) {
      logger.error('Failed to track database query:', error)
    }
  }

  /**
   * Track API call performance
   */
  trackAPICall(endpoint, method, statusCode, duration, size) {
    try {
      performanceMonitoringService.recordAPICall(endpoint, method, statusCode, duration, size)
    } catch (error) {
      logger.error('Failed to track API call:', error)
    }
  }

  /**
   * Track user interaction
   */
  trackUserInteraction(action, component, duration, metadata) {
    try {
      performanceMonitoringService.recordUserInteraction(action, component, duration, metadata)
    } catch (error) {
      logger.error('Failed to track user interaction:', error)
    }
  }

  /**
   * Instrument DataManager methods for performance tracking
   */
  instrumentDataManagerMethods() {
    const methodsToInstrument = [
      'processTransaction',
      'updateBalance',
      'getFinancialDashboard',
      'calculateTaxLiability',
      'getPortfolioInsights',
      'applyForLoan',
      'executeFlashLoan',
      'provideLiquidity'
    ]

    methodsToInstrument.forEach(methodName => {
      if (typeof this[methodName] === 'function') {
        const originalMethod = this[methodName].bind(this)
        
        this[methodName] = async function(...args) {
          const startTime = performance.now()
          const timer = performanceMonitoringService.startTimer(`datamanager_${methodName}`, {
            method: methodName,
            component: 'DataManager'
          })

          try {
            const result = await originalMethod(...args)
            const duration = performance.now() - startTime
            
            performanceMonitoringService.endTimer(`datamanager_${methodName}`, {
              success: true,
              resultSize: JSON.stringify(result || {}).length
            })

            // Record specific metrics for critical operations
            if (duration > 1000) { // Log slow operations
              logger.warn(`Slow DataManager operation: ${methodName} took ${duration.toFixed(2)}ms`)
            }

            return result
          } catch (error) {
            const duration = performance.now() - startTime
            
            performanceMonitoringService.endTimer(`datamanager_${methodName}`, {
              success: false,
              error: error.message
            })

            throw error
          }
        }
      }
    })
  }

  /**
   * Get comprehensive performance dashboard data
   */
  async getPerformanceDashboard() {
    try {
      const metrics = this.getPerformanceMetrics(15 * 60 * 1000) // 15 minutes
      const alerts = this.getPerformanceAlerts(20)
      const systemHealth = this.assessSystemHealth(metrics, alerts)

      return {
        metrics,
        alerts,
        systemHealth,
        recommendations: this.generatePerformanceRecommendations(metrics, alerts),
        lastUpdated: new Date().toISOString()
      }
    } catch (error) {
      logger.error('Failed to get performance dashboard:', error)
      return {
        metrics: {},
        alerts: [],
        systemHealth: { score: 0, status: 'unknown' },
        recommendations: [],
        error: error.message
      }
    }
  }

  /**
   * Assess overall system health based on performance metrics
   */
  assessSystemHealth(metrics, alerts) {
    let score = 100
    let status = 'excellent'
    let issues = []

    // Check critical metrics
    if (metrics.api_call_duration?.avg > 2000) {
      score -= 20
      issues.push('Slow API responses')
    }

    if (metrics.error_rate?.latest > 5) {
      score -= 25
      issues.push('High error rate')
    }

    if (metrics.memory_used?.latest > 150) {
      score -= 15
      issues.push('High memory usage')
    }

    // Check alerts
    const criticalAlerts = alerts.filter(a => a.level === 'critical').length
    const warningAlerts = alerts.filter(a => a.level === 'warning').length
    
    score -= criticalAlerts * 10
    score -= warningAlerts * 3

    if (criticalAlerts > 0) issues.push(`${criticalAlerts} critical alerts`)
    if (warningAlerts > 2) issues.push(`${warningAlerts} warning alerts`)

    // Determine status
    if (score >= 90) status = 'excellent'
    else if (score >= 75) status = 'good'
    else if (score >= 60) status = 'fair'
    else if (score >= 40) status = 'poor'
    else status = 'critical'

    return {
      score: Math.max(0, score),
      status,
      issues,
      criticalAlerts,
      warningAlerts
    }
  }

  /**
   * Generate performance improvement recommendations
   */
  generatePerformanceRecommendations(metrics, alerts) {
    const recommendations = []

    // API performance recommendations
    if (metrics.api_call_duration?.avg > 1500) {
      recommendations.push({
        category: 'API Performance',
        priority: 'high',
        title: 'Optimize API Response Times',
        description: `Average API response time is ${metrics.api_call_duration.avg.toFixed(0)}ms. Consider implementing caching, optimizing database queries, or using a CDN.`,
        impact: 'high'
      })
    }

    // Memory recommendations
    if (metrics.memory_used?.max > 200) {
      recommendations.push({
        category: 'Memory Management',
        priority: 'medium',
        title: 'Monitor Memory Usage',
        description: `Peak memory usage reached ${metrics.memory_used.max.toFixed(1)}MB. Consider optimizing data structures and implementing memory cleanup routines.`,
        impact: 'medium'
      })
    }

    // Error handling recommendations
    if (metrics.error_rate?.latest > 3) {
      recommendations.push({
        category: 'Error Handling',
        priority: 'high',
        title: 'Reduce Error Rate',
        description: `Current error rate is ${metrics.error_rate.latest.toFixed(1)}%. Implement better error handling and validation to improve user experience.`,
        impact: 'high'
      })
    }

    // Database performance recommendations
    if (metrics.db_query_duration?.avg > 800) {
      recommendations.push({
        category: 'Database Performance',
        priority: 'medium',
        title: 'Optimize Database Queries',
        description: `Average database query time is ${metrics.db_query_duration.avg.toFixed(0)}ms. Consider adding database indexes or optimizing complex queries.`,
        impact: 'medium'
      })
    }

    // Throughput recommendations
    if (metrics.throughput?.latest < 0.5) {
      recommendations.push({
        category: 'System Throughput',
        priority: 'medium',
        title: 'Improve System Throughput',
        description: `Current throughput is ${metrics.throughput.latest.toFixed(1)} RPS. Consider scaling infrastructure or optimizing processing efficiency.`,
        impact: 'medium'
      })
    }

    return recommendations.slice(0, 5) // Limit to top 5 recommendations
  }

  /**
   * SECURITY MONITORING METHODS
   */

  /**
   * Start security monitoring for the application
   */
  startSecurityMonitoring() {
    try {
      // Security monitoring is auto-started in constructor
      logger.info('Security monitoring is active')
    } catch (error) {
      logger.error('Failed to start security monitoring:', error)
    }
  }

  /**
   * Stop security monitoring
   */
  stopSecurityMonitoring() {
    try {
      securityMonitoringService.stopSecurityMonitoring()
      logger.info('Security monitoring stopped')
    } catch (error) {
      logger.error('Failed to stop security monitoring:', error)
    }
  }

  /**
   * Record security threat
   */
  recordSecurityThreat(threatType, severity, details = {}) {
    try {
      return securityMonitoringService.recordThreat(threatType, severity, details)
    } catch (error) {
      logger.error('Failed to record security threat:', error)
      return null
    }
  }

  /**
   * Record audit event
   */
  recordAuditEvent(eventType, userId, details = {}) {
    try {
      return securityMonitoringService.recordAuditEvent(eventType, userId, details)
    } catch (error) {
      logger.error('Failed to record audit event:', error)
      return null
    }
  }

  /**
   * Validate input for security threats
   */
  validateUserInput(input, context = {}) {
    try {
      const threats = []
      
      // Check for SQL injection
      const sqlResult = securityMonitoringService.detectSQLInjection(input, context)
      if (sqlResult.detected) {
        threats.push({ type: 'sql_injection', ...sqlResult })
      }

      // Check for XSS
      const xssResult = securityMonitoringService.detectXSS(input, context)
      if (xssResult.detected) {
        threats.push({ type: 'xss_attempt', ...xssResult })
      }

      return {
        safe: threats.length === 0,
        threats,
        sanitizedInput: this.sanitizeInput(input)
      }
    } catch (error) {
      logger.error('Input validation failed:', error)
      return { safe: false, threats: [], sanitizedInput: input }
    }
  }

  /**
   * Check for authentication anomalies
   */
  checkAuthenticationAnomaly(userId, authDetails = {}) {
    try {
      return securityMonitoringService.checkAuthenticationAnomaly(userId, authDetails)
    } catch (error) {
      logger.error('Authentication anomaly check failed:', error)
      return { anomaly: false, score: 0 }
    }
  }

  /**
   * Check for transaction anomalies
   */
  checkTransactionAnomaly(userId, transactionDetails = {}) {
    try {
      return securityMonitoringService.checkTransactionAnomaly(userId, transactionDetails)
    } catch (error) {
      logger.error('Transaction anomaly check failed:', error)
      return { anomaly: false, score: 0 }
    }
  }

  /**
   * Check rate limiting
   */
  checkRateLimit(identifier, limit, windowMs) {
    try {
      return securityMonitoringService.checkRateLimit(identifier, limit, windowMs)
    } catch (error) {
      logger.error('Rate limit check failed:', error)
      return { allowed: true, remaining: 0, resetTime: Date.now() }
    }
  }

  /**
   * Get security dashboard data
   */
  getSecurityDashboard() {
    try {
      return securityMonitoringService.getSecurityDashboard()
    } catch (error) {
      logger.error('Failed to get security dashboard:', error)
      return {
        securityScore: 0,
        threatStats: { total: 0, resolved: 0 },
        recentThreats: [],
        recentAlerts: [],
        complianceOverview: {},
        riskProfile: { overall: 'unknown', score: 0 },
        recommendations: [],
        error: error.message
      }
    }
  }

  /**
   * Get recent security threats
   */
  getSecurityThreats(limit = 20) {
    try {
      return Array.from(securityMonitoringService.threats.values())
        .sort((a, b) => b.timestamp - a.timestamp)
        .slice(0, limit)
    } catch (error) {
      logger.error('Failed to get security threats:', error)
      return []
    }
  }

  /**
   * Get recent security alerts
   */
  getSecurityAlerts(limit = 20) {
    try {
      return securityMonitoringService.getRecentAlerts(limit)
    } catch (error) {
      logger.error('Failed to get security alerts:', error)
      return []
    }
  }

  /**
   * Resolve security threat
   */
  resolveSecurityThreat(threatId, resolution = {}) {
    try {
      return securityMonitoringService.resolveThreat(threatId, resolution)
    } catch (error) {
      logger.error('Failed to resolve security threat:', error)
      return null
    }
  }

  /**
   * Get compliance status
   */
  getComplianceStatus() {
    try {
      const compliance = {}
      for (const [type, check] of securityMonitoringService.complianceChecks) {
        compliance[type] = {
          name: check.name,
          score: check.score,
          checks: check.checks,
          lastCheck: check.lastCheck
        }
      }
      return compliance
    } catch (error) {
      logger.error('Failed to get compliance status:', error)
      return {}
    }
  }

  /**
   * Run compliance checks
   */
  runComplianceChecks() {
    try {
      securityMonitoringService.runComplianceChecks()
      logger.info('Compliance checks completed')
    } catch (error) {
      logger.error('Failed to run compliance checks:', error)
    }
  }

  /**
   * Get audit trail for user
   */
  getUserAuditTrail(userId, timeWindow = 24 * 60 * 60 * 1000) {
    try {
      const now = Date.now()
      const cutoff = now - timeWindow
      
      return Array.from(securityMonitoringService.auditLog.values())
        .filter(event => event.userId === userId && event.timestamp > cutoff)
        .sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      logger.error('Failed to get audit trail:', error)
      return []
    }
  }

  /**
   * Enhanced transaction processing with security checks
   */
  async processSecureTransaction(transactionData) {
    try {
      const userId = this.state.user?.id || 'demo_user_12345'
      
      // Security validations
      const inputValidation = this.validateUserInput(JSON.stringify(transactionData), {
        operation: 'transaction',
        userId
      })

      if (!inputValidation.safe) {
        logger.warn('Transaction blocked due to security threats:', inputValidation.threats)
        return {
          success: false,
          error: 'Transaction blocked for security reasons',
          threats: inputValidation.threats
        }
      }

      // Check for transaction anomalies
      const anomalyCheck = this.checkTransactionAnomaly(userId, transactionData)
      if (anomalyCheck.anomaly && anomalyCheck.score > 0.8) {
        logger.warn('Transaction blocked due to anomaly detection:', anomalyCheck)
        return {
          success: false,
          error: 'Transaction blocked due to unusual activity pattern',
          anomaly: anomalyCheck
        }
      }

      // Check rate limiting
      const rateLimit = this.checkRateLimit(`transaction_${userId}`, 10, 60000) // 10 per minute
      if (!rateLimit.allowed) {
        logger.warn('Transaction blocked due to rate limiting')
        return {
          success: false,
          error: 'Too many transactions. Please wait before trying again.',
          rateLimitInfo: rateLimit
        }
      }

      // Record audit event
      this.recordAuditEvent('transaction_initiated', userId, {
        transactionType: transactionData.type,
        amount: transactionData.amount,
        asset: transactionData.asset,
        ipAddress: transactionData.ipAddress || 'unknown'
      })

      // Process the transaction (existing logic)
      const result = await this.processTransaction(transactionData)

      // Record successful transaction
      if (result.success) {
        this.recordAuditEvent('transaction_completed', userId, {
          transactionId: result.transaction?.id,
          transactionType: transactionData.type,
          amount: transactionData.amount,
          outcome: 'success'
        })
      } else {
        this.recordAuditEvent('transaction_failed', userId, {
          transactionType: transactionData.type,
          amount: transactionData.amount,
          outcome: 'failure',
          error: result.error
        })
      }

      return result
    } catch (error) {
      logger.error('Secure transaction processing failed:', error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Sanitize user input
   */
  sanitizeInput(input) {
    if (typeof input !== 'string') return input
    
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocols
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim()
  }

  /**
   * Get comprehensive security report
   */
  generateSecurityReport() {
    try {
      const dashboard = this.getSecurityDashboard()
      const compliance = this.getComplianceStatus()
      const threats = this.getSecurityThreats(50)
      const alerts = this.getSecurityAlerts(50)

      return {
        reportId: `security_report_${Date.now()}`,
        generatedAt: new Date().toISOString(),
        securityScore: dashboard.securityScore,
        threatSummary: {
          total: threats.length,
          resolved: threats.filter(t => t.resolved).length,
          critical: threats.filter(t => t.severity === 'critical').length,
          high: threats.filter(t => t.severity === 'high').length
        },
        complianceSummary: Object.entries(compliance).map(([type, data]) => ({
          framework: data.name,
          score: data.score,
          status: data.score >= 80 ? 'compliant' : 'non_compliant'
        })),
        riskProfile: dashboard.riskProfile,
        recommendations: dashboard.recommendations,
        detailedThreats: threats.slice(0, 20),
        detailedAlerts: alerts.slice(0, 20)
      }
    } catch (error) {
      logger.error('Failed to generate security report:', error)
      return {
        reportId: null,
        generatedAt: new Date().toISOString(),
        error: error.message
      }
    }
  }

  // ================================
  // ERROR RECOVERY METHODS
  // ================================

  /**
   * Start error recovery monitoring
   */
  startErrorRecovery() {
    try {
      // Error recovery service is automatically initialized
      logger.info('Error recovery monitoring started')
      return { success: true }
    } catch (error) {
      logger.error('Failed to start error recovery:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Handle error with recovery
   */
  async handleError(errorData, context = {}) {
    try {
      const result = await errorRecoveryService.handleError({
        ...errorData,
        context: { ...context, source: 'DataManager' }
      })
      
      this.publishEvent('error_handled', { errorData, result })
      return result
    } catch (error) {
      logger.error('Failed to handle error:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Check circuit breaker status
   */
  checkCircuitBreaker(serviceKey) {
    try {
      return errorRecoveryService.checkCircuitBreaker(serviceKey)
    } catch (error) {
      logger.error('Failed to check circuit breaker:', error)
      return { canProceed: true, state: 'unknown' }
    }
  }

  /**
   * Reset circuit breaker
   */
  resetCircuitBreaker(serviceKey) {
    try {
      errorRecoveryService.resetCircuitBreaker(serviceKey)
      this.publishEvent('circuit_breaker_reset', { serviceKey })
      return { success: true }
    } catch (error) {
      logger.error('Failed to reset circuit breaker:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Get error statistics
   */
  getErrorStatistics(timeWindow = 24 * 60 * 60 * 1000) {
    try {
      return errorRecoveryService.getErrorStatistics(timeWindow)
    } catch (error) {
      logger.error('Failed to get error statistics:', error)
      return {
        total: 0,
        byType: {},
        bySeverity: {},
        recoverySuccess: 0,
        topErrors: []
      }
    }
  }

  /**
   * Register fallback service
   */
  registerFallbackService(serviceType, fallbackFunction) {
    try {
      errorRecoveryService.registerFallbackService(serviceType, fallbackFunction)
      logger.info(`Fallback service registered for ${serviceType}`)
      return { success: true }
    } catch (error) {
      logger.error('Failed to register fallback service:', error)
      return { success: false, error: error.message }
    }
  }

  /**
   * Execute operation with retry logic
   */
  async executeWithRetry(operation, options = {}) {
    const { maxRetries = 3, backoffMs = 1000, context = {} } = options
    let attempts = 0
    let lastError = null

    while (attempts < maxRetries) {
      try {
        const result = await operation()
        
        // Reset circuit breaker on success
        if (context.serviceKey) {
          errorRecoveryService.resetCircuitBreaker(context.serviceKey)
        }
        
        return result
      } catch (error) {
        attempts++
        lastError = error
        
        if (attempts < maxRetries) {
          const delay = backoffMs * Math.pow(2, attempts - 1)
          logger.warn(`Operation failed (attempt ${attempts}/${maxRetries}), retrying in ${delay}ms`)
          await new Promise(resolve => setTimeout(resolve, delay))
        }
      }
    }

    // All attempts failed - handle error
    await this.handleError({
      type: 'operation_failure',
      severity: 'high',
      message: `Operation failed after ${maxRetries} attempts`,
      originalError: lastError
    }, context)

    throw lastError
  }

  /**
   * Execute transaction with rollback support
   */
  async executeTransaction(transactionFn, rollbackFn = null, context = {}) {
    const transactionId = `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    try {
      logger.info(`Starting transaction ${transactionId}`)
      
      const result = await transactionFn()
      
      logger.info(`Transaction ${transactionId} completed successfully`)
      this.publishEvent('transaction_completed', { transactionId, result })
      
      return result
    } catch (error) {
      logger.error(`Transaction ${transactionId} failed:`, error)
      
      // Attempt rollback if provided
      if (rollbackFn) {
        try {
          logger.info(`Rolling back transaction ${transactionId}`)
          await rollbackFn()
          logger.info(`Transaction ${transactionId} rolled back successfully`)
          
          this.publishEvent('transaction_rolled_back', { transactionId })
        } catch (rollbackError) {
          logger.error(`Rollback failed for transaction ${transactionId}:`, rollbackError)
          
          await this.handleError({
            type: 'transaction_rollback_failure',
            severity: 'critical',
            message: 'Transaction rollback failed',
            originalError: rollbackError
          }, { ...context, transactionId })
        }
      }

      // Handle the original transaction error
      await this.handleError({
        type: 'transaction_error',
        severity: 'high',
        message: 'Transaction failed',
        originalError: error
      }, { ...context, transactionId })

      throw error
    }
  }

  /**
   * Get error recovery dashboard data
   */
  getErrorRecoveryDashboard() {
    try {
      const statistics = this.getErrorStatistics()
      const circuitStates = ['api', 'auth', 'storage', 'network'].map(service => ({
        service,
        ...this.checkCircuitBreaker(service)
      }))

      return {
        statistics,
        circuitStates,
        systemHealth: this.calculateSystemHealth(statistics),
        recentErrors: this.getRecentErrors(10),
        recoveryRecommendations: this.getRecoveryRecommendations(statistics)
      }
    } catch (error) {
      logger.error('Failed to get error recovery dashboard:', error)
      return {
        error: error.message,
        statistics: { total: 0, byType: {}, bySeverity: {} },
        circuitStates: [],
        systemHealth: { score: 0, status: 'unknown' }
      }
    }
  }

  /**
   * Calculate system health based on error statistics
   */
  calculateSystemHealth(statistics) {
    let score = 100
    const { total, bySeverity } = statistics

    // Deduct points based on error severity
    score -= (bySeverity.critical || 0) * 20
    score -= (bySeverity.high || 0) * 10
    score -= (bySeverity.medium || 0) * 5
    score -= (bySeverity.low || 0) * 2

    score = Math.max(0, score)

    let status
    if (score >= 90) status = 'excellent'
    else if (score >= 75) status = 'good'
    else if (score >= 60) status = 'fair'
    else if (score >= 40) status = 'poor'
    else status = 'critical'

    return { score, status }
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit = 10) {
    try {
      // This would typically query from error storage
      // For now, return empty array as errors are handled by ErrorRecoveryService
      return []
    } catch (error) {
      logger.error('Failed to get recent errors:', error)
      return []
    }
  }

  /**
   * Get recovery recommendations
   */
  getRecoveryRecommendations(statistics) {
    const recommendations = []
    const { total, bySeverity, byType } = statistics

    if ((bySeverity.critical || 0) > 0) {
      recommendations.push({
        priority: 'high',
        category: 'Critical Errors',
        title: 'Address Critical Errors',
        description: `${bySeverity.critical} critical errors detected. Immediate attention required.`
      })
    }

    if ((byType.network_error || 0) > 5) {
      recommendations.push({
        priority: 'medium',
        category: 'Network Reliability',
        title: 'Improve Network Resilience',
        description: 'High number of network errors detected. Consider implementing better retry logic.'
      })
    }

    if (total > 50) {
      recommendations.push({
        priority: 'medium',
        category: 'Error Rate',
        title: 'High Error Rate Detected',
        description: `${total} errors in the last 24 hours. Review system stability.`
      })
    }

    return recommendations
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