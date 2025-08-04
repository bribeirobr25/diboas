import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { 
  QueryBus, 
  Query, 
  QueryHandler,
  GetBalanceHandler,
  GetTransactionHistoryHandler,
  GetActiveStrategiesHandler,
  GetMarketDataHandler,
  GetPortfolioSummaryHandler,
  QUERY_TYPES
} from '../QueryBus.js'
import { eventStore } from '../../events/EventStore.js'

// Mock event store
vi.mock('../../events/EventStore.js', () => ({
  eventStore: {
    rebuildAggregate: vi.fn(),
    eventLog: [],
    getEventsByType: vi.fn().mockReturnValue([]),
    registerProjection: vi.fn(),
    getProjection: vi.fn()
  }
}))

// Mock security manager
vi.mock('../../security/SecurityManager.js', () => ({
  securityManager: {
    logSecurityEvent: vi.fn()
  },
  SECURITY_EVENT_TYPES: {
    FINANCIAL_OPERATION: 'financial_operation',
    SECURITY_VIOLATION: 'security_violation'
  }
}))

describe('QueryBus', () => {
  let queryBus

  beforeEach(() => {
    vi.useFakeTimers()
    queryBus = new QueryBus()
    vi.clearAllMocks()
  })

  afterEach(() => {
    queryBus.reset()
    vi.useRealTimers()
  })

  describe('Query Class', () => {
    it('should create queries with correct structure', () => {
      const query = new Query(QUERY_TYPES.GET_BALANCE, { userId: 'user123' }, { userId: 'user123' })

      expect(query.id).toMatch(/^qry_/)
      expect(query.type).toBe(QUERY_TYPES.GET_BALANCE)
      expect(query.parameters.userId).toBe('user123')
      expect(query.metadata.userId).toBe('user123')
      expect(query.metadata.timestamp).toBeTypeOf('number')
      expect(query.metadata.correlationId).toMatch(/^corr_/)
    })

    it('should generate unique IDs and correlation IDs', () => {
      const query1 = new Query(QUERY_TYPES.GET_BALANCE, { userId: 'user123' })
      const query2 = new Query(QUERY_TYPES.GET_BALANCE, { userId: 'user123' })

      expect(query1.id).not.toBe(query2.id)
      expect(query1.metadata.correlationId).not.toBe(query2.metadata.correlationId)
    })
  })

  describe('QueryBus Initialization', () => {
    it('should initialize with default handlers', () => {
      expect(queryBus.handlers.size).toBe(5)
      expect(queryBus.handlers.has(QUERY_TYPES.GET_BALANCE)).toBe(true)
      expect(queryBus.handlers.has(QUERY_TYPES.GET_TRANSACTION_HISTORY)).toBe(true)
      expect(queryBus.handlers.has(QUERY_TYPES.GET_ACTIVE_STRATEGIES)).toBe(true)
      expect(queryBus.handlers.has(QUERY_TYPES.GET_MARKET_DATA)).toBe(true)
      expect(queryBus.handlers.has(QUERY_TYPES.GET_PORTFOLIO_SUMMARY)).toBe(true)
    })

    it('should have empty history and read models initially', () => {
      expect(queryBus.queryHistory).toHaveLength(0)
      expect(queryBus.readModels.size).toBe(0)
    })
  })

  describe('Handler Registration', () => {
    it('should register custom handlers', () => {
      class CustomHandler extends QueryHandler {
        constructor() {
          super('custom_query')
        }
        validate() { return true }
        async execute() { return { success: true, data: {} } }
      }

      const customHandler = new CustomHandler()
      queryBus.register(customHandler)

      expect(queryBus.handlers.has('custom_query')).toBe(true)
      expect(queryBus.handlers.get('custom_query')).toBe(customHandler)
    })
  })

  describe('GetBalanceHandler', () => {
    let handler

    beforeEach(() => {
      handler = new GetBalanceHandler()
    })

    it('should validate balance queries correctly', () => {
      const validQuery = new Query(QUERY_TYPES.GET_BALANCE, { userId: 'user123' })
      expect(() => handler.validate(validQuery)).not.toThrow()
    })

    it('should reject queries without userId', () => {
      const invalidQuery = new Query(QUERY_TYPES.GET_BALANCE, {})
      expect(() => handler.validate(invalidQuery)).toThrow('UserId is required for balance query')
    })

    it('should execute balance query successfully', async () => {
      eventStore.rebuildAggregate.mockReturnValue({
        balance: {
          totalUSD: 1000,
          availableForSpending: 800,
          investedAmount: 200,
          strategyBalance: 100
        },
        lastUpdated: Date.now()
      })

      const query = new Query(QUERY_TYPES.GET_BALANCE, { userId: 'user123' })
      const result = await handler.execute(query)

      expect(result.success).toBe(true)
      expect(result.data.totalUSD).toBe(1000)
      expect(result.data.availableForSpending).toBe(800)
      expect(result.lastUpdated).toBeTypeOf('number')
    })

    it('should handle empty balance gracefully', async () => {
      eventStore.rebuildAggregate.mockReturnValue({})

      const query = new Query(QUERY_TYPES.GET_BALANCE, { userId: 'user123' })
      const result = await handler.execute(query)

      expect(result.success).toBe(true)
      expect(result.data.totalUSD).toBe(0)
      expect(result.data.availableForSpending).toBe(0)
    })
  })

  describe('GetTransactionHistoryHandler', () => {
    let handler

    beforeEach(() => {
      handler = new GetTransactionHistoryHandler()
    })

    it('should validate transaction history queries', () => {
      const validQuery = new Query(QUERY_TYPES.GET_TRANSACTION_HISTORY, { userId: 'user123' })
      expect(() => handler.validate(validQuery)).not.toThrow()
    })

    it('should reject queries without userId', () => {
      const invalidQuery = new Query(QUERY_TYPES.GET_TRANSACTION_HISTORY, {})
      expect(() => handler.validate(invalidQuery)).toThrow('UserId is required for transaction history query')
    })

    it('should execute transaction history query successfully', async () => {
      const mockEvents = [
        {
          id: 'evt1',
          eventType: 'TRANSACTION_CREATED',
          eventData: { amount: 100, asset: 'BTC' },
          metadata: { userId: 'user123' },
          timestamp: Date.now()
        },
        {
          id: 'evt2',
          eventType: 'BALANCE_CREDITED',
          eventData: { amount: 50, asset: 'USD' },
          metadata: { userId: 'user123' },
          timestamp: Date.now()
        }
      ]

      // Set up the eventLog properly
      Object.defineProperty(eventStore, 'eventLog', {
        get: () => mockEvents,
        configurable: true
      })

      const query = new Query(QUERY_TYPES.GET_TRANSACTION_HISTORY, { userId: 'user123', limit: 10 })
      const result = await handler.execute(query)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.hasMore).toBe(false)
    })

    it('should handle pagination correctly', async () => {
      const mockEvents = Array.from({ length: 20 }, (_, i) => ({
        id: `evt${i}`,
        eventType: 'TRANSACTION_CREATED',
        eventData: { amount: 100 + i },
        metadata: { userId: 'user123' },
        timestamp: Date.now() + i
      }))

      // Set up the eventLog properly
      Object.defineProperty(eventStore, 'eventLog', {
        get: () => mockEvents,
        configurable: true
      })

      const query = new Query(QUERY_TYPES.GET_TRANSACTION_HISTORY, { 
        userId: 'user123', 
        limit: 5, 
        offset: 0 
      })
      const result = await handler.execute(query)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(5)
      expect(result.total).toBe(20)
      expect(result.hasMore).toBe(true)
    })
  })

  describe('GetActiveStrategiesHandler', () => {
    let handler

    beforeEach(() => {
      handler = new GetActiveStrategiesHandler()
    })

    it('should execute active strategies query successfully', async () => {
      eventStore.rebuildAggregate.mockReturnValue({
        strategies: {
          strategy1: { id: 'strategy1', status: 'active', name: 'Conservative Growth' },
          strategy2: { id: 'strategy2', status: 'paused', name: 'Aggressive Growth' },
          strategy3: { id: 'strategy3', status: 'created', name: 'Balanced Portfolio' }
        }
      })

      const query = new Query(QUERY_TYPES.GET_ACTIVE_STRATEGIES, { userId: 'user123' })
      const result = await handler.execute(query)

      expect(result.success).toBe(true)
      expect(result.data).toHaveLength(2) // Only active and created strategies
      expect(result.count).toBe(2)
      expect(result.data.some(s => s.status === 'active')).toBe(true)
      expect(result.data.some(s => s.status === 'created')).toBe(true)
      expect(result.data.some(s => s.status === 'paused')).toBe(false)
    })
  })

  describe('GetMarketDataHandler', () => {
    let handler

    beforeEach(() => {
      handler = new GetMarketDataHandler()
    })

    it('should execute market data query successfully', async () => {
      const query = new Query(QUERY_TYPES.GET_MARKET_DATA, {})
      const result = await handler.execute(query)

      expect(result.success).toBe(true)
      expect(result.data).toBeDefined()
      expect(result.data.BTC).toBeDefined()
      expect(result.data.ETH).toBeDefined()
      expect(result.data.SOL).toBeDefined()
      expect(result.timestamp).toBeTypeOf('number')
    })

    it('should filter market data by requested assets', async () => {
      const query = new Query(QUERY_TYPES.GET_MARKET_DATA, { assets: ['BTC', 'ETH'] })
      const result = await handler.execute(query)

      expect(result.success).toBe(true)
      expect(Object.keys(result.data)).toEqual(['BTC', 'ETH'])
      expect(result.data.SOL).toBeUndefined()
    })
  })

  describe('GetPortfolioSummaryHandler', () => {
    let handler

    beforeEach(() => {
      handler = new GetPortfolioSummaryHandler()
    })

    it('should execute portfolio summary query successfully', async () => {
      eventStore.rebuildAggregate.mockReturnValue({
        balance: {
          totalUSD: 10000,
          investedAmount: 7000,
          availableForSpending: 3000
        },
        strategies: {
          strategy1: { id: 'strategy1' },
          strategy2: { id: 'strategy2' }
        },
        transactions: [
          { id: 'tx1' },
          { id: 'tx2' },
          { id: 'tx3' }
        ]
      })

      const query = new Query(QUERY_TYPES.GET_PORTFOLIO_SUMMARY, { userId: 'user123' })
      const result = await handler.execute(query)

      expect(result.success).toBe(true)
      expect(result.data.totalValue).toBe(10000)
      expect(result.data.investedAmount).toBe(7000)
      expect(result.data.availableAmount).toBe(3000)
      expect(result.data.strategyCount).toBe(2)
      expect(result.data.transactionCount).toBe(3)
      expect(result.data.performance).toBeDefined()
      expect(result.data.performance.totalReturn).toBeTypeOf('number')
      expect(result.data.performance.totalReturnPercent).toBeTypeOf('number')
    })
  })

  describe('Query Execution', () => {
    it('should execute queries successfully', async () => {
      eventStore.rebuildAggregate.mockReturnValue({
        balance: { totalUSD: 1000 }
      })

      const query = new Query(QUERY_TYPES.GET_BALANCE, { userId: 'user123' })
      const result = await queryBus.execute(query)

      expect(result.success).toBe(true)
      expect(queryBus.queryHistory).toHaveLength(1)
      expect(queryBus.queryHistory[0].success).toBe(true)
    })

    it('should handle unknown query types', async () => {
      const unknownQuery = new Query('unknown_query', { userId: 'user123' })

      await expect(queryBus.execute(unknownQuery))
        .rejects.toThrow('No handler registered for query type: unknown_query')
    })

    it('should handle validation errors', async () => {
      const invalidQuery = new Query(QUERY_TYPES.GET_BALANCE, {}) // Missing userId

      await expect(queryBus.execute(invalidQuery))
        .rejects.toThrow('UserId is required for balance query')

      expect(queryBus.queryHistory).toHaveLength(1)
      expect(queryBus.queryHistory[0].success).toBe(false)
    })

    it('should track execution time', async () => {
      eventStore.rebuildAggregate.mockReturnValue({
        balance: { totalUSD: 1000 }
      })

      const query = new Query(QUERY_TYPES.GET_BALANCE, { userId: 'user123' })
      
      // Advance time slightly before execution
      vi.advanceTimersByTime(10)
      
      await queryBus.execute(query)

      expect(queryBus.queryHistory[0].executionTime).toBeTypeOf('number')
      expect(queryBus.queryHistory[0].executionTime).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Read Models', () => {
    it('should create and manage read models', () => {
      const projection = {
        state: { count: 0 },
        handles: (eventType) => eventType === 'test_event',
        handle: function(event) { this.state.count++ },
        getState: function() { return this.state }
      }

      queryBus.createReadModel('test_projection', projection)

      expect(queryBus.readModels.size).toBe(1)
      expect(queryBus.readModels.has('test_projection')).toBe(true)
      expect(eventStore.registerProjection).toHaveBeenCalledWith('test_projection', projection)
    })

    it('should retrieve read model state', () => {
      const mockState = { count: 5 }
      eventStore.getProjection.mockReturnValue(mockState)

      const state = queryBus.getReadModel('test_projection')

      expect(state).toBe(mockState)
      expect(eventStore.getProjection).toHaveBeenCalledWith('test_projection')
    })
  })

  describe('Query History and Statistics', () => {
    it('should track query execution history', async () => {
      eventStore.rebuildAggregate.mockReturnValue({ balance: { totalUSD: 1000 } })

      const query1 = new Query(QUERY_TYPES.GET_BALANCE, { userId: 'user123' })
      const query2 = new Query(QUERY_TYPES.GET_MARKET_DATA, {})

      await queryBus.execute(query1)
      await queryBus.execute(query2)

      const history = queryBus.getHistory()
      expect(history).toHaveLength(2)
      expect(history[0].query.type).toBe(QUERY_TYPES.GET_BALANCE)
      expect(history[1].query.type).toBe(QUERY_TYPES.GET_MARKET_DATA)
    })

    it('should provide comprehensive statistics', async () => {
      eventStore.rebuildAggregate.mockReturnValue({ balance: { totalUSD: 1000 } })

      // Execute some queries
      await queryBus.execute(new Query(QUERY_TYPES.GET_BALANCE, { userId: 'user123' }))
      await queryBus.execute(new Query(QUERY_TYPES.GET_BALANCE, { userId: 'user456' }))
      await queryBus.execute(new Query(QUERY_TYPES.GET_MARKET_DATA, {}))

      // Try to execute an invalid query
      try {
        await queryBus.execute(new Query(QUERY_TYPES.GET_BALANCE, {}))
      } catch (error) {
        // Expected to fail
      }

      const stats = queryBus.getStatistics()

      expect(stats.totalQueries).toBe(4)
      expect(stats.registeredHandlers).toBe(5)
      expect(stats.activeReadModels).toBe(0)
      expect(stats.typeStatistics[QUERY_TYPES.GET_BALANCE].total).toBe(3)
      expect(stats.typeStatistics[QUERY_TYPES.GET_BALANCE].success).toBe(2)
      expect(stats.typeStatistics[QUERY_TYPES.GET_BALANCE].failed).toBe(1)
      expect(stats.typeStatistics[QUERY_TYPES.GET_MARKET_DATA].total).toBe(1)
      expect(stats.typeStatistics[QUERY_TYPES.GET_MARKET_DATA].success).toBe(1)
    })

    it('should calculate average execution times', async () => {
      eventStore.rebuildAggregate.mockReturnValue({ balance: { totalUSD: 1000 } })

      // Advance time before each execution
      vi.advanceTimersByTime(5)
      await queryBus.execute(new Query(QUERY_TYPES.GET_BALANCE, { userId: 'user123' }))
      
      vi.advanceTimersByTime(5)
      await queryBus.execute(new Query(QUERY_TYPES.GET_BALANCE, { userId: 'user456' }))

      const stats = queryBus.getStatistics()

      expect(stats.typeStatistics[QUERY_TYPES.GET_BALANCE].avgExecutionTime).toBeTypeOf('number')
      expect(stats.typeStatistics[QUERY_TYPES.GET_BALANCE].avgExecutionTime).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Reset and Cleanup', () => {
    it('should reset query bus state', async () => {
      eventStore.rebuildAggregate.mockReturnValue({ balance: { totalUSD: 1000 } })

      await queryBus.execute(new Query(QUERY_TYPES.GET_BALANCE, { userId: 'user123' }))
      queryBus.createReadModel('test', {})

      expect(queryBus.queryHistory.length).toBeGreaterThan(0)
      expect(queryBus.readModels.size).toBeGreaterThan(0)

      queryBus.reset()

      expect(queryBus.queryHistory).toHaveLength(0)
      expect(queryBus.readModels.size).toBe(0)
    })
  })

  describe('Error Handling', () => {
    it('should handle handler execution errors gracefully', async () => {
      // Create a handler that throws an error
      class FailingHandler extends QueryHandler {
        constructor() {
          super('failing_query')
        }
        validate() { return true }
        async execute() {
          throw new Error('Handler execution failed')
        }
      }

      queryBus.register(new FailingHandler())

      const query = new Query('failing_query', { userId: 'user123' })

      await expect(queryBus.execute(query))
        .rejects.toThrow('Handler execution failed')

      // Should still track the failed query
      expect(queryBus.queryHistory).toHaveLength(1)
      expect(queryBus.queryHistory[0].success).toBe(false)
      expect(queryBus.queryHistory[0].error).toBe('Handler execution failed')
    })
  })
})