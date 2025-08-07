/**
 * Micro-interactions Component
 * Small interactive elements that provide feedback and delight
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'
import { 
  Heart, 
  Star, 
  ThumbsUp, 
  Check, 
  Copy, 
  Eye, 
  EyeOff,
  Bookmark,
  BookmarkCheck
} from 'lucide-react'

// Like button with heart animation
export function LikeButton({ isLiked, onToggle, className, ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onToggle}
      className={cn(
        'relative p-2 rounded-full transition-colors',
        isLiked ? 'text-red-500' : 'text-gray-400 hover:text-red-400',
        className
      )}
      {...props}
    >
      <motion.div
        animate={isLiked ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <Heart 
          className={cn(
            'w-5 h-5 transition-all',
            isLiked ? 'fill-current' : 'fill-none'
          )} 
        />
      </motion.div>
      
      {/* Particles animation on like */}
      {isLiked && (
        <motion.div
          className="absolute inset-0 pointer-events-none"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-1 h-1 bg-red-400 rounded-full"
              style={{
                left: '50%',
                top: '50%',
              }}
              initial={{ 
                scale: 0,
                x: 0,
                y: 0,
                opacity: 1 
              }}
              animate={{
                scale: [0, 1, 0],
                x: Math.cos(i * 60 * Math.PI / 180) * 20,
                y: Math.sin(i * 60 * Math.PI / 180) * 20,
                opacity: [1, 1, 0]
              }}
              transition={{
                duration: 0.6,
                delay: 0.1
              }}
            />
          ))}
        </motion.div>
      )}
    </motion.button>
  )
}

// Star rating with hover effects
export function StarRating({ rating, maxRating = 5, onRate, className }) {
  const [hoverRating, setHoverRating] = useState(0)

  return (
    <div className={cn('flex space-x-1', className)}>
      {[...Array(maxRating)].map((_, i) => {
        const starNumber = i + 1
        const isActive = starNumber <= (hoverRating || rating)
        
        return (
          <motion.button
            key={i}
            whileHover={{ scale: 1.2 }}
            whileTap={{ scale: 0.9 }}
            onMouseEnter={() => setHoverRating(starNumber)}
            onMouseLeave={() => setHoverRating(0)}
            onClick={() => onRate?.(starNumber)}
            className="focus:outline-none"
          >
            <Star
              className={cn(
                'w-5 h-5 transition-all duration-200',
                isActive 
                  ? 'text-yellow-400 fill-current' 
                  : 'text-gray-300 hover:text-yellow-300'
              )}
            />
          </motion.button>
        )
      })}
    </div>
  )
}

// Copy button with success animation
export function CopyButton({ text, className, ...props }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={handleCopy}
      className={cn(
        'relative p-2 rounded-md transition-colors',
        copied 
          ? 'text-green-600 bg-green-50' 
          : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50',
        className
      )}
      {...props}
    >
      <motion.div
        animate={copied ? { scale: [1, 1.3, 1] } : { scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        {copied ? (
          <Check className="w-4 h-4" />
        ) : (
          <Copy className="w-4 h-4" />
        )}
      </motion.div>
      
      {/* Success indicator */}
      {copied && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded whitespace-nowrap"
        >
          Copied!
        </motion.div>
      )}
    </motion.button>
  )
}

// Toggle button with smooth animation
export function ToggleButton({ isOn, onToggle, size = 'md', className, ...props }) {
  const sizes = {
    sm: { wrapper: 'w-8 h-5', thumb: 'w-3 h-3' },
    md: { wrapper: 'w-12 h-6', thumb: 'w-4 h-4' },
    lg: { wrapper: 'w-16 h-8', thumb: 'w-6 h-6' }
  }

  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className={cn(
        'relative rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
        sizes[size].wrapper,
        isOn ? 'bg-purple-600' : 'bg-gray-300',
        className
      )}
      {...props}
    >
      <motion.div
        className={cn(
          'absolute top-1 bg-white rounded-full shadow-md',
          sizes[size].thumb
        )}
        animate={{
          x: isOn ? `calc(100% + 0.25rem)` : '0.25rem'
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30
        }}
      />
    </motion.button>
  )
}

// Password visibility toggle
export function PasswordToggle({ isVisible, onToggle, className }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onToggle}
      className={cn('text-gray-400 hover:text-gray-600', className)}
      type="button"
    >
      <motion.div
        animate={{ rotateY: isVisible ? 180 : 0 }}
        transition={{ duration: 0.3 }}
      >
        {isVisible ? (
          <EyeOff className="w-5 h-5" />
        ) : (
          <Eye className="w-5 h-5" />
        )}
      </motion.div>
    </motion.button>
  )
}

// Bookmark button with animation
export function BookmarkButton({ isBookmarked, onToggle, className, ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      onClick={onToggle}
      className={cn(
        'relative p-2 rounded-full transition-colors',
        isBookmarked ? 'text-blue-500' : 'text-gray-400 hover:text-blue-400',
        className
      )}
      {...props}
    >
      <motion.div
        animate={isBookmarked ? { 
          scale: [1, 1.3, 1],
          rotate: [0, -10, 10, 0]
        } : { scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        {isBookmarked ? (
          <BookmarkCheck className="w-5 h-5 fill-current" />
        ) : (
          <Bookmark className="w-5 h-5" />
        )}
      </motion.div>
    </motion.button>
  )
}

// Floating action button
export function FloatingActionButton({ 
  children, 
  onClick, 
  className, 
  tooltip,
  ...props 
}) {
  const [showTooltip, setShowTooltip] = useState(false)

  return (
    <div className="relative">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={onClick}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        className={cn(
          'fixed bottom-6 right-6 bg-purple-600 text-white rounded-full p-4 shadow-lg hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2',
          className
        )}
        {...props}
      >
        {children}
      </motion.button>

      {/* Tooltip */}
      {tooltip && showTooltip && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed bottom-20 right-6 bg-gray-900 text-white text-sm px-3 py-2 rounded-lg whitespace-nowrap"
        >
          {tooltip}
        </motion.div>
      )}
    </div>
  )
}

// Progress circle with animation
export function ProgressCircle({ 
  progress, 
  size = 60, 
  strokeWidth = 4, 
  className 
}) {
  const radius = (size - strokeWidth) / 2
  const circumference = radius * 2 * Math.PI
  const offset = circumference - (progress / 100) * circumference

  return (
    <div className={cn('relative', className)} style={{ width: size, height: size }}>
      <svg
        className="transform -rotate-90"
        width={size}
        height={size}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-gray-200"
        />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeLinecap="round"
          className="text-purple-600"
          initial={{ strokeDashoffset: circumference }}
          animate={{ strokeDashoffset: offset }}
          transition={{ duration: 1, ease: "easeInOut" }}
          style={{
            strokeDasharray: circumference,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-semibold text-gray-700">
          {Math.round(progress)}%
        </span>
      </div>
    </div>
  )
}

// Ripple effect component
export function RippleEffect({ children, className, ...props }) {
  const [ripples, setRipples] = useState([])

  const addRipple = (event) => {
    const rect = event.currentTarget.getBoundingClientRect()
    const size = Math.max(rect.width, rect.height)
    const x = event.clientX - rect.left - size / 2
    const y = event.clientY - rect.top - size / 2
    
    const newRipple = {
      x,
      y,
      size,
      id: Date.now()
    }

    setRipples(prev => [...prev, newRipple])

    setTimeout(() => {
      setRipples(prev => prev.filter(ripple => ripple.id !== newRipple.id))
    }, 600)
  }

  return (
    <div
      className={cn('relative overflow-hidden', className)}
      onMouseDown={addRipple}
      {...props}
    >
      {children}
      {ripples.map(ripple => (
        <motion.span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
          initial={{ scale: 0, opacity: 1 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      ))}
    </div>
  )
}