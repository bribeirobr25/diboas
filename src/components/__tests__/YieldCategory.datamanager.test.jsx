/**
 * Comprehensive Test Suite for YieldCategory DataManager Integration
 * Tests the new DataManager-based FinObjective implementation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import YieldCategory from '../categories/YieldCategory.jsx'

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

// Mock DataManager for FinObjective integration
let mockSubscriptions = []

vi.mock('../../services/DataManager.js', () => {
  const mockDataManager = {
    getFinObjectives: vi.fn(),
    getRiskLevels: vi.fn(),
    getYieldData: vi.fn(),
    startFinObjective: vi.fn(),
    updateFinObjective: vi.fn(),
    stopFinObjective: vi.fn(),
    updateStrategyBalance: vi.fn(),
    subscribe: vi.fn((event, callback) => {
      const unsubscribe = vi.fn()
      mockSubscriptions.push({ event, callback, unsubscribe })
      return unsubscribe
    }),
    emit: vi.fn(),
    state: {
      finObjectives: {},
      yieldData: {}
    }
  }
  
  return {
    dataManager: mockDataManager
  }
})

vi.mock('../shared/PageHeader.jsx', () => ({
  default: () => <div data-testid="page-header">Page Header</div>
}))

describe('YieldCategory DataManager Integration', () => {
  let mockDataManager

  beforeEach(async () => {
    vi.clearAllMocks()
    mockSubscriptions = []

    // Get the mocked dataManager
    const { dataManager } = await import('../../services/DataManager.js')
    mockDataManager = dataManager

    // Setup default mock returns for FinObjective data
    mockDataManager.getFinObjectives.mockReturnValue({
      emergency: {
        id: 'emergency',
        title: 'Emergency Fund',
        description: 'Build a safety net for unexpected expenses',
        icon: 'Umbrella',
        color: 'bg-blue-100 text-blue-800',
        targetAmount: 5000,
        timeframe: '12 months',
        riskLevel: 'Low',
        expectedApy: '4-6%',
        strategy: 'Stable liquidity protocols',
        popular: true,
        strategies: ['USDC Lending', 'Compound', 'Aave'],
        currentAmount: 1000,
        progress: 20,
        isActive: true
      },
      vacation: {
        id: 'vacation',
        title: 'Dream Vacation',
        description: 'Save for your next adventure',
        icon: 'Plane',
        color: 'bg-green-100 text-green-800',
        targetAmount: 8000,
        timeframe: '18 months',
        riskLevel: 'Medium',
        expectedApy: '8-12%',
        strategy: 'Balanced DeFi portfolio',
        popular: true,
        strategies: ['Uniswap LP', 'Yearn', 'Compound'],
        currentAmount: 0,
        progress: 0,
        isActive: false
      }
    })

    mockDataManager.getRiskLevels.mockReturnValue({
      Low: {
        level: 'Low',
        color: 'bg-green-100 text-green-800',
        description: 'Conservative, stable returns'
      },
      Medium: {
        level: 'Medium',
        color: 'bg-yellow-100 text-yellow-800',
        description: 'Balanced risk/reward'
      },
      High: {
        level: 'High',
        color: 'bg-red-100 text-red-800',
        description: 'High risk, high reward'
      }
    })

    mockDataManager.getYieldData.mockReturnValue({
      activeStrategies: 2,
      totalEarning: 45.67,
      avgAPY: 8.5,
      goalsProgress: 15.3
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Component Initialization', () => {
    it('should load FinObjective data from DataManager on mount', async () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Verify DataManager methods were called
      await waitFor(() => {
        expect(mockDataManager.getFinObjectives).toHaveBeenCalledTimes(1)
        expect(mockDataManager.getRiskLevels).toHaveBeenCalledTimes(1)
        expect(mockDataManager.getYieldData).toHaveBeenCalledTimes(1)
      })
    })

    it('should subscribe to DataManager events on mount', async () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(mockDataManager.subscribe).toHaveBeenCalledWith('yieldData:updated', expect.any(Function))
        expect(mockDataManager.subscribe).toHaveBeenCalledWith('finObjectives:updated', expect.any(Function))
        expect(mockDataManager.subscribe).toHaveBeenCalledWith('balance:updated', expect.any(Function))
        expect(mockDataManager.subscribe).toHaveBeenCalledWith('strategy:updated', expect.any(Function))
      })
    })

    it('should display loading state initially', () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )
      
      expect(screen.getByText('Loading yield data...')).toBeInTheDocument()
    })

    it('should display FinObjective page structure after loading', async () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.queryByText('Loading yield data...')).not.toBeInTheDocument()
        expect(screen.getByText('FinObjective')).toBeInTheDocument()
        expect(screen.getByText('Goal-Driven DeFi Strategies')).toBeInTheDocument()
        expect(screen.getByText('Turn your financial goals into reality with automated DeFi strategies.')).toBeInTheDocument()
      })
    })
  })

  describe('Yield Overview Data Display', () => {
    it('should display yield data from DataManager', async () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Yield Overview')).toBeInTheDocument()
        expect(screen.getByText('Your current yield generation status from DataManager')).toBeInTheDocument()
        
        // Check for all four metrics from DataManager
        expect(screen.getByText('2')).toBeInTheDocument() // activeStrategies
        expect(screen.getByText('$45.67')).toBeInTheDocument() // totalEarning
        expect(screen.getByText('8.5%')).toBeInTheDocument() // avgAPY
        expect(screen.getByText('15%')).toBeInTheDocument() // goalsProgress (rounded)
      })
    })

    it('should handle zero yield data gracefully', async () => {
      mockDataManager.getYieldData.mockReturnValue({
        activeStrategies: 0,
        totalEarning: 0,
        avgAPY: 0,
        goalsProgress: 0
      })

      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('0')).toBeInTheDocument() // activeStrategies
        expect(screen.getByText('$0.00')).toBeInTheDocument() // totalEarning
        expect(screen.getByText('0.0%')).toBeInTheDocument() // avgAPY
        expect(screen.getByText('0%')).toBeInTheDocument() // goalsProgress
      })
    })

    it('should display yield overview with correct styling', async () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        const overviewCard = screen.getByText('Yield Overview').closest('.yield-overview-card')
        expect(overviewCard).toBeInTheDocument()

        const overviewGrid = overviewCard.querySelector('.yield-overview-grid')
        expect(overviewGrid).toBeInTheDocument()

        // Check for all four overview items
        const overviewItems = overviewCard.querySelectorAll('.yield-overview-item')
        expect(overviewItems).toHaveLength(4)
      })
    })
  })

  describe('FinObjective Data Display', () => {
    it('should display popular objectives from DataManager', async () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Popular Objectives')).toBeInTheDocument()
        expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
        expect(screen.getByText('Dream Vacation')).toBeInTheDocument()
        expect(screen.getByText('Build a safety net for unexpected expenses')).toBeInTheDocument()
        expect(screen.getByText('Save for your next adventure')).toBeInTheDocument()
      })
    })

    it('should display objective financial details', async () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('$5,000')).toBeInTheDocument() // Emergency fund target
        expect(screen.getByText('$8,000')).toBeInTheDocument() // Vacation target
        expect(screen.getByText('4-6%')).toBeInTheDocument() // Emergency APY
        expect(screen.getByText('8-12%')).toBeInTheDocument() // Vacation APY
        expect(screen.getByText('12 months')).toBeInTheDocument() // Emergency timeframe
        expect(screen.getByText('18 months')).toBeInTheDocument() // Vacation timeframe
      })
    })

    it('should display active objective progress', async () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('20.0%')).toBeInTheDocument() // Emergency fund progress
        expect(screen.getByText('($1,000)')).toBeInTheDocument() // Emergency fund current amount
      })
    })

    it('should display risk levels from DataManager', async () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        const lowRiskBadges = screen.getAllByText('Low')
        const mediumRiskBadges = screen.getAllByText('Medium')
        
        expect(lowRiskBadges.length).toBeGreaterThan(0)
        expect(mediumRiskBadges.length).toBeGreaterThan(0)
      })
    })

    it('should show badges for objective status', async () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        const popularBadges = screen.getAllByText('Popular')
        const activeBadges = screen.getAllByText('Active')
        
        expect(popularBadges.length).toBeGreaterThan(0)
        expect(activeBadges.length).toBeGreaterThan(0)
      })
    })

    it('should display all objectives section', async () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('All Financial Objectives')).toBeInTheDocument()
      })
    })
  })

  describe('DataManager Event Subscriptions', () => {
    it('should subscribe to all DataManager events', async () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(mockDataManager.subscribe).toHaveBeenCalledWith('yieldData:updated', expect.any(Function))
        expect(mockDataManager.subscribe).toHaveBeenCalledWith('finObjectives:updated', expect.any(Function))
        expect(mockDataManager.subscribe).toHaveBeenCalledWith('balance:updated', expect.any(Function))
        expect(mockDataManager.subscribe).toHaveBeenCalledWith('strategy:updated', expect.any(Function))
        expect(mockSubscriptions).toHaveLength(4)
      })
    })

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
      const yieldDataCallback = mockSubscriptions.find(sub => sub.event === 'yieldData:updated').callback

      // Simulate updated yield data
      const updatedYieldData = {
        activeStrategies: 3,
        totalEarning: 89.12,
        avgAPY: 12.1,
        goalsProgress: 25.8
      }

      // Fire the callback with updated data
      yieldDataCallback(updatedYieldData)

      await waitFor(() => {
        expect(screen.getByText('3')).toBeInTheDocument()
        expect(screen.getByText('$89.12')).toBeInTheDocument()
        expect(screen.getByText('12.1%')).toBeInTheDocument()
        expect(screen.getByText('26%')).toBeInTheDocument() // rounded
      })
    })

    it('should update objectives when finObjectives:updated event fires', async () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
      })

      // Find the finObjectives update callback
      const objectivesCallback = mockSubscriptions.find(sub => sub.event === 'finObjectives:updated').callback

      // Simulate updated objectives
      const updatedObjectives = {
        emergency: {
          ...mockDataManager.getFinObjectives().emergency,
          currentAmount: 2500,
          progress: 50
        }
      }

      // Fire the callback with updated data
      objectivesCallback(updatedObjectives)

      await waitFor(() => {
        expect(screen.getByText('50.0%')).toBeInTheDocument()
        expect(screen.getByText('($2,500)')).toBeInTheDocument()
      })
    })

    it('should refresh yield data when balance:updated event fires', async () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(mockDataManager.getYieldData).toHaveBeenCalledTimes(1)
      })

      // Find the balance update callback
      const balanceCallback = mockSubscriptions.find(sub => sub.event === 'balance:updated').callback

      // Setup new yield data for the recalculation
      mockDataManager.getYieldData.mockReturnValue({
        activeStrategies: 1,
        totalEarning: 23.45,
        avgAPY: 6.2,
        goalsProgress: 8.7
      })

      // Fire the callback
      balanceCallback()

      await waitFor(() => {
        expect(mockDataManager.getYieldData).toHaveBeenCalledTimes(2)
      })
    })

    it('should refresh yield data when strategy:updated event fires', async () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(mockDataManager.getYieldData).toHaveBeenCalledTimes(1)
      })

      // Find the strategy update callback
      const strategyCallback = mockSubscriptions.find(sub => sub.event === 'strategy:updated').callback

      // Fire the callback
      strategyCallback()

      await waitFor(() => {
        expect(mockDataManager.getYieldData).toHaveBeenCalledTimes(2)
      })
    })

    it('should cleanup subscriptions on unmount', async () => {
      const { unmount } = render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Wait for subscriptions to be set up
      await waitFor(() => {
        expect(mockDataManager.subscribe).toHaveBeenCalledTimes(4)
      })

      // Unmount the component
      unmount()

      // Verify all unsubscribe functions were called
      mockSubscriptions.forEach(sub => {
        expect(sub.unsubscribe).toHaveBeenCalled()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle DataManager errors gracefully', async () => {
      mockDataManager.getFinObjectives.mockImplementation(() => {
        throw new Error('DataManager connection failed')
      })

      const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {})

      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith('Error loading yield data:', expect.any(Error))
        expect(screen.queryByText('Loading yield data...')).not.toBeInTheDocument()
      })

      consoleSpy.mockRestore()
    })

    it('should handle missing FinObjective data gracefully', async () => {
      mockDataManager.getFinObjectives.mockReturnValue({})
      mockDataManager.getRiskLevels.mockReturnValue({})
      mockDataManager.getYieldData.mockReturnValue({
        activeStrategies: 0,
        totalEarning: 0,
        avgAPY: 0,
        goalsProgress: 0
      })

      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('FinObjective')).toBeInTheDocument()
        expect(screen.getByText('0')).toBeInTheDocument()
        expect(screen.getByText('$0.00')).toBeInTheDocument()
      })
    })

    it('should handle partial FinObjective data', async () => {
      mockDataManager.getFinObjectives.mockReturnValue({
        emergency: {
          id: 'emergency',
          title: 'Emergency Fund',
          // Missing some properties
          targetAmount: 5000,
          popular: true
        }
      })

      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
        expect(screen.getByText('$5,000')).toBeInTheDocument()
      })
    })
  })

  describe('Navigation Integration', () => {
    it('should navigate to objective configuration when objective is clicked', async () => {
      const mockNavigate = vi.fn()
      
      // Mock useNavigate hook
      vi.doMock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom')
        return {
          ...actual,
          useNavigate: () => mockNavigate
        }
      })

      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
      })

      // Click on emergency fund objective
      const emergencyCard = screen.getByText('Emergency Fund').closest('.yield-category__objective-card')
      fireEvent.click(emergencyCard)

      expect(mockNavigate).toHaveBeenCalledWith('/yield/configure?objective=emergency')
    })

    it('should navigate back to dashboard when back button is clicked', async () => {
      const mockNavigate = vi.fn()
      
      vi.doMock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom')
        return {
          ...actual,
          useNavigate: () => mockNavigate
        }
      })

      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Back to Dashboard')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Back to Dashboard'))

      expect(mockNavigate).toHaveBeenCalledWith('/app')
    })

    it('should navigate to custom objective creation', async () => {
      const mockNavigate = vi.fn()
      
      vi.doMock('react-router-dom', async () => {
        const actual = await vi.importActual('react-router-dom')
        return {
          ...actual,
          useNavigate: () => mockNavigate
        }
      })

      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create Custom')).toBeInTheDocument()
      })

      fireEvent.click(screen.getByText('Create Custom'))

      expect(mockNavigate).toHaveBeenCalledWith('/yield/custom')
    })
  })

  describe('Performance and Memory Management', () => {
    it('should not create memory leaks with multiple mount/unmount cycles', async () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = render(
          <TestWrapper>
            <YieldCategory />
          </TestWrapper>
        )
        
        await waitFor(() => {
          expect(mockDataManager.subscribe).toHaveBeenCalled()
        })
        
        unmount()
      }

      // Verify that unsubscribe was called for each mount (4 subscriptions x 10 mounts)
      const totalUnsubscribeCalls = mockSubscriptions.reduce((count, sub) => {
        return count + (sub.unsubscribe.mock ? sub.unsubscribe.mock.calls.length : 0)
      }, 0)
      expect(totalUnsubscribeCalls).toBeGreaterThan(0)
    })

    it('should handle rapid data updates efficiently', async () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      // Wait for initial load
      await waitFor(() => {
        expect(mockDataManager.subscribe).toHaveBeenCalledTimes(4)
      })

      // Get callbacks
      const yieldDataCallback = mockSubscriptions.find(sub => sub.event === 'yieldData:updated').callback
      const objectivesCallback = mockSubscriptions.find(sub => sub.event === 'finObjectives:updated').callback

      // Simulate rapid updates
      const start = performance.now()
      
      for (let i = 0; i < 100; i++) {
        yieldDataCallback({
          activeStrategies: i,
          totalEarning: i * 10,
          avgAPY: i * 0.1,
          goalsProgress: i * 0.5
        })
        
        objectivesCallback({
          emergency: {
            ...mockDataManager.getFinObjectives().emergency,
            currentAmount: i * 100,
            progress: i
          }
        })
      }
      
      const end = performance.now()
      const duration = end - start

      // Should handle rapid updates efficiently (under 100ms for 200 updates)
      expect(duration).toBeLessThan(100)
    })

    it('should handle large FinObjective datasets efficiently', async () => {
      // Generate large FinObjective dataset
      const largeObjectives = {}
      for (let i = 0; i < 100; i++) {
        largeObjectives[`objective-${i}`] = {
          id: `objective-${i}`,
          title: `Objective ${i}`,
          description: `Description for objective ${i}`,
          icon: 'Target',
          color: 'bg-blue-100 text-blue-800',
          targetAmount: Math.random() * 10000,
          timeframe: `${Math.random() * 24} months`,
          riskLevel: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
          expectedApy: `${Math.random() * 20}%`,
          strategy: `Strategy ${i}`,
          popular: Math.random() > 0.5,
          currentAmount: Math.random() * 5000,
          progress: Math.random() * 100,
          isActive: Math.random() > 0.5
        }
      }

      mockDataManager.getFinObjectives.mockReturnValue(largeObjectives)

      const startTime = performance.now()
      
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('FinObjective')).toBeInTheDocument()
      })

      const endTime = performance.now()
      
      // Should render within reasonable time (less than 200ms for 100 objectives)
      expect(endTime - startTime).toBeLessThan(200)
    })
  })

  describe('UI Structure and Styling', () => {
    it('should maintain proper component CSS classes', async () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        // Check for main layout structure
        expect(document.querySelector('.main-layout')).toBeInTheDocument()
        expect(document.querySelector('.page-container')).toBeInTheDocument()
        
        // Check for yield category specific classes
        expect(document.querySelector('.yield-category__header')).toBeInTheDocument()
        expect(document.querySelector('.yield-category__overview')).toBeInTheDocument()
        expect(document.querySelector('.yield-category__popular')).toBeInTheDocument()
        expect(document.querySelector('.yield-category__all')).toBeInTheDocument()
      })
    })

    it('should display correct icons with proper styling', async () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        // Check yield overview icons
        const activeStrategiesIcon = screen.getByText('Active Strategies').closest('.yield-overview-item').querySelector('svg')
        expect(activeStrategiesIcon).toHaveClass('text-purple-600')

        const totalEarningIcon = screen.getByText('Total Earning').closest('.yield-overview-item').querySelector('svg')
        expect(totalEarningIcon).toHaveClass('text-green-600')

        const avgAPYIcon = screen.getByText('Avg APY').closest('.yield-overview-item').querySelector('svg')
        expect(avgAPYIcon).toHaveClass('text-blue-600')

        const goalsProgressIcon = screen.getByText('Goals Progress').closest('.yield-overview-item').querySelector('svg')
        expect(goalsProgressIcon).toHaveClass('text-gray-600')
      })
    })

    it('should display educational tips section', async () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('How FinObjective Works')).toBeInTheDocument()
        expect(screen.getByText('Goal-Oriented:')).toBeInTheDocument()
        expect(screen.getByText('Risk-Adjusted:')).toBeInTheDocument()
        expect(screen.getByText('Automated Rebalancing:')).toBeInTheDocument()
        expect(screen.getByText('Progress Tracking:')).toBeInTheDocument()
      })
    })

    it('should display custom objective CTA section', async () => {
      render(
        <TestWrapper>
          <YieldCategory />
        </TestWrapper>
      )

      await waitFor(() => {
        expect(screen.getByText('Create Custom Objective')).toBeInTheDocument()
        expect(screen.getByText('Design your own financial goal with personalized DeFi strategies')).toBeInTheDocument()
      })
    })
  })
})