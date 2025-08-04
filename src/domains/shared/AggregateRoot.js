/**
 * Base Aggregate Root Class
 * Provides common functionality for all aggregates
 */

/**
 * Base Aggregate Root
 */
export class AggregateRoot {
  constructor() {
    this._events = []
    this._version = 0
    this._isDeleted = false
  }

  /**
   * Add domain event
   */
  addDomainEvent(event) {
    this._events.push({
      ...event,
      aggregateId: this.id,
      aggregateType: this.constructor.name,
      timestamp: new Date().toISOString(),
      version: this._version + 1
    })
  }

  /**
   * Get uncommitted events
   */
  getUncommittedEvents() {
    return [...this._events]
  }

  /**
   * Clear uncommitted events
   */
  clearEvents() {
    this._events = []
  }

  /**
   * Increment version
   */
  incrementVersion() {
    this._version++
  }

  /**
   * Get current version
   */
  getVersion() {
    return this._version
  }

  /**
   * Mark as deleted
   */
  markAsDeleted() {
    this._isDeleted = true
    this.incrementVersion()
  }

  /**
   * Check if deleted
   */
  isDeleted() {
    return this._isDeleted
  }

  /**
   * Apply event to aggregate
   */
  applyEvent(event) {
    const handlerName = `apply${event.type}`
    if (typeof this[handlerName] === 'function') {
      this[handlerName](event)
    }
    this.incrementVersion()
  }

  /**
   * Replay events to rebuild state
   */
  replayEvents(events) {
    events.forEach(event => {
      this.applyEvent(event)
    })
    this.clearEvents()
  }

  /**
   * Create snapshot of current state
   */
  createSnapshot() {
    return {
      id: this.id,
      version: this._version,
      state: this.toSnapshot(),
      timestamp: new Date().toISOString()
    }
  }

  /**
   * Load from snapshot
   */
  loadFromSnapshot(snapshot) {
    this._version = snapshot.version
    this.fromSnapshot(snapshot.state)
  }

  /**
   * Override in subclasses to provide snapshot data
   */
  toSnapshot() {
    throw new Error('toSnapshot must be implemented by subclass')
  }

  /**
   * Override in subclasses to load from snapshot data
   */
  fromSnapshot(state) {
    throw new Error('fromSnapshot must be implemented by subclass')
  }

  /**
   * Validate aggregate invariants
   */
  validate() {
    // Override in subclasses
    return true
  }

  /**
   * Check if aggregate can be modified
   */
  canModify() {
    return !this._isDeleted
  }

  /**
   * Ensure aggregate can be modified
   */
  ensureCanModify() {
    if (!this.canModify()) {
      throw new Error('Cannot modify deleted aggregate')
    }
  }
}