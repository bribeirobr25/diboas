/**
 * Virtualized Transaction List Component
 * Optimizes rendering of large transaction lists for better performance
 */

import { memo, useMemo } from 'react'
import { useVirtualScrolling } from '../utils/performanceOptimizations.js'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  ArrowUpRight, 
  ArrowDownLeft, 
  TrendingUp, 
  Star 
} from 'lucide-react'

// PERFORMANCE: Memoized transaction item to prevent unnecessary re-renders
const TransactionItem = memo(({ transaction, style }) => {
  const getTransactionIcon = (type) => {
    switch (type) {
      case 'received':
        return <ArrowDownLeft className="w-4 h-4 text-green-600" />
      case 'sent':
        return <ArrowUpRight className="w-4 h-4 text-red-600" />
      case 'investment':
        return <TrendingUp className="w-4 h-4 text-blue-600" />
      case 'rewards':
        return <Star className="w-4 h-4 text-yellow-600" />
      default:
        return <ArrowUpRight className="w-4 h-4 text-gray-600" />
    }
  }

  const getAmountColor = (type) => {
    switch (type) {
      case 'received':
      case 'rewards':
        return 'text-green-600'
      case 'sent':
      case 'investment':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusBadge = (status) => {
    const variants = {
      completed: 'default',
      pending: 'secondary',
      failed: 'destructive'
    }
    return (
      <Badge variant={variants[status] || 'secondary'} className="text-xs">
        {status}
      </Badge>
    )
  }

  return (
    <div style={style} className="px-4">
      <Card className="mb-2">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {getTransactionIcon(transaction.type)}
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <p className="font-medium text-sm">{transaction.description}</p>
                  {transaction.status && getStatusBadge(transaction.status)}
                </div>
                <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                  <span>{transaction.time}</span>
                  {transaction.id && (
                    <>
                      <span>•</span>
                      <span>ID: {transaction.id.slice(-8)}</span>
                    </>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className={`font-semibold text-sm ${getAmountColor(transaction.type)}`}>
                {transaction.amount}
              </div>
              {transaction.fee && (
                <div className="text-xs text-gray-500">
                  Fee: {transaction.fee}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
})

/**
 * VirtualizedTransactionList Component
 * Uses virtual scrolling to efficiently render large lists of transactions
 */
const VirtualizedTransactionList = ({ 
  transactions = [], 
  itemHeight = 80, 
  containerHeight = 400,
  onTransactionClick,
  loading = false,
  emptyMessage = "No transactions found"
}) => {
  // PERFORMANCE: Memoize sorted transactions to prevent unnecessary re-sorting
  const sortedTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      // Sort by timestamp if available, otherwise by ID
      if (a.timestamp && b.timestamp) {
        return new Date(b.timestamp) - new Date(a.timestamp)
      }
      return b.id - a.id
    })
  }, [transactions])

  // PERFORMANCE: Use virtual scrolling for large lists
  const {
    visibleItems,
    totalHeight,
    offsetY,
    onScroll
  } = useVirtualScrolling(sortedTransactions, itemHeight, containerHeight)

  // Show loading state
  if (loading) {
    return (
      <div className="space-y-2" style={{ height: containerHeight }}>
        {Array.from({ length: 5 }).map((_, index) => (
          <Card key={index} className="animate-pulse">
            <CardContent className="p-4">
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                </div>
                <div className="h-4 bg-gray-200 rounded w-20"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // Show empty state
  if (sortedTransactions.length === 0) {
    return (
      <div 
        className="flex items-center justify-center text-gray-500 text-sm"
        style={{ height: containerHeight }}
      >
        {emptyMessage}
      </div>
    )
  }

  // For small lists, render normally without virtualization
  if (sortedTransactions.length <= 20) {
    return (
      <div className="space-y-2" style={{ maxHeight: containerHeight, overflowY: 'auto' }}>
        {sortedTransactions.map((transaction) => (
          <div 
            key={transaction.id}
            onClick={() => onTransactionClick?.(transaction)}
            className="cursor-pointer"
          >
            <TransactionItem transaction={transaction} />
          </div>
        ))}
      </div>
    )
  }

  // Virtualized rendering for large lists
  return (
    <div 
      className="relative overflow-auto"
      style={{ height: containerHeight }}
      onScroll={onScroll}
    >
      {/* Total height container to maintain scroll area */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* Visible items container */}
        <div style={{ transform: `translateY(${offsetY}px)` }}>
          {visibleItems.map((transaction) => (
            <div
              key={transaction.id}
              onClick={() => onTransactionClick?.(transaction)}
              className="cursor-pointer"
            >
              <TransactionItem 
                transaction={transaction}
                style={{ height: itemHeight }}
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Performance indicator for development */}
      {(typeof process !== 'undefined' && process?.env?.NODE_ENV === 'development') && (
        <div className="absolute top-2 right-2 text-xs bg-black bg-opacity-50 text-white px-2 py-1 rounded">
          Showing {visibleItems.length} of {sortedTransactions.length}
        </div>
      )}
    </div>
  )
}

// PERFORMANCE: Memoize the entire component to prevent unnecessary re-renders
export default memo(VirtualizedTransactionList)