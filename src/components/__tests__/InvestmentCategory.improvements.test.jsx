/**
 * Test suite for InvestmentCategory improvements
 * Tests real-time asset data, user holdings display, and visual distinctions
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import InvestmentCategory from '../categories/InvestmentCategory.jsx'
import { dataManager } from '../../services/DataManager.js'
import { assetDataService } from '../../services/assetDataService.js'

// Mock the services
vi.mock('../../services/DataManager.js')
vi.mock('../../services/assetDataService.js')

// Mock navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock data
const mockBalance = {
  totalUSD: 5000,
  availableForSpending: 2000,
  investedAmount: 3000,
  assets: {
    BTC: { quantity: 0.05, investedAmount: 2000 },
    ETH: { quantity: 1.2, investedAmount: 1000 },
    SOL: { quantity: 0, investedAmount: 0 },
    SUI: { quantity: 0, investedAmount: 0 }
  }
}

const mockAssetData = {
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    price: 43250,
    priceFormatted: '$43,250.00',
    change24h: 2.5,
    change24hFormatted: '+2.50%',
    trend: 'up',
    description: 'The world\'s first cryptocurrency'
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',    
    price: 2680,
    priceFormatted: '$2,680.00',
    change24h: -1.2,
    change24hFormatted: '-1.20%',
    trend: 'down',
    description: 'Decentralized platform for smart contracts'
  },
  SOL: {
    symbol: 'SOL',
    name: 'Solana',
    price: 98.75,
    priceFormatted: '$98.75',
    change24h: 5.8,
    change24hFormatted: '+5.80%',
    trend: 'up',
    description: 'High-performance blockchain'
  },
  SUI: {
    symbol: 'SUI',
    name: 'Sui',
    price: 1.85,
    priceFormatted: '$1.85',
    change24h: 0.5,
    change24hFormatted: '+0.50%',
    trend: 'up',
    description: 'Layer 1 blockchain for creators'
  }
}

describe('InvestmentCategory Improvements', () => {
  beforeEach(() => {
    // Mock DataManager methods
    dataManager.getBalance = vi.fn().mockReturnValue(mockBalance)
    dataManager.subscribe = vi.fn().mockImplementation((event, callback) => {
      return vi.fn() // Return unsubscribe function
    })

    // Mock assetDataService methods
    assetDataService.getCompleteAssetData = vi.fn().mockImplementation((symbol) => {
      return Promise.resolve(mockAssetData[symbol])
    })
    assetDataService.subscribeToPriceUpdates = vi.fn().mockImplementation((symbol, callback) => {
      return vi.fn() // Return unsubscribe function
    })
    assetDataService.formatPrice = vi.fn().mockImplementation((price) => `$${price.toFixed(2)}`)
    assetDataService.formatPercentage = vi.fn().mockImplementation((pct) => `${pct >= 0 ? '+' : ''}${pct.toFixed(2)}%`)

    // Clear navigation mock
    mockNavigate.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <InvestmentCategory />
      </BrowserRouter>
    )
  }

  describe('Asset Quantity Display', () => {
    it('should display correct user holdings quantities from DataManager', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/BTC • 0\.05/)).toBeInTheDocument()
        expect(screen.getByText(/ETH • 1\.20/)).toBeInTheDocument()
        expect(screen.getByText(/SOL • 0\.000000/)).toBeInTheDocument()
        expect(screen.getByText(/SUI • 0\.000000/)).toBeInTheDocument()
      })
    })

    it('should format quantities correctly for different amounts', async () => {
      const customBalance = {
        ...mockBalance,
        assets: {
          BTC: { quantity: 1.23456789, investedAmount: 1000 },
          ETH: { quantity: 0.000123, investedAmount: 500 }
        }
      }
      dataManager.getBalance.mockReturnValue(customBalance)

      renderComponent()

      await waitFor(() => {
        expect(screen.getByText(/BTC • 1\.23/)).toBeInTheDocument()
        expect(screen.getByText(/ETH • 0\.000123/)).toBeInTheDocument()
      })
    })

    it('should update quantities when balance changes', async () => {
      renderComponent()

      // Simulate balance update
      const updatedBalance = {
        ...mockBalance,
        assets: {
          ...mockBalance.assets,
          BTC: { quantity: 0.1, investedAmount: 4000 }
        }
      }

      // Get the subscription callback and call it
      const subscribeCall = dataManager.subscribe.mock.calls.find(call => call[0] === 'balance:updated')
      if (subscribeCall) {
        subscribeCall[1](updatedBalance)
      }

      await waitFor(() => {
        expect(screen.getByText(/BTC • 0\.10/)).toBeInTheDocument()
      })
    })
  })

  describe('Visual Distinction for Owned Assets', () => {
    it('should apply owned asset styling to assets with holdings', async () => {
      renderComponent()

      await waitFor(() => {
        const btcCard = screen.getByText('Bitcoin').closest('.asset-card')
        const ethCard = screen.getByText('Ethereum').closest('.asset-card')
        const solCard = screen.getByText('Solana').closest('.asset-card')

        expect(btcCard).toHaveClass('asset-card--owned', 'bg-green-50', 'border-green-200')
        expect(ethCard).toHaveClass('asset-card--owned', 'bg-green-50', 'border-green-200')
        expect(solCard).not.toHaveClass('asset-card--owned')
      })
    })

    it('should show sell button only for owned assets', async () => {
      renderComponent()

      await waitFor(() => {
        const sellButtons = screen.getAllByText('Sell')
        expect(sellButtons).toHaveLength(2) // BTC and ETH have holdings

        // Check that SOL and SUI don't have sell buttons
        const solCard = screen.getByText('Solana').closest('.asset-card')
        const suiCard = screen.getByText('Sui').closest('.asset-card')
        
        expect(solCard.querySelector('button:has-text("Sell")')).toBeNull()
        expect(suiCard.querySelector('button:has-text("Sell")')).toBeNull()
      })
    })

    it('should navigate to sell page when sell button is clicked', async () => {
      renderComponent()

      await waitFor(() => {
        const sellButtons = screen.getAllByText('Sell')
        fireEvent.click(sellButtons[0]) // Click first sell button (should be BTC)
        
        expect(mockNavigate).toHaveBeenCalledWith('/category/investment/sell?asset=BTC')
      })
    })

    it('should apply green styling to owned asset text elements', async () => {
      renderComponent()

      await waitFor(() => {
        const btcSymbol = screen.getByText('Bitcoin').closest('.asset-card').querySelector('.asset-icon span')
        const btcPrice = screen.getByText('Bitcoin').closest('.asset-card').querySelector('.asset-price')
        
        expect(btcSymbol).toHaveClass('text-green-700', 'font-semibold')
        expect(btcPrice).toHaveClass('text-green-700', 'font-semibold')
      })
    })
  })

  describe('Asset Data Synchronization with AssetDetailPage', () => {
    it('should fetch asset data from assetDataService on category change', async () => {
      renderComponent()

      await waitFor(() => {
        expect(assetDataService.getCompleteAssetData).toHaveBeenCalledWith('BTC')
        expect(assetDataService.getCompleteAssetData).toHaveBeenCalledWith('ETH')
        expect(assetDataService.getCompleteAssetData).toHaveBeenCalledWith('SOL')
        expect(assetDataService.getCompleteAssetData).toHaveBeenCalledWith('SUI')
      })
    })

    it('should subscribe to price updates for all assets in category', async () => {
      renderComponent()

      await waitFor(() => {
        expect(assetDataService.subscribeToPriceUpdates).toHaveBeenCalledWith('BTC', expect.any(Function))
        expect(assetDataService.subscribeToPriceUpdates).toHaveBeenCalledWith('ETH', expect.any(Function))
        expect(assetDataService.subscribeToPriceUpdates).toHaveBeenCalledWith('SOL', expect.any(Function))
        expect(assetDataService.subscribeToPriceUpdates).toHaveBeenCalledWith('SUI', expect.any(Function))
      })
    })

    it('should display correct asset prices from assetDataService', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('$43,250.00')).toBeInTheDocument() // BTC price
        expect(screen.getByText('$2,680.00')).toBeInTheDocument()  // ETH price
        expect(screen.getByText('$98.75')).toBeInTheDocument()     // SOL price
        expect(screen.getByText('$1.85')).toBeInTheDocument()      // SUI price
      })
    })

    it('should display correct price changes from assetDataService', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.getByText('+2.50%')).toBeInTheDocument() // BTC change
        expect(screen.getByText('-1.20%')).toBeInTheDocument() // ETH change
        expect(screen.getByText('+5.80%')).toBeInTheDocument() // SOL change
        expect(screen.getByText('+0.50%')).toBeInTheDocument() // SUI change
      })
    })

    it('should update prices when price update subscription triggers', async () => {
      renderComponent()

      await waitFor(() => {
        // Get the BTC price subscription callback
        const btcSubscription = assetDataService.subscribeToPriceUpdates.mock.calls
          .find(call => call[0] === 'BTC')

        if (btcSubscription) {
          const callback = btcSubscription[1]
          
          // Simulate price update
          callback({
            price: 44000,
            change24h: 5.0,
            trend: 'up'
          })
        }
      })

      await waitFor(() => {
        expect(screen.getByText('$44000.00')).toBeInTheDocument()
        expect(screen.getByText('+5.00%')).toBeInTheDocument()
      })
    })
  })

  describe('Asset Sorting', () => {
    it('should sort owned assets first by investment value', async () => {
      renderComponent()

      await waitFor(() => {
        const assetCards = screen.getAllByTestId('asset-card') || screen.getAllByText(/Bitcoin|Ethereum|Solana|Sui/).map(el => el.closest('.asset-card'))
        const assetNames = assetCards.map(card => card.querySelector('.asset-name')?.textContent)
        
        // BTC (2000) should come before ETH (1000), both before non-owned assets
        const btcIndex = assetNames.indexOf('Bitcoin')
        const ethIndex = assetNames.indexOf('Ethereum')
        const solIndex = assetNames.indexOf('Solana')
        const suiIndex = assetNames.indexOf('Sui')
        
        expect(btcIndex).toBeLessThan(ethIndex)
        expect(ethIndex).toBeLessThan(solIndex)
        expect(ethIndex).toBeLessThan(suiIndex)
      })
    })
  })

  describe('Loading States', () => {
    it('should show loading spinner while fetching asset data', async () => {
      // Make the API call take time
      assetDataService.getCompleteAssetData.mockImplementation(() => 
        new Promise(resolve => setTimeout(() => resolve(mockAssetData.BTC), 100))
      )

      renderComponent()

      expect(screen.getByText('Loading assets...')).toBeInTheDocument()
      expect(screen.getByRole('status') || screen.querySelector('.animate-spin')).toBeInTheDocument()
    })

    it('should hide loading spinner after data is loaded', async () => {
      renderComponent()

      await waitFor(() => {
        expect(screen.queryByText('Loading assets...')).not.toBeInTheDocument()
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle asset data fetch errors gracefully', async () => {
      assetDataService.getCompleteAssetData.mockRejectedValue(new Error('API Error'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      renderComponent()

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error fetching asset data:', expect.any(Error))
      })

      consoleSpy.mockRestore()
    })
  })

  describe('Navigation', () => {
    it('should navigate to asset detail page when asset card is clicked', async () => {
      renderComponent()

      await waitFor(() => {
        const btcCard = screen.getByText('Bitcoin').closest('.asset-card')
        fireEvent.click(btcCard)
        
        expect(mockNavigate).toHaveBeenCalledWith('/asset/BTC')
      })
    })

    it('should navigate to buy page when buy button is clicked', async () => {
      renderComponent()

      await waitFor(() => {
        const buyButtons = screen.getAllByText('Buy')
        fireEvent.click(buyButtons[0])
        
        expect(mockNavigate).toHaveBeenCalledWith('/category/investment/buy?asset=BTC')
      })
    })
  })
})