/**
 * Query Bus Implementation for CQRS Pattern (Read Side)
 * Handles query execution and read model management
 */

import { eventStore } from '../events/EventStore.js'
import { securityManager, SECURITY_EVENT_TYPES } from '../security/SecurityManager.js'

/**
 * Query types for the application
 */
export const QUERY_TYPES = {
  // Balance Queries
  GET_BALANCE: 'get_balance',
  GET_BALANCE_HISTORY: 'get_balance_history',
  
  // Transaction Queries
  GET_TRANSACTION: 'get_transaction',
  GET_TRANSACTION_HISTORY: 'get_transaction_history',
  GET_RECENT_TRANSACTIONS: 'get_recent_transactions',
  
  // Strategy Queries
  GET_STRATEGY: 'get_strategy',
  GET_ACTIVE_STRATEGIES: 'get_active_strategies',
  GET_STRATEGY_PERFORMANCE: 'get_strategy_performance',
  
  // Market Data Queries
  GET_MARKET_DATA: 'get_market_data',
  GET_PRICE_HISTORY: 'get_price_history',
  
  // User Queries
  GET_USER_PROFILE: 'get_user_profile',
  GET_USER_PREFERENCES: 'get_user_preferences',
  
  // Analytics Queries
  GET_PORTFOLIO_SUMMARY: 'get_portfolio_summary',
  GET_PERFORMANCE_METRICS: 'get_performance_metrics'
}

/**
 * Base Query class
 */
export class Query {
  constructor(type, parameters = {}, metadata = {}) {
    this.id = this.generateQueryId()
    this.type = type
    this.parameters = parameters
    this.metadata = {
      userId: metadata.userId || 'system',
      timestamp: Date.now(),
      correlationId: metadata.correlationId || this.generateCorrelationId(),
      ...metadata
    }
  }

  generateQueryId() {
    return `qry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  generateCorrelationId() {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
}

/**
 * Query Handler interface
 */
export class QueryHandler {
  constructor(queryType) {
    this.queryType = queryType
  }

  /**
   * Validate query before execution
   */
  validate(query) {
    throw new Error('validate() must be implemented by subclass')
  }

  /**
   * Execute the query
   */
  async execute(query) {
    throw new Error('execute() must be implemented by subclass')
  }
}

/**
 * Balance Query Handlers
 */
export class GetBalanceHandler extends QueryHandler {
  constructor() {
    super(QUERY_TYPES.GET_BALANCE)
  }

  validate(query) {
    const { userId } = query.parameters
    if (!userId) {
      throw new Error('UserId is required for balance query')
    }
    return true
  }

  async execute(query) {
    const { userId } = query.parameters
    
    // Rebuild balance from events
    const balance = eventStore.rebuildAggregate(userId, 'account')
    
    return {
      success: true,
      data: balance.balance || {
        totalUSD: 0,
        availableForSpending: 0,
        investedAmount: 0,
        strategyBalance: 0
      },
      lastUpdated: balance.lastUpdated || Date.now()
    }
  }
}

export class GetTransactionHistoryHandler extends QueryHandler {
  constructor() {
    super(QUERY_TYPES.GET_TRANSACTION_HISTORY)
  }

  validate(query) {
    const { userId } = query.parameters
    if (!userId) {
      throw new Error('UserId is required for transaction history query')
    }
    return true
  }

  async execute(query) {
    const { userId, limit = 50, offset = 0 } = query.parameters
    
    // Get transaction events for user
    const transactionEvents = eventStore.eventLog.filter(event => 
      event.metadata.userId === userId && 
      (event.eventType.includes('TRANSACTION') || event.eventType.includes('BALANCE'))
    )
    
    // Convert events to transaction format
    const transactions = transactionEvents
      .slice(offset, offset + limit)
      .map(event => ({
        id: event.id,
        type: this.eventTypeToTransactionType(event.eventType),
        amount: event.eventData.amount || 0,
        asset: event.eventData.asset || 'USD',
        status: this.getTransactionStatus(event.eventType),
        timestamp: event.timestamp,
        metadata: event.eventData
      }))
    
    return {
      success: true,
      data: transactions,
      total: transactionEvents.length,
      hasMore: (offset + limit) < transactionEvents.length
    }
  }

  eventTypeToTransactionType(eventType) {
    const mapping = {
      'transaction_created': 'pending',
      'transaction_completed': 'completed',
      'balance_credited': 'credit',
      'balance_debited': 'debit'
    }
    return mapping[eventType] || 'unknown'
  }

  getTransactionStatus(eventType) {
    if (eventType.includes('COMPLETED')) return 'completed'
    if (eventType.includes('FAILED')) return 'failed'
    if (eventType.includes('CREATED')) return 'pending'
    return 'processing'
  }
}

export class GetActiveStrategiesHandler extends QueryHandler {
  constructor() {
    super(QUERY_TYPES.GET_ACTIVE_STRATEGIES)
  }

  validate(query) {
    const { userId } = query.parameters
    if (!userId) {
      throw new Error('UserId is required for strategies query')
    }
    return true
  }

  async execute(query) {
    const { userId } = query.parameters
    
    // Rebuild user strategies from events
    const userState = eventStore.rebuildAggregate(userId, 'account')
    const strategies = userState.strategies || {}
    
    // Filter active strategies
    const activeStrategies = Object.values(strategies).filter(strategy => 
      strategy.status === 'active' || strategy.status === 'created'
    )
    
    return {
      success: true,
      data: activeStrategies,
      count: activeStrategies.length
    }
  }
}

export class GetMarketDataHandler extends QueryHandler {
  constructor() {
    super(QUERY_TYPES.GET_MARKET_DATA)
  }

  validate(query) {
    return true // Market data queries don't require user validation
  }

  async execute(query) {
    const { assets = [] } = query.parameters
    
    // Get latest market data events
    const marketEvents = eventStore.getEventsByType('market_data_updated', 10)
    
    // Mock market data for now
    const marketData = {
      BTC: { price: 45000, change24h: 2.5, volume: 1000000000 },
      ETH: { price: 3200, change24h: -1.2, volume: 500000000 },
      SOL: { price: 120, change24h: 5.8, volume: 200000000 },
      SUI: { price: 2.5, change24h: 3.1, volume: 50000000 },
      USDC: { price: 1.0, change24h: 0.01, volume: 2000000000 }
    }
    
    // Filter by requested assets if specified
    const filteredData = assets.length > 0 
      ? Object.fromEntries(assets.map(asset => [asset, marketData[asset]]).filter(([, data]) => data))
      : marketData
    
    return {
      success: true,
      data: filteredData,
      timestamp: Date.now()
    }
  }
}

export class GetPortfolioSummaryHandler extends QueryHandler {
  constructor() {
    super(QUERY_TYPES.GET_PORTFOLIO_SUMMARY)
  }

  validate(query) {
    const { userId } = query.parameters
    if (!userId) {
      throw new Error('UserId is required for portfolio summary')
    }
    return true
  }

  async execute(query) {
    const { userId } = query.parameters
    
    // Get user balance and strategies
    const userState = eventStore.rebuildAggregate(userId, 'account')
    const balance = userState.balance || {}
    const strategies = userState.strategies || {}
    const transactions = userState.transactions || []
    
    // Calculate portfolio metrics
    const totalValue = balance.totalUSD || 0
    const investedAmount = balance.investedAmount || 0
    const availableAmount = balance.availableForSpending || 0
    const strategyCount = Object.keys(strategies).length
    const transactionCount = transactions.length
    
    // Calculate performance (mock calculation)
    const performanceMetrics = {
      totalReturn: investedAmount * 0.05, // 5% mock return
      totalReturnPercent: 5.0,
      dayChange: totalValue * 0.02,
      dayChangePercent: 2.0
    }
    
    return {
      success: true,
      data: {
        totalValue,
        investedAmount,
        availableAmount,
        strategyCount,
        transactionCount,
        performance: performanceMetrics,
        lastUpdated: Date.now()
      }
    }
  }
}

/**
 * Query Bus - coordinates query handling (Read Side of CQRS)
 */
export class QueryBus {
  constructor() {
    this.handlers = new Map()
    this.queryHistory = []
    this.readModels = new Map()
    
    this.registerDefaultHandlers()
  }

  /**
   * Register default query handlers
   */
  registerDefaultHandlers() {
    this.register(new GetBalanceHandler())
    this.register(new GetTransactionHistoryHandler())
    this.register(new GetActiveStrategiesHandler())
    this.register(new GetMarketDataHandler())
    this.register(new GetPortfolioSummaryHandler())
  }

  /**
   * Register a query handler
   */
  register(handler) {
    this.handlers.set(handler.queryType, handler)
  }

  /**
   * Execute a query
   */
  async execute(query) {
    try {
      // Security logging
      securityManager.logSecurityEvent(SECURITY_EVENT_TYPES.FINANCIAL_OPERATION, {
        action: 'query_received',
        queryType: query.type,
        queryId: query.id,
        userId: query.metadata.userId
      })

      // Get handler
      const handler = this.handlers.get(query.type)
      if (!handler) {
        throw new Error(`No handler registered for query type: ${query.type}`)
      }

      // Validate query
      handler.validate(query)

      // Execute query
      const result = await handler.execute(query)

      // Store query in history
      this.queryHistory.push({
        query,
        result,
        timestamp: Date.now(),
        success: true,
        executionTime: Date.now() - query.metadata.timestamp
      })

      // Log success
      securityManager.logSecurityEvent(SECURITY_EVENT_TYPES.FINANCIAL_OPERATION, {
        action: 'query_executed',
        queryType: query.type,
        queryId: query.id,
        success: true,
        executionTime: Date.now() - query.metadata.timestamp
      })

      return result

    } catch (error) {
      // Store failed query in history
      this.queryHistory.push({
        query,
        error: error.message,
        timestamp: Date.now(),
        success: false
      })

      // Log failure
      securityManager.logSecurityEvent(SECURITY_EVENT_TYPES.SECURITY_VIOLATION, {
        action: 'query_failed',
        queryType: query.type,
        queryId: query.id,
        error: error.message,
        severity: 'low'
      })

      throw error
    }
  }

  /**
   * Create and maintain read models
   */
  createReadModel(name, projection) {
    this.readModels.set(name, projection)
    
    // Register projection with event store
    eventStore.registerProjection(name, projection)
  }

  /**
   * Get read model state
   */
  getReadModel(name) {
    return eventStore.getProjection(name)
  }

  /**
   * Get query execution history
   */
  getHistory(limit = 100) {
    return this.queryHistory.slice(-limit)
  }

  /**
   * Get query statistics
   */
  getStatistics() {
    const typeStats = this.queryHistory.reduce((stats, entry) => {
      const type = entry.query.type
      if (!stats[type]) {
        stats[type] = { total: 0, success: 0, failed: 0, avgExecutionTime: 0 }
      }
      stats[type].total++
      if (entry.success) {
        stats[type].success++
        stats[type].avgExecutionTime = (stats[type].avgExecutionTime + (entry.executionTime || 0)) / stats[type].success
      } else {
        stats[type].failed++
      }
      return stats
    }, {})

    return {
      totalQueries: this.queryHistory.length,
      registeredHandlers: this.handlers.size,
      activeReadModels: this.readModels.size,
      typeStatistics: typeStats
    }
  }

  /**
   * Reset query bus (for testing)
   */
  reset() {
    this.queryHistory = []
    this.readModels.clear()
  }
}

// Global query bus instance
export const queryBus = new QueryBus()

// Convenience functions for creating queries
export const createBalanceQuery = (userId, metadata) => 
  new Query(QUERY_TYPES.GET_BALANCE, { userId }, metadata)

export const createTransactionHistoryQuery = (userId, options = {}, metadata) => 
  new Query(QUERY_TYPES.GET_TRANSACTION_HISTORY, { userId, ...options }, metadata)

export const createActiveStrategiesQuery = (userId, metadata) => 
  new Query(QUERY_TYPES.GET_ACTIVE_STRATEGIES, { userId }, metadata)

export const createMarketDataQuery = (assets = [], metadata) => 
  new Query(QUERY_TYPES.GET_MARKET_DATA, { assets }, metadata)

export const createPortfolioSummaryQuery = (userId, metadata) => 
  new Query(QUERY_TYPES.GET_PORTFOLIO_SUMMARY, { userId }, metadata)