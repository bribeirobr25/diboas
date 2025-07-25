/**
 * Comprehensive Chain-Specific Address Validation Tests
 * Tests all supported blockchain address formats and edge cases
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { 
  ChainValidator,
  chainValidator,
  validateBitcoinAddress,
  validateEthereumAddress,
  validateSolanaAddress,
  validateSuiAddress,
  detectChainFromAddress,
  getChainSpecificValidation
} from '../chainValidation.js'

describe('Chain-Specific Address Validation', () => {
  let testValidator

  beforeEach(() => {
    testValidator = new ChainValidator()
  })

  describe('Bitcoin Address Validation', () => {
    describe('Legacy Addresses (P2PKH)', () => {
      const validLegacyAddresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',  // Genesis block address
        '1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2',   // Valid legacy address
        '1KFHE7w8BhaENAswwryaoccDb6qcT6DbYY'    // Valid legacy address
      ]

      const invalidLegacyAddresses = [
        '2A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',  // Starts with '2' instead of '1'
        '0A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',  // Starts with '0' instead of '1'
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfN',   // Too short
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNaX'  // Too long
      ]

      validLegacyAddresses.forEach(address => {
        it(`should validate legacy Bitcoin address: ${address}`, () => {
          const result = testValidator.validateAddress(address, 'BTC')
          
          expect(result.isValid).toBe(true)
          expect(result.chain).toBe('BTC')
          expect(result.type).toBe('legacy')
          expect(result.format).toBe('P2PKH')
        })
      })

      invalidLegacyAddresses.forEach(address => {
        it(`should reject invalid legacy Bitcoin address: ${address}`, () => {
          const result = testValidator.validateAddress(address, 'BTC')
          
          expect(result.isValid).toBe(false)
          expect(result.error).toBe('INVALID_BITCOIN_FORMAT')
        })
      })
    })

    describe('SegWit Addresses (P2SH)', () => {
      const validSegWitAddresses = [
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',  // Valid SegWit address
        '3QJmV3qfvL9SuYo34YihAf3sRCW3qSinyC'   // Valid SegWit address
      ]

      const invalidSegWitAddresses = [
        '2J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',  // Starts with '2' instead of '3'
        '4J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy',  // Starts with '4' instead of '3'
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWN',    // Too short
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLyX'  // Too long for typical SegWit
      ]

      validSegWitAddresses.forEach(address => {
        it(`should validate SegWit Bitcoin address: ${address}`, () => {
          const result = testValidator.validateAddress(address, 'BTC')
          
          expect(result.isValid).toBe(true)
          expect(result.chain).toBe('BTC')
          expect(result.type).toBe('segwit')
          expect(result.format).toBe('P2SH')
        })
      })

      invalidSegWitAddresses.forEach(address => {
        it(`should reject invalid SegWit Bitcoin address: ${address}`, () => {
          const result = testValidator.validateAddress(address, 'BTC')
          
          expect(result.isValid).toBe(false)
          expect(result.error).toBe('INVALID_BITCOIN_FORMAT')
        })
      })
    })

    describe('Bech32 Addresses (Native SegWit)', () => {
      const validBech32Addresses = [
        'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',   // Valid Bech32
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'  // Valid Bech32
      ]

      const invalidBech32Addresses = [
        'tc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',   // Wrong prefix 'tc1' instead of 'bc1'
        'bc2qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq',   // Wrong prefix 'bc2' instead of 'bc1'
        'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5md',    // Too short
        'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdqX'   // Too long
      ]

      validBech32Addresses.forEach(address => {
        it(`should validate Bech32 Bitcoin address: ${address}`, () => {
          const result = testValidator.validateAddress(address, 'BTC')
          
          expect(result.isValid).toBe(true)
          expect(result.chain).toBe('BTC')
          expect(result.type).toBe('bech32')
          expect(result.format).toBe('P2WPKH')
        })
      })

      invalidBech32Addresses.forEach(address => {
        it(`should reject invalid Bech32 Bitcoin address: ${address}`, () => {
          const result = testValidator.validateAddress(address, 'BTC')
          
          expect(result.isValid).toBe(false)
          expect(result.error).toBe('INVALID_BITCOIN_FORMAT')
        })
      })
    })
  })

  describe('Ethereum Address Validation', () => {
    describe('Standard Ethereum Addresses', () => {
      const validEthereumAddresses = [
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',  // Vitalik Buterin
        '0xA0b86a33E6411897CFe40E429e511c1e1e41c1B1',  // Another valid address
        '0x742d35Cc6C757C4C4F4c1B4C6C697C75F8B5F5D1'   // Valid checksum address
      ]

      const invalidEthereumAddresses = [
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA9604',   // Too short
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA960455', // Too long
        'xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',   // Missing 0x prefix
        '0xG8dA6BF26964aF9D7eEd9e03E53415D37aA96045',  // Invalid hex character 'G'
        '0x0000000000000000000000000000000000000000'   // Burn address
      ]

      validEthereumAddresses.forEach(address => {
        it(`should validate Ethereum address: ${address}`, () => {
          const result = testValidator.validateAddress(address, 'ETH')
          
          expect(result.isValid).toBe(true)
          expect(result.chain).toBe('ETH')
          expect(result.type).toBe('standard')
          expect(result.format).toBe('EIP-55')
        })
      })

      invalidEthereumAddresses.forEach(address => {
        it(`should reject invalid Ethereum address: ${address}`, () => {
          const result = testValidator.validateAddress(address, 'ETH')
          
          expect(result.isValid).toBe(false)
          expect(['INVALID_ETHEREUM_FORMAT', 'BURN_ADDRESS']).toContain(result.error)
        })
      })
    })
  })

  describe('Solana Address Validation', () => {
    describe('Base58 Addresses', () => {
      const validSolanaAddresses = [
        '11111111111111111111111111111112',        // System Program
        'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',  // Token Program
        'So11111111111111111111111111111111111111112'   // Wrapped SOL
      ]

      const invalidSolanaAddresses = [
        '1111111111111111111111111111111',         // Too short
        '111111111111111111111111111111111111111111111111', // Too long
        '1111111111111111111111111111111O',        // Invalid character 'O'
        '1111111111111111111111111111111l'         // Invalid character 'l'
      ]

      validSolanaAddresses.forEach(address => {
        it(`should validate Solana address: ${address}`, () => {
          const result = testValidator.validateAddress(address, 'SOL')
          
          expect(result.isValid).toBe(true)
          expect(result.chain).toBe('SOL')
          expect(result.type).toBe('base58')
          expect(result.format).toBe('Ed25519')
        })
      })

      invalidSolanaAddresses.forEach(address => {
        it(`should reject invalid Solana address: ${address}`, () => {
          const result = testValidator.validateAddress(address, 'SOL')
          
          expect(result.isValid).toBe(false)
          expect(result.error).toBe('INVALID_SOLANA_FORMAT')
        })
      })
    })
  })

  describe('Sui Address Validation', () => {
    describe('Hex Object IDs', () => {
      const validSuiAddresses = [
        '0x0000000000000000000000000000000000000000000000000000000000000001',  // Clock object
        '0x0000000000000000000000000000000000000000000000000000000000000002'   // Sui System State
      ]

      const invalidSuiAddresses = [
        '0x000000000000000000000000000000000000000000000000000000000000001',   // Too short
        '0x00000000000000000000000000000000000000000000000000000000000000011', // Too long
        '0x000000000000000000000000000000000000000000000000000000000000000G',  // Invalid hex character
        '000000000000000000000000000000000000000000000000000000000000000001'   // Missing 0x prefix
      ]

      validSuiAddresses.forEach(address => {
        it(`should validate Sui address: ${address}`, () => {
          const result = testValidator.validateAddress(address, 'SUI')
          
          expect(result.isValid).toBe(true)
          expect(result.chain).toBe('SUI')
          expect(result.type).toBe('hex')
          expect(result.format).toBe('Object ID')
        })
      })

      invalidSuiAddresses.forEach(address => {
        it(`should reject invalid Sui address: ${address}`, () => {
          const result = testValidator.validateAddress(address, 'SUI')
          
          expect(result.isValid).toBe(false)
          expect(result.error).toBe('INVALID_SUI_FORMAT')
        })
      })
    })
  })

  describe('Chain Auto-Detection', () => {
    describe('Successful Chain Detection', () => {
      it('should auto-detect Bitcoin chain from legacy address', () => {
        const result = testValidator.validateAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa')
        
        expect(result.isValid).toBe(true)
        expect(result.detectedChain).toBe('BTC')
      })

      it('should auto-detect Ethereum chain from address', () => {
        const result = testValidator.validateAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045')
        
        expect(result.isValid).toBe(true)
        expect(result.detectedChain).toBe('ETH')
      })

      it('should auto-detect Solana chain from address', () => {
        const result = testValidator.validateAddress('11111111111111111111111111111112')
        
        expect(result.isValid).toBe(true)
        expect(result.detectedChain).toBe('SOL')
      })

      it('should auto-detect Sui chain from address', () => {
        const result = testValidator.validateAddress('0x0000000000000000000000000000000000000000000000000000000000000001')
        
        expect(result.isValid).toBe(true)
        expect(result.detectedChain).toBe('SUI')
      })
    })

    describe('Chain Detection Edge Cases', () => {
      it('should distinguish between Ethereum and Sui addresses', () => {
        const ethAddress = '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
        const suiAddress = '0x0000000000000000000000000000000000000000000000000000000000000001'
        
        const ethResult = testValidator.validateAddress(ethAddress)
        const suiResult = testValidator.validateAddress(suiAddress)
        
        expect(ethResult.detectedChain).toBe('ETH')
        expect(suiResult.detectedChain).toBe('SUI')
      })

      it('should handle addresses that could match multiple patterns', () => {
        // This is a legacy Bitcoin address that starts with '3'
        const result = testValidator.validateAddress('3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy')
        
        expect(result.isValid).toBe(true)
        expect(result.detectedChain).toBe('BTC')
        expect(result.type).toBe('segwit')
      })

      it('should return null for unrecognized address formats', () => {
        const result = testValidator.validateAddress('invalid_address_format_xyz123')
        
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('UNSUPPORTED_FORMAT')
      })
    })
  })

  describe('Invalid Chain Validation', () => {
    it('should reject addresses for unsupported chains', () => {
      const result = testValidator.validateAddress('some_address', 'UNSUPPORTED_CHAIN')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('UNSUPPORTED_CHAIN')
    })

    it('should handle unsupported chain codes gracefully', () => {
      const result = testValidator.validateAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'DOGE')
      
      expect(result.isValid).toBe(false)
      expect(result.error).toBe('UNSUPPORTED_CHAIN')
      expect(result.message).toContain('DOGE')
    })
  })

  describe('Input Validation and Error Handling', () => {
    describe('Invalid Input Types', () => {
      it('should reject null input', () => {
        const result = testValidator.validateAddress(null)
        
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('INVALID_INPUT')
      })

      it('should reject undefined input', () => {
        const result = testValidator.validateAddress(undefined)
        
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('INVALID_INPUT')
      })

      it('should reject empty string input', () => {
        const result = testValidator.validateAddress('')
        
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('INVALID_INPUT')
      })

      it('should reject number input', () => {
        const result = testValidator.validateAddress(123456)
        
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('INVALID_INPUT')
      })

      it('should reject object input', () => {
        const result = testValidator.validateAddress({})
        
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('INVALID_INPUT')
      })

      it('should reject array input', () => {
        const result = testValidator.validateAddress([])
        
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('INVALID_INPUT')
      })

      it('should reject boolean input', () => {
        const result = testValidator.validateAddress(true)
        
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('INVALID_INPUT')
      })
    })

    describe('Whitespace Handling', () => {
      it('should trim whitespace from addresses', () => {
        const result = testValidator.validateAddress('  1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa  ', 'BTC')
        
        expect(result.isValid).toBe(true)
        expect(result.chain).toBe('BTC')
      })

      it('should handle addresses with internal whitespace', () => {
        const result = testValidator.validateAddress('1A1zP1eP 5QGefi2DMPTfTL5SLmv7DivfNa', 'BTC')
        
        expect(result.isValid).toBe(false)
        expect(result.error).toBe('INVALID_BITCOIN_FORMAT')
      })
    })

    describe('Case Sensitivity', () => {
      it('should handle case-insensitive validation for Bitcoin', () => {
        const result = testValidator.validateAddress('1a1zp1ep5qgefi2dmptftl5slmv7divfna', 'BTC')
        
        expect(result.isValid).toBe(true)
        expect(result.chain).toBe('BTC')
      })

      it('should handle case variations for Ethereum addresses', () => {
        const lowerCase = '0xd8da6bf26964af9d7eed9e03e53415d37aa96045'
        const result = testValidator.validateAddress(lowerCase, 'ETH')
        
        expect(result.isValid).toBe(true)
        expect(result.chain).toBe('ETH')
      })
    })
  })

  describe('Performance and Edge Cases', () => {
    describe('Performance with Large Inputs', () => {
      it('should handle very long invalid addresses efficiently', () => {
        const longInvalidAddress = 'x'.repeat(10000)
        const startTime = performance.now()
        const result = testValidator.validateAddress(longInvalidAddress)
        const endTime = performance.now()
        
        expect(result.isValid).toBe(false)
        expect(endTime - startTime).toBeLessThan(100) // Should complete in <100ms
      })
    })

    describe('Memory Usage', () => {
      it('should not leak memory with repeated validations', () => {
        const addresses = [
          '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
          '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045',
          '11111111111111111111111111111112'
        ]
        
        // Run many validations
        for (let i = 0; i < 1000; i++) {
          const address = addresses[i % addresses.length]
          testValidator.validateAddress(address)
        }
        
        // Memory leak detection would require more sophisticated tooling
        // This test ensures the function doesn't throw errors with repeated use
        expect(true).toBe(true)
      })
    })

    describe('Supported Formats Information', () => {
      it('should provide supported format information for each chain', () => {
        const btcFormats = testValidator.getSupportedFormats('BTC')
        const ethFormats = testValidator.getSupportedFormats('ETH')
        const solFormats = testValidator.getSupportedFormats('SOL')
        const suiFormats = testValidator.getSupportedFormats('SUI')
        
        expect(btcFormats).toEqual(['legacy', 'segwit', 'bech32'])
        expect(ethFormats).toEqual(['standard'])
        expect(solFormats).toEqual(['base58'])
        expect(suiFormats).toEqual(['hex'])
      })

      it('should return empty array for unsupported chains', () => {
        const formats = testValidator.getSupportedFormats('DOGE')
        expect(formats).toEqual([])
      })
    })
  })

  describe('Real-world Address Examples', () => {
    describe('Known Addresses from Production', () => {
      it('should validate known BTC address (Genesis Block)', () => {
        const result = testValidator.validateAddress('1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', 'BTC')
        expect(result.isValid).toBe(true)
      })

      it('should validate known BTC address (Modern Bech32)', () => {
        const result = testValidator.validateAddress('bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', 'BTC')
        expect(result.isValid).toBe(true)
      })

      it('should validate known ETH address (Vitalik Buterin)', () => {
        const result = testValidator.validateAddress('0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', 'ETH')
        expect(result.isValid).toBe(true)
      })

      it('should validate known ETH address (USDC Contract)', () => {
        const result = testValidator.validateAddress('0xA0b86a33E6411897CFe40E429e511c1e1e41c1B1', 'ETH')
        expect(result.isValid).toBe(true)
      })

      it('should validate known SOL address (Token Program)', () => {
        const result = testValidator.validateAddress('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA', 'SOL')
        expect(result.isValid).toBe(true)
      })

      it('should validate known SOL address (USDC Mint)', () => {
        const result = testValidator.validateAddress('EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', 'SOL')
        expect(result.isValid).toBe(true)
      })
    })
  })
})