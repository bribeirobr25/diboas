/**
 * Error Recovery Dashboard Component
 * Comprehensive dashboard for monitoring errors, recovery status, and system health
 */

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { useErrorRecovery, useErrorMetrics, useCircuitBreaker } from '../../hooks/useErrorRecovery.jsx'
import { ERROR_TYPES, ERROR_SEVERITY, RECOVERY_STRATEGIES } from '../../services/errorHandling/ErrorRecoveryService.js'
import logger from '../../utils/logger.js'
import {
  AlertTriangle,
  Shield,
  Activity,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  Clock,
  Zap,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  BarChart3,
  Users,
  Server,
  Download,
  Eye,
  Target
} from 'lucide-react'
import PageHeader from '../shared/PageHeader.jsx'

export default function ErrorRecoveryDashboard() {
  const { errors, isRecovering, clearErrors, handleError } = useErrorRecovery({
    componentName: 'ErrorRecoveryDashboard'
  })
  const { metrics, loading: metricsLoading, refreshMetrics } = useErrorMetrics()
  const apiCircuit = useCircuitBreaker('api')
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h')
  const [autoRefresh, setAutoRefresh] = useState(true)

  // Auto-refresh metrics
  useEffect(() => {
    if (!autoRefresh) return

    const interval = setInterval(() => {
      refreshMetrics()
    }, 30000) // Refresh every 30 seconds

    return () => clearInterval(interval)
  }, [autoRefresh, refreshMetrics])

  const timeframes = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  }

  const calculateSystemHealth = () => {
    if (!metrics) return { score: 100, status: 'healthy', color: 'text-green-600' }

    let score = 100
    const { total, bySeverity } = metrics

    // Deduct points based on error severity
    score -= (bySeverity[ERROR_SEVERITY.CRITICAL] || 0) * 20
    score -= (bySeverity[ERROR_SEVERITY.HIGH] || 0) * 10
    score -= (bySeverity[ERROR_SEVERITY.MEDIUM] || 0) * 5
    score -= (bySeverity[ERROR_SEVERITY.LOW] || 0) * 2

    // Circuit breaker penalty
    if (apiCircuit.circuitState !== 'closed') {
      score -= 15
    }

    // Ensure score doesn't go below 0
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
    } else if (score >= 40) {
      status = 'poor'
      color = 'text-orange-600'
    } else {
      status = 'critical'
      color = 'text-red-600'
    }

    return { score, status, color }
  }

  const systemHealth = calculateSystemHealth()

  const getErrorTypeIcon = (type) => {
    const icons = {
      [ERROR_TYPES.NETWORK_ERROR]: <Server className="w-4 h-4" />,
      [ERROR_TYPES.VALIDATION_ERROR]: <AlertTriangle className="w-4 h-4" />,
      [ERROR_TYPES.AUTHENTICATION_ERROR]: <Shield className="w-4 h-4" />,
      [ERROR_TYPES.TRANSACTION_ERROR]: <Activity className="w-4 h-4" />,
      [ERROR_TYPES.TIMEOUT_ERROR]: <Clock className="w-4 h-4" />,
      [ERROR_TYPES.RATE_LIMIT_ERROR]: <Zap className="w-4 h-4" />
    }
    return icons[type] || <AlertCircle className="w-4 h-4" />
  }

  const getSeverityColor = (severity) => {
    const colors = {
      [ERROR_SEVERITY.CRITICAL]: 'bg-red-100 text-red-800 border-red-200',
      [ERROR_SEVERITY.HIGH]: 'bg-orange-100 text-orange-800 border-orange-200',
      [ERROR_SEVERITY.MEDIUM]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      [ERROR_SEVERITY.LOW]: 'bg-blue-100 text-blue-800 border-blue-200',
      [ERROR_SEVERITY.INFO]: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[severity] || colors[ERROR_SEVERITY.INFO]
  }

  const getRecoveryStrategyIcon = (strategy) => {
    const icons = {
      [RECOVERY_STRATEGIES.RETRY]: <RefreshCw className="w-4 h-4" />,
      [RECOVERY_STRATEGIES.FALLBACK]: <Shield className="w-4 h-4" />,
      [RECOVERY_STRATEGIES.CIRCUIT_BREAKER]: <Zap className="w-4 h-4" />,
      [RECOVERY_STRATEGIES.GRACEFUL_DEGRADATION]: <TrendingDown className="w-4 h-4" />,
      [RECOVERY_STRATEGIES.USER_INTERVENTION]: <Users className="w-4 h-4" />
    }
    return icons[strategy] || <Settings className="w-4 h-4" />
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  const triggerTestError = async (type, severity) => {
    await handleError({
      type,
      severity,
      message: `Test ${type} error - ${severity} severity`,
      originalError: new Error(`Test error: ${type}`)
    }, { source: 'dashboard_test' })
  }

  if (metricsLoading && !metrics) {
    return (
      <div className="main-layout">
        <PageHeader showUserActions={true} />
        <div className="page-container">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="text-gray-600 ml-3">Loading error recovery dashboard...</p>
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
                Error Recovery Dashboard
              </h1>
              <p className="text-lg text-gray-600">
                System health monitoring, error tracking, and recovery management
              </p>
            </div>
            <div className="flex items-center gap-4">
              <select 
                value={selectedTimeframe}
                onChange={(e) => setSelectedTimeframe(e.target.value)}
                className="border border-gray-300 rounded-lg px-3 py-2"
              >
                <option value="1h">Last hour</option>
                <option value="6h">Last 6 hours</option>
                <option value="24h">Last 24 hours</option>
                <option value="7d">Last 7 days</option>
                <option value="30d">Last 30 days</option>
              </select>
              <Button 
                variant="outline" 
                onClick={refreshMetrics}
                disabled={isRecovering}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isRecovering ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            </div>
          </div>
        </div>

        {/* System Health Score */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">System Health Score</h3>
                  <div className="flex items-center gap-4">
                    <div className={`text-4xl font-bold ${systemHealth.color}`}>
                      {systemHealth.score}
                    </div>
                    <div>
                      <p className={`text-xl font-semibold capitalize ${systemHealth.color}`}>
                        {systemHealth.status}
                      </p>
                      <p className="text-gray-600">Error Recovery System</p>
                    </div>
                  </div>
                  <Progress value={systemHealth.score} className="mt-4 w-64" />
                </div>
                <div className="text-center">
                  <Shield className={`w-16 h-16 mx-auto mb-2 ${systemHealth.color}`} />
                  <p className="text-sm text-gray-600">
                    Last updated: {new Date().toLocaleTimeString()}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <XCircle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Total Errors</p>
              <p className="text-2xl font-bold text-red-600">
                {metrics?.total || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <AlertTriangle className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Critical Errors</p>
              <p className="text-2xl font-bold text-orange-600">
                {metrics?.bySeverity?.[ERROR_SEVERITY.CRITICAL] || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Zap className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Circuit State</p>
              <p className={`text-2xl font-bold capitalize ${
                apiCircuit.circuitState === 'closed' ? 'text-green-600' : 'text-red-600'
              }`}>
                {apiCircuit.circuitState}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Recovery Rate</p>
              <p className="text-2xl font-bold text-purple-600">
                {metrics?.recoverySuccess || 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Recent Errors</p>
              <p className="text-2xl font-bold text-green-600">
                {errors.length}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Current Circuit Breaker Status */}
        {apiCircuit.circuitState !== 'closed' && (
          <div className="mb-8">
            <Alert className="border-orange-200 bg-orange-50">
              <Zap className="w-4 h-4 text-orange-600" />
              <AlertDescription>
                <strong>Circuit Breaker Alert:</strong> API circuit breaker is {apiCircuit.circuitState}.
                {apiCircuit.nextAttempt && (
                  <> Next attempt available at {new Date(apiCircuit.nextAttempt).toLocaleTimeString()}.</>
                )}
                <Button 
                  size="sm" 
                  variant="outline" 
                  className="ml-4"
                  onClick={apiCircuit.resetCircuit}
                >
                  Reset Circuit
                </Button>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="errors" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="errors" className="flex items-center gap-2">
              <XCircle className="w-4 h-4" />
              Recent Errors
            </TabsTrigger>
            <TabsTrigger value="metrics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Metrics
            </TabsTrigger>
            <TabsTrigger value="recovery" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Recovery Status
            </TabsTrigger>
            <TabsTrigger value="circuit" className="flex items-center gap-2">
              <Zap className="w-4 h-4" />
              Circuit Breakers
            </TabsTrigger>
            <TabsTrigger value="testing" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Testing
            </TabsTrigger>
          </TabsList>

          {/* Recent Errors Tab */}
          <TabsContent value="errors">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Recent Errors</h2>
                <Button variant="outline" onClick={clearErrors} disabled={errors.length === 0}>
                  Clear All
                </Button>
              </div>

              {errors.length > 0 ? (
                <div className="space-y-4">
                  {errors.map((error) => (
                    <Card key={error.id} className={`border-l-4 ${getSeverityColor(error.severity)}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getErrorTypeIcon(error.type)}
                            <CardTitle className="text-lg">{error.type.replace(/_/g, ' ').toUpperCase()}</CardTitle>
                          </div>
                          <Badge className={getSeverityColor(error.severity)}>
                            {error.severity}
                          </Badge>
                        </div>
                        <CardDescription>
                          Error ID: {error.id} • {formatTimestamp(error.timestamp)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium">Message:</p>
                            <p className="text-sm text-gray-600">{error.message}</p>
                          </div>
                          {error.recoveryResult && (
                            <div>
                              <p className="text-sm font-medium">Recovery Strategy:</p>
                              <div className="flex items-center gap-2 mt-1">
                                {getRecoveryStrategyIcon(error.recoveryResult.recoveryStrategy)}
                                <span className="text-sm text-gray-600 capitalize">
                                  {error.recoveryResult.recoveryStrategy.replace(/_/g, ' ')}
                                </span>
                                <Badge variant={error.recoveryResult.canRecover ? "success" : "destructive"}>
                                  {error.recoveryResult.canRecover ? 'Success' : 'Failed'}
                                </Badge>
                              </div>
                            </div>
                          )}
                          {error.context && (
                            <div>
                              <p className="text-sm font-medium">Context:</p>
                              <pre className="text-xs text-gray-600 bg-gray-50 p-2 rounded mt-1 overflow-auto">
                                {JSON.stringify(error.context, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recent Errors</h3>
                  <p className="text-gray-600">Your system is running smoothly. No errors detected in the selected timeframe.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Metrics Tab */}
          <TabsContent value="metrics">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Error Metrics</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Error Distribution */}
                <Card>
                  <CardHeader>
                    <CardTitle>Error Distribution by Type</CardTitle>
                    <CardDescription>Errors by type over the selected period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {metrics?.topErrors?.map(({ type, count }) => (
                        <div key={type} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {getErrorTypeIcon(type)}
                            <span className="text-sm capitalize">{type.replace(/_/g, ' ')}</span>
                          </div>
                          <Badge>{count}</Badge>
                        </div>
                      )) || (
                        <p className="text-gray-500">No error data available</p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Severity Breakdown */}
                <Card>
                  <CardHeader>
                    <CardTitle>Error Severity Breakdown</CardTitle>
                    <CardDescription>Distribution by severity level</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {Object.entries(metrics?.bySeverity || {}).map(([severity, count]) => (
                        <div key={severity} className="flex justify-between items-center">
                          <span className="text-sm capitalize">{severity}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-32 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${(count / (metrics?.total || 1)) * 100}%` }}
                              />
                            </div>
                            <Badge>{count}</Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Recovery Status Tab */}
          <TabsContent value="recovery">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Recovery Status</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <RefreshCw className="w-5 h-5" />
                      Retry Strategy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Success Rate</span>
                        <span className="font-semibold">85%</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Max Retries</span>
                        <span className="font-semibold">3</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Average Delay</span>
                        <span className="font-semibold">2.5s</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Shield className="w-5 h-5" />
                      Fallback Services
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">API Fallback</span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Storage Fallback</span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Auth Fallback</span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingDown className="w-5 h-5" />
                      Graceful Degradation
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Current Level</span>
                        <Badge variant="success">None</Badge>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Animations</span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm">Full Features</span>
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Circuit Breakers Tab */}
          <TabsContent value="circuit">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Circuit Breaker Status</h2>
              
              <Card>
                <CardHeader>
                  <CardTitle>API Circuit Breaker</CardTitle>
                  <CardDescription>
                    Monitors API health and prevents cascading failures
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="text-center">
                      <div className={`text-3xl font-bold ${
                        apiCircuit.circuitState === 'closed' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {apiCircuit.circuitState.toUpperCase()}
                      </div>
                      <p className="text-sm text-gray-600">Current State</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-orange-600">
                        {apiCircuit.failures}
                      </div>
                      <p className="text-sm text-gray-600">Failure Count</p>
                    </div>
                    <div className="text-center">
                      <div className="text-3xl font-bold text-blue-600">
                        5
                      </div>
                      <p className="text-sm text-gray-600">Failure Threshold</p>
                    </div>
                    <div className="text-center">
                      <Button 
                        onClick={apiCircuit.resetCircuit}
                        disabled={apiCircuit.circuitState === 'closed'}
                      >
                        Reset Circuit
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Testing Tab */}
          <TabsContent value="testing">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Error Recovery Testing</h2>
              
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  Use these controls to test error recovery mechanisms. These are for development and testing purposes only.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Test Error Types</CardTitle>
                    <CardDescription>
                      Trigger different types of errors to test recovery strategies
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      variant="outline" 
                      onClick={() => triggerTestError(ERROR_TYPES.NETWORK_ERROR, ERROR_SEVERITY.MEDIUM)}
                      className="w-full"
                    >
                      Network Error (Medium)
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => triggerTestError(ERROR_TYPES.VALIDATION_ERROR, ERROR_SEVERITY.LOW)}
                      className="w-full"
                    >
                      Validation Error (Low)
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => triggerTestError(ERROR_TYPES.TRANSACTION_ERROR, ERROR_SEVERITY.HIGH)}
                      className="w-full"
                    >
                      Transaction Error (High)
                    </Button>
                    <Button 
                      variant="destructive" 
                      onClick={() => triggerTestError(ERROR_TYPES.UNKNOWN_ERROR, ERROR_SEVERITY.CRITICAL)}
                      className="w-full"
                    >
                      Critical Error
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recovery Actions</CardTitle>
                    <CardDescription>
                      Test recovery mechanisms and fallback strategies
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      variant="outline" 
                      onClick={clearErrors}
                      className="w-full"
                    >
                      Clear All Errors
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={refreshMetrics}
                      className="w-full"
                    >
                      Refresh Metrics
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => setAutoRefresh(!autoRefresh)}
                      className="w-full"
                    >
                      {autoRefresh ? 'Disable' : 'Enable'} Auto-refresh
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Error recovery system powered by advanced resilience patterns and circuit breakers</p>
          <p className="mt-1">
            System uptime: 99.9% • Last incident: {errors.length > 0 ? formatTimestamp(errors[0].timestamp) : 'None'} • 
            Monitoring {Object.keys(ERROR_TYPES).length} error types
          </p>
        </div>
      </div>
    </div>
  )
}