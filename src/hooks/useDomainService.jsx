/**
 * Domain Service Hook
 * Provides access to domain services in React components
 * Implements proper DDD service location pattern
 */

import { useContext, createContext } from 'react'

// Domain Services Context
const DomainServicesContext = createContext(null)

/**
 * Domain Services Provider Component
 * Provides domain services to the component tree
 */
export function DomainServicesProvider({ children, domainRegistry }) {
  return (
    <DomainServicesContext.Provider value={domainRegistry}>
      {children}
    </DomainServicesContext.Provider>
  )
}

/**
 * Hook to access domain services
 * @param {string} serviceName - The name of the service to retrieve
 * @returns {object} Domain service instance
 */
export function useDomainService(serviceName) {
  const domainRegistry = useContext(DomainServicesContext)
  
  if (!domainRegistry) {
    throw new Error('useDomainService must be used within a DomainServicesProvider')
  }

  switch (serviceName) {
    case 'fee':
      return domainRegistry.getFeeCalculationService()
    
    case 'feeRepository':
      return domainRegistry.getFeeRateRepository()
    
    case 'account':
      return domainRegistry.getAccountService()
    
    case 'balance':
      return domainRegistry.getBalanceService()
    
    case 'transaction':
      return domainRegistry.getTransactionService()
    
    case 'userRepository':
      return domainRegistry.getUserRepository()
    
    case 'accountRepository':
      return domainRegistry.getAccountRepository()
    
    case 'balanceRepository':
      return domainRegistry.getBalanceRepository()
    
    case 'transactionRepository':
      return domainRegistry.getTransactionRepository()
    
    default:
      throw new Error(`Unknown domain service: ${serviceName}`)
  }
}

/**
 * Hook to access multiple domain services at once
 * @param {string[]} serviceNames - Array of service names
 * @returns {object} Object with requested services
 */
export function useDomainServices(serviceNames) {
  const services = {}
  
  for (const serviceName of serviceNames) {
    services[serviceName] = useDomainService(serviceName)
  }
  
  return services
}

/**
 * Hook to access the entire domain registry
 * Use sparingly - prefer specific service hooks
 */
export function useDomainRegistry() {
  const domainRegistry = useContext(DomainServicesContext)
  
  if (!domainRegistry) {
    throw new Error('useDomainRegistry must be used within a DomainServicesProvider')
  }
  
  return domainRegistry
}

export default useDomainService