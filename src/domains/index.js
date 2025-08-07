/**
 * Domains Root Module
 * Central registry for all domain modules
 */

// Domain exports
export * from './account/index.js'
export * from './balance/index.js'
export * from './transaction/index.js'
export * from './fee/index.js'

// Domain factory
import { createAccountDomain } from './account/index.js'
import { createBalanceDomain } from './balance/index.js'
import { createTransactionDomain } from './transaction/index.js'
import { createFeeService } from './fee/index.js'

/**
 * Create all domains with proper dependency injection
 */
export function createDomains(repositories = {}, services = {}, infrastructure = {}) {
  // Create domains
  const accountDomain = createAccountDomain(repositories.account)
  const balanceDomain = createBalanceDomain(repositories.balance, services.balance)
  
  // Create fee domain with dependencies
  const feeDomain = createFeeService(
    infrastructure.feeProviderService,
    infrastructure.eventBus,
    infrastructure.storage
  )
  
  const transactionDomain = createTransactionDomain(
    repositories.transaction, 
    {
      balanceService: balanceDomain.balanceService,
      accountService: accountDomain.accountService,
      feeCalculationService: feeDomain.feeCalculationService
    }
  )

  return {
    account: accountDomain,
    balance: balanceDomain,
    transaction: transactionDomain,
    fee: feeDomain
  }
}

/**
 * Domain registry for easy access
 */
export class DomainRegistry {
  constructor(repositories = {}, services = {}, infrastructure = {}) {
    this.domains = createDomains(repositories, services, infrastructure)
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

  getFeeCalculationService() {
    return this.domains.fee.feeCalculationService
  }

  getFeeRateRepository() {
    return this.domains.fee.feeRateRepository
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