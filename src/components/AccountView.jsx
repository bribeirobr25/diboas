import { useState, useEffect, useCallback, useMemo } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import {
  Wallet,
  Eye,
  EyeOff,
  Download,
  Search
} from 'lucide-react'
import { Input } from '@/components/ui/input.jsx'
import PageHeader from './shared/PageHeader.jsx'
import { NAVIGATION_PATHS } from '../utils/navigationHelpers.js'
import { useWalletBalance } from '../hooks/useTransactions.jsx'
import { useSafeDataManager, useDataManagerSubscription } from '../hooks/useDataManagerSubscription.js'
import TransactionIcon from './ui/TransactionIcon.tsx'
import { TransactionType } from '../types/transactionTypes'
import {
  calculateDisplayAmountWithSign,
  formatRelativeTimeFromTimestamp,
  formatHumanReadableDate,
  determineTransactionDisplayType
} from '../utils/transactionDisplayHelpers'

export default function AccountView() {
  const [isBalanceVisible, setIsBalanceVisible] = useState(true)
  const [selectedTransactionFilter, setSelectedTransactionFilter] = useState('all')

  // Get real wallet balance with semantic naming
  const { balance: currentWalletBalance, getBalance: refreshWalletBalance } = useWalletBalance()

  // Refresh balance when component mounts
  useEffect(() => {
    refreshWalletBalance(true) // Force refresh on component mount
  }, [refreshWalletBalance])

  // Get transaction history from DataManager with semantic naming
  const { getTransactions: retrieveAllTransactionsFromDataManager } = useSafeDataManager()

  const loadCompleteTransactionHistory = useCallback(() => {
    const allUserTransactions = retrieveAllTransactionsFromDataManager()
    // Complete transaction history retrieved from data manager
    return allUserTransactions // Get all transactions for account overview
  }, [retrieveAllTransactionsFromDataManager])

  const [userTransactionHistory, setUserTransactionHistory] = useState([])

  // Load initial transaction history on component mount
  useEffect(() => {
    try {
      setUserTransactionHistory(loadCompleteTransactionHistory())
    } catch (loadingError) {
      // Handle transaction loading error gracefully
      setUserTransactionHistory([])
    }
  }, [loadCompleteTransactionHistory])

  // Subscribe to transaction events with semantic naming
  useDataManagerSubscription('transaction:added', () => {
    // New transaction added - refresh display data
    const updatedTransactionHistory = loadCompleteTransactionHistory()
    setUserTransactionHistory(updatedTransactionHistory)
    refreshWalletBalance(true)
  }, [loadCompleteTransactionHistory, refreshWalletBalance])

  useDataManagerSubscription('transaction:completed', () => {
    // Transaction processing completed - refresh all data
    const updatedTransactionHistory = loadCompleteTransactionHistory()
    setUserTransactionHistory(updatedTransactionHistory)
    refreshWalletBalance(true)
  }, [loadCompleteTransactionHistory, refreshWalletBalance])

  // Transform raw transaction data into display-ready format with semantic naming
  const displayReadyTransactionList = useMemo(() => {
    return userTransactionHistory.map(rawTransaction => {
      // Convert string type to enum for type safety
      const transactionType = rawTransaction.type

      const transactionDisplayData = {
        transactionId: rawTransaction.id,
        displayType: determineTransactionDisplayType(transactionType),
        humanReadableDescription: rawTransaction.description,
        formattedAmount: calculateDisplayAmountWithSign(
          transactionType,
          rawTransaction.amount,
          rawTransaction.netAmount
        ),
        relativeTimeDisplay: formatRelativeTimeFromTimestamp(rawTransaction.timestamp),
        formattedDateDisplay: formatHumanReadableDate(rawTransaction.timestamp),
        currentStatus: rawTransaction.status || 'completed',
        transactionIconElement: <TransactionIcon transactionType={transactionType} />,
        transactionCategory: transactionType
      }

      return transactionDisplayData
    })
  }, [userTransactionHistory])

  const filteredTransactionDisplayList = selectedTransactionFilter === 'all'
    ? displayReadyTransactionList
    : displayReadyTransactionList.filter(transactionItem =>
      transactionItem.transactionCategory === selectedTransactionFilter
    )

  const transactionFilterOptionsConfig = [
    { filterValue: 'all', displayLabel: 'All Transactions' },
    { filterValue: TransactionType.ADD, displayLabel: 'Deposits' },
    { filterValue: TransactionType.SEND, displayLabel: 'Sent' },
    { filterValue: TransactionType.BUY, displayLabel: 'Purchases' },
    { filterValue: TransactionType.SELL, displayLabel: 'Sold' },
    { filterValue: TransactionType.TRANSFER, displayLabel: 'Transfer' },
    { filterValue: TransactionType.WITHDRAW, displayLabel: 'Withdrawals' }
  ]

  return (
    <div className="main-layout">
      <PageHeader
        showBackButton={true}
        backTo={NAVIGATION_PATHS.APP}
        showUserActions={true}
        title="Account Overview"
      />

      <div className="page-container">
        {/* Account Overview */}
        <div className="section-container">
          <h1 className="page-title">
            Account Overview
          </h1>

          {/* Balance Cards */}
          <div className="balance-cards-grid">
            <Card className="diboas-gradient text-white">
              <CardContent className="balance-card">
                <div className="balance-card__header">
                  <div>
                    <p className="balance-card__title">Total Balance</p>
                    <div className="balance-card__amount-row">
                      <h2 className="balance-card__amount">
                        {isBalanceVisible ?
                          `$${currentWalletBalance?.totalUSD?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}` :
                          '••••••••'
                        }
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                        className="balance-card__toggle-btn"
                        aria-label={isBalanceVisible ? 'Hide balance' : 'Show balance'}
                      >
                        {isBalanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Badge className="balance-card__growth-badge">
                    +2.4%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="available-balance-card">
                <p className="available-balance-card__label">Available</p>
                <h3 className="available-balance-card__amount">
                  {isBalanceVisible ?
                    `$${currentWalletBalance?.availableForSpending?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}` :
                    '••••••••'
                  }
                </h3>
                <p className="available-balance-card__status">Ready to use</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="invested-balance-card">
                <p className="invested-balance-card__label">Invested</p>
                <h3 className="invested-balance-card__amount">
                  {isBalanceVisible ?
                    `$${(currentWalletBalance?.investedAmount || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` :
                    '••••••••'
                  }
                </h3>
                <p className="invested-balance-card__status">In portfolio</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <div className="transaction-header">
              <div>
                <CardTitle className="section-title">Transaction History</CardTitle>
                <CardDescription>
                  All your diBoaS account activity
                </CardDescription>
              </div>

              <div className="transaction-controls">
                <div className="search-input-container">
                  <Search className="search-input__icon" />
                  <Input
                    placeholder="Search transactions..."
                    className="search-input__field"
                  />
                </div>

                <select
                  value={selectedTransactionFilter}
                  onChange={(e) => setSelectedTransactionFilter(e.target.value)}
                  className="filter-dropdown"
                  aria-label="Filter transactions by type"
                >
                  {transactionFilterOptionsConfig.map((filterOption) => (
                    <option key={filterOption.filterValue} value={filterOption.filterValue}>
                      {filterOption.displayLabel}
                    </option>
                  ))}
                </select>

                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="transaction-list">
              {filteredTransactionDisplayList.map((transactionDisplayItem) => (
                <div
                  key={transactionDisplayItem.transactionId}
                  className="transaction-item"
                >
                  <div className="transaction-item__content">
                    {transactionDisplayItem.transactionIconElement}
                    <div className="transaction-item__details">
                      <p className="transaction-item__description">
                        {transactionDisplayItem.humanReadableDescription}
                      </p>
                      <div className="transaction-item__meta">
                        <span>{transactionDisplayItem.formattedDateDisplay}</span>
                        <span>•</span>
                        <span>{transactionDisplayItem.relativeTimeDisplay}</span>
                        <Badge variant="outline" className="status-badge">
                          {transactionDisplayItem.currentStatus}
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="transaction-item__amount-container">
                    <p className={`transaction-item__amount ${transactionDisplayItem.formattedAmount.startsWith('+') ? 'transaction-item__amount--positive' : 'transaction-item__amount--negative'
                      }`}>
                      {transactionDisplayItem.formattedAmount}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {filteredTransactionDisplayList.length === 0 && (
              <div className="empty-state">
                <Wallet className="empty-state__icon" />
                <h3 className="empty-state__title">No transactions found</h3>
                <p className="empty-state__description">Try adjusting your filter or search criteria.</p>
              </div>
            )}

            {filteredTransactionDisplayList.length > 0 && (
              <div className="load-more-container">
                <Button variant="outline">
                  Load More Transactions
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

