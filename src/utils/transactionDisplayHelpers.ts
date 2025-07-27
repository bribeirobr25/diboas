/**
 * Transaction Display Helper Functions
 * Semantic utility functions for formatting and displaying transaction data
 */

import { TransactionType, TransactionDisplayType, FinancialTransaction, TransactionDisplayData } from '../types/transactionTypes'

// Semantic utility functions with descriptive names
export const calculateDisplayAmountWithSign = (
  transactionType: TransactionType, 
  originalAmount: number, 
  netAmountAfterFees?: number,
  paymentMethod?: string,
  toAsset?: string,
  toAmount?: number
): string => {
  // Buy transactions now show positive values
  const isIncomingTransaction = [
    TransactionType.ADD, 
    TransactionType.RECEIVE,
    TransactionType.BUY, // Buy is now considered incoming/positive
    TransactionType.SELL // Sell shows positive proceeds
  ].includes(transactionType)
  
  // Special handling for buy transactions
  if (transactionType === TransactionType.BUY) {
    // If we have toAsset and toAmount (exchange), show what was gained
    if (toAsset && toAmount) {
      return `+${toAmount} ${toAsset}`
    }
    // Otherwise show the USD value as positive
    return `+$${parseFloat(originalAmount.toString()).toFixed(2)}`
  }
  
  // Special handling for sell transactions (show proceeds)
  if (transactionType === TransactionType.SELL) {
    const proceeds = netAmountAfterFees || originalAmount
    return `+$${parseFloat(proceeds.toString()).toFixed(2)}`
  }
  
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
  paymentMethodUsed?: string,
  fromAsset?: string,
  fromAmount?: number,
  toAsset?: string,
  toAmount?: number
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
      // Enhanced buy descriptions
      if (paymentMethodUsed === 'diboas_wallet' && fromAsset && toAsset && toAmount) {
        // On-chain exchange
        return `Exchanged ${fromAmount || monetaryAmount} ${fromAsset} → ${toAmount} ${toAsset}`
      } else if (paymentMethodUsed && paymentMethodUsed !== 'diboas_wallet') {
        // On-ramp purchase
        return `Bought ${cryptocurrencyAsset || 'cryptocurrency'} via ${paymentMethodUsed}`
      }
      return `Bought $${monetaryAmount} worth of ${cryptocurrencyAsset || 'cryptocurrency'}`
    case TransactionType.SELL:
      // Enhanced sell description - show as exchange like buy on-chain
      if (fromAsset && fromAmount && toAmount) {
        return `Exchanged ${fromAmount} ${fromAsset} → $${toAmount}`
      } else if (fromAsset && fromAmount) {
        return `Exchanged ${fromAmount} ${fromAsset} → $${monetaryAmount}`
      }
      return `Sold ${cryptocurrencyAsset || 'cryptocurrency'} for $${monetaryAmount}`
    case TransactionType.TRANSFER:
      return `Transferred $${monetaryAmount} to external wallet`
    default:
      return `${transactionType} transaction of $${monetaryAmount}`
  }
}

// New helper to determine if transaction should be split in advanced mode
export const shouldSplitTransactionInAdvancedMode = (
  transactionType: TransactionType,
  paymentMethod?: string
): boolean => {
  // Only split on-chain buy/sell transactions in advanced mode
  return (
    (transactionType === TransactionType.BUY && paymentMethod === 'diboas_wallet') ||
    transactionType === TransactionType.SELL
  )
}

// Helper to create split transactions for advanced mode
export const createSplitTransactionsForAdvancedMode = (transaction: any) => {
  const splitTransactions = []
  
  if (transaction.type === TransactionType.BUY && transaction.paymentMethod === 'diboas_wallet') {
    // First part: Send to DEX
    splitTransactions.push({
      ...transaction,
      id: `${transaction.id}_send`,
      splitId: 'send_to_dex',
      description: `Sent ${transaction.fromAmount || transaction.amount} ${transaction.fromAsset || 'USDC'} to DEX`,
      amount: transaction.fromAmount || transaction.amount,
      displayAmount: `-${transaction.fromAmount || transaction.amount} ${transaction.fromAsset || 'USDC'}`,
      type: 'exchange_send',
      originalType: TransactionType.BUY,
      icon: 'send'
    })
    
    // Second part: Receive from DEX
    splitTransactions.push({
      ...transaction,
      id: `${transaction.id}_receive`,
      splitId: 'receive_from_dex',
      description: `Received ${transaction.toAmount} ${transaction.toAsset || transaction.asset} from DEX`,
      amount: transaction.toAmount,
      displayAmount: `+${transaction.toAmount} ${transaction.toAsset || transaction.asset}`,
      type: 'exchange_receive',
      originalType: TransactionType.BUY,
      icon: 'receive'
    })
  } else if (transaction.type === TransactionType.SELL) {
    // First part: Send asset to DEX
    splitTransactions.push({
      ...transaction,
      id: `${transaction.id}_send`,
      splitId: 'send_to_dex',
      description: `Sent ${transaction.fromAmount || transaction.amount} ${transaction.fromAsset || transaction.asset} to DEX`,
      amount: transaction.fromAmount || transaction.amount,
      displayAmount: `-${transaction.fromAmount || transaction.amount} ${transaction.fromAsset || transaction.asset}`,
      type: 'exchange_send',
      originalType: TransactionType.SELL,
      icon: 'send'
    })
    
    // Second part: Receive USDC from DEX
    const proceeds = transaction.netAmount || (transaction.amount - (transaction.fees?.total || 0))
    splitTransactions.push({
      ...transaction,
      id: `${transaction.id}_receive`,
      splitId: 'receive_from_dex',
      description: `Received $${proceeds} USDC from DEX`,
      amount: proceeds,
      displayAmount: `+$${proceeds}`,
      type: 'exchange_receive',
      originalType: TransactionType.SELL,
      icon: 'receive'
    })
  }
  
  return splitTransactions.length > 0 ? splitTransactions : [transaction]
}

// Helper to get transaction icon based on enhanced type
export const getEnhancedTransactionIcon = (
  transactionType: TransactionType,
  paymentMethod?: string
): string => {
  // Both buy on-chain and sell use exchange icon (they're both swaps)
  if (transactionType === TransactionType.BUY && paymentMethod === 'diboas_wallet') {
    return 'exchange' // Use exchange icon for on-chain buy swaps
  }
  
  if (transactionType === TransactionType.SELL) {
    return 'exchange' // Use exchange icon for sell swaps (consistent with buy)
  }
  
  // Map transaction types to icon names
  const iconMap = {
    [TransactionType.ADD]: 'download',
    [TransactionType.BUY]: 'trending-up', // On-ramp buys
    [TransactionType.SEND]: 'send',
    [TransactionType.RECEIVE]: 'download',
    [TransactionType.TRANSFER]: 'send',
    [TransactionType.WITHDRAW]: 'upload'
  }
  
  return iconMap[transactionType] || 'circle'
}