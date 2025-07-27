/**
 * Merged Withdraw Transaction Tests
 * Tests the enhanced withdraw functionality that includes both bank and external wallet withdrawals
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import TransactionPage from '../components/TransactionPage'
import { useWalletBalance } from '../hooks/useTransactions'
import { TransactionEngine } from '../services/transactions/TransactionEngine'

// Mock the hooks
vi.mock('../hooks/useTransactions', () => ({
  useWalletBalance: vi.fn(),
  useFeeCalculator: vi.fn(() => ({
    fees: { total: 5, network: 2, provider: 3 },
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

describe('Merged Withdraw Transaction', () => {
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
  })

  describe('UI Behavior', () => {
    it('should show payment method options including external wallet for withdraw', async () => {
      render(
        <BrowserRouter>
          <TransactionPage transactionType="withdraw" />
        </BrowserRouter>
      )

      // Check for payment method options
      await waitFor(() => {
        expect(screen.getByText('Credit/Debit Card')).toBeInTheDocument()
        expect(screen.getByText('Bank Account')).toBeInTheDocument()
        expect(screen.getByText('External Wallet')).toBeInTheDocument()
      })
    })

    it('should show wallet address input when external wallet is selected', async () => {
      render(
        <BrowserRouter>
          <TransactionPage transactionType="withdraw" />
        </BrowserRouter>
      )

      // Click on External Wallet
      const externalWalletButton = await screen.findByText('External Wallet')
      fireEvent.click(externalWalletButton)

      // Check for wallet address input
      await waitFor(() => {
        expect(screen.getByText('To Wallet Address')).toBeInTheDocument()
        expect(screen.getByPlaceholderText(/enter.*wallet.*address/i)).toBeInTheDocument()
      })
    })

    it('should NOT show wallet address input for bank withdrawals', async () => {
      render(
        <BrowserRouter>
          <TransactionPage transactionType="withdraw" />
        </BrowserRouter>
      )

      // Click on Bank Account
      const bankAccountButton = await screen.findByText('Bank Account')
      fireEvent.click(bankAccountButton)

      // Check that wallet address input is NOT shown
      await waitFor(() => {
        expect(screen.queryByText('To Wallet Address')).not.toBeInTheDocument()
      })
    })

    it('should validate wallet address for external wallet withdrawal', async () => {
      render(
        <BrowserRouter>
          <TransactionPage transactionType="withdraw" />
        </BrowserRouter>
      )

      // Select External Wallet
      const externalWalletButton = await screen.findByText('External Wallet')
      fireEvent.click(externalWalletButton)

      // Enter amount
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      fireEvent.change(amountInput, { target: { value: '100' } })

      // Try to submit without address
      const submitButton = screen.getByText(/confirm.*withdraw/i)
      expect(submitButton).toBeDisabled()

      // Enter invalid address
      const addressInput = await screen.findByPlaceholderText(/enter.*wallet.*address/i)
      fireEvent.change(addressInput, { target: { value: 'invalid-address' } })

      // Button should still be disabled
      expect(submitButton).toBeDisabled()

      // Enter valid Solana address
      fireEvent.change(addressInput, { target: { value: '7VBUjZWV7rUPkUFN7XM7jUPkUFN7XM7jUPkUFN7XM7j' } })

      // Button should now be enabled
      await waitFor(() => {
        expect(submitButton).not.toBeDisabled()
      })
    })
  })

  describe('Fee Calculation', () => {
    it('should calculate network fees based on destination chain for external wallet', async () => {
      const mockCalculateFees = vi.fn()
      const { useFeeCalculator } = await import('../hooks/useTransactions')
      useFeeCalculator.mockReturnValue({
        fees: { total: 5, network: 0.001, provider: 0 },
        calculateFees: mockCalculateFees
      })

      render(
        <BrowserRouter>
          <TransactionPage transactionType="withdraw" />
        </BrowserRouter>
      )

      // Select External Wallet
      const externalWalletButton = await screen.findByText('External Wallet')
      fireEvent.click(externalWalletButton)

      // Enter amount and Solana address
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      fireEvent.change(amountInput, { target: { value: '100' } })

      const addressInput = await screen.findByPlaceholderText(/enter.*wallet.*address/i)
      fireEvent.change(addressInput, { target: { value: '7VBUjZWV7rUPkUFN7XM7jUPkUFN7XM7jUPkUFN7XM7j' } })

      // Check that fees were calculated with SOL network
      await waitFor(() => {
        expect(mockCalculateFees).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'withdraw',
            amount: 100,
            chains: ['SOL'],
            recipient: '7VBUjZWV7rUPkUFN7XM7jUPkUFN7XM7jUPkUFN7XM7j'
          })
        )
      })
    })

    it('should calculate cross-chain fees for BTC withdrawal', async () => {
      const mockCalculateFees = vi.fn()
      const { useFeeCalculator } = await import('../hooks/useTransactions')
      useFeeCalculator.mockReturnValue({
        fees: { total: 10, network: 9, provider: 0.8 },
        calculateFees: mockCalculateFees
      })

      render(
        <BrowserRouter>
          <TransactionPage transactionType="withdraw" />
        </BrowserRouter>
      )

      // Select External Wallet
      const externalWalletButton = await screen.findByText('External Wallet')
      fireEvent.click(externalWalletButton)

      // Enter amount and BTC address
      const amountInput = screen.getByPlaceholderText(/enter amount/i)
      fireEvent.change(amountInput, { target: { value: '100' } })

      const addressInput = await screen.findByPlaceholderText(/enter.*wallet.*address/i)
      fireEvent.change(addressInput, { target: { value: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' } })

      // Check that fees were calculated with BTC network
      await waitFor(() => {
        expect(mockCalculateFees).toHaveBeenCalledWith(
          expect.objectContaining({
            type: 'withdraw',
            amount: 100,
            chains: ['SOL', 'BTC'],
            recipient: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
          })
        )
      })
    })
  })

  describe('Transaction Processing', () => {
    it('should process external wallet withdrawal as transfer', async () => {
      const mockEngine = new TransactionEngine()
      const mockProcessExternalTransfer = vi.spyOn(mockEngine, 'processExternalTransfer')
      const mockProcessOffRamp = vi.spyOn(mockEngine, 'processOffRamp')

      // Test external wallet withdrawal
      await mockEngine.processTransaction('user123', {
        type: 'withdraw',
        amount: 100,
        paymentMethod: 'external_wallet',
        recipient: '7VBUjZWV7rUPkUFN7XM7jUPkUFN7XM7jUPkUFN7XM7j'
      })

      // Should use processExternalTransfer, not processOffRamp
      expect(mockProcessExternalTransfer).toHaveBeenCalled()
      expect(mockProcessOffRamp).not.toHaveBeenCalled()
    })

    it('should process bank withdrawal as off-ramp', async () => {
      const mockEngine = new TransactionEngine()
      const mockProcessExternalTransfer = vi.spyOn(mockEngine, 'processExternalTransfer')
      const mockProcessOffRamp = vi.spyOn(mockEngine, 'processOffRamp')

      // Test bank withdrawal
      await mockEngine.processTransaction('user123', {
        type: 'withdraw',
        amount: 100,
        paymentMethod: 'bank_account'
      })

      // Should use processOffRamp, not processExternalTransfer
      expect(mockProcessOffRamp).toHaveBeenCalled()
      expect(mockProcessExternalTransfer).not.toHaveBeenCalled()
    })
  })

  describe('Transaction Validation', () => {
    it('should validate external wallet withdrawal requires recipient', () => {
      const engine = new TransactionEngine()
      
      const result = engine.validateTransaction('user123', {
        type: 'withdraw',
        amount: 100,
        paymentMethod: 'external_wallet'
        // Missing recipient
      })

      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Wallet address is required')
    })

    it('should validate bank withdrawal does not require recipient', () => {
      const engine = new TransactionEngine()
      
      const result = engine.validateTransaction('user123', {
        type: 'withdraw',
        amount: 100,
        paymentMethod: 'bank_account'
        // No recipient needed
      })

      expect(result.isValid).toBe(true)
    })

    it('should validate wallet address format for external withdrawal', () => {
      const engine = new TransactionEngine()
      
      // Invalid address
      let result = engine.validateTransaction('user123', {
        type: 'withdraw',
        amount: 100,
        paymentMethod: 'external_wallet',
        recipient: 'invalid-address'
      })
      expect(result.isValid).toBe(false)
      expect(result.error).toContain('Invalid wallet address')

      // Valid Solana address
      result = engine.validateTransaction('user123', {
        type: 'withdraw',
        amount: 100,
        paymentMethod: 'external_wallet',
        recipient: '7VBUjZWV7rUPkUFN7XM7jUPkUFN7XM7jUPkUFN7XM7j'
      })
      expect(result.isValid).toBe(true)
    })
  })

  describe('Navigation Integration', () => {
    it('should not have transfer in transaction types', async () => {
      render(
        <BrowserRouter>
          <TransactionPage />
        </BrowserRouter>
      )

      // Check that all types are present except Transfer
      await waitFor(() => {
        expect(screen.getByText('Add')).toBeInTheDocument()
        expect(screen.getByText('Send')).toBeInTheDocument()
        expect(screen.getByText('Buy')).toBeInTheDocument()
        expect(screen.getByText('Sell')).toBeInTheDocument()
        expect(screen.getByText('Withdraw')).toBeInTheDocument()
        expect(screen.queryByText('Transfer')).not.toBeInTheDocument()
      })
    })

    it('should show updated withdraw description', async () => {
      render(
        <BrowserRouter>
          <TransactionPage transactionType="withdraw" />
        </BrowserRouter>
      )

      // Check for updated description
      await waitFor(() => {
        expect(screen.getByText('Withdraw funds to bank or external wallet')).toBeInTheDocument()
      })
    })
  })
})