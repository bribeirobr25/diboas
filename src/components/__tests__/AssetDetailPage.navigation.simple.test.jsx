/**
 * AssetDetailPage Navigation Data Persistence Tests (Simplified)
 */

import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi, describe, it, expect, beforeEach } from 'vitest'

import AssetDetailPage from '../AssetDetailPage.jsx'
import { dataManager } from '../../services/DataManager.js'

// Mock the router params
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useParams: () => ({ symbol: 'BTC' }),
    useNavigate: () => vi.fn()
  }
})

// Mock the asset data service
vi.mock('../../services/assetDataService.js', () => ({
  assetDataService: {
    getCompleteAssetData: vi.fn().mockResolvedValue({
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 43250
    }),
    subscribeToPriceUpdates: vi.fn().mockReturnValue(() => {}),
    formatPrice: vi.fn().mockImplementation(price => `$${price.toLocaleString()}`),
    clearCache: vi.fn()
  }
}))

// Mock PageHeader component
vi.mock('../shared/PageHeader.jsx', () => ({
  default: () => <div data-testid="page-header">Page Header</div>
}))

describe('AssetDetailPage Data Persistence', () => {
  beforeEach(() => {
    // Set up realistic user data
    dataManager.state = {
      user: { id: 'demo_user_12345' },
      balance: {
        totalUSD: 5000,
        availableForSpending: 2000,
        investedAmount: 3000,
        assets: {
          'BTC': { quantity: 0.069, investedAmount: 3000 }
        }
      },
      transactions: [
        { id: 'tx_1', type: 'add', amount: 2000 },
        { id: 'tx_2', type: 'buy', amount: 3000, asset: 'BTC' }
      ]
    }
  })

  it('should preserve balance data when loading asset page', async () => {
    const balanceBefore = dataManager.getBalance()
    
    render(
      <BrowserRouter>
        <AssetDetailPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByTestId('page-header')).toBeInTheDocument()
    })

    const balanceAfter = dataManager.getBalance()
    
    expect(balanceAfter.totalUSD).toBe(balanceBefore.totalUSD)
    expect(balanceAfter.availableForSpending).toBe(balanceBefore.availableForSpending)
    expect(balanceAfter.investedAmount).toBe(balanceBefore.investedAmount)
    expect(balanceAfter.assets['BTC'].quantity).toBe(0.069)
  })

  it('should preserve transaction history when loading asset page', async () => {
    const transactionsBefore = dataManager.getTransactions()
    
    render(
      <BrowserRouter>
        <AssetDetailPage />
      </BrowserRouter>
    )

    await waitFor(() => {
      expect(screen.getByTestId('page-header')).toBeInTheDocument()
    })

    const transactionsAfter = dataManager.getTransactions()
    
    expect(transactionsAfter).toHaveLength(transactionsBefore.length)
    expect(transactionsAfter[0].id).toBe('tx_1')
    expect(transactionsAfter[1].id).toBe('tx_2')
  })
})