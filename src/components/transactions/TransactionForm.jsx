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
import WalletAddressDisplay from './WalletAddressDisplay.jsx'

export default function TransactionForm({ 
  transactionType: currentTransactionType,
  isOnRamp: isOnRampTransaction,
  isOffRamp: isOffRampTransaction,
  recipientAddress: recipientWalletAddress,
  setRecipientAddress: setRecipientWalletAddress,
  amount: transactionAmountInput,
  setAmount: setTransactionAmountInput,
  selectedAsset: selectedCryptocurrencyAsset,
  setSelectedAsset: setSelectedCryptocurrencyAsset,
  selectedPaymentMethod: chosenPaymentMethod,
  setSelectedPaymentMethod: setChosenPaymentMethod,
  assets: supportedCryptocurrencyAssets,
  buyPaymentMethods: buyTransactionPaymentMethods,
  paymentMethods: availablePaymentMethodOptions,
  balance: currentWalletBalance,
  availableBalance: userAvailableBalance,
  validationErrors: transactionValidationErrors,
  // showRecipientAddress: isRecipientAddressFieldVisible,
  // setShowRecipientAddress: setIsRecipientAddressFieldVisible,
  currentType: selectedTransactionTypeConfig
}) {

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle className="transaction-form-title">
            {selectedTransactionTypeConfig?.icon}
            <span>{selectedTransactionTypeConfig?.label}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          
          {/* Recipient Input - Different components for Send vs Transfer */}
          {currentTransactionType === 'send' && (
            <div>
              <Label htmlFor="recipient">diBoaS username</Label>
              <DiBoaSUsernameInput
                value={recipientWalletAddress}
                onChange={setRecipientWalletAddress}
                validationErrors={transactionValidationErrors}
              />
            </div>
          )}

          {/* Transfer Address Input - Wallet address input with autocomplete */}
          {currentTransactionType === 'transfer' && (
            <div>
              <Label htmlFor="recipient">To Address</Label>
              <WalletAddressInput
                value={recipientWalletAddress}
                onChange={setRecipientWalletAddress}
                validationErrors={transactionValidationErrors}
              />
            </div>
          )}

          {/* Withdraw to External Wallet - Shows when external_wallet is selected */}
          {currentTransactionType === 'withdraw' && chosenPaymentMethod === 'external_wallet' && (
            <div>
              <Label htmlFor="recipient">To Wallet Address</Label>
              <WalletAddressInput
                value={recipientWalletAddress}
                onChange={setRecipientWalletAddress}
                validationErrors={transactionValidationErrors}
              />
            </div>
          )}

          {/* Asset Selection Grid - Show for Buy transactions */}
          {currentTransactionType === 'buy' && (
            <div>
              <Label>Select Asset</Label>
              <div className="crypto-asset-selection-grid">
                {supportedCryptocurrencyAssets.map((availableCryptoAsset) => {
                  const isAssetCurrentlySelected = selectedCryptocurrencyAsset === availableCryptoAsset.assetId
                  return (
                    <Button
                      key={availableCryptoAsset.assetId}
                      variant={isAssetCurrentlySelected ? "default" : "outline"}
                      className={`crypto-asset-selector ${
                        !isAssetCurrentlySelected ? `${availableCryptoAsset.themeClasses.bgColor} ${availableCryptoAsset.themeClasses.textColor} ${availableCryptoAsset.themeClasses.borderColor} hover:scale-105` : ''
                      } transition-transform`}
                      onClick={() => setSelectedCryptocurrencyAsset(availableCryptoAsset.assetId)}
                    >
                      <div className="flex items-center space-x-2">
                        <span className="text-lg">{availableCryptoAsset.currencyIcon}</span>
                        <div className="text-left">
                          <div className="font-medium text-xs">{availableCryptoAsset.tickerSymbol}</div>
                          <div className="text-xs opacity-75">{availableCryptoAsset.currentMarketPrice}</div>
                        </div>
                      </div>
                      {isAssetCurrentlySelected && (
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

          {/* Crypto Wallet Address Display - Shows when crypto_wallet is selected for Add */}
          {currentTransactionType === 'add' && chosenPaymentMethod === 'crypto_wallet' && (
            <WalletAddressDisplay />
          )}

          {/* Amount Input - Hide for Add with crypto_wallet */}
          {!(currentTransactionType === 'add' && chosenPaymentMethod === 'crypto_wallet') && (
          <AmountInput
            amount={transactionAmountInput}
            setAmount={setTransactionAmountInput}
            transactionType={currentTransactionType}
            selectedAsset={selectedCryptocurrencyAsset}
            setSelectedAsset={setSelectedCryptocurrencyAsset}
            assets={supportedCryptocurrencyAssets}
            balance={currentWalletBalance}
            availableBalance={userAvailableBalance}
            validationErrors={transactionValidationErrors}
            selectedPaymentMethod={chosenPaymentMethod}
          />
          )}

          {/* Payment Method Selection */}
          <PaymentMethodSelector
            transactionType={currentTransactionType}
            isOnRamp={isOnRampTransaction}
            isOffRamp={isOffRampTransaction}
            selectedPaymentMethod={chosenPaymentMethod}
            setSelectedPaymentMethod={setChosenPaymentMethod}
            buyPaymentMethods={buyTransactionPaymentMethods}
            paymentMethods={availablePaymentMethodOptions}
          />

        </CardContent>
      </Card>
    </div>
  )
}