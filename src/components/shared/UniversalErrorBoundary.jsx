/**
 * Universal Error Boundary
 * Comprehensive error boundary with recovery mechanisms and user-friendly fallbacks
 * Prevents crashes and provides graceful degradation for any React component
 */

import React from 'react'
import { AlertTriangle, RefreshCw, Home, Bug, ChevronDown, ChevronUp } from 'lucide-react'
import { Button } from '../ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.jsx'
import logger from '../../utils/logger'

// Error severity levels
const ERROR_SEVERITY = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  CRITICAL: 'critical'
}

// Error categories for better handling
const ERROR_CATEGORIES = {
  RENDER: 'render',
  NETWORK: 'network',
  PERMISSION: 'permission',
  DATA: 'data',
  BUSINESS_LOGIC: 'business_logic',
  EXTERNAL_SERVICE: 'external_service'
}

class UniversalErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      showDetails: false,
      isRetrying: false,
      errorSeverity: ERROR_SEVERITY.MEDIUM,
      errorCategory: ERROR_CATEGORIES.RENDER,
      userMessage: null,
      recoveryOptions: []
    }
    
    this.maxRetries = props.maxRetries || 3
    this.autoRetryDelay = props.autoRetryDelay || 5000
    this.enableAutoRetry = props.enableAutoRetry !== false
    this.showErrorDetails = props.showErrorDetails !== false
    this.onError = props.onError || (() => {})
    this.fallbackComponent = props.fallbackComponent || null
  }

  static getDerivedStateFromError(error) {
    // Update state so the next render will show the fallback UI
    return {
      hasError: true,
      error,
      errorId: `error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error, errorInfo) {
    const errorDetails = this.analyzeError(error, errorInfo)
    
    this.setState({
      errorInfo,
      ...errorDetails
    })

    // Log error with detailed information
    logger.error('UniversalErrorBoundary: Component error caught:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      errorId: this.state.errorId,
      props: this.sanitizeProps(),
      ...errorDetails
    })

    // Call custom error handler if provided
    this.onError(error, errorInfo, errorDetails)

    // Auto-retry for recoverable errors
    if (this.enableAutoRetry && errorDetails.isRecoverable && this.state.retryCount < this.maxRetries) {
      this.scheduleAutoRetry()
    }
  }

  /**
   * Analyze error to determine severity, category, and recovery options
   */
  analyzeError(error, errorInfo) {
    let severity = ERROR_SEVERITY.MEDIUM
    let category = ERROR_CATEGORIES.RENDER
    let isRecoverable = true
    let userMessage = 'Something went wrong. Please try again.'
    let recoveryOptions = ['retry', 'refresh']

    const errorMessage = error?.message || ''
    const componentStack = errorInfo?.componentStack || ''

    // Analyze error type and context
    if (errorMessage.includes('ChunkLoadError') || errorMessage.includes('Loading chunk')) {
      category = ERROR_CATEGORIES.NETWORK
      severity = ERROR_SEVERITY.MEDIUM
      userMessage = 'Failed to load application resources. Please refresh the page.'
      recoveryOptions = ['refresh', 'retry']
    }
    else if (errorMessage.includes('NetworkError') || errorMessage.includes('fetch')) {
      category = ERROR_CATEGORIES.NETWORK
      severity = ERROR_SEVERITY.MEDIUM
      userMessage = 'Network connection problem. Please check your internet connection.'
      recoveryOptions = ['retry', 'refresh']
    }
    else if (errorMessage.includes('Permission denied') || errorMessage.includes('403')) {
      category = ERROR_CATEGORIES.PERMISSION
      severity = ERROR_SEVERITY.HIGH
      userMessage = 'You don\'t have permission to access this feature.'
      recoveryOptions = ['home', 'refresh']
      isRecoverable = false
    }
    else if (errorMessage.includes('JSON.parse') || errorMessage.includes('SyntaxError')) {
      category = ERROR_CATEGORIES.DATA
      severity = ERROR_SEVERITY.HIGH
      userMessage = 'Data corruption detected. Please refresh the page.'
      recoveryOptions = ['refresh', 'home']
    }
    else if (errorMessage.includes('Cannot read property') || errorMessage.includes('undefined')) {
      category = ERROR_CATEGORIES.BUSINESS_LOGIC
      severity = ERROR_SEVERITY.HIGH
      userMessage = 'Application error detected. Please try refreshing the page.'
      recoveryOptions = ['retry', 'refresh', 'home']
    }
    else if (componentStack.includes('Transaction') || componentStack.includes('Payment')) {
      category = ERROR_CATEGORIES.BUSINESS_LOGIC
      severity = ERROR_SEVERITY.CRITICAL
      userMessage = 'Critical error in financial operation. Please contact support if this persists.'
      recoveryOptions = ['home', 'refresh']
    }
    else if (componentStack.includes('Auth') || componentStack.includes('Login')) {
      category = ERROR_CATEGORIES.PERMISSION
      severity = ERROR_SEVERITY.HIGH
      userMessage = 'Authentication error. Please log in again.'
      recoveryOptions = ['login', 'home']
    }

    return {
      errorSeverity: severity,
      errorCategory: category,
      isRecoverable,
      userMessage,
      recoveryOptions
    }
  }

  /**
   * Sanitize props for logging (remove sensitive data)
   */
  sanitizeProps() {
    const props = { ...this.props }
    
    // Remove potentially sensitive data
    const sensitiveKeys = ['password', 'token', 'key', 'secret', 'auth', 'credential']
    
    Object.keys(props).forEach(key => {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        props[key] = '***REDACTED***'
      }
    })
    
    return props
  }

  /**
   * Schedule automatic retry for recoverable errors
   */
  scheduleAutoRetry() {
    setTimeout(() => {
      if (this.state.retryCount < this.maxRetries) {
        this.handleRetry()
      }
    }, this.autoRetryDelay)
  }

  /**
   * Handle retry attempt
   */
  handleRetry = () => {
    this.setState(prevState => ({
      isRetrying: true,
      retryCount: prevState.retryCount + 1
    }))

    logger.info('UniversalErrorBoundary: Attempting retry:', {
      errorId: this.state.errorId,
      retryCount: this.state.retryCount + 1,
      maxRetries: this.maxRetries
    })

    // Clear error state to trigger re-render
    setTimeout(() => {
      this.setState({
        hasError: false,
        error: null,
        errorInfo: null,
        isRetrying: false,
        showDetails: false
      })
    }, 1000) // Brief delay to show retry state
  }

  /**
   * Handle page refresh
   */
  handleRefresh = () => {
    logger.info('UniversalErrorBoundary: Refreshing page:', {
      errorId: this.state.errorId
    })
    window.location.reload()
  }

  /**
   * Handle navigation to home
   */
  handleGoHome = () => {
    logger.info('UniversalErrorBoundary: Navigating to home:', {
      errorId: this.state.errorId
    })
    window.location.href = '/'
  }

  /**
   * Handle show/hide error details
   */
  toggleDetails = () => {
    this.setState(prevState => ({
      showDetails: !prevState.showDetails
    }))
  }

  /**
   * Handle report error
   */
  handleReportError = () => {
    const errorReport = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    }

    // Log error report (in production, this would be sent to error tracking service)
    logger.error('UniversalErrorBoundary: Error reported by user:', errorReport)

    // Show confirmation
    alert('Error report submitted. Thank you for helping us improve!')
  }

  /**
   * Get severity-based styling
   */
  getSeverityStyles() {
    const styles = {
      [ERROR_SEVERITY.LOW]: {
        borderColor: 'border-yellow-200',
        bgColor: 'bg-yellow-50',
        textColor: 'text-yellow-800',
        iconColor: 'text-yellow-600'
      },
      [ERROR_SEVERITY.MEDIUM]: {
        borderColor: 'border-orange-200',
        bgColor: 'bg-orange-50',
        textColor: 'text-orange-800',
        iconColor: 'text-orange-600'
      },
      [ERROR_SEVERITY.HIGH]: {
        borderColor: 'border-red-200',
        bgColor: 'bg-red-50',
        textColor: 'text-red-800',
        iconColor: 'text-red-600'
      },
      [ERROR_SEVERITY.CRITICAL]: {
        borderColor: 'border-red-300',
        bgColor: 'bg-red-100',
        textColor: 'text-red-900',
        iconColor: 'text-red-700'
      }
    }

    return styles[this.state.errorSeverity] || styles[ERROR_SEVERITY.MEDIUM]
  }

  render() {
    if (this.state.hasError) {
      // Use custom fallback component if provided
      if (this.fallbackComponent) {
        const FallbackComponent = this.fallbackComponent
        return (
          <FallbackComponent 
            error={this.state.error}
            errorInfo={this.state.errorInfo}
            onRetry={this.handleRetry}
            onRefresh={this.handleRefresh}
            onGoHome={this.handleGoHome}
          />
        )
      }

      const styles = this.getSeverityStyles()
      const canRetry = this.state.retryCount < this.maxRetries && this.state.isRecoverable

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className={`w-full max-w-2xl ${styles.borderColor} ${styles.bgColor}`}>
            <CardHeader className="text-center">
              <div className={`mx-auto w-16 h-16 rounded-full ${styles.bgColor} flex items-center justify-center mb-4`}>
                <AlertTriangle className={`w-8 h-8 ${styles.iconColor}`} />
              </div>
              <CardTitle className={`text-2xl font-bold ${styles.textColor}`}>
                Oops! Something went wrong
              </CardTitle>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {/* User-friendly message */}
              <div className="text-center">
                <p className={`text-lg ${styles.textColor} mb-2`}>
                  {this.state.userMessage}
                </p>
                <p className="text-gray-600 text-sm">
                  Error ID: {this.state.errorId}
                </p>
              </div>

              {/* Retry status */}
              {this.state.isRetrying && (
                <div className="flex items-center justify-center space-x-2 text-blue-600">
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Attempting to recover...</span>
                </div>
              )}

              {/* Recovery options */}
              <div className="flex flex-wrap justify-center gap-3">
                {canRetry && !this.state.isRetrying && (
                  <Button 
                    onClick={this.handleRetry}
                    variant="default"
                    className="min-w-[120px]"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Try Again ({this.maxRetries - this.state.retryCount} left)
                  </Button>
                )}

                {this.state.recoveryOptions.includes('refresh') && (
                  <Button 
                    onClick={this.handleRefresh}
                    variant="outline"
                    className="min-w-[120px]"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh Page
                  </Button>
                )}

                {this.state.recoveryOptions.includes('home') && (
                  <Button 
                    onClick={this.handleGoHome}
                    variant="outline"
                    className="min-w-[120px]"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Go Home
                  </Button>
                )}
              </div>

              {/* Error details toggle */}
              {this.showErrorDetails && (
                <div className="text-center">
                  <Button
                    onClick={this.toggleDetails}
                    variant="ghost"
                    size="sm"
                    className="text-gray-600"
                  >
                    {this.state.showDetails ? (
                      <>
                        <ChevronUp className="w-4 h-4 mr-1" />
                        Hide Error Details
                      </>
                    ) : (
                      <>
                        <ChevronDown className="w-4 h-4 mr-1" />
                        Show Error Details
                      </>
                    )}
                  </Button>
                </div>
              )}

              {/* Detailed error information */}
              {this.state.showDetails && this.showErrorDetails && (
                <div className="bg-gray-100 rounded-lg p-4 text-sm">
                  <h4 className="font-semibold text-gray-800 mb-2">Technical Details</h4>
                  
                  <div className="space-y-2">
                    <div>
                      <span className="font-medium text-gray-700">Error:</span>
                      <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto">
                        {this.state.error?.message || 'Unknown error'}
                      </pre>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-700">Category:</span>
                      <span className="ml-2 text-gray-600">{this.state.errorCategory}</span>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-700">Severity:</span>
                      <span className="ml-2 text-gray-600">{this.state.errorSeverity}</span>
                    </div>
                    
                    <div>
                      <span className="font-medium text-gray-700">Retry Attempts:</span>
                      <span className="ml-2 text-gray-600">{this.state.retryCount} / {this.maxRetries}</span>
                    </div>

                    {this.state.error?.stack && (
                      <div>
                        <span className="font-medium text-gray-700">Stack Trace:</span>
                        <pre className="mt-1 p-2 bg-white rounded text-xs overflow-x-auto max-h-32">
                          {this.state.error.stack}
                        </pre>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <Button
                      onClick={this.handleReportError}
                      variant="outline"
                      size="sm"
                      className="w-full"
                    >
                      <Bug className="w-4 h-4 mr-2" />
                      Report This Error
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default UniversalErrorBoundary