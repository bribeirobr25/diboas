/**
 * Enhanced Error States Component
 * Provides better error handling with recovery options
 */

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button.jsx'
import { Card } from '@/components/ui/card.jsx'
import { cn } from '@/lib/utils'
import {
  AlertTriangle,
  RefreshCw,
  Home,
  ArrowLeft,
  Wifi,
  WifiOff,
  Shield,
  Clock,
  Bug,
  HelpCircle
} from 'lucide-react'

const errorConfigs = {
  network: {
    icon: WifiOff,
    title: "Connection Error",
    description: "Unable to connect to our servers. Please check your internet connection.",
    primaryAction: "Try Again",
    secondaryAction: "Go Offline",
    color: "orange"
  },
  authentication: {
    icon: Shield,
    title: "Authentication Failed",
    description: "Your session has expired. Please sign in again to continue.",
    primaryAction: "Sign In",
    secondaryAction: "Go Home",
    color: "red"
  },
  timeout: {
    icon: Clock,
    title: "Request Timeout",
    description: "The request is taking longer than expected. Please try again.",
    primaryAction: "Retry",
    secondaryAction: "Cancel",
    color: "yellow"
  },
  notFound: {
    icon: HelpCircle,
    title: "Page Not Found",
    description: "The page you're looking for doesn't exist or has been moved.",
    primaryAction: "Go Home",
    secondaryAction: "Go Back",
    color: "purple"
  },
  serverError: {
    icon: AlertTriangle,
    title: "Server Error",
    description: "Something went wrong on our end. We're working to fix it.",
    primaryAction: "Try Again",
    secondaryAction: "Report Issue",
    color: "red"
  },
  validation: {
    icon: AlertTriangle,
    title: "Validation Error",
    description: "Please check your input and try again.",
    primaryAction: "Fix Issues",
    secondaryAction: "Reset Form",
    color: "orange"
  },
  permission: {
    icon: Shield,
    title: "Access Denied",
    description: "You don't have permission to access this resource.",
    primaryAction: "Request Access",
    secondaryAction: "Go Back",
    color: "red"
  },
  maintenance: {
    icon: Bug,
    title: "Under Maintenance",
    description: "We're currently performing maintenance. Please try again later.",
    primaryAction: "Check Status",
    secondaryAction: "Get Updates",
    color: "blue"
  },
  default: {
    icon: AlertTriangle,
    title: "Something went wrong",
    description: "An unexpected error occurred. Please try again.",
    primaryAction: "Try Again",
    secondaryAction: "Go Home",
    color: "red"
  }
}

export default function ErrorState({
  type = 'default',
  title,
  description,
  primaryAction,
  secondaryAction,
  onPrimaryAction,
  onSecondaryAction,
  className,
  showDetails = false,
  error,
  minimal = false,
  children
}) {
  const [isRetrying, setIsRetrying] = useState(false)
  const [showErrorDetails, setShowErrorDetails] = useState(false)
  
  const config = errorConfigs[type] || errorConfigs.default
  const Icon = config.icon
  
  const displayTitle = title || config.title
  const displayDescription = description || config.description
  const displayPrimaryAction = primaryAction || config.primaryAction
  const displaySecondaryAction = secondaryAction || config.secondaryAction

  const handlePrimaryAction = async () => {
    if (onPrimaryAction) {
      setIsRetrying(true)
      try {
        await onPrimaryAction()
      } finally {
        setIsRetrying(false)
      }
    }
  }

  const colorVariants = {
    red: {
      bg: 'from-red-50 to-pink-50',
      icon: 'text-red-500',
      primary: 'bg-red-600 hover:bg-red-700',
      secondary: 'text-red-600 hover:text-red-700 hover:bg-red-50'
    },
    orange: {
      bg: 'from-orange-50 to-yellow-50',
      icon: 'text-orange-500',
      primary: 'bg-orange-600 hover:bg-orange-700',
      secondary: 'text-orange-600 hover:text-orange-700 hover:bg-orange-50'
    },
    yellow: {
      bg: 'from-yellow-50 to-amber-50',
      icon: 'text-yellow-500',
      primary: 'bg-yellow-600 hover:bg-yellow-700',
      secondary: 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50'
    },
    blue: {
      bg: 'from-blue-50 to-indigo-50',
      icon: 'text-blue-500',
      primary: 'bg-blue-600 hover:bg-blue-700',
      secondary: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50'
    },
    purple: {
      bg: 'from-purple-50 to-indigo-50',
      icon: 'text-purple-500',
      primary: 'bg-purple-600 hover:bg-purple-700',
      secondary: 'text-purple-600 hover:text-purple-700 hover:bg-purple-50'
    }
  }

  const colors = colorVariants[config.color] || colorVariants.red

  if (minimal) {
    return (
      <div className={cn("text-center py-8", className)}>
        <Icon className={cn("w-12 h-12 mx-auto mb-4", colors.icon)} />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{displayTitle}</h3>
        <p className="text-gray-600 mb-6">{displayDescription}</p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onPrimaryAction && (
            <Button
              onClick={handlePrimaryAction}
              disabled={isRetrying}
              className={colors.primary}
            >
              {isRetrying && <RefreshCw className="w-4 h-4 mr-2 animate-spin" />}
              {displayPrimaryAction}
            </Button>
          )}
          {onSecondaryAction && (
            <Button
              variant="outline"
              onClick={onSecondaryAction}
              className={colors.secondary}
            >
              {displaySecondaryAction}
            </Button>
          )}
        </div>
      </div>
    )
  }

  return (
    <Card className={cn("p-8 text-center", className)}>
      <div className="max-w-md mx-auto space-y-6">
        {/* Animated Error Illustration */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="relative"
        >
          <div className={cn("absolute inset-0 bg-gradient-to-br rounded-full blur-3xl opacity-20", colors.bg)} />
          <div className={cn("relative bg-gradient-to-br rounded-full p-6 mx-auto w-fit", colors.bg)}>
            <motion.div
              animate={{ 
                rotate: type === 'network' ? [0, -10, 10, 0] : 0,
                scale: [1, 1.1, 1]
              }}
              transition={{ 
                duration: 2,
                repeat: Infinity,
                repeatType: "reverse"
              }}
            >
              <Icon className={cn("w-16 h-16", colors.icon)} />
            </motion.div>
          </div>
        </motion.div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">{displayTitle}</h3>
          <p className="text-gray-600">{displayDescription}</p>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {onPrimaryAction && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={handlePrimaryAction}
                disabled={isRetrying}
                className={cn("shadow-lg", colors.primary)}
              >
                {isRetrying ? (
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  type === 'network' && <Wifi className="w-4 h-4 mr-2" />
                )}
                {displayPrimaryAction}
              </Button>
            </motion.div>
          )}
          
          {onSecondaryAction && (
            <Button
              variant="outline"
              onClick={onSecondaryAction}
              className={colors.secondary}
            >
              {type === 'notFound' && <Home className="w-4 h-4 mr-2" />}
              {(type === 'permission' || type === 'timeout') && <ArrowLeft className="w-4 h-4 mr-2" />}
              {displaySecondaryAction}
            </Button>
          )}
        </div>

        {/* Error Details Toggle */}
        {showDetails && error && (
          <div className="text-left">
            <button
              onClick={() => setShowErrorDetails(!showErrorDetails)}
              className="text-sm text-gray-500 hover:text-gray-700 flex items-center mx-auto"
            >
              <Bug className="w-4 h-4 mr-1" />
              {showErrorDetails ? 'Hide' : 'Show'} technical details
            </button>
            
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ 
                height: showErrorDetails ? 'auto' : 0,
                opacity: showErrorDetails ? 1 : 0 
              }}
              transition={{ duration: 0.3 }}
              className="overflow-hidden"
            >
              {showErrorDetails && (
                <div className="mt-4 p-4 bg-gray-50 rounded-lg text-left">
                  <pre className="text-xs text-gray-600 whitespace-pre-wrap break-words">
                    {typeof error === 'string' ? error : JSON.stringify(error, null, 2)}
                  </pre>
                </div>
              )}
            </motion.div>
          </div>
        )}

        {/* Additional content */}
        {children}
      </div>
    </Card>
  )
}

// Specialized error states
export function NetworkError({ onRetry, onGoOffline }) {
  return (
    <ErrorState
      type="network"
      onPrimaryAction={onRetry}
      onSecondaryAction={onGoOffline}
    />
  )
}

export function AuthenticationError({ onSignIn, onGoHome }) {
  return (
    <ErrorState
      type="authentication"
      onPrimaryAction={onSignIn}
      onSecondaryAction={onGoHome}
    />
  )
}

export function NotFoundError({ onGoHome, onGoBack }) {
  return (
    <ErrorState
      type="notFound"
      onPrimaryAction={onGoHome}
      onSecondaryAction={onGoBack}
    >
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Error code: 404
        </p>
      </div>
    </ErrorState>
  )
}

export function ServerError({ onRetry, onReportIssue, error }) {
  return (
    <ErrorState
      type="serverError"
      onPrimaryAction={onRetry}
      onSecondaryAction={onReportIssue}
      showDetails={true}
      error={error}
    >
      <div className="mt-6 p-4 bg-red-50 rounded-lg text-left">
        <p className="text-sm text-red-800">
          <strong>What you can do:</strong>
        </p>
        <ul className="mt-2 text-sm text-red-700 space-y-1">
          <li>• Wait a few minutes and try again</li>
          <li>• Check our status page for updates</li>
          <li>• Contact support if the issue persists</li>
        </ul>
      </div>
    </ErrorState>
  )
}

export function MaintenanceError({ onCheckStatus, onGetUpdates }) {
  return (
    <ErrorState
      type="maintenance"
      onPrimaryAction={onCheckStatus}
      onSecondaryAction={onGetUpdates}
    >
      <div className="mt-6 p-4 bg-blue-50 rounded-lg">
        <p className="text-sm text-blue-800">
          We're making improvements to serve you better. 
          Maintenance is expected to complete within the next hour.
        </p>
      </div>
    </ErrorState>
  )
}