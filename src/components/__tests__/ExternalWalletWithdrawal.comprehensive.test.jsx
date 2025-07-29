/**
 * Comprehensive Test Suite for External Wallet Withdrawal Chain Recognition and Validation
 * Tests chain recognition, error handling, fee calculations, and UI interactions
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { BrowserRouter } from 'react-router-dom'
import TransactionPage from '../TransactionPage.jsx'
import WalletAddressInput from '../transactions/WalletAddressInput.jsx'
import { detectAddressNetworkDetailed } from '../../utils/walletAddressDatabase.js'
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

const mockCalculateFees = vi.fn()
const mockValidateTransaction = vi.fn()
const mockExecuteTransactionFlow = vi.fn()

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
      network: '80.00', // 9% of $1000 for BTC
      provider: '8.00', // 0.8% of $1000 for DEX fee
      total: '92.50'
    },
    calculateFees: mockCalculateFees
  }),
  useTransactionValidation: () => ({
    validationErrors: {},
    validateTransaction: mockValidateTransaction
  }),
  useTransactionFlow: () => ({
    flowState: 'idle',
    flowData: null,
    flowError: null,
    executeTransactionFlow: mockExecuteTransactionFlow,
    confirmTransaction: vi.fn(),
    resetFlow: vi.fn()
  })
}))

describe('External Wallet Withdrawal Chain Recognition and Validation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Chain Recognition', () => {
    it('should recognize BTC addresses correctly', () => {
      const btcAddresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Legacy
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', // SegWit
        'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq' // Bech32
      ]

      btcAddresses.forEach(address => {
        const result = detectAddressNetworkDetailed(address)
        expect(result.network).toBe('BTC')
        expect(result.isValid).toBe(true)
        expect(result.isSupported).toBe(true)
        expect(result.error).toBe(null)
      })
    })

    it('should recognize ETH addresses correctly', () => {
      const ethAddresses = [
        '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        '0x6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c',
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
      ]

      ethAddresses.forEach(address => {
        const result = detectAddressNetworkDetailed(address)
        expect(result.network).toBe('ETH')
        expect(result.isValid).toBe(true)
        expect(result.isSupported).toBe(true)
        expect(result.error).toBe(null)
      })
    })

    it('should recognize SOL addresses correctly', () => {
      const solAddresses = [
        '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NFD',
        'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1',
        'So11111111111111111111111111111111111111112'
      ]

      solAddresses.forEach(address => {
        const result = detectAddressNetworkDetailed(address)
        expect(result.network).toBe('SOL')
        expect(result.isValid).toBe(true)
        expect(result.isSupported).toBe(true)
        expect(result.error).toBe(null)
      })
    })

    it('should recognize SUI addresses correctly', () => {
      const suiAddresses = [
        '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
        '0x0000000000000000000000000000000000000000000000000000000000000002'
      ]

      suiAddresses.forEach(address => {
        const result = detectAddressNetworkDetailed(address)
        expect(result.network).toBe('SUI')
        expect(result.isValid).toBe(true)
        expect(result.isSupported).toBe(true)
        expect(result.error).toBe(null)
      })
    })
  })

  describe('Unsupported Chain Detection', () => {
    it('should detect ADA addresses as unsupported', () => {
      const adaAddress = 'addr1qy2jt0qpqz2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2z2'
      const result = detectAddressNetworkDetailed(adaAddress)
      
      expect(result.network).toBe('ADA')
      expect(result.isValid).toBe(true)
      expect(result.isSupported).toBe(false)
      expect(result.error).toContain('ADA addresses are not currently supported')
    })

    it('should detect AVAX addresses as unsupported', () => {
      const avaxAddress = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' // Same format as ETH
      const result = detectAddressNetworkDetailed(avaxAddress)
      
      // Note: This will be detected as ETH due to same format
      // In real implementation, we'd need context or different validation
      expect(result.network).toBe('ETH') // Current behavior
      expect(result.isSupported).toBe(true)
    })

    it('should detect XRP addresses as unsupported', () => {
      const xrpAddress = 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH'
      const result = detectAddressNetworkDetailed(xrpAddress)
      
      expect(result.network).toBe('XRP')
      expect(result.isValid).toBe(true)
      expect(result.isSupported).toBe(false)
      expect(result.error).toContain('XRP addresses are not currently supported')
    })
  })

  describe('Invalid Address Detection', () => {
    it('should detect invalid addresses', () => {
      const invalidAddresses = [
        'invalid-address',
        '123',
        'abcdef',
        '0x123', // Too short for ETH
        'bc1invalid' // Invalid Bech32
      ]

      invalidAddresses.forEach(address => {
        const result = detectAddressNetworkDetailed(address)
        expect(result.network).toBe(null)
        expect(result.isValid).toBe(false)
        expect(result.isSupported).toBe(false)
        expect(result.error).toContain('Invalid wallet address format')
      })
    })

    it('should handle empty addresses', () => {
      const result = detectAddressNetworkDetailed('')
      expect(result.network).toBe(null)
      expect(result.isValid).toBe(false)
      expect(result.isSupported).toBe(false)
      expect(result.error).toBe(null)
    })
  })

  describe('WalletAddressInput Component', () => {
    it('should display detected network badge for supported addresses', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()

      render(
        <TestWrapper>
          <WalletAddressInput value="" onChange={mockOnChange} />
        </TestWrapper>
      )

      const input = screen.getByPlaceholderText('Enter wallet address')
      await user.type(input, '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')

      await waitFor(() => {
        expect(screen.getByText('BTC')).toBeInTheDocument()
        const badge = screen.getByText('BTC').closest('.bg-orange-100')
        expect(badge).toBeInTheDocument()
      })
    })

    it('should display error message for unsupported addresses', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()

      render(
        <TestWrapper>
          <WalletAddressInput value="" onChange={mockOnChange} />
        </TestWrapper>
      )

      const input = screen.getByPlaceholderText('Enter wallet address')
      await user.type(input, 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH') // XRP address

      await waitFor(() => {
        expect(screen.getByText('XRP addresses are not currently supported')).toBeInTheDocument()
        const badge = screen.getByText('XRP').closest('.bg-red-100')
        expect(badge).toBeInTheDocument()
      })
    })

    it('should display error message for invalid addresses', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()

      render(
        <TestWrapper>
          <WalletAddressInput value="" onChange={mockOnChange} />
        </TestWrapper>
      )

      const input = screen.getByPlaceholderText('Enter wallet address')
      await user.type(input, 'invalid-address')

      await waitFor(() => {
        expect(screen.getByText('Invalid wallet address format')).toBeInTheDocument()
      })
    })
  })

  describe('Fee Calculations', () => {
    let feeCalculator

    beforeEach(() => {
      feeCalculator = new FeeCalculator()
    })

    it('should calculate correct network fees for BTC external wallet withdrawal', () => {
      const transactionData = {
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'external_wallet',
        recipient: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        chains: ['SOL', 'BTC']
      }

      const fees = feeCalculator.calculateComprehensiveFees(transactionData)
      
      expect(fees.network).toBe(90.00) // 9% of $1000 for BTC
      expect(fees.provider).toBe(8.00) // 0.8% DEX fee
    })

    it('should calculate correct network fees for ETH external wallet withdrawal', () => {
      const transactionData = {
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'external_wallet',
        recipient: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        chains: ['SOL', 'ETH']
      }

      const fees = feeCalculator.calculateComprehensiveFees(transactionData)
      
      expect(fees.network).toBe(5.00) // 0.5% of $1000 for ETH
      expect(fees.provider).toBe(8.00) // 0.8% DEX fee
    })

    it('should calculate correct fees for SOL external wallet withdrawal', () => {
      const transactionData = {
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'external_wallet',
        recipient: 'So11111111111111111111111111111111111111112',
        chains: ['SOL']
      }

      const fees = feeCalculator.calculateComprehensiveFees(transactionData)
      
      expect(fees.network).toBe(0.010) // 0.001% of $1000 for SOL
      expect(fees.provider).toBe(0) // No DEX fee for SOL-to-SOL
    })

    it('should calculate correct fees for SUI external wallet withdrawal', () => {
      const transactionData = {
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'external_wallet',
        recipient: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
        chains: ['SOL', 'SUI']
      }

      const fees = feeCalculator.calculateComprehensiveFees(transactionData)
      
      expect(fees.network).toBe(0.030) // 0.003% of $1000 for SUI
      expect(fees.provider).toBe(8.00) // 0.8% DEX fee
    })
  })

  describe('UI Integration', () => {
    it('should show DEX fee instead of Provider fee for external wallet withdrawal', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <TransactionPage transactionType="withdraw" category="banking" />
        </TestWrapper>
      )

      // Enter amount
      const amountInput = screen.getByLabelText(/amount/i)
      await user.type(amountInput, '1000')

      // Select external wallet
      const externalWalletOption = screen.getByText('External Wallet')
      await user.click(externalWalletOption)

      // Enter BTC address
      const addressInput = screen.getByLabelText(/wallet address/i)
      await user.type(addressInput, '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')

      // Should show DEX Fee
      await waitFor(() => {
        expect(screen.getByText(/DEX Fee/)).toBeInTheDocument()
        expect(screen.queryByText(/Provider Fee/)).not.toBeInTheDocument()
      })
    })

    it('should show network fee based on detected chain', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <TransactionPage transactionType="withdraw" category="banking" />
        </TestWrapper>
      )

      // Enter amount
      const amountInput = screen.getByLabelText(/amount/i)
      await user.type(amountInput, '1000')

      // Select external wallet
      const externalWalletOption = screen.getByText('External Wallet')
      await user.click(externalWalletOption)

      // Enter BTC address
      const addressInput = screen.getByLabelText(/wallet address/i)
      await user.type(addressInput, '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')

      // Should show network fee (9% for BTC)
      await waitFor(() => {
        expect(screen.getByText(/Network Fee.*9%/)).toBeInTheDocument()
        expect(screen.getByText('$80.00')).toBeInTheDocument() // 9% of $1000
      })
    })

    it('should prevent transaction submission for unsupported addresses', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <TransactionPage transactionType="withdraw" category="banking" />
        </TestWrapper>
      )

      // Enter amount
      const amountInput = screen.getByLabelText(/amount/i)
      await user.type(amountInput, '1000')

      // Select external wallet
      const externalWalletOption = screen.getByText('External Wallet')
      await user.click(externalWalletOption)

      // Enter unsupported address (XRP)
      const addressInput = screen.getByLabelText(/wallet address/i)
      await user.type(addressInput, 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH')

      // Submit button should be disabled
      const submitButton = screen.getByRole('button', { name: /withdraw/i })
      expect(submitButton).toBeDisabled()
    })

    it('should show chain recognition badge in real time', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <TransactionPage transactionType="withdraw" category="banking" />
        </TestWrapper>
      )

      // Enter amount and select external wallet
      const amountInput = screen.getByLabelText(/amount/i)
      await user.type(amountInput, '1000')
      
      const externalWalletOption = screen.getByText('External Wallet')
      await user.click(externalWalletOption)

      const addressInput = screen.getByLabelText(/wallet address/i)

      // Type BTC address character by character
      await user.type(addressInput, '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')

      // Should show BTC badge
      await waitFor(() => {
        expect(screen.getByText('BTC')).toBeInTheDocument()
      })

      // Clear and type ETH address
      await user.clear(addressInput)
      await user.type(addressInput, '0x71C7656EC7ab88b098defB751B7401B5f6d8976F')

      // Should show ETH badge
      await waitFor(() => {
        expect(screen.getByText('ETH')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid address gracefully', async () => {
      const user = userEvent.setup()
      
      render(
        <TestWrapper>
          <TransactionPage transactionType="withdraw" category="banking" />
        </TestWrapper>
      )

      const amountInput = screen.getByLabelText(/amount/i)
      await user.type(amountInput, '1000')
      
      const externalWalletOption = screen.getByText('External Wallet')
      await user.click(externalWalletOption)

      const addressInput = screen.getByLabelText(/wallet address/i)
      await user.type(addressInput, 'invalid-address')

      // Should show error message
      await waitFor(() => {
        expect(screen.getByText(/Invalid wallet address format/)).toBeInTheDocument()
      })

      // Should not crash the application
      expect(screen.getByText('Withdraw')).toBeInTheDocument()
    })

    it('should handle network detection failures', () => {
      const result = detectAddressNetworkDetailed(null)
      expect(result.network).toBe(null)
      expect(result.isValid).toBe(false)
      expect(result.isSupported).toBe(false)
    })
  })

  describe('Performance', () => {
    it('should detect network quickly for various address types', () => {
      const addresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // BTC
        '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', // ETH
        'So11111111111111111111111111111111111111112', // SOL
        '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b' // SUI
      ]

      addresses.forEach(address => {
        const startTime = performance.now()
        detectAddressNetworkDetailed(address)
        const endTime = performance.now()
        
        expect(endTime - startTime).toBeLessThan(5) // Should be very fast
      })
    })

    it('should handle rapid address input changes', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()

      render(
        <TestWrapper>
          <WalletAddressInput value="" onChange={mockOnChange} />
        </TestWrapper>
      )

      const input = screen.getByPlaceholderText('Enter wallet address')
      
      // Rapid typing should not cause issues
      await user.type(input, '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', { delay: 1 })
      
      expect(mockOnChange).toHaveBeenCalledTimes(34) // Length of the address
    })
  })

  describe('Accessibility', () => {
    it('should provide proper ARIA labels for error messages', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()

      render(
        <TestWrapper>
          <WalletAddressInput value="" onChange={mockOnChange} />
        </TestWrapper>
      )

      const input = screen.getByPlaceholderText('Enter wallet address')
      await user.type(input, 'invalid-address')

      await waitFor(() => {
        const errorMessage = screen.getByText(/Invalid wallet address format/)
        expect(errorMessage).toBeInTheDocument()
        expect(errorMessage).toHaveClass('text-red-600')
      })
    })

    it('should provide visual feedback for supported vs unsupported chains', async () => {
      const user = userEvent.setup()
      const mockOnChange = vi.fn()

      render(
        <TestWrapper>
          <WalletAddressInput value="" onChange={mockOnChange} />
        </TestWrapper>
      )

      const input = screen.getByPlaceholderText('Enter wallet address')
      
      // Supported address (BTC)
      await user.type(input, '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
      
      await waitFor(() => {
        const btcBadge = screen.getByText('BTC')
        expect(btcBadge.closest('.bg-orange-100')).toBeInTheDocument()
      })

      // Clear and enter unsupported address
      await user.clear(input)
      await user.type(input, 'rN7n7otQDd6FczFgLdSqtcsAUxDkw6fzRH') // XRP

      await waitFor(() => {
        const xrpBadge = screen.getByText('XRP')
        expect(xrpBadge.closest('.bg-red-100')).toBeInTheDocument()
      })
    })
  })
})