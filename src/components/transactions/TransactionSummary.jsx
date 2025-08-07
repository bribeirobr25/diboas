import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import logger from '../../utils/logger'
import { useErrorHandler } from '../../hooks/useErrorHandler.jsx'
import FinancialErrorBoundary from '../shared/FinancialErrorBoundary.jsx'

// Fee formatting utility - shows 2 decimals for standard display
const formatFeeAmount = (amount) => {
  const numAmount = parseFloat(amount) || 0
  
  // For very small fees (less than $0.01), show special formatting
  if (numAmount > 0 && numAmount < 0.01) {
    // For fees under 1 cent, show as "< $0.01"
    return "< 0.01"
  }
  
  // For normal fees, show 2 decimals
  return numAmount.toFixed(2)
}

export default function TransactionSummary({ 
  amount: transactionAmountInput, 
  transactionType: currentTransactionType,
  selectedAsset: selectedCryptocurrencyAsset,
  assets: supportedCryptocurrencyAssets,
  fees: calculatedTransactionFees,
  currentType: selectedTransactionTypeConfig,
  isOnRamp: isOnRampTransaction,
  isOffRamp: isOffRampTransaction,
  selectedPaymentMethod: chosenPaymentMethod,
  handleTransactionStart: originalHandleTransactionStart,
  isTransactionValid: isTransactionInputValid,
  getNetworkFeeRate: calculateNetworkFeePercentage,
  getProviderFeeRate: calculateProviderFeePercentage,
  getPaymentMethodFeeRate: calculatePaymentMethodFeePercentage,
  recipientAddress: recipientWalletAddress,
  isCalculatingFees = false,
  feeError = null,
  isTimeout = false
}) {
  const { handleError, createSafeWrapper } = useErrorHandler({
    logErrors: true,
    autoRecovery: true,
    notifyUser: true
  })
  const [areFeeDetailsVisible, setAreFeeDetailsVisible] = useState(false)

  // Calculate the correct DEX fee percentage for display
  const calculateDexFeePercentage = () => {
    if (currentTransactionType === 'sell') {
      // For sell transactions, DEX fee depends on the asset
      if (selectedCryptocurrencyAsset === 'SOL') {
        return '0%'  // Solana has no DEX fee
      } else {
        return '0.8%'  // All other assets have 0.8% DEX fee (from MockupFeeProviderService)
      }
    } else if (currentTransactionType === 'buy' && chosenPaymentMethod === 'diboas_wallet') {
      // For buy with diBoaS wallet, DEX fee depends on the asset
      if (selectedCryptocurrencyAsset === 'SOL') {
        return '0%'  // Solana has no DEX fee
      } else {
        return '0.8%'  // All other assets have 0.8% DEX fee (from MockupFeeProviderService)
      }
    }
    return '0%'
  }

  const calculateAssetQuantityEstimate = createSafeWrapper(
    () => {
      if (!(['buy', 'sell'].includes(currentTransactionType) && transactionAmountInput && selectedCryptocurrencyAsset && selectedCryptocurrencyAsset !== 'USD')) {
        return null
      }

      const selectedAssetData = supportedCryptocurrencyAssets.find(cryptoAsset => cryptoAsset.assetId === selectedCryptocurrencyAsset)
      if (!selectedAssetData || !selectedAssetData.currentMarketPrice) return null
      
      const marketPriceValue = parseFloat(selectedAssetData.currentMarketPrice.replace(/[$,]/g, ''))
      const inputAmountValue = parseFloat(transactionAmountInput)
      
      if (currentTransactionType === 'buy' && marketPriceValue > 0) {
        const estimatedCryptoQuantity = inputAmountValue / marketPriceValue
        return `≈ ${estimatedCryptoQuantity.toFixed(6)} ${selectedAssetData.tickerSymbol}`
      } else if (currentTransactionType === 'sell' && inputAmountValue > 0) {
        // For sell transactions, show how much crypto quantity the USD amount represents
        const estimatedCryptoQuantity = inputAmountValue / marketPriceValue
        return `≈ ${estimatedCryptoQuantity.toFixed(6)} ${selectedAssetData.tickerSymbol}`
      }
      return null
    },
    {
      context: { currentTransactionType, selectedCryptocurrencyAsset, transactionAmountInput },
      fallback: null
    }
  )

  const handleTransactionStart = createSafeWrapper(
    originalHandleTransactionStart,
    {
      context: {
        transactionType: currentTransactionType,
        amount: transactionAmountInput,
        asset: selectedCryptocurrencyAsset,
        paymentMethod: chosenPaymentMethod
      },
      fallback: () => {
        logger.error('Transaction start failed - critical financial operation')
      }
    }
  )

  return (
    <FinancialErrorBoundary
      componentName="TransactionSummary"
      transactionContext={{ 
        type: currentTransactionType, 
        amount: transactionAmountInput,
        asset: selectedCryptocurrencyAsset 
      }}
    >
      <div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction Summary</CardTitle>
        </CardHeader>
        <CardContent className="transaction-summary-content">
          {/* Special case for crypto wallet add - show instructions */}
          {currentTransactionType === 'add' && chosenPaymentMethod === 'crypto_wallet' ? (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50 rounded-lg">
                <h4 className="font-medium text-blue-900 mb-2">How to deposit:</h4>
                <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                  <li>Select the network above</li>
                  <li>Copy the wallet address</li>
                  <li>Send supported assets from your wallet</li>
                  <li>Funds will appear in 1-30 minutes</li>
                </ol>
              </div>
              
              <div className="text-center text-sm text-gray-600">
                <p>No fees for on-chain deposits</p>
                <p>Only network gas fees apply</p>
              </div>
            </div>
          ) : (
          <>
          <div className="transaction-summary-row">
            <span>Amount</span>
            <div className="text-right">
              <span className="font-medium">${transactionAmountInput || '0.00'}</span>
              {/* Show estimated asset quantity for Buy/Sell transactions */}
              {calculateAssetQuantityEstimate() && (
                <div className="text-xs text-gray-500 mt-1">
                  {calculateAssetQuantityEstimate()}
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              className="fee-details-toggle"
              onClick={() => setAreFeeDetailsVisible(!areFeeDetailsVisible)}
              disabled={isCalculatingFees}
            >
              <span>Fee Details</span>
              {isCalculatingFees ? (
                <span className="font-medium text-blue-600 flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  Loading...
                </span>
              ) : feeError || isTimeout ? (
                <span className="font-medium text-red-600">
                  {isTimeout ? 'Timeout - Try again' : 'Error'}
                </span>
              ) : (
                <span className="font-medium">${formatFeeAmount(calculatedTransactionFees?.total)}</span>
              )}
            </Button>
            
            {areFeeDetailsVisible && (
              <div className="mt-3 space-y-2 text-sm">
                <div className="fee-breakdown-row">
                  <span>diBoaS Fee ({isOffRampTransaction ? '0.9%' : '0.09%'})</span>
                  <span>${formatFeeAmount(calculatedTransactionFees?.diBoaS)}</span>
                </div>
                <div className="fee-breakdown-row">
                  <span>Network Fee ({calculateNetworkFeePercentage()})</span>
                  <span>${formatFeeAmount(calculatedTransactionFees?.network)}</span>
                </div>
                {/* Provider Fee - for Add/Buy/Withdraw to traditional payment methods */}
                {((isOnRampTransaction || (currentTransactionType === 'buy' && chosenPaymentMethod !== 'diboas_wallet')) || (isOffRampTransaction && chosenPaymentMethod !== 'external_wallet')) && currentTransactionType !== 'send' && (
                  <div className="fee-breakdown-row">
                    <span>Provider Fee ({calculateProviderFeePercentage()})</span>
                    <span>${formatFeeAmount(calculatedTransactionFees?.provider)}</span>
                  </div>
                )}
                {/* DEX Fee for external wallet withdrawals */}
                {(currentTransactionType === 'withdraw' && chosenPaymentMethod === 'external_wallet') && (
                  <div className="fee-breakdown-row">
                    <span>DEX Fee ({calculateProviderFeePercentage()})</span>
                    <span>${formatFeeAmount(calculatedTransactionFees?.dex)}</span>
                  </div>
                )}
                {/* DEX Fee for Buy/Sell transactions */}
                {['buy', 'sell'].includes(currentTransactionType) && (
                  <>
                    {/* DEX Fee - for Buy using diBoaS wallet and all Sell transactions */}
                    {((currentTransactionType === 'buy' && chosenPaymentMethod === 'diboas_wallet') || currentTransactionType === 'sell') && calculatedTransactionFees?.dex > 0 && (
                      <div className="fee-breakdown-row">
                        <span>DEX Fee ({calculateDexFeePercentage()})</span>
                        <span>${formatFeeAmount(calculatedTransactionFees?.dex)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="transaction-total-section">
            <div className="transaction-total-row">
              <span>Total</span>
              <span>${transactionAmountInput && calculatedTransactionFees ? (() => {
                const transactionAmountNumber = parseFloat(transactionAmountInput) || 0;
                const totalNumber = parseFloat(calculatedTransactionFees.total) || 0;
                const netTransactionTotal = transactionAmountNumber - totalNumber;
                logger.debug('TransactionSummary: amount=', transactionAmountNumber, 'fees=', totalNumber, 'net total=', netTransactionTotal);
                return netTransactionTotal.toFixed(2);
              })() : transactionAmountInput || '0.00'}</span>
            </div>
          </div>
          
          {/* Irreversible transaction warning for Send transactions */}
          {currentTransactionType === 'send' && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg mb-4">
              <div className="flex items-start gap-2">
                <div className="text-amber-600 mt-0.5">⚠️</div>
                <div className="text-sm text-amber-800">
                  <p className="font-medium mb-1">Irreversible Transaction</p>
                  <p>Send transactions cannot be undone. Please verify the recipient @username and amount before proceeding.</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="transaction-action-section">
            <Button
              variant="cta"
              className="transaction-execute-button"
              onClick={handleTransactionStart}
              disabled={!isTransactionInputValid || isCalculatingFees || feeError || isTimeout || !calculatedTransactionFees?.total}
            >
              {isCalculatingFees ? (
                <span className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Retrieving fees...
                </span>
              ) : isTimeout ? (
                'Try Again - Fee Timeout'
              ) : feeError ? (
                'Try Again - Fee Error'
              ) : !calculatedTransactionFees?.total ? (
                'Waiting for fees...'
              ) : (
                `${selectedTransactionTypeConfig?.label} ${transactionAmountInput ? `$${transactionAmountInput}` : ''}`
              )}
            </Button>
            
            {/* Fee Loading Status Messages */}
            {isCalculatingFees && (
              <div className="mt-2 text-center">
                <p className="text-xs text-blue-600">
                  Getting real-time fees from our partners...
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  This ensures you get the most accurate pricing
                </p>
              </div>
            )}
            
            {isTimeout && (
              <div className="mt-2 text-center">
                <p className="text-xs text-red-600">
                  Fee retrieval took too long. Please try again.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  We need current fees to ensure accurate pricing
                </p>
              </div>
            )}
            
            {feeError && !isTimeout && (
              <div className="mt-2 text-center">
                <p className="text-xs text-red-600">
                  Unable to retrieve current fees. Please try again.
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  Real-time fees are required for transactions
                </p>
              </div>
            )}
          </div>
          
          <div className="text-xs text-gray-500 text-center">
            <p>All complexities handled in the background</p>
            <p>No gas fees, swaps, or approvals needed</p>
          </div>
          </>
          )}
        </CardContent>
      </Card>
      </div>
    </FinancialErrorBoundary>
  )
}