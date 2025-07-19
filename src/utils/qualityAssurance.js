/**
 * FinTech Quality Assurance Framework
 * Comprehensive QA utilities for financial applications
 */

import logger, { AUDIT_EVENTS } from './secureLogger.js'
import { getCurrentEnvironment } from '../config/environments.js'

/**
 * Code quality metrics and monitoring
 */
export const codeQualityMetrics = {
  // Component complexity analysis
  analyzeComponentComplexity: (componentCode) => {
    const metrics = {
      linesOfCode: componentCode.split('\n').length,
      cyclomaticComplexity: 0,
      numberOfHooks: 0,
      numberOfProps: 0,
      nestedLevels: 0
    }
    
    // Count cyclomatic complexity (simplified)
    const complexityKeywords = /\b(if|else|while|for|switch|case|catch|&&|\|\||\?)\b/g
    metrics.cyclomaticComplexity = (componentCode.match(complexityKeywords) || []).length + 1
    
    // Count React hooks
    const hooksRegex = /\buse[A-Z]\w+\(/g
    metrics.numberOfHooks = (componentCode.match(hooksRegex) || []).length
    
    // Count props (simplified)
    const propsRegex = /\b\w+\s*[:=]\s*\w+/g
    metrics.numberOfProps = (componentCode.match(propsRegex) || []).length
    
    // Estimate nesting levels
    const openBraces = (componentCode.match(/\{/g) || []).length
    const closeBraces = (componentCode.match(/\}/g) || []).length
    metrics.nestedLevels = Math.max(0, openBraces - closeBraces + 5) // Rough estimate
    
    return metrics
  },

  // Assess component quality score
  assessComponentQuality: (metrics) => {
    let score = 100
    let warnings = []
    
    // Lines of code penalty
    if (metrics.linesOfCode > 300) {
      score -= 20
      warnings.push('Component is too large (>300 lines)')
    } else if (metrics.linesOfCode > 200) {
      score -= 10
      warnings.push('Component is getting large (>200 lines)')
    }
    
    // Complexity penalty
    if (metrics.cyclomaticComplexity > 15) {
      score -= 25
      warnings.push('High cyclomatic complexity (>15)')
    } else if (metrics.cyclomaticComplexity > 10) {
      score -= 15
      warnings.push('Moderate cyclomatic complexity (>10)')
    }
    
    // Hooks penalty
    if (metrics.numberOfHooks > 10) {
      score -= 15
      warnings.push('Too many hooks (>10)')
    } else if (metrics.numberOfHooks > 7) {
      score -= 10
      warnings.push('Many hooks (>7)')
    }
    
    // Nesting penalty
    if (metrics.nestedLevels > 6) {
      score -= 20
      warnings.push('Deep nesting detected (>6 levels)')
    }
    
    return {
      score: Math.max(0, score),
      grade: score >= 90 ? 'A' : score >= 80 ? 'B' : score >= 70 ? 'C' : score >= 60 ? 'D' : 'F',
      warnings
    }
  }
}

/**
 * Accessibility quality assurance
 */
export const accessibilityQA = {
  // Check for common accessibility issues
  auditAccessibility: (element) => {
    const issues = []
    
    // Check for missing alt text on images
    const images = element.querySelectorAll('img:not([alt])')
    if (images.length > 0) {
      issues.push({
        type: 'missing-alt-text',
        severity: 'high',
        count: images.length,
        message: 'Images missing alt text'
      })
    }
    
    // Check for buttons without accessible names
    const buttons = element.querySelectorAll('button:not([aria-label]):not([aria-labelledby])')
    const buttonsWithoutText = Array.from(buttons).filter(btn => !btn.textContent.trim())
    if (buttonsWithoutText.length > 0) {
      issues.push({
        type: 'button-no-name',
        severity: 'high',
        count: buttonsWithoutText.length,
        message: 'Buttons without accessible names'
      })
    }
    
    // Check for form inputs without labels
    const inputs = element.querySelectorAll('input:not([aria-label]):not([aria-labelledby])')
    const inputsWithoutLabels = Array.from(inputs).filter(input => {
      const id = input.id
      return !id || !element.querySelector(`label[for="${id}"]`)
    })
    if (inputsWithoutLabels.length > 0) {
      issues.push({
        type: 'input-no-label',
        severity: 'high',
        count: inputsWithoutLabels.length,
        message: 'Form inputs without labels'
      })
    }
    
    // Check for insufficient color contrast (simplified)
    const elementsWithColor = element.querySelectorAll('[style*="color"]')
    if (elementsWithColor.length > 0) {
      issues.push({
        type: 'color-contrast-check-needed',
        severity: 'medium',
        count: elementsWithColor.length,
        message: 'Manual color contrast check needed'
      })
    }
    
    // Check for missing heading hierarchy
    const headings = element.querySelectorAll('h1, h2, h3, h4, h5, h6')
    const headingLevels = Array.from(headings).map(h => parseInt(h.tagName.charAt(1)))
    for (let i = 1; i < headingLevels.length; i++) {
      if (headingLevels[i] - headingLevels[i-1] > 1) {
        issues.push({
          type: 'heading-hierarchy',
          severity: 'medium',
          message: 'Heading hierarchy may be broken'
        })
        break
      }
    }
    
    return issues
  },

  // Generate accessibility report
  generateA11yReport: (issues) => {
    const totalIssues = issues.length
    const criticalIssues = issues.filter(i => i.severity === 'high').length
    const moderateIssues = issues.filter(i => i.severity === 'medium').length
    
    let score = 100
    score -= criticalIssues * 15
    score -= moderateIssues * 5
    
    return {
      score: Math.max(0, score),
      grade: score >= 95 ? 'AA' : score >= 85 ? 'A' : score >= 70 ? 'B' : score >= 50 ? 'C' : 'F',
      totalIssues,
      criticalIssues,
      moderateIssues,
      issues
    }
  }
}

/**
 * Performance quality assurance
 */
export const performanceQA = {
  // Monitor performance metrics
  measurePerformance: (componentName, measureFunction) => {
    const startTime = performance.now()
    const startMemory = performance.memory?.usedJSHeapSize || 0
    
    const result = measureFunction()
    
    const endTime = performance.now()
    const endMemory = performance.memory?.usedJSHeapSize || 0
    
    const metrics = {
      executionTime: endTime - startTime,
      memoryUsed: endMemory - startMemory,
      timestamp: new Date().toISOString()
    }
    
    // Log performance issues
    if (metrics.executionTime > 100) {
      logger.warn(`Slow performance detected in ${componentName}`, metrics)
    }
    
    return { result, metrics }
  },

  // Analyze bundle impact
  analyzeBundleImpact: (componentPath) => {
    // This would integrate with webpack-bundle-analyzer or similar
    return {
      size: 'Unknown',
      dependencies: [],
      recommendation: 'Use dynamic imports for large components'
    }
  },

  // Memory leak detection
  detectMemoryLeaks: (testFunction, iterations = 10) => {
    const measurements = []
    
    for (let i = 0; i < iterations; i++) {
      const beforeMemory = performance.memory?.usedJSHeapSize || 0
      
      testFunction()
      
      // Force garbage collection if available
      if (global.gc) {
        global.gc()
      }
      
      const afterMemory = performance.memory?.usedJSHeapSize || 0
      measurements.push(afterMemory - beforeMemory)
    }
    
    const avgIncrease = measurements.reduce((sum, val) => sum + val, 0) / measurements.length
    
    return {
      averageMemoryIncrease: avgIncrease,
      measurements,
      hasLeak: avgIncrease > 1024 * 100, // 100KB threshold
      recommendation: avgIncrease > 1024 * 100 ? 'Potential memory leak detected' : 'Memory usage looks normal'
    }
  }
}

/**
 * Security quality assurance
 */
export const securityQA = {
  // Scan for security vulnerabilities
  scanForVulnerabilities: (codeContent) => {
    const vulnerabilities = []
    
    // Check for dangerous functions
    const dangerousPatterns = [
      { pattern: /dangerouslySetInnerHTML/g, risk: 'high', type: 'XSS Risk' },
      { pattern: /eval\s*\(/g, risk: 'critical', type: 'Code Injection' },
      { pattern: /innerHTML\s*=/g, risk: 'medium', type: 'XSS Risk' },
      { pattern: /document\.write/g, risk: 'medium', type: 'XSS Risk' },
      { pattern: /window\.location/g, risk: 'low', type: 'Open Redirect' },
      { pattern: /localStorage\.setItem.*password/gi, risk: 'high', type: 'Credential Storage' },
      { pattern: /console\.log.*password/gi, risk: 'medium', type: 'Information Disclosure' }
    ]
    
    dangerousPatterns.forEach(({ pattern, risk, type }) => {
      const matches = codeContent.match(pattern)
      if (matches) {
        vulnerabilities.push({
          type,
          risk,
          count: matches.length,
          pattern: pattern.source
        })
      }
    })
    
    return vulnerabilities
  },

  // Validate secure coding practices
  validateSecurePractices: (codeContent) => {
    const practices = {
      hasInputValidation: /validate|sanitize/i.test(codeContent),
      hasErrorHandling: /try\s*{[\s\S]*catch|\.catch\(/g.test(codeContent),
      hasLogging: /logger\.|console\./g.test(codeContent),
      usesSecureHeaders: /helmet|cors|csrf/i.test(codeContent),
      hasRateLimiting: /rate.*limit|throttle/i.test(codeContent)
    }
    
    const score = Object.values(practices).filter(Boolean).length * 20
    
    return {
      score,
      practices,
      recommendations: [
        !practices.hasInputValidation && 'Add input validation',
        !practices.hasErrorHandling && 'Implement proper error handling',
        !practices.hasLogging && 'Add security logging',
        !practices.usesSecureHeaders && 'Implement security headers',
        !practices.hasRateLimiting && 'Consider rate limiting'
      ].filter(Boolean)
    }
  }
}

/**
 * Financial compliance quality assurance
 */
export const complianceQA = {
  // Check financial data handling compliance
  auditFinancialCompliance: (codeContent) => {
    const complianceIssues = []
    
    // Check for unencrypted sensitive data
    if (/password|ssn|account.*number|credit.*card/i.test(codeContent) && 
        !/encrypt|hash|secure/i.test(codeContent)) {
      complianceIssues.push({
        type: 'unencrypted-sensitive-data',
        severity: 'critical',
        message: 'Sensitive data may not be properly encrypted'
      })
    }
    
    // Check for audit trail implementation
    if (/transaction|transfer|payment/i.test(codeContent) && 
        !/audit|log|track/i.test(codeContent)) {
      complianceIssues.push({
        type: 'missing-audit-trail',
        severity: 'high',
        message: 'Financial operations should have audit trails'
      })
    }
    
    // Check for proper validation
    if (/amount|balance|fee/i.test(codeContent) && 
        !/validate|check|verify/i.test(codeContent)) {
      complianceIssues.push({
        type: 'insufficient-validation',
        severity: 'high',
        message: 'Financial amounts should be validated'
      })
    }
    
    return complianceIssues
  },

  // Generate compliance report
  generateComplianceReport: (issues) => {
    const criticalIssues = issues.filter(i => i.severity === 'critical').length
    const highIssues = issues.filter(i => i.severity === 'high').length
    const mediumIssues = issues.filter(i => i.severity === 'medium').length
    
    let score = 100
    score -= criticalIssues * 30
    score -= highIssues * 15
    score -= mediumIssues * 5
    
    return {
      score: Math.max(0, score),
      complianceLevel: score >= 95 ? 'Full Compliance' : 
                       score >= 85 ? 'Substantial Compliance' : 
                       score >= 70 ? 'Moderate Compliance' : 
                       'Non-Compliant',
      criticalIssues,
      highIssues,
      mediumIssues,
      issues,
      recommendations: [
        criticalIssues > 0 && 'Address critical compliance issues immediately',
        highIssues > 0 && 'Review and fix high-priority compliance issues',
        score < 85 && 'Implement comprehensive compliance review process'
      ].filter(Boolean)
    }
  }
}

/**
 * User experience quality assurance
 */
export const uxQA = {
  // Analyze UX patterns
  analyzeUXPatterns: (componentStructure) => {
    const patterns = {
      hasLoadingStates: componentStructure.includes('loading') || componentStructure.includes('Loading'),
      hasErrorStates: componentStructure.includes('error') || componentStructure.includes('Error'),
      hasEmptyStates: componentStructure.includes('empty') || componentStructure.includes('Empty'),
      hasProgressIndicators: componentStructure.includes('progress') || componentStructure.includes('Progress'),
      hasConfirmationDialogs: componentStructure.includes('confirm') || componentStructure.includes('Confirm'),
      hasAccessibleLabels: componentStructure.includes('aria-label') || componentStructure.includes('label'),
      hasKeyboardSupport: componentStructure.includes('onKeyDown') || componentStructure.includes('keyboard'),
      hasMobileOptimization: componentStructure.includes('mobile') || componentStructure.includes('responsive')
    }
    
    const score = Object.values(patterns).filter(Boolean).length * 12.5
    
    return {
      score,
      patterns,
      grade: score >= 90 ? 'Excellent' : score >= 75 ? 'Good' : score >= 60 ? 'Fair' : 'Poor',
      recommendations: [
        !patterns.hasLoadingStates && 'Add loading states for better UX',
        !patterns.hasErrorStates && 'Implement error state handling',
        !patterns.hasEmptyStates && 'Add empty state messaging',
        !patterns.hasProgressIndicators && 'Consider progress indicators for long operations',
        !patterns.hasConfirmationDialogs && 'Add confirmation for destructive actions',
        !patterns.hasAccessibleLabels && 'Improve accessibility with proper labeling',
        !patterns.hasKeyboardSupport && 'Add keyboard navigation support',
        !patterns.hasMobileOptimization && 'Optimize for mobile devices'
      ].filter(Boolean)
    }
  }
}

/**
 * Comprehensive quality assessment
 */
export const comprehensiveQA = {
  // Run full quality assessment
  runFullAssessment: async (component, codeContent) => {
    const startTime = Date.now()
    
    try {
      // Code quality analysis
      const complexity = codeQualityMetrics.analyzeComponentComplexity(codeContent)
      const codeQuality = codeQualityMetrics.assessComponentQuality(complexity)
      
      // Security analysis
      const vulnerabilities = securityQA.scanForVulnerabilities(codeContent)
      const securityPractices = securityQA.validateSecurePractices(codeContent)
      
      // Compliance analysis
      const complianceIssues = complianceQA.auditFinancialCompliance(codeContent)
      const complianceReport = complianceQA.generateComplianceReport(complianceIssues)
      
      // UX analysis
      const uxAnalysis = uxQA.analyzeUXPatterns(codeContent)
      
      // Accessibility analysis (if DOM element provided)
      let a11yReport = null
      if (component && typeof component === 'object' && component.nodeType) {
        const a11yIssues = accessibilityQA.auditAccessibility(component)
        a11yReport = accessibilityQA.generateA11yReport(a11yIssues)
      }
      
      // Calculate overall score
      const scores = [
        codeQuality.score,
        securityPractices.score,
        complianceReport.score,
        uxAnalysis.score
      ]
      
      if (a11yReport) {
        scores.push(a11yReport.score)
      }
      
      const overallScore = scores.reduce((sum, score) => sum + score, 0) / scores.length
      
      const assessment = {
        overallScore: Math.round(overallScore),
        overallGrade: overallScore >= 90 ? 'A' : 
                      overallScore >= 80 ? 'B' : 
                      overallScore >= 70 ? 'C' : 
                      overallScore >= 60 ? 'D' : 'F',
        assessmentDate: new Date().toISOString(),
        duration: Date.now() - startTime,
        categories: {
          codeQuality: {
            score: codeQuality.score,
            grade: codeQuality.grade,
            warnings: codeQuality.warnings,
            metrics: complexity
          },
          security: {
            score: securityPractices.score,
            vulnerabilities,
            practices: securityPractices.practices,
            recommendations: securityPractices.recommendations
          },
          compliance: {
            score: complianceReport.score,
            level: complianceReport.complianceLevel,
            issues: complianceReport.issues,
            recommendations: complianceReport.recommendations
          },
          userExperience: {
            score: uxAnalysis.score,
            grade: uxAnalysis.grade,
            patterns: uxAnalysis.patterns,
            recommendations: uxAnalysis.recommendations
          }
        }
      }
      
      if (a11yReport) {
        assessment.categories.accessibility = {
          score: a11yReport.score,
          grade: a11yReport.grade,
          issues: a11yReport.issues,
          criticalIssues: a11yReport.criticalIssues
        }
      }
      
      // Log assessment if in development
      if (getCurrentEnvironment() === 'development') {
        logger.info('Quality assessment completed', {
          overallScore: assessment.overallScore,
          duration: assessment.duration
        })
      }
      
      return assessment
      
    } catch (error) {
      logger.error('Quality assessment failed', error)
      throw error
    }
  },

  // Generate quality report
  generateQualityReport: (assessment) => {
    const report = {
      summary: {
        overallScore: assessment.overallScore,
        overallGrade: assessment.overallGrade,
        assessmentDate: assessment.assessmentDate,
        totalRecommendations: 0
      },
      categories: [],
      priorityActions: [],
      trends: {
        improving: [],
        declining: [],
        stable: []
      }
    }
    
    // Process each category
    Object.entries(assessment.categories).forEach(([category, data]) => {
      const categoryInfo = {
        name: category,
        score: data.score,
        grade: data.grade || 'N/A',
        issues: data.issues?.length || data.vulnerabilities?.length || 0,
        recommendations: data.recommendations?.length || data.warnings?.length || 0
      }
      
      report.categories.push(categoryInfo)
      report.summary.totalRecommendations += categoryInfo.recommendations
      
      // Add high-priority actions
      if (data.score < 70) {
        report.priorityActions.push({
          category,
          action: `Improve ${category} score (currently ${data.score}%)`,
          priority: data.score < 50 ? 'critical' : 'high'
        })
      }
    })
    
    return report
  }
}

/**
 * Quality monitoring and continuous improvement
 */
export const qualityMonitoring = {
  // Track quality metrics over time
  trackQualityMetrics: (assessment, componentName) => {
    const metrics = {
      componentName,
      timestamp: Date.now(),
      overallScore: assessment.overallScore,
      categoryScores: Object.fromEntries(
        Object.entries(assessment.categories).map(([key, value]) => [key, value.score])
      )
    }
    
    // Store in localStorage for development
    if (getCurrentEnvironment() === 'development') {
      const existing = JSON.parse(localStorage.getItem('quality_metrics') || '[]')
      existing.push(metrics)
      
      // Keep only last 100 measurements
      if (existing.length > 100) {
        existing.splice(0, existing.length - 100)
      }
      
      localStorage.setItem('quality_metrics', JSON.stringify(existing))
    }
    
    return metrics
  },

  // Get quality trends
  getQualityTrends: (componentName) => {
    const metrics = JSON.parse(localStorage.getItem('quality_metrics') || '[]')
    const componentMetrics = metrics.filter(m => m.componentName === componentName)
    
    if (componentMetrics.length < 2) {
      return { trend: 'insufficient_data', message: 'Need more data points for trend analysis' }
    }
    
    const recent = componentMetrics.slice(-5)
    const scores = recent.map(m => m.overallScore)
    
    const trend = scores[scores.length - 1] - scores[0]
    
    return {
      trend: trend > 5 ? 'improving' : trend < -5 ? 'declining' : 'stable',
      change: trend,
      recentScores: scores,
      recommendations: trend < -5 ? ['Quality is declining, review recent changes'] : 
                       trend > 5 ? ['Quality is improving, maintain current practices'] : 
                       ['Quality is stable, consider optimizations']
    }
  }
}

export default {
  codeQualityMetrics,
  accessibilityQA,
  performanceQA,
  securityQA,
  complianceQA,
  uxQA,
  comprehensiveQA,
  qualityMonitoring
}