/**
 * Performance Monitoring Service
 * Real-time application performance monitoring, metrics collection, and alerting
 */

import logger from '../../utils/logger.js'
import secureLogger from '../../utils/secureLogger.js'

export const METRIC_TYPES = {
  RESPONSE_TIME: 'response_time',
  MEMORY_USAGE: 'memory_usage',
  CPU_USAGE: 'cpu_usage',
  DATABASE_QUERY: 'database_query',
  API_CALL: 'api_call',
  USER_INTERACTION: 'user_interaction',
  ERROR_RATE: 'error_rate',
  THROUGHPUT: 'throughput',
  CUSTOM: 'custom'
}

export const ALERT_LEVELS = {
  CRITICAL: 'critical',
  WARNING: 'warning',
  INFO: 'info'
}

class PerformanceMonitoringService {
  constructor() {
    this.metrics = new Map()
    this.alerts = new Map()
    this.thresholds = new Map()
    this.observers = new Map()
    this.isMonitoring = false
    
    // Performance tracking
    this.performanceEntries = []
    this.customTimers = new Map()
    this.resourceTimings = []
    
    // Real-time monitoring
    this.monitoringInterval = null
    this.alertQueue = []
    
    this.initializeThresholds()
    this.initializePerformanceObservers()
    
    logger.info('Performance monitoring service initialized')
  }

  /**
   * Initialize performance thresholds
   */
  initializeThresholds() {
    // Response time thresholds (milliseconds)
    this.thresholds.set('api_response_time', {
      warning: 1000,
      critical: 3000
    })

    this.thresholds.set('page_load_time', {
      warning: 2000,
      critical: 5000
    })

    this.thresholds.set('database_query_time', {
      warning: 500,
      critical: 2000
    })

    // Memory usage thresholds (MB) - relaxed for development
    this.thresholds.set('memory_usage', {
      warning: 500,
      critical: 1000
    })

    // Error rate thresholds (percentage)
    this.thresholds.set('error_rate', {
      warning: 5,
      critical: 10
    })

    // Throughput thresholds (requests per second)
    this.thresholds.set('throughput', {
      warning: 0.5, // Below 0.5 RPS
      critical: 0.1  // Below 0.1 RPS
    })
  }

  /**
   * Initialize performance observers
   */
  initializePerformanceObservers() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      // Navigation timing
      try {
        const navObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordNavigationTiming(entry)
          }
        })
        navObserver.observe({ entryTypes: ['navigation'] })
        this.observers.set('navigation', navObserver)
      } catch (error) {
        logger.warn('Navigation timing observer not supported:', error)
      }

      // Resource timing
      try {
        const resourceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordResourceTiming(entry)
          }
        })
        resourceObserver.observe({ entryTypes: ['resource'] })
        this.observers.set('resource', resourceObserver)
      } catch (error) {
        logger.warn('Resource timing observer not supported:', error)
      }

      // User timing (custom marks and measures)
      try {
        const userObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordUserTiming(entry)
          }
        })
        userObserver.observe({ entryTypes: ['mark', 'measure'] })
        this.observers.set('user', userObserver)
      } catch (error) {
        logger.warn('User timing observer not supported:', error)
      }

      // Long task detection
      try {
        const longTaskObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            this.recordLongTask(entry)
          }
        })
        longTaskObserver.observe({ entryTypes: ['longtask'] })
        this.observers.set('longtask', longTaskObserver)
      } catch (error) {
        logger.warn('Long task observer not supported:', error)
      }
    }
  }

  /**
   * Start performance monitoring
   */
  startMonitoring() {
    if (this.isMonitoring) {
      logger.warn('Performance monitoring already started')
      return
    }

    this.isMonitoring = true
    
    // Start real-time monitoring
    this.monitoringInterval = setInterval(() => {
      this.collectSystemMetrics()
      this.processAlerts()
    }, 5000) // Every 5 seconds

    // Monitor memory leaks
    this.startMemoryLeakDetection()

    logger.info('Performance monitoring started')
  }

  /**
   * Stop performance monitoring
   */
  stopMonitoring() {
    if (!this.isMonitoring) {
      return
    }

    this.isMonitoring = false

    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    // Dispose observers
    for (const [name, observer] of this.observers) {
      try {
        observer.disconnect()
      } catch (error) {
        logger.warn(`Failed to disconnect ${name} observer:`, error)
      }
    }
    this.observers.clear()

    logger.info('Performance monitoring stopped')
  }

  /**
   * Record custom metric
   */
  recordMetric(name, value, type = METRIC_TYPES.CUSTOM, tags = {}) {
    const timestamp = Date.now()
    const metric = {
      name,
      value,
      type,
      tags,
      timestamp
    }

    // Store metric
    if (!this.metrics.has(name)) {
      this.metrics.set(name, [])
    }
    
    const metricHistory = this.metrics.get(name)
    metricHistory.push(metric)

    // Keep only last 1000 entries per metric
    if (metricHistory.length > 1000) {
      metricHistory.shift()
    }

    // Check thresholds
    this.checkThresholds(name, value, type)

    // Log significant metrics
    if (type !== METRIC_TYPES.CUSTOM || value > 1000) {
      logger.debug(`Metric recorded: ${name}=${value}`, { type, tags })
    }

    return metric
  }

  /**
   * Start timing operation
   */
  startTimer(name, tags = {}) {
    const timer = {
      name,
      startTime: performance.now(),
      tags,
      timestamp: Date.now()
    }

    this.customTimers.set(name, timer)
    
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(`${name}-start`)
    }

    return timer
  }

  /**
   * End timing operation
   */
  endTimer(name, additionalTags = {}) {
    const timer = this.customTimers.get(name)
    if (!timer) {
      logger.warn(`Timer '${name}' not found`)
      return null
    }

    const endTime = performance.now()
    const duration = endTime - timer.startTime

    this.customTimers.delete(name)

    // Create performance measure
    if (typeof window !== 'undefined' && 'performance' in window) {
      try {
        performance.mark(`${name}-end`)
        performance.measure(name, `${name}-start`, `${name}-end`)
      } catch (error) {
        logger.debug('Failed to create performance measure:', error)
      }
    }

    // Record as metric
    const tags = { ...timer.tags, ...additionalTags }
    return this.recordMetric(name, duration, METRIC_TYPES.RESPONSE_TIME, tags)
  }

  /**
   * Record API call performance
   */
  recordAPICall(endpoint, method, statusCode, duration, size = null) {
    const tags = {
      endpoint,
      method,
      statusCode: statusCode.toString(),
      success: statusCode >= 200 && statusCode < 300
    }

    if (size !== null) {
      tags.responseSize = size
    }

    this.recordMetric('api_call_duration', duration, METRIC_TYPES.API_CALL, tags)

    // Track error rates
    if (!tags.success) {
      this.recordMetric('api_error', 1, METRIC_TYPES.ERROR_RATE, tags)
    }

    // Alert on slow API calls
    const threshold = this.thresholds.get('api_response_time')
    if (threshold && duration > threshold.critical) {
      this.createAlert(
        ALERT_LEVELS.CRITICAL,
        `Slow API call: ${method} ${endpoint}`,
        `Response time: ${duration}ms (threshold: ${threshold.critical}ms)`,
        { endpoint, method, duration, statusCode }
      )
    }
  }

  /**
   * Record database query performance
   */
  recordDatabaseQuery(query, duration, resultCount = null) {
    const tags = {
      queryType: this.extractQueryType(query),
      resultCount: resultCount || 0
    }

    this.recordMetric('db_query_duration', duration, METRIC_TYPES.DATABASE_QUERY, tags)

    // Alert on slow queries
    const threshold = this.thresholds.get('database_query_time')
    if (threshold && duration > threshold.warning) {
      const level = duration > threshold.critical ? ALERT_LEVELS.CRITICAL : ALERT_LEVELS.WARNING
      this.createAlert(
        level,
        'Slow database query detected',
        `Query duration: ${duration}ms`,
        { query: query.substring(0, 100), duration, resultCount }
      )
    }
  }

  /**
   * Record user interaction
   */
  recordUserInteraction(action, component, duration = null, metadata = {}) {
    const tags = {
      action,
      component,
      ...metadata
    }

    this.recordMetric('user_interaction', duration || 1, METRIC_TYPES.USER_INTERACTION, tags)
  }

  /**
   * Record navigation timing
   */
  recordNavigationTiming(entry) {
    const metrics = {
      dns_lookup: entry.domainLookupEnd - entry.domainLookupStart,
      tcp_connection: entry.connectEnd - entry.connectStart,
      tls_negotiation: entry.secureConnectionStart > 0 ? entry.connectEnd - entry.secureConnectionStart : 0,
      request_response: entry.responseEnd - entry.requestStart,
      dom_processing: entry.domContentLoadedEventStart - entry.responseEnd,
      resource_loading: entry.loadEventStart - entry.domContentLoadedEventStart,
      total_page_load: entry.loadEventEnd - entry.navigationStart
    }

    for (const [name, value] of Object.entries(metrics)) {
      if (value > 0) {
        this.recordMetric(`navigation_${name}`, value, METRIC_TYPES.RESPONSE_TIME, {
          url: entry.name
        })
      }
    }

    // Check page load performance
    const threshold = this.thresholds.get('page_load_time')
    if (threshold && metrics.total_page_load > threshold.warning) {
      const level = metrics.total_page_load > threshold.critical ? ALERT_LEVELS.CRITICAL : ALERT_LEVELS.WARNING
      this.createAlert(
        level,
        'Slow page load detected',
        `Page load time: ${metrics.total_page_load}ms`,
        { url: entry.name, metrics }
      )
    }
  }

  /**
   * Record resource timing
   */
  recordResourceTiming(entry) {
    const duration = entry.responseEnd - entry.startTime
    const size = entry.transferSize || 0

    this.recordMetric('resource_load_time', duration, METRIC_TYPES.RESPONSE_TIME, {
      url: entry.name,
      type: this.getResourceType(entry.name),
      size: size,
      cached: entry.transferSize === 0 && entry.decodedBodySize > 0
    })

    // Track large resources
    if (size > 1024 * 1024) { // > 1MB
      this.createAlert(
        ALERT_LEVELS.WARNING,
        'Large resource detected',
        `Resource size: ${(size / 1024 / 1024).toFixed(2)}MB`,
        { url: entry.name, size }
      )
    }
  }

  /**
   * Record user timing (marks and measures)
   */
  recordUserTiming(entry) {
    if (entry.entryType === 'measure') {
      this.recordMetric(entry.name, entry.duration, METRIC_TYPES.RESPONSE_TIME, {
        type: 'custom_measure'
      })
    }
  }

  /**
   * Record long task
   */
  recordLongTask(entry) {
    this.recordMetric('long_task', entry.duration, METRIC_TYPES.RESPONSE_TIME, {
      attribution: entry.attribution ? entry.attribution[0]?.name : 'unknown'
    })

    this.createAlert(
      ALERT_LEVELS.WARNING,
      'Long task detected',
      `Task duration: ${entry.duration}ms`,
      { duration: entry.duration, attribution: entry.attribution }
    )
  }

  /**
   * Collect system metrics
   */
  collectSystemMetrics() {
    // Memory usage
    if (typeof window !== 'undefined' && 'performance' in window && window.performance.memory) {
      const memory = window.performance.memory
      this.recordMetric('memory_used', memory.usedJSHeapSize / 1024 / 1024, METRIC_TYPES.MEMORY_USAGE)
      this.recordMetric('memory_total', memory.totalJSHeapSize / 1024 / 1024, METRIC_TYPES.MEMORY_USAGE)
    }

    // Connection information
    if (typeof navigator !== 'undefined' && navigator.connection) {
      const connection = navigator.connection
      this.recordMetric('network_type', connection.effectiveType, METRIC_TYPES.CUSTOM, {
        downlink: connection.downlink,
        rtt: connection.rtt
      })
    }

    // Error rate calculation
    this.calculateErrorRate()

    // Throughput calculation
    this.calculateThroughput()
  }

  /**
   * Calculate error rate
   */
  calculateErrorRate() {
    const timeWindow = 5 * 60 * 1000 // 5 minutes
    const now = Date.now()

    const apiCalls = this.metrics.get('api_call_duration') || []
    const recentCalls = apiCalls.filter(metric => now - metric.timestamp < timeWindow)
    
    if (recentCalls.length === 0) return

    const errorCalls = recentCalls.filter(metric => !metric.tags.success)
    const errorRate = (errorCalls.length / recentCalls.length) * 100

    this.recordMetric('error_rate', errorRate, METRIC_TYPES.ERROR_RATE)

    // Check error rate threshold
    const threshold = this.thresholds.get('error_rate')
    if (threshold && errorRate > threshold.warning) {
      const level = errorRate > threshold.critical ? ALERT_LEVELS.CRITICAL : ALERT_LEVELS.WARNING
      this.createAlert(
        level,
        'High error rate detected',
        `Error rate: ${errorRate.toFixed(2)}% over last 5 minutes`,
        { errorRate, totalCalls: recentCalls.length, errorCalls: errorCalls.length }
      )
    }
  }

  /**
   * Calculate throughput
   */
  calculateThroughput() {
    const timeWindow = 60 * 1000 // 1 minute
    const now = Date.now()

    const apiCalls = this.metrics.get('api_call_duration') || []
    const recentCalls = apiCalls.filter(metric => now - metric.timestamp < timeWindow)
    
    const throughput = recentCalls.length / 60 // Requests per second

    this.recordMetric('throughput', throughput, METRIC_TYPES.THROUGHPUT)

    // Check throughput threshold
    const threshold = this.thresholds.get('throughput')
    if (threshold && throughput < threshold.warning && recentCalls.length > 0) {
      const level = throughput < threshold.critical ? ALERT_LEVELS.CRITICAL : ALERT_LEVELS.WARNING
      this.createAlert(
        level,
        'Low throughput detected',
        `Throughput: ${throughput.toFixed(2)} RPS`,
        { throughput, requestCount: recentCalls.length }
      )
    }
  }

  /**
   * Start memory leak detection
   */
  startMemoryLeakDetection() {
    let lastMemoryUsage = 0
    let increasingCount = 0

    setInterval(() => {
      if (typeof window !== 'undefined' && window.performance && window.performance.memory) {
        const currentUsage = window.performance.memory.usedJSHeapSize
        
        if (currentUsage > lastMemoryUsage * 1.1) { // 10% increase
          increasingCount++
        } else {
          increasingCount = 0
        }

        // Alert if memory consistently increasing
        if (increasingCount >= 6) { // 6 consecutive increases (30 seconds)
          this.createAlert(
            ALERT_LEVELS.WARNING,
            'Potential memory leak detected',
            `Memory usage continuously increasing: ${(currentUsage / 1024 / 1024).toFixed(2)}MB`,
            { currentUsage, previousUsage: lastMemoryUsage }
          )
          increasingCount = 0 // Reset to avoid spam
        }

        lastMemoryUsage = currentUsage
      }
    }, 5000) // Check every 5 seconds
  }

  /**
   * Check thresholds and create alerts
   */
  checkThresholds(metricName, value, type) {
    const threshold = this.thresholds.get(metricName) || this.thresholds.get(type)
    if (!threshold) return

    let level = null
    if (value > threshold.critical) {
      level = ALERT_LEVELS.CRITICAL
    } else if (value > threshold.warning) {
      level = ALERT_LEVELS.WARNING
    }

    if (level) {
      this.createAlert(
        level,
        `${metricName} threshold exceeded`,
        `Value: ${value}, Threshold: ${threshold[level]}`,
        { metricName, value, threshold: threshold[level], type }
      )
    }
  }

  /**
   * Create performance alert
   */
  createAlert(level, title, message, metadata = {}) {
    const alert = {
      id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      level,
      title,
      message,
      metadata,
      timestamp: Date.now(),
      acknowledged: false
    }

    this.alerts.set(alert.id, alert)
    this.alertQueue.push(alert)

    // Log alert
    const logLevel = level === ALERT_LEVELS.CRITICAL ? 'error' : 
                     level === ALERT_LEVELS.WARNING ? 'warn' : 'info'
    logger[logLevel](`Performance Alert [${level}]: ${title}`, { message, metadata })

    // Secure logging for critical alerts
    if (level === ALERT_LEVELS.CRITICAL) {
      secureLogger.audit('PERFORMANCE_CRITICAL_ALERT', {
        title,
        message,
        metadata
      })
    }

    return alert
  }

  /**
   * Process alert queue
   */
  processAlerts() {
    if (this.alertQueue.length === 0) return

    // Group similar alerts to prevent spam
    const groupedAlerts = this.groupSimilarAlerts(this.alertQueue)
    
    for (const [key, alerts] of groupedAlerts) {
      if (alerts.length > 1) {
        logger.warn(`${alerts.length} similar alerts grouped:`, {
          title: alerts[0].title,
          count: alerts.length,
          timeSpan: alerts[alerts.length - 1].timestamp - alerts[0].timestamp
        })
      }
    }

    // Clear processed alerts
    this.alertQueue = []
  }

  /**
   * Get performance metrics summary
   */
  getMetricsSummary(timeWindow = 15 * 60 * 1000) { // 15 minutes default
    const now = Date.now()
    const summary = {}

    for (const [metricName, metricHistory] of this.metrics) {
      const recentMetrics = metricHistory.filter(m => now - m.timestamp < timeWindow)
      
      if (recentMetrics.length === 0) continue

      const values = recentMetrics.map(m => m.value)
      summary[metricName] = {
        count: recentMetrics.length,
        min: Math.min(...values),
        max: Math.max(...values),
        avg: values.reduce((sum, val) => sum + val, 0) / values.length,
        latest: values[values.length - 1],
        timestamp: recentMetrics[recentMetrics.length - 1].timestamp
      }
    }

    return summary
  }

  /**
   * Get recent alerts
   */
  getRecentAlerts(limit = 50) {
    return Array.from(this.alerts.values())
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, limit)
  }

  /**
   * Generate performance report
   */
  generatePerformanceReport(timeWindow = 60 * 60 * 1000) { // 1 hour default
    const summary = this.getMetricsSummary(timeWindow)
    const alerts = this.getRecentAlerts(10)
    const criticalAlerts = alerts.filter(a => a.level === ALERT_LEVELS.CRITICAL)

    return {
      reportGeneratedAt: new Date().toISOString(),
      timeWindow: timeWindow,
      summary,
      alerts: {
        total: alerts.length,
        critical: criticalAlerts.length,
        recent: alerts.slice(0, 5)
      },
      recommendations: this.generateRecommendations(summary, alerts),
      healthScore: this.calculateHealthScore(summary, alerts)
    }
  }

  /**
   * Generate performance recommendations
   */
  generateRecommendations(summary, alerts) {
    const recommendations = []

    // API performance recommendations
    if (summary.api_call_duration && summary.api_call_duration.avg > 1000) {
      recommendations.push({
        category: 'API Performance',
        severity: 'medium',
        title: 'Optimize API Response Times',
        description: `Average API response time is ${summary.api_call_duration.avg.toFixed(0)}ms. Consider caching, database optimization, or CDN usage.`
      })
    }

    // Memory recommendations
    if (summary.memory_used && summary.memory_used.max > 150) {
      recommendations.push({
        category: 'Memory Usage',
        severity: 'medium',
        title: 'High Memory Usage Detected',
        description: `Peak memory usage: ${summary.memory_used.max.toFixed(1)}MB. Review for memory leaks and optimize data structures.`
      })
    }

    // Error rate recommendations
    if (summary.error_rate && summary.error_rate.latest > 2) {
      recommendations.push({
        category: 'Error Handling',
        severity: 'high',
        title: 'Elevated Error Rate',
        description: `Current error rate: ${summary.error_rate.latest.toFixed(1)}%. Investigate recent errors and improve error handling.`
      })
    }

    // Long task recommendations
    const longTasks = alerts.filter(a => a.title.includes('Long task'))
    if (longTasks.length > 2) {
      recommendations.push({
        category: 'User Experience',
        severity: 'medium',
        title: 'Reduce Long Tasks',
        description: `${longTasks.length} long tasks detected. Consider code splitting and async processing to improve responsiveness.`
      })
    }

    return recommendations
  }

  /**
   * Calculate overall health score
   */
  calculateHealthScore(summary, alerts) {
    let score = 100

    // Deduct for high error rates
    if (summary.error_rate && summary.error_rate.latest > 1) {
      score -= Math.min(summary.error_rate.latest * 5, 30)
    }

    // Deduct for slow response times
    if (summary.api_call_duration && summary.api_call_duration.avg > 500) {
      score -= Math.min((summary.api_call_duration.avg - 500) / 100, 20)
    }

    // Deduct for critical alerts
    const criticalAlerts = alerts.filter(a => a.level === ALERT_LEVELS.CRITICAL)
    score -= criticalAlerts.length * 10

    // Deduct for warning alerts
    const warningAlerts = alerts.filter(a => a.level === ALERT_LEVELS.WARNING)
    score -= warningAlerts.length * 3

    return Math.max(Math.round(score), 0)
  }

  /**
   * Helper methods
   */
  extractQueryType(query) {
    const queryUpper = query.toUpperCase().trim()
    if (queryUpper.startsWith('SELECT')) return 'SELECT'
    if (queryUpper.startsWith('INSERT')) return 'INSERT'
    if (queryUpper.startsWith('UPDATE')) return 'UPDATE'
    if (queryUpper.startsWith('DELETE')) return 'DELETE'
    return 'OTHER'
  }

  getResourceType(url) {
    if (url.match(/\.(js|jsx|ts|tsx)$/)) return 'script'
    if (url.match(/\.(css|scss|sass)$/)) return 'stylesheet'
    if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image'
    if (url.match(/\.(woff|woff2|ttf|otf)$/)) return 'font'
    if (url.includes('api/') || url.includes('/api')) return 'api'
    return 'other'
  }

  groupSimilarAlerts(alerts) {
    const groups = new Map()
    
    for (const alert of alerts) {
      const key = `${alert.level}-${alert.title}`
      if (!groups.has(key)) {
        groups.set(key, [])
      }
      groups.get(key).push(alert)
    }
    
    return groups
  }

  /**
   * Cleanup old data
   */
  cleanup() {
    const maxAge = 24 * 60 * 60 * 1000 // 24 hours
    const now = Date.now()

    // Clean old metrics
    for (const [name, metrics] of this.metrics) {
      const filtered = metrics.filter(m => now - m.timestamp < maxAge)
      this.metrics.set(name, filtered)
    }

    // Clean old alerts
    for (const [id, alert] of this.alerts) {
      if (now - alert.timestamp > maxAge) {
        this.alerts.delete(id)
      }
    }

    logger.debug('Performance monitoring data cleaned up')
  }

  /**
   * Dispose service
   */
  dispose() {
    this.stopMonitoring()
    this.metrics.clear()
    this.alerts.clear()
    this.customTimers.clear()
    logger.info('Performance monitoring service disposed')
  }
}

// Create singleton instance
export const performanceMonitoringService = new PerformanceMonitoringService()
export default performanceMonitoringService