/**
 * Mockup Investment Category Provider Service
 * Simulates 3rd party investment category management APIs with realistic response times
 * This will be replaced with real CMS integrations (Contentful, Strapi, etc.)
 */

import logger from '../../utils/logger.js'

export class MockupInvestmentCategoryProviderService {
  constructor() {
    // NO caching per requirements - always real-time data
  }

  /**
   * Get investment categories with dynamic configuration
   * In production, this would come from CMS or asset management systems
   */
  async getInvestmentCategories(userProfile = {}, marketConditions = {}) {
    await this.simulateNetworkDelay(300, 800)
    
    // Dynamic category availability based on user profile and market conditions
    const isAvailable = (category) => {
      const baseAvailability = Math.random() > 0.05 // 95% base availability
      const userAccess = this.hasUserAccess(category, userProfile)
      const marketAccess = this.hasMarketAccess(category, marketConditions)
      
      return baseAvailability && userAccess && marketAccess
    }

    return {
      crypto: {
        id: 'crypto',
        name: 'Cryptocurrency',
        slug: 'crypto',
        description: 'Digital assets and cryptocurrencies with high growth potential',
        longDescription: 'Invest in the future of digital finance with cryptocurrencies. From established coins like Bitcoin and Ethereum to emerging altcoins, crypto offers unprecedented growth opportunities.',
        icon: 'bitcoin',
        iconComponent: 'Bitcoin',
        color: {
          primary: 'bg-orange-100 text-orange-800',
          accent: 'bg-orange-500',
          gradient: 'from-orange-400 to-orange-600'
        },
        riskLevel: 'high',
        expectedReturn: this.generateReturnRange(15, 45),
        volatility: this.generateVolatilityRange(25, 60),
        liquidityScore: this.generateScore(85, 95),
        available: isAvailable('crypto'),
        minInvestment: this.generateMinInvestment(1, 10),
        maxInvestment: this.generateMaxInvestment(1000000, 10000000),
        assetSymbols: ['BTC', 'ETH', 'SOL', 'SUI'],
        popularAssets: this.getPopularAssets(['BTC', 'ETH', 'SOL']),
        featuredAssets: this.getFeaturedAssets(['BTC', 'ETH']),
        marketCap: this.generateMarketCap(1500000000000, 2500000000000), // $1.5T - $2.5T
        performance: this.generatePerformanceMetrics(),
        supportedChains: ['ethereum', 'solana', 'sui', 'bitcoin'],
        tradingHours: '24/7',
        category: 'alternative',
        tags: ['digital', 'decentralized', 'volatile', 'emerging'],
        educationalResources: [
          {
            title: 'Cryptocurrency Basics',
            url: '/learn/crypto-basics',
            difficulty: 'beginner',
            readTime: '10 min'
          },
          {
            title: 'Blockchain Technology Explained',
            url: '/learn/blockchain',
            difficulty: 'intermediate',
            readTime: '15 min'
          }
        ]
      },

      stocks: {
        id: 'stocks',
        name: 'Stocks & Equities',
        slug: 'stocks',
        description: 'Traditional equity investments in public companies',
        longDescription: 'Build wealth through ownership in the world\'s leading companies. From growth stocks to dividend aristocrats, equities offer long-term wealth building potential.',
        icon: 'trending_up',
        iconComponent: 'TrendingUp',
        color: {
          primary: 'bg-blue-100 text-blue-800',
          accent: 'bg-blue-500',
          gradient: 'from-blue-400 to-blue-600'
        },
        riskLevel: 'medium',
        expectedReturn: this.generateReturnRange(8, 18),
        volatility: this.generateVolatilityRange(15, 35),
        liquidityScore: this.generateScore(90, 98),
        available: isAvailable('stocks'),
        minInvestment: this.generateMinInvestment(1, 25),
        maxInvestment: this.generateMaxInvestment(500000, 5000000),
        assetSymbols: ['MAG7', 'SPX', 'QQQ', 'VTI'],
        popularAssets: this.getPopularAssets(['MAG7', 'SPX']),
        featuredAssets: this.getFeaturedAssets(['SPX']),
        marketCap: this.generateMarketCap(45000000000000, 55000000000000), // $45T - $55T
        performance: this.generatePerformanceMetrics(),
        supportedChains: ['solana', 'ethereum'], // Tokenized stocks
        tradingHours: 'Market Hours (9:30 AM - 4:00 PM ET)',
        category: 'traditional',
        tags: ['equity', 'dividends', 'growth', 'established'],
        sectors: [
          { name: 'Technology', allocation: 28.5, performance: '+12.3%' },
          { name: 'Healthcare', allocation: 13.2, performance: '+8.7%' },
          { name: 'Financial', allocation: 11.8, performance: '+15.2%' },
          { name: 'Consumer', allocation: 10.4, performance: '+6.9%' }
        ],
        educationalResources: [
          {
            title: 'Stock Market Fundamentals',
            url: '/learn/stocks-basics',
            difficulty: 'beginner',
            readTime: '12 min'
          },
          {
            title: 'Value vs Growth Investing',
            url: '/learn/investing-styles',
            difficulty: 'intermediate',
            readTime: '18 min'
          }
        ]
      },

      gold: {
        id: 'gold',
        name: 'Precious Metals',
        slug: 'gold',
        description: 'Gold-backed digital assets and precious metal investments',
        longDescription: 'Protect your wealth with time-tested precious metals. Digital gold tokens provide easy access to gold investment without physical storage concerns.',
        icon: 'coins',
        iconComponent: 'Coins',
        color: {
          primary: 'bg-yellow-100 text-yellow-800',
          accent: 'bg-yellow-500',
          gradient: 'from-yellow-400 to-yellow-600'
        },
        riskLevel: 'low',
        expectedReturn: this.generateReturnRange(3, 8),
        volatility: this.generateVolatilityRange(8, 20),
        liquidityScore: this.generateScore(75, 88),
        available: isAvailable('gold'),
        minInvestment: this.generateMinInvestment(10, 50),
        maxInvestment: this.generateMaxInvestment(2000000, 20000000),
        assetSymbols: ['PAXG', 'XAUT', 'GOLD'],
        popularAssets: this.getPopularAssets(['PAXG', 'XAUT']),
        featuredAssets: this.getFeaturedAssets(['PAXG']),
        marketCap: this.generateMarketCap(12000000000000, 15000000000000), // $12T - $15T
        performance: this.generatePerformanceMetrics(),
        supportedChains: ['ethereum'],
        tradingHours: '24/7',
        category: 'commodities',
        tags: ['hedge', 'inflation', 'store_of_value', 'stable'],
        backed: true,
        backingType: 'physical_gold',
        custodian: 'LBMA certified vaults',
        auditFrequency: 'monthly',
        educationalResources: [
          {
            title: 'Gold as an Investment',
            url: '/learn/gold-investing',
            difficulty: 'beginner',
            readTime: '8 min'
          },
          {
            title: 'Digital vs Physical Gold',
            url: '/learn/digital-gold',
            difficulty: 'intermediate',
            readTime: '12 min'
          }
        ]
      },

      real_estate: {
        id: 'real_estate',
        name: 'Real Estate',
        slug: 'real-estate',
        description: 'Tokenized real estate investments and REITs',
        longDescription: 'Access real estate markets through tokenized properties and Real Estate Investment Trusts. Diversify into property without the hassle of direct ownership.',
        icon: 'building',
        iconComponent: 'Building',
        color: {
          primary: 'bg-green-100 text-green-800',
          accent: 'bg-green-500',
          gradient: 'from-green-400 to-green-600'
        },
        riskLevel: 'medium',
        expectedReturn: this.generateReturnRange(6, 14),
        volatility: this.generateVolatilityRange(12, 25),
        liquidityScore: this.generateScore(65, 80),
        available: isAvailable('real_estate'),
        minInvestment: this.generateMinInvestment(100, 500),
        maxInvestment: this.generateMaxInvestment(1000000, 10000000),
        assetSymbols: ['REIT', 'VNQ', 'IYR'],
        popularAssets: this.getPopularAssets(['REIT', 'VNQ']),
        featuredAssets: this.getFeaturedAssets(['REIT']),
        marketCap: this.generateMarketCap(4000000000000, 6000000000000), // $4T - $6T
        performance: this.generatePerformanceMetrics(),
        supportedChains: ['solana', 'ethereum'],
        tradingHours: '24/7',
        category: 'alternative',
        tags: ['income', 'diversification', 'inflation_hedge', 'stable'],
        propertyTypes: [
          { type: 'Residential', allocation: 35.2, yield: '4.2%' },
          { type: 'Commercial', allocation: 28.7, yield: '5.8%' },
          { type: 'Industrial', allocation: 18.4, yield: '6.1%' },
          { type: 'Retail', allocation: 17.7, yield: '3.9%' }
        ],
        geographicExposure: [
          { region: 'US', allocation: 42.5 },
          { region: 'Europe', allocation: 28.3 },
          { region: 'Asia', allocation: 20.1 },
          { region: 'Other', allocation: 9.1 }
        ],
        educationalResources: [
          {
            title: 'REIT Investment Guide',
            url: '/learn/reit-basics',
            difficulty: 'beginner',
            readTime: '14 min'
          },
          {
            title: 'Tokenized Real Estate Explained',
            url: '/learn/tokenized-real-estate',
            difficulty: 'intermediate',
            readTime: '16 min'
          }
        ]
      },

      bonds: {
        id: 'bonds',
        name: 'Fixed Income',
        slug: 'bonds',
        description: 'Government and corporate bonds for stable income',
        longDescription: 'Generate steady income through government and corporate bonds. Fixed income investments provide stability and regular interest payments to your portfolio.',
        icon: 'shield',
        iconComponent: 'Shield',
        color: {
          primary: 'bg-purple-100 text-purple-800',
          accent: 'bg-purple-500',
          gradient: 'from-purple-400 to-purple-600'
        },
        riskLevel: 'low',
        expectedReturn: this.generateReturnRange(2, 6),
        volatility: this.generateVolatilityRange(3, 12),
        liquidityScore: this.generateScore(88, 96),
        available: isAvailable('bonds'),
        minInvestment: this.generateMinInvestment(25, 100),
        maxInvestment: this.generateMaxInvestment(5000000, 50000000),
        assetSymbols: ['BND', 'GOVT', 'CORP', 'TIP'],
        popularAssets: this.getPopularAssets(['BND', 'GOVT']),
        featuredAssets: this.getFeaturedAssets(['GOVT']),
        marketCap: this.generateMarketCap(120000000000000, 130000000000000), // $120T - $130T
        performance: this.generatePerformanceMetrics(),
        supportedChains: ['ethereum'],
        tradingHours: 'Market Hours (9:00 AM - 5:00 PM ET)',
        category: 'fixed_income',
        tags: ['stable', 'income', 'capital_preservation', 'low_risk'],
        bondTypes: [
          { type: 'Government', allocation: 45.8, yield: '3.2%', duration: '7.2 years' },
          { type: 'Corporate', allocation: 32.4, yield: '4.8%', duration: '6.8 years' },
          { type: 'Municipal', allocation: 12.6, yield: '3.9%', duration: '8.1 years' },
          { type: 'International', allocation: 9.2, yield: '4.1%', duration: '6.5 years' }
        ],
        creditQuality: [
          { rating: 'AAA', allocation: 28.5 },
          { rating: 'AA', allocation: 24.2 },
          { rating: 'A', allocation: 26.8 },
          { rating: 'BBB', allocation: 20.5 }
        ],
        educationalResources: [
          {
            title: 'Bond Investing Fundamentals',
            url: '/learn/bonds-basics',
            difficulty: 'beginner',
            readTime: '16 min'
          },
          {
            title: 'Interest Rate Risk Explained',
            url: '/learn/interest-rate-risk',
            difficulty: 'intermediate',
            readTime: '20 min'
          }
        ]
      }
    }
  }

  /**
   * Get category performance analytics
   * In production, this would come from financial data providers
   */
  async getCategoryPerformanceAnalytics(timeframe = '1Y') {
    await this.simulateNetworkDelay(400, 900)
    
    return {
      crypto: {
        return: this.generatePerformanceData(timeframe, 85.4),
        volatility: 45.2,
        sharpeRatio: 1.89,
        maxDrawdown: -32.5,
        correlationWithSP500: 0.42,
        trend: 'bullish',
        sentiment: this.generateSentimentData(),
        technicalIndicators: this.generateTechnicalIndicators()
      },
      
      stocks: {
        return: this.generatePerformanceData(timeframe, 12.8),
        volatility: 18.7,
        sharpeRatio: 0.68,
        maxDrawdown: -15.2,
        correlationWithSP500: 0.95,
        trend: 'bullish',
        sentiment: this.generateSentimentData(),
        technicalIndicators: this.generateTechnicalIndicators()
      },
      
      gold: {
        return: this.generatePerformanceData(timeframe, 5.3),
        volatility: 12.1,
        sharpeRatio: 0.44,
        maxDrawdown: -8.7,
        correlationWithSP500: -0.18,
        trend: 'neutral',
        sentiment: this.generateSentimentData(),
        technicalIndicators: this.generateTechnicalIndicators()
      },
      
      real_estate: {
        return: this.generatePerformanceData(timeframe, 8.9),
        volatility: 16.3,
        sharpeRatio: 0.55,
        maxDrawdown: -12.4,
        correlationWithSP500: 0.72,
        trend: 'bullish',
        sentiment: this.generateSentimentData(),
        technicalIndicators: this.generateTechnicalIndicators()
      },
      
      bonds: {
        return: this.generatePerformanceData(timeframe, 3.2),
        volatility: 4.8,
        sharpeRatio: 0.67,
        maxDrawdown: -3.1,
        correlationWithSP500: -0.25,
        trend: 'neutral',
        sentiment: this.generateSentimentData(),
        technicalIndicators: this.generateTechnicalIndicators()
      }
    }
  }

  /**
   * Get category allocation suggestions
   * In production, this would come from portfolio optimization algorithms
   */
  async getCategoryAllocationSuggestions(riskProfile = 'moderate', investmentHorizon = 'medium') {
    await this.simulateNetworkDelay(300, 700)
    
    const allocations = {
      conservative: {
        bonds: this.generateAllocation(50, 70),
        stocks: this.generateAllocation(20, 35),
        real_estate: this.generateAllocation(5, 15),
        gold: this.generateAllocation(5, 15),
        crypto: this.generateAllocation(0, 5)
      },
      
      moderate: {
        stocks: this.generateAllocation(40, 60),
        bonds: this.generateAllocation(25, 40),
        real_estate: this.generateAllocation(5, 15),
        gold: this.generateAllocation(5, 10),
        crypto: this.generateAllocation(0, 10)
      },
      
      aggressive: {
        stocks: this.generateAllocation(60, 80),
        crypto: this.generateAllocation(5, 20),
        real_estate: this.generateAllocation(5, 15),
        bonds: this.generateAllocation(0, 15),
        gold: this.generateAllocation(0, 10)
      }
    }
    
    const baseAllocation = allocations[riskProfile] || allocations.moderate
    
    // Adjust for investment horizon
    if (investmentHorizon === 'short') {
      // Increase bonds and reduce volatile assets
      if (baseAllocation.bonds) baseAllocation.bonds.suggested += 10
      if (baseAllocation.crypto) baseAllocation.crypto.suggested = Math.max(0, baseAllocation.crypto.suggested - 5)
    }
    
    if (investmentHorizon === 'long') {
      // Increase growth assets
      if (baseAllocation.stocks) baseAllocation.stocks.suggested += 5
      if (baseAllocation.crypto) baseAllocation.crypto.suggested += 3
      if (baseAllocation.bonds) baseAllocation.bonds.suggested = Math.max(0, baseAllocation.bonds.suggested - 8)
    }
    
    return {
      allocation: baseAllocation,
      totalPercentage: Object.values(baseAllocation).reduce((sum, cat) => sum + cat.suggested, 0),
      riskScore: this.calculateRiskScore(baseAllocation),
      expectedReturn: this.calculateExpectedReturn(baseAllocation),
      rebalanceFrequency: this.getRebalanceFrequency(riskProfile),
      explanation: this.getAllocationExplanation(riskProfile, investmentHorizon)
    }
  }

  /**
   * Get trending categories and market insights
   * In production, this would come from market intelligence systems
   */
  async getTrendingCategoriesAndInsights() {
    await this.simulateNetworkDelay(250, 600)
    
    return {
      trending: [
        {
          categoryId: 'crypto',
          rank: 1,
          changeInRank: 2,
          reasonsForTrending: ['Institutional adoption', 'ETF approvals', 'Regulatory clarity'],
          timeframe: '7d',
          searchVolume: this.generateTrendingMetrics(15000, 25000),
          investmentFlow: this.generateTrendingMetrics(500000000, 1500000000) // $500M - $1.5B
        },
        {
          categoryId: 'real_estate',
          rank: 2,
          changeInRank: -1,
          reasonsForTrending: ['Interest rate expectations', 'Inflation hedge', 'Supply constraints'],
          timeframe: '7d',
          searchVolume: this.generateTrendingMetrics(8000, 15000),
          investmentFlow: this.generateTrendingMetrics(300000000, 800000000)
        },
        {
          categoryId: 'gold',
          rank: 3,
          changeInRank: 1,
          reasonsForTrending: ['Geopolitical tensions', 'Currency devaluation', 'Safe haven demand'],
          timeframe: '7d',
          searchVolume: this.generateTrendingMetrics(5000, 12000),
          investmentFlow: this.generateTrendingMetrics(200000000, 600000000)
        }
      ],
      
      insights: [
        {
          type: 'market_shift',
          title: 'Crypto Correlation Decreasing',
          description: 'Cryptocurrency correlation with traditional markets has decreased to 6-month lows',
          impact: 'positive',
          affectedCategories: ['crypto'],
          confidence: 0.87,
          timeframe: '30d'
        },
        {
          type: 'sector_rotation',
          title: 'Flight to Quality Assets',
          description: 'Investors are rotating towards defensive assets amid market uncertainty',
          impact: 'neutral',
          affectedCategories: ['bonds', 'gold'],
          confidence: 0.92,
          timeframe: '14d'
        },
        {
          type: 'regulatory_update',
          title: 'New REIT Regulations',
          description: 'Favorable regulatory changes expected to boost real estate investment trusts',
          impact: 'positive',
          affectedCategories: ['real_estate'],
          confidence: 0.75,
          timeframe: '60d'
        }
      ],
      
      marketConditions: {
        volatility: this.generateMarketCondition('medium'),
        liquidity: this.generateMarketCondition('high'),
        sentiment: this.generateMarketCondition('cautiously_optimistic'),
        inflationExpectation: this.generatePercentage(2.5, 4.0),
        interestRateEnvironment: 'rising'
      }
    }
  }

  /**
   * Helper methods for data generation
   */
  
  hasUserAccess(categoryId, userProfile) {
    const accessRequirements = {
      crypto: userProfile.riskTolerance !== 'very_conservative',
      stocks: true, // Always accessible
      gold: true, // Always accessible
      real_estate: userProfile.minInvestment >= 100,
      bonds: true // Always accessible
    }
    
    return accessRequirements[categoryId] ?? true
  }

  hasMarketAccess(categoryId, marketConditions) {
    // Simulate market-based access restrictions
    if (marketConditions.volatility === 'extreme') {
      return categoryId !== 'crypto' // Restrict crypto during extreme volatility
    }
    return true
  }

  generateReturnRange(min, max) {
    const annual = min + Math.random() * (max - min)
    return {
      annual: Math.round(annual * 10) / 10,
      min: Math.round(min * 10) / 10,
      max: Math.round(max * 10) / 10,
      historical: this.generateHistoricalReturns()
    }
  }

  generateVolatilityRange(min, max) {
    return Math.round((min + Math.random() * (max - min)) * 10) / 10
  }

  generateScore(min, max) {
    return Math.round(min + Math.random() * (max - min))
  }

  generateMinInvestment(min, max) {
    return Math.round(min + Math.random() * (max - min))
  }

  generateMaxInvestment(min, max) {
    return Math.round(min + Math.random() * (max - min))
  }

  generateMarketCap(min, max) {
    return Math.round(min + Math.random() * (max - min))
  }

  generatePerformanceMetrics() {
    return {
      ytd: this.generatePercentage(-15, 35),
      '1m': this.generatePercentage(-8, 15),
      '3m': this.generatePercentage(-12, 25),
      '1y': this.generatePercentage(-20, 40),
      '3y': this.generatePercentage(-10, 60),
      '5y': this.generatePercentage(0, 120)
    }
  }

  generatePercentage(min, max) {
    return Math.round((min + Math.random() * (max - min)) * 10) / 10
  }

  generateAllocation(min, max) {
    const suggested = Math.round(min + Math.random() * (max - min))
    return {
      min,
      max,
      suggested,
      rationale: `Based on historical performance and risk characteristics`
    }
  }

  generateTrendingMetrics(min, max) {
    return Math.round(min + Math.random() * (max - min))
  }

  generateMarketCondition(condition) {
    const conditions = {
      low: Math.random() * 30,
      medium: 30 + Math.random() * 40,
      high: 70 + Math.random() * 30,
      cautiously_optimistic: 'Investors remain cautiously optimistic amid mixed signals'
    }
    
    return typeof conditions[condition] === 'string' ? conditions[condition] : Math.round(conditions[condition])
  }

  getPopularAssets(assets) {
    return assets.map(symbol => ({
      symbol,
      name: this.getAssetName(symbol),
      performance: this.generatePercentage(-10, 20),
      volume: Math.random() * 1000000000
    }))
  }

  getFeaturedAssets(assets) {
    return assets.map(symbol => ({
      symbol,
      name: this.getAssetName(symbol),
      featured: true,
      reason: 'Top performer this quarter'
    }))
  }

  getAssetName(symbol) {
    const names = {
      BTC: 'Bitcoin',
      ETH: 'Ethereum',
      SOL: 'Solana',
      SUI: 'Sui',
      MAG7: 'Magnificent 7 Stocks',
      SPX: 'S&P 500',
      PAXG: 'PAX Gold',
      XAUT: 'Tether Gold',
      REIT: 'Real Estate Investment Trust'
    }
    return names[symbol] || symbol
  }

  calculateRiskScore(allocation) {
    const riskWeights = {
      bonds: 1,
      gold: 2,
      real_estate: 3,
      stocks: 4,
      crypto: 5
    }
    
    let weightedRisk = 0
    let totalWeight = 0
    
    Object.entries(allocation).forEach(([category, data]) => {
      const weight = data.suggested
      const risk = riskWeights[category] || 3
      weightedRisk += weight * risk
      totalWeight += weight
    })
    
    return Math.round((weightedRisk / totalWeight) * 10) / 10
  }

  calculateExpectedReturn(allocation) {
    const returnEstimates = {
      bonds: 3.2,
      gold: 5.8,
      real_estate: 8.9,
      stocks: 12.8,
      crypto: 25.4
    }
    
    let weightedReturn = 0
    let totalWeight = 0
    
    Object.entries(allocation).forEach(([category, data]) => {
      const weight = data.suggested
      const expectedReturn = returnEstimates[category] || 8
      weightedReturn += weight * expectedReturn
      totalWeight += weight
    })
    
    return Math.round((weightedReturn / totalWeight) * 10) / 10
  }

  getRebalanceFrequency(riskProfile) {
    const frequencies = {
      conservative: 'quarterly',
      moderate: 'monthly',
      aggressive: 'weekly'
    }
    return frequencies[riskProfile] || 'monthly'
  }

  getAllocationExplanation(riskProfile, horizon) {
    return `This ${riskProfile} allocation is optimized for ${horizon}-term growth with appropriate risk management for your profile.`
  }

  generateHistoricalReturns() {
    return Array.from({length: 10}, () => this.generatePercentage(-15, 25))
  }

  generateSentimentData() {
    return {
      bullish: this.generatePercentage(20, 80),
      bearish: this.generatePercentage(10, 40),
      neutral: this.generatePercentage(15, 35)
    }
  }

  generateTechnicalIndicators() {
    return {
      rsi: Math.round(Math.random() * 100),
      macd: this.generatePercentage(-2, 2),
      movingAverages: {
        sma20: this.generatePercentage(-5, 5),
        sma50: this.generatePercentage(-8, 8),
        sma200: this.generatePercentage(-12, 12)
      }
    }
  }

  generatePerformanceData(timeframe, baseReturn) {
    const variation = baseReturn * 0.2 // 20% variation
    return baseReturn + (Math.random() - 0.5) * variation
  }

  /**
   * Get all investment category data in one call - REAL TIME ONLY
   * In production, this could be a single API call or aggregated endpoint
   * NO CACHING - always fresh data
   */
  async getAllInvestmentCategoryData(userProfile = {}, marketConditions = {}) {
    // In production, this would be a single API call or parallel calls
    const [categories, analytics, allocations, trending] = await Promise.all([
      this.getInvestmentCategories(userProfile, marketConditions),
      this.getCategoryPerformanceAnalytics(),
      this.getCategoryAllocationSuggestions(userProfile.riskTolerance, userProfile.investmentHorizon),
      this.getTrendingCategoriesAndInsights()
    ])

    const allCategoryData = {
      categories,
      analytics,
      allocations,
      trending,
      timestamp: Date.now()
    }

    return allCategoryData
  }

  /**
   * Simulate realistic network delay for API calls
   */
  async simulateNetworkDelay(minMs = 300, maxMs = 800) {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check method - simulates investment category provider availability
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(100, 300)
      
      // Simulate occasional CMS outages (1% chance)
      if (Math.random() < 0.01) {
        throw new Error('Mockup investment category provider temporarily unavailable')
      }
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        latency: Math.random() * 400 + 200, // 200-600ms
        totalCategories: 5,
        availableCategories: Math.floor(Math.random() * 2) + 4, // 4-5 available
        supportedAssets: ['BTC', 'ETH', 'SOL', 'SUI', 'MAG7', 'SPX', 'PAXG', 'XAUT', 'REIT'],
        dataProviders: ['CMS', 'Market Data', 'Analytics Engine'],
        lastCategoryUpdate: Date.now() - Math.random() * 3600000, // Within last hour
        performanceDataLatency: Math.random() * 60000 // Within last minute
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
export const mockupInvestmentCategoryProviderService = new MockupInvestmentCategoryProviderService()

// Export class for testing
export default MockupInvestmentCategoryProviderService