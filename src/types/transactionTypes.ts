/**
 * Transaction Type Definitions and Enums
 * Provides type safety and consistent naming for financial transactions
 */

// Core transaction types enum for type safety
export enum TransactionType {
  ADD = 'add',
  SEND = 'send', 
  RECEIVE = 'receive',
  WITHDRAW = 'withdraw',
  BUY = 'buy',
  SELL = 'sell',
  TRANSFER = 'transfer'
}

// Transaction status enum
export enum TransactionStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

// Display transaction types for UI grouping
export enum TransactionDisplayType {
  INCOMING = 'incoming',
  OUTGOING = 'outgoing',
  INVESTMENT = 'investment'
}

// Supported cryptocurrencies
export enum CryptocurrencyType {
  BTC = 'BTC',
  ETH = 'ETH', 
  SOL = 'SOL',
  SUI = 'SUI',
  USDC = 'USDC'
}

// Transaction interface with improved naming
export interface FinancialTransaction {
  transactionId: string
  transactionType: TransactionType
  monetaryAmount: number
  netAmountAfterFees?: number
  transactionFees?: {
    totalFeesUSD: number
    networkFeeUSD?: number
    platformFeeUSD?: number
  }
  cryptocurrencyAsset?: CryptocurrencyType
  paymentMethodUsed?: string
  transactionStatus: TransactionStatus
  transactionTimestamp: string
  humanReadableDescription: string
  blockchainTransactionHash?: string
  blockchainExplorerLink?: string
  onChainConfirmationStatus?: string
}

// UI transaction display interface
export interface TransactionDisplayData {
  transactionId: string
  displayType: TransactionDisplayType
  humanReadableDescription: string
  formattedAmount: string
  relativeTimeDisplay: string
  formattedDateDisplay: string
  currentStatus: TransactionStatus
  transactionIconElement: React.ReactNode
  transactionCategory: TransactionType
}

// Balance interface with semantic naming
export interface WalletBalance {
  totalBalanceUSD: number
  availableSpendingBalanceUSD: number
  investedPortfolioBalanceUSD: number
  assetBreakdown: {
    [key in CryptocurrencyType]?: {
      nativeTokenAmount: number
      usdcEquivalentAmount: number
      currentUSDValue: number
    }
  }
  managedAssets: {
    [assetSymbol: string]: {
      currentAmount: number
      currentUSDValue: number
      totalInvestedAmount: number
    }
  }
  lastBalanceUpdateTimestamp: number
}