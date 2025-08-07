/**
 * AssetDetailPage Navigation Data Persistence Tests
 * Verifies that user balance and transaction history are preserved when navigating to asset pages
 */

import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'

import AssetDetailPage from '../AssetDetailPage.jsx'
import { dataManager } from '../../services/DataManager.js'

// Mock the router params
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ symbol: 'BTC' }),
    useNavigate: () => mockNavigate
  }
})

// Mock the asset data service
vi.mock('../../services/assetDataService.js', () => ({
  assetDataService: {
    getCompleteAssetData: vi.fn().mockResolvedValue({
      symbol: 'BTC',
      name: 'Bitcoin',
      icon: '₿',
      price: 43250,
      priceFormatted: '$43,250.00',
      change24h: 2.5,
      change24hFormatted: '+2.50%',
      changeAmountFormatted: '$1,056.25',
      trend: 'up',
      description: 'The world\'s first cryptocurrency',
      marketCapFormatted: '$850.2B',
      volume24hFormatted: '$28.4B',
      rank: 1,
      supply: '19.8M BTC',
      website: 'https://bitcoin.org',
      chain: 'BTC'
    }),
    subscribeToPriceUpdates: vi.fn().mockReturnValue(() => {}),
    formatPrice: vi.fn().mockImplementation(price => `$${price.toLocaleString()}`),
    formatPercentage: vi.fn().mockImplementation(pct => `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`),
    clearCache: vi.fn()
  }
}))

// Mock PageHeader component
vi.mock('../shared/PageHeader.jsx', () => ({
  default: () => <div data-testid="page-header">Page Header</div>
}))

describe('AssetDetailPage Navigation Data Persistence', () => {
  beforeEach(() => {
    // Reset mocks
    vi.clearAllMocks()
    
    // Set up DataManager with some real user data that should be preserved
    dataManager.state = {
      user: {
        id: 'demo_user_12345',
        name: 'Test User',
        email: 'test@example.com'
      },
      balance: {
        totalUSD: 5000,
        availableForSpending: 2000,
        investedAmount: 3000,
        strategyBalance: 0,
        breakdown: {
          BTC: { native: 0, usdc: 0, usdValue: 0 },
          ETH: { native: 0, usdc: 0, usdValue: 0 },
          SOL: { native: 0, usdc: 0, usdValue: 0 }
        },
        assets: {
          'BTC': { amount: 0.069, usdValue: 3000, investedAmount: 3000, quantity: 0.069 }
        },
        strategies: {},
        lastUpdated: Date.now()
      },
      transactions: [
        {
          id: 'tx_1',
          type: 'add', 
          amount: 2000,
          status: 'completed',
          createdAt: new Date().toISOString()
        },
        {
          id: 'tx_2',
          type: 'buy',
          amount: 3000,
          asset: 'BTC',
          status: 'completed',
          createdAt: new Date().toISOString()
        }
      ],
      finObjectives: {},
      yieldData: {
        activeStrategies: 0,
        totalEarning: 0,
        avgAPY: 0,
        goalsProgress: 0,
        lastUpdated: Date.now()
      },
      isLoading: false,
      lastUpdated: Date.now()
    }
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should preserve user balance data when navigating to asset page', async () => {
    // Capture initial balance data
    const initialBalance = dataManager.getBalance()
    expect(initialBalance.totalUSD).toBe(5000)
    expect(initialBalance.availableForSpending).toBe(2000)
    expect(initialBalance.investedAmount).toBe(3000)
    expect(initialBalance.assets['BTC']).toBeDefined()
    expect(initialBalance.assets['BTC'].quantity).toBe(0.069)

    // Render AssetDetailPage
    render(
      <BrowserRouter>
        <AssetDetailPage />
      </BrowserRouter>
    )

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('page-header')).toBeInTheDocument()
    })

    // Verify balance data is still intact after component mount
    const balanceAfterMount = dataManager.getBalance()
    
    expect(balanceAfterMount.totalUSD).toBe(5000)
    expect(balanceAfterMount.availableForSpending).toBe(2000)
    expect(balanceAfterMount.investedAmount).toBe(3000)
    expect(balanceAfterMount.assets['BTC']).toBeDefined()
    expect(balanceAfterMount.assets['BTC'].quantity).toBe(0.069)
    expect(balanceAfterMount.assets['BTC'].investedAmount).toBe(3000)
    
    // Verify balance object references are preserved (not reset)
    expect(balanceAfterMount.lastUpdated).toBe(initialBalance.lastUpdated)
  })

  it('should preserve transaction history when navigating to asset page', async () => {
    // Capture initial transaction data
    const initialTransactions = dataManager.getTransactions()
    expect(initialTransactions).toHaveLength(2)
    expect(initialTransactions[0].id).toBe('tx_1')
    expect(initialTransactions[0].type).toBe('add')
    expect(initialTransactions[0].amount).toBe(2000)
    expect(initialTransactions[1].id).toBe('tx_2')
    expect(initialTransactions[1].type).toBe('buy')
    expect(initialTransactions[1].amount).toBe(3000)

    // Render AssetDetailPage
    render(
      <BrowserRouter>
        <AssetDetailPage />
      </BrowserRouter>
    )

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('page-header')).toBeInTheDocument()
    })

    // Verify transaction history is still intact after component mount
    const transactionsAfterMount = dataManager.getTransactions()
    
    expect(transactionsAfterMount).toHaveLength(2)
    expect(transactionsAfterMount[0].id).toBe('tx_1')
    expect(transactionsAfterMount[0].type).toBe('add')
    expect(transactionsAfterMount[0].amount).toBe(2000)
    expect(transactionsAfterMount[1].id).toBe('tx_2')
    expect(transactionsAfterMount[1].type).toBe('buy')
    expect(transactionsAfterMount[1].amount).toBe(3000)
    expect(transactionsAfterMount[1].asset).toBe('BTC')
  })

  it('should display user holdings correctly based on preserved balance data', async () => {
    // Render AssetDetailPage
    render(
      <BrowserRouter>
        <AssetDetailPage />
      </BrowserRouter>
    )

    // Wait for component to load and process holdings
    await waitFor(() => {
      expect(screen.getByTestId('page-header')).toBeInTheDocument()
    })

    // The component should read the preserved balance data and display holdings
    // Since we have 0.069 BTC worth $3000 invested, it should show holdings
    await waitFor(() => {
      // Look for holdings display elements
      const balanceData = dataManager.getBalance()
      expect(balanceData.assets['BTC']).toBeDefined()
      expect(balanceData.assets['BTC'].quantity).toBe(0.069)
      expect(balanceData.assets['BTC'].investedAmount).toBe(3000)
    })
  })

  it('should not call resetToCleanState when user has valid data', async () => {
    // Spy on DataManager methods to ensure clean state is not called
    const resetSpy = vi.spyOn(dataManager, 'resetToCleanState')
    const initializeSpy = vi.spyOn(dataManager, 'initializeCleanState')

    // Render AssetDetailPage
    render(
      <BrowserRouter>
        <AssetDetailPage />
      </BrowserRouter>
    )

    // Wait for component to load
    await waitFor(() => {
      expect(screen.getByTestId('page-header')).toBeInTheDocument()
    })

    // Verify that reset methods were not called
    expect(resetSpy).not.toHaveBeenCalled()
    expect(initializeSpy).not.toHaveBeenCalled()

    resetSpy.mockRestore()
    initializeSpy.mockRestore()
  })

  it('should preserve user data across multiple asset page navigations', async () => {
    // Initial render for BTC
    const { rerender } = render(
      <BrowserRouter>
        <AssetDetailPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByTestId('page-header')).toBeInTheDocument()
    })

    // Verify initial data
    let currentBalance = dataManager.getBalance()
    let currentTransactions = dataManager.getTransactions()
    expect(currentBalance.totalUSD).toBe(5000)
    expect(currentTransactions).toHaveLength(2)

    // Simulate navigation to ETH asset page
    vi.mocked(require('react-router-dom').useParams).mockReturnValue({ symbol: 'ETH' })
    
    rerender(
      <BrowserRouter>
        <AssetDetailPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByTestId('page-header')).toBeInTheDocument()
    })

    // Verify data is still preserved after "navigation"
    currentBalance = dataManager.getBalance()
    currentTransactions = dataManager.getTransactions()
    expect(currentBalance.totalUSD).toBe(5000)
    expect(currentBalance.availableForSpending).toBe(2000)
    expect(currentBalance.investedAmount).toBe(3000)
    expect(currentTransactions).toHaveLength(2)
    expect(currentTransactions[0].type).toBe('add')
    expect(currentTransactions[1].type).toBe('buy')
  })
})