/**
 * BankingCategory Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import BankingCategory from '../BankingCategory.jsx'

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

describe('BankingCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders banking category page with correct title and description', () => {
    render(
      <BrowserRouter>
        <BankingCategory />
      </BrowserRouter>
    )

    expect(screen.getByText('In/Out')).toBeInTheDocument()
    expect(screen.getByText('Banking & Money Movement')).toBeInTheDocument()
    expect(screen.getByText(/Manage your money flow with diBoaS/)).toBeInTheDocument()
  })

  test('displays all banking actions', () => {
    render(
      <BrowserRouter>
        <BankingCategory />
      </BrowserRouter>
    )

    expect(screen.getAllByText('Add Money')).toHaveLength(1)
    expect(screen.getByText('Withdraw')).toBeInTheDocument()
    expect(screen.getByText('Send Money')).toBeInTheDocument()
    expect(screen.getByText('Request Money')).toBeInTheDocument()
  })

  test('navigates back to dashboard when back button is clicked', () => {
    render(
      <BrowserRouter>
        <BankingCategory />
      </BrowserRouter>
    )

    const backButton = screen.getByText('Back to Dashboard')
    fireEvent.click(backButton)

    expect(mockNavigate).toHaveBeenCalledWith('/app')
  })

  test('navigates to correct routes when action cards are clicked', () => {
    render(
      <BrowserRouter>
        <BankingCategory />
      </BrowserRouter>
    )

    const addMoneyCards = screen.getAllByText('Add Money')
    const addMoneyCard = addMoneyCards[0].closest('.banking-category__action-card')
    fireEvent.click(addMoneyCard)

    expect(mockNavigate).toHaveBeenCalledWith('/category/banking/add')
  })

  test('displays quick stats', () => {
    render(
      <BrowserRouter>
        <BankingCategory />
      </BrowserRouter>
    )

    expect(screen.getByText('Available Balance')).toBeInTheDocument()
    expect(screen.getByText('This Month')).toBeInTheDocument()
    expect(screen.getByText('Last Transaction')).toBeInTheDocument()
  })

  test('displays educational tips', () => {
    render(
      <BrowserRouter>
        <BankingCategory />
      </BrowserRouter>
    )

    expect(screen.getByText('Getting Started with Banking')).toBeInTheDocument()
    expect(screen.getByText(/Add Money:/)).toBeInTheDocument()
  })
})