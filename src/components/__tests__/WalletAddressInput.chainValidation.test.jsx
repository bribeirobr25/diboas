import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import WalletAddressInput from '../transactions/WalletAddressInput.jsx'

// Mock the wallet address database
vi.mock('../../utils/walletAddressDatabase.js', () => ({
  detectAddressNetworkDetailed: vi.fn(),
  searchWalletAddresses: vi.fn(),
  getRecentWalletAddresses: vi.fn(() => []),
  saveRecentWalletAddress: vi.fn(),
  getNetworkAddresses: vi.fn(() => [])
}))

import { detectAddressNetworkDetailed, searchWalletAddresses } from '../../utils/walletAddressDatabase.js'

describe('WalletAddressInput - Enhanced Chain Validation', () => {
  const defaultProps = {
    value: '',
    onChange: vi.fn(),
    validationErrors: {}
  }

  let user

  beforeEach(() => {
    vi.clearAllMocks()
    user = userEvent.setup()
    
    // Default mock for address search
    searchWalletAddresses.mockResolvedValue([])
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Supported Chain Validation', () => {
    const supportedChains = [
      {
        network: 'BTC',
        address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        label: 'Bitcoin Legacy'
      },
      {
        network: 'BTC', 
        address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',
        label: 'Bitcoin Bech32'
      },
      {
        network: 'ETH',
        address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        label: 'Ethereum'
      },
      {
        network: 'SOL',
        address: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NFD',
        label: 'Solana'
      },
      {
        network: 'SUI',
        address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
        label: 'Sui'
      }
    ]

    supportedChains.forEach(({ network, address, label }) => {
      it(`should accept valid ${label} address`, async () => {
        detectAddressNetworkDetailed.mockReturnValue({
          network,
          isValid: true,
          isSupported: true,
          error: null
        })

        render(<WalletAddressInput {...defaultProps} />)
        
        const input = screen.getByPlaceholderText(/Enter wallet address/)
        await user.type(input, address)
        
        // Should not show error message
        await waitFor(() => {
          expect(screen.queryByText(/not supported/)).not.toBeInTheDocument()
          expect(screen.queryByText(/Invalid/)).not.toBeInTheDocument()
        })
        
        // Should call onChange with the address
        expect(defaultProps.onChange).toHaveBeenCalledWith(address)
      })
    })
  })

  describe('Unsupported Chain Detection', () => {
    const unsupportedChains = [
      {
        network: 'TRON',
        address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        errorMessage: 'TRON addresses are not currently supported'
      },
      {
        network: 'BNB',
        address: 'bnb1grpf0955h0ykzusd59pqe4ug98yhap8r8ej6r2',
        errorMessage: 'BNB addresses are not currently supported'
      },
      {
        network: 'XRP',
        address: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh',
        errorMessage: 'XRP addresses are not currently supported'
      },
      {
        network: 'ADA',
        address: 'addr1qx2v9xvqx2v9xvqx2v9xvqx2v9xvqx2v9xvqx2v9xvqx2v9xvqx2v9xvqx2v9xvqx2v9xvqx2v9',
        errorMessage: 'ADA addresses are not currently supported'
      },
      {
        network: 'AVAX',
        address: 'X-avax1x2v9xvqx2v9xvqx2v9xvqx2v9xvqx2v9xvqx2v9xvqx2v9',
        errorMessage: 'AVAX addresses are not currently supported'
      },
      {
        network: 'DOT',
        address: '1FRMM8PEiWXYax7rpS6X4XZX1aAAxSWx1CrKTyrVYhV24fg',
        errorMessage: 'DOT addresses are not currently supported'
      },
      {
        network: 'NEAR',
        address: 'alice.near',
        errorMessage: 'NEAR addresses are not currently supported'
      },
      {
        network: 'ALGO',
        address: 'MFRGG424XAIBHHQ6AAOSZBXKZMQJVBCNLWQ4CGNUBKYEZQRZJP6AYE3DMEYC8LZ',
        errorMessage: 'ALGO addresses are not currently supported'
      }
    ]

    unsupportedChains.forEach(({ network, address, errorMessage }) => {
      it(`should reject ${network} address with helpful error`, async () => {
        detectAddressNetworkDetailed.mockReturnValue({
          network,
          isValid: true,
          isSupported: false,
          error: `${errorMessage}. Please use BTC, ETH, SOL, or SUI addresses.`
        })

        render(<WalletAddressInput {...defaultProps} />)
        
        const input = screen.getByPlaceholderText(/Enter wallet address/)
        await user.type(input, address)
        
        // Should show error message
        await waitFor(() => {
          expect(screen.getByText(new RegExp(errorMessage))).toBeInTheDocument()
          expect(screen.getByText(/Please use BTC, ETH, SOL, or SUI/)).toBeInTheDocument()
        })
        
        // Should still call onChange (let parent handle validation)
        expect(defaultProps.onChange).toHaveBeenCalledWith(address)
      })
    })
  })

  describe('Invalid Address Handling', () => {
    const invalidAddresses = [
      { address: '', description: 'empty string' },
      { address: 'invalid', description: 'random string' },
      { address: '123', description: 'too short' },
      { address: '0x', description: 'incomplete hex' },
      { address: 'bc1', description: 'incomplete bech32' },
      { address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976G', description: 'invalid hex character' }
    ]

    invalidAddresses.forEach(({ address, description }) => {
      it(`should handle ${description} gracefully`, async () => {
        detectAddressNetworkDetailed.mockReturnValue({
          network: null,
          isValid: false,
          isSupported: false,
          error: 'Invalid wallet address format. Please enter a valid BTC, ETH, SOL, or SUI address.'
        })

        render(<WalletAddressInput {...defaultProps} />)
        
        const input = screen.getByPlaceholderText(/Enter wallet address/)
        if (address) {
          await user.type(input, address)
        }
        
        if (address && address !== '') {
          // Should show error for non-empty invalid addresses
          await waitFor(() => {
            expect(screen.getByText(/Invalid wallet address format/)).toBeInTheDocument()
          })
        }
        
        // Should call onChange regardless
        if (address) {
          expect(defaultProps.onChange).toHaveBeenCalledWith(address)
        }
      })
    })
  })

  describe('Real-time Validation Feedback', () => {
    it('should provide immediate feedback as user types', async () => {
      const partialTronAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8'
      
      detectAddressNetworkDetailed.mockReturnValue({
        network: null,
        isValid: false,
        isSupported: false,
        error: 'Invalid wallet address format. Please enter a valid BTC, ETH, SOL, or SUI address.'
      })

      render(<WalletAddressInput {...defaultProps} />)
      
      const input = screen.getByPlaceholderText(/Enter wallet address/)
      
      // Type partial address
      await user.type(input, partialTronAddress)
      
      // Should validate on each keystroke
      expect(detectAddressNetworkDetailed).toHaveBeenCalled()
    })

    it('should clear validation errors when address becomes valid', async () => {
      const validBTCAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      
      // First, mock invalid address
      detectAddressNetworkDetailed.mockReturnValue({
        network: null,
        isValid: false,
        isSupported: false,
        error: 'Invalid wallet address format'
      })

      render(<WalletAddressInput {...defaultProps} />)
      
      const input = screen.getByPlaceholderText(/Enter wallet address/)
      
      // Type invalid address first
      await user.type(input, 'invalid')
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid wallet address format/)).toBeInTheDocument()
      })
      
      // Clear and type valid address
      await user.clear(input)
      
      // Mock valid address
      detectAddressNetworkDetailed.mockReturnValue({
        network: 'BTC',
        isValid: true,
        isSupported: true,
        error: null
      })
      
      await user.type(input, validBTCAddress)
      
      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/Invalid wallet address format/)).not.toBeInTheDocument()
      })
    })
  })

  describe('Network Detection Display', () => {
    it('should show detected network for valid addresses', async () => {
      const btcAddress = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
      
      detectAddressNetworkDetailed.mockReturnValue({
        network: 'BTC',
        isValid: true,
        isSupported: true,
        error: null
      })

      render(<WalletAddressInput {...defaultProps} />)
      
      const input = screen.getByPlaceholderText(/Enter wallet address/)
      await user.type(input, btcAddress)
      
      // Should show network badge or indicator
      await waitFor(() => {
        expect(screen.getByText(/BTC/)).toBeInTheDocument()
      })
    })

    it('should show warning badge for unsupported networks', async () => {
      const tronAddress = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t'
      
      detectAddressNetworkDetailed.mockReturnValue({
        network: 'TRON',
        isValid: true,
        isSupported: false,
        error: 'TRON addresses are not currently supported. Please use BTC, ETH, SOL, or SUI addresses.'
      })

      render(<WalletAddressInput {...defaultProps} />)
      
      const input = screen.getByPlaceholderText(/Enter wallet address/)
      await user.type(input, tronAddress)
      
      // Should show unsupported network warning
      await waitFor(() => {
        expect(screen.getByText(/TRON.*not.*supported/)).toBeInTheDocument()
      })
    })
  })

  describe('Error Message Clarity', () => {
    it('should provide clear guidance for unsupported chains', async () => {
      const polygonAddress = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F' // Same format as ETH
      
      detectAddressNetworkDetailed.mockReturnValue({
        network: 'MATIC',
        isValid: true,
        isSupported: false,
        error: 'MATIC addresses are not currently supported. Please use BTC, ETH, SOL, or SUI addresses.'
      })

      render(<WalletAddressInput {...defaultProps} />)
      
      const input = screen.getByPlaceholderText(/Enter wallet address/)
      await user.type(input, polygonAddress)
      
      await waitFor(() => {
        // Should provide specific guidance
        expect(screen.getByText(/MATIC.*not.*supported/)).toBeInTheDocument()
        expect(screen.getByText(/Please use BTC, ETH, SOL, or SUI/)).toBeInTheDocument()
      })
    })

    it('should handle edge case addresses with helpful messages', async () => {
      const ambiguousAddress = '0x1234567890123456789012345678901234567890'
      
      detectAddressNetworkDetailed.mockReturnValue({
        network: null,
        isValid: false,
        isSupported: false,
        error: 'Invalid wallet address format. Please enter a valid BTC, ETH, SOL, or SUI address.'
      })

      render(<WalletAddressInput {...defaultProps} />)
      
      const input = screen.getByPlaceholderText(/Enter wallet address/)
      await user.type(input, ambiguousAddress)
      
      await waitFor(() => {
        expect(screen.getByText(/Invalid wallet address format/)).toBeInTheDocument()
        expect(screen.getByText(/Please enter a valid BTC, ETH, SOL, or SUI/)).toBeInTheDocument()
      })
    })
  })

  describe('Performance and UX', () => {
    it('should debounce validation to avoid excessive API calls', async () => {
      render(<WalletAddressInput {...defaultProps} />)
      
      const input = screen.getByPlaceholderText(/Enter wallet address/)
      
      // Type quickly
      await user.type(input, 'TR7NHqjeKQ', { delay: 10 })
      
      // Should not validate on every keystroke with very short delay
      expect(detectAddressNetworkDetailed).toHaveBeenCalledTimes(1) // Only final call
    })

    it('should not freeze UI during validation', async () => {
      detectAddressNetworkDetailed.mockImplementation(() => {
        // Simulate slow validation
        return new Promise(resolve => {
          setTimeout(() => {
            resolve({
              network: 'BTC',
              isValid: true,
              isSupported: true,
              error: null
            })
          }, 100)
        })
      })

      render(<WalletAddressInput {...defaultProps} />)
      
      const input = screen.getByPlaceholderText(/Enter wallet address/)
      
      // Should remain responsive during validation
      await user.type(input, '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
      
      // Input should still be functional
      expect(input).toBeEnabled()
      expect(input.value).toBe('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
    })

    it('should handle rapid address changes gracefully', async () => {
      render(<WalletAddressInput {...defaultProps} />)
      
      const input = screen.getByPlaceholderText(/Enter wallet address/)
      
      // Rapidly change addresses
      const addresses = [
        'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
      ]
      
      for (const address of addresses) {
        await user.clear(input)
        await user.type(input, address)
      }
      
      // Should handle all changes without crashing
      expect(input).toBeInTheDocument()
    })
  })

  describe('Integration with Form Validation', () => {
    it('should integrate with parent form validation errors', () => {
      const validationErrors = {
        recipientAddress: 'Address is required'
      }
      
      render(<WalletAddressInput {...defaultProps} validationErrors={validationErrors} />)
      
      // Should display parent validation error
      expect(screen.getByText('Address is required')).toBeInTheDocument()
    })

    it('should prioritize real-time validation over parent errors', async () => {
      const validationErrors = {
        recipientAddress: 'Address is required'
      }
      
      detectAddressNetworkDetailed.mockReturnValue({
        network: 'TRON',
        isValid: true,
        isSupported: false,
        error: 'TRON addresses are not currently supported. Please use BTC, ETH, SOL, or SUI addresses.'
      })
      
      render(<WalletAddressInput {...defaultProps} validationErrors={validationErrors} />)
      
      const input = screen.getByPlaceholderText(/Enter wallet address/)
      await user.type(input, 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t')
      
      // Should show real-time validation error instead of parent error
      await waitFor(() => {
        expect(screen.getByText(/TRON.*not.*supported/)).toBeInTheDocument()
        expect(screen.queryByText('Address is required')).not.toBeInTheDocument()
      })
    })
  })
})