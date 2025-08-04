/**
 * Domains Root Module
 * Central registry for all domain modules
 */

// Domain exports
export * from './account/index.js'
export * from './balance/index.js'
export * from './transaction/index.js'

// Domain factory
import { createAccountDomain } from './account/index.js'
import { createBalanceDomain } from './balance/index.js'
import { createTransactionDomain } from './transaction/index.js'

/**
 * Create all domains with proper dependency injection
 */
export function createDomains(repositories = {}, services = {}) {
  // Create domains
  const accountDomain = createAccountDomain(repositories.account)
  const balanceDomain = createBalanceDomain(repositories.balance, services.balance)
  const transactionDomain = createTransactionDomain(
    repositories.transaction, 
    {
      balanceService: balanceDomain.balanceService,
      accountService: accountDomain.accountService
    }
  )

  return {
    account: accountDomain,
    balance: balanceDomain,
    transaction: transactionDomain
  }
}

/**
 * Domain registry for easy access
 */
export class DomainRegistry {
  constructor(repositories = {}, services = {}) {
    this.domains = createDomains(repositories, services)
  }

  getAccountService() {
    return this.domains.account.accountService
  }

  getBalanceService() {
    return this.domains.balance.balanceService
  }

  getTransactionService() {
    return this.domains.transaction.transactionService
  }

  getUserRepository() {
    return this.domains.account.userRepository
  }

  getAccountRepository() {
    return this.domains.account.accountRepository
  }

  getBalanceRepository() {
    return this.domains.balance.balanceRepository
  }

  getTransactionRepository() {
    return this.domains.transaction.transactionRepository
  }
}