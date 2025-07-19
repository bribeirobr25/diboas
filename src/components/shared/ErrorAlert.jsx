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
      <CardContent className="p-4">
        <div className="flex items-start space-x-3">
          <div className="flex-shrink-0 mt-0.5">
            {getErrorIcon()}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h3 className={`font-medium text-sm ${getTextColor()}`}>
                  {error.title}
                </h3>
                <p className={`text-sm mt-1 ${getTextColor()} opacity-90`}>
                  {error.message}
                </p>
              </div>
              
              {onDismiss && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDismiss}
                  className="p-1 h-auto -mt-1 -mr-1 hover:bg-transparent"
                >
                  <X className="w-4 h-4" />
                </Button>
              )}
            </div>
            
            {(onRetry && error.canRetry) && (
              <div className="mt-3 flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onRetry}
                  className={`text-xs h-8 ${
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