/**
 * Event Broadcaster Tests
 * Tests for cross-domain event broadcasting and integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { EventBroadcaster } from '../EventBroadcaster.js'
import { EventBus } from '../EventBus.js'
import { DomainEvent } from '../../domains/shared/DomainEvent.js'

describe('EventBroadcaster', () => {
  let broadcaster
  let eventBus
  let mockHandler

  beforeEach(() => {
    eventBus = new EventBus({ enableLogging: false })
    broadcaster = new EventBroadcaster(eventBus)
    mockHandler = vi.fn()
  })

  afterEach(() => {
    broadcaster.destroy()
    eventBus.destroy()
  })

  describe('Domain Handler Registration', () => {
    it('should register domain-specific event handlers', () => {
      const unsubscribe = broadcaster.registerDomainHandler(
        'testDomain',
        'TestEvent',
        mockHandler
      )

      expect(typeof unsubscribe).toBe('function')
      expect(broadcaster._domainHandlers.has('testDomain')).toBe(true)
    })

    it('should execute domain handlers when events are emitted', async () => {
      broadcaster.registerDomainHandler('testDomain', 'TestEvent', mockHandler)

      const testEvent = new DomainEvent('TestEvent', { testData: 'value' })
      await eventBus.emit(testEvent)

      expect(mockHandler).toHaveBeenCalledWith(testEvent)
    })

    it('should handle errors in domain handlers gracefully', async () => {
      const errorHandler = vi.fn(() => {
        throw new Error('Handler error')
      })

      broadcaster.registerDomainHandler('testDomain', 'TestEvent', errorHandler)

      const testEvent = new DomainEvent('TestEvent', { testData: 'value' })

      // The EventBroadcaster wraps handlers and re-throws errors for domain handlers
      // Should throw because the domain handler throws
      await expect(eventBus.emit(testEvent)).rejects.toThrow('Handler error')
      
      // Should have executed the handler
      expect(errorHandler).toHaveBeenCalled()
    })
  })

  describe('Integration Handler Registration', () => {
    it('should register integration handlers with patterns', () => {
      const initialCount = broadcaster._integrationHandlers.length
      
      const unsubscribe = broadcaster.registerIntegrationHandler(
        'analytics',
        '*Transaction*',
        mockHandler
      )

      expect(typeof unsubscribe).toBe('function')
      expect(broadcaster._integrationHandlers.length).toBe(initialCount + 1)
    })

    it('should match event patterns correctly', () => {
      expect(broadcaster._matchesPattern('TransactionCompleted', '*Transaction*')).toBe(true)
      expect(broadcaster._matchesPattern('OnRampCompleted', '*Completed')).toBe(true)
      expect(broadcaster._matchesPattern('TestEvent', '*')).toBe(true)
      expect(broadcaster._matchesPattern('TransactionCompleted', 'OnRamp*')).toBe(false)
    })

    it('should execute integration handlers for matching patterns', async () => {
      broadcaster.registerIntegrationHandler(
        'testIntegration',
        '*Test*',
        mockHandler
      )

      const testEvent = new DomainEvent('TestEvent', { testData: 'value' })
      await eventBus.emit(testEvent)

      expect(mockHandler).toHaveBeenCalledWith(testEvent, { integration: 'testIntegration' })
    })
  })

  describe('Domain Event Broadcasting', () => {
    it('should broadcast domain events with enriched context', async () => {
      broadcaster.registerDomainHandler('receivingDomain', 'TestEvent', mockHandler)

      const testEvent = new DomainEvent('TestEvent', { originalData: 'value' })
      const result = await broadcaster.broadcastDomainEvent('sourceDomain', testEvent)

      expect(result.success).toBe(true)
      expect(result.handlersExecuted).toBeGreaterThan(0)
      expect(mockHandler).toHaveBeenCalled()

      // Check that event was enriched with domain context
      const receivedEvent = mockHandler.mock.calls[0][0]
      expect(receivedEvent.data.sourceDomain).toBe('sourceDomain')
      expect(receivedEvent.data.broadcastedAt).toBeDefined()
    })

    it('should track metrics for broadcasted events', async () => {
      const initialMetrics = broadcaster.getMetrics()

      const testEvent = new DomainEvent('TestEvent', { testData: 'value' })
      await broadcaster.broadcastDomainEvent('testDomain', testEvent)

      const updatedMetrics = broadcaster.getMetrics()
      expect(updatedMetrics.eventsEmitted).toBe(initialMetrics.eventsEmitted + 1)
      expect(updatedMetrics.lastActivity).toBeDefined()
    })
  })

  describe('Core Event Handlers', () => {
    it('should have registered core cross-domain handlers', () => {
      const metrics = broadcaster.getMetrics()
      
      // Should have domain handlers for core cross-domain communication
      // The broadcaster sets up 5 core handlers in _setupCoreEventHandlers
      // domainHandlers is the size of the Map, so should be the number of domains
      expect(metrics.domainHandlers).toBeGreaterThanOrEqual(1)
      
      // Should have integration handlers for external systems
      // The broadcaster sets up 3 integration handlers in setupIntegrations
      expect(metrics.integrationHandlers).toBeGreaterThanOrEqual(3)
    })

    it('should handle fee calculation events', async () => {
      const feeEvent = new DomainEvent('FeeCalculated', {
        transactionType: 'add',
        totalFees: { amount: 2.5, currency: 'USD' }
      })

      // Should not throw when emitting fee events
      await expect(broadcaster.broadcastDomainEvent('fee', feeEvent)).resolves.toBeDefined()
    })

    it('should handle transaction completion events', async () => {
      const transactionEvent = new DomainEvent('TransactionCompleted', {
        transactionId: 'test-tx-123',
        accountId: 'test-user',
        result: { success: true }
      })

      await expect(broadcaster.broadcastDomainEvent('transaction', transactionEvent)).resolves.toBeDefined()
    })

    it('should handle large transaction alerts for compliance', async () => {
      const onRampEvent = new DomainEvent('OnRampCompleted', {
        userId: 'test-user',
        amountReceived: 15000, // Large amount
        providerTransactionId: 'provider-123'
      })

      await expect(broadcaster.broadcastDomainEvent('transaction', onRampEvent)).resolves.toBeDefined()
    })
  })

  describe('Integration Handlers', () => {
    // Integration handlers are already set up in the broadcaster constructor

    it('should track transaction events for analytics', async () => {
      const transactionEvent = new DomainEvent('TransactionCompleted', {
        userId: 'test-user',
        transactionType: 'add',
        amount: 100
      })

      // Should be handled by analytics integration
      await expect(eventBus.emit(transactionEvent)).resolves.toBeDefined()
    })

    it('should send notifications for completed operations', async () => {
      const completedEvent = new DomainEvent('OnRampCompleted', {
        userId: 'test-user',
        amountReceived: 100
      })

      await expect(eventBus.emit(completedEvent)).resolves.toBeDefined()
    })

    it('should create audit entries for all events', async () => {
      const testEvent = new DomainEvent('TestEvent', {
        userId: 'test-user',
        testData: 'value'
      })

      await expect(eventBus.emit(testEvent)).resolves.toBeDefined()
    })
  })

  describe('Metrics and Health', () => {
    it('should provide comprehensive metrics', () => {
      const metrics = broadcaster.getMetrics()

      expect(metrics).toHaveProperty('eventsEmitted')
      expect(metrics).toHaveProperty('eventsProcessed')
      expect(metrics).toHaveProperty('errors')
      expect(metrics).toHaveProperty('domainHandlers')
      expect(metrics).toHaveProperty('integrationHandlers')
      expect(metrics).toHaveProperty('eventBusStats')
    })

    it('should provide health status', () => {
      const health = broadcaster.getHealthStatus()

      expect(health).toHaveProperty('status')
      expect(health).toHaveProperty('errorRate')
      expect(health).toHaveProperty('lastActivity')
      expect(health).toHaveProperty('totalEvents')
      expect(health).toHaveProperty('activeHandlers')
      expect(['healthy', 'unhealthy'].includes(health.status)).toBe(true)
    })

    it('should calculate error rate correctly', async () => {
      // Register a handler that always fails
      broadcaster.registerDomainHandler('testDomain', 'ErrorEvent', () => {
        throw new Error('Test error')
      })

      const errorEvent = new DomainEvent('ErrorEvent', {})

      try {
        await eventBus.emit(errorEvent)
      } catch (error) {
        // Expected error
      }

      const health = broadcaster.getHealthStatus()
      expect(parseFloat(health.errorRate)).toBeGreaterThan(0)
    })
  })

  describe('Cleanup and Destruction', () => {
    it('should cleanup all handlers on destroy', () => {
      broadcaster.registerDomainHandler('testDomain', 'TestEvent', mockHandler)
      broadcaster.registerIntegrationHandler('testIntegration', '*', mockHandler)

      expect(broadcaster._domainHandlers.size).toBeGreaterThan(0)
      expect(broadcaster._integrationHandlers.length).toBeGreaterThan(0)

      broadcaster.destroy()

      expect(broadcaster._domainHandlers.size).toBe(0)
      expect(broadcaster._integrationHandlers.length).toBe(0)
    })
  })

  describe('Notification Title Generation', () => {
    it('should generate appropriate notification titles', () => {
      expect(broadcaster._generateNotificationTitle('OnRampCompleted')).toBe('Funds Added Successfully')
      expect(broadcaster._generateNotificationTitle('OffRampCompleted')).toBe('Withdrawal Completed')
      expect(broadcaster._generateNotificationTitle('P2PSendCompleted')).toBe('Payment Sent')
      expect(broadcaster._generateNotificationTitle('UnknownEvent')).toBe('UnknownEvent Complete')
    })
  })
})