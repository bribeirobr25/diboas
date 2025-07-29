/**
 * InvestmentCategory Fix Verification Test
 * Simple test to verify the currentCategory initialization fix works
 */

import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'

// Mock all external dependencies
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => vi.fn()
  }
})

vi.mock('../../services/DataManager.js', () => ({
  dataManager: {
    getBalance: vi.fn(() => ({ availableForSpending: 0, investedAmount: 0, assets: {} })),
    subscribe: vi.fn(() => vi.fn())
  }
}))

vi.mock('../../services/assetDataService.js', () => ({
  assetDataService: {
    getCompleteAssetData: vi.fn(() => Promise.resolve({
      symbol: 'BTC',
      name: 'Bitcoin',
      price: 50000,
      change24h: 2.5,
      trend: 'up',
      description: 'Bitcoin description',
      priceFormatted: '$50,000.00',
      change24hFormatted: '+2.50%'
    })),
    subscribeToPriceUpdates: vi.fn(() => vi.fn()),
    formatPrice: vi.fn((price) => `$${price.toLocaleString()}`),
    formatPercentage: vi.fn((percent) => `${percent > 0 ? '+' : ''}${percent.toFixed(2)}%`)
  }
}))

vi.mock('../shared/PageHeader.jsx', () => ({
  default: () => <div data-testid="page-header">Page Header</div>
}))

// Import component after mocks
import InvestmentCategory from '../categories/InvestmentCategory.jsx'

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('InvestmentCategory currentCategory Fix', () => {
  it('should render without throwing ReferenceError about currentCategory initialization', () => {
    // Capture any console errors
    const originalError = console.error
    const errorSpy = vi.fn()
    console.error = errorSpy

    // This should not throw an error
    expect(() => {
      render(
        <TestWrapper>
          <InvestmentCategory />
        </TestWrapper>
      )
    }).not.toThrow()

    // Check that no ReferenceError was logged
    expect(errorSpy).not.toHaveBeenCalledWith(
      expect.stringContaining('Cannot access \'currentCategory\' before initialization')
    )

    // Restore console.error
    console.error = originalError
  })

  it('should successfully render the investment page header', () => {
    render(
      <TestWrapper>
        <InvestmentCategory />
      </TestWrapper>
    )

    // Should display the main header elements
    expect(screen.getByText('Buy/Sell')).toBeInTheDocument()
    expect(screen.getByText('Investment & Trading')).toBeInTheDocument()
  })

  it('should render category tabs without initialization errors', () => {
    render(
      <TestWrapper>
        <InvestmentCategory />
      </TestWrapper>
    )

    // Should show category tabs
    expect(screen.getByRole('button', { name: /crypto/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /gold/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /stocks/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /real estate/i })).toBeInTheDocument()
  })

  it('should have crypto selected by default', () => {
    render(
      <TestWrapper>
        <InvestmentCategory />
      </TestWrapper>
    )

    // Crypto tab should be selected (have active styling)
    const cryptoTab = screen.getByRole('button', { name: /crypto/i })
    expect(cryptoTab).toHaveClass('bg-blue-600', 'text-white')
  })

  it('should render investment overview section', () => {
    render(
      <TestWrapper>
        <InvestmentCategory />
      </TestWrapper>
    )

    // Should show overview elements
    expect(screen.getByText('Investment Overview')).toBeInTheDocument()
    expect(screen.getByText('Invested Balance')).toBeInTheDocument()
    expect(screen.getByText('Total Gain/Loss')).toBeInTheDocument()
    expect(screen.getByText('Assets Owned')).toBeInTheDocument()
  })

  it('should render browse assets section', () => {
    render(
      <TestWrapper>
        <InvestmentCategory />
      </TestWrapper>
    )

    expect(screen.getByText('Browse Assets')).toBeInTheDocument()
  })

  it('should render educational tips section', () => {
    render(
      <TestWrapper>
        <InvestmentCategory />
      </TestWrapper>
    )

    expect(screen.getByText('Investment Tips')).toBeInTheDocument()
  })
})