/**
 * Test suite for AssetDetailPage background image improvements
 * Tests background image display and styling for all asset categories
 */

import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import AssetDetailPage from '../AssetDetailPage.jsx'
import { assetDataService } from '../../services/assetDataService.js'
import { dataManager } from '../../services/DataManager.js'

// Mock the services
vi.mock('../../services/assetDataService.js')
vi.mock('../../services/DataManager.js')

// Mock react-router-dom
const mockNavigate = vi.fn()
const mockUseParams = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useParams: mockUseParams
  }
})

const mockAssetData = {
  BTC: {
    symbol: 'BTC',
    name: 'Bitcoin',
    icon: '₿',
    price: 43250,
    priceFormatted: '$43,250.00',
    change24h: 2.5,
    change24hFormatted: '+2.50%',
    changeAmountFormatted: '$1,065.00',
    trend: 'up',
    description: 'The world\'s first and largest cryptocurrency by market cap',
    marketCap: 850.2e9,
    volume24h: 28.4e9,
    supply: '19.8M BTC',
    rank: 1
  },
  ETH: {
    symbol: 'ETH',
    name: 'Ethereum',
    icon: 'Ξ',
    price: 2680,
    priceFormatted: '$2,680.00',
    change24h: -1.2,
    change24hFormatted: '-1.20%',
    changeAmountFormatted: '$32.16',
    trend: 'down',
    description: 'Decentralized platform for smart contracts and DApps',
    marketCap: 322.1e9,
    volume24h: 15.2e9,
    supply: '120.3M ETH',
    rank: 2
  },
  PAXG: {
    symbol: 'PAXG',
    name: 'PAX Gold',
    icon: '🥇',
    price: 2687.34,
    priceFormatted: '$2,687.34',
    change24h: 0.8,
    change24hFormatted: '+0.80%',
    changeAmountFormatted: '$21.50',
    trend: 'up',
    description: 'Gold-backed cryptocurrency. Each token represents 1 fine troy ounce of gold.',
    marketCap: 540.2e6,
    volume24h: 8.9e6,
    supply: '201,045 PAXG',
    rank: 78
  },
  MAG7: {
    symbol: 'MAG7',
    name: 'Magnificent 7 Index',
    icon: '🚀',
    price: 485.23,
    priceFormatted: '$485.23',
    change24h: 1.5,
    change24hFormatted: '+1.50%',
    changeAmountFormatted: '$7.28',
    trend: 'up',
    description: 'Tokenized index tracking the top 7 tech giants: Apple, Microsoft, Google, Amazon, Nvidia, Meta, Tesla',
    marketCap: 125e6,
    volume24h: 3.8e6,
    supply: '257,845 MAG7',
    rank: 152
  },
  REIT: {
    symbol: 'REIT',
    name: 'Global REIT Fund',
    icon: '🏢',
    price: 245.67,
    priceFormatted: '$245.67',
    change24h: 0.3,
    change24hFormatted: '+0.30%',
    changeAmountFormatted: '$0.74',
    trend: 'up',
    description: 'Tokenized real estate investment trust providing exposure to global commercial properties',
    marketCap: 45e6,
    volume24h: 890e3,
    supply: '183,245 REIT',
    rank: 245
  }
}

const mockBalance = {
  totalUSD: 5000,
  availableForSpending: 2000,
  investedAmount: 3000,
  assets: {
    BTC: { quantity: 0.05, investedAmount: 2000 }
  }
}

describe('AssetDetailPage Background Images', () => {
  beforeEach(() => {
    // Set default params
    mockUseParams.mockReturnValue({ symbol: 'BTC' })
    
    // Mock assetDataService methods
    assetDataService.getCompleteAssetData = vi.fn().mockImplementation((symbol) => {
      return Promise.resolve(mockAssetData[symbol.toUpperCase()] || mockAssetData.BTC)
    })
    assetDataService.subscribeToPriceUpdates = vi.fn().mockImplementation((symbol, callback) => {
      return vi.fn() // Return unsubscribe function
    })

    // Mock DataManager methods
    dataManager.getBalance = vi.fn().mockReturnValue(mockBalance)
    dataManager.subscribe = vi.fn().mockImplementation((event, callback) => {
      return vi.fn() // Return unsubscribe function
    })

    // Clear navigation mock
    mockNavigate.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const renderComponentWithSymbol = (symbol) => {
    // Mock useParams to return the specified symbol
    mockUseParams.mockReturnValue({ symbol })
    
    return render(
      <BrowserRouter>
        <AssetDetailPage />
      </BrowserRouter>
    )
  }

  describe('Background Image Display', () => {
    it('should display Bitcoin background image for BTC', async () => {
      renderComponentWithSymbol('BTC')

      await waitFor(() => {
        const headerBg = screen.getByRole('banner') || document.querySelector('.asset-header-bg')
        expect(headerBg).toHaveStyle({
          backgroundImage: 'url(https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=1200&h=300&fit=crop&crop=center)'
        })
      })
    })

    it('should display Ethereum background image for ETH', async () => {
      renderComponentWithSymbol('ETH')

      await waitFor(() => {
        const headerBg = document.querySelector('.asset-header-bg')
        expect(headerBg).toHaveStyle({
          backgroundImage: 'url(https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=1200&h=300&fit=crop&crop=center)'
        })
      })
    })

    it('should display gold background image for PAXG', async () => {
      renderComponentWithSymbol('PAXG')

      await waitFor(() => {
        const headerBg = document.querySelector('.asset-header-bg')
        expect(headerBg).toHaveStyle({
          backgroundImage: 'url(https://images.unsplash.com/photo-1610375461369-d1859bc96b13?w=1200&h=300&fit=crop&crop=center)'
        })
      })
    })

    it('should display tech stocks background image for MAG7', async () => {
      renderComponentWithSymbol('MAG7')

      await waitFor(() => {
        const headerBg = document.querySelector('.asset-header-bg')
        expect(headerBg).toHaveStyle({
          backgroundImage: 'url(https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=300&fit=crop&crop=center)'
        })
      })
    })

    it('should display real estate background image for REIT', async () => {
      renderComponentWithSymbol('REIT')

      await waitFor(() => {
        const headerBg = document.querySelector('.asset-header-bg')
        expect(headerBg).toHaveStyle({
          backgroundImage: 'url(https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?w=1200&h=300&fit=crop&crop=center)'
        })
      })
    })

    it('should fallback to Bitcoin background for unknown assets', async () => {
      renderComponentWithSymbol('UNKNOWN')

      await waitFor(() => {
        const headerBg = document.querySelector('.asset-header-bg')
        expect(headerBg).toHaveStyle({
          backgroundImage: 'url(https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=1200&h=300&fit=crop&crop=center)'
        })
      })
    })
  })

  describe('Header Styling and Layout', () => {
    it('should apply correct background styles', async () => {
      renderComponentWithSymbol('BTC')

      await waitFor(() => {
        const headerBg = document.querySelector('.asset-header-bg')
        expect(headerBg).toHaveStyle({
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          minHeight: '200px'
        })
        expect(headerBg).toHaveClass('relative', 'rounded-2xl', 'overflow-hidden')
      })
    })

    it('should display overlay with correct gradient', async () => {
      renderComponentWithSymbol('BTC')

      await waitFor(() => {
        const overlay = document.querySelector('.asset-header-overlay')
        expect(overlay).toHaveClass('absolute', 'inset-0')
        expect(overlay).toHaveStyle({
          background: 'linear-gradient(135deg, rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.5))'
        })
      })
    })

    it('should display content with proper white text styling', async () => {
      renderComponentWithSymbol('BTC')

      await waitFor(() => {
        const content = document.querySelector('.asset-header-content')
        expect(content).toHaveClass('relative', 'z-10', 'p-8', 'text-white')
        
        const title = screen.getByText('Bitcoin')
        expect(title).toHaveClass('text-4xl', 'font-bold', 'text-white', 'mb-2')
        
        const symbol = screen.getByText('BTC')
        expect(symbol).toHaveClass('text-white/80', 'text-xl', 'font-medium')
      })
    })

    it('should display asset icon with backdrop blur styling', async () => {
      renderComponentWithSymbol('BTC')

      await waitFor(() => {
        const iconContainer = document.querySelector('.asset-icon-large')
        expect(iconContainer).toHaveClass('p-4', 'rounded-xl', 'bg-white/20', 'backdrop-blur-sm')
        
        const icon = screen.getByText('₿')
        expect(icon).toHaveClass('text-5xl')
      })
    })

    it('should display price information with backdrop blur styling', async () => {
      renderComponentWithSymbol('BTC')

      await waitFor(() => {
        const priceContainer = document.querySelector('.text-right.bg-white\\/10')
        expect(priceContainer).toHaveClass('bg-white/10', 'backdrop-blur-sm', 'rounded-xl', 'p-4')
        
        const price = screen.getByText('$43,250.00')
        expect(price).toHaveClass('text-4xl', 'font-bold', 'text-white')
      })
    })

    it('should display asset description when available', async () => {
      renderComponentWithSymbol('BTC')

      await waitFor(() => {
        const description = screen.getByText(/The world's first and largest cryptocurrency/)
        expect(description).toHaveClass('text-white/70', 'text-sm', 'mt-2', 'max-w-2xl', 'leading-relaxed')
      })
    })
  })

  describe('Price Change Indicators', () => {
    it('should display positive price change with green styling', async () => {
      renderComponentWithSymbol('BTC')

      await waitFor(() => {
        const changeElement = screen.getByText('+2.50% ($1,065.00)')
        const changeContainer = changeElement.closest('div')
        expect(changeContainer).toHaveClass('text-green-300')
        
        const trendIcon = changeContainer.querySelector('svg')
        expect(trendIcon).toHaveClass('w-6', 'h-6')
      })
    })

    it('should display negative price change with red styling', async () => {
      renderComponentWithSymbol('ETH')

      await waitFor(() => {
        const changeElement = screen.getByText('-1.20% ($32.16)')
        const changeContainer = changeElement.closest('div')
        expect(changeContainer).toHaveClass('text-red-300')
      })
    })
  })

  describe('Responsive Design', () => {
    it('should maintain proper spacing and layout on different screen sizes', async () => {
      renderComponentWithSymbol('BTC')

      await waitFor(() => {
        const headerContent = document.querySelector('.asset-header-content')
        expect(headerContent).toHaveClass('p-8')
        
        const layout = headerContent.querySelector('.flex')
        expect(layout).toHaveClass('flex', 'items-start', 'justify-between')
        
        const assetInfo = layout.querySelector('.flex.items-center.gap-6')
        expect(assetInfo).toHaveClass('flex', 'items-center', 'gap-6')
      })
    })
  })

  describe('Accessibility', () => {
    it('should maintain proper contrast for text over background images', async () => {
      renderComponentWithSymbol('BTC')

      await waitFor(() => {
        // Check that overlay is present to ensure text readability
        const overlay = document.querySelector('.asset-header-overlay')
        expect(overlay).toBeInTheDocument()
        
        // Check that text uses white/light colors for contrast
        const title = screen.getByText('Bitcoin')
        const price = screen.getByText('$43,250.00')
        
        expect(title).toHaveClass('text-white')
        expect(price).toHaveClass('text-white')
      })
    })
  })

  describe('All Asset Categories', () => {
    const assetCategories = [
      { symbol: 'BTC', category: 'crypto', name: 'Bitcoin' },
      { symbol: 'ETH', category: 'crypto', name: 'Ethereum' },
      { symbol: 'SOL', category: 'crypto', name: 'Solana' },
      { symbol: 'SUI', category: 'crypto', name: 'Sui' },
      { symbol: 'PAXG', category: 'gold', name: 'PAX Gold' },
      { symbol: 'XAUT', category: 'gold', name: 'Tether Gold' },
      { symbol: 'MAG7', category: 'stocks', name: 'Magnificent 7 Index' },
      { symbol: 'SPX', category: 'stocks', name: 'S&P 500 Token' },
      { symbol: 'REIT', category: 'realestate', name: 'Global REIT Fund' }
    ]

    assetCategories.forEach(({ symbol, category, name }) => {
      it(`should load and display background image for ${symbol} (${category})`, async () => {
        renderComponentWithSymbol(symbol)

        await waitFor(() => {
          const headerBg = document.querySelector('.asset-header-bg')
          expect(headerBg).toBeInTheDocument()
          
          // Check that a background image is set
          const backgroundImageStyle = headerBg.style.backgroundImage
          expect(backgroundImageStyle).toContain('https://images.unsplash.com/')
          expect(backgroundImageStyle).toContain('w=1200&h=300')
        })
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle missing asset data gracefully', async () => {
      assetDataService.getCompleteAssetData.mockRejectedValue(new Error('Asset not found'))
      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      renderComponentWithSymbol('INVALID')

      // Should not crash and should attempt to load data
      await waitFor(() => {
        expect(assetDataService.getCompleteAssetData).toHaveBeenCalledWith('INVALID')
      })

      consoleSpy.mockRestore()
    })
  })
})