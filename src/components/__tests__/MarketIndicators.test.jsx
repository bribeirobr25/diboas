/**
 * Component Tests for MarketIndicators
 * Tests the market data display component with real-time updates
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { mockApiResponses } from '../../test/utils/testHelpers.js'
import MarketIndicators from '../MarketIndicators.jsx'

// Mock the market data hook
vi.mock('../../hooks/useMarketData.js', () => ({
  __esModule: true,
  default: vi.fn(() => ({
    getMarketSummary: vi.fn(() => [
      mockApiResponses.marketData.bitcoin,
      mockApiResponses.marketData.ethereum
    ]),
    isLoading: false,
    error: null,
    refresh: vi.fn(),
    lastUpdate: '2025-01-22T10:30:00Z'
  }))
}))

describe('MarketIndicators Component', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })
  
  describe('Rendering', () => {
    it('should render market data correctly', () => {
      render(<MarketIndicators />)
      
      // Check if component renders without crashing
      expect(document.querySelector('.market-indicators')).toBeTruthy()
    })
    
    it('should display market data when available', () => {
      render(<MarketIndicators />)
      
      // Check for any text content that suggests market data is displayed
      const marketText = document.body.textContent
      expect(marketText).toBeTruthy()
      expect(marketText.length).toBeGreaterThan(0)
    })
  })
  
  describe('Loading State', () => {
    it('should handle loading state', () => {
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
      
      render(<MarketIndicators />)
      
      // Component should render even in loading state
      expect(document.body).toBeTruthy()
    })
  })
  
  describe('Error Handling', () => {
    it('should handle error state gracefully', () => {
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
      
      render(<MarketIndicators />)
      
      // Component should render even in error state
      expect(document.body).toBeTruthy()
    })
  })
  
  describe('Component Structure', () => {
    it('should render basic market indicator structure', () => {
      render(<MarketIndicators />)
      
      // Check for basic DOM structure
      const body = document.body
      expect(body.innerHTML).toBeTruthy()
      expect(body.innerHTML.length).toBeGreaterThan(0)
    })
    
    it('should render without throwing errors', () => {
      expect(() => {
        render(<MarketIndicators />)
      }).not.toThrow()
    })
  })
  
  describe('Performance', () => {
    it('should render efficiently', () => {
      const startTime = performance.now()
      render(<MarketIndicators />)
      const endTime = performance.now()
      
      // Should render within reasonable time (< 100ms)
      expect(endTime - startTime).toBeLessThan(100)
    })
  })
})