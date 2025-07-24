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
      <div className="payment-method-grid" role="radiogroup" aria-labelledby="payment-method-label">
        {methods.map((method) => (
          <Button
            key={method.id}
            variant={selectedPaymentMethod === method.id ? "default" : "outline"}
            className="h-12 justify-start"
            onClick={() => setSelectedPaymentMethod(method.id)}
            role="radio"
            aria-checked={selectedPaymentMethod === method.id}
            aria-label={`Select ${method.label} as payment method`}
          >
            <span className="mr-2">{method.icon}</span>
            {method.label}
          </Button>
        ))}
      </div>
    </div>
  )
}