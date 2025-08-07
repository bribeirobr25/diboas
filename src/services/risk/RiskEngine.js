/**
 * Risk Engine Service
 * Provides dynamic risk assessment, portfolio rebalancing, and risk management
 */

import logger from '../../utils/logger'
import secureLogger from '../../utils/secureLogger.js'
import protocolService from '../defi/ProtocolService.js'

export const RISK_LEVELS = {
  VERY_LOW: 'Very Low',
  LOW: 'Low', 
  MODERATE: 'Moderate',
  HIGH: 'High',
  VERY_HIGH: 'Very High'
}

export const RISK_TOLERANCE = {
  CONSERVATIVE: 'Conservative',
  MODERATE: 'Moderate',
  BALANCED: 'Balanced',
  AGGRESSIVE: 'Aggressive',
  VERY_AGGRESSIVE: 'Very Aggressive'
}

class RiskEngine {
  constructor() {
    this.riskMetrics = new Map()
    this.portfolioCache = new Map()
    this.cacheTimeout = 10 * 60 * 1000 // 10 minutes
    this.rebalanceThreshold = 0.05 // 5% deviation triggers rebalance
    
    this.initializeRiskMatrix()
  }

  /**
   * Initialize risk assessment matrix
   */
  initializeRiskMatrix() {
    this.riskMatrix = {
      [RISK_TOLERANCE.CONSERVATIVE]: {
        maxVolatility: 5,
        maxDrawdown: 10,
        diversificationWeight: 0.4,
        liquidityWeight: 0.3,
        returnWeight: 0.3,
        maxSingleAssetWeight: 0.15,
        preferredAssets: ['USDC', 'USDT', 'DAI'],
        protocolRiskLimit: 2,
        targetAPY: 4
      },
      [RISK_TOLERANCE.MODERATE]: {
        maxVolatility: 10,
        maxDrawdown: 20,
        diversificationWeight: 0.35,
        liquidityWeight: 0.25,
        returnWeight: 0.4,
        maxSingleAssetWeight: 0.25,
        preferredAssets: ['USDC', 'USDT', 'DAI', 'ETH'],
        protocolRiskLimit: 3,
        targetAPY: 7
      },
      [RISK_TOLERANCE.BALANCED]: {
        maxVolatility: 15,
        maxDrawdown: 30,
        diversificationWeight: 0.3,
        liquidityWeight: 0.2,
        returnWeight: 0.5,
        maxSingleAssetWeight: 0.35,
        preferredAssets: ['USDC', 'USDT', 'DAI', 'ETH', 'WBTC'],
        protocolRiskLimit: 4,
        targetAPY: 10
      },
      [RISK_TOLERANCE.AGGRESSIVE]: {
        maxVolatility: 25,
        maxDrawdown: 50,
        diversificationWeight: 0.25,
        liquidityWeight: 0.15,
        returnWeight: 0.6,
        maxSingleAssetWeight: 0.5,
        preferredAssets: ['ETH', 'WBTC', 'USDC', 'USDT'],
        protocolRiskLimit: 5,
        targetAPY: 15
      },
      [RISK_TOLERANCE.VERY_AGGRESSIVE]: {
        maxVolatility: 40,
        maxDrawdown: 70,
        diversificationWeight: 0.2,
        liquidityWeight: 0.1,
        returnWeight: 0.7,
        maxSingleAssetWeight: 0.7,
        preferredAssets: ['ETH', 'WBTC'],
        protocolRiskLimit: 5,
        targetAPY: 25
      }
    }

    logger.info(`Risk matrix initialized with ${Object.keys(this.riskMatrix).length} tolerance levels`)
  }

  /**
   * Assess overall portfolio risk
   */
  async assessPortfolioRisk(portfolio, userRiskTolerance) {
    try {
      const cacheKey = `portfolio-risk-${JSON.stringify(portfolio)}-${userRiskTolerance}`
      
      // Check cache
      if (this.portfolioCache.has(cacheKey)) {
        const cached = this.portfolioCache.get(cacheKey)
        if (Date.now() - cached.timestamp < this.cacheTimeout) {
          return cached.data
        }
      }

      const riskProfile = this.riskMatrix[userRiskTolerance]
      if (!riskProfile) {
        throw new Error(`Invalid risk tolerance: ${userRiskTolerance}`)
      }

      // Calculate individual risk metrics
      const concentrationRisk = this.calculateConcentrationRisk(portfolio)
      const volatilityRisk = await this.calculateVolatilityRisk(portfolio)
      const liquidityRisk = this.calculateLiquidityRisk(portfolio)
      const protocolRisk = await this.calculateProtocolRisk(portfolio)
      const correlationRisk = this.calculateCorrelationRisk(portfolio)

      // Calculate weighted risk score
      const overallRisk = this.calculateOverallRisk({
        concentrationRisk,
        volatilityRisk,
        liquidityRisk,
        protocolRisk,
        correlationRisk
      }, riskProfile)

      // Generate risk recommendations
      const recommendations = this.generateRiskRecommendations(overallRisk, riskProfile, portfolio)

      const assessment = {
        overallRiskScore: parseFloat(overallRisk.score.toFixed(2)),
        riskLevel: overallRisk.level,
        riskMetrics: {
          concentrationRisk: parseFloat(concentrationRisk.toFixed(2)),
          volatilityRisk: parseFloat(volatilityRisk.toFixed(2)),
          liquidityRisk: parseFloat(liquidityRisk.toFixed(2)),
          protocolRisk: parseFloat(protocolRisk.toFixed(2)),
          correlationRisk: parseFloat(correlationRisk.toFixed(2))
        },
        recommendations,
        isWithinTolerance: overallRisk.score <= this.getRiskToleranceScore(userRiskTolerance),
        lastAssessed: new Date().toISOString()
      }

      // Cache results
      this.portfolioCache.set(cacheKey, {
        data: assessment,
        timestamp: Date.now()
      })

      secureLogger.audit('PORTFOLIO_RISK_ASSESSED', {
        portfolioValue: portfolio.totalValue,
        riskScore: assessment.overallRiskScore,
        riskLevel: assessment.riskLevel
      })

      return assessment
    } catch (error) {
      logger.error('Portfolio risk assessment failed:', error)
      throw error
    }
  }

  /**
   * Calculate concentration risk (single asset/protocol concentration)
   */
  calculateConcentrationRisk(portfolio) {
    if (!portfolio.positions || portfolio.positions.length === 0) {
      return 0
    }

    const totalValue = portfolio.totalValue
    let maxSingleAssetWeight = 0
    let maxProtocolWeight = 0

    // Asset concentration
    const assetWeights = {}
    const protocolWeights = {}

    portfolio.positions.forEach(position => {
      const weight = position.value / totalValue

      // Track asset weights
      if (!assetWeights[position.asset]) {
        assetWeights[position.asset] = 0
      }
      assetWeights[position.asset] += weight

      // Track protocol weights  
      if (!protocolWeights[position.protocol]) {
        protocolWeights[position.protocol] = 0
      }
      protocolWeights[position.protocol] += weight
    })

    maxSingleAssetWeight = Math.max(...Object.values(assetWeights))
    maxProtocolWeight = Math.max(...Object.values(protocolWeights))

    // Risk increases exponentially with concentration
    const assetConcentrationRisk = Math.pow(maxSingleAssetWeight * 2, 2) * 25
    const protocolConcentrationRisk = Math.pow(maxProtocolWeight * 1.5, 2) * 25

    return Math.max(assetConcentrationRisk, protocolConcentrationRisk)
  }

  /**
   * Calculate volatility risk based on asset volatilities
   */
  async calculateVolatilityRisk(portfolio) {
    if (!portfolio.positions || portfolio.positions.length === 0) {
      return 0
    }

    let weightedVolatility = 0
    const totalValue = portfolio.totalValue

    for (const position of portfolio.positions) {
      const weight = position.value / totalValue
      const assetVolatility = this.getAssetVolatility(position.asset)
      weightedVolatility += weight * assetVolatility
    }

    // Convert to risk score (0-100)
    return Math.min(weightedVolatility * 2, 100)
  }

  /**
   * Calculate liquidity risk
   */
  calculateLiquidityRisk(portfolio) {
    if (!portfolio.positions || portfolio.positions.length === 0) {
      return 0
    }

    let weightedLiquidityRisk = 0
    const totalValue = portfolio.totalValue

    portfolio.positions.forEach(position => {
      const weight = position.value / totalValue
      const liquidityScore = this.getAssetLiquidityScore(position.asset)
      const liquidityRisk = (1 - liquidityScore) * 100
      weightedLiquidityRisk += weight * liquidityRisk
    })

    return weightedLiquidityRisk
  }

  /**
   * Calculate protocol risk
   */
  async calculateProtocolRisk(portfolio) {
    if (!portfolio.positions || portfolio.positions.length === 0) {
      return 0
    }

    let weightedProtocolRisk = 0
    const totalValue = portfolio.totalValue

    for (const position of portfolio.positions) {
      const weight = position.value / totalValue
      const protocolRiskScore = await this.getProtocolRiskScore(position.protocol)
      weightedProtocolRisk += weight * protocolRiskScore
    }

    return weightedProtocolRisk
  }

  /**
   * Calculate correlation risk between assets
   */
  calculateCorrelationRisk(portfolio) {
    if (!portfolio.positions || portfolio.positions.length <= 1) {
      return 0
    }

    // Simplified correlation calculation
    // In production, would use actual historical correlation data
    const assets = portfolio.positions.map(p => p.asset)
    const uniqueAssets = [...new Set(assets)]

    if (uniqueAssets.length === 1) {
      return 100 // Maximum correlation risk if all same asset
    }

    // Estimate correlation based on asset types
    let totalCorrelation = 0
    let pairs = 0

    for (let i = 0; i < uniqueAssets.length; i++) {
      for (let j = i + 1; j < uniqueAssets.length; j++) {
        const correlation = this.getAssetCorrelation(uniqueAssets[i], uniqueAssets[j])
        totalCorrelation += correlation
        pairs++
      }
    }

    const avgCorrelation = pairs > 0 ? totalCorrelation / pairs : 0
    return avgCorrelation * 100
  }

  /**
   * Calculate overall risk score
   */
  calculateOverallRisk(risks, riskProfile) {
    const weights = {
      concentration: 0.3,
      volatility: 0.25,
      liquidity: 0.15,
      protocol: 0.2,
      correlation: 0.1
    }

    const score = (
      risks.concentrationRisk * weights.concentration +
      risks.volatilityRisk * weights.volatility +
      risks.liquidityRisk * weights.liquidity +
      risks.protocolRisk * weights.protocol +
      risks.correlationRisk * weights.correlation
    )

    const level = this.categorizeRiskLevel(score)

    return { score, level }
  }

  /**
   * Generate portfolio rebalancing recommendations
   */
  async generateRebalanceRecommendation(portfolio, userRiskTolerance, targetAllocations = null) {
    try {
      const riskProfile = this.riskMatrix[userRiskTolerance]
      const currentRisk = await this.assessPortfolioRisk(portfolio, userRiskTolerance)

      if (currentRisk.isWithinTolerance && !this.needsRebalancing(portfolio, targetAllocations)) {
        return {
          needsRebalancing: false,
          reason: 'Portfolio is already within target allocation and risk tolerance'
        }
      }

      // Calculate optimal allocations
      const optimalAllocations = this.calculateOptimalAllocations(portfolio, riskProfile, targetAllocations)
      
      // Generate specific rebalancing actions
      const actions = this.generateRebalancingActions(portfolio, optimalAllocations)

      // Estimate costs and benefits
      const costBenefitAnalysis = await this.analyzeCostBenefit(actions, portfolio)

      return {
        needsRebalancing: true,
        currentRisk: currentRisk,
        optimalAllocations,
        actions,
        costBenefitAnalysis,
        projectedRiskReduction: this.calculateRiskReduction(currentRisk, optimalAllocations),
        estimatedTimeframe: this.estimateRebalancingTime(actions),
        recommendation: 'immediate' // or 'scheduled', 'gradual'
      }
    } catch (error) {
      logger.error('Rebalance recommendation failed:', error)
      throw error
    }
  }

  /**
   * Simulate strategy performance under different market conditions
   */
  async simulateStressTest(portfolio, scenarios = ['market_crash', 'high_volatility', 'liquidity_crisis']) {
    const results = {}

    for (const scenario of scenarios) {
      try {
        const stressResult = await this.runStressScenario(portfolio, scenario)
        results[scenario] = stressResult
      } catch (error) {
        logger.error(`Stress test failed for scenario ${scenario}:`, error)
        results[scenario] = {
          error: error.message,
          passed: false
        }
      }
    }

    return {
      scenarios: results,
      overallStressScore: this.calculateOverallStressScore(results),
      recommendations: this.generateStressTestRecommendations(results)
    }
  }

  /**
   * Run individual stress test scenario
   */
  async runStressScenario(portfolio, scenario) {
    const scenarioConfig = this.getStressScenarioConfig(scenario)
    let simulatedValue = portfolio.totalValue
    let maxDrawdown = 0

    // Apply scenario effects to each position
    for (const position of portfolio.positions) {
      const assetImpact = scenarioConfig.assetImpacts[position.asset] || scenarioConfig.defaultImpact
      const protocolImpact = scenarioConfig.protocolImpacts[position.protocol] || 1

      const positionImpact = assetImpact * protocolImpact
      const newPositionValue = position.value * positionImpact
      
      simulatedValue += (newPositionValue - position.value)
      
      const drawdown = (position.value - newPositionValue) / position.value * 100
      maxDrawdown = Math.max(maxDrawdown, drawdown)
    }

    const totalLoss = (portfolio.totalValue - simulatedValue) / portfolio.totalValue * 100
    const passed = totalLoss <= scenarioConfig.maxAcceptableLoss

    return {
      scenario,
      originalValue: portfolio.totalValue,
      simulatedValue: parseFloat(simulatedValue.toFixed(2)),
      totalLoss: parseFloat(totalLoss.toFixed(2)),
      maxDrawdown: parseFloat(maxDrawdown.toFixed(2)),
      passed,
      severity: this.categorizeLossSeverity(totalLoss)
    }
  }

  /**
   * Helper methods for risk calculations
   */
  getAssetVolatility(asset) {
    const volatilities = {
      'USDC': 0.5,
      'USDT': 0.5,
      'DAI': 0.8,
      'ETH': 18.2,
      'WBTC': 22.1,
      'BTC': 22.1,
      'SOL': 35.4,
      'AVAX': 42.1
    }
    return volatilities[asset] || 25
  }

  getAssetLiquidityScore(asset) {
    const liquidityScores = {
      'USDC': 0.95,
      'USDT': 0.95,
      'DAI': 0.9,
      'ETH': 0.9,
      'WBTC': 0.85,
      'BTC': 0.9,
      'SOL': 0.8,
      'AVAX': 0.75
    }
    return liquidityScores[asset] || 0.7
  }

  async getProtocolRiskScore(protocolId) {
    try {
      const health = await protocolService.getProtocolHealth(protocolId)
      if (!health.healthy) {
        return 80 // High risk if unhealthy
      }

      const protocolRiskScores = {
        'compound': 15,
        'aave': 20,
        'uniswap': 35,
        'curve': 25
      }

      return protocolRiskScores[protocolId] || 50
    } catch (error) {
      logger.error(`Failed to get protocol risk for ${protocolId}:`, error)
      return 50 // Medium risk as fallback
    }
  }

  getAssetCorrelation(asset1, asset2) {
    // Simplified correlation matrix
    const correlations = {
      'USDC-USDT': 0.95,
      'USDC-DAI': 0.85,
      'USDT-DAI': 0.88,
      'ETH-WBTC': 0.75,
      'ETH-BTC': 0.75,
      'WBTC-BTC': 0.98
    }

    const key = [asset1, asset2].sort().join('-')
    return correlations[key] || 0.3 // Default low correlation
  }

  getRiskToleranceScore(tolerance) {
    const scores = {
      [RISK_TOLERANCE.CONSERVATIVE]: 20,
      [RISK_TOLERANCE.MODERATE]: 35,
      [RISK_TOLERANCE.BALANCED]: 50,
      [RISK_TOLERANCE.AGGRESSIVE]: 70,
      [RISK_TOLERANCE.VERY_AGGRESSIVE]: 90
    }
    return scores[tolerance] || 50
  }

  categorizeRiskLevel(score) {
    if (score <= 20) return RISK_LEVELS.VERY_LOW
    if (score <= 35) return RISK_LEVELS.LOW
    if (score <= 50) return RISK_LEVELS.MODERATE
    if (score <= 70) return RISK_LEVELS.HIGH
    return RISK_LEVELS.VERY_HIGH
  }

  needsRebalancing(portfolio, targetAllocations) {
    if (!targetAllocations) return false

    for (const target of targetAllocations) {
      const currentWeight = this.getCurrentWeight(portfolio, target.asset)
      const deviation = Math.abs(currentWeight - target.weight)
      
      if (deviation > this.rebalanceThreshold) {
        return true
      }
    }

    return false
  }

  getCurrentWeight(portfolio, asset) {
    const position = portfolio.positions.find(p => p.asset === asset)
    return position ? position.value / portfolio.totalValue : 0
  }

  calculateOptimalAllocations(portfolio, riskProfile, targetAllocations) {
    // Simplified optimization - in production would use modern portfolio theory
    const optimalAllocations = []
    const preferredAssets = riskProfile.preferredAssets

    let remainingWeight = 1.0
    const maxSingleWeight = riskProfile.maxSingleAssetWeight

    for (let i = 0; i < preferredAssets.length && remainingWeight > 0; i++) {
      const asset = preferredAssets[i]
      const weight = Math.min(maxSingleWeight, remainingWeight / (preferredAssets.length - i))
      
      optimalAllocations.push({
        asset,
        weight: parseFloat(weight.toFixed(3)),
        targetValue: parseFloat((weight * portfolio.totalValue).toFixed(2))
      })

      remainingWeight -= weight
    }

    return optimalAllocations
  }

  generateRebalancingActions(portfolio, optimalAllocations) {
    const actions = []

    optimalAllocations.forEach(target => {
      const currentWeight = this.getCurrentWeight(portfolio, target.asset)
      const weightDifference = target.weight - currentWeight
      const valueDifference = weightDifference * portfolio.totalValue

      if (Math.abs(valueDifference) > 100) { // Only act on differences > $100
        actions.push({
          action: valueDifference > 0 ? 'increase' : 'decrease',
          asset: target.asset,
          currentWeight: parseFloat(currentWeight.toFixed(3)),
          targetWeight: target.weight,
          valueDifference: parseFloat(Math.abs(valueDifference).toFixed(2)),
          priority: Math.abs(weightDifference) > this.rebalanceThreshold * 2 ? 'high' : 'medium'
        })
      }
    })

    return actions.sort((a, b) => b.valueDifference - a.valueDifference)
  }

  async analyzeCostBenefit(actions, portfolio) {
    let totalGasCosts = 0
    let projectedBenefit = 0

    for (const action of actions) {
      // Estimate gas costs for rebalancing
      const gasCost = await this.estimateRebalancingCost(action, portfolio)
      totalGasCosts += gasCost

      // Estimate benefit from risk reduction
      const benefit = action.valueDifference * 0.01 // 1% improvement assumption
      projectedBenefit += benefit
    }

    return {
      totalGasCosts: parseFloat(totalGasCosts.toFixed(2)),
      projectedBenefit: parseFloat(projectedBenefit.toFixed(2)),
      netBenefit: parseFloat((projectedBenefit - totalGasCosts).toFixed(2)),
      paybackPeriod: projectedBenefit > 0 ? Math.ceil(totalGasCosts / (projectedBenefit / 12)) : null
    }
  }

  async estimateRebalancingCost(action, portfolio) {
    // Simplified cost estimation
    const baseCost = 50 // Base transaction cost in USD
    const sizeMultiplier = Math.log10(action.valueDifference / 1000) || 1
    return baseCost * sizeMultiplier
  }

  generateRiskRecommendations(overallRisk, riskProfile, portfolio) {
    const recommendations = []

    if (overallRisk.score > this.getRiskToleranceScore(riskProfile)) {
      recommendations.push({
        type: 'risk_reduction',
        priority: 'high',
        message: 'Portfolio risk exceeds your tolerance level',
        action: 'Consider rebalancing to lower-risk assets'
      })
    }

    // Add specific recommendations based on risk components
    const risks = overallRisk.riskMetrics
    if (risks && risks.concentrationRisk > 40) {
      recommendations.push({
        type: 'diversification',
        priority: 'high',
        message: 'High concentration risk detected',
        action: 'Diversify across more assets and protocols'
      })
    }

    if (risks && risks.liquidityRisk > 30) {
      recommendations.push({
        type: 'liquidity',
        priority: 'medium',
        message: 'Consider increasing liquidity buffer',
        action: 'Allocate more to highly liquid assets'
      })
    }

    return recommendations
  }

  getStressScenarioConfig(scenario) {
    const configs = {
      market_crash: {
        assetImpacts: {
          'USDC': 0.98,
          'USDT': 0.98,
          'DAI': 0.95,
          'ETH': 0.6,
          'WBTC': 0.65,
          'BTC': 0.65
        },
        protocolImpacts: {
          'compound': 0.95,
          'aave': 0.95,
          'uniswap': 0.8,
          'curve': 0.9
        },
        defaultImpact: 0.7,
        maxAcceptableLoss: 30
      },
      high_volatility: {
        assetImpacts: {
          'USDC': 0.99,
          'USDT': 0.99,
          'DAI': 0.98,
          'ETH': 0.8,
          'WBTC': 0.82,
          'BTC': 0.82
        },
        protocolImpacts: {
          'compound': 0.98,
          'aave': 0.98,
          'uniswap': 0.9,
          'curve': 0.95
        },
        defaultImpact: 0.85,
        maxAcceptableLoss: 20
      },
      liquidity_crisis: {
        assetImpacts: {
          'USDC': 0.95,
          'USDT': 0.93,
          'DAI': 0.9,
          'ETH': 0.75,
          'WBTC': 0.78,
          'BTC': 0.8
        },
        protocolImpacts: {
          'compound': 0.9,
          'aave': 0.92,
          'uniswap': 0.7,
          'curve': 0.85
        },
        defaultImpact: 0.8,
        maxAcceptableLoss: 25
      }
    }

    return configs[scenario] || configs.market_crash
  }

  calculateOverallStressScore(results) {
    const scenarios = Object.values(results).filter(r => !r.error)
    if (scenarios.length === 0) return 0

    const avgLoss = scenarios.reduce((sum, s) => sum + s.totalLoss, 0) / scenarios.length
    const passedCount = scenarios.filter(s => s.passed).length
    const passRate = passedCount / scenarios.length

    return parseFloat((passRate * 100 - avgLoss).toFixed(1))
  }

  generateStressTestRecommendations(results) {
    const recommendations = []
    const failedScenarios = Object.entries(results).filter(([_, result]) => !result.passed && !result.error)

    failedScenarios.forEach(([scenario, result]) => {
      recommendations.push({
        scenario,
        severity: result.severity,
        message: `Portfolio vulnerable to ${scenario.replace('_', ' ')}`,
        action: `Consider hedging strategies or reducing exposure to high-risk assets`
      })
    })

    return recommendations
  }

  categorizeLossSeverity(lossPercentage) {
    if (lossPercentage <= 5) return 'minimal'
    if (lossPercentage <= 15) return 'moderate'
    if (lossPercentage <= 30) return 'significant'
    if (lossPercentage <= 50) return 'severe'
    return 'catastrophic'
  }

  calculateRiskReduction(currentRisk, optimalAllocations) {
    // Simplified calculation - estimate risk reduction from rebalancing
    return Math.max(0, parseFloat((currentRisk.overallRiskScore * 0.2).toFixed(1)))
  }

  estimateRebalancingTime(actions) {
    // Estimate time based on number and complexity of actions
    const baseTime = 5 // minutes
    const timePerAction = 3 // minutes per action
    return baseTime + (actions.length * timePerAction)
  }

  /**
   * Clear caches
   */
  clearCache() {
    this.riskMetrics.clear()
    this.portfolioCache.clear()
    logger.info('Risk engine cache cleared')
  }
}

// Create singleton instance
export const riskEngine = new RiskEngine()
export default riskEngine