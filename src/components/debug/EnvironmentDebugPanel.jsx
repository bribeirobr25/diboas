/**
 * Development Debug Panel for Environment and Feature Flag Management
 * Only visible in development mode - helps developers understand current configuration
 */

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  Settings, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  Info, 
  AlertTriangle,
  CheckCircle,
  X
} from 'lucide-react'
import { getEnvironmentInfo, validateEnvironment } from '../../config/environments.js'
import { useFeatureFlagDebugger } from '../../hooks/useFeatureFlags.jsx'
import { FEATURE_FLAGS } from '../../config/featureFlags.js'

/**
 * Main debug panel component
 */
export default function EnvironmentDebugPanel() {
  const [isVisible, setIsVisible] = useState(false)
  const [activeTab, setActiveTab] = useState('environment')
  const envInfo = getEnvironmentInfo()
  const debugInfo = useFeatureFlagDebugger()

  // Only show in development
  if (!envInfo.debugMode) {
    return null
  }

  const validation = validateEnvironment()

  return (
    <>
      {/* Toggle Button */}
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(!isVisible)}
          className="rounded-full w-12 h-12 p-0 bg-blue-600 hover:bg-blue-700 text-white shadow-lg"
          title="Toggle Debug Panel"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>

      {/* Debug Panel */}
      {isVisible && (
        <div className="fixed bottom-20 right-4 w-96 max-h-96 bg-white border rounded-lg shadow-xl z-50 overflow-hidden">
          <div className="flex items-center justify-between p-3 bg-gray-50 border-b">
            <h3 className="font-semibold text-sm">Debug Panel</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsVisible(false)}
              className="h-6 w-6 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Validation Status */}
          {!validation.isValid && (
            <div className="p-3 bg-red-50 border-b border-red-200">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 text-red-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-red-800">Configuration Issues</p>
                  <ul className="text-xs text-red-700 mt-1">
                    {validation.issues.map((issue, index) => (
                      <li key={index}>• {issue}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex border-b">
            {['environment', 'features', 'api'].map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 px-3 py-2 text-xs font-medium capitalize ${
                  activeTab === tab
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-600 hover:text-gray-800'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-3 max-h-64 overflow-y-auto">
            {activeTab === 'environment' && (
              <EnvironmentTab envInfo={envInfo} validation={validation} />
            )}
            {activeTab === 'features' && (
              <FeatureFlagsTab debugInfo={debugInfo} />
            )}
            {activeTab === 'api' && (
              <ApiTab />
            )}
          </div>
        </div>
      )}
    </>
  )
}

/**
 * Environment information tab
 */
function EnvironmentTab({ envInfo, validation }) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2 text-xs">
        <div>
          <label className="font-medium text-gray-600">Environment:</label>
          <div className="flex items-center space-x-1">
            <Badge variant="outline" className="text-xs">
              {envInfo.environment}
            </Badge>
            {validation.isValid ? (
              <CheckCircle className="w-3 h-3 text-green-600" />
            ) : (
              <AlertTriangle className="w-3 h-3 text-red-600" />
            )}
          </div>
        </div>
        
        <div>
          <label className="font-medium text-gray-600">Region:</label>
          <Badge variant="outline" className="text-xs">{envInfo.region}</Badge>
        </div>
        
        <div>
          <label className="font-medium text-gray-600">Version:</label>
          <span className="text-xs">{envInfo.version}</span>
        </div>
        
        <div>
          <label className="font-medium text-gray-600">Debug Mode:</label>
          <span className="text-xs">{envInfo.debugMode ? 'On' : 'Off'}</span>
        </div>
        
        <div className="col-span-2">
          <label className="font-medium text-gray-600">API Base:</label>
          <div className="text-xs font-mono bg-gray-100 p-1 rounded truncate">
            {envInfo.baseUrl}
          </div>
        </div>
      </div>
      
      <div>
        <label className="font-medium text-gray-600 text-xs">Build Info:</label>
        <div className="text-xs text-gray-500">
          Built: {envInfo.buildTime || 'Development'}
        </div>
      </div>
    </div>
  )
}

/**
 * Feature flags information tab
 */
function FeatureFlagsTab({ debugInfo }) {
  if (!debugInfo) {
    return <div className="text-xs text-gray-500">Debug mode not available</div>
  }

  const { allFeatures, lastRefresh } = debugInfo

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-gray-600">
          Features ({Object.keys(allFeatures).length})
        </span>
        <div className="flex items-center space-x-2">
          <span className="text-xs text-gray-500">
            {lastRefresh}
          </span>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.reload()}
            className="h-6 w-6 p-0"
          >
            <RefreshCw className="w-3 h-3" />
          </Button>
        </div>
      </div>
      
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {Object.entries(allFeatures).map(([flag, enabled]) => (
          <div key={flag} className="flex items-center justify-between text-xs">
            <span className="font-mono truncate flex-1 mr-2">
              {flag.toLowerCase().replace(/_/g, ' ')}
            </span>
            <Badge 
              variant={enabled ? "default" : "secondary"}
              className="text-xs h-4"
            >
              {enabled ? 'ON' : 'OFF'}
            </Badge>
          </div>
        ))}
      </div>
      
      <div className="pt-2 border-t">
        <Button
          variant="outline"
          size="sm"
          onClick={() => debugInfo.logFeatures()}
          className="w-full text-xs h-6"
        >
          Log to Console
        </Button>
      </div>
    </div>
  )
}

/**
 * API configuration tab
 */
function ApiTab() {
  const envInfo = getEnvironmentInfo()
  const [testResults, setTestResults] = useState({})
  
  const testEndpoint = async (endpoint) => {
    setTestResults(prev => ({ ...prev, [endpoint]: 'testing' }))
    
    try {
      // Simulate API test
      await new Promise(resolve => setTimeout(resolve, 1000))
      const success = Math.random() > 0.3 // 70% success rate
      setTestResults(prev => ({ 
        ...prev, 
        [endpoint]: success ? 'success' : 'error' 
      }))
    } catch (_) {
      setTestResults(prev => ({ ...prev, [endpoint]: 'error' }))
    }
  }

  const endpoints = [
    { name: 'Health', path: '/health' },
    { name: 'Auth', path: '/auth/status' },
    { name: 'API', path: '/api/status' }
  ]

  return (
    <div className="space-y-3">
      <div>
        <label className="font-medium text-gray-600 text-xs">Base URL:</label>
        <div className="text-xs font-mono bg-gray-100 p-1 rounded break-all">
          {envInfo.baseUrl}
        </div>
      </div>
      
      <div>
        <label className="font-medium text-gray-600 text-xs">Endpoints:</label>
        <div className="space-y-1 mt-1">
          {endpoints.map((endpoint) => (
            <div key={endpoint.name} className="flex items-center justify-between">
              <span className="text-xs">{endpoint.name}</span>
              <div className="flex items-center space-x-2">
                {testResults[endpoint.name] === 'testing' && (
                  <RefreshCw className="w-3 h-3 animate-spin text-blue-500" />
                )}
                {testResults[endpoint.name] === 'success' && (
                  <CheckCircle className="w-3 h-3 text-green-500" />
                )}
                {testResults[endpoint.name] === 'error' && (
                  <X className="w-3 h-3 text-red-500" />
                )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => testEndpoint(endpoint.name)}
                  className="text-xs h-5 px-2"
                  disabled={testResults[endpoint.name] === 'testing'}
                >
                  Test
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}