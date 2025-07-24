/**
 * Component Tests for MarketIndicators
 * Tests the market data display component with real-time updates
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { renderWithProviders } from '../../test/utils/testHelpers.js'
import { mockMarketData, mockApiResponses } from '../../test/mocks/mockData.js'
import MarketIndicators from '../MarketIndicators.jsx'

// Mock the market data hook
vi.mock('../../hooks/useMarketData.js', () => ({
  default: () => ({
    getMarketSummary: vi.fn(() => mockMarketData.crypto),
    isLoading: false,
    error: null,
    refresh: vi.fn(),
    lastUpdate: '2025-01-22T10:30:00Z'
  })
}))

describe('MarketIndicators Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('Rendering', () => {
    it('should render market data correctly', () => {
      renderWithProviders(<MarketIndicators />)
      
      // Check if Bitcoin data is displayed
      expect(screen.getByText('Bitcoin')).toBeInTheDocument()
      expect(screen.getByText('BTC')).toBeInTheDocument()
      expect(screen.getByText(/\\$43,250\\.50/)).toBeInTheDocument()
      
      // Check if Ethereum data is displayed
      expect(screen.getByText('Ethereum')).toBeInTheDocument()
      expect(screen.getByText('ETH')).toBeInTheDocument()
      expect(screen.getByText(/\\$2,680\\.75/)).toBeInTheDocument()
    })
    
    it('should display percentage changes with correct styling', () => {
      renderWithProviders(<MarketIndicators />)
      
      // Bitcoin has positive change (+2.4%)
      const btcChange = screen.getByText(/\\+2\\.4%/)
      expect(btcChange).toBeInTheDocument()
      expect(btcChange).toHaveClass('text-green-600') // Positive change styling
      
      // Ethereum has negative change (-1.2%)
      const ethChange = screen.getByText(/-1\\.2%/)
      expect(ethChange).toBeInTheDocument()
      expect(ethChange).toHaveClass('text-red-600') // Negative change styling
    })
    
    it('should show trending icons based on price changes', () => {
      renderWithProviders(<MarketIndicators />)
      
      const trendingUpIcons = screen.getAllByTestId('trending-up-icon')
      const trendingDownIcons = screen.getAllByTestId('trending-down-icon')
      
      expect(trendingUpIcons).toHaveLength(1) // BTC is up
      expect(trendingDownIcons).toHaveLength(1) // ETH is down
    })
  })
  
  describe('Loading State', () => {
    it('should show loading state when data is loading', () => {
      // Mock loading state
      vi.doMock('../../hooks/useMarketData.js', () => ({
        default: () => ({
          getMarketSummary: vi.fn(() => []),
          isLoading: true,
          error: null,
          refresh: vi.fn(),
          lastUpdate: null
        })
      }))
      
      renderWithProviders(<MarketIndicators />)
      
      expect(screen.getByText('Loading market data...')).toBeInTheDocument()
      expect(screen.getByTestId('loading-spinner')).toBeInTheDocument()
    })
  })
  
  describe('Error Handling', () => {
    it('should display error message when market data fails to load', () => {
      // Mock error state
      vi.doMock('../../hooks/useMarketData.js', () => ({
        default: () => ({
          getMarketSummary: vi.fn(() => []),
          isLoading: false,
          error: 'Failed to fetch market data',
          refresh: vi.fn(),
          lastUpdate: null
        })
      }))
      
      renderWithProviders(<MarketIndicators />)
      
      expect(screen.getByText('Failed to load market data')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument()
    })
    
    it('should call refresh when retry button is clicked', async () => {
      const mockRefresh = vi.fn()
      
      vi.doMock('../../hooks/useMarketData.js', () => ({
        default: () => ({
          getMarketSummary: vi.fn(() => []),
          isLoading: false,
          error: 'Failed to fetch market data',
          refresh: mockRefresh,
          lastUpdate: null
        })
      }))
      
      renderWithProviders(<MarketIndicators />)
      
      const retryButton = screen.getByRole('button', { name: /retry/i })
      retryButton.click()
      
      await waitFor(() => {
        expect(mockRefresh).toHaveBeenCalledOnce()
      })
    })
  })
  
  describe('Accessibility', () => {
    it('should have proper ARIA labels for screen readers', () => {
      renderWithProviders(<MarketIndicators />)
      
      const marketSection = screen.getByRole('region', { name: /market indicators/i })
      expect(marketSection).toBeInTheDocument()
      
      const marketItems = screen.getAllByRole('listitem')
      expect(marketItems.length).toBeGreaterThan(0)
      
      marketItems.forEach(item => {
        expect(item).toHaveAttribute('aria-label')
      })
    })
    
    it('should be keyboard navigable', () => {
      renderWithProviders(<MarketIndicators />)
      
      const marketItems = screen.getAllByRole('button')
      marketItems.forEach(item => {
        expect(item).toHaveAttribute('tabIndex')
        expect(parseInt(item.getAttribute('tabIndex'))).toBeGreaterThanOrEqual(0)
      })
    })
  })
  
  describe('Real-time Updates', () => {
    it('should update when market data changes', async () => {
      const { rerender } = renderWithProviders(<MarketIndicators />)
      
      // Initial render
      expect(screen.getByText(/\\$43,250\\.50/)).toBeInTheDocument()
      
      // Mock updated data
      const updatedMockData = {
        ...mockMarketData.crypto[0],
        price: 44000.00,
        change24h: 3.5
      }
      
      vi.doMock('../../hooks/useMarketData.js', () => ({
        default: () => ({
          getMarketSummary: vi.fn(() => [updatedMockData]),
          isLoading: false,
          error: null,
          refresh: vi.fn(),
          lastUpdate: new Date().toISOString()
        })
      }))
      
      // Rerender with updated data
      rerender(<MarketIndicators />)
      
      await waitFor(() => {
        expect(screen.getByText(/\\$44,000\\.00/)).toBeInTheDocument()
        expect(screen.getByText(/\\+3\\.5%/)).toBeInTheDocument()
      })
    })
  })
  
  describe('Responsive Design', () => {
    it('should adapt to mobile screen sizes', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      renderWithProviders(<MarketIndicators />)
      
      const container = screen.getByTestId('market-indicators-container')
      expect(container).toHaveClass('mobile-layout')
    })
  })
  
  describe('Performance', () => {
    it('should memoize expensive calculations', () => {
      const mockCalculation = vi.fn()
      
      // Mock the hook to include calculation tracking
      vi.doMock('../../hooks/useMarketData.js', () => ({
        default: () => ({
          getMarketSummary: vi.fn(() => {
            mockCalculation()
            return mockMarketData.crypto
          }),
          isLoading: false,
          error: null,
          refresh: vi.fn(),
          lastUpdate: '2025-01-22T10:30:00Z'
        })
      }))
      
      const { rerender } = renderWithProviders(<MarketIndicators />)
      
      expect(mockCalculation).toHaveBeenCalledOnce()
      
      // Rerender with same props
      rerender(<MarketIndicators />)
      
      // Should not recalculate due to memoization
      expect(mockCalculation).toHaveBeenCalledOnce()
    })
  })
})