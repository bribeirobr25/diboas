/**
 * Domain Event Base Class
 * Base class for all domain events in the DDD architecture
 */

export class DomainEvent {
  constructor(eventType, data = {}) {
    this.eventType = eventType
    this.data = data
    this.eventId = this.generateEventId()
    this.timestamp = new Date().toISOString()
    this.version = 1
    
    // Make immutable
    Object.freeze(this)
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Get event metadata
   */
  getMetadata() {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      timestamp: this.timestamp,
      version: this.version
    }
  }

  /**
   * Serialize event for persistence
   */
  toJSON() {
    return {
      eventId: this.eventId,
      eventType: this.eventType,
      data: this.data,
      timestamp: this.timestamp,
      version: this.version
    }
  }

  /**
   * Deserialize event from JSON
   */
  static fromJSON(json) {
    const event = new DomainEvent(json.eventType, json.data)
    event.eventId = json.eventId
    event.timestamp = json.timestamp
    event.version = json.version
    return event
  }

  /**
   * Check if event is of specific type
   */
  isOfType(eventType) {
    return this.eventType === eventType
  }

  /**
   * Get event age in milliseconds
   */
  getAge() {
    return Date.now() - new Date(this.timestamp).getTime()
  }

  /**
   * Check if event is recent (within specified milliseconds)
   */
  isRecent(withinMs = 60000) { // Default 1 minute
    return this.getAge() <= withinMs
  }
}

export default DomainEvent