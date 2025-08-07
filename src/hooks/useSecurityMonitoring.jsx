/**
 * Security Monitoring React Hooks
 * Provides React integration for security monitoring service
 */

import React, { useEffect, useRef, useCallback, useState } from 'react'
import securityMonitoringService, { THREAT_TYPES, SECURITY_LEVELS, AUDIT_EVENTS } from '../services/monitoring/SecurityMonitoringService.js'
import logger from '../utils/logger'

/**
 * Hook for security monitoring in components
 */
export function useSecurityMonitoring(componentName, options = {}) {
  const {
    trackUserActions = true,
    trackInputValidation = true,
    trackAuthentication = false,
    autoDetectThreats = true
  } = options

  const componentRef = useRef(componentName)
  const [securityState, setSecurityState] = useState({
    threats: 0,
    alerts: 0,
    riskLevel: 'low'
  })

  useEffect(() => {
    if (trackUserActions) {
      // Record component security monitoring initialization
      securityMonitoringService.recordAuditEvent(
        AUDIT_EVENTS.DATA_ACCESS,
        'anonymous', // Would be actual user ID in production
        {
          component: componentName,
          action: 'component_mount',
          timestamp: Date.now()
        }
      )
    }

    return () => {
      if (trackUserActions) {
        securityMonitoringService.recordAuditEvent(
          AUDIT_EVENTS.DATA_ACCESS,
          'anonymous',
          {
            component: componentName,
            action: 'component_unmount',
            timestamp: Date.now()
          }
        )
      }
    }
  }, [componentName, trackUserActions])

  // Track user interactions with security context
  const trackSecureAction = useCallback((action, userId = 'anonymous', details = {}) => {
    try {
      securityMonitoringService.recordAuditEvent(
        AUDIT_EVENTS.DATA_ACCESS,
        userId,
        {
          component: componentName,
          action,
          userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
          timestamp: Date.now(),
          ...details
        }
      )
    } catch (error) {
      logger.error('Failed to track secure action:', error)
    }
  }, [componentName])

  // Validate input for security threats
  const validateInput = useCallback((input, context = {}) => {
    if (!trackInputValidation || !autoDetectThreats) {
      return { safe: true, threats: [] }
    }

    try {
      const threats = []
      
      // Check for SQL injection
      const sqlResult = securityMonitoringService.detectSQLInjection(input, {
        component: componentName,
        ...context
      })
      if (sqlResult.detected) {
        threats.push({ type: THREAT_TYPES.SQL_INJECTION, ...sqlResult })
      }

      // Check for XSS
      const xssResult = securityMonitoringService.detectXSS(input, {
        component: componentName,
        ...context
      })
      if (xssResult.detected) {
        threats.push({ type: THREAT_TYPES.XSS_ATTEMPT, ...xssResult })
      }

      const safe = threats.length === 0
      
      if (!safe) {
        setSecurityState(prev => ({
          ...prev,
          threats: prev.threats + threats.length,
          riskLevel: threats.some(t => t.riskScore > 0.7) ? 'high' : 'medium'
        }))
      }

      return { safe, threats }
    } catch (error) {
      logger.error('Input validation failed:', error)
      return { safe: false, threats: [], error: error.message }
    }
  }, [componentName, trackInputValidation, autoDetectThreats])

  // Check authentication anomalies
  const checkAuthAnomaly = useCallback((userId, authDetails = {}) => {
    if (!trackAuthentication) {
      return { anomaly: false, score: 0 }
    }

    try {
      return securityMonitoringService.checkAuthenticationAnomaly(userId, {
        component: componentName,
        timestamp: Date.now(),
        ...authDetails
      })
    } catch (error) {
      logger.error('Authentication anomaly check failed:', error)
      return { anomaly: false, score: 0, error: error.message }
    }
  }, [componentName, trackAuthentication])

  // Check rate limiting
  const checkRateLimit = useCallback((identifier, limit, windowMs) => {
    try {
      return securityMonitoringService.checkRateLimit(identifier, limit, windowMs)
    } catch (error) {
      logger.error('Rate limit check failed:', error)
      return { allowed: true, remaining: 0, resetTime: Date.now() }
    }
  }, [])

  // Record custom security event
  const recordSecurityEvent = useCallback((eventType, userId, details = {}) => {
    try {
      return securityMonitoringService.recordAuditEvent(eventType, userId, {
        component: componentName,
        ...details
      })
    } catch (error) {
      logger.error('Failed to record security event:', error)
      return null
    }
  }, [componentName])

  return {
    trackSecureAction,
    validateInput,
    checkAuthAnomaly,
    checkRateLimit,
    recordSecurityEvent,
    securityState
  }
}

/**
 * Hook for security dashboard data
 */
export function useSecurityDashboard(refreshInterval = 10000) {
  const [dashboard, setDashboard] = useState(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState(null)

  const refreshDashboard = useCallback(async () => {
    try {
      setError(null)
      const data = securityMonitoringService.getSecurityDashboard()
      setDashboard(data)
      setIsLoading(false)
    } catch (err) {
      logger.error('Failed to refresh security dashboard:', err)
      setError(err.message)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial load
    refreshDashboard()

    // Set up refresh interval
    const interval = setInterval(refreshDashboard, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshDashboard, refreshInterval])

  const resolveThreat = useCallback((threatId, resolution = {}) => {
    try {
      const resolvedThreat = securityMonitoringService.resolveThreat(threatId, resolution)
      if (resolvedThreat) {
        // Refresh dashboard to show updated data
        refreshDashboard()
      }
      return resolvedThreat
    } catch (error) {
      logger.error('Failed to resolve threat:', error)
      return null
    }
  }, [refreshDashboard])

  const acknowledgeAlert = useCallback((alertId) => {
    try {
      const alerts = securityMonitoringService.securityAlerts
      const alert = alerts.get(alertId)
      if (alert) {
        alert.acknowledged = true
        alert.acknowledgedAt = Date.now()
        refreshDashboard()
      }
      return alert
    } catch (error) {
      logger.error('Failed to acknowledge alert:', error)
      return null
    }
  }, [refreshDashboard])

  return {
    dashboard,
    isLoading,
    error,
    refreshDashboard,
    resolveThreat,
    acknowledgeAlert
  }
}

/**
 * Hook for threat detection
 */
export function useThreatDetection() {
  const [threats, setThreats] = useState([])
  const [detectionEnabled, setDetectionEnabled] = useState(true)

  const detectThreats = useCallback((input, context = {}) => {
    if (!detectionEnabled) return { threats: [], safe: true }

    try {
      const detectedThreats = []

      // SQL Injection detection
      const sqlResult = securityMonitoringService.detectSQLInjection(input, context)
      if (sqlResult.detected) {
        detectedThreats.push({
          type: THREAT_TYPES.SQL_INJECTION,
          severity: sqlResult.riskScore > 0.7 ? SECURITY_LEVELS.HIGH : SECURITY_LEVELS.MEDIUM,
          details: sqlResult
        })
      }

      // XSS detection
      const xssResult = securityMonitoringService.detectXSS(input, context)
      if (xssResult.detected) {
        detectedThreats.push({
          type: THREAT_TYPES.XSS_ATTEMPT,
          severity: xssResult.riskScore > 0.7 ? SECURITY_LEVELS.HIGH : SECURITY_LEVELS.MEDIUM,
          details: xssResult
        })
      }

      setThreats(prev => [...prev, ...detectedThreats].slice(-10)) // Keep last 10

      return {
        threats: detectedThreats,
        safe: detectedThreats.length === 0
      }
    } catch (error) {
      logger.error('Threat detection failed:', error)
      return { threats: [], safe: false, error: error.message }
    }
  }, [detectionEnabled])

  const clearThreats = useCallback(() => {
    setThreats([])
  }, [])

  const toggleDetection = useCallback((enabled) => {
    setDetectionEnabled(enabled)
  }, [])

  return {
    threats,
    detectThreats,
    clearThreats,
    toggleDetection,
    detectionEnabled
  }
}

/**
 * Hook for compliance monitoring
 */
export function useComplianceMonitoring() {
  const [complianceData, setComplianceData] = useState(null)
  const [isLoading, setIsLoading] = useState(true)

  const refreshCompliance = useCallback(() => {
    try {
      // Get current compliance status
      const compliance = {}
      for (const [type, check] of securityMonitoringService.complianceChecks) {
        compliance[type] = {
          name: check.name,
          score: check.score,
          checks: check.checks,
          lastCheck: check.lastCheck
        }
      }
      
      setComplianceData(compliance)
      setIsLoading(false)
    } catch (error) {
      logger.error('Failed to refresh compliance data:', error)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    refreshCompliance()
    
    // Refresh every 5 minutes
    const interval = setInterval(refreshCompliance, 5 * 60 * 1000)
    
    return () => clearInterval(interval)
  }, [refreshCompliance])

  const runComplianceCheck = useCallback((complianceType) => {
    try {
      securityMonitoringService.runComplianceChecks()
      refreshCompliance()
    } catch (error) {
      logger.error('Failed to run compliance check:', error)
    }
  }, [refreshCompliance])

  return {
    complianceData,
    isLoading,
    refreshCompliance,
    runComplianceCheck
  }
}

/**
 * Hook for audit logging
 */
export function useAuditLogging() {
  const logAuditEvent = useCallback((eventType, userId, details = {}) => {
    try {
      return securityMonitoringService.recordAuditEvent(eventType, userId, {
        timestamp: Date.now(),
        userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
        ...details
      })
    } catch (error) {
      logger.error('Failed to log audit event:', error)
      return null
    }
  }, [])

  const getAuditTrail = useCallback((userId, timeWindow = 24 * 60 * 60 * 1000) => {
    try {
      const now = Date.now()
      const cutoff = now - timeWindow
      
      return Array.from(securityMonitoringService.auditLog.values())
        .filter(event => event.userId === userId && event.timestamp > cutoff)
        .sort((a, b) => b.timestamp - a.timestamp)
    } catch (error) {
      logger.error('Failed to get audit trail:', error)
      return []
    }
  }, [])

  return {
    logAuditEvent,
    getAuditTrail
  }
}

/**
 * Hook for security metrics
 */
export function useSecurityMetrics(timeWindow = 24 * 60 * 60 * 1000) {
  const [metrics, setMetrics] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  const calculateMetrics = useCallback(() => {
    try {
      const now = Date.now()
      const cutoff = now - timeWindow

      // Get threats in time window
      const threats = Array.from(securityMonitoringService.threats.values())
        .filter(threat => threat.timestamp > cutoff)

      // Get alerts in time window
      const alerts = Array.from(securityMonitoringService.securityAlerts.values())
        .filter(alert => alert.timestamp > cutoff)

      // Get audit events in time window
      const auditEvents = Array.from(securityMonitoringService.auditLog.values())
        .filter(event => event.timestamp > cutoff)

      const calculatedMetrics = {
        threatCount: threats.length,
        alertCount: alerts.length,
        auditEventCount: auditEvents.length,
        securityScore: securityMonitoringService.calculateSecurityScore(),
        threatsByType: {},
        alertsByLevel: {},
        mostActiveUsers: {},
        riskProfile: securityMonitoringService.getOverallRiskProfile()
      }

      // Group threats by type
      threats.forEach(threat => {
        calculatedMetrics.threatsByType[threat.type] = 
          (calculatedMetrics.threatsByType[threat.type] || 0) + 1
      })

      // Group alerts by level
      alerts.forEach(alert => {
        calculatedMetrics.alertsByLevel[alert.level] = 
          (calculatedMetrics.alertsByLevel[alert.level] || 0) + 1
      })

      // Find most active users
      auditEvents.forEach(event => {
        calculatedMetrics.mostActiveUsers[event.userId] = 
          (calculatedMetrics.mostActiveUsers[event.userId] || 0) + 1
      })

      setMetrics(calculatedMetrics)
      setIsLoading(false)
    } catch (error) {
      logger.error('Failed to calculate security metrics:', error)
      setIsLoading(false)
    }
  }, [timeWindow])

  useEffect(() => {
    calculateMetrics()
    
    // Refresh every minute
    const interval = setInterval(calculateMetrics, 60 * 1000)
    
    return () => clearInterval(interval)
  }, [calculateMetrics])

  return {
    metrics,
    isLoading,
    refreshMetrics: calculateMetrics
  }
}

/**
 * Higher-order component for security monitoring
 */
export function withSecurityMonitoring(WrappedComponent, options = {}) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component'
  
  function SecurityMonitoredComponent(props) {
    const securityHooks = useSecurityMonitoring(displayName, options)

    // Inject security monitoring methods into props
    const enhancedProps = {
      ...props,
      ...securityHooks
    }

    return <WrappedComponent {...enhancedProps} />
  }

  SecurityMonitoredComponent.displayName = `withSecurityMonitoring(${displayName})`
  
  return SecurityMonitoredComponent
}

// Export threat types and security levels for use in components
export { THREAT_TYPES, SECURITY_LEVELS, AUDIT_EVENTS }