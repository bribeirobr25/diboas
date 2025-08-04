/**
 * Enhanced Loading Screen Component
 * Provides better loading experience with progress indicators and helpful messages
 */

import { useState, useEffect } from 'react'
import { Progress } from '@/components/ui/progress.jsx'
import { Card } from '@/components/ui/card.jsx'
import { cn } from '@/lib/utils'
import {
  Loader2,
  Sparkles,
  Shield,
  Zap,
  TrendingUp,
  Coins,
  Activity
} from 'lucide-react'

const loadingMessages = [
  { text: "Securing your connection...", icon: Shield, duration: 2000 },
  { text: "Loading your portfolio...", icon: TrendingUp, duration: 2000 },
  { text: "Fetching latest prices...", icon: Coins, duration: 2000 },
  { text: "Optimizing performance...", icon: Zap, duration: 2000 },
  { text: "Almost there...", icon: Sparkles, duration: 2000 }
]

const loadingTips = [
  "💡 Tip: You can view your transaction history anytime from the dashboard",
  "💡 Tip: Enable two-factor authentication for enhanced security",
  "💡 Tip: Check out our yield strategies to maximize your returns",
  "💡 Tip: Use categories to organize your financial activities",
  "💡 Tip: Set up automated strategies for hands-free investing"
]

export default function EnhancedLoadingScreen({ 
  message = "Loading...", 
  showProgress = true,
  showTips = true,
  minimal = false,
  className 
}) {
  const [progress, setProgress] = useState(0)
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0)
  const [currentTip, setCurrentTip] = useState('')

  useEffect(() => {
    // Animate progress
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev // Stop at 90% to wait for actual completion
        return prev + Math.random() * 15
      })
    }, 500)

    // Rotate messages
    const messageInterval = setInterval(() => {
      setCurrentMessageIndex(prev => (prev + 1) % loadingMessages.length)
    }, 2000)

    // Select random tip
    if (showTips && !minimal) {
      setCurrentTip(loadingTips[Math.floor(Math.random() * loadingTips.length)])
    }

    return () => {
      clearInterval(progressInterval)
      clearInterval(messageInterval)
    }
  }, [showTips, minimal])

  const CurrentIcon = loadingMessages[currentMessageIndex].icon
  const currentMessage = message === "Loading..." ? loadingMessages[currentMessageIndex].text : message

  if (minimal) {
    return (
      <div className={cn("flex items-center justify-center p-8", className)}>
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-purple-600" />
          <p className="text-sm text-gray-600">{currentMessage}</p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-50 to-blue-50", className)}>
      <Card className="w-full max-w-md p-8 shadow-xl">
        <div className="space-y-6">
          {/* Animated Icon */}
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-200 rounded-full blur-xl animate-pulse" />
              <div className="relative bg-white rounded-full p-4 shadow-lg">
                <CurrentIcon className="w-12 h-12 text-purple-600 animate-pulse" />
              </div>
            </div>
          </div>

          {/* Loading Message */}
          <div className="text-center space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {currentMessage}
            </h3>
            <p className="text-sm text-gray-500">
              Please wait while we prepare your experience
            </p>
          </div>

          {/* Progress Bar */}
          {showProgress && (
            <div className="space-y-2">
              <Progress value={progress} className="h-2" />
              <p className="text-xs text-center text-gray-500">
                {Math.round(progress)}% complete
              </p>
            </div>
          )}

          {/* Loading Animation */}
          <div className="flex justify-center">
            <div className="flex space-x-2">
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-purple-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>

          {/* Tips */}
          {showTips && currentTip && (
            <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
              <p className="text-sm text-blue-800">{currentTip}</p>
            </div>
          )}
        </div>
      </Card>
    </div>
  )
}

// Specialized loading screens for different contexts
export function TransactionLoadingScreen() {
  return (
    <EnhancedLoadingScreen
      message="Processing your transaction..."
      showTips={false}
      className="min-h-[400px]"
    />
  )
}

export function PortfolioLoadingScreen() {
  return (
    <EnhancedLoadingScreen
      message="Loading your portfolio..."
      showProgress={true}
      showTips={true}
    />
  )
}

export function AuthLoadingScreen() {
  return (
    <EnhancedLoadingScreen
      message="Authenticating..."
      showProgress={false}
      showTips={false}
      minimal={true}
    />
  )
}