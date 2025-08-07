/**
 * Yield Error Boundary Component
 * Gracefully handles crashes in yield-related components
 * Provides user-friendly error messages and recovery options
 */

import React from 'react'
import { AlertTriangle, RefreshCw, Home, ArrowLeft } from 'lucide-react'
import { Button } from '../ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.jsx'
import { Badge } from '../ui/badge.jsx'
import logger from '../../utils/logger'

class YieldErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      errorId: `yield_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details
    const errorDetails = {
      error: error.toString(),
      errorInfo: errorInfo.componentStack,
      location: 'YieldErrorBoundary',
      timestamp: new Date().toISOString(),
      errorId: this.state.errorId,
      url: window.location.href,
      userAgent: navigator.userAgent,
      retryCount: this.state.retryCount
    }

    // Check for common import errors
    if (error.message && error.message.includes('is not defined')) {
      const missingImport = this.detectMissingImport(error.message)
      if (missingImport) {
        errorDetails.missingImport = missingImport
        errorDetails.errorType = 'missing_import'
      }
    }

    logger.error('Yield component error boundary triggered', errorDetails)

    this.setState({
      error,
      errorInfo,
      ...errorDetails
    })

    // Report to error tracking service if available
    if (window.reportError) {
      window.reportError(error, errorDetails)
    }
  }

  detectMissingImport(errorMessage) {
    const reactHooks = [
      'useState', 'useEffect', 'useContext', 'useReducer', 'useCallback', 
      'useMemo', 'useRef', 'useLayoutEffect', 'useImperativeHandle'
    ]
    
    const routerHooks = [
      'useNavigate', 'useLocation', 'useParams', 'useSearchParams'
    ]

    for (const hook of reactHooks) {
      if (errorMessage.includes(`${hook} is not defined`)) {
        return { hook, library: 'react' }
      }
    }

    for (const hook of routerHooks) {
      if (errorMessage.includes(`${hook} is not defined`)) {
        return { hook, library: 'react-router-dom' }
      }
    }

    return null
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }))
  }

  handleGoHome = () => {
    window.location.href = '/'
  }

  handleGoBack = () => {
    if (window.history.length > 1) {
      window.history.back()
    } else {
      window.location.href = '/category/yield'
    }
  }

  render() {
    if (this.state.hasError) {
      const { error, missingImport, retryCount } = this.state
      const isDevelopment = process.env.NODE_ENV === 'development'

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-2xl">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <AlertTriangle className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-2xl text-red-800">
                Oops! Something went wrong
              </CardTitle>
              <p className="text-gray-600 mt-2">
                We encountered an unexpected error in the yield management system.
              </p>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Type Badge */}
              {missingImport && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      Development Issue
                    </Badge>
                  </div>
                  <p className="text-sm text-yellow-800 mb-2">
                    <strong>Missing Import Detected:</strong> The component is trying to use 
                    <code className="mx-1 px-1 bg-yellow-100 rounded">{missingImport.hook}</code>
                    but it's not imported from 
                    <code className="mx-1 px-1 bg-yellow-100 rounded">{missingImport.library}</code>
                  </p>
                  <p className="text-xs text-yellow-700">
                    💡 Fix: Add <code>{missingImport.hook}</code> to your {missingImport.library} import statement
                  </p>
                </div>
              )}

              {/* Error ID for support */}
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500">
                  Error ID: <code className="bg-gray-100 px-1 rounded">{this.state.errorId}</code>
                </p>
                {retryCount > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Retry attempts: {retryCount}
                  </p>
                )}
              </div>

              {/* Development Details */}
              {isDevelopment && error && (
                <details className="bg-gray-50 rounded-lg p-4">
                  <summary className="cursor-pointer text-sm font-medium text-gray-700 mb-2">
                    🔍 Developer Details (Development Mode)
                  </summary>
                  <div className="text-xs text-gray-600 space-y-2">
                    <div>
                      <strong>Error:</strong>
                      <pre className="mt-1 bg-gray-100 p-2 rounded text-xs overflow-auto">
                        {error.toString()}
                      </pre>
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Component Stack:</strong>
                        <pre className="mt-1 bg-gray-100 p-2 rounded text-xs overflow-auto">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                  disabled={retryCount >= 3}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {retryCount >= 3 ? 'Max Retries Reached' : 'Try Again'}
                </Button>
                
                <Button 
                  onClick={this.handleGoBack}
                  variant="outline"
                  className="flex-1"
                >
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Go Back
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Home
                </Button>
              </div>

              {/* Help Text */}
              <div className="text-center text-sm text-gray-500 border-t pt-4">
                If this error persists, please contact support with the Error ID above.
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default YieldErrorBoundary