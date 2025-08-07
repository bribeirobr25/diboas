/**
 * Financial Error Boundary - Specialized error boundary for financial components
 * Provides comprehensive error handling, logging, and recovery for financial operations
 */

import React from 'react'
import { AlertTriangle, RefreshCw, Home, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import secureLogger from '../../utils/secureLogger.js'
import logger from '../../utils/logger'

class FinancialErrorBoundary extends React.Component {
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
      error,
      errorId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    }
  }

  componentDidCatch(error, errorInfo) {
    // Enhanced error logging for financial components
    const errorContext = {
      errorId: this.state.errorId,
      component: this.props.componentName || 'FinancialComponent',
      userAgent: navigator.userAgent,
      timestamp: new Date().toISOString(),
      url: window.location.href,
      userId: this.props.userId || 'anonymous',
      transactionContext: this.props.transactionContext || null,
      errorBoundary: 'FinancialErrorBoundary'
    }

    // Log error with security considerations
    secureLogger.logSecurityEvent('FINANCIAL_COMPONENT_ERROR', {
      errorType: error.name,
      errorMessage: error.message,
      errorStack: error.stack?.substring(0, 1000), // Limit stack trace size
      componentStack: errorInfo.componentStack?.substring(0, 1000),
      ...errorContext
    })

    // Additional error reporting for critical financial errors
    if (this.isFinancialCriticalError(error)) {
      secureLogger.logSecurityEvent('CRITICAL_FINANCIAL_ERROR', {
        severity: 'CRITICAL',
        errorId: this.state.errorId,
        requiresImmedateAttention: true,
        affectedComponent: this.props.componentName,
        ...errorContext
      })
    }

    this.setState({
      error,
      errorInfo,
      errorId: errorContext.errorId
    })
  }

  isFinancialCriticalError(error) {
    const criticalPatterns = [
      /transaction/i,
      /payment/i,
      /balance/i,
      /transfer/i,
      /money/i,
      /wallet/i,
      /precision/i,
      /calculation/i
    ]

    const errorMessage = error.message || error.toString()
    return criticalPatterns.some(pattern => pattern.test(errorMessage))
  }

  handleRetry = () => {
    const maxRetries = 3
    
    if (this.state.retryCount < maxRetries) {
      this.setState(prevState => ({
        hasError: false,
        error: null,
        errorInfo: null,
        retryCount: prevState.retryCount + 1
      }))

      // Log retry attempt
      secureLogger.logSecurityEvent('FINANCIAL_ERROR_RETRY', {
        errorId: this.state.errorId,
        retryAttempt: this.state.retryCount + 1,
        maxRetries
      })
    }
  }

  handleGoHome = () => {
    // Navigate to safe state (dashboard)
    window.location.href = '/app'
  }

  handleReportError = () => {
    const errorReport = {
      errorId: this.state.errorId,
      component: this.props.componentName,
      timestamp: new Date().toISOString(),
      userFeedback: 'User reported critical financial error'
    }

    // This would integrate with your error reporting system
    logger.debug('Error report:', errorReport)
    
    // Copy error ID to clipboard for user
    navigator.clipboard?.writeText(this.state.errorId).then(() => {
      alert(`Error ID ${this.state.errorId} copied to clipboard. Please provide this to support.`)
    }).catch(() => {
      alert(`Error ID: ${this.state.errorId} - Please provide this to support.`)
    })
  }

  render() {
    if (this.state.hasError) {
      const isCriticalError = this.isFinancialCriticalError(this.state.error)
      const canRetry = this.state.retryCount < 3

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4">
                {isCriticalError ? (
                  <Shield className="h-12 w-12 text-red-500" />
                ) : (
                  <AlertTriangle className="h-12 w-12 text-yellow-500" />
                )}
              </div>
              <CardTitle className="text-xl font-semibold">
                {isCriticalError ? 'Critical Financial Error' : 'Something went wrong'}
              </CardTitle>
              <CardDescription>
                {isCriticalError 
                  ? 'A critical error occurred in a financial component. Your data is safe, but this issue needs immediate attention.'
                  : 'An unexpected error occurred. Don\'t worry, your financial data is secure.'
                }
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Error ID for support */}
              <div className="bg-gray-100 p-3 rounded-md">
                <p className="text-sm text-gray-600 mb-1">Error ID:</p>
                <code className="text-xs font-mono text-gray-800 break-all">
                  {this.state.errorId}
                </code>
              </div>

              {/* Development-only error details */}
              {(typeof process !== 'undefined' && process?.env?.NODE_ENV === 'development') && (
                <details className="bg-red-50 p-3 rounded-md">
                  <summary className="text-sm font-medium text-red-800 cursor-pointer">
                    Development Error Details
                  </summary>
                  <div className="mt-2">
                    <pre className="text-xs text-red-700 whitespace-pre-wrap overflow-x-auto">
                      {this.state.error?.toString()}
                    </pre>
                    <pre className="text-xs text-red-600 whitespace-pre-wrap overflow-x-auto mt-2">
                      {this.state.errorInfo?.componentStack}
                    </pre>
                  </div>
                </details>
              )}

              {/* Action buttons */}
              <div className="flex flex-col space-y-2">
                {canRetry && (
                  <Button onClick={this.handleRetry} className="w-full">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Try Again {this.state.retryCount > 0 && `(${3 - this.state.retryCount} attempts left)`}
                  </Button>
                )}
                
                <Button onClick={this.handleGoHome} variant="outline" className="w-full">
                  <Home className="h-4 w-4 mr-2" />
                  Go to Dashboard
                </Button>

                {isCriticalError && (
                  <Button onClick={this.handleReportError} variant="destructive" className="w-full">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Report Critical Error
                  </Button>
                )}
              </div>

              {/* Retry count warning */}
              {this.state.retryCount >= 3 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-3">
                  <p className="text-sm text-yellow-800">
                    Maximum retry attempts reached. Please contact support with the error ID above.
                  </p>
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

/**
 * Higher-order component for wrapping financial components with error boundary
 */
export const withFinancialErrorBoundary = (WrappedComponent, options = {}) => {
  return function FinancialComponentWithErrorBoundary(props) {
    return (
      <FinancialErrorBoundary
        componentName={options.componentName || WrappedComponent.name}
        transactionContext={options.transactionContext}
        userId={props.userId}
      >
        <WrappedComponent {...props} />
      </FinancialErrorBoundary>
    )
  }
}

export default FinancialErrorBoundary