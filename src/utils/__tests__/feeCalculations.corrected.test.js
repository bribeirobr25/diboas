import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { FeeCalculator } from '../feeCalculations.js'

describe('Fee Calculations - Corrected Fee Structure', () => {
  let feeCalculator

  beforeEach(() => {
    feeCalculator = new FeeCalculator()
  })

  const calculateTransactionFees = (transactionData) => {
    return feeCalculator.calculateTransactionFeesSync(transactionData)
  }
  describe('DEX Fee Corrections', () => {
    it('should calculate 0.2% DEX fee for Buy transactions with diBoaS wallet', () => {
      const transactionData = {
        type: 'buy',
        amount: 1000,
        paymentMethod: 'diboas_wallet',
        asset: 'BTC'
      }
      
      const fees = calculateTransactionFees(transactionData)
      
      expect(fees.dex).toBe(2) // 1000 * 0.002 = 2
      expect(fees.provider).toBe(2) // Provider fee should match DEX fee
    })

    it('should calculate 0.2% DEX fee for Sell transactions', () => {
      const transactionData = {
        type: 'sell',
        amount: 2000,
        paymentMethod: 'diboas_wallet',
        asset: 'ETH'
      }
      
      const fees = calculateTransactionFees(transactionData)
      
      expect(fees.dex).toBe(4) // 2000 * 0.002 = 4
      expect(fees.provider).toBe(4) // Provider fee should match DEX fee
    })

    it('should NOT charge DEX fee for Buy with external payment methods', () => {
      const transactionData = {
        type: 'buy',
        amount: 1000,
        paymentMethod: 'credit_debit_card',
        asset: 'BTC'
      }
      
      const fees = calculateTransactionFees(transactionData)
      
      expect(fees.dex).toBe(0)
      expect(fees.provider).toBe(10) // Should be payment provider fee instead (1%)
    })

    it('should calculate DEX fee for Transfer transactions', () => {
      const transactionData = {
        type: 'transfer',
        amount: 500,
        paymentMethod: 'external_wallet',
        asset: 'SOL',
        recipient: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' // BTC address for cross-chain
      }
      
      const fees = calculateTransactionFees(transactionData)
      
      // For transfer, DEX fee should be 0.8% (external wallet)
      expect(fees.provider).toBe(4) // 500 * 0.008 = 4
    })

    it('should calculate DEX fee for Withdraw to external wallet', () => {
      const transactionData = {
        type: 'withdraw',
        amount: 1000,
        paymentMethod: 'external_wallet',
        asset: 'BTC',
        recipient: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' // BTC address for cross-chain
      }
      
      const fees = calculateTransactionFees(transactionData)
      
      // For external wallet withdraw, DEX fee should be 0.8%
      expect(fees.provider).toBe(8) // 1000 * 0.008 = 8
    })
  })

  describe('FinObjective DeFi Strategy Fees', () => {
    it('should calculate 0.5% DeFi fee for strategy_start', () => {
      const transactionData = {
        type: 'strategy_start',
        amount: 10000,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC'
      }
      
      const fees = calculateTransactionFees(transactionData)
      
      expect(fees.provider).toBe(50) // 10000 * 0.005 = 50
    })

    it('should calculate 0.5% DeFi fee for strategy_stop', () => {
      const transactionData = {
        type: 'strategy_stop',
        amount: 5000,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC'
      }
      
      const fees = calculateTransactionFees(transactionData)
      
      expect(fees.provider).toBe(25) // 5000 * 0.005 = 25
    })

    it('should include DeFi fees in total calculation', () => {
      const transactionData = {
        type: 'strategy_start',
        amount: 10000,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC'
      }
      
      const fees = calculateTransactionFees(transactionData)
      
      // Total should include diBoaS fee (0.09%) + DeFi fee (0.5%) + network fee
      const expectedDiBoaSFee = 10000 * 0.0009 // 9
      const expectedDeFiFee = 10000 * 0.005 // 50
      const expectedNetworkFee = fees.network // Variable based on asset
      const expectedTotal = expectedDiBoaSFee + expectedDeFiFee + expectedNetworkFee
      
      expect(fees.diBoaS).toBe(expectedDiBoaSFee)
      expect(fees.provider).toBe(expectedDeFiFee)
      expect(fees.total).toBeCloseTo(expectedTotal, 2)
    })
  })

  describe('Fee Structure Validation', () => {
    const testCases = [
      // Buy/Sell DEX fees
      { type: 'buy', paymentMethod: 'diboas_wallet', expectedDEXRate: 0.002 },
      { type: 'sell', paymentMethod: 'diboas_wallet', expectedDEXRate: 0.002 },
      
      // External wallet DEX fees
      { type: 'transfer', paymentMethod: 'external_wallet', expectedDEXRate: 0.008, recipient: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' },
      { type: 'withdraw', paymentMethod: 'external_wallet', expectedDEXRate: 0.008, recipient: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa' },
      
      // FinObjective DeFi fees
      { type: 'strategy_start', paymentMethod: 'diboas_wallet', expectedDeFiRate: 0.005 },
      { type: 'strategy_stop', paymentMethod: 'diboas_wallet', expectedDeFiRate: 0.005 }
    ]

    testCases.forEach(({ type, paymentMethod, expectedDEXRate, expectedDeFiRate, recipient }) => {
      it(`should apply correct fee rate for ${type} with ${paymentMethod}`, () => {
        const amount = 1000
        const transactionData = {
          type,
          amount,
          paymentMethod,
          asset: 'USDC',
          ...(recipient && { recipient })
        }
        
        const fees = calculateTransactionFees(transactionData)
        
        if (expectedDEXRate) {
          expect(fees.provider).toBe(amount * expectedDEXRate)
        }
        
        if (expectedDeFiRate) {
          expect(fees.provider).toBe(amount * expectedDeFiRate)
        }
      })
    })
  })

  describe('Edge Cases and Precision', () => {
    it('should handle small amounts with correct precision', () => {
      const transactionData = {
        type: 'buy',
        amount: 1, // $1
        paymentMethod: 'diboas_wallet',
        asset: 'BTC'
      }
      
      const fees = calculateTransactionFees(transactionData)
      
      expect(fees.dex).toBe(0.002) // 1 * 0.002 = 0.002
      expect(fees.provider).toBe(0.002)
    })

    it('should handle large amounts correctly', () => {
      const transactionData = {
        type: 'strategy_start',
        amount: 1000000, // $1M
        paymentMethod: 'diboas_wallet',
        asset: 'USDC'
      }
      
      const fees = calculateTransactionFees(transactionData)
      
      expect(fees.provider).toBe(5000) // 1000000 * 0.005 = 5000
    })

    it('should handle zero amount gracefully', () => {
      const transactionData = {
        type: 'buy',
        amount: 0,
        paymentMethod: 'diboas_wallet',
        asset: 'BTC'
      }
      
      const fees = calculateTransactionFees(transactionData)
      
      expect(fees.dex).toBe(0)
      expect(fees.provider).toBe(0)
      expect(fees.total).toBeGreaterThanOrEqual(0)
    })

    it('should maintain fee structure consistency across asset types', () => {
      const assets = ['BTC', 'ETH', 'SOL', 'SUI', 'USDC']
      const amount = 1000
      
      assets.forEach(asset => {
        const transactionData = {
          type: 'buy',
          amount,
          paymentMethod: 'diboas_wallet',
          asset
        }
        
        const fees = calculateTransactionFees(transactionData)
        
        // DEX fee should be consistent regardless of asset
        expect(fees.dex).toBe(2) // 1000 * 0.002 = 2
        expect(fees.provider).toBe(2)
      })
    })
  })

  describe('Backward Compatibility', () => {
    it('should maintain existing fee structure for non-affected transactions', () => {
      // Add transaction should not be affected by DEX fee changes
      const transactionData = {
        type: 'add',
        amount: 1000,
        paymentMethod: 'credit_debit_card',
        asset: 'USDC'
      }
      
      const fees = calculateTransactionFees(transactionData)
      
      expect(fees.dex).toBe(0) // No DEX fee for add
      expect(fees.provider).toBe(10) // Standard payment provider fee (1%)
    })

    it('should maintain send transaction fees', () => {
      const transactionData = {
        type: 'send',
        amount: 500,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC'
      }
      
      const fees = calculateTransactionFees(transactionData)
      
      // Send should have diBoaS fee (0.09%) and network fee, but no DEX fee
      expect(fees.diBoaS).toBe(500 * 0.0009) // 0.45
      expect(fees.dex).toBe(0)
    })

    it('should maintain receive transaction fees', () => {
      const transactionData = {
        type: 'receive',
        amount: 300,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC'
      }
      
      const fees = calculateTransactionFees(transactionData)
      
      // Receive should have minimal fees
      expect(fees.diBoaS).toBe(0) // No diBoaS fee for receive
      expect(fees.dex).toBe(0) // No DEX fee for receive
    })
  })

  describe('Fee Calculation Performance', () => {
    it('should calculate fees efficiently for multiple transactions', () => {
      const start = performance.now()
      
      // Calculate fees for 1000 transactions
      for (let i = 0; i < 1000; i++) {
        calculateTransactionFees({
          type: 'buy',
          amount: 1000,
          paymentMethod: 'diboas_wallet',
          asset: 'BTC'
        })
      }
      
      const end = performance.now()
      const duration = end - start
      
      // Should complete within 100ms for 1000 calculations
      expect(duration).toBeLessThan(100)
    })

    it('should produce consistent results across multiple calls', () => {
      const transactionData = {
        type: 'strategy_start',
        amount: 5000,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC'
      }
      
      const results = []
      for (let i = 0; i < 10; i++) {
        results.push(calculateTransactionFees(transactionData))
      }
      
      // All results should be identical
      const firstResult = results[0]
      results.forEach(result => {
        expect(result).toEqual(firstResult)
      })
    })
  })
})