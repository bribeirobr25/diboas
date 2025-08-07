/**
 * Mockup Test Data Provider Service
 * Simulates dynamic test data generation for testing scenarios with realistic response times
 * This replaces static test mocks with dynamic, realistic data generation
 */

import logger from '../../utils/logger.js'

export class MockupTestDataProviderService {
  constructor() {
    // NO caching per requirements - always real-time data
    this.userSeed = Date.now()
    this.transactionSeed = Date.now() + 1000
  }

  /**
   * Generate realistic user test data
   * In production, this would come from test data management systems
   */
  async generateUserTestData(count = 10, userType = 'mixed') {
    await this.simulateNetworkDelay(200, 500)
    
    const users = []
    
    for (let i = 0; i < count; i++) {
      const userId = `test_user_${this.userSeed + i}`
      const userTypeSelected = userType === 'mixed' ? this.getRandomUserType() : userType
      
      const user = {
        id: userId,
        email: this.generateTestEmail(userId),
        firstName: this.generateFirstName(),
        lastName: this.generateLastName(),
        username: this.generateUsername(userId),
        
        // Account details
        accountType: userTypeSelected,
        status: this.generateAccountStatus(),
        tier: this.generateUserTier(userTypeSelected),
        kycLevel: this.generateKYCLevel(userTypeSelected),
        
        // Authentication
        emailVerified: this.generateBoolean(0.85),
        phoneVerified: this.generateBoolean(0.70),
        mfaEnabled: this.generateBoolean(0.45),
        lastLogin: this.generateRecentTimestamp(30), // Within last 30 days
        loginCount: this.generateNumber(1, 500),
        
        // Profile information
        dateOfBirth: this.generateDateOfBirth(),
        country: this.generateCountry(),
        phoneNumber: this.generatePhoneNumber(),
        avatar: this.generateAvatarUrl(userId),
        
        // Financial profile
        totalBalance: this.generateBalance(userTypeSelected),
        portfolioValue: this.generatePortfolioValue(userTypeSelected),
        riskTolerance: this.generateRiskTolerance(),
        investmentExperience: this.generateExperience(),
        
        // Activity data
        transactionCount: this.generateNumber(0, 200),
        lastTransactionDate: this.generateRecentTimestamp(7),
        activeStrategies: this.generateNumber(0, 5),
        
        // Preferences
        preferences: {
          language: this.generateLanguage(),
          timezone: this.generateTimezone(),
          currency: this.generateCurrency(),
          notifications: this.generateNotificationPreferences(),
          privacy: this.generatePrivacySettings()
        },
        
        // Metadata
        createdAt: this.generateCreationDate(),
        updatedAt: this.generateRecentTimestamp(10),
        source: 'test_data_generator',
        
        // Test-specific data
        testScenario: this.generateTestScenario(userTypeSelected),
        mockFlags: this.generateMockFlags(),
        expectedBehavior: this.generateExpectedBehavior(userTypeSelected)
      }
      
      users.push(user)
    }
    
    return {
      users,
      metadata: {
        count: users.length,
        userTypes: this.aggregateUserTypes(users),
        generatedAt: Date.now(),
        seed: this.userSeed,
        validityPeriod: '24 hours'
      }
    }
  }

  /**
   * Generate realistic transaction test data
   * In production, this would simulate various transaction scenarios
   */
  async generateTransactionTestData(count = 20, userId = null) {
    await this.simulateNetworkDelay(300, 700)
    
    const transactions = []
    
    for (let i = 0; i < count; i++) {
      const transactionId = `test_tx_${this.transactionSeed + i}`
      const transactionType = this.getRandomTransactionType()
      
      const transaction = {
        id: transactionId,
        userId: userId || `test_user_${this.generateNumber(1, 100)}`,
        hash: this.generateTransactionHash(),
        
        // Transaction details
        type: transactionType,
        status: this.generateTransactionStatus(),
        amount: this.generateTransactionAmount(transactionType),
        fee: this.generateTransactionFee(),
        
        // Assets
        fromAsset: this.generateAsset(),
        toAsset: transactionType === 'swap' ? this.generateAsset() : null,
        fromAmount: 0, // Will be calculated
        toAmount: 0, // Will be calculated
        
        // Network information
        network: this.generateNetwork(),
        blockNumber: this.generateBlockNumber(),
        gasUsed: this.generateGasUsed(),
        gasPrice: this.generateGasPrice(),
        
        // Timing
        createdAt: this.generateTransactionTimestamp(),
        confirmedAt: this.generateConfirmationTimestamp(),
        estimatedConfirmation: this.generateEstimatedConfirmation(),
        
        // Provider information
        provider: this.generateProvider(transactionType),
        aggregator: transactionType === 'swap' ? this.generateAggregator() : null,
        
        // Risk and compliance
        riskScore: this.generateRiskScore(),
        complianceChecks: this.generateComplianceChecks(),
        
        // User experience
        slippage: transactionType === 'swap' ? this.generateSlippage() : null,
        priceImpact: transactionType === 'swap' ? this.generatePriceImpact() : null,
        
        // Test-specific data
        testScenario: this.generateTransactionScenario(transactionType),
        expectedOutcome: this.generateExpectedOutcome(),
        errorSimulation: this.generateErrorSimulation()
      }
      
      // Calculate derived amounts
      if (transaction.type === 'swap' && transaction.toAsset) {
        transaction.fromAmount = transaction.amount
        transaction.toAmount = this.calculateSwapAmount(transaction.amount, transaction.fromAsset, transaction.toAsset)
      } else {
        transaction.fromAmount = transaction.amount
      }
      
      transactions.push(transaction)
    }
    
    return {
      transactions,
      metadata: {
        count: transactions.length,
        types: this.aggregateTransactionTypes(transactions),
        networks: this.aggregateNetworks(transactions),
        totalValue: this.calculateTotalValue(transactions),
        generatedAt: Date.now(),
        seed: this.transactionSeed
      }
    }
  }

  /**
   * Generate portfolio test data
   * In production, this would create realistic portfolio scenarios
   */
  async generatePortfolioTestData(userId, complexity = 'medium') {
    await this.simulateNetworkDelay(250, 600)
    
    const assetCount = {
      simple: this.generateNumber(2, 5),
      medium: this.generateNumber(5, 12),
      complex: this.generateNumber(12, 25)
    }[complexity] || 8
    
    const totalValue = this.generateNumber(1000, 1000000)
    const assets = []
    let allocatedValue = 0
    
    for (let i = 0; i < assetCount; i++) {
      const asset = this.generateAsset()
      const isLastAsset = i === assetCount - 1
      const maxAllocation = isLastAsset ? totalValue - allocatedValue : totalValue * 0.4
      const value = isLastAsset ? totalValue - allocatedValue : this.generateNumber(100, maxAllocation)
      
      const quantity = this.calculateQuantityFromValue(value, asset)
      const currentPrice = this.generateAssetPrice(asset)
      
      const assetData = {
        asset,
        quantity,
        value,
        currentPrice,
        costBasis: this.generateCostBasis(currentPrice),
        allocation: (value / totalValue) * 100,
        
        // Performance
        unrealizedPnL: this.generateUnrealizedPnL(value),
        dayChange: this.generateDayChange(),
        weekChange: this.generateWeekChange(),
        monthChange: this.generateMonthChange(),
        
        // Acquisition
        acquiredDate: this.generateAcquisitionDate(),
        acquisitionPrice: this.generateAcquisitionPrice(currentPrice),
        acquisitionMethod: this.generateAcquisitionMethod(),
        
        // Staking/DeFi
        staked: this.generateBoolean(0.3),
        stakingRewards: this.generateStakingRewards(),
        liquidityProvision: this.generateBoolean(0.2),
        yieldFarming: this.generateBoolean(0.15),
        
        // Test scenarios
        liquidityLevel: this.generateLiquidityLevel(),
        volatilityLevel: this.generateVolatilityLevel(),
        testPrice: this.generateTestPriceScenario(currentPrice)
      }
      
      assets.push(assetData)
      allocatedValue += value
    }
    
    const portfolio = {
      userId,
      totalValue: allocatedValue,
      assets,
      
      // Performance metrics
      performance: {
        totalReturn: this.generateTotalReturn(),
        dayReturn: this.generateDayReturn(),
        weekReturn: this.generateWeekReturn(),
        monthReturn: this.generateMonthReturn(),
        yearReturn: this.generateYearReturn(),
        inception: this.generateInceptionReturn(),
        sharpeRatio: this.generateSharpeRatio(),
        maxDrawdown: this.generateMaxDrawdown(),
        volatility: this.generatePortfolioVolatility()
      },
      
      // Risk metrics
      risk: {
        riskScore: this.generatePortfolioRiskScore(),
        diversificationScore: this.generateDiversificationScore(assets),
        correlationRisk: this.generateCorrelationRisk(),
        liquidityRisk: this.generateLiquidityRisk(assets),
        concentrationRisk: this.generateConcentrationRisk(assets)
      },
      
      // Allocation breakdown
      allocation: {
        byAssetType: this.generateAssetTypeAllocation(assets),
        byNetwork: this.generateNetworkAllocation(assets),
        byRiskLevel: this.generateRiskLevelAllocation(assets),
        byCategory: this.generateCategoryAllocation(assets)
      },
      
      // Test configuration
      complexity,
      testScenarios: this.generatePortfolioTestScenarios(),
      lastRebalance: this.generateRecentTimestamp(30),
      nextRebalance: this.generateFutureTimestamp(30),
      
      // Metadata
      createdAt: this.generateCreationDate(),
      lastUpdated: this.generateRecentTimestamp(1),
      dataFreshness: this.generateNumber(1, 300) // seconds
    }
    
    return portfolio
  }

  /**
   * Generate strategy test data
   * In production, this would create various strategy testing scenarios
   */
  async generateStrategyTestData(count = 5, performanceType = 'mixed') {
    await this.simulateNetworkDelay(400, 900)
    
    const strategies = []
    
    for (let i = 0; i < count; i++) {
      const strategyId = `test_strategy_${Date.now()}_${i}`
      const strategyType = this.getRandomStrategyType()
      const performance = performanceType === 'mixed' ? 
        this.getRandomPerformanceType() : performanceType
      
      const strategy = {
        id: strategyId,
        name: this.generateStrategyName(strategyType),
        type: strategyType,
        description: this.generateStrategyDescription(strategyType),
        
        // Configuration
        riskLevel: this.generateRiskLevel(),
        investmentAmount: this.generateInvestmentAmount(),
        timeHorizon: this.generateTimeHorizon(),
        
        // Performance (based on performance type)
        performance: this.generateStrategyPerformance(performance),
        
        // Assets and allocation
        assets: this.generateStrategyAssets(strategyType),
        allocation: this.generateStrategyAllocation(),
        rebalanceFrequency: this.generateRebalanceFrequency(),
        
        // Costs
        managementFee: this.generateManagementFee(),
        performanceFee: this.generatePerformanceFee(),
        transactionCosts: this.generateTransactionCosts(),
        
        // Status
        status: this.generateStrategyStatus(),
        active: this.generateBoolean(0.75),
        autoRebalance: this.generateBoolean(0.85),
        
        // Backtesting
        backtestData: this.generateBacktestData(performance),
        benchmarkComparison: this.generateBenchmarkComparison(),
        
        // Risk metrics
        riskMetrics: {
          volatility: this.generateVolatility(),
          sharpeRatio: this.generateSharpeRatio(),
          maxDrawdown: this.generateMaxDrawdown(),
          beta: this.generateBeta(),
          alpha: this.generateAlpha()
        },
        
        // Test scenarios
        testScenarios: this.generateStrategyTestScenarios(strategyType),
        stressTests: this.generateStressTests(),
        
        // Metadata
        createdAt: this.generateCreationDate(),
        lastRebalance: this.generateRecentTimestamp(15),
        nextRebalance: this.generateFutureTimestamp(30),
        creator: 'test_system'
      }
      
      strategies.push(strategy)
    }
    
    return {
      strategies,
      metadata: {
        count: strategies.length,
        types: this.aggregateStrategyTypes(strategies),
        performanceDistribution: this.aggregatePerformanceDistribution(strategies),
        averageReturn: this.calculateAverageReturn(strategies),
        generatedAt: Date.now()
      }
    }
  }

  /**
   * Generate market data for testing
   * In production, this would simulate various market conditions
   */
  async generateMarketTestData(assets = ['BTC', 'ETH', 'SOL'], scenario = 'normal') {
    await this.simulateNetworkDelay(200, 500)
    
    const marketData = {}
    
    assets.forEach(asset => {
      marketData[asset] = {
        symbol: asset,
        price: this.generateAssetPrice(asset),
        change24h: this.generatePriceChange(scenario),
        volume24h: this.generateVolume(asset),
        marketCap: this.generateMarketCap(asset),
        
        // Technical indicators
        rsi: this.generateRSI(),
        macd: this.generateMACD(),
        movingAverages: this.generateMovingAverages(),
        
        // Price history (for charts)
        priceHistory: this.generatePriceHistory(asset, scenario),
        volumeHistory: this.generateVolumeHistory(asset),
        
        // Market sentiment
        sentiment: this.generateSentiment(),
        socialScore: this.generateSocialScore(),
        
        // Test scenarios
        testScenario: scenario,
        priceTargets: this.generatePriceTargets(asset),
        supportLevels: this.generateSupportLevels(asset),
        resistanceLevels: this.generateResistanceLevels(asset),
        
        // Metadata
        lastUpdated: this.generateRecentTimestamp(0.1), // Within last few minutes
        source: 'test_market_data',
        reliability: this.generateReliability()
      }
    })
    
    return {
      marketData,
      globalMetrics: {
        totalMarketCap: this.generateGlobalMarketCap(),
        totalVolume24h: this.generateGlobalVolume(),
        dominance: this.generateDominance(assets),
        fearGreedIndex: this.generateFearGreedIndex(),
        volatilityIndex: this.generateVolatilityIndex()
      },
      scenario,
      timestamp: Date.now()
    }
  }

  /**
   * Helper methods for generating realistic test data
   */
  
  getRandomUserType() {
    const types = ['basic', 'premium', 'institutional', 'whale']
    return types[Math.floor(Math.random() * types.length)]
  }

  getRandomTransactionType() {
    const types = ['buy', 'sell', 'swap', 'transfer', 'stake', 'unstake', 'deposit', 'withdraw']
    return types[Math.floor(Math.random() * types.length)]
  }

  getRandomStrategyType() {
    const types = ['conservative', 'balanced', 'aggressive', 'yield_farming', 'arbitrage', 'dca']
    return types[Math.floor(Math.random() * types.length)]
  }

  getRandomPerformanceType() {
    const types = ['excellent', 'good', 'average', 'poor']
    const weights = [0.15, 0.35, 0.35, 0.15] // Weighted distribution
    return this.weightedRandom(types, weights)
  }

  generateTestEmail(userId) {
    const domains = ['test.com', 'example.org', 'demo.net', 'staging.io']
    const domain = domains[Math.floor(Math.random() * domains.length)]
    return `${userId}@${domain}`
  }

  generateFirstName() {
    const names = ['John', 'Jane', 'Michael', 'Sarah', 'David', 'Emma', 'Chris', 'Anna', 'Robert', 'Lisa']
    return names[Math.floor(Math.random() * names.length)]
  }

  generateLastName() {
    const names = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Wilson', 'Moore']
    return names[Math.floor(Math.random() * names.length)]
  }

  generateAsset() {
    const assets = ['BTC', 'ETH', 'SOL', 'AVAX', 'MATIC', 'LINK', 'UNI', 'AAVE', 'USDC', 'USDT', 'DAI']
    return assets[Math.floor(Math.random() * assets.length)]
  }

  generateAssetPrice(asset) {
    const prices = {
      BTC: this.generateNumber(25000, 70000),
      ETH: this.generateNumber(1500, 4000),
      SOL: this.generateNumber(20, 200),
      USDC: 1.0,
      USDT: 1.0,
      DAI: 1.0
    }
    return prices[asset] || this.generateNumber(1, 100)
  }

  generateTransactionHash() {
    return '0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join('')
  }

  generateBalance(userType) {
    const ranges = {
      basic: [100, 5000],
      premium: [5000, 100000],
      institutional: [100000, 10000000],
      whale: [1000000, 100000000]
    }
    const range = ranges[userType] || ranges.basic
    return this.generateNumber(range[0], range[1])
  }

  generatePortfolioValue(userType) {
    const balance = this.generateBalance(userType)
    return Math.floor(balance * (0.6 + Math.random() * 0.4)) // 60-100% of balance invested
  }

  generateRecentTimestamp(daysAgo) {
    const now = Date.now()
    const maxAge = daysAgo * 24 * 60 * 60 * 1000
    return now - Math.floor(Math.random() * maxAge)
  }

  generateFutureTimestamp(daysFromNow) {
    const now = Date.now()
    const maxFuture = daysFromNow * 24 * 60 * 60 * 1000
    return now + Math.floor(Math.random() * maxFuture)
  }

  generateBoolean(probability = 0.5) {
    return Math.random() < probability
  }

  generateNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  generatePercentage(min, max) {
    return Math.round((min + Math.random() * (max - min)) * 100) / 100
  }

  weightedRandom(items, weights) {
    const random = Math.random()
    let sum = 0
    
    for (let i = 0; i < items.length; i++) {
      sum += weights[i]
      if (random <= sum) {
        return items[i]
      }
    }
    
    return items[items.length - 1]
  }

  // Additional helper methods would continue here...
  
  /**
   * Get comprehensive test data suite
   * NO CACHING - always fresh data
   */
  async getComprehensiveTestDataSuite(options = {}) {
    const {
      userCount = 10,
      transactionCount = 50,
      strategyCount = 5,
      includeMarketData = true,
      scenario = 'normal'
    } = options

    const [users, transactions, strategies, marketData] = await Promise.all([
      this.generateUserTestData(userCount),
      this.generateTransactionTestData(transactionCount),
      this.generateStrategyTestData(strategyCount),
      includeMarketData ? this.generateMarketTestData(['BTC', 'ETH', 'SOL'], scenario) : null
    ])

    // Generate portfolio data for first few users
    const portfolios = []
    for (let i = 0; i < Math.min(3, users.users.length); i++) {
      const portfolio = await this.generatePortfolioTestData(users.users[i].id, 'medium')
      portfolios.push(portfolio)
    }

    return {
      users,
      transactions,
      strategies,
      portfolios,
      marketData,
      metadata: {
        scenario,
        generatedAt: Date.now(),
        totalRecords: userCount + transactionCount + strategyCount + portfolios.length,
        dataTypes: ['users', 'transactions', 'strategies', 'portfolios', 'market_data'],
        validityPeriod: '24 hours'
      }
    }
  }

  /**
   * Simulate realistic network delay for API calls
   */
  async simulateNetworkDelay(minMs = 200, maxMs = 500) {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check method
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(50, 150)
      
      if (Math.random() < 0.005) {
        throw new Error('Test data provider temporarily unavailable')
      }
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        latency: Math.random() * 200 + 50,
        dataTypes: ['users', 'transactions', 'portfolios', 'strategies', 'market_data'],
        scenarios: ['normal', 'bull_market', 'bear_market', 'high_volatility', 'crash'],
        generationCapacity: {
          users: '1000/minute',
          transactions: '5000/minute',
          portfolios: '100/minute',
          strategies: '200/minute'
        },
        lastReset: Date.now() - Math.random() * 3600000,
        dataFreshness: 'real-time'
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
export const mockupTestDataProviderService = new MockupTestDataProviderService()

// Export class for testing
export default MockupTestDataProviderService