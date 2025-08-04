/**
 * Empty State Component
 * Provides engaging empty states with clear CTAs
 */

import { Button } from '@/components/ui/button.jsx'
import { Card } from '@/components/ui/card.jsx'
import { cn } from '@/lib/utils'
import {
  Package,
  Plus,
  Search,
  FileText,
  Wallet,
  TrendingUp,
  Users,
  Activity,
  Target,
  Sparkles
} from 'lucide-react'

const emptyStateConfigs = {
  transactions: {
    icon: Activity,
    title: "No transactions yet",
    description: "Start building your financial journey by making your first transaction",
    action: "Make First Transaction",
    actionIcon: Plus,
    illustration: "transaction"
  },
  portfolio: {
    icon: TrendingUp,
    title: "Your portfolio is empty",
    description: "Begin investing to see your portfolio grow over time",
    action: "Start Investing",
    actionIcon: Plus,
    illustration: "portfolio"
  },
  strategies: {
    icon: Target,
    title: "No strategies configured",
    description: "Set up automated strategies to maximize your returns",
    action: "Create Strategy",
    actionIcon: Sparkles,
    illustration: "strategy"
  },
  search: {
    icon: Search,
    title: "No results found",
    description: "Try adjusting your search criteria or filters",
    action: "Clear Filters",
    actionIcon: null,
    illustration: "search"
  },
  wallet: {
    icon: Wallet,
    title: "No assets in wallet",
    description: "Add funds to start your investment journey",
    action: "Add Funds",
    actionIcon: Plus,
    illustration: "wallet"
  },
  default: {
    icon: Package,
    title: "Nothing here yet",
    description: "Get started by exploring available options",
    action: "Get Started",
    actionIcon: Plus,
    illustration: "default"
  }
}

export default function EmptyState({
  type = 'default',
  title,
  description,
  action,
  actionIcon,
  onAction,
  className,
  minimal = false,
  children
}) {
  const config = emptyStateConfigs[type] || emptyStateConfigs.default
  const Icon = config.icon
  const ActionIcon = actionIcon || config.actionIcon

  // Override with custom props
  const displayTitle = title || config.title
  const displayDescription = description || config.description
  const displayAction = action || config.action

  if (minimal) {
    return (
      <div className={cn("text-center py-12", className)}>
        <Icon className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600 mb-4">{displayTitle}</p>
        {onAction && (
          <Button onClick={onAction} variant="outline" size="sm">
            {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
            {displayAction}
          </Button>
        )}
      </div>
    )
  }

  return (
    <Card className={cn("p-8 text-center", className)}>
      <div className="max-w-sm mx-auto space-y-6">
        {/* Illustration */}
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-100 to-blue-100 rounded-full blur-3xl opacity-30" />
          <div className="relative bg-gradient-to-br from-purple-50 to-blue-50 rounded-full p-6 mx-auto w-fit">
            <Icon className="w-16 h-16 text-purple-600" />
          </div>
        </div>

        {/* Content */}
        <div className="space-y-2">
          <h3 className="text-xl font-semibold text-gray-900">{displayTitle}</h3>
          <p className="text-gray-600">{displayDescription}</p>
        </div>

        {/* Action */}
        {onAction && (
          <Button onClick={onAction} className="shadow-lg">
            {ActionIcon && <ActionIcon className="w-4 h-4 mr-2" />}
            {displayAction}
          </Button>
        )}

        {/* Additional content */}
        {children}
      </div>
    </Card>
  )
}

// Specialized empty states
export function TransactionEmptyState({ onAction }) {
  return (
    <EmptyState
      type="transactions"
      onAction={onAction}
    >
      <div className="mt-6 grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="bg-green-100 rounded-lg p-3 mb-2">
            <Plus className="w-6 h-6 text-green-600 mx-auto" />
          </div>
          <p className="text-xs text-gray-600">Add Funds</p>
        </div>
        <div className="text-center">
          <div className="bg-blue-100 rounded-lg p-3 mb-2">
            <Activity className="w-6 h-6 text-blue-600 mx-auto" />
          </div>
          <p className="text-xs text-gray-600">Transfer</p>
        </div>
        <div className="text-center">
          <div className="bg-purple-100 rounded-lg p-3 mb-2">
            <TrendingUp className="w-6 h-6 text-purple-600 mx-auto" />
          </div>
          <p className="text-xs text-gray-600">Invest</p>
        </div>
      </div>
    </EmptyState>
  )
}

export function SearchEmptyState({ query, onClear }) {
  return (
    <EmptyState
      type="search"
      title={`No results for "${query}"`}
      description="Try different keywords or clear your search"
      action="Clear Search"
      onAction={onClear}
      minimal
    />
  )
}

export function StrategyEmptyState({ onAction }) {
  return (
    <EmptyState
      type="strategies"
      onAction={onAction}
    >
      <div className="mt-6 bg-purple-50 rounded-lg p-4 text-left">
        <h4 className="font-medium text-purple-900 mb-2">Benefits of Automated Strategies:</h4>
        <ul className="space-y-1 text-sm text-purple-700">
          <li>• Maximize returns with optimized allocations</li>
          <li>• Save time with automated rebalancing</li>
          <li>• Reduce emotional trading decisions</li>
          <li>• Access professional-grade strategies</li>
        </ul>
      </div>
    </EmptyState>
  )
}