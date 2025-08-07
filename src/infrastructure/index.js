/**
 * Infrastructure Setup
 * Initializes all infrastructure services for DDD architecture
 */

import { EventBus, globalEventBus } from './EventBus.js'
import { DomainRegistry } from '../domains/index.js'
import { mockupFeeProviderService } from '../services/fees/MockupFeeProviderService.js'
import { localStorageHelper } from '../utils/localStorageHelper.js'
import logger from '../utils/logger.js'

/**
 * Create and configure infrastructure services
 */
export function createInfrastructure(options = {}) {
  const infrastructure = {
    eventBus: options.eventBus || globalEventBus,
    storage: options.storage || localStorageHelper,
    feeProviderService: options.feeProviderService || mockupFeeProviderService
  }

  logger.debug('Infrastructure services initialized', {
    eventBus: !!infrastructure.eventBus,
    storage: !!infrastructure.storage,
    feeProviderService: !!infrastructure.feeProviderService
  })

  return infrastructure
}

/**
 * Create domain registry with infrastructure dependencies
 */
export function createDomainRegistry(options = {}) {
  const infrastructure = createInfrastructure(options.infrastructure)
  
  const domainRegistry = new DomainRegistry(
    options.repositories || {},
    options.services || {},
    infrastructure
  )

  logger.info('Domain registry created with infrastructure dependencies')

  return domainRegistry
}

/**
 * Setup event handlers for domain events
 */
export function setupEventHandlers(eventBus, domainRegistry) {
  // Fee domain event handlers
  eventBus.subscribe('FeeCalculated', (event) => {
    logger.debug('Fee calculated event received', {
      transactionType: event.transactionType,
      totalFees: event.totalFees.amount,
      paymentMethod: event.paymentMethod
    })
  })

  eventBus.subscribe('FeeCalculationFailed', (event) => {
    logger.error('Fee calculation failed event received', {
      transactionRequest: event.transactionRequest,
      error: event.error
    })
  })

  // Transaction domain event handlers
  eventBus.subscribe('TransactionProcessingStarted', (event) => {
    logger.debug('Transaction processing started', {
      transactionId: event.data.transactionId,
      accountId: event.data.accountId
    })
  })

  eventBus.subscribe('TransactionCompleted', (event) => {
    logger.info('Transaction completed', {
      transactionId: event.data.transactionId,
      accountId: event.data.accountId
    })
  })

  eventBus.subscribe('TransactionFailed', (event) => {
    logger.error('Transaction failed', {
      transactionId: event.data.transactionId,
      error: event.data.error
    })
  })

  // Balance domain event handlers
  eventBus.subscribe('BalanceUpdated', (event) => {
    logger.debug('Balance updated', {
      accountId: event.accountId,
      newBalance: event.newBalance
    })
  })

  logger.info('Event handlers configured for domain events')
}

/**
 * Initialize complete application infrastructure
 */
export async function initializeInfrastructure(options = {}) {
  try {
    // Create infrastructure services
    const infrastructure = createInfrastructure(options.infrastructure)
    
    // Create domain registry
    const domainRegistry = createDomainRegistry({
      repositories: options.repositories,
      services: options.services,
      infrastructure
    })
    
    // Setup event handlers
    setupEventHandlers(infrastructure.eventBus, domainRegistry)
    
    // Initialize fee provider service if needed
    if (infrastructure.feeProviderService.initialize) {
      await infrastructure.feeProviderService.initialize()
    }

    logger.info('Application infrastructure initialized successfully')
    
    return {
      infrastructure,
      domainRegistry
    }
    
  } catch (error) {
    logger.error('Failed to initialize infrastructure', error)
    throw new Error(`Infrastructure initialization failed: ${error.message}`)
  }
}

export default {
  createInfrastructure,
  createDomainRegistry,
  setupEventHandlers,
  initializeInfrastructure,
  EventBus,
  globalEventBus
}