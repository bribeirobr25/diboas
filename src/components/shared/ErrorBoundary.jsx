import React from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import diBoaSLogo from '../../assets/diboas-logo.png'

/**
 * Error Boundary component to catch and handle React component errors
 * Prevents the entire application from crashing due to component errors
 */
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    
    this.setState({
      error: error,
      errorInfo: errorInfo
    })

    // In a real app, you would log this to an error reporting service
    this.logErrorToService(error, errorInfo)
  }

  logErrorToService = (error, errorInfo) => {
    // Simulate error logging to external service
    const errorData = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href,
      retryCount: this.state.retryCount
    }

    // In production, send to error monitoring service like Sentry
    console.warn('Error logged:', errorData)
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

  render() {
    if (this.state.hasError) {
      const { error } = this.state
      const isDevelopment = process.env.NODE_ENV === 'development'

      return (
        <div className="main-layout center-content" style={{ padding: '2rem', minHeight: '100vh' }}>
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <img src={diBoaSLogo} alt="diBoaS Logo" className="h-12 w-auto mx-auto mb-4" />
              <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
              <CardTitle className="text-xl font-bold text-gray-900">
                Oops! Something went wrong
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <p className="text-gray-600 text-center">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>

              {isDevelopment && error && (
                <div className="bg-red-50 border border-red-200 rounded p-3">
                  <h4 className="font-medium text-red-800 mb-2">Development Error Details:</h4>
                  <pre className="text-xs text-red-700 overflow-auto max-h-32">
                    {error.message}
                  </pre>
                </div>
              )}

              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <Button 
                  onClick={this.handleRetry}
                  className="flex-1 primary-button"
                  disabled={this.state.retryCount >= 3}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {this.state.retryCount >= 3 ? 'Max Retries Reached' : 'Try Again'}
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="flex-1"
                >
                  <Home className="w-4 h-4 mr-2" />
                  Go Home
                </Button>
              </div>

              {this.state.retryCount > 0 && (
                <p className="text-sm text-gray-500 text-center">
                  Retry attempt: {this.state.retryCount}/3
                </p>
              )}
              
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-gray-500">
                  If this problem persists, please contact support.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

/**
 * Higher-order component to wrap components with error boundary
 */
export function withErrorBoundary(Component, fallback = null) {
  return function WrappedComponent(props) {
    return (
      <ErrorBoundary fallback={fallback}>
        <Component {...props} />
      </ErrorBoundary>
    )
  }
}

/**
 * Hook to manually trigger error boundary (for functional components)
 */
export function useErrorHandler() {
  return (error, errorInfo) => {
    // This would ideally trigger the error boundary
    // For now, we'll just log and potentially redirect
    console.error('Manual error trigger:', error, errorInfo)
    
    // In a real implementation, you might dispatch to a global error state
    // or use a library like react-error-boundary
  }
}

export default ErrorBoundary