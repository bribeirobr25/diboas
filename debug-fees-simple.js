#!/usr/bin/env node

/**
 * Simple debug script to test fee calculation
 */

import { FEE_STRUCTURE, FeeCalculator } from './src/utils/feeCalculations.js'

function debugFeeCalculation() {
  console.log('🔍 Debugging Fee Calculation for Add Transaction')
  console.log('==============================================')
  
  const feeCalculator = new FeeCalculator()
  
  // Test transaction data - same as what would be used in the app
  const transactionData = {
    type: 'add',
    amount: 100,
    paymentMethod: 'credit_debit_card',
    asset: 'USD'
  }
  
  console.log('Transaction data:', transactionData)
  console.log()
  
  // Calculate fees using the synchronous method (same as used in updateBalance)
  const fees = feeCalculator.calculateTransactionFeesSync(transactionData)
  
  console.log('Calculated fees breakdown:')
  console.log('- diBoaS fee:', fees.diBoaS)
  console.log('- Network fee:', fees.network)  
  console.log('- Provider fee:', fees.provider)
  console.log('- Total fees:', fees.total)
  console.log()
  
  // Manual calculation verification
  console.log('Manual verification:')
  const diBoaSRate = FEE_STRUCTURE.DIBOAS_FEES['add'] // 0.0009 = 0.09%
  const networkRate = FEE_STRUCTURE.NETWORK_FEES['SOL'] // 0.00001 = 0.001%
  const providerRate = FEE_STRUCTURE.PAYMENT_PROVIDER_FEES.onramp['credit_debit_card'] // 0.01 = 1%
  
  console.log('- diBoaS rate:', diBoaSRate, '(0.09%)')
  console.log('- Network rate:', networkRate, '(0.001%)')
  console.log('- Provider rate:', providerRate, '(1%)')
  console.log()
  
  const expectedDiBoaS = 100 * diBoaSRate
  const expectedNetwork = 100 * networkRate
  const expectedProvider = 100 * providerRate
  const expectedTotal = expectedDiBoaS + expectedNetwork + expectedProvider
  
  console.log('Expected fees:')
  console.log('- diBoaS fee:', expectedDiBoaS)
  console.log('- Network fee:', expectedNetwork)
  console.log('- Provider fee:', expectedProvider)
  console.log('- Total fees:', expectedTotal)
  console.log()
  
  // Balance calculation
  const netAmount = 100 - fees.total
  console.log('Net amount that should be added to balance:', netAmount)
  console.log('(This is what should be added to Available Balance)')
  console.log()
  
  // Verify if fees object has the right structure
  console.log('Fees object structure:')
  console.log('fees.total:', fees.total)
  console.log('typeof fees.total:', typeof fees.total)
  console.log('fees object keys:', Object.keys(fees))
  
  return fees
}

// Run the debug
const calculatedFees = debugFeeCalculation()

console.log('\n' + '='.repeat(50))
console.log('CONCLUSION:')
console.log('If add transaction amount is $100 with these fees:')
console.log('Available balance should increase by:', 100 - calculatedFees.total)
console.log('='.repeat(50))