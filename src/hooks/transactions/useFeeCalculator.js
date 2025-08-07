/**
 * Fee Calculator Hook - Domain-Driven Design Implementation
 * Uses the Fee domain service instead of utility functions
 * Handles transaction fee calculations with proper domain patterns
 */

import { useState, useCallback, useRef, useEffect } from 'react'
import { useDomainService } from '../useDomainService.jsx'
import logger from '../../utils/logger.js'

export const useFeeCalculator = () => {
  const [fees, setFees] = useState({
    platform: '0.00',
    network: '0.00',
    provider: '0.00',
    dex: '0.00',
    defi: '0.00',
    routing: '0.00',
    total: '0.00'
  })
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState(null)
  const [isTimeout, setIsTimeout] = useState(false)
  
  // Get domain services
  const feeCalculationService = useDomainService('fee')
  
  // Cache for preventing duplicate calculations
  const lastCalculationParams = useRef(null)
  const lastCalculationResult = useRef(null)
  const calculationTimeoutRef = useRef(null)

  // Helper function to create parameter signature for caching
  const createParamsSignature = (transactionRequest) => {
    const relevant = {
      type: transactionRequest.type,
      amount: transactionRequest.amount,
      asset: transactionRequest.asset,
      paymentMethod: transactionRequest.paymentMethod,
      chains: transactionRequest.chains
    }
    return JSON.stringify(relevant)
  }

  // Helper function to check if parameters have changed meaningfully
  const hasSignificantParamChange = (newParams, oldParams) => {
    if (!oldParams) return true
    
    const newSig = createParamsSignature(newParams)
    const oldSig = createParamsSignature(oldParams)
    
    return newSig !== oldSig
  }

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current)
      }
    }
  }, [])

  // Calculate fees for transaction with timeout and intelligent caching
  const calculateFees = useCallback(async (transactionData) => {
    if (!feeCalculationService) {
      throw new Error('Fee calculation service not available')
    }

    // Normalize transaction request
    const transactionRequest = {
      type: transactionData.type,
      amount: parseFloat(transactionData.amount) || 0,
      asset: transactionData.asset || 'USD',
      paymentMethod: transactionData.paymentMethod || 'diboas_wallet',
      chains: transactionData.chains || [transactionData.asset || 'SOL']
    }

    // Check if calculation is needed
    if (!hasSignificantParamChange(transactionRequest, lastCalculationParams.current) && 
        lastCalculationResult.current) {
      // Return cached result
      return lastCalculationResult.current
    }

    // Clear any existing timeout
    if (calculationTimeoutRef.current) {
      clearTimeout(calculationTimeoutRef.current)
    }

    setIsCalculating(true)
    setError(null)
    setIsTimeout(false)

    // Set up 5-second timeout
    calculationTimeoutRef.current = setTimeout(() => {
      setIsTimeout(true)
      setIsCalculating(false)
      logger.warn('Fee calculation timeout', { transactionRequest })
    }, 5000)

    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('Fee calculation timeout - please try again'))
      }, 5000)
    })

    try {
      // Race between fee calculation and timeout
      const feeStructure = await Promise.race([
        feeCalculationService.calculateTransactionFees(transactionRequest),
        timeoutPromise
      ])

      // Clear timeout since we got results
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current)
      }

      // Format fees for display
      const formattedFees = {
        platform: feeStructure.getPlatformFee().amount.amount.toFixed(2),
        network: feeStructure.getNetworkFee().amount.amount.toFixed(2),
        provider: feeStructure.getProviderFee().amount.amount.toFixed(2),
        dex: feeStructure.getDexFee().amount.amount.toFixed(2),
        defi: feeStructure.getDefiFee().amount.amount.toFixed(2),
        routing: '0.00', // Not implemented yet
        total: feeStructure.getTotal().amount.toFixed(2)
      }

      setFees(formattedFees)
      
      // Cache the parameters and result
      lastCalculationParams.current = transactionRequest
      
      // Create legacy-compatible result
      const result = {
        diBoaS: feeStructure.getPlatformFee().amount.amount,
        network: feeStructure.getNetworkFee().amount.amount,
        provider: feeStructure.getProviderFee().amount.amount,
        dex: feeStructure.getDexFee().amount.amount,
        defi: feeStructure.getDefiFee().amount.amount,
        routing: 0,
        total: feeStructure.getTotal().amount,
        // Domain objects
        feeStructure,
        breakdown: feeStructure.getSummary().breakdown
      }
      
      lastCalculationResult.current = result
      
      logger.debug('Fee calculation completed', {
        transactionType: transactionRequest.type,
        totalFees: result.total,
        currency: transactionRequest.asset
      })
      
      return result
      
    } catch (err) {
      // Clear timeout on error
      if (calculationTimeoutRef.current) {
        clearTimeout(calculationTimeoutRef.current)
      }
      
      logger.error('Fee calculation failed', {
        transactionRequest,
        error: err.message
      })
      
      setError(err)
      throw err
      
    } finally {
      setIsCalculating(false)
    }
  }, [feeCalculationService])

  // Compare fee options across different payment methods
  const compareFeeOptions = useCallback(async (transactionData, paymentMethods) => {
    if (!feeCalculationService) {
      throw new Error('Fee calculation service not available')
    }

    setIsCalculating(true)
    setError(null)

    try {
      const transactionRequest = {
        type: transactionData.type,
        amount: parseFloat(transactionData.amount) || 0,
        asset: transactionData.asset || 'USD',
        chains: transactionData.chains || [transactionData.asset || 'SOL']
      }

      const comparisons = await feeCalculationService.calculateFeeComparison(
        transactionRequest, 
        paymentMethods
      )

      logger.debug('Fee comparison completed', {
        transactionType: transactionRequest.type,
        paymentMethods: paymentMethods.length,
        cheapestMethod: comparisons[0]?.paymentMethod
      })

      return comparisons.map(comparison => ({
        paymentMethod: comparison.paymentMethod,
        totalFees: comparison.totalFees.amount,
        breakdown: comparison.breakdown,
        recommended: comparison.recommended,
        // Legacy format compatibility
        total: comparison.totalFees.amount,
        diBoaS: comparison.breakdown.breakdown?.platform?.amount || 0,
        network: comparison.breakdown.breakdown?.network?.amount || 0,
        provider: comparison.breakdown.breakdown?.provider?.amount || 0,
        dex: comparison.breakdown.breakdown?.dex?.amount || 0,
        defi: comparison.breakdown.breakdown?.defi?.amount || 0
      }))

    } catch (err) {
      logger.error('Fee comparison failed', {
        transactionData,
        error: err.message
      })
      
      setError(err)
      throw err
      
    } finally {
      setIsCalculating(false)
    }
  }, [feeCalculationService])

  // Calculate fee impact on transaction amount
  const calculateFeeImpact = useCallback(async (transactionData) => {
    if (!feeCalculationService) {
      throw new Error('Fee calculation service not available')
    }

    setIsCalculating(true)
    setError(null)

    try {
      const transactionRequest = {
        type: transactionData.type,
        amount: parseFloat(transactionData.amount) || 0,
        asset: transactionData.asset || 'USD',
        paymentMethod: transactionData.paymentMethod || 'diboas_wallet',
        chains: transactionData.chains || [transactionData.asset || 'SOL']
      }

      const impact = await feeCalculationService.calculateFeeImpact(transactionRequest)

      return {
        originalAmount: impact.originalAmount.amount,
        totalFees: impact.totalFees.amount,
        netAmount: impact.netAmount.amount,
        impactPercentage: impact.impactPercentage,
        currency: impact.originalAmount.currency
      }

    } catch (err) {
      logger.error('Fee impact calculation failed', {
        transactionData,
        error: err.message
      })
      
      setError(err)
      throw err
      
    } finally {
      setIsCalculating(false)
    }
  }, [feeCalculationService])

  // Get quick fee estimate (simplified version)
  const getQuickEstimate = useCallback(async (type, amount, asset = 'USD') => {
    if (!feeCalculationService) {
      throw new Error('Fee calculation service not available')
    }

    const transactionRequest = {
      type,
      amount: parseFloat(amount) || 0,
      asset,
      paymentMethod: 'diboas_wallet',
      chains: [asset === 'BTC' ? 'BTC' : asset === 'ETH' ? 'ETH' : 'SOL']
    }

    try {
      const feeStructure = await feeCalculationService.calculateTransactionFees(transactionRequest)
      return {
        total: feeStructure.getTotal().amount,
        platform: feeStructure.getPlatformFee().amount.amount,
        network: feeStructure.getNetworkFee().amount.amount
      }
    } catch (err) {
      logger.error('Quick fee estimate failed', { type, amount, asset, error: err.message })
      throw err
    }
  }, [feeCalculationService])

  // Legacy method - get real-time fees (same as calculateFees)
  const getRealTimeFees = useCallback(async (transactionData) => {
    return calculateFees(transactionData)
  }, [calculateFees])

  return {
    fees,
    isCalculating,
    error,
    isTimeout,
    calculateFees,
    getRealTimeFees,
    getQuickEstimate,
    compareFeeOptions,
    calculateFeeImpact
  }
}