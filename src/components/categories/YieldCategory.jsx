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
    const loadYieldData = () => {
      try {
        // Get FinObjective configurations from DataManager
        const objectives = dataManager.getFinObjectives()
        setFinObjectives(objectives)

        // Get risk level configurations from DataManager
        const risks = dataManager.getRiskLevels()
        setRiskLevels(risks)

        // Get current yield data from DataManager
        const currentYieldData = dataManager.getYieldData()
        setYieldData(currentYieldData)

        setIsLoading(false)
      } catch (error) {
        console.error('Error loading yield data:', error)
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

    const unsubscribeBalance = dataManager.subscribe('balance:updated', () => {
      // Recalculate yield data when balance changes
      const updatedYieldData = dataManager.getYieldData()
      setYieldData(updatedYieldData)
    })

    const unsubscribeStrategies = dataManager.subscribe('strategy:updated', () => {
      // Recalculate yield data when strategies change
      const updatedYieldData = dataManager.getYieldData()
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

        {/* Category Header */}
        <div className="yield-category__header mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="yield-category__icon p-3 rounded-xl bg-purple-100">
              <Target className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="yield-category__title text-3xl font-bold text-gray-900">
                FinObjective
              </h1>
              <p className="yield-category__subtitle text-lg text-gray-600">
                Goal-Driven DeFi Strategies
              </p>
            </div>
          </div>
          
          <p className="yield-category__description text-gray-600 max-w-2xl">
            Turn your financial goals into reality with automated DeFi strategies. 
            Each objective is tailored to your timeline and risk tolerance.
          </p>
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

        {/* Popular Objectives - Data from DataManager */}
        <div className="yield-category__popular mb-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="yield-category__popular-title text-xl font-semibold text-gray-900">
              Popular Objectives
            </h2>
            <Badge className="yield-category__popular-badge bg-purple-100 text-purple-800">
              <Zap className="w-3 h-3 mr-1" />
              Trending
            </Badge>
          </div>
          
          <div className="yield-category__popular-grid grid grid-cols-1 md:grid-cols-3 gap-6">
            {popularObjectives.map((objective) => {
              const IconComponent = ICON_MAP[objective.icon] || Target
              const riskConfig = riskLevels[objective.riskLevel] || riskLevels.Medium
              
              return (
                <Card 
                  key={objective.id}
                  className="yield-category__objective-card interactive-card cursor-pointer transition-all duration-200 hover:scale-105 ring-2 ring-purple-500 ring-opacity-50"
                  onClick={() => handleObjectiveClick(objective)}
                >
                  <CardHeader className="yield-category__objective-header pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`p-3 rounded-xl ${objective.color}`}>
                          <IconComponent className="w-6 h-6" />
                        </div>
                        <div>
                          <CardTitle className="yield-category__objective-title text-lg">
                            {objective.title}
                          </CardTitle>
                          <CardDescription className="yield-category__objective-description">
                            {objective.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge className="yield-category__popular-indicator bg-yellow-100 text-yellow-800">
                        Popular
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="yield-category__objective-content pt-0">
                    <div className="yield-category__objective-details space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Target Amount:</span>
                        <span className="font-semibold">${objective.targetAmount.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Timeframe:</span>
                        <span className="font-semibold">{objective.timeframe}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Expected APY:</span>
                        <span className="font-semibold text-green-600">{objective.expectedApy}</span>
                      </div>
                      
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Risk Level:</span>
                        <Badge className={`${riskConfig.color} text-xs`}>
                          {objective.riskLevel}
                        </Badge>
                      </div>

                      {/* Show progress if objective is active */}
                      {objective.isActive && (
                        <div className="flex justify-between items-center pt-2 border-t">
                          <span className="text-sm text-gray-600">Progress:</span>
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-blue-600">{objective.progress.toFixed(1)}%</span>
                            <span className="text-sm text-gray-500">
                              (${objective.currentAmount.toLocaleString()})
                            </span>
                          </div>
                        </div>
                      )}
                      
                      <div className="yield-category__objective-strategy mt-3 pt-3 border-t">
                        <p className="text-xs text-gray-600 mb-2">Strategy:</p>
                        <p className="text-sm font-medium">{objective.strategy}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* All Objectives - Data from DataManager */}
        <div className="yield-category__all">
          <h2 className="yield-category__all-title text-xl font-semibold text-gray-900 mb-6">
            All Financial Objectives
          </h2>
          
          <div className="yield-category__all-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {allObjectives.map((objective) => {
              const IconComponent = ICON_MAP[objective.icon] || Target
              const riskConfig = riskLevels[objective.riskLevel] || riskLevels.Medium
              
              return (
                <Card 
                  key={objective.id}
                  className={`yield-category__objective-card interactive-card cursor-pointer transition-all duration-200 hover:scale-105 ${
                    objective.isActive ? 'ring-2 ring-green-500 ring-opacity-50' : ''
                  }`}
                  onClick={() => handleObjectiveClick(objective)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`p-2 rounded-lg ${objective.color}`}>
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h3 className="yield-category__objective-name font-semibold">
                          {objective.title}
                          {objective.popular && (
                            <Badge className="ml-2 bg-yellow-100 text-yellow-800 text-xs">
                              Popular
                            </Badge>
                          )}
                          {objective.isActive && (
                            <Badge className="ml-2 bg-green-100 text-green-800 text-xs">
                              Active
                            </Badge>
                          )}
                        </h3>
                        <p className="yield-category__objective-desc text-sm text-gray-600">
                          {objective.description}
                        </p>
                      </div>
                    </div>
                    
                    <div className="yield-category__objective-summary space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Target:</span>
                        <span className="font-medium">${objective.targetAmount.toLocaleString()}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">APY:</span>
                        <span className="font-medium text-green-600">{objective.expectedApy}</span>
                      </div>
                      
                      <div className="flex justify-between text-sm">
                        <span className="text-gray-600">Risk:</span>
                        <Badge className={`${riskConfig.color} text-xs`}>
                          {objective.riskLevel}
                        </Badge>
                      </div>

                      {/* Show current amount and progress for active objectives */}
                      {objective.isActive && (
                        <div className="pt-2 border-t space-y-1">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Current:</span>
                            <span className="font-medium text-blue-600">
                              ${objective.currentAmount.toLocaleString()}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Progress:</span>
                            <span className="font-medium text-green-600">
                              {objective.progress.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        </div>

        {/* Custom Objective CTA */}
        <div className="yield-category__custom mt-8">
          <Card className="yield-category__custom-card bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="yield-category__custom-title text-lg font-semibold text-purple-900 mb-2">
                    Create Custom Objective
                  </h3>
                  <p className="yield-category__custom-description text-purple-700">
                    Design your own financial goal with personalized DeFi strategies
                  </p>
                </div>
                <Button 
                  onClick={handleCreateCustom}
                  className="yield-category__custom-button bg-purple-600 hover:bg-purple-700"
                >
                  <Target className="w-4 h-4 mr-2" />
                  Create Custom
                </Button>
              </div>
            </CardContent>
          </Card>
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