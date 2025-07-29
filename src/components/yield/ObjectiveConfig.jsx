/**
 * FinObjective Configuration Component
 * Allows users to configure yield strategies based on financial objectives
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { 
  ArrowLeft,
  Target,
  Calendar,
  DollarSign,
  TrendingUp,
  Settings,
  Info,
  CheckCircle,
  AlertCircle
} from 'lucide-react'
import PageHeader from '../shared/PageHeader.jsx'

// Predefined objectives with smart defaults
const PREDEFINED_OBJECTIVES = {
  emergency: {
    id: 'emergency',
    title: 'Emergency Fund',
    description: 'Build a financial safety net for unexpected expenses',
    suggestedAmount: 5000,
    suggestedTimeframe: 12,
    riskLevel: 'conservative',
    priority: 'high',
    icon: '🛡️',
    tips: [
      'Aim for 3-6 months of expenses',
      'Keep funds easily accessible',
      'Conservative growth is key'
    ]
  },
  coffee: {
    id: 'coffee',
    title: 'Free Coffee',
    description: 'Generate enough yield to cover daily coffee expenses',
    suggestedAmount: 500,
    suggestedTimeframe: 6,
    riskLevel: 'moderate',
    priority: 'medium',
    icon: '☕',
    tips: [
      'Small goal, quick achievement',
      'Perfect for DeFi beginners',
      'Monthly target: ~$50'
    ]
  },
  vacation: {
    id: 'vacation',
    title: 'Dream Vacation',
    description: 'Save for that special trip with yield-generating assets',
    suggestedAmount: 3000,
    suggestedTimeframe: 18,
    riskLevel: 'moderate',
    priority: 'medium',
    icon: '🏖️',
    tips: [
      'Plan ahead for better yields',
      'Balance growth with timeline',
      'Consider seasonal timing'
    ]
  },
  car: {
    id: 'car',
    title: 'New Car',
    description: 'Finance your next vehicle through smart DeFi strategies',
    suggestedAmount: 15000,
    suggestedTimeframe: 24,
    riskLevel: 'moderate',
    priority: 'high',
    icon: '🚗',
    tips: [
      'Longer timeframe allows growth',
      'Consider depreciation timing',
      'Factor in total cost of ownership'
    ]
  },
  house: {
    id: 'house',
    title: 'Home Down Payment',
    description: 'Build wealth for your dream home down payment',
    suggestedAmount: 50000,
    suggestedTimeframe: 60,
    riskLevel: 'balanced',
    priority: 'high',
    icon: '🏠',
    tips: [
      'Long-term compounding advantage',
      'Monitor interest rate trends',
      'Balance growth with stability'
    ]
  },
  education: {
    id: 'education',
    title: 'Education Fund',
    description: 'Invest in knowledge and skills for the future',
    suggestedAmount: 10000,
    suggestedTimeframe: 36,
    riskLevel: 'balanced',
    priority: 'high',
    icon: '🎓',
    tips: [
      'Education is the best investment',
      'Consider timing with enrollment',
      'Factor in inflation for costs'
    ]
  }
}

// Risk level configurations
const RISK_LEVELS = {
  conservative: {
    id: 'conservative',
    name: 'Conservative',
    description: 'Lower risk, stable returns (3-6% APY)',
    expectedAPY: '3-6%',
    color: 'bg-green-100 text-green-800',
    strategies: ['Stablecoin Staking', 'Low-Risk Lending']
  },
  moderate: {
    id: 'moderate',
    name: 'Moderate',
    description: 'Balanced risk/reward (6-12% APY)',
    expectedAPY: '6-12%',
    color: 'bg-blue-100 text-blue-800',
    strategies: ['Liquidity Pools', 'Yield Farming', 'Mixed Staking']
  },
  balanced: {
    id: 'balanced',
    name: 'Balanced',
    description: 'Diversified approach (8-15% APY)',
    expectedAPY: '8-15%',
    color: 'bg-purple-100 text-purple-800',
    strategies: ['Multi-Strategy', 'Automated Rebalancing', 'Risk Diversification']
  },
  aggressive: {
    id: 'aggressive',
    name: 'Aggressive',
    description: 'Higher risk, higher potential (12-25% APY)',
    expectedAPY: '12-25%',
    color: 'bg-orange-100 text-orange-800',
    strategies: ['High-Yield Farming', 'Leveraged Positions', 'New Protocol Exposure']
  }
}

export default function ObjectiveConfig() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const objectiveId = searchParams.get('objective')
  
  // Configuration state
  const [selectedObjective, setSelectedObjective] = useState(null)
  const [targetAmount, setTargetAmount] = useState('')
  const [timeframe, setTimeframe] = useState('')
  const [riskLevel, setRiskLevel] = useState('moderate')
  const [isCustomObjective, setIsCustomObjective] = useState(false)
  const [customTitle, setCustomTitle] = useState('')
  const [customDescription, setCustomDescription] = useState('')
  
  // UI state
  const [currentStep, setCurrentStep] = useState(1)
  const [isValid, setIsValid] = useState(false)

  // Initialize with predefined objective if provided
  useEffect(() => {
    if (objectiveId && PREDEFINED_OBJECTIVES[objectiveId]) {
      const objective = PREDEFINED_OBJECTIVES[objectiveId]
      setSelectedObjective(objective)
      setTargetAmount(objective.suggestedAmount.toString())
      setTimeframe(objective.suggestedTimeframe.toString())
      setRiskLevel(objective.riskLevel)
      setCurrentStep(2) // Skip objective selection
    }
  }, [objectiveId])

  // Validation
  useEffect(() => {
    const hasValidObjective = selectedObjective || (customTitle && customDescription)
    const hasValidAmount = targetAmount && parseFloat(targetAmount) > 0
    const hasValidTimeframe = timeframe && parseInt(timeframe) > 0
    const hasValidRisk = riskLevel

    setIsValid(hasValidObjective && hasValidAmount && hasValidTimeframe && hasValidRisk)
  }, [selectedObjective, customTitle, customDescription, targetAmount, timeframe, riskLevel])

  const handleObjectiveSelect = (objective) => {
    setSelectedObjective(objective)
    setTargetAmount(objective.suggestedAmount.toString())
    setTimeframe(objective.suggestedTimeframe.toString())
    setRiskLevel(objective.riskLevel)
    setIsCustomObjective(false)
    setCurrentStep(2)
  }

  const handleCustomObjective = () => {
    setIsCustomObjective(true)
    setSelectedObjective(null)
    setCurrentStep(2)
  }

  const handleCreateStrategy = async () => {
    const strategyConfig = {
      objective: selectedObjective || {
        id: 'custom',
        title: customTitle,
        description: customDescription,
        icon: '🎯'
      },
      targetAmount: parseFloat(targetAmount),
      timeframe: parseInt(timeframe),
      riskLevel,
      expectedAPY: RISK_LEVELS[riskLevel].expectedAPY,
      strategies: RISK_LEVELS[riskLevel].strategies,
      createdAt: new Date().toISOString()
    }

    try {
      // Mock strategy creation for now
      console.log('Creating strategy:', strategyConfig)
      
      // Navigate to strategy management page
      navigate('/yield/manage?strategy=new')
    } catch (error) {
      console.error('Failed to create strategy:', error)
    }
  }

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    } else {
      navigate('/category/yield')
    }
  }

  // Step 1: Objective Selection
  const renderObjectiveSelection = () => (
    <div className="objective-config__selection space-y-6">
      <div className="objective-config__predefined">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">
          Choose Your Financial Objective
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {Object.values(PREDEFINED_OBJECTIVES).map((objective) => (
            <Card 
              key={objective.id}
              className="objective-config__objective-card interactive-card cursor-pointer transition-all duration-200 hover:scale-105"
              onClick={() => handleObjectiveSelect(objective)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3 mb-3">
                  <span className="text-2xl">{objective.icon}</span>
                  <div>
                    <h4 className="font-semibold">{objective.title}</h4>
                    <p className="text-sm text-gray-600">{objective.description}</p>
                  </div>
                </div>
                
                <div className="objective-config__objective-meta space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Target:</span>
                    <span className="font-medium">${objective.suggestedAmount.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Timeframe:</span>
                    <span className="font-medium">{objective.suggestedTimeframe} months</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Risk:</span>
                    <Badge className={RISK_LEVELS[objective.riskLevel].color}>
                      {RISK_LEVELS[objective.riskLevel].name}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <Card 
          className="objective-config__custom-card interactive-card cursor-pointer border-dashed border-2"
          onClick={handleCustomObjective}
        >
          <CardContent className="p-6 text-center">
            <Target className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <h4 className="font-semibold mb-1">Create Custom Objective</h4>
            <p className="text-sm text-gray-600">Define your own financial goal</p>
          </CardContent>
        </Card>
      </div>
    </div>
  )

  // Step 2: Configuration
  const renderConfiguration = () => (
    <div className="objective-config__configuration space-y-6">
      {/* Objective Summary */}
      <Card className="objective-config__summary-card">
        <CardContent className="p-6">
          <div className="flex items-center gap-4 mb-4">
            {selectedObjective && <span className="text-3xl">{selectedObjective.icon}</span>}
            {isCustomObjective && <Target className="w-8 h-8 text-gray-600" />}
            <div>
              <h3 className="text-xl font-semibold">
                {selectedObjective?.title || customTitle || 'Custom Objective'}
              </h3>
              <p className="text-gray-600">
                {selectedObjective?.description || customDescription || 'Define your custom financial goal'}
              </p>
            </div>
          </div>

          {selectedObjective?.tips && (
            <div className="objective-config__tips bg-blue-50 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
                <Info className="w-4 h-4" />
                Tips for {selectedObjective.title}
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                {selectedObjective.tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <span className="text-blue-500 mt-1">•</span>
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Custom Objective Fields */}
      {isCustomObjective && (
        <Card>
          <CardHeader>
            <CardTitle>Objective Details</CardTitle>
            <CardDescription>Define your custom financial objective</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customTitle">Objective Title</Label>
              <Input
                id="customTitle"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                placeholder="e.g., Start a Business"
              />
            </div>
            <div>
              <Label htmlFor="customDescription">Description</Label>
              <Input
                id="customDescription"
                value={customDescription}
                onChange={(e) => setCustomDescription(e.target.value)}
                placeholder="e.g., Save capital to launch my tech startup"
              />
            </div>
          </CardContent>
        </Card>
      )}

      {/* Financial Configuration */}
      <Card>
        <CardHeader>
          <CardTitle>Financial Parameters</CardTitle>
          <CardDescription>Set your target amount and timeframe</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="targetAmount" className="flex items-center gap-2">
              <DollarSign className="w-4 h-4" />
              Target Amount (USD)
            </Label>
            <Input
              id="targetAmount"
              type="number"
              value={targetAmount}
              onChange={(e) => setTargetAmount(e.target.value)}
              placeholder="5000"
            />
          </div>
          
          <div>
            <Label htmlFor="timeframe" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Timeframe (Months)
            </Label>
            <Input
              id="timeframe"
              type="number"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
              placeholder="12"
            />
          </div>
        </CardContent>
      </Card>

      {/* Risk Level Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Risk Level</CardTitle>
          <CardDescription>Choose your risk tolerance and expected returns</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="objective-config__risk-levels grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.values(RISK_LEVELS).map((risk) => (
              <Card 
                key={risk.id}
                className={`objective-config__risk-card cursor-pointer transition-all ${
                  riskLevel === risk.id ? 'ring-2 ring-blue-500' : ''
                }`}
                onClick={() => setRiskLevel(risk.id)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold">{risk.name}</h4>
                    <Badge className={risk.color}>{risk.expectedAPY}</Badge>
                  </div>
                  <p className="text-sm text-gray-600 mb-3">{risk.description}</p>
                  <div className="text-xs text-gray-500">
                    <strong>Strategies:</strong> {risk.strategies.join(', ')}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Action Buttons */}
      <div className="objective-config__actions flex gap-4">
        <Button variant="outline" onClick={handleBack} className="flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          Back
        </Button>
        
        <Button 
          onClick={handleCreateStrategy}
          disabled={!isValid}
          className="flex-1 flex items-center justify-center gap-2"
        >
          {isValid ? (
            <>
              <CheckCircle className="w-4 h-4" />
              Create Strategy
            </>
          ) : (
            <>
              <AlertCircle className="w-4 h-4" />
              Complete Configuration
            </>
          )}
        </Button>
      </div>
    </div>
  )

  return (
    <div className="main-layout">
      <PageHeader showUserActions={true} />
      
      <div className="page-container max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <div className="objective-config__breadcrumb mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="objective-config__back-button p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
        </div>

        {/* Header */}
        <div className="objective-config__header mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="objective-config__icon p-3 rounded-xl bg-purple-100">
              <Settings className="w-8 h-8 text-purple-600" />
            </div>
            <div>
              <h1 className="objective-config__title text-3xl font-bold text-gray-900">
                Configure FinObjective
              </h1>
              <p className="objective-config__subtitle text-lg text-gray-600">
                Step {currentStep} of 2: {currentStep === 1 ? 'Choose Objective' : 'Configuration'}
              </p>
            </div>
          </div>
        </div>

        {/* Progress Indicator */}
        <div className="objective-config__progress mb-8">
          <div className="flex items-center gap-4">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 1 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              1
            </div>
            <div className={`flex-1 h-2 rounded ${
              currentStep >= 2 ? 'bg-blue-600' : 'bg-gray-200'
            }`} />
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              currentStep >= 2 ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-600'
            }`}>
              2
            </div>
          </div>
        </div>

        {/* Step Content */}
        {currentStep === 1 && renderObjectiveSelection()}
        {currentStep === 2 && renderConfiguration()}
      </div>
    </div>
  )
}

// Export configurations for use in other components
export { PREDEFINED_OBJECTIVES, RISK_LEVELS }