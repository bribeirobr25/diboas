/**
 * Example of Fixed YieldCategory DataManager Integration Test
 * Demonstrates proper use of act() to fix React warnings
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import YieldCategory from '../../components/categories/YieldCategory.jsx'

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

// Import the shared mock
import { createMockDataManager } from '../utils/dataManagerMock.js'

describe('YieldCategory DataManager Integration - Fixed', () => {
  let mockDataManager
  let mockSubscriptions = []

  beforeEach(() => {
    // Create a fresh mock for each test
    mockDataManager = createMockDataManager({
      finObjectives: {
        'millennial-homeowner': {
          id: 'millennial-homeowner',
          title: 'Millennial Homeowner',
          popular: true,
          currentAmount: 0,
          isActive: false
        }
      },
      yieldData: {
        totalAllocated: 156.78,
        activeStrategies: 2,
        totalEarning: 45.67,
        avgAPY: 8.5,
        goalsProgress: 15.3
      }
    })

    // Track subscriptions
    mockDataManager.subscribe.mockImplementation((event, callback) => {
      const unsubscribe = vi.fn()
      mockSubscriptions.push({ event, callback, unsubscribe })
      return unsubscribe
    })

    // Mock the module
    vi.doMock('../../services/DataManager.js', () => ({
      dataManager: mockDataManager
    }))
  })

  afterEach(() => {
    mockSubscriptions = []
    vi.clearAllMocks()
    vi.resetModules()
  })

  describe('DataManager Event Subscriptions - Fixed with act()', () => {
    it('should update yield data when yieldData:updated event fires', async () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('$45.67')).toBeInTheDocument()
      })

      // Find the yieldData update callback
      const yieldDataCallback = mockSubscriptions.find(sub => sub.event === 'yieldData:updated')?.callback

      // Simulate updated yield data - WRAP IN ACT
      const updatedYieldData = {
        activeStrategies: 3,
        totalEarning: 89.12,
        avgAPY: 12.1,
        goalsProgress: 25.8
      }

      // Fire the callback with updated data inside act()
      await act(async () => {
        yieldDataCallback(updatedYieldData)
      })

      // Now check for updates
      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
        expect(screen.getByText('$89.12')).toBeInTheDocument()
        expect(screen.getByText('12.1%')).toBeInTheDocument()
        expect(screen.getByText('26%')).toBeInTheDocument() // rounded
      })
    })

    it('should refresh yield data when balance:updated event fires', async () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('$45.67')).toBeInTheDocument()
      })

      // Find the balance update callback
      const balanceCallback = mockSubscriptions.find(sub => sub.event === 'balance:updated')?.callback

      // Mock the getYieldData to return new data
      mockDataManager.getYieldData.mockReturnValue({
        totalAllocated: 200.00,
        activeStrategies: 3,
        totalEarning: 100.00,
        avgAPY: 10.0,
        goalsProgress: 30.0
      })

      // Fire the callback inside act()
      await act(async () => {
        balanceCallback({ totalUSD: 1000 })
      })

      // Verify the data was refreshed
      await waitFor(() => {
        expect(mockDataManager.getYieldData).toHaveBeenCalled()
      })
    })

    it('should handle rapid data updates efficiently', async () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('$45.67')).toBeInTheDocument()
      })

      const yieldDataCallback = mockSubscriptions.find(sub => sub.event === 'yieldData:updated')?.callback

      // Simulate rapid updates - all wrapped in act()
      await act(async () => {
        for (let i = 0; i < 10; i++) {
          yieldDataCallback({
            activeStrategies: i,
            totalEarning: i * 10,
            avgAPY: i * 2,
            goalsProgress: i * 5
          })
        }
      })

      // Should show the last update
      await waitFor(() => {
        expect(screen.getByText('9')).toBeInTheDocument()
        expect(screen.getByText('$90')).toBeInTheDocument()
      })
    })
  })

  describe('Component Interaction - Fixed with act()', () => {
    it('should start objective when clicking start button', async () => {
      mockDataManager.startFinObjective.mockReturnValue({
        id: 'millennial-homeowner',
        isActive: true,
        currentAmount: 100
      })

      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Find and click start button
      const startButton = await screen.findByText('Start Objective')
      
      // Wrap the click in act()
      await act(async () => {
        fireEvent.click(startButton)
      })

      // Verify the objective was started
      await waitFor(() => {
        expect(mockDataManager.startFinObjective).toHaveBeenCalledWith('millennial-homeowner', 0)
      })
    })
  })
})

// Helper function to wrap async operations in act
export async function actAsync(fn) {
  await act(async () => {
    await fn()
  })
}