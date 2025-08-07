import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useFeeCalculator } from '../useFeeCalculator.js'
import { defaultFeeCalculator } from '../../../utils/feeCalculations.js'

// Mock the fee calculator
vi.mock('../../../utils/feeCalculations.js', () => ({
  defaultFeeCalculator: {
    calculateComprehensiveFees: vi.fn()
  }
}))

describe('useFeeCalculator Hook', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Mock console.log to avoid noise in tests
    vi.spyOn(console, 'log').mockImplementation(() => {})
  })
  
  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Fee Calculation with Proper Structure', () => {
    it('should return fees with total field for DataManager compatibility', async () => {
      const mockFeeData = {
        diBoaS: 0.09,
        network: 0.0001,
        provider: 0.5,
        dex: 0,
        defi: 0,
        total: 0.5901
      }
      
      defaultFeeCalculator.calculateComprehensiveFees.mockResolvedValue(mockFeeData)
      
      const { result } = renderHook(() => useFeeCalculator())
      
      let calculatedFees
      await act(async () => {
        calculatedFees = await result.current.calculateFees({
          type: 'add',
          amount: 100,
          paymentMethod: 'apple_pay',
          chains: ['SOL']
        })
      })
      
      // Should have total field
      expect(calculatedFees).toHaveProperty('total')
      expect(calculatedFees.total).toBe(0.5901)
      
      // Should also have total and total for compatibility
      expect(calculatedFees.total).toBe(0.5901)
      expect(calculatedFees.total).toBe(0.5901)
      
      // Should have all original fee components
      expect(calculatedFees.diBoaS).toBe(0.09)
      expect(calculatedFees.network).toBe(0.0001)
      expect(calculatedFees.provider).toBe(0.5)
      expect(calculatedFees.dex).toBe(0)
    })
    
    it('should format fees correctly in state', async () => {
      const mockFeeData = {
        diBoaS: 0.09,
        network: 0.0001,
        provider: 0.5,
        dex: 0,
        defi: 0,
        total: 0.5901
      }
      
      defaultFeeCalculator.calculateComprehensiveFees.mockResolvedValue(mockFeeData)
      
      const { result } = renderHook(() => useFeeCalculator())
      
      await act(async () => {
        await result.current.calculateFees({
          type: 'add',
          amount: 100,
          paymentMethod: 'apple_pay',
          chains: ['SOL']
        })
      })
      
      // Check formatted fees in state
      expect(result.current.fees).toEqual({
        diBoaS: '0.09',
        network: '0.00',
        provider: '0.50',
        payment: '0.00',
        dex: '0.00',
        routing: '0.00',
        gas: '0.00',
        total: '0.59',
        total: '0.59',
        total: '0.59'
      })
    })
    
    it('should handle zero fees correctly', async () => {
      const mockFeeData = {
        diBoaS: 0,
        network: 0,
        provider: 0,
        dex: 0,
        defi: 0,
        total: 0
      }
      
      defaultFeeCalculator.calculateComprehensiveFees.mockResolvedValue(mockFeeData)
      
      const { result } = renderHook(() => useFeeCalculator())
      
      let calculatedFees
      await act(async () => {
        calculatedFees = await result.current.calculateFees({
          type: 'add',
          amount: 100,
          paymentMethod: 'crypto_wallet',
          chains: ['SOL']
        })
      })
      
      expect(calculatedFees.total).toBe(0)
      expect(calculatedFees.total).toBe(0)
      expect(calculatedFees.total).toBe(0)
    })
    
    it('should cache results to avoid duplicate calculations', async () => {
      const mockFeeData = {
        diBoaS: 0.09,
        network: 0.0001,
        provider: 0.5,
        dex: 0,
        defi: 0,
        total: 0.5901
      }
      
      defaultFeeCalculator.calculateComprehensiveFees.mockResolvedValue(mockFeeData)
      
      const { result } = renderHook(() => useFeeCalculator())
      
      const params = {
        type: 'add',
        amount: 100,
        paymentMethod: 'apple_pay',
        chains: ['SOL']
      }
      
      // First call
      await act(async () => {
        await result.current.calculateFees(params)
      })
      
      expect(defaultFeeCalculator.calculateComprehensiveFees).toHaveBeenCalledTimes(1)
      
      // Second call with same params - should use cache
      await act(async () => {
        await result.current.calculateFees(params)
      })
      
      // Should not call the calculator again
      expect(defaultFeeCalculator.calculateComprehensiveFees).toHaveBeenCalledTimes(1)
      
      // Change params - should trigger new calculation
      await act(async () => {
        await result.current.calculateFees({
          ...params,
          amount: 200
        })
      })
      
      expect(defaultFeeCalculator.calculateComprehensiveFees).toHaveBeenCalledTimes(2)
    })
  })
  
  describe('Edge Cases and Error Handling', () => {
    it('should handle timeout correctly', async () => {
      // Mock a slow response that will timeout
      defaultFeeCalculator.calculateComprehensiveFees.mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({ total: 1 }), 6000))
      )
      
      const { result } = renderHook(() => useFeeCalculator())
      
      await act(async () => {
        const promise = result.current.calculateFees({
          type: 'add',
          amount: 100,
          paymentMethod: 'bank_account',
          chains: ['SOL']
        })
        
        // Wait for timeout
        await expect(promise).rejects.toThrow('Fee calculation timeout')
      })
      
      expect(result.current.isTimeout).toBe(true)
      expect(result.current.isCalculating).toBe(false)
    })
    
    it('should handle calculation errors gracefully', async () => {
      const mockError = new Error('Fee service unavailable')
      defaultFeeCalculator.calculateComprehensiveFees.mockRejectedValue(mockError)
      
      const { result } = renderHook(() => useFeeCalculator())
      
      await act(async () => {
        await expect(
          result.current.calculateFees({
            type: 'add',
            amount: 100,
            paymentMethod: 'paypal',
            chains: ['SOL']
          })
        ).rejects.toThrow('Fee service unavailable')
      })
      
      expect(result.current.error).toEqual(mockError)
      expect(result.current.isCalculating).toBe(false)
    })
    
    it('should handle missing fee data fields', async () => {
      const mockFeeData = {
        diBoaS: 0.09,
        network: 0.0001,
        // Missing provider, dex, defi fields
        total: 0.0901
      }
      
      defaultFeeCalculator.calculateComprehensiveFees.mockResolvedValue(mockFeeData)
      
      const { result } = renderHook(() => useFeeCalculator())
      
      let calculatedFees
      await act(async () => {
        calculatedFees = await result.current.calculateFees({
          type: 'send',
          amount: 100,
          recipient: '@user',
          chains: ['SOL']
        })
      })
      
      // Should handle missing fields gracefully
      expect(calculatedFees.total).toBe(0.0901)
      expect(calculatedFees.provider).toBeUndefined()
      expect(calculatedFees.dex).toBeUndefined()
      
      // Formatted fees should show 0.00 for missing fields
      expect(result.current.fees.provider).toBe('0.00')
      expect(result.current.fees.dex).toBe('0.00')
    })
  })
  
  describe('Different Transaction Types', () => {
    it('should calculate fees for withdraw transaction', async () => {
      const mockFeeData = {
        diBoaS: 0.9,
        network: 0.005,
        provider: 2.0,
        dex: 0,
        defi: 0,
        total: 2.905
      }
      
      defaultFeeCalculator.calculateComprehensiveFees.mockResolvedValue(mockFeeData)
      
      const { result } = renderHook(() => useFeeCalculator())
      
      let calculatedFees
      await act(async () => {
        calculatedFees = await result.current.calculateFees({
          type: 'withdraw',
          amount: 100,
          paymentMethod: 'bank_account',
          chains: ['SOL']
        })
      })
      
      expect(calculatedFees.total).toBe(2.905)
      expect(calculatedFees.diBoaS).toBe(0.9) // 0.9% for withdraw
      expect(calculatedFees.provider).toBe(2.0) // 2% for bank off-ramp
    })
    
    it('should calculate fees for buy transaction with DEX', async () => {
      const mockFeeData = {
        diBoaS: 0.09,
        network: 0.01, // BTC network fee
        provider: 0,
        dex: 0.8,
        defi: 0,
        total: 0.89
      }
      
      defaultFeeCalculator.calculateComprehensiveFees.mockResolvedValue(mockFeeData)
      
      const { result } = renderHook(() => useFeeCalculator())
      
      let calculatedFees
      await act(async () => {
        calculatedFees = await result.current.calculateFees({
          type: 'buy',
          amount: 100,
          asset: 'BTC',
          paymentMethod: 'diboas_wallet',
          chains: ['BTC']
        })
      })
      
      expect(calculatedFees.total).toBe(0.89)
      expect(calculatedFees.dex).toBe(0.8) // Cross-chain DEX fee
      expect(calculatedFees.network).toBe(0.01) // BTC network fee
    })
  })
  
  describe('Debug Logging', () => {
    it('should log fee structure for debugging', async () => {
      const mockFeeData = {
        diBoaS: 0.09,
        network: 0.0001,
        provider: 0.5,
        dex: 0,
        defi: 0,
        total: 0.5901
      }
      
      defaultFeeCalculator.calculateComprehensiveFees.mockResolvedValue(mockFeeData)
      
      const { result } = renderHook(() => useFeeCalculator())
      
      await act(async () => {
        await result.current.calculateFees({
          type: 'add',
          amount: 100,
          paymentMethod: 'apple_pay',
          chains: ['SOL']
        })
      })
      
      // Check if debug logging was called
      expect(console.log).toHaveBeenCalledWith(
        '[DEBUG] useFeeCalculator returning fees:',
        expect.objectContaining({
          total: 0.5901,
          total: 0.5901,
          total: 0.5901,
          hasTotal: true,
          totalValue: 0.5901
        })
      )
    })
  })
})