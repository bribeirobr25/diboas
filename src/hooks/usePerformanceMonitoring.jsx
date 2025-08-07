/**
 * Performance Monitoring React Hook
 * Provides React integration for performance monitoring service
 */

import React, { useEffect, useRef, useCallback, useState } from 'react'
import performanceMonitoringService from '../services/monitoring/PerformanceMonitoringService.js'
import logger from '../utils/logger'

/**
 * Hook for monitoring component performance
 */
export function usePerformanceMonitoring(componentName, options = {}) {
  const {
    trackRenders = true,
    trackInteractions = true,
    trackAsyncOperations = true,
    alertOnSlowRender = true,
    renderThreshold = 16, // 16ms for 60fps
    autoStart = true
  } = options

  const renderCount = useRef(0)
  const mountTime = useRef(null)
  const timers = useRef(new Map())

  useEffect(() => {
    if (autoStart) {
      performanceMonitoringService.startMonitoring()
    }

    return () => {
      // Clean up component-specific timers
      for (const [name] of timers.current) {
        performanceMonitoringService.endTimer(name)
      }
      timers.current.clear()
    }
  }, [autoStart])

  // Track component mount/unmount
  useEffect(() => {
    mountTime.current = performance.now()
    
    performanceMonitoringService.recordMetric(
      'component_mount',
      1,
      'user_interaction',
      { component: componentName }
    )

    return () => {
      if (mountTime.current) {
        const lifetime = performance.now() - mountTime.current
        performanceMonitoringService.recordMetric(
          'component_lifetime',
          lifetime,
          'response_time',
          { component: componentName }
        )
      }
    }
  }, [componentName])

  // Track renders
  useEffect(() => {
    if (trackRenders) {
      renderCount.current++
      
      const renderStart = performance.now()
      
      // Use setTimeout to measure actual render time
      setTimeout(() => {
        const renderTime = performance.now() - renderStart
        
        performanceMonitoringService.recordMetric(
          'component_render',
          renderTime,
          'response_time',
          { 
            component: componentName,
            renderCount: renderCount.current
          }
        )

        // Alert on slow renders
        if (alertOnSlowRender && renderTime > renderThreshold) {
          logger.warn(`Slow render detected in ${componentName}: ${renderTime.toFixed(2)}ms`)
        }
      }, 0)
    }
  })

  // Start timer for async operations
  const startTimer = useCallback((operationName, metadata = {}) => {
    const timerName = `${componentName}_${operationName}`
    const timer = performanceMonitoringService.startTimer(timerName, {
      component: componentName,
      operation: operationName,
      ...metadata
    })
    
    timers.current.set(operationName, timer)
    return timer
  }, [componentName])

  // End timer for async operations
  const endTimer = useCallback((operationName, metadata = {}) => {
    const timerName = `${componentName}_${operationName}`
    const metric = performanceMonitoringService.endTimer(timerName, metadata)
    
    timers.current.delete(operationName)
    return metric
  }, [componentName])

  // Track user interactions
  const trackInteraction = useCallback((action, metadata = {}) => {
    if (trackInteractions) {
      performanceMonitoringService.recordUserInteraction(
        action,
        componentName,
        null,
        metadata
      )
    }
  }, [componentName, trackInteractions])

  // Track async operations with automatic timing
  const trackAsyncOperation = useCallback(async (operationName, operation, metadata = {}) => {
    if (!trackAsyncOperations) {
      return await operation()
    }

    const timer = startTimer(operationName, metadata)
    
    try {
      const result = await operation()
      endTimer(operationName, { success: true, ...metadata })
      return result
    } catch (error) {
      endTimer(operationName, { success: false, error: error.message, ...metadata })
      throw error
    }
  }, [startTimer, endTimer, trackAsyncOperations])

  return {
    startTimer,
    endTimer,
    trackInteraction,
    trackAsyncOperation,
    renderCount: renderCount.current
  }
}

/**
 * Hook for monitoring API calls
 */
export function useAPIMonitoring() {
  const trackAPICall = useCallback(async (url, options = {}) => {
    const startTime = performance.now()
    const method = options.method || 'GET'
    
    try {
      const response = await fetch(url, options)
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Get response size if available
      const contentLength = response.headers.get('content-length')
      const size = contentLength ? parseInt(contentLength, 10) : null
      
      performanceMonitoringService.recordAPICall(
        url,
        method,
        response.status,
        duration,
        size
      )
      
      return response
    } catch (error) {
      const endTime = performance.now()
      const duration = endTime - startTime
      
      performanceMonitoringService.recordAPICall(
        url,
        method,
        0, // Network error
        duration
      )
      
      throw error
    }
  }, [])

  return { trackAPICall }
}

/**
 * Hook for performance metrics dashboard
 */
export function usePerformanceMetrics(refreshInterval = 5000) {
  const [metrics, setMetrics] = useState(null)
  const [alerts, setAlerts] = useState([])
  const [isLoading, setIsLoading] = useState(true)

  const refreshMetrics = useCallback(() => {
    try {
      const summary = performanceMonitoringService.getMetricsSummary()
      const recentAlerts = performanceMonitoringService.getRecentAlerts(20)
      
      setMetrics(summary)
      setAlerts(recentAlerts)
      setIsLoading(false)
    } catch (error) {
      logger.error('Failed to refresh performance metrics:', error)
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Initial load
    refreshMetrics()

    // Set up refresh interval
    const interval = setInterval(refreshMetrics, refreshInterval)

    return () => clearInterval(interval)
  }, [refreshMetrics, refreshInterval])

  const generateReport = useCallback((timeWindow) => {
    return performanceMonitoringService.generatePerformanceReport(timeWindow)
  }, [])

  return {
    metrics,
    alerts,
    isLoading,
    refreshMetrics,
    generateReport
  }
}

/**
 * Hook for monitoring route changes
 */
export function useRoutePerformance() {
  const [routeMetrics, setRouteMetrics] = useState(new Map())

  const trackRouteChange = useCallback((from, to) => {
    const startTime = performance.now()
    
    // Track route navigation
    performanceMonitoringService.recordMetric(
      'route_navigation',
      1,
      'user_interaction',
      { from, to }
    )

    return () => {
      // Called when route change is complete
      const endTime = performance.now()
      const duration = endTime - startTime
      
      performanceMonitoringService.recordMetric(
        'route_transition',
        duration,
        'response_time',
        { from, to }
      )

      // Update route metrics
      setRouteMetrics(prev => {
        const newMetrics = new Map(prev)
        const key = `${from} -> ${to}`
        const existing = newMetrics.get(key) || []
        existing.push({ duration, timestamp: Date.now() })
        
        // Keep only last 10 transitions per route
        if (existing.length > 10) {
          existing.shift()
        }
        
        newMetrics.set(key, existing)
        return newMetrics
      })
    }
  }, [])

  return {
    routeMetrics,
    trackRouteChange
  }
}

/**
 * Hook for monitoring memory usage
 */
export function useMemoryMonitoring(alertThreshold = 100) {
  const [memoryUsage, setMemoryUsage] = useState(null)
  const [memoryAlerts, setMemoryAlerts] = useState([])

  useEffect(() => {
    const checkMemory = () => {
      if (performance.memory) {
        const usage = {
          used: Math.round(performance.memory.usedJSHeapSize / 1024 / 1024),
          total: Math.round(performance.memory.totalJSHeapSize / 1024 / 1024),
          limit: Math.round(performance.memory.jsHeapSizeLimit / 1024 / 1024)
        }

        setMemoryUsage(usage)

        // Check for memory alerts
        if (usage.used > alertThreshold) {
          setMemoryAlerts(prev => [...prev, {
            timestamp: Date.now(),
            usage: usage.used,
            threshold: alertThreshold
          }].slice(-5)) // Keep last 5 alerts
        }
      }
    }

    // Check immediately
    checkMemory()

    // Check every 10 seconds
    const interval = setInterval(checkMemory, 10000)

    return () => clearInterval(interval)
  }, [alertThreshold])

  return {
    memoryUsage,
    memoryAlerts
  }
}

/**
 * Higher-order component for performance monitoring
 */
export function withPerformanceMonitoring(WrappedComponent, options = {}) {
  const displayName = WrappedComponent.displayName || WrappedComponent.name || 'Component'
  
  function PerformanceMonitoredComponent(props) {
    const { trackInteraction, trackAsyncOperation } = usePerformanceMonitoring(
      displayName,
      options
    )

    // Inject performance tracking methods into props
    const enhancedProps = {
      ...props,
      trackInteraction,
      trackAsyncOperation
    }

    return <WrappedComponent {...enhancedProps} />
  }

  PerformanceMonitoredComponent.displayName = `withPerformanceMonitoring(${displayName})`
  
  return PerformanceMonitoredComponent
}