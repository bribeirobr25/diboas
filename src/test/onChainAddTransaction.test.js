/**
 * On-Chain Add Transaction Tests
 * Tests the crypto wallet deposit functionality for Add transactions
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import TransactionPage from '../components/TransactionPage'
import WalletAddressDisplay from '../components/transactions/WalletAddressDisplay'
import { useWalletBalance } from '../hooks/useTransactions'

// Mock the hooks
vi.mock('../hooks/useTransactions', () => ({
  useWalletBalance: vi.fn(),
  useFeeCalculator: vi.fn(() => ({
    fees: { total: 0, network: 0, provider: 0 },
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

// Mock clipboard API
Object.assign(navigator, {
  clipboard: {
    writeText: vi.fn()
  }
})

describe('On-Chain Add Transaction', () => {
  beforeEach(() => {
    // Setup mock wallet balance
    useWalletBalance.mockReturnValue({
      balance: {
        availableForSpending: 1000,
        investedAmount: 500,
        totalUSD: 1500
      },
      getBalance: vi.fn(),
      isLoading: false
    })
    
    // Clear clipboard mock
    navigator.clipboard.writeText.mockClear()
  })

  describe('UI Behavior', () => {
    it('should show crypto wallet as last payment option for Add', async () => {
      render(
        <BrowserRouter>
          <TransactionPage transactionType="add" />
        </BrowserRouter>
      )

      // Check for payment method options in order
      await waitFor(() => {
        const paymentMethods = screen.getAllByRole('radio')
        expect(paymentMethods[paymentMethods.length - 1]).toHaveTextContent('Crypto Wallet')
      })
    })

    it('should show wallet address selector when crypto wallet is selected', async () => {
      render(
        <BrowserRouter>
          <TransactionPage transactionType="add" />
        </BrowserRouter>
      )

      // Click on Crypto Wallet
      const cryptoWalletButton = await screen.findByText('Crypto Wallet')
      fireEvent.click(cryptoWalletButton)

      // Check for network selector
      await waitFor(() => {
        expect(screen.getByText('Select Network')).toBeInTheDocument()
        expect(screen.getByText('BTC')).toBeInTheDocument()
        expect(screen.getByText('ETH')).toBeInTheDocument()
        expect(screen.getByText('SOL')).toBeInTheDocument()
        expect(screen.getByText('SUI')).toBeInTheDocument()
      })
    })

    it('should hide amount input when crypto wallet is selected', async () => {
      render(
        <BrowserRouter>
          <TransactionPage transactionType="add" />
        </BrowserRouter>
      )

      // Initially amount input should be visible
      expect(screen.getByPlaceholderText(/enter amount/i)).toBeInTheDocument()

      // Click on Crypto Wallet
      const cryptoWalletButton = await screen.findByText('Crypto Wallet')
      fireEvent.click(cryptoWalletButton)

      // Amount input should be hidden
      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/enter amount/i)).not.toBeInTheDocument()
      })
    })

    it('should show deposit instructions in summary', async () => {
      render(
        <BrowserRouter>
          <TransactionPage transactionType="add" />
        </BrowserRouter>
      )

      // Click on Crypto Wallet
      const cryptoWalletButton = await screen.findByText('Crypto Wallet')
      fireEvent.click(cryptoWalletButton)

      // Check for instructions
      await waitFor(() => {
        expect(screen.getByText('How to deposit:')).toBeInTheDocument()
        expect(screen.getByText(/Select the network above/)).toBeInTheDocument()
        expect(screen.getByText(/Copy the wallet address/)).toBeInTheDocument()
        expect(screen.getByText(/Send supported assets from your wallet/)).toBeInTheDocument()
        expect(screen.getByText(/Funds will appear in 1-30 minutes/)).toBeInTheDocument()
      })
    })
  })

  describe('Wallet Address Display', () => {
    it('should display correct wallet address for selected network', () => {
      render(<WalletAddressDisplay />)

      // Default should be SOL
      expect(screen.getByText(/7VBUjZWV7rUPkUFN7XM7j/)).toBeInTheDocument()

      // Switch to BTC
      fireEvent.click(screen.getByText('BTC'))
      expect(screen.getByText(/1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa/)).toBeInTheDocument()

      // Switch to ETH
      fireEvent.click(screen.getByText('ETH'))
      expect(screen.getByText(/0x742d35Cc6634C0532925a3b844Bc9e7595f1234/)).toBeInTheDocument()

      // Switch to SUI
      fireEvent.click(screen.getByText('SUI'))
      expect(screen.getByText(/0x0000000000000000000000000000000000000000000000000000000000000001/)).toBeInTheDocument()
    })

    it('should copy wallet address to clipboard', async () => {
      render(<WalletAddressDisplay />)

      // Find and click copy button
      const copyButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('.lucide-copy')
      )
      fireEvent.click(copyButton)

      // Check clipboard was called with SOL address
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        '7VBUjZWV7rUPkUFN7XM7jUPkUFN7XM7jUPkUFN7XM7j'
      )
    })

    it('should show supported assets for each network', () => {
      render(<WalletAddressDisplay />)

      // Check BTC network
      fireEvent.click(screen.getByText('BTC'))
      expect(screen.getByText('BTC, USDT')).toBeInTheDocument()

      // Check ETH network
      fireEvent.click(screen.getByText('ETH'))
      expect(screen.getByText('ETH, USDC, USDT')).toBeInTheDocument()

      // Check SOL network
      fireEvent.click(screen.getByText('SOL'))
      expect(screen.getByText('SOL, USDC, USDT')).toBeInTheDocument()

      // Check SUI network
      fireEvent.click(screen.getByText('SUI'))
      expect(screen.getByText('SUI, USDC, USDT')).toBeInTheDocument()
    })

    it('should show warning about correct network usage', () => {
      render(<WalletAddressDisplay />)

      // Check for warning
      expect(screen.getByText(/Only send.*on.*network/)).toBeInTheDocument()
      expect(screen.getByText(/wrong network will result in permanent loss/)).toBeInTheDocument()
    })

    it('should toggle QR code display', () => {
      render(<WalletAddressDisplay />)

      // QR should not be visible initially
      expect(screen.queryByText('QR Code')).not.toBeInTheDocument()

      // Find and click QR button
      const qrButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('.lucide-qr-code')
      )
      fireEvent.click(qrButton)

      // QR should now be visible
      expect(screen.getByText('QR Code')).toBeInTheDocument()

      // Click again to hide
      fireEvent.click(qrButton)
      expect(screen.queryByText('QR Code')).not.toBeInTheDocument()
    })
  })

  describe('Fee Handling', () => {
    it('should show no fees for crypto wallet deposits', async () => {
      render(
        <BrowserRouter>
          <TransactionPage transactionType="add" />
        </BrowserRouter>
      )

      // Click on Crypto Wallet
      const cryptoWalletButton = await screen.findByText('Crypto Wallet')
      fireEvent.click(cryptoWalletButton)

      // Check for no fees message
      await waitFor(() => {
        expect(screen.getByText('No fees for on-chain deposits')).toBeInTheDocument()
        expect(screen.getByText('Only network gas fees apply')).toBeInTheDocument()
      })
    })

    it('should not calculate fees for crypto wallet add', async () => {
      const mockCalculateFees = vi.fn()
      const { useFeeCalculator } = await import('../hooks/useTransactions')
      useFeeCalculator.mockReturnValue({
        fees: { total: 0, network: 0, provider: 0 },
        calculateFees: mockCalculateFees
      })

      render(
        <BrowserRouter>
          <TransactionPage transactionType="add" />
        </BrowserRouter>
      )

      // Click on Crypto Wallet
      const cryptoWalletButton = await screen.findByText('Crypto Wallet')
      fireEvent.click(cryptoWalletButton)

      // Fees should not be calculated for crypto wallet
      await waitFor(() => {
        // Since there's no amount input, fees shouldn't be calculated
        expect(mockCalculateFees).not.toHaveBeenCalledWith(
          expect.objectContaining({
            paymentMethod: 'crypto_wallet'
          })
        )
      })
    })
  })

  describe('Network Selection', () => {
    it('should highlight selected network', () => {
      render(<WalletAddressDisplay />)

      // SOL should be selected by default
      const solButton = screen.getByRole('button', { name: /SOL.*USDC.*USDT/i })
      expect(solButton).toHaveClass('bg-primary', 'text-primary-foreground')

      // Click BTC
      const btcButton = screen.getByRole('button', { name: /BTC.*USDT/i })
      fireEvent.click(btcButton)

      // BTC should now be selected
      expect(btcButton).toHaveClass('bg-primary', 'text-primary-foreground')
      expect(solButton).not.toHaveClass('bg-primary')
    })

    it('should update wallet address when network changes', () => {
      render(<WalletAddressDisplay />)

      // Check SOL address
      expect(screen.getByText(/7VBUjZWV7rUPkUFN7XM7j/)).toBeInTheDocument()

      // Switch to ETH
      fireEvent.click(screen.getByText('ETH'))
      
      // SOL address should be gone, ETH address should appear
      expect(screen.queryByText(/7VBUjZWV7rUPkUFN7XM7j/)).not.toBeInTheDocument()
      expect(screen.getByText(/0x742d35Cc6634C0532925a3b844Bc9e7595f1234/)).toBeInTheDocument()
    })
  })

  describe('Visual Feedback', () => {
    it('should show check icon after copying address', async () => {
      render(<WalletAddressDisplay />)

      // Find copy button
      const copyButton = screen.getAllByRole('button').find(btn => 
        btn.querySelector('.lucide-copy')
      )
      
      // Initially should show copy icon
      expect(copyButton.querySelector('.lucide-copy')).toBeInTheDocument()
      expect(copyButton.querySelector('.lucide-check-circle')).not.toBeInTheDocument()

      // Click to copy
      fireEvent.click(copyButton)

      // Should now show check icon
      await waitFor(() => {
        expect(copyButton.querySelector('.lucide-copy')).not.toBeInTheDocument()
        expect(copyButton.querySelector('.lucide-check-circle')).toBeInTheDocument()
      })
    })

    it('should apply network-specific styling', () => {
      render(<WalletAddressDisplay />)

      // Check BTC styling
      fireEvent.click(screen.getByText('BTC'))
      const btcCard = screen.getByText('BTC Wallet Address').closest('.card')
      expect(btcCard).toHaveClass('border-orange-200')

      // Check ETH styling
      fireEvent.click(screen.getByText('ETH'))
      const ethCard = screen.getByText('ETH Wallet Address').closest('.card')
      expect(ethCard).toHaveClass('border-blue-200')

      // Check SOL styling
      fireEvent.click(screen.getByText('SOL'))
      const solCard = screen.getByText('SOL Wallet Address').closest('.card')
      expect(solCard).toHaveClass('border-purple-200')

      // Check SUI styling
      fireEvent.click(screen.getByText('SUI'))
      const suiCard = screen.getByText('SUI Wallet Address').closest('.card')
      expect(suiCard).toHaveClass('border-cyan-200')
    })
  })
})