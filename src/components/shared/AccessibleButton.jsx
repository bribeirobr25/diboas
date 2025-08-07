/**
 * Accessible Button Component
 * Enhanced button with full accessibility support
 */

import { forwardRef, useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button.jsx'
import { cn } from '@/lib/utils'
import { useReducedMotion, useAnnouncer } from '@/hooks/useAccessibility.jsx'
import { Loader2 } from 'lucide-react'

const AccessibleButton = forwardRef(({
  children,
  className,
  disabled = false,
  loading = false,
  loadingText = 'Loading...',
  ariaLabel,
  ariaDescribedBy,
  ariaExpanded,
  ariaControls,
  ariaPressed,
  onClick,
  variant = 'default',
  size = 'default',
  type = 'button',
  role = 'button',
  ...props
}, ref) => {
  const [isPressed, setIsPressed] = useState(false)
  const prefersReducedMotion = useReducedMotion()
  const { announce } = useAnnouncer()

  const handleClick = (e) => {
    if (disabled || loading) {
      e.preventDefault()
      return
    }

    // Announce action for screen readers
    if (loadingText && loading) {
      announce(loadingText, 'assertive')
    }

    onClick?.(e)
  }

  const handleKeyDown = (e) => {
    // Handle Enter and Space keys
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      setIsPressed(true)
      handleClick(e)
    }
  }

  const handleKeyUp = (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      setIsPressed(false)
    }
  }

  const buttonProps = {
    ref,
    type,
    role,
    disabled: disabled || loading,
    'aria-label': ariaLabel,
    'aria-describedby': ariaDescribedBy,
    'aria-expanded': ariaExpanded,
    'aria-controls': ariaControls,
    'aria-pressed': ariaPressed,
    'aria-busy': loading,
    'aria-disabled': disabled || loading,
    onClick: handleClick,
    onKeyDown: handleKeyDown,
    onKeyUp: handleKeyUp,
    onMouseDown: () => setIsPressed(true),
    onMouseUp: () => setIsPressed(false),
    onMouseLeave: () => setIsPressed(false),
    className: cn(
      // Base styles
      'relative focus:outline-none focus:ring-2 focus:ring-offset-2',
      // Focus visible styles for keyboard navigation
      'focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:ring-offset-2',
      // High contrast mode support
      '@media (prefers-contrast: high) { border: 2px solid }',
      // Pressed state
      isPressed && !disabled && !loading && 'transform scale-95',
      // Loading state
      loading && 'cursor-wait',
      className
    ),
    ...props
  }

  const content = (
    <>
      {loading && (
        <span className="flex items-center">
          <Loader2 className="w-4 h-4 mr-2 animate-spin" aria-hidden="true" />
          <span className="sr-only">{loadingText}</span>
        </span>
      )}
      {children}
    </>
  )

  // Use motion only if user doesn't prefer reduced motion
  if (!prefersReducedMotion) {
    return (
      <motion.div
        whileHover={!disabled && !loading ? { scale: 1.02 } : {}}
        whileTap={!disabled && !loading ? { scale: 0.98 } : {}}
        transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      >
        <Button
          variant={variant}
          size={size}
          {...buttonProps}
        >
          {content}
        </Button>
      </motion.div>
    )
  }

  return (
    <Button
      variant={variant}
      size={size}
      {...buttonProps}
    >
      {content}
    </Button>
  )
})

AccessibleButton.displayName = 'AccessibleButton'

export default AccessibleButton

// Specialized accessible buttons
export const PrimaryButton = forwardRef((props, ref) => (
  <AccessibleButton ref={ref} variant="default" {...props} />
))

export const SecondaryButton = forwardRef((props, ref) => (
  <AccessibleButton ref={ref} variant="secondary" {...props} />
))

export const OutlineButton = forwardRef((props, ref) => (
  <AccessibleButton ref={ref} variant="outline" {...props} />
))

export const DestructiveButton = forwardRef((props, ref) => (
  <AccessibleButton ref={ref} variant="destructive" {...props} />
))

export const GhostButton = forwardRef((props, ref) => (
  <AccessibleButton ref={ref} variant="ghost" {...props} />
))

export const LinkButton = forwardRef((props, ref) => (
  <AccessibleButton ref={ref} variant="link" {...props} />
))

// Icon button with proper accessibility
export const IconButton = forwardRef(({
  icon: Icon,
  children,
  ariaLabel,
  size = 'default',
  ...props
}, ref) => {
  if (!ariaLabel && !children) {
    console.warn('IconButton requires either ariaLabel or children for accessibility')
  }

  return (
    <AccessibleButton
      ref={ref}
      size={size}
      ariaLabel={ariaLabel}
      className={cn(
        children ? '' : 'p-2', // Remove padding if no text content
        props.className
      )}
      {...props}
    >
      {Icon && (
        <Icon 
          className={cn(
            'w-4 h-4',
            children && 'mr-2' // Add margin if there's text
          )}
          aria-hidden="true"
        />
      )}
      {children}
    </AccessibleButton>
  )
})

// Toggle button with proper ARIA states
export const ToggleButton = forwardRef(({
  pressed,
  onPressedChange,
  children,
  ariaLabel,
  ...props
}, ref) => {
  const handleClick = () => {
    onPressedChange?.(!pressed)
  }

  return (
    <AccessibleButton
      ref={ref}
      onClick={handleClick}
      ariaPressed={pressed}
      ariaLabel={ariaLabel}
      className={cn(
        pressed && 'bg-purple-100 text-purple-800 border-purple-300',
        props.className
      )}
      {...props}
    >
      {children}
    </AccessibleButton>
  )
})

// Menu button with proper ARIA attributes
export const MenuButton = forwardRef(({
  isOpen,
  onToggle,
  menuId,
  children,
  ...props
}, ref) => {
  return (
    <AccessibleButton
      ref={ref}
      onClick={onToggle}
      ariaExpanded={isOpen}
      ariaControls={menuId}
      ariaHaspopup="true"
      {...props}
    >
      {children}
    </AccessibleButton>
  )
})

PrimaryButton.displayName = 'PrimaryButton'
SecondaryButton.displayName = 'SecondaryButton'
OutlineButton.displayName = 'OutlineButton'
DestructiveButton.displayName = 'DestructiveButton'
GhostButton.displayName = 'GhostButton'
LinkButton.displayName = 'LinkButton'
IconButton.displayName = 'IconButton'
ToggleButton.displayName = 'ToggleButton'
MenuButton.displayName = 'MenuButton'