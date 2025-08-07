/**
 * Accessibility Checker Utility
 * Automated accessibility testing and reporting
 */

// Color contrast checker
export function checkColorContrast(foreground, background) {
  // Convert hex to RGB
  const hexToRgb = (hex) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null
  }

  // Calculate relative luminance
  const getLuminance = (rgb) => {
    const { r, g, b } = rgb
    const [rs, gs, bs] = [r, g, b].map(c => {
      c = c / 255
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)
    })
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
  }

  const fg = hexToRgb(foreground)
  const bg = hexToRgb(background)
  
  if (!fg || !bg) return null

  const fgLum = getLuminance(fg)
  const bgLum = getLuminance(bg)
  
  const contrast = (Math.max(fgLum, bgLum) + 0.05) / (Math.min(fgLum, bgLum) + 0.05)
  
  return {
    ratio: Math.round(contrast * 100) / 100,
    AA: contrast >= 4.5,
    AAA: contrast >= 7,
    AALarge: contrast >= 3,
    AAALarge: contrast >= 4.5,
    level: contrast >= 7 ? 'AAA' : contrast >= 4.5 ? 'AA' : 'Fail'
  }
}

// Focus management checker
export function checkFocusManagement() {
  const issues = []
  
  // Check for focus traps in modals
  const modals = document.querySelectorAll('[role="dialog"], [role="alertdialog"]')
  modals.forEach((modal, index) => {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    if (focusableElements.length === 0) {
      issues.push({
        type: 'focus',
        severity: 'error',
        element: modal,
        message: `Modal ${index + 1} has no focusable elements`
      })
    }
  })

  // Check for skip links
  const skipLinks = document.querySelectorAll('a[href^="#"]')
  const hasMainSkipLink = Array.from(skipLinks).some(link => 
    link.textContent.toLowerCase().includes('skip to main') ||
    link.getAttribute('href') === '#main-content'
  )
  
  if (!hasMainSkipLink) {
    issues.push({
      type: 'focus',
      severity: 'warning',
      message: 'No "skip to main content" link found'
    })
  }

  return issues
}

// ARIA attributes checker
export function checkAriaAttributes() {
  const issues = []
  
  // Check for required ARIA labels
  const buttonsWithoutLabels = document.querySelectorAll('button:not([aria-label]):not([aria-labelledby])')
  buttonsWithoutLabels.forEach((button) => {
    if (!button.textContent.trim()) {
      issues.push({
        type: 'aria',
        severity: 'error',
        element: button,
        message: 'Button without text content must have aria-label or aria-labelledby'
      })
    }
  })

  // Check for form controls without labels
  const inputsWithoutLabels = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])')
  inputsWithoutLabels.forEach((input) => {
    const id = input.getAttribute('id')
    const hasLabel = id && document.querySelector(`label[for="${id}"]`)
    
    if (!hasLabel) {
      issues.push({
        type: 'aria',
        severity: 'error',
        element: input,
        message: 'Form input must have associated label or aria-label'
      })
    }
  })

  // Check for images without alt text
  const imagesWithoutAlt = document.querySelectorAll('img:not([alt])')
  imagesWithoutAlt.forEach((img) => {
    issues.push({
      type: 'aria',
      severity: 'error',
      element: img,
      message: 'Image must have alt attribute (use empty alt="" for decorative images)'
    })
  })

  // Check for proper heading structure
  const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6')
  let lastLevel = 0
  
  headings.forEach((heading) => {
    const level = parseInt(heading.tagName[1])
    
    if (level > lastLevel + 1) {
      issues.push({
        type: 'aria',
        severity: 'warning',
        element: heading,
        message: `Heading level ${level} follows heading level ${lastLevel} - skipped heading level`
      })
    }
    
    lastLevel = level
  })

  return issues
}

// Keyboard navigation checker
export function checkKeyboardNavigation() {
  const issues = []
  
  // Check for keyboard traps
  const focusableElements = document.querySelectorAll(
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
  )
  
  // Check for proper tab order
  const tabbableElements = Array.from(focusableElements).filter(el => {
    const tabIndex = el.getAttribute('tabindex')
    return tabIndex === null || parseInt(tabIndex) >= 0
  })

  // Check for custom interactive elements without proper keyboard support
  const customInteractive = document.querySelectorAll('[role="button"], [role="tab"], [role="menuitem"]')
  customInteractive.forEach((element) => {
    const hasKeyHandler = element.hasAttribute('onkeydown') || 
                         element.hasAttribute('onkeyup') ||
                         element.hasAttribute('onkeypress')
    
    if (!hasKeyHandler) {
      issues.push({
        type: 'keyboard',
        severity: 'warning',
        element: element,
        message: 'Custom interactive element should handle keyboard events'
      })
    }
  })

  return issues
}

// Semantic HTML checker
export function checkSemanticHTML() {
  const issues = []
  
  // Check for landmark regions
  const landmarks = {
    main: document.querySelectorAll('main, [role="main"]'),
    nav: document.querySelectorAll('nav, [role="navigation"]'),
    header: document.querySelectorAll('header, [role="banner"]'),
    footer: document.querySelectorAll('footer, [role="contentinfo"]')
  }
  
  Object.entries(landmarks).forEach(([type, elements]) => {
    if (elements.length === 0) {
      issues.push({
        type: 'semantic',
        severity: 'warning',
        message: `No ${type} landmark found - consider adding for better navigation`
      })
    } else if (elements.length > 1 && (type === 'main' || type === 'header' || type === 'footer')) {
      issues.push({
        type: 'semantic',
        severity: 'warning',
        message: `Multiple ${type} landmarks found - should typically have only one`
      })
    }
  })

  // Check for proper list structure
  const listItems = document.querySelectorAll('li')
  listItems.forEach((li) => {
    const parent = li.parentElement
    if (!parent || !['UL', 'OL', 'MENU'].includes(parent.tagName)) {
      issues.push({
        type: 'semantic',
        severity: 'error',
        element: li,
        message: 'List item must be inside ul, ol, or menu element'
      })
    }
  })

  return issues
}

// Text alternatives checker
export function checkTextAlternatives() {
  const issues = []
  
  // Check decorative images
  const decorativeImages = document.querySelectorAll('img[alt=""]')
  decorativeImages.forEach((img) => {
    if (img.getAttribute('role') !== 'presentation') {
      issues.push({
        type: 'text-alternatives',
        severity: 'info',
        element: img,
        message: 'Decorative image should have role="presentation" for clarity'
      })
    }
  })

  // Check for icon fonts without text alternatives
  const iconElements = document.querySelectorAll('.icon, [class*="icon-"], i[class*="fa-"]')
  iconElements.forEach((icon) => {
    const hasTextAlternative = icon.getAttribute('aria-label') ||
                              icon.getAttribute('title') ||
                              icon.textContent.trim()
    
    if (!hasTextAlternative) {
      issues.push({
        type: 'text-alternatives',
        severity: 'warning',
        element: icon,
        message: 'Icon should have text alternative via aria-label, title, or text content'
      })
    }
  })

  return issues
}

// Comprehensive accessibility audit
export function runAccessibilityAudit() {
  const results = {
    timestamp: new Date().toISOString(),
    url: window.location.href,
    issues: [],
    summary: {
      total: 0,
      errors: 0,
      warnings: 0,
      info: 0
    }
  }

  // Run all checks
  const checks = [
    checkFocusManagement,
    checkAriaAttributes,
    checkKeyboardNavigation,
    checkSemanticHTML,
    checkTextAlternatives
  ]

  checks.forEach(check => {
    try {
      const issues = check()
      results.issues.push(...issues)
    } catch (error) {
      results.issues.push({
        type: 'system',
        severity: 'error',
        message: `Error running ${check.name}: ${error.message}`
      })
    }
  })

  // Calculate summary
  results.issues.forEach(issue => {
    results.summary.total++
    results.summary[issue.severity]++
  })

  return results
}

// Report generator
export function generateAccessibilityReport(results) {
  const { issues, summary } = results
  
  let report = `# Accessibility Audit Report\n\n`
  report += `**Generated:** ${new Date(results.timestamp).toLocaleString()}\n`
  report += `**URL:** ${results.url}\n\n`
  
  report += `## Summary\n\n`
  report += `- **Total Issues:** ${summary.total}\n`
  report += `- **Errors:** ${summary.errors}\n`
  report += `- **Warnings:** ${summary.warnings}\n`
  report += `- **Info:** ${summary.info}\n\n`

  if (issues.length === 0) {
    report += `## ✅ No accessibility issues found!\n\n`
    return report
  }

  // Group issues by type
  const issuesByType = issues.reduce((acc, issue) => {
    if (!acc[issue.type]) acc[issue.type] = []
    acc[issue.type].push(issue)
    return acc
  }, {})

  Object.entries(issuesByType).forEach(([type, typeIssues]) => {
    report += `## ${type.charAt(0).toUpperCase() + type.slice(1)} Issues\n\n`
    
    typeIssues.forEach((issue, index) => {
      const severity = issue.severity.toUpperCase()
      const icon = issue.severity === 'error' ? '❌' : 
                   issue.severity === 'warning' ? '⚠️' : 'ℹ️'
      
      report += `### ${icon} ${severity} ${index + 1}\n\n`
      report += `**Message:** ${issue.message}\n\n`
      
      if (issue.element) {
        report += `**Element:** \`${issue.element.tagName.toLowerCase()}\`\n`
        if (issue.element.className) {
          report += `**Classes:** \`${issue.element.className}\`\n`
        }
        if (issue.element.id) {
          report += `**ID:** \`${issue.element.id}\`\n`
        }
      }
      
      report += `\n---\n\n`
    })
  })

  return report
}

// Live accessibility monitoring
export function startAccessibilityMonitoring(callback) {
  let lastAuditResults = null
  
  const runAudit = () => {
    const results = runAccessibilityAudit()
    
    // Only call callback if issues have changed
    if (!lastAuditResults || 
        JSON.stringify(results.issues) !== JSON.stringify(lastAuditResults.issues)) {
      callback(results)
      lastAuditResults = results
    }
  }

  // Initial audit
  runAudit()

  // Monitor DOM changes
  const observer = new MutationObserver(() => {
    // Debounce audits
    clearTimeout(observer.timeoutId)
    observer.timeoutId = setTimeout(runAudit, 1000)
  })

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ['aria-label', 'aria-labelledby', 'role', 'tabindex', 'alt']
  })

  return () => {
    observer.disconnect()
    clearTimeout(observer.timeoutId)
  }
}

// Development helper to log accessibility issues
export function logAccessibilityIssues() {
  if (process.env.NODE_ENV !== 'development') return

  const results = runAccessibilityAudit()
  
  if (results.issues.length === 0) {
    console.log('✅ No accessibility issues found!')
    return
  }

  console.group('🔍 Accessibility Issues Found')
  
  results.issues.forEach((issue, index) => {
    const severity = issue.severity.toUpperCase()
    const style = issue.severity === 'error' ? 'color: red' :
                  issue.severity === 'warning' ? 'color: orange' : 'color: blue'
    
    console.group(`%c${severity} ${index + 1}: ${issue.message}`, style)
    
    if (issue.element) {
      console.log('Element:', issue.element)
    }
    
    console.groupEnd()
  })
  
  console.groupEnd()
  
  return results
}