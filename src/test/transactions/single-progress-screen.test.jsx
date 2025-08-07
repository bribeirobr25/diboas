/**
 * Single Progress Screen Test
 * Tests the fix for removing double progress screens and using only EnhancedTransactionProgressScreen
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import EnhancedTransactionProgressScreen from '../../components/shared/EnhancedTransactionProgressScreen.jsx'

// Mock hooks
vi.mock('../../hooks/useOnChainStatus.js', () => ({
  useOnChainStatus: vi.fn(() => ({
    status: null,
    isLoading: false,
    error: null,
    isPending: false,
    isConfirming: false,
    isConfirmed: false,
    isFailed: false,
    progress: null,
    explorerLink: null,
    txHash: null,
    chain: null
  }))
}))

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Single Progress Screen Fix', () => {
  describe('Enhanced Progress Screen Usage', () => {
    it('should show "in Progress" title format characteristic of enhanced screen', () => {
      const mockTransactionData = {
        type: 'buy',
        amount: '1000',
        paymentMethod: 'credit_debit_card',
        asset: 'BTC'
      }

      renderWithRouter(
        <EnhancedTransactionProgressScreen
          transactionData={mockTransactionData}
          flowState="processing"
          flowData={{}}
          flowError={null}
        />
      )

      // Enhanced screen shows "Buy Assets in Progress"
      expect(screen.getByText('Buy Assets in Progress')).toBeTruthy()
      
      // Basic screen would show "Processing Buy Assets" - should NOT be present
      expect(screen.queryByText('Processing Buy Assets')).toBeFalsy()
    })

    it('should have Show Details button characteristic of enhanced screen', () => {
      const mockTransactionData = {
        type: 'withdraw',
        amount: '500',
        paymentMethod: 'external_wallet'
      }

      renderWithRouter(
        <EnhancedTransactionProgressScreen
          transactionData={mockTransactionData}
          flowState="confirming"
          flowData={{}}
          flowError={null}
        />
      )

      // Enhanced screen has "Show Details" button
      expect(screen.getByText('Show Details')).toBeTruthy()
      
      // Enhanced screen shows specific title format
      expect(screen.getByText('Withdrawal in Progress')).toBeTruthy()
    })

    it('should show blockchain security message characteristic of enhanced screen', () => {
      const mockTransactionData = {
        type: 'sell',
        amount: '250',
        paymentMethod: 'diboas_wallet',
        asset: 'ETH'
      }

      renderWithRouter(
        <EnhancedTransactionProgressScreen
          transactionData={mockTransactionData}
          flowState="processing"
          flowData={{}}
          flowError={null}
        />
      )

      // Enhanced screen shows blockchain security message
      expect(screen.getByText('Secured by blockchain technology')).toBeTruthy()
      
      // Basic screen would show different security message - should NOT be present
      expect(screen.queryByText('Your transaction is secured with bank-level encryption')).toBeFalsy()
    })
  })

  describe('All Transaction Types with Enhanced Screen', () => {
    const transactionTypes = [
      { type: 'buy', expectedTitle: 'Buy Assets in Progress' },
      { type: 'sell', expectedTitle: 'Sell Assets in Progress' },
      { type: 'withdraw', expectedTitle: 'Withdrawal in Progress' },
      { type: 'add', expectedTitle: 'Deposit in Progress' },
      { type: 'transfer', expectedTitle: 'Transfer in Progress' },
      { type: 'send', expectedTitle: 'Send Money in Progress' }
    ]

    transactionTypes.forEach(({ type, expectedTitle }) => {
      it(`should show enhanced screen for ${type} transactions`, () => {
        const mockTransactionData = {
          type,
          amount: '100',
          paymentMethod: 'diboas_wallet',
          asset: 'SOL'
        }

        renderWithRouter(
          <EnhancedTransactionProgressScreen
            transactionData={mockTransactionData}
            flowState="processing"
            flowData={{ transactionId: `tx_${type}_test` }}
            flowError={null}
          />
        )

        // Should show enhanced screen title
        expect(screen.getByText(expectedTitle)).toBeTruthy()
        
        // Should have enhanced screen features
        expect(screen.getByText('Show Details')).toBeTruthy()
        expect(screen.getByText('Secured by blockchain technology')).toBeTruthy()
        
        // Should NOT show basic screen titles
        const basicTitle = `Processing ${type.charAt(0).toUpperCase() + type.slice(1)}`
        expect(screen.queryByText(basicTitle)).toBeFalsy()
      })
    })
  })

  describe('Different Flow States', () => {
    const flowStates = ['processing', 'confirming', 'pending', 'pending_blockchain']

    flowStates.forEach(flowState => {
      it(`should use enhanced screen for ${flowState} state`, () => {
        const mockTransactionData = {
          type: 'buy',
          amount: '1000',
          paymentMethod: 'credit_debit_card',
          asset: 'BTC'
        }

        renderWithRouter(
          <EnhancedTransactionProgressScreen
            transactionData={mockTransactionData}
            flowState={flowState}
            flowData={{ transactionId: `tx_${flowState}_test` }}
            flowError={null}
          />
        )

        // All states should show enhanced screen characteristics
        expect(screen.getByText('Buy Assets in Progress')).toBeTruthy()
        expect(screen.getByText('Show Details')).toBeTruthy()
        
        // Should not show basic screen elements
        expect(screen.queryByText('Processing Buy Assets')).toBeFalsy()
      })
    })
  })

  describe('Completion and Error States', () => {
    it('should show enhanced completion screen', () => {
      const mockTransactionData = {
        type: 'sell',
        amount: '500',
        paymentMethod: 'diboas_wallet',
        asset: 'ETH'
      }

      renderWithRouter(
        <EnhancedTransactionProgressScreen
          transactionData={mockTransactionData}
          flowState="completed"
          flowData={{}}
          flowError={null}
        />
      )

      // Enhanced completion screen title
      expect(screen.getByText('Transaction Confirmed!')).toBeTruthy()
      expect(screen.getByText('Return to Dashboard')).toBeTruthy()
      
      // Should not show basic completion screen elements
      expect(screen.queryByText('Sell Assets Successful!')).toBeFalsy()
    })

    it('should show enhanced error screen', () => {
      const mockTransactionData = {
        type: 'withdraw',
        amount: '200',
        paymentMethod: 'external_wallet'
      }

      const mockError = new Error('Transaction failed on blockchain')

      renderWithRouter(
        <EnhancedTransactionProgressScreen
          transactionData={mockTransactionData}
          flowState="failed"
          flowData={{}}
          flowError={mockError}
        />
      )

      // Enhanced error screen elements
      expect(screen.getByText('Transaction Failed')).toBeTruthy()
      expect(screen.getByText('Your funds are safe')).toBeTruthy()
      
      // Basic screen error handling should not be present
      expect(screen.queryByText('Error occurred during processing')).toBeFalsy()
    })
  })

  describe('Enhanced Screen Unique Features', () => {
    it('should have transaction details toggle functionality', () => {
      const mockTransactionData = {
        type: 'transfer',
        amount: '300',
        paymentMethod: 'diboas_wallet'
      }

      renderWithRouter(
        <EnhancedTransactionProgressScreen
          transactionData={mockTransactionData}
          flowState="confirming"
          flowData={{}}
          flowError={null}
        />
      )

      // Enhanced screen specific features
      expect(screen.getByText('Show Details')).toBeTruthy()
      expect(screen.getByText('Transfer in Progress')).toBeTruthy()
      
      // Should not have basic screen step visualization
      expect(screen.queryByText('Please wait while we process your transfer...')).toBeFalsy()
    })

    it('should show blockchain confirmation progress when available', () => {
      const mockTransactionData = {
        type: 'buy',
        amount: '1000',
        paymentMethod: 'diboas_wallet',
        asset: 'BTC'
      }

      renderWithRouter(
        <EnhancedTransactionProgressScreen
          transactionData={mockTransactionData}
          transactionId="tx_with_progress"
          flowState="confirming"
          flowData={{}}
          flowError={null}
        />
      )

      // Should show enhanced screen characteristics  
      expect(screen.getByText('Buy Assets in Progress')).toBeTruthy()
      expect(screen.getByText('Show Details')).toBeTruthy()
      expect(screen.getByText('Secured by blockchain technology')).toBeTruthy()
    })
  })

  describe('No Basic Screen Elements', () => {
    it('should not show any basic progress screen UI elements', () => {
      const mockTransactionData = {
        type: 'add',
        amount: '750',
        paymentMethod: 'bank_account'
      }

      renderWithRouter(
        <EnhancedTransactionProgressScreen
          transactionData={mockTransactionData}
          flowState="processing"
          flowData={{}}
          flowError={null}
        />
      )

      // Enhanced screen elements should be present
      expect(screen.getByText('Deposit in Progress')).toBeTruthy()
      expect(screen.getByText('Show Details')).toBeTruthy()
      
      // Basic screen elements should NOT be present
      expect(screen.queryByText('Processing Deposit')).toBeFalsy()
      expect(screen.queryByText('Please wait while we process your deposit...')).toBeFalsy()
      expect(screen.queryByText('Your transaction is secured with bank-level encryption')).toBeFalsy()
    })

    it('should not show basic screen specific UI patterns', () => {
      const mockTransactionData = {
        type: 'send',
        amount: '150',
        paymentMethod: 'diboas_wallet'
      }

      renderWithRouter(
        <EnhancedTransactionProgressScreen
          transactionData={mockTransactionData}
          flowState="processing"
          flowData={{}}
          flowError={null}
        />
      )

      // Enhanced screen format - has "in Progress" title
      expect(screen.getByText('Send Money in Progress')).toBeTruthy()
      
      // Enhanced screen has Show Details and blockchain security message
      expect(screen.getByText('Show Details')).toBeTruthy()
      expect(screen.getByText('Secured by blockchain technology')).toBeTruthy()
      
      // Basic screen would have these specific phrases - should not be present
      expect(screen.queryByText('Please wait while we process your send money...')).toBeFalsy()
      expect(screen.queryByText('Your transaction is secured with bank-level encryption')).toBeFalsy()
    })
  })

  describe('Backwards Compatibility', () => {
    it('should handle transactions without transaction ID', () => {
      const mockTransactionData = {
        type: 'sell',
        amount: '200',
        paymentMethod: 'diboas_wallet',
        asset: 'SOL'
      }

      renderWithRouter(
        <EnhancedTransactionProgressScreen
          transactionData={mockTransactionData}
          transactionId={null} // No transaction ID
          flowState="processing"
          flowData={{}}
          flowError={null}
        />
      )

      // Should still use enhanced screen
      expect(screen.getByText('Sell Assets in Progress')).toBeTruthy()
      expect(screen.getByText('Show Details')).toBeTruthy()
    })

    it('should handle legacy flow data formats', () => {
      const mockTransactionData = {
        type: 'withdraw',
        amount: '400',
        paymentMethod: 'external_wallet'
      }

      renderWithRouter(
        <EnhancedTransactionProgressScreen
          transactionData={mockTransactionData}
          flowState="confirming"
          flowData={{ legacy: true }} // Legacy format
          flowError={null}
        />
      )

      // Should still work with enhanced screen
      expect(screen.getByText('Withdrawal in Progress')).toBeTruthy()
      expect(screen.getByText('Secured by blockchain technology')).toBeTruthy()
    })
  })
})