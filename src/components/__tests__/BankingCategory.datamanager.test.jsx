/**
 * Comprehensive Test Suite for Banking Category DataManager Integration
 * Tests banking overview data calculation from DataManager services and real-time updates
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import BankingCategory from '../categories/BankingCategory.jsx'

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

// Mock banking transactions for current month
const currentDate = new Date()
const currentMonth = currentDate.getMonth()
const currentYear = currentDate.getFullYear()

const mockBankingTransactions = [
  {
    id: 'banking-1',
    type: 'add',
    amount: 1000.00,
    timestamp: new Date(currentYear, currentMonth, 5).toISOString(),
    description: 'Bank transfer deposit'
  },
  {
    id: 'banking-2',
    type: 'add',
    amount: 500.00,
    timestamp: new Date(currentYear, currentMonth, 10).toISOString(),
    description: 'Credit card deposit'
  },
  {
    id: 'banking-3',
    type: 'withdraw',
    amount: 200.00,
    timestamp: new Date(currentYear, currentMonth, 15).toISOString(),
    description: 'Bank withdrawal'
  },
  {
    id: 'banking-4',
    type: 'send',
    amount: 150.00,
    timestamp: new Date(currentYear, currentMonth, 20).toISOString(),
    description: 'Send to user'
  },
  {
    id: 'banking-5',
    type: 'add',
    amount: 300.00,
    timestamp: new Date(currentYear, currentMonth - 1, 25).toISOString(),
    description: 'Previous month deposit'
  }
]

const mockBalance = {
  totalUSD: 5000.00,
  availableForSpending: 2500.00,
  investedAmount: 2500.00,
  assets: {}
}

let mockSubscriptions = []

const mockDataManager = {
  getBalance: vi.fn(() => mockBalance),
  getTransactions: vi.fn(() => mockBankingTransactions),
  subscribe: vi.fn((event, callback) => {
    const unsubscribe = vi.fn()
    mockSubscriptions.push({ event, callback, unsubscribe })
    return unsubscribe
  }),
  updateBalance: vi.fn(),
  getState: vi.fn(() => ({
    balance: mockBalance,
    transactions: mockBankingTransactions
  }))
}

vi.mock('../../services/DataManager.js', () => ({
  dataManager: mockDataManager
}))

describe('Banking Category DataManager Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockSubscriptions = []
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initial Data Loading', () => {
    it('should load banking data from DataManager on mount', async () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      // Verify DataManager methods were called
      expect(mockDataManager.getBalance).toHaveBeenCalled()
      expect(mockDataManager.getTransactions).toHaveBeenCalled()

      // Wait for component to render banking overview
      await waitFor(() => {
        expect(screen.getByText('Banking Overview')).toBeInTheDocument()
      })
    })

    it('should display correct banking overview card structure', async () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        // Check for overview card elements
        expect(screen.getByText('Banking Overview')).toBeInTheDocument()
        expect(screen.getByText('Your current banking status at a glance')).toBeInTheDocument()
        
        // Check for all three metrics
        expect(screen.getByText('Available Balance')).toBeInTheDocument()
        expect(screen.getByText('This Month')).toBeInTheDocument()
        expect(screen.getByText('Last Transaction')).toBeInTheDocument()
      })
    })
  })

  describe('Banking Metrics Calculation', () => {
    it('should display available balance correctly', async () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        // Should show available balance from DataManager
        expect(screen.getByText('$2500.00')).toBeInTheDocument()
      })
    })

    it('should calculate this month net flow correctly', async () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        // Should calculate: In (1000 + 500) - Out (200 + 150) = +$1150.00
        expect(screen.getByText('+$1150.00')).toBeInTheDocument()
      })
    })

    it('should display last transaction correctly', async () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        // Should show the most recent transaction: send $150.00
        expect(screen.getByText('send $150.00')).toBeInTheDocument()
      })
    })

    it('should show negative net flow with correct styling', async () => {
      // Mock transactions with more outgoing than incoming
      const negativeFlowTransactions = [
        {
          id: 'banking-1',
          type: 'add',
          amount: 100.00,
          timestamp: new Date(currentYear, currentMonth, 5).toISOString()
        },
        {
          id: 'banking-2',
          type: 'withdraw',
          amount: 300.00,
          timestamp: new Date(currentYear, currentMonth, 10).toISOString()
        }
      ]

      mockDataManager.getTransactions.mockReturnValue(negativeFlowTransactions)

      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        // Should show negative flow: 100 - 300 = -$200.00
        const negativeAmount = screen.getByText('-$200.00')
        expect(negativeAmount).toBeInTheDocument()
        expect(negativeAmount).toHaveClass('text-red-600')
      })
    })
  })

  describe('Transaction Filtering', () => {
    it('should only process banking transactions', async () => {
      // Mock transactions with mixed types
      const mixedTransactions = [
        ...mockBankingTransactions,
        {
          id: 'investment-1',
          type: 'buy',
          amount: 1000.00,
          timestamp: new Date(currentYear, currentMonth, 8).toISOString()
        },
        {
          id: 'yield-1',
          type: 'earning',
          amount: 50.00,
          timestamp: new Date(currentYear, currentMonth, 12).toISOString()
        }
      ]

      mockDataManager.getTransactions.mockReturnValue(mixedTransactions)

      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        // Should only calculate from banking transactions (add, withdraw, send)
        // Same result as before: +$1150.00
        expect(screen.getByText('+$1150.00')).toBeInTheDocument()
      })
    })

    it('should only include current month transactions', async () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        // Should exclude the previous month transaction (300.00 add)
        // Current month: In (1000 + 500) - Out (200 + 150) = +$1150.00
        expect(screen.getByText('+$1150.00')).toBeInTheDocument()
        
        // Should not include previous month amount in calculation
        expect(screen.queryByText('+$1450.00')).not.toBeInTheDocument()
      })
    })

    it('should identify correct transaction types for inflow/outflow', async () => {
      const specificTransactions = [
        {
          id: 'banking-1',
          type: 'add',
          amount: 500.00,
          timestamp: new Date(currentYear, currentMonth, 5).toISOString()
        },
        {
          id: 'banking-2',
          type: 'withdraw',
          amount: 100.00,
          timestamp: new Date(currentYear, currentMonth, 10).toISOString()
        },
        {
          id: 'banking-3',
          type: 'send',
          amount: 50.00,
          timestamp: new Date(currentYear, currentMonth, 15).toISOString()
        }
      ]

      mockDataManager.getTransactions.mockReturnValue(specificTransactions)

      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        // Should calculate: In (500) - Out (100 + 50) = +$350.00
        expect(screen.getByText('+$350.00')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle no transactions gracefully', async () => {
      mockDataManager.getTransactions.mockReturnValue([])

      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        // Should show zero net flow
        expect(screen.getByText('+$0.00')).toBeInTheDocument()
        // Should show no transactions message
        expect(screen.getByText('No transactions yet')).toBeInTheDocument()
      })
    })

    it('should handle no current month transactions', async () => {
      // Only transactions from previous months
      const previousMonthTransactions = [
        {
          id: 'banking-1',
          type: 'add',
          amount: 1000.00,
          timestamp: new Date(currentYear, currentMonth - 1, 15).toISOString()
        }
      ]

      mockDataManager.getTransactions.mockReturnValue(previousMonthTransactions)

      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        // Should show zero for current month
        expect(screen.getByText('+$0.00')).toBeInTheDocument()
        // Should show last transaction from previous month
        expect(screen.getByText('add $1000.00')).toBeInTheDocument()
      })
    })

    it('should handle missing balance data', async () => {
      mockDataManager.getBalance.mockReturnValue(null)

      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        // Should show $0.00 when balance is null
        expect(screen.getByText('$0.00')).toBeInTheDocument()
      })
    })

    it('should handle missing availableForSpending property', async () => {
      mockDataManager.getBalance.mockReturnValue({
        totalUSD: 5000.00,
        investedAmount: 2500.00
        // Missing availableForSpending
      })

      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        // Should show $0.00 when availableForSpending is missing
        expect(screen.getByText('$0.00')).toBeInTheDocument()
      })
    })
  })

  describe('Real-time Updates', () => {
    it('should subscribe to balance and transaction updates', () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      // Should subscribe to both events
      expect(mockDataManager.subscribe).toHaveBeenCalledWith('balance:updated', expect.any(Function))
      expect(mockDataManager.subscribe).toHaveBeenCalledWith('transactions:updated', expect.any(Function))
      expect(mockSubscriptions).toHaveLength(2)
    })

    it('should update balance when balance changes', async () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      // Find the balance update callback
      const balanceCallback = mockSubscriptions.find(sub => sub.event === 'balance:updated').callback

      // Trigger balance update with new balance
      const newBalance = {
        ...mockBalance,
        availableForSpending: 3500.00
      }
      balanceCallback(newBalance)

      await waitFor(() => {
        // Should show updated balance
        expect(screen.getByText('$3500.00')).toBeInTheDocument()
      })
    })

    it('should update banking data when transactions change', async () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      // Find the transactions update callback
      const transactionsCallback = mockSubscriptions.find(sub => sub.event === 'transactions:updated').callback

      // Create updated transactions with new transaction
      const updatedTransactions = [
        ...mockBankingTransactions,
        {
          id: 'banking-6',
          type: 'add',
          amount: 200.00,
          timestamp: new Date(currentYear, currentMonth, 25).toISOString(),
          description: 'New deposit'
        }
      ]

      // Trigger transactions update with new data
      transactionsCallback(updatedTransactions)

      await waitFor(() => {
        // Should show updated net flow: original 1150 + 200 = +$1350.00
        expect(screen.getByText('+$1350.00')).toBeInTheDocument()
        // Should show new last transaction
        expect(screen.getByText('add $200.00')).toBeInTheDocument()
      })
    })

    it('should cleanup subscriptions on unmount', () => {
      const { unmount } = render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      // Verify subscriptions were created
      expect(mockSubscriptions).toHaveLength(2)

      // Unmount component
      unmount()

      // Verify all unsubscribe functions were called
      mockSubscriptions.forEach(sub => {
        expect(sub.unsubscribe).toHaveBeenCalled()
      })
    })
  })

  describe('Date Handling', () => {
    it('should correctly identify current month transactions across year boundaries', async () => {
      // Test case where current month is January and we have December transactions
      const originalDate = Date.now
      Date.now = vi.fn(() => new Date(2024, 0, 15).getTime()) // January 15, 2024

      const crossYearTransactions = [
        {
          id: 'banking-1',
          type: 'add',
          amount: 500.00,
          timestamp: new Date(2024, 0, 10).toISOString(), // January 2024 (current)
        },
        {
          id: 'banking-2',
          type: 'add',
          amount: 300.00,
          timestamp: new Date(2023, 11, 25).toISOString(), // December 2023 (previous)
        }
      ]

      mockDataManager.getTransactions.mockReturnValue(crossYearTransactions)

      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        // Should only include January transaction: +$500.00
        expect(screen.getByText('+$500.00')).toBeInTheDocument()
      })

      // Restore original Date.now
      Date.now = originalDate
    })
  })

  describe('Error Handling', () => {
    it('should handle DataManager errors gracefully', async () => {
      // Mock DataManager to throw error
      mockDataManager.getTransactions.mockImplementation(() => {
        throw new Error('DataManager error')
      })

      // Should not crash the component
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        // Should still show the banking overview
        expect(screen.getByText('Banking Overview')).toBeInTheDocument()
      })
    })

    it('should handle malformed transaction data', async () => {
      // Mock transactions with missing properties
      const malformedTransactions = [
        {
          id: 'banking-1',
          type: 'add'
          // Missing amount, timestamp
        },
        {
          id: 'banking-2',
          amount: 100.00,
          timestamp: new Date(currentYear, currentMonth, 10).toISOString()
          // Missing type
        }
      ]

      mockDataManager.getTransactions.mockReturnValue(malformedTransactions)

      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        // Should handle malformed data gracefully
        expect(screen.getByText('Banking Overview')).toBeInTheDocument()
        // Should show reasonable defaults
        expect(screen.getByText('+$0.00')).toBeInTheDocument()
      })
    })
  })

  describe('UI Integration', () => {
    it('should maintain proper component structure', async () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        // Check for proper CSS classes
        const overviewCard = screen.getByText('Banking Overview').closest('.banking-overview-card')
        expect(overviewCard).toBeInTheDocument()

        const overviewGrid = overviewCard.querySelector('.banking-overview-grid')
        expect(overviewGrid).toBeInTheDocument()

        // Check for all three overview items
        const overviewItems = overviewCard.querySelectorAll('.banking-overview-item')
        expect(overviewItems).toHaveLength(3)
      })
    })

    it('should display correct icons for each metric', async () => {
      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        // Should have appropriate icon colors
        const availableBalanceIcon = screen.getByText('Available Balance').closest('.banking-overview-item').querySelector('svg')
        expect(availableBalanceIcon).toHaveClass('text-green-600')

        const thisMonthIcon = screen.getByText('This Month').closest('.banking-overview-item').querySelector('svg')
        expect(thisMonthIcon).toHaveClass('text-green-600') // Positive flow

        const lastTransactionIcon = screen.getByText('Last Transaction').closest('.banking-overview-item').querySelector('svg')
        expect(lastTransactionIcon).toHaveClass('text-gray-600')
      })
    })

    it('should show red styling for negative net flow icon', async () => {
      // Mock transactions with negative flow
      const negativeFlowTransactions = [
        {
          id: 'banking-1',
          type: 'withdraw',
          amount: 500.00,
          timestamp: new Date(currentYear, currentMonth, 5).toISOString()
        }
      ]

      mockDataManager.getTransactions.mockReturnValue(negativeFlowTransactions)

      render(
        <TestWrapper>
          <BankingCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        // Should show red icon for negative flow
        const thisMonthIcon = screen.getByText('This Month').closest('.banking-overview-item').querySelector('svg')
        expect(thisMonthIcon).toHaveClass('text-red-600')
      })
    })
  })
})