import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Info, AlertCircle } from 'lucide-react'

export default function AmountInput({ 
  amount, 
  setAmount, 
  transactionType, 
  selectedAsset, 
  setSelectedAsset,
  assets, 
  balance, 
  availableBalance,
  validationErrors,
  selectedPaymentMethod 
}) {
  
  const getAmountOptions = () => {
    switch(transactionType) {
      case 'add':
      case 'buy':
        return [
          { label: '$25', value: '25' },
          { label: '$50', value: '50' },
          { label: '$100', value: '100' }
        ]
      case 'send':
        return [
          { label: '5%', value: Math.round((balance?.availableForSpending || 0) * 0.05 * 100) / 100 },
          { label: '10%', value: Math.round((balance?.availableForSpending || 0) * 0.10 * 100) / 100 },
          { label: '25%', value: Math.round((balance?.availableForSpending || 0) * 0.25 * 100) / 100 }
        ]
      case 'transfer':
        return [
          { label: '25%', value: Math.round((balance?.availableForSpending || 0) * 0.25 * 100) / 100 },
          { label: '50%', value: Math.round((balance?.availableForSpending || 0) * 0.50 * 100) / 100 },
          { label: 'Max', value: balance?.availableForSpending || 0 }
        ]
      case 'sell':
        const assetBalance = balance?.assets?.[selectedAsset]?.investedAmount || 0
        return [
          { label: '25%', value: Math.round(assetBalance * 0.25 * 100) / 100 },
          { label: '50%', value: Math.round(assetBalance * 0.50 * 100) / 100 },
          { label: 'Max', value: assetBalance }
        ]
      case 'withdraw':
        return [
          { label: '25%', value: Math.round((balance?.availableForSpending || 0) * 0.25 * 100) / 100 },
          { label: '50%', value: Math.round((balance?.availableForSpending || 0) * 0.50 * 100) / 100 },
          { label: 'Max', value: balance?.availableForSpending || 0 }
        ]
      default:
        return []
    }
  }

  return (
    <div>
      <Label htmlFor="amount">Amount</Label>
      <div className="amount-input-container">
        <Input
          id="amount"
          name="amount"
          type="number"
          placeholder="0.00"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          autoComplete="off"
          style={{ 
            MozAppearance: 'textfield',
            WebkitAppearance: 'none',
            appearance: 'none'
          }}
          className={`text-2xl h-14 [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none ${
            transactionType === 'sell'
              ? 'pr-20'  // Space for asset dropdown (Sell only)
              : 'pr-16'  // Space for USD label only
          } ${validationErrors.amount ? 'border-red-500 focus:border-red-500' : ''}`}
        />
        {/* Show USD for most transactions, asset dropdown only for Sell */}
        {transactionType === 'sell' ? (
          <select
            id="asset-selector"
            name="asset"
            value={selectedAsset}
            onChange={(e) => setSelectedAsset(e.target.value)}
            className="asset-selector"
            aria-label="Select asset to sell"
            autoComplete="off"
            >
              {assets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.label}
                </option>
              ))}
            </select>
        ) : (
            <span className="currency-label">USD</span>
        )}
      </div>

      {/* Amount Quick Options */}
      <div className="amount-quick-options">
        {getAmountOptions().map((option, index) => (
          <button
            key={index}
            type="button"
            className="amount-option-button"
            onClick={() => setAmount(option.value.toString())}
          >
            {option.label}
          </button>
        ))}
      </div>

      <p className="text-sm text-gray-500 mt-1">
        {['withdraw', 'send', 'transfer'].includes(transactionType)
          ? `Maximum ${transactionType === 'withdraw' ? 'withdrawable' : transactionType === 'send' ? 'sendable' : 'transferable'}: $${balance?.availableForSpending?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}` 
          : transactionType === 'sell'
          ? `Invested in ${selectedAsset}: $${typeof availableBalance === 'number' ? availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}`
          : `Available: $${typeof availableBalance === 'number' ? availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}`
        }
      </p>
      
      {validationErrors.amount && (
        <p className="text-sm text-red-600 mt-1">
          {validationErrors.amount.message}
        </p>
      )}
      
      {['withdraw', 'send', 'transfer'].includes(transactionType) && balance?.investedAmount > 0 && (
        <div className="info-box">
          <div className="flex items-start space-x-2">
            <Info className="info-icon" />
            <div className="info-content">
              <p className="font-medium">Invested funds cannot be {transactionType === 'withdraw' ? 'withdrawn' : transactionType === 'send' ? 'sent' : 'transferred'} directly</p>
              <p>You have ${balance.investedAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })} in investments. To {transactionType === 'withdraw' ? 'withdraw' : transactionType === 'send' ? 'send' : 'transfer'} invested funds, first sell your assets.</p>
            </div>
          </div>
        </div>
      )}
      
      {transactionType === 'buy' && selectedPaymentMethod === 'diboas_wallet' && amount && parseFloat(amount) > (balance?.availableForSpending || 0) && (
        <div className="error-box">
          <div className="flex items-start space-x-2">
            <AlertCircle className="error-icon" />
            <div className="error-content">
              <p className="font-medium">Insufficient diBoaS wallet balance</p>
              <p>You need ${parseFloat(amount).toLocaleString('en-US', { minimumFractionDigits: 2 })} but only have ${(balance?.availableForSpending || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })} available. Choose an external payment method or add funds first.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}