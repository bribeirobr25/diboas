/**
 * Performance Optimizations for FinTech Application
 * Implements critical performance improvements for financial operations
 */

import { useMemo, useCallback, useRef, useEffect, useState } from 'react'

/**
 * Money Object Pool for performance optimization
 * Reduces garbage collection pressure in financial calculations
 */
class MoneyPool {
  constructor(maxSize = 1000) {
    this.pool = []
    this.maxSize = maxSize
    this.hits = 0
    this.misses = 0
  }

  get(amount, currency) {
    // Try to find reusable Money object
    const index = this.pool.findIndex(
      money => money._amount === amount && money._currency === currency
    )
    
    if (index !== -1) {
      this.hits++
      return this.pool.splice(index, 1)[0]
    }
    
    this.misses++
    return null
  }

  return(money) {
    if (this.pool.length < this.maxSize) {
      this.pool.push(money)
    }
  }

  getStats() {
    const total = this.hits + this.misses
    return {
      hits: this.hits,
      misses: this.misses,
      hitRate: total > 0 ? (this.hits / total * 100).toFixed(2) + '%' : '0%',
      poolSize: this.pool.length
    }
  }

  clear() {
    this.pool = []
    this.hits = 0
    this.misses = 0
  }
}

// Global Money pool instance
export const moneyPool = new MoneyPool()

/**
 * Memoized calculation cache for expensive operations
 */
const calculationCache = new Map()
const CACHE_SIZE_LIMIT = 10000
const CACHE_TTL = 300000 // 5 minutes

export const memoizedCalculation = (key, calculation) => {
  const now = Date.now()
  
  // Check if result is cached and not expired
  if (calculationCache.has(key)) {
    const { result, timestamp } = calculationCache.get(key)
    if (now - timestamp < CACHE_TTL) {
      return result
    }
  }
  
  // Calculate new result
  const result = calculation()
  
  // Manage cache size
  if (calculationCache.size >= CACHE_SIZE_LIMIT) {
    const oldestKey = calculationCache.keys().next().value
    calculationCache.delete(oldestKey)
  }
  
  calculationCache.set(key, { result, timestamp: now })
  return result
}

/**
 * Debounced function hook for performance
 */
export const useDebounce = (callback, delay) => {
  const timeoutRef = useRef()
  
  return useCallback((...args) => {
    clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => callback(...args), delay)
  }, [callback, delay])
}

/**
 * Optimized feature flag memoization
 */
export const useOptimizedFeatureFlags = (flags) => {
  return useMemo(() => {
    const memoizedFlags = {}
    flags.forEach(flag => {
      memoizedFlags[flag] = typeof flag === 'string' ? 
        localStorage.getItem(`feature_${flag}`) === 'true' : false
    })
    return memoizedFlags
  }, [flags.join(',')])
}

/**
 * Virtual scrolling hook for large lists
 */
export const useVirtualScrolling = (items, itemHeight = 50, containerHeight = 400) => {
  const [scrollTop, setScrollTop] = useState(0)
  
  const visibleItems = useMemo(() => {
    const startIndex = Math.floor(scrollTop / itemHeight)
    const endIndex = Math.min(
      startIndex + Math.ceil(containerHeight / itemHeight) + 1,
      items.length
    )
    
    return {
      startIndex,
      endIndex,
      visibleItems: items.slice(startIndex, endIndex),
      totalHeight: items.length * itemHeight,
      offsetY: startIndex * itemHeight
    }
  }, [items, scrollTop, itemHeight, containerHeight])
  
  const onScroll = useCallback((e) => {
    setScrollTop(e.target.scrollTop)
  }, [])
  
  return { ...visibleItems, onScroll }
}

/**
 * Intersection Observer hook for performance
 */
export const useIntersectionObserver = (callback, options = {}) => {
  const elementRef = useRef()
  
  useEffect(() => {
    const element = elementRef.current
    if (!element) return
    
    const observer = new IntersectionObserver(callback, {
      threshold: 0.1,
      rootMargin: '0px',
      ...options
    })
    
    observer.observe(element)
    
    return () => observer.disconnect()
  }, [callback, options])
  
  return elementRef
}

/**
 * Optimized API request hook with caching
 */
export const useOptimizedApiRequest = (url, options = {}) => {
  const cacheKey = `api_${url}_${JSON.stringify(options)}`
  const abortControllerRef = useRef()
  
  const [state, setState] = useState({
    data: null,
    loading: true,
    error: null
  })
  
  useEffect(() => {
    // Check cache first
    const cached = sessionStorage.getItem(cacheKey)
    if (cached && !options.skipCache) {
      const { data, timestamp } = JSON.parse(cached)
      if (Date.now() - timestamp < (options.cacheTime || 30000)) {
        setState({ data, loading: false, error: null })
        return
      }
    }
    
    // Abort previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }
    
    // Create new abort controller
    abortControllerRef.current = new AbortController()
    
    const fetchData = async () => {
      try {
        setState(prev => ({ ...prev, loading: true, error: null }))
        
        const response = await fetch(url, {
          ...options,
          signal: abortControllerRef.current.signal
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const data = await response.json()
        
        // Cache the result
        sessionStorage.setItem(cacheKey, JSON.stringify({
          data,
          timestamp: Date.now()
        }))
        
        setState({ data, loading: false, error: null })
      } catch (error) {
        if (error.name !== 'AbortError') {
          setState({ data: null, loading: false, error })
        }
      }
    }
    
    fetchData()
    
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
    }
  }, [url, cacheKey])
  
  return state
}

/**
 * Performance monitoring utilities
 */
export const performanceMonitor = {
  // Mark performance points
  mark: (name) => {
    if (performance && performance.mark) {
      performance.mark(name)
    }
  },
  
  // Measure performance between marks
  measure: (name, startMark, endMark) => {
    if (performance && performance.measure) {
      performance.measure(name, startMark, endMark)
      const measure = performance.getEntriesByName(name)[0]
      return measure ? measure.duration : 0
    }
    return 0
  },
  
  // Monitor component render time
  measureRender: (componentName, renderFunction) => {
    const startMark = `${componentName}_render_start`
    const endMark = `${componentName}_render_end`
    
    performanceMonitor.mark(startMark)
    const result = renderFunction()
    performanceMonitor.mark(endMark)
    
    const duration = performanceMonitor.measure(
      `${componentName}_render_duration`,
      startMark,
      endMark
    )
    
    // Log slow renders in development
    if (typeof process !== 'undefined' && process.env.NODE_ENV === 'development' && duration > 16) {
      console.warn(`Slow render detected: ${componentName} took ${duration.toFixed(2)}ms`)
    }
    
    return result
  },
  
  // Get Core Web Vitals
  getCoreWebVitals: () => {
    if (!performance) return null
    
    const entries = performance.getEntriesByType('navigation')
    if (entries.length === 0) return null
    
    const navigation = entries[0]
    
    return {
      // First Contentful Paint
      fcp: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0,
      
      // Largest Contentful Paint (approximate)
      lcp: navigation.loadEventEnd - navigation.navigationStart,
      
      // Time to Interactive (approximate)
      tti: navigation.domInteractive - navigation.navigationStart,
      
      // Total Blocking Time (approximation)
      tbt: Math.max(0, navigation.domInteractive - navigation.domContentLoadedEventStart - 50)
    }
  }
}

/**
 * Memory leak prevention utilities
 */
export const memoryLeakPrevention = {
  // Clean up intervals and timeouts
  createSafeInterval: (callback, delay) => {
    const id = setInterval(callback, delay)
    
    // Return cleanup function
    return () => clearInterval(id)
  },
  
  createSafeTimeout: (callback, delay) => {
    const id = setTimeout(callback, delay)
    
    // Return cleanup function
    return () => clearTimeout(id)
  },
  
  // Safe event listener management
  addSafeEventListener: (element, event, handler, options) => {
    element.addEventListener(event, handler, options)
    
    // Return cleanup function
    return () => element.removeEventListener(event, handler, options)
  },
  
  // Monitor memory usage (development only)
  monitorMemory: () => {
    if ((typeof process !== 'undefined' && process.env.NODE_ENV !== 'development') || !performance.memory) {
      return null
    }
    
    return {
      usedJSHeapSize: performance.memory.usedJSHeapSize,
      totalJSHeapSize: performance.memory.totalJSHeapSize,
      jsHeapSizeLimit: performance.memory.jsHeapSizeLimit,
      usagePercentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit * 100).toFixed(2)
    }
  }
}

/**
 * Bundle optimization utilities
 */
export const bundleOptimization = {
  // Preload critical resources
  preloadResource: (href, as = 'script') => {
    if (typeof document === 'undefined') return
    
    const link = document.createElement('link')
    link.rel = 'preload'
    link.href = href
    link.as = as
    document.head.appendChild(link)
  },
  
  // Dynamic import with error handling
  dynamicImport: async (importFunction) => {
    try {
      return await importFunction()
    } catch (error) {
      console.error('Dynamic import failed:', error)
      throw error
    }
  },
  
  // Create lazy loading utility (returns configuration for React.lazy)
  createLazyConfig: (importFunction) => {
    return {
      component: importFunction,
      fallback: null // This should be set by the consuming component
    }
  }
}

/**
 * Financial calculation optimizations
 */
export const financialCalculationOptimizations = {
  // Optimized Money operations cache
  moneyOperationsCache: new Map(),
  
  // Fast decimal arithmetic for financial calculations
  fastDecimalAdd: (a, b, precision = 2) => {
    const factor = Math.pow(10, precision)
    return Math.round((a * factor) + (b * factor)) / factor
  },
  
  fastDecimalSubtract: (a, b, precision = 2) => {
    const factor = Math.pow(10, precision)
    return Math.round((a * factor) - (b * factor)) / factor
  },
  
  fastDecimalMultiply: (a, b, precision = 2) => {
    const factor = Math.pow(10, precision)
    return Math.round(a * b * factor) / factor
  },
  
  // Batch calculation processor
  batchCalculations: (calculations) => {
    return calculations.map(calc => {
      const cacheKey = `${calc.operation}_${calc.a}_${calc.b}_${calc.precision || 2}`
      
      if (financialCalculationOptimizations.moneyOperationsCache.has(cacheKey)) {
        return financialCalculationOptimizations.moneyOperationsCache.get(cacheKey)
      }
      
      let result
      switch (calc.operation) {
        case 'add':
          result = financialCalculationOptimizations.fastDecimalAdd(calc.a, calc.b, calc.precision)
          break
        case 'subtract':
          result = financialCalculationOptimizations.fastDecimalSubtract(calc.a, calc.b, calc.precision)
          break
        case 'multiply':
          result = financialCalculationOptimizations.fastDecimalMultiply(calc.a, calc.b, calc.precision)
          break
        default:
          result = 0
      }
      
      financialCalculationOptimizations.moneyOperationsCache.set(cacheKey, result)
      return result
    })
  }
}

export default {
  moneyPool,
  memoizedCalculation,
  useDebounce,
  useOptimizedFeatureFlags,
  useVirtualScrolling,
  useIntersectionObserver,
  useOptimizedApiRequest,
  performanceMonitor,
  memoryLeakPrevention,
  bundleOptimization,
  financialCalculationOptimizations
}