#!/usr/bin/env node

/**
 * Debug script to test add transaction fee calculation and balance update
 */

import { dataManager } from './src/services/DataManager.js'
import { defaultFeeCalculator } from './src/utils/feeCalculations.js'

async function debugAddTransaction() {
  console.log('🔍 Debugging Add Transaction Flow')
  console.log('===============================')
  
  // Reset to clean state
  dataManager.initializeCleanState()
  
  // Get initial balance
  const initialBalance = dataManager.getBalance()
  console.log('📊 Initial Balance:', {
    available: initialBalance.availableForSpending,
    invested: initialBalance.investedAmount,
    total: initialBalance.totalUSD
  })
  
  // Test transaction data
  const transactionData = {
    type: 'add',
    amount: 100,
    paymentMethod: 'credit_debit_card',
    asset: 'USD'
  }
  
  // Calculate fees
  console.log('\n💰 Calculating fees for transaction:')
  console.log('Transaction:', transactionData)
  
  const fees = await defaultFeeCalculator.calculateTransactionFees(transactionData)
  console.log('Calculated fees:', {
    diBoaS: fees.diBoaS,
    network: fees.network,
    provider: fees.provider,
    total: fees.total
  })
  
  // Expected net amount
  const expectedNetAmount = transactionData.amount - fees.total
  console.log('Expected net amount (amount - fees):', expectedNetAmount)
  
  // Update balance via DataManager
  console.log('\n⚡ Updating balance via DataManager...')
  const updateData = {
    type: transactionData.type,
    amount: transactionData.amount,
    fees: fees,
    asset: transactionData.asset,
    paymentMethod: transactionData.paymentMethod
  }
  
  console.log('Update data being sent to DataManager:', updateData)
  
  await dataManager.updateBalance(updateData)
  
  // Get updated balance
  const updatedBalance = dataManager.getBalance()
  console.log('\n📊 Updated Balance:', {
    available: updatedBalance.availableForSpending,
    invested: updatedBalance.investedAmount,
    total: updatedBalance.totalUSD
  })
  
  // Check if the calculation is correct
  const actualIncrease = updatedBalance.availableForSpending - initialBalance.availableForSpending
  console.log('\n🧮 Verification:')
  console.log('Expected increase:', expectedNetAmount)
  console.log('Actual increase:', actualIncrease)
  console.log('Is correct?', Math.abs(actualIncrease - expectedNetAmount) < 0.01)
  
  if (Math.abs(actualIncrease - expectedNetAmount) >= 0.01) {
    console.log('❌ ERROR: Balance update is incorrect!')
    console.log('Difference:', actualIncrease - expectedNetAmount)
  } else {
    console.log('✅ SUCCESS: Balance update is correct!')
  }
}

// Run the debug
debugAddTransaction().catch(console.error)