/**
 * Security Monitoring Service
 * Real-time security threat detection, audit logging, and compliance monitoring
 */

import logger from '../../utils/logger.js'
import secureLogger from '../../utils/secureLogger.js'

export const THREAT_TYPES = {
  SQL_INJECTION: 'sql_injection',
  XSS_ATTEMPT: 'xss_attempt',
  CSRF_ATTACK: 'csrf_attack',
  BRUTE_FORCE: 'brute_force',
  SUSPICIOUS_ACTIVITY: 'suspicious_activity',
  DATA_BREACH: 'data_breach',
  UNAUTHORIZED_ACCESS: 'unauthorized_access',
  ANOMALY_DETECTED: 'anomaly_detected',
  RATE_LIMIT_EXCEEDED: 'rate_limit_exceeded',
  MALICIOUS_PAYLOAD: 'malicious_payload'
}

export const SECURITY_LEVELS = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info'
}

export const AUDIT_EVENTS = {
  LOGIN_SUCCESS: 'login_success',
  LOGIN_FAILURE: 'login_failure',
  LOGOUT: 'logout',
  PASSWORD_CHANGE: 'password_change',
  ACCOUNT_LOCKED: 'account_locked',
  PRIVILEGE_ESCALATION: 'privilege_escalation',
  DATA_ACCESS: 'data_access',
  DATA_MODIFICATION: 'data_modification',
  CONFIGURATION_CHANGE: 'configuration_change',
  SECURITY_POLICY_VIOLATION: 'security_policy_violation'
}

class SecurityMonitoringService {
  constructor() {
    this.threats = new Map()
    this.auditLog = new Map()
    this.securityAlerts = new Map()
    this.anomalyDetectors = new Map()
    this.riskProfiles = new Map()
    
    // Security metrics
    this.securityMetrics = new Map()
    this.complianceChecks = new Map()
    this.vulnerabilityScans = new Map()
    
    // Rate limiting and pattern detection
    this.rateLimiters = new Map()
    this.suspiciousPatterns = new Map()
    this.ipBlacklist = new Set()
    this.sessionTracking = new Map()
    
    // Configuration
    this.config = {
      maxLoginAttempts: 5,
      lockoutDuration: 15 * 60 * 1000, // 15 minutes
      sessionTimeout: 30 * 60 * 1000, // 30 minutes
      anomalyThreshold: 0.8,
      auditRetention: 90 * 24 * 60 * 60 * 1000, // 90 days
      alertCooldown: 5 * 60 * 1000 // 5 minutes
    }
    
    this.initializeAnomalyDetectors()
    this.initializeComplianceChecks()
    this.startSecurityMonitoring()
    
    logger.info('Security monitoring service initialized')
  }

  /**
   * Initialize anomaly detection models
   */
  initializeAnomalyDetectors() {
    // Login pattern anomaly detector
    this.anomalyDetectors.set('login_patterns', {
      name: 'Login Pattern Anomaly Detection',
      baseline: {
        avgLoginTime: 3000, // 3 seconds
        commonLocations: ['US', 'CA', 'GB'],
        typicalHours: [8, 9, 10, 11, 12, 13, 14, 15, 16, 17], // Business hours
        deviceFingerprints: new Set()
      },
      threshold: 0.7,
      enabled: true
    })

    // Transaction pattern anomaly detector
    this.anomalyDetectors.set('transaction_patterns', {
      name: 'Transaction Pattern Anomaly Detection',
      baseline: {
        avgAmount: 1000,
        maxDailyAmount: 10000,
        commonCurrencies: ['USD', 'EUR', 'GBP'],
        typicalFrequency: 5 // transactions per day
      },
      threshold: 0.8,
      enabled: true
    })

    // API usage anomaly detector
    this.anomalyDetectors.set('api_usage', {
      name: 'API Usage Anomaly Detection',
      baseline: {
        requestsPerMinute: 10,
        commonEndpoints: ['/api/balance', '/api/transactions', '/api/account'],
        errorRateThreshold: 0.05
      },
      threshold: 0.6,
      enabled: true
    })

    // Data access anomaly detector
    this.anomalyDetectors.set('data_access', {
      name: 'Data Access Anomaly Detection',
      baseline: {
        recordsPerQuery: 100,
        sensitiveDataAccess: 2, // per hour
        offHoursAccess: false
      },
      threshold: 0.75,
      enabled: true
    })
  }

  /**
   * Initialize compliance checks
   */
  initializeComplianceChecks() {
    // GDPR compliance
    this.complianceChecks.set('gdpr', {
      name: 'GDPR Compliance',
      checks: {
        dataRetention: true,
        consentTracking: true,
        rightToErasure: true,
        dataPortability: true,
        breachNotification: true
      },
      score: 0,
      lastCheck: null
    })

    // PCI DSS compliance (for financial data)
    this.complianceChecks.set('pci_dss', {
      name: 'PCI DSS Compliance',
      checks: {
        dataEncryption: true,
        accessControl: true,
        networkSecurity: true,
        vulnerabilityManagement: true,
        secureSystemDevelopment: true,
        regularMonitoring: true
      },
      score: 0,
      lastCheck: null
    })

    // SOX compliance (financial reporting)
    this.complianceChecks.set('sox', {
      name: 'SOX Compliance',
      checks: {
        financialReporting: true,
        internalControls: true,
        auditTrail: true,
        accessLogging: true,
        dataIntegrity: true
      },
      score: 0,
      lastCheck: null
    })
  }

  /**
   * Start security monitoring
   */
  startSecurityMonitoring() {
    // Start periodic security scans
    this.securityScanInterval = setInterval(() => {
      this.performSecurityScan()
    }, 5 * 60 * 1000) // Every 5 minutes

    // Start compliance monitoring
    this.complianceInterval = setInterval(() => {
      this.runComplianceChecks()
    }, 60 * 60 * 1000) // Every hour

    // Start anomaly detection
    this.anomalyInterval = setInterval(() => {
      this.detectAnomalies()
    }, 2 * 60 * 1000) // Every 2 minutes

    // Cleanup old data
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldData()
    }, 24 * 60 * 60 * 1000) // Daily

    logger.info('Security monitoring started')
  }

  /**
   * Stop security monitoring
   */
  stopSecurityMonitoring() {
    if (this.securityScanInterval) {
      clearInterval(this.securityScanInterval)
      this.securityScanInterval = null
    }
    if (this.complianceInterval) {
      clearInterval(this.complianceInterval)
      this.complianceInterval = null
    }
    if (this.anomalyInterval) {
      clearInterval(this.anomalyInterval)
      this.anomalyInterval = null
    }
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = null
    }

    logger.info('Security monitoring stopped')
  }

  /**
   * Record security threat
   */
  recordThreat(threatType, severity, details = {}) {
    const threatId = `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const threat = {
      id: threatId,
      type: threatType,
      severity,
      details,
      timestamp: Date.now(),
      resolved: false,
      investigationStatus: 'pending',
      source: details.source || 'unknown',
      target: details.target || 'unknown',
      impact: this.assessThreatImpact(threatType, severity, details)
    }

    this.threats.set(threatId, threat)

    // Create security alert
    this.createSecurityAlert(
      severity,
      `Security Threat Detected: ${threatType}`,
      this.getThreatDescription(threatType, details),
      { threatId, ...details }
    )

    // Log to secure audit trail
    secureLogger.audit('SECURITY_THREAT_DETECTED', {
      threatId,
      type: threatType,
      severity,
      source: threat.source,
      target: threat.target,
      impact: threat.impact
    })

    // Auto-respond to critical threats
    if (severity === SECURITY_LEVELS.CRITICAL) {
      this.autoRespondToThreat(threat)
    }

    return threat
  }

  /**
   * Record audit event
   */
  recordAuditEvent(eventType, userId, details = {}) {
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const auditEvent = {
      id: auditId,
      eventType,
      userId,
      details,
      timestamp: Date.now(),
      sessionId: details.sessionId || null,
      ipAddress: details.ipAddress || 'unknown',
      userAgent: details.userAgent || 'unknown',
      outcome: details.outcome || 'success',
      riskScore: this.calculateEventRiskScore(eventType, userId, details)
    }

    this.auditLog.set(auditId, auditEvent)

    // Check for suspicious patterns
    this.analyzeSuspiciousPatterns(auditEvent)

    // Update security metrics
    this.updateSecurityMetrics(auditEvent)

    // Log to secure audit trail
    secureLogger.audit('AUDIT_EVENT', {
      auditId,
      eventType,
      userId,
      outcome: auditEvent.outcome,
      riskScore: auditEvent.riskScore
    })

    return auditEvent
  }

  /**
   * Check for authentication anomalies
   */
  checkAuthenticationAnomaly(userId, authDetails) {
    const detector = this.anomalyDetectors.get('login_patterns')
    if (!detector || !detector.enabled) return { anomaly: false, score: 0 }

    let anomalyScore = 0
    const factors = []

    // Check login time anomaly
    const loginDuration = authDetails.duration || 0
    if (loginDuration > detector.baseline.avgLoginTime * 3) {
      anomalyScore += 0.3
      factors.push('unusual_login_duration')
    }

    // Check location anomaly
    const location = authDetails.location || 'unknown'
    if (!detector.baseline.commonLocations.includes(location)) {
      anomalyScore += 0.4
      factors.push('unusual_location')
    }

    // Check time of day anomaly
    const hour = new Date().getHours()
    if (!detector.baseline.typicalHours.includes(hour)) {
      anomalyScore += 0.2
      factors.push('unusual_time')
    }

    // Check device fingerprint
    const deviceFingerprint = authDetails.deviceFingerprint
    if (deviceFingerprint && !detector.baseline.deviceFingerprints.has(deviceFingerprint)) {
      anomalyScore += 0.3
      factors.push('new_device')
      // Add to known devices if legitimate
      if (anomalyScore < detector.threshold) {
        detector.baseline.deviceFingerprints.add(deviceFingerprint)
      }
    }

    const isAnomaly = anomalyScore >= detector.threshold

    if (isAnomaly) {
      this.recordThreat(
        THREAT_TYPES.ANOMALY_DETECTED,
        anomalyScore > 0.9 ? SECURITY_LEVELS.HIGH : SECURITY_LEVELS.MEDIUM,
        {
          userId,
          anomalyType: 'authentication',
          factors,
          score: anomalyScore,
          ...authDetails
        }
      )
    }

    return { anomaly: isAnomaly, score: anomalyScore, factors }
  }

  /**
   * Check for transaction anomalies
   */
  checkTransactionAnomaly(userId, transactionDetails) {
    const detector = this.anomalyDetectors.get('transaction_patterns')
    if (!detector || !detector.enabled) return { anomaly: false, score: 0 }

    let anomalyScore = 0
    const factors = []

    // Check amount anomaly
    const amount = transactionDetails.amount || 0
    const userProfile = this.getUserRiskProfile(userId)
    const avgAmount = userProfile.avgTransactionAmount || detector.baseline.avgAmount

    if (amount > avgAmount * 10) {
      anomalyScore += 0.5
      factors.push('unusually_large_amount')
    }

    // Check daily limit anomaly
    const dailyTotal = this.getDailyTransactionTotal(userId)
    if (dailyTotal + amount > detector.baseline.maxDailyAmount) {
      anomalyScore += 0.4
      factors.push('daily_limit_exceeded')
    }

    // Check currency anomaly
    const currency = transactionDetails.currency
    if (currency && !detector.baseline.commonCurrencies.includes(currency)) {
      anomalyScore += 0.2
      factors.push('unusual_currency')
    }

    // Check frequency anomaly
    const recentTransactionCount = this.getRecentTransactionCount(userId, 24 * 60 * 60 * 1000)
    if (recentTransactionCount > detector.baseline.typicalFrequency * 3) {
      anomalyScore += 0.3
      factors.push('high_frequency')
    }

    const isAnomaly = anomalyScore >= detector.threshold

    if (isAnomaly) {
      this.recordThreat(
        THREAT_TYPES.ANOMALY_DETECTED,
        anomalyScore > 0.9 ? SECURITY_LEVELS.HIGH : SECURITY_LEVELS.MEDIUM,
        {
          userId,
          anomalyType: 'transaction',
          factors,
          score: anomalyScore,
          ...transactionDetails
        }
      )
    }

    return { anomaly: isAnomaly, score: anomalyScore, factors }
  }

  /**
   * Detect SQL injection attempts
   */
  detectSQLInjection(input, context = {}) {
    const sqlPatterns = [
      /(\bUNION\s+SELECT\b)/i,
      /(\bSELECT\s+.*\bFROM\b)/i,
      /(\bINSERT\s+INTO\b)/i,
      /(\bDROP\s+TABLE\b)/i,
      /(\bDELETE\s+FROM\b)/i,
      /(\bUPDATE\s+.*\bSET\b)/i,
      /(;.*--)/i,
      /(\bOR\s+1=1\b)/i,
      /(\bAND\s+1=1\b)/i,
      /('.*OR.*'=')/i
    ]

    const detectedPatterns = []
    let riskScore = 0

    for (const pattern of sqlPatterns) {
      if (pattern.test(input)) {
        detectedPatterns.push(pattern.source)
        riskScore += 0.3
      }
    }

    if (detectedPatterns.length > 0) {
      this.recordThreat(
        THREAT_TYPES.SQL_INJECTION,
        riskScore > 0.6 ? SECURITY_LEVELS.HIGH : SECURITY_LEVELS.MEDIUM,
        {
          input: input.substring(0, 200), // Truncate for logging
          patterns: detectedPatterns,
          riskScore,
          context
        }
      )

      return { detected: true, patterns: detectedPatterns, riskScore }
    }

    return { detected: false, patterns: [], riskScore: 0 }
  }

  /**
   * Detect XSS attempts
   */
  detectXSS(input, context = {}) {
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/gi,
      /on\w+\s*=/gi,
      /<iframe[^>]*>/gi,
      /<object[^>]*>/gi,
      /<embed[^>]*>/gi,
      /eval\s*\(/gi,
      /alert\s*\(/gi,
      /document\.cookie/gi,
      /window\.location/gi
    ]

    const detectedPatterns = []
    let riskScore = 0

    for (const pattern of xssPatterns) {
      if (pattern.test(input)) {
        detectedPatterns.push(pattern.source)
        riskScore += 0.4
      }
    }

    if (detectedPatterns.length > 0) {
      this.recordThreat(
        THREAT_TYPES.XSS_ATTEMPT,
        riskScore > 0.8 ? SECURITY_LEVELS.HIGH : SECURITY_LEVELS.MEDIUM,
        {
          input: input.substring(0, 200),
          patterns: detectedPatterns,
          riskScore,
          context
        }
      )

      return { detected: true, patterns: detectedPatterns, riskScore }
    }

    return { detected: false, patterns: [], riskScore: 0 }
  }

  /**
   * Check rate limiting
   */
  checkRateLimit(identifier, limit = 100, windowMs = 60000) {
    const now = Date.now()
    const windowStart = now - windowMs

    if (!this.rateLimiters.has(identifier)) {
      this.rateLimiters.set(identifier, [])
    }

    const requests = this.rateLimiters.get(identifier)
    
    // Remove old requests outside window
    while (requests.length > 0 && requests[0] < windowStart) {
      requests.shift()
    }

    // Check if limit exceeded
    if (requests.length >= limit) {
      this.recordThreat(
        THREAT_TYPES.RATE_LIMIT_EXCEEDED,
        SECURITY_LEVELS.MEDIUM,
        {
          identifier,
          requestCount: requests.length,
          limit,
          windowMs,
          timeUntilReset: windowMs - (now - requests[0])
        }
      )

      return { allowed: false, remaining: 0, resetTime: requests[0] + windowMs }
    }

    // Add current request
    requests.push(now)

    return { allowed: true, remaining: limit - requests.length, resetTime: requests[0] + windowMs }
  }

  /**
   * Assess threat impact
   */
  assessThreatImpact(threatType, severity, details) {
    const impactFactors = {
      [THREAT_TYPES.SQL_INJECTION]: { confidentiality: 0.9, integrity: 0.8, availability: 0.3 },
      [THREAT_TYPES.XSS_ATTEMPT]: { confidentiality: 0.7, integrity: 0.6, availability: 0.2 },
      [THREAT_TYPES.BRUTE_FORCE]: { confidentiality: 0.8, integrity: 0.2, availability: 0.4 },
      [THREAT_TYPES.DATA_BREACH]: { confidentiality: 1.0, integrity: 0.7, availability: 0.5 },
      [THREAT_TYPES.UNAUTHORIZED_ACCESS]: { confidentiality: 0.9, integrity: 0.8, availability: 0.3 }
    }

    const factors = impactFactors[threatType] || { confidentiality: 0.5, integrity: 0.5, availability: 0.5 }
    const severityMultiplier = {
      [SECURITY_LEVELS.CRITICAL]: 1.0,
      [SECURITY_LEVELS.HIGH]: 0.8,
      [SECURITY_LEVELS.MEDIUM]: 0.6,
      [SECURITY_LEVELS.LOW]: 0.4,
      [SECURITY_LEVELS.INFO]: 0.2
    }

    const multiplier = severityMultiplier[severity] || 0.5

    return {
      confidentiality: Math.round(factors.confidentiality * multiplier * 100),
      integrity: Math.round(factors.integrity * multiplier * 100),
      availability: Math.round(factors.availability * multiplier * 100),
      overall: Math.round(((factors.confidentiality + factors.integrity + factors.availability) / 3) * multiplier * 100)
    }
  }

  /**
   * Auto-respond to critical threats
   */
  autoRespondToThreat(threat) {
    const responses = {
      [THREAT_TYPES.SQL_INJECTION]: () => {
        logger.warn('Auto-blocking SQL injection attempt')
        // Add to blacklist temporarily
        if (threat.details.source) {
          this.ipBlacklist.add(threat.details.source)
          setTimeout(() => this.ipBlacklist.delete(threat.details.source), 60 * 60 * 1000) // 1 hour
        }
      },
      [THREAT_TYPES.BRUTE_FORCE]: () => {
        logger.warn('Auto-blocking brute force attempt')
        if (threat.details.userId) {
          this.lockAccount(threat.details.userId, this.config.lockoutDuration)
        }
      },
      [THREAT_TYPES.DATA_BREACH]: () => {
        logger.error('Data breach detected - triggering incident response')
        this.triggerIncidentResponse(threat)
      }
    }

    const response = responses[threat.type]
    if (response) {
      response()
      
      // Log auto-response
      secureLogger.audit('AUTO_RESPONSE_TRIGGERED', {
        threatId: threat.id,
        threatType: threat.type,
        responseType: 'automatic'
      })
    }
  }

  /**
   * Perform security scan
   */
  performSecurityScan() {
    const scanId = `scan_${Date.now()}`
    const scanResults = {
      id: scanId,
      timestamp: Date.now(),
      vulnerabilities: [],
      compliance: {},
      recommendations: []
    }

    // Check for common vulnerabilities
    this.checkCommonVulnerabilities(scanResults)
    
    // Update security metrics
    this.updateSecurityScanMetrics(scanResults)

    this.vulnerabilityScans.set(scanId, scanResults)

    if (scanResults.vulnerabilities.length > 0) {
      logger.warn(`Security scan found ${scanResults.vulnerabilities.length} vulnerabilities`)
    }

    return scanResults
  }

  /**
   * Run compliance checks
   */
  runComplianceChecks() {
    for (const [complianceType, check] of this.complianceChecks) {
      const score = this.calculateComplianceScore(complianceType, check)
      check.score = score
      check.lastCheck = Date.now()

      if (score < 80) {
        this.createSecurityAlert(
          SECURITY_LEVELS.MEDIUM,
          `Compliance Issue: ${check.name}`,
          `Compliance score is ${score}% (below 80% threshold)`,
          { complianceType, score, checks: check.checks }
        )
      }

      this.complianceChecks.set(complianceType, check)
    }
  }

  /**
   * Create security alert
   */
  createSecurityAlert(level, title, message, metadata = {}) {
    const alertId = `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const alert = {
      id: alertId,
      level,
      title,
      message,
      metadata,
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false
    }

    this.securityAlerts.set(alertId, alert)

    // Log alert
    const logLevel = level === SECURITY_LEVELS.CRITICAL ? 'error' : 
                     level === SECURITY_LEVELS.HIGH ? 'warn' : 'info'
    logger[logLevel](`Security Alert [${level}]: ${title}`, { message, metadata })

    return alert
  }

  /**
   * Get security dashboard data
   */
  getSecurityDashboard() {
    const now = Date.now()
    const last24h = now - (24 * 60 * 60 * 1000)
    const last7d = now - (7 * 24 * 60 * 60 * 1000)

    // Get recent threats
    const recentThreats = Array.from(this.threats.values())
      .filter(threat => threat.timestamp > last24h)
      .sort((a, b) => b.timestamp - a.timestamp)

    // Get recent alerts
    const recentAlerts = Array.from(this.securityAlerts.values())
      .filter(alert => alert.timestamp > last24h)
      .sort((a, b) => b.timestamp - a.timestamp)

    // Calculate security metrics
    const securityScore = this.calculateSecurityScore()
    const threatStats = this.calculateThreatStatistics(last7d)
    const complianceOverview = this.getComplianceOverview()

    return {
      securityScore,
      threatStats,
      recentThreats: recentThreats.slice(0, 10),
      recentAlerts: recentAlerts.slice(0, 10),
      complianceOverview,
      riskProfile: this.getOverallRiskProfile(),
      recommendations: this.generateSecurityRecommendations(),
      lastUpdated: new Date().toISOString()
    }
  }

  /**
   * Calculate overall security score
   */
  calculateSecurityScore() {
    let score = 100
    const now = Date.now()
    const last24h = now - (24 * 60 * 60 * 1000)

    // Deduct for recent threats
    const recentThreats = Array.from(this.threats.values())
      .filter(threat => threat.timestamp > last24h && !threat.resolved)

    recentThreats.forEach(threat => {
      const severityDeduction = {
        [SECURITY_LEVELS.CRITICAL]: 25,
        [SECURITY_LEVELS.HIGH]: 15,
        [SECURITY_LEVELS.MEDIUM]: 8,
        [SECURITY_LEVELS.LOW]: 3,
        [SECURITY_LEVELS.INFO]: 1
      }
      score -= severityDeduction[threat.severity] || 5
    })

    // Consider compliance scores
    const complianceScores = Array.from(this.complianceChecks.values())
      .map(check => check.score)
      .filter(score => score > 0)

    if (complianceScores.length > 0) {
      const avgCompliance = complianceScores.reduce((sum, score) => sum + score, 0) / complianceScores.length
      score = score * (avgCompliance / 100)
    }

    return Math.max(0, Math.round(score))
  }

  /**
   * Helper methods for data analysis and management
   */
  getUserRiskProfile(userId) {
    return this.riskProfiles.get(userId) || {
      riskScore: 0.5,
      avgTransactionAmount: 1000,
      loginFrequency: 5,
      lastActivity: Date.now()
    }
  }

  getDailyTransactionTotal(userId) {
    // Mock implementation - would query actual transaction data
    return Math.random() * 5000
  }

  getRecentTransactionCount(userId, timeWindow) {
    // Mock implementation - would query actual transaction data
    return Math.floor(Math.random() * 10)
  }

  analyzeSuspiciousPatterns(auditEvent) {
    // Pattern analysis logic would go here
    // For now, just track patterns
    const patternKey = `${auditEvent.eventType}_${auditEvent.userId}`
    if (!this.suspiciousPatterns.has(patternKey)) {
      this.suspiciousPatterns.set(patternKey, [])
    }
    this.suspiciousPatterns.get(patternKey).push(auditEvent.timestamp)
  }

  updateSecurityMetrics(auditEvent) {
    const metricKey = `${auditEvent.eventType}_count`
    const currentCount = this.securityMetrics.get(metricKey) || 0
    this.securityMetrics.set(metricKey, currentCount + 1)
  }

  checkCommonVulnerabilities(scanResults) {
    // Mock vulnerability checks
    const commonVulns = [
      { type: 'outdated_dependencies', severity: 'medium', count: Math.floor(Math.random() * 5) },
      { type: 'weak_encryption', severity: 'high', count: Math.floor(Math.random() * 2) },
      { type: 'insecure_headers', severity: 'low', count: Math.floor(Math.random() * 3) }
    ]

    commonVulns.forEach(vuln => {
      if (vuln.count > 0) {
        scanResults.vulnerabilities.push(vuln)
      }
    })
  }

  updateSecurityScanMetrics(scanResults) {
    this.securityMetrics.set('last_scan_timestamp', scanResults.timestamp)
    this.securityMetrics.set('vulnerabilities_found', scanResults.vulnerabilities.length)
  }

  calculateComplianceScore(complianceType, check) {
    const enabledChecks = Object.values(check.checks).filter(Boolean).length
    const totalChecks = Object.keys(check.checks).length
    return Math.round((enabledChecks / totalChecks) * 100)
  }

  calculateThreatStatistics(timeWindow) {
    const threats = Array.from(this.threats.values())
      .filter(threat => threat.timestamp > Date.now() - timeWindow)

    const stats = {
      total: threats.length,
      critical: threats.filter(t => t.severity === SECURITY_LEVELS.CRITICAL).length,
      high: threats.filter(t => t.severity === SECURITY_LEVELS.HIGH).length,
      medium: threats.filter(t => t.severity === SECURITY_LEVELS.MEDIUM).length,
      low: threats.filter(t => t.severity === SECURITY_LEVELS.LOW).length,
      resolved: threats.filter(t => t.resolved).length,
      byType: {}
    }

    // Count by type
    threats.forEach(threat => {
      stats.byType[threat.type] = (stats.byType[threat.type] || 0) + 1
    })

    return stats
  }

  getComplianceOverview() {
    const overview = {}
    for (const [type, check] of this.complianceChecks) {
      overview[type] = {
        name: check.name,
        score: check.score,
        lastCheck: check.lastCheck
      }
    }
    return overview
  }

  getOverallRiskProfile() {
    const riskProfiles = Array.from(this.riskProfiles.values())
    if (riskProfiles.length === 0) return { overall: 'low', score: 0.2 }

    const avgRisk = riskProfiles.reduce((sum, profile) => sum + profile.riskScore, 0) / riskProfiles.length
    
    let riskLevel
    if (avgRisk > 0.8) riskLevel = 'critical'
    else if (avgRisk > 0.6) riskLevel = 'high'
    else if (avgRisk > 0.4) riskLevel = 'medium'
    else riskLevel = 'low'

    return { overall: riskLevel, score: avgRisk }
  }

  generateSecurityRecommendations() {
    const recommendations = []
    const recentThreats = Array.from(this.threats.values())
      .filter(threat => threat.timestamp > Date.now() - (24 * 60 * 60 * 1000))

    if (recentThreats.length > 5) {
      recommendations.push({
        priority: 'high',
        category: 'Threat Response',
        title: 'High Threat Activity Detected',
        description: `${recentThreats.length} threats detected in the last 24 hours. Consider implementing additional security measures.`
      })
    }

    // Check compliance scores
    for (const [type, check] of this.complianceChecks) {
      if (check.score < 80) {
        recommendations.push({
          priority: 'medium',
          category: 'Compliance',
          title: `Improve ${check.name} Compliance`,
          description: `Current score: ${check.score}%. Review and update compliance controls.`
        })
      }
    }

    return recommendations.slice(0, 5) // Limit to top 5
  }

  calculateEventRiskScore(eventType, userId, details) {
    // Simple risk scoring based on event type
    const baseScores = {
      [AUDIT_EVENTS.LOGIN_FAILURE]: 0.3,
      [AUDIT_EVENTS.LOGIN_SUCCESS]: 0.1,
      [AUDIT_EVENTS.PRIVILEGE_ESCALATION]: 0.8,
      [AUDIT_EVENTS.DATA_MODIFICATION]: 0.5,
      [AUDIT_EVENTS.SECURITY_POLICY_VIOLATION]: 0.7
    }

    return baseScores[eventType] || 0.2
  }

  getThreatDescription(threatType, details) {
    const descriptions = {
      [THREAT_TYPES.SQL_INJECTION]: 'Potential SQL injection attack detected',
      [THREAT_TYPES.XSS_ATTEMPT]: 'Cross-site scripting attempt identified',
      [THREAT_TYPES.BRUTE_FORCE]: 'Brute force attack detected',
      [THREAT_TYPES.ANOMALY_DETECTED]: 'Unusual activity pattern detected',
      [THREAT_TYPES.RATE_LIMIT_EXCEEDED]: 'Rate limit exceeded - potential DoS attempt'
    }

    return descriptions[threatType] || 'Security threat detected'
  }

  lockAccount(userId, duration) {
    // Implementation would lock user account
    logger.warn(`Account ${userId} locked for ${duration}ms due to security threat`)
  }

  triggerIncidentResponse(threat) {
    // Implementation would trigger incident response procedures
    logger.error('Incident response triggered for threat:', threat.id)
  }

  detectAnomalies() {
    // Run anomaly detection algorithms
    // This would analyze patterns in audit logs and detect unusual behavior
  }

  cleanupOldData() {
    const cutoffTime = Date.now() - this.config.auditRetention
    
    // Clean old audit logs
    for (const [id, event] of this.auditLog) {
      if (event.timestamp < cutoffTime) {
        this.auditLog.delete(id)
      }
    }

    // Clean old threats
    for (const [id, threat] of this.threats) {
      if (threat.timestamp < cutoffTime && threat.resolved) {
        this.threats.delete(id)
      }
    }

    logger.debug('Security monitoring data cleanup completed')
  }

  /**
   * Get recent security alerts
   */
  getRecentAlerts(limit = 20) {
    return Array.from(this.securityAlerts.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Get threat by ID
   */
  getThreat(threatId) {
    return this.threats.get(threatId)
  }

  /**
   * Resolve threat
   */
  resolveThreat(threatId, resolution = {}) {
    const threat = this.threats.get(threatId)
    if (threat) {
      threat.resolved = true
      threat.resolvedAt = Date.now()
      threat.resolution = resolution
      
      secureLogger.audit('THREAT_RESOLVED', {
        threatId,
        resolvedBy: resolution.resolvedBy || 'system',
        resolution: resolution.action || 'manual'
      })
    }
    return threat
  }

  /**
   * Dispose service
   */
  dispose() {
    this.stopSecurityMonitoring()
    this.threats.clear()
    this.auditLog.clear()
    this.securityAlerts.clear()
    logger.info('Security monitoring service disposed')
  }
}

// Create singleton instance
export const securityMonitoringService = new SecurityMonitoringService()
export default securityMonitoringService