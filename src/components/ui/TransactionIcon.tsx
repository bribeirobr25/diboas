/**
 * Semantic Transaction Icon Component
 * Combines Tailwind utilities with semantic component structure
 */

import React from 'react'
import { 
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign
} from 'lucide-react'
import { TransactionType } from '../../types/transactionTypes'

// Semantic CSS classes using Tailwind utilities
const transactionIconStyles = {
  // Base icon styles
  baseIcon: 'w-4 h-4',
  largeIcon: 'w-6 h-6',
  
  // Transaction type color schemes
  incomingTransaction: 'text-green-600',
  outgoingTransaction: 'text-red-600',
  investmentTransaction: 'text-purple-600',
  tradingTransaction: 'text-orange-600',
  transferTransaction: 'text-blue-600',
  defaultTransaction: 'text-gray-600',
  
  // Container styles
  iconContainer: 'p-2 bg-gray-100 rounded-full',
  iconContainerLarge: 'p-3 bg-gray-100 rounded-full'
}

interface TransactionIconProps {
  transactionType: TransactionType
  iconSize?: 'small' | 'large'
  className?: string
}

const TransactionIcon: React.FC<TransactionIconProps> = ({ 
  transactionType, 
  iconSize = 'small',
  className = '' 
}) => {
  const getTransactionIconElement = (type: TransactionType) => {
    const iconSizeClass = iconSize === 'large' 
      ? transactionIconStyles.largeIcon 
      : transactionIconStyles.baseIcon

    switch (type) {
      case TransactionType.ADD:
        return (
          <ArrowDownLeft 
            className={`${iconSizeClass} ${transactionIconStyles.incomingTransaction}`} 
          />
        )
      case TransactionType.RECEIVE:
        return (
          <ArrowDownLeft 
            className={`${iconSizeClass} ${transactionIconStyles.incomingTransaction}`} 
          />
        )
      case TransactionType.SEND:
        return (
          <Send 
            className={`${iconSizeClass} ${transactionIconStyles.transferTransaction}`} 
          />
        )
      case TransactionType.WITHDRAW:
        return (
          <CreditCard 
            className={`${iconSizeClass} ${transactionIconStyles.outgoingTransaction}`} 
          />
        )
      case TransactionType.BUY:
        return (
          <TrendingUp 
            className={`${iconSizeClass} ${transactionIconStyles.investmentTransaction}`} 
          />
        )
      case TransactionType.SELL:
        return (
          <TrendingDown 
            className={`${iconSizeClass} ${transactionIconStyles.tradingTransaction}`} 
          />
        )
      case TransactionType.TRANSFER:
        return (
          <ArrowUpRight 
            className={`${iconSizeClass} ${transactionIconStyles.outgoingTransaction}`} 
          />
        )
      default:
        return (
          <DollarSign 
            className={`${iconSizeClass} ${transactionIconStyles.defaultTransaction}`} 
          />
        )
    }
  }

  const containerClass = iconSize === 'large' 
    ? transactionIconStyles.iconContainerLarge 
    : transactionIconStyles.iconContainer

  return (
    <div className={`${containerClass} ${className}`}>
      {getTransactionIconElement(transactionType)}
    </div>
  )
}

export default TransactionIcon
export { transactionIconStyles }