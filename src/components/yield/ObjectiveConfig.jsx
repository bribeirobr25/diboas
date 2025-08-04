/**
 * Objective Configuration Wizard
 * Multi-step configuration process for FinObjective strategies
 * Follows domain-driven design and agnostic architecture patterns
 */

import { useState, useCallback, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Card, CardContent } from '@/components/ui/card.jsx'
import { Button } from '@/components/ui/button.jsx'
import { Input } from '@/components/ui/input.jsx'
import { Label } from '@/components/ui/label.jsx'
import { Badge } from '@/components/ui/badge.jsx'
import { Checkbox } from '@/components/ui/checkbox.jsx'
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
  CreditCard,
  Wallet,
  CheckCircle,
  Info
} from 'lucide-react'
import PageHeader from '../shared/PageHeader.jsx'
import EnhancedTransactionProgressScreen from '../shared/EnhancedTransactionProgressScreen.jsx'
import { useWalletBalance, useTransactionFlow, useFeeCalculator } from '../../hooks/transactions/index.js'

// Strategy template configurations
const STRATEGY_TEMPLATES = {
  'emergency-funds': {
    id: 'emergency-funds',
    title: 'Emergency Funds',
    description: 'Build your safety net with low-risk, liquid investments',
    icon: '🛡️',
    defaultImage: 'https://images.unsplash.com/photo-1553729459-efe14ef6055d?w=800&h=400&fit=crop',
    suggestedAmount: 1000,
    suggestedTarget: 5000,
    riskLevel: 'Conservative',
    expectedAPY: '3-5%',
    timeline: 'up-to-6-months',
    color: 'bg-red-100 text-red-600'
  },
  'free-coffee': {
    id: 'free-coffee',
    title: 'Free Coffee',
    description: 'Generate passive income to cover your daily coffee expenses',
    icon: '☕',
    defaultImage: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=800&h=400&fit=crop',
    suggestedAmount: 100,
    suggestedTarget: 1200,
    riskLevel: 'Moderate',
    expectedAPY: '5-8%',
    timeline: '6-to-12-months',
    color: 'bg-amber-100 text-amber-600'
  },
  'home-down-payment': {
    id: 'home-down-payment',
    title: 'Home Down Payment',
    description: 'Save for your dream home with optimized growth strategies',
    icon: '🏠',
    defaultImage: 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=800&h=400&fit=crop',
    suggestedAmount: 1000,
    suggestedTarget: 50000,
    riskLevel: 'Aggressive',
    expectedAPY: '8-12%',
    timeline: 'more-than-12-months',
    color: 'bg-blue-100 text-blue-600'
  },
  'dream-vacation': {
    id: 'dream-vacation',
    title: 'Dream Vacation',
    description: 'Save for your perfect getaway with balanced liquidity pools',
    icon: '🏖️',
    defaultImage: 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&h=400&fit=crop',
    suggestedAmount: 500,
    suggestedTarget: 8000,
    riskLevel: 'Balanced',
    expectedAPY: '8-12%',
    timeline: '6-to-12-months',
    color: 'bg-cyan-100 text-cyan-600'
  },
  'new-car': {
    id: 'new-car',
    title: 'New Car',
    description: 'Drive your dream car with growth-oriented protocols',
    icon: '🚗',
    defaultImage: 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800&h=400&fit=crop',
    suggestedAmount: 1000,
    suggestedTarget: 25000,
    riskLevel: 'Balanced',
    expectedAPY: '10-15%',
    timeline: 'more-than-12-months',
    color: 'bg-indigo-100 text-indigo-600'
  },
  'education-fund': {
    id: 'education-fund',
    title: 'Education Fund',
    description: 'Invest in your future with steady growth protocols',
    icon: '🎓',
    defaultImage: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800&h=400&fit=crop',
    suggestedAmount: 500,
    suggestedTarget: 15000,
    riskLevel: 'Balanced',
    expectedAPY: '8-14%',
    timeline: 'more-than-12-months',
    color: 'bg-emerald-100 text-emerald-600'
  },
  'create-new': {
    id: 'create-new',
    title: 'Create New',
    description: 'Design your own objective with personalized parameters',
    icon: '🎯',
    defaultImage: 'https://images.unsplash.com/photo-1559136555-9303baea8ebd?w=800&h=400&fit=crop',
    suggestedAmount: 100,
    suggestedTarget: 1000,
    riskLevel: 'Moderate',
    expectedAPY: '5-8%',
    timeline: '6-to-12-months',
    color: 'bg-purple-100 text-purple-600'
  }
}

const RISK_LEVELS = {
  'Conservative': {
    label: 'Conservative',
    apy: '3-5%',
    description: 'Stable returns with minimal volatility. Focus on capital preservation.',
    color: 'bg-green-100 text-green-800',
    riskScore: 1
  },
  'Moderate': {
    label: 'Moderate',
    apy: '5-8%',
    description: 'Balanced approach with moderate risk for steady growth.',
    color: 'bg-yellow-100 text-yellow-800',
    riskScore: 2
  },
  'Balanced': {
    label: 'Balanced',
    apy: '8-15%',
    description: 'Multi-strategy approach with automated rebalancing.',
    color: 'bg-blue-100 text-blue-800',
    riskScore: 3
  },
  'Aggressive': {
    label: 'Aggressive',
    apy: '12-25%',
    description: 'High-yield farming with leveraged positions.',
    color: 'bg-orange-100 text-orange-800',
    riskScore: 4
  },
  'Very Aggressive': {
    label: 'Very Aggressive',
    apy: '10-15%',
    description: 'Maximum growth potential with significant risk.',
    color: 'bg-red-100 text-red-800',
    riskScore: 4
  }
}

const PAYMENT_METHODS = [
  { 
    id: 'diboas_wallet', 
    label: 'diBoaS Wallet', 
    icon: <Wallet className="w-4 h-4" />, 
    description: 'Use your available balance',
    processingFee: '0.05%', // 4x less than 0.2% DEX fee
    networkFee: '0.0003%' // 4x less than 0.001% Solana fee
  },
  { 
    id: 'credit_debit_card', 
    label: 'Credit/Debit Card', 
    icon: <CreditCard className="w-4 h-4" />, 
    description: 'Pay with your card',
    processingFee: '0.75%', // 4x less than typical 3% card processing
    networkFee: '0.0003%'
  },
  { 
    id: 'bank_account', 
    label: 'Bank Account', 
    icon: '🏦', 
    description: 'Direct bank transfer',
    processingFee: '0.25%', // 4x less than typical 1% bank transfer
    networkFee: '0.0003%'
  },
  { 
    id: 'apple_pay', 
    label: 'Apple Pay', 
    icon: '🍎', 
    description: 'Pay with Apple Pay',
    processingFee: '0.625%', // 4x less than typical 2.5% mobile payment
    networkFee: '0.0003%'
  },
  { 
    id: 'google_pay', 
    label: 'Google Pay', 
    icon: '🅶', 
    description: 'Pay with Google Pay',
    processingFee: '0.625%', // 4x less than typical 2.5% mobile payment
    networkFee: '0.0003%'
  },
  { 
    id: 'paypal', 
    label: 'PayPal', 
    icon: '💰', 
    description: 'Pay with PayPal',
    processingFee: '0.725%', // 4x less than typical 2.9% PayPal fee
    networkFee: '0.0003%'
  }
]

export default function ObjectiveConfig() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { balance } = useWalletBalance()
  const { calculateFees } = useFeeCalculator()
  const { 
    flowState, 
    flowData, 
    flowError, 
    executeTransactionFlow, 
    confirmTransaction, 
    resetFlow 
  } = useTransactionFlow()

  // Get objective ID from URL params
  const objectiveId = searchParams.get('objective') || 'create-new'
  const template = STRATEGY_TEMPLATES[objectiveId] || STRATEGY_TEMPLATES['create-new']

  // Configuration state
  const [currentStep, setCurrentStep] = useState(1)
  const [config, setConfig] = useState({
    objectiveId,
    templateImage: template.defaultImage,
    customImage: null,
    strategyName: template.title,
    timeline: template.timeline,
    initialAmount: template.suggestedAmount.toString(),
    recurringEnabled: false,
    recurringFrequency: 'monthly',
    recurringAmount: '0',
    riskLevel: template.riskLevel,
    paymentMethod: 'diboas_wallet',
    acceptsRisks: false,
    showAdvanced: false
  })

  const [isProcessing, setIsProcessing] = useState(false)
  const [errors, setErrors] = useState({})

  const steps = [
    { id: 1, title: 'Strategy Basics', description: 'Name your strategy and set timeline' },
    { id: 2, title: 'Investment Parameters', description: 'Set your investment amounts' },
    { id: 3, title: 'Risk & Strategy', description: 'Choose your risk level and see projections' },
    { id: 4, title: 'Review & Payment', description: 'Review details and select payment method' },
    { id: 5, title: 'Confirm & Launch', description: 'Launch your strategy' }
  ]

  const currentStepInfo = steps[currentStep - 1]
  const canProceed = validateCurrentStep()

  // Validation for current step
  function validateCurrentStep() {
    switch (currentStep) {
      case 1: {
        return config.strategyName.trim().length >= 3 && config.timeline
      }
      case 2: {
        const initialValid = parseFloat(config.initialAmount) >= 10
        const recurringValid = !config.recurringEnabled || 
          (config.recurringFrequency && parseFloat(config.recurringAmount) >= 10)
        return initialValid && recurringValid
      }
      case 3: {
        return config.riskLevel
      }
      case 4: {
        // Check if payment method is selected, risks accepted, and sufficient balance for diBoaS wallet
        const hasPaymentMethod = !!config.paymentMethod
        const hasAcceptedRisks = config.acceptsRisks
        
        if (config.paymentMethod === 'diboas_wallet') {
          const requiredAmount = parseFloat(config.initialAmount) || 0
          const totalWithFees = requiredAmount + (strategyFees.totalFees || 0)
          const availableBalance = balance?.availableForSpending || 0
          const hasSufficientBalance = availableBalance >= totalWithFees
          return hasPaymentMethod && hasAcceptedRisks && hasSufficientBalance
        }
        
        return hasPaymentMethod && hasAcceptedRisks
      }
      default:
        return true
    }
  }

  // Handle image upload
  const handleImageUpload = useCallback((event) => {
    const file = event.target.files[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (e) => {
        setConfig(prev => ({ ...prev, customImage: e.target.result }))
      }
      reader.readAsDataURL(file)
    }
  }, [])

  // Calculate simulation data
  const simulationData = useCallback(() => {
    const initial = parseFloat(config.initialAmount) || 0
    const recurring = config.recurringEnabled ? (parseFloat(config.recurringAmount) || 0) : 0
    const monthlyRecurring = config.recurringFrequency === 'weekly' ? recurring * 4 : 
                           config.recurringFrequency === 'biweekly' ? recurring * 2 : recurring
    
    const riskData = RISK_LEVELS[config.riskLevel]
    const avgAPY = parseFloat(riskData.apy.split('-')[0]) || 5
    
    // Simple compound interest calculation (monthly compounding)
    const months = config.timeline === 'up-to-6-months' ? 6 :
                  config.timeline === '6-to-12-months' ? 12 : 24
    
    let totalInvestment = initial
    let totalValue = initial
    
    for (let month = 1; month <= months; month++) {
      totalInvestment += monthlyRecurring
      totalValue = (totalValue + monthlyRecurring) * (1 + avgAPY / 100 / 12)
    }
    
    const totalYield = totalValue - totalInvestment
    const yieldPercentage = totalInvestment > 0 ? (totalYield / totalInvestment) * 100 : 0
    
    return {
      totalInvestment,
      totalYield,
      totalValue,
      yieldPercentage,
      months
    }
  }, [config])

  // Calculate strategy fees
  // State for storing calculated fees
  const [strategyFees, setStrategyFees] = useState({
    processingFee: 0,
    networkFee: 0,
    totalFees: 0,
    netAmount: 0,
    processingFeeRate: '0%',
    networkFeeRate: '0%'
  })

  // Calculate strategy fees using centralized fee calculator
  const calculateStrategyFees = useCallback(async () => {
    const amount = parseFloat(config.initialAmount) || 0
    
    if (!config.paymentMethod || amount === 0) {
      const fallback = {
        processingFee: 0,
        networkFee: 0,
        totalFees: 0,
        netAmount: amount,
        processingFeeRate: '0%',
        networkFeeRate: '0%'
      }
      setStrategyFees(fallback)
      return fallback
    }

    try {
      // Use the centralized fee calculator for consistency
      const fees = await calculateFees({
        type: 'start_strategy',
        amount,
        paymentMethod: config.paymentMethod,
        asset: 'USDC',
        chains: ['SOL']
      })
      
      const result = {
        processingFee: fees.providerFee || 0,
        networkFee: fees.networkFee || 0,
        totalFees: fees.totalFees || 0,
        netAmount: amount - (fees.totalFees || 0),
        processingFeeRate: fees.providerFeeRate || '0%',
        networkFeeRate: fees.networkFeeRate || '0%'
      }
      
      setStrategyFees(result)
      return result
    } catch (error) {
      console.warn('Fee calculation failed, using fallback:', error)
      // Fallback to payment method rates for display
      const selectedPaymentMethod = PAYMENT_METHODS.find(method => method.id === config.paymentMethod)
      const fallback = {
        processingFee: 0,
        networkFee: 0,
        totalFees: 0,
        netAmount: amount,
        processingFeeRate: selectedPaymentMethod?.processingFee || '0%',
        networkFeeRate: selectedPaymentMethod?.networkFee || '0%'
      }
      setStrategyFees(fallback)
      return fallback
    }
  }, [config.initialAmount, config.paymentMethod, calculateFees])

  // Update fees when amount or payment method changes
  useEffect(() => {
    calculateStrategyFees()
  }, [calculateStrategyFees])

  // Handle step navigation
  const handleNext = () => {
    if (canProceed && currentStep < steps.length) {
      setCurrentStep(prev => prev + 1)
      setErrors({})
    }
  }

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1)
      setErrors({})
    }
  }

  const handleBack = () => {
    navigate('/category/yield')
  }

  // Handle strategy start
  const handleStartStrategy = async () => {
    if (!canProceed) return

    setIsProcessing(true)
    
    try {
      // Prepare transaction data for strategy creation
      const transactionData = {
        type: 'start_strategy',
        amount: parseFloat(config.initialAmount),
        strategyConfig: {
          ...config,
          simulation: simulationData()
        },
        paymentMethod: config.paymentMethod,
        asset: 'USDC', // Strategies use USDC as base currency
        targetChain: 'SOL' // Default to Solana for strategies
      }

      // Execute the strategy start transaction
      await executeTransactionFlow(transactionData)
      
    } catch (error) {
      logger.error('Error starting strategy:', error)
      setErrors({ general: error.message })
    } finally {
      setIsProcessing(false)
    }
  }

  // Handle transaction confirmation
  const handleTransactionConfirm = async () => {
    try {
      await confirmTransaction()
      // Transaction success is handled by the progress screen
    } catch (error) {
      logger.error('Transaction confirmation failed:', error)
    }
  }

  // Show progress screen during transaction processing
  if (flowState === 'processing' || flowState === 'confirming' || flowState === 'completed' || flowState === 'pending' || flowState === 'pending_blockchain') {
    return (
      <EnhancedTransactionProgressScreen
        transactionData={{
          type: 'start_strategy',
          amount: config.initialAmount,
          strategyName: config.strategyName,
          riskLevel: config.riskLevel,
          paymentMethod: config.paymentMethod
        }}
        transactionId={flowData?.transactionId}
        onConfirm={handleTransactionConfirm}
        onCancel={() => resetFlow()}
        flowState={flowState}
        flowData={flowData}
        flowError={flowError}
      />
    )
  }

  const simulation = simulationData()
  const riskData = RISK_LEVELS[config.riskLevel]

  return (
    <div className="main-layout">
      <PageHeader showUserActions={true} />
      
      <div className="page-container max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Button 
            variant="ghost" 
            onClick={handleBack}
            className="p-2 hover:bg-gray-100"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Yield
          </Button>
        </div>

        {/* Progress Indicator */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900">Configure Strategy</h1>
            <Badge className="bg-blue-100 text-blue-800">
              Step {currentStep} of {steps.length}
            </Badge>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            ></div>
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              {currentStepInfo.title}
            </h2>
            <p className="text-gray-600">
              {currentStepInfo.description}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <div className="mb-8">
          <Card>
            <CardContent className="p-6">
              {/* Step 1: Strategy Basics */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  {/* Strategy Header with Preview */}
                  <div className="flex items-start gap-6">
                    <div className="flex-1 space-y-4">
                      <div>
                        <Label htmlFor="strategy-name" className="text-base font-medium">Strategy Name</Label>
                        <Input
                          id="strategy-name"
                          value={config.strategyName}
                          onChange={(e) => setConfig(prev => ({ ...prev, strategyName: e.target.value }))}
                          placeholder="Enter a name for your strategy"
                          className="text-lg mt-2"
                        />
                        <p className="text-sm text-gray-600 mt-1">
                          Choose a meaningful name that reflects your goal (minimum 3 characters)
                        </p>
                      </div>

                      <div>
                        <Label className="text-base font-medium">When do you want to use this money?</Label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                          {[
                            { id: 'up-to-6-months', label: 'Up to 6 months', subtitle: 'Short-term goal' },
                            { id: '6-to-12-months', label: '6 to 12 months', subtitle: 'Medium-term goal' },
                            { id: 'more-than-12-months', label: 'More than 12 months', subtitle: 'Long-term goal' }
                          ].map((option) => (
                            <Card 
                              key={option.id}
                              className={`cursor-pointer transition-all hover:shadow-md ${
                                config.timeline === option.id 
                                  ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() => setConfig(prev => ({ ...prev, timeline: option.id }))}
                            >
                              <CardContent className="p-4 text-center">
                                <div className="flex flex-col items-center space-y-1">
                                  <Calendar className="w-5 h-5 text-blue-600" />
                                  <span className="font-medium text-sm">{option.label}</span>
                                  <span className="text-xs text-gray-500">{option.subtitle}</span>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Strategy Preview */}
                    <div className="w-80">
                      <div className="relative">
                        <img 
                          src={config.customImage || config.templateImage}
                          alt="Strategy background"
                          className="w-full h-40 object-cover rounded-lg"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-lg flex items-end">
                          <div className="p-3 text-white">
                            <h3 className="text-lg font-bold">{config.strategyName}</h3>
                            <p className="text-white/90 text-sm">{template.description}</p>
                          </div>
                        </div>
                      </div>
                      
                      {/* Advanced Options Toggle */}
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setConfig(prev => ({ ...prev, showAdvanced: !prev.showAdvanced }))}
                        className="w-full mt-2 text-sm"
                      >
                        <Upload className="w-4 h-4 mr-2" />
                        {config.showAdvanced ? 'Hide' : 'Show'} Advanced Options
                      </Button>
                      
                      {/* Advanced Options Panel */}
                      {config.showAdvanced && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                          <Label htmlFor="image-upload" className="cursor-pointer">
                            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-500 transition-colors text-center">
                              <Upload className="w-6 h-6 mx-auto mb-1 text-gray-400" />
                              <p className="text-xs text-gray-600">Upload custom image</p>
                            </div>
                          </Label>
                          <Input
                            id="image-upload"
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Step 2: Investment Parameters */}
              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Investment Inputs */}
                    <div className="space-y-6">
                      <div>
                        <Label htmlFor="initial-amount" className="text-base font-medium">Initial Investment</Label>
                        <div className="relative mt-2">
                          <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                          <Input
                            id="initial-amount"
                            type="number"
                            min="10"
                            step="10"
                            value={config.initialAmount}
                            onChange={(e) => setConfig(prev => ({ ...prev, initialAmount: e.target.value }))}
                            className="pl-10 text-lg"
                            placeholder="10.00"
                          />
                        </div>
                        <div className="flex justify-between mt-2">
                          <p className="text-sm text-gray-600">Minimum: $10</p>
                          <div className="flex gap-2">
                            {[50, 100, 250, 500].map((amount) => (
                              <Button
                                key={amount}
                                variant="outline"
                                size="sm"
                                onClick={() => setConfig(prev => ({ ...prev, initialAmount: amount.toString() }))}
                                className="text-xs px-2 py-1 h-auto"
                              >
                                ${amount}
                              </Button>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* Recurring Investments */}
                      <div className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-4">
                          <div>
                            <Label className="text-base font-medium">Recurring Contributions</Label>
                            <p className="text-sm text-gray-600">Automatically add money to your strategy</p>
                          </div>
                          <Checkbox
                            checked={config.recurringEnabled}
                            onCheckedChange={(checked) => 
                              setConfig(prev => ({ ...prev, recurringEnabled: checked }))
                            }
                          />
                        </div>
                        
                        {config.recurringEnabled && (
                          <div className="space-y-4 pt-4 border-t">
                            <div className="grid grid-cols-2 gap-4">
                              <div>
                                <Label htmlFor="recurring-frequency" className="text-sm">Frequency</Label>
                                <select
                                  id="recurring-frequency"
                                  value={config.recurringFrequency}
                                  onChange={(e) => setConfig(prev => ({ ...prev, recurringFrequency: e.target.value }))}
                                  className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm"
                                >
                                  <option value="weekly">Weekly</option>
                                  <option value="biweekly">Bi-weekly</option>
                                  <option value="monthly">Monthly</option>
                                </select>
                              </div>
                              <div>
                                <Label htmlFor="recurring-amount" className="text-sm">Amount</Label>
                                <div className="relative mt-1">
                                  <DollarSign className="absolute left-2 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                                  <Input
                                    id="recurring-amount"
                                    type="number"
                                    min="10"
                                    value={config.recurringAmount}
                                    onChange={(e) => setConfig(prev => ({ ...prev, recurringAmount: e.target.value }))}
                                    className="pl-8 text-sm"
                                    placeholder="10.00"
                                  />
                                </div>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600">
                              Minimum recurring amount: $10
                            </p>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Live Preview */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
                      <h3 className="font-semibold text-lg mb-4 text-gray-900">Investment Preview</h3>
                      <div className="space-y-4">
                        <div className="flex justify-between items-center">
                          <span className="text-gray-700">Initial Investment:</span>
                          <span className="font-semibold text-lg">${parseFloat(config.initialAmount || 0).toFixed(2)}</span>
                        </div>
                        
                        {config.recurringEnabled && config.recurringAmount && parseFloat(config.recurringAmount) > 0 && (
                          <>
                            <div className="flex justify-between items-center">
                              <span className="text-gray-700">Per {config.recurringFrequency}:</span>
                              <span className="font-medium">${parseFloat(config.recurringAmount).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center pt-2 border-t">
                              <span className="text-gray-700">Total after 12 months:</span>
                              <span className="font-bold text-blue-600">
                                ${(
                                  parseFloat(config.initialAmount || 0) + 
                                  (parseFloat(config.recurringAmount || 0) * 
                                   (config.recurringFrequency === 'weekly' ? 52 : 
                                    config.recurringFrequency === 'biweekly' ? 26 : 12))
                                ).toFixed(2)}
                              </span>
                            </div>
                          </>
                        )}
                        
                        <div className="bg-white rounded-lg p-4 mt-4">
                          <div className="flex items-center gap-2 mb-2">
                            <Info className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-900">Smart Tip</span>
                          </div>
                          <p className="text-sm text-blue-800">
                            {config.recurringEnabled ? 
                              'Regular contributions help smooth out market volatility and can significantly boost long-term returns.' :
                              'Consider enabling recurring contributions to maximize your compound growth potential.'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Risk & Strategy Selection */}
              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Risk Level Selection */}
                    <div className="space-y-4">
                      <div>
                        <Label className="text-base font-medium">Choose your risk and yield profile</Label>
                        <p className="text-sm text-gray-600 mt-1">Higher risk strategies offer greater potential returns but with increased volatility</p>
                      </div>
                      
                      <div className="space-y-3">
                        {Object.entries(RISK_LEVELS).map(([key, risk]) => (
                          <Card 
                            key={key}
                            className={`cursor-pointer transition-all hover:shadow-md ${
                              config.riskLevel === key
                                ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() => setConfig(prev => ({ ...prev, riskLevel: key }))}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className="flex items-center space-x-3 mb-2">
                                    <Badge className={risk.color}>
                                      {risk.label}
                                    </Badge>
                                    <span className="font-semibold text-green-600 text-lg">{risk.apy}</span>
                                  </div>
                                  <p className="text-sm text-gray-600">{risk.description}</p>
                                </div>
                                <TrendingUp className="w-5 h-5 text-gray-400" />
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                      
                      {/* Integrated Risk Warning */}
                      <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="text-sm text-amber-800 mb-2">
                              <strong>Investment Risk Notice:</strong> All investments carry risk of loss. Higher yield strategies involve increased volatility.
                            </p>
                            <Button 
                              variant="link" 
                              className="text-amber-700 underline p-0 h-auto text-sm"
                              onClick={() => window.open('/learn/risk-disclosure', '_blank')}
                            >
                              View full risk disclosure →
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Live Strategy Simulation */}
                    <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg p-6">
                      <h3 className="font-semibold text-lg mb-4 text-gray-900">Strategy Projection</h3>
                      <div className="space-y-4">
                        <div className="bg-white rounded-lg p-4">
                          <div className="text-center mb-4">
                            <h4 className="font-medium text-gray-700 mb-1">Estimated Returns</h4>
                            <p className="text-xs text-gray-500">Based on {simulation.months} month timeline</p>
                          </div>
                          
                          <div className="space-y-3">
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Total Investment:</span>
                              <span className="font-medium">${simulation.totalInvestment.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Estimated Yield:</span>
                              <span className="font-medium text-green-600">${simulation.totalYield.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center">
                              <span className="text-sm text-gray-600">Yield Percentage:</span>
                              <span className="font-medium text-green-600">{simulation.yieldPercentage.toFixed(1)}%</span>
                            </div>
                            <div className="flex justify-between items-center border-t pt-3">
                              <span className="font-medium text-gray-900">Total Value:</span>
                              <span className="font-bold text-emerald-600 text-lg">${simulation.totalValue.toFixed(2)}</span>
                            </div>
                          </div>
                        </div>
                        
                        {/* Strategy Details */}
                        <div className="bg-white rounded-lg p-4">
                          <h4 className="font-medium text-gray-700 mb-3">Strategy Details</h4>
                          <div className="space-y-2 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-600">Risk Level:</span>
                              <Badge className={riskData.color} size="sm">{riskData.label}</Badge>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Expected APY:</span>
                              <span className="font-medium">{riskData.apy}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-600">Timeline:</span>
                              <span className="font-medium">{config.timeline.replace(/-/g, ' ')}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="bg-blue-100 border border-blue-200 rounded p-3">
                          <p className="text-xs text-blue-800">
                            📈 This projection is based on historical data and current market conditions. Actual results may vary.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 4: Review & Payment */}
              {currentStep === 4 && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Strategy Summary */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">Strategy Summary</h3>
                        
                        <div className="space-y-4">
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <Label className="text-sm text-gray-500">Strategy Name</Label>
                              <p className="font-medium">{config.strategyName}</p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setCurrentStep(1)}
                              className="text-blue-600 text-xs"
                            >
                              Edit
                            </Button>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <Label className="text-sm text-gray-500">Investment Details</Label>
                              <p className="font-medium">
                                ${parseFloat(config.initialAmount).toFixed(2)} initial
                                {config.recurringEnabled && 
                                  ` + $${parseFloat(config.recurringAmount).toFixed(2)} ${config.recurringFrequency}`}
                              </p>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setCurrentStep(2)}
                              className="text-blue-600 text-xs"
                            >
                              Edit
                            </Button>
                          </div>
                          
                          <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                            <div>
                              <Label className="text-sm text-gray-500">Risk & Returns</Label>
                              <div className="flex items-center gap-2">
                                <Badge className={riskData.color} size="sm">{riskData.label}</Badge>
                                <span className="text-sm font-medium">({riskData.apy})</span>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              onClick={() => setCurrentStep(3)}
                              className="text-blue-600 text-xs"
                            >
                              Edit
                            </Button>
                          </div>
                        </div>
                      </div>

                      {/* Payment Method Selection */}
                      <div>
                        <Label className="text-base font-medium">Payment Method</Label>
                        <p className="text-sm text-gray-600 mt-1 mb-3">Choose how to fund your strategy</p>
                        <div className="space-y-3">
                          {PAYMENT_METHODS.map((method) => {
                            const isSelected = config.paymentMethod === method.id
                            const totalRequired = parseFloat(config.initialAmount || 0) + (strategyFees.totalFees || 0)
                            const isInsufficientBalance = method.id === 'diboas_wallet' && 
                              (balance?.availableForSpending || 0) < totalRequired
                            
                            return (
                              <Card 
                                key={method.id}
                                className={`cursor-pointer transition-all hover:shadow-md ${
                                  isSelected
                                    ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200' 
                                    : isInsufficientBalance
                                    ? 'border-red-200 bg-red-50 opacity-60 cursor-not-allowed'
                                    : 'border-gray-200 hover:border-gray-300'
                                }`}
                                onClick={() => {
                                  if (!isInsufficientBalance) {
                                    setConfig(prev => ({ ...prev, paymentMethod: method.id }))
                                  }
                                }}
                              >
                                <CardContent className="p-4">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                      <div className="flex-shrink-0">
                                        {method.icon}
                                      </div>
                                      <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                          <p className="font-medium">{method.label}</p>
                                          {isInsufficientBalance && (
                                            <Badge variant="destructive" className="text-xs">
                                              Insufficient Balance
                                            </Badge>
                                          )}
                                        </div>
                                        <p className="text-sm text-gray-600">{method.description}</p>
                                        <div className="flex items-center gap-4 mt-1 text-xs text-gray-500">
                                          <span>Processing: {method.processingFee}</span>
                                          <span>Network: {method.networkFee}</span>
                                        </div>
                                      </div>
                                    </div>
                                    
                                    <div className="text-right">
                                      {method.id === 'diboas_wallet' && (
                                        <div className="mb-2">
                                          <p className="text-sm text-gray-600">Available</p>
                                          <p className={`font-medium ${
                                            isInsufficientBalance ? 'text-red-600' : 'text-green-600'
                                          }`}>
                                            ${balance?.availableForSpending?.toFixed(2) || '0.00'}
                                          </p>
                                        </div>
                                      )}
                                      
                                      {isSelected && (
                                        <div className="text-xs text-gray-600">
                                          <div>Fee: ${strategyFees.totalFees.toFixed(2)}</div>
                                          <div className="font-medium text-blue-600">
                                            Net: ${strategyFees.netAmount.toFixed(2)}
                                          </div>
                                        </div>
                                      )}
                                    </div>
                                  </div>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                        
                        {/* Fee Summary for Selected Method */}
                        {config.paymentMethod && (
                          <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                            <h4 className="font-medium text-sm text-gray-900 mb-2">Fee Breakdown</h4>
                            <div className="space-y-1 text-xs text-gray-600">
                              <div className="flex justify-between">
                                <span>Investment Amount:</span>
                                <span>${parseFloat(config.initialAmount || 0).toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Processing Fee ({strategyFees.processingFeeRate}):</span>
                                <span>${strategyFees.processingFee.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span>Network Fee ({strategyFees.networkFeeRate}):</span>
                                <span>${strategyFees.networkFee.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between border-t pt-1 font-medium">
                                <span>Total Fees:</span>
                                <span>${strategyFees.totalFees.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between font-medium text-blue-600">
                                <span>Net Investment:</span>
                                <span>${strategyFees.netAmount.toFixed(2)}</span>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Risk Acceptance */}
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-start space-x-3">
                          <AlertTriangle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                          <div className="space-y-3">
                            <h4 className="font-medium text-red-900">Risk Acknowledgment</h4>
                            <div className="space-y-1 text-sm text-red-800">
                              <p>• All investments carry risk of loss</p>
                              <p>• Past performance doesn&apos;t guarantee future results</p>
                              <p>• You may receive less than your initial investment</p>
                            </div>
                            
                            <div className="flex items-center space-x-2 pt-2">
                              <Checkbox
                                id="risk-acceptance"
                                checked={config.acceptsRisks}
                                onCheckedChange={(checked) => 
                                  setConfig(prev => ({ ...prev, acceptsRisks: checked }))
                                }
                              />
                              <Label htmlFor="risk-acceptance" className="text-sm text-red-900">
                                I understand and accept these investment risks
                              </Label>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Final Projection */}
                    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-lg p-6">
                      <h3 className="font-semibold text-lg mb-4 text-gray-900">Final Projection</h3>
                      <div className="bg-white rounded-lg p-4 space-y-4">
                        <div className="text-center pb-4 border-b">
                          <h4 className="font-medium text-gray-700 mb-1">&quot;{config.strategyName}&quot;</h4>
                          <p className="text-sm text-gray-500">{simulation.months} month projection</p>
                        </div>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Gross Investment:</span>
                            <span className="font-medium">${parseFloat(config.initialAmount || 0).toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Fees:</span>
                            <span className="font-medium text-red-600">-${strategyFees.totalFees.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Net Investment:</span>
                            <span className="font-medium">${strategyFees.netAmount.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Estimated Yield:</span>
                            <span className="font-medium text-green-600">${simulation.totalYield.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between border-t pt-3">
                            <span className="font-medium text-gray-900">Total Value:</span>
                            <span className="font-bold text-blue-600 text-xl">${(strategyFees.netAmount + simulation.totalYield).toFixed(2)}</span>
                          </div>
                        </div>
                        
                        <div className="bg-green-100 border border-green-200 rounded p-3">
                          <div className="flex items-center gap-2">
                            <TrendingUp className="w-4 h-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">
                              {simulation.yieldPercentage.toFixed(1)}% potential return
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="mt-4 p-3 bg-yellow-100 border border-yellow-200 rounded">
                        <p className="text-xs text-yellow-800">
                          ⚠️ Projections are estimates based on historical data. Actual results may vary significantly.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Step 5: Confirm & Launch */}
              {currentStep === 5 && (
                <div className="text-center space-y-6">
                  <div className="mx-auto w-24 h-24 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">Ready to Launch!</h3>
                    <p className="text-lg text-gray-600 mb-2">
                      Your &quot;{config.strategyName}&quot; strategy is configured and ready to start.
                    </p>
                    <p className="text-gray-500">
                      You&apos;re about to invest ${config.initialAmount} with {riskData.label.toLowerCase()} risk targeting {riskData.apy} returns.
                    </p>
                  </div>
                  
                  {/* Launch Summary */}
                  <div className="max-w-md mx-auto bg-blue-50 border border-blue-200 rounded-lg p-6">
                    <h4 className="font-medium text-blue-900 mb-3">Transaction Summary</h4>
                    <div className="space-y-2 text-sm text-blue-800">
                      <div className="flex justify-between">
                        <span>Gross Investment:</span>
                        <span className="font-medium">${config.initialAmount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Fees:</span>
                        <span className="font-medium">-${strategyFees.totalFees.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-medium">
                        <span>Net Investment:</span>
                        <span>${strategyFees.netAmount.toFixed(2)}</span>
                      </div>
                      {config.recurringEnabled && (
                        <div className="flex justify-between">
                          <span>Recurring {config.recurringFrequency}:</span>
                          <span className="font-medium">${config.recurringAmount}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span>Payment Method:</span>
                        <span className="font-medium">
                          {PAYMENT_METHODS.find(m => m.id === config.paymentMethod)?.label}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 max-w-lg mx-auto">
                    <p>
                      By clicking &quot;Launch Strategy&quot;, you authorize the investment and agree to our 
                      <Button variant="link" className="p-0 h-auto text-sm underline">
                        Terms of Service
                      </Button>
                      {' '}and{' '}
                      <Button variant="link" className="p-0 h-auto text-sm underline">
                        Investment Policy
                      </Button>.
                    </p>
                  </div>
                </div>
              )}


            </CardContent>
          </Card>
        </div>

        {/* Navigation Buttons */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentStep === 1}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          
          {/* Error Messages */}
          <div className="flex flex-col items-center gap-2">
            {errors.general && (
              <div className="text-red-600 text-sm">{errors.general}</div>
            )}
            
            {/* Insufficient Balance Warning */}
            {config.paymentMethod === 'diboas_wallet' && 
             (balance?.availableForSpending || 0) < (parseFloat(config.initialAmount || 0) + (strategyFees.totalFees || 0)) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-center">
                <p className="text-red-800 text-sm font-medium">Insufficient Balance</p>
                <p className="text-red-600 text-xs mt-1">
                  You need ${(parseFloat(config.initialAmount || 0) + (strategyFees.totalFees || 0)).toFixed(2)} (including fees) but only have ${(balance?.availableForSpending || 0).toFixed(2)} available.
                </p>
                <Button 
                  variant="link" 
                  size="sm" 
                  onClick={() => navigate('/category/banking/add')}
                  className="text-red-700 underline text-xs mt-1"
                >
                  Add Money to Wallet
                </Button>
              </div>
            )}
          </div>
          
          {currentStep < steps.length ? (
            <Button
              onClick={handleNext}
              disabled={!canProceed}
              className="min-w-[120px]"
            >
              {currentStep === 4 ? 'Review' : 'Next'}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          ) : (
            <Button
              onClick={handleStartStrategy}
              disabled={!canProceed || isProcessing}
              className="bg-green-600 hover:bg-green-700 min-w-[140px]"
            >
              {isProcessing ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Launching...
                </>
              ) : (
                <>
                  Launch Strategy
                  <TrendingUp className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}