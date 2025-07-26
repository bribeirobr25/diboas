import { Button } from '@/components/ui/button.jsx'
import { Label } from '@/components/ui/label.jsx'

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

  const methods = transactionType === 'buy' ? buyPaymentMethods : paymentMethods

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