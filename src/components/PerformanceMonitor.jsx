/**
 * Performance Monitor Component
 * Provides real-time performance monitoring for FinTech operations
 */

import { useState, useEffect, useRef } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { 
  Activity, 
  Clock, 
  Cpu, 
  MemoryStick, 
  Zap,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react'
import { 
  performanceMonitor, 
  memoryLeakPrevention 
} from '../utils/performanceOptimizations.js'
import { getCurrentEnvironment } from '../config/environments.js'

const PerformanceMonitor = () => {
  const [metrics, setMetrics] = useState({
    renderTime: 0,
    memoryUsage: null,
    coreWebVitals: null,
    lastUpdate: Date.now()
  })
  const [isVisible, setIsVisible] = useState(false)
  const [alerts, setAlerts] = useState([])
  const updateIntervalRef = useRef()

  // Only show in development environment
  const isDevelopment = getCurrentEnvironment() === 'development'

  useEffect(() => {
    if (!isDevelopment) return

    const updateMetrics = () => {
      // Memory monitoring
      const memoryInfo = memoryLeakPrevention.monitorMemory()
      
      // Core Web Vitals
      const webVitals = performanceMonitor.getCoreWebVitals()
      
      // Performance entries
      const renderEntries = performance.getEntriesByType('measure')
      const avgRenderTime = renderEntries.length > 0 
        ? renderEntries.reduce((sum, entry) => sum + entry.duration, 0) / renderEntries.length
        : 0

      const newMetrics = {
        renderTime: avgRenderTime,
        memoryUsage: memoryInfo,
        coreWebVitals: webVitals,
        lastUpdate: Date.now()
      }

      setMetrics(newMetrics)
      
      // Check for performance issues
      checkPerformanceAlerts(newMetrics)
    }

    // Update metrics every 5 seconds
    updateIntervalRef.current = setInterval(updateMetrics, 5000)
    updateMetrics() // Initial update

    return () => {
      if (updateIntervalRef.current) {
        clearInterval(updateIntervalRef.current)
      }
    }
  }, [isDevelopment])

  const checkPerformanceAlerts = (currentMetrics) => {
    const newAlerts = []

    // Memory usage alerts
    if (currentMetrics.memoryUsage) {
      const usagePercent = parseFloat(currentMetrics.memoryUsage.usagePercentage)
      
      if (usagePercent > 80) {
        newAlerts.push({
          id: 'memory-high',
          type: 'error',
          message: `High memory usage: ${usagePercent}%`,
          timestamp: Date.now()
        })
      } else if (usagePercent > 60) {
        newAlerts.push({
          id: 'memory-warning',
          type: 'warning',
          message: `Memory usage: ${usagePercent}%`,
          timestamp: Date.now()
        })
      }
    }

    // Render time alerts
    if (currentMetrics.renderTime > 16) {
      newAlerts.push({
        id: 'render-slow',
        type: 'warning',
        message: `Slow render: ${currentMetrics.renderTime.toFixed(2)}ms`,
        timestamp: Date.now()
      })
    }

    // Core Web Vitals alerts
    if (currentMetrics.coreWebVitals) {
      const { fcp, lcp } = currentMetrics.coreWebVitals
      
      if (fcp > 3000) {
        newAlerts.push({
          id: 'fcp-slow',
          type: 'warning',
          message: `Slow First Contentful Paint: ${(fcp/1000).toFixed(2)}s`,
          timestamp: Date.now()
        })
      }
      
      if (lcp > 4000) {
        newAlerts.push({
          id: 'lcp-slow',
          type: 'error',
          message: `Poor Largest Contentful Paint: ${(lcp/1000).toFixed(2)}s`,
          timestamp: Date.now()
        })
      }
    }

    setAlerts(newAlerts)
  }

  const clearPerformanceData = () => {
    performance.clearMarks()
    performance.clearMeasures()
    setAlerts([])
  }

  const formatBytes = (bytes) => {
    if (!bytes) return 'N/A'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${Math.round(bytes / Math.pow(1024, i) * 100) / 100} ${sizes[i]}`
  }

  const getAlertIcon = (type) => {
    switch (type) {
      case 'error':
        return <XCircle className="w-4 h-4 text-red-500" />
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default:
        return <CheckCircle className="w-4 h-4 text-green-500" />
    }
  }

  // Don't render in production
  if (!isDevelopment) {
    return null
  }

  return (
    <>
      {/* Toggle Button */}
      <div className="fixed bottom-20 right-4 z-40">
        <Button
          onClick={() => setIsVisible(!isVisible)}
          className="rounded-full w-12 h-12 p-0 bg-green-600 hover:bg-green-700 text-white shadow-lg"
          title="Performance Monitor"
        >
          <Activity className="w-5 h-5" />
        </Button>
      </div>

      {/* Performance Panel */}
      {isVisible && (
        <div className="fixed bottom-36 right-4 w-80 max-h-96 bg-white border rounded-lg shadow-xl z-40 overflow-hidden">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm flex items-center space-x-2">
                <Activity className="w-4 h-4" />
                <span>Performance Monitor</span>
              </CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="h-6 w-6 p-0"
              >
                ×
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-4 max-h-80 overflow-y-auto">
            {/* Alerts */}
            {alerts.length > 0 && (
              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-gray-600">Alerts</h4>
                {alerts.map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-2 text-xs">
                    {getAlertIcon(alert.type)}
                    <span className="flex-1">{alert.message}</span>
                  </div>
                ))}
              </div>
            )}

            {/* Render Performance */}
            <div>
              <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center space-x-1">
                <Clock className="w-3 h-3" />
                <span>Render Performance</span>
              </h4>
              <div className="flex items-center justify-between text-xs">
                <span>Avg Render Time:</span>
                <Badge 
                  variant={metrics.renderTime > 16 ? "destructive" : "default"}
                  className="text-xs"
                >
                  {metrics.renderTime.toFixed(2)}ms
                </Badge>
              </div>
            </div>

            {/* Memory Usage */}
            {metrics.memoryUsage && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center space-x-1">
                  <MemoryStick className="w-3 h-3" />
                  <span>Memory Usage</span>
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>Used:</span>
                    <span>{formatBytes(metrics.memoryUsage.usedJSHeapSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Total:</span>
                    <span>{formatBytes(metrics.memoryUsage.totalJSHeapSize)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Usage:</span>
                    <Badge 
                      variant={parseFloat(metrics.memoryUsage.usagePercentage) > 80 ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {metrics.memoryUsage.usagePercentage}%
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {/* Core Web Vitals */}
            {metrics.coreWebVitals && (
              <div>
                <h4 className="text-xs font-semibold text-gray-600 mb-2 flex items-center space-x-1">
                  <Zap className="w-3 h-3" />
                  <span>Core Web Vitals</span>
                </h4>
                <div className="space-y-1 text-xs">
                  <div className="flex justify-between">
                    <span>FCP:</span>
                    <Badge 
                      variant={metrics.coreWebVitals.fcp > 3000 ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {(metrics.coreWebVitals.fcp/1000).toFixed(2)}s
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>LCP:</span>
                    <Badge 
                      variant={metrics.coreWebVitals.lcp > 4000 ? "destructive" : "default"}
                      className="text-xs"
                    >
                      {(metrics.coreWebVitals.lcp/1000).toFixed(2)}s
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>TTI:</span>
                    <span className="text-xs">{(metrics.coreWebVitals.tti/1000).toFixed(2)}s</span>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="pt-2 border-t">
              <Button
                variant="outline"
                size="sm"
                onClick={clearPerformanceData}
                className="w-full text-xs h-6"
              >
                Clear Performance Data
              </Button>
            </div>

            {/* Last Update */}
            <div className="text-xs text-gray-500 text-center">
              Last updated: {new Date(metrics.lastUpdate).toLocaleTimeString()}
            </div>
          </CardContent>
        </div>
      )}
    </>
  )
}

export default PerformanceMonitor