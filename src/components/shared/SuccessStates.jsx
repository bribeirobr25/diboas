/**
 * Success States Component
 * Provides engaging success confirmations and celebrations
 */

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Button } from '@/components/ui/button.jsx'
import { Card } from '@/components/ui/card.jsx'
import { cn } from '@/lib/utils'
import {
  Check,
  CheckCircle,
  Trophy,
  Gift,
  Star,
  Sparkles,
  Heart,
  Download,
  Share,
  ArrowRight,
  Home,
  Eye
} from 'lucide-react'

const successConfigs = {
  transaction: {
    icon: CheckCircle,
    title: "Transaction Successful",
    description: "Your transaction has been processed successfully",
    primaryAction: "View Details",
    secondaryAction: "New Transaction",
    color: "green",
    celebration: true
  },
  registration: {
    icon: Gift,
    title: "Welcome aboard!",
    description: "Your account has been created successfully",
    primaryAction: "Get Started",
    secondaryAction: "Explore Features",
    color: "purple",
    celebration: true
  },
  investment: {
    icon: Trophy,
    title: "Investment Complete",
    description: "You've successfully invested in your portfolio",
    primaryAction: "View Portfolio",
    secondaryAction: "Invest More",
    color: "blue",
    celebration: true
  },
  upload: {
    icon: CheckCircle,
    title: "Upload Successful",
    description: "Your files have been uploaded successfully",
    primaryAction: "View Files",
    secondaryAction: "Upload More",
    color: "green"
  },
  save: {
    icon: Check,
    title: "Changes Saved",
    description: "Your changes have been saved successfully",
    primaryAction: "Continue",
    secondaryAction: "View Changes",
    color: "green"
  },
  achievement: {
    icon: Trophy,
    title: "Achievement Unlocked!",
    description: "You've reached a new milestone",
    primaryAction: "View Achievements",
    secondaryAction: "Share",
    color: "gold",
    celebration: true
  },
  default: {
    icon: CheckCircle,
    title: "Success!",
    description: "Operation completed successfully",
    primaryAction: "Continue",
    secondaryAction: "Go Home",
    color: "green"
  }
}

export default function SuccessState({
  type = 'default',
  title,
  description,
  primaryAction,
  secondaryAction,
  onPrimaryAction,
  onSecondaryAction,
  className,
  showCelebration = true,
  autoClose,
  onClose,
  minimal = false,
  children
}) {
  const [showConfetti, setShowConfetti] = useState(false)
  const [particles, setParticles] = useState([])

  const config = successConfigs[type] || successConfigs.default
  const Icon = config.icon
  
  const displayTitle = title || config.title
  const displayDescription = description || config.description
  const displayPrimaryAction = primaryAction || config.primaryAction
  const displaySecondaryAction = secondaryAction || config.secondaryAction

  useEffect(() => {
    if (showCelebration && config.celebration) {
      setShowConfetti(true)
      
      // Generate particles for celebration
      const newParticles = [...Array(20)].map((_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        rotation: Math.random() * 360,
        delay: Math.random() * 0.5
      }))
      setParticles(newParticles)

      const timer = setTimeout(() => {
        setShowConfetti(false)
        setParticles([])
      }, 3000)

      return () => clearTimeout(timer)
    }
  }, [showCelebration, config.celebration])

  useEffect(() => {
    if (autoClose && onClose) {
      const timer = setTimeout(onClose, autoClose)
      return () => clearTimeout(timer)
    }
  }, [autoClose, onClose])

  const colorVariants = {
    green: {
      bg: 'from-green-50 to-emerald-50',
      icon: 'text-green-500',
      primary: 'bg-green-600 hover:bg-green-700',
      secondary: 'text-green-600 hover:text-green-700 hover:bg-green-50',
      particle: 'bg-green-400'
    },
    blue: {
      bg: 'from-blue-50 to-cyan-50',
      icon: 'text-blue-500',
      primary: 'bg-blue-600 hover:bg-blue-700',
      secondary: 'text-blue-600 hover:text-blue-700 hover:bg-blue-50',
      particle: 'bg-blue-400'
    },
    purple: {
      bg: 'from-purple-50 to-pink-50',
      icon: 'text-purple-500',
      primary: 'bg-purple-600 hover:bg-purple-700',
      secondary: 'text-purple-600 hover:text-purple-700 hover:bg-purple-50',
      particle: 'bg-purple-400'
    },
    gold: {
      bg: 'from-yellow-50 to-orange-50',
      icon: 'text-yellow-500',
      primary: 'bg-yellow-600 hover:bg-yellow-700',
      secondary: 'text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50',
      particle: 'bg-yellow-400'
    }
  }

  const colors = colorVariants[config.color] || colorVariants.green

  if (minimal) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className={cn("text-center py-6", className)}
      >
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ duration: 0.5 }}
        >
          <Icon className={cn("w-8 h-8 mx-auto mb-3", colors.icon)} />
        </motion.div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{displayTitle}</h3>
        <p className="text-gray-600 mb-4">{displayDescription}</p>
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {onPrimaryAction && (
            <Button
              onClick={onPrimaryAction}
              size="sm"
              className={colors.primary}
            >
              {displayPrimaryAction}
            </Button>
          )}
          {onSecondaryAction && (
            <Button
              variant="outline"
              onClick={onSecondaryAction}
              size="sm"
              className={colors.secondary}
            >
              {displaySecondaryAction}
            </Button>
          )}
        </div>
      </motion.div>
    )
  }

  return (
    <Card className={cn("p-8 text-center relative overflow-hidden", className)}>
      {/* Celebration particles */}
      <AnimatePresence>
        {showConfetti && (
          <div className="absolute inset-0 pointer-events-none">
            {particles.map(particle => (
              <motion.div
                key={particle.id}
                className={cn("absolute w-3 h-3 rounded-full", colors.particle)}
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                }}
                initial={{ 
                  scale: 0, 
                  rotate: 0,
                  opacity: 1
                }}
                animate={{ 
                  scale: [0, 1, 0],
                  rotate: particle.rotation,
                  y: [-20, -100],
                  opacity: [1, 1, 0]
                }}
                transition={{
                  duration: 2,
                  delay: particle.delay,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        )}
      </AnimatePresence>

      <div className="max-w-md mx-auto space-y-6 relative z-10">
        {/* Success Icon with Animation */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ 
            type: "spring",
            stiffness: 200,
            damping: 15,
            delay: 0.1
          }}
          className="relative"
        >
          <div className={cn("absolute inset-0 bg-gradient-to-br rounded-full blur-3xl opacity-20", colors.bg)} />
          <div className={cn("relative bg-gradient-to-br rounded-full p-6 mx-auto w-fit", colors.bg)}>
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: config.celebration ? [0, 5, -5, 0] : 0
              }}
              transition={{ 
                duration: 1,
                repeat: config.celebration ? 2 : 0,
                delay: 0.3
              }}
            >
              <Icon className={cn("w-16 h-16", colors.icon)} />
            </motion.div>
          </div>

          {/* Sparkles for celebration */}
          {config.celebration && (
            <motion.div
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              {[...Array(8)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute"
                  style={{
                    left: `${20 + (i % 4) * 20}%`,
                    top: `${20 + Math.floor(i / 4) * 60}%`,
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    rotate: [0, 180, 360],
                    opacity: [0, 1, 0]
                  }}
                  transition={{
                    duration: 1.5,
                    delay: 0.7 + (i * 0.1),
                    repeat: 1
                  }}
                >
                  <Sparkles className={cn("w-4 h-4", colors.icon)} />
                </motion.div>
              ))}
            </motion.div>
          )}
        </motion.div>

        {/* Content */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="space-y-2"
        >
          <h3 className="text-2xl font-bold text-gray-900">{displayTitle}</h3>
          <p className="text-gray-600">{displayDescription}</p>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          {onPrimaryAction && (
            <motion.div
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Button
                onClick={onPrimaryAction}
                className={cn("shadow-lg", colors.primary)}
              >
                {type === 'transaction' && <Eye className="w-4 h-4 mr-2" />}
                {type === 'investment' && <ArrowRight className="w-4 h-4 mr-2" />}
                {type === 'upload' && <Download className="w-4 h-4 mr-2" />}
                {displayPrimaryAction}
              </Button>
            </motion.div>
          )}
          
          {onSecondaryAction && (
            <Button
              variant="outline"
              onClick={onSecondaryAction}
              className={colors.secondary}
            >
              {type === 'achievement' && <Share className="w-4 h-4 mr-2" />}
              {type === 'registration' && <Sparkles className="w-4 h-4 mr-2" />}
              {displaySecondaryAction}
            </Button>
          )}
        </motion.div>

        {/* Auto-close indicator */}
        {autoClose && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-sm text-gray-500"
          >
            This will close automatically in {Math.ceil(autoClose / 1000)} seconds
          </motion.div>
        )}

        {/* Additional content */}
        {children}
      </div>
    </Card>
  )
}

// Specialized success states
export function TransactionSuccess({ amount, onViewDetails, onNewTransaction }) {
  return (
    <SuccessState
      type="transaction"
      description={`Successfully processed ${amount}`}
      onPrimaryAction={onViewDetails}
      onSecondaryAction={onNewTransaction}
    />
  )
}

export function RegistrationSuccess({ onGetStarted, onExplore }) {
  return (
    <SuccessState
      type="registration"
      onPrimaryAction={onGetStarted}
      onSecondaryAction={onExplore}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-6 p-4 bg-purple-50 rounded-lg"
      >
        <p className="text-sm text-purple-800">
          <strong>🎉 Special welcome bonus:</strong> Get $10 credit for your first investment!
        </p>
      </motion.div>
    </SuccessState>
  )
}

export function InvestmentSuccess({ amount, onViewPortfolio, onInvestMore }) {
  return (
    <SuccessState
      type="investment"
      description={`Successfully invested ${amount} in your portfolio`}
      onPrimaryAction={onViewPortfolio}
      onSecondaryAction={onInvestMore}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="mt-6 grid grid-cols-3 gap-4 text-center"
      >
        <div>
          <div className="text-2xl font-bold text-blue-600">+2.3%</div>
          <div className="text-xs text-gray-500">Expected Return</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-green-600">Low</div>
          <div className="text-xs text-gray-500">Risk Level</div>
        </div>
        <div>
          <div className="text-2xl font-bold text-purple-600">5Y</div>
          <div className="text-xs text-gray-500">Time Horizon</div>
        </div>
      </motion.div>
    </SuccessState>
  )
}

export function AchievementSuccess({ achievement, onViewAchievements, onShare }) {
  return (
    <SuccessState
      type="achievement"
      title={`${achievement} Unlocked!`}
      onPrimaryAction={onViewAchievements}
      onSecondaryAction={onShare}
    />
  )
}