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
import { dataManager } from '../../services/DataManager.js'
import logger from '../../utils/logger'
import { safeToFixed, safeToNumber, safeCurrencyFormat, sanitizeFeeBreakdown, createDefaultFeeStructure } from '../../utils/numberFormatting'

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
    color: 'bg-red-100 text-red-600',
    chain: 'SOL',
    protocol: 'Solend',
    asset: 'USDC'
  },
  'free-coffee': {
    id: 'free-coffee',
    name: 'Free Coffee',
    description: 'Generate passive income to cover your daily coffee expenses',
    icon: '☕',
    defaultImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=400&fit=crop',
    riskLevel: 'low',
    suggestedAPY: 6.5,
    color: 'bg-amber-100 text-amber-600',
    chain: 'ETH',
    protocol: 'Aave',
    asset: 'USDC'
  },
  'home-down-payment': {
    id: 'home-down-payment',
    name: 'Home Down Payment',
    description: 'Save for your dream home with optimized growth strategies',
    icon: '🏠',
    defaultImage: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=400&fit=crop',
    riskLevel: 'high',
    suggestedAPY: 10.0,
    color: 'bg-blue-100 text-blue-600',
    chain: 'BTC',
    protocol: 'Lightning Network',
    asset: 'BTC'
  },
  'dream-vacation': {
    id: 'dream-vacation',
    name: 'Dream Vacation',
    description: 'Save for your perfect getaway with balanced strategies',
    icon: '🏖️',
    defaultImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
    riskLevel: 'medium',
    suggestedAPY: 8.5,
    color: 'bg-cyan-100 text-cyan-600',
    chain: 'SUI',
    protocol: 'Cetus',
    asset: 'SUI'
  },
  'new-car': {
    id: 'new-car',
    name: 'New Car',
    description: 'Drive your dream car with growth-oriented protocols',
    icon: '🚗',
    defaultImage: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=400&fit=crop',
    riskLevel: 'medium',
    suggestedAPY: 9.0,
    color: 'bg-indigo-100 text-indigo-600',
    chain: 'SOL',
    protocol: 'Raydium',
    asset: 'SOL'
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
  
  // Helper function to get network fee percentage by chain
  const getNetworkFeePercentage = (chain) => {
    const networkFeeRates = {
      'SOL': '0.0001%',
      'ETH': '0.5%', 
      'BTC': '1%',
      'SUI': '0.0003%'
    }
    return networkFeeRates[chain] || '0.0001%'
  }

  // Helper function to get DeFi fee percentage by chain
  const getDeFiFeePercentage = (chain) => {
    const defiFeeRates = {
      'SOL': '0.7%',
      'SUI': '0.9%',
      'ETH': '1.2%',
      'BTC': '1.5%'
    }
    return defiFeeRates[chain] || '0.7%'
  }

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

  // Calculate fees when amounts change - with comprehensive error handling
  useEffect(() => {
    if (currentStep >= 6 && safeToNumber(wizardData.initialAmount) > 0) {
      const calculateFeesAsync = async () => {
        try {
          const safeAmount = safeToNumber(wizardData.initialAmount, 0)
          
          // Get chain and asset from selected strategy or template
          const strategyChain = wizardData.selectedStrategy?.chain || template?.chain || 'SOL'
          const strategyAsset = wizardData.selectedStrategy?.asset || template?.asset || 'USDC'
          
          const fees = await calculateFees({
            type: 'start_strategy',
            amount: safeAmount,
            asset: strategyAsset,
            paymentMethod: 'diboas_wallet',
            chains: [strategyChain]
          })
          
          // Sanitize the fee response to ensure numeric values
          const sanitizedFees = sanitizeFeeBreakdown(fees)
          
          // Add chain information to the fee breakdown for UI display
          setWizardData(prev => ({ 
            ...prev, 
            feeBreakdown: {
              ...sanitizedFees,
              chain: strategyChain,
              asset: strategyAsset
            }
          }))
        } catch (error) {
          logger.error('Error calculating fees:', error)
          // Set safe default fee structure using utility
          const safeAmount = safeToNumber(wizardData.initialAmount, 0)
          const defaultFees = createDefaultFeeStructure(safeAmount)
          setWizardData(prev => ({ 
            ...prev, 
            feeBreakdown: {
              ...defaultFees,
              chain: wizardData.selectedStrategy?.chain || template?.chain || 'SOL',
              asset: wizardData.selectedStrategy?.asset || template?.asset || 'USDC'
            }
          }))
        }
      }
      
      calculateFeesAsync()
    }
  }, [wizardData.initialAmount, wizardData.selectedStrategy, currentStep, calculateFees, template])

  const updateWizardData = useCallback((updates) => {
    setWizardData(prev => ({ ...prev, ...updates }))
    setErrors({})
  }, [])

  const validateStep = useCallback((step) => {
    const newErrors = {}

    try {
      switch (step) {
        case 1:
          if (!wizardData.strategyName || !wizardData.strategyName.trim()) {
            newErrors.strategyName = 'Strategy name is required'
          }
          break
          
        case 2:
          const safeInitialAmount = safeToNumber(wizardData.initialAmount, 0)
          const safeRecurringAmount = safeToNumber(wizardData.recurringAmount, 0)
          const safeAvailableBalance = safeToNumber(balance?.available, 0)
          
          if (safeInitialAmount <= 0) {
            newErrors.initialAmount = 'Initial amount must be greater than 0'
          }
          if (balance && safeInitialAmount > safeAvailableBalance) {
            newErrors.initialAmount = `Insufficient balance. Available: ${safeCurrencyFormat(safeAvailableBalance, '$', 2)}`
          }
          if (wizardData.hasRecurring && safeRecurringAmount <= 0) {
            newErrors.recurringAmount = 'Recurring amount must be greater than 0'
          }
          break
          
        case 3:
          if (wizardData.goalType === 'target-date') {
            const safeTargetAmount = safeToNumber(wizardData.targetAmount, 0)
            
            if (safeTargetAmount <= 0) {
              newErrors.targetAmount = 'Target amount is required'
            }
            if (!wizardData.targetDate) {
              newErrors.targetDate = 'Target date is required'
            } else {
              try {
                const targetDate = new Date(wizardData.targetDate)
                const today = new Date()
                if (isNaN(targetDate.getTime()) || targetDate <= today) {
                  newErrors.targetDate = 'Target date must be a valid future date'
                }
              } catch (dateError) {
                newErrors.targetDate = 'Invalid target date format'
              }
            }
          } else {
            const safePeriodicAmount = safeToNumber(wizardData.periodicAmount, 0)
            if (safePeriodicAmount <= 0) {
              newErrors.periodicAmount = 'Periodic amount is required'
            }
          }
          break
          
        case 5:
          if (!wizardData.selectedStrategy || !wizardData.selectedStrategy.id) {
            newErrors.selectedStrategy = 'Please select a strategy'
          }
          break
      }
    } catch (validationError) {
      logger.error('Validation error:', validationError)
      newErrors.validation = 'Validation failed. Please check your inputs.'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }, [wizardData, balance?.available])

  const handleNext = useCallback(async () => {
    if (!validateStep(currentStep)) return

    setCurrentStep(prev => Math.min(8, prev + 1))
  }, [currentStep, validateStep])

  const handlePrevious = useCallback(() => {
    // Clear errors when going back
    setErrors({})
    
    const nextStep = Math.max(1, currentStep - 1)
    
    // Clear search results cache only when going back to step 3 or earlier
    if (nextStep <= 3 && wizardData.searchResults) {
      logger.info('🗑️ Clearing search results cache - going back to step 3 or earlier')
      setWizardData(prev => ({
        ...prev,
        searchResults: null,
        selectedStrategy: null,
        requiredAPY: 0
      }))
    }
    
    setCurrentStep(nextStep)
  }, [currentStep, wizardData.searchResults])

  const handleStrategySearch = useCallback(async () => {
    logger.info('🔍 handleStrategySearch called!')
    setSearchInProgress(true)
    setSearchMessage('🔍 Analyzing your goals...')
    
    try {
      // Build goal configuration with safe number extraction
      const safeInitialAmount = safeToNumber(wizardData.initialAmount, 0)
      const safeRecurringAmount = safeToNumber(wizardData.recurringAmount, 0)
      
      const goalConfig = {
        initialAmount: safeInitialAmount,
        recurringAmount: wizardData.hasRecurring ? safeRecurringAmount : 0,
        recurringPeriod: wizardData.recurringPeriod || 'monthly'
      }

      if (wizardData.goalType === 'target-date') {
        goalConfig.targetAmount = safeToNumber(wizardData.targetAmount, 0)
        goalConfig.targetDate = wizardData.targetDate
      } else {
        goalConfig.targetPeriodAmount = safeToNumber(wizardData.periodicAmount, 0)
        goalConfig.targetPeriod = wizardData.periodicPeriod || 'monthly'
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

      // Validate and sanitize search results
      const safeSearchResults = {
        requiredAPY: safeToNumber(searchResults?.requiredAPY, 0),
        strategiesFound: safeToNumber(searchResults?.strategiesFound, 0),
        strategies: Array.isArray(searchResults?.strategies) ? searchResults.strategies : []
      }

      setSearchMessage(`✅ Found ${safeSearchResults.strategiesFound} strategies!`)
      await new Promise(resolve => setTimeout(resolve, 500))
      
      updateWizardData({
        searchResults: safeSearchResults,
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
    if (!wizardData.selectedStrategy) {
      logger.error('No strategy selected for launch')
      return
    }

    // Move to step 7 (launching) immediately
    setCurrentStep(7)
    updateWizardData({ launchInProgress: true })

    try {
      // Safely extract values with proper type conversion
      const safeInitialAmount = safeToNumber(wizardData.initialAmount, 0)
      const safeRecurringAmount = safeToNumber(wizardData.recurringAmount, 0)
      const safeTargetAmount = safeToNumber(wizardData.targetAmount, 0)
      const safePeriodicAmount = safeToNumber(wizardData.periodicAmount, 0)
      
      const strategyConfig = {
        strategyId: wizardData.selectedStrategy.id || 'unknown',
        strategyData: wizardData.selectedStrategy,
        goalConfig: {
          initialAmount: safeInitialAmount,
          recurringAmount: wizardData.hasRecurring ? safeRecurringAmount : 0,
          recurringPeriod: wizardData.recurringPeriod || 'monthly',
          goalType: wizardData.goalType || 'amount_goal',
          targetAmount: safeTargetAmount,
          targetDate: wizardData.targetDate || null,
          periodicAmount: safePeriodicAmount,
          periodicPeriod: wizardData.periodicPeriod || 'monthly'
        },
        initialAmount: safeInitialAmount,
        selectedChain: wizardData.selectedStrategy.chain || 'SOL'
      }

      // Ensure balance object is safe
      const safeBalance = balance || { available: 0, strategy: 0 }
      const result = await strategyLifecycleManager.launchStrategy(strategyConfig, safeBalance)
      
      // Validate result object
      const safeResult = result || { success: false, error: 'Unknown launch error' }
      
      updateWizardData({ 
        launchResult: safeResult,
        launchInProgress: false 
      })

      if (safeResult.success) {
        // Add transaction to DataManager
        if (safeResult.transaction) {
          // Calculate total cost (amount + fees) for proper balance deduction
          const total = safeToNumber(wizardData.feeBreakdown?.total, 0)
          const totalCost = safeInitialAmount + total
          
          const transactionData = {
            ...safeResult.transaction,
            type: 'start_strategy',
            amount: totalCost, // Use total cost for balance deduction
            investmentAmount: safeInitialAmount, // Keep track of actual investment
            fees: wizardData.feeBreakdown || safeResult.transaction.fees,
            paymentMethod: 'diboas_wallet', // Strategy launches are always paid from diBoaS wallet
            description: `Started ${wizardData.strategyName} strategy`,
            strategyConfig: {
              strategyId: wizardData.selectedStrategy.id,
              strategyName: wizardData.strategyName,
              protocol: wizardData.selectedStrategy.protocol,
              apy: wizardData.selectedStrategy.apy.current
            }
          }
          
          // Add transaction to history
          dataManager.addTransaction(transactionData)
          
          // Update balance through DataManager
          await dataManager.updateBalance(transactionData)
        }
        
        // Show launch success for a moment, then move to final step
        setTimeout(() => {
          setCurrentStep(8) // Move to success step
        }, 2000)
      } else {
        logger.error('Strategy launch was not successful:', safeResult.error)
        
        // Record failed launch in transaction history
        const failedTransactionData = {
          id: `strategy_launch_failed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          type: 'start_strategy_failed',
          status: 'failed',
          amount: 0, // No amount deducted
          investmentAmount: safeInitialAmount, // Track intended investment
          fees: { total: 0, breakdown: {} }, // No fees charged
          paymentMethod: 'diboas_wallet',
          description: `Failed to start ${wizardData.strategyName} strategy: ${safeResult.error}`,
          date: new Date().toISOString(),
          asset: 'USD',
          strategyConfig: {
            strategyId: wizardData.selectedStrategy.id,
            strategyName: wizardData.strategyName,
            protocol: wizardData.selectedStrategy.protocol,
            apy: wizardData.selectedStrategy.apy.current
          }
        }
        
        // Add failed transaction to history
        dataManager.addTransaction(failedTransactionData)
        // No balance update needed as no funds were charged
      }

    } catch (error) {
      logger.error('Strategy launch failed:', error)
      const errorMessage = error?.message || 'Unknown error occurred during strategy launch'
      
      // Record failed launch in transaction history
      const failedTransactionData = {
        id: `strategy_launch_failed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        type: 'start_strategy_failed',
        status: 'failed',
        amount: 0, // No amount deducted
        investmentAmount: wizardData.initialAmount || 0, // Track intended investment
        fees: { total: 0, breakdown: {} }, // No fees charged
        paymentMethod: 'diboas_wallet',
        description: `Failed to start ${wizardData.strategyName} strategy: ${errorMessage}`,
        date: new Date().toISOString(),
        asset: 'USD',
        strategyConfig: wizardData.selectedStrategy ? {
          strategyId: wizardData.selectedStrategy.id,
          strategyName: wizardData.strategyName,
          protocol: wizardData.selectedStrategy.protocol,
          apy: wizardData.selectedStrategy.apy?.current
        } : null
      }
      
      // Add failed transaction to history
      dataManager.addTransaction(failedTransactionData)
      // No balance update needed as no funds were charged
      
      updateWizardData({ 
        launchResult: { success: false, error: errorMessage },
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
        <p className="text-2xl font-bold text-blue-900">{safeCurrencyFormat(balance?.available, '$', 2)}</p>
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
                Required APY: {safeToFixed(wizardData.requiredAPY, 1)}%
              </span>
            </div>
            <p className="text-yellow-700 text-sm mt-1">
              {wizardData.requiredAPY > 30 
                ? `Your goals require a ${safeToFixed(wizardData.requiredAPY, 1)}% APY. We'll show you the best available strategies, even if they have lower returns.`
                : `Based on your goals, we're looking for strategies with at least ${safeToFixed(wizardData.requiredAPY, 1)}% APY`
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
        {/* Required APY Section at Top */}
        {wizardData.requiredAPY > 0 && (
          <Card className="bg-yellow-50 border-yellow-200">
            <CardContent className="pt-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-yellow-600" />
                <span className="font-medium text-yellow-900">
                  Required APY: {safeToFixed(wizardData.requiredAPY, 1)}%
                </span>
              </div>
              <p className="text-yellow-700 text-sm mt-1">
                {wizardData.requiredAPY > 30 
                  ? `Your goals require a ${safeToFixed(wizardData.requiredAPY, 1)}% APY. We'll show you the best available strategies, even if they have lower returns.`
                  : `Based on your goals, we're looking for strategies with at least ${safeToFixed(wizardData.requiredAPY, 1)}% APY`
                }
              </p>
            </CardContent>
          </Card>
        )}
        
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Select Strategy</h2>
          <p className="text-gray-600">
            Choose from {strategiesFound} available strategies, ranked by highest APY
          </p>
        </div>


        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {(strategies || []).map((strategy, index) => {
            // Safe strategy object validation
            if (!strategy || !strategy.id) {
              logger.warn('Invalid strategy object:', strategy)
              return null
            }
            
            return (
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
                        <h3 className="font-semibold text-lg">{strategy.name || 'Unknown Strategy'}</h3>
                        {index === 0 && (
                          <Badge className="bg-green-100 text-green-800 text-xs">
                            Highest APY
                          </Badge>
                        )}
                      </div>
                      <p className="text-gray-600 mb-2">{strategy.protocol || 'Unknown Protocol'} on {strategy.chain || 'Unknown Chain'}</p>
                      <div className="flex gap-4 text-sm">
                        <span className="font-medium text-green-600">
                          {safeToFixed(strategy.apy?.current, 1)}% APY
                        </span>
                        <span className="text-gray-500">
                          Risk: {strategy.risk || 'Unknown'}
                        </span>
                        <span className="text-gray-500">
                          Liquidity: {strategy.liquidity || 'Unknown'}
                        </span>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )
          }).filter(Boolean)}
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
                {safeToFixed(wizardData.selectedStrategy?.apy.current, 1)}%
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
            <span className="font-medium">{safeCurrencyFormat(wizardData.initialAmount, '$', 2)}</span>
          </div>
          {wizardData.hasRecurring && (
            <div className="flex justify-between">
              <span>Recurring Investment:</span>
              <span className="font-medium">
                {safeCurrencyFormat(wizardData.recurringAmount, '$', 2)} {wizardData.recurringPeriod}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Fee Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Fee Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {wizardData.feeBreakdown && wizardData.feeBreakdown.breakdown ? (
            <>
              <div className="flex justify-between">
                <span>diBoaS Fee (0.09%):</span>
                <span>{safeCurrencyFormat(wizardData.feeBreakdown.breakdown.diboas, '$', 2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Network Fee ({getNetworkFeePercentage(wizardData.feeBreakdown.chain)}):</span>
                <span>{safeCurrencyFormat(wizardData.feeBreakdown.breakdown.network, '$', 2)}</span>
              </div>
              <div className="flex justify-between">
                <span>DeFi Fee ({getDeFiFeePercentage(wizardData.feeBreakdown.chain)}):</span>
                <span>{safeCurrencyFormat(wizardData.feeBreakdown.breakdown.defi, '$', 2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-medium">
                <span>Total Fees:</span>
                <span>{safeCurrencyFormat(wizardData.feeBreakdown.total, '$', 2)}</span>
              </div>
              <div className="border-t pt-2 flex justify-between font-bold text-lg">
                <span>Total Cost:</span>
                <span>{safeCurrencyFormat(safeToNumber(wizardData.initialAmount) + safeToNumber(wizardData.feeBreakdown.total), '$', 2)}</span>
              </div>
            </>
          ) : (
            <div className="text-gray-500 text-center py-4">
              Calculating fees...
            </div>
          )}
        </CardContent>
      </Card>
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
                  Strategy Launch Failed
                </p>
                <p className="text-blue-700 text-sm mb-4">
                  Don't worry, your funds are safe. No money has been deducted from your account.
                </p>
                <p className="text-red-700 text-sm mb-6">
                  {wizardData.launchResult.error}
                </p>
                
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
                  <Button 
                    onClick={() => setCurrentStep(6)}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    Try Again
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => navigate('/category/yield')}
                  >
                    Go to Dashboard
                  </Button>
                </div>
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
                  {safeCurrencyFormat(wizardData.initialAmount, '$', 2)}
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
                  {safeToFixed(wizardData.selectedStrategy?.apy.current, 1)}%
                </p>
                <p className="text-sm text-gray-500">Expected APY</p>
              </div>
              <div>
                <p className="text-2xl font-bold text-blue-600">
                  {safeCurrencyFormat(wizardData.initialAmount, '$', 2)}
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