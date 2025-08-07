/**
 * Integration Test Suite for Security Monitoring
 * Tests security monitoring service, threat detection, compliance, and DataManager integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import securityMonitoringService, { THREAT_TYPES, SECURITY_LEVELS, AUDIT_EVENTS } from '../../services/monitoring/SecurityMonitoringService.js'
import { useSecurityMonitoring, useSecurityDashboard, useThreatDetection, useComplianceMonitoring } from '../../hooks/useSecurityMonitoring.jsx'
import { dataManager } from '../../services/DataManager.js'

// Mock global objects for testing
global.performance = {
  now: () => Date.now()
}

describe('Security Monitoring Integration', () => {
  beforeEach(() => {
    // Reset service state
    securityMonitoringService.threats.clear()
    securityMonitoringService.auditLog.clear()
    securityMonitoringService.securityAlerts.clear()
    securityMonitoringService.rateLimiters.clear()
    securityMonitoringService.ipBlacklist.clear()
    
    // Clear any existing timers
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    securityMonitoringService.stopSecurityMonitoring()
    vi.useRealTimers()
  })

  describe('Security Monitoring Service', () => {
    it('should start and stop monitoring correctly', () => {
      // Service auto-starts, but let's test stop/start cycle
      securityMonitoringService.stopSecurityMonitoring()
      expect(securityMonitoringService.securityScanInterval).toBeNull()
      expect(securityMonitoringService.complianceInterval).toBeNull()

      securityMonitoringService.startSecurityMonitoring()
      expect(securityMonitoringService.securityScanInterval).toBeDefined()
      expect(securityMonitoringService.complianceInterval).toBeDefined()
    })

    it('should record security threats', () => {
      const threat = securityMonitoringService.recordThreat(
        THREAT_TYPES.SQL_INJECTION,
        SECURITY_LEVELS.HIGH,
        {
          source: '192.168.1.100',
          target: '/api/users',
          input: "' OR 1=1 --"
        }
      )

      expect(threat).toBeDefined()
      expect(threat.type).toBe(THREAT_TYPES.SQL_INJECTION)
      expect(threat.severity).toBe(SECURITY_LEVELS.HIGH)
      expect(threat.resolved).toBe(false)
      expect(threat.impact).toBeDefined()
      expect(threat.impact.overall).toBeGreaterThan(0)

      const storedThreat = securityMonitoringService.threats.get(threat.id)
      expect(storedThreat).toEqual(threat)
    })

    it('should record audit events', () => {
      const auditEvent = securityMonitoringService.recordAuditEvent(
        AUDIT_EVENTS.LOGIN_SUCCESS,
        'test_user_123',
        {
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 Test Browser',
          sessionId: 'session_123'
        }
      )

      expect(auditEvent).toBeDefined()
      expect(auditEvent.eventType).toBe(AUDIT_EVENTS.LOGIN_SUCCESS)
      expect(auditEvent.userId).toBe('test_user_123')
      expect(auditEvent.ipAddress).toBe('192.168.1.100')
      expect(auditEvent.riskScore).toBeDefined()

      const storedEvent = securityMonitoringService.auditLog.get(auditEvent.id)
      expect(storedEvent).toEqual(auditEvent)
    })

    it('should detect SQL injection attempts', () => {
      const maliciousInputs = [
        "' OR 1=1 --",
        "admin'; DROP TABLE users; --",
        "1' UNION SELECT * FROM passwords --",
        "'; DELETE FROM accounts WHERE '1'='1"
      ]

      maliciousInputs.forEach(input => {
        const result = securityMonitoringService.detectSQLInjection(input, {
          component: 'test',
          endpoint: '/api/test'
        })

        expect(result.detected).toBe(true)
        expect(result.patterns.length).toBeGreaterThan(0)
        expect(result.riskScore).toBeGreaterThan(0)
      })

      // Test safe input
      const safeResult = securityMonitoringService.detectSQLInjection('normal user input', {})
      expect(safeResult.detected).toBe(false)
      expect(safeResult.patterns).toHaveLength(0)
      expect(safeResult.riskScore).toBe(0)
    })

    it('should detect XSS attempts', () => {
      const maliciousInputs = [
        '<script>alert("XSS")</script>',
        '<img src="x" onerror="alert(1)">',
        'javascript:alert("XSS")',
        '<iframe src="javascript:alert(1)"></iframe>',
        'eval("alert(1)")'
      ]

      maliciousInputs.forEach(input => {
        const result = securityMonitoringService.detectXSS(input, {
          component: 'test',
          endpoint: '/api/test'
        })

        expect(result.detected).toBe(true)
        expect(result.patterns.length).toBeGreaterThan(0)
        expect(result.riskScore).toBeGreaterThan(0)
      })

      // Test safe input
      const safeResult = securityMonitoringService.detectXSS('normal user input', {})
      expect(safeResult.detected).toBe(false)
      expect(safeResult.patterns).toHaveLength(0)
      expect(safeResult.riskScore).toBe(0)
    })

    it('should enforce rate limiting', () => {
      const identifier = 'test_user_rate_limit'
      const limit = 5
      const windowMs = 60000

      // Make requests up to the limit
      for (let i = 0; i < limit; i++) {
        const result = securityMonitoringService.checkRateLimit(identifier, limit, windowMs)
        expect(result.allowed).toBe(true)
        expect(result.remaining).toBe(limit - i - 1)
      }

      // Next request should be blocked
      const blockedResult = securityMonitoringService.checkRateLimit(identifier, limit, windowMs)
      expect(blockedResult.allowed).toBe(false)
      expect(blockedResult.remaining).toBe(0)

      // Check that threat was recorded
      const threats = Array.from(securityMonitoringService.threats.values())
      const rateLimitThreat = threats.find(t => t.type === THREAT_TYPES.RATE_LIMIT_EXCEEDED)
      expect(rateLimitThreat).toBeDefined()
    })

    it('should check authentication anomalies', () => {
      const userId = 'test_user_anomaly'
      
      // Normal authentication should not trigger anomaly
      const normalAuth = securityMonitoringService.checkAuthenticationAnomaly(userId, {
        duration: 2000,
        location: 'US',
        deviceFingerprint: 'normal_device_123'
      })
      expect(normalAuth.anomaly).toBe(false)

      // Suspicious authentication should trigger anomaly
      const suspiciousAuth = securityMonitoringService.checkAuthenticationAnomaly(userId, {
        duration: 15000, // Very slow login
        location: 'XX', // Unknown location
        deviceFingerprint: 'suspicious_device_456' // New device
      })
      expect(suspiciousAuth.anomaly).toBe(true)
      expect(suspiciousAuth.score).toBeGreaterThan(0.7)
      expect(suspiciousAuth.factors.length).toBeGreaterThan(0)
    })

    it('should check transaction anomalies', () => {
      const userId = 'test_user_transaction'
      
      // Normal transaction should not trigger anomaly
      const normalTransaction = securityMonitoringService.checkTransactionAnomaly(userId, {
        amount: 500,
        currency: 'USD'
      })
      expect(normalTransaction.anomaly).toBe(false)

      // Suspicious transaction should trigger anomaly
      const suspiciousTransaction = securityMonitoringService.checkTransactionAnomaly(userId, {
        amount: 50000, // Very large amount
        currency: 'XXX' // Unknown currency
      })
      expect(suspiciousTransaction.anomaly).toBe(true)
      expect(suspiciousTransaction.score).toBeGreaterThan(0.8)
      expect(suspiciousTransaction.factors.length).toBeGreaterThan(0)
    })

    it('should generate security dashboard data', () => {
      // Add some test data
      securityMonitoringService.recordThreat(THREAT_TYPES.XSS_ATTEMPT, SECURITY_LEVELS.MEDIUM, {
        source: 'test',
        target: 'test'
      })
      securityMonitoringService.recordAuditEvent(AUDIT_EVENTS.LOGIN_SUCCESS, 'test_user', {})

      const dashboard = securityMonitoringService.getSecurityDashboard()

      expect(dashboard).toBeDefined()
      expect(dashboard.securityScore).toBeGreaterThanOrEqual(0)
      expect(dashboard.securityScore).toBeLessThanOrEqual(100)
      expect(dashboard.threatStats).toBeDefined()
      expect(dashboard.recentThreats).toBeDefined()
      expect(dashboard.recentAlerts).toBeDefined()
      expect(dashboard.complianceOverview).toBeDefined()
      expect(dashboard.riskProfile).toBeDefined()
      expect(dashboard.recommendations).toBeDefined()
    })

    it('should auto-respond to critical threats', () => {
      const criticalThreat = securityMonitoringService.recordThreat(
        THREAT_TYPES.DATA_BREACH,
        SECURITY_LEVELS.CRITICAL,
        {
          source: '192.168.1.100',
          affectedUsers: 1000
        }
      )

      // Auto-response should have been triggered
      expect(criticalThreat.severity).toBe(SECURITY_LEVELS.CRITICAL)
      
      // Check that alert was created
      const alerts = securityMonitoringService.getRecentAlerts(10)
      const criticalAlert = alerts.find(a => a.level === SECURITY_LEVELS.CRITICAL)
      expect(criticalAlert).toBeDefined()
    })

    it('should resolve threats', () => {
      const threat = securityMonitoringService.recordThreat(
        THREAT_TYPES.BRUTE_FORCE,
        SECURITY_LEVELS.HIGH,
        { attempts: 10 }
      )

      expect(threat.resolved).toBe(false)

      const resolvedThreat = securityMonitoringService.resolveThreat(threat.id, {
        resolvedBy: 'admin',
        action: 'blocked_ip'
      })

      expect(resolvedThreat).toBeDefined()
      expect(resolvedThreat.resolved).toBe(true)
      expect(resolvedThreat.resolvedAt).toBeDefined()
      expect(resolvedThreat.resolution).toBeDefined()
    })
  })

  describe('React Hook Integration', () => {
    it('should track security actions in components', () => {
      const { result } = renderHook(() => 
        useSecurityMonitoring('TestComponent', {
          trackUserActions: true,
          trackInputValidation: true
        })
      )

      expect(typeof result.current.trackSecureAction).toBe('function')
      expect(typeof result.current.validateInput).toBe('function')
      expect(typeof result.current.checkAuthAnomaly).toBe('function')
      expect(typeof result.current.recordSecurityEvent).toBe('function')

      // Test action tracking
      act(() => {
        result.current.trackSecureAction('button_click', 'test_user', {
          buttonId: 'submit'
        })
      })

      // Check that audit event was recorded
      const auditEvents = Array.from(securityMonitoringService.auditLog.values())
      const buttonClickEvent = auditEvents.find(e => e.details.action === 'button_click')
      expect(buttonClickEvent).toBeDefined()
    })

    it('should validate input for threats', () => {
      const { result } = renderHook(() => 
        useSecurityMonitoring('TestComponent', {
          trackInputValidation: true,
          autoDetectThreats: true
        })
      )

      // Test safe input
      act(() => {
        const safeResult = result.current.validateInput('normal user input')
        expect(safeResult.safe).toBe(true)
        expect(safeResult.threats).toHaveLength(0)
      })

      // Test malicious input
      act(() => {
        const maliciousResult = result.current.validateInput('<script>alert("XSS")</script>')
        expect(maliciousResult.safe).toBe(false)
        expect(maliciousResult.threats.length).toBeGreaterThan(0)
      })
    })

    it('should provide security dashboard data', async () => {
      // Add some test data
      securityMonitoringService.recordThreat(THREAT_TYPES.SQL_INJECTION, SECURITY_LEVELS.HIGH, {})
      securityMonitoringService.createSecurityAlert(SECURITY_LEVELS.WARNING, 'Test Alert', 'Test message')

      const { result } = renderHook(() => useSecurityDashboard(1000))

      // Wait for initial load
      await act(async () => {
        vi.advanceTimersByTime(10)
      })

      expect(result.current.dashboard).toBeDefined()
      expect(result.current.isLoading).toBe(false)
      expect(typeof result.current.refreshDashboard).toBe('function')
      expect(typeof result.current.resolveThreat).toBe('function')
    })

    it('should detect threats with hook', () => {
      const { result } = renderHook(() => useThreatDetection())

      expect(result.current.threats).toHaveLength(0)
      expect(result.current.detectionEnabled).toBe(true)

      act(() => {
        const detectionResult = result.current.detectThreats("' OR 1=1 --", {
          component: 'test'
        })
        expect(detectionResult.safe).toBe(false)
        expect(detectionResult.threats.length).toBeGreaterThan(0)
      })

      expect(result.current.threats.length).toBeGreaterThan(0)
    })

    it('should provide compliance monitoring data', () => {
      const { result } = renderHook(() => useComplianceMonitoring())

      // Initial state
      expect(result.current.complianceData).toBeDefined()
      expect(typeof result.current.refreshCompliance).toBe('function')
      expect(typeof result.current.runComplianceCheck).toBe('function')

      // Test compliance data structure
      if (result.current.complianceData) {
        const complianceKeys = Object.keys(result.current.complianceData)
        expect(complianceKeys.length).toBeGreaterThan(0)
        
        complianceKeys.forEach(key => {
          const compliance = result.current.complianceData[key]
          expect(compliance).toHaveProperty('name')
          expect(compliance).toHaveProperty('score')
          expect(compliance).toHaveProperty('checks')
        })
      }
    })
  })

  describe('DataManager Integration', () => {
    it('should start security monitoring through DataManager', () => {
      // Security monitoring auto-starts, but we can test the method
      dataManager.startSecurityMonitoring()
      // Should not throw error and service should be active
      expect(securityMonitoringService.securityScanInterval).toBeDefined()
    })

    it('should record security threats through DataManager', () => {
      const threat = dataManager.recordSecurityThreat(
        THREAT_TYPES.UNAUTHORIZED_ACCESS,
        SECURITY_LEVELS.HIGH,
        {
          userId: 'test_user',
          resource: '/admin/users'
        }
      )

      expect(threat).toBeDefined()
      expect(threat.type).toBe(THREAT_TYPES.UNAUTHORIZED_ACCESS)
      expect(threat.severity).toBe(SECURITY_LEVELS.HIGH)
    })

    it('should validate user input through DataManager', () => {
      const maliciousInput = '<script>document.cookie</script>'
      const validation = dataManager.validateUserInput(maliciousInput, {
        component: 'TransactionForm'
      })

      expect(validation.safe).toBe(false)
      expect(validation.threats.length).toBeGreaterThan(0)
      expect(validation.sanitizedInput).toBeDefined()
      expect(validation.sanitizedInput).not.toContain('<script>')
    })

    it('should check authentication anomalies through DataManager', () => {
      const anomaly = dataManager.checkAuthenticationAnomaly('test_user', {
        duration: 20000, // Very slow
        location: 'XX', // Unknown location
        timestamp: Date.now()
      })

      expect(anomaly.anomaly).toBe(true)
      expect(anomaly.score).toBeGreaterThan(0.7)
    })

    it('should process secure transactions', async () => {
      const transactionData = {
        type: 'transfer',
        amount: 1000,
        asset: 'USD',
        toAddress: 'user123',
        description: 'Test transfer'
      }

      const result = await dataManager.processSecureTransaction(transactionData)

      expect(result).toBeDefined()
      expect(result.success).toBeDefined()

      // Check that audit events were recorded
      const auditEvents = dataManager.getUserAuditTrail('demo_user_12345')
      expect(auditEvents.length).toBeGreaterThan(0)
    })

    it('should block malicious transactions', async () => {
      const maliciousTransaction = {
        type: 'transfer',
        amount: 1000,
        asset: "'; DROP TABLE users; --", // SQL injection attempt
        toAddress: 'user123'
      }

      const result = await dataManager.processSecureTransaction(maliciousTransaction)

      expect(result.success).toBe(false)
      expect(result.error).toContain('security')
      expect(result.threats).toBeDefined()
    })

    it('should get security dashboard through DataManager', () => {
      const dashboard = dataManager.getSecurityDashboard()

      expect(dashboard).toBeDefined()
      expect(dashboard.securityScore).toBeGreaterThanOrEqual(0)
      expect(dashboard.threatStats).toBeDefined()
      expect(dashboard.riskProfile).toBeDefined()
    })

    it('should get compliance status through DataManager', () => {
      const compliance = dataManager.getComplianceStatus()

      expect(compliance).toBeDefined()
      expect(typeof compliance).toBe('object')
      
      // Should have compliance frameworks
      const frameworks = Object.keys(compliance)
      expect(frameworks.length).toBeGreaterThan(0)
      
      frameworks.forEach(framework => {
        expect(compliance[framework]).toHaveProperty('name')
        expect(compliance[framework]).toHaveProperty('score')
        expect(compliance[framework]).toHaveProperty('checks')
      })
    })

    it('should generate comprehensive security report', () => {
      // Add some test data
      dataManager.recordSecurityThreat(THREAT_TYPES.BRUTE_FORCE, SECURITY_LEVELS.HIGH, {})
      dataManager.recordAuditEvent(AUDIT_EVENTS.LOGIN_FAILURE, 'test_user', {})

      const report = dataManager.generateSecurityReport()

      expect(report).toBeDefined()
      expect(report.reportId).toBeDefined()
      expect(report.generatedAt).toBeDefined()
      expect(report.securityScore).toBeGreaterThanOrEqual(0)
      expect(report.threatSummary).toBeDefined()
      expect(report.complianceSummary).toBeDefined()
      expect(report.riskProfile).toBeDefined()
      expect(report.recommendations).toBeDefined()
    })

    it('should handle rate limiting in transactions', async () => {
      const userId = 'demo_user_12345'
      const transactionData = {
        type: 'transfer',
        amount: 100,
        asset: 'USD'
      }

      // Make multiple rapid transactions to trigger rate limit
      const promises = []
      for (let i = 0; i < 12; i++) { // Exceed the 10 per minute limit
        promises.push(dataManager.processSecureTransaction(transactionData))
      }

      const results = await Promise.all(promises)
      
      // Some transactions should be blocked due to rate limiting
      const blockedTransactions = results.filter(r => !r.success && r.error.includes('Too many'))
      expect(blockedTransactions.length).toBeGreaterThan(0)
    })
  })

  describe('Compliance and Auditing', () => {
    it('should run compliance checks', () => {
      dataManager.runComplianceChecks()

      const compliance = dataManager.getComplianceStatus()
      
      // All frameworks should have been checked
      Object.values(compliance).forEach(framework => {
        expect(framework.score).toBeGreaterThanOrEqual(0)
        expect(framework.score).toBeLessThanOrEqual(100)
        expect(framework.lastCheck).toBeDefined()
      })
    })

    it('should maintain audit trail', () => {
      const userId = 'test_audit_user'
      
      // Generate some audit events
      dataManager.recordAuditEvent(AUDIT_EVENTS.LOGIN_SUCCESS, userId, {})
      dataManager.recordAuditEvent(AUDIT_EVENTS.DATA_ACCESS, userId, { resource: '/api/balance' })
      dataManager.recordAuditEvent(AUDIT_EVENTS.DATA_MODIFICATION, userId, { action: 'update_profile' })

      const auditTrail = dataManager.getUserAuditTrail(userId)
      
      expect(auditTrail.length).toBe(3)
      expect(auditTrail[0].eventType).toBe(AUDIT_EVENTS.DATA_MODIFICATION) // Most recent first
      expect(auditTrail[1].eventType).toBe(AUDIT_EVENTS.DATA_ACCESS)
      expect(auditTrail[2].eventType).toBe(AUDIT_EVENTS.LOGIN_SUCCESS)
    })

    it('should calculate security scores accurately', () => {
      // Clean state should have high security score
      const initialScore = securityMonitoringService.calculateSecurityScore()
      expect(initialScore).toBeGreaterThan(90)

      // Add threats to reduce score
      securityMonitoringService.recordThreat(THREAT_TYPES.SQL_INJECTION, SECURITY_LEVELS.CRITICAL, {})
      securityMonitoringService.recordThreat(THREAT_TYPES.XSS_ATTEMPT, SECURITY_LEVELS.HIGH, {})

      const reducedScore = securityMonitoringService.calculateSecurityScore()
      expect(reducedScore).toBeLessThan(initialScore)
      expect(reducedScore).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle service errors gracefully', () => {
      // Mock service error
      const originalMethod = securityMonitoringService.getSecurityDashboard
      securityMonitoringService.getSecurityDashboard = vi.fn().mockImplementation(() => {
        throw new Error('Service error')
      })

      const dashboard = dataManager.getSecurityDashboard()
      expect(dashboard.error).toBeDefined()
      expect(dashboard.securityScore).toBe(0)

      // Restore original method
      securityMonitoringService.getSecurityDashboard = originalMethod
    })

    it('should handle invalid threat resolution', () => {
      const result = dataManager.resolveSecurityThreat('nonexistent_threat_id')
      expect(result).toBeNull()
    })

    it('should sanitize input safely', () => {
      const maliciousInputs = [
        '<script>alert("xss")</script>',
        'javascript:alert(1)',
        '<img onerror="alert(1)" src="x">',
        'onclick="alert(1)"'
      ]

      maliciousInputs.forEach(input => {
        const sanitized = dataManager.sanitizeInput(input)
        expect(sanitized).not.toContain('<script>')
        expect(sanitized).not.toContain('javascript:')
        expect(sanitized).not.toContain('onclick=')
      })
    })

    it('should handle non-string input sanitization', () => {
      const nonStringInputs = [123, null, undefined, { key: 'value' }, ['array']]

      nonStringInputs.forEach(input => {
        const result = dataManager.sanitizeInput(input)
        expect(result).toBe(input) // Should return as-is for non-strings
      })
    })

    it('should cleanup old security data', () => {
      // Add old threats and audit events
      const oldTimestamp = Date.now() - (91 * 24 * 60 * 60 * 1000) // 91 days ago
      
      // Manually add old data
      securityMonitoringService.threats.set('old_threat', {
        id: 'old_threat',
        timestamp: oldTimestamp,
        resolved: true
      })
      
      securityMonitoringService.auditLog.set('old_audit', {
        id: 'old_audit',
        timestamp: oldTimestamp
      })

      // Add recent data
      const recentThreat = securityMonitoringService.recordThreat(THREAT_TYPES.ANOMALY_DETECTED, SECURITY_LEVELS.LOW, {})

      // Run cleanup
      securityMonitoringService.cleanupOldData()

      // Old data should be removed, recent data should remain
      expect(securityMonitoringService.threats.has('old_threat')).toBe(false)
      expect(securityMonitoringService.auditLog.has('old_audit')).toBe(false)
      expect(securityMonitoringService.threats.has(recentThreat.id)).toBe(true)
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large numbers of threats efficiently', () => {
      const startTime = Date.now()
      
      // Create many threats
      for (let i = 0; i < 100; i++) {
        securityMonitoringService.recordThreat(
          THREAT_TYPES.SUSPICIOUS_ACTIVITY,
          SECURITY_LEVELS.LOW,
          { index: i }
        )
      }

      const dashboard = securityMonitoringService.getSecurityDashboard()
      const endTime = Date.now()
      
      expect(dashboard.threatStats.total).toBe(100)
      expect(endTime - startTime).toBeLessThan(1000) // Should complete within 1 second
    })

    it('should handle concurrent threat detection', async () => {
      const maliciousInputs = Array.from({ length: 50 }, (_, i) => `<script>alert(${i})</script>`)
      
      const promises = maliciousInputs.map(input => 
        Promise.resolve(securityMonitoringService.detectXSS(input, {}))
      )

      const results = await Promise.all(promises)
      
      results.forEach(result => {
        expect(result.detected).toBe(true)
        expect(result.riskScore).toBeGreaterThan(0)
      })

      // All threats should be recorded
      const threats = Array.from(securityMonitoringService.threats.values())
      const xssThreats = threats.filter(t => t.type === THREAT_TYPES.XSS_ATTEMPT)
      expect(xssThreats.length).toBe(50)
    })
  })
})