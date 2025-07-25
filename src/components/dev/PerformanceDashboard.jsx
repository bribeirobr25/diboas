/**
 * Performance Monitoring Dashboard
 * Real-time display of Core Web Vitals and performance metrics
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { 
  Activity, 
  Clock, 
  Zap, 
  TrendingUp, 
  TrendingDown,
  Download,
  RefreshCw
} from 'lucide-react'
import { seoReporting, coreWebVitals } from '../../utils/seoMonitoring.js'

export default function PerformanceDashboard() {
  const [metrics, setMetrics] = useState([])
  const [performanceGrade, setPerformanceGrade] = useState({ grade: 'N/A', score: 0 })
  const [seoReport, setSeoReport] = useState(null)
  const [isVisible, setIsVisible] = useState(true)

  // Load metrics on mount and set up refresh
  useEffect(() => {
    loadMetrics()
    const interval = setInterval(loadMetrics, 5000) // Refresh every 5 seconds
    return () => clearInterval(interval)
  }, [])

  const loadMetrics = () => {
    try {
      const savedMetrics = JSON.parse(localStorage.getItem('seo_metrics') || '[]')
      const recentMetrics = savedMetrics.slice(-20) // Last 20 measurements
      setMetrics(recentMetrics)
      
      const grade = coreWebVitals.getPerformanceGrade()
      setPerformanceGrade(grade)
      
      const report = seoReporting.generateReport()
      setSeoReport(report)
    } catch (error) {
      console.error('Failed to load performance metrics:', error)
    }
  }

  const getMetricIcon = (name) => {
    switch (name) {
      case 'LCP': return <Clock className="w-4 h-4" />
      case 'FID': return <Zap className="w-4 h-4" />
      case 'CLS': return <Activity className="w-4 h-4" />
      case 'FCP': return <Clock className="w-4 h-4" />
      case 'TTFB': return <Activity className="w-4 h-4" />
      default: return <Activity className="w-4 h-4" />
    }
  }

  const getMetricColor = (rating) => {
    switch (rating) {
      case 'good': return 'text-green-600'
      case 'needs-improvement': return 'text-yellow-600'
      case 'poor': return 'text-red-600'
      default: return 'text-gray-600'
    }
  }

  const getGradeColor = (grade) => {
    switch (grade) {
      case 'A': return 'text-green-600 bg-green-50 border-green-200'
      case 'B': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'C': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'D': return 'text-orange-600 bg-orange-50 border-orange-200'
      default: return 'text-red-600 bg-red-50 border-red-200'
    }
  }

  const exportReport = () => {
    seoReporting.exportReport()
  }

  const clearMetrics = () => {
    localStorage.removeItem('seo_metrics')
    setMetrics([])
    setPerformanceGrade({ grade: 'N/A', score: 0 })
  }

  // Group metrics by type for display
  const metricsByType = metrics.reduce((acc, metric) => {
    if (!acc[metric.name]) acc[metric.name] = []
    acc[metric.name].push(metric)
    return acc
  }, {})

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          className="performance-dashboard-toggle"
          size="sm"
        >
          <Activity className="w-4 h-4" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96 max-h-96 overflow-y-auto bg-white shadow-2xl rounded-lg border">
      <Card className="performance-dashboard-card">
        <CardHeader className="performance-dashboard-header">
          <div className="performance-dashboard-title-section">
            <CardTitle className="performance-dashboard-title">
              <Activity className="w-5 h-5" />
              Performance Monitor
            </CardTitle>
            <div className="performance-dashboard-actions">
              <Button
                variant="ghost"
                size="sm"
                onClick={loadMetrics}
                className="performance-action-button"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsVisible(false)}
                className="performance-action-button"
              >
                ×
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="performance-dashboard-content">
          {/* Overall Performance Grade */}
          <div className="performance-grade-section">
            <div className={`performance-grade-badge ${getGradeColor(performanceGrade.grade)}`}>
              <span className="performance-grade-label">Grade:</span>
              <span className="performance-grade-value">{performanceGrade.grade}</span>
              <span className="performance-score-value">({performanceGrade.score}/100)</span>
            </div>
          </div>

          {/* Core Web Vitals */}
          <div className="performance-metrics-section">
            <h4 className="performance-metrics-title">Core Web Vitals</h4>
            <div className="performance-metrics-grid">
              {Object.entries(metricsByType).map(([metricName, metricData]) => {
                const latest = metricData[metricData.length - 1]
                const trend = metricData.length > 1 
                  ? latest.value - metricData[metricData.length - 2].value
                  : 0

                return (
                  <div key={metricName} className="performance-metric-card">
                    <div className="performance-metric-header">
                      <div className="performance-metric-icon">
                        {getMetricIcon(metricName)}
                      </div>
                      <div className="performance-metric-info">
                        <span className="performance-metric-name">{metricName}</span>
                        <span className={`performance-metric-rating ${getMetricColor(latest.rating)}`}>
                          {latest.rating}
                        </span>
                      </div>
                      <div className="performance-metric-trend">
                        {trend !== 0 && (
                          trend > 0 
                            ? <TrendingUp className="w-3 h-3 text-red-500" />
                            : <TrendingDown className="w-3 h-3 text-green-500" />
                        )}
                      </div>
                    </div>
                    <div className="performance-metric-value">
                      {latest.value}ms
                      {trend !== 0 && (
                        <span className={`performance-metric-delta ${trend > 0 ? 'text-red-500' : 'text-green-500'}`}>
                          ({trend > 0 ? '+' : ''}{trend}ms)
                        </span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* SEO Score */}
          {seoReport && (
            <div className="performance-seo-section">
              <h4 className="performance-seo-title">SEO Score</h4>
              <div className={`performance-seo-badge ${getGradeColor(seoReport.seo.grade)}`}>
                <span className="performance-seo-score">{seoReport.seo.score}/100</span>
                <span className="performance-seo-grade">({seoReport.seo.grade})</span>
              </div>
              {seoReport.summary.priorityActions > 0 && (
                <div className="performance-seo-issues">
                  {seoReport.summary.priorityActions} priority issues
                </div>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="performance-actions-section">
            <Button
              variant="outline"
              size="sm"
              onClick={exportReport}
              className="performance-export-button"
            >
              <Download className="w-4 h-4 mr-1" />
              Export Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={clearMetrics}
              className="performance-clear-button"
            >
              Clear Data
            </Button>
          </div>

          {/* Metrics Count */}
          <div className="performance-stats-section">
            <div className="performance-stats-item">
              <span className="performance-stats-label">Metrics Collected:</span>
              <span className="performance-stats-value">{metrics.length}</span>
            </div>
            <div className="performance-stats-item">
              <span className="performance-stats-label">Last Updated:</span>
              <span className="performance-stats-value">
                {metrics.length > 0 
                  ? new Date(metrics[metrics.length - 1].timestamp).toLocaleTimeString()
                  : 'Never'
                }
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}