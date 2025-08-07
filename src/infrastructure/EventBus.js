/**
 * Event Bus Infrastructure
 * Implements pub/sub pattern for domain events in DDD architecture
 * Provides reliable event delivery and error handling
 */

import logger from '../utils/logger.js'

export class EventBus {
  constructor(options = {}) {
    this._handlers = new Map()
    this._wildcardHandlers = []
    this._eventHistory = []
    this._maxHistorySize = options.maxHistorySize || 1000
    this._enableHistory = options.enableHistory !== false
    this._enableLogging = options.enableLogging !== false
    this._errorHandler = options.errorHandler || this._defaultErrorHandler
  }

  /**
   * Subscribe to events by type
   */
  subscribe(eventType, handler, options = {}) {
    if (typeof eventType !== 'string' || typeof handler !== 'function') {
      throw new Error('Event type must be string and handler must be function')
    }

    if (!this._handlers.has(eventType)) {
      this._handlers.set(eventType, [])
    }

    const subscription = {
      handler,
      id: this._generateSubscriptionId(),
      once: options.once || false,
      priority: options.priority || 0,
      context: options.context || null
    }

    const handlers = this._handlers.get(eventType)
    handlers.push(subscription)
    
    // Sort by priority (higher priority first)
    handlers.sort((a, b) => b.priority - a.priority)

    if (this._enableLogging) {
      logger.debug(`Event subscription added: ${eventType}`, { subscriptionId: subscription.id })
    }

    // Return unsubscribe function
    return () => this.unsubscribe(eventType, subscription.id)
  }

  /**
   * Subscribe to all events (wildcard subscription)
   */
  subscribeToAll(handler, options = {}) {
    if (typeof handler !== 'function') {
      throw new Error('Handler must be function')
    }

    const subscription = {
      handler,
      id: this._generateSubscriptionId(),
      once: options.once || false,
      priority: options.priority || 0,
      context: options.context || null
    }

    this._wildcardHandlers.push(subscription)
    this._wildcardHandlers.sort((a, b) => b.priority - a.priority)

    if (this._enableLogging) {
      logger.debug('Wildcard event subscription added', { subscriptionId: subscription.id })
    }

    return () => this.unsubscribeFromAll(subscription.id)
  }

  /**
   * Unsubscribe from events
   */
  unsubscribe(eventType, subscriptionId) {
    const handlers = this._handlers.get(eventType)
    if (!handlers) return false

    const index = handlers.findIndex(sub => sub.id === subscriptionId)
    if (index === -1) return false

    handlers.splice(index, 1)

    if (handlers.length === 0) {
      this._handlers.delete(eventType)
    }

    if (this._enableLogging) {
      logger.debug(`Event subscription removed: ${eventType}`, { subscriptionId })
    }

    return true
  }

  /**
   * Unsubscribe from wildcard events
   */
  unsubscribeFromAll(subscriptionId) {
    const index = this._wildcardHandlers.findIndex(sub => sub.id === subscriptionId)
    if (index === -1) return false

    this._wildcardHandlers.splice(index, 1)

    if (this._enableLogging) {
      logger.debug('Wildcard event subscription removed', { subscriptionId })
    }

    return true
  }

  /**
   * Emit event to all subscribers
   */
  async emit(event) {
    if (!event || !event.eventType) {
      throw new Error('Event must have eventType property')
    }

    // Add to history
    if (this._enableHistory) {
      this._addToHistory(event)
    }

    if (this._enableLogging) {
      logger.debug(`Event emitted: ${event.eventType}`, {
        eventId: event.eventId,
        timestamp: event.timestamp
      })
    }

    const results = []

    try {
      // Execute specific handlers
      const specificHandlers = this._handlers.get(event.eventType) || []
      for (const subscription of specificHandlers) {
        const result = await this._executeHandler(subscription, event)
        results.push(result)

        // Remove one-time subscriptions
        if (subscription.once) {
          this.unsubscribe(event.eventType, subscription.id)
        }
      }

      // Execute wildcard handlers
      for (const subscription of this._wildcardHandlers) {
        const result = await this._executeHandler(subscription, event)
        results.push(result)

        // Remove one-time subscriptions
        if (subscription.once) {
          this.unsubscribeFromAll(subscription.id)
        }
      }

    } catch (error) {
      logger.error('Event emission failed', {
        eventType: event.eventType,
        eventId: event.eventId,
        error: error.message
      })
      throw error
    }

    return results.filter(result => result.success)
  }

  /**
   * Emit event synchronously (fire and forget)
   */
  emitSync(event) {
    if (!event || !event.eventType) {
      throw new Error('Event must have eventType property')
    }

    // Add to history
    if (this._enableHistory) {
      this._addToHistory(event)
    }

    if (this._enableLogging) {
      logger.debug(`Event emitted sync: ${event.eventType}`, {
        eventId: event.eventId,
        timestamp: event.timestamp
      })
    }

    // Execute specific handlers synchronously
    const specificHandlers = this._handlers.get(event.eventType) || []
    for (const subscription of specificHandlers) {
      this._executeHandlerSync(subscription, event)

      // Remove one-time subscriptions
      if (subscription.once) {
        this.unsubscribe(event.eventType, subscription.id)
      }
    }

    // Execute wildcard handlers synchronously
    for (const subscription of this._wildcardHandlers) {
      this._executeHandlerSync(subscription, event)

      // Remove one-time subscriptions
      if (subscription.once) {
        this.unsubscribeFromAll(subscription.id)
      }
    }
  }

  /**
   * Get event history
   */
  getEventHistory(eventType = null, limit = 100) {
    if (!this._enableHistory) {
      return []
    }

    let history = [...this._eventHistory]

    if (eventType) {
      history = history.filter(event => event.eventType === eventType)
    }

    return history.slice(-limit)
  }

  /**
   * Clear event history
   */
  clearHistory() {
    this._eventHistory = []
  }

  /**
   * Get subscription statistics
   */
  getStats() {
    const specificSubscriptions = Array.from(this._handlers.entries())
      .reduce((total, [_, handlers]) => total + handlers.length, 0)

    return {
      specificSubscriptions,
      wildcardSubscriptions: this._wildcardHandlers.length,
      totalSubscriptions: specificSubscriptions + this._wildcardHandlers.length,
      eventTypes: Array.from(this._handlers.keys()),
      historySize: this._eventHistory.length
    }
  }

  /**
   * Check if there are subscribers for an event type
   */
  hasSubscribers(eventType) {
    const specific = this._handlers.has(eventType) && this._handlers.get(eventType).length > 0
    const wildcard = this._wildcardHandlers.length > 0
    return specific || wildcard
  }

  /**
   * Wait for specific event to be emitted
   */
  waitFor(eventType, timeout = 5000) {
    return new Promise((resolve, reject) => {
      const timeoutId = setTimeout(() => {
        unsubscribe()
        reject(new Error(`Timeout waiting for event: ${eventType}`))
      }, timeout)

      const unsubscribe = this.subscribe(eventType, (event) => {
        clearTimeout(timeoutId)
        unsubscribe()
        resolve(event)
      }, { once: true })
    })
  }

  /**
   * Replay events from history to new subscriber
   */
  replay(eventType, handler, fromTimestamp = null) {
    if (!this._enableHistory) {
      throw new Error('Event history is disabled')
    }

    const events = this.getEventHistory(eventType)
      .filter(event => !fromTimestamp || new Date(event.timestamp) >= new Date(fromTimestamp))

    for (const event of events) {
      try {
        handler(event)
      } catch (error) {
        this._errorHandler(error, event, { replayMode: true })
      }
    }

    // Subscribe to future events
    return this.subscribe(eventType, handler)
  }

  /**
   * Private methods
   */
  async _executeHandler(subscription, event) {
    try {
      const context = subscription.context
      const result = context 
        ? await subscription.handler.call(context, event)
        : await subscription.handler(event)

      return { success: true, subscriptionId: subscription.id, result }
    } catch (error) {
      this._errorHandler(error, event, subscription)
      return { success: false, subscriptionId: subscription.id, error }
    }
  }

  _executeHandlerSync(subscription, event) {
    try {
      const context = subscription.context
      const result = context 
        ? subscription.handler.call(context, event)
        : subscription.handler(event)

      return { success: true, subscriptionId: subscription.id, result }
    } catch (error) {
      this._errorHandler(error, event, subscription)
      return { success: false, subscriptionId: subscription.id, error }
    }
  }

  _addToHistory(event) {
    const eventData = event.toJSON ? event.toJSON() : {
      eventType: event.eventType,
      eventId: event.eventId,
      timestamp: event.timestamp,
      data: event.data
    }
    
    this._eventHistory.push({
      ...eventData,
      receivedAt: new Date().toISOString()
    })

    // Trim history to max size
    if (this._eventHistory.length > this._maxHistorySize) {
      this._eventHistory = this._eventHistory.slice(-this._maxHistorySize)
    }
  }

  _generateSubscriptionId() {
    return `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  _defaultErrorHandler(error, event, subscription) {
    logger.error('Event handler error', {
      eventType: event.eventType,
      eventId: event.eventId,
      subscriptionId: subscription?.id,
      error: error.message,
      stack: error.stack
    })
  }

  /**
   * Cleanup resources
   */
  destroy() {
    this._handlers.clear()
    this._wildcardHandlers = []
    this._eventHistory = []

    if (this._enableLogging) {
      logger.debug('EventBus destroyed')
    }
  }
}

/**
 * Create singleton event bus instance
 */
export const globalEventBus = new EventBus({
  enableHistory: true,
  enableLogging: true
})

export default EventBus