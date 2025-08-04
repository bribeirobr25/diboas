/**
 * YieldCategory New Templates Test
 * Tests the new template-based strategy system
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, waitFor, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BrowserRouter, MemoryRouter } from 'react-router-dom'
import React from 'react'
import YieldCategory from '../categories/YieldCategory.jsx'

// Mock the DataManager
vi.mock('../../services/DataManager.js', () => ({
  dataManager: {
    getFinObjectives: vi.fn(() => ({})),
    getRiskLevels: vi.fn(() => ({
      Low: { color: 'bg-green-100 text-green-800', description: 'Stable returns' },
      Medium: { color: 'bg-yellow-100 text-yellow-800', description: 'Balanced risk' },
      'Medium-High': { color: 'bg-orange-100 text-orange-800', description: 'Higher returns' },
      High: { color: 'bg-red-100 text-red-800', description: 'Maximum returns' }
    })),
    getYieldData: vi.fn(() => ({
      activeStrategies: 0,
      totalEarning: 0,
      avgAPY: 0,
      goalsProgress: 0
    })),
    subscribe: vi.fn(() => vi.fn()),
    emit: vi.fn()
  }
}))

// Mock React Router navigate
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock PageHeader component
vi.mock('../shared/PageHeader.jsx', () => ({
  default: () => <div data-testid="page-header">Page Header</div>
}))

describe('YieldCategory - New Template System', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render yield overview section', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <YieldCategory />
          </BrowserRouter>
        )
      })

      expect(screen.getByText('Yield Overview')).toBeInTheDocument()
      expect(screen.getByText('Active Strategies')).toBeInTheDocument()
      expect(screen.getByText('Total Earning')).toBeInTheDocument()
      expect(screen.getByText('Avg APY')).toBeInTheDocument()
      expect(screen.getByText('Goals Progress')).toBeInTheDocument()
    })

    it('should render new strategy templates section', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <YieldCategory />
          </BrowserRouter>
        )
      })

      expect(screen.getByText('Objective-Driven Strategies')).toBeInTheDocument()
      expect(screen.getByText('Emergency Funds')).toBeInTheDocument()
      expect(screen.getByText('Free Coffee')).toBeInTheDocument()
      expect(screen.getByText('Home Down Payment')).toBeInTheDocument()
      expect(screen.getByText('Dream Vacation')).toBeInTheDocument()
      expect(screen.getByText('New Car')).toBeInTheDocument()
      expect(screen.getByText('Education Fund')).toBeInTheDocument()
      expect(screen.getByText('Create New')).toBeInTheDocument()
    })

    it('should render How FinObjective Works section', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <YieldCategory />
          </BrowserRouter>
        )
      })

      expect(screen.getByText('How FinObjective Works')).toBeInTheDocument()
      expect(screen.getByText(/Goal-Oriented/)).toBeInTheDocument()
      expect(screen.getByText(/Risk-Adjusted/)).toBeInTheDocument()
      expect(screen.getByText(/Automated Rebalancing/)).toBeInTheDocument()
      expect(screen.getByText(/Progress Tracking/)).toBeInTheDocument()
    })
  })

  describe('Template Navigation', () => {
    it('should navigate to Emergency Funds configuration', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <YieldCategory />
          </BrowserRouter>
        )
      })

      const emergencyFundsCard = screen.getByText('Emergency Funds').closest('.yield-strategy-template')
      fireEvent.click(emergencyFundsCard)

      expect(mockNavigate).toHaveBeenCalledWith('/yield/configure?objective=emergency-funds')
    })

    it('should navigate to Free Coffee configuration', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <YieldCategory />
          </BrowserRouter>
        )
      })

      const freeCoffeeCard = screen.getByText('Free Coffee').closest('.yield-strategy-template')
      fireEvent.click(freeCoffeeCard)

      expect(mockNavigate).toHaveBeenCalledWith('/yield/configure?objective=free-coffee')
    })

    it('should navigate to Home Down Payment configuration', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <YieldCategory />
          </BrowserRouter>
        )
      })

      const homeCard = screen.getByText('Home Down Payment').closest('.yield-strategy-template')
      fireEvent.click(homeCard)

      expect(mockNavigate).toHaveBeenCalledWith('/yield/configure?objective=home-down-payment')
    })

    it('should navigate to Dream Vacation configuration', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <YieldCategory />
          </BrowserRouter>
        )
      })

      const dreamVacationCard = screen.getByText('Dream Vacation').closest('.yield-strategy-template')
      fireEvent.click(dreamVacationCard)

      expect(mockNavigate).toHaveBeenCalledWith('/yield/configure?objective=dream-vacation')
    })

    it('should navigate to New Car configuration', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <YieldCategory />
          </BrowserRouter>
        )
      })

      const newCarCard = screen.getByText('New Car').closest('.yield-strategy-template')
      fireEvent.click(newCarCard)

      expect(mockNavigate).toHaveBeenCalledWith('/yield/configure?objective=new-car')
    })

    it('should navigate to Education Fund configuration', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <YieldCategory />
          </BrowserRouter>
        )
      })

      const educationFundCard = screen.getByText('Education Fund').closest('.yield-strategy-template')
      fireEvent.click(educationFundCard)

      expect(mockNavigate).toHaveBeenCalledWith('/yield/configure?objective=education-fund')
    })

    it('should navigate to Create New configuration', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <YieldCategory />
          </BrowserRouter>
        )
      })

      const createNewCard = screen.getByText('Create New').closest('.yield-strategy-template')
      fireEvent.click(createNewCard)

      expect(mockNavigate).toHaveBeenCalledWith('/yield/configure?objective=create-new')
    })
  })

  describe('Template Properties', () => {
    it('should display correct Emergency Funds template properties', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <YieldCategory />
          </BrowserRouter>
        )
      })

      const emergencyFundsCard = screen.getByText('Emergency Funds').closest('.yield-strategy-template')
      
      expect(emergencyFundsCard).toContainHTML('Low')
      expect(emergencyFundsCard).toContainHTML('3-5%')
      expect(emergencyFundsCard).toContainHTML('3-6 months')
      expect(emergencyFundsCard).toContainHTML('Essential')
    })

    it('should display correct Free Coffee template properties', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <YieldCategory />
          </BrowserRouter>
        )
      })

      const freeCoffeeCard = screen.getByText('Free Coffee').closest('.yield-strategy-template')
      
      expect(freeCoffeeCard).toContainHTML('Medium')
      expect(freeCoffeeCard).toContainHTML('5-8%')
      expect(freeCoffeeCard).toContainHTML('6-12 months')
      expect(freeCoffeeCard).toContainHTML('Popular')
    })

    it('should display correct Home Down Payment template properties', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <YieldCategory />
          </BrowserRouter>
        )
      })

      const homeCard = screen.getByText('Home Down Payment').closest('.yield-strategy-template')
      
      expect(homeCard).toContainHTML('Medium-High')
      expect(homeCard).toContainHTML('8-12%')
      expect(homeCard).toContainHTML('12+ months')
      expect(homeCard).toContainHTML('Long-term')
    })

    it('should display correct Dream Vacation template properties', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <YieldCategory />
          </BrowserRouter>
        )
      })

      const dreamVacationCard = screen.getByText('Dream Vacation').closest('.yield-strategy-template')
      
      expect(dreamVacationCard).toContainHTML('Medium')
      expect(dreamVacationCard).toContainHTML('8-12%')
      expect(dreamVacationCard).toContainHTML('6-12 months')
      expect(dreamVacationCard).toContainHTML('Balanced')
    })

    it('should display correct New Car template properties', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <YieldCategory />
          </BrowserRouter>
        )
      })

      const newCarCard = screen.getByText('New Car').closest('.yield-strategy-template')
      
      expect(newCarCard).toContainHTML('Medium')
      expect(newCarCard).toContainHTML('10-15%')
      expect(newCarCard).toContainHTML('12+ months')
      expect(newCarCard).toContainHTML('Growth')
    })

    it('should display correct Education Fund template properties', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <YieldCategory />
          </BrowserRouter>
        )
      })

      const educationFundCard = screen.getByText('Education Fund').closest('.yield-strategy-template')
      
      expect(educationFundCard).toContainHTML('Medium')
      expect(educationFundCard).toContainHTML('8-14%')
      expect(educationFundCard).toContainHTML('12+ months')
      expect(educationFundCard).toContainHTML('Future')
    })

    it('should display correct Create New template properties', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <YieldCategory />
          </BrowserRouter>
        )
      })

      const createNewCard = screen.getByText('Create New').closest('.yield-strategy-template')
      
      expect(createNewCard).toContainHTML('Flexible')
      expect(createNewCard).toContainHTML('Custom')
      expect(createNewCard).toContainHTML('Your choice')
    })
  })

  describe('DataManager Integration', () => {
    it('should subscribe to DataManager events on mount', async () => {
      const { dataManager } = await import('../../services/DataManager.js')
      
      await act(async () => {
        render(
          <BrowserRouter>
            <YieldCategory />
          </BrowserRouter>
        )
      })

      expect(dataManager.subscribe).toHaveBeenCalledWith('yieldData:updated', expect.any(Function))
      expect(dataManager.subscribe).toHaveBeenCalledWith('finObjectives:updated', expect.any(Function))
      expect(dataManager.subscribe).toHaveBeenCalledWith('balance:updated', expect.any(Function))
      expect(dataManager.subscribe).toHaveBeenCalledWith('strategy:updated', expect.any(Function))
    })

    it('should load data from DataManager on mount', async () => {
      const { dataManager } = await import('../../services/DataManager.js')
      
      await act(async () => {
        render(
          <BrowserRouter>
            <YieldCategory />
          </BrowserRouter>
        )
      })

      expect(dataManager.getFinObjectives).toHaveBeenCalled()
      expect(dataManager.getRiskLevels).toHaveBeenCalled()
      expect(dataManager.getYieldData).toHaveBeenCalled()
    })
  })

  describe('Navigation Back to Dashboard', () => {
    it('should navigate back to app dashboard when back button is clicked', async () => {
      await act(async () => {
        render(
          <BrowserRouter>
            <YieldCategory />
          </BrowserRouter>
        )
      })

      const backButton = screen.getByText('Back to Dashboard')
      fireEvent.click(backButton)

      expect(mockNavigate).toHaveBeenCalledWith('/app')
    })
  })
})