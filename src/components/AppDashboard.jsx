import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  Send,
  CreditCard,
  Wallet,
  Eye,
  EyeOff,
  Plus,
  ArrowRight,
  Zap,
  Shield,
  Globe,
  Star
} from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import MarketIndicators from './MarketIndicators.jsx'
import PageHeader from './shared/PageHeader.jsx'
import { QUICK_ACTIONS, createTransactionNavigator } from '../utils/navigationHelpers.js'

export default function AppDashboard() {
  const navigate = useNavigate()
  const [isBalanceVisible, setIsBalanceVisible] = useState(true)
  const [currentActiveTab, setCurrentActiveTab] = useState('overview')
  
  const navigateToTransaction = createTransactionNavigator(navigate)

  const userRecentTransactions = [
    {
      id: 1,
      type: 'received',
      description: 'Salary Deposit',
      amount: '+$3,200.00',
      time: '2 hours ago',
      icon: <ArrowDownLeft className="w-4 h-4 text-green-600" />
    },
    {
      id: 2,
      type: 'sent',
      description: 'Coffee Shop',
      amount: '-$4.50',
      time: '5 hours ago',
      icon: <ArrowUpRight className="w-4 h-4 text-red-600" />
    },
    {
      id: 3,
      type: 'investment',
      description: 'ETH Purchase',
      amount: '-$500.00',
      time: '1 day ago',
      icon: <TrendingUp className="w-4 h-4 text-blue-600" />
    },
    {
      id: 4,
      type: 'received',
      description: 'Staking Rewards',
      amount: '+$12.34',
      time: '2 days ago',
      icon: <Star className="w-4 h-4 text-yellow-600" />
    }
  ]

  const userPortfolioData = [
    { name: 'Traditional', value: 65, amount: '$26,430.75', color: 'bg-blue-500' },
    { name: 'Crypto', value: 25, amount: '$10,175.50', color: 'bg-purple-500' },
    { name: 'DeFi', value: 10, amount: '$4,070.25', color: 'bg-green-500' }
  ]

  return (
    <div className="main-layout">
      <PageHeader showUserActions={true} />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Welcome Section with Market Indicators */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Good morning, John! 👋
          </h1>
          <MarketIndicators />
        </div>

        {/* Balance Card */}
        <Card className="balance-card" onClick={() => navigate('/account')}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <p className="text-blue-100 text-sm mb-1">Total Balance</p>
                <div className="flex items-center">
                  <h2 className="text-3xl font-bold mr-3">
                    {isBalanceVisible ? '$40,676.50' : '••••••••'}
                  </h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      setIsBalanceVisible(!isBalanceVisible)
                    }}
                    className="text-white hover:bg-white/20"
                  >
                    {isBalanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <div className="text-right">
                <Badge className="bg-green-500 text-white mb-2">
                  +2.4% today
                </Badge>
                <p className="text-blue-100 text-xs">Click for details</p>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-blue-100 text-sm">Available</p>
                <p className="text-xl font-semibold">
                  {isBalanceVisible ? '$38,450.25' : '••••••••'}
                </p>
              </div>
              <div>
                <p className="text-blue-100 text-sm">Invested</p>
                <p className="text-xl font-semibold">
                  {isBalanceVisible ? '$2,226.25' : '••••••••'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="main-card">
          <CardHeader>
            <CardTitle className="text-lg">Quick Actions</CardTitle>
            <CardDescription>
              Manage your finances with just one click
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid-3-cols">
              {QUICK_ACTIONS.map((action, index) => {
                const IconComponent = action.icon === 'Plus' ? Plus : action.icon === 'Send' ? Send : TrendingUp
                return (
                  <Button
                    key={index}
                    variant="outline"
                    className={`quick-action-button ${action.colorClass}`}
                    onClick={() => navigateToTransaction(action.type)}
                  >
                    <div>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="font-medium">{action.label}</span>
                  </Button>
                )
              })}
            </div>
          </CardContent>
        </Card>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Portfolio Overview */}
          <div className="lg:col-span-2">
            <Card className="main-card">
              <CardHeader>
                <CardTitle className="section-title">Portfolio Overview</CardTitle>
                <CardDescription>
                  Your OneFi asset allocation
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userPortfolioData.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className={`w-4 h-4 rounded-full ${item.color}`}></div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{item.amount}</p>
                        <p className="text-sm text-gray-500">{item.value}%</p>
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="mt-6 flex space-x-2">
                  <Button className="flex-1 primary-button">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Funds
                  </Button>
                  <Button className="flex-1 secondary-button">
                    <PieChart className="w-4 h-4 mr-2" />
                    Rebalance
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Transactions */}
            <Card className="main-card" style={{marginTop: '1.5rem'}}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <div>
                    <CardTitle className="section-title">Recent Activity</CardTitle>
                    <CardDescription>
                      Your latest transactions
                    </CardDescription>
                  </div>
                  <Button variant="ghost" size="sm">
                    View All
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userRecentTransactions.map((transaction) => (
                    <div key={transaction.id} className="transaction-card">
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-gray-100 rounded-full">
                          {transaction.icon}
                        </div>
                        <div>
                          <p className="font-medium text-sm">{transaction.description}</p>
                          <p className="text-xs text-gray-500">{transaction.time}</p>
                        </div>
                      </div>
                      <p className={`font-semibold ${
                        transaction.amount.startsWith('+') ? 'text-green-600' : 'text-gray-900'
                      }`}>
                        {transaction.amount}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* OneFi Features */}
            <Card className="main-card">
              <CardHeader>
                <CardTitle className="section-title">OneFi Features</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                  <Zap className="w-5 h-5 text-blue-600" />
                  <div>
                    <p className="font-medium text-sm">1-Click Trading</p>
                    <p className="text-xs text-gray-600">Active</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                  <Shield className="w-5 h-5 text-green-600" />
                  <div>
                    <p className="font-medium text-sm">Auto-Rebalancing</p>
                    <p className="text-xs text-gray-600">Enabled</p>
                  </div>
                </div>
                
                <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                  <Globe className="w-5 h-5 text-purple-600" />
                  <div>
                    <p className="font-medium text-sm">DeFi Integration</p>
                    <p className="text-xs text-gray-600">Connected</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Market Insights */}
            <Card className="main-card">
              <CardHeader>
                <CardTitle className="section-title">Market Insights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">BTC/USD</span>
                  <div className="text-right">
                    <p className="font-semibold text-sm">$43,250</p>
                    <p className="text-xs text-green-600">+2.4%</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">ETH/USD</span>
                  <div className="text-right">
                    <p className="font-semibold text-sm">$2,680</p>
                    <p className="text-xs text-green-600">+1.8%</p>
                  </div>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-sm">S&P 500</span>
                  <div className="text-right">
                    <p className="font-semibold text-sm">4,785</p>
                    <p className="text-xs text-red-600">-0.3%</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Educational Tip */}
            <Card className="feature-card" style={{background: 'linear-gradient(to right, #f0f9ff, #e0f2fe)', borderColor: '#bfdbfe'}}>
              <CardContent className="p-4">
                <div className="flex items-start space-x-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <Wallet className="w-4 h-4 text-blue-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-sm text-blue-900 mb-1">
                      Tip of the Day
                    </h4>
                    <p className="text-xs text-blue-700 mb-3">
                      Diversifying across traditional and DeFi assets can help reduce portfolio risk.
                    </p>
                    <Button size="sm" variant="outline" className="text-blue-600 border-blue-300 hover:bg-blue-100">
                      Learn More
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}

