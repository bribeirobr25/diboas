/**
 * Integration tests for AssetDetailPage
 * Tests the complete asset detail page functionality with service integration
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import AssetDetailPage from '../AssetDetailPage.jsx'
import { assetDataService } from '../../services/assetDataService.js'
import { dataManager } from '../../services/DataManager.js'

// Mock the services
vi.mock('../../services/assetDataService.js', () => ({
  assetDataService: {
    getCompleteAssetData: vi.fn(),
    subscribeToPriceUpdates: vi.fn(),
    formatPrice: vi.fn(),
    formatPercentage: vi.fn(),
    cleanup: vi.fn()
  }
}))

vi.mock('../../services/DataManager.js', () => ({
  dataManager: {
    getBalance: vi.fn(),
    subscribe: vi.fn(),
    unsubscribe: vi.fn()
  }
}))

// Mock navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: () => ({ symbol: 'BTC' })
  }
})

describe('AssetDetailPage Integration Tests', () => {
  const mockAssetData = {
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: '₿',
    description: 'The world\'s first and largest cryptocurrency by market cap',
    price: 43250.50,
    change24h: 2.45,
    changeAmount: 1032.50,
    trend: 'up',
    marketCap: 850.2e9,
    volume24h: 28.4e9,
    rank: 1,
    supply: '19.8M BTC',
    website: 'https://bitcoin.org',
    whitepaper: 'https://bitcoin.org/bitcoin.pdf',
    chain: 'BTC',
    contractAddress: null,
    priceFormatted: '$43,250.50',
    change24hFormatted: '+2.45%',
    changeAmountFormatted: '$1,032.50',
    marketCapFormatted: '$850.2B',
    volume24hFormatted: '$28.4B'
  }

  const mockBalance = {
    assets: {
      BTC: {
        quantity: 0.025,
        investedAmount: 1081.25,
        assetId: 'BTC'
      }
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Setup default mocks
    assetDataService.getCompleteAssetData.mockResolvedValue(mockAssetData)
    assetDataService.subscribeToPriceUpdates.mockReturnValue(() => {})
    assetDataService.formatPrice.mockImplementation(price => `$${price.toFixed(2)}`)
    assetDataService.formatPercentage.mockImplementation(pct => `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`)
    
    dataManager.getBalance.mockReturnValue(mockBalance)
    dataManager.subscribe.mockReturnValue(() => {})
  })

  afterEach(() => {
    vi.resetAllMocks()
  })

  describe('Component Loading States', () => {
    it('should show loading state initially', async () => {
      // Delay the asset data resolution
      assetDataService.getCompleteAssetData.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve(mockAssetData), 100))
      )

      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      expect(screen.getByText('Loading asset data...')).toBeInTheDocument()
    })

    it('should show asset data after loading', async () => {
      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Bitcoin')).toBeInTheDocument()
        expect(screen.getByText('BTC')).toBeInTheDocument()
        expect(screen.getByText('$43,250.50')).toBeInTheDocument()
      })
    })

    it('should show error state when asset data fails to load', async () => {
      assetDataService.getCompleteAssetData.mockRejectedValue(new Error('Asset BTC not found'))

      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Asset BTC not found')).toBeInTheDocument()
        expect(screen.getByText('Back to Investments')).toBeInTheDocument()
      })
    })
  })

  describe('Asset Data Display', () => {
    it('should display asset header information correctly', async () => {
      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Bitcoin')).toBeInTheDocument()
        expect(screen.getByText('BTC')).toBeInTheDocument()
        expect(screen.getByText('₿')).toBeInTheDocument()
        expect(screen.getByText('$43,250.50')).toBeInTheDocument()
        expect(screen.getByText('+2.45% ($1,032.50)')).toBeInTheDocument()
      })
    })

    it('should show trending up indicator for positive change', async () => {
      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        const trendingElement = document.querySelector('.text-green-600')
        expect(trendingElement).toBeInTheDocument()
      })
    })

    it('should show trending down indicator for negative change', async () => {
      const bearishAssetData = {
        ...mockAssetData,
        change24h: -2.45,
        changeAmount: -1032.50,
        trend: 'down',
        change24hFormatted: '-2.45%'
      }

      assetDataService.getCompleteAssetData.mockResolvedValue(bearishAssetData)

      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        const trendingElement = document.querySelector('.text-red-600')
        expect(trendingElement).toBeInTheDocument()
      })
    })

    it('should display market statistics in single card', async () => {
      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Market Statistics')).toBeInTheDocument()
        expect(screen.getByText('$850.2B')).toBeInTheDocument()
        expect(screen.getByText('$28.4B')).toBeInTheDocument()
        expect(screen.getByText('#1')).toBeInTheDocument()
        expect(screen.getByText('19.8M BTC')).toBeInTheDocument()
      })
    })
  })

  describe('User Holdings Integration', () => {
    it('should display user holdings when user has assets', async () => {
      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Your Holdings')).toBeInTheDocument()
        expect(screen.getByText('0.025000 BTC')).toBeInTheDocument()
        expect(screen.getByText('$43,256.25')).toBeInTheDocument() // 0.025 * 43250.50
        expect(screen.getByText('$43,250.00')).toBeInTheDocument() // 1081.25 / 0.025
      })
    })

    it('should not display holdings section when user has no assets', async () => {
      dataManager.getBalance.mockReturnValue({ assets: {} })

      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.queryByText('Your Holdings')).not.toBeInTheDocument()
      })
    })

    it('should hide avg buy price when it is zero', async () => {
      const balanceWithZeroAvg = {
        assets: {
          BTC: {
            quantity: 0.025,
            investedAmount: 0,
            assetId: 'BTC'
          }
        }
      }
      dataManager.getBalance.mockReturnValue(balanceWithZeroAvg)

      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.queryByText('Avg Buy Price')).not.toBeInTheDocument()
      })
    })

    it('should update current value when price changes', async () => {
      let priceUpdateCallback
      assetDataService.subscribeToPriceUpdates.mockImplementation((symbol, callback) => {
        priceUpdateCallback = callback
        return () => {}
      })

      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('$43,256.25')).toBeInTheDocument()
      })

      // Simulate price update
      const newPriceData = {
        price: 50000,
        change24h: 15.6,
        changeAmount: 6749.50,
        trend: 'up'
      }

      act(() => {
        priceUpdateCallback(newPriceData)
      })

      await waitFor(() => {
        // Current value should update: 0.025 * 50000 = 1250
        expect(screen.getByText('$1,250.00')).toBeInTheDocument()
      })
    })
  })

  describe('Real-time Price Updates', () => {
    it('should subscribe to price updates on mount', async () => {
      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(assetDataService.subscribeToPriceUpdates).toHaveBeenCalledWith(
          'BTC',
          expect.any(Function)
        )
      })
    })

    it('should update price display when receiving price updates', async () => {
      let priceUpdateCallback
      assetDataService.subscribeToPriceUpdates.mockImplementation((symbol, callback) => {
        priceUpdateCallback = callback
        return () => {}
      })

      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('$43,250.50')).toBeInTheDocument()
      })

      // Simulate price update
      const newPriceData = {
        price: 45000,
        change24h: 4.05,
        changeAmount: 1749.50,
        trend: 'up',
        priceFormatted: '$45,000.00',
        change24hFormatted: '+4.05%',
        changeAmountFormatted: '$1,749.50'
      }

      act(() => {
        priceUpdateCallback(newPriceData)
      })

      await waitFor(() => {
        expect(screen.getByText('$45,000.00')).toBeInTheDocument()
        expect(screen.getByText('+4.05% ($1,749.50)')).toBeInTheDocument()
      })
    })

    it('should show last update timestamp', async () => {
      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText(/Updated:/)).toBeInTheDocument()
      })
    })
  })

  describe('Balance Event Subscriptions', () => {
    it('should subscribe to balance updates', async () => {
      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(dataManager.subscribe).toHaveBeenCalledWith('balance:updated', expect.any(Function))
        expect(dataManager.subscribe).toHaveBeenCalledWith('assets:updated', expect.any(Function))
      })
    })

    it('should update holdings when balance is updated', async () => {
      let balanceUpdateCallback
      dataManager.subscribe.mockImplementation((event, callback) => {
        if (event === 'balance:updated') {
          balanceUpdateCallback = callback
        }
        return () => {}
      })

      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('0.025000 BTC')).toBeInTheDocument()
      })

      // Update balance data
      const newBalance = {
        assets: {
          BTC: {
            quantity: 0.05,
            investedAmount: 2162.50,
            assetId: 'BTC'
          }
        }
      }
      dataManager.getBalance.mockReturnValue(newBalance)

      act(() => {
        balanceUpdateCallback()
      })

      await waitFor(() => {
        expect(screen.getByText('0.050000 BTC')).toBeInTheDocument()
      })
    })
  })

  describe('Tab Navigation', () => {
    it('should show overview tab by default', async () => {
      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('About Bitcoin')).toBeInTheDocument()
        expect(screen.getByText('Market Statistics')).toBeInTheDocument()
      })
    })

    it('should show chart tab when clicked', async () => {
      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        fireEvent.click(screen.getByText('Chart'))
        expect(screen.getByText('Chart Coming Soon')).toBeInTheDocument()
      })
    })

    it('should show info tab when clicked', async () => {
      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        fireEvent.click(screen.getByText('Info'))
        expect(screen.getByText('Asset Information')).toBeInTheDocument()
        expect(screen.getByText('Website')).toBeInTheDocument()
        expect(screen.getByText('Whitepaper')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation Actions', () => {
    it('should navigate to buy page when buy button is clicked', async () => {
      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        const buyButton = screen.getByText('Buy BTC')
        fireEvent.click(buyButton)
        expect(mockNavigate).toHaveBeenCalledWith('/category/investment/buy?asset=BTC')
      })
    })

    it('should show sell button when user has holdings', async () => {
      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Sell BTC')).toBeInTheDocument()
      })
    })

    it('should navigate to sell page when sell button is clicked', async () => {
      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        const sellButton = screen.getByText('Sell BTC')
        fireEvent.click(sellButton)
        expect(mockNavigate).toHaveBeenCalledWith('/category/investment/sell?asset=BTC')
      })
    })

    it('should not show sell button when user has no holdings', async () => {
      dataManager.getBalance.mockReturnValue({ assets: {} })

      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.queryByText('Sell BTC')).not.toBeInTheDocument()
      })
    })

    it('should navigate back to investments when back button is clicked', async () => {
      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        const backButton = screen.getByText('Back to Investments')
        fireEvent.click(backButton)
        expect(mockNavigate).toHaveBeenCalledWith('/category/investment')
      })
    })
  })

  describe('Cleanup and Memory Management', () => {
    it('should unsubscribe from all subscriptions on unmount', async () => {
      const unsubscribePriceUpdates = vi.fn()
      const unsubscribeBalanceUpdates = vi.fn()

      assetDataService.subscribeToPriceUpdates.mockReturnValue(unsubscribePriceUpdates)
      dataManager.subscribe.mockReturnValue(unsubscribeBalanceUpdates)

      const { unmount } = render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(assetDataService.subscribeToPriceUpdates).toHaveBeenCalled()
      })

      unmount()

      expect(unsubscribePriceUpdates).toHaveBeenCalled()
      expect(unsubscribeBalanceUpdates).toHaveBeenCalled()
    })
  })

  describe('Edge Cases', () => {
    it('should navigate to investments when no symbol is provided', async () => {
      vi.doMock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom')
        return {
          ...actual,
          useNavigate: () => mockNavigate,
          useParams: () => ({ symbol: null })
        }
      })

      render(
        <MemoryRouter initialEntries={['/asset/']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      expect(mockNavigate).toHaveBeenCalledWith('/category/investment')
    })

    it('should handle asset data service errors gracefully', async () => {
      assetDataService.getCompleteAssetData.mockRejectedValue(new Error('Network error'))

      render(
        <MemoryRouter initialEntries={['/asset/BTC']}>
          <AssetDetailPage />
        </MemoryRouter>
      )

      await waitFor(() => {
        expect(screen.getByText('Network error')).toBeInTheDocument()
      })
    })
  })
})