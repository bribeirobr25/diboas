/**
 * Balance Domain Public API
 * Exposes the balance domain functionality
 */

// Models
export { Balance, AssetBalance, ChainBalance, BalanceSnapshot } from './models/Balance.js'

// Repositories
export { BalanceRepository, InMemoryBalanceRepository } from './repositories/BalanceRepository.js'

// Services
export { BalanceService, MockPriceService } from './services/BalanceService.js'

// Events
export * from './events/BalanceEvents.js'

// Domain factory function
export function createBalanceDomain(repositories = {}, services = {}) {
  const balanceRepository = repositories.balanceRepository || new InMemoryBalanceRepository()
  const priceService = services.priceService || new MockPriceService()
  
  const balanceService = new BalanceService(balanceRepository, priceService)
  
  return {
    // Services
    balanceService,
    priceService,
    
    // Repositories
    balanceRepository,
    
    // Factory methods
    createBalance: (data) => new Balance(data)
  }
}