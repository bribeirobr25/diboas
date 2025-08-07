/**
 * Enhanced Form Validation Component
 * Provides inline validation feedback with animations
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Check, 
  X, 
  AlertCircle, 
  Eye, 
  EyeOff,
  Lock,
  Mail,
  User,
  Phone
} from 'lucide-react'

// Enhanced input with validation
export function ValidatedInput({
  type = 'text',
  placeholder,
  value,
  onChange,
  onBlur,
  validation,
  error,
  success,
  className,
  icon: Icon,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [validationState, setValidationState] = useState('idle') // idle, validating, valid, invalid

  useEffect(() => {
    if (validation && value) {
      setValidationState('validating')
      const timer = setTimeout(() => {
        const isValid = validation(value)
        setValidationState(isValid ? 'valid' : 'invalid')
      }, 300)
      return () => clearTimeout(timer)
    } else {
      setValidationState('idle')
    }
  }, [value, validation])

  const inputType = type === 'password' && showPassword ? 'text' : type
  const hasError = error || validationState === 'invalid'
  const hasSuccess = success || validationState === 'valid'

  return (
    <div className="space-y-2">
      <div className="relative">
        {/* Icon */}
        {Icon && (
          <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
            <Icon className="w-5 h-5" />
          </div>
        )}

        {/* Input */}
        <motion.input
          type={inputType}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          className={cn(
            'w-full px-4 py-3 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2',
            Icon && 'pl-12',
            (type === 'password' || hasError || hasSuccess) && 'pr-12',
            isFocused && 'ring-2 ring-purple-500/20 border-purple-500',
            hasError && 'border-red-500 focus:ring-red-500/20',
            hasSuccess && 'border-green-500 focus:ring-green-500/20',
            !isFocused && !hasError && !hasSuccess && 'border-gray-300',
            className
          )}
          {...props}
        />

        {/* Right side icons */}
        <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
          {/* Validation indicator */}
          <AnimatePresence>
            {validationState === 'validating' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-gray-400"
              >
                <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-600 rounded-full animate-spin" />
              </motion.div>
            )}
            {hasSuccess && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-green-500"
              >
                <Check className="w-4 h-4" />
              </motion.div>
            )}
            {hasError && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="text-red-500"
              >
                <AlertCircle className="w-4 h-4" />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Password toggle */}
          {type === 'password' && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error/Success message */}
      <AnimatePresence>
        {(error || (hasError && validation)) && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 text-red-600 text-sm"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{error || 'Please enter a valid value'}</span>
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 text-green-600 text-sm"
          >
            <Check className="w-4 h-4" />
            <span>{success}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Password strength indicator
export function PasswordStrengthIndicator({ password, className }) {
  const [strength, setStrength] = useState(0)
  const [requirements, setRequirements] = useState({
    length: false,
    uppercase: false,
    lowercase: false,
    number: false,
    special: false
  })

  useEffect(() => {
    const newRequirements = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /\d/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    }
    setRequirements(newRequirements)

    const score = Object.values(newRequirements).filter(Boolean).length
    setStrength(score)
  }, [password])

  const strengthLabels = ['Very Weak', 'Weak', 'Fair', 'Good', 'Strong']
  const strengthColors = ['bg-red-500', 'bg-orange-500', 'bg-yellow-500', 'bg-blue-500', 'bg-green-500']

  return (
    <div className={cn('space-y-3', className)}>
      {/* Strength bars */}
      <div className="flex space-x-1">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className={cn(
              'h-2 flex-1 rounded-full transition-colors duration-300',
              i < strength ? strengthColors[strength - 1] : 'bg-gray-200'
            )}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: i < strength ? 1 : 0 }}
            transition={{ delay: i * 0.1 }}
          />
        ))}
      </div>

      {/* Strength label */}
      {strength > 0 && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className={cn(
            'text-sm font-medium',
            strength <= 2 ? 'text-red-600' : 
            strength <= 3 ? 'text-yellow-600' : 'text-green-600'
          )}
        >
          Password strength: {strengthLabels[strength - 1]}
        </motion.p>
      )}

      {/* Requirements checklist */}
      <AnimatePresence>
        {password && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="space-y-2"
          >
            {Object.entries(requirements).map(([key, met]) => (
              <motion.div
                key={key}
                className="flex items-center space-x-2 text-sm"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 }}
              >
                <div className={cn(
                  'w-4 h-4 rounded-full flex items-center justify-center',
                  met ? 'bg-green-500 text-white' : 'bg-gray-200'
                )}>
                  {met && <Check className="w-3 h-3" />}
                </div>
                <span className={met ? 'text-green-600' : 'text-gray-500'}>
                  {key === 'length' && 'At least 8 characters'}
                  {key === 'uppercase' && 'One uppercase letter'}
                  {key === 'lowercase' && 'One lowercase letter'}
                  {key === 'number' && 'One number'}
                  {key === 'special' && 'One special character'}
                </span>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Form field with floating label
export function FloatingLabelInput({
  type = 'text',
  placeholder,
  value,
  onChange,
  error,
  className,
  icon: Icon,
  ...props
}) {
  const [isFocused, setIsFocused] = useState(false)
  const hasValue = value && value.length > 0
  const shouldFloat = isFocused || hasValue

  return (
    <div className="relative">
      {/* Icon */}
      {Icon && (
        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 z-10">
          <Icon className="w-5 h-5" />
        </div>
      )}

      {/* Input */}
      <input
        type={type}
        value={value}
        onChange={onChange}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className={cn(
          'w-full px-4 py-4 border rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500 peer',
          Icon && 'pl-12',
          error && 'border-red-500 focus:ring-red-500/20',
          !error && 'border-gray-300',
          className
        )}
        {...props}
      />

      {/* Floating label */}
      <motion.label
        className={cn(
          'absolute left-4 pointer-events-none transition-all duration-200',
          Icon && 'left-12',
          shouldFloat 
            ? 'top-2 text-xs text-purple-600 font-medium' 
            : 'top-1/2 transform -translate-y-1/2 text-gray-500',
          error && shouldFloat && 'text-red-600'
        )}
        animate={{
          y: shouldFloat ? -12 : 0,
          scale: shouldFloat ? 0.875 : 1,
        }}
        transition={{ duration: 0.2 }}
      >
        {placeholder}
      </motion.label>

      {/* Error message */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex items-center space-x-2 text-red-600 text-sm mt-2"
          >
            <AlertCircle className="w-4 h-4" />
            <span>{error}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// Real-time validation patterns
export const validationRules = {
  email: (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  },
  
  password: (password) => {
    return password.length >= 8 &&
           /[A-Z]/.test(password) &&
           /[a-z]/.test(password) &&
           /\d/.test(password) &&
           /[!@#$%^&*(),.?":{}|<>]/.test(password)
  },
  
  phone: (phone) => {
    const phoneRegex = /^\+?[\d\s\-\(\)]{10,}$/
    return phoneRegex.test(phone)
  },
  
  required: (value) => {
    return value && value.trim().length > 0
  },
  
  minLength: (min) => (value) => {
    return value && value.length >= min
  },
  
  maxLength: (max) => (value) => {
    return !value || value.length <= max
  }
}

// Preset input components
export function EmailInput(props) {
  return (
    <ValidatedInput
      type="email"
      placeholder="Email address"
      icon={Mail}
      validation={validationRules.email}
      {...props}
    />
  )
}

export function PasswordInput(props) {
  return (
    <ValidatedInput
      type="password"
      placeholder="Password"
      icon={Lock}
      validation={validationRules.password}
      {...props}
    />
  )
}

export function PhoneInput(props) {
  return (
    <ValidatedInput
      type="tel"
      placeholder="Phone number"
      icon={Phone}
      validation={validationRules.phone}
      {...props}
    />
  )
}

export function NameInput(props) {
  return (
    <ValidatedInput
      type="text"
      placeholder="Full name"
      icon={User}
      validation={validationRules.required}
      {...props}
    />
  )
}