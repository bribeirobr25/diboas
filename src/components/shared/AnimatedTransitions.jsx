/**
 * Animated Transitions Component
 * Provides smooth transitions and micro-interactions
 */

import { motion, AnimatePresence } from 'framer-motion'
import { cn } from '@/lib/utils'

// Fade transition
export function FadeTransition({ children, className, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Slide transition
export function SlideTransition({ children, direction = 'right', className, ...props }) {
  const directions = {
    right: { x: 20, y: 0 },
    left: { x: -20, y: 0 },
    up: { x: 0, y: -20 },
    down: { x: 0, y: 20 }
  }

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      exit={{ opacity: 0, ...directions[direction] }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Scale transition
export function ScaleTransition({ children, className, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Stagger children animation
export function StaggerTransition({ children, className, staggerDelay = 0.1, ...props }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: { opacity: 0 },
        visible: {
          opacity: 1,
          transition: {
            staggerChildren: staggerDelay
          }
        }
      }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Stagger item (use inside StaggerTransition)
export function StaggerItem({ children, className, ...props }) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0 }
      }}
      transition={{ duration: 0.3 }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Page transition wrapper
export function PageTransition({ children, className }) {
  return (
    <AnimatePresence mode="wait">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={cn(className)}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}

// Modal transition
export function ModalTransition({ children, isOpen, className, ...props }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center"
          {...props}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={cn(className)}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

// Hover animations
export function HoverScale({ children, scale = 1.05, className, ...props }) {
  return (
    <motion.div
      whileHover={{ scale }}
      whileTap={{ scale: scale - 0.03 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Button press animation
export function PressAnimation({ children, className, ...props }) {
  return (
    <motion.div
      whileTap={{ scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Counter animation
export function CounterAnimation({ value, className, ...props }) {
  return (
    <motion.span
      key={value}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className={cn(className)}
      {...props}
    >
      {value}
    </motion.span>
  )
}

// Progress animation
export function ProgressAnimation({ progress, className, ...props }) {
  return (
    <motion.div
      className={cn('bg-purple-600 h-full rounded-full', className)}
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      {...props}
    />
  )
}

// List item animation
export function ListItemAnimation({ children, index = 0, className, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Card hover animation
export function CardHover({ children, className, ...props }) {
  return (
    <motion.div
      whileHover={{ 
        y: -4,
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
      }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}

// Notification animation
export function NotificationAnimation({ children, className, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 300, scale: 0.3 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 500, scale: 0.5 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className={cn(className)}
      {...props}
    >
      {children}
    </motion.div>
  )
}