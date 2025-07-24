/**
 * Loading Spinner Component
 * Reusable loading indicator with different sizes and variants
 */

import { cn } from "@/lib/utils"

const LoadingSpinner = ({ 
  size = "default", 
  variant = "default", 
  className,
  children 
}) => {
  const sizeClasses = {
    sm: "w-4 h-4",
    default: "w-6 h-6", 
    lg: "w-8 h-8",
    xl: "w-12 h-12"
  }
  
  const variantClasses = {
    default: "text-primary",
    muted: "text-muted-foreground",
    white: "text-white",
    success: "text-green-600",
    warning: "text-yellow-600",
    error: "text-red-600"
  }

  return (
    <div className={cn("flex items-center justify-center", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-2 border-current border-t-transparent",
          sizeClasses[size],
          variantClasses[variant]
        )}
        role="status"
        aria-label="Loading"
      >
        <span className="sr-only">Loading...</span>
      </div>
      {children && (
        <span className="ml-2 text-sm text-muted-foreground">
          {children}
        </span>
      )}
    </div>
  )
}

export { LoadingSpinner }