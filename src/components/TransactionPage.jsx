import { useState, useMemo, useCallback } from 'react'
import { useDebounce } from '../utils/performanceOptimizations.js'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { 
  Plus,
  Send,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  CreditCard,
  Wallet,
  Info,
  CheckCircle,
  AlertCircle,
  Search,
  QrCode,
  Copy,
  Eye,
  EyeOff
} from 'lucide-react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import PageHeader from './shared/PageHeader.jsx'
import { NAVIGATION_PATHS } from '../utils/navigationHelpers.js'

export default function TransactionPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const initialType = searchParams.get('type') || 'add'
  
  const [transactionType, setTransactionType] = useState(initialType)
  const [amount, setAmount] = useState('')
  const [recipient, setRecipient] = useState('')
  const [selectedAsset, setSelectedAsset] = useState('USD')
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('card')
  const [showFeeDetails, setShowFeeDetails] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)

  const transactionTypes = [
    { 
      id: 'add', 
      label: 'Add', 
      icon: <Plus className="w-4 h-4" />, 
      description: 'Add money to your diBoaS wallet',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      borderColor: 'border-green-200'
    },
    { 
      id: 'send', 
      label: 'Send', 
      icon: <Send className="w-4 h-4" />, 
      description: 'Send money to another diBoaS user',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200'
    },
    { 
      id: 'receive', 
      label: 'Receive', 
      icon: <ArrowDownLeft className="w-4 h-4" />, 
      description: 'Request money from another diBoaS user',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200'
    },
    { 
      id: 'buy', 
      label: 'Buy', 
      icon: <TrendingUp className="w-4 h-4" />, 
      description: 'Buy crypto or tokenized assets',
      color: 'text-indigo-600',
      bgColor: 'bg-indigo-50',
      borderColor: 'border-indigo-200'
    },
    { 
      id: 'sell', 
      label: 'Sell', 
      icon: <TrendingDown className="w-4 h-4" />, 
      description: 'Sell crypto or tokenized assets',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      borderColor: 'border-orange-200'
    },
    { 
      id: 'transfer', 
      label: 'Transfer', 
      icon: <ArrowRight className="w-4 h-4" />, 
      description: 'Transfer to external wallet',
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      borderColor: 'border-red-200'
    },
    { 
      id: 'withdraw', 
      label: 'Withdraw', 
      icon: <CreditCard className="w-4 h-4" />, 
      description: 'Withdraw to bank or card',
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      borderColor: 'border-gray-200'
    }
  ]

  const paymentMethods = [
    { id: 'card', label: 'Credit/Debit Card', icon: '💳' },
    { id: 'paypal', label: 'PayPal', icon: '🅿️' },
    { id: 'apple', label: 'Apple Pay', icon: '🍎' },
    { id: 'google', label: 'Google Pay', icon: '🔵' },
    { id: 'bank', label: 'Bank Account', icon: '🏦' }
  ]

  const assets = [
    { id: 'USD', label: 'USD', icon: '💵', price: '$1.00' },
    { id: 'BTC', label: 'Bitcoin', icon: '₿', price: '$43,250.00' },
    { id: 'ETH', label: 'Ethereum', icon: '⟠', price: '$2,680.00' },
    { id: 'SOL', label: 'Solana', icon: '◎', price: '$98.50' },
    { id: 'SUI', label: 'Sui', icon: '🌊', price: '$3.45' },
    { id: 'GOLD', label: 'Tokenized Gold', icon: '🥇', price: '$2,045.30' },
    { id: 'STOCKS', label: 'Tokenized Stocks', icon: '📈', price: 'Various' }
  ]

  const currentType = transactionTypes.find(t => t.id === transactionType)
  const isOnRamp = transactionType === 'add'
  const isOffRamp = transactionType === 'withdraw'
  const isOnChain = ['send', 'receive', 'buy', 'sell', 'transfer'].includes(transactionType)

  // PERFORMANCE: Memoized fee calculation to prevent recalculation on every render
  const calculateFees = useCallback((inputAmount) => {
    const baseAmount = parseFloat(inputAmount) || 0
    let diBoaSFee = 0
    let networkFee = 0.50
    let providerFee = 0

    if (isOffRamp || transactionType === 'transfer') {
      diBoaSFee = baseAmount * 0.009 // 0.9%
    } else {
      diBoaSFee = baseAmount * 0.0009 // 0.09%
    }

    if (isOnRamp || isOffRamp) {
      providerFee = baseAmount * 0.029 // 2.9% for payment providers
    }

    return {
      diBoaSFee: diBoaSFee.toFixed(2),
      networkFee: networkFee.toFixed(2),
      providerFee: providerFee.toFixed(2),
      total: (baseAmount + diBoaSFee + networkFee + providerFee).toFixed(2)
    }
  }, [isOffRamp, isOnRamp, transactionType])

  // PERFORMANCE: Debounced fee calculation to prevent excessive calculations during typing
  const debouncedCalculateFees = useDebounce(calculateFees, 300)
  
  // PERFORMANCE: Memoized fees calculation
  const fees = useMemo(() => calculateFees(amount), [amount, calculateFees])

  const handleTransaction = async () => {
    setIsProcessing(true)
    // Simulate processing
    setTimeout(() => {
      setIsProcessing(false)
      navigate('/app')
    }, 3000)
  }

  return (
    <div className="main-layout">
      <PageHeader 
        showBackButton={true} 
        backTo={NAVIGATION_PATHS.APP}
        showUserActions={true}
        title="Transaction"
      />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Transaction Type Selection */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl">Transaction Type</CardTitle>
            <CardDescription>
              Choose the type of transaction you want to perform
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {transactionTypes.map((type) => (
                <Button
                  key={type.id}
                  variant={transactionType === type.id ? "default" : "outline"}
                  className={`h-16 flex-col space-y-1 ${
                    transactionType === type.id 
                      ? 'diboas-button' 
                      : `${type.bgColor} ${type.color} ${type.borderColor} hover:scale-105`
                  } transition-transform`}
                  onClick={() => setTransactionType(type.id)}
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

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Transaction Form */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  {currentType?.icon}
                  <span>{currentType?.label} Transaction</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Amount Input */}
                <div>
                  <Label htmlFor="amount">Amount</Label>
                  <div className="relative mt-1">
                    <Input
                      id="amount"
                      type="number"
                      placeholder="0.00"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      className="text-2xl h-14 pr-20"
                    />
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <select
                        value={selectedAsset}
                        onChange={(e) => setSelectedAsset(e.target.value)}
                        className="bg-transparent border-none text-sm font-medium focus:outline-none"
                      >
                        {assets.map((asset) => (
                          <option key={asset.id} value={asset.id}>
                            {asset.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Available: $38,450.25
                  </p>
                </div>

                {/* Recipient/Asset Selection */}
                {(transactionType === 'send' || transactionType === 'receive') && (
                  <div>
                    <Label htmlFor="recipient">
                      {transactionType === 'send' ? 'Send to' : 'Request from'}
                    </Label>
                    <div className="relative mt-1">
                      <Input
                        id="recipient"
                        placeholder="@username or search..."
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="pl-10"
                      />
                      <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                    </div>
                  </div>
                )}

                {transactionType === 'transfer' && (
                  <div>
                    <Label htmlFor="wallet">Wallet Address</Label>
                    <div className="relative mt-1">
                      <Input
                        id="wallet"
                        placeholder="Enter wallet address..."
                        value={recipient}
                        onChange={(e) => setRecipient(e.target.value)}
                        className="pr-10"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 transform -translate-y-1/2"
                      >
                        <QrCode className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}

                {/* Payment Method Selection */}
                {(isOnRamp || isOffRamp) && (
                  <div>
                    <Label>Payment Method</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {paymentMethods.map((method) => (
                        <Button
                          key={method.id}
                          variant={selectedPaymentMethod === method.id ? "default" : "outline"}
                          className={`h-12 justify-start ${
                            selectedPaymentMethod === method.id ? 'diboas-button' : ''
                          }`}
                          onClick={() => setSelectedPaymentMethod(method.id)}
                        >
                          <span className="mr-2">{method.icon}</span>
                          {method.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Asset Selection for Buy/Sell */}
                {(transactionType === 'buy' || transactionType === 'sell') && (
                  <div>
                    <Label>Select Asset</Label>
                    <div className="grid grid-cols-2 gap-3 mt-2">
                      {assets.filter(a => a.id !== 'USD').map((asset) => (
                        <Button
                          key={asset.id}
                          variant={selectedAsset === asset.id ? "default" : "outline"}
                          className={`h-16 flex-col ${
                            selectedAsset === asset.id ? 'diboas-button' : ''
                          }`}
                          onClick={() => setSelectedAsset(asset.id)}
                        >
                          <span className="text-lg mb-1">{asset.icon}</span>
                          <span className="text-xs">{asset.label}</span>
                          <span className="text-xs text-gray-500">{asset.price}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Transaction Summary */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Transaction Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between">
                  <span>Amount</span>
                  <span className="font-medium">${amount || '0.00'}</span>
                </div>
                
                <div className="border-t pt-4">
                  <Button
                    variant="ghost"
                    className="w-full justify-between p-0 h-auto"
                    onClick={() => setShowFeeDetails(!showFeeDetails)}
                  >
                    <span>Fee Details</span>
                    <span className="font-medium">${(parseFloat(fees.diBoaSFee) + parseFloat(fees.networkFee) + parseFloat(fees.providerFee)).toFixed(2)}</span>
                  </Button>
                  
                  {showFeeDetails && (
                    <div className="mt-3 space-y-2 text-sm">
                      <div className="flex justify-between text-gray-600">
                        <span>diBoaS Fee ({isOffRamp || transactionType === 'transfer' ? '0.9%' : '0.09%'})</span>
                        <span>${fees.diBoaSFee}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Network Fee</span>
                        <span>${fees.networkFee}</span>
                      </div>
                      {(isOnRamp || isOffRamp) && (
                        <div className="flex justify-between text-gray-600">
                          <span>Provider Fee (2.9%)</span>
                          <span>${fees.providerFee}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex justify-between font-semibold text-lg">
                    <span>Total</span>
                    <span>${fees.total}</span>
                  </div>
                </div>
                
                <div className="pt-4">
                  <Button
                    className="w-full diboas-button"
                    onClick={handleTransaction}
                    disabled={!amount || isProcessing}
                  >
                    {isProcessing ? (
                      <div className="flex items-center space-x-2">
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span>Processing...</span>
                      </div>
                    ) : (
                      `${currentType?.label} ${amount ? `$${amount}` : ''}`
                    )}
                  </Button>
                </div>
                
                <div className="text-xs text-gray-500 text-center">
                  <p>All complexities handled in the background</p>
                  <p>No gas fees, swaps, or approvals needed</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

