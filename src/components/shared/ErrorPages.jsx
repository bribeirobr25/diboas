/**
 * User-Friendly Error Pages
 * 404, 500, and routing error pages with navigation and recovery options
 */

import { useState, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { 
  Home, 
  ArrowLeft, 
  RefreshCw, 
  Search, 
  WifiOff, 
  AlertTriangle,
  Server,
  Navigation,
  Clock,
  HelpCircle
} from 'lucide-react'
import { useErrorRecovery } from '../../hooks/useErrorRecovery.jsx'
import { ERROR_TYPES, ERROR_SEVERITY } from '../../services/errorHandling/ErrorRecoveryService.js'
import logger from '../../utils/logger.js'

/**
 * 404 Not Found Error Page
 */
export function NotFoundErrorPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { handleError } = useErrorRecovery()
  const [previousPath, setPreviousPath] = useState(null)

  useEffect(() => {
    // Log 404 error for analytics
    handleError({
      type: ERROR_TYPES.UNKNOWN_ERROR,
      severity: ERROR_SEVERITY.MEDIUM,
      message: `Page not found: ${location.pathname}`,
      context: { 
        errorType: '404',
        requestedPath: location.pathname,
        referrer: document.referrer 
      }
    })

    // Try to get previous path from session storage
    const savedPath = sessionStorage.getItem('diboas_previous_path')
    if (savedPath && savedPath !== location.pathname) {
      setPreviousPath(savedPath)
    }
  }, [location.pathname, handleError])

  const handleGoBack = () => {
    if (previousPath) {
      navigate(previousPath)
    } else if (window.history.length > 1) {
      navigate(-1)
    } else {
      navigate('/app')
    }
  }

  const handleGoHome = () => {
    navigate('/app')
  }

  const handleRefresh = () => {
    window.location.reload()
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="max-w-lg w-full">
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-yellow-100 rounded-lg text-yellow-600">
                <Navigation className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-yellow-900">
                  Page Not Found
                </CardTitle>
                <CardDescription className="text-yellow-700">
                  The page you're looking for doesn't exist or has been moved.
                </CardDescription>
              </div>
              <Badge variant="outline" className="text-yellow-700 border-yellow-300">
                404
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert className="border-yellow-200 bg-yellow-50">
              <Search className="w-4 h-4" />
              <AlertDescription className="text-yellow-800">
                <strong>Requested URL:</strong> {location.pathname}
                <br />
                This page might have been moved, deleted, or the URL might be incorrect.
              </AlertDescription>
            </Alert>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button 
                onClick={handleGoBack}
                className="flex items-center gap-2"
                variant="default"
              >
                <ArrowLeft className="w-4 h-4" />
                Go Back
              </Button>

              <Button 
                onClick={handleGoHome}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Home className="w-4 h-4" />
                Dashboard
              </Button>
            </div>

            {/* Additional Actions */}
            <div className="flex flex-col sm:flex-row gap-3 text-sm">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                className="flex items-center gap-2"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh Page
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/account')}
                className="flex items-center gap-2"
              >
                <HelpCircle className="w-4 h-4" />
                Get Help
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-xs text-gray-600 bg-white p-3 rounded border">
              <p className="mb-2"><strong>Common solutions:</strong></p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Check the URL for typos</li>
                <li>Use the navigation menu to find what you're looking for</li>
                <li>Go back to the previous page and try again</li>
                <li>Contact support if you think this is an error</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * 500 Server Error Page
 */
export function ServerErrorPage({ error = null, errorId = null }) {
  const navigate = useNavigate()
  const { handleError, retryOperation } = useErrorRecovery()
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    // Log server error
    handleError({
      type: ERROR_TYPES.UNKNOWN_ERROR,
      severity: ERROR_SEVERITY.HIGH,
      message: error?.message || 'Server error occurred',
      context: { 
        errorType: '500',
        errorId,
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    })
  }, [error, errorId, handleError])

  const handleRetry = async () => {
    setIsRetrying(true)
    setRetryCount(prev => prev + 1)

    try {
      await new Promise(resolve => setTimeout(resolve, 1000)) // Brief delay
      window.location.reload()
    } catch (err) {
      logger.error('Retry failed:', err)
    } finally {
      setIsRetrying(false)
    }
  }

  const handleGoHome = () => {
    navigate('/app')
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="max-w-lg w-full">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-red-100 rounded-lg text-red-600">
                <Server className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-red-900">
                  Server Error
                </CardTitle>
                <CardDescription className="text-red-700">
                  We're experiencing technical difficulties. Please try again.
                </CardDescription>
              </div>
              <Badge variant="destructive">
                500
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="w-4 h-4" />
              <AlertDescription className="text-red-800">
                {errorId && (
                  <>
                    <strong>Error ID:</strong> {errorId}
                    <br />
                  </>
                )}
                <strong>Status:</strong> Our team has been notified and is working on a fix.
                {retryCount > 0 && (
                  <>
                    <br />
                    <strong>Retry Attempts:</strong> {retryCount}
                  </>
                )}
              </AlertDescription>
            </Alert>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button 
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex items-center gap-2"
                variant="default"
              >
                <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Retrying...' : 'Try Again'}
              </Button>

              <Button 
                onClick={handleGoHome}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Home className="w-4 h-4" />
                Go to Dashboard
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-xs text-gray-600 bg-white p-3 rounded border">
              <p className="mb-2"><strong>What you can do:</strong></p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Wait a moment and try again</li>
                <li>Check if the issue persists on other pages</li>
                <li>Clear your browser cache if problems continue</li>
                <li>Contact support with the error ID above if needed</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Network/Connectivity Error Page
 */
export function NetworkErrorPage() {
  const navigate = useNavigate()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [retryCount, setRetryCount] = useState(0)
  const [isRetrying, setIsRetrying] = useState(false)

  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const handleRetry = async () => {
    setIsRetrying(true)
    setRetryCount(prev => prev + 1)

    try {
      // Test connectivity
      await fetch('/api/health', { method: 'HEAD' })
      window.location.reload()
    } catch (err) {
      // Still offline or server issues
      setTimeout(() => setIsRetrying(false), 2000)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="max-w-lg w-full">
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-orange-100 rounded-lg text-orange-600">
                <WifiOff className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <CardTitle className="text-orange-900">
                  Connection Problem
                </CardTitle>
                <CardDescription className="text-orange-700">
                  Unable to connect to our servers. Please check your connection.
                </CardDescription>
              </div>
              <Badge 
                variant={isOnline ? "secondary" : "destructive"}
                className="flex items-center gap-1"
              >
                <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`} />
                {isOnline ? 'Online' : 'Offline'}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <Alert className="border-orange-200 bg-orange-50">
              <Clock className="w-4 h-4" />
              <AlertDescription className="text-orange-800">
                <strong>Connection Status:</strong> {isOnline ? 'Connected to internet' : 'No internet connection'}
                <br />
                <strong>Server Status:</strong> Unable to reach diBoaS servers
                {retryCount > 0 && (
                  <>
                    <br />
                    <strong>Retry Attempts:</strong> {retryCount}
                  </>
                )}
              </AlertDescription>
            </Alert>

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Button 
                onClick={handleRetry}
                disabled={isRetrying}
                className="flex items-center gap-2"
                variant="default"
              >
                <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
                {isRetrying ? 'Checking...' : 'Check Connection'}
              </Button>

              <Button 
                onClick={() => navigate('/app')}
                className="flex items-center gap-2"
                variant="outline"
              >
                <Home className="w-4 h-4" />
                Try Dashboard
              </Button>
            </div>

            {/* Connection Tips */}
            <div className="text-xs text-gray-600 bg-white p-3 rounded border">
              <p className="mb-2"><strong>Connection troubleshooting:</strong></p>
              <ul className="space-y-1 list-disc list-inside">
                <li>Check your Wi-Fi or mobile data connection</li>
                <li>Try refreshing the page or restarting your browser</li>
                <li>Disable VPN or proxy if you're using one</li>
                <li>Check if other websites are working</li>
                <li>Contact your internet provider if the issue persists</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/**
 * Generic Error Page with customizable content
 */
export function GenericErrorPage({ 
  title = "Something went wrong",
  description = "An unexpected error occurred. Please try again.",
  errorCode = "ERROR",
  icon: IconComponent = AlertTriangle,
  variant = "warning", // warning, error, info
  showRetry = true,
  showGoHome = true,
  onRetry = null,
  children = null
}) {
  const navigate = useNavigate()
  const [retryCount, setRetryCount] = useState(0)

  const variantStyles = {
    warning: {
      bg: "bg-yellow-50",
      border: "border-yellow-200", 
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      titleColor: "text-yellow-900",
      descColor: "text-yellow-700"
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      iconBg: "bg-red-100", 
      iconColor: "text-red-600",
      titleColor: "text-red-900",
      descColor: "text-red-700"
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600", 
      titleColor: "text-blue-900",
      descColor: "text-blue-700"
    }
  }

  const styles = variantStyles[variant] || variantStyles.warning

  const handleRetry = () => {
    setRetryCount(prev => prev + 1)
    if (onRetry) {
      onRetry()
    } else {
      window.location.reload()
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
      <div className="max-w-lg w-full">
        <Card className={`${styles.border} ${styles.bg}`}>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`p-3 ${styles.iconBg} rounded-lg ${styles.iconColor}`}>
                <IconComponent className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <CardTitle className={styles.titleColor}>
                  {title}
                </CardTitle>
                <CardDescription className={styles.descColor}>
                  {description}
                </CardDescription>
              </div>
              <Badge variant="outline" className={`${styles.titleColor} ${styles.border}`}>
                {errorCode}
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {children}

            {/* Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {showRetry && (
                <Button 
                  onClick={handleRetry}
                  className="flex items-center gap-2"
                  variant="default"
                >
                  <RefreshCw className="w-4 h-4" />
                  Try Again {retryCount > 0 && `(${retryCount})`}
                </Button>
              )}

              {showGoHome && (
                <Button 
                  onClick={() => navigate('/app')}
                  className="flex items-center gap-2"
                  variant="outline"
                >
                  <Home className="w-4 h-4" />
                  Go Home
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export default {
  NotFoundErrorPage,
  ServerErrorPage,
  NetworkErrorPage,
  GenericErrorPage
}