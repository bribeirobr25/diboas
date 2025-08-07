/**
 * New 8-Step Objective Configuration Wizard
 * Implements the complete redesigned strategy configuration flow
 * 
 * Steps:
 * 1. Name & Image - Strategy identity configuration
 * 2. Investment - Initial and recurring investment amounts
 * 3. Goals - Target goals and timeline
 * 4. Search - Finding matching DeFi strategies
 * 5. Selection - Choose strategy from recommendations
 * 6. Review - Final review and confirmation
 * 7. Launch - Execute strategy deployment
 * 8. Management - Redirect to strategy management
 */

import { useState, useEffect, useCallback } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select.jsx'
import { Textarea } from '@/components/ui/textarea.jsx'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group.jsx'
import logger from '../../utils/logger'
import { 
  ArrowLeft, 
  ArrowRight, 
  Upload, 
  Calendar, 
  DollarSign, 
  RefreshCw, 
  TrendingUp, 
  AlertTriangle,
  Target,
  Wallet,
  CheckCircle,
  Info,
  Search,
  BarChart3,
  Clock,
  Shield,
  Zap,
  Play,
  Settings
} from 'lucide-react'
import PageHeader from '../shared/PageHeader.jsx'
import EnhancedTransactionProgressScreen from '../shared/EnhancedTransactionProgressScreen.jsx'
import { useWalletBalance, useTransactionFlow, useFeeCalculator } from '../../hooks/transactions/index.js'
import { strategyConfigurationService } from '../../services/defi/StrategyConfigurationService.js'
import { strategyMatchingService } from '../../services/defi/StrategyMatchingService.js'

// Available emojis for strategy icons
const STRATEGY_ICONS = [
  '🎯', '🛡️', '☕', '🏠', '🏖️', '🚗', '🎓', '💰', '📈', '🌟',
  '🎪', '🎨', '🎵', '🏆', '🚀', '💎', '🔥', '⚡', '🌈', '🎊'
]

export default function NewObjectiveConfig() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const templateId = searchParams.get('template')
  
  // Component state
  const [currentStep, setCurrentStep] = useState(1)
  const [configuration, setConfiguration] = useState(null)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState({})
  const [searchProgress, setSearchProgress] = useState(null)
  const [searchResults, setSearchResults] = useState(null)
  const [selectedStrategy, setSelectedStrategy] = useState(null)

  // Custom hooks
  const { balance } = useWalletBalance()
  const { executeDiBoaSTransaction } = useTransactionFlow()
  const { calculateStrategyFees } = useFeeCalculator()

  // Initialize configuration on mount
  useEffect(() => {
    initializeConfiguration()
  }, [templateId])

  /**
   * Initialize the configuration wizard
   */
  const initializeConfiguration = useCallback(() => {
    try {
      const config = strategyConfigurationService.initializeConfiguration(templateId)
      
      // Load template if specified
      if (templateId) {
        const template = strategyConfigurationService.loadTemplate(templateId)
        setConfiguration({ ...config, ...template })
      } else {
        setConfiguration(config)
      }

      logger.debug('Configuration initialized:', config)
    } catch (error) {
      logger.error('Error initializing configuration:', error)
      // Navigate back on error
      navigate('/category/yield')
    }
  }, [templateId, navigate])

  /**
   * Navigate to specific step
   */
  const goToStep = useCallback((stepNumber) => {
    if (stepNumber >= 1 && stepNumber <= 8) {
      setCurrentStep(stepNumber)
      setErrors({}) // Clear errors when changing steps
    }
  }, [])

  /**
   * Go to next step with validation
   */
  const nextStep = useCallback(async () => {
    try {
      // Validate current step
      if (!validateCurrentStep()) {
        return
      }

      // Special handling for search step
      if (currentStep === 3) {
        await handleStrategySearch()
        return
      }

      // Special handling for launch step
      if (currentStep === 6) {
        await handleStrategyLaunch()
        return
      }

      // Regular step progression
      if (currentStep < 8) {
        setCurrentStep(currentStep + 1)
      }
    } catch (error) {
      logger.error('Error progressing to next step:', error)
      setErrors({ general: error.message })
    }
  }, [currentStep])

  /**
   * Go to previous step
   */
  const previousStep = useCallback(() => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
      setErrors({})
    }
  }, [currentStep])

  /**
   * Update configuration with new data
   */
  const updateConfiguration = useCallback((updates) => {
    try {
      const updatedConfig = strategyConfigurationService.updateStep(currentStep, updates)
      setConfiguration(updatedConfig)
      
      // Save to localStorage for persistence
      strategyConfigurationService.saveToStorage()
      
      // Clear errors on successful update
      setErrors({})
    } catch (error) {
      logger.error('Error updating configuration:', error)
      setErrors({ general: error.message })
    }
  }, [currentStep])

  /**
   * Validate current step data
   */
  const validateCurrentStep = useCallback(() => {
    const newErrors = {}

    switch (currentStep) {
      case 1: // Name & Image
        if (!configuration?.name || configuration.name.trim().length < 3) {
          newErrors.name = 'Strategy name must be at least 3 characters'
        }
        break

      case 2: // Investment
        if (!configuration?.initialAmount || configuration.initialAmount < 50) {
          newErrors.initialAmount = 'Initial amount must be at least $50'
        }
        if (configuration?.initialAmount > (balance?.availableForSpending || 0)) {
          newErrors.initialAmount = 'Insufficient available balance'
        }
        break

      case 3: // Goals
        if (configuration?.goalType === 'amount') {
          if (!configuration?.targetAmount || configuration.targetAmount <= configuration.initialAmount) {
            newErrors.targetAmount = 'Target amount must be greater than initial amount'
          }
        } else if (configuration?.goalType === 'income') {
          if (!configuration?.targetIncome?.amount || configuration.targetIncome.amount <= 0) {
            newErrors.targetIncome = 'Target income must be greater than 0'
          }
        }
        break

      case 5: // Strategy Selection
        if (!selectedStrategy) {
          newErrors.strategy = 'Please select a strategy'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [currentStep, configuration, balance, selectedStrategy])

  /**
   * Handle strategy search process
   */
  const handleStrategySearch = useCallback(async () => {
    setIsLoading(true)
    setSearchProgress({ stage: 0, message: 'Preparing search...', percentage: 0 })

    try {
      const searchCriteria = strategyConfigurationService.prepareSearchCriteria()
      
      // Simulate search process with progress updates
      const results = await strategyMatchingService.simulateStrategySearch(
        searchCriteria,
        (progress) => setSearchProgress(progress)
      )

      setSearchResults(results)
      updateConfiguration({ searchCriteria, searchResults: results })

      // Auto-advance to selection step after brief delay
      setTimeout(() => {
        setSearchProgress(null)
        setCurrentStep(5)
        setIsLoading(false)
      }, 1500)

    } catch (error) {
      logger.error('Strategy search failed:', error)
      setErrors({ search: 'Failed to find matching strategies. Please try again.' })
      setIsLoading(false)
      setSearchProgress(null)
    }
  }, [updateConfiguration])

  /**
   * Handle strategy launch
   */
  const handleStrategyLaunch = useCallback(async () => {
    setIsLoading(true)

    try {
      // Calculate final fees
      const fees = await calculateStrategyFees({
        type: 'start_strategy',
        amount: configuration.initialAmount,
        chain: selectedStrategy.chain
      })

      // Prepare transaction data
      const transactionData = {
        type: 'start_strategy',
        amount: configuration.initialAmount,
        paymentMethod: 'diboas_wallet',
        asset: 'USDC',
        targetChain: selectedStrategy.chain,
        strategyConfig: {
          ...configuration,
          selectedStrategy,
          fees
        }
      }

      // Execute transaction
      const result = await executeDiBoaSTransaction(transactionData)

      if (result.success) {
        updateConfiguration({
          transactionId: result.transactionId,
          deploymentStatus: 'active',
          strategyId: `strategy_${Date.now()}`,
          isActive: true
        })

        // Move to final step
        setCurrentStep(7)
      } else {
        throw new Error(result.error || 'Transaction failed')
      }

    } catch (error) {
      logger.error('Strategy launch failed:', error)
      setErrors({ launch: error.message })
    } finally {
      setIsLoading(false)
    }
  }, [configuration, selectedStrategy, calculateStrategyFees, executeDiBoaSTransaction, updateConfiguration])

  /**
   * Handle back navigation
   */
  const handleBack = useCallback(() => {
    if (currentStep === 1) {
      navigate('/category/yield')
    } else {
      previousStep()
    }
  }, [currentStep, navigate, previousStep])

  /**
   * Handle exit to strategy management
   */
  const handleExit = useCallback(() => {
    strategyConfigurationService.clearStorage()
    navigate('/yield/manager?strategy=new')
  }, [navigate])

  // Show loading screen during async operations
  if (isLoading && searchProgress) {
    return (
      <div className="main-layout">
        <PageHeader showUserActions={true} />
        <div className="page-container">
          <Card className="max-w-md mx-auto mt-20">
            <CardContent className="p-8 text-center">
              <Search className="w-12 h-12 mx-auto mb-4 text-purple-600 animate-pulse" />
              <h3 className="text-lg font-semibold mb-2">{searchProgress.message}</h3>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                <div 
                  className="bg-purple-600 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${searchProgress.percentage}%` }}
                />
              </div>
              <p className="text-sm text-gray-600">
                Stage {searchProgress.stage} of {searchProgress.totalStages || 6}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  // Show transaction progress during launch
  if (isLoading && currentStep === 6) {
    return (
      <EnhancedTransactionProgressScreen
        transactionType="start_strategy"
        amount={configuration?.initialAmount}
        onComplete={handleExit}
      />
    )
  }

  if (!configuration) {
    return (
      <div className="main-layout">
        <PageHeader showUserActions={true} />
        <div className="page-container">
          <div className="flex items-center justify-center h-64">
            <RefreshCw className="w-8 h-8 animate-spin text-purple-600" />
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="main-layout">
      <PageHeader showUserActions={true} />
      
      <div className="page-container max-w-4xl mx-auto">
        {/* Progress Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            {currentStep === 1 ? 'Back to Yield' : 'Previous Step'}
          </Button>

          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">
              {currentStep <= 3 && 'Configure Strategy'}
              {currentStep === 4 && 'Finding Strategies'}
              {currentStep === 5 && 'Select Strategy'}
              {currentStep === 6 && 'Review & Launch'}
              {currentStep === 7 && 'Strategy Launched'}
              {currentStep === 8 && 'Strategy Management'}
            </h1>
            <Badge variant="outline">
              Step {currentStep} of 8
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-purple-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / 8) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content */}
        <div className="space-y-6">
          {/* Step 1: Name & Image */}
          {currentStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Strategy Identity
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Strategy Name</Label>
                      <Input
                        id="name"
                        value={configuration.name || ''}
                        onChange={(e) => updateConfiguration({ name: e.target.value })}
                        placeholder="e.g., My Emergency Fund"
                        className={errors.name ? 'border-red-500' : ''}
                      />
                      {errors.name && (
                        <p className="text-sm text-red-600 mt-1">{errors.name}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="description">Description (Optional)</Label>
                      <Textarea
                        id="description"
                        value={configuration.description || ''}
                        onChange={(e) => updateConfiguration({ description: e.target.value })}
                        placeholder="Describe your strategy goals..."
                        className="h-20"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label>Strategy Icon</Label>
                      <div className="grid grid-cols-5 gap-2 mt-2">
                        {STRATEGY_ICONS.map((icon) => (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => updateConfiguration({ icon })}
                            className={`p-3 text-2xl border rounded-lg hover:bg-purple-50 transition-colors ${
                              configuration.icon === icon 
                                ? 'border-purple-500 bg-purple-50' 
                                : 'border-gray-200'
                            }`}
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div>
                      <Label>Custom Image (Optional)</Label>
                      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                        <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
                        <p className="text-sm text-gray-600">Upload custom image</p>
                        <p className="text-xs text-gray-500 mt-1">Coming soon</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Investment */}
          {currentStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Investment Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="initialAmount">Initial Investment</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="initialAmount"
                          type="number"
                          value={configuration.initialAmount || ''}
                          onChange={(e) => updateConfiguration({ initialAmount: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                          className={`pl-10 ${errors.initialAmount ? 'border-red-500' : ''}`}
                          min="50"
                          step="0.01"
                        />
                      </div>
                      {errors.initialAmount && (
                        <p className="text-sm text-red-600 mt-1">{errors.initialAmount}</p>
                      )}
                      <p className="text-sm text-gray-600 mt-1">
                        Available: ${balance?.availableForSpending?.toFixed(2) || '0.00'}
                      </p>
                    </div>

                    <div>
                      <Label htmlFor="recurringAmount">Recurring Investment (Optional)</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="recurringAmount"
                          type="number"
                          value={configuration.recurringAmount || ''}
                          onChange={(e) => updateConfiguration({ recurringAmount: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                          className="pl-10"
                          min="0"
                          step="0.01"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="frequency">Investment Frequency</Label>
                      <Select 
                        value={configuration.recurringFrequency || 'monthly'}
                        onValueChange={(value) => updateConfiguration({ recurringFrequency: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="bi-weekly">Bi-weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="quarterly">Quarterly</SelectItem>
                          <SelectItem value="semi-annually">Semi-annually</SelectItem>
                          <SelectItem value="annually">Annually</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-start gap-3">
                        <Info className="w-5 h-5 text-blue-600 mt-0.5" />
                        <div>
                          <h4 className="font-medium text-blue-900">Payment Method</h4>
                          <p className="text-sm text-blue-700 mt-1">
                            Strategies can only be funded using your diBoaS Available Balance (USDC). 
                            External payment methods are not supported for DeFi strategies.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Goals */}
          {currentStep === 3 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="w-5 h-5" />
                  Goal Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label>Goal Type</Label>
                  <RadioGroup 
                    value={configuration.goalType || 'amount'} 
                    onValueChange={(value) => updateConfiguration({ goalType: value })}
                    className="mt-2"
                  >
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="amount" id="amount" />
                      <Label htmlFor="amount">Target Amount</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="income" id="income" />
                      <Label htmlFor="income">Target Income</Label>
                    </div>
                  </RadioGroup>
                </div>

                {configuration.goalType === 'amount' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="targetAmount">Target Amount</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="targetAmount"
                          type="number"
                          value={configuration.targetAmount || ''}
                          onChange={(e) => updateConfiguration({ targetAmount: parseFloat(e.target.value) || 0 })}
                          placeholder="0.00"
                          className={`pl-10 ${errors.targetAmount ? 'border-red-500' : ''}`}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      {errors.targetAmount && (
                        <p className="text-sm text-red-600 mt-1">{errors.targetAmount}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="targetDate">Target Date (Optional)</Label>
                      <Input
                        id="targetDate"
                        type="date"
                        value={configuration.targetDate || ''}
                        onChange={(e) => updateConfiguration({ targetDate: e.target.value })}
                        min={new Date().toISOString().split('T')[0]}
                      />
                    </div>
                  </div>
                )}

                {configuration.goalType === 'income' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <Label htmlFor="incomeAmount">Target Income Amount</Label>
                      <div className="relative">
                        <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          id="incomeAmount"
                          type="number"
                          value={configuration.targetIncome?.amount || ''}
                          onChange={(e) => updateConfiguration({ 
                            targetIncome: { 
                              ...configuration.targetIncome, 
                              amount: parseFloat(e.target.value) || 0 
                            } 
                          })}
                          placeholder="0.00"
                          className={`pl-10 ${errors.targetIncome ? 'border-red-500' : ''}`}
                          min="0"
                          step="0.01"
                        />
                      </div>
                      {errors.targetIncome && (
                        <p className="text-sm text-red-600 mt-1">{errors.targetIncome}</p>
                      )}
                    </div>

                    <div>
                      <Label htmlFor="incomePeriod">Income Period</Label>
                      <Select 
                        value={configuration.targetIncome?.period || 'monthly'}
                        onValueChange={(value) => updateConfiguration({ 
                          targetIncome: { 
                            ...configuration.targetIncome, 
                            period: value 
                          } 
                        })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Steps 4 is handled by loading screen */}

          {/* Step 5: Strategy Selection */}
          {currentStep === 5 && searchResults && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Select DeFi Strategy
                </CardTitle>
                <p className="text-gray-600">
                  Found {searchResults.strategies.length} strategies matching your criteria
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {searchResults.strategies.slice(0, 5).map((strategy) => (
                    <div
                      key={strategy.id}
                      onClick={() => setSelectedStrategy(strategy)}
                      className={`p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedStrategy?.id === strategy.id
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-purple-300'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <Badge className="text-xs">
                              {strategy.chain}
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              Match: {(strategy.matchScore * 100).toFixed(0)}%
                            </Badge>
                          </div>
                          <h3 className="font-semibold">{strategy.name}</h3>
                          <p className="text-sm text-gray-600 mb-2">{strategy.protocol}</p>
                          
                          <div className="grid grid-cols-3 gap-4 text-sm">
                            <div>
                              <span className="text-gray-500">APY:</span>
                              <span className="ml-1 font-medium">
                                {strategy.apy.min.toFixed(1)}% - {strategy.apy.max.toFixed(1)}%
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Risk:</span>
                              <span className="ml-1 font-medium capitalize">
                                {strategy.riskLevel}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Liquidity:</span>
                              <span className="ml-1 font-medium">
                                {strategy.liquidityRating}/10
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="text-right">
                          <div className="text-lg font-semibold text-green-600">
                            ${strategy.projectedReturn.projectedValue.toLocaleString()}
                          </div>
                          <div className="text-sm text-gray-500">
                            Projected Value
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {errors.strategy && (
                  <p className="text-sm text-red-600 mt-4">{errors.strategy}</p>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 6: Review & Launch */}
          {currentStep === 6 && selectedStrategy && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="w-5 h-5" />
                  Review & Launch Strategy
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-semibold mb-3">Strategy Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>Name:</span>
                        <span>{configuration.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Initial Investment:</span>
                        <span>${configuration.initialAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>DeFi Protocol:</span>
                        <span>{selectedStrategy.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Chain:</span>
                        <span>{selectedStrategy.chain}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-semibold mb-3">Fee Breakdown</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span>diBoaS Fee (0.09%):</span>
                        <span>${(configuration.initialAmount * 0.0009).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Network Fee:</span>
                        <span>${(configuration.initialAmount * (
                          selectedStrategy.chain === 'SOL' ? 0.00001 :
                          selectedStrategy.chain === 'ETH' ? 0.005 :
                          selectedStrategy.chain === 'SUI' ? 0.00003 : 0.001
                        )).toFixed(4)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>DEX Fee (0.5%):</span>
                        <span>${(configuration.initialAmount * 0.005).toFixed(2)}</span>
                      </div>
                      <div className="border-t pt-2 flex justify-between font-semibold">
                        <span>Total Fees:</span>
                        <span>${(
                          configuration.initialAmount * 0.0009 + // diBoaS
                          configuration.initialAmount * (
                            selectedStrategy.chain === 'SOL' ? 0.00001 :
                            selectedStrategy.chain === 'ETH' ? 0.005 :
                            selectedStrategy.chain === 'SUI' ? 0.00003 : 0.001
                          ) + // Network
                          configuration.initialAmount * 0.005 // DEX
                        ).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-amber-900">Important Notice</h4>
                      <p className="text-sm text-amber-800 mt-1">
                        DeFi strategies involve smart contract risks and potential loss of funds. 
                        Returns are not guaranteed and past performance does not indicate future results.
                      </p>
                    </div>
                  </div>
                </div>

                {errors.launch && (
                  <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                    <p className="text-sm text-red-800">{errors.launch}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Step 7: Launch Success */}
          {currentStep === 7 && (
            <Card>
              <CardContent className="p-8 text-center">
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-600" />
                <h2 className="text-2xl font-bold text-green-900 mb-2">
                  Strategy Launched Successfully!
                </h2>
                <p className="text-gray-600 mb-6">
                  Your {configuration.name} strategy is now active and earning yield.
                </p>
                <Button onClick={handleExit} size="lg">
                  <Play className="w-4 h-4 mr-2" />
                  Manage Strategy
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Navigation Footer */}
        {currentStep < 7 && (
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button 
              variant="outline" 
              onClick={handleBack}
              disabled={isLoading}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {currentStep === 1 ? 'Cancel' : 'Previous'}
            </Button>

            <Button 
              onClick={nextStep}
              disabled={isLoading || !validateCurrentStep()}
              className="min-w-[120px]"
            >
              {isLoading ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  {currentStep === 3 && 'Search Strategies'}
                  {currentStep === 6 && 'Launch Strategy'}
                  {currentStep !== 3 && currentStep !== 6 && 'Next'}
                  {currentStep < 6 && <ArrowRight className="w-4 h-4 ml-2" />}
                </>
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}