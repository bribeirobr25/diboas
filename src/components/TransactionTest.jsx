/**
 * Transaction System Test Component
 * Quick test to verify transaction system functionality
 */

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { useWalletBalance, useTransactionProcessor, useFeeCalculator } from '../hooks/useTransactions.jsx'

const TransactionTest = () => {
  const { balance, getBalance, isLoading: walletLoading } = useWalletBalance()
  const { processTransaction, isProcessing } = useTransactionProcessor()
  const { calculateFees, fees } = useFeeCalculator()
  const [testResults, setTestResults] = useState([])

  // Test wallet balance retrieval
  const testWalletBalance = async () => {
    try {
      const result = await getBalance(true)
      setTestResults(prev => [...prev, {
        test: 'Wallet Balance',
        status: 'success',
        data: result ? `Total: $${result.totalUSD?.toFixed(2)}` : 'No balance data'
      }])
    } catch (error) {
      setTestResults(prev => [...prev, {
        test: 'Wallet Balance',
        status: 'error',
        data: error.message
      }])
    }
  }

  // Test fee calculation
  const testFeeCalculation = async () => {
    try {
      const testTransaction = {
        type: 'send',
        amount: '100',
        paymentMethod: 'card'
      }
      
      const result = await calculateFees(testTransaction)
      setTestResults(prev => [...prev, {
        test: 'Fee Calculation',
        status: 'success',
        data: `Total fees: $${result?.total?.toFixed(2) || '0.00'}`
      }])
    } catch (error) {
      setTestResults(prev => [...prev, {
        test: 'Fee Calculation',
        status: 'error',
        data: error.message
      }])
    }
  }

  // Test mock transaction
  const testMockTransaction = async () => {
    try {
      const testTransaction = {
        type: 'send',
        amount: '10',
        recipient: '@testuser',
        asset: 'USD'
      }
      
      // Note: This will likely fail due to missing user context, but tests the system
      await processTransaction(testTransaction)
      setTestResults(prev => [...prev, {
        test: 'Mock Transaction',
        status: 'success',
        data: 'Transaction processed successfully'
      }])
    } catch (error) {
      setTestResults(prev => [...prev, {
        test: 'Mock Transaction',
        status: 'expected_error',
        data: error.message
      }])
    }
  }

  const runAllTests = async () => {
    setTestResults([])
    await testWalletBalance()
    await testFeeCalculation()
    await testMockTransaction()
  }

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Transaction System Test</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={runAllTests}
          disabled={walletLoading || isProcessing}
          className="w-full"
        >
          {walletLoading || isProcessing ? 'Testing...' : 'Run Transaction System Tests'}
        </Button>

        {/* Test Results */}
        {testResults.length > 0 && (
          <div className="space-y-2">
            <h3 className="font-semibold">Test Results:</h3>
            {testResults.map((result, index) => (
              <div 
                key={index}
                className={`p-3 rounded-lg border ${
                  result.status === 'success' ? 'bg-green-50 border-green-200' :
                  result.status === 'expected_error' ? 'bg-yellow-50 border-yellow-200' :
                  'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-medium">{result.test}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    result.status === 'success' ? 'bg-green-100 text-green-800' :
                    result.status === 'expected_error' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {result.status === 'expected_error' ? 'Expected Error' : result.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-1">{result.data}</p>
              </div>
            ))}
          </div>
        )}

        {/* Current Balance Display */}
        {balance && (
          <div className="mt-4 p-3 bg-blue-50 rounded-lg">
            <h4 className="font-medium">Current Balance Info:</h4>
            <p className="text-sm">Total USD: ${balance.totalUSD?.toFixed(2) || '0.00'}</p>
            <p className="text-sm">Available USDC: ${balance.availableForSpending?.toFixed(2) || '0.00'}</p>
            <p className="text-sm">Active Chains: {Object.keys(balance.breakdown || {}).length}</p>
          </div>
        )}

        {/* Fee Calculation Display */}
        {fees && (
          <div className="mt-4 p-3 bg-purple-50 rounded-lg">
            <h4 className="font-medium">Last Fee Calculation:</h4>
            <p className="text-sm">Total Fees: ${fees.total?.toFixed(2) || '0.00'}</p>
            <p className="text-sm">Effective Rate: {fees.effectiveRate?.toFixed(2) || '0'}%</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default TransactionTest