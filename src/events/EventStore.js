/**
 * Event Store Implementation for diBoaS Platform
 * Implements Event Sourcing with CQRS pattern for financial operations
 */

import { securityManager, SECURITY_EVENT_TYPES } from '../security/SecurityManager.js'
import logger from '../utils/logger'

/**
 * Event types for the financial domain
 */
export const EVENT_TYPES = {
  // Balance Events
  BALANCE_UPDATED: 'balance_updated',
  BALANCE_CREDITED: 'balance_credited',
  BALANCE_DEBITED: 'balance_debited',
  
  // Transaction Events
  TRANSACTION_CREATED: 'transaction_created',
  TRANSACTION_PROCESSING: 'transaction_processing',
  TRANSACTION_CONFIRMED: 'transaction_confirmed',
  TRANSACTION_COMPLETED: 'transaction_completed',
  TRANSACTION_FAILED: 'transaction_failed',
  TRANSACTION_CANCELLED: 'transaction_cancelled',
  
  // Strategy Events
  STRATEGY_CREATED: 'strategy_created',
  STRATEGY_UPDATED: 'strategy_updated',
  STRATEGY_ACTIVATED: 'strategy_activated',
  STRATEGY_PAUSED: 'strategy_paused',
  STRATEGY_COMPLETED: 'strategy_completed',
  STRATEGY_CANCELLED: 'strategy_cancelled',
  
  // Market Data Events
  MARKET_DATA_UPDATED: 'market_data_updated',
  PRICE_ALERT_TRIGGERED: 'price_alert_triggered',
  
  // User Events
  USER_LOGGED_IN: 'user_logged_in',
  USER_LOGGED_OUT: 'user_logged_out',
  USER_PREFERENCES_UPDATED: 'user_preferences_updated',
  
  // System Events
  SYSTEM_BACKUP_CREATED: 'system_backup_created',
  SYSTEM_RESTORED: 'system_restored',
  AUDIT_LOG_CREATED: 'audit_log_created'
}

/**
 * Event Store for managing domain events
 */
export class EventStore {
  constructor() {
    this.events = new Map() // aggregateId -> events[]
    this.eventLog = [] // Chronological event log
    this.snapshots = new Map() // aggregateId -> snapshot
    this.subscriptions = new Map() // eventType -> subscribers[]
    this.projections = new Map() // projectionName -> projection
    this.currentVersion = 0
    
    this.initializeEventStore()
  }

  /**
   * Initialize the event store
   */
  initializeEventStore() {
    // Load snapshots and events from persistent storage (simulated)
    this.loadFromStorage()
    
    // Log initialization
    securityManager.logSecurityEvent(SECURITY_EVENT_TYPES.FINANCIAL_OPERATION, {
      action: 'event_store_initialized',
      totalEvents: this.eventLog.length,
      aggregates: this.events.size
    })
  }

  /**
   * Append event to the store
   */
  async appendEvent(aggregateId, eventType, eventData, expectedVersion = null) {
    // Security validation
    if (!this.validateEvent(aggregateId, eventType, eventData)) {
      throw new Error('Invalid event data')
    }

    // Check version for optimistic concurrency control
    const currentEvents = this.events.get(aggregateId) || []
    const currentVersion = currentEvents.length
    
    if (expectedVersion !== null && expectedVersion !== currentVersion) {
      throw new Error(`Concurrency conflict. Expected version ${expectedVersion}, got ${currentVersion}`)
    }

    // Create event
    const event = {
      id: this.generateEventId(),
      aggregateId,
      eventType,
      eventData,
      version: currentVersion + 1,
      timestamp: Date.now(),
      metadata: {
        userId: eventData.userId || 'system',
        correlationId: eventData.correlationId || this.generateCorrelationId(),
        causationId: eventData.causationId || null
      }
    }

    // Store event
    if (!this.events.has(aggregateId)) {
      this.events.set(aggregateId, [])
    }
    this.events.get(aggregateId).push(event)
    this.eventLog.push(event)
    this.currentVersion++

    // Log security event for financial operations
    if (this.isFinancialEvent(eventType)) {
      securityManager.logSecurityEvent(SECURITY_EVENT_TYPES.FINANCIAL_OPERATION, {
        eventType,
        aggregateId,
        amount: eventData.amount,
        asset: eventData.asset,
        userId: event.metadata.userId
      })
    }

    // Notify subscribers
    await this.notifySubscribers(event)

    // Update projections
    await this.updateProjections(event)

    return event
  }

  /**
   * Get events for an aggregate
   */
  getEvents(aggregateId, fromVersion = 0) {
    const events = this.events.get(aggregateId) || []
    return events.filter(event => event.version > fromVersion)
  }

  /**
   * Get all events of a specific type
   */
  getEventsByType(eventType, limit = null) {
    let events = this.eventLog.filter(event => event.eventType === eventType)
    if (limit) {
      events = events.slice(-limit) // Get latest events
    }
    return events
  }

  /**
   * Get events by time range
   */
  getEventsByTimeRange(startTime, endTime) {
    return this.eventLog.filter(event => 
      event.timestamp >= startTime && event.timestamp <= endTime
    )
  }

  /**
   * Rebuild aggregate state from events
   */
  rebuildAggregate(aggregateId, aggregateType) {
    const events = this.getEvents(aggregateId)
    
    // Check for snapshot first
    const snapshot = this.snapshots.get(aggregateId)
    let state = snapshot ? snapshot.state : this.getInitialState(aggregateType)
    let fromVersion = snapshot ? snapshot.version : 0

    // Apply events from snapshot version
    const eventsToApply = events.filter(event => event.version > fromVersion)
    
    for (const event of eventsToApply) {
      state = this.applyEvent(state, event)
    }

    return state
  }

  /**
   * Create snapshot for aggregate
   */
  createSnapshot(aggregateId, state) {
    const events = this.events.get(aggregateId) || []
    const snapshot = {
      aggregateId,
      state,
      version: events.length,
      timestamp: Date.now()
    }
    
    this.snapshots.set(aggregateId, snapshot)
    
    securityManager.logSecurityEvent(SECURITY_EVENT_TYPES.FINANCIAL_OPERATION, {
      action: 'snapshot_created',
      aggregateId,
      version: snapshot.version
    })
    
    return snapshot
  }

  /**
   * Subscribe to events
   */
  subscribe(eventType, handler) {
    if (!this.subscriptions.has(eventType)) {
      this.subscriptions.set(eventType, [])
    }
    
    this.subscriptions.get(eventType).push(handler)
    
    // Return unsubscribe function
    return () => {
      const handlers = this.subscriptions.get(eventType) || []
      const index = handlers.indexOf(handler)
      if (index > -1) {
        handlers.splice(index, 1)
      }
    }
  }

  /**
   * Notify event subscribers
   */
  async notifySubscribers(event) {
    const handlers = this.subscriptions.get(event.eventType) || []
    
    // Also notify wildcard subscribers
    const wildcardHandlers = this.subscriptions.get('*') || []
    
    const allHandlers = [...handlers, ...wildcardHandlers]
    
    for (const handler of allHandlers) {
      try {
        await handler(event)
      } catch (error) {
        securityManager.logSecurityEvent(SECURITY_EVENT_TYPES.SECURITY_VIOLATION, {
          action: 'event_handler_failed',
          eventType: event.eventType,
          error: error.message,
          severity: 'medium'
        })
      }
    }
  }

  /**
   * Register projection
   */
  registerProjection(name, projection) {
    this.projections.set(name, projection)
    
    // Initialize projection with existing events
    for (const event of this.eventLog) {
      if (projection.handles(event.eventType)) {
        try {
          projection.handle(event)
        } catch (error) {
          logger.error(`Failed to initialize projection ${name}:`, error)
        }
      }
    }
  }

  /**
   * Update projections with new event
   */
  async updateProjections(event) {
    for (const [name, projection] of this.projections.entries()) {
      if (projection.handles(event.eventType)) {
        try {
          await projection.handle(event)
        } catch (error) {
          securityManager.logSecurityEvent(SECURITY_EVENT_TYPES.SECURITY_VIOLATION, {
            action: 'projection_update_failed',
            projectionName: name,
            eventType: event.eventType,
            error: error.message,
            severity: 'medium'
          })
        }
      }
    }
  }

  /**
   * Get projection state
   */
  getProjection(name) {
    const projection = this.projections.get(name)
    return projection ? projection.getState() : null
  }

  /**
   * Validate event before storing
   */
  validateEvent(aggregateId, eventType, eventData) {
    // Basic validation
    if (!aggregateId || !eventType) {
      return false
    }

    // Financial event validation
    if (this.isFinancialEvent(eventType)) {
      // Amount validation
      if (eventData.amount !== undefined) {
        if (typeof eventData.amount !== 'number' || eventData.amount < 0) {
          return false
        }
      }

      // Asset validation
      if (eventData.asset !== undefined) {
        const validAssets = ['USD', 'BTC', 'ETH', 'SOL', 'SUI', 'USDC']
        if (!validAssets.includes(eventData.asset)) {
          return false
        }
      }
    }

    return true
  }

  /**
   * Check if event is financial
   */
  isFinancialEvent(eventType) {
    const financialEvents = [
      EVENT_TYPES.BALANCE_UPDATED,
      EVENT_TYPES.BALANCE_CREDITED,
      EVENT_TYPES.BALANCE_DEBITED,
      EVENT_TYPES.TRANSACTION_CREATED,
      EVENT_TYPES.TRANSACTION_COMPLETED,
      EVENT_TYPES.STRATEGY_CREATED,
      EVENT_TYPES.STRATEGY_ACTIVATED
    ]
    return financialEvents.includes(eventType)
  }

  /**
   * Apply event to state
   */
  applyEvent(state, event) {
    const { eventType, eventData } = event
    
    switch (eventType) {
      case EVENT_TYPES.BALANCE_UPDATED:
        return {
          ...state,
          balance: {
            ...state.balance,
            ...eventData.balance
          },
          lastUpdated: event.timestamp
        }
        
      case EVENT_TYPES.TRANSACTION_CREATED:
        return {
          ...state,
          transactions: [
            ...(state.transactions || []),
            {
              id: eventData.transactionId,
              ...eventData,
              status: 'created',
              createdAt: event.timestamp
            }
          ]
        }
        
      case EVENT_TYPES.TRANSACTION_COMPLETED:
        return {
          ...state,
          transactions: state.transactions?.map(tx =>
            tx.id === eventData.transactionId
              ? { ...tx, status: 'completed', completedAt: event.timestamp }
              : tx
          ) || []
        }
        
      case EVENT_TYPES.STRATEGY_CREATED:
        return {
          ...state,
          strategies: {
            ...state.strategies,
            [eventData.strategyId]: {
              ...eventData,
              status: 'created',
              createdAt: event.timestamp
            }
          }
        }
        
      default:
        return state
    }
  }

  /**
   * Get initial state for aggregate type
   */
  getInitialState(aggregateType) {
    switch (aggregateType) {
      case 'account':
        return {
          balance: {
            totalUSD: 0,
            availableForSpending: 0,
            investedAmount: 0,
            strategyBalance: 0
          },
          transactions: [],
          strategies: {}
        }
        
      case 'market':
        return {
          prices: {},
          lastUpdated: null
        }
        
      default:
        return {}
    }
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Generate correlation ID for event tracing
   */
  generateCorrelationId() {
    return `corr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Load events from storage (simulated)
   */
  loadFromStorage() {
    // In production, this would load from database
    // For now, we start with empty store
  }

  /**
   * Save events to storage (simulated)
   */
  saveToStorage() {
    // In production, this would persist to database
    securityManager.logSecurityEvent(SECURITY_EVENT_TYPES.FINANCIAL_OPERATION, {
      action: 'event_store_saved',
      totalEvents: this.eventLog.length,
      currentVersion: this.currentVersion
    })
  }

  /**
   * Get event store statistics
   */
  getStatistics() {
    const eventTypeStats = this.eventLog.reduce((stats, event) => {
      stats[event.eventType] = (stats[event.eventType] || 0) + 1
      return stats
    }, {})

    return {
      totalEvents: this.eventLog.length,
      totalAggregates: this.events.size,
      totalSnapshots: this.snapshots.size,
      totalSubscriptions: this.subscriptions.size,
      totalProjections: this.projections.size,
      currentVersion: this.currentVersion,
      eventTypeStats,
      oldestEvent: this.eventLog[0]?.timestamp || null,
      newestEvent: this.eventLog[this.eventLog.length - 1]?.timestamp || null
    }
  }

  /**
   * Reset event store (for testing)
   */
  reset() {
    this.events.clear()
    this.eventLog = []
    this.snapshots.clear()
    this.subscriptions.clear()
    this.projections.clear()
    this.currentVersion = 0
  }
}

// Global event store instance
export const eventStore = new EventStore()