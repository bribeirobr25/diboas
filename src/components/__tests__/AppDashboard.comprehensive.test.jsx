/**
 * Comprehensive Test Suite for AppDashboard Component
 * Tests dashboard rendering, balance display, transaction lists, and user interactions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import AppDashboard from '../AppDashboard.jsx'
import { dataManager } from '../../services/DataManager.js'

// Mock dependencies
vi.mock('../../services/DataManager.js', () => ({
  dataManager: {
    getState: vi.fn(),
    getBalance: vi.fn(),
    getTransactions: vi.fn(),
    subscribe: vi.fn(),
    emit: vi.fn()
  }
}))

vi.mock('../../utils/userSettings.js', () => ({
  useUserSettings: () => ({
    advancedMode: false,
    setAdvancedMode: vi.fn(),
    displayPreferences: {
      showRecentActivities: true,
      showMarketIndicators: true,
      showQuickActions: true
    }
  })
}))

vi.mock('../../services/marketData.js', () => ({
  useMarketData: () => ({
    btcPrice: 45000,
    ethPrice: 3000,
    solPrice: 150,
    priceChanges: {
      BTC: 2.5,
      ETH: -1.2,
      SOL: 5.8
    },
    loading: false,
    error: null
  })
}))

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('AppDashboard Component', () => {
  let mockUser
  let mockBalance
  let mockTransactions
  let mockSubscribe

  beforeEach(() => {
    mockUser = {
      id: 'test-user-123',
      email: 'test@example.com',
      firstName: 'Test',
      lastName: 'User',
      avatar: null,
      preferences: {
        currency: 'USD',
        theme: 'light'
      }
    }

    mockBalance = {
      availableForSpending: 1250.50,
      investedAmount: 3750.25,
      totalUSD: 5000.75,
      assets: {
        BTC: { 
          investedAmount: 1500, 
          currentValue: 1650, 
          quantity: 0.035,
          pricePerUnit: 47142.86 
        },
        ETH: { 
          investedAmount: 1250, 
          currentValue: 1200, 
          quantity: 0.4,
          pricePerUnit: 3000 
        },
        SOL: { 
          investedAmount: 1000, 
          currentValue: 900, 
          quantity: 6,
          pricePerUnit: 150 
        }
      }
    }

    mockTransactions = [
      {
        id: 'tx_1',
        type: 'add',
        amount: 500,
        status: 'completed',
        timestamp: new Date(Date.now() - 60000).toISOString(), // 1 minute ago
        category: 'deposit',
        paymentMethod: 'credit_card',
        fees: { total: 5.45 }
      },
      {
        id: 'tx_2',
        type: 'buy',
        amount: 300,
        asset: 'BTC',
        status: 'completed',
        timestamp: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        category: 'investment',
        paymentMethod: 'diboas_wallet',
        fees: { total: 0.27 }
      },
      {
        id: 'tx_3',
        type: 'send',
        amount: 100,
        status: 'pending',
        timestamp: new Date(Date.now() - 1800000).toISOString(), // 30 minutes ago
        category: 'transfer',
        recipient: 'test-recipient-address',
        fees: { total: 0.5 }
      },
      {
        id: 'tx_4',
        type: 'sell',
        amount: 200,
        asset: 'ETH',
        status: 'completed',
        timestamp: new Date(Date.now() - 7200000).toISOString(), // 2 hours ago
        category: 'investment',
        netAmount: 195,
        fees: { total: 5 }
      }
    ]

    mockSubscribe = vi.fn(() => () => {}) // Return unsubscribe function

    dataManager.getState.mockReturnValue({
      user: mockUser,
      balance: mockBalance,
      transactions: mockTransactions
    })
    dataManager.getBalance.mockReturnValue(mockBalance)
    dataManager.getTransactions.mockReturnValue(mockTransactions)
    dataManager.subscribe.mockImplementation(mockSubscribe)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Dashboard Rendering and Layout', () => {
    it('should render dashboard with all main sections', () => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      expect(screen.getByText(/welcome.*test/i)).toBeInTheDocument()
      expect(screen.getByText(/total balance/i)).toBeInTheDocument()
      expect(screen.getByText(/recent activities/i)).toBeInTheDocument()
      expect(screen.getByText(/quick actions/i)).toBeInTheDocument()
    })

    it('should display user greeting with correct name', () => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      expect(screen.getByText(/welcome.*test/i)).toBeInTheDocument()
    })

    it('should handle missing user name gracefully', () => {
      const userWithoutName = { ...mockUser, firstName: null, lastName: null }
      dataManager.getState.mockReturnValue({
        ...dataManager.getState(),
        user: userWithoutName
      })

      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      expect(screen.getByText(/welcome/i)).toBeInTheDocument()
    })

    it('should show loading state when data is not available', () => {
      dataManager.getState.mockReturnValue({
        user: null,
        balance: null,
        transactions: []
      })

      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      expect(screen.getByText(/loading/i)).toBeInTheDocument()
    })
  })

  describe('Balance Display', () => {
    beforeEach(() => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )
    })

    it('should display total balance correctly formatted', () => {
      expect(screen.getByText(/\$5,000\.75/)).toBeInTheDocument()
    })

    it('should display available balance for spending', () => {
      expect(screen.getByText(/available.*\$1,250\.50/i)).toBeInTheDocument()
    })

    it('should display invested amount', () => {
      expect(screen.getByText(/invested.*\$3,750\.25/i)).toBeInTheDocument()
    })

    it('should show individual asset balances', () => {
      expect(screen.getByText(/BTC.*\$1,650/i)).toBeInTheDocument()
      expect(screen.getByText(/ETH.*\$1,200/i)).toBeInTheDocument()
      expect(screen.getByText(/SOL.*\$900/i)).toBeInTheDocument()
    })

    it('should display asset quantities', () => {
      expect(screen.getByText(/0\.035.*BTC/i)).toBeInTheDocument()
      expect(screen.getByText(/0\.4.*ETH/i)).toBeInTheDocument()
      expect(screen.getByText(/6.*SOL/i)).toBeInTheDocument()
    })

    it('should show profit/loss indicators for assets', () => {
      // BTC: invested 1500, current 1650 = +150 profit
      expect(screen.getByText(/\+\$150/)).toBeInTheDocument()
      // ETH: invested 1250, current 1200 = -50 loss
      expect(screen.getByText(/-\$50/)).toBeInTheDocument()
      // SOL: invested 1000, current 900 = -100 loss
      expect(screen.getByText(/-\$100/)).toBeInTheDocument()
    })
  })

  describe('Recent Activities Section', () => {
    beforeEach(() => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )
    })

    it('should display recent transactions list', () => {
      expect(screen.getByText(/recent activities/i)).toBeInTheDocument()
      
      // Should show most recent transactions (limited to 5)
      expect(screen.getByText(/added.*\$500/i)).toBeInTheDocument()
      expect(screen.getByText(/bought.*BTC/i)).toBeInTheDocument()
      expect(screen.getByText(/sent.*\$100/i)).toBeInTheDocument()
      expect(screen.getByText(/sold.*ETH/i)).toBeInTheDocument()
    })

    it('should show transaction timestamps', () => {
      expect(screen.getByText(/1m ago/i)).toBeInTheDocument()
      expect(screen.getByText(/1h ago/i)).toBeInTheDocument()
      expect(screen.getByText(/30m ago/i)).toBeInTheDocument()
    })

    it('should display transaction status indicators', () => {
      // Completed transactions should have checkmark or success indicator
      const completedTransactions = screen.getAllByText(/completed/i)
      expect(completedTransactions.length).toBeGreaterThan(0)

      // Pending transaction should have pending indicator
      expect(screen.getByText(/pending/i)).toBeInTheDocument()
    })

    it('should show transaction amounts with correct signs', () => {
      // ADD should show positive
      expect(screen.getByText(/\+\$500/)).toBeInTheDocument()
      // SEND should show negative
      expect(screen.getByText(/-\$100/)).toBeInTheDocument()
    })

    it('should provide link to view all transactions', () => {
      const viewAllLink = screen.getByRole('link', { name: /view all/i })
      expect(viewAllLink).toBeInTheDocument()
      expect(viewAllLink).toHaveAttribute('href', '/account')
    })

    it('should handle empty transaction list gracefully', () => {
      dataManager.getTransactions.mockReturnValue([])

      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      expect(screen.getByText(/no recent activities/i)).toBeInTheDocument()
    })
  })

  describe('Quick Actions Section', () => {
    beforeEach(() => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )
    })

    it('should display all quick action buttons', () => {
      expect(screen.getByRole('button', { name: /add money/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /withdraw/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /buy crypto/i })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /sell/i })).toBeInTheDocument()
    })

    it('should navigate to transaction form when action is clicked', async () => {
      const user = userEvent.setup()
      const addMoneyButton = screen.getByRole('button', { name: /add money/i })

      await user.click(addMoneyButton)

      // Should navigate or open transaction form modal
      // This would depend on the actual implementation
      expect(window.location.pathname).toBe('/transaction')
    })

    it('should disable actions when insufficient balance', () => {
      // Mock zero balance
      const zeroBalance = { ...mockBalance, availableForSpending: 0 }
      dataManager.getBalance.mockReturnValue(zeroBalance)

      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      const sendButton = screen.getByRole('button', { name: /send/i })
      const withdrawButton = screen.getByRole('button', { name: /withdraw/i })

      expect(sendButton).toBeDisabled()
      expect(withdrawButton).toBeDisabled()
    })

    it('should show action icons with proper accessibility', () => {
      const addButton = screen.getByRole('button', { name: /add money/i })
      const withdrawButton = screen.getByRole('button', { name: /withdraw/i })

      expect(addButton).toHaveAttribute('aria-label')
      expect(withdrawButton).toHaveAttribute('aria-label')
    })
  })

  describe('Market Indicators Section', () => {
    beforeEach(() => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )
    })

    it('should display current crypto prices', () => {
      expect(screen.getByText(/\$45,000/)).toBeInTheDocument() // BTC price
      expect(screen.getByText(/\$3,000/)).toBeInTheDocument() // ETH price
      expect(screen.getByText(/\$150/)).toBeInTheDocument() // SOL price
    })

    it('should show price change indicators', () => {
      expect(screen.getByText(/\+2\.5%/)).toBeInTheDocument() // BTC change
      expect(screen.getByText(/-1\.2%/)).toBeInTheDocument() // ETH change
      expect(screen.getByText(/\+5\.8%/)).toBeInTheDocument() // SOL change
    })

    it('should color-code price changes', () => {
      const btcChange = screen.getByText(/\+2\.5%/)
      const ethChange = screen.getByText(/-1\.2%/)

      expect(btcChange).toHaveClass('text-green-500')
      expect(ethChange).toHaveClass('text-red-500')
    })

    it('should handle market data loading state', () => {
      vi.mocked(require('../../services/marketData.js').useMarketData)
        .mockReturnValueOnce({
          btcPrice: null,
          ethPrice: null,
          solPrice: null,
          loading: true,
          error: null
        })

      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      expect(screen.getByText(/loading market data/i)).toBeInTheDocument()
    })

    it('should handle market data errors gracefully', () => {
      vi.mocked(require('../../services/marketData.js').useMarketData)
        .mockReturnValueOnce({
          btcPrice: null,
          ethPrice: null,
          solPrice: null,
          loading: false,
          error: 'Failed to fetch market data'
        })

      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      expect(screen.getByText(/market data unavailable/i)).toBeInTheDocument()
    })
  })

  describe('Data Subscriptions and Updates', () => {
    it('should subscribe to balance updates on mount', () => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      expect(mockSubscribe).toHaveBeenCalledWith('balance:updated', expect.any(Function))
    })

    it('should subscribe to transaction updates on mount', () => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      expect(mockSubscribe).toHaveBeenCalledWith('transaction:added', expect.any(Function))
    })

    it('should update display when balance changes', async () => {
      const { rerender } = render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      // Simulate balance update
      const newBalance = { ...mockBalance, totalUSD: 6000 }
      dataManager.getBalance.mockReturnValue(newBalance)

      rerender(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      expect(screen.getByText(/\$6,000/)).toBeInTheDocument()
    })

    it('should unsubscribe from events on unmount', () => {
      const unsubscribeMock = vi.fn()
      mockSubscribe.mockReturnValue(unsubscribeMock)

      const { unmount } = render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      unmount()

      expect(unsubscribeMock).toHaveBeenCalled()
    })
  })

  describe('Advanced Mode Features', () => {
    it('should show additional details in advanced mode', () => {
      const mockAdvancedSettings = {
        advancedMode: true,
        setAdvancedMode: vi.fn(),
        displayPreferences: {
          showRecentActivities: true,
          showMarketIndicators: true,
          showQuickActions: true,
          showAdvancedMetrics: true
        }
      }

      vi.mocked(require('../../utils/userSettings.js').useUserSettings)
        .mockReturnValueOnce(mockAdvancedSettings)

      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      expect(screen.getByText(/portfolio allocation/i)).toBeInTheDocument()
      expect(screen.getByText(/24h p&l/i)).toBeInTheDocument()
      expect(screen.getByText(/total fees paid/i)).toBeInTheDocument()
    })

    it('should show transaction gas fees in advanced mode', () => {
      const mockAdvancedSettings = {
        advancedMode: true,
        setAdvancedMode: vi.fn(),
        displayPreferences: {
          showRecentActivities: true,
          showMarketIndicators: true,
          showQuickActions: true,
          showGasFees: true
        }
      }

      vi.mocked(require('../../utils/userSettings.js').useUserSettings)
        .mockReturnValueOnce(mockAdvancedSettings)

      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      // Should show gas fees in transaction list
      expect(screen.getByText(/gas.*fee/i)).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('should adapt layout for mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })

      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      const container = screen.getByTestId('dashboard-container')
      expect(container).toHaveClass('mobile-layout')
    })

    it('should show collapsed view on small screens', () => {
      // Mock small screen
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 320,
      })

      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      // Should show abbreviated transaction list
      const transactions = screen.getAllByTestId('transaction-item')
      expect(transactions.length).toBeLessThanOrEqual(3)
    })
  })

  describe('Error Handling', () => {
    it('should handle data manager errors gracefully', () => {
      dataManager.getState.mockImplementation(() => {
        throw new Error('DataManager error')
      })

      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      expect(screen.getByText(/error loading dashboard/i)).toBeInTheDocument()
    })

    it('should show fallback UI when balance data is corrupted', () => {
      dataManager.getBalance.mockReturnValue(null)

      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      expect(screen.getByText(/balance unavailable/i)).toBeInTheDocument()
    })

    it('should handle subscription errors without crashing', () => {
      mockSubscribe.mockImplementation(() => {
        throw new Error('Subscription error')
      })

      expect(() => {
        render(
          <TestWrapper>
            <AppDashboard />
          </TestWrapper>
        )
      }).not.toThrow()
    })
  })

  describe('Performance', () => {
    it('should render dashboard quickly with large transaction lists', () => {
      const largeTransactionList = Array.from({ length: 1000 }, (_, i) => ({
        id: `tx_${i}`,
        type: 'add',
        amount: 100 + i,
        status: 'completed',
        timestamp: new Date(Date.now() - i * 60000).toISOString()
      }))

      dataManager.getTransactions.mockReturnValue(largeTransactionList)

      const startTime = performance.now()
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )
      const endTime = performance.now()

      expect(endTime - startTime).toBeLessThan(100)
    })

    it('should debounce rapid balance updates', async () => {
      const { rerender } = render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      // Simulate rapid balance updates
      for (let i = 0; i < 10; i++) {
        const updatedBalance = { ...mockBalance, totalUSD: 5000 + i }
        dataManager.getBalance.mockReturnValue(updatedBalance)
        
        rerender(
          <TestWrapper>
            <AppDashboard />
          </TestWrapper>
        )
      }

      // Should not cause performance issues
      expect(screen.getByText(/\$5,009/)).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading hierarchy', () => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      const h1 = screen.getByRole('heading', { level: 1 })
      const h2s = screen.getAllByRole('heading', { level: 2 })

      expect(h1).toBeInTheDocument()
      expect(h2s.length).toBeGreaterThan(0)
    })

    it('should have proper ARIA labels for balance information', () => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      const totalBalance = screen.getByText(/\$5,000\.75/)
      expect(totalBalance).toHaveAttribute('aria-label', expect.stringContaining('total balance'))
    })

    it('should support keyboard navigation', async () => {
      render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      const user = userEvent.setup()
      const firstButton = screen.getByRole('button', { name: /add money/i })

      await user.tab()
      expect(document.activeElement).toBe(firstButton)

      await user.tab()
      // Should focus on next interactive element
      expect(document.activeElement).not.toBe(firstButton)
    })

    it('should announce balance changes to screen readers', async () => {
      const { rerender } = render(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      // Simulate balance update
      const newBalance = { ...mockBalance, totalUSD: 6000 }
      dataManager.getBalance.mockReturnValue(newBalance)

      rerender(
        <TestWrapper>
          <AppDashboard />
        </TestWrapper>
      )

      const announcement = screen.getByRole('status')
      expect(announcement).toHaveTextContent(/balance updated/i)
    })
  })
})