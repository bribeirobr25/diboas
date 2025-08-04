/**
 * Strategy Configuration Page
 * Advanced strategy setup with protocol recommendations, risk assessment, and analytics
 */

import { useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { dataManager } from '../../services/DataManager.js'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs.jsx'
import { Progress } from '@/components/ui/progress.jsx'
import logger from '../../utils/logger'
import { 
  ArrowLeft,
  Target,
  TrendingUp,
  Shield,
  Zap,
  AlertTriangle,
  CheckCircle,
  DollarSign,
  Percent,
  Calendar,
  BarChart3,
  Settings,
  Info
} from 'lucide-react'
import PageHeader from '../shared/PageHeader.jsx'

const RISK_TOLERANCE_OPTIONS = [
  { value: 'Conservative', label: 'Conservative', color: 'green' },
  { value: 'Moderate', label: 'Moderate', color: 'blue' },
  { value: 'Balanced', label: 'Balanced', color: 'yellow' },
  { value: 'Aggressive', label: 'Aggressive', color: 'orange' },
  { value: 'Very Aggressive', label: 'Very Aggressive', color: 'red' }
]

const TIME_HORIZON_OPTIONS = [
  { value: '6months', label: '6 Months', months: 6 },
  { value: '1year', label: '1 Year', months: 12 },
  { value: '2years', label: '2 Years', months: 24 },
  { value: '3years', label: '3 Years', months: 36 },
  { value: '5years', label: '5 Years', months: 60 }
]

export default function StrategyConfigurationPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const objective = searchParams.get('objective')

  const [config, setConfig] = useState({
    objective: objective || 'custom',
    name: '',
    targetAmount: '',
    initialDeposit: '',
    monthlyContribution: '',
    timeHorizon: '1year',
    riskTolerance: 'Moderate',
    asset: 'USDC',
    chain: 'ethereum'
  })

  const [protocolRecommendations, setProtocolRecommendations] = useState([])
  const [selectedProtocol, setSelectedProtocol] = useState(null)
  const [riskAssessment, setRiskAssessment] = useState(null)
  const [projections, setProjections] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('configuration')

  // Load protocol recommendations when config changes
  useEffect(() => {
    if (config.asset && config.targetAmount && parseFloat(config.targetAmount) > 0) {
      loadProtocolRecommendations()
    }
  }, [config.asset, config.targetAmount, config.riskTolerance, config.chain])

  // Generate projections when configuration is complete
  useEffect(() => {
    if (selectedProtocol && config.targetAmount && config.monthlyContribution) {
      generateProjections()
    }
  }, [selectedProtocol, config.targetAmount, config.monthlyContribution, config.timeHorizon])

  const loadProtocolRecommendations = async () => {
    try {
      setIsLoading(true)
      const recommendations = await dataManager.getProtocolRecommendations(
        config.asset,
        getRiskToleranceScore(config.riskTolerance),
        parseFloat(config.targetAmount),
        config.chain
      )
      
      setProtocolRecommendations(recommendations)
      
      // Auto-select the best recommendation
      if (recommendations.length > 0) {
        setSelectedProtocol(recommendations[0])
      }
    } catch (error) {
      logger.error('Failed to load protocol recommendations:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const generateProjections = async () => {
    if (!selectedProtocol) return

    try {
      // Create a mock strategy for projections
      const mockStrategyId = 'projection_strategy'
      const projections = await dataManager.getStrategyProjections(
        mockStrategyId,
        parseFloat(config.monthlyContribution) || 0,
        config.timeHorizon
      )

      // Override with current configuration
      projections.assumptions.expectedAPY = selectedProtocol.apy
      projections.assumptions.initialDeposit = parseFloat(config.initialDeposit) || 0

      setProjections(projections)

      // Also get risk assessment for the projected portfolio
      const riskAssessment = await dataManager.assessPortfolioRisk(config.riskTolerance)
      setRiskAssessment(riskAssessment)
    } catch (error) {
      logger.error('Failed to generate projections:', error)
    }
  }

  const handleConfigChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const handleProtocolSelect = (protocol) => {
    setSelectedProtocol(protocol)
  }

  const handleCreateStrategy = async () => {
    try {
      setIsLoading(true)

      // Generate strategy name if not provided
      const strategyName = config.name || `${getObjectiveDisplayName(config.objective)} - ${selectedProtocol.name}`

      // Create the strategy
      const strategyDetails = {
        name: strategyName,
        objective: config.objective,
        targetAmount: parseFloat(config.targetAmount),
        apy: selectedProtocol.apy,
        protocol: selectedProtocol.id,
        riskLevel: config.riskTolerance,
        timeHorizon: config.timeHorizon,
        asset: config.asset,
        chain: config.chain,
        protocolDetails: selectedProtocol,
        projections: projections,
        createdAt: Date.now()
      }

      // Start with initial deposit if provided
      const initialAmount = parseFloat(config.initialDeposit) || 0
      if (initialAmount > 0) {
        await dataManager.updateStrategyBalance(
          `strategy_${Date.now()}`,
          initialAmount,
          strategyDetails
        )

        // Add transaction record
        await dataManager.addTransaction({
          type: 'start_strategy',
          amount: initialAmount,
          currency: 'USD',
          description: `Started ${strategyName}`,
          strategyId: `strategy_${Date.now()}`,
          protocolId: selectedProtocol.id
        })
      }

      // Create automation for monthly contributions if specified
      if (parseFloat(config.monthlyContribution) > 0) {
        await dataManager.createAutomation({
          type: 'scheduled_deposit',
          name: `Monthly contribution to ${strategyName}`,
          frequency: 'monthly',
          parameters: {
            amount: parseFloat(config.monthlyContribution),
            targetStrategy: `strategy_${Date.now()}`,
            currency: 'USD'
          }
        })
      }

      // Navigate to yield category page
      navigate('/category/yield')
    } catch (error) {
      logger.error('Failed to create strategy:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleBackClick = () => {
    navigate('/category/yield')
  }

  const getRiskToleranceScore = (tolerance) => {
    const scores = {
      'Conservative': 0,
      'Moderate': 1,
      'Balanced': 2,
      'Aggressive': 3,
      'Very Aggressive': 4
    }
    return scores[tolerance] || 2
  }

  const getObjectiveDisplayName = (objective) => {
    const names = {
      'emergency-funds': 'Emergency Fund',
      'free-coffee': 'Free Coffee',
      'home-down-payment': 'Home Down Payment',
      'dream-vacation': 'Dream Vacation',
      'new-car': 'New Car',
      'education-fund': 'Education Fund',
      'custom': 'Custom Strategy'
    }
    return names[objective] || 'Custom Strategy'
  }

  const getRiskBadgeColor = (riskLevel) => {
    const colors = {
      'Conservative': 'bg-green-100 text-green-800',
      'Moderate': 'bg-blue-100 text-blue-800',
      'Balanced': 'bg-yellow-100 text-yellow-800',
      'Aggressive': 'bg-orange-100 text-orange-800',
      'Very Aggressive': 'bg-red-100 text-red-800'
    }
    return colors[riskLevel] || 'bg-gray-100 text-gray-800'
  }

  const isConfigurationComplete = () => {
    return config.targetAmount && 
           selectedProtocol && 
           config.riskTolerance && 
           config.timeHorizon
  }

  return (
    <div className="main-layout">
      <PageHeader showUserActions={true} />
      
      <div className="page-container">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBackClick}
            className="p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Yield
          </Button>
        </div>

        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Configure Strategy: {getObjectiveDisplayName(config.objective)}
          </h1>
          <p className="text-lg text-gray-600">
            Set up your goal-driven DeFi strategy with advanced protocol recommendations
          </p>
        </div>

        {/* Main Configuration Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Configuration Panel */}
          <div className="lg:col-span-2">
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid grid-cols-3 w-full mb-6">
                <TabsTrigger value="configuration" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Configuration
                </TabsTrigger>
                <TabsTrigger value="protocols" className="flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  Protocols
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" />
                  Analytics
                </TabsTrigger>
              </TabsList>

              {/* Configuration Tab */}
              <TabsContent value="configuration">
                <Card>
                  <CardHeader>
                    <CardTitle>Strategy Configuration</CardTitle>
                    <CardDescription>Set your investment parameters and goals</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Strategy Name */}
                    <div className="space-y-2">
                      <Label htmlFor="name">Strategy Name (Optional)</Label>
                      <Input
                        id="name"
                        placeholder={`${getObjectiveDisplayName(config.objective)} Strategy`}
                        value={config.name}
                        onChange={(e) => handleConfigChange('name', e.target.value)}
                      />
                    </div>

                    {/* Target Amount */}
                    <div className="space-y-2">
                      <Label htmlFor="targetAmount">Target Amount (USD)</Label>
                      <Input
                        id="targetAmount"
                        type="number"
                        placeholder="10000"
                        value={config.targetAmount}
                        onChange={(e) => handleConfigChange('targetAmount', e.target.value)}
                      />
                    </div>

                    {/* Initial Deposit */}
                    <div className="space-y-2">
                      <Label htmlFor="initialDeposit">Initial Deposit (USD)</Label>
                      <Input
                        id="initialDeposit"
                        type="number"
                        placeholder="1000"
                        value={config.initialDeposit}
                        onChange={(e) => handleConfigChange('initialDeposit', e.target.value)}
                      />
                    </div>

                    {/* Monthly Contribution */}
                    <div className="space-y-2">
                      <Label htmlFor="monthlyContribution">Monthly Contribution (USD)</Label>
                      <Input
                        id="monthlyContribution"
                        type="number"
                        placeholder="500"
                        value={config.monthlyContribution}
                        onChange={(e) => handleConfigChange('monthlyContribution', e.target.value)}
                      />
                    </div>

                    {/* Time Horizon */}
                    <div className="space-y-2">
                      <Label htmlFor="timeHorizon">Time Horizon</Label>
                      <Select value={config.timeHorizon} onValueChange={(value) => handleConfigChange('timeHorizon', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {TIME_HORIZON_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Risk Tolerance */}
                    <div className="space-y-2">
                      <Label htmlFor="riskTolerance">Risk Tolerance</Label>
                      <Select value={config.riskTolerance} onValueChange={(value) => handleConfigChange('riskTolerance', value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {RISK_TOLERANCE_OPTIONS.map(option => (
                            <SelectItem key={option.value} value={option.value}>
                              <div className="flex items-center gap-2">
                                <Badge className={getRiskBadgeColor(option.value)}>
                                  {option.label}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Protocols Tab */}
              <TabsContent value="protocols">
                <Card>
                  <CardHeader>
                    <CardTitle>Protocol Recommendations</CardTitle>
                    <CardDescription>AI-powered protocol selection based on your configuration</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600 mx-auto"></div>
                        <p className="text-gray-600 mt-2">Loading protocol recommendations...</p>
                      </div>
                    ) : protocolRecommendations.length > 0 ? (
                      <div className="space-y-4">
                        {protocolRecommendations.map((protocol, index) => (
                          <Card 
                            key={protocol.id}
                            className={`cursor-pointer transition-all duration-200 border-2 ${
                              selectedProtocol?.id === protocol.id 
                                ? 'border-purple-500 bg-purple-50' 
                                : 'border-gray-200 hover:border-purple-300'
                            }`}
                            onClick={() => handleProtocolSelect(protocol)}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="p-2 rounded-lg bg-purple-100">
                                    <Zap className="w-5 h-5 text-purple-600" />
                                  </div>
                                  <div>
                                    <h3 className="font-semibold text-lg">{protocol.name}</h3>
                                    <p className="text-sm text-gray-600">{protocol.description}</p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <Badge className="mb-1">#{index + 1} Recommended</Badge>
                                  <p className="text-sm text-gray-600">Score: {protocol.score}</p>
                                </div>
                              </div>

                              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                                <div>
                                  <span className="text-gray-500">APY:</span>
                                  <p className="font-semibold text-green-600">{protocol.apy}%</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Risk:</span>
                                  <Badge className={getRiskBadgeColor(protocol.riskLevel)}>
                                    {protocol.riskLevel}
                                  </Badge>
                                </div>
                                <div>
                                  <span className="text-gray-500">Yearly Return:</span>
                                  <p className="font-semibold text-green-600">${protocol.estimatedYearlyReturn}</p>
                                </div>
                                <div>
                                  <span className="text-gray-500">Compatibility:</span>
                                  <p className="font-semibold">{(protocol.riskCompatibility * 100).toFixed(0)}%</p>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Complete your configuration to see protocol recommendations</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Analytics Tab */}
              <TabsContent value="analytics">
                <Card>
                  <CardHeader>
                    <CardTitle>Strategy Analytics</CardTitle>
                    <CardDescription>Projections and risk analysis for your strategy</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {projections ? (
                      <div className="space-y-6">
                        {/* Projection Summary */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="text-center p-4 bg-green-50 rounded-lg">
                            <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Final Value</p>
                            <p className="text-2xl font-bold text-green-600">
                              ${projections.summary.finalValue?.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-blue-50 rounded-lg">
                            <TrendingUp className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Total Gains</p>
                            <p className="text-2xl font-bold text-blue-600">
                              ${projections.summary.totalGains?.toLocaleString()}
                            </p>
                          </div>
                          <div className="text-center p-4 bg-purple-50 rounded-lg">
                            <Percent className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                            <p className="text-sm text-gray-600">Expected APY</p>
                            <p className="text-2xl font-bold text-purple-600">
                              {projections.assumptions.expectedAPY}%
                            </p>
                          </div>
                        </div>

                        {/* Scenario Analysis */}
                        {projections.scenarios && (
                          <div>
                            <h4 className="font-semibold mb-3">Scenario Analysis</h4>
                            <div className="space-y-2">
                              {Object.entries(projections.scenarios).map(([scenario, data]) => (
                                <div key={scenario} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                                  <span className="font-medium capitalize">{scenario.replace('_', ' ')}</span>
                                  <div className="text-right">
                                    <p className="font-semibold">${data.finalValue?.toLocaleString()}</p>
                                    <p className="text-sm text-gray-600">{data.returnPercentage}% return</p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Risk Assessment */}
                        {riskAssessment && (
                          <div>
                            <h4 className="font-semibold mb-3">Risk Assessment</h4>
                            <div className="p-4 bg-gray-50 rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <span>Overall Risk Level</span>
                                <Badge className={getRiskBadgeColor(riskAssessment.riskLevel)}>
                                  {riskAssessment.riskLevel}
                                </Badge>
                              </div>
                              <div className="space-y-2">
                                <div className="flex justify-between">
                                  <span className="text-sm">Risk Score</span>
                                  <span className="text-sm font-semibold">{riskAssessment.overallRiskScore}</span>
                                </div>
                                <Progress value={riskAssessment.overallRiskScore} className="h-2" />
                              </div>
                              {riskAssessment.isWithinTolerance ? (
                                <div className="flex items-center gap-2 mt-3 text-green-600">
                                  <CheckCircle className="w-4 h-4" />
                                  <span className="text-sm">Within your risk tolerance</span>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 mt-3 text-orange-600">
                                  <AlertTriangle className="w-4 h-4" />
                                  <span className="text-sm">Exceeds your risk tolerance</span>
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-600">Complete your configuration to see analytics</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>

          {/* Summary Panel */}
          <div className="lg:col-span-1">
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Strategy Summary
                </CardTitle>
                <CardDescription>Review your configuration</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <p className="text-sm text-gray-600">Objective</p>
                  <p className="font-semibold">{getObjectiveDisplayName(config.objective)}</p>
                </div>

                {config.targetAmount && (
                  <div>
                    <p className="text-sm text-gray-600">Target Amount</p>
                    <p className="font-semibold">${parseInt(config.targetAmount).toLocaleString()}</p>
                  </div>
                )}

                {config.initialDeposit && (
                  <div>
                    <p className="text-sm text-gray-600">Initial Deposit</p>
                    <p className="font-semibold">${parseInt(config.initialDeposit).toLocaleString()}</p>
                  </div>
                )}

                {config.monthlyContribution && (
                  <div>
                    <p className="text-sm text-gray-600">Monthly Contribution</p>
                    <p className="font-semibold">${parseInt(config.monthlyContribution).toLocaleString()}</p>
                  </div>
                )}

                <div>
                  <p className="text-sm text-gray-600">Time Horizon</p>
                  <p className="font-semibold">{TIME_HORIZON_OPTIONS.find(t => t.value === config.timeHorizon)?.label}</p>
                </div>

                <div>
                  <p className="text-sm text-gray-600">Risk Tolerance</p>
                  <Badge className={getRiskBadgeColor(config.riskTolerance)}>
                    {config.riskTolerance}
                  </Badge>
                </div>

                {selectedProtocol && (
                  <div>
                    <p className="text-sm text-gray-600">Selected Protocol</p>
                    <p className="font-semibold">{selectedProtocol.name}</p>
                    <p className="text-sm text-green-600">{selectedProtocol.apy}% APY</p>
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button 
                    onClick={handleCreateStrategy}
                    disabled={!isConfigurationComplete() || isLoading}
                    className="w-full"
                  >
                    {isLoading ? (
                      <div className="flex items-center gap-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        Creating Strategy...
                      </div>
                    ) : (
                      'Create Strategy'
                    )}
                  </Button>
                  
                  {!isConfigurationComplete() && (
                    <p className="text-xs text-gray-500 mt-2 text-center">
                      Complete all required fields to create strategy
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}