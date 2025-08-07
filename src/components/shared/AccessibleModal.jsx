/**
 * Accessible Modal Component
 * Modal with proper focus management, ARIA attributes, and keyboard navigation
 */

import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useFocusManagement, useReducedMotion } from '@/hooks/useAccessibility.jsx'
import { X } from 'lucide-react'
import AccessibleButton from './AccessibleButton.jsx'

export default function AccessibleModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  size = 'md',
  closeOnBackdrop = true,
  closeOnEscape = true,
  preventScroll = true,
  initialFocus,
  finalFocus,
  role = 'dialog',
  ariaLabelledby,
  ariaDescribedby,
  ...props
}) {
  const modalRef = useRef(null)
  const titleRef = useRef(null)
  const [portalRoot, setPortalRoot] = useState(null)
  const { trapFocus, saveFocus, restoreFocus, focusFirst } = useFocusManagement()
  const prefersReducedMotion = useReducedMotion()

  // Create portal root
  useEffect(() => {
    let root = document.getElementById('modal-root')
    if (!root) {
      root = document.createElement('div')
      root.id = 'modal-root'
      document.body.appendChild(root)
    }
    setPortalRoot(root)
  }, [])

  // Handle focus management
  useEffect(() => {
    if (isOpen && modalRef.current) {
      // Save current focus
      saveFocus()
      
      // Set up focus trap
      const cleanup = trapFocus(modalRef)
      
      // Focus initial element
      setTimeout(() => {
        if (initialFocus?.current) {
          initialFocus.current.focus()
        } else if (titleRef.current) {
          titleRef.current.focus()
        } else {
          focusFirst(modalRef)
        }
      }, 100)

      return cleanup
    } else if (!isOpen) {
      // Restore focus when modal closes
      if (finalFocus?.current) {
        finalFocus.current.focus()
      } else {
        restoreFocus()
      }
    }
  }, [isOpen, trapFocus, saveFocus, restoreFocus, focusFirst, initialFocus, finalFocus])

  // Handle body scroll
  useEffect(() => {
    if (isOpen && preventScroll) {
      const originalStyle = window.getComputedStyle(document.body).overflow
      document.body.style.overflow = 'hidden'
      
      return () => {
        document.body.style.overflow = originalStyle
      }
    }
  }, [isOpen, preventScroll])

  // Handle escape key
  useEffect(() => {
    if (isOpen && closeOnEscape) {
      const handleEscape = (e) => {
        if (e.key === 'Escape') {
          onClose()
        }
      }

      document.addEventListener('keydown', handleEscape)
      return () => document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, closeOnEscape, onClose])

  const handleBackdropClick = (e) => {
    if (closeOnBackdrop && e.target === e.currentTarget) {
      onClose()
    }
  }

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-full mx-4'
  }

  const modalVariants = {
    hidden: { 
      opacity: 0, 
      scale: prefersReducedMotion ? 1 : 0.95,
      y: prefersReducedMotion ? 0 : 20
    },
    visible: { 
      opacity: 1, 
      scale: 1,
      y: 0
    },
    exit: { 
      opacity: 0, 
      scale: prefersReducedMotion ? 1 : 0.95,
      y: prefersReducedMotion ? 0 : 20
    }
  }

  const backdropVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 }
  }

  if (!portalRoot) return null

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          variants={backdropVariants}
          initial="hidden"
          animate="visible"
          exit="exit"
          transition={{ duration: prefersReducedMotion ? 0 : 0.2 }}
        >
          {/* Backdrop */}
          <motion.div
            className="absolute inset-0 bg-black/50"
            onClick={handleBackdropClick}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Modal */}
          <motion.div
            ref={modalRef}
            role={role}
            aria-modal="true"
            aria-labelledby={ariaLabelledby || (title ? 'modal-title' : undefined)}
            aria-describedby={ariaDescribedby || (description ? 'modal-description' : undefined)}
            className={cn(
              'relative w-full bg-white rounded-lg shadow-xl',
              'focus:outline-none',
              sizeClasses[size],
              className
            )}
            variants={modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={{ 
              type: prefersReducedMotion ? 'tween' : 'spring',
              stiffness: 300,
              damping: 25,
              duration: prefersReducedMotion ? 0.2 : undefined
            }}
            {...props}
          >
            {/* Header */}
            {(title || onClose) && (
              <div className="flex items-center justify-between p-6 pb-0">
                {title && (
                  <h2
                    id="modal-title"
                    ref={titleRef}
                    className="text-xl font-semibold text-gray-900"
                    tabIndex={-1}
                  >
                    {title}
                  </h2>
                )}
                
                {onClose && (
                  <AccessibleButton
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                    ariaLabel="Close modal"
                    className="ml-auto"
                  >
                    <X className="w-4 h-4" aria-hidden="true" />
                  </AccessibleButton>
                )}
              </div>
            )}

            {/* Description */}
            {description && (
              <div className="px-6 pt-2">
                <p id="modal-description" className="text-sm text-gray-600">
                  {description}
                </p>
              </div>
            )}

            {/* Content */}
            <div className="p-6">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    portalRoot
  )
}

// Alert dialog variant
export function AlertDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "default", // "default" | "destructive"
  ...props
}) {
  const cancelRef = useRef(null)

  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      description={description}
      size="sm"
      role="alertdialog"
      initialFocus={cancelRef}
      {...props}
    >
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 mt-6">
        <AccessibleButton
          ref={cancelRef}
          variant="outline"
          onClick={onClose}
        >
          {cancelText}
        </AccessibleButton>
        
        <AccessibleButton
          variant={variant === "destructive" ? "destructive" : "default"}
          onClick={() => {
            onConfirm?.()
            onClose()
          }}
        >
          {confirmText}
        </AccessibleButton>
      </div>
    </AccessibleModal>
  )
}

// Confirmation dialog with specific styling
export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description = "This action cannot be undone.",
  confirmText = "Yes, continue",
  cancelText = "Cancel",
  ...props
}) {
  return (
    <AlertDialog
      isOpen={isOpen}
      onClose={onClose}
      onConfirm={onConfirm}
      title={title}
      description={description}
      confirmText={confirmText}
      cancelText={cancelText}
      variant="destructive"
      {...props}
    />
  )
}

// Loading modal
export function LoadingModal({
  isOpen,
  title = "Loading...",
  description,
  ...props
}) {
  return (
    <AccessibleModal
      isOpen={isOpen}
      onClose={() => {}} // No close function for loading modal
      title={title}
      description={description}
      size="sm"
      closeOnBackdrop={false}
      closeOnEscape={false}
      {...props}
    >
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
        <span className="sr-only">Loading content</span>
      </div>
    </AccessibleModal>
  )
}