/**
 * Fee Domain Module
 * Exports all Fee domain components following DDD patterns
 */

// Value Objects
export { FeeAmount, FeeType } from './value-objects/FeeAmount.js'
export { FeeStructure } from './value-objects/FeeStructure.js'

// Domain Services
export { FeeCalculationService, FeeCalculationError } from './services/FeeCalculationService.js'

// Repositories
export { FeeRateRepository } from './repositories/FeeRateRepository.js'

// Events
export {
  FeeCalculated,
  FeeRatesUpdated,
  FeeValidationFailed,
  FeeCalculationFailed,
  FeeComparisonRequested,
  FeeComparisonCompleted
} from './events/FeeEvents.js'

// Factory for creating fee domain services
export function createFeeService(feeProviderService, eventBus, storage) {
  const feeRateRepository = new FeeRateRepository(storage)
  const feeCalculationService = new FeeCalculationService(feeProviderService, eventBus)
  
  return {
    feeCalculationService,
    feeRateRepository
  }
}

export default {
  FeeAmount,
  FeeType,
  FeeStructure,
  FeeCalculationService,
  FeeCalculationError,
  FeeRateRepository,
  FeeCalculated,
  FeeRatesUpdated,
  FeeValidationFailed,
  FeeCalculationFailed,
  FeeComparisonRequested,
  FeeComparisonCompleted,
  createFeeService
}