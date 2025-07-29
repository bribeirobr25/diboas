/**
 * InvestmentCategory Tokenized Assets Tests
 * Testing enhanced investment category with PAXG and XAUT support
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

describe('InvestmentCategory - Tokenized Assets', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  test('displays crypto assets by default', () => {
    render(
      <BrowserRouter>
        <InvestmentCategory />
      </BrowserRouter>
    )

    // Should show crypto assets by default
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

    // Click on tokenized assets tab
    const tokenizedTab = screen.getByText('Tokenized Assets')
    fireEvent.click(tokenizedTab)

    // Should show tokenized assets
    expect(screen.getByText('PAX Gold')).toBeInTheDocument()
    expect(screen.getByText('Tether Gold')).toBeInTheDocument()
  })

  test('displays correct prices for tokenized gold assets', () => {
    render(
      <BrowserRouter>
        <InvestmentCategory />
      </BrowserRouter>
    )

    // Click on tokenized assets tab
    const tokenizedTab = screen.getByText('Tokenized Assets')
    fireEvent.click(tokenizedTab)

    // Check for updated prices
    expect(screen.getByText('$2,687.34')).toBeInTheDocument() // PAXG price
    expect(screen.getByText('$2,684.12')).toBeInTheDocument() // XAUT price
  })

  test('shows descriptions for tokenized assets', () => {
    render(
      <BrowserRouter>
        <InvestmentCategory />
      </BrowserRouter>
    )

    // Click on tokenized assets tab
    const tokenizedTab = screen.getByText('Tokenized Assets')
    fireEvent.click(tokenizedTab)

    // Check for asset descriptions
    expect(screen.getByText('Each token represents 1 oz of gold')).toBeInTheDocument()
    expect(screen.getByText('Gold-backed stablecoin')).toBeInTheDocument()
  })

  test('navigates to buy page when PAXG is clicked', () => {
    render(
      <BrowserRouter>
        <InvestmentCategory />
      </BrowserRouter>
    )

    // Click on tokenized assets tab
    const tokenizedTab = screen.getByText('Tokenized Assets')
    fireEvent.click(tokenizedTab)

    // Click on PAXG asset
    const paxgCard = screen.getByText('PAX Gold').closest('.investment-category__asset-card')
    fireEvent.click(paxgCard)

    expect(mockNavigate).toHaveBeenCalledWith('/category/investment/buy?asset=PAXG')
  })

  test('navigates to buy page when XAUT is clicked', () => {
    render(
      <BrowserRouter>
        <InvestmentCategory />
      </BrowserRouter>
    )

    // Click on tokenized assets tab
    const tokenizedTab = screen.getByText('Tokenized Assets')
    fireEvent.click(tokenizedTab)

    // Click on XAUT asset
    const xautCard = screen.getByText('Tether Gold').closest('.investment-category__asset-card')
    fireEvent.click(xautCard)

    expect(mockNavigate).toHaveBeenCalledWith('/category/investment/buy?asset=XAUT')
  })

  test('shows popular badge for tokenized assets', () => {
    render(
      <BrowserRouter>
        <InvestmentCategory />
      </BrowserRouter>
    )

    // Click on tokenized assets tab
    const tokenizedTab = screen.getByText('Tokenized Assets')
    fireEvent.click(tokenizedTab)

    // Both PAXG and XAUT should show as popular
    const popularBadges = screen.getAllByText('Popular')
    expect(popularBadges.length).toBeGreaterThanOrEqual(2)
  })

  test('displays market cap information for tokenized assets', () => {
    render(
      <BrowserRouter>
        <InvestmentCategory />
      </BrowserRouter>
    )

    // Click on tokenized assets tab
    const tokenizedTab = screen.getByText('Tokenized Assets')
    fireEvent.click(tokenizedTab)

    // Check for market cap information
    expect(screen.getByText('Market Cap: $540M')).toBeInTheDocument() // PAXG
    expect(screen.getByText('Market Cap: $580M')).toBeInTheDocument() // XAUT
  })

  test('shows positive price changes for tokenized assets', () => {
    render(
      <BrowserRouter>
        <InvestmentCategory />
      </BrowserRouter>
    )

    // Click on tokenized assets tab
    const tokenizedTab = screen.getByText('Tokenized Assets')
    fireEvent.click(tokenizedTab)

    // Check for positive price changes
    expect(screen.getByText('+0.8%')).toBeInTheDocument() // PAXG change
    expect(screen.getByText('+0.7%')).toBeInTheDocument() // XAUT change
  })

  test('includes tokenized assets tip in educational content', () => {
    render(
      <BrowserRouter>
        <InvestmentCategory />
      </BrowserRouter>
    )

    // Check for educational tip about tokenized assets
    expect(screen.getByText(/PAXG and XAUT offer exposure to gold without physical storage/)).toBeInTheDocument()
  })

  test('tab styling changes when tokenized assets is selected', () => {
    render(
      <BrowserRouter>
        <InvestmentCategory />
      </BrowserRouter>
    )

    const tokenizedTab = screen.getByText('Tokenized Assets')
    
    // Click the tab
    fireEvent.click(tokenizedTab)
    
    // Tab should have active styling
    expect(tokenizedTab.closest('button')).toHaveClass('bg-blue-600', 'text-white')
  })
})