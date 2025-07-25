/**
 * Fee Calculator Hook
 * Handles transaction fee calculations and estimates
 */

import { useState, useCallback } from 'react'
import { defaultFeeCalculator } from '../../utils/feeCalculations.js'

export const useFeeCalculator = () => {
  const [fees, setFees] = useState({
    diBoaS: '0.00',
    network: '0.00',
    provider: '0.00',
    payment: '0.00',
    dex: '0.00',
    routing: '0.00',
    gas: '0.00',
    total: '0.00'
  })
  const [isCalculating, setIsCalculating] = useState(false)
  const [error, setError] = useState(null)

  // Calculate fees for transaction
  const calculateFees = useCallback(async (transactionData, routingPlan = null) => {
    setIsCalculating(true)
    setError(null)

    try {
      // Use the comprehensive fee calculation method
      const feeData = await defaultFeeCalculator.calculateComprehensiveFees(transactionData)
      setFees({
        diBoaS: feeData.diBoaS?.toFixed(2) || '0.00',
        network: feeData.network?.toFixed(2) || '0.00', 
        provider: feeData.provider?.toFixed(2) || '0.00',
        payment: feeData.payment?.toFixed(2) || '0.00',
        dex: feeData.dex?.toFixed(2) || '0.00',
        routing: feeData.routing?.toFixed(2) || '0.00',
        gas: feeData.gas?.toFixed(2) || '0.00',
        total: feeData.total?.toFixed(2) || '0.00'
      })
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