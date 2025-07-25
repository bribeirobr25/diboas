/**
 * Transaction Display Helper Functions
 * Semantic utility functions for formatting and displaying transaction data
 */

import { TransactionType, TransactionDisplayType, FinancialTransaction, TransactionDisplayData } from '../types/transactionTypes'

// Semantic utility functions with descriptive names
export const calculateDisplayAmountWithSign = (
  transactionType: TransactionType, 
  originalAmount: number, 
  netAmountAfterFees?: number
): string => {
  const isIncomingTransaction = [TransactionType.ADD, TransactionType.RECEIVE].includes(transactionType)
  const transactionSign = isIncomingTransaction ? '+' : '-'
  
  // For incoming transactions, show net amount (after fees)
  // For outgoing transactions, show original amount (before fees)
  const displayAmount = isIncomingTransaction 
    ? (netAmountAfterFees || originalAmount) 
    : originalAmount
    
  return `${transactionSign}$${parseFloat(displayAmount.toString()).toFixed(2)}`
}

export const formatRelativeTimeFromTimestamp = (transactionTimestamp: string): string => {
  const currentTime = new Date()
  const transactionTime = new Date(transactionTimestamp)
  const timeDifferenceInMinutes = Math.floor((currentTime.getTime() - transactionTime.getTime()) / (1000 * 60))
  
  if (timeDifferenceInMinutes < 1) return 'Just now'
  if (timeDifferenceInMinutes < 60) return `${timeDifferenceInMinutes}m ago`
  if (timeDifferenceInMinutes < 1440) return `${Math.floor(timeDifferenceInMinutes / 60)}h ago`
  return `${Math.floor(timeDifferenceInMinutes / 1440)}d ago`
}

export const formatHumanReadableDate = (transactionTimestamp: string): string => {
  const transactionDate = new Date(transactionTimestamp)
  return transactionDate.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })
}

export const determineTransactionDisplayType = (transactionType: TransactionType): TransactionDisplayType => {
  const incomingTransactionTypes = [TransactionType.ADD, TransactionType.RECEIVE]
  const investmentTransactionTypes = [TransactionType.BUY, TransactionType.SELL]
  
  if (incomingTransactionTypes.includes(transactionType)) {
    return TransactionDisplayType.INCOMING
  } else if (investmentTransactionTypes.includes(transactionType)) {
    return TransactionDisplayType.INVESTMENT
  } else {
    return TransactionDisplayType.OUTGOING
  }
}

export const generateHumanReadableTransactionDescription = (
  transactionType: TransactionType,
  monetaryAmount: number,
  cryptocurrencyAsset?: string,
  paymentMethodUsed?: string
): string => {
  switch (transactionType) {
    case TransactionType.ADD:
      return `Added $${monetaryAmount} using ${paymentMethodUsed || 'payment method'}`
    case TransactionType.SEND:
      return `Sent $${monetaryAmount} to user`
    case TransactionType.RECEIVE:
      return `Received $${monetaryAmount} from user`
    case TransactionType.WITHDRAW:
      return `Withdrew $${monetaryAmount} to ${paymentMethodUsed || 'bank account'}`
    case TransactionType.BUY:
      return `Bought $${monetaryAmount} worth of ${cryptocurrencyAsset || 'cryptocurrency'}`
    case TransactionType.SELL:
      return `Sold $${monetaryAmount} worth of ${cryptocurrencyAsset || 'cryptocurrency'}`
    case TransactionType.TRANSFER:
      return `Transferred $${monetaryAmount} to external wallet`
    default:
      return `${transactionType} transaction of $${monetaryAmount}`
  }
}