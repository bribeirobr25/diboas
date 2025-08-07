/**
 * Total Fees Fix Test
 * Tests the fix for Total Fees display bug in transaction confirmation page
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import TransactionProgressScreen from '../../components/shared/TransactionProgressScreen.jsx'

// Mock hooks
vi.mock('../../hooks/useTransactionStatus.js', () => ({
  useTransactionProgress: vi.fn(() => ({
    status: null,
    isLoading: false,
    error: null,
    progress: null,
    progressText: '',
    progressColor: 'blue',
    timeRemaining: null,
    onChainHash: null,
    confirmations: 0,
    requiredConfirmations: 0
  }))
}))

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Total Fees Fix', () => {
  describe('Confirmation Page Fee Display', () => {
    it('should display total property when available', () => {
      const mockTransactionData = {
        type: 'buy',
        amount: '1000',
        paymentMethod: 'credit_debit_card',
        asset: 'BTC'
      }

      // Mock fees with both total and total (total should be used)
      const mockFees = {
        total: 15.9, // This should be displayed
        total: 100.9,    // This should NOT be displayed
        diBoaS: 0.9,
        network: 5,
        provider: 10
      }

      renderWithRouter(
        <TransactionProgressScreen
          transactionData={mockTransactionData}
          flowState="confirming"
          fees={mockFees}
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      )

      // Should display the total value ($15.90)
      expect(screen.getByText('$15.90')).toBeTruthy()
      
      // Should NOT display the total value ($100.90)
      expect(screen.queryByText('$100.90')).toBeFalsy()
    })

    it('should fallback to total property when total is undefined', () => {
      const mockTransactionData = {
        type: 'withdraw',
        amount: '500',
        paymentMethod: 'external_wallet'
      }

      // Mock fees with only total property
      const mockFeesWithoutTotalFees = {
        total: 25.5,
        diBoaS: 4.5,
        network: 1.0,
        dex: 20.0
        // total is undefined
      }

      renderWithRouter(
        <TransactionProgressScreen
          transactionData={mockTransactionData}
          flowState="confirming"
          fees={mockFeesWithoutTotalFees}
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      )

      // Should display the total value as fallback
      expect(screen.getByText('$25.50')).toBeTruthy()
    })

    it('should show 0.00 when both total and total are undefined', () => {
      const mockTransactionData = {
        type: 'sell',
        amount: '250',
        paymentMethod: 'diboas_wallet'
      }

      // Mock fees with neither total nor total
      const mockFeesWithoutEither = {
        diBoaS: 2.25,
        network: 0.25,
        dex: 2.5
        // Both total and total are undefined
      }

      renderWithRouter(
        <TransactionProgressScreen
          transactionData={mockTransactionData}
          flowState="confirming"
          fees={mockFeesWithoutEither}
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      )

      // Should display 0.00 as default
      expect(screen.getByText('$0.00')).toBeTruthy()
    })

    it('should handle null fees gracefully', () => {
      const mockTransactionData = {
        type: 'add',
        amount: '100',
        paymentMethod: 'bank_account'
      }

      renderWithRouter(
        <TransactionProgressScreen
          transactionData={mockTransactionData}
          flowState="confirming"
          fees={null} // No fees object
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      )

      // Should not crash and not show fees section
      expect(screen.queryByText('Total Fees:')).toBeFalsy()
    })
  })

  describe('Success Page Fee Display', () => {
    it('should display correct total in success state', () => {
      const mockTransactionData = {
        type: 'buy',
        amount: '1000',
        paymentMethod: 'bank_account',
        asset: 'ETH'
      }

      const mockFees = {
        total: 15.9,
        total: 25.5, // Should not be used
        diBoaS: 0.9,
        network: 5,
        provider: 10
      }

      renderWithRouter(
        <TransactionProgressScreen
          transactionData={mockTransactionData}
          isCompleted={true}
          fees={mockFees}
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      )

      // Should show correct total fees in success screen
      expect(screen.getByText('$15.90')).toBeTruthy()
      expect(screen.queryByText('$25.50')).toBeFalsy()
    })

    it('should calculate correct net amount using total', () => {
      const mockTransactionData = {
        type: 'buy',
        amount: '1000',
        paymentMethod: 'credit_debit_card',
        asset: 'BTC'
      }

      const mockFees = {
        total: 15.9,
        total: 100.9, // Wrong value that should not be used for calculation
        diBoaS: 0.9,
        network: 5,
        provider: 10
      }

      renderWithRouter(
        <TransactionProgressScreen
          transactionData={mockTransactionData}
          isCompleted={true}
          fees={mockFees}
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      )

      // Net amount should be 1000 - 15.9 = 984.10 (using total)
      expect(screen.getByText('$984.10')).toBeTruthy()
      
      // Should NOT show 899.10 (which would be 1000 - 100.9 using wrong total)
      expect(screen.queryByText('$899.10')).toBeFalsy()
    })
  })

  describe('Different Transaction Types', () => {
    const transactionTypes = [
      { type: 'buy', amount: '1000', expectedDisplay: 'Buy Assets' },
      { type: 'sell', amount: '500', expectedDisplay: 'Sell Assets' },
      { type: 'withdraw', amount: '250', expectedDisplay: 'Withdrawal' },
      { type: 'add', amount: '750', expectedDisplay: 'Deposit' },
      { type: 'transfer', amount: '300', expectedDisplay: 'Transfer' }
    ]

    transactionTypes.forEach(({ type, amount, expectedDisplay }) => {
      it(`should display correct fees for ${type} transactions`, () => {
        const mockTransactionData = {
          type,
          amount,
          paymentMethod: 'diboas_wallet'
        }

        const mockFees = {
          total: 12.34,
          total: 56.78, // Should not be used
          diBoaS: 2.34,
          network: 10.0
        }

        renderWithRouter(
          <TransactionProgressScreen
            transactionData={mockTransactionData}
            flowState="confirming"
            fees={mockFees}
            onConfirm={() => {}}
            onCancel={() => {}}
          />
        )

        // Should show the transaction type
        expect(screen.getByText(`Confirm ${expectedDisplay}`)).toBeTruthy()
        
        // Should show correct total fees
        expect(screen.getByText('$12.34')).toBeTruthy()
        expect(screen.queryByText('$56.78')).toBeFalsy()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle zero total correctly', () => {
      const mockTransactionData = {
        type: 'send',
        amount: '100',
        paymentMethod: 'diboas_wallet'
      }

      const mockFees = {
        total: 0,
        total: 5.0,
        diBoaS: 0,
        network: 0
      }

      renderWithRouter(
        <TransactionProgressScreen
          transactionData={mockTransactionData}
          flowState="confirming"
          fees={mockFees}
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      )

      // Should show 0.00 for total, not fallback to total
      expect(screen.getByText('$0.00')).toBeTruthy()
      expect(screen.queryByText('$5.00')).toBeFalsy()
    })

    it('should handle very small fee amounts correctly', () => {
      const mockTransactionData = {
        type: 'transfer',
        amount: '10',
        paymentMethod: 'diboas_wallet'
      }

      const mockFees = {
        total: 0.01,
        total: 1.0,
        diBoaS: 0.009,
        network: 0.001
      }

      renderWithRouter(
        <TransactionProgressScreen
          transactionData={mockTransactionData}
          flowState="confirming"
          fees={mockFees}
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      )

      // Should show correct small amount
      expect(screen.getByText('$0.01')).toBeTruthy()
      expect(screen.queryByText('$1.00')).toBeFalsy()
    })

    it('should handle large fee amounts correctly', () => {
      const mockTransactionData = {
        type: 'buy',
        amount: '10000',
        paymentMethod: 'paypal'
      }

      const mockFees = {
        total: 309.0,
        total: 500.0,
        diBoaS: 9.0,
        network: 0.01,
        provider: 300.0
      }

      renderWithRouter(
        <TransactionProgressScreen
          transactionData={mockTransactionData}
          flowState="confirming"
          fees={mockFees}
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      )

      // Should show correct large amount
      expect(screen.getByText('$309.00')).toBeTruthy()
      expect(screen.queryByText('$500.00')).toBeFalsy()
    })
  })
})