/**
 * Strategy Manager Component
 * Manages active yield strategies and their performance
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { 
  ArrowLeft,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Target,
  Settings,
  Play,
  Pause,
  BarChart3,
  AlertCircle,
  CheckCircle,
  Plus
} from 'lucide-react'
import PageHeader from '../shared/PageHeader.jsx'

// Mock active strategies data
const MOCK_STRATEGIES = [
  {
    id: 'emergency-fund-1',
    objective: {
      title: 'Emergency Fund',
      icon: '🛡️',
      description: 'Build a financial safety net'
    },
    targetAmount: 5000,
    currentAmount: 2340.50,
    timeframe: 12,
    monthsElapsed: 4,
    riskLevel: 'conservative',
    expectedAPY: '4.5%',
    actualAPY: '5.2%',
    status: 'active',
    strategies: ['USDC Staking', 'Low-Risk Lending'],
    weeklyDeposit: 350,
    nextDeposit: '2024-02-15',
    performance: {
      totalEarned: 45.30,
      monthlyEarnings: 12.15,
      trend: 'up'
    }
  },
  {
    id: 'coffee-fund-1',
    objective: {
      title: 'Free Coffee',
      icon: '☕',
      description: 'Generate daily coffee money'
    },
    targetAmount: 500,
    currentAmount: 485.20,
    timeframe: 6,
    monthsElapsed: 5,
    riskLevel: 'moderate',
    expectedAPY: '8.0%',
    actualAPY: '9.1%',
    status: 'near_completion',
    strategies: ['Liquidity Pools', 'Yield Farming'],
    weeklyDeposit: 25,
    nextDeposit: '2024-02-15',
    performance: {
      totalEarned: 28.40,
      monthlyEarnings: 8.20,
      trend: 'up'
    }
  }
]

const RISK_LEVEL_COLORS = {
  conservative: 'bg-green-100 text-green-800',
  moderate: 'bg-blue-100 text-blue-800',
  balanced: 'bg-purple-100 text-purple-800',
  aggressive: 'bg-orange-100 text-orange-800'
}

const STATUS_CONFIG = {
  active: {
    label: 'Active',
    color: 'bg-green-100 text-green-800',
    icon: Play
  },
  paused: {
    label: 'Paused',
    color: 'bg-yellow-100 text-yellow-800',
    icon: Pause
  },
  near_completion: {
    label: 'Near Goal',
    color: 'bg-blue-100 text-blue-800',
    icon: Target
  },
  completed: {
    label: 'Completed',
    color: 'bg-gray-100 text-gray-800',
    icon: CheckCircle
  }
}

export default function StrategyManager() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const isNewStrategy = searchParams.get('strategy') === 'new'
  
  const [strategies, setStrategies] = useState(MOCK_STRATEGIES)
  const [selectedStrategy, setSelectedStrategy] = useState(null)

  useEffect(() => {
    if (isNewStrategy) {
      // Show success message for new strategy creation
      console.log('New strategy created successfully!')
    }
  }, [isNewStrategy])

  const handleBack = () => {
    navigate('/category/yield')
  }

  const handleCreateNew = () => {
    navigate('/yield/configure')
  }

  const handleStrategyClick = (strategy) => {
    setSelectedStrategy(strategy)
  }

  const handleStrategyAction = (strategyId, action) => {
    setStrategies(prev => prev.map(strategy => 
      strategy.id === strategyId 
        ? { ...strategy, status: action === 'pause' ? 'paused' : 'active' }
        : strategy
    ))
  }

  const calculateProgress = (current, target) => {
    return Math.min(100, (current / target) * 100)
  }

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount)
  }

  const getTimeRemaining = (totalMonths, elapsed) => {
    const remaining = totalMonths - elapsed
    return remaining > 0 ? `${remaining} months left` : 'Goal period complete'
  }

  return (
    <div className="main-layout">
      <PageHeader showUserActions={true} />
      
      <div className="page-container max-w-6xl mx-auto">
        {/* Breadcrumb Navigation */}
        <div className="strategy-manager__breadcrumb mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="strategy-manager__back-button p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to FinObjective
          </Button>
        </div>

        {/* Header */}
        <div className="strategy-manager__header mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="strategy-manager__icon p-3 rounded-xl bg-green-100">
                <BarChart3 className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <h1 className="strategy-manager__title text-3xl font-bold text-gray-900">
                  Strategy Manager
                </h1>
                <p className="strategy-manager__subtitle text-lg text-gray-600">
                  Monitor and manage your active yield strategies
                </p>
              </div>
            </div>
            
            <Button onClick={handleCreateNew} className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Strategy
            </Button>
          </div>
        </div>

        {/* Success Message for New Strategy */}
        {isNewStrategy && (
          <Card className="strategy-manager__success-card mb-6 border-green-200 bg-green-50">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <h3 className="font-semibold text-green-900">Strategy Created Successfully!</h3>
                  <p className="text-sm text-green-700">Your new FinObjective strategy is now active and earning yield.</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Portfolio Overview */}
        <div className="strategy-manager__overview grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Active Strategies</p>
                  <p className="text-2xl font-bold">{strategies.filter(s => s.status === 'active').length}</p>
                </div>
                <Play className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Invested</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(strategies.reduce((sum, s) => sum + s.currentAmount, 0))}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Total Earned</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatCurrency(strategies.reduce((sum, s) => sum + s.performance.totalEarned, 0))}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Avg APY</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {(strategies.reduce((sum, s) => sum + parseFloat(s.actualAPY), 0) / strategies.length).toFixed(1)}%
                  </p>
                </div>
                <BarChart3 className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Active Strategies */}
        <div className="strategy-manager__strategies">
          <h2 className="strategy-manager__strategies-title text-xl font-semibold text-gray-900 mb-6">
            Your Active Strategies
          </h2>
          
          {strategies.length === 0 ? (
            <Card className="strategy-manager__empty-state">
              <CardContent className="p-8 text-center">
                <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">No Active Strategies</h3>
                <p className="text-gray-600 mb-4">Start your first FinObjective strategy to begin earning yield.</p>
                <Button onClick={handleCreateNew} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" />
                  Create Your First Strategy
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="strategy-manager__strategies-grid grid grid-cols-1 lg:grid-cols-2 gap-6">
              {strategies.map((strategy) => {
                const progress = calculateProgress(strategy.currentAmount, strategy.targetAmount)
                const StatusIcon = STATUS_CONFIG[strategy.status].icon
                
                return (
                  <Card 
                    key={strategy.id}
                    className="strategy-manager__strategy-card interactive-card cursor-pointer transition-all duration-200 hover:scale-105"
                    onClick={() => handleStrategyClick(strategy)}
                  >
                    <CardHeader className="pb-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{strategy.objective.icon}</span>
                          <div>
                            <CardTitle className="text-lg">{strategy.objective.title}</CardTitle>
                            <CardDescription>{strategy.objective.description}</CardDescription>
                          </div>
                        </div>
                        <Badge className={STATUS_CONFIG[strategy.status].color}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {STATUS_CONFIG[strategy.status].label}
                        </Badge>
                      </div>
                    </CardHeader>
                    
                    <CardContent className="space-y-4">
                      {/* Progress */}
                      <div>
                        <div className="flex justify-between text-sm mb-2">
                          <span className="text-gray-600">Progress</span>
                          <span className="font-medium">{progress.toFixed(1)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${progress}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-gray-600">{formatCurrency(strategy.currentAmount)}</span>
                          <span className="text-gray-600">{formatCurrency(strategy.targetAmount)}</span>
                        </div>
                      </div>

                      {/* Performance */}
                      <div className="strategy-manager__performance grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600">Monthly Earnings</p>
                          <p className="font-semibold text-green-600">
                            {formatCurrency(strategy.performance.monthlyEarnings)}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600">Actual APY</p>
                          <p className="font-semibold flex items-center gap-1">
                            {strategy.actualAPY}
                            {strategy.performance.trend === 'up' ? (
                              <TrendingUp className="w-3 h-3 text-green-500" />
                            ) : (
                              <TrendingDown className="w-3 h-3 text-red-500" />
                            )}
                          </p>
                        </div>
                      </div>

                      {/* Timeline */}
                      <div className="strategy-manager__timeline">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Timeline</span>
                          <span className="text-gray-600">{getTimeRemaining(strategy.timeframe, strategy.monthsElapsed)}</span>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="strategy-manager__actions flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleStrategyAction(strategy.id, strategy.status === 'active' ? 'pause' : 'activate')
                          }}
                        >
                          {strategy.status === 'active' ? (
                            <>
                              <Pause className="w-3 h-3 mr-1" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-3 h-3 mr-1" />
                              Resume
                            </>
                          )}
                        </Button>
                        
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={(e) => {
                            e.stopPropagation()
                            // Handle settings/edit
                          }}
                        >
                          <Settings className="w-3 h-3 mr-1" />
                          Settings
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </div>

        {/* Educational Tips */}
        <div className="strategy-manager__tips mt-8">
          <Card className="strategy-manager__tips-card bg-blue-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <AlertCircle className="w-6 h-6 text-blue-600 mt-1" />
                <div>
                  <h3 className="strategy-manager__tips-title text-lg font-semibold text-blue-900 mb-2">
                    Strategy Management Tips
                  </h3>
                  <div className="strategy-manager__tips-content space-y-2">
                    <p className="text-blue-800 text-sm">
                      • <strong>Regular Monitoring:</strong> Check your strategies weekly to track progress
                    </p>
                    <p className="text-blue-800 text-sm">
                      • <strong>Rebalancing:</strong> Consider adjusting risk levels as you approach your goals
                    </p>
                    <p className="text-blue-800 text-sm">
                      • <strong>Compound Growth:</strong> Let earnings compound by keeping strategies active
                    </p>
                    <p className="text-blue-800 text-sm">
                      • <strong>Diversification:</strong> Spread risk across multiple strategies and objectives
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