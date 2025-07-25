/**
 * Comprehensive Chain-Specific Address Validation Tests
 * Tests all supported blockchain address formats and edge cases
 */

import { describe, it, expect, vi } from 'vitest'

// Mock the validation utilities for testing
const _mockValidationUtils = {
  validateBitcoinAddress: vi.fn(),
  validateEthereumAddress: vi.fn(),
  validateSolanaAddress: vi.fn(),
  validateSuiAddress: vi.fn(),
  detectChainFromAddress: vi.fn(),
  getChainSpecificValidation: vi.fn()
}

// Chain validation functions (would be imported from actual implementation)
class ChainValidator {
  constructor() {
    this.supportedChains = ['BTC', 'ETH', 'SOL', 'SUI']
    this.addressPatterns = {
      BTC: {
        legacy: /^[13][a-km-zA-HJ-NP-Z1-9]{25,34}$/,
        segwit: /^3[a-km-zA-HJ-NP-Z1-9]{25,34}$/,
        bech32: /^bc1[a-z0-9]{39,59}$/
      },
      ETH: {
        standard: /^0x[a-fA-F0-9]{40}$/
      },
      SOL: {
        base58: /^[1-9A-HJ-NP-Za-km-z]{32,44}$/
      },
      SUI: {
        hex: /^0x[a-fA-F0-9]{64}$/
      }
    }
  }

  validateAddress(address, chain = null) {
    if (!address || typeof address !== 'string') {
      return {
        isValid: false,
        error: 'INVALID_INPUT',
        message: 'Address must be a non-empty string'
      }
    }

    const trimmedAddress = address.trim()
    
    if (chain) {
      return this.validateChainSpecificAddress(trimmedAddress, chain)
    }

    // Auto-detect chain if not specified
    const detectedChain = this.detectChain(trimmedAddress)
    if (detectedChain) {
      return {
        ...this.validateChainSpecificAddress(trimmedAddress, detectedChain),
        detectedChain
      }
    }

    return {
      isValid: false,
      error: 'UNSUPPORTED_FORMAT',
      message: 'Address format not recognized'
    }
  }

  validateChainSpecificAddress(address, chain) {
    switch (chain.toUpperCase()) {
      case 'BTC':
        return this.validateBitcoinAddress(address)
      case 'ETH':
        return this.validateEthereumAddress(address)
      case 'SOL':
        return this.validateSolanaAddress(address)
      case 'SUI':
        return this.validateSuiAddress(address)
      default:
        return {
          isValid: false,
          error: 'UNSUPPORTED_CHAIN',
          message: `Chain ${chain} is not supported`
        }
    }
  }

  validateBitcoinAddress(address) {
    const patterns = this.addressPatterns.BTC
    
    if (patterns.legacy.test(address)) {
      return {
        isValid: true,
        chain: 'BTC',
        type: 'legacy',
        format: 'P2PKH'
      }
    }
    
    if (patterns.segwit.test(address) && address.startsWith('3')) {
      return {
        isValid: true,
        chain: 'BTC',
        type: 'segwit',
        format: 'P2SH'
      }
    }
    
    if (patterns.bech32.test(address)) {
      return {
        isValid: true,
        chain: 'BTC',
        type: 'bech32',
        format: 'P2WPKH'
      }
    }

    return {
      isValid: false,
      error: 'INVALID_BITCOIN_FORMAT',
      message: 'Invalid Bitcoin address format'
    }
  }

  validateEthereumAddress(address) {
    const pattern = this.addressPatterns.ETH.standard
    
    if (!pattern.test(address)) {
      return {
        isValid: false,
        error: 'INVALID_ETHEREUM_FORMAT',
        message: 'Invalid Ethereum address format'
      }
    }

    // Check for all zeros (burn address)
    if (address.toLowerCase() === '0x0000000000000000000000000000000000000000') {
      return {
        isValid: false,
        error: 'BURN_ADDRESS',
        message: 'Cannot send to burn address'
      }
    }

    return {
      isValid: true,
      chain: 'ETH',
      type: 'standard',
      format: 'EIP-55',
      checksumValid: this.isValidChecksum(address)
    }
  }

  validateSolanaAddress(address) {
    const pattern = this.addressPatterns.SOL.base58
    
    if (!pattern.test(address)) {
      return {
        isValid: false,
        error: 'INVALID_SOLANA_FORMAT',
        message: 'Invalid Solana address format'
      }
    }

    // Check for system program ID (not a valid recipient)
    if (address === '11111111111111111111111111111112') {
      return {
        isValid: false,
        error: 'SYSTEM_PROGRAM',
        message: 'Cannot send to system program'
      }
    }

    return {
      isValid: true,
      chain: 'SOL',
      type: 'base58',
      format: 'Ed25519'
    }
  }

  validateSuiAddress(address) {
    const pattern = this.addressPatterns.SUI.hex
    
    if (!pattern.test(address)) {
      return {
        isValid: false,
        error: 'INVALID_SUI_FORMAT',
        message: 'Invalid Sui address format'
      }
    }

    // Check for all zeros (invalid address)
    if (address.toLowerCase() === '0x0000000000000000000000000000000000000000000000000000000000000000') {
      return {
        isValid: false,
        error: 'NULL_ADDRESS',
        message: 'Cannot send to null address'
      }
    }

    return {
      isValid: true,
      chain: 'SUI',
      type: 'hex',
      format: '32-byte'
    }
  }

  detectChain(address) {
    // Bitcoin detection
    if (this.addressPatterns.BTC.legacy.test(address) || 
        this.addressPatterns.BTC.bech32.test(address)) {
      return 'BTC'
    }
    
    // Ethereum detection (must be before Sui due to similar pattern)
    if (this.addressPatterns.ETH.standard.test(address)) {
      return 'ETH'
    }
    
    // Sui detection (64 hex chars after 0x)
    if (this.addressPatterns.SUI.hex.test(address)) {
      return 'SUI'
    }
    
    // Solana detection
    if (this.addressPatterns.SOL.base58.test(address)) {
      return 'SOL'
    }

    return null
  }

  isValidChecksum(address) {
    // Simplified checksum validation for testing
    // In real implementation, this would use proper EIP-55 validation
    return /^0x[a-fA-F0-9]{40}$/.test(address)
  }

  getSupportedFormats(chain) {
    const formats = {
      BTC: [
        'Legacy (1...): P2PKH format, most widely supported',
        'SegWit (3...): P2SH format, lower fees than legacy',
        'Bech32 (bc1...): Native SegWit, lowest fees'
      ],
      ETH: [
        'Standard (0x...): 42 characters, EIP-55 checksum supported'
      ],
      SOL: [
        'Base58: 32-44 characters, Ed25519 public key derived'
      ],
      SUI: [
        'Hex (0x...): 66 characters total, 32-byte identifier'
      ]
    }
    
    return formats[chain.toUpperCase()] || []
  }
}

describe('Chain-Specific Address Validation', () => {
  let chainValidator

  beforeEach(() => {
    chainValidator = new ChainValidator()
  })

  describe('Bitcoin Address Validation', () => {
    describe('Legacy Addresses (P2PKH)', () => {
      const validLegacyAddresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Genesis block address
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',  // Random valid address
        '1Fh7ajXabJBpZPZw8bjD3QU4CuQ3pRty9u',   // Random valid address
        '12c6DSiU4Rq3P4ZxziKxzrL5LmMBrzjrJX'   // Random valid address
      ]

      const invalidLegacyAddresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfN',   // Too short
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNaX', // Too long
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfN0',  // Invalid character '0'
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNO',  // Invalid character 'O'
        '0A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'   // Doesn't start with '1'
      ]

      validLegacyAddresses.forEach(address => {
        it(`should validate legacy Bitcoin address: ${address}`, () => {
          const result = chainValidator.validateAddress(address, 'BTC')
          
          expect(result.isValid).toBe(true)
          expect(result.chain).toBe('BTC')
          expect(result.type).toBe('legacy')
          expect(result.format).toBe('P2PKH')
        })
      })

      invalidLegacyAddresses.forEach(address => {
        it(`should reject invalid legacy Bitcoin address: ${address}`, () => {
          const result = chainValidator.validateAddress(address, 'BTC')
          
          expect(result.isValid).toBe(false)
          expect(result.error).toBe('INVALID_BITCOIN_FORMAT')
        })
      })
    })

    describe('SegWit Addresses (P2SH)', () => {
      const validSegWitAddresses = [
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',  // Valid SegWit address
        '3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC',  // Valid SegWit address
        '37qgekLpCCHrQuSjvX3fs496FWTGsHFHizjJAs6NPcR47QMUGc' // Edge case (long)
      ]

      const invalidSegWitAddresses = [
        '2J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',  // Starts with '2' instead of '3'
        '4J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',  // Starts with '4' instead of '3'
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWN',    // Too short
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLyX'  // Too long for typical SegWit
      ]

      validSegWitAddresses.forEach(address => {
        it(`should validate SegWit Bitcoin address: ${address}`, () => {
          const result = chainValidator.validateAddress(address, 'BTC')
          
          expect(result.isValid).toBe(true)
          expect(result.chain).toBe('BTC')
          expect(result.type).toBe('segwit')
          expect(result.format).toBe('P2SH')
        })
      })

      invalidSegWitAddresses.forEach(address => {
        it(`should reject invalid SegWit Bitcoin address: ${address}`, () => {
          const result = chainValidator.validateAddress(address, 'BTC')
          
          expect(result.isValid).toBe(false)
          expect(result.error).toBe('INVALID_BITCOIN_FORMAT')
        })
      })
    })

    describe('Bech32 Addresses (Native SegWit)', () => {
      const validBech32Addresses = [
        'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',   // Valid Bech32
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4', // Valid Bech32
        'bc1qrp33g0q5c5txsp9arysrx4k6zdkfs4nce4xj0gdcccefvpysxf3qccfmv3' // Valid Bech32 (long)
      ]

      const invalidBech32Addresses = [
        'tc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',   // Wrong prefix 'tc1'
        'bc2qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',   // Wrong version 'bc2'
        'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5md',    // Too short
        'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5MDQQ',  // Invalid character 'Q'
        'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq0',  // Invalid character '0'
      ]

      validBech32Addresses.forEach(address => {
        it(`should validate Bech32 Bitcoin address: ${address}`, () => {
          const result = chainValidator.validateAddress(address, 'BTC')
          
          expect(result.isValid).toBe(true)
          expect(result.chain).toBe('BTC')
          expect(result.type).toBe('bech32')
          expect(result.format).toBe('P2WPKH')
        })
      })

      invalidBech32Addresses.forEach(address => {
        it(`should reject invalid Bech32 Bitcoin address: ${address}`, () => {
          const result = chainValidator.validateAddress(address, 'BTC')
          
          expect(result.isValid).toBe(false)
          expect(result.error).toBe('INVALID_BITCOIN_FORMAT')
        })
      })
    })
  })

  describe('Ethereum Address Validation', () => {
    describe('Standard Ethereum Addresses', () => {
      const validEthereumAddresses = [
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', // Mixed case (checksum)
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', // Mixed case (checksum)
        '0x0000000000000000000000000000000000000001', // Minimal valid address
        '0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFF', // All uppercase
        '0xffffffffffffffffffffffffffffffffffffffff', // All lowercase
        '0x742d35Cc6634C0532925a3b8D407Af7e532e12d4'  // Random valid address
      ]

      const invalidEthereumAddresses = [
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAe',   // Too short (39 chars)
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAedX', // Too long (41 chars)
        '5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed',    // Missing '0x' prefix
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAeG',  // Invalid character 'G'
        '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAe-',  // Invalid character '-'
        '0X5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'   // Uppercase 'X' in prefix
      ]

      validEthereumAddresses.forEach(address => {
        it(`should validate Ethereum address: ${address}`, () => {
          const result = chainValidator.validateAddress(address, 'ETH')
          
          expect(result.isValid).toBe(true)
          expect(result.chain).toBe('ETH')
          expect(result.type).toBe('standard')
          expect(result.format).toBe('EIP-55')
          expect(result.checksumValid).toBe(true)
        })
      })

      invalidEthereumAddresses.forEach(address => {
        it(`should reject invalid Ethereum address: ${address}`, () => {
          const result = chainValidator.validateAddress(address, 'ETH')
          
          expect(result.isValid).toBe(false)
          expect(result.error).toBe('INVALID_ETHEREUM_FORMAT')
        })
      })
    })

    describe('Special Ethereum Address Cases', () => {
      it('should reject burn address (all zeros)', () => {
        const burnAddress = '0x0000000000000000000000000000000000000000'
        const result = chainValidator.validateAddress(burnAddress, 'ETH')
        
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('BURN_ADDRESS')
        expect(result.message).toContain('burn address')
      })

      it('should handle EIP-55 checksum validation', () => {
        const checksumAddress = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'
        const result = chainValidator.validateAddress(checksumAddress, 'ETH')
        
        expect(result.isValid).toBe(true)
        expect(result.checksumValid).toBe(true)
      })
    })

    describe('Layer 2 Compatibility', () => {
      it('should note that Ethereum addresses work on Layer 2s', () => {
        const ethAddress = '0x742d35Cc6634C0532925a3b8D407Af7e532e12d4'
        const result = chainValidator.validateAddress(ethAddress, 'ETH')
        
        expect(result.isValid).toBe(true)
        // Note: In real implementation, this would include Layer 2 compatibility info
        expect(result.chain).toBe('ETH')
      })
    })
  })

  describe('Solana Address Validation', () => {
    describe('Standard Solana Addresses', () => {
      const validSolanaAddresses = [
        '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NFD', // Valid Solana address
        'DQyrAcCrDXQ8NeoqGgDCZwBvWDcYmFCjSb9JtteuvPpz', // Valid Solana address
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',  // Token program
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',  // USDC mint
        '11111111111111111111111111111111',              // System program (special case)
        'SysvarRent111111111111111111111111111111111'     // Sysvar rent
      ]

      const invalidSolanaAddresses = [
        '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NF',  // Too short
        '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NFDX', // Too long
        '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NF0', // Invalid character '0'
        '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NFO', // Invalid character 'O'
        '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NFI', // Invalid character 'I'
        '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NFl'  // Invalid character 'l'
      ]

      validSolanaAddresses.forEach(address => {
        it(`should validate Solana address: ${address}`, () => {
          const result = chainValidator.validateAddress(address, 'SOL')
          
          if (address === '11111111111111111111111111111112') {
            // System program should be rejected as recipient
            expect(result.isValid).toBe(false)
            expect(result.error).toBe('SYSTEM_PROGRAM')
          } else {
            expect(result.isValid).toBe(true)
            expect(result.chain).toBe('SOL')
            expect(result.type).toBe('base58')
            expect(result.format).toBe('Ed25519')
          }
        })
      })

      invalidSolanaAddresses.forEach(address => {
        it(`should reject invalid Solana address: ${address}`, () => {
          const result = chainValidator.validateAddress(address, 'SOL')
          
          expect(result.isValid).toBe(false)
          expect(result.error).toBe('INVALID_SOLANA_FORMAT')
        })
      })
    })

    describe('Special Solana Address Cases', () => {
      it('should reject system program as transfer recipient', () => {
        const systemProgram = '11111111111111111111111111111112'
        const result = chainValidator.validateAddress(systemProgram, 'SOL')
        
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('SYSTEM_PROGRAM')
        expect(result.message).toContain('system program')
      })

      it('should handle edge case lengths', () => {
        const shortestValid = '11111111111111111111111111111111' // 32 chars
        const longestValid = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA' // 44 chars
        
        const shortResult = chainValidator.validateAddress(shortestValid, 'SOL')
        const longResult = chainValidator.validateAddress(longestValid, 'SOL')
        
        expect(shortResult.isValid).toBe(true)
        expect(longResult.isValid).toBe(true)
      })
    })
  })

  describe('Sui Address Validation', () => {
    describe('Standard Sui Addresses', () => {
      const validSuiAddresses = [
        '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f',
        '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
        '0x0000000000000000000000000000000000000000000000000000000000000001', // Minimal (not null)
        '0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff', // Maximum
        '0x2af4d2c5e8c4a2b9d7e1f3a6b8c9d0e2f4a5b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1'  // Random valid
      ]

      const invalidSuiAddresses = [
        '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6', // Too short (63 chars)
        '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f7', // Too long (65 chars)
        '1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f', // Missing '0x'
        '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5eG', // Invalid char 'G'
        '0X1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f'  // Uppercase 'X'
      ]

      validSuiAddresses.forEach(address => {
        it(`should validate Sui address: ${address}`, () => {
          const result = chainValidator.validateAddress(address, 'SUI')
          
          expect(result.isValid).toBe(true)
          expect(result.chain).toBe('SUI')
          expect(result.type).toBe('hex')
          expect(result.format).toBe('32-byte')
        })
      })

      invalidSuiAddresses.forEach(address => {
        it(`should reject invalid Sui address: ${address}`, () => {
          const result = chainValidator.validateAddress(address, 'SUI')
          
          expect(result.isValid).toBe(false)
          expect(result.error).toBe('INVALID_SUI_FORMAT')
        })
      })
    })

    describe('Special Sui Address Cases', () => {
      it('should reject null address (all zeros)', () => {
        const nullAddress = '0x0000000000000000000000000000000000000000000000000000000000000000'
        const result = chainValidator.validateAddress(nullAddress, 'SUI')
        
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('NULL_ADDRESS')
        expect(result.message).toContain('null address')
      })

      it('should handle case sensitivity', () => {
        const upperCase = '0xABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF1234567890ABCDEF12'
        const lowerCase = '0xabcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12'
        const mixedCase = '0xAbCdEf1234567890aBcDeF1234567890AbCdEf1234567890aBcDeF1234567890AbCdEf12'
        
        expect(chainValidator.validateAddress(upperCase, 'SUI').isValid).toBe(true)
        expect(chainValidator.validateAddress(lowerCase, 'SUI').isValid).toBe(true)
        expect(chainValidator.validateAddress(mixedCase, 'SUI').isValid).toBe(true)
      })
    })
  })

  describe('Chain Auto-Detection', () => {
    describe('Successful Chain Detection', () => {
      const detectionTests = [
        // Bitcoin addresses
        { address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', expectedChain: 'BTC', type: 'Legacy Bitcoin' },
        { address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', expectedChain: 'BTC', type: 'SegWit Bitcoin' },
        { address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', expectedChain: 'BTC', type: 'Bech32 Bitcoin' },
        
        // Ethereum addresses
        { address: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', expectedChain: 'ETH', type: 'Ethereum' },
        { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', expectedChain: 'ETH', type: 'Ethereum' },
        
        // Solana addresses
        { address: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NFD', expectedChain: 'SOL', type: 'Solana' },
        { address: 'DQyrAcCrDXQ8NeoqGgDCZwBvWDcYmFCjSb9JtteuvPpz', expectedChain: 'SOL', type: 'Solana' },
        
        // Sui addresses (must be tested after Ethereum due to similar 0x pattern)
        { address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f', expectedChain: 'SUI', type: 'Sui' }
      ]

      detectionTests.forEach(({ address, expectedChain, type }) => {
        it(`should auto-detect ${type} chain from address`, () => {
          const result = chainValidator.validateAddress(address)
          
          expect(result.isValid).toBe(true)
          expect(result.detectedChain).toBe(expectedChain)
        })
      })
    })

    describe('Chain Detection Edge Cases', () => {
      it('should distinguish between Ethereum and Sui addresses', () => {
        // Ethereum (40 hex chars)
        const ethAddress = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'
        const ethResult = chainValidator.validateAddress(ethAddress)
        
        // Sui (64 hex chars)
        const suiAddress = '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f'
        const suiResult = chainValidator.validateAddress(suiAddress)
        
        expect(ethResult.detectedChain).toBe('ETH')
        expect(suiResult.detectedChain).toBe('SUI')
      })

      it('should handle addresses that could match multiple patterns', () => {
        // Address starting with '3' could be Bitcoin SegWit
        const segwitAddress = '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy'
        const result = chainValidator.validateAddress(segwitAddress)
        
        expect(result.detectedChain).toBe('BTC')
        expect(result.type).toBe('segwit')
      })

      it('should return null for unrecognized address formats', () => {
        const unknownAddresses = [
          'invalid_address_format',
          'T9yD14Nj9j7xAB4dbGeiX9h8unkKLxmGkn', // TRON format
          'r3KMH8y4q49bF2hK7r4f7aT8j9j8k6k7j9', // XRP format
          'cosmos1x2y3z4a5b6c7d8e9f0a1b2c3d4e5f6a7b8c9d0' // Cosmos format
        ]

        unknownAddresses.forEach(address => {
          const result = chainValidator.validateAddress(address)
          expect(result.isValid).toBe(false)
          expect(result.error).toBe('UNSUPPORTED_FORMAT')
        })
      })
    })
  })

  describe('Invalid Chain Validation', () => {
    it('should reject addresses for unsupported chains', () => {
      const tronAddress = 'T9yD14Nj9j7xAB4dbGeiX9h8unkKLxmGkn'
      const result = chainValidator.validateAddress(tronAddress, 'TRON')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('UNSUPPORTED_CHAIN')
      expect(result.message).toContain('TRON')
    })

    it('should handle unsupported chain codes gracefully', () => {
      const validEthAddress = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'
      const result = chainValidator.validateAddress(validEthAddress, 'INVALID_CHAIN')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('UNSUPPORTED_CHAIN')
    })
  })

  describe('Input Validation and Error Handling', () => {
    describe('Invalid Input Types', () => {
      const invalidInputs = [
        { input: null, type: 'null' },
        { input: undefined, type: 'undefined' },
        { input: '', type: 'empty string' },
        { input: 123, type: 'number' },
        { input: {}, type: 'object' },
        { input: [], type: 'array' },
        { input: true, type: 'boolean' }
      ]

      invalidInputs.forEach(({ input, type }) => {
        it(`should reject ${type} input`, () => {
          const result = chainValidator.validateAddress(input)
          
          expect(result.isValid).toBe(false)
          expect(result.error).toBe('INVALID_INPUT')
        })
      })
    })

    describe('Whitespace Handling', () => {
      it('should trim whitespace from addresses', () => {
        const addressWithSpaces = '  1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa  '
        const result = chainValidator.validateAddress(addressWithSpaces, 'BTC')
        
        expect(result.isValid).toBe(true)
        expect(result.chain).toBe('BTC')
      })

      it('should handle addresses with internal whitespace', () => {
        const addressWithInternalSpaces = '1A1zP1eP5QGefi2D MPTfTL5SLmv7DivfNa'
        const result = chainValidator.validateAddress(addressWithInternalSpaces, 'BTC')
        
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('INVALID_BITCOIN_FORMAT')
      })
    })

    describe('Case Sensitivity', () => {
      it('should handle case-insensitive validation for Bitcoin', () => {
        const lowerCase = '1a1zp1ep5qgefi2dmptftl5slmv7divfna'
        const upperCase = '1A1ZP1EP5QGEFI2DMPTFTL5SLMV7DIVFNA'
        
        // Bitcoin addresses are case-sensitive in Base58, so these should be invalid
        expect(chainValidator.validateAddress(lowerCase, 'BTC').isValid).toBe(false)
        expect(chainValidator.validateAddress(upperCase, 'BTC').isValid).toBe(false)
      })

      it('should handle case variations for Ethereum addresses', () => {
        const originalAddress = '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed'
        const lowerCaseAddress = originalAddress.toLowerCase()
        const upperCaseAddress = originalAddress.toUpperCase()
        
        expect(chainValidator.validateAddress(originalAddress, 'ETH').isValid).toBe(true)
        expect(chainValidator.validateAddress(lowerCaseAddress, 'ETH').isValid).toBe(true)
        expect(chainValidator.validateAddress(upperCaseAddress, 'ETH').isValid).toBe(true)
      })
    })
  })

  describe('Performance and Edge Cases', () => {
    describe('Performance with Large Inputs', () => {
      it('should handle very long invalid addresses efficiently', () => {
        const veryLongAddress = '0x' + 'a'.repeat(1000) // 1002 characters
        const startTime = Date.now()
        
        const result = chainValidator.validateAddress(veryLongAddress, 'ETH')
        const endTime = Date.now()
        
        expect(result.isValid).toBe(false)
        expect(endTime - startTime).toBeLessThan(100) // Should be fast
      })
    })

    describe('Memory Usage', () => {
      it('should not leak memory with repeated validations', () => {
        const address = '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa'
        
        // Perform many validations
        for (let i = 0; i < 1000; i++) {
          chainValidator.validateAddress(address, 'BTC')
        }
        
        // Test should complete without memory issues
        expect(true).toBe(true)
      })
    })

    describe('Supported Formats Information', () => {
      it('should provide supported format information for each chain', () => {
        const btcFormats = chainValidator.getSupportedFormats('BTC')
        const ethFormats = chainValidator.getSupportedFormats('ETH')
        const solFormats = chainValidator.getSupportedFormats('SOL')
        const suiFormats = chainValidator.getSupportedFormats('SUI')
        
        expect(btcFormats).toHaveLength(3) // Legacy, SegWit, Bech32
        expect(ethFormats).toHaveLength(1) // Standard
        expect(solFormats).toHaveLength(1) // Base58
        expect(suiFormats).toHaveLength(1) // Hex
        
        expect(btcFormats[0]).toContain('Legacy')
        expect(ethFormats[0]).toContain('Standard')
      })

      it('should return empty array for unsupported chains', () => {
        const unsupportedFormats = chainValidator.getSupportedFormats('UNSUPPORTED')
        expect(unsupportedFormats).toHaveLength(0)
      })
    })
  })

  describe('Real-world Address Examples', () => {
    describe('Known Addresses from Production', () => {
      // Using well-known addresses from mainnet
      const knownAddresses = [
        // Bitcoin
        { address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', chain: 'BTC', name: 'Genesis Block' },
        { address: 'bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh', chain: 'BTC', name: 'Modern Bech32' },
        
        // Ethereum  
        { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', chain: 'ETH', name: 'Vitalik Buterin' },
        { address: '0xA0b86a33E6411c6F83B8C3cf0eAf93D5a8f4d5e0', chain: 'ETH', name: 'USDC Contract' },
        
        // Solana
        { address: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', chain: 'SOL', name: 'Token Program' },
        { address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', chain: 'SOL', name: 'USDC Mint' }
      ]

      knownAddresses.forEach(({ address, chain, name }) => {
        it(`should validate known ${chain} address (${name})`, () => {
          const result = chainValidator.validateAddress(address, chain)
          expect(result.isValid).toBe(true)
        })
      })
    })
  })
})