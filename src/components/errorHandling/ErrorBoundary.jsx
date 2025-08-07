/**
 * Enhanced Error Boundary Component
 * Comprehensive error boundary with recovery mechanisms and user-friendly error displays
 */

import React from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { useErrorBoundary, useErrorRecovery } from '../../hooks/useErrorRecovery.jsx'
import { ERROR_TYPES, ERROR_SEVERITY } from '../../services/errorHandling/ErrorRecoveryService.js'
import logger from '../../utils/logger'
import {
  AlertTriangle,
  RefreshCw,
  Home,
  Bug,
  Shield,
  ChevronDown,
  ChevronUp,
  Copy,
  ExternalLink
} from 'lucide-react'

class ErrorBoundaryClass extends React.Component {
  constructor(props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: false,
      retryCount: 0
    }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo,
      errorId: `boundary_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    })

    // Log error
    logger.error('Error Boundary caught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack
    })

    // Call error recovery service if available
    if (this.props.onError) {
      this.props.onError(error, errorInfo)
    }
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      showDetails: false,
      retryCount: prevState.retryCount + 1
    }))
  }

  handleReportError = () => {
    const errorReport = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      componentStack: this.state.errorInfo?.componentStack,
      userAgent: navigator.userAgent,
      url: window.location.href,
      timestamp: new Date().toISOString()
    }

    // Create mailto link for error reporting
    const subject = encodeURIComponent(`Error Report - ${this.state.errorId}`)
    const body = encodeURIComponent(`Error Report Details:\n\n${JSON.stringify(errorReport, null, 2)}`)
    const mailtoUrl = `mailto:support@diboas.com?subject=${subject}&body=${body}`
    
    window.open(mailtoUrl)
  }

  copyErrorDetails = () => {
    const errorDetails = {
      errorId: this.state.errorId,
      message: this.state.error?.message,
      stack: this.state.error?.stack,
      timestamp: new Date().toISOString()
    }

    navigator.clipboard.writeText(JSON.stringify(errorDetails, null, 2))
      .then(() => {
        // Show success feedback (could use toast notification)
        logger.info('Error details copied to clipboard')
      })
      .catch(err => {
        logger.warn('Failed to copy error details:', err)
      })
  }

  navigateHome = () => {
    // Dispatch custom event for navigation
    window.dispatchEvent(new CustomEvent('diboas-navigate-home', {
      detail: { destination: '/app' }
    }))
  }

  getErrorSeverity = () => {
    const error = this.state.error
    if (!error) return ERROR_SEVERITY.LOW

    // Classify error severity based on error type
    if (error.name === 'ChunkLoadError' || error.message?.includes('Loading chunk')) {
      return ERROR_SEVERITY.MEDIUM // Network/loading issues
    }
    
    if (error.name === 'TypeError' && error.message?.includes('Cannot read property')) {
      return ERROR_SEVERITY.HIGH // Likely data corruption or unexpected state
    }

    if (error.message?.includes('Network Error') || error.message?.includes('fetch')) {
      return ERROR_SEVERITY.MEDIUM // Network issues
    }

    return ERROR_SEVERITY.HIGH // Default to high for unknown errors
  }

  getErrorTypeIcon = () => {
    const error = this.state.error
    if (!error) return <Bug className="w-6 h-6" />

    if (error.name === 'ChunkLoadError') return <RefreshCw className="w-6 h-6" />
    if (error.name === 'TypeError') return <AlertTriangle className="w-6 h-6" />
    if (error.message?.includes('Network')) return <Shield className="w-6 h-6" />

    return <Bug className="w-6 h-6" />
  }

  getSeverityColor = (severity) => {
    const colors = {
      [ERROR_SEVERITY.CRITICAL]: 'destructive',
      [ERROR_SEVERITY.HIGH]: 'destructive',
      [ERROR_SEVERITY.MEDIUM]: 'warning',
      [ERROR_SEVERITY.LOW]: 'secondary',
      [ERROR_SEVERITY.INFO]: 'secondary'
    }
    return colors[severity] || 'secondary'
  }

  getRecoveryActions = () => {
    const error = this.state.error
    const actions = []

    // Always allow retry
    actions.push({
      label: 'Try Again',
      action: this.handleRetry,
      icon: <RefreshCw className="w-4 h-4" />,
      variant: 'default'
    })

    // For chunk loading errors, suggest hard refresh
    if (error?.name === 'ChunkLoadError') {
      actions.push({
        label: 'Refresh Page',
        action: () => window.location.reload(),
        icon: <RefreshCw className="w-4 h-4" />,
        variant: 'outline'
      })
    }

    // Always allow navigation home
    actions.push({
      label: 'Go Home',
      action: this.navigateHome,
      icon: <Home className="w-4 h-4" />,
      variant: 'outline'
    })

    return actions
  }

  render() {
    if (!this.state.hasError) {
      return this.props.children
    }

    const severity = this.getErrorSeverity()
    const severityColor = this.getSeverityColor(severity)
    const recoveryActions = this.getRecoveryActions()
    const { fallback: FallbackComponent, showRetry = true } = this.props

    // If a custom fallback component is provided, use it
    if (FallbackComponent) {
      return (
        <FallbackComponent
          error={this.state.error}
          errorInfo={this.state.errorInfo}
          retry={this.handleRetry}
          goHome={this.navigateHome}
        />
      )
    }

    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <div className="max-w-2xl w-full">
          <Card className="border-red-200 bg-red-50">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-red-100 rounded-lg text-red-600">
                  {this.getErrorTypeIcon()}
                </div>
                <div className="flex-1">
                  <CardTitle className="text-red-900">
                    Something went wrong
                  </CardTitle>
                  <CardDescription className="text-red-700">
                    We encountered an unexpected error. Don't worry, your data is safe.
                  </CardDescription>
                </div>
                <Badge variant={severityColor} className="capitalize">
                  {severity}
                </Badge>
              </div>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Error Summary */}
              <Alert>
                <AlertTriangle className="w-4 h-4" />
                <AlertDescription>
                  <strong>Error ID:</strong> {this.state.errorId}
                  <br />
                  <strong>Message:</strong> {this.state.error?.message || 'Unknown error occurred'}
                  {this.state.retryCount > 0 && (
                    <>
                      <br />
                      <strong>Retry Attempts:</strong> {this.state.retryCount}
                    </>
                  )}
                </AlertDescription>
              </Alert>

              {/* Recovery Actions */}
              <div className="flex flex-wrap gap-3">
                {recoveryActions.map((action, index) => (
                  <Button
                    key={index}
                    variant={action.variant}
                    onClick={action.action}
                    className="flex items-center gap-2"
                  >
                    {action.icon}
                    {action.label}
                  </Button>
                ))}
              </div>

              {/* Additional Actions */}
              <div className="flex flex-wrap gap-3 text-sm">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={this.copyErrorDetails}
                  className="flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy Error Details
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={this.handleReportError}
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  Report Error
                </Button>

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => this.setState(prev => ({ showDetails: !prev.showDetails }))}
                  className="flex items-center gap-2"
                >
                  {this.state.showDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {this.state.showDetails ? 'Hide' : 'Show'} Details
                </Button>
              </div>

              {/* Error Details (Collapsible) */}
              {this.state.showDetails && (
                <div className="space-y-4">
                  <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-auto max-h-64">
                    <div className="mb-2 text-red-400 font-semibold">Stack Trace:</div>
                    <pre className="whitespace-pre-wrap">
                      {this.state.error?.stack || 'No stack trace available'}
                    </pre>
                  </div>

                  {this.state.errorInfo?.componentStack && (
                    <div className="bg-gray-900 text-gray-100 p-4 rounded-lg text-sm font-mono overflow-auto max-h-64">
                      <div className="mb-2 text-blue-400 font-semibold">Component Stack:</div>
                      <pre className="whitespace-pre-wrap">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Help Text */}
              <div className="text-xs text-gray-600">
                <p>
                  If this error persists, please try refreshing the page or clearing your browser cache.
                  For technical support, use the "Report Error" button above.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }
}

// Functional wrapper component with hooks
export default function ErrorBoundary({ children, onError, ...props }) {
  const { handleError } = useErrorRecovery({ 
    componentName: 'ErrorBoundary',
    showNotifications: false 
  })

  const handleBoundaryError = async (error, errorInfo) => {
    // Use error recovery service
    await handleError({
      type: ERROR_TYPES.UNKNOWN_ERROR,
      severity: ERROR_SEVERITY.HIGH,
      message: error.message || 'Component error boundary triggered',
      originalError: error
    }, {
      componentStack: errorInfo.componentStack,
      errorBoundary: true
    })

    // Call custom error handler if provided
    if (onError) {
      onError(error, errorInfo)
    }
  }

  return (
    <ErrorBoundaryClass onError={handleBoundaryError} {...props}>
      {children}
    </ErrorBoundaryClass>
  )
}

// Export specialized error boundary components
export function NetworkErrorBoundary({ children, ...props }) {
  return (
    <ErrorBoundary
      {...props}
      fallback={({ error, retry, goHome }) => (
        <div className="text-center p-8">
          <Shield className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Network Connection Issue</h2>
          <p className="text-gray-600 mb-6">
            We're having trouble connecting to our servers. Please check your internet connection.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={retry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={goHome}>
              <Home className="w-4 h-4 mr-2" />
              Go Home
            </Button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}

export function TransactionErrorBoundary({ children, onTransactionError, ...props }) {
  return (
    <ErrorBoundary
      {...props}
      onError={(error, errorInfo) => {
        if (onTransactionError) {
          onTransactionError(error, errorInfo)
        }
      }}
      fallback={({ error, retry, goHome }) => (
        <div className="text-center p-8">
          <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Transaction Error</h2>
          <p className="text-gray-600 mb-6">
            We encountered an error processing your transaction. Your funds are safe.
          </p>
          <div className="flex gap-4 justify-center">
            <Button onClick={retry}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Try Again
            </Button>
            <Button variant="outline" onClick={goHome}>
              <Home className="w-4 h-4 mr-2" />
              Return to Dashboard
            </Button>
          </div>
        </div>
      )}
    >
      {children}
    </ErrorBoundary>
  )
}