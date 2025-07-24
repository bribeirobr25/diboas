/**
 * Comprehensive Unit Tests for Multi-Wallet Balance Management
 * Tests Available vs Invested balance logic, multi-chain operations, and edge cases
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import MultiWalletManager from '../MultiWalletManager.js'

// Mock external dependencies
vi.mock('../../DataManager.js', () => ({
  dataManager: {
    getBalance: vi.fn(),
    setBalance: vi.fn(),
    subscribe: vi.fn(() => vi.fn()), // Returns unsubscribe function
    emit: vi.fn()
  }
}))

vi.mock('../../utils/secureLogger.js', () => ({
  default: {
    log: vi.fn(),
    warn: vi.fn(),
    error: vi.fn()
  }
}))

describe('MultiWalletManager', () => {
  let walletManager
  let mockDataManager

  beforeEach(() => {
    walletManager = new MultiWalletManager()
    mockDataManager = require('../../DataManager.js').dataManager
    
    // Reset mocks
    vi.clearAllMocks()
  })

  describe('Balance Structure and Initialization', () => {
    it('should initialize with correct empty balance structure', async () => {
      mockDataManager.getBalance.mockResolvedValue(null)
      
      const balance = await walletManager.getUnifiedBalance('user123')
      
      expect(balance).toEqual({
        total: 0,
        available: 0,    // USDC only - liquid funds
        invested: 0,     // All non-USDC assets
        breakdown: {
          BTC: { balance: 0, usdValue: 0 },
          ETH: { balance: 0, usdValue: 0 },
          SOL: { usdc: 0, sol: 0, usdValue: 0 },
          SUI: { balance: 0, usdValue: 0 }
        },
        assets: {}       // Individual asset tracking
      })
    })

    it('should maintain correct balance categories', () => {
      const balanceStructure = walletManager.createEmptyBalance()
      
      // Available balance should only track USDC (liquid funds)
      expect(balanceStructure.available).toBe(0)
      
      // Invested balance should track all non-USDC assets
      expect(balanceStructure.invested).toBe(0)
      
      // Total should be sum of available + invested
      expect(balanceStructure.total).toBe(0)
    })
  })

  describe('Available Balance Management (USDC Only)', () => {
    describe('Add Transaction (On-Ramp) Balance Updates', () => {
      it('should increase available balance for successful add transaction', async () => {
        const initialBalance = {
          total: 500,
          available: 300,
          invested: 200,
          breakdown: { SOL: { usdc: 300, sol: 0.1, usdValue: 300 } },
          assets: {}
        }
        
        mockDataManager.getBalance.mockResolvedValue(initialBalance)
        
        await walletManager.updateBalances('user123', {
          type: 'add',
          amount: 100,
          netAmount: 95, // After fees
          fees: { total: 5 },
          paymentMethod: 'credit_card',
          fromChain: null,
          toChain: 'SOL',
          asset: 'USDC'
        })

        expect(mockDataManager.setBalance).toHaveBeenCalledWith('user123', {
          total: 595,        // 500 + 95 net amount
          available: 395,    // 300 + 95 (USDC added to available)
          invested: 200,     // No change
          breakdown: {
            SOL: { usdc: 395, sol: 0.1, usdValue: 395 } // USDC increased
          },
          assets: {}
        })
      })

      it('should handle minimum add transaction amounts', async () => {
        const initialBalance = walletManager.createEmptyBalance()
        mockDataManager.getBalance.mockResolvedValue(initialBalance)
        
        await walletManager.updateBalances('user123', {
          type: 'add',
          amount: 10,        // Minimum amount
          netAmount: 9.50,   // After fees
          fees: { total: 0.50 },
          paymentMethod: 'bank_account',
          toChain: 'SOL',
          asset: 'USDC'
        })

        expect(mockDataManager.setBalance).toHaveBeenCalledWith('user123', {
          total: 9.50,
          available: 9.50,
          invested: 0,
          breakdown: {
            BTC: { balance: 0, usdValue: 0 },
            ETH: { balance: 0, usdValue: 0 },
            SOL: { usdc: 9.50, sol: 0, usdValue: 9.50 },
            SUI: { balance: 0, usdValue: 0 }
          },
          assets: {}
        })
      })
    })

    describe('Withdraw Transaction (Off-Ramp) Balance Updates', () => {
      it('should decrease available balance for successful withdraw transaction', async () => {
        const initialBalance = {
          total: 1000,
          available: 600,
          invested: 400,
          breakdown: { SOL: { usdc: 600, sol: 0.2, usdValue: 600 } },
          assets: { BTC: { amount: 0.01, usdValue: 400 } }
        }
        
        mockDataManager.getBalance.mockResolvedValue(initialBalance)
        
        await walletManager.updateBalances('user123', {
          type: 'withdraw',
          amount: 200,
          netAmount: 200,
          fees: { total: 15 },
          paymentMethod: 'bank_account',
          fromChain: 'SOL',
          toChain: null,
          asset: 'USDC'
        })

        expect(mockDataManager.setBalance).toHaveBeenCalledWith('user123', {
          total: 800,        // 1000 - 200
          available: 400,    // 600 - 200 (USDC withdrawn from available)
          invested: 400,     // No change
          breakdown: {
            SOL: { usdc: 400, sol: 0.2, usdValue: 400 } // USDC decreased
          },
          assets: { BTC: { amount: 0.01, usdValue: 400 } }
        })
      })

      it('should prevent withdrawal when insufficient available balance', async () => {
        const initialBalance = {
          total: 1000,
          available: 100,    // Low available balance
          invested: 900,     // High invested balance
          breakdown: { SOL: { usdc: 100, sol: 0.1, usdValue: 100 } },
          assets: {}
        }
        
        mockDataManager.getBalance.mockResolvedValue(initialBalance)
        
        const validation = await walletManager.validateTransaction('user123', {
          type: 'withdraw',
          amount: 200 // More than available balance
        })

        expect(validation.isValid).toBe(false)
        expect(validation.error).toContain('Insufficient available balance')
      })
    })

    describe('Send Transaction (P2P) Balance Updates', () => {
      it('should decrease available balance for successful send transaction', async () => {
        const initialBalance = {
          total: 500,
          available: 300,
          invested: 200,
          breakdown: { SOL: { usdc: 300, sol: 0.15, usdValue: 300 } },
          assets: {}
        }
        
        mockDataManager.getBalance.mockResolvedValue(initialBalance)
        
        await walletManager.updateBalances('user123', {
          type: 'send',
          amount: 50,
          netAmount: 50,
          fees: { total: 0.45 },
          paymentMethod: 'diboas_wallet',
          fromChain: 'SOL',
          toChain: 'SOL',
          asset: 'USDC'
        })

        expect(mockDataManager.setBalance).toHaveBeenCalledWith('user123', {
          total: 450,        // 500 - 50
          available: 250,    // 300 - 50 (USDC sent from available)
          invested: 200,     // No change
          breakdown: {
            SOL: { usdc: 250, sol: 0.15, usdValue: 250 } // USDC decreased
          },
          assets: {}
        })
      })

      it('should handle minimum send transaction amounts', async () => {
        const initialBalance = {
          total: 50,
          available: 50,
          invested: 0,
          breakdown: { SOL: { usdc: 50, sol: 0, usdValue: 50 } },
          assets: {}
        }
        
        mockDataManager.getBalance.mockResolvedValue(initialBalance)
        
        await walletManager.updateBalances('user123', {
          type: 'send',
          amount: 5,         // Minimum send amount
          netAmount: 5,
          fees: { total: 0.045 },
          recipient: '@testuser',
          fromChain: 'SOL',
          toChain: 'SOL'
        })

        expect(mockDataManager.setBalance).toHaveBeenCalledWith('user123', {
          total: 45,
          available: 45,
          invested: 0,
          breakdown: {
            SOL: { usdc: 45, sol: 0, usdValue: 45 }
          },
          assets: {}
        })
      })
    })

    describe('Transfer Transaction (External) Balance Updates', () => {
      it('should decrease available balance for external transfer', async () => {
        const initialBalance = {
          total: 800,
          available: 500,
          invested: 300,
          breakdown: { 
            SOL: { usdc: 300, sol: 0.1, usdValue: 300 },
            ETH: { balance: 0.1, usdValue: 200 }
          },
          assets: { ETH: { amount: 0.1, usdValue: 200 } }
        }
        
        mockDataManager.getBalance.mockResolvedValue(initialBalance)
        
        await walletManager.updateBalances('user123', {
          type: 'transfer',
          amount: 100,
          netAmount: 100,
          fees: { total: 9 },
          recipient: '1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa', // Bitcoin address
          fromChain: 'SOL',
          toChain: 'BTC',
          asset: 'USDC'
        })

        expect(mockDataManager.setBalance).toHaveBeenCalledWith('user123', {
          total: 700,        // 800 - 100
          available: 400,    // 500 - 100 (USDC transferred from available)
          invested: 300,     // No change
          breakdown: {
            SOL: { usdc: 200, sol: 0.1, usdValue: 200 }, // USDC decreased
            ETH: { balance: 0.1, usdValue: 200 }
          },
          assets: { ETH: { amount: 0.1, usdValue: 200 } }
        })
      })
    })
  })

  describe('Invested Balance Management (Non-USDC Assets)', () => {
    describe('Buy Transaction Balance Updates', () => {
      it('should move funds from available to invested for buy with diBoaS wallet', async () => {
        const initialBalance = {
          total: 1000,
          available: 700,    // USDC available
          invested: 300,     // Existing investments
          breakdown: { SOL: { usdc: 700, sol: 0.3, usdValue: 700 } },
          assets: { SOL: { amount: 0.3, usdValue: 300 } }
        }
        
        mockDataManager.getBalance.mockResolvedValue(initialBalance)
        
        await walletManager.updateBalances('user123', {
          type: 'buy',
          amount: 500,       // Buy $500 of BTC
          netAmount: 485,    // After fees
          fees: { total: 15 },
          paymentMethod: 'diboas_wallet',
          fromChain: 'SOL',
          toChain: 'BTC',
          asset: 'BTC'
        })

        expect(mockDataManager.setBalance).toHaveBeenCalledWith('user123', {
          total: 1000,       // Total unchanged (internal transfer)
          available: 200,    // 700 - 500 (USDC spent)
          invested: 800,     // 300 + 500 (BTC purchased)
          breakdown: {
            SOL: { usdc: 200, sol: 0.3, usdValue: 200 }, // USDC decreased
            BTC: { balance: 0.0121, usdValue: 485 } // New BTC position (assuming $40k BTC)
          },
          assets: {
            SOL: { amount: 0.3, usdValue: 300 },
            BTC: { amount: 0.0121, usdValue: 485 } // New asset added
          }
        })
      })

      it('should only increase invested balance for buy with external payment', async () => {
        const initialBalance = {
          total: 300,
          available: 200,
          invested: 100,
          breakdown: { SOL: { usdc: 200, sol: 0, usdValue: 200 } },
          assets: {}
        }
        
        mockDataManager.getBalance.mockResolvedValue(initialBalance)
        
        await walletManager.updateBalances('user123', {
          type: 'buy',
          amount: 1000,      // Buy $1000 of ETH with credit card
          netAmount: 980,    // After fees
          fees: { total: 20 },
          paymentMethod: 'credit_card',
          fromChain: null,   // External payment
          toChain: 'ETH',
          asset: 'ETH'
        })

        expect(mockDataManager.setBalance).toHaveBeenCalledWith('user123', {
          total: 1280,       // 300 + 980 (new funds added)
          available: 200,    // No change (external payment)
          invested: 1080,    // 100 + 980 (ETH purchased)
          breakdown: {
            SOL: { usdc: 200, sol: 0, usdValue: 200 }, // No change
            ETH: { balance: 0.4, usdValue: 980 } // New ETH position (assuming $2450 ETH)
          },
          assets: {
            ETH: { amount: 0.4, usdValue: 980 }
          }
        })
      })
    })

    describe('Sell Transaction Balance Updates', () => {
      it('should move funds from invested to available for sell transaction', async () => {
        const initialBalance = {
          total: 1500,
          available: 300,
          invested: 1200,
          breakdown: { 
            SOL: { usdc: 300, sol: 0.1, usdValue: 300 },
            BTC: { balance: 0.025, usdValue: 1000 },
            ETH: { balance: 0.08, usdValue: 200 }
          },
          assets: {
            BTC: { amount: 0.025, usdValue: 1000 },
            ETH: { amount: 0.08, usdValue: 200 }
          }
        }
        
        mockDataManager.getBalance.mockResolvedValue(initialBalance)
        
        await walletManager.updateBalances('user123', {
          type: 'sell',
          amount: 500,       // Sell $500 worth of BTC
          netAmount: 490,    // After fees
          fees: { total: 10 },
          paymentMethod: 'diboas_wallet', // Always uses diBoaS wallet
          fromChain: 'BTC',
          toChain: 'SOL',
          asset: 'BTC'
        })

        expect(mockDataManager.setBalance).toHaveBeenCalledWith('user123', {
          total: 1500,       // Total unchanged (internal transfer)
          available: 790,    // 300 + 490 (USDC received)
          invested: 710,     // 1200 - 490 (BTC sold)
          breakdown: {
            SOL: { usdc: 790, sol: 0.1, usdValue: 790 }, // USDC increased
            BTC: { balance: 0.0125, usdValue: 500 },      // BTC decreased
            ETH: { balance: 0.08, usdValue: 200 }         // ETH unchanged
          },
          assets: {
            BTC: { amount: 0.0125, usdValue: 500 },
            ETH: { amount: 0.08, usdValue: 200 }
          }
        })
      })

      it('should prevent selling more than invested amount for specific asset', async () => {
        const initialBalance = {
          total: 1000,
          available: 400,
          invested: 600,
          breakdown: { 
            SOL: { usdc: 400, sol: 0.2, usdValue: 400 },
            BTC: { balance: 0.01, usdValue: 600 }
          },
          assets: {
            BTC: { amount: 0.01, usdValue: 600 }
          }
        }
        
        mockDataManager.getBalance.mockResolvedValue(initialBalance)
        
        const validation = await walletManager.validateTransaction('user123', {
          type: 'sell',
          amount: 800,  // More than BTC investment ($600)
          asset: 'BTC'
        })

        expect(validation.isValid).toBe(false)
        expect(validation.error).toContain('Insufficient invested balance for BTC')
      })
    })
  })

  describe('Multi-Chain Balance Operations', () => {
    describe('Cross-Chain Routing', () => {
      it('should find routing options for cross-chain transfers', async () => {
        const initialBalance = {
          total: 2000,
          available: 800,
          invested: 1200,
          breakdown: {
            SOL: { usdc: 600, sol: 0.4, usdValue: 600 },
            ETH: { balance: 0.3, usdValue: 800, usdc: 200 }
          },
          assets: { ETH: { amount: 0.3, usdValue: 800 } }
        }
        
        mockDataManager.getBalance.mockResolvedValue(initialBalance)
        
        const routingOptions = await walletManager.findRoutingOptions('user123', 500, 'USDC', 'BTC')
        
        expect(routingOptions).toHaveLength(2) // SOL and ETH options
        expect(routingOptions[0]).toEqual({
          fromChain: 'SOL',
          toChain: 'BTC',
          fromAsset: 'USDC',
          toAsset: 'USDC',
          fromAmount: 500,
          toAmount: expect.any(Number), // After routing fees
          estimatedTime: expect.any(Number),
          feasible: true
        })
      })

      it('should reject routing when insufficient funds across all chains', async () => {
        const initialBalance = {
          total: 300,
          available: 100,
          invested: 200,
          breakdown: {
            SOL: { usdc: 50, sol: 0.1, usdValue: 50 },
            ETH: { usdc: 50, balance: 0.04, usdValue: 100 }
          },
          assets: { ETH: { amount: 0.04, usdValue: 100 } }
        }
        
        mockDataManager.getBalance.mockResolvedValue(initialBalance)
        
        const routingOptions = await walletManager.findRoutingOptions('user123', 1000, 'USDC', 'BTC')
        
        expect(routingOptions).toHaveLength(0) // No feasible options
      })
    })

    describe('Routing Fee Estimation', () => {
      it('should estimate routing fees for cross-chain operations', async () => {
        const fees = await walletManager.estimateRoutingFees('SOL', 'BTC', 1000)
        
        expect(fees).toEqual({
          bridgeFee: expect.any(Number),
          networkFees: expect.any(Number),
          slippage: expect.any(Number),
          total: expect.any(Number)
        })
        
        expect(fees.total).toBeGreaterThan(0)
        expect(fees.total).toBeLessThan(100) // Reasonable fee range
      })

      it('should return zero fees for same-chain operations', async () => {
        const fees = await walletManager.estimateRoutingFees('SOL', 'SOL', 1000)
        
        expect(fees.total).toBe(0)
      })
    })
  })

  describe('Balance Validation Logic', () => {
    describe('Available Balance Validation', () => {
      const availableBalanceTransactions = ['withdraw', 'send', 'transfer']
      
      availableBalanceTransactions.forEach(transactionType => {
        it(`should validate available balance for ${transactionType} transactions`, async () => {
          const balance = {
            total: 1000,
            available: 300,  // Only $300 available
            invested: 700,
            breakdown: { SOL: { usdc: 300, sol: 0.3, usdValue: 300 } },
            assets: {}
          }
          
          mockDataManager.getBalance.mockResolvedValue(balance)
          
          // Should pass for amount within available balance
          const validTransaction = await walletManager.validateTransaction('user123', {
            type: transactionType,
            amount: 200
          })
          expect(validTransaction.isValid).toBe(true)
          
          // Should fail for amount exceeding available balance
          const invalidTransaction = await walletManager.validateTransaction('user123', {
            type: transactionType,
            amount: 500 // More than available $300
          })
          expect(invalidTransaction.isValid).toBe(false)
          expect(invalidTransaction.error).toContain('Insufficient available balance')
        })
      })

      it('should validate available balance for buy transactions with diBoaS wallet', async () => {
        const balance = {
          total: 1000,
          available: 400,
          invested: 600,
          breakdown: { SOL: { usdc: 400, sol: 0.2, usdValue: 400 } },
          assets: {}
        }
        
        mockDataManager.getBalance.mockResolvedValue(balance)
        
        const validTransaction = await walletManager.validateTransaction('user123', {
          type: 'buy',
          amount: 300,
          asset: 'BTC',
          paymentMethod: 'diboas_wallet'
        })
        expect(validTransaction.isValid).toBe(true)
        
        const invalidTransaction = await walletManager.validateTransaction('user123', {
          type: 'buy',
          amount: 500, // More than available $400
          asset: 'BTC',
          paymentMethod: 'diboas_wallet'
        })
        expect(invalidTransaction.isValid).toBe(false)
      })

      it('should not validate available balance for buy transactions with external payment', async () => {
        const balance = {
          total: 100,
          available: 50,   // Low available balance
          invested: 50,
          breakdown: {},
          assets: {}
        }
        
        mockDataManager.getBalance.mockResolvedValue(balance)
        
        // Should pass regardless of available balance for external payments
        const transaction = await walletManager.validateTransaction('user123', {
          type: 'buy',
          amount: 1000,    // Much more than available
          asset: 'BTC',
          paymentMethod: 'credit_card' // External payment
        })
        expect(transaction.isValid).toBe(true)
      })
    })

    describe('Invested Balance Validation', () => {
      it('should validate invested balance for sell transactions', async () => {
        const balance = {
          total: 2000,
          available: 500,
          invested: 1500,
          breakdown: {
            SOL: { usdc: 500, sol: 0.3, usdValue: 500 },
            BTC: { balance: 0.02, usdValue: 800 },
            ETH: { balance: 0.28, usdValue: 700 }
          },
          assets: {
            BTC: { amount: 0.02, usdValue: 800 },
            ETH: { amount: 0.28, usdValue: 700 }
          }
        }
        
        mockDataManager.getBalance.mockResolvedValue(balance)
        
        // Should pass for BTC sale within invested amount
        const validBtcSale = await walletManager.validateTransaction('user123', {
          type: 'sell',
          amount: 600,  // Less than BTC investment ($800)
          asset: 'BTC'
        })
        expect(validBtcSale.isValid).toBe(true)
        
        // Should fail for BTC sale exceeding invested amount
        const invalidBtcSale = await walletManager.validateTransaction('user123', {
          type: 'sell',
          amount: 900,  // More than BTC investment ($800)
          asset: 'BTC'
        })
        expect(invalidBtcSale.isValid).toBe(false)
        expect(invalidBtcSale.error).toContain('Insufficient invested balance for BTC')
        
        // Should pass for ETH sale within invested amount
        const validEthSale = await walletManager.validateTransaction('user123', {
          type: 'sell',
          amount: 500,  // Less than ETH investment ($700) 
          asset: 'ETH'
        })
        expect(validEthSale.isValid).toBe(true)
      })

      it('should handle sell validation for non-existent assets', async () => {
        const balance = {
          total: 1000,
          available: 600,
          invested: 400,
          breakdown: { SOL: { usdc: 600, sol: 0.2, usdValue: 600 } },
          assets: { SOL: { amount: 0.2, usdValue: 400 } }
        }
        
        mockDataManager.getBalance.mockResolvedValue(balance)
        
        const transaction = await walletManager.validateTransaction('user123', {
          type: 'sell',
          amount: 100,
          asset: 'BTC' // User doesn't own any BTC
        })
        
        expect(transaction.isValid).toBe(false)
        expect(transaction.error).toContain('No BTC available to sell')
      })
    })
  })

  describe('Balance Update Edge Cases', () => {
    describe('Precision and Rounding', () => {
      it('should handle very small amounts with proper precision', async () => {
        const initialBalance = walletManager.createEmptyBalance()
        mockDataManager.getBalance.mockResolvedValue(initialBalance)
        
        await walletManager.updateBalances('user123', {
          type: 'add',
          amount: 0.01,      // Very small amount
          netAmount: 0.009,  // After fees
          fees: { total: 0.001 },
          toChain: 'SOL',
          asset: 'USDC'
        })

        const expectedBalance = mockDataManager.setBalance.mock.calls[0][1]
        expect(expectedBalance.available).toBeCloseTo(0.009, 8)
        expect(expectedBalance.total).toBeCloseTo(0.009, 8)
      })

      it('should handle very large amounts without overflow', async () => {
        const initialBalance = walletManager.createEmptyBalance()
        mockDataManager.getBalance.mockResolvedValue(initialBalance)
        
        await walletManager.updateBalances('user123', {
          type: 'add',
          amount: 10000000,    // $10 million
          netAmount: 9950000,  // After fees
          fees: { total: 50000 },
          toChain: 'SOL',
          asset: 'USDC'
        })

        const expectedBalance = mockDataManager.setBalance.mock.calls[0][1]
        expect(expectedBalance.available).toBe(9950000)
        expect(expectedBalance.total).toBe(9950000)
        expect(Number.isFinite(expectedBalance.total)).toBe(true)
      })

      it('should maintain precision during asset price calculations', async () => {
        const initialBalance = {
          total: 0,
          available: 0,
          invested: 0,
          breakdown: {},
          assets: {}
        }
        
        mockDataManager.getBalance.mockResolvedValue(initialBalance)
        
        // Mock asset price for precision testing
        walletManager.getAssetPrice = vi.fn().mockReturnValue(43567.89) // BTC price
        
        await walletManager.updateBalances('user123', {
          type: 'buy',
          amount: 1000,
          netAmount: 985,
          fees: { total: 15 },
          paymentMethod: 'credit_card',
          toChain: 'BTC',
          asset: 'BTC'
        })

        const expectedBalance = mockDataManager.setBalance.mock.calls[0][1]
        const expectedBtcAmount = 985 / 43567.89
        
        expect(expectedBalance.assets.BTC.amount).toBeCloseTo(expectedBtcAmount, 8)
        expect(expectedBalance.assets.BTC.usdValue).toBe(985)
      })
    })

    describe('Concurrent Balance Updates', () => {
      it('should handle concurrent balance update attempts', async () => {
        const initialBalance = {
          total: 1000,
          available: 600,
          invested: 400,
          breakdown: { SOL: { usdc: 600, sol: 0.3, usdValue: 600 } },
          assets: { SOL: { amount: 0.3, usdValue: 400 } }
        }
        
        mockDataManager.getBalance.mockResolvedValue(initialBalance)
        
        // Simulate concurrent transactions
        const updates = [
          walletManager.updateBalances('user123', {
            type: 'send',
            amount: 100,
            netAmount: 100,
            fees: { total: 0.9 }
          }),
          walletManager.updateBalances('user123', {
            type: 'send', 
            amount: 50,
            netAmount: 50,
            fees: { total: 0.45 }
          })
        ]
        
        await Promise.all(updates)
        
        // Should handle both updates (implementation specific)
        expect(mockDataManager.setBalance).toHaveBeenCalledTimes(2)
      })
    })

    describe('Error Recovery', () => {
      it('should not update balance if transaction fails', async () => {
        const initialBalance = {
          total: 500,
          available: 300,
          invested: 200,
          breakdown: {},
          assets: {}
        }
        
        mockDataManager.getBalance.mockResolvedValue(initialBalance)
        mockDataManager.setBalance.mockRejectedValue(new Error('Database error'))
        
        await expect(
          walletManager.updateBalances('user123', {
            type: 'withdraw',
            amount: 100,
            netAmount: 100,
            fees: { total: 5 }
          })
        ).rejects.toThrow('Database error')
        
        // Balance should not be modified
        expect(mockDataManager.setBalance).toHaveBeenCalledTimes(1)
      })

      it('should maintain balance integrity during partial failures', async () => {
        const initialBalance = {
          total: 1000,
          available: 600,
          invested: 400,
          breakdown: { SOL: { usdc: 600, sol: 0.3, usdValue: 600 } },
          assets: { SOL: { amount: 0.3, usdValue: 400 } }
        }
        
        mockDataManager.getBalance.mockResolvedValue(initialBalance)
        
        // Mock partial failure scenario
        const transaction = {
          type: 'buy',
          amount: 500,
          netAmount: 0, // Transaction failed, no net amount
          fees: { total: 15 }, // Fees still charged
          paymentMethod: 'credit_card',
          asset: 'BTC',
          status: 'failed'
        }
        
        await walletManager.updateBalances('user123', transaction)
        
        // For failed transactions, balance should not change
        const expectedBalance = mockDataManager.setBalance.mock.calls[0][1]
        expect(expectedBalance.total).toBe(1000) // No change
        expect(expectedBalance.available).toBe(600) // No change
        expect(expectedBalance.invested).toBe(400) // No change
      })
    })
  })

  describe('Real-world Scenario Testing', () => {
    describe('Complete Transaction Flows', () => {
      it('should handle complete user journey: Add → Buy → Sell → Withdraw', async () => {
        let currentBalance = walletManager.createEmptyBalance()
        
        // Step 1: Add $1000 with credit card
        mockDataManager.getBalance.mockResolvedValue(currentBalance)
        await walletManager.updateBalances('user123', {
          type: 'add',
          amount: 1000,
          netAmount: 985, // After fees
          fees: { total: 15 },
          paymentMethod: 'credit_card',
          toChain: 'SOL'
        })
        
        currentBalance = {
          total: 985,
          available: 985,
          invested: 0,
          breakdown: { SOL: { usdc: 985, sol: 0, usdValue: 985 } },
          assets: {}
        }
        
        // Step 2: Buy $500 of BTC with diBoaS wallet
        mockDataManager.getBalance.mockResolvedValue(currentBalance)
        await walletManager.updateBalances('user123', {
          type: 'buy',
          amount: 500,
          netAmount: 485, // After fees
          fees: { total: 15 },
          paymentMethod: 'diboas_wallet',
          fromChain: 'SOL',
          toChain: 'BTC',
          asset: 'BTC'
        })
        
        currentBalance = {
          total: 985,
          available: 485, // 985 - 500
          invested: 500,  // New BTC investment
          breakdown: {
            SOL: { usdc: 485, sol: 0, usdValue: 485 },
            BTC: { balance: 0.0121, usdValue: 485 }
          },
          assets: { BTC: { amount: 0.0121, usdValue: 485 } }
        }
        
        // Step 3: Sell $300 of BTC
        mockDataManager.getBalance.mockResolvedValue(currentBalance)
        await walletManager.updateBalances('user123', {
          type: 'sell',
          amount: 300,
          netAmount: 290, // After fees
          fees: { total: 10 },
          paymentMethod: 'diboas_wallet',
          fromChain: 'BTC',
          toChain: 'SOL',
          asset: 'BTC'
        })
        
        currentBalance = {
          total: 985,
          available: 775, // 485 + 290
          invested: 210,  // 500 - 290
          breakdown: {
            SOL: { usdc: 775, sol: 0, usdValue: 775 },
            BTC: { balance: 0.0075, usdValue: 195 }
          },
          assets: { BTC: { amount: 0.0075, usdValue: 195 } }
        }
        
        // Step 4: Withdraw $400 to bank account
        mockDataManager.getBalance.mockResolvedValue(currentBalance)
        await walletManager.updateBalances('user123', {
          type: 'withdraw',
          amount: 400,
          netAmount: 400,
          fees: { total: 28 },
          paymentMethod: 'bank_account',
          fromChain: 'SOL'
        })
        
        // Final balance should be consistent
        const finalBalance = mockDataManager.setBalance.mock.calls[3][1]
        expect(finalBalance.total).toBe(585)    // 985 - 400
        expect(finalBalance.available).toBe(375) // 775 - 400
        expect(finalBalance.invested).toBe(210)  // Unchanged
      })
    })

    describe('Multi-Asset Portfolio Management', () => {
      it('should handle complex multi-asset portfolio operations', async () => {
        // Start with diversified portfolio
        const initialBalance = {
          total: 5000,
          available: 1000, // $1000 USDC
          invested: 4000,  // $4000 in various assets
          breakdown: {
            SOL: { usdc: 1000, sol: 2, usdValue: 1000 },
            BTC: { balance: 0.05, usdValue: 2000 },
            ETH: { balance: 0.8, usdValue: 2000 }
          },
          assets: {
            BTC: { amount: 0.05, usdValue: 2000 },
            ETH: { amount: 0.8, usdValue: 2000 }
          }
        }
        
        mockDataManager.getBalance.mockResolvedValue(initialBalance)
        
        // Rebalance portfolio: Sell some BTC, buy more ETH
        await walletManager.updateBalances('user123', {
          type: 'sell',
          amount: 1000, // Sell $1000 of BTC
          netAmount: 990, // After fees
          asset: 'BTC'
        })
        
        const afterSellBalance = mockDataManager.setBalance.mock.calls[0][1]
        expect(afterSellBalance.available).toBe(1990) // 1000 + 990
        expect(afterSellBalance.invested).toBe(3010)  // 4000 - 990
        
        // Then buy more ETH with the proceeds
        mockDataManager.getBalance.mockResolvedValue(afterSellBalance)
        await walletManager.updateBalances('user123', {
          type: 'buy',
          amount: 800,  // Buy $800 more ETH
          netAmount: 785, // After fees
          paymentMethod: 'diboas_wallet',
          asset: 'ETH'
        })
        
        const finalBalance = mockDataManager.setBalance.mock.calls[1][1]
        expect(finalBalance.available).toBe(1190) // 1990 - 800
        expect(finalBalance.invested).toBe(3795) // 3010 + 785
        expect(finalBalance.total).toBe(4985)    // Available + Invested
      })
    })
  })
})