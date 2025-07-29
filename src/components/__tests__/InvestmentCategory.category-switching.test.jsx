/**
 * InvestmentCategory Category Switching Test
 * Tests to verify category switching works properly after the currentCategory fix
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'

// Mock dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn()
  }
})

vi.mock('../../services/DataManager.js', () => ({
  dataManager: {
    getBalance: vi.fn(() => ({ availableForSpending: 0, investedAmount: 0, assets: {} })),
    subscribe: vi.fn(() => vi.fn())
  }
}))

vi.mock('../../services/assetDataService.js', () => ({
  assetDataService: {
    getCompleteAssetData: vi.fn(() => Promise.resolve({
      symbol: 'TEST',
      name: 'Test Asset',
      price: 1000,
      change24h: 2.5,
      trend: 'up',
      description: 'Test description',
      priceFormatted: '$1,000.00',
      change24hFormatted: '+2.50%'
    })),
    subscribeToPriceUpdates: vi.fn(() => vi.fn()),
    formatPrice: vi.fn((price) => `$${price.toLocaleString()}`),
    formatPercentage: vi.fn((percent) => `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`)
  }
}))

vi.mock('../shared/PageHeader.jsx', () => ({
  default: () => <div data-testid="page-header">Page Header</div>
}))

// Import component after mocks
import InvestmentCategory from '../categories/InvestmentCategory.jsx'

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('InvestmentCategory Category Switching', () => {
  it('should switch from crypto to gold category without errors', async () => {
    render(
      <TestWrapper>
        <InvestmentCategory />
      </TestWrapper>
    )

    // Start with crypto selected
    const cryptoTab = screen.getByRole('button', { name: /crypto/i })
    expect(cryptoTab).toHaveClass('bg-blue-600', 'text-white')

    // Switch to gold
    const goldTab = screen.getByRole('button', { name: /gold/i })
    
    await act(async () => {
      fireEvent.click(goldTab)
    })

    // Gold should now be selected
    expect(goldTab).toHaveClass('bg-blue-600', 'text-white')
    expect(cryptoTab).not.toHaveClass('bg-blue-600', 'text-white')
  })

  it('should switch from crypto to stocks category without errors', async () => {
    render(
      <TestWrapper>
        <InvestmentCategory />
      </TestWrapper>
    )

    // Switch to stocks
    const stocksTab = screen.getByRole('button', { name: /stocks/i })
    
    await act(async () => {
      fireEvent.click(stocksTab)
    })

    // Stocks should now be selected
    expect(stocksTab).toHaveClass('bg-blue-600', 'text-white')
  })

  it('should switch from crypto to real estate category without errors', async () => {
    render(
      <TestWrapper>
        <InvestmentCategory />
      </TestWrapper>
    )

    // Switch to real estate
    const realEstateTab = screen.getByRole('button', { name: /real estate/i })
    
    await act(async () => {
      fireEvent.click(realEstateTab)
    })

    // Real estate should now be selected
    expect(realEstateTab).toHaveClass('bg-blue-600', 'text-white')
  })

  it('should handle multiple rapid category switches without initialization errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

    render(
      <TestWrapper>
        <InvestmentCategory />
      </TestWrapper>
    )

    const cryptoTab = screen.getByRole('button', { name: /crypto/i })
    const goldTab = screen.getByRole('button', { name: /gold/i })
    const stocksTab = screen.getByRole('button', { name: /stocks/i })
    const realEstateTab = screen.getByRole('button', { name: /real estate/i })

    // Rapidly switch categories
    await act(async () => {
      fireEvent.click(goldTab)
    })
    
    await act(async () => {
      fireEvent.click(stocksTab)
    })
    
    await act(async () => {
      fireEvent.click(realEstateTab)
    })
    
    await act(async () => {
      fireEvent.click(cryptoTab)
    })

    // Should not have any initialization errors
    expect(consoleSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Cannot access \'currentCategory\' before initialization')
    )

    // Final selection should be crypto
    expect(cryptoTab).toHaveClass('bg-blue-600', 'text-white')

    consoleSpy.mockRestore()
  })

  it('should maintain component state during category switches', async () => {
    render(
      <TestWrapper>
        <InvestmentCategory />
      </TestWrapper>
    )

    // Verify core elements persist during switches
    expect(screen.getByText('Buy/Sell')).toBeInTheDocument()
    expect(screen.getByText('Investment Overview')).toBeInTheDocument()

    // Switch category
    const goldTab = screen.getByRole('button', { name: /gold/i })
    
    await act(async () => {
      fireEvent.click(goldTab)
    })

    // Core elements should still be there
    expect(screen.getByText('Buy/Sell')).toBeInTheDocument()
    expect(screen.getByText('Investment Overview')).toBeInTheDocument()
  })

  it('should not crash when switching to categories with different asset counts', async () => {
    render(
      <TestWrapper>
        <InvestmentCategory />
      </TestWrapper>
    )

    // Switch to gold (which has fewer assets than crypto)
    const goldTab = screen.getByRole('button', { name: /gold/i })
    
    expect(() => {
      act(() => {
        fireEvent.click(goldTab)
      })
    }).not.toThrow()

    // Switch to stocks
    const stocksTab = screen.getByRole('button', { name: /stocks/i })
    
    expect(() => {
      act(() => {
        fireEvent.click(stocksTab)
      })
    }).not.toThrow()

    // Switch to real estate (which has only 1 asset)
    const realEstateTab = screen.getByRole('button', { name: /real estate/i })
    
    expect(() => {
      act(() => {
        fireEvent.click(realEstateTab)
      })
    }).not.toThrow()
  })
})