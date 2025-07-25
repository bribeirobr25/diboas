/**
 * Comprehensive Unit Tests for Fee Calculations
 * Tests all fee calculation scenarios, edge cases, and network-specific logic
 */

import { describe, it, expect, beforeEach } from 'vitest'
import { FeeCalculator } from '../feeCalculations.js'

describe('Fee Calculations', () => {
  let feeCalculator

  beforeEach(() => {
    feeCalculator = new FeeCalculator()
  })

  describe('Initialization', () => {
    it('should initialize with correct fee rates', () => {
      expect(feeCalculator.diBoaSFees).toEqual({
        add: 0.0009,      // 0.09%
        withdraw: 0.009,  // 0.9%
        send: 0.0009,     // 0.09%
        transfer: 0.009,  // 0.9%
        buy: 0.0009,      // 0.09%
        sell: 0.0009      // 0.09%
      })
    })

    it('should initialize with correct network fees', () => {
      expect(feeCalculator.networkFees).toEqual({
        BTC: 0.09,    // 9%
        ETH: 0.005,   // 0.5%
        SOL: 0.00001, // 0.001%
        SUI: 0.00003  // 0.003%
      })
    })

    it('should initialize with correct provider fees', () => {
      expect(feeCalculator.providerFees).toEqual({
        onRamp: {
          apple_pay: 0.005,    // 0.5%
          google_pay: 0.005,   // 0.5%
          credit_card: 0.01,   // 1%
          bank_account: 0.01,  // 1%
          paypal: 0.03         // 3%
        },
        offRamp: {
          apple_pay: 0.01,     // 1%
          google_pay: 0.01,    // 1%
          credit_card: 0.02,   // 2%
          bank_account: 0.02,  // 2%
          paypal: 0.04         // 4%
        },
        dex: 0.01 // 1% for DEX operations
      })
    })
  })

  describe('diBoaS Fee Calculations', () => {
    const transactionAmounts = [10, 50, 100, 500, 1000, 5000, 10000]

    describe('Add Transaction Fees (0.09%)', () => {
      transactionAmounts.forEach(amount => {
        it(`should calculate correct diBoaS fee for $${amount} add transaction`, () => {
          const fee = feeCalculator.calculateDiBoaSFee('add', amount)
          const expectedFee = amount * 0.0009
          expect(fee).toBeCloseTo(expectedFee, 6)
        })
      })
    })

    describe('Withdraw Transaction Fees (0.9%)', () => {
      transactionAmounts.forEach(amount => {
        it(`should calculate correct diBoaS fee for $${amount} withdraw transaction`, () => {
          const fee = feeCalculator.calculateDiBoaSFee('withdraw', amount)
          const expectedFee = amount * 0.009
          expect(fee).toBeCloseTo(expectedFee, 6)
        })
      })
    })

    describe('Send Transaction Fees (0.09%)', () => {
      transactionAmounts.forEach(amount => {
        it(`should calculate correct diBoaS fee for $${amount} send transaction`, () => {
          const fee = feeCalculator.calculateDiBoaSFee('send', amount)
          const expectedFee = amount * 0.0009
          expect(fee).toBeCloseTo(expectedFee, 6)
        })
      })
    })

    describe('Transfer Transaction Fees (0.9%)', () => {
      transactionAmounts.forEach(amount => {
        it(`should calculate correct diBoaS fee for $${amount} transfer transaction`, () => {
          const fee = feeCalculator.calculateDiBoaSFee('transfer', amount)
          const expectedFee = amount * 0.009
          expect(fee).toBeCloseTo(expectedFee, 6)
        })
      })
    })

    describe('Buy Transaction Fees (0.09%)', () => {
      transactionAmounts.forEach(amount => {
        it(`should calculate correct diBoaS fee for $${amount} buy transaction`, () => {
          const fee = feeCalculator.calculateDiBoaSFee('buy', amount)
          const expectedFee = amount * 0.0009
          expect(fee).toBeCloseTo(expectedFee, 6)
        })
      })
    })

    describe('Sell Transaction Fees (0.09%)', () => {
      transactionAmounts.forEach(amount => {
        it(`should calculate correct diBoaS fee for $${amount} sell transaction`, () => {
          const fee = feeCalculator.calculateDiBoaSFee('sell', amount)
          const expectedFee = amount * 0.0009
          expect(fee).toBeCloseTo(expectedFee, 6)
        })
      })
    })

    describe('Edge Cases', () => {
      it('should handle very small amounts', () => {
        const fee = feeCalculator.calculateDiBoaSFee('add', 0.01)
        expect(fee).toBeCloseTo(0.000009, 8)
      })

      it('should handle very large amounts', () => {
        const fee = feeCalculator.calculateDiBoaSFee('withdraw', 1000000)
        expect(fee).toBeCloseTo(9000, 2)
      })

      it('should return 0 for zero amount', () => {
        const fee = feeCalculator.calculateDiBoaSFee('add', 0)
        expect(fee).toBe(0)
      })

      it('should throw error for negative amounts', () => {
        expect(() => {
          feeCalculator.calculateDiBoaSFee('add', -100)
        }).toThrow('Amount must be positive')
      })

      it('should throw error for invalid transaction type', () => {
        expect(() => {
          feeCalculator.calculateDiBoaSFee('invalid', 100)
        }).toThrow('Invalid transaction type')
      })
    })
  })

  describe('Network Fee Calculations', () => {
    const networks = [
      { chain: 'BTC', rate: 0.09, name: 'Bitcoin' },
      { chain: 'ETH', rate: 0.005, name: 'Ethereum' },
      { chain: 'SOL', rate: 0.00001, name: 'Solana' },
      { chain: 'SUI', rate: 0.00003, name: 'Sui' }
    ]

    networks.forEach(({ chain, rate, name }) => {
      describe(`${name} (${chain}) Network Fees`, () => {
        const amounts = [10, 100, 1000, 10000]

        amounts.forEach(amount => {
          it(`should calculate correct network fee for $${amount} on ${chain}`, () => {
            const fee = feeCalculator.calculateNetworkFee(chain, amount)
            const expectedFee = amount * rate
            expect(fee).toBeCloseTo(expectedFee, 8)
          })
        })

        it(`should handle minimum transaction amounts on ${chain}`, () => {
          const fee = feeCalculator.calculateNetworkFee(chain, 0.01)
          const expectedFee = 0.01 * rate
          expect(fee).toBeCloseTo(expectedFee, 10)
        })

        it(`should handle maximum transaction amounts on ${chain}`, () => {
          const fee = feeCalculator.calculateNetworkFee(chain, 1000000)
          const expectedFee = 1000000 * rate
          expect(fee).toBeCloseTo(expectedFee, 2)
        })
      })
    })

    describe('Network Detection from Address', () => {
      const addressTests = [
        // Bitcoin addresses
        { address: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', expectedChain: 'BTC' },
        { address: '3J98t1WpEZ73CNmQviecrnyiWrnqRhWNLy', expectedChain: 'BTC' },
        { address: 'bc1qar0srrr7xfkvy5l643lydnw9re59gtzzwf5mdq', expectedChain: 'BTC' },
        
        // Ethereum addresses
        { address: '0x5aAeb6053F3E94C9b9A09f33669435E7Ef1BeAed', expectedChain: 'ETH' },
        { address: '0xd8dA6BF26964aF9D7eEd9e03E53415D37aA96045', expectedChain: 'ETH' },
        
        // Solana addresses
        { address: '5eykt4UsFv8P8NJdTREpY1vzqKqZKvdpKuc147dw2NFD', expectedChain: 'SOL' },
        { address: 'DQyrAcCrDXQ8NeoqGgDCZwBvWDcYmFCjSb9JtteuvPpz', expectedChain: 'SOL' },
        
        // Sui addresses
        { address: '0x1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1a2b3c4d5e6f', expectedChain: 'SUI' }
      ]

      addressTests.forEach(({ address, expectedChain }) => {
        it(`should detect ${expectedChain} from address ${address.substring(0, 10)}...`, () => {
          const detectedChain = feeCalculator.detectNetworkFromAddress(address)
          expect(detectedChain).toBe(expectedChain)
        })
      })

      it('should default to ETH for unrecognized addresses', () => {
        const unknownAddress = 'unknown_address_format'
        const detectedChain = feeCalculator.detectNetworkFromAddress(unknownAddress)
        expect(detectedChain).toBe('ETH')
      })

      it('should handle empty addresses', () => {
        const detectedChain = feeCalculator.detectNetworkFromAddress('')
        expect(detectedChain).toBe('ETH')
      })

      it('should handle null addresses', () => {
        const detectedChain = feeCalculator.detectNetworkFromAddress(null)
        expect(detectedChain).toBe('ETH')
      })
    })

    describe('Cross-chain Network Fees', () => {
      it('should calculate fees for single chain transactions', () => {
        const fee = feeCalculator.calculateCrossChainNetworkFees(['SOL'], 1000)
        expect(fee).toBeCloseTo(0.01, 6) // 1000 * 0.00001
      })

      it('should calculate fees for multi-chain transactions', () => {
        const fee = feeCalculator.calculateCrossChainNetworkFees(['SOL', 'BTC'], 1000)
        const expectedFee = (1000 * 0.00001) + (1000 * 0.09) // SOL + BTC fees
        expect(fee).toBeCloseTo(expectedFee, 6)
      })

      it('should deduplicate chains in multi-chain calculations', () => {
        const fee = feeCalculator.calculateCrossChainNetworkFees(['SOL', 'SOL', 'BTC'], 1000)
        const expectedFee = (1000 * 0.00001) + (1000 * 0.09) // Only unique chains
        expect(fee).toBeCloseTo(expectedFee, 6)
      })
    })
  })

  describe('Provider Fee Calculations', () => {
    describe('On-Ramp Provider Fees', () => {
      const onRampMethods = [
        { method: 'apple_pay', rate: 0.005, name: 'Apple Pay' },
        { method: 'google_pay', rate: 0.005, name: 'Google Pay' },
        { method: 'credit_card', rate: 0.01, name: 'Credit Card' },
        { method: 'bank_account', rate: 0.01, name: 'Bank Account' },
        { method: 'paypal', rate: 0.03, name: 'PayPal' }
      ]

      onRampMethods.forEach(({ method, rate, name }) => {
        const amounts = [50, 100, 500, 1000]

        amounts.forEach(amount => {
          it(`should calculate correct on-ramp fee for $${amount} using ${name}`, () => {
            const fee = feeCalculator.calculateProviderFee('add', method, amount)
            const expectedFee = amount * rate
            expect(fee).toBeCloseTo(expectedFee, 6)
          })
        })
      })
    })

    describe('Off-Ramp Provider Fees', () => {
      const offRampMethods = [
        { method: 'apple_pay', rate: 0.01, name: 'Apple Pay' },
        { method: 'google_pay', rate: 0.01, name: 'Google Pay' },
        { method: 'credit_card', rate: 0.02, name: 'Credit Card' },
        { method: 'bank_account', rate: 0.02, name: 'Bank Account' },
        { method: 'paypal', rate: 0.04, name: 'PayPal' }
      ]

      offRampMethods.forEach(({ method, rate, name }) => {
        const amounts = [50, 100, 500, 1000]

        amounts.forEach(amount => {
          it(`should calculate correct off-ramp fee for $${amount} using ${name}`, () => {
            const fee = feeCalculator.calculateProviderFee('withdraw', method, amount)
            const expectedFee = amount * rate
            expect(fee).toBeCloseTo(expectedFee, 6)
          })
        })
      })
    })

    describe('DEX Provider Fees', () => {
      const dexTransactions = ['buy', 'sell']

      dexTransactions.forEach(transactionType => {
        it(`should calculate correct DEX fee for ${transactionType} transactions`, () => {
          const fee = feeCalculator.calculateProviderFee(transactionType, 'diboas_wallet', 1000)
          const expectedFee = 1000 * 0.01 // 1% DEX fee
          expect(fee).toBeCloseTo(expectedFee, 6)
        })
      })

      it('should return 0 DEX fee for P2P transactions', () => {
        const fee = feeCalculator.calculateProviderFee('send', 'diboas_wallet', 1000)
        expect(fee).toBe(0)
      })

      it('should return 0 DEX fee for transfer transactions', () => {
        const fee = feeCalculator.calculateProviderFee('transfer', 'diboas_wallet', 1000)
        expect(fee).toBe(0)
      })
    })

    describe('Provider Fee Edge Cases', () => {
      it('should return 0 for unknown payment methods', () => {
        const fee = feeCalculator.calculateProviderFee('add', 'unknown_method', 1000)
        expect(fee).toBe(0)
      })

      it('should return 0 for unknown transaction types', () => {
        const fee = feeCalculator.calculateProviderFee('unknown', 'credit_card', 1000)
        expect(fee).toBe(0)
      })

      it('should handle zero amounts', () => {
        const fee = feeCalculator.calculateProviderFee('add', 'credit_card', 0)
        expect(fee).toBe(0)
      })

      it('should throw error for negative amounts', () => {
        expect(() => {
          feeCalculator.calculateProviderFee('add', 'credit_card', -100)
        }).toThrow('Amount must be positive')
      })
    })
  })

  describe('Comprehensive Fee Calculations', () => {
    describe('Add Transaction Fee Breakdown', () => {
      it('should calculate complete fee breakdown for add transaction with credit card', () => {
        const fees = feeCalculator.calculateComprehensiveFees({
          type: 'add',
          amount: 1000,
          paymentMethod: 'credit_card',
          chains: ['SOL']
        })

        expect(fees.diBoaS).toBeCloseTo(0.9, 6)     // 1000 * 0.0009
        expect(fees.network).toBeCloseTo(0.01, 6)   // 1000 * 0.00001
        expect(fees.provider).toBeCloseTo(10, 6)    // 1000 * 0.01
        expect(fees.total).toBeCloseTo(10.91, 6)    // Sum of all fees
      })

      it('should include proper fee breakdown structure', () => {
        const fees = feeCalculator.calculateComprehensiveFees({
          type: 'add',
          amount: 1000,
          paymentMethod: 'paypal',
          chains: ['SOL']
        })

        expect(fees.breakdown).toHaveLength(3)
        expect(fees.breakdown[0].type).toBe('diBoaS')
        expect(fees.breakdown[1].type).toBe('network')
        expect(fees.breakdown[2].type).toBe('provider')
      })
    })

    describe('Withdraw Transaction Fee Breakdown', () => {
      it('should calculate complete fee breakdown for withdraw transaction', () => {
        const fees = feeCalculator.calculateComprehensiveFees({
          type: 'withdraw',
          amount: 1000,
          paymentMethod: 'bank_account',
          chains: ['SOL']
        })

        expect(fees.diBoaS).toBeCloseTo(9, 6)       // 1000 * 0.009
        expect(fees.network).toBeCloseTo(0.01, 6)   // 1000 * 0.00001
        expect(fees.provider).toBeCloseTo(20, 6)    // 1000 * 0.02
        expect(fees.total).toBeCloseTo(29.01, 6)    // Sum of all fees
      })
    })

    describe('Send Transaction Fee Breakdown', () => {
      it('should calculate complete fee breakdown for P2P send transaction', () => {
        const fees = feeCalculator.calculateComprehensiveFees({
          type: 'send',
          amount: 1000,
          paymentMethod: 'diboas_wallet',
          chains: ['SOL']
        })

        expect(fees.diBoaS).toBeCloseTo(0.9, 6)     // 1000 * 0.0009
        expect(fees.network).toBeCloseTo(0.01, 6)   // 1000 * 0.00001
        expect(fees.provider).toBe(0)               // No provider fee for P2P
        expect(fees.total).toBeCloseTo(0.91, 6)     // Sum of all fees
      })
    })

    describe('Transfer Transaction Fee Breakdown', () => {
      it('should calculate complete fee breakdown for external transfer', () => {
        const fees = feeCalculator.calculateComprehensiveFees({
          type: 'transfer',
          amount: 1000,
          paymentMethod: 'diboas_wallet',
          chains: ['SOL', 'BTC'] // Cross-chain transfer
        })

        expect(fees.diBoaS).toBeCloseTo(9, 6)       // 1000 * 0.009
        expect(fees.network).toBeCloseTo(90.01, 6)  // (1000 * 0.00001) + (1000 * 0.09)
        expect(fees.provider).toBe(0)               // No provider fee for transfers
        expect(fees.total).toBeCloseTo(99.01, 6)    // Sum of all fees
      })
    })

    describe('Buy Transaction Fee Breakdown', () => {
      it('should calculate fee breakdown for buy with external payment', () => {
        const fees = feeCalculator.calculateComprehensiveFees({
          type: 'buy',
          amount: 1000,
          paymentMethod: 'apple_pay',
          chains: ['BTC']
        })

        expect(fees.diBoaS).toBeCloseTo(0.9, 6)     // 1000 * 0.0009
        expect(fees.network).toBeCloseTo(90, 6)     // 1000 * 0.09
        expect(fees.provider).toBeCloseTo(5, 6)     // 1000 * 0.005 (Apple Pay)
        expect(fees.total).toBeCloseTo(95.9, 6)     // Sum of all fees
      })

      it('should calculate fee breakdown for buy with diBoaS wallet', () => {
        const fees = feeCalculator.calculateComprehensiveFees({
          type: 'buy',
          amount: 1000,
          paymentMethod: 'diboas_wallet',
          chains: ['ETH']
        })

        expect(fees.diBoaS).toBeCloseTo(0.9, 6)     // 1000 * 0.0009
        expect(fees.network).toBeCloseTo(5, 6)      // 1000 * 0.005
        expect(fees.provider).toBeCloseTo(10, 6)    // 1000 * 0.01 (DEX fee)
        expect(fees.total).toBeCloseTo(15.9, 6)     // Sum of all fees
      })
    })

    describe('Sell Transaction Fee Breakdown', () => {
      it('should calculate complete fee breakdown for sell transaction', () => {
        const fees = feeCalculator.calculateComprehensiveFees({
          type: 'sell',
          amount: 1000,
          paymentMethod: 'diboas_wallet', // Always uses diBoaS wallet
          chains: ['BTC', 'SOL'] // From BTC chain to SOL chain
        })

        expect(fees.diBoaS).toBeCloseTo(0.9, 6)     // 1000 * 0.0009
        expect(fees.network).toBeCloseTo(90.01, 6)  // (1000 * 0.09) + (1000 * 0.00001)
        expect(fees.provider).toBeCloseTo(10, 6)    // 1000 * 0.01 (DEX fee)
        expect(fees.total).toBeCloseTo(100.91, 6)   // Sum of all fees
      })
    })
  })

  describe('Fee Caching and Optimization', () => {
    beforeEach(() => {
      // Mock cache for testing
      feeCalculator.cache = new Map()
    })

    it('should cache fee calculations for identical parameters', () => {
      const params = {
        type: 'add',
        amount: 1000,
        paymentMethod: 'credit_card',
        chains: ['SOL']
      }

      // First calculation
      const fees1 = feeCalculator.calculateComprehensiveFees(params)
      
      // Second calculation should use cache
      const fees2 = feeCalculator.calculateComprehensiveFees(params)
      
      expect(fees1).toEqual(fees2)
      expect(feeCalculator.cache.size).toBe(1)
    })

    it('should not cache results for different parameters', () => {
      const params1 = {
        type: 'add',
        amount: 1000,
        paymentMethod: 'credit_card',
        chains: ['SOL']
      }
      
      const params2 = {
        type: 'add',
        amount: 2000, // Different amount
        paymentMethod: 'credit_card',
        chains: ['SOL']
      }

      feeCalculator.calculateComprehensiveFees(params1)
      feeCalculator.calculateComprehensiveFees(params2)
      
      expect(feeCalculator.cache.size).toBe(2)
    })

    it('should clear cache when requested', () => {
      const params = {
        type: 'add',
        amount: 1000,
        paymentMethod: 'credit_card',
        chains: ['SOL']
      }

      feeCalculator.calculateComprehensiveFees(params)
      expect(feeCalculator.cache.size).toBe(1)
      
      feeCalculator.clearCache()
      expect(feeCalculator.cache.size).toBe(0)
    })
  })

  describe('Edge Cases and Error Handling', () => {
    describe('Input Validation', () => {
      it('should handle missing transaction type', () => {
        expect(() => {
          feeCalculator.calculateComprehensiveFees({
            amount: 1000,
            paymentMethod: 'credit_card',
            chains: ['SOL']
          })
        }).toThrow('Transaction type is required')
      })

      it('should handle missing amount', () => {
        expect(() => {
          feeCalculator.calculateComprehensiveFees({
            type: 'add',
            paymentMethod: 'credit_card',
            chains: ['SOL']
          })
        }).toThrow('Amount is required')
      })

      it('should handle missing chains', () => {
        expect(() => {
          feeCalculator.calculateComprehensiveFees({
            type: 'add',
            amount: 1000,
            paymentMethod: 'credit_card'
          })
        }).toThrow('Chains array is required')
      })
    })

    describe('Precision and Rounding', () => {
      it('should handle very small amounts with proper precision', () => {
        const fees = feeCalculator.calculateComprehensiveFees({
          type: 'send',
          amount: 0.01,
          paymentMethod: 'diboas_wallet',
          chains: ['SOL']
        })

        expect(fees.diBoaS).toBeCloseTo(0.000009, 8)
        expect(fees.network).toBeCloseTo(0.0000001, 10)
        expect(fees.total).toBeCloseTo(0.0000091, 8)
      })

      it('should handle very large amounts without overflow', () => {
        const fees = feeCalculator.calculateComprehensiveFees({
          type: 'withdraw',
          amount: 10000000, // 10 million
          paymentMethod: 'bank_account',
          chains: ['SOL']
        })

        expect(fees.diBoaS).toBeCloseTo(90000, 2)    // 10M * 0.009
        expect(fees.network).toBeCloseTo(100, 2)     // 10M * 0.00001
        expect(fees.provider).toBeCloseTo(200000, 2) // 10M * 0.02
        expect(fees.total).toBeCloseTo(290100, 2)    // Sum
      })

      it('should maintain precision with decimal inputs', () => {
        const fees = feeCalculator.calculateComprehensiveFees({
          type: 'add',
          amount: 123.456,
          paymentMethod: 'credit_card',
          chains: ['SOL']
        })

        expect(fees.diBoaS).toBeCloseTo(0.1111104, 7)   // 123.456 * 0.0009
        expect(fees.network).toBeCloseTo(0.00123456, 8) // 123.456 * 0.00001
        expect(fees.provider).toBeCloseTo(1.23456, 6)   // 123.456 * 0.01
      })
    })

    describe('Boundary Conditions', () => {
      it('should handle minimum transaction amounts', () => {
        const fees = feeCalculator.calculateComprehensiveFees({
          type: 'send',
          amount: 5, // Minimum for send
          paymentMethod: 'diboas_wallet',
          chains: ['SOL']
        })

        expect(fees.total).toBeGreaterThan(0)
        expect(fees.total).toBeLessThan(1) // Should be very small fee
      })

      it('should handle maximum supported amounts', () => {
        const fees = feeCalculator.calculateComprehensiveFees({
          type: 'add',
          amount: Number.MAX_SAFE_INTEGER / 1000000, // Large but safe amount
          paymentMethod: 'credit_card',
          chains: ['SOL']
        })

        expect(fees.total).toBeFinite()
        expect(fees.total).toBeGreaterThan(0)
      })
    })
  })

  describe('Real-world Scenario Tests', () => {
    describe('Common Transaction Scenarios', () => {
      it('should calculate fees for typical small add transaction', () => {
        // User adds $50 with credit card
        const fees = feeCalculator.calculateComprehensiveFees({
          type: 'add',
          amount: 50,
          paymentMethod: 'credit_card',
          chains: ['SOL']
        })

        expect(fees.diBoaS).toBeCloseTo(0.045, 6)    // $0.045
        expect(fees.network).toBeCloseTo(0.0005, 6)  // $0.0005
        expect(fees.provider).toBeCloseTo(0.5, 6)    // $0.50
        expect(fees.total).toBeCloseTo(0.5455, 6)    // ~$0.55 total
      })

      it('should calculate fees for typical large withdrawal', () => {
        // User withdraws $5000 to bank account
        const fees = feeCalculator.calculateComprehensiveFees({
          type: 'withdraw',
          amount: 5000,
          paymentMethod: 'bank_account',
          chains: ['SOL']
        })

        expect(fees.diBoaS).toBeCloseTo(45, 6)       // $45
        expect(fees.network).toBeCloseTo(0.05, 6)    // $0.05
        expect(fees.provider).toBeCloseTo(100, 6)    // $100
        expect(fees.total).toBeCloseTo(145.05, 6)    // ~$145 total
      })

      it('should calculate fees for cross-chain Bitcoin transfer', () => {
        // User transfers $1000 to Bitcoin address
        const fees = feeCalculator.calculateComprehensiveFees({
          type: 'transfer',
          amount: 1000,
          paymentMethod: 'diboas_wallet',
          chains: ['SOL', 'BTC'] // From Solana to Bitcoin
        })

        expect(fees.diBoaS).toBeCloseTo(9, 6)        // $9 (0.9%)
        expect(fees.network).toBeCloseTo(90.01, 6)   // $90.01 (BTC network + SOL)
        expect(fees.provider).toBe(0)                // No provider fee
        expect(fees.total).toBeCloseTo(99.01, 6)     // ~$99 total (high due to BTC fees)
      })

      it('should calculate fees for ETH purchase with Apple Pay', () => {
        // User buys $2000 of ETH with Apple Pay
        const fees = feeCalculator.calculateComprehensiveFees({
          type: 'buy',
          amount: 2000,
          paymentMethod: 'apple_pay',
          chains: ['ETH']
        })

        expect(fees.diBoaS).toBeCloseTo(1.8, 6)      // $1.80
        expect(fees.network).toBeCloseTo(10, 6)      // $10 (ETH network)
        expect(fees.provider).toBeCloseTo(10, 6)     // $10 (Apple Pay 0.5%)
        expect(fees.total).toBeCloseTo(21.8, 6)      // ~$22 total
      })
    })

    describe('Cost Comparison Scenarios', () => {
      it('should show Solana is cheaper than Bitcoin for transfers', () => {
        const amount = 1000
        
        const solanaFees = feeCalculator.calculateComprehensiveFees({
          type: 'send',
          amount,
          paymentMethod: 'diboas_wallet',
          chains: ['SOL']
        })
        
        const bitcoinFees = feeCalculator.calculateComprehensiveFees({
          type: 'transfer',
          amount,
          paymentMethod: 'diboas_wallet',
          chains: ['BTC']
        })

        expect(solanaFees.total).toBeLessThan(bitcoinFees.total)
        expect(bitcoinFees.total - solanaFees.total).toBeGreaterThan(80) // Bitcoin ~$90 more expensive
      })

      it('should show diBoaS wallet is cheaper than external payments for buy', () => {
        const amount = 1000
        
        const diboasWalletFees = feeCalculator.calculateComprehensiveFees({
          type: 'buy',
          amount,
          paymentMethod: 'diboas_wallet',
          chains: ['ETH']
        })
        
        const creditCardFees = feeCalculator.calculateComprehensiveFees({
          type: 'buy',
          amount,
          paymentMethod: 'credit_card',
          chains: ['ETH']
        })

        expect(diboasWalletFees.total).toBeLessThan(creditCardFees.total)
        // diBoaS wallet uses DEX fee (1%) vs credit card (varies, but typically higher)
      })
    })
  })
})