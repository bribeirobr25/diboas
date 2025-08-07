/**
 * Centralized TypeScript definitions for all Mockup Services
 * Import from this file for comprehensive type support
 */

// Re-export all core service types
export * from './mockup-services.js'
export * from './mockup-extended.js'

// Common utility types for all mockup services
export interface MockupServiceConfig {
  enableNetworkDelay: boolean
  minDelayMs: number
  maxDelayMs: number
  errorRate: number // 0-1, percentage chance of errors
  enableLogging: boolean
}

export interface MockupServiceMetrics {
  totalRequests: number
  successfulRequests: number
  failedRequests: number
  averageResponseTime: number
  lastRequestTime: number
  uptime: number
}

export interface MockupServiceBase {
  simulateNetworkDelay(minMs?: number, maxMs?: number): Promise<void>
  healthCheck(): Promise<HealthCheckResponse>
}

// Type guards for runtime type checking
export function isMockupService(service: any): service is MockupServiceBase {
  return service && 
         typeof service.simulateNetworkDelay === 'function' &&
         typeof service.healthCheck === 'function'
}

// Utility types for error handling
export interface MockupServiceError {
  code: string
  message: string
  service: string
  timestamp: number
  details?: any
}

export interface MockupServiceResponse<T = any> {
  success: boolean
  data?: T
  error?: MockupServiceError
  timestamp: number
}

// Configuration types
export interface GlobalMockupConfig {
  enabled: boolean
  services: {
    analytics: MockupServiceConfig
    fees: MockupServiceConfig
    assets: MockupServiceConfig
    auth: MockupServiceConfig
    config: MockupServiceConfig
    balance: MockupServiceConfig
    marketData: MockupServiceConfig
    strategies: MockupServiceConfig
    transactions: MockupServiceConfig
    payments: MockupServiceConfig
    ui: MockupServiceConfig
    settings: MockupServiceConfig
    security: MockupServiceConfig
    notifications: MockupServiceConfig
    risk: MockupServiceConfig
    tax: MockupServiceConfig
    workflows: MockupServiceConfig
  }
}