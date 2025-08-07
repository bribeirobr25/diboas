/**
 * Mockup Asset Metadata Provider Service
 * Simulates 3rd party asset metadata APIs with realistic response times
 * This will be replaced with real financial data provider integrations (CoinGecko, Bloomberg, etc.)
 */

import logger from '../../utils/logger.js'

export class MockupAssetMetadataProviderService {
  constructor() {
    // NO caching per requirements - always real-time data
  }

  /**
   * Get comprehensive asset metadata
   * In production, this would come from financial data providers
   */
  async getAssetMetadata() {
    await this.simulateNetworkDelay(300, 800)
    
    // Simulate market data variations
    const marketVariation = () => (0.95 + Math.random() * 0.1) // 95%-105% variation

    return {
      BTC: {
        id: 'bitcoin',
        symbol: 'BTC',
        name: 'Bitcoin',
        description: 'The first and most well-known cryptocurrency, created by Satoshi Nakamoto.',
        category: 'cryptocurrency',
        website: 'https://bitcoin.org',
        whitepaper: 'https://bitcoin.org/bitcoin.pdf',
        blockchain: {
          name: 'Bitcoin',
          consensusAlgorithm: 'Proof of Work',
          blockTime: 600, // seconds
          confirmations: 6
        },
        supply: {
          totalSupply: 21000000,
          circulatingSupply: Math.round(19700000 * marketVariation()),
          maxSupply: 21000000
        },
        marketData: {
          marketCap: Math.round(1850000000000 * marketVariation()),
          volume24h: Math.round(32000000000 * marketVariation()),
          dominance: Math.round(42 * marketVariation()),
          rank: 1
        },
        technicalData: {
          hashrate: '450 EH/s',
          difficulty: '62.46T',
          networkSecurity: 'Highest',
          scalability: 'Limited (7 TPS)'
        },
        riskMetrics: {
          volatilityIndex: 65,
          liquidityScore: 95,
          regulatoryRisk: 'Medium',
          technicalRisk: 'Low'
        }
      },
      ETH: {
        id: 'ethereum',
        symbol: 'ETH',
        name: 'Ethereum',
        description: 'A decentralized platform for smart contracts and decentralized applications.',
        category: 'smart-contract-platform',
        website: 'https://ethereum.org',
        whitepaper: 'https://ethereum.org/en/whitepaper/',
        blockchain: {
          name: 'Ethereum',
          consensusAlgorithm: 'Proof of Stake',
          blockTime: 12, // seconds
          confirmations: 12
        },
        supply: {
          totalSupply: Math.round(120280000 * marketVariation()),
          circulatingSupply: Math.round(120280000 * marketVariation()),
          maxSupply: null // No max supply
        },
        marketData: {
          marketCap: Math.round(390000000000 * marketVariation()),
          volume24h: Math.round(15000000000 * marketVariation()),
          dominance: Math.round(18 * marketVariation()),
          rank: 2
        },
        technicalData: {
          gasPrice: '15 Gwei',
          tps: '15 TPS',
          networkSecurity: 'High',
          scalability: 'Layer 2 solutions'
        },
        riskMetrics: {
          volatilityIndex: 70,
          liquidityScore: 90,
          regulatoryRisk: 'Medium',
          technicalRisk: 'Low'
        }
      },
      SOL: {
        id: 'solana',
        symbol: 'SOL',
        name: 'Solana',
        description: 'A high-performance blockchain supporting builders around the world creating crypto apps.',
        category: 'smart-contract-platform',
        website: 'https://solana.com',
        whitepaper: 'https://solana.com/solana-whitepaper.pdf',
        blockchain: {
          name: 'Solana',
          consensusAlgorithm: 'Proof of History + Proof of Stake',
          blockTime: 0.4, // seconds
          confirmations: 32
        },
        supply: {
          totalSupply: Math.round(460000000 * marketVariation()),
          circulatingSupply: Math.round(460000000 * marketVariation()),
          maxSupply: null
        },
        marketData: {
          marketCap: Math.round(45000000000 * marketVariation()),
          volume24h: Math.round(2500000000 * marketVariation()),
          dominance: Math.round(2 * marketVariation()),
          rank: 5
        },
        technicalData: {
          tps: '65,000 TPS',
          networkSecurity: 'Medium-High',
          scalability: 'Native high throughput'
        },
        riskMetrics: {
          volatilityIndex: 85,
          liquidityScore: 80,
          regulatoryRisk: 'Medium',
          technicalRisk: 'Medium'
        }
      },
      SUI: {
        id: 'sui',
        symbol: 'SUI',
        name: 'Sui',
        description: 'A next-generation smart contract platform with high throughput, low latency, and an asset-oriented programming model.',
        category: 'smart-contract-platform',
        website: 'https://sui.io',
        whitepaper: 'https://github.com/MystenLabs/sui/blob/main/doc/paper/sui.pdf',
        blockchain: {
          name: 'Sui',
          consensusAlgorithm: 'Delegated Proof of Stake',
          blockTime: 2.5, // seconds
          confirmations: 10
        },
        supply: {
          totalSupply: Math.round(10000000000 * marketVariation()),
          circulatingSupply: Math.round(2900000000 * marketVariation()),
          maxSupply: 10000000000
        },
        marketData: {
          marketCap: Math.round(12000000000 * marketVariation()),
          volume24h: Math.round(800000000 * marketVariation()),
          dominance: Math.round(0.5 * marketVariation()),
          rank: 18
        },
        technicalData: {
          tps: '120,000 TPS',
          networkSecurity: 'Medium',
          scalability: 'Parallel execution'
        },
        riskMetrics: {
          volatilityIndex: 95,
          liquidityScore: 65,
          regulatoryRisk: 'Low-Medium',
          technicalRisk: 'Medium-High'
        }
      },
      // Stablecoins and tokenized assets
      USDC: {
        id: 'usd-coin',
        symbol: 'USDC',
        name: 'USD Coin',
        description: 'A fully collateralized US dollar stablecoin.',
        category: 'stablecoin',
        website: 'https://www.centre.io',
        blockchain: {
          name: 'Multi-chain',
          consensusAlgorithm: 'Various',
          blockTime: 'Variable',
          confirmations: 'Variable'
        },
        supply: {
          totalSupply: Math.round(25000000000 * marketVariation()),
          circulatingSupply: Math.round(25000000000 * marketVariation()),
          maxSupply: null
        },
        marketData: {
          marketCap: Math.round(25000000000 * marketVariation()),
          volume24h: Math.round(5000000000 * marketVariation()),
          dominance: Math.round(1 * marketVariation()),
          rank: 6
        },
        riskMetrics: {
          volatilityIndex: 5,
          liquidityScore: 98,
          regulatoryRisk: 'Low',
          technicalRisk: 'Low'
        }
      },
      // Tokenized Gold
      PAXG: {
        id: 'pax-gold',
        symbol: 'PAXG',
        name: 'PAX Gold',
        description: 'A gold-backed token where each token represents one fine troy ounce of gold.',
        category: 'tokenized-commodity',
        website: 'https://paxos.com/paxgold/',
        blockchain: {
          name: 'Ethereum',
          consensusAlgorithm: 'Proof of Stake',
          blockTime: 12,
          confirmations: 12
        },
        supply: {
          totalSupply: Math.round(235000 * marketVariation()),
          circulatingSupply: Math.round(235000 * marketVariation()),
          maxSupply: null
        },
        marketData: {
          marketCap: Math.round(630000000 * marketVariation()),
          volume24h: Math.round(25000000 * marketVariation()),
          dominance: Math.round(0.03 * marketVariation()),
          rank: 87
        },
        riskMetrics: {
          volatilityIndex: 25,
          liquidityScore: 75,
          regulatoryRisk: 'Low',
          technicalRisk: 'Low'
        }
      }
    }
  }

  /**
   * Get asset by ID
   */
  async getAssetMetadataById(assetId) {
    await this.simulateNetworkDelay(100, 300)
    
    const allAssets = await this.getAssetMetadata()
    return allAssets[assetId.toUpperCase()]
  }

  /**
   * Get assets by category
   */
  async getAssetsByCategory(category) {
    await this.simulateNetworkDelay(200, 500)
    
    const allAssets = await this.getAssetMetadata()
    return Object.values(allAssets).filter(asset => asset.category === category)
  }

  /**
   * Get trending assets based on volume and price movement
   */
  async getTrendingAssets(limit = 10) {
    await this.simulateNetworkDelay(300, 700)
    
    const allAssets = await this.getAssetMetadata()
    
    // Sort by a combination of volume and market cap
    return Object.values(allAssets)
      .sort((a, b) => {
        const scoreA = (a.marketData.volume24h * 0.3) + (a.marketData.marketCap * 0.7)
        const scoreB = (b.marketData.volume24h * 0.3) + (b.marketData.marketCap * 0.7)
        return scoreB - scoreA
      })
      .slice(0, limit)
  }

  /**
   * Get asset risk assessments
   */
  async getAssetRiskAssessments() {
    await this.simulateNetworkDelay(400, 900)
    
    const allAssets = await this.getAssetMetadata()
    const riskAssessments = {}
    
    for (const [symbol, asset] of Object.entries(allAssets)) {
      riskAssessments[symbol] = {
        overallRisk: this.calculateOverallRisk(asset.riskMetrics),
        breakdown: asset.riskMetrics,
        recommendation: this.getRiskRecommendation(asset.riskMetrics),
        suitableForProfiles: this.getSuitableRiskProfiles(asset.riskMetrics)
      }
    }
    
    return riskAssessments
  }

  /**
   * Get market sectors and asset classifications
   */
  async getMarketSectors() {
    await this.simulateNetworkDelay(200, 600)
    
    return {
      sectors: [
        {
          id: 'cryptocurrency',
          name: 'Cryptocurrencies',
          description: 'Digital currencies and store of value tokens',
          totalMarketCap: 1200000000000,
          assets: ['BTC'],
          riskLevel: 'High'
        },
        {
          id: 'smart-contract-platform',
          name: 'Smart Contract Platforms',
          description: 'Blockchain platforms supporting programmable contracts',
          totalMarketCap: 450000000000,
          assets: ['ETH', 'SOL', 'SUI'],
          riskLevel: 'High'
        },
        {
          id: 'stablecoin',
          name: 'Stablecoins',
          description: 'Price-stable digital assets pegged to fiat currencies',
          totalMarketCap: 130000000000,
          assets: ['USDC'],
          riskLevel: 'Low'
        },
        {
          id: 'tokenized-commodity',
          name: 'Tokenized Commodities',
          description: 'Digital representations of physical commodities',
          totalMarketCap: 2000000000,
          assets: ['PAXG'],
          riskLevel: 'Medium'
        }
      ]
    }
  }

  /**
   * Get regulatory compliance data for assets
   */
  async getRegulatoryCompliance() {
    await this.simulateNetworkDelay(500, 1000)
    
    return {
      BTC: {
        securityStatus: 'Not a security',
        taxTreatment: 'Property',
        tradingRestrictions: [],
        regulatoryClarity: 'High'
      },
      ETH: {
        securityStatus: 'Not a security (post-merge)',
        taxTreatment: 'Property',
        tradingRestrictions: [],
        regulatoryClarity: 'Medium-High'
      },
      SOL: {
        securityStatus: 'Under review',
        taxTreatment: 'Property',
        tradingRestrictions: ['Limited in some jurisdictions'],
        regulatoryClarity: 'Medium'
      },
      SUI: {
        securityStatus: 'Under review',
        taxTreatment: 'Property',
        tradingRestrictions: ['New asset - monitoring'],
        regulatoryClarity: 'Low-Medium'
      },
      USDC: {
        securityStatus: 'Not a security',
        taxTreatment: 'Currency equivalent',
        tradingRestrictions: [],
        regulatoryClarity: 'High'
      },
      PAXG: {
        securityStatus: 'Commodity-backed token',
        taxTreatment: 'Commodity',
        tradingRestrictions: ['Accredited investors in some jurisdictions'],
        regulatoryClarity: 'Medium-High'
      }
    }
  }

  /**
   * Calculate overall risk score
   */
  calculateOverallRisk(riskMetrics) {
    const { volatilityIndex, liquidityScore, regulatoryRisk, technicalRisk } = riskMetrics
    
    const riskMap = {
      'Low': 1,
      'Low-Medium': 1.5,
      'Medium': 2,
      'Medium-High': 2.5,
      'High': 3
    }
    
    const regRisk = riskMap[regulatoryRisk] || 2
    const techRisk = riskMap[technicalRisk] || 2
    
    // Weighted risk calculation
    const overallRisk = (
      (volatilityIndex * 0.3) + 
      ((100 - liquidityScore) * 0.2) + 
      (regRisk * 20 * 0.3) + 
      (techRisk * 20 * 0.2)
    ) / 10
    
    if (overallRisk <= 3) return 'Low'
    if (overallRisk <= 5) return 'Low-Medium'
    if (overallRisk <= 7) return 'Medium'
    if (overallRisk <= 8.5) return 'Medium-High'
    return 'High'
  }

  /**
   * Get risk-based recommendation
   */
  getRiskRecommendation(riskMetrics) {
    const overallRisk = this.calculateOverallRisk(riskMetrics)
    
    const recommendations = {
      'Low': 'Suitable for conservative investors and capital preservation',
      'Low-Medium': 'Good for moderate investors seeking stability with growth',
      'Medium': 'Suitable for balanced investors with medium risk tolerance',
      'Medium-High': 'For experienced investors comfortable with volatility',
      'High': 'Only for aggressive investors with high risk tolerance'
    }
    
    return recommendations[overallRisk]
  }

  /**
   * Map to suitable risk profiles
   */
  getSuitableRiskProfiles(riskMetrics) {
    const overallRisk = this.calculateOverallRisk(riskMetrics)
    
    const profileMap = {
      'Low': ['ultra_conservative', 'conservative'],
      'Low-Medium': ['conservative', 'moderate'],
      'Medium': ['moderate', 'balanced'],
      'Medium-High': ['balanced', 'aggressive'],
      'High': ['aggressive']
    }
    
    return profileMap[overallRisk] || ['moderate']
  }

  /**
   * Get all asset metadata in one call - REAL TIME ONLY
   * In production, this could be a single API call or aggregated endpoint
   * NO CACHING - always fresh data
   */
  async getAllAssetMetadataData() {
    // In production, this would be a single API call or parallel calls
    const [metadata, sectors, compliance, riskAssessments] = await Promise.all([
      this.getAssetMetadata(),
      this.getMarketSectors(),
      this.getRegulatoryCompliance(),
      this.getAssetRiskAssessments()
    ])

    const allMetadataData = {
      metadata,
      sectors,
      compliance,
      riskAssessments,
      timestamp: Date.now()
    }

    return allMetadataData
  }

  /**
   * Simulate realistic network delay for API calls
   */
  async simulateNetworkDelay(minMs = 200, maxMs = 800) {
    const delay = Math.random() * (maxMs - minMs) + minMs
    await new Promise(resolve => setTimeout(resolve, delay))
  }

  /**
   * Health check method - simulates asset metadata provider availability
   */
  async healthCheck() {
    try {
      await this.simulateNetworkDelay(100, 300)
      
      // Simulate occasional provider outages (2% chance)
      if (Math.random() < 0.02) {
        throw new Error('Mockup asset metadata provider temporarily unavailable')
      }
      
      const metadata = await this.getAssetMetadata()
      
      return {
        status: 'healthy',
        timestamp: Date.now(),
        latency: Math.random() * 400 + 200, // 200-600ms
        assetCount: Object.keys(metadata).length,
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
export const mockupAssetMetadataProviderService = new MockupAssetMetadataProviderService()

// Export class for testing
export default MockupAssetMetadataProviderService