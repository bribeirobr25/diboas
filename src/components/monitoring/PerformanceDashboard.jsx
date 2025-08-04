/**
 * Performance Dashboard Component
 * Real-time performance monitoring dashboard with metrics, alerts, and insights
 */

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { usePerformanceMetrics } from '../../hooks/usePerformanceMonitoring.jsx'
import logger from '../../utils/logger'
import {
  Activity,
  AlertTriangle,
  BarChart3,
  Clock,
  Cpu,
  Database,
  Globe,
  HardDrive,
  Zap,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
  Settings,
  Users,
  Server,
  Wifi
} from 'lucide-react'
import PageHeader from '../shared/PageHeader.jsx'

export default function PerformanceDashboard() {
  const { metrics, alerts, isLoading, refreshMetrics, generateReport } = usePerformanceMetrics(3000)
  const [selectedTimeframe, setSelectedTimeframe] = useState('15m')
  const [autoRefresh, setAutoRefresh] = useState(true)
  const [reportData, setReportData] = useState(null)

  const timeframes = {
    '5m': 5 * 60 * 1000,
    '15m': 15 * 60 * 1000,
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000
  }

  // Calculate health score and status
  const healthData = useMemo(() => {
    if (!metrics || !alerts) return { score: 100, status: 'excellent', color: 'text-green-600' }

    let score = 100
    const criticalAlerts = alerts.filter(a => a.level === 'critical').length
    const warningAlerts = alerts.filter(a => a.level === 'warning').length

    // Deduct for alerts
    score -= criticalAlerts * 15
    score -= warningAlerts * 5

    // Deduct for performance issues
    if (metrics.api_call_duration?.avg > 2000) score -= 20
    if (metrics.error_rate?.latest > 5) score -= 25
    if (metrics.memory_used?.latest > 150) score -= 10

    score = Math.max(0, score)

    let status, color
    if (score >= 90) {
      status = 'excellent'
      color = 'text-green-600'
    } else if (score >= 75) {
      status = 'good'
      color = 'text-blue-600'
    } else if (score >= 60) {
      status = 'fair'
      color = 'text-yellow-600'
    } else {
      status = 'poor'
      color = 'text-red-600'
    }

    return { score, status, color }
  }, [metrics, alerts])

  const handleGenerateReport = async () => {
    try {
      const timeWindow = timeframes[selectedTimeframe]
      const report = generateReport(timeWindow)
      setReportData(report)
      
      logger.info('Performance report generated', { timeframe: selectedTimeframe })
    } catch (error) {
      logger.error('Failed to generate performance report:', error)
    }
  }

  const formatDuration = (ms) => {
    if (ms < 1000) return `${ms.toFixed(0)}ms`
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
    return `${(ms / 60000).toFixed(1)}m`
  }

  const formatBytes = (bytes) => {
    if (bytes < 1024) return `${bytes.toFixed(0)}B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`
    return `${(bytes / 1024 / 1024).toFixed(1)}MB`
  }

  const getAlertIcon = (level) => {
    switch (level) {
      case 'critical': return <AlertCircle className="w-4 h-4 text-red-500" />
      case 'warning': return <AlertTriangle className="w-4 h-4 text-yellow-500" />
      default: return <CheckCircle className="w-4 h-4 text-blue-500" />
    }
  }

  const getAlertColor = (level) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200'
      case 'warning': return 'bg-yellow-100 text-yellow-800 border-yellow-200'
      default: return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  if (isLoading) {
    return (
      <div className="main-layout">
        <PageHeader showUserActions={true} />
        <div className="page-container">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="text-gray-600 ml-3">Loading performance dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-layout">
      <PageHeader showUserActions={true} />
      
      <div className="page-container">
        {/* Dashboard Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Performance Dashboard
              </h1>
              <p className="text-lg text-gray-600">
                Real-time application performance monitoring and insights
              </p>
            </div>
            <div className="flex items-center gap-4">
              <select 
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="5m">Last 5 minutes</option>
                <option value="15m">Last 15 minutes</option>
                <option value="1h">Last hour</option>
                <option value="6h">Last 6 hours</option>
                <option value="24h">Last 24 hours</option>
              </select>
              <Button 
                variant="outline" 
                onClick={refreshMetrics}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={handleGenerateReport}>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Health Score */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Overall Health Score</h3>
                  <div className="flex items-center gap-4">
                    <div className={`text-4xl font-bold ${healthData.color}`}>
                      {healthData.score}
                    </div>
                    <div>
                      <p className={`text-xl font-semibold capitalize ${healthData.color}`}>
                        {healthData.status}
                      </p>
                      <p className="text-gray-600">System Performance</p>
                    </div>
                  </div>
                  <Progress value={healthData.score} className="mt-4 w-64" />
                </div>
                <div className="text-center">
                  <Activity className={`w-16 h-16 mx-auto mb-2 ${healthData.color}`} />
                  <p className="text-sm text-gray-600">
                    Last updated: {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-bold text-blue-600">
                {metrics?.api_call_duration?.avg ? formatDuration(metrics.api_call_duration.avg) : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Error Rate</p>
              <p className="text-2xl font-bold text-red-600">
                {metrics?.error_rate?.latest ? `${metrics.error_rate.latest.toFixed(1)}%` : '0%'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <HardDrive className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Memory Usage</p>
              <p className="text-2xl font-bold text-purple-600">
                {metrics?.memory_used?.latest ? `${metrics.memory_used.latest.toFixed(0)}MB` : 'N/A'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Throughput</p>
              <p className="text-2xl font-bold text-green-600">
                {metrics?.throughput?.latest ? `${metrics.throughput.latest.toFixed(1)} RPS` : 'N/A'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        {alerts && alerts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-500" />
              Recent Alerts ({alerts.length})
            </h2>
            <div className="space-y-3">
              {alerts.slice(0, 5).map((alert, index) => (
                <Card key={alert.id || index} className={`border-l-4 ${getAlertColor(alert.level)}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3">
                        {getAlertIcon(alert.level)}
                        <div>
                          <h4 className="font-semibold">{alert.title}</h4>
                          <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                          <p className="text-xs text-gray-500 mt-2">
                            {new Date(alert.timestamp).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <Badge className={getAlertColor(alert.level)}>
                        {alert.level}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="overview" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Overview
            </TabsTrigger>
            <TabsTrigger value="api" className="flex items-center gap-2">
              <Globe className="w-4 h-4" />
              API Performance
            </TabsTrigger>
            <TabsTrigger value="resources" className="flex items-center gap-2">
              <Server className="w-4 h-4" />
              Resources
            </TabsTrigger>
            <TabsTrigger value="user" className="flex items-center gap-2">
              <Users className="w-4 h-4" />
              User Experience
            </TabsTrigger>
            <TabsTrigger value="system" className="flex items-center gap-2">
              <Cpu className="w-4 h-4" />
              System
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Performance Trends */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5" />
                    Performance Trends
                  </CardTitle>
                  <CardDescription>Key metrics over time</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {metrics && Object.entries(metrics).slice(0, 6).map(([name, data]) => (
                      <div key={name} className="flex justify-between items-center">
                        <span className="text-sm font-medium capitalize">
                          {name.replace(/_/g, ' ')}
                        </span>
                        <div className="text-right">
                          <span className="text-lg font-semibold">
                            {typeof data.latest === 'number' 
                              ? (name.includes('time') || name.includes('duration') 
                                  ? formatDuration(data.latest)
                                  : data.latest.toFixed(1))
                              : data.latest || 'N/A'
                            }
                          </span>
                          <div className="text-xs text-gray-500">
                            Avg: {data.avg?.toFixed(1) || 'N/A'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* System Health */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="w-5 h-5" />
                    System Health
                  </CardTitle>
                  <CardDescription>Current system status</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Response Time</span>
                      <div className="flex items-center gap-2">
                        {metrics?.api_call_duration?.avg < 1000 ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="font-semibold">
                          {metrics?.api_call_duration?.avg < 1000 ? 'Good' : 'Poor'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Error Rate</span>
                      <div className="flex items-center gap-2">
                        {(metrics?.error_rate?.latest || 0) < 2 ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-500" />
                        )}
                        <span className="font-semibold">
                          {(metrics?.error_rate?.latest || 0) < 2 ? 'Good' : 'High'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Memory Usage</span>
                      <div className="flex items-center gap-2">
                        {(metrics?.memory_used?.latest || 0) < 100 ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                        )}
                        <span className="font-semibold">
                          {(metrics?.memory_used?.latest || 0) < 100 ? 'Normal' : 'High'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <span className="text-sm">Throughput</span>
                      <div className="flex items-center gap-2">
                        {(metrics?.throughput?.latest || 0) > 1 ? (
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-yellow-500" />
                        )}
                        <span className="font-semibold">
                          {(metrics?.throughput?.latest || 0) > 1 ? 'Good' : 'Low'}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* API Performance Tab */}
          <TabsContent value="api">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>API Response Times</CardTitle>
                  <CardDescription>Response time statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Average</span>
                      <span className="font-semibold">
                        {metrics?.api_call_duration?.avg ? formatDuration(metrics.api_call_duration.avg) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Minimum</span>
                      <span className="font-semibold">
                        {metrics?.api_call_duration?.min ? formatDuration(metrics.api_call_duration.min) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Maximum</span>
                      <span className="font-semibold">
                        {metrics?.api_call_duration?.max ? formatDuration(metrics.api_call_duration.max) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Calls</span>
                      <span className="font-semibold">
                        {metrics?.api_call_duration?.count || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Error Analysis</CardTitle>
                  <CardDescription>API error statistics</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Current Error Rate</span>
                      <span className="font-semibold text-red-600">
                        {metrics?.error_rate?.latest ? `${metrics.error_rate.latest.toFixed(2)}%` : '0.00%'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Average Error Rate</span>
                      <span className="font-semibold">
                        {metrics?.error_rate?.avg ? `${metrics.error_rate.avg.toFixed(2)}%` : '0.00%'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Peak Error Rate</span>
                      <span className="font-semibold">
                        {metrics?.error_rate?.max ? `${metrics.error_rate.max.toFixed(2)}%` : '0.00%'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Resources Tab */}
          <TabsContent value="resources">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5" />
                    Memory Usage
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Current Usage</span>
                      <span className="font-semibold">
                        {metrics?.memory_used?.latest ? `${metrics.memory_used.latest.toFixed(1)}MB` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Peak Usage</span>
                      <span className="font-semibold">
                        {metrics?.memory_used?.max ? `${metrics.memory_used.max.toFixed(1)}MB` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Heap</span>
                      <span className="font-semibold">
                        {metrics?.memory_total?.latest ? `${metrics.memory_total.latest.toFixed(1)}MB` : 'N/A'}
                      </span>
                    </div>
                    {metrics?.memory_used?.latest && metrics?.memory_total?.latest && (
                      <Progress 
                        value={(metrics.memory_used.latest / metrics.memory_total.latest) * 100} 
                        className="mt-4" 
                      />
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <HardDrive className="w-5 h-5" />
                    Resource Loading
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Avg Load Time</span>
                      <span className="font-semibold">
                        {metrics?.resource_load_time?.avg ? formatDuration(metrics.resource_load_time.avg) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Slowest Resource</span>
                      <span className="font-semibold">
                        {metrics?.resource_load_time?.max ? formatDuration(metrics.resource_load_time.max) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Resources Loaded</span>
                      <span className="font-semibold">
                        {metrics?.resource_load_time?.count || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* User Experience Tab */}
          <TabsContent value="user">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Page Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Page Load</span>
                      <span className="font-semibold">
                        {metrics?.navigation_total_page_load?.avg ? 
                          formatDuration(metrics.navigation_total_page_load.avg) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>DOM Processing</span>
                      <span className="font-semibold">
                        {metrics?.navigation_dom_processing?.avg ? 
                          formatDuration(metrics.navigation_dom_processing.avg) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Resource Loading</span>
                      <span className="font-semibold">
                        {metrics?.navigation_resource_loading?.avg ? 
                          formatDuration(metrics.navigation_resource_loading.avg) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>User Interactions</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Total Interactions</span>
                      <span className="font-semibold">
                        {metrics?.user_interaction?.count || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Component Renders</span>
                      <span className="font-semibold">
                        {metrics?.component_render?.count || 0}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Render Time</span>
                      <span className="font-semibold">
                        {metrics?.component_render?.avg ? formatDuration(metrics.component_render.avg) : 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* System Tab */}
          <TabsContent value="system">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle>Network Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Connection Type</span>
                      <span className="font-semibold">
                        {metrics?.network_type?.latest || 'Unknown'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Throughput</span>
                      <span className="font-semibold">
                        {metrics?.throughput?.latest ? `${metrics.throughput.latest.toFixed(1)} RPS` : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Peak Throughput</span>
                      <span className="font-semibold">
                        {metrics?.throughput?.max ? `${metrics.throughput.max.toFixed(1)} RPS` : 'N/A'}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Database Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Avg Query Time</span>
                      <span className="font-semibold">
                        {metrics?.db_query_duration?.avg ? formatDuration(metrics.db_query_duration.avg) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Slowest Query</span>
                      <span className="font-semibold">
                        {metrics?.db_query_duration?.max ? formatDuration(metrics.db_query_duration.max) : 'N/A'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Queries</span>
                      <span className="font-semibold">
                        {metrics?.db_query_duration?.count || 0}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Performance monitoring powered by advanced analytics and real-time metrics collection</p>
          <p className="mt-1">Data refreshes every 3 seconds • {metrics ? Object.keys(metrics).length : 0} metrics tracked</p>
        </div>
      </div>
    </div>
  )
}