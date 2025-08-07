/**
 * Fee Domain Events
 * Events emitted by the Fee domain following DDD and Event-Driven patterns
 */

import { DomainEvent } from '../../shared/DomainEvent.js'

/**
 * Fee Calculated Event
 * Emitted when fees are calculated for a transaction
 */
export class FeeCalculated extends DomainEvent {
  constructor(data) {
    super('FeeCalculated', data)
  }

  get feeStructure() {
    return this.data.feeStructure
  }

  get transactionType() {
    return this.data.transactionType
  }

  get amount() {
    return this.data.amount
  }

  get paymentMethod() {
    return this.data.paymentMethod
  }

  get totalFees() {
    return this.data.totalFees
  }

  get calculatedAt() {
    return this.data.calculatedAt
  }
}

/**
 * Fee Rates Updated Event
 * Emitted when fee rates are updated from provider
 */
export class FeeRatesUpdated extends DomainEvent {
  constructor(data) {
    super('FeeRatesUpdated', data)
  }

  get previousRates() {
    return this.data.previousRates
  }

  get newRates() {
    return this.data.newRates
  }

  get updatedAt() {
    return this.data.updatedAt
  }

  get provider() {
    return this.data.provider
  }
}

/**
 * Fee Validation Failed Event
 * Emitted when fee validation fails
 */
export class FeeValidationFailed extends DomainEvent {
  constructor(data) {
    super('FeeValidationFailed', data)
  }

  get transactionRequest() {
    return this.data.transactionRequest
  }

  get validationErrors() {
    return this.data.validationErrors
  }

  get failedAt() {
    return this.data.failedAt
  }
}

/**
 * Fee Calculation Failed Event
 * Emitted when fee calculation encounters an error
 */
export class FeeCalculationFailed extends DomainEvent {
  constructor(data) {
    super('FeeCalculationFailed', data)
  }

  get transactionRequest() {
    return this.data.transactionRequest
  }

  get error() {
    return this.data.error
  }

  get failedAt() {
    return this.data.failedAt
  }
}

/**
 * Fee Comparison Requested Event
 * Emitted when fee comparison is requested across payment methods
 */
export class FeeComparisonRequested extends DomainEvent {
  constructor(data) {
    super('FeeComparisonRequested', data)
  }

  get transactionRequest() {
    return this.data.transactionRequest
  }

  get paymentMethods() {
    return this.data.paymentMethods
  }

  get requestedAt() {
    return this.data.requestedAt
  }
}

/**
 * Fee Comparison Completed Event
 * Emitted when fee comparison is completed
 */
export class FeeComparisonCompleted extends DomainEvent {
  constructor(data) {
    super('FeeComparisonCompleted', data)
  }

  get transactionRequest() {
    return this.data.transactionRequest
  }

  get comparisons() {
    return this.data.comparisons
  }

  get recommendedMethod() {
    return this.data.recommendedMethod
  }

  get completedAt() {
    return this.data.completedAt
  }
}

export default {
  FeeCalculated,
  FeeRatesUpdated,
  FeeValidationFailed,
  FeeCalculationFailed,
  FeeComparisonRequested,
  FeeComparisonCompleted
}