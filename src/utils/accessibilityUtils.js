/**
 * FinTech Accessibility Utilities
 * Provides comprehensive accessibility support for financial applications
 */

import { useEffect, useRef, useState, useCallback } from 'react'

/**
 * Screen reader announcements for financial operations
 */
export const announceToScreenReader = (message, priority = 'polite') => {
  // Create or find existing screen reader announcement element
  let announcer = document.getElementById('screen-reader-announcer')
  
  if (!announcer) {
    announcer = document.createElement('div')
    announcer.id = 'screen-reader-announcer'
    announcer.setAttribute('aria-live', priority)
    announcer.setAttribute('aria-atomic', 'true')
    announcer.style.position = 'absolute'
    announcer.style.left = '-10000px'
    announcer.style.width = '1px'
    announcer.style.height = '1px'
    announcer.style.overflow = 'hidden'
    document.body.appendChild(announcer)
  }
  
  // Clear previous message and set new one
  announcer.textContent = ''
  setTimeout(() => {
    announcer.textContent = message
  }, 100)
  
  // Clear after announcement
  setTimeout(() => {
    announcer.textContent = ''
  }, 3000)
}

/**
 * Focus management utilities
 */
export const focusManagement = {
  // Trap focus within a container
  trapFocus: (containerRef) => {
    const container = containerRef.current
    if (!container) return () => {}
    
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstFocusable = focusableElements[0]
    const lastFocusable = focusableElements[focusableElements.length - 1]
    
    const handleTabKey = (e) => {
      if (e.key !== 'Tab') return
      
      if (e.shiftKey) {
        if (document.activeElement === firstFocusable) {
          e.preventDefault()
          lastFocusable.focus()
        }
      } else {
        if (document.activeElement === lastFocusable) {
          e.preventDefault()
          firstFocusable.focus()
        }
      }
    }
    
    container.addEventListener('keydown', handleTabKey)
    firstFocusable?.focus()
    
    return () => {
      container.removeEventListener('keydown', handleTabKey)
    }
  },

  // Move focus to element with announcement
  moveFocusTo: (elementId, announcement) => {
    const element = document.getElementById(elementId)
    if (element) {
      element.focus()
      if (announcement) {
        announceToScreenReader(announcement)
      }
    }
  },

  // Focus first error in form
  focusFirstError: (formRef) => {
    const form = formRef.current
    if (!form) return
    
    const errorElement = form.querySelector('[aria-invalid="true"], .error')
    if (errorElement) {
      errorElement.focus()
      announceToScreenReader('Please correct the errors in the form', 'assertive')
    }
  }
}

/**
 * Keyboard navigation hook
 */
export const useKeyboardNavigation = (options = {}) => {
  const {
    onEscape,
    onEnter,
    onArrowKeys,
    onTab,
    enabled = true
  } = options
  
  useEffect(() => {
    if (!enabled) return
    
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'Escape':
          onEscape?.(e)
          break
        case 'Enter':
          onEnter?.(e)
          break
        case 'ArrowUp':
        case 'ArrowDown':
        case 'ArrowLeft':
        case 'ArrowRight':
          onArrowKeys?.(e, e.key)
          break
        case 'Tab':
          onTab?.(e)
          break
      }
    }
    
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [onEscape, onEnter, onArrowKeys, onTab, enabled])
}

/**
 * ARIA live region hook for dynamic content
 */
export const useAriaLiveRegion = (initialMessage = '') => {
  const [message, setMessage] = useState(initialMessage)
  const [priority, setPriority] = useState('polite')
  
  const announce = useCallback((newMessage, newPriority = 'polite') => {
    setMessage('')
    setPriority(newPriority)
    setTimeout(() => setMessage(newMessage), 100)
  }, [])
  
  const LiveRegion = ({ className = '' }) => (
    <div
      aria-live={priority}
      aria-atomic="true"
      className={`sr-only ${className}`}
    >
      {message}
    </div>
  )
  
  return { announce, LiveRegion }
}

/**
 * Financial data accessibility utilities
 */
export const financialA11y = {
  // Format currency for screen readers
  formatCurrencyForScreenReader: (amount, currency = 'USD') => {
    const formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2
    })
    
    const formatted = formatter.format(amount)
    
    // Make it more screen reader friendly
    return formatted
      .replace('$', 'dollars ')
      .replace('€', 'euros ')
      .replace('£', 'pounds ')
      .replace('.', ' and ')
      .replace(/(\d)(\d{3})/, '$1 thousand $2')
  },

  // Announce transaction status changes
  announceTransactionStatus: (status, amount, description) => {
    const statusMessages = {
      pending: 'Transaction is being processed',
      completed: 'Transaction completed successfully',
      failed: 'Transaction failed',
      cancelled: 'Transaction was cancelled'
    }
    
    const message = `${statusMessages[status]}. ${description}. Amount: ${
      financialA11y.formatCurrencyForScreenReader(amount)
    }`
    
    announceToScreenReader(message, status === 'failed' ? 'assertive' : 'polite')
  },

  // Announce balance changes
  announceBalanceChange: (oldBalance, newBalance, currency = 'USD') => {
    const oldFormatted = financialA11y.formatCurrencyForScreenReader(oldBalance, currency)
    const newFormatted = financialA11y.formatCurrencyForScreenReader(newBalance, currency)
    
    const message = `Balance updated from ${oldFormatted} to ${newFormatted}`
    announceToScreenReader(message)
  },

  // Format percentage for screen readers
  formatPercentageForScreenReader: (percentage) => {
    return `${percentage} percent`
  }
}

/**
 * Error announcement utilities
 */
export const errorA11y = {
  // Announce form validation errors
  announceFormErrors: (errors) => {
    const errorCount = Object.keys(errors).length
    if (errorCount === 0) return
    
    const message = errorCount === 1
      ? 'There is 1 error in the form'
      : `There are ${errorCount} errors in the form`
    
    announceToScreenReader(message, 'assertive')
  },

  // Announce API errors
  announceApiError: (error) => {
    const message = error.userMessage || 'An error occurred. Please try again.'
    announceToScreenReader(message, 'assertive')
  },

  // Announce success messages
  announceSuccess: (message) => {
    announceToScreenReader(message, 'polite')
  }
}

/**
 * Loading state accessibility
 */
export const loadingA11y = {
  // Announce loading states
  announceLoading: (action = 'Loading') => {
    announceToScreenReader(`${action}, please wait`)
  },

  // Announce completion
  announceLoadingComplete: (action = 'Loading complete') => {
    announceToScreenReader(action)
  }
}

/**
 * Navigation accessibility utilities
 */
export const navigationA11y = {
  // Announce page changes
  announcePageChange: (pageName) => {
    announceToScreenReader(`Navigated to ${pageName}`)
  },

  // Announce route changes
  announceRouteChange: (routeName, routeDescription) => {
    announceToScreenReader(`${routeName}. ${routeDescription}`)
  },

  // Skip links utility
  createSkipLink: (targetId, linkText = 'Skip to main content') => {
    const skipLink = document.createElement('a')
    skipLink.href = `#${targetId}`
    skipLink.textContent = linkText
    skipLink.className = 'skip-link'
    skipLink.style.cssText = `
      position: absolute;
      top: -40px;
      left: 6px;
      background: #000;
      color: #fff;
      padding: 8px;
      text-decoration: none;
      z-index: 9999;
      transition: top 0.3s;
    `
    
    skipLink.addEventListener('focus', () => {
      skipLink.style.top = '6px'
    })
    
    skipLink.addEventListener('blur', () => {
      skipLink.style.top = '-40px'
    })
    
    return skipLink
  }
}

/**
 * High contrast mode utilities
 */
export const highContrastUtils = {
  // Detect high contrast mode
  detectHighContrast: () => {
    // Create a test element to detect high contrast
    const testEl = document.createElement('div')
    testEl.style.cssText = `
      position: absolute;
      top: -999px;
      width: 1px;
      height: 1px;
      background-color: rgb(31, 31, 31);
    `
    document.body.appendChild(testEl)
    
    const computed = window.getComputedStyle(testEl)
    const isHighContrast = computed.backgroundColor !== 'rgb(31, 31, 31)'
    
    document.body.removeChild(testEl)
    return isHighContrast
  },

  // Apply high contrast styles
  applyHighContrastStyles: () => {
    const style = document.createElement('style')
    style.textContent = `
      .high-contrast {
        filter: contrast(150%) brightness(120%);
      }
      .high-contrast button,
      .high-contrast input,
      .high-contrast select {
        border: 2px solid !important;
      }
      .high-contrast a {
        text-decoration: underline !important;
      }
    `
    document.head.appendChild(style)
    document.body.classList.add('high-contrast')
  }
}

/**
 * Reduced motion utilities
 */
export const reducedMotionUtils = {
  // Detect reduced motion preference
  prefersReducedMotion: () => {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  },

  // Apply reduced motion styles
  applyReducedMotionStyles: () => {
    if (reducedMotionUtils.prefersReducedMotion()) {
      const style = document.createElement('style')
      style.textContent = `
        *, *::before, *::after {
          animation-duration: 0.01ms !important;
          animation-iteration-count: 1 !important;
          transition-duration: 0.01ms !important;
        }
      `
      document.head.appendChild(style)
    }
  }
}

/**
 * ARIA label generators
 */
export const ariaLabelGenerators = {
  // Generate label for currency input
  currencyInputLabel: (currency = 'USD', purpose = 'amount') => {
    return `Enter ${purpose} in ${currency}`
  },

  // Generate label for transaction item
  transactionLabel: (transaction) => {
    return `Transaction: ${transaction.description}, ${transaction.amount}, ${transaction.time}, Status: ${transaction.status || 'completed'}`
  },

  // Generate label for balance display
  balanceLabel: (balance, accountType = 'account') => {
    return `${accountType} balance: ${financialA11y.formatCurrencyForScreenReader(balance)}`
  },

  // Generate label for chart data
  chartDataLabel: (dataPoint, index, total) => {
    return `Data point ${index + 1} of ${total}: ${dataPoint.label}, ${dataPoint.value}`
  }
}

/**
 * Hook for comprehensive accessibility
 */
export const useAccessibility = (options = {}) => {
  const {
    announceOnMount,
    trapFocus = false,
    skipLinks = [],
    highContrast = false,
    reducedMotion = true
  } = options
  
  const containerRef = useRef()
  const { announce, LiveRegion } = useAriaLiveRegion()
  
  useEffect(() => {
    // Initial announcement
    if (announceOnMount) {
      announce(announceOnMount)
    }
    
    // Setup focus trap
    let cleanupFocusTrap
    if (trapFocus && containerRef.current) {
      cleanupFocusTrap = focusManagement.trapFocus(containerRef)
    }
    
    // Add skip links
    skipLinks.forEach(skipLink => {
      const link = navigationA11y.createSkipLink(skipLink.target, skipLink.text)
      document.body.insertBefore(link, document.body.firstChild)
    })
    
    // Apply accessibility preferences
    if (highContrast && highContrastUtils.detectHighContrast()) {
      highContrastUtils.applyHighContrastStyles()
    }
    
    if (reducedMotion) {
      reducedMotionUtils.applyReducedMotionStyles()
    }
    
    return cleanupFocusTrap
  }, [announceOnMount, trapFocus, skipLinks, highContrast, reducedMotion])
  
  return {
    containerRef,
    announce,
    LiveRegion,
    announceToScreenReader,
    focusManagement,
    financialA11y,
    errorA11y,
    loadingA11y,
    navigationA11y
  }
}

export default {
  announceToScreenReader,
  focusManagement,
  useKeyboardNavigation,
  useAriaLiveRegion,
  financialA11y,
  errorA11y,
  loadingA11y,
  navigationA11y,
  highContrastUtils,
  reducedMotionUtils,
  ariaLabelGenerators,
  useAccessibility
}