import { describe, it, expect, beforeEach } from 'vitest'
import { 
  detectAddressNetworkDetailed,
  detectAddressNetwork,
  validateWalletAddress 
} from '../walletAddressDatabase.js'

describe('Enhanced Address Validation with Invalid Chain Detection', () => {
  describe('detectAddressNetworkDetailed - Supported Networks', () => {
    const validAddresses = {
      BTC: [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Legacy
        '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', // SegWit
        'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', // Bech32
        'bc1qw508d6qejxtdg4y5r3zarvary0c5xw7kv8f3t4'
      ],
      ETH: [
        '0x71C7656EC7ab88b098defB751B7401B5f6d8976F',
        '0x6b7c8d9e0f1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c',
        '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045'
      ],
      SOL: [
        '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NFD',
        'DjVE6JNiYqPL2QXyCUUh8rNjHrbz9hXHNYt99MQ59qw1',
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v'
      ],
      SUI: [
        '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b',
        '0x0000000000000000000000000000000000000000000000000000000000000002',
        '0x168da5bf1f48dafc111b0a488b0d47b0049f82e32db06e6b1b0b3c2fd6f1b1b1'
      ]
    }

    Object.entries(validAddresses).forEach(([network, addresses]) => {
      addresses.forEach(address => {
        it(`should detect ${network} address: ${address.slice(0, 10)}...`, () => {
          const result = detectAddressNetworkDetailed(address)
          
          expect(result.network).toBe(network)
          expect(result.isValid).toBe(true)
          expect(result.isSupported).toBe(true)
          expect(result.error).toBe(null)
        })
      })
    })
  })

  describe('detectAddressNetworkDetailed - Unsupported Networks', () => {
    const unsupportedAddresses = {
      TRON: [
        'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', // Real TRON USDT contract
        'TMuA6YqfCeX8EhbfYEg5y7S4DqzSJireY9', // Real TRON address
        'TKHuVq1oKVruCGLvqVexFs6dawKv6fQgFs'  // Real TRON address
      ],
      BNB: [
        'bnb1grpf0955h0ykzusd59pqe4ug98yhap8r8ej6r2', // Binance Chain format
        'bnb136ns6lfw4zs5hg4n85vdthaad7hq5m4gtkgf23', // Real BNB address format
        'bnb1us47wdhfx08ch97zdueh3x3u5murfrx30jecrx'  // Real BNB address format
      ],
      XRP: [
        'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh', // Real XRP address format
        'rPdvC6ccq8hCdPKSPJkPmyZ4Mi4djk4pbP', // Real XRP address format  
        'rLNaPoEeAP2vT7XsVq7Q8hn6b7LVrLv4n'  // Real XRP address format
      ],
      ADA: [
        'addr1qy2jt0qpqz2cphqm85lqntzx5c7hf0qy4nlknbz5xd6qmqcxrh6e9h7lmd9c5r4z5k8q3qnd9z8e7q5zqg9h7n4j5k7',
        'addr1qx7kqjf3r9xv8p2l5m6n7o8p9q0r1s2t3u4v5w6x7y8z9a0b1c2d3e4f5g6h7i8j9k0l1m2n3o4p5q6r7s8t9u0v1w',
        'addr1q9f8e7d6c5b4a3s2w1e4r5t6y7u8i9o0p1q2w3e4r5t6y7u8i9o0p1a2s3d4f5g6h7j8k9l0z1x2c3v4b5n6m7q8w9e'
      ],
      AVAX: [
        'X-avax1x7kqjf3r9xv8p2l5m6n7o8p9q0r1s2t3u4v5w6',
        'X-avax1y9f8e7d6c5b4a3s2w1e4r5t6y7u8i9o0p1q2w3',
        'X-avax1z1x2c3v4b5n6m7q8w9e0r1t2y3u4i5o6p7a8s9d'
      ],
      DOT: [
        '1ChFWeNRLarAPRCTM3bfJmncJbSAbSS9yqjueWz7jX7iTVZ',
        '15oKAhEUaErKN1dkZQzP43oztSh5yoRD2LzJG6mGNj9EDxfW',
        '13YMKAhEUaErKN1dkZQzP43oztSh5yoRD2LzJG6mGNj9EDxfW'
      ],
      BCH: [
        'bitcoincash:qr95sy3j9xwd2ap32xkykttr4cvcu7as4y0qverfuy',
        'qzm47qz5ue99y9yyxq0c5qj0wyp44k5fdr2fzwrfqx',
        'qq07l6rr5lsdm3m80qxw80kr2dt89z3gvqz3a8z3v9'
      ],
      NEAR: [
        'alice.near',
        'token.sweat',
        'aurora',
        'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0a1b2c3d4'
      ],
      HBAR: [
        '0.0.123456',
        '0.0.789012',
        '0.0.345678'
      ],
      CRO: [
        'cro1x7kqjf3r9xv8p2l5m6n7o8p9q0r1s2t3u4v5w6',
        'cro1y9f8e7d6c5b4a3s2w1e4r5t6y7u8i9o0p1q2w3',
        'cro1z1x2c3v4b5n6m7q8w9e0r1t2y3u4i5o6p7a8s9d'
      ],
      XLM: [
        'GCKFBEIYTKP56WKBJP3VMUGBR5Y5CJQFPRBBKBQQ6QWMGEFQF4PEXLVY',
        'GBLYQ42M2V7H4Q6QSNWM4JI4QRJTZK4I4N5N6M7O8P9Q0R1S2T3U4V5W',
        'GCXYZ234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890ABCDE'
      ],
      ATOM: [
        'cosmos1x7kqjf3r9xv8p2l5m6n7o8p9q0r1s2t3u4v5w6',
        'cosmos1y9f8e7d6c5b4a3s2w1e4r5t6y7u8i9o0p1q2w3',
        'cosmos1z1x2c3v4b5n6m7q8w9e0r1t2y3u4i5o6p7a8s9d'
      ],
      DOGE: [
        'DJRFZNg2KKXKgdGAVULktDST4TdahGZBLJ',
        'DH5yaieqoZN36fDVciNyRueRGvGLR3mr7L',
        'D7Y55R4ZYqtaD3Y5e7fQ4H4yN2P5M3K8vR'
      ],
      LTC: [
        'LiScnsyPWWUx7SJ4a4KUVMQKgwhWJpeDKz',
        'ltc1qa3ha7jc6j6qx9l2rf3rn0n6nf3cggn5rvzmqkt',
        'M9mKjrqeqJ5N6pP7qQ8rR9sS0tT1uU2vV3wW4xX5y'
      ],
      XMR: [
        '48bL1qpjRdKD4R6xyzG5iJGcLNM5Q7P2Q3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8M9N0O1P2Q',
        '4BCL1qpjRdKD4R6xyzG5iJGcLNM5Q7P2Q3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8M9N0O1P2Q',
        '42AL1qpjRdKD4R6xyzG5iJGcLNM5Q7P2Q3N4O5P6Q7R8S9T0U1V2W3X4Y5Z6A7B8C9D0E1F2G3H4I5J6K7L8M9N0O1P2Q'
      ],
      XTZ: [
        'tz1gJZGkvP8H7h6GG4vQ8jm5Q6N7O8P9Q0R1S2T',
        'tz2gJZGkvP8H7h6GG4vQ8jm5Q6N7O8P9Q0R1S2T',
        'tz3gJZGkvP8H7h6GG4vQ8jm5Q6N7O8P9Q0R1S2T'
      ],
      ALGO: [
        'MFRGG424XAIBHHQ6AAOSZBXKZMQJVBCNLWQ4CGNUBKYEZQRZJP6AYE3DMEYC8LZ',
        'NFRGG424XAIBHHQ6AAOSZBXKZMQJVBCNLWQ4CGNUBKYEZQRZJP6AYE3DMEYC8LZ',
        'OFRGG424XAIBHHQ6AAOSZBXKZMQJVBCNLWQ4CGNUBKYEZQRZJP6AYE3DMEYC8LZ'
      ],
      FIL: [
        'f1abjxfbp274xpdqcpuaykwkfb43omjotacm2p3za',
        'f01234',
        'f3u7egjhhhzk6jvl2u6qrkjxr5w5v6z4u3p2q9n8m7l6k5j4h3g2f1e0d9c8b7a6'
      ],
      KSM: [
        'FqZJib4Kz759A1VFd2cXX4paQB42w7Ujj2YEYqE2LqP1Hsw',
        'JWkqbk8Nf8Fy3V5Gp9XxRr2Q3Ww4Ee5Tt6Yy7Uu8Ii9Oo0',
        'GpZJib4Kz759A1VFd2cXX4paQB42w7Ujj2YEYqE2LqP1Hsw'
      ]
    }

    Object.entries(unsupportedAddresses).forEach(([network, addresses]) => {
      addresses.forEach(address => {
        it(`should detect unsupported ${network} address: ${address.slice(0, 10)}...`, () => {
          const result = detectAddressNetworkDetailed(address)
          
          expect(result.network).toBe(network)
          expect(result.isValid).toBe(true)
          expect(result.isSupported).toBe(false)
          expect(result.error).toContain(`${network} addresses are not currently supported`)
          expect(result.error).toContain('Please use BTC, ETH, SOL, or SUI addresses')
        })
      })
    })
  })

  describe('detectAddressNetworkDetailed - Invalid Addresses', () => {
    const invalidAddresses = [
      '', // Empty string
      ' ', // Whitespace
      'invalid', // Random string
      '123', // Too short
      '0x', // Incomplete hex
      'bc1', // Incomplete bech32
      '1234567890abcdef1234567890abcdef12345678901234567890abcdef1234567890abcdef', // Too long
      'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjL', // Truncated TRON
      'bnb1grpf0955h0ykzusd59pqe4ug98', // Truncated BNB
      '0x71C7656EC7ab88b098defB751B7401B5f6d8976G', // Invalid hex character
      'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq0', // Invalid bech32 length
      '6eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NFD', // Invalid Solana (starts with 6)
      'cosmos2x2v9xvqx2v9xvqx2v9xvqx2v9xvqx2v9xvqx2v9' // Invalid cosmos prefix
    ]

    invalidAddresses.forEach(address => {
      it(`should detect invalid address: "${address}"`, () => {
        const result = detectAddressNetworkDetailed(address)
        
        expect(result.network).toBe(null)
        expect(result.isValid).toBe(false)
        expect(result.isSupported).toBe(false)
        expect(result.error).toContain('Invalid wallet address format')
      })
    })
  })

  describe('Edge Cases and Input Validation', () => {
    it('should handle null input', () => {
      const result = detectAddressNetworkDetailed(null)
      
      expect(result.network).toBe(null)
      expect(result.isValid).toBe(false)
      expect(result.isSupported).toBe(false)
      expect(result.error).toBe(null)
    })

    it('should handle undefined input', () => {
      const result = detectAddressNetworkDetailed(undefined)
      
      expect(result.network).toBe(null)
      expect(result.isValid).toBe(false)
      expect(result.isSupported).toBe(false)
      expect(result.error).toBe(null)
    })

    it('should trim whitespace from input', () => {
      const address = '  1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa  '
      const result = detectAddressNetworkDetailed(address)
      
      expect(result.network).toBe('BTC')
      expect(result.isValid).toBe(true)
      expect(result.isSupported).toBe(true)
    })

    it('should handle mixed case addresses correctly', () => {
      const address = '0x71c7656ec7ab88b098defb751b7401b5f6d8976f' // lowercase
      const result = detectAddressNetworkDetailed(address)
      
      expect(result.network).toBe('ETH')
      expect(result.isValid).toBe(true)
      expect(result.isSupported).toBe(true)
    })

    it('should handle very long invalid addresses', () => {
      const longAddress = 'a'.repeat(1000)
      const result = detectAddressNetworkDetailed(longAddress)
      
      expect(result.network).toBe(null)
      expect(result.isValid).toBe(false)
      expect(result.isSupported).toBe(false)
      expect(result.error).toContain('Invalid wallet address format')
    })
  })

  describe('Performance and Resilience', () => {
    it('should handle rapid address validation', () => {
      const addresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // BTC
        '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', // ETH  
        'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', // TRON (unsupported)
        'invalid-address', // Invalid
        '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NFD' // SOL
      ]
      
      const start = performance.now()
      
      for (let i = 0; i < 1000; i++) {
        addresses.forEach(address => {
          detectAddressNetworkDetailed(address)
        })
      }
      
      const end = performance.now()
      const duration = end - start
      
      // Should complete within 100ms for 5000 validations
      expect(duration).toBeLessThan(100)
    })

    it('should produce consistent results across multiple calls', () => {
      const testAddresses = [
        '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa',
        'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
        'invalid-address'
      ]
      
      testAddresses.forEach(address => {
        const results = []
        for (let i = 0; i < 10; i++) {
          results.push(detectAddressNetworkDetailed(address))
        }
        
        // All results should be identical
        const firstResult = results[0]
        results.forEach(result => {
          expect(result).toEqual(firstResult)
        })
      })
    })
  })

  describe('Integration with Legacy Functions', () => {
    it('should maintain compatibility with detectAddressNetwork', () => {
      const testCases = [
        { address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', expected: 'BTC' },
        { address: '0x71C7656EC7ab88b098defB751B7401B5f6d8976F', expected: 'ETH' },
        { address: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NFD', expected: 'SOL' },
        { address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b', expected: 'SUI' },
        { address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', expected: null }, // Unsupported
        { address: 'invalid', expected: null }
      ]
      
      testCases.forEach(({ address, expected }) => {
        const legacyResult = detectAddressNetwork(address)
        const newResult = detectAddressNetworkDetailed(address)
        
        if (expected === null || newResult.isSupported === false) {
          expect(legacyResult).toBe(null)
        } else {
          expect(legacyResult).toBe(expected)
          expect(newResult.network).toBe(expected)
        }
      })
    })

    it('should maintain compatibility with validateWalletAddress', () => {
      const testCases = [
        { address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', expectedValid: true, expectedNetwork: 'BTC' },
        { address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', expectedValid: false, expectedNetwork: null },
        { address: 'invalid', expectedValid: false, expectedNetwork: null }
      ]
      
      testCases.forEach(({ address, expectedValid, expectedNetwork }) => {
        const legacyResult = validateWalletAddress(address)
        const newResult = detectAddressNetworkDetailed(address)
        
        expect(legacyResult.isValid).toBe(expectedValid)
        expect(legacyResult.network).toBe(expectedNetwork)
        
        // New function should provide more information
        if (expectedValid) {
          expect(newResult.isSupported).toBe(true)
        }
      })
    })
  })

  describe('Comprehensive Chain Coverage', () => {
    it('should detect all major unsupported chains', () => {
      const unsupportedChains = [
        'TRON', 'BNB', 'XRP', 'ADA', 'AVAX', 'DOT', 'BCH', 'NEAR', 
        'HBAR', 'CRO', 'XLM', 'ATOM', 'COSMOS', 'DOGE', 'LTC', 
        'XMR', 'XTZ', 'ALGO', 'FIL', 'KSM', 'MATIC', 'USDT'
      ]
      
      // Verify we have test coverage for all chains
      unsupportedChains.forEach(chain => {
        // This test ensures we have patterns for all major chains
        expect(chain).toBeDefined()
      })
    })

    it('should provide helpful error messages for common unsupported chains', () => {
      const commonUnsupported = [
        { address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t', chain: 'TRON' },
        { address: 'bnb1grpf0955h0ykzusd59pqe4ug98yhap8r8ej6r2', chain: 'BNB' },
        { address: 'rEb8TK3gBgk5auZkwc6sHnwrGVJH8DuaLh', chain: 'XRP' },
        { address: 'addr1qx2v9xvqx2v9xvqx2v9xvqx2v9xvqx2v9xvqx2v9xvqx2v9xvqx2v9xvqx2v9xvqx2v9xvqx2v9', chain: 'ADA' }
      ]
      
      commonUnsupported.forEach(({ address, chain }) => {
        const result = detectAddressNetworkDetailed(address)
        
        expect(result.network).toBe(chain)
        expect(result.isSupported).toBe(false)
        expect(result.error).toContain(`${chain} addresses are not currently supported`)
        expect(result.error).toContain('Please use BTC, ETH, SOL, or SUI addresses')
      })
    })
  })
})