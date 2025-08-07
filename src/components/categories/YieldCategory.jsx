/**
 * Yield Category Page - FinObjective Goal-Driven DeFi Strategies
 * Handles yield generation through goal-oriented DeFi strategies
 * Data comes from DataManager following agnostic architecture pattern
 */

import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { dataManager } from '../../services/DataManager.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import logger from '../../utils/logger'
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
  Percent
} from 'lucide-react'
import PageHeader from '../shared/PageHeader.jsx'

// Icon mapping for dynamic icon rendering
const ICON_MAP = {
  Target,
  Coffee,
  Umbrella,
  Car,
  Home,
  Plane,
  GraduationCap
}

export default function YieldCategory() {
  const navigate = useNavigate()
  const [selectedObjective, setSelectedObjective] = useState(null)
  const [finObjectives, setFinObjectives] = useState({})
  const [yieldData, setYieldData] = useState({
    activeStrategies: 0,
    totalEarning: 0,
    avgAPY: 0,
    goalsProgress: 0
  })
  const [riskLevels, setRiskLevels] = useState({})
  const [isLoading, setIsLoading] = useState(true)

  const handleObjectiveClick = (objective) => {
    navigate(`/yield/configure?objective=${objective.id}`)
  }

  const handleBackClick = () => {
    navigate('/app')
  }

  const handleCreateCustom = () => {
    navigate('/yield/custom')
  }

  // Load data from DataManager on component mount
  useEffect(() => {
    const loadYieldData = async () => {
      try {
        // Get FinObjective configurations from DataManager
        const objectives = dataManager.getFinObjectives()
        setFinObjectives(objectives)

        // Get risk level configurations from DataManager
        const risks = dataManager.getRiskLevels()
        setRiskLevels(risks)

        // Get enhanced yield data from DataManager with new services integration
        const currentYieldData = await dataManager.getEnhancedYieldData()
        setYieldData(currentYieldData)

        setIsLoading(false)
      } catch (error) {
        logger.error('Error loading yield data:', error)
        setIsLoading(false)
      }
    }

    // Initial load
    loadYieldData()

    // Subscribe to DataManager updates
    const unsubscribeYieldData = dataManager.subscribe('yieldData:updated', (updatedYieldData) => {
      setYieldData(updatedYieldData)
    })

    const unsubscribeFinObjectives = dataManager.subscribe('finObjectives:updated', (updatedObjectives) => {
      setFinObjectives(updatedObjectives)
    })

    const unsubscribeBalance = dataManager.subscribe('balance:updated', async () => {
      // Recalculate enhanced yield data when balance changes
      const updatedYieldData = await dataManager.getEnhancedYieldData()
      setYieldData(updatedYieldData)
    })

    const unsubscribeStrategies = dataManager.subscribe('strategy:updated', async () => {
      // Recalculate enhanced yield data when strategies change
      const updatedYieldData = await dataManager.getEnhancedYieldData()
      setYieldData(updatedYieldData)
    })

    // Cleanup subscriptions on unmount
    return () => {
      unsubscribeYieldData()
      unsubscribeFinObjectives()
      unsubscribeBalance()
      unsubscribeStrategies()
    }
  }, [])

  if (isLoading) {
    return (
      <div className="main-layout">
        <PageHeader showUserActions={true} />
        <div className="page-container">
          <div className="flex items-center justify-center h-64">
            <div className="text-gray-600">Loading yield data...</div>
          </div>
        </div>
      </div>
    )
  }

  const popularObjectives = Object.values(finObjectives).filter(obj => obj.popular)
  const allObjectives = Object.values(finObjectives)

  return (
    <div className="main-layout">
      <PageHeader showUserActions={true} />
      
      <div className="page-container">
        {/* Breadcrumb Navigation */}
        <div className="yield-category__breadcrumb mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBackClick}
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
              backgroundImage: 'url(https://images.unsplash.com/photo-1579621970563-ebec7560ff3e?w=1200&h=300&fit=crop&crop=center)',
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
                background: 'linear-gradient(135deg, rgba(168, 85, 247, 0.9), rgba(147, 51, 234, 0.8))',
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
                    FinObjective
                  </h1>
                  <p className="yield-category__subtitle text-lg text-white/90">
                    Goal-Driven DeFi Strategies
                  </p>
                </div>
              </div>
              
              <p className="yield-category__description text-white/80 max-w-2xl">
                Turn your financial goals into reality with automated DeFi strategies. 
                Each objective is tailored to your timeline and risk tolerance.
              </p>
            </div>
          </div>
        </div>

        {/* Yield Overview Card - Data from DataManager */}
        <div className="yield-category__overview mb-8">
          <Card className="yield-overview-card">
            <CardHeader>
              <CardTitle className="yield-overview-title">Yield Overview</CardTitle>
              <CardDescription>Your current yield generation status from DataManager</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="yield-overview-grid">
                <div className="yield-overview-item">
                  <div className="yield-overview-icon">
                    <Target className="w-5 h-5 text-purple-600" />
                  </div>
                  <div className="yield-overview-content">
                    <p className="yield-overview-label">Active Strategies</p>
                    <p className="yield-overview-value text-purple-600">
                      {yieldData.activeStrategies}
                    </p>
                  </div>
                </div>
                
                <div className="yield-overview-divider"></div>
                
                <div className="yield-overview-item">
                  <div className="yield-overview-icon">
                    <DollarSign className="w-5 h-5 text-green-600" />
                  </div>
                  <div className="yield-overview-content">
                    <p className="yield-overview-label">Total Earning</p>
                    <p className="yield-overview-value text-green-600">
                      ${yieldData.totalEarning.toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <div className="yield-overview-divider"></div>
                
                <div className="yield-overview-item">
                  <div className="yield-overview-icon">
                    <Percent className="w-5 h-5 text-blue-600" />
                  </div>
                  <div className="yield-overview-content">
                    <p className="yield-overview-label">Avg APY</p>
                    <p className="yield-overview-value text-blue-600">
                      {yieldData.avgAPY.toFixed(1)}%
                    </p>
                  </div>
                </div>
                
                <div className="yield-overview-divider"></div>
                
                <div className="yield-overview-item">
                  <div className="yield-overview-icon">
                    <TrendingUp className="w-5 h-5 text-gray-600" />
                  </div>
                  <div className="yield-overview-content">
                    <p className="yield-overview-label">Goals Progress</p>
                    <p className="yield-overview-value text-gray-900">
                      {yieldData.goalsProgress.toFixed(0)}%
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Strategy Templates Section */}
        <div className="yield-category__templates mb-8">
          <h2 className="yield-category__templates-title text-xl font-semibold text-gray-900 mb-6">
            Objective-Driven Strategies
          </h2>
          
          <div className="yield-category__templates-grid grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Emergency Funds Template */}
            <Card 
              className="yield-strategy-template cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 border-gray-100 hover:border-purple-200"
              onClick={() => handleObjectiveClick({ id: 'emergency-funds', title: 'Emergency Funds' })}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-red-100 text-red-600">
                    <Umbrella className="w-6 h-6" />
                  </div>
                  <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-1">
                    Essential
                  </Badge>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 leading-tight mb-2">
                    Emergency Funds
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Build your safety net with low-risk, liquid investments
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Risk:</span>
                    <Badge className="bg-green-100 text-green-800 text-xs px-2 py-1">
                      Low
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">APY:</span>
                    <span className="text-sm font-semibold text-green-600">3-5%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Timeline:</span>
                    <span className="text-sm font-semibold">3-6 months</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Free Coffee Template */}
            <Card 
              className="yield-strategy-template cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 border-gray-100 hover:border-purple-200"
              onClick={() => handleObjectiveClick({ id: 'free-coffee', title: 'Free Coffee' })}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-amber-100 text-amber-600">
                    <Coffee className="w-6 h-6" />
                  </div>
                  <Badge className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1">
                    Popular
                  </Badge>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 leading-tight mb-2">
                    Free Coffee
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Generate passive income to cover your daily coffee expenses
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Risk:</span>
                    <Badge className="bg-yellow-100 text-yellow-800 text-xs px-2 py-1">
                      Medium
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">APY:</span>
                    <span className="text-sm font-semibold text-green-600">5-8%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Timeline:</span>
                    <span className="text-sm font-semibold">6-12 months</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Home Down Payment Template */}
            <Card 
              className="yield-strategy-template cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 border-gray-100 hover:border-purple-200"
              onClick={() => handleObjectiveClick({ id: 'home-down-payment', title: 'Home Down Payment' })}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-blue-100 text-blue-600">
                    <Home className="w-6 h-6" />
                  </div>
                  <Badge className="bg-purple-100 text-purple-800 text-xs px-2 py-1">
                    Long-term
                  </Badge>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 leading-tight mb-2">
                    Home Down Payment
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Save for your dream home with optimized growth strategies
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Risk:</span>
                    <Badge className="bg-orange-100 text-orange-800 text-xs px-2 py-1">
                      Medium-High
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">APY:</span>
                    <span className="text-sm font-semibold text-green-600">8-12%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Timeline:</span>
                    <span className="text-sm font-semibold">12+ months</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Dream Vacation Template */}
            <Card 
              className="yield-strategy-template cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 border-gray-100 hover:border-purple-200"
              onClick={() => handleObjectiveClick({ id: 'dream-vacation', title: 'Dream Vacation' })}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-cyan-100 text-cyan-600">
                    <Plane className="w-6 h-6" />
                  </div>
                  <Badge className="bg-cyan-100 text-cyan-800 text-xs px-2 py-1">
                    Balanced
                  </Badge>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 leading-tight mb-2">
                    Dream Vacation
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Save for your perfect getaway with balanced liquidity pools
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Risk:</span>
                    <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-1">
                      Medium
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">APY:</span>
                    <span className="text-sm font-medium text-gray-900">8-12%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Timeline:</span>
                    <span className="text-sm font-medium text-gray-900">6-12 months</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* New Car Template */}
            <Card 
              className="yield-strategy-template cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 border-gray-100 hover:border-purple-200"
              onClick={() => handleObjectiveClick({ id: 'new-car', title: 'New Car' })}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-indigo-100 text-indigo-600">
                    <Car className="w-6 h-6" />
                  </div>
                  <Badge className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1">
                    Growth
                  </Badge>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 leading-tight mb-2">
                    New Car
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Drive your dream car with growth-oriented protocols
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Risk:</span>
                    <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-1">
                      Medium
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">APY:</span>
                    <span className="text-sm font-medium text-gray-900">10-15%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Timeline:</span>
                    <span className="text-sm font-medium text-gray-900">12+ months</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Education Fund Template */}
            <Card 
              className="yield-strategy-template cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 border-gray-100 hover:border-purple-200"
              onClick={() => handleObjectiveClick({ id: 'education-fund', title: 'Education Fund' })}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-emerald-100 text-emerald-600">
                    <GraduationCap className="w-6 h-6" />
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-800 text-xs px-2 py-1">
                    Future
                  </Badge>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 leading-tight mb-2">
                    Education Fund
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Invest in your future with steady growth protocols
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Risk:</span>
                    <Badge className="bg-blue-100 text-blue-800 text-xs px-2 py-1">
                      Medium
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">APY:</span>
                    <span className="text-sm font-medium text-gray-900">8-14%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Timeline:</span>
                    <span className="text-sm font-medium text-gray-900">12+ months</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Create New Template */}
            <Card 
              className="yield-strategy-template cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-lg border-2 border-purple-200 bg-gradient-to-br from-purple-50 to-blue-50 hover:border-purple-300"
              onClick={() => handleObjectiveClick({ id: 'create-new', title: 'Create New' })}
            >
              <CardContent className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-lg bg-purple-100 text-purple-600">
                    <Target className="w-6 h-6" />
                  </div>
                  <Badge className="bg-purple-100 text-purple-800 text-xs px-2 py-1">
                    Custom
                  </Badge>
                </div>
                
                <div className="mb-4">
                  <h3 className="font-semibold text-lg text-gray-900 leading-tight mb-2">
                    Create New
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    Design your own objective with personalized parameters
                  </p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Risk:</span>
                    <Badge className="bg-gray-100 text-gray-800 text-xs px-2 py-1">
                      Flexible
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">APY:</span>
                    <span className="text-sm font-semibold text-purple-600">Custom</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-500">Timeline:</span>
                    <span className="text-sm font-semibold">Your choice</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Educational Tips */}
        <div className="yield-category__tips mt-8">
          <Card className="yield-category__tips-card bg-purple-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <Info className="w-6 h-6 text-purple-600 mt-1" />
                <div>
                  <h3 className="yield-category__tips-title text-lg font-semibold text-purple-900 mb-2">
                    How FinObjective Works
                  </h3>
                  <div className="yield-category__tips-content space-y-2">
                    <p className="text-purple-800 text-sm">
                      • <strong>Goal-Oriented:</strong> Each strategy is designed around your specific financial objective
                    </p>
                    <p className="text-purple-800 text-sm">
                      • <strong>Risk-Adjusted:</strong> Strategies automatically adjust based on your timeline and risk tolerance
                    </p>
                    <p className="text-purple-800 text-sm">
                      • <strong>Automated Rebalancing:</strong> Smart contracts handle optimization and rebalancing
                    </p>
                    <p className="text-purple-800 text-sm">
                      • <strong>Progress Tracking:</strong> Monitor your goal progress with real-time updates and projections
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