/**
 * Progress Screen Elimination Test  
 * Verifies that the basic TransactionProgressScreen is no longer causing
 * double progress page issues and that EnhancedTransactionProgressScreen
 * is used consistently
 */

import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { BrowserRouter } from 'react-router-dom'
import TransactionPage from '../../components/TransactionPage.jsx'
import * as transactionHooks from '../../hooks/transactions/index.js'

vi.mock('../../hooks/transactions/index.js', () => ({
  useWalletBalance: vi.fn(() => ({ 
    balance: { 
      availableForSpending: 1000,
      assets: { BTC: { investedAmount: 500 } }
    } 
  })),
  useFeeCalculator: vi.fn(() => ({ 
    fees: { 
      total: 15.9, 
      total: 15.9, 
      diBoaS: 0.9, 
      network: 5, 
      provider: 10,
      breakdown: {
        network: { amount: 5, rate: 0.005 }
      }
    },
    calculateFees: vi.fn()
  })),
  useTransactionValidation: vi.fn(() => ({ 
    validationErrors: {}, 
    validateTransaction: vi.fn() 
  })),
  useTransactionFlow: vi.fn(() => ({
    flowState: 'idle',
    flowData: null,
    flowError: null,
    executeTransactionFlow: vi.fn(),
    confirmTransaction: vi.fn(),
    resetFlow: vi.fn()
  }))
}))

// Mock all the hooks with proper default returns
const mockExecuteTransactionFlow = vi.fn()
const mockConfirmTransaction = vi.fn()
const mockResetFlow = vi.fn()
const mockCalculateFees = vi.fn()
const mockValidateTransaction = vi.fn()

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

const renderTransactionPage = (transactionType = 'buy') => {
  return render(
    <BrowserRouter>
      <TransactionPage transactionType={transactionType} />
    </BrowserRouter>
  )
}

describe('Progress Screen Elimination', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Single Progress Screen Usage', () => {
    it('should only show EnhancedTransactionProgressScreen during transaction flow', () => {
      // Mock processing state
      vi.mocked(transactionHooks.useTransactionFlow).mockReturnValue({
        flowState: 'processing',
        flowData: { transactionId: 'tx_test_123' },
        flowError: null,
        executeTransactionFlow: mockExecuteTransactionFlow,
        confirmTransaction: mockConfirmTransaction,
        resetFlow: mockResetFlow
      })

      renderTransactionPage('buy')

      // Should show enhanced progress screen
      expect(screen.getByText('Buy Assets in Progress')).toBeTruthy()
      
      // Should NOT show basic progress screen titles
      expect(screen.queryByText('Processing Buy Assets')).toBeFalsy()
      
      // Enhanced screen has "Show Details" button, basic screen doesn't
      expect(screen.getByText('Show Details')).toBeTruthy()
    })

    it('should show confirmation screen for confirming state', () => {
      // Mock confirming state without transaction ID
      vi.mocked(transactionHooks.useTransactionFlow).mockReturnValue({
        flowState: 'confirming',
        flowData: { fees: { total: 15.9 } }, // Include fees for confirmation
        flowError: null,
        executeTransactionFlow: mockExecuteTransactionFlow,
        confirmTransaction: mockConfirmTransaction,
        resetFlow: mockResetFlow
      })

      renderTransactionPage('withdraw')

      // Should show confirmation screen for 'confirming' state (not progress screen)
      expect(screen.getByText('Confirm Withdrawal')).toBeTruthy()
      expect(screen.getByText('Confirm Transaction')).toBeTruthy()
      expect(screen.queryByText('Withdrawal in Progress')).toBeFalsy()
    })

    it('should handle progress flow states with enhanced progress screen', () => {
      const progressFlowStates = ['processing', 'pending', 'pending_blockchain']

      progressFlowStates.forEach(flowState => {
        vi.mocked(transactionHooks.useTransactionFlow).mockReturnValue({
          flowState,
          flowData: { transactionId: `tx_${flowState}_123` },
          flowError: null,
          executeTransactionFlow: mockExecuteTransactionFlow,
          confirmTransaction: mockConfirmTransaction,
          resetFlow: mockResetFlow
        })

        const { unmount } = renderTransactionPage('sell')

        // Should show enhanced progress screen for progress states
        expect(screen.getByText('Sell Assets in Progress')).toBeTruthy()
        expect(screen.queryByText('Processing Sell Assets')).toBeFalsy()

        unmount()
      })
    })

    it('should show confirmation screen for confirming state', () => {
      vi.mocked(transactionHooks.useTransactionFlow).mockReturnValue({
        flowState: 'confirming',
        flowData: { fees: { total: 15.9 } },
        flowError: null,
        executeTransactionFlow: mockExecuteTransactionFlow,
        confirmTransaction: mockConfirmTransaction,
        resetFlow: mockResetFlow
      })

      renderTransactionPage('sell')

      // Should show confirmation screen for confirming state
      expect(screen.getByText('Confirm Sell Assets')).toBeTruthy()
      expect(screen.queryByText('Sell Assets in Progress')).toBeFalsy()
    })
  })

  describe('Transaction Flow Simulation', () => {
    it('should progress through transaction states using only enhanced screen', () => {

      // Start with idle state (transaction form visible)
      vi.mocked(transactionHooks.useTransactionFlow).mockReturnValue({
        flowState: 'idle',
        flowData: null,
        flowError: null,
        executeTransactionFlow: mockExecuteTransactionFlow,
        confirmTransaction: mockConfirmTransaction,
        resetFlow: mockResetFlow
      })

      const { rerender } = renderTransactionPage('buy')

      // Should show transaction form
      expect(screen.getByText('Transaction Summary')).toBeTruthy()

      // Simulate confirming transaction (shows confirmation page)
      vi.mocked(transactionHooks.useTransactionFlow).mockReturnValue({
        flowState: 'confirming',
        flowData: { fees: { total: 15.9 } },
        flowError: null,
        executeTransactionFlow: mockExecuteTransactionFlow,
        confirmTransaction: mockConfirmTransaction,
        resetFlow: mockResetFlow
      })

      rerender(<BrowserRouter><TransactionPage transactionType="buy" /></BrowserRouter>)

      // Should show confirmation screen first
      expect(screen.getByText('Confirm Buy Assets')).toBeTruthy()
      expect(screen.queryByText('Buy Assets in Progress')).toBeFalsy()

      // Then simulate processing after confirmation
      vi.mocked(transactionHooks.useTransactionFlow).mockReturnValue({
        flowState: 'processing',
        flowData: { transactionId: 'tx_buy_test' },
        flowError: null,
        executeTransactionFlow: mockExecuteTransactionFlow,
        confirmTransaction: mockConfirmTransaction,
        resetFlow: mockResetFlow
      })

      rerender(<BrowserRouter><TransactionPage transactionType="buy" /></BrowserRouter>)

      // Should show enhanced progress screen
      expect(screen.getByText('Buy Assets in Progress')).toBeTruthy()
      expect(screen.queryByText('Processing Buy Assets')).toBeFalsy()

      // Simulate completion
      vi.mocked(transactionHooks.useTransactionFlow).mockReturnValue({
        flowState: 'completed',
        flowData: { transactionId: 'tx_buy_test' },
        flowError: null,
        executeTransactionFlow: mockExecuteTransactionFlow,
        confirmTransaction: mockConfirmTransaction,
        resetFlow: mockResetFlow
      })

      rerender(<BrowserRouter><TransactionPage transactionType="buy" /></BrowserRouter>)

      // Should show completion state
      expect(screen.getByText('Transaction Confirmed!')).toBeTruthy()
    })

    it('should handle error states with enhanced screen only', () => {

      vi.mocked(transactionHooks.useTransactionFlow).mockReturnValue({
        flowState: 'failed',
        flowData: { transactionId: 'tx_failed_test' },
        flowError: new Error('Transaction failed on blockchain'),
        executeTransactionFlow: mockExecuteTransactionFlow,
        confirmTransaction: mockConfirmTransaction,
        resetFlow: mockResetFlow
      })

      renderTransactionPage('transfer')

      // Should show enhanced error screen
      expect(screen.getByText('Transaction Failed')).toBeTruthy()
      expect(screen.getByText('Your funds are safe')).toBeTruthy()
      
      // Should not show basic error handling
      expect(screen.queryByText('Processing Transfer')).toBeFalsy()
    })
  })

  describe('Progress Screen Features Verification', () => {
    it('should have enhanced features not present in basic screen', () => {

      vi.mocked(transactionHooks.useTransactionFlow).mockReturnValue({
        flowState: 'processing',
        flowData: { transactionId: 'tx_feature_test' },
        flowError: null,
        executeTransactionFlow: mockExecuteTransactionFlow,
        confirmTransaction: mockConfirmTransaction,
        resetFlow: mockResetFlow
      })

      renderTransactionPage('withdraw')

      // Enhanced features that basic screen doesn't have
      expect(screen.getByText('Show Details')).toBeTruthy()
      expect(screen.getByText('Secured by blockchain technology')).toBeTruthy()
      
      // Should show progress steps with proper styling
      expect(screen.getByText('Withdrawal in Progress')).toBeTruthy()
    })

    it('should show details toggle functionality', () => {

      vi.mocked(transactionHooks.useTransactionFlow).mockReturnValue({
        flowState: 'processing', // Use processing state to show enhanced progress screen
        flowData: { transactionId: 'tx_details_test' },
        flowError: null,
        executeTransactionFlow: mockExecuteTransactionFlow,
        confirmTransaction: mockConfirmTransaction,
        resetFlow: mockResetFlow
      })

      renderTransactionPage('add')

      // Should have show details button
      const showDetailsButton = screen.getByText('Show Details')
      expect(showDetailsButton).toBeTruthy()

      // Click to show details
      fireEvent.click(showDetailsButton)

      // Should show hide details button
      expect(screen.getByText('Hide Details')).toBeTruthy()
    })
  })

  describe('No Basic Progress Screen Usage', () => {
    it('should never render basic TransactionProgressScreen titles', () => {
      const transactionTypes = ['buy', 'sell', 'withdraw', 'add', 'transfer']
      
      transactionTypes.forEach(type => {
        vi.mocked(transactionHooks.useTransactionFlow).mockReturnValue({
          flowState: 'processing',
          flowData: { transactionId: `tx_${type}_no_basic` },
          flowError: null,
          executeTransactionFlow: mockExecuteTransactionFlow,
          confirmTransaction: mockConfirmTransaction,
          resetFlow: mockResetFlow
        })

        const { unmount } = renderTransactionPage(type)

        // Basic progress screen titles that should NEVER appear
        const basicTitles = [
          `Processing ${type.charAt(0).toUpperCase() + type.slice(1)}`,
          `Processing ${type}`,
          'Processing...',
          'Please wait while we process'
        ]

        basicTitles.forEach(title => {
          expect(screen.queryByText(title)).toBeFalsy()
        })

        unmount()
      })
    })

    it('should not have basic progress screen UI elements', () => {

      vi.mocked(transactionHooks.useTransactionFlow).mockReturnValue({
        flowState: 'pending_blockchain',
        flowData: { transactionId: 'tx_ui_elements_test' },
        flowError: null,
        executeTransactionFlow: mockExecuteTransactionFlow,
        confirmTransaction: mockConfirmTransaction,
        resetFlow: mockResetFlow
      })

      renderTransactionPage('buy')

      // Enhanced screen has "Show Details", basic screen doesn't
      expect(screen.getByText('Show Details')).toBeTruthy()

      // Enhanced screen has "Secured by blockchain technology", basic screen has different text
      expect(screen.getByText('Secured by blockchain technology')).toBeTruthy()
      expect(screen.queryByText('Your transaction is secured with bank-level encryption')).toBeFalsy()
    })
  })

  describe('Backwards Compatibility', () => {
    it('should handle legacy flow data structures', () => {

      // Mock legacy flow data format (if any)
      vi.mocked(transactionHooks.useTransactionFlow).mockReturnValue({
        flowState: 'processing',
        flowData: {
          // Legacy format without transactionId
          fees: { total: 10.5, total: 10.5 },
          result: 'pending'
        },
        flowError: null,
        executeTransactionFlow: mockExecuteTransactionFlow,
        confirmTransaction: mockConfirmTransaction,
        resetFlow: mockResetFlow
      })

      renderTransactionPage('send')

      // Should still use enhanced screen even with legacy data
      expect(screen.getByText('Send Money in Progress')).toBeTruthy()
      expect(screen.queryByText('Processing Send Money')).toBeFalsy()
    })
  })
})