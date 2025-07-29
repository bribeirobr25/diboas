/**
 * Test Suite for Withdraw to External Wallet DEX Fee Bug Fix
 * Tests that external wallet withdrawals show DEX fee instead of Provider fee
 * and that the fee amount is calculated correctly (0.8% for non-SOL addresses)
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import TransactionPage from '../TransactionPage.jsx'
import { FeeCalculator } from '../../utils/feeCalculations.js'

const TestWrapper = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
)

// Mock dependencies
vi.mock('../../services/DataManager.js', () => ({
  dataManager: {
    getBalance: vi.fn(() => ({
      totalUSD: 5000.00,
      availableForSpending: 2500.00,
      investedAmount: 2500.00,
      assets: {}
    })),
    subscribe: vi.fn(() => () => {}),
    updateBalance: vi.fn(),
    getState: vi.fn(() => ({
      balance: {
        totalUSD: 5000.00,
        availableForSpending: 2500.00,
        investedAmount: 2500.00
      }
    }))
  }
}))

vi.mock('../../utils/userSettings.js', () => ({
  useUserSettings: () => ({
    settings: {},
    advancedMode: false
  })
}))

vi.mock('../../hooks/transactions/index.js', () => ({
  useWalletBalance: () => ({
    balance: {
      totalUSD: 5000.00,
      availableForSpending: 2500.00,
      investedAmount: 2500.00
    }
  }),
  useFeeCalculator: () => ({
    fees: {
      diBoaS: '4.50',
      network: '0.05',
      provider: '8.00', // 0.8% of $1000
      total: '12.55'
    },
    calculateFees: vi.fn()
  }),
  useTransactionValidation: () => ({
    validationErrors: {},
    validateTransaction: vi.fn()
  }),
  useTransactionFlow: () => ({
    flowState: 'idle',
    flowData: null,
    flowError: null,
    executeTransactionFlow: vi.fn(),
    confirmTransaction: vi.fn(),
    resetFlow: vi.fn()
  })
}))

describe('Withdraw to External Wallet DEX Fee Bug Fix', () => {
  let feeCalculator

  beforeEach(() => {
    feeCalculator = new FeeCalculator()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Fee Calculation Logic', () => {
    it('should calculate 0.8% DEX fee for BTC external wallet withdrawal', () => {
      const transactionData = {
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'external_wallet',
        recipient: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // BTC address
        chains: ['SOL']
      }

      const fees = feeCalculator.calculateComprehensiveFees(transactionData)
      
      expect(fees.provider).toBe(8.00) // 0.8% of $1000
      expect(fees.total).toBeGreaterThan(8.00)
    })

    it('should calculate 0.8% DEX fee for ETH external wallet withdrawal', () => {
      const transactionData = {
        type: 'withdraw',
        amount: 500,
        paymentMethod: 'external_wallet',
        recipient: '0x742d35Cc6bC8E5C5b2D4B8c4e2d1F2a6F8e9B3D7', // ETH address
        chains: ['SOL']
      }

      const fees = feeCalculator.calculateComprehensiveFees(transactionData)
      
      expect(fees.provider).toBe(4.00) // 0.8% of $500
    })

    it('should calculate 0.8% DEX fee for SUI external wallet withdrawal', () => {
      const transactionData = {
        type: 'withdraw',
        amount: 750,
        paymentMethod: 'external_wallet',
        recipient: '0x742d35Cc6bC8E5C5b2D4B8c4e2d1F2a6F8e9B3D7F8e2B4c6A8d1E3F5G7H9I2J4', // SUI address
        chains: ['SOL']
      }

      const fees = feeCalculator.calculateComprehensiveFees(transactionData)
      
      expect(fees.provider).toBe(6.00) // 0.8% of $750
    })

    it('should calculate 0% DEX fee for SOL external wallet withdrawal', () => {
      const transactionData = {
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'external_wallet',
        recipient: 'So11111111111111111111111111111111111111112', // SOL address
        chains: ['SOL']
      }

      const fees = feeCalculator.calculateComprehensiveFees(transactionData)
      
      expect(fees.provider).toBe(0) // No DEX fee for SOL-to-SOL
    })

    it('should calculate traditional provider fee for bank account withdrawal', () => {
      const transactionData = {
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'bank_account',
        chains: ['SOL']
      }

      const fees = feeCalculator.calculateComprehensiveFees(transactionData)
      
      expect(fees.provider).toBe(20.00) // 2% of $1000 (bank_account offramp fee)
    })

    it('should handle invalid external wallet address gracefully', () => {
      const transactionData = {
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'external_wallet',
        recipient: 'invalid-address',
        chains: ['SOL']
      }

      const fees = feeCalculator.calculateComprehensiveFees(transactionData)
      
      expect(fees.provider).toBe(0) // No fee for invalid address
    })
  })

  describe('UI Display', () => {
    it('should show "DEX Fee" label for external wallet withdrawal', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <TransactionPage transactionType="withdraw" category="banking" />
        </TestWrapper>
      )

      // Enter amount
      const amountInput = screen.getByLabelText(/amount/i)
      await user.type(amountInput, '1000')

      // Select external wallet payment method
      const externalWalletOption = screen.getByText('External Wallet')
      await user.click(externalWalletOption)

      // Enter BTC address
      const addressInput = screen.getByLabelText(/wallet address/i)
      await user.type(addressInput, '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')

      // Should show DEX Fee instead of Provider Fee
      expect(screen.getByText(/DEX Fee/)).toBeInTheDocument()
      expect(screen.queryByText(/Provider Fee/)).not.toBeInTheDocument()
    })

    it('should show "Provider Fee" label for traditional payment method withdrawal', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <TransactionPage transactionType="withdraw" category="banking" />
        </TestWrapper>
      )

      // Enter amount
      const amountInput = screen.getByLabelText(/amount/i)
      await user.type(amountInput, '1000')

      // Select bank account payment method
      const bankAccountOption = screen.getByText('Bank Account')
      await user.click(bankAccountOption)

      // Should show Provider Fee instead of DEX Fee
      expect(screen.getByText(/Provider Fee/)).toBeInTheDocument()
      expect(screen.queryByText(/DEX Fee/)).not.toBeInTheDocument()
    })

    it('should display correct fee amount for external wallet withdrawal', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <TransactionPage transactionType="withdraw" category="banking" />
        </TestWrapper>
      )

      // Enter amount
      const amountInput = screen.getByLabelText(/amount/i)
      await user.type(amountInput, '1000')

      // Select external wallet payment method
      const externalWalletOption = screen.getByText('External Wallet')
      await user.click(externalWalletOption)

      // Enter BTC address
      const addressInput = screen.getByLabelText(/wallet address/i)
      await user.type(addressInput, '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')

      // Wait for fee calculation
      await waitFor(() => {
        expect(screen.getByText('$8.00')).toBeInTheDocument() // 0.8% of $1000
      })
    })

    it('should update fee when wallet address network changes', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <TransactionPage transactionType="withdraw" category="banking" />
        </TestWrapper>
      )

      // Enter amount
      const amountInput = screen.getByLabelText(/amount/i)
      await user.type(amountInput, '1000')

      // Select external wallet payment method
      const externalWalletOption = screen.getByText('External Wallet')
      await user.click(externalWalletOption)

      // Enter BTC address first
      const addressInput = screen.getByLabelText(/wallet address/i)
      await user.type(addressInput, '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')

      // Should show 0.8% DEX fee
      await waitFor(() => {
        expect(screen.getByText('$8.00')).toBeInTheDocument()
      })

      // Clear and enter SOL address
      await user.clear(addressInput)
      await user.type(addressInput, 'So11111111111111111111111111111111111111112')

      // Should show $0.00 (no DEX fee for SOL)
      await waitFor(() => {
        expect(screen.getByText('$0.00')).toBeInTheDocument()
      })
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty address gracefully', () => {
      const transactionData = {
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'external_wallet',
        recipient: '',
        chains: ['SOL']
      }

      const fees = feeCalculator.calculateComprehensiveFees(transactionData)
      
      expect(fees.provider).toBe(0) // No fee for empty address
    })

    it('should handle very small amounts correctly', () => {
      const transactionData = {
        type: 'withdraw',
        amount: 0.01,
        paymentMethod: 'external_wallet',
        recipient: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        chains: ['SOL']
      }

      const fees = feeCalculator.calculateComprehensiveFees(transactionData)
      
      expect(fees.provider).toBe(0.00008) // 0.8% of $0.01
    })

    it('should handle large amounts correctly', () => {
      const transactionData = {
        type: 'withdraw',
        amount: 100000,
        paymentMethod: 'external_wallet',
        recipient: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        chains: ['SOL']
      }

      const fees = feeCalculator.calculateComprehensiveFees(transactionData)
      
      expect(fees.provider).toBe(800.00) // 0.8% of $100,000
    })

    it('should handle whitespace in address', () => {
      const transactionData = {
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'external_wallet',
        recipient: ' 1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa ',
        chains: ['SOL']
      }

      const fees = feeCalculator.calculateComprehensiveFees(transactionData)
      
      expect(fees.provider).toBe(8.00) // Should trim and calculate correctly
    })
  })

  describe('Integration with Transaction Flow', () => {
    it('should pass correct fee data to transaction flow', async () => {
      const user = userEvent.setup()
      const mockExecuteTransactionFlow = vi.fn()
      
      // Mock the transaction flow hook to capture the call
      vi.mocked(require('../../hooks/transactions/index.js').useTransactionFlow).mockReturnValue({
        flowState: 'idle',
        flowData: null,
        flowError: null,
        executeTransactionFlow: mockExecuteTransactionFlow,
        confirmTransaction: vi.fn(),
        resetFlow: vi.fn()
      })
      
      render(
        <TestWrapper>
          <TransactionPage transactionType="withdraw" category="banking" />
        </TestWrapper>
      )

      // Fill out the form
      const amountInput = screen.getByLabelText(/amount/i)
      await user.type(amountInput, '1000')

      const externalWalletOption = screen.getByText('External Wallet')
      await user.click(externalWalletOption)

      const addressInput = screen.getByLabelText(/wallet address/i)
      await user.type(addressInput, '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')

      // Submit the transaction
      const submitButton = screen.getByRole('button', { name: /withdraw/i })
      await user.click(submitButton)

      // Verify the transaction flow was called with correct data
      expect(mockExecuteTransactionFlow).toHaveBeenCalledWith({
        type: 'withdraw',
        amount: 1000,
        recipient: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        asset: 'USD',
        paymentMethod: 'external_wallet'
      })
    })
  })

  describe('Network Detection', () => {
    it('should correctly detect BTC addresses', () => {
      const btcAddresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Legacy P2PKH
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', // P2SH
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4' // Bech32
      ]

      btcAddresses.forEach(address => {
        const transactionData = {
          type: 'withdraw',
          amount: 1000,
          paymentMethod: 'external_wallet',
          recipient: address,
          chains: ['SOL']
        }

        const fees = feeCalculator.calculateComprehensiveFees(transactionData)
        expect(fees.provider).toBe(8.00) // 0.8% DEX fee
      })
    })

    it('should correctly detect ETH addresses', () => {
      const ethAddresses = [
        '0x742d35Cc6bC8E5C5b2D4B8c4e2d1F2a6F8e9B3D7',
        '0xdAC17F958D2ee523a2206206994597C13D831ec7',
        '0xA0b86a33E6441E59be4C8f2a6b66e5F3E1A17a10'
      ]

      ethAddresses.forEach(address => {
        const transactionData = {
          type: 'withdraw',
          amount: 1000,
          paymentMethod: 'external_wallet',
          recipient: address,
          chains: ['SOL']
        }

        const fees = feeCalculator.calculateComprehensiveFees(transactionData)
        expect(fees.provider).toBe(8.00) // 0.8% DEX fee
      })
    })

    it('should correctly detect SOL addresses', () => {
      const solAddresses = [
        'So11111111111111111111111111111111111111112',
        '11111111111111111111111111111112',
        'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1'
      ]

      solAddresses.forEach(address => {
        const transactionData = {
          type: 'withdraw',
          amount: 1000,
          paymentMethod: 'external_wallet',
          recipient: address,
          chains: ['SOL']
        }

        const fees = feeCalculator.calculateComprehensiveFees(transactionData)
        expect(fees.provider).toBe(0) // No DEX fee for SOL-to-SOL
      })
    })

    it('should correctly detect SUI addresses', () => {
      const suiAddresses = [
        '0x742d35Cc6bC8E5C5b2D4B8c4e2d1F2a6F8e9B3D7F8e2B4c6A8d1E3F5G7H9I2J4',
        '0x1234567890123456789012345678901234567890123456789012345678901234'
      ]

      suiAddresses.forEach(address => {
        const transactionData = {
          type: 'withdraw',
          amount: 1000,
          paymentMethod: 'external_wallet',
          recipient: address,
          chains: ['SOL']
        }

        const fees = feeCalculator.calculateComprehensiveFees(transactionData)
        expect(fees.provider).toBe(8.00) // 0.8% DEX fee
      })
    })
  })

  describe('Regression Tests', () => {
    it('should not break traditional payment method fee calculations', () => {
      const paymentMethods = ['bank_account', 'credit_debit_card', 'apple_pay', 'paypal']
      const expectedRates = [0.02, 0.02, 0.01, 0.04] // Off-ramp rates

      paymentMethods.forEach((method, index) => {
        const transactionData = {
          type: 'withdraw',
          amount: 1000,
          paymentMethod: method,
          chains: ['SOL']
        }

        const fees = feeCalculator.calculateComprehensiveFees(transactionData)
        expect(fees.provider).toBe(1000 * expectedRates[index])
      })
    })

    it('should not affect other transaction types', () => {
      const transactionTypes = ['add', 'send', 'transfer', 'buy', 'sell']
      
      transactionTypes.forEach(type => {
        const transactionData = {
          type,
          amount: 1000,
          paymentMethod: type === 'buy' ? 'credit_debit_card' : 'bank_account',
          chains: ['SOL']
        }

        // Should not throw an error
        expect(() => {
          feeCalculator.calculateComprehensiveFees(transactionData)
        }).not.toThrow()
      })
    })
  })
})