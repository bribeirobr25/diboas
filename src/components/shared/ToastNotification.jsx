/**
 * Toast Notification System
 * Lightweight, auto-dismissing notifications for temporary messages and errors
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import { 
  CheckCircle,
  AlertTriangle,
  Info,
  X,
  Wifi,
  WifiOff,
  Clock,
  AlertCircle
} from 'lucide-react'
import logger from '../../utils/logger.js'

/**
 * Toast Types
 */
export const TOAST_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning', 
  INFO: 'info',
  LOADING: 'loading'
}

/**
 * Toast Positions
 */
export const TOAST_POSITIONS = {
  TOP_RIGHT: 'top-right',
  TOP_LEFT: 'top-left',
  TOP_CENTER: 'top-center',
  BOTTOM_RIGHT: 'bottom-right',
  BOTTOM_LEFT: 'bottom-left',
  BOTTOM_CENTER: 'bottom-center'
}

/**
 * Default toast configuration
 */
const DEFAULT_CONFIG = {
  duration: 5000,
  position: TOAST_POSITIONS.TOP_RIGHT,
  dismissible: true,
  showProgress: true,
  maxToasts: 5
}

/**
 * Get toast styling based on type
 */
const getToastStyles = (type) => {
  const styles = {
    [TOAST_TYPES.SUCCESS]: {
      alert: 'border-green-200 bg-green-50',
      icon: 'text-green-600',
      title: 'text-green-900',
      desc: 'text-green-700',
      progress: 'bg-green-600'
    },
    [TOAST_TYPES.ERROR]: {
      alert: 'border-red-200 bg-red-50',
      icon: 'text-red-600', 
      title: 'text-red-900',
      desc: 'text-red-700',
      progress: 'bg-red-600'
    },
    [TOAST_TYPES.WARNING]: {
      alert: 'border-yellow-200 bg-yellow-50',
      icon: 'text-yellow-600',
      title: 'text-yellow-900', 
      desc: 'text-yellow-700',
      progress: 'bg-yellow-600'
    },
    [TOAST_TYPES.INFO]: {
      alert: 'border-blue-200 bg-blue-50',
      icon: 'text-blue-600',
      title: 'text-blue-900',
      desc: 'text-blue-700', 
      progress: 'bg-blue-600'
    },
    [TOAST_TYPES.LOADING]: {
      alert: 'border-gray-200 bg-gray-50',
      icon: 'text-gray-600',
      title: 'text-gray-900',
      desc: 'text-gray-700',
      progress: 'bg-gray-600'
    }
  }
  
  return styles[type] || styles[TOAST_TYPES.INFO]
}

/**
 * Get icon component for toast type
 */
const getToastIcon = (type) => {
  const icons = {
    [TOAST_TYPES.SUCCESS]: CheckCircle,
    [TOAST_TYPES.ERROR]: AlertCircle,
    [TOAST_TYPES.WARNING]: AlertTriangle,
    [TOAST_TYPES.INFO]: Info,
    [TOAST_TYPES.LOADING]: Clock
  }
  
  return icons[type] || Info
}

/**
 * Get container position styles
 */
const getPositionStyles = (position) => {
  const positions = {
    [TOAST_POSITIONS.TOP_RIGHT]: 'top-4 right-4',
    [TOAST_POSITIONS.TOP_LEFT]: 'top-4 left-4',
    [TOAST_POSITIONS.TOP_CENTER]: 'top-4 left-1/2 transform -translate-x-1/2',
    [TOAST_POSITIONS.BOTTOM_RIGHT]: 'bottom-4 right-4',
    [TOAST_POSITIONS.BOTTOM_LEFT]: 'bottom-4 left-4',
    [TOAST_POSITIONS.BOTTOM_CENTER]: 'bottom-4 left-1/2 transform -translate-x-1/2'
  }
  
  return positions[position] || positions[TOAST_POSITIONS.TOP_RIGHT]
}

/**
 * Individual Toast Component
 */
function Toast({ 
  id,
  type = TOAST_TYPES.INFO,
  title,
  message,
  duration = DEFAULT_CONFIG.duration,
  dismissible = DEFAULT_CONFIG.dismissible,
  showProgress = DEFAULT_CONFIG.showProgress,
  action = null,
  onDismiss,
  onAction
}) {
  const [timeRemaining, setTimeRemaining] = useState(duration / 1000)
  const [isPaused, setIsPaused] = useState(false)
  const [isVisible, setIsVisible] = useState(true)

  const styles = getToastStyles(type)
  const IconComponent = getToastIcon(type)

  // Auto-dismiss timer
  useEffect(() => {
    if (duration === 0 || isPaused || !isVisible) return

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0.1) {
          setIsVisible(false)
          setTimeout(() => onDismiss(id), 300) // Allow fade out animation
          return 0
        }
        return prev - 0.1
      })
    }, 100)

    return () => clearInterval(timer)
  }, [duration, isPaused, isVisible, onDismiss, id])

  const handleDismiss = useCallback(() => {
    setIsVisible(false)
    setTimeout(() => onDismiss(id), 300)
  }, [onDismiss, id])

  const handleAction = useCallback(() => {
    if (onAction) {
      onAction(action.callback)
    }
    handleDismiss()
  }, [onAction, action, handleDismiss])

  if (!isVisible) return null

  const progressPercentage = duration > 0 ? (timeRemaining / (duration / 1000)) * 100 : 0

  return (
    <div 
      className={`transition-all duration-300 ease-in-out transform ${
        isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
      }`}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <Alert className={`${styles.alert} border shadow-lg mb-3 max-w-sm`}>
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 ${styles.icon}`}>
            <IconComponent className="w-5 h-5" />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            {title && (
              <h4 className={`font-medium text-sm ${styles.title} mb-1`}>
                {title}
              </h4>
            )}
            
            <AlertDescription className={`text-sm ${styles.desc}`}>
              {message}
            </AlertDescription>

            {/* Action Button */}
            {action && (
              <Button
                size="sm"
                variant="ghost"
                onClick={handleAction}
                className={`mt-2 text-xs p-1 h-auto ${styles.title}`}
              >
                {action.label}
              </Button>
            )}

            {/* Progress Bar */}
            {showProgress && duration > 0 && (
              <div className="mt-2">
                <Progress 
                  value={progressPercentage}
                  className="h-1"
                />
              </div>
            )}
          </div>

          {/* Dismiss Button */}
          {dismissible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="p-1 h-auto flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </Button>
          )}
        </div>
      </Alert>
    </div>
  )
}

/**
 * Toast Container Component
 */
function ToastContainer({ toasts, position, onDismiss, onAction }) {
  const positionStyles = getPositionStyles(position)

  return (
    <div className={`fixed z-50 pointer-events-none ${positionStyles}`}>
      <div className="pointer-events-auto space-y-2">
        {toasts.map(toast => (
          <Toast
            key={toast.id}
            {...toast}
            onDismiss={onDismiss}
            onAction={onAction}
          />
        ))}
      </div>
    </div>
  )
}

/**
 * Toast Context
 */
const ToastContext = createContext(null)

/**
 * Toast Provider Component
 */
export function ToastProvider({ children, config = {} }) {
  const [toasts, setToasts] = useState([])
  const finalConfig = { ...DEFAULT_CONFIG, ...config }

  const addToast = useCallback((toast) => {
    const id = Date.now() + Math.random()
    const newToast = {
      id,
      ...finalConfig,
      ...toast,
      timestamp: Date.now()
    }

    setToasts(prev => {
      const updated = [newToast, ...prev]
      // Limit number of toasts
      return updated.slice(0, finalConfig.maxToasts)
    })

    // Log toast for debugging
    logger.debug('Toast added:', { id, type: newToast.type, message: newToast.message })

    return id
  }, [finalConfig])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(toast => toast.id !== id))
  }, [])

  const clearAllToasts = useCallback(() => {
    setToasts([])
  }, [])

  const handleToastAction = useCallback((actionCallback) => {
    if (typeof actionCallback === 'function') {
      actionCallback()
    }
  }, [])

  // Convenience methods
  const showSuccess = useCallback((message, options = {}) => {
    return addToast({ 
      type: TOAST_TYPES.SUCCESS, 
      message, 
      title: options.title || 'Success',
      ...options 
    })
  }, [addToast])

  const showError = useCallback((message, options = {}) => {
    return addToast({ 
      type: TOAST_TYPES.ERROR, 
      message, 
      title: options.title || 'Error',
      duration: options.duration || 8000, // Errors stay longer
      ...options 
    })
  }, [addToast])

  const showWarning = useCallback((message, options = {}) => {
    return addToast({ 
      type: TOAST_TYPES.WARNING, 
      message, 
      title: options.title || 'Warning',
      ...options 
    })
  }, [addToast])

  const showInfo = useCallback((message, options = {}) => {
    return addToast({ 
      type: TOAST_TYPES.INFO, 
      message, 
      title: options.title || 'Info',
      ...options 
    })
  }, [addToast])

  const showLoading = useCallback((message, options = {}) => {
    return addToast({ 
      type: TOAST_TYPES.LOADING, 
      message, 
      title: options.title || 'Loading',
      duration: 0, // Loading toasts don't auto-dismiss
      dismissible: false,
      showProgress: false,
      ...options 
    })
  }, [addToast])

  // Network status toasts
  const showNetworkError = useCallback(() => {
    return showError('Network connection lost', {
      title: 'Connection Error',
      action: {
        label: 'Retry',
        callback: () => window.location.reload()
      }
    })
  }, [showError])

  const showNetworkRestored = useCallback(() => {
    return showSuccess('Network connection restored', {
      title: 'Back Online'
    })
  }, [showSuccess])

  const contextValue = {
    // Core methods
    addToast,
    removeToast,
    clearAllToasts,
    
    // Convenience methods
    showSuccess,
    showError,
    showWarning,
    showInfo,
    showLoading,
    
    // Network methods
    showNetworkError,
    showNetworkRestored,
    
    // State
    toasts
  }

  return (
    <ToastContext.Provider value={contextValue}>
      {children}
      <ToastContainer
        toasts={toasts}
        position={finalConfig.position}
        onDismiss={removeToast}
        onAction={handleToastAction}
      />
    </ToastContext.Provider>
  )
}

/**
 * Hook to use toast notifications
 */
export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}

/**
 * Hook for network status toasts
 */
export function useNetworkToasts() {
  const toast = useToast()
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [hasShownOffline, setHasShownOffline] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      if (hasShownOffline) {
        toast.showNetworkRestored()
        setHasShownOffline(false)
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      setHasShownOffline(true)
      toast.showNetworkError()
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [toast, hasShownOffline])

  return { isOnline }
}

export default ToastProvider