import React from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'
import diBoaSLogo from '../../assets/diboas-logo.png'
import logger from '../../utils/logger'

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

  static getDerivedStateFromError(_) {
    // Update state so the next render will show the fallback UI
    return { hasError: true }
  }

  componentDidCatch(error, errorInfo) {
    // Log error details for debugging
    logger.error('ErrorBoundary caught an error:', error, errorInfo)
    
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
    logger.warn('Error logged:', errorData)
  }

  handleRetry = () => {
    logger.debug('🔄 ErrorBoundary: Retry button clicked, attempting to recover...')
    
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }), () => {
      // Callback after state update to ensure clean recovery
      logger.debug('✅ ErrorBoundary: State reset complete, retry count:', this.state.retryCount)
      
      // Small delay to ensure React processes the state change
      setTimeout(() => {
        this.forceUpdate()
      }, 10)
    })
  }

  handleGoHome = () => {
    // CRITICAL FIX: Use React Router navigation instead of window.location
    // to prevent data loss from full page reload
    
    // Determine appropriate destination based on current location
    const currentPath = window.location.pathname
    let destination = '/app' // default
    
    if (currentPath === '/' || currentPath === '/auth') {
      destination = '/auth' // Go back to auth if we're on landing or auth pages
    }
    
    if (this.props.navigate) {
      this.props.navigate(destination)
    } else {
      // Fallback: dispatch a custom event that App.jsx can listen to
      window.dispatchEvent(new CustomEvent('diboas-navigate-home', { 
        detail: { destination } 
      }))
    }
  }

  render() {
    if (this.state.hasError) {
      const { error } = this.state
      const isDevelopment = typeof process !== 'undefined' && process?.env?.NODE_ENV === 'development'

      return (
        <div className="error-boundary-container">
          <Card className="error-boundary-card">
            <CardHeader className="error-boundary-header">
              <img src={diBoaSLogo} alt="diBoaS Logo" className="error-boundary-logo" />
              <AlertTriangle className="error-boundary-icon" />
              <CardTitle className="error-boundary-title">
                Oops! Something went wrong
              </CardTitle>
            </CardHeader>
            
            <CardContent className="error-boundary-content">
              <p className="error-boundary-message">
                We encountered an unexpected error. Don't worry, your data is safe.
              </p>

              {isDevelopment && error && (
                <div className="development-error-panel">
                  <h4 className="development-error-title">Development Error Details:</h4>
                  <pre className="development-error-details">
                    {error.message}
                  </pre>
                </div>
              )}

              <div className="error-boundary-actions">
                <Button 
                  onClick={this.handleRetry}
                  className="action-button-full primary-button"
                  disabled={this.state.retryCount >= 3}
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {this.state.retryCount >= 3 ? 'Max Retries Reached' : 'Try Again'}
                </Button>
                
                <Button 
                  onClick={this.handleGoHome}
                  variant="outline"
                  className="action-button-full"
                >
                  <Home className="w-4 h-4 mr-2" />
                  {window.location.pathname === '/' || window.location.pathname === '/auth' ? 'Back to Login' : 'Back to Dashboard'}
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
    logger.error('Manual error trigger:', error, errorInfo)
    
    // In a real implementation, you might dispatch to a global error state
    // or use a library like react-error-boundary
  }
}

export default ErrorBoundary