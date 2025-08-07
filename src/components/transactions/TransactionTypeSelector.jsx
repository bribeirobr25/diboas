import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

export default function TransactionTypeSelector({ 
  transactionTypes: availableTransactionTypeConfigs,
  transactionType: currentTransactionType,
  setTransactionType: setCurrentTransactionType,
  propTransactionType: propTransactionType,
  currentType: selectedTransactionTypeConfig,
  category: transactionCategory
}) {
  const navigationHelper = useNavigate()

  const handleTransactionTypeSelection = (selectedTransactionTypeConfig) => {
    // For RESTful routing, navigate to the specific route
    if (!propTransactionType) {
      setCurrentTransactionType(selectedTransactionTypeConfig.id)
    } else {
      // Navigate to the specific transaction route with category context
      const transactionTypeRouteMapping = {
        // Banking transactions
        'add': transactionCategory === 'banking' ? '/category/banking/add' : '/add',
        'send': transactionCategory === 'banking' ? '/category/banking/send' : '/send', 
        'withdraw': transactionCategory === 'banking' ? '/category/banking/withdraw' : '/withdraw',
        // Investment transactions
        'buy': transactionCategory === 'investment' ? '/category/investment/buy' : '/buy',
        'sell': transactionCategory === 'investment' ? '/category/investment/sell' : '/sell',
        // Legacy
        'invest': '/invest'
      }
      navigationHelper(transactionTypeRouteMapping[selectedTransactionTypeConfig.id] || `/transaction?type=${selectedTransactionTypeConfig.id}`)
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
        <div className="transaction-type-selection-grid">
          {availableTransactionTypeConfigs.map((transactionTypeConfig) => (
            <Button
              key={transactionTypeConfig.id}
              variant={currentTransactionType === transactionTypeConfig.id ? "default" : "outline"}
              className={`transaction-type-button ${
                currentTransactionType !== transactionTypeConfig.id 
                  ? `${transactionTypeConfig.bgColor} ${transactionTypeConfig.color} ${transactionTypeConfig.borderColor} hover:scale-105`
                  : ''
              } transition-transform`}
              onClick={() => handleTransactionTypeSelection(transactionTypeConfig)}
            >
              {transactionTypeConfig.icon}
              <span className="text-xs font-medium">{transactionTypeConfig.label}</span>
            </Button>
          ))}
        </div>
        
        <div className="transaction-type-info-panel">
          <div className="flex-row-start">
            <Info className="info-panel-icon" />
            <div>
              <h4 className="info-panel-title">{selectedTransactionTypeConfig?.label}</h4>
              <p className="info-panel-description">{selectedTransactionTypeConfig?.description}</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}