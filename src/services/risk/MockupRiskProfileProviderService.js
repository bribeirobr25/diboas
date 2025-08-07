/**
 * Mockup Risk Profile Provider Service
 * Simulates 3rd party risk management APIs with realistic response times
 * This will be replaced with real risk management provider integrations
 */

import logger from '../../utils/logger.js'

export class MockupRiskProfileProviderService {
  constructor() {
    // NO caching per requirements - always real-time data
  }

  /**
   * Get all available risk profiles with current market conditions
   * In production, this would come from risk management team or compliance APIs
   */
  async getRiskProfiles() {
    await this.simulateNetworkDelay(200, 500)
    
    // Simulate market condition variations affecting APY ranges
    const marketCondition = Math.random()
    const apyMultiplier = marketCondition < 0.3 ? 0.8 : marketCondition > 0.7 ? 1.2 : 1.0

    return [
      {
        id: 'conservative',
        name: 'Conservative',
        description: 'Low risk, stable returns. Perfect for capital preservation.',
        apyRange: {
          min: Math.round(3 * apyMultiplier * 10) / 10,
          max: Math.round(5 * apyMultiplier * 10) / 10
        },
        riskScore: 1,
        volatility: 'Very Low',
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        icon: '🛡️',
        characteristics: [
          'Capital preservation focus',
          'Minimal volatility',
          'Stable, predictable returns',
          'High liquidity'
        ],
        suitableFor: [
          'Emergency funds',
          'Short-term goals',
          'Risk-averse investors',
          'Stable income needs'
        ],
        marketExposure: {
          bonds: 70,
          stableCoins: 20,
          money_market: 10,
          equities: 0
        }
      },
      {
        id: 'moderate',
        name: 'Moderate',
        description: 'Balanced approach with moderate growth potential.',
        apyRange: {
          min: Math.round(5 * apyMultiplier * 10) / 10,
          max: Math.round(8 * apyMultiplier * 10) / 10
        },
        riskScore: 2,
        volatility: 'Low-Medium',
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        icon: '⚖️',
        characteristics: [
          'Balanced risk-return profile',
          'Moderate volatility',
          'Diversified exposure',
          'Growth with stability'
        ],
        suitableFor: [
          'Medium-term goals',
          'Retirement planning',
          'Income generation',
          'First-time investors'
        ],
        marketExposure: {
          bonds: 40,
          stableCoins: 20,
          equities: 25,
          alternatives: 15
        }
      },
      {
        id: 'balanced',
        name: 'Balanced',
        description: 'Seeks growth while maintaining reasonable risk levels.',
        apyRange: {
          min: Math.round(8 * apyMultiplier * 10) / 10,
          max: Math.round(15 * apyMultiplier * 10) / 10
        },
        riskScore: 3,
        volatility: 'Medium',
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        icon: '📊',
        characteristics: [
          'Growth-oriented strategy',
          'Moderate to high returns',
          'Diversified portfolio',
          'Medium-term volatility'
        ],
        suitableFor: [
          'Long-term goals',
          'Wealth building',
          'Education funding',
          'Career-focused savers'
        ],
        marketExposure: {
          equities: 50,
          bonds: 20,
          alternatives: 20,
          crypto: 10
        }
      },
      {
        id: 'aggressive',
        name: 'Aggressive',
        description: 'High growth potential with higher risk tolerance required.',
        apyRange: {
          min: Math.round(12 * apyMultiplier * 10) / 10,
          max: Math.round(25 * apyMultiplier * 10) / 10
        },
        riskScore: 4,
        volatility: 'High',
        color: 'text-red-600',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        icon: '🚀',
        characteristics: [
          'Maximum growth potential',
          'High volatility tolerance',
          'Long-term focus',
          'Active management'
        ],
        suitableFor: [
          'Long-term wealth building',
          'Young investors',
          'High risk tolerance',
          'Business ventures'
        ],
        marketExposure: {
          equities: 60,
          crypto: 25,
          alternatives: 10,
          bonds: 5
        }
      },
      {
        id: 'ultra_conservative',
        name: 'Ultra Conservative',
        description: 'Maximum capital protection with minimal risk.',
        apyRange: {
          min: Math.round(1.5 * apyMultiplier * 10) / 10,
          max: Math.round(3 * apyMultiplier * 10) / 10
        },
        riskScore: 0.5,
        volatility: 'Minimal',
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        icon: '🏦',
        characteristics: [
          'Capital protection priority',
          'Almost no volatility',
          'Bank-like returns',
          'Maximum liquidity'
        ],
        suitableFor: [
          'Emergency reserves',
          'Short-term parking',
          'Risk-free needs',
          'Elderly investors'
        ],
        marketExposure: {
          money_market: 60,
          government_bonds: 30,
          stableCoins: 10,
          equities: 0
        }
      }
    ]
  }

  /**
   * Get risk profile by ID
   */
  async getRiskProfileById(profileId) {
    await this.simulateNetworkDelay(100, 300)
    
    const allProfiles = await this.getRiskProfiles()
    return allProfiles.find(profile => profile.id === profileId)
  }

  /**
   * Get risk profiles suitable for specific investment amount
   */
  async getRiskProfilesForAmount(amount) {
    await this.simulateNetworkDelay(150, 400)
    
    const allProfiles = await this.getRiskProfiles()
    
    // Different risk profiles might be suitable based on amount
    if (amount < 1000) {
      // Small amounts - recommend conservative approaches
      return allProfiles.filter(p => ['ultra_conservative', 'conservative', 'moderate'].includes(p.id))
    } else if (amount < 10000) {
      // Medium amounts - most profiles suitable
      return allProfiles.filter(p => p.id !== 'ultra_conservative')
    } else {
      // Large amounts - all profiles available
      return allProfiles
    }
  }

  /**
   * Get risk assessment questionnaire
   * In production, this would come from compliance/risk management APIs
   */
  async getRiskAssessmentQuestionnaire() {
    await this.simulateNetworkDelay(200, 600)
    
    return {
      questions: [
        {
          id: 'investment_timeline',
          question: 'What is your investment timeline?',
          type: 'single_choice',
          options: [
            { value: 'less_than_1_year', label: 'Less than 1 year', riskScore: 0 },
            { value: '1_to_3_years', label: '1-3 years', riskScore: 1 },
            { value: '3_to_5_years', label: '3-5 years', riskScore: 2 },
            { value: '5_to_10_years', label: '5-10 years', riskScore: 3 },
            { value: 'more_than_10_years', label: 'More than 10 years', riskScore: 4 }
          ]
        },
        {
          id: 'risk_tolerance',
          question: 'How would you react to a 20% portfolio decline?',
          type: 'single_choice',
          options: [
            { value: 'sell_immediately', label: 'Sell immediately to prevent further losses', riskScore: 0 },
            { value: 'sell_some', label: 'Sell some investments', riskScore: 1 },
            { value: 'hold_steady', label: 'Hold steady and wait', riskScore: 2 },
            { value: 'buy_more', label: 'Buy more at lower prices', riskScore: 4 }
          ]
        },
        {
          id: 'income_stability',
          question: 'How stable is your income?',
          type: 'single_choice',
          options: [
            { value: 'very_unstable', label: 'Very unstable or irregular', riskScore: 0 },
            { value: 'somewhat_unstable', label: 'Somewhat unstable', riskScore: 1 },
            { value: 'stable', label: 'Stable with regular income', riskScore: 2 },
            { value: 'very_stable', label: 'Very stable with multiple sources', riskScore: 3 }
          ]
        },
        {
          id: 'investment_experience',
          question: 'What is your investment experience?',
          type: 'single_choice',
          options: [
            { value: 'beginner', label: 'Beginner - new to investing', riskScore: 1 },
            { value: 'intermediate', label: 'Intermediate - some experience', riskScore: 2 },
            { value: 'experienced', label: 'Experienced investor', riskScore: 3 },
            { value: 'expert', label: 'Expert - professional level', riskScore: 4 }
          ]
        },
        {
          id: 'financial_goals',
          question: 'What is your primary financial goal?',
          type: 'single_choice',
          options: [
            { value: 'preserve_capital', label: 'Preserve capital', riskScore: 0 },
            { value: 'generate_income', label: 'Generate steady income', riskScore: 1 },
            { value: 'balanced_growth', label: 'Balanced growth and income', riskScore: 2 },
            { value: 'capital_growth', label: 'Capital growth', riskScore: 3 },
            { value: 'maximize_returns', label: 'Maximize returns', riskScore: 4 }
          ]
        }
      ],
      scoring: {
        ultra_conservative: { min: 0, max: 3 },
        conservative: { min: 4, max: 7 },
        moderate: { min: 8, max: 11 },
        balanced: { min: 12, max: 15 },
        aggressive: { min: 16, max: 20 }
      }
    }
  }

  /**
   * Calculate recommended risk profile based on assessment answers
   */
  async calculateRiskProfile(answers) {
    await this.simulateNetworkDelay(100, 300)
    
    const questionnaire = await this.getRiskAssessmentQuestionnaire()
    const profiles = await this.getRiskProfiles()
    
    // Calculate total risk score
    let totalScore = 0
    for (const [questionId, answerValue] of Object.entries(answers)) {
      const question = questionnaire.questions.find(q => q.id === questionId)
      if (question) {
        const option = question.options.find(opt => opt.value === answerValue)
        if (option) {
          totalScore += option.riskScore
        }
      }
    }
    
    // Find matching risk profile based on score
    for (const [profileId, scoreRange] of Object.entries(questionnaire.scoring)) {
      if (totalScore >= scoreRange.min && totalScore <= scoreRange.max) {
        const profile = profiles.find(p => p.id === profileId)
        return {
          recommendedProfile: profile,
          totalScore,
          maxScore: 20,
          confidence: Math.min(95, 60 + (totalScore * 2)) // 60-95% confidence
        }
      }
    }
    
    // Fallback to moderate if no match
    return {
      recommendedProfile: profiles.find(p => p.id === 'moderate'),
      totalScore,
      maxScore: 20,
      confidence: 50
    }
  }

  /**
   * Get market-adjusted APY ranges
   * In production, this would factor in real market conditions
   */
  async getMarketAdjustedRanges() {
    await this.simulateNetworkDelay(300, 700)
    
    const profiles = await this.getRiskProfiles()
    const marketConditions = {
      trend: Math.random() > 0.5 ? 'bullish' : 'bearish',
      volatility: Math.random() * 100,
      adjustment: (Math.random() - 0.5) * 0.3 // ±15% adjustment
    }
    
    return {
      marketConditions,
      adjustedProfiles: profiles.map(profile => ({
        ...profile,
        currentApyRange: {
          min: Math.max(0.1, profile.apyRange.min * (1 + marketConditions.adjustment)),
          max: Math.max(0.5, profile.apyRange.max * (1 + marketConditions.adjustment))
        }
      }))
    }
  }

  /**
   * Get all risk profile data in one call - REAL TIME ONLY
   * In production, this could be a single API call or aggregated endpoint
   * NO CACHING - always fresh data
   */
  async getAllRiskData() {
    // In production, this would be a single API call or parallel calls
    const [profiles, questionnaire, marketData] = await Promise.all([
      this.getRiskProfiles(),
      this.getRiskAssessmentQuestionnaire(),
      this.getMarketAdjustedRanges()
    ])

    const allRiskData = {
      profiles,
      questionnaire,
      marketData,
      timestamp: Date.now()
    }

    return allRiskData
  }

  /**
   * Simulate realistic network delay for API calls
   */
  async simulateNetworkDelay(minMs = 150, maxMs = 600) {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check method - simulates risk management provider availability
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(50, 200)
      
      // Simulate occasional provider outages (1% chance)
      if (Math.random() < 0.01) {
        throw new Error('Mockup risk profile provider temporarily unavailable')
      }
      
      const profiles = await this.getRiskProfiles()
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        latency: Math.random() * 300 + 150, // 150-450ms
        profileCount: profiles.length,
        marketDataCurrent: true
      }
    } catch (error) {
      return {
        status: 'unhealthy',
        error: error.message,
        timestamp: Date.now()
      }
    }
  }
}

// Export singleton instance
export const mockupRiskProfileProviderService = new MockupRiskProfileProviderService()

// Export class for testing
export default MockupRiskProfileProviderService