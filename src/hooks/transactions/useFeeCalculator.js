/**
 * Fee Calculator Hook
 * Handles transaction fee calculations and estimates
 */

import { useState, useCallback } from 'react'
import { defaultFeeCalculator } from '../../utils/feeCalculations.js'

export const useFeeCalculator = () => {
  const [fees, setFees] = useState({
    diBoaSFee: '0.00',
    networkFee: '0.00',
    providerFee: '0.00',
    total: '0.00'
  })
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState(null)

  // Calculate fees for transaction
  const calculateFees = useCallback(async (transactionData, routingPlan = null) => {
    setIsCalculating(true)
    setError(null)

    try {
      const feeData = await defaultFeeCalculator.calculateTransactionFees(transactionData, routingPlan)
      setFees(feeData)
      return feeData
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsCalculating(false)
    }
  }, [])

  // Get real-time fees
  const getRealTimeFees = useCallback(async (transactionData) => {
    setIsCalculating(true)
    setError(null)

    try {
      const feeData = await defaultFeeCalculator.getRealTimeFees(transactionData)
      setFees(feeData)
      return feeData
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsCalculating(false)
    }
  }, [])

  // Get quick estimate
  const getQuickEstimate = useCallback(async (type, amount) => {
    setIsCalculating(true)
    setError(null)

    try {
      const estimate = await defaultFeeCalculator.getQuickEstimate(type, amount)
      return estimate
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsCalculating(false)
    }
  }, [])

  // Compare fee options
  const compareFeeOptions = useCallback(async (transactionData, routingOptions) => {
    setIsCalculating(true)
    setError(null)

    try {
      const comparison = await defaultFeeCalculator.compareFeeOptions(transactionData, routingOptions)
      return comparison
    } catch (err) {
      setError(err)
      throw err
    } finally {
      setIsCalculating(false)
    }
  }, [])

  return {
    fees,
    isCalculating,
    error,
    calculateFees,
    getRealTimeFees,
    getQuickEstimate,
    compareFeeOptions
  }
}