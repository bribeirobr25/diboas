/**
 * Extended TypeScript definitions for additional Mockup Services
 * Provides type safety for specialized mockup service interfaces
 */

import { HealthCheckResponse, SimulationOptions } from './mockup-services.js'

// Balance Service Types
export interface BalanceInfo {
  asset: string
  available: number
  locked: number
  total: number
  lastUpdated: number
}

export interface MockupBalanceProviderService {
  getAccountBalances(accountId: string): Promise<Record<string, BalanceInfo>>
  getBalanceHistory(accountId: string, asset?: string, timeframe?: string): Promise<any[]>
  simulateNetworkDelay(minMs?: number, maxMs?: number): Promise<void>
  healthCheck(): Promise<HealthCheckResponse>
}

// Market Data Service Types  
export interface MarketIndicator {
  id: string
  name: string
  value: number
  change24h: number
  changePercent24h: number
  timestamp: number
}

export interface MockupMarketDataProviderService {
  getCurrentPrices(): Promise<Record<string, number>>
  getHistoricalPrices(asset: string, timeframe: string): Promise<any[]>
  getMarketIndicators(): Promise<MarketIndicator[]>
  simulateNetworkDelay(minMs?: number, maxMs?: number): Promise<void>
  healthCheck(): Promise<HealthCheckResponse>
}

// Strategy Service Types
export interface StrategyTemplate {
  id: string
  name: string
  description: string
  category: string
  riskLevel: 'low' | 'medium' | 'high'
  expectedReturn: {
    min: number
    max: number
    typical: number
  }
  minimumAmount: number
  timeHorizon: string
  assets: string[]
  allocation: Record<string, number>
}

export interface ActiveStrategy {
  id: string
  templateId: string
  name: string
  status: 'active' | 'paused' | 'completed'
  currentValue: number
  totalReturn: number
  returnPercent: number
  startDate: number
  lastRebalance: number
}

export interface MockupStrategyProviderService {
  getStrategyTemplates(): Promise<StrategyTemplate[]>
  getActiveStrategies(userId: string): Promise<ActiveStrategy[]>
  getStrategyPerformance(strategyId: string): Promise<any>
  simulateNetworkDelay(minMs?: number, maxMs?: number): Promise<void>
  healthCheck(): Promise<HealthCheckResponse>
}

// Transaction Service Types
export interface TransactionLimits {
  daily: {
    amount: number
    count: number
  }
  monthly: {
    amount: number
    count: number
  }
  perTransaction: {
    min: number
    max: number
  }
}

export interface MockupTransactionLimitsProviderService {
  getTransactionLimits(userId: string): Promise<Record<string, TransactionLimits>>
  getUserTierLimits(tier: string): Promise<Record<string, TransactionLimits>>
  simulateNetworkDelay(minMs?: number, maxMs?: number): Promise<void>
  healthCheck(): Promise<HealthCheckResponse>
}

// Payment Methods Service Types
export interface PaymentMethod {
  id: string
  type: 'credit_card' | 'bank_account' | 'apple_pay' | 'google_pay' | 'paypal'
  displayName: string
  isDefault: boolean
  isVerified: boolean
  last4?: string
  expiryMonth?: number
  expiryYear?: number
  bankName?: string
  accountType?: 'checking' | 'savings'
  addedDate: number
  fees: {
    fixed: number
    percentage: number
  }
}

export interface MockupPaymentMethodsProviderService {
  getPaymentMethods(userId: string): Promise<PaymentMethod[]>
  getAvailablePaymentTypes(): Promise<string[]>
  simulateNetworkDelay(minMs?: number, maxMs?: number): Promise<void>
  healthCheck(): Promise<HealthCheckResponse>
}

// UI Configuration Service Types
export interface UITheme {
  id: string
  name: string
  colors: Record<string, string>
  typography: Record<string, any>
  spacing: Record<string, number>
}

export interface UIConfiguration {
  themes: UITheme[]
  defaultTheme: string
  components: Record<string, any>
  layouts: Record<string, any>
  breakpoints: Record<string, number>
}

export interface MockupUIConfigurationProviderService {
  getUIConfiguration(): Promise<UIConfiguration>
  getThemes(): Promise<UITheme[]>
  simulateNetworkDelay(minMs?: number, maxMs?: number): Promise<void>
  healthCheck(): Promise<HealthCheckResponse>
}

// User Settings Service Types
export interface UserSettings {
  notifications: {
    email: boolean
    push: boolean
    sms: boolean
  }
  privacy: {
    profileVisibility: 'public' | 'private'
    dataSharing: boolean
    analytics: boolean
  }
  trading: {
    confirmationsRequired: boolean
    defaultSlippage: number
    autoRebalance: boolean
  }
  display: {
    theme: 'light' | 'dark' | 'auto'
    language: string
    timezone: string
    currency: string
    dateFormat: string
  }
}

export interface MockupUserSettingsProviderService {
  getUserSettings(userId: string): Promise<UserSettings>
  updateUserSettings(userId: string, settings: Partial<UserSettings>): Promise<UserSettings>
  simulateNetworkDelay(minMs?: number, maxMs?: number): Promise<void>
  healthCheck(): Promise<HealthCheckResponse>
}

// Security Service Types
export interface SecurityPolicy {
  passwordPolicy: {
    minLength: number
    requireUppercase: boolean
    requireLowercase: boolean
    requireNumbers: boolean
    requireSpecialChars: boolean
    expirationDays: number
  }
  sessionPolicy: {
    maxConcurrentSessions: number
    idleTimeout: number
    absoluteTimeout: number
  }
  mfaPolicy: {
    required: boolean
    allowedMethods: string[]
    backupCodesRequired: boolean
  }
  ipRestrictions: {
    enabled: boolean
    allowedCidrs: string[]
  }
}

export interface MockupSecurityPolicyProviderService {
  getSecurityPolicy(): Promise<SecurityPolicy>
  validatePassword(password: string): Promise<{ valid: boolean; errors: string[] }>
  simulateNetworkDelay(minMs?: number, maxMs?: number): Promise<void>
  healthCheck(): Promise<HealthCheckResponse>
}

// Notification Service Types
export interface NotificationTemplate {
  id: string
  type: string
  subject: string
  bodyTemplate: string
  channels: ('email' | 'push' | 'sms')[]
  priority: 'low' | 'medium' | 'high' | 'urgent'
  variables: string[]
}

export interface MockupNotificationTemplateProviderService {
  getNotificationTemplates(): Promise<NotificationTemplate[]>
  getTemplateById(id: string): Promise<NotificationTemplate | null>
  simulateNetworkDelay(minMs?: number, maxMs?: number): Promise<void>
  healthCheck(): Promise<HealthCheckResponse>
}

// Risk Assessment Service Types
export interface RiskProfile {
  id: string
  name: string
  description: string
  riskTolerance: number
  timeHorizon: string
  liquidityNeeds: 'low' | 'medium' | 'high'
  investmentExperience: 'beginner' | 'intermediate' | 'advanced' | 'expert'
  questionnaire: {
    questions: Array<{
      id: string
      question: string
      answer: string | number
      weight: number
    }>
    score: number
    completedAt: number
  }
}

export interface MockupRiskProfileProviderService {
  getRiskProfiles(): Promise<RiskProfile[]>
  getUserRiskProfile(userId: string): Promise<RiskProfile | null>
  assessRisk(answers: Record<string, any>): Promise<{ profile: RiskProfile; score: number }>
  simulateNetworkDelay(minMs?: number, maxMs?: number): Promise<void>
  healthCheck(): Promise<HealthCheckResponse>
}

// Tax Configuration Service Types
export interface TaxConfiguration {
  jurisdiction: string
  taxYear: number
  rates: {
    shortTermCapitalGains: number
    longTermCapitalGains: number
    ordinaryIncome: number
  }
  thresholds: {
    shortTermHoldingPeriod: number
    reportingThreshold: number
  }
  forms: string[]
  deadlines: {
    filing: string
    payment: string
  }
}

export interface MockupTaxConfigProviderService {
  getTaxConfiguration(jurisdiction?: string): Promise<TaxConfiguration>
  getTaxRates(jurisdiction: string, taxYear: number): Promise<any>
  simulateNetworkDelay(minMs?: number, maxMs?: number): Promise<void>
  healthCheck(): Promise<HealthCheckResponse>
}

// Workflow Service Types
export interface WorkflowTemplate {
  id: string
  name: string
  description: string
  category: string
  steps: Array<{
    id: string
    name: string
    type: string
    required: boolean
    dependencies: string[]
    estimatedTime: number
    instructions: string
  }>
  triggers: string[]
  automatable: boolean
}

export interface MockupWorkflowTemplateProviderService {
  getWorkflowTemplates(): Promise<WorkflowTemplate[]>
  getTemplatesByCategory(category: string): Promise<WorkflowTemplate[]>
  simulateNetworkDelay(minMs?: number, maxMs?: number): Promise<void>
  healthCheck(): Promise<HealthCheckResponse>
}

// Export all interface declarations for runtime modules
declare module '../balance/MockupBalanceProviderService.js' {
  export const mockupBalanceProviderService: MockupBalanceProviderService
  export default MockupBalanceProviderService
}

declare module '../marketData/MockupMarketDataProviderService.js' {
  export const mockupMarketDataProviderService: MockupMarketDataProviderService
  export default MockupMarketDataProviderService
}

declare module '../strategies/MockupStrategyProviderService.js' {
  export const mockupStrategyProviderService: MockupStrategyProviderService
  export default MockupStrategyProviderService
}

declare module '../transactions/MockupTransactionLimitsProviderService.js' {
  export const mockupTransactionLimitsProviderService: MockupTransactionLimitsProviderService
  export default MockupTransactionLimitsProviderService
}

declare module '../payments/MockupPaymentMethodsProviderService.js' {
  export const mockupPaymentMethodsProviderService: MockupPaymentMethodsProviderService
  export default MockupPaymentMethodsProviderService
}

declare module '../ui/MockupUIConfigurationProviderService.js' {
  export const mockupUIConfigurationProviderService: MockupUIConfigurationProviderService
  export default MockupUIConfigurationProviderService
}

declare module '../settings/MockupUserSettingsProviderService.js' {
  export const mockupUserSettingsProviderService: MockupUserSettingsProviderService
  export default MockupUserSettingsProviderService
}

declare module '../security/MockupSecurityPolicyProviderService.js' {
  export const mockupSecurityPolicyProviderService: MockupSecurityPolicyProviderService
  export default MockupSecurityPolicyProviderService
}

declare module '../notifications/MockupNotificationTemplateProviderService.js' {
  export const mockupNotificationTemplateProviderService: MockupNotificationTemplateProviderService
  export default MockupNotificationTemplateProviderService
}

declare module '../risk/MockupRiskProfileProviderService.js' {
  export const mockupRiskProfileProviderService: MockupRiskProfileProviderService
  export default MockupRiskProfileProviderService
}

declare module '../tax/MockupTaxConfigProviderService.js' {
  export const mockupTaxConfigProviderService: MockupTaxConfigProviderService
  export default MockupTaxConfigProviderService
}

declare module '../workflows/MockupWorkflowTemplateProviderService.js' {
  export const mockupWorkflowTemplateProviderService: MockupWorkflowTemplateProviderService
  export default MockupWorkflowTemplateProviderService
}