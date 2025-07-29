/**
 * InvestmentCategory Component Tests
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import InvestmentCategory from '../InvestmentCategory.jsx'

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

describe('InvestmentCategory', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('renders investment category page with correct title and description', () => {
    render(
      <BrowserRouter>
        <InvestmentCategory />
      </BrowserRouter>
    )

    expect(screen.getByText('Buy/Sell')).toBeInTheDocument()
    expect(screen.getByText('Investment & Trading')).toBeInTheDocument()
    expect(screen.getByText(/Build your portfolio with cryptocurrencies/)).toBeInTheDocument()
  })

  test('displays investment actions', () => {
    render(
      <BrowserRouter>
        <InvestmentCategory />
      </BrowserRouter>
    )

    expect(screen.getByText('Buy Assets')).toBeInTheDocument()
    expect(screen.getByText('Sell Assets')).toBeInTheDocument()
  })

  test('displays crypto assets by default', () => {
    render(
      <BrowserRouter>
        <InvestmentCategory />
      </BrowserRouter>
    )

    expect(screen.getByText('Bitcoin')).toBeInTheDocument()
    expect(screen.getByText('Ethereum')).toBeInTheDocument()
    expect(screen.getByText('Solana')).toBeInTheDocument()
    expect(screen.getByText('Sui')).toBeInTheDocument()
  })

  test('switches to tokenized assets when tab is clicked', () => {
    render(
      <BrowserRouter>
        <InvestmentCategory />
      </BrowserRouter>
    )

    const tokenizedTab = screen.getByText('Tokenized Assets')
    fireEvent.click(tokenizedTab)

    expect(screen.getByText('PAX Gold')).toBeInTheDocument()
    expect(screen.getByText('Tether Gold')).toBeInTheDocument()
  })

  test('navigates to buy page when asset is clicked', () => {
    render(
      <BrowserRouter>
        <InvestmentCategory />
      </BrowserRouter>
    )

    const bitcoinCard = screen.getByText('Bitcoin').closest('.investment-category__asset-card')
    fireEvent.click(bitcoinCard)

    expect(mockNavigate).toHaveBeenCalledWith('/category/investment/buy?asset=BTC')
  })

  test('displays portfolio stats', () => {
    render(
      <BrowserRouter>
        <InvestmentCategory />
      </BrowserRouter>
    )

    expect(screen.getByText('Invested Balance')).toBeInTheDocument()
    expect(screen.getByText('Total Gain/Loss')).toBeInTheDocument()
    expect(screen.getByText('Assets Owned')).toBeInTheDocument()
  })
})