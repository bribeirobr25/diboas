/**
 * Base Repository Interface and Implementations
 * Provides common repository patterns and functionality
 */

import { eventStore } from '../../events/EventStore.js'

/**
 * Base Repository Interface
 */
export class Repository {
  /**
   * Find by ID
   */
  async findById(id) {
    throw new Error('findById must be implemented by subclass')
  }

  /**
   * Save aggregate
   */
  async save(aggregate) {
    throw new Error('save must be implemented by subclass')
  }

  /**
   * Delete aggregate
   */
  async delete(id) {
    throw new Error('delete must be implemented by subclass')
  }

  /**
   * Find by criteria
   */
  async findByCriteria(criteria) {
    throw new Error('findByCriteria must be implemented by subclass')
  }

  /**
   * Count aggregates
   */
  async count(criteria = {}) {
    throw new Error('count must be implemented by subclass')
  }
}

/**
 * Event Sourced Repository Base
 * Repository that uses event store for persistence
 */
export class EventSourcedRepository extends Repository {
  constructor(aggregateType) {
    super()
    this.aggregateType = aggregateType
    this.snapshots = new Map()
  }

  /**
   * Find aggregate by ID from events
   */
  async findById(id) {
    // Check snapshot first
    const snapshot = await this.getSnapshot(id)
    let events = []
    let fromVersion = 0

    if (snapshot) {
      fromVersion = snapshot.version
    }

    // Get events from event store
    events = eventStore.getEvents(id, fromVersion)

    if (!snapshot && events.length === 0) {
      return null
    }

    // Create aggregate instance
    const aggregate = this.createEmptyAggregate()

    // Load from snapshot if available
    if (snapshot) {
      aggregate.loadFromSnapshot(snapshot)
    }

    // Apply events
    aggregate.replayEvents(events)

    return aggregate
  }

  /**
   * Save aggregate using event sourcing
   */
  async save(aggregate) {
    if (!aggregate.canModify()) {
      throw new Error('Cannot save deleted aggregate')
    }

    // Validate aggregate
    if (!aggregate.validate()) {
      throw new Error('Aggregate validation failed')
    }

    // Get uncommitted events
    const events = aggregate.getUncommittedEvents()

    // Save events to event store
    for (const event of events) {
      await eventStore.appendEvent(
        aggregate.id,
        event.type,
        event.data || event,
        aggregate.getVersion() - 1
      )
    }

    // Clear uncommitted events
    aggregate.clearEvents()

    // Create snapshot if needed
    if (this.shouldCreateSnapshot(aggregate)) {
      await this.createSnapshot(aggregate)
    }

    return aggregate
  }

  /**
   * Delete aggregate (soft delete)
   */
  async delete(id) {
    const aggregate = await this.findById(id)
    if (!aggregate) {
      return false
    }

    aggregate.markAsDeleted()
    await this.save(aggregate)
    return true
  }

  /**
   * Create empty aggregate instance
   */
  createEmptyAggregate() {
    return new this.aggregateType()
  }

  /**
   * Get snapshot for aggregate
   */
  async getSnapshot(id) {
    return this.snapshots.get(id) || null
  }

  /**
   * Create snapshot for aggregate
   */
  async createSnapshot(aggregate) {
    const snapshot = aggregate.createSnapshot()
    this.snapshots.set(aggregate.id, snapshot)
    return snapshot
  }

  /**
   * Check if snapshot should be created
   */
  shouldCreateSnapshot(aggregate) {
    const version = aggregate.getVersion()
    return version > 0 && version % 10 === 0 // Every 10 events
  }

  /**
   * Clear snapshots (for testing)
   */
  clearSnapshots() {
    this.snapshots.clear()
  }
}

/**
 * In-Memory Repository Base
 * Repository using in-memory storage
 */
export class InMemoryRepository extends Repository {
  constructor() {
    super()
    this.store = new Map()
    this.indexes = new Map()
  }

  /**
   * Find by ID
   */
  async findById(id) {
    const item = this.store.get(id)
    return item && !item.isDeleted() ? item : null
  }

  /**
   * Save aggregate
   */
  async save(aggregate) {
    if (!aggregate.validate()) {
      throw new Error('Aggregate validation failed')
    }

    // Update indexes
    await this.updateIndexes(aggregate)

    // Store aggregate
    this.store.set(aggregate.id, aggregate)

    // Process domain events
    const events = aggregate.getUncommittedEvents()
    for (const event of events) {
      await eventStore.appendEvent(
        aggregate.id,
        event.type,
        event.data || event
      )
    }

    aggregate.clearEvents()
    return aggregate
  }

  /**
   * Delete aggregate
   */
  async delete(id) {
    const aggregate = await this.findById(id)
    if (!aggregate) {
      return false
    }

    aggregate.markAsDeleted()
    await this.removeFromIndexes(aggregate)
    return true
  }

  /**
   * Find by criteria
   */
  async findByCriteria(criteria) {
    const items = Array.from(this.store.values())
    return items.filter(item => {
      if (item.isDeleted()) return false
      return this.matchesCriteria(item, criteria)
    })
  }

  /**
   * Count aggregates
   */
  async count(criteria = {}) {
    if (Object.keys(criteria).length === 0) {
      return Array.from(this.store.values()).filter(item => !item.isDeleted()).length
    }

    const matches = await this.findByCriteria(criteria)
    return matches.length
  }

  /**
   * Update indexes for fast lookups
   */
  async updateIndexes(aggregate) {
    // Override in subclasses to implement specific indexing
  }

  /**
   * Remove from indexes
   */
  async removeFromIndexes(aggregate) {
    // Override in subclasses to implement specific index removal
  }

  /**
   * Check if aggregate matches criteria
   */
  matchesCriteria(aggregate, criteria) {
    for (const [key, value] of Object.entries(criteria)) {
      const aggregateValue = this.getNestedProperty(aggregate, key)
      if (aggregateValue !== value) {
        return false
      }
    }
    return true
  }

  /**
   * Get nested property value
   */
  getNestedProperty(obj, path) {
    return path.split('.').reduce((current, key) => current?.[key], obj)
  }

  /**
   * Clear repository (for testing)
   */
  clear() {
    this.store.clear()
    this.indexes.clear()
  }
}

/**
 * Unit of Work Pattern
 * Manages aggregate lifecycle and transactions
 */
export class UnitOfWork {
  constructor() {
    this.newAggregates = new Map()
    this.dirtyAggregates = new Map()
    this.removedAggregates = new Map()
    this.repositories = new Map()
  }

  /**
   * Register repository
   */
  registerRepository(type, repository) {
    this.repositories.set(type, repository)
  }

  /**
   * Register new aggregate
   */
  registerNew(aggregate) {
    if (this.dirtyAggregates.has(aggregate.id)) {
      throw new Error('Aggregate already registered as dirty')
    }
    if (this.removedAggregates.has(aggregate.id)) {
      throw new Error('Aggregate already registered for removal')
    }
    
    this.newAggregates.set(aggregate.id, aggregate)
  }

  /**
   * Register dirty aggregate
   */
  registerDirty(aggregate) {
    if (this.removedAggregates.has(aggregate.id)) {
      throw new Error('Aggregate already registered for removal')
    }
    
    if (this.newAggregates.has(aggregate.id)) {
      throw new Error('Aggregate already registered as new')
    }
    
    this.dirtyAggregates.set(aggregate.id, aggregate)
  }

  /**
   * Register removed aggregate
   */
  registerRemoved(aggregate) {
    if (this.newAggregates.has(aggregate.id)) {
      this.newAggregates.delete(aggregate.id)
      return
    }
    
    this.dirtyAggregates.delete(aggregate.id)
    this.removedAggregates.set(aggregate.id, aggregate)
  }

  /**
   * Commit all changes
   */
  async commit() {
    try {
      // Save new aggregates
      for (const [id, aggregate] of this.newAggregates) {
        const repository = this.getRepository(aggregate)
        await repository.save(aggregate)
      }

      // Save dirty aggregates
      for (const [id, aggregate] of this.dirtyAggregates) {
        const repository = this.getRepository(aggregate)
        await repository.save(aggregate)
      }

      // Remove deleted aggregates
      for (const [id, aggregate] of this.removedAggregates) {
        const repository = this.getRepository(aggregate)
        await repository.delete(id)
      }

      // Clear all tracking
      this.clear()

    } catch (error) {
      // Rollback logic would go here
      throw error
    }
  }

  /**
   * Clear unit of work
   */
  clear() {
    this.newAggregates.clear()
    this.dirtyAggregates.clear()
    this.removedAggregates.clear()
  }

  /**
   * Get repository for aggregate
   */
  getRepository(aggregate) {
    const repository = this.repositories.get(aggregate.constructor.name)
    if (!repository) {
      throw new Error(`No repository registered for ${aggregate.constructor.name}`)
    }
    return repository
  }
}