import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function TransactionTypeSelector({ 
  transactionTypes,
  transactionType,
  setTransactionType,
  propTransactionType,
  currentType
}) {
  const navigate = useNavigate()

  const handleTypeSelection = (type) => {
    // For RESTful routing, navigate to the specific route
    if (!propTransactionType) {
      setTransactionType(type.id)
    } else {
      // Navigate to the specific transaction route
      const routeMap = {
        'add': '/add',
        'send': '/send', 
        'receive': '/receive',
        'buy': '/buy',
        'sell': '/sell',
        'transfer': '/transfer',
        'withdraw': '/withdraw',
        'invest': '/invest'
      }
      navigate(routeMap[type.id] || `/transaction?type=${type.id}`)
    }
  }

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-xl">Transaction Type</CardTitle>
        <CardDescription>
          Choose the type of transaction you want to perform
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="transaction-type-grid">
          {transactionTypes.map((type) => (
            <Button
              key={type.id}
              variant={transactionType === type.id ? "default" : "outline"}
              className={`h-16 flex-col space-y-1 ${
                transactionType !== type.id 
                  ? `${type.bgColor} ${type.color} ${type.borderColor} hover:scale-105`
                  : ''
              } transition-transform`}
              onClick={() => handleTypeSelection(type)}
            >
              {type.icon}
              <span className="text-xs font-medium">{type.label}</span>
            </Button>
          ))}
        </div>
        
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">{currentType?.label}</h4>
              <p className="text-sm text-blue-700">{currentType?.description}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}