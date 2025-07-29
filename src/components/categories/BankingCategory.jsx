/**
 * Banking Category Page - In/Out Money Management
 * Handles all banking operations: Add, Withdraw, Send, Receive
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { dataManager } from '../../services/DataManager.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  ArrowDownLeft,
  ArrowUpRight,
  Send,
  Wallet,
  CreditCard,
  Smartphone,
  ArrowLeft,
  Plus,
  Minus,
  ArrowRightLeft,
  Info
} from 'lucide-react'
import PageHeader from '../shared/PageHeader.jsx'
import '../../styles/categories.css'

// Banking action configurations - Updated order and removed Request Money
const BANKING_ACTIONS = {
  add: {
    id: 'add',
    title: 'Add Money',
    description: 'Deposit funds to your diBoaS wallet',
    icon: ArrowDownLeft,
    color: 'bg-green-100 text-green-800 border-green-200',
    route: '/category/banking/add',
    highlighted: true,
    methods: ['Bank Transfer', 'Debit Card', 'Crypto Wallet'],
    order: 1
  },
  send: {
    id: 'send',
    title: 'Send Money',
    description: 'Transfer to other diBoaS users',
    icon: Send,
    color: 'bg-purple-100 text-purple-800 border-purple-200',
    route: '/category/banking/send',
    highlighted: false,
    methods: ['diBoaS Username', 'Email'],
    order: 2
  },
  withdraw: {
    id: 'withdraw',
    title: 'Withdraw',
    description: 'Send money to your bank or external wallet',
    icon: ArrowUpRight,
    color: 'bg-blue-100 text-blue-800 border-blue-200',
    route: '/category/banking/withdraw',
    highlighted: false,
    methods: ['Bank Account', 'External Wallet'],
    order: 3
  }
}

export default function BankingCategory() {
  const navigate = useNavigate()
  const [balance, setBalance] = useState(null)
  const [bankingData, setBankingData] = useState({
    thisMonth: 0,
    lastTransaction: null
  })

  // Get balance and banking data from DataManager
  useEffect(() => {
    const currentBalance = dataManager.getBalance()
    setBalance(currentBalance)

    // Calculate this month's net flow (In - Out)
    const transactions = dataManager.getTransactions()
    const currentMonth = new Date().getMonth()
    const currentYear = new Date().getFullYear()
    
    const bankingTransactions = transactions.filter(tx => 
      ['add', 'withdraw', 'send'].includes(tx.type)
    )

    const thisMonthTransactions = bankingTransactions.filter(tx => {
      const txDate = new Date(tx.timestamp)
      return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear
    })

    // Calculate net flow: In (add) - Out (withdraw, send)
    const thisMonthIn = thisMonthTransactions
      .filter(tx => tx.type === 'add')
      .reduce((sum, tx) => sum + tx.amount, 0)
    
    const thisMonthOut = thisMonthTransactions
      .filter(tx => ['withdraw', 'send'].includes(tx.type))
      .reduce((sum, tx) => sum + tx.amount, 0)

    const netFlow = thisMonthIn - thisMonthOut

    // Get last banking transaction
    const lastTransaction = bankingTransactions.length > 0 
      ? bankingTransactions[bankingTransactions.length - 1] 
      : null

    setBankingData({
      thisMonth: netFlow,
      lastTransaction
    })

    // Subscribe to balance and transaction updates
    const unsubscribeBalance = dataManager.subscribe('balance:updated', (updatedBalance) => {
      setBalance(updatedBalance)
    })

    const unsubscribeTransactions = dataManager.subscribe('transactions:updated', (updatedTransactions) => {
      // Recalculate banking data when transactions update
      const bankingTxs = updatedTransactions.filter(tx => 
        ['add', 'withdraw', 'send'].includes(tx.type)
      )

      const thisMonthTxs = bankingTxs.filter(tx => {
        const txDate = new Date(tx.timestamp)
        return txDate.getMonth() === currentMonth && txDate.getFullYear() === currentYear
      })

      const thisMonthIn = thisMonthTxs
        .filter(tx => tx.type === 'add')
        .reduce((sum, tx) => sum + tx.amount, 0)
      
      const thisMonthOut = thisMonthTxs
        .filter(tx => ['withdraw', 'send'].includes(tx.type))
        .reduce((sum, tx) => sum + tx.amount, 0)

      const netFlow = thisMonthIn - thisMonthOut
      const lastTx = bankingTxs.length > 0 ? bankingTxs[bankingTxs.length - 1] : null

      setBankingData({
        thisMonth: netFlow,
        lastTransaction: lastTx
      })
    })

    return () => {
      unsubscribeBalance()
      unsubscribeTransactions()
    }
  }, [])
  const [selectedAction, setSelectedAction] = useState(null)

  const handleActionClick = (action) => {
    navigate(action.route)
  }

  const handleBackClick = () => {
    navigate('/app')
  }

  return (
    <div className="main-layout">
      <PageHeader showUserActions={true} />
      
      <div className="page-container">
        {/* Breadcrumb Navigation */}
        <div className="banking-category__breadcrumb mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBackClick}
            className="banking-category__back-button p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Category Header with Background Image */}
        <div className="banking-category__header-with-bg">
          <div 
            className="banking-category__header-bg"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=1200&h=300&fit=crop&crop=center)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              borderRadius: '1rem',
              position: 'relative',
              padding: '2rem',
              marginBottom: '2rem',
              color: 'white'
            }}
          >
            <div 
              className="banking-category__header-overlay"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(37, 99, 235, 0.8))',
                borderRadius: '1rem'
              }}
            ></div>
            
            <div className="banking-category__header-content" style={{ position: 'relative', zIndex: 1 }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="banking-category__icon p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <ArrowRightLeft className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="banking-category__title text-3xl font-bold text-white">
                    In/Out
                  </h1>
                  <p className="banking-category__subtitle text-lg text-white/90">
                    Banking & Money Movement
                  </p>
                </div>
              </div>
              
              <p className="banking-category__description text-white/80 max-w-2xl">
                Manage your money flow with diBoaS. Add funds from traditional banking, 
                withdraw to your accounts, or transfer between users seamlessly.
              </p>
            </div>
          </div>
        </div>

        {/* Banking Overview Card - Minimalist Single Card */}
        <div className="banking-category__overview mb-8">
          <Card className="banking-overview-card">
            <CardHeader>
              <CardTitle className="banking-overview-title">Banking Overview</CardTitle>
              <CardDescription>Your current banking status at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="banking-overview-grid">
                <div className="banking-overview-item">
                  <div className="banking-overview-icon">
                    <Wallet className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="banking-overview-content">
                    <p className="banking-overview-label">Available Balance</p>
                    <p className="banking-overview-value text-green-600">
                      ${balance?.availableForSpending?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
                
                <div className="banking-overview-divider"></div>
                
                <div className="banking-overview-item">
                  <div className="banking-overview-icon">
                    <ArrowDownLeft className={`w-5 h-5 ${bankingData.thisMonth >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="banking-overview-content">
                    <p className="banking-overview-label">This Month</p>
                    <p className={`banking-overview-value ${bankingData.thisMonth >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {bankingData.thisMonth >= 0 ? '+' : ''}${bankingData.thisMonth.toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="banking-overview-divider"></div>
                
                <div className="banking-overview-item">
                  <div className="banking-overview-icon">
                    <Send className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="banking-overview-content">
                    <p className="banking-overview-label">Last Transaction</p>
                    <p className="banking-overview-value text-gray-900">
                      {bankingData.lastTransaction 
                        ? `${bankingData.lastTransaction.type} $${bankingData.lastTransaction.amount.toFixed(2)}`
                        : 'No transactions yet'
                      }
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Banking Actions Grid */}
        <div className="banking-category__actions mb-8">
          <h2 className="banking-category__actions-title text-xl font-semibold text-gray-900 mb-6">
            What would you like to do?
          </h2>
          
          <div className="banking-category__actions-grid">
            {Object.values(BANKING_ACTIONS)
              .sort((a, b) => a.order - b.order)
              .map((action) => {
              const IconComponent = action.icon
              
              return (
                <Card 
                  key={action.id}
                  className={`banking-category__action-card cursor-pointer ${
                    action.highlighted ? 'ring-2 ring-blue-500 ring-opacity-50' : ''
                  }`}
                  onClick={() => handleActionClick(action)}
                >
                  <CardHeader className="banking-category__action-header">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${action.color.replace('text-', 'bg-').replace('border-', '')}`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle className="banking-category__action-title text-lg">
                            {action.title}
                            {action.highlighted && (
                              <Badge className="ml-2 bg-blue-100 text-blue-800">
                                Recommended
                              </Badge>
                            )}
                          </CardTitle>
                          <CardDescription className="banking-category__action-description">
                            {action.description}
                          </CardDescription>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="banking-category__action-content pt-0">
                    <div className="banking-category__action-methods">
                      <p className="text-sm text-gray-600 mb-2">Available methods:</p>
                      <div className="flex flex-wrap gap-2">
                        {action.methods.map((method) => (
                          <Badge 
                            key={method}
                            variant="outline" 
                            className="banking-category__method-badge text-xs"
                          >
                            {method}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Educational Tips */}
        <div className="banking-category__tips mt-12">
          <Card className="banking-category__tips-card bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="banking-category__tips-title text-lg font-semibold text-blue-900 mb-2">
                    Getting Started with Banking
                  </h3>
                  <div className="banking-category__tips-content space-y-2">
                    <p className="text-blue-800 text-sm">
                      • <strong>Add Money:</strong> Start by adding funds from your bank account or debit card
                    </p>
                    <p className="text-blue-800 text-sm">
                      • <strong>Instant Transfers:</strong> Send money to other diBoaS users instantly with just their username
                    </p>
                    <p className="text-blue-800 text-sm">
                      • <strong>External Wallets:</strong> Withdraw directly to your crypto wallets with multi-chain support
                    </p>
                    <p className="text-blue-800 text-sm">
                      • <strong>Low Fees:</strong> Enjoy industry-leading low fees for all banking operations
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

// Export action configurations for use in other components
export { BANKING_ACTIONS }