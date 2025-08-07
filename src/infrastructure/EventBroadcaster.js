/**
 * Event Broadcaster
 * Orchestrates cross-domain event broadcasting and integration
 * Implements proper domain boundaries with event-driven communication
 */

import logger from '../utils/logger.js'
import { globalEventBus } from './EventBus.js'

export class EventBroadcaster {
  constructor(eventBus = globalEventBus) {
    this._eventBus = eventBus
    this._domainHandlers = new Map()
    this._integrationHandlers = []
    this._metrics = {
      eventsEmitted: 0,
      eventsProcessed: 0,
      errors: 0,
      lastActivity: null
    }
    
    this._setupCoreEventHandlers()
  }

  /**
   * Register domain-specific event handlers
   */
  registerDomainHandler(domain, eventType, handler, options = {}) {
    if (!this._domainHandlers.has(domain)) {
      this._domainHandlers.set(domain, new Map())
    }

    const domainHandlers = this._domainHandlers.get(domain)
    
    const unsubscribe = this._eventBus.subscribe(
      eventType, 
      async (event) => {
        try {
          this._metrics.eventsProcessed++
          this._metrics.lastActivity = new Date().toISOString()
          
          await handler(event)
          
          logger.debug(`Domain event processed: ${domain} -> ${eventType}`, {
            eventId: event.eventId,
            domain
          })
        } catch (error) {
          this._metrics.errors++
          logger.error(`Domain event handler failed: ${domain} -> ${eventType}`, {
            error: error.message,
            eventId: event.eventId,
            domain
          })
          throw error
        }
      },
      {
        priority: options.priority || 100,
        context: { domain, ...options.context }
      }
    )

    domainHandlers.set(eventType, {
      handler,
      unsubscribe,
      domain,
      eventType,
      registeredAt: new Date().toISOString()
    })

    logger.info(`Domain event handler registered: ${domain} -> ${eventType}`)
    
    return unsubscribe
  }

  /**
   * Register integration handlers for cross-system communication
   */
  registerIntegrationHandler(integrationName, eventPattern, handler, options = {}) {
    const subscription = {
      integrationName,
      eventPattern,
      handler,
      options,
      registeredAt: new Date().toISOString()
    }

    // Subscribe to wildcard events and filter by pattern
    const unsubscribe = this._eventBus.subscribeToAll(
      async (event) => {
        if (this._matchesPattern(event.eventType, eventPattern)) {
          try {
            this._metrics.eventsProcessed++
            this._metrics.lastActivity = new Date().toISOString()
            
            await handler(event, { integration: integrationName })
            
            logger.debug(`Integration event processed: ${integrationName} -> ${event.eventType}`)
          } catch (error) {
            this._metrics.errors++
            logger.error(`Integration event handler failed: ${integrationName}`, {
              error: error.message,
              eventId: event.eventId,
              eventType: event.eventType
            })
            
            if (!options.continueOnError) {
              throw error
            }
          }
        }
      },
      { priority: options.priority || 50 }
    )

    subscription.unsubscribe = unsubscribe
    this._integrationHandlers.push(subscription)

    logger.info(`Integration handler registered: ${integrationName} -> ${eventPattern}`)
    
    return unsubscribe
  }

  /**
   * Broadcast domain event
   */
  async broadcastDomainEvent(domain, event) {
    try {
      this._metrics.eventsEmitted++
      this._metrics.lastActivity = new Date().toISOString()
      
      // Add domain context to event
      const enrichedEvent = {
        ...event,
        data: {
          ...event.data,
          sourceDomain: domain,
          broadcastedAt: new Date().toISOString()
        }
      }

      const results = await this._eventBus.emit(enrichedEvent)
      
      logger.debug(`Domain event broadcasted: ${domain} -> ${event.eventType}`, {
        eventId: event.eventId,
        handlersExecuted: results.length
      })

      return {
        success: true,
        handlersExecuted: results.length,
        results
      }
    } catch (error) {
      this._metrics.errors++
      logger.error(`Failed to broadcast domain event: ${domain} -> ${event.eventType}`, {
        error: error.message,
        eventId: event.eventId
      })
      throw error
    }
  }

  /**
   * Setup core cross-domain event handlers
   */
  _setupCoreEventHandlers() {
    // Fee Domain Events -> Transaction Domain
    this.registerDomainHandler(
      'transaction',
      'FeeCalculated',
      async (event) => {
        // Transaction domain can react to fee calculations
        logger.debug('Transaction domain received fee calculation', {
          transactionType: event.data.transactionType,
          totalFees: event.data.totalFees
        })
      }
    )

    // Transaction Events -> Balance Domain
    this.registerDomainHandler(
      'balance',
      'TransactionCompleted',
      async (event) => {
        // Balance domain updates when transactions complete
        logger.debug('Balance domain received transaction completion', {
          transactionId: event.data.transactionId,
          accountId: event.data.accountId
        })
      }
    )

    // On-Ramp Events -> Compliance Domain
    this.registerDomainHandler(
      'compliance',
      'OnRampCompleted',
      async (event) => {
        // Compliance checks for large on-ramp transactions
        const amount = parseFloat(event.data.amountReceived || 0)
        if (amount > 10000) {
          logger.info('Large on-ramp transaction detected for compliance review', {
            userId: event.data.userId,
            amount,
            transactionId: event.eventId
          })
        }
      }
    )

    // KYC Events -> User Domain
    this.registerDomainHandler(
      'user',
      'KYCRequired',
      async (event) => {
        // User domain handles KYC requirements
        logger.debug('User domain received KYC requirement', {
          userId: event.data.userId,
          trigger: event.data.trigger
        })
      }
    )

    // Asset Trading Events -> Portfolio Domain
    this.registerDomainHandler(
      'portfolio',
      'AssetPurchaseCompleted',
      async (event) => {
        // Portfolio domain tracks asset purchases
        logger.debug('Portfolio domain received asset purchase', {
          userId: event.data.userId,
          asset: event.data.asset,
          amount: event.data.amountPurchased
        })
      }
    )
  }

  /**
   * Setup integration handlers for external systems
   */
  setupIntegrations() {
    // Analytics Integration - Track all transaction events
    this.registerIntegrationHandler(
      'analytics',
      '*Transaction*',
      async (event, context) => {
        // Send transaction events to analytics system
        const analyticsData = {
          eventType: event.eventType,
          timestamp: event.timestamp,
          userId: event.data.userId || event.data.accountId,
          transactionType: event.data.transactionType,
          amount: event.data.amount,
          metadata: {
            integration: context.integration,
            eventId: event.eventId
          }
        }

        logger.debug('Analytics event tracked', analyticsData)
        // In real implementation, send to analytics service
      },
      { continueOnError: true }
    )

    // Notification Integration - User notifications
    this.registerIntegrationHandler(
      'notifications',
      '*Completed',
      async (event, context) => {
        // Send notifications for completed operations
        const userId = event.data.userId || event.data.accountId
        if (userId) {
          const notificationData = {
            userId,
            type: event.eventType.replace('Completed', '').toLowerCase(),
            title: this._generateNotificationTitle(event.eventType),
            data: event.data,
            timestamp: event.timestamp
          }

          logger.debug('Notification queued', notificationData)
          // In real implementation, send to notification service
        }
      },
      { continueOnError: true }
    )

    // Audit Integration - Compliance and security logging
    this.registerIntegrationHandler(
      'audit',
      '*',
      async (event, context) => {
        // Log all events for audit trail
        const auditEntry = {
          eventId: event.eventId,
          eventType: event.eventType,
          timestamp: event.timestamp,
          sourceDomain: event.data.sourceDomain,
          userId: event.data.userId || event.data.accountId,
          data: event.data,
          integration: context.integration
        }

        logger.debug('Audit entry created', { eventId: event.eventId, eventType: event.eventType })
        // In real implementation, send to audit system
      },
      { continueOnError: true, priority: 10 } // Low priority for audit
    )

    logger.info('Integration handlers setup completed')
  }

  /**
   * Pattern matching for event types
   */
  _matchesPattern(eventType, pattern) {
    if (pattern === '*') return true
    
    // Convert pattern to regex
    const regexPattern = pattern
      .replace(/\*/g, '.*')
      .replace(/\?/g, '.')
    
    return new RegExp(`^${regexPattern}$`).test(eventType)
  }

  /**
   * Generate user-friendly notification titles
   */
  _generateNotificationTitle(eventType) {
    const titles = {
      'OnRampCompleted': 'Funds Added Successfully',
      'OffRampCompleted': 'Withdrawal Completed', 
      'P2PSendCompleted': 'Payment Sent',
      'AssetPurchaseCompleted': 'Asset Purchase Complete',
      'TransactionCompleted': 'Transaction Complete'
    }

    return titles[eventType] || `${eventType} Complete`
  }

  /**
   * Get broadcasting metrics
   */
  getMetrics() {
    return {
      ...this._metrics,
      domainHandlers: this._domainHandlers.size,
      integrationHandlers: this._integrationHandlers.length,
      eventBusStats: this._eventBus.getStats()
    }
  }

  /**
   * Get system health status
   */
  getHealthStatus() {
    const metrics = this.getMetrics()
    const errorRate = metrics.eventsProcessed > 0 
      ? (metrics.errors / metrics.eventsProcessed) * 100 
      : 0

    return {
      status: errorRate > 10 ? 'unhealthy' : 'healthy',
      errorRate: `${errorRate.toFixed(2)}%`,
      lastActivity: metrics.lastActivity,
      totalEvents: metrics.eventsEmitted + metrics.eventsProcessed,
      activeHandlers: metrics.domainHandlers + metrics.integrationHandlers
    }
  }

  /**
   * Cleanup all handlers and subscriptions
   */
  destroy() {
    // Cleanup domain handlers
    for (const [domain, handlers] of this._domainHandlers) {
      for (const [eventType, subscription] of handlers) {
        subscription.unsubscribe()
      }
    }
    this._domainHandlers.clear()

    // Cleanup integration handlers
    for (const subscription of this._integrationHandlers) {
      subscription.unsubscribe()
    }
    this._integrationHandlers = []

    logger.info('EventBroadcaster destroyed')
  }
}

/**
 * Create singleton event broadcaster
 */
export const globalEventBroadcaster = new EventBroadcaster()

// Setup integrations on startup
globalEventBroadcaster.setupIntegrations()

export default EventBroadcaster