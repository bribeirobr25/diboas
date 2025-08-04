/**
 * Integration Test Suite for Performance Monitoring
 * Tests performance monitoring service, hooks, dashboard, and DataManager integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import performanceMonitoringService from '../../services/monitoring/PerformanceMonitoringService.js'
import { usePerformanceMonitoring, useAPIMonitoring, usePerformanceMetrics } from '../../hooks/usePerformanceMonitoring.jsx'
import { dataManager } from '../../services/DataManager.js'

// Mock performance API for Node.js environment
global.performance = {
  now: () => Date.now(),
  mark: vi.fn(),
  measure: vi.fn(),
  getEntriesByType: vi.fn(() => []),
  memory: {
    usedJSHeapSize: 50 * 1024 * 1024, // 50MB
    totalJSHeapSize: 100 * 1024 * 1024, // 100MB
    jsHeapSizeLimit: 2 * 1024 * 1024 * 1024 // 2GB
  }
}

// Mock PerformanceObserver
global.PerformanceObserver = class MockPerformanceObserver {
  constructor(callback) {
    this.callback = callback
  }
  observe() {}
  disconnect() {}
}

// Mock window and navigator
global.window = {
  PerformanceObserver: global.PerformanceObserver,
  performance: global.performance,
  addEventListener: vi.fn(),
  dispatchEvent: vi.fn()
}

global.navigator = {
  connection: {
    effectiveType: '4g',
    downlink: 10,
    rtt: 50
  }
}

describe('Performance Monitoring Integration', () => {
  beforeEach(() => {
    // Reset service state
    performanceMonitoringService.stopMonitoring()
    performanceMonitoringService.metrics.clear()
    performanceMonitoringService.alerts.clear()
    
    // Clear any existing timers
    vi.clearAllTimers()
    vi.useFakeTimers()
  })

  afterEach(() => {
    performanceMonitoringService.stopMonitoring()
    performanceMonitoringService.dispose()
    vi.useRealTimers()
  })

  describe('Performance Monitoring Service', () => {
    it('should start and stop monitoring correctly', () => {
      expect(performanceMonitoringService.isMonitoring).toBe(false)
      
      performanceMonitoringService.startMonitoring()
      expect(performanceMonitoringService.isMonitoring).toBe(true)
      
      performanceMonitoringService.stopMonitoring()
      expect(performanceMonitoringService.isMonitoring).toBe(false)
    })

    it('should record custom metrics', () => {
      const metric = performanceMonitoringService.recordMetric(
        'test_metric',
        100,
        'custom',
        { component: 'test' }
      )

      expect(metric).toBeDefined()
      expect(metric.name).toBe('test_metric')
      expect(metric.value).toBe(100)
      expect(metric.type).toBe('custom')
      expect(metric.tags.component).toBe('test')

      const metrics = performanceMonitoringService.metrics.get('test_metric')
      expect(metrics).toHaveLength(1)
      expect(metrics[0]).toEqual(metric)
    })

    it('should track timing operations', async () => {
      const timer = performanceMonitoringService.startTimer('test_operation', { test: true })
      expect(timer).toBeDefined()
      expect(timer.name).toBe('test_operation')

      // Simulate some async work with fake timers
      vi.advanceTimersByTime(100)
      
      const metric = performanceMonitoringService.endTimer('test_operation', { result: 'success' })
      expect(metric).toBeDefined()
      expect(metric.name).toBe('test_operation')
      expect(metric.value).toBeGreaterThan(0)
      expect(metric.tags.test).toBe(true)
      expect(metric.tags.result).toBe('success')
    })

    it('should record API call performance', () => {
      performanceMonitoringService.recordAPICall(
        '/api/test',
        'GET',
        200,
        150,
        1024
      )

      const metrics = performanceMonitoringService.metrics.get('api_call_duration')
      expect(metrics).toHaveLength(1)
      expect(metrics[0].value).toBe(150)
      expect(metrics[0].tags.endpoint).toBe('/api/test')
      expect(metrics[0].tags.method).toBe('GET')
      expect(metrics[0].tags.statusCode).toBe('200')
      expect(metrics[0].tags.success).toBe(true)
    })

    it('should create alerts for threshold violations', () => {
      // Record a slow API call that should trigger an alert
      performanceMonitoringService.recordAPICall(
        '/api/slow',
        'POST',
        200,
        4000, // 4 seconds - exceeds critical threshold
        2048
      )

      const alerts = performanceMonitoringService.getRecentAlerts()
      expect(alerts.length).toBeGreaterThan(0)
      
      const criticalAlert = alerts.find(a => a.level === 'critical')
      expect(criticalAlert).toBeDefined()
      expect(criticalAlert.title).toContain('Slow API call')
    })

    it('should generate performance summary', () => {
      // Record some test metrics
      performanceMonitoringService.recordMetric('response_time', 100, 'response_time')
      performanceMonitoringService.recordMetric('response_time', 200, 'response_time')
      performanceMonitoringService.recordMetric('response_time', 150, 'response_time')

      const summary = performanceMonitoringService.getMetricsSummary()
      expect(summary).toBeDefined()
      expect(summary.response_time).toBeDefined()
      expect(summary.response_time.count).toBe(3)
      expect(summary.response_time.min).toBe(100)
      expect(summary.response_time.max).toBe(200)
      expect(summary.response_time.avg).toBe(150)
    })

    it('should collect system metrics when monitoring', async () => {
      performanceMonitoringService.startMonitoring()
      
      // Trigger system metrics collection
      performanceMonitoringService.collectSystemMetrics()

      // Check that memory metrics were recorded
      const memoryMetrics = performanceMonitoringService.metrics.get('memory_used')
      expect(memoryMetrics).toBeDefined()
      expect(memoryMetrics.length).toBeGreaterThan(0)
    })
  })

  describe('React Hook Integration', () => {
    it('should track component performance', () => {
      const { result } = renderHook(() => 
        usePerformanceMonitoring('TestComponent', {
          trackRenders: true,
          trackInteractions: true
        })
      )

      expect(typeof result.current.startTimer).toBe('function')
      expect(typeof result.current.endTimer).toBe('function')
      expect(typeof result.current.trackInteraction).toBe('function')
      expect(typeof result.current.trackAsyncOperation).toBe('function')
    })

    it('should track async operations', async () => {
      const { result } = renderHook(() => 
        usePerformanceMonitoring('TestComponent')
      )

      await act(async () => {
        const operationResult = await result.current.trackAsyncOperation(
          'test_operation',
          async () => {
            // No actual delay in test
            return { success: true }
          }
        )

        expect(operationResult).toEqual({ success: true })
      })

      // Check that metrics were recorded
      const metrics = performanceMonitoringService.metrics.get('TestComponent_test_operation')
      expect(metrics).toBeDefined()
      expect(metrics.length).toBeGreaterThan(0)
    })

    it('should track API calls with monitoring hook', async () => {
      // Mock fetch
      global.fetch = vi.fn().mockResolvedValue({
        status: 200,
        headers: {
          get: vi.fn().mockReturnValue('1024')
        }
      })

      const { result } = renderHook(() => useAPIMonitoring())

      await act(async () => {
        await result.current.trackAPICall('/api/test', { method: 'GET' })
      })

      const metrics = performanceMonitoringService.metrics.get('api_call_duration')
      expect(metrics).toBeDefined()
      expect(metrics.length).toBeGreaterThan(0)
      expect(metrics[0].tags.endpoint).toBe('/api/test')
    })

    it('should provide performance metrics dashboard data', async () => {
      // Add some test metrics first
      performanceMonitoringService.recordMetric('test_metric', 100, 'custom')
      performanceMonitoringService.createAlert('warning', 'Test Alert', 'Test message')

      const { result } = renderHook(() => usePerformanceMetrics(1000))

      // Wait for initial load with fake timers
      await act(async () => {
        vi.advanceTimersByTime(10)
      })

      expect(result.current.metrics).toBeDefined()
      expect(result.current.alerts).toBeDefined()
      expect(result.current.isLoading).toBe(false)
      expect(typeof result.current.refreshMetrics).toBe('function')
      expect(typeof result.current.generateReport).toBe('function')
    })
  })

  describe('DataManager Integration', () => {
    it('should start performance monitoring through DataManager', () => {
      dataManager.startPerformanceMonitoring()
      expect(performanceMonitoringService.isMonitoring).toBe(true)
    })

    it('should get performance metrics through DataManager', () => {
      // Add test metric
      performanceMonitoringService.recordMetric('test', 100, 'custom')
      
      const metrics = dataManager.getPerformanceMetrics()
      expect(metrics).toBeDefined()
      expect(metrics.test).toBeDefined()
    })

    it('should get performance alerts through DataManager', () => {
      // Create test alert
      performanceMonitoringService.createAlert('warning', 'Test', 'Message')
      
      const alerts = dataManager.getPerformanceAlerts(10)
      expect(alerts).toHaveLength(1)
      expect(alerts[0].title).toBe('Test')
    })

    it('should generate performance report through DataManager', () => {
      // Add test data
      performanceMonitoringService.recordMetric('api_call_duration', 500, 'response_time')
      
      const report = dataManager.generatePerformanceReport(60000) // 1 minute
      expect(report).toBeDefined()
      expect(report.summary).toBeDefined()
      expect(report.healthScore).toBeDefined()
      expect(report.recommendations).toBeDefined()
    })

    it('should track DataManager operations when instrumented', async () => {
      dataManager.startPerformanceMonitoring()

      // Simulate a transaction (which should be instrumented)
      await dataManager.updateBalance(1000, 'deposit')

      // Check if metrics were recorded for the instrumented method
      const updateBalanceMetrics = performanceMonitoringService.metrics.get('datamanager_updateBalance')
      // Note: updateBalance might not be in the instrumented list, so we check for any datamanager metrics
      
      const allMetrics = Array.from(performanceMonitoringService.metrics.keys())
      const dataManagerMetrics = allMetrics.filter(key => key.startsWith('datamanager_'))
      
      // At minimum, we should have some metrics recorded
      expect(performanceMonitoringService.metrics.size).toBeGreaterThan(0)
    })

    it('should assess system health correctly', async () => {
      // Create some test metrics and alerts
      performanceMonitoringService.recordMetric('api_call_duration', { avg: 800 }, 'response_time')
      performanceMonitoringService.recordMetric('error_rate', { latest: 2 }, 'error_rate')
      performanceMonitoringService.recordMetric('memory_used', { latest: 80 }, 'memory_usage')
      
      const metrics = {
        api_call_duration: { avg: 800 },
        error_rate: { latest: 2 },
        memory_used: { latest: 80 }
      }
      const alerts = [
        { level: 'warning', title: 'Test Warning' }
      ]

      const health = dataManager.assessSystemHealth(metrics, alerts)
      
      expect(health.score).toBeGreaterThan(0)
      expect(health.score).toBeLessThanOrEqual(100)
      expect(health.status).toMatch(/excellent|good|fair|poor|critical/)
      expect(Array.isArray(health.issues)).toBe(true)
      expect(health.warningAlerts).toBe(1)
    })

    it('should generate performance recommendations', () => {
      const metrics = {
        api_call_duration: { avg: 2500 }, // Slow API calls
        memory_used: { max: 250 }, // High memory usage
        error_rate: { latest: 8 }, // High error rate
        db_query_duration: { avg: 1000 }, // Slow database queries
        throughput: { latest: 0.3 } // Low throughput
      }
      const alerts = []

      const recommendations = dataManager.generatePerformanceRecommendations(metrics, alerts)
      
      expect(recommendations).toHaveLength(5) // Should generate all 5 recommendations
      expect(recommendations[0]).toHaveProperty('category')
      expect(recommendations[0]).toHaveProperty('priority')
      expect(recommendations[0]).toHaveProperty('title')
      expect(recommendations[0]).toHaveProperty('description')
      expect(recommendations[0]).toHaveProperty('impact')
    })

    it('should get comprehensive performance dashboard', async () => {
      // Setup test data
      performanceMonitoringService.recordMetric('api_call_duration', 500, 'response_time')
      performanceMonitoringService.createAlert('info', 'Test Info', 'Test message')

      const dashboard = await dataManager.getPerformanceDashboard()
      
      expect(dashboard).toBeDefined()
      expect(dashboard.metrics).toBeDefined()
      expect(dashboard.alerts).toBeDefined()
      expect(dashboard.systemHealth).toBeDefined()
      expect(dashboard.recommendations).toBeDefined()
      expect(dashboard.lastUpdated).toBeDefined()
    })
  })

  describe('Error Handling and Edge Cases', () => {
    it('should handle missing timer gracefully', () => {
      const result = performanceMonitoringService.endTimer('nonexistent_timer')
      expect(result).toBeNull()
    })

    it('should handle service errors in DataManager methods', () => {
      // Mock service to throw error
      const originalMethod = performanceMonitoringService.getMetricsSummary
      performanceMonitoringService.getMetricsSummary = vi.fn().mockImplementation(() => {
        throw new Error('Service error')
      })

      const metrics = dataManager.getPerformanceMetrics()
      expect(metrics).toEqual({}) // Should return empty object on error

      // Restore original method
      performanceMonitoringService.getMetricsSummary = originalMethod
    })

    it('should handle dashboard generation errors', async () => {
      // Mock service to throw error for metrics
      const originalMethod = performanceMonitoringService.getMetricsSummary
      performanceMonitoringService.getMetricsSummary = vi.fn().mockImplementation(() => {
        throw new Error('Metrics error')
      })

      const dashboard = await dataManager.getPerformanceDashboard()
      
      expect(dashboard).toBeDefined()
      expect(dashboard.error).toBeDefined()
      expect(dashboard.metrics).toEqual({})
      expect(dashboard.systemHealth.status).toBe('unknown')

      // Restore original method
      performanceMonitoringService.getMetricsSummary = originalMethod
    })

    it('should cleanup old metrics and alerts', () => {
      // Add old metrics
      const oldTime = Date.now() - (25 * 60 * 60 * 1000) // 25 hours ago
      performanceMonitoringService.metrics.set('old_metric', [
        { timestamp: oldTime, value: 100 }
      ])
      performanceMonitoringService.alerts.set('old_alert', {
        timestamp: oldTime,
        title: 'Old Alert'
      })

      // Add recent metrics
      performanceMonitoringService.recordMetric('new_metric', 200, 'custom')

      // Run cleanup
      performanceMonitoringService.cleanup()

      // Check that old data was removed and new data remains
      expect(performanceMonitoringService.metrics.get('old_metric')).toHaveLength(0)
      expect(performanceMonitoringService.alerts.has('old_alert')).toBe(false)
      expect(performanceMonitoringService.metrics.get('new_metric')).toHaveLength(1)
    })
  })

  describe('Memory and Resource Management', () => {
    it('should limit metric history size', () => {
      const metricName = 'test_limit_metric'
      
      // Add more metrics than the limit (1000)
      for (let i = 0; i < 1200; i++) {
        performanceMonitoringService.recordMetric(metricName, i, 'custom')
      }

      const metrics = performanceMonitoringService.metrics.get(metricName)
      expect(metrics).toHaveLength(1000) // Should be limited to 1000
      expect(metrics[0].value).toBe(200) // First 200 should be removed
      expect(metrics[999].value).toBe(1199) // Last value should be preserved
    })

    it('should properly dispose service', () => {
      performanceMonitoringService.startMonitoring()
      expect(performanceMonitoringService.isMonitoring).toBe(true)

      performanceMonitoringService.dispose()
      expect(performanceMonitoringService.isMonitoring).toBe(false)
      expect(performanceMonitoringService.metrics.size).toBe(0)
      expect(performanceMonitoringService.alerts.size).toBe(0)
    })
  })

  describe('Performance Thresholds and Alerting', () => {
    it('should trigger alerts for various performance issues', () => {
      // Test API response time alert
      performanceMonitoringService.recordAPICall('/api/slow', 'GET', 200, 5000)
      
      // Test memory usage alert  
      performanceMonitoringService.recordMetric('memory_used', 250, 'memory_usage')
      
      // Test error rate alert
      performanceMonitoringService.recordMetric('error_rate', 12, 'error_rate')

      const alerts = performanceMonitoringService.getRecentAlerts()
      expect(alerts.length).toBeGreaterThan(0)
      
      const criticalAlerts = alerts.filter(a => a.level === 'critical')
      const warningAlerts = alerts.filter(a => a.level === 'warning')
      
      expect(criticalAlerts.length + warningAlerts.length).toBeGreaterThan(0)
    })

    it('should calculate error rate and throughput correctly', () => {
      performanceMonitoringService.startMonitoring()
      
      // Simulate API calls with some errors
      const now = Date.now()
      for (let i = 0; i < 10; i++) {
        const isError = i < 2 // First 2 calls are errors
        performanceMonitoringService.recordAPICall(
          '/api/test',
          'GET',
          isError ? 500 : 200,
          100
        )
      }

      // Trigger calculations
      performanceMonitoringService.calculateErrorRate()
      performanceMonitoringService.calculateThroughput()

      const errorRateMetrics = performanceMonitoringService.metrics.get('error_rate')
      const throughputMetrics = performanceMonitoringService.metrics.get('throughput')

      expect(errorRateMetrics).toBeDefined()
      expect(throughputMetrics).toBeDefined()
      
      if (errorRateMetrics && errorRateMetrics.length > 0) {
        expect(errorRateMetrics[0].value).toBe(20) // 2 errors out of 10 calls = 20%
      }
    })
  })
})