/**
 * Strategy Search Engine
 * Real-time DeFi strategy matching and recommendation system
 * Matches user goals with available DeFi strategies across multiple chains
 */

import logger from '../../utils/logger'

// Mock DeFi strategies database
const DEFI_STRATEGIES = {
  sol: {
    'marinade-staking': {
      id: 'marinade-staking',
      name: 'Marinade Liquid Staking',
      protocol: 'Marinade Finance',
      chain: 'SOL',
      type: 'liquid-staking',
      apy: { min: 6.8, max: 7.2, current: 7.0 },
      risk: 'low',
      minAmount: 0.1,
      maxAmount: 1000000,
      liquidity: 'high',
      timeCommitment: 'none',
      fees: { entry: 0, exit: 0, management: 0 },
      tags: ['staking', 'liquid', 'validators']
    },
    'jupiter-perpetuals': {
      id: 'jupiter-perpetuals',
      name: 'Jupiter Perpetuals',
      protocol: 'Jupiter Exchange',
      chain: 'SOL',
      type: 'derivatives',
      apy: { min: 12.0, max: 25.0, current: 18.5 },
      risk: 'high',
      minAmount: 10,
      maxAmount: 500000,
      liquidity: 'high',
      timeCommitment: 'flexible',
      fees: { entry: 0.1, exit: 0.1, management: 0 },
      tags: ['derivatives', 'leveraged', 'trading']
    },
    'raydium-amm': {
      id: 'raydium-amm',
      name: 'Raydium Liquidity Pools',
      protocol: 'Raydium',
      chain: 'SOL',
      type: 'amm-liquidity',
      apy: { min: 8.5, max: 15.0, current: 11.2 },
      risk: 'medium',
      minAmount: 1,
      maxAmount: 100000,
      liquidity: 'high',
      timeCommitment: 'flexible',
      fees: { entry: 0, exit: 0, management: 0.25 },
      tags: ['amm', 'liquidity', 'trading-fees']
    },
    // Goal-oriented strategies with varied APYs
    'stable-income-low': {
      id: 'stable-income-low',
      name: 'Stable Income Builder',
      protocol: 'Multi-Protocol Stable',
      chain: 'SOL',
      type: 'income-strategy',
      apy: { min: 4.0, max: 6.0, current: 5.0 },
      risk: 'low',
      minAmount: 50,
      maxAmount: 100000,
      liquidity: 'high',
      timeCommitment: 'flexible',
      fees: { entry: 0, exit: 0, management: 0.25 },
      tags: ['income', 'stable', 'conservative']
    },
    'balanced-growth': {
      id: 'balanced-growth',
      name: 'Balanced Growth Strategy',
      protocol: 'DeFi Yield Optimizer',
      chain: 'SOL',
      type: 'balanced-strategy',
      apy: { min: 8.0, max: 12.0, current: 10.0 },
      risk: 'medium',
      minAmount: 100,
      maxAmount: 50000,
      liquidity: 'medium',
      timeCommitment: 'flexible',
      fees: { entry: 0, exit: 0, management: 0.5 },
      tags: ['balanced', 'growth', 'goal-based']
    },
    'aggressive-yield': {
      id: 'aggressive-yield',
      name: 'High Yield Pursuit',
      protocol: 'Advanced DeFi Strategies',
      chain: 'SOL',
      type: 'high-yield-strategy',
      apy: { min: 15.0, max: 25.0, current: 20.0 },
      risk: 'high',
      minAmount: 500,
      maxAmount: 25000,
      liquidity: 'medium',
      timeCommitment: 'flexible',
      fees: { entry: 0.1, exit: 0.1, management: 1.0 },
      tags: ['high-yield', 'aggressive', 'goal-based']
    },
    'conservative-savings': {
      id: 'conservative-savings',
      name: 'Safe Haven Savings',
      protocol: 'Institutional Grade Vault',
      chain: 'SOL',
      type: 'savings-strategy',
      apy: { min: 3.0, max: 4.5, current: 3.8 },
      risk: 'low',
      minAmount: 10,
      maxAmount: 100000,
      liquidity: 'high',
      timeCommitment: 'none',
      fees: { entry: 0, exit: 0, management: 0.2 },
      tags: ['savings', 'safe', 'liquid', 'conservative']
    }
  },
  eth: {
    'lido-staking': {
      id: 'lido-staking',
      name: 'Lido Ethereum Staking',
      protocol: 'Lido',
      chain: 'ETH',
      type: 'liquid-staking',
      apy: { min: 3.2, max: 4.1, current: 3.7 },
      risk: 'low',
      minAmount: 0.01,
      maxAmount: 10000,
      liquidity: 'high',
      timeCommitment: 'none',
      fees: { entry: 0, exit: 0, management: 10 }, // 10% of rewards
      tags: ['staking', 'liquid', 'eth2']
    },
    'aave-lending': {
      id: 'aave-lending',
      name: 'Aave V3 Lending',
      protocol: 'Aave',
      chain: 'ETH',
      type: 'lending',
      apy: { min: 2.8, max: 8.5, current: 4.2 },
      risk: 'low',
      minAmount: 1,
      maxAmount: 1000000,
      liquidity: 'high',
      timeCommitment: 'none',
      fees: { entry: 0, exit: 0, management: 0 },
      tags: ['lending', 'borrowing', 'stable']
    },
    'uniswap-v3': {
      id: 'uniswap-v3',
      name: 'Uniswap V3 Concentrated Liquidity',
      protocol: 'Uniswap',
      chain: 'ETH',
      type: 'amm-liquidity',
      apy: { min: 5.0, max: 30.0, current: 12.8 },
      risk: 'high',
      minAmount: 10,
      maxAmount: 500000,
      liquidity: 'high',
      timeCommitment: 'flexible',
      fees: { entry: 0, exit: 0, management: 0 },
      tags: ['amm', 'concentrated', 'liquidity']
    },
    'compound-stable': {
      id: 'compound-stable',
      name: 'Compound Stable Lending',
      protocol: 'Compound Finance',
      chain: 'ETH',
      type: 'lending',
      apy: { min: 2.5, max: 5.0, current: 3.5 },
      risk: 'low',
      minAmount: 50,
      maxAmount: 1000000,
      liquidity: 'high',
      timeCommitment: 'none',
      fees: { entry: 0, exit: 0, management: 0 },
      tags: ['lending', 'stable', 'conservative']
    },
    'convex-curve': {
      id: 'convex-curve',
      name: 'Convex Boosted Yields',
      protocol: 'Convex Finance',
      chain: 'ETH',
      type: 'yield-aggregator',
      apy: { min: 8.0, max: 15.0, current: 11.0 },
      risk: 'medium',
      minAmount: 100,
      maxAmount: 500000,
      liquidity: 'medium',
      timeCommitment: 'flexible',
      fees: { entry: 0, exit: 0, management: 0.5 },
      tags: ['yield', 'aggregator', 'curve']
    }
  },
  sui: {
    'cetus-amm': {
      id: 'cetus-amm',
      name: 'Cetus Concentrated Liquidity',
      protocol: 'Cetus',
      chain: 'SUI',
      type: 'amm-liquidity',
      apy: { min: 8.0, max: 20.0, current: 14.2 },
      risk: 'medium',
      minAmount: 1,  
      maxAmount: 50000,
      liquidity: 'medium',
      timeCommitment: 'flexible',
      fees: { entry: 0, exit: 0, management: 0 },
      tags: ['amm', 'concentrated', 'sui-native']
    },
    'sui-staking': {
      id: 'sui-staking',
      name: 'Sui Validator Staking',
      protocol: 'Sui Network',
      chain: 'SUI',
      type: 'staking',
      apy: { min: 2.5, max: 4.0, current: 3.2 },
      risk: 'low',
      minAmount: 1,
      maxAmount: 1000000,
      liquidity: 'medium',
      timeCommitment: 'epochs',
      fees: { entry: 0, exit: 0, management: 0 },
      tags: ['staking', 'validators', 'sui-native']
    },
    'turbos-yield': {
      id: 'turbos-yield',
      name: 'Turbos Yield Farming',
      protocol: 'Turbos Finance',
      chain: 'SUI',
      type: 'yield-farming',
      apy: { min: 10.0, max: 18.0, current: 14.0 },
      risk: 'medium',
      minAmount: 50,
      maxAmount: 100000,
      liquidity: 'medium',
      timeCommitment: 'flexible',
      fees: { entry: 0, exit: 0, management: 0.3 },
      tags: ['yield', 'farming', 'sui-defi']
    },
    'scallop-lending': {
      id: 'scallop-lending',
      name: 'Scallop Money Market',
      protocol: 'Scallop',
      chain: 'SUI',
      type: 'lending',
      apy: { min: 4.0, max: 8.0, current: 6.0 },
      risk: 'low',
      minAmount: 20,
      maxAmount: 500000,
      liquidity: 'high',
      timeCommitment: 'none',
      fees: { entry: 0, exit: 0, management: 0 },
      tags: ['lending', 'money-market', 'sui-native']
    }
  }
}

export class StrategySearchEngine {
  constructor() {
    this.strategies = DEFI_STRATEGIES
    this.searchCache = new Map()
    this.CACHE_DURATION = 300000 // 5 minutes
  }

  /**
   * Calculate required APY to achieve user's goal
   * @param {Object} goalConfig - User's investment goal configuration
   * @returns {number} Required APY percentage
   */
  calculateRequiredAPY(goalConfig) {
    const { 
      initialAmount = 0, 
      recurringAmount = 0, 
      recurringPeriod = 'monthly',
      targetAmount = 0, 
      targetDate = null,
      targetPeriodAmount = 0,
      targetPeriod = null 
    } = goalConfig

    try {
      // Convert recurring period to annual multiplier
      const recurringMultipliers = {
        weekly: 52,
        biweekly: 26, 
        monthly: 12,
        quarterly: 4,
        biannually: 2,
        annually: 1
      }

      const annualContribution = recurringAmount * (recurringMultipliers[recurringPeriod] || 12)

      // Goal-based APY calculation
      if (targetAmount && targetDate) {
        const yearsToTarget = this.calculateYearsToDate(targetDate)
        if (yearsToTarget <= 0) return 8 // Default if invalid date

        // Calculate total contributions over time
        const totalContributions = initialAmount + (annualContribution * yearsToTarget)
        
        // Avoid division by zero or unrealistic goals
        if (totalContributions <= 0 || targetAmount <= totalContributions) {
          return 8 // Default APY for conservative goals
        }

        // Calculate required compound growth rate
        const requiredGrowth = targetAmount / totalContributions
        const requiredAPY = (Math.pow(requiredGrowth, 1/yearsToTarget) - 1) * 100
        
        // Cap at realistic DeFi levels (max 50% APY)
        return Math.max(5, Math.min(50, requiredAPY))
      }

      // Periodic income goal calculation  
      if (targetPeriodAmount && targetPeriod) {
        const periodicMultipliers = {
          daily: 365,
          monthly: 12,
          yearly: 1
        }

        const annualTargetIncome = targetPeriodAmount * (periodicMultipliers[targetPeriod] || 12)
        const totalInvestment = Math.max(initialAmount, 1000) // Minimum investment assumption
        
        const requiredAPY = (annualTargetIncome / totalInvestment) * 100
        
        // Cap at realistic DeFi levels (max 30% for income strategies)
        return Math.max(5, Math.min(30, requiredAPY))
      }

      return 8 // Default 8% APY if no specific goal
    } catch (error) {
      logger.error('Error calculating required APY:', error)
      return 8 // Safe default
    }
  }

  /**
   * Calculate years between now and target date
   */
  calculateYearsToDate(targetDate) {
    const now = new Date()
    const target = new Date(targetDate)
    const diffTime = target.getTime() - now.getTime()
    const diffYears = diffTime / (1000 * 60 * 60 * 24 * 365.25)
    return Math.max(0, diffYears)
  }

  /**
   * Search for strategies - simplified to just sort by highest APY
   * @param {Object} searchConfig - User's search configuration
   * @returns {Promise<Object>} Search results with strategies sorted by APY
   */
  async searchStrategies(searchConfig) {
    const {
      goalConfig,
      preferredChains = ['SOL', 'ETH', 'SUI']
    } = searchConfig

    logger.info('🔍 StrategySearchEngine.searchStrategies called with:', { goalConfig, preferredChains })

    try {
      // Get all strategies from preferred chains
      const allStrategies = this.getAllStrategiesFromChains(preferredChains)
      logger.info('📊 Found strategies from chains:', { count: allStrategies.length, strategies: allStrategies.map(s => ({ id: s.id, name: s.name, apy: s.apy.current })) })
      
      // Simple approach: Sort by highest APY first
      const sortedStrategies = allStrategies
        .map(strategy => ({
          ...strategy,
          score: strategy.apy.current / 100 // Simple score based on APY percentage
        }))
        .sort((a, b) => b.apy.current - a.apy.current) // Sort by highest APY first
        
      // Return all strategies sorted by highest APY
      const results = {
        requiredAPY: this.calculateRequiredAPY(goalConfig), // Still calculate for display
        strategiesFound: sortedStrategies.length,
        strategies: sortedStrategies,
        searchMetadata: {
          timestamp: new Date().toISOString(),
          searchDuration: 500, // Fast search
          chainsSearched: preferredChains
        }
      }
      
      logger.info('✅ Search completed:', { 
        strategiesFound: results.strategiesFound, 
        requiredAPY: results.requiredAPY,
        topStrategy: results.strategies[0]?.name
      })
      
      return results
    } catch (error) {
      logger.error('Strategy search failed:', error)
      // Return empty results instead of throwing
      return {
        requiredAPY: 0,
        strategiesFound: 0,
        strategies: [],
        searchMetadata: {
          timestamp: new Date().toISOString(),
          searchDuration: 0,
          chainsSearched: preferredChains,
          error: error.message
        }
      }
    }
  }

  /**
   * Get all strategies from specified chains
   */
  getAllStrategiesFromChains(chains) {
    const strategies = []
    
    chains.forEach(chain => {
      const chainKey = chain.toLowerCase()
      if (this.strategies[chainKey]) {
        Object.values(this.strategies[chainKey]).forEach(strategy => {
          strategies.push(strategy)
        })
      }
    })

    return strategies
  }

  /**
   * Calculate strategy score based on user requirements
   */
  calculateStrategyScore(strategy, requirements) {
    const { requiredAPY, riskTolerance, minLiquidity, maxTimeCommitment, goalConfig } = requirements
    let score = 0
    
    // APY matching (40% of score)
    const apyScore = this.calculateAPYScore(strategy.apy.current, requiredAPY)
    score += apyScore * 0.4

    // Risk tolerance matching (25% of score)
    const riskScore = this.calculateRiskScore(strategy.risk, riskTolerance)
    score += riskScore * 0.25

    // Liquidity matching (15% of score)
    const liquidityScore = this.calculateLiquidityScore(strategy.liquidity, minLiquidity)
    score += liquidityScore * 0.15

    // Time commitment matching (10% of score)
    const timeScore = this.calculateTimeScore(strategy.timeCommitment, maxTimeCommitment)
    score += timeScore * 0.1

    // Investment amount feasibility (10% of score)
    const amountScore = this.calculateAmountScore(strategy, goalConfig)
    score += amountScore * 0.1

    return Math.round(score * 100) / 100 // Round to 2 decimal places
  }

  calculateAPYScore(strategyAPY, requiredAPY) {
    if (strategyAPY >= requiredAPY) {
      // Bonus for exceeding requirements, but diminishing returns
      const excess = strategyAPY - requiredAPY
      return Math.min(1.0, 0.8 + (excess / requiredAPY) * 0.2)
    } else {
      // More forgiving penalty for not meeting requirements
      // Even strategies with much lower APY get some score
      const ratio = strategyAPY / requiredAPY
      
      // Use a curved scoring that's more forgiving
      if (ratio >= 0.8) return 0.7 + (ratio - 0.8) * 1.5  // 80%+ of required: good score
      if (ratio >= 0.5) return 0.4 + (ratio - 0.5) * 0.6  // 50-80% of required: decent score
      if (ratio >= 0.2) return 0.2 + (ratio - 0.2) * 0.25 // 20-50% of required: low but positive
      return 0.1 + ratio * 0.5 // Below 20%: minimal but still positive score
    }
  }

  calculateRiskScore(strategyRisk, userRiskTolerance) {
    const riskMapping = { low: 1, medium: 2, high: 3 }
    const strategyRiskLevel = riskMapping[strategyRisk] || 2
    const userRiskLevel = riskMapping[userRiskTolerance] || 2

    if (strategyRiskLevel === userRiskLevel) return 1.0
    if (Math.abs(strategyRiskLevel - userRiskLevel) === 1) return 0.7
    return 0.3 // Too different
  }

  calculateLiquidityScore(strategyLiquidity, minLiquidity) {
    const liquidityMapping = { low: 1, medium: 2, high: 3 }
    const strategyLiquidityLevel = liquidityMapping[strategyLiquidity] || 2
    const minLiquidityLevel = liquidityMapping[minLiquidity] || 2

    return strategyLiquidityLevel >= minLiquidityLevel ? 1.0 : 0.5
  }

  calculateTimeScore(strategyTime, maxTime) {
    const timeMapping = { 
      none: 0, 
      flexible: 1, 
      epochs: 2, 
      weeks: 3, 
      months: 4, 
      years: 5 
    }
    
    const strategyTimeLevel = timeMapping[strategyTime] || 1
    const maxTimeLevel = timeMapping[maxTime] || 1

    return strategyTimeLevel <= maxTimeLevel ? 1.0 : 0.3
  }

  calculateAmountScore(strategy, goalConfig) {
    const totalAmount = (goalConfig.initialAmount || 0) + (goalConfig.recurringAmount || 0) * 12
    
    if (totalAmount >= strategy.minAmount && totalAmount <= strategy.maxAmount) {
      return 1.0
    }
    
    if (totalAmount < strategy.minAmount) {
      return Math.max(0, 1 - (strategy.minAmount - totalAmount) / strategy.minAmount)
    }
    
    // Amount exceeds maximum - partial score
    return 0.7
  }

  /**
   * Get matched criteria for display
   */
  getMatchedCriteria(topStrategy, requiredAPY) {
    if (!topStrategy) return []

    const criteria = []
    
    if (topStrategy.apy.current >= requiredAPY) {
      criteria.push(`APY Target Met (${topStrategy.apy.current}% ≥ ${requiredAPY.toFixed(1)}%)`)
    }
    
    criteria.push(`Risk Level: ${topStrategy.risk}`)
    criteria.push(`Chain: ${topStrategy.chain}`)
    criteria.push(`Liquidity: ${topStrategy.liquidity}`)
    
    return criteria
  }


  /**
   * Cache management
   */
  getFromCache(key) {
    const cached = this.searchCache.get(key)
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data
    }
    return null
  }

  setInCache(key, data) {
    this.searchCache.set(key, {
      data,
      timestamp: Date.now()
    })

    // Clean old cache entries
    if (this.searchCache.size > 100) {
      const oldestKey = this.searchCache.keys().next().value
      this.searchCache.delete(oldestKey)
    }
  }

  /**
   * Get strategy details by ID
   */
  getStrategyById(strategyId) {
    for (const chain of Object.values(this.strategies)) {
      if (chain[strategyId]) {
        return chain[strategyId]
      }
    }
    return null
  }

  /**
   * Get real-time APY updates (mock implementation)
   */
  async updateStrategyAPYs() {
    // In real implementation, this would fetch from DeFi protocols
    Object.values(this.strategies).forEach(chain => {
      Object.values(chain).forEach(strategy => {
        // Add small random fluctuations to APY
        const fluctuation = (Math.random() - 0.5) * 0.4 // ±0.2%
        strategy.apy.current = Math.max(
          strategy.apy.min,
          Math.min(strategy.apy.max, strategy.apy.current + fluctuation)
        )
      })
    })
    
    logger.info('Strategy APYs updated')
  }
}

export default new StrategySearchEngine()