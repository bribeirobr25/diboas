/**
 * Transaction Domain Public API
 * Exposes the transaction domain functionality
 */

// Models
export { 
  Transaction, 
  TransactionFees, 
  TransactionMetadata, 
  TransactionTimeline,
  TransactionStatus,
  TransactionType,
  TransactionDirection
} from './models/Transaction.js'

// Repositories
export { TransactionRepository, InMemoryTransactionRepository } from './repositories/TransactionRepository.js'

// Services
export { TransactionService } from './services/TransactionService.js'

// Events
export * from './events/TransactionEvents.js'

// Domain factory function
export function createTransactionDomain(repositories = {}, services = {}) {
  const transactionRepository = repositories.transactionRepository || new InMemoryTransactionRepository()
  const balanceService = services.balanceService
  const accountService = services.accountService
  
  const transactionService = new TransactionService(
    transactionRepository, 
    balanceService, 
    accountService
  )
  
  return {
    // Services
    transactionService,
    
    // Repositories
    transactionRepository,
    
    // Factory methods
    createTransaction: (data) => new Transaction(data)
  }
}