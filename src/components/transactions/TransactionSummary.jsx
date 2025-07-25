import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'

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
  // recipientAddress: recipientWalletAddress
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
              <span className="font-medium">${(parseFloat(calculatedTransactionFees?.total) || 0).toFixed(2)}</span>
            </Button>
            
            {areFeeDetailsVisible && (
              <div className="mt-3 space-y-2 text-sm">
                <div className="fee-breakdown-row">
                  <span>diBoaS Fee ({isOffRampTransaction || currentTransactionType === 'transfer' ? '0.9%' : '0.09%'})</span>
                  <span>${(parseFloat(calculatedTransactionFees?.diBoaS) || 0).toFixed(2)}</span>
                </div>
                <div className="fee-breakdown-row">
                  <span>Network Fee ({calculateNetworkFeePercentage()})</span>
                  <span>${(parseFloat(calculatedTransactionFees?.network) || 0).toFixed(2)}</span>
                </div>
                {/* Provider Fee - for Add/Withdraw transactions, but NOT Send (P2P) */}
                {(isOnRampTransaction || isOffRampTransaction) && currentTransactionType !== 'send' && (
                  <div className="fee-breakdown-row">
                    <span>Provider Fee ({calculateProviderFeePercentage()})</span>
                    <span>${(parseFloat(calculatedTransactionFees?.provider) || 0).toFixed(2)}</span>
                  </div>
                )}
                {/* DEX Fee for Transfer transactions */}
                {currentTransactionType === 'transfer' && (
                  <div className="fee-breakdown-row">
                    <span>DEX Fee ({calculateProviderFeePercentage()})</span>
                    <span>${(parseFloat(calculatedTransactionFees?.provider) || 0).toFixed(2)}</span>
                  </div>
                )}
                {/* Buy/Sell transaction specific fees */}
                {['buy', 'sell'].includes(currentTransactionType) && (
                  <>
                    {/* Payment Fee - only for Buy with external payment methods */}
                    {currentTransactionType === 'buy' && chosenPaymentMethod !== 'diboas_wallet' && calculatedTransactionFees?.payment > 0 && (
                      <div className="fee-breakdown-row">
                        <span>Payment Fee ({calculatePaymentMethodFeePercentage()})</span>
                        <span>${(parseFloat(calculatedTransactionFees?.payment) || 0).toFixed(2)}</span>
                      </div>
                    )}
                    {/* DEX Fee - for Buy using diBoaS wallet and all Sell transactions */}
                    {((currentTransactionType === 'buy' && chosenPaymentMethod === 'diboas_wallet') || currentTransactionType === 'sell') && calculatedTransactionFees?.dex > 0 && (
                      <div className="fee-breakdown-row">
                        <span>DEX Fee (1%)</span>
                        <span>${(parseFloat(calculatedTransactionFees?.dex) || 0).toFixed(2)}</span>
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
        </CardContent>
      </Card>
    </div>
  )
}