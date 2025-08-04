/**
 * Strategy Configuration Wizard
 * 8-step process for creating and launching DeFi strategies
 * Follows the new proposal requirements exactly
 */

import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card.jsx'
import { Button } from '../ui/button.jsx'
import { Input } from '../ui/input.jsx'
import { Label } from '../ui/label.jsx'
import { Badge } from '../ui/badge.jsx'
import { RadioGroup, RadioGroupItem } from '../ui/radio-group.jsx'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select.jsx'
import { Textarea } from '../ui/textarea.jsx'
import { Progress } from '../ui/progress.jsx'
import { 
  ArrowLeft, 
  ArrowRight, 
  Search, 
  TrendingUp, 
  Target,
  DollarSign,
  Calendar,
  Play,
  CheckCircle,
  Loader2,
  Star,
  Info,
  ExternalLink
} from 'lucide-react'
import PageHeader from '../shared/PageHeader.jsx'
import { useWalletBalance, useTransactionFlow, useFeeCalculator } from '../../hooks/transactions/index.js'
import strategySearchEngine from '../../services/strategies/StrategySearchEngine.js'
import strategyLifecycleManager from '../../services/strategies/StrategyLifecycleManager.js'
import logger from '../../utils/logger'

// Strategy templates
const STRATEGY_TEMPLATES = {
  'emergency-fund': {
    id: 'emergency-fund',
    name: 'Emergency Fund',
    description: 'Build your safety net with low-risk, liquid investments',
    icon: '🛡️',
    defaultImage: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800&h=400&fit=crop',
    riskLevel: 'low',
    suggestedAPY: 4.5,
    color: 'bg-red-100 text-red-600'
  },
  'free-coffee': {
    id: 'free-coffee',
    name: 'Free Coffee',
    description: 'Generate passive income to cover your daily coffee expenses',
    icon: '☕',
    defaultImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=400&fit=crop',
    riskLevel: 'low',
    suggestedAPY: 6.5,
    color: 'bg-amber-100 text-amber-600'
  },
  'home-down-payment': {
    id: 'home-down-payment',
    name: 'Home Down Payment',
    description: 'Save for your dream home with optimized growth strategies',
    icon: '🏠',
    defaultImage: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=400&fit=crop',
    riskLevel: 'high',
    suggestedAPY: 10.0,
    color: 'bg-blue-100 text-blue-600'
  },
  'dream-vacation': {
    id: 'dream-vacation',
    name: 'Dream Vacation',
    description: 'Save for your perfect getaway with balanced strategies',
    icon: '🏖️',
    defaultImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
    riskLevel: 'medium',
    suggestedAPY: 8.5,
    color: 'bg-cyan-100 text-cyan-600'
  },
  'new-car': {
    id: 'new-car',
    name: 'New Car',
    description: 'Drive your dream car with growth-oriented protocols',
    icon: '🚗',
    defaultImage: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=400&fit=crop',
    riskLevel: 'medium',
    suggestedAPY: 9.0,
    color: 'bg-indigo-100 text-indigo-600'
  },
  'custom': {
    id: 'custom',
    name: 'Custom Strategy',
    description: 'Create your own personalized investment strategy',
    icon: '⚡',
    defaultImage: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=800&h=400&fit=crop',
    riskLevel: 'medium',
    suggestedAPY: 8.0,
    color: 'bg-purple-100 text-purple-600'
  }
}

const RECURRING_PERIODS = [
  { value: 'weekly', label: 'Every week', multiplier: 52 },
  { value: 'biweekly', label: 'Every 2 weeks', multiplier: 26 },
  { value: 'monthly', label: 'Every month', multiplier: 12 },
  { value: 'quarterly', label: 'Every 3 months', multiplier: 4 },
  { value: 'biannually', label: 'Twice a year', multiplier: 2 },
  { value: 'annually', label: 'Once a year', multiplier: 1 }
]

const GOAL_TYPES = [
  { value: 'target-date', label: 'Specific amount by specific date', icon: Calendar },
  { value: 'periodic-income', label: 'Regular income generation', icon: DollarSign }
]

export default function StrategyConfigurationWizard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { balance } = useWalletBalance()
  const { calculateFees } = useFeeCalculator()
  
  // Wizard state
  const [currentStep, setCurrentStep] = useState(1)
  const [wizardData, setWizardData] = useState({
    // Step 1: Name & Image
    templateId: searchParams.get('template') || null,
    strategyName: '',
    strategyImage: '',
    
    // Step 2: Investment amounts
    initialAmount: 0,
    hasRecurring: false,
    recurringAmount: 0,
    recurringPeriod: 'monthly',
    
    // Step 3: Goals
    goalType: 'target-date',
    targetAmount: 0,
    targetDate: '',
    periodicAmount: 0,
    periodicPeriod: 'monthly',
    
    // Step 4-5: Strategy search and selection
    searchResults: null,
    selectedStrategy: null,
    requiredAPY: 0,
    
    // Step 6: Review
    feeBreakdown: null,
    
    // Step 7-8: Launch tracking
    launchInProgress: false,
    launchResult: null
  })

  // UI State
  const [errors, setErrors] = useState({})
  const [searchInProgress, setSearchInProgress] = useState(false)
  const [searchMessage, setSearchMessage] = useState('')

  const template = wizardData.templateId ? STRATEGY_TEMPLATES[wizardData.templateId] : null

  // Initialize template data
  useEffect(() => {
    if (template && !wizardData.strategyName) {
      setWizardData(prev => ({
        ...prev,
        strategyName: template.name,
        strategyImage: template.defaultImage
      }))
    }
  }, [template, wizardData.strategyName])

  // Calculate fees when amounts change
  useEffect(() => {
    if (currentStep >= 6 && wizardData.initialAmount > 0) {
      const calculateFeesAsync = async () => {
        try {
          const fees = await calculateFees({
            type: 'start_strategy',
            amount: wizardData.initialAmount,
            asset: 'USDC',
            paymentMethod: 'diboas_wallet',
            chains: ['SOL']
          })
          
          setWizardData(prev => ({ ...prev, feeBreakdown: fees }))
        } catch (error) {
          logger.error('Error calculating fees:', error)
          // Set default fee structure if calculation fails
          setWizardData(prev => ({ 
            ...prev, 
            feeBreakdown: {
              breakdown: {
                diboas: wizardData.initialAmount * 0.0009, // 0.09%
                network: 0.05, // $0.05 default
                dex: wizardData.initialAmount * 0.005 // 0.5%
              },
              total: (wizardData.initialAmount * 0.0009) + 0.05 + (wizardData.initialAmount * 0.005)
            }
          }))
        }
      }
      
      calculateFeesAsync()
    }
  }, [wizardData.initialAmount, currentStep, calculateFees])

  const updateWizardData = useCallback((updates) => {
    setWizardData(prev => ({ ...prev, ...updates }))
    setErrors({})
  }, [])

  const validateStep = useCallback((step) => {
    const newErrors = {}

    switch (step) {
      case 1:
        if (!wizardData.strategyName.trim()) {
          newErrors.strategyName = 'Strategy name is required'
        }
        break
        
      case 2:
        if (wizardData.initialAmount <= 0) {
          newErrors.initialAmount = 'Initial amount must be greater than 0'
        }
        if (balance && wizardData.initialAmount > balance.available) {
          newErrors.initialAmount = `Insufficient balance. Available: $${balance.available.toFixed(2)}`
        }
        if (wizardData.hasRecurring && wizardData.recurringAmount <= 0) {
          newErrors.recurringAmount = 'Recurring amount must be greater than 0'
        }
        break
        
      case 3:
        if (wizardData.goalType === 'target-date') {
          if (wizardData.targetAmount <= 0) {
            newErrors.targetAmount = 'Target amount is required'
          }
          if (!wizardData.targetDate) {
            newErrors.targetDate = 'Target date is required'
          } else {
            const targetDate = new Date(wizardData.targetDate)
            const today = new Date()
            if (targetDate <= today) {
              newErrors.targetDate = 'Target date must be in the future'
            }
          }
        } else {
          if (wizardData.periodicAmount <= 0) {
            newErrors.periodicAmount = 'Periodic amount is required'
          }
        }
        break
        
      case 5:
        if (!wizardData.selectedStrategy) {
          newErrors.selectedStrategy = 'Please select a strategy'
        }
        break
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [wizardData, balance?.available])

  const handleNext = useCallback(async () => {
    if (!validateStep(currentStep)) return

    setCurrentStep(prev => Math.min(8, prev + 1))
  }, [currentStep, validateStep])

  const handlePrevious = useCallback(() => {
    setCurrentStep(prev => Math.max(1, prev - 1))
  }, [])

  const handleStrategySearch = useCallback(async () => {
    logger.info('🔍 handleStrategySearch called!')
    setSearchInProgress(true)
    setSearchMessage('🔍 Analyzing your goals...')
    
    try {
      // Build goal configuration
      const goalConfig = {
        initialAmount: wizardData.initialAmount,
        recurringAmount: wizardData.hasRecurring ? wizardData.recurringAmount : 0,
        recurringPeriod: wizardData.recurringPeriod
      }

      if (wizardData.goalType === 'target-date') {
        goalConfig.targetAmount = wizardData.targetAmount
        goalConfig.targetDate = wizardData.targetDate
      } else {
        goalConfig.targetPeriodAmount = wizardData.periodicAmount
        goalConfig.targetPeriod = wizardData.periodicPeriod
      }

      // Show intermediate messages to simulate search process
      setSearchMessage('🔍 Analyzing your goals...')
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setSearchMessage('💡 Matching with DeFi protocols...')
      await new Promise(resolve => setTimeout(resolve, 700))

      // Perform search - this should be fast now
      const searchResults = await strategySearchEngine.searchStrategies({
        goalConfig,
        preferredChains: ['SOL', 'ETH', 'SUI']
      })

      setSearchMessage(`✅ Found ${searchResults.strategiesFound} strategies!`)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      updateWizardData({
        searchResults,
        requiredAPY: searchResults.requiredAPY
      })

      setSearchInProgress(false)
      
      // Automatically transition to Step 5 after search completes
      setTimeout(() => {
        logger.info('Auto-transitioning to Step 5 after search completion')
        setCurrentStep(5)
      }, 1000) // Give user time to see the "Found X strategies" message

    } catch (error) {
      logger.error('Strategy search failed:', error)
      
      // On error, still show available strategies
      const fallbackStrategies = [
        { id: 'default-1', name: 'High Yield Strategy', apy: { current: 20.0 }, chain: 'SOL', protocol: 'DeFi Protocol', risk: 'high', liquidity: 'high', score: 0.2 },
        { id: 'default-2', name: 'Balanced Growth', apy: { current: 10.0 }, chain: 'ETH', protocol: 'Yield Optimizer', risk: 'medium', liquidity: 'medium', score: 0.1 },
        { id: 'default-3', name: 'Safe Income', apy: { current: 5.0 }, chain: 'SOL', protocol: 'Stable Protocol', risk: 'low', liquidity: 'high', score: 0.05 }
      ]
      
      updateWizardData({
        searchResults: {
          requiredAPY: 0,
          strategiesFound: fallbackStrategies.length,
          strategies: fallbackStrategies
        }
      })
      
      setSearchMessage('✅ Showing available strategies')
      setSearchInProgress(false)
      
      // Automatically transition to Step 5 even on fallback
      setTimeout(() => {
        logger.info('Auto-transitioning to Step 5 after fallback')
        setCurrentStep(5)
      }, 1000)
    }
  }, [wizardData, updateWizardData])

  const handleStrategyLaunch = useCallback(async () => {
    if (!wizardData.selectedStrategy) return

    // Move to step 7 (launching) immediately
    setCurrentStep(7)
    updateWizardData({ launchInProgress: true })

    try {
      const strategyConfig = {
        strategyId: wizardData.selectedStrategy.id,
        strategyData: wizardData.selectedStrategy,
        goalConfig: {
          initialAmount: wizardData.initialAmount,
          recurringAmount: wizardData.hasRecurring ? wizardData.recurringAmount : 0,
          recurringPeriod: wizardData.recurringPeriod,
          goalType: wizardData.goalType,
          targetAmount: wizardData.targetAmount,
          targetDate: wizardData.targetDate,
          periodicAmount: wizardData.periodicAmount,
          periodicPeriod: wizardData.periodicPeriod
        },
        initialAmount: wizardData.initialAmount,
        selectedChain: wizardData.selectedStrategy.chain
      }

      const result = await strategyLifecycleManager.launchStrategy(strategyConfig, balance || { available: 0, strategy: 0 })
      
      updateWizardData({ 
        launchResult: result,
        launchInProgress: false 
      })

      if (result.success) {
        // Show launch success for a moment, then move to final step
        setTimeout(() => {
          setCurrentStep(8) // Move to success step
        }, 2000)
      }

    } catch (error) {
      logger.error('Strategy launch failed:', error)
      updateWizardData({ 
        launchResult: { success: false, error: error.message },
        launchInProgress: false 
      })
    }
  }, [wizardData, balance, updateWizardData])

  // Backup: Trigger search when entering step 4 if no search was already triggered
  useEffect(() => {
    logger.info('Step 4 useEffect triggered:', { 
      currentStep, 
      searchInProgress, 
      hasSearchResults: !!wizardData.searchResults,
      shouldTriggerSearch: currentStep === 4 && !searchInProgress && !wizardData.searchResults
    })
    
    // Only trigger as backup if step 4 is reached without search starting
    if (currentStep === 4 && !searchInProgress && !wizardData.searchResults) {
      logger.info('Backup: Starting strategy search immediately')
      handleStrategySearch()
    }
  }, [currentStep, searchInProgress, wizardData.searchResults, handleStrategySearch])

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return renderStep1()
      case 2:
        return renderStep2()
      case 3:
        return renderStep3()
      case 4:
        return renderStep4()
      case 5:
        return renderStep5()
      case 6:
        return renderStep6()
      case 7:
        return renderStep7()
      case 8:
        return renderStep8()
      default:
        return null
    }
  }

  const renderStep1 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Name & Image</h2>
        <p className="text-gray-600">Give your strategy a name and choose an image</p>
      </div>

      {template && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="text-4xl">{template.icon}</div>
              <div>
                <h3 className="font-semibold text-blue-900">{template.name} Template</h3>
                <p className="text-blue-700 text-sm">{template.description}</p>
                <Badge className={template.color}>{template.riskLevel} risk</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-4">
        <div>
          <Label htmlFor="strategyName">Strategy Name *</Label>
          <Input
            id="strategyName"
            value={wizardData.strategyName}
            onChange={(e) => updateWizardData({ strategyName: e.target.value })}
            placeholder="e.g., My Emergency Fund"
            className={errors.strategyName ? 'border-red-500' : ''}
          />
          {errors.strategyName && <p className="text-red-500 text-sm mt-1">{errors.strategyName}</p>}
        </div>

        <div>
          <Label htmlFor="strategyImage">Strategy Image URL (Optional)</Label>
          <Input
            id="strategyImage"
            value={wizardData.strategyImage}
            onChange={(e) => updateWizardData({ strategyImage: e.target.value })}
            placeholder="https://example.com/image.jpg"
          />
          {wizardData.strategyImage && (
            <div className="mt-2">
              <img 
                src={wizardData.strategyImage} 
                alt="Strategy preview" 
                className="w-full h-32 object-cover rounded-lg"
                onError={(e) => {
                  e.target.style.display = 'none'
                }}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Investment Amount</h2>
        <p className="text-gray-600">How much do you want to invest?</p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg">
        <div className="flex items-center gap-2 mb-2">
          <Info className="w-4 h-4 text-blue-600" />
          <span className="font-medium text-blue-900">Available Balance</span>
        </div>
        <p className="text-2xl font-bold text-blue-900">${balance?.available?.toFixed(2) || '0.00'}</p>
        <p className="text-sm text-blue-700">All strategy payments are made from your diBoaS wallet in USDC</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="initialAmount">Initial Investment Amount (USD) *</Label>
          <Input
            id="initialAmount"
            type="number"
            value={wizardData.initialAmount || ''}
            onChange={(e) => updateWizardData({ initialAmount: parseFloat(e.target.value) || 0 })}
            placeholder="100"
            min="0"
            step="0.01"
            className={errors.initialAmount ? 'border-red-500' : ''}
          />
          {errors.initialAmount && <p className="text-red-500 text-sm mt-1">{errors.initialAmount}</p>}
        </div>

        <div className="border-t pt-4">
          <div className="flex items-center space-x-2 mb-4">
            <input
              type="checkbox"
              id="hasRecurring"
              checked={wizardData.hasRecurring}
              onChange={(e) => updateWizardData({ hasRecurring: e.target.checked })}
              className="rounded"
            />
            <Label htmlFor="hasRecurring">Add recurring investments</Label>
          </div>

          {wizardData.hasRecurring && (
            <div className="space-y-4 bg-gray-50 p-4 rounded-lg">
              <div>
                <Label htmlFor="recurringAmount">Recurring Amount (USD) *</Label>
                <Input
                  id="recurringAmount"
                  type="number"
                  value={wizardData.recurringAmount || ''}
                  onChange={(e) => updateWizardData({ recurringAmount: parseFloat(e.target.value) || 0 })}
                  placeholder="50"
                  min="0"
                  step="0.01"
                  className={errors.recurringAmount ? 'border-red-500' : ''}
                />
                {errors.recurringAmount && <p className="text-red-500 text-sm mt-1">{errors.recurringAmount}</p>}
              </div>

              <div>
                <Label htmlFor="recurringPeriod">Frequency</Label>
                <Select value={wizardData.recurringPeriod} onValueChange={(value) => updateWizardData({ recurringPeriod: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {RECURRING_PERIODS.map(period => (
                      <SelectItem key={period.value} value={period.value}>
                        {period.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )

  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Investment Goals</h2>
        <p className="text-gray-600">What do you want to achieve?</p>
      </div>

      <RadioGroup 
        value={wizardData.goalType} 
        onValueChange={(value) => updateWizardData({ goalType: value })}
        className="space-y-4"
      >
        {GOAL_TYPES.map(type => {
          const Icon = type.icon
          return (
            <div key={type.value} className="flex items-center space-x-2 p-4 border rounded-lg hover:bg-gray-50">
              <RadioGroupItem value={type.value} id={type.value} />
              <Label htmlFor={type.value} className="flex-1 cursor-pointer">
                <div className="flex items-center gap-3">
                  <Icon className="w-5 h-5 text-blue-600" />
                  <span className="font-medium">{type.label}</span>
                </div>
              </Label>
            </div>
          )
        })}
      </RadioGroup>

      {wizardData.goalType === 'target-date' && (
        <div className="space-y-4 bg-blue-50 p-4 rounded-lg">
          <h3 className="font-semibold text-blue-900">Target Date Goal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="targetAmount">Target Amount (USD) *</Label>
              <Input
                id="targetAmount"
                type="number"
                value={wizardData.targetAmount || ''}
                onChange={(e) => updateWizardData({ targetAmount: parseFloat(e.target.value) || 0 })}
                placeholder="10000"
                min="0"
                step="0.01"
                className={errors.targetAmount ? 'border-red-500' : ''}
              />
              {errors.targetAmount && <p className="text-red-500 text-sm mt-1">{errors.targetAmount}</p>}
            </div>
            <div>
              <Label htmlFor="targetDate">Target Date *</Label>
              <Input
                id="targetDate"
                type="date"
                value={wizardData.targetDate}
                onChange={(e) => updateWizardData({ targetDate: e.target.value })}
                min={new Date().toISOString().split('T')[0]}
                className={errors.targetDate ? 'border-red-500' : ''}
              />
              {errors.targetDate && <p className="text-red-500 text-sm mt-1">{errors.targetDate}</p>}
            </div>
          </div>
        </div>
      )}

      {wizardData.goalType === 'periodic-income' && (
        <div className="space-y-4 bg-green-50 p-4 rounded-lg">
          <h3 className="font-semibold text-green-900">Periodic Income Goal</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="periodicAmount">Income Amount (USD) *</Label>
              <Input
                id="periodicAmount"
                type="number"
                value={wizardData.periodicAmount || ''}
                onChange={(e) => updateWizardData({ periodicAmount: parseFloat(e.target.value) || 0 })}
                placeholder="100"
                min="0"
                step="0.01"
                className={errors.periodicAmount ? 'border-red-500' : ''}
              />
              {errors.periodicAmount && <p className="text-red-500 text-sm mt-1">{errors.periodicAmount}</p>}
            </div>
            <div>
              <Label htmlFor="periodicPeriod">Period</Label>
              <Select value={wizardData.periodicPeriod} onValueChange={(value) => updateWizardData({ periodicPeriod: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Per day</SelectItem>
                  <SelectItem value="monthly">Per month</SelectItem>
                  <SelectItem value="yearly">Per year</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}
    </div>
  )

  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Finding Strategies</h2>
        <p className="text-gray-600">diBoaS is searching for the best DeFi strategies for your goals</p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg text-center">
        <div className="flex justify-center mb-4">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
        </div>
        <p className="text-lg font-medium text-blue-900 mb-2">{searchMessage}</p>
        <p className="text-blue-700 text-sm">This may take a few seconds...</p>
      </div>

      {wizardData.requiredAPY > 0 && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-yellow-600" />
              <span className="font-medium text-yellow-900">
                Required APY: {wizardData.requiredAPY.toFixed(1)}%
              </span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              {wizardData.requiredAPY > 30 
                ? `Your goals require a ${wizardData.requiredAPY.toFixed(1)}% APY. We'll show you the best available strategies, even if they have lower returns.`
                : `Based on your goals, we're looking for strategies with at least ${wizardData.requiredAPY.toFixed(1)}% APY`
              }
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderStep5 = () => {
    if (!wizardData.searchResults) return null

    const { strategies, strategiesFound, requiredAPY } = wizardData.searchResults

    return (
      <div className="space-y-6">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Strategy</h2>
          <p className="text-gray-600">
            Choose from {strategiesFound} available strategies, ranked by highest APY
          </p>
        </div>


        <div className="space-y-4">
          {strategies.map((strategy, index) => (
            <Card 
              key={strategy.id} 
              className={`cursor-pointer transition-all ${
                wizardData.selectedStrategy?.id === strategy.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => updateWizardData({ selectedStrategy: strategy })}
            >
              <CardContent className="pt-4">
                <div className="flex justify-between items-start mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className="bg-blue-100 text-blue-800">
                        #{index + 1}
                      </Badge>
                      <h3 className="font-semibold text-lg">{strategy.name}</h3>
                      {index === 0 && (
                        <Badge className="bg-green-100 text-green-800 text-xs">
                          Highest APY
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 mb-2">{strategy.protocol} on {strategy.chain}</p>
                    <div className="flex gap-4 text-sm">
                      <span className="font-medium text-green-600">
                        {strategy.apy.current.toFixed(1)}% APY
                      </span>
                      <span className="text-gray-500">
                        Risk: {strategy.risk}
                      </span>
                      <span className="text-gray-500">
                        Liquidity: {strategy.liquidity}
                      </span>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {errors.selectedStrategy && (
          <p className="text-red-500 text-sm text-center">{errors.selectedStrategy}</p>
        )}
      </div>
    )
  }

  const renderStep6 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Review & Launch</h2>
        <p className="text-gray-600">Review your strategy configuration before launching</p>
      </div>

      {/* Strategy Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            {wizardData.strategyName}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500">Strategy:</span>
              <p className="font-medium">{wizardData.selectedStrategy?.name}</p>
            </div>
            <div>
              <span className="text-gray-500">Protocol:</span>
              <p className="font-medium">{wizardData.selectedStrategy?.protocol}</p>
            </div>
            <div>
              <span className="text-gray-500">Chain:</span>
              <p className="font-medium">{wizardData.selectedStrategy?.chain}</p>
            </div>
            <div>
              <span className="text-gray-500">Expected APY:</span>
              <p className="font-medium text-green-600">
                {wizardData.selectedStrategy?.apy.current.toFixed(1)}%
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Investment Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Investment Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex justify-between">
            <span>Initial Investment:</span>
            <span className="font-medium">${wizardData.initialAmount.toFixed(2)}</span>
          </div>
          {wizardData.hasRecurring && (
            <div className="flex justify-between">
              <span>Recurring Investment:</span>
              <span className="font-medium">
                ${wizardData.recurringAmount.toFixed(2)} {wizardData.recurringPeriod}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fee Breakdown */}
      {wizardData.feeBreakdown && (
        <Card>
          <CardHeader>
            <CardTitle>Fee Breakdown</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span>diBoaS Fee (0.09%):</span>
              <span>${wizardData.feeBreakdown.breakdown.diboas.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span>Network Fee:</span>
              <span>${wizardData.feeBreakdown.breakdown.network.toFixed(4)}</span>
            </div>
            <div className="flex justify-between">
              <span>DEX Fee (0.5%):</span>
              <span>${wizardData.feeBreakdown.breakdown.dex.toFixed(4)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-medium">
              <span>Total Fees:</span>
              <span>${wizardData.feeBreakdown.total.toFixed(4)}</span>
            </div>
            <div className="border-t pt-2 flex justify-between font-bold text-lg">
              <span>Total Cost:</span>
              <span>${(wizardData.initialAmount + wizardData.feeBreakdown.total).toFixed(2)}</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderStep7 = () => (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Launching Strategy</h2>
        <p className="text-gray-600">Your strategy is being deployed to the DeFi protocol</p>
      </div>

      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-8 rounded-lg text-center">
        <div className="flex justify-center mb-4">
          {wizardData.launchInProgress ? (
            <Loader2 className="w-12 h-12 text-blue-600 animate-spin" />
          ) : wizardData.launchResult?.success ? (
            <CheckCircle className="w-12 h-12 text-green-600" />
          ) : (
            <div className="w-12 h-12 text-red-600">❌</div>
          )}
        </div>
        
        {wizardData.launchInProgress && (
          <>
            <p className="text-lg font-medium text-blue-900 mb-2">
              Deploying to {wizardData.selectedStrategy?.protocol}...
            </p>
            <p className="text-blue-700 text-sm">This may take a few seconds...</p>
          </>
        )}
        
        {wizardData.launchResult && !wizardData.launchInProgress && (
          <>
            {wizardData.launchResult.success ? (
              <>
                <p className="text-lg font-medium text-green-900 mb-2">
                  Strategy Launched Successfully! 🎉
                </p>
                <p className="text-green-700 text-sm">
                  Your strategy is now running on {wizardData.selectedStrategy?.chain}
                </p>
              </>
            ) : (
              <>
                <p className="text-lg font-medium text-red-900 mb-2">
                  Launch Failed
                </p>
                <p className="text-red-700 text-sm">
                  {wizardData.launchResult.error}
                </p>
              </>
            )}
          </>
        )}
      </div>

      {wizardData.launchResult?.success && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Strategy ID:</span>
                <span className="font-mono">
                  {wizardData.launchResult.strategyInstance.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Transaction ID:</span>
                <span className="font-mono">
                  {wizardData.launchResult.transaction.id}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Amount Invested:</span>
                <span className="font-medium">
                  ${wizardData.initialAmount.toFixed(2)}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )

  const renderStep8 = () => (
    <div className="space-y-6 text-center">
      <div className="text-center">
        <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Strategy is Running!</h2>
        <p className="text-gray-600">Your DeFi strategy is now active and earning returns</p>
      </div>

      <Card className="bg-gradient-to-r from-green-50 to-blue-50">
        <CardContent className="pt-6">
          <div className="text-center space-y-4">
            <h3 className="text-xl font-semibold text-gray-900">
              {wizardData.strategyName}
            </h3>
            <div className="flex justify-center items-center gap-2">
              <Badge className="bg-green-100 text-green-800">
                Running
              </Badge>
              <span className="text-gray-500">•</span>
              <span className="text-sm text-gray-600">
                {wizardData.selectedStrategy?.chain} Chain
              </span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold text-green-600">
                  {wizardData.selectedStrategy?.apy.current.toFixed(1)}%
                </p>
                <p className="text-sm text-gray-500">Expected APY</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  ${wizardData.initialAmount.toFixed(2)}
                </p>
                <p className="text-sm text-gray-500">Invested</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-3">
        <Button 
          onClick={() => navigate('/category/yield')}
          className="w-full"
        >
          View All Strategies
        </Button>
        <Button 
          onClick={() => navigate('/account')}
          variant="outline"
          className="w-full"
        >
          View Transaction History
        </Button>
      </div>
    </div>
  )

  // Don't show navigation for steps 4, 7, 8
  const showNavigation = ![4, 7, 8].includes(currentStep)
  const canProceed = !Object.keys(errors).length && currentStep < 8

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader 
        title="Strategy Configuration"
        subtitle={`Step ${currentStep} of 8`}
        showBackButton={true}
        backTo="/category/yield"
      />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep} of 8</span>
            <span>{Math.round((currentStep / 8) * 100)}% Complete</span>
          </div>
          <Progress value={(currentStep / 8) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <Card className="mb-8">
          <CardContent className="pt-8">
            {renderStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        {showNavigation && (
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={currentStep === 1}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Previous
            </Button>

            {currentStep === 6 ? (
              <Button
                onClick={handleStrategyLaunch}
                disabled={!canProceed || wizardData.launchInProgress}
                className="bg-green-600 hover:bg-green-700"
              >
                {wizardData.launchInProgress ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Launching...
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Launch Strategy
                  </>
                )}
              </Button>
            ) : currentStep === 3 ? (
              <Button
                onClick={() => {
                  logger.info('Search Strategies button clicked')
                  handleNext() // Move to step 4 - the useEffect will trigger the search
                }}
                disabled={!canProceed}
              >
                Search Strategies
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                disabled={!canProceed || (currentStep === 4 && searchInProgress)}
              >
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}