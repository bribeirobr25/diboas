/**
 * Mockup Lending Pool Provider Service
 * Simulates 3rd party DeFi lending protocol APIs with realistic response times
 * This will be replaced with real DeFi lending integrations (Aave, Compound, MakerDAO, etc.)
 */

import logger from '../../utils/logger.js'

export class MockupLendingPoolProviderService {
  constructor() {
    // NO caching per requirements - always real-time data
    this.baseRates = this.initializeBaseRates()
  }

  /**
   * Initialize baseline rates for realistic rate movements
   */
  initializeBaseRates() {
    return {
      supply: {
        USDC: 4.2,
        USDT: 3.8,
        DAI: 4.5,
        ETH: 2.1,
        WBTC: 1.8,
        LINK: 3.2,
        UNI: 2.9,
        AAVE: 3.4
      },
      borrow: {
        USDC: 6.8,
        USDT: 6.2,
        DAI: 7.1,
        ETH: 4.7,
        WBTC: 4.2,
        LINK: 8.1,
        UNI: 7.6,
        AAVE: 6.9
      }
    }
  }

  /**
   * Get lending pool configurations and rates
   * In production, this would come from DeFi protocol APIs
   */
  async getLendingPoolConfigurations(protocol = 'aave', network = 'ethereum') {
    await this.simulateNetworkDelay(300, 700)
    
    const generatePoolData = (asset, config = {}) => {
      const supplyBase = this.baseRates.supply[asset] || 3.0
      const borrowBase = this.baseRates.borrow[asset] || 6.0
      
      return {
        asset,
        address: this.generateContractAddress(),
        
        supplyRate: {
          current: this.generateDynamicRate(supplyBase, 0.5),
          avg30d: this.generateDynamicRate(supplyBase, 0.3),
          trend: this.getTrend(),
          history: this.generateRateHistory(supplyBase, 30)
        },
        
        borrowRate: {
          current: this.generateDynamicRate(borrowBase, 0.8),
          variable: this.generateDynamicRate(borrowBase, 0.8),
          stable: borrowBase > supplyBase ? this.generateDynamicRate(borrowBase + 1.5, 0.3) : null,
          avg30d: this.generateDynamicRate(borrowBase, 0.4),
          trend: this.getTrend(),
          history: this.generateRateHistory(borrowBase, 30)
        },
        
        liquidity: {
          totalSupply: this.generateLiquidity(asset, 'supply'),
          totalBorrow: this.generateLiquidity(asset, 'borrow'),
          availableLiquidity: 0, // Will be calculated
          utilizationRate: 0, // Will be calculated
          liquidityIndex: this.generateIndex(),
          borrowIndex: this.generateIndex()
        },
        
        collateral: {
          enabled: this.isCollateralEnabled(asset),
          ltv: this.generateLTV(asset),
          liquidationThreshold: this.generateLiquidationThreshold(asset),
          liquidationBonus: this.generateLiquidationBonus(asset),
          reserveFactor: this.generateReserveFactor(asset)
        },
        
        caps: {
          supplyCap: this.generateCap(asset, 'supply'),
          borrowCap: this.generateCap(asset, 'borrow'),
          isolated: this.isIsolatedAsset(asset),
          siloed: this.isSiloedAsset(asset)
        },
        
        oracle: {
          priceSource: this.getPriceSource(asset),
          currentPrice: this.generatePrice(asset),
          lastUpdate: Date.now() - Math.random() * 300000, // Within last 5 minutes
          heartbeat: this.generateHeartbeat(asset),
          deviation: this.generateDeviation()
        },
        
        protocol: {
          name: protocol,
          version: this.generateVersion(),
          network,
          fees: this.generateProtocolFees(protocol),
          governance: this.getGovernanceInfo(protocol)
        }
      }
    }

    // Generate pool data for major assets
    const pools = {}
    const supportedAssets = ['USDC', 'USDT', 'DAI', 'ETH', 'WBTC', 'LINK', 'UNI', 'AAVE']
    
    supportedAssets.forEach(asset => {
      pools[asset] = generatePoolData(asset)
      
      // Calculate derived values
      pools[asset].liquidity.availableLiquidity = 
        pools[asset].liquidity.totalSupply - pools[asset].liquidity.totalBorrow
      
      pools[asset].liquidity.utilizationRate = 
        pools[asset].liquidity.totalBorrow / pools[asset].liquidity.totalSupply * 100
    })

    return {
      protocol,
      network,
      pools,
      
      globalMetrics: {
        totalValueLocked: Object.values(pools).reduce((sum, pool) => 
          sum + pool.liquidity.totalSupply * pool.oracle.currentPrice, 0),
        totalBorrowed: Object.values(pools).reduce((sum, pool) => 
          sum + pool.liquidity.totalBorrow * pool.oracle.currentPrice, 0),
        totalUsers: this.generateNumber(50000, 500000),
        avgUtilization: Object.values(pools).reduce((sum, pool) => 
          sum + pool.liquidity.utilizationRate, 0) / supportedAssets.length,
        healthFactor: this.generateHealthFactor()
      },
      
      risk: {
        liquidations24h: this.generateLiquidationsData(),
        badDebt: this.generateBadDebtData(),
        concentrationRisk: this.generateConcentrationRisk(pools),
        smartContractRisk: this.getSmartContractRisk(protocol)
      },
      
      timestamp: Date.now(),
      blockNumber: this.generateBlockNumber(network),
      nextUpdate: Date.now() + this.generateInterval(30000, 180000) // 30s-3min
    }
  }

  /**
   * Get flash loan configurations
   * In production, this would come from flash loan providers
   */
  async getFlashLoanConfigurations(protocol = 'aave') {
    await this.simulateNetworkDelay(200, 500)
    
    const generateFlashLoanAsset = (asset) => ({
      asset,
      available: true,
      maxAmount: this.generateFlashLoanCap(asset),
      fee: this.generateFlashLoanFee(asset, protocol),
      premiumRate: this.generatePremiumRate(protocol),
      
      requirements: {
        callback: true,
        gasLimit: this.generateGasLimit(),
        minGasPrice: this.generateGasPrice(1, 50),
        flashLoanContract: this.generateContractAddress()
      },
      
      liquidityCheck: {
        currentLiquidity: this.generateLiquidity(asset, 'flash'),
        reservedAmount: this.generateReservedAmount(asset),
        availableAmount: 0 // Will be calculated
      },
      
      riskParameters: {
        maxUtilization: this.generatePercentage(85, 95),
        pauseThreshold: this.generatePercentage(90, 98),
        emergencyPause: false,
        lastLiquidityCheck: Date.now() - Math.random() * 60000
      }
    })

    const flashLoanAssets = {}
    const supportedAssets = ['USDC', 'USDT', 'DAI', 'ETH', 'WBTC']
    
    supportedAssets.forEach(asset => {
      flashLoanAssets[asset] = generateFlashLoanAsset(asset)
      flashLoanAssets[asset].liquidityCheck.availableAmount = 
        flashLoanAssets[asset].liquidityCheck.currentLiquidity - 
        flashLoanAssets[asset].liquidityCheck.reservedAmount
    })

    return {
      protocol,
      flashLoanAssets,
      
      globalConfig: {
        enabled: true,
        maxSimultaneousLoans: this.generateNumber(100, 1000),
        totalFlashLoaned24h: this.generateVolume('FLASH', 100000000),
        protocolRevenue24h: this.generateRevenue(),
        averageFlashLoanSize: this.generateAmount(50000, 5000000),
        
        restrictions: {
          blacklistedAddresses: this.generateNumber(0, 50),
          geographicRestrictions: ['US-sanctioned', 'OFAC-listed'],
          contractSizeLimit: this.generateAmount(100000000, 1000000000)
        }
      },
      
      useCases: {
        arbitrage: {
          enabled: true,
          popularity: this.generatePercentage(40, 60),
          averageProfit: this.generateAmount(100, 10000),
          successRate: this.generatePercentage(65, 85)
        },
        
        liquidation: {
          enabled: true,
          popularity: this.generatePercentage(20, 35),
          averageProfit: this.generateAmount(500, 20000),
          riskLevel: 'high'
        },
        
        collateralSwap: {
          enabled: true,
          popularity: this.generatePercentage(15, 25),
          averageAmount: this.generateAmount(10000, 500000),
          gasOptimization: true
        },
        
        refinancing: {
          enabled: true,
          popularity: this.generatePercentage(10, 20),
          averageSavings: this.generateAmount(200, 5000),
          timeToComplete: this.generateNumber(1, 5) // blocks
        }
      },
      
      monitoring: {
        failureRate: this.generatePercentage(2, 8),
        averageExecutionTime: this.generateLatency(15000, 45000), // milliseconds
        gasUsageAverage: this.generateGasAmount(200000, 800000),
        mevProtection: this.generateAvailability(0.85),
        frontrunningDetection: true
      },
      
      timestamp: Date.now(),
      lastUpdate: Date.now() - Math.random() * 300000
    }
  }

  /**
   * Get liquidation configurations and data
   * In production, this would come from liquidation monitoring services
   */
  async getLiquidationConfigurations(protocol = 'aave') {
    await this.simulateNetworkDelay(250, 600)
    
    return {
      protocol,
      
      liquidationParameters: {
        healthFactorThreshold: 1.0,
        maxLiquidationRatio: this.generatePercentage(50, 100),
        liquidationBonus: this.generatePercentage(5, 15),
        
        closeFactorRange: {
          min: this.generatePercentage(10, 25),
          max: this.generatePercentage(75, 100)
        },
        
        gracePeriod: this.generateNumber(0, 5), // blocks
        penaltyRate: this.generatePercentage(2, 8),
        
        gasOptimization: {
          enabled: true,
          maxGasPrice: this.generateGasPrice(50, 500),
          priorityFee: this.generateGasPrice(1, 20)
        }
      },
      
      liquidationOpportunities: {
        currentOpportunities: this.generateLiquidationOpportunities(),
        totalValueAtRisk: this.generateAmount(1000000, 50000000),
        averagePositionSize: this.generateAmount(5000, 500000),
        
        riskDistribution: {
          lowRisk: this.generatePercentage(60, 80), // HF 1.0-1.1
          mediumRisk: this.generatePercentage(15, 30), // HF 0.95-1.0
          highRisk: this.generatePercentage(5, 15) // HF < 0.95
        },
        
        assetDistribution: this.generateAssetDistribution(),
        collateralTypes: this.generateCollateralDistribution()
      },
      
      liquidationHistory: {
        last24h: {
          totalLiquidations: this.generateNumber(50, 500),
          totalValue: this.generateAmount(5000000, 100000000),
          averageSize: this.generateAmount(10000, 200000),
          largestLiquidation: this.generateAmount(500000, 10000000)
        },
        
        trends: {
          weeklyTrend: this.getTrend(),
          monthlyTrend: this.getTrend(),
          seasonality: this.generateSeasonality(),
          volatilityCorrelation: this.generateCorrelation()
        }
      },
      
      liquidators: {
        totalActiveLiquidators: this.generateNumber(100, 2000),
        topLiquidators: this.generateTopLiquidators(),
        competitiveness: this.generateCompetitiveness(),
        
        strategies: {
          automated: this.generatePercentage(70, 90),
          manual: this.generatePercentage(10, 30),
          hybrid: this.generatePercentage(15, 25)
        },
        
        tools: {
          bots: this.generateNumber(500, 5000),
          monitoring: ['telegram_alerts', 'discord_bots', 'custom_dashboards'],
          apis: ['compound_api', 'aave_api', 'maker_api']
        }
      },
      
      protocolRisk: {
        cascadingLiquidations: this.generateRiskLevel(),
        marketCorrelations: this.generateCorrelationRisk(),
        systemicRisk: this.generateSystemicRisk(),
        
        stressTests: {
          priceShock20: this.generateStressTestResults(20),
          priceShock50: this.generateStressTestResults(50),
          liquidityCrunch: this.generateLiquidityCrunch(),
          gasSpike: this.generateGasSpike()
        }
      },
      
      automation: {
        keeper: {
          enabled: true,
          network: protocol === 'aave' ? 'chainlink' : 'gelato',
          gasOptimization: true,
          profitabilityThreshold: this.generateAmount(50, 500)
        },
        
        mev: {
          protection: this.generateAvailability(0.80),
          extraction: this.generateMEVData(),
          frontrunning: this.generateFrontrunningData()
        }
      },
      
      timestamp: Date.now(),
      dataFreshness: this.generateLatency(30, 180) // seconds
    }
  }

  /**
   * Get collateral configurations and ratios
   * In production, this would come from risk management systems
   */
  async getCollateralConfigurations(protocol = 'aave') {
    await this.simulateNetworkDelay(350, 750)
    
    const generateCollateralConfig = (asset) => ({
      asset,
      enabled: this.isCollateralEnabled(asset),
      
      ratios: {
        loanToValue: this.generateLTV(asset),
        liquidationThreshold: this.generateLiquidationThreshold(asset),
        liquidationBonus: this.generateLiquidationBonus(asset),
        optimalLTV: this.generateOptimalLTV(asset)
      },
      
      riskParameters: {
        volatilityScore: this.generateVolatilityScore(asset),
        liquidityScore: this.generateLiquidityScore(asset),
        marketCapScore: this.generateMarketCapScore(asset),
        compositeRiskScore: 0 // Will be calculated
      },
      
      limits: {
        supplyCap: this.generateCap(asset, 'supply'),
        borrowCap: this.generateCap(asset, 'borrow'),
        isolationMode: this.isIsolatedAsset(asset),
        debtCeiling: this.generateDebtCeiling(asset)
      },
      
      pricing: {
        priceOracle: this.getPriceSource(asset),
        currentPrice: this.generatePrice(asset),
        priceImpact: this.generatePriceImpact(asset),
        confidenceInterval: this.generateConfidenceInterval()
      },
      
      utilization: {
        currentSupply: this.generateUtilization(asset, 'supply'),
        currentBorrow: this.generateUtilization(asset, 'borrow'),
        utilizationRate: 0, // Will be calculated
        optimalUtilization: this.generateOptimalUtilization(asset)
      },
      
      history: {
        rateHistory: this.generateRateHistory(this.baseRates.supply[asset] || 3.0, 90),
        utilizationHistory: this.generateUtilizationHistory(90),
        liquidationHistory: this.generateLiquidationHistory(asset, 30)
      }
    })

    const collateralAssets = {}
    const supportedAssets = ['ETH', 'WBTC', 'LINK', 'UNI', 'AAVE', 'USDC', 'USDT', 'DAI']
    
    supportedAssets.forEach(asset => {
      collateralAssets[asset] = generateCollateralConfig(asset)
      
      // Calculate composite scores
      const config = collateralAssets[asset]
      config.riskParameters.compositeRiskScore = 
        (config.riskParameters.volatilityScore + 
         config.riskParameters.liquidityScore + 
         config.riskParameters.marketCapScore) / 3
      
      if (config.utilization.currentSupply > 0) {
        config.utilization.utilizationRate = 
          config.utilization.currentBorrow / config.utilization.currentSupply * 100
      }
    })

    return {
      protocol,
      collateralAssets,
      
      globalRisk: {
        systemUtilization: this.calculateSystemUtilization(collateralAssets),
        diversificationScore: this.generateDiversificationScore(),
        correlationMatrix: this.generateCorrelationMatrix(supportedAssets),
        concentrationRisk: this.generateConcentrationRisk(collateralAssets)
      },
      
      riskManagement: {
        pauseGuardian: {
          enabled: true,
          pauseThreshold: this.generatePercentage(90, 98),
          emergencyPause: false,
          lastAction: Date.now() - Math.random() * 2592000000 // Within last 30 days
        },
        
        rateLimiting: {
          enabled: true,
          maxBorrowIncrease: this.generatePercentage(10, 50), // per hour
          maxSupplyIncrease: this.generatePercentage(20, 100),
          cooldownPeriod: this.generateInterval(3600000, 86400000) // 1-24 hours
        },
        
        governance: {
          proposalThreshold: this.generateAmount(100000, 1000000),
          votingDelay: this.generateNumber(1, 3), // days
          votingPeriod: this.generateNumber(5, 10), // days
          quorum: this.generatePercentage(4, 15)
        }
      },
      
      monitoring: {
        alerts: {
          highUtilization: this.generatePercentage(85, 95),
          liquidationRisk: this.generatePercentage(80, 90),
          priceDeviations: this.generatePercentage(5, 15),
          oracleFailure: true
        },
        
        dashboards: [
          'risk_metrics',
          'utilization_rates',
          'liquidation_queue',
          'oracle_prices'
        ],
        
        automation: {
          riskScoreUpdates: '1 hour',
          utilizationChecks: '5 minutes',
          priceUpdates: 'real-time',
          governanceProposals: 'on-demand'
        }
      },
      
      timestamp: Date.now(),
      confidence: this.generatePercentage(90, 98)
    }
  }

  /**
   * Helper methods for generating realistic lending data
   */
  
  generateDynamicRate(baseRate, volatility) {
    const variation = (Math.random() - 0.5) * volatility * 2
    return Math.max(0.1, Math.round((baseRate + variation) * 100) / 100)
  }

  generateRateHistory(baseRate, days) {
    const history = []
    for (let i = days; i >= 0; i--) {
      history.push({
        date: Date.now() - (i * 86400000),
        rate: this.generateDynamicRate(baseRate, 0.3)
      })
    }
    return history
  }

  generateLiquidity(asset, type) {
    const baseLiquidity = {
      USDC: type === 'supply' ? 500000000 : 300000000,
      USDT: type === 'supply' ? 400000000 : 250000000,
      DAI: type === 'supply' ? 300000000 : 200000000,
      ETH: type === 'supply' ? 200000 : 120000,
      WBTC: type === 'supply' ? 8000 : 4800,
      LINK: type === 'supply' ? 50000000 : 30000000,
      flash: type === 'flash' ? 100000000 : 50000000
    }
    
    const base = baseLiquidity[asset] || 10000000
    return Math.floor(base * (0.7 + Math.random() * 0.6))
  }

  generatePrice(asset) {
    const basePrices = {
      USDC: 1.0, USDT: 1.0, DAI: 1.0,
      ETH: 2680, WBTC: 43250, LINK: 14.80,
      UNI: 6.90, AAVE: 85.40
    }
    
    const base = basePrices[asset] || 100
    return Math.round(base * (0.98 + Math.random() * 0.04) * 100) / 100
  }

  isCollateralEnabled(asset) {
    const stablecoins = ['USDC', 'USDT', 'DAI']
    return !stablecoins.includes(asset) || Math.random() > 0.3
  }

  generateLTV(asset) {
    const ltvRanges = {
      ETH: [75, 85], WBTC: [70, 80], LINK: [65, 75],
      UNI: [60, 70], AAVE: [60, 70], USDC: [85, 92],
      USDT: [82, 90], DAI: [85, 92]
    }
    
    const range = ltvRanges[asset] || [50, 70]
    return this.generatePercentage(range[0], range[1])
  }

  generateLiquidationThreshold(asset) {
    const ltv = this.generateLTV(asset)
    return Math.min(95, ltv + this.generatePercentage(2, 8))
  }

  generateLiquidationBonus(asset) {
    const bonusRanges = {
      ETH: [5, 8], WBTC: [6, 9], LINK: [8, 12],
      UNI: [10, 15], AAVE: [8, 12], USDC: [4, 6],
      USDT: [4, 6], DAI: [4, 6]
    }
    
    const range = bonusRanges[asset] || [6, 10]
    return this.generatePercentage(range[0], range[1])
  }

  generateReserveFactor(asset) {
    return this.generatePercentage(10, 35)
  }

  generateCap(asset, type) {
    const multiplier = type === 'supply' ? 1 : 0.6
    const baseAmounts = {
      USDC: 1000000000, USDT: 800000000, DAI: 600000000,
      ETH: 500000, WBTC: 20000, LINK: 100000000
    }
    
    const base = baseAmounts[asset] || 50000000
    return Math.floor(base * multiplier * (0.8 + Math.random() * 0.4))
  }

  isIsolatedAsset(asset) {
    const isolatedAssets = ['UNI', 'LINK']
    return isolatedAssets.includes(asset) && Math.random() > 0.3
  }

  isSiloedAsset(asset) {
    return Math.random() > 0.85 // 15% chance
  }

  getPriceSource(asset) {
    const sources = {
      ETH: 'chainlink_eth_usd',
      WBTC: 'chainlink_btc_usd',
      USDC: 'fixed_1_usd',
      USDT: 'chainlink_usdt_usd',
      DAI: 'chainlink_dai_usd',
      LINK: 'chainlink_link_usd'
    }
    return sources[asset] || 'chainlink_oracle'
  }

  generateHeartbeat(asset) {
    const stablecoins = ['USDC', 'USDT', 'DAI']
    return stablecoins.includes(asset) ? 
      this.generateInterval(3600, 86400) : // 1-24 hours for stablecoins
      this.generateInterval(300, 1800) // 5-30 minutes for volatile assets
  }

  generateDeviation() {
    return this.generatePercentage(0.1, 2.0)
  }

  generateVersion() {
    const major = Math.floor(Math.random() * 3) + 1
    const minor = Math.floor(Math.random() * 10)
    const patch = Math.floor(Math.random() * 20)
    return `v${major}.${minor}.${patch}`
  }

  generateProtocolFees(protocol) {
    return {
      flashLoanFee: protocol === 'aave' ? 0.09 : 0.05, // 9 or 5 bps
      originationFee: this.generatePercentage(0, 0.25),
      liquidationFee: this.generatePercentage(0.5, 3.0),
      protocolFee: this.generatePercentage(10, 30) // % of interest
    }
  }

  getGovernanceInfo(protocol) {
    const governance = {
      aave: { token: 'AAVE', dao: 'Aave DAO', proposal: 'AIP' },
      compound: { token: 'COMP', dao: 'Compound DAO', proposal: 'CIP' },
      makerdao: { token: 'MKR', dao: 'Maker DAO', proposal: 'MIP' }
    }
    return governance[protocol] || { token: 'GOV', dao: 'Protocol DAO', proposal: 'PIP' }
  }

  generateHealthFactor() {
    return Math.round((1.5 + Math.random() * 2) * 100) / 100
  }

  generateLiquidationsData() {
    return {
      count: this.generateNumber(10, 200),
      totalValue: this.generateAmount(1000000, 50000000),
      averageSize: this.generateAmount(5000, 250000),
      gasUsed: this.generateGasAmount(200000, 800000)
    }
  }

  generateBadDebtData() {
    return {
      totalBadDebt: this.generateAmount(0, 5000000),
      badDebtRatio: this.generatePercentage(0, 0.5),
      recoveryRate: this.generatePercentage(60, 90),
      writeOffs: this.generateAmount(0, 1000000)
    }
  }

  generateConcentrationRisk(pools) {
    return {
      topAssetShare: this.generatePercentage(30, 60),
      herfindahlIndex: this.generatePercentage(20, 40),
      riskScore: this.generateScore(1, 10)
    }
  }

  getSmartContractRisk(protocol) {
    return {
      auditScore: this.generateScore(8, 10),
      timeInProduction: this.generateNumber(500, 2000), // days
      totalValueSecured: this.generateAmount(1000000000, 50000000000),
      bugBountyProgram: true,
      lastAudit: Date.now() - Math.random() * 15552000000 // Within last 6 months
    }
  }

  generateFlashLoanCap(asset) {
    const caps = {
      USDC: 100000000, USDT: 80000000, DAI: 50000000,
      ETH: 100000, WBTC: 2000
    }
    return caps[asset] || 10000000
  }

  generateFlashLoanFee(asset, protocol) {
    const baseFees = { aave: 0.09, compound: 0.05, dydx: 0.02 }
    return baseFees[protocol] || 0.05
  }

  generatePremiumRate(protocol) {
    return this.generatePercentage(0.05, 0.15)
  }

  generateContractAddress() {
    return '0x' + Math.random().toString(16).substring(2, 42).padStart(40, '0')
  }

  generateGasLimit() {
    return this.generateNumber(300000, 2000000)
  }

  generateGasPrice(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  generateReservedAmount(asset) {
    return this.generateLiquidity(asset, 'reserve') * 0.1
  }

  generateVolume(prefix, base) {
    return Math.floor(base * (0.5 + Math.random()))
  }

  generateRevenue() {
    return this.generateAmount(10000, 500000)
  }

  generateIndex() {
    return 1 + Math.random() * 0.5 // 1.0 - 1.5
  }

  generateBlockNumber(network) {
    const baseBlocks = { ethereum: 19000000, polygon: 52000000, arbitrum: 180000000 }
    const base = baseBlocks[network] || 10000000
    return base + this.generateNumber(0, 100000)
  }

  generateInterval(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  generatePercentage(min, max) {
    return Math.round((min + Math.random() * (max - min)) * 100) / 100
  }

  generateNumber(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  generateAmount(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  generateLatency(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  generateGasAmount(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  generateAvailability(baseRate) {
    return Math.random() < baseRate
  }

  generateScore(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  getTrend() {
    const trends = ['up', 'down', 'stable', 'volatile']
    return trends[Math.floor(Math.random() * trends.length)]
  }

  // Additional helper methods for complex data generation
  generateLiquidationOpportunities() {
    return Array.from({length: this.generateNumber(5, 50)}, () => ({
      user: this.generateContractAddress(),
      healthFactor: Math.round((0.8 + Math.random() * 0.3) * 1000) / 1000,
      collateralValue: this.generateAmount(5000, 500000),
      debtValue: this.generateAmount(3000, 400000),
      liquidationBonus: this.generatePercentage(5, 15)
    }))
  }

  generateAssetDistribution() {
    return {
      ETH: this.generatePercentage(30, 50),
      WBTC: this.generatePercentage(20, 35),
      USDC: this.generatePercentage(10, 25),
      Other: this.generatePercentage(5, 15)
    }
  }

  generateCollateralDistribution() {
    return {
      'Single Asset': this.generatePercentage(60, 80),
      'Multi Asset': this.generatePercentage(20, 40)
    }
  }

  generateSeasonality() {
    return Array.from({length: 12}, (_, i) => ({
      month: i + 1,
      liquidationIndex: this.generatePercentage(80, 120)
    }))
  }

  generateCorrelation() {
    return Math.round((Math.random() * 2 - 1) * 100) / 100
  }

  generateTopLiquidators() {
    return Array.from({length: 10}, (_, i) => ({
      rank: i + 1,
      address: this.generateContractAddress(),
      volume24h: this.generateAmount(100000, 10000000),
      successRate: this.generatePercentage(70, 95),
      avgGasPrice: this.generateGasPrice(20, 200)
    }))
  }

  generateCompetitiveness() {
    return {
      averageCompetitors: this.generateNumber(3, 15),
      medianResponseTime: this.generateLatency(1000, 10000),
      mevExtraction: this.generatePercentage(20, 60)
    }
  }

  generateRiskLevel() {
    const levels = ['low', 'medium', 'high', 'critical']
    return levels[Math.floor(Math.random() * levels.length)]
  }

  generateCorrelationRisk() {
    return {
      ethBtcCorrelation: this.generateCorrelation(),
      stablecoinCorrelation: this.generateCorrelation(),
      defiTokenCorrelation: this.generateCorrelation()
    }
  }

  generateSystemicRisk() {
    return {
      contagionRisk: this.generateRiskLevel(),
      liquidityCrisis: this.generatePercentage(5, 25),
      marketCrash: this.generatePercentage(10, 40)
    }
  }

  generateStressTestResults(shockPercent) {
    return {
      shockPercent,
      liquidationsTriggered: this.generatePercentage(20, 80),
      badDebtGenerated: this.generateAmount(0, 50000000),
      systemStability: this.generateRiskLevel()
    }
  }

  generateLiquidityCrunch() {
    return {
      withdrawalPressure: this.generatePercentage(10, 50),
      utilizationSpike: this.generatePercentage(85, 98),
      rateSensitivity: this.generatePercentage(20, 80)
    }
  }

  generateGasSpike() {
    return {
      gasPriceMultiplier: this.generateNumber(2, 20),
      liquidationProfitability: this.generatePercentage(30, 90),
      networkCongestion: this.generatePercentage(60, 95)
    }
  }

  generateMEVData() {
    return {
      extractionRate: this.generatePercentage(10, 40),
      averageExtraction: this.generateAmount(50, 2000),
      protectionRate: this.generatePercentage(60, 85)
    }
  }

  generateFrontrunningData() {
    return {
      frontrunAttempts: this.generateNumber(100, 2000),
      successRate: this.generatePercentage(20, 60),
      averageMEV: this.generateAmount(10, 500)
    }
  }

  /**
   * Get all lending pool data in one call - REAL TIME ONLY
   * NO CACHING - always fresh data
   */
  async getAllLendingPoolData(protocol = 'aave', network = 'ethereum') {
    const [pools, flashLoans, liquidations, collateral] = await Promise.all([
      this.getLendingPoolConfigurations(protocol, network),
      this.getFlashLoanConfigurations(protocol),
      this.getLiquidationConfigurations(protocol),
      this.getCollateralConfigurations(protocol)
    ])

    return {
      pools,
      flashLoans,
      liquidations,
      collateral,
      timestamp: Date.now()
    }
  }

  /**
   * Simulate realistic network delay for API calls
   */
  async simulateNetworkDelay(minMs = 300, maxMs = 700) {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check method
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(100, 300)
      
      if (Math.random() < 0.005) {
        throw new Error('Lending pool provider temporarily unavailable')
      }
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        latency: Math.random() * 400 + 200,
        supportedProtocols: ['aave', 'compound', 'makerdao', 'euler'],
        supportedNetworks: ['ethereum', 'polygon', 'arbitrum', 'avalanche'],
        supportedAssets: Object.keys(this.baseRates.supply).length,
        dataTypes: ['pools', 'flash_loans', 'liquidations', 'collateral'],
        flashLoanEnabled: true,
        liquidationMonitoring: true,
        riskManagement: true,
        lastRateUpdate: Date.now() - Math.random() * 300000
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
export const mockupLendingPoolProviderService = new MockupLendingPoolProviderService()

// Export class for testing
export default MockupLendingPoolProviderService