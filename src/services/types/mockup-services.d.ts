/**
 * TypeScript definitions for Mockup Services
 * Provides type safety for all mockup service interfaces
 */

// Common interfaces used across multiple services
export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy'
  timestamp: number
  latency?: number
  error?: string
}

export interface SimulationOptions {
  minMs?: number
  maxMs?: number
}

// Analytics Service Types
export interface KPITarget {
  min: number
  max: number
  current: number
  lastUpdated: number
}

export interface BusinessKPI {
  name: string
  description: string
  formula: string
  target: KPITarget
  unit: string
  frequency: string
  category: string
  importance: 'low' | 'medium' | 'high' | 'critical'
  direction?: 'lower_is_better'
}

export interface TrackingEvent {
  event: string
  description: string
  properties: string[]
  required: string[]
  frequency: 'low' | 'medium' | 'high' | 'very_high'
  retention: number
}

export interface ConversionFunnelStep {
  step: number
  name: string
  event: string
  filters?: Record<string, any>
  target: KPITarget
  conversionTarget: number | KPITarget
  timeOffset?: number
}

export interface ConversionFunnel {
  name: string
  description: string
  steps: ConversionFunnelStep[]
  timeWindow: number
  attribution: 'first_touch' | 'last_touch' | 'linear'
  cohortAnalysis?: boolean
}

export interface AnalyticsInsight {
  id: string
  type: 'positive' | 'negative' | 'neutral'
  confidence: number
  description: string
  recommendation: string
  impact: 'low' | 'medium' | 'high'
  timeframe: string
}

export interface MockupAnalyticsDataProviderService {
  getBusinessKPIDefinitions(): Promise<Record<string, any>>
  getTrackingEventDefinitions(): Promise<Record<string, any>>
  getConversionFunnelDefinitions(): Promise<Record<string, ConversionFunnel>>
  getDashboardMetricConfigurations(): Promise<Record<string, any>>
  getAnalyticsInsights(): Promise<{
    trends: AnalyticsInsight[]
    anomalies: Array<{
      id: string
      severity: 'low' | 'medium' | 'high'
      detected: number
      description: string
      possibleCauses: string[]
      automaticActions: string[]
      requiresReview: boolean
    }>
    predictions: Array<{
      metric: string
      horizon: string
      prediction: number
      confidence: number
      factors: string[]
      range: { lower: number; upper: number }
    }>
    optimizationOpportunities: Array<{
      area: string
      potential: string
      effort: 'low' | 'medium' | 'high'
      impact: 'low' | 'medium' | 'high'
      timeline: string
      requirements: string[]
    }>
  }>
  getAllAnalyticsData(): Promise<any>
  simulateNetworkDelay(minMs?: number, maxMs?: number): Promise<void>
  healthCheck(): Promise<HealthCheckResponse>
}

// Fee Provider Service Types
export interface FeeStructure {
  add: number
  withdraw: number
  send: number
  transfer: number
  buy: number
  sell: number
  invest: number
  start_strategy: number
  stop_strategy: number
}

export interface NetworkFees {
  BTC: number
  ETH: number
  SOL: number
  SUI: number
}

export interface PaymentProviderFees {
  onramp: {
    apple_pay: number
    google_pay: number
    credit_debit_card: number
    bank_account: number
    paypal: number
  }
  offramp: {
    apple_pay: number
    google_pay: number
    credit_debit_card: number
    bank_account: number
    paypal: number
  }
}

export interface DexFees {
  standard: number
  solana: number
}

export interface DefiFees {
  SOL: number
  SUI: number
  ETH: number
  BTC: number
}

export interface MinimumFees {
  network: number
  provider: number
  diboas: number
}

export interface AllFeeData {
  diboas: FeeStructure
  network: NetworkFees
  provider: PaymentProviderFees
  dex: DexFees
  defi: DefiFees
  minimums: MinimumFees
  timestamp: number
}

export interface MockupFeeProviderService {
  getDiBoaSFees(): Promise<FeeStructure>
  getNetworkFees(): Promise<NetworkFees>
  getPaymentProviderFees(): Promise<PaymentProviderFees>
  getDexFees(): Promise<DexFees>
  getDefiFees(): Promise<DefiFees>
  getMinimumFees(): Promise<MinimumFees>
  getAllFeeData(): Promise<AllFeeData>
  getFeesForTransaction(transactionType: string, asset?: string, chain?: string): Promise<any>
  simulateNetworkDelay(minMs?: number, maxMs?: number): Promise<void>
  healthCheck(): Promise<HealthCheckResponse>
}

// Asset Metadata Service Types
export interface AssetBlockchain {
  name: string
  consensusAlgorithm: string
  blockTime: number
  confirmations: number
}

export interface AssetSupply {
  totalSupply: number
  circulatingSupply: number
  maxSupply: number | null
}

export interface AssetMarketData {
  marketCap: number
  volume24h: number
  dominance: number
  rank: number
}

export interface AssetTechnicalData {
  hashrate?: string
  difficulty?: string
  gasPrice?: string
  tps?: string
  networkSecurity: string
  scalability: string
}

export interface AssetRiskMetrics {
  volatilityIndex: number
  liquidityScore: number
  regulatoryRisk: string
  technicalRisk: string
}

export interface AssetMetadata {
  id: string
  symbol: string
  name: string
  description: string
  category: string
  website: string
  whitepaper?: string
  blockchain: AssetBlockchain
  supply: AssetSupply
  marketData: AssetMarketData
  technicalData?: AssetTechnicalData
  riskMetrics: AssetRiskMetrics
}

export interface MarketSector {
  id: string
  name: string
  description: string
  totalMarketCap: number
  assets: string[]
  riskLevel: string
}

export interface RegulatoryCompliance {
  securityStatus: string
  taxTreatment: string
  tradingRestrictions: string[]
  regulatoryClarity: string
  gdprCompliant?: boolean
  micaCompliant?: boolean
}

export interface MockupAssetMetadataProviderService {
  getAssetMetadata(): Promise<Record<string, AssetMetadata>>
  getAssetMetadataById(assetId: string): Promise<AssetMetadata | undefined>
  getAssetsByCategory(category: string): Promise<AssetMetadata[]>
  getTrendingAssets(limit?: number): Promise<AssetMetadata[]>
  getAssetRiskAssessments(): Promise<Record<string, any>>
  getMarketSectors(): Promise<{ sectors: MarketSector[] }>
  getRegulatoryCompliance(): Promise<Record<string, RegulatoryCompliance>>
  getAllAssetMetadataData(): Promise<any>
  simulateNetworkDelay(minMs?: number, maxMs?: number): Promise<void>
  healthCheck(): Promise<HealthCheckResponse>
}

// Authentication Service Types
export interface UserProfile {
  id: string
  email: string
  emailVerified: boolean
  firstName: string
  lastName: string
  phoneNumber?: string
  phoneVerified: boolean
  dateOfBirth?: string
  country: string
  status: 'pending_verification' | 'active' | 'suspended' | 'inactive'
  tier: string
  kycLevel: string
  kycStatus: string
  mfaEnabled: boolean
  mfaMethods: string[]
  roles: string[]
  permissions: string[]
  createdAt: number
  lastLogin?: number
  loginCount: number
  riskScore: number
  preferences: {
    language: string
    timezone: string
    currency: string
    marketingOptIn: boolean
    notifications: any
    privacy: any
  }
  acceptedTerms: {
    accepted: boolean
    version: string
    timestamp: number | null
  }
  acceptedPrivacy: {
    accepted: boolean
    version: string
    timestamp: number | null
  }
}

export interface AuthenticationResult {
  success: boolean
  error?: string
  message?: string
  requiresMFA?: boolean
  mfaChallenge?: MFAChallenge
  challengeId?: string
  session?: UserSession
  user?: UserProfile
  tokens?: {
    accessToken: string
    refreshToken: string
    expiresIn: number
    tokenType: string
  }
  permissions?: string[]
  roles?: string[]
  timestamp: number
}

export interface MFAChallenge {
  challengeId: string
  method: string
  expiresAt: number
  attemptsRemaining: number
  phoneNumber?: string
  emailAddress?: string
  message: string
}

export interface UserSession {
  sessionId: string
  userId: string
  accessToken: string
  refreshToken: string
  expiresAt: number
  refreshExpiresAt: number
  createdAt: number
  lastActivity: number
  lastRefreshed?: number
  deviceInfo: {
    fingerprint?: string
    ipAddress?: string
    userAgent?: string
    trusted: boolean
  }
  expiresIn: number
}

export interface RegistrationData {
  email: string
  password: string
  firstName: string
  lastName: string
  phoneNumber?: string
  dateOfBirth?: string
  country?: string
  acceptedTerms: boolean
  acceptedPrivacy: boolean
  marketingOptIn?: boolean
}

export interface MockupAuthenticationProviderService {
  authenticateUser(email: string, password: string, options?: any): Promise<AuthenticationResult>
  registerUser(userData: RegistrationData, options?: any): Promise<AuthenticationResult>
  initiateMFAChallenge(email: string, methods?: string[]): Promise<MFAChallenge>
  validateMFAToken(challengeId: string, token: string): Promise<boolean>
  refreshAuthenticationToken(refreshToken: string): Promise<AuthenticationResult>
  logoutUser(sessionId: string, options?: any): Promise<{ success: boolean; message: string; timestamp: number }>
  getUserInfo(sessionId: string): Promise<AuthenticationResult>
  getAllAuthenticationData(): Promise<any>
  simulateNetworkDelay(minMs?: number, maxMs?: number): Promise<void>
  healthCheck(): Promise<HealthCheckResponse>
}

// Configuration Service Types
export interface EnvironmentConfig {
  environment: string
  debug: boolean
  apiUrl: string
  websocketUrl: string
  enableLogging: boolean
  logLevel: string
  enableMockData: boolean
  enableTestingFeatures: boolean
  rateLimit: {
    enabled: boolean
    maxRequests: number
    windowMs: number
  }
  security: {
    enableCORS: boolean
    allowedOrigins: string[]
    enableHTTPS: boolean
    csrfProtection: boolean
  }
  database: {
    host: string
    port: number
    ssl: boolean
    poolSize: number
  }
  cache: {
    enabled: boolean
    ttl: number
    maxSize: number
  }
  integrations: {
    enableExternalAPIs: boolean
    timeout: number
    retries: number
  }
}

export interface FeatureFlag {
  enabled: boolean
  rolloutPercentage: number
  description: string
}

export interface RegionalConfig {
  region: string
  currency: string
  timezone: string
  locale: string
  dateFormat: string
  numberFormat: string
  marketHours: {
    open: string
    close: string
    timezone: string
  }
  compliance: {
    kycRequired: boolean
    amlThreshold: number
    taxReporting: boolean
    accreditedInvestorCheck?: boolean
    gdprCompliant?: boolean
    micaCompliant?: boolean
    localLicenseRequired?: boolean
  }
  supportedAssets: string[]
  restrictedFeatures: string[]
  localizations: {
    language: string
    helpUrl: string
    legalUrl: string
  }
}

export interface ApplicationLimits {
  api: {
    rateLimit: number
    burstLimit: number
    timeout: number
    maxPayloadSize: string
  }
  transactions: {
    maxConcurrent: number
    queueSize: number
    processingTimeout: number
    retryAttempts: number
  }
  database: {
    maxConnections: number
    queryTimeout: number
    maxQuerySize: string
    connectionTimeout: number
  }
  cache: {
    maxMemory: string
    evictionPolicy: string
    ttlDefault: number
    maxKeySize: string
  }
  files: {
    maxUploadSize: string
    allowedTypes: string[]
    maxConcurrentUploads: number
    storageQuota: string
  }
}

export interface MonitoringConfig {
  metrics: {
    collectionInterval: number
    retentionPeriod: number
    enabledMetrics: string[]
  }
  alerts: {
    errorRateThreshold: number
    responseTimeThreshold: number
    availabilityThreshold: number
    diskSpaceThreshold: number
    memoryThreshold: number
  }
  logging: {
    level: string
    retention: number
    enableStructuredLogs: boolean
    enableQueryLogging: boolean
    enablePerformanceLogging: boolean
  }
  healthChecks: {
    interval: number
    timeout: number
    endpoints: string[]
  }
}

export interface MockupConfigurationProviderService {
  getEnvironmentConfig(environment?: string): Promise<EnvironmentConfig>
  getFeatureFlags(userId?: string, environment?: string): Promise<Record<string, FeatureFlag>>
  getRegionalConfig(region?: string): Promise<RegionalConfig>
  getApplicationLimits(): Promise<ApplicationLimits>
  getMonitoringConfig(): Promise<MonitoringConfig>
  getAllConfigurationData(environment?: string, region?: string, userId?: string): Promise<any>
  validateConfiguration(config: any): Promise<{ isValid: boolean; errors: string[]; warnings: string[] }>
  simulateNetworkDelay(minMs?: number, maxMs?: number): Promise<void>
  healthCheck(): Promise<HealthCheckResponse>
}

// Export singleton instances (for runtime use)
declare module '../analytics/MockupAnalyticsDataProviderService.js' {
  export const mockupAnalyticsDataProviderService: MockupAnalyticsDataProviderService
  export default MockupAnalyticsDataProviderService
}

declare module '../fees/MockupFeeProviderService.js' {
  export const mockupFeeProviderService: MockupFeeProviderService
  export default MockupFeeProviderService
}

declare module '../assets/MockupAssetMetadataProviderService.js' {
  export const mockupAssetMetadataProviderService: MockupAssetMetadataProviderService
  export default MockupAssetMetadataProviderService
}

declare module '../auth/MockupAuthenticationProviderService.js' {
  export const mockupAuthenticationProviderService: MockupAuthenticationProviderService
  export default MockupAuthenticationProviderService
}

declare module '../config/MockupConfigurationProviderService.js' {
  export const mockupConfigurationProviderService: MockupConfigurationProviderService
  export default MockupConfigurationProviderService
}