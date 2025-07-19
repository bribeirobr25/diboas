import { useState } from 'react'
import { Button } from '@/components/ui/button.jsx'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar.jsx'
import { 
  ArrowLeft,
  ArrowUpRight,
  ArrowDownLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Send,
  CreditCard,
  Wallet,
  Bell,
  Settings,
  Eye,
  EyeOff,
  Filter,
  Download,
  Search,
  Calendar,
  Star,
  Zap,
  Globe
} from 'lucide-react'
import { Input } from '@/components/ui/input.jsx'
import { useNavigate } from 'react-router-dom'
import diBoaSLogo from '../assets/diboas-logo.png'

export default function AccountView() {
  const navigate = useNavigate()
  const [balanceVisible, setBalanceVisible] = useState(true)
  const [filterType, setFilterType] = useState('all')

  const transactions = [
    {
      id: 1,
      type: 'received',
      description: 'Salary Deposit',
      amount: '+$3,200.00',
      time: '2 hours ago',
      date: 'Dec 15, 2024',
      status: 'completed',
      icon: <ArrowDownLeft className="w-4 h-4 text-green-600" />,
      category: 'deposit'
    },
    {
      id: 2,
      type: 'sent',
      description: 'Coffee Shop Payment',
      amount: '-$4.50',
      time: '5 hours ago',
      date: 'Dec 15, 2024',
      status: 'completed',
      icon: <ArrowUpRight className="w-4 h-4 text-red-600" />,
      category: 'payment'
    },
    {
      id: 3,
      type: 'investment',
      description: 'ETH Purchase',
      amount: '-$500.00',
      time: '1 day ago',
      date: 'Dec 14, 2024',
      status: 'completed',
      icon: <TrendingUp className="w-4 h-4 text-blue-600" />,
      category: 'buy'
    },
    {
      id: 4,
      type: 'received',
      description: 'Staking Rewards',
      amount: '+$12.34',
      time: '2 days ago',
      date: 'Dec 13, 2024',
      status: 'completed',
      icon: <Star className="w-4 h-4 text-yellow-600" />,
      category: 'reward'
    },
    {
      id: 5,
      type: 'sent',
      description: 'Transfer to @alice',
      amount: '-$150.00',
      time: '3 days ago',
      date: 'Dec 12, 2024',
      status: 'completed',
      icon: <Send className="w-4 h-4 text-purple-600" />,
      category: 'send'
    },
    {
      id: 6,
      type: 'received',
      description: 'Freelance Payment',
      amount: '+$750.00',
      time: '4 days ago',
      date: 'Dec 11, 2024',
      status: 'completed',
      icon: <ArrowDownLeft className="w-4 h-4 text-green-600" />,
      category: 'received'
    },
    {
      id: 7,
      type: 'investment',
      description: 'BTC Purchase',
      amount: '-$1,000.00',
      time: '5 days ago',
      date: 'Dec 10, 2024',
      status: 'completed',
      icon: <TrendingUp className="w-4 h-4 text-orange-600" />,
      category: 'buy'
    },
    {
      id: 8,
      type: 'sent',
      description: 'Withdraw to Bank',
      amount: '-$200.00',
      time: '6 days ago',
      date: 'Dec 9, 2024',
      status: 'completed',
      icon: <CreditCard className="w-4 h-4 text-gray-600" />,
      category: 'withdraw'
    }
  ]

  const filteredTransactions = filterType === 'all' 
    ? transactions 
    : transactions.filter(t => t.category === filterType)

  const filterOptions = [
    { value: 'all', label: 'All Transactions' },
    { value: 'deposit', label: 'Deposits' },
    { value: 'send', label: 'Sent' },
    { value: 'received', label: 'Received' },
    { value: 'buy', label: 'Purchases' },
    { value: 'withdraw', label: 'Withdrawals' }
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/app')}
                className="flex items-center"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <img src={diBoaSLogo} alt="diBoaS Logo" className="h-8 w-auto" />
            </div>
            
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="sm">
                <Bell className="w-5 h-5" />
              </Button>
              <Button variant="ghost" size="sm">
                <Settings className="w-5 h-5" />
              </Button>
              <Avatar className="h-8 w-8">
                <AvatarImage src="/api/placeholder/32/32" />
                <AvatarFallback>JD</AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Account Overview */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Account Overview
          </h1>

          {/* Balance Cards */}
          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <Card className="diboas-gradient text-white">
              <CardContent className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <p className="text-blue-100 text-sm mb-1">Total Balance</p>
                    <div className="flex items-center">
                      <h2 className="text-2xl font-bold mr-3">
                        {balanceVisible ? '$40,676.50' : '••••••••'}
                      </h2>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setBalanceVisible(!balanceVisible)}
                        className="text-white hover:bg-white/20"
                      >
                        {balanceVisible ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>
                  <Badge className="bg-green-500 text-white">
                    +2.4%
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600 text-sm mb-1">Available</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {balanceVisible ? '$38,450.25' : '••••••••'}
                </h3>
                <p className="text-sm text-green-600 mt-2">Ready to use</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <p className="text-gray-600 text-sm mb-1">Invested</p>
                <h3 className="text-2xl font-bold text-gray-900">
                  {balanceVisible ? '$2,226.25' : '••••••••'}
                </h3>
                <p className="text-sm text-blue-600 mt-2">In portfolio</p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Transaction History */}
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <CardTitle className="text-xl">Transaction History</CardTitle>
                <CardDescription>
                  All your diBoaS account activity
                </CardDescription>
              </div>
              
              <div className="flex items-center space-x-3">
                <div className="relative">
                  <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                  <Input
                    placeholder="Search transactions..."
                    className="pl-10 w-64"
                  />
                </div>
                
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {filterOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                
                <Button variant="outline" size="sm">
                  <Download className="w-4 h-4 mr-2" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          
          <CardContent>
            <div className="space-y-4">
              {filteredTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  className="flex items-center justify-between p-4 rounded-lg hover:bg-gray-50 transition-colors border border-gray-100"
                >
                  <div className="flex items-center space-x-4">
                    <div className="p-2 bg-gray-100 rounded-full">
                      {transaction.icon}
                    </div>
                    <div>
                      <p className="font-medium text-gray-900">{transaction.description}</p>
                      <div className="flex items-center space-x-2 text-sm text-gray-500">
                        <span>{transaction.date}</span>
                        <span>•</span>
                        <span>{transaction.time}</span>
                        <Badge variant="outline" className="ml-2">
                          {transaction.status}
                        </Badge>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <p className={`font-semibold ${
                      transaction.amount.startsWith('+') ? 'text-green-600' : 'text-gray-900'
                    }`}>
                      {transaction.amount}
                    </p>
                  </div>
                </div>
              ))}
            </div>
            
            {filteredTransactions.length === 0 && (
              <div className="text-center py-12">
                <Wallet className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
                <p className="text-gray-600">Try adjusting your filter or search criteria.</p>
              </div>
            )}
            
            {filteredTransactions.length > 0 && (
              <div className="mt-6 text-center">
                <Button variant="outline">
                  Load More Transactions
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

