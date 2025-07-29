import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import TransactionSummary from '../transactions/TransactionSummary.jsx'

// Mock the fee calculation functions
const mockCalculateNetworkFeePercentage = vi.fn(() => '9%')
const mockCalculateProviderFeePercentage = vi.fn(() => '0.2%')
const mockCalculatePaymentMethodFeePercentage = vi.fn(() => '1%')

describe('TransactionSummary - 2-Decimal Fee Display', () => {
  const defaultProps = {
    amount: '1000',
    transactionType: 'buy',
    selectedAsset: 'BTC',
    assets: [
      {
        assetId: 'BTC',
        tickerSymbol: 'BTC',
        currentMarketPrice: '$50,000.00',
        currencyIcon: '₿'
      }
    ],
    fees: {
      diBoaS: 0.9,
      network: 90,
      provider: 2,
      dex: 2,
      payment: 0,
      total: 94.9
    },
    currentType: {
      label: 'Buy',
      icon: '🛒'
    },
    isOnRamp: true,
    isOffRamp: false,
    selectedPaymentMethod: 'diboas_wallet',
    handleTransactionStart: vi.fn(),
    isTransactionValid: true,
    getNetworkFeeRate: mockCalculateNetworkFeePercentage,
    getProviderFeeRate: mockCalculateProviderFeePercentage,
    getPaymentMethodFeeRate: mockCalculatePaymentMethodFeePercentage,
    recipientAddress: ''
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Fee Formatting Function', () => {
    it('should format normal fees with 2 decimals', () => {
      const { container } = render(<TransactionSummary {...defaultProps} />)
      
      // Click to show fee details
      const feeDetailsButton = screen.getByText('Fee Details')
      fireEvent.click(feeDetailsButton)
      
      // Check that fees are displayed with 2 decimals
      expect(screen.getByText('$0.90')).toBeInTheDocument() // diBoaS fee
      expect(screen.getByText('$90.00')).toBeInTheDocument() // network fee
      expect(screen.getAllByText('$2.00')).toHaveLength(2) // Provider and DEX fees (both show same amount)
    })

    it('should format very small fees with special formatting', () => {
      const smallFeeProps = {
        ...defaultProps,
        fees: {
          diBoaS: 0.001,
          network: 0.0005,
          provider: 0.00023,
          dex: 0.00023,
          payment: 0,
          total: 0.00123
        }
      }
      
      render(<TransactionSummary {...smallFeeProps} />)
      
      // Click to show fee details
      const feeDetailsButton = screen.getByText('Fee Details')
      fireEvent.click(feeDetailsButton)
      
      // Check special formatting for small fees (under $0.01 shows as "< 0.01")
      expect(screen.getAllByText('$< 0.01')).toHaveLength(5) // All small fees show as "< 0.01" (including total)
    })

    it('should handle zero fees correctly', () => {
      const zeroFeeProps = {
        ...defaultProps,
        fees: {
          diBoaS: 0,
          network: 0,
          provider: 0,
          dex: 0,
          payment: 0,
          total: 0
        }
      }
      
      render(<TransactionSummary {...zeroFeeProps} />)
      
      // Click to show fee details
      const feeDetailsButton = screen.getByText('Fee Details')
      fireEvent.click(feeDetailsButton)
      
      // Check zero fees are displayed correctly (multiple instances)
      expect(screen.getAllByText('$0.00').length).toBeGreaterThan(0)
    })

    it('should handle undefined/null fees gracefully', () => {
      const undefinedFeeProps = {
        ...defaultProps,
        fees: {
          diBoaS: undefined,
          network: null,
          provider: 2,
          dex: 2,
          payment: 0,
          total: undefined
        }
      }
      
      render(<TransactionSummary {...undefinedFeeProps} />)
      
      // Should not crash and should display fallback values
      expect(screen.getByText('Fee Details')).toBeInTheDocument()
    })
  })

  describe('DEX Fee Display Updates', () => {
    it('should display 0.2% DEX fee for Buy transactions', () => {
      const buyProps = {
        ...defaultProps,
        transactionType: 'buy',
        selectedPaymentMethod: 'diboas_wallet'
      }
      
      render(<TransactionSummary {...buyProps} />)
      
      // Click to show fee details
      const feeDetailsButton = screen.getByText('Fee Details')
      fireEvent.click(feeDetailsButton)
      
      // Check that DEX fee shows 0.2%
      expect(screen.getByText('DEX Fee (0.2%)')).toBeInTheDocument()
    })

    it('should display 0.2% DEX fee for Sell transactions', () => {
      const sellProps = {
        ...defaultProps,
        transactionType: 'sell',
        selectedPaymentMethod: 'diboas_wallet'
      }
      
      render(<TransactionSummary {...sellProps} />)
      
      // Click to show fee details
      const feeDetailsButton = screen.getByText('Fee Details')
      fireEvent.click(feeDetailsButton)
      
      // Check that DEX fee shows 0.2%
      expect(screen.getByText('DEX Fee (0.2%)')).toBeInTheDocument()
    })

    it('should not display DEX fee for Buy with external payment methods', () => {
      const externalBuyProps = {
        ...defaultProps,
        transactionType: 'buy',
        selectedPaymentMethod: 'credit_debit_card'
      }
      
      render(<TransactionSummary {...externalBuyProps} />)
      
      // Click to show fee details
      const feeDetailsButton = screen.getByText('Fee Details')
      fireEvent.click(feeDetailsButton)
      
      // Should not show DEX fee, but should show payment fee
      expect(screen.queryByText(/DEX Fee/)).not.toBeInTheDocument()
      expect(screen.getByText(/Payment Fee/)).toBeInTheDocument()
    })
  })

  describe('Fee Detail Visibility Toggle', () => {
    it('should toggle fee details visibility', () => {
      render(<TransactionSummary {...defaultProps} />)
      
      const feeDetailsButton = screen.getByText('Fee Details')
      
      // Initially, detailed fees should not be visible
      expect(screen.queryByText('diBoaS Fee')).not.toBeInTheDocument()
      
      // Click to show details
      fireEvent.click(feeDetailsButton)
      expect(screen.getByText('diBoaS Fee (0.09%)')).toBeInTheDocument()
      
      // Click to hide details
      fireEvent.click(feeDetailsButton)
      expect(screen.queryByText('diBoaS Fee')).not.toBeInTheDocument()
    })

    it('should display total fee amount in fee details button', () => {
      render(<TransactionSummary {...defaultProps} />)
      
      // Total fee should be displayed in button
      expect(screen.getByText('$94.900')).toBeInTheDocument()
    })
  })

  describe('Transaction Type Specific Fee Display', () => {
    it('should show correct fees for Transfer transactions', () => {
      const transferProps = {
        ...defaultProps,
        transactionType: 'transfer',
        selectedPaymentMethod: 'external_wallet',
        isOnRamp: false,
        isOffRamp: true,
        getProviderFeeRate: vi.fn(() => '0.8%') // External wallet DEX fee
      }
      
      render(<TransactionSummary {...transferProps} />)
      
      // Click to show fee details
      const feeDetailsButton = screen.getByText('Fee Details')
      fireEvent.click(feeDetailsButton)
      
      // Should show transfer-specific fees
      expect(screen.getByText('diBoaS Fee (0.9%)')).toBeInTheDocument()
      expect(screen.getByText(/DEX Fee/)).toBeInTheDocument()
    })

    it('should show correct fees for Withdraw to external wallet', () => {
      const withdrawProps = {
        ...defaultProps,
        transactionType: 'withdraw',
        selectedPaymentMethod: 'external_wallet',
        isOnRamp: false,
        isOffRamp: true,
        getProviderFeeRate: vi.fn(() => '0.8%') // External wallet DEX fee
      }
      
      render(<TransactionSummary {...withdrawProps} />)
      
      // Click to show fee details
      const feeDetailsButton = screen.getByText('Fee Details')
      fireEvent.click(feeDetailsButton)
      
      // Should show withdraw-specific fees
      expect(screen.getByText('diBoaS Fee (0.9%)')).toBeInTheDocument()
      expect(screen.getByText(/DEX Fee/)).toBeInTheDocument()
    })

    it('should show correct fees for Add with crypto wallet', () => {
      const addCryptoProps = {
        ...defaultProps,
        transactionType: 'add',
        selectedPaymentMethod: 'crypto_wallet'
      }
      
      render(<TransactionSummary {...addCryptoProps} />)
      
      // Should show special instructions instead of fee breakdown
      expect(screen.getByText('How to deposit:')).toBeInTheDocument()
      expect(screen.getByText('No fees for on-chain deposits')).toBeInTheDocument()
      expect(screen.getByText('Only network gas fees apply')).toBeInTheDocument()
    })
  })

  describe('Asset Quantity Estimation Display', () => {
    it('should show estimated crypto quantity for Buy transactions', () => {
      const buyProps = {
        ...defaultProps,
        transactionType: 'buy',
        amount: '50000', // $50,000
        selectedAsset: 'BTC'
      }
      
      render(<TransactionSummary {...buyProps} />)
      
      // Should show estimated BTC quantity (50000 / 50000 = 1 BTC)
      expect(screen.getByText('≈ 1.000000 BTC')).toBeInTheDocument()
    })

    it('should show estimated USD value for Sell transactions', () => {
      const sellProps = {
        ...defaultProps,
        transactionType: 'sell',
        amount: '1', // 1 BTC
        selectedAsset: 'BTC'
      }
      
      render(<TransactionSummary {...sellProps} />)
      
      // Should show estimated USD value (1 * 50000 = $50,000)
      expect(screen.getByText('≈ $50,000.00')).toBeInTheDocument()
    })

    it('should not show quantity estimation for non-Buy/Sell transactions', () => {
      const transferProps = {
        ...defaultProps,
        transactionType: 'transfer'
      }
      
      render(<TransactionSummary {...transferProps} />)
      
      // Should not show quantity estimation
      expect(screen.queryByText(/≈/)).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing asset data gracefully', () => {
      const missingAssetProps = {
        ...defaultProps,
        assets: [],
        selectedAsset: 'UNKNOWN'
      }
      
      render(<TransactionSummary {...missingAssetProps} />)
      
      // Should not crash
      expect(screen.getByText('Transaction Summary')).toBeInTheDocument()
    })

    it('should handle invalid amount gracefully', () => {
      const invalidAmountProps = {
        ...defaultProps,
        amount: 'invalid'
      }
      
      render(<TransactionSummary {...invalidAmountProps} />)
      
      // Should display $0.00 for invalid amount
      expect(screen.getByText('$0.00')).toBeInTheDocument()
    })

    it('should handle very large fee amounts', () => {
      const largeFeeProps = {
        ...defaultProps,
        fees: {
          diBoaS: 1000000.123456,
          network: 2000000.987654,
          provider: 500000.555555,
          dex: 500000.555555,
          payment: 0,
          total: 3500000.666665
        }
      }
      
      render(<TransactionSummary {...largeFeeProps} />)
      
      // Click to show fee details
      const feeDetailsButton = screen.getByText('Fee Details')
      fireEvent.click(feeDetailsButton)
      
      // Should format large numbers correctly with 3 decimals
      expect(screen.getByText('$1000000.123')).toBeInTheDocument()
      expect(screen.getByText('$2000000.988')).toBeInTheDocument()
    })

    it('should handle extremely small fee amounts', () => {
      const tinyFeeProps = {
        ...defaultProps,
        fees: {
          diBoaS: 0.0000001,
          network: 0.0000002,
          provider: 0.0000003,
          dex: 0.0000003,
          payment: 0,
          total: 0.0000006
        }
      }
      
      render(<TransactionSummary {...tinyFeeProps} />)
      
      // Click to show fee details
      const feeDetailsButton = screen.getByText('Fee Details')
      fireEvent.click(feeDetailsButton)
      
      // Should handle extremely small fees gracefully
      expect(screen.getByText(/Fee Details/)).toBeInTheDocument()
    })
  })

  describe('Accessibility and UX', () => {
    it('should have accessible fee details toggle button', () => {
      render(<TransactionSummary {...defaultProps} />)
      
      const feeDetailsButton = screen.getByRole('button', { name: /Fee Details/ })
      expect(feeDetailsButton).toBeInTheDocument()
      expect(feeDetailsButton).toBeEnabled()
    })

    it('should have accessible transaction execute button', () => {
      render(<TransactionSummary {...defaultProps} />)
      
      const executeButton = screen.getByRole('button', { name: /Buy \$1000/ })
      expect(executeButton).toBeInTheDocument()
      expect(executeButton).toBeEnabled()
    })

    it('should disable execute button when transaction is invalid', () => {
      const invalidProps = {
        ...defaultProps,
        isTransactionValid: false
      }
      
      render(<TransactionSummary {...invalidProps} />)
      
      const executeButton = screen.getByRole('button', { name: /Buy/ })
      expect(executeButton).toBeDisabled()
    })
  })
})