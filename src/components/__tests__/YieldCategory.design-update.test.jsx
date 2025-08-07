/**
 * YieldCategory Design Update Test
 * Tests the updated design with background image header and square cards
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
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
    getFinObjectives: vi.fn(() => ({
      'emergency-fund': {
        id: 'emergency-fund',
        title: 'Emergency Fund',
        description: 'Build a 6-month emergency safety net',
        icon: 'Umbrella',
        color: 'bg-blue-100 text-blue-600',
        targetAmount: 10000,
        timeframe: '12 months',
        expectedApy: '8.5%',
        riskLevel: 'Low',
        strategy: 'Conservative DeFi yield strategies',
        popular: true,
        isActive: false,
        progress: 0,
        currentAmount: 0
      },
      'house-down-payment': {
        id: 'house-down-payment',
        title: 'House Down Payment',
        description: 'Save for your dream home down payment',
        icon: 'Home',
        color: 'bg-green-100 text-green-600',
        targetAmount: 50000,
        timeframe: '3 years',
        expectedApy: '12.3%',
        riskLevel: 'Medium',
        strategy: 'Balanced DeFi strategies with moderate risk',
        popular: true,
        isActive: true,
        progress: 25.4,
        currentAmount: 12700
      }
    })),
    getRiskLevels: vi.fn(() => ({
      Low: { color: 'bg-green-100 text-green-800' },
      Medium: { color: 'bg-yellow-100 text-yellow-800' },
      High: { color: 'bg-red-100 text-red-800' }
    })),
    getYieldData: vi.fn(() => ({
      activeStrategies: 2,
      totalEarning: 234.56,
      avgAPY: 8.7,
      goalsProgress: 15.3
    })),
    subscribe: vi.fn(() => vi.fn())
  }
}))

vi.mock('../shared/PageHeader.jsx', () => ({
  default: ({ showUserActions }) => (
    <div data-testid="page-header">
      Page Header {showUserActions && '(with user actions)'}
    </div>
  )
}))

// Import component after mocks
import YieldCategory from '../categories/YieldCategory.jsx'

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('YieldCategory Design Updates', () => {
  it('should render header with background image styling', () => {
    render(
      <TestWrapper>
        <YieldCategory />
      </TestWrapper>
    )

    // Check for header elements
    expect(screen.getByText('FinObjective')).toBeInTheDocument()
    expect(screen.getByText('Goal-Driven DeFi Strategies')).toBeInTheDocument()
    
    // Check for header structure
    const headerBg = document.querySelector('.yield-category__header-bg')
    expect(headerBg).toBeInTheDocument()
    
    const headerOverlay = document.querySelector('.yield-category__header-overlay')
    expect(headerOverlay).toBeInTheDocument()
  })

  it('should render popular objectives in square card format', () => {
    render(
      <TestWrapper>
        <YieldCategory />
      </TestWrapper>
    )

    // Check for popular objectives section
    expect(screen.getByText('Popular Objectives')).toBeInTheDocument()
    
    // Check for cards (no longer using aspect-square)
    const popularCards = document.querySelectorAll('.yield-category__popular-grid .yield-category__objective-card')
    expect(popularCards.length).toBeGreaterThan(0)
    
    // Check for objective content (using getAllByText since they appear in both sections)
    expect(screen.getAllByText('Emergency Fund').length).toBeGreaterThan(0)
    expect(screen.getAllByText('House Down Payment').length).toBeGreaterThan(0)
  })

  it('should render all objectives in square card format', () => {
    render(
      <TestWrapper>
        <YieldCategory />
      </TestWrapper>
    )

    // Check for all objectives section
    expect(screen.getByText('All Financial Objectives')).toBeInTheDocument()
    
    // Check for cards (no longer using aspect-square)
    const allCards = document.querySelectorAll('.yield-category__all-grid .yield-category__objective-card')  
    expect(allCards.length).toBeGreaterThan(0)
  })

  it('should render custom objective in improved card format', () => {
    render(
      <TestWrapper>
        <YieldCategory />
      </TestWrapper>
    )

    // Check for custom objective card
    expect(screen.getByText('Create Custom')).toBeInTheDocument()
    expect(screen.getByText('Design your own financial goal with personalized DeFi strategies')).toBeInTheDocument()
    
    // Check for custom card (no longer using aspect-square)
    const customCard = document.querySelector('.yield-category__custom-card')
    expect(customCard).toBeInTheDocument()
    expect(customCard).not.toHaveClass('aspect-square')
  })

  it('should display objective details in compact format', () => {
    render(
      <TestWrapper>
        <YieldCategory />
      </TestWrapper>
    )

    // Check for compact objective details (using getAllByText since they appear multiple times)
    expect(screen.getAllByText('Target:').length).toBeGreaterThan(0)
    expect(screen.getAllByText('APY:').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Risk:').length).toBeGreaterThan(0)
    
    // Check for popular badges
    const popularBadges = screen.getAllByText('Popular')
    expect(popularBadges.length).toBeGreaterThan(0)
  })

  it('should show active objective status', () => {
    render(
      <TestWrapper>
        <YieldCategory />
      </TestWrapper>
    )

    // Check for active badge (using getAllByText since they appear multiple times)
    expect(screen.getAllByText('Active').length).toBeGreaterThan(0)
    
    // Check for progress information (using getAllByText since they appear multiple times)
    expect(screen.getAllByText('Progress:').length).toBeGreaterThan(0)
    expect(screen.getAllByText('Current:').length).toBeGreaterThan(0)
  })

  it('should use responsive grid layout', () => {
    render(
      <TestWrapper>
        <YieldCategory />
      </TestWrapper>
    )

    // Check for responsive grid classes
    const popularGrid = document.querySelector('.yield-category__popular-grid')
    expect(popularGrid).toHaveClass('grid-cols-2', 'md:grid-cols-3')
    
    const allGrid = document.querySelector('.yield-category__all-grid')
    expect(allGrid).toHaveClass('grid-cols-2', 'md:grid-cols-3')
  })

  it('should render yield overview section', () => {
    render(
      <TestWrapper>
        <YieldCategory />
      </TestWrapper>
    )

    // Check for yield overview
    expect(screen.getByText('Yield Overview')).toBeInTheDocument()
    expect(screen.getByText('Active Strategies')).toBeInTheDocument()
    expect(screen.getByText('Total Earning')).toBeInTheDocument()
    expect(screen.getByText('Avg APY')).toBeInTheDocument()
    expect(screen.getByText('Goals Progress')).toBeInTheDocument()
  })
})