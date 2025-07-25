import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { 
  AlertCircle, 
  XCircle, 
  Wifi, 
  RefreshCw, 
  X 
} from 'lucide-react'

/**
 * Reusable error alert component with user-friendly messages
 * Provides clear error information and recovery actions
 */
export default function ErrorAlert({ 
  error, 
  onRetry = null, 
  onDismiss = null,
  className = '' 
}) {
  if (!error) return null

  const getErrorIcon = () => {
    switch (error.type) {
      case 'network_error':
        return <Wifi className="w-5 h-5 text-red-600" />
      case 'timeout':
        return <RefreshCw className="w-5 h-5 text-orange-600" />
      default:
        return <AlertCircle className="w-5 h-5 text-red-600" />
    }
  }

  const getErrorStyles = () => {
    switch (error.type) {
      case 'network_error':
        return 'border-red-200 bg-red-50'
      case 'timeout':
        return 'border-orange-200 bg-orange-50'
      case 'weak_password':
        return 'border-yellow-200 bg-yellow-50'
      default:
        return 'border-red-200 bg-red-50'
    }
  }

  const getTextColor = () => {
    switch (error.type) {
      case 'timeout':
        return 'text-orange-900'
      case 'weak_password':
        return 'text-yellow-900'
      default:
        return 'text-red-900'
    }
  }

  return (
    <Card className={`border ${getErrorStyles()} ${className}`}>
      <CardContent className="error-alert-content">
        <div className="error-alert-layout">
          <div className="error-alert-icon-container">
            {getErrorIcon()}
          </div>
          
          <div className="error-alert-body">
            <div className="error-alert-header">
              <div className="error-alert-text-section">
                <h3 className={`error-alert-title ${getTextColor()}`}>
                  {error.title}
                </h3>
                <p className={`error-alert-message ${getTextColor()}`}>
                  {error.message}
                </p>
              </div>
              
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="error-alert-dismiss-button"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {(onRetry && error.canRetry) && (
              <div className="error-alert-actions">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className={`error-alert-retry-button ${
                    error.type === 'timeout' 
                      ? 'border-orange-300 text-orange-700 hover:bg-orange-100' 
                      : error.type === 'weak_password'
                      ? 'border-yellow-300 text-yellow-700 hover:bg-yellow-100'
                      : 'border-red-300 text-red-700 hover:bg-red-100'
                  }`}
                >
                  <RefreshCw className="w-3 h-3 mr-1" />
                  {error.action}
                </Button>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}