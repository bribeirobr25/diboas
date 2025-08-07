/**
 * Accessible Form Components
 * Form elements with proper labeling, validation, and keyboard navigation
 */

import { forwardRef, useState, useRef, useId } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { useAnnouncer, useReducedMotion } from '@/hooks/useAccessibility.jsx'
import { AlertCircle, Check, Eye, EyeOff, Info } from 'lucide-react'

// Base form field wrapper
export const FormField = forwardRef(({
  children,
  label,
  description,
  error,
  success,
  required = false,
  className,
  ...props
}, ref) => {
  const fieldId = useId()
  const descriptionId = description ? `${fieldId}-description` : undefined
  const errorId = error ? `${fieldId}-error` : undefined
  const successId = success ? `${fieldId}-success` : undefined

  return (
    <div className={cn('space-y-2', className)} {...props}>
      {/* Label */}
      {label && (
        <label
          htmlFor={fieldId}
          className="block text-sm font-medium text-gray-700"
        >
          {label}
          {required && (
            <span className="text-red-500 ml-1" aria-label="required">
              *
            </span>
          )}
        </label>
      )}

      {/* Description */}
      {description && (
        <p
          id={descriptionId}
          className="text-sm text-gray-600"
        >
          {description}
        </p>
      )}

      {/* Form element with proper IDs and ARIA attributes */}
      <div className="relative">
        {typeof children === 'function' 
          ? children({
              id: fieldId,
              'aria-describedby': [descriptionId, errorId, successId]
                .filter(Boolean)
                .join(' ') || undefined,
              'aria-invalid': error ? 'true' : undefined,
              'aria-required': required ? 'true' : undefined,
            })
          : children
        }
      </div>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            id={errorId}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 text-red-600 text-sm"
            role="alert"
            aria-live="polite"
          >
            <AlertCircle className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success message */}
      <AnimatePresence>
        {success && (
          <motion.div
            id={successId}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 text-green-600 text-sm"
            role="status"
            aria-live="polite"
          >
            <Check className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
})

// Accessible input component
export const AccessibleInput = forwardRef(({
  type = 'text',
  className,
  error,
  success,
  disabled,
  ...props
}, ref) => {
  const [showPassword, setShowPassword] = useState(false)
  const inputType = type === 'password' && showPassword ? 'text' : type

  return (
    <div className="relative">
      <input
        ref={ref}
        type={inputType}
        disabled={disabled}
        className={cn(
          // Base styles
          'w-full px-3 py-2 border rounded-md shadow-sm',
          'placeholder-gray-400 text-gray-900',
          'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
          
          // State styles
          error && 'border-red-500 focus:ring-red-500',
          success && 'border-green-500 focus:ring-green-500',
          !error && !success && 'border-gray-300',
          
          // Disabled styles
          disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
          
          // High contrast support
          '@media (prefers-contrast: high) { border-width: 2px }',
          
          className
        )}
        {...props}
      />

      {/* Password toggle button */}
      {type === 'password' && (
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className={cn(
            'absolute right-3 top-1/2 transform -translate-y-1/2',
            'text-gray-400 hover:text-gray-600 focus:outline-none',
            'focus:ring-2 focus:ring-purple-500 rounded',
            disabled && 'cursor-not-allowed opacity-50'
          )}
          disabled={disabled}
          aria-label={showPassword ? 'Hide password' : 'Show password'}
        >
          {showPassword ? (
            <EyeOff className="w-5 h-5" aria-hidden="true" />
          ) : (
            <Eye className="w-5 h-5" aria-hidden="true" />
          )}
        </button>
      )}
    </div>
  )
})

// Accessible textarea
export const AccessibleTextarea = forwardRef(({
  className,
  error,
  success,
  disabled,
  rows = 4,
  ...props
}, ref) => {
  return (
    <textarea
      ref={ref}
      rows={rows}
      disabled={disabled}
      className={cn(
        // Base styles
        'w-full px-3 py-2 border rounded-md shadow-sm resize-vertical',
        'placeholder-gray-400 text-gray-900',
        'focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
        
        // State styles
        error && 'border-red-500 focus:ring-red-500',
        success && 'border-green-500 focus:ring-green-500',
        !error && !success && 'border-gray-300',
        
        // Disabled styles
        disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
        
        // High contrast support
        '@media (prefers-contrast: high) { border-width: 2px }',
        
        className
      )}
      {...props}
    />
  )
})

// Accessible select
export const AccessibleSelect = forwardRef(({
  options = [],
  placeholder = 'Select an option',
  className,
  error,
  success,
  disabled,
  ...props
}, ref) => {
  return (
    <select
      ref={ref}
      disabled={disabled}
      className={cn(
        // Base styles
        'w-full px-3 py-2 border rounded-md shadow-sm bg-white',
        'text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent',
        
        // State styles
        error && 'border-red-500 focus:ring-red-500',
        success && 'border-green-500 focus:ring-green-500',
        !error && !success && 'border-gray-300',
        
        // Disabled styles
        disabled && 'bg-gray-50 text-gray-500 cursor-not-allowed',
        
        // High contrast support
        '@media (prefers-contrast: high) { border-width: 2px }',
        
        className
      )}
      {...props}
    >
      {placeholder && (
        <option value="" disabled>
          {placeholder}
        </option>
      )}
      {options.map((option) => (
        <option
          key={option.value}
          value={option.value}
          disabled={option.disabled}
        >
          {option.label}
        </option>
      ))}
    </select>
  )
})

// Accessible checkbox
export const AccessibleCheckbox = forwardRef(({
  label,
  description,
  className,
  disabled,
  ...props
}, ref) => {
  const checkboxId = useId()

  return (
    <div className={cn('flex items-start space-x-3', className)}>
      <input
        ref={ref}
        id={checkboxId}
        type="checkbox"
        disabled={disabled}
        className={cn(
          'mt-1 h-4 w-4 text-purple-600 border-gray-300 rounded',
          'focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
          disabled && 'cursor-not-allowed opacity-50',
          '@media (prefers-contrast: high) { border-width: 2px }'
        )}
        {...props}
      />
      
      <div className="flex-1">
        {label && (
          <label
            htmlFor={checkboxId}
            className={cn(
              'text-sm font-medium text-gray-700 cursor-pointer',
              disabled && 'cursor-not-allowed opacity-50'
            )}
          >
            {label}
          </label>
        )}
        
        {description && (
          <p className={cn(
            'text-sm text-gray-600',
            disabled && 'opacity-50'
          )}>
            {description}
          </p>
        )}
      </div>
    </div>
  )
})

// Accessible radio group
export const AccessibleRadioGroup = forwardRef(({
  options = [],
  name,
  value,
  onChange,
  label,
  description,
  error,
  className,
  disabled,
  ...props
}, ref) => {
  const groupId = useId()
  const { announce } = useAnnouncer()

  const handleChange = (newValue) => {
    onChange?.(newValue)
    announce(`Selected ${options.find(opt => opt.value === newValue)?.label}`)
  }

  return (
    <fieldset
      className={cn('space-y-4', className)}
      disabled={disabled}
      {...props}
    >
      {label && (
        <legend className="text-sm font-medium text-gray-700">
          {label}
        </legend>
      )}
      
      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}
      
      <div
        role="radiogroup"
        aria-labelledby={label ? `${groupId}-legend` : undefined}
        className="space-y-2"
      >
        {options.map((option) => {
          const radioId = `${groupId}-${option.value}`
          const isChecked = value === option.value
          
          return (
            <div key={option.value} className="flex items-start space-x-3">
              <input
                id={radioId}
                name={name}
                type="radio"
                value={option.value}
                checked={isChecked}
                onChange={() => handleChange(option.value)}
                disabled={disabled || option.disabled}
                className={cn(
                  'mt-1 h-4 w-4 text-purple-600 border-gray-300',
                  'focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
                  (disabled || option.disabled) && 'cursor-not-allowed opacity-50',
                  '@media (prefers-contrast: high) { border-width: 2px }'
                )}
                aria-describedby={option.description ? `${radioId}-desc` : undefined}
              />
              
              <div className="flex-1">
                <label
                  htmlFor={radioId}
                  className={cn(
                    'text-sm font-medium text-gray-700 cursor-pointer',
                    (disabled || option.disabled) && 'cursor-not-allowed opacity-50'
                  )}
                >
                  {option.label}
                </label>
                
                {option.description && (
                  <p
                    id={`${radioId}-desc`}
                    className={cn(
                      'text-sm text-gray-600',
                      (disabled || option.disabled) && 'opacity-50'
                    )}
                  >
                    {option.description}
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>
      
      {error && (
        <div
          className="flex items-center space-x-2 text-red-600 text-sm"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="w-4 h-4" aria-hidden="true" />
          <span>{error}</span>
        </div>
      )}
    </fieldset>
  )
})

// Form section with proper heading structure
export const FormSection = forwardRef(({
  title,
  description,
  children,
  level = 2,
  className,
  ...props
}, ref) => {
  const HeadingTag = `h${level}`

  return (
    <section ref={ref} className={cn('space-y-6', className)} {...props}>
      {title && (
        <div className="space-y-2">
          <HeadingTag className="text-lg font-semibold text-gray-900">
            {title}
          </HeadingTag>
          {description && (
            <p className="text-sm text-gray-600">{description}</p>
          )}
        </div>
      )}
      {children}
    </section>
  )
})

// Help text component
export const HelpText = forwardRef(({
  children,
  icon = Info,
  className,
  ...props
}, ref) => {
  const Icon = icon

  return (
    <div
      ref={ref}
      className={cn(
        'flex items-start space-x-2 p-3 bg-blue-50 border border-blue-200 rounded-md',
        className
      )}
      {...props}
    >
      <Icon className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" aria-hidden="true" />
      <div className="text-sm text-blue-800">{children}</div>
    </div>
  )
})

// Set display names
FormField.displayName = 'FormField'
AccessibleInput.displayName = 'AccessibleInput'
AccessibleTextarea.displayName = 'AccessibleTextarea'
AccessibleSelect.displayName = 'AccessibleSelect'
AccessibleCheckbox.displayName = 'AccessibleCheckbox'
AccessibleRadioGroup.displayName = 'AccessibleRadioGroup'
FormSection.displayName = 'FormSection'
HelpText.displayName = 'HelpText'