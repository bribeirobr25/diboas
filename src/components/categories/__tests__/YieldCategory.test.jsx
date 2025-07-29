/**
 * YieldCategory Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import YieldCategory from '../YieldCategory.jsx'

// Mock the navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Mock PageHeader
vi.mock('../../shared/PageHeader.jsx', () => ({
  default: () => <div data-testid="page-header">Page Header</div>
}))

describe('YieldCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders yield category page with correct title and description', () => {
    render(
      <BrowserRouter>
        <YieldCategory />
      </BrowserRouter>
    )

    expect(screen.getByText('FinObjective')).toBeInTheDocument()
    expect(screen.getByText('Goal-Driven DeFi Strategies')).toBeInTheDocument()
    expect(screen.getByText(/Turn your financial goals into reality/)).toBeInTheDocument()
  })

  test('displays popular financial objectives', () => {
    render(
      <BrowserRouter>
        <YieldCategory />
      </BrowserRouter>
    )

    expect(screen.getAllByText('Emergency Fund')).toHaveLength(2) // Popular and All sections
    expect(screen.getAllByText('Free Coffee')).toHaveLength(2)
    expect(screen.getAllByText('Dream Vacation')).toHaveLength(2)
  })

  test('displays all financial objectives', () => {
    render(
      <BrowserRouter>
        <YieldCategory />
      </BrowserRouter>
    )

    expect(screen.getByText('New Car')).toBeInTheDocument()
    expect(screen.getByText('Home Down Payment')).toBeInTheDocument()
    expect(screen.getByText('Education Fund')).toBeInTheDocument()
  })

  test('navigates to objective configuration when objective is clicked', () => {
    render(
      <BrowserRouter>
        <YieldCategory />
      </BrowserRouter>
    )

    const emergencyFundCards = screen.getAllByText('Emergency Fund')
    const emergencyFundCard = emergencyFundCards[0].closest('.yield-category__objective-card')
    fireEvent.click(emergencyFundCard)

    expect(mockNavigate).toHaveBeenCalledWith('/yield/configure?objective=emergency')
  })

  test('navigates to custom objective creation', () => {
    render(
      <BrowserRouter>
        <YieldCategory />
      </BrowserRouter>
    )

    const createCustomButton = screen.getByText('Create Custom')
    fireEvent.click(createCustomButton)

    expect(mockNavigate).toHaveBeenCalledWith('/yield/custom')
  })

  test('displays yield stats', () => {
    render(
      <BrowserRouter>
        <YieldCategory />
      </BrowserRouter>
    )

    expect(screen.getByText('Active Strategies')).toBeInTheDocument()
    expect(screen.getByText('Total Earning')).toBeInTheDocument()
    expect(screen.getByText('Avg APY')).toBeInTheDocument()
    expect(screen.getByText('Goals Progress')).toBeInTheDocument()
  })

  test('displays educational content about FinObjective', () => {
    render(
      <BrowserRouter>
        <YieldCategory />
      </BrowserRouter>
    )

    expect(screen.getByText('How FinObjective Works')).toBeInTheDocument()
    expect(screen.getByText(/Goal-Oriented:/)).toBeInTheDocument()
  })
})