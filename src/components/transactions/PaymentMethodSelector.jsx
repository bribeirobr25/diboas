import { Button } from '@/components/ui/button.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Wallet } from 'lucide-react'

export default function PaymentMethodSelector({ 
  transactionType,
  isOnRamp,
  isOffRamp,
  selectedPaymentMethod,
  setSelectedPaymentMethod,
  buyPaymentMethods,
  paymentMethods
}) {
  
  // Only show payment method selector for certain transaction types
  if (!(isOnRamp || isOffRamp || transactionType === 'buy')) {
    return null
  }

  let methods = transactionType === 'buy' ? buyPaymentMethods : paymentMethods
  
  // Add external wallet option for withdraw transactions
  if (transactionType === 'withdraw') {
    methods = [
      ...paymentMethods,
      { methodId: 'external_wallet', displayLabel: 'External Wallet', paymentIcon: <Wallet className="w-4 h-4" /> }
    ]
  }
  
  // Add crypto wallet option for add transactions (at the end)
  if (transactionType === 'add') {
    methods = [
      ...paymentMethods,
      { methodId: 'crypto_wallet', displayLabel: 'Crypto Wallet', paymentIcon: <Wallet className="w-4 h-4" /> }
    ]
  }

  return (
    <div>
      <div id="payment-method-label" className="text-sm font-medium text-gray-700 mb-2">Payment Method</div>
      <div className="payment-method-selection-grid" role="radiogroup" aria-labelledby="payment-method-label">
        {methods.map((paymentMethod) => (
          <Button
            key={paymentMethod.methodId}
            variant={selectedPaymentMethod === paymentMethod.methodId ? "default" : "outline"}
            className="payment-method-option-button"
            onClick={() => setSelectedPaymentMethod(paymentMethod.methodId)}
            role="radio"
            aria-checked={selectedPaymentMethod === paymentMethod.methodId}
            aria-label={`Select ${paymentMethod.displayLabel} as payment method`}
          >
            <span className="mr-2">{paymentMethod.paymentIcon}</span>
            {paymentMethod.displayLabel}
          </Button>
        ))}
      </div>
    </div>
  )
}