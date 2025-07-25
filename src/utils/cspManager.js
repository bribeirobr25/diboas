/**
 * Content Security Policy Manager
 * Dynamic CSP management for enhanced security
 */

import { getEnvironmentInfo } from '../config/environments.js'

/**
 * CSP Configuration by Environment
 */
const CSP_POLICIES = {
  development: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'", 
      "'unsafe-inline'", 
      "'unsafe-eval'", // For development hot reload
      "https://fonts.googleapis.com",
      "localhost:*", // Dev server
      "127.0.0.1:*"
    ],
    'style-src': [
      "'self'", 
      "'unsafe-inline'", // For CSS-in-JS and dev styles
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com"
    ],
    'font-src': [
      "'self'",
      "https://fonts.gstatic.com",
      "data:"
    ],
    'img-src': [
      "'self'",
      "data:",
      "blob:",
      "https:",
      "http:", // Dev can use http images
      "localhost:*"
    ],
    'connect-src': [
      "'self'",
      "ws://localhost:*", // WebSocket for dev
      "wss://localhost:*",
      "http://localhost:*",
      "https://localhost:*",
      "https://api.diboas.com",
      "https://fonts.googleapis.com"
    ],
    'media-src': ["'self'", "data:", "blob:"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': null
  },

  staging: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      "'unsafe-inline'", // Minimal inline for staging
      "https://fonts.googleapis.com",
      "https://staging-api.diboas.com"
    ],
    'style-src': [
      "'self'",
      "'unsafe-inline'",
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com"
    ],
    'font-src': [
      "'self'",
      "https://fonts.gstatic.com",
      "data:"
    ],
    'img-src': [
      "'self'",
      "data:",
      "blob:",
      "https:",
      "https://staging-cdn.diboas.com"
    ],
    'connect-src': [
      "'self'",
      "https://staging-api.diboas.com",
      "https://staging-auth.diboas.com",
      "wss://staging-ws.diboas.com",
      "https://fonts.googleapis.com"
    ],
    'media-src': ["'self'", "data:", "blob:"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'", "https://staging-api.diboas.com"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': null
  },

  production: {
    'default-src': ["'self'"],
    'script-src': [
      "'self'",
      // Remove unsafe-inline and unsafe-eval for production
      "https://fonts.googleapis.com",
      "https://www.google-analytics.com",
      "https://www.googletagmanager.com"
    ],
    'style-src': [
      "'self'",
      // "'unsafe-inline'", // REMOVED for security - using nonce instead
      "https://fonts.googleapis.com",
      "https://fonts.gstatic.com"
    ],
    'font-src': [
      "'self'",
      "https://fonts.gstatic.com",
      "data:"
    ],
    'img-src': [
      "'self'",
      "data:",
      "blob:",
      "https://cdn.diboas.com",
      "https://www.google-analytics.com"
    ],
    'connect-src': [
      "'self'",
      "https://api.diboas.com",
      "https://auth.diboas.com",
      "wss://ws.diboas.com",
      "https://fonts.googleapis.com",
      "https://www.google-analytics.com"
    ],
    'media-src': ["'self'", "data:", "blob:"],
    'object-src': ["'none'"],
    'base-uri': ["'self'"],
    'form-action': ["'self'", "https://api.diboas.com"],
    'frame-ancestors': ["'none'"],
    'upgrade-insecure-requests': null
  }
}

/**
 * CSP Manager Class
 */
class CSPManager {
  constructor() {
    this.environment = getEnvironmentInfo().environment || 'development'
    this.violations = []
  }

  /**
   * Generate CSP string for current environment
   */
  generateCSP() {
    const policy = CSP_POLICIES[this.environment] || CSP_POLICIES.development
    
    const cspString = Object.entries(policy)
      .filter(([, value]) => value !== null)
      .map(([directive, sources]) => {
        if (Array.isArray(sources)) {
          return `${directive} ${sources.join(' ')}`
        }
        return directive // For directives like upgrade-insecure-requests
      })
      .join('; ')

    return cspString
  }

  /**
   * Apply CSP to document (for dynamic updates)
   */
  applyCSP() {
    const cspString = this.generateCSP()
    
    // Remove existing CSP meta tag
    const existingCSP = document.querySelector('meta[http-equiv="Content-Security-Policy"]')
    if (existingCSP) {
      existingCSP.remove()
    }

    // Add new CSP meta tag
    const meta = document.createElement('meta')
    meta.httpEquiv = 'Content-Security-Policy'
    meta.content = cspString
    document.head.appendChild(meta)

    return cspString
  }

  /**
   * Monitor CSP violations
   */
  monitorViolations() {
    if (typeof document !== 'undefined') {
      document.addEventListener('securitypolicyviolation', (e) => {
        const violation = {
          blockedURI: e.blockedURI,
          violatedDirective: e.violatedDirective,
          originalPolicy: e.originalPolicy,
          timestamp: new Date().toISOString(),
          sourceFile: e.sourceFile,
          lineNumber: e.lineNumber
        }

        this.violations.push(violation)
        
        // Log violation in development
        if (this.environment === 'development') {
          console.warn('CSP Violation:', violation)
        }

        // Report to security service in production
        if (this.environment === 'production') {
          this.reportViolation(violation)
        }
      })
    }
  }

  /**
   * Report CSP violation to security service
   */
  reportViolation(violation) {
    // In production, send to security monitoring service
    try {
      if (typeof fetch !== 'undefined') {
        fetch('https://api.diboas.com/security/csp-violation', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(violation)
        }).catch(error => {
          console.error('Failed to report CSP violation:', error)
        })
      }
    } catch (error) {
      console.error('CSP violation reporting failed:', error)
    }
  }

  /**
   * Get violation reports
   */
  getViolations() {
    return this.violations
  }

  /**
   * Clear violation history
   */
  clearViolations() {
    this.violations = []
  }

  /**
   * Validate CSP configuration
   */
  validateCSP() {
    const policy = CSP_POLICIES[this.environment]
    const issues = []

    // Check for unsafe directives in production
    if (this.environment === 'production') {
      if (policy['script-src']?.includes("'unsafe-eval'")) {
        issues.push("Production CSP should not include 'unsafe-eval' in script-src")
      }
      
      if (policy['script-src']?.includes("'unsafe-inline'")) {
        issues.push("Production CSP should avoid 'unsafe-inline' in script-src")
      }
    }

    // Check for required directives
    const requiredDirectives = ['default-src', 'script-src', 'style-src', 'object-src']
    requiredDirectives.forEach(directive => {
      if (!policy[directive]) {
        issues.push(`Missing required directive: ${directive}`)
      }
    })

    return {
      valid: issues.length === 0,
      issues
    }
  }

  /**
   * Get CSP report for debugging
   */
  getCSPReport() {
    const csp = this.generateCSP()
    const validation = this.validateCSP()
    
    return {
      environment: this.environment,
      csp,
      validation,
      violations: this.violations.length,
      lastViolation: this.violations[this.violations.length - 1] || null
    }
  }
}

// Create global CSP manager instance
export const cspManager = new CSPManager()

// Initialize CSP monitoring
if (typeof window !== 'undefined') {
  cspManager.monitorViolations()
}

// Export for manual usage
export { CSPManager, CSP_POLICIES }

export default cspManager