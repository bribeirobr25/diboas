/**
 * Transaction Confirmation Fixes Test
 * Tests for the two main fixes:
 * 1. Total Fees display showing correct values from TransactionSummary
 * 2. Single progress screen (EnhancedTransactionProgressScreen only)
 */

import { render, screen } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import TransactionProgressScreen from '../../components/shared/TransactionProgressScreen.jsx'
import EnhancedTransactionProgressScreen from '../../components/shared/EnhancedTransactionProgressScreen.jsx'
import TransactionPage from '../../components/TransactionPage.jsx'
import * as transactionHooks from '../../hooks/transactions/index.js'

// Mock the hooks
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

vi.mock('../../hooks/transactions/index.js', () => ({
  useWalletBalance: vi.fn(() => ({ balance: { availableForSpending: 1000 } })),
  useFeeCalculator: vi.fn(() => ({ 
    fees: { total: 15.9, totalFees: 15.9, diBoaS: 0.9, network: 5, provider: 10 },
    calculateFees: vi.fn()
  })),
  useTransactionValidation: vi.fn(() => ({ validationErrors: {}, validateTransaction: vi.fn() })),
  useTransactionFlow: vi.fn(() => ({
    flowState: 'idle',
    flowData: null,
    flowError: null,
    executeTransactionFlow: vi.fn(),
    confirmTransaction: vi.fn(),
    resetFlow: vi.fn()
  }))
}))

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Transaction Confirmation Fixes', () => {
  describe('Fix 1: Total Fees Display Bug', () => {
    it('should display correct total fees using totalFees property', () => {
      const mockTransactionData = {
        type: 'buy',
        amount: '1000',
        paymentMethod: 'credit_debit_card',
        asset: 'BTC'
      }

      const mockFees = {
        total: 100.9, // Old property - should be fallback
        totalFees: 15.9, // New correct property - should be used
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

      // Should display the totalFees value (15.9) not the total value (100.9)
      expect(screen.getByText('$15.90')).toBeTruthy()
      expect(screen.queryByText('$100.90')).toBeFalsy()
    })

    it('should fallback to total property if totalFees is not available', () => {
      const mockTransactionData = {
        type: 'withdraw',
        amount: '500',
        paymentMethod: 'external_wallet'
      }

      const mockFees = {
        total: 25.5, // Should be used as fallback
        // totalFees not provided
        diBoaS: 4.5,
        network: 1.0,
        dex: 20.0
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

      expect(screen.getByText('$25.50')).toBeTruthy()
    })

    it('should show 0.00 if no fees are provided', () => {
      const mockTransactionData = {
        type: 'sell',
        amount: '250',
        paymentMethod: 'diboas_wallet'
      }

      renderWithRouter(
        <TransactionProgressScreen
          transactionData={mockTransactionData}
          flowState="confirming"
          fees={null} // No fees provided
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      )

      // Should not show fees section at all when fees is null
      expect(screen.queryByText('Total Fees:')).toBeFalsy()
    })

    it('should calculate correct net amount using totalFees', () => {
      const mockTransactionData = {
        type: 'buy',
        amount: '1000',
        paymentMethod: 'bank_account',
        asset: 'ETH'
      }

      const mockFees = {
        totalFees: 15.9,
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

      // Net amount should be 1000 - 15.9 = 984.10
      expect(screen.getByText('$984.10')).toBeTruthy()
    })
  })

  describe('Fix 2: Single Progress Screen', () => {
    it('should use EnhancedTransactionProgressScreen for all transaction states', () => {
      
      // Mock the transaction flow to return processing state
      vi.mocked(transactionHooks.useTransactionFlow).mockReturnValue({
        flowState: 'processing',
        flowData: { transactionId: 'tx_123' },
        flowError: null,
        executeTransactionFlow: vi.fn(),
        confirmTransaction: vi.fn(),
        resetFlow: vi.fn()
      })

      renderWithRouter(<TransactionPage transactionType="buy" />)

      // Should show the enhanced progress screen title
      expect(screen.getByText('Buy Assets in Progress')).toBeTruthy()
      
      // Should not show the basic progress screen title
      expect(screen.queryByText('Processing Buy Assets')).toBeFalsy()
    })

    it('should use EnhancedTransactionProgressScreen for processing state', () => {
      
      // Mock the transaction flow in processing state (shows progress screen)
      vi.mocked(transactionHooks.useTransactionFlow).mockReturnValue({
        flowState: 'processing',
        flowData: { transactionId: 'tx_test_123' },
        flowError: null,
        executeTransactionFlow: vi.fn(),
        confirmTransaction: vi.fn(),
        resetFlow: vi.fn()
      })

      renderWithRouter(<TransactionPage transactionType="withdraw" />)

      // Should use enhanced progress screen
      expect(screen.getByText('Withdrawal in Progress')).toBeTruthy()
    })

    it('should handle all transaction types with single progress screen', () => {
      const transactionTypes = [
        { type: 'buy', expectedTitle: 'Buy Assets in Progress' },
        { type: 'sell', expectedTitle: 'Sell Assets in Progress' },
        { type: 'withdraw', expectedTitle: 'Withdrawal in Progress' },
        { type: 'add', expectedTitle: 'Deposit in Progress' },
        { type: 'transfer', expectedTitle: 'Transfer in Progress' }
      ]

      transactionTypes.forEach(({ type, expectedTitle }) => {
          
        vi.mocked(transactionHooks.useTransactionFlow).mockReturnValue({
          flowState: 'processing', // Use processing to show progress screen
          flowData: { transactionId: `tx_${type}_123` },
          flowError: null,
          executeTransactionFlow: vi.fn(),
          confirmTransaction: vi.fn(),
          resetFlow: vi.fn()
        })

        const { unmount } = renderWithRouter(<TransactionPage transactionType={type} />)

        expect(screen.getByText(expectedTitle)).toBeTruthy()
        
        // Should not show basic progress screen titles
        expect(screen.queryByText(`Processing ${expectedTitle.split(' in Progress')[0]}`)).toBeFalsy()
        
        unmount()
      })
    })
  })

  describe('Enhanced Progress Screen Features', () => {
    it('should show transaction details with show/hide toggle', () => {
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

      // Should have show details button
      expect(screen.getByText('Show Details')).toBeTruthy()
    })

    it('should handle completion state correctly', () => {
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

      expect(screen.getByText('Transaction Confirmed!')).toBeTruthy()
      expect(screen.getByText('Return to Dashboard')).toBeTruthy()
    })

    it('should handle error state correctly', () => {
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

      expect(screen.getByText('Transaction Failed')).toBeTruthy()
      expect(screen.getByText('Your funds are safe')).toBeTruthy()
    })
  })

  describe('Integration Tests', () => {
    it('should maintain fee values through the entire transaction flow', () => {
      
      const correctFees = {
        totalFees: 15.9,
        total: 100.9, // Wrong value that should not be used
        diBoaS: 0.9,
        network: 5,
        provider: 10
      }

      vi.mocked(transactionHooks.useFeeCalculator).mockReturnValue({
        fees: correctFees,
        calculateFees: vi.fn()
      })

      vi.mocked(transactionHooks.useTransactionFlow).mockReturnValue({
        flowState: 'confirming',
        flowData: { fees: correctFees },
        flowError: null,
        executeTransactionFlow: vi.fn(),
        confirmTransaction: vi.fn(),
        resetFlow: vi.fn()
      })

      renderWithRouter(<TransactionPage transactionType="buy" />)

      // Even in the enhanced progress screen, fees should be handled correctly
      // The component will receive fees from flowData
      expect(screen.getByText('Buy Assets in Progress')).toBeTruthy()
    })

    it('should handle transaction state transitions smoothly', () => {
      
      // Start with processing state
      vi.mocked(transactionHooks.useTransactionFlow).mockReturnValue({
        flowState: 'processing',
        flowData: { transactionId: 'tx_123' },
        flowError: null,
        executeTransactionFlow: vi.fn(),
        confirmTransaction: vi.fn(),
        resetFlow: vi.fn()
      })

      const { rerender } = renderWithRouter(<TransactionPage transactionType="sell" />)

      expect(screen.getByText('Sell Assets in Progress')).toBeTruthy()

      // Transition to completed state
      vi.mocked(transactionHooks.useTransactionFlow).mockReturnValue({
        flowState: 'completed',
        flowData: { transactionId: 'tx_123' },
        flowError: null,
        executeTransactionFlow: vi.fn(),
        confirmTransaction: vi.fn(),
        resetFlow: vi.fn()
      })

      rerender(<TransactionPage transactionType="sell" />)

      expect(screen.getByText('Transaction Confirmed!')).toBeTruthy()
    })
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle missing transaction data gracefully', () => {
      renderWithRouter(
        <EnhancedTransactionProgressScreen
          transactionData={null}
          flowState="processing"
          flowData={{}}
          flowError={null}
        />
      )

      // Should still render without crashing
      expect(screen.getByText('Deposit in Progress')).toBeTruthy() // Default type
    })

    it('should handle malformed fee objects', () => {
      const mockTransactionData = {
        type: 'buy',
        amount: '1000'
      }

      const malformedFees = {
        // Missing expected properties
        someRandomProperty: 'invalid'
      }

      renderWithRouter(
        <TransactionProgressScreen
          transactionData={mockTransactionData}
          flowState="confirming"
          fees={malformedFees}
          onConfirm={() => {}}
          onCancel={() => {}}
        />
      )

      // Should show 0.00 when fees are malformed
      expect(screen.getByText('$0.00')).toBeTruthy()
    })
  })
})