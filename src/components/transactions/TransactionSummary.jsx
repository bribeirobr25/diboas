import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'

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
  handleTransactionStart: handleTransactionStart,
  isTransactionValid: isTransactionInputValid,
  getNetworkFeeRate: calculateNetworkFeePercentage,
  getProviderFeeRate: calculateProviderFeePercentage,
  getPaymentMethodFeeRate: calculatePaymentMethodFeePercentage,
  recipientAddress: recipientWalletAddress
}) {
  const [areFeeDetailsVisible, setAreFeeDetailsVisible] = useState(false)

  const calculateAssetQuantityEstimate = () => {
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
      const estimatedFiatValue = inputAmountValue * marketPriceValue
      return `≈ $${estimatedFiatValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    return null
  }

  return (
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
            >
              <span>Fee Details</span>
              <span className="font-medium">${formatFeeAmount(calculatedTransactionFees?.total)}</span>
            </Button>
            
            {areFeeDetailsVisible && (
              <div className="mt-3 space-y-2 text-sm">
                <div className="fee-breakdown-row">
                  <span>diBoaS Fee ({isOffRampTransaction || currentTransactionType === 'transfer' ? '0.9%' : '0.09%'})</span>
                  <span>${formatFeeAmount(calculatedTransactionFees?.diBoaS)}</span>
                </div>
                <div className="fee-breakdown-row">
                  <span>Network Fee ({calculateNetworkFeePercentage()})</span>
                  <span>${formatFeeAmount(calculatedTransactionFees?.network)}</span>
                </div>
                {/* Provider Fee - for Add/Withdraw to traditional payment methods */}
                {(isOnRampTransaction || (isOffRampTransaction && chosenPaymentMethod !== 'external_wallet')) && currentTransactionType !== 'send' && (
                  <div className="fee-breakdown-row">
                    <span>Provider Fee ({calculateProviderFeePercentage()})</span>
                    <span>${formatFeeAmount(calculatedTransactionFees?.provider)}</span>
                  </div>
                )}
                {/* DEX Fee for Transfer transactions and external wallet withdrawals */}
                {(currentTransactionType === 'transfer' || (currentTransactionType === 'withdraw' && chosenPaymentMethod === 'external_wallet')) && (
                  <div className="fee-breakdown-row">
                    <span>DEX Fee ({calculateProviderFeePercentage()})</span>
                    <span>${formatFeeAmount(calculatedTransactionFees?.provider)}</span>
                  </div>
                )}
                {/* Buy/Sell transaction specific fees */}
                {['buy', 'sell'].includes(currentTransactionType) && (
                  <>
                    {/* Payment Fee - only for Buy with external payment methods */}
                    {currentTransactionType === 'buy' && chosenPaymentMethod !== 'diboas_wallet' && calculatedTransactionFees?.payment > 0 && (
                      <div className="fee-breakdown-row">
                        <span>Payment Fee ({calculatePaymentMethodFeePercentage()})</span>
                        <span>${formatFeeAmount(calculatedTransactionFees?.payment)}</span>
                      </div>
                    )}
                    {/* DEX Fee - for Buy using diBoaS wallet and all Sell transactions */}
                    {((currentTransactionType === 'buy' && chosenPaymentMethod === 'diboas_wallet') || currentTransactionType === 'sell') && calculatedTransactionFees?.dex > 0 && (
                      <div className="fee-breakdown-row">
                        <span>DEX Fee (0.2%)</span>
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
                const totalFeesNumber = parseFloat(calculatedTransactionFees.total) || 0;
                const netTransactionTotal = transactionAmountNumber - totalFeesNumber;
                console.log('TransactionSummary: amount=', transactionAmountNumber, 'fees=', totalFeesNumber, 'net total=', netTransactionTotal);
                return netTransactionTotal.toFixed(2);
              })() : transactionAmountInput || '0.00'}</span>
            </div>
          </div>
          
          <div className="transaction-action-section">
            <Button
              variant="cta"
              className="transaction-execute-button"
              onClick={handleTransactionStart}
              disabled={!isTransactionInputValid}
            >
              {`${selectedTransactionTypeConfig?.label} ${transactionAmountInput ? `$${transactionAmountInput}` : ''}`}
            </Button>
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
  )
}