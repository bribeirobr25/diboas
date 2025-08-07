/**
 * DeFi Strategy Matching Service
 * Matches user goals with available DeFi strategies
 * Implements the core business logic for strategy recommendations
 */

import logger from '../../utils/logger'

export class StrategyMatchingService {
  constructor() {
    this.defiStrategies = this.initializeStrategies()
  }

  /**
   * Initialize available DeFi strategies with their parameters
   */
  initializeStrategies() {
    return [
      {
        id: 'sol_staking_conservative',
        name: 'Solana Staking (Conservative)',
        chain: 'SOL',
        protocol: 'Solana Native Staking',
        apy: { min: 6.5, max: 8.2, average: 7.3 },
        riskLevel: 'conservative',
        minAmount: 50,
        maxAmount: 1000000,
        liquidityRating: 8,
        timeframe: { min: 30, max: 365 }, // days
        fees: { entry: 0.001, exit: 0.001, management: 0 }
      },
      {
        id: 'eth_lido_staking',
        name: 'Lido ETH Staking',
        chain: 'ETH',
        protocol: 'Lido Finance',
        apy: { min: 3.8, max: 5.2, average: 4.5 },
        riskLevel: 'conservative',
        minAmount: 100,
        maxAmount: 500000,
        liquidityRating: 9,
        timeframe: { min: 30, max: 730 },
        fees: { entry: 0.005, exit: 0.005, management: 0.1 }
      },
      {
        id: 'sol_jupiter_yield',
        name: 'Jupiter DeFi Yield',
        chain: 'SOL',
        protocol: 'Jupiter Exchange',
        apy: { min: 8.5, max: 15.2, average: 11.8 },
        riskLevel: 'moderate',
        minAmount: 100,
        maxAmount: 250000,
        liquidityRating: 7,
        timeframe: { min: 60, max: 365 },
        fees: { entry: 0.002, exit: 0.002, management: 0.05 }
      },
      {
        id: 'eth_uniswap_v3',
        name: 'Uniswap V3 Liquidity',
        chain: 'ETH',
        protocol: 'Uniswap V3',
        apy: { min: 12.0, max: 25.5, average: 18.7 },
        riskLevel: 'aggressive',
        minAmount: 500,
        maxAmount: 100000,
        liquidityRating: 6,
        timeframe: { min: 90, max: 365 },
        fees: { entry: 0.003, exit: 0.003, management: 0.2 }
      },
      {
        id: 'sui_cetus_amm',
        name: 'Cetus AMM Pools',
        chain: 'SUI',
        protocol: 'Cetus Protocol',
        apy: { min: 10.2, max: 22.8, average: 16.5 },
        riskLevel: 'aggressive',
        minAmount: 200,
        maxAmount: 150000,
        liquidityRating: 7,
        timeframe: { min: 60, max: 180 },
        fees: { entry: 0.0005, exit: 0.0005, management: 0.15 }
      },
      {
        id: 'sol_raydium_farms',
        name: 'Raydium Yield Farms',
        chain: 'SOL',
        protocol: 'Raydium',
        apy: { min: 15.5, max: 35.2, average: 25.3 },
        riskLevel: 'aggressive',
        minAmount: 300,
        maxAmount: 75000,
        liquidityRating: 5,
        timeframe: { min: 30, max: 180 },
        fees: { entry: 0.0025, exit: 0.0025, management: 0.3 }
      },
      {
        id: 'eth_aave_lending',
        name: 'Aave Lending Pools',
        chain: 'ETH',
        protocol: 'Aave V3',
        apy: { min: 4.2, max: 8.7, average: 6.4 },
        riskLevel: 'moderate',
        minAmount: 200,
        maxAmount: 300000,
        liquidityRating: 9,
        timeframe: { min: 30, max: 730 },
        fees: { entry: 0.002, exit: 0.002, management: 0.05 }
      },
      {
        id: 'sol_marinade_staking',
        name: 'Marinade Liquid Staking',
        chain: 'SOL',
        protocol: 'Marinade Finance',
        apy: { min: 6.8, max: 9.1, average: 7.9 },
        riskLevel: 'conservative',
        minAmount: 75,
        maxAmount: 400000,
        liquidityRating: 8,
        timeframe: { min: 30, max: 365 },
        fees: { entry: 0.001, exit: 0.001, management: 0.02 }
      }
    ]
  }

  /**
   * Calculate required APY to achieve goal
   */
  calculateRequiredAPY(initialAmount, recurringAmount, frequency, targetAmount, timeframeDays) {
    // Convert frequency to contributions per year
    const contributionsPerYear = {
      'weekly': 52,
      'bi-weekly': 26,
      'monthly': 12,
      'quarterly': 4,
      'semi-annually': 2,
      'annually': 1
    }[frequency] || 12

    const years = timeframeDays / 365
    const totalContributions = (recurringAmount || 0) * contributionsPerYear * years
    const totalInvested = initialAmount + totalContributions

    // Simple compound interest calculation
    // A = P(1 + r)^t + PMT[((1 + r)^t - 1)/r]
    // Solving for r (APY) is complex, so we'll use approximation
    
    if (totalInvested >= targetAmount) {
      return 0 // No APY needed if contributions alone meet goal
    }

    const requiredGrowth = targetAmount / totalInvested
    const requiredAPY = (Math.pow(requiredGrowth, 1/years) - 1) * 100

    return Math.max(0, requiredAPY)
  }

  /**
   * Search for strategies matching user criteria
   */
  async searchStrategies(searchCriteria) {
    const {
      initialAmount,
      recurringAmount = 0,
      frequency = 'monthly',
      targetAmount,
      targetDate,
      riskTolerance = 'moderate'
    } = searchCriteria

    try {
      // Calculate timeframe in days
      const timeframeDays = targetDate ? 
        Math.max(30, (new Date(targetDate) - new Date()) / (1000 * 60 * 60 * 24)) : 
        365

      // Calculate required APY
      const requiredAPY = this.calculateRequiredAPY(
        initialAmount,
        recurringAmount,
        frequency,
        targetAmount,
        timeframeDays
      )

      logger.debug('Strategy search criteria:', {
        initialAmount,
        recurringAmount,
        frequency,
        targetAmount,
        timeframeDays,
        requiredAPY: `${requiredAPY.toFixed(2)}%`
      })

      // Filter and score strategies
      const matchedStrategies = this.defiStrategies
        .filter(strategy => {
          // Amount range check
          if (initialAmount < strategy.minAmount || initialAmount > strategy.maxAmount) {
            return false
          }

          // Timeframe compatibility
          if (timeframeDays < strategy.timeframe.min || timeframeDays > strategy.timeframe.max) {
            return false
          }

          // Risk tolerance check
          const riskLevels = ['conservative', 'moderate', 'aggressive']
          const userRiskIndex = riskLevels.indexOf(riskTolerance)
          const strategyRiskIndex = riskLevels.indexOf(strategy.riskLevel)
          
          // Allow strategies at or below user's risk tolerance
          return strategyRiskIndex <= userRiskIndex
        })
        .map(strategy => {
          // Calculate match score
          const apyScore = this.calculateAPYScore(strategy.apy, requiredAPY)
          const riskScore = this.calculateRiskScore(strategy.riskLevel, riskTolerance)
          const liquidityScore = strategy.liquidityRating / 10
          const feeScore = 1 - (strategy.fees.entry + strategy.fees.exit + strategy.fees.management)

          const totalScore = (apyScore * 0.4) + (riskScore * 0.3) + (liquidityScore * 0.2) + (feeScore * 0.1)

          return {
            ...strategy,
            matchScore: totalScore,
            projectedReturn: this.calculateProjectedReturn(strategy, searchCriteria, timeframeDays),
            achievabilityRating: this.calculateAchievabilityRating(strategy.apy.average, requiredAPY)
          }
        })
        .sort((a, b) => b.matchScore - a.matchScore)

      return {
        strategies: matchedStrategies,
        searchMeta: {
          requiredAPY,
          timeframeDays,
          totalStrategiesFound: matchedStrategies.length,
          achievableStrategies: matchedStrategies.filter(s => s.achievabilityRating >= 0.7).length
        }
      }
    } catch (error) {
      logger.error('Error searching strategies:', error)
      throw new Error('Failed to search DeFi strategies')
    }
  }

  /**
   * Calculate APY score (how well strategy APY matches required APY)
   */
  calculateAPYScore(strategyAPY, requiredAPY) {
    if (requiredAPY <= 0) return 1 // Perfect if no APY required

    const averageAPY = strategyAPY.average
    
    if (averageAPY >= requiredAPY) {
      // Strategy can achieve goal - score based on how much extra return it provides
      const surplus = averageAPY - requiredAPY
      return Math.min(1, 0.8 + (surplus / requiredAPY) * 0.2)
    } else {
      // Strategy cannot achieve goal - score based on how close it gets
      return Math.max(0, averageAPY / requiredAPY)
    }
  }

  /**
   * Calculate risk alignment score
   */
  calculateRiskScore(strategyRisk, userRiskTolerance) {
    const riskLevels = ['conservative', 'moderate', 'aggressive']
    const strategyIndex = riskLevels.indexOf(strategyRisk)
    const userIndex = riskLevels.indexOf(userRiskTolerance)

    if (strategyIndex === userIndex) return 1
    if (strategyIndex < userIndex) return 0.8 // Conservative strategy for moderate user
    return 0.3 // More aggressive than user wants
  }

  /**
   * Calculate projected return for strategy
   */
  calculateProjectedReturn(strategy, criteria, timeframeDays) {
    const { initialAmount, recurringAmount = 0, frequency = 'monthly' } = criteria
    const contributionsPerYear = {
      'weekly': 52, 'bi-weekly': 26, 'monthly': 12,
      'quarterly': 4, 'semi-annually': 2, 'annually': 1
    }[frequency] || 12

    const years = timeframeDays / 365
    const monthlyRate = strategy.apy.average / 100 / 12

    // Calculate future value with compound interest and regular contributions
    let futureValue = initialAmount
    const monthlyContribution = (recurringAmount * contributionsPerYear) / 12

    for (let month = 1; month <= years * 12; month++) {
      futureValue = futureValue * (1 + monthlyRate) + monthlyContribution
    }

    const totalContributions = initialAmount + (recurringAmount * contributionsPerYear * years)
    const totalReturn = futureValue - totalContributions

    return {
      projectedValue: futureValue,
      totalContributions,
      totalReturn,
      returnPercentage: (totalReturn / totalContributions) * 100
    }
  }

  /**
   * Calculate achievability rating (0-1 scale)
   */
  calculateAchievabilityRating(strategyAPY, requiredAPY) {
    if (requiredAPY <= 0) return 1
    return Math.min(1, strategyAPY / requiredAPY)
  }

  /**
   * Get strategy by ID
   */
  getStrategyById(strategyId) {
    return this.defiStrategies.find(s => s.id === strategyId)
  }

  /**
   * Simulate search process with realistic timing
   */
  async simulateStrategySearch(searchCriteria, onProgress) {
    const stages = [
      { message: 'Analyzing your financial goals...', duration: 800 },
      { message: 'Calculating required returns...', duration: 600 },
      { message: 'Scanning DeFi protocols...', duration: 1000 },
      { message: 'Evaluating risk profiles...', duration: 700 },
      { message: 'Matching strategies to your criteria...', duration: 900 },
      { message: 'Ranking optimal solutions...', duration: 500 }
    ]

    for (let i = 0; i < stages.length; i++) {
      const stage = stages[i]
      onProgress?.({
        stage: i + 1,
        totalStages: stages.length,
        message: stage.message,
        percentage: ((i + 1) / stages.length) * 100
      })

      await new Promise(resolve => setTimeout(resolve, stage.duration))
    }

    // Perform actual search
    return await this.searchStrategies(searchCriteria)
  }
}

export const strategyMatchingService = new StrategyMatchingService()