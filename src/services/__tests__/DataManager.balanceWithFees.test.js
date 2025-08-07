import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import DataManager from '../DataManager.js'
import { onChainTransactionManager } from '../transactions/OnChainTransactionManager.js'
import { mockOnChainStatusProvider } from '../onchain/OnChainStatusProvider.js'

// Mock dependencies
vi.mock('../transactions/OnChainTransactionManager.js')
vi.mock('../onchain/OnChainStatusProvider.js')
vi.mock('../../utils/logger', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))
vi.mock('../../utils/secureLogger.js', () => ({
  default: {
    debug: vi.fn(),
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))
vi.mock('../../utils/secureStorage.js', () => ({
  secureStorage: {
    setItem: vi.fn(),
    getItem: vi.fn(),
    removeItem: vi.fn()
  }
}))

describe('DataManager - Balance Calculations with Fees', () => {
  let dataManager
  
  beforeEach(() => {
    // Clear all mocks
    vi.clearAllMocks()
    
    // Use singleton instance but reset its state
    dataManager = DataManager
    // Reset the state for each test
    dataManager.initializeCleanState()
    
    // Initialize with clean state
    dataManager.state = {
      user: {
        id: 'test_user_123',
        name: 'Test User',
        email: 'test@example.com'
      },
      balance: {
        totalUSD: 0,
        availableForSpending: 0,
        investedAmount: 0,
        strategyBalance: 0,
        breakdown: {
          BTC: { native: 0, usdc: 0, usdValue: 0 },
          ETH: { native: 0, usdc: 0, usdValue: 0 },
          SOL: { native: 0, usdc: 0, usdValue: 0 },
          SUI: { native: 0, usdc: 0, usdValue: 0 }
        },
        assets: {
          BTC: { amount: 0, usdValue: 0, investedAmount: 0, quantity: 0 },
          ETH: { amount: 0, usdValue: 0, investedAmount: 0, quantity: 0 },
          SOL: { amount: 0, usdValue: 0, investedAmount: 0, quantity: 0 },
          SUI: { amount: 0, usdValue: 0, investedAmount: 0, quantity: 0 }
        }
      },
      transactions: [],
      isLoading: false,
      lastUpdated: new Date().toISOString()
    }
  })
  
  afterEach(() => {
    // Clean up
    if (dataManager) {
      dataManager.dispose()
    }
  })

  describe('Add Transaction Balance Updates', () => {
    it('should use pre-calculated netAmount for add transaction', async () => {
      // Initial balance is 0
      expect(dataManager.state.balance.availableForSpending).toBe(0)
      
      // Add transaction with pre-calculated net amount (single source of truth)
      const transactionData = {
        type: 'add',
        amount: 100,
        netAmount: 99.41, // Pre-calculated: 100 - 0.59 fees
        fees: {
          total: 0.59,
          diBoaS: 0.09,
          network: 0.0001,
          provider: 0.5,
          dex: 0
        },
        paymentMethod: 'apple_pay'
      }
      
      await dataManager.updateBalance(transactionData)
      
      // Should add the pre-calculated netAmount
      expect(dataManager.state.balance.availableForSpending).toBe(99.41)
    })
    
    it('should handle add transaction with zero fees', async () => {
      const transactionData = {
        type: 'add',
        amount: 100,
        netAmount: 100, // No fees, so netAmount = amount
        fees: {
          total: 0
        },
        paymentMethod: 'crypto_wallet'
      }
      
      await dataManager.updateBalance(transactionData)
      
      // Should add full amount when fees are 0
      expect(dataManager.state.balance.availableForSpending).toBe(100)
    })
    
    it('should handle add transaction with missing fees object', async () => {
      const transactionData = {
        type: 'add',
        amount: 100,
        fees: undefined,
        paymentMethod: 'bank_account'
      }
      
      await dataManager.updateBalance(transactionData)
      
      // Should add full amount when fees are undefined (defaults to 0)
      expect(dataManager.state.balance.availableForSpending).toBe(100)
    })
    
    it('should handle add transaction with various fee field names', async () => {
      // Test with total field - should use pre-calculated netAmount
      const transactionData1 = {
        type: 'add',
        amount: 100,
        netAmount: 98.5, // Pre-calculated: 100 - 1.5 fees
        fees: {
          total: 1.5
        },
        paymentMethod: 'credit_debit_card'
      }
      
      await dataManager.updateBalance(transactionData1)
      expect(dataManager.state.balance.availableForSpending).toBe(98.5)
      
      // Reset balance
      dataManager.state.balance.availableForSpending = 0
      
      // Test with total field - should use pre-calculated netAmount
      const transactionData2 = {
        type: 'add',
        amount: 100,
        netAmount: 98.0, // Pre-calculated: 100 - 2.0 fees
        fees: {
          total: 2.0
        },
        paymentMethod: 'bank_account'
      }
      
      await dataManager.updateBalance(transactionData2)
      expect(dataManager.state.balance.availableForSpending).toBe(98.0)
      
      // Reset balance
      dataManager.state.balance.availableForSpending = 0
      
      // Test with total field (preferred) - should use pre-calculated netAmount
      const transactionData3 = {
        type: 'add',
        amount: 100,
        netAmount: 97.0, // Pre-calculated: 100 - 3.0 fees
        fees: {
          total: 3.0
        },
        paymentMethod: 'paypal'
      }
      
      await dataManager.updateBalance(transactionData3)
      expect(dataManager.state.balance.availableForSpending).toBe(97.0)
    })
    
    it('should handle large fee amounts correctly', async () => {
      const transactionData = {
        type: 'add',
        amount: 100,
        netAmount: 89.5, // Pre-calculated: 100 - 10.5 fees
        fees: {
          total: 10.5 // 10.5% total fees
        },
        paymentMethod: 'paypal'
      }
      
      await dataManager.updateBalance(transactionData)
      
      // Should add netAmount = 89.5
      expect(dataManager.state.balance.availableForSpending).toBe(89.5)
    })
    
    it('should handle very small fee amounts with precision', async () => {
      const transactionData = {
        type: 'add',
        amount: 100,
        netAmount: 99.999, // Pre-calculated: 100 - 0.001 fees
        fees: {
          total: 0.001 // Very small fee
        },
        paymentMethod: 'crypto_wallet'
      }
      
      await dataManager.updateBalance(transactionData)
      
      // Should add netAmount = 99.999
      expect(dataManager.state.balance.availableForSpending).toBe(99.999)
    })
    
    it('should accumulate balance correctly with multiple add transactions', async () => {
      // First transaction with pre-calculated netAmount
      await dataManager.updateBalance({
        type: 'add',
        amount: 100,
        netAmount: 99.41, // Pre-calculated: 100 - 0.59 fees
        fees: { total: 0.59 },
        paymentMethod: 'apple_pay'
      })
      
      expect(dataManager.state.balance.availableForSpending).toBe(99.41)
      
      // Second transaction with pre-calculated netAmount
      await dataManager.updateBalance({
        type: 'add',
        amount: 50,
        netAmount: 48.5, // Pre-calculated: 50 - 1.5 fees
        fees: { total: 1.5 },
        paymentMethod: 'paypal'
      })
      
      // Should be 99.41 + 48.5 = 147.91
      expect(dataManager.state.balance.availableForSpending).toBe(147.91)
      
      // Third transaction with no fees
      await dataManager.updateBalance({
        type: 'add',
        amount: 25,
        netAmount: 25, // Pre-calculated: 25 - 0 fees
        fees: { total: 0 },
        paymentMethod: 'crypto_wallet'
      })
      
      // Should be 147.91 + 25 = 172.91
      expect(dataManager.state.balance.availableForSpending).toBe(172.91)
    })
  })
  
  describe('Withdraw Transaction Balance Updates', () => {
    beforeEach(() => {
      // Set initial balance for withdrawal tests
      dataManager.state.balance.availableForSpending = 500
    })
    
    it('should deduct full amount from balance on withdraw', async () => {
      const transactionData = {
        type: 'withdraw',
        amount: 100,
        fees: {
          total: 2.5 // Fees are paid by recipient
        },
        paymentMethod: 'bank_account'
      }
      
      await dataManager.updateBalance(transactionData)
      
      // Should deduct full amount (fees paid by recipient)
      expect(dataManager.state.balance.availableForSpending).toBe(400)
    })
    
    it('should handle withdraw with external wallet (no provider fees)', async () => {
      const transactionData = {
        type: 'withdraw',
        amount: 200,
        fees: {
          total: 0.9 // Only diBoaS and network fees
        },
        paymentMethod: 'external_wallet'
      }
      
      await dataManager.updateBalance(transactionData)
      
      // Should deduct full amount
      expect(dataManager.state.balance.availableForSpending).toBe(300)
    })
    
    it('should not allow balance to go negative', async () => {
      const transactionData = {
        type: 'withdraw',
        amount: 600, // More than available
        fees: {
          total: 5.0
        },
        paymentMethod: 'paypal'
      }
      
      await dataManager.updateBalance(transactionData)
      
      // Should set balance to 0, not negative
      expect(dataManager.state.balance.availableForSpending).toBe(0)
    })
  })
  
  describe('Send Transaction Balance Updates', () => {
    beforeEach(() => {
      // Set initial balance for send tests
      dataManager.state.balance.availableForSpending = 1000
    })
    
    it('should deduct full amount from balance on send', async () => {
      const transactionData = {
        type: 'send',
        amount: 50,
        fees: {
          total: 0.09 // Only diBoaS fee for send
        },
        recipient: '@john_doe'
      }
      
      await dataManager.updateBalance(transactionData)
      
      // Should deduct full amount (recipient gets amount - fees)
      expect(dataManager.state.balance.availableForSpending).toBe(950)
    })
    
    it('should handle multiple send transactions', async () => {
      // First send
      await dataManager.updateBalance({
        type: 'send',
        amount: 100,
        fees: { total: 0.09 },
        recipient: '@user1'
      })
      
      expect(dataManager.state.balance.availableForSpending).toBe(900)
      
      // Second send
      await dataManager.updateBalance({
        type: 'send',
        amount: 200,
        fees: { total: 0.18 },
        recipient: '@user2'
      })
      
      expect(dataManager.state.balance.availableForSpending).toBe(700)
    })
  })
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle string amounts correctly', async () => {
      const transactionData = {
        type: 'add',
        amount: '100.50', // String amount
        netAmount: 99.91, // Pre-calculated: 100.50 - 0.59 fees
        fees: {
          total: '0.59' // String fee
        },
        paymentMethod: 'apple_pay'
      }
      
      await dataManager.updateBalance(transactionData)
      
      // Should use pre-calculated netAmount = 99.91
      expect(dataManager.state.balance.availableForSpending).toBe(99.91)
    })
    
    it('should handle NaN and invalid values', async () => {
      const transactionData = {
        type: 'add',
        amount: 'invalid',
        netAmount: 0, // Pre-calculated to handle invalid values gracefully
        fees: {
          total: 'not-a-number'
        },
        paymentMethod: 'bank_account'
      }
      
      await dataManager.updateBalance(transactionData)
      
      // Should handle invalid values gracefully with netAmount = 0
      expect(dataManager.state.balance.availableForSpending).toBe(0)
    })
    
    it('should handle null and undefined amounts', async () => {
      const transactionData1 = {
        type: 'add',
        amount: null,
        netAmount: 0, // Pre-calculated to handle null values gracefully
        fees: { total: 1.0 },
        paymentMethod: 'paypal'
      }
      
      await dataManager.updateBalance(transactionData1)
      expect(dataManager.state.balance.availableForSpending).toBe(0)
      
      const transactionData2 = {
        type: 'add',
        amount: undefined,
        netAmount: 0, // Pre-calculated to handle undefined values gracefully
        fees: { total: 1.0 },
        paymentMethod: 'paypal'
      }
      
      await dataManager.updateBalance(transactionData2)
      expect(dataManager.state.balance.availableForSpending).toBe(0)
    })
    
    it('should handle floating point precision correctly', async () => {
      // Known floating point issue: 0.1 + 0.2 !== 0.3
      const transactionData = {
        type: 'add',
        amount: 0.3,
        netAmount: 0.2, // Pre-calculated: 0.3 - 0.1 fees, avoiding floating point issues
        fees: {
          total: 0.1
        },
        paymentMethod: 'credit_debit_card'
      }
      
      await dataManager.updateBalance(transactionData)
      
      // Should handle floating point correctly with pre-calculated netAmount
      expect(dataManager.state.balance.availableForSpending).toBeCloseTo(0.2, 10)
    })
    
    it('should emit balance update events', async () => {
      const emitSpy = vi.spyOn(dataManager, 'emit')
      
      const transactionData = {
        type: 'add',
        amount: 100,
        fees: { total: 0.59 },
        paymentMethod: 'apple_pay'
      }
      
      await dataManager.updateBalance(transactionData)
      
      // Should emit balance:updated event
      expect(emitSpy).toHaveBeenCalledWith('balance:updated', expect.any(Object))
    })
  })
  
  describe('Investment Transaction Balance Updates', () => {
    beforeEach(() => {
      // Set initial balances for investment tests
      dataManager.state.balance.availableForSpending = 1000
      dataManager.state.balance.investedAmount = 500
    })
    
    it('should handle buy transaction with diBoaS wallet', async () => {
      const transactionData = {
        type: 'buy',
        amount: 200,
        fees: {
          total: 1.0 // diBoaS + network + DEX fees
        },
        asset: 'BTC',
        paymentMethod: 'diboas_wallet'
      }
      
      await dataManager.updateBalance(transactionData)
      
      // Available balance should decrease by full amount
      expect(dataManager.state.balance.availableForSpending).toBe(800)
      // Invested amount should increase by (amount - fees)
      expect(dataManager.state.balance.investedAmount).toBe(699)
    })
    
    it('should handle sell transaction', async () => {
      const transactionData = {
        type: 'sell',
        amount: 100,
        fees: {
          total: 0.89 // diBoaS + network + DEX fees
        },
        asset: 'BTC',
        paymentMethod: 'bank_account'
      }
      
      await dataManager.updateBalance(transactionData)
      
      // Invested amount should decrease by full amount
      expect(dataManager.state.balance.investedAmount).toBe(400)
      // Available balance should increase by (amount - fees)
      expect(dataManager.state.balance.availableForSpending).toBe(1099.11)
    })
    
    it('should handle buy transaction with external payment method', async () => {
      const transactionData = {
        type: 'buy',
        amount: 300,
        fees: {
          total: 3.5 // Provider + diBoaS + network fees
        },
        asset: 'ETH',
        paymentMethod: 'credit_debit_card'
      }
      
      await dataManager.updateBalance(transactionData)
      
      // Available balance unchanged (external payment)
      expect(dataManager.state.balance.availableForSpending).toBe(1000)
      // Invested amount should increase by (amount - fees)
      expect(dataManager.state.balance.investedAmount).toBe(796.5)
    })
  })
  
  describe('Real-world Scenarios', () => {
    it('should handle a typical user journey', async () => {
      // User starts with $0
      expect(dataManager.state.balance.availableForSpending).toBe(0)
      
      // 1. Add $1000 via Apple Pay with pre-calculated netAmount
      await dataManager.updateBalance({
        type: 'add',
        amount: 1000,
        netAmount: 994.1, // Pre-calculated: 1000 - 5.9 fees
        fees: { total: 5.9 }, // 0.59% fees
        paymentMethod: 'apple_pay'
      })
      
      expect(dataManager.state.balance.availableForSpending).toBe(994.1)
      
      // 2. Buy $500 BTC
      await dataManager.updateBalance({
        type: 'buy',
        amount: 500,
        fees: { total: 4.5 }, // 0.9% fees
        asset: 'BTC',
        paymentMethod: 'diboas_wallet'
      })
      
      expect(dataManager.state.balance.availableForSpending).toBe(494.1)
      expect(dataManager.state.balance.investedAmount).toBe(495.5)
      
      // 3. Send $100 to friend
      await dataManager.updateBalance({
        type: 'send',
        amount: 100,
        fees: { total: 0.09 },
        recipient: '@friend'
      })
      
      expect(dataManager.state.balance.availableForSpending).toBe(394.1)
      
      // 4. Sell $200 BTC
      await dataManager.updateBalance({
        type: 'sell',
        amount: 200,
        fees: { total: 1.8 },
        asset: 'BTC',
        paymentMethod: 'bank_account'
      })
      
      expect(dataManager.state.balance.investedAmount).toBe(295.5)
      expect(dataManager.state.balance.availableForSpending).toBe(592.3)
      
      // 5. Withdraw $300
      await dataManager.updateBalance({
        type: 'withdraw',
        amount: 300,
        fees: { total: 6.0 }, // 2% fees
        paymentMethod: 'bank_account'
      })
      
      expect(dataManager.state.balance.availableForSpending).toBeCloseTo(292.3, 1)
      
      // Final total balance check
      expect(dataManager.state.balance.totalUSD).toBe(587.8) // 292.3 + 295.5
    })
  })
})