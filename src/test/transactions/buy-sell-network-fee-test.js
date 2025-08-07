/**
 * Buy/Sell Network Fee Test
 * Quick test to verify network fees are calculated for buy/sell transactions
 */

import { FeeCalculator } from '../../utils/feeCalculations.js'

console.log('Testing Buy/Sell Network Fee Calculation...')

const feeCalculator = new FeeCalculator()

// Test Buy Transaction with different assets
const testCases = [
  {
    name: 'Buy BTC with diBoaS wallet',
    transaction: {
      type: 'buy',
      amount: 1000,
      paymentMethod: 'diboas_wallet',
      asset: 'BTC',
      chains: ['BTC']
    }
  },
  {
    name: 'Buy ETH with diBoaS wallet',
    transaction: {
      type: 'buy',
      amount: 1000,
      paymentMethod: 'diboas_wallet',
      asset: 'ETH',
      chains: ['ETH']
    }
  },
  {
    name: 'Buy SOL with diBoaS wallet',
    transaction: {
      type: 'buy',
      amount: 1000,
      paymentMethod: 'diboas_wallet',
      asset: 'SOL',
      chains: ['SOL']
    }
  },
  {
    name: 'Sell BTC with diBoaS wallet',
    transaction: {
      type: 'sell',
      amount: 1000,
      paymentMethod: 'diboas_wallet',
      asset: 'BTC',
      chains: ['BTC']
    }
  },
  {
    name: 'Buy BTC with credit card',
    transaction: {
      type: 'buy',
      amount: 1000,
      paymentMethod: 'credit_debit_card',
      asset: 'BTC',
      chains: ['BTC']
    }
  }
]

testCases.forEach(testCase => {
  console.log(`\n--- ${testCase.name} ---`)
  try {
    const fees = feeCalculator.calculateFees(testCase.transaction)
    console.log('Total Fees:', fees.total)
    console.log('diBoaS Fee:', fees.diBoaS)
    console.log('Network Fee:', fees.network)
    console.log('Provider Fee:', fees.provider)
    console.log('DEX Fee:', fees.dex)
    console.log('DeFi Fee:', fees.defi)
    
    // Check if network fee is being calculated
    if (fees.network === 0) {
      console.log('❌ WARNING: Network fee is 0 - this might be the issue!')
    } else {
      console.log('✅ Network fee calculated correctly')
    }
  } catch (error) {
    console.log('❌ ERROR:', error.message)
  }
})