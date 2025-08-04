/**
 * Account Domain Public API
 * Exposes the account domain functionality
 */

// Models
export { User, UserProfile, UserPreferences, UserStatus, KYCStatus, AMLStatus } from './models/User.js'
export { Account, AccountType, AccountStatus, Wallet, AccountLimits, AccountFeatures } from './models/Account.js'

// Repositories
export { UserRepository, InMemoryUserRepository } from './repositories/UserRepository.js'
export { AccountRepository, InMemoryAccountRepository } from './repositories/AccountRepository.js'

// Services
export { AccountService } from './services/AccountService.js'

// Events
export * from './events/AccountEvents.js'

// Domain factory function
export function createAccountDomain(repositories = {}) {
  const userRepository = repositories.userRepository || new InMemoryUserRepository()
  const accountRepository = repositories.accountRepository || new InMemoryAccountRepository()
  
  const accountService = new AccountService(userRepository, accountRepository)
  
  return {
    // Services
    accountService,
    
    // Repositories
    userRepository,
    accountRepository,
    
    // Factory methods
    createUser: (data) => new User(data),
    createAccount: (data) => new Account(data)
  }
}