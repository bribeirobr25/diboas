/**
 * Admin Dashboard
 * Internal dashboard for monitoring and system administration
 * Accessible only via /admin route - not visible to regular users
 */

import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Card } from '@/components/ui/card.jsx'
import { cn } from '@/lib/utils'
import {
  Shield,
  Activity,
  AlertTriangle,
  BarChart3,
  Settings,
  Users,
  Database,
  Globe,
  Lock,
  TrendingUp
} from 'lucide-react'

export default function AdminDashboard() {
  const [systemStatus, setSystemStatus] = useState({
    performance: 'healthy',
    security: 'secure',
    errors: 'minimal',
    uptime: '99.9%'
  })

  useEffect(() => {
    // In a real app, this would fetch actual system metrics
    const updateSystemStatus = () => {
      setSystemStatus({
        performance: Math.random() > 0.1 ? 'healthy' : 'warning',
        security: Math.random() > 0.05 ? 'secure' : 'alert',
        errors: Math.random() > 0.15 ? 'minimal' : 'elevated',
        uptime: `${(99.5 + Math.random() * 0.5).toFixed(1)}%`
      })
    }

    updateSystemStatus()
    const interval = setInterval(updateSystemStatus, 30000) // Update every 30 seconds

    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'secure':
      case 'minimal':
        return 'text-green-600 bg-green-100'
      case 'warning':
      case 'elevated':
        return 'text-yellow-600 bg-yellow-100'
      case 'alert':
        return 'text-red-600 bg-red-100'
      default:
        return 'text-gray-600 bg-gray-100'
    }
  }

  const monitoringTools = [
    {
      title: 'Performance Monitoring',
      description: 'Real-time performance metrics, Core Web Vitals, and system health',
      path: '/admin/performance',
      icon: Activity,
      status: systemStatus.performance,
      color: 'bg-blue-50 border-blue-200'
    },
    {
      title: 'Security Dashboard',
      description: 'Security monitoring, threat detection, and audit logs',
      path: '/admin/security',
      icon: Shield,
      status: systemStatus.security,
      color: 'bg-green-50 border-green-200'
    },
    {
      title: 'Error Recovery',
      description: 'Error tracking, recovery strategies, and system diagnostics',
      path: '/admin/errors',
      icon: AlertTriangle,
      status: systemStatus.errors,
      color: 'bg-orange-50 border-orange-200'
    }
  ]

  const systemStats = [
    { label: 'System Uptime', value: systemStatus.uptime, icon: TrendingUp },
    { label: 'Active Users', value: '2,431', icon: Users },
    { label: 'API Requests/min', value: '1,247', icon: BarChart3 },
    { label: 'Database Health', value: 'Optimal', icon: Database }
  ]

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <Settings className="w-8 h-8 mr-3 text-purple-600" />
                OneFi Admin Dashboard
              </h1>
              <p className="text-gray-600 mt-2">
                Internal monitoring and system administration
              </p>
            </div>
            <div className="flex items-center space-x-2 px-4 py-2 bg-purple-100 rounded-lg">
              <Lock className="w-4 h-4 text-purple-600" />
              <span className="text-sm font-medium text-purple-800">Internal Access Only</span>
            </div>
          </div>
        </div>

        {/* System Status Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {systemStats.map((stat, index) => (
            <Card key={index} className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900 mt-1">{stat.value}</p>
                </div>
                <div className="p-3 bg-purple-100 rounded-lg">
                  <stat.icon className="w-6 h-6 text-purple-600" />
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Monitoring Tools */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 flex items-center">
            <Globe className="w-5 h-5 mr-2" />
            Monitoring Tools
          </h2>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {monitoringTools.map((tool, index) => (
              <Card key={index} className={cn('p-6 hover:shadow-lg transition-shadow', tool.color)}>
                <div className="flex items-start justify-between mb-4">
                  <div className="p-3 bg-white rounded-lg shadow-sm">
                    <tool.icon className="w-6 h-6 text-gray-700" />
                  </div>
                  <span className={cn(
                    'px-2 py-1 text-xs font-medium rounded-full',
                    getStatusColor(tool.status)
                  )}>
                    {tool.status}
                  </span>
                </div>
                
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {tool.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {tool.description}
                </p>
                
                <Link
                  to={tool.path}
                  className="inline-flex items-center px-4 py-2 bg-white text-gray-700 rounded-lg hover:bg-gray-50 transition-colors border border-gray-200 text-sm font-medium"
                >
                  Open Dashboard
                  <BarChart3 className="w-4 h-4 ml-2" />
                </Link>
              </Card>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <Card className="p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-sm font-medium text-gray-900">System Health Check</div>
              <div className="text-xs text-gray-600 mt-1">Run comprehensive diagnostics</div>
            </button>
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-sm font-medium text-gray-900">Clear Cache</div>
              <div className="text-xs text-gray-600 mt-1">Clear all system caches</div>
            </button>
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-sm font-medium text-gray-900">Export Logs</div>
              <div className="text-xs text-gray-600 mt-1">Download system logs</div>
            </button>
            <button className="p-4 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="text-sm font-medium text-gray-900">Update Config</div>
              <div className="text-xs text-gray-600 mt-1">Modify system configuration</div>
            </button>
          </div>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <p>
            🔒 This is an internal admin dashboard. 
            Access is restricted to authorized personnel only.
          </p>
          <p className="mt-1">
            For user-facing features, return to{' '}
            <Link to="/app" className="text-purple-600 hover:text-purple-800 underline">
              main application
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}