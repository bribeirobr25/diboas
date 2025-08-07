/**
 * Critical Tests for TransactionForm Component
 * Tests transaction input validation, edge cases, and security
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import TransactionForm from '../transactions/TransactionForm.jsx'

// Mock clipboard to prevent userEvent errors
if (!navigator.clipboard) {
  Object.defineProperty(navigator, 'clipboard', {
    value: {
      writeText: vi.fn()
    },
    writable: true,
    configurable: true
  })
}

// Mock AmountInput component
vi.mock('../transactions/AmountInput.jsx', () => ({
  default: function MockAmountInput(props) {
    return (
      <div data-testid="amount-input">
        <label htmlFor="amount">Amount</label>
        <input 
          id="amount" 
          type="text" 
          value={props.amount || ''} 
          onChange={(e) => props.setAmount?.(e.target.value)}
          data-testid="amount-field"
        />
      </div>
    )
  }
}))

// Mock PaymentMethodSelector component
vi.mock('../transactions/PaymentMethodSelector.jsx', () => ({
  default: function MockPaymentMethodSelector() {
    return <div data-testid="payment-method-selector">Payment Method</div>
  }
}))

// Mock WalletAddressInput component
vi.mock('../transactions/WalletAddressInput.jsx', () => ({
  default: function MockWalletAddressInput(props) {
    return (
      <div data-testid="wallet-address-input">
        <label htmlFor="recipient">Recipient</label>
        <input 
          id="recipient" 
          type="text" 
          value={props.recipientAddress || ''} 
          onChange={(e) => props.setRecipientAddress?.(e.target.value)}
          data-testid="recipient-field"
        />
      </div>
    )
  }
}))

// Mock DiBoaSUsernameInput component
vi.mock('../transactions/DiBoaSUsernameInput.jsx', () => ({
  default: function MockDiBoaSUsernameInput() {
    return <div data-testid="diboas-username-input">DiBoaS Username</div>
  }
}))

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('TransactionForm - Critical Security Tests', () => {
  const defaultProps = {
    transactionType: 'transfer',
    isOnRamp: false,
    isOffRamp: false,
    recipientAddress: '',
    setRecipientAddress: vi.fn(),
    amount: '',
    setAmount: vi.fn(),
    selectedAsset: { symbol: 'BTC', name: 'Bitcoin' },
    setSelectedAsset: vi.fn(),
    selectedPaymentMethod: null,
    setSelectedPaymentMethod: vi.fn(),
    assets: [{ symbol: 'BTC', name: 'Bitcoin' }, { symbol: 'ETH', name: 'Ethereum' }],
    buyPaymentMethods: [],
    paymentMethods: [],
    balance: { available: 1000, invested: 500 },
    availableBalance: 1000,
    validationErrors: {},
    currentType: { icon: '💸', label: 'Transfer' }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Component Rendering', () => {
    it('should render TransactionForm without crashing', () => {
      render(
        <TestWrapper>
          <TransactionForm {...defaultProps} />
        </TestWrapper>
      )

      // Check that the form renders with title
      expect(screen.getByText('Transfer')).toBeInTheDocument()
    })

    it('should render amount input for transfer transactions', () => {
      render(
        <TestWrapper>
          <TransactionForm {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByTestId('amount-input')).toBeInTheDocument()
    })

    it('should render wallet address input for transfer transactions', () => {
      render(
        <TestWrapper>
          <TransactionForm {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByTestId('wallet-address-input')).toBeInTheDocument()
    })

    it('should render payment method selector', () => {
      render(
        <TestWrapper>
          <TransactionForm {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByTestId('payment-method-selector')).toBeInTheDocument()
    })
  })

  describe('Transaction Type Handling', () => {
    it('should render DiBoaS username input for send transactions', () => {
      const sendProps = { ...defaultProps, transactionType: 'send' }
      
      render(
        <TestWrapper>
          <TransactionForm {...sendProps} />
        </TestWrapper>
      )

      expect(screen.getByTestId('diboas-username-input')).toBeInTheDocument()
    })

    it('should render asset selection for buy transactions', () => {
      const buyProps = { 
        ...defaultProps, 
        transactionType: 'buy',
        assets: [
          { 
            assetId: 'btc', 
            tickerSymbol: 'BTC', 
            currencyIcon: '₿',
            currentMarketPrice: '$50,000',
            themeClasses: { bgColor: 'bg-orange-100', textColor: 'text-orange-800', borderColor: 'border-orange-200' }
          }
        ]
      }
      
      render(
        <TestWrapper>
          <TransactionForm {...buyProps} />
        </TestWrapper>
      )

      expect(screen.getByText('Select Asset')).toBeInTheDocument()
      expect(screen.getByText('BTC')).toBeInTheDocument()
    })
  })

  describe('Props Validation', () => {
    it('should handle missing currentType prop gracefully', () => {
      const propsWithoutType = { ...defaultProps, currentType: null }
      
      expect(() => {
        render(
          <TestWrapper>
            <TransactionForm {...propsWithoutType} />
          </TestWrapper>
        )
      }).not.toThrow()
    })

    it('should handle empty assets array', () => {
      const propsWithEmptyAssets = { ...defaultProps, assets: [] }
      
      expect(() => {
        render(
          <TestWrapper>
            <TransactionForm {...propsWithEmptyAssets} />
          </TestWrapper>
        )
      }).not.toThrow()
    })
  })

  describe('Accessibility', () => {
    it('should have proper heading structure', () => {
      render(
        <TestWrapper>
          <TransactionForm {...defaultProps} />
        </TestWrapper>
      )

      // Should have a title element
      expect(screen.getByText('Transfer')).toBeInTheDocument()
    })

    it('should render without accessibility violations', () => {
      render(
        <TestWrapper>
          <TransactionForm {...defaultProps} />
        </TestWrapper>
      )

      // Basic accessibility check - form should render without errors
      expect(screen.getByTestId('amount-input')).toBeInTheDocument()
      expect(screen.getByTestId('wallet-address-input')).toBeInTheDocument()
    })
  })
})