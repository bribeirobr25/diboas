import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Search, QrCode, Copy, Eye, EyeOff } from 'lucide-react'
import AmountInput from './AmountInput.jsx'
import PaymentMethodSelector from './PaymentMethodSelector.jsx'
import DiBoaSUsernameInput from './DiBoaSUsernameInput.jsx'
import WalletAddressInput from './WalletAddressInput.jsx'

export default function TransactionForm({ 
  transactionType,
  isOnRamp,
  isOffRamp,
  recipientAddress,
  setRecipientAddress,
  amount,
  setAmount,
  selectedAsset,
  setSelectedAsset,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  assets,
  buyPaymentMethods,
  paymentMethods,
  balance,
  availableBalance,
  validationErrors,
  // showRecipientAddress,
  // setShowRecipientAddress,
  currentType
}) {

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center space-x-2">
            {currentType?.icon}
            <span>{currentType?.label}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Recipient Input - Different components for Send vs Transfer */}
          {transactionType === 'send' && (
            <div>
              <Label htmlFor="recipient">diBoaS username</Label>
              <DiBoaSUsernameInput
                value={recipientAddress}
                onChange={setRecipientAddress}
                validationErrors={validationErrors}
              />
            </div>
          )}

          {/* Transfer Address Input - Wallet address input with autocomplete */}
          {transactionType === 'transfer' && (
            <div>
              <Label htmlFor="recipient">To Address</Label>
              <WalletAddressInput
                value={recipientAddress}
                onChange={setRecipientAddress}
                validationErrors={validationErrors}
              />
            </div>
          )}

          {/* Asset Selection Grid - Show for Buy transactions */}
          {transactionType === 'buy' && (
            <div>
              <Label>Select Asset</Label>
              <div className="asset-grid">
                {assets.map((asset) => {
                  const isSelected = selectedAsset === asset.id
                  return (
                    <Button
                      key={asset.id}
                      variant={isSelected ? "default" : "outline"}
                      className={`h-16 flex-col space-y-1 ${
                        !isSelected ? `${asset.bgColor} ${asset.color} ${asset.borderColor} hover:scale-105` : ''
                      } transition-transform`}
                      onClick={() => setSelectedAsset(asset.id)}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{asset.icon}</span>
                        <div className="text-left">
                          <div className="font-medium text-xs">{asset.symbol}</div>
                          <div className="text-xs opacity-75">{asset.price}</div>
                        </div>
                      </div>
                      {isSelected && (
                        <Badge variant="secondary" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </Button>
                  )
                })}
              </div>
            </div>
          )}

          {/* Amount Input */}
          <AmountInput
            amount={amount}
            setAmount={setAmount}
            transactionType={transactionType}
            selectedAsset={selectedAsset}
            setSelectedAsset={setSelectedAsset}
            assets={assets}
            balance={balance}
            availableBalance={availableBalance}
            validationErrors={validationErrors}
            selectedPaymentMethod={selectedPaymentMethod}
          />

          {/* Payment Method Selection */}
          <PaymentMethodSelector
            transactionType={transactionType}
            isOnRamp={isOnRamp}
            isOffRamp={isOffRamp}
            selectedPaymentMethod={selectedPaymentMethod}
            setSelectedPaymentMethod={setSelectedPaymentMethod}
            buyPaymentMethods={buyPaymentMethods}
            paymentMethods={paymentMethods}
          />

        </CardContent>
      </Card>
    </div>
  )
}