/**
 * Security Dashboard Component
 * Comprehensive security monitoring dashboard with threat detection, compliance, and audit trails
 */

import { useState, useEffect, useMemo } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { useSecurityDashboard, useSecurityMetrics, useComplianceMonitoring } from '../../hooks/useSecurityMonitoring.jsx'
import { THREAT_TYPES, SECURITY_LEVELS } from '../../services/monitoring/SecurityMonitoringService.js'
import logger from '../../utils/logger'
import {
  Shield,
  AlertTriangle,
  Lock,
  Eye,
  FileCheck,
  Activity,
  Users,
  BarChart3,
  TrendingUp,
  TrendingDown,
  AlertCircle,
  CheckCircle,
  RefreshCw,
  Download,
  Settings,
  Zap,
  Target,
  Globe,
  Database,
  Bug,
  UserX,
  Clock,
  Info,
  X
} from 'lucide-react'
import PageHeader from '../shared/PageHeader.jsx'

export default function SecurityDashboard() {
  const { dashboard, isLoading, error, refreshDashboard, resolveThreat, acknowledgeAlert } = useSecurityDashboard(5000)
  const { metrics, refreshMetrics } = useSecurityMetrics()
  const { complianceData, runComplianceCheck } = useComplianceMonitoring()
  const [selectedTimeframe, setSelectedTimeframe] = useState('24h')
  const [autoRefresh, setAutoRefresh] = useState(true)

  const timeframes = {
    '1h': 60 * 60 * 1000,
    '6h': 6 * 60 * 60 * 1000,
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000
  }

  // Calculate security health
  const securityHealth = useMemo(() => {
    if (!dashboard) return { score: 0, status: 'unknown', color: 'text-gray-600' }

    const score = dashboard.securityScore || 0
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
  }, [dashboard])

  const getThreatIcon = (threatType) => {
    const icons = {
      [THREAT_TYPES.SQL_INJECTION]: <Database className="w-4 h-4" />,
      [THREAT_TYPES.XSS_ATTEMPT]: <Bug className="w-4 h-4" />,
      [THREAT_TYPES.BRUTE_FORCE]: <UserX className="w-4 h-4" />,
      [THREAT_TYPES.ANOMALY_DETECTED]: <Activity className="w-4 h-4" />,
      [THREAT_TYPES.RATE_LIMIT_EXCEEDED]: <Zap className="w-4 h-4" />,
      [THREAT_TYPES.UNAUTHORIZED_ACCESS]: <Lock className="w-4 h-4" />
    }
    return icons[threatType] || <AlertTriangle className="w-4 h-4" />
  }

  const getThreatColor = (severity) => {
    const colors = {
      [SECURITY_LEVELS.CRITICAL]: 'bg-red-100 text-red-800 border-red-200',
      [SECURITY_LEVELS.HIGH]: 'bg-orange-100 text-orange-800 border-orange-200',
      [SECURITY_LEVELS.MEDIUM]: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      [SECURITY_LEVELS.LOW]: 'bg-blue-100 text-blue-800 border-blue-200',
      [SECURITY_LEVELS.INFO]: 'bg-gray-100 text-gray-800 border-gray-200'
    }
    return colors[severity] || colors[SECURITY_LEVELS.INFO]
  }

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString()
  }

  const handleResolveThreat = async (threatId) => {
    try {
      await resolveThreat(threatId, {
        resolvedBy: 'admin',
        action: 'manual_resolution',
        timestamp: Date.now()
      })
      logger.info(`Threat ${threatId} resolved`)
    } catch (error) {
      logger.error('Failed to resolve threat:', error)
    }
  }

  const handleAcknowledgeAlert = async (alertId) => {
    try {
      await acknowledgeAlert(alertId)
      logger.info(`Alert ${alertId} acknowledged`)
    } catch (error) {
      logger.error('Failed to acknowledge alert:', error)
    }
  }

  if (isLoading) {
    return (
      <div className="main-layout">
        <PageHeader showUserActions={true} />
        <div className="page-container">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
            <p className="text-gray-600 ml-3">Loading security dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="main-layout">
        <PageHeader showUserActions={true} />
        <div className="page-container">
          <div className="text-center py-12">
            <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Security Dashboard</h2>
            <p className="text-gray-600 mb-4">{error}</p>
            <Button onClick={refreshDashboard}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
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
                Security Dashboard
              </h1>
              <p className="text-lg text-gray-600">
                Real-time security monitoring, threat detection, and compliance tracking
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
                onClick={refreshDashboard}
                disabled={isLoading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => {}}>
                <Download className="w-4 h-4 mr-2" />
                Export Report
              </Button>
            </div>
          </div>
        </div>

        {/* Security Health Score */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Security Health Score</h3>
                  <div className="flex items-center gap-4">
                    <div className={`text-4xl font-bold ${securityHealth.color}`}>
                      {securityHealth.score}
                    </div>
                    <div>
                      <p className={`text-xl font-semibold capitalize ${securityHealth.color}`}>
                        {securityHealth.status}
                      </p>
                      <p className="text-gray-600">System Security</p>
                    </div>
                  </div>
                  <Progress value={securityHealth.score} className="mt-4 w-64" />
                </div>
                <div className="text-center">
                  <Shield className={`w-16 h-16 mx-auto mb-2 ${securityHealth.color}`} />
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
              <AlertTriangle className="w-8 h-8 text-red-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Active Threats</p>
              <p className="text-2xl font-bold text-red-600">
                {dashboard?.threatStats?.total || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Eye className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Security Alerts</p>
              <p className="text-2xl font-bold text-orange-600">
                {dashboard?.recentAlerts?.length || 0}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <FileCheck className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Compliance Score</p>
              <p className="text-2xl font-bold text-blue-600">
                {complianceData ? 
                  Math.round(Object.values(complianceData).reduce((sum, c) => sum + c.score, 0) / Object.keys(complianceData).length) 
                  : 0}%
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Risk Level</p>
              <p className={`text-2xl font-bold capitalize ${dashboard?.riskProfile?.overall === 'low' ? 'text-green-600' : 
                dashboard?.riskProfile?.overall === 'medium' ? 'text-yellow-600' : 'text-red-600'}`}>
                {dashboard?.riskProfile?.overall || 'Unknown'}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <Activity className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <p className="text-sm text-gray-600">Resolved Issues</p>
              <p className="text-2xl font-bold text-purple-600">
                {dashboard?.threatStats?.resolved || 0}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Critical Alerts */}
        {dashboard?.recentAlerts && dashboard.recentAlerts.filter(a => a.level === SECURITY_LEVELS.CRITICAL).length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              Critical Security Alerts
            </h2>
            <div className="space-y-3">
              {dashboard.recentAlerts
                .filter(alert => alert.level === SECURITY_LEVELS.CRITICAL)
                .slice(0, 3)
                .map((alert, index) => (
                  <Card key={alert.id || index} className="border-l-4 border-red-500 bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3">
                          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
                          <div>
                            <h4 className="font-semibold text-red-800">{alert.title}</h4>
                            <p className="text-sm text-red-700 mt-1">{alert.message}</p>
                            <p className="text-xs text-red-600 mt-2">
                              {formatTimestamp(alert.timestamp)}
                            </p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => handleAcknowledgeAlert(alert.id)}
                            disabled={alert.acknowledged}
                          >
                            {alert.acknowledged ? 'Acknowledged' : 'Acknowledge'}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
              ))}
            </div>
          </div>
        )}

        {/* Main Dashboard Tabs */}
        <Tabs defaultValue="threats" className="space-y-6">
          <TabsList className="grid grid-cols-6 w-full">
            <TabsTrigger value="threats" className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Threats
            </TabsTrigger>
            <TabsTrigger value="compliance" className="flex items-center gap-2">
              <FileCheck className="w-4 h-4" />
              Compliance
            </TabsTrigger>
            <TabsTrigger value="audit" className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              Audit Trail
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4" />
              Analytics
            </TabsTrigger>
            <TabsTrigger value="alerts" className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4" />
              Alerts
            </TabsTrigger>
            <TabsTrigger value="recommendations" className="flex items-center gap-2">
              <Target className="w-4 h-4" />
              Recommendations
            </TabsTrigger>
          </TabsList>

          {/* Threats Tab */}
          <TabsContent value="threats">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Security Threats</h2>
                <Badge className="bg-red-100 text-red-800">
                  {dashboard?.recentThreats?.length || 0} Active
                </Badge>
              </div>

              {dashboard?.recentThreats && dashboard.recentThreats.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {dashboard.recentThreats.map((threat, index) => (
                    <Card key={threat.id || index} className={`border-l-4 ${getThreatColor(threat.severity)}`}>
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            {getThreatIcon(threat.type)}
                            <CardTitle className="text-lg">{threat.type.replace(/_/g, ' ').toUpperCase()}</CardTitle>
                          </div>
                          <Badge className={getThreatColor(threat.severity)}>
                            {threat.severity}
                          </Badge>
                        </div>
                        <CardDescription>
                          Impact Score: {threat.impact?.overall || 0}% • {formatTimestamp(threat.timestamp)}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <p className="text-sm font-medium">Source:</p>
                            <p className="text-sm text-gray-600">{threat.source || 'Unknown'}</p>
                          </div>
                          <div>
                            <p className="text-sm font-medium">Target:</p>
                            <p className="text-sm text-gray-600">{threat.target || 'Unknown'}</p>
                          </div>
                          {threat.details && (
                            <div>
                              <p className="text-sm font-medium">Details:</p>
                              <p className="text-sm text-gray-600">
                                {JSON.stringify(threat.details).substring(0, 100)}...
                              </p>
                            </div>
                          )}
                          <div className="flex gap-2 mt-4">
                            <Button 
                              size="sm" 
                              variant={threat.resolved ? "outline" : "default"}
                              onClick={() => handleResolveThreat(threat.id)}
                              disabled={threat.resolved}
                            >
                              {threat.resolved ? 'Resolved' : 'Resolve'}
                            </Button>
                            <Button size="sm" variant="outline">
                              Investigate
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Shield className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Threats</h3>
                  <p className="text-gray-600">Your system is secure. No threats detected in the selected timeframe.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Compliance Tab */}
          <TabsContent value="compliance">
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold">Compliance Status</h2>
                <Button onClick={() => runComplianceCheck()}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Run Check
                </Button>
              </div>

              {complianceData ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {Object.entries(complianceData).map(([type, compliance]) => (
                    <Card key={type}>
                      <CardHeader>
                        <CardTitle className="flex items-center justify-between">
                          <span>{compliance.name}</span>
                          <Badge className={compliance.score >= 80 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                            {compliance.score}%
                          </Badge>
                        </CardTitle>
                        <CardDescription>
                          Last checked: {compliance.lastCheck ? formatTimestamp(compliance.lastCheck) : 'Never'}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <Progress value={compliance.score} className="mb-4" />
                        <div className="space-y-2">
                          {Object.entries(compliance.checks).map(([check, enabled]) => (
                            <div key={check} className="flex items-center justify-between">
                              <span className="text-sm capitalize">{check.replace(/([A-Z])/g, ' $1').trim()}</span>
                              {enabled ? (
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              ) : (
                                <X className="w-4 h-4 text-red-500" />
                              )}
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <FileCheck className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-lg text-gray-600">Loading compliance data...</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Security Analytics</h2>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Threat Statistics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Threat Distribution</CardTitle>
                    <CardDescription>Threats by type over the selected period</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {dashboard?.threatStats?.byType && Object.entries(dashboard.threatStats.byType).map(([type, count]) => (
                        <div key={type} className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {getThreatIcon(type)}
                            <span className="text-sm capitalize">{type.replace(/_/g, ' ')}</span>
                          </div>
                          <Badge>{count}</Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Security Metrics */}
                <Card>
                  <CardHeader>
                    <CardTitle>Security Metrics</CardTitle>
                    <CardDescription>Key security indicators</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between">
                        <span>Security Score</span>
                        <span className="font-semibold">{dashboard?.securityScore || 0}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Risk Level</span>
                        <span className={`font-semibold capitalize ${
                          dashboard?.riskProfile?.overall === 'low' ? 'text-green-600' : 
                          dashboard?.riskProfile?.overall === 'medium' ? 'text-yellow-600' : 'text-red-600'
                        }`}>
                          {dashboard?.riskProfile?.overall || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Threats</span>
                        <span className="font-semibold">{dashboard?.threatStats?.total || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Resolved Threats</span>
                        <span className="font-semibold text-green-600">{dashboard?.threatStats?.resolved || 0}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Security Alerts</h2>

              {dashboard?.recentAlerts && dashboard.recentAlerts.length > 0 ? (
                <div className="space-y-4">
                  {dashboard.recentAlerts.map((alert, index) => (
                    <Card key={alert.id || index} className={`border-l-4 ${getThreatColor(alert.level)}`}>
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 mt-0.5" />
                            <div>
                              <h4 className="font-semibold">{alert.title}</h4>
                              <p className="text-sm text-gray-600 mt-1">{alert.message}</p>
                              <p className="text-xs text-gray-500 mt-2">
                                {formatTimestamp(alert.timestamp)}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge className={getThreatColor(alert.level)}>
                              {alert.level}
                            </Badge>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => handleAcknowledgeAlert(alert.id)}
                              disabled={alert.acknowledged}
                            >
                              {alert.acknowledged ? 'Acknowledged' : 'Acknowledge'}
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Alerts</h3>
                  <p className="text-gray-600">All systems are running normally.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Recommendations Tab */}
          <TabsContent value="recommendations">
            <div className="space-y-6">
              <h2 className="text-2xl font-bold">Security Recommendations</h2>

              {dashboard?.recommendations && dashboard.recommendations.length > 0 ? (
                <div className="space-y-4">
                  {dashboard.recommendations.map((rec, index) => (
                    <Card key={index}>
                      <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                          <div>
                            <div className="flex items-center gap-2 mb-2">
                              <Target className="w-5 h-5 text-blue-500" />
                              <h4 className="font-semibold">{rec.title}</h4>
                              <Badge className={rec.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'}>
                                {rec.priority}
                              </Badge>
                            </div>
                            <p className="text-gray-600 mb-3">{rec.description}</p>
                            <p className="text-sm text-gray-500">Category: {rec.category}</p>
                          </div>
                          <Button size="sm">
                            Implement
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">No Recommendations</h3>
                  <p className="text-gray-600">Your security posture is optimal.</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Footer */}
        <div className="mt-12 text-center text-sm text-gray-500">
          <p>Security monitoring powered by advanced threat detection and compliance analysis</p>
          <p className="mt-1">
            Last scan: {dashboard?.lastUpdated ? new Date(dashboard.lastUpdated).toLocaleString() : 'Never'} • 
            Monitoring {Object.keys(complianceData || {}).length} compliance frameworks
          </p>
        </div>
      </div>
    </div>
  )
}