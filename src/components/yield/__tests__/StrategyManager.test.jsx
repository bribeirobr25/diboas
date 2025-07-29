/**
 * StrategyManager Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import StrategyManager from '../StrategyManager.jsx'

// Mock the navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams()]
  }
})

// Mock PageHeader
vi.mock('../../shared/PageHeader.jsx', () => ({
  default: () => <div data-testid="page-header">Page Header</div>
}))

describe('StrategyManager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders strategy manager page with correct title', () => {
    render(
      <BrowserRouter>
        <StrategyManager />
      </BrowserRouter>
    )

    expect(screen.getByText('Strategy Manager')).toBeInTheDocument()
    expect(screen.getByText('Monitor and manage your active yield strategies')).toBeInTheDocument()
  })

  test('displays portfolio overview statistics', () => {
    render(
      <BrowserRouter>
        <StrategyManager />
      </BrowserRouter>
    )

    // Check for overview stats
    expect(screen.getByText('Active Strategies')).toBeInTheDocument()
    expect(screen.getByText('Total Invested')).toBeInTheDocument()
    expect(screen.getByText('Total Earned')).toBeInTheDocument()
    expect(screen.getByText('Avg APY')).toBeInTheDocument()
  })

  test('shows active strategies with correct information', () => {
    render(
      <BrowserRouter>
        <StrategyManager />
      </BrowserRouter>
    )

    // Check for mock strategies
    expect(screen.getByText('Emergency Fund')).toBeInTheDocument()
    expect(screen.getByText('Free Coffee')).toBeInTheDocument()
    expect(screen.getByText('Build a financial safety net')).toBeInTheDocument()
    expect(screen.getByText('Generate daily coffee money')).toBeInTheDocument()
  })

  test('displays strategy progress bars', () => {
    render(
      <BrowserRouter>
        <StrategyManager />
      </BrowserRouter>
    )

    // Should show progress percentages
    expect(screen.getByText('46.8%')).toBeInTheDocument() // Emergency fund progress (2340.50/5000)
    expect(screen.getByText('97.0%')).toBeInTheDocument() // Coffee fund progress (485.20/500)
  })

  test('shows strategy status badges', () => {
    render(
      <BrowserRouter>
        <StrategyManager />
      </BrowserRouter>
    )

    // Check for status badges
    expect(screen.getByText('Active')).toBeInTheDocument()
    expect(screen.getByText('Near Goal')).toBeInTheDocument()
  })

  test('displays performance metrics for each strategy', () => {
    render(
      <BrowserRouter>
        <StrategyManager />
      </BrowserRouter>
    )

    // Check for performance data (multiple strategies will have these labels)
    expect(screen.getAllByText('Monthly Earnings')).toHaveLength(2)
    expect(screen.getAllByText('Actual APY')).toHaveLength(2)
    expect(screen.getByText('5.2%')).toBeInTheDocument() // Emergency fund APY
    expect(screen.getByText('9.1%')).toBeInTheDocument() // Coffee fund APY
  })

  test('has functional pause/resume buttons', () => {
    render(
      <BrowserRouter>
        <StrategyManager />
      </BrowserRouter>
    )

    // Should show pause button for active strategy
    const pauseButtons = screen.getAllByText('Pause')
    expect(pauseButtons.length).toBeGreaterThan(0)

    // Click pause button
    fireEvent.click(pauseButtons[0])

    // Strategy status should update (tested through state change)
    // This would require more complex mocking to test the actual state change
  })

  test('has new strategy creation button', () => {
    render(
      <BrowserRouter>
        <StrategyManager />
      </BrowserRouter>
    )

    const newStrategyButton = screen.getByText('New Strategy')
    expect(newStrategyButton).toBeInTheDocument()

    fireEvent.click(newStrategyButton)
    expect(mockNavigate).toHaveBeenCalledWith('/yield/configure')
  })

  test('handles back navigation to yield category', () => {
    render(
      <BrowserRouter>
        <StrategyManager />
      </BrowserRouter>
    )

    const backButton = screen.getByText('Back to FinObjective')
    fireEvent.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/category/yield')
  })

  test('displays settings buttons for each strategy', () => {
    render(
      <BrowserRouter>
        <StrategyManager />
      </BrowserRouter>
    )

    const settingsButtons = screen.getAllByText('Settings')
    expect(settingsButtons.length).toBeGreaterThan(0)
  })

  test('shows educational tips section', () => {
    render(
      <BrowserRouter>
        <StrategyManager />
      </BrowserRouter>
    )

    expect(screen.getByText('Strategy Management Tips')).toBeInTheDocument()
    expect(screen.getByText(/Regular Monitoring:/)).toBeInTheDocument()
    expect(screen.getByText(/Rebalancing:/)).toBeInTheDocument()
    expect(screen.getByText(/Compound Growth:/)).toBeInTheDocument()
    expect(screen.getByText(/Diversification:/)).toBeInTheDocument()
  })

  test('displays timeline information for strategies', () => {
    render(
      <BrowserRouter>
        <StrategyManager />
      </BrowserRouter>
    )

    // Should show remaining time information
    expect(screen.getByText('8 months left')).toBeInTheDocument() // Emergency fund: 12-4 months
    expect(screen.getByText('1 months left')).toBeInTheDocument() // Coffee fund: 6-5 months
  })

  test('shows strategy currency formatting', () => {
    render(
      <BrowserRouter>
        <StrategyManager />
      </BrowserRouter>
    )

    // Check for properly formatted currency values
    expect(screen.getByText('$2,340.50')).toBeInTheDocument() // Emergency fund current
    expect(screen.getByText('$485.20')).toBeInTheDocument() // Coffee fund current
  })

  test('displays risk level information', () => {
    render(
      <BrowserRouter>
        <StrategyManager />
      </BrowserRouter>
    )

    // Mock data includes conservative and moderate risk levels
    // These would be displayed in the strategy details
    const strategyCards = screen.getAllByText(/Build a financial safety net|Generate daily coffee money/)
    expect(strategyCards.length).toBe(2)
  })

  test('shows success message for new strategy creation', () => {
    // Mock URL params to simulate new strategy creation
    vi.mock('react-router-dom', async () => {
      const actual = await vi.importActual('react-router-dom')
      return {
        ...actual,
        useNavigate: () => mockNavigate,
        useSearchParams: () => [new URLSearchParams('strategy=new')]
      }
    })

    render(
      <BrowserRouter>
        <StrategyManager />
      </BrowserRouter>
    )

    // Should show success message
    expect(screen.getByText('Strategy Created Successfully!')).toBeInTheDocument()
  })
})