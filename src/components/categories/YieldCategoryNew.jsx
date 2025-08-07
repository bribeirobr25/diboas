/**
 * Yield Category Page - Restructured Strategy Management
 * Shows strategy templates and running strategies with new architecture
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card.jsx'
import { Button } from '../ui/button.jsx'
import { Badge } from '../ui/badge.jsx'
import { Progress } from '../ui/progress.jsx'
import { 
  Target,
  ArrowLeft,
  Coffee,
  Umbrella,
  Car,
  Home,
  Plane,
  GraduationCap,
  Zap,
  TrendingUp,
  Info,
  DollarSign,
  Percent,
  Play,
  Square,
  BarChart3,
  Clock
} from 'lucide-react'
import PageHeader from '../shared/PageHeader.jsx'
import strategyLifecycleManager from '../../services/strategies/StrategyLifecycleManager.js'
import { useWalletBalance } from '../../hooks/transactions/index.js'
import logger from '../../utils/logger'

// Strategy templates with new structure
const STRATEGY_TEMPLATES = {
  'emergency-fund': {
    id: 'emergency-fund',
    name: 'Emergency Fund',
    description: 'Build your safety net with low-risk, liquid investments',
    icon: '🛡️',
    iconComponent: Umbrella,
    color: 'bg-red-100 text-red-600 border-red-200',
    hoverColor: 'hover:bg-red-50',
    riskLevel: 'low',
    expectedAPY: '4-6%',
    timeframe: 'Flexible'
  },
  'free-coffee': {
    id: 'free-coffee',
    name: 'Free Coffee',
    description: 'Generate passive income to cover your daily coffee expenses',
    icon: '☕',
    iconComponent: Coffee,
    color: 'bg-amber-100 text-amber-600 border-amber-200',
    hoverColor: 'hover:bg-amber-50',
    riskLevel: 'low',
    expectedAPY: '5-8%',
    timeframe: 'Monthly income'
  },
  'home-down-payment': {
    id: 'home-down-payment',
    name: 'Home Down Payment',
    description: 'Save for your dream home with optimized growth strategies',
    icon: '🏠',
    iconComponent: Home,
    color: 'bg-blue-100 text-blue-600 border-blue-200',
    hoverColor: 'hover:bg-blue-50',
    riskLevel: 'high',
    expectedAPY: '8-12%',
    timeframe: '2-5 years'
  },
  'dream-vacation': {
    id: 'dream-vacation',
    name: 'Dream Vacation',
    description: 'Save for your perfect getaway with balanced strategies',
    icon: '🏖️',
    iconComponent: Plane,
    color: 'bg-cyan-100 text-cyan-600 border-cyan-200',
    hoverColor: 'hover:bg-cyan-50',
    riskLevel: 'medium',
    expectedAPY: '6-10%',
    timeframe: '6-18 months'
  },
  'new-car': {
    id: 'new-car',
    name: 'New Car',
    description: 'Drive your dream car with growth-oriented protocols',
    icon: '🚗',
    iconComponent: Car,
    color: 'bg-indigo-100 text-indigo-600 border-indigo-200',
    hoverColor: 'hover:bg-indigo-50',
    riskLevel: 'medium',
    expectedAPY: '7-12%',
    timeframe: '1-3 years'
  },
  'education-fund': {
    id: 'education-fund',
    name: 'Education Fund',
    description: 'Invest in knowledge with steady growth strategies',
    icon: '🎓',
    iconComponent: GraduationCap,
    color: 'bg-purple-100 text-purple-600 border-purple-200',
    hoverColor: 'hover:bg-purple-50',
    riskLevel: 'medium',
    expectedAPY: '8-14%',
    timeframe: '3-10 years'
  }
}

export default function YieldCategory() {
  const navigate = useNavigate()
  const { balance } = useWalletBalance()
  
  const [activeStrategies, setActiveStrategies] = useState([])
  const [strategyStats, setStrategyStats] = useState({
    totalStrategies: 0,
    totalInvested: 0,
    totalCurrentValue: 0,
    totalEarnings: 0,
    averageReturn: 0,
    bestPerformer: null,
    totalAPY: 0
  })
  const [loading, setLoading] = useState(true)

  // Load active strategies and stats
  const loadStrategyData = useCallback(async () => {
    try {
      setLoading(true)
      
      // Get active strategies
      const strategies = strategyLifecycleManager.getActiveStrategies()
      setActiveStrategies(strategies)
      
      // Get strategy statistics
      const stats = strategyLifecycleManager.getStrategyStatistics()
      setStrategyStats(stats)
      
      logger.info('Yield category data loaded:', { 
        activeStrategies: strategies.length,
        totalInvested: stats.totalInvested 
      })
      
    } catch (error) {
      logger.error('Failed to load strategy data:', error)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadStrategyData()
    
    // Set up periodic updates for strategy performance
    const interval = setInterval(() => {
      loadStrategyData()
    }, 30000) // Update every 30 seconds
    
    return () => clearInterval(interval)
  }, [loadStrategyData])

  const handleTemplateSelect = useCallback((templateId) => {
    navigate(`/yield/configure?template=${templateId}`)
  }, [navigate])

  const handleCustomStrategy = useCallback(() => {
    navigate('/yield/configure?template=custom')
  }, [navigate])

  const handleStrategyClick = useCallback((strategyId) => {
    navigate(`/yield/strategy/${strategyId}`)
  }, [navigate])

  const handleStopStrategy = useCallback((e, strategyId) => {
    e.stopPropagation() // Prevent navigation
    navigate(`/transaction/stop_strategy?strategyId=${strategyId}`)
  }, [navigate])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <PageHeader 
          title="DeFi Strategies"
          subtitle="Goal-driven DeFi strategies for your financial objectives"
        />
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-layout">
      <PageHeader showUserActions={true} />
      
      <div className="page-container">
        {/* Breadcrumb Navigation */}
        <div className="yield-category__breadcrumb mb-6">
          <Button 
            variant="ghost" 
            onClick={() => navigate('/app')}
            className="yield-category__back-button p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        {/* Category Header with Background Image */}
        <div className="yield-category__header-with-bg">
          <div 
            className="yield-category__header-bg"
            style={{
              backgroundImage: 'url(https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=1200&h=300&fit=crop&crop=center)',
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
              className="yield-category__header-overlay"
              style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.9), rgba(139, 92, 246, 0.8))',
                borderRadius: '1rem'
              }}
            ></div>
            
            <div className="yield-category__header-content" style={{ position: 'relative', zIndex: 1 }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="yield-category__icon p-3 rounded-xl bg-white/20 backdrop-blur-sm">
                  <Target className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h1 className="yield-category__title text-3xl font-bold text-white">
                    Goal Strategies
                  </h1>
                  <p className="yield-category__subtitle text-lg text-white/90">
                    DeFi Yield & Strategy Management
                  </p>
                </div>
              </div>
              
              <p className="yield-category__description text-white/80 max-w-2xl">
                Achieve your financial goals with automated DeFi strategies. 
                Set targets, choose your risk tolerance, and let our algorithms optimize across protocols.
              </p>
            </div>
          </div>
        </div>

        {/* Strategy Overview Card - Similar to Investment Overview */}
        <div className="yield-category__overview mb-8">
          <Card className="strategy-overview-card">
            <CardHeader>
              <CardTitle className="strategy-overview-title">Strategy Overview</CardTitle>
              <CardDescription>Your current DeFi strategy portfolio at a glance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="strategy-overview-grid">
                <div className="strategy-overview-item">
                  <div className="strategy-overview-icon">
                    <BarChart3 className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="strategy-overview-content">
                    <p className="strategy-overview-label">Available Balance</p>
                    <p className="strategy-overview-value text-purple-600">
                      ${balance?.available?.toFixed(2) || '0.00'}
                    </p>
                  </div>
                </div>
                
                <div className="strategy-overview-divider"></div>
                
                <div className="strategy-overview-item">
                  <div className="strategy-overview-icon">
                    <Target className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="strategy-overview-content">
                    <p className="strategy-overview-label">Active Strategies</p>
                    <p className="strategy-overview-value text-blue-600">
                      {strategyStats?.totalStrategies || 0}
                    </p>
                  </div>
                </div>
                
                <div className="strategy-overview-divider"></div>
                
                <div className="strategy-overview-item">
                  <div className="strategy-overview-icon">
                    <TrendingUp className={`w-5 h-5 ${(strategyStats?.totalEarnings || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`} />
                  </div>
                  <div className="strategy-overview-content">
                    <p className="strategy-overview-label">Total Earnings</p>
                    <p className={`strategy-overview-value ${(strategyStats?.totalEarnings || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {(strategyStats?.totalEarnings || 0) >= 0 ? '+' : ''}${(strategyStats?.totalEarnings || 0).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-8">
        
        {/* Running Strategies */}
        {activeStrategies.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900">Running Strategies</h2>
              <Badge className="bg-green-100 text-green-800">
                {activeStrategies.length} Active
              </Badge>
            </div>
            
            <div className="strategy-grid">
              {activeStrategies.map((strategy) => (
                <Card 
                  key={strategy.id} 
                  className="cursor-pointer hover:shadow-lg transition-all duration-200 border-l-4 border-l-green-500"
                  onClick={() => handleStrategyClick(strategy.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="text-2xl">
                          {STRATEGY_TEMPLATES[strategy.strategyId]?.icon || '⚡'}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{strategy.strategyData?.name || 'Unknown Strategy'}</CardTitle>
                          <p className="text-sm text-gray-600">{strategy.strategyData?.protocol || 'Unknown Protocol'}</p>
                        </div>
                      </div>
                      <Badge className="bg-green-100 text-green-800 flex items-center gap-1">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        Running
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Invested</p>
                        <p className="font-semibold">${strategy.totalDeposited?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Current Value</p>
                        <p className="font-semibold">${strategy.currentValue?.toFixed(2) || '0.00'}</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Earnings</p>
                        <p className={`font-semibold ${
                          (strategy.earnings || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {(strategy.earnings || 0) >= 0 ? '+' : ''}${strategy.earnings?.toFixed(2) || '0.00'}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500">APY</p>
                        <p className="font-semibold text-blue-600">
                          {strategy.performance?.currentAPY?.toFixed(1) || '0.0'}%
                        </p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Return</span>
                        <span className={
                          (strategy.performance?.totalReturnPercentage || 0) >= 0 
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }>
                          {(strategy.performance?.totalReturnPercentage || 0) >= 0 ? '+' : ''}
                          {strategy.performance?.totalReturnPercentage?.toFixed(2) || '0.00'}%
                        </span>
                      </div>
                      <Progress 
                        value={Math.max(0, Math.min(100, (strategy.performance?.totalReturnPercentage || 0) + 50))} 
                        className="h-2"
                      />
                    </div>

                    <div className="flex justify-between items-center text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {strategy.performance?.daysRunning || 0} days running
                      </span>
                      <span>{strategy.chain}</span>
                    </div>

                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-red-600 border-red-200 hover:bg-red-50"
                      onClick={(e) => handleStopStrategy(e, strategy.id)}
                    >
                      <Square className="w-4 h-4 mr-2" />
                      Stop Strategy
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* Strategy Templates */}
        <section>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Strategy Templates</h2>
              <p className="text-gray-600 mt-1">
                Pre-configured strategies for common financial goals
              </p>
            </div>
            <Button
              onClick={handleCustomStrategy}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Zap className="w-4 h-4" />
              Create Custom
            </Button>
          </div>

          <div className="strategy-grid">
            {Object.values(STRATEGY_TEMPLATES).filter(t => t.id !== 'custom').map((template) => {
              const IconComponent = template.iconComponent
              
              return (
                <Card 
                  key={template.id} 
                  className={`cursor-pointer transition-all duration-200 ${template.hoverColor} hover:shadow-lg border ${template.color.includes('border') ? template.color : `border-gray-200 ${template.color}`}`}
                  onClick={() => handleTemplateSelect(template.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-12 h-12 rounded-lg bg-white shadow-sm">
                        <IconComponent className="w-6 h-6 text-gray-700" />
                      </div>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{template.name}</CardTitle>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            {template.riskLevel} risk
                          </Badge>
                          <Badge variant="outline" className="text-xs">
                            {template.expectedAPY}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  
                  <CardContent>
                    <CardDescription className="text-gray-600 mb-4">
                      {template.description}
                    </CardDescription>
                    
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>Timeframe: {template.timeframe}</span>
                      <Button size="sm" className="ml-auto">
                        <Play className="w-4 h-4 mr-2" />
                        Configure
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </section>

        {/* Getting Started Section (shown when no active strategies) */}
        {activeStrategies.length === 0 && (
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="pt-6">
              <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                  <Target className="w-8 h-8 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold text-blue-900 mb-2">
                    Start Your First DeFi Strategy
                  </h3>
                  <p className="text-blue-700 max-w-2xl mx-auto">
                    Choose from our pre-configured templates or create a custom strategy. 
                    All strategies are paid from your diBoaS wallet and automatically 
                    optimized across multiple DeFi protocols.
                  </p>
                </div>
                <div className="flex justify-center gap-4">
                  <Button 
                    onClick={() => handleTemplateSelect('free-coffee')}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Try Free Coffee Strategy
                  </Button>
                  <Button 
                    onClick={handleCustomStrategy}
                    variant="outline"
                  >
                    Create Custom Strategy
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Available Balance Info */}
        <Card className="bg-gray-50 border-gray-200">
          <CardContent className="pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Info className="w-5 h-5 text-gray-500" />
                <div>
                  <p className="font-medium text-gray-900">Available for Strategies</p>
                  <p className="text-sm text-gray-600">
                    All strategies are funded from your diBoaS wallet in USDC on Solana
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  ${balance?.available?.toFixed(2) || '0.00'}
                </p>
                <p className="text-sm text-gray-500">USDC Available</p>
              </div>
            </div>
          </CardContent>
        </Card>

        </div>
      </div>
    </div>
  )
}