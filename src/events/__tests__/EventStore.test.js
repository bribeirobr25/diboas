import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { EventStore, EVENT_TYPES } from '../EventStore.js'

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

describe('EventStore', () => {
  let eventStore

  beforeEach(() => {
    eventStore = new EventStore()
  })

  afterEach(() => {
    eventStore.reset()
  })

  describe('Initialization', () => {
    it('should initialize with correct default values', () => {
      expect(eventStore.events.size).toBe(0)
      expect(eventStore.eventLog).toHaveLength(0)
      expect(eventStore.snapshots.size).toBe(0)
      expect(eventStore.subscriptions.size).toBe(0)
      expect(eventStore.projections.size).toBe(0)
      expect(eventStore.currentVersion).toBe(0)
    })
  })

  describe('Event Appending', () => {
    it('should append events correctly', async () => {
      const event = await eventStore.appendEvent(
        'user123',
        EVENT_TYPES.BALANCE_UPDATED,
        {
          balance: { totalUSD: 1000 },
          userId: 'user123'
        }
      )

      expect(event.id).toMatch(/^evt_/)
      expect(event.aggregateId).toBe('user123')
      expect(event.eventType).toBe(EVENT_TYPES.BALANCE_UPDATED)
      expect(event.version).toBe(1)
      expect(event.timestamp).toBeTypeOf('number')
      expect(event.metadata.userId).toBe('user123')
    })

    it('should handle optimistic concurrency control', async () => {
      // Add first event
      await eventStore.appendEvent('user123', EVENT_TYPES.BALANCE_UPDATED, { balance: { totalUSD: 1000 } })

      // This should succeed (correct expected version)
      await expect(
        eventStore.appendEvent('user123', EVENT_TYPES.BALANCE_UPDATED, { balance: { totalUSD: 1500 } }, 1)
      ).resolves.toBeDefined()

      // This should fail (incorrect expected version)
      await expect(
        eventStore.appendEvent('user123', EVENT_TYPES.BALANCE_UPDATED, { balance: { totalUSD: 2000 } }, 1)
      ).rejects.toThrow('Concurrency conflict')
    })

    it('should validate events before storing', async () => {
      // Valid event
      await expect(
        eventStore.appendEvent('user123', EVENT_TYPES.BALANCE_UPDATED, {
          balance: { totalUSD: 1000 },
          userId: 'user123'
        })
      ).resolves.toBeDefined()

      // Invalid event - missing aggregateId
      await expect(
        eventStore.appendEvent('', EVENT_TYPES.BALANCE_UPDATED, { balance: { totalUSD: 1000 } })
      ).rejects.toThrow('Invalid event data')

      // Invalid financial event - negative amount
      await expect(
        eventStore.appendEvent('user123', EVENT_TYPES.TRANSACTION_CREATED, {
          amount: -100,
          asset: 'USD'
        })
      ).rejects.toThrow('Invalid event data')
    })

    it('should increment version correctly', async () => {
      await eventStore.appendEvent('user123', EVENT_TYPES.BALANCE_UPDATED, { balance: { totalUSD: 1000 } })
      await eventStore.appendEvent('user123', EVENT_TYPES.BALANCE_UPDATED, { balance: { totalUSD: 1500 } })
      await eventStore.appendEvent('user123', EVENT_TYPES.TRANSACTION_CREATED, { amount: 100 })

      const events = eventStore.getEvents('user123')
      expect(events).toHaveLength(3)
      expect(events[0].version).toBe(1)
      expect(events[1].version).toBe(2)
      expect(events[2].version).toBe(3)
    })
  })

  describe('Event Retrieval', () => {
    beforeEach(async () => {
      // Setup test events
      await eventStore.appendEvent('user123', EVENT_TYPES.BALANCE_UPDATED, { balance: { totalUSD: 1000 } })
      await eventStore.appendEvent('user123', EVENT_TYPES.TRANSACTION_CREATED, { transactionId: 'tx1', amount: 100 })
      await eventStore.appendEvent('user456', EVENT_TYPES.BALANCE_UPDATED, { balance: { totalUSD: 500 } })
      await eventStore.appendEvent('user123', EVENT_TYPES.TRANSACTION_COMPLETED, { transactionId: 'tx1' })
    })

    it('should get events for specific aggregate', () => {
      const user123Events = eventStore.getEvents('user123')
      expect(user123Events).toHaveLength(3)
      expect(user123Events.every(event => event.aggregateId === 'user123')).toBe(true)

      const user456Events = eventStore.getEvents('user456')
      expect(user456Events).toHaveLength(1)
      expect(user456Events[0].aggregateId).toBe('user456')
    })

    it('should get events from specific version', () => {
      const eventsFromVersion2 = eventStore.getEvents('user123', 2)
      expect(eventsFromVersion2).toHaveLength(1)
      expect(eventsFromVersion2[0].version).toBe(3)
    })

    it('should get events by type', () => {
      const balanceEvents = eventStore.getEventsByType(EVENT_TYPES.BALANCE_UPDATED)
      expect(balanceEvents).toHaveLength(2)
      expect(balanceEvents.every(event => event.eventType === EVENT_TYPES.BALANCE_UPDATED)).toBe(true)

      const transactionEvents = eventStore.getEventsByType(EVENT_TYPES.TRANSACTION_CREATED, 1)
      expect(transactionEvents).toHaveLength(1)
    })

    it('should get events by time range', () => {
      const now = Date.now()
      const startTime = now - 1000
      const endTime = now + 1000

      const eventsInRange = eventStore.getEventsByTimeRange(startTime, endTime)
      expect(eventsInRange.length).toBeGreaterThan(0)
      expect(eventsInRange.every(event => 
        event.timestamp >= startTime && event.timestamp <= endTime
      )).toBe(true)
    })
  })

  describe('Aggregate Rebuilding', () => {
    it('should rebuild aggregate state from events', async () => {
      // Create events for an account aggregate
      await eventStore.appendEvent('account123', EVENT_TYPES.BALANCE_UPDATED, {
        balance: { totalUSD: 1000, availableForSpending: 800 }
      })
      await eventStore.appendEvent('account123', EVENT_TYPES.TRANSACTION_CREATED, {
        transactionId: 'tx1',
        amount: 100,
        type: 'buy'
      })
      await eventStore.appendEvent('account123', EVENT_TYPES.STRATEGY_CREATED, {
        strategyId: 'strategy1',
        strategyName: 'Conservative Growth',
        amount: 500
      })

      const state = eventStore.rebuildAggregate('account123', 'account')

      expect(state.balance.totalUSD).toBe(1000)
      expect(state.balance.availableForSpending).toBe(800)
      expect(state.transactions).toHaveLength(1)
      expect(state.transactions[0].id).toBe('tx1')
      expect(state.strategies.strategy1).toBeDefined()
      expect(state.strategies.strategy1.strategyName).toBe('Conservative Growth')
    })

    it('should use snapshots for rebuilding when available', async () => {
      // Create events
      await eventStore.appendEvent('account123', EVENT_TYPES.BALANCE_UPDATED, {
        balance: { totalUSD: 1000 }
      })

      // Create snapshot after first event
      const snapshotState = { balance: { totalUSD: 1000 }, transactions: [] }
      eventStore.createSnapshot('account123', snapshotState)

      // Add more events after snapshot
      await eventStore.appendEvent('account123', EVENT_TYPES.BALANCE_UPDATED, {
        balance: { totalUSD: 1500 }
      })
      await eventStore.appendEvent('account123', EVENT_TYPES.TRANSACTION_CREATED, {
        transactionId: 'tx1',
        amount: 100
      })

      const rebuiltState = eventStore.rebuildAggregate('account123', 'account')

      // Should have applied events after snapshot
      expect(rebuiltState.balance.totalUSD).toBe(1500)
      expect(rebuiltState.transactions).toHaveLength(1)
    })
  })

  describe('Snapshots', () => {
    it('should create snapshots correctly', async () => {
      await eventStore.appendEvent('account123', EVENT_TYPES.BALANCE_UPDATED, {
        balance: { totalUSD: 1000 }
      })

      const state = { balance: { totalUSD: 1000 }, transactions: [] }
      const snapshot = eventStore.createSnapshot('account123', state)

      expect(snapshot.aggregateId).toBe('account123')
      expect(snapshot.state).toEqual(state)
      expect(snapshot.version).toBe(1)
      expect(snapshot.timestamp).toBeTypeOf('number')
    })
  })

  describe('Event Subscriptions', () => {
    it('should subscribe and notify handlers', async () => {
      const handler = vi.fn()
      const unsubscribe = eventStore.subscribe(EVENT_TYPES.BALANCE_UPDATED, handler)

      await eventStore.appendEvent('user123', EVENT_TYPES.BALANCE_UPDATED, {
        balance: { totalUSD: 1000 }
      })

      expect(handler).toHaveBeenCalledOnce()
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          eventType: EVENT_TYPES.BALANCE_UPDATED
        })
      )

      // Test unsubscribe
      unsubscribe()
      await eventStore.appendEvent('user123', EVENT_TYPES.BALANCE_UPDATED, {
        balance: { totalUSD: 1500 }
      })

      expect(handler).toHaveBeenCalledOnce() // Should not be called again
    })

    it('should support wildcard subscriptions', async () => {
      const wildcardHandler = vi.fn()
      eventStore.subscribe('*', wildcardHandler)

      await eventStore.appendEvent('user123', EVENT_TYPES.BALANCE_UPDATED, { balance: { totalUSD: 1000 } })
      await eventStore.appendEvent('user123', EVENT_TYPES.TRANSACTION_CREATED, { amount: 100 })

      expect(wildcardHandler).toHaveBeenCalledTimes(2)
    })

    it('should handle errors in event handlers gracefully', async () => {
      const faultyHandler = vi.fn(() => {
        throw new Error('Handler error')
      })
      eventStore.subscribe(EVENT_TYPES.BALANCE_UPDATED, faultyHandler)

      // Should not throw despite handler error
      await expect(
        eventStore.appendEvent('user123', EVENT_TYPES.BALANCE_UPDATED, { balance: { totalUSD: 1000 } })
      ).resolves.toBeDefined()
    })
  })

  describe('Projections', () => {
    it('should register and update projections', async () => {
      const projection = {
        state: { totalBalance: 0, transactionCount: 0 },
        handles: (eventType) => [EVENT_TYPES.BALANCE_UPDATED, EVENT_TYPES.TRANSACTION_CREATED].includes(eventType),
        handle: function(event) {
          if (event.eventType === EVENT_TYPES.BALANCE_UPDATED) {
            this.state.totalBalance += event.eventData.balance?.totalUSD || 0
          } else if (event.eventType === EVENT_TYPES.TRANSACTION_CREATED) {
            this.state.transactionCount++
          }
        },
        getState: function() { return this.state }
      }

      eventStore.registerProjection('balance_summary', projection)

      await eventStore.appendEvent('user123', EVENT_TYPES.BALANCE_UPDATED, {
        balance: { totalUSD: 1000 }
      })
      await eventStore.appendEvent('user123', EVENT_TYPES.TRANSACTION_CREATED, {
        amount: 100
      })

      const projectionState = eventStore.getProjection('balance_summary')
      expect(projectionState.totalBalance).toBe(1000)
      expect(projectionState.transactionCount).toBe(1)
    })
  })

  describe('Event Store Statistics', () => {
    it('should provide comprehensive statistics', async () => {
      await eventStore.appendEvent('user123', EVENT_TYPES.BALANCE_UPDATED, { balance: { totalUSD: 1000 } })
      await eventStore.appendEvent('user123', EVENT_TYPES.TRANSACTION_CREATED, { amount: 100 })
      await eventStore.appendEvent('user456', EVENT_TYPES.BALANCE_UPDATED, { balance: { totalUSD: 500 } })

      const stats = eventStore.getStatistics()

      expect(stats.totalEvents).toBe(3)
      expect(stats.totalAggregates).toBe(2)
      expect(stats.eventTypeStats[EVENT_TYPES.BALANCE_UPDATED]).toBe(2)
      expect(stats.eventTypeStats[EVENT_TYPES.TRANSACTION_CREATED]).toBe(1)
      expect(stats.currentVersion).toBe(3)
      expect(stats.oldestEvent).toBeTypeOf('number')
      expect(stats.newestEvent).toBeTypeOf('number')
    })
  })

  describe('Financial Event Validation', () => {
    it('should validate financial events correctly', () => {
      expect(eventStore.isFinancialEvent(EVENT_TYPES.BALANCE_UPDATED)).toBe(true)
      expect(eventStore.isFinancialEvent(EVENT_TYPES.TRANSACTION_CREATED)).toBe(true)
      expect(eventStore.isFinancialEvent(EVENT_TYPES.STRATEGY_CREATED)).toBe(true)
      expect(eventStore.isFinancialEvent(EVENT_TYPES.USER_LOGGED_IN)).toBe(false)
    })

    it('should validate asset types in financial events', async () => {
      // Valid asset
      await expect(
        eventStore.appendEvent('user123', EVENT_TYPES.TRANSACTION_CREATED, {
          amount: 100,
          asset: 'BTC'
        })
      ).resolves.toBeDefined()

      // Invalid asset
      await expect(
        eventStore.appendEvent('user123', EVENT_TYPES.TRANSACTION_CREATED, {
          amount: 100,
          asset: 'INVALID_ASSET'
        })
      ).rejects.toThrow('Invalid event data')
    })
  })

  describe('Reset and Cleanup', () => {
    it('should reset all event store state', async () => {
      await eventStore.appendEvent('user123', EVENT_TYPES.BALANCE_UPDATED, { balance: { totalUSD: 1000 } })
      eventStore.createSnapshot('user123', { balance: { totalUSD: 1000 } })
      eventStore.subscribe(EVENT_TYPES.BALANCE_UPDATED, vi.fn())

      expect(eventStore.eventLog.length).toBeGreaterThan(0)
      expect(eventStore.events.size).toBeGreaterThan(0)
      expect(eventStore.snapshots.size).toBeGreaterThan(0)
      expect(eventStore.subscriptions.size).toBeGreaterThan(0)

      eventStore.reset()

      expect(eventStore.eventLog).toHaveLength(0)
      expect(eventStore.events.size).toBe(0)
      expect(eventStore.snapshots.size).toBe(0)
      expect(eventStore.subscriptions.size).toBe(0)
      expect(eventStore.projections.size).toBe(0)
      expect(eventStore.currentVersion).toBe(0)
    })
  })
})