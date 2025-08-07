/**
 * Strategy Configuration Service
 * Manages the 8-step strategy configuration flow
 * Handles state persistence and validation
 */

import logger from '../../utils/logger'

export class StrategyConfigurationService {
  constructor() {
    this.currentConfig = null
    this.configurationSteps = [
      'name-image',      // Step 1: Name & Image
      'investment',      // Step 2: Investment amounts
      'goals',          // Step 3: Target goals
      'search',         // Step 4: Strategy search
      'selection',      // Step 5: Strategy selection
      'review',         // Step 6: Review & confirmation
      'launch',         // Step 7: Launch strategy
      'management'      // Step 8: Strategy management
    ]
  }

  /**
   * Initialize new strategy configuration
   */
  initializeConfiguration(templateId = null) {
    this.currentConfig = {
      id: this.generateConfigId(),
      templateId,
      step: 1,
      createdAt: new Date().toISOString(),
      
      // Step 1: Name & Image
      name: '',
      description: '',
      icon: '🎯',
      customImage: null,
      
      // Step 2: Investment
      initialAmount: 0,
      recurringAmount: 0,
      recurringFrequency: 'monthly', // weekly, bi-weekly, monthly, quarterly, semi-annually, annually
      
      // Step 3: Goals
      goalType: 'amount', // 'amount', 'income'
      targetAmount: 0,
      targetDate: null,
      targetIncome: {
        amount: 0,
        period: 'monthly' // daily, weekly, monthly, yearly
      },
      
      // Step 4: Search Results
      searchCriteria: null,
      searchResults: null,
      
      // Step 5: Strategy Selection
      selectedStrategy: null,
      customizations: {},
      
      // Step 6: Review
      feeCalculation: null,
      finalConfiguration: null,
      
      // Step 7: Launch
      transactionId: null,
      deploymentStatus: 'pending', // pending, deploying, active, failed
      
      // Step 8: Management
      strategyId: null,
      isActive: false
    }

    logger.debug('Initialized strategy configuration:', { 
      id: this.currentConfig.id, 
      templateId 
    })

    return this.currentConfig
  }

  /**
   * Load template configuration
   */
  loadTemplate(templateId) {
    const templates = {
      'emergency-funds': {
        name: 'Emergency Fund',
        description: 'Build your safety net with low-risk investments',
        icon: '🛡️',
        targetAmount: 5000,
        initialAmount: 500,
        recurringAmount: 200,
        recurringFrequency: 'monthly',
        goalType: 'amount',
        riskTolerance: 'conservative'
      },
      'free-coffee': {
        name: 'Free Coffee',
        description: 'Generate daily coffee money',
        icon: '☕',
        targetIncome: { amount: 5, period: 'daily' },
        initialAmount: 300,
        recurringAmount: 50,
        recurringFrequency: 'weekly',
        goalType: 'income',
        riskTolerance: 'moderate'
      },
      'home-down-payment': {
        name: 'Home Down Payment',
        description: 'Save for your dream home',
        icon: '🏠',
        targetAmount: 50000,
        initialAmount: 2000,
        recurringAmount: 800,
        recurringFrequency: 'monthly',
        goalType: 'amount',
        riskTolerance: 'aggressive'
      },
      'dream-vacation': {
        name: 'Dream Vacation',
        description: 'Save for your perfect getaway',
        icon: '🏖️',
        targetAmount: 8000,
        initialAmount: 500,
        recurringAmount: 300,
        recurringFrequency: 'monthly',
        goalType: 'amount',
        riskTolerance: 'moderate'
      },
      'new-car': {
        name: 'New Car',
        description: 'Drive your dream car',
        icon: '🚗',
        targetAmount: 25000,
        initialAmount: 1500,
        recurringAmount: 600,
        recurringFrequency: 'monthly',
        goalType: 'amount',
        riskTolerance: 'balanced'
      },
      'education-fund': {
        name: 'Education Fund',
        description: 'Invest in your future',
        icon: '🎓',
        targetAmount: 15000,
        initialAmount: 800,
        recurringAmount: 400,
        recurringFrequency: 'monthly',
        goalType: 'amount',
        riskTolerance: 'moderate'
      }
    }

    const template = templates[templateId]
    if (!template) {
      throw new Error(`Template ${templateId} not found`)
    }

    // Merge template into current config
    if (this.currentConfig) {
      Object.assign(this.currentConfig, template)
    }

    return template
  }

  /**
   * Update configuration step
   */
  updateStep(stepNumber, stepData) {
    if (!this.currentConfig) {
      throw new Error('No configuration initialized')
    }

    if (stepNumber < 1 || stepNumber > 8) {
      throw new Error(`Invalid step number: ${stepNumber}`)
    }

    // Validate step data based on step
    this.validateStepData(stepNumber, stepData)

    // Update configuration
    Object.assign(this.currentConfig, stepData)
    this.currentConfig.step = stepNumber
    this.currentConfig.updatedAt = new Date().toISOString()

    logger.debug(`Updated configuration step ${stepNumber}:`, stepData)

    return this.currentConfig
  }

  /**
   * Validate step data
   */
  validateStepData(stepNumber, stepData) {
    switch (stepNumber) {
      case 1: // Name & Image
        if (!stepData.name || stepData.name.trim().length < 3) {
          throw new Error('Strategy name must be at least 3 characters')
        }
        break

      case 2: // Investment
        if (!stepData.initialAmount || stepData.initialAmount < 50) {
          throw new Error('Initial amount must be at least $50')
        }
        if (stepData.recurringAmount && stepData.recurringAmount < 0) {
          throw new Error('Recurring amount cannot be negative')
        }
        break

      case 3: // Goals
        if (stepData.goalType === 'amount') {
          if (!stepData.targetAmount || stepData.targetAmount <= stepData.initialAmount) {
            throw new Error('Target amount must be greater than initial amount')
          }
        } else if (stepData.goalType === 'income') {
          if (!stepData.targetIncome?.amount || stepData.targetIncome.amount <= 0) {
            throw new Error('Target income must be greater than 0')
          }
        }
        break

      case 5: // Strategy Selection
        if (!stepData.selectedStrategy) {
          throw new Error('No strategy selected')
        }
        break

      case 6: // Review
        if (!stepData.finalConfiguration) {
          throw new Error('Final configuration missing')
        }
        break
    }
  }

  /**
   * Convert income goal to amount goal for calculations
   */
  convertIncomeToAmount(targetIncome, timeframeDays = 365) {
    const { amount, period } = targetIncome
    const periodsPerYear = {
      'daily': 365,
      'weekly': 52,
      'monthly': 12,
      'yearly': 1
    }[period] || 12

    const yearsInTimeframe = timeframeDays / 365
    const requiredAnnualIncome = amount * periodsPerYear
    const totalTargetAmount = requiredAnnualIncome * yearsInTimeframe

    // Calculate principal needed to generate this income at average market APY
    const averageAPY = 0.08 // 8% average
    const principalNeeded = requiredAnnualIncome / averageAPY

    return Math.max(totalTargetAmount, principalNeeded)
  }

  /**
   * Prepare search criteria from configuration
   */
  prepareSearchCriteria() {
    if (!this.currentConfig) {
      throw new Error('No configuration available')
    }

    const config = this.currentConfig
    let targetAmount = config.targetAmount

    // Convert income goal to amount if needed
    if (config.goalType === 'income') {
      const timeframeDays = config.targetDate ? 
        (new Date(config.targetDate) - new Date()) / (1000 * 60 * 60 * 24) : 
        365
      targetAmount = this.convertIncomeToAmount(config.targetIncome, timeframeDays)
    }

    return {
      initialAmount: config.initialAmount,
      recurringAmount: config.recurringAmount,
      frequency: config.recurringFrequency,
      targetAmount,
      targetDate: config.targetDate,
      riskTolerance: config.riskTolerance || 'moderate'
    }
  }

  /**
   * Get current configuration
   */
  getCurrentConfiguration() {
    return this.currentConfig
  }

  /**
   * Get configuration for specific step
   */
  getStepConfiguration(stepNumber) {
    if (!this.currentConfig) return null

    const stepMappings = {
      1: ['name', 'description', 'icon', 'customImage'],
      2: ['initialAmount', 'recurringAmount', 'recurringFrequency'],
      3: ['goalType', 'targetAmount', 'targetDate', 'targetIncome'],
      4: ['searchCriteria', 'searchResults'],
      5: ['selectedStrategy', 'customizations'],
      6: ['feeCalculation', 'finalConfiguration'],
      7: ['transactionId', 'deploymentStatus'],
      8: ['strategyId', 'isActive']
    }

    const fields = stepMappings[stepNumber] || []
    const stepConfig = {}

    fields.forEach(field => {
      if (this.currentConfig[field] !== undefined) {
        stepConfig[field] = this.currentConfig[field]
      }
    })

    return stepConfig
  }

  /**
   * Check if step is complete
   */
  isStepComplete(stepNumber) {
    if (!this.currentConfig) return false

    switch (stepNumber) {
      case 1:
        return !!(this.currentConfig.name && this.currentConfig.name.length >= 3)
      case 2:
        return !!(this.currentConfig.initialAmount >= 50)
      case 3:
        if (this.currentConfig.goalType === 'amount') {
          return !!(this.currentConfig.targetAmount > this.currentConfig.initialAmount)
        } else {
          return !!(this.currentConfig.targetIncome?.amount > 0)
        }
      case 4:
        return !!(this.currentConfig.searchResults?.strategies?.length > 0)
      case 5:
        return !!(this.currentConfig.selectedStrategy)
      case 6:
        return !!(this.currentConfig.finalConfiguration)
      case 7:
        return this.currentConfig.deploymentStatus === 'active'
      case 8:
        return this.currentConfig.isActive
      default:
        return false
    }
  }

  /**
   * Clear current configuration
   */
  clearConfiguration() {
    this.currentConfig = null
    logger.debug('Configuration cleared')
  }

  /**
   * Generate unique configuration ID
   */
  generateConfigId() {
    return `config_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * Save configuration to localStorage for persistence
   */
  saveToStorage() {
    if (this.currentConfig) {
      localStorage.setItem('strategy_config', JSON.stringify(this.currentConfig))
    }
  }

  /**
   * Load configuration from localStorage
   */
  loadFromStorage() {
    const saved = localStorage.getItem('strategy_config')
    if (saved) {
      try {
        this.currentConfig = JSON.parse(saved)
        return this.currentConfig
      } catch (error) {
        logger.error('Error loading configuration from storage:', error)
        localStorage.removeItem('strategy_config')
      }
    }
    return null
  }

  /**
   * Clear saved configuration from storage
   */
  clearStorage() {
    localStorage.removeItem('strategy_config')
  }
}

export const strategyConfigurationService = new StrategyConfigurationService()