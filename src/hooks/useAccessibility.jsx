/**
 * Accessibility Hooks
 * Provides keyboard navigation, screen reader support, and focus management
 */

import { useState, useEffect, useRef, useCallback } from 'react'

// Focus management hook
export function useFocusManagement() {
  const [focusedElement, setFocusedElement] = useState(null)
  const previousFocusRef = useRef(null)

  const trapFocus = useCallback((containerRef) => {
    if (!containerRef.current) return

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    const firstElement = focusableElements[0]
    const lastElement = focusableElements[focusableElements.length - 1]

    const handleKeyDown = (e) => {
      if (e.key === 'Tab') {
        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus()
            e.preventDefault()
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus()
            e.preventDefault()
          }
        }
      }
    }

    containerRef.current.addEventListener('keydown', handleKeyDown)
    
    return () => {
      if (containerRef.current) {
        containerRef.current.removeEventListener('keydown', handleKeyDown)
      }
    }
  }, [])

  const saveFocus = useCallback(() => {
    previousFocusRef.current = document.activeElement
  }, [])

  const restoreFocus = useCallback(() => {
    if (previousFocusRef.current) {
      previousFocusRef.current.focus()
      previousFocusRef.current = null
    }
  }, [])

  const focusFirst = useCallback((containerRef) => {
    if (!containerRef.current) return

    const focusableElements = containerRef.current.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    )
    
    if (focusableElements.length > 0) {
      focusableElements[0].focus()
    }
  }, [])

  return {
    focusedElement,
    setFocusedElement,
    trapFocus,
    saveFocus,
    restoreFocus,
    focusFirst
  }
}

// Keyboard navigation hook
export function useKeyboardNavigation(items, options = {}) {
  const {
    loop = true,
    orientation = 'vertical', // 'vertical' | 'horizontal' | 'both'
    onSelect,
    disabled = false
  } = options

  const [activeIndex, setActiveIndex] = useState(-1)
  const containerRef = useRef(null)

  const handleKeyDown = useCallback((e) => {
    if (disabled || !items.length) return

    const { key } = e
    let preventDefault = false
    let newIndex = activeIndex

    switch (key) {
      case 'ArrowDown':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = activeIndex < items.length - 1 ? activeIndex + 1 : loop ? 0 : activeIndex
          preventDefault = true
        }
        break
      
      case 'ArrowUp':
        if (orientation === 'vertical' || orientation === 'both') {
          newIndex = activeIndex > 0 ? activeIndex - 1 : loop ? items.length - 1 : activeIndex
          preventDefault = true
        }
        break
      
      case 'ArrowRight':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = activeIndex < items.length - 1 ? activeIndex + 1 : loop ? 0 : activeIndex
          preventDefault = true
        }
        break
      
      case 'ArrowLeft':
        if (orientation === 'horizontal' || orientation === 'both') {
          newIndex = activeIndex > 0 ? activeIndex - 1 : loop ? items.length - 1 : activeIndex
          preventDefault = true
        }
        break
      
      case 'Home':
        newIndex = 0
        preventDefault = true
        break
      
      case 'End':
        newIndex = items.length - 1
        preventDefault = true
        break
      
      case 'Enter':
      case ' ':
        if (activeIndex >= 0 && onSelect) {
          onSelect(items[activeIndex], activeIndex)
          preventDefault = true
        }
        break
    }

    if (preventDefault) {
      e.preventDefault()
      setActiveIndex(newIndex)
    }
  }, [activeIndex, items, loop, orientation, onSelect, disabled])

  useEffect(() => {
    const container = containerRef.current
    if (container) {
      container.addEventListener('keydown', handleKeyDown)
      return () => container.removeEventListener('keydown', handleKeyDown)
    }
  }, [handleKeyDown])

  return {
    activeIndex,
    setActiveIndex,
    containerRef,
    getItemProps: (index) => ({
      'aria-selected': index === activeIndex,
      tabIndex: index === activeIndex ? 0 : -1,
      onFocus: () => setActiveIndex(index),
      onMouseEnter: () => setActiveIndex(index)
    })
  }
}

// Screen reader announcements hook
export function useAnnouncer() {
  const announcerRef = useRef(null)

  useEffect(() => {
    // Create announcer element if it doesn't exist
    if (!announcerRef.current) {
      const announcer = document.createElement('div')
      announcer.setAttribute('aria-live', 'polite')
      announcer.setAttribute('aria-atomic', 'true')
      announcer.style.position = 'absolute'
      announcer.style.left = '-10000px'
      announcer.style.width = '1px'
      announcer.style.height = '1px'
      announcer.style.overflow = 'hidden'
      document.body.appendChild(announcer)
      announcerRef.current = announcer
    }

    return () => {
      if (announcerRef.current && document.body.contains(announcerRef.current)) {
        document.body.removeChild(announcerRef.current)
      }
    }
  }, [])

  const announce = useCallback((message, priority = 'polite') => {
    if (announcerRef.current) {
      announcerRef.current.setAttribute('aria-live', priority)
      announcerRef.current.textContent = message
      
      // Clear after a short delay to ensure it can be announced again
      setTimeout(() => {
        if (announcerRef.current) {
          announcerRef.current.textContent = ''
        }
      }, 1000)
    }
  }, [])

  return { announce }
}

// High contrast mode detection
export function useHighContrast() {
  const [isHighContrast, setIsHighContrast] = useState(false)

  useEffect(() => {
    const checkHighContrast = () => {
      const testElement = document.createElement('div')
      testElement.style.color = 'rgb(31, 31, 31)'
      testElement.style.backgroundColor = 'rgb(255, 255, 255)'
      document.body.appendChild(testElement)
      
      const computedStyle = window.getComputedStyle(testElement)
      const isHighContrast = computedStyle.color !== 'rgb(31, 31, 31)' || 
                           computedStyle.backgroundColor !== 'rgb(255, 255, 255)'
      
      document.body.removeChild(testElement)
      setIsHighContrast(isHighContrast)
    }

    checkHighContrast()
    
    // Check for changes
    const mediaQuery = window.matchMedia('(prefers-contrast: high)')
    const handleChange = () => checkHighContrast()
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    }
  }, [])

  return isHighContrast
}

// Reduced motion preference
export function useReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    setPrefersReducedMotion(mediaQuery.matches)

    const handleChange = (e) => setPrefersReducedMotion(e.matches)
    
    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleChange)
      return () => mediaQuery.removeEventListener('change', handleChange)
    } else {
      // Fallback for older browsers
      mediaQuery.addListener(handleChange)
      return () => mediaQuery.removeListener(handleChange)
    }
  }, [])

  return prefersReducedMotion
}

// Skip link functionality
export function useSkipLinks() {
  const [skipLinks, setSkipLinks] = useState([])

  const registerSkipLink = useCallback((id, label) => {
    setSkipLinks(prev => [...prev.filter(link => link.id !== id), { id, label }])
  }, [])

  const unregisterSkipLink = useCallback((id) => {
    setSkipLinks(prev => prev.filter(link => link.id !== id))
  }, [])

  const skipTo = useCallback((id) => {
    const element = document.getElementById(id)
    if (element) {
      element.focus({ preventScroll: false })
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [])

  return {
    skipLinks,
    registerSkipLink,
    unregisterSkipLink,
    skipTo
  }
}

// Color contrast checking
export function useColorContrast() {
  const checkContrast = useCallback((foreground, background) => {
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
      AAALarge: contrast >= 4.5
    }
  }, [])

  return { checkContrast }
}

// ARIA live region hook
export function useAriaLive() {
  const liveRegionRef = useRef(null)

  useEffect(() => {
    if (!liveRegionRef.current) {
      const liveRegion = document.createElement('div')
      liveRegion.setAttribute('aria-live', 'polite')
      liveRegion.setAttribute('aria-atomic', 'false')
      liveRegion.style.position = 'absolute'
      liveRegion.style.left = '-10000px'
      liveRegion.style.width = '1px'
      liveRegion.style.height = '1px'
      liveRegion.style.overflow = 'hidden'
      document.body.appendChild(liveRegion)
      liveRegionRef.current = liveRegion
    }

    return () => {
      if (liveRegionRef.current && document.body.contains(liveRegionRef.current)) {
        document.body.removeChild(liveRegionRef.current)
      }
    }
  }, [])

  const announceToLiveRegion = useCallback((message, priority = 'polite') => {
    if (liveRegionRef.current) {
      liveRegionRef.current.setAttribute('aria-live', priority)
      liveRegionRef.current.textContent = message
    }
  }, [])

  return { announceToLiveRegion }
}