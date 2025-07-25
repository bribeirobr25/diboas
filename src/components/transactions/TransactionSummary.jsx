import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'

export default function TransactionSummary({ 
  amount, 
  transactionType,
  selectedAsset,
  assets,
  fees,
  currentType,
  isOnRamp,
  isOffRamp,
  selectedPaymentMethod,
  handleTransactionStart,
  isTransactionValid,
  getNetworkFeeRate,
  getProviderFeeRate,
  getPaymentMethodFeeRate,
  // recipientAddress
}) {
  const [showFeeDetails, setShowFeeDetails] = useState(false)

  const renderAssetQuantityEstimate = () => {
    if (!(['buy', 'sell'].includes(transactionType) && amount && selectedAsset && selectedAsset !== 'USD')) {
      return null
    }

    const assetData = assets.find(a => a.id === selectedAsset)
    if (!assetData || !assetData.price) return null
    
    const priceValue = parseFloat(assetData.price.replace(/[$,]/g, ''))
    const amountValue = parseFloat(amount)
    
    if (transactionType === 'buy' && priceValue > 0) {
      const estimatedQuantity = amountValue / priceValue
      return `≈ ${estimatedQuantity.toFixed(6)} ${assetData.symbol}`
    } else if (transactionType === 'sell' && amountValue > 0) {
      const estimatedFiat = amountValue * priceValue
      return `≈ $${estimatedFiat.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
    }
    return null
  }

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Transaction Summary</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between">
            <span>Amount</span>
            <div className="text-right">
              <span className="font-medium">${amount || '0.00'}</span>
              {/* Show estimated asset quantity for Buy/Sell transactions */}
              {renderAssetQuantityEstimate() && (
                <div className="text-xs text-gray-500 mt-1">
                  {renderAssetQuantityEstimate()}
                </div>
              )}
            </div>
          </div>
          
          <div className="border-t pt-4">
            <Button
              variant="ghost"
              className="w-full justify-between p-0 h-auto"
              onClick={() => setShowFeeDetails(!showFeeDetails)}
            >
              <span>Fee Details</span>
              <span className="font-medium">${(parseFloat(fees?.total) || 0).toFixed(2)}</span>
            </Button>
            
            {showFeeDetails && (
              <div className="mt-3 space-y-2 text-sm">
                <div className="flex justify-between text-gray-600">
                  <span>diBoaS Fee ({isOffRamp || transactionType === 'transfer' ? '0.9%' : '0.09%'})</span>
                  <span>${(parseFloat(fees?.diBoaS) || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-gray-600">
                  <span>Network Fee ({getNetworkFeeRate()})</span>
                  <span>${(parseFloat(fees?.network) || 0).toFixed(2)}</span>
                </div>
                {/* Provider Fee - for Add/Withdraw transactions, but NOT Send (P2P) */}
                {(isOnRamp || isOffRamp) && transactionType !== 'send' && (
                  <div className="flex justify-between text-gray-600">
                    <span>Provider Fee ({getProviderFeeRate()})</span>
                    <span>${(parseFloat(fees?.provider) || 0).toFixed(2)}</span>
                  </div>
                )}
                {/* DEX Fee for Transfer transactions */}
                {transactionType === 'transfer' && (
                  <div className="flex justify-between text-gray-600">
                    <span>DEX Fee ({getProviderFeeRate()})</span>
                    <span>${(parseFloat(fees?.provider) || 0).toFixed(2)}</span>
                  </div>
                )}
                {/* Buy/Sell transaction specific fees */}
                {['buy', 'sell'].includes(transactionType) && (
                  <>
                    {/* Payment Fee - only for Buy with external payment methods */}
                    {transactionType === 'buy' && selectedPaymentMethod !== 'diboas_wallet' && fees?.payment > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>Payment Fee ({getPaymentMethodFeeRate()})</span>
                        <span>${(parseFloat(fees?.payment) || 0).toFixed(2)}</span>
                      </div>
                    )}
                    {/* DEX Fee - for Buy using diBoaS wallet and all Sell transactions */}
                    {((transactionType === 'buy' && selectedPaymentMethod === 'diboas_wallet') || transactionType === 'sell') && fees?.dex > 0 && (
                      <div className="flex justify-between text-gray-600">
                        <span>DEX Fee (1%)</span>
                        <span>${(parseFloat(fees?.dex) || 0).toFixed(2)}</span>
                      </div>
                    )}
                  </>
                )}
              </div>
            )}
          </div>
          
          <div className="border-t pt-4">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>${amount && fees ? (() => {
                const amountNum = parseFloat(amount) || 0;
                const feesNum = parseFloat(fees.total) || 0;
                const total = amountNum - feesNum;
                console.log('TransactionSummary: amount=', amountNum, 'fees=', feesNum, 'net total=', total);
                return total.toFixed(2);
              })() : amount || '0.00'}</span>
            </div>
          </div>
          
          <div className="pt-4">
            <Button
              variant="cta"
              className="w-full"
              onClick={handleTransactionStart}
              disabled={!isTransactionValid}
            >
              {`${currentType?.label} ${amount ? `$${amount}` : ''}`}
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