/**
 * Authentication Error Handler
 * Handles sign up, sign in, and session errors with user-friendly messaging and recovery
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { 
  AlertTriangle, 
  Lock, 
  Mail, 
  User, 
  Eye,
  EyeOff,
  RefreshCw,
  ArrowRight,
  Shield,
  Clock
} from 'lucide-react'
import { useErrorRecovery } from '../../hooks/useErrorRecovery.jsx'
import { ERROR_TYPES, ERROR_SEVERITY } from '../../services/errorHandling/ErrorRecoveryService.js'
import logger from '../../utils/logger'

/**
 * Authentication Error Types
 */
export const AUTH_ERROR_TYPES = {
  // Sign In Errors
  INVALID_CREDENTIALS: 'invalid_credentials',
  ACCOUNT_LOCKED: 'account_locked', 
  ACCOUNT_DISABLED: 'account_disabled',
  EMAIL_NOT_VERIFIED: 'email_not_verified',
  PASSWORD_EXPIRED: 'password_expired',
  TOO_MANY_ATTEMPTS: 'too_many_attempts',
  
  // Sign Up Errors
  EMAIL_ALREADY_EXISTS: 'email_already_exists',
  WEAK_PASSWORD: 'weak_password',
  INVALID_EMAIL: 'invalid_email',
  TERMS_NOT_ACCEPTED: 'terms_not_accepted',
  AGE_VERIFICATION_FAILED: 'age_verification_failed',
  
  // Session Errors
  SESSION_EXPIRED: 'session_expired',
  TOKEN_INVALID: 'token_invalid',
  CONCURRENT_SESSION: 'concurrent_session',
  
  // Network/Service Errors
  AUTH_SERVICE_UNAVAILABLE: 'auth_service_unavailable',
  NETWORK_ERROR: 'network_error',
  RATE_LIMITED: 'rate_limited',
  
  // Unknown
  UNKNOWN_AUTH_ERROR: 'unknown_auth_error'
}

/**
 * Get user-friendly error messages
 */
const getAuthErrorMessage = (errorType) => {
  const messages = {
    [AUTH_ERROR_TYPES.INVALID_CREDENTIALS]: 'Invalid email or password. Please check your credentials and try again.',
    [AUTH_ERROR_TYPES.ACCOUNT_LOCKED]: 'Your account has been temporarily locked due to multiple failed login attempts.',
    [AUTH_ERROR_TYPES.ACCOUNT_DISABLED]: 'Your account has been disabled. Please contact support for assistance.',
    [AUTH_ERROR_TYPES.EMAIL_NOT_VERIFIED]: 'Please verify your email address before signing in.',
    [AUTH_ERROR_TYPES.PASSWORD_EXPIRED]: 'Your password has expired. Please reset your password to continue.',
    [AUTH_ERROR_TYPES.TOO_MANY_ATTEMPTS]: 'Too many login attempts. Please wait before trying again.',
    
    [AUTH_ERROR_TYPES.EMAIL_ALREADY_EXISTS]: 'An account with this email already exists. Try signing in instead.',
    [AUTH_ERROR_TYPES.WEAK_PASSWORD]: 'Password is too weak. Please use at least 8 characters with uppercase, lowercase, and numbers.',
    [AUTH_ERROR_TYPES.INVALID_EMAIL]: 'Please enter a valid email address.',
    [AUTH_ERROR_TYPES.TERMS_NOT_ACCEPTED]: 'Please accept the terms of service to continue.',
    [AUTH_ERROR_TYPES.AGE_VERIFICATION_FAILED]: 'You must be 18 or older to create an account.',
    
    [AUTH_ERROR_TYPES.SESSION_EXPIRED]: 'Your session has expired. Please sign in again.',
    [AUTH_ERROR_TYPES.TOKEN_INVALID]: 'Authentication token is invalid. Please sign in again.',
    [AUTH_ERROR_TYPES.CONCURRENT_SESSION]: 'You have been signed out because you signed in from another device.',
    
    [AUTH_ERROR_TYPES.AUTH_SERVICE_UNAVAILABLE]: 'Authentication service is temporarily unavailable. Please try again later.',
    [AUTH_ERROR_TYPES.NETWORK_ERROR]: 'Network error occurred. Please check your connection and try again.',
    [AUTH_ERROR_TYPES.RATE_LIMITED]: 'Too many requests. Please wait a moment before trying again.',
    
    [AUTH_ERROR_TYPES.UNKNOWN_AUTH_ERROR]: 'An unexpected error occurred. Please try again.'
  }
  
  return messages[errorType] || messages[AUTH_ERROR_TYPES.UNKNOWN_AUTH_ERROR]
}

/**
 * Get suggested recovery actions
 */
const getRecoveryActions = (errorType) => {
  const actions = {
    [AUTH_ERROR_TYPES.INVALID_CREDENTIALS]: [
      'Double-check your email and password',
      'Use "Forgot Password" if you can\'t remember',
      'Check if Caps Lock is on',
      'Try copying and pasting your password'
    ],
    [AUTH_ERROR_TYPES.ACCOUNT_LOCKED]: [
      'Wait 15-30 minutes before trying again',
      'Use "Forgot Password" to reset your password',
      'Contact support if the issue persists'
    ],
    [AUTH_ERROR_TYPES.EMAIL_NOT_VERIFIED]: [
      'Check your email for verification link',
      'Check spam/junk folder',
      'Request a new verification email'
    ],
    [AUTH_ERROR_TYPES.EMAIL_ALREADY_EXISTS]: [
      'Try signing in instead',
      'Use "Forgot Password" if you can\'t remember your password',
      'Check if you signed up with a different email'
    ],
    [AUTH_ERROR_TYPES.WEAK_PASSWORD]: [
      'Use at least 8 characters',
      'Include uppercase and lowercase letters',
      'Add numbers and special characters',
      'Avoid common words or patterns'
    ],
    [AUTH_ERROR_TYPES.SESSION_EXPIRED]: [
      'Sign in again with your credentials',
      'Check "Remember me" for longer sessions'
    ]
  }
  
  return actions[errorType] || [
    'Try again in a few moments',
    'Check your internet connection',
    'Contact support if the problem persists'
  ]
}

/**
 * Get error severity
 */
const getErrorSeverity = (errorType) => {
  const severityMap = {
    [AUTH_ERROR_TYPES.ACCOUNT_DISABLED]: 'critical',
    [AUTH_ERROR_TYPES.ACCOUNT_LOCKED]: 'high',
    [AUTH_ERROR_TYPES.PASSWORD_EXPIRED]: 'high',
    [AUTH_ERROR_TYPES.EMAIL_NOT_VERIFIED]: 'medium',
    [AUTH_ERROR_TYPES.INVALID_CREDENTIALS]: 'medium',
    [AUTH_ERROR_TYPES.SESSION_EXPIRED]: 'medium',
    [AUTH_ERROR_TYPES.WEAK_PASSWORD]: 'low',
    [AUTH_ERROR_TYPES.INVALID_EMAIL]: 'low'
  }
  
  return severityMap[errorType] || 'medium'
}

/**
 * Authentication Error Alert Component
 */
export function AuthErrorAlert({ 
  errorType, 
  onDismiss, 
  onRetry,
  onForgotPassword,
  onResendVerification,
  onSwitchToSignIn,
  onSwitchToSignUp,
  customMessage = null,
  showActions = true
}) {
  const navigate = useNavigate()
  const { handleError } = useErrorRecovery()
  const [isRetrying, setIsRetrying] = useState(false)
  
  const message = customMessage || getAuthErrorMessage(errorType)
  const recoveryActions = getRecoveryActions(errorType)
  const severity = getErrorSeverity(errorType)

  // Log authentication error
  useEffect(() => {
    handleError({
      type: ERROR_TYPES.AUTHENTICATION_ERROR,
      severity: ERROR_SEVERITY[severity.toUpperCase()],
      message: `Authentication error: ${errorType}`,
      context: {
        authErrorType: errorType,
        userAgent: navigator.userAgent,
        url: window.location.href
      }
    })
  }, [errorType, handleError, severity])

  const handleRetry = async () => {
    setIsRetrying(true)
    try {
      if (onRetry) {
        await onRetry()
      }
    } finally {
      setIsRetrying(false)
    }
  }

  const getIconComponent = () => {
    switch (errorType) {
      case AUTH_ERROR_TYPES.EMAIL_NOT_VERIFIED:
        return Mail
      case AUTH_ERROR_TYPES.ACCOUNT_LOCKED:
      case AUTH_ERROR_TYPES.ACCOUNT_DISABLED:
        return Shield
      case AUTH_ERROR_TYPES.SESSION_EXPIRED:
      case AUTH_ERROR_TYPES.TOO_MANY_ATTEMPTS:
        return Clock
      default:
        return Lock
    }
  }

  const IconComponent = getIconComponent()

  return (
    <Alert className="border-red-200 bg-red-50 mb-6">
      <div className="flex items-start gap-3">
        <div className="p-2 bg-red-100 rounded-lg text-red-600 flex-shrink-0">
          <IconComponent className="w-5 h-5" />
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <h4 className="font-semibold text-red-900 text-sm">
              Authentication Error
            </h4>
            <Badge variant="destructive" className="text-xs">
              {errorType.replace(/_/g, ' ').toUpperCase()}
            </Badge>
          </div>
          
          <AlertDescription className="text-red-700 text-sm mb-3">
            {message}
          </AlertDescription>

          {/* Recovery suggestions */}
          <div className="text-xs text-red-600 mb-4">
            <strong>What you can try:</strong>
            <ul className="list-disc list-inside mt-1 space-y-1">
              {recoveryActions.slice(0, 3).map((action, index) => (
                <li key={index}>{action}</li>
              ))}
            </ul>
          </div>

          {/* Action buttons */}
          {showActions && (
            <div className="flex flex-wrap gap-2">
              {onRetry && (
                <Button
                  size="sm"
                  variant="default"
                  onClick={handleRetry}
                  disabled={isRetrying}
                  className="text-xs"
                >
                  <RefreshCw className={`w-3 h-3 mr-1 ${isRetrying ? 'animate-spin' : ''}`} />
                  {isRetrying ? 'Retrying...' : 'Try Again'}
                </Button>
              )}

              {onForgotPassword && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onForgotPassword}
                  className="text-xs"
                >
                  <Lock className="w-3 h-3 mr-1" />
                  Reset Password
                </Button>
              )}

              {onResendVerification && errorType === AUTH_ERROR_TYPES.EMAIL_NOT_VERIFIED && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onResendVerification}
                  className="text-xs"
                >
                  <Mail className="w-3 h-3 mr-1" />
                  Resend Email
                </Button>
              )}

              {onSwitchToSignIn && errorType === AUTH_ERROR_TYPES.EMAIL_ALREADY_EXISTS && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={onSwitchToSignIn}
                  className="text-xs"
                >
                  <ArrowRight className="w-3 h-3 mr-1" />
                  Sign In Instead
                </Button>
              )}

              {onSwitchToSignUp && errorType === AUTH_ERROR_TYPES.INVALID_CREDENTIALS && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={onSwitchToSignUp}
                  className="text-xs"
                >
                  <User className="w-3 h-3 mr-1" />
                  Create Account
                </Button>
              )}

              <Button
                size="sm"
                variant="ghost"
                onClick={() => navigate('/account')}
                className="text-xs"
              >
                Get Help
              </Button>
            </div>
          )}
        </div>
      </div>
    </Alert>
  )
}

/**
 * Session Expired Modal
 */
export function SessionExpiredModal({ onSignIn, onDismiss }) {
  const [countdown, setCountdown] = useState(30)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          if (onSignIn) onSignIn()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [onSignIn])

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-yellow-100 rounded-lg text-yellow-600">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Session Expired</h3>
            <p className="text-sm text-gray-600">Your session has expired for security</p>
          </div>
        </div>

        <p className="text-sm text-gray-700 mb-6">
          For your security, you've been signed out due to inactivity. 
          Please sign in again to continue.
        </p>

        <div className="flex gap-3">
          <Button 
            onClick={onSignIn}
            className="flex-1"
          >
            Sign In Again ({countdown}s)
          </Button>
          
          {onDismiss && (
            <Button 
              variant="outline"
              onClick={onDismiss}
            >
              Cancel
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}

/**
 * Hook for authentication error handling
 */
export function useAuthErrorHandler() {
  const [authError, setAuthError] = useState(null)
  const [showSessionModal, setShowSessionModal] = useState(false)
  const navigate = useNavigate()

  const showAuthError = useCallback((errorType, customMessage = null) => {
    setAuthError({ errorType, customMessage })
  }, [])

  const hideAuthError = useCallback(() => {
    setAuthError(null)
  }, [])

  const handleSessionExpired = useCallback(() => {
    setShowSessionModal(true)
    setAuthError(null)
  }, [])

  const handleSignInRedirect = useCallback(() => {
    setShowSessionModal(false)
    navigate('/auth?mode=signin')
  }, [navigate])

  const AuthErrorComponent = authError ? (
    <AuthErrorAlert
      errorType={authError.errorType}
      customMessage={authError.customMessage}
      onDismiss={hideAuthError}
      onRetry={authError.onRetry}
      onForgotPassword={() => navigate('/auth?mode=forgot')}
      onResendVerification={authError.onResendVerification}
      onSwitchToSignIn={() => navigate('/auth?mode=signin')}
      onSwitchToSignUp={() => navigate('/auth?mode=signup')}
    />
  ) : null

  const SessionModalComponent = showSessionModal ? (
    <SessionExpiredModal
      onSignIn={handleSignInRedirect}
      onDismiss={() => setShowSessionModal(false)}
    />
  ) : null

  return {
    showAuthError,
    hideAuthError,
    handleSessionExpired,
    AuthErrorComponent,
    SessionModalComponent,
    hasAuthError: !!authError,
    hasSessionModal: showSessionModal
  }
}

export default AuthErrorAlert