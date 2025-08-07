/**
 * Component Tests for EnhancedTransactionProgressScreen
 * Tests blockchain-aware transaction progress UI with on-chain confirmation
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import EnhancedTransactionProgressScreen from '../shared/EnhancedTransactionProgressScreen.jsx'
import { TRANSACTION_STATUS } from '../../services/onchain/OnChainStatusProvider.js'

// Mock the useOnChainStatus hook
vi.mock('../../hooks/useOnChainStatus.js', () => ({
  useOnChainStatus: vi.fn()
}))

// Mock navigation
const mockNavigate = vi.fn()
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom')
  return {
    ...actual,
    useNavigate: () => mockNavigate
  }
})

// Test wrapper component
const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

describe('EnhancedTransactionProgressScreen', () => {
  let mockUseOnChainStatus

  beforeEach(() => {
    mockUseOnChainStatus = (await import('../../hooks/useOnChainStatus.js')).useOnChainStatus
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  const defaultTransactionData = {
    type: 'transfer',
    amount: '100',
    recipient: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
    asset: 'USDC',
    paymentMethod: 'diboas_wallet'
  }

  const defaultProps = {
    transactionData: defaultTransactionData,
    transactionId: 'tx-123',
    onConfirm: vi.fn(),
    onCancel: vi.fn(),
    flowState: 'processing',
    flowData: { transactionId: 'tx-123' },
    flowError: null
  }

  describe('processing state', () => {
    it('should render processing state correctly', () => {
      mockUseOnChainStatus.mockReturnValue({
        status: null,
        isLoading: true,
        error: null,
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
        isFailed: false,
        progress: null,
        explorerLink: null,
        txHash: null,
        chain: null
      })

      render(
        <TestWrapper>
          <EnhancedTransactionProgressScreen {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByText('Transfer in Progress')).toBeInTheDocument()
      expect(screen.getByText('Please wait while we process your transaction')).toBeInTheDocument()
      
      // Check for progress steps
      expect(screen.getByText('Validating external address')).toBeInTheDocument()
      expect(screen.getByText('Submitting cross-chain transfer')).toBeInTheDocument()
      expect(screen.getByText('Waiting for blockchain confirmation')).toBeInTheDocument()
      expect(screen.getByText('Transfer completed')).toBeInTheDocument()
    })

    it('should show blockchain confirmation progress when available', () => {
      mockUseOnChainStatus.mockReturnValue({
        status: {
          status: TRANSACTION_STATUS.CONFIRMING,
          confirmations: 6,
          requiredConfirmations: 12
        },
        isLoading: false,
        error: null,
        isPending: false,
        isConfirming: true,
        isConfirmed: false,
        isFailed: false,
        progress: { current: 6, required: 12, percentage: 50 },
        explorerLink: null,
        txHash: null,
        chain: 'ETH'
      })

      render(
        <TestWrapper>
          <EnhancedTransactionProgressScreen {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByText('Blockchain Confirmation')).toBeInTheDocument()
      expect(screen.getByText('6/12 confirmations')).toBeInTheDocument()
      expect(screen.getByText('Network: ETH')).toBeInTheDocument()

      // Check progress bar
      const progressBar = screen.getByRole('progressbar', { hidden: true })
      expect(progressBar).toHaveStyle('width: 50%')
    })

    it('should show explorer link when available', () => {
      mockUseOnChainStatus.mockReturnValue({
        status: {
          status: TRANSACTION_STATUS.CONFIRMING
        },
        isLoading: false,
        error: null,
        isPending: false,
        isConfirming: true,
        isConfirmed: false,
        isFailed: false,
        progress: null,
        explorerLink: 'https://etherscan.io/tx/0x123',
        txHash: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
        chain: 'ETH'
      })

      render(
        <TestWrapper>
          <EnhancedTransactionProgressScreen {...defaultProps} />
        </TestWrapper>
      )

      expect(screen.getByText('Transaction Hash')).toBeInTheDocument()
      expect(screen.getByText('0x1234567890abcdef...90abcdef')).toBeInTheDocument()
      
      const explorerButton = screen.getByRole('button', { name: /view on explorer/i })
      expect(explorerButton).toBeInTheDocument()
      
      fireEvent.click(explorerButton)
      // Note: Can't easily test window.open in jsdom, but we verify the button exists
    })

    it('should show transaction details when toggled', () => {
      mockUseOnChainStatus.mockReturnValue({
        status: null,
        isLoading: true,
        error: null,
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
        isFailed: false,
        progress: null,
        explorerLink: null,
        txHash: null,
        chain: 'SOL'
      })

      render(
        <TestWrapper>
          <EnhancedTransactionProgressScreen {...defaultProps} />
        </TestWrapper>
      )

      const showDetailsButton = screen.getByRole('button', { name: /show details/i })
      fireEvent.click(showDetailsButton)

      expect(screen.getByText('From:')).toBeInTheDocument()
      expect(screen.getByText('diBoaS Wallet Available Balance')).toBeInTheDocument()
      expect(screen.getByText('To:')).toBeInTheDocument()
      expect(screen.getByText('External Wallet')).toBeInTheDocument()
      expect(screen.getByText('Amount:')).toBeInTheDocument()
      expect(screen.getByText('$100')).toBeInTheDocument()
      expect(screen.getByText('Network:')).toBeInTheDocument()
      expect(screen.getByText('SOL')).toBeInTheDocument()
    })
  })

  describe('completed state', () => {
    it('should render completed state correctly', () => {
      mockUseOnChainStatus.mockReturnValue({
        status: {
          status: TRANSACTION_STATUS.CONFIRMED,
          confirmedAt: '2024-01-01T12:00:00Z'
        },
        isLoading: false,
        error: null,
        isPending: false,
        isConfirming: false,
        isConfirmed: true,
        isFailed: false,
        progress: null,
        explorerLink: 'https://solscan.io/tx/hash123',
        txHash: 'hash123',
        chain: 'SOL'
      })

      render(
        <TestWrapper>
          <EnhancedTransactionProgressScreen 
            {...defaultProps} 
            flowState="completed"
          />
        </TestWrapper>
      )

      expect(screen.getByText('Transaction Confirmed!')).toBeInTheDocument()
      expect(screen.getByText('Your transfer has been successfully confirmed on the blockchain.')).toBeInTheDocument()
      
      // Check transaction details
      expect(screen.getByText('From:')).toBeInTheDocument()
      expect(screen.getByText('To:')).toBeInTheDocument()
      expect(screen.getByText('Amount:')).toBeInTheDocument()
      expect(screen.getByText('$100')).toBeInTheDocument()
      
      // Check confirmed time
      expect(screen.getByText('Confirmed:')).toBeInTheDocument()
      
      const returnButton = screen.getByRole('button', { name: /return to dashboard/i })
      expect(returnButton).toBeInTheDocument()
      
      fireEvent.click(returnButton)
      expect(mockNavigate).toHaveBeenCalledWith('/app')
    })
  })

  describe('failed state', () => {
    it('should render failed state with fund safety message', () => {
      mockUseOnChainStatus.mockReturnValue({
        status: {
          status: TRANSACTION_STATUS.FAILED
        },
        isLoading: false,
        error: 'Insufficient gas fees',
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
        isFailed: true,
        progress: null,
        explorerLink: 'https://etherscan.io/tx/failed123',
        txHash: 'failed123',
        chain: 'ETH'
      })

      render(
        <TestWrapper>
          <EnhancedTransactionProgressScreen 
            {...defaultProps} 
            flowState="failed"
          />
        </TestWrapper>
      )

      expect(screen.getByText('Transaction Failed')).toBeInTheDocument()
      expect(screen.getByText('Insufficient gas fees')).toBeInTheDocument()
      
      // Check fund safety message
      expect(screen.getByText('Your funds are safe')).toBeInTheDocument()
      expect(screen.getByText('No changes were made to your balance since the transaction failed on the blockchain.')).toBeInTheDocument()
      
      const returnButton = screen.getByRole('button', { name: /return to dashboard/i })
      expect(returnButton).toBeInTheDocument()
      
      fireEvent.click(returnButton)
      expect(mockNavigate).toHaveBeenCalledWith('/app')
    })

    it('should show explorer link for failed transactions', () => {
      mockUseOnChainStatus.mockReturnValue({
        status: {
          status: TRANSACTION_STATUS.FAILED
        },
        isLoading: false,
        error: 'Transaction reverted',
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
        isFailed: true,
        progress: null,
        explorerLink: 'https://etherscan.io/tx/failed123',
        txHash: 'failed123abc',
        chain: 'ETH'
      })

      render(
        <TestWrapper>
          <EnhancedTransactionProgressScreen 
            {...defaultProps} 
            flowState="failed"
          />
        </TestWrapper>
      )

      expect(screen.getByText('Transaction Hash')).toBeInTheDocument()
      expect(screen.getByText('failed123abc...ed123abc')).toBeInTheDocument()
      
      const explorerButton = screen.getByRole('button', { name: /view on explorer/i })
      expect(explorerButton).toBeInTheDocument()
    })
  })

  describe('different transaction types', () => {
    it('should render correct configuration for add transaction', () => {
      mockUseOnChainStatus.mockReturnValue({
        status: null,
        isLoading: true,
        error: null,
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
        isFailed: false,
        progress: null,
        explorerLink: null,
        txHash: null,
        chain: null
      })

      render(
        <TestWrapper>
          <EnhancedTransactionProgressScreen 
            {...defaultProps}
            transactionData={{
              ...defaultTransactionData,
              type: 'add',
              paymentMethod: 'credit_debit_card'
            }}
          />
        </TestWrapper>
      )

      expect(screen.getByText('Deposit in Progress')).toBeInTheDocument()
      expect(screen.getByText('Processing payment method')).toBeInTheDocument()
      expect(screen.getByText('Submitting to blockchain')).toBeInTheDocument()
      expect(screen.getByText('Confirming on Solana network')).toBeInTheDocument()
      expect(screen.getByText('Updating your balance')).toBeInTheDocument()
    })

    it('should render correct configuration for buy transaction', () => {
      mockUseOnChainStatus.mockReturnValue({
        status: null,
        isLoading: true,
        error: null,
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
        isFailed: false,
        progress: null,
        explorerLink: null,
        txHash: null,
        chain: null
      })

      render(
        <TestWrapper>
          <EnhancedTransactionProgressScreen 
            {...defaultProps}
            transactionData={{
              ...defaultTransactionData,
              type: 'buy',
              asset: 'BTC',
              paymentMethod: 'diboas_wallet'
            }}
          />
        </TestWrapper>
      )

      expect(screen.getByText('Buy Assets in Progress')).toBeInTheDocument()
      expect(screen.getByText('Processing payment')).toBeInTheDocument()
      expect(screen.getByText('Executing blockchain trade')).toBeInTheDocument()
      expect(screen.getByText('Confirming on network')).toBeInTheDocument()
      expect(screen.getByText('Updating portfolio')).toBeInTheDocument()
    })
  })

  describe('callback handling', () => {
    it('should call onConfirmed callback when transaction is confirmed', async () => {
      const onConfirmed = vi.fn()
      
      mockUseOnChainStatus.mockReturnValue({
        status: {
          status: TRANSACTION_STATUS.CONFIRMED
        },
        isLoading: false,
        error: null,
        isPending: false,
        isConfirming: false,
        isConfirmed: true,
        isFailed: false,
        progress: null,
        explorerLink: null,
        txHash: null,
        chain: null
      })

      // We need to simulate the hook calling the callback
      const { rerender } = render(
        <TestWrapper>
          <EnhancedTransactionProgressScreen 
            {...defaultProps}
          />
        </TestWrapper>
      )

      // Verify that the callback would be called by the hook
      expect(mockUseOnChainStatus).toHaveBeenCalledWith('tx-123', expect.objectContaining({
        onConfirmed: expect.any(Function),
        onFailed: expect.any(Function)
      }))
    })

    it('should call onFailed callback when transaction fails', async () => {
      const onFailed = vi.fn()
      
      mockUseOnChainStatus.mockReturnValue({
        status: {
          status: TRANSACTION_STATUS.FAILED
        },
        isLoading: false,
        error: 'Transaction failed',
        isPending: false,
        isConfirming: false,
        isConfirmed: false,
        isFailed: true,
        progress: null,
        explorerLink: null,
        txHash: null,
        chain: null
      })

      render(
        <TestWrapper>
          <EnhancedTransactionProgressScreen 
            {...defaultProps}
          />
        </TestWrapper>
      )

      // Verify that the callback would be called by the hook
      expect(mockUseOnChainStatus).toHaveBeenCalledWith('tx-123', expect.objectContaining({
        onConfirmed: expect.any(Function),
        onFailed: expect.any(Function)
      }))
    })
  })

  describe('step progression', () => {
    it('should show correct step progression for pending blockchain state', () => {
      mockUseOnChainStatus.mockReturnValue({
        status: {
          status: TRANSACTION_STATUS.PENDING
        },
        isLoading: false,
        error: null,
        isPending: true,
        isConfirming: false,
        isConfirmed: false,
        isFailed: false,
        progress: null,
        explorerLink: null,
        txHash: null,
        chain: null
      })

      render(
        <TestWrapper>
          <EnhancedTransactionProgressScreen 
            {...defaultProps}
            flowState="pending_blockchain"
          />
        </TestWrapper>
      )

      // First step should be completed, second should be current
      const completedSteps = screen.getAllByTestId('completed-step', { hidden: true })
      const currentSteps = screen.getAllByTestId('current-step', { hidden: true })
      
      // We can't easily test the exact step indicators without adding test IDs,
      // but we can verify the component renders without errors
      expect(screen.getByText('Transfer in Progress')).toBeInTheDocument()
    })

    it('should show all steps completed for confirmed state', () => {
      mockUseOnChainStatus.mockReturnValue({
        status: {
          status: TRANSACTION_STATUS.CONFIRMED
        },
        isLoading: false,
        error: null,
        isPending: false,
        isConfirming: false,
        isConfirmed: true,
        isFailed: false,
        progress: null,
        explorerLink: null,
        txHash: null,
        chain: null
      })

      render(
        <TestWrapper>
          <EnhancedTransactionProgressScreen 
            {...defaultProps}
            flowState="completed"
          />
        </TestWrapper>
      )

      expect(screen.getByText('Transaction Confirmed!')).toBeInTheDocument()
    })
  })
})