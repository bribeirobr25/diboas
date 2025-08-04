/**
 * Portfolio Insights Service
 * Advanced portfolio analysis, market intelligence, and personalized recommendations
 */

import logger from '../../utils/logger.js'
import secureLogger from '../../utils/secureLogger.js'
import strategyAnalyticsService from '../analytics/StrategyAnalyticsService.js'
import riskEngine from '../risk/RiskEngine.js'

export const INSIGHT_TYPES = {
  PERFORMANCE: 'performance',
  RISK: 'risk',
  OPPORTUNITY: 'opportunity',
  MARKET: 'market',
  TAX: 'tax',
  REBALANCING: 'rebalancing',
  TREND: 'trend'
}

export const INSIGHT_PRIORITY = {
  CRITICAL: 'critical',
  HIGH: 'high',
  MEDIUM: 'medium',
  LOW: 'low',
  INFO: 'info'
}

export const MARKET_CONDITIONS = {
  BULL: 'bull',
  BEAR: 'bear',
  SIDEWAYS: 'sideways',
  VOLATILE: 'volatile',
  STABLE: 'stable'
}

class PortfolioInsightsService {
  constructor() {
    this.insights = new Map()
    this.marketData = new Map()
    this.trendAnalysis = new Map()
    this.benchmarkData = new Map()
    this.userPreferences = new Map()
    
    this.initializeMarketData()
    this.initializeBenchmarks()
    
    logger.info('Portfolio insights service initialized')
  }

  /**
   * Initialize market data and indicators
   */
  initializeMarketData() {
    // Mock market indicators
    this.marketData.set('vix', {
      name: 'VIX Fear & Greed Index',
      value: 25.3,
      previousValue: 28.1,
      trend: 'decreasing',
      interpretation: 'Low fear, moderate complacency'
    })

    this.marketData.set('yields', {
      name: '10Y Treasury Yield',
      value: 4.15,
      previousValue: 4.08,
      trend: 'increasing',
      interpretation: 'Rising rates may pressure growth stocks'
    })

    this.marketData.set('dxy', {
      name: 'Dollar Index (DXY)',
      value: 103.2,
      previousValue: 104.1,
      trend: 'decreasing',
      interpretation: 'Weakening dollar favorable for risk assets'
    })

    this.marketData.set('crypto_fear_greed', {
      name: 'Crypto Fear & Greed Index',
      value: 68,
      previousValue: 72,
      trend: 'decreasing',
      interpretation: 'Greed zone, potential for pullback'
    })
  }

  /**
   * Initialize benchmark data
   */
  initializeBenchmarks() {
    this.benchmarkData.set('sp500', {
      name: 'S&P 500',
      ytdReturn: 18.2,
      monthlyReturn: 2.1,
      volatility: 16.8,
      sector: 'broad_market'
    })

    this.benchmarkData.set('nasdaq', {
      name: 'NASDAQ-100',
      ytdReturn: 22.5,
      monthlyReturn: 3.2,
      volatility: 22.1,
      sector: 'technology'
    })

    this.benchmarkData.set('defi_pulse', {
      name: 'DeFi Pulse Index',
      ytdReturn: 45.8,
      monthlyReturn: 8.7,
      volatility: 68.2,
      sector: 'defi'
    })

    this.benchmarkData.set('btc', {
      name: 'Bitcoin',
      ytdReturn: 89.3,
      monthlyReturn: 12.1,
      volatility: 72.5,
      sector: 'crypto'
    })
  }

  /**
   * Generate comprehensive portfolio insights
   */
  async generatePortfolioInsights(portfolio, userProfile, timeframe = '30d') {
    try {
      const insights = []

      // Performance insights
      const performanceInsights = await this.generatePerformanceInsights(portfolio, timeframe)
      insights.push(...performanceInsights)

      // Risk insights
      const riskInsights = await this.generateRiskInsights(portfolio, userProfile)
      insights.push(...riskInsights)

      // Market opportunity insights
      const opportunityInsights = await this.generateOpportunityInsights(portfolio, userProfile)
      insights.push(...opportunityInsights)

      // Tax optimization insights
      const taxInsights = await this.generateTaxInsights(portfolio, userProfile)
      insights.push(...taxInsights)

      // Rebalancing insights
      const rebalancingInsights = await this.generateRebalancingInsights(portfolio, userProfile)
      insights.push(...rebalancingInsights)

      // Market trend insights
      const trendInsights = await this.generateTrendInsights(portfolio)
      insights.push(...trendInsights)

      // Sort by priority and relevance
      const sortedInsights = this.prioritizeInsights(insights, userProfile)

      // Generate summary
      const summary = this.generateInsightsSummary(sortedInsights, portfolio)

      const report = {
        insights: sortedInsights,
        summary,
        marketConditions: this.assessMarketConditions(),
        portfolioHealth: await this.assessPortfolioHealth(portfolio),
        actionableRecommendations: this.extractActionableRecommendations(sortedInsights),
        generatedAt: new Date().toISOString(),
        timeframe
      }

      // Cache insights
      this.insights.set(`${userProfile.userId}_${timeframe}`, report)

      secureLogger.audit('PORTFOLIO_INSIGHTS_GENERATED', {
        userId: userProfile.userId,
        insightCount: insights.length,
        criticalInsights: insights.filter(i => i.priority === INSIGHT_PRIORITY.CRITICAL).length
      })

      return report
    } catch (error) {
      logger.error('Portfolio insights generation failed:', error)
      throw error
    }
  }

  /**
   * Generate performance insights
   */
  async generatePerformanceInsights(portfolio, timeframe) {
    const insights = []

    try {
      // Calculate portfolio performance
      const totalReturn = this.calculatePortfolioReturn(portfolio, timeframe)
      const benchmarkReturns = this.getBenchmarkReturns(timeframe)

      // Outperformance analysis
      const spOutperformance = totalReturn - benchmarkReturns.sp500
      if (Math.abs(spOutperformance) > 2) {
        insights.push({
          type: INSIGHT_TYPES.PERFORMANCE,
          priority: spOutperformance > 0 ? INSIGHT_PRIORITY.HIGH : INSIGHT_PRIORITY.MEDIUM,
          title: spOutperformance > 0 ? 'Strong Portfolio Outperformance' : 'Portfolio Underperformance',
          description: `Your portfolio has ${spOutperformance > 0 ? 'outperformed' : 'underperformed'} the S&P 500 by ${Math.abs(spOutperformance).toFixed(1)}% over the last ${timeframe}`,
          impact: Math.abs(spOutperformance),
          recommendation: spOutperformance > 0 
            ? 'Consider taking some profits to lock in gains'
            : 'Review underperforming positions and consider rebalancing',
          data: {
            portfolioReturn: totalReturn,
            benchmarkReturn: benchmarkReturns.sp500,
            outperformance: spOutperformance
          }
        })
      }

      // Volatility insights
      const portfolioVolatility = this.calculatePortfolioVolatility(portfolio)
      const expectedVolatility = this.getExpectedVolatility(portfolio)
      
      if (portfolioVolatility > expectedVolatility * 1.2) {
        insights.push({
          type: INSIGHT_TYPES.RISK,
          priority: INSIGHT_PRIORITY.MEDIUM,
          title: 'Higher Than Expected Volatility',
          description: `Your portfolio volatility (${portfolioVolatility.toFixed(1)}%) is ${((portfolioVolatility/expectedVolatility - 1) * 100).toFixed(1)}% higher than expected`,
          impact: portfolioVolatility - expectedVolatility,
          recommendation: 'Consider adding more stable assets or reducing position sizes in volatile holdings',
          data: {
            actualVolatility: portfolioVolatility,
            expectedVolatility: expectedVolatility
          }
        })
      }

      // Concentration insights
      const concentration = this.calculateConcentration(portfolio)
      if (concentration.maxPositionWeight > 25) {
        insights.push({
          type: INSIGHT_TYPES.RISK,
          priority: INSIGHT_PRIORITY.HIGH,
          title: 'High Position Concentration',
          description: `Your largest position (${concentration.largestPosition}) represents ${concentration.maxPositionWeight.toFixed(1)}% of your portfolio`,
          impact: concentration.maxPositionWeight,
          recommendation: 'Consider reducing concentration to limit single-asset risk',
          data: concentration
        })
      }

    } catch (error) {
      logger.error('Performance insights generation failed:', error)
    }

    return insights
  }

  /**
   * Generate risk insights
   */
  async generateRiskInsights(portfolio, userProfile) {
    const insights = []

    try {
      // Risk assessment
      const riskAssessment = await riskEngine.assessPortfolioRisk(portfolio, userProfile.riskTolerance)

      if (!riskAssessment.isWithinTolerance) {
        insights.push({
          type: INSIGHT_TYPES.RISK,
          priority: INSIGHT_PRIORITY.CRITICAL,
          title: 'Portfolio Risk Exceeds Tolerance',
          description: `Your portfolio risk score (${riskAssessment.overallRiskScore}) exceeds your ${userProfile.riskTolerance} risk tolerance`,
          impact: riskAssessment.overallRiskScore,
          recommendation: 'Immediate rebalancing recommended to reduce risk exposure',
          data: riskAssessment
        })
      }

      // Correlation risk
      const correlationRisk = this.calculateCorrelationRisk(portfolio)
      if (correlationRisk > 0.7) {
        insights.push({
          type: INSIGHT_TYPES.RISK,
          priority: INSIGHT_PRIORITY.MEDIUM,
          title: 'High Asset Correlation Risk',
          description: `Your assets have high correlation (${(correlationRisk * 100).toFixed(1)}%), reducing diversification benefits`,
          impact: correlationRisk,
          recommendation: 'Add uncorrelated assets to improve diversification',
          data: { correlationRisk }
        })
      }

      // Liquidity risk
      const liquidityRisk = this.assessLiquidityRisk(portfolio)
      if (liquidityRisk.score > 30) {
        insights.push({
          type: INSIGHT_TYPES.RISK,
          priority: INSIGHT_PRIORITY.MEDIUM,
          title: 'Potential Liquidity Constraints',
          description: `${liquidityRisk.illiquidPositions} positions may have limited liquidity in market stress`,
          impact: liquidityRisk.score,
          recommendation: 'Maintain adequate liquid reserves for emergencies',
          data: liquidityRisk
        })
      }

    } catch (error) {
      logger.error('Risk insights generation failed:', error)
    }

    return insights
  }

  /**
   * Generate opportunity insights
   */
  async generateOpportunityInsights(portfolio, userProfile) {
    const insights = []

    try {
      // Yield opportunities
      const yieldOpportunities = await this.identifyYieldOpportunities(portfolio)
      if (yieldOpportunities.length > 0) {
        const topOpportunity = yieldOpportunities[0]
        insights.push({
          type: INSIGHT_TYPES.OPPORTUNITY,
          priority: INSIGHT_PRIORITY.HIGH,
          title: 'High-Yield Opportunity Identified',
          description: `${topOpportunity.protocol} offers ${topOpportunity.apy}% APY for ${topOpportunity.asset}`,
          impact: topOpportunity.additionalYield,
          recommendation: `Consider allocating ${topOpportunity.recommendedAmount} to capture additional yield`,
          data: topOpportunity
        })
      }

      // Arbitrage opportunities
      const arbitrageOpps = await this.identifyArbitrageOpportunities(portfolio)
      if (arbitrageOpps.length > 0) {
        const topArbitrage = arbitrageOpps[0]
        insights.push({
          type: INSIGHT_TYPES.OPPORTUNITY,
          priority: INSIGHT_PRIORITY.MEDIUM,
          title: 'Arbitrage Opportunity Available',
          description: `${topArbitrage.spread.toFixed(2)}% spread available between ${topArbitrage.sourceProtocol} and ${topArbitrage.targetProtocol}`,
          impact: topArbitrage.potentialProfit,
          recommendation: 'Consider flash loan arbitrage if you have technical expertise',
          data: topArbitrage
        })
      }

      // Sector rotation opportunities
      const sectorOpportunities = this.identifySectorOpportunities(portfolio)
      if (sectorOpportunities.length > 0) {
        insights.push({
          type: INSIGHT_TYPES.OPPORTUNITY,
          priority: INSIGHT_PRIORITY.MEDIUM,
          title: 'Sector Rotation Opportunity',
          description: `${sectorOpportunities[0].sector} sector showing strong momentum (+${sectorOpportunities[0].momentum.toFixed(1)}%)`,
          impact: sectorOpportunities[0].potentialGain,
          recommendation: `Consider increasing allocation to ${sectorOpportunities[0].sector} assets`,
          data: sectorOpportunities[0]
        })
      }

    } catch (error) {
      logger.error('Opportunity insights generation failed:', error)
    }

    return insights
  }

  /**
   * Generate tax optimization insights
   */
  async generateTaxInsights(portfolio, userProfile) {
    const insights = []

    try {
      // Tax loss harvesting opportunities
      const taxLossOpportunities = this.identifyTaxLossOpportunities(portfolio)
      if (taxLossOpportunities.totalPotentialSavings > 500) {
        insights.push({
          type: INSIGHT_TYPES.TAX,
          priority: INSIGHT_PRIORITY.HIGH,
          title: 'Tax Loss Harvesting Opportunity',
          description: `Harvest losses to save up to $${taxLossOpportunities.totalPotentialSavings.toFixed(0)} in taxes`,
          impact: taxLossOpportunities.totalPotentialSavings,
          recommendation: 'Review positions for tax-loss harvesting before year-end',
          data: taxLossOpportunities
        })
      }

      // Long-term vs short-term gains
      const capitalGainsAnalysis = this.analyzeCapitalGains(portfolio)
      if (capitalGainsAnalysis.shortTermGainsAtRisk > 1000) {
        insights.push({
          type: INSIGHT_TYPES.TAX,
          priority: INSIGHT_PRIORITY.MEDIUM,
          title: 'Short-Term Capital Gains Exposure',
          description: `$${capitalGainsAnalysis.shortTermGainsAtRisk.toFixed(0)} in potential short-term gains (taxed as ordinary income)`,
          impact: capitalGainsAnalysis.taxImpact,
          recommendation: 'Consider holding positions longer to qualify for long-term capital gains rates',
          data: capitalGainsAnalysis
        })
      }

    } catch (error) {
      logger.error('Tax insights generation failed:', error)
    }

    return insights
  }

  /**
   * Generate rebalancing insights
   */
  async generateRebalancingInsights(portfolio, userProfile) {
    const insights = []

    try {
      const rebalancingAnalysis = await riskEngine.generateRebalanceRecommendation(
        portfolio, 
        userProfile.riskTolerance
      )

      if (rebalancingAnalysis.needsRebalancing) {
        insights.push({
          type: INSIGHT_TYPES.REBALANCING,
          priority: INSIGHT_PRIORITY.MEDIUM,
          title: 'Portfolio Rebalancing Recommended',
          description: `${rebalancingAnalysis.actions.length} positions need adjustment to maintain target allocation`,
          impact: rebalancingAnalysis.projectedRiskReduction,
          recommendation: 'Rebalance portfolio to optimize risk-return profile',
          data: rebalancingAnalysis
        })
      }

      // Drift analysis
      const driftAnalysis = this.analyzeDrift(portfolio, userProfile.targetAllocation)
      if (driftAnalysis.maxDrift > 10) {
        insights.push({
          type: INSIGHT_TYPES.REBALANCING,
          priority: INSIGHT_PRIORITY.MEDIUM,
          title: 'Significant Portfolio Drift Detected',
          description: `${driftAnalysis.largestDriftAsset} has drifted ${driftAnalysis.maxDrift.toFixed(1)}% from target`,
          impact: driftAnalysis.maxDrift,
          recommendation: 'Rebalance to restore target allocation',
          data: driftAnalysis
        })
      }

    } catch (error) {
      logger.error('Rebalancing insights generation failed:', error)
    }

    return insights
  }

  /**
   * Generate trend insights
   */
  async generateTrendInsights(portfolio) {
    const insights = []

    try {
      // Market trend analysis
      const marketTrend = this.analyzeMarketTrend()
      if (marketTrend.strength > 0.7) {
        insights.push({
          type: INSIGHT_TYPES.TREND,
          priority: INSIGHT_PRIORITY.INFO,
          title: `Strong ${marketTrend.direction} Market Trend`,
          description: `Market showing strong ${marketTrend.direction} momentum with ${(marketTrend.strength * 100).toFixed(0)}% confidence`,
          impact: marketTrend.portfolioImpact,
          recommendation: marketTrend.recommendation,
          data: marketTrend
        })
      }

      // Sector trends
      const sectorTrends = this.analyzeSectorTrends(portfolio)
      const strongTrends = sectorTrends.filter(trend => Math.abs(trend.momentum) > 5)
      
      for (const trend of strongTrends.slice(0, 2)) { // Top 2 trends
        insights.push({
          type: INSIGHT_TYPES.TREND,
          priority: INSIGHT_PRIORITY.LOW,
          title: `${trend.sector} Sector ${trend.momentum > 0 ? 'Momentum' : 'Weakness'}`,
          description: `${trend.sector} showing ${Math.abs(trend.momentum).toFixed(1)}% ${trend.momentum > 0 ? 'outperformance' : 'underperformance'}`,
          impact: Math.abs(trend.momentum),
          recommendation: trend.momentum > 0 ? 'Consider increasing exposure' : 'Monitor for potential reduction',
          data: trend
        })
      }

    } catch (error) {
      logger.error('Trend insights generation failed:', error)
    }

    return insights
  }

  /**
   * Assess overall market conditions
   */
  assessMarketConditions() {
    const vix = this.marketData.get('vix').value
    const cryptoFearGreed = this.marketData.get('crypto_fear_greed').value
    const yields = this.marketData.get('yields')

    let condition = MARKET_CONDITIONS.STABLE
    let confidence = 0.5
    let description = 'Mixed signals in the market'

    // VIX analysis
    if (vix < 20) {
      condition = MARKET_CONDITIONS.STABLE
      confidence += 0.2
      description = 'Low volatility environment, stable conditions'
    } else if (vix > 30) {
      condition = MARKET_CONDITIONS.VOLATILE
      confidence += 0.3
      description = 'High volatility environment, uncertain conditions'
    }

    // Crypto sentiment analysis
    if (cryptoFearGreed > 75) {
      if (condition === MARKET_CONDITIONS.STABLE) {
        condition = MARKET_CONDITIONS.BULL
        confidence += 0.2
        description = 'Bull market conditions with high crypto sentiment'
      }
    } else if (cryptoFearGreed < 25) {
      condition = MARKET_CONDITIONS.BEAR
      confidence += 0.3
      description = 'Bear market conditions with fearful sentiment'
    }

    return {
      condition,
      confidence: Math.min(confidence, 1.0),
      description,
      indicators: {
        vix: this.marketData.get('vix'),
        cryptoSentiment: this.marketData.get('crypto_fear_greed'),
        yields: this.marketData.get('yields'),
        dollar: this.marketData.get('dxy')
      }
    }
  }

  /**
   * Assess portfolio health
   */
  async assessPortfolioHealth(portfolio) {
    try {
      const healthMetrics = {
        diversification: this.calculateDiversificationScore(portfolio),
        riskAlignment: await this.calculateRiskAlignmentScore(portfolio),
        performance: this.calculatePerformanceScore(portfolio),
        liquidity: this.calculateLiquidityScore(portfolio),
        fees: this.calculateFeesScore(portfolio)
      }

      const overallScore = Object.values(healthMetrics).reduce((sum, score) => sum + score, 0) / Object.keys(healthMetrics).length

      let healthLevel
      if (overallScore >= 80) healthLevel = 'Excellent'
      else if (overallScore >= 70) healthLevel = 'Good'
      else if (overallScore >= 60) healthLevel = 'Fair'
      else healthLevel = 'Needs Improvement'

      return {
        overallScore: Math.round(overallScore),
        healthLevel,
        metrics: healthMetrics,
        strengths: this.identifyStrengths(healthMetrics),
        improvements: this.identifyImprovements(healthMetrics)
      }
    } catch (error) {
      logger.error('Portfolio health assessment failed:', error)
      return {
        overallScore: 50,
        healthLevel: 'Unknown',
        error: error.message
      }
    }
  }

  /**
   * Helper methods for calculations
   */
  calculatePortfolioReturn(portfolio, timeframe) {
    // Mock calculation - in production would use actual historical data
    return (Math.random() - 0.3) * 30 // -9% to +21% range
  }

  calculatePortfolioVolatility(portfolio) {
    // Weighted average of position volatilities
    let weightedVolatility = 0
    const totalValue = portfolio.totalValue || portfolio.positions.reduce((sum, pos) => sum + pos.value, 0)

    for (const position of portfolio.positions) {
      const weight = position.value / totalValue
      const assetVolatility = this.getAssetVolatility(position.asset)
      weightedVolatility += weight * assetVolatility
    }

    return weightedVolatility
  }

  getAssetVolatility(asset) {
    const volatilities = {
      'USDC': 0.5, 'USDT': 0.5, 'DAI': 0.8,
      'BTC': 65, 'ETH': 55, 'SOL': 85, 'AVAX': 75,
      'SPY': 16, 'QQQ': 22, 'VTI': 15
    }
    return volatilities[asset] || 25
  }

  getExpectedVolatility(portfolio) {
    // Expected volatility based on asset mix
    return this.calculatePortfolioVolatility(portfolio) * 0.9 // 10% buffer
  }

  calculateConcentration(portfolio) {
    const positions = portfolio.positions || []
    const totalValue = positions.reduce((sum, pos) => sum + pos.value, 0)
    
    let maxWeight = 0
    let largestPosition = ''

    for (const position of positions) {
      const weight = (position.value / totalValue) * 100
      if (weight > maxWeight) {
        maxWeight = weight
        largestPosition = position.asset
      }
    }

    return {
      maxPositionWeight: maxWeight,
      largestPosition,
      diversificationRatio: positions.length > 0 ? Math.min(100 / positions.length, 100) : 0
    }
  }

  calculateCorrelationRisk(portfolio) {
    // Simplified correlation analysis
    const cryptoAssets = ['BTC', 'ETH', 'SOL', 'AVAX']
    const traditionalAssets = ['SPY', 'QQQ', 'VTI']
    
    const cryptoWeight = portfolio.positions
      .filter(pos => cryptoAssets.includes(pos.asset))
      .reduce((sum, pos) => sum + pos.value, 0) / portfolio.totalValue

    const traditionalWeight = portfolio.positions
      .filter(pos => traditionalAssets.includes(pos.asset))
      .reduce((sum, pos) => sum + pos.value, 0) / portfolio.totalValue

    // High concentration in correlated assets = higher correlation risk
    return Math.max(cryptoWeight, traditionalWeight)
  }

  assessLiquidityRisk(portfolio) {
    const liquidityScores = {
      'USDC': 100, 'USDT': 100, 'DAI': 95,
      'BTC': 90, 'ETH': 85, 'SOL': 70, 'AVAX': 65,
      'SPY': 95, 'QQQ': 90, 'VTI': 90
    }

    let weightedLiquidityScore = 0
    let illiquidPositions = 0
    const totalValue = portfolio.totalValue || portfolio.positions.reduce((sum, pos) => sum + pos.value, 0)

    for (const position of portfolio.positions) {
      const weight = position.value / totalValue
      const liquidityScore = liquidityScores[position.asset] || 50
      weightedLiquidityScore += weight * liquidityScore

      if (liquidityScore < 70) illiquidPositions++
    }

    return {
      score: 100 - weightedLiquidityScore, // Higher score = more risk
      weightedLiquidityScore,
      illiquidPositions
    }
  }

  getBenchmarkReturns(timeframe) {
    return {
      sp500: 18.2,
      nasdaq: 22.5,
      btc: 89.3,
      defi: 45.8
    }
  }

  prioritizeInsights(insights, userProfile) {
    const priorityWeights = {
      [INSIGHT_PRIORITY.CRITICAL]: 5,
      [INSIGHT_PRIORITY.HIGH]: 4,
      [INSIGHT_PRIORITY.MEDIUM]: 3,
      [INSIGHT_PRIORITY.LOW]: 2,
      [INSIGHT_PRIORITY.INFO]: 1
    }

    return insights.sort((a, b) => {
      const aPriority = priorityWeights[a.priority] || 0
      const bPriority = priorityWeights[b.priority] || 0
      
      if (aPriority !== bPriority) {
        return bPriority - aPriority
      }
      
      return (b.impact || 0) - (a.impact || 0)
    })
  }

  generateInsightsSummary(insights, portfolio) {
    const criticalCount = insights.filter(i => i.priority === INSIGHT_PRIORITY.CRITICAL).length
    const highCount = insights.filter(i => i.priority === INSIGHT_PRIORITY.HIGH).length
    const opportunityCount = insights.filter(i => i.type === INSIGHT_TYPES.OPPORTUNITY).length

    return {
      totalInsights: insights.length,
      criticalIssues: criticalCount,
      highPriorityItems: highCount,
      opportunities: opportunityCount,
      topRecommendation: insights[0]?.recommendation || 'No immediate actions required',
      overallTone: criticalCount > 0 ? 'action_required' : 
                   highCount > 0 ? 'attention_needed' : 'monitoring'
    }
  }

  extractActionableRecommendations(insights) {
    return insights
      .filter(insight => insight.priority === INSIGHT_PRIORITY.CRITICAL || insight.priority === INSIGHT_PRIORITY.HIGH)
      .slice(0, 5) // Top 5 actionable items
      .map(insight => ({
        action: insight.recommendation,
        priority: insight.priority,
        impact: insight.impact,
        type: insight.type
      }))
  }

  // Additional helper methods would continue here...
  async identifyYieldOpportunities(portfolio) {
    // Mock implementation
    return [{
      protocol: 'Compound',
      asset: 'USDC',
      apy: 8.5,
      additionalYield: 2.3,
      recommendedAmount: 10000
    }]
  }

  async identifyArbitrageOpportunities(portfolio) {
    return [{
      sourceProtocol: 'Uniswap',
      targetProtocol: 'Curve',
      spread: 1.2,
      potentialProfit: 120
    }]
  }

  identifySectorOpportunities(portfolio) {
    return [{
      sector: 'DeFi',
      momentum: 12.3,
      potentialGain: 8.5
    }]
  }

  identifyTaxLossOpportunities(portfolio) {
    return {
      totalPotentialSavings: 1250,
      opportunities: []
    }
  }

  analyzeCapitalGains(portfolio) {
    return {
      shortTermGainsAtRisk: 2500,
      taxImpact: 875
    }
  }

  analyzeDrift(portfolio, targetAllocation) {
    return {
      maxDrift: 12.5,
      largestDriftAsset: 'ETH'
    }
  }

  analyzeMarketTrend() {
    return {
      direction: 'bullish',
      strength: 0.75,
      portfolioImpact: 'positive',
      recommendation: 'Maintain current risk exposure'
    }
  }

  analyzeSectorTrends(portfolio) {
    return [
      { sector: 'Technology', momentum: 8.2 },
      { sector: 'DeFi', momentum: -3.1 }
    ]
  }

  calculateDiversificationScore(portfolio) {
    return 75 // Mock score
  }

  async calculateRiskAlignmentScore(portfolio) {
    return 82 // Mock score
  }

  calculatePerformanceScore(portfolio) {
    return 68 // Mock score
  }

  calculateLiquidityScore(portfolio) {
    return 85 // Mock score
  }

  calculateFeesScore(portfolio) {
    return 90 // Mock score
  }

  identifyStrengths(metrics) {
    return Object.entries(metrics)
      .filter(([_, score]) => score >= 80)
      .map(([metric, score]) => `Strong ${metric} (${score})`)
  }

  identifyImprovements(metrics) {
    return Object.entries(metrics)
      .filter(([_, score]) => score < 70)
      .map(([metric, score]) => `Improve ${metric} (${score})`)
  }
}

// Create singleton instance
export const portfolioInsightsService = new PortfolioInsightsService()
export default portfolioInsightsService